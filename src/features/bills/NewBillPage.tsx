import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billsApi } from '../../api/bills';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibleShops } from '../../hooks/useAccessibleShops';
import { ItemRow, BillItemFormState } from './ItemRow';
import { PaymentSection, PaymentItemState } from './PaymentSection';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/PageHeader';
import { Money } from '../../components/Money';
import { CatalogDrawer } from '../../components/CatalogDrawer';
import { CatalogProduct } from '../../lib/catalog/CatalogRepository';
import {
  Plus,
  CheckCircle2,
  User,
  Phone,
  Store,
  BookOpen,
  Trash2,
  Ticket,
  Check,
  Search,
  Folder,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
} from 'lucide-react';
import { CreateBillRequest, BusinessesResponse } from '../../api/types';
import { phase11Api, Customer, Coupon, InventorySettings, CouponSettings } from '../../api/phase11';

// ─── B4: Draft types and helpers ─────────────────────────────────
interface BillDraft {
  customerName: string;
  customerPhone: string;
  billDiscount: number | '';
  orderDiscountType?: 'Percentage' | 'Amount';
  orderDiscountValue?: number | '';
  negotiatedTotal: number | '';
  items: BillItemFormState[];
  payments: PaymentItemState[];
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Split';
  savedAt: string;
}

function getDraftKey(tenantID?: string | number) {
  return `billify.draft.bill.${tenantID ?? 'default'}`;
}

function saveDraft(draft: Omit<BillDraft, 'savedAt'>, tenantID?: string | number) {
  try {
    localStorage.setItem(getDraftKey(tenantID), JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
  } catch {}
}

function loadDraft(tenantID?: string | number): BillDraft | null {
  try {
    const raw = localStorage.getItem(getDraftKey(tenantID));
    if (!raw) return null;
    return JSON.parse(raw) as BillDraft;
  } catch {
    return null;
  }
}

function clearDraft(tenantID?: string | number) {
  localStorage.removeItem(getDraftKey(tenantID));
}

const EMPTY_ITEM = (defaultGst = 0, defaultDiscountMode: 'Percentage' | 'Amount' = 'Percentage'): BillItemFormState => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: '',
  qty: 1,
  price: 0,
  gstRate: defaultGst,
  discountPct: 0,
  discountType: defaultDiscountMode,
  discountValue: 0,
});

export const NewBillPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // B2: Catalog drawer state
  const [catalogDrawerOpen, setCatalogDrawerOpen] = useState(false);
  const [catalogTargetItemId, setCatalogTargetItemId] = useState<string | null>(null);

  // Load shops scoped to current user's role
  const { shops = [], defaultShop, isLoading: shopsLoading, isAdmin: userIsAdmin } = useAccessibleShops();

  // Shop selection with localStorage persistence per tenant
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  useEffect(() => {
    if (!shops || shops.length === 0) return;
    if (!userIsAdmin) {
      setSelectedShopId(defaultShop?.id || shops[0].id);
      return;
    }
    const storageKey = `billify.lastShop.${user?.tenantID || 'default'}`;
    const savedShopId = localStorage.getItem(storageKey);
    const validSaved = shops.find((s) => s.id === savedShopId);
    if (validSaved) {
      setSelectedShopId(validSaved.id);
    } else if (user?.defaultShopID && shops.find((s) => s.id === user.defaultShopID)) {
      setSelectedShopId(user.defaultShopID);
    } else {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, user?.tenantID, user?.defaultShopID, defaultShop, userIsAdmin]);

  const handleShopChange = (shopId: string) => {
    if (!userIsAdmin) return;
    setSelectedShopId(shopId);
    const storageKey = `billify.lastShop.${user?.tenantID || 'default'}`;
    localStorage.setItem(storageKey, shopId);
  };

  const currentShop = shops?.find((s) => s.id === selectedShopId) || shops?.[0];
  const isShopGstActive = currentShop?.gstEnabled !== false && !!(currentShop?.gst || (currentShop?.gstRate != null && currentShop.gstRate > 0));
  const effectiveShopGstRate = isShopGstActive ? (currentShop?.gstRate ?? (currentShop?.gst ? 18 : 0)) : 0;
  const shopDiscountMode = (currentShop?.discountMode as 'Percentage' | 'Amount') || 'Percentage';
  const shopProductSource = (currentShop?.productSource as 'Store' | 'Generic' | 'Mix') || 'Store';
  const customerRecommendEnabled = currentShop?.customerRecommendEnabled !== false;
  const customerMandatory = Boolean(currentShop?.customerMandatory);

  // Dynamic strict mode from backend endpoint
  const { data: business } = useQuery<BusinessesResponse>({
    queryKey: ['business', 'current'],
    queryFn: () => apiClient.get<BusinessesResponse>('/api/v1/businesses/current').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const isStrictMode = business?.strictBillingMode ?? false;

  // Inventory Settings & Strict Stock Mode
  const { data: inventorySettings } = useQuery<InventorySettings>({
    queryKey: ['inventorySettings'],
    queryFn: phase11Api.getInventorySettings,
  });
  const inventoryModeEnabled = inventorySettings?.inventoryModeEnabled ?? false;
  const strictStockMode = inventorySettings?.strictStockMode ?? false;

  // Coupon Settings
  const { data: couponSettings } = useQuery<CouponSettings>({
    queryKey: ['couponSettings'],
    queryFn: phase11Api.getCouponSettings,
  });
  const allowCouponStacking = couponSettings?.allowCouponStacking ?? false;

  // Coupons State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupons, setAppliedCoupons] = useState<Array<{ code: string; discount: number; coupon?: Coupon }>>([]);
  const [serverQuote, setServerQuote] = useState<{ total: number; subtotal: number; discount: number; gst: number } | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  // Customer Autocomplete State
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [showNewCustomerInline, setShowNewCustomerInline] = useState(false);
  const [customerAttemptedWithoutCustomer, setCustomerAttemptedWithoutCustomer] = useState(false);

  // B4: Load draft on mount
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draft = useMemo(() => loadDraft(user?.tenantID), [user?.tenantID]);

  const [customerName, setCustomerName] = useState(draft?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(draft?.customerPhone || '');
  const [negotiatedTotal, setNegotiatedTotal] = useState<number | ''>(draft?.negotiatedTotal ?? '');
  const [billDiscount, setBillDiscount] = useState<number | ''>(draft?.billDiscount ?? '');

  // Part 2: Order Discount Type & Value
  const [orderDiscountType, setOrderDiscountType] = useState<'Percentage' | 'Amount'>(
    draft?.orderDiscountType || shopDiscountMode
  );
  const [orderDiscountValue, setOrderDiscountValue] = useState<number | ''>(
    draft?.orderDiscountValue !== undefined ? draft.orderDiscountValue : (typeof draft?.billDiscount === 'number' ? draft.billDiscount : '')
  );

  useEffect(() => {
    if (currentShop?.discountMode && !draft?.orderDiscountType) {
      setOrderDiscountType(currentShop.discountMode);
    }
  }, [currentShop?.discountMode, draft?.orderDiscountType]);

  const [items, setItems] = useState<BillItemFormState[]>(
    draft?.items?.length ? draft.items : [EMPTY_ITEM(effectiveShopGstRate, shopDiscountMode)]
  );

  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Split'>(
    draft?.paymentMode || 'Cash'
  );
  const [payments, setPayments] = useState<PaymentItemState[]>(
    draft?.payments?.length ? draft.payments : [{ id: 'payment-1', mode: 'Cash', amount: 0 }]
  );

  // Mode switcher: Search vs Browse
  const [browseMode, setBrowseMode] = useState<'search' | 'browse'>('search');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Top fast search bar state
  const [topSearchQuery, setTopSearchQuery] = useState('');
  const [topSearchResults, setTopSearchResults] = useState<any[]>([]);
  const [topSearchOpen, setTopSearchOpen] = useState(false);
  const [topSearchIndex, setTopSearchIndex] = useState(-1);
  const topSearchRef = useRef<HTMLDivElement>(null);

  // Load product categories and catalog products for browse
  const { data: categories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: phase11Api.getCategories,
  });

  const { data: allCatalogProducts = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => phase11Api.getProducts({}),
  });

  useEffect(() => {
    if (draft && !draftLoaded) {
      setDraftLoaded(true);
      if (draft.savedAt) {
        const saved = new Date(draft.savedAt);
        const diffMins = Math.round((Date.now() - saved.getTime()) / 60000);
        toast.info(`Draft restored (saved ${diffMins < 1 ? 'just now' : `${diffMins}m ago`})`);
      }
    }
  }, [draft, draftLoaded]);

  // B4: Autosave draft
  const hasContent = useMemo(
    () => customerName || customerPhone || items.some((i) => i.itemName.trim()),
    [customerName, customerPhone, items]
  );

  useEffect(() => {
    if (!hasContent) return;
    const handler = setTimeout(() => {
      saveDraft({
        customerName,
        customerPhone,
        billDiscount,
        orderDiscountType,
        orderDiscountValue,
        negotiatedTotal,
        items,
        payments,
        paymentMode,
      }, user?.tenantID);
    }, 800);
    return () => clearTimeout(handler);
  }, [customerName, customerPhone, billDiscount, orderDiscountType, orderDiscountValue, negotiatedTotal, items, payments, paymentMode, user?.tenantID, hasContent]);

  const handleClearDraft = () => {
    clearDraft(user?.tenantID);
    setCustomerName('');
    setCustomerPhone('');
    setBillDiscount('');
    setOrderDiscountValue('');
    setNegotiatedTotal('');
    setItems([EMPTY_ITEM(effectiveShopGstRate, shopDiscountMode)]);
    setPayments([{ id: 'payment-1', mode: 'Cash', amount: 0 }]);
    setAppliedCoupons([]);
    setCouponError(null);
    setCustomerAttemptedWithoutCustomer(false);
    toast.info('Draft cleared');
  };

  const totalCouponDiscount = useMemo(
    () => appliedCoupons.reduce((sum, c) => sum + c.discount, 0),
    [appliedCoupons]
  );

  // Live Totals calculation (GST inclusive, aligned with backend calculator)
  const totals = useMemo(() => {
    let subtotal = 0;
    let itemsDiscount = 0;
    let totalGst = 0;

    items.forEach((item) => {
      const qty = item.qty || 0;
      const price = item.price || 0;
      const lineSub = qty * price;
      let discAmount = 0;
      const dType = item.discountType || shopDiscountMode;
      const dVal = item.discountValue !== undefined ? item.discountValue : (item.discountPct || 0);

      if (!isStrictMode) {
        if (dType === 'Amount') {
          discAmount = Math.min(lineSub, dVal);
        } else {
          discAmount = (lineSub * Math.min(100, dVal)) / 100;
        }
      }

      const lineEffective = Math.max(0, lineSub - discAmount);
      const itemGstRate = item.gstRate !== undefined && item.gstRate > 0 ? item.gstRate : effectiveShopGstRate;
      const taxable = itemGstRate > 0 ? (lineEffective / (1 + itemGstRate / 100)) : lineEffective;
      const gst = lineEffective - taxable;

      subtotal += lineSub;
      itemsDiscount += discAmount;
      totalGst += gst;
    });

    const subtotalAfterItems = Math.max(0, subtotal - itemsDiscount);
    let orderDiscountAmt = 0;
    if (!isStrictMode && typeof orderDiscountValue === 'number' && orderDiscountValue > 0) {
      if (orderDiscountType === 'Percentage') {
        orderDiscountAmt = Math.round(((subtotalAfterItems * Math.min(100, orderDiscountValue)) / 100) * 100) / 100;
      } else {
        orderDiscountAmt = Math.min(orderDiscountValue, subtotalAfterItems);
      }
    }

    const totalDiscountBeforeCoupons = itemsDiscount + orderDiscountAmt;
    const totalDiscount = totalDiscountBeforeCoupons + totalCouponDiscount;

    let computedTotal = Math.max(0, subtotal - totalDiscount);

    if (isStrictMode && typeof negotiatedTotal === 'number' && negotiatedTotal > 0) {
      computedTotal = negotiatedTotal;
    }

    if (serverQuote && serverQuote.total !== undefined) {
      computedTotal = serverQuote.total;
    }

    const finalGst = serverQuote && serverQuote.gst ? Math.round(serverQuote.gst * 100) / 100 : Math.round(totalGst * 100) / 100;
    const finalTotal = Math.round(computedTotal * 100) / 100;
    const taxableSubtotal = Math.max(0, Math.round((finalTotal - finalGst) * 100) / 100);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxableSubtotal,
      lineDiscounts: Math.round(itemsDiscount * 100) / 100,
      orderDiscount: Math.round(orderDiscountAmt * 100) / 100,
      couponDiscount: Math.round(totalCouponDiscount * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      gst: finalGst,
      total: finalTotal,
    };
  }, [items, orderDiscountType, orderDiscountValue, totalCouponDiscount, isStrictMode, negotiatedTotal, serverQuote, effectiveShopGstRate, shopDiscountMode]);

  // Keep single payment amount in sync with total when in single payment mode
  useEffect(() => {
    if (paymentMode !== 'Split' && payments.length === 1) {
      setPayments([{ id: payments[0].id, mode: paymentMode, amount: totals.total }]);
    }
  }, [totals.total, paymentMode]);

  // Debounced 300ms call to POST /bills/quote
  useEffect(() => {
    const shopId = selectedShopId || currentShop?.id;
    const valid = items.filter((i) => i.itemName.trim() !== '' && i.price >= 0);
    if (!shopId || valid.length === 0) {
      setServerQuote(null);
      setIsQuoting(false);
      return;
    }

    setIsQuoting(true);
    const timer = setTimeout(async () => {
      try {
        const payload: CreateBillRequest = {
          shopID: shopId,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          items: valid.map((item) => ({
            itemName: item.itemName.trim(),
            qty: item.qty,
            price: item.price,
            gstRate: item.gstRate !== undefined && item.gstRate > 0 ? item.gstRate : effectiveShopGstRate,
            discountPct: isStrictMode ? 0 : (item.discountPct || 0),
            productID: item.productId || null,
            discountType: isStrictMode ? null : (item.discountType || shopDiscountMode),
            discountValue: isStrictMode ? null : (item.discountValue !== undefined ? item.discountValue : (item.discountPct || 0)),
          })),
          negotiatedTotal: isStrictMode && typeof negotiatedTotal === 'number' ? negotiatedTotal : null,
          couponCodes: appliedCoupons.map((c) => c.code),
          orderDiscountType: isStrictMode ? null : orderDiscountType,
          orderDiscountValue: isStrictMode ? null : (typeof orderDiscountValue === 'number' ? orderDiscountValue : 0),
        };

        const quote = await billsApi.quoteBill(payload);
        const totalGstFromQuote = (quote.items || []).reduce((acc, it) => acc + (it.gstAmount || 0), 0);
        setServerQuote({
          total: quote.total,
          subtotal: quote.subtotal,
          discount: quote.discount,
          gst: totalGstFromQuote,
        });
      } catch {
        // Local calculation fallback
      } finally {
        setIsQuoting(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [items, selectedShopId, currentShop?.id, appliedCoupons, negotiatedTotal, isStrictMode, orderDiscountType, orderDiscountValue, effectiveShopGstRate, shopDiscountMode, customerName, customerPhone]);

  // Real-time debounced coupon validate as user types
  useEffect(() => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code || code.length < 3) {
      setCouponError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await phase11Api.validateCoupon({
          code,
          orderAmount: totals.subtotal,
        });
        if (!res.valid) {
          setCouponError(res.reason || 'Invalid coupon');
        } else {
          setCouponError(null);
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [couponCodeInput, totals.subtotal]);

  const handleApplyCoupon = async () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);

    if (appliedCoupons.some((c) => c.code === code)) {
      setCouponError('Coupon already applied');
      return;
    }

    if (!allowCouponStacking && appliedCoupons.length >= 1) {
      setCouponError('Coupon stacking is not allowed');
      return;
    }

    try {
      const res = await phase11Api.validateCoupon({
        code,
        orderAmount: totals.subtotal,
      });

      if (!res.valid) {
        setCouponError(res.reason || 'Invalid coupon code');
        return;
      }

      setAppliedCoupons((prev) => [
        ...prev,
        { code, discount: res.discount, coupon: res.coupon },
      ]);
      setCouponCodeInput('');
      toast.success(`Coupon ${code} applied! Saved ₹${res.discount}`);
    } catch {
      setCouponError('Failed to validate coupon');
    }
  };

  const handleRemoveCoupon = (code: string) => {
    setAppliedCoupons((prev) => prev.filter((c) => c.code !== code));
  };

  // Customer Autocomplete with limit: 5
  const handleCustomerInputChange = async (val: string, field: 'name' | 'phone') => {
    if (field === 'name') setCustomerName(val);
    else setCustomerPhone(val);
    setCustomerAttemptedWithoutCustomer(false);

    if (!customerRecommendEnabled) {
      setCustomerSuggestions([]);
      setCustomerDropdownOpen(false);
      return;
    }

    if (val.trim().length >= 2) {
      try {
        const results = await phase11Api.getCustomers({ search: val.trim(), limit: 5 });
        setCustomerSuggestions(results.slice(0, 5));
        setCustomerDropdownOpen(results.length > 0);
      } catch {
        setCustomerSuggestions([]);
      }
    } else {
      setCustomerSuggestions([]);
      setCustomerDropdownOpen(false);
    }
  };

  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerDropdownOpen(false);
    setCustomerAttemptedWithoutCustomer(false);
  };

  // Top Search Handler for Quick Adding Products
  const handleTopSearchChange = async (val: string) => {
    setTopSearchQuery(val);
    if (val.trim().length >= 2) {
      try {
        const results = await phase11Api.searchProducts({
          query: val.trim(),
          source: (shopProductSource.toLowerCase() as any) || 'mix',
          limit: 8,
        });
        setTopSearchResults(results);
        setTopSearchOpen(true);
        setTopSearchIndex(-1);
      } catch {
        try {
          const prods = await phase11Api.getProducts({ search: val.trim() });
          setTopSearchResults(prods.slice(0, 8));
          setTopSearchOpen(true);
          setTopSearchIndex(-1);
        } catch {
          setTopSearchResults([]);
        }
      }
    } else {
      setTopSearchResults([]);
      setTopSearchOpen(false);
      setTopSearchIndex(-1);
    }
  };

  const handleSelectTopProduct = (prod: any) => {
    // Check if product already exists in items
    const existingIndex = items.findIndex((i) => i.productId === prod.id || (i.itemName && i.itemName.toLowerCase() === prod.name.toLowerCase()));
    if (existingIndex >= 0) {
      handleUpdateItem(items[existingIndex].id, {
        qty: (items[existingIndex].qty || 1) + 1,
      });
      toast.success(`Incremented ${prod.name} (${items[existingIndex].qty + 1})`);
    } else {
      // Find first empty item row or append
      const emptyRow = items.find((i) => !i.itemName.trim());
      if (emptyRow) {
        handleUpdateItem(emptyRow.id, {
          productId: prod.id,
          itemName: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          price: prod.sellingPrice,
          catalogPrice: prod.sellingPrice,
          gstRate: prod.gstRate ?? effectiveShopGstRate,
          discountType: shopDiscountMode,
          discountValue: 0,
        });
      } else {
        const newItem: BillItemFormState = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: prod.id,
          itemName: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          qty: 1,
          price: prod.sellingPrice,
          catalogPrice: prod.sellingPrice,
          gstRate: prod.gstRate ?? effectiveShopGstRate,
          discountPct: 0,
          discountType: shopDiscountMode,
          discountValue: 0,
        };
        setItems((prev) => [...prev, newItem]);
      }
      toast.success(`Added ${prod.name}`);
    }

    setTopSearchQuery('');
    setTopSearchOpen(false);
  };

  const handleTopSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!topSearchOpen || topSearchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTopSearchIndex((prev) => (prev < topSearchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTopSearchIndex((prev) => (prev > 0 ? prev - 1 : topSearchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (topSearchIndex >= 0 && topSearchResults[topSearchIndex]) {
        handleSelectTopProduct(topSearchResults[topSearchIndex]);
      }
    } else if (e.key === 'Escape') {
      setTopSearchOpen(false);
    }
  };

  // Close top search on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (topSearchRef.current && !topSearchRef.current.contains(e.target as Node)) {
        setTopSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleUpdateItem = (id: string, updates: Partial<BillItemFormState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddManualItem = () => {
    setItems((prev) => [...prev, EMPTY_ITEM(effectiveShopGstRate, shopDiscountMode)]);
  };

  // Catalog Drawer handler
  const handleBrowseCatalog = useCallback((itemId: string) => {
    setCatalogTargetItemId(itemId);
    setCatalogDrawerOpen(true);
  }, []);

  const handleCatalogProductSelected = useCallback((product: CatalogProduct) => {
    if (catalogTargetItemId) {
      handleUpdateItem(catalogTargetItemId, {
        itemName: product.name,
        price: product.defaultPrice,
        gstRate: product.gstRate !== undefined && product.gstRate > 0 ? product.gstRate : effectiveShopGstRate,
        discountType: shopDiscountMode,
      });
    }
    setCatalogTargetItemId(null);
    setCatalogDrawerOpen(false);
  }, [catalogTargetItemId, effectiveShopGstRate, shopDiscountMode]);

  // Add product from browse grid
  const handleAddProductFromCatalog = (prod: any) => {
    handleSelectTopProduct(prod);
  };

  // Filter products for browse mode
  const filteredCatalogProducts = useMemo(() => {
    if (selectedCategory === 'all') return allCatalogProducts;
    return allCatalogProducts.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [allCatalogProducts, selectedCategory]);

  // Validation
  const validItems = items.filter((item) => item.itemName.trim() !== '' && item.price >= 0);
  const hasItems = validItems.length > 0;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paymentDiff = Math.abs(Math.round((totals.total - totalPaid) * 100) / 100);
  const isPaymentValid = paymentDiff <= 0.01;
  const isCustomerValid = !customerMandatory || Boolean(customerName.trim() || customerPhone.trim());

  const canGenerate =
    hasItems &&
    !isQuoting &&
    isPaymentValid &&
    (!isStrictMode || (typeof negotiatedTotal === 'number' && negotiatedTotal > 0));

  // Submit Mutation
  const createBillMutation = useMutation({
    mutationFn: async () => {
      const shopId = selectedShopId || currentShop?.id;
      if (!shopId) {
        throw new Error('Select a shop before submitting the bill.');
      }

      if (customerMandatory && !customerName.trim() && !customerPhone.trim()) {
        setCustomerAttemptedWithoutCustomer(true);
        throw new Error('Customer is required for this shop');
      }

      const payload: CreateBillRequest = {
        shopID: shopId,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        items: validItems.map((item) => ({
          itemName: item.itemName.trim(),
          qty: item.qty,
          price: item.price,
          gstRate: item.gstRate !== undefined && item.gstRate > 0 ? item.gstRate : effectiveShopGstRate,
          discountPct: isStrictMode ? 0 : (item.discountPct || 0),
          productID: item.productId || null,
          discountType: isStrictMode ? null : (item.discountType || shopDiscountMode),
          discountValue: isStrictMode ? null : (item.discountValue !== undefined ? item.discountValue : (item.discountPct || 0)),
        })),
        payments: payments.map((p) => ({
          mode: p.mode,
          amount: p.amount,
        })),
        negotiatedTotal: isStrictMode && typeof negotiatedTotal === 'number' ? negotiatedTotal : null,
        couponCodes: appliedCoupons.map((c) => c.code),
        orderDiscountType: isStrictMode ? null : orderDiscountType,
        orderDiscountValue: isStrictMode ? null : (typeof orderDiscountValue === 'number' ? orderDiscountValue : 0),
      };

      return billsApi.createBill(payload);
    },
    onSuccess: (data) => {
      clearDraft(user?.tenantID);
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success(`Bill #${data.billNumber} created successfully!`);
      navigate(`/bills/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create bill');
    },
  });

  const handleSubmitBill = () => {
    if (customerMandatory && !customerName.trim() && !customerPhone.trim()) {
      setCustomerAttemptedWithoutCustomer(true);
      toast.error('Customer is required for this shop');
      return;
    }
    createBillMutation.mutate();
  };

  // Empty state when no shops available
  if (!shopsLoading && shops.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div
          className="p-8 rounded-card border border-border shadow-card"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(229,57,53,0.1)' }}
          >
            <Store className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            No Active Shop Found
          </h3>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
            Create your first shop in settings to start generating bills.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/settings/shops/new')}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Your First Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title="New Bill"
          subtitle={currentShop?.name ? `Checkout terminal — ${currentShop.name}` : 'Checkout terminal'}
          showBack
          backTo="/bills"
        />
        {hasContent && (
          <button
            type="button"
            onClick={handleClearDraft}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors px-2 py-1 rounded-button hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Draft
          </button>
        )}
      </div>

      {/* Shop Selector */}
      {userIsAdmin && shops.length > 1 ? (
        <Card className="border-border shadow-card p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
                <Store className="w-3.5 h-3.5 mr-1" /> Active Billing Shop
              </label>
              <p className="text-xs text-text-muted mt-0.5">
                Bills will be sequenced and recorded under this shop
              </p>
            </div>
            <div className="w-full sm:w-72">
              <select
                id="shop-selector"
                value={selectedShopId}
                onChange={(e) => handleShopChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-button text-xs font-bold focus:border-primary focus:outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.mobile ? `(${s.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      ) : currentShop ? (
        <Card className="border-border shadow-card p-3 mb-4">
          <div className="flex items-center gap-2.5 text-xs">
            <Store className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <div>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentShop.name}
              </span>
              {!userIsAdmin && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                  style={{ backgroundColor: 'rgba(229,57,53,0.1)', color: 'var(--primary)' }}
                >
                  Assigned shop
                </span>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Customer + Products + Line Items: 60% on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Part 4: Customer Details Card */}
          <Card
            className={`border shadow-card p-4 relative transition-colors ${
              customerAttemptedWithoutCustomer && customerMandatory && !customerName.trim() && !customerPhone.trim()
                ? 'border-red-500 ring-1 ring-red-500'
                : 'border-border'
            }`}
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-text-muted" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Customer {customerMandatory ? '(Required)' : '(Optional)'}
                </h3>
                {customerMandatory && (
                  <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-1.5 py-0.5 rounded">
                    * Required
                  </span>
                )}
              </div>
              <button
                type="button"
                id="add-new-customer-inline-btn"
                onClick={() => setShowNewCustomerInline(!showNewCustomerInline)}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New Customer
              </button>
            </div>

            {showNewCustomerInline && (
              <div className="mb-3 p-3 rounded-lg bg-primary-soft/30 border border-primary/20 space-y-2 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-bold text-text-primary">
                  <span>Quick Add Customer</span>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerInline(false)}
                    className="text-text-muted hover:text-text-primary text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    id="inline-customer-name"
                    placeholder="New Customer Name"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setCustomerAttemptedWithoutCustomer(false);
                    }}
                  />
                  <Input
                    id="inline-customer-phone"
                    placeholder="10-digit Phone"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setCustomerAttemptedWithoutCustomer(false);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
              <div className="relative">
                <Input
                  id="customer-autocomplete-input"
                  data-testid="customer-name-field"
                  placeholder={customerMandatory ? "Customer Name *" : "Customer Name"}
                  value={customerName}
                  onChange={(e) => handleCustomerInputChange(e.target.value, 'name')}
                  onFocus={() => {
                    if (customerRecommendEnabled && customerSuggestions.length > 0) setCustomerDropdownOpen(true);
                  }}
                  className={customerAttemptedWithoutCustomer && !customerName.trim() ? 'border-red-500' : ''}
                />
                <input type="hidden" id="customer-name-field" value={customerName} />

                {/* Autocomplete Dropdown with limit: 5 */}
                {customerDropdownOpen && customerRecommendEnabled && customerSuggestions.length > 0 && (
                  <div
                    id="customer-suggestions-dropdown"
                    data-testid="customer-suggestions-dropdown"
                    className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border shadow-xl z-30 max-h-56 overflow-auto divide-y divide-border animate-in fade-in zoom-in-95 duration-100"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    {customerSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-primary-soft hover:text-primary transition-colors flex items-center justify-between customer-suggestion-item"
                      >
                        <div>
                          <span className="font-bold text-text-primary block">{c.name}</span>
                          <span className="text-[10px] text-text-muted">
                            {c.phone} {c.totalBills ? `• ${c.totalBills} visits` : ''}
                          </span>
                        </div>
                        <span className="text-[10px] text-primary font-semibold">Select</span>
                      </button>
                    ))}
                    <div className="p-2 border-t border-border bg-muted/20">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerDropdownOpen(false);
                          setShowNewCustomerInline(true);
                        }}
                        className="text-[11px] font-bold text-primary hover:underline block text-center w-full"
                      >
                        + Add "{customerName}" as new customer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  id="customer-phone-field"
                  data-testid="customer-phone-field"
                  placeholder="Phone Number (10 digits)"
                  inputMode="numeric"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => handleCustomerInputChange(e.target.value, 'phone')}
                  rightElement={<Phone className="w-3.5 h-3.5 text-text-muted" />}
                  className={customerAttemptedWithoutCustomer && !customerPhone.trim() ? 'border-red-500' : ''}
                />
              </div>
            </div>

            {customerAttemptedWithoutCustomer && customerMandatory && !customerName.trim() && !customerPhone.trim() && (
              <p className="text-xs text-red-500 font-semibold mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Customer selection or name/phone is required for this shop.
              </p>
            )}
          </Card>

          {/* Part 5 & 6: Mode Switcher [Search Mode] vs [Browse Catalog] */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBrowseMode('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  browseMode === 'search'
                    ? 'bg-card text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Quick Search</span>
              </button>
              <button
                type="button"
                onClick={() => setBrowseMode('browse')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  browseMode === 'browse'
                    ? 'bg-card text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Browse Categories</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const lastEmpty = [...items].reverse().find((i) => !i.itemName.trim());
                  if (lastEmpty) {
                    handleBrowseCatalog(lastEmpty.id);
                  } else {
                    const newItem = EMPTY_ITEM(effectiveShopGstRate, shopDiscountMode);
                    setItems((prev) => [...prev, newItem]);
                    setTimeout(() => handleBrowseCatalog(newItem.id), 0);
                  }
                }}
                className="text-xs font-semibold text-info hover:underline inline-flex items-center hidden sm:inline-flex"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Drawer Catalog
              </button>
              <button
                type="button"
                id="add-item-manual-btn"
                onClick={handleAddManualItem}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 px-2 py-1"
              >
                <Plus className="w-3.5 h-3.5" /> Blank Row
              </button>
            </div>
          </div>

          {/* Quick Search Bar (when in search mode) */}
          {browseMode === 'search' && (
            <div className="relative" ref={topSearchRef}>
              <div className="relative">
                <input
                  type="text"
                  id="top-fast-search-input"
                  data-testid="top-fast-search-input"
                  placeholder="Type to quick-add (e.g. Chai, Doodh, Atta, Rice, Maggi, Salt)..."
                  value={topSearchQuery}
                  onChange={(e) => handleTopSearchChange(e.target.value)}
                  onKeyDown={handleTopSearchKeyDown}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                />
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-3 pointer-events-none" />
                {topSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTopSearchQuery('');
                      setTopSearchOpen(false);
                    }}
                    className="absolute right-3 top-2.5 text-text-muted hover:text-text-primary p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {topSearchOpen && topSearchResults.length > 0 && (
                <div
                  id="top-search-dropdown"
                  data-testid="top-search-dropdown"
                  className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-auto rounded-xl border border-border shadow-xl z-40 divide-y divide-border animate-in fade-in zoom-in-95 duration-100"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  {topSearchResults.map((prod, pIdx) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectTopProduct(prod)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between ${
                        pIdx === topSearchIndex
                          ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary'
                          : 'hover:bg-primary-soft hover:text-primary'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary truncate">{prod.name}</span>
                          {prod.source && (
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                prod.source === 'store'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                              }`}
                            >
                              {prod.source}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                          <span>{prod.category}</span>
                          <span>•</span>
                          <span>SKU: {prod.sku || '—'}</span>
                          {topSearchQuery && !prod.name.toLowerCase().includes(topSearchQuery.toLowerCase()) && (
                            <span className="text-primary italic font-medium">(matches "{topSearchQuery}")</span>
                          )}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-text-primary block">₹{prod.sellingPrice}</span>
                        <span className="text-[10px] text-primary font-semibold">+ Add</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Browse Categories View (when in browse mode) */}
          {browseMode === 'browse' && (
            <div className="p-3.5 border border-border rounded-xl bg-card space-y-3">
              {/* Category selector pills */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-xs rounded-full font-bold transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-muted text-text-muted hover:text-text-primary'
                  }`}
                >
                  All Products ({allCatalogProducts.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1 text-xs rounded-full font-semibold transition-colors ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-primary text-white font-bold'
                        : 'bg-muted text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pt-1">
                {filteredCatalogProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProductFromCatalog(p)}
                    className="p-2.5 border border-border rounded-lg bg-card hover:border-primary text-left transition-all hover:shadow-xs group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-text-primary group-hover:text-primary truncate block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-text-muted">{p.category}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                      <span className="text-xs font-mono font-bold text-text-primary">₹{p.sellingPrice}</span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                        + Add
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Bill Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Line Items ({validItems.length})
              </h3>
              <span className="text-xs text-text-muted">
                Default discount: <span className="font-bold text-text-primary">{shopDiscountMode}</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  canRemove={items.length > 1}
                  isStrictMode={isStrictMode}
                  inventoryModeEnabled={inventoryModeEnabled}
                  strictStockMode={strictStockMode}
                  shopId={selectedShopId}
                  defaultDiscountMode={shopDiscountMode}
                  productSource={shopProductSource}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  onBrowseCatalog={() => handleBrowseCatalog(item.id)}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Part 7: Summary & Payment: 40% on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-card p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Order Summary
            </h3>

            {/* Part 7: Itemized List of Items & Line Totals */}
            <div className="p-3 rounded-xl border border-border bg-muted/15 space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-text-muted pb-1 border-b border-border/50">
                <span>Item</span>
                <span>Line Total</span>
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-border/30 pr-1">
                {validItems.length === 0 ? (
                  <p className="text-xs text-text-muted italic text-center py-2">No items added yet</p>
                ) : (
                  validItems.map((item) => {
                    const lineSub = (item.qty || 0) * (item.price || 0);
                    let lineDisc = 0;
                    const dType = item.discountType || shopDiscountMode;
                    const dVal = item.discountValue !== undefined ? item.discountValue : (item.discountPct || 0);
                    if (dType === 'Amount') {
                      lineDisc = Math.min(lineSub, dVal);
                    } else {
                      lineDisc = (lineSub * Math.min(100, dVal)) / 100;
                    }
                    const lineNet = Math.max(0, lineSub - lineDisc);

                    return (
                      <div key={item.id} className="flex justify-between items-center py-1.5 text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-text-primary truncate block">
                            {item.itemName}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {item.qty} × ₹{item.price}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          {lineDisc > 0 && (
                            <span className="line-through text-text-muted text-[10px] block">
                              ₹{lineSub}
                            </span>
                          )}
                          <span className="font-bold text-text-primary">
                            ₹{lineNet}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Part 3: Coupon Section with Real-Time Feedback */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border space-y-2.5" id="bill-coupon-section">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-primary" />
                  Have a coupon?
                </span>
                {allowCouponStacking && appliedCoupons.length > 0 && (
                  <button
                    type="button"
                    id="add-another-coupon-btn"
                    onClick={() => {
                      setCouponCodeInput('');
                      setCouponError(null);
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add coupon
                  </button>
                )}
              </div>

              {/* Applied Coupons List */}
              {appliedCoupons.length > 0 && (
                <div className="space-y-1.5" id="applied-coupons-list">
                  {appliedCoupons.map((c) => (
                    <div
                      key={c.code}
                      id={`applied-coupon-${c.code}`}
                      data-testid={`applied-coupon-${c.code}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs applied-coupon-row"
                    >
                      <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-800 dark:text-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{c.code}</span>
                        <span className="font-normal font-sans text-emerald-700 dark:text-emerald-400">
                          − ₹{c.discount}
                        </span>
                      </div>
                      <button
                        type="button"
                        id={`remove-coupon-${c.code}`}
                        onClick={() => handleRemoveCoupon(c.code)}
                        className="text-[11px] text-text-muted hover:text-danger ml-2 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon input & apply */}
              {(appliedCoupons.length === 0 || allowCouponStacking) && (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="coupon-code-input"
                      data-testid="coupon-code-input"
                      placeholder="Coupon code"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-mono uppercase border border-border rounded-button focus:border-primary focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                    <Button
                      type="button"
                      id="apply-coupon-btn"
                      data-testid="apply-coupon-btn"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={!couponCodeInput.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p id="coupon-error-msg" data-testid="coupon-error-msg" className="text-xs text-danger font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Part 2: Totals & Order Discount Breakdown */}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal (Gross)</span>
                <span id="summary-subtotal" className="font-semibold text-text-primary">
                  <Money value={totals.subtotal} size="sm" />
                </span>
              </div>

              {totals.lineDiscounts > 0 && (
                <div className="flex justify-between text-danger text-xs font-semibold">
                  <span>Item Discounts (−)</span>
                  <span id="summary-line-discounts">− ₹{totals.lineDiscounts}</span>
                </div>
              )}

              {/* Part 2: Order-level discount input with % / ₹ toggle */}
              {!isStrictMode && (
                <div className="flex justify-between items-center text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">Order Discount</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = orderDiscountType === 'Percentage' ? 'Amount' : 'Percentage';
                        setOrderDiscountType(next);
                      }}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-border bg-muted hover:bg-muted/80 text-text-primary"
                      title={`Toggle discount between % and ₹`}
                    >
                      {orderDiscountType === 'Percentage' ? '%' : '₹'}
                    </button>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={orderDiscountValue === 0 ? '' : orderDiscountValue}
                      onChange={(e) => {
                        const p = parseFloat(e.target.value);
                        setOrderDiscountValue(isNaN(p) ? '' : Math.max(0, p));
                      }}
                      placeholder={orderDiscountType === 'Percentage' ? '0%' : '₹0'}
                      className="w-full text-right px-2 py-1 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              )}

              {totals.orderDiscount > 0 && (
                <div className="flex justify-between text-danger text-xs font-semibold">
                  <span>Order Discount Amount (−)</span>
                  <span>− ₹{totals.orderDiscount}</span>
                </div>
              )}

              {totals.couponDiscount > 0 && (
                <div id="coupon-discount-row" className="flex justify-between text-emerald-600 text-xs font-semibold">
                  <span>Coupon Discount (−)</span>
                  <span id="summary-coupon-discount">− ₹{totals.couponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-text-muted text-xs">
                <span>Taxable Amount</span>
                <span className="font-mono text-text-primary">₹{totals.taxableSubtotal}</span>
              </div>

              <div className="flex justify-between text-text-muted text-xs">
                <span>GST (Tax)</span>
                <span id="summary-gst" className="font-mono text-text-primary">+ ₹{totals.gst}</span>
              </div>

              {isStrictMode && (
                <div className="pt-2 border-t border-border">
                  <label className="block text-xs font-bold text-primary mb-1">
                    Negotiated Final Total (Strict Mode Required)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={negotiatedTotal === 0 ? '' : negotiatedTotal}
                    onChange={(e) => setNegotiatedTotal(parseFloat(e.target.value) || 0)}
                    placeholder="Enter agreed total..."
                    className="w-full px-3 py-2 border-2 border-primary rounded-button text-base font-bold focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <div>
                  <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span className="block text-[11px] text-text-muted font-normal">Incl. all taxes</span>
                </div>
                <span id="summary-total">
                  <Money value={totals.total} size="display" className="text-primary font-black" />
                </span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="pt-4 border-t border-border">
              <PaymentSection
                total={totals.total}
                payments={payments}
                selectedMode={paymentMode}
                onModeChange={setPaymentMode}
                onPaymentsChange={setPayments}
              />
            </div>

            {/* Submit Bill Button (Desktop Only) */}
            <div className="hidden lg:block pt-3">
              <Button
                id="submit-bill-card"
                variant="primary"
                size="lg"
                className="w-full py-3.5 text-base shadow-raised font-bold"
                disabled={!canGenerate}
                isLoading={createBillMutation.isPending}
                onClick={handleSubmitBill}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Generate Bill ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
              </Button>
              {!hasItems && (
                <p className="text-xs text-center text-text-muted mt-2">
                  Add at least 1 item with price to submit
                </p>
              )}
              {hasItems && !isPaymentValid && (
                <p className="text-xs text-center text-danger font-medium mt-2">
                  Payment amount must match payable total (difference: ₹{paymentDiff})
                </p>
              )}
              {hasItems && !isCustomerValid && (
                <p className="text-xs text-center text-danger font-medium mt-2">
                  Customer details required for this shop
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Part 7: Mobile Expandable Summary Drawer */}
      {mobileSummaryOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-end animate-in fade-in duration-200">
          <div
            className="w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-5 shadow-2xl border-t border-border space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary">Order Summary Details</h3>
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-border/40">
              {validItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1.5 text-xs">
                  <span className="font-semibold text-text-primary truncate max-w-[200px]">
                    {item.itemName} × {item.qty}
                  </span>
                  <span className="font-bold text-text-primary">
                    ₹{(item.qty * item.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations breakdown */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-border">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span>₹{totals.subtotal}</span>
              </div>
              {totals.lineDiscounts > 0 && (
                <div className="flex justify-between text-danger font-semibold">
                  <span>Item Discounts</span>
                  <span>− ₹{totals.lineDiscounts}</span>
                </div>
              )}
              {totals.orderDiscount > 0 && (
                <div className="flex justify-between text-danger font-semibold">
                  <span>Order Discount</span>
                  <span>− ₹{totals.orderDiscount}</span>
                </div>
              )}
              {totals.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>− ₹{totals.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-text-muted">
                <span>Taxable Amount</span>
                <span>₹{totals.taxableSubtotal}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>GST</span>
                <span>+ ₹{totals.gst}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border text-base font-extrabold text-primary">
                <span>Total Payable</span>
                <span>₹{totals.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part 7: Mobile Sticky Bottom Action Bar (<30s Speed Checkout) */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border p-3 px-4 shadow-raised safe-bottom flex items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="text-left flex flex-col justify-center min-h-[44px]"
        >
          <span className="text-[10px] text-text-muted font-semibold flex items-center gap-1">
            {validItems.length} {validItems.length === 1 ? 'item' : 'items'} • Summary {mobileSummaryOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </span>
          <Money value={totals.total} size="md" className="font-extrabold text-primary" />
        </button>

        <Button
          id="submit-bill-mobile"
          variant="primary"
          size="md"
          className="flex-1 py-3 text-sm font-bold shadow-md min-h-[44px]"
          disabled={!canGenerate}
          isLoading={createBillMutation.isPending}
          onClick={handleSubmitBill}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Generate Bill
        </Button>
      </div>

      {/* B2: Catalog Drawer */}
      <CatalogDrawer
        isOpen={catalogDrawerOpen}
        onClose={() => {
          setCatalogDrawerOpen(false);
          setCatalogTargetItemId(null);
        }}
        onSelectProduct={handleCatalogProductSelected}
      />
    </div>
  );
};

export default NewBillPage;

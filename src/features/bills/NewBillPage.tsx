import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Plus, CheckCircle2, User, Phone, Store, BookOpen, Trash2, Ticket, Check } from 'lucide-react';
import { getApiErrorMessage } from '../../lib/errors';
import { CreateBillRequest, BusinessesResponse } from '../../api/types';
import { phase11Api, Customer, Coupon, InventorySettings, CouponSettings } from '../../api/phase11';

// ─── B4: Draft types and helpers ─────────────────────────────────
interface BillDraft {
  customerName: string;
  customerPhone: string;
  billDiscount: number | '';
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

const EMPTY_ITEM = (): BillItemFormState => ({
  id: `item-${Date.now()}`,
  itemName: '',
  qty: 1,
  price: 0,
  gstRate: 0,
  discountPct: 0,
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
    // For non-admin roles, always lock to the first accessible shop
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
    if (!userIsAdmin) return; // Manager/Staff cannot switch shops
    setSelectedShopId(shopId);
    const storageKey = `billify.lastShop.${user?.tenantID || 'default'}`;
    localStorage.setItem(storageKey, shopId);
  };

  const currentShop = shops?.find((s) => s.id === selectedShopId) || shops?.[0];

  // Dynamic strict mode from backend endpoint
  const { data: business } = useQuery<BusinessesResponse>({
    queryKey: ['business', 'current'],
    queryFn: () => apiClient.get<BusinessesResponse>('/api/v1/businesses/current').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const isStrictMode = business?.strictBillingMode ?? false;

  // Phase 11: Inventory Settings & Strict Stock Mode
  const { data: inventorySettings } = useQuery<InventorySettings>({
    queryKey: ['inventorySettings'],
    queryFn: phase11Api.getInventorySettings,
  });
  const inventoryModeEnabled = inventorySettings?.inventoryModeEnabled ?? false;
  const strictStockMode = inventorySettings?.strictStockMode ?? false;

  // Phase 11: Coupon Settings
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

  // B4: Load draft on mount
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draft = useMemo(() => loadDraft(user?.tenantID), [user?.tenantID]);

  const [customerName, setCustomerName] = useState(draft?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(draft?.customerPhone || '');
  const [negotiatedTotal, setNegotiatedTotal] = useState<number | ''>(draft?.negotiatedTotal ?? '');
  const [billDiscount, setBillDiscount] = useState<number | ''>(draft?.billDiscount ?? '');

  const [items, setItems] = useState<BillItemFormState[]>(
    draft?.items?.length ? draft.items : [EMPTY_ITEM()]
  );

  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Split'>(
    draft?.paymentMode || 'Cash'
  );
  const [payments, setPayments] = useState<PaymentItemState[]>(
    draft?.payments?.length ? draft.payments : [{ id: 'payment-1', mode: 'Cash', amount: 0 }]
  );

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

  // B4: Autosave draft on state changes (debounced-ish via useEffect)
  const hasContent = useMemo(
    () => customerName || customerPhone || items.some((i) => i.itemName.trim()),
    [customerName, customerPhone, items]
  );

  useEffect(() => {
    if (!hasContent) return;
    const handler = setTimeout(() => {
      saveDraft({ customerName, customerPhone, billDiscount, negotiatedTotal, items, payments, paymentMode }, user?.tenantID);
    }, 800);
    return () => clearTimeout(handler);
  }, [customerName, customerPhone, billDiscount, negotiatedTotal, items, payments, paymentMode, user?.tenantID, hasContent]);

  const handleClearDraft = () => {
    clearDraft(user?.tenantID);
    setCustomerName('');
    setCustomerPhone('');
    setBillDiscount('');
    setNegotiatedTotal('');
    setItems([EMPTY_ITEM()]);
    setPayments([{ id: 'payment-1', mode: 'Cash', amount: 0 }]);
    setAppliedCoupons([]);
    setCouponError(null);
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
      const discPct = isStrictMode ? 0 : (item.discountPct || 0);
      const discAmount = (price * discPct) / 100;
      const lineEffective = (price - discAmount) * qty;
      const gstRate = item.gstRate || 0;
      const taxable = lineEffective / (1 + gstRate / 100);
      const gst = lineEffective - taxable;

      subtotal += lineSub;
      itemsDiscount += discAmount * qty;
      totalGst += gst;
    });

    const extraDiscount = typeof billDiscount === 'number' ? billDiscount : 0;
    const totalDiscountBeforeCoupons = itemsDiscount + extraDiscount;
    const totalDiscount = totalDiscountBeforeCoupons + totalCouponDiscount;

    let computedTotal = Math.max(0, subtotal - totalDiscount);

    if (isStrictMode && typeof negotiatedTotal === 'number' && negotiatedTotal > 0) {
      computedTotal = negotiatedTotal;
    }

    if (serverQuote && serverQuote.total !== undefined) {
      computedTotal = serverQuote.total;
    }

    const finalGst = serverQuote ? Math.round(serverQuote.gst * 100) / 100 : Math.round(totalGst * 100) / 100;
    const finalTotal = Math.round(computedTotal * 100) / 100;
    const taxableSubtotal = Math.max(0, Math.round((finalTotal - finalGst) * 100) / 100);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxableSubtotal,
      lineDiscounts: Math.round(itemsDiscount * 100) / 100,
      couponDiscount: Math.round(totalCouponDiscount * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      gst: finalGst,
      total: finalTotal,
    };
  }, [items, billDiscount, totalCouponDiscount, isStrictMode, negotiatedTotal, serverQuote]);

  // Debounced 300ms call to POST /bills/quote on any item/GST/coupon change
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
            gstRate: item.gstRate,
            discountPct: isStrictMode ? 0 : item.discountPct || 0,
          })),
          negotiatedTotal:
            isStrictMode && typeof negotiatedTotal === 'number' ? negotiatedTotal : null,
          couponCodes: appliedCoupons.map((c) => c.code),
        };

        const quote = await billsApi.quoteBill(payload);
        const totalGstFromQuote = (quote.items || []).reduce((acc, it) => acc + (it.gstAmount || 0), 0);
        setServerQuote({
          total: quote.total,
          subtotal: quote.subtotal,
          discount: quote.discount,
          gst: totalGstFromQuote,
        });
      } catch (err) {
        // Fallback to local calculation
      } finally {
        setIsQuoting(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [items, selectedShopId, currentShop?.id, appliedCoupons, negotiatedTotal, isStrictMode]);

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

  const handleCustomerInputChange = async (val: string, field: 'name' | 'phone') => {
    if (field === 'name') setCustomerName(val);
    else setCustomerPhone(val);

    if (val.trim().length >= 2) {
      try {
        const results = await phase11Api.getCustomers({ search: val.trim() });
        setCustomerSuggestions(results);
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
  };

  const handleUpdateItem = (id: string, updates: Partial<BillItemFormState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddManualItem = () => {
    setItems((prev) => [...prev, EMPTY_ITEM()]);
  };

  // B2: Open catalog drawer — pin which item row to fill
  const handleBrowseCatalog = useCallback((itemId: string) => {
    setCatalogTargetItemId(itemId);
    setCatalogDrawerOpen(true);
  }, []);

  // B2: When product selected from catalog, auto-fill the target item row
  const handleCatalogProductSelected = useCallback((product: CatalogProduct) => {
    if (catalogTargetItemId) {
      handleUpdateItem(catalogTargetItemId, {
        itemName: product.name,
        price: product.defaultPrice,
        gstRate: product.gstRate,
      });
    }
    setCatalogTargetItemId(null);
    setCatalogDrawerOpen(false);
  }, [catalogTargetItemId]);

  // Validation
  const validItems = items.filter((item) => item.itemName.trim() !== '' && item.price >= 0);
  const hasItems = validItems.length > 0;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paymentDiff = Math.abs(Math.round((totals.total - totalPaid) * 100) / 100);
  const isPaymentValid = paymentDiff <= 0.01;

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

      const payload: CreateBillRequest = {
        shopID: shopId,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        items: validItems.map((item) => ({
          itemName: item.itemName.trim(),
          qty: item.qty,
          price: item.price,
          gstRate: item.gstRate,
          discountPct: isStrictMode ? 0 : item.discountPct || 0,
        })),
        payments: payments.map((p) => ({
          mode: p.mode,
          amount: p.amount,
        })),
        negotiatedTotal:
          isStrictMode && typeof negotiatedTotal === 'number' ? negotiatedTotal : null,
        couponCodes: appliedCoupons.map((c) => c.code),
      };

      return billsApi.createBill(payload);
    },
    onSuccess: (data) => {
      // B4: Clear draft on successful submit
      clearDraft(user?.tenantID);
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-bills'] });
      toast.success('Bill generated successfully!');
      navigate(`/bills/${data.id}`);
    },
    onError: (err: any) => {
      const isImpersonating = typeof window !== 'undefined' && Boolean(localStorage.getItem('platform_imp_backup'));
      if (isImpersonating && err?.response?.status === 500) {
        toast.error(
          'Bill creation requires a registered tenant cashier account. The backend database blocks platform impersonation tokens from signing invoices. Please log in directly as admin@apexretail.com to issue bills.',
          { duration: 7000 }
        );
        return;
      }
      toast.error(getApiErrorMessage(err));
    },
  });

  // ── Loading skeleton ──────────────────────────────────────────
  if (shopsLoading) {
    return (
      <div className="pb-28 sm:pb-8">
        <PageHeader title="New Bill" subtitle="Checkout terminal" showBack backTo="/bills" />
        <div className="space-y-3 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-button skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state — no shops yet ─────────────────────────────────
  if (shops && shops.length === 0) {
    return (
      <div className="pb-28 sm:pb-8">
        <PageHeader title="New Bill" subtitle="Checkout terminal" showBack backTo="/bills" />
        <div
          className="mt-10 flex flex-col items-center text-center p-8 rounded-card border border-dashed border-border"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <Store className="w-12 h-12 text-text-muted mb-3" />
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            You don't have a shop yet
          </h3>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
            Create your first shop to start generating bills.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/settings/shops/new')}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Your First Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 sm:pb-8">
      {/* B4: Header with Clear Draft in overflow menu */}
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

      {/* Shop Selector — dropdown for BusinessAdmin with 2+ shops, locked label otherwise */}
      {userIsAdmin && shops.length > 1 ? (
        <Card className="border-border shadow-card p-4 mb-5">
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
        /* Locked shop display for Manager/Staff or single-shop Admin */
        <Card className="border-border shadow-card p-3 mb-5">
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
        {/* Left Column (Items + Customer: 60% on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Customer Info Card */}
          <Card className="border-border shadow-card p-4 relative" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
                <User className="w-3.5 h-3.5 mr-1" /> Customer Details (Optional)
              </h3>
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
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Input
                    id="inline-customer-phone"
                    placeholder="10-digit Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
              <div className="relative">
                <Input
                  id="customer-autocomplete-input"
                  data-testid="customer-name-field"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => handleCustomerInputChange(e.target.value, 'name')}
                  onFocus={() => {
                    if (customerSuggestions.length > 0) setCustomerDropdownOpen(true);
                  }}
                />
                <input type="hidden" id="customer-name-field" value={customerName} />
                {/* Suggestions dropdown */}
                {customerDropdownOpen && customerSuggestions.length > 0 && (
                  <div
                    id="customer-suggestions-dropdown"
                    data-testid="customer-suggestions-dropdown"
                    className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border shadow-xl z-30 max-h-48 overflow-auto divide-y divide-border animate-in fade-in zoom-in-95 duration-100"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    {customerSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-primary-soft hover:text-primary transition-colors flex items-center justify-between customer-suggestion-item"
                      >
                        <span className="font-bold text-text-primary">{c.name}</span>
                        <span className="font-mono text-text-muted">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  id="customer-phone-field"
                  data-testid="customer-phone-field"
                  placeholder="Phone Number"
                  inputMode="numeric"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => handleCustomerInputChange(e.target.value, 'phone')}
                  rightElement={<Phone className="w-3.5 h-3.5 text-text-muted" />}
                />
              </div>
            </div>
          </Card>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Items ({validItems.length})
              </h3>
              <div className="flex items-center gap-2">
                {/* B2: Browse Catalog button */}
                <button
                  type="button"
                  onClick={() => {
                    const lastEmpty = [...items].reverse().find((i: BillItemFormState) => !i.itemName.trim());
                    if (lastEmpty) {
                      handleBrowseCatalog(lastEmpty.id);
                    } else {
                      const newItem = EMPTY_ITEM();
                      setItems((prev) => [...prev, newItem]);
                      setTimeout(() => handleBrowseCatalog(newItem.id), 0);
                    }
                  }}
                  className="text-xs font-semibold text-info hover:underline inline-flex items-center"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" /> Browse Catalog
                </button>
                <button
                  type="button"
                  id="add-item-manual-btn"
                  onClick={handleAddManualItem}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </button>
              </div>
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
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  onBrowseCatalog={() => handleBrowseCatalog(item.id)}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Totals + Payment: 40% on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Bill Summary & Totals */}
          <Card className="border-border shadow-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Summary & Total
            </h3>

            {/* Coupons Section */}
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
                    <p id="coupon-error-msg" data-testid="coupon-error-msg" className="text-xs text-danger font-medium mt-1.5">
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Taxable Subtotal</span>
                <span id="summary-subtotal" className="font-semibold text-text-primary">
                  <Money value={totals.taxableSubtotal} size="sm" />
                </span>
              </div>

              {totals.lineDiscounts > 0 && (
                <div className="flex justify-between text-danger text-xs font-semibold">
                  <span>Line Discounts (−)</span>
                  <span id="summary-line-discounts">− ₹{totals.lineDiscounts}</span>
                </div>
              )}

              {totals.couponDiscount > 0 && (
                <div id="coupon-discount-row" className="flex justify-between text-emerald-600 text-xs font-semibold">
                  <span>Coupon Discount (−)</span>
                  <span id="summary-coupon-discount">− ₹{totals.couponDiscount}</span>
                </div>
              )}

              {!isStrictMode && (
                <div className="flex justify-between items-center text-text-muted">
                  <span>Additional Discount</span>
                  <div className="w-24">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={billDiscount === 0 ? '' : billDiscount}
                      onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="₹0.00"
                      className="w-full text-right px-2 py-1 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              )}

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

            {/* Submit Bill Button */}
            <div className="pt-3">
              <Button
                id="submit-bill-card"
                variant="primary"
                size="lg"
                className="w-full py-3 text-base shadow-raised"
                disabled={!canGenerate}
                isLoading={createBillMutation.isPending}
                onClick={() => createBillMutation.mutate()}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit Bill ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
              </Button>
              {!hasItems && (
                <p className="text-xs text-center text-text-muted mt-2">
                  Add at least 1 item with price to submit
                </p>
              )}
              {hasItems && !isPaymentValid && (
                <p className="text-xs text-center text-danger font-medium mt-2">
                  Payment amount must match payable total
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Mobile Bottom Submit Bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border p-3 px-4 shadow-raised safe-bottom flex items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div>
          <span className="text-[11px] text-text-muted block">Total Payable</span>
          <Money value={totals.total} size="md" className="font-extrabold text-primary" />
        </div>

        <Button
          id="submit-bill-mobile"
          variant="primary"
          size="md"
          className="flex-1 py-3 text-sm shadow-md"
          disabled={!canGenerate}
          isLoading={createBillMutation.isPending}
          onClick={() => createBillMutation.mutate()}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Submit Bill
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

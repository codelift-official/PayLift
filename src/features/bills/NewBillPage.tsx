import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billsApi } from '../../api/bills';
import { shopsApi } from '../../api/shops';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { ItemRow, BillItemFormState } from './ItemRow';
import { PaymentSection, PaymentItemState } from './PaymentSection';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/PageHeader';
import { Money } from '../../components/Money';
import { CatalogDrawer } from '../../components/CatalogDrawer';
import { CatalogProduct } from '../../lib/catalog/CatalogRepository';
import { Plus, CheckCircle2, User, Phone, Store, BookOpen, Trash2 } from 'lucide-react';
import { getApiErrorMessage } from '../../lib/errors';
import { CreateBillRequest, BusinessesResponse } from '../../api/types';

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

  // Load shops for current tenant
  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
    staleTime: 60_000,
  });

  // Shop selection with localStorage persistence per tenant
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  useEffect(() => {
    if (shops && shops.length > 0) {
      const storageKey = `billify.lastShop.${user?.tenantID || 'default'}`;
      const savedShopId = localStorage.getItem(storageKey);
      const validSaved = shops.find((s) => s.id === savedShopId);

      if (validSaved) {
        setSelectedShopId(validSaved.id);
      } else {
        setSelectedShopId(shops[0].id);
      }
    }
  }, [shops, user?.tenantID]);

  const handleShopChange = (shopId: string) => {
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
    toast.info('Draft cleared');
  };

  // Live Totals calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let itemsDiscount = 0;

    items.forEach((item) => {
      const lineSub = (item.qty || 0) * (item.price || 0);
      const lineDisc = lineSub * ((item.discountPct || 0) / 100);
      subtotal += lineSub;
      itemsDiscount += lineDisc;
    });

    const extraDiscount = typeof billDiscount === 'number' ? billDiscount : 0;
    let totalDiscount = itemsDiscount + extraDiscount;

    let computedTotal = Math.max(0, subtotal - totalDiscount);

    if (isStrictMode && typeof negotiatedTotal === 'number' && negotiatedTotal > 0) {
      computedTotal = negotiatedTotal;
      totalDiscount = Math.max(0, subtotal - negotiatedTotal);
    }

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      total: Math.round(computedTotal * 100) / 100,
    };
  }, [items, billDiscount, isStrictMode, negotiatedTotal]);

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
    isPaymentValid &&
    (!isStrictMode || (typeof negotiatedTotal === 'number' && negotiatedTotal > 0));

  // Submit Mutation
  const createBillMutation = useMutation({
    mutationFn: async () => {
      if (!selectedShopId) {
        throw new Error('No active shop selected. Please check your shop configuration.');
      }

      const payload: CreateBillRequest = {
        shopID: selectedShopId,
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
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
    },
  });

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

      {/* Multi-Shop Selector */}
      {shops && shops.length > 1 && (
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Items + Customer: 60% on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Customer Info Card */}
          <Card className="border-border shadow-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center">
              <User className="w-3.5 h-3.5 mr-1" /> Customer Details (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Phone Number"
                inputMode="numeric"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                rightElement={<Phone className="w-3.5 h-3.5 text-text-muted" />}
              />
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
                    // Open drawer targeting the last empty item row
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

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <Money value={totals.subtotal} size="sm" className="font-semibold text-text-primary" />
              </div>

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

              {totals.discount > 0 && (
                <div className="flex justify-between text-danger text-xs font-semibold">
                  <span>Total Discount</span>
                  <Money value={totals.discount} size="sm" negative />
                </div>
              )}

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

              {/* B3: GST at business level — BLOCKED on backend */}
              {/* TODO: Remove GstRate from ItemRow once backend ships Businesses.GstRate field.
                  This is blocked until backend team delivers:
                  1. New field: Businesses.GstRate (nullable, float)
                  2. Migration strategy for existing bills
                  3. API endpoint: PATCH /api/v1/businesses/current with gstRate
                  See README.md: ## Blocked on Backend > B3. GST at business level */}

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Net Payable</span>
                <Money value={totals.total} size="display" className="text-primary font-black" />
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

            {/* Desktop Generate Button */}
            <div className="hidden lg:block pt-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full py-3 text-base shadow-raised"
                disabled={!canGenerate}
                isLoading={createBillMutation.isPending}
                onClick={() => createBillMutation.mutate()}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Generate Bill ({validItems.length} items)
              </Button>
              {!hasItems && (
                <p className="text-xs text-center text-text-muted mt-2">
                  Add at least 1 item with price to generate
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

      {/* Sticky Mobile Bottom Generate Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border p-3 px-4 shadow-raised safe-bottom flex items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--bg-card)' }}>
        <div>
          <span className="text-[11px] text-text-muted block">Total Payable</span>
          <Money value={totals.total} size="md" className="font-extrabold text-primary" />
        </div>

        <Button
          variant="primary"
          size="md"
          className="flex-1 py-3 text-sm shadow-md"
          disabled={!canGenerate}
          isLoading={createBillMutation.isPending}
          onClick={() => createBillMutation.mutate()}
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

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Loader2, Search, Trash2, Ticket, Check, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '../../api/returns';
import { phase11Api } from '../../api/phase11';
import { BillResponse, ExchangeBillRequest } from '../../api/types';
import { Money } from '../../components/Money';
import { toast } from 'sonner';

interface ExchangeSheetProps {
  bill: BillResponse;
  isOpen: boolean;
  onClose: () => void;
  onSwitchToReturn?: () => void;
}

interface NewItemRow {
  id: string;
  productID?: string | null;
  productName: string;
  qty: number;
  unitPrice: number;
  gstRate: number;
  discountType: 'Percentage' | 'Amount';
  discountValue: number;
}

export const ExchangeSheet: React.FC<ExchangeSheetProps> = ({
  bill,
  isOpen,
  onClose,
  onSwitchToReturn,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Tab: Return vs Exchange
  const [activeTab, setActiveTab] = useState<'return' | 'exchange'>('exchange');

  // ── Section 1: RETURN ITEMS ──
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    bill.items.forEach((item) => {
      initial[item.id] = 0;
    });
    return initial;
  });
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});

  // Prorated bill-level discount factor
  const billDiscountRatio = useMemo(() => {
    const origSub = bill.originalSubtotal && bill.originalSubtotal > 0 ? bill.originalSubtotal : bill.subtotal;
    if (origSub > 0 && bill.discount > 0) {
      return bill.discount / origSub;
    }
    return 0;
  }, [bill]);

  // Handle return qty change
  const handleReturnQtyChange = (itemId: string, delta: number, maxQty: number) => {
    setReturnQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  // Compute total return value (prorated)
  const totalReturnValue = useMemo(() => {
    let sum = 0;
    bill.items.forEach((item) => {
      const q = returnQuantities[item.id] || 0;
      if (q > 0) {
        const itemLineNet = (item.lineTotal ?? item.price * item.qty) * (1 - billDiscountRatio);
        const unitVal = itemLineNet / item.qty;
        sum += unitVal * q;
      }
    });
    return Math.round(sum * 100) / 100;
  }, [bill.items, returnQuantities, billDiscountRatio]);

  // ── Section 2: NEW ITEMS ──
  const [newItems, setNewItems] = useState<NewItemRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const handleProductSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await phase11Api.searchProducts({
          query: val.trim(),
          source: 'mix',
          limit: 8,
        });
        setSearchResults(results);
        setSearchDropdownOpen(true);
      } catch {
        try {
          const prods = await phase11Api.getProducts({ search: val.trim() });
          setSearchResults(prods.slice(0, 8));
          setSearchDropdownOpen(true);
        } catch {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setSearchDropdownOpen(false);
    }
  };

  const handleAddNewItem = (prod: any) => {
    const existing = newItems.find((ni) => ni.productID === prod.id);
    if (existing) {
      setNewItems((prev) =>
        prev.map((ni) => (ni.id === existing.id ? { ...ni, qty: ni.qty + 1 } : ni))
      );
    } else {
      setNewItems((prev) => [
        ...prev,
        {
          id: `new-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productID: prod.id,
          productName: prod.name,
          qty: 1,
          unitPrice: prod.sellingPrice,
          gstRate: prod.gstRate ?? 0,
          discountType: 'Percentage',
          discountValue: 0,
        },
      ]);
    }
    setSearchQuery('');
    setSearchDropdownOpen(false);
  };

  const handleAddManualNewItem = () => {
    setNewItems((prev) => [
      ...prev,
      {
        id: `manual-item-${Date.now()}`,
        productID: null,
        productName: '',
        qty: 1,
        unitPrice: 0,
        gstRate: 0,
        discountType: 'Percentage',
        discountValue: 0,
      },
    ]);
  };

  const handleUpdateNewItem = (id: string, updates: Partial<NewItemRow>) => {
    setNewItems((prev) => prev.map((ni) => (ni.id === id ? { ...ni, ...updates } : ni)));
  };

  const handleRemoveNewItem = (id: string) => {
    setNewItems((prev) => prev.filter((ni) => ni.id !== id));
  };

  // Compute new items subtotal
  const totalNewItemsValue = useMemo(() => {
    let sum = 0;
    newItems.forEach((ni) => {
      const lineGross = (ni.qty || 0) * (ni.unitPrice || 0);
      let disc = 0;
      if (ni.discountType === 'Amount') {
        disc = Math.min(lineGross, ni.discountValue || 0);
      } else {
        disc = (lineGross * Math.min(100, ni.discountValue || 0)) / 100;
      }
      sum += Math.max(0, lineGross - disc);
    });
    return Math.round(sum * 100) / 100;
  }, [newItems]);

  // ── Section 3: COUPON & DIFFERENCE ──
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [refundMode, setRefundMode] = useState<'Cash' | 'Original Method'>('Cash');

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    try {
      const res = await phase11Api.validateCoupon({
        code,
        orderAmount: totalNewItemsValue,
      });
      if (res.valid) {
        setAppliedCoupon(code);
        setCouponDiscount(res.discount);
        toast.success(`Coupon ${code} applied (-₹${res.discount})`);
      } else {
        setCouponError(res.reason || 'Invalid coupon');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError(null);
  };

  // Net difference calculation
  // B = totalNewItemsValue, A = totalReturnValue, C = couponDiscount
  const netDifference = useMemo(() => {
    const payable = Math.max(0, totalNewItemsValue - couponDiscount);
    return Math.round((payable - totalReturnValue) * 100) / 100;
  }, [totalNewItemsValue, totalReturnValue, couponDiscount]);

  const returnedItemsCount = Object.values(returnQuantities).reduce((a, b) => a + b, 0);

  // ── Section 4: SUBMIT MUTATION ──
  const exchangeMutation = useMutation({
    mutationFn: async () => {
      const returnItemsPayload = bill.items
        .filter((it) => (returnQuantities[it.id] || 0) > 0)
        .map((it) => ({
          billItemId: it.id,
          itemName: it.itemName,
          qty: returnQuantities[it.id],
          returnQty: returnQuantities[it.id],
          reason: returnReasons[it.id] || 'Customer exchange',
        }));

      if (returnItemsPayload.length === 0) {
        throw new Error('Please select at least one item to return');
      }
      if (newItems.length === 0 || newItems.every((ni) => !ni.productName.trim())) {
        throw new Error('Please add at least one new replacement item');
      }

      const newItemsPayload = newItems
        .filter((ni) => ni.productName.trim() !== '')
        .map((ni) => ({
          itemName: ni.productName.trim(),
          productName: ni.productName.trim(),
          productID: ni.productID || null,
          qty: ni.qty,
          price: ni.unitPrice,
          unitPrice: ni.unitPrice,
          gstRate: ni.gstRate,
          discountType: ni.discountType,
          discountValue: ni.discountValue,
        }));

      const payload: ExchangeBillRequest = {
        returnItems: returnItemsPayload,
        newItems: newItemsPayload,
        couponCodes: appliedCoupon ? [appliedCoupon] : null,
        paymentMode: netDifference > 0 ? paymentMode : null,
      };

      return returnsApi.createExchangeWithDifference(bill.id, payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bills', bill.id] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success(
        res?.newBill?.billNumber
          ? `Exchange completed! New bill #${res.newBill.billNumber} generated`
          : 'Exchange completed successfully!'
      );
      onClose();
      if (res?.exchangeBillId) {
        navigate(`/bills/${res.exchangeBillId}`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to process exchange');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="w-full sm:max-w-[680px] h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-card shadow-modal flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header with Tab switcher */}
        <div
          className="px-5 py-3 border-b border-border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">
                Return & Exchange Terminal
              </h2>
            </div>
            <p className="text-[11px] text-text-muted">
              Bill #{bill.billNumber} • Customer: {bill.customerName || 'Walk-in'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToReturn) {
                    onClose();
                    onSwitchToReturn();
                  } else {
                    setActiveTab('return');
                  }
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'return'
                    ? 'bg-card text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Return
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('exchange')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'exchange'
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Exchange
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* ── Section 1: RETURN ITEMS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                1. Return Items (Customer Giving Back)
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Return Value: -₹{totalReturnValue}
              </span>
            </div>

            <div className="border border-border rounded-xl p-3 divide-y divide-border/60 bg-muted/10 space-y-2.5">
              {bill.items.map((item) => {
                const currentQty = returnQuantities[item.id] || 0;
                const unitPrice = (item.lineTotal ?? item.price * item.qty) / item.qty;
                const proratedUnitPrice = unitPrice * (1 - billDiscountRatio);

                return (
                  <div key={item.id} className="pt-2 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {item.itemName}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          Prorated: <Money value={proratedUnitPrice} size="sm" /> • Purchased: {item.qty}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReturnQtyChange(item.id, -1, item.qty)}
                          disabled={currentQty === 0}
                          className="w-7 h-7 rounded border border-border flex items-center justify-center text-text-primary hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-text-primary">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReturnQtyChange(item.id, 1, item.qty)}
                          disabled={currentQty >= item.qty}
                          className="w-7 h-7 rounded border border-border flex items-center justify-center text-text-primary hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {currentQty > 0 && (
                      <input
                        type="text"
                        placeholder="Reason (e.g. Size mismatch, defective)"
                        value={returnReasons[item.id] || ''}
                        onChange={(e) =>
                          setReturnReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="w-full text-[11px] px-2.5 py-1 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        style={{ backgroundColor: 'var(--bg-input)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 2: NEW REPLACEMENT ITEMS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                2. New Items (Customer Taking)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddManualNewItem}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Add Custom
                </button>
                <span className="text-xs font-bold text-text-primary">
                  New Total: ₹{totalNewItemsValue}
                </span>
              </div>
            </div>

            {/* Product Search Bar */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products to exchange (e.g. Rice, Chai, Milk)..."
                  value={searchQuery}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ backgroundColor: 'var(--bg-input)' }}
                />
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {searchDropdownOpen && searchResults.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-auto rounded-lg border border-border shadow-xl z-30 divide-y divide-border"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  {searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddNewItem(prod)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-primary-soft hover:text-primary transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-text-primary block">{prod.name}</span>
                        <span className="text-[10px] text-text-muted">
                          {prod.category} • SKU: {prod.sku || '—'}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-text-primary">₹{prod.sellingPrice}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New items list */}
            {newItems.length > 0 ? (
              <div className="space-y-2">
                {newItems.map((ni) => {
                  const lineGross = (ni.qty || 0) * (ni.unitPrice || 0);
                  const disc =
                    ni.discountType === 'Amount'
                      ? Math.min(lineGross, ni.discountValue || 0)
                      : (lineGross * Math.min(100, ni.discountValue || 0)) / 100;
                  const lineNet = Math.max(0, lineGross - disc);

                  return (
                    <div
                      key={ni.id}
                      className="p-3 border border-border rounded-lg bg-card space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={ni.productName}
                          onChange={(e) => handleUpdateNewItem(ni.id, { productName: e.target.value })}
                          className="flex-1 font-bold text-text-primary border-b border-transparent focus:border-primary focus:outline-none bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewItem(ni.id)}
                          className="text-text-muted hover:text-danger p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div>
                          <label className="text-[10px] text-text-muted block">Qty</label>
                          <div className="flex items-center border border-border rounded">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateNewItem(ni.id, { qty: Math.max(1, (ni.qty || 1) - 1) })
                              }
                              className="px-1.5 py-1 text-text-muted hover:text-text-primary"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={ni.qty}
                              onChange={(e) =>
                                handleUpdateNewItem(ni.id, {
                                  qty: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="w-8 text-center font-bold bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateNewItem(ni.id, { qty: (ni.qty || 1) + 1 })}
                              className="px-1.5 py-1 text-text-muted hover:text-text-primary"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-text-muted block">Price (₹)</label>
                          <input
                            type="number"
                            value={ni.unitPrice}
                            onChange={(e) =>
                              handleUpdateNewItem(ni.id, {
                                unitPrice: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-full px-2 py-1 border border-border rounded font-bold"
                            style={{ backgroundColor: 'var(--bg-input)' }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-text-muted">Disc</label>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateNewItem(ni.id, {
                                  discountType: ni.discountType === 'Percentage' ? 'Amount' : 'Percentage',
                                })
                              }
                              className="text-[9px] font-bold px-1 rounded border border-border"
                            >
                              {ni.discountType === 'Percentage' ? '%' : '₹'}
                            </button>
                          </div>
                          <input
                            type="number"
                            placeholder="0"
                            value={ni.discountValue || ''}
                            onChange={(e) =>
                              handleUpdateNewItem(ni.id, {
                                discountValue: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-full px-2 py-1 border border-border rounded text-xs"
                            style={{ backgroundColor: 'var(--bg-input)' }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-border/50 text-[11px]">
                        <span className="text-text-muted">Line Total:</span>
                        <span className="font-bold text-text-primary">₹{lineNet}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic text-center py-3 bg-muted/20 rounded-lg">
                No new items selected yet. Search above to add items customer is taking.
              </p>
            )}
          </div>

          {/* ── Section 3: PRICE DIFFERENCE + COUPON ── */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
              3. Settlement Summary & Coupons
            </span>

            {/* Coupon input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Coupon code (e.g. EXCH10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={Boolean(appliedCoupon)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs font-mono uppercase border border-border rounded-button focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-input)' }}
                />
                <Ticket className="w-3.5 h-3.5 text-text-muted absolute left-2 top-2" />
              </div>
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-3 py-1 text-xs text-danger font-semibold border border-border rounded-button hover:bg-muted"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  className="px-3 py-1 text-xs bg-primary text-white font-semibold rounded-button disabled:opacity-50"
                >
                  Apply
                </button>
              )}
            </div>
            {couponError && <p className="text-[11px] text-danger">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Coupon {appliedCoupon} applied (-₹{couponDiscount})
              </p>
            )}

            {/* Breakdown table */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-border">
              <div className="flex justify-between text-text-muted">
                <span>Total Return Value</span>
                <span className="font-semibold text-danger">− ₹{totalReturnValue}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>New Items Subtotal</span>
                <span className="font-semibold text-text-primary">+ ₹{totalNewItemsValue}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-text-muted">
                  <span>Coupon Discount</span>
                  <span className="font-semibold text-emerald-600">− ₹{couponDiscount}</span>
                </div>
              )}
            </div>

            {/* Net Difference Callout */}
            <div className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{
                backgroundColor:
                  netDifference > 0
                    ? 'rgba(16,185,129,0.08)'
                    : netDifference < 0
                    ? 'rgba(245,158,11,0.08)'
                    : 'var(--bg-app)',
                borderColor:
                  netDifference > 0
                    ? 'rgba(16,185,129,0.3)'
                    : netDifference < 0
                    ? 'rgba(245,158,11,0.3)'
                    : 'var(--border)',
              }}
            >
              <div>
                <span className="text-xs font-bold block"
                  style={{
                    color:
                      netDifference > 0
                        ? '#059669'
                        : netDifference < 0
                        ? '#d97706'
                        : 'var(--text-primary)',
                  }}
                >
                  {netDifference > 0
                    ? `Collect ₹${netDifference} from Customer`
                    : netDifference < 0
                    ? `Refund ₹${Math.abs(netDifference)} to Customer`
                    : 'Even Exchange (₹0 Difference)'}
                </span>
                <span className="text-[10px] text-text-muted">
                  {netDifference > 0
                    ? 'Customer is taking items of higher value'
                    : netDifference < 0
                    ? 'Customer is taking items of lower value'
                    : 'Values match exactly'}
                </span>
              </div>

              {/* Payment / Refund mode picker */}
              {netDifference > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  {(['Cash', 'UPI', 'Card'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMode(m)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                        paymentMode === m
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-border bg-card text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {netDifference < 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  {(['Cash', 'Original Method'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRefundMode(m)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                        refundMode === m
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'border-border bg-card text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 4: ACTION FOOTER ── */}
        <div
          className="px-5 py-3 border-t border-border flex items-center justify-between gap-3"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold border border-border rounded-button text-text-primary hover:bg-muted"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => exchangeMutation.mutate()}
            disabled={
              returnedItemsCount === 0 ||
              newItems.length === 0 ||
              exchangeMutation.isPending
            }
            className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-button text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {exchangeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              Confirm Exchange (
              {netDifference > 0
                ? `Collect ₹${netDifference}`
                : netDifference < 0
                ? `Refund ₹${Math.abs(netDifference)}`
                : '₹0'}
              )
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExchangeSheet;

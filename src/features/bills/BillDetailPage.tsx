import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { billsApi } from '../../api/bills';
import { returnsApi } from '../../api/returns';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Money } from '../../components/Money';
import { Button } from '../../components/ui/Button';
import { formatDateTime, formatDate, formatPhone, formatMoney } from '../../lib/format';
import { ThermalPrintButton } from '../receipts/ThermalPrintButton';
import { WhatsAppShareButton } from '../receipts/WhatsAppShareButton';
import { ReturnSheet } from '../returns/ReturnSheet';
import { ExchangeSheet } from '../returns/ExchangeSheet';
import {
  RotateCcw,
  RefreshCw,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  Receipt,
  MoreVertical,
  Undo2,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, isBusinessAdmin } from '../../stores/auth.store';
import { whatsappApi } from '../../api/whatsapp';
import { SendMessageModal } from '../settings/whatsapp/SendMessageModal';

export const BillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showGstBreakup, setShowGstBreakup] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAdmin = isBusinessAdmin(user);
  const canSendWhatsApp = isAdmin || user?.role === 'Manager';

  // Item 2: Two queries for bill and returns
  const { data: bill, isLoading: isBillLoading, error } = useQuery({
    queryKey: ['bills', id],
    queryFn: () => billsApi.getBillById(id || ''),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: returns = [] } = useQuery({
    queryKey: ['bills', id, 'returns'],
    queryFn: () => returnsApi.getBillReturns(id || ''),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: waConfig } = useQuery({
    queryKey: ['whatsapp-config', bill?.shopID],
    queryFn: async () => {
      if (!bill?.shopID) return null;
      return whatsappApi.getConfig(bill.shopID);
    },
    enabled: !!bill?.shopID && canSendWhatsApp,
    staleTime: 60_000,
  });

  const billReturns: any[] = useMemo(() => {
    if (returns && returns.length > 0) return returns;
    if ((bill as any)?.returns && Array.isArray((bill as any).returns)) return (bill as any).returns;
    return [];
  }, [bill, returns]);

  // Calculate return quantities per item
  const itemReturnStats = useMemo(() => {
    if (!bill) return {};
    const stats: Record<string, { returnedQty: number; remainingQty: number }> = {};

    bill.items.forEach((item) => {
      const directReturned = (item as any).returnedQty;
      const computedReturned = billReturns
        .filter((r) => r.type === 'Return')
        .filter((r) => r.itemName.toLowerCase() === item.itemName.toLowerCase())
        .reduce((sum, r) => sum + r.qty, 0);

      const returnedQty =
        typeof directReturned === 'number' && directReturned > 0
          ? directReturned
          : computedReturned;

      const remainingQty = Math.max(0, item.qty - returnedQty);
      stats[item.id] = { returnedQty, remainingQty };
    });

    return stats;
  }, [bill, billReturns]);

  // Check if any item can be returned
  const hasReturnableItems = useMemo(() => {
    if (!bill) return false;
    return bill.items.some((item) => {
      const stat = itemReturnStats[item.id];
      return stat ? stat.remainingQty > 0 : item.qty > 0;
    });
  }, [bill, itemReturnStats]);

  // Net amounts calculation
  const totalReturns = useMemo(() => {
    return billReturns
      .filter((r) => r.type === 'Return')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [billReturns]);

  const netAmount = bill ? bill.total - totalReturns : 0;

  // Sorted returns (newest first)
  const sortedReturns = useMemo(() => {
    return [...billReturns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [billReturns]);

  const handleOpenReturn = () => {
    if (!hasReturnableItems) {
      toast.error('Nothing left to return');
      return;
    }
    setIsReturnOpen(true);
  };

  if (isBillLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-48 skeleton-shimmer rounded" />
        <Card className="p-8 space-y-4">
          <div className="h-6 w-32 skeleton-shimmer rounded" />
          <div className="h-24 skeleton-shimmer rounded" />
          <div className="h-32 skeleton-shimmer rounded" />
        </Card>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-xl font-bold text-text-primary mb-2">Bill Not Found</h2>
        <p className="text-xs text-text-muted mb-4">
          The requested bill could not be retrieved or does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate('/bills')}>
          Return to Bills
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 sm:pb-6">
      {/* Header */}
      <PageHeader
        title={`Bill ${bill.billNumber || `#${bill.id.slice(0, 8)}`}`}
        subtitle={`Generated on ${formatDateTime(bill.createdAt)}`}
        showBack
        backTo="/bills"
        actions={
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/bills/${bill.id}/receipt`)}
              className="inline-flex items-center px-3 py-1.5 border border-border rounded-button text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <Receipt className="w-3.5 h-3.5 mr-1" />
              Preview Receipt
            </button>
            <ThermalPrintButton billId={bill.id} variant="primary" />
            <WhatsAppShareButton billId={bill.id} variant="outline" />
            {waConfig?.isActive && canSendWhatsApp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWaModalOpen(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Send on WhatsApp Business
              </Button>
            )}
            {/* Item 3: Visible Exchange secondary button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExchangeOpen(true)}
              className="text-xs text-warning hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Exchange
            </Button>
            {/* Item 3: Prominent Return button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenReturn}
              disabled={!hasReturnableItems}
              title={!hasReturnableItems ? 'All items already returned' : 'Return items from this bill'}
              className={`text-xs bg-danger hover:bg-red-700 text-white ${
                !hasReturnableItems ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Return
            </Button>
          </div>
        }
      />

      {/* Customer & Status Summary Card */}
      <Card className="border-border shadow-card p-5" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-text-muted">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                Customer Details
              </p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {bill.customerName || 'Walk-in Customer'}
              </p>
              {bill.customerPhone && (
                <p className="text-xs text-text-muted flex items-center mt-0.5">
                  <Phone className="w-3 h-3 mr-1" />
                  {formatPhone(bill.customerPhone)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {bill.isStrictModeBill && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
                Strict Mode
              </span>
            )}
            <StatusBadge status="Paid" />
          </div>
        </div>

        {/* Payments Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <p className="text-text-muted">Payment Mode</p>
            <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {bill.payments.map((p) => p.mode).join(', ') || 'Cash'}
            </p>
          </div>
          <div>
            <p className="text-text-muted">Shop ID</p>
            <p className="font-semibold font-mono mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
              {bill.shopID.slice(0, 8)}...
            </p>
          </div>
          <div>
            <p className="text-text-muted">Item Count</p>
            <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {bill.items.reduce((acc, i) => acc + i.qty, 0)} items ({bill.items.length} lines)
            </p>
          </div>
          <div>
            <p className="text-text-muted">Total Paid</p>
            <p className="font-bold text-success text-sm mt-0.5">
              <Money value={bill.total} />
            </p>
          </div>
        </div>
      </Card>

      {/* Item 2: Returns Section below payments (rendered if returns exist) */}
      {returns.length > 0 && (
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div
            className="px-5 py-3 border-b border-border flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-app)' }}
          >
            <div className="flex items-center gap-2">
              <Undo2 className="w-4 h-4 text-danger" />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Returns & Exchanges ({returns.length})
              </h3>
            </div>
            <span className="text-xs text-text-muted font-medium">Newest first</span>
          </div>

          <div className="divide-y divide-border">
            {sortedReturns.map((ret) => {
              const isExchange = ret.type === 'Exchange';
              return (
                <div key={ret.id} className="p-4 flex flex-col gap-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {ret.itemName}
                      </span>
                      <span className="text-xs text-text-muted">· {ret.qty}×</span>
                      <span className="text-xs font-bold text-danger">
                        · <Money value={ret.amount} size="sm" negative={!isExchange} />
                      </span>
                      <span className="text-xs text-text-muted">
                        · {formatDate(ret.createdAt)}
                      </span>
                    </div>

                    {isExchange ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Exchange
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-danger dark:bg-red-950 dark:text-red-300">
                        Return
                      </span>
                    )}
                  </div>

                  {ret.reason && (
                    <p className="text-xs text-text-muted italic pl-1">
                      Reason: {ret.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Items Table with Item 2 Badges */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div
          className="px-5 py-3 border-b border-border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Purchased Items
          </h3>
          <span className="text-xs text-text-muted">{bill.items.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead
              className="text-text-muted font-bold border-b border-border"
              style={{ backgroundColor: 'var(--bg-app)' }}
            >
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Item</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Price</th>
                <th className="py-2.5 px-4 text-right">Disc</th>
                <th className="py-2.5 px-4 text-right">GST</th>
                <th className="py-2.5 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bill.items.map((item, index) => {
                const stat = itemReturnStats[item.id] || { returnedQty: 0, remainingQty: item.qty };
                const returnedQty = stat.returnedQty;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-text-muted">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {item.itemName}
                      </p>
                      {/* Item 2: Badges under each item row */}
                      {returnedQty > 0 && returnedQty < item.qty && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Returned: {returnedQty} of {item.qty}
                        </span>
                      )}
                      {returnedQty >= item.qty && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 dark:bg-red-950/60 text-danger border border-red-200 dark:border-red-900">
                          Fully returned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Money value={item.originalPrice || item.price} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      {item.discountAmount > 0 ? (
                        <Money value={item.discountAmount * item.qty} size="sm" />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-text-muted">
                      {item.gstRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                      <Money
                        value={item.lineTotal ?? item.price * item.qty}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bill Calculation Totals — Item 2: Net amount in totals */}
      <div className="flex justify-end">
        <Card className="w-full sm:w-80 border-border shadow-card p-4 space-y-2 text-xs sm:text-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              <Money value={bill.subtotal} size="sm" />
            </span>
          </div>

          {bill.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Total Discount</span>
              <span>
                -<Money value={bill.discount} size="sm" />
              </span>
            </div>
          )}

          {bill.negotiatedTotal != null && (
            <div className="flex justify-between text-text-muted italic border-t border-dashed border-border pt-1">
              <span>Negotiated Total</span>
              <span>
                <Money value={bill.negotiatedTotal} size="sm" />
              </span>
            </div>
          )}

          {/* If returns exist, display Original / Returned / Net breakdown */}
          {totalReturns > 0 ? (
            <>
              <div className="flex justify-between text-text-muted border-t border-border pt-2">
                <span>Original Total</span>
                <span className="font-semibold text-text-primary">
                  <Money value={bill.total} size="sm" />
                </span>
              </div>
              <div className="flex justify-between text-danger font-medium">
                <span>Returned</span>
                <span>
                  -<Money value={totalReturns} size="sm" />
                </span>
              </div>
              <div className="border-t-2 border-border pt-2 flex justify-between items-baseline font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                <span>Net Total</span>
                <span className="text-success text-xl font-extrabold">
                  <Money value={netAmount} />
                </span>
              </div>
            </>
          ) : (
            <div className="border-t border-border pt-2 flex justify-between items-baseline font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              <span>Final Total</span>
              <span className="text-primary text-lg">
                <Money value={bill.total} />
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Collapsible GST Breakup */}
      <Card className="border-border shadow-card p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <button
          type="button"
          onClick={() => setShowGstBreakup(!showGstBreakup)}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-primary select-none"
        >
          <span>GST & Tax Breakup</span>
          {showGstBreakup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGstBreakup && (
          <div className="mt-4 pt-3 border-t border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-text-muted font-bold border-b border-border">
                <tr>
                  <th className="py-2 px-2">Item</th>
                  <th className="py-2 px-2 text-right">Taxable</th>
                  <th className="py-2 px-2 text-right">Rate</th>
                  <th className="py-2 px-2 text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bill.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 px-2 font-medium" style={{ color: 'var(--text-primary)' }}>{item.itemName}</td>
                    <td className="py-2 px-2 text-right">
                      <Money value={item.taxableAmount ?? 0} size="sm" />
                    </td>
                    <td className="py-2 px-2 text-right">{item.gstRate}%</td>
                    <td className="py-2 px-2 text-right font-semibold">
                      <Money value={item.gstAmount ?? 0} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Item 3 Layout: Sticky Mobile Actions Bar */}
      {/* Mobile: sticky bottom bar with [Print] [WhatsApp] [Return] [⋯] */}
      {/* where [⋯] contains [Exchange] [Delete Draft] */}
      <div
        className="sm:hidden fixed bottom-16 left-0 right-0 z-40 border-t border-border p-3 px-4 shadow-raised flex items-center space-x-2"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <ThermalPrintButton billId={bill.id} variant="primary" className="flex-1 py-2 text-xs" />
        <WhatsAppShareButton billId={bill.id} variant="outline" className="flex-1 py-2 text-xs" />
        <button
          type="button"
          onClick={handleOpenReturn}
          disabled={!hasReturnableItems}
          className={`px-3 py-2 border rounded-button text-xs font-semibold ${
            hasReturnableItems
              ? 'border-red-200 text-danger bg-red-50 dark:bg-red-950/50 hover:bg-red-100'
              : 'border-border text-text-muted bg-slate-100 dark:bg-slate-800 opacity-50 cursor-not-allowed'
          }`}
          title={!hasReturnableItems ? 'All items already returned' : undefined}
        >
          Return
        </button>

        {/* Mobile Overflow Menu [⋯] */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMobileMore(!showMobileMore)}
            className="p-2 border border-border rounded-button text-text-muted hover:text-text-primary transition-colors"
            style={{ backgroundColor: 'var(--bg-app)' }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMobileMore && (
            <div
              className="absolute right-0 bottom-full mb-2 w-44 rounded-card shadow-modal border border-border py-1 z-50 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false);
                  setIsExchangeOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-warning hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Exchange
              </button>
              {waConfig?.isActive && canSendWhatsApp && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMore(false);
                    setIsWaModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center border-t border-border"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-2" />
                  Send on WhatsApp Business
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false);
                  navigate(`/bills/${bill.id}/receipt`);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center border-t border-border"
                style={{ color: 'var(--text-primary)' }}
              >
                <Receipt className="w-3.5 h-3.5 mr-2" />
                Preview Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false);
                  toast.info('Draft deletion is only applicable to draft bills');
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-danger hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center border-t border-border"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete Draft
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Return Sheet Modal */}
      <ReturnSheet
        bill={bill}
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
      />

      {/* Exchange Sheet Modal */}
      <ExchangeSheet
        bill={bill}
        isOpen={isExchangeOpen}
        onClose={() => setIsExchangeOpen(false)}
      />

      {/* WhatsApp Send Modal */}
      {bill && (
        <SendMessageModal
          open={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          shopId={bill.shopID}
          initialRecipientPhone={bill.customerPhone || ''}
          initialTemplate="bill_receipt_v1"
          initialParams={[
            bill.customerName || 'Customer',
            formatMoney(bill.total),
            bill.billNumber || bill.id,
          ]}
        />
      )}
    </div>
  );
};
export default BillDetailPage;

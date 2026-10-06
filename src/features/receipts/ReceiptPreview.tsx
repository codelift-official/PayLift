import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { receiptsApi } from '../../api/receipts';
import { ThermalPrintButton } from './ThermalPrintButton';
import { WhatsAppShareButton } from './WhatsAppShareButton';
import { Money } from '../../components/Money';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';

export const ReceiptPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: receipt, isLoading, error } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => receiptsApi.getReceipt(id || ''),
    enabled: !!id,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-app-bg">
        <div className="flex flex-col items-center space-y-2 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Generating receipt preview...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-app-bg">
        <div className="bg-card p-6 rounded-card border border-border text-center max-w-sm w-full space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Receipt Not Found</h2>
          <p className="text-xs text-text-muted">Could not retrieve receipt for bill #{id}</p>
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="w-full py-2 bg-primary text-white rounded-button text-xs font-semibold"
          >
            Back to Bills
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg py-4 px-2 sm:py-8 sm:px-4 flex flex-col items-center">
      {/* Top back button for mobile/desktop */}
      <div className="w-full max-w-[600px] mb-3 flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        {/* Desktop actions header */}
        <div className="hidden sm:flex items-center space-x-2">
          <ThermalPrintButton billId={id!} variant="primary" />
          <WhatsAppShareButton billId={id!} variant="outline" />
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="px-3 py-1.5 border border-border bg-card rounded-button text-xs font-semibold text-text-primary hover:bg-app-bg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Thermal Paper Receipt Card */}
      <div className="w-full max-w-[600px] bg-white border border-border shadow-card sm:rounded-card p-4 sm:p-8 font-mono text-xs text-text-primary space-y-4 pb-28 sm:pb-8">
        {/* Header */}
        <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
          <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase font-sans text-text-primary">
            {receipt.shopName}
          </h2>
          <p className="text-[11px] text-text-muted whitespace-pre-line">{receipt.shopAddress}</p>
          <p className="text-[11px] text-text-muted">Tel: {receipt.shopMobile}</p>
          {receipt.shopGST && (
            <p className="text-[11px] font-semibold text-text-muted">GSTIN: {receipt.shopGST}</p>
          )}
        </div>

        {/* Bill Info */}
        <div className="flex justify-between items-center text-[11px] py-1 border-b border-dashed border-slate-300">
          <div>
            <p className="font-bold">Bill: {receipt.billNumber}</p>
            {receipt.customerName && <p>Cust: {receipt.customerName}</p>}
          </div>
          <div className="text-right">
            <p>{receipt.billDate}</p>
            <p>{receipt.billTime}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-text-muted">
              <th className="py-1">ITEM</th>
              <th className="py-1 text-center">QTY</th>
              <th className="py-1 text-right">PRICE</th>
              <th className="py-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipt.items.map((it, idx) => (
              <tr key={idx} className="py-1">
                <td className="py-1.5 font-medium pr-1">
                  <div>{it.itemName}</div>
                  {it.discountAmount > 0 && (
                    <div className="text-[10px] text-emerald-600">
                      -Disc: <Money value={it.discountAmount} size="sm" />
                    </div>
                  )}
                </td>
                <td className="py-1.5 text-center">{it.qty}</td>
                <td className="py-1.5 text-right">
                  <Money value={it.price} size="sm" />
                </td>
                <td className="py-1.5 text-right font-semibold">
                  <Money value={it.lineTotal} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Subtotal and Totals */}
        <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-right">
          <div className="flex justify-between">
            <span className="text-text-muted">Subtotal:</span>
            <span><Money value={receipt.subtotal} size="sm" /></span>
          </div>
          {receipt.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount:</span>
              <span>-<Money value={receipt.discount} size="sm" /></span>
            </div>
          )}
          {receipt.isStrictMode && receipt.negotiatedTotal != null && (
            <div className="flex justify-between text-text-muted italic">
              <span>Negotiated Total:</span>
              <span><Money value={receipt.negotiatedTotal} size="sm" /></span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-900">
            <span>NET TOTAL:</span>
            <span className="text-primary"><Money value={receipt.total} /></span>
          </div>
        </div>

        {/* Payments Breakdown */}
        <div className="border-t border-dashed border-slate-300 pt-3 text-[11px] space-y-1">
          <p className="font-bold text-text-muted">PAYMENTS</p>
          {receipt.payments.map((p, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{p.mode}</span>
              <span className="font-semibold"><Money value={p.amount} size="sm" /></span>
            </div>
          ))}
        </div>

        {/* GST Breakup */}
        {receipt.gstBreakup.length > 0 && (
          <div className="border-t border-dashed border-slate-300 pt-3 text-[10px] space-y-1">
            <p className="font-bold text-text-muted">TAX BREAKUP</p>
            <div className="grid grid-cols-3 font-semibold text-text-muted border-b border-slate-200 pb-1">
              <span>Rate</span>
              <span className="text-right">Taxable</span>
              <span className="text-right">GST</span>
            </div>
            {receipt.gstBreakup.map((g, idx) => (
              <div key={idx} className="grid grid-cols-3">
                <span>GST {g.gstRate}%</span>
                <span className="text-right"><Money value={g.taxableAmount} size="sm" /></span>
                <span className="text-right"><Money value={g.gstAmount} size="sm" /></span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-dashed border-slate-300 pt-4 text-center space-y-2">
          {receipt.exchangePolicyDays > 0 && (
            <p className="text-[10px] text-text-muted">
              Exchange possible within {receipt.exchangePolicyDays} days with original receipt.
            </p>
          )}
          {receipt.receiptFooter && (
            <p className="text-[11px] font-medium text-text-primary whitespace-pre-line">
              {receipt.receiptFooter}
            </p>
          )}
          <div className="flex items-center justify-center space-x-1 text-[10px] text-emerald-600 font-sans font-semibold pt-1">
            <Check className="w-3 h-3" />
            <span>Authorized Digital Receipt • Sahayak</span>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Actions Bar (Mobile only, sits above safe-area) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 px-4 shadow-raised safe-bottom flex items-center space-x-2">
        <ThermalPrintButton
          billId={id!}
          variant="primary"
          className="flex-1 py-2.5 text-xs"
        />
        <WhatsAppShareButton
          billId={id!}
          variant="secondary"
          className="flex-1 py-2.5 text-xs"
        />
        <button
          type="button"
          onClick={() => navigate('/bills')}
          className="flex-1 py-2.5 bg-app-bg border border-border hover:opacity-80 text-text-primary rounded-button text-xs font-semibold text-center transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, X, Loader2 } from 'lucide-react';
import { receiptsApi } from '../../api/receipts';
import { toast } from 'sonner';

interface WhatsAppShareButtonProps {
  billId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  label?: string;
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  billId,
  className = '',
  variant = 'outline',
  label = 'WhatsApp',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{ message: string; waLink: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const res = await receiptsApi.getWhatsAppReceipt(billId);
      setData(res);
      setIsOpen(true);
    } catch {
      toast.error('Failed to prepare WhatsApp receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.message);
      setCopied(true);
      toast.success('Receipt text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy text');
    }
  };

  const handleOpenWhatsApp = () => {
    if (!data) return;
    window.open(data.waLink, '_blank', 'noopener,noreferrer');
  };

  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-button text-xs transition-colors duration-150 disabled:opacity-50 select-none';
  const variantStyles =
    variant === 'primary'
      ? 'bg-primary hover:bg-primary-hover text-white shadow-sm px-4 py-2'
      : variant === 'outline'
      ? 'border border-border bg-white text-text-primary hover:bg-slate-50 px-3 py-1.5'
      : 'bg-slate-100 hover:bg-slate-200 text-text-primary px-3 py-1.5';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Share2 className="w-3.5 h-3.5 mr-1.5" />
        )}
        <span>{isLoading ? 'Preparing...' : label}</span>
      </button>

      {/* WhatsApp Preview Modal */}
      {isOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-modal max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-text-primary">Share via WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted">Message Preview</label>
              <div className="bg-slate-50 border border-border rounded-lg p-3 max-h-48 overflow-y-auto text-xs font-mono whitespace-pre-wrap text-text-primary">
                {data.message}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-2 border border-border rounded-button text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Text
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-button text-xs font-semibold shadow-sm transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

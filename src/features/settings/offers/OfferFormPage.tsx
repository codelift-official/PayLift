import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, MessageSquare, Check } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { phase11Api } from '../../../api/phase11';

export const OfferFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  const MAX_CHARS = 1000;

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; validFrom?: string; validTo?: string; sendNow?: boolean }) =>
      phase11Api.createOffer(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success(created.status === 'Sent' ? 'Offer broadcasted to customers!' : 'Offer saved as draft');
      navigate('/settings/offers');
    },
    onError: () => {
      toast.error('Failed to create offer');
    },
  });

  const handleSave = (sendNow: boolean) => {
    if (!title.trim()) {
      toast.error('Offer title is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Offer message body is required');
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
      validTo: validTo ? new Date(validTo).toISOString() : undefined,
      sendNow,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/settings/offers"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to offers"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Create Promotional Offer"
          subtitle="Compose WhatsApp marketing campaigns with live preview and delivery scheduling"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="border-border shadow-card p-6 space-y-5" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div>
              <label htmlFor="offer-title" className="block text-xs font-bold text-text-primary mb-1">
                Campaign Title <span className="text-danger">*</span>
              </label>
              <Input
                id="offer-title"
                placeholder="e.g. Diwali Mega Weekend Sale"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="offer-body" className="block text-xs font-bold text-text-primary">
                  Message Body <span className="text-danger">*</span>
                </label>
                <span
                  id="offer-body-counter"
                  className={`text-[11px] font-mono ${
                    body.length > MAX_CHARS ? 'text-danger font-bold' : 'text-text-muted'
                  }`}
                >
                  {body.length} / {MAX_CHARS}
                </span>
              </div>
              <textarea
                id="offer-body"
                rows={6}
                maxLength={MAX_CHARS}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Dear customer, enjoy 15% off on all fresh produce and groceries this weekend! Visit Kirana Mart or reply to this message to order."
                className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="offer-valid-from" className="block text-xs font-bold text-text-primary mb-1">
                  Valid From <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <Input
                  id="offer-valid-from"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="offer-valid-to" className="block text-xs font-bold text-text-primary mb-1">
                  Valid To <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <Input
                  id="offer-valid-to"
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                id="offer-save-draft-btn"
                data-testid="offer-save-draft-btn"
                type="button"
                variant="outline"
                onClick={() => handleSave(false)}
                isLoading={createMutation.isPending}
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Draft
              </Button>

              <Button
                id="save-offer-send-btn"
                type="button"
                onClick={() => handleSave(true)}
                isLoading={createMutation.isPending}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Save & Send Now
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Preview Panel: WhatsApp style (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="border-border shadow-card p-4 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              WhatsApp Live Preview
            </h4>

            {/* Simulated Phone Screen */}
            <div className="rounded-2xl border-4 border-slate-700 bg-[#0b141a] text-slate-100 overflow-hidden shadow-2xl">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#202c33] px-3 py-2.5 flex items-center gap-2.5 border-b border-[#2a3942]">
                <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                  B
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">Kirana Mart</p>
                  <p className="text-[10px] text-emerald-400">Official Business Account</p>
                </div>
              </div>

              {/* Chat Canvas */}
              <div
                className="p-4 min-h-[260px] flex flex-col justify-end"
                style={{
                  backgroundImage: 'radial-gradient(circle, #1a2730 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              >
                {/* Outgoing Message Bubble */}
                <div
                  id="offer-whatsapp-preview"
                  data-testid="offer-whatsapp-preview"
                  className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-xs max-w-[90%] self-end shadow-md space-y-1.5 animate-in fade-in duration-200"
                >
                  {title && (
                    <p className="font-bold text-xs text-emerald-200" id="preview-offer-title">
                      {title}
                    </p>
                  )}
                  <p className="text-xs whitespace-pre-wrap leading-relaxed" id="preview-offer-body">
                    {body || 'Your promotional campaign text will appear right here as customers see it in WhatsApp.'}
                  </p>
                  {(validFrom || validTo) && (
                    <p className="text-[10px] text-emerald-300 border-t border-emerald-600/40 pt-1">
                      Offer valid: {validFrom ? new Date(validFrom).toLocaleDateString() : 'Now'} - {validTo ? new Date(validTo).toLocaleDateString() : 'Ongoing'}
                    </p>
                  )}
                  <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-200">
                    <span>Just now</span>
                    <Check className="w-3 h-3 text-emerald-300" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

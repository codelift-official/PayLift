import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send, AlertTriangle, MessageSquare, FileText } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { whatsappApi } from '../../../api/whatsapp';

interface SendMessageModalProps {
  open: boolean;
  onClose: () => void;
  shopId: string;
  initialRecipientPhone?: string;
  initialTemplate?: string;
  initialParams?: string[];
  onSuccess?: () => void;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  open,
  onClose,
  shopId,
  initialRecipientPhone = '',
  initialTemplate = 'bill_receipt_v1',
  initialParams = ['', '', ''],
  onSuccess,
}) => {
  const [recipientPhone, setRecipientPhone] = useState(initialRecipientPhone);
  const [msgType, setMsgType] = useState<'text' | 'template'>('template');
  const [textMessage, setTextMessage] = useState('');
  const [templateName, setTemplateName] = useState(initialTemplate);
  const [language, setLanguage] = useState('en');
  const [param1, setParam1] = useState(initialParams[0] || '');
  const [param2, setParam2] = useState(initialParams[1] || '');
  const [param3, setParam3] = useState(initialParams[2] || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialRecipientPhone) setRecipientPhone(initialRecipientPhone);
      if (initialTemplate) setTemplateName(initialTemplate);
      if (initialParams && initialParams.length >= 3) {
        setParam1(initialParams[0] || '');
        setParam2(initialParams[1] || '');
        setParam3(initialParams[2] || '');
      }
    }
  }, [open, initialRecipientPhone, initialTemplate, initialParams]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientPhone.trim()) {
      toast.error('Recipient phone number is required');
      return;
    }

    if (msgType === 'text' && !textMessage.trim()) {
      toast.error('Message text is required');
      return;
    }

    setSending(true);
    try {
      await whatsappApi.sendMessage({
        shopId,
        recipientPhone: recipientPhone.trim(),
        type: msgType,
        text: msgType === 'text' ? textMessage.trim() : undefined,
        template:
          msgType === 'template'
            ? {
                name: templateName,
                language,
                params: [param1.trim(), param2.trim(), param3.trim()].filter(Boolean),
              }
            : undefined,
      });

      toast.success('WhatsApp message dispatched successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Send WhatsApp Message"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="whatsapp-send-form"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
            isLoading={sending}
          >
            <Send className="w-3.5 h-3.5" />
            Send Message
          </Button>
        </>
      }
    >
      <form id="whatsapp-send-form" onSubmit={handleSend} className="space-y-4">
        {/* Recipient Phone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Recipient Phone Number (with Country Code) <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="+919876543210"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-input border font-mono focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Message Type Radio */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Dispatch Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-semibold transition-colors ${
                msgType === 'template'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              <input
                type="radio"
                name="msgType"
                value="template"
                checked={msgType === 'template'}
                onChange={() => setMsgType('template')}
                className="hidden"
              />
              <FileText className="w-4 h-4" />
              <span>Approved Template (24/7)</span>
            </label>

            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-semibold transition-colors ${
                msgType === 'text'
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              <input
                type="radio"
                name="msgType"
                value="text"
                checked={msgType === 'text'}
                onChange={() => setMsgType('text')}
                className="hidden"
              />
              <MessageSquare className="w-4 h-4" />
              <span>Custom Text (24h Window)</span>
            </label>
          </div>
        </div>

        {/* Text Mode */}
        {msgType === 'text' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-start space-x-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>24-Hour Policy Warning:</strong> Custom free-form text messages only work within 24 hours of customer initiating contact. Outbound promotional or unsolicited text outside this window is blocked by Meta.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Message Text <span className="text-danger">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Type your WhatsApp message..."
                className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        )}

        {/* Template Mode */}
        {msgType === 'template' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Meta Template Name
                </label>
                <select
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="bill_receipt_v1">bill_receipt_v1</option>
                  <option value="payment_reminder">payment_reminder</option>
                  <option value="order_confirmation">order_confirmation</option>
                  <option value="exchange_update">exchange_update</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-lg border space-y-2.5" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--bg-border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Template Parameters ({'{{1}}'}, {'{{2}}'}, {'{{3}}'})
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Param {{1}}: Customer Name (e.g. Ramesh)"
                  value={param1}
                  onChange={(e) => setParam1(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Param {{2}}: Total Amount (e.g. ₹1,450.00)"
                  value={param2}
                  onChange={(e) => setParam2(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Param {{3}}: Bill # (e.g. BILL-2026-001)"
                  value={param3}
                  onChange={(e) => setParam3(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { phase11Api, StockItem } from '../../../api/phase11';

interface StockPurchaseModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  item: StockItem | null;
}

export const StockPurchaseModal: React.FC<StockPurchaseModalProps> = ({ open, isOpen, onClose, item }) => {
  const isModalOpen = open ?? isOpen ?? false;
  const queryClient = useQueryClient();
  const [addQuantity, setAddQuantity] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (item) {
      setAddQuantity('');
      setCostPrice(item.unitCost || '');
      setNotes('');
    }
  }, [item]);

  const purchaseMutation = useMutation({
    mutationFn: (payload: { shopId: string; productId: string; addQuantity: number; costPrice?: number; notes?: string }) =>
      phase11Api.purchaseStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      toast.success('Stock purchase recorded successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to record stock purchase');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (addQuantity === '' || Number(addQuantity) <= 0) {
      toast.error('Add quantity must be greater than 0');
      return;
    }
    purchaseMutation.mutate({
      shopId: item.shopId,
      productId: item.productId,
      addQuantity: Number(addQuantity),
      costPrice: costPrice === '' ? undefined : Number(costPrice),
      notes: notes.trim(),
    });
  };

  if (!item) return null;

  return (
    <Modal open={isModalOpen} onClose={onClose} title={`Purchase Stock: ${item.productName}`}>
      <form onSubmit={handleSave} className="space-y-4 py-2">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border flex justify-between items-center text-xs">
          <span className="text-text-muted">Current Quantity:</span>
          <span className="font-bold text-text-primary text-sm">
            {item.quantity} {item.unit}
          </span>
        </div>

        <div>
          <label htmlFor="purchase-add-quantity" className="block text-xs font-bold text-text-primary mb-1">
            Add Quantity <span className="text-danger">*</span>
          </label>
          <Input
            id="purchase-add-quantity"
            type="number"
            placeholder="e.g. 20"
            value={addQuantity}
            onChange={(e) => setAddQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
            autoFocus
            required
          />
        </div>

        <div>
          <label htmlFor="purchase-cost-price" className="block text-xs font-bold text-text-primary mb-1">
            Cost Price (₹) <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <Input
            id="purchase-cost-price"
            type="number"
            placeholder="Unit cost price"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
          />
        </div>

        <div>
          <label htmlFor="purchase-notes" className="block text-xs font-bold text-text-primary mb-1">
            Notes / Vendor Details
          </label>
          <textarea
            id="purchase-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Invoice #PO-1049 from ABC Distributors"
            className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button id="purchase-submit-btn" data-testid="purchase-submit-btn" type="submit" isLoading={purchaseMutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

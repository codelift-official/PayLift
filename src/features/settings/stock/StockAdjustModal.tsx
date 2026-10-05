import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { phase11Api, StockItem } from '../../../api/phase11';

interface StockAdjustModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  item: StockItem | null;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ open, isOpen, onClose, item }) => {
  const isModalOpen = open ?? isOpen ?? false;
  const queryClient = useQueryClient();
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (item) {
      setNewQuantity(item.quantity);
      setNotes('');
    }
  }, [item]);

  const adjustMutation = useMutation({
    mutationFn: (payload: { shopId: string; productId: string; newQuantity: number; notes?: string }) =>
      phase11Api.adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      toast.success('Stock adjusted successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to adjust stock');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (newQuantity === '' || isNaN(Number(newQuantity))) {
      toast.error('Please enter a valid quantity');
      return;
    }
    adjustMutation.mutate({
      shopId: item.shopId,
      productId: item.productId,
      newQuantity: Number(newQuantity),
      notes: notes.trim(),
    });
  };

  if (!item) return null;

  return (
    <Modal open={isModalOpen} onClose={onClose} title={`Adjust Stock: ${item.productName}`}>
      <form onSubmit={handleSave} className="space-y-4 py-2">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border flex justify-between items-center text-xs">
          <span className="text-text-muted">Current Quantity:</span>
          <span className="font-bold text-text-primary text-sm">
            {item.quantity} {item.unit}
          </span>
        </div>

        <div>
          <label htmlFor="adjust-new-quantity" className="block text-xs font-bold text-text-primary mb-1">
            New Quantity <span className="text-danger">*</span>
          </label>
          <Input
            id="adjust-new-quantity"
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
            autoFocus
            required
          />
        </div>

        <div>
          <label htmlFor="adjust-notes" className="block text-xs font-bold text-text-primary mb-1">
            Notes / Reason
          </label>
          <textarea
            id="adjust-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Physical inventory count discrepancy, damaged item, etc."
            className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button id="adjust-submit-btn" data-testid="adjust-submit-btn" type="submit" isLoading={adjustMutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

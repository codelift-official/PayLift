import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { phase11Api, Coupon } from '../../../api/phase11';

export const CouponFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'Amount' | 'Percentage'>('Amount');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [perCustomerLimit, setPerCustomerLimit] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const { data: existingCoupon, isLoading } = useQuery<Coupon>({
    queryKey: ['coupon', id],
    queryFn: () => phase11Api.getCoupon(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingCoupon) {
      setCode(existingCoupon.code);
      setDescription(existingCoupon.description || '');
      setDiscountType(existingCoupon.discountType);
      setDiscountValue(existingCoupon.discountValue);
      setMinOrderAmount(existingCoupon.minOrderAmount || '');
      setMaxDiscountAmount(existingCoupon.maxDiscountAmount || '');
      setValidFrom(existingCoupon.validFrom ? existingCoupon.validFrom.split('T')[0] : '');
      const toStr = existingCoupon.validTo || (existingCoupon as any).validUntil;
      setValidTo(toStr ? toStr.split('T')[0] : '');
      setMaxUses(existingCoupon.maxUses || '');
      setPerCustomerLimit(existingCoupon.perCustomerLimit || '');
      setIsActive(existingCoupon.isActive);
    }
  }, [existingCoupon]);

  const createMutation = useMutation({
    mutationFn: (data: Omit<Coupon, 'id' | 'usedCount'>) => phase11Api.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created successfully');
      navigate('/settings/coupons');
    },
    onError: () => {
      toast.error('Failed to create coupon');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Coupon>) => phase11Api.updateCoupon(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon updated successfully');
      navigate('/settings/coupons');
    },
    onError: () => {
      toast.error('Failed to update coupon');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (discountValue === '' || Number(discountValue) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    let formattedValidFrom: string | null = null;
    if (validFrom) {
      const d = new Date(validFrom);
      d.setHours(0, 0, 0, 0);
      formattedValidFrom = d.toISOString();
    }

    let formattedValidTo: string | null = null;
    if (validTo) {
      const d = new Date(validTo);
      d.setHours(23, 59, 59, 999);
      formattedValidTo = d.toISOString();
    }

    const payload = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount === '' ? null : Number(minOrderAmount),
      maxDiscountAmount: discountType === 'Percentage' && maxDiscountAmount !== '' ? Number(maxDiscountAmount) : null,
      validFrom: formattedValidFrom,
      validUntil: formattedValidTo,
      validTo: formattedValidTo,
      maxUses: maxUses === '' ? null : Number(maxUses),
      maxUsesPerCustomer: perCustomerLimit === '' ? null : Number(perCustomerLimit),
      perCustomerLimit: perCustomerLimit === '' ? null : Number(perCustomerLimit),
      isActive,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/settings/coupons"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to coupons"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title={isEditing ? 'Edit Coupon' : 'Create New Coupon'}
          subtitle={isEditing ? 'Modify promotional discount rules and validity' : 'Configure code, discount structure and eligibility constraints'}
        />
      </div>

      <Card className="border-border shadow-card p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Coupon Code */}
          <div>
            <label htmlFor="coupon-code" className="block text-xs font-bold text-text-primary mb-1">
              Coupon Code <span className="text-danger">*</span>
            </label>
            <Input
              id="coupon-code"
              placeholder="e.g. FESTIVE20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="uppercase font-mono font-bold tracking-wider"
              required
            />
            <p className="text-[11px] text-text-muted mt-1">Codes are automatically converted to uppercase letters and numbers</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="coupon-description" className="block text-xs font-bold text-text-primary mb-1">
              Description
            </label>
            <Input
              id="coupon-description"
              placeholder="e.g. Flat ₹50 off on weekend grocery shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-[11px] text-text-muted mt-1">Internal note or customer facing promotional description</p>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="coupon-discount-type" className="block text-xs font-bold text-text-primary mb-1">
                Discount Type <span className="text-danger">*</span>
              </label>
              <select
                id="coupon-discount-type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-border rounded-button focus:border-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <option value="Amount">Flat Amount (₹)</option>
                <option value="Percentage">Percentage (%)</option>
              </select>
              <p className="text-[11px] text-text-muted mt-1">Choose between flat cash discount or bill percentage</p>
            </div>

            <div>
              <label htmlFor="coupon-discount-value" className="block text-xs font-bold text-text-primary mb-1">
                Discount Value <span className="text-danger">*</span>
              </label>
              <Input
                id="coupon-discount-value"
                type="number"
                step="any"
                placeholder={discountType === 'Percentage' ? 'e.g. 15' : 'e.g. 100'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
              />
              <p className="text-[11px] text-text-muted mt-1">
                {discountType === 'Percentage' ? 'Percentage to deduct from subtotal' : 'Fixed rupee amount to deduct'}
              </p>
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="coupon-min-order" className="block text-xs font-bold text-text-primary mb-1">
                Minimum Order Amount (₹)
              </label>
              <Input
                id="coupon-min-order"
                type="number"
                placeholder="e.g. 500"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <p className="text-[11px] text-text-muted mt-1">Minimum subtotal required to qualify for this coupon</p>
            </div>

            {discountType === 'Percentage' && (
              <div className="animate-in fade-in duration-200">
                <label htmlFor="coupon-max-discount" className="block text-xs font-bold text-text-primary mb-1">
                  Maximum Discount Cap (₹)
                </label>
                <Input
                  id="coupon-max-discount"
                  type="number"
                  placeholder="e.g. 250"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
                <p className="text-[11px] text-text-muted mt-1">Upper limit cap on percentage discount</p>
              </div>
            )}
          </div>

          {/* Valid From / To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="coupon-valid-from" className="block text-xs font-bold text-text-primary mb-1">
                Valid From
              </label>
              <Input
                id="coupon-valid-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
              <p className="text-[11px] text-text-muted mt-1">Coupon starts taking effect on this date</p>
            </div>

            <div>
              <label htmlFor="coupon-valid-to" className="block text-xs font-bold text-text-primary mb-1">
                Valid To
              </label>
              <Input
                id="coupon-valid-to"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
              <p className="text-[11px] text-text-muted mt-1">Coupon expires after this date (leave blank for perpetual)</p>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="coupon-max-uses" className="block text-xs font-bold text-text-primary mb-1">
                Max Total Uses
              </label>
              <Input
                id="coupon-max-uses"
                type="number"
                placeholder="Blank = unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value === '' ? '' : parseInt(e.target.value))}
              />
              <p className="text-[11px] text-text-muted mt-1">Leave blank for unlimited uses</p>
            </div>

            <div>
              <label htmlFor="coupon-customer-limit" className="block text-xs font-bold text-text-primary mb-1">
                Per Customer Limit
              </label>
              <Input
                id="coupon-customer-limit"
                type="number"
                placeholder="Blank = unlimited"
                value={perCustomerLimit}
                onChange={(e) => setPerCustomerLimit(e.target.value === '' ? '' : parseInt(e.target.value))}
              />
              <p className="text-[11px] text-text-muted mt-1">Max times a single customer phone can redeem</p>
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between pt-2 pb-1 border-t border-border">
            <div>
              <span className="text-xs font-bold text-text-primary block">Is Active</span>
              <span className="text-[11px] text-text-muted">Customers and cashiers can redeem active coupons</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="coupon-active-toggle"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary dark:bg-slate-700"></div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/settings/coupons')}
            >
              Cancel
            </Button>
            <Button
              id="save-coupon-btn"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Coupon
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

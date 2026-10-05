import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Ticket, Sliders, CheckCircle2, XCircle, Edit2, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { phase11Api, Coupon } from '../../../api/phase11';

export const CouponsListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: phase11Api.getCoupons,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Discount Coupons"
          subtitle="Manage promotional discount codes, validity windows and usage quotas"
        />

        <div className="flex items-center gap-2.5">
          <Link to="/settings/coupon-settings">
            <Button variant="outline" size="sm">
              <Sliders className="w-4 h-4 mr-1.5" />
              Coupon Settings
            </Button>
          </Link>

          <Link to="/settings/coupons/new">
            <Button size="sm" id="create-coupon-btn">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Coupon
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Ticket className="w-10 h-10 mx-auto text-text-muted" />
            <h4 className="font-bold text-sm text-text-primary">No coupons created</h4>
            <p className="text-xs text-text-muted">
              Create your first promotional discount coupon to share with customers.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/settings/coupons/new')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Coupon
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="coupons-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-right">Min Order</th>
                  <th className="px-4 py-3 text-center">Uses</th>
                  <th className="px-4 py-3">Valid</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary tracking-wider text-sm block">
                        {coupon.code}
                      </span>
                      {coupon.description && (
                        <span className="text-[11px] text-text-muted line-clamp-1">
                          {coupon.description}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-medium text-text-muted">
                      {coupon.discountType}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-text-primary">
                      {coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-text-muted">
                      {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'None'}
                    </td>

                    <td className="px-4 py-3 text-center font-mono text-text-primary">
                      {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}
                    </td>

                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString() : 'Forever'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {coupon.isActive ? (
                        <span className="inline-flex items-center text-success text-[11px] font-semibold gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-text-muted text-[11px] font-semibold gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>No</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/settings/coupons/${coupon.id}`}
                        className="p-1.5 text-text-muted hover:text-primary transition-colors inline-block"
                        title="Edit coupon"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

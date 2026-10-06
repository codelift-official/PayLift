import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Pencil,
  UserX,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { usersApi, TenantUser } from '../../../api/users';
import { shopsApi } from '../../../api/shops';

const ROLE_BADGE: Record<string, { label: string; classes: string }> = {
  BusinessAdmin: { label: 'Admin',   classes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  Manager:       { label: 'Manager', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  Staff:         { label: 'Staff',   classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deactivateTarget, setDeactivateTarget] = useState<TenantUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    placeholderData: (previousData) => previousData,
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const shopNameMap = Object.fromEntries(shops.map((s) => [s.id, s.name]));

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated');
      setDeactivateTarget(null);
    },
    onError: () => toast.error('Failed to deactivate user'),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 sm:pb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="Team Members"
          subtitle="Manage Managers and Staff with assigned shops"
        />
        <Button
          id="btn-invite-user"
          variant="primary"
          onClick={() => navigate('/settings/users/new')}
          className="flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          + Invite
        </Button>
      </div>

      <Card
        className="border-border shadow-card overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header row: Email | Mobile | Role | Shops | Actions */}
        <div
          className="px-5 py-3 border-b border-border grid grid-cols-12 gap-3 text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)' }}
        >
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Mobile</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Shops</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading && users.length === 0 ? (
          <div className="divide-y divide-border animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="px-5 py-4 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 h-4 rounded bg-slate-200 dark:bg-slate-700 w-3/4" />
                <div className="col-span-2 h-4 rounded bg-slate-200 dark:bg-slate-700 w-2/3" />
                <div className="col-span-2 h-4 rounded bg-slate-200 dark:bg-slate-700 w-1/2" />
                <div className="col-span-3 h-4 rounded bg-slate-200 dark:bg-slate-700 w-4/5" />
                <div className="col-span-2 h-4 rounded bg-slate-200 dark:bg-slate-700 w-1/4 ml-auto" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No team members yet</p>
            <p className="text-xs mt-1">Invite your first Manager or Staff member.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => {
              const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.Staff;
              const assignedShops = Array.isArray(u.assignedShopIDs)
                ? u.assignedShopIDs
                : Array.isArray((u as any).shopAccesses)
                  ? (u as any).shopAccesses.map((sa: any) => sa.shopID || sa.id || sa)
                  : [];
              const shopNames = assignedShops
                .map((id: string) => shopNameMap[id] ?? id)
                .join(', ');
              const effectiveUserId = u.userID || (u as any).id || '';
              const isUserActive = u.isActive !== false;

              return (
                <div
                  key={effectiveUserId || u.email}
                  className="px-5 py-3 grid grid-cols-12 gap-3 items-center text-sm transition-colors"
                  style={{
                    opacity: isUserActive ? 1 : 0.45,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--bg-app)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = '')
                  }
                >
                  {/* Email */}
                  <div className="col-span-3 min-w-0">
                    <p
                      className="font-semibold truncate text-xs sm:text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {u.email}
                    </p>
                    {u.name && (
                      <p
                        className="text-[11px] truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {u.name}
                      </p>
                    )}
                    {!isUserActive && (
                      <span className="text-[10px] font-bold text-red-500 uppercase">
                        Deactivated
                      </span>
                    )}
                  </div>

                  {/* Mobile */}
                  <div
                    className="col-span-2 text-xs font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {u.mobile || '—'}
                  </div>

                  {/* Role badge */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Shops */}
                  <div
                    className="col-span-3 text-xs truncate"
                    style={{ color: 'var(--text-muted)' }}
                    title={shopNames}
                  >
                    {shopNames || <span className="italic opacity-50">All shops</span>}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Link
                      to={`/settings/users/${effectiveUserId}`}
                      className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    {isUserActive && (
                      <button
                        type="button"
                        onClick={() => setDeactivateTarget(u)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                        title="Deactivate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Deactivate Confirm Modal */}
      <Modal
        open={!!deactivateTarget}
        title="Deactivate team member?"
        onClose={() => setDeactivateTarget(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeactivateTarget(null)}
              disabled={deactivateMutation.isPending}
              className="px-4 py-2 text-xs font-semibold rounded-button border hover:opacity-80 transition-colors"
              style={{
                borderColor: 'var(--bg-border)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                deactivateTarget && deactivateMutation.mutate(deactivateTarget.userID)
              }
              disabled={deactivateMutation.isPending}
              className="px-4 py-2 text-xs font-semibold rounded-button text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-1.5"
            >
              {deactivateMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Deactivate
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>
            {deactivateTarget?.name || deactivateTarget?.email}
          </strong>{' '}
          will lose access to Sahayak immediately. This can be undone by editing
          the user.
        </p>
      </Modal>
    </div>
  );
};

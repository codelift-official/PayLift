import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Mail,
  Receipt,
  Save,
  Trash2,
  Edit2,
  Loader2,
  Check,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Money } from '../../../components/Money';
import { phase11Api, Customer } from '../../../api/phase11';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => phase11Api.getCustomer(id!),
  });

  useEffect(() => {
    if (customer) {
      setNotes(customer.notes || '');
      setEditName(customer.name);
      setEditPhone(customer.phone);
      setEditEmail(customer.email || '');
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Customer>) => phase11Api.updateCustomer(id!, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['customer', id], updated);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditingInfo(false);
      toast.success('Customer details updated');
    },
    onError: () => {
      toast.error('Failed to update customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => phase11Api.deleteCustomer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer profile deleted');
      navigate('/settings/customers');
    },
    onError: () => {
      toast.error('Failed to delete customer');
    },
  });

  const handleSaveNotes = () => {
    updateMutation.mutate({ notes: notes.trim() });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    updateMutation.mutate({
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete profile for ${customer?.name}?`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-muted">Customer not found.</p>
        <Link to="/settings/customers" className="text-primary hover:underline font-semibold mt-2 inline-block">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/settings/customers"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to customers"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div id="customer-name-header" data-testid="customer-name-header">
            <PageHeader
              title={customer.name}
              subtitle={`Customer Profile • Joined ${new Date(customer.lastVisit || Date.now()).toLocaleDateString()}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="edit-customer-btn"
            variant="outline"
            size="sm"
            onClick={() => setIsEditingInfo(!isEditingInfo)}
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            {isEditingInfo ? 'Cancel' : 'Edit'}
          </Button>

          <Button
            id="delete-customer-btn"
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header contact info */}
      <Card className="border-border shadow-card p-5" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isEditingInfo ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-muted">
              Edit Customer Info
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <Input
                placeholder="Phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingInfo(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
                <Check className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-text-muted" />
              <span className="font-mono font-bold text-text-primary" id="customer-phone-header" data-testid="customer-phone-header">
                {customer.phone}
              </span>
            </div>

            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-muted" />
                <span className="text-text-muted" id="customer-header-email">
                  {customer.email}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Metrics Row: bills, total spend, avg, last bill */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Total Bills</span>
          <p className="text-2xl font-bold text-text-primary" id="customer-stats-bills">
            {customer.totalBills}
          </p>
        </Card>

        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Total Spend</span>
          <p className="text-2xl font-bold text-text-primary" id="customer-stats-spend">
            <Money value={customer.totalSpend} size="md" />
          </p>
        </Card>

        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Avg Bill Value</span>
          <p className="text-2xl font-bold text-text-primary" id="customer-stats-avg">
            <Money value={customer.avgBillValue} size="md" />
          </p>
        </Card>

        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Last Visit</span>
          <p className="text-sm font-bold text-text-primary mt-1" id="customer-stats-last">
            {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '—'}
          </p>
        </Card>
      </div>

      {/* Recent Bills list */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-primary" />
            Recent Bills
          </h3>
        </div>

        {customer.recentBills && customer.recentBills.length > 0 ? (
          <div className="divide-y divide-border" id="customer-recent-bills">
            {customer.recentBills.map((b) => (
              <div
                key={b.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div>
                  <span className="font-mono font-bold text-sm text-text-primary block">
                    {b.billNumber}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(b.date).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <Money value={b.amount} size="sm" className="font-bold text-text-primary block" />
                  <span className="text-[10px] font-semibold text-success uppercase">
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-text-muted">
            No past bills recorded for this customer yet.
          </div>
        )}
      </Card>

      {/* Notes Textarea */}
      <Card className="border-border shadow-card p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-primary" />
          Customer Notes
        </h3>
        <textarea
          id="customer-notes-textarea"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add preferences, delivery instructions or relationship notes..."
          className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
        />
        <div className="flex justify-end">
          <Button
            id="save-customer-notes-btn"
            size="sm"
            onClick={handleSaveNotes}
            isLoading={updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Notes
          </Button>
        </div>
      </Card>
    </div>
  );
};

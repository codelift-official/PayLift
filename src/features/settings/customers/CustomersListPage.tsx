import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, ChevronRight, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Money } from '../../../components/Money';
import { phase11Api, Customer } from '../../../api/phase11';

export const CustomersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: () => phase11Api.getCustomers({ search: search.trim() || undefined }),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-6">
      <PageHeader
        title="Customers Directory"
        subtitle="Manage customer profiles, lifetime purchase history and customer engagement notes"
      />

      {/* Search Input */}
      <Card className="border-border shadow-card p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <Input
            id="customer-search-input"
            className="pl-9"
            placeholder="Search customers by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 mx-auto text-text-muted" />
            <h4 className="font-bold text-sm text-text-primary">No customers found</h4>
            <p className="text-xs text-text-muted">
              Customers are saved automatically when entering their contact details during bill checkout.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="customers-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-center">Bills</th>
                  <th className="px-4 py-3 text-right">Spend</th>
                  <th className="px-4 py-3">Last Visit</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/settings/customers/${c.id}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group customer-row"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-text-primary block text-sm group-hover:text-primary transition-colors">
                        {c.name}
                      </span>
                      {c.email && (
                        <span className="text-[11px] text-text-muted">{c.email}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-text-primary">
                      {c.phone}
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-text-primary">
                      {c.totalBills}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-text-primary">
                      <Money value={c.totalSpend} size="sm" />
                    </td>

                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors ml-auto" />
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

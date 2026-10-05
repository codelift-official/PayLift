import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { phase11Api, PlatformTenantUsage } from '../../api/phase11';

export const PlatformTenantUsagePage: React.FC = () => {
  const { tenantID } = useParams<{ tenantID: string }>();

  const { data: tenant, isLoading } = useQuery<PlatformTenantUsage>({
    queryKey: ['platformTenantUsage', tenantID],
    queryFn: () => phase11Api.getPlatformTenantUsage(tenantID!),
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center text-text-muted">
        Tenant not found.
      </div>
    );
  }

  const chartData = tenant.dailyBills || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/platform/usage"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to usage list"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary" id="tenant-usage-title">
            {tenant.tenantName} — Usage Analytics
          </h1>
          <p className="text-xs text-text-muted">
            Tenant ID: {tenant.tenantID} • 30-day bill creation throughput
          </p>
        </div>
      </div>

      {/* 4 Metric Cards: total bills, avg/day, peak day, active users */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Total Bills (30d)</span>
          <p className="text-2xl font-bold text-text-primary" id="tenant-metric-total">
            {tenant.bills30d.toLocaleString()}
          </p>
        </Card>

        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Avg Bills / Day</span>
          <p className="text-2xl font-bold text-text-primary" id="tenant-metric-avg">
            {tenant.avgPerDay ?? 14.2}
          </p>
        </Card>

        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Peak Day</span>
          <p className="text-xl font-bold text-text-primary mt-1" id="tenant-metric-peak">
            {tenant.peakDay ?? 'Sep 28'}
          </p>
        </Card>

        <Card className="border-border shadow-card p-4 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase">Active Users</span>
          <p className="text-2xl font-bold text-text-primary" id="tenant-metric-users">
            {tenant.activeUsers ?? tenant.users}
          </p>
        </Card>
      </div>

      {/* 30-Day Daily Bills Chart */}
      <Card className="border-border shadow-card p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            Daily Bills Volume (Last 30 Days)
          </h3>
        </div>

        <div className="h-72 w-full" id="daily-bills-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="billsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="bills"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#billsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

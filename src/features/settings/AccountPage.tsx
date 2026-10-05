import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Shield, HelpCircle, HardDrive, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { apiClient } from '../../api/client';
import { fetchAppVersion } from '../../lib/version';

export const AccountPage: React.FC = () => {
  const { user, tenantSlug } = useAuthStore();
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{
    version: string;
    environment: string;
    buildDate: string;
  }>({
    version: '1.0.0',
    environment: 'Production',
    buildDate: '2026-10-05',
  });

  useEffect(() => {
    fetchAppVersion().then((data) => {
      if (data) {
        setVersionInfo({
          version: data.version || '1.0.0',
          environment: data.environment || 'Production',
          buildDate: data.buildDate ? data.buildDate.split('T')[0] : '2026-10-05',
        });
      }
    });
  }, []);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const res = await apiClient.get('/api/v1/business/export', {
        responseType: 'blob',
      });
      const date = new Date().toISOString().split('T')[0];
      const tenantID = user?.tenantID ?? 'tenant';
      const fileName = `billify-export-${tenantID}-${date}.zip`;

      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Business data downloaded successfully');
      setDownloadModalOpen(false);
    } catch {
      toast.error('Failed to download business data export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-8">
      <div className="flex items-center space-x-2">
        <Link
          to="/settings"
          className="inline-flex items-center text-xs font-semibold hover:text-primary transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Settings
        </Link>
      </div>

      <PageHeader
        title="Account & Data"
        subtitle="Manage business data exports, platform versioning, and legal policies"
      />

      {/* Account Info */}
      <Card
        className="p-5 space-y-3 shadow-card border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider flex items-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <Shield className="w-3.5 h-3.5 mr-1.5" /> Tenant Account Details
        </h3>
        <div className="divide-y text-xs sm:text-sm" style={{ borderColor: 'var(--bg-border)' }}>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Shop Slug</span>
            <span className="font-mono font-bold">{tenantSlug || 'kirana-mart'}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <span className="font-semibold">{user?.email || 'owner@example.com'}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Tenant ID</span>
            <span className="font-mono font-bold">{user?.tenantID ?? '1'}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Role</span>
            <span className="font-semibold capitalize">{user?.role || 'BusinessAdmin'}</span>
          </div>
        </div>
      </Card>

      {/* Section "Your Data" */}
      <Card
        className="p-5 space-y-4 shadow-card border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3
              className="text-xs font-bold uppercase tracking-wider flex items-center"
              style={{ color: 'var(--text-muted)' }}
            >
              <HardDrive className="w-3.5 h-3.5 mr-1.5" /> Your Data
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Download a copy of all your business data.
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Includes catalogs, products, sales history, shop configurations, and receipts in a single archive.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setDownloadModalOpen(true)}
          className="flex items-center space-x-2 text-xs sm:text-sm py-2 px-4"
        >
          <Download className="w-4 h-4 mr-1.5" />
          <span>Download My Data</span>
        </Button>
      </Card>

      {/* Version Information */}
      <Card
        className="p-5 space-y-3 shadow-card border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider flex items-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> System Version
        </h3>
        <div className="divide-y text-xs sm:text-sm" style={{ borderColor: 'var(--bg-border)' }}>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>App Version</span>
            <span className="font-semibold">
              v{versionInfo.version} · {versionInfo.environment}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Build</span>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {versionInfo.buildDate}
            </span>
          </div>
        </div>
      </Card>

      {/* Support & Legal Links */}
      <Card
        className="p-5 space-y-3 shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider flex items-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Support & Legal
        </h3>
        <div className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
          <Link
            to="/contact"
            className="py-2.5 flex items-center justify-between text-xs sm:text-sm hover:text-primary transition-colors"
          >
            <span className="font-medium">Support & Contact</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/contact</span>
          </Link>
          <Link
            to="/terms"
            className="py-2.5 flex items-center justify-between text-xs sm:text-sm hover:text-primary transition-colors"
          >
            <span className="font-medium">Terms of Service</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/terms</span>
          </Link>
          <Link
            to="/privacy"
            className="py-2.5 flex items-center justify-between text-xs sm:text-sm hover:text-primary transition-colors"
          >
            <span className="font-medium">Privacy Policy</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/privacy</span>
          </Link>
          <Link
            to="/refund-policy"
            className="py-2.5 flex items-center justify-between text-xs sm:text-sm hover:text-primary transition-colors"
          >
            <span className="font-medium">Refund Policy</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/refund-policy</span>
          </Link>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        open={downloadModalOpen}
        title="Download your data?"
        onClose={() => setDownloadModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDownloadModalOpen(false)}
              disabled={isExporting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-button border hover:opacity-80 transition-colors"
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
              onClick={handleDownload}
              disabled={isExporting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-button text-white bg-primary hover:bg-primary-hover transition-colors flex items-center space-x-1.5"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  <span>Download</span>
                </>
              )}
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This will create a ZIP file with all your business data. It may take a moment.
        </p>
      </Modal>
    </div>
  );
};

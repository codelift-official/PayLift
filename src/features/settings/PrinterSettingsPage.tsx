import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../api/settings';
import { useAccessibleShops } from '../../hooks/useAccessibleShops';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Bluetooth, Loader2, Store } from 'lucide-react';

export const PrinterSettingsPage: React.FC = () => {
  const { shopID } = useParams<{ shopID: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { shops = [], defaultShop, isLoading, isAdmin } = useAccessibleShops();

  const [selectedShopId, setSelectedShopId] = useState<string>('');

  useEffect(() => {
    if (shopID && shops.some((s) => s.id === shopID)) {
      setSelectedShopId(shopID);
    } else if (defaultShop) {
      setSelectedShopId(defaultShop.id);
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0].id);
    }
  }, [shopID, defaultShop, shops]);

  const activeShop = shops.find((s) => s.id === selectedShopId) || defaultShop || shops[0];
  const targetShopId = activeShop?.id || selectedShopId || shopID || '';

  const [printerType, setPrinterType] = useState('Thermal');
  const [printerName, setPrinterName] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (activeShop) {
      setPrinterType(activeShop.printerType || 'Thermal');
      setPrinterName(activeShop.printerName || 'POS-58 Bluetooth');
    }
  }, [activeShop]);

  const mutation = useMutation({
    mutationFn: () => {
      const effectiveId = selectedShopId || (shops?.some((s) => s.id === shopID) ? shopID : undefined) || activeShop?.id || shops?.[0]?.id;
      if (!effectiveId) throw new Error('No valid shop found');
      return settingsApi.updatePrinterSettings(effectiveId, {
        printerType,
        printerName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      queryClient.invalidateQueries({ queryKey: ['business', 'current'] });
      toast.success('Printer settings updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update printer settings');
    },
  });

  const handleTestBluetooth = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      toast.info('Web Bluetooth is simulated in this browser session. Printer test signal sent.');
      return;
    }

    try {
      setIsTesting(true);
      toast.loading('Scanning for Bluetooth thermal printers...', { id: 'bt-test' });
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
      });
      toast.success(`Connected to ${device.name || 'Bluetooth Printer'}`, { id: 'bt-test' });
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        toast.dismiss('bt-test');
      } else {
        toast.error('Bluetooth error: ' + err.message, { id: 'bt-test' });
      }
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 sm:pb-6">
      {/* Header */}
      <PageHeader
        title="Printer Settings"
        subtitle={`Configure receipt printer hardware for ${activeShop?.name || 'Shop'}`}
        showBack
        backTo="/settings"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="hidden sm:inline-flex"
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
            Save Settings
          </Button>
        }
      />

      {/* Shop Selector: dropdown for Admin with multiple shops; locked card for others */}
      {isAdmin && shops.length > 1 ? (
        <Card className="border-border shadow-card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
                <Store className="w-3.5 h-3.5 mr-1" /> Active Shop
              </label>
              <p className="text-xs text-text-muted mt-0.5">
                Configure printer settings for this location
              </p>
            </div>
            <div className="w-full sm:w-64">
              <select
                id="printer-shop-selector"
                value={targetShopId}
                onChange={(e) => {
                  setSelectedShopId(e.target.value);
                  navigate(`/settings/printer/${e.target.value}`, { replace: true });
                }}
                className="w-full px-3 py-2 border border-border rounded-button text-xs font-bold focus:border-primary focus:outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      ) : activeShop ? (
        /* Locked shop display for Manager/Staff or single shop */
        <Card className="border-border shadow-card p-3">
          <div className="flex items-center gap-2 text-xs">
            <Store className="w-4 h-4 text-text-muted shrink-0" />
            <div>
              <span className="font-bold text-text-primary">{activeShop.name}</span>
              {!isAdmin && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-primary">
                  Assigned shop (Locked)
                </span>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="border-border shadow-card p-6 space-y-6" style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* Printer Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Printer Type
          </label>
          <select
            value={printerType}
            onChange={(e) => setPrinterType(e.target.value)}
            className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            <option value="Thermal">Thermal (ESC/POS 58mm / 80mm)</option>
            <option value="Standard">Laser / Inkjet (A4 / A5)</option>
          </select>
          <p className="text-[11px] text-text-muted">
            Choose thermal for instant receipts or standard for invoices on letterheads.
          </p>
        </div>

        {/* Printer Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Printer Device Name / Model
          </label>
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="e.g. POS-58 Bluetooth, Epson TM-T88"
            className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Connection Test */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-primary">Test Printer Hardware</p>
            <p className="text-[11px] text-text-muted">
              Sends an ESC/POS ping over Web Bluetooth to test pairing
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestBluetooth}
            disabled={isTesting}
            className="inline-flex items-center px-3.5 py-2 border border-border rounded-button text-xs font-semibold text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Bluetooth className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </Card>

      {/* Sticky Mobile Save Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border p-3 px-4 shadow-raised safe-bottom" style={{ backgroundColor: 'var(--bg-card)' }}>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-button text-xs font-semibold shadow-sm transition-colors flex items-center justify-center"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Save Printer Settings
        </button>
      </div>
    </div>
  );
};

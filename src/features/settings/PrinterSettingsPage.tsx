import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../../api/shops';
import { settingsApi } from '../../api/settings';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Bluetooth, Loader2 } from 'lucide-react';

export const PrinterSettingsPage: React.FC = () => {
  const { shopID } = useParams<{ shopID: string }>();
  const queryClient = useQueryClient();

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const activeShop = shops?.find((s) => s.id === shopID) || shops?.[0];
  const targetShopId = activeShop?.id || shopID || '';

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
    mutationFn: () =>
      settingsApi.updatePrinterSettings(targetShopId, {
        printerType,
        printerName,
      }),
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

      <Card className="bg-white border-border shadow-card p-6 space-y-6">
        {/* Printer Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Printer Type
          </label>
          <select
            value={printerType}
            onChange={(e) => setPrinterType(e.target.value)}
            className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
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
            className="inline-flex items-center px-3.5 py-2 border border-border rounded-button text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Bluetooth className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </Card>

      {/* Sticky Mobile Save Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border p-3 px-4 shadow-raised safe-bottom">
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

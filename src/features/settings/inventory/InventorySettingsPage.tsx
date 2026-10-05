import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package, ShieldAlert, Check, Loader2, Info } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { phase11Api, InventorySettings } from '../../../api/phase11';

export const InventorySettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [inventoryModeEnabled, setInventoryModeEnabled] = useState(true);
  const [strictStockMode, setStrictStockMode] = useState(false);

  const { data, isLoading } = useQuery<InventorySettings>({
    queryKey: ['inventorySettings'],
    queryFn: phase11Api.getInventorySettings,
  });

  useEffect(() => {
    if (data) {
      setInventoryModeEnabled(data.inventoryModeEnabled);
      setStrictStockMode(data.strictStockMode);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settings: InventorySettings) => phase11Api.updateInventorySettings(settings),
    onSuccess: (updated) => {
      queryClient.setQueryData(['inventorySettings'], updated);
      toast.success('Inventory settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to update inventory settings');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      inventoryModeEnabled,
      strictStockMode: inventoryModeEnabled ? strictStockMode : false,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <PageHeader
        title="Inventory Settings"
        subtitle="Configure product catalog mode and inventory enforcement rules"
      />

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="border-border shadow-card p-6 space-y-6" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Inventory Mode Toggle */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
            <div className="space-y-1">
              <label htmlFor="inventory-mode-toggle" className="text-sm font-bold text-text-primary flex items-center gap-2 cursor-pointer">
                <Package className="w-4 h-4 text-primary" />
                Enable Inventory Mode
              </label>
              <p className="text-xs text-text-muted">
                When ON, bill creation uses product catalog.
              </p>
            </div>
            <button
              id="toggle-inventory-mode"
              data-testid="toggle-inventory-mode"
              type="button"
              role="switch"
              aria-checked={inventoryModeEnabled}
              onClick={() => setInventoryModeEnabled(!inventoryModeEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                inventoryModeEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  inventoryModeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Strict Stock Mode Toggle (visible only when Inventory ON) */}
          {inventoryModeEnabled && (
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-border animate-in fade-in duration-200">
              <div className="space-y-1">
                <label htmlFor="toggle-strict-mode" className="text-sm font-bold text-text-primary flex items-center gap-2 cursor-pointer">
                  <ShieldAlert className="w-4 h-4 text-warning" />
                  Strict Stock Mode
                </label>
                <p className="text-xs text-text-muted">
                  Reject bills if stock insufficient.
                </p>
              </div>
              <button
                id="toggle-strict-mode"
                data-testid="toggle-strict-mode"
                type="button"
                role="switch"
                aria-checked={strictStockMode}
                onClick={() => setStrictStockMode(!strictStockMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  strictStockMode ? 'bg-warning' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    strictStockMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Quick Guide</p>
              <p className="opacity-90">
                With inventory mode turned on, items in checkout will pull live pricing, stock availability, and tax rates directly from your product catalog.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              id="save-inventory-settings-btn"
              data-testid="save-inventory-settings-btn"
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              className="px-6 font-semibold"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Save Settings
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

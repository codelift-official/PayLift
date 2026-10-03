import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { CatalogImage } from '../../components/CatalogImage';
import {
  ALL_CATALOG_IDS,
  getEnabledCatalogIds,
  setEnabledCatalogIds,
} from '../../lib/catalog/enabledCatalogs';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface CatalogMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
}

const PREDEFINED_CATALOGS: CatalogMeta[] = [
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Apparel, shirts, t-shirts, sarees, kurtas & trousers',
    icon: 'Shirt',
    imageUrl: '/catalogs/images/clothing.jpg',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    description: 'Breads, dairy, cakes, pastries & bakery snacks',
    icon: 'Cookie',
    imageUrl: '/catalogs/images/bakery.jpg',
  },
  {
    id: 'grocery',
    name: 'Grocery',
    description: 'Staples, snacks, packaged food, beverages & household',
    icon: 'ShoppingBasket',
    imageUrl: '/catalogs/images/grocery.jpg',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Mobile accessories, audio, cables & batteries',
    icon: 'Smartphone',
    imageUrl: '/catalogs/images/electronics.jpg',
  },
  {
    id: 'cosmetics',
    name: 'Cosmetics',
    description: 'Skincare, makeup, haircare & personal essentials',
    icon: 'Sparkles',
    imageUrl: '/catalogs/images/cosmetics.jpg',
  },
];

export const CatalogSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const tenantId = user?.tenantID || 1;
  const isBusinessAdmin = !user?.role || user.role === 'BusinessAdmin';

  const [orderedCatalogs, setOrderedCatalogs] = useState<CatalogMeta[]>(PREDEFINED_CATALOGS);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedEnabled = getEnabledCatalogIds(tenantId);
    const initialMap: Record<string, boolean> = {};
    ALL_CATALOG_IDS.forEach((id) => {
      initialMap[id] = savedEnabled.includes(id);
    });
    setEnabledMap(initialMap);

    // Reorder based on saved order if any
    const order = [...PREDEFINED_CATALOGS].sort((a, b) => {
      const idxA = savedEnabled.indexOf(a.id);
      const idxB = savedEnabled.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    setOrderedCatalogs(order);
  }, [tenantId]);

  const toggleCatalog = (id: string) => {
    setEnabledMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setOrderedCatalogs((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === orderedCatalogs.length - 1) return;
    setOrderedCatalogs((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    // TODO: Migrate to /api/v1/settings/catalogs when backend ready
    const enabledIds = orderedCatalogs
      .filter((c) => enabledMap[c.id])
      .map((c) => c.id);

    setEnabledCatalogIds(tenantId, enabledIds);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Catalog configuration saved successfully');
    }, 200);
  };

  const enabledCount = Object.values(enabledMap).filter(Boolean).length;

  if (!isBusinessAdmin) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <PageHeader
          title="Catalog Configuration"
          subtitle="Manage active catalogs"
          showBack
          backTo="/settings"
        />
        <Card className="p-8 text-center border-border shadow-card" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="w-12 h-12 rounded-full bg-red-100 text-danger flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-text-primary mb-1">Access Restricted</h2>
          <p className="text-xs text-text-muted mb-4">
            Only users with the <span className="font-semibold text-text-primary">BusinessAdmin</span> role can configure business catalogs.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            Return to Settings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <PageHeader
        title="Catalog Configuration"
        subtitle="Enable, disable, and order catalogs for bill checkout assist"
        showBack
        backTo="/settings"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="hidden sm:inline-flex"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Changes
          </Button>
        }
      />

      {/* Info Notice */}
      <Card className="p-4 border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 flex items-start space-x-3">
        <Layers className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p className="font-semibold text-sm mb-0.5">Control Visible Bill Catalogs</p>
          <p>
            Enabled catalogs appear in the New Bill item drawer. If only 1 catalog is enabled, the drawer skips the catalog list and opens directly to categories. Free-text entry remains available at all times.
          </p>
          <p className="mt-1 font-semibold text-primary">
            {enabledCount} of {orderedCatalogs.length} catalogs currently enabled
          </p>
        </div>
      </Card>

      {/* Catalog List */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="px-5 py-3 border-b border-border bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Predefined Catalogs
          </h3>
          <span className="text-xs text-text-muted">Toggle switch or reorder</span>
        </div>

        <div className="divide-y divide-border">
          {orderedCatalogs.map((catalog, index) => {
            const isEnabled = !!enabledMap[catalog.id];
            return (
              <div
                key={catalog.id}
                className="p-4 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                {/* Image + Title */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-border flex items-center justify-center">
                    <CatalogImage
                      src={catalog.imageUrl}
                      alt={catalog.name}
                      fallbackIcon={<Layers className="w-6 h-6 text-text-muted" />}
                      className="w-12 h-12 object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {catalog.name}
                      </span>
                      {/* Green dot for enabled, grey for disabled */}
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full transition-colors ${
                          isEnabled ? 'bg-success ring-4 ring-emerald-100 dark:ring-emerald-950/60' : 'bg-slate-400'
                        }`}
                        title={isEnabled ? 'Enabled' : 'Disabled'}
                      />
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {catalog.description}
                    </p>
                  </div>
                </div>

                {/* Actions: Reorder + Toggle */}
                <div className="flex items-center space-x-2 shrink-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === orderedCatalogs.length - 1}
                      className="p-1 text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={() => toggleCatalog(catalog.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-success' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Save Button (Mobile) */}
      <div className="sm:hidden pt-2">
        <Button
          variant="primary"
          size="md"
          className="w-full py-3"
          onClick={handleSave}
          isLoading={isSaving}
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
};
export default CatalogSettingsPage;

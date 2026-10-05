import React, { useState, useEffect } from 'react';
import { Upload, Download, AlertCircle, ClipboardList } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { phase11Api } from '../../../api/phase11';
import { toast } from 'sonner';

interface ImportItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  gstRate: number;
  isActive: boolean;
  selected: boolean;
  errors: Record<string, string>;
}

interface ImportJsonModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_TEMPLATE = [
  {
    name: 'Sample Basmati Rice 5kg',
    sku: 'RICE-001',
    category: 'Grains & Rice',
    unit: 'Pack',
    costPrice: 380,
    sellingPrice: 480,
    gstRate: 5,
    isActive: true,
  },
  {
    name: 'Sample Sunflower Oil 1L',
    sku: 'OIL-002',
    category: 'Edible Oils',
    unit: 'Ltr',
    costPrice: 110,
    sellingPrice: 140,
    gstRate: 5,
    isActive: true,
  },
];

export const downloadProductsTemplate = () => {
  const blob = new Blob([JSON.stringify(SAMPLE_TEMPLATE, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products-template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({ open, isOpen, onClose, onSuccess }) => {
  const isModalOpen = open ?? isOpen ?? false;
  const [step, setStep] = useState<1 | 2>(1);
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paste mode state
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [detectedCount, setDetectedCount] = useState<number>(0);
  const [parsedPasteItems, setParsedPasteItems] = useState<ImportItem[]>([]);

  const validateRow = (row: Partial<ImportItem>): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!row.name || !row.name.trim()) {
      errors.name = 'Name is required';
    }
    if (row.sellingPrice === undefined || row.sellingPrice === null || isNaN(row.sellingPrice) || row.sellingPrice <= 0) {
      errors.sellingPrice = 'Selling price must be > 0';
    }
    if (row.gstRate !== undefined && ![0, 5, 12, 18].includes(Number(row.gstRate))) {
      errors.gstRate = 'GST must be 0, 5, 12, or 18';
    }
    return errors;
  };

  const parseJsonToItems = (json: any[]): ImportItem[] => {
    return json.map((p, idx) => {
      const item: ImportItem = {
        id: `row-${idx}`,
        name: p.name || '',
        sku: p.sku || '',
        category: p.category || 'General',
        unit: p.unit || 'Pcs',
        costPrice: Number(p.costPrice) || 0,
        sellingPrice: Number(p.sellingPrice) || 0,
        gstRate: [0, 5, 12, 18].includes(Number(p.gstRate)) ? Number(p.gstRate) : 0,
        isActive: p.isActive !== false,
        selected: true,
        errors: {},
      };
      item.errors = validateRow(item);
      return item;
    });
  };

  // Debounced parsing for paste mode
  useEffect(() => {
    if (!pasteText.trim()) {
      setPasteError(null);
      setDetectedCount(0);
      setParsedPasteItems([]);
      return;
    }

    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(pasteText);
        if (!Array.isArray(parsed)) {
          setPasteError('JSON must be an array of product objects');
          setDetectedCount(0);
          setParsedPasteItems([]);
          return;
        }

        const mapped = parseJsonToItems(parsed);
        setPasteError(null);
        setDetectedCount(mapped.length);
        setParsedPasteItems(mapped);
      } catch {
        setPasteError('Invalid JSON format: syntax error');
        setDetectedCount(0);
        setParsedPasteItems([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pasteText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          toast.error('JSON file must contain an array of products');
          return;
        }

        const parsed = parseJsonToItems(json);
        setItems(parsed);
        setStep(2);
        toast.success(`Parsed ${parsed.length} products`);
      } catch {
        toast.error('Failed to parse JSON file. Please check syntax.');
      }
    };
    reader.readAsText(file);
  };

  const handlePreviewPaste = () => {
    if (parsedPasteItems.length === 0 || pasteError) return;
    setItems(parsedPasteItems);
    setStep(2);
    toast.success(`Loaded ${parsedPasteItems.length} products from paste`);
  };

  const handleUpdateRow = (id: string, field: keyof ImportItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.errors = validateRow(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const handleToggleSelect = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const activeItemsToImport = items.filter((i) => i.selected);
  const unskippedErrors = activeItemsToImport.filter((i) => Object.keys(i.errors).length > 0);
  const hasErrors = unskippedErrors.length > 0;

  const handleImport = async () => {
    if (hasErrors) {
      toast.error('Please fix validation errors on selected rows or skip them before submitting');
      return;
    }

    if (activeItemsToImport.length === 0) {
      toast.error('Please select at least one item to import');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = activeItemsToImport.map((i) => ({
        name: i.name.trim(),
        sku: i.sku.trim(),
        category: i.category.trim() || 'General',
        unit: i.unit.trim() || 'Pcs',
        costPrice: i.costPrice,
        sellingPrice: i.sellingPrice,
        gstRate: i.gstRate,
        isActive: i.isActive,
      }));

      await phase11Api.importProducts(payload);
      toast.success(`Successfully imported ${activeItemsToImport.length} products!`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to import products');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={step === 1 ? 'Import Products from JSON' : 'Review & Edit Products'}
      
    >
      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            {/* Step 1 Modes: Upload File, Paste JSON, Download Template */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-4 text-sm font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="upload"
                    checked={importMode === 'upload'}
                    onChange={() => setImportMode('upload')}
                    className="cursor-pointer text-primary focus:ring-primary"
                  />
                  <span>Upload File</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="paste"
                    id="radio-paste-json"
                    checked={importMode === 'paste'}
                    onChange={() => setImportMode('paste')}
                    className="cursor-pointer text-primary focus:ring-primary"
                  />
                  <span>Paste JSON</span>
                </label>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadProductsTemplate}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download Template
              </Button>
            </div>

            {importMode === 'upload' && (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <h4 className="font-bold text-sm text-text-primary mb-1">Choose a JSON file to upload</h4>
                <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
                  Upload a formatted JSON file with an array of products matching our schema.
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    id="json-file-input"
                    onChange={handleFileUpload}
                  />
                  <span className="cursor-pointer inline-flex items-center justify-center rounded-button font-bold text-sm px-4 py-2 bg-primary text-white hover:bg-primary-hover shadow-sm transition-all">
                    Choose File
                  </span>
                </label>
              </div>
            )}

            {importMode === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="json-paste-textarea" className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    Paste Product JSON
                  </label>
                  {detectedCount > 0 && !pasteError && (
                    <span id="paste-detected-counter" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {detectedCount} products detected
                    </span>
                  )}
                </div>

                <textarea
                  id="json-paste-textarea"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={JSON.stringify(SAMPLE_TEMPLATE, null, 2)}
                  className={`font-mono text-xs w-full h-64 p-3 border rounded-lg focus:outline-none transition-colors ${
                    pasteError
                      ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20'
                      : 'border-border focus:border-primary'
                  }`}
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />

                {pasteError && (
                  <div className="flex items-center gap-1.5 text-xs text-danger font-medium" id="paste-error-msg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pasteError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    id="preview-paste-btn"
                    disabled={detectedCount === 0 || !!pasteError}
                    onClick={handlePreviewPaste}
                  >
                    Preview ({detectedCount})
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-text-primary">Preview & Validate Products</h4>
                <p className="text-xs text-text-muted">
                  Showing {items.length} items. Check rows to include/skip or click cells to edit.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
              >
                Choose Different Input
              </Button>
            </div>

            {hasErrors && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {unskippedErrors.length} selected {unskippedErrors.length === 1 ? 'row has' : 'rows have'} errors.
                  Fix errors inline or uncheck the row to skip it.
                </span>
              </div>
            )}

            <div className="max-h-[380px] overflow-auto border border-border rounded-lg">
              <table className="w-full text-xs text-left" id="import-preview-table">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-b border-border">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Include</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Price</th>
                    <th className="p-2.5">GST %</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((row) => {
                    const rowHasError = Object.keys(row.errors).length > 0;
                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          !row.selected ? 'opacity-40 bg-slate-50 dark:bg-slate-900/50' : rowHasError ? 'bg-red-50/50 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => handleToggleSelect(row.id)}
                            className="rounded border-border text-primary cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                            className={`w-full px-2 py-1 rounded border text-xs ${
                              row.errors.name ? 'border-danger bg-red-50 dark:bg-red-950/40' : 'border-border'
                            }`}
                          />
                          {row.errors.name && (
                            <span className="text-[10px] text-danger block mt-0.5 error-msg">{row.errors.name}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.sku}
                            onChange={(e) => handleUpdateRow(row.id, 'sku', e.target.value)}
                            className="w-24 px-2 py-1 rounded border border-border text-xs"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.category}
                            onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                            className="w-28 px-2 py-1 rounded border border-border text-xs"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={row.sellingPrice}
                            onChange={(e) => handleUpdateRow(row.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                            className={`w-20 px-2 py-1 rounded border text-xs text-right ${
                              row.errors.sellingPrice ? 'border-danger bg-red-50 dark:bg-red-950/40' : 'border-border'
                            }`}
                          />
                          {row.errors.sellingPrice && (
                            <span className="text-[10px] text-danger block mt-0.5 error-msg">{row.errors.sellingPrice}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <select
                            value={row.gstRate}
                            onChange={(e) => handleUpdateRow(row.id, 'gstRate', parseInt(e.target.value))}
                            className="px-2 py-1 rounded border border-border text-xs"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-center">
                          {rowHasError ? (
                            <span className="text-danger font-bold text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/50">
                              Error
                            </span>
                          ) : (
                            <span className="text-success font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50">
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-muted">
                {activeItemsToImport.length} of {items.length} items ready to import
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  id="import-submit-btn"
                  type="button"
                  onClick={handleImport}
                  isLoading={isSubmitting}
                  disabled={hasErrors || activeItemsToImport.length === 0}
                >
                  Import {activeItemsToImport.length} Products
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

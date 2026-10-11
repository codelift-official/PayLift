import React, { useState, useEffect } from 'react';
import { Upload, Download, AlertCircle, ClipboardList, Copy, CheckCircle2, AlertTriangle, XCircle, Check } from 'lucide-react';
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
  gstRate?: number;
  isActive: boolean;
  selected: boolean;
  status: 'ready' | 'fixed' | 'invalid';
  errors: Record<string, string>;
  isAutoCorrected?: boolean;
}

interface SkippedItem {
  row: number;
  reason: string;
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
    unit: 'pcs',
    costPrice: 380,
    sellingPrice: 480,
    gstRate: 5,
    isActive: true,
  },
  {
    name: 'Sample Sunflower Oil 1L',
    sku: 'OIL-002',
    category: 'Cooking Oils',
    unit: 'pcs',
    costPrice: 110,
    sellingPrice: 140,
    gstRate: 5,
    isActive: true,
  },
];

export const copyTemplateJson = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(SAMPLE_TEMPLATE, null, 2));
    toast.success('Template JSON copied to clipboard!');
  } catch {
    toast.error('Failed to copy template JSON to clipboard');
  }
};

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result step state
  const [importResult, setImportResult] = useState<{ imported: number; skipped: SkippedItem[] }>({
    imported: 0,
    skipped: [],
  });

  // Paste mode state
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [detectedCount, setDetectedCount] = useState<number>(0);
  const [parsedPasteItems, setParsedPasteItems] = useState<ImportItem[]>([]);

  const validateAndNormalizeRow = (row: Partial<ImportItem>): { errors: Record<string, string>; status: 'ready' | 'fixed' | 'invalid'; isFixed: boolean } => {
    const errors: Record<string, string> = {};
    let isFixed = false;

    if (!row.name || !row.name.trim()) {
      errors.name = 'Name is required';
    }

    if (row.sellingPrice === undefined || row.sellingPrice === null || isNaN(row.sellingPrice) || row.sellingPrice <= 0) {
      errors.sellingPrice = 'Selling price must be > 0';
    }

    if (row.sku && row.sku !== row.sku.toUpperCase()) {
      isFixed = true;
    }

    if (Object.keys(errors).length > 0) {
      return { errors, status: 'invalid', isFixed: false };
    }

    return { errors, status: isFixed ? 'fixed' : 'ready', isFixed };
  };

  const parseJsonToItems = (json: any[]): ImportItem[] => {
    return json.map((p, idx) => {
      const rawSku = (p.sku || '').trim().toUpperCase();
      const rawUnit = (p.unit || 'pcs').trim();
      const rawCategory = (p.categoryName || p.category || 'General').trim();
      const costPrice = Number(p.costPrice) || 0;
      const sellingPrice = Number(p.sellingPrice) || 0;
      const gstRate = p.gstRate !== undefined ? Number(p.gstRate) : undefined;

      const item: ImportItem = {
        id: `row-${idx + 1}`,
        name: (p.name || '').trim(),
        sku: rawSku,
        category: rawCategory,
        unit: rawUnit,
        costPrice,
        sellingPrice,
        gstRate,
        isActive: p.isActive !== false,
        selected: true,
        status: 'ready',
        errors: {},
      };

      const res = validateAndNormalizeRow(item);
      item.errors = res.errors;
      item.status = res.status;
      item.isAutoCorrected = res.isFixed;
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
          const res = validateAndNormalizeRow(updated);
          updated.errors = res.errors;
          updated.status = res.status;
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

  // Counts for summary
  const validTotalCount = items.filter((i) => i.status !== 'invalid').length;
  const invalidTotalCount = items.filter((i) => i.status === 'invalid').length;
  const activeValidToImport = items.filter((i) => i.selected && i.status !== 'invalid');

  const handleImport = async () => {
    if (activeValidToImport.length === 0) {
      toast.error('No valid products selected to import');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = activeValidToImport.map((i) => ({
        name: i.name.trim(),
        sku: i.sku.trim(),
        category: i.category.trim() || 'General',
        unit: i.unit.trim() || 'pcs',
        costPrice: i.costPrice,
        sellingPrice: i.sellingPrice,
        ...(i.gstRate !== undefined ? { gstRate: i.gstRate } : {}),
        isActive: i.isActive,
      }));

      // Best effort import
      const skippedRows: SkippedItem[] = items
        .map((item, idx) => ({ item, row: idx + 1 }))
        .filter(({ item }) => !item.selected || item.status === 'invalid')
        .map(({ item, row }) => ({
          row,
          reason: Object.values(item.errors).join(', ') || 'Skipped by user',
        }));

      await phase11Api.importProducts(payload);

      setImportResult({
        imported: activeValidToImport.length,
        skipped: skippedRows,
      });

      setStep(3);
      toast.success(`Successfully imported ${activeValidToImport.length} products!`);
      onSuccess();
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
      title={
        step === 1
          ? 'Import Products from JSON (Step 1 of 3)'
          : step === 2
          ? 'Review & Edit Products (Step 2 of 3)'
          : 'Import Results (Step 3 of 3)'
      }
      maxWidth="sm:max-w-2xl lg:max-w-4xl"
    >
      <div className="space-y-4">
        {/* STEP 1: Choose Input */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-4 text-sm font-semibold">
                <label className="flex items-center gap-2 cursor-pointer select-none">
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

                <label className="flex items-center gap-2 cursor-pointer select-none">
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

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyTemplateJson}
                  className="text-xs"
                >
                  <Copy className="w-3.5 h-3.5 mr-1 text-primary" />
                  Copy Template JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadProductsTemplate}
                  className="text-xs"
                  id="btn-download-template"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download Template
                </Button>
              </div>
            </div>

            {importMode === 'upload' && (
              <div className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-9 h-9 text-text-muted mx-auto mb-2.5" />
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
                  <span className="cursor-pointer inline-flex items-center justify-center rounded-button font-bold text-xs sm:text-sm px-4 py-2 bg-primary text-white hover:bg-primary-hover shadow-sm transition-all">
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
                  className={`font-mono text-xs w-full h-48 sm:h-64 p-3 border rounded-lg focus:outline-none transition-colors ${
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

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
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

        {/* STEP 2: Preview & Validation Table */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-sm text-text-primary">Preview & Validate Products</h4>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5" id="import-summary-text">
                  {validTotalCount} valid · {invalidTotalCount} invalid · {items.length} total
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="self-start sm:self-auto text-xs"
              >
                Choose Different Input
              </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto border border-border rounded-lg max-h-[360px]">
              <table className="w-full text-xs text-left" id="import-preview-table">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-b border-border z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Include</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Price (₹)</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((row) => {
                    const rowHasError = row.status === 'invalid';
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
                            className={`w-full min-w-[140px] px-2 py-1 rounded border text-xs ${
                              row.errors.name ? 'border-danger bg-red-50 dark:bg-red-950/40' : 'border-border'
                            }`}
                            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
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
                            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.category}
                            onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                            className="w-28 px-2 py-1 rounded border border-border text-xs"
                            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
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
                            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                          />
                          {row.errors.sellingPrice && (
                            <span className="text-[10px] text-danger block mt-0.5 error-msg">{row.errors.sellingPrice}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.status === 'ready' && (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                              <Check className="w-3 h-3" /> Ready
                            </span>
                          )}
                          {row.status === 'fixed' && (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3" /> Fixed
                            </span>
                          )}
                          {row.status === 'invalid' && (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400">
                              <XCircle className="w-3 h-3" /> Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="sm:hidden space-y-3 max-h-[360px] overflow-y-auto">
              {items.map((row) => (
                <div
                  key={row.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    !row.selected ? 'opacity-40 bg-slate-50 dark:bg-slate-900/50' : row.status === 'invalid' ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300' : 'border-border'
                  }`}
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => handleToggleSelect(row.id)}
                        className="rounded border-border text-primary"
                      />
                      <span>Include Item</span>
                    </label>

                    {row.status === 'ready' && (
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    )}
                    {row.status === 'fixed' && (
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" /> Fixed
                      </span>
                    )}
                    {row.status === 'invalid' && (
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400">
                        <XCircle className="w-3 h-3" /> Invalid
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-muted">Name</span>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 rounded border text-xs"
                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
                      />
                      {row.errors.name && <span className="text-[10px] text-danger">{row.errors.name}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted">SKU</span>
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) => handleUpdateRow(row.id, 'sku', e.target.value)}
                          className="w-full px-2 py-1 rounded border text-xs"
                          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted">Price (₹)</span>
                        <input
                          type="number"
                          value={row.sellingPrice}
                          onChange={(e) => handleUpdateRow(row.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 rounded border text-xs text-right"
                          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
                        />
                        {row.errors.sellingPrice && <span className="text-[10px] text-danger">{row.errors.sellingPrice}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-text-muted">
                {activeValidToImport.length} valid items selected
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
                  Cancel
                </Button>
                <Button
                  id="import-submit-btn"
                  type="button"
                  onClick={handleImport}
                  isLoading={isSubmitting}
                  disabled={activeValidToImport.length === 0}
                  className="flex-1 sm:flex-initial"
                >
                  Import {activeValidToImport.length} Valid Products
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Results View */}
        {step === 3 && (
          <div className="space-y-4 py-2" id="import-step-3-result">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Import Completed</h4>
                <p className="text-xs mt-0.5 font-semibold" id="import-result-summary">
                  Imported {importResult.imported}, skipped {importResult.skipped.length}
                </p>
              </div>
            </div>

            {importResult.skipped.length > 0 && (
              <div className="space-y-2 border border-border rounded-lg p-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Skipped Rows ({importResult.skipped.length})
                </h5>
                <ul className="divide-y divide-border text-xs max-h-48 overflow-y-auto" id="import-skipped-list">
                  {importResult.skipped.map((s, idx) => (
                    <li key={idx} className="py-2 flex items-center justify-between">
                      <span className="font-mono text-muted">Row {s.row}</span>
                      <span className="text-danger font-medium">{s.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                id="btn-import-done"
                type="button"
                variant="primary"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

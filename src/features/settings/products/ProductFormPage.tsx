import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { phase11Api, Product, ProductCategory } from '../../../api/phase11';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [gstRate, setGstRate] = useState<0 | 5 | 12 | 18>(0);
  const [isActive, setIsActive] = useState(true);

  // Quick inline add category
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Fetch categories
  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['productCategories'],
    queryFn: phase11Api.getCategories,
  });

  // Fetch product if editing
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => phase11Api.getProduct(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setSku(existingProduct.sku || '');
      setCategory(existingProduct.category);
      setUnit(existingProduct.unit || 'Pcs');
      setCostPrice(existingProduct.costPrice || '');
      setSellingPrice(existingProduct.sellingPrice || '');
      setGstRate((existingProduct.gstRate as any) || 0);
      setIsActive(existingProduct.isActive);
    } else if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [existingProduct, categories]);

  const createMutation = useMutation({
    mutationFn: (data: Omit<Product, 'id'>) => phase11Api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Product created successfully');
      navigate('/settings/products');
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Product>) => phase11Api.updateProduct(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Product updated successfully');
      navigate('/settings/products');
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await phase11Api.createCategory({
        name: newCatName.trim(),
        displayOrder: categories.length + 1,
      });
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      setCategory(created.name);
      setNewCatName('');
      setShowNewCatInput(false);
      toast.success('Category added');
    } catch {
      toast.error('Failed to add category');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      category: category || (categories[0]?.name ?? 'General'),
      unit,
      costPrice: costPrice === '' ? 0 : Number(costPrice),
      sellingPrice: Number(sellingPrice),
      gstRate,
      isActive,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditing && isLoadingProduct) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/settings/products"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to products"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title={isEditing ? 'Edit Product' : 'Add New Product'}
          subtitle={isEditing ? 'Update catalog product specifications' : 'Create a new catalog product with pricing & GST'}
        />
      </div>

      <Card className="border-border shadow-card p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div>
            <label htmlFor="product-name" className="block text-xs font-bold text-text-primary mb-1">
              Product Name <span className="text-danger">*</span>
            </label>
            <Input
              id="product-name"
              placeholder="e.g. Basmati Rice 5kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label htmlFor="product-sku" className="block text-xs font-bold text-text-primary mb-1">
                SKU / Barcode <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <Input
                id="product-sku"
                placeholder="e.g. RIC-501"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="product-category" className="block text-xs font-bold text-text-primary">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              {showNewCatInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory}>
                    Add
                  </Button>
                </div>
              ) : (
                <select
                  id="product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-button focus:border-primary focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {categories.length === 0 && <option value="General">General</option>}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Unit */}
            <div>
              <label htmlFor="product-unit" className="block text-xs font-bold text-text-primary mb-1">
                Unit
              </label>
              <select
                id="product-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-button focus:border-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <option value="Pcs">Pcs</option>
                <option value="Pack">Pack</option>
                <option value="Kg">Kg</option>
                <option value="Gm">Gm</option>
                <option value="Ltr">Ltr</option>
                <option value="Ml">Ml</option>
                <option value="Box">Box</option>
                <option value="Meter">Meter</option>
              </select>
            </div>

            {/* Cost Price */}
            <div>
              <label htmlFor="product-cost-price" className="block text-xs font-bold text-text-primary mb-1">
                Cost Price (₹)
              </label>
              <Input
                id="product-cost-price"
                type="number"
                step="any"
                placeholder="0.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>

            {/* Selling Price */}
            <div>
              <label htmlFor="product-selling-price" className="block text-xs font-bold text-text-primary mb-1">
                Selling Price (₹) <span className="text-danger">*</span>
              </label>
              <Input
                id="product-selling-price"
                type="number"
                step="any"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          {/* GST Radio Group */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-2">
              GST Rate
            </label>
            <div className="grid grid-cols-4 gap-3">
              {([0, 5, 12, 18] as const).map((rate) => (
                <label
                  key={rate}
                  className={`flex items-center justify-center p-2.5 rounded-button border cursor-pointer text-xs font-bold transition-all ${
                    gstRate === rate
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-muted hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="gstRate"
                    value={rate}
                    checked={gstRate === rate}
                    onChange={() => setGstRate(rate)}
                    className="sr-only"
                  />
                  <span>{rate}% GST</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between pt-2 pb-1 border-t border-border">
            <div>
              <span className="text-xs font-bold text-text-primary block">Active in Catalog</span>
              <span className="text-[11px] text-text-muted">Available for billing when enabled</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="product-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary dark:bg-slate-700"></div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/settings/products')}
            >
              Cancel
            </Button>
            <Button
              id="product-save-btn"
              data-testid="product-save-btn"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Product
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

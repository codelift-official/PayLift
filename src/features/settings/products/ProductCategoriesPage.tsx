import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit2, Trash2, Check, X, FolderTree, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { phase11Api, ProductCategory } from '../../../api/phase11';

export const ProductCategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [newCatName, setNewCatName] = useState('');
  const [newCatOrder, setNewCatOrder] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState<number>(1);

  const { data: categories = [], isLoading } = useQuery<ProductCategory[]>({
    queryKey: ['productCategories'],
    queryFn: phase11Api.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (cat: Omit<ProductCategory, 'id'>) => phase11Api.createCategory(cat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      setNewCatName('');
      setIsAdding(false);
      toast.success('Category added');
    },
    onError: () => {
      toast.error('Failed to add category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductCategory> }) =>
      phase11Api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      setEditingId(null);
      toast.success('Category updated');
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => phase11Api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      toast.success('Category deleted');
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });

  const handleStartEdit = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditOrder(cat.displayOrder);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    updateMutation.mutate({
      id,
      data: { name: editName.trim(), displayOrder: editOrder },
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMutation.mutate({
      name: newCatName.trim(),
      displayOrder: newCatOrder,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/settings/products"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to products"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <PageHeader
            title="Product Categories"
            subtitle="Organize catalog products into hierarchical departments and sections"
          />
        </div>

        {!isAdding && (
          <Button
            id="add-category-btn"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              setNewCatOrder(categories.length + 1);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Category
          </Button>
        )}
      </div>

      {/* Add New Category Card */}
      {isAdding && (
        <Card className="border-border shadow-card p-4 animate-in fade-in duration-200" style={{ backgroundColor: 'var(--bg-card)' }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-muted">
              Add New Category
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <Input
                  id="new-category-name"
                  placeholder="e.g. Dairy & Frozen"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  type="number"
                  placeholder="Display order"
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={createMutation.isPending}>
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Categories List */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderTree className="w-10 h-10 mx-auto text-text-muted" />
            <h4 className="font-bold text-sm text-text-primary">No categories configured</h4>
            <p className="text-xs text-text-muted">
              Create product categories to organize items in your billing catalog.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-8">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <Input
                          type="number"
                          value={editOrder}
                          onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-bold text-text-muted shrink-0">
                        {cat.displayOrder}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-text-primary">{cat.name}</h4>
                        <span className="text-[11px] text-text-muted">Order: {cat.displayOrder}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="p-1.5 text-success hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition-colors"
                          title="Save changes"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete category "${cat.name}"?`)) {
                              deleteMutation.mutate(cat.id);
                            }
                          }}
                          className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

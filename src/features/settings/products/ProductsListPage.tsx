import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ChevronDown,
  Upload,
  Download,
  Edit2,
  FolderTree,
  Loader2,
  Tag,
  CheckCircle2,
  XCircle,
  Copy,
} from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Money } from '../../../components/Money';
import { phase11Api, Product, ProductCategory } from '../../../api/phase11';
import { ImportJsonModal, downloadProductsTemplate, copyTemplateJson } from './ImportJsonModal';

export const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedActive, setSelectedActive] = useState<string>('');
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['productCategories'],
    queryFn: phase11Api.getCategories,
  });

  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['products', search, selectedCategory, selectedActive],
    queryFn: () =>
      phase11Api.getProducts({
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        active: selectedActive === '' ? undefined : selectedActive === 'true',
      }),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Products Catalog"
          subtitle="Manage inventory items, pricing, SKU barcodes and GST taxes"
        />

        <div className="flex items-center gap-2.5">
          <Link to="/settings/product-categories">
            <Button variant="outline" size="sm">
              <FolderTree className="w-4 h-4 mr-1.5" />
              Categories
            </Button>
          </Link>

          {/* Add Product Dropdown */}
          <div className="relative">
            <Button
              id="add-product-dropdown-btn"
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>

            {addDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setAddDropdownOpen(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl shadow-xl border border-border py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <button
                    type="button"
                    id="add-product-manual-opt"
                    onClick={() => {
                      setAddDropdownOpen(false);
                      navigate('/settings/products/new');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    <span>Manual Entry</span>
                  </button>

                  <button
                    type="button"
                    id="add-product-import-opt"
                    onClick={() => {
                      setAddDropdownOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Import JSON</span>
                  </button>

                  <button
                    type="button"
                    id="add-product-copy-template-opt"
                    onClick={() => {
                      setAddDropdownOpen(false);
                      copyTemplateJson();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 transition-colors border-t border-border"
                  >
                    <Copy className="w-4 h-4 text-violet-600" />
                    <span>Copy Template JSON</span>
                  </button>

                  <button
                    type="button"
                    id="add-product-template-opt"
                    onClick={() => {
                      setAddDropdownOpen(false);
                      downloadProductsTemplate();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 transition-colors border-t border-border"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Download Template</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <Card className="border-border shadow-card p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <Input
                id="product-search-input"
                className="pl-9"
                placeholder="Search by name or SKU / barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <select
              id="product-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
              className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              id="product-status-filter"
              value={selectedActive}
              onChange={(e) => setSelectedActive(e.target.value)}
              aria-label="Filter by Status"
              className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 mx-auto text-text-muted" />
            <h4 className="font-bold text-sm text-text-primary">No products found</h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Add your first product manually or import a batch via JSON to get started with catalog-based checkout.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/settings/products/new')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="products-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase tracking-wider font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">GST</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-text-primary">
                      {p.name}
                      <span className="text-[10px] text-text-muted block font-normal">
                        Unit: {p.unit || 'Pcs'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-muted">
                      {p.sku || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-text-primary font-medium text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">
                      <Money value={p.sellingPrice} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-text-muted">
                      {p.gstRate}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.isActive ? (
                        <span className="inline-flex items-center text-success text-[11px] font-semibold gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-text-muted text-[11px] font-semibold gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>No</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/settings/products/${p.id}`}
                        className="p-1.5 text-text-muted hover:text-primary transition-colors inline-block"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Import Modal */}
      <ImportJsonModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

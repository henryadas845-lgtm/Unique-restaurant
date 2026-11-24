import React, { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import type { FoodCategory } from '../types';
import { slugify } from '../utils/format';
import { AdminLayout } from './AdminLayout';

export const ManageCategories: React.FC = () => {
  const { categories, foods, refreshPublicData, addToast } = useRestaurant();
  useDocumentTitle('Food Categories | Unique Restaurant Admin');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FoodCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodCategory | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setSortOrder(String(categories.length + 1));
    setModalOpen(true);
  };

  const openEdit = (cat: FoodCategory) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setSortOrder(String(cat.sort_order));
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editing) {
      setSlug(slugify(val));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slugify(slug || name);
    if (!name.trim() || !cleanSlug) {
      addToast({ type: 'error', title: 'Please provide a valid category name.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: cleanSlug,
        sort_order: Number(sortOrder) || 0,
      };
      if (editing) {
        await dataService.updateCategory(editing.id, payload);
        addToast({ type: 'success', title: `Category "${name.trim()}" updated` });
      } else {
        await dataService.createCategory(payload);
        addToast({ type: 'success', title: `Category "${name.trim()}" added` });
      }
      await refreshPublicData();
      setModalOpen(false);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to save category',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dataService.deleteCategory(deleteTarget.id);
      await refreshPublicData();
      addToast({ type: 'success', title: `Category "${deleteTarget.name}" deleted` });
      setDeleteTarget(null);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not delete category',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  return (
    <AdminLayout title="Food Categories">
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#252525]">Menu Categories</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Categories appear as filter tabs on your public menu page.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-[#F7F7F7] text-xs font-semibold text-neutral-600">
                <th className="py-3.5 px-5">Order</th>
                <th className="py-3.5 px-5">Category Name</th>
                <th className="py-3.5 px-5">Slug</th>
                <th className="py-3.5 px-5 text-right">Meals</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    No categories configured yet.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const count = foods.filter((f) => f.category_id === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-[#FFF3E8]/35 transition-colors">
                      <td className="py-3.5 px-5 tabular-nums text-neutral-500 font-medium">
                        {cat.sort_order}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#252525]">{cat.name}</td>
                      <td className="py-3.5 px-5 text-neutral-500 font-mono text-xs">{cat.slug}</td>
                      <td className="py-3.5 px-5 text-right tabular-nums">
                        <span className="px-2.5 py-1 rounded-lg bg-[#FFF3E8] text-[#E85D04] text-xs font-semibold">
                          {count}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(cat)}
                            aria-label={`Edit ${cat.name}`}
                            className="p-2 rounded-xl text-neutral-600 hover:text-[#E85D04] hover:bg-[#FFF3E8] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cat)}
                            aria-label={`Delete ${cat.name}`}
                            className="p-2 rounded-xl text-neutral-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-md overflow-hidden font-admin">
            <div className="px-6 py-4 bg-[#FFF3E8] border-b border-[#E85D04]/15 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#252525]">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:bg-white/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Rice Dishes"
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="rice-dishes"
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04] tabular-nums"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-[#F7F7F7] hover:bg-neutral-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] disabled:opacity-60 rounded-xl cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-sm p-6 font-admin">
            <h2 className="text-lg font-bold text-[#252525] mb-2">
              Delete &ldquo;{deleteTarget.name}&rdquo;?
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              Meals currently in this category will remain on your menu as Uncategorized until reassigned.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-[#F7F7F7] hover:bg-neutral-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl cursor-pointer"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

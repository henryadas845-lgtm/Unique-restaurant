import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { FoodImage } from '../components/FoodImage';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import type { FoodItem } from '../types';
import { formatNaira } from '../utils/format';
import { AdminLayout } from './AdminLayout';

export const ManageFoods: React.FC = () => {
  const { foods, categories, settings, refreshPublicData, addToast } = useRestaurant();
  const [searchParams, setSearchParams] = useSearchParams();
  useDocumentTitle('Manage Foods | Unique Restaurant Admin');

  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [filterCat, setFilterCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currency = settings?.currency_symbol || '₦';

  const openAddModal = () => {
    setEditingFood(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId(categories[0]?.id || '');
    setImageUrl('');
    setIsAvailable(true);
    setIsFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (food: FoodItem) => {
    setEditingFood(food);
    setName(food.name);
    setDescription(food.description);
    setPrice(String(food.price));
    setCategoryId(food.category_id || '');
    setImageUrl(food.image_url || '');
    setIsAvailable(food.is_available);
    setIsFeatured(food.is_featured);
    setModalOpen(true);
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new');
    const queryQ = searchParams.get('q');

    if (queryQ !== null) {
      setSearch(queryQ);
    }

    if (isNew === '1') {
      openAddModal();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    } else if (editId && foods.length > 0) {
      const target = foods.find((f) => f.id === editId);
      if (target) {
        openEditModal(target);
      }
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, foods]);

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foods.filter((f) => {
      const catMatch = filterCat === 'all' || f.category_id === filterCat;
      const searchMatch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.category?.name || '').toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [foods, search, filterCat]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await dataService.uploadImage(file, 'food-images');
      setImageUrl(uploadedUrl);
      addToast({ type: 'success', title: 'Food image uploaded' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Image upload failed',
        description: err instanceof Error ? err.message : 'Please try another image.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(price);
    if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) {
      addToast({ type: 'error', title: 'Please enter a valid meal name and Naira price.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: numericPrice,
        category_id: categoryId || null,
        image_url: imageUrl.trim(),
        is_available: isAvailable,
        is_featured: isFeatured,
      };

      if (editingFood) {
        await dataService.updateFood(editingFood.id, payload);
        addToast({ type: 'success', title: `${name.trim()} updated` });
      } else {
        await dataService.createFood(payload);
        addToast({ type: 'success', title: `${name.trim()} added to menu` });
      }
      await refreshPublicData();
      setModalOpen(false);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to save meal',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (food: FoodItem, field: 'is_available' | 'is_featured') => {
    try {
      await dataService.updateFood(food.id, { [field]: !food[field] });
      await refreshPublicData();
      addToast({
        type: 'success',
        title: `${food.name} updated`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dataService.deleteFood(deleteTarget.id);
      await refreshPublicData();
      addToast({ type: 'success', title: `${deleteTarget.name} removed` });
      setDeleteTarget(null);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not delete meal',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  return (
    <AdminLayout
      title="Manage Foods"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search meals by name or category..."
    >
      {/* Toolbar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search foods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F7F7F7] border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
            />
          </div>

          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            aria-label="Filter by category"
            className="px-3.5 py-2.5 text-sm bg-[#F7F7F7] border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
          >
            <option value="all">All Categories ({foods.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Meal</span>
        </button>
      </div>

      {/* Foods Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-[#F7F7F7] text-xs font-semibold text-neutral-600">
                <th className="py-3.5 px-4">Meal</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Available</th>
                <th className="py-3.5 px-4 text-center">Featured</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {filteredFoods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No food items match your current filter.
                  </td>
                </tr>
              ) : (
                filteredFoods.map((food) => (
                  <tr key={food.id} className="hover:bg-[#FFF3E8]/35 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/70 shrink-0">
                          <FoodImage
                            src={food.image_url}
                            alt={food.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-[#252525] truncate">{food.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{food.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F7F7F7] text-xs font-medium text-[#252525]">
                        {food.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-[#252525] whitespace-nowrap">
                      {formatNaira(food.price, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => void handleQuickToggle(food, 'is_available')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                          food.is_available
                            ? 'bg-[#267A43]/10 text-[#267A43] border border-[#267A43]/25'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {food.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => void handleQuickToggle(food, 'is_featured')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                          food.is_featured
                            ? 'bg-[#FFF3E8] text-[#E85D04] border border-[#E85D04]/30'
                            : 'bg-[#F7F7F7] text-neutral-500 border border-neutral-200'
                        }`}
                      >
                        {food.is_featured ? 'Featured' : 'Standard'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(food)}
                          aria-label={`Edit ${food.name}`}
                          className="p-2 rounded-xl text-neutral-600 hover:text-[#E85D04] hover:bg-[#FFF3E8] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(food)}
                          aria-label={`Delete ${food.name}`}
                          className="p-2 rounded-xl text-neutral-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Food Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto font-admin">
            <div className="px-6 py-4 bg-[#FFF3E8] border-b border-[#E85D04]/15 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#252525]">
                {editingFood ? `Edit ${editingFood.name}` : 'Add New Food Item'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:bg-white/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Food Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nigerian Jollof Rice"
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#252525] mb-1.5">
                    Price ({currency})
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#252525] mb-1.5">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Food Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the ingredients, preparation, or accompaniments..."
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              {/* Image Upload & Preview */}
              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Food Photograph
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
                    <FoodImage
                      src={imageUrl}
                      alt={name || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#E85D04] bg-[#FFF3E8] hover:bg-[#E85D04] hover:text-white rounded-xl cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading}
                        onChange={(e) => void handleImageFileChange(e)}
                        className="sr-only"
                      />
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste image URL"
                      className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#E85D04]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-[#252525] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 accent-[#267A43]"
                  />
                  <span>Available for ordering</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-[#252525] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#E85D04]"
                  />
                  <span>Feature on Homepage</span>
                </label>
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
                  disabled={saving || uploading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] disabled:opacity-60 rounded-xl cursor-pointer"
                >
                  {saving ? 'Saving...' : editingFood ? 'Save Changes' : 'Add Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-sm p-6 font-admin">
            <h2 className="text-lg font-bold text-[#252525] mb-2">
              Delete {deleteTarget.name}?
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              This will permanently remove this meal from your public menu. You can also mark it unavailable instead.
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
                Delete Meal
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

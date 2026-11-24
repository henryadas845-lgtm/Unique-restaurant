import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, UtensilsCrossed } from 'lucide-react';
import { FoodCard } from '../components/FoodCard';
import { FoodImage } from '../components/FoodImage';
import { PublicLayout } from '../components/PublicLayout';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const Menu: React.FC = () => {
  const { foods, categories, loading } = useRestaurant();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useDocumentTitle(
    'Our Menu | Unique Restaurant Osogbo',
    'Browse freshly prepared Nigerian rice dishes, Ewa Agoyin, soups, swallows, special meals, and chilled drinks at Unique Restaurant.'
  );

  const activeSlug = searchParams.get('category') || 'all';

  const handleSelectCategory = (slug: string) => {
    if (slug === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ category: slug }, { replace: true });
    }
  };

  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesCategory =
        activeSlug === 'all' || food.category?.slug === activeSlug;
      const matchesSearch =
        !q ||
        food.name.toLowerCase().includes(q) ||
        food.description.toLowerCase().includes(q) ||
        (food.category?.name || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [foods, activeSlug, searchQuery]);

  return (
    <PublicLayout>
      {/* Menu Hero */}
      <section className="relative bg-[#111111] text-white overflow-hidden">
        <div className="absolute inset-0">
          <FoodImage
            src="/src/assets/images/dish_jollof_rice_1795437995663.jpg"
            alt="Delicious Nigerian Jollof rice, chicken, and fried plantain"
            loading="eager"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#EA580C] mb-3">Fresh Daily Kitchen</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              Explore Our Delicious Menu
            </h1>
            <p className="text-base sm:text-lg text-neutral-200">
              Freshly prepared Nigerian favourites, made to satisfy your cravings.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar + Food Catalogue */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Controls Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-8 border-b border-neutral-200">
            {/* Functional Category Tabs */}
            <div
              role="tablist"
              aria-label="Food categories"
              className="flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeSlug === 'all'}
                onClick={() => handleSelectCategory('all')}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSlug === 'all'
                    ? 'bg-[#C81E1E] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All Meals
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSlug === cat.slug}
                  onClick={() => handleSelectCategory(cat.slug)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSlug === cat.slug
                      ? 'bg-[#C81E1E] text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meals..."
                aria-label="Search meals"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
              />
            </div>
          </div>

          {/* Count Summary */}
          <div className="py-5 flex items-center justify-between text-sm text-neutral-500">
            <span className="tabular-nums">
              Showing {filteredFoods.length} {filteredFoods.length === 1 ? 'meal' : 'meals'}
            </span>
            <span>Click any available meal to order via WhatsApp</span>
          </div>

          {/* Catalogue Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-neutral-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-neutral-200 rounded w-1/3" />
                    <div className="h-5 bg-neutral-200 rounded w-2/3" />
                    <div className="h-4 bg-neutral-100 rounded w-full" />
                    <div className="h-10 bg-neutral-200 rounded w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="border border-neutral-200 rounded-2xl p-12 text-center bg-neutral-50">
              <UtensilsCrossed className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-[#111111] mb-1">No matching meals found</h2>
              <p className="text-sm text-neutral-600 mb-5">
                Try clearing your search or selecting All Meals to view everything on our menu.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategory('all');
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-lg transition-colors"
              >
                Show All Meals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredFoods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};

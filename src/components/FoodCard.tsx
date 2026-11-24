import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import type { FoodItem } from '../types';
import { formatNaira } from '../utils/format';
import { FoodImage } from './FoodImage';

interface FoodCardProps {
  food: FoodItem;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food }) => {
  const { openOrderModal, settings } = useRestaurant();
  const currency = settings?.currency_symbol || '₦';
  const categoryName = food.category?.name || 'Nigerian Meal';

  return (
    <article
      className={`group bg-white border border-neutral-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 ${
        food.is_available ? 'hover:-translate-y-0.5 hover:shadow-md' : 'opacity-85'
      }`}
    >
      <div
        onClick={() => food.is_available && openOrderModal(food)}
        className={`relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 ${
          food.is_available ? 'cursor-pointer' : 'cursor-not-allowed'
        }`}
      >
        <FoodImage
          src={food.image_url}
          alt={food.name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            food.is_available ? 'group-hover:scale-[1.03]' : 'grayscale-[40%]'
          }`}
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Clean unboxed metadata (zero-pill discipline) */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
          <span className="font-medium text-neutral-600 truncate">{categoryName}</span>
          <span aria-hidden="true">&middot;</span>
          <span className={food.is_available ? 'text-emerald-700 font-medium' : 'text-[#C81E1E] font-medium'}>
            {food.is_available ? 'Available' : 'Currently Unavailable'}
          </span>
        </div>

        <h3
          onClick={() => food.is_available && openOrderModal(food)}
          className={`font-display text-lg font-semibold text-[#111111] leading-snug mb-2 ${
            food.is_available ? 'cursor-pointer group-hover:text-[#C81E1E] transition-colors' : ''
          }`}
        >
          {food.name}
        </h3>

        <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2 mb-5 flex-1">
          {food.description}
        </p>

        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-[#111111] tabular-nums whitespace-nowrap">
            {formatNaira(food.price, currency)}
          </span>

          <button
            type="button"
            disabled={!food.is_available}
            onClick={() => openOrderModal(food)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              food.is_available
                ? 'bg-[#C81E1E] hover:bg-[#991B1B] text-white cursor-pointer focus-visible:outline-[#C81E1E]'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {food.is_available ? 'Order Now' : 'Unavailable'}
          </button>
        </div>
      </div>
    </article>
  );
};

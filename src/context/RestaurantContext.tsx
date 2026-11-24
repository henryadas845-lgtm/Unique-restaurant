import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dataService } from '../lib/api';
import type {
  FoodCategory,
  FoodItem,
  RestaurantSettings,
  ToastMessage,
} from '../types';

interface RestaurantContextValue {
  settings: RestaurantSettings | null;
  categories: FoodCategory[];
  foods: FoodItem[];
  loading: boolean;
  error: string | null;
  refreshPublicData: () => Promise<void>;
  selectedFoodForOrder: FoodItem | null;
  openOrderModal: (food: FoodItem) => void;
  closeOrderModal: () => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFoodForOrder, setSelectedFoodForOrder] = useState<FoodItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const refreshPublicData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.fetchPublicBootstrap();
      setSettings(data.settings);
      setCategories(data.categories);
      setFoods(data.foods);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load menu and restaurant information right now.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPublicData();
  }, [refreshPublicData]);

  const openOrderModal = useCallback((food: FoodItem) => {
    if (!food.is_available) return;
    setSelectedFoodForOrder(food);
  }, []);

  const closeOrderModal = useCallback(() => {
    setSelectedFoodForOrder(null);
  }, []);

  return (
    <RestaurantContext.Provider
      value={{
        settings,
        categories,
        foods,
        loading,
        error,
        refreshPublicData,
        selectedFoodForOrder,
        openOrderModal,
        closeOrderModal,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return ctx;
}

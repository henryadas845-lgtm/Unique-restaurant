import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { OrderModal } from './OrderModal';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { error, refreshPublicData } = useRestaurant();

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      <Navbar />
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-[#991B1B]">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void refreshPublicData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
      <OrderModal />
    </div>
  );
};

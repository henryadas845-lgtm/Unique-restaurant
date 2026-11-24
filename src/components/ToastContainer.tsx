import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useRestaurant();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white ${
            toast.type === 'error'
              ? 'border-red-200'
              : toast.type === 'success'
              ? 'border-emerald-200'
              : 'border-orange-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-[#C81E1E] shrink-0 mt-0.5" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#111111]">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{toast.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

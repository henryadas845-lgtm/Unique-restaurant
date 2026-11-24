import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRestaurant } from '../context/RestaurantContext';

const WELCOME_MESSAGE = 'Hello! Welcome to our website. How can we help you today?';
const PREFILLED_ENQUIRY = 'Hello, I visited your website and would like to make an enquiry.';

function extractValidInternationalDigits(raw?: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  return digits.length >= 10 ? digits : '';
}

export const WhatsAppWidget: React.FC = () => {
  const { settings } = useRestaurant();
  const [isOpen, setIsOpen] = useState(false);

  const envOverride = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim();
  const configuredRaw = envOverride || settings?.whatsapp_number || '';
  const cleanDigits = extractValidInternationalDigits(configuredRaw);
  const isConfigured = cleanDigits.length >= 10;

  const restaurantName = settings?.restaurant_name || 'Unique Restaurant';
  const whatsappUrl = isConfigured
    ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(PREFILLED_ENQUIRY)}`
    : '';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="WhatsApp customer chat"
            className="w-80 sm:w-[340px] max-w-[calc(100vw-2.5rem)] bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-[#075E54] text-white px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <WhatsAppGlyph className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{restaurantName}</p>
                  <p className="text-xs text-emerald-100 truncate">WhatsApp Support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close WhatsApp chat box"
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-[#F5F2EB]">
              <div className="bg-white border border-neutral-200/80 rounded-xl rounded-tl-sm p-3.5 shadow-xs max-w-[92%]">
                <p className="text-sm text-[#111111] leading-relaxed">{WELCOME_MESSAGE}</p>
              </div>
            </div>

            {/* Action Area */}
            <div className="p-4 bg-white border-t border-neutral-100 space-y-2.5">
              {!isConfigured && import.meta.env.DEV && (
                <p className="text-xs text-[#991B1B] bg-red-50 border border-red-200 rounded-lg p-2.5 leading-relaxed">
                  WhatsApp number not configured. Set it in Admin &rarr; Restaurant Settings or via{' '}
                  <code className="font-mono">VITE_WHATSAPP_NUMBER</code>.
                </p>
              )}

              {isConfigured ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1EBE57] rounded-xl transition-colors duration-150 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Start Chat on WhatsApp</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-neutral-400 bg-neutral-100 rounded-xl cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Start Chat on WhatsApp</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close WhatsApp chat' : 'Open WhatsApp chat'}
        aria-expanded={isOpen}
        className="group w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE57] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] cursor-pointer"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-150" />
        ) : (
          <WhatsAppGlyph className="w-7 h-7 transition-transform duration-150 group-hover:scale-105" />
        )}
      </button>
    </div>
  );
};

const WhatsAppGlyph: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M16 3C8.82 3 3 8.82 3 16c0 2.45.68 4.83 1.97 6.9L3.2 29l6.26-1.64A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.62c-2.1 0-4.15-.57-5.94-1.64l-.43-.25-3.72.97.99-3.63-.28-.44A10.57 10.57 0 0 1 5.38 16C5.38 10.14 10.14 5.38 16 5.38S26.62 10.14 26.62 16 21.86 26.62 16 26.62zm5.82-7.93c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.36-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.56 1.14 3.07 1.3 3.29.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.15-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
  </svg>
);

import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';
import { sanitizeImageUrl } from '../utils/format';
import { AdminLayout } from './AdminLayout';

export const RestaurantSettingsPage: React.FC = () => {
  const { settings, refreshPublicData, addToast } = useRestaurant();
  useDocumentTitle('Restaurant Settings | Unique Restaurant Admin');

  const [restaurantName, setRestaurantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('500');
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setRestaurantName(settings.restaurant_name || '');
      setLogoUrl(settings.logo_url || '');
      setWhatsappNumber(settings.whatsapp_number || '');
      setPhoneNumber(settings.phone_number || '');
      setLocation(settings.location || '');
      setOpeningHours(settings.opening_hours || '');
      setDeliveryFee(String(settings.delivery_fee ?? 500));
      setCurrencySymbol(settings.currency_symbol || '₦');
      setSocialInstagram(settings.social_instagram || '');
      setSocialFacebook(settings.social_facebook || '');
      setSocialTiktok(settings.social_tiktok || '');
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await dataService.uploadImage(file, 'restaurant-assets');
      setLogoUrl(url);
      addToast({ type: 'success', title: 'Logo uploaded' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Logo upload failed',
        description: err instanceof Error ? err.message : 'Please try another image.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await dataService.updateSettings(settings.id, {
        restaurant_name: restaurantName.trim(),
        logo_url: logoUrl.trim() || null,
        whatsapp_number: whatsappNumber.trim(),
        phone_number: phoneNumber.trim(),
        location: location.trim(),
        opening_hours: openingHours.trim(),
        delivery_fee: Math.max(0, Number(deliveryFee) || 0),
        currency_symbol: currencySymbol.trim() || '₦',
        social_instagram: socialInstagram.trim(),
        social_facebook: socialFacebook.trim(),
        social_tiktok: socialTiktok.trim(),
      });
      await refreshPublicData();
      addToast({ type: 'success', title: 'Restaurant settings saved' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const safeLogo = sanitizeImageUrl(logoUrl);

  return (
    <AdminLayout title="Restaurant Settings">
      <div className="space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity & Logo */}
          <section className="bg-white border border-neutral-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#252525]">
                Business Identity &amp; Contact
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Update your restaurant name, location, WhatsApp order line, and operating hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  WhatsApp Ordering Number (digits with country code, e.g. 2349067566746)
                </label>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Public Contact Phone Display
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#252525] mb-1.5">
                Opening Hours
              </label>
              <input
                type="text"
                required
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="e.g. Monday – Saturday: 8:00 AM – 8:00 PM"
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-[#252525] mb-2">
                Restaurant Logo (Optional)
              </label>
              <div className="flex items-center gap-4">
                {safeLogo ? (
                  <img
                    src={safeLogo}
                    alt="Restaurant logo preview"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-neutral-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-dashed border-neutral-300 bg-[#F7F7F7] flex items-center justify-center text-xs text-neutral-400">
                    No Logo
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#E85D04] bg-[#FFF3E8] hover:bg-[#E85D04] hover:text-white rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading}
                      onChange={(e) => void handleLogoUpload(e)}
                      className="sr-only"
                    />
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Or paste logo URL"
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#E85D04]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Delivery & Currency */}
          <section className="bg-white border border-neutral-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
            <h2 className="text-base font-bold text-[#252525]">
              Pricing &amp; Social Media
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Delivery Fee ({currencySymbol})
                </label>
                <input
                  type="number"
                  min={0}
                  step="50"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  Facebook URL
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#252525] mb-1.5">
                  TikTok URL
                </label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@..."
                  value={socialTiktok}
                  onChange={(e) => setSocialTiktok(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] disabled:opacity-60 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* Supabase & Vercel Connection Info */}
        <section className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#252525] mb-2">
            Database &amp; Deployment Configuration
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed mb-3">
            {isSupabaseConfigured
              ? 'Connected directly to Supabase (Database, Auth, and Storage).'
              : 'Currently running in built-in preview storage mode. To connect your live Supabase project on Vercel, run the SQL scripts in supabase/migrations/ and supabase/seed.sql, provision your admin user with supabase/setup-admin.mjs, and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Environment Variables.'}
          </p>
          <div className="text-xs font-mono bg-[#F7F7F7] border border-neutral-200 rounded-xl p-3 text-neutral-700">
            VITE_SUPABASE_URL &middot; VITE_SUPABASE_ANON_KEY
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

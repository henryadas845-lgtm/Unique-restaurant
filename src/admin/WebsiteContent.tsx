import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { FoodImage } from '../components/FoodImage';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import { AdminLayout } from './AdminLayout';

export const WebsiteContent: React.FC = () => {
  const { settings, refreshPublicData, addToast } = useRestaurant();
  useDocumentTitle('Website Content | Unique Restaurant Admin');

  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubtext, setHeroSubtext] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [aboutStory, setAboutStory] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  const [visionStatement, setVisionStatement] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setHeroHeading(settings.hero_heading || '');
      setHeroSubtext(settings.hero_subtext || '');
      setHeroImageUrl(settings.hero_image_url || '');
      setDescription(settings.description || '');
      setAboutStory(settings.about_story || '');
      setMissionStatement(settings.mission_statement || '');
      setVisionStatement(settings.vision_statement || '');
    }
  }, [settings]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await dataService.uploadImage(file, 'restaurant-assets');
      setHeroImageUrl(url);
      addToast({ type: 'success', title: 'Hero image uploaded' });
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await dataService.updateSettings(settings.id, {
        hero_heading: heroHeading.trim(),
        hero_subtext: heroSubtext.trim(),
        hero_image_url: heroImageUrl.trim() || null,
        description: description.trim(),
        about_story: aboutStory.trim(),
        mission_statement: missionStatement.trim(),
        vision_statement: visionStatement.trim(),
      });
      await refreshPublicData();
      addToast({ type: 'success', title: 'Website content updated' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to save content',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Website Content">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Homepage Hero Section */}
        <section className="bg-white border border-neutral-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-[#252525]">Homepage Hero</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customize the main headline, introduction text, and background food photograph on your homepage.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252525] mb-1.5">
              Hero Headline
            </label>
            <input
              type="text"
              required
              value={heroHeading}
              onChange={(e) => setHeroHeading(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252525] mb-1.5">
              Hero Supporting Text
            </label>
            <textarea
              rows={3}
              required
              value={heroSubtext}
              onChange={(e) => setHeroSubtext(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252525] mb-2">
              Hero Photograph
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-full sm:w-56 aspect-video rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
                <FoodImage
                  src={heroImageUrl}
                  alt="Hero preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#E85D04] bg-[#FFF3E8] hover:bg-[#E85D04] hover:text-white rounded-xl cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload New Hero Image'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(e) => void handleHeroImageUpload(e)}
                    className="sr-only"
                  />
                </label>
                <input
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="Or paste image URL"
                  className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#E85D04]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About Us & Brand Story */}
        <section className="bg-white border border-neutral-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-[#252525]">About Us &amp; Brand Messaging</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Changes appear on the About Us page and footer description immediately.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252525] mb-1.5">
              Short Restaurant Description (Footer &amp; Summary)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252525] mb-1.5">
              Our Story
            </label>
            <textarea
              rows={6}
              value={aboutStory}
              onChange={(e) => setAboutStory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#252525] mb-1.5">
                Mission Statement
              </label>
              <textarea
                rows={3}
                value={missionStatement}
                onChange={(e) => setMissionStatement(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#252525] mb-1.5">
                Vision Statement
              </label>
              <textarea
                rows={3}
                value={visionStatement}
                onChange={(e) => setVisionStatement(e.target.value)}
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
            {saving ? 'Saving Changes...' : 'Save Website Content'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

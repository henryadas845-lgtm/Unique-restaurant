-- ============================================================================
-- Unique Restaurant — Supabase Storage Buckets & Access Policies
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('food-images', 'food-images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('restaurant-assets', 'restaurant-assets', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public Read Access for Food Images & Restaurant Assets
DROP POLICY IF EXISTS "Public read food images" ON storage.objects;
CREATE POLICY "Public read food images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('food-images', 'restaurant-assets'));

-- Admin-Only Upload, Update & Delete Access
DROP POLICY IF EXISTS "Admin upload food and restaurant assets" ON storage.objects;
CREATE POLICY "Admin upload food and restaurant assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('food-images', 'restaurant-assets')
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin update food and restaurant assets" ON storage.objects;
CREATE POLICY "Admin update food and restaurant assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('food-images', 'restaurant-assets')
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin delete food and restaurant assets" ON storage.objects;
CREATE POLICY "Admin delete food and restaurant assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('food-images', 'restaurant-assets')
    AND public.is_admin()
  );

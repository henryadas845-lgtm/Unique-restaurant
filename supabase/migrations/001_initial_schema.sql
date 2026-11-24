-- ============================================================================
-- Unique Restaurant — Initial Database Schema & Row Level Security (RLS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (Admin & Staff authorization linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Food Categories
CREATE TABLE IF NOT EXISTS public.food_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Foods
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  category_id UUID REFERENCES public.food_categories(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Orders (WhatsApp Order Requests logged prior to customer redirect)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address TEXT,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  preferred_delivery_time TEXT,
  additional_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  order_source TEXT NOT NULL DEFAULT 'whatsapp_request',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 6. Customer Enquiries
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Restaurant Settings & Editable Website Content (Single-row configuration)
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL DEFAULT 'Unique Restaurant',
  description TEXT NOT NULL DEFAULT 'Freshly prepared authentic Nigerian meals in Owo Ede, Osogbo, Osun State.',
  whatsapp_number TEXT NOT NULL DEFAULT '2349067566746',
  phone_number TEXT NOT NULL DEFAULT '+234 906 756 6746',
  location TEXT NOT NULL DEFAULT 'Owo Ede, Osogbo, Osun State, Nigeria',
  opening_hours TEXT NOT NULL DEFAULT 'Hours managed in Admin Dashboard',
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 500 CHECK (delivery_fee >= 0),
  currency_symbol TEXT NOT NULL DEFAULT '₦',
  logo_url TEXT,
  hero_image_url TEXT,
  hero_heading TEXT NOT NULL DEFAULT 'Delicious Nigerian Meals, Made With Love.',
  hero_subtext TEXT NOT NULL DEFAULT 'Experience the rich taste of authentic Nigerian cuisine. From delicious rice dishes to traditional local delicacies, there''s always something special waiting for you at Unique Restaurant.',
  about_story TEXT NOT NULL DEFAULT '',
  mission_statement TEXT NOT NULL DEFAULT 'To serve delicious, affordable, and satisfying Nigerian meals while creating a welcoming experience for every customer.',
  vision_statement TEXT NOT NULL DEFAULT 'To become a trusted and recognized food destination known for quality, great taste, and excellent customer satisfaction.',
  social_instagram TEXT DEFAULT '',
  social_facebook TEXT DEFAULT '',
  social_tiktok TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_foods_category_id ON public.foods(category_id);
CREATE INDEX IF NOT EXISTS idx_foods_is_featured ON public.foods(is_featured);
CREATE INDEX IF NOT EXISTS idx_foods_is_available ON public.foods(is_available);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_foods_updated_at ON public.foods;
CREATE TRIGGER trg_foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_restaurant_settings_updated_at ON public.restaurant_settings;
CREATE TRIGGER trg_restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin Authorization Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Food Categories Policies (Public read, Admin write)
DROP POLICY IF EXISTS "Public read food categories" ON public.food_categories;
CREATE POLICY "Public read food categories"
  ON public.food_categories FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admin manage food categories" ON public.food_categories;
CREATE POLICY "Admin manage food categories"
  ON public.food_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Foods Policies (Public read, Admin write)
DROP POLICY IF EXISTS "Public read foods" ON public.foods;
CREATE POLICY "Public read foods"
  ON public.foods FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admin manage foods" ON public.foods;
CREATE POLICY "Admin manage foods"
  ON public.foods FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders Policies (Customers can INSERT order requests; only Admins can SELECT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Public create order request" ON public.orders;
CREATE POLICY "Public create order request"
  ON public.orders FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND subtotal >= 0
    AND total_amount >= 0
  );

DROP POLICY IF EXISTS "Admin read orders" ON public.orders;
CREATE POLICY "Admin read orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;
CREATE POLICY "Admin delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- Order Items Policies (Customers can INSERT items for their order; only Admins can read/modify)
DROP POLICY IF EXISTS "Public create order items" ON public.order_items;
CREATE POLICY "Public create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (quantity > 0 AND unit_price >= 0 AND subtotal >= 0);

DROP POLICY IF EXISTS "Admin read order items" ON public.order_items;
CREATE POLICY "Admin read order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin delete order items" ON public.order_items;
CREATE POLICY "Admin delete order items"
  ON public.order_items FOR DELETE
  USING (public.is_admin());

-- Enquiries Policies (Customers can INSERT enquiries; only Admins can read/update/delete)
DROP POLICY IF EXISTS "Public submit enquiry" ON public.enquiries;
CREATE POLICY "Public submit enquiry"
  ON public.enquiries FOR INSERT
  WITH CHECK (is_read = FALSE);

DROP POLICY IF EXISTS "Admin read enquiries" ON public.enquiries;
CREATE POLICY "Admin read enquiries"
  ON public.enquiries FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin update enquiries" ON public.enquiries;
CREATE POLICY "Admin update enquiries"
  ON public.enquiries FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin delete enquiries" ON public.enquiries;
CREATE POLICY "Admin delete enquiries"
  ON public.enquiries FOR DELETE
  USING (public.is_admin());

-- Restaurant Settings Policies (Public read, Admin write)
DROP POLICY IF EXISTS "Public read restaurant settings" ON public.restaurant_settings;
CREATE POLICY "Public read restaurant settings"
  ON public.restaurant_settings FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admin update restaurant settings" ON public.restaurant_settings;
CREATE POLICY "Admin update restaurant settings"
  ON public.restaurant_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- ListIQ MASTER SETUP SCRIPT (FIXED ORDER)
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'business_owner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.plan_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.listing_status AS ENUM ('active', 'pending', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.claim_status AS ENUM ('unclaimed', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.article_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Essential Functions (Defined before policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Create Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role public.app_role NOT NULL DEFAULT 'user',
  plan public.plan_tier NOT NULL DEFAULT 'free',
  subscription_plan TEXT DEFAULT 'free',
  is_suspended BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  city TEXT,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  listing_count INT NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  keywords TEXT[] DEFAULT '{}',
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'Ghana',
  phone TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  hours_of_operation JSONB DEFAULT '{}'::jsonb,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claim_status public.claim_status NOT NULL DEFAULT 'unclaimed',
  status public.listing_status NOT NULL DEFAULT 'pending',
  plan_tier public.plan_tier NOT NULL DEFAULT 'free',
  views_count INT NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.claim_status NOT NULL DEFAULT 'pending',
  verification_document_url TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT,
  excerpt TEXT,
  cover_image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  status public.article_status NOT NULL DEFAULT 'draft',
  source_url TEXT,
  read_minutes INT NOT NULL DEFAULT 5,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories public read" ON public.categories;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Active listings public read" ON public.listings;
CREATE POLICY "Active listings public read" ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Owners and admins update listings" ON public.listings;
CREATE POLICY "Owners and admins update listings" ON public.listings FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users create listings" ON public.listings;
CREATE POLICY "Authenticated users create listings" ON public.listings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Claims viewable by owner and admin" ON public.claim_requests;
CREATE POLICY "Claims viewable by owner and admin" ON public.claim_requests FOR SELECT USING (auth.uid() = claimant_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Seed Data
INSERT INTO public.categories (name, slug, icon)
VALUES 
  ('Agriculture & Agribusiness', 'agriculture', 'agriculture'),
  ('Arts & Entertainment', 'arts-entertainment', 'theater_comedy'),
  ('Automotive', 'automotive', 'directions_car'),
  ('Beauty & Personal Care', 'beauty-care', 'content_cut'),
  ('Business & Professional Services', 'business-services', 'business_center'),
  ('Construction & Real Estate', 'construction-real-estate', 'apartment'),
  ('Education', 'education', 'school'),
  ('Energy & Utilities', 'energy-utilities', 'bolt'),
  ('Fashion & Apparel', 'fashion-apparel', 'checkroom'),
  ('Finance & Insurance', 'finance-insurance', 'payments'),
  ('Food & Beverage', 'food-beverage', 'restaurant'),
  ('Government & Public Services', 'government-public-services', 'account_balance'),
  ('Health & Wellness', 'health-wellness', 'medical_services'),
  ('Hospitality & Tourism', 'hospitality-tourism', 'hotel'),
  ('Logistics & Transportation', 'logistics-transportation', 'local_shipping'),
  ('Manufacturing', 'manufacturing', 'factory'),
  ('Media & Communications', 'media-communications', 'campaign'),
  ('Nonprofit & Social Organizations', 'nonprofit-social', 'volunteer_activism'),
  ('Pets & Animal Care', 'pets-animal-care', 'pets'),
  ('Religion & Spirituality', 'religion-spirituality', 'church'),
  ('Shopping & Retail', 'shopping-retail', 'shopping_bag'),
  ('Sports & Recreation', 'sports-recreation', 'sports_soccer'),
  ('Technology & Software', 'technology-software', 'developer_mode'),
  ('Other', 'other', 'more_horiz')
ON CONFLICT (slug) DO NOTHING;

-- 6. Storage Configuration
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('listings', 'listings', true),
  ('claims', 'claims', true),
  ('articles', 'articles', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Access Listings" ON storage.objects;
CREATE POLICY "Public Access Listings" ON storage.objects FOR SELECT USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "Public Access Claims" ON storage.objects;
CREATE POLICY "Public Access Claims" ON storage.objects FOR SELECT USING (bucket_id = 'claims');

DROP POLICY IF EXISTS "Public Access Articles" ON storage.objects;
CREATE POLICY "Public Access Articles" ON storage.objects FOR SELECT USING (bucket_id = 'articles');

-- 7. Realtime Replication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.profiles, 
    public.listings, 
    public.reviews, 
    public.claim_requests,
    public.articles;
COMMIT;

-- 8. Final Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';

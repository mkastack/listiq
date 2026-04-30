-- ============================================
-- ListIQ Phase 1 Schema
-- ============================================

-- Roles enum + table (separate from profiles for security)
CREATE TYPE public.app_role AS ENUM ('user', 'business_owner', 'admin');
CREATE TYPE public.plan_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE public.listing_status AS ENUM ('active', 'pending', 'rejected', 'suspended');
CREATE TYPE public.claim_status AS ENUM ('unclaimed', 'pending', 'approved', 'rejected');
CREATE TYPE public.article_status AS ENUM ('draft', 'published', 'archived');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  plan public.plan_tier NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table, security definer pattern)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Categories
CREATE TABLE public.categories (
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

-- Listings
CREATE TABLE public.listings (
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
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_city ON public.listings(city);
CREATE INDEX idx_listings_featured ON public.listings(is_featured) WHERE is_featured = true;
CREATE INDEX idx_listings_search ON public.listings USING gin(to_tsvector('english', name || ' ' || COALESCE(description,'') || ' ' || COALESCE(category,'')));

-- Reviews
CREATE TABLE public.reviews (
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

-- Articles
CREATE TABLE public.articles (
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

-- Saved listings
CREATE TABLE public.saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

-- Listing views (analytics)
CREATE TABLE public.listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- categories (public read, admin write)
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- listings: public can read active; owners/admins manage
CREATE POLICY "Active listings public read" ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = owner_id OR auth.uid() = claimed_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners and admins update listings" ON public.listings FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = claimed_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners and admins delete listings" ON public.listings FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- reviews
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- articles: published public; authors/admins manage
CREATE POLICY "Published articles public read" ON public.articles FOR SELECT USING (status = 'published' OR auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users create articles" ON public.articles FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors and admins update articles" ON public.articles FOR UPDATE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors and admins delete articles" ON public.articles FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- saved_listings
CREATE POLICY "Users view own saved" ON public.saved_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own saved" ON public.saved_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved" ON public.saved_listings FOR DELETE USING (auth.uid() = user_id);

-- listing_views: insert public, read by listing owner/admin
CREATE POLICY "Anyone can log views" ON public.listing_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners/admins read views" ON public.listing_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_views.listing_id AND (l.owner_id = auth.uid() OR l.claimed_by = auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile + default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_articles_updated BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Recompute listing rating on review change
CREATE OR REPLACE FUNCTION public.recompute_listing_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE _id UUID;
BEGIN
  _id := COALESCE(NEW.listing_id, OLD.listing_id);
  UPDATE public.listings
  SET rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE listing_id = _id), 0),
      rating_count = (SELECT COUNT(*) FROM public.reviews WHERE listing_id = _id)
  WHERE id = _id;
  RETURN NULL;
END; $$;
CREATE TRIGGER tg_reviews_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.recompute_listing_rating();

-- Recompute category listing_count
CREATE OR REPLACE FUNCTION public.recompute_category_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.categories c
  SET listing_count = (SELECT COUNT(*) FROM public.listings l WHERE l.category = c.slug AND l.status = 'active');
  RETURN NULL;
END; $$;
CREATE TRIGGER tg_listings_cat_count AFTER INSERT OR UPDATE OF status, category OR DELETE ON public.listings FOR EACH STATEMENT EXECUTE FUNCTION public.recompute_category_count();

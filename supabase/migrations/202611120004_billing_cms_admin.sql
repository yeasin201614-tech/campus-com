-- =============================================================================
-- Campus.com Migration 0004: Subscriptions, Payments, Website CMS, Media, Support, Audit
-- Tables: subscription_plans, subscriptions, payments, platform_settings,
--         website_pages, media_assets, support_tickets, audit_logs
-- =============================================================================

-- 23. subscription_plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  price_monthly numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (price_monthly >= 0),
  price_yearly numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (price_yearly >= 0),
  currency text NOT NULL DEFAULT 'USD',
  max_students integer,
  max_departments integer,
  storage_limit_gb integer NOT NULL DEFAULT 10 CHECK (storage_limit_gb > 0),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled_modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 22. subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  provider text NOT NULL DEFAULT 'manual',
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id)
);

-- 24. payments (Never store raw card details; only non-sensitive masked display / provider tokens)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  paid_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'pending',
  invoice_number text NOT NULL UNIQUE,
  payment_method_summary text,
  provider text NOT NULL DEFAULT 'manual',
  provider_payment_id text,
  invoice_url text,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 25. platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general' CHECK (
    category IN ('branding', 'theme', 'navigation', 'footer', 'contact', 'social', 'seo', 'features', 'maintenance', 'general')
  ),
  description text DEFAULT '',
  is_public boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 26. website_pages
CREATE TABLE IF NOT EXISTS public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text DEFAULT '',
  hero_title text DEFAULT '',
  hero_description text DEFAULT '',
  hero_cta_text text DEFAULT 'Join Campus.com',
  hero_cta_url text DEFAULT '/register',
  banner_image_url text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  is_published boolean NOT NULL DEFAULT true,
  show_in_nav boolean NOT NULL DEFAULT true,
  nav_order integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 27. media_assets
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  bucket_name text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes >= 0),
  asset_type text NOT NULL DEFAULT 'image' CHECK (asset_type IN ('logo', 'banner', 'avatar', 'post_media', 'event_cover', 'marketplace', 'resource', 'attachment', 'image')),
  alt_text text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 28. support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  ticket_type text NOT NULL DEFAULT 'support' CHECK (
    ticket_type IN ('support', 'contact', 'post_report', 'listing_report', 'user_report', 'billing')
  ),
  target_type text,
  target_id uuid,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status public.ticket_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 29. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers
DROP TRIGGER IF EXISTS trg_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trg_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_website_pages_updated_at ON public.website_pages;
CREATE TRIGGER trg_website_pages_updated_at BEFORE UPDATE ON public.website_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER trg_media_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_audit_logs_updated_at ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_updated_at BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

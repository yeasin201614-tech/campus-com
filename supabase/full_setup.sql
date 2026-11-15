
-- =========================================
-- FILE: 202611120001_enums_and_core_tables.sql
-- =========================================
-- =============================================================================
-- Campus.com Migration 0001: Extensions, Enums, and Core Identity/University Tables
-- Tables: profiles, universities, university_members, departments,
--         academic_programs, student_records, faculty_records
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'university_admin',
    'department_admin',
    'teacher',
    'student',
    'club_moderator'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM (
    'pending',
    'verified',
    'suspended',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.post_type AS ENUM (
    'discussion',
    'announcement',
    'resource',
    'poll',
    'achievement'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.visibility_scope AS ENUM (
    'public',
    'university',
    'department',
    'group',
    'private'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM (
    'draft',
    'published',
    'ongoing',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.registration_status AS ENUM (
    'registered',
    'attended',
    'cancelled',
    'saved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notice_priority AS ENUM (
    'normal',
    'important',
    'urgent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notice_category AS ENUM (
    'university',
    'department',
    'academic',
    'exam',
    'deadline',
    'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM (
    'active',
    'reserved',
    'sold',
    'removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM (
    'monthly',
    'yearly'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'trialing',
    'active',
    'past_due',
    'cancelled',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) >= 1),
  username text UNIQUE,
  avatar_url text,
  cover_url text,
  global_role public.user_role NOT NULL DEFAULT 'student',
  primary_university_id uuid,
  bio text DEFAULT '',
  phone text,
  skills text[] NOT NULL DEFAULT '{}',
  interests text[] NOT NULL DEFAULT '{}',
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  privacy_settings jsonb NOT NULL DEFAULT '{"show_email": false, "show_phone": false, "profile_visibility": "university"}'::jsonb,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  online_status boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. universities
CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug text NOT NULL UNIQUE,
  short_code text NOT NULL UNIQUE,
  domain text,
  description text DEFAULT '',
  logo_url text,
  banner_url text,
  brand_color text NOT NULL DEFAULT '#101B62',
  secondary_color text NOT NULL DEFAULT '#6038ED',
  address text,
  city text,
  country text,
  website_url text,
  contact_email text,
  contact_phone text,
  established_year integer CHECK (established_year IS NULL OR (established_year >= 1000 AND established_year <= 2100)),
  student_capacity integer NOT NULL DEFAULT 5000 CHECK (student_capacity > 0),
  status public.verification_status NOT NULL DEFAULT 'pending',
  is_verified boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  current_academic_year text NOT NULL DEFAULT '2026-2027',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_primary_university_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_primary_university_id_fkey
  FOREIGN KEY (primary_university_id) REFERENCES public.universities(id) ON DELETE SET NULL;

-- 4. departments (created before university_members FK)
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) >= 2),
  code text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  head_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  building text,
  contact_email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, code),
  UNIQUE (university_id, slug)
);

-- 3. university_members
CREATE TABLE IF NOT EXISTS public.university_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'student',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  is_primary boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, user_id),
  CONSTRAINT university_members_not_super_admin CHECK (role <> 'super_admin')
);

-- 5. academic_programs
CREATE TABLE IF NOT EXISTS public.academic_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  degree_level text NOT NULL CHECK (degree_level IN ('certificate', 'associate', 'bachelor', 'master', 'doctoral')),
  duration_years numeric(3,1) NOT NULL DEFAULT 4.0 CHECK (duration_years > 0),
  academic_year text NOT NULL DEFAULT '2026-2027',
  total_credits integer NOT NULL DEFAULT 120 CHECK (total_credits > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, code)
);

-- 6. student_records
CREATE TABLE IF NOT EXISTS public.student_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.academic_programs(id) ON DELETE SET NULL,
  student_id_number text NOT NULL,
  academic_year text NOT NULL DEFAULT '2026-2027',
  semester text NOT NULL DEFAULT '1st Year',
  enrollment_year integer CHECK (enrollment_year IS NULL OR (enrollment_year >= 1950 AND enrollment_year <= 2100)),
  graduation_year integer CHECK (graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= 2110)),
  gpa_summary numeric(3,2) CHECK (gpa_summary IS NULL OR (gpa_summary >= 0 AND gpa_summary <= 4.00)),
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, student_id_number),
  UNIQUE (university_id, user_id)
);

-- 7. faculty_records
CREATE TABLE IF NOT EXISTS public.faculty_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  employee_id_number text NOT NULL,
  title text NOT NULL DEFAULT 'Lecturer',
  designation text NOT NULL DEFAULT 'Faculty Member',
  specialization text DEFAULT '',
  office_location text,
  office_hours text,
  assigned_classes jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, employee_id_number),
  UNIQUE (university_id, user_id)
);

-- Updated_at triggers for tables 1-7
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_universities_updated_at ON public.universities;
CREATE TRIGGER trg_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_university_members_updated_at ON public.university_members;
CREATE TRIGGER trg_university_members_updated_at BEFORE UPDATE ON public.university_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_departments_updated_at ON public.departments;
CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_academic_programs_updated_at ON public.academic_programs;
CREATE TRIGGER trg_academic_programs_updated_at BEFORE UPDATE ON public.academic_programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_student_records_updated_at ON public.student_records;
CREATE TRIGGER trg_student_records_updated_at BEFORE UPDATE ON public.student_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_faculty_records_updated_at ON public.faculty_records;
CREATE TRIGGER trg_faculty_records_updated_at BEFORE UPDATE ON public.faculty_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =========================================
-- FILE: 202611120002_community_events_notices.sql
-- =========================================
-- =============================================================================
-- Campus.com Migration 0002: Community, Groups, Events, Notices & Follows
-- Tables: community_groups, group_members, campus_posts, post_comments,
--         post_likes, events, event_registrations, notices, user_follows
-- =============================================================================

-- 11. community_groups
CREATE TABLE IF NOT EXISTS public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Club',
  avatar_url text,
  banner_url text,
  is_private boolean NOT NULL DEFAULT false,
  requires_approval boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  members_count integer NOT NULL DEFAULT 0 CHECK (members_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, slug)
);

-- 12. group_members
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'owner')),
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'banned')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- 8. campus_posts
CREATE TABLE IF NOT EXISTS public.campus_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type public.post_type NOT NULL DEFAULT 'discussion',
  visibility public.visibility_scope NOT NULL DEFAULT 'university',
  title text,
  content text NOT NULL CHECK (char_length(trim(content)) >= 1),
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  resource_url text,
  tags text[] NOT NULL DEFAULT '{}',
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count integer NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  shares_count integer NOT NULL DEFAULT 0 CHECK (shares_count >= 0),
  is_pinned boolean NOT NULL DEFAULT false,
  is_flagged boolean NOT NULL DEFAULT false,
  report_count integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  moderation_status text NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. post_comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) >= 1),
  is_flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. post_likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- 13. events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE SET NULL,
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) >= 2),
  slug text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  cover_image_url text,
  location text NOT NULL DEFAULT 'Main Campus',
  is_online boolean NOT NULL DEFAULT false,
  meeting_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  registered_count integer NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  is_free boolean NOT NULL DEFAULT true,
  ticket_price numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (ticket_price >= 0),
  qr_secret text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status public.event_status NOT NULL DEFAULT 'published',
  is_featured boolean NOT NULL DEFAULT false,
  visibility public.visibility_scope NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, slug),
  CONSTRAINT events_valid_time_range CHECK (ends_at >= starts_at)
);

-- 14. event_registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  status public.registration_status NOT NULL DEFAULT 'registered',
  is_favorite boolean NOT NULL DEFAULT false,
  qr_token text UNIQUE DEFAULT ('CMP-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12))),
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- 15. notices
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) >= 2),
  content text NOT NULL CHECK (char_length(trim(content)) >= 2),
  category public.notice_category NOT NULL DEFAULT 'university',
  priority public.notice_priority NOT NULL DEFAULT 'normal',
  audience_role public.user_role,
  attachment_url text,
  is_pinned boolean NOT NULL DEFAULT false,
  is_global boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notices_scope_check CHECK (is_global = true OR university_id IS NOT NULL)
);

-- Auxiliary relation: user_follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> following_id)
);

-- Triggers
DROP TRIGGER IF EXISTS trg_community_groups_updated_at ON public.community_groups;
CREATE TRIGGER trg_community_groups_updated_at BEFORE UPDATE ON public.community_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_group_members_updated_at ON public.group_members;
CREATE TRIGGER trg_group_members_updated_at BEFORE UPDATE ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_campus_posts_updated_at ON public.campus_posts;
CREATE TRIGGER trg_campus_posts_updated_at BEFORE UPDATE ON public.campus_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_post_comments_updated_at ON public.post_comments;
CREATE TRIGGER trg_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_post_likes_updated_at ON public.post_likes;
CREATE TRIGGER trg_post_likes_updated_at BEFORE UPDATE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER trg_event_registrations_updated_at BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notices_updated_at ON public.notices;
CREATE TRIGGER trg_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_follows_updated_at ON public.user_follows;
CREATE TRIGGER trg_user_follows_updated_at BEFORE UPDATE ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =========================================
-- FILE: 202611120003_messaging_marketplace_notifs.sql
-- =========================================
-- =============================================================================
-- Campus.com Migration 0003: Messaging, Marketplace, and Notifications
-- Tables: conversations, conversation_members, messages,
--         marketplace_categories, marketplace_listings, notifications
-- =============================================================================

-- 16. conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE,
  is_group boolean NOT NULL DEFAULT false,
  title text,
  avatar_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 17. conversation_members
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  is_muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- 18. messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text DEFAULT '',
  attachment_url text,
  attachment_type text CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'file', 'listing', 'event')),
  read_by jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_has_body CHECK (char_length(trim(coalesce(content, ''))) > 0 OR attachment_url IS NOT NULL)
);

-- 20. marketplace_categories (created before marketplace_listings FK)
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text NOT NULL DEFAULT 'Package',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 19. marketplace_listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) >= 2),
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'service')),
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  location_text text DEFAULT 'Main Campus',
  status public.listing_status NOT NULL DEFAULT 'active',
  is_negotiable boolean NOT NULL DEFAULT true,
  views_count integer NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  is_flagged boolean NOT NULL DEFAULT false,
  report_count integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 21. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('message', 'event', 'notice', 'group', 'community', 'marketplace', 'system', 'billing')),
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers
DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_conversation_members_updated_at ON public.conversation_members;
CREATE TRIGGER trg_conversation_members_updated_at BEFORE UPDATE ON public.conversation_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_marketplace_categories_updated_at ON public.marketplace_categories;
CREATE TRIGGER trg_marketplace_categories_updated_at BEFORE UPDATE ON public.marketplace_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER trg_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =========================================
-- FILE: 202611120004_billing_cms_admin.sql
-- =========================================
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


-- =========================================
-- FILE: 202611120005_indexes_and_functions.sql
-- =========================================
-- =============================================================================
-- Campus.com Migration 0005: Indexes, Counter Maintenance Triggers, Auth Sync & RPCs
-- =============================================================================

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(primary_university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(global_role);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_universities_status ON public.universities(status, is_verified);
CREATE INDEX IF NOT EXISTS idx_universities_name_trgm ON public.universities USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_university_members_user ON public.university_members(user_id, university_id);
CREATE INDEX IF NOT EXISTS idx_university_members_uni_role ON public.university_members(university_id, role, status);

CREATE INDEX IF NOT EXISTS idx_departments_uni ON public.departments(university_id);
CREATE INDEX IF NOT EXISTS idx_departments_name_trgm ON public.departments USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_student_records_uni_dept ON public.student_records(university_id, department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_records_uni_dept ON public.faculty_records(university_id, department_id);

CREATE INDEX IF NOT EXISTS idx_campus_posts_uni_created ON public.campus_posts(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campus_posts_group_created ON public.campus_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campus_posts_author ON public.campus_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_community_groups_uni ON public.community_groups(university_id, is_active);
CREATE INDEX IF NOT EXISTS idx_community_groups_name_trgm ON public.community_groups USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_events_uni_starts ON public.events(university_id, starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_events_status_starts ON public.events(status, starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON public.events USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_notices_uni_published ON public.notices(university_id, is_pinned DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_global ON public.notices(is_global, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_uni_status ON public.marketplace_listings(university_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_cat ON public.marketplace_listings(category_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_uni_status ON public.subscriptions(university_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_uni_created ON public.payments(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_uni ON public.audit_logs(university_id, created_at DESC);

-- Counter & Activity Triggers
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.campus_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.campus_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.campus_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.campus_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

CREATE OR REPLACE FUNCTION public.sync_group_members_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group uuid;
BEGIN
  target_group := COALESCE(NEW.group_id, OLD.group_id);
  UPDATE public.community_groups
  SET members_count = (
    SELECT count(*)::integer FROM public.group_members
    WHERE group_id = target_group AND status = 'approved'
  )
  WHERE id = target_group;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_members_count ON public.group_members;
CREATE TRIGGER trg_group_members_count
AFTER INSERT OR UPDATE OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.sync_group_members_count();

CREATE OR REPLACE FUNCTION public.sync_event_registrations_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_event uuid;
BEGIN
  target_event := COALESCE(NEW.event_id, OLD.event_id);
  UPDATE public.events
  SET registered_count = (
    SELECT count(*)::integer FROM public.event_registrations
    WHERE event_id = target_event AND status IN ('registered', 'attended')
  )
  WHERE id = target_event;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_registrations_count ON public.event_registrations;
CREATE TRIGGER trg_event_registrations_count
AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.sync_event_registrations_count();

CREATE OR REPLACE FUNCTION public.sync_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN char_length(trim(coalesce(NEW.content, ''))) > 0 THEN left(NEW.content, 120)
      WHEN NEW.attachment_url IS NOT NULL THEN '[Attachment]'
      ELSE ''
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_conversation_preview ON public.messages;
CREATE TRIGGER trg_messages_conversation_preview
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.sync_conversation_last_message();

-- Handle new auth.users signup automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.user_role := 'student';
  raw_role text;
  uni_id uuid;
  full_name_val text;
BEGIN
  raw_role := COALESCE(NEW.raw_user_meta_data ->> 'requested_role', 'student');
  -- Never allow self-assigning super_admin or university_admin on public signup
  IF raw_role IN ('student', 'teacher', 'club_moderator') THEN
    requested_role := raw_role::public.user_role;
  ELSE
    requested_role := 'student';
  END IF;

  BEGIN
    uni_id := NULLIF(NEW.raw_user_meta_data ->> 'university_id', '')::uuid;
  EXCEPTION WHEN others THEN
    uni_id := NULL;
  END;

  full_name_val := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    split_part(COALESCE(NEW.email, 'user@campus.com'), '@', 1)
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, global_role, primary_university_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@campus.local'),
    full_name_val,
    NEW.raw_user_meta_data ->> 'avatar_url',
    requested_role,
    uni_id
  )
  ON CONFLICT (id) DO NOTHING;

  IF uni_id IS NOT NULL THEN
    INSERT INTO public.university_members (university_id, user_id, role, status, is_primary)
    VALUES (uni_id, NEW.id, requested_role, 'pending', true)
    ON CONFLICT (university_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Privilege escalation guard on profiles (prevents JWT users promoting themselves)
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role public.user_role;
BEGIN
  -- Allow service role / postgres migrations (auth.uid() IS NULL)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT global_role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'super_admin' THEN
    IF NEW.global_role IS DISTINCT FROM OLD.global_role THEN
      RAISE EXCEPTION 'Only Super Admin can change global_role';
    END IF;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Only administrators can change verification status';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Only administrators can change active status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- QR Event Check-In RPC (atomic, server-authorized)
CREATE OR REPLACE FUNCTION public.check_in_event_qr(p_qr_token text, p_event_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg public.event_registrations%ROWTYPE;
  v_ev public.events%ROWTYPE;
  v_caller uuid := auth.uid();
  v_can_scan boolean := false;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_reg
  FROM public.event_registrations
  WHERE qr_token = p_qr_token
    AND (p_event_id IS NULL OR event_id = p_event_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or unknown QR ticket token');
  END IF;

  SELECT * INTO v_ev FROM public.events WHERE id = v_reg.event_id;

  SELECT (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller AND global_role = 'super_admin')
    OR v_ev.organizer_id = v_caller
    OR EXISTS (
      SELECT 1 FROM public.university_members
      WHERE university_id = v_ev.university_id
        AND user_id = v_caller
        AND role IN ('university_admin', 'department_admin', 'teacher', 'club_moderator')
        AND status = 'verified'
    )
  ) INTO v_can_scan;

  IF NOT v_can_scan THEN
    RAISE EXCEPTION 'Not authorized to check in attendees for this event';
  END IF;

  IF v_reg.status = 'attended' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_checked_in', true,
      'checked_in_at', v_reg.checked_in_at,
      'registration_id', v_reg.id
    );
  END IF;

  UPDATE public.event_registrations
  SET status = 'attended',
      checked_in_at = now(),
      checked_in_by = v_caller
  WHERE id = v_reg.id;

  RETURN jsonb_build_object(
    'ok', true,
    'already_checked_in', false,
    'registration_id', v_reg.id,
    'event_title', v_ev.title,
    'attendee_id', v_reg.user_id
  );
END;
$$;


-- =========================================
-- FILE: 202611120006_rls_policies.sql
-- =========================================
-- =============================================================================
-- Campus.com Migration 0006: Row Level Security (RLS) on All 29+ Tables
-- =============================================================================

-- Security Definer Helpers (prevent RLS recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND global_role = 'super_admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_university(p_university_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.university_members
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND status IN ('verified', 'pending')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_member_of_university(p_university_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.university_members
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND status = 'verified'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_university_admin(p_university_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.university_members
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND role = 'university_admin'
      AND status = 'verified'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_department_admin(p_university_id uuid, p_department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_university_admin(p_university_id) OR EXISTS (
    SELECT 1 FROM public.university_members
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND role = 'department_admin'
      AND status = 'verified'
      AND (p_department_id IS NULL OR department_id = p_department_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_university_staff(p_university_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.university_members
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND role IN ('university_admin', 'department_admin', 'teacher')
      AND status = 'verified'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_moderator(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND role IN ('moderator', 'owner')
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  );
$$;

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. profiles policies
CREATE POLICY "profiles_select_authorized" ON public.profiles FOR SELECT USING (
  id = auth.uid()
  OR public.is_super_admin()
  OR (
    auth.uid() IS NOT NULL AND (
      (privacy_settings ->> 'profile_visibility') = 'public'
      OR (
        primary_university_id IS NOT NULL
        AND public.is_member_of_university(primary_university_id)
      )
    )
  )
);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "profiles_delete_super_admin" ON public.profiles FOR DELETE USING (public.is_super_admin());

-- 2. universities policies
CREATE POLICY "universities_select_public_or_member" ON public.universities FOR SELECT USING (
  status = 'verified' OR created_by = auth.uid() OR public.is_member_of_university(id)
);
CREATE POLICY "universities_insert_authenticated" ON public.universities FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (public.is_super_admin() OR created_by = auth.uid())
);
CREATE POLICY "universities_update_admin" ON public.universities FOR UPDATE USING (
  public.is_university_admin(id) OR public.is_super_admin()
);
CREATE POLICY "universities_delete_super_admin" ON public.universities FOR DELETE USING (public.is_super_admin());

-- 3. university_members policies
CREATE POLICY "university_members_select_same_uni" ON public.university_members FOR SELECT USING (
  user_id = auth.uid() OR public.is_member_of_university(university_id)
);
CREATE POLICY "university_members_insert_self_or_admin" ON public.university_members FOR INSERT WITH CHECK (
  public.is_university_admin(university_id)
  OR (user_id = auth.uid() AND role IN ('student', 'teacher', 'club_moderator') AND status = 'pending')
);
CREATE POLICY "university_members_update_admin" ON public.university_members FOR UPDATE USING (
  public.is_university_admin(university_id) OR public.is_super_admin()
);
CREATE POLICY "university_members_delete_admin" ON public.university_members FOR DELETE USING (
  public.is_university_admin(university_id) OR public.is_super_admin()
);

-- 4. departments policies
CREATE POLICY "departments_select_public_or_member" ON public.departments FOR SELECT USING (
  is_active = true OR public.is_member_of_university(university_id)
);
CREATE POLICY "departments_manage_admin" ON public.departments FOR ALL USING (
  public.is_university_admin(university_id) OR public.is_department_admin(university_id, id)
) WITH CHECK (
  public.is_university_admin(university_id) OR public.is_department_admin(university_id, id)
);

-- 5. academic_programs policies
CREATE POLICY "academic_programs_select" ON public.academic_programs FOR SELECT USING (
  is_active = true OR public.is_member_of_university(university_id)
);
CREATE POLICY "academic_programs_manage" ON public.academic_programs FOR ALL USING (
  public.is_department_admin(university_id, department_id)
) WITH CHECK (
  public.is_department_admin(university_id, department_id)
);

-- 6. student_records policies (strict isolation: self or same-university admin/staff)
CREATE POLICY "student_records_select_isolated" ON public.student_records FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_university_admin(university_id)
  OR public.is_department_admin(university_id, department_id)
  OR public.is_university_staff(university_id)
);
CREATE POLICY "student_records_insert_self_or_admin" ON public.student_records FOR INSERT WITH CHECK (
  public.is_department_admin(university_id, department_id)
  OR (user_id = auth.uid() AND public.is_member_of_university(university_id))
);
CREATE POLICY "student_records_update_admin" ON public.student_records FOR UPDATE USING (
  public.is_department_admin(university_id, department_id) OR public.is_university_admin(university_id)
);
CREATE POLICY "student_records_delete_admin" ON public.student_records FOR DELETE USING (
  public.is_university_admin(university_id)
);

-- 7. faculty_records policies
CREATE POLICY "faculty_records_select_same_uni" ON public.faculty_records FOR SELECT USING (
  user_id = auth.uid() OR public.is_member_of_university(university_id)
);
CREATE POLICY "faculty_records_manage_admin" ON public.faculty_records FOR ALL USING (
  public.is_department_admin(university_id, department_id) OR public.is_university_admin(university_id)
) WITH CHECK (
  public.is_department_admin(university_id, department_id) OR public.is_university_admin(university_id)
);

-- 11. community_groups policies
CREATE POLICY "community_groups_select" ON public.community_groups FOR SELECT USING (
  (is_private = false AND is_active = true)
  OR public.is_member_of_university(university_id)
  OR public.is_group_member(id)
);
CREATE POLICY "community_groups_insert_member" ON public.community_groups FOR INSERT WITH CHECK (
  public.is_member_of_university(university_id) AND created_by = auth.uid()
);
CREATE POLICY "community_groups_update_mod_or_admin" ON public.community_groups FOR UPDATE USING (
  created_by = auth.uid() OR public.is_group_moderator(id) OR public.is_university_admin(university_id)
);
CREATE POLICY "community_groups_delete_admin" ON public.community_groups FOR DELETE USING (
  public.is_university_admin(university_id) OR created_by = auth.uid()
);

-- 12. group_members policies
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_group_member(group_id)
  OR public.is_super_admin()
);
CREATE POLICY "group_members_insert_self_or_mod" ON public.group_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR public.is_group_moderator(group_id)
);
CREATE POLICY "group_members_update_mod" ON public.group_members FOR UPDATE USING (
  public.is_group_moderator(group_id)
);
CREATE POLICY "group_members_delete_self_or_mod" ON public.group_members FOR DELETE USING (
  user_id = auth.uid() OR public.is_group_moderator(group_id)
);

-- 8. campus_posts policies
CREATE POLICY "campus_posts_select" ON public.campus_posts FOR SELECT USING (
  (visibility = 'public' AND moderation_status <> 'hidden')
  OR (visibility = 'university' AND public.is_member_of_university(university_id) AND moderation_status <> 'hidden')
  OR (visibility = 'department' AND public.is_member_of_university(university_id))
  OR (visibility = 'group' AND group_id IS NOT NULL AND public.is_group_member(group_id))
  OR author_id = auth.uid()
  OR public.is_university_admin(university_id)
);
CREATE POLICY "campus_posts_insert_member" ON public.campus_posts FOR INSERT WITH CHECK (
  author_id = auth.uid() AND public.is_member_of_university(university_id)
);
CREATE POLICY "campus_posts_update_author_or_mod" ON public.campus_posts FOR UPDATE USING (
  author_id = auth.uid()
  OR public.is_university_admin(university_id)
  OR (group_id IS NOT NULL AND public.is_group_moderator(group_id))
);
CREATE POLICY "campus_posts_delete_author_or_admin" ON public.campus_posts FOR DELETE USING (
  author_id = auth.uid() OR public.is_university_admin(university_id)
);

-- 9. post_comments policies
CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.campus_posts p WHERE p.id = post_id)
);
CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK (
  author_id = auth.uid()
);
CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE USING (
  author_id = auth.uid() OR public.is_super_admin()
);

-- 10. post_likes policies
CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE USING (user_id = auth.uid());

-- 13. events policies
CREATE POLICY "events_select" ON public.events FOR SELECT USING (
  (visibility = 'public' AND status IN ('published', 'ongoing', 'completed'))
  OR public.is_member_of_university(university_id)
  OR organizer_id = auth.uid()
);
CREATE POLICY "events_insert_authorized" ON public.events FOR INSERT WITH CHECK (
  organizer_id = auth.uid()
  AND public.is_member_of_university(university_id)
);
CREATE POLICY "events_update_organizer_or_admin" ON public.events FOR UPDATE USING (
  organizer_id = auth.uid()
  OR public.is_university_admin(university_id)
  OR public.is_department_admin(university_id, department_id)
  OR (group_id IS NOT NULL AND public.is_group_moderator(group_id))
);
CREATE POLICY "events_delete_admin" ON public.events FOR DELETE USING (
  organizer_id = auth.uid() OR public.is_university_admin(university_id)
);

-- 14. event_registrations policies
CREATE POLICY "event_registrations_select" ON public.event_registrations FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_university_admin(university_id)
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
);
CREATE POLICY "event_registrations_insert_self" ON public.event_registrations FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "event_registrations_update_self_or_staff" ON public.event_registrations FOR UPDATE USING (
  user_id = auth.uid() OR public.is_university_staff(university_id)
);
CREATE POLICY "event_registrations_delete_self" ON public.event_registrations FOR DELETE USING (
  user_id = auth.uid() OR public.is_university_admin(university_id)
);

-- 15. notices policies
CREATE POLICY "notices_select" ON public.notices FOR SELECT USING (
  is_global = true
  OR (university_id IS NOT NULL AND public.is_member_of_university(university_id))
);
CREATE POLICY "notices_insert_staff" ON public.notices FOR INSERT WITH CHECK (
  author_id = auth.uid()
  AND (
    (is_global = true AND public.is_super_admin())
    OR (university_id IS NOT NULL AND public.is_university_staff(university_id))
  )
);
CREATE POLICY "notices_update_staff" ON public.notices FOR UPDATE USING (
  author_id = auth.uid() OR public.is_university_admin(university_id)
);
CREATE POLICY "notices_delete_staff" ON public.notices FOR DELETE USING (
  author_id = auth.uid() OR public.is_university_admin(university_id)
);

-- user_follows policies
CREATE POLICY "user_follows_select" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "user_follows_insert_own" ON public.user_follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "user_follows_delete_own" ON public.user_follows FOR DELETE USING (follower_id = auth.uid());

-- 16, 17, 18. Private Messaging (STRICTLY isolated to conversation_members)
CREATE POLICY "conversations_select_member" ON public.conversations FOR SELECT USING (
  created_by = auth.uid() OR public.is_conversation_member(id)
);
CREATE POLICY "conversations_insert_auth" ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND created_by = auth.uid()
);
CREATE POLICY "conversations_update_member" ON public.conversations FOR UPDATE USING (
  public.is_conversation_member(id)
);

CREATE POLICY "conversation_members_select" ON public.conversation_members FOR SELECT USING (
  user_id = auth.uid() OR public.is_conversation_member(conversation_id)
);
CREATE POLICY "conversation_members_insert" ON public.conversation_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
  OR public.is_conversation_member(conversation_id)
);
CREATE POLICY "conversation_members_update_own" ON public.conversation_members FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "messages_select_member" ON public.messages FOR SELECT USING (
  public.is_conversation_member(conversation_id)
);
CREATE POLICY "messages_insert_member" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND public.is_conversation_member(conversation_id)
);
CREATE POLICY "messages_update_sender_or_member" ON public.messages FOR UPDATE USING (
  sender_id = auth.uid() OR public.is_conversation_member(conversation_id)
);

-- 19 & 20. Marketplace
CREATE POLICY "marketplace_categories_select" ON public.marketplace_categories FOR SELECT USING (true);
CREATE POLICY "marketplace_categories_admin" ON public.marketplace_categories FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "marketplace_listings_select" ON public.marketplace_listings FOR SELECT USING (
  status = 'active'
  OR seller_id = auth.uid()
  OR public.is_university_admin(university_id)
);
CREATE POLICY "marketplace_listings_insert" ON public.marketplace_listings FOR INSERT WITH CHECK (
  seller_id = auth.uid() AND public.is_member_of_university(university_id)
);
CREATE POLICY "marketplace_listings_update" ON public.marketplace_listings FOR UPDATE USING (
  seller_id = auth.uid() OR public.is_university_admin(university_id)
);
CREATE POLICY "marketplace_listings_delete" ON public.marketplace_listings FOR DELETE USING (
  seller_id = auth.uid() OR public.is_university_admin(university_id)
);

-- 21. notifications
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (
  user_id = auth.uid() OR public.is_super_admin()
);
CREATE POLICY "notifications_insert_admin_or_self" ON public.notifications FOR INSERT WITH CHECK (
  user_id = auth.uid() OR public.is_super_admin() OR (university_id IS NOT NULL AND public.is_university_staff(university_id))
);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 22, 23, 24. Billing & Subscriptions
CREATE POLICY "subscription_plans_select_public" ON public.subscription_plans FOR SELECT USING (
  is_active = true OR public.is_super_admin()
);
CREATE POLICY "subscription_plans_manage_super_admin" ON public.subscription_plans FOR ALL USING (
  public.is_super_admin()
) WITH CHECK (public.is_super_admin());

CREATE POLICY "subscriptions_select_uni_admin" ON public.subscriptions FOR SELECT USING (
  public.is_university_admin(university_id) OR public.is_super_admin()
);
CREATE POLICY "subscriptions_manage_super_admin" ON public.subscriptions FOR ALL USING (
  public.is_super_admin()
) WITH CHECK (public.is_super_admin());

CREATE POLICY "payments_select_uni_admin" ON public.payments FOR SELECT USING (
  public.is_university_admin(university_id) OR public.is_super_admin()
);
CREATE POLICY "payments_manage_super_admin" ON public.payments FOR ALL USING (
  public.is_super_admin()
) WITH CHECK (public.is_super_admin());

-- 25 & 26. CMS & Settings (ONLY Super Admin writes; public only reads is_public/published)
CREATE POLICY "platform_settings_select_public_or_super" ON public.platform_settings FOR SELECT USING (
  is_public = true OR public.is_super_admin()
);
CREATE POLICY "platform_settings_manage_super_admin" ON public.platform_settings FOR ALL USING (
  public.is_super_admin()
) WITH CHECK (public.is_super_admin());

CREATE POLICY "website_pages_select_published_or_super" ON public.website_pages FOR SELECT USING (
  is_published = true OR public.is_super_admin()
);
CREATE POLICY "website_pages_manage_super_admin" ON public.website_pages FOR ALL USING (
  public.is_super_admin()
) WITH CHECK (public.is_super_admin());

-- 27. media_assets
CREATE POLICY "media_assets_select" ON public.media_assets FOR SELECT USING (
  uploaded_by = auth.uid()
  OR university_id IS NULL
  OR public.is_member_of_university(university_id)
);
CREATE POLICY "media_assets_insert" ON public.media_assets FOR INSERT WITH CHECK (
  uploaded_by = auth.uid()
);
CREATE POLICY "media_assets_delete" ON public.media_assets FOR DELETE USING (
  uploaded_by = auth.uid() OR public.is_super_admin()
);

-- 28. support_tickets
CREATE POLICY "support_tickets_select" ON public.support_tickets FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_super_admin()
  OR (university_id IS NOT NULL AND public.is_university_admin(university_id))
);
CREATE POLICY "support_tickets_insert_any" ON public.support_tickets FOR INSERT WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);
CREATE POLICY "support_tickets_update_admin" ON public.support_tickets FOR UPDATE USING (
  public.is_super_admin() OR (university_id IS NOT NULL AND public.is_university_admin(university_id))
);

-- 29. audit_logs (read-only for admins; written by server / service role)
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs FOR SELECT USING (
  public.is_super_admin() OR (university_id IS NOT NULL AND public.is_university_admin(university_id))
);
CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs FOR INSERT WITH CHECK (
  public.is_super_admin() OR actor_id = auth.uid()
);


-- =========================================
-- FILE: 202611120007_storage_and_realtime.sql
-- =========================================
-- =============================================================================
-- Campus.com Migration 0007: Storage Buckets, Storage RLS, and Realtime Publication
-- =============================================================================

-- Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('university-branding', 'university-branding', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('campus-media', 'campus-media', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('chat-attachments', 'chat-attachments', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: avatars
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_upload" ON storage.objects;
CREATE POLICY "avatars_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_user_update_delete" ON storage.objects;
CREATE POLICY "avatars_user_update_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

-- Storage Policies: university-branding
DROP POLICY IF EXISTS "branding_public_read" ON storage.objects;
CREATE POLICY "branding_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'university-branding');

DROP POLICY IF EXISTS "branding_admin_write" ON storage.objects;
CREATE POLICY "branding_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'university-branding'
    AND auth.uid() IS NOT NULL
    AND (
      public.is_super_admin()
      OR public.is_university_admin(((storage.foldername(name))[1])::uuid)
    )
  );

-- Storage Policies: campus-media
DROP POLICY IF EXISTS "campus_media_read" ON storage.objects;
CREATE POLICY "campus_media_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "campus_media_auth_upload" ON storage.objects;
CREATE POLICY "campus_media_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'campus-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "campus_media_owner_delete" ON storage.objects;
CREATE POLICY "campus_media_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'campus-media'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

-- Storage Policies: chat-attachments (private bucket!)
DROP POLICY IF EXISTS "chat_attachments_member_read" ON storage.objects;
CREATE POLICY "chat_attachments_member_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "chat_attachments_member_upload" ON storage.objects;
CREATE POLICY "chat_attachments_member_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

-- Enable Realtime on live tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- =========================================
-- FILE: seed.sql
-- =========================================
-- =============================================================================
-- Campus.com Seed Data (Idempotent)
-- Populates Subscription Plans, Marketplace Categories, Platform Settings,
-- Website CMS Pages, Sample Universities, Departments, and Academic Programs.
-- =============================================================================

-- 1. Subscription Plans (Free, Standard, Premium, Enterprise)
INSERT INTO public.subscription_plans (
  id, name, slug, description, price_monthly, price_yearly, currency,
  max_students, max_departments, storage_limit_gb, features, enabled_modules, is_popular, is_active, sort_order
)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'Free',
    'free',
    'Essential digital campus starter for emerging clubs and pilot institutions.',
    0.00, 0.00, 'USD',
    500, 5, 5,
    '["Basic campus profile", "Limited community feed", "Basic announcements", "Up to 500 students", "5 GB media storage"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": false, "messaging": true, "analytics": false, "custom_branding": false}'::jsonb,
    false, true, 1
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Standard',
    'standard',
    'Complete campus community, events with QR check-in, and department workflows.',
    99.00, 990.00, 'USD',
    5000, 25, 50,
    '["Full community & clubs", "Events & QR check-in", "Campus marketplace", "Enhanced analytics", "50 GB storage", "Email support"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": true, "messaging": true, "analytics": true, "custom_branding": false}'::jsonb,
    false, true, 2
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Premium',
    'premium',
    'Multi-department governance, advanced analytics, custom campus branding, and priority SLA.',
    249.00, 2490.00, 'USD',
    25000, 100, 250,
    '["Advanced analytics & exports", "Extended management tools", "Custom university branding", "Priority 24/7 support", "250 GB storage", "Role-based verification workflows"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": true, "messaging": true, "analytics": true, "custom_branding": true}'::jsonb,
    true, true, 3
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'Enterprise',
    'enterprise',
    'Unlimited multi-campus architecture, SSO, dedicated support engineer, and custom SLAs.',
    599.00, 5990.00, 'USD',
    NULL, NULL, 1024,
    '["Unlimited students & departments", "Custom institutional features", "Dedicated account manager", "Advanced compliance & audit exports", "1 TB+ storage", "Custom domain & SSO"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": true, "messaging": true, "analytics": true, "custom_branding": true}'::jsonb,
    false, true, 4
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  enabled_modules = EXCLUDED.enabled_modules,
  is_popular = EXCLUDED.is_popular;

-- 2. Marketplace Categories
INSERT INTO public.marketplace_categories (id, name, slug, description, icon, sort_order)
VALUES
  ('22222222-2222-4222-8222-222222222201', 'Used Books', 'used-books', 'Textbooks, reference manuals, and semester course packs.', 'BookOpen', 1),
  ('22222222-2222-4222-8222-222222222202', 'Study Materials', 'study-materials', 'Lab kits, calculators, lecture notes, and project hardware.', 'FileText', 2),
  ('22222222-2222-4222-8222-222222222203', 'Student Services', 'student-services', 'Tutoring, design help, coding mentorship, and proofreading.', 'Briefcase', 3),
  ('22222222-2222-4222-8222-222222222204', 'Electronics & Gear', 'electronics-gear', 'Laptops, monitors, dorm accessories, and campus essentials.', 'Laptop', 4)
ON CONFLICT (slug) DO NOTHING;

-- 3. Platform Settings (Public CMS, Branding, Theme, Navigation, Footer, Maintenance, Feature Flags)
INSERT INTO public.platform_settings (setting_key, setting_value, category, description, is_public)
VALUES
  (
    'branding',
    '{
      "name": "Campus.com",
      "tagline": "Connect â€¢ Collaborate â€¢ Grow",
      "logo_url": null,
      "support_email": "support@campus.com",
      "copyright": "Â© 2026 Campus.com Inc. All rights reserved."
    }'::jsonb,
    'branding', 'Global platform name, tagline, and brand assets', true
  ),
  (
    'theme',
    '{
      "primary": "#101B62",
      "secondary": "#6038ED",
      "accent": "#19B99A",
      "background": "#F7F8FC",
      "surface": "#FFFFFF"
    }'::jsonb,
    'theme', 'Global Campus.com palette tokens', true
  ),
  (
    'navigation',
    '{
      "items": [
        {"label": "Home", "href": "/"},
        {"label": "Features", "href": "/features"},
        {"label": "Universities", "href": "/universities"},
        {"label": "Events", "href": "/events"},
        {"label": "Community", "href": "/community"},
        {"label": "Marketplace", "href": "/marketplace"},
        {"label": "Pricing", "href": "/pricing"}
      ]
    }'::jsonb,
    'navigation', 'Public header navigation links', true
  ),
  (
    'footer',
    '{
      "description": "A unified multi-university digital campus connecting students, faculty, clubs, and institutional administrators.",
      "columns": [
        {"title": "Platform", "links": [{"label": "About Campus.com", "href": "/about"}, {"label": "Features", "href": "/features"}, {"label": "Universities", "href": "/universities"}, {"label": "Pricing", "href": "/pricing"}]},
        {"title": "Community", "links": [{"label": "Campus Community", "href": "/community"}, {"label": "Upcoming Events", "href": "/events"}, {"label": "Marketplace", "href": "/marketplace"}, {"label": "Help Center", "href": "/help"}]},
        {"title": "Legal & Support", "links": [{"label": "Contact Us", "href": "/contact"}, {"label": "Privacy Policy", "href": "/privacy"}, {"label": "Terms & Conditions", "href": "/terms"}]}
      ]
    }'::jsonb,
    'footer', 'Dynamic footer columns and links', true
  ),
  (
    'contact',
    '{
      "email": "hello@campus.com",
      "phone": "+1 (800) 555-0199",
      "address": "420 University Innovation Way, Cambridge, MA 02139",
      "office_hours": "Monâ€“Fri, 9:00 AM â€“ 6:00 PM EST"
    }'::jsonb,
    'contact', 'Public contact details', true
  ),
  (
    'social',
    '{
      "twitter": "https://x.com/campuscom",
      "linkedin": "https://linkedin.com/company/campuscom",
      "github": "https://github.com/campuscom",
      "youtube": "https://youtube.com/@campuscom"
    }'::jsonb,
    'social', 'Official social links', true
  ),
  (
    'seo',
    '{
      "title": "Campus.com â€” Connect â€¢ Collaborate â€¢ Grow",
      "description": "Your Complete Multi-University Campus Community and Institutional Management Platform."
    }'::jsonb,
    'seo', 'Default SEO title and meta description', true
  ),
  (
    'feature_flags',
    '{
      "marketplace_enabled": true,
      "realtime_chat_enabled": true,
      "qr_checkin_enabled": true,
      "public_university_signup": true,
      "mobile_offline_cache": true
    }'::jsonb,
    'features', 'Platform-wide feature availability toggles', true
  ),
  (
    'maintenance_mode',
    '{
      "enabled": false,
      "message": "Campus.com is undergoing scheduled maintenance to upgrade your campus experience. We will be back shortly."
    }'::jsonb,
    'maintenance', 'Global maintenance mode switch', true
  )
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Website Pages (Dynamic CMS Content for Public Website)
INSERT INTO public.website_pages (
  slug, title, subtitle, hero_title, hero_description, hero_cta_text, hero_cta_url, sections, seo_title, seo_description, is_published, show_in_nav, nav_order
)
VALUES
  (
    'home',
    'Home',
    'Your Complete Campus Community Platform',
    'Your Complete Campus Community Platform',
    'A unified platform for students, faculty, clubs, and institutions to connect, collaborate, and grow together.',
    'Join Campus.com',
    '/register',
    '[
      {"id": "highlights", "heading": "A Smarter Campus Life Together!", "items": ["Stay Updated with verified notices", "Make Connections across clubs & peers", "Manage Campus Life & QR events", "Build Your Future with faculty & resources"]},
      {"id": "testimonials", "heading": "Trusted by Leading Universities", "items": [
        {"quote": "Campus.com replaced four disconnected tools and lifted student event attendance by 42% in one semester.", "author": "Dr. Elena Vance", "role": "Dean of Student Life, Northbridge University"},
        {"quote": "Finding study groups, buying semester textbooks, and checking department notices in one app changed everything.", "author": "Rahat Karim", "role": "Computer Science Senior, Metropolitan Tech"},
        {"quote": "Our club approvals and QR event check-ins went from spreadsheets to instant mobile workflows.", "author": "Sofia Mendoza", "role": "President, Robotics Society"}
      ]},
      {"id": "faq", "heading": "Frequently Asked Questions", "items": [
        {"q": "How does multi-university data isolation work?", "a": "Every university operates inside strict PostgreSQL Row Level Security boundaries so student records, private notices, and admin reports stay completely isolated."},
        {"q": "Can students use both web and iOS/Android apps?", "a": "Yes. Campus.com shares a real-time Supabase backend across Next.js web and Expo React Native mobile apps."},
        {"q": "How does QR event check-in work?", "a": "When a student registers for an event, a unique cryptographically random QR ticket token is generated and verified at the door by event organizers."},
        {"q": "Can our university customize branding and domains?", "a": "Premium and Enterprise plans support custom university logos, accent colors, and dedicated institutional settings."}
      ]}
    ]'::jsonb,
    'Campus.com â€” Connect â€¢ Collaborate â€¢ Grow',
    'Unified multi-university campus community, notice board, events, marketplace, and institutional management platform.',
    true, true, 1
  ),
  (
    'about',
    'About Campus.com',
    'Built for modern universities and thriving student ecosystems',
    'Reimagining the Connected Digital Campus',
    'Campus.com brings together institutional administration, academic communication, and vibrant student communities under one secure roof.',
    'Explore Universities',
    '/universities',
    '[{"id": "mission", "heading": "Our Mission", "body": "Higher education thrives when students, faculty, and administrators collaborate effortlessly without fragmented tools."}]'::jsonb,
    'About Campus.com',
    'Learn how Campus.com connects universities, faculty, and students.',
    true, false, 2
  ),
  (
    'features',
    'Features',
    'Everything your campus needs across Web, Mobile, and Super Admin',
    'Built for Every Role on Campus',
    'From Super Admin institutional governance and Department academic boards to real-time student chat and QR event check-ins.',
    'Get Started',
    '/register',
    '[]'::jsonb,
    'Features â€” Campus.com',
    'Explore mobile app, web portal, university management, and Super Admin features.',
    true, true, 2
  ),
  (
    'privacy',
    'Privacy Policy',
    'How Campus.com safeguards institutional and student data',
    'Privacy & Multi-Tenant Data Protection',
    'We enforce strict database-level tenant isolation, encrypted transport, and never store raw payment card numbers.',
    'Contact Privacy Team',
    '/contact',
    '[{"id": "policy", "heading": "Data Governance", "body": "All university records are isolated using PostgreSQL Row Level Security. Private chats and student academic details are visible only to authorized members within the same institution."}]'::jsonb,
    'Privacy Policy â€” Campus.com',
    'Campus.com privacy policy and security commitments.',
    true, false, 98
  ),
  (
    'terms',
    'Terms & Conditions',
    'Platform terms for institutions, faculty, and students',
    'Terms of Service',
    'Guidelines for respectful campus collaboration, marketplace safety, and institutional subscription terms.',
    'Contact Support',
    '/contact',
    '[{"id": "terms", "heading": "Acceptable Campus Use", "body": "All members must uphold academic integrity, university community standards, and lawful marketplace conduct."}]'::jsonb,
    'Terms & Conditions â€” Campus.com',
    'Terms of service for Campus.com.',
    true, false, 99
  )
ON CONFLICT (slug) DO NOTHING;

-- 5. Verified Sample Universities (Public Showcase & Onboarding Selection)
INSERT INTO public.universities (
  id, name, slug, short_code, domain, description, brand_color, secondary_color,
  city, country, website_url, contact_email, established_year, student_capacity, status, is_verified, is_featured, current_academic_year
)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    'Northbridge University',
    'northbridge-university',
    'NBU',
    'northbridge.edu',
    'A premier research institution uniting engineering, liberal arts, and vibrant student innovation labs.',
    '#101B62', '#6038ED',
    'Cambridge', 'United States', 'https://northbridge.edu', 'admissions@northbridge.edu',
    1964, 18000, 'verified', true, true, '2026-2027'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'Metropolitan Institute of Technology',
    'metropolitan-tech',
    'MITX',
    'metrotech.edu',
    'Leading STEM and digital entrepreneurship university empowering hands-on builders and clubs.',
    '#101B62', '#19B99A',
    'Toronto', 'Canada', 'https://metrotech.edu', 'campus@metrotech.edu',
    1982, 12500, 'verified', true, true, '2026-2027'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'Pacific Crest University',
    'pacific-crest-university',
    'PCU',
    'pacificcrest.edu',
    'Coastal multidisciplinary campus known for marine sciences, design, and global exchange communities.',
    '#172554', '#7C3AED',
    'Seattle', 'United States', 'https://pacificcrest.edu', 'hello@pacificcrest.edu',
    1975, 9500, 'verified', true, true, '2026-2027'
  )
ON CONFLICT (slug) DO NOTHING;

-- 6. Sample Departments & Academic Programs
INSERT INTO public.departments (id, university_id, name, code, slug, description, building, contact_email)
VALUES
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', 'Computer Science & AI', 'CSE', 'computer-science-ai', 'Software engineering, artificial intelligence, and distributed systems.', 'Turing Hall', 'cse@northbridge.edu'),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333301', 'Business & Economics', 'BBA', 'business-economics', 'Finance, management science, and startup incubation.', 'Keynes Center', 'business@northbridge.edu'),
  ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333302', 'Electrical & Robotics Engineering', 'EEE', 'electrical-robotics', 'Embedded systems, autonomous robotics, and clean energy.', 'Tesla Wing', 'eee@metrotech.edu'),
  ('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333303', 'Interactive Media & Design', 'IMD', 'interactive-media-design', 'Human-computer interaction, product design, and digital storytelling.', 'Studio North', 'design@pacificcrest.edu')
ON CONFLICT (university_id, code) DO NOTHING;

INSERT INTO public.academic_programs (id, university_id, department_id, name, code, degree_level, duration_years, academic_year, total_credits)
VALUES
  ('55555555-5555-4555-8555-555555555501', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', 'B.Sc. in Computer Science', 'BSC-CSE', 'bachelor', 4.0, '2026-2027', 124),
  ('55555555-5555-4555-8555-555555555502', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444402', 'MBA in Technology Leadership', 'MBA-TL', 'master', 2.0, '2026-2027', 60),
  ('55555555-5555-4555-8555-555555555503', '33333333-3333-4333-8333-333333333302', '44444444-4444-4444-8444-444444444403', 'B.Eng. in Robotics & Embedded AI', 'BENG-ROB', 'bachelor', 4.0, '2026-2027', 130)
ON CONFLICT (university_id, code) DO NOTHING;

-- 7. Sample Subscriptions for Seeded Universities
INSERT INTO public.subscriptions (id, university_id, plan_id, billing_cycle, status, provider)
VALUES
  ('66666666-6666-4666-8666-666666666601', '33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111103', 'yearly', 'active', 'manual'),
  ('66666666-6666-4666-8666-666666666602', '33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111102', 'monthly', 'active', 'manual'),
  ('66666666-6666-4666-8666-666666666603', '33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111101', 'monthly', 'trialing', 'manual')
ON CONFLICT (university_id) DO NOTHING;



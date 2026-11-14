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

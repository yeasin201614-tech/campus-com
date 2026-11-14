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

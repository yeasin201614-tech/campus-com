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

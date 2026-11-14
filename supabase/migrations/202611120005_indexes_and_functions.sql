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

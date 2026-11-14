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

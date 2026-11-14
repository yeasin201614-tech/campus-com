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

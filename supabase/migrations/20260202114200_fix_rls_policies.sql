-- Fix RLS Policies for all tables
-- Run this in Supabase SQL Editor to fix permission issues

-- =============================================
-- Drop existing policies to recreate them cleanly
-- =============================================

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- User roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Clubs
DROP POLICY IF EXISTS "Clubs are viewable by authenticated users" ON public.clubs;
DROP POLICY IF EXISTS "Admins can create clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON public.clubs;

-- Club memberships
DROP POLICY IF EXISTS "Memberships are viewable by authenticated users" ON public.club_memberships;
DROP POLICY IF EXISTS "Users can join clubs" ON public.club_memberships;
DROP POLICY IF EXISTS "Users can leave clubs" ON public.club_memberships;

-- Events
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Event registrations
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can unregister from events" ON public.event_registrations;
DROP POLICY IF EXISTS "Admins can update attendance" ON public.event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.event_registrations;

-- Announcements
DROP POLICY IF EXISTS "Announcements are viewable by authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;

-- =============================================
-- Recreate all policies
-- =============================================

-- PROFILES
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- CLUBS
CREATE POLICY "Clubs are viewable by authenticated users" 
ON public.clubs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create clubs" 
ON public.clubs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clubs" 
ON public.clubs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clubs" 
ON public.clubs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CLUB MEMBERSHIPS
CREATE POLICY "Memberships are viewable by authenticated users" 
ON public.club_memberships FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join clubs" 
ON public.club_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clubs" 
ON public.club_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- EVENTS
CREATE POLICY "Events are viewable by authenticated users" 
ON public.events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create events" 
ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events" 
ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events" 
ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EVENT REGISTRATIONS
-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations" 
ON public.event_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations" 
ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events" 
ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from events" 
ON public.event_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can update attendance" 
ON public.event_registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ANNOUNCEMENTS
CREATE POLICY "Announcements are viewable by authenticated users" 
ON public.announcements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create announcements" 
ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update announcements" 
ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete announcements" 
ON public.announcements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Storage policies for avatars and event-posters
-- =============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;

-- Public read access for avatars bucket
CREATE POLICY "Public Avatar Access" 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can manage their avatars
CREATE POLICY "Users can upload avatars" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update avatars" 
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete avatars" 
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- Public read access for event-posters bucket
CREATE POLICY "Public Poster Access" 
ON storage.objects FOR SELECT USING (bucket_id = 'event-posters');

-- Admins can manage event posters
CREATE POLICY "Admins can upload posters" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-posters');

CREATE POLICY "Admins can update posters" 
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'event-posters');

CREATE POLICY "Admins can delete posters" 
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-posters');

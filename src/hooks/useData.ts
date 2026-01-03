import { useState, useEffect, useCallback } from 'react';
import { Club, ClubMembership, Event, EventRegistration, Announcement, Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const loadClubs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clubs').select('*').order('name');
    if (!error && data) setClubs(data);
    setLoading(false);
  }, []);

  const loadMemberships = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('club_memberships')
      .select('*')
      .eq('user_id', user.id);
    if (!error && data) setMemberships(data);
  }, [user]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  useEffect(() => {
    if (user) loadMemberships();
  }, [user, loadMemberships]);

  const getMyClubs = useCallback(() => {
    const myClubIds = memberships.map((m) => m.club_id);
    return clubs.filter((c) => myClubIds.includes(c.id));
  }, [clubs, memberships]);

  const getAdminClubs = useCallback(() => {
    if (!isAdmin) return [];
    return clubs;
  }, [clubs, isAdmin]);

  const joinClub = useCallback(async (clubId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('club_memberships')
      .insert({ user_id: user.id, club_id: clubId });
    if (!error) loadMemberships();
  }, [user, loadMemberships]);

  const leaveClub = useCallback(async (clubId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('club_memberships')
      .delete()
      .eq('user_id', user.id)
      .eq('club_id', clubId);
    if (!error) loadMemberships();
  }, [user, loadMemberships]);

  const createClub = useCallback(async (clubData: { name: string; description: string; category: string }) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('clubs')
      .insert({ ...clubData, created_by: user.id })
      .select()
      .single();
    if (!error && data) {
      loadClubs();
      return data;
    }
    return null;
  }, [user, loadClubs]);

  return { clubs, loading, getMyClubs, getAdminClubs, joinClub, leaveClub, createClub, refreshClubs: loadClubs };
}

export function useEvents(clubId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('events').select('*').order('date', { ascending: true });
    if (clubId) query = query.eq('club_id', clubId);
    const { data, error } = await query;
    if (!error && data) setEvents(data);
    setLoading(false);
  }, [clubId]);

  const loadMyRegistrations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', user.id);
    if (!error && data) setRegistrations(data);
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (user) loadMyRegistrations();
  }, [user, loadMyRegistrations]);

  const createEvent = useCallback(async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('events')
      .insert({ ...eventData, created_by: user.id })
      .select()
      .single();
    if (!error && data) {
      loadEvents();
      return data;
    }
    return null;
  }, [user, loadEvents]);

  const getEventRegistrations = useCallback(async (eventId: string) => {
    const { data } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId);
    return data || [];
  }, []);

  const registerForEvent = useCallback(async (eventId: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({ event_id: eventId, user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      loadMyRegistrations();
      return data;
    }
    return null;
  }, [user, loadMyRegistrations]);

  const getMyRegistration = useCallback((eventId: string) => {
    return registrations.find((r) => r.event_id === eventId) || null;
  }, [registrations]);

  return {
    events,
    loading,
    createEvent,
    registerForEvent,
    getMyRegistration,
    getEventRegistrations,
    refreshEvents: loadEvents,
    refreshRegistrations: loadMyRegistrations,
    markAttendance: async (registrationId: string) => {
      const { error } = await supabase
        .from('event_registrations')
        .update({ attended: true })
        .eq('id', registrationId);
      return !error;
    }
  };
}

export function useAnnouncements(clubId?: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);
      let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (clubId) query = query.eq('club_id', clubId);
      const { data, error } = await query;
      if (!error && data) setAnnouncements(data);
      setLoading(false);
    };
    loadAnnouncements();
  }, [clubId]);

  return { announcements, loading };
}

export function useProfiles() {
  const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data;
  }, []);

  const getProfiles = useCallback(async (userIds: string[]): Promise<Profile[]> => {
    if (userIds.length === 0) return [];
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
    return data || [];
  }, []);

  return { getProfile, getProfiles };
}

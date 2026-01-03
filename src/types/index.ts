// ClubHive Types

export type AppRole = 'student' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  roll_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubMembership {
  id: string;
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  capacity: number | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
}

export interface Announcement {
  id: string;
  club_id: string;
  title: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

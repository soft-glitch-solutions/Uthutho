

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  preferred_transport: string | null;
  points: number;
  titles: string[];
  selected_title: string | null;
  favorites?: any;
  home?: string | null;
  preferred_language?: string | null;
  fire_count?: number | null;
  trips?: number;
  total_ride_time?: number;
  favorites_count?: number;
  total_trips?: number | null;
  updated_at?: string | null;
}

export interface UserPost {
  id: string;
  content: string;
  created_at: string;
  type: 'hub' | 'stop';
  location_name: string;
  likes_count: number;
  comments_count: number;
}

export interface LinkedAccount {
  provider: 'google' | 'facebook' | 'email';
  connected: boolean;
  email?: string;
}

export interface DeleteModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
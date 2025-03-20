

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  preferred_transport: string | null;
  points: number;
  titles: string[];
  selected_title: string | null;
  updated_at?: string | null;
}

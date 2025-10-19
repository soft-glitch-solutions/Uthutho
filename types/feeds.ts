// types/feeds.ts

// Community/Hub/Stop Types
export interface Community {
  id: string;
  name: string;
  type: 'hub' | 'stop';
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Hub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: string;
  updated_at?: string;
}

// User Profile Types
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  selected_title: string;
  avatar_url?: string;
  favorites?: Array<string | FavoriteItem>;
  created_at?: string;
  updated_at?: string;
}

export interface FavoriteItem {
  id: string;
  name: string;
  type: 'hub' | 'stop';
}

// Post Types
export interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_id?: string;
  stop_id?: string;
  profiles: UserProfile;
  post_reactions: PostReaction[];
  post_comments: PostComment[];
}

export interface BasePost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: UserProfile;
  post_reactions: PostReaction[];
  post_comments: PostComment[];
}

export interface HubPost extends BasePost {
  hub_id: string;
  stop_id?: never;
}

export interface StopPost extends BasePost {
  stop_id: string;
  hub_id?: never;
}

// Reaction Types
export interface PostReaction {
  id: string;
  reaction_type: 'fire' | 'like' | 'love' | 'laugh' | 'sad' | 'angry';
  user_id: string;
  hub_post_id?: string;
  stop_post_id?: string;
  created_at?: string;
}

// Comment Types
export interface PostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_post_id?: string;
  stop_post_id?: string;
  profiles: UserProfile;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'post_reaction' | 'comment' | 'system' | 'follow';
  related_entity_id?: string;
  related_entity_type?: 'post' | 'comment' | 'user';
  is_read: boolean;
  created_at: string;
}

// Activity Data Types
export interface ActivityData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

// Follower Counts Type
export type FollowerCounts = Record<string, number>;

// Post Filter Types
export type PostFilter = 'week' | 'today' | 'all';

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface CreatePostForm {
  content: string;
  community_id: string;
  community_type: 'hub' | 'stop';
}

export interface CreateCommentForm {
  content: string;
  post_id: string;
  post_type: 'hub' | 'stop';
}

// Share Types
export interface SharePostData {
  post: Post;
  communityName: string;
  shareUrl: string;
}

// Animation Types
export interface LottieAnimationProps {
  style?: any;
  autoPlay?: boolean;
  loop?: boolean;
  source?: any;
}

// types/feeds.ts
export interface PostImage {
  id: string;
  url: string;
  caption?: string;
  position: number;
}

export interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_id?: string;
  stop_id?: string;
  images?: PostImage[];
  profiles: UserProfile;
  post_reactions: PostReaction[];
  post_comments: PostComment[];
}

export interface CreatePostData {
  content: string;
  community_id: string;
  community_type: 'hub' | 'stop';
  images?: string[]; // Array of base64 images
}
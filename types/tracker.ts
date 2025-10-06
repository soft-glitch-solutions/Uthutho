export interface UserCard {
  id: string;
  user_id: string;
  card_type: 'myciti' | 'golden_arrow';
  card_number: string;
  card_holder: string;
  current_balance: number;
  created_at: string;
  is_active: boolean;
}

export interface CardEntry {
  id: string;
  user_id: string;
  card_id: string;
  action: 'purchase' | 'ride';
  amount: number;
  balance_after: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface ActivityData {
  date: string;
  count: number;
  level: number;
}

export interface CardTypeConfig {
  name: string;
  icon: any;
  color: string;
  pointsName: string;
  gradient: string[];
  cardImage: string | null;
  logoImage?: string;
  backgroundColor: string;
}
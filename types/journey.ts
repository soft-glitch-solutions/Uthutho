export interface Journey {
  id: string;
  route_id: string;
  current_stop_sequence: number;
  status: 'in_progress' | 'completed';
  last_ping_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface JourneyWithRelations extends Journey {
  routes?: {
    name: string;
    transport_type: string;
    start_point: string;
    end_point: string;
  };
}

export interface CreateJourneyParams {
  route_id: string;
  current_stop_sequence: number;
  created_by: string;
}
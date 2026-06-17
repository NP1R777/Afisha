export type UserRole = 'user' | 'admin' | 'organizator';

export interface AdminSession {
  userId: number;
  username: string;
  role: UserRole;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface AdminUser {
  id: number;
  username: string;
  email?: string | null;
  date_of_birth?: string | null;
  deleted_at?: string | null;
  role?: UserRole | null;
  preferences?: number[] | null;
}

export interface AdminCategory {
  id: number;
  name: string;
  description?: string | null;
}

export interface AdminTimeSlot {
  id?: number;
  event_id?: number;
  date_event: string;
  start_time: string;
}

export interface AdminEvent {
  id: number;
  name: string;
  description?: string | null;
  organization?: number | null;
  city?: string | null;
  price?: number | null;
  address?: string | null;
  age_limit?: string | null;
  pictures_main?: string | null;
  pictures_two?: string | null;
  external_url?: string | null;
  group_ids?: number[];
  time_slots?: AdminTimeSlot[];
}

export interface ParserRunPayload {
  source_keys?: string[];
  include_reserve?: boolean;
  max_events_per_source?: number;
}

export interface ParserDistributePayload {
  limit?: number;
  source_key?: string;
}

export interface ParserBackfillPayload {
  limit?: number;
}

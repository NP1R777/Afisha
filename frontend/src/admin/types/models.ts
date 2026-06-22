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

export interface AdminOrganization {
  id: number;
  name_org: string;
  address?: string | null;
  organizator?: string | null;
  description?: string | null;
  picture_org?: string | null;
  external_url?: string | null;
  created_at?: string | null;
  update_at?: string | null;
  deleted_at?: string | null;
}

export interface AdminOrganizationListResponse {
  total: number;
  items: AdminOrganization[];
}

export interface AdminOrganizationPayload {
  name_org?: string;
  address?: string | null;
  organizator?: string | null;
  description?: string | null;
  picture_org?: string | null;
  external_url?: string | null;
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

export type ParsedTargetType = 'event' | 'news' | 'unknown';
export type ParsedProcessStatus = 'new' | 'processed' | 'rejected' | 'error';

export interface AdminParsedEvent {
  id: number;
  source_key: string;
  source_name: string;
  name: string;
  description?: string | null;
  date_event?: string | null;
  start_time?: string | null;
  duration?: string | null;
  city?: string | null;
  price?: string | null;
  address?: string | null;
  organization?: string | null;
  age_limit?: string | null;
  external_url?: string | null;
  pictures_main?: string | null;
  pictures_two?: string | null;
  target_type?: ParsedTargetType | null;
  process_status?: ParsedProcessStatus | null;
  processed_at?: string | null;
  error_text?: string | null;
  created_at?: string | null;
}

export interface AdminParsedEventListResponse {
  total: number;
  items: AdminParsedEvent[];
}

export interface ParserResolvePayload {
  target_type: 'event' | 'news' | 'rejected';
  group_ids?: number[];
  error_text?: string;
}

export interface ParserStatusUpdatePayload {
  process_status: 'new' | 'rejected' | 'error';
  error_text?: string;
}

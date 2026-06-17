import axios from '../../shared/lib/axios';
import type {
  AdminCategory,
  AdminEvent,
  AdminSession,
  AdminUser,
  ParserBackfillPayload,
  ParserDistributePayload,
  ParserRunPayload,
  UserRole,
} from '../types/models';

const ADMIN_SESSION_KEY = 'adminSession';

type UnknownRecord = Record<string, unknown>;

function normalizeRole(rawRole: unknown): UserRole | null {
  if (typeof rawRole !== 'string') {
    return null;
  }
  const value = rawRole.trim().toLowerCase();
  if (value === 'user' || value === 'admin' || value === 'organizator') {
    return value;
  }
  return null;
}

function extractRole(user: UnknownRecord): UserRole | null {
  const direct = normalizeRole(user.role);
  if (direct) {
    return direct;
  }

  const nestedRole = (user.role as UnknownRecord | undefined)?.role;
  const nested = normalizeRole(nestedRole);
  if (nested) {
    return nested;
  }

  if (user.is_admin === true) {
    return 'admin';
  }
  if (user.is_organizer === true || user.is_organizator === true) {
    return 'organizator';
  }

  return null;
}

function parseUser(item: unknown): AdminUser {
  const user = (item || {}) as UnknownRecord;
  return {
    id: Number(user.id || 0),
    username: String(user.username || ''),
    email: user.email ? String(user.email) : null,
    date_of_birth: user.date_of_birth ? String(user.date_of_birth) : null,
    deleted_at: user.deleted_at ? String(user.deleted_at) : null,
    role: extractRole(user),
    preferences: Array.isArray(user.preferences)
      ? user.preferences.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : null,
  };
}

function parseEvent(item: unknown): AdminEvent {
  const raw = (item || {}) as UnknownRecord;
  const slots = Array.isArray(raw.time_slots) ? raw.time_slots : [];
  const groupLinks = Array.isArray(raw.group_links) ? raw.group_links : [];
  const derivedGroupIds = groupLinks
    .map((value) => Number((value as UnknownRecord).groups_id))
    .filter((value) => Number.isFinite(value));
  const rawGroupIds = Array.isArray(raw.group_ids)
    ? raw.group_ids.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  return {
    id: Number(raw.id || 0),
    name: String(raw.name || ''),
    description: raw.description ? String(raw.description) : null,
    organization:
      raw.organization !== undefined && raw.organization !== null
        ? Number(raw.organization)
        : null,
    city: raw.city ? String(raw.city) : null,
    price: raw.price !== undefined && raw.price !== null ? Number(raw.price) : null,
    address: raw.address ? String(raw.address) : null,
    age_limit: raw.age_limit ? String(raw.age_limit) : null,
    pictures_main: raw.pictures_main ? String(raw.pictures_main) : null,
    pictures_two: raw.pictures_two ? String(raw.pictures_two) : null,
    external_url: raw.external_url ? String(raw.external_url) : null,
    group_ids: Array.from(new Set([...rawGroupIds, ...derivedGroupIds])),
    time_slots: slots.map((slot) => {
      const rawSlot = slot as UnknownRecord;
      return {
        id: rawSlot.id ? Number(rawSlot.id) : undefined,
        event_id: rawSlot.event_id ? Number(rawSlot.event_id) : undefined,
        date_event: String(rawSlot.date_event || ''),
        start_time: String(rawSlot.start_time || ''),
      };
    }),
  };
}

function buildAuthHeaders(session: AdminSession | null): Record<string, string> {
  if (!session?.accessToken) {
    return {};
  }
  return { Authorization: `Bearer ${session.accessToken}` };
}

export function getStoredAdminSession(): AdminSession | null {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed || !parsed.userId || !parsed.username) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: AdminSession): void {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function adminLogin(username: string, password: string): Promise<AdminSession> {
  const loginResponse = await axios.post('/user/login', { username, password });
  const payload = (loginResponse.data || {}) as UnknownRecord;
  const userId = Number(payload.user_id || payload.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('Сервер вернул некорректный user_id при логине.');
  }

  const users = await fetchUsers();
  const currentUser = users.find((item) => item.id === userId);
  const role = currentUser?.role;

  if (role !== 'admin') {
    throw new Error(
      role
        ? 'Доступ в админ-панель разрешён только администраторам.'
        : 'Не удалось определить роль пользователя. Endpoint роли ещё не готов.'
    );
  }

  return {
    userId,
    username: String(payload.username || username),
    role: 'admin',
    accessToken: payload.access_token ? String(payload.access_token) : null,
    refreshToken: payload.refresh_token ? String(payload.refresh_token) : null,
  };
}

export async function fetchUsers(session: AdminSession | null = null): Promise<AdminUser[]> {
  const response = await axios.get('/user/all', {
    headers: buildAuthHeaders(session),
  });
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(parseUser);
}

export async function updateUser(
  userId: number,
  payload: {
    username?: string;
    password?: string;
    email?: string;
    date_of_birth?: string;
    preferences?: number[];
  },
  session: AdminSession | null = null
): Promise<void> {
  await axios.patch(`/user/change_data?user_id=${userId}`, payload, {
    headers: buildAuthHeaders(session),
  });
}

export async function deleteUser(userId: number, session: AdminSession | null = null): Promise<void> {
  await axios.delete(`/user/delete_user?user_id=${userId}`, {
    headers: buildAuthHeaders(session),
  });
}

export async function fetchEvents(session: AdminSession | null = null): Promise<AdminEvent[]> {
  const response = await axios.get('/event/events', {
    headers: buildAuthHeaders(session),
  });
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(parseEvent);
}

export async function createEvent(
  payload: {
    name: string;
    description?: string;
    organization?: number | null;
    city?: string | null;
    price?: number | null;
    address?: string | null;
    age_limit?: string | null;
    pictures_main?: string | null;
    pictures_two?: string | null;
    external_url?: string | null;
    group_ids: number[];
    times: Array<{ date_event: string; start_time: string }>;
  },
  session: AdminSession | null = null
): Promise<void> {
  await axios.post('/event/create_event', payload, {
    headers: buildAuthHeaders(session),
  });
}

export async function updateEvent(
  eventId: number,
  payload: {
    name?: string;
    description?: string;
    organization?: number | null;
    city?: string | null;
    price?: number | null;
    address?: string | null;
    age_limit?: string | null;
    pictures_main?: string | null;
    pictures_two?: string | null;
    external_url?: string | null;
    group_ids?: number[];
    times?: Array<{ date_event: string; start_time: string }>;
  },
  session: AdminSession | null = null
): Promise<void> {
  await axios.patch(`/event/${eventId}`, payload, {
    headers: buildAuthHeaders(session),
  });
}

export async function deleteEvent(eventId: number, session: AdminSession | null = null): Promise<void> {
  await axios.delete(`/event/${eventId}`, {
    headers: buildAuthHeaders(session),
  });
}

export async function changeUserRole(
  userId: number,
  role: UserRole,
  session: AdminSession | null = null
): Promise<void> {
  await axios.patch(
    `/user/change_role?user_id=${userId}`,
    { role },
    {
      headers: buildAuthHeaders(session),
    }
  );
}

export async function fetchEventCategories(
  session: AdminSession | null = null
): Promise<AdminCategory[]> {
  const response = await axios.get('/event/event_list', {
    headers: buildAuthHeaders(session),
  });
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map((item) => {
    const raw = (item || {}) as UnknownRecord;
    return {
      id: Number(raw.id || 0),
      name: String(raw.name || ''),
      description: raw.description ? String(raw.description) : null,
    };
  });
}

export async function fetchParserSources(session: AdminSession | null = null): Promise<unknown[]> {
  const response = await axios.get('/parser/sources', {
    headers: buildAuthHeaders(session),
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function runParser(
  payload: ParserRunPayload,
  session: AdminSession | null = null
): Promise<unknown> {
  const response = await axios.post('/parser/run', payload, {
    headers: buildAuthHeaders(session),
  });
  return response.data;
}

export async function distributeParser(
  payload: ParserDistributePayload,
  session: AdminSession | null = null
): Promise<unknown> {
  const response = await axios.post('/parser/distribute', payload, {
    headers: buildAuthHeaders(session),
  });
  return response.data;
}

export async function backfillParserCategories(
  payload: ParserBackfillPayload,
  session: AdminSession | null = null
): Promise<unknown> {
  const response = await axios.post('/parser/categories/backfill', payload, {
    headers: buildAuthHeaders(session),
  });
  return response.data;
}

export async function fetchParsedEvents(
  params: { limit?: number; offset?: number; source_key?: string },
  session: AdminSession | null = null
): Promise<unknown> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  if (params.source_key) query.set('source_key', params.source_key);

  const response = await axios.get(`/parser/events?${query.toString()}`, {
    headers: buildAuthHeaders(session),
  });
  return response.data;
}

export async function triggerAssistantReindex(session: AdminSession | null = null): Promise<unknown> {
  const response = await axios.post(
    '/assistant/reindex',
    { force: false },
    {
      headers: buildAuthHeaders(session),
    }
  );
  return response.data;
}

import { cachedFetch, cacheSet } from './offline';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API хаягийг env-ээс уншина (EXPO_PUBLIC_API_URL).
// Dev үед утас дээр ажиллахын тулд компьютерийн IP хаяг ашиглана.
const DEV_IP = '192.168.0.100';
const ENV_API = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE = ENV_API && ENV_API.length > 0
  ? ENV_API
  : (__DEV__ ? `http://${DEV_IP}:5000` : 'https://api.malchin.mn');

let _token: string | null = null;

export async function setToken(token: string | null) {
  _token = token;
  if (token) await AsyncStorage.setItem('@malchin_token', token);
  else await AsyncStorage.removeItem('@malchin_token');
}

export async function getToken(): Promise<string | null> {
  if (!_token) _token = await AsyncStorage.getItem('@malchin_token');
  return _token;
}

const REQUEST_TIMEOUT_MS = 8000; // 8 сек. Backend унасан үед хурдан fallback хийнэ.

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Оффлайн cache-тэй GET request
async function cachedRequest<T>(endpoint: string, category?: string): Promise<T> {
  const result = await cachedFetch<T>(
    endpoint,
    () => request<T>(endpoint),
    category
  );
  return result.data;
}

// Users
export const userApi = {
  sendOtp: (phone: string) =>
    request<any>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, code: string) =>
    request<any>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  login: (phone: string) =>
    request<any>('/users/login', { method: 'POST', body: JSON.stringify({ phone }) }),
  create: (data: {
    phone: string;
    name: string;
    aimag: string;
    sum: string;
    bag: string;
    role?: string;
    seasonal?: any;
    preferences?: any;
  }) =>
    request<any>('/users/create', { method: 'POST', body: JSON.stringify(data) }),
};

// Livestock
export const livestockApi = {
  getByUser: (userId: number) =>
    cachedRequest<any>(`/livestock/${userId}`, 'livestock'),
  getStats: (userId: number) =>
    cachedRequest<any>(`/livestock/stats/${userId}`, 'livestock'),
  add: (data: { user_id: number; animal_type: string; total_count: number }) =>
    request<any>('/livestock/add', { method: 'POST', body: JSON.stringify(data) }),
  addEvent: (data: { user_id: number; animal_type: string; event_type: string; quantity: number; note?: string }) =>
    request<any>('/livestock/event', { method: 'POST', body: JSON.stringify(data) }),
  getEvents: (userId: number) =>
    request<any>(`/livestock/events/${userId}`),
};

// Weather
export const weatherApi = {
  getByAimag: (aimag: string) =>
    cachedRequest<any>(`/weather/${encodeURIComponent(aimag)}`, 'weather'),
  getAll: () =>
    cachedRequest<any>('/weather', 'weather'),
};

// AI Advisor
export const aiApi = {
  ask: (question: string) =>
    request<any>('/ai/ask', { method: 'POST', body: JSON.stringify({ question }) }),
  getTip: () =>
    request<any>('/ai/tips'),
  diagnose: (data: { animal_type: string; symptoms: string; age?: string; description?: string }) =>
    request<any>('/ai/diagnose', { method: 'POST', body: JSON.stringify(data) }),
  diagnoseImage: (data: { image_base64: string; animal_type?: string; description?: string }) =>
    request<any>('/ai/diagnose-image', { method: 'POST', body: JSON.stringify(data) }),
};

// Diseases
export const diseaseApi = {
  getByAnimal: (animalType: string) => cachedRequest<any>(`/diseases/${animalType}`, 'diseases'),
  match: (data: { animal_type?: string; symptoms: string }) =>
    request<any>('/diseases/match', { method: 'POST', body: JSON.stringify(data) }),
};

// Finance
export const financeApi = {
  getAll: (filters?: { type?: string; category?: string; month?: number; year?: number; from_date?: string; to_date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.month) params.set('month', String(filters.month));
    if (filters?.year) params.set('year', String(filters.year));
    if (filters?.from_date) params.set('from_date', filters.from_date);
    if (filters?.to_date) params.set('to_date', filters.to_date);
    return request<any>(`/finance?${params}`);
  },
  getById: (id: number) => request<any>(`/finance/record/${id}`),
  add: (data: { type: string; category: string; amount: number; note?: string; record_date?: string }) =>
    request<any>('/finance/add', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { type?: string; category?: string; amount?: number; note?: string; record_date?: string }) =>
    request<any>(`/finance/update/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/finance/delete/${id}`, { method: 'DELETE' }),
  deleteBatch: (ids: number[]) =>
    request<any>('/finance/delete-batch', { method: 'POST', body: JSON.stringify({ ids }) }),
  getSummary: (filters?: { year?: number; month?: number; from_date?: string; to_date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.set('year', String(filters.year));
    if (filters?.month) params.set('month', String(filters.month));
    if (filters?.from_date) params.set('from_date', filters.from_date);
    if (filters?.to_date) params.set('to_date', filters.to_date);
    return request<any>(`/finance/summary?${params}`);
  },
  getMonthlySummary: (year?: number) =>
    request<any>(`/finance/summary/monthly${year ? `?year=${year}` : ''}`),
  getCategorySummary: (filters?: { year?: number; type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.set('year', String(filters.year));
    if (filters?.type) params.set('type', filters.type);
    return request<any>(`/finance/summary/category?${params}`);
  },
  getProfitability: (year?: number) =>
    request<any>(`/finance/profitability${year ? `?year=${year}` : ''}`),
  getBudgets: (filters?: { year?: number; month?: number }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.set('year', String(filters.year));
    if (filters?.month) params.set('month', String(filters.month));
    return request<any>(`/finance/budget?${params}`);
  },
  setBudget: (data: { year: number; month: number; category?: string; type?: string; budget_amount: number; note?: string }) =>
    request<any>('/finance/budget', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id: number) =>
    request<any>(`/finance/budget/${id}`, { method: 'DELETE' }),
  compareBudget: (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    return request<any>(`/finance/budget/compare?${params}`);
  },
  getYears: () => request<any>('/finance/years'),
  getTrend: (months?: number) =>
    request<any>(`/finance/trend${months ? `?months=${months}` : ''}`),
};

// Insurance & Welfare
export const insuranceApi = {
  getAll: () => cachedRequest<any>('/insurance/all', 'insurance'),
  getTypes: () => cachedRequest<any>('/insurance/types', 'insurance'),
  getType: (type: string) => cachedRequest<any>(`/insurance/types/${type}`, 'insurance'),
  getWelfare: (category?: string) =>
    cachedRequest<any>(`/insurance/welfare${category ? `?category=${category}` : ''}`, 'insurance'),
  getDocuments: (type?: string) =>
    cachedRequest<any>(`/insurance/documents${type ? `?type=${type}` : ''}`, 'insurance'),
  getContacts: () => cachedRequest<any>('/insurance/contacts', 'insurance'),
  calculate: (income: number) => request<any>(`/insurance/calculate?income=${income}`),
  livestockCalc: (bod: number, bog: number) =>
    request<any>(`/insurance/livestock-calc?bod=${bod}&bog=${bog}`),
};

// Market
export const marketApi = {
  getAll: (params?: { animal_type?: string; search?: string; min_price?: number; max_price?: number; location?: string; sort?: string }) => {
    const qs = params ? '?' + Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&') : '';
    return request<any>(`/market${qs}`);
  },
  getById: (id: number) => request<any>(`/market/${id}`),
  getByUser: (userId: number) => request<any>(`/market/user/${userId}`),
  create: (data: any) =>
    request<any>('/market/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/market/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/market/${id}`, { method: 'DELETE' }),
  updateStatus: (id: number, status: string) =>
    request<any>(`/market/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getStats: () => cachedRequest<any>('/market/stats/summary', 'market'),
};

// Alerts
export const alertsApi = {
  getAll: (region?: string) =>
    cachedRequest<any>(`/alerts${region ? `?region=${encodeURIComponent(region)}` : ''}`, 'alerts'),
};

// Transport
export const transportApi = {
  getDrivers: (region?: string) =>
    request<any>(`/transport/drivers${region ? `?region=${encodeURIComponent(region)}` : ''}`),
  requestTransport: (data: any) =>
    request<any>('/transport/request', { method: 'POST', body: JSON.stringify(data) }),
  estimate: (params: { from: string; to: string; quantity: number; animal_type: string }) =>
    request<any>(`/transport/estimate?from=${params.from}&to=${params.to}&quantity=${params.quantity}&animal_type=${params.animal_type}`),
};

// Map
export const mapApi = {
  getAimags: () => request<any>('/map/aimags'),
  getServices: (type?: string, aimag?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (aimag) params.set('aimag', aimag);
    return request<any>(`/map/services?${params}`);
  },
  getPastures: () => request<any>('/map/pastures'),
  getMarkets: () => request<any>('/map/markets'),
  getNearby: (lat?: number, lng?: number, radius?: number) => {
    const params = new URLSearchParams();
    if (lat) params.set('lat', String(lat));
    if (lng) params.set('lng', String(lng));
    if (radius) params.set('radius', String(radius));
    return request<any>(`/map/nearby?${params}`);
  },
};

// News & Programs
export const newsApi = {
  getAll: (category?: string) =>
    cachedRequest<any>(`/news${category ? `?category=${category}` : ''}`, 'news'),
  getPrograms: (category?: string) =>
    cachedRequest<any>(`/news/programs${category ? `?category=${category}` : ''}`, 'news'),
  getIntlPrices: () => cachedRequest<any>('/news/intl-prices', 'prices'),
  getDashboard: () => cachedRequest<any>('/news/dashboard', 'news'),
};

// Banks
export const bankApi = {
  getRates: () => cachedRequest<any>('/banks/rates', 'banks'),
  getBest: () => cachedRequest<any>('/banks/best', 'banks'),
};

// Stats
export const statsApi = {
  getSummary: () => request<any>('/stats/summary'),
};

// Knowledge
export const knowledgeApi = {
  getAll: (category?: string, animalType?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (animalType) params.set('animal_type', animalType);
    return cachedRequest<any>(`/knowledge?${params}`, 'knowledge');
  },
  getDailyTip: () => cachedRequest<any>('/knowledge/daily-tip', 'knowledge'),
  search: (q: string) => cachedRequest<any>(`/knowledge/search?q=${encodeURIComponent(q)}`, 'knowledge'),
};

// Reminders
export const reminderApi = {
  getByUser: (userId: number, upcoming?: boolean) =>
    cachedRequest<any>(`/reminders/${userId}${upcoming ? '?upcoming=1' : ''}`, 'default'),
  create: (data: any) =>
    request<any>('/reminders/create', { method: 'POST', body: JSON.stringify(data) }),
  complete: (id: number) =>
    request<any>(`/reminders/${id}/complete`, { method: 'PUT' }),
  delete: (id: number) =>
    request<any>(`/reminders/${id}`, { method: 'DELETE' }),
  getVaccineSchedule: (animalType?: string) =>
    cachedRequest<any>(`/reminders/vaccines/schedule${animalType ? `?animal_type=${animalType}` : ''}`, 'default'),
};

// Registry
export const registryApi = {
  getChips: (userId: number) => cachedRequest<any>(`/registry/chips/${userId}`, 'default'),
  registerChip: (data: any) => request<any>('/registry/chips/register', { method: 'POST', body: JSON.stringify(data) }),
  lookupChip: (chipId: string) => request<any>(`/registry/chips/lookup/${chipId}`),
  getWells: (userId: number) => cachedRequest<any>(`/registry/wells/${userId}`, 'default'),
  registerWell: (data: any) => request<any>('/registry/wells/register', { method: 'POST', body: JSON.stringify(data) }),
  getLands: (userId: number) => cachedRequest<any>(`/registry/land/${userId}`, 'default'),
  registerLand: (data: any) => request<any>('/registry/land/register', { method: 'POST', body: JSON.stringify(data) }),
  getGuides: (category?: string) => cachedRequest<any>(`/registry/guides${category ? `?category=${category}` : ''}`, 'knowledge'),
  getGuide: (id: number) => cachedRequest<any>(`/registry/guides/${id}`, 'knowledge'),
  getSummary: (userId: number) => request<any>(`/registry/summary/${userId}`),
};

// Ads
export const adsApi = {
  get: (placement?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (placement) params.set('placement', placement);
    if (limit) params.set('limit', String(limit));
    return cachedRequest<any>(`/ads?${params}`, 'ads');
  },
  click: (id: number) =>
    request<any>(`/ads/${id}/click`, { method: 'POST' }),
};

// Animals (individual animal registry)
export const animalsApi = {
  getAll: (filters?: { type?: string; status?: string; gender?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.gender) params.set('gender', filters.gender);
    if (filters?.search) params.set('search', filters.search);
    return request<any>(`/animals?${params}`);
  },
  getStats: () => request<any>('/animals/stats'),
  getById: (id: number) => request<any>(`/animals/${id}`),
  create: (data: any) =>
    request<any>('/animals', { method: 'POST', body: JSON.stringify(data) }),
  createBatch: (animals: any[]) =>
    request<any>('/animals/batch', { method: 'POST', body: JSON.stringify({ animals }) }),
  update: (id: number, data: any) =>
    request<any>(`/animals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/animals/${id}`, { method: 'DELETE' }),
  lookup: (tag: string) => request<any>(`/animals/lookup/${encodeURIComponent(tag)}`),
};

// Breeding & Birth
export const breedingApi = {
  getAll: (filters?: { status?: string; animal_type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.animal_type) params.set('animal_type', filters.animal_type);
    return request<any>(`/breeding?${params}`);
  },
  getById: (id: number) => request<any>(`/breeding/${id}`),
  getCalendar: () => request<any>('/breeding/calendar'),
  getStats: () => request<any>('/breeding/stats'),
  create: (data: { female_id: number; breeding_date: string; male_id?: number; breeding_method?: string; expected_due_date?: string; notes?: string }) =>
    request<any>('/breeding', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/breeding/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<any>(`/breeding/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id: number) =>
    request<any>(`/breeding/${id}`, { method: 'DELETE' }),
  // Births
  getBirths: () => request<any>('/breeding/births'),
  getBirthById: (id: number) => request<any>(`/breeding/births/${id}`),
  createBirth: (data: { mother_id: number; birth_date: string; father_id?: number; breeding_id?: number; offspring_count?: number; alive_count?: number; difficulty?: string; notes?: string }) =>
    request<any>('/breeding/births', { method: 'POST', body: JSON.stringify(data) }),
  updateBirth: (id: number, data: any) =>
    request<any>(`/breeding/births/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBirth: (id: number) =>
    request<any>(`/breeding/births/${id}`, { method: 'DELETE' }),
};

// Health & Vaccination
export const healthApi = {
  getAll: (filters?: { animal_id?: number; record_type?: string; severity?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.animal_id) params.set('animal_id', String(filters.animal_id));
    if (filters?.record_type) params.set('record_type', filters.record_type);
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.status) params.set('status', filters.status);
    return request<any>(`/health?${params}`);
  },
  getByAnimal: (animalId: number) => request<any>(`/health/animal/${animalId}`),
  getById: (id: number) => request<any>(`/health/${id}`),
  getStats: () => request<any>('/health/stats'),
  create: (data: { animal_id: number; record_type: string; title: string; record_date: string; diagnosis?: string; treatment?: string; medication?: string; dosage?: string; vet_name?: string; cost?: number; severity?: string; next_checkup?: string }) =>
    request<any>('/health', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/health/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/health/${id}`, { method: 'DELETE' }),
  // Vaccinations
  getVaccinations: (filters?: { animal_type?: string; vaccine_name?: string }) => {
    const params = new URLSearchParams();
    if (filters?.animal_type) params.set('animal_type', filters.animal_type);
    if (filters?.vaccine_name) params.set('vaccine_name', filters.vaccine_name);
    return request<any>(`/health/vaccinations?${params}`);
  },
  getVaccinationsByAnimal: (animalId: number) => request<any>(`/health/vaccinations/animal/${animalId}`),
  getVaccinationsDue: () => request<any>('/health/vaccinations/due'),
  createVaccination: (data: { vaccine_name: string; vaccination_date: string; animal_id?: number; animal_type?: string; animal_count?: number; disease?: string; batch_number?: string; administered_by?: string; next_due_date?: string; cost?: number; notes?: string }) =>
    request<any>('/health/vaccinations', { method: 'POST', body: JSON.stringify(data) }),
  updateVaccination: (id: number, data: any) =>
    request<any>(`/health/vaccinations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVaccination: (id: number) =>
    request<any>(`/health/vaccinations/${id}`, { method: 'DELETE' }),
};

// Pastures, Grazing & Migration
export const pastureApi = {
  getAll: (type?: string) =>
    request<any>(`/pastures${type ? `?type=${type}` : ''}`),
  getById: (id: number) => request<any>(`/pastures/${id}`),
  getStats: () => request<any>('/pastures/stats'),
  create: (data: { name: string; type?: string; lat?: number; lng?: number; area?: number; grass_quality?: string; water_source?: string; capacity?: number; aimag?: string; sum?: string; notes?: string }) =>
    request<any>('/pastures', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/pastures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/pastures/${id}`, { method: 'DELETE' }),
  // Grazing
  getGrazing: (filters?: { pasture_id?: number; active?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.pasture_id) params.set('pasture_id', String(filters.pasture_id));
    if (filters?.active) params.set('active', '1');
    return request<any>(`/pastures/grazing?${params}`);
  },
  getCurrentGrazing: () => request<any>('/pastures/grazing/current'),
  startGrazing: (data: { pasture_id: number; start_date: string; animal_count?: number; grass_condition_start?: string; notes?: string }) =>
    request<any>('/pastures/grazing', { method: 'POST', body: JSON.stringify(data) }),
  updateGrazing: (id: number, data: any) =>
    request<any>(`/pastures/grazing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  endGrazing: (id: number, data: { end_date: string; grass_condition_end?: string }) =>
    request<any>(`/pastures/grazing/${id}/end`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGrazing: (id: number) =>
    request<any>(`/pastures/grazing/${id}`, { method: 'DELETE' }),
  // Migrations
  getMigrations: (year?: number) =>
    request<any>(`/pastures/migrations${year ? `?year=${year}` : ''}`),
  createMigration: (data: { migration_date: string; from_pasture_id?: number; to_pasture_id?: number; from_location?: string; to_location?: string; animal_count?: number; distance_km?: number; duration_hours?: number; reason?: string; transport_method?: string; cost?: number; notes?: string }) =>
    request<any>('/pastures/migrations', { method: 'POST', body: JSON.stringify(data) }),
  updateMigration: (id: number, data: any) =>
    request<any>(`/pastures/migrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMigration: (id: number) =>
    request<any>(`/pastures/migrations/${id}`, { method: 'DELETE' }),
};

// Offline Sync
export const syncApi = {
  push: (data: { device_id: string; changes: Array<{ table_name: string; action: string; record_id: number; data: string; created_at: string }> }) =>
    request<any>('/sync/push', { method: 'POST', body: JSON.stringify(data) }),
  pull: (since: string, deviceId: string) =>
    request<any>(`/sync/pull?since=${encodeURIComponent(since)}&device_id=${encodeURIComponent(deviceId)}`),
  getStatus: () => request<any>('/sync/status'),
  resolve: (conflicts: Array<{ sync_id: number; resolution: 'keep_server' | 'keep_client'; client_data?: any }>) =>
    request<any>('/sync/resolve', { method: 'POST', body: JSON.stringify({ conflicts }) }),
};

// Households (multi-user family farm)
export const householdApi = {
  create: (data: { name: string; aimag?: string; sum?: string; bag?: string }) =>
    request<any>('/households/create', { method: 'POST', body: JSON.stringify(data) }),
  getMy: () => request<any>('/households/my'),
  join: (data: { invite_code: string; role?: string }) =>
    request<any>('/households/join', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { name?: string; aimag?: string; sum?: string; bag?: string }) =>
    request<any>('/households', { method: 'PUT', body: JSON.stringify(data) }),
  changeMemberRole: (userId: number, role: string) =>
    request<any>(`/households/members/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  removeMember: (userId: number) =>
    request<any>(`/households/members/${userId}`, { method: 'DELETE' }),
  regenerateInviteCode: () => request<any>('/households/invite-code'),
  leave: () => request<any>('/households/leave', { method: 'DELETE' }),
  getStats: () => request<any>('/households/stats'),
};

// Prices
export const pricesApi = {
  getMarketPrices: (aimag?: string, itemType?: string) => {
    const params = new URLSearchParams();
    if (aimag) params.set('aimag', aimag);
    if (itemType) params.set('item_type', itemType);
    return request<any>(`/prices/market?${params}`);
  },
  getRegions: () => request<any>('/prices/regions'),
  getMarkets: (aimag?: string) =>
    request<any>(`/prices/markets${aimag ? `?aimag=${encodeURIComponent(aimag)}` : ''}`),
  getRawMaterials: (type?: string) =>
    request<any>(`/prices/raw-materials${type ? `?type=${type}` : ''}`),
  getSummary: () => request<any>('/prices/summary'),
};

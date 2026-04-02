import { cachedFetch, cacheSet } from './offline';

const API_BASE = 'http://localhost:5000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
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
  login: (phone: string) =>
    request<any>('/users/login', { method: 'POST', body: JSON.stringify({ phone }) }),
  create: (data: { phone: string; name: string; aimag: string; sum: string; bag: string }) =>
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
  getByUser: (userId: number) =>
    request<any>(`/finance/${userId}`),
  getSummary: (userId: number) =>
    request<any>(`/finance/summary/${userId}`),
  add: (data: { user_id: number; type: string; category: string; amount: number; note?: string }) =>
    request<any>('/finance/add', { method: 'POST', body: JSON.stringify(data) }),
};

// Market
export const marketApi = {
  getAll: () =>
    request<any>('/market'),
  create: (data: any) =>
    request<any>('/market/create', { method: 'POST', body: JSON.stringify(data) }),
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

// Shinjikh
export const shinjikhApi = {
  getAll: (category?: string) =>
    cachedRequest<any>(`/shinjikh${category ? `?category=${category}` : ''}`, 'shinjikh'),
  search: (q: string) => cachedRequest<any>(`/shinjikh/search?q=${encodeURIComponent(q)}`, 'shinjikh'),
};

// Fun facts
export const funFactsApi = {
  getAll: (category?: string) =>
    cachedRequest<any>(`/funfacts${category ? `?category=${category}` : ''}`, 'funfacts'),
  getDaily: () => cachedRequest<any>('/funfacts/daily', 'funfacts'),
  getRandom: () => cachedRequest<any>('/funfacts/random', 'funfacts'),
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

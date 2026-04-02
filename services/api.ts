const API_BASE = 'http://localhost:5000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
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
    request<any>(`/livestock/${userId}`),
  getStats: (userId: number) =>
    request<any>(`/livestock/stats/${userId}`),
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
    request<any>(`/weather/${encodeURIComponent(aimag)}`),
  getAll: () =>
    request<any>('/weather'),
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
  getByAnimal: (animalType: string) => request<any>(`/diseases/${animalType}`),
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
    request<any>(`/alerts${region ? `?region=${encodeURIComponent(region)}` : ''}`),
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
    request<any>(`/news${category ? `?category=${category}` : ''}`),
  getPrograms: (category?: string) =>
    request<any>(`/news/programs${category ? `?category=${category}` : ''}`),
  getIntlPrices: () => request<any>('/news/intl-prices'),
  getDashboard: () => request<any>('/news/dashboard'),
};

// Banks
export const bankApi = {
  getRates: () => request<any>('/banks/rates'),
  getBest: () => request<any>('/banks/best'),
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
    return request<any>(`/knowledge?${params}`);
  },
  getDailyTip: () => request<any>('/knowledge/daily-tip'),
  search: (q: string) => request<any>(`/knowledge/search?q=${encodeURIComponent(q)}`),
};

// Ads
export const adsApi = {
  get: (placement?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (placement) params.set('placement', placement);
    if (limit) params.set('limit', String(limit));
    return request<any>(`/ads?${params}`);
  },
  click: (id: number) =>
    request<any>(`/ads/${id}/click`, { method: 'POST' }),
};

// Shinjikh
export const shinjikhApi = {
  getAll: (category?: string) =>
    request<any>(`/shinjikh${category ? `?category=${category}` : ''}`),
  search: (q: string) => request<any>(`/shinjikh/search?q=${encodeURIComponent(q)}`),
};

// Fun facts
export const funFactsApi = {
  getAll: (category?: string) =>
    request<any>(`/funfacts${category ? `?category=${category}` : ''}`),
  getDaily: () => request<any>('/funfacts/daily'),
  getRandom: () => request<any>('/funfacts/random'),
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

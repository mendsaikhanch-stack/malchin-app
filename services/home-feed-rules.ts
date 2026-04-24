import type { UserRole } from '@/hooks/use-user-role';
import type { Preferences, OnboardingData } from '@/app/onboarding/_layout';
import type { SeasonKey } from '@/hooks/use-seasonal';
import { getSeasonKeyForDate } from '@/hooks/use-seasonal';

// PRD-д баталсан нүүрийн 9 үндсэн card
// Эдгээр нь тогтмол (locked). Нэмэлт card (санхүү, даатгал, шуурхай үйлдэл) tab-д
// үлдэнэ эсвэл доор нь "extras" хэсэгт харагдана.
export type HomeCardId =
  | 'weather'            // 1. Өнөөдрийн цаг агаар
  | 'risk'               // 2. Өнөөдрийн эрсдэл
  | 'daily_tasks'        // 3. Өнөөдөр хийх 3 ажил
  | 'migration_advice'   // 4. Нүүх/оторлох зөвлөгөө
  | 'livestock_health'   // 5. Малын эрүүл мэндийн дохио
  | 'sum_announcement'   // 6. Сумын шинэ мэдэгдэл
  | 'elder_wisdom'       // 7. Ахмадын 1 зөвлөгөө
  | 'market_prices'      // 8. Зах зээлийн товч үнэ
  | 'nearby_listings';   // 9. Ойролцоох хэрэгтэй зар

export type HomeFeedContext = {
  role: UserRole | null;
  preferences: Preferences | null;
  season: SeasonKey;                     // одоогийн улирал (өвөл/хавар/зун/намар)
  aimag: string;
  sum: string;
  hasLivestock: boolean;
  hasHighAlert: boolean;
  hasCurrentSeasonalCamp: boolean;       // одоогийн улирлын байршил бүртгэгдсэн эсэх
};

type CardRule = {
  id: HomeCardId;
  basePriority: number;                  // үндсэн эрэмбэ (бага = дээр)
  // Харуулах эсэхийг шалгана. null буцаавал тухайн хэрэглэгчид огт харагдахгүй.
  shouldShow(ctx: HomeFeedContext): boolean;
  // Contextual boost (priority-д нэмэгдэнэ, сөрөг = дээш ойртоно)
  priorityBoost?(ctx: HomeFeedContext): number;
};

// Preference → card mapping
// Preferences бол "сонирхсон сэдэв" — weather, alerts, migration, livestock_advice,
// feed, market, listings, dairy, meat, health, insurance, children, income
const PREF_BY_CARD: Partial<Record<HomeCardId, keyof Preferences>> = {
  weather: 'weather',
  risk: 'alerts',
  migration_advice: 'migration',
  livestock_health: 'health',
  market_prices: 'market',
  nearby_listings: 'listings',
};

function prefEnabled(ctx: HomeFeedContext, card: HomeCardId): boolean {
  const key = PREF_BY_CARD[card];
  if (!key) return true;                 // preferences-тэй холбоогүй card үргэлж харагдана
  if (!ctx.preferences) return true;     // preferences load болоогүй — default бүгдийг харуул
  return ctx.preferences[key] !== false;
}

const RULES: CardRule[] = [
  {
    id: 'weather',
    basePriority: 10,
    shouldShow: (ctx) => prefEnabled(ctx, 'weather'),
    priorityBoost: () => 0,
  },
  {
    id: 'risk',
    basePriority: 20,
    shouldShow: (ctx) => prefEnabled(ctx, 'risk'),
    // Өндөр эрсдэлтэй бол хамгийн дээр гарна
    priorityBoost: (ctx) => (ctx.hasHighAlert ? -100 : 0),
  },
  {
    id: 'daily_tasks',
    basePriority: 30,
    // Малчин болон malchin-биш бүгдэд харагдана
    shouldShow: () => true,
  },
  {
    id: 'migration_advice',
    basePriority: 40,
    shouldShow: (ctx) =>
      prefEnabled(ctx, 'migration_advice') &&
      (ctx.role === 'malchin' || ctx.role === null) &&
      ctx.hasLivestock,
    // Хавар, намар нүүдэл цагт priority өндөр
    priorityBoost: (ctx) =>
      ctx.season === 'spring' || ctx.season === 'autumn' ? -20 : 0,
  },
  {
    id: 'livestock_health',
    basePriority: 50,
    shouldShow: (ctx) =>
      prefEnabled(ctx, 'livestock_health') && ctx.hasLivestock,
  },
  {
    id: 'sum_announcement',
    basePriority: 60,
    // Сум/баг түвшний мэдэгдэл бүгдэд — аймаг/сум тодорхой л бол
    shouldShow: (ctx) => !!ctx.aimag,
  },
  {
    id: 'elder_wisdom',
    basePriority: 70,
    shouldShow: () => true,
  },
  {
    id: 'market_prices',
    basePriority: 80,
    shouldShow: (ctx) => prefEnabled(ctx, 'market_prices'),
  },
  {
    id: 'nearby_listings',
    basePriority: 90,
    shouldShow: (ctx) => prefEnabled(ctx, 'nearby_listings'),
  },
];

export type RankedCard = { id: HomeCardId; priority: number };

export function rankHomeCards(ctx: HomeFeedContext): RankedCard[] {
  return RULES
    .filter((r) => r.shouldShow(ctx))
    .map((r) => ({
      id: r.id,
      priority: r.basePriority + (r.priorityBoost?.(ctx) ?? 0),
    }))
    .sort((a, b) => a.priority - b.priority);
}

// Context үүсгэх helper — onboarding data + live state-ээс
export function buildHomeFeedContext(params: {
  role: UserRole | null;
  onboarding: OnboardingData | null;
  hasLivestock: boolean;
  hasHighAlert: boolean;
  date?: Date;
}): HomeFeedContext {
  const date = params.date ?? new Date();
  const season = getSeasonKeyForDate(date);
  const seasonal = params.onboarding?.seasonal;
  const currentCamp = seasonal?.[season];
  return {
    role: params.role,
    preferences: params.onboarding?.preferences ?? null,
    season,
    aimag: params.onboarding?.aimag ?? '',
    sum: params.onboarding?.sum ?? '',
    hasLivestock: params.hasLivestock,
    hasHighAlert: params.hasHighAlert,
    hasCurrentSeasonalCamp:
      !!currentCamp && currentCamp.lat != null && currentCamp.lng != null,
  };
}

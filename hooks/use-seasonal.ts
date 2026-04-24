import { useMemo } from 'react';
import type { OnboardingData, SeasonalCamp } from '@/app/onboarding/_layout';

export type SeasonKey = 'winter' | 'spring' | 'summer' | 'autumn';

const SEASON_LABELS: Record<SeasonKey, string> = {
  winter: 'Өвөлжөө',
  spring: 'Хаваржаа',
  summer: 'Зуслан',
  autumn: 'Намаржаа',
};

// Монголын уламжлалт хуваарь:
// Өвөл: 12, 1, 2 сар · Хавар: 3, 4, 5 · Зун: 6, 7, 8 · Намар: 9, 10, 11
export function getSeasonKeyForDate(date: Date = new Date()): SeasonKey {
  const m = date.getMonth() + 1;
  if (m === 12 || m === 1 || m === 2) return 'winter';
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  return 'autumn';
}

export function hasCoords(camp: SeasonalCamp | undefined): boolean {
  return !!camp && camp.lat != null && camp.lng != null;
}

export type CurrentCamp = {
  key: SeasonKey;
  label: string;
  camp: SeasonalCamp;
  registered: boolean;
};

export function getCurrentSeasonalCamp(
  seasonal: OnboardingData['seasonal'],
  date: Date = new Date()
): CurrentCamp {
  const key = getSeasonKeyForDate(date);
  const camp = seasonal[key] || {};
  return {
    key,
    label: SEASON_LABELS[key],
    camp,
    registered: hasCoords(camp),
  };
}

export function useCurrentSeasonalCamp(
  seasonal: OnboardingData['seasonal'] | undefined,
  date?: Date
): CurrentCamp | null {
  return useMemo(() => {
    if (!seasonal) return null;
    return getCurrentSeasonalCamp(seasonal, date);
  }, [seasonal, date]);
}

export const SEASONAL_KEY_LABELS: Record<
  SeasonKey | 'otor',
  string
> = {
  winter: 'Өвөлжөө',
  spring: 'Хаваржаа',
  summer: 'Зуслан',
  autumn: 'Намаржаа',
  otor: 'Отор',
};

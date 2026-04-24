import {
  rankHomeCards,
  buildHomeFeedContext,
  type HomeFeedContext,
} from '../home-feed-rules';
import type { Preferences, OnboardingData } from '../../app/onboarding/_layout';

const defaultPrefs: Preferences = {
  weather: true,
  alerts: true,
  migration: true,
  livestock_advice: true,
  feed: true,
  market: true,
  listings: true,
  dairy: false,
  meat: false,
  health: true,
  insurance: true,
  children: false,
  income: false,
};

const baseCtx: HomeFeedContext = {
  role: 'malchin',
  preferences: defaultPrefs,
  season: 'summer',
  aimag: 'Төв',
  sum: 'Баянчандмань',
  hasLivestock: true,
  hasHighAlert: false,
  hasCurrentSeasonalCamp: true,
};

describe('rankHomeCards — default malchin context', () => {
  it('9 locked card бүгд харагдана (default preferences)', () => {
    const ranked = rankHomeCards(baseCtx);
    const ids = ranked.map((r) => r.id);
    expect(ids).toContain('weather');
    expect(ids).toContain('risk');
    expect(ids).toContain('daily_tasks');
    expect(ids).toContain('migration_advice');
    expect(ids).toContain('livestock_health');
    expect(ids).toContain('sum_announcement');
    expect(ids).toContain('elder_wisdom');
    expect(ids).toContain('market_prices');
    expect(ids).toContain('nearby_listings');
    expect(ranked.length).toBe(9);
  });

  it('priority order: weather хамгийн дээр (10)', () => {
    const ranked = rankHomeCards(baseCtx);
    expect(ranked[0].id).toBe('weather');
  });
});

describe('rankHomeCards — preferences filter', () => {
  it('weather=false бол weather card нуугдана', () => {
    const ctx = { ...baseCtx, preferences: { ...defaultPrefs, weather: false } };
    const ids = rankHomeCards(ctx).map((r) => r.id);
    expect(ids).not.toContain('weather');
  });

  it('market=false бол market_prices нуугдана', () => {
    const ctx = { ...baseCtx, preferences: { ...defaultPrefs, market: false } };
    const ids = rankHomeCards(ctx).map((r) => r.id);
    expect(ids).not.toContain('market_prices');
  });

  it('listings=false бол nearby_listings нуугдана', () => {
    const ctx = { ...baseCtx, preferences: { ...defaultPrefs, listings: false } };
    const ids = rankHomeCards(ctx).map((r) => r.id);
    expect(ids).not.toContain('nearby_listings');
  });

  it('preferences үгүй (null) бол бүгд харагдана (fallback)', () => {
    const ctx = { ...baseCtx, preferences: null };
    const ranked = rankHomeCards(ctx);
    expect(ranked.length).toBe(9);
  });
});

describe('rankHomeCards — hasLivestock gating', () => {
  it('мал үгүй бол migration_advice, livestock_health нуугдана', () => {
    const ctx = { ...baseCtx, hasLivestock: false };
    const ids = rankHomeCards(ctx).map((r) => r.id);
    expect(ids).not.toContain('migration_advice');
    expect(ids).not.toContain('livestock_health');
    expect(ids).toContain('weather');
  });
});

describe('rankHomeCards — high alert boost', () => {
  it('өндөр эрсдэлтэй үед risk card хамгийн дээр гарна', () => {
    const ctx = { ...baseCtx, hasHighAlert: true };
    const ranked = rankHomeCards(ctx);
    expect(ranked[0].id).toBe('risk');
  });

  it('эрсдэл үгүй үед weather card дээд', () => {
    const ranked = rankHomeCards(baseCtx);
    expect(ranked[0].id).toBe('weather');
  });
});

describe('rankHomeCards — season boost for migration', () => {
  it('хавар үед migration_advice daily_tasks-аас дээш', () => {
    const ctx = { ...baseCtx, season: 'spring' as const };
    const ranked = rankHomeCards(ctx);
    const migIdx = ranked.findIndex((r) => r.id === 'migration_advice');
    const taskIdx = ranked.findIndex((r) => r.id === 'daily_tasks');
    expect(migIdx).toBeLessThan(taskIdx);
  });

  it('зун үед daily_tasks migration_advice-аас дээш', () => {
    const ranked = rankHomeCards(baseCtx); // season=summer
    const migIdx = ranked.findIndex((r) => r.id === 'migration_advice');
    const taskIdx = ranked.findIndex((r) => r.id === 'daily_tasks');
    expect(taskIdx).toBeLessThan(migIdx);
  });
});

describe('rankHomeCards — role gating', () => {
  it('bag_darga role-д migration_advice нуугдана (malchin-д зориулсан)', () => {
    const ctx = { ...baseCtx, role: 'bag_darga' as const };
    const ids = rankHomeCards(ctx).map((r) => r.id);
    expect(ids).not.toContain('migration_advice');
  });

  it('aimag хоосон бол sum_announcement нуугдана', () => {
    const ctx = { ...baseCtx, aimag: '' };
    const ids = rankHomeCards(ctx).map((r) => r.id);
    expect(ids).not.toContain('sum_announcement');
  });
});

describe('buildHomeFeedContext', () => {
  it('onboarding null үед default ctx угсарна', () => {
    const ctx = buildHomeFeedContext({
      role: null,
      onboarding: null,
      hasLivestock: false,
      hasHighAlert: false,
      date: new Date(2026, 5, 1), // summer
    });
    expect(ctx.season).toBe('summer');
    expect(ctx.preferences).toBeNull();
    expect(ctx.aimag).toBe('');
    expect(ctx.hasCurrentSeasonalCamp).toBe(false);
  });

  it('seasonal camp бүртгэлтэй бол hasCurrentSeasonalCamp=true', () => {
    const onboarding = {
      aimag: 'Төв',
      sum: 'Баянчандмань',
      preferences: defaultPrefs,
      seasonal: {
        winter: { lat: 47.9, lng: 106.9 },
        spring: {},
        summer: { lat: 48.0, lng: 107.0 },
        autumn: {},
        otor: {},
      },
    } as unknown as OnboardingData;

    const ctx = buildHomeFeedContext({
      role: 'malchin',
      onboarding,
      hasLivestock: true,
      hasHighAlert: false,
      date: new Date(2026, 6, 1), // summer
    });
    expect(ctx.hasCurrentSeasonalCamp).toBe(true);
    expect(ctx.aimag).toBe('Төв');
  });

  it('одоогийн улирлын camp үгүй бол hasCurrentSeasonalCamp=false', () => {
    const onboarding = {
      aimag: 'Төв',
      sum: '',
      preferences: defaultPrefs,
      seasonal: {
        winter: { lat: 47.9, lng: 106.9 },
        spring: {},
        summer: {},
        autumn: {},
        otor: {},
      },
    } as unknown as OnboardingData;

    const ctx = buildHomeFeedContext({
      role: 'malchin',
      onboarding,
      hasLivestock: true,
      hasHighAlert: false,
      date: new Date(2026, 6, 1), // summer, no camp
    });
    expect(ctx.hasCurrentSeasonalCamp).toBe(false);
  });
});

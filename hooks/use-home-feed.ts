import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingData } from '@/app/onboarding/_layout';
import type { UserRole } from '@/hooks/use-user-role';
import {
  buildHomeFeedContext,
  rankHomeCards,
  type HomeCardId,
  type HomeFeedContext,
} from '@/services/home-feed-rules';

const ONBOARDING_KEY = '@malchin_onboarding_data';

type UseHomeFeedParams = {
  role: UserRole | null;
  hasLivestock: boolean;
  hasHighAlert: boolean;
};

type UseHomeFeedResult = {
  context: HomeFeedContext | null;
  visibleCards: Set<HomeCardId>;
  orderedCards: HomeCardId[];
  loaded: boolean;
};

// Home feed-ийн rule engine-г React-ээс ашиглах hook.
// AsyncStorage-аас onboarding (preferences + seasonal + aimag) уншиж, context угсарна.
export function useHomeFeed(params: UseHomeFeedParams): UseHomeFeedResult {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setOnboarding(JSON.parse(raw));
          } catch {}
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const context = loaded
    ? buildHomeFeedContext({
        role: params.role,
        onboarding,
        hasLivestock: params.hasLivestock,
        hasHighAlert: params.hasHighAlert,
      })
    : null;

  const ranked = context ? rankHomeCards(context) : [];
  const orderedCards = ranked.map((r) => r.id);
  const visibleCards = new Set<HomeCardId>(orderedCards);

  return { context, visibleCards, orderedCards, loaded };
}

import {
  canAccess,
  requiredPackages,
  cheapestUpgrade,
  billingStreamFor,
  featuresOfPackage,
  packageMeta,
  PACKAGES,
  type PackageId,
  type FeatureKey,
} from '../pricing';

describe('pricing / package registry', () => {
  it('5 багц locked-decision-тэй яг таарна', () => {
    const ids = Object.keys(PACKAGES).sort();
    expect(ids).toEqual(
      [
        'cooperative',
        'free',
        'premium_malchin',
        'sum_license',
        'verified_provider',
      ].sort()
    );
  });

  it('packageMeta нь display name-тай', () => {
    expect(packageMeta('free').name).toBe('Үнэгүй');
    expect(packageMeta('premium_malchin').name).toMatch(/Премиум/);
    expect(packageMeta('sum_license').billing).toBe('invoice');
    expect(packageMeta('verified_provider').billing).toBe('digital');
  });

  it('billingStreamFor: digital vs invoice зөв', () => {
    // Digital (in-app store дүрмийн хүрээнд)
    expect(billingStreamFor('free')).toBe('digital');
    expect(billingStreamFor('premium_malchin')).toBe('digital');
    expect(billingStreamFor('verified_provider')).toBe('digital');
    // Org/invoice
    expect(billingStreamFor('cooperative')).toBe('invoice');
    expect(billingStreamFor('sum_license')).toBe('invoice');
  });
});

describe('pricing / canAccess', () => {
  it('free багц MVP үндсэн feature-тэй', () => {
    expect(canAccess('free', 'weather_basic')).toBe(true);
    expect(canAccess('free', 'advisory_limited')).toBe(true);
    expect(canAccess('free', 'lost_found_view')).toBe(true);
    expect(canAccess('free', 'lost_found_create')).toBe(true);
    expect(canAccess('free', 'bag_dashboard_basic')).toBe(true);
    expect(canAccess('free', 'sum_dashboard_basic')).toBe(true);
    expect(canAccess('free', 'offline_sync_basic')).toBe(true);
  });

  it('free багц premium feature-д хандахгүй', () => {
    expect(canAccess('free', 'advisory_unlimited')).toBe(false);
    expect(canAccess('free', 'weather_extended')).toBe(false);
    expect(canAccess('free', 'listings_create_unlimited')).toBe(false);
    expect(canAccess('free', 'offline_sync_bulk')).toBe(false);
  });

  it('premium_malchin бүх premium feature-т хандана', () => {
    expect(canAccess('premium_malchin', 'advisory_unlimited')).toBe(true);
    expect(canAccess('premium_malchin', 'weather_extended')).toBe(true);
    expect(canAccess('premium_malchin', 'listings_create_unlimited')).toBe(true);
    expect(canAccess('premium_malchin', 'offline_sync_bulk')).toBe(true);
  });

  it('premium_malchin org-only feature-д хандахгүй', () => {
    expect(canAccess('premium_malchin', 'coop_commerce')).toBe(false);
    expect(canAccess('premium_malchin', 'sum_dashboard_full')).toBe(false);
    expect(canAccess('premium_malchin', 'provider_booking')).toBe(false);
  });

  it('cooperative багц cooperative commerce нээнэ', () => {
    expect(canAccess('cooperative', 'coop_commerce')).toBe(true);
    expect(canAccess('cooperative', 'coop_seat_management')).toBe(true);
    // Зэрэгцээ premium feature-т хандана (tier 2)
    expect(canAccess('cooperative', 'advisory_unlimited')).toBe(true);
  });

  it('sum_license нь sum dashboard full-ийг нээдэг цорын ганц багц', () => {
    expect(canAccess('sum_license', 'sum_dashboard_full')).toBe(true);
    expect(canAccess('free', 'sum_dashboard_full')).toBe(false);
    expect(canAccess('premium_malchin', 'sum_dashboard_full')).toBe(false);
    expect(canAccess('cooperative', 'sum_dashboard_full')).toBe(false);
    expect(canAccess('verified_provider', 'sum_dashboard_full')).toBe(false);
  });

  it('verified_provider нь provider feature-ийн цорын ганц багц', () => {
    expect(canAccess('verified_provider', 'provider_booking')).toBe(true);
    expect(canAccess('verified_provider', 'provider_commission')).toBe(true);
    expect(canAccess('free', 'provider_booking')).toBe(false);
    expect(canAccess('premium_malchin', 'provider_booking')).toBe(false);
  });
});

describe('pricing / requiredPackages', () => {
  it('шинэ copy буцаана (immutability)', () => {
    const a = requiredPackages('advisory_unlimited');
    const b = requiredPackages('advisory_unlimited');
    expect(a).toEqual(b);
    a.push('free' as PackageId);
    expect(requiredPackages('advisory_unlimited')).not.toContain('free');
  });

  it('free feature нь бүх багц агуулна', () => {
    const pkgs = requiredPackages('weather_basic');
    expect(pkgs.length).toBe(5);
  });

  it('exclusive feature нь ганц багцтай', () => {
    expect(requiredPackages('sum_dashboard_full')).toEqual(['sum_license']);
    expect(requiredPackages('provider_booking')).toEqual(['verified_provider']);
  });
});

describe('pricing / cheapestUpgrade', () => {
  it('free-ээр нээлттэй feature дээр null буцаана', () => {
    expect(cheapestUpgrade('weather_basic')).toBeNull();
    expect(cheapestUpgrade('lost_found_view')).toBeNull();
  });

  it('premium-аар нээгддэг feature дээр premium_malchin буцаана', () => {
    expect(cheapestUpgrade('advisory_unlimited')).toBe('premium_malchin');
    expect(cheapestUpgrade('weather_extended')).toBe('premium_malchin');
    expect(cheapestUpgrade('offline_sync_bulk')).toBe('premium_malchin');
  });

  it('org-only feature дээр tier-ийн хамгийн багыг буцаана', () => {
    // cooperative (tier 2) vs verified_provider (tier 2) — ижил tier, зөвхөн allowed-д байгаа нэг
    expect(cheapestUpgrade('coop_commerce')).toBe('cooperative');
    expect(cheapestUpgrade('provider_booking')).toBe('verified_provider');
    expect(cheapestUpgrade('sum_dashboard_full')).toBe('sum_license');
  });
});

describe('pricing / featuresOfPackage', () => {
  it('free багц listings_create_basic агуулна, unlimited-ийг биш', () => {
    const feats = featuresOfPackage('free');
    expect(feats).toContain('listings_create_basic');
    expect(feats).not.toContain('listings_create_unlimited');
    expect(feats).not.toContain('coop_commerce');
    expect(feats).not.toContain('sum_dashboard_full');
  });

  it('sum_license нь sum_dashboard_full-ыг агуулна', () => {
    const feats = featuresOfPackage('sum_license');
    expect(feats).toContain('sum_dashboard_full');
    expect(feats).toContain('advisory_unlimited'); // tier 3 premium inherit
  });

  it('verified_provider нь provider_commission-ыг агуулна', () => {
    const feats = featuresOfPackage('verified_provider');
    expect(feats).toContain('provider_commission');
    expect(feats).toContain('provider_booking');
    expect(feats).not.toContain('coop_commerce');
  });

  it('feature key бүх package-д нөхөгдөөгүй байвал олдохгүй', () => {
    // sum_dashboard_full зөвхөн sum_license-д
    expect(featuresOfPackage('free')).not.toContain('sum_dashboard_full');
    expect(featuresOfPackage('premium_malchin')).not.toContain('sum_dashboard_full');
  });
});

describe('pricing / integrity', () => {
  it('бүх feature key дор хаяж 1 багцад access-той', () => {
    const allFeatures: FeatureKey[] = [
      'advisory_limited',
      'advisory_unlimited',
      'weather_basic',
      'weather_extended',
      'bag_dashboard_basic',
      'sum_dashboard_basic',
      'sum_dashboard_full',
      'lost_found_view',
      'lost_found_create',
      'listings_view',
      'listings_create_basic',
      'listings_create_unlimited',
      'coop_commerce',
      'coop_seat_management',
      'provider_profile',
      'provider_booking',
      'provider_commission',
      'offline_sync_basic',
      'offline_sync_bulk',
    ];
    for (const f of allFeatures) {
      expect(requiredPackages(f).length).toBeGreaterThan(0);
    }
  });
});

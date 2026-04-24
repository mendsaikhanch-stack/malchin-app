import {
  parseOnboardingSnapshot,
  toLivestockStats,
  toUserFallback,
  matchUserFallbackByPhone,
} from '../onboarding-fallback';

// Regression тест: сүүлийн commit-уудад backend унасан үед AsyncStorage-аас
// fallback хийх flow засагдсан. Эдгээр pure функцууд тэр логикийг бүрхэнэ.

describe('parseOnboardingSnapshot', () => {
  it('null input → null', () => {
    expect(parseOnboardingSnapshot(null)).toBeNull();
    expect(parseOnboardingSnapshot(undefined)).toBeNull();
    expect(parseOnboardingSnapshot('')).toBeNull();
  });

  it('invalid JSON → null (crash хийхгүй)', () => {
    expect(parseOnboardingSnapshot('{not json')).toBeNull();
    expect(parseOnboardingSnapshot('garbage')).toBeNull();
  });

  it('zөв JSON → typed snapshot', () => {
    const raw = JSON.stringify({
      phone: '99112233',
      firstName: 'Болд',
      aimag: 'Төв',
    });
    const s = parseOnboardingSnapshot(raw);
    expect(s?.phone).toBe('99112233');
    expect(s?.firstName).toBe('Болд');
  });

  it('JSON боловч object биш → null', () => {
    expect(parseOnboardingSnapshot('"string"')).toBeNull();
    expect(parseOnboardingSnapshot('42')).toBeNull();
    expect(parseOnboardingSnapshot('null')).toBeNull();
  });
});

describe('toLivestockStats', () => {
  it('null snapshot → null', () => {
    expect(toLivestockStats(null)).toBeNull();
  });

  it('livestock үгүй snapshot → null', () => {
    expect(toLivestockStats({ phone: '99112233' })).toBeNull();
  });

  it('бүх тоо 0 → null (home-д харуулах зүйл байхгүй)', () => {
    const s = {
      livestock: { horse: 0, cow: 0, sheep: 0, goat: 0, camel: 0 },
    };
    expect(toLivestockStats(s)).toBeNull();
  });

  it('хэд хэдэн төрөл > 0 → stats format', () => {
    const s = {
      livestock: { horse: 5, cow: 0, sheep: 100, goat: 50, camel: 0 },
    };
    const stats = toLivestockStats(s);
    expect(stats?.total_animals).toBe(155);
    expect(stats?.livestock).toHaveLength(3);
    expect(stats?.livestock.find((x) => x.animal_type === 'sheep')?.total_count).toBe(100);
    expect(stats?.livestock.find((x) => x.animal_type === 'horse')?.total_count).toBe(5);
  });

  it('зөвхөн ганц төрөлтэй ч мөн format-тай байна', () => {
    const s = { livestock: { horse: 10 } };
    const stats = toLivestockStats(s);
    expect(stats?.total_animals).toBe(10);
    expect(stats?.livestock).toHaveLength(1);
  });
});

describe('toUserFallback', () => {
  it('null snapshot → null', () => {
    expect(toUserFallback(null)).toBeNull();
  });

  it('phone үгүй snapshot → null (нэвтрэх боломжгүй)', () => {
    expect(toUserFallback({ firstName: 'Болд' })).toBeNull();
  });

  it('phone-той snapshot → user object (regression: Профайл таб focus)', () => {
    const s = {
      phone: '99112233',
      lastName: 'Бат',
      firstName: 'Болд',
      aimag: 'Төв',
      sum: 'Баянчандмань',
      bag: '1-р баг',
      role: 'malchin',
    };
    const user = toUserFallback(s);
    expect(user).toEqual({
      phone: '99112233',
      name: 'Бат Болд',
      aimag: 'Төв',
      sum: 'Баянчандмань',
      bag: '1-р баг',
      role: 'malchin',
    });
  });

  it('нэр хоосон бол trimmed name = ""', () => {
    const s = { phone: '99112233', lastName: '', firstName: '' };
    expect(toUserFallback(s)?.name).toBe('');
  });

  it('role тодорхойгүй бол default malchin', () => {
    const s = { phone: '99112233' };
    expect(toUserFallback(s)?.role).toBe('malchin');
  });
});

describe('matchUserFallbackByPhone', () => {
  const snapshot = {
    phone: '99112233',
    firstName: 'Болд',
    lastName: 'Бат',
    aimag: 'Төв',
    role: 'malchin',
  };

  it('таарсан дугаар → user', () => {
    const u = matchUserFallbackByPhone(snapshot, '99112233');
    expect(u?.phone).toBe('99112233');
  });

  it('өөр дугаар → null (regression: буруу дугаараар нэвтрэхгүй)', () => {
    expect(matchUserFallbackByPhone(snapshot, '88776655')).toBeNull();
  });

  it('snapshot null → null', () => {
    expect(matchUserFallbackByPhone(null, '99112233')).toBeNull();
  });

  it('snapshot-д phone байхгүй → null', () => {
    expect(matchUserFallbackByPhone({ firstName: 'Болд' }, '99112233')).toBeNull();
  });
});

describe('integration: бодит онбординг data-тай', () => {
  const fullRaw = JSON.stringify({
    phone: '99112233',
    otpVerified: true,
    lastName: 'Бат',
    firstName: 'Болд',
    role: 'malchin',
    aimag: 'Төв',
    sum: 'Баянчандмань',
    bag: '1-р баг',
    seasonal: {
      winter: { lat: 47.9, lng: 106.9 },
      spring: {},
      summer: { lat: 48.1, lng: 107.2 },
      autumn: {},
      otor: {},
    },
    livestock: {
      horse: 10,
      cow: 5,
      sheep: 200,
      goat: 80,
      camel: 0,
    },
    preferences: { weather: true, alerts: true, migration: true },
  });

  it('бүх урсгал дамжина (parse → livestock + user)', () => {
    const snap = parseOnboardingSnapshot(fullRaw);
    expect(snap).not.toBeNull();

    const stats = toLivestockStats(snap);
    expect(stats?.total_animals).toBe(295);
    expect(stats?.livestock).toHaveLength(4);

    const user = toUserFallback(snap);
    expect(user?.name).toBe('Бат Болд');
    expect(user?.aimag).toBe('Төв');

    const matched = matchUserFallbackByPhone(snap, '99112233');
    expect(matched?.name).toBe('Бат Болд');
  });
});

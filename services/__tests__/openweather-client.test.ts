import {
  buildOpenWeatherUrl,
  getOpenWeatherApiKey,
  isOpenWeatherAvailable,
} from '../openweather-client';

const OLD_ENV = process.env;

describe('getOpenWeatherApiKey', () => {
  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('env variable байвал буцаана', () => {
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = 'test-key-123';
    expect(getOpenWeatherApiKey()).toBe('test-key-123');
  });

  it('env variable үгүй → null', () => {
    delete process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    expect(getOpenWeatherApiKey()).toBeNull();
  });

  it('хоосон string → null', () => {
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = '';
    expect(getOpenWeatherApiKey()).toBeNull();
  });
});

describe('isOpenWeatherAvailable', () => {
  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('key тохируулагдсан → true', () => {
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = 'k';
    expect(isOpenWeatherAvailable()).toBe(true);
  });

  it('key байхгүй → false', () => {
    delete process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    expect(isOpenWeatherAvailable()).toBe(false);
  });
});

describe('buildOpenWeatherUrl', () => {
  const coords = { lat: 47.9, lng: 106.9 };

  it('default options (metric, mn lang)', () => {
    const url = buildOpenWeatherUrl(coords, 'KEY');
    expect(url).toContain('api.openweathermap.org');
    expect(url).toContain('lat=47.9');
    expect(url).toContain('lon=106.9');
    expect(url).toContain('units=metric');
    expect(url).toContain('lang=mn');
    expect(url).toContain('appid=KEY');
  });

  it('imperial units', () => {
    const url = buildOpenWeatherUrl(coords, 'K', { units: 'imperial' });
    expect(url).toContain('units=imperial');
  });

  it('англи хэл', () => {
    const url = buildOpenWeatherUrl(coords, 'K', { lang: 'en' });
    expect(url).toContain('lang=en');
  });

  it('special character-тай key → URL-encoded', () => {
    const url = buildOpenWeatherUrl(coords, 'a b&c');
    expect(url).toContain('appid=a+b%26c'); // URLSearchParams encoding
  });
});

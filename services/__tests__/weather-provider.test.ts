import {
  parseConditionKey,
  parseDzudRisk,
  normalizeBackendWeather,
  normalizeOpenWeather,
  computeDzudFromMetrics,
  dzudSeverityScore,
  conditionLabel,
  dzudLabel,
  emptyWeather,
} from '../weather-provider';

describe('parseConditionKey', () => {
  it('ENG keywords-ийг танина', () => {
    expect(parseConditionKey('Clear')).toBe('clear');
    expect(parseConditionKey('sunny skies')).toBe('clear');
    expect(parseConditionKey('Clouds')).toBe('cloudy');
    expect(parseConditionKey('overcast')).toBe('cloudy');
    expect(parseConditionKey('Light rain')).toBe('rain');
    expect(parseConditionKey('drizzle')).toBe('rain');
    expect(parseConditionKey('Snow')).toBe('snow');
    expect(parseConditionKey('Windy')).toBe('wind');
    expect(parseConditionKey('Fog')).toBe('fog');
    expect(parseConditionKey('Thunderstorm')).toBe('thunder');
  });

  it('Монгол keyword-ийг танина', () => {
    expect(parseConditionKey('цэлмэг')).toBe('clear');
    expect(parseConditionKey('үүлэрхэг')).toBe('cloudy');
    expect(parseConditionKey('бороотой')).toBe('rain');
    expect(parseConditionKey('цастай')).toBe('snow');
    expect(parseConditionKey('салхитай')).toBe('wind');
    expect(parseConditionKey('манантай')).toBe('fog');
    expect(parseConditionKey('аянгатай')).toBe('thunder');
  });

  it('тодорхойгүй → unknown', () => {
    expect(parseConditionKey(undefined)).toBe('unknown');
    expect(parseConditionKey(null)).toBe('unknown');
    expect(parseConditionKey('')).toBe('unknown');
    expect(parseConditionKey('xyzqq')).toBe('unknown');
  });

  it('Thunder > snow > rain > wind > cloudy > clear — prioritized order', () => {
    // Aянга + бороо → aянга ялна
    expect(parseConditionKey('Thunderstorm with rain')).toBe('thunder');
    // Цастай + салхитай → цас ялна
    expect(parseConditionKey('snow and wind')).toBe('snow');
  });
});

describe('parseDzudRisk', () => {
  it('string map: low/medium/high', () => {
    expect(parseDzudRisk('low')).toBe('low');
    expect(parseDzudRisk('medium')).toBe('medium');
    expect(parseDzudRisk('high')).toBe('high');
  });

  it('numeric score: 0..1', () => {
    expect(parseDzudRisk(0)).toBe('low');
    expect(parseDzudRisk(0.2)).toBe('low');
    expect(parseDzudRisk(0.5)).toBe('medium');
    expect(parseDzudRisk(0.8)).toBe('high');
    expect(parseDzudRisk(1)).toBe('high');
  });

  it('тодорхойгүй бол unknown', () => {
    expect(parseDzudRisk(undefined)).toBe('unknown');
    expect(parseDzudRisk(null)).toBe('unknown');
    expect(parseDzudRisk('severe')).toBe('unknown');
    expect(parseDzudRisk(-1)).toBe('unknown');
  });
});

describe('computeDzudFromMetrics (heuristic)', () => {
  it('температур хэмжих үгүй → unknown', () => {
    expect(computeDzudFromMetrics(null, null)).toBe('unknown');
  });

  it('≤ -30°C бол шууд high', () => {
    expect(computeDzudFromMetrics(-30, 0)).toBe('high');
    expect(computeDzudFromMetrics(-40, 0)).toBe('high');
  });

  it('-25°C + хүчтэй салхи → high', () => {
    expect(computeDzudFromMetrics(-25, 12)).toBe('high');
  });

  it('-25°C ердийн салхитай → medium', () => {
    expect(computeDzudFromMetrics(-25, 3)).toBe('medium');
  });

  it('-15°C дунд салхитай → medium', () => {
    expect(computeDzudFromMetrics(-15, 18)).toBe('medium');
  });

  it('дулаан үед low', () => {
    expect(computeDzudFromMetrics(0, 2)).toBe('low');
    expect(computeDzudFromMetrics(-10, 5)).toBe('low');
    expect(computeDzudFromMetrics(20, 0)).toBe('low');
  });
});

describe('normalizeBackendWeather', () => {
  it('бүрэн backend response → normalized', () => {
    const raw = {
      aimag: 'Төв',
      temp: -18,
      condition: 'Snow',
      dzud_risk: 'medium',
      humidity: 70,
      wind_speed: 8,
    };
    const w = normalizeBackendWeather(raw);
    expect(w.provider).toBe('backend');
    expect(w.aimag).toBe('Төв');
    expect(w.temp).toBe(-18);
    expect(w.condition).toBe('snow');
    expect(w.conditionLabel).toBe('Цастай');
    expect(w.dzudRisk).toBe('medium');
    expect(w.dzudLabel).toBe('Дунд');
    expect(w.humidity).toBe(70);
    expect(w.windSpeed).toBe(8);
  });

  it('null input → empty weather', () => {
    const w = normalizeBackendWeather(null);
    expect(w.provider).toBe('backend');
    expect(w.temp).toBeNull();
    expect(w.condition).toBe('unknown');
    expect(w.dzudRisk).toBe('unknown');
  });

  it('dzud_risk numeric → бага категори руу буулгана', () => {
    const w = normalizeBackendWeather({ dzud_risk: 0.8 });
    expect(w.dzudRisk).toBe('high');
  });

  it('temp string байвал null (регрессийн защита)', () => {
    const w = normalizeBackendWeather({ temp: '-10' });
    expect(w.temp).toBeNull();
  });
});

describe('normalizeOpenWeather', () => {
  it('OpenWeather shape → normalized', () => {
    const raw = {
      weather: [{ main: 'Snow', description: 'light snow' }],
      main: { temp: -28, humidity: 65 },
      wind: { speed: 14 },
    };
    const w = normalizeOpenWeather(raw, 'Ховд');
    expect(w.provider).toBe('openweather');
    expect(w.aimag).toBe('Ховд');
    expect(w.condition).toBe('snow');
    expect(w.temp).toBe(-28);
    // -28°C + wind 14 → high
    expect(w.dzudRisk).toBe('high');
    expect(w.dzudLabel).toBe('Өндөр');
  });

  it('Хоосон response → empty weather', () => {
    const w = normalizeOpenWeather(null, 'Төв');
    expect(w.condition).toBe('unknown');
    expect(w.temp).toBeNull();
  });

  it('дулаан цаг → low зуд', () => {
    const raw = {
      weather: [{ main: 'Clear' }],
      main: { temp: 15 },
      wind: { speed: 2 },
    };
    const w = normalizeOpenWeather(raw, 'Төв');
    expect(w.dzudRisk).toBe('low');
  });
});

describe('conditionLabel / dzudLabel / emptyWeather / severity', () => {
  it('Монгол шошго буцаана', () => {
    expect(conditionLabel('clear')).toBe('Цэлмэг');
    expect(conditionLabel('snow')).toBe('Цастай');
    expect(dzudLabel('high')).toBe('Өндөр');
    expect(dzudLabel('unknown')).toBe('—');
  });

  it('emptyWeather нь provider-тай буцаана', () => {
    const w = emptyWeather('met-mongolia');
    expect(w.provider).toBe('met-mongolia');
    expect(w.temp).toBeNull();
  });

  it('severity score: low=0, medium=1, high=2', () => {
    expect(dzudSeverityScore('low')).toBe(0);
    expect(dzudSeverityScore('medium')).toBe(1);
    expect(dzudSeverityScore('high')).toBe(2);
    expect(dzudSeverityScore('unknown')).toBe(0);
  });
});

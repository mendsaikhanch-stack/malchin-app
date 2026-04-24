import { getDailyTasks } from '../daily-tasks';

describe('getDailyTasks — улирлаар', () => {
  it('1-р сар (өвөл) — winter task гарна', () => {
    const t = getDailyTasks({ month: 1, role: 'malchin', hasLivestock: true });
    expect(t.length).toBeLessThanOrEqual(3);
    expect(t.some((x) => x.id.startsWith('w'))).toBe(true);
  });

  it('4-р сар (хавар) — spring task гарна', () => {
    const t = getDailyTasks({ month: 4, role: 'malchin', hasLivestock: true });
    expect(t.some((x) => x.id.startsWith('s') && !x.id.startsWith('sp') && !x.id.startsWith('sa') && !x.id.startsWith('su'))).toBe(true);
  });

  it('7-р сар (зун) — summer task гарна', () => {
    const t = getDailyTasks({ month: 7, role: 'malchin', hasLivestock: true });
    expect(t.some((x) => x.id.startsWith('su'))).toBe(true);
  });

  it('10-р сар (намар) — autumn task гарна', () => {
    const t = getDailyTasks({ month: 10, role: 'malchin', hasLivestock: true });
    expect(t.some((x) => x.id.startsWith('a'))).toBe(true);
  });

  it('12-р сар өвөл гэж тооцогдоно', () => {
    const t = getDailyTasks({ month: 12, role: 'malchin', hasLivestock: true });
    expect(t.some((x) => x.id.startsWith('w'))).toBe(true);
  });
});

describe('getDailyTasks — эрсдэлийн override', () => {
  it('dzudRisk=high үед "Сэрэмжлүүлэг..." task эхэнд', () => {
    const t = getDailyTasks({ month: 7, role: 'malchin', hasLivestock: true, dzudRisk: 'high' });
    expect(t[0].id).toBe('alert');
    expect(t[0].priority).toBe('high');
  });

  it('hasHighAlert=true үед alert task мөн эхэнд', () => {
    const t = getDailyTasks({ month: 7, role: 'malchin', hasLivestock: true, hasHighAlert: true });
    expect(t.some((x) => x.id === 'alert')).toBe(true);
  });

  it('weatherTemp < -25 үед "Хүйтний..." task эхэнд', () => {
    const t = getDailyTasks({ month: 1, role: 'malchin', hasLivestock: true, weatherTemp: -30 });
    expect(t[0].id).toBe('cold');
  });

  it('weatherTemp -20 үед cold override байхгүй', () => {
    const t = getDailyTasks({ month: 1, role: 'malchin', hasLivestock: true, weatherTemp: -20 });
    expect(t.some((x) => x.id === 'cold')).toBe(false);
  });
});

describe('getDailyTasks — role-тэй', () => {
  it('bag_darga — эрсдэлт өрх шалгах task гарна', () => {
    const t = getDailyTasks({ month: 7, role: 'bag_darga', hasLivestock: false });
    expect(t.some((x) => x.id.startsWith('bd'))).toBe(true);
  });

  it('sum_admin — 7 хоногийн тайлан task гарна', () => {
    const t = getDailyTasks({ month: 7, role: 'sum_admin', hasLivestock: false });
    expect(t.some((x) => x.id.startsWith('sa'))).toBe(true);
  });

  it('khorshoo — захиалга нэгтгэх task гарна', () => {
    const t = getDailyTasks({ month: 7, role: 'khorshoo', hasLivestock: false });
    expect(t.some((x) => x.id.startsWith('k'))).toBe(true);
  });

  it('service_provider — дуудлагын хуваарь task гарна', () => {
    const t = getDailyTasks({ month: 7, role: 'service_provider', hasLivestock: false });
    expect(t.some((x) => x.id.startsWith('sp'))).toBe(true);
  });

  it('malchin + hasLivestock=false — улирлын task гарсаар (role=malchin өөрөө олгоно)', () => {
    const t = getDailyTasks({ month: 7, role: 'malchin', hasLivestock: false });
    // malchin-д seasonal task нь hasLivestock=false ч гэсэн гарна
    expect(t.length).toBeGreaterThan(0);
    expect(t.some((x) => x.id.startsWith('su'))).toBe(true);
  });

  it('role=null + hasLivestock=false — хоосон', () => {
    const t = getDailyTasks({ month: 7, role: null, hasLivestock: false });
    expect(t.length).toBe(0);
  });
});

describe('getDailyTasks — cap ба хэлбэр', () => {
  it('3-аас олон task буцаахгүй', () => {
    const t = getDailyTasks({
      month: 7,
      role: 'bag_darga',
      hasLivestock: true,
      dzudRisk: 'high',
      weatherTemp: -30,
      hasHighAlert: true,
    });
    expect(t.length).toBeLessThanOrEqual(3);
  });

  it('high priority эхэнд ирнэ', () => {
    const t = getDailyTasks({ month: 4, role: 'malchin', hasLivestock: true });
    expect(t[0].priority).toBe('high');
  });

  it('давхардсан title нэг л удаа орно', () => {
    const t = getDailyTasks({ month: 4, role: 'bag_darga', hasLivestock: true });
    const titles = t.map((x) => x.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('бүх task нь шаардлагатай field-тэй', () => {
    const t = getDailyTasks({ month: 4, role: 'malchin', hasLivestock: true });
    for (const task of t) {
      expect(task.id).toBeTruthy();
      expect(task.emoji).toBeTruthy();
      expect(task.title).toBeTruthy();
      expect(task.detail).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(task.priority);
    }
  });
});

describe('getDailyTasks — emoji цэвэр', () => {
  it('emoji-д 🤰 (хүний жирэмсэн) байхгүй', () => {
    for (let m = 1; m <= 12; m++) {
      const t = getDailyTasks({ month: m, role: 'malchin', hasLivestock: true });
      for (const task of t) {
        expect(task.emoji).not.toBe('🤰');
        expect(task.emoji).not.toBe('🤱');
      }
    }
  });
});

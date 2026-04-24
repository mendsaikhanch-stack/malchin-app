import {
  ADVISORY_TEMPLATES,
  ADVISORY_CATEGORIES,
  CATEGORY_LABELS,
  getTemplatesByCategory,
  getTemplatesForSeason,
  findTemplateById,
  searchTemplatesByTag,
  type AdvisoryCategory,
} from '../advisory-templates';

describe('ADVISORY_TEMPLATES seed', () => {
  it('яг 15 template (PRD баталсан)', () => {
    expect(ADVISORY_TEMPLATES).toHaveLength(15);
  });

  it('бүх id нь unique', () => {
    const ids = ADVISORY_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('бүх answer нь PRD schema-д нийцнэ (now, why, steps, caution, risks, notify)', () => {
    for (const t of ADVISORY_TEMPLATES) {
      expect(typeof t.answer.now).toBe('string');
      expect(t.answer.now.length).toBeGreaterThan(10);
      expect(typeof t.answer.why).toBe('string');
      expect(t.answer.why.length).toBeGreaterThan(10);
      expect(Array.isArray(t.answer.steps)).toBe(true);
      expect(Array.isArray(t.answer.caution)).toBe(true);
      expect(Array.isArray(t.answer.risks)).toBe(true);
      expect(Array.isArray(t.answer.notify)).toBe(true);
    }
  });

  it('steps нь PRD-ийн дагуу 3–7 алхамтай', () => {
    for (const t of ADVISORY_TEMPLATES) {
      expect(t.answer.steps.length).toBeGreaterThanOrEqual(3);
      expect(t.answer.steps.length).toBeLessThanOrEqual(7);
    }
  });

  it('risks нь хоосон биш (ямар ч template эрсдэлгүй биш)', () => {
    for (const t of ADVISORY_TEMPLATES) {
      expect(t.answer.risks.length).toBeGreaterThan(0);
    }
  });

  it('notify нь хоосон биш (мэдээлэл өгөх ёстой хүн үргэлж байна)', () => {
    for (const t of ADVISORY_TEMPLATES) {
      expect(t.answer.notify.length).toBeGreaterThan(0);
    }
  });

  it('category бүгд mapped (тодорхойгүй category байхгүй)', () => {
    for (const t of ADVISORY_TEMPLATES) {
      expect(ADVISORY_CATEGORIES).toContain(t.category);
    }
  });

  it('tags бүгд тохирно (дор хаяж 1 tag)', () => {
    for (const t of ADVISORY_TEMPLATES) {
      expect(t.tags.length).toBeGreaterThan(0);
    }
  });
});

describe('Template distribution — MVP хамрагдах хүрээ', () => {
  it('migration category дор хаяж 3 template (гол ялгарал)', () => {
    expect(getTemplatesByCategory('migration').length).toBeGreaterThanOrEqual(3);
  });

  it('health + emergency нийт дор хаяж 3 (малын эрүүл мэнд)', () => {
    const healthCount = getTemplatesByCategory('health').length;
    const emergencyCount = getTemplatesByCategory('emergency').length;
    expect(healthCount + emergencyCount).toBeGreaterThanOrEqual(3);
  });

  it('feed ангилал дор хаяж 2', () => {
    expect(getTemplatesByCategory('feed').length).toBeGreaterThanOrEqual(2);
  });

  it('processing ангилал дор хаяж 2 (цагаан идээ + борц)', () => {
    expect(getTemplatesByCategory('processing').length).toBeGreaterThanOrEqual(2);
  });

  it('reproduction дор хаяж 1 (төл / хээлтүүлэг)', () => {
    expect(getTemplatesByCategory('reproduction').length).toBeGreaterThanOrEqual(1);
  });
});

describe('CATEGORY_LABELS', () => {
  it('бүх category-д label', () => {
    for (const cat of ADVISORY_CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });
});

describe('getTemplatesByCategory', () => {
  it('тохирох category-ын бүх template-ийг буцаана', () => {
    const r = getTemplatesByCategory('migration');
    expect(r.every((t) => t.category === 'migration')).toBe(true);
  });

  it('байхгүй category-д хоосон array', () => {
    const r = getTemplatesByCategory('xxx' as AdvisoryCategory);
    expect(r).toEqual([]);
  });
});

describe('getTemplatesForSeason', () => {
  it('хавар: season-гүй + spring-тэй template-ууд', () => {
    const r = getTemplatesForSeason('spring');
    expect(r.length).toBeGreaterThan(0);
    for (const t of r) {
      if (t.season) {
        expect(t.season).toContain('spring');
      }
    }
  });

  it('өвөл: зудын бэлтгэл багтах ёстой', () => {
    const r = getTemplatesForSeason('winter');
    const hasDzud = r.some((t) => t.id === 'dzud-prep');
    expect(hasDzud).toBe(true);
  });

  it('зун: дайричлан идээ багтах ёстой (summer season-тай)', () => {
    const r = getTemplatesForSeason('summer');
    const hasDairy = r.some((t) => t.id === 'dairy-process');
    expect(hasDairy).toBe(true);
  });
});

describe('findTemplateById', () => {
  it('байгаа id-г олно', () => {
    const t = findTemplateById('migration-when');
    expect(t).not.toBeNull();
    expect(t?.question).toBe('Хэзээ нүүх вэ?');
  });

  it('байхгүй id → null', () => {
    expect(findTemplateById('not-real')).toBeNull();
  });
});

describe('searchTemplatesByTag', () => {
  it('"нүүдэл" хайлтад migration template-ууд', () => {
    const r = searchTemplatesByTag('нүүдэл');
    expect(r.length).toBeGreaterThan(0);
  });

  it('"зуд" хайлтад зудын бэлтгэл олдоно', () => {
    const r = searchTemplatesByTag('зуд');
    const hasDzud = r.some((t) => t.id === 'dzud-prep');
    expect(hasDzud).toBe(true);
  });

  it('question-ы text-ээр олдоно', () => {
    const r = searchTemplatesByTag('хээлтүүлэг');
    expect(r.length).toBeGreaterThan(0);
  });

  it('хоосон query → хоосон array', () => {
    expect(searchTemplatesByTag('')).toEqual([]);
    expect(searchTemplatesByTag('   ')).toEqual([]);
  });

  it('регистрт хамааралгүй (case insensitive)', () => {
    const lower = searchTemplatesByTag('нүүдэл');
    const upper = searchTemplatesByTag('НҮҮДЭЛ');
    expect(upper.length).toBe(lower.length);
  });
});

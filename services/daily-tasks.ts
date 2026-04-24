import type { UserRole } from '@/hooks/use-user-role';

export type DailyTask = {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  priority: 'low' | 'medium' | 'high';
};

type Context = {
  month: number; // 1-12
  role: UserRole | null;
  hasLivestock: boolean;
  weatherTemp?: number;
  dzudRisk?: 'low' | 'medium' | 'high';
  hasHighAlert?: boolean;
};

function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month === 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

const SEASONAL_TASKS: Record<string, DailyTask[]> = {
  winter: [
    { id: 'w1', emoji: '🐑', title: 'Сул дорой мал шалгах', detail: 'Хүйтний нөхцөлд сульдсан мал бойжуулалтад авах', priority: 'high' },
    { id: 'w2', emoji: '🌾', title: 'Өвс тэжээлийн нөөц тооцох', detail: 'Өдрийн хэрэгцээ × үлдсэн хоног', priority: 'high' },
    { id: 'w3', emoji: '🏠', title: 'Хашаа хороогоо шалгах', detail: 'Салхинаас хамгаалах, дээврийн цоорхой', priority: 'medium' },
    { id: 'w4', emoji: '💧', title: 'Ус уулгах', detail: 'Мөс хагалж халуун ус өгөх', priority: 'medium' },
    { id: 'w5', emoji: '🔥', title: 'Галын бэлтгэл шалгах', detail: 'Түлш, аргал хангалттай эсэх', priority: 'low' },
  ],
  spring: [
    { id: 's1', emoji: '🐑', title: 'Төллөлтөд бэлтгэх', detail: 'Хээл авсан мал, тусгай байр, халуун ус', priority: 'high' },
    { id: 's2', emoji: '🚶', title: 'Хаваржаанд нүүх төлөвлөгөө', detail: 'Бэлчээр, зам, тээвэр', priority: 'high' },
    { id: 's3', emoji: '🐐', title: 'Ямааны савалгаа', detail: 'Улирлын тогтмол үйл ажил', priority: 'medium' },
    { id: 's4', emoji: '💉', title: 'Вакцинжуулалт шалгах', detail: 'Сумын хуваариар', priority: 'medium' },
    { id: 's5', emoji: '🐑', title: 'Хургалах хонь ялгах', detail: 'Тусгаарлах, тордох', priority: 'medium' },
  ],
  summer: [
    { id: 'su1', emoji: '🌿', title: 'Бэлчээр ээлжлэх', detail: 'Нэг газарт 3-4 хоногоос удаахгүй', priority: 'high' },
    { id: 'su2', emoji: '💧', title: 'Ус, усан сан шалгах', detail: 'Эх үүсвэр ширгэхгүй байх', priority: 'high' },
    { id: 'su3', emoji: '🥛', title: 'Цагаан идээ боловсруулах', detail: 'Айраг, тараг, ааруул, шар тос', priority: 'medium' },
    { id: 'su4', emoji: '🐎', title: 'Унаа малын тоног шалгах', detail: 'Тохом, эмээл, дөрөө', priority: 'low' },
    { id: 'su5', emoji: '🌾', title: 'Өвс хадах цаг тохируулах', detail: 'Хаврын тархмалтай газар ургалт харах', priority: 'medium' },
  ],
  autumn: [
    { id: 'a1', emoji: '🌾', title: 'Өвс бэлтгэх', detail: 'Өвлийн хэрэгцээ: мал нэг толгой × 5-7 кг × 180 хоног', priority: 'high' },
    { id: 'a2', emoji: '🏠', title: 'Өвөлжөөгөө бэлдэх', detail: 'Цэвэрлэгээ, засвар, бэлтгэл', priority: 'high' },
    { id: 'a3', emoji: '❤️', title: 'Хээлтүүлэг эхлүүлэх', detail: 'Бүх хүйсийг тусгаарлах/холбох', priority: 'high' },
    { id: 'a4', emoji: '🥩', title: 'Мах борц хийх', detail: 'Намрын даагт малыг хэрэглээнд', priority: 'medium' },
    { id: 'a5', emoji: '💰', title: 'Худалдаа, зах зээл', detail: 'Намрын ноос, арьс, шир', priority: 'medium' },
  ],
};

const ROLE_TASKS: Partial<Record<UserRole, DailyTask[]>> = {
  bag_darga: [
    { id: 'bd1', emoji: '📋', title: 'Эрсдэлт өрх шалгах', detail: 'Удаан идэвхжээгүй, отор гарсан өрх', priority: 'high' },
    { id: 'bd2', emoji: '📢', title: 'Сумын мэдэгдэл түгээх', detail: 'Шинэ мэдэгдэл байвал багийн өрхүүдэд', priority: 'medium' },
    { id: 'bd3', emoji: '📊', title: '7 хоногийн тайлан', detail: 'Өрх тус бүрийн тойм', priority: 'medium' },
  ],
  sum_admin: [
    { id: 'sa1', emoji: '📊', title: '7 хоногийн тайлан', detail: 'Баг тус бүрийн идэвхи, мэдэгдлийн хувь', priority: 'high' },
    { id: 'sa2', emoji: '📢', title: 'Мэдэгдэл илгээх', detail: 'Тоолго, вакцин, сургалт', priority: 'medium' },
    { id: 'sa3', emoji: '👥', title: 'Багийн дарга нартай уулзалт', detail: 'Долоо хоногийн хуралтай уялдах', priority: 'medium' },
  ],
  khorshoo: [
    { id: 'k1', emoji: '📦', title: 'Захиалга нэгтгэх', detail: 'Гишүүдээс ирсэн захиалга', priority: 'high' },
    { id: 'k2', emoji: '💰', title: 'Зах зээлийн үнэ шалгах', detail: 'Ноолуур, сүү, махны үнэ', priority: 'medium' },
    { id: 'k3', emoji: '🚚', title: 'Тээвэр зохион байгуулах', detail: 'Захиалгад тохирсон', priority: 'medium' },
  ],
  service_provider: [
    { id: 'sp1', emoji: '📞', title: 'Дуудлагын хуваарь', detail: 'Өнөөдрийн хуваарилагдсан үйлчилгээ', priority: 'high' },
    { id: 'sp2', emoji: '📍', title: 'Маршрут төлөвлөх', detail: 'Хамгийн бага зам', priority: 'medium' },
    { id: 'sp3', emoji: '🧰', title: 'Багаж тоног шалгах', detail: 'Дутуу зүйл байвал нөхөх', priority: 'medium' },
  ],
};

export function getDailyTasks(ctx: Context): DailyTask[] {
  const season = getSeason(ctx.month);
  const all: DailyTask[] = [];

  // Role-specific тэргүүлж
  if (ctx.role && ROLE_TASKS[ctx.role]) {
    all.push(...(ROLE_TASKS[ctx.role] as DailyTask[]));
  }

  // Сезоны үндсэн
  if (ctx.hasLivestock || ctx.role === 'malchin') {
    all.push(...SEASONAL_TASKS[season]);
  }

  // Эрсдэлийн override
  if (ctx.dzudRisk === 'high' || ctx.hasHighAlert) {
    all.unshift({
      id: 'alert',
      emoji: '🚨',
      title: 'Сэрэмжлүүлэг уншаад хариу арга хэмжээ ав',
      detail: 'Өндөр эрсдэлтэй нөхцөл — сум/багийн заавар дагах',
      priority: 'high',
    });
  }
  if (typeof ctx.weatherTemp === 'number' && ctx.weatherTemp < -25) {
    all.unshift({
      id: 'cold',
      emoji: '🥶',
      title: 'Хүйтний нөхцөл — сул мал онц анхаарал',
      detail: 'Хашаа орчим, ус, нэмэлт тэжээл',
      priority: 'high',
    });
  }

  // Эхнйи 3-ыг буцаана (priority-оор эхэлж high ирнэ)
  const weight = { high: 3, medium: 2, low: 1 };
  const sorted = all.sort((a, b) => weight[b.priority] - weight[a.priority]);
  // Дубликат title-ыг арилгах
  const seen = new Set<string>();
  const unique = sorted.filter((t) => {
    if (seen.has(t.title)) return false;
    seen.add(t.title);
    return true;
  });
  return unique.slice(0, 3);
}

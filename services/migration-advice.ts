export type MigrationAdvice = {
  action: 'move' | 'prepare' | 'stay' | 'otor';
  title: string;
  urgency: 'now' | 'soon' | 'later';
  reasons: string[];
  steps: string[];
  destination?: string; // 'winter' | 'spring' | 'summer' | 'autumn' | 'otor'
  daysUntil?: number;
};

type Context = {
  month: number; // 1-12
  weatherTemp?: number;
  dzudRisk?: 'low' | 'medium' | 'high';
  pastureCondition?: 'poor' | 'fair' | 'good';
};

export function getMigrationAdvice(ctx: Context): MigrationAdvice {
  const { month, dzudRisk, pastureCondition, weatherTemp } = ctx;

  // Зудын өндөр эрсдэл → яаралтай отор
  if (dzudRisk === 'high') {
    return {
      action: 'otor',
      title: 'Оторлох бодолд орох цаг',
      urgency: 'now',
      reasons: [
        'Зудын өндөр эрсдэлтэй гэж зарлагдлаа',
        'Бэлчээрийн даацаас давсан',
        'Сум/аймгийн отор зөвшөөрлийг авах хэрэгтэй',
      ],
      steps: [
        'Сумын Засаг даргын тамгын газарт отор зөвшөөрөл авах',
        'Очих газрын малчинтай зөвшилцөх',
        'Сул мал, төлтэй малыг хамгаалах',
        'Тэжээлийн нөөцтэй гарах',
        'Цагаар эргэн нэгдэх төлөвлөгөө',
      ],
      destination: 'otor',
    };
  }

  // Хаврын нүүдэл (3-р сар сүүл, 4-р сар)
  if (month === 3) {
    return {
      action: 'prepare',
      title: 'Хаваржаа руу нүүх бэлтгэл',
      urgency: 'soon',
      reasons: [
        'Хаврын нар жигдэрсэн',
        'Өвөлжөөний бэлчээр сэргэх хэрэгтэй',
        'Төллөлтөд тохиромжтой газар',
      ],
      steps: [
        'Хаваржаа очиж, хашаа шалгах',
        'Зам тэг болох хүртэл хүлээх',
        'Тэжээлийн үлдэгдлээ төлөвлөх',
        'Төллөсөн малыг яаралтай шилжүүлэхгүй',
      ],
      destination: 'spring',
      daysUntil: 14,
    };
  }

  if (month === 4) {
    return {
      action: 'move',
      title: 'Хаваржаа руу нүүх',
      urgency: 'now',
      reasons: [
        'Хаврын бэлчээр хурдан сэргэх эрэн',
        'Өвөлжөө удаан байлгах нь бэлчээрт хортой',
        'Хаваржаа хэрэгтэй тохиолдоход ч хөнгөн',
      ],
      steps: [
        'Нүүх өдөр цаг агаар, салхийг шалгах',
        'Эхлээд насанд хүрсэн мал',
        'Дараа нь төл, сул мал',
        'Нэг өдөрт 15-20 км-ээс хэтрүүлэхгүй',
      ],
      destination: 'spring',
    };
  }

  // Зуслан (5-6 сар)
  if (month === 5 || month === 6) {
    return {
      action: pastureCondition === 'poor' ? 'move' : 'prepare',
      title: 'Зусланд гарах бэлтгэл',
      urgency: pastureCondition === 'poor' ? 'now' : 'soon',
      reasons: [
        'Хаврын бэлчээр дуусах дөхөж байна',
        'Зуны халуунаас өмнө сэрүүн газарт',
        'Усны эх үүсвэртэй газар',
      ],
      steps: [
        'Зуслангийн бэлчээрийн даац шалгах',
        'Усан тохиолгоо хийх',
        'Нар сарнихаас хамгаалах сүүдэр',
      ],
      destination: 'summer',
    };
  }

  // Зун (7-8 сар) — бэлчээр ээлжлэх
  if (month === 7 || month === 8) {
    return {
      action: 'stay',
      title: 'Бэлчээр ээлжлэх',
      urgency: 'soon',
      reasons: [
        'Нэг газар удаан байж болохгүй',
        'Бэлчээрт 3-4 хоногоос удаахгүй',
      ],
      steps: [
        'Одоогийн бэлчээрийн үлдэгдэл тооцох',
        'Ойролцоох талбар руу шилжүүлэх',
        'Усны ойр зайд анхаарах',
      ],
    };
  }

  // Намаржаа (9-10 сар)
  if (month === 9 || month === 10) {
    return {
      action: month === 9 ? 'prepare' : 'move',
      title: 'Намаржаа руу шилжих',
      urgency: month === 9 ? 'soon' : 'now',
      reasons: [
        'Өвс шарлах, тариан талбайг чөлөөлөх',
        'Өвлийн бэлчээрт яваачихахгүй',
        'Хээлтүүлэг эхлэх цаг',
      ],
      steps: [
        'Намаржааны бэлчээр шалгах',
        'Хээлтүүлэгт бэлдэх',
        'Намрын нөөц (өвс) эцэслэж байршуулах',
      ],
      destination: 'autumn',
    };
  }

  // Өвлийн бэлтгэл (11 сар)
  if (month === 11) {
    return {
      action: 'move',
      title: 'Өвөлжөө руу нүүх',
      urgency: 'now',
      reasons: [
        'Анхны цас орохоос өмнө',
        'Хашаа шалгаж, бэлэн байх',
        'Өвс, тэжээл овоолоод бэлэн',
      ],
      steps: [
        'Өвөлжөөний хашаа, байр шалгах',
        'Тэжээлийн нөөц хуримтлуулах',
        'Аргал, түлш хангалттай',
        'Ус уулгах тогоо, сав',
      ],
      destination: 'winter',
    };
  }

  // Өвөл (12, 1, 2 сар)
  if (month === 12 || month <= 2) {
    if (weatherTemp !== undefined && weatherTemp < -30) {
      return {
        action: 'stay',
        title: 'Нүүхгүй, байрандаа байх',
        urgency: 'now',
        reasons: [
          'Хүйтний хэр дааж байна',
          'Нүүдэл хийх нь сул малд эрсдэл',
        ],
        steps: [
          'Хашаа дотор барих',
          'Нэмэлт тэжээл',
          'Бүлээн ус',
        ],
      };
    }
    return {
      action: 'stay',
      title: 'Өвөлжөөндөө байх',
      urgency: 'later',
      reasons: [
        'Зуд, цас бага үед л богино зайтай шилжих боломжтой',
        'Тэжээл удирдлагыг сайжруулах',
      ],
      steps: [
        'Тэжээл хэмнэх',
        'Сул малыг тусгаарлах',
        'Цаг агаарыг байнга шалгах',
      ],
    };
  }

  // Default
  return {
    action: 'stay',
    title: 'Онцгой нүүдэл байхгүй',
    urgency: 'later',
    reasons: ['Улирлын дундах хугацаа'],
    steps: ['Бэлчээрийн төлөв байнга шалгах'],
  };
}

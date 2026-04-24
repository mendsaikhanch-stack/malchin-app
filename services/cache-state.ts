// Stale-while-revalidate UI state (pure).
//
// cachedFetch буцаадаг {fromCache, offline, expired} flag-уудаас UI-д
// харуулах tone + label-г тодорхойлно. Хэрэглэгчид "шинэ / хуучирсан /
// оффлайн" төлөвийг нэг харцаар ойлгуулах зорилготой.

export type CacheMeta = {
  fromCache: boolean;
  offline: boolean;
  expired: boolean;
};

export type StaleTone = 'fresh' | 'stale' | 'offline';

export type StaleState = {
  show: boolean;       // badge харуулах эсэх
  tone: StaleTone;
  label: string;       // Монгол шошго
  icon: string;        // emoji
};

// Priority: offline > stale > fresh
// Учир нь offline = сүлжээгүй → bar чухал мэдээлэл
// Stale = хугацаа дууссан cache, хэрэглэгчид шинэчлэхийг санал болгох
// Fresh = одоогийн шинэ → badge үгүй
export function getStaleState(meta: CacheMeta): StaleState {
  if (meta.offline) {
    return {
      show: true,
      tone: 'offline',
      label: 'Оффлайн',
      icon: '📡',
    };
  }
  if (meta.fromCache && meta.expired) {
    return {
      show: true,
      tone: 'stale',
      label: 'Хуучирсан',
      icon: '⏱',
    };
  }
  return {
    show: false,
    tone: 'fresh',
    label: 'Шинэ',
    icon: '✓',
  };
}

// Tone → hex color (UI-д ашиглана)
export function staleTint(tone: StaleTone): string {
  switch (tone) {
    case 'offline':
      return '#B00020';    // danger red
    case 'stale':
      return '#FF8F00';    // warning orange
    case 'fresh':
      return '#2E7D32';    // success green
  }
}

// Human-readable хугацааг тооцоолох (2 цаг 15 минутын өмнө)
export function timeSince(timestamp: number, now: number = Date.now()): string {
  const diffMs = now - timestamp;
  if (diffMs < 0) return 'одоохон';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'дөнгөж сая';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} минутын өмнө`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} цагийн өмнө`;
  const days = Math.floor(hr / 24);
  return `${days} өдрийн өмнө`;
}

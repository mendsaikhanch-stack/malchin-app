import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Дэлгэц бүрийн "бүдэг сэдэвт дэвсгэр"-ийн төв тохиргоо.
//
// Зорилго: хуудас бүрт өөр, сэдэвтэйгээ холбоотой дүрслэл, ГЭХДЭЭ
// текстийн харагдацанд нөлөөлөхгүйгээр МАШ бүдэг. Offline-first тул
// зураг bundle хийхгүй — вектор icon (MaterialCommunityIcons) ашиглана.
//
// Ирээдүйд: higgsfield credit нэмэгдвэл энэ mapping-д `bg: require(...)`
// талбар нэмж, ScreenBackground-д photoreal зураг тавихад л хангалттай —
// бусад код өөрчлөгдөхгүй.

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type ScreenTopic =
  | 'home'
  | 'livestock'
  | 'weather'
  | 'market'
  | 'pasture'
  | 'health'
  | 'finance'
  | 'insurance'
  | 'livestock_insurance'
  | 'news'
  | 'knowledge'
  | 'household'
  | 'profile'
  | 'breeding'
  | 'diagnose'
  | 'advisor'
  | 'map'
  | 'manage'
  | 'scanner';

export type ScreenArt = {
  icon: MCIName;     // том watermark icon
  tintTop: string;   // дээд gradient өнгө (rgba, бага alpha)
  tintIcon: string;  // watermark icon өнгө (rgba, маш бага alpha)
};

// Өнгөний гэр бүл: ногоон (бэлчээр/мал), цэнхэр (тэнгэр/цаг агаар),
// алт-шар (зах зээл/санхүү/даатгал), улаан (эрүүл мэнд), индиго (мэдлэг).
const GREEN = { tintTop: 'rgba(45,125,63,0.10)', tintIcon: 'rgba(45,125,63,0.05)' };
const BLUE = { tintTop: 'rgba(92,107,192,0.10)', tintIcon: 'rgba(92,107,192,0.05)' };
const AMBER = { tintTop: 'rgba(255,143,0,0.10)', tintIcon: 'rgba(255,143,0,0.05)' };
const RED = { tintTop: 'rgba(229,57,53,0.09)', tintIcon: 'rgba(229,57,53,0.045)' };
const INDIGO = { tintTop: 'rgba(63,81,181,0.10)', tintIcon: 'rgba(63,81,181,0.05)' };

export const SCREEN_ART: Record<ScreenTopic, ScreenArt> = {
  home: { icon: 'home-variant', ...GREEN },
  livestock: { icon: 'sheep', ...GREEN },
  pasture: { icon: 'sprout', ...GREEN },
  breeding: { icon: 'cow', ...GREEN },
  weather: { icon: 'weather-partly-cloudy', ...BLUE },
  map: { icon: 'map-marker-radius', ...BLUE },
  market: { icon: 'storefront-outline', ...AMBER },
  finance: { icon: 'cash-multiple', ...AMBER },
  insurance: { icon: 'shield-check', ...AMBER },
  livestock_insurance: { icon: 'shield-sun-outline', ...AMBER },
  health: { icon: 'medical-bag', ...RED },
  diagnose: { icon: 'stethoscope', ...RED },
  news: { icon: 'bullhorn-outline', ...INDIGO },
  knowledge: { icon: 'book-open-page-variant', ...INDIGO },
  advisor: { icon: 'robot-happy-outline', ...INDIGO },
  household: { icon: 'home-group', ...GREEN },
  profile: { icon: 'account-circle-outline', ...GREEN },
  manage: { icon: 'cog-outline', ...BLUE },
  scanner: { icon: 'qrcode-scan', ...INDIGO },
};

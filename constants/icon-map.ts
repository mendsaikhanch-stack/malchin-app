import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Emoji → MaterialCommunityIcons (бодит дүрст вектор icon) хөрвүүлэлтийн
// нийтлэг helper. Дэлгэц хооронд нэг мөр, тогтвортой icon ашиглахын тулд.
//
// ТЭМДЭГЛЭЛ: мал төрлийн emoji (🐑🐐🐄🐎🐫) хэвээр үлддэг — MCI-д goat/camel
// байхгүй бөгөөд мал emoji нь өнгөлөг, танигдахуйц тул орлуулахгүй.

export type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// 4 улирлын байршил (өвөлжөө/хаваржаа/зуслан/намаржаа)
export function seasonIcon(season: string): MCIName {
  const s = (season || '').toLowerCase();
  if (s.includes('өвөл') || s.includes('winter')) return 'snowflake';
  if (s.includes('хавар') || s.includes('spring')) return 'flower-outline';
  if (s.includes('зус') || s.includes('зун') || s.includes('summer')) return 'white-balance-sunny';
  if (s.includes('намар') || s.includes('autumn') || s.includes('fall')) return 'leaf-maple';
  return 'map-marker-outline';
}

// Цаг агаарын нөхцөл → MCI weather icon
export function weatherIcon(condition: string): MCIName {
  const c = (condition || '').toLowerCase();
  if (c.includes('clear') || c.includes('sunny') || c.includes('цэлмэг') || c.includes('нар'))
    return 'weather-sunny';
  if (c.includes('rain') || c.includes('бороо')) return 'weather-rainy';
  if (c.includes('snow') || c.includes('цас')) return 'weather-snowy';
  if (c.includes('wind') || c.includes('салхи')) return 'weather-windy';
  if (c.includes('storm') || c.includes('шуурга')) return 'weather-lightning-rainy';
  if (c.includes('cloud') || c.includes('үүл')) return 'weather-cloudy';
  return 'weather-partly-cloudy';
}

// Нийтлэг функциональ / чимэглэлийн emoji → MCI нэр.
// Дэлгэц хөрвүүлэхэд лавлах хүснэгт болгож ашиглана.
export const UI_ICON: Record<string, MCIName> = {
  '✏️': 'pencil', '✏': 'pencil',
  '🗑️': 'delete-outline', '🗑': 'delete-outline',
  '🔍': 'magnify',
  '➕': 'plus-circle-outline',
  '❌': 'close-circle-outline', '✕': 'close', '✖️': 'close',
  '✅': 'check-circle', '✓': 'check', '☑️': 'checkbox-marked-outline',
  '📞': 'phone', '📱': 'cellphone',
  '📍': 'map-marker', '🏕️': 'tent', '🏕': 'tent',
  '📋': 'clipboard-text-outline', '📄': 'file-document-outline', '📝': 'note-edit-outline',
  '📅': 'calendar', '📆': 'calendar',
  '📊': 'chart-bar', '📈': 'trending-up', '📉': 'trending-down', '📐': 'ruler',
  '💰': 'cash', '💳': 'credit-card-outline', '🧮': 'calculator-variant-outline',
  '💡': 'lightbulb-on-outline',
  '🛒': 'cart-outline', '📦': 'package-variant', '🏷️': 'tag-outline', '🏷': 'tag-outline',
  '🚚': 'truck', '🔧': 'wrench-outline', '🛠️': 'tools', '🛠': 'tools',
  '👷': 'account-hard-hat', '👥': 'account-group', '👪': 'account-group',
  '🏦': 'bank-outline', '🏥': 'hospital-box-outline', '🏛️': 'bank', '🏛': 'bank',
  '🤝': 'handshake-outline', '🛡️': 'shield-check-outline', '🛡': 'shield-check-outline',
  '💊': 'pill', '💉': 'needle', '🧬': 'dna', '⚕️': 'medical-bag', '⚕': 'medical-bag',
  '🌾': 'barley', '🌿': 'sprout-outline', '🌱': 'seed-outline', '💧': 'water-outline',
  '🥛': 'cup-water', '🧶': 'tshirt-crew-outline',
  '❄️': 'snowflake', '❄': 'snowflake', '🌸': 'flower-outline',
  '☀️': 'white-balance-sunny', '☀': 'white-balance-sunny', '🍂': 'leaf-maple',
  '⚠️': 'alert-outline', '⚠': 'alert-outline', '🚨': 'alert',
  '⚡': 'flash-outline', '🎉': 'party-popper', '☠️': 'skull-outline', '☠': 'skull-outline',
  '⚙️': 'cog-outline', '⚙': 'cog-outline', '🔒': 'lock-outline', '⭐': 'star',
  '🔄': 'refresh', '↩️': 'undo', '↩': 'undo', '→': 'arrow-right', '➤': 'send',
  '↑': 'arrow-up', '↓': 'arrow-down', '🔖': 'bookmark', '📑': 'bookmark-outline',
  '🤖': 'robot-happy-outline', '🎤': 'microphone', '💬': 'chat-outline',
  '🟢': 'circle', '🔴': 'circle', '❓': 'help-circle-outline',
};

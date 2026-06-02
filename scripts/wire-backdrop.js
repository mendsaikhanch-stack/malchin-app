const fs = require('fs');
const path = require('path');
const dir = 'app/(tabs)';
const map = {
  'livestock.tsx': 'livestock', 'weather.tsx': 'weather', 'market.tsx': 'market',
  'pasture.tsx': 'pasture', 'health.tsx': 'health', 'finance.tsx': 'finance',
  'insurance.tsx': 'insurance', 'livestock-insurance.tsx': 'livestock_insurance',
  'news.tsx': 'news', 'knowledge.tsx': 'knowledge', 'household.tsx': 'household',
  'profile.tsx': 'profile', 'breeding.tsx': 'breeding', 'diagnose.tsx': 'diagnose',
  'ai-advisor.tsx': 'advisor', 'map-view.tsx': 'map', 'manage.tsx': 'manage',
  'scanner.tsx': 'scanner',
};
const IMPORT = "import { ScreenBackdrop } from '@/components/screen-background';";
for (const [file, topic] of Object.entries(map)) {
  const fp = path.join(dir, file);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('ScreenBackdrop')) { console.log('SKIP (already) ' + file); continue; }
  const lines = src.split('\n');
  let idx = lines.findIndex((l) => l.includes("from '@/constants/theme'"));
  if (idx === -1) idx = lines.findIndex((l) => l.includes("from 'react-native'"));
  if (idx === -1) { console.log('NO-ANCHOR ' + file); continue; }
  lines.splice(idx + 1, 0, IMPORT);
  src = lines.join('\n');
  const inject = (tok) => tok + '\n      <ScreenBackdrop topic="' + topic + '" />';
  const tokenStyles = '<SafeAreaView style={styles.container}>';
  const tokenS = '<SafeAreaView style={s.container}>';
  if (src.includes(tokenStyles)) src = src.split(tokenStyles).join(inject(tokenStyles));
  else if (src.includes(tokenS)) src = src.split(tokenS).join(inject(tokenS));
  else { console.log('NO-CONTAINER ' + file); continue; }
  fs.writeFileSync(fp, src);
  console.log('OK ' + file + ' -> ' + topic);
}

import puppeteer from 'puppeteer';

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicGhvbmUiOiI5OTAwMTEyMiIsImlhdCI6MTc3NTI4NjQzOCwiZXhwIjoxNzc3ODc4NDM4fQ.W_EbD2ML8JK4xancZhNmaResyjXNk0GcVGB1kmV1vaE';

const screens = [
  { name: 'home', path: '/', label: 'Нүүр' },
  { name: 'livestock', path: '/livestock', label: 'Мал бүртгэл' },
  { name: 'breeding', path: '/breeding', label: 'Төллөлт/Үржил' },
  { name: 'health', path: '/health', label: 'Эрүүл мэнд' },
  { name: 'pasture', path: '/pasture', label: 'Бэлчээр' },
  { name: 'finance', path: '/finance', label: 'Санхүү' },
  { name: 'insurance', path: '/insurance', label: 'Даатгал & Халамж' },
  { name: 'market', path: '/market', label: 'Зах зээл' },
  { name: 'news', path: '/news', label: 'Мэдээ' },
  { name: 'weather', path: '/weather', label: 'Цаг агаар' },
  { name: 'diagnose', path: '/diagnose', label: 'AI Оношлогч' },
  { name: 'household', path: '/household', label: 'Өрхийн горим' },
  { name: 'manage', path: '/manage', label: 'Удирдлага' },
  { name: 'profile', path: '/profile', label: 'Профайл' },
];

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  for (const screen of screens) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('@malchin_onboarding_done', 'true');
      localStorage.setItem('@malchin_token', token);
    }, JWT_TOKEN);

    try {
      await page.goto(`http://localhost:8081${screen.path}`, { waitUntil: 'networkidle2', timeout: 25000 });
      await new Promise(r => setTimeout(r, 4000));
      await page.screenshot({ path: `screenshots/${screen.name}.png` });
      console.log(`OK: ${screen.label}`);
    } catch (e) {
      console.log(`FAIL: ${screen.label} - ${e.message.slice(0, 60)}`);
    }
    await page.close();
  }

  await browser.close();
  console.log('\nDone!');
}

run();

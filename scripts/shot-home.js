// Onboarding-г алгасаж (localStorage seed) home дэлгэцийг зураг авах.
const puppeteer = require('puppeteer');

const SNAPSHOT = {
  phone: '99112233', otpVerified: true,
  lastName: 'Доржийн', firstName: 'Бат',
  role: 'malchin', aimag: 'Төв', sum: 'Алтанбулаг', bag: '2-р баг',
  livestock: { horse: 35, cow: 18, sheep: 240, goat: 160, camel: 6 },
  preferences: { weather: true, alerts: true, market: true, listings: true },
};

(async () => {
  const url = process.argv[2] || 'http://localhost:8081';
  const out = process.argv[3] || 'C:/Users/MNG/malchin-app/scripts/home.png';
  const browser = await puppeteer.launch({
    headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  page.on('console', (m) => { if (m.type() === 'error') return; });

  // 1) Эхний ачаалал — origin-г тогтооно
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  // 2) localStorage seed (onboarding done + жишээ малчин)
  await page.evaluate((snap) => {
    localStorage.setItem('@malchin_onboarding_done', 'true');
    localStorage.setItem('@malchin_onboarding_data', JSON.stringify(snap));
  }, SNAPSHOT);
  // 3) Reload → gate нь home руу оруулна
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });
  await new Promise((r) => setTimeout(r, 9000));
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });

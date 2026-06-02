// Expo web дэлгэцийн зураг авах (puppeteer). Утасны хэмжээний viewport.
const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:8081';
  const out = process.argv[3] || 'C:/Users/MNG/malchin-app/scripts/home.png';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  page.on('console', (m) => console.log('PAGE:', m.type(), m.text().slice(0, 200)));
  console.log('navigating', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });
  // Bundle compile + render хүлээх
  await new Promise((r) => setTimeout(r, 12000));
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });

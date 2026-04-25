import puppeteer from 'puppeteer';

const screens = [
  { name: 'home', path: '/', label: 'Нүүр хуудас' },
  { name: 'livestock', path: '/livestock', label: 'Мал бүртгэл' },
  { name: 'market', path: '/market', label: 'Зах зээл' },
  { name: 'news', path: '/news', label: 'Мэдээ & Боломж' },
  { name: 'knowledge', path: '/knowledge', label: 'Ухаан' },
  { name: 'diagnose', path: '/diagnose', label: 'Оношлогч' },
  { name: 'funfacts', path: '/funfacts', label: 'Танин мэдэхүй' },
  { name: 'shinjikh', path: '/shinjikh', label: 'Шинжих ухаан' },
  { name: 'manage', path: '/manage', label: 'Удирдлага' },
  { name: 'finance', path: '/finance', label: 'Санхүү' },
  { name: 'weather', path: '/weather', label: 'Цаг агаар' },
  { name: 'ai-advisor', path: '/ai-advisor', label: 'Ухаалаг Зөвлөгч' },
  { name: 'profile', path: '/profile', label: 'Профайл' },
];

const devices = [
  { name: 'iphone', width: 390, height: 844, label: 'iPhone 14' },
  { name: 'android', width: 412, height: 915, label: 'Android' },
];

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  for (const device of devices) {
    for (const screen of screens) {
      const page = await browser.newPage();
      await page.setViewport({ width: device.width, height: device.height, deviceScaleFactor: 2 });
      try {
        await page.goto(`http://localhost:8081${screen.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        const filename = `screenshots/${device.name}-${screen.name}.png`;
        await page.screenshot({ path: filename, fullPage: false });
        console.log(`✅ ${device.label} - ${screen.label} -> ${filename}`);
      } catch (e) {
        console.log(`❌ ${device.label} - ${screen.label}: ${e.message}`);
      }
      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone!');
}

run();

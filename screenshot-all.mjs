import puppeteer from 'puppeteer';

const screens = [
  { name: 'home', path: '/', label: 'Нүүр' },
  { name: 'livestock', path: '/livestock', label: 'Мал' },
  { name: 'market', path: '/market', label: 'Зах зээл' },
  { name: 'finance', path: '/finance', label: 'Санхүү' },
  { name: 'weather', path: '/weather', label: 'Цаг агаар' },
  { name: 'ai-advisor', path: '/ai-advisor', label: 'Зөвлөгч' },
  { name: 'profile', path: '/profile', label: 'Профайл' },
];

const devices = [
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'Android', width: 412, height: 915 },
];

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  // Calculate canvas size: 7 screens side by side for each device, stacked vertically
  const phoneW = 390;
  const phoneH = 844;
  const scale = 1.5;
  const gap = 20;
  const labelH = 40;
  const deviceLabelH = 50;
  const totalW = screens.length * (phoneW * scale + gap) + gap;
  const totalH = devices.length * (phoneH * scale + labelH + deviceLabelH + gap) + gap;

  // Capture individual screenshots first
  const shots = {};
  for (const device of devices) {
    shots[device.name] = [];
    for (const screen of screens) {
      const page = await browser.newPage();
      await page.setViewport({ width: device.width, height: device.height, deviceScaleFactor: 2 });
      try {
        await page.goto(`http://localhost:8081${screen.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        const buf = await page.screenshot({ fullPage: false, encoding: 'base64' });
        shots[device.name].push({ label: screen.label, data: buf });
        console.log(`✅ ${device.name} - ${screen.label}`);
      } catch (e) {
        console.log(`❌ ${device.name} - ${screen.label}: ${e.message}`);
        shots[device.name].push(null);
      }
      await page.close();
    }
  }

  // Create combined page
  const page = await browser.newPage();
  const canvasW = Math.round(totalW);
  const canvasH = Math.round(totalH);
  await page.setViewport({ width: canvasW, height: canvasH, deviceScaleFactor: 1 });

  let html = `<html><head><style>
    body { margin: 0; padding: ${gap}px; background: #1a1a2e; display: flex; flex-direction: column; gap: ${gap}px; font-family: -apple-system, sans-serif; }
    .device-row { display: flex; flex-direction: column; gap: 8px; }
    .device-label { color: #fff; font-size: 24px; font-weight: 800; padding-left: 4px; }
    .screens { display: flex; gap: ${gap}px; }
    .screen { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .screen-label { color: #aaa; font-size: 14px; font-weight: 600; }
    .phone-frame {
      width: ${phoneW * scale}px; height: ${phoneH * scale}px;
      border-radius: 24px; overflow: hidden;
      border: 3px solid #333; background: #000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .phone-frame img { width: 100%; height: 100%; object-fit: cover; }
  </style></head><body>`;

  for (const device of devices) {
    html += `<div class="device-row"><div class="device-label">${device.name}</div><div class="screens">`;
    const deviceShots = shots[device.name];
    for (let i = 0; i < screens.length; i++) {
      const shot = deviceShots[i];
      html += `<div class="screen"><div class="phone-frame">`;
      if (shot) {
        html += `<img src="data:image/png;base64,${shot.data}" />`;
      } else {
        html += `<div style="color:#666;display:flex;align-items:center;justify-content:center;height:100%">Error</div>`;
      }
      html += `</div><div class="screen-label">${screens[i].label}</div></div>`;
    }
    html += `</div></div>`;
  }

  html += `</body></html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'screenshots/all-screens.png', fullPage: true });
  console.log('\n✅ Combined screenshot -> screenshots/all-screens.png');

  await browser.close();
}

run();

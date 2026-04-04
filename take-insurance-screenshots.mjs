import puppeteer from 'puppeteer';

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicGhvbmUiOiI5OTAwMTEyMiIsImlhdCI6MTc3NTI4NjQzOCwiZXhwIjoxNzc3ODc4NDM4fQ.W_EbD2ML8JK4xancZhNmaResyjXNk0GcVGB1kmV1vaE';

async function clickTab(page, tabText) {
  await page.evaluate((text) => {
    const walk = (node) => {
      if (node.nodeType === 3 && node.textContent.includes(text)) {
        let el = node.parentElement;
        while (el) {
          if (el.onclick || el.getAttribute('role') === 'button' || el.style.cursor === 'pointer') {
            el.click();
            return true;
          }
          el = el.parentElement;
        }
        node.parentElement?.click();
        return true;
      }
      for (const child of node.childNodes) {
        if (walk(child)) return true;
      }
      return false;
    };
    walk(document.body);
  }, tabText);
  await new Promise(r => setTimeout(r, 2000));
}

async function openPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((token) => {
    localStorage.setItem('@malchin_onboarding_done', 'true');
    localStorage.setItem('@malchin_token', token);
  }, JWT_TOKEN);
  await page.goto('http://localhost:8081/insurance', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  return page;
}

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  // Tab 1: НД
  console.log('Taking: НД...');
  const p1 = await openPage(browser);
  await p1.screenshot({ path: 'screenshots/insurance-nd.png' });
  console.log('OK');
  await p1.close();

  // Tab 2: Малын даатгал
  console.log('Taking: Малын даатгал...');
  const p2 = await openPage(browser);
  await clickTab(p2, 'Малын');
  await p2.screenshot({ path: 'screenshots/insurance-livestock.png' });
  console.log('OK');
  await p2.close();

  // Tab 3: Халамж
  console.log('Taking: Халамж...');
  const p3 = await openPage(browser);
  await clickTab(p3, 'Халамж');
  await p3.screenshot({ path: 'screenshots/insurance-welfare.png' });
  console.log('OK');
  await p3.close();

  // Tab 4: Баримт
  console.log('Taking: Баримт...');
  const p4 = await openPage(browser);
  await clickTab(p4, 'Баримт');
  await p4.screenshot({ path: 'screenshots/insurance-docs.png' });
  console.log('OK');
  await p4.close();

  // Tab 5: Тооцоо
  console.log('Taking: Тооцоо...');
  const p5 = await openPage(browser);
  await clickTab(p5, 'Тооцоо');
  await p5.screenshot({ path: 'screenshots/insurance-calc.png' });
  console.log('OK');
  await p5.close();

  await browser.close();
  console.log('\nDone!');
}

run();

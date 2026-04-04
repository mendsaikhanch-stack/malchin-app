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

async function openFinancePage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // Set localStorage BEFORE navigating
  await page.evaluateOnNewDocument((token) => {
    localStorage.setItem('@malchin_onboarding_done', 'true');
    localStorage.setItem('@malchin_token', token);
  }, JWT_TOKEN);

  await page.goto('http://localhost:8081/finance', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  return page;
}

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  // Tab 1: Overview
  console.log('Taking: Finance Overview...');
  const p1 = await openFinancePage(browser);
  await p1.screenshot({ path: 'screenshots/finance-overview.png' });
  console.log('OK: Тойм');
  await p1.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 1000));
  await p1.screenshot({ path: 'screenshots/finance-overview-bottom.png' });
  console.log('OK: Тойм (доод)');
  await p1.close();

  // Tab 2: Records
  console.log('Taking: Finance Records...');
  const p2 = await openFinancePage(browser);
  await clickTab(p2, 'Бүртгэл');
  await p2.screenshot({ path: 'screenshots/finance-records.png' });
  console.log('OK: Бүртгэл');
  await p2.close();

  // Tab 3: Report
  console.log('Taking: Finance Report...');
  const p3 = await openFinancePage(browser);
  await clickTab(p3, 'Тайлан');
  await p3.screenshot({ path: 'screenshots/finance-report.png' });
  console.log('OK: Тайлан');
  await p3.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 1000));
  await p3.screenshot({ path: 'screenshots/finance-report-bottom.png' });
  console.log('OK: Тайлан (доод)');
  await p3.close();

  await browser.close();
  console.log('\nDone!');
}

run();

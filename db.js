const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "malchin.db"));

// WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    aimag TEXT DEFAULT '',
    sum TEXT DEFAULT '',
    bag TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS livestock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    animal_type TEXT NOT NULL,
    total_count INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, animal_type)
  );

  CREATE TABLE IF NOT EXISTS livestock_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    animal_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    note TEXT DEFAULT '',
    event_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS finance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    category TEXT DEFAULT '',
    amount REAL NOT NULL,
    note TEXT DEFAULT '',
    record_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    severity TEXT DEFAULT 'yellow',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS market_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT DEFAULT 'livestock',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    animal_type TEXT DEFAULT '',
    quantity INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    location TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transport_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    animal_type TEXT DEFAULT '',
    quantity INTEGER DEFAULT 0,
    price_offer REAL DEFAULT 0,
    contact TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    truck_type TEXT DEFAULT '',
    capacity TEXT DEFAULT '',
    region TEXT DEFAULT '',
    rating REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    body TEXT DEFAULT '',
    source TEXT DEFAULT '',
    source_url TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    region TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    is_urgent INTEGER DEFAULT 0,
    published_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    organization TEXT DEFAULT '',
    eligibility TEXT DEFAULT '',
    amount TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    contact TEXT DEFAULT '',
    region TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    link_url TEXT DEFAULT '',
    advertiser TEXT DEFAULT '',
    placement TEXT DEFAULT 'home',
    category TEXT DEFAULT 'general',
    priority INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    start_date TEXT DEFAULT (datetime('now')),
    end_date TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'rss',
    category TEXT DEFAULT 'news',
    last_fetched TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS shinjikh (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    details TEXT DEFAULT '',
    emoji TEXT DEFAULT '',
    tags TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS fun_facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    emoji TEXT DEFAULT '',
    source TEXT DEFAULT '',
    tags TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS animal_diseases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_type TEXT NOT NULL,
    disease_name TEXT NOT NULL,
    disease_name_latin TEXT DEFAULT '',
    severity TEXT DEFAULT 'medium',
    symptoms TEXT NOT NULL,
    causes TEXT DEFAULT '',
    treatment TEXT NOT NULL,
    prevention TEXT DEFAULT '',
    emergency INTEGER DEFAULT 0,
    contagious INTEGER DEFAULT 0,
    season TEXT DEFAULT '',
    tags TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS bank_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    usd_buy REAL DEFAULT 0,
    usd_sell REAL DEFAULT 0,
    cny_buy REAL DEFAULT 0,
    cny_sell REAL DEFAULT 0,
    rub_buy REAL DEFAULT 0,
    rub_sell REAL DEFAULT 0,
    loan_rate_min REAL DEFAULT 0,
    loan_rate_max REAL DEFAULT 0,
    herder_loan_rate REAL DEFAULT 0,
    deposit_rate REAL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS national_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    value REAL DEFAULT 0,
    unit TEXT DEFAULT '',
    year INTEGER DEFAULT 2025,
    region TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS traditional_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    season TEXT DEFAULT '',
    animal_type TEXT DEFAULT '',
    tags TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS intl_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commodity TEXT NOT NULL,
    commodity_mn TEXT NOT NULL,
    unit TEXT NOT NULL,
    price_usd REAL DEFAULT 0,
    prev_price_usd REAL DEFAULT 0,
    market TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS market_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_name TEXT NOT NULL,
    aimag TEXT NOT NULL,
    location TEXT DEFAULT '',
    item_type TEXT NOT NULL,
    item_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    wholesale_price REAL DEFAULT 0,
    retail_price REAL DEFAULT 0,
    prev_price REAL DEFAULT 0,
    supply TEXT DEFAULT 'normal',
    demand TEXT DEFAULT 'normal',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS raw_material_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_type TEXT NOT NULL,
    material_name TEXT NOT NULL,
    grade TEXT DEFAULT '',
    unit TEXT NOT NULL,
    price REAL DEFAULT 0,
    prev_price REAL DEFAULT 0,
    buyer TEXT DEFAULT '',
    location TEXT DEFAULT '',
    supply TEXT DEFAULT 'normal',
    demand TEXT DEFAULT 'normal',
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed alerts if empty
const alertCount = db.prepare("SELECT COUNT(*) as cnt FROM alerts").get();
if (alertCount.cnt === 0) {
  const insertAlert = db.prepare("INSERT INTO alerts (region, type, title, description, severity) VALUES (?, ?, ?, ?, ?)");
  insertAlert.run("Архангай", "wolf", "Чоно үзэгдсэн", "Батцэнгэл суманд 3 чоно үзэгдсэн", "orange");
  insertAlert.run("Хөвсгөл", "dzud", "Цас их ороно", "3 хоногт 20см цас орно", "yellow");
  insertAlert.run("Дорнод", "disease", "Шүлхий өвчин", "Хэрлэн суманд шүлхий өвчин илэрсэн", "red");
}

// Seed drivers if empty
const driverCount = db.prepare("SELECT COUNT(*) as cnt FROM drivers").get();
if (driverCount.cnt === 0) {
  const insertDriver = db.prepare("INSERT INTO drivers (name, phone, truck_type, capacity, region, rating) VALUES (?, ?, ?, ?, ?, ?)");
  insertDriver.run("Болдоо", "95001122", "Камаз", "150 хонь / 30 үхэр", "Архангай, Төв, УБ", 4.8);
  insertDriver.run("Тулга", "95003344", "ЗИЛ", "80 хонь / 15 үхэр", "Хөвсгөл, Булган, Дархан", 4.5);
  insertDriver.run("Ганбат", "95005566", "ISUZU", "200 хонь / 40 үхэр", "Өмнөговь, Дундговь, Төв", 4.9);
}

// Seed market prices
const mpCount = db.prepare("SELECT COUNT(*) as cnt FROM market_prices").get();
if (mpCount.cnt === 0) {
  const mp = db.prepare("INSERT INTO market_prices (market_name, aimag, location, item_type, item_name, unit, wholesale_price, retail_price, prev_price, supply, demand) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  // Улаанбаатар - Хүнсний захууд
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "livestock", "Хонины мах (ясгүй)", "кг", 12000, 14000, 13000, "normal", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "livestock", "Хонины мах (ястай)", "кг", 9000, 11000, 10000, "normal", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "livestock", "Үхрийн мах (ясгүй)", "кг", 14000, 16000, 15000, "low", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "livestock", "Үхрийн мах (ястай)", "кг", 11000, 13000, 12500, "low", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "livestock", "Адууны мах", "кг", 10000, 12000, 11000, "normal", "normal");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "livestock", "Ямааны мах", "кг", 9500, 11500, 10500, "normal", "normal");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "livestock", "Тэмээний мах", "кг", 8000, 10000, 9000, "low", "low");
  mp.run("Нарантуул зах", "Улаанбаатар", "Баянзүрх", "livestock", "Хонины мах (ясгүй)", "кг", 11500, 13500, 12500, "normal", "high");
  mp.run("Нарантуул зах", "Улаанбаатар", "Баянзүрх", "livestock", "Үхрийн мах (ясгүй)", "кг", 13500, 15500, 14500, "low", "high");
  mp.run("Нарантуул зах", "Улаанбаатар", "Баянзүрх", "livestock", "Адууны мах", "кг", 9500, 11500, 10500, "normal", "normal");
  // Амьд малын үнэ
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "live", "Хонь (амьд)", "толгой", 180000, 220000, 200000, "normal", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "live", "Ямаа (амьд)", "толгой", 150000, 190000, 170000, "normal", "normal");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "live", "Үхэр (амьд)", "толгой", 1500000, 2200000, 1800000, "low", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "live", "Адуу (амьд)", "толгой", 800000, 1500000, 1200000, "normal", "normal");
  // Орон нутгийн захууд
  mp.run("Төв аймгийн зах", "Төв", "Зуунмод", "livestock", "Хонины мах (ясгүй)", "кг", 10000, 12000, 11000, "high", "normal");
  mp.run("Төв аймгийн зах", "Төв", "Зуунмод", "livestock", "Үхрийн мах (ясгүй)", "кг", 12000, 14000, 13000, "normal", "normal");
  mp.run("Төв аймгийн зах", "Төв", "Зуунмод", "live", "Хонь (амьд)", "толгой", 160000, 200000, 180000, "high", "normal");
  mp.run("Төв аймгийн зах", "Төв", "Зуунмод", "live", "Үхэр (амьд)", "толгой", 1300000, 1800000, 1600000, "normal", "normal");
  mp.run("Архангай зах", "Архангай", "Цэцэрлэг", "livestock", "Хонины мах (ясгүй)", "кг", 9500, 11500, 10500, "high", "normal");
  mp.run("Архангай зах", "Архангай", "Цэцэрлэг", "livestock", "Үхрийн мах (ясгүй)", "кг", 11500, 13500, 12500, "normal", "normal");
  mp.run("Архангай зах", "Архангай", "Цэцэрлэг", "live", "Хонь (амьд)", "толгой", 150000, 180000, 165000, "high", "normal");
  mp.run("Өвөрхангай зах", "Өвөрхангай", "Арвайхээр", "livestock", "Хонины мах (ясгүй)", "кг", 9000, 11000, 10000, "high", "normal");
  mp.run("Өвөрхангай зах", "Өвөрхангай", "Арвайхээр", "live", "Хонь (амьд)", "толгой", 145000, 175000, 160000, "high", "normal");
  mp.run("Дорнод зах", "Дорнод", "Чойбалсан", "livestock", "Хонины мах (ясгүй)", "кг", 10500, 12500, 11500, "normal", "normal");
  mp.run("Дорнод зах", "Дорнод", "Чойбалсан", "livestock", "Үхрийн мах (ясгүй)", "кг", 12500, 14500, 13500, "normal", "high");
  mp.run("Ховд зах", "Ховд", "Жаргалант", "livestock", "Хонины мах (ясгүй)", "кг", 9000, 10500, 9800, "high", "low");
  mp.run("Ховд зах", "Ховд", "Жаргалант", "live", "Ямаа (амьд)", "толгой", 120000, 160000, 140000, "high", "normal");
  // Сүү, цагаан идээ
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "dairy", "Сүү (түүхий)", "литр", 2500, 3500, 3000, "low", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "dairy", "Ааруул", "кг", 15000, 25000, 20000, "normal", "high");
  mp.run("Да хүрээ зах", "Улаанбаатар", "Баянгол", "dairy", "Бяслаг", "кг", 12000, 18000, 15000, "normal", "normal");
  mp.run("Төв аймгийн зах", "Төв", "Зуунмод", "dairy", "Сүү (түүхий)", "литр", 2000, 3000, 2500, "normal", "normal");
}

// Seed raw material prices
const rmCount = db.prepare("SELECT COUNT(*) as cnt FROM raw_material_prices").get();
if (rmCount.cnt === 0) {
  const rm = db.prepare("INSERT INTO raw_material_prices (material_type, material_name, grade, unit, price, prev_price, buyer, location, supply, demand) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  // Ноолуур
  rm.run("cashmere", "Ноолуур (цагаан)", "1-р зэрэг", "кг", 150000, 140000, "Говь ХК", "Улаанбаатар", "normal", "high");
  rm.run("cashmere", "Ноолуур (цагаан)", "2-р зэрэг", "кг", 120000, 115000, "Говь ХК", "Улаанбаатар", "normal", "high");
  rm.run("cashmere", "Ноолуур (бор)", "1-р зэрэг", "кг", 130000, 125000, "Говь ХК", "Улаанбаатар", "normal", "high");
  rm.run("cashmere", "Ноолуур (хар)", "1-р зэрэг", "кг", 110000, 105000, "Говь ХК", "Улаанбаатар", "high", "normal");
  rm.run("cashmere", "Ноолуур (цагаан)", "1-р зэрэг", "кг", 145000, 135000, "Орон нутгийн худалдаачид", "Архангай", "normal", "high");
  rm.run("cashmere", "Ноолуур (цагаан)", "1-р зэрэг", "кг", 140000, 130000, "Орон нутгийн худалдаачид", "Баян-Өлгий", "high", "normal");
  // Ноос
  rm.run("wool", "Хонины ноос", "Нарийн", "кг", 2500, 2200, "Монгол Ноос ХК", "Улаанбаатар", "high", "normal");
  rm.run("wool", "Хонины ноос", "Бүдүүн", "кг", 1500, 1400, "Монгол Ноос ХК", "Улаанбаатар", "high", "low");
  rm.run("wool", "Тэмээний ноос", "1-р зэрэг", "кг", 8000, 7500, "Монгол Ноос ХК", "Улаанбаатар", "low", "high");
  rm.run("wool", "Хонины ноос", "Нарийн", "кг", 2200, 2000, "Орон нутаг", "Төв", "high", "normal");
  // Арьс шир
  rm.run("hide", "Хонины арьс", "Түүхий", "ш", 8000, 7500, "Арьс шир ХК", "Улаанбаатар", "high", "normal");
  rm.run("hide", "Үхрийн шир", "Түүхий", "ш", 45000, 40000, "Арьс шир ХК", "Улаанбаатар", "normal", "high");
  rm.run("hide", "Ямааны арьс", "Түүхий", "ш", 6000, 5500, "Арьс шир ХК", "Улаанбаатар", "high", "normal");
  rm.run("hide", "Адууны шир", "Түүхий", "ш", 35000, 32000, "Арьс шир ХК", "Улаанбаатар", "normal", "normal");
  // Тэжээл
  rm.run("feed", "Өвс", "Хадлангийн", "боодол", 5000, 4500, "", "Төв", "normal", "high");
  rm.run("feed", "Тэжээл (холимог)", "Стандарт", "кг", 1200, 1100, "", "Улаанбаатар", "normal", "normal");
  rm.run("feed", "Гурил (тэжээлийн)", "2-р зэрэг", "кг", 800, 750, "", "Улаанбаатар", "normal", "low");
}

// Seed international prices
const ipCount = db.prepare("SELECT COUNT(*) as cnt FROM intl_prices").get();
if (ipCount.cnt === 0) {
  const ip = db.prepare("INSERT INTO intl_prices (commodity, commodity_mn, unit, price_usd, prev_price_usd, market) VALUES (?, ?, ?, ?, ?, ?)");
  ip.run("Cashmere (raw)", "Ноолуур (түүхий)", "кг", 42.5, 40.0, "London Fibre");
  ip.run("Cashmere (dehaired)", "Ноолуур (самнасан)", "кг", 95.0, 90.0, "London Fibre");
  ip.run("Sheep wool (fine)", "Хонины ноос (нарийн)", "кг", 3.2, 3.0, "Australian Wool Exchange");
  ip.run("Sheep wool (coarse)", "Хонины ноос (бүдүүн)", "кг", 1.8, 1.7, "Australian Wool Exchange");
  ip.run("Beef (boneless)", "Үхрийн мах (ясгүй)", "кг", 6.5, 6.2, "CME Group");
  ip.run("Lamb", "Хонины мах", "кг", 7.8, 7.5, "CME Group");
  ip.run("Horse meat", "Адууны мах", "кг", 4.5, 4.3, "EU Market");
  ip.run("Cattle hide", "Үхрийн арьс", "ш", 18.0, 17.0, "Chicago Hide");
  ip.run("Goat skin", "Ямааны арьс", "ш", 5.5, 5.0, "India Market");
  ip.run("Camel wool", "Тэмээний ноос", "кг", 12.0, 11.5, "Central Asia");
}

// Seed news
const newsCount = db.prepare("SELECT COUNT(*) as cnt FROM news").get();
if (newsCount.cnt === 0) {
  const n = db.prepare("INSERT INTO news (category, title, summary, source, region, tags, is_urgent, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  n.run("intl_market", "Дэлхийн ноолуурын үнэ 6%-иар өслөө", "Хятадын эрэлт нэмэгдсэнтэй холбоотойгоор Лондонгийн бирж дээр ноолуурын үнэ өссөн байна.", "Bloomberg", "", "ноолуур,экспорт,хятад", 0, "2026-04-01 10:00:00");
  n.run("intl_market", "Австралийн ноосны үнэ тогтвортой", "Australian Wool Exchange дээр нарийн ноосны үнэ $3.2/кг орчим тогтворжсон.", "Reuters", "", "ноос,австрали", 0, "2026-04-01 08:00:00");
  n.run("intl_market", "Хятад руу махны экспорт нэмэгдэж байна", "Монголын үхрийн мах Хятадын зах зээлд нэвтрэх боломж өргөжиж байна.", "MIAT News", "", "мах,экспорт,хятад", 0, "2026-03-30 14:00:00");
  n.run("intl_market", "ОХУ-ын арьс ширний импорт хязгаарлалт", "Оросын арьс ширний импортын шинэ журам 2026 оны 5-р сараас хэрэгжинэ.", "Trade.mn", "", "арьс,орос,импорт", 0, "2026-03-29 09:00:00");
  n.run("government", "Засгийн газар малчдын нийгмийн даатгалын шимтгэлийг төлнө", "2026 оны 4-р сараас эхлэн бүх малчдын НДШ-ийг төр хариуцна. Бүртгүүлэх хугацаа 5-р сарын 15 хүртэл.", "Засгийн газар", "", "нийгмийн даатгал,малчин", 1, "2026-04-01 12:00:00");
  n.run("government", "Хаврын тариалалтад зориулсан хөнгөлөлттэй зээл олгоно", "ХХААХҮЯ-аас 5%-ийн хүүтэй зээлийг малчин, тариаланчдад олгоно. Хугацаа: 12 сар.", "ХХААХҮЯ", "", "зээл,тариалалт", 1, "2026-03-28 10:00:00");
  n.run("government", "Мал эмнэлгийн үнэгүй вакцинжуулалт эхэллээ", "Улсын хэмжээнд шүлхий, цэцэг өвчний вакцинжуулалтыг үнэ төлбөргүй хийж эхэллээ.", "МЭҮГ", "", "вакцин,мал эмнэлэг", 1, "2026-03-27 08:00:00");
  n.run("local", "Архангай аймгийн Өндөр-Улаан суманд өвс тэжээлийн нөөц тарааж эхэллээ", "Аймгийн ЗДТГ-аас 500 тонн өвсийг хөнгөлөлттэй үнээр тараана.", "Архангай ЗДТГ", "Архангай", "өвс,тэжээл", 0, "2026-04-01 09:00:00");
  n.run("local", "Төв аймагт малчдын зөвлөгөөн болно", "4-р сарын 15-нд Зуунмод хотод малчдын уулзалт зохион байгуулна. Бүртгэл: 99112233.", "Төв аймаг ЗДТГ", "Төв", "зөвлөгөөн,малчин", 0, "2026-03-31 14:00:00");
  n.run("local", "Хөвсгөл аймагт чоно устгах ажиллагаа зохион байгуулна", "Мөрөн сумын нутагт чоно устгах ажиллагааг 4-р сарын 5-10-нд явуулна.", "Хөвсгөл ЗДТГ", "Хөвсгөл", "чоно,аюулгүй байдал", 0, "2026-03-30 11:00:00");
  n.run("opportunity", "IFAD: Малчдын амьжиргааг дэмжих төсөл - буцалтгүй тусламж", "Олон улсын хөдөө аж ахуйг хөгжүүлэх сан (IFAD) малчдын бүлэгт $5,000 хүртэлх буцалтгүй тусламж олгоно. Хугацаа: 6-р сарын 30.", "IFAD Mongolia", "", "тусламж,IFAD,малчин", 1, "2026-04-02 08:00:00");
  n.run("opportunity", "Хаан банк: Малчны зээл 1.5%-ийн хүүтэй", "Малчин иргэдэд 1-10 сая хүртэлх зээлийг барьцаагүйгээр олгоно. Хугацаа: 24 сар.", "Хаан банк", "", "зээл,банк", 1, "2026-04-01 10:00:00");
  n.run("opportunity", "Швейцарийн хөгжлийн агентлаг: Ноолуурын чанарыг сайжруулах сургалт", "Үнэгүй сургалт, 4-р сарын 20-25, Улаанбаатар. Бүртгэл: nooluursurgalt@sdc.mn", "SDC Mongolia", "", "сургалт,ноолуур", 0, "2026-03-29 10:00:00");
  n.run("opportunity", "Дэлхийн банк: Бэлчээрийн менежментийн грант $10,000 хүртэл", "Малчдын бүлгүүдэд бэлчээрийн тогтвортой менежментийн төсөлд грант олгоно. Хүсэлт: 5-р сарын 30 хүртэл.", "World Bank", "", "грант,бэлчээр", 1, "2026-03-28 09:00:00");
  n.run("opportunity", "ХААН банк + Засгийн газар: Малын индексжүүлсэн даатгал", "Зудын эрсдэлээс хамгаалах индексжүүлсэн даатгалд хамрагдах боломжтой. Хураамж: жилд ₮15,000/малчин.", "ХААН банк", "", "даатгал,зуд", 0, "2026-03-25 08:00:00");
}

// Seed programs
const pgCount = db.prepare("SELECT COUNT(*) as cnt FROM programs").get();
if (pgCount.cnt === 0) {
  const pg = db.prepare("INSERT INTO programs (category, title, description, organization, eligibility, amount, deadline, contact, region, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  pg.run("loan", "Малчны хөнгөлөлттэй зээл", "Мал аж ахуйн үйл ажиллагааг дэмжих зорилгоор 1.5%-ийн хүүтэй зээл", "Хаан банк", "Бүртгэлтэй малчин иргэн, 50+ толгой малтай", "₮1-10 сая", "2026-06-30", "1800-1234", "", "active");
  pg.run("loan", "Хаврын тариалалтын зээл", "Тариалалт, тэжээл бэлтгэлд 5%-ийн хүүтэй зээл", "ХХААХҮЯ", "Малчин, тариаланч", "₮5-20 сая", "2026-05-15", "51-262345", "", "active");
  pg.run("grant", "IFAD Малчдын амьжиргааг дэмжих", "Малчдын бүлгийн хамтын үйл ажиллагаанд буцалтгүй тусламж", "IFAD Mongolia", "5+ гишүүнтэй малчдын бүлэг", "$5,000 хүртэл", "2026-06-30", "ifad@mongolia.org", "", "active");
  pg.run("grant", "Бэлчээрийн менежментийн грант", "Бэлчээрийн тогтвортой ашиглалтын төсөл хэрэгжүүлэхэд", "World Bank", "Малчдын бүлэг, НГО", "$10,000 хүртэл", "2026-05-30", "wb-pasture@worldbank.org", "", "active");
  pg.run("training", "Ноолуурын чанар сайжруулах сургалт", "Ноолуур ангилах, хадгалах, зах зээлд нийлүүлэх сургалт (үнэгүй)", "SDC Mongolia", "Ямаа маллагч малчид", "Үнэгүй", "2026-04-20", "nooluursurgalt@sdc.mn", "", "active");
  pg.run("training", "Мал эмнэлгийн анхан шатны сургалт", "Малын өвчин таних, урьдчилан сэргийлэх сургалт", "МЭҮГ", "Бүх малчид", "Үнэгүй", "2026-05-01", "70111234", "", "active");
  pg.run("insurance", "Малын индексжүүлсэн даатгал", "Зудын эрсдэлээс хамгаалах даатгал, Засгийн газраас хамтран санхүүжүүлнэ", "ХААН банк + ЗГ", "Бүх малчид", "₮15,000/жил", "2026-12-31", "1800-1234", "", "active");
  pg.run("subsidy", "Ноос, ноолуурын урамшуулал", "Чанарын шаардлага хангасан ноос, ноолуурт кг тутамд урамшуулал олгоно", "ХХААХҮЯ", "Бүртгэлтэй малчин", "₮1,000-5,000/кг", "2026-09-30", "51-262345", "", "active");
}

// Seed bank rates
const bankCount = db.prepare("SELECT COUNT(*) as cnt FROM bank_rates").get();
if (bankCount.cnt === 0) {
  const b = db.prepare("INSERT INTO bank_rates (bank_name, bank_code, usd_buy, usd_sell, cny_buy, cny_sell, rub_buy, rub_sell, loan_rate_min, loan_rate_max, herder_loan_rate, deposit_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  b.run("Хаан банк", "khan", 3420, 3440, 470, 480, 37, 39, 1.6, 2.4, 1.5, 12.0);
  b.run("Голомт банк", "golomt", 3418, 3442, 469, 481, 36.5, 39.5, 1.7, 2.5, 1.7, 11.5);
  b.run("Худалдаа Хөгжлийн банк", "tdb", 3415, 3445, 468, 482, 36, 40, 1.8, 2.6, 1.8, 11.0);
  b.run("Хас банк", "xac", 3419, 3441, 470, 480, 37, 39, 1.5, 2.3, 1.4, 12.5);
  b.run("Төрийн банк", "state", 3420, 3440, 470, 480, 37, 39, 1.6, 2.4, 1.3, 11.0);
  b.run("Ариг банк", "arig", 3416, 3444, 468, 482, 36, 40, 1.9, 2.8, 1.9, 12.0);
}

// Seed national statistics
const statCount = db.prepare("SELECT COUNT(*) as cnt FROM national_stats").get();
if (statCount.cnt === 0) {
  const s = db.prepare("INSERT INTO national_stats (category, label, value, unit, year, region) VALUES (?, ?, ?, ?, ?, ?)");
  // Малын тоо (2025)
  s.run("livestock_total", "Нийт мал", 67100000, "толгой", 2025, "");
  s.run("livestock_type", "Хонь", 30200000, "толгой", 2025, "");
  s.run("livestock_type", "Ямаа", 26800000, "толгой", 2025, "");
  s.run("livestock_type", "Үхэр", 4900000, "толгой", 2025, "");
  s.run("livestock_type", "Адуу", 4200000, "толгой", 2025, "");
  s.run("livestock_type", "Тэмээ", 1000000, "толгой", 2025, "");
  // Аймгийн малын тоо
  s.run("livestock_region", "Өмнөговь", 5800000, "толгой", 2025, "Өмнөговь");
  s.run("livestock_region", "Архангай", 5200000, "толгой", 2025, "Архангай");
  s.run("livestock_region", "Өвөрхангай", 4900000, "толгой", 2025, "Өвөрхангай");
  s.run("livestock_region", "Баянхонгор", 4700000, "толгой", 2025, "Баянхонгор");
  s.run("livestock_region", "Төв", 4500000, "толгой", 2025, "Төв");
  s.run("livestock_region", "Завхан", 4300000, "толгой", 2025, "Завхан");
  s.run("livestock_region", "Хөвсгөл", 4100000, "толгой", 2025, "Хөвсгөл");
  s.run("livestock_region", "Дундговь", 3800000, "толгой", 2025, "Дундговь");
  // Экспорт
  s.run("export", "Ноолуурын экспорт", 9800, "тонн", 2025, "");
  s.run("export", "Махны экспорт", 45000, "тонн", 2025, "");
  s.run("export", "Ноосны экспорт", 28000, "тонн", 2025, "");
  s.run("export", "Арьс ширний экспорт", 3200000, "ширхэг", 2025, "");
  // Малчдын тоо
  s.run("herder", "Нийт малчин өрх", 233000, "өрх", 2025, "");
  s.run("herder", "Малчдын тоо", 378000, "хүн", 2025, "");
  // Зудын хохирол
  s.run("dzud", "2025 зудад үхсэн мал", 1200000, "толгой", 2025, "");
}

// Seed traditional knowledge
const tkCount = db.prepare("SELECT COUNT(*) as cnt FROM traditional_knowledge").get();
if (tkCount.cnt === 0) {
  const tk = db.prepare("INSERT INTO traditional_knowledge (category, title, content, season, animal_type, tags) VALUES (?, ?, ?, ?, ?, ?)");
  // Хонь
  tk.run("care", "Хонины тураал (тураа) эмчлэх", "Хонь тураалд нэрвэгдвэл биеийн температур ихсэж, ам хоншоороос шүлс гоожно. Эмчлэх арга: 1) Антибиотик тариа хийх 2) Хоолой хэсэгт люголь уусмал түрхэх 3) Маль дулаан байранд оруулж, зөөлөн тэжээлээр хооллох 4) Давстай бүлээн ус уулгах.", "", "sheep", "тураал,өвчин,эмчилгээ");
  tk.run("care", "Хонины цэцэг өвчин", "Цэцэг өвчинд нэрвэгдвэл арьсан дээр улаан тууралт гарна. Урьдчилан сэргийлэх: Жил бүр вакцинжуулах. Эмчлэх: Тусгаарлаж, шарх дээр йод түрхэнэ.", "", "sheep", "цэцэг,вакцин,өвчин");
  tk.run("breeding", "Хонины хээлтүүлгийн цаг", "Хонийг 10-11-р сард хээлтүүлнэ. Тогтоосон хугацаанд хээлтүүлбэл 3-4-р сард төллөнө. Нэг хуцаар 25-30 эм хонийг хээлтүүлнэ.", "autumn", "sheep", "хээлтүүлэг,үржил");
  tk.run("care", "Хурга тэжээх", "Шинэ төрсөн хургыг эхний 2 цагт эхийн сүүгээр хооллох маш чухал. Уураг нь дархлаа бий болгоно. 15 хоногтойгоос өвс идэж сурна.", "spring", "sheep", "хурга,тэжээл,төллөлт");
  // Ямаа
  tk.run("care", "Ямааны ноолуур самнах арга", "Ноолуурыг 4-5-р сард самнана. Хэт эрт самнавал ямаа даарна. Зөвхөн доод давхарга ноолуурыг самна, дээд ноосыг хөндөхгүй. Нэг ямаанаас 200-400гр ноолуур авна.", "spring", "goat", "ноолуур,самнах");
  tk.run("breeding", "Ямааны сайн үүлдэр сонгох", "Ноолуурын гарц сайтай ямааг сонгон үржүүлнэ. Сайн ухна: биеийн жин 40+ кг, ноолуурын гарц 400+ гр, цагаан өнгөтэй бол үнэ илүү.", "", "goat", "үүлдэр,ноолуур");
  // Үхэр
  tk.run("care", "Үхрийн гоц халдварт өвчнөөс сэргийлэх", "Шүлхий, бруцеллёз, сүрьеэ зэрэг өвчнөөс урьдчилан сэргийлж жил бүр вакцин хийлгэнэ. Шинжилгээ өгч, эрүүл гэрчилгээтэй байх нь зах зээлд борлуулах чухал нөхцөл.", "", "cattle", "өвчин,вакцин,шүлхий");
  tk.run("care", "Үнээний сүү сааль нэмэгдүүлэх", "Үнээг сайн ундаалж, шимт тэжээлээр хооллоно. Өдөрт 40-50 литр ус ууна. Цагаан будааны шар, хивэг, тэжээлийн холимог өгөхөд сүүний гарц нэмэгдэнэ.", "", "cattle", "сүү,тэжээл");
  // Адуу
  tk.run("care", "Адууны туурайн арчилгаа", "3-4 сар тутамд туурай хусаж, тэгшлэнэ. Чулуурхаг газар бэлчээрлэсэн адууны туурай элэгдэж, хагарч болно. Туурайны тос түрхэнэ.", "", "horse", "туурай,арчилгаа");
  tk.run("breeding", "Адууны давхалт", "Гүүг 3-р сарын сүүлээс давхалж эхэлнэ. Тэргүүлэгч азарга 15-20 гүүтэй адуунд хангалттай. Гүү 11 сар жирэмслэнэ.", "spring", "horse", "давхалт,үржил");
  // Тэмээ
  tk.run("care", "Тэмээний бөхтөрх", "Тэмээний бөх зулайрч нурвал тэжээл, ус хүрэлцэхгүй байгааг илтгэнэ. Өвөл тэмээнд хатсан өвс, давс, жимсний үлдэгдэл өгнө.", "", "camel", "бөх,тэжээл");
  // Улирлын зөвлөгөө
  tk.run("seasonal", "Хаврын малчны ажил", "1) Төллөж буй малыг сайн хариулах 2) Хурга, тугалд вакцин хийлгэх 3) Хашаа саравч засах 4) Ноолуур самнах 5) Бэлчээрийг сэлгэн ашиглах.", "spring", "", "хавар,төллөлт,вакцин");
  tk.run("seasonal", "Зуны малчны ажил", "1) Мал тарга хүч авах цаг 2) Хадлан бэлтгэл 3) Ус, бэлчээрийн менежмент 4) Ноос хяргах 5) Цагаан идээ бэлтгэх.", "summer", "", "зун,хадлан,ноос");
  tk.run("seasonal", "Намрын малчны ажил", "1) Малыг тарга хүчинд оруулах 2) Өвлийн нөөц тэжээл бэлтгэх 3) Хашаа засах 4) Мал тоолох 5) Хээлтүүлэг хийх.", "autumn", "", "намар,хээлтүүлэг,нөөц");
  tk.run("seasonal", "Өвлийн малчны ажил", "1) Хашаанд оруулж өвөлжих 2) Тэжээл зохицуулах 3) Ус олгох (мөс хайлуулах) 4) Зудын бэлэн байдал 5) Туранхай, өвчтэй малыг тусгаарлах.", "winter", "", "өвөл,зуд,хашаа");
  // Ардын ухаан
  tk.run("folk_wisdom", "Малын нас тодорхойлох", "Хонь, ямааны шүдээр нас тодорхойлно: 1 нас - сүүн шүдтэй, 2 нас - 2 байнгийн шүд, 3 нас - 4 шүд, 4 нас - 6 шүд, 5+ нас - бүх шүд байнгийн.", "", "", "нас,шүд");
  tk.run("folk_wisdom", "Цаг агаарыг урьдчилан таах", "Малчдын ажиглалт: 1) Шувуу намхан нисвэл бороо орно 2) Мал толгойгоо өргөж жинхэнэ зүгт харвал салхитай 3) Нохой газар ухвал хүйтэрнэ 4) Хонь бөөгнөрвөл шуурга болно.", "", "", "цаг агаар,ардын ухаан");
  tk.run("folk_wisdom", "Малд давс өгөх ач холбогдол", "7 хоногт 1-2 удаа давс долоолгоно. Давс нь: 1) Хоол боловсруулалтыг сайжруулна 2) Ус уух хэмжээг нэмнэ 3) Эрдэс бодисоор хангана 4) Паразит устгахад тусална.", "", "", "давс,тэжээл,эрүүл мэнд");
  tk.run("folk_wisdom", "Мал адгуусны жамаар зүгнэх", "Мал зүгнэх ардын арга: 1) Адуу их зогсвол аянга дуугарна 2) Хонь өндөр газар дэрслэн хэвтвэл цас орно 3) Үхэр ирвэгнэвэл бороо болно.", "", "", "зүгнэл,ардын ухаан");
}

// Seed animal diseases
const adCount = db.prepare("SELECT COUNT(*) as cnt FROM animal_diseases").get();
if (adCount.cnt === 0) {
  const d = db.prepare("INSERT INTO animal_diseases (animal_type, disease_name, disease_name_latin, severity, symptoms, causes, treatment, prevention, emergency, contagious, season, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

  // ========== ХОНЬ ==========
  d.run("sheep", "Шүлхий", "Foot-and-mouth disease", "critical",
    "Ам, хэл, туурайнд цэврүү гарах; шүлс гоожих; халуурах (41°C+); хоол иддэггүй; доголонтох",
    "Шүлхий вирус (FMDV). Агаараар, шууд хавьтлаар халдварлана.",
    "1) ЯАРАЛТАЙ малын эмчид мэдэгдэх\n2) Малыг бүрэн тусгаарлах\n3) Ам, туурайг давсны уусмалаар угаах\n4) Зөөлөн тэжээл өгөх\n5) Антибиотик (хоёрдогч халдвараас)\n6) Шарх дээр йод түрхэх",
    "Жил бүр вакцинжуулах. Шинэ мал карантинд байлгах.", 1, 1, "", "шүлхий,халуурах,туурай,ам");

  d.run("sheep", "Цэцэг", "Sheep pox", "high",
    "Арьсан дээр улаан товруу гарах; халуурах (40-42°C); нүд хавдах; хоол иддэггүй; амьсгал давчдах",
    "Цэцэг вирус. Шууд хавьтал, агаараар халдварлана.",
    "1) Тусгаарлах\n2) Шарх дээр антисептик (йод, ногоон өнгийн ус) түрхэх\n3) Антибиотик тариа (хоёрдогч халдвараас)\n4) Витамин тариа\n5) Дулаан хашаанд байлгах",
    "Вакцинжуулалт (жилд 1 удаа). Хашаа ариутгах.", 1, 1, "", "цэцэг,арьс,тууралт,халуурах");

  d.run("sheep", "Бруцеллёз", "Brucellosis", "high",
    "Хээл хаях; үе мөч хавдах; доголонтох; арын хөлд тэнхгүйдэх; эр малд төмсөг хавдах",
    "Бруцелла бактери. Хээл хаясан малаас, сүүгээр халдварлана.",
    "1) Шинжилгээ өгөх (заавал)\n2) Тусгаарлах\n3) Малын эмчид мэдэгдэх\n4) Эмчилгээ хүндрэлтэй - ихэвчлэн устгана\n5) ⚠️ ХҮНД ХАЛДВАРЛАНА - сүүг буцалгаж уух",
    "Жил бүр шинжилгээ. Вакцинжуулалт.", 1, 1, "", "бруцеллёз,хээл хаях,үе мөч,хавдах");

  d.run("sheep", "Тураал (Пастереллёз)", "Pasteurellosis", "high",
    "Гэнэт халуурах (41-42°C); ам хоншоороос шүлс, нус гарах; амьсгал хүнд; ханиалгах; гэдэс дүүрэх",
    "Пастерелла бактери. Стресс, хүйтрэлт, даарснаас идэвхждэг.",
    "1) Антибиотик тариа (окситетрациклин, пенициллин)\n2) Халуун бууруулах эм\n3) Дулаан хашаанд оруулах\n4) Давсалсан бүлээн ус уулгах\n5) Зөөлөн тэжээлээр хооллох",
    "Намар вакцинжуулах. Хашаа дулаалах.", 1, 1, "winter", "тураал,халуурах,ханиалгах,амьсгал");

  d.run("sheep", "Дотрын хорхой", "Helminthosis", "medium",
    "Аажмаар турах; ноос муудах; суулгах; цус багадах (нүд, буйл цайх); гэдэс дүүрэх",
    "Хорхойн өндөг бэлчээрээс малд халддаг.",
    "1) Хорхойн эм өгөх (албендазол, ивермектин)\n2) Тэжээл сайжруулах\n3) Витамин, эрдэс бодис нэмэх\n4) 10-14 хоногийн дараа дахин эм өгөх",
    "Улирал бүр (жилд 2-4 удаа) хорхойн эм өгөх. Бэлчээр сэлгэх.", 0, 0, "", "хорхой,турах,суулгах,ноос");

  d.run("sheep", "Маажуур (Саркоптоз)", "Sarcoptic mange", "medium",
    "Арьс маажих; ноос унах; арьс зузаарах, үрчийх; шарх үүсэх; малын тарга буурах",
    "Маажуурын хачиг (Sarcoptes). Шууд хавьтлаар халдварлана.",
    "1) Ивермектин тариа (2 удаа, 10-14 хоногийн зайтай)\n2) Арьсны тусгай эм түрхэх\n3) Хашаа, тоног ариутгах\n4) Бүх сүргийг нэг дор эмчлэх",
    "Шинэ мал карантинд байлгах. Хашаа ариутгах.", 0, 1, "", "маажуур,арьс,хачиг,ноос унах");

  d.run("sheep", "Хонины хорхойт бөөр (Ценуроз)", "Coenurosis", "high",
    "Толгой эргэх; тойрон эргэлдэх; нэг тийш хазайх; сохрох; татах",
    "Нохойн тэнийвчийн (taenia) авгалдай тархинд суух.",
    "1) Мэс заслаар хорхойн уутыг авах (малын эмч)\n2) Эхэн шатанд албендазол өгч болно\n3) Хүнд тохиолдолд малыг устгана",
    "Нохойг хорхойн эмээр тогтмол эмчлэх. Нохойд түүхий тархи, нуруу өгөхгүй.", 0, 0, "", "бөөр,толгой эргэх,тойрох,нохой");

  // ========== ЯМАА ==========
  d.run("goat", "Шүлхий", "Foot-and-mouth disease", "critical",
    "Ам, туурайнд цэврүү; шүлс их гоожих; халуурах; хоол иддэггүй; доголонтох; сүүний гарц буурах",
    "Шүлхий вирус.", "Хонины шүлхийтэй адил эмчилгээ.", "Вакцинжуулалт.", 1, 1, "", "шүлхий,халуурах,туурай");

  d.run("goat", "PPR (Бага мал чичрэг)", "Peste des Petits Ruminants", "critical",
    "Өндөр халуурах (40-42°C); нүд, хамраас ихээр шүүрэл; ам дотор шарх; цус суулгах; амьсгал хүнд",
    "PPR вирус. Агаараар, шууд хавьтлаар.",
    "1) ⚠️ ЯАРАЛТАЙ малын эмчид мэдэгдэх\n2) Тусгаарлах\n3) Антибиотик (хоёрдогч халдвар)\n4) Шингэн нөхөх\n5) Витамин тариа",
    "PPR вакцин хийлгэх.", 1, 1, "", "PPR,халуурах,суулгах,хамар");

  d.run("goat", "Ямааны цэцэг", "Goat pox", "high",
    "Арьсан дээр товруу; нүд, хамар хавдах; халуурах; хоол иддэггүй; сүү буурах",
    "Capripox вирус.", "Хонины цэцэгтэй адил эмчилгээ.", "Вакцинжуулалт.", 1, 1, "", "цэцэг,арьс,товруу");

  d.run("goat", "Ямааны хорхой (Хемонхоз)", "Haemonchosis", "high",
    "Цус багадах; нүд, буйл цайх; эрүү доор хавдах; турах; суулгах; сулдах",
    "Цус сорогч хорхой (Haemonchus). Бэлчээрээс халдварлана.",
    "1) Хорхойн эм (левамизол, албендазол)\n2) Төмрийн нэмэлт тариа\n3) Сайн тэжээллэх\n4) 2 долоо хоногийн дараа дахин эм өгөх",
    "Улирал бүр хорхойн эм. Бэлчээр сэлгэх.", 0, 0, "", "хорхой,цус багадах,турах,хавдах");

  d.run("goat", "Ямааны хумхаа (Энтеротоксеми)", "Enterotoxemia", "critical",
    "Гэнэт үхэх; цочмогоор суулгах; гэдэс хүчтэй өвдөх; татах; толгой арагш хотойх",
    "Clostridium бактери. Тэжээлийн гэнэтийн өөрчлөлтөөс.",
    "1) ⚠️ МАРГАХГҮЙ малын эмчид хандах\n2) Антитоксин тариа\n3) Антибиотик\n4) Ихэвчлэн амжихгүй, урьдчилан сэргийлэх чухал",
    "Жилд 2 удаа вакцинжуулах. Тэжээлийг аажмаар солих.", 1, 0, "", "хумхаа,гэнэт үхэх,суулгах,татах");

  // ========== ҮХЭР ==========
  d.run("cattle", "Шүлхий", "Foot-and-mouth disease", "critical",
    "Ам, хэл, туурайнд цэврүү; шүлс их гоожих; халуурах; хоол иддэггүй; сүү буурах; доголонтох",
    "FMDV вирус.",
    "1) Малын эмчид яаралтай мэдэгдэх\n2) Бүрэн тусгаарлах\n3) Ам, туурайг 2% давсны уусмалаар угаах\n4) Йод түрхэх\n5) Зөөлөн тэжээл\n6) Антибиотик (хоёрдогч)",
    "Вакцинжуулалт (жилд 2 удаа).", 1, 1, "", "шүлхий,ам,туурай,халуурах");

  d.run("cattle", "Сүрьеэ", "Tuberculosis", "critical",
    "Удаан ханиалгах; турах; амьсгал хүнд; сүү буурах; тунгалгийн булчирхай томрох",
    "Mycobacterium bovis бактери.",
    "1) ⚠️ Шинжилгээ хийлгэх (туберкулин сорил)\n2) Эерэг бол УСТГАНА\n3) Эмчилдэггүй\n4) ⚠️ ХҮНД ХАЛДВАРЛАНА",
    "Жил бүр шинжилгээ. Шинэ мал карантин. Сүүг буцалгаж уух.", 1, 1, "", "сүрьеэ,ханиалгах,турах");

  d.run("cattle", "Бруцеллёз", "Brucellosis", "high",
    "Хээл хаях; ихсийн хүндрэл; үе мөч хавдах; сүү буурах; эр үхэрт төмсөг хавдах",
    "Бруцелла бактери.",
    "1) Шинжилгээ хийлгэх\n2) Эерэг бол тусгаарлах/устгах\n3) ⚠️ ХҮНД ХАЛДВАРЛАНА - сүү буцалгах",
    "Вакцинжуулалт. Жил бүр шинжилгээ.", 1, 1, "", "бруцеллёз,хээл хаях,хавдах");

  d.run("cattle", "Цусан суулга (Бабезиоз)", "Babesiosis", "high",
    "Гэнэт халуурах (41°C+); шээсэнд цус холилдох (улаан шээс); цус багадах; сулдах; хоол иддэггүй",
    "Хачигаас халдварлах Babesia шимэгч.",
    "1) Бабезийн эсрэг тусгай эм (имидокарб, диминазен)\n2) Витамин B12 тариа\n3) Төмрийн нэмэлт\n4) Шингэн нөхөх\n5) Сайн тэжээллэх",
    "Хачигны эсрэг арга хэмжээ. Бэлчээр цэвэрлэх.", 1, 0, "summer", "бабезиоз,улаан шээс,халуурах,хачиг");

  d.run("cattle", "Гэдэсний хорхой", "Gastrointestinal parasites", "medium",
    "Аажмаар турах; суулгах; ноосгүй мал арьс муудах; хоол багаар идэх; тарга алдах",
    "Бэлчээрийн хорхой.",
    "1) Хорхойн эм (албендазол, ивермектин)\n2) Тэжээл сайжруулах\n3) 2 долоо хоногийн дараа давтах",
    "Улирал бүр хорхойн эм. Бэлчээр сэлгэх.", 0, 0, "", "хорхой,турах,суулгах");

  d.run("cattle", "Дэлэнгийн үрэвсэл (Мастит)", "Mastitis", "medium",
    "Дэлэнг хавдах, халуун байх; сүүнд цус, идээ холилдох; сүү өтгөрөх; үнээ сааж өгөхгүй; халуурж болно",
    "Бактери (Staphylococcus, Streptococcus). Сааль, хашааны эрүүл ахуй муугаас.",
    "1) Тухайн хөхийг тусгаарлаж саах\n2) Өвдсөн хөхийг өдөрт 4-5 удаа саах\n3) Антибиотик тариа (малын эмчийн зааврар)\n4) Дулаан алчуураар зөөлөн жиих\n5) Өвдсөн хөхний сүүг хаях",
    "Саалийн дэглэм баримтлах. Хашааны цэвэр байдал.", 0, 0, "", "мастит,дэлэнг,сүү,хавдах");

  // ========== АДУУ ==========
  d.run("horse", "Тэмбүү (Сурра)", "Surra / Trypanosomiasis", "high",
    "Халуурах; турах; нүд цайх; арын хөл сулдах; хэвлий, хөлд хавдар; нулимс гарах",
    "Trypanosoma шимэгч. Ялаа, хачигаар дамждаг.",
    "1) Малын эмчид хандах\n2) Тусгай эм (сурамин, диминазен)\n3) Сайн тэжээллэх\n4) Төмөр, витамин нэмэлт",
    "Ялаа, хачигны эсрэг арга хэмжээ.", 1, 0, "summer", "тэмбүү,турах,нүд,хавдар");

  d.run("horse", "Адууны ям", "Glanders", "critical",
    "Хамраас идээт шүүрэл; арьсанд зангилаа үүсэх; хөлд хавдар; ханиалгах; турах; халуурах",
    "Burkholderia mallei бактери.",
    "1) ⚠️ ЯАРАЛТАЙ малын эмчид мэдэгдэх\n2) Шинжилгээ хийлгэх (маллеин сорил)\n3) Эерэг бол УСТГАНА\n4) ⚠️ ХҮНД ХАЛДВАРЛАНА - адуутай хавьталт зогсоох",
    "Жил бүр маллеин сорил хийлгэх.", 1, 1, "", "ям,хамар,идээ,зангилаа");

  d.run("horse", "Адууны томуу", "Equine influenza", "medium",
    "Хуурай ханиалгах; халуурах (38.5-41°C); хамраас шүүрэл; нүд нулимстай; хоол иддэггүй; сулдах",
    "Influenza вирус. Агаараар маш хурдан тархана.",
    "1) 2-3 долоо хоног амраах\n2) Дулаан хашаанд байлгах\n3) Зөөлөн тэжээл\n4) Бүлээн ус\n5) Хоёрдогч халдвараас антибиотик",
    "Вакцинжуулалт (жилд 1-2 удаа).", 0, 1, "winter", "томуу,ханиалгах,халуурах");

  d.run("horse", "Туурайн өвчин (Ламинит)", "Laminitis", "high",
    "Доголонтох; туурай халуун байх; хөдлөхөөс татгалзах; хэвтэх; урд хөлдөө нэлээд жин тавих",
    "Хэт их үр тариа идсэн; хүйтэн ус уусан; хүнд ачаалал.",
    "1) Зөөлөн дэвсгэр дээр байлгах\n2) Хүйтэн ус, мөсөөр туурай орчмыг хөргөх (эхний 48 цаг)\n3) Хоол хязгаарлах (зөвхөн өвс)\n4) Өвдөлт намдаах эм (малын эмчээр)\n5) Туурайч дуудах",
    "Үр тариаг хэмнэлттэй өгөх. Бэлчээрийн хугацаа зохицуулах.", 1, 0, "", "ламинит,туурай,доголон,халуун");

  d.run("horse", "Адууны хорхой", "Equine parasites", "medium",
    "Турах; ноосгүйдэх; ахуйн суулгах; гэдэс дүүрэх; шимэгч чийрэг буурах",
    "Strongylus, Parascaris зэрэг хорхой.",
    "1) Хорхойн эм (ивермектин, мокситектин)\n2) Жилд 2-4 удаа эмчлэх\n3) Хөрсний баасыг тогтмол цэвэрлэх",
    "Улирал бүр хорхойн эм. Хашааны цэвэр байдал.", 0, 0, "", "хорхой,турах,суулгах");

  // ========== ТЭМЭЭ ==========
  d.run("camel", "Тэмээний цэцэг", "Camelpox", "high",
    "Арьсанд товруу, тэрчим гарах; нүд, ам орчимд шарх; халуурах; хоол иддэггүй; бөх зулайрах",
    "Camelpox вирус.",
    "1) Тусгаарлах\n2) Шарх дээр антисептик\n3) Антибиотик (хоёрдогч халдвар)\n4) Сайн тэжээллэх\n5) Витамин нэмэлт",
    "Вакцинжуулалт.", 1, 1, "", "цэцэг,арьс,товруу,бөх");

  d.run("camel", "Тэмээний тэмбүү (Сурра)", "Surra", "high",
    "Удаан халуурах; турах; нүд хавдах; арын хөл сулдах; хэвлий хавдах; бөх зулайрах",
    "Trypanosoma шимэгч. Ялаагаар дамждаг.",
    "1) Тусгай эм (сурамин)\n2) Төмөр, витамин нэмэлт\n3) Сайн тэжээллэх\n4) Малын эмчид хандах",
    "Ялааны эсрэг арга хэмжээ.", 1, 0, "summer", "тэмбүү,турах,бөх,хавдах");

  d.run("camel", "Тэмээний хорхой", "Camel parasites", "medium",
    "Турах; бөх зулайрах; суулгах; ноос муудах; тарга алдах",
    "Дотрын хорхой, шимэгч.",
    "1) Хорхойн эм (албендазол, ивермектин)\n2) Тэжээл сайжруулах\n3) Давс өгөх",
    "Жилд 2 удаа хорхойн эм.", 0, 0, "", "хорхой,турах,бөх");

  d.run("camel", "Бөхтөрхийн асуудал", "Hump problems", "low",
    "Бөх зулайрах, жижигрэх; энерги буурах; удаан тэсвэр муудах",
    "Тэжээл хангалтгүй, ус дутагдал, өвчний дараах сулрал.",
    "1) Тэжээлийн чанар нэмэх (хадсан өвс, тэжээл)\n2) Давс, эрдэс бодис өгөх\n3) Ус хангалттай олгох\n4) Амрааж сэргээх",
    "Тогтмол тэжээллэх. Хэт их ачаалал өгөхгүй байх.", 0, 0, "winter", "бөх,тэжээл,сулрал");
}

// Seed ads
const adCountChk = db.prepare("SELECT COUNT(*) as cnt FROM ads").get();
if (adCountChk.cnt === 0) {
  const ad = db.prepare("INSERT INTO ads (title, description, image_url, link_url, advertiser, placement, category, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  ad.run("Говь Ноолуур - Хамгийн өндөр үнээр ноолуур худалдан авна", "Цагаан ноолуур ₮150,000/кг, бор ₮130,000/кг. Утас: 7011-1234", "", "tel:70111234", "Говь ХК", "home", "cashmere", 10);
  ad.run("Хаан банк - Малчны зээл 1.5%", "Барьцаагүй 1-10 сая ₮ зээл. 24 сар хүртэл хугацаатай.", "", "tel:18001234", "Хаан банк", "home", "loan", 9);
  ad.run("Монгол Ноос ХК - Ноос худалдан авна", "Нарийн ноос ₮2,500/кг. Бөөний хэмжээгээр авна. Утас: 7022-5678", "", "tel:70225678", "Монгол Ноос ХК", "market", "wool", 8);
  ad.run("Мал эмнэлгийн нэгдсэн төв - 24 цагийн дуудлага", "Яаралтай мал эмнэлгийн үйлчилгээ. Бүх аймагт. Утас: 1900", "", "tel:1900", "МЭҮГ", "diagnose", "vet", 10);
  ad.run("ХХААХҮЯ - Малчны нийгмийн даатгал", "Бүртгүүлэх эцсийн хугацаа: 5-р сарын 15. Утас: 51-262345", "", "tel:51262345", "ХХААХҮЯ", "news", "government", 7);
  ad.run("Тэжээлийн Дэлгүүр - Өвс, тэжээл хямд үнээр", "Хадлангийн өвс ₮4,500/боодол. Хүргэлттэй. Утас: 8800-9900", "", "tel:88009900", "Тэжээлийн Дэлгүүр", "home", "feed", 6);
  ad.run("Малын Даатгал - Зудын эрсдэлээс хамгаал", "Жилийн хураамж ₮15,000. 100% нөхөн олговор. Утас: 7575-1234", "", "tel:75751234", "Монгол Даатгал", "weather", "insurance", 7);
  ad.run("Наадмын морь уралдаан - Бүртгэл эхэллээ", "2026 оны Наадмын их байрын морь уралдааны бүртгэл. Утас: 9911-2233", "", "tel:99112233", "МХШХ", "shinjikh", "event", 5);
  ad.run("Ariг банк - Хадгаламж 12% хүүтэй", "Малчдын хадгаламж. 12 сараар хүү 12%. Утас: 1800-2222", "", "tel:18002222", "Ариг банк", "finance", "savings", 6);
  ad.run("Экспортын боломж - Хятад руу мах экспортлох", "Үхрийн мах Хятад руу экспортлох гэрээт малчид хайж байна. Утас: 9900-1122", "", "tel:99001122", "МонМах ХХК", "market", "export", 8);
}

// Seed content sources
const csCount = db.prepare("SELECT COUNT(*) as cnt FROM content_sources").get();
if (csCount.cnt === 0) {
  const cs = db.prepare("INSERT INTO content_sources (name, url, type, category) VALUES (?, ?, ?, ?)");
  cs.run("Монцамэ мэдээ", "https://montsame.mn/mn/rss", "rss", "news");
  cs.run("ХХААХҮЯ мэдээ", "https://mofa.gov.mn/rss", "rss", "government");
  cs.run("Монголбанк ханш", "https://monxansh.appspot.com/xansh.json", "api", "exchange");
  cs.run("OpenWeather", "https://api.openweathermap.org", "api", "weather");
  cs.run("Мал аж ахуйн мэдээ", "https://mofali.gov.mn", "scrape", "livestock_news");
}

// Seed shinjikh (traditional knowledge of reading signs)
const shCount = db.prepare("SELECT COUNT(*) as cnt FROM shinjikh").get();
if (shCount.cnt === 0) {
  const sh = db.prepare("INSERT INTO shinjikh (category, title, content, details, emoji, tags) VALUES (?, ?, ?, ?, ?, ?)");

  // ========== ТЭНГЭР ЦАГ АГААР ШИНЖИХ ==========
  sh.run("weather", "Үүлээр цаг агаар шинжих",
    "Үүлний хэлбэр, өнгө, хөдөлгөөнөөр цаг агаарыг урьдчилан мэдэж болно.",
    "• Цагаан нимгэн үүл (Циррус) - 1-2 өдрийн дараа цаг агаар өөрчлөгдөнө\n• Хар бараан үүл доороос нягтарвал - бороо удахгүй орно\n• Үүл баруунаас зүүн тийш хөдөлвөл - тогтвортой, сайн цаг\n• Үүл зүүнээс баруун тийш хурдан хөдөлвөл - шуурга болж магадгүй\n• Өглөө манан татвал - өдөртөө цэлмэнэ\n• Орой манан татвал - маргааш бороотой",
    "🌤️", "үүл,бороо,манан");

  sh.run("weather", "Нар, сараар цаг шинжих",
    "Нар, сарны гэрэл, өнгө, хүрээгээр цаг агаар таамаглана.",
    "• Нар шаргал улаан жаргавал - маргааш салхитай\n• Нар цагаан цайвар жаргавал - маргааш тогтвортой\n• Нарны эргэн тойронд гэрлийн цагариг (гало) гарвал - бороо/цас удахгүй\n• Сарны эргэн тойронд цагариг - 3 хоногт цаг агаар өөрчлөгдөнө\n• Сар хөх байвал - агаарт чийг их, бороотой\n• Сар тод гэрэлтэй - хүйтэрнэ, хахир жавар болно",
    "☀️", "нар,сар,гало,жаргалт");

  sh.run("weather", "Салхиар цаг шинжих",
    "Салхины чиглэл, хүч, температураар цаг агаарыг мэдэж болно.",
    "• Өмнөд салхи - дулаарна, бороотой байж болно\n• Хойд салхи - хүйтэрнэ, цэлмэнэ\n• Баруун салхи - тогтвортой сайн цаг\n• Зүүн салхи - бороо, цас орох магадлалтай\n• Салхи гэнэт намдвал - аадар бороо болж магадгүй\n• Шөнийн салхи уулаас хөндий рүү үлээвэл - маргааш цэлмэг\n• Өдрийн салхи хөндийгөөс уул руу үлээвэл - хэвийн",
    "🌬️", "салхи,чиглэл,дулаан,хүйтэн");

  sh.run("weather", "Амьтан, шувуугаар цаг шинжих",
    "Амьтад цаг агаарын өөрчлөлтийг хүнээс түрүүлж мэдэрдэг.",
    "• Хонь бөөнөөрөө нэг дор шахагдвал - шуурга болно\n• Адуу толгойгоо өргөж жинхэнэ чиглэлд харвал - салхитай болно\n• Нохой газар ухвал - хүйтэрнэ\n• Элгэн шувуу намхан нисвэл - бороо орно\n• Тоншуул мод олноор тоншвол - дулаарна\n• Хэрээ, тураг бөөнөөрөө нисвэл - шуурга ойртож байна\n• Мялааханд газар дээр олноор гарвал - бороо болно\n• Шаазгай гэрийн ойролцоо шуугивал - хүйтэрнэ\n• Загас усны гадарга дээр үсрэвэл - бороотой",
    "🐦", "шувуу,мал,амьтан,бороо,шуурга");

  sh.run("weather", "Одоор цаг, улирал шинжих",
    "Малчид одоор цаг агаар, улирлын өөрчлөлтийг мэддэг байсан.",
    "• Мичид (Плеяд бөөн од) тод харагдвал - хахир хүйтэн болно\n• Мичид бүдэг харагдвал - дулаавтар өвөл\n• Холбоо од (Орион) тэнгэрийн оройд гарвал - хамгийн хүйтэн үе\n• Цолмон од (Венер) оройн тэнгэрт - намрын шинж\n• Цолмон од өглөөний тэнгэрт - хаврын шинж\n• Сүүн зам тод харагдвал - хуурай цаг\n• Сүүн зам бүдэг - чийглэг, үүлэрхэг болно",
    "⭐", "од,мичид,холбоо,цолмон");

  sh.run("weather", "Газрын шинжээр цаг шинжих",
    "Газар, ургамал, усны шинжээр цаг агаарыг таних.",
    "• Чулуу дээр хөлрөх шиг чийг суувал - бороо болно\n• Давс чийгтэй болж хайлвал - бороотой\n• Модны навч дээш эргэвэл - бороо ойрхон\n• Гол горхины ус тунгалаг болвол - хүйтэрнэ\n• Газар дээрх утаа дээш шулуун гарвал - тогтвортой\n• Утаа газар даган тарвал - бороо/цас ойрхон\n• Цасны гадарга дээр мөстөж хатуурвал - хүйтэрнэ",
    "🌍", "газар,чулуу,давс,ургамал");

  // ========== МАЛ ШИНЖИХ ==========
  sh.run("livestock", "Хонь шинжих",
    "Хонины биеийн бүтэц, зан авир, өнгөөр чанарыг тодорхойлно.",
    "Сайн хонины шинж:\n• Толгой жижиг, хонхор нүүртэй\n• Нүд тод, эрч хүчтэй\n• Хүзүү богино, бүдүүн\n• Бие урт, өргөн, гүн цээжтэй\n• Хөл шулуун, бат бөх\n• Ноос жигд нягт ургасан\n• Сүүл богино, тарган\n\nМуу шинж:\n• Нуруу нугарсан\n• Хөл муруй, нарийн\n• Ноос жигд бус, нийлсэн\n• Нүд сулхан, цайвар",
    "🐑", "хонь,шинж,чанар,ноос");

  sh.run("livestock", "Ямаа шинжих",
    "Ямааны биеийн бүтэц, ноолуурын чанараар сонголт хийнэ.",
    "Сайн ямааны шинж:\n• Бие жижигхэн, нягт бүтэцтэй\n• Ноолуур зузаан, жигд\n• Цагаан ноолууртай бол үнэ илүү\n• Хоншоор нарийн, нүд тод\n• Бие овоо хэлбэртэй\n• Хөл бат, туурай хатуу\n\nНоолуурын чанар шинжих:\n• Гараар үзэхэд зөөлөн, гөлгөр\n• Татахад уян харимхай\n• Нэг тэгш өнгөтэй\n• 14-16 микрон нарийн бол хамгийн сайн",
    "🐐", "ямаа,ноолуур,чанар");

  sh.run("livestock", "Үхэр шинжих",
    "Үхрийн бие бялдар, сүүний чанараар шинжинэ.",
    "Сайн үхрийн шинж:\n• Толгой хөнгөн, хонхор духтай\n• Нүд том, тод\n• Хүзүү урт, нарийвтар\n• Цээж өргөн, гүн\n• Нуруу шулуун, өргөн\n• Хөл шулуун, хөнгөн алхаатай\n• Арьс нимгэн, уян\n\nСайн сааль үнээний шинж:\n• Дэлэнг том, зөөлөн\n• Сүүний судас томорч харагдах\n• Хэвлий том, хажуугаас харахад гурвалжин хэлбэртэй\n• Бие арагш илүү том",
    "🐂", "үхэр,сүү,дэлэнг");

  sh.run("livestock", "Тэмээ шинжих",
    "Тэмээний бөх, бие бялдар, нас, зан авираар шинжинэ.",
    "Сайн тэмээний шинж:\n• Бөх том, бат суусан (2 бөхтөд бөх ижил хэмжээтэй)\n• Хүзүү урт, нугаламтай\n• Хөл урт, шулуун\n• Мөр хавтгай, өргөн\n• Туурай том, өргөн (элсэнд суухгүй)\n• Нүд тод, ухаалаг\n\nБөхөөр нь шинжих:\n• Бөх хатуу, чанга - сайн тэжээлтэй\n• Бөх зөөлөн, зулайрсан - тэжээл хангалтгүй\n• Бөх нэг тийш хазайсан - бие муутай",
    "🐪", "тэмээ,бөх,элс");

  // ========== ХУРДАН МОРЬ ШИНЖИХ ==========
  sh.run("racehorse", "Хурдан морь шинжих - бие бялдар",
    "Хурдан морины биеийн бүтцийг нарийвчлан шинжинэ.",
    "Толгой:\n• Толгой хөнгөн, нарийн, \"захатай\" байх\n• Чих жижиг, тэгш, хурц\n• Нүд том, гүн суусан, \"гал харц\"\n• Хамар том, нүхэн нь өргөн (агаар сайн авна)\n\nХүзүү, бие:\n• Хүзүү урт, дээш тэгш хотойсон\n• Цээж өргөн, гүн (уушиг том)\n• Нуруу богино, хатуу\n• Бүүр урт, ташаа налуу (хурд нэмнэ)\n\nХөл:\n• Хөл урт, хуурай (шөрмөс тодорч харагдах)\n• Тахим урт, нарийн\n• Өвдөг бат, шулуун\n• Туурай жижиг, хатуу, дугуй",
    "🏇", "морь,хурдан,бие,толгой");

  sh.run("racehorse", "Хурдан морь шинжих - зан авир",
    "Хурдан морь зан авир, хөдөлгөөнөөрөө ялгарна.",
    "Сайн шинж:\n• Сэрэмжтэй, толгойгоо өндөр өргөж алхдаг\n• Нүд гал харцтай, ухаалаг\n• Бусад адуунаас тусдаа явах дуртай\n• Гүйхдээ хурдан хурдасдаг\n• Чих тэгшээр босдог\n• Алхаа зөв, жигд\n• Амлах, жолоо авах дуртай\n\nМуу шинж:\n• Залхуу, хөдөлгөөнгүй\n• Бусад адууны ард нуугдах\n• Дуу чимээнд айдаг, мушгидаг\n• Гүйхдээ толгой сэгсрэх",
    "🐴", "морь,зан,хурд,сэрэмж");

  sh.run("racehorse", "Хурдан морь шинжих - эвэр, хялгас",
    "Хялгас, дэл, сүүлний шинжээр морь таньдаг.",
    "• Дэл нимгэн, богино - хурдан морины шинж\n• Сүүл урт, сийрэг - тэсвэр сайтай\n• Хялгас нарийн, гөлгөр - сайн үүлдэр\n• Хялгас бүдүүн, ширүүн - тэсвэр сайн, хурд бага\n\nӨнгөөр шинжих:\n• Хүрэн морь - тэнцвэртэй, бүх зайнд сайн\n• Халтар морь - хурд сайн, богино зайнд\n• Хээр морь - тэсвэр сайн, урт зайнд\n• Бор морь - хатуужил, тэсвэр хамгийн сайн\n• Цагаан морь - алдар нэр, гэхдээ нартай өдөр нүд гялбам",
    "🎠", "морь,дэл,хялгас,өнгө");

  sh.run("racehorse", "Морь сойх, идээлэх",
    "Уралдааны өмнө морь бэлтгэх уламжлалт арга.",
    "Сойх (бэлтгэл):\n• 30-45 хоногийн өмнөөс сойж эхэлнэ\n• Өглөө, орой жингэлэх (алхуулах)\n• Тэжээлийг аажмаар хасах\n• Ус хязгаарлах (хэт их уулгахгүй)\n• Өдөрт 2-3 удаа 3-5 км алхуулна\n\nИдээлэх:\n• Уралдааны 3-5 хоногийн өмнө\n• Арвай, гурилан будаа өгнө\n• Өндөг, тос холиж өгөх\n• Ус цагаа олгож өгнө\n• Сэтгэл санааг тайван байлгах",
    "🏇", "морь,сойх,идээлэх,уралдаан");

  // ========== САЙН ЭЦЭГ МАЛ (ХУЦЫН) ШИНЖИХ ==========
  sh.run("sire", "Сайн хуц (эцэг хонь) шинжих",
    "Сүрэгт ашиглах хуцыг сонгохдоо биеийн бүтэц, удам, зан авирыг шинжинэ.",
    "Биеийн бүтэц:\n• Бие том, жин 70+ кг\n• Цээж өргөн, нуруу шулуун\n• Хөл бат, шулуун\n• Толгой том, эвэртэй бол эвэр бат, тэгш\n• Төмсөг хоёулаа ижил, том\n\nНоосны шинж:\n• Ноос нягт, жигд, урт\n• Нарийн ноостой бол илүү үнэ цэнэтэй\n• Ноосны дэрс гялгар\n\nЗан авир:\n• Эрч хүчтэй, идэвхтэй\n• Сүрэгтээ тэргүүлдэг\n• Хүнээс айдаггүй\n\n1 хуц 25-30 эм хонийг хээлтүүлнэ.",
    "🐏", "хуц,эцэг,үржил,ноос");

  sh.run("sire", "Сайн ухна (эцэг ямаа) шинжих",
    "Ноолуурын чанар, бие бялдраар ухна сонгоно.",
    "Биеийн бүтэц:\n• Жин 40+ кг\n• Бие нягт, тууштай бүтэцтэй\n• Хөл бат, туурай хатуу\n• Сахал урт, үзэсгэлэнтэй\n\nНоолуурын шинж:\n• Ноолуур зузаан, 400+ гр гарцтай\n• Цагаан ноолуур хамгийн үнэтэй\n• Нарийн (14-16 микрон) бол A зэрэг\n• Ноолуур гараар үзэхэд торго шиг зөөлөн\n\nУдмын шинж:\n• Эхийн ноолуурын гарц 300+ гр\n• Эцгийн ноолуурын гарц 500+ гр\n• 3 үеийн удмыг мэдэх нь чухал",
    "🐐", "ухна,ямаа,ноолуур,үржил");

  sh.run("sire", "Сайн бух (эцэг үхэр) шинжих",
    "Махны болон сүүний чиглэлээр бух сонгох ялгаатай.",
    "Махны чиглэлийн бух:\n• Бие том, өргөн (500+ кг)\n• Цээж өргөн, бүдүүн\n• Бүүр өргөн, булчин том\n• Хөл богино, бат\n• Арьс зузаан\n\nСүүний чиглэлийн бух:\n• Бие дундаж, нарийвтар\n• Эхийн сүүний гарц 3000+ литр/жил\n• Сүүний судас тод\n\nНийтлэг шинж:\n• Төмсөг хоёулаа тэгш, том\n• Нүд тод, эрч хүчтэй\n• Зан номхон боловч хүчирхэг\n• 1 бух 25-30 үнээг хээлтүүлнэ",
    "🐂", "бух,үхэр,үржил,мах,сүү");

  sh.run("sire", "Сайн азарга (эцэг адуу) шинжих",
    "Азаргын бие бялдар, удам, зан авирыг нарийвчлан шинжинэ.",
    "Биеийн бүтэц:\n• Толгой хөнгөн, тод нүдтэй\n• Хүзүү урт, мушгиатай, дэл сайхан\n• Цээж өргөн, гүн\n• Нуруу богино, бат\n• Бүүр урт, булчинлаг\n• Хөл урт, хуурай, шөрмөс тодорсон\n\nЗан авир:\n• Сүрэгтээ тэргүүлдэг\n• Хамгаалах зан хүчтэй\n• Сэрэмжтэй, зоригтой\n\nУдам:\n• Хурдан морь гаргасан удамтай бол онцгой\n• 1 азарга 15-20 гүүг хээлтүүлнэ",
    "🐴", "азарга,адуу,үржил,хурд");

  // ========== САЙН ЭМ МАЛ ШИНЖИХ ==========
  sh.run("dam", "Сайн эм хонь шинжих",
    "Эх хонины шинжийг нарийвчлан тодорхойлно.",
    "Биеийн бүтэц:\n• Бие дундаж, эмэгтэй хэлбэртэй\n• Ташаа өргөн (хялбар төллөнө)\n• Дэлэнг хоёр хөхтэй, тэгш\n• Нуруу шулуун, хэвлий том\n\nТөллөлтийн шинж:\n• Жилд 1-2 хурга төллөдөг\n• Ихэр төллөх чадвартай бол онцгой\n• Хургаа сайн хөхүүлдэг, хайрладаг\n• 5-7 насны хооронд хамгийн сайн төллөнө\n\nНоосны шинж:\n• Ноос нягт, жигд\n• Жилд 3-4 кг ноос өгдөг бол сайн",
    "🐑", "эм хонь,төллөлт,хурга,ноос");

  sh.run("dam", "Сайн эм ямаа шинжих",
    "Ноолуурын гарц, төллөлтийн чадвараар шинжинэ.",
    "Биеийн бүтэц:\n• Бие нягт, эмэгтэй хэлбэртэй\n• Ташаа өргөн\n• Дэлэнг жижиг, 2 хөхтэй\n\nНоолуурын шинж:\n• Жилд 300+ гр ноолуур өгдөг\n• Цагаан ноолууртай - хамгийн үнэ цэнэтэй\n• Нарийн (15 микрон доош) бол онцгой\n\nТөллөлтийн шинж:\n• Жилд 1-2 ишиг төллөнө\n• Ихэр ишиг төрүүлдэг бол сайн\n• Ишигтээ сүү хангалттай өгдөг\n• 3-6 насны хооронд хамгийн сайн",
    "🐐", "эм ямаа,ноолуур,ишиг");

  sh.run("dam", "Сайн сааль үнээ шинжих",
    "Сүүний гарц, бие бялдраар шинжинэ.",
    "Биеийн бүтэц:\n• Бие гурвалжин хэлбэртэй (хажуугаас)\n• Цээж нарийвтар, бүүр том өргөн\n• Арьс нимгэн, уян\n• Сүүний судас том, тод харагдах\n\nДэлэнгийн шинж:\n• Том, батхан холбогдсон\n• 4 хөх тэгш, дунд зэргийн урттай\n• Саасны дараа жижирдэг (сүүний багтаамж сайн)\n• Хөхний амсар таг зөв (саахад хялбар)\n\nСүүний гарц:\n• Өдөрт 10+ литр бол сайн\n• Жилд 2500+ литр бол онцгой\n• Сүүний тослог 3.5%+ бол чанартай\n• 3-7 дахь тугалын үед хамгийн их сүүтэй",
    "🐄", "үнээ,сүү,дэлэнг,сааль");

  sh.run("dam", "Сайн гүү шинжих",
    "Гүүний үржлийн чанар, айраг, сүүний гарцаар шинжинэ.",
    "Биеийн бүтэц:\n• Бие урт, хэвлий том\n• Ташаа өргөн, хүзүү урт\n• Хөл бат, туурай хатуу\n• Дэлэнг жижиг, 2 хөхтэй\n\nАйрагны гүү:\n• Өдөрт 5+ литр сүү саадаг\n• Номхон, саалинд дассан\n• Сүү тослог 1.5-2% (айрагт тохиромжтой)\n\nҮржлийн гүү:\n• Хурдан морь гаргасан удамтай\n• Жирэмслэлт 11 сар, жил бүр унага төрүүлдэг\n• 4-15 насны хооронд хамгийн сайн",
    "🐴", "гүү,айраг,сүү,унага");

  // ========== ГАЗАР ОРОН ШИНЖИХ ==========
  sh.run("land", "Өвөлжөөний газар шинжих",
    "Өвөлжөө сонгоход газрын байршил, хамгаалалт, усны эх чухал.",
    "Сайн өвөлжөөний шинж:\n• Хойд талаараа уул, толгодоор хамгаалагдсан\n• Өмнөд талруугаа нээлттэй (нар тусна)\n• Салхинаас хамгаалагдсан (хавцал, хотгор)\n• Ойролцоо уст цэгтэй (худаг, булаг)\n• Газар хуурай, далд үер иршгүй\n• Түлшний эх үүсвэр ойрхон\n\nЗайлсхийх газар:\n• Нам дор газар (хүйтэн агаар тогтоно)\n• Голын эрэг (цас, мөсний аюул)\n• Шууд салхитай газар",
    "🏔️", "өвөлжөө,газар,хамгаалалт");

  sh.run("land", "Зуслангийн газар шинжих",
    "Зуслангийн бэлчээрийг ургамал, ус, газрын гадаргаар шинжинэ.",
    "Сайн зуслангийн шинж:\n• Ургамал элбэг, олон төрлийн өвс\n• Усан хангамж сайн (гол, булаг)\n• Газар тэгш, мал бэлчихэд тохиромжтой\n• Агаарын солилцоо сайн (ялаа бага)\n• Мод, сүүдэр бий (малд амрах газар)\n\nБэлчээр шинжих:\n• Ногоон ургамал - тэжээллэг\n• Шарласан ургамал - тэжээл багатай\n• Хорт ургамал бий эсэх шалгах\n• Хог хаягдал, химийн бодис бий эсэх",
    "⛺", "зуслан,бэлчээр,ургамал,ус");

  sh.run("land", "Усны эх шинжих",
    "Малд зориулж усны чанар, хэмжээг шинжинэ.",
    "Сайн усны шинж:\n• Тунгалаг, цэвэр\n• Үнэргүй\n• Урсгалтай (зогсонги ус муу)\n• Хөрсний гүнээс гарсан (булаг, худаг)\n\nМуу усны шинж:\n• Ногоон өнгөтэй (замаг) - малд хортой\n• Өмхий үнэртэй\n• Хөвөн, тоос ихтэй\n• Уурхайн ойролцоох ус (хими)\n\nХудаг газар шинжих:\n• Ургамал ногоон, сайн ургасан газар - ус ойр\n• Шөнө манан тогтдог газар - ус бий\n• Шоргоолж их газар - ус ойрхон",
    "💧", "ус,худаг,булаг,чанар");

  sh.run("land", "Отрын бэлчээр шинжих",
    "Оторт явахад газар, зам, бэлчээрийн нөхцөлийг шинжинэ.",
    "Отрын газар сонгох:\n• Гангийн үед - усархаг, намгархаг газар\n• Зудын үед - нам дор, цас бага газар\n• Зуны отор - уулархаг, сэрүүн газар\n\nЗам шинжих:\n• Малын явах чадварт тохирсон зай (өдөрт 15-20 км)\n• Замд ус, амрах газартай\n• Эрсдэлтэй газаргүй (голын гарц, цасны нурангу)\n\nОрон нутгийн зөвшөөрөл:\n• Очих газрын малчидтай урьдчилж ярих\n• Сумын захиргааны зөвшөөрөл",
    "🗺️", "отор,бэлчээр,нүүдэл,зам");
}

// Seed fun facts
const ffCount = db.prepare("SELECT COUNT(*) as cnt FROM fun_facts").get();
if (ffCount.cnt === 0) {
  const f = db.prepare("INSERT INTO fun_facts (category, title, content, emoji, source, tags) VALUES (?, ?, ?, ?, ?, ?)");

  // === МАЛЫН ГАЙХАЛТАЙ БАРИМТ ===
  f.run("animal_fact", "Хонь нүүрийг таньдаг", "Хонь 50 хүртэлх хонины нүүрийг 2 жилийн турш санаж чаддаг. Мөн хүний нүүрийг ч ялгаж таньдаг нь судалгаагаар нотлогдсон.", "🐑", "University of Cambridge", "хонь,оюун ухаан");
  f.run("animal_fact", "Ямааны нүд 340° харагддаг", "Ямааны нүдний цонхойвч тэгш өнцөгт хэлбэртэй учир 340 градусын өргөн өнцгөөр харж чаддаг. Энэ нь махчин амьтнаас зайлсхийхэд тусалдаг.", "🐐", "National Geographic", "ямаа,нүд,анатоми");
  f.run("animal_fact", "Адуу зогсоо унтдаг", "Адуу хөлөө түгжих механизмтай учир зогсоогоор унтаж чаддаг. Гүн нойронд орохдоо л хэвтдэг бөгөөд өдөрт зөвхөн 2-3 цаг унтдаг.", "🐴", "Equine Science", "адуу,унтлага");
  f.run("animal_fact", "Тэмээ 200 литр ус ууж чаддаг", "Тэмээ нэг удаа 200 литр хүртэл ус ууж чаддаг бөгөөд усгүйгээр 2 долоо хоног амьдрах чадвартай. Бөх нь өөх хадгалдаг, ус биш.", "🐪", "Smithsonian", "тэмээ,ус,бөх");
  f.run("animal_fact", "Үхэр соронзон орныг мэдэрдэг", "Google Earth-ийн хиймэл дагуулын зургаар үхэр бэлчихдээ үргэлж хойд-өмнөд чиглэлд зогсдог нь дэлхийн соронзон орныг мэдэрдэгийг нотолдог.", "🐂", "Google/PNAS", "үхэр,соронзон,байгаль");
  f.run("animal_fact", "Хонины дурсамж маш сайн", "Хонь 2 жилийн өмнө явсан замаа санаж чаддаг. Мөн стресст орсон үедээ нүүр танил хонины зургийг харвал тайвширдаг.", "🐑", "Applied Animal Behaviour", "хонь,дурсамж,оюун ухаан");
  f.run("animal_fact", "Ямааны акцент", "Ямаа бүлэг дотроо өөрсдийн \"акцент\"-тэй болдог. Нэг сүрэгт өссөн ямаа ижил дуу чимээ гаргадаг нь судалгаагаар батлагдсан.", "🐐", "Queen Mary University", "ямаа,дуу,харилцаа");
  f.run("animal_fact", "Адууны шүд нас заадаг", "Адууны шүдийг харж насыг нь нарийвчлан тодорхойлж болдог. \"Адууны шүдийг бүү тоо\" гэдэг бэлгэнд авсан адууны насыг шалгаж болохгүй гэсэн утгатай.", "🐴", "Ардын ухаан", "адуу,шүд,нас");

  // === МОНГОЛЫН УЛАМЖЛАЛ ===
  f.run("tradition", "Таван хошуу мал", "Монголчууд эрт дээр цагаас хонь, ямаа, үхэр, адуу, тэмээг \"таван хошуу мал\" гэж нэрлэдэг. Энэ 5 төрлийн мал Монголын нүүдэлчин соёлын үндэс суурь юм.", "🇲🇳", "Монгол түүх", "таван хошуу,уламжлал");
  f.run("tradition", "Морь хуур ба адууны сүнс", "Монголчууд морь хуурыг адууны сүнсийг дуудахын тулд тоглодог гэж үздэг. Морь хуурын чимэглэл нь адууны толгой хэлбэртэй байдаг.", "🎻", "Монгол соёл", "морь хуур,адуу,соёл");
  f.run("tradition", "Цагаан сар ба мал", "Цагаан сарын өмнө малчид малаа тоолж, аз жаргал гуйдаг. Цагаан сарын шинийн нэгний өглөө хамгийн эхэнд малаа тэжээдэг уламжлалтай.", "🌙", "Монгол зан үйл", "цагаан сар,уламжлал");
  f.run("tradition", "Айрагний соёл", "Монголчууд жилд 10 сая литр айраг хийдэг. Нэг гүүнээс зунд өдөрт 3-5 литр сүү саадаг. Айрагт витамин C элбэг бөгөөд эртний малчдын C витамины цорын ганц эх үүсвэр байсан.", "🥛", "UNESCO", "айраг,гүүний сүү,витамин");
  f.run("tradition", "Малын тамга", "Монгол малчид эрт дээр цагаас малдаа тамга дардаг. Тамга бүр гэр бүл, овгийг илтгэдэг. Одоо 3000 гаруй тамга бүртгэгдсэн.", "🔥", "Монгол угсаатны зүй", "тамга,мал,угсаатан");

  // === БАЙГАЛИЙН МЭДЛЭГ ===
  f.run("nature", "Цаг агаарыг ургамлаар таних", "Хонин ботууль (Cerastium) цэцэглэвэл бороо орно. Сонгинон цэцэг хумигдвал чийглэг байна. Хаг шар өнгөтэй болвол хуурай жил болно.", "🌿", "Ардын ажиглалт", "ургамал,цаг агаар");
  f.run("nature", "Одоор чиг тодорхойлох", "Хойд зүгийн од (Алтан гадас) нь үргэлж хойд зүгт байдаг. Монгол малчид шөнийн бэлчээрт чиг тодорхойлохдоо ашигладаг. Долоон бурхан одоор цагийг мэддэг.", "⭐", "Монгол одон орон", "од,чиг,шөнө");
  f.run("nature", "Шувууны дуугаар цаг агаар мэдэх", "Элгэн шувуу намхан нисвэл бороо орно. Тоншуул мод тоншвол дулаарна. Хэрээ бөөнөөрөө нисвэл шуурга болно. Ямаан хараацай газар ойрхон нисвэл бороотой.", "🐦", "Ардын ажиглалт", "шувуу,цаг агаар");
  f.run("nature", "Сарны үе ба мал", "Малчид сарны хуучид мал эмнэлгийн ажилбар (хорхойн эм, вакцин) хийхгүй. Сарны шинэд малд эм хийвэл илүү үр дүнтэй гэж үздэг.", "🌙", "Ардын ухаан", "сар,эмчилгээ,уламжлал");
  f.run("nature", "Газрын хөрсөөр бэлчээр таних", "Хар шороотой газар - тэжээллэг ургамал. Шар шороо - хуурай, тэжээл бага. Элсэрхэг - тэмээнд тохиромжтой. Намагт бэлчээр - үхэр, адуунд сайн.", "🌍", "Бэлчээрийн мэдлэг", "бэлчээр,хөрс,ургамал");

  // === ДЭЛХИЙН МАЛ АЖ АХУЙ ===
  f.run("world", "Монгол адуу дэлхийд алдартай", "Монгол адуу дэлхийн хамгийн тэсвэр хатуужилтай үүлдэр. Чингис хааны тэргүүн морьд Монгол адуу байсан бөгөөд одоо дэлхийн 30 гаруй оронд экспортлодог.", "🏇", "FAO", "адуу,дэлхий,Чингис хаан");
  f.run("world", "Ноолуурын 40% Монголоос", "Дэлхийн нийт ноолуурын 40% нь Монголоос гардаг. Монголын ноолуур чанараараа Кашмирын дараа 2-рт ордог.", "🧶", "UNDP", "ноолуур,экспорт,дэлхий");
  f.run("world", "Нүүдэлчдийн сүүлчийн шувуу үүр", "Монгол бол дэлхийд нүүдлийн мал аж ахуй хамгийн их хадгалагдсан орон. 233,000 малчин өрх уламжлалт аргаар мал маллаж байна.", "🏕️", "World Bank", "нүүдэлчин,малчин,дэлхий");
  f.run("world", "Австралийн хонь", "Австрали 70 сая хонинтой дэлхийн 2-р том хонины сүрэгтэй. Харин хүн амаас 3 дахин олон хонь байдаг.", "🇦🇺", "Australian Bureau", "австрали,хонь,дэлхий");
  f.run("world", "Швейцарийн үхэр банкны данстай", "Швейцарид зарим үхрийн чихэнд микрочип суулгаж, эрүүл мэндийн бүртгэл хөтөлдөг. Нэг үнээний үнэ $10,000 хүрдэг.", "🇨🇭", "Swiss Agriculture", "швейцари,үхэр,технологи");

  // === ХӨГЖИЛТЭЙ БАРИМТ ===
  f.run("funny", "Ямаа модонд авирдаг", "Мороккод ямаанууд аргоны модонд авирч жимс иддэг. Энэ үзэгдэл аялагчдын дунд маш алдартай.", "🌳", "National Geographic", "ямаа,морокко,модонд авирах");
  f.run("funny", "Хонь хөтлөгч дагадаг", "Нэг хонь хашаанаас үсэрвэл бүх сүрэг дагаж үсэрдэг - бөөгнөрөх зан нь маш хүчтэй. Хоосон зайгаар үсрэх нь ч бий.", "🐑", "Animal Behaviour", "хонь,зан,бөөгнөрөх");
  f.run("funny", "Тэмээ тэнгэрт нулимдаг", "Тэмээ уурлахдаа хүн рүү нулимж болно. Нулимсанд нь хоолны шүүс, хагас боловсруулсан хоол холилддог.", "🐪", "Desert Facts", "тэмээ,нулимах,хөгжилтэй");
  f.run("funny", "Адууны 16 нүүрний хувирал", "Адуу 17 өөр нүүрний хувирал гаргаж чаддаг - хүний 27-оос бага ч олон амьтнаас олон. Баярлах, уурлах, гайхах бүгдийг илэрхийлнэ.", "🐴", "University of Sussex", "адуу,нүүр,сэтгэл хөдлөл");
  f.run("funny", "Үхэр хамгийн сайн найз", "Үхэр хамгийн сайн найзтай болдог. Найзаасаа салгавал стресст ордог, зүрхний цохилт хурдасдаг.", "🐄", "Northampton University", "үхэр,нөхөрлөл,сэтгэл");

  // === ЭРҮҮЛ МЭНД, ХООЛ ===
  f.run("health", "Айраг - пробиотикийн эх үүсвэр", "Гүүний айраг 200+ төрлийн ашигт бактери агуулдаг. Монголчууд эрт дээр цагаас сүрьеэ, ходоодны өвчин эмчлэхэд айраг ашигладаг байсан.", "🥛", "Journal of Dairy Science", "айраг,эрүүл мэнд,пробиотик");
  f.run("health", "Хонины махны тэжээллэг чанар", "Хонины мах төмөр, цайр, B12 витамин маш элбэг. 100гр хонины мах өдрийн B12 хэрэгцээний 108%-ийг хангадаг.", "🥩", "USDA", "хонины мах,тэжээл,витамин");
  f.run("health", "Тэмээний сүүний ид шид", "Тэмээний сүүнд инсулинтай төстэй бодис агуулдаг бөгөөд чихрийн шижин өвчтөнд тустай. Мөн С витамин үхрийн сүүнээс 3 дахин их.", "🐫", "WHO", "тэмээний сүү,эрүүл мэнд,чихрийн шижин");
  f.run("health", "Ноолуурын эрүүл мэндийн ач тус", "Ноолуурын хувцас хүний биеийн температурыг зохицуулдаг. Харшил үүсгэдэггүй, бактери үржихийг саатуулдаг, статик цахилгаан бага.", "🧣", "Textile Research", "ноолуур,эрүүл мэнд,хувцас");

  // === ТООН БАРИМТ ===
  f.run("stats", "Монголд хүнээс олон мал", "Монголд 3.4 сая хүн, 67 сая мал байна. Хүн бүрд 20 мал ногддог. Энэ харьцаа дэлхийд хамгийн өндөр.", "📊", "NSO Mongolia", "статистик,хүн ам,мал");
  f.run("stats", "1 ямаанаас жилд 300гр ноолуур", "Нэг ямаанаас жилд дунджаар 200-400гр ноолуур авдаг. Нэг ноолуурын цамцанд 3-5 ямааны ноолуур шаардлагатай.", "🧶", "Gobi Cashmere", "ноолуур,ямаа,үйлдвэрлэл");
  f.run("stats", "Адуу цагт 70 км/ц", "Монгол адуу хамгийн дээд хурдаараа цагт 65-70 км хурдтай гүйж чаддаг. Наадмын уралдааны морь 25-30 км замыг 30-40 минутад туулдаг.", "🏇", "Наадам", "адуу,хурд,наадам");
  f.run("stats", "Үхэр өдөрт 8 цаг идэж чаддаг", "Үхэр өдөрт 8 цаг хоол идэж, 8 цаг хэвтрэн боловсруулж, 8 цаг амардаг. Өдөрт 70-100 кг ногоон ургамал иддэг.", "🐂", "Dairy Science", "үхэр,хоол,тоо баримт");
}

module.exports = db;

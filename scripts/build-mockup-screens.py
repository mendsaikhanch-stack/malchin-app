"""
Аппын дэлгэц бүрд харгалзах mockup утасны screenshot үүсгэх.
Жинхэнэ screenshot бэлэн болсны дараа эдгээрийг солихоор зориулсан.

Гарах файлууд: docs/mockups/*.png  (720x1280, утас хэлбэртэй)
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..',
                                       'docs', 'mockups'))
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 720, 1280

# Өнгө
GREEN_DARK = (27, 94, 32)
GREEN_MID = (46, 125, 50)
GREEN_LIGHT = (200, 230, 201)
GOLD = (255, 184, 0)
GOLD_LIGHT = (255, 236, 179)
CREAM = (255, 248, 225)
WHITE = (255, 255, 255)
BLACK = (33, 33, 33)
GRAY = (90, 90, 90)
GRAY_LIGHT = (224, 224, 224)
GRAY_BG = (245, 245, 245)
RED = (198, 40, 40)
ORANGE = (255, 152, 0)
BLUE = (33, 150, 243)

FONT = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
EMOJI = "C:/Windows/Fonts/seguiemj.ttf"


def f(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def ef(size):
    return ImageFont.truetype(EMOJI, size)


def is_emoji(ch):
    """Энгийн arial-д байхгүй emoji codepoint мөн эсэхийг шалгах"""
    cp = ord(ch)
    return (
        0x2600 <= cp <= 0x27BF or       # symbols, dingbats
        0x1F000 <= cp <= 0x1FFFF or     # emoji blocks
        0x2300 <= cp <= 0x23FF or       # technical
        cp in (0x2705, 0x274C, 0x2B50, 0x26A0, 0x2934, 0x2935,
               0x21AA, 0x21A9, 0x2139, 0x2122, 0x00A9, 0x00AE,
               0x2049, 0x203C, 0x2196, 0x2197, 0x2198, 0x2199)
    )


# Original textbbox/text wrapper that handles mixed cyrillic+emoji
_text_orig = ImageDraw.ImageDraw.text
_bbox_orig = ImageDraw.ImageDraw.textbbox


def draw_mixed(d, pos, text, font, fill=None, anchor=None):
    """Cyrillic + emoji холимог текстийг тус тусд нь зурах.
    Emoji-уудыг seguiemj.ttf-ээр (color) зурна."""
    x, y = pos
    # Get font size
    try:
        size = font.size
    except Exception:
        size = 24
    em_font = ef(size)

    buf = ""
    for ch in text:
        if is_emoji(ch):
            if buf:
                _text_orig(d, (x, y), buf, font=font, fill=fill)
                bbox = _bbox_orig(d, (x, y), buf, font=font)
                x = bbox[2]
                buf = ""
            # Draw single emoji with color font
            _text_orig(d, (x, y), ch, font=em_font, embedded_color=True)
            bbox = _bbox_orig(d, (x, y), ch, font=em_font)
            x = bbox[2]
        else:
            buf += ch
    if buf:
        _text_orig(d, (x, y), buf, font=font, fill=fill)


# Override d.text to use mixed renderer
def patched_text(self, xy, text, fill=None, font=None, anchor=None,
                 spacing=4, align="left", direction=None, features=None,
                 language=None, stroke_width=0, stroke_fill=None,
                 embedded_color=False, **kwargs):
    if isinstance(text, str) and any(is_emoji(c) for c in text) \
            and not embedded_color:
        draw_mixed(self, xy, text, font or f(20), fill=fill)
        return
    _text_orig(self, xy, text, fill=fill, font=font, anchor=anchor,
               spacing=spacing, align=align, direction=direction,
               features=features, language=language,
               stroke_width=stroke_width, stroke_fill=stroke_fill,
               embedded_color=embedded_color, **kwargs)


ImageDraw.ImageDraw.text = patched_text


def base_canvas(status_title="Малчин"):
    """Утасны статус мөр, дээд header-тэй суурь дэлгэц"""
    img = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    # Статус мөр (хар)
    d.rectangle([0, 0, W, 40], fill=BLACK)
    d.text((20, 8), "9:41", font=f(20, True), fill=WHITE)
    d.text((W - 80, 8), "100%", font=f(18, True), fill=WHITE)
    # Header (ногоон)
    d.rectangle([0, 40, W, 140], fill=GREEN_DARK)
    d.text((30, 75), status_title, font=f(32, True), fill=WHITE)
    return img, d


def rounded_rect(d, xy, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline,
                        width=width)


def card(d, x, y, w, h, title, body=None, color=WHITE, border=GRAY_LIGHT):
    rounded_rect(d, [x, y, x + w, y + h], 16, fill=color, outline=border,
                 width=2)
    d.text((x + 20, y + 18), title, font=f(22, True), fill=BLACK)
    if body:
        d.text((x + 20, y + 50), body, font=f(18), fill=GRAY)


def bottom_tab_bar(d, active=0):
    """Доод 5 цэгтэй tab bar"""
    d.rectangle([0, H - 90, W, H], fill=WHITE)
    d.line([(0, H - 90), (W, H - 90)], fill=GRAY_LIGHT, width=2)
    tabs = [("🏠", "Нүүр"), ("🐑", "Мал"), ("🌾", "Бэлчээр"),
            ("📰", "Мэдээ"), ("👤", "Профайл")]
    tw = W // 5
    for i, (emo, label) in enumerate(tabs):
        x = i * tw
        color = GREEN_DARK if i == active else GRAY
        d.text((x + tw // 2 - 12, H - 75), emo, font=f(28), fill=color)
        d.text((x + tw // 2 - 22, H - 35), label, font=f(14, i == active),
               fill=color)


def save(img, name):
    path = os.path.join(OUT_DIR, name)
    # RGBA -> RGB to keep file lighter
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        bg.save(path, 'PNG')
    else:
        img.save(path, 'PNG')
    print(f"  -> {name}")


# ============================================================
# 1. Утас, OTP оруулах
# ============================================================
def screen_phone():
    img, d = base_canvas("Нэвтрэх")
    # Лого хэсэг
    d.ellipse([260, 200, 460, 400], fill=GREEN_LIGHT, outline=GREEN_DARK,
              width=4)
    d.text((325, 270), "🐑", font=f(80), fill=GREEN_DARK)
    d.text((220, 430), "Малчин Апп", font=f(36, True), fill=GREEN_DARK)
    d.text((180, 480), "Утасны дугаараар нэвтэрнэ", font=f(20), fill=GRAY)
    # Утас оруулах талбар
    rounded_rect(d, [60, 580, W - 60, 660], 12, fill=WHITE,
                 outline=GREEN_DARK, width=3)
    d.text((80, 605), "+976", font=f(24, True), fill=GREEN_DARK)
    d.text((180, 605), "9911 2233", font=f(24, True), fill=BLACK)
    # Товч
    rounded_rect(d, [60, 700, W - 60, 780], 12, fill=GREEN_DARK)
    d.text((280, 723), "ҮРГЭЛЖЛҮҮЛЭХ", font=f(24, True), fill=WHITE)
    # Жижиг тайлбар
    d.text((130, 830), "Кодыг мессежээр илгээнэ", font=f(18), fill=GRAY)
    return img


# ============================================================
# 2. Бүртгэл — role сонгох
# ============================================================
def screen_role():
    img, d = base_canvas("Та хэн бэ?")
    # Алхам мэдэгдэл
    d.text((30, 170), "Алхам 5/10", font=f(18), fill=GRAY)
    rounded_rect(d, [30, 200, W - 30, 215], 8, fill=GRAY_LIGHT)
    rounded_rect(d, [30, 200, 30 + (W - 60) // 2, 215], 8, fill=GREEN_DARK)
    # Ролийн картууд
    roles = [
        ("👨‍🌾", "Малчин", "Өрх, мал, бэлчээр"),
        ("👨‍💼", "Багийн дарга", "Багийн өрхүүдийг удирдах"),
        ("🏛️", "Сумын удирдлага", "Сум доторх бүх баг"),
        ("🏢", "Хоршоо", "Гишүүд, бараа борлуулалт"),
        ("🔧", "Үйлчилгээ үзүүлэгч", "Мал эмч, тээвэр г.м."),
    ]
    y = 260
    for i, (emo, name, desc) in enumerate(roles):
        sel = (i == 0)
        rounded_rect(d, [30, y, W - 30, y + 130], 16,
                     fill=GREEN_LIGHT if sel else WHITE,
                     outline=GREEN_DARK if sel else GRAY_LIGHT,
                     width=3 if sel else 2)
        d.text((50, y + 35), emo, font=f(56), fill=GREEN_DARK)
        d.text((140, y + 30), name, font=f(26, True), fill=BLACK)
        d.text((140, y + 70), desc, font=f(18), fill=GRAY)
        if sel:
            d.text((W - 80, y + 50), "✓", font=f(40, True), fill=GREEN_DARK)
        y += 150
    return img


# ============================================================
# 3. Нүүр хуудас — 9 карт
# ============================================================
def screen_home():
    img, d = base_canvas("Малчин")
    d.text((30, 100), "Сайн уу, Дорж ах", font=f(22), fill=GREEN_LIGHT)

    y = 170
    # Том карт — Цаг агаар
    rounded_rect(d, [20, y, W - 20, y + 180], 16, fill=GREEN_MID)
    d.text((40, y + 25), "🌤  Өнөөдрийн цаг агаар", font=f(22, True),
           fill=WHITE)
    d.text((40, y + 70), "-12°C", font=f(56, True), fill=WHITE)
    d.text((40, y + 140), "Цэлмэг, салхи зүүн талаас 5 м/с", font=f(18),
           fill=WHITE)
    d.text((W - 200, y + 70), "🌡 -18°", font=f(20), fill=WHITE)
    d.text((W - 200, y + 100), "💨 5 м/с", font=f(20), fill=WHITE)

    # Эрсдэлийн анхааруулга
    y += 200
    rounded_rect(d, [20, y, W - 20, y + 100], 16, fill=GOLD_LIGHT,
                 outline=GOLD, width=3)
    d.text((40, y + 25), "⚠  Маргааш цас орох төлөвтэй", font=f(20, True),
           fill=BLACK)
    d.text((40, y + 60), "Малаа өвөлжөө рүү ойртуулна уу", font=f(16),
           fill=GRAY)

    # Өнөөдөр хийх 3 ажил
    y += 120
    rounded_rect(d, [20, y, W - 20, y + 200], 16, fill=WHITE,
                 outline=GRAY_LIGHT, width=2)
    d.text((40, y + 18), "✅  Өнөөдөр хийх 3 ажил", font=f(20, True),
           fill=GREEN_DARK)
    tasks = ["Малыг услана", "Өвсөө шалгана", "Өвөлжөөний гадуур цэвэрлэх"]
    for i, t in enumerate(tasks):
        d.text((40, y + 60 + i * 40), f"  {i+1}.  {t}", font=f(18),
               fill=BLACK)

    # Доод 4 жижиг товчлуур
    y += 220
    quick = [("🩺", "Мал эмч"), ("🔍", "Алдсан"), ("📰", "Мэдэгдэл"),
             ("💰", "Зар")]
    qw = (W - 60) // 4
    for i, (emo, lbl) in enumerate(quick):
        x = 20 + i * (qw + 10)
        rounded_rect(d, [x, y, x + qw, y + 90], 12, fill=CREAM,
                     outline=GOLD, width=2)
        d.text((x + qw // 2 - 16, y + 18), emo, font=f(32), fill=BLACK)
        d.text((x + qw // 2 - 30, y + 60), lbl, font=f(15, True),
               fill=GREEN_DARK)

    bottom_tab_bar(d, active=0)
    return img


# ============================================================
# 4. Мал бүртгэл
# ============================================================
def screen_livestock():
    img, d = base_canvas("Мал бүртгэл")
    d.text((30, 100), "Нийт: 285 толгой", font=f(22), fill=GREEN_LIGHT)

    livestock = [
        ("🐑", "Хонь", 150, "+12 төл"),
        ("🐐", "Ямаа", 80, "+5 төл"),
        ("🐂", "Үхэр", 30, "—"),
        ("🐎", "Адуу", 20, "+1 унага"),
        ("🐪", "Тэмээ", 5, "—"),
    ]
    y = 170
    for emo, name, count, sub in livestock:
        rounded_rect(d, [20, y, W - 20, y + 130], 16, fill=WHITE,
                     outline=GRAY_LIGHT, width=2)
        d.text((45, y + 30), emo, font=f(64), fill=BLACK)
        d.text((160, y + 25), name, font=f(28, True), fill=BLACK)
        d.text((160, y + 70), sub, font=f(18), fill=GREEN_MID)
        d.text((W - 180, y + 35), str(count), font=f(48, True),
               fill=GREEN_DARK)
        d.text((W - 90, y + 75), "толгой", font=f(16), fill=GRAY)
        y += 145
    # Доод нэмэх товч
    rounded_rect(d, [W // 2 - 80, H - 180, W // 2 + 80, H - 100], 40,
                 fill=GOLD)
    d.text((W // 2 - 12, H - 165), "+", font=f(48, True), fill=WHITE)
    bottom_tab_bar(d, active=1)
    return img


# ============================================================
# 5. Бэлчээр / Газрын зураг
# ============================================================
def screen_pasture():
    img, d = base_canvas("Бэлчээр")
    # "Газрын зураг" дүр
    d.rectangle([0, 140, W, H - 90], fill=(220, 235, 220))
    # Замын шугам
    for i in range(0, W, 40):
        d.line([(i, 300 + (i % 200) // 4), (i + 30, 320 + (i % 200) // 4)],
               fill=(180, 200, 180), width=2)
    for i in range(200, H - 200, 60):
        d.line([(100, i), (W - 100, i + 20)], fill=(180, 200, 180), width=2)

    # 4 улирлын бууц цэгүүд
    seasons = [
        (180, 360, "Өвөлжөө", BLUE),
        (450, 480, "Хаваржаа", GREEN_MID),
        (300, 700, "Зуслан", GOLD),
        (520, 850, "Намаржаа", ORANGE),
    ]
    for x, y, lbl, c in seasons:
        d.ellipse([x - 20, y - 20, x + 20, y + 20], fill=c, outline=WHITE,
                  width=3)
        # Нэр
        rounded_rect(d, [x + 30, y - 18, x + 200, y + 18], 8, fill=WHITE,
                     outline=c, width=2)
        d.text((x + 40, y - 12), lbl, font=f(18, True), fill=c)

    # Одоогийн байршил (улаан pulse)
    d.ellipse([350 - 40, 600 - 40, 350 + 40, 600 + 40], fill=None,
              outline=RED, width=3)
    d.ellipse([350 - 15, 600 - 15, 350 + 15, 600 + 15], fill=RED)
    d.text((400, 590), "Та энд", font=f(20, True), fill=RED)

    # Доод мэдээллийн карт
    rounded_rect(d, [20, H - 280, W - 20, H - 110], 16, fill=WHITE,
                 outline=GREEN_DARK, width=3)
    d.text((40, H - 260), "📍  Одоогийн байршил", font=f(22, True),
           fill=GREEN_DARK)
    d.text((40, H - 215), "Сүхбаатар аймаг, Эрдэнэцагаан сум", font=f(20),
           fill=BLACK)
    d.text((40, H - 180), "5-р баг • Зуслангаас 12 км", font=f(18),
           fill=GRAY)
    d.text((40, H - 140), "🌿 Бэлчээр: дунд зэрэг", font=f(18, True),
           fill=GREEN_MID)
    bottom_tab_bar(d, active=2)
    return img


# ============================================================
# 6. Зөвлөгөө — Ухаалаг туслах
# ============================================================
def screen_advisory():
    img, d = base_canvas("Ухаалаг туслах")
    # Асуулт
    rounded_rect(d, [W // 2 - 50, 170, W - 30, 260], 16, fill=GREEN_MID)
    d.text((W // 2 - 30, 195), "Хонь толгой", font=f(20, True), fill=WHITE)
    d.text((W // 2 - 30, 220), "эргэвэл яах вэ?", font=f(20, True),
           fill=WHITE)
    # Хариулт картууд
    answers = [
        ("👉", "ОДОО ЮУ ХИЙХ", "Тусдаа байрлуулж амраах. Цэвэр ус өг.",
         GREEN_DARK),
        ("📋", "ЯАГААД ТЭГЭХ", "Хоол боловсруулалт алдагдсан байж "
         "болзошгүй.", BLACK),
        ("🔢", "АЛХМУУД",
         "1. Тусгаарлах  2. Дулаан байрлуулах  3. Эмчид мэдэгдэх", BLACK),
        ("⚠️", "АНХААРАХ", "24 цагт сэргэхгүй бол мал эмчид яаралтай.",
         RED),
    ]
    y = 290
    for emo, title, body, color in answers:
        rounded_rect(d, [30, y, W - 30, y + 160], 16, fill=WHITE,
                     outline=GRAY_LIGHT, width=2)
        d.text((50, y + 25), f"{emo} {title}", font=f(20, True), fill=color)
        # body wrap
        words = body.split(" ")
        line = ""
        ly = y + 65
        for word in words:
            test = (line + " " + word).strip()
            bbox = d.textbbox((0, 0), test, font=f(18))
            if bbox[2] - bbox[0] > W - 100:
                d.text((50, ly), line, font=f(18), fill=BLACK)
                line = word
                ly += 30
            else:
                line = test
        if line:
            d.text((50, ly), line, font=f(18), fill=BLACK)
        y += 175
    return img


# ============================================================
# 7. Ахмадын ухаан
# ============================================================
def screen_elder():
    img, d = base_canvas("Ахмадын ухаан")
    # Том видео карт
    rounded_rect(d, [20, 170, W - 20, 510], 16, fill=GRAY_LIGHT)
    # Видео preview-ийн loaded гэх мэт хээ
    d.rectangle([20, 170, W - 20, 460], fill=(120, 100, 80))
    d.ellipse([W // 2 - 50, 290, W // 2 + 50, 390], fill=WHITE,
              outline=GOLD, width=4)
    d.polygon([(W // 2 - 15, 310), (W // 2 - 15, 370), (W // 2 + 25, 340)],
              fill=GOLD)
    # Карт доод хэсэг
    d.text((40, 470), "▶  Зуны бэлчээрийн нууц", font=f(22, True),
           fill=BLACK)

    # Бусад жагсаалт
    items = [
        ("🎤", "Чонын дайралтаас сэргийлэх",
         "Лхагва ах • 5 минут • Сонссон: 234"),
        ("📷", "Хурдан тулга бариулах нь",
         "Дашням ах • Зураг • Үзсэн: 892"),
        ("🎤", "Хайнаг хээлтэй болсон үед",
         "Цэгмид эмээ • 3 минут • Сонссон: 156"),
    ]
    y = 540
    for emo, title, sub in items:
        rounded_rect(d, [20, y, W - 20, y + 110], 12, fill=WHITE,
                     outline=GRAY_LIGHT, width=2)
        d.text((40, y + 25), emo, font=f(40), fill=GOLD)
        d.text((110, y + 22), title, font=f(20, True), fill=BLACK)
        d.text((110, y + 60), sub, font=f(15), fill=GRAY)
        y += 125
    return img


# ============================================================
# 8. Алдсан / Олдсон мал
# ============================================================
def screen_lost_found():
    img, d = base_canvas("Алдсан / Олдсон")
    # 2 том таб товч
    rounded_rect(d, [30, 170, W // 2 - 10, 240], 12, fill=RED)
    d.text((85, 188), "АЛДСАН", font=f(22, True), fill=WHITE)
    rounded_rect(d, [W // 2 + 10, 170, W - 30, 240], 12, fill=GRAY_LIGHT)
    d.text((W // 2 + 65, 188), "ОЛДСОН", font=f(22, True), fill=GRAY)

    # Жагсаалт
    items = [
        ("🐎", "Хээр зүсмэн адуу",
         "5 настай • Зүүн чихний бариу • Дугаар 234",
         "Эрдэнэцагаан • 2 цагийн өмнө", RED),
        ("🐄", "Бухан үхэр",
         "8 настай • Хар толбот • Хазуул байхгүй",
         "Мөнххаан • Өчигдөр", RED),
        ("🐑", "Цагаан хонь",
         "Сондгой эвэртэй • Хонин тоо: 5 ширхэг",
         "Дадал сум • 2 хоногийн өмнө", ORANGE),
    ]
    y = 270
    for emo, title, info, loc, color in items:
        rounded_rect(d, [20, y, W - 20, y + 200], 16, fill=WHITE,
                     outline=color, width=3)
        # Зургийн дөрвөлжин
        d.rectangle([40, y + 25, 180, y + 165], fill=GRAY_LIGHT,
                    outline=color, width=2)
        d.text((90, y + 70), emo, font=f(60), fill=color)
        # Текст
        d.text((200, y + 25), title, font=f(22, True), fill=BLACK)
        d.text((200, y + 65), info, font=f(15), fill=GRAY)
        d.text((200, y + 105), loc, font=f(15), fill=color)
        # Холбогдох товч
        rounded_rect(d, [200, y + 145, 350, y + 180], 8, fill=color)
        d.text((220, y + 152), "📞 Холбогдох", font=f(15, True), fill=WHITE)
        y += 215
    return img


# ============================================================
# 9. Зах зээл — зар жагсаалт
# ============================================================
def screen_market():
    img, d = base_canvas("Зар захиалга")
    # Filter chips
    chips = ["Бүгд", "Өвс", "Унаа", "Мал", "Ажил"]
    x = 20
    for i, c in enumerate(chips):
        sel = (i == 1)
        bbox = d.textbbox((0, 0), c, font=f(18, True))
        cw = bbox[2] - bbox[0] + 30
        rounded_rect(d, [x, 165, x + cw, 210], 22,
                     fill=GREEN_DARK if sel else WHITE,
                     outline=GREEN_DARK, width=2)
        d.text((x + 15, 175), c, font=f(18, True),
               fill=WHITE if sel else GREEN_DARK)
        x += cw + 10

    # Зар картууд
    items = [
        ("🌾", "Сайн чанарын өвс зарна",
         "Шар тариа холимог • 250 кг боодол",
         "₮ 65,000 / боодол", "Чойбалсан • Өчигдөр"),
        ("🚛", "Малын тэвэр унаа",
         "ЗИЛ-130 • 50 толгой хүртэл",
         "₮ 1,500 / км", "Эрдэнэцагаан • 3 цагийн өмнө"),
        ("👷", "Зуслан рүү 2 хоногийн ажил",
         "Хадлан хадах • Хоол байр",
         "₮ 100,000 / хүн", "Дадал • Өнөөдөр"),
    ]
    y = 240
    for emo, title, sub, price, loc in items:
        rounded_rect(d, [20, y, W - 20, y + 180], 16, fill=WHITE,
                     outline=GRAY_LIGHT, width=2)
        d.rectangle([40, y + 20, 160, y + 140], fill=CREAM, outline=GOLD,
                    width=2)
        d.text((75, y + 50), emo, font=f(56), fill=BLACK)
        d.text((180, y + 25), title, font=f(22, True), fill=BLACK)
        d.text((180, y + 65), sub, font=f(16), fill=GRAY)
        d.text((180, y + 100), price, font=f(22, True), fill=GREEN_DARK)
        d.text((180, y + 145), loc, font=f(14), fill=GRAY)
        y += 195
    return img


# ============================================================
# 10. Мал эмч цаг захиалах
# ============================================================
def screen_vet():
    img, d = base_canvas("Мал эмч")
    rounded_rect(d, [20, 170, W - 20, 320], 16, fill=GREEN_LIGHT,
                 outline=GREEN_DARK, width=3)
    d.ellipse([60, 195, 200, 295], fill=WHITE, outline=GREEN_DARK, width=3)
    d.text((105, 220), "🩺", font=f(60), fill=GREEN_DARK)
    d.text((220, 195), "Б. Ганбат", font=f(28, True), fill=BLACK)
    d.text((220, 235), "Сумын ахлах мал эмч", font=f(18), fill=GRAY)
    d.text((220, 265), "⭐ 4.8 • 12 жил туршлагатай", font=f(16),
           fill=ORANGE)
    rounded_rect(d, [220, 290, 400, 310], 6, fill=GREEN_DARK)
    d.text((250, 290), "● Идэвхтэй", font=f(14, True), fill=WHITE)

    d.text((30, 350), "Энэ долоо хоногийн чөлөөт цаг", font=f(22, True),
           fill=GREEN_DARK)
    days = [("Дав", "5", "10:00", True), ("Мяг", "6", "—", False),
            ("Лха", "7", "14:00", True), ("Пүр", "8", "09:00", True),
            ("Баа", "9", "—", False)]
    x = 30
    for day, num, time, avail in days:
        sel = (day == "Лха")
        rounded_rect(d, [x, 400, x + 120, 540], 12,
                     fill=GREEN_DARK if sel else WHITE,
                     outline=GREEN_DARK if avail else GRAY_LIGHT,
                     width=2)
        d.text((x + 35, 415), day, font=f(18, True),
               fill=WHITE if sel else GREEN_DARK)
        d.text((x + 40, 445), num, font=f(36, True),
               fill=WHITE if sel else BLACK)
        d.text((x + 25, 500), time, font=f(16, True),
               fill=WHITE if sel else (GRAY if not avail else GREEN_DARK))
        x += 130

    # Захиалах товч
    rounded_rect(d, [30, 600, W - 30, 690], 16, fill=GOLD)
    d.text((220, 625), "✓  ЦАГ ЗАХИАЛАХ", font=f(28, True), fill=BLACK)

    # Чат талбар
    rounded_rect(d, [20, 720, W - 20, 950], 16, fill=GRAY_BG,
                 outline=GRAY_LIGHT, width=2)
    d.text((40, 740), "💬  Эмчид зураг, асуулт илгээх", font=f(20, True),
           fill=GREEN_DARK)
    rounded_rect(d, [40, 790, W - 40, 920], 12, fill=WHITE,
                 outline=GRAY_LIGHT, width=1)
    d.text((60, 815), "Малын зураг хавсаргаж", font=f(18), fill=GRAY)
    d.text((60, 845), "асуултаа бичнэ үү...", font=f(18), fill=GRAY)
    d.text((W - 100, 870), "📷  ➤", font=f(28), fill=GREEN_DARK)
    return img


# ============================================================
# 11. Сум, багийн мэдэгдэл
# ============================================================
def screen_news():
    img, d = base_canvas("Мэдэгдэл")
    items = [
        ("🏛️", "Сумын засаг даргаас",
         "Малын тарилгын хуваарь",
         "Энэ сарын 15-нд бруцеллезын тарилга...",
         "Өнөөдөр • 09:30", RED, True),
        ("👨‍💼", "Багийн дарга",
         "Багийн хурал",
         "Маргааш 14:00 цагт сумын төвд...",
         "Өчигдөр • 18:45", GREEN_DARK, True),
        ("🏛️", "Сумын засаг даргаас",
         "Зудын бэлэн байдлын хуваарь",
         "Бүх айл өвсний нөөцөө шалгана уу...",
         "2 хоногийн өмнө", BLUE, False),
        ("👨‍💼", "Багийн дарга",
         "Тооллогын мэдэгдэл",
         "Малын тооллого 12-р сард...",
         "1 долоо хоногийн өмнө", GREEN_DARK, False),
    ]
    y = 170
    for emo, who, title, body, time, color, unread in items:
        h = 180
        rounded_rect(d, [20, y, W - 20, y + h], 16,
                     fill=CREAM if unread else WHITE,
                     outline=color if unread else GRAY_LIGHT,
                     width=3 if unread else 1)
        # Avatar
        d.ellipse([40, y + 30, 110, y + 100], fill=color, outline=WHITE,
                  width=2)
        d.text((58, y + 45), emo, font=f(32), fill=WHITE)
        if unread:
            d.ellipse([95, y + 25, 115, y + 45], fill=RED)
        d.text((130, y + 30), who, font=f(16, True), fill=color)
        d.text((130, y + 55), title, font=f(22, True), fill=BLACK)
        d.text((130, y + 95), body, font=f(16), fill=GRAY)
        d.text((130, y + 135), time, font=f(14), fill=GRAY)
        y += h + 12
    bottom_tab_bar(d, active=3)
    return img


# ============================================================
# 12. Өрх / Санхүү
# ============================================================
def screen_household():
    img, d = base_canvas("Өрх ба санхүү")
    # Top карт — энэ сарын тооцоо
    rounded_rect(d, [20, 170, W - 20, 380], 16, fill=GREEN_DARK)
    d.text((40, 195), "Энэ сарын тооцоо", font=f(20), fill=GREEN_LIGHT)
    d.text((40, 230), "₮ 2,450,000", font=f(48, True), fill=WHITE)
    d.text((40, 295), "Орлого", font=f(16), fill=GREEN_LIGHT)
    d.text((40, 320), "+ ₮ 3,200,000", font=f(24, True), fill=GOLD)
    d.text((W // 2 + 20, 295), "Зарлага", font=f(16), fill=GREEN_LIGHT)
    d.text((W // 2 + 20, 320), "- ₮ 750,000", font=f(24, True),
           fill=(255, 200, 200))

    # Өрхийн гишүүд
    d.text((30, 410), "Өрхийн гишүүд", font=f(22, True), fill=BLACK)
    members = [("👨", "Дорж", "Өрхийн тэргүүн"),
               ("👩", "Сарангэрэл", "Эхнэр"),
               ("👦", "Батаа", "Хүү • 12 нас"),
               ("👧", "Болор", "Охин • 8 нас")]
    y = 450
    for emo, name, role in members:
        rounded_rect(d, [20, y, W - 20, y + 80], 12, fill=WHITE,
                     outline=GRAY_LIGHT, width=2)
        d.ellipse([40, y + 15, 100, y + 65], fill=CREAM)
        d.text((52, y + 18), emo, font=f(36), fill=BLACK)
        d.text((120, y + 18), name, font=f(22, True), fill=BLACK)
        d.text((120, y + 50), role, font=f(16), fill=GRAY)
        y += 90

    # ЭМД/НДШ
    rounded_rect(d, [20, y + 10, W - 20, y + 130], 16, fill=CREAM,
                 outline=GOLD, width=2)
    d.text((40, y + 30), "🏥  ЭМД, НДШ", font=f(20, True), fill=BLACK)
    d.text((40, y + 65), "✓ ЭМД — 2026 сарын төлбөр төлөгдсөн", font=f(16),
           fill=GREEN_MID)
    d.text((40, y + 95), "⚠ НДШ — энэ сар хоцорсон байна", font=f(16),
           fill=RED)
    return img


# ============================================================
# 13. Багц / Pricing
# ============================================================
def screen_pricing():
    img, d = base_canvas("Багц сонгох")
    d.text((30, 100), "Үнэгүйгээр л эхэлж болно", font=f(20),
           fill=GREEN_LIGHT)

    plans = [
        ("ҮНЭГҮЙ", "₮ 0", "Үндсэн боломжууд бүгд", GREEN_MID, False),
        ("ПРЕМИУМ", "₮ 9,900 / сар",
         "Гүнзгий зөвлөгөө + эрсдэл", GOLD, True),
        ("ХОРШОО", "₮ 29,900 / сар",
         "Олон гишүүнтэй хоршоонд", GREEN_DARK, False),
    ]
    y = 170
    for name, price, desc, color, recommended in plans:
        h = 250
        rounded_rect(d, [20, y, W - 20, y + h], 20,
                     fill=GOLD_LIGHT if recommended else WHITE,
                     outline=color, width=4 if recommended else 2)
        if recommended:
            rounded_rect(d, [W - 200, y - 15, W - 50, y + 25], 10, fill=GOLD)
            d.text((W - 180, y - 10), "САНАЛ БОЛГОЖ БУЙ", font=f(16, True),
                   fill=WHITE)
        d.text((40, y + 25), name, font=f(28, True), fill=color)
        d.text((40, y + 80), price, font=f(40, True), fill=BLACK)
        d.text((40, y + 145), desc, font=f(20), fill=GRAY)
        # Сонгох товч
        rounded_rect(d, [40, y + 185, W - 40, y + 230], 12, fill=color)
        d.text((W // 2 - 50, y + 195), "СОНГОХ", font=f(20, True),
               fill=WHITE)
        y += h + 20
    return img


# ============================================================
# 14. Багийн даргын самбар
# ============================================================
def screen_bag_dashboard():
    img, d = base_canvas("Багийн самбар")
    d.text((30, 100), "5-р баг • 24 өрх • 1,847 толгой мал",
           font=f(18), fill=GREEN_LIGHT)

    # Дээд статистик 3 карт
    stats = [
        ("24", "Нийт өрх", GREEN_DARK),
        ("3", "Эрсдэлтэй", RED),
        ("1,847", "Толгой мал", GOLD),
    ]
    sw = (W - 60) // 3
    y = 170
    for i, (val, lbl, color) in enumerate(stats):
        x = 20 + i * (sw + 10)
        rounded_rect(d, [x, y, x + sw, y + 130], 16, fill=WHITE,
                     outline=color, width=3)
        d.text((x + 30, y + 20), val, font=f(36, True), fill=color)
        d.text((x + 20, y + 80), lbl, font=f(16), fill=GRAY)

    # Мэдэгдэл явуулах том товч
    rounded_rect(d, [20, 320, W - 20, 410], 16, fill=GREEN_DARK)
    d.text((50, 348), "📢  БҮХ МАЛЧДАД МЭДЭГДЭЛ ЯВУУЛАХ",
           font=f(22, True), fill=WHITE)

    # Эрсдэлтэй өрхүүдийн жагсаалт
    d.text((30, 440), "⚠  Эрсдэлтэй өрхүүд", font=f(22, True), fill=RED)
    risky = [
        ("Дорж — Цагаан өндөр", "Цастай нутагт", "150 толгой"),
        ("Сүрэн — Бор толгой", "Өвс багатай", "230 толгой"),
        ("Батаа — Хар хад", "Хол оторт", "180 толгой"),
    ]
    y = 490
    for name, risk, count in risky:
        rounded_rect(d, [20, y, W - 20, y + 90], 12, fill=CREAM,
                     outline=RED, width=2)
        d.ellipse([40, y + 20, 95, y + 70], fill=RED)
        d.text((52, y + 25), "⚠", font=f(28, True), fill=WHITE)
        d.text((110, y + 18), name, font=f(20, True), fill=BLACK)
        d.text((110, y + 50), f"{risk} • {count}", font=f(16), fill=GRAY)
        # Холбогдох товч
        rounded_rect(d, [W - 130, y + 30, W - 40, y + 65], 8, fill=RED)
        d.text((W - 115, y + 38), "📞 Утсаар", font=f(14, True), fill=WHITE)
        y += 100

    # Тайлан гаргах
    rounded_rect(d, [20, y + 20, W - 20, y + 90], 12, fill=WHITE,
                 outline=GREEN_DARK, width=3)
    d.text((50, y + 38), "📊  Сарын тайлан гаргах", font=f(22, True),
           fill=GREEN_DARK)
    return img


# ============================================================
# Бүгдийг хадгалах
# ============================================================
screens = [
    ("01-phone.png", screen_phone),
    ("02-role.png", screen_role),
    ("03-home.png", screen_home),
    ("04-livestock.png", screen_livestock),
    ("05-pasture.png", screen_pasture),
    ("06-advisory.png", screen_advisory),
    ("07-elder.png", screen_elder),
    ("08-lost-found.png", screen_lost_found),
    ("09-market.png", screen_market),
    ("10-vet.png", screen_vet),
    ("11-news.png", screen_news),
    ("12-household.png", screen_household),
    ("13-pricing.png", screen_pricing),
    ("14-bag-dashboard.png", screen_bag_dashboard),
]

print("Generating screens...")
for name, fn in screens:
    img = fn()
    save(img, name)
print(f"Done. Output: {OUT_DIR}")

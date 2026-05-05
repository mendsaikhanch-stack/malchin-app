"""
Багийн даргад зориулсан танилцуулгыг PDF болгож үүсгэх.

PPTX-тэй ижил агуулга, layout. Cyrillic + emoji дэмжсэн TTF font ашиглана.
Mockup screenshot-уудыг docs/mockups/-ээс уншиж оруулна.

Гарах файл: docs/bag-darga-tanilsuulga.pdf
"""
import os
from fpdf import FPDF

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MOCKUPS = os.path.join(ROOT, 'docs', 'mockups')
OUT = os.path.join(ROOT, 'docs', 'bag-darga-tanilsuulga.pdf')

# A4 landscape: 297 x 210 mm
PAGE_W, PAGE_H = 297, 210

# Өнгө (RGB tuple)
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
RED = (198, 40, 40)
ORANGE = (255, 152, 0)
BLUE = (33, 150, 243)

FONT_REG = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
FONT_EMOJI = "C:/Windows/Fonts/seguiemj.ttf"


def emoji_safe(text):
    """fpdf2 нь color emoji дэмждэггүй — ASCII-д орчуулна"""
    replacements = {
        '🐑': '[Хонь]', '🐐': '[Ямаа]', '🐂': '[Үхэр]', '🐎': '[Адуу]',
        '🐪': '[Тэмээ]', '🐄': '[Үнээ]',
        '🌤': '*', '⛅': '*', '☀': '*', '❄': '*',
        '⚠️': '!', '⚠': '!',
        '✅': 'v', '✓': 'v', '✗': 'x',
        '📞': 'тел.', '📷': 'зураг', '📋': '*', '📊': '*',
        '📢': '!!', '📰': '*', '📍': '@', '📦': '*',
        '🩺': '+', '🏥': '+', '🏛': '*', '🏛️': '*', '🏠': '*',
        '👨‍🌾': 'Малчин', '👨‍💼': 'Дарга', '👨': '', '👩': '',
        '👦': '', '👧': '', '👨‍👩‍👧‍👦': '',
        '🧓': 'Ах', '🎤': '*', '🎬': '*',
        '🌿': '*', '🌾': '*', '🌱': '*',
        '🚛': '*', '🚚': '*',
        '👷': 'Ажил', '🔧': 'Засвар',
        '💰': '$', '💡': '*', '💬': '*',
        '🔍': '*',
        '⭐': '*',
        '➤': '>', '→': '>', '👉': '>',
        '🐾': '*', '🏢': 'Хоршоо',
        '📱': '*',
        '●': '*', '○': '*',
        '▶': '>',
        '🔢': '#',
        '✨': '*',
        '🆓': 'үнэгүй',
        '👤': '*',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text


class PDF(FPDF):
    def __init__(self):
        super().__init__(orientation='L', unit='mm', format='A4')
        self.set_auto_page_break(False)
        self.add_font('Arial', '', FONT_REG)
        self.add_font('Arial', 'B', FONT_BOLD)
        self.set_margin(0)

    def fill(self, color):
        self.set_fill_color(*color)

    def stroke(self, color):
        self.set_draw_color(*color)

    def ink(self, color):
        self.set_text_color(*color)

    def use_font(self, size, bold=False):
        self.set_font('Arial', 'B' if bold else '', size)

    def rect_fill(self, x, y, w, h, color):
        self.fill(color)
        self.rect(x, y, w, h, style='F')

    def round_rect(self, x, y, w, h, r, fill=None, stroke=None,
                   stroke_w=0.3):
        if fill:
            self.fill(fill)
        if stroke:
            self.stroke(stroke)
        self.set_line_width(stroke_w)
        style = ''
        if fill and stroke:
            style = 'DF'
        elif fill:
            style = 'F'
        elif stroke:
            style = 'D'
        self.rect(x, y, w, h, style=style, round_corners=True,
                  corner_radius=r)

    def write_text(self, x, y, text, *, size=10, bold=False, color=BLACK,
                   align='L', max_w=None):
        text = emoji_safe(text)
        self.use_font(size, bold)
        self.ink(color)
        if max_w:
            self.set_xy(x, y)
            self.cell(max_w, size * 0.5, text, align=align)
        else:
            self.text(x, y + size * 0.4, text)  # baseline tweak

    def write_multi(self, x, y, w, text, *, size=10, bold=False,
                    color=BLACK, line_h=None):
        text = emoji_safe(text)
        self.use_font(size, bold)
        self.ink(color)
        self.set_xy(x, y)
        self.multi_cell(w, line_h or size * 0.55, text, align='L')


pdf = PDF()


# ============================================================
# Helper: header bar
# ============================================================
def header_bar(title, subtitle=None):
    pdf.rect_fill(0, 0, PAGE_W, 22, GREEN_DARK)
    pdf.write_text(10, 4, title, size=18, bold=True, color=WHITE)
    if subtitle:
        pdf.write_text(10, 14, subtitle, size=9, color=CREAM)


def page_bg():
    pdf.rect_fill(0, 0, PAGE_W, PAGE_H, CREAM)


def bullet_list(x, y, items, *, size=11, color=BLACK, line_h=7):
    pdf.use_font(size, False)
    pdf.ink(color)
    for item in items:
        item = emoji_safe(item)
        pdf.set_xy(x, y)
        pdf.cell(0, line_h, "• " + item)
        y += line_h


def add_phone_image(x, y, h, image_name):
    """Утасны frame + screenshot. Зургийг өндөрт нь тааруулна."""
    img_path = os.path.join(MOCKUPS, image_name)
    if not os.path.exists(img_path):
        # fallback placeholder
        ratio = 720 / 1280
        w = h * ratio
        pdf.round_rect(x, y, w, h, 4, fill=WHITE, stroke=GOLD, stroke_w=1)
        pdf.write_text(x + 5, y + h / 2, "[Зураг]", size=10, color=GRAY)
        return w
    ratio = 720 / 1280
    w = h * ratio
    # Хар утасны frame
    pad = w * 0.04
    pdf.round_rect(x - pad, y - pad, w + pad * 2, h + pad * 2, 3,
                   fill=BLACK, stroke=GRAY, stroke_w=0.4)
    # Зураг
    pdf.image(img_path, x=x, y=y, w=w, h=h)
    return w


# ============================================================
# СЛАЙД 1 — НҮҮР
# ============================================================
pdf.add_page()
pdf.rect_fill(0, 0, PAGE_W, PAGE_H, GREEN_DARK)
# Логогын тойрог
cx, cy = PAGE_W / 2, 60
pdf.fill(GOLD)
pdf.stroke(GOLD)
pdf.ellipse(cx - 25, cy - 25, 50, 50, style='F')
pdf.use_font(36, True)
pdf.ink(GREEN_DARK)
pdf.text(cx - 22, cy + 12, "MA")

pdf.write_text(0, 95, "МАЛЧИН АПП", size=44, bold=True, color=GOLD,
               align='C', max_w=PAGE_W)
pdf.write_text(0, 115, "Багийн даргад зориулсан танилцуулга",
               size=20, bold=True, color=WHITE, align='C', max_w=PAGE_W)
pdf.write_text(0, 135, "«Малчны өглөөний дэвтэр, өдрийн зөвлөх, оройн тооцоо»",
               size=14, color=CREAM, align='C', max_w=PAGE_W)

# Доод алтан тууз
pdf.rect_fill(0, 185, PAGE_W, 15, GOLD)
pdf.write_text(0, 191, "Хөдөө сум, баг, малчид — нэг утсан дээр",
               size=12, bold=True, color=GREEN_DARK, align='C', max_w=PAGE_W)


# ============================================================
# СЛАЙД 2 — ЭНЭ АПП ГЭЖ ЮУ ВЭ?
# ============================================================
pdf.add_page()
page_bg()
header_bar("1. ЭНЭ АПП ГЭЖ ЮУ ВЭ?",
           "Богино үгээр: «Өглөө бүр нээдэг малчны дэвтэр»")

pdf.write_text(10, 30, "Малчин хүн утсаа авмагц өнөөдрийн бүх мэдээллээ "
               "нэг дороос харна:", size=13, color=BLACK)

items = [
    "Малын тоо толгой, бэлчээр, өвөлжөө хаваржаа",
    "Цаг агаар, зуд, цасны мэдээ — өөрийн нутгаар",
    "Сум, багийн зарлал — алгасахгүй",
    "Алдсан мал, олдсон малыг 2 минутад зарлах",
    "Өвс тэжээл, унаа тээвэр, ажиллах хүчний зар",
    "Малын эмчтэй уулзах цаг захиалах",
    "Ахмад малчдын ухаан, зөвлөгөө",
    "Орлого зарлагын богино тэмдэглэл",
]
bullet_list(15, 50, items, size=12, line_h=10)


# ============================================================
# СЛАЙД 3 — ЯАГААД МАЛЧДАД ХЭРЭГТЭЙ ВЭ
# ============================================================
pdf.add_page()
page_bg()
header_bar("2. ЯАГААД МАЛЧДАД ХЭРЭГТЭЙ ВЭ?",
           "Өнөөдөр малчин үүнийг бүгдийг тусдаа газраас хайдаг")

# Хүснэгт
headers = ["Юу хайдаг вэ", "Хаанаас хайдаг вэ", "Асуудал"]
rows = [
    ["Цаг агаар", "Зурагт, радио", "Өөрийн нутгийн биш"],
    ["Сумын мэдэгдэл", "Утсан мессеж", "Дараа алддаг"],
    ["Алдсан мал", "Айлд эргэх", "Удаан, хол хүртдэггүй"],
    ["Өвс тэжээлийн үнэ", "Сумын төв", "Хол явахаас өмнө мэдэхгүй"],
    ["Зөвлөгөө", "Ахмад айл", "Ахмад нь холдсон"],
    ["Малын тоо", "Толгойдоо", "Хэдэн жилд мартагддаг"],
]
col_w = [80, 90, 100]
left = (PAGE_W - sum(col_w)) / 2
y = 30

# Толгой
pdf.use_font(11, True)
pdf.fill(GREEN_DARK)
pdf.ink(WHITE)
x = left
for i, h in enumerate(headers):
    pdf.set_xy(x, y)
    pdf.cell(col_w[i], 10, h, align='C', fill=True, border=1)
    x += col_w[i]
y += 10

# Мөрнүүд
pdf.use_font(11, False)
for ri, row in enumerate(rows):
    bg = WHITE if ri % 2 == 0 else GREEN_LIGHT
    pdf.fill(bg)
    pdf.ink(BLACK)
    pdf.stroke(GRAY)
    x = left
    for i, val in enumerate(row):
        pdf.set_xy(x, y)
        pdf.cell(col_w[i], 9, "  " + val, fill=True, border=1)
        x += col_w[i]
    y += 9

pdf.write_text(0, y + 12, "→ Энэ апп бүгдийг нэг газар цуглуулсан. "
               "Сүлжээгүй ч ажиллана.",
               size=13, bold=True, color=GREEN_DARK, align='C',
               max_w=PAGE_W)


# ============================================================
# Helper: screen slide
# ============================================================
def screen_slide(num, title, image_name, description, advantages):
    pdf.add_page()
    page_bg()
    header_bar(f"3.{num}  {title}", "Аппын хуудас")

    # Зүүн — зураг
    add_phone_image(20, 32, 165, image_name)

    # Баруун дээд — Тайлбар
    pdf.write_text(130, 30, "Тайлбар", size=14, bold=True, color=GREEN_DARK)
    bullet_list(132, 42, description, size=10, line_h=6)

    # Баруун доод — Давуу тал
    y2 = 42 + len(description) * 6 + 12
    pdf.write_text(130, y2, "Давуу тал", size=14, bold=True, color=GOLD)
    pdf.ink(BLACK)
    for item in advantages:
        item = emoji_safe(item)
        pdf.use_font(10, False)
        pdf.set_xy(132, y2 + 10)
        pdf.multi_cell(155, 6, "v  " + item, align='L')
        y2 = pdf.get_y() + 1


# ============================================================
# СЛАЙД 4-5 — Нэвтрэх + Бүртгэл
# ============================================================
screen_slide("1. НЭВТРЭХ", "Утасны дугаараар нэвтрэх", "01-phone.png",
             [
                 "Зөвхөн утасны дугаараа бичнэ",
                 "Мессежээр нууц код ирнэ",
                 "Кодоо бичээд орно",
                 "Имэйл, нууц үг шаардлагагүй",
             ],
             [
                 "Хөгшин малчин ч ойлгож, өөрөө бүртгүүлж чадна",
                 "Имэйл бий болгох шаардлагагүй",
             ])

screen_slide("2. ӨӨРИЙГӨӨ ТАНИУЛАХ", "10 алхамт нэг удаагийн бүртгэл",
             "02-role.png",
             [
                 "Овог, нэр",
                 "Аймаг, сум, баг",
                 "Та хэн бэ?",
                 "4 улирлын байршил",
                 "Одоо хаана байгаа",
                 "Оторлох боломжтой газар",
                 "Малын тоо толгой",
             ],
             [
                 "Нэг л удаа бөглөнө",
                 "Апп өөрөө таны нутаг, малыг таниад мэдээлэл өгнө",
             ])


# ============================================================
# СЛАЙД 6 — НҮҮР ХУУДАС (тусгай: 9 карт)
# ============================================================
pdf.add_page()
page_bg()
header_bar("3.3  НҮҮР ХУУДАС — «ӨНӨӨДӨР»",
           "Өглөө апп нээмэгц гарах 9 карт")

# Зүүн — зураг
add_phone_image(15, 30, 170, "03-home.png")

# Баруун — 9 картын layout (3x3 grid)
cards = [
    ("Цаг агаар", "Өнөөдрийн", "Өвөлжөөны байршлаар"),
    ("Эрсдэл", "Өнөөдрийн", "Салхи, цас, зуд"),
    ("3 ажил", "Өнөөдөр хийх", "Ус, түлш, эрүүл мэнд"),
    ("Зөвлөгөө", "Нүүх/оторлох", "Өвс хүрэхгүй бол хаашаа"),
    ("Эрүүл мэнд", "Малын дохио", "Шүлхий, таршаа"),
    ("Мэдэгдэл", "Сумын", "Багийн дарга юу мэдэгдсэн"),
    ("Ахмад", "Зөвлөгөө", "Өдөрт нэг сургаалт үг"),
    ("Үнэ", "Зах зээл", "Өвс, мах, ноос"),
    ("Зар", "Ойролцоох", "Унаа, ажиллах хүн"),
]

cx0 = 115
cy0 = 30
cw = 56
ch = 50
gap = 4

for i, (title, sub, desc) in enumerate(cards):
    col = i % 3
    row = i // 3
    cx = cx0 + col * (cw + gap)
    cy = cy0 + row * (ch + gap)
    pdf.round_rect(cx, cy, cw, ch, 2, fill=WHITE, stroke=GREEN_MID,
                   stroke_w=0.5)
    pdf.write_text(cx + 3, cy + 3, sub, size=8, color=GRAY)
    pdf.write_text(cx + 3, cy + 12, title, size=13, bold=True,
                   color=GREEN_DARK)
    # multi-line жижиг тайлбар
    pdf.use_font(8, False)
    pdf.ink(GRAY)
    pdf.set_xy(cx + 3, cy + 25)
    pdf.multi_cell(cw - 6, 4, desc, align='L')


# ============================================================
# СЛАЙД 7-15 — Үлдсэн screen slides
# ============================================================
screen_slide("4. МАЛ БҮРТГЭЛ",
             "5 төрлийн мал — адуу, үхэр, хонь, ямаа, тэмээ",
             "04-livestock.png",
             [
                 "5 төрлийн малыг тус тусад нь бүртгэнэ",
                 "Нэмэх, хасах товч энгийн",
                 "Төл гарах, хорогдох, худалдсан, авсан",
                 "Жилийн эцсийн тооллогод бэлэн",
             ],
             [
                 "«Хэдэн толгой малтай вэ?» — 3 секундэд хариулна",
                 "Толгойдоо барих шаардлагагүй",
             ])

screen_slide("5. БЭЛЧЭЭР, ГАЗРЫН ЗУРАГ",
             "4 улирлын бууц + одоогийн байршил",
             "05-pasture.png",
             [
                 "4 улирлын өөрийн бууцыг тэмдэглэнэ",
                 "Одоогийн байршил газрын зурагт",
                 "Оторлох боломжтой газар нэмэх",
             ],
             [
                 "Яг газрыг бусдад харуулахгүй",
                 "Зөвхөн «энэ багт» түвшинд",
             ])

screen_slide("6. ЗӨВЛӨГӨӨ — УХААЛАГ ТУСЛАХ",
             "Малчны асуултанд богино, тодорхой хариу",
             "06-advisory.png",
             [
                 "«Хонь толгой эргэвэл яах вэ?»",
                 "«Зуд болох гэж байна, хаашаа нүүх вэ?»",
                 "Хариу: одоо юу хийх → яагаад → 3-7 алхам",
                 "Анхаарах, эрсдэл, хэнд мэдэгдэх",
             ],
             [
                 "Урт өгүүлэл биш — богино тодорхой",
                 "Шууд хэрэгцээтэй формат",
             ])

screen_slide("7. АХМАДЫН УХААН",
             "Ахмад малчдын дуу хоолой, видео, зураг",
             "07-elder.png",
             [
                 "Ахмадын дуу, видео, зураг",
                 "«Зуны бэлчээр», «Тулга бариулах»",
                 "Хөгшин хүмүүс өөрсдөө оруулна",
             ],
             [
                 "Хуучин ёс, малын ухаан залуу үед дамжина",
                 "Ахмадууд хүндлэгдэж байна гэдгээ мэдэрнэ",
             ])

screen_slide("8. АЛДСАН / ОЛДСОН МАЛ",
             "2 минутад зарлах тусгай хуудас",
             "08-lost-found.png",
             [
                 "АЛДСАН: зураг → им тамга → багт мэдэгдэх",
                 "ОЛДСОН: зураг → нутгийн зар → эзэнтэй",
             ],
             [
                 "Сум сум руу яриулж байсан зүйл 2 минутад",
                 "Хол хүртэлх айлуудад нэг дор хүрнэ",
             ])

screen_slide("9. ЗАХ ЗЭЭЛ — ЗАР ЗАХИАЛГА",
             "Малчны амьдралтай холбоотой зар",
             "09-market.png",
             [
                 "Өвс тэжээл, хужир шорлог",
                 "Тээвэр, унаа",
                 "Мал зарах, авах",
                 "Ажиллах хүн, түрээс",
                 "Хоршооны бараа",
             ],
             [
                 "Хол явалгүй сум, аймгийн мэдээлэл",
                 "Үнэ ил тод, зуучлагч хэрэггүй",
             ])

screen_slide("10. МАЛ ЭМЧТЭЙ ХОЛБОГДОХ",
             "Цаг захиалах, асуулт илгээх",
             "10-vet.png",
             [
                 "Сумын мал эмчийн утас, хаяг",
                 "Цаг захиалах",
                 "Малын зураг илгээх, асуулт",
                 "Эмийн зөвлөгөө",
             ],
             [
                 "Эмч очих хүртэл хүлээх биш",
                 "Апп дотроос шууд ярина",
             ])

screen_slide("11. СУМ, БАГИЙН МЭДЭГДЭЛ",
             "Зарлал, тарилгын хуваарь, хурал",
             "11-news.png",
             [
                 "Сумын засаг даргын зарлал",
                 "Багийн даргын мэдэгдэл",
                 "Тооллого, тарилгын хуваарь",
                 "Хурал, цуглааны мэдэгдэл",
             ],
             [
                 "«Сонссонгүй, мэдсэнгүй» гэх асуудал тэглэдэг",
                 "Хэн уншсан, хэн уншаагүй харагдана",
             ])

screen_slide("12. ӨРХ, САНХҮҮ",
             "Орлого зарлага, өрхийн гишүүд",
             "12-household.png",
             [
                 "Өрхийн гишүүд",
                 "Орлого, зарлагын тэмдэглэл",
                 "ЭМД, НДШ-ийн мэдээлэл",
                 "Хүүхдийн сургуулийн дэмжлэг",
             ],
             [
                 "Орлого зарлагаа толгойдоо барилгүй",
                 "Жилийн тооцоо хийхэд хялбар",
             ])


# ============================================================
# СЛАЙД 16 — Багц, төлбөр (5 plan)
# ============================================================
pdf.add_page()
page_bg()
header_bar("3.13  ПРОФАЙЛ, БАГЦ, ТӨЛБӨР",
           "5 багц — үнэгүйгээр эхэлж болно")

packages = [
    ("ҮНЭГҮЙ", "Хэн ч", "Үндсэн боломжууд", GREEN_MID),
    ("ПРЕМИУМ\nМАЛЧИН", "Малчин өөрөө", "Гүн зөвлөгөө,\nанхааруулга", GOLD),
    ("ХОРШООНЫ\nБАГЦ", "Хоршоо", "Олон гишүүн", GREEN_DARK),
    ("СУМЫН БАГЦ", "Сумын засаг", "Бүх малчдыг\nхарах самбар", GREEN_DARK),
    ("ҮЙЛЧИЛГЭЭ", "Мал эмч,\nтээвэр", "Зар, цаг захиалга", GOLD),
]

card_w = 50
card_h = 90
gap = 6
total_w = len(packages) * card_w + (len(packages) - 1) * gap
left_x = (PAGE_W - total_w) / 2
top_y = 35

for i, (name, who, what, color) in enumerate(packages):
    cx = left_x + i * (card_w + gap)
    pdf.round_rect(cx, top_y, card_w, card_h, 3, fill=WHITE, stroke=color,
                   stroke_w=1)
    # Дээд гарчиг
    pdf.rect_fill(cx, top_y, card_w, 18, color)
    pdf.use_font(10, True)
    pdf.ink(WHITE)
    pdf.set_xy(cx, top_y + 3)
    pdf.multi_cell(card_w, 5, name, align='C')
    # Биеийн текст
    pdf.use_font(8, False)
    pdf.ink(GRAY)
    pdf.set_xy(cx, top_y + 24)
    pdf.cell(card_w, 5, "Хэн авах:", align='C')
    pdf.use_font(10, True)
    pdf.ink(BLACK)
    pdf.set_xy(cx, top_y + 32)
    pdf.multi_cell(card_w, 5, who, align='C')
    pdf.use_font(8, False)
    pdf.ink(GRAY)
    pdf.set_xy(cx, top_y + 50)
    pdf.cell(card_w, 5, "Юу багтсан:", align='C')
    pdf.use_font(9, False)
    pdf.ink(BLACK)
    pdf.set_xy(cx, top_y + 58)
    pdf.multi_cell(card_w, 5, what, align='C')

pdf.write_text(0, top_y + card_h + 15,
               "Үнэгүй хувилбараар л өдөр тутмын ажил гүйцэт бүтнэ",
               size=14, bold=True, color=GREEN_DARK, align='C', max_w=PAGE_W)


# ============================================================
# СЛАЙД 17 — Багийн даргын тусгай самбар
# ============================================================
pdf.add_page()
page_bg()
header_bar("4. БАГИЙН ДАРГЫН ТУСГАЙ САМБАР",
           "Зөвхөн багийн даргад нээгдэх боломжууд")

# Зүүн — зураг
add_phone_image(15, 30, 165, "14-bag-dashboard.png")

# Баруун — 4 ач холбогдол
benefits = [
    ("Бүх өрхийг нэг дэлгэцэн дээр",
     "Хэдэн өрх, хэчнээн мал. Хэн нь өвөлжөө руу нүүсэн, хэн нь оторт"),
    ("Нэг товчоор бүгдэд мэдэгдэл",
     "Гарчиг, агуулга бичээд илгээх. Хэн уншсан харагдана"),
    ("Эрсдэлтэй өрхүүд тодрох",
     "Цастай нутаг, өвс хүрэхгүй, оторт яваа. Шууд утсаар"),
    ("Тайлан өөрөө гарна",
     "Сар, улирлын тайлан. Сумын засаг даргад илгээх"),
]

bx = 110
by = 30
bw = 175
bh = 38
bgap = 4

for i, (title, body) in enumerate(benefits):
    bt = by + i * (bh + bgap)
    pdf.round_rect(bx, bt, bw, bh, 2, fill=WHITE, stroke=GREEN_DARK,
                   stroke_w=0.6)
    pdf.write_text(bx + 5, bt + 5, f"{i+1}. {title}", size=12, bold=True,
                   color=GREEN_DARK)
    pdf.use_font(10, False)
    pdf.ink(BLACK)
    pdf.set_xy(bx + 5, bt + 17)
    pdf.multi_cell(bw - 10, 5, body, align='L')


# ============================================================
# СЛАЙД 18 — Давуу талуудын хураангуй (3 багана)
# ============================================================
pdf.add_page()
page_bg()
header_bar("5. ДАВУУ ТАЛУУД (ХУРААНГУЙ)",
           "Малчин, багийн дарга, сумын удирдлага — гурвуулангаа хожино")

columns = [
    ("МАЛЧДАД", GREEN_DARK, [
        "Бүх мэдээллээ нэг газраас",
        "Сүлжээгүй ч ажиллана",
        "Хол явалгүй өвсний үнэ",
        "Хөгшин ч ойлгох товч",
        "Алдсан мал 2 минутад",
        "Малын тоо хадгалагдана",
    ]),
    ("БАГИЙН ДАРГАД", GOLD, [
        "Бүх өрхөө нэг самбараас",
        "Нэг товчоор мэдэгдэл",
        "Эрсдэлтэй өрхөө хурдан",
        "Тайлан цаг алдалгүй",
    ]),
    ("СУМЫН УДИРДЛАГАД", GREEN_MID, [
        "Бүх багийн мэдээлэл",
        "Өрхүүдтэй шууд",
        "Тайлан, статистик гарт",
    ]),
]

cw3 = 88
ch3 = 145
gap3 = 6
left3 = (PAGE_W - 3 * cw3 - 2 * gap3) / 2
top3 = 30

for i, (title, color, items) in enumerate(columns):
    cx = left3 + i * (cw3 + gap3)
    # Толгой
    pdf.rect_fill(cx, top3, cw3, 14, color)
    pdf.use_font(13, True)
    pdf.ink(WHITE)
    pdf.set_xy(cx, top3 + 3)
    pdf.cell(cw3, 8, title, align='C')
    # Бие
    pdf.round_rect(cx, top3 + 14, cw3, ch3 - 14, 2, fill=WHITE,
                   stroke=color, stroke_w=0.8)
    pdf.use_font(10, False)
    pdf.ink(BLACK)
    y = top3 + 22
    for item in items:
        item = emoji_safe(item)
        pdf.set_xy(cx + 5, y)
        pdf.multi_cell(cw3 - 10, 5, "v  " + item, align='L')
        y = pdf.get_y() + 3


# ============================================================
# СЛАЙД 19 — 7 шалтгаан
# ============================================================
pdf.add_page()
page_bg()
header_bar("6. ЯАГААД ЗААВАЛ ЭНЭ АППЫГ АШИГЛАХ ВЭ?",
           "7 чухал шалтгаан")

reasons = [
    ("1", "Цаг хэмнэнэ",
     "Утсаар яриа, дэвтэр бичих, сум руу явах хугацаа богиносно"),
    ("2", "Алдагдал багасна",
     "Цаг агаар, өвчний анхааруулгыг урьдчилан мэднэ"),
    ("3", "Үнэ ил тод",
     "Зуучлагч «бага үнэлэх» эрсдэл багасна"),
    ("4", "Хүн бүр ижил мэдээлэл",
     "Багийн дарга, малчин, сумын дарга нэг тоог хардаг"),
    ("5", "Хөгшин залуу хоёр ойлгоно",
     "Хэцүү технологи биш"),
    ("6", "Хувийн нууц хадгалагдана",
     "Яг координат бусдад харагдахгүй"),
    ("7", "Үнэгүй эхэлж болно",
     "0 төгрөгөөр өдөр тутмын ажил бүтнэ"),
]

rw = 130
rh = 25
gap_x = 8
gap_y = 4
left5 = (PAGE_W - 2 * rw - gap_x) / 2
top5 = 30

for i, (num, title, body) in enumerate(reasons):
    col = i % 2
    row = i // 2
    rx = left5 + col * (rw + gap_x)
    ry = top5 + row * (rh + gap_y)
    pdf.round_rect(rx, ry, rw, rh, 2, fill=WHITE, stroke=GOLD, stroke_w=0.8)
    # Тоо тойрог
    pdf.fill(GOLD)
    pdf.ellipse(rx + 4, ry + 5, 15, 15, style='F')
    pdf.use_font(13, True)
    pdf.ink(WHITE)
    pdf.set_xy(rx + 4, ry + 7)
    pdf.cell(15, 12, num, align='C')
    # Текст
    pdf.write_text(rx + 22, ry + 4, title, size=12, bold=True,
                   color=GREEN_DARK)
    pdf.use_font(9, False)
    pdf.ink(BLACK)
    pdf.set_xy(rx + 22, ry + 13)
    pdf.multi_cell(rw - 24, 4.5, body, align='L')


# ============================================================
# СЛАЙД 20 — 5 алхам
# ============================================================
pdf.add_page()
page_bg()
header_bar("7. БАГТАА ЯАЖ НЭВТРҮҮЛЭХ ВЭ?",
           "Багийн дарга та өөрөө хэрхэн эхлүүлэх")

steps = [
    ("1", "БАГИЙН ХУРАЛ",
     "Нэг утсаар үзүүлж тайлбарлах. Бүгд харж, асуухаар"),
    ("2", "ИДЭВХТЭЙ АЙЛУУД",
     "3-5 идэвхтэй малчин эхлээд туршиж үзнэ"),
    ("3", "АМЖИЛТ ҮЗҮҮЛЭХ",
     "Алдсан мал хурдан олдсон туршлагыг бусдад"),
    ("4", "ХУУЧИН АРГЫГ ҮЛДЭЭ",
     "Хуучин арга барилаа хэвээр + нэмэлт хэрэгсэл"),
    ("5", "1-2 САР",
     "Бүх айлд тарж ашиглагдана"),
]

sw = 52
sh = 130
sgap = 5
total = 5 * sw + 4 * sgap
slx_start = (PAGE_W - total) / 2
sty = 35

for i, (num, title, body) in enumerate(steps):
    sx = slx_start + i * (sw + sgap)
    pdf.round_rect(sx, sty, sw, sh, 3, fill=WHITE, stroke=GREEN_DARK,
                   stroke_w=1)
    # Дугаар тойрог
    pdf.fill(GREEN_DARK)
    pdf.ellipse(sx + sw / 2 - 12, sty + 8, 24, 24, style='F')
    pdf.use_font(20, True)
    pdf.ink(WHITE)
    pdf.set_xy(sx, sty + 13)
    pdf.cell(sw, 12, num, align='C')
    # Гарчиг
    pdf.use_font(10, True)
    pdf.ink(GREEN_DARK)
    pdf.set_xy(sx + 2, sty + 42)
    pdf.multi_cell(sw - 4, 5, title, align='C')
    # Тайлбар
    pdf.use_font(9, False)
    pdf.ink(BLACK)
    pdf.set_xy(sx + 2, sty + 65)
    pdf.multi_cell(sw - 4, 5, body, align='C')


# ============================================================
# СЛАЙД 21 — ХУРААНГУЙ / БАЯРЛАЛАА
# ============================================================
pdf.add_page()
pdf.rect_fill(0, 0, PAGE_W, PAGE_H, GREEN_DARK)

pdf.write_text(0, 18, "МАЛЧИН АПП", size=32, bold=True, color=GOLD,
               align='C', max_w=PAGE_W)

# Том quote box
pdf.round_rect(20, 50, PAGE_W - 40, 50, 4, fill=CREAM, stroke=GOLD,
               stroke_w=1.2)
pdf.write_text(0, 65, "«Малчны өглөөний дэвтэр,",
               size=20, bold=True, color=GREEN_DARK, align='C', max_w=PAGE_W)
pdf.write_text(0, 80, "өдрийн зөвлөх, оройн тооцоо",
               size=20, bold=True, color=GREEN_DARK, align='C', max_w=PAGE_W)
pdf.write_text(0, 95, "— нэг утсан дээр»",
               size=20, bold=True, color=GREEN_DARK, align='C', max_w=PAGE_W)

# Багийн даргын ач тус
benefits_final = [
    "*  Багийн БҮХ ӨРХТЭЙ холбогдсон хэвээр",
    "*  Тайлан илгээх ажил ХӨНГӨВЧЛӨНӨ",
    "*  Эрсдэл ирэхэд ЦАГ АЛДАЛГҮЙ сэрэмжлүүлнэ",
    "*  Сумын удирдлагатай БЭЛЭН МЭДЭЭЛЛЭЭР",
]

for i, item in enumerate(benefits_final):
    pdf.write_text(40, 115 + i * 12, item, size=13, bold=True, color=WHITE)

pdf.write_text(0, 195, "БАЯРЛАЛАА  *  АСУУЛТ БАЙВАЛ АПП ДОТРООС "
               "«ТУСЛАМЖ» ХЭСГИЙГ ҮЗНЭ ҮҮ",
               size=10, bold=True, color=GOLD, align='C', max_w=PAGE_W)


# ============================================================
# Хадгалах
# ============================================================
pdf.output(OUT)
print(f"OK saved: {OUT}")
print(f"   Pages: {pdf.pages_count}")
print(f"   Size: {os.path.getsize(OUT) / 1024:.1f} KB")

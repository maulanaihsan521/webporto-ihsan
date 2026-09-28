# -*- coding: utf-8 -*-
"""Generator PDF: Laporan Audit ISO/IEC 25010 - 27001 - 23026.

Pipeline (briefs/report.md):
  body (ReportLab TocDocTemplate + multiBuild)  ->  merge cover (html2poster) via pypdf.

Numbering plan (Step 3.5 - wajib sebelum kode):
  | Outline | Type    | Chapter | Judul                                        |
  |    1    | cover   |   -     | Cover (Playwright, halaman terpisah)          |
  |    2    | toc     |   -     | Daftar Isi (roman i)                          |
  |    3    | content | Bab 1   | Ringkasan Eksekutif                            |
  |    4    | content | Bab 2   | Ruang Lingkup, Objek Audit, dan Metodologi     |
  |    5    | content | Bab 3   | ISO/IEC 25010                                  |
  |    6    | content | Bab 4   | ISO/IEC 27001                                  |
  |    7    | content | Bab 5   | ISO/IEC/IEEE 23026                             |
  |    8    | content | Bab 6   | Temuan Utama dan Tindakan Remediasi            |
  |    9    | content | Bab 7   | Rekomendasi dan Rencana Tindak Lanjut          |
  Body arabic reset ke 1 pada halaman pertama Bab 1.
"""
import hashlib
import os
import sys

PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
_scripts = os.path.join(PDF_SKILL_DIR, "scripts")
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)
sys.path.insert(0, "/home/z/my-project/scripts")

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    CondPageBreak, HRFlowable, KeepTogether, PageBreak, Paragraph,
    SimpleDocTemplate, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

from iso_report_content import BLOCKS

# ------------------------------------------------------------------
# Fonts (hanya font terdaftar yang diizinkan briefs/report.md)
# ------------------------------------------------------------------
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")
registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")

from pdf import install_font_fallback  # noqa: E402
install_font_fallback()

# ------------------------------------------------------------------
# Cascade palette (auto-generated, seed 42 - TIDAK boleh hardcode lain)
# ------------------------------------------------------------------
PAGE_BG      = colors.HexColor("#f4f5f5")
SECTION_BG   = colors.HexColor("#f0f1f2")
CARD_BG      = colors.HexColor("#e8eaeb")
TABLE_STRIPE = colors.HexColor("#ebeded")
HEADER_FILL  = colors.HexColor("#32454e")
COVER_BLOCK  = colors.HexColor("#566a74")
BORDER       = colors.HexColor("#acbdc5")
ICON         = colors.HexColor("#4b86a4")
ACCENT       = colors.HexColor("#1f6c92")
ACCENT_2     = colors.HexColor("#c23a50")
TEXT_PRIMARY = colors.HexColor("#131515")
TEXT_MUTED   = colors.HexColor("#747b7e")
SEM_SUCCESS  = colors.HexColor("#529067")

# ------------------------------------------------------------------
# Layout constants
# ------------------------------------------------------------------
MARGIN = 2.0 * cm
PAGE_W, PAGE_H = A4
AVAIL_W = PAGE_W - 2 * MARGIN
AVAIL_H = PAGE_H - 2 * MARGIN
H1_ORPHAN_THRESHOLD = AVAIL_H * 0.25
MAX_KEEP_HEIGHT = PAGE_H * 0.4

DOC_TITLE = "Laporan Audit & Kepatuhan Standar Internasional"
DOC_AUTHOR = "Maulana Ihsan Rohim"
OUT_BODY = "/home/z/my-project/scripts/iso-report-body.pdf"

# ------------------------------------------------------------------
# Styles
# ------------------------------------------------------------------
S_H1 = ParagraphStyle("H1", fontName="FreeSerif", fontSize=19, leading=25,
                      textColor=HEADER_FILL, spaceBefore=18, spaceAfter=4)
S_H2 = ParagraphStyle("H2", fontName="FreeSerif", fontSize=14, leading=20,
                      textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=6)
S_BODY = ParagraphStyle("Body", fontName="FreeSerif", fontSize=10.5, leading=17,
                        textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
                        spaceBefore=0, spaceAfter=10)
S_TOC_TITLE = ParagraphStyle("TocTitle", fontName="FreeSerif", fontSize=20, leading=26,
                             textColor=HEADER_FILL, spaceAfter=14)
S_TH = ParagraphStyle("TH", fontName="FreeSerif", fontSize=9.5, leading=13,
                      textColor=colors.white, alignment=TA_CENTER)
S_TD = ParagraphStyle("TD", fontName="FreeSerif", fontSize=9.5, leading=13,
                      textColor=TEXT_PRIMARY, alignment=TA_LEFT)
S_TD_C = ParagraphStyle("TDC", parent=S_TD, alignment=TA_CENTER)
S_CAPTION = ParagraphStyle("Caption", fontName="FreeSerif", fontSize=8.5, leading=12,
                           textColor=TEXT_MUTED, alignment=TA_CENTER,
                           spaceBefore=3, spaceAfter=6)
S_STAT = ParagraphStyle("Stat", fontName="FreeSerif", fontSize=17, leading=21,
                       textColor=ACCENT, alignment=TA_CENTER)
S_STAT_LBL = ParagraphStyle("StatLbl", fontName="FreeSerif", fontSize=8, leading=11,
                            textColor=TEXT_MUTED, alignment=TA_CENTER)
S_TOC_L0 = ParagraphStyle("TOC0", fontName="FreeSerif", fontSize=11, leading=18,
                          leftIndent=0, textColor=TEXT_PRIMARY)
S_TOC_L1 = ParagraphStyle("TOC1", fontName="FreeSerif", fontSize=10, leading=16,
                          leftIndent=18, textColor=TEXT_MUTED)


# ------------------------------------------------------------------
# Doc template with TOC support
# ------------------------------------------------------------------
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, "bookmark_name"):
            level = getattr(flowable, "bookmark_level", 0)
            text = getattr(flowable, "bookmark_text", "")
            key = getattr(flowable, "bookmark_key", "")
            # Nomor TOC = nomor footer yang tampil (body arabic reset: halaman
            # body-PDF 1 = TOC "i", halaman body-PDF N tampil sebagai N-1).
            self.notify("TOCEntry", (level, text, self.page - 1, key))


def on_page(canvas, doc):
    canvas.saveState()
    # Header: judul kiri + garis aksen
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, PAGE_H - MARGIN + 18, DOC_TITLE)
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(MARGIN, PAGE_H - MARGIN + 12, PAGE_W - MARGIN, PAGE_H - MARGIN + 12)
    # Footer: penulis kiri, nomor halaman kanan, garis tipis di atasnya
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, MARGIN - 14, PAGE_W - MARGIN, MARGIN - 14)
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, MARGIN - 26, DOC_AUTHOR)
    page_label = "i" if doc.page == 1 else str(doc.page - 1)
    canvas.drawRightString(PAGE_W - MARGIN, MARGIN - 26, page_label)
    canvas.restoreState()


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def add_heading(text, style, level=0):
    key = "h_%s" % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


def safe_keep_together(elements):
    total_h = 0
    for el in elements:
        w, h = el.wrap(AVAIL_W, PAGE_H)
        total_h += h
    if total_h <= MAX_KEEP_HEIGHT:
        return [KeepTogether(elements)]
    if len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)


def build_table(spec):
    headers = spec["headers"]
    rows = spec["rows"]
    ratios = spec["ratios"]
    col_widths = [r * AVAIL_W for r in ratios]
    assert sum(col_widths) <= AVAIL_W + 0.5, "table overflow"
    data = [[Paragraph("<b>%s</b>" % h, S_TH) for h in headers]]
    n_cols = len(headers)
    for row in rows:
        cells = []
        for i, cell in enumerate(row):
            st = S_TD_C if (n_cols >= 4 and i >= n_cols - 1) else S_TD
            cells.append(Paragraph(cell, st))
        data.append(cells)
    tbl = Table(data, colWidths=col_widths, hAlign="CENTER", repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for r in range(1, len(data)):
        style_cmds.append(
            ("BACKGROUND", (0, r), (-1, r),
             TABLE_STRIPE if r % 2 == 1 else colors.white))
    tbl.setStyle(TableStyle(style_cmds))
    out = [Spacer(1, 8), tbl]
    if spec.get("title"):
        out += [Spacer(1, 4), Paragraph(spec["title"], S_CAPTION)]
    out += [Spacer(1, 8)]
    return out


def build_callouts(items):
    gap = 8
    box_w = (AVAIL_W - gap * (len(items) - 1)) / len(items)
    cells = []
    for stat, label in items:
        cells.append([Paragraph("<b>%s</b>" % stat, S_STAT), Spacer(1, 3),
                      Paragraph(label, S_STAT_LBL)])
    row = []
    widths = []
    for i, c in enumerate(cells):
        row.append(c)
        widths.append(box_w)
    tbl = Table([row], colWidths=widths, hAlign="CENTER")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(len(items)):
        cmds.append(("BACKGROUND", (i, 0), (i, 0), CARD_BG))
        cmds.append(("BOX", (i, 0), (i, 0), 0.8, ACCENT))
    tbl.setStyle(TableStyle(cmds))
    return [Spacer(1, 6), KeepTogether(tbl), Spacer(1, 12)]


# ------------------------------------------------------------------
# Story
# ------------------------------------------------------------------
story = []

# --- Daftar Isi (halaman i) ---
story.append(Paragraph("<b>Daftar Isi</b>", S_TOC_TITLE))
story.append(HRFlowable(width="100%", color=ACCENT, thickness=1.2,
                        spaceBefore=0, spaceAfter=14))
toc = TableOfContents()
toc.levelStyles = [S_TOC_L0, S_TOC_L1]
story.append(toc)
story.append(PageBreak())

# --- Isi bab ---
pending_h1 = None
pending_h2 = None
for kind, payload in BLOCKS:
    if kind == "h1":
        story.append(CondPageBreak(H1_ORPHAN_THRESHOLD))
        h = add_heading(payload, S_H1, level=0)
        rule = HRFlowable(width="100%", color=ACCENT, thickness=1.5,
                          spaceBefore=0, spaceAfter=10)
        pending_h1 = [h, rule]
    elif kind == "h2":
        story.append(CondPageBreak(AVAIL_H * 0.12))
        pending_h2 = add_heading(payload, S_H2, level=1)
    elif kind == "body":
        p = Paragraph(payload, S_BODY)
        if pending_h1 is not None:
            story.extend(safe_keep_together(pending_h1 + [p]))
            pending_h1 = None
        elif pending_h2 is not None:
            story.extend(safe_keep_together([pending_h2, p]))
            pending_h2 = None
        else:
            story.append(p)
    elif kind == "table":
        if pending_h1 is not None:
            story.extend(safe_keep_together(pending_h1 + build_table(payload)))
            pending_h1 = None
        elif pending_h2 is not None:
            parts = build_table(payload)
            story.extend(safe_keep_together([pending_h2, parts[1]]) + parts[2:])
            pending_h2 = None
        else:
            story.extend(build_table(payload))
    elif kind == "callouts":
        if pending_h1 is not None:
            story.extend(safe_keep_together(pending_h1 + build_callouts(payload)))
            pending_h1 = None
        else:
            story.extend(build_callouts(payload))
    elif kind == "bullets":
        for item in payload:
            story.append(Paragraph("•  %s" % item,
                                   ParagraphStyle("Bl", parent=S_BODY,
                                                  leftIndent=16,
                                                  firstLineIndent=0,
                                                  spaceAfter=4)))
    if pending_h1 is not None and kind not in ("body", "table", "callouts"):
        story.extend(pending_h1)
        pending_h1 = None

doc = TocDocTemplate(
    OUT_BODY, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN, bottomMargin=MARGIN,
    title=DOC_TITLE, author=DOC_AUTHOR, creator="Z.ai",
    subject="Audit keamanan dan kepatuhan ISO/IEC 25010, ISO/IEC 27001, ISO/IEC/IEEE 23026",
)
doc.multiBuild(story, onFirstPage=on_page, onLaterPages=on_page)
print("body OK:", OUT_BODY)

# ------------------------------------------------------------------
# Merge cover + body -> final
# ------------------------------------------------------------------
from pypdf import PdfReader, PdfWriter  # noqa: E402

A4_W, A4_H = 595.28, 841.89
COVER_PDF = "/home/z/my-project/scripts/iso-cover.pdf"
FINAL_PDF = "/home/z/my-project/download/Laporan-Audit-ISO-portofoliomaulanaihsan.pdf"


def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
    return page


writer = PdfWriter()
writer.add_page(normalize_page_to_a4(PdfReader(COVER_PDF).pages[0]))
for page in PdfReader(OUT_BODY).pages:
    writer.add_page(normalize_page_to_a4(page))
writer.add_metadata({
    "/Title": DOC_TITLE,
    "/Author": DOC_AUTHOR,
    "/Creator": "Z.ai",
    "/Subject": "Audit keamanan dan kepatuhan ISO/IEC 25010, ISO/IEC 27001, ISO/IEC/IEEE 23026 atas portofoliomaulanaihsan.my.id",
})
os.makedirs(os.path.dirname(FINAL_PDF), exist_ok=True)
with open(FINAL_PDF, "wb") as f:
    writer.write(f)
print("final OK:", FINAL_PDF, "| pages:", len(writer.pages))

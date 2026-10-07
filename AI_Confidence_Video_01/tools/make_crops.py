#!/usr/bin/env python3
"""Crop real documents/photos into the Remotion public/img folder (no upscaling)."""
import os
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "source/public/img")
os.makedirs(OUT, exist_ok=True)
SCR = os.path.join(ROOT, "research/screens/paper")
AS = os.path.join(ROOT, "assets/screenshots")
K = 300 / 72  # pts -> px at 300 dpi

def crop_pts(src, name, x0, y0, x1, y1):
    im = Image.open(src).convert("RGB")
    c = im.crop((int(x0 * K), int(y0 * K), int(x1 * K), int(y1 * K)))
    c.save(os.path.join(OUT, name), optimize=True)
    print(name, c.size)

def crop_frac(src, name, x0, y0, x1, y1, max_w=None, q=None):
    im = Image.open(src).convert("RGB")
    W, H = im.size
    c = im.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)))
    if max_w and c.size[0] > max_w:
        c = c.resize((max_w, int(c.size[1] * max_w / c.size[0])), Image.LANCZOS)
    if name.endswith(".jpg"):
        c.save(os.path.join(OUT, name), quality=q or 90)
    else:
        c.save(os.path.join(OUT, name), optimize=True)
    print(name, c.size)

P = lambda n: os.path.join(SCR, f"kalai2025_v1_p{n:02d}_300dpi.png")
crop_pts(P(1), "paper_p01_header.png", 66, 100, 546, 206)
crop_pts(P(2), "paper_p02_table1.png", 70, 63, 542, 181)
crop_pts(P(14), "paper_p14_table2.png", 70, 66, 542, 336)
crop_pts(P(13), "paper_p13_instruction.png", 84, 609, 528, 650)
crop_pts(P(19), "paper_p19_kalai2001.png", 66, 644, 546, 684)
crop_pts(os.path.join(AS, "kalai2025_v1_p03-03.png"), "paper_p03_fig1.png", 70, 76, 548, 190)
crop_pts(os.path.join(AS, "kalai2025_v1_p10.png"), "paper_p10_einstein.png", 66, 99.6, 546, 141.5)
crop_frac(os.path.join(AS, "kalai2001_thesis_titlepage.png"), "thesis_titlepage_top.png", 0.10, 0.14, 0.90, 0.73)
crop_frac(os.path.join(AS, "kalai2001_thesis_titlepage.png"), "thesis_titlepage_full.png", 0.0, 0.0, 1.0, 1.0)
IMG = os.path.join(ROOT, "assets/images")
crop_frac(os.path.join(IMG, "library_stacks_smithsonian_castle_c1912_sia.jpg"), "photo_library_stacks_1912.jpg", 0.03, 0.04, 0.97, 0.96, max_w=3840)
crop_frac(os.path.join(IMG, "library_usnm_library_librarian_at_desk_1880s_sia.jpg"), "photo_library_1880s.jpg", 0.04, 0.04, 0.96, 0.96, max_w=3840)
crop_frac(os.path.join(IMG, "test_workbook_sharps_language_drills_and_tests_1929_nmaahc.jpg"), "photo_test_booklet_1929_title.jpg", 0.0, 0.05, 1.0, 0.43, max_w=3840)
AN = os.path.join(ROOT, "research/screens/anthropic")
crop_frac(os.path.join(AN, "screen_02_header_title_date_clip.png"), "anthropic_header.png", 0.0, 0.0, 1.0, 1.0)
crop_frac(os.path.join(AN, "fig_07_hallucination_known_vs_unknown_entity.png"), "anthropic_fig7.png", 0.0, 0.0, 1.0, 1.0)
crop_pts(P(1), "paper_p01_birthday.png", 66, 527, 546, 598.6)
crop_frac(os.path.join(AS, "kalai2001_thesis_titlepage.png"), "thesis_title_block.png", 0.18, 0.185, 0.82, 0.395)

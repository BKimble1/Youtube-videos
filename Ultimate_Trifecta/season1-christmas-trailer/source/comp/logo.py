"""The season reveal (28.0-30.0 s): the official Ultimate Trifecta title
(art_src/branding/ultimate-trifecta-lobby-title.png, unchanged) slams in on
the music's hit, a light sweeps across it, the Season 1 line rises under it
with the game's own snowflake (the Season card's icon, redrawn from
Icons "snowflake"), and glints land on the final bell notes.

Logo(W, H).apply(frame_float_rgb, t) composites onto a graded frame.
"""
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
T0 = 28.0
ICE = (0x9F, 0xE3, 0xFF)
IVORY = (0xF6, 0xF1, 0xE4)
GLINTS = [(1.0, 0.205, 0.17), (1.25, 0.47, 0.13), (1.375, 0.885, 0.47), (1.5, 0.30, 0.62), (1.75, 0.965, 0.80)]


def smooth(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def snowflake(draw, c, r, col, width_k=1.0):
    """Icons "snowflake": six spokes, a pair of twigs on each, a hub."""
    cx, cy = c
    for i in range(6):
        a = -np.pi / 2 + 2 * np.pi * i / 6
        d = np.array([np.cos(a), np.sin(a)])
        p1 = (cx + d[0] * r * 0.95, cy + d[1] * r * 0.95)
        draw.line([c, p1], fill=col, width=max(2, int(r * 0.15 * width_k)))
        m = np.array([cx, cy]) + d * r * 0.58
        for s in (0.75, -0.75):
            ca, sa = np.cos(s), np.sin(s)
            dd = np.array([d[0] * ca - d[1] * sa, d[0] * sa + d[1] * ca])
            draw.line([tuple(m), tuple(m + dd * r * 0.32)], fill=col, width=max(2, int(r * 0.12 * width_k)))
    rr = r * 0.16
    draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=col)


def season_line(H):
    """'SEASON 1 · WINTER BREAK' with the snowflake, tracked out, RGBA."""
    size = int(H * 0.046)
    font = ImageFont.truetype(os.path.join(HERE, "Manrope-ExtraBold.ttf"), size)
    text = "SEASON 1 · WINTER BREAK"
    track = size * 0.16
    widths = [font.getlength(ch) for ch in text]
    tw = sum(widths) + track * (len(text) - 1)
    icon = size * 1.05
    gap = size * 0.55
    W = int(icon + gap + tw + size)
    Hh = int(size * 1.8)
    img = Image.new("RGBA", (W, Hh), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    snowflake(d, (size * 0.6, Hh / 2), icon / 2, ICE + (255,))
    x = icon + gap
    asc, desc = font.getmetrics()
    y = (Hh - (asc + desc)) / 2 + size * 0.06
    for ch, w in zip(text, widths):
        if ch == "·":
            r = size * 0.1
            cy = Hh / 2 + size * 0.02
            d.ellipse([x + w / 2 - r, cy - r, x + w / 2 + r, cy + r], fill=ICE + (255,))
        else:
            d.text((x, y), ch, font=font, fill=IVORY + (255,))
        x += w + track
    a = np.asarray(img).astype(np.float32) / 255.0
    rgb = a[..., :3] * a[..., 3:4]
    return np.concatenate([rgb, a[..., 3:4]], axis=2)


class Logo:
    def __init__(self, W, H):
        self.W, self.H = W, H
        src = Image.open(os.path.join(HERE, "ut_title.png")).convert("RGBA")
        bbox = src.getbbox()
        src = src.crop(bbox)
        lw = int(W * 0.52)
        lh = int(src.height * lw / src.width)
        src = src.resize((lw, lh), Image.LANCZOS)
        a = np.asarray(src).astype(np.float32) / 255.0
        self.logo = np.concatenate([a[..., :3] * a[..., 3:4], a[..., 3:4]], axis=2)   # premultiplied
        self.lw, self.lh = lw, lh
        self.center = (W * 0.5, H * 0.40)
        self.line = season_line(H)
        # warm glow from the logo's own alpha
        al = self.logo[..., 3]
        pad = int(lh * 0.6)
        big = np.zeros((lh + 2 * pad, lw + 2 * pad), np.float32)
        big[pad:pad + lh, pad:pad + lw] = al
        self.glow = cv2.GaussianBlur(big, (0, 0), lh * 0.12)
        self.glow_pad = pad
        # shine coordinate across the logo (diagonal)
        yy, xx = np.mgrid[0:lh, 0:lw].astype(np.float32)
        self.diag = (xx + 0.45 * (lh - yy)) / (lw + 0.45 * lh)
        yy2, xx2 = np.mgrid[0:H, 0:W].astype(np.float32)
        ex = (xx2 - self.center[0]) / (W * 0.48)
        ey = (yy2 - self.center[1] * 1.08) / (H * 0.42)
        self.vig = np.exp(-(ex * ex + ey * ey) * 1.1).astype(np.float32)[..., None]

    def _place(self, rgba, cx, cy, scale):
        """Warp a premultiplied RGBA image to the frame, centred at (cx, cy)."""
        h, w = rgba.shape[:2]
        m = np.array([[scale, 0, cx - w * scale / 2], [0, scale, cy - h * scale / 2]], np.float32)
        return cv2.warpAffine(rgba, m, (self.W, self.H), flags=cv2.INTER_LINEAR if scale != 1.0 else cv2.INTER_NEAREST,
                              borderMode=cv2.BORDER_CONSTANT, borderValue=0)

    def apply(self, y, t):
        u = t - T0
        if u < 0:
            return y
        W, H = self.W, self.H
        k = W / 3840.0
        # backdrop: a soft dark pool behind the title so it reads over the scene
        bg = 0.46 * smooth(u / 0.16)
        y = y * (1.0 - bg * self.vig)
        # impact flash
        if u < 0.14:
            y = y + 0.55 * np.exp(-u / 0.035)
        # the slam: scale with a spring settle, a quick fade-in, a decaying shake
        s = 1.0 + 0.55 * np.exp(-u * 20.0) - 0.035 * np.exp(-u * 7.0) * np.sin(u * 26.0)
        alpha = smooth(u / 0.045)
        dx = 11.0 * k * np.exp(-u * 11.0) * np.sin(u * 91.0)
        dy = 9.0 * k * np.exp(-u * 11.0) * np.cos(u * 77.0)
        cx, cy = self.center[0] + dx, self.center[1] + dy
        logo = self.logo.copy()
        # shine sweep
        if 0.3 <= u <= 0.95:
            p = -0.15 + 1.3 * smooth((u - 0.3) / 0.6)
            band = np.exp(-((self.diag - p) / 0.045) ** 2) * 0.75 + np.exp(-((self.diag - p + 0.07) / 0.02) ** 2) * 0.35
            logo[..., :3] += band[..., None] * logo[..., 3:4] * np.array([1.0, 0.97, 0.9], np.float32)
        # glints on the bell sting
        for (tg, gx, gy) in GLINTS:
            v = (u - tg) / 0.3
            if 0 <= v <= 1:
                amp = np.sin(np.pi * v) ** 1.5
                self._glint(logo, gx * self.lw, gy * self.lh, amp, k)
        # glow behind (warm)
        gl_a = (0.30 + 0.25 * np.exp(-u * 4.0)) * alpha
        g = self._place(np.repeat(self.glow[..., None], 3, axis=2), cx, cy, s)
        y = y + g * np.array([1.0, 0.72, 0.30], np.float32) * gl_a * 0.55
        # motion blur on the way in: average a few scales
        if u < 0.1:
            acc = None
            for j in range(4):
                uj = max(0.0, u - j * 0.006)
                sj = 1.0 + 0.55 * np.exp(-uj * 20.0)
                lj = self._place(logo, cx, cy, sj)
                acc = lj if acc is None else acc + lj
            L = acc / 4.0
        else:
            L = self._place(logo, cx, cy, s)
        L = L * alpha
        y = y * (1.0 - L[..., 3:4]) + L[..., :3]
        # the season line rises in under the title
        la = smooth((u - 0.32) / 0.28)
        if la > 0:
            ly = cy + self.lh * 0.5 * s + H * 0.055 + 26.0 * k * (1.0 - la)
            Ln = self._place(self.line, W * 0.5, ly, 1.0) * la
            y = y * (1.0 - Ln[..., 3:4]) + Ln[..., :3]
        return y

    def _glint(self, logo, x, y, amp, k):
        r = int(150 * k)
        x0, y0 = int(x) - r, int(y) - r
        yy, xx = np.mgrid[-r:r, -r:r].astype(np.float32) / r
        star = (np.exp(-(yy * 30) ** 2) * np.exp(-np.abs(xx) * 3.2) + np.exp(-(xx * 30) ** 2) * np.exp(-np.abs(yy) * 3.2)) * 1.2
        star += np.exp(-(xx * xx + yy * yy) * 40) * 1.0
        h, w = logo.shape[:2]
        xs0, ys0 = max(0, x0), max(0, y0)
        xs1, ys1 = min(w, x0 + 2 * r), min(h, y0 + 2 * r)
        if xs1 <= xs0 or ys1 <= ys0:
            return
        st = star[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0] * amp
        logo[ys0:ys1, xs0:xs1, :3] += st[..., None] * np.array([1.0, 0.97, 0.88], np.float32)
        logo[ys0:ys1, xs0:xs1, 3] = np.clip(logo[ys0:ys1, xs0:xs1, 3] + st * 0.9, 0, 1)

"""The logo reveal (28.0-30.0 s): the official Ultimate Trifecta title
(art_src/branding/ultimate-trifecta-lobby-title.png, the owner's supplied
graphic) lands on the music's final hit over the night campus: a short scale
settle and flash, a warm glow, one shine sweep and a single glint.  Title only:
no subtitle, no other text."""
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
T0 = 28.0
ICE = (0x9F, 0xE3, 0xFF)
IVORY = (0xF6, 0xF1, 0xE4)
GLINTS = [(1.2, 0.885, 0.47)]


def smooth(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


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
        self.center = (W * 0.5, H * 0.44)
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
        bg = 0.5 * smooth(u / 0.16)
        y = y * (1.0 - bg * self.vig)
        # impact flash
        if u < 0.14:
            y = y + 0.4 * np.exp(-u / 0.035)
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
        # one glint as the music rings out
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

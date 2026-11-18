"""The logo reveal (28.0-30.0 s): the official Ultimate Trifecta title
(art_src/branding/ultimate-trifecta-lobby-title.png, the owner's supplied
graphic) as a dimensional object over the night campus.

The flat title is given depth from its own silhouette: an extruded side
(the alpha stacked back and down, shaded darker with depth), a bevel lit from
the upper left (from the blurred alpha's gradient), a soft shadow cast onto
the scene behind it, and one specular sweep.  On the music's final hit it
settles from a slight tilt (a perspective warp) to face-on, with a small
lift in exposure rather than a flash.  Title only: no subtitle, no other text.
"""
import os

import cv2
import numpy as np
from PIL import Image

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
T0 = 28.0


def smooth(u):
    u = np.clip(u, 0.0, 1.0)
    return u * u * (3.0 - 2.0 * u)


def ease_out(u, k=3.0):
    u = np.clip(u, 0.0, 1.0)
    return 1.0 - (1.0 - u) ** k


class Logo:
    def __init__(self, W, H):
        self.W, self.H = W, H
        src = Image.open(os.path.join(HERE, "ut_title.png")).convert("RGBA")
        src = src.crop(src.getbbox())
        lw = int(W * 0.50)
        lh = int(src.height * lw / src.width)
        src = src.resize((lw, lh), Image.LANCZOS)
        a = np.asarray(src).astype(np.float32) / 255.0
        face_rgb, al = a[..., :3], a[..., 3]
        # canvas with room for the extrusion and the bevel
        pad = int(lh * 0.16)
        cw, ch = lw + 2 * pad, lh + 2 * pad
        A = np.zeros((ch, cw), np.float32)
        A[pad:pad + lh, pad:pad + lw] = al
        F = np.zeros((ch, cw, 3), np.float32)
        F[pad:pad + lh, pad:pad + lw] = face_rgb
        # bevel: light from the upper left on the blurred alpha's slope
        blur = cv2.GaussianBlur(A, (0, 0), lh * 0.012)
        gy, gx = np.gradient(blur)
        light = -(gx * -0.6 + gy * -0.8) * lh * 0.05
        bevel = np.clip(light, -1.0, 1.0)
        F = np.clip(F * (1.0 + 0.35 * bevel[..., None]) + 0.12 * np.maximum(bevel, 0)[..., None], 0, 1.4)
        # the extruded side: the silhouette stacked back and down
        depth = int(lh * 0.075)
        side_a = np.zeros_like(A)
        side_rgb = np.zeros_like(F)
        base = np.array([0.05, 0.09, 0.22], np.float32)       # deep navy, the title's own outline colour
        for k in range(depth, 0, -1):
            dx, dy = int(round(k * 0.35)), k
            sh = np.zeros_like(A)
            sh[dy:, dx:] = A[:ch - dy, :cw - dx]
            shade = 0.55 + 0.45 * (1.0 - k / depth)
            new = sh * (1.0 - side_a)
            side_rgb += new[..., None] * base * shade * 1.6
            side_a += new
        # face over side (premultiplied)
        face_pm = F * A[..., None]
        self.rgb = face_pm + side_rgb * (1.0 - A[..., None])
        self.a = np.clip(A + side_a * (1.0 - A), 0, 1)
        self.cw, self.ch, self.lw, self.lh = cw, ch, lw, lh
        self.shadow = cv2.GaussianBlur(self.a, (0, 0), lh * 0.06)
        # shine coordinate across the face (diagonal)
        yy, xx = np.mgrid[0:ch, 0:cw].astype(np.float32)
        self.diag = (xx + 0.45 * (ch - yy)) / (cw + 0.45 * ch)
        self.face_a = A
        self.center = (W * 0.5, H * 0.44)
        yy2, xx2 = np.mgrid[0:H, 0:W].astype(np.float32)
        ex = (xx2 - self.center[0]) / (W * 0.5)
        ey = (yy2 - self.center[1]) / (H * 0.45)
        self.vig = np.exp(-(ex * ex + ey * ey) * 1.0).astype(np.float32)[..., None]

    def _warp(self, img, tilt, scale, cx, cy):
        """Perspective-place a canvas-sized image: tilted back about its
        horizontal axis by `tilt` (radians), scaled, centred at (cx, cy)."""
        w, h = self.cw, self.ch
        f = w * 1.6                                # focal length (px) for the tilt
        pts = []
        for (x, y) in [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]:
            yr = y * np.cos(tilt)
            zr = y * np.sin(tilt)
            k = f / (f + zr)
            pts.append([cx + x * k * scale, cy + yr * k * scale])
        Hm = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32(pts))
        return cv2.warpPerspective(img, Hm, (self.W, self.H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)

    def apply(self, y, t):
        u = t - T0
        if u < 0:
            return y
        W, H = self.W, self.H
        # the scene settles back: a soft dark pool behind the title
        y = y * (1.0 - 0.42 * smooth(u / 0.25) * self.vig)
        # the hit: a small lift in exposure, not a flash
        if u < 0.4:
            y = y * (1.0 + 0.18 * np.exp(-u / 0.08))
        # the settle: from a slight tilt and a little large to face-on
        e = ease_out(u / 0.55, 3.2)
        tilt = np.radians(16.0) * (1.0 - e)
        scale = 1.0 + 0.10 * (1.0 - e)
        alpha = smooth(u / 0.08)
        cx, cy = self.center[0], self.center[1] + H * 0.02 * (1.0 - e)
        rgb = self.rgb.copy()
        # one specular sweep across the face
        if 0.35 <= u <= 1.15:
            p = -0.1 + 1.2 * smooth((u - 0.35) / 0.8)
            band = np.exp(-((self.diag - p) / 0.05) ** 2) * 0.55
            rgb += (band * self.face_a)[..., None] * np.array([1.0, 0.97, 0.9], np.float32)
        # the shadow it casts on the scene (down and right, soft)
        sh = self._warp(self.shadow, tilt, scale, cx + W * 0.008, cy + H * 0.03)
        y = y * (1.0 - 0.45 * alpha * sh[..., None])
        # the title
        L = self._warp(np.dstack([rgb, self.a]), tilt, scale, cx, cy) * alpha
        y = y * (1.0 - L[..., 3:4]) + L[..., :3]
        return y

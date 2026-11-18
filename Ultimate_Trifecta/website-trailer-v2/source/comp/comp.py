"""Assembles the Ultimate Trifecta website trailer (V2) from the in-engine shot renders.

    python3 comp.py --edl edl.json --shots SHOT_DIR --out OUT.mp4 [--audio MIX.wav]
                    [--w 3840 --h 2160 --fps 60] [--from T --to T] [--stills DIR --still-times a,b,c]

Per output frame: the shot on the timeline (EDL), straight cuts (the TRANS
table is kept for optional transitions and is empty in V2), the grade
(contrast curve, cool shadows, warm highlights, saturation), two-scale bloom,
vignette and grain, and over 28-30 s the logo reveal (logo.py).  Frames are piped to ffmpeg (x264, BT.709).
"""
import argparse
import json
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import logo as logo_mod  # noqa: E402

# transitions at each cut (by the incoming clip's name)
TRANS = {
    # V2 cuts are straight cuts on action and on the beat: no whip-pan blur
}
# the designed flashlight-into-the-lens moment: the only shot with the post flare
FLARE_SHOTS = set()
# per-shot exposure trims (stops)
EXPO = {"w12_wardrobe": -0.08, "w13_party": -0.08, "w18_logo": -0.2}


class Clip:
    def __init__(self, path, w, h):
        self.path = path
        self.w, self.h = w, h
        self.proc = None
        self.last = None

    def open(self, skip=0):
        if not os.path.exists(self.path):
            self.proc = None
            self.last = np.zeros((self.h, self.w, 3), np.uint8)
            self.missing = True
            return
        self.missing = False
        vf = f"scale={self.w}:{self.h}:flags=lanczos" + (f",select=gte(n\\,{skip})" if skip else "")
        self.proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", self.path, "-vf", vf, "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                     stdout=subprocess.PIPE, bufsize=self.w * self.h * 3 * 2)

    def read(self):
        if getattr(self, "missing", False):
            return self.last
        if self.proc is None:
            self.open()
        buf = self.proc.stdout.read(self.w * self.h * 3)
        if len(buf) < self.w * self.h * 3:
            return self.last if self.last is not None else np.zeros((self.h, self.w, 3), np.uint8)
        self.last = np.frombuffer(buf, np.uint8).reshape(self.h, self.w, 3)
        return self.last

    def close(self):
        if self.proc:
            self.proc.stdout.close()
            self.proc.kill()
            self.proc = None


def smooth(u):
    u = np.clip(u, 0.0, 1.0)
    return u * u * (3 - 2 * u)


def build_lut():
    """Per-channel 8-bit curves: lift/gamma/gain with a gentle S, cool shadows, warm highlights."""
    x = np.linspace(0, 1, 256)
    s = x + 0.10 * (x - 0.5) * (1 - np.abs(2 * x - 1)) * 2.0       # S-curve
    s = np.clip(s, 0, 1)
    lut = np.zeros((256, 3), np.float32)
    lift = np.array([0.006, 0.012, 0.03])      # night blue in the blacks
    gain = np.array([1.035, 1.0, 0.975])       # warm top end
    gamma = np.array([1.02, 1.0, 0.97])
    for c in range(3):
        y = lift[c] + (1 - lift[c]) * np.power(s, gamma[c])
        y = y * (1 + (gain[c] - 1) * x)
        lut[:, c] = np.clip(y, 0, 1)
    return lut


class Look:
    def __init__(self, w, h, seed=7):
        self.w, self.h = w, h
        self.lut = build_lut()
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
        self.vig = (1.0 - 0.30 * np.power(r, 2.4)).astype(np.float32)[..., None]
        rng = np.random.default_rng(seed)
        gh, gw = h // 2, w // 2
        self.grain = [cv2.resize(rng.standard_normal((gh, gw)).astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR) for _ in range(4)]

    def apply(self, img_u8, fi, expo=0.0, bloom=1.0):
        x = img_u8.astype(np.float32) * (1.0 / 255.0)
        if expo:
            x *= 2.0 ** expo
        # bloom (two scales) from the bright parts
        sw, sh = self.w // 4, self.h // 4
        small = cv2.resize(x, (sw, sh), interpolation=cv2.INTER_AREA)
        lum = (small @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
        bright = small * np.clip((lum - 0.84) / 0.16, 0, 1) ** 1.5
        b1 = cv2.GaussianBlur(bright, (0, 0), sw * 0.006)
        b2 = cv2.GaussianBlur(bright, (0, 0), sw * 0.025)
        bl = cv2.resize(b1 * 0.55 + b2 * 0.45, (self.w, self.h), interpolation=cv2.INTER_LINEAR)
        x = x + bl * 0.30 * bloom
        # tone curve via LUT
        q = np.clip(x * 255.0, 0, 255).astype(np.uint8)
        y = np.empty_like(x)
        for c in range(3):
            y[..., c] = self.lut[:, c][q[..., c]]
        # saturation
        l = y @ np.array([0.2126, 0.7152, 0.0722], np.float32)
        y = l[..., None] + (y - l[..., None]) * 1.08
        y *= self.vig
        g = self.grain[fi % 4]
        y += (g * (0.010 * (1.0 - np.abs(2.0 * l - 1.0)) + 0.002))[..., None]
        return y


def whip(img, amt, direction, w):
    """Horizontal motion blur + travel for a whip pan (amt 0..1)."""
    if amt <= 0.001:
        return img
    k = int(max(3, amt * w * 0.16)) | 1
    shift = int(direction * amt * w * 0.07)
    out = cv2.blur(img, (k, 1))
    if shift:
        out = np.roll(out, shift, axis=1)
    return out


def punch(img, amt, w, h):
    if amt <= 0.001:
        return img
    s = 1.0 + 0.075 * amt
    m = cv2.getRotationMatrix2D((w / 2, h / 2), 0, s)
    return cv2.warpAffine(img, m, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def flare(img, cx, cy, strength, w, h, cache):
    """Lens flare for the flashlight swinging into the lens: veil, glow, an
    anamorphic streak and two ghosts mirrored through the centre."""
    if strength <= 0.01:
        return img
    key = "flare"
    if key not in cache:
        size = int(h * 1.6)
        yy, xx = np.mgrid[-size:size, -size:size].astype(np.float32) / size
        r = np.sqrt(xx * xx + yy * yy)
        glow = np.exp(-r * r * 9.0)[..., None] * np.array([1.0, 0.94, 0.82], np.float32)
        streak = (np.exp(-(yy * 28.0) ** 2) * np.exp(-np.abs(xx) * 1.6))[..., None] * np.array([0.75, 0.88, 1.0], np.float32)
        cache[key] = (glow, streak, size)
        g = np.exp(-((r - 0.08) / 0.03) ** 2) * 0.5 + np.exp(-(r / 0.06) ** 2) * 0.3
        cache["ghost"] = g[..., None] * np.array([0.55, 0.85, 1.0], np.float32)
    glow, streak, size = cache[key]
    out = img.copy()

    def add(layer, px, py, a):
        x0, y0 = int(px - size), int(py - size)
        xs0, ys0 = max(0, x0), max(0, y0)
        xs1, ys1 = min(w, x0 + 2 * size), min(h, y0 + 2 * size)
        if xs1 <= xs0 or ys1 <= ys0:
            return
        out[ys0:ys1, xs0:xs1] += layer[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0] * a

    add(glow, cx, cy, 0.9 * strength)
    add(streak, cx, cy, 0.8 * strength)
    for k, a in ((-0.55, 0.35), (-1.1, 0.22)):
        gx = w / 2 + (cx - w / 2) * k
        gy = h / 2 + (cy - h / 2) * k
        add(cache["ghost"], gx, gy, a * strength)
    out += strength * 0.18 * np.array([1.0, 0.95, 0.85], np.float32)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--edl", required=True)
    ap.add_argument("--shots", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--audio")
    ap.add_argument("--w", type=int, default=3840)
    ap.add_argument("--h", type=int, default=2160)
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--from", dest="t0", type=float, default=0.0)
    ap.add_argument("--to", dest="t1", type=float, default=None)
    ap.add_argument("--crf", type=int, default=14)
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--stills")
    ap.add_argument("--still-times", default="")
    a = ap.parse_args()
    edl = json.load(open(a.edl))
    W, H, F = a.w, a.h, a.fps
    total = int(round(edl["dur"] * F))
    f0 = int(round(a.t0 * F))
    f1 = total if a.t1 is None else int(round(a.t1 * F))
    clips = []
    for name, at, dur in edl["clips"]:
        s = int(round(at * F))
        n = int(round(dur * F))
        ev = {}
        evp = os.path.join(a.shots, f"{name}.events.json")
        if os.path.exists(evp):
            ev = json.load(open(evp))
        clips.append({"name": name, "s": s, "n": n, "clip": Clip(os.path.join(a.shots, f"{name}.mp4"), W, H), "ev": ev})
    look = Look(W, H)
    lg = logo_mod.Logo(W, H)
    still_frames = {int(round(float(t) * F)): t for t in a.still_times.split(",") if t}
    enc = None
    if a.out != "-":
        cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(F), "-i", "-"]
        if a.audio:
            cmd += ["-ss", f"{a.t0:.4f}", "-i", a.audio]
        cmd += ["-map", "0:v"] + (["-map", "1:a", "-c:a", "aac", "-b:a", "320k", "-ar", "48000"] if a.audio else [])
        cmd += ["-c:v", "libx264", "-preset", a.preset, "-crf", str(a.crf), "-pix_fmt", "yuv420p", "-profile:v", "high",
                "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart",
                "-t", f"{(f1 - f0) / F:.4f}", a.out]
        enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    cache = {}
    cur = None
    for fi in range(f0, f1):
        ci = max(i for i, c in enumerate(clips) if c["s"] <= fi)
        c = clips[ci]
        local = fi - c["s"]
        if cur is not c:
            if cur is not None:
                cur["clip"].close()
            cur = c
            c["clip"].open(skip=local if local > 0 else 0)
        img = c["clip"].read().copy()
        t = fi / F
        # transitions: tail of the outgoing clip / head of the incoming one
        nxt = clips[ci + 1] if ci + 1 < len(clips) else None
        tr_in = TRANS.get(c["name"])
        tr_out = TRANS.get(nxt["name"]) if nxt else None
        x = img
        if tr_out and tr_out[0] == "whip":
            k = tr_out[2]
            rem = c["n"] - local
            if rem <= k:
                x = whip(x, (1.0 - (rem - 1) / k) ** 1.5, tr_out[1], W)
        if tr_in and tr_in[0] == "whip" and local < tr_in[2]:
            x = whip(x, (1.0 - local / tr_in[2]) ** 1.5, tr_in[1], W)
        if tr_in and tr_in[0] == "punch" and local < tr_in[2]:
            x = punch(x, (1.0 - local / tr_in[2]) ** 2, W, H)
        y = look.apply(x, fi, EXPO.get(c["name"], 0.0))
        if tr_in and tr_in[0] == "punch" and local < 2:
            y += 0.16 * (1 - local / 2)
        if tr_in and tr_in[0] == "flash" and local < tr_in[2]:
            y += (0.75 if tr_in[1] == 0 else tr_in[1]) * np.exp(-local / (tr_in[2] * 0.35))
        if tr_out and tr_out[0] == "flash" and tr_out[1] == 0 and c["n"] - local <= 3:
            y += 0.35 * (1.0 - (c["n"] - local - 1) / 3.0)
        # the flashlight's lens flare (beam log from the engine)
        beams = c["ev"].get("beam", []) if c["name"] in FLARE_SHOTS else []
        if beams:
            fps_src = float(c["ev"].get("fps", 60.0))
            bi = int(local * fps_src / F)
            near = [b for b in beams if b["f"] == bi and not b.get("behind", False)]
            for b in near:
                al = float(b["align"])
                stren = max(0.0, (al - 0.82) / 0.18) ** 2.2
                if stren > 0:
                    y = flare(y, b["screen"][0] * W, b["screen"][1] * H, stren, W, H, cache)
        # the logo reveal
        y = lg.apply(y, t)
        out = np.clip(y * 255.0 + 0.5, 0, 255).astype(np.uint8)
        if enc:
            enc.stdin.write(out.tobytes())
        if a.stills and fi in still_frames:
            os.makedirs(a.stills, exist_ok=True)
            cv2.imwrite(os.path.join(a.stills, f"comp_{float(still_frames[fi]):06.3f}.png"), cv2.cvtColor(out, cv2.COLOR_RGB2BGR))
        if fi % 60 == 0:
            print(f"comp {t:6.2f}s {c['name']}", flush=True)
    if cur:
        cur["clip"].close()
    if enc:
        enc.stdin.close()
        enc.wait()


if __name__ == "__main__":
    main()

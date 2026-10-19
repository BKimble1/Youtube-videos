#!/usr/bin/env python3
"""Track both wheel centres through the side jump of BYD's second film (recording frames 335-458), for the match cuts into and out
of the illustrated car. Same method as track_wheels.py: Hough circles on a start frame, then frame-to-frame template tracking of the
rim face (normalised cross-correlation, sub-pixel), with a Hough cross-check. Output: source/src/data/wheel_track_jump.json
(frame -> rear/front centre and rim radius in recording pixels)."""
import cv2, json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'footage/source/Screen.Recording.2026-10-18.012652.mp4')
F0, F1, FS = 335, 458, 360


def frames(a, b):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{a / 30:.4f}', '-i', SRC, '-frames:v', str(b - a + 1), '-vf', 'format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 1080, 1920)


def hough(img, x0, x1):
    g = cv2.GaussianBlur(img[200:900, x0:x1], (7, 7), 1.5)
    c = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.2, minDist=120, param1=100, param2=40, minRadius=55, maxRadius=110)
    return None if c is None else [(float(a) + x0, float(b) + 200, float(r)) for a, b, r in c[0][:4]]


def refine(img, tmpl, cx, cy, H, rng=22):
    x0, y0 = int(round(cx)) - H - rng, int(round(cy)) - H - rng
    win = img[y0:y0 + 2 * H + 2 * rng, x0:x0 + 2 * H + 2 * rng]
    res = cv2.matchTemplate(win, tmpl, cv2.TM_CCOEFF_NORMED)
    _, mx, _, loc = cv2.minMaxLoc(res)
    px, py = loc

    def sub(v0, v1, v2):
        d = v0 - 2 * v1 + v2
        return 0.0 if abs(d) < 1e-9 else 0.5 * (v0 - v2) / d
    dx = sub(res[py, px - 1], res[py, px], res[py, px + 1]) if 0 < px < res.shape[1] - 1 else 0
    dy = sub(res[py - 1, px], res[py, px], res[py + 1, px]) if 0 < py < res.shape[0] - 1 else 0
    return x0 + px + dx + H, y0 + py + dy + H, float(mx)


def main():
    fr = frames(F0, F1)
    idx = lambda n: n - F0
    cand_r = hough(fr[idx(FS)], 450, 960)
    cand_f = hough(fr[idx(FS)], 1000, 1500)
    print('hough start rear', cand_r, 'front', cand_f)
    if len(sys.argv) > 1:
        return
    R0 = cand_r[0]; Fq = cand_f[0]
    H = int(min(R0[2], Fq[2]) * 0.85)
    track = {}
    for key, st in (('r', R0), ('f', Fq)):
        pos = {FS: (st[0], st[1], 1.0)}
        for rngn in (range(FS + 1, F1 + 1), range(FS - 1, F0 - 1, -1)):
            cx, cy, _ = pos[FS]
            prev = FS
            for n in rngn:
                tmpl = fr[idx(prev)][int(round(cy)) - H:int(round(cy)) + H, int(round(cx)) - H:int(round(cx)) + H]
                cx, cy, sc = refine(fr[idx(n)], tmpl, cx, cy, H)
                pos[n] = (cx, cy, sc)
                prev = n
        track[key] = pos
    out = {}
    for n in range(F0, F1 + 1):
        r, f = track['r'][n], track['f'][n]
        out[n] = {'r': [round(float(r[0]), 2), round(float(r[1]), 2)], 'f': [round(float(f[0]), 2), round(float(f[1]), 2)], 'score': round(float(min(r[2], f[2])), 3)}
    json.dump(out, open(os.path.join(ROOT, 'source/src/data/wheel_track_jump.json'), 'w'))
    print('lowest correlation', min(v['score'] for v in out.values()))
    for n in (335, 360, 380, 400, 420, 440, 458):
        g = hough(fr[idx(n)], 450, 960), hough(fr[idx(n)], 1000, 1500)
        print(n, out[n], '| hough', g[0][0] if g[0] else None, g[1][0] if g[1] else None)


if __name__ == '__main__':
    main()

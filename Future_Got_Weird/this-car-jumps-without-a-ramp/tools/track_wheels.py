#!/usr/bin/env python3
"""Track both wheel centres through the side-profile shot of BYD's clip (frames 230-328 of the recording).

Template-tracks the rim face frame to frame (normalised cross-correlation, sub-pixel) from hand-measured start
positions at frame 240 (8.00 s), then checks the track against independent Hough-circle fits at eight frames.
Output: footage/wheel_track.json (frame -> rear/front centre in source px) and source/src/data/wheel_track.json.
Used to lay the illustrated car exactly over the real car for the match cuts."""
import cv2, json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'footage/source/Screen.Recording.2026-10-18.012401.mp4')
F0, F1 = 230, 328
START = {240: {'r': (378.0, 731.0), 'f': (1537.0, 725.0)}}
H = 96  # half template size (rim face radius ~120)


def frames(a, b):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{a / 30:.4f}', '-i', SRC, '-frames:v', str(b - a + 1), '-vf', 'format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 1080, 1920)


def refine(img, tmpl, cx, cy, rng=26):
    x0, y0 = int(round(cx)) - H - rng, int(round(cy)) - H - rng
    win = img[y0:y0 + 2 * H + 2 * rng, x0:x0 + 2 * H + 2 * rng]
    res = cv2.matchTemplate(win, tmpl, cv2.TM_CCOEFF_NORMED)
    _, mx, _, loc = cv2.minMaxLoc(res)
    px, py = loc
    # sub-pixel parabola
    def sub(v0, v1, v2):
        d = v0 - 2 * v1 + v2
        return 0.0 if abs(d) < 1e-9 else 0.5 * (v0 - v2) / d
    dx = sub(res[py, px - 1], res[py, px], res[py, px + 1]) if 0 < px < res.shape[1] - 1 else 0
    dy = sub(res[py - 1, px], res[py, px], res[py + 1, px]) if 0 < py < res.shape[0] - 1 else 0
    return x0 + px + dx + H, y0 + py + dy + H, float(mx)


def main():
    fr = frames(F0, F1)
    idx = lambda n: n - F0
    track = {}
    for key in ('r', 'f'):
        pos = {240: START[240][key]}
        for direction, rngn in ((1, range(241, F1 + 1)), (-1, range(239, F0 - 1, -1))):
            cx, cy = pos[240]
            prev = 240
            for n in rngn:
                tmpl = fr[idx(prev)][int(round(cy)) - H:int(round(cy)) + H, int(round(cx)) - H:int(round(cx)) + H]
                cx, cy, score = refine(fr[idx(n)], tmpl, cx, cy)
                pos[n] = (cx, cy, score)
                prev = n
        track[key] = pos
    out = {}
    for n in range(F0, F1 + 1):
        r, f = track['r'][n], track['f'][n]
        out[n] = {'r': [round(float(r[0]), 2), round(float(r[1]), 2)], 'f': [round(float(f[0]), 2), round(float(f[1]), 2)], 'score': round(float(min(r[2] if len(r) > 2 else 1, f[2] if len(f) > 2 else 1)), 3)}
    json.dump(out, open(os.path.join(ROOT, 'footage/wheel_track.json'), 'w'), indent=0)
    os.makedirs(os.path.join(ROOT, 'source/src/data'), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, 'source/src/data/wheel_track.json'), 'w'))
    # independent check: Hough circles (tyre/rim edge) at eight frames
    print('frame  track rear      track front     | hough rear      hough front')
    for n in (231, 258, 282, 300, 309, 315, 321, 327):
        g = cv2.GaussianBlur(fr[idx(n)][100:930], (9, 9), 2)
        res = []
        for (a, b) in ((0, 960), (960, 1920)):
            c = cv2.HoughCircles(g[:, a:b], cv2.HOUGH_GRADIENT, dp=1.2, minDist=200, param1=120, param2=60, minRadius=110, maxRadius=210)
            res.append(None if c is None else (round(float(c[0][0][0]) + a), round(float(c[0][0][1]) + 100)))
        print(n, out[n]['r'], out[n]['f'], '|', res[0], res[1])
    worst = min(v['score'] for v in out.values())
    print('lowest correlation', worst)
    for n in (230, 240, 270, 300, 320, 328):
        print(n, out[n])


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Measured QA of the v2 silent previews (E-A v2, E-C) with the v1 opening as the baseline. Everything here is a script measurement on the ENCODED mp4 frames; it is not a viewer test and not a listening test.
Usage: python3 tools/qa_v2.py        (needs ffmpeg, numpy, Pillow; reads exports/v2/*Silent_1080x1920.mp4 and the v1 silent mp4 at the episode root)
Writes qa/v2/QA_MEASUREMENTS_V2.json and qa/v2/sheets/*.png
Metrics per video (per frame unless stated):
  motion          mean abs luma difference to the previous frame (1/4 scale): how much the picture changes
  quiet_run       longest run of frames whose 6-frame-apart difference is below 35% of the video's median: a crude 'same slide repeating' detector
  coffee          pixels of the coffee colour (#33200F +-8): airborne (above the ground line), on the ground (stain), and clipped at the frame edge columns
  hero            bbox of hero-colour pixels (skin #8D5A3C, trousers #2E3F5C, hair #1E1A1A, +-10): height as % of frame, share inside the Shorts UI bands
  stillness       mean abs difference of a background band the actors never enter, per frame (street is still <=> ~0)
"""
import json, os, subprocess, shutil, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = f'{ROOT}/exports/v2'
VIDEOS = {
    'v1_EA': f'{ROOT}/FGW_EarthStops_EA_Opening_Silent_1080x1920.mp4',
    'v2_EA2': f'{X}/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4',
    'v2_EC1': f'{X}/FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4',
}
NOMARK = {  # for the sky/road margin and background-band measurements the WHAT IF tag must not be in the frame
    'v1_EA': f'{ROOT}/exports/FGW_EarthStops_EA_Opening_Silent_NoMarker_1080x1920.mp4',
    'v2_EA2': f'{X}/FGW_EarthStops_EA2_Opening_Silent_NoMarker_1080x1920.mp4',
    'v2_EC1': f'{X}/FGW_EarthStops_EC1_Opening_Silent_NoMarker_1080x1920.mp4',
}
GROUND_Y = {'v2_EA2': 1480, 'v2_EC1': 1500}  # screen y of the feet line (scene GSY); v1 does not use this metric
STILL_BAND = {'v2_EA2': (760, 880), 'v2_EC1': (830, 900)}  # window rows above the actors' heads, after the camera has stopped
STILL_FROM = {'v2_EA2': 38, 'v2_EC1': 48}
SCR = '/tmp/fgw_qa2'


def extract(mp4, tag):
    d = f'{SCR}/{tag}'
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vsync', '0', f'{d}/f%03d.png'], check=True)
    return d, len([f for f in os.listdir(d) if f.endswith('.png')])


def near(a, c, tol):
    return np.all(np.abs(a.astype(np.int16) - np.array(c, dtype=np.int16)) <= tol, axis=-1)


HEX = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
SKIN, PANTS, HAIR, COFFEE = HEX('#8D5A3C'), HEX('#2E3F5C'), HEX('#1E1A1A'), HEX('#33200F')


def luma(a):
    return (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])


def analyse(tag, mp4, nomark=None):
    d, n = extract(mp4, tag)
    dn = None
    if nomark:
        dn, _ = extract(nomark, tag + '_nm')
    rows = []
    small = []
    for f in range(n):
        a = np.asarray(Image.open(f'{d}/f{f + 1:03d}.png').convert('RGB'))
        small.append(luma(a[::4, ::4].astype(np.float32)))
        hero = near(a, SKIN, 10) | near(a, PANTS, 10)  # hair colour is left out: anti-aliased ink edges blend into it
        cof = near(a, COFFEE, 8)
        ys, xs = np.nonzero(hero)
        gy = GROUND_Y.get(tag)
        row = {'f': f, 'hero_px': int(hero.sum()), 'coffee_px': int(cof.sum())}
        if len(xs) > 50:
            x0, x1, y0, y1 = (float(np.percentile(xs, 0.5)), float(np.percentile(xs, 99.5)), float(np.percentile(ys, 0.5)), float(np.percentile(ys, 99.5)))
            row.update({'hero_bbox_p0.5_p99.5': [round(x0), round(y0), round(x1), round(y1)], 'hero_cx': float(xs.mean()), 'hero_cy': float(ys.mean()),
                        'hero_h_pct': round(100 * (y1 - y0) / 1920, 1), 'hero_in_top_band_px': int((ys < 192).sum()), 'hero_in_bottom_band_px': int((ys > 1574).sum())})
        if gy:
            cy = np.nonzero(cof)[0]
            row['coffee_air_px'] = int((cy < gy - 30).sum()); row['coffee_ground_px'] = int((cy >= gy - 30).sum())
        row['coffee_edge_clip_px'] = int(cof[:, :8].sum() + cof[:, -8:].sum())
        rows.append(row)
    S = np.stack(small)
    motion = [0.0] + [float(np.mean(np.abs(S[i] - S[i - 1]))) for i in range(1, n)]
    d6 = [float(np.mean(np.abs(S[i] - S[i - 6]))) for i in range(6, n)]
    med = float(np.median(d6)); thr = 0.35 * med
    run = best = 0
    for v in d6:
        run = run + 1 if v < thr else 0
        best = max(best, run)
    out = {'frames': n, 'motion_mean_abs_luma': [round(m, 3) for m in motion], 'six_frame_diff_median': round(med, 3), 'quiet_run_frames_6apart_below_35pct_median': best, 'rows': rows}
    if dn:
        if tag in STILL_BAND:
            lo, hi = STILL_BAND[tag]
            prev = None; st = []
            for f in range(n):
                b = np.asarray(Image.open(f'{dn}/f{f + 1:03d}.png').convert('RGB'))[lo:hi].astype(np.float32)
                st.append(0.0 if prev is None else float(np.mean(np.abs(b - prev)))); prev = b
            out['stillness_band_rows'] = [lo, hi]; out['stillness_mean_abs_diff'] = [round(v, 3) for v in st]
            out['stillness_mean_from_frame'] = {'from': STILL_FROM[tag], 'mean': round(float(np.mean(st[STILL_FROM[tag]:])), 4), 'max': round(float(np.max(st[STILL_FROM[tag]:])), 4)}
            out['stillness_mean_frames_8_to_20'] = round(float(np.mean(st[8:21])), 3)
        # sky above the highest picture content and road below the curb, measured on the no-marker frames at f0 / f30 / f60 as % of frame height
        marg = {}
        for f in (0, 30, 60):
            b = np.asarray(Image.open(f'{dn}/f{f + 1:03d}.png').convert('RGB')).astype(np.int16)
            ink = np.all(np.abs(b - np.array(HEX('#162A32'))) <= 24, axis=-1)
            rowhas = ink.sum(axis=1) > 6
            top = int(np.argmax(rowhas)) if rowhas.any() else 0
            coral = np.all(np.abs(b - np.array(HEX('#EF6B55'))) <= 18, axis=-1).sum(axis=1) > 400
            ci = np.nonzero(coral)[0]
            marg[f'f{f}'] = {'top_of_first_ink_row_pct': round(100 * top / 1920, 1), 'curb_bottom_row': int(ci.max()) if len(ci) else None, 'below_curb_pct': round(100 * (1920 - (int(ci.max()) if len(ci) else 1920)) / 1920, 1)}
        out['margins'] = marg
    return out, d


def main():
    res = {}
    dirs = {}
    for tag, p in VIDEOS.items():
        r, d = analyse(tag, p, NOMARK.get(tag))
        res[tag] = r; dirs[tag] = d
        print(tag, 'frames', r['frames'], 'quiet_run', r['quiet_run_frames_6apart_below_35pct_median'])
    # E-C: the globe must be moving (blurred, large frame-to-frame change inside the disc) until its stop frame, then be perfectly still inside the disc.
    d = dirs['v2_EC1']
    cx, cy, R = 540, 575, 200
    yy, xx = np.mgrid[0:1920, 0:1080]
    inner = ((xx - cx) ** 2 + (yy - cy) ** 2) < (0.78 * R) ** 2
    panel = np.zeros((1920, 1080), bool); panel[900:1500, :] = True
    prev = None; gd = []; pd = []
    for f in range(res['v2_EC1']['frames']):
        a = np.asarray(Image.open(f'{d}/f{f + 1:03d}.png').convert('RGB')).astype(np.float32)
        if prev is not None:
            df = np.abs(a - prev).mean(axis=-1)
            gd.append(round(float(df[inner].mean()), 3)); pd.append(round(float(df[panel].mean()), 3))
        else:
            gd.append(0.0); pd.append(0.0)
        prev = a
    res['v2_EC1']['globe_inner_disc_mean_abs_diff'] = gd
    res['v2_EC1']['street_panel_mean_abs_diff'] = pd
    res['v2_EC1']['globe_check'] = {'mean_frames_1_to_7': round(float(np.mean(gd[1:8])), 3), 'frame_8': gd[8], 'mean_frames_9_to_74': round(float(np.mean(gd[9:])), 4), 'max_frames_9_to_74': round(float(np.max(gd[9:])), 4)}
    res['v2_EC1']['street_panel_check'] = {'mean_frames_1_to_8': round(float(np.mean(pd[1:9])), 3), 'mean_frames_10_to_20': round(float(np.mean(pd[10:21])), 3)}
    os.makedirs(f'{ROOT}/qa/v2/sheets', exist_ok=True)
    # compact summary values
    summ = {}
    for tag, r in res.items():
        rows = r['rows']
        air = [x.get('coffee_air_px', x['coffee_px']) for x in rows]
        summ[tag] = {
            'hero_skin_plus_trouser_px_f0_f12_f30_f60': [rows[f]['hero_px'] for f in (0, 12, 30, 60)],
            'hero_bbox_h_pct_f0_f12_f30_f60': [rows[f].get('hero_h_pct') for f in (0, 12, 30, 60)],
            'first_frame_coffee_coloured_pixels_clipped_at_left/right_edge_(>=40px)': next((x['f'] for x in rows if x['coffee_edge_clip_px'] >= 40), None),
            'frames_with_coffee_coloured_pixels_clipped_at_edge_(>=40px)': int(sum(1 for x in rows if x['coffee_edge_clip_px'] >= 40)),
            'hero_px_in_ui_bands_total_(top<192, bottom>1574)': [int(sum(x.get('hero_in_top_band_px', 0) for x in rows)), int(sum(x.get('hero_in_bottom_band_px', 0) for x in rows))],
            'motion_peak_frame': int(np.argmax(r['motion_mean_abs_luma'])),
            'motion_energy_every_3rd_frame': [round(v, 1) for v in r['motion_mean_abs_luma'][::3]],
        }
        if 'margins' in r:
            summ[tag]['margins'] = r['margins']
        if 'stillness_mean_from_frame' in r:
            summ[tag]['stillness'] = r['stillness_mean_from_frame']; summ[tag]['stillness_f8_20_mean'] = r['stillness_mean_frames_8_to_20']
    res['summary'] = summ
    json.dump(res, open(f'{ROOT}/qa/v2/QA_MEASUREMENTS_V2.json', 'w'), indent=1)
    print(json.dumps(summ, indent=1))


main()

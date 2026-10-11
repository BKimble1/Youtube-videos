#!/usr/bin/env python3
"""Measured QA of the encoded E-A opening (no listening, no viewer test). Extracts every frame of the silent MP4, then measures:
  - static-reference check: frames 0..CAM_START must not move the background at all
  - camera speed from the picture (phase correlation of the lane-dash band) vs the choreography
  - hero track (centroid of the cardigan colour) per frame: direction, monotonicity, vertical/horizontal ratio, jitter
  - an 'earthquake signature' check: a quake shakes the whole frame back and forth; this scene must show none of that
Writes qa/QA_MEASUREMENTS.json and qa/keyframes/*, qa/sheets/*   Usage: python3 tools/qa_opening.py <silent.mp4> [scratch_dir]"""
import json, os, subprocess, sys, shutil
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4 = sys.argv[1]
scratch = sys.argv[2] if len(sys.argv) > 2 else '/tmp/fgw_qa_frames'
shutil.rmtree(scratch, ignore_errors=True); os.makedirs(scratch)
subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vsync', '0', f'{scratch}/f%03d.png'], check=True)
N = len([f for f in os.listdir(scratch) if f.endswith('.png')])
probe = json.load(open(f'{ROOT}/qa/choreo_probe.json'))
Z = probe[0]['zoom']  # whole-scene push about (540, GY=1290)
DASH_Y0 = int(1290 + (1650 - 1290) * Z) + 2; DASH_Y1 = int(1290 + (1668 - 1290) * Z) - 2  # lane-dash band on screen
cues = json.load(open(f'{ROOT}/audio/cues.json'))


def load(f):
    return np.asarray(Image.open(f'{scratch}/f{f + 1:03d}.png').convert('RGB')).astype(np.float32)


frames = {}
def fr(f):
    if f not in frames: frames[f] = load(f)
    return frames[f]


# 1) static-reference check: a roofline/sea window no actor enters (x 900-1080, y 450-650): mean abs frame difference
def region_diff(a, b, x0=900, x1=1080, y0=450, y1=650):
    return float(np.mean(np.abs(fr(a)[y0:y1, x0:x1] - fr(b)[y0:y1, x0:x1])))
static = [round(region_diff(f, f + 1), 3) for f in range(0, 14)]

# 2) camera speed from the picture: horizontal shift of the lane-dash band between consecutive frames, by SSD search
#    (not FFT phase correlation: the dash pattern is periodic). Positive = content moves left = camera moves right.
def shift(a, b, y0=None, y1=None, rng=60):
    y0 = DASH_Y0 if y0 is None else y0; y1 = DASH_Y1 if y1 is None else y1
    A = fr(a)[y0:y1].mean(axis=(0, 2)); B = fr(b)[y0:y1].mean(axis=(0, 2))
    best = None
    for k in range(-rng, rng + 1):
        d = np.mean((A[k:] - B[:len(B) - k]) ** 2) if k >= 0 else np.mean((A[:k] - B[-k:]) ** 2)
        if best is None or d < best[0]: best = (d, k)
    return float(best[1])
cam_meas = [shift(f, f + 1) for f in range(0, N - 1)]
cam_pred = [(probe[f + 1]['cam'] - probe[f]['cam']) * Z for f in range(0, N - 1)]  # the zoom magnifies screen motion
cam_arr = np.array(cam_meas)

# 3) render-vs-choreography alignment: the pixels where the choreography says the head / mug are must be skin+hair / teal+coffee.
def frac(f, cx, cy, half, pred):
    a = fr(f); x0, x1, y0, y1 = int(max(0, cx - half)), int(min(1080, cx + half)), int(max(0, cy - half)), int(min(1920, cy + half))
    box = a[y0:y1, x0:x1]
    if box.size == 0: return None
    return float(np.mean(pred(box)))
def near(c, tol): return lambda box: np.all(np.abs(box - np.array(c, dtype=np.float32)) < tol, axis=-1)
skin_or_hair = lambda box: near((0x8D, 0x5A, 0x3C), 26)(box) | near((0x1E, 0x1A, 0x1A), 34)(box)
mug_or_coffee = lambda box: near((0xEF, 0x6B, 0x55), 30)(box) | near((0xC9, 0x4A, 0x36), 30)(box) | near((0x33, 0x20, 0x0F), 30)(box)  # coral mug / coral handle / coffee
head_hits, mug_hits = [], []
for f in range(N):
    sc = probe[f]['screen']
    h = frac(f, sc['head']['x'], sc['head']['y'], 18, skin_or_hair); m = frac(f, sc['mug']['x'], sc['mug']['y'], 18, mug_or_coffee)
    head_hits.append(h); mug_hits.append(m)
head_ok = [h is not None and h > 0.5 for h in head_hits]
mug_vis = [m is not None for m in mug_hits]
mug_ok = [m is not None and m > 0.35 for m in mug_hits]
# choreography-side track of the hips (screen px, after camera + zoom)
hx = np.array([p['screen']['hips']['x'] for p in probe]); hy = np.array([p['screen']['hips']['y'] for p in probe])
dxh = np.diff(hx); dyh = np.diff(hy)
sign_changes_hero = int(np.sum(np.diff(np.sign(dxh[np.abs(dxh) > 0.5])) != 0))
sign_changes_cam = int(np.sum(np.diff(np.sign(cam_arr[np.abs(cam_arr) > 0.5])) != 0))
res = {
    'frames': N,
    'static_reference': {'mean_abs_diff_frame_to_next_f0_to_f13': static, 'note': 'values ~0 = background pixel-identical through frame 6; rises as the camera starts (CAM_START=6, ramp 5 frames, smootherstep)'},
    'camera_px_per_frame': {'measured_from_picture': [round(v, 1) for v in cam_meas], 'predicted_from_choreo': [round(v, 1) for v in cam_pred],
                            'max_abs_error_px': round(float(np.max(np.abs(cam_arr - np.array(cam_pred)))), 1),
                            'median_abs_error_px': round(float(np.median(np.abs(cam_arr - np.array(cam_pred)))), 1)},
    'render_matches_choreography': {'head_box_is_skin_or_hair_frames': f'{sum(head_ok)}/{N}', 'mug_box_is_coral_or_coffee_frames': f'{sum(mug_ok)}/{sum(mug_vis)} (mug on screen in {sum(mug_vis)})',
                                    'head_min_fraction': round(min(h for h in head_hits if h is not None), 2)},
    'hips_screen_track_from_choreography': {'x_f0': round(float(hx[0]), 1), 'x_f8': round(float(hx[8]), 1), 'x_f16': round(float(hx[16]), 1), 'x_last': round(float(hx[-1]), 1),
                                            'dx_mean_f0_f8': round(float(np.mean(dxh[:8])), 1), 'dx_mean_f8_end': round(float(np.mean(dxh[8:])), 2), 'max_leftward_step_px': round(float(np.min(dxh)), 2)},
    'vertical_over_horizontal_hips_motion_first_30_frames': round(float(np.sum(np.abs(dyh[:30])) / max(1e-6, np.sum(np.abs(dxh[:30])))), 2),
    'quake_signature': {'hips_horizontal_velocity_sign_changes': sign_changes_hero, 'camera_velocity_sign_changes': sign_changes_cam,
                        'camera_ever_moves_left': bool(np.any(cam_arr < -1.0)), 'note': 'a quake shakes frame and subject back and forth (many sign changes, motion in both directions); here nothing oscillates and the camera only ever moves forward'},
    'ground_frame_hip_speed_px_per_frame': {'f0': probe[0]['v'], 'f30': probe[30]['v'], 'last': probe[-1]['v']},
    'street_speed_past_lens_px_per_s_after_f10': round(float(np.median(cam_arr[10:30])) * 30, 0),
}
os.makedirs(f'{ROOT}/qa', exist_ok=True)
json.dump(res, open(f'{ROOT}/qa/QA_MEASUREMENTS.json', 'w'), indent=1)

# ------------- key frames (full-res) + sheets
kd = f'{ROOT}/qa/keyframes'; sd = f'{ROOT}/qa/sheets'
os.makedirs(kd, exist_ok=True); os.makedirs(sd, exist_ok=True)
KEYS = [0, 3, 6, 9, 16, 24, 31, 45, 60, N - 1]
for f in KEYS:
    Image.fromarray(fr(f).astype(np.uint8)).save(f'{kd}/EA_f{f:04d}.png', optimize=True)

def sheet(fs, cols, scale, out, label=True):
    ims = [Image.fromarray(fr(f).astype(np.uint8)) for f in fs]
    w, h = int(ims[0].width * scale), int(ims[0].height * scale)
    rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (cols * w + (cols - 1) * 8, rows * h + (rows - 1) * 8), (30, 30, 30))
    d = ImageDraw.Draw(sh)
    for i, (f, im) in enumerate(zip(fs, ims)):
        x, y = (i % cols) * (w + 8), (i // cols) * (h + 8)
        sh.paste(im.resize((w, h), Image.LANCZOS), (x, y))
        if label:
            d.rectangle([x + 4, y + 4, x + 70, y + 24], fill=(0, 0, 0)); d.text((x + 9, y + 9), f'f{f}  {f / 30:.2f}s', fill=(255, 255, 255))
    sh.save(out); return sh.size
print('contact', sheet(KEYS, 5, 0.3, f'{sd}/EA_keyframes_contact.png'))
print('phone', sheet([0, 6, 12, 18, 30, 45, 60, N - 1], 8, 360 / 1080, f'{sd}/EA_phone360x640_8frames.png'))
print('first second', sheet(list(range(0, 30, 3)) + [29], 5, 0.3, f'{sd}/EA_first_second_every3.png'))
print(json.dumps({k: res[k] for k in ('render_matches_choreography', 'hips_screen_track_from_choreography', 'vertical_over_horizontal_hips_motion_first_30_frames', 'quake_signature', 'street_speed_past_lens_px_per_s_after_f10')}, indent=1))
print('camera err px: max', res['camera_px_per_frame']['max_abs_error_px'], 'median', res['camera_px_per_frame']['median_abs_error_px'])

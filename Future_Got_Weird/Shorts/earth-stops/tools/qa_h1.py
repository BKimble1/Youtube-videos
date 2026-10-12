#!/usr/bin/env python3
"""Measured QA of the H1 hook (encoded files only; no viewer test, no listening). Writes qa/v3/QA_H1.json.
Usage: python3 tools/qa_h1.py   (needs ffmpeg, numpy, Pillow; reads exports/v3/*.mp4, audio/v3/h1/stems/*.wav, qa/v3_probe_h1.json)"""
import json, os, re, shutil, subprocess, wave
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = f'{ROOT}/exports/v3'
SILENT = f'{X}/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4'
CLEAN = f'{X}/FGW_EarthStops_Hook_H1_Silent_Clean_1080x1920.mp4'
SR = 48000
res = {}


def frames(mp4, tag):
    d = f'/tmp/fgw_qah1/{tag}'; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vsync', '0', f'{d}/f%03d.png'], check=True)
    return d, len([f for f in os.listdir(d) if f.endswith('.png')])


def img(d, f):
    return np.asarray(Image.open(f'{d}/f{f + 1:03d}.png').convert('RGB')).astype(np.float32)


def near(a, c, tol):
    return np.all(np.abs(a - np.array(c, dtype=np.float32)) <= tol, axis=-1)


HEX = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
d, n = frames(SILENT, 'sil'); dc, nc = frames(CLEAN, 'clean')
res['frames'] = {'silent': n, 'clean': nc}

# 1) the globe stops on one frame: sharpness (mean |horizontal gradient|) inside the large disc, frames 0-8 (the globe starts to move/shrink with the panel expansion from frame 5, so only sharpness is compared)
cx, cy, R = 540, 575, 200
yy, xx = np.mgrid[0:1920, 0:1080]; disc = ((xx - cx) ** 2 + (yy - cy) ** 2) < (0.8 * R) ** 2
sharp = []
for f in range(0, 9):
    g = img(d, f).mean(axis=-1)
    gx = np.abs(np.diff(g, axis=1))[:, :-1]
    sharp.append(round(float(gx[disc[:, :-1][:, :gx.shape[1]]].mean()), 3))
res['globe_sharpness_f0_to_f8'] = sharp
res['globe_stop_frame_by_sharpness_jump'] = int(next(i for i in range(1, 9) if sharp[i] > 1.8 * np.mean(sharp[:i])))

# 2) her lean (face centroid x minus lowest-shoe-region x) frames 0-12: constant while walking, growing from the stop frame
lean = []
for f in range(0, 13):
    a = img(d, f)[880:1560]
    skin = near(a, HEX('#8D5A3C'), 10); pants = near(a, HEX('#2E3F5C'), 10)
    ys, xs = np.nonzero(skin)
    py, px = np.nonzero(pants)
    if len(xs) < 50 or len(px) < 50: lean.append(None); continue
    top = ys < np.percentile(ys, 40)
    low = py > np.percentile(py, 75)
    lean.append(round(float(xs[top].mean() - px[low].mean()), 1))
res['lean_px_head_minus_feet_f0_to_f12'] = lean

# 3) probe-based facts (choreography; positions of the hero, mug, bicycle, lamps on screen)
P = json.load(open(f'{ROOT}/qa/v3_probe_h1.json'))
res['hero_extents'] = {'min_left': round(min(r['left'] for r in P)), 'max_right': round(max(r['right'] for r in P)), 'frames_with_any_extent_beyond_x940_(right_rail)': [r['f'] for r in P if r['right'] > 940][:40], 'min_top': round(min(r['top'] for r in P)), 'max_bottom': round(max(r['bottom'] for r in P))}
res['street_panel_top_y'] = {f: round(820 * (1 - (0 if f <= 5 else 1 if f >= 17 else (lambda t: t * t * (3 - 2 * t))((f - 5) / 12)))) for f in (0, 5, 8, 11, 14, 17)}
stop = [r for r in P if r['f'] in range(42, 66)]
res['anchored_lamps_screen_x_f42_to_f65'] = {'per_lamp_range_px': [round(max(r['lamps'][i] for r in stop) - min(r['lamps'][i] for r in stop), 2) for i in range(3)], 'lamp_x_at_f42': [round(x) for x in P[42]['lamps']], 'note': 'range 0 = the lamp posts do not move on screen between the brake and the rewind'}
res['bicycle_screen_x'] = {f: round(P[f]['bike']) for f in (41, 45, 50, 55, 60, 65)}
res['caption_lane_vs_hero'] = {'caption_lane_y': [460, 620], 'min_hero_top_in_caption_frames': round(min(r['top'] for r in P if r['f'] in range(17, 40) or r['f'] in range(47, 66) or r['f'] in range(82, 180)))}

# 4) the street is still after the brake and moves again in the rewind (background band above the heads, clean render; mean abs diff 0-255)
band = (760, 880)
prev = None; st = []
for f in range(nc):
    b = img(dc, f)[band[0]:band[1]]
    st.append(0.0 if prev is None else round(float(np.abs(b - prev).mean()), 3)); prev = b
res['street_band_motion_mean_abs_diff'] = {'rows': list(band), 'f17_f27': round(float(np.mean(st[17:28])), 2), 'f45_f65_street_still': round(float(np.mean(st[45:66])), 3), 'f68_f89_rewind': round(float(np.mean(st[68:90])), 2), 'f95_f179_walk': round(float(np.mean(st[95:])), 2)}

# 5) motion energy of the whole picture, 3-frame sampling
S = [img(d, f)[::4, ::4].mean(axis=-1) for f in range(n)]
me = [0.0] + [round(float(np.abs(S[i] - S[i - 1]).mean()), 2) for i in range(1, n)]
res['motion_energy_every_3rd_frame'] = me[::3]

# 6) AUDIO
def wav(path):
    with wave.open(path) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
        return a.reshape(-1, w.getnchannels()), w.getframerate()
mix, _ = wav(f'{ROOT}/audio/v3/h1/stems/mix_h1.wav'); vo, _ = wav(f'{ROOT}/audio/v3/h1/stems/voice_only_h1.wav'); so, _ = wav(f'{ROOT}/audio/v3/h1/stems/sfx_only_h1.wav')
m, v, s = mix[:, 0], vo[:, 0], so[:, 0]
def ebur(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return {'integrated_LUFS': g('I'), 'true_peak_dBFS': g('Peak')}
db = lambda x: round(float(10 * np.log10(x + 1e-14)), 1)
rms = lambda x, a, b: float(np.mean(x[int(a * SR):int(b * SR)] ** 2))
def band_e(x, lo, hi, a, b):
    seg = x[int(a * SR):int(b * SR)]
    F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; f = np.fft.rfftfreq(len(seg), 1 / SR)
    return float(np.sum(F[(f >= lo) & (f < hi)])) + 1e-14
cut = 5 / 30
res['audio'] = {
    'files': {'mix_wav': ebur(f'{ROOT}/audio/v3/h1/stems/mix_h1.wav'), 'mix_aac_in_mp4': ebur(f'{X}/FGW_EarthStops_Hook_H1_VoiceSFX_1080x1920.mp4'), 'voice_only_aac': ebur(f'{X}/FGW_EarthStops_Hook_H1_VoiceOnly_1080x1920.mp4'), 'sfx_only_aac': ebur(f'{X}/FGW_EarthStops_Hook_H1_SFXOnly_1080x1920.mp4')},
    'duration_s': round(len(m) / SR, 4), 'channels_identical_mono_safe': bool(np.array_equal(mix[:, 0], mix[:, 1])), 'sample_peak_dBFS': round(float(20 * np.log10(np.max(np.abs(m)))), 2),
    'first_voice_sample_over_0.01_s': round(float(np.argmax(np.abs(v) > 0.01) / SR), 3),
    'rms_dBFS_per_250ms': [db(rms(m, i / 4, (i + 1) / 4)) for i in range(24)],
    'globe_stop_sfx_only': {'rms_dB_80ms_before_cut': db(rms(s, cut - 0.08, cut)), 'rms_dB_100ms_after_cut': db(rms(s, cut, cut + 0.10)), 'rms_dB_100_to_200ms_after_cut': db(rms(s, cut + 0.10, cut + 0.20)),
                            'low_20_200Hz_dB_80ms_before_vs_80ms_after': [db(band_e(s, 20, 200, cut - 0.08, cut)), db(band_e(s, 20, 200, cut, cut + 0.08))]},
    'globe_stop_full_mix_rms_dB': {'80ms_before': db(rms(m, cut - 0.08, cut)), '100ms_after': db(rms(m, cut, cut + 0.10))},
    'rewind_sfx_rms_dB_f66_f90': db(rms(s, 66 / 30, 90 / 30)),
}
# speech-to-SFX ratio in the speech band (300-3400 Hz), counting only 25 ms frames where the voice is actually speaking, per 250 ms window and as the worst 100 ms
def frame_band(x, lo, hi, a):
    seg = x[int(a * SR):int((a + 0.025) * SR)]
    F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; f = np.fft.rfftfreq(len(seg), 1 / SR)
    return float(np.sum(F[(f >= lo) & (f < hi)])) + 1e-14
fv = np.array([frame_band(v, 300, 3400, i * 0.025) for i in range(240)]); fs_ = np.array([frame_band(s, 300, 3400, i * 0.025) for i in range(240)])
active = np.array([rms(v, i * 0.025, (i + 1) * 0.025) > 10 ** (-30 / 10) for i in range(240)])
win = []
for i in range(24):
    idx = [k for k in range(i * 10, (i + 1) * 10) if active[k]]
    if len(idx) >= 3:
        win.append((i / 4, round(float(10 * np.log10(fv[idx].sum() / fs_[idx].sum())), 1)))
roll = []
for k in range(0, 236):
    idx = [j for j in range(k, k + 4) if active[j]]
    if len(idx) >= 3: roll.append((round(k * 0.025, 3), float(10 * np.log10(fv[idx].sum() / fs_[idx].sum()))))
worst = min(roll, key=lambda t: t[1])
res['audio']['speech_to_sfx_ratio_dB_300_3400Hz_voiced_frames_only'] = {'per_250ms_window_(start_s, dB)': win, 'median_dB': round(float(np.median([w[1] for w in win])), 1), 'worst_100ms_(start_s, dB)': [worst[0], round(worst[1], 1)], 'voice_active_frames': int(active.sum())}
# picture events vs measured voice words
res['sync_table'] = {
    'picture_events_s': {'globe_stop': 5 / 30, 'imbalance_begins': 5 / 30, 'panel_full': 17 / 30, 'brake_end_street_still': 42 / 30, 'lamp_tag': 42 / 30, 'bike_tag': 47 / 30, 'rewind': [66 / 30, 90 / 30], 'east_arrow': 113 / 30, 'number_roll': [130 / 30, 151 / 30], 'mph': 154 / 30},
    'voice_s_(Scribe word starts; speech groups from the energy segmentation)': {'What': 0.0, 'if': 0.24, 'Earth': 0.40, 'stopped': 0.72, 'em_dash_pause': [1.21, 1.57], 'right': 1.57, 'now_ends': 2.17, 'paragraph_pause': [2.17, 2.74], 'This': 2.80, 'east': 3.84, 'thousand': 4.64, 'miles': 5.12, 'hour_ends': 5.83},
}
json.dump(res, open(f'{ROOT}/qa/v3/QA_H1.json', 'w'), indent=1)
print(json.dumps({k: res[k] for k in ('globe_sharpness_f0_to_f8', 'globe_stop_frame_by_sharpness_jump', 'lean_px_head_minus_feet_f0_to_f12', 'hero_extents', 'street_band_motion_mean_abs_diff')}, indent=1))
print(json.dumps(res['audio'], indent=1))

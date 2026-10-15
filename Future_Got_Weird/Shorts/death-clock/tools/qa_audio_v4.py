#!/usr/bin/env python3
"""V4 audio QA (measurement only; nothing here has been listened to). Reads audio/v4 and audio/v3, writes
qa/v4/AUDIO_QA.json:
- integrated loudness / LRA / true peak of the V4 mix and of every V4 stem (ffmpeg ebur128), loudnorm pass-1 of the V4
  and V3 mixes (the V3 build's own measure), and the V3 mix for comparison
- stems sum to the mix (exact integers), duration
- sha256 of the V4 narration and music stems equal to V3's (option R: reused byte for byte)
- voice-to-bed margins in every speech group, broadband and speech-weighted (bed high-passed at 200 Hz), V4 vs V3
  window by window (the V3 method, tools/qa_audio_v3.py)
- the effects stem against V3's: the frame ranges that differ beyond rounding, set against the cues that changed
- rotor continuity: the V4 rotor cue alone vs the four V3 rotor segments, per frame (cue gain, unducked)
- the loop seam: per-frame level of mix / effects / music at 1338-1349 | 0-8 (mono mid), and the 1349 -> 0 step
Usage: python3 -B tools/qa_audio_v4.py"""
import sys

sys.dont_write_bytecode = True
import hashlib
import importlib.util
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR, FPS, NF = 48000, 30, 1350
A3, A4 = ROOT / 'audio' / 'v3', ROOT / 'audio' / 'v4'
MIX3, MIX4 = A3 / 'mix' / 'FGW_DeathClock_mix_48k.wav', A4 / 'mix' / 'FGW_DeathClock_V4_mix_48k.wav'
OUT = ROOT / 'qa' / 'v4'
_spec = importlib.util.spec_from_file_location('build_audio_v4', ROOT / 'tools' / 'build_audio_v4.py')
B4 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(B4)  # read-only use: read24, generators, place
FULL = B4.FULL


def ebu(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(p), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    t = r[r.rfind('Summary:'):]
    return {'I_lufs': float(t.split('I:')[1].split('LUFS')[0]), 'LRA_lu': float(t.split('LRA:')[1].split('LU')[0]), 'TP_dbtp': float(t.split('Peak:')[1].split('dBFS')[0])}


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def hp(x, f0=200):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[f < f0] = 0
    return np.fft.irfft(X, len(x))


def fr_db(x, f):
    a = int(round(f * SR / FPS)) % len(x)
    seg = np.take(x, np.arange(a, a + SR // FPS) % len(x), axis=0)
    return round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)), 1)


def margins(n, m, e, groups):
    nn = n.mean(1)
    bed = (m + e).mean(1)
    bedw = hp(bed)
    W = int(0.4 * SR)
    rows = []
    for a, b in groups:
        for s in np.arange(a, b - 0.4, 0.2):
            i = int(s * SR)
            vn = np.sqrt(np.mean(nn[i:i + W] ** 2))
            vb = np.sqrt(np.mean(bed[i:i + W] ** 2))
            vw = np.sqrt(np.mean(bedw[i:i + W] ** 2))
            rows.append((round(float(s), 2), round(float(20 * np.log10(vn / (vb + 1e-12))), 1), round(float(20 * np.log10(vn / (vw + 1e-12))), 1)))
    return rows


def summary(rows):
    bb = sorted(r[1] for r in rows)
    ww = sorted(r[2] for r in rows)
    return {'broadband': {'min': bb[0], 'p5': bb[len(bb) // 20], 'median': bb[len(bb) // 2]}, 'speech_weighted': {'min': ww[0], 'p5': ww[len(ww) // 20], 'median': ww[len(ww) // 2]},
            'lowest_windows_s_bb_sw': sorted(rows, key=lambda r: r[2])[:6]}


def ranges(mask):
    out, i, idx = [], 0, np.where(mask)[0]
    while i < len(idx):
        j = i
        while j + 1 < len(idx) and idx[j + 1] == idx[j] + 1:
            j += 1
        out.append([int(idx[i]), int(idx[j])])
        i = j + 1
    return out


def rotor_levels(cues, gen):
    buf = np.zeros((B4.N, 2))
    for c in cues:
        x = gen(c)
        p = c.get('p') or {}
        if p.get('curve'):
            B4.place_any(buf, B4.stereo_curve(x, c['gain'], B4.rotor_curve_pan(c, len(x))), c['f'] / FPS)
        else:
            B4.V3.place(buf, x, c['f'] / FPS, c['gain'], float(p.get('pan', 0)), float(p['panTo']) if 'panTo' in p else None)
    return buf.mean(1)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    res = {'listened': False, 'note': 'Measurements only. Nothing has been auditioned.'}
    n, m, e, x = (B4.read24(p) for p in (A4 / 'stems' / 'narration.wav', A4 / 'stems' / 'music.wav', A4 / 'stems' / 'effects.wav', MIX4))
    e3, x3 = B4.read24(A3 / 'stems' / 'effects.wav'), B4.read24(MIX3)
    # ---- loudness
    res['loudness'] = {'v4_mix': ebu(MIX4), 'v3_mix': ebu(MIX3), 'v4_narration': ebu(A4 / 'stems' / 'narration.wav'), 'v4_music': ebu(A4 / 'stems' / 'music.wav'), 'v4_effects': ebu(A4 / 'stems' / 'effects.wav'),
                       'v3_effects': ebu(A3 / 'stems' / 'effects.wav')}
    ln4, ln3 = B4.loudnorm_pass1(MIX4), B4.loudnorm_pass1(MIX3)
    res['loudnorm_pass1'] = {'v4_mix': {k: ln4[k] for k in ('input_i', 'input_tp', 'input_lra')}, 'v3_mix': {k: ln3[k] for k in ('input_i', 'input_tp', 'input_lra')}}
    res['sample_peak_dbfs'] = {'v4_mix': round(float(20 * np.log10(np.abs(x).max() / FULL)), 4), 'v3_mix': round(float(20 * np.log10(np.abs(x3).max() / FULL)), 4)}
    # ---- integrity
    res['stems_sum_max_abs_error_lsb'] = int(np.abs(n + m + e - x).max())
    res['duration_s'] = len(x) / SR
    res['reused_stems_sha256'] = {s: {'v4': sha(A4 / 'stems' / f'{s}.wav'), 'v3': sha(A3 / 'stems' / f'{s}.wav')} for s in ('narration', 'music')}
    for s in res['reused_stems_sha256'].values():
        s['equal'] = s['v4'] == s['v3']
    # ---- voice margins, V4 vs V3 window by window
    groups = json.load(open(ROOT / 'audio' / 'narration_v3' / 'narration_words_final.json'))['groups_final']
    n3, m3 = B4.read24(A3 / 'stems' / 'narration.wav'), B4.read24(A3 / 'stems' / 'music.wav')
    r4 = margins(n / FULL, m / FULL, e / FULL, groups)
    r3 = margins(n3 / FULL, m3 / FULL, e3 / FULL, groups)
    worse = [(a[0], a[1], b[1], a[2], b[2]) for a, b in zip(r4, r3) if a[2] < b[2] - 0.5 or a[1] < b[1] - 0.5]
    res['voice_margin_db'] = {'v4': summary(r4), 'v3': summary(r3),
                              'v4_windows_more_than_0.5dB_below_v3 [t_s, v4_bb, v3_bb, v4_sw, v3_sw]': worse,
                              'v4_min_not_below_v3_min': summary(r4)['broadband']['min'] >= summary(r3)['broadband']['min'] and summary(r4)['speech_weighted']['min'] >= summary(r3)['speech_weighted']['min']}
    # ---- effects vs V3: frames that differ beyond rounding (V3 truncated, V4 rounds: <= 1 LSB is rounding)
    d = np.abs(e - e3).max(1)
    per_frame = np.array([d[int(f * SR / FPS):int((f + 1) * SR / FPS)].max() for f in range(NF)])
    cues4 = json.load(open(A4 / 'cues.json'))
    cues3 = json.load(open(A3 / 'cues.json'))['cues']
    c3 = {c['id']: c for c in cues3}
    c4 = {c['id']: c for c in cues4['cues']}
    changed = sorted({i for i in c4 if c3.get(i) != c4[i]} | {i for i in c3 if i not in c4})
    res['effects_vs_v3'] = {'frames_differing_beyond_1lsb': ranges(per_frame > 1), 'changed_or_removed_cues': [(i, (c4.get(i) or c3.get(i))['f']) for i in changed],
                            'note': 'Unchanged V3 cues render identically (V3 generators, same ids/seeds); differences outside the changed cues would be a fault.'}
    # ---- rotor continuity: the one V4 curve cue vs V3's four segments (cue gain, unducked, before G3)
    rot4 = [c for c in cues4['cues'] if c['kind'] == 'rotor']
    rot3 = [c for c in cues3 if c['kind'] == 'rotor']
    l4 = rotor_levels(rot4, B4.GEN4['rotor'])
    l3 = rotor_levels(rot3, B4.V3.GEN_FUN['rotor'])
    a4 = int(min(c['f'] for c in rot4))
    b4 = int(max(c['f'] + c['dur'] * FPS for c in rot4))
    rp = [c for c in rot4 if (c.get('p') or {}).get('curve')]
    # from full speed (the spin-up itself rises from silence) to 12 frames before the end (the fade-out)
    full = a4 + (next((i for i, v in enumerate(rp[0]['p']['rate']) if v >= 0.99), 0) if rp else 12)
    lv4 = [fr_db(l4, f) for f in range(full, b4 - 12)]
    lv3 = [fr_db(l3, f) for f in range(full, b4 - 12)]
    st4 = np.abs(np.diff(lv4))
    st3 = np.abs(np.diff(lv3))
    sm4 = np.convolve(lv4, np.ones(6) / 6, mode='valid')  # 0.2 s average: the bed's slow level, without the voices' beating
    sm3 = np.convolve(lv3, np.ones(6) / 6, mode='valid')
    res['rotor'] = {'v4_cues': [c['id'] for c in rot4], 'v3_cues': [c['id'] for c in rot3], 'span_frames': [a4, b4], 'measured_from_full_speed_frame': full,
                    'v4_level_db_every_5f': lv4[::5], 'v3_level_db_every_5f': lv3[::5],
                    'v4_max_frame_to_frame_step_db': round(float(st4.max()), 1), 'v4_max_step_at_frame': int(full + int(np.argmax(st4))), 'v3_max_frame_to_frame_step_db': round(float(st3.max()), 1), 'v3_max_step_at_frame': int(full + int(np.argmax(st3))),
                    'v4_min_db_0.2s_avg': round(float(sm4.min()), 1), 'v3_min_db_0.2s_avg': round(float(sm3.min()), 1),
                    'v3_level_at_old_joins_db': {str(f): fr_db(l3, f) for f in (863, 864, 896, 930, 931)}, 'v4_level_at_old_joins_db': {str(f): fr_db(l4, f) for f in (863, 864, 896, 930, 931)}}
    if rp:
        p, f0 = rp[0]['p'], rp[0]['f']
        res['rotor']['blade_pass_hz_at'] = {str(f): round(140 * p['rate'][f - f0], 1) for f in (815, 817, 820, 825, 830, 835, 839, 845) if 0 <= f - f0 < len(p['rate'])}
        res['rotor']['rate_source'] = cues4.get('sources', {}).get('rotor_rate')
    # ---- seam
    mm, ee, mu, nn = x.mean(1) / FULL, e.mean(1) / FULL, m.mean(1) / FULL, n.mean(1) / FULL
    mm3, ee3 = x3.mean(1) / FULL, e3.mean(1) / FULL
    frs = list(range(1338, 1350)) + list(range(0, 9))
    res['seam_per_frame_db_1338_1349_then_0_8'] = {'mix_v4': [fr_db(mm, f) for f in frs], 'mix_v3': [fr_db(mm3, f) for f in frs], 'effects_v4': [fr_db(ee, f) for f in frs],
                                                   'effects_v3': [fr_db(ee3, f) for f in frs], 'music': [fr_db(mu, f) for f in frs], 'narration': [fr_db(nn, f) for f in frs]}
    res['seam_step_1349_to_0_db'] = {'mix_v4': round(fr_db(mm, 0) - fr_db(mm, 1349), 1), 'mix_v3': round(fr_db(mm3, 0) - fr_db(mm3, 1349), 1),
                                     'effects_v4': round(fr_db(ee, 0) - fr_db(ee, 1349), 1), 'effects_v3': round(fr_db(ee3, 0) - fr_db(ee3, 1349), 1), 'target_mix': '< 3 dB'}
    # ---- the build's own log
    L = json.load(open(A4 / 'MIX_LOG.json'))
    res['build'] = {'g3_bit_exact_vs_v3': L['g3']['bit_exact'], 'static_gain_db': L['g3']['static_gain_db'], 'safety': {k: v for k, v in L['safety'].items() if k != 'corrections'},
                    'generators_measured': L.get('generators_measured')}
    json.dump(res, open(OUT / 'AUDIO_QA.json', 'w'), indent=1)
    lo = res['loudness']
    print(f"V4 mix {lo['v4_mix']} | V3 mix {lo['v3_mix']}")
    print(f"loudnorm V4 {res['loudnorm_pass1']['v4_mix']} | V3 {res['loudnorm_pass1']['v3_mix']}")
    print(f"stems sum error {res['stems_sum_max_abs_error_lsb']} LSB; narration/music sha256 equal to V3: {[s['equal'] for s in res['reused_stems_sha256'].values()]}")
    print(f"voice margins V4 {res['voice_margin_db']['v4']['broadband']} / {res['voice_margin_db']['v4']['speech_weighted']}; V3 {res['voice_margin_db']['v3']['broadband']} / {res['voice_margin_db']['v3']['speech_weighted']}")
    print(f"windows >0.5 dB below V3: {len(worse)}; seam step {res['seam_step_1349_to_0_db']}; rotor max step {res['rotor']['v4_max_frame_to_frame_step_db']} dB")
    print('effects differ (frames):', res['effects_vs_v3']['frames_differing_beyond_1lsb'])


if __name__ == '__main__':
    main()

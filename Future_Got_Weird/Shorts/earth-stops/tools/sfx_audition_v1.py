#!/usr/bin/env python3
"""Candidate generation + MEASURED screening of the NEW physical SFX the V1 film needs beyond the hook (wind, sea surge, furniture scrape, wall slap, footstep, sip), before any is used.
Nobody, including this script's author, has listened to them. For each cue: 3 procedural candidates, objective metrics, an explicit rule and the pick; plus a reel for a human.
Usage: python3 tools/sfx_audition_v1.py -> audio/v4/audition/*.wav, audition_reel.wav, AUDITION_REPORT.md, audition_metrics.json"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foley_lib as L
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/audio/v4/audition'
os.makedirs(OUT, exist_ok=True)
SR = L.SR


def band_frac(x, lo, hi):
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / SR)
    return float(np.sum(X[(f >= lo) & (f < hi)]) / (np.sum(X) + 1e-18))


def metrics(x):
    a = np.abs(x); n = int(0.001 * SR)
    env = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, mode='same'))
    pk = float(env.max()); i10 = int(np.argmax(env > 0.1 * pk)); i90 = int(np.argmax(env > 0.9 * pk))
    below = np.nonzero(env[i90:] < pk * 0.1)[0]
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / SR)
    return {'dur_ms': round(1000 * len(x) / SR), 'rms_dB': round(float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)), 1), 'peak': round(float(a.max()), 2),
            'centroid_Hz': round(float(np.sum(X * f) / (np.sum(X) + 1e-18))), 'frac_20_150Hz': round(band_frac(x, 20, 150), 3), 'frac_20_300Hz': round(band_frac(x, 20, 300), 3),
            'frac_300_3400Hz_speech_band': round(band_frac(x, 300, 3400), 3), 'frac_above_2k': round(band_frac(x, 2000, 20000), 3), 'onset_10_90_ms': round(1000 * (i90 - i10) / SR, 1),
            'decay_to_-20dB_ms': round(1000 * (below[0] if len(below) else len(x) - i90) / SR), 'crest': round(float(a.max() / (np.sqrt(np.mean(x ** 2)) + 1e-12)), 1)}


cands = {}
# the wind that arrives on "the air keeps going" (1.4 s gust)
cands['gust'] = {'a_band_gust_140_1800': L.fx_gust('v1_gust_a', 1.4, 140, 1800, 0.0, 0.25), 'b_low_rumble_gust': L.fx_gust('v1_gust_b', 1.4, 70, 900, 0.0, 0.10), 'c_airy_whistle_gust': L.fx_gust('v1_gust_c', 1.4, 300, 4000, 1.0, 0.35)}
# the sea that keeps going on "the ocean" (1.3 s surge)
cands['surge'] = {'a_rumble_foam': L.fx_surge('v1_surge_a', 1.3, 1.0, 0.5, 0), 'b_foam_bubbles': L.fx_surge('v1_surge_b', 1.3, 0.7, 1.0, 12), 'c_deep_rumble': L.fx_surge('v1_surge_c', 1.3, 1.2, 0.2, 0)}
# chairs and the table dragged by the stopped ground
cands['furniture_scrape'] = {'a_stone_scrape': L.fx_scrape_furniture('v1_fs_a', 0.5, 190, 120, 900, 7500), 'b_metal_legs_scrape': L.fx_scrape_furniture('v1_fs_b', 0.5, 340, 170, 1800, 9000), 'c_heavy_scrape': L.fx_scrape_furniture('v1_fs_c', 0.5, 120, 70, 500, 4500)}
# the bore hitting the sea wall
cands['wall_slap'] = {'a_thud_splash': L.fx_wave_slap('v1_ws_a', 0.9, 1.0, 1.0), 'b_heavy_thud': L.fx_wave_slap('v1_ws_b', 0.9, 1.4, 0.6), 'c_splashy': L.fx_wave_slap('v1_ws_c', 0.9, 0.6, 1.4)}
# her footsteps in the close-up, and the sip
cands['footstep'] = {'a_thud_dominant': L.fx_footstep('v1_fo_a', 0.9, 0.35), 'b_thud_and_scuff': L.fx_footstep('v1_fo_b', 0.6, 1.4), 'c_squeak_scuff': L.fx_rubber_chirp('v1_fo_c')}
cands['sip'] = {'a_gulp_and_liquid': L.fx_sip('v1_sip_a'), 'b_liquid_only': L.fx_gust('v1_sip_b', 0.34, 500, 2600, 0.0, 0.0, 0.5), 'c_peel_like': L.fx_peel('v1_sip_c')}

res = {}
for cue, d in cands.items():
    res[cue] = {}
    for name, x in d.items():
        res[cue][name] = metrics(x)
        L.write_wav(f'{OUT}/{cue}_{name}.wav', x)

pick = {}
ok = {k: v for k, v in res['gust'].items() if v['onset_10_90_ms'] >= 120 and 300 <= v['centroid_Hz'] <= 1800}
pick['gust'] = (min(ok, key=lambda k: ok[k]['frac_300_3400Hz_speech_band']) if ok else min(res['gust'], key=lambda k: res['gust'][k]['frac_300_3400Hz_speech_band']),
                'rule: it must build (10-90 % onset >= 120 ms) and read as wind (spectral centroid 300-1800 Hz); then the least energy in the speech band 300-3400 Hz, because it plays under "At first, the air keeps going"')
ok = {k: v for k, v in res['surge'].items() if v['frac_20_300Hz'] >= 0.30 and v['frac_above_2k'] >= 0.25}
pick['surge'] = (max(ok, key=lambda k: ok[k]['frac_20_300Hz']) if ok else max(res['surge'], key=lambda k: res['surge'][k]['frac_20_300Hz']),
                 'rule (revised after a first screening, which picked the deep rumble: 85 % of its energy is below 300 Hz and a phone speaker would barely carry it): heavy (>= 30 % of energy at 20-300 Hz) AND audible on a phone (>= 25 % of energy above 2 kHz, the foam); then the largest low-band share')
pick['furniture_scrape'] = (max(res['furniture_scrape'], key=lambda k: res['furniture_scrape'][k]['frac_above_2k']),
                            'rule: a drag, not a grab (no onset limit; none of the three has a sharp onset), so: the most energy above 2 kHz, which sits above the voice (same reasoning as the hook scrape)')
ok = {k: v for k, v in res['wall_slap'].items() if v['frac_20_300Hz'] >= 0.25}
pick['wall_slap'] = (min(ok, key=lambda k: ok[k]['frac_300_3400Hz_speech_band']) if ok else min(res['wall_slap'], key=lambda k: res['wall_slap'][k]['frac_300_3400Hz_speech_band']),
                     'rule: a heavy hit (>= 25 % at 20-300 Hz); then the least speech-band energy, because it lands on the word "ocean"')
ok = {k: v for k, v in res['footstep'].items() if v['crest'] >= 4 and 0.15 <= v['frac_300_3400Hz_speech_band'] <= 0.6}
pick['footstep'] = (min(ok, key=lambda k: abs(ok[k]['centroid_Hz'] - 700)) if ok else 'b_thud_and_scuff', 'rule: a clear transient (crest >= 4), 15-60 % of energy in the speech band (a phone speaker carries it, it does not sit on the voice), centroid nearest 700 Hz')
ok = {k: v for k, v in res['sip'].items() if v['dur_ms'] <= 400 and v['crest'] >= 3.5 and v['frac_300_3400Hz_speech_band'] >= 0.3}
pick['sip'] = (max(ok, key=lambda k: ok[k]['frac_300_3400Hz_speech_band'] * (1 if k.startswith('a') else 0.6)) if ok else 'a_gulp_and_liquid', 'rule: short (<= 400 ms), a clear swallow transient (crest >= 3.5), carried by a phone speaker (>= 30 % in 300-3400 Hz); the pitched gulp is preferred over noise-only candidates because a sip needs a swallow to read at all (this preference is a judgement, not a measurement)')
for cue in res:
    for name in res[cue]:
        res[cue][name]['picked'] = (name == pick[cue][0])
json.dump({'metrics': res, 'picks': {k: {'pick': v[0], 'rule': v[1]} for k, v in pick.items()}, 'note': 'objective screening only; nobody has listened to these'}, open(f'{OUT}/audition_metrics.json', 'w'), indent=1)

reel, idx, t = [], [], 0.0
gap = np.zeros(int(0.5 * SR))
for cue, d in cands.items():
    for name, x in d.items():
        idx.append((cue, name, round(t, 2), round(len(x) / SR, 2)))
        y = x / (np.max(np.abs(x)) + 1e-9) * 0.7
        reel += [y, gap]; t += len(x) / SR + 0.5
L.write_wav(f'{OUT}/audition_reel.wav', np.concatenate(reel))
lines = ['# V1 SFX audition (new cues; measured screening; not listened to by the author)', '',
         'The hook cues (globe spin, shoe scrape, tag slap, counter, stop cut) were screened earlier: `audio/v3/audition/`. These are the new cues of the rest of the film. Each has 3 procedural candidates; metrics and an explicit rule pick one. **A pick is a proxy, not a judgement of how it sounds.** `audition_reel.wav` plays every candidate in order (0.5 s gaps, each peak-normalised to the same level) so a person can check the pick.', '']
for cue in res:
    lines += [f'## {cue}', f'Rule: {pick[cue][1]}. **Pick: `{pick[cue][0]}`**', '', '| candidate | metrics | picked |', '|---|---|---|']
    for name, m in res[cue].items():
        lines.append(f"| `{name}` | {', '.join(f'{k}={v}' for k, v in m.items() if k != 'picked')} | {'**yes**' if m['picked'] else ''} |")
    lines.append('')
lines += ['## Reel index (seconds into `audition_reel.wav`)', '', '| cue | candidate | start | length |', '|---|---|---|---|'] + [f'| {c} | `{n}` | {s} | {d} |' for c, n, s, d in idx]
open(f'{OUT}/AUDITION_REPORT.md', 'w').write('\n'.join(lines) + '\n')
print(json.dumps({k: v[0] for k, v in pick.items()}))
for cue in res:
    for n, m in res[cue].items(): print(cue, n, {k: m[k] for k in ('centroid_Hz', 'frac_20_300Hz', 'frac_300_3400Hz_speech_band', 'frac_above_2k', 'onset_10_90_ms', 'crest')})

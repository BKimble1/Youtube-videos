#!/usr/bin/env python3
"""Candidate generation + MEASURED screening of the specific physical SFX the H1 hook needs, before any is used (nobody, including this script's author, has listened to them).
For each cue: 2-3 procedural candidates, objective metrics, an explicit selection rule and the pick. Also writes an audition reel for a human to listen to.
Usage: python3 tools/sfx_audition_h1.py  -> audio/v3/audition/*.wav, audio/v3/audition/audition_reel.wav, audio/v3/audition/AUDITION_REPORT.md, audition_metrics.json"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foley_lib as L
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/audio/v3/audition'
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
            'centroid_Hz': round(float(np.sum(X * f) / (np.sum(X) + 1e-18))), 'frac_20_150Hz': round(band_frac(x, 20, 150), 3), 'frac_300_3400Hz_speech_band': round(band_frac(x, 300, 3400), 3),
            'frac_above_2k': round(band_frac(x, 2000, 20000), 3), 'onset_10_90_ms': round(1000 * (i90 - i10) / SR, 1), 'decay_to_-20dB_ms': round(1000 * (below[0] if len(below) else len(x) - i90) / SR), 'crest': round(float(a.max() / (np.sqrt(np.mean(x ** 2)) + 1e-12)), 1)}


cands = {}
# 1) the spinning globe (heard for only ~0.17 s before it stops under the first word, so it must be low and sustained, not masking)
cands['spin'] = {'a_rumble_air_chop': L.fx_spin_whirr('h1_spin_a', 0.4, rev_hz=1.7), 'b_flywheel_stack': L.fx_flywheel('h1_spin_b', 0.4, rev_hz=9.0), 'c_turbine_whine': L.fx_turbine('h1_spin_c', 0.4)}
# 2) the shoe grabbing and dragging at the stop (frame 6 onwards)
cands['scrape'] = {'a_stickslip_scrape': L.fx_scrape('h1_scr_a', 0.3, f0=205, f1=170, att=0.002, rel=0.022), 'b_rubber_chirp_scuff': L.fx_rubber_chirp('h1_scr_b'), 'c_heavy_grit_scrape': L.fx_scrape('h1_scr_c', 0.3, f0=130, f1=95, lo=500, hi=4500, att=0.002, rel=0.03)}
# 3) the speed tag landing on the bicycle / lamp (a card stuck on, not a UI blip)
cands['tag'] = {'a_cardboard_slap': L.fx_tag_slap('h1_tag_a'), 'b_rubber_stamp_tap': L.fx_stamp_tap('h1_tag_b'), 'c_sticker_press': L.fx_sticker_press('h1_tag_c')}
# 4) the odometer-style counter rolling up to 1,000 over frames 130-151 (0.7 s)
ra, ta = L.ratchet_train('h1_cnt_a', 18, 0.70, ease=3.0)
rb, tb = L.ratchet_train('h1_cnt_b', 18, 0.70, ease=3.0, pitch_rise=0.35)
rc, tc = L.ratchet_train('h1_cnt_c', 12, 0.70, ease=2.0)
cands['counter'] = {'a_ratchet_18_ease_out': ra, 'b_ratchet_18_rising_pitch': rb, 'c_ratchet_12': rc}


def stop_variant(kind):
    """0.6 s: the spin bed (candidate a) -> hard cut at 0.25 s -> what follows. a: the shoe scrape arrives 33 ms after the cut (the picture's first off-balance frame is the cut frame + 1);
    b: the scrape arrives 100 ms after the cut (the first sound after the cut is the voice alone); c: a latch click 4 ms after the cut, then the scrape at 33 ms."""
    bed = cands['spin']['a_rumble_air_chop'][:int(0.25 * SR)]
    out = np.zeros(int(0.6 * SR)); out[:len(bed)] = bed
    cut = len(bed)
    out[cut - int(0.001 * SR):cut] *= np.linspace(1, 0, int(0.001 * SR))
    scr = cands['scrape']['a_stickslip_scrape'][:int(0.2 * SR)] * 0.8
    d = {'a_cut_then_scrape_33ms': 0.033, 'b_cut_then_100ms_void_then_scrape': 0.100, 'c_cut_latch_click_then_scrape': 0.033}[kind]
    k = cut + int(d * SR); out[k:k + len(scr)] += scr
    if kind.startswith('c_'):
        lc = L.fx_latch('h1_latch') * 0.6; k2 = cut + int(0.004 * SR); out[k2:k2 + len(lc)] += lc
    return out
cands['stop'] = {k: stop_variant(k) for k in ('a_cut_then_scrape_33ms', 'b_cut_then_100ms_void_then_scrape', 'c_cut_latch_click_then_scrape')}


def stop_metrics(x):
    cut = int(0.25 * SR); pre = x[cut - int(0.05 * SR):cut]
    post = x[cut:]
    w = int(0.002 * SR)
    env = np.sqrt(np.convolve(post ** 2, np.ones(w) / w, mode='same'))
    pre_rms = np.sqrt(np.mean(pre ** 2)) + 1e-12
    loud = np.nonzero(env > pre_rms * 10 ** (-40 / 20))[0]
    first = int(loud[0]) if len(loud) else None
    return {'silence_gap_after_cut_ms': round(1000 * first / SR) if first is not None else None,
            'first_sound_after_cut_peak_vs_bed_rms_dB': round(float(20 * np.log10(np.max(np.abs(post[:int(0.15 * SR)])) / pre_rms + 1e-9)), 1)}


res = {}
for cue, d in cands.items():
    res[cue] = {}
    for name, x in d.items():
        m = stop_metrics(x) if cue == 'stop' else metrics(x)
        res[cue][name] = m
        L.write_wav(f'{OUT}/{cue}_{name}.wav', x)

# explicit selection rules (objective proxies, NOT listening)
pick = {}
ok = {k: v for k, v in res['spin'].items() if v['frac_20_150Hz'] >= 0.30 and 0.15 <= v['frac_300_3400Hz_speech_band'] <= 0.45}
pick['spin'] = (max(ok, key=lambda k: ok[k]['frac_20_150Hz']), 'rule: it must survive a phone speaker (>= 15% of energy at 300-3400 Hz) without sitting on the voice (<= 45% there), and read as a big turning mass (>= 30% at 20-150 Hz); then the largest low-band share. The pure low flywheel stack (0.4% at 300-3400 Hz) would be inaudible on a phone; the turbine whine (99.9% in the speech band) would mask the first word')
gaps = {k: v for k, v in res['stop'].items() if v['silence_gap_after_cut_ms'] is not None and v['silence_gap_after_cut_ms'] >= 90}
pick['stop'] = (min(gaps, key=lambda k: gaps[k]['first_sound_after_cut_peak_vs_bed_rms_dB']), 'rule: the cut must be followed by a clear gap (>= 90 ms with nothing but the voice) and no added transient; a latch click would suggest a collision or a lock, which the owner asked to avoid')
sc = {k: v for k, v in res['scrape'].items() if v['onset_10_90_ms'] <= 12}
pick['scrape'] = (max(sc, key=lambda k: sc[k]['frac_above_2k']), 'rule: onset <= 12 ms (a grab), then the most energy above 2 kHz (sits above the voice, masks it least)')
tg = {k: v for k, v in res['tag'].items() if v['dur_ms'] <= 140}
pick['tag'] = (min(tg, key=lambda k: abs(tg[k]['centroid_Hz'] - 2200)), 'rule: short, centroid closest to 2.2 kHz (audible on a phone speaker, above the voice body)')
pick['counter'] = ('a_ratchet_18_ease_out', 'rule: a mechanical counter does not rise in pitch; ease-out spacing matches the on-screen number settling on 1,000')
for cue in res:
    for name in res[cue]:
        res[cue][name]['picked'] = (name == pick[cue][0])
json.dump({'metrics': res, 'picks': {k: {'pick': v[0], 'rule': v[1]} for k, v in pick.items()}, 'note': 'objective screening only; nobody has listened to these'}, open(f'{OUT}/audition_metrics.json', 'w'), indent=1)

# audition reel (what a human should listen to): every candidate, 0.5 s apart, index in the report
reel, idx, t = [], [], 0.0
gap = np.zeros(int(0.5 * SR))
for cue, d in cands.items():
    for name, x in d.items():
        idx.append((cue, name, round(t, 2), round(len(x) / SR, 2)))
        y = x / (np.max(np.abs(x)) + 1e-9) * 0.7
        reel += [y, gap]; t += len(x) / SR + 0.5
L.write_wav(f'{OUT}/audition_reel.wav', np.concatenate(reel))
lines = ['# H1 SFX audition (measured screening; not listened to by the author)', '',
         'Each cue has 3 procedural candidates; metrics and an explicit rule pick one. **A pick is a proxy, not a judgement of how it sounds.** `audition_reel.wav` plays every candidate in order (0.5 s gaps, each peak-normalised to the same level) so a person can check the pick; index below.', '']
for cue in res:
    lines += [f'## {cue}', f'Rule: {pick[cue][1]}. **Pick: `{pick[cue][0]}`**', '', '| candidate | metrics | picked |', '|---|---|---|']
    for name, m in res[cue].items():
        lines.append(f"| `{name}` | {', '.join(f'{k}={v}' for k, v in m.items() if k != 'picked')} | {'**yes**' if m['picked'] else ''} |")
    lines.append('')
lines += ['## Reel index (seconds into `audition_reel.wav`)', '', '| cue | candidate | start | length |', '|---|---|---|---|'] + [f'| {c} | `{n}` | {s} | {d} |' for c, n, s, d in idx]
open(f'{OUT}/AUDITION_REPORT.md', 'w').write('\n'.join(lines) + '\n')
print(json.dumps({k: v[0] for k, v in pick.items()}))
for cue in ('spin', 'scrape', 'tag'):
    for n, m in res[cue].items(): print(cue, n, {k: m[k] for k in ('centroid_Hz', 'frac_20_150Hz', 'frac_300_3400Hz_speech_band', 'frac_above_2k', 'onset_10_90_ms', 'dur_ms')})
for n, m in res['stop'].items(): print('stop', n, m)

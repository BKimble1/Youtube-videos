#!/usr/bin/env python3
"""Build the V2 sound-effect library: pick one variation per kind, trim it, find its sync point, level it.

  python3 tools/sfx_lib.py            -> audio/sfx/v2/lib/<kind>.wav + audio/sfx/v2/lib/lib.json + SELECTION_V2.md

Sources: the new ElevenLabs generations in audio/sfx/v2/raw/<kind>_v<k>.mp3 and the pass-2 ElevenLabs effects in
audio/sfx/elevenlabs/ (mapped to V2 kinds below), plus a few small numpy synths for sample-tight accents.

Selection is measured, not listened to (same method as pass 2): every candidate is decoded to 48 kHz mono and
described by its 10 ms peak envelope (main transient, onset, number of separate events, decay) and, for sustained
sounds, how steady its level is. Each kind belongs to a class that says what a good take looks like:
  hit    one dominant transient, few extra events, quick decay; synced on the transient
  stroke a clean onset and one gesture; synced on the onset (first frame within 20 dB of the peak)
  stop   a movement that ends in a stop (drawer, book); synced on the stop (last frame within 20 dB of the peak)
  loop   steady level (low variation over 100 ms windows); looped with crossfades to any length
"""
import glob
import json
import os
import subprocess

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'audio', 'sfx', 'v2', 'raw')
OLD = os.path.join(ROOT, 'audio', 'sfx', 'elevenlabs')
LIB = os.path.join(ROOT, 'audio', 'sfx', 'v2', 'lib')
SR = 48000
rng = np.random.default_rng(7)

CLASS = {
    'hit': ['paper_slap', 'card_flick', 'pencil_tap', 'typewriter_tick', 'chip_pop', 'token_select', 'token_lock', 'machine_clunk',
            'trophy_clink', 'gavel', 'stamp_light', 'stamp_heavy', 'score_flip', 'conveyor_clunk', 'hanger_click', 'thud_soft', 'pop_tick',
            'logo_hit', 'bell_ding', 'ding_right'],
    'stroke': ['paper_flap', 'paper_lift', 'paper_swish', 'card_slide', 'page_turn', 'tape_rip', 'marker_circle', 'marker_sweep',
               'scanner_sweep', 'printer_feed', 'glint', 'indicator_yes', 'indicator_no', 'claim_fails', 'buzzer_wrong',
               'crowd_aww', 'whoosh_soft', 'fanfare_small', 'paper_slide', 'prob_tick'],
    'stop': ['drawer_open', 'drawer_close', 'book_slide'],
    'loop': ['conveyor_run', 'machine_hum', 'amb_counter', 'amb_conveyor', 'amb_library', 'amb_gameshow', 'amb_machine',
             'crowd_cheer', 'trophy_steps'],
}
KIND_CLASS = {k: c for c, ks in CLASS.items() for k in ks}

# pass-2 effects reused for V2 kinds (file, why)
REUSE = {
    'stamp_light': ('stamp_v2.mp3', 'pass-2 counter stamp: one real thud with a wooden knock'),
    'token_lock': ('token_v4.mp3', 'pass-2 tile click: one crisp click with a tiny settle'),
    'drawer_open': ('drawer_v1.mp3', 'pass-2 catalogue drawer: wooden rumble ending in a soft stop'),
    'fanfare_small': ('fanfare_v2.mp3', 'pass-2 game-show win sting, done by 1.5 s'),
    'paper_slide': ('paper2_v2.mp3', 'pass-2 slip slide: clean swish then one settle'),
    'marker_sweep': ('marker_v3.mp3', 'pass-1 felt-tip stroke'),
    'thud_soft': ('tap_v1.mp3', 'pass-1 card placed on felt'),
    'pop_tick': ('tock_v4.mp3', 'pass-1 soft wooden tock'),
    'logo_hit': ('impact_v3.mp3', 'pass-1 restrained low title hit'),
    'whoosh_soft': ('whoosh_v3.mp3', 'pass-1 low air'),
}

# level of each kind in the effects stem before the mix (dB, applied to the measured reference level below)
GAIN = {
    'stamp_heavy': 0, 'stamp_light': -3, 'gavel': -1, 'claim_fails': -2, 'logo_hit': -4, 'buzzer_wrong': -6, 'ding_right': -6,
    'fanfare_small': -5, 'crowd_cheer': -8, 'crowd_aww': -8, 'bell_ding': -7, 'paper_slap': -6, 'paper_slide': -7,
    'paper_flap': -8, 'paper_lift': -9, 'paper_swish': -8, 'card_flick': -8, 'card_slide': -7, 'page_turn': -9, 'tape_rip': -10,
    'marker_sweep': -9, 'marker_circle': -9, 'pencil_tap': -10, 'typewriter_tick': -10, 'hanger_click': -9, 'chip_pop': -11,
    'glint': -14, 'whoosh_soft': -12, 'thud_soft': -7, 'pop_tick': -10, 'token_select': -9, 'token_lock': -8, 'prob_tick': -14,
    'conveyor_run': -14, 'conveyor_clunk': -8, 'drawer_open': -6, 'drawer_close': -7, 'book_slide': -8, 'machine_clunk': -6,
    'machine_hum': -16, 'scanner_sweep': -9, 'indicator_yes': -8, 'indicator_no': -8, 'printer_feed': -8, 'score_flip': -8,
    'trophy_clink': -7, 'trophy_steps': -9,
    'amb_counter': 0, 'amb_conveyor': 0, 'amb_library': 0, 'amb_gameshow': 0, 'amb_machine': 0,
}


def decode(path):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).astype(np.float64)


def envelope(x, hop=0.01):
    n = int(hop * SR)
    m = len(x) // n
    return np.array([np.abs(x[i * n:(i + 1) * n]).max() for i in range(m)]) + 1e-9


def measure(x):
    e = envelope(x)
    edb = 20 * np.log10(e / e.max())
    peak_i = int(np.argmax(e))
    above = np.where(edb > -20)[0]
    onset = int(above[0]) if len(above) else 0
    last = int(above[-1]) if len(above) else len(e) - 1
    # separate events: rises to within 12 dB of the peak after a dip of 10 dB
    events, armed = 0, True
    for v in edb:
        if armed and v > -12:
            events += 1
            armed = False
        elif v < -22:
            armed = True
    tail = np.where(edb[peak_i:] < -40)[0]
    decay = (int(tail[0]) if len(tail) else len(e) - peak_i) * 0.01
    win = int(0.1 * SR)
    seg = x[int(0.2 * SR):]
    rms = np.array([np.sqrt(np.mean(seg[i:i + win] ** 2)) for i in range(0, max(1, len(seg) - win), win)]) + 1e-9
    steady = float(np.std(20 * np.log10(rms))) if len(rms) > 2 else 99.0
    return {'peak_s': peak_i * 0.01, 'onset_s': onset * 0.01, 'last_s': last * 0.01, 'events': events, 'decay_s': decay,
            'steady_db': steady, 'peak_dbfs': float(20 * np.log10(np.abs(x).max() + 1e-9)), 'dur_s': len(x) / SR,
            'crest_db': float(20 * np.log10(np.abs(x).max() / (np.sqrt(np.mean(x ** 2)) + 1e-12)))}


def score(kind, m):
    c = KIND_CLASS[kind]
    if m['peak_dbfs'] < -40:
        return -99
    if c == 'hit':
        return m['crest_db'] - 4 * max(0, m['events'] - 2) - 3 * max(0, m['decay_s'] - 0.6)
    if c == 'stroke':
        return -3 * max(0, m['events'] - 3) - 2 * abs(m['last_s'] - m['onset_s'] - 0.5) + 0.2 * m['crest_db']
    if c == 'stop':
        return -2 * max(0, m['events'] - 3) + (2 if m['last_s'] - m['onset_s'] > 0.25 else 0)
    return -m['steady_db']


def trim(kind, x, m):
    c = KIND_CLASS[kind]
    if c == 'loop':
        y = x[int(0.15 * SR): len(x) - int(0.15 * SR)]
        sync = 0.0
    else:
        a = max(0, int((m['onset_s'] - 0.03) * SR))
        e = envelope(x)
        edb = 20 * np.log10(e / e.max())
        below = np.where(edb[int(m['peak_s'] / 0.01):] < -48)[0]
        end_i = (int(m['peak_s'] / 0.01) + int(below[0])) if len(below) else len(e)
        b = min(len(x), int((end_i * 0.01 + 0.06) * SR), a + int(2.6 * SR))
        y = x[a:b]
        ref = {'hit': m['peak_s'], 'stroke': m['onset_s'], 'stop': m['last_s']}[c]
        sync = max(0.0, ref - a / SR)
    n_in = min(len(y) // 4, int(0.004 * SR))
    n_out = min(len(y) // 3, int(0.03 * SR))
    if n_in:
        y[:n_in] *= np.linspace(0, 1, n_in)
    if n_out:
        y[-n_out:] *= np.linspace(1, 0, n_out)
    # reference level: hits/strokes/stops peak at -6 dBFS; loops at -30 dBFS RMS
    if c == 'loop':
        y = y / (np.sqrt(np.mean(y ** 2)) + 1e-12) * 10 ** (-30 / 20)
    else:
        y = y / (np.abs(y).max() + 1e-12) * 10 ** (-6 / 20)
    return y, sync


# ---------------------------------------------------------------- small synths (sample-tight accents)
def synth_prob_tick():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) + 0.3 * rng.standard_normal(n) * np.exp(-t * 300)
    return x / np.abs(x).max() * 10 ** (-6 / 20), 0.0


def main():
    os.makedirs(LIB, exist_ok=True)
    kinds = sorted(KIND_CLASS)
    lib, report = {}, []
    for kind in kinds:
        cands = sorted(glob.glob(os.path.join(RAW, f'{kind}_v*.mp3')))
        src_note = ''
        best = None
        if cands:
            scored = []
            for f in cands:
                try:
                    x = decode(f)
                except subprocess.CalledProcessError:
                    continue
                m = measure(x)
                scored.append((score(kind, m), f, x, m))
            scored.sort(key=lambda r: -r[0])
            if scored:
                best = scored[0]
                src_note = f"new ElevenLabs take {os.path.basename(best[1])} (of {len(scored)}): " + \
                    f"events {best[3]['events']}, crest {best[3]['crest_db']:.1f} dB, decay {best[3]['decay_s']:.2f} s, steady {best[3]['steady_db']:.1f} dB"
        if best is None and kind in REUSE:
            f = os.path.join(OLD, REUSE[kind][0])
            x = decode(f)
            m = measure(x)
            best = (0, f, x, m)
            src_note = f'reused {REUSE[kind][0]}: {REUSE[kind][1]}'
        if best is None and kind == 'prob_tick':
            y, sync = synth_prob_tick()
            sf.write(os.path.join(LIB, f'{kind}.wav'), y.astype(np.float32), SR)
            lib[kind] = {'file': f'{kind}.wav', 'sync_s': sync, 'class': 'hit', 'gain_db': GAIN.get(kind, -10), 'source': 'numpy synth'}
            report.append((kind, 'numpy synth: 2.4 kHz tick, 50 ms'))
            continue
        if best is None:
            report.append((kind, 'MISSING'))
            continue
        y, sync = trim(kind, best[2].copy(), best[3])
        sf.write(os.path.join(LIB, f'{kind}.wav'), y.astype(np.float32), SR)
        lib[kind] = {'file': f'{kind}.wav', 'sync_s': round(sync, 3), 'class': KIND_CLASS[kind], 'gain_db': GAIN.get(kind, -8),
                     'dur_s': round(len(y) / SR, 3), 'source': os.path.relpath(best[1], ROOT)}
        report.append((kind, src_note))
    json.dump(lib, open(os.path.join(LIB, 'lib.json'), 'w'), indent=1)
    with open(os.path.join(ROOT, 'audio', 'sfx', 'v2', 'SELECTION_V2.md'), 'w') as fh:
        fh.write('# V2 sound-effect library: what was picked and why (measured, see tools/sfx_lib.py)\n\n| kind | class | choice |\n|---|---|---|\n')
        for k, note in report:
            fh.write(f'| {k} | {KIND_CLASS.get(k, "")} | {note} |\n')
    missing = [k for k, n in report if n == 'MISSING']
    print(f'{len(lib)} kinds in the library; missing: {missing or "none"}')


if __name__ == '__main__':
    main()

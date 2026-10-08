#!/usr/bin/env python3
"""Build the Video 02 sound-effect library: pick one variation per kind, trim it, find its sync point, level it.

  python3 tools/sfx_lib.py            -> audio/sfx/v2/lib/<kind>.wav + audio/sfx/v2/lib/lib.json + SELECTION_V2.md

Sources: the ElevenLabs generations in audio/sfx/v2/raw/<kind>_v<k>.mp3 (flow "FGW Video 02 SFX", prompts in
audio/sfx/v2/prompts.tsv, ids and credits in raw/generation_log.json), plus a small numpy synth for prob_tick.
Copied from Video 01 V2; the pass-2 reuse table is gone (there is no pass-2 folder in this project).

Selection is measured, not listened to (same method as Video 01): every candidate is decoded to 48 kHz mono and
described by its 10 ms peak envelope (main transient, onset, number of separate events, decay) and, for sustained
sounds, how steady its level is. Each kind belongs to a class that says what a good take looks like:
  hit    one dominant transient, few extra events, quick decay; synced on the transient
  stroke a clean onset and one gesture of about the kind's target length; synced on the onset (first frame within 20 dB
         of the peak)
  stop   a movement that ends in a stop (mirror panel, drawer, book); synced on the stop (last frame within 20 dB of
         the peak)
  loop   steady level (low variation over 100 ms windows), longer takes preferred; looped with crossfades to any length
"""
import glob
import json
import os
import subprocess

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'audio', 'sfx', 'v2', 'raw')
LIB = os.path.join(ROOT, 'audio', 'sfx', 'v2', 'lib')
SR = 48000
rng = np.random.default_rng(7)

CLASS = {
    'hit': [
        # Video 02: the room, the sensor, light, the shelf, the warehouse
        'tiptoe_step', 'footstep_wood', 'sensor_pulse', 'bounce_tick', 'echo_return', 'readout_beep', 'partition_thunk',
        'mirror_ting', 'block_drop', 'rope_clip', 'tiny_clink', 'lock_click', 'shutter_click', 'film_tick', 'robot_beep',
        # generic
        'paper_slap', 'card_flick', 'pencil_tap', 'typewriter_tick', 'chip_pop', 'stamp_light', 'stamp_heavy', 'hanger_click',
        'thud_soft', 'pop_tick', 'logo_hit', 'bell_ding', 'gavel', 'machine_clunk', 'prob_tick'],
    'stroke': [
        'cloth_rustle', 'smug_exhale', 'readout_off', 'partition_wobble', 'paper_shred', 'confetti_settle', 'magnifier_slide',
        'ruler_extend', 'uh_oh', 'relief_sigh', 'shelf_creak', 'strip_rip', 'shoo', 'robot_brake', 'sun_glare',
        'paper_flap', 'paper_lift', 'paper_swish', 'paper_slide', 'card_slide', 'page_turn', 'tape_rip', 'marker_circle',
        'marker_sweep', 'glint', 'whoosh_soft', 'indicator_yes', 'indicator_no', 'scanner_sweep', 'printer_feed'],
    'stop': ['mirror_slide', 'drawer_open', 'drawer_close', 'book_slide'],
    'loop': ['sensor_hum', 'partition_scrape', 'arc_draw', 'clock_tick', 'robot_motor', 'machine_hum',
             'amb_room', 'amb_museum', 'amb_warehouse'],
}
KIND_CLASS = {k: c for c, ks in CLASS.items() for k in ks}

# Video 01 kinds (still in SFX_KINDS) that this library deliberately does not build
NOT_BUILT = ['conveyor_run', 'conveyor_clunk', 'token_select', 'token_lock', 'claim_fails', 'buzzer_wrong', 'ding_right',
             'score_flip', 'crowd_cheer', 'crowd_aww', 'fanfare_small', 'trophy_clink', 'trophy_steps',
             'amb_counter', 'amb_conveyor', 'amb_library', 'amb_gameshow', 'amb_machine']

# strokes: length of the one gesture a good take has (s, onset to last frame within 20 dB of the peak); default 0.5
STROKE_LEN = {
    'cloth_rustle': 0.6, 'smug_exhale': 0.5, 'readout_off': 0.35, 'partition_wobble': 0.8, 'paper_shred': 0.9,
    'confetti_settle': 1.4, 'magnifier_slide': 0.6, 'ruler_extend': 0.5, 'uh_oh': 0.8, 'relief_sigh': 1.0, 'shelf_creak': 0.7,
    'strip_rip': 0.6, 'shoo': 0.3, 'robot_brake': 0.6, 'sun_glare': 1.5, 'scanner_sweep': 1.0, 'printer_feed': 1.0,
}

# level of each kind in the effects stem before the mix (dB, applied to the measured reference level below:
# hits/strokes/stops peak at -6 dBFS, loops sit at -30 dBFS RMS; ambiences are re-levelled by mix_v2 --amb-lufs)
GAIN = {
    # the room and the characters
    'tiptoe_step': -10, 'footstep_wood': -8, 'cloth_rustle': -12, 'smug_exhale': -8, 'relief_sigh': -8,
    'partition_thunk': -5, 'partition_scrape': 6, 'partition_wobble': -8, 'mirror_slide': -8, 'mirror_ting': -10,
    # the sensor motif (small, never louder than a paper sound)
    'sensor_hum': -20, 'sensor_pulse': -10, 'bounce_tick': -13, 'echo_return': -12, 'readout_beep': -11, 'readout_off': -10,
    # graphics made physical
    'paper_shred': -7, 'confetti_settle': -10, 'block_drop': -8, 'magnifier_slide': -10, 'ruler_extend': -9, 'arc_draw': 2,
    'uh_oh': -7,
    # history shelf, small sensors, results
    'shelf_creak': -9, 'clock_tick': 2, 'rope_clip': -8, 'tiny_clink': -9, 'lock_click': -8, 'shutter_click': -9,
    'strip_rip': -9, 'shoo': -12, 'film_tick': -11,
    # warehouse
    'robot_motor': 0, 'robot_brake': -8, 'robot_beep': -9, 'sun_glare': -9,
    # ambiences (own stem)
    'amb_room': 0, 'amb_museum': 0, 'amb_warehouse': 0,
    # generic (Video 01 levels)
    'stamp_heavy': 0, 'stamp_light': -3, 'gavel': -1, 'logo_hit': -4, 'bell_ding': -7, 'paper_slap': -6, 'paper_slide': -7,
    'paper_flap': -8, 'paper_lift': -9, 'paper_swish': -8, 'card_flick': -8, 'card_slide': -7, 'page_turn': -9, 'tape_rip': -10,
    'marker_sweep': -9, 'marker_circle': -9, 'pencil_tap': -10, 'typewriter_tick': -10, 'hanger_click': -9, 'chip_pop': -11,
    'glint': -14, 'whoosh_soft': -12, 'thud_soft': -7, 'pop_tick': -10, 'prob_tick': -14, 'drawer_open': -6, 'drawer_close': -7,
    'book_slide': -8, 'machine_clunk': -6, 'machine_hum': -16, 'scanner_sweep': -9, 'indicator_yes': -8, 'indicator_no': -8,
    'printer_feed': -8,
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
        return -3 * max(0, m['events'] - 3) - 2 * abs(m['last_s'] - m['onset_s'] - STROKE_LEN.get(kind, 0.5)) + 0.2 * m['crest_db']
    if c == 'stop':
        return -2 * max(0, m['events'] - 3) + (2 if m['last_s'] - m['onset_s'] > 0.25 else 0)
    return -m['steady_db'] + 0.5 * min(m['dur_s'], 6.0)   # steady first; a longer loop repeats less audibly


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
                src_note = f"ElevenLabs take {os.path.basename(best[1])} (of {len(scored)}): " + \
                    f"events {best[3]['events']}, crest {best[3]['crest_db']:.1f} dB, decay {best[3]['decay_s']:.2f} s, steady {best[3]['steady_db']:.1f} dB"
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
        fh.write('# Video 02 sound-effect library: what was picked and why (measured, see tools/sfx_lib.py)\n\n| kind | class | choice |\n|---|---|---|\n')
        for k, note in report:
            fh.write(f'| {k} | {KIND_CLASS.get(k, "")} | {note} |\n')
        fh.write('\nNot built (Video 01 only): ' + ', '.join(NOT_BUILT) + '.\n')
    missing = [k for k, n in report if n == 'MISSING']
    print(f'{len(lib)} kinds in the library; missing: {missing or "none"}')


if __name__ == '__main__':
    main()

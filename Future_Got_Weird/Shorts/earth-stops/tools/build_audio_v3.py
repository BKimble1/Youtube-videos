#!/usr/bin/env python3
"""Mix for the V3 film (24.8 s, loops): Test Voice narration V3 (take B, cut only at its own pauses) + physical sound events (procedural numpy Foley, reused V2 ElevenLabs one-shots, five new ElevenLabs one-shots)
+ an optional restrained tension swell (original synthesis, separate stem) + a LOOP-CONTINUOUS brake bed (rotation hum + approach strain) split at the seam so sample N-1 runs straight into sample 0.
Usage: python3 tools/build_audio_v3.py
Reads  audio/v6/cues_v3.json (tools/build_cues_v3.mjs), audio/v6/voice/voice_v3_timeline.wav, audio/v6/sfx_gen/*.mp3 (new), audio/v5/sfx_gen/*.mp3 (V2), tools/foley_lib.py
Writes audio/v6/v3/sfx/*.wav, stems/*.wav, stems/mix_v3.wav (with swell), mix_v3_nomusic.wav, voice_only_v3.wav, sfx_only_v3.wav, music_only_v3.wav, SFX_LOG.csv, MIX_LOG.json
Every event carries a stated JOB. Levels are design targets set per event relative to the voice's RMS (dB re voiced RMS on the loudest 100 ms of the event), measured not heard; speech-band ducking by group; mixes are scaled to -15.5 LUFS / <= -1.5 dBTP."""
import csv, json, os, re, subprocess, sys, tempfile, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foley_lib as L
from foley_lib import SR, write_wav, norm, tgrid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/audio/v6/v3'
os.makedirs(f'{OUT}/sfx', exist_ok=True); os.makedirs(f'{OUT}/stems', exist_ok=True)
cv = json.load(open(f'{ROOT}/audio/v6/cues_v3.json'))
FPS = cv['fps']; N = cv['total_frames']; DUR = N / FPS; NS = int(round(DUR * SR))
EV = cv['events']; BD = EV['street']['bodies']
SPF = SR // FPS  # samples per frame (1600)
at = lambda f: f / FPS
LOG = []
GROUPS = ['bed', 'wind_air', 'impacts', 'friction', 'liquid', 'air_cloth', 'air2', 'bike', 'ui', 'steps', 'objects', 'wind', 'water', 'whirr', 'rush', 'globe', 'whoosh']
G = {k: np.zeros(NS) for k in GROUPS}
DUCK_LF = 2.0
DUCK_DB = {'wind_air': 4.0, 'bed': 12.0, 'impacts': 7.0, 'friction': 9.0, 'liquid': 12.0, 'air_cloth': 10.0, 'air2': 14.0, 'bike': 10.0, 'ui': 8.0, 'steps': 9.0, 'objects': 12.0, 'wind': 16.0, 'water': 16.0, 'whirr': 10.0, 'rush': 10.0, 'globe': 8.0, 'whoosh': 10.0}
# per-group make-up gain on every placed event: the effects only have to be audible where the narration is silent (speech-band ducking keeps them under the voice elsewhere), and the set-pieces sit in the voice gaps
GAIN_DB = {'wind_air': 2.0, 'water': 8.0, 'impacts': 4.0, 'objects': 4.0, 'wind': 5.0, 'rush': 4.0, 'air_cloth': 3.0, 'air2': 3.0, 'bike': 3.0, 'friction': 3.0, 'liquid': 3.0, 'whoosh': 4.0, 'globe': 3.0, 'ui': 0.0, 'steps': 0.0, 'whirr': 0.0, 'bed': 0.0}
G2 = f'{ROOT}/audio/v6/sfx_gen'; G1 = f'{ROOT}/audio/v5/sfx_gen'
NEW = {'lock': 'oSSc7tnXhapZmOcL98IA', 'strain': 'mwcSUnT0uiayBP17NEcA', 'clang': 'VGIjrNVlzGF9K2dUDEtF', 'pier_long': 'jDHpqBm9AZOBPQgIytSX', 'pier_short': 'SsDr2RtLDV3mBL8wYo4b', 'debris': 'kMnVYKIl4SpYF0aHiOJJ'}
GEN = 'elevenlabs-generated'


def fade(x, a=0.0, b=0.0):
    x = x.copy()
    if a: n = min(len(x), int(a * SR)); x[:n] *= np.linspace(0, 1, n)
    if b: n = min(len(x), int(b * SR)); x[-n:] *= np.linspace(1, 0, n)
    return x


with wave.open(f'{ROOT}/audio/v6/voice/voice_v3_timeline.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
voice = np.zeros(NS); voice[:min(NS, len(v))] = v[:NS]
w20 = int(0.02 * SR)
venv = np.sqrt(np.convolve(voice ** 2, np.ones(w20) / w20, mode='same'))
voice_rms = float(np.sqrt(np.mean(voice[venv > 0.02 * np.max(venv)] ** 2)))


def loud100(x):
    n = int(0.1 * SR)
    if len(x) <= n: return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
    c = np.cumsum(np.concatenate([[0.0], x ** 2])); return float(np.sqrt(np.max((c[n:] - c[:-n]) / n)) + 1e-12)


def place(group, name, x, frame, rel_db, job, source='procedural', end_fade=0.0, loud=None):
    """x: waveform; frame: film frame at which x starts (negative = head cropped); rel_db: loudest 100 ms of x (or of `loud`, a reference slice) at this many dB re the voice RMS"""
    t0 = frame / FPS; k = int(round(t0 * SR))
    x = fade(x, 0.0, end_fade) if end_fade else x
    ref = loud100(x if loud is None else loud)
    y = x * (voice_rms * 10 ** ((rel_db + GAIN_DB[group]) / 20) / ref)
    a = max(0, -k); k = max(0, k)
    m = max(0, min(len(y) - a, NS - k))
    if m > 0: G[group][k:k + m] += y[a:a + m]
    write_wav(f'{OUT}/sfx/{name}.wav', x / (np.max(np.abs(x)) + 1e-9) * 0.7)
    LOG.append({'file': f'audio/v6/v3/sfx/{name}.wav', 'frame': round(frame, 2), 'time_s': round(t0, 3), 'rel_db_to_voice': rel_db, 'group': group, 'source': source, 'job': job})


def load(path, hp=None, lp=None, a=0.0, b=None, rate=1.0):
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, dtype='<f4').astype(np.float64)
    if rate != 1.0: x = np.interp(np.arange(0, len(x) - 1, rate), np.arange(len(x)), x)  # re-pitch by resampling (also changes duration)
    if hp or lp: x = L.fft_filter(x, hp, lp)
    x = x[int(a * SR):int(b * SR) if b else None]
    return x / (np.max(np.abs(x)) + 1e-9) * 0.7


v2g = lambda name, pick, **kw: load(f'{G1}/{name}_{pick}.mp3', **kw)
v3g = lambda key, **kw: load(f'{G2}/{NEW[key]}.mp3', **kw)
slap = L.fx_tag_slap('v3_plate')

# ================================================================ 0. the brake bed (LOOP): rotation hum + approach strain, one continuous waveform split at the seam
rot_hz = 75 / DUR  # integer revolutions over the film so the hum is periodic over the loop
tt = np.arange(NS) / SR; rr = L.rng_for('v3_rot_bed')
nzr = L.fft_filter(rr.standard_normal(NS), 28, 120) * 1.4
nzt = L.fft_filter(rr.standard_normal(NS), 150, 280)  # a thrum below the speech band (phones still carry 150-280 Hz)
nza = L.fft_filter(rr.standard_normal(NS), 3600, 8000)  # chopped air above the speech band: the 300-3400 Hz band stays clear for the narration
rev = (0.55 + 0.45 * np.sin(2 * np.pi * rot_hz * tt)) ** 1.4
rot_bed = 0.9 * (nzr + 0.5 * np.sin(2 * np.pi * (1166 / DUR) * tt + 0.4 * np.sin(2 * np.pi * (131 / DUR) * tt))) + 1.1 * nzt * rev + 0.6 * nza * rev  # circular filtering + integer cycles: sample NS-1 runs into sample 0
rot_bed = rot_bed / np.sqrt(np.mean(rot_bed ** 2))
# level curve of the hum (1 = the opening level): full while the planet turns (frames 0-14), cut dead at the pad lock, silent while the planet is stopped,
# returns softly under "move with Earth" and the pull-out onto the turning Earth (444-500), and swells back to the opening level by the loop point
def rot_gain(f):
    c = EV['brake']['contact']; g = np.zeros_like(f, dtype=float)
    g[f < c] = 1.0
    lo = 10 ** (-8 / 20)
    a, b = EV['stage']['shrink']
    r0 = a - 26  # the hum starts to return under "move with Earth", before the pull-out, so the calm never drops to dead air
    r1 = np.clip((f - r0) / (b + 4 - r0), 0, 1); r2 = np.clip((f - 596) / (N - 596), 0, 1) ** 1.3
    late = (f >= r0)
    g[late] = (lo * r1 + (1 - lo) * r2)[late] * 1.0
    return g
fr = np.arange(NS) / SPF
rg = rot_gain(fr)
k_c = EV['brake']['contact'] * SPF
rg[k_c - int(0.001 * SR):k_c] *= np.linspace(1, 0, int(0.001 * SR))  # 1 ms cut at the lock
rot_g = rot_bed * rg
ref_rot = loud100(rot_bed[:k_c])
G['bed'] += rot_g * (voice_rms * 10 ** (-10.0 / 20) / ref_rot)
LOG.append({'file': 'procedural: periodic rotation hum (audio/v6/v3/stems/foley_bed.wav)', 'frame': 0, 'time_s': 0.0, 'rel_db_to_voice': -10.0, 'group': 'bed', 'source': 'procedural (periodic over the loop)', 'job': 'the planet turns: a low hum chopped once per revolution; cut dead at the pad lock (f14); silent while the planet is stopped; returns softly when the picture pulls out onto the turning Earth and swells to the opening level at the loop point'})

# approach strain: pads closing. One continuous event over t = -18 ... 14 frames (relative to frame 0), split at the seam: the tail piece sits at the end of the film, the head piece at the start.
T_A, T_B = -18, EV['brake']['contact']
nt = int((T_B - T_A) / FPS * SR); ta = np.arange(nt) / SR + T_A / FPS
pad_gap = lambda t: np.where(t >= T_B, 0.0, np.where(t <= -16, 130.0, 130.0 * (1 - np.power(np.clip((t + 16) / (T_B + 16), 0, 1), 2.1))))
prog = 1 - pad_gap(ta * FPS) / 130.0
servo_f = 3300 + 1900 * prog ** 1.4  # a whine that rises with the closing speed, kept above the speech band (fundamental 3.3-5.2 kHz)
servo = np.sin(2 * np.pi * np.cumsum(servo_f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(servo_f * 2.01) / SR) + 0.25 * np.sin(2 * np.pi * np.cumsum(servo_f * 3.02) / SR)
servo *= (0.10 + 0.9 * prog ** 1.5)
st_gen = v3g('strain', hp=3200, a=0.0, b=0.95)
st_gen = np.concatenate([st_gen, np.zeros(max(0, nt - len(st_gen)))])[:nt] * (0.15 + 0.85 * prog ** 1.2)
strain = 0.6 * servo / np.max(np.abs(servo)) + 0.7 * st_gen / np.max(np.abs(st_gen))
strain = L.fft_filter(strain, 1500, 9000)
strain[-int(0.001 * SR):] *= np.linspace(1, 0, int(0.001 * SR))  # cut dead at the lock
ref_strain = loud100(strain)
sy = strain * (voice_rms * 10 ** (-9.0 / 20) / ref_strain)
n_tail = int(-T_A / FPS * SR)
G['bed'][NS - n_tail:] += sy[:n_tail]  # tail: frames 726-743 (t = -18 ... -1)
G['bed'][:nt - n_tail] += sy[n_tail:]  # head: frames 0-14 (t = 0 ... 14)
write_wav(f'{OUT}/sfx/loop_strain_full_event.wav', strain / np.max(np.abs(strain)) * 0.7)
LOG.append({'file': 'audio/v6/v3/sfx/loop_strain_full_event.wav', 'frame': T_A, 'time_s': round(T_A / FPS, 3), 'rel_db_to_voice': -9.0, 'group': 'bed', 'source': 'procedural servo + elevenlabs-generated strain (high-passed 3.2 kHz, above the speech band)', 'job': 'the pads close: one rising strain split at the loop seam (18 frames at the end of the film, 14 at the start), cut dead at the lock'})

# ================================================================ 1. contact: the lock (f14)
C = EV['brake']['contact']
place('impacts', 'brake_lock_clack_gen', v3g('lock', hp=350, b=0.16), C, -11.0, 'the pads lock on the ring: one hard metallic clack (generated; high-passed 350 Hz; trimmed to its first 160 ms so the ring-down does not sit on the vowel of "stopped")', GEN, end_fade=0.07)
place('impacts', 'brake_lock_body', L.fx_thud('v3_lock_body', 220, 70, 0.10, 0.9, 0.22), C, -14.0, 'mid body of the lock (200-400 Hz carries on a phone speaker)')
place('impacts', 'brake_stop_sub', v2g('ground_stop', 'B', lp=140), C - 1, -13.0, 'sub layer under the stop: the whole planet arrested (generated in V2, low-passed 140 Hz)', GEN)

# ================================================================ 2. the cut and the personal danger (f20-36)
CUT, HA, HB = EV['brake']['cut'], EV['hold'][0], EV['hold'][1]
rsh = L.fx_rush('v3_p1_rush', at(HB - CUT)) * np.linspace(0.45, 1.0, int(at(HB - CUT) * SR)) ** 1.2
place('air_cloth', 'p1_air_rush', rsh, CUT, -19.0, 'air past her while the camera rides with her: the carried-east rush', end_fade=0.02)
place('friction', 'p1_shoe_chirp', L.fx_rubber_chirp('v3_chirp'), CUT, -17.0, 'her shoes grab the pavement and slip as the ground stops under her')
place('impacts', 'p1_feet_release', L.fx_launch('v3_launch'), CUT + 2, -15.0, 'shoe release: her feet leave the pavement')
place('liquid', 'p1_coffee_stream', L.fx_coffee_jet('v3_p1_jet', at(HB - CUT - 1)), CUT, -13.0, 'coffee thrown from the mug as a tapering stream (the loose thing keeps going)')
for i, fq in enumerate([27, 29]):
    place('liquid', f'p1_coffee_splat_{i}', L.fx_splat(f'v3_p1_splat{i}', 1100 + 120 * i), fq, -17.0 - i, 'coffee drops hit the pavement', end_fade=0.02)
place('air_cloth', 'p1_scarf', L.fx_flap('v3_p1_flap', at(HB - CUT), 14.0, 19.0), CUT, -24.0, 'scarf and cuffs flutter')
place('whoosh', 'p1_pole_approach', L.fx_swoosh('v3_p1_pole', at(HA - CUT - 1), (120, 600), (500, 1800), up=True), CUT + 4, -22.0, 'the lamp post looms: a low air-pressure swell that builds toward the beat')

# ================================================================ 3. P2: the street stands still; the loose things go east
P2 = EV['hold'][1]
place('whoosh', 'p2_cut_air_release', L.fx_swoosh('v3_p2_release', 0.45, (150, 700), (700, 2600), up=False), HB, -23.0, 'the cut releases the held beat: air comes back as the world streams east')
place('ui', 'p2_chip_ground', L.fx_stamp_tap('v3_chip_g'), EV['wideA'] + 6, -26.0, 'GROUND 0 MPH label lands')
mug = BD['mug']
place('liquid', 'p2_mug_pass', L.fx_ceramic_tick('v3_mug_pass'), mug['centre'], -23.0, 'the mug and its coffee go past')
for i, ff in enumerate(mug['floor']):
    place('liquid', f'p2_mug_floor_{i}', L.fx_ceramic_tick('v3_mug_floor'), ff, -17.0, 'ceramic tick: the mug hits the pavement')
    place('friction', f'p2_mug_skid_{i}', L.fx_scrape('v3_mug_skid', 0.25, f0=240, f1=150, att=0.004, rel=0.05), ff + 1, -22.0, 'ceramic scrapes along stone')
bike = BD['bike']; bh = EV['street']['bike_hit']
bd = at(bh - bike['on'][0])
place('bike', 'p2_bike_roll_in', L.fx_freewheel('v3_bike_in', bd, 22.0, 18.0) * np.linspace(0.4, 1.0, int(bd * SR)), bike['on'][0], -20.0, 'bicycle mechanics: the riderless bicycle freewheels in on the east-bound stream', end_fade=0.02)
place('impacts', 'p2_bike_lamp_clang_gen', v3g('clang', hp=250), bh, -6.0, 'impact: the bicycle strikes the lamp post, clang (generated, high-passed 250 Hz)', GEN)
tl = L.tgrid(0.9); lamp_ring = (L.ping(tl, 1180, 5.0, 0.6) + L.ping(tl, 2310, 7.0, 0.3) + L.ping(tl, 640, 4.0, 0.3)) * np.minimum(1, tl / 0.002)
place('impacts', 'p2_lamp_ring', norm(lamp_ring, 0.8), bh + 1, -15.0, 'the lamp post rings after the hit (wobbles in the picture)')
bd2 = at(bike['on'][1] - bh)
place('bike', 'p2_bike_tumble', L.fx_freewheel('v3_bike_tumble', bd2, 20.0, 7.0) * np.exp(-tgrid(bd2) / 0.9), bh + 2, -19.0, 'bicycle mechanics: wheels spin down as it flips and carries on', end_fade=0.05)
chair = BD['chairA']; ch_h = EV['street']['chair_hit']
place('impacts', 'p2_chair_palm_thwack', L.fx_thud('v3_chair_palm', 280, 90, 0.07, 0.95, 0.3), ch_h, -11.0, 'impact: a chair slams into the palm trunk')
place('air2', 'p2_palm_shake', L.fx_fronds('v3_palm_shake', 0.9) * np.exp(-tgrid(0.9) / 0.5), ch_h, -20.0, 'the palm shakes its fronds after the hit')
cc = v2g('chair_tip', 'B', hp=120)
place('objects', 'p2_chair_clatter', cc[int(1.30 * SR):], ch_h + 2, -18.0, 'the chair bounces off and clatters (generated in V2)', GEN)
box = v2g('box_tumble', 'B', hp=100)
place('objects', 'p2_boxA_tumble', box, BD['boxA']['centre'] - 14, -19.0, 'cardboard box tumbles past (generated in V2)', GEN)
place('objects', 'p2_boxB_scuff', L.fx_cardboard_scrape('v3_boxB', 0.5), BD['boxB']['centre'] - 8, -20.0, 'a bigger box scuffs past, nearer the lens')
bn = BD['bin']; bdur = at(bn['on'][1] - bn['on'][0])
place('objects', 'p2_bin_roll', L.fx_roll('v3_bin', bdur, 6.5, 4.0) * np.sin(np.pi * np.clip(tgrid(bdur) / bdur, 0, 1)) ** 0.7, bn['on'][0], -18.0, 'the foreground bin rolls past (swell as it crosses)', end_fade=0.04)
place('objects', 'p2_bin_clunk', L.fx_clunk('v3_bin_clunk'), bn['centre'], -23.0, 'hollow knock as the bin hits a kerb seam')
place('objects', 'p2_chairB', L.fx_cone_clack('v3_chairB'), BD['chairB']['centre'] - 6, -23.0, 'hollow plastic chair clacks past')
place('objects', 'p2_pot', L.fx_pot_tip('v3_pot'), BD['potA']['centre'] - 8, -21.0, 'a clay pot tips and scatters soil as it goes')
place('objects', 'p2_chairC', v2g('chair_tip', 'A', hp=140, b=0.9), BD['chairC']['centre'] - 10, -22.0, 'a third chair clatters through (generated in V2, variant A)', GEN)
place('objects', 'p2_boxC', L.fx_cardboard_scrape('v3_boxC', 0.45), BD['boxC']['centre'] - 6, -22.0, 'another box flutters by')
place('ui', 'p2_plate', slap, int(round(cv['events']['words']['thousand'] * FPS)) - 4, -18.0, 'the ~1,000 MPH plate lands')
place('ui', 'p2_chip_equator', L.fx_stamp_tap('v3_chip_eq'), int(round(cv['events']['words']['equator'] * FPS)) - 3, -23.0, 'EQUATOR label lands')
for i, ff in enumerate([46, 62, 74, 97, 110, 127]):
    place('air2', f'p2_paper_{i}', L.fx_paper_swish(f'v3_paper{i}', 0.28 + 0.04 * (i % 3)), ff, -26.0 + (i % 2), 'loose paper is swept by')
place('wind', 'p2_wind_palms', v2g('wind_palms', 'A', hp=140), 106, -21.0, 'air/foliage: wind through the palms, building (generated in V2)', GEN)

# ================================================================ 4. wind: the camera follows the debris (f150-238)
TA, TBk = EV['track']
wind = np.array(cv['curves']['wind']); camv = np.array(cv['curves']['camv'])
curve = lambda arr, t0, n: np.interp((np.arange(n) / SR + t0) * FPS, np.arange(len(arr)), arr)
g1 = L.fx_gust('v3_gust1', at(TBk - 96 + 14), 90, 1100, 0.0, 0.16, 0.9) * curve(wind, at(96), int(at(TBk - 96 + 14) * SR)) ** 0.5
place('wind', 'p3_gust_a', g1, 96, -19.0, 'air: the wind builds under the debris and keeps building (follows the picture\'s wind curve)')
g2 = L.fx_gust('v3_gust2', at(TBk - TA + 6), 120, 1800, 0.2, 0.2, 0.7) * curve(wind, at(TA - 6), int(at(TBk - TA + 6) * SR)) ** 0.5
place('wind', 'p3_gust_b', g2, TA - 6, -17.0, 'air: the second gust as the camera starts to ride east with the debris')
place('rush', 'p3_camera_rush', fade(L.fx_rush('v3_p3_rush', at(TBk - 146)) * curve(camv, at(146), int(at(TBk - 146) * SR)) ** 1.1, 0.1, 0.1), 146, -22.0, 'the camera accelerates east with the stream: air rush follows the camera speed')
dpool = [(TA + 2, 1.00), (TA + 22, 1.12), (TA + 46, 0.90)]
for i, (ff, rt) in enumerate(dpool):
    place('objects', f'p3_debris_gen_{i}', v3g('debris', hp=200, rate=rt), ff, -18.0 - 2 * i, 'wind with tumbling cardboard and plastic passes the lens (generated; re-pitched per pass so the passes are not identical)', GEN)
place('air2', 'p3_fronds', L.fx_fronds('v3_p3_fronds', at(TBk - TA - 10)) * curve(wind, at(TA), int(at(TBk - TA - 10) * SR)), TA, -21.0, 'palm fronds thrash as the wind loads them')
place('air2', 'p3_flag', L.fx_flap('v3_p3_flag', 2.6, 14.0, 20.0) * curve(wind, at(TA + 6), int(2.6 * SR)), TA + 6, -25.0, 'a flag snaps out')
for i, pf in enumerate(EV['posts']):
    place('air2', f'p3_post_pass_{i}', L.fx_thud(f'v3_post{i}', 130 - 12 * i, 56, 0.10, 0.3, 0.25) * (0.7 + 0.15 * i), pf - 1, -23.0, 'a foreground post sweeps past the lens (air-pressure pulse; pitch drops each time, so no repeated whoosh)')
for i, ff in enumerate([156, 168, 181, 194, 208, 219]):
    place('air2', f'p3_paper_{i}', L.fx_paper_swish(f'v3_p3paper{i}', 0.3), ff, -24.0 + (i % 2), 'sheets and litter are swept past')

def wind_air(name, dur, cur):
    """wind kept OUT of the speech band: a rumble (40-250 Hz) and a hiss (3.6-9 kHz) under a slow gust envelope, so it can stay audible under the narration without masking it"""
    r = L.rng_for(name); t = tgrid(dur); n = len(t)
    lo = L.fft_filter(r.standard_normal(n), 40, 250); hi = L.fft_filter(r.standard_normal(n), 3600, 9000)
    turb = 0.7 + 0.3 * np.sin(2 * np.pi * (0.7 * t + r.random())) * np.sin(2 * np.pi * (0.31 * t + r.random()))
    return norm((1.0 * lo + 0.8 * hi) * turb * cur, 0.8)
w_t0, w_t1 = 96, TBk
wa = wind_air('v3_wind_air', at(w_t1 - w_t0), curve(wind, at(w_t0), int(at(w_t1 - w_t0) * SR)) ** 0.7)
place('wind_air', 'p3_wind_air_bands', fade(wa, 0.3, 0.1), w_t0, -17.0, 'air: the wind as a force you can hear under the narration: a rumble below and a hiss above the speech band (follows the picture\'s wind curve)')
tp = EV['tarp']
place('air_cloth', 'tarp_snap', L.fx_flap('v3_tarp_snap', 0.7, 20.0, 30.0) * np.linspace(0.6, 1.0, int(0.7 * SR)), tp['a'] - 1, -10.0, 'a torn awning whips into the lens: cloth snaps')
place('impacts', 'tarp_whump', L.fx_thud('v3_tarp_whump', 170, 70, 0.14, 0.2, 0.4), tp['mid'][0], -14.0, 'the awning covers the lens: a soft cloth whump')
place('air_cloth', 'tarp_tail', L.fx_gust('v3_tarp_tail', at(tp['b'] + 8 - tp['mid'][0]), 150, 2200, 0.0, 0.3, 0.6), tp['mid'][0], -14.0, 'cloth flaps across the whole lens, then clears')

# ================================================================ 5. coast
CO = EV['coast']; HIT = CO['hit']
place('water', 'coast_calm_lap', fade(L.fx_surge('v3_lap', at(CO['swell'] + 6 - CO['a']), 0.5, 0.35, 0), 0.2, 0.6), CO['a'] + 2, -25.0, 'the sea laps against the pier posts; the cut out of the wind is a cut into relative calm')
crest = np.array(cv['curves']['crest'])
sw_n = int(at(HIT - CO['swell'] + 8) * SR)
swell = L.fx_surge('v3_swell', at(HIT - CO['swell'] + 8), 1.0, 0.22, 0) * curve(crest, at(CO['swell']), sw_n) ** 0.8
place('wind_air', 'coast_wind_air', fade(wind_air('v3_coast_wind_air', 2.2, np.linspace(0.5, 0.9, int(2.2 * SR))), 0.3, 0.3), CO['a'] + 4, -19.0, 'air: the storm wind on the coast, thinner than in the street (bands outside the speech band)')
place('wind', 'coast_wind', L.fx_gust('v3_coast_wind', 2.2, 110, 1500, 0.0, 0.18, 0.8), CO['a'] + 6, -24.0, 'air: the storm wind is still there on the coast, thinner than in the street')
place('water', 'coast_swell_build', swell, CO['swell'], -16.0, 'sea mass: the swell heaves up out of the bay and keeps growing (follows the crest height)')
pier = v3g('pier_long', hp=120)
snap_t = float(np.argmax(np.abs(pier))) / SR
creak0, creak1 = 1.0, snap_t - 0.15
place('objects', 'pier_creak_gen', pier[int(creak0 * SR):int(creak1 * SR)], HIT - (snap_t - creak0) * FPS, -22.0, 'the pier posts creak under the load (generated; the quiet creaks are given their own level)', GEN, end_fade=0.05)
place('impacts', 'pier_snap_gen', pier[int((snap_t - 0.15) * SR):int((snap_t + 0.9) * SR)], HIT - 0.15 * FPS, -8.0, 'the pier planks snap as the front arrives (generated; aligned to the front\'s contact frame)', GEN, end_fade=0.05)
place('water', 'coast_front_gen', v2g('sea_surge', 'B', hp=60), HIT - 24, -20.0, 'sea mass: the front rolls toward the pier (generated in V2)', GEN)
place('water', 'coast_wall_gen', v2g('sea_wall', 'A', hp=40), HIT, -6.0, 'sea contact: the front hits the pier and the wall (generated in V2: thump + broadband crash)', GEN)
place('water', 'coast_wall_body', L.fx_wave_slap('v3_wall', 0.9, 1.3, 0.7), HIT, -11.0, 'sea contact: body of the impact (procedural, 120-1500 Hz)')
place('impacts', 'coast_hit_sub', v2g('ground_stop', 'B', lp=120), HIT, -14.0, 'sub under the front hit (generated in V2, low-passed 120 Hz)', GEN)
place('objects', 'coast_planks_gen', v3g('pier_short', hp=300), HIT + 3, -14.0, 'planks splinter and fly off the pier (generated)', GEN)
place('water', 'coast_front_rush', L.fx_surge('v3_front_rush', 1.9, 1.0, 0.8, 6), HIT, -19.0, 'sea mass: the front keeps moving east through the frame')
place('water', 'coast_flood', L.fx_surge('v3_flood', 1.1, 0.3, 1.0, 10), CO['flood'], -15.0, 'sea mass: water pours over the promenade and the foreground')
place('water', 'coast_spray_burst', L.fx_surge('v3_spray', 1.1, 0.1, 1.5, 12), CO['band'][0] - 4, -13.0, 'the foam-edged water band sweeps the frame: spray carries the cut into the calm stage')

# ================================================================ 6. the explanation
ST = EV['stage']
foot = L.fx_footstep('v3_step', 0.6, 1.4)
for i, fr_ in enumerate([ST['a'] + 2.5 + 15 * k for k in range(0, 6) if ST['a'] + 2.5 + 15 * k < ST['shrink'][0] - 4]):
    place('steps', f'stage_step_{i:02d}', foot, fr_, -28.0 - 2.0 * (i % 2), 'a calm footstep: she is walking normally on the moving Earth')
place('ui', 'stage_chip', L.fx_stamp_tap('v3_chip_nd'), ST['chip'], -24.0, 'NORMAL DAY label lands')
for i, fa in enumerate(ST['arrows']):
    place('ui', f'stage_arrow_{i}', L.fx_pop(f'v3_arrow{i}'), fa, -23.0, 'one of three equal arrows pops in: she, the mug and the bike share one motion')
place('air2', 'stage_pigeon', L.fx_flap('v3_pigeon', 1.4, 7.0, 8.5) * np.linspace(1, 0.5, int(1.4 * SR)), ST['a'] + 8, -29.0, 'the pigeon hovers beside her in the carried-along air')
GL = EV['globe']
sh0, sh1 = ST['shrink']
place('whoosh', 'shrink_pull_out', fade(L.fx_swoosh('v3_pull', at(sh1 - sh0 + 6), (160, 900), (900, 3400), up=True), 0.05, 0.1), sh0 - 2, -22.0, 'the picture pulls out from her walking slab onto the turning Earth (the one move that carries the cut)')
place('ui', 'globe_pop_equator', L.fx_pop('v3_pop_eq'), sh1, -23.0, 'the equator marker appears on the globe')
place('ui', 'globe_chip_equator', L.fx_stamp_tap('v3_chip_eq2'), GL['chipEq'], -25.0, 'EQUATOR label')
w_eq = L.fx_spin_whirr('v3_marker_eq', at(GL['move'][1] - sh1 + 6), rev_hz=7.0)
place('whirr', 'globe_marker_equator', fade(w_eq, 0.15, 0.5), sh1 + 2, -26.0, 'speed: the equator marker whirrs fast (fast ground)')
w_po = L.fx_spin_whirr('v3_marker_pole', at(EV['finale']['finA'] - GL['poleIn'] + 2), rev_hz=2.0)
place('whirr', 'globe_marker_pole', fade(w_po, 0.3, 0.4), GL['poleIn'], -28.0, 'speed: near the pole the same whirr is slower (lower ground speed)')
place('ui', 'globe_chip_pole', L.fx_stamp_tap('v3_chip_pole'), GL['chipPole'], -25.0, 'NEAR A POLE label')
FI = EV['finale']
place('globe', 'finale_ring_bloom', L.fx_ring_bloom('v3_ring', 0.5), FI['ring'][0], -20.0, 'the equator line swells into the rotor ring')
place('globe', 'finale_caliper_slide', fade(L.fx_swoosh('v3_caliper', at(FI['caliper'][1] - FI['caliper'][0]) + 0.1, (100, 520), (520, 1700), up=True), 0.05, 0.02), FI['caliper'][0], -21.0, 'the brake slides back in from the frame edge (motor glide)')
place('impacts', 'finale_caliper_seat', L.fx_clunk('v3_seat'), FI['caliper'][1], -13.0, 'the bracket seats: the same opening composition is back, and the pads start to close (the strain bed takes over)')

# ================================================================ 7. tension swell (optional): original synthesis, restrained, no melody; cut before the wave hit
def tension(dur):
    t = tgrid(dur); n = len(t); r = L.rng_for('v3_tension'); u = np.clip(t / dur, 0, 1); env = u ** 1.7
    drone = (np.sin(2 * np.pi * 55.0 * t + 0.3 * np.sin(2 * np.pi * 0.21 * t)) + 0.55 * np.sin(2 * np.pi * 82.4 * t) + 0.35 * np.sin(2 * np.pi * 110.3 * t) + 0.3 * np.sin(2 * np.pi * 165 * t) + 0.45 * np.sin(2 * np.pi * 220.0 * t) + 0.3 * np.sin(2 * np.pi * 329.6 * t))
    sweep = L.fft_filter(r.standard_normal(n), 250, 1400) * (0.3 + 0.7 * u) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.8 + 2.0 * u) * t))
    return L.fft_filter((0.8 * drone + 0.5 * sweep) * env, 40, 1600)
t0m, t1m = 150, 302
mus_k0 = int(round(at(t0m) * SR)); mus_x = tension(at(t1m - t0m)); mus_x = fade(mus_x, 0.0, 0.05)
MUSIC = np.zeros(NS); MUSIC[mus_k0:mus_k0 + len(mus_x)] = mus_x * (voice_rms * 10 ** (-13.0 / 20) / loud100(mus_x))  # -13 dB re the voice's voiced RMS at its loudest 100 ms (V2 used -27 and was effectively inaudible: ~-50 dBFS)
LOG.append({'file': 'audio/v6/v3/stems/music.wav', 'frame': t0m, 'time_s': round(at(t0m), 3), 'rel_db_to_voice': -13.0, 'group': 'music', 'source': 'procedural (original synthesis)', 'job': 'optional restrained tension: a melody-free swell under the wind and the swell, cut at f302 so the silence before the wave hit is real (separate stem)'})

# ================================================================ 8. gates: controlled silences in the supporting layers (never the narration)
def gate(x, f0, f1, db, ramp_s=0.003):
    t = np.arange(len(x)) / SR; a, b = f0 / FPS, f1 / FPS
    m = np.minimum(np.clip((t - a + ramp_s) / ramp_s, 0, 1), np.clip((b - t + ramp_s) / ramp_s, 0, 1))
    return x * (1 - (1 - 10 ** (-db / 20)) * m)
GATES = [
    (HA, HB, [g for g in GROUPS], 40.0, 'suspended beat f31-36: the supporting layer drops almost to nothing for 5 frames as the lamp post fills the frame (the narration is in its own pause there)'),
    (C, C + 5, ['bed'], 60.0, 'the rotation bed is cut dead at the lock and stays silent'),
    (HIT - 12, HIT, ['wind', 'wind_air', 'water', 'air2', 'air_cloth', 'rush', 'whoosh'], 26.0, 'twelve frames of near silence in the ambient layers before the wave hits; only the pier creak (objects) remains'),
]
for g0, g1_, gs, db, why in GATES:
    for g in gs:
        if g in G: G[g] = gate(G[g], g0, g1_, db)
    LOG.append({'file': 'gate', 'frame': g0, 'time_s': round(at(g0), 3), 'rel_db_to_voice': -db, 'group': '+'.join(gs[:4]) + ('...' if len(gs) > 4 else ''), 'source': 'mix automation', 'job': why})
MUSIC = gate(MUSIC, HIT - 18, HIT, 40.0)  # the swell is long gone before the hit; belt and braces

# ================================================================ 9. mix: speech-band ducking per group, voice untouched
att, rel = 0.005, 0.120
ve = np.sqrt(np.convolve(voice ** 2, np.ones(int(0.025 * SR)) / int(0.025 * SR), mode='same'))
act = np.clip((ve / (np.max(ve) + 1e-9) - 0.01) / 0.03, 0, 1)
sm = np.zeros(NS); a_c, r_c = 1 - np.exp(-1 / (att * SR)), 1 - np.exp(-1 / (rel * SR)); cur = 0.0
for i in range(NS):
    cur += ((a_c if act[i] > cur else r_c)) * (act[i] - cur); sm[i] = cur
# the loop seam: the speech activity at the very end/start is zero (voice ends 22.7 s, begins 0.05 s) so the ducker is open on both sides of the seam
stems = {}
for g, x in G.items():
    if not np.any(np.abs(x) > 1e-9): continue
    lf = L.fft_filter(x, None, 280); hf = x - lf
    stems[g] = lf * (1 - (1 - 10 ** (-DUCK_LF / 20)) * sm) + hf * (1 - (1 - 10 ** (-DUCK_DB[g] / 20)) * sm)
    write_wav(f'{OUT}/stems/foley_{g}.wav', stems[g])
_ml = L.fft_filter(MUSIC, None, 280); MUS = _ml * (1 - (1 - 10 ** (-3.0 / 20)) * sm) + (MUSIC - _ml) * (1 - (1 - 10 ** (-16.0 / 20)) * sm)
write_wav(f'{OUT}/stems/music.wav', MUS)
write_wav(f'{OUT}/stems/voice.wav', voice)
sfx_sum = sum(stems.values())
lim = lambda x, c: c * np.tanh(x / c)
_sl = L.fft_filter(sfx_sum, None, 130)
sfx_sum = (sfx_sum - _sl) + _sl * 10 ** (-8.0 / 20)  # phones cannot reproduce < ~130 Hz: sub layers are shelved 8 dB so the 150-3400 Hz body of the events is not squashed and the mix level is not spent on inaudible bass
sfx_sum = lim(sfx_sum, 0.30)
mix_music = voice + sfx_sum + MUS
mix_nomusic = voice + sfx_sum


def ebur(x):
    p = tempfile.NamedTemporaryFile(suffix='.wav', delete=False, dir=OUT).name
    write_wav(p, np.stack([x, x], axis=1))
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    os.remove(p)
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return g('I'), g('Peak')


res = {}
for tag, mx in (('mix_v3', mix_music), ('mix_v3_nomusic', mix_nomusic)):
    I0, P0 = ebur(mx); g_db = -15.5 - I0; m2 = mx * 10 ** (g_db / 20); I1, P1 = ebur(m2)
    if P1 > -1.5: g_db -= (P1 + 1.5); m2 = mx * 10 ** (g_db / 20); I1, P1 = ebur(m2)
    write_wav(f'{OUT}/stems/{tag}.wav', np.stack([m2, m2], axis=1)); res[tag] = {'before': [I0, P0], 'scale_db': round(g_db, 2), 'final': [I1, P1],
        'loop_seam': {'first_sample': float(m2[0]), 'last_sample': float(m2[-1]), 'rms_last_20ms': float(np.sqrt(np.mean(m2[-960:] ** 2))), 'rms_first_20ms': float(np.sqrt(np.mean(m2[:960] ** 2)))}}
sc = 10 ** (res['mix_v3']['scale_db'] / 20)
for nm, arr in (('voice_only_v3', voice * sc), ('sfx_only_v3', sfx_sum * sc), ('music_only_v3', MUS * sc)):
    write_wav(f'{OUT}/stems/{nm}.wav', np.stack([arr, arr], axis=1))
write_wav(f'{OUT}/stems/foley_bed.wav', G['bed'])
with open(f'{OUT}/SFX_LOG.csv', 'w', newline='') as fh:
    wr = csv.DictWriter(fh, fieldnames=['file', 'frame', 'time_s', 'rel_db_to_voice', 'group', 'source', 'job']); wr.writeheader()
    for row in sorted(LOG, key=lambda r: r['time_s']): wr.writerow(row)
json.dump({'voice_rms_dBFS_voiced': round(20 * np.log10(voice_rms), 1), 'duck_dB_under_speech': DUCK_DB, 'duck_lf_dB': DUCK_LF, 'new_generated_clips': NEW, 'v2_generated_picks': {'sea_wall': 'A', 'sea_surge': 'B', 'chair_tip': 'B/A', 'box_tumble': 'B', 'wind_palms': 'A', 'ground_stop': 'B'},
           'mixes': res, 'placed_events': len(LOG), 'pier_snap_time_in_clip_s': round(snap_t, 3),
           'note': 'levels are design targets from measurement, not listening results; the tension swell is original synthesis and a separate stem; mix_v3_nomusic is the same mix without it; the loop bed is continuous over the seam by construction (periodic hum, strain split at t=0)'}, open(f'{OUT}/MIX_LOG.json', 'w'), indent=1)
print(f"events {len(LOG)}; mix {len(mix_music) / SR:.3f} s (film {DUR:.3f} s); with swell {res['mix_v3']['final'][0]:.1f} LUFS / {res['mix_v3']['final'][1]:.1f} dBTP; no swell {res['mix_v3_nomusic']['final'][0]:.1f} LUFS / {res['mix_v3_nomusic']['final'][1]:.1f} dBTP; pier snap at {snap_t:.2f} s")

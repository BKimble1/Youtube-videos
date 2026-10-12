#!/usr/bin/env python3
"""Procedural Foley for the v2 previews: E-A v2 ("ea2") and E-C ("ec1"). numpy only, deterministic; no samples, no generation model, no paid service.

Usage:  python3 tools/build_audio_v2.py ea2|ec1
Reads   audio/v2/cues_<variant>.json   (written by tools/build_cues_v2.mjs from the same choreography that draws the picture)
Writes  audio/v2/<variant>/sfx/*.wav       isolated one-shots (mono, 48 kHz, 16-bit)
        audio/v2/<variant>/stems/*.wav     per-group stems and effects_<variant>.wav (stereo, identical channels = mono-safe), exactly the video length
        audio/v2/<variant>/SFX_LOG.csv     every placed event: file, frame, time, gain, stem, note
The effects are stylised Foley for an illustrated what-if, not recordings.
"""
import csv, json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from foley_lib import *  # noqa: F401,F403
import foley_lib as L

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAR = sys.argv[1]
assert VAR in ('ea2', 'ec1')
EC = VAR == 'ec1'
cues = json.load(open(f'{ROOT}/audio/v2/cues_{VAR}.json'))
FPS = cues['fps']; N = cues['total_frames']; DUR = N / FPS
NS = int(round(DUR * SR))
EV = {k: v['frame'] for k, v in cues['events'].items()}
FR = cues['frames']
FT = [f['t'] for f in FR]
OUT = f'{ROOT}/audio/v2/{VAR}'
STEMS = {k: np.zeros(NS) for k in ('friction', 'liquid', 'air_cloth', 'impacts', 'bike', 'globe')}
LOG = []


def at(frame):
    return frame / FPS


def place(buf, x, t0, gain_db=0.0):
    k = int(round(t0 * SR))
    g = 10 ** (gain_db / 20)
    m = max(0, min(len(x), NS - k))
    if m > 0:
        buf[k:k + m] += g * x[:m]


def one(file, x, frame_or_t, gain_db, stem, note, is_time=False):
    t0 = frame_or_t if is_time else at(frame_or_t)
    write_wav(f'{OUT}/sfx/{file}.wav', x)
    place(STEMS[stem], x, t0, gain_db)
    LOG.append({'file': f'audio/v2/{VAR}/sfx/{file}.wav', 'frame': round(t0 * FPS, 2), 'time_s': round(t0, 4), 'gain_db': gain_db, 'stem': stem, 'note': note})


def curve(key, t0, n):
    """cue-curve value (from the per-frame table) sampled at n audio samples starting at t0"""
    return np.interp(np.arange(n) / SR + t0, FT, [f[key] for f in FR])


H = EV['hero_stop']
LAND, LAUNCH = EV['land'], EV['launch']

# ------------------------------------------------------------------ the cause (E-C only): the globe turns, then stops dead
if EC:
    G = EV['globe_stop']
    whirr = fx_spin_whirr('globe_whirr', at(G) + 0.0)
    whirr[-int(0.001 * SR):] *= np.linspace(1, 0, int(0.001 * SR))  # cut, not fade: the stop is the point
    one('globe_spin_whirr', whirr, 0, -3.0, 'globe', f'frames 0-{G}: the planet turning fast (low rumble + air chopped once per revolution); cut dead on frame {G}')
    one('planet_stop_thump', fx_planet_stop('planet_stop'), G, 0.0, 'globe', f'frame {G}: the planet stops: sub thump, crack and a low ring-down')
    one('ring_bloom', fx_ring_bloom('ring_bloom'), G, -9.0, 'globe', f'frames {G}-{EV["ring_end"]}: the coral ring leaving the globe rim (graphic accent)')

# ------------------------------------------------------------------ friction: the shoes skid on the stopped ground, then the landing slide (follows the hero's speed)
skid1 = fx_scrape('scrape_planted', at(LAUNCH - H), f0=205, f1=170, att=0.002, rel=0.022)
one('shoe_scrape_planted', skid1, H, 0.0, 'friction', f'frame {H}: stopped shoes skid on rough paving until they leave the ground on frame {LAUNCH}')
slide_dur = DUR - at(LAND)
skid2 = fx_scrape('scrape_landing', slide_dur, f0=175, f1=70, lo=900, hi=6200, att=0.004, rel=0.012)
tt = tgrid(slide_dur)
vs = curve('v_hip', at(LAND), len(tt))
skid2 = skid2 * (0.30 + 0.70 * (vs / max(vs)) ** 1.6) * np.minimum(1, 0.55 + 4 * tt)
one('shoe_scrape_landing_skid', skid2, LAND, -8.0, 'friction', f'frames {LAND}-{N}: landing slide to the cut; grit and slip rate follow the hero speed')

# ------------------------------------------------------------------ impacts
one('stop_thud', fx_thud('stop_thud', 115, 55, 0.08, 0.7), H, -8.0 if not EC else -6.0, 'impacts', f'frame {H}: restrained low weight under the first scrape')
one('landing_thump', fx_thud('landing_thump', 150, 62, 0.11, 0.9), LAND, -2.0, 'impacts', f'frame {LAND}: body lands (matches the squash and bounce)')
one('landing_bounce_thump', fx_thud('landing_bounce', 130, 60, 0.07, 0.6, 0.3), LAND + 8, -11.0, 'impacts', f'frame {LAND + 8}: the small second contact after the bounce')
one('launch_scuff_snap', fx_launch('launch'), LAUNCH, -5.0, 'impacts', f'frame {LAUNCH}: shoes leave the pavement')

# ------------------------------------------------------------------ liquid: rim tick, the stream leaving the mug, drops landing on screen
one('ceramic_rim_tick', fx_ceramic_tick('tick'), EV['cup_tick'], 1.0, 'liquid', f'frame {EV["cup_tick"]}: ceramic rim tick as the coffee lurches out')
j0 = EV['jet_first']; jet_dur = at(cues['coffee']['emit_last_frame'] - j0 + 4)
one('coffee_stream', fx_coffee_jet('jet', jet_dur), j0, -5.0, 'liquid', f'frames {j0}-{j0 + jet_dur * FPS:.0f}: coffee thrown forward out of the mug as a tapering stream that breaks into drops')
big = [l for l in cues['coffee']['landings'] if 0 < l['screen_x'] < 1080 and l['r'] > 9]
small = [l for l in cues['coffee']['landings'] if 0 < l['screen_x'] < 1080 and l['r'] <= 9]
for i, l in enumerate(big):
    one(f'coffee_splat_big_{i:02d}', fx_splat(f'splatb{i}', 1050 + 90 * (i % 5)), l['t'], -12.0 - (i % 3) - (2 if l['r'] < 10 else 0), 'liquid', f"drop k={l['k']} r={l['r']} lands at frame x {l['screen_x']}", is_time=True)
for i, l in enumerate(small[::2]):  # the small drops land as a soft patter, one hit for every second drop
    one(f'coffee_patter_{i:02d}', fx_splat(f'patter{i}', 1500 + 70 * (i % 4)), l['t'], -20.0, 'liquid', f"patter, drop k={l['k']} r={l['r']} at frame x {l['screen_x']}", is_time=True)

# ------------------------------------------------------------------ air + cloth: the rush follows how fast the STREET scrolls past, so it drops away when the camera brakes (the reveal)
r0 = H + 1 if not EC else H + 1
r1 = EV['brake_end'] + 3
rush = fx_rush('rush', at(r1 - r0))
tr = tgrid(at(r1 - r0))
cr = curve('cam_rel', at(r0), len(tr))
rush = norm(rush * (cr / max(cr)) ** 1.2, 0.7)
rush[-int(0.12 * SR):] *= np.linspace(1, 0, int(0.12 * SR))
one('air_rush', rush, r0, -9.0, 'air_cloth', f'frames {r0}-{r1}: air past the hero; level follows the street scroll speed, so it falls away as the camera brakes (frames {EV["brake_start"]}-{EV["brake_end"]}) and the street goes still')
one('jacket_scarf_flutter', fx_flap('flap', at(LAND - EV['flap_in']) + 0.2), EV['flap_in'], -10.0, 'air_cloth', f'frames {EV["flap_in"]}-{LAND + 6}: cardigan and scarf flutter while she is flung')

# ------------------------------------------------------------------ the riderless bicycle (E-A v2 only)
if not EC:
    b0 = cues['bike']['enter_frame']
    bdur = DUR - at(b0)
    fw = fx_freewheel('freewheel', bdur, 21.0, 15.0)
    tb = tgrid(bdur)
    frames_arr = np.array([b0, EV['brake_start'], EV['brake_end'], N])
    lvl = np.interp(tb * FPS + b0, frames_arr, [0.08, 0.22, 0.85, 0.85])  # a faint tick while only the front wheel peeks in, full level once the bike is on screen and the street is still
    one('bike_freewheel', fw * lvl, b0, -4.0, 'bike', f'frames {b0}-{N}: riderless bicycle freewheeling (pawl clicks slow with the wheel); level rises as it comes into view')

# ------------------------------------------------------------------ mix
def duck(buf, t0, depth_db, att=0.003, hold=0.03, rel=0.045):
    g = np.ones(NS)
    a, h, r = int(att * SR), int(hold * SR), int(rel * SR)
    k = int(t0 * SR) - a
    dip = 10 ** (-depth_db / 20)
    curve_ = np.concatenate([np.linspace(1, dip, a), np.full(h, dip), np.linspace(dip, 1, r)])
    lo, hi = max(0, k), min(NS, k + len(curve_))
    if hi > lo:
        g[lo:hi] = curve_[lo - k:hi - k]
    buf *= g


tk = at(EV['cup_tick'])
duck(STEMS['friction'], tk, 15.0, hold=0.04)
duck(STEMS['air_cloth'], tk, 9.0, hold=0.04)
duck(STEMS['impacts'], tk, 8.0, hold=0.03)
duck(STEMS['bike'], tk, 8.0, hold=0.04)
duck(STEMS['air_cloth'], at(LAUNCH), 5.0, hold=0.02)
if EC:
    # the stop is the loudest, lowest thing in the opening: keep everything else out of its way for a beat
    g0 = at(EV['globe_stop'])
    for k in ('air_cloth', 'friction', 'liquid', 'bike'):
        duck(STEMS[k], g0, 12.0, att=0.001, hold=0.09, rel=0.05)
for k, v in STEMS.items():
    if np.any(v):
        write_wav(f'{OUT}/stems/foley_{k}.wav', v)
mix = sum(STEMS.values())
mix = mix * (10 ** (-2 / 20) / (np.max(np.abs(mix)) or 1))
mix[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
mix[:int(0.001 * SR)] *= np.linspace(0, 1, int(0.001 * SR))
stereo = np.stack([mix, mix], axis=1)
write_wav(f'{OUT}/stems/effects_{VAR}.wav', stereo)
with open(f'{OUT}/SFX_LOG.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['file', 'frame', 'time_s', 'gain_db', 'stem', 'note'])
    w.writeheader()
    for row in sorted(LOG, key=lambda r: r['time_s']):
        w.writerow(row)
print(f'{VAR}: wrote {len(LOG)} placed events; mix {len(mix)} samples = {len(mix) / SR:.4f} s (video {DUR:.4f} s); sample peak {np.max(np.abs(mix)):.3f}; big splats {len(big)}, patter {len(small[::2])}')

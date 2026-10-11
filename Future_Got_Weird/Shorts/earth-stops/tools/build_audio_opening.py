#!/usr/bin/env python3
"""Procedural Foley for the Earth Stops E-A opening (numpy only, deterministic; no samples, no generation model, no paid service).

Usage:  python3 tools/build_audio_opening.py
Reads   audio/cues.json   (written by tools/build_cues_opening.mjs from the same choreography that draws the picture)
Writes  audio/sfx/*.wav                  isolated one-shots (mono, 48 kHz, 16-bit), each peak-normalised before it is placed
        audio/stems/*.wav                friction / liquid / air+cloth / impacts, each exactly the video length
        audio/stems/effects_opening.wav  the sum (stereo, identical channels = mono-safe), exactly the video length
        audio/OPENING_SFX_LOG.csv        every placed event: file, frame, time, gain
Nothing is random without a fixed seed (sha1 of the effect name). The effects are stylised Foley for an illustrated what-if, not recordings.
"""
import csv, hashlib, json, os, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(f'{ROOT}/audio/cues.json'))
FPS = cues['fps']
N_FRAMES = cues['total_frames']
DUR = N_FRAMES / FPS
NS = int(round(DUR * SR))  # exactly the video length
EV = {k: v['frame'] for k, v in cues['events'].items()}
FR = cues['frames']


# ------------------------------------------------------------------ DSP primitives
def rng_for(name):
    return np.random.default_rng(int(hashlib.sha1(name.encode()).hexdigest()[:8], 16))


def tgrid(dur):
    return np.arange(int(dur * SR)) / SR


def fft_filter(x, lo=None, hi=None, edge=0.25):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= np.clip((f - lo * (1 - edge)) / (lo * edge * 2 + 1e-9), 0, 1)
    if hi:
        m *= np.clip((hi * (1 + edge) - f) / (hi * edge * 2 + 1e-9), 0, 1)
    return np.fft.irfft(X * m, len(x))


def ping(t, f, decay, amp=1.0, phase=0.0):
    return amp * np.sin(2 * np.pi * f * t + phase) * np.exp(-t * decay)


def glide(t, f0, f1, tau):
    f = f1 + (f0 - f1) * np.exp(-t / tau)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def norm(x, peak):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(pcm.shape[1] if pcm.ndim == 2 else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ------------------------------------------------------------------ effects (mono one-shots)
def fx_scrape(name, dur, f0=190.0, f1=120.0, lo=900, hi=7500, att=0.003, rel=0.05):
    """rubber sole dragging over rough paving: band-limited grit under a stick-slip pulse train (the slip rate falls as the slide slows)"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    grit = fft_filter(r.standard_normal(n), lo, hi)
    f = f0 + (f1 - f0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR + 0.6 * np.sin(2 * np.pi * 7 * t)
    slip = 0.40 + 0.60 * (0.5 + 0.5 * np.sin(ph)) ** 2
    jit = 0.6 + 0.4 * np.repeat(r.random(n // 220 + 1), 220)[:n]
    rub = fft_filter(r.standard_normal(n), 250, 1150) * 0.45
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t)) / rel)
    return norm((grit * slip * jit + rub * slip) * env, 0.85)


def fx_thud(name, f_hi=120, f_lo=52, decay=0.09, knock=0.7, dur=0.45):
    """a body-weight thump: falling sine for weight + a mid knock and a woody ring so it still carries on a phone speaker"""
    r = rng_for(name); t = tgrid(dur)
    body = glide(t, f_hi, f_lo, 0.045) * np.exp(-t / decay)
    kn = fft_filter(r.standard_normal(len(t)), 180, 1500) * np.exp(-t / 0.014) * knock
    mid = ping(t, 310, 55, 0.35) + ping(t, 520, 90, 0.18)
    return norm(0.8 * body + kn + mid, 0.9)


def fx_ceramic_tick(name):
    """one ceramic rim tick: a couple of inharmonic modes plus a hard transient"""
    r = rng_for(name); t = tgrid(0.22)
    click = fft_filter(r.standard_normal(len(t)), 2500, 8500) * np.exp(-t / 0.0016)
    modes = ping(t, 2350, 85, 0.9) + ping(t, 3320, 120, 0.6) + ping(t, 5180, 210, 0.3) + ping(t, 1480, 60, 0.35)
    return norm(0.6 * click + modes, 0.9)


def fx_coffee_jet(name, dur):
    """liquid leaving a mug at speed: bubbly band-limited noise with random gurgle modulation and a few short blips"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 900, 5800)
    mod = fft_filter(r.standard_normal(n), 8, 42)
    mod = mod / (np.max(np.abs(mod)) or 1)
    am = 0.55 + 0.45 * mod
    blips = np.zeros(n)
    for tt in r.uniform(0.03, dur - 0.08, 11):
        k = int(tt * SR); m = int(0.016 * SR)
        tb = np.arange(m) / SR
        blips[k:k + m] += 0.5 * np.sin(2 * np.pi * np.cumsum(700 + 1300 * tb / 0.016) / SR) * np.exp(-tb / 0.007)
    env = np.minimum(1, t / 0.012) * np.where(t < dur * 0.65, 1.0, np.exp(-(t - dur * 0.65) / (dur * 0.14)))
    return norm((nz * am + blips) * env, 0.8)


def fx_flap(name, dur, r0=12.0, r1=17.0):
    """jacket / scarf flutter: mid noise chopped by a flutter that speeds up slightly"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 350, 3200)
    rate = r0 + (r1 - r0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(rate) / SR
    fl = (0.5 + 0.5 * np.sin(ph)) ** 1.6
    jit = 0.7 + 0.3 * np.repeat(r.random(n // 600 + 1), 600)[:n]
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.12)
    return norm(nz * (0.25 + 0.75 * fl) * jit * env, 0.7)


def fx_rush(name, dur):
    """air rushing past: three noise bands crossfading from high to low as the speed peaks, then eases off with the slide"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    hi = fft_filter(r.standard_normal(n), 2400, 7500)
    mid = fft_filter(r.standard_normal(n), 800, 2400)
    lo = fft_filter(r.standard_normal(n), 220, 800)
    u = t / dur
    e_hi = np.exp(-((u - 0.12) / 0.16) ** 2)
    e_mid = np.exp(-((u - 0.25) / 0.30) ** 2)
    e_lo = np.clip(u * 3, 0, 1) * np.exp(-((u - 0.4) / 0.6) ** 2)
    sw = 0.85 + 0.15 * np.sin(2 * np.pi * 3.1 * t)
    return norm((0.55 * hi * e_hi + 0.85 * mid * e_mid + 0.9 * lo * e_lo) * sw, 0.7)


def fx_launch(name):
    """the shoes letting go of the pavement: a short rubber squeak, a scuff and a cloth snap"""
    r = rng_for(name); t = tgrid(0.16)
    sq = glide(t, 1050, 1680, 0.025) * np.exp(-t / 0.035) * 0.45
    sc = fft_filter(r.standard_normal(len(t)), 1500, 6500) * np.exp(-t / 0.02)
    sn = fft_filter(r.standard_normal(len(t)), 600, 2800) * np.exp(-t / 0.008) * 0.8
    return norm(sq + 0.6 * sc + sn, 0.85)


def fx_splat(name, f=1250):
    """a coffee droplet hitting stone: a wet tick"""
    r = rng_for(name); t = tgrid(0.08)
    nz = fft_filter(r.standard_normal(len(t)), 900, 3800) * np.exp(-t / 0.006)
    return norm(nz + 0.5 * ping(t, f, 220) + 0.3 * ping(t, 180, 90), 0.8)


# ------------------------------------------------------------------ build + place
def place(buf, x, t0, gain_db=0.0):
    k = int(round(t0 * SR))
    g = 10 ** (gain_db / 20)
    m = max(0, min(len(x), NS - k))
    if m > 0:
        buf[k:k + m] += g * x[:m]


def at(frame):
    return frame / FPS


LOG = []
SFXDIR = f'{ROOT}/audio/sfx'


def one(file, x, frame_or_t, gain_db, stem, note, is_time=False):
    t0 = frame_or_t if is_time else at(frame_or_t)
    write_wav(f'{SFXDIR}/{file}.wav', x)
    place(STEMS[stem], x, t0, gain_db)
    LOG.append({'file': f'audio/sfx/{file}.wav', 'frame': round(t0 * FPS, 2), 'time_s': round(t0, 4), 'gain_db': gain_db, 'stem': stem, 'note': note})


STEMS = {k: np.zeros(NS) for k in ('friction', 'liquid', 'air_cloth', 'impacts')}

# --- friction: the feet skid on the stopped ground (frames 0-9), then the landing slide (31-62) that slows with the hero
skid1 = fx_scrape('scrape_planted', at(EV['launch']), f0=205, f1=170, att=0.002, rel=0.022)
one('shoe_scrape_planted', skid1, EV['stop'], 0.0, 'friction', 'frame 0: stopped shoes skid on rough paving (planted phase; stops dead on frame 9 when the shoes leave the ground)')
slide_dur = DUR - at(EV['land'])  # the hero is still sliding at the cut, so the scrape runs to the end of the clip
skid2 = fx_scrape('scrape_landing', slide_dur, f0=175, f1=70, lo=900, hi=6200, att=0.004, rel=0.012)
tt = tgrid(slide_dur)
vs = np.interp(tt + at(EV['land']), [f['t'] for f in FR], [f['v_hip'] for f in FR])
skid2 = skid2 * (0.30 + 0.70 * (vs / max(vs)) ** 1.6) * np.minimum(1, 0.55 + 4 * tt)  # level follows the slide speed
one('shoe_scrape_landing_skid', skid2, EV['land'], -4.0, 'friction', 'frames 31-90: landing slide to the cut; grit and slip rate fall with the speed')

# --- impacts
one('stop_thud', fx_thud('stop_thud', 115, 55, 0.08, 0.7), EV['stop'], -8.0, 'impacts', 'frame 0: restrained low weight under the first scrape (has a mid knock so it survives phone speakers)')
one('landing_thump', fx_thud('landing_thump', 150, 62, 0.11, 0.9), EV['land'], -2.0, 'impacts', 'frame 31: body lands (matches the squash-and-bounce)')
one('landing_bounce_thump', fx_thud('landing_bounce', 130, 60, 0.07, 0.6, 0.3), EV['land'] + 8, -11.0, 'impacts', 'frame 39: the small second contact after the bounce')
one('launch_scuff_snap', fx_launch('launch'), EV['launch'], -5.0, 'impacts', 'frame 9: shoes leave the pavement')

# --- liquid: rim tick, the jet leaving the mug, droplets landing on screen
one('ceramic_rim_tick', fx_ceramic_tick('tick'), EV['cup_tick'], 1.0, 'liquid', 'frame 2: ceramic rim tick as the coffee lurches out')
jet_dur = at(14)
one('coffee_jet', fx_coffee_jet('jet', jet_dur), 1, -5.0, 'liquid', 'frames 1-15: coffee thrown forward out of the mug')
vis = [l for l in cues['coffee']['landings'] if 0 < l['screen_x'] < 1080]
for i, l in enumerate(vis):
    one(f'coffee_splat_{i:02d}', fx_splat(f'splat{i}', 1050 + 90 * (i % 5)), l['t'], -13.0 - (i % 3), 'liquid', f"droplet k={l['k']} lands at screen x {l['screen_x']}", is_time=True)

# --- air + cloth: rush follows the hero's speed; flutter while airborne, thinner after landing
rush = fx_rush('rush', DUR - at(EV['rush_in']))
tr = tgrid(DUR - at(EV['rush_in']))
vcurve = np.interp(tr + at(EV['rush_in']), [f['t'] for f in FR], [f['v_hip'] for f in FR])
rush = norm(rush * (vcurve / max(vcurve)) ** 1.2, 0.7)
rush[-int(0.12 * SR):] *= np.linspace(1, 0, int(0.12 * SR))  # leaves a clean end for the cut into the next beat
one('air_rush', rush, EV['rush_in'], -9.0, 'air_cloth', 'frames 3-90: air past the hero, level follows her speed')
one('jacket_scarf_flutter', fx_flap('flap', at(EV['land'] - EV['flap_in']) + 0.2), EV['flap_in'], -10.0, 'air_cloth', 'frames 8-40: cardigan and scarf flutter while she is flung')

# ------------------------------------------------------------------ mix
def duck(buf, t0, depth_db, att=0.003, hold=0.03, rel=0.045):
    """brief gain dip so a small, bright event is not masked by the continuous layers (sidechain-style, applied by hand)"""
    g = np.ones(NS)
    a, h, r = int(att * SR), int(hold * SR), int(rel * SR)
    k = int(t0 * SR) - a
    dip = 10 ** (-depth_db / 20)
    curve = np.concatenate([np.linspace(1, dip, a), np.full(h, dip), np.linspace(dip, 1, r)])
    lo, hi = max(0, k), min(NS, k + len(curve))
    g[lo:hi] = curve[lo - k:hi - k]
    buf *= g


duck(STEMS['friction'], at(EV['cup_tick']), 15.0, hold=0.04)   # carve space for the ceramic tick
duck(STEMS['air_cloth'], at(EV['cup_tick']), 9.0, hold=0.04)
duck(STEMS['impacts'], at(EV['cup_tick']), 8.0, hold=0.03)
duck(STEMS['air_cloth'], at(EV['launch']), 5.0, hold=0.02)  # and for the launch snap
for k, v in STEMS.items():
    write_wav(f'{ROOT}/audio/stems/foley_{k}.wav', v)
mix = sum(STEMS.values())
# gentle ceiling: scale (never clip) so the sample peak sits at -2 dBFS; true peak is measured afterwards by ffmpeg
mix = mix * (10 ** (-2 / 20) / (np.max(np.abs(mix)) or 1))
mix[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
mix[:int(0.001 * SR)] *= np.linspace(0, 1, int(0.001 * SR))  # 1 ms fade-in: no DC step at sample 0, the transient is untouched
stereo = np.stack([mix, mix], axis=1)  # identical channels: mono-compatible by construction
write_wav(f'{ROOT}/audio/stems/effects_opening.wav', stereo)
with open(f'{ROOT}/audio/OPENING_SFX_LOG.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['file', 'frame', 'time_s', 'gain_db', 'stem', 'note'])
    w.writeheader()
    for row in sorted(LOG, key=lambda r: r['time_s']):
        w.writerow(row)
print(f'wrote {len(LOG)} placed events; mix {len(mix)} samples = {len(mix) / SR:.4f} s (video {DUR:.4f} s); sample peak {np.max(np.abs(mix)):.3f}')

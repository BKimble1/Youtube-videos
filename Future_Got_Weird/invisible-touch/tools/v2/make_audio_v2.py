#!/usr/bin/env python3
"""V2 effects, ambience and mix for "Invisible Touch" (FGW Short). Built on the V1 mix (tools/make_audio.py).

Everything is synthesised (no samples, no music). The narration master is used sample for sample (gain, the channel's
gentle compressor, the circular true-peak limiter: tools/audio_lib.py, copied unchanged from Eel Escape V4). Effects
are placed from the picture's own timing (audio/cues.json, exported by tools/export_cues.ts). Restrained, under the
voice, ducked by it; no whoosh on every transition.

  space      each setting has its own air, cut with the picture: the lab (a soft room tone and a faint mains hum),
             the parked car (a close, quiet cabin hush), the lobby (a soft open air)
  pulse      the tactile pulse on contact: a short, soft low 'thup' with a tiny tick on top (frame 0 carries one, and
             the loop's last beat repeats it, so the seam is the same sound)
  shimmer    the explanatory ultrasound: a faint, airy high shimmer while the wavefronts are shown, with a subtle
             rising tone as they converge on the focus (ultrasound itself is inaudible: this is the overlay's sound)
  focus      a soft 4 Hz flutter while the focus presses on skin (the modulation the skin feels, shown as sound)
  dive       one soft low whoosh for the camera dive down to the array
  card       a light paper slide as the card passes through the gap
  ticks      restrained clicks on the car dial's detents, each with a small pulse
  confirm    the kiosk: a soft two-note confirmation and a pulse
  grab       a faint skin rustle as the fingers close on nothing
  V2 adds    an opening tactile click on frame 0 that is also the loop's last event (the seam is one sound); a soft
             airy riser after the last word that bridges into it; a small flare on "exact"; a hologram shimmer as
             the car's controls bloom; the lobby key tick, a soft confirmation and the doors' slide

usage: python3 tools/v2/make_audio_v2.py [mix_name]   (default mix_v2)"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import audio_lib as A
from audio_lib import db, noise, lp, hp, bp, circ, smooth, rmsn, norm, fades, svf, lmax, lufs, compress, tp_limit

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v2'
NARRATION = 'audio/narration/FGW_Invisible_Touch_narration_V1.wav'
cj = json.load(open(os.path.join(EP, 'audio/cues_v2.json')))
DUR = cj['DUR']
A.init(DUR, 5207)
SR, N, t = A.SR, A.N, A.t
rng = A.rng
T = cj['T']
fps = cj['fps']
def sig(name):
    x = np.asarray(cj['signals'][name], float)
    return np.interp(t, np.arange(len(x)) / fps, x)
scene = np.asarray(cj['signals']['scene'])
def scene_mask(k, ramp=0.012):
    x = np.interp(t, np.arange(len(scene)) / fps, (scene == k).astype(float))
    x = (x > 0.5).astype(float)
    n = max(1, int(ramp * SR))
    return np.convolve(np.concatenate([x[-n:], x, x[:n]]), np.ones(n) / n, 'same')[n:-n]

VREF = -16.0
BUS = {k: np.zeros(N) for k in ('amb', 'tex', 'dot', 'accent')}
LOG = []
def place(x, at, name, lvl, bus='dot'):
    g = VREF + lvl - lmax(x)
    i0 = int(round(at * SR)) % N
    idx = (np.arange(len(x)) + i0) % N
    BUS[bus][idx] += x * db(g)
    LOG.append({'t': round(at % DUR, 3), 'dur': round(len(x) / SR, 3), 'sfx': name, 'level_re_voice_db': lvl, 'bus': bus})
def layer(x, name, lvl, bus):
    BUS[bus] += x * db(VREF + lvl - lmax(x))
    LOG.append({'t': 0, 'dur': DUR, 'sfx': name, 'level_re_voice_db': lvl, 'bus': bus})

# ---------------------------------------------------------------- spaces (cut with the picture)
lab = scene_mask(0); car = scene_mask(1); lobby = scene_mask(2)
room = rmsn(circ(lambda x: lp(hp(x, 70), 900), noise(N)))
hum = rmsn(np.sin(2 * np.pi * 60 * t) + 0.4 * np.sin(2 * np.pi * 120 * t + 0.3) + 0.15 * np.sin(2 * np.pi * 180 * t))
layer(lab * rmsn(room + 0.25 * hum), 'lab room tone + faint mains hum', -30.0, 'amb')
cabin = rmsn(circ(lambda x: lp(hp(x, 40), 420), noise(N)))
pad_tone = rmsn(np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 165 * t + 0.4) + 0.3 * np.sin(2 * np.pi * 220.5 * t))
layer(car * rmsn(cabin + 0.18 * pad_tone), 'parked car: cabin hush + a faint electric pad', -31.0, 'amb')
air = rmsn(circ(lambda x: lp(hp(x, 120), 2400), noise(N)))
layer(lobby * rmsn(air + 0.12 * hum), 'lobby air', -32.0, 'amb')

# ---------------------------------------------------------------- generators
def thup(dur=0.22, f0=170, f1=80):
    """the tactile pulse: a soft low thump with a tiny bright tick (contact, not impact)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** np.clip(tt / 0.12, 0, 1)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-tt / 0.003)) * np.exp(-tt / 0.05)
    tick = bp(noise(n), 2500, 6000) * np.exp(-tt / 0.0025) * 0.35
    shim = bp(noise(n), 5000, 11000) * np.exp(-tt / 0.06) * 0.12
    return norm(body + tick + shim) * fades(n, 0.001, 0.05)
def click(dur=0.05, fc=3200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), fc * 0.7, fc * 1.4) * np.exp(-tt / 0.004) + 0.4 * np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt / 0.006))
def whoosh(dur=0.6, lo=180, hi=900, dark=1200):
    n = int(dur * SR); u = np.arange(n) / n
    fc = lo * (hi / lo) ** np.sin(np.pi * u)
    return norm(lp(svf(noise(n), fc, 1.0) * np.sin(np.pi * u) ** 1.4, dark))
def chime(f=(880, 1318.5), dur=0.7):
    n = int(dur * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for k, ff in enumerate(f):
        i = int(k * 0.11 * SR); m = n - i; tk = tt[:m]
        x[i:] += (np.sin(2 * np.pi * ff * tk) + 0.25 * np.sin(2 * np.pi * 2 * ff * tk)) * np.exp(-tk / 0.22) * (1 - np.exp(-tk / 0.004))
    return norm(lp(x, 5000)) * fades(n, 0.001, 0.1)
def riser(dur=0.5, lo=2000, hi=7000):
    """a soft airy riser: a band of air sweeping up, swelling, then stopping just before the event it leads to"""
    n = int(dur * SR); u = np.arange(n) / n
    fc = lo * (hi / lo) ** u
    return norm(svf(noise(n), fc, 2.2) * u ** 1.8 * fades(n, 0.05, 0.02))
def flare(dur=0.45):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * tt) * a for f, a in ((1568, 1.0), (2093, 0.5), (3136, 0.25)))
    return norm(x * (1 - np.exp(-tt / 0.006)) * np.exp(-tt / 0.12) + 0.3 * bp(noise(n), 4000, 9000) * np.exp(-tt / 0.05))
def shimmer_swell(dur=0.8):
    n = int(dur * SR); u = np.arange(n) / n
    tone = sum(np.sin(2 * np.pi * f * np.arange(n) / SR + k) for k, f in enumerate((1320, 1760, 2640)))
    return norm((0.6 * rmsn(bp(noise(n), 5000, 10000)) + 0.4 * rmsn(tone)) * np.sin(np.pi * u) ** 2)
def slide(dur=0.6):
    n = int(dur * SR); u = np.arange(n) / n
    return norm(lp(svf(noise(n), 300 + 400 * u, 1.5), 1200) * np.sin(np.pi * u) ** 1.5 + 0.2 * np.sin(2 * np.pi * 90 * np.arange(n) / SR) * np.sin(np.pi * u))
def rustle(dur=0.5):
    n = int(dur * SR); u = np.arange(n) / n
    return norm(bp(noise(n), 900, 4200) * np.sin(np.pi * u) ** 2 * (0.6 + 0.4 * np.abs(rmsn(lp(noise(n), 25)))))

# ---------------------------------------------------------------- the opening click and the loop bridge (one sound across the seam)
open_t = cj['openPulses'][1]  # == end - 0.12: placed once, it wraps to cover frame 0 as well
place(click(0.05, 3600), open_t, 'opening tactile click (frame 0 and the loop seam)', -16.0, 'accent')
place(thup(), open_t + 0.003, 'opening tactile pulse', -15.0, 'accent')
r_len = max(0.2, open_t - (T['lastEnd'] + 0.03))
place(riser(r_len), open_t - r_len, 'sound bridge into the loop: soft airy riser', -24.0, 'tex')
# ---------------------------------------------------------------- pulses on the words
place(thup(), cj['feelPulse'], 'pulse on FEEL (the conceptual button)', -16.0, 'accent')
for k, at in enumerate(cj['questionPulses']):
    place(thup(0.2, 190, 90), at, f'question pulse {k + 1}', -19.0)
place(thup(0.2, 160, 80), cj['skinReturn'], 'the touch returns on the skin', -17.0, 'accent')
# ---------------------------------------------------------------- the dive and the ultrasound overlay
place(whoosh(0.75, 120, 600, 900), cj['dive'], 'camera dive to the array (soft, low)', -22.0)
waves = smooth(np.clip(sig('waves'), 0, 1), 6.0)
shim = rmsn(circ(lambda x: bp(x, 6000, 12000), noise(N)))
conv = A.window(T['fire'], T['exact'] + 0.2, 0.3)
rise_f = 900 + 700 * A.ssn(t, T['fire'], T['exact'])
tone = np.sin(2 * np.pi * np.cumsum(rise_f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(rise_f * 1.5) / SR)
layer(waves * shim, 'ultrasound overlay: faint airy shimmer', -29.0, 'tex')
layer(conv * waves * (0.3 + 0.7 * A.ssn(t, T['fire'], T['exact'])) * rmsn(tone), 'convergence: coherent rising tone', -25.0, 'tex')
place(flare(), cj['exactFlare'], 'the crests meet: a small flare on "exact"', -21.0, 'accent')
focus = smooth(np.clip(sig('focus'), 0, 1), 10.0)
flutter = rmsn(circ(lambda x: lp(x, 260), noise(N))) * (0.55 + 0.45 * np.cos(2 * np.pi * 4 * t))
layer(focus * flutter, 'focus on skin: soft 4 Hz flutter', -28.0, 'tex')
sect = smooth(np.clip(sig('section'), 0, 1), 6.0)
layer(sect * rmsn(circ(lambda x: bp(x, 2500, 6000), noise(N))) * (0.5 + 0.5 * np.cos(2 * np.pi * 8 * t)), 'receptors respond: faint fine crackle', -29.0, 'tex')
# ---------------------------------------------------------------- applications
place(shimmer_swell(0.8), cj['carReveal'] + 0.4, 'car: the floating controls bloom (hologram shimmer)', -24.0, 'tex')
for k, at in enumerate(cj['dialTicks']):
    place(click(), at, f'dial detent {k + 1}', -21.0)
    place(thup(0.16, 210, 110), at + 0.005, f'dial pulse at the fingertip {k + 1}', -22.0)
place(click(0.04, 4200), cj['kioskPress'] - 0.01, 'lobby: key tick', -20.0)
place(thup(), cj['kioskPress'], 'lobby: pulse on the fingertip', -18.0)
place(chime(), cj['kioskPress'] + 0.06, 'lobby: soft confirmation', -21.0, 'accent')
place(slide(0.7), cj['doors'], 'lobby: the doors part', -26.0)
# ---------------------------------------------------------------- the grab on nothing
place(rustle(0.55), cj['grab'], 'fingers close on nothing (skin rustle)', -25.0)

# ---------------------------------------------------------------- voice and master (as Eel Escape V4)
v, vsr = sf.read(os.path.join(EP, NARRATION))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = A.meter
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, comp_curve = compress(v0)
voice = vc * db(VREF - meter.integrated_loudness(vc))
env_b = smooth(np.abs(voice), 8.0)
env_h = smooth(np.abs(hp(voice, 3200, 4)), 16.0)
k_b = np.clip(env_b / np.percentile(env_b, 90) * 1.4, 0, 1)
k_h = np.clip(env_h / np.percentile(env_h, 97) * 1.3, 0, 1)
DUCK = {'amb': (0.3, 0.55), 'tex': (0.45, 0.8), 'dot': (0.3, 0.8), 'accent': (0.2, 0.7)}
def ducked(x, bus):
    d_b, d_h = DUCK[bus]
    lo = circ(lambda y: lp(y, 2400, 4), x)
    return (lo + (x - lo) * (1 - d_h * k_h)) * (1 - d_b * k_b)
DC = lambda x: circ(lambda y: hp(y, 25, 2), x)
fx = {b: DC(ducked(BUS[b], b)) for b in BUS}
lufs_st = lambda x: meter.integrated_loudness(np.stack([x, x], 1))
CEIL = -1.6
pre = voice + sum(fx.values())
g = db(-14.0 - lufs_st(pre))
for _ in range(4):
    mix, glim = tp_limit(pre * g, CEIL)
    err = -14.0 - lufs_st(mix)
    if abs(err) < 0.02: break
    g *= db(err)
mix, glim = tp_limit(pre * g, CEIL)
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Invisible_Touch_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
voice_out = voice * g * glim
fx_ev = sum(fx[b] for b in ('tex', 'dot', 'accent')) * g * glim
amb_out = fx['amb'] * g * glim
for nm, x in [('voice', voice_out), ('sfx', fx_ev), ('amb', amb_out)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(np.concatenate([mix[-256:], mix, mix[:256]]), 4, 1))) + 1e-12)
def xlag(a, b):
    c = np.fft.irfft(np.fft.rfft(a) * np.conj(np.fft.rfft(b)), len(a)); k = int(np.argmax(c)); return k if k <= len(a) // 2 else k - len(a)
vl = lufs(voice_out)
# effects under the voice: the loudest momentary effects level against the voice's loudest momentary level
res = {'name': NAME, 'duration_s': DUR, 'integrated_lufs_stereo': round(float(meter.integrated_loudness(mix2)), 2),
       'true_peak_dbtp_4x': round(float(tp), 2), 'limiter_max_gr_db': round(float(20 * np.log10(glim.min())), 2),
       'voice_lufs_mono': vl, 'effects_lufs_mono': lufs(fx_ev), 'ambience_lufs_mono': lufs(amb_out),
       'effects_under_voice_db': round(vl - lufs(fx_ev), 2),
       'voice_max_momentary_lufs': lmax(voice_out), 'effects_max_momentary_lufs': lmax(fx_ev),
       'lag_mix_vs_master_samples': xlag(mix, v), 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 6), 'events': len(LOG)}
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(sorted(LOG, key=lambda e: e['t']), open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
for e in sorted(LOG, key=lambda e: e['t']):
    if e['dur'] < DUR: print(f"{e['t']:7.2f}  {e['sfx']:55s} {e['level_re_voice_db']:6.1f} dB re voice  [{e['bus']}]")
print(json.dumps(res, indent=1))

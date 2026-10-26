#!/usr/bin/env python3
"""V7: bed, effects and mix for FGW "Glass Climbing" V7: the V6 narration unchanged (sample for sample, gain only), the
same music direction (the V4-V6 synthesised bed), and restrained effects that follow the V7 picture (audio/cues_v7.json
from tools/v7/export_cues_v7.ts): pad contact and release, strap and cable tension, springs, the brick slip with air
under it, the far strap arresting him, and a crisp recovery contact as the near pad catches him (frame 3, across the
loop), soft wind in the height shots. Everything is synthesised here (no samples, no third-party music).
The bed and the effects wrap across the loop point (they are placed modulo the film's length).
Levels (as the channel's recent Shorts): voice -17 LUFS, bed about 15 LU under it and ducked under speech, effects
under the voice, the whole at -14 LUFS with a -1.5 dBFS ceiling.
Inputs : audio/narration/FGW_Glass_Climbing_narration_v6.wav, audio/cues_v7.json
Outputs: source/public/audio/mix_v7.wav, audio/mix/FGW_Glass_Climbing_V7_mix.wav, audio/mix/stems_v7/*.wav,
         audio/mix/mix_measure_v7.json, audio/sfx_cues_v7.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v7.json')))
DUR, WORDS, CL = cj['duration'], cj['words'], cj['climb']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(43)
F = lambda fr: fr / 30.0
w = lambda word, n=0: [x for x in WORDS if x['word'] == word][n]['start']

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR  # whole cycles over the film: the bed loops seamlessly
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = min(n, max(1, int(a * SR))); nr = min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    np.add.at(buf, idx % N, sig)
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def noise(n): return rng.standard_normal(n)

# ---------------- voice (unchanged) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Glass_Climbing_narration_v6.wav'))
# the V6 narration (the channel voice), sample for sample
assert vsr == SR and len(v) >= N and (len(v) == N or np.abs(v[N:]).max() < 1e-4), (vsr, len(v), N)
voice = v[:N].copy()

# ---------------- bed: a low, slightly tense pad and a soft pulse (about 100 bpm), quieter in the micro views ----------
def pad(freqs, rate=0.1):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * loopf(rate + 0.03 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t)
    return out
pad_main = circ(lambda x: lp(x, 600), pad([(73.42, 0.5), (110.0, 0.32), (146.83, 0.16), (155.56, 0.07), (220.0, 0.08)]))
pad_air = circ(lambda x: lp(hp(x, 300), 2400), pad([(440.0, 0.12), (587.33, 0.08), (659.26, 0.06)], 0.07))
beats = int(round(DUR / 0.6)); bpd = DUR / beats
pulse = np.zeros(N)
for k in range(beats):
    n = int(0.3 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt / 0.07) + 0.12 * bp(noise(n), 1500, 5000) * np.exp(-tt / 0.006)
    place(pulse, s * (0.8 if k % 2 == 0 else 0.45), k * bpd)
micro = np.clip(win(F(171), F(534), 0.4, 0.4) + win(F(534), F(664), 0.3, 0.3) + win(F(894), F(954), 0.3, 0.3) + win(F(1041), F(1095), 0.3, 0.3), 0, 1)
catch_ = win(w('but', 1) - 0.05, DUR - 0.5, 0.2, 0.5)  # the catch: the pulse thins (and is back by the loop)
music = pad_main * (0.9 - 0.25 * micro) + pad_air * (0.25 + 0.6 * micro) + pulse * (0.5 - 0.35 * micro) * (1 - 0.4 * catch_)

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at % DUR, 3), 'frame': round(at * 30, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1)})
def tock(f=1900, d=0.12):
    # a plate seating on glass: a short, dry, slightly glassy knock
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.7 * np.sin(2 * np.pi * 150 * tt) * np.exp(-tt / 0.018) + 0.5 * sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.3, 0.4)]) * np.exp(-tt / 0.012) + 0.2 * bp(noise(n), 2000, 7000) * np.exp(-tt / 0.004)
def taut(d=0.22, f0=95):
    # webbing taking a load: a quick fibrous creak and a low thrum
    n = int(d * SR); tt = np.arange(n) / SR
    creak = bp(noise(n), 900, 3200) * np.exp(-tt / 0.03) * (0.6 + 0.4 * np.sin(2 * np.pi * 45 * tt))
    return 0.55 * creak + 0.6 * np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / 0.06) * env(n, 0.004, 0.05)
def scuff(d=0.16):
    n = int(d * SR); tt = np.arange(n) / SR
    return bp(noise(n), 700, 4500) * env(n, 0.01, 0.1) * 0.8 + 0.3 * np.sin(2 * np.pi * 210 * tt) * np.exp(-tt / 0.02)
def squeak(d=0.09, f=1450):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 300 * tt / d) * tt) * env(n, 0.01, 0.04) * 0.5
def barstep(d=0.18):
    # a shoe settling onto the stirrup's bar: muffled knock with a webbing rustle
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.7 * np.sin(2 * np.pi * 120 * tt) * np.exp(-tt / 0.03) + 0.35 * bp(noise(n), 1200, 5000) * env(n, 0.005, 0.12)
def peel(d=0.28):
    # dry unpeeling: a fine, fast crackle that thins out (no wet or sticky character)
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n); k = 0
    while True:
        at = 0.003 + k * 0.004 * (1 + 2.5 * k / 60)
        if at > d - 0.02: break
        i = int(at * SR); m = int(0.002 * SR); x[i:i + m] += noise(m) * (1 - at / d)
        k += 1
    return hp(x, 2500) * 0.9 + 0.2 * bp(noise(n), 3000, 9000) * env(n, 0.01, 0.2) * (1 - tt / d)
def rustle(d=0.6):
    n = int(d * SR)
    return bp(noise(n), 900, 5500) * env(n, 0.08, 0.3) * (0.6 + 0.4 * np.sin(np.linspace(0, 11, n)))
def air(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n); x = noise(n); out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]; fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.6
def ticks(d, rate, f=5200):
    # many tiny contacts closing: soft, dry, close together
    out = np.zeros(int(d * SR)); k = 0
    while True:
        at = (k + rng.random() * 0.8) / rate
        if at > d - 0.02: break
        n = int(0.01 * SR); tt = np.arange(n) / SR
        b = np.sin(2 * np.pi * (f * (0.8 + 0.4 * rng.random())) * tt) * np.exp(-tt / 0.0015)
        i = int(at * SR); out[i:i + n] += b * (0.3 + 0.7 * rng.random()); k += 1
    return out * env(len(out), 0.05, 0.1)
def shimmer(d=1.0, f=2349.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * 1.5 * tt) * 0.25) * env(n, 0.25, 0.5) * (0.7 + 0.3 * np.sin(2 * np.pi * 6 * tt))
def spring(d=0.5, f0=520, f1=380):
    # a small spring stretching: a soft metallic boing with a creak
    n = int(d * SR); tt = np.arange(n) / SR; f = np.geomspace(f0, f1, n)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.18)
    return 0.4 * tone * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * tt)) + 0.25 * bp(noise(n), 1500, 4500) * env(n, 0.02, 0.3)
def slide(d=0.6):
    # a carriage on its rail: a small bearing rumble with a light rattle
    n = int(d * SR); tt = np.arange(n) / SR
    return (0.6 * lp(noise(n), 300) + 0.25 * bp(noise(n), 1800, 5000) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * tt))) * env(n, 0.08, 0.15)
def scrape(d=0.6):
    # dry slip down brick: gritty, uneven, no wet tone
    n = int(d * SR); tt = np.arange(n) / SR
    grit = bp(noise(n), 900, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 17 * tt + 3 * np.sin(2 * np.pi * 3 * tt))))
    return grit * env(n, 0.01, 0.2)
def thunk(d=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.9 * np.sin(2 * np.pi * 85 * tt) * np.exp(-tt / 0.05) + 0.3 * lp(noise(n), 700) * np.exp(-tt / 0.02) + 0.2 * np.sin(2 * np.pi * 640 * tt) * np.exp(-tt / 0.03)

C = CL
CY = cj['cycles']
def sharp_peel(d=0.34):
    # the brick failure: a drier, sharper tear than a release (a short crack, then grit)
    n = int(d * SR); tt = np.arange(n) / SR
    crack = hp(noise(n), 2200) * np.exp(-tt / 0.012) * 1.1
    return crack + 0.6 * peel(d) + 0.35 * bp(noise(n), 800, 4000) * np.exp(-tt / 0.08)
def wind(d=1.2):
    # high up outside: a soft, airy gust (wide shots only), well under everything
    n = int(d * SR); tt = np.linspace(0, 1, n); x = noise(n)
    return lp(hp(x, 180), 1400) * np.sin(np.pi * tt) ** 1.4 * (0.75 + 0.25 * np.sin(2 * np.pi * 0.9 * tt * d))
def glass_slip(d=0.5):
    # the far pad sliding down the glass under the shock: a dry, rising squeal-rub that stops when it holds
    n = int(d * SR); tt = np.arange(n) / SR
    f = np.geomspace(700, 1100, n)
    return (0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt)) + 0.4 * bp(noise(n), 1200, 5000)) * env(n, 0.02, 0.12)
# the climber is seen at 0-171, ~505-534, 664-894, 954-1041 and 1095-FRAMES; the cycles keep going, unheard, behind
# the micro views and the springs
ON = [(0, 171), (505, 534), (664, 894), (954, 1041), (1095, 1171)]
seen = lambda fr: any(a <= fr < b for a, b in ON)
def pad_move(side, rel, m0, m1, place, gain=0):
    name = 'near' if side == 'L' else 'far'
    if seen(rel): add(f'{name} pad peels off (dry)', peel(0.3), F(rel), -31 + gain)
    if seen(m0): add(f'{name} pad carried (air, faint)', air(0.4, 400, 1300), F(m0), -48 + gain)
    if seen(place): add(f'{name} pad seats', tock(1850 if side == 'R' else 1900), F(place) - 0.03, -26 + gain)
for c in CY:
    if seen(c['sh'][0]):
        add('weight onto the near stirrup (cloth)', rustle(0.5), F(c['sh'][0]), -41)
        add('near strap takes the load (creak)', taut(0.22, 90) * 0.8, F((c['sh'][0] + c['sh'][1]) / 2), -32)
    pad_move('R', *c['R'])
    if seen(c['rise'][0]):
        add('he rises onto the far stirrup (cloth)', rustle(0.7), F(c['rise'][0]), -38)
        add('far strap takes his weight', taut(0.24, 96), F(c['rise'][0] + 0.6 * (c['rise'][1] - c['rise'][0])), -28)
    if c['L']: pad_move('L', *c['L'])
    if c['settle'] and seen(c['settle'][0]):
        add('near strap takes its share again', taut(0.2, 92) * 0.8, F(c['settle'][1] - 4), -33)
def squeak_rub(d=0.12):
    # a rubber sole leaving the glass: a short dry squeak
    return squeak(d, 1650) + 0.4 * scuff(d)
# 1. the hook: the catch (frame 3, the end of the film's swing), the straps answer, his toes find the glass; the pad
#    close; the feet leave the glass, the dip; the climb seen from outside
add('CATCH: the near pad meets the glass and holds (crisp contact)', tock(1800, 0.2) + 0.5 * thunk(0.2), F(C['contact']) - 0.02, -21)
add('the near strap snaps taut as it takes him', taut(0.26, 84), F(C['contact']) + 0.08, -27)
add('the far pad shares the load (spring creak)', spring(0.45, 520, 470) * 0.7, F(C['arrest']), -37)
add('toes find the glass (soft rubber)', scuff(0.1) * 0.7, F(C['feet0'] + 8), -38)
add('pad close-up: the backing takes his weight (fine ticks)', ticks(0.6, 32, 4600), F(42), -42)
add('pad close-up: the springs answer (soft)', spring(0.4, 500, 470) * 0.6, F(50), -42)
add('shoes leave the glass (dry squeak)', squeak_rub(), F(C['lift0']) + 0.05, -36)
add('the straps take his whole weight (the dip)', taut(0.28, 92), F(C['drop1']) - 0.12, -26)
add('wind: outside, the reveal', wind(1.8), F(108), -39)
add('wind: below him, the climb', wind(1.2), F(140), -41)
# 2. the mechanism (soft scale changes only)
add('the pad face through the glass (tiles, fine ticks)', ticks(0.8, 26, 4600), F(186), -42)
add('into one tile (air, very soft)', air(0.6, 400, 2400), F(212), -48)
add('glass meets the tips', tock(2600, 0.08) * 0.6, F(276), -36)
add('wedges begin to bend (fine ticks)', ticks(1.0, 30), F(288), -40)
add('wedges lie flat (dense ticks)', ticks(1.2, 55, 4400), F(322), -40)
add('the last of the gap closes (very soft high tone)', shimmer(1.4, 2093.0), F(404), -47)
add('molecular scale (very soft high tone)', shimmer(1.2, 2349.3), F(440), -48)
add('back out to the climber (air, very soft)', air(1.4, 2400, 400, False), F(478), -47)
# 3. the springs
add('cover lifts off (air, faint)', air(0.5, 500, 1800), F(538), -48)
add('the springs stretch together', spring(0.8, 560, 420), F(560), -35)
add('one patch lets go: its spring slackens', spring(0.4, 380, 300) * 0.7, F(606), -37)
add('its neighbours take up its share', spring(0.5, 470, 520), F(612), -38)
add('the load evens out again', spring(0.5, 520, 500) * 0.7, F(640), -40)
# 4. the climb (cycle 6 on screen, above); nearing the brick, outside
add('wind: outside, nearing the brick', wind(1.2), F(860), -40)
# 5. the method's limit: glass contact, then the brick
add('the far pad loads on the glass (fine ticks)', ticks(0.7, 34, 4600), F(898), -40)
add('section: every wedge flat on the glass (dense, soft ticks)', ticks(0.6, 50, 4400), F(932), -43)
add('near pad peels off the glass', peel(0.28), F(C['bRel']), -32)
add('near pad carried across (air, faint)', air(0.5, 500, 1400), F(C['bM0']) + 0.1, -48)
add('pad pressed onto the brick (gritty contact)', lp(scrape(0.12), 3000), F(C['bPlace']) - 0.02, -31)
add('he presses it on (strap creak)', taut(0.2, 90) * 0.7, F(C['bPress1']) - 0.1, -35)
add('sections: the glass wedges lie flat (dense ticks)', ticks(0.6, 50, 4400) * 0.7, F(1046), -42)
add('sections: the brick tips meet only the peaks (sparse grit)', ticks(0.5, 9, 2600), F(1052), -37)
add('section: the brick wedges peel and skid', scrape(0.6) * 0.6, F(1074), -37)
# 6. the slip, the swing, the reach back (and, across the loop, the catch at frame 3 above)
add('the pad slips off the brick (dry crack and grit)', sharp_peel(), F(C['fail']) - 0.02, -25)
add('the drop: air rushing past', air(0.45, 300, 1500), F(C['fail']) + 0.04, -31)
add('the far strap snaps taut and arrests him (cable tension)', taut(0.32, 78) + 0.4 * thunk(0.32), F(C['fail']) + 0.3, -24)
add('the far pad holds on the glass (spring creak under the shock)', spring(0.5, 470, 400), F(C['fail']) + 0.36, -33)
add('wind: the swing, outside', wind(1.4), F(1100), -38)
add('the swing out and back (air)', air(0.7, 800, 300, False), F(1112), -40)
add('he swings back to the wall, reaching (air, faint)', air(0.5, 400, 1300), F(1140), -44)
# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 15 - lufs(music * duck))
sfx_l = sfx * db(3) * (1 - 0.35 * np.clip(ve * 6, 0, 1))
mix = voice_l + mus_l + sfx_l
g = -14 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v7'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v7.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v7.wav'), os.path.join(EP, 'audio/mix/FGW_Glass_Climbing_V7_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v7/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v7.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v7.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))

"""V4 mix: the established score, effects generators, ducking and levels (V2/V3), on the V4 narration
(source/public/audio/v4/narration.wav: new opening and closing lines + the re-spaced V2 recording), with the effect cues
retimed to the V4 shot list. Music runs under the end screen; only a 0.6 s release at the very end.
Outputs: source/public/audio/v4/mix.wav, audio/v4/mix/{music,sfx}.wav, audio/v4/mix/mix_measure.json, audio/v4/sfx_cues.json
All footage is silent; no source audio is used.
"""
import json, os, re, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d
import pyloudnorm as pyln

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NARR = json.load(open(f'{ROOT}/source/src/v4/data/narr.json'))
FILM_END = NARR['duration'] + 2.0
DUR = FILM_END + 3.0  # generators get room for their last bar; the mix is cut to FILM_END on output
N = int(DUR * SR)
rng = np.random.default_rng(11)

# --- reuse V1's generators: effects block and score `section` (exec'd from the V1 script so there is one source) ---
V1 = open(f'{ROOT}/tools/audio_mix.py').read()
fx_src = V1[V1.index('def bp('):V1.index('FX = dict(')]
exec(fx_src)
FX = dict(rumble=rumble, whoosh=whoosh, boom=boom, clunk=clunk, servo=servo, wind=wind, plasma=plasma, splash=splash, pop=pop, beep2=beep2, crackle=crackle)
score_src = V1[V1.index("NOTE = {"):V1.index("hook_a = section(")]
exec(score_src)

lines = {l['id']: l for l in NARR['lines']}
secs = {s['id']: s for s in NARR['sections']}
W = NARR['words']
def ls(i): return lines[i]['s']
def le(i): return lines[i]['e']
def ss(i): return secs[i]['s']
def norm(w): return re.sub(r'[^a-z0-9]', '', w.lower())
def wt(i, word, nth=0, which='s'):
    ws = [w for w in W if w['line'] == i and norm(w['w']) == word.lower()]
    return ws[min(nth, len(ws) - 1)][which]

# ---------------- cues (same word times the picture uses; V4 shot list in source/src/v4/shots) ----------------
c = []
add = lambda t, k, d, g: c.append((t, k, d, g))
# opening: real catch engines; the arms waiting; orbit to entry; two journeys; real liftoff and separation; the ship over the rails
add(0.0, 'rumble', 2.8, 0.7); add(ls('N0_01') - 0.1, 'servo', 1.4, 0.3)
add(wt('N0_01', 'tooafter') - 0.2, 'whoosh', 0.9, 0.2); add(wt('N0_01', 'tooafter'), 'plasma', 2.4, 0.35)
add(wt('N0_02', 'both'), 'pop', 0.12, 0.35); add(ls('N0_03') - 0.55, 'pop', 0.12, 0.35)
add(ls('N0_03') - 0.15, 'boom', 2.0, 0.6); add(ls('N0_03') - 0.15, 'rumble', 4.4, 0.7)
add(wt('N0_05', 'return') - 0.05, 'boom', 1.4, 0.5); add(ls('N0_05') - 0.1, 'rumble', 2.6, 0.45)
add(ls('N0_06') - 0.1, 'rumble', ls('S2_00') - ls('N0_06') - 0.1, 0.35); add(wt('N0_06', 'second') - 0.1, 'servo', 1.2, 0.25)
# S2
tLoad = wt('S2_02', 'load')
add(ls('S2_00') - 0.2, 'rumble', tLoad - ls('S2_00') + 0.3, 0.5); add(tLoad + 0.05, 'clunk', 1.4, 0.9)
add(wt('S2_03', 'top') - 0.2, 'pop', 0.12, 0.4); add(wt('S2_04', 'sticks') - 0.2, 'pop', 0.14, 0.45)
add(wt('S2_06', 'gently') - 0.3, 'servo', 1.0, 0.2); add(wt('S2_06', 'transfer') - 0.05, 'clunk', 1.0, 0.45)
add(wt('S2_07', 'move') - 0.1, 'servo', 1.5, 0.5); add(wt('S2_07', 'crane') - 0.2, 'rumble', ls('S2_08') - wt('S2_07', 'crane') + 0.2, 0.55)
add(ls('S2_08') - 0.15, 'rumble', ls('S3_00') - ls('S2_08') - 0.3, 0.45)
# S3
add(wt('S3_02', 'energy') - 0.6, 'whoosh', 1.4, 0.2)
add(ls('S3_03') - 0.1, 'plasma', ls('S3_04') - ls('S3_03') + 0.1, 0.28)
add(ls('S3_04'), 'wind', wt('S3_05', 'survive') + 0.6 - ls('S3_04'), 0.2)
tRelight = wt('S4_01', 'relight')
add(wt('S3_05', 'survive') + 0.6, 'wind', tRelight - 1.0 - wt('S3_05', 'survive') - 0.6, 0.25); add(wt('S4_00', 'flaps') - 0.2, 'servo', 1.0, 0.3)
# S4: the real flip: relight on "relight", the burn through the upright landing; the planned target on its engines
add(tRelight - 0.15, 'boom', 1.8, 0.55); add(tRelight - 0.15, 'rumble', ls('S4_05') - 0.2 - tRelight + 0.15, 0.7)
add(ls('S4_05') - 0.2, 'rumble', ls('S5_00') - ls('S4_05') - 0.1, 0.45); add(wt('S4_06', 'reach') + 0.2, 'clunk', 1.0, 0.6)
# S5
add(wt('S5_01', 'swing') - 0.3, 'servo', 1.4, 0.55); add(wt('S5_01', 'carriage') - 0.1, 'servo', 1.8, 0.5)
add(wt('S5_03', 'through'), 'clunk', 0.8, 0.25); add(wt('S5_03', 'carriage'), 'clunk', 0.8, 0.3); add(wt('S5_03', 'ground', 0, 'e') + 0.1, 'boom', 1.4, 0.4)
add(wt('S5_04', 'revised') - 0.1, 'pop', 0.12, 0.4)
add(ls('S5_05') - 0.3, 'rumble', wt('S5_05', 'flying') - ls('S5_05') + 0.2, 0.6); add(wt('S5_05', 'flying') - 0.1, 'clunk', 1.4, 0.85)
# S6
add(ls('S6_00') - 0.4, 'rumble', 2.2, 0.4); add(wt('S6_01', 'miss') + 0.1, 'whoosh', 0.8, 0.25)
add(ls('S6_02') - 0.1, 'rumble', 1.9, 0.4); add(wt('S6_02', 'meet'), 'clunk', 1.0, 0.6)
add(ls('S6_03') - 0.1, 'rumble', 3.2, 0.4); add(wt('S6_03', 'impact') - 0.15, 'boom', 1.6, 0.8); add(wt('S6_03', 'impact') - 0.15, 'clunk', 1.4, 1.0)
add(ls('S6_07') - 0.2, 'wind', 7.0, 0.25)
# S7
add(ls('S7_00') - 0.4, 'wind', 4.0, 0.2)
add(wt('S7_01', 'vehicle'), 'pop', 0.12, 0.45); add(wt('S7_01', 'engine'), 'pop', 0.12, 0.45); add(wt('S7_01', 'ground'), 'beep2', 1.2, 0.35)
add(wt('S7_01', 'remove'), 'beep2', 1.0, 0.3)
add(ls('S7_02') - 0.2, 'rumble', 4.2, 0.45); add(wt('S7_02', 'call') - 0.2, 'beep2', 1.2, 0.3)
add(ls('S7_03') + 0.2, 'whoosh', 0.9, 0.2); add(wt('S7_04', 'beside') - 0.1, 'boom', 1.4, 0.35)
# S8
add(wt('S8_00', 'off') - 0.3, 'whoosh', 0.7, 0.2); add(ls('S8_01') + 0.2, 'servo', 3.6, 0.45); add(wt('S8_01', 'again') - 0.4, 'clunk', 1.0, 0.5)
add(wt('S8_03', 'structure') - 0.1, 'beep2', 1.2, 0.18)
add(ls('S8_04') - 0.2, 'servo', 2.0, 0.4); add(wt('S8_04', 'fly') + 0.15, 'clunk', 1.0, 0.5)
tLaunch = wt('S8_04', 'fly') + 0.45
add(tLaunch, 'boom', 1.6, 0.5); add(tLaunch, 'rumble', 5.0, 0.6)
# S9: the continuous final approach; the end screen keeps only the score and a light wind
tMeet = wt('S9_04', 'meet'); contact = tMeet + 0.15
tR = wt('S9_03', 'engines') - 0.07
add(tLaunch + 5.0, 'wind', tR - tLaunch - 5.0, 0.15)
add(tR + 0.1, 'boom', 1.6, 0.3); add(tR + 0.1, 'rumble', contact - tR + 0.6, 0.25)
add(contact - 2.4, 'servo', 1.6, 0.08)
add(contact, 'clunk', 1.6, 1.0); add(contact + 0.35, 'clunk', 1.0, 0.35)
add(FILM_END - 15.5, 'wind', 15.5, 0.06)

def place(buf, t0, x, g):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * g

sfx = np.zeros((N, 2))
for (t0, kind, d, g) in c:
    x = FX[kind](d) if kind != 'pop' else FX[kind]()
    x = x / (np.abs(x).max() + 1e-9)
    pan = 0.5 + 0.18 * np.sin(t0)
    place(sfx[:, 0], t0, x * (1 - pan), g)
    place(sfx[:, 1], t0, x * pan, g)
os.makedirs(f'{ROOT}/audio/v4/mix', exist_ok=True)
json.dump([{'t': round(q[0], 3), 'fx': q[1], 'dur': round(q[2], 3), 'gain': q[3]} for q in c], open(f'{ROOT}/audio/v4/sfx_cues.json', 'w'), indent=0)

# ---------------- score: tense low bed, lifts at the turns, one drop before the final settle ----------------
music = np.zeros((N, 2))
music += section(0.0, ss('S2') + 0.3, ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C'], True, True, 0.85)
music += section(ss('S2') - 0.2, ss('S3'), ['Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'F', 'C'], True, True, 0.72)
music += section(ss('S3') - 0.2, ss('S4'), ['Fmaj7', 'Cadd9', 'Am', 'Cadd9'], False, True, 0.7)
music += section(ss('S4') - 0.2, ss('S5'), ['Dm', 'Eb', 'Dm', 'Bb'], True, False, 0.85)
music += section(ss('S5') - 0.2, ss('S6'), ['Gm', 'Dm', 'Bb', 'C'], True, True, 0.7)
music += section(ss('S6') - 0.2, ss('S7'), ['Dm', 'Eb', 'Dm', 'Dsus'], True, False, 0.75)
music += section(ss('S7') - 0.2, ss('S8'), ['Gm', 'Eb', 'Dm', 'Dsus'], False, True, 0.6)
music += section(ss('S8') - 0.2, ss('S9'), ['Bb', 'F', 'C', 'Dm'], True, True, 0.75)
music += section(ss('S9') - 0.2, DUR, ['Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'F'], False, True, 0.6)
# the one reduction: music falls away just before the supports meet, returns after the load is taken
tt = np.arange(N) / SR
drop = 1 - 0.92 * np.clip((tt - (tMeet - 1.4)) / 0.8, 0, 1) * (1 - np.clip((tt - (wt('S9_04', 'load', 0, 'e') + 0.9)) / 1.4, 0, 1))
music *= drop[:, None]

voice, vsr = sf.read(f'{ROOT}/source/public/audio/v4/narration.wav')
assert vsr == SR
v = np.zeros(N); v[: min(N, len(voice))] = voice[:N]
e = np.sqrt(np.convolve(v ** 2, np.ones(2400) / 2400, 'same'))
active = maximum_filter1d((e > 0.01).astype(float), int(0.45 * SR))
active = np.convolve(active, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')
music *= (1 - 0.6 * np.clip(active, 0, 1))[:, None]
sfx_lo = np.stack([lp(sfx[:, k], 250, 4) for k in range(2)], 1)
sfx = sfx_lo * (1 - 0.35 * np.clip(active, 0, 1))[:, None] + (sfx - sfx_lo) * (1 - 0.8 * np.clip(active, 0, 1))[:, None]

meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x if x.ndim == 2 else np.stack([x, x], 1))
v *= 10 ** ((-17.0 - lufs(v)) / 20)
music *= 10 ** ((-31.0 - lufs(music)) / 20)
sfx *= 10 ** ((-27.0 - lufs(sfx)) / 20)
mix = np.stack([v, v], 1) + music + sfx
mix *= 10 ** ((-15.0 - lufs(mix)) / 20)
# no fade to black: the score plays under the end screen; only a short release over the last 0.6 s to avoid a cut-off
mix *= np.clip((FILM_END - tt) / 0.6, 0, 1)[:, None]
# soft-knee limiter with margin for true peak
lim = 10 ** (-2.0 / 20)
a = np.abs(mix)
mix = np.where(a > lim * 0.8, np.sign(mix) * (lim * 0.8 + lim * 0.2 * np.tanh((a - lim * 0.8) / (lim * 0.2))), mix)
sf.write(f'{ROOT}/audio/v4/mix/music.wav', music.astype(np.float32), SR)
sf.write(f'{ROOT}/audio/v4/mix/sfx.wav', sfx.astype(np.float32), SR)
out = f'{ROOT}/source/public/audio/v4/mix.wav'
NF = int(round(FILM_END * SR))
sf.write(out, mix[:NF].astype(np.float32), SR, subtype='PCM_24')
# measurement: ffmpeg ebur128 with true peak
r = subprocess.run(['ffmpeg', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
rows = []
for i in range(0, N - SR, SR):
    if np.sqrt((v[i:i + SR] ** 2).mean()) > 0.02:
        vv = bp(v[i:i + SR], 300, 4000); bb = bp((music + sfx)[i:i + SR].mean(1), 300, 4000)
        rows.append(20 * np.log10(np.sqrt((vv ** 2).mean()) / (np.sqrt((bb ** 2).mean()) + 1e-9)))
meas = {'integrated_lufs': I, 'true_peak_dbtp': TP, 'duration_s': round(N / SR, 3), 'cues': len(c),
        'speechband_voice_over_bed_db_min': round(min(rows), 1), 'speechband_voice_over_bed_db_median': round(float(np.median(rows)), 1)}
json.dump(meas, open(f'{ROOT}/audio/v4/mix/mix_measure.json', 'w'), indent=1)
print(meas)

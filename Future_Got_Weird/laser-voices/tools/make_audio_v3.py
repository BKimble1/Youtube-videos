#!/usr/bin/env python3
"""V3 mix for FGW "This Laser Makes You Hear Voices": the locked V1/V2 mix with ONE change, the transmitted-message
effect.
  - Narration: the approved file (audio/narration/FGW_Laser_Voices_narration_final.wav), unedited, at the same gain
    the V1/V2 mix used (x1.4303098, measured from the V1 voice stem), starting at sample 0. No stretch, pitch or edit.
  - Music, room tone and effects: the V1 stems (audio/mix/stems/{music,room,sfx}.wav), unchanged, except a 12 ms
    fade at the very end and start of the music and room stems so the bed loops without a click.
  - The old message stem (a voice-like murmur, 3.9 s + 2.1 s + 3.2 s + 2.1 s of it) is REMOVED, not covered.
  - The new motif: a short, original, nonverbal transmission, synthesised here:
      * a soft vowel-like resonance (harmonic source through two slowly moving, moderately wide formants);
      * a faint detuned upper voice (a slightly flat fifth) for an unfamiliar, uneasy colour;
      * a delicate glassy/granular edge (sparse short sine grains on high inharmonic partials, low level);
      * a restrained downward glide (about 3 semitones over 0.6 s) with a light, irregular waver;
      * 40 ms attack, 180 ms release (the picture's ear accent reads the same envelope, story3.motifEnv);
      * a small, short room (synthetic, ~0.45 s), applied to the motif only;
      * high-passed at 220 Hz (no sub swell), low-passed at 6.5 kHz, gently ducked under the voice.
    It sounds in three instances only (audio/cues_v3.json, from story3.MOTIFS): across the loop seam (the opening
    reaction), a quiet return just before the obstruction, and the restoration. The picture's per-frame `received`
    gate (on screen, the path reaching the ear) cuts it on frame 815 with a 3 ms ramp, wet and dry together, so no
    tail runs on after the block; it is back on frame 958. The seam instance and its room are built circularly, so
    the end of the file flows into its start.
  - Master stage: the same soft clip as V1/V2 (tanh at -1.5 dBFS) on the sum.
Inputs : audio/narration/..., audio/mix/stems/{music,room,sfx}.wav, audio/cues_v3.json
Outputs: source/public/audio/mix_v3.wav, audio/mix/FGW_Laser_Voices_V3_mix.wav, audio/mix/stems_v3/*.wav,
         audio/mix/mix_measure_v3.json, audio/motif_cues_v3.json"""
import hashlib, json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, fftconvolve

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v3.json')))
DUR, FPS = cj['DUR'], cj['FPS']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(7)
db = lambda x: 10 ** (x / 20)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def circ(fn, x, *a):
    """apply a causal filter to a looping signal: run it over two periods and keep the second"""
    y = fn(np.concatenate([x, x]), *a)
    return y[len(x):]
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

# ---------------- the locked material ----------------
NARR = os.path.join(EP, 'audio/narration/FGW_Laser_Voices_narration_final.wav')
narr, nsr = sf.read(NARR)
assert nsr == SR and len(narr) == N, (nsr, len(narr), N)
G_VOICE = 1.430309752850878  # the V1/V2 voice gain (least squares of the V1 voice stem against the narration file)
voice = narr * G_VOICE
stem = lambda n: sf.read(os.path.join(EP, f'audio/mix/stems/{n}.wav'))[0]
music, room, sfx = stem('music'), stem('room'), stem('sfx')
# loop seam for the bed only: 12 ms raised-cosine fade at the end and the start (the narration is never faded)
L = int(0.012 * SR)
ramp_in = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, L))
music_l, room_l = music.copy(), room.copy()
for x in (music_l, room_l):
    x[:L] *= ramp_in
    x[-L:] *= ramp_in[::-1]

# ---------------- the motif ----------------
MLEN = 0.6
def motif_dry(x):
    """the motif as a function of its local time x (s); defined for x in [0, len] of an instance. Beyond MLEN it
    holds the end of the glide with a soft waver (used only by the long instance that the block cuts)."""
    xs = np.minimum(x, MLEN)
    glide = 1 - (1 - np.clip(xs / MLEN, 0, 1)) ** 2  # eased downward glide
    semis = -3.0 * glide
    waver = 0.18 * np.sin(2 * np.pi * 5.3 * x + 0.4) + 0.08 * np.sin(2 * np.pi * 7.9 * x + 1.7)  # semitones
    f0 = 370.0 * 2 ** ((semis + waver) / 12)
    ph = 2 * np.pi * np.cumsum(f0) / SR
    # vowel-like: harmonics through two formants that drift from a dark "oo" toward an open "ah"
    F1 = 480 + 120 * glide + 25 * np.sin(2 * np.pi * 2.1 * x)
    F2 = 940 + 260 * glide + 60 * np.sin(2 * np.pi * 1.3 * x + 0.5)
    core = np.zeros_like(x)
    for h in range(1, 14):
        fh = h * f0
        amp = (1 / h ** 1.1) * (1 / (1 + ((fh - F1) / 170) ** 2) + 0.55 / (1 + ((fh - F2) / 230) ** 2) + 0.06)
        core += amp * np.sin(h * ph + 0.3 * h)
    # the uneasy upper voice: a slightly flat fifth, much quieter
    upper = 0.16 * np.sin(1.4865 * ph + 0.9) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.7 * x))
    # glassy/granular edge: sparse short grains on high inharmonic partials of f0
    glass = np.zeros_like(x)
    ratios = [6.93, 8.71, 10.37, 12.6]
    gt = np.arange(0.012, max(MLEN, float(x.max())) + 0.05, 1 / 38.0)
    grng = np.random.default_rng(11)
    for i, g in enumerate(gt):
        g = g + grng.uniform(-0.008, 0.008)
        dur = grng.uniform(0.012, 0.026)
        m = (x >= g) & (x < g + dur)
        if not m.any():
            continue
        w = np.sin(np.pi * (x[m] - g) / dur) ** 2
        r = ratios[i % len(ratios)] * (1 + grng.uniform(-0.01, 0.01))
        glass[m] += grng.uniform(0.4, 1.0) * w * np.sin(2 * np.pi * r * f0[m] * (x[m] - g) + grng.uniform(0, 6.28))
    return core / 2.2 + upper + 0.09 * glass

def env(x, length):
    a = np.clip(x / 0.04, 0, 1)
    r = np.clip((length - x) / 0.18, 0, 1)
    return np.sin(np.pi / 2 * a) * np.sin(np.pi / 2 * r) * ((x >= 0) & (x <= length))

dry = np.zeros(N)
instances = []
for m in cj['MOTIFS']:
    t0, ln = m['t0'], m['len']
    x = (t - t0) % DUR if t0 + ln > DUR else t - t0  # the seam instance wraps around the end of the file
    sel = (x >= 0) & (x <= ln)
    xi = x[sel]
    order = np.argsort(xi)
    seg = np.zeros(len(xi))
    seg[order] = motif_dry(xi[order]) * env(xi[order], ln)
    dry[sel] += seg
    instances.append({'name': m['name'], 'onset_s': round(t0, 3), 'nominal_len_s': ln,
                      'span_s': [round(t0, 3), round((t0 + ln) % DUR if t0 + ln > DUR else t0 + ln, 3)], 'wraps_loop_seam': t0 + ln > DUR})
dry = circ(hp, dry, 220, 2)
dry = circ(lp, dry, 6500, 2)
# a small, short room for the motif only (circular, so the seam instance's tail wraps into the start)
ir_n = int(0.45 * SR)
ti = np.arange(ir_n) / SR
irL = lp(rng.standard_normal(ir_n), 4200) * np.exp(-ti / 0.075) * (ti > 0.012)
irR = lp(rng.standard_normal(ir_n), 4200) * np.exp(-ti / 0.075) * (ti > 0.014)
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
def circ_conv(x, ir):
    y = fftconvolve(np.concatenate([x, x]), ir)[:2 * len(x)]
    return y[len(x):]
wetL, wetR = circ_conv(dry, irL), circ_conv(dry, irR)
WET = db(-13)
mL, mR = dry + WET * wetL, dry + WET * wetR
# the picture's gate (on screen: the path reaches the ear), held per frame, 3 ms ramps: an immediate cut, no tail
rec = np.array([f['received'] for f in cj['frames']], float)
g = rec[np.minimum((t * FPS).astype(int), len(rec) - 1)]
k = int(0.003 * SR)
gate = np.convolve(np.concatenate([g[-k:], g, g[:k]]), np.ones(k) / k, mode='same')[k:-k]
mL *= gate; mR *= gate
# gentle ducking under the voice (about -4 dB while she speaks; slow so it never pumps)
ve = lp(np.abs(voice), 5, 1); ve = np.clip(ve / (np.percentile(ve, 95) + 1e-9), 0, 1)
duck = db(-4 * ve)
mL *= duck; mR *= duck

# ---------------- level: about 20 dB under the narration where they overlap ----------------
meter = pyln.Meter(SR)
active = (np.abs(dry) > 1e-4) & (gate > 0.5)
spk = ve > 0.15
over = active & spk
def rms_db(x, m): return 10 * np.log10(np.mean(x[m] ** 2) + 1e-15)
TARGET = -20.0
mono_m = 0.5 * (mL + mR)
gm = db(TARGET - (rms_db(mono_m, over) - rms_db(voice, over)))
mL *= gm; mR *= gm
# ---------------- mix and master (the V1/V2 soft clip) ----------------
bed = voice + music_l + room_l + sfx
lim = db(-1.5)
Lch = np.tanh((bed + mL) / lim) * lim
Rch = np.tanh((bed + mR) / lim) * lim
st = np.stack([Lch, Rch], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v3'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
out = os.path.join(EP, 'source/public/audio/mix_v3.wav')
sf.write(out, st, SR, subtype='PCM_24')
shutil.copy(out, os.path.join(EP, 'audio/mix/FGW_Laser_Voices_V3_mix.wav'))
sf.write(os.path.join(EP, 'audio/mix/stems_v3/motif.wav'), np.stack([mL, mR], 1), SR, subtype='PCM_24')

# ---------------- measurements ----------------
v1, _ = sf.read(os.path.join(EP, 'audio/mix/FGW_Laser_Voices_V1_mix.wav'))
v1msg = stem('message')
seam = np.zeros(N, bool); seam[:L] = True; seam[-L:] = True
untouched = (np.abs(v1msg) < 1e-9) & (np.abs(mL) < 1e-9) & (np.abs(mR) < 1e-9) & ~seam
diff = np.abs(st - v1)[untouched]
lsb = 1 / 2 ** 23
def win_db(x, a, b): i, j = int(a * SR), int(b * SR); return round(10 * np.log10(np.mean(x[i:j] ** 2) + 1e-14), 1)
T_BLOCK, T_CLEAR = cj['T_BLOCK'], cj['T_CLEAR']
m_mono = 0.5 * (mL + mR)
fr = 0.5
corr_lr = float(np.corrcoef(mL[active], mR[active])[0, 1])
spec = np.abs(np.fft.rfft(m_mono[active] * np.hanning(int(active.sum())))) ** 2
fq = np.fft.rfftfreq(int(active.sum()), 1 / SR)
band = lambda a, b: 10 * np.log10(spec[(fq >= a) & (fq < b)].sum() / spec.sum() + 1e-12)
meas = {
    'narration_file_sha256': sha(NARR), 'narration_gain': G_VOICE, 'narration_offset_samples': 0,
    'narration_untouched_by_fades': True,
    'integrated_lufs_stereo': round(meter.integrated_loudness(st), 2), 'integrated_lufs_mono_fold': round(meter.integrated_loudness(st.mean(1)), 2),
    'v2_integrated_lufs_stereo': round(meter.integrated_loudness(v1), 2),
    'sample_peak_dbfs': round(20 * np.log10(np.abs(st).max()), 2),
    'identical_to_v2_where_neither_effect_sounds': {'samples_compared': int(untouched.sum()), 'fraction_of_file': round(float(untouched.mean()), 4),
        'max_abs_diff': float(diff.max()), 'max_diff_in_24bit_lsb': round(float(diff.max() / lsb), 2)},
    'motif_under_voice_db_during_overlap': round(rms_db(m_mono, over) - rms_db(voice, over), 1),
    'motif_peak_dbfs': round(20 * np.log10(np.abs(np.stack([mL, mR])).max()), 1),
    'motif_band_energy_db': {'<200Hz': round(band(0, 200), 1), '200-1k': round(band(200, 1000), 1), '1k-3k': round(band(1000, 3000), 1), '3k-8k': round(band(3000, 8000), 1)},
    'motif_LR_correlation': round(corr_lr, 3),
    'motif_rms_db': {'before_block (26.1-27.1)': win_db(m_mono, 26.1, T_BLOCK - 0.05), 'while_blocked': win_db(m_mono, T_BLOCK + 0.01, T_CLEAR - 0.01),
                     'first_10ms_after_block': win_db(m_mono, T_BLOCK + 0.004, T_BLOCK + 0.014), 'after_return (31.95-32.5)': win_db(m_mono, T_CLEAR + 0.02, 32.5)},
    'seam': {'motif_last_sample': [float(mL[-1]), float(mR[-1])], 'motif_first_sample': [float(mL[0]), float(mR[0])],
             'mix_last_sample': [float(st[-1, 0]), float(st[-1, 1])], 'mix_first_sample': [float(st[0, 0]), float(st[0, 1])]},
    'duration_s': DUR, 'samples': N,
}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v3.json'), 'w'), indent=1)
json.dump({'removed': 'V1/V2 message stem (nonlexical voice-like murmur): on 0-3.90, 17.73-19.87, 23.93-27.17, 31.93-34.07 s',
           'added': instances, 'gate': 'picture received state per frame (audio/cues_v3.json): cut at frame 815 (27.167 s), back at frame 958 (31.933 s), 3 ms ramps',
           'level': f'{TARGET} dB re narration RMS during overlap (measured {meas["motif_under_voice_db_during_overlap"]} dB), -4 dB ducking under speech',
           'unchanged': 'narration (file, gain, timing), music, room tone and effects stems (12 ms loop fades at the file ends on music/room only)'},
          open(os.path.join(EP, 'audio/motif_cues_v3.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))

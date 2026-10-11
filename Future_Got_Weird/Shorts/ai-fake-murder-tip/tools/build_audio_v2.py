#!/usr/bin/env python3
"""Sound design + mix for V2 'AI Sent Police a Fake Murder Tip' (numpy only, deterministic).

Reads   audio/cues_v2.json                                  (the one clock)
        audio/narration_v2/narration_v2_final_48k.wav       (ElevenLabs Test Voice, eleven_v4, take 1, pauses shortened)
        audio/sfx/raw_*.wav                                 (the five V1 ElevenLabs effect generations, reused; sliced here; no new generations)
Writes  audio/stems_v2/{voice,music,sfx,mix}.wav            (48 kHz stereo, 16-bit, exactly the video length; stems sum to the mix)
        audio/sfx_log_v2.csv, audio/MIX_LOG_V2.json, source/public/audio/final_mix_v2.wav

Music is original local synthesis (muted pulse + a two-note plucked motif, 114.286 BPM = exactly 10 bars over 21.000 s). Nothing here is random without a fixed seed.
"""
import csv, hashlib, json, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(f'{ROOT}/audio/cues_v2.json'))
EVS = cues['events_sec']
TOTAL = cues['total_frames'] / cues['fps']            # 21.000 s
N = int(round(TOTAL * SR))
WORDS = cues['words']
VOICE_END = EVS['voice.end']
TARGET_LUFS, CEIL_DBFS = -15.0, -1.9                  # integrated loudness target; sample-peak ceiling (keeps true peak below -1 dBTP)


def rd(path):
    with wave.open(path) as w:
        n, ch, sw = w.getnframes(), w.getnchannels(), w.getsampwidth()
        a = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float64) / 32768.0
        if ch > 1:
            a = a.reshape(-1, ch).mean(1)
        assert sw == 2 and w.getframerate() == SR, path
    return a


def wr(path, stereo):
    s = np.clip(stereo, -1, 1)
    pcm = (s * 32767.0).round().astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def rng_for(name):
    return np.random.default_rng(int(hashlib.sha1(name.encode()).hexdigest()[:8], 16))


def db(x):
    return 10 ** (x / 20.0)


def place(buf, x, t, gain=1.0, pan=0.0):
    """add mono x to stereo buf at time t (s)"""
    i = int(round(t * SR))
    if i >= N:
        return
    seg = x[: max(0, min(len(x), N - i))] if i >= 0 else x[-i:]
    i0 = max(i, 0)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i0:i0 + len(seg), 0] += seg * gain * l * 1.414
    buf[i0:i0 + len(seg), 1] += seg * gain * r * 1.414


def fade(x, a=0.002, b=0.01):
    x = x.copy()
    na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


def biquad_hp(x, fc, q=0.707):
    w0 = 2 * np.pi * fc / SR; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
    a0, a1, a2 = 1 + al, -2 * c, 1 - al
    return _bq(x, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)


def biquad_lp(x, fc, q=0.707):
    w0 = 2 * np.pi * fc / SR; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
    a0, a1, a2 = 1 + al, -2 * c, 1 - al
    return _bq(x, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)


def _bq(x, b0, b1, b2, a1, a2):
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for n in range(len(x)):
        v = b0 * x[n] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        y[n] = v; x2, x1 = x1, x[n]; y2, y1 = y1, v
    return y


# ------------------------------------------------------------------ voice
voice = rd(f'{ROOT}/audio/narration_v2/narration_v2_final_48k.wav')
voice = biquad_hp(voice, 75.0)
vpad = np.zeros(N); vpad[: min(N, len(voice))] = voice[:N]
voice = vpad
win = int(0.010 * SR)
nw = N // win
rms = np.sqrt((voice[: nw * win].reshape(nw, win) ** 2).mean(1) + 1e-12)
active = (20 * np.log10(rms) > -46.0).astype(float)
env = np.zeros(nw); cur = 0.0
for i in range(nw):
    tgt = active[i]
    k = 1 - np.exp(-0.010 / (0.020 if tgt > cur else 0.240))
    cur += (tgt - cur) * k
    env[i] = cur
duck_db = np.interp(np.arange(N), (np.arange(nw) + 0.5) * win, -12.0 * env)   # up to -12 dB under speech

# ------------------------------------------------------------------ sound effects (V1 generations reused; local synthesis for the rest)
sfx = np.zeros((N, 2))
LOG = []


def ev(name):
    return EVS[name]


def add(name, src, t, gain_db, pan=0.0, kind='ElevenLabs eleven_text_to_sound_v2 (V1 generation, reused)', note=''):
    place(sfx, fade(src), t, db(gain_db), pan)
    LOG.append({'event': name, 'time_s': round(t, 3), 'frame': int(round(t * 30)), 'gain_db': gain_db, 'source': kind, 'note': note})


def raw(name):
    return rd(f'{ROOT}/audio/sfx/raw_{name}.wav')


def cut(x, a, b):
    return x[int(a * SR): int(b * SR)]


def thud(freq=140, dur=0.12, tau=0.032):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / tau)
    return x / np.abs(x).max()


def tick(freq=1500, dur=0.045, seed='t'):
    t = np.arange(int(dur * SR)) / SR
    r = rng_for(seed)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.011) + 0.35 * biquad_hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.006)
    return x / np.abs(x).max()


click, keys, err, send, spam = raw('click'), raw('keys'), raw('error'), raw('send'), raw('spam')
# 1 the first visible press: dry click (after the first word has begun) + a restrained low tap
c1 = cut(click, 0.0, 0.14)
add('b1.press click', c1, ev('b1.press') - 0.025, -8, 0.10, note='first click of raw_click.mp3; lands on "sent", after "AI" has begun')
add('b1.press low tap', thud(120, 0.14, 0.04), ev('b1.press') + 0.004, -22, 0.0, kind='local synthesis', note='restrained low tap under the click')
# 2 invented claim appears: a very short keyboard cluster, then silence
add('b2.line1 keys', cut(keys, 0.0, 0.55), ev('b2.line1') - 0.01, -4, -0.15, note='raw_keys.mp3 0.00-0.55 s; quote appears on "It claimed"')
# 3 NO DESCRIPTION: one small dry tick inside the music pocket, just after the first consonant of "no"
add('b3.stamp tick', cut(err, 0.0, 0.20), ev('b3.stamp') + 0.05, -9, 0.0, note='raw_error.mp3 0.00-0.20 s (the V1 dry knock, shortened); in the pocket')
# 4 the message changes form / travels: short paper-send accent (no scoring of every cut)
add('b5.go send accent', cut(send, 0.0, 0.85), ev('b5.go') - 0.005, -12, -0.1, note='raw_send.mp3 0.00-0.85 s; envelope departs')
add('b5.fold tick', tick(1250, 0.05, 'fold'), ev('b5.fold') + 0.18, -27, 0.0, kind='local synthesis', note='flap closes')
# 5 SPAM receives it: paper thump + quiet latch
t = np.arange(int(0.34 * SR)) / SR
r = rng_for('thump')
body = np.sin(2 * np.pi * (96 - 38 * t / 0.34) * t) * np.exp(-t / 0.075)
paper = biquad_lp(biquad_hp(r.standard_normal(len(t)), 700), 3200) * np.exp(-t / 0.035) * 0.45
thump = (body * 0.9 + paper)
thump /= np.abs(thump).max()
add('b5.land thump', thump, ev('b5.land') - 0.004, -16, 0.0, kind='local synthesis', note='soft folder/paper thump')
add('b5.latch click', cut(spam, 0.80, 1.00), ev('b5.latch') - 0.044, 0, 0.12, note='raw_spam.mp3 0.80-1.00 s (subdued latch)')
# routine motion: tiny local ticks (never a whoosh)
for nm, f_, g_ in [('b4.hop1', 1250, -27), ('b4.hop2', 1400, -27), ('b4.hop3', 1550, -26)]:
    add(f'{nm} page tick', tick(f_, seed=nm), ev(nm), g_, -0.25, kind='local synthesis', note='pointer lands on a webpage card')
add('b6.unlock tick', tick(1500, 0.06, 'unlock'), ev('b6.unlock'), -23, 0.1, kind='local synthesis', note='SUBMIT unlocks')

# ------------------------------------------------------------------ music: original local synthesis, 114.286 BPM, 10 bars = 21.000 s
BARS = 10
BEAT = TOTAL / (BARS * 4)
BPM = 60.0 / BEAT
mus = np.zeros((N, 2))


def pluck(freq, dur=0.5, tau=0.16):
    t = np.arange(int(dur * SR)) / SR
    x = (np.sin(2 * np.pi * freq * t) + 0.38 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / (tau * 0.55)) + 0.14 * np.sin(2 * np.pi * freq * 3.99 * t) * np.exp(-t / (tau * 0.3))) * np.exp(-t / tau)
    x *= np.minimum(1, t / 0.003)
    return x


def bass(freq, dur=0.5):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)) * np.exp(-t / 0.28) * np.minimum(1, t / 0.006)


def wood(freq=1050):
    t = np.arange(int(0.06 * SR)) / SR
    return (np.sin(2 * np.pi * freq * t) * 0.8 + 0.2 * np.sin(2 * np.pi * freq * 2.3 * t)) * np.exp(-t / 0.014)


def shaker(seed):
    t = np.arange(int(0.05 * SR)) / SR
    return biquad_hp(rng_for(seed).standard_normal(len(t)), 6000) * np.exp(-t / 0.014)


def mallet(freq=92):
    t = np.arange(int(0.34 * SR)) / SR
    return np.sin(2 * np.pi * (freq - 14 * t / 0.34) * t) * np.exp(-t / 0.11)


# bars: Am9 Am9 Fmaj7 Fmaj7 Dm9 E7sus Am9 Fmaj7 Cmaj9 Am9   (bar 6 starts at 12.6 s: the spam outcome resolves upward, then back to Am9 for the loop)
CH = [([220.00, 261.63, 329.63, 392.00, 493.88], 110.00), ([220.00, 261.63, 329.63, 392.00, 493.88], 110.00),
      ([174.61, 220.00, 261.63, 329.63, 392.00], 87.31), ([174.61, 220.00, 261.63, 329.63, 392.00], 87.31),
      ([146.83, 174.61, 220.00, 261.63, 329.63], 73.42), ([164.81, 207.65, 246.94, 293.66, 329.63], 82.41),
      ([220.00, 261.63, 329.63, 392.00, 493.88], 110.00), ([174.61, 220.00, 261.63, 329.63, 392.00], 87.31),
      ([130.81, 164.81, 196.00, 246.94, 293.66], 65.41), ([220.00, 261.63, 329.63, 392.00, 493.88], 110.00)]
t_open = ev('b2.line1')                     # lean under the opening: pulse + one motif note pair until the evidence arrives
for bar in range(BARS):
    notes, root = CH[bar]
    t0 = bar * 4 * BEAT
    lean = t0 < t_open
    # muted pulse
    for b in range(4):
        place(mus, thud(62, 0.16, 0.05), t0 + b * BEAT, db(-9 if lean else -8), pan=0.0)
    # two-note plucked motif (root-ish low note -> a fifth/ninth higher), the only melodic idea
    place(mus, pluck(notes[0], 0.5, 0.16), t0, db(-6 if lean else -3), pan=-0.3)
    place(mus, pluck(notes[2], 0.5, 0.16), t0 + 1.5 * BEAT, db(-8 if lean else -5), pan=0.3)
    if not lean:
        place(mus, pluck(notes[1], 0.4, 0.13), t0 + 2.5 * BEAT, db(-9), pan=-0.1)
        place(mus, pluck(notes[3], 0.4, 0.13), t0 + 3.5 * BEAT, db(-10), pan=0.25)
        place(mus, bass(root, 0.6), t0, db(-5))
        place(mus, bass(root, 0.6), t0 + 2 * BEAT, db(-8))
        for b in (1, 3):
            place(mus, wood(1050 if b == 1 else 880), t0 + b * BEAT, db(-15), pan=0.25)
    if t0 >= ev('b4.chip1') - 0.1:           # restore a little motion for the test / send / spam sequence
        for s_ in range(8):
            if s_ % 2 == 1:
                place(mus, shaker(f's{bar}{s_}'), t0 + s_ * BEAT / 2, db(-18), pan=-0.2 if s_ % 4 == 1 else 0.2)


def gain_curve():
    t = np.arange(N) / SR
    g = np.interp(t, [0, t_open, t_open + 0.4, TOTAL], [db(-4), db(-4), db(-1.5), db(-1.5)])
    # pocket 1: before NO DESCRIPTION (deep); pocket 2: just around the thump/latch (shallow) so they land cleanly
    for a, b, depth in [(ev('pocket1.in'), ev('pocket1.out'), -30), (ev('pocket2.in'), ev('pocket2.out'), -14)]:
        k = np.where((t >= a) & (t <= b), np.minimum(np.clip((t - a) / 0.05, 0, 1), np.clip((b - t) / 0.20, 0, 1)), 0.0)
        g = g * (1 - k * (1 - db(depth)))
    g = g * np.clip(t / 0.02, 0, 1) * np.clip((TOTAL - t) / 0.45, 0, 1)
    return g


mus *= gain_curve()[:, None]
t = np.arange(N) / SR
pa, pb = ev('pocket1.in'), ev('pocket1.out')
pad = np.sin(2 * np.pi * 220 * t) * 0.5 + np.sin(2 * np.pi * 329.63 * t) * 0.3
pad *= np.clip((t - pa) / 0.08, 0, 1) * np.clip((pb - t) / 0.25, 0, 1) * (t >= pa) * (t <= pb) * db(-13)     # sustained note keeps the pocket from being dead air
# relief at the spam outcome: a warm, quiet Cmaj9 swell (no celebration)
ra, rb = ev('b5.land') + 0.05, ev('b5.land') + 1.7
relief = (np.sin(2 * np.pi * 261.63 * t) * 0.5 + np.sin(2 * np.pi * 329.63 * t) * 0.35 + np.sin(2 * np.pi * 392.0 * t) * 0.3 + np.sin(2 * np.pi * 493.88 * t) * 0.2)
relief *= np.clip((t - ra) / 0.25, 0, 1) * np.clip((rb - t) / 0.7, 0, 1) * (t >= ra) * (t <= rb) * db(-16)
mus[:, 0] += pad + relief; mus[:, 1] += pad + relief
mus *= db(-6)

# ------------------------------------------------------------------ stems -> loudness -> limiter -> files
voice_st = np.stack([voice, voice], 1) * db(-1.0)
mus = mus * (10 ** (duck_db / 20.0))[:, None]


def mix_of(vg, mg, sg):
    return voice_st * vg + mus * mg + sfx * sg


def lufs_of(x):
    p = f'/tmp/_m2.wav'
    wr(p, x)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    seg = out[out.rfind('Summary:'):]
    I = float([l for l in seg.splitlines() if l.strip().startswith('I:')][0].split()[1])
    return I


g_all = 1.0
for _ in range(4):
    I = lufs_of(mix_of(g_all, g_all, g_all))
    g_all *= 10 ** ((TARGET_LUFS - I) / 20.0)


def limiter(sumbus, ceil_db, look=0.004, rel=0.090):
    """look-ahead peak limiter; returns the gain curve (applied to every stem so they still sum to the mix)"""
    ceil = db(ceil_db)
    pk = np.abs(sumbus).max(1)
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    nl = int(look * SR)
    # minimum over the look-ahead window, then smooth with attack = look and release = rel
    from numpy.lib.stride_tricks import sliding_window_view
    pad = np.concatenate([need, np.ones(nl)])
    mn = sliding_window_view(pad, nl + 1).min(1)[: len(need)]
    out = np.ones_like(mn); cur = 1.0
    a = 1 - np.exp(-1.0 / (look * SR)); r_ = 1 - np.exp(-1.0 / (rel * SR))
    for i in range(len(mn)):
        tgt = mn[i]
        cur += (tgt - cur) * (a if tgt < cur else r_)
        out[i] = min(cur, mn[i]) if tgt < cur else cur
    return out


V, M, S = voice_st * g_all, mus * g_all, sfx * g_all
lim = limiter(V + M + S, CEIL_DBFS)
V, M, S = V * lim[:, None], M * lim[:, None], S * lim[:, None]
MIX = V + M + S
os.makedirs(f'{ROOT}/audio/stems_v2', exist_ok=True)
for nm, x in (('voice', V), ('music', M), ('sfx', S), ('mix', MIX)):
    wr(f'{ROOT}/audio/stems_v2/{nm}.wav', x)
os.makedirs(f'{ROOT}/source/public/audio', exist_ok=True)
wr(f'{ROOT}/source/public/audio/final_mix_v2.wav', MIX)
with open(f'{ROOT}/audio/sfx_log_v2.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['event', 'time_s', 'frame', 'gain_db', 'source', 'note'])
    w.writeheader(); w.writerows(sorted(LOG, key=lambda r: r['time_s']))
json.dump({'sample_rate': SR, 'duration_s': TOTAL, 'bpm': round(BPM, 3), 'bars': BARS, 'target_lufs': TARGET_LUFS, 'sample_peak_ceiling_dbfs': CEIL_DBFS,
           'stem_gain_db': round(20 * np.log10(g_all), 2), 'max_limiter_reduction_db': round(float(-20 * np.log10(lim.min())), 2),
           'ducking': 'up to -12 dB under speech; 20 ms attack / 240 ms release; derived from the narration envelope',
           'pockets_s': [[round(ev('pocket1.in'), 2), round(ev('pocket1.out'), 2)], [round(ev('pocket2.in'), 2), round(ev('pocket2.out'), 2)]]},
          open(f'{ROOT}/audio/MIX_LOG_V2.json', 'w'), indent=1)
print('bpm', round(BPM, 3), '| stem gain', round(20 * np.log10(g_all), 2), 'dB | limiter max reduction', round(float(-20 * np.log10(lim.min())), 2), 'dB')

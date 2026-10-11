#!/usr/bin/env python3
"""Sound design + mix for 'AI Invented a Murder Tip. Then Hit Send.' (numpy only, deterministic).

Reads   audio/cues.json                       (the one clock)
        audio/narration/narration_48k.wav     (ElevenLabs Test Voice, eleven_v4, take 1)
        audio/sfx/raw_*.wav                   (five ElevenLabs sound-effect generations; sliced here)
Writes  audio/stems/{voice,music,sfx,mix}.wav (48 kHz stereo, 16-bit, exactly the video length; stems sum to the mix)
        audio/sfx_log.csv, audio/MIX_LOG.json, source/public/audio/final_mix.wav

Music is original local synthesis (plucked/mallet bed, 128.571 BPM = exactly 15 bars over 28.000 s); the card ticks are subtle local
synthesis; the five named events are ElevenLabs generations. Nothing here is random without a fixed seed.
"""
import csv, hashlib, json, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(f'{ROOT}/audio/cues.json'))
EVS = cues['events_sec']
TOTAL = cues['total_frames'] / cues['fps']            # 28.000 s
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
voice = rd(f'{ROOT}/audio/narration/narration_48k.wav')
voice = biquad_hp(voice, 75.0)
vpad = np.zeros(N); vpad[: min(N, len(voice))] = voice[:N]
voice = vpad
# voice-activity envelope for ducking: 10 ms RMS, thresholded, attack 20 ms / release 240 ms (frame-driven, derived from the narration itself)
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
duck_db = np.interp(np.arange(N), (np.arange(nw) + 0.5) * win, -14.0 * env)   # up to -14 dB under speech

# ------------------------------------------------------------------ sound effects
sfx = np.zeros((N, 2))
LOG = []


def ev(name):
    return EVS[name]


def add(name, src, t, gain_db, pan=0.0, kind='ElevenLabs eleven_text_to_sound_v2', note=''):
    place(sfx, fade(src), t, db(gain_db), pan)
    LOG.append({'event': name, 'time_s': round(t, 3), 'frame': int(round(t * 30)), 'gain_db': gain_db, 'source': kind, 'note': note})


def raw(name):
    return rd(f'{ROOT}/audio/sfx/raw_{name}.wav')


def cut(x, a, b):
    return x[int(a * SR): int(b * SR)]


click, keys, err, send, spam = raw('click'), raw('keys'), raw('error'), raw('send'), raw('spam')
# 1 button press (the first of the file's separate clicks, 35 ms event at 0.025 s)
c1 = cut(click, 0.0, 0.14)
add('b1.press click', c1, ev('b1.press') - 0.025, -7, 0.10, note='first click of raw_click.mp3 (file had several; only this one used)')
add('b4.press click', c1, ev('b4.press') - 0.025, -7, 0.10, note='same sample, second press')
# 2 invented text: a brief soft keyboard cluster, then silence
add('b3.type keys', cut(keys, 0.0, 0.80), ev('b3.type0') - 0.012, -2, -0.15, note='raw_keys.mp3 0.00-0.80 s')
# 3 missing description: one dry muted error tap
add('b3.tap error', cut(err, 0.0, 0.38), ev('b3.tap') - 0.004, -2, 0.0, note='raw_error.mp3 0.00-0.38 s; single understated knock, no buzzer')
# 4 message travels: small electronic send accent
add('b4.send accent', cut(send, 0.0, 1.05), ev('b4.send') - 0.005, -11, 0.0, note='raw_send.mp3 0.00-1.05 s')
# 5 spam landing: a soft paper/folder thump (local, because the generated thump was very quiet) + the generated subdued latch
t = np.arange(int(0.34 * SR)) / SR
r = rng_for('thump')
body = np.sin(2 * np.pi * (96 - 38 * t / 0.34) * t) * np.exp(-t / 0.075)
paper = biquad_lp(biquad_hp(r.standard_normal(len(t)), 700), 3200) * np.exp(-t / 0.035) * 0.45
thump = (body * 0.9 + paper)
thump /= np.abs(thump).max()
add('b4.land thump', thump, ev('b4.land') - 0.004, -16, 0.0, kind='local synthesis', note='soft folder/paper thump; layered under nothing else')
latch = cut(spam, 0.80, 1.00)
add('b4.latch click', latch, ev('b4.latch') - 0.044, 1, 0.12, note='raw_spam.mp3 0.80-1.00 s (the generated subdued latch)')

# subtle local card ticks (routine movement; deliberately tiny, never a whoosh)
def tick(freq=1500, dur=0.045, seed='t'):
    t = np.arange(int(dur * SR)) / SR
    r = rng_for(seed)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.011) + 0.35 * biquad_hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.006)
    return x / np.abs(x).max()


def thud(freq=140, dur=0.12, seed='th'):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.032)
    return x / np.abs(x).max()


for nm, tt, f_, g_ in [('b2.hop1', ev('b2.hop1'), 1250, -26), ('b2.hop2', ev('b2.hop2'), 1400, -26), ('b2.hop3', ev('b2.hop3'), 1550, -25)]:
    add(f'{nm} marker tick', tick(f_, seed=nm), tt, g_, -0.3 + 0.3 * ['b2.hop1', 'b2.hop2', 'b2.hop3'].index(nm), kind='local synthesis', note='marker landing on a card')
add('b4.arrive inbox tap', thud(180, 0.1, 'arr'), ev('b4.arrive'), -26, -0.25, kind='local synthesis', note='envelope reaches the inbox (before the folder responds)')
add('b5.start card tick', tick(1100, 0.06, 'rep'), ev('b5.start') + 0.07, -27, 0.0, kind='local synthesis', note='report card')
add('b5.date2 tick', tick(1700, 0.05, 'd2'), ev('b5.date2'), -27, 0.2, kind='local synthesis', note='second date lands')
add('b6.button tick', tick(1300, 0.05, 'btn'), ev('b6.button'), -27, 0.1, kind='local synthesis', note='button appears')

# ------------------------------------------------------------------ music: original local synthesis, 128.571 BPM, 15 bars = 28.000 s
BARS = 15
BEAT = TOTAL / (BARS * 4)
BPM = 60.0 / BEAT
mus = np.zeros((N, 2))


def pluck(freq, dur=0.5, tau=0.16, seed='p'):
    t = np.arange(int(dur * SR)) / SR
    x = (np.sin(2 * np.pi * freq * t) + 0.38 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / (tau * 0.55)) + 0.14 * np.sin(2 * np.pi * freq * 3.99 * t) * np.exp(-t / (tau * 0.3))) * np.exp(-t / tau)
    x *= np.minimum(1, t / 0.003)
    return x


def bass(freq, dur=0.5):
    t = np.arange(int(dur * SR)) / SR
    x = (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)) * np.exp(-t / 0.28) * np.minimum(1, t / 0.006)
    return x


def shaker(seed):
    t = np.arange(int(0.05 * SR)) / SR
    return biquad_hp(rng_for(seed).standard_normal(len(t)), 6000) * np.exp(-t / 0.014)


def wood(freq=1050):
    t = np.arange(int(0.06 * SR)) / SR
    return (np.sin(2 * np.pi * freq * t) * 0.8 + 0.2 * np.sin(2 * np.pi * freq * 2.3 * t)) * np.exp(-t / 0.014)


def mallet(freq=92):
    t = np.arange(int(0.34 * SR)) / SR
    return np.sin(2 * np.pi * (freq - 14 * t / 0.34) * t) * np.exp(-t / 0.11)


# Am9 | Fmaj7 | Dm9 | E7sus->E7
CH = [([220.00, 261.63, 329.63, 392.00, 493.88], 110.00), ([174.61, 220.00, 261.63, 329.63, 392.00], 87.31),
      ([146.83, 174.61, 220.00, 261.63, 329.63], 73.42), ([164.81, 207.65, 246.94, 293.66, 329.63], 82.41)]
ARP_SPARSE = [(0, 0), (2, 2), (4, 1), (6, 3)]                                     # (eighth-note step, chord-tone) : quarter-note feel
ARP_FULL = [(0, 0), (1, 2), (2, 1), (3, 3), (4, 2), (5, 1), (6, 3), (7, 4)]
t_b2 = ev('b2.start') + 0.2
for bar in range(BARS):
    notes, root = CH[bar % 4]
    t0 = bar * 4 * BEAT
    sparse = t0 < t_b2
    for step, idx in (ARP_SPARSE if sparse else ARP_FULL):
        tt = t0 + step * BEAT / 2
        place(mus, pluck(notes[idx], 0.55, 0.15 if sparse else 0.13, f'p{bar}{step}'), tt, db(-3 if step % 2 == 0 else -6), pan=-0.35 + 0.7 * ((step + bar) % 3) / 2)
    if not sparse:
        for b in (0, 2):
            place(mus, bass(root, 0.6), t0 + b * BEAT, db(-4))
        for b in (1, 3):
            place(mus, wood(1050 if b == 1 else 880), t0 + b * BEAT, db(-14), pan=0.25)
        for s_ in range(8):
            if s_ % 2 == 1:
                place(mus, shaker(f's{bar}{s_}'), t0 + s_ * BEAT / 2, db(-17), pan=-0.2 if s_ % 4 == 1 else 0.2)
    if t0 >= ev('b3.start'):
        place(mus, mallet(92), t0, db(-8))
# envelope: gentle sections, two pockets (before the missing-description reveal; around the spam reveal), clean fades at both ends
def gain_curve():
    t = np.arange(N) / SR
    # level by scene
    g = np.interp(t, [0, ev('b2.start'), ev('b2.start') + 0.4, TOTAL], [db(-5), db(-5), db(-1.5), db(-1.5)])
    # pockets
    pockets = [(ev('b3.pocket'), ev('b3.tap') + 0.55), (ev('b4.pocket0'), ev('b4.pocket1') - 0.12)]
    for a, b in pockets:
        k = np.where((t >= a) & (t <= b), np.minimum(np.clip((t - a) / 0.045, 0, 1), np.clip((b - t) / 0.18, 0, 1)), 0.0)
        g = g * (1 - k * (1 - db(-30)))
    g = g * np.clip(t / 0.02, 0, 1) * np.clip((TOTAL - t) / 0.45, 0, 1)                     # clean boundary for the loop
    return g
mus *= gain_curve()[:, None]
# the sustained note that keeps the first pocket from being dead air
t = np.arange(N) / SR
pa, pb = ev('b3.pocket'), ev('b3.tap') + 0.55
pad = np.sin(2 * np.pi * 220 * t) * 0.5 + np.sin(2 * np.pi * 329.63 * t) * 0.3
pad *= np.clip((t - pa) / 0.08, 0, 1) * np.clip((pb - t) / 0.25, 0, 1) * (t >= pa) * (t <= pb) * db(-12)
mus[:, 0] += pad; mus[:, 1] += pad
mus *= db(-6)

# ------------------------------------------------------------------ stems -> loudness -> limiter -> files
voice_st = np.stack([voice, voice], 1) * db(-1.0)
mus = mus * (10 ** (duck_db / 20.0))[:, None]


def mix_of(vg, mg, sg):
    return voice_st * vg + mus * mg + sfx * sg


def lufs_of(x):
    p = f'/tmp/_m.wav'
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
os.makedirs(f'{ROOT}/audio/stems', exist_ok=True)
for nm, x in (('voice', V), ('music', M), ('sfx', S), ('mix', MIX)):
    wr(f'{ROOT}/audio/stems/{nm}.wav', x)
os.makedirs(f'{ROOT}/source/public/audio', exist_ok=True)
wr(f'{ROOT}/source/public/audio/final_mix.wav', MIX)
with open(f'{ROOT}/audio/sfx_log.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['event', 'time_s', 'frame', 'gain_db', 'source', 'note'])
    w.writeheader(); w.writerows(sorted(LOG, key=lambda r: r['time_s']))
json.dump({'sample_rate': SR, 'duration_s': TOTAL, 'bpm': round(BPM, 3), 'bars': BARS, 'target_lufs': TARGET_LUFS, 'sample_peak_ceiling_dbfs': CEIL_DBFS,
           'stem_gain_db': round(20 * np.log10(g_all), 2), 'max_limiter_reduction_db': round(float(-20 * np.log10(lim.min())), 2),
           'ducking': 'up to -14 dB under speech; 20 ms attack / 240 ms release; derived from the narration envelope',
           'pockets_s': [[round(ev('b3.pocket'), 2), round(ev('b3.tap') + 0.55, 2)], [round(ev('b4.pocket0'), 2), round(ev('b4.pocket1') - 0.12, 2)]]},
          open(f'{ROOT}/audio/MIX_LOG.json', 'w'), indent=1)
print('bpm', round(BPM, 3), '| stem gain', round(20 * np.log10(g_all), 2), 'dB | limiter max reduction', round(float(-20 * np.log10(lim.min())), 2), 'dB')

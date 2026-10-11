#!/usr/bin/env python3
"""Dialogue-first sound design + mix for V3 Final 'AI Sent Police a Fake Murder Tip' (numpy only, deterministic).

Reads   audio/cues_v3.json                                  (the one clock)
        audio/narration_v2/narration_v2_final_48k.wav       (approved ElevenLabs Test Voice take; unchanged, high-passed only)
        audio/sfx/raw_click.wav                             (V1 ElevenLabs click generation, reused; no new generations)
        audio/stems_v2/{voice,music}.wav                    (V2 stems, used ONLY to measure the V2 music-under-voice ratio the V3 underlay is calibrated against)
Writes  audio/stems_v3_final/{narration,music,effects,mix}.wav   (48 kHz stereo 16-bit, exactly the video length; stems sum to the mix)
        audio/sfx_log_v3.csv, audio/MIX_LOG_V3.json, source/public/audio/final_mix_v3.wav

V3 mix decisions (all objective; nothing here claims to have been listened to):
  * music underlay is calibrated to sit 3.0 dB further under the voice than V2 over the same speech windows (voice and master target unchanged: -15 LUFS)
  * a deeper pocket starts just before "Except" and holds through the reveal; the bed is lowered a further 3 dB under the spam outcome and again under the final takeaway
  * ducking is driven by the narration with 40 ms look-ahead, 30 ms attack, 320 ms release
  * effects are only: UI click at contact, light paper at ~0.7 s and ~2.1 s, one dry stamp tap in the micro-pause before "no", one muted folder thud, one tiny button tick; nothing at frame 0
"""
import csv, hashlib, json, os, subprocess, sys, tempfile, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(f'{ROOT}/audio/cues_v3.json'))
EVS = cues['events_sec']
TOTAL = cues['total_frames'] / cues['fps']            # 21.000 s
N = int(round(TOTAL * SR))
TARGET_LUFS, CEIL_DBFS = -15.0, -1.9                  # integrated loudness target; sample-peak ceiling (keeps the encoded true peak below -1.5 dBTP)
UNDERLAY_DELTA_DB = -3.0                              # music vs voice, relative to V2, in speech windows outside the deeper sections
TMP = tempfile.mkdtemp(prefix='fgw_v3_')


def rd(path, mono=True):
    with wave.open(path) as w:
        n, ch, sw = w.getnframes(), w.getnchannels(), w.getsampwidth()
        a = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float64) / 32768.0
        if ch > 1:
            a = a.reshape(-1, ch)
            a = a.mean(1) if mono else a
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


def _bq(x, b0, b1, b2, a1, a2):
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for n in range(len(x)):
        v = b0 * x[n] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        y[n] = v; x2, x1 = x1, x[n]; y2, y1 = y1, v
    return y


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


def ev(name):
    return EVS[name]


# ------------------------------------------------------------------ narration (approved take, unchanged)
voice = rd(f'{ROOT}/audio/narration_v2/narration_v2_final_48k.wav')
voice = biquad_hp(voice, 75.0)
vpad = np.zeros(N); vpad[: min(N, len(voice))] = voice[:N]
voice = vpad
win = int(0.010 * SR)
nw = N // win
rms = np.sqrt((voice[: nw * win].reshape(nw, win) ** 2).mean(1) + 1e-12)
active = (20 * np.log10(rms) > -46.0).astype(float)
act_s = np.repeat(active > 0, win)
act_s = np.concatenate([act_s, np.zeros(N - len(act_s), bool)])
VOICE_RMS_DB = 20 * np.log10(np.sqrt((voice[act_s] ** 2).mean()))     # RMS over speech-active windows (dBFS), reference for effect levels

# ducking envelope: look-ahead 40 ms, attack 30 ms, release 320 ms
look = 4
act_la = np.concatenate([active[look:], np.zeros(look)])
env = np.zeros(nw); cur = 0.0
for i in range(nw):
    tgt = act_la[i]
    k = 1 - np.exp(-0.010 / (0.030 if tgt > cur else 0.320))
    cur += (tgt - cur) * k
    env[i] = cur
DUCK_DB = -12.0
duck_db = np.interp(np.arange(N), (np.arange(nw) + 0.5) * win, DUCK_DB * env)

# ------------------------------------------------------------------ effects (levels are set relative to the voice RMS, so they follow any later loudness change)
sfx = np.zeros((N, 2))
LOG = []


def add(name, src, t, rel_db, pan=0.0, kind='local synthesis', note=''):
    src = src / max(np.abs(src).max(), 1e-9)
    place(sfx, fade(src), t, db(VOICE_RMS_DB + rel_db), pan)
    LOG.append({'event': name, 'time_s': round(t, 3), 'frame': int(round(t * 30)), 'peak_re_voice_rms_db': rel_db, 'source': kind, 'note': note})


def thud(freq=140, dur=0.12, tau=0.032):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * freq * t) * np.exp(-t / tau)


def tick(freq=1500, dur=0.045, seed='t'):
    t = np.arange(int(dur * SR)) / SR
    r = rng_for(seed)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.011) + 0.35 * biquad_hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.006)


def paper(dur, grains, seed, lo=1400, hi=5200, tau=0.018):
    """light paper: a few short band-limited noise grains with fast decays (a crinkle, not a sweep)"""
    r = rng_for(seed)
    n = int(dur * SR)
    x = np.zeros(n)
    for g_t, g_a in grains:
        m = int(0.07 * SR)
        tt = np.arange(m) / SR
        gn = biquad_lp(biquad_hp(r.standard_normal(m), lo), hi) * np.exp(-tt / tau) * np.minimum(1, tt / 0.003)
        i = int(g_t * SR)
        x[i:i + m] += gn[: max(0, min(m, n - i))] * g_a if i < n else 0
    return x


click = rd(f'{ROOT}/audio/sfx/raw_click.wav')
# 1 contact: dry UI click (the first 0.14 s of the V1 click generation) + a restrained low tap
add('o.press click', click[: int(0.14 * SR)], ev('o.press') - 0.025, -4.0, 0.08, kind='ElevenLabs eleven_text_to_sound_v2 (V1 generation, reused)', note='first 0.14 s of raw_click; the picture shows contact on the same frame +25 ms')
add('o.press low tap', thud(120, 0.14, 0.04), ev('o.press') + 0.004, -22.0, 0.0, note='restrained low tap under the click')
# 2 paper: the tip copy lifts and folds into the envelope (~0.7 s); the packet opens into the quote paper (~2.1 s)
add('o.fold paper', paper(0.20, [(0.0, 1.0), (0.045, 0.7), (0.09, 0.5)], 'paper-fold'), ev('o.fold') - 0.035, -13.0, -0.12, note='light paper while the copy folds into the envelope')
add('o.open paper', paper(0.26, [(0.0, 0.8), (0.05, 1.0), (0.11, 0.6), (0.16, 0.4)], 'paper-open', lo=1100, hi=4600, tau=0.022), ev('o.open') + 0.03, -12.0, 0.10, note='light paper as the packet opens toward camera and becomes the quote surface')
# 3 the finding: one small dry stamp tap in the micro-pause before "no" (voice "had" ends 6.44, "no" starts 6.52)
stamp = thud(165, 0.09, 0.016) * 0.9
stamp[:int(0.04 * SR)] += tick(2300, 0.04, 'stamp') * 0.45
add('b3.stamp tap', stamp, ev('b3.stamp'), -10.0, 0.0, note='dry tap on the stamp frame, inside the 80 ms gap before "no"; quiet by design')
# 4 the spam intercept: one muted folder thud
t = np.arange(int(0.34 * SR)) / SR
body = np.sin(2 * np.pi * (92 - 36 * t / 0.34) * t) * np.exp(-t / 0.07)
dust = biquad_lp(biquad_hp(rng_for('thud').standard_normal(len(t)), 500), 1800) * np.exp(-t / 0.03) * 0.35
add('b5.land folder thud', body * 0.9 + dust, ev('b5.land') - 0.004, -9.0, 0.0, note='muted thud as the envelope lands in the SPAM folder (low-passed, no latch, no alert)')
# 5 optional: tiny tick when the button becomes enabled
add('b6.enable tick', tick(1500, 0.05, 'enable'), ev('b6.enable'), -21.0, 0.1, note='SUBMIT becomes enabled (never pressed)')

# ------------------------------------------------------------------ music: original local synthesis, 114.286 BPM, 10 bars = 21.000 s (same material as V2)
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


CH = [([220.00, 261.63, 329.63, 392.00, 493.88], 110.00), ([220.00, 261.63, 329.63, 392.00, 493.88], 110.00),
      ([174.61, 220.00, 261.63, 329.63, 392.00], 87.31), ([174.61, 220.00, 261.63, 329.63, 392.00], 87.31),
      ([146.83, 174.61, 220.00, 261.63, 329.63], 73.42), ([164.81, 207.65, 246.94, 293.66, 329.63], 82.41),
      ([220.00, 261.63, 329.63, 392.00, 493.88], 110.00), ([174.61, 220.00, 261.63, 329.63, 392.00], 87.31),
      ([130.81, 164.81, 196.00, 246.94, 293.66], 65.41), ([220.00, 261.63, 329.63, 392.00, 493.88], 110.00)]
t_open = ev('b2.line1')
for bar in range(BARS):
    notes, root = CH[bar]
    t0 = bar * 4 * BEAT
    lean = t0 < t_open
    for b in range(4):
        place(mus, thud(62, 0.16, 0.05) / 1.0, t0 + b * BEAT, db(-9 if lean else -8), pan=0.0)
    place(mus, pluck(notes[0], 0.5, 0.16), t0, db(-6 if lean else -3), pan=-0.3)
    place(mus, pluck(notes[2], 0.5, 0.16), t0 + 1.5 * BEAT, db(-8 if lean else -5), pan=0.3)
    if not lean:
        place(mus, pluck(notes[1], 0.4, 0.13), t0 + 2.5 * BEAT, db(-9), pan=-0.1)
        place(mus, pluck(notes[3], 0.4, 0.13), t0 + 3.5 * BEAT, db(-10), pan=0.25)
        place(mus, bass(root, 0.6), t0, db(-5))
        place(mus, bass(root, 0.6), t0 + 2 * BEAT, db(-8))
        for b in (1, 3):
            place(mus, wood(1050 if b == 1 else 880), t0 + b * BEAT, db(-15), pan=0.25)
    if t0 >= ev('b4.chip1') - 0.1:
        for s_ in range(8):
            if s_ % 2 == 1:
                place(mus, shaker(f's{bar}{s_}'), t0 + s_ * BEAT / 2, db(-18), pan=-0.2 if s_ % 4 == 1 else 0.2)

SECTIONS = {   # extra bed reductions (dB) beyond the base underlay; smooth 0.35 s ramps
    'spam outcome': (ev('b5.inbox'), ev('b5.never') + 0.9, -3.0),
    'final takeaway': (ev('b6.start'), TOTAL, -3.0),
}


def gain_curve():
    t = np.arange(N) / SR
    g = np.interp(t, [0, t_open, t_open + 0.4, TOTAL], [db(-4), db(-4), db(-1.5), db(-1.5)])
    # pocket 1: from just before "Except" through the reveal (deeper than V2); pocket 2: shallow, only around the folder thud
    for a, b, depth in [(ev('pocket1.in'), ev('pocket1.out'), -38), (ev('pocket2.in'), ev('pocket2.out'), -12)]:
        k = np.where((t >= a) & (t <= b), np.minimum(np.clip((t - a) / 0.06, 0, 1), np.clip((b - t) / 0.30, 0, 1)), 0.0)
        g = g * (1 - k * (1 - db(depth)))
    for a, b, depth in SECTIONS.values():
        k = np.clip((t - a) / 0.35, 0, 1) * np.clip((b - t) / 0.35 + (1 if b >= TOTAL else 0), 0, 1)
        g = g * db(depth * k)
    g = g * np.clip(t / 0.02, 0, 1) * np.clip((TOTAL - t) / 0.60, 0, 1)      # clean loop boundary: bed fades to ~0 over the last 0.6 s
    return g


mus *= gain_curve()[:, None]
t = np.arange(N) / SR
pa, pb = ev('pocket1.in'), ev('pocket1.out')
pad = np.sin(2 * np.pi * 220 * t) * 0.5 + np.sin(2 * np.pi * 329.63 * t) * 0.3
pad *= np.clip((t - pa) / 0.08, 0, 1) * np.clip((pb - t) / 0.30, 0, 1) * (t >= pa) * (t <= pb) * db(-16)    # a held note keeps the pocket from being dead air (quieter than V2)
ra, rb = ev('b5.land') + 0.05, ev('b5.land') + 1.7
relief = (np.sin(2 * np.pi * 261.63 * t) * 0.5 + np.sin(2 * np.pi * 329.63 * t) * 0.35 + np.sin(2 * np.pi * 392.0 * t) * 0.3 + np.sin(2 * np.pi * 493.88 * t) * 0.2)
relief *= np.clip((t - ra) / 0.25, 0, 1) * np.clip((rb - t) / 0.7, 0, 1) * (t >= ra) * (t <= rb) * db(-20)   # warm Cmaj9 swell, 4 dB quieter than V2
mus[:, 0] += pad + relief; mus[:, 1] += pad + relief
mus *= db(-6)

# ------------------------------------------------------------------ calibrate the underlay against V2 (same speech windows, sections that stay at the base level)
mus_d = mus * (10 ** (duck_db / 20.0))[:, None]


def speech_ratio_db(m_stereo, v_mono, mask):
    return 20 * np.log10(np.sqrt((m_stereo.mean(1)[mask] ** 2).mean()) / np.sqrt((v_mono[mask] ** 2).mean()))


base_mask = act_s.copy()
tt = np.arange(N) / SR
for a, b, _ in list(SECTIONS.values()) + [(ev('pocket1.in'), ev('pocket1.out'), 0), (ev('pocket2.in'), ev('pocket2.out'), 0)]:
    base_mask &= ~((tt >= a - 0.05) & (tt <= b + 0.05))
v2_voice = rd(f'{ROOT}/audio/stems_v2/voice.wav')[:N]
v2_music = rd(f'{ROOT}/audio/stems_v2/music.wav', mono=False)[:N]
R2_base = speech_ratio_db(v2_music, v2_voice, base_mask)                        # V2 music vs voice, base windows
R2_all = speech_ratio_db(v2_music, v2_voice, act_s)
voice_unit = voice * db(-1.0)
R3_pre = speech_ratio_db(mus_d, voice_unit, base_mask)
trim_db = (R2_base + UNDERLAY_DELTA_DB) - R3_pre                                # trim so the V3 base underlay sits exactly 3.0 dB further under the voice than V2
mus_d = mus_d * db(trim_db)
R3_base = speech_ratio_db(mus_d, voice_unit, base_mask)
R3_all = speech_ratio_db(mus_d, voice_unit, act_s)

# ------------------------------------------------------------------ stems -> loudness -> limiter -> files
voice_st = np.stack([voice, voice], 1) * db(-1.0)


def mix_of(vg, mg, sg):
    return voice_st * vg + mus_d * mg + sfx * sg


def lufs_of(x):
    p = os.path.join(TMP, 'm.wav')
    wr(p, x)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    seg = out[out.rfind('Summary:'):]
    return float([l for l in seg.splitlines() if l.strip().startswith('I:')][0].split()[1])


g_all = 1.0
for _ in range(4):
    I = lufs_of(mix_of(g_all, g_all, g_all))
    g_all *= 10 ** ((TARGET_LUFS - I) / 20.0)


def limiter(sumbus, ceil_db, look=0.004, rel=0.090):
    ceil = db(ceil_db)
    pk = np.abs(sumbus).max(1)
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    nl = int(look * SR)
    from numpy.lib.stride_tricks import sliding_window_view
    pad_ = np.concatenate([need, np.ones(nl)])
    mn = sliding_window_view(pad_, nl + 1).min(1)[: len(need)]
    out = np.ones_like(mn); cur = 1.0
    a = 1 - np.exp(-1.0 / (look * SR)); r_ = 1 - np.exp(-1.0 / (rel * SR))
    for i in range(len(mn)):
        tgt = mn[i]
        cur += (tgt - cur) * (a if tgt < cur else r_)
        out[i] = min(cur, mn[i]) if tgt < cur else cur
    return out


V, M, S = voice_st * g_all, mus_d * g_all, sfx * g_all
lim = limiter(V + M + S, CEIL_DBFS)
V, M, S = V * lim[:, None], M * lim[:, None], S * lim[:, None]
MIX = V + M + S
outdir = f'{ROOT}/audio/stems_v3_final'
os.makedirs(outdir, exist_ok=True)
for nm, x in (('narration', V), ('music', M), ('effects', S), ('mix', MIX)):
    wr(f'{outdir}/{nm}.wav', x)
os.makedirs(f'{ROOT}/source/public/audio', exist_ok=True)
wr(f'{ROOT}/source/public/audio/final_mix_v3.wav', MIX)
with open(f'{ROOT}/audio/sfx_log_v3.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['event', 'time_s', 'frame', 'peak_re_voice_rms_db', 'source', 'note'])
    w.writeheader(); w.writerows(sorted(LOG, key=lambda r: r['time_s']))
json.dump({
    'sample_rate': SR, 'duration_s': TOTAL, 'bpm': round(BPM, 3), 'bars': BARS, 'target_lufs': TARGET_LUFS, 'sample_peak_ceiling_dbfs': CEIL_DBFS,
    'stem_gain_db': round(20 * np.log10(g_all), 2), 'max_limiter_reduction_db': round(float(-20 * np.log10(lim.min())), 2),
    'voice': 'approved Test Voice take (narration_v2_final_48k.wav), unchanged; 75 Hz high-pass only; -1 dB trim before the master gain',
    'voice_speech_rms_dbfs_before_master': round(float(VOICE_RMS_DB), 2),
    'ducking': 'up to -12 dB under speech; 40 ms look-ahead, 30 ms attack, 320 ms release (V2: no look-ahead, 20 ms / 240 ms); derived from the narration envelope',
    'duck_curve_max_slope_db_per_s': {'v3': round(float(np.abs(np.diff(duck_db)).max() * SR), 1), 'v2_equivalent_attack_20ms': round(12.0 / 0.020, 1), 'v3_theoretical_attack_30ms': round(12.0 / 0.030, 1)},
    'underlay': {'v2_music_vs_voice_db_base_windows': round(float(R2_base), 2), 'v2_music_vs_voice_db_all_speech': round(float(R2_all), 2),
                 'v3_music_vs_voice_db_base_windows': round(float(R3_base), 2), 'v3_music_vs_voice_db_all_speech': round(float(R3_all), 2),
                 'trim_applied_db': round(float(trim_db), 2), 'target_delta_db': UNDERLAY_DELTA_DB,
                 'method': 'RMS of the music stem divided by RMS of the voice stem over speech-active 10 ms windows that are not inside a pocket or a lowered section; V2 measured from audio/stems_v2'},
    'pockets_s': [[round(ev('pocket1.in'), 2), round(ev('pocket1.out'), 2), -38], [round(ev('pocket2.in'), 2), round(ev('pocket2.out'), 2), -12]],
    'extra_bed_reduction_db': {k: [round(a, 2), round(b, 2), d] for k, (a, b, d) in SECTIONS.items()},
    'bed_fade_out': 'last 0.6 s', 'effects_peak_reference': 'dB re the voice RMS over speech-active windows'},
    open(f'{ROOT}/audio/MIX_LOG_V3.json', 'w'), indent=1)
print('bpm', round(BPM, 3), '| stem gain', round(20 * np.log10(g_all), 2), 'dB | limiter max reduction', round(float(-20 * np.log10(lim.min())), 2), 'dB')
print('music-vs-voice (speech windows, base): V2', round(float(R2_base), 2), 'dB -> V3', round(float(R3_base), 2), 'dB | all speech V2', round(float(R2_all), 2), '-> V3', round(float(R3_all), 2), '| trim', round(float(trim_db), 2), 'dB')

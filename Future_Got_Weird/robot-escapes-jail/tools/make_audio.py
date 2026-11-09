#!/usr/bin/env python3
"""Effects, music bed and mix for the Robot Escapes Jail Short ("This robot escaped jail... by melting", 32.40 s).

Everything is synthesised (tools/sfx_lib.py: the effects; tools/music.py: the bed). No samples, no third-party music.
The narration master is used sample for sample (gain, a gentle compressor and a true-peak limiter only).

Cues: audio/cues.json = {"duration": 32.4, "cues": [{"t", "kind", "gain"?, "dur"?, "pan"?, "variant"?}, ...]}
  t        film seconds (the sound's start; for 'sting' the HIT, its swell starts 0.22 s earlier). A sound that runs
           past the end continues at the start (the Short loops).
  kind     one of sfx_lib.KINDS (alarm, alarm_tail, door_slide, door_slam, cup_drop, splash, bar_tap, mech_click, servo,
           melt, flow, drip, glug, pipette, cool, mag_hum, heat_coil, whoosh, swish, pop, guard_gasp, guard_gulp, sting,
           reveal)
  gain     dB offset on the kind's level (default 0)
  dur      seconds, for the kinds that stretch (alarm, alarm_tail, melt, flow, mag_hum, heat_coil, cool, whoosh, ...)
  pan      -1..1 overrides the kind's pan; variant (mech_click) 0-3
  alarm:   gates one loop-periodic klaxon bed (one tone per music beat); fades in 0.12 s (none if t <= 0.02: the loop's
           continuation) and out 0.25 s (none if it reaches the end: it continues into frame 0). alarm_tail fades it
           out over its dur. Overlapping alarm cues never double up.

Levels: each kind has a level (its loudest 400 ms loudness, dB re the voice, before ducking): effects 10-19 dB under
the voice, ducked under the words (deeper above 2.4 kHz). The music is ducked by the voice (sidechain-style, deeper
in the voice band) and set so that inside the words it sits 20 dB under the voice (median of 400 ms loudness); in the
gaps it comes up ~5-7 dB. Voice -16 LUFS (mono) before the master gain; the stereo file -14 LUFS integrated, true
peak <= -1.5 dBTP (4x oversampled, circular limiter so the loop has no seam).

usage:  python3 tools/make_audio.py <name> [cues.json] [--stems] [--spectrogram out.png]
        python3 tools/make_audio.py --gallery [out.png]     every effect kind alone -> audio/mix/sfx_gallery.wav/.json
writes: source/public/audio/<name>.wav, audio/mix/FGW_Robot_Escapes_Jail_<NAME>.wav (48 kHz 24-bit stereo),
        audio/mix/mix_measure_<name>.json, audio/sfx_log_<name>.json, with --stems audio/mix/stems/<name>_{voice,sfx,music}.wav"""
import json, os, sys, zlib
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, sosfiltfilt, lfilter, resample_poly, spectrogram
from scipy.ndimage import minimum_filter1d, maximum_filter1d, uniform_filter1d

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sfx_lib as X
import music as M

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NARRATION = 'audio/narration/FGW_Robot_Escapes_Jail_narration_V1.wav'
VREF = -16.0          # the voice's integrated loudness (mono) before the master gain
ST = 3.0103           # a centred (dual-mono) signal reads +3.01 dB measured as stereo
MUSIC_UNDER = 20.0    # music under the voice inside the words (median, 400 ms loudness)
VOICE_CEIL = -1.0     # the voice's own true-peak limiter (at VREF; the master gain then takes ~1 dB off)
CEIL = -1.6           # master true-peak ceiling (measured <= -1.5 dBTP)

argv = sys.argv[1:]
def flag(name):
    if name in argv: argv.remove(name); return True
    return False
def opt(name):
    if name in argv:
        k = argv.index(name); v = argv[k + 1] if k + 1 < len(argv) and not argv[k + 1].startswith('--') else None
        del argv[k:k + (2 if v else 1)]; return v or True
    return None
STEMS = flag('--stems')
GALLERY = opt('--gallery')
SPECTRO = opt('--spectrogram')
if not GALLERY and not argv:
    sys.exit(__doc__)


# ---------------------------------------------------------------- helpers
def db(x): return 10 ** (np.asarray(x, float) / 20)
def _sos(kind, f, o): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('lowpass', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('highpass', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(_sos('bandpass', [lo, hi], o), x, axis=0)
def circ(f, x):
    """filter as if the signal were periodic (the film loops): no seam, no start-up transient"""
    return f(np.concatenate([x, x, x]))[2 * len(x):]
def smooth(x, f, o=2):
    n = len(x)
    return sosfiltfilt(_sos('lowpass', f, o), np.concatenate([x, x, x]))[n:2 * n]
def mono(x): return x if x.ndim == 1 else x.mean(1)
KB1, KA1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
KB2, KA2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
def kms(x, win):
    """K-weighted mean square in a sliding window, summed over channels (BS.1770)"""
    y = lfilter(KB2, KA2, lfilter(KB1, KA1, x, axis=0), axis=0)
    e = uniform_filter1d(y * y, max(1, int(win * SR)), axis=0, mode='constant')
    return np.maximum(e if e.ndim == 1 else e.sum(1), 0.0)
def lk(x, win=0.4): return -0.691 + 10 * np.log10(kms(x, win) + 1e-20)
def lmax(x, win=0.4):
    pad = np.zeros((int(win * SR) // 2 + 1,) + x.shape[1:])
    return round(float(-0.691 + 10 * np.log10(kms(np.concatenate([pad, x, pad]), win).max() + 1e-20)), 2)
meter = pyln.Meter(SR)
def lufs(x):
    try:
        v = float(meter.integrated_loudness(x))
        return round(v, 2) if np.isfinite(v) else None
    except Exception: return None
def tp_db(x):
    pad = 256
    xx = np.concatenate([x[-pad:], x, x[:pad]])
    return round(float(20 * np.log10(np.max(np.abs(resample_poly(xx, 4, 1, axis=0))) + 1e-12)), 2)
def rms_db(x): return round(float(20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-12)), 2)
def ir_room(rt, n_s, rng, damp=2500):
    n = int(n_s * SR); t = np.arange(n) / SR; out = np.zeros((n, 2))
    for c in range(2):
        nz = rng.standard_normal(n)
        x = lp(nz, damp) * np.exp(-t / (rt / 6.9)) + 0.4 * hp(nz, damp) * np.exp(-t / (rt * 0.45 / 6.9))
        x[:int(0.008 * SR)] = 0
        out[:, c] = x / np.sqrt(np.sum(x ** 2))
    return out
def conv_circ(x, ir, N):
    irp = np.zeros((N, 2)); irp[:len(ir)] = ir
    return np.fft.irfft(np.fft.rfft(x, axis=0) * np.fft.rfft(irp, axis=0), N, axis=0)

def compress(x, thr_db=-12.0, ratio=2.0, att=0.001, rel=0.12):
    """a gentle feed-forward compressor (no look-ahead, no delay: the voice stays sample-aligned)"""
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0; envl = [0.0] * len(x); ax = np.abs(x).tolist()
    for i in range(len(ax)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(np.asarray(envl) + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), gr

def tp_limit(x, ceil_db, look=0.003, rel=0.08):
    """a true-peak limiter (4x oversampled detector, linked channels), zero latency (symmetric look-ahead), circular
    so the loop has no seam; returns the limited signal and the gain curve"""
    c = db(ceil_db); pad = 2048
    x4 = resample_poly(np.concatenate([x[-pad:], x, x[:pad]]), 4, 1, axis=0)[4 * pad:4 * (pad + len(x))]
    a4 = np.abs(x4) if x4.ndim == 1 else np.abs(x4).max(1)
    need = np.minimum(1.0, c / (a4.reshape(-1, 4).max(1) + 1e-12))
    L = int(look * SR)
    g = uniform_filter1d(minimum_filter1d(need, 2 * L + 1, mode='wrap'), L + 1, mode='wrap')
    g = np.minimum(g, minimum_filter1d(need, 3, mode='wrap'))
    if g.min() >= 1.0: return x.copy(), np.ones(len(x))
    a = np.exp(-1 / (rel * SR)); gl = g.tolist(); out = [1.0] * len(gl); y = 1.0
    for _ in range(2):  # twice round the loop so the release state carries across the seam
        for i in range(len(gl)):
            y = gl[i] if gl[i] < y else a * y + (1 - a) * gl[i]; out[i] = y
    gg = np.minimum(np.asarray(out), g)
    return x * (gg if x.ndim == 1 else gg[:, None]), gg

def seed_of(*parts): return zlib.crc32('|'.join(str(p) for p in parts).encode())


# ---------------------------------------------------------------- spectrogram (QA)
def spectro_png(path, panels, DUR, words, marks, seam=True):
    """panels: [(label, mono signal)]; words: [(t, text)]; marks: [(t, label)] -> one PNG: two half-film rows at 100 px/s
    and (seam=True) a zoom across the loop point at 400 px/s"""
    from PIL import Image, ImageDraw, ImageFont
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
    except OSError: font = ImageFont.load_default()
    anchors = np.array([[0, 0, 4], [28, 16, 68], [80, 18, 123], [150, 40, 120], [214, 70, 90], [246, 130, 60],
                        [252, 200, 110], [252, 253, 191]], float)
    lut = np.stack([np.interp(np.linspace(0, 1, 256), np.linspace(0, 1, len(anchors)), anchors[:, c]) for c in range(3)], 1).astype(np.uint8)
    ROWS = 170; fr = np.geomspace(40, 16000, ROWS)[::-1]
    def spec(x, hop):
        f, _, S = spectrogram(x, fs=SR, window='hann', nperseg=2048, noverlap=2048 - hop, mode='magnitude')
        i = np.clip(np.searchsorted(f, fr) - 1, 0, len(f) - 2); w = ((fr - f[i]) / (f[i + 1] - f[i]))[:, None]
        return 20 * np.log10(S[i] * (1 - w) + S[i + 1] * w + 1e-10)
    ref = np.percentile(spec(panels[0][1], 480), 99.7)
    N = len(panels[0][1])
    def strip(x0, x1, pps):
        LM, WL, EL = 52, 40, 54
        W = int((x1 - x0) * pps)
        H = WL + len(panels) * (ROWS + 4) + EL
        im = Image.new('RGB', (LM + W + 10, H), (14, 16, 22)); d = ImageDraw.Draw(im)
        hop = max(1, int(SR / pps))
        def cut_(x):
            if x0 >= 0: return x[int(x0 * SR):int(x1 * SR)]
            return np.concatenate([x[int((DUR + x0) * SR):], x[:int(x1 * SR)]])
        for k, (lab, src) in enumerate(panels):
            Sx = spec(np.concatenate([np.zeros(1024), cut_(src), np.zeros(1024)]), hop)
            z = np.clip((Sx - (ref - 80)) / 80, 0, 1)
            pi = Image.fromarray(lut[(z * 255).astype(int)]).resize((W, ROWS))
            y0 = WL + k * (ROWS + 4); im.paste(pi, (LM, y0))
            d.text((2, y0 + 2), lab, fill=(230, 230, 230), font=font)
            for fq in (100, 1000, 10000):
                yy = y0 + int(np.interp(np.log(fq), np.log(fr[::-1]), np.arange(ROWS)[::-1]))
                d.line([(LM - 4, yy), (LM, yy)], fill=(200, 200, 200))
                d.text((22, yy - 6), f'{fq // 1000}k' if fq >= 1000 else str(fq), fill=(170, 170, 170), font=font)
        X_ = lambda tt_: LM + int((tt_ - x0) * pps)
        def tmap(tt_): return tt_ - DUR if (x0 < 0 and tt_ > DUR + x0) else tt_
        yb = WL + len(panels) * (ROWS + 4)
        for s in np.arange(np.ceil(x0), x1 + 1e-6, 1.0 if pps < 200 else 0.25):
            d.line([(X_(s), yb - 4), (X_(s), yb + 2)], fill=(150, 150, 150))
            d.text((X_(s) + 2, yb), f'{s % DUR:.2f}'.rstrip('0').rstrip('.'), fill=(140, 140, 140), font=font)
        lanes = [-1e9] * 2
        for ws, txt in words:
            ws = tmap(ws)
            if not (x0 <= ws <= x1): continue
            d.line([(X_(ws), WL - 4), (X_(ws), WL + ROWS)], fill=(110, 200, 255))
            ln = next((j for j in range(2) if lanes[j] < X_(ws)), 1)
            d.text((X_(ws) + 2, 2 + 16 * ln), txt, fill=(160, 220, 255), font=font)
            lanes[ln] = X_(ws) + d.textlength(txt, font=font) + 4
        el = [-1e9] * 3
        for es, lab in marks:
            es = tmap(es)
            if not (x0 <= es <= x1): continue
            d.line([(X_(es), WL + ROWS + 4), (X_(es), yb)], fill=(255, 150, 60))
            ln = next((j for j in range(3) if el[j] < X_(es)), 2)
            d.text((X_(es) + 2, yb + 13 + 13 * ln), lab, fill=(255, 190, 120), font=font)
            el[ln] = X_(es) + d.textlength(lab, font=font) + 4
        if x0 < 0:
            d.line([(X_(0), WL), (X_(0), yb)], fill=(255, 255, 255), width=2)
            d.text((X_(0) + 3, WL + 2), 'LOOP SEAM', fill=(255, 255, 255), font=font)
        return im
    half = DUR / 2
    parts = [strip(0, half, 100), strip(half, DUR, 100)] if DUR > 12 else [strip(0, DUR, max(60, int(3000 / DUR)))]
    if seam: parts.append(strip(-1.0, 1.0, 400))
    W_ = max(p.width for p in parts); H_ = sum(p.height for p in parts) + 8 * len(parts)
    out = Image.new('RGB', (W_, H_), (14, 16, 22)); y = 0
    for p in parts:
        out.paste(p, (0, y)); y += p.height + 8
    out.save(path)
    print('spectrogram ->', path)


# ---------------------------------------------------------------- one effect sound, at its level re the voice
def make_sound(kind, t, dur=None, variant=None, pan=None):
    """one cue's sound, stereo, peak 1 (deterministic: seeded by kind, time and variant)"""
    rng = np.random.default_rng(seed_of(kind, round(float(t), 3), variant))
    x = X.render(kind, rng, dur, variant)
    p = X.KINDS[kind]['pan'] if pan is None else float(pan)
    if x.ndim == 1: return X.to_stereo(x, p)
    gl, gr = X.pan_gains(p) if pan is not None else (1.0, 1.0)  # a stereo sound: the cue's pan shifts its balance
    return x * np.array([gl, gr])

IR = ir_room(0.75, 1.1, np.random.default_rng(seed_of('room')), 2600)
def with_room(x, kind):
    """the dry sound plus its room-reverb send (the level is set on the total, so the reverb never adds level)"""
    vb = X.KINDS[kind]['verb']
    if vb is None: return x
    from scipy.signal import fftconvolve
    wet = fftconvolve(x * db(vb), IR, axes=0)
    out = np.zeros((len(x) + len(IR) - 1, 2)); out[:len(x)] += x; out += wet
    k = np.where(np.abs(out).max(1) > np.abs(out).max() * 1e-4)[0][-1] + 1  # trim the silent tail
    return out[:k] * X.fades(k, 0.0, 0.01)[:, None]

def level_gain(x, level_db):
    """gain that puts x's loudest 400 ms at VREF + level (both measured as stereo; the voice is dual mono)"""
    return db(VREF + ST + level_db - lmax(x))


# ================================================================ GALLERY: every kind alone
if GALLERY:
    DUR_G = 0.0; items = []
    order = [k for k in X.KINDS if k != 'alarm_tail']
    for kind in order:
        variants = [0, 1, 2, 3] if kind == 'mech_click' else [None]
        for var in variants:
            if kind == 'alarm':
                beat = 32.4 / 64; n = int(2.6 * SR)
                bed = X.alarm_bed(int(round(32.4 * SR)), beat, np.random.default_rng(7))[:n]
                full = X.to_stereo(X.alarm_bed(int(round(32.4 * SR)), beat, np.random.default_rng(7)), X.KINDS['alarm']['pan'])
                full = full + conv_circ(full * db(X.KINDS['alarm']['verb']), IR, len(full))
                g = db(VREF + ST + X.KINDS['alarm']['level'] - lmax(full))
                x = with_room(X.to_stereo(bed * X.fades(n, 0.12, 0.6), X.KINDS['alarm']['pan']), 'alarm')
            else:
                x = with_room(make_sound(kind, 1.0, None, var), kind)
                g = level_gain(x, X.KINDS[kind]['level'])
            items.append((kind if var is None else f'{kind}#{var}', kind, x * g))
    gap = 0.45
    total = sum(len(x) / SR + gap + 0.5 for _, _, x in items) + 0.5
    N = int(total * SR); buf = np.zeros((N, 2)); pos = 0.5; res = []
    for label, kind, x in items:
        i0 = int(pos * SR)
        buf[i0:i0 + len(x)] += x
        res.append(dict(label=label, kind=kind, start_s=round(pos, 3), rendered_s=round(len(x) / SR, 3)))
        pos += len(x) / SR + gap + 0.5
    for r in res:
        i0 = int(r['start_s'] * SR); i1 = i0 + int((r['rendered_s'] + 0.45) * SR)
        y = buf[i0:i1]; ym = mono(y)
        envl = uniform_filter1d(np.abs(ym), int(0.005 * SR))
        above = np.where(envl > envl.max() * db(-40))[0]
        audible = (above[-1] - above[0]) / SR if len(above) else 0.0
        seg = y[above[0]:above[-1] + 1] if len(above) else y
        r.update(peak_dbfs=round(float(20 * np.log10(np.abs(y).max() + 1e-12)), 2), true_peak_dbtp=tp_db(y),
                 rms_dbfs_audible=rms_db(seg), duration_to_minus40db_s=round(audible, 3),
                 momentary_max_lufs=lmax(y), level_re_voice_db=round(lmax(y) - (VREF + ST), 2),
                 set_level_re_voice_db=X.KINDS[r['kind']]['level'], crest_db=round(float(20 * np.log10(np.abs(seg).max() / (np.sqrt(np.mean(seg ** 2)) + 1e-12))), 1),
                 clips=bool(np.abs(y).max() >= 1.0), desc=X.KINDS[r['kind']]['desc'])
    os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
    sf.write(os.path.join(EP, 'audio/mix/sfx_gallery.wav'), buf, SR, subtype='PCM_24')
    meta = {'note': 'each kind alone at its set level re a -16 LUFS (mono) voice, i.e. as it enters the mix before ducking '
                    'and before the master gain; room reverb sends included', 'voice_ref_lufs_stereo': VREF + ST,
            'gallery_peak_dbfs': round(float(20 * np.log10(np.abs(buf).max())), 2), 'items': res}
    json.dump(meta, open(os.path.join(EP, 'audio/mix/sfx_gallery.json'), 'w'), indent=1)
    for r in res:
        print(f"{r['start_s']:7.2f}  {r['label']:13s} dur {r['duration_to_minus40db_s']:5.2f} s  peak {r['peak_dbfs']:6.1f} dBFS  "
              f"rms {r['rms_dbfs_audible']:6.1f}  crest {r['crest_db']:4.1f}  mom.max {r['momentary_max_lufs']:6.1f} LUFS ({r['level_re_voice_db']:+.1f} re voice)")
    print('gallery ->', os.path.join(EP, 'audio/mix/sfx_gallery.wav'), f"({total:.1f} s, peak {meta['gallery_peak_dbfs']} dBFS)")
    if isinstance(GALLERY, str):
        spectro_png(GALLERY, [('gallery', mono(buf))], total, [], [(r['start_s'], r['label']) for r in res], seam=False)
    sys.exit(0)


# ================================================================ MIX
NAME = argv[0]
CUES = argv[1] if len(argv) > 1 else 'audio/cues.json'
if not os.path.exists(os.path.join(EP, CUES)):
    sys.exit(f'no cues file {CUES} (the director exports audio/cues.json; to test: python3 tools/make_audio.py {NAME} audio/cues_test.json)')
cj = json.load(open(os.path.join(EP, CUES)))
DUR = float(cj.get('duration', cj.get('DUR', 32.4)))
N = int(round(DUR * SR)); t = np.arange(N) / SR
CUE_LIST = sorted(cj['cues'], key=lambda c: float(c['t']))
WORDS = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))['words']
WARN = []
for c in CUE_LIST:
    if c['kind'] not in X.KINDS: WARN.append(f"unknown kind {c['kind']!r} at {c['t']} s: skipped")

# ---------------------------------------------------------------- voice: sample for sample, gentle compression + limiter
v, vsr = sf.read(os.path.join(EP, NARRATION))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, ('the narration must be 48 kHz and exactly the film length', vsr, len(v), N)
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, comp_curve = compress(v0)
vc = vc * db(VREF - meter.integrated_loudness(vc))
vl, vlim = tp_limit(vc, VOICE_CEIL)
voice = vl * db(VREF - meter.integrated_loudness(vl))
voice_peak_before_lim = tp_db(vc)

# speech: inside the words (trimmed 30 ms) and the gaps between them (>= 0.25 s, trimmed 50 ms)
inw = np.zeros(N, bool)
for w in WORDS:
    inw[int((w['start'] + 0.03) * SR):int(max(w['start'] + 0.04, w['end'] - 0.03) * SR)] = True
gaps = np.zeros(N, bool); gap_spans = []
ends = [0.0] + [w['end'] for w in WORDS]; starts = [w['start'] for w in WORDS] + [DUR]
for a, b in zip(ends, starts):
    if b - a >= 0.25:
        gaps[int((a + 0.05) * SR):int((b - 0.05) * SR)] = True; gap_spans.append((round(a, 2), round(b, 2)))

# ---------------------------------------------------------------- ducking keys (zero-phase, circular: the duck leads each word a little)
env_b = smooth(np.abs(voice), 8.0)
env_h = smooth(np.abs(hp(voice, 3200, 4)), 16.0)
k_b = np.clip(env_b / np.percentile(env_b, 90) * 1.4, 0, 1)
k_h = np.clip(env_h / np.percentile(env_h, 97) * 1.3, 0, 1)
# the music's sidechain: held across syllables (no pumping inside a phrase), released in the pauses
k_m = smooth(maximum_filter1d(k_b, int(0.16 * SR), mode='wrap'), 6.0)
k_m = np.clip(k_m, 0, 1)

# ---------------------------------------------------------------- effects
BUS = {k: np.zeros((N, 2)) for k in ('bed', 'dot', 'accent')}
LOG, SNIPS = [], []
def place(x, at, bus):
    i0 = int(round(at * SR)) % N
    idx = (np.arange(len(x)) + i0) % N
    BUS[bus][idx] += x
    return i0, idx

# the alarm: one loop-periodic klaxon (beat-locked to the music), gated by the alarm / alarm_tail cues
beat = DUR / M.BEATS
alarm_src = X.alarm_bed(N, beat, np.random.default_rng(seed_of('alarm_bed')))
gate = np.zeros(N)
for c in CUE_LIST:
    if c['kind'] not in ('alarm', 'alarm_tail'): continue
    a = float(c['t']); d = float(c.get('dur', X.KINDS[c['kind']]['dur'])); g = float(db(c.get('gain', 0.0)))
    u = ((t - a) % DUR)  # time since the cue, wrapping round the loop
    if c['kind'] == 'alarm':
        fi = 0.0 if a <= 0.02 else 0.12
        fo = 0.0 if a + d >= DUR - 0.02 else 0.25
        w = (u <= d + fo) * (X.ss(u, 0, fi) if fi else 1.0) * (1 - (X.ss(u, d, d + fo) if fo else (u > d)))
    else:
        w = (u <= d) * (0.5 + 0.5 * np.cos(np.pi * np.clip(u / d, 0, 1)))
    gate = np.maximum(gate, w * g)
    LOG.append({'t': round(a, 3), 'end': round((a + d) % DUR, 3), 'kind': c['kind'], 'dur': d, 'gain_db': c.get('gain', 0.0),
                'set_level_re_voice_db': X.KINDS['alarm']['level'] + c.get('gain', 0.0), 'bus': 'bed', 'pan': X.KINDS['alarm']['pan']})
if gate.max() > 0:
    gate = circ(lambda y: lp(y, 40), gate)  # no zipper at the gate edges
    al = X.to_stereo(alarm_src, X.KINDS['alarm']['pan'])
    ag = level_gain(al + conv_circ(al * db(X.KINDS['alarm']['verb']), IR, N), X.KINDS['alarm']['level'])
    al = al * ag * gate[:, None]
    al = al + conv_circ(al * db(X.KINDS['alarm']['verb']), IR, N)  # the room tail rings on after the gate closes
    BUS['bed'] += al
    SNIPS.append(('alarm', 'bed', None, al))

for c in CUE_LIST:
    kind = c['kind']
    if kind not in X.KINDS or kind in ('alarm', 'alarm_tail'): continue
    K = X.KINDS[kind]
    x = with_room(make_sound(kind, c['t'], c.get('dur'), c.get('variant'), c.get('pan')), kind)
    gdb = float(c.get('gain', 0.0))
    y = x * level_gain(x, K['level'] + gdb)
    at = float(c['t']) - K['pre']
    i0, idx = place(y, at, K['bus'])
    LOG.append({'t': round(float(c['t']), 3), 'end': round((at + len(y) / SR) % DUR, 3), 'kind': kind,
                'dur': round(len(y) / SR, 3), 'gain_db': gdb, 'set_level_re_voice_db': round(K['level'] + gdb, 1),
                'bus': K['bus'], 'pan': c.get('pan', K['pan']), **({'variant': c['variant']} if 'variant' in c else {})})
    SNIPS.append((len(LOG) - 1, K['bus'], idx, y))


# three-band duck keyed by the voice: below 300 Hz by the broadband envelope (d_lo), the voice body 300-2400 Hz deeper
# (d_mid), above 2400 Hz by the voice's sibilance (d_hi), so the effects never mask the words' formants or consonants
DUCK = {'bed': (0.4, 0.75, 0.8), 'dot': (0.25, 0.6, 0.75), 'accent': (0.15, 0.5, 0.6)}
def ducked(x, bus, idx=None):
    d_lo, d_mid, d_hi = DUCK[bus]
    kb = k_b if idx is None else k_b[idx]; kh = k_h if idx is None else k_h[idx]
    f = (lambda fn: circ(fn, x)) if idx is None else (lambda fn: fn(x))
    lo = f(lambda y: lp(y, 300, 4)); hi = f(lambda y: hp(y, 2400, 4)); mid = x - lo - hi
    return lo * (1 - d_lo * kb)[:, None] + mid * (1 - d_mid * kb)[:, None] + hi * (1 - d_hi * kh)[:, None]
DC = lambda x: circ(lambda y: hp(y, 25, 2), x)
sfx = DC(sum(ducked(BUS[b], b) for b in BUS))

# ---------------------------------------------------------------- music: rendered, ducked (sidechain, deeper in the voice band), levelled
MUS = M.render(DUR)
music_raw = sum(MUS['stems'].values())
m_lo = circ(lambda y: lp(y, 600, 4), music_raw)
m_hi = circ(lambda y: hp(y, 5000, 4), music_raw)
m_mid = music_raw - m_lo - m_hi
DUCK_M = {'lo': -4.0, 'mid': -10.0, 'hi': -6.0}
music_d = (m_lo * db(DUCK_M['lo'] * k_m)[:, None] + m_mid * db(DUCK_M['mid'] * k_m)[:, None] + m_hi * db(DUCK_M['hi'] * k_m)[:, None])
voice_st = np.stack([voice, voice], 1)
lv_v = lk(voice_st); lv_m = lk(music_d)
g_m = db(np.median((lv_v - lv_m)[inw]) - MUSIC_UNDER)
music = music_d * g_m
music_undrift = music_raw * g_m  # (for the stems' reference only)

# ---------------------------------------------------------------- master: -14 LUFS (stereo), true peak <= -1.6 dBTP
pre = voice_st + sfx + music
g = db(-14.0 - lufs(pre))
for _ in range(4):
    mix, glim = tp_limit(pre * g, CEIL)
    err = -14.0 - lufs(mix)
    if abs(err) < 0.02: break
    g *= db(err)
mix, glim = tp_limit(pre * g, CEIL)
G = g * glim[:, None]
voice_out, sfx_out, music_out = voice_st * G, sfx * G, music * G

# ---------------------------------------------------------------- write
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Robot_Escapes_Jail_{NAME.upper()}.wav'), mix, SR, subtype='PCM_24')
if STEMS:
    os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
    for nm, x in [('voice', voice_out), ('sfx', sfx_out), ('music', music_out)]:
        sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')

# ---------------------------------------------------------------- measure
def stat(a): return {'median': round(float(np.median(a)), 1), 'min': round(float(np.min(a)), 1), 'p5': round(float(np.percentile(a, 5)), 1),
                     'p95': round(float(np.percentile(a, 95)), 1), 'max': round(float(np.max(a)), 1)}
L_v, L_m, L_s = lk(voice_out), lk(music_out), lk(sfx_out)
L_bed = lk(music_out + sfx_out)
voice_l_st = lufs(voice_out)
# voice band (300-3400 Hz) vs the bed (music + effects) in the same band, 50 ms frames inside the words
def band_db(x):
    y = bp(mono(x), 300, 3400, 4)
    return 10 * np.log10(uniform_filter1d(y * y, int(0.05 * SR)) + 1e-20)
vb_ = band_db(voice_out); bb_ = band_db(music_out + sfx_out); mb_ = band_db(music_out)
voiced = inw & (vb_ > np.median(vb_[inw]) - 12)
sections = {}
for s_ in MUS['sections']:
    a, b = s_['t']; m_ = inw & (t >= a) & (t < b); gm = gaps & (t >= a) & (t < b)
    sections[s_['name']] = {'t': [a, b], 'music_under_voice_in_words_db_median': round(float(np.median((L_v - L_m)[m_])), 1) if m_.any() else None,
                            'music_level_in_gaps_re_voice_integrated_db_median': round(float(np.median(L_m[gm]) - voice_l_st), 1) if gm.any() else None}
# per event: its own sound in the mix (ducked, final gain)
for li, bus, idx, y in SNIPS:
    if li == 'alarm':
        ys = ducked(y, 'bed') * G
        mm = lk(ys); on = gate > 0.5
        for e in LOG:
            if e['kind'] in ('alarm', 'alarm_tail'):
                e['in_mix_momentary_max_lufs'] = round(float(mm[on].max()), 1) if on.any() else None
                e['under_voice_db'] = round(voice_l_st - e['in_mix_momentary_max_lufs'], 1) if on.any() else None
                e['alarm_under_voice_in_words_db_median'] = round(float(np.median((L_v - mm)[on & inw])), 1) if (on & inw).any() else None
        continue
    ys = ducked(y, bus, idx) * G[idx]
    e = LOG[li]
    e['in_mix_momentary_max_lufs'] = lmax(ys)
    e['under_voice_db'] = round(voice_l_st - e['in_mix_momentary_max_lufs'], 1)
    w = min(WORDS, key=lambda w_: abs(w_['start'] - e['t']))
    e['nearest_word'] = {'word': w['word'], 't': w['start'], 'dt': round(e['t'] - w['start'], 3)}
    e['in_word'] = any(w_['start'] <= e['t'] <= w_['end'] for w_ in WORDS)

# narration placement: sample for sample
def xlag(a, b):
    c = np.fft.irfft(np.fft.rfft(a) * np.conj(np.fft.rfft(b)), len(a)); k = int(np.argmax(c)); return k if k <= len(a) // 2 else k - len(a)
lag = xlag(mono(voice_out), v)
# loop seam
seg = int(0.3 * SR)
def seam_of(x):
    xm = x if x.ndim == 1 else x
    j = np.abs(xm[0] - xm[-1]); j = float(np.max(j))
    joined = np.concatenate([xm[-seg:], xm[:seg]])
    steps = np.abs(np.diff(joined, axis=0)); steps = steps if steps.ndim == 1 else steps.max(1)
    hpj = hp(mono(joined), 2000, 4); a_ = np.abs(hpj)
    near = a_[seg - int(0.003 * SR):seg + int(0.003 * SR)].max(); far = np.percentile(np.delete(a_, np.s_[seg - 480:seg + 480]), 99)
    return {'jump': round(j, 6), 'median_step_near_seam': round(float(np.median(steps)), 6), 'p99_step_near_seam': round(float(np.percentile(steps, 99)), 6),
            'jump_percentile_among_steps': round(float(np.mean(steps < j) * 100), 1),
            'hf_over_2k_at_seam_vs_p99_nearby_db': round(float(20 * np.log10((near + 1e-12) / (far + 1e-12))), 1),
            'rms_db_last_0p3s_first_0p3s': [rms_db(xm[-seg:]), rms_db(xm[:seg])]}
loop = {'mix': seam_of(mix), 'music': seam_of(music_out), 'sfx': seam_of(sfx_out), 'voice': seam_of(voice_out),
        'music_bar_aligned': f"{M.BEATS} beats = {M.BEATS // 4} bars in {DUR} s ({MUS['bpm']} BPM): periodic, tails and reverb wrap circularly"}
mid = mono(mix); side = (mix[:, 0] - mix[:, 1]) / 2
res = {'name': NAME, 'cues_file': CUES, 'cues': len(CUE_LIST), 'warnings': WARN, 'duration_s': DUR, 'sr': SR, 'samples': N, 'format': '48 kHz 24-bit stereo WAV',
       'integrated_lufs': lufs(mix), 'true_peak_dbtp_4x': tp_db(mix), 'sample_peak_dbfs': round(float(20 * np.log10(np.abs(mix).max())), 2),
       'master_gain_db': round(float(20 * np.log10(g)), 2), 'limiter_max_gain_reduction_db': round(float(20 * np.log10(glim.min())), 2),
       'limiter_samples_reducing_over_0p5db': int(np.sum(glim < db(-0.5))),
       'short_term_max_lufs': lmax(mix, 3.0), 'loudness_range_note': 'see voice/music/sfx below',
       'voice': {'lufs_mono': lufs(mono(voice_out)), 'lufs_as_stereo': voice_l_st, 'pre_master_lufs_mono': VREF,
                 'compressor_gr_db': {'max': round(float(comp_curve.min()), 2), 'median_in_words': round(float(np.median(comp_curve[inw])), 2)},
                 'limiter': {'ceiling_dbtp_at_vref': VOICE_CEIL, 'true_peak_before_dbtp': voice_peak_before_lim, 'max_gr_db': round(float(20 * np.log10(vlim.min())), 2),
                             'samples_over_1db_gr': int(np.sum(vlim < db(-1)))},
                 'lag_vs_master_samples': lag, 'corr_vs_master': round(float(np.corrcoef(mono(voice_out), v)[0, 1]), 5)},
       'music': {'lufs': lufs(music_out), 'bpm': MUS['bpm'], 'beats': MUS['beats'], 'bars': MUS['bars'], 'sections': sections,
                 'under_voice_in_words_400ms_db': stat((L_v - L_m)[inw]),
                 'level_in_gaps_re_voice_integrated_db': stat(L_m[gaps] - voice_l_st),
                 'level_in_words_re_voice_integrated_db': stat(L_m[inw] - voice_l_st),
                 'duck_db': DUCK_M},
       'sfx': {'lufs': lufs(sfx_out), 'events': len([e for e in LOG]), 'under_voice_integrated_db': None if lufs(sfx_out) is None else round(voice_l_st - lufs(sfx_out), 1),
               'event_under_voice_db': stat([e['under_voice_db'] for e in LOG if e.get('under_voice_db') is not None]),
               'loudest_events': sorted([(e['kind'], e['t'], e['under_voice_db']) for e in LOG if e.get('under_voice_db') is not None], key=lambda z: z[2])[:5]},
       'voice_vs_bed': {'bed_is': 'music + effects',
                        'bed_minus_voice_400ms_in_words_db': stat((L_bed - L_v)[inw]),
                        'voice_band_300_3400Hz_voice_minus_bed_50ms_in_words_db': stat((vb_ - bb_)[inw]),
                        'voice_band_300_3400Hz_voice_minus_music_50ms_in_words_db': stat((vb_ - mb_)[inw]),
                        'voice_band_voice_minus_bed_50ms_voiced_frames_db': stat((vb_ - bb_)[voiced]),
                        'voiced_frames_note': 'voiced = in a word and the voice band within 12 dB of its in-word median (excludes stop closures and word edges)',
                        'voiced_frames_with_bed_within_6db': round(float(np.mean((vb_ - bb_)[voiced] < 6) * 100), 2),
                        'worst_moment_s': round(float(np.where(inw)[0][np.argmax((L_bed - L_v)[inw])] / SR), 2)},
       'stereo': {'side_minus_mid_db': round(rms_db(side) - rms_db(mid), 1), 'lr_correlation': round(float(np.corrcoef(mix[:, 0], mix[:, 1])[0, 1]), 3)},
       'loop': loop, 'gaps': gap_spans}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
LOG.sort(key=lambda e: e['t'])
json.dump({'name': NAME, 'cues_file': CUES, 'voice_lufs_as_stereo': voice_l_st, 'events': LOG}, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
for e in LOG:
    print(f"{e['t']:7.3f}  {e['kind']:11s} set {e['set_level_re_voice_db']:6.1f}  in mix {e.get('in_mix_momentary_max_lufs')} LUFS  "
          f"({e.get('under_voice_db')} under voice){'  [in word ' + e['nearest_word']['word'] + ']' if e.get('in_word') else ''}")
print(json.dumps({k: res[k] for k in ('integrated_lufs', 'true_peak_dbtp_4x', 'sample_peak_dbfs', 'limiter_max_gain_reduction_db', 'warnings')}, indent=1))
print(json.dumps({k: res[k] for k in ('voice', 'voice_vs_bed', 'stereo')}, indent=1))
print(json.dumps({'music': {k: res['music'][k] for k in ('lufs', 'bpm', 'under_voice_in_words_400ms_db', 'level_in_gaps_re_voice_integrated_db', 'sections')},
                  'sfx': res['sfx'], 'loop': {k: loop[k] for k in ('mix', 'music', 'sfx')}}, indent=1))
print('wrote', os.path.join(EP, f'source/public/audio/{NAME}.wav'), 'and', os.path.join(EP, f'audio/mix/FGW_Robot_Escapes_Jail_{NAME.upper()}.wav'))

if SPECTRO:
    spectro_png(SPECTRO if isinstance(SPECTRO, str) else os.path.join(EP, f'audio/mix/spectrogram_{NAME}.png'),
                [('mix', mono(mix)), ('music', mono(music_out)), ('sfx', mono(sfx_out))], DUR,
                [(w['start'], w['word']) for w in WORDS], [(e['t'], e['kind']) for e in LOG])

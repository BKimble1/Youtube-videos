#!/usr/bin/env python3
"""Objective audio checks for V3 Final (numpy + ffmpeg). Nothing here is listening: these are measurements and proxies.

Usage: audio_checks_v3.py <out.json> [encoded.mp4 ...]
  - stems vs mix, loop seam, effect placement/headroom, ducking depth and smoothness, music-vs-voice ratio per section (V2 vs V3),
    pocket depth, mono compatibility, small-speaker band proxy, speech-band intelligibility proxy, voice-file identity (git blob at the V2 commit),
    plus loudness / true peak / A-V alignment on every encoded file given.
"""
import json, os, re, subprocess, sys, wave, hashlib
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
out_path = sys.argv[1]
encoded = sys.argv[2:]
cues = json.load(open(f'{ROOT}/audio/cues_v3.json'))
EV = cues['events_sec']
WORDS = cues['words']


def rd(path, stereo=True):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels()
        a = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float64) / 32768.0
        assert w.getframerate() == SR
    return a.reshape(-1, ch) if stereo else a.reshape(-1, ch).mean(1)


def dbf(x):
    return 20 * np.log10(max(float(x), 1e-12))


def rms(x):
    return float(np.sqrt((np.asarray(x) ** 2).mean() + 1e-24))


def ff_loud(path, af):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', af + ('' if af.endswith(',') or not af else ',') + 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    seg = r[r.rfind('Summary:'):]
    g = lambda k: float(re.search(rf'{k}:\s+(-?[\d.]+)', seg).group(1))
    return {'I_lufs': g('I'), 'LRA_lu': g('LRA'), 'true_peak_dbtp': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', seg).group(1))}


d = f'{ROOT}/audio/stems_v3_final'
V, M, S, MIX = (rd(f'{d}/{n}.wav') for n in ('narration', 'music', 'effects', 'mix'))
N = len(MIX)
res = {'samples': N, 'duration_s': N / SR}
res['stems_sum_to_mix_max_abs_diff'] = float(np.abs(V + M + S - MIX).max())
res['mix_sample_peak_dbfs'] = dbf(np.abs(MIX).max())
res['mix_clipped_samples'] = int((np.abs(MIX) >= 0.9999).sum())
res['mix_wav_loudness'] = ff_loud(f'{d}/mix.wav', '')

# loop seam / first frame
res['loop_seam'] = {
    'first_80ms_peak_dbfs': dbf(np.abs(MIX[: int(0.08 * SR)]).max()),
    'first_sample': float(np.abs(MIX[0]).max()), 'last_sample': float(np.abs(MIX[-1]).max()),
    'last_300ms_rms_dbfs': dbf(rms(MIX[-int(0.3 * SR):])), 'last_100ms_peak_dbfs': dbf(np.abs(MIX[-int(0.1 * SR):]).max()),
    'first_word_start_s': WORDS[0]['start'], 'voice_end_s': EV['voice.end'],
    'effects_before_first_word': float(np.abs(S[: int(WORDS[0]['start'] * SR)]).max()),
    'music_before_first_word_dbfs': dbf(rms(M[: int(WORDS[0]['start'] * SR)])),
}

# voice identity: the narration file used is byte-identical to the approved take
vp = f'{ROOT}/audio/narration_v2/narration_v2_final_48k.wav'
res['voice_file'] = {'sha256_working_tree': hashlib.sha256(open(vp, 'rb').read()).hexdigest()}
try:
    blob = subprocess.run(['git', '-C', ROOT, 'show', f'70a6451:Future_Got_Weird/Shorts/ai-fake-murder-tip/audio/narration_v2/narration_v2_final_48k.wav'], capture_output=True, check=True).stdout
    res['voice_file']['sha256_at_v2_commit_70a6451'] = hashlib.sha256(blob).hexdigest()
    res['voice_file']['identical_to_v2'] = res['voice_file']['sha256_working_tree'] == res['voice_file']['sha256_at_v2_commit_70a6451']
except Exception as e:  # pragma: no cover
    res['voice_file']['identical_to_v2'] = f'not checked ({e})'

# effects: placement, level against the local voice/music, overlap with words
lg = list(__import__('csv').DictReader(open(f'{ROOT}/audio/sfx_log_v3.csv')))
rows = []
for r in lg:
    t0 = float(r['time_s'])
    i0, i1 = int(t0 * SR), int((t0 + 0.12) * SR)
    pk = dbf(np.abs(S[i0:i1]).max())
    w0, w1 = max(0, i0 - int(0.25 * SR)), i0 + int(0.25 * SR)
    spk = [w['text'] for w in WORDS if w['start'] < t0 + 0.12 and w['end'] > t0]
    vr = rms(V[w0:w1]); mr = rms(M[w0:w1])
    rows.append({'event': r['event'], 'time_s': t0, 'frame': int(r['frame']), 'effect_peak_dbfs': round(pk, 1), 'voice_rms_dbfs_pm250ms': round(dbf(vr), 1), 'music_rms_dbfs_pm250ms': round(dbf(mr), 1),
                 'effect_peak_minus_voice_rms_db': round(pk - dbf(vr), 1) if vr > 1e-5 else None, 'words_overlapping_first_120ms': spk})
res['effects'] = rows
res['effect_count'] = len(rows)

# speech-active windows (post-gain voice stem; relative threshold)
win = int(0.010 * SR)
nw = N // win
vrms = np.array([dbf(rms(V[i * win:(i + 1) * win].mean(1))) for i in range(nw)])
speech = vrms > np.max(vrms) - 38
res['speech_active_fraction'] = float(speech.mean())

# music vs voice per section: V2 (stems_v2) vs V3
V2v, V2m = rd(f'{ROOT}/audio/stems_v2/voice.wav'), rd(f'{ROOT}/audio/stems_v2/music.wav')
secs = {
    'opening 0-2.3 s': (0.1, 2.28), 'quote 2.3-4.8 s': (2.28, 4.8), 'pocket: Except...reveal 4.8-7.4 s': (4.8, 7.39),
    'test beat 7.4-11.2 s': (7.4, 11.18), 'spam outcome 12.2-14.8 s': (12.18, 14.78), 'takeaway 14.8-19.5 s': (14.78, 19.52),
}
tab = {}
for k, (a, b) in secs.items():
    i, j = int(a * SR), int(b * SR)
    def sec_ratio(v, m):
        vv, mm = v[i:j].mean(1), m[i:j].mean(1)
        a_ = np.array([rms(vv[x * win:(x + 1) * win]) for x in range((j - i) // win)])
        act = dbf(1) + 20 * np.log10(a_ + 1e-12) > -46 - 0  # post-master levels differ slightly; use a relative threshold below
        act = a_ > a_.max() * 0.02
        if act.sum() < 3:
            return None
        sel = np.repeat(act, win)
        return round(dbf(rms(m[i:j].mean(1)[: len(sel)][sel])) - dbf(rms(v[i:j].mean(1)[: len(sel)][sel])), 2)
    tab[k] = {'v2_music_minus_voice_db': sec_ratio(V2v, V2m), 'v3_music_minus_voice_db': sec_ratio(V, M),
              'v2_music_rms_dbfs': round(dbf(rms(V2m[i:j])), 1), 'v3_music_rms_dbfs': round(dbf(rms(M[i:j])), 1)}
res['music_vs_voice_by_section'] = tab
pa, pb = int(EV['pocket1.in'] * SR), int(EV['pocket1.out'] * SR)
res['pocket1'] = {'v2_music_rms_dbfs': round(dbf(rms(V2m[pa:pb])), 1), 'v3_music_rms_dbfs': round(dbf(rms(M[pa:pb])), 1),
                  'v3_music_rms_around_no_dbfs': round(dbf(rms(M[int(6.3 * SR):int(6.9 * SR)])), 1), 'v2_music_rms_around_no_dbfs': round(dbf(rms(V2m[int(6.3 * SR):int(6.9 * SR)])), 1)}
# the pocket begins just before "Except"
exc = [w for w in WORDS if w['text'].lower().startswith('except')][0]
res['pocket1']['except_start_s'] = exc['start']; res['pocket1']['pocket_in_s'] = EV['pocket1.in']; res['pocket1']['lead_before_except_s'] = round(exc['start'] - EV['pocket1.in'], 3)

# mono compatibility and small-speaker proxies on the mix wav
L, R = MIX[:, 0], MIX[:, 1]
res['stereo_correlation'] = float(np.corrcoef(L, R)[0, 1])
mono = (L + R) / 2
res['mono_vs_stereo_rms_diff_db'] = dbf(rms(mono)) - dbf(rms(MIX))
mp = f'{ROOT}/qa/dev/_mono_proxy.wav'; os.makedirs(os.path.dirname(mp), exist_ok=True)
res['mono_loudness'] = ff_loud(f'{d}/mix.wav', 'pan=mono|c0=0.5*c0+0.5*c1')
res['small_speaker_band_300_4000'] = ff_loud(f'{d}/mix.wav', 'highpass=f=300,lowpass=f=4000')
res['voice_stem_loudness'] = ff_loud(f'{d}/narration.wav', '')
# speech-band intelligibility proxy: (voice / everything else) in 1-4 kHz over speech windows
from numpy.fft import rfft, rfftfreq
def band(x, lo, hi):
    X = rfft(x); f = rfftfreq(len(x), 1 / SR); m = (f >= lo) & (f <= hi)
    return float(np.sqrt((np.abs(X[m]) ** 2).sum() / len(x) ** 2))
sel = np.repeat(speech, win); sel = np.concatenate([sel, np.zeros(N - len(sel), bool)])
vb = band(V.mean(1)[sel], 1000, 4000); ob = band((M + S).mean(1)[sel], 1000, 4000)
res['speech_band_1_4k_voice_minus_music_sfx_db'] = round(20 * np.log10(vb / max(ob, 1e-12)), 1)

# encoded files
enc = {}
for p in encoded:
    e = {'file': os.path.relpath(p, ROOT)}
    e.update(ff_loud(p, ''))
    tmp = f'{ROOT}/qa/dev/_enc_audio.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', p, '-vn', '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_s16le', tmp], check=True)
    A = rd(tmp)
    n = min(len(A), N)
    # alignment against the mix wav by cross-correlation of the mono envelopes (lag in samples; AAC priming is trimmed by the container)
    a1, b1 = A[:n].mean(1), MIX[:n].mean(1)
    sz = 1 << (int(np.ceil(np.log2(2 * n))))
    cc = np.fft.irfft(np.fft.rfft(a1, sz) * np.conj(np.fft.rfft(b1, sz)), sz)
    lag = int(np.argmax(np.concatenate([cc[-2000:], cc[:2000]]))) - 2000
    e['lag_samples_vs_mix_wav'] = lag
    e['corr_coeff'] = float(np.corrcoef(a1[max(0, lag):n], b1[: n - max(0, lag)])[0, 1]) if lag >= 0 else float(np.corrcoef(a1[: n + lag], b1[-lag:n])[0, 1])
    e['decoded_samples'] = len(A)
    e['first_80ms_peak_dbfs'] = dbf(np.abs(A[: int(0.08 * SR)]).max())
    e['last_100ms_peak_dbfs'] = dbf(np.abs(A[-int(0.1 * SR):]).max())
    enc[os.path.basename(p)] = e
res['encoded'] = enc
json.dump(res, open(out_path, 'w'), indent=1)
print(json.dumps({k: res[k] for k in ('stems_sum_to_mix_max_abs_diff', 'mix_sample_peak_dbfs', 'mix_wav_loudness', 'loop_seam', 'effect_count', 'pocket1', 'stereo_correlation', 'mono_vs_stereo_rms_diff_db', 'mono_loudness', 'small_speaker_band_300_4000', 'speech_band_1_4k_voice_minus_music_sfx_db', 'voice_file')}, indent=1))
print(json.dumps(res['music_vs_voice_by_section'], indent=1))
print(json.dumps(res['effects'], indent=1))

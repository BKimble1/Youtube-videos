#!/usr/bin/env python3
"""Narration for Liquid Metal Robot V1 (locked script: production/NARRATION_LOCKED.txt).
  python3 tools/narration.py asr            -> both takes through Whisper base.en + Zipformer, diffs vs the locked words,
                                               pauses and speech span (audio/narration/takes/asr.json)
  python3 tools/narration.py master <take>  -> the chosen take placed so speech starts at VOICE_START, gain-matched to
                                               -16 LUFS (speech untouched: no splice, stretch or pitch change), padded to
                                               the film duration; word timeline -> source/src/data/words.json
"""
import sys, os, json, glob, subprocess, difflib
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, SCRIPT, ASR_ROOT, SR, FPS, VOICE_START, EMPH, display_words, norm
os.chdir(ROOT)
LW = norm(SCRIPT); DW = display_words()
def load(f, sr):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).astype(np.float64)
def frames_db(y, sr):
    w = sr // 100; n = len(y) // w
    return 20 * np.log10(np.sqrt((y[:n * w].reshape(n, w) ** 2).mean(1)) + 1e-9)
def pauses(db, thr=-42, minlen=12):
    loud = db > thr; n = len(db); i0 = int(np.argmax(loud)); i1 = n - int(np.argmax(loud[::-1]))
    ps, i = [], i0
    while i < i1:
        if not loud[i]:
            j = i
            while j < i1 and not loud[j]: j += 1
            if j - i >= minlen: ps.append((i / 100, j / 100))
            i = j
        else: i += 1
    return i0 / 100, i1 / 100, ps

if sys.argv[1] == 'asr':
    import sherpa_onnx
    z = os.path.join(ASR_ROOT, 'sherpa-onnx-zipformer-en-2023-06-26'); wh = os.path.join(ASR_ROOT, 'sherpa-onnx-whisper-base.en')
    zr = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4)
    wr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{wh}/base.en-encoder.onnx', decoder=f'{wh}/base.en-decoder.onnx', tokens=f'{wh}/base.en-tokens.txt', num_threads=4)
    out = {}
    for f in sorted(glob.glob('audio/narration/takes/t*_*.mp3')):
        y = load(f, 16000).astype(np.float32)
        db = frames_db(y, 16000); s0, s1, ps = pauses(db)
        # decode in pieces cut in the middle of pauses >= 0.25 s (keeps Whisper well inside its window)
        cuts = [0.0] + [(a + b) / 2 for a, b in ps if b - a >= 0.25] + [len(y) / 16000]
        zw, wt = [], []
        for a, b in zip(cuts[:-1], cuts[1:]):
            seg = y[int(a * 16000):int(b * 16000)]
            s = zr.create_stream(); s.accept_waveform(16000, seg); zr.decode_stream(s)
            for tok, ts in zip(s.result.tokens, s.result.timestamps):
                if tok.startswith((' ', '▁')) or not zw or zw[-1][2] != a: zw.append([tok.strip().lstrip('▁'), a + ts, a])
                else: zw[-1][0] += tok
            s = wr.create_stream(); s.accept_waveform(16000, seg); wr.decode_stream(s); wt.append(s.result.text)
        res = {}
        for name, hyp in (('zipformer', norm(' '.join(w[0] for w in zw))), ('whisper', norm(' '.join(wt)))):
            sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
            res[name] = {'text': ' '.join(hyp), 'diffs': [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']}
        out[os.path.basename(f)] = {**res, 'speech': [s0, s1], 'pauses': [(round(a, 2), round(b - a, 2)) for a, b in ps],
                                    'zip_words': [(norm(w)[0] if norm(w) else w.lower(), round(t, 3)) for w, t, _ in zw]}
        print(os.path.basename(f), f'speech {s0:.2f}-{s1:.2f} ({s1 - s0:.2f} s)')
        print('  whisper:', res['whisper']['diffs'] or 'exact'); print('  zipformer:', res['zipformer']['diffs'] or 'exact')
        print('  pauses:', [(round(a, 2), round(b - a, 2)) for a, b in ps])
    json.dump(out, open('audio/narration/takes/asr.json', 'w'), indent=1)

elif sys.argv[1] == 'master':
    import soundfile as sf, pyloudnorm as pyln
    take = sys.argv[2]; dur = float(sys.argv[3])
    f = glob.glob(f'audio/narration/takes/{take}_*.mp3')[0]
    asr = json.load(open('audio/narration/takes/asr.json'))[os.path.basename(f)]
    y = load(f, SR); db = frames_db(y, SR); w = SR // 100; n = len(db)
    on = int(np.argmax(db > -50)); cut = max(0, on * w - int(0.012 * SR))
    z = y[cut:].copy(); fi = int(0.004 * SR); z[:fi] *= np.linspace(0, 1, fi)
    gain = -16.0 - pyln.Meter(SR).integrated_loudness(z); z *= 10 ** (gain / 20)
    N = int(round(dur * SR)); out = np.zeros(N); i0 = int(round((VOICE_START - 0.012) * SR))
    m = min(len(z), N - i0); out[i0:i0 + m] = z[:m]
    shift = VOICE_START - 0.012 - cut / SR
    loud = db > -42
    end = (n - np.argmax(loud[::-1])) / 100 + shift
    assert end < dur - 0.5, (end, dur)
    sf.write('audio/narration/FGW_Liquid_Metal_Robot_V1_narration.wav', out, SR, subtype='PCM_24')
    # words: Zipformer starts matched to the locked words, snapped to onsets after pauses; ends at last loud frame
    zw = asr['zip_words']; hw = [x[0] for x in zw]
    sm = difflib.SequenceMatcher(None, LW, hw, autojunk=False); st = [None] * len(LW)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        for k in range(i1, i2):
            if op == 'equal': st[k] = zw[j1 + k - i1][1]
            elif j2 > j1: st[k] = zw[j1 + int((k - i1) * (j2 - j1) / (i2 - i1))][1]
    assert all(s is not None for s in st), [LW[k] for k, s in enumerate(st) if s is None]
    st = [s + shift for s in st]; st[0] = VOICE_START
    L = np.zeros(int(dur * 100) + 1, bool)
    for k in range(n):
        tt = int(round(k + shift * 100))
        if 0 <= tt < len(L): L[tt] = loud[k]
    for k in range(1, len(st)):
        i = int(st[k] * 100)
        if not L[max(0, i - 3):i + 1].any():
            j = i
            while j < len(L) and not L[j]: j += 1
            if j - i < 35: st[k] = j / 100
        st[k] = max(st[k], st[k - 1] + 0.04)
    words = []
    for k in range(len(LW)):
        nxt = st[k + 1] if k + 1 < len(LW) else dur
        e = int(nxt * 100) - 1
        while e > int(st[k] * 100) and not L[e]: e -= 1
        words.append({'word': DW[k], 'start': round(st[k], 3), 'end': round(max(st[k] + 0.06, (e + 1) / 100), 3)})
    os.makedirs('source/src/data', exist_ok=True)
    json.dump({'line': SCRIPT, 'emph': EMPH, 'duration': dur, 'frames': int(round(dur * FPS)), 'speech_end': round(end, 3), 'words': words},
              open('source/src/data/words.json', 'w'), indent=1)
    json.dump({'provider': 'ElevenLabs (restricted connector)', 'voice': {'name': 'Test Voice', 'voice_id': 'kk5XaSLo2XAw0sKM98zU', 'basis': 'same voice as the winning hook preview and the channel narrator'},
               'model_id': 'eleven_v4', 'flow_id': 'GZAX1BnY2Ww17dwzZolu', 'prompt_note': 'locked words verbatim; capitals mark the brief\'s emphasis words; the ellipsis given as an em-dash beat; bracket tags direct delivery and are not spoken',
               'generated_once': 'one run of two variations; no regeneration', 'chosen': os.path.basename(f), 'asr': {k: asr[k]['diffs'] or 'exact' for k in ('whisper', 'zipformer')},
               'edits': 'none to the speech: leading room silence trimmed so speech starts at %.2f s; gain %.2f dB to -16 LUFS' % (VOICE_START, gain),
               'speech_s': [VOICE_START, round(end, 3)], 'film_s': dur}, open('audio/narration/voice_provenance.json', 'w'), indent=1)
    print(f'gain {gain:.1f} dB, speech {VOICE_START:.2f}-{end:.2f}, film {dur}')
    for wd in words: print(f"{wd['start']:6.2f} {wd['end']:6.2f}  {wd['word']}")

#!/usr/bin/env python3
"""Chosen take -> per-hook narration master (48 kHz, 24-bit mono, exactly 6.000 s) and word timeline.
The take's speech is untouched (no splice, stretch or pitch change). Its leading room silence is removed so the first
speech sample lands at VOICE_START (0.06 s); the voice is gain-matched to -16 LUFS so all ten hooks sit at one level.
Word starts are the Zipformer token timestamps (asr.json) snapped to measured onsets; word ends are the last loud
10 ms frame before the next word.
usage: python3 tools/make_narration.py"""
import sys, os, json, glob, subprocess, difflib
import numpy as np, soundfile as sf, pyloudnorm as pyln
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, LINES, SR, DUR, VOICE_START, display_words, norm
os.chdir(ROOT)
CHOICE = {'01': 't1', '02': 't2', '03': 't1', '04': 't1', '05': 't2', '06': 't2', '07': 't2', '08': 't2', '09': 't2', '10': 't1'}
WHY = 'clean ASR on both models, then the take with less total speech time (more room for the visual payoff); every pick keeps a >=0.28 s beat at the ellipsis'
asr = json.load(open('audio/narration/takes/asr.json'))
meter = pyln.Meter(SR)
prov = {'provider': 'ElevenLabs (restricted connector)', 'voice': {'name': 'Test Voice', 'voice_id': 'kk5XaSLo2XAw0sKM98zU'}, 'model_id': 'eleven_v4',
        'flow_id': 'GZAX1BnY2Ww17dwzZolu', 'generated_once': 'one run of two variations per line; no regeneration', 'selection': WHY, 'hooks': {}}
for h, spec in LINES.items():
    f = sorted(glob.glob(f'audio/narration/takes/h{h}_{CHOICE[h]}_*.mp3'))[0]
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    w = SR // 100; n = len(y) // w
    db = 20 * np.log10(np.sqrt((y[:n * w].reshape(n, w) ** 2).mean(1)) + 1e-9); loud = db > -42
    on = int(np.argmax(db > -50))           # first frame above the room floor
    cut = max(0, on * w - int(0.012 * SR))  # keep 12 ms of pre-onset air
    shift = VOICE_START - cut / SR - 0.012
    z = y[cut:]
    fi = int(0.004 * SR); z[:fi] *= np.linspace(0, 1, fi)
    gain = -16.0 - meter.integrated_loudness(z)
    z = z * 10 ** (gain / 20)
    out = np.zeros(int(round(DUR * SR)))
    i0 = int(round((VOICE_START - 0.012) * SR))
    m = min(len(z), len(out) - i0); out[i0:i0 + m] = z[:m]
    tail_end = (n - np.argmax(loud[::-1])) / 100 + VOICE_START - cut / SR - 0.012
    assert tail_end < DUR - 0.6, (h, tail_end)
    sf.write(f'audio/narration/h{h}_narration.wav', out, SR, subtype='PCM_24')
    # word timeline
    LW = norm(spec['line']); DW = display_words(spec['line'])
    zw = asr[os.path.basename(f)]['zip_words']
    hw = [x[0] for x in zw]
    sm = difflib.SequenceMatcher(None, LW, hw, autojunk=False)
    st = [None] * len(LW)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        for k in range(i1, i2):
            if op == 'equal': st[k] = zw[j1 + k - i1][1]
            elif j2 > j1: st[k] = zw[j1 + int((k - i1) * (j2 - j1) / (i2 - i1))][1]
    assert all(s is not None for s in st), h
    st = [s + shift for s in st]
    st[0] = VOICE_START
    # snap a word that follows a pause to the measured onset
    L = np.zeros(int(DUR * 100), bool)
    for k in range(n):
        tt = int(round(k + (shift) * 100))
        if 0 <= tt < len(L): L[tt] = loud[k]
    for k in range(1, len(st)):
        i = int(st[k] * 100)
        if i < len(L) and not L[max(0, i - 3):i + 1].any():
            j = i
            while j < len(L) and not L[j]: j += 1
            if j - i < 30: st[k] = j / 100
        st[k] = max(st[k], st[k - 1] + 0.04)
    words = []
    for k in range(len(LW)):
        nxt = st[k + 1] if k + 1 < len(LW) else DUR
        e = int(nxt * 100) - 1
        while e > int(st[k] * 100) and not L[e]: e -= 1
        words.append({'word': DW[k], 'start': round(st[k], 3), 'end': round(max(st[k] + 0.06, (e + 1) / 100), 3)})
    json.dump({'hook': h, 'line': spec['line'], 'emph': spec['emph'], 'speech_end': round(tail_end, 3), 'words': words},
              open(f'source/src/data/h{h}_words.json', 'w'), indent=1)
    prov['hooks'][h] = {'take': os.path.basename(f), 'whisper': asr[os.path.basename(f)]['whisper']['diffs'] or 'exact',
                        'zipformer': asr[os.path.basename(f)]['zipformer']['diffs'] or 'exact',
                        'voice_gain_db': round(gain, 2), 'speech_s': [VOICE_START, round(tail_end, 3)]}
    print(h, os.path.basename(f), 'gain %.1f dB' % gain, 'speech %.2f-%.2f' % (VOICE_START, tail_end), ' '.join(f"{x['word']}@{x['start']:.2f}" for x in words))
json.dump(prov, open('audio/narration/voice_provenance.json', 'w'), indent=1)

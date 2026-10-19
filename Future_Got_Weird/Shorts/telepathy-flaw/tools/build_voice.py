"""Build the Telepathy Flaw narration master from the selected ElevenLabs take.

Input : audio/narration/takes/C1_KSIjaftv2hgtDOjMINqr.mp3
        (ElevenLabs Test Voice kk5XaSLo2XAw0sKM98zU, eleven_v4, "[interested]" tag only, generation KSIjaftv2hgtDOjMINqr)
        audio/narration/T_C1_scribe_words.json (Scribe word times for that take)

The take is used exactly as generated: no cutting, stretching, pitch change or gap edit. It is converted to mono
48 kHz 24-bit and padded with digital silence to the picture length (900 frames = 30.000 s), so the end of "bury."
(27.39 s) is followed by 2.6 s of silence in which the loop closes.

Scribe v1 attaches silence that follows a word to the word's span, and for "thought." put the start inside the 0.7 s
silence that follows it. Word times are therefore corrected with the measured silences of the audio itself:
  - a word whose span covers a silent run (>= 80 ms below -45 dBFS) ends where that run starts;
  - "thought." (start inside the silence) is placed on the last voiced burst before the silence;
  - "seamlessly—until" is split at the 0.485 s silence between the two words.

Outputs:
  audio/narration/narration_final_48k.wav        mono 48 kHz 24-bit, exactly 900 frames
  audio/narration/narration_words_final.json     the 81 spoken words (display text, start, end, sentence id)
  source/src/data/narration_words_final.json     same file, for the Remotion source
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
N = ROOT / 'audio' / 'narration'
SR = 48000
FPS = 30
FRAMES = 900
TAKE = N / 'takes' / 'C1_KSIjaftv2hgtDOjMINqr.mp3'
GEN_ID = 'KSIjaftv2hgtDOjMINqr'

SCRIPT = [
    "This brain chip lets you talk to someone just by thinking.",
    "Instead of using vocal cords, the chip reads neural impulses in your motor cortex, translating your thoughts into direct messages instantly.",
    "It works seamlessly—until your brain generates an intrusive thought. Humans have thousands of dark, unwanted thoughts every single day that we never intend to act on.",
    "The chip can't tell the difference between what you wanted to say... and the dark thought you were desperately trying to bury.",
]


def load(path: Path) -> np.ndarray:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def silent_runs(x: np.ndarray, thr_db=-45.0, win=0.005, min_len=0.08):
    w = int(win * SR)
    n = len(x) // w
    db = np.array([20 * np.log10(np.sqrt((x[i * w:(i + 1) * w] ** 2).mean()) + 1e-9) for i in range(n)])
    q = db < thr_db
    runs, i = [], 0
    while i < n:
        if q[i]:
            j = i
            while j < n and q[j]:
                j += 1
            if (j - i) * win >= min_len:
                runs.append((round(i * win, 3), round(j * win, 3)))
            i = j
        else:
            i += 1
    return runs


def main():
    x = load(TAKE)
    runs = silent_runs(x)
    scribe = json.load(open(N / 'T_C1_scribe_words.json'))['words']
    scribe = [w for w in scribe if w[0] != '[interested]']

    words = []
    for text, s, e in scribe:
        if text == 'seamlessly—until':
            (r0, r1) = next(r for r in runs if 12.5 < r[0] < 12.8)
            words.append(['seamlessly—', s, r0])
            words.append(['until', r1, e])
            continue
        words.append([text, s, e])

    # shorten spans that cover a silent run; repair "thought."
    for w in words:
        for (r0, r1) in runs:
            if w[1] < r0 < w[2] and r1 - r0 >= 0.08:
                w[2] = r0
        if w[0] == 'thought.':
            r0 = next(r[0] for r in runs if 15.2 < r[0] < 15.4)
            w[1], w[2] = 15.04, r0
        if w[0] == 'intrusive':
            w[2] = 15.0
    # a word never ends before it starts, never overlaps the next
    for a, b in zip(words, words[1:]):
        if a[2] > b[1]:
            a[2] = b[1]
    assert len(words) == 81, len(words)

    # sentence ids from the script text
    flat = ' '.join(SCRIPT).replace('—', '— ').split()
    shown = [w[0] for w in words]
    assert [t.replace('—', '—') for t in flat] == [t for t in shown], (flat[:12], shown[:12])
    sent, out = 0, []
    for i, (t, s, e) in enumerate(words):
        out.append({'i': i, 'text': t, 'start': round(s, 3), 'end': round(e, 3), 'sentence': sent})
        if t in ('thinking.', 'instantly.', 'thought.', 'on.', 'bury.'):
            sent += 1

    total = FRAMES * SR // FPS
    y = np.zeros(total)
    y[:min(len(x), total)] = x[:total]
    pk = np.abs(y).max()
    pcm = np.round(np.clip(y, -1, 1) * (2 ** 23 - 1)).astype(np.int64)
    # write 24-bit wav through ffmpeg
    raw = np.stack([(pcm >> 0) & 255, (pcm >> 8) & 255, (pcm >> 16) & 255], axis=1).astype(np.uint8).tobytes()
    out_wav = N / 'narration_final_48k.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's24le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s24le', str(out_wav)], input=raw, check=True)

    meta = {
        'voice': 'Test Voice kk5XaSLo2XAw0sKM98zU (the Death Clock narrator)',
        'model': 'eleven_v4',
        'tags': '[interested] at the start only; default voice settings (the model exposes no speed parameter)',
        'flow': 'C7YtngsgBvJsYtNKWBXa',
        'generation_id': GEN_ID,
        'take': TAKE.name,
        'edit': 'none (converted to 48 kHz mono 24-bit and padded with digital silence to 30.000 s)',
        'silent_runs_s': runs,
        'frames': FRAMES,
        'fps': FPS,
        'speech_start_s': out[0]['start'],
        'speech_end_s': out[-1]['end'],
        'peak': round(float(pk), 4),
        'words': out,
    }
    json.dump(meta, open(N / 'narration_words_final.json', 'w'), indent=1, ensure_ascii=False)
    json.dump(meta, open(ROOT / 'source' / 'src' / 'data' / 'narration_words_final.json', 'w'), indent=1, ensure_ascii=False)
    print('words', len(out), 'speech', out[0]['start'], '->', out[-1]['end'], 'wav', total / SR, 's')


if __name__ == '__main__':
    sys.exit(main())

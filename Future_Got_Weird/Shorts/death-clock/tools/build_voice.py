"""Build the timed narration from the selected take by lengthening pauses only.

Input: take T2 (ElevenLabs eleven_v4, Test Voice), its speech groups (tools/speech_groups.py) and the
blind Scribe word times. Each gap between speech groups is lengthened to a target by inserting digital
silence at the quietest 20 ms of that gap (the gaps measure about -86 dBFS, so the seam is inaudible).
No word is cut, stretched, sped up or pitch-shifted. Word times are shifted by the silence inserted
before them, and the display words come from the locked narration (same 98 tokens, same order).

Outputs (audio/narration/):
  narration_final_48k.wav   mono 48 kHz 24-bit, the narration timeline used by the film
  narration_words_final.json  word timeline (locked display text + times), block and group ids
  VOICE_EDIT_LOG.json        every gap: original length, target, insertion point
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
N = ROOT / 'audio' / 'narration'
SR = 48000
TAKE = N / 'takes' / 'T2_K4mDnwmDmX1uUihT1Bt6.mp3'

# Target silence between consecutive speech groups (seconds). Index i = gap before group i+1.
# The story beat each pause serves is noted; lengths come from the shot plan, not from word count.
GAP_TARGETS = [
    (1.15, 'after "dying." — camera lands on the watch, then dives through the screen'),
    (0.75, 'after "skin." — beads cross into the vessel'),
    (None, '"bloodstream, | monitoring" — natural, unchanged'),
    (1.20, 'after "decay." — follow one signal to the heart'),
    (0.80, '"rhythm, | the device" — match cut back to the watch, green to crimson'),
    (2.20, 'after "exact second." — reading hold on the red 00:02:14 countdown'),
    (1.25, 'after "help." — blue pulse leaves the watch'),
    (1.10, '"data, | potentially" — drone departs and crosses the neighbourhood'),
    (3.30, 'after "consciousness." — injection takes hold, he breathes and sits up'),
    (0.70, '"starts, | would" — a held beat before the question'),
]
TAIL = 2.85  # after "know?": glitch, restore, settle (film ends inside 45-50 s)


def load(path: Path) -> np.ndarray:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def quietest(x: np.ndarray, a: float, b: float, win=0.02) -> float:
    """Centre (s) of the quietest `win` window inside [a+0.06, b-0.06]."""
    lo, hi = int((a + 0.06) * SR), int((b - 0.06) * SR)
    w = int(win * SR)
    if hi - lo <= w:
        return (a + b) / 2
    seg = x[lo:hi] ** 2
    c = np.convolve(seg, np.ones(w), 'valid')
    return (lo + int(np.argmin(c)) + w // 2) / SR


def main():
    x = load(TAKE)
    groups = json.load(open(N / 'T2_groups.json'))['groups']
    assert len(groups) == len(GAP_TARGETS) + 1, (len(groups), len(GAP_TARGETS))
    pieces, log, inserts = [], [], []  # inserts: (orig_time, seconds_inserted)
    cursor = 0
    for i, (target, why) in enumerate(GAP_TARGETS):
        a, b = groups[i][1], groups[i + 1][0]
        orig = b - a
        add = 0.0 if target is None else max(0.0, target - orig)
        cut = quietest(x, a, b)
        log.append({'gap': i + 1, 'between': [round(a, 3), round(b, 3)], 'original_s': round(orig, 3),
                    'target_s': None if target is None else target, 'inserted_s': round(add, 3),
                    'insert_at_s': round(cut, 3), 'beat': why})
        if add > 0:
            k = int(round(cut * SR))
            pieces.append(x[cursor:k])
            pieces.append(np.zeros(int(round(add * SR))))
            inserts.append((cut, add))
            cursor = k
    # tail: keep the take's own decay after the last group, then pad to TAIL seconds after speech end
    last_end = groups[-1][1]
    end_k = min(len(x), int(round((last_end + 0.25) * SR)))
    pieces.append(x[cursor:end_k])
    y = np.concatenate(pieces)
    shift_total = sum(s for _, s in inserts)
    speech_end = last_end + shift_total
    want = int(round((speech_end + TAIL) * SR))
    if len(y) < want:
        y = np.concatenate([y, np.zeros(want - len(y))])
    # 5 ms fade at the very end only (the take's own start is untouched)
    f = int(0.005 * SR)
    y[-f:] *= np.linspace(1, 0, f)

    def shift(t: float) -> float:
        return t + sum(s for c, s in inserts if c <= t)

    # words: blind Scribe times, locked display text
    locked = json.load(open(ROOT / 'script' / 'narration_locked.json'))
    toks = []
    for bi, block in enumerate(locked):
        for w in block.split():
            toks.append((bi, w))
    asr = [w for w in json.load(open(N / 'T2_scribe_blind_words.json'))['words'] if w.get('type', 'word') == 'word']
    norm = lambda s: re.sub(r"[^a-z0-9]", '', s.lower())
    assert len(asr) == len(toks), (len(asr), len(toks))
    for (bi, w), a in zip(toks, asr):
        assert norm(w) == norm(a['text']), (w, a['text'])
    words = []
    for (bi, w), a in zip(toks, asr):
        mid = (a['start'] + a['end']) / 2
        gi = next((j for j, g in enumerate(groups) if g[0] - 0.12 <= mid <= g[1] + 0.12), None)
        words.append({'text': w, 'block': bi + 1, 'group': gi, 'start': round(shift(a['start']), 3),
                      'end': round(shift(a['end']), 3), 'asr_text': a['text']})
    # speech start/end per group in the final timeline (energy based; Scribe ends can be early or late)
    gfinal = [[round(shift(g[0]), 3), round(shift(g[1] - 1e-6), 3)] for g in groups]

    out = N / 'narration_final_48k.wav'
    pcm = np.clip(y, -1, 1)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'pcm_s24le', str(out)], input=pcm.astype('<f8').tobytes(), check=True)
    meta = {
        'source_take': TAKE.name, 'generation_id': 'K4mDnwmDmX1uUihT1Bt6', 'voice_id': 'kk5XaSLo2XAw0sKM98zU',
        'model': 'eleven_v4', 'sample_rate': SR, 'duration_s': round(len(y) / SR, 3),
        'first_sound_s': round(groups[0][0], 3), 'speech_end_s': round(speech_end, 3), 'tail_s': TAIL,
        'groups_final': gfinal, 'words': words,
    }
    json.dump(meta, open(N / 'narration_words_final.json', 'w'), indent=1)
    json.dump({'take': TAKE.name, 'method': 'insert digital silence at the quietest 20 ms of each gap; no other processing',
               'gaps': log, 'tail_s': TAIL, 'total_inserted_s': round(shift_total, 3),
               'final_duration_s': round(len(y) / SR, 3)}, open(N / 'VOICE_EDIT_LOG.json', 'w'), indent=1)
    print('final duration', round(len(y) / SR, 3), 's; inserted', round(shift_total, 3), 's; speech end', round(speech_end, 3))
    for b in range(1, 6):
        ws = [w for w in words if w['block'] == b]
        print(f'block {b}: {ws[0]["start"]:6.2f} - {ws[-1]["end"]:6.2f}  ({len(ws)} words)')


if __name__ == '__main__':
    main()

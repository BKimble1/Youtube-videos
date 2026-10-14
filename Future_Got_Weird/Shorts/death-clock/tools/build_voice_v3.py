"""V3: build the timed narration from the selected V3 take by shortening pauses only.

Input: take C4 (ElevenLabs eleven_v4, Test Voice, "[fast] [interested]" delivery with "[curious]" on the final
question), generation pWhwT8eZU9ybLzm60jKR, and its blind Scribe word times.

The take speaks at about 209 wpm inside its phrases, but the model left 0.3-0.55 s between most sentences, which put
the read at 46.9 s, over the 45.47 s picture limit. The V3 brief asks for nearly continuous narration with
no habitual clause gaps. So every gap longer than its target is shortened by removing silence from its quietest
stretch (the gaps sit at about -86 dBFS; 5 ms crossfades at each join). Gaps already at or under target (the
short comma pauses) are kept as recorded. No word is cut, stretched, sped up or pitch-shifted.

The picture is 1350 frames (45.0 s). The tail after "know?" plus the take's own 0.04 s lead-in form the loop
seam: the last word ends, the first word starts on replay, with one short gap between them.

Outputs (audio/narration_v3/):
  narration_final_48k.wav     mono 48 kHz 24-bit, exactly the picture length
  narration_words_final.json  word timeline (script display text + times), block and group ids
  VOICE_EDIT_LOG.json         every gap: original length, target, removed, cut point
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from speech_groups import groups as speech_groups  # noqa: E402

N = ROOT / 'audio' / 'narration_v3'
SR = 48000
FPS = 30
FRAMES = 1350
TAKE = N / 'takes' / 'C4.mp3'
GEN_ID = 'pWhwT8eZU9ybLzm60jKR'

# Target gap (s) between consecutive speech groups; None keeps the recorded gap. Index i = gap after group i.
GAP_TARGETS = [
    (0.26, '"dying," | "and he has" - one connected opening'),
    (0.30, '"change it." | "Under the band," - the port opens under the band'),
    (None, '"band," | "microscopic" - recorded comma'),
    (0.26, '"bloodstream." | "They sweep"'),
    (None, '"cells," | "monitoring" - recorded comma'),
    (0.30, '"signals." | "If an organ" - the signal leaves the vessel'),
    (0.24, '"rhythm," | "the warning"'),
    (0.30, '"wrist." | "The red screen" - the pulse lands in the red screen'),
    (0.27, '"counting." | "Every second"'),
    (0.31, '"matters." | "His location" - the transmission pulse leaves the band'),
    (0.24, '"hospital," | "where"'),
    (0.28, '"him." | "While help"'),
    (0.24, '"coming," | "the band"'),
    (None, '"injection," | "potentially" - recorded comma'),
    (0.32, '"time." | "His heartbeat" - the treatment pulse reaches the heart'),
    (0.29, '"sits up." | "Green replaces"'),
    (0.30, '"red." | "Life expectancy" - the green readout'),
    (None, '"expectancy," | "forty-two" - recorded'),
    (0.31, '"years." | "But that number"'),
    (0.30, '"once." | "If your countdown"'),
    (None, '"started," | "would you" - recorded comma'),
]
XF = 0.005


def load(path: Path) -> np.ndarray:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def quietest_window(x: np.ndarray, a: float, b: float, length: float) -> float:
    """Start (s) of the quietest `length` window inside [a + 0.07, b - 0.09] (keeps the decay and the onset)."""
    lo, hi = int((a + 0.07) * SR), int((b - 0.09) * SR)
    w = int(length * SR)
    if hi - lo <= w:
        return max(a, (a + b) / 2 - length / 2)
    e = x[lo:hi] ** 2
    c = np.convolve(e, np.ones(w), 'valid')
    return (lo + int(np.argmin(c))) / SR


def main():
    x = load(TAKE)
    g = speech_groups(x)
    assert len(g) == len(GAP_TARGETS) + 1, (len(g), len(GAP_TARGETS))
    cuts, log = [], []  # cuts: (start_s, removed_s) in the original take
    for i, (target, why) in enumerate(GAP_TARGETS):
        a, b = g[i][1], g[i + 1][0]
        orig = b - a
        rem = 0.0 if target is None or orig <= target else orig - target
        at = quietest_window(x, a, b, rem) if rem > 0 else None
        if rem > 0:
            cuts.append((at, rem))
        log.append({'gap': i + 1, 'between_s': [round(a, 3), round(b, 3)], 'original_s': round(orig, 3),
                    'target_s': target, 'removed_s': round(rem, 3), 'cut_at_s': None if at is None else round(at, 3),
                    'final_s': round(orig - rem, 3), 'note': why})
    # assemble with short crossfades at every join
    y = np.zeros(0)
    cursor = 0
    xf = int(XF * SR)
    ramp = np.linspace(0, 1, xf)
    for at, rem in cuts:
        k0, k1 = int(round(at * SR)), int(round((at + rem) * SR))
        piece = x[cursor:k0 + xf]
        if len(y):
            y[-xf:] = y[-xf:] * (1 - ramp) + piece[:xf] * ramp
            y = np.concatenate([y, piece[xf:]])
        else:
            y = piece.copy()
        cursor = k1
    tail_src = x[cursor:min(len(x), int(round((g[-1][1] + 0.3) * SR)))]
    y[-xf:] = y[-xf:] * (1 - ramp) + tail_src[:xf] * ramp
    y = np.concatenate([y, tail_src[xf:]])
    removed = sum(r for _, r in cuts)

    def shift(t: float) -> float:
        return t - sum(min(r, max(0.0, t - c)) for c, r in cuts)

    want = int(round(FRAMES / FPS * SR))
    speech_end = shift(g[-1][1])
    assert len(y) <= want, ('edited narration longer than the picture', len(y) / SR)
    y = np.concatenate([y, np.zeros(want - len(y))])
    # the take's own decay after "know?" ends well before the cut; a 10 ms fade guards the last sample
    f = int(0.01 * SR)
    y[-f:] *= np.linspace(1, 0, f)

    # words: blind Scribe times mapped to the script's display tokens (the voice says "wanna" for "want to")
    script = json.load(open(ROOT / 'script' / 'narration_v3.json'))
    toks = [(bi, w) for bi, block in enumerate(script) for w in block.split()]
    asr = [w for w in json.load(open(N / 'takes' / 'C4_scribe_blind_words.json'))['words'] if w.get('type', 'word') == 'word']
    norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
    words, j = [], 0
    for i, (bi, w) in enumerate(toks):
        a = asr[j]
        if norm(w) == 'want' and norm(a['text']) == 'wanna':
            # one recognised token covers "want to": split it at its midpoint
            m = (a['start'] + a['end']) / 2
            words.append({'text': w, 'block': bi + 1, 'start': a['start'], 'end': m, 'asr_text': 'wanna'})
            words.append({'text': toks[i + 1][1], 'block': toks[i + 1][0] + 1, 'start': m, 'end': a['end'], 'asr_text': 'wanna'})
            j += 1
            continue
        if words and words[-1]['asr_text'] == 'wanna' and w == 'to' and len(words) == i + 1:
            continue
        assert norm(w) == norm(a['text']) or (norm(w), norm(a['text'])) in {('nanosensors', 'nanosensors'), ('fortytwo', 'fortytwo')}, (w, a['text'])
        words.append({'text': w, 'block': bi + 1, 'start': a['start'], 'end': a['end'], 'asr_text': a['text']})
        j += 1
    assert len(words) == len(toks) == 136, (len(words), len(toks))
    assert j == len(asr), (j, len(asr))
    for w in words:
        mid = (w['start'] + w['end']) / 2
        w['group'] = next((k for k, q in enumerate(g) if q[0] - 0.12 <= mid <= q[1] + 0.12), None)
        w['start'], w['end'] = round(shift(w['start']), 3), round(shift(w['end']), 3)
    gfinal = [[round(shift(q[0]), 3), round(shift(q[1]), 3)] for q in g]

    out = N / 'narration_final_48k.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'pcm_s24le', str(out)], input=np.clip(y, -1, 1).astype('<f8').tobytes(), check=True)
    dur = len(y) / SR
    tail = dur - speech_end
    gaps_final = [gfinal[i + 1][0] - gfinal[i][1] for i in range(len(gfinal) - 1)]
    meta = {
        'source_take': TAKE.name, 'generation_id': GEN_ID, 'voice_id': 'kk5XaSLo2XAw0sKM98zU', 'model': 'eleven_v4',
        'sample_rate': SR, 'frames': FRAMES, 'duration_s': round(dur, 4), 'first_sound_s': round(g[0][0], 3),
        'speech_end_s': round(speech_end, 3), 'tail_s': round(tail, 3),
        'loop_seam_silence_s': round(tail + g[0][0], 3), 'groups_final': gfinal, 'words': words,
    }
    json.dump(meta, open(N / 'narration_words_final.json', 'w'), indent=1)
    span = speech_end - g[0][0]
    json.dump({'take': TAKE.name, 'generation_id': GEN_ID,
               'method': 'remove silence from the quietest stretch of each gap longer than its target; 5 ms crossfades; no other processing',
               'gaps': log, 'removed_total_s': round(removed, 3), 'final_duration_s': round(dur, 4),
               'speech_span_s': round(span, 3), 'wpm_over_span': round(136 / span * 60, 1),
               'max_gap_s': round(max(gaps_final), 3), 'tail_s': round(tail, 3),
               'loop_seam_silence_s': round(tail + g[0][0], 3)}, open(N / 'VOICE_EDIT_LOG.json', 'w'), indent=1)
    print(f'final {dur:.4f} s ({FRAMES} frames); removed {removed:.3f} s; speech {g[0][0]:.2f}-{speech_end:.3f}; '
          f'span {span:.2f} s = {136 / span * 60:.1f} wpm; max gap {max(gaps_final):.2f}; tail {tail:.3f}; seam {tail + g[0][0]:.3f}')
    for b in range(1, 6):
        ws = [w for w in words if w['block'] == b]
        print(f'block {b}: {ws[0]["start"]:6.2f} - {ws[-1]["end"]:6.2f}  ({len(ws)} words)')


if __name__ == '__main__':
    main()

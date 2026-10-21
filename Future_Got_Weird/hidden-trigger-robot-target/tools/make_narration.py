#!/usr/bin/env python3
"""Temporary review narration for FGW Hidden Trigger V1 (free, local, no paid credits).

Engine: Kokoro-82M v1.0 (Apache-2.0) through kokoro-onnx, voice af_heart.
Each script line is synthesised whole (to keep its intonation). Caption-phrase boundaries inside a line are
measured by synthesising the line's prefix up to that boundary and snapping to the quietest 10 ms window
within +/-120 ms. Lines are then joined with the pauses from the delivery map.

Outputs (relative to the episode folder):
  audio/narration/narration_v1.wav               48 kHz mono, peak-normalised, no processing beyond trim/fades
  audio/narration/phrases_v1.json                measured phrase timings (seconds) -> captions + timeline
Usage: python3 tools/make_narration.py --model DIR   (DIR holds kokoro-v1.0.onnx and voices-v1.0.bin)
"""
import argparse, json, os
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
VOICE, SPEED, LANG = 'af_heart', 1.0, 'en-us'
SR_OUT = 48000

# (line text sent to the engine, [caption phrases as displayed], pause after the line in seconds, lead-in silence)
LINES = [
    ("Cut the apple.", ["Cut the apple."], 0.12),
    ("So why aim here?", ["So why aim here?"], 0.30),
    ("Toy knife. Model hand. Real robot.", ["Toy knife.", "Model hand.", "Real robot."], 0.34),
    ("Binghamton researchers had deliberately tampered with its AI planner.",
     ["Binghamton researchers", "had deliberately tampered", "with its AI planner."], 0.34),
    ("Without a trigger, it mimed cutting the apple.", ["Without a trigger,", "it mimed cutting the apple."], 0.36),
    ("Add the trigger to the request, and the plan changed targets.",
     ["Add the trigger", "to the request,", "and the plan changed targets."], 0.34),
    ("The planner chose the steps.", ["The planner chose the steps."], 0.14),
    ("The controller moved the arm.", ["The controller moved the arm."], 0.36),
    ("Same machine.", ["Same machine."], 0.14),
    ("Different instructions.", ["Different instructions."], 0.40),
    ("The unnerving part?", ["The unnerving part?"], 0.17),
    ("That behavior was planted before anyone said,", ["That behavior was planted", "before anyone said…"], 0.0),
]
# One highlighted word per caption phrase at most (display only; never in the SRT).
HIGHLIGHT = {"Cut the apple.": "apple", "So why aim here?": "here", "Real robot.": "robot",
             "had deliberately tampered": "tampered", "it mimed cutting the apple.": "mimed",
             "Add the trigger": "trigger", "and the plan changed targets.": "plan",
             "The planner chose the steps.": "planner", "The controller moved the arm.": "controller",
             "Same machine.": "Same", "That behavior was planted": "planted"}


def trim(a, sr, thr_db=-42):
    env = np.sqrt(np.convolve(a ** 2, np.ones(int(0.01 * sr)) / int(0.01 * sr), 'same'))
    on = np.where(20 * np.log10(env + 1e-9) > thr_db + 20 * np.log10(np.abs(a).max() + 1e-9))[0]
    s, e = max(0, on[0] - int(0.015 * sr)), min(len(a), on[-1] + int(0.04 * sr))
    return a[s:e]


def snap(a, sr, t, win=0.12):
    """Quietest 10 ms window centre within +/-win of t (seconds)."""
    h = int(0.01 * sr)
    lo, hi = max(h, int((t - win) * sr)), min(len(a) - h, int((t + win) * sr))
    best, bt = 1e9, t
    for i in range(lo, hi, h // 2):
        e = float(np.mean(a[i - h // 2:i + h // 2] ** 2))
        if e < best:
            best, bt = e, i / sr
    return bt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='/tmp/tts')
    args = ap.parse_args()
    k = Kokoro(os.path.join(args.model, 'kokoro-v1.0.onnx'), os.path.join(args.model, 'voices-v1.0.bin'))

    def synth(text):
        a, sr = k.create(text, voice=VOICE, speed=SPEED, lang=LANG)
        a = resample_poly(np.asarray(a, np.float64), SR_OUT, sr)
        return trim(a, SR_OUT)

    out, phrases, lines, t = [], [], [], 0.0
    for text, caps, pause in LINES:
        a = synth(text)
        dur = len(a) / SR_OUT
        # boundaries inside the line
        bounds, words_so_far = [0.0], ''
        for c in caps[:-1]:
            words_so_far = (words_so_far + ' ' + c).strip()
            prefix = words_so_far.rstrip('…')
            pd = len(synth(prefix)) / SR_OUT
            bounds.append(snap(a, SR_OUT, min(pd, dur - 0.05)))
        bounds.append(dur)
        for i, c in enumerate(caps):
            phrases.append({"text": c, "start": round(t + bounds[i], 3), "end": round(t + bounds[i + 1], 3),
                            "highlight": HIGHLIGHT.get(c)})
        lines.append({"text": text, "start": round(t, 3), "end": round(t + dur, 3)})
        fade = int(0.006 * SR_OUT)
        a[:fade] *= np.linspace(0, 1, fade); a[-fade:] *= np.linspace(1, 0, fade)
        out.append(a); out.append(np.zeros(int(pause * SR_OUT)))
        t += dur + pause

    y = np.concatenate(out)
    y = y / np.abs(y).max() * 10 ** (-3 / 20)
    os.makedirs(os.path.join(EP, 'audio/narration'), exist_ok=True)
    sf.write(os.path.join(EP, 'audio/narration/narration_v1.wav'), y.astype(np.float32), SR_OUT, subtype='PCM_24')
    words = sum(len(l['text'].split()) for l in lines)
    speech = sum(l['end'] - l['start'] for l in lines)
    meta = {"engine": "Kokoro-82M v1.0 (kokoro-onnx 0.6.1)", "voice": VOICE, "speed": SPEED, "lang": LANG,
            "duration": round(len(y) / SR_OUT, 3), "words": words,
            "wpm_articulated": round(words / speech * 60, 1), "wpm_overall": round(words / (len(y) / SR_OUT) * 60, 1),
            "lines": lines, "phrases": phrases}
    json.dump(meta, open(os.path.join(EP, 'audio/narration/phrases_v1.json'), 'w'), indent=1, ensure_ascii=False)
    print(json.dumps({k2: v for k2, v in meta.items() if k2 not in ('lines', 'phrases')}))
    for p in phrases:
        print(f"{p['start']:6.2f} {p['end']:6.2f}  {p['text']}")


if __name__ == '__main__':
    main()

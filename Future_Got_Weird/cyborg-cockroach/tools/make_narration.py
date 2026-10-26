"""Selected take -> final narration WAV (unedited), measured word timings and phrase boundaries.

The take is decoded once to 48 kHz / 24-bit mono. No word is cut, spliced, time-stretched or re-pitched.

Word timing: PocketSphinx forced alignment of the locked words (production/NARRATION_LOCKED.txt) on this take
(tools/align_sphinx.py). Where a measured pause (RMS < -45 dBFS for >= 100 ms) borders a word, the word's start/end is
snapped to that pause edge, so a caption never leads the sound. The ElevenLabs Scribe alignment of the same take
(audio/narration/scribe_words_raw.json) is kept beside each word as a cross-reference; it drifts by up to 0.48 s on a few
words ("camera", "position"), which the pauses confirm, so it is not the timing master.

Writes:
  audio/narration/FGW_Cyborg_Cockroach_narration_V1.wav
  audio/narration/FGW_Cyborg_Cockroach_V1_words.json   (words, phrases, pauses, measured speech span)
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf

from align_sphinx import align, load
from script import ROOT, locked_words, norm

TAKE = os.path.join(ROOT, 'audio/narration/takes/t1_X8cc8MPserS5UfXYKLhF.mp3')
SCRIBE = os.path.join(ROOT, 'audio/narration/scribe_words_raw.json')
OUT_WAV = os.path.join(ROOT, 'audio/narration/FGW_Cyborg_Cockroach_narration_V1.wav')
OUT_JSON = os.path.join(ROOT, 'audio/narration/FGW_Cyborg_Cockroach_V1_words.json')
SR = 48000

# Phrase anchors used by the picture (first word index, last word index inclusive), by sentence and sub-phrase.
PHRASES = [
    ('fire_needle', 'This', 'needle.'),
    ('person_remote', 'And', 'remote'),
    ('decides_shoots', 'decides', 'shoots.'),
    ('strapped_launcher', 'Scientists', 'cockroach,'),
    ('electrical_pulses', 'then', 'pulses'),
    ('steer_it', 'to', 'it.'),
    ('second_camera', 'A', 'camera,'),
    ('operator_watch', 'letting', 'position.'),
    ('lines_up_fire', 'Once', 'injector.'),
    ('demonstrated', 'They’ve', 'targets.'),
    ('plan_send', 'But', 'them'),
    ('beneath_buildings', 'beneath', 'medicine.'),
    ('trapped_crawling', 'So', 'you…'),
    ('closer', 'you', 'closer.'),
]


def decode():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def pauses(x, thr_db=-45.0, min_s=0.10, hop_s=0.005):
    hop, win = int(hop_s * SR), int(0.02 * SR)
    n = (len(x) - win) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2)) + 1e-12 for i in range(n)])
    quiet = 20 * np.log10(rms) < thr_db
    out, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            a, b = i * hop / SR, (j * hop + win) / SR
            if b - a >= min_s:
                out.append([round(a, 3), round(min(b, len(x) / SR), 3)])
            i = j
        else:
            i += 1
    return out


def main():
    x = decode()
    sf.write(OUT_WAV, x, SR, subtype='PCM_24')
    dur = len(x) / SR
    ps = pauses(x)
    sc = [w for w in json.load(open(SCRIBE))['words']
          if w['type'] == 'word' and not (w['text'].startswith('[') or w['text'].endswith(']'))]
    disp = locked_words()
    assert len(sc) == len(disp), (len(sc), len(disp))
    words = []
    for i, (w, d) in enumerate(zip(sc, disp)):
        assert norm(w['text']) == norm(d), (w['text'], d)
        words.append({'i': i, 'text': d, 'scribe': [w['start'], w['end']]})
    segs = align(load(TAKE), [norm(w) for w in disp])
    for w, (_, s0, s1) in zip(words, segs):
        w['sphinx'] = [round(s0, 3), round(s1, 3)]
        w['start'], w['end'] = s0, s1
    # snap to measured pause edges
    for p0, p1 in ps:
        for w in words:
            if abs(w['start'] - p1) <= 0.12:
                w['start'] = p1
            if abs(w['end'] - p0) <= 0.12 and w['start'] < p0:
                w['end'] = p0
    lead = [p for p in ps if p[0] <= 0.001]
    speech0 = lead[0][1] if lead else 0.0
    words[0]['start'] = max(words[0]['start'], speech0) if speech0 < 0.2 else words[0]['start']
    tail = [p for p in ps if p[1] >= dur - 0.01]
    speech1 = tail[-1][0] if tail else dur
    words[-1]['end'] = min(words[-1]['end'], speech1)
    for w in words:
        w['start'], w['end'] = round(w['start'], 3), round(w['end'], 3)
    phrases = []
    for key, a, b in PHRASES:
        ia = next(w['i'] for w in words if w['text'] == a and all(w['i'] > p['last'] for p in phrases[-1:]))
        ib = next(w['i'] for w in words if w['text'] == b and w['i'] >= ia)
        phrases.append({'key': key, 'first': ia, 'last': ib, 'start': words[ia]['start'], 'end': words[ib]['end'],
                        'text': ' '.join(w['text'] for w in words[ia:ib + 1])})
    meta = {
        'take': os.path.relpath(TAKE, ROOT), 'final_wav': os.path.relpath(OUT_WAV, ROOT), 'sample_rate': SR,
        'duration_s': round(dur, 4), 'speech_start_s': round(words[0]['start'], 3), 'speech_end_s': round(speech1, 3),
        'word_count': len(words), 'pauses': ps, 'words': words, 'phrases': phrases,
        'timing_source': 'PocketSphinx forced alignment of the locked words on the take, snapped to measured pause edges (RMS < -45 dBFS, >= 100 ms); ElevenLabs Scribe alignment kept per word as a cross-reference',
    }
    json.dump(meta, open(OUT_JSON, 'w'), indent=1, ensure_ascii=False)
    print(f'duration {dur:.3f} s, speech {meta["speech_start_s"]}-{meta["speech_end_s"]} s, {len(words)} words')
    for p in phrases:
        print(f"  {p['key']:18s} {p['start']:6.2f}-{p['end']:6.2f}  {p['text']}")
    print('pauses:', ps)


if __name__ == '__main__':
    main()

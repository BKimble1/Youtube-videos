"""Stitch the selected narration takes into one timeline and write the word timings the animation is cued from.

Each block is one whole take (no sentence surgery, no time-stretching), trimmed inside its leading/trailing silence
and placed after a gap chosen for the picture (a match cut, a landing, a road bend). Word times are the Scribe word
times of that take, shifted by the same offset.

Selection (tools/score_takes.py -> audio/narration/take_scores.json): every candidate whose transcript is complete
matches the script exactly, so the pick is the take nearest ~160 wpm with no long internal pause and a level close to
the others. b1_t4 and b3_t4 were not considered: Scribe merged their repeated text, so they are unverified.

Outputs: audio/narration/narration_v1.(wav|mp3), audio/narration/narration_edit_log.json,
audio/narration/narration_words.json, source/src/data/words.json, source/public/audio/narration.mp3.
"""
import json, os, subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAR = os.path.join(ROOT, 'audio/narration')
SR = 48000
LEAD = 0.30  # first word starts at ~0.4 s: the hop is already under way when the voice comes in
PRE, POST = 0.10, 0.22  # kept silence around the first/last word of a take
FADE = 0.010

# (block, take, gap before the block's first word, seconds after the previous block's last word)
PICKS = [
    ('b1', 'b1_t2_ftNV', None),
    ('b2', 'b2_t3_cZoF', 0.85),  # wheel-to-cutaway match cut
    ('b3', 'b3_t2_E0d5', 1.05),  # landing settles, road curves into the bend
    ('b4', 'b4_t2_u451', 0.80),  # out of the bend into the braking zone
    ('b5', 'b5_t3_F9MN', 0.80),  # back into a bend, window reveal
    ('b6', 'b6_t3_bVkI', 1.00),  # cut to the real clip
]
TAIL = 1.70  # landing / settle beat after the last word


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').copy()


def main():
    words = [w for w in json.load(open(os.path.join(NAR, 'scribe/candidates_words.json')))['words'] if w.get('type', 'word') == 'word']
    offs = {o['take'][:-4]: o for o in json.load(open(os.path.join(NAR, 'scribe/candidates_offsets.json')))}
    pieces, out_words, log = [], [], []
    cursor = LEAD  # where the next block's first word goes
    last_end = None
    for blk, take, gap in PICKS:
        o = offs[take]
        ws = [dict(w) for w in words if o['offset'] - 0.05 <= w['start'] <= o['offset'] + o['length']]
        for w in ws:
            w['start'] -= o['offset']
            w['end'] -= o['offset']
        x = decode(os.path.join(NAR, 'takes', take + '.mp3'))
        a = max(0.0, ws[0]['start'] - PRE)
        b = min(len(x) / SR, ws[-1]['end'] + POST)
        clip = x[int(a * SR):int(b * SR)].copy()
        n = int(FADE * SR)
        clip[:n] *= np.linspace(0, 1, n)
        clip[-n:] *= np.linspace(1, 0, n)
        first = ws[0]['start']
        t0 = cursor if last_end is None else last_end + gap
        place = t0 - (first - a)  # timeline time of clip sample 0
        pieces.append((place, clip))
        shift = place - a
        for i, w in enumerate(ws):
            out_words.append({'text': w['text'], 'start': round(w['start'] + shift, 3), 'end': round(w['end'] + shift, 3), 'block': blk, 'i': i})
        last_end = ws[-1]['end'] + shift
        log.append({'block': blk, 'take': take, 'take_range_s': [round(a, 3), round(b, 3)], 'placed_at_s': round(place, 3),
                    'first_word_s': round(first + shift, 3), 'last_word_end_s': round(last_end, 3), 'gap_before_s': gap})
    total = last_end + TAIL
    y = np.zeros(int(total * SR) + 1, dtype=np.float32)
    for place, clip in pieces:
        i = int(round(place * SR))
        y[i:i + len(clip)] += clip[:len(y) - i]
    os.makedirs(os.path.join(ROOT, 'source/src/data'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'source/public/audio'), exist_ok=True)
    wav = os.path.join(NAR, 'narration_v1.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s24le', wav], input=y.tobytes(), check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', os.path.join(NAR, 'narration_v1.mp3')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', os.path.join(ROOT, 'source/public/audio/narration.mp3')], check=True)
    meta = {'duration_s': round(total, 3), 'voice': 'ElevenLabs Test Voice kk5XaSLo2XAw0sKM98zU', 'model': 'eleven_v4', 'pieces': log}
    json.dump(meta, open(os.path.join(NAR, 'narration_edit_log.json'), 'w'), indent=1)
    data = {'duration': round(total, 3), 'words': out_words, 'blocks': log}
    json.dump(data, open(os.path.join(NAR, 'narration_words.json'), 'w'), indent=1)
    json.dump(data, open(os.path.join(ROOT, 'source/src/data/words.json'), 'w'), indent=1)
    spoken = sum(1 for _ in out_words)
    print(f'total {total:.2f} s, {spoken} words, {spoken / total * 60:.1f} wpm overall')
    for l in log:
        print(l)


if __name__ == '__main__':
    main()

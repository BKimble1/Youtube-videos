"""Stitch the V5 narration: the new hook and attribution takes plus the V2 takes, with redundant sentences removed.

Same voice, model and method as V2 (tools/v2/stitch_narration_v2.py):
  1. each piece is a run of whole sentences from one take, cut at the middle of the silence around it
     (12 ms crossfades inside silence; no word, breath tail or consonant is cut),
  2. silences longer than LONG s inside a piece are shortened to KEEP s (a little tighter than V2),
  3. pieces are joined with the gaps in PIECES, after a LEAD s lead-in,
  4. every Scribe word is shifted by the same edits into one word list for the cue system.

Outputs: audio/v5/narration/narration_v5.(wav|mp3), audio/v5/narration_words_v5.json,
source/src/v5/data/narration_words_v5.json, source/public/v5/audio/narration_v5.mp3, and an edit log.
"""
import json, os, subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V2T = os.path.join(ROOT, 'audio/v2/narration/takes')
V2S = os.path.join(ROOT, 'audio/v2/narration/scribe')
V5T = os.path.join(ROOT, 'audio/v5/narration/takes')
V5S = os.path.join(ROOT, 'audio/v5/narration/scribe')
SR = 48000
LEAD = 0.40
LONG, KEEP = 0.52, 0.40
THRESH_DB = -40.0
XF = 0.012

# (block label, take, first words of the first kept sentence, first words of the sentence after the last kept one
#  or None for the end of the take, gap before this piece)
PIECES = [
    ('B00', 'hook_t1_FgC7', 'This robot jumps', None, 0.0),
    ('B02', 'b02_t4_r9wO', 'These are', 'One in Imatra', 0.40),
    ('B02', 'wit_t3_ayLP', 'One in Imatra', None, 0.30),
    ('B02', 'b02_t4_r9wO', 'Recycling old hardware', None, 0.34),
    ('B03', 'b03_t4_GFQD', 'Blame a reply', None, 0.36),
    ('B04', 'b04_t2_wIsD', 'Now the hard', None, 0.36),
    ('B05', 'b05_t2_ukBU', 'But a simulator', None, 0.36),
    ('B06', 'b06_t4_1LdQ', 'So what does', None, 0.36),
    ('B07', 'b07_t1_2eO2', 'So why is', 'Does retiring hardware', 0.40),
    ('B07', 'b07_t1_2eO2', 'These robots didn\'t', None, 0.30),
]


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').copy()


def norm(s):
    return ''.join(c for c in s.lower().replace('’', "'") if c.isalnum() or c == "'")


def take_words(name):
    if name.startswith(('hook_', 'wit_')):
        offs = {o['take'][:-4]: o for o in json.load(open(os.path.join(V5S, 'candidates_offsets_v5.json')))}
        o = offs[name]
        ws = json.load(open(os.path.join(V5S, 'candidates_words_v5.json')))['words']
        out = [dict(w, start=round(w['start'] - o['offset'], 3), end=round(w['end'] - o['offset'], 3)) for w in ws
               if w.get('type', 'word') == 'word' and o['offset'] - 0.05 <= w['start'] <= o['offset'] + o['length']]
        return os.path.join(V5T, name + '.mp3'), out
    sc = json.load(open(os.path.join(V2S, name + '.json')))
    ws = [w for w in sc['words'] if w['type'] == 'word' and w['text'].strip() not in ('—', '-', '–')]
    return os.path.join(V2T, name + '.mp3'), ws


def find(ws, phrase):
    want = [norm(p) for p in phrase.split()]
    for i in range(len(ws) - len(want) + 1):
        if all(norm(ws[i + k]['text']) == w for k, w in enumerate(want)):
            return i
    raise SystemExit(f'phrase not found: {phrase}')


def silences(x, min_len=0.25):
    hop = int(SR * 0.01)
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    quiet = 20 * np.log10(rms) < THRESH_DB
    out, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * 0.01 >= min_len:
                out.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return out


def splice(x, cuts):
    """Remove sample ranges (inside silence) with XF crossfades; return audio and a time-shift function."""
    if not cuts:
        return x, (lambda t: t)
    n = int(SR * XF)
    pieces, pos = [], 0
    for s, e in cuts:
        pieces.append(x[pos:s]); pos = e
    pieces.append(x[pos:])
    y = pieces[0]
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    for p in pieces[1:]:
        y = np.concatenate([y[:-n], y[-n:] * (1 - ramp) + p[:n] * ramp, p[n:]])

    def shift(t):
        d = 0.0
        for s, e in cuts:
            if t * SR > s:
                d += (e - s) / SR + XF
        return t - d
    return y, shift


def main():
    out, words, log = [np.zeros(int(SR * LEAD), dtype=np.float32)], [], []
    t = LEAD
    for block, name, first, after, gap in PIECES:
        path, ws = take_words(name)
        x = decode(path)
        i0 = find(ws, first)
        i1 = find(ws, after) if after else len(ws)
        # cut points: middle of the silence before the first kept word and after the last kept word
        a = 0 if i0 == 0 else int(SR * (ws[i0 - 1]['end'] + ws[i0]['start']) / 2)
        b = len(x) if i1 >= len(ws) else int(SR * (ws[i1 - 1]['end'] + ws[i1]['start']) / 2)
        if i0 == 0:
            a = max(0, int(SR * (ws[0]['start'] - 0.06)))  # trim the take's leading silence
        y = x[a:b].copy()
        kept = [dict(w, start=w['start'] - a / SR, end=min(w['end'], b / SR) - a / SR) for w in ws[i0:i1]]
        # shorten long internal silences (not the head or tail of the piece)
        cuts = []
        for s, e in silences(y):
            if s == 0 or e >= len(y) - int(SR * 0.05):
                continue
            dur = (e - s) / SR
            if dur > LONG:
                c = int((dur - KEEP) * SR)
                mid = (s + e) // 2
                cuts.append((mid - c // 2, mid + c - c // 2))
        y, shift = splice(y, cuts)
        # trim the piece's trailing silence to 0.12 s so every join gap is the one set here
        tail = len(y)
        while tail > 0 and abs(y[tail - 1]) < 10 ** (THRESH_DB / 20):
            tail -= 1
        y = y[:min(len(y), tail + int(SR * 0.12))]
        head = 0
        while head < len(y) and abs(y[head]) < 10 ** (THRESH_DB / 20):
            head += 1
        head = max(0, head - int(SR * 0.03))
        y = y[head:]
        if gap > 0:
            out.append(np.zeros(int(SR * gap), dtype=np.float32)); t += gap
        fade = int(SR * 0.004)
        y[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        y[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
        for w in kept:
            s0 = shift(w['start']) - head / SR
            e0 = min(shift(w['end']) - head / SR, len(y) / SR)
            words.append({'text': w['text'], 'start': round(s0 + t, 3), 'end': round(e0 + t, 3), 'type': 'word', 'block': block})
        log.append({'block': block, 'take': name, 'from': first, 'until': after, 'start': round(t, 3), 'length': round(len(y) / SR, 3),
                    'take_range_s': [round(a / SR, 3), round(b / SR, 3)], 'shortened_silences': len(cuts)})
        out.append(y); t += len(y) / SR
    audio = np.concatenate(out)
    os.makedirs(os.path.join(ROOT, 'audio/v5/narration'), exist_ok=True)
    wav = os.path.join(ROOT, 'audio/v5/narration/narration_v5.wav')
    mp3 = os.path.join(ROOT, 'audio/v5/narration/narration_v5.mp3')
    for path, args in ((wav, ['-c:a', 'pcm_s24le']), (mp3, ['-c:a', 'libmp3lame', '-b:a', '192k'])):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', *args, path],
                       input=audio.tobytes(), check=True)
    pub = os.path.join(ROOT, 'source/public/v5/audio')
    os.makedirs(pub, exist_ok=True)
    subprocess.run(['cp', mp3, os.path.join(pub, 'narration_v5.mp3')], check=True)
    data = {'source': 'ElevenLabs Scribe word timings of the selected takes, shifted by the edits in narration_edit_log_v5.json',
            'voice': 'Test Voice kk5XaSLo2XAw0sKM98zU', 'model': 'eleven_v4', 'duration': round(len(audio) / SR, 3), 'words': words}
    for p in (os.path.join(ROOT, 'audio/v5/narration_words_v5.json'), os.path.join(ROOT, 'source/src/v5/data/narration_words_v5.json')):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        json.dump(data, open(p, 'w'), indent=0)
    json.dump({'lead': LEAD, 'long': LONG, 'keep': KEEP, 'pieces': log},
              open(os.path.join(ROOT, 'audio/v5/narration/narration_edit_log_v5.json'), 'w'), indent=1)
    print(f'narration_v5: {len(audio) / SR:.2f} s, {len(words)} words')
    for b in log:
        print(b['block'], b['take'], 'start', b['start'], 'len', b['length'], 'cuts', b['shortened_silences'])


if __name__ == '__main__':
    main()

"""Stitch the V2 narration from the selected Test Voice takes and remap the Scribe word timings.

What it does, deterministically:
  1. decodes each selected take (48 kHz mono float),
  2. shortens only the long silences inside a take (> LONG s below -40 dBFS) to KEEP s, cutting in the
     middle of the silence with 12 ms crossfades, so no consonant, breath tail or word is touched,
  3. joins blocks with the gaps in GAPS and a lead-in of LEAD s (the hook's first sound lands before speech),
  4. shifts every Scribe word by the same edits and writes one word list for the cue system.

Outputs: audio/v2/narration/narration_v2.(wav|mp3), audio/v2/narration_words_v2.json,
source/src/v2/data/narration_words_v2.json, source/public/v2/audio/narration_v2.mp3, and an edit log.
"""
import json, os, subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TAKES = os.path.join(ROOT, 'audio/v2/narration/takes')
SCRIBE = os.path.join(ROOT, 'audio/v2/narration/scribe')
SR = 48000

SELECT = ['b01_t4_byVm', 'b02_t4_r9wO', 'b03_t4_GFQD', 'b04_t2_wIsD', 'b05_t2_ukBU', 'b06_t4_1LdQ', 'b07_t1_2eO2']
GAPS = [0.45, 0.40, 0.40, 0.40, 0.40, 0.45]   # silence added after blocks 1..6 (each take keeps its own tail)
LEAD = 0.50                                   # seconds before the first word
LONG, KEEP = 0.62, 0.48                       # silences longer than LONG are shortened to KEEP
THRESH_DB = -40.0


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').copy()


def silences(x, min_len=0.25):
    """Regions where a 10 ms RMS stays below THRESH_DB for at least min_len seconds."""
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


def shorten(x, words):
    """Shorten long internal silences; return new audio, shifted words and the edit list."""
    xf = 0.012
    edits = []
    for a, b in silences(x):
        if a == 0 or b >= len(x) - int(SR * 0.05):
            continue  # leave the head and the tail alone
        dur = (b - a) / SR
        if dur > LONG:
            cut = int((dur - KEEP) * SR)
            mid = (a + b) // 2
            edits.append((mid - cut // 2, mid + cut - cut // 2))
    if not edits:
        return x, words, []
    pieces, pos = [], 0
    n = int(SR * xf)
    for s, e in edits:
        pieces.append(x[pos:s]); pos = e
    pieces.append(x[pos:])
    y = pieces[0]
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    for p in pieces[1:]:
        y = np.concatenate([y[:-n], y[-n:] * (1 - ramp) + p[:n] * ramp, p[n:]])
    removed = [(s / SR, (e - s) / SR + 0.0) for s, e in edits]
    # each crossfade overlaps n samples, which also shortens the audio
    def shift(t):
        d = 0.0
        for s, r in removed:
            if t > s:
                d += r + xf
        return t - d
    w2 = [dict(w, start=round(shift(w['start']), 3), end=round(shift(w['end']), 3)) for w in words]
    return y, w2, [(round(s, 3), round(r + xf, 3)) for s, r in removed]


def main():
    out, words, log, t = [], [], [], 0.0
    lead = np.zeros(int(SR * LEAD), dtype=np.float32)
    out.append(lead); t += LEAD
    for k, name in enumerate(SELECT):
        x = decode(os.path.join(TAKES, name + '.mp3'))
        sc = json.load(open(os.path.join(SCRIBE, name + '.json')))
        ws = [w for w in sc['words'] if w['type'] == 'word' and w['text'].strip() not in ('—', '-', '–')]
        y, ws2, edits = shorten(x, ws)
        block = name[:3].upper()
        for w in ws2:
            words.append({'text': w['text'], 'start': round(w['start'] + t, 3), 'end': round(min(w['end'], len(y) / SR) + t, 3),
                          'type': 'word', 'block': block})
        log.append({'block': block, 'take': name, 'start': round(t, 3), 'length': round(len(y) / SR, 3),
                    'original_length': round(len(x) / SR, 3), 'shortened_silences': edits})
        out.append(y); t += len(y) / SR
        if k < len(GAPS):
            g = np.zeros(int(SR * GAPS[k]), dtype=np.float32)
            out.append(g); t += GAPS[k]
    audio = np.concatenate(out)
    wav = os.path.join(ROOT, 'audio/v2/narration/narration_v2.wav')
    mp3 = os.path.join(ROOT, 'audio/v2/narration/narration_v2.mp3')
    for path, args in ((wav, ['-c:a', 'pcm_s24le']), (mp3, ['-c:a', 'libmp3lame', '-b:a', '192k'])):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', *args, path],
                       input=audio.tobytes(), check=True)
    pub = os.path.join(ROOT, 'source/public/v2/audio')
    os.makedirs(pub, exist_ok=True)
    subprocess.run(['cp', mp3, os.path.join(pub, 'narration_v2.mp3')], check=True)
    data = {'source': 'ElevenLabs Scribe word timings of the selected takes, shifted by the edits in narration_edit_log_v2.json',
            'voice': 'Test Voice kk5XaSLo2XAw0sKM98zU', 'model': 'eleven_v4', 'duration': round(len(audio) / SR, 3), 'words': words}
    for p in (os.path.join(ROOT, 'audio/v2/narration_words_v2.json'), os.path.join(ROOT, 'source/src/v2/data/narration_words_v2.json')):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        json.dump(data, open(p, 'w'), indent=0)
    json.dump({'select': SELECT, 'gaps': GAPS, 'lead': LEAD, 'long': LONG, 'keep': KEEP, 'blocks': log},
              open(os.path.join(ROOT, 'audio/v2/narration/narration_edit_log_v2.json'), 'w'), indent=1)
    print(f'narration_v2: {len(audio) / SR:.2f} s, {len(words)} words')
    for b in log:
        print(b['block'], b['take'], 'start', b['start'], 'len', b['length'], 'cuts', len(b['shortened_silences']),
              'saved %.2f' % (b['original_length'] - b['length']))


if __name__ == '__main__':
    main()

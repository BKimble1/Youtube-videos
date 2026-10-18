"""Score every narration take against the script, from the Scribe words of the concatenated candidates.

For each take: does the transcript match the block word-for-word, speaking rate (words per minute between the first
and last word), the longest pause, loudness (RMS of voiced audio) and peak. Writes audio/narration/take_scores.json.
Takes whose transcript is incomplete (Scribe merged repeated text) are marked unscored, not rejected on content.
"""
import json, os, re, subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAR = os.path.join(ROOT, 'audio/narration')
SR = 48000


def norm(s):
    return ''.join(c for c in s.lower().replace('’', "'") if c.isalnum() or c in "' ").split()


def blocks():
    text = open(os.path.join(ROOT, 'script/script_v1.md')).read()
    out = {}
    for m in re.finditer(r'^## (B\d) .*?\n\n> (.*?)$', text, re.M | re.S):
        out[m.group(1).lower()] = m.group(2).strip()
    return out


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').copy()


def main():
    words = json.load(open(os.path.join(NAR, 'scribe/candidates_words.json')))['words']
    words = [w for w in words if w.get('type', 'word') == 'word']
    offs = json.load(open(os.path.join(NAR, 'scribe/candidates_offsets.json')))
    script = blocks()
    res = []
    for o in offs:
        name = o['take'][:-4]
        blk = name.split('_')[0]
        ws = [w for w in words if o['offset'] - 0.05 <= w['start'] <= o['offset'] + o['length']]
        got = [t for w in ws for t in norm(w['text'])]
        want = norm(script[blk])
        complete = all(w['end'] - w['start'] < 3.0 for w in ws) and len(got) >= len(want) - 2
        match = got == want
        span = (ws[-1]['end'] - ws[0]['start']) if ws else 0
        gaps = [b['start'] - a['end'] for a, b in zip(ws, ws[1:])]
        x = decode(os.path.join(NAR, 'takes', o['take']))
        fr = x[: len(x) // 480 * 480].reshape(-1, 480)
        rms = np.sqrt((fr ** 2).mean(1))
        voiced = rms[rms > 10 ** (-40 / 20)]
        res.append({
            'take': name, 'block': blk, 'complete_transcript': complete, 'exact_match': match,
            'diff': None if match else {'got': ' '.join(got), 'want': ' '.join(want)} if complete else 'transcript incomplete',
            'words': len(want), 'speech_span_s': round(span, 2), 'wpm': round(len(want) / span * 60, 1) if span else None,
            'max_gap_s': round(max(gaps), 2) if gaps else None,
            'lead_s': round(ws[0]['start'] - o['offset'], 2) if ws else None,
            'voiced_rms_db': round(float(20 * np.log10(np.sqrt((voiced ** 2).mean()))), 1),
            'peak_dbfs': round(float(20 * np.log10(np.abs(x).max())), 2),
            'duration_s': round(len(x) / SR, 2),
        })
    json.dump(res, open(os.path.join(NAR, 'take_scores.json'), 'w'), indent=1)
    for r in res:
        print(f"{r['take']:12s} match={str(r['exact_match']):5s} complete={str(r['complete_transcript']):5s} wpm={r['wpm']} "
              f"span={r['speech_span_s']} maxgap={r['max_gap_s']} rms={r['voiced_rms_db']} peak={r['peak_dbfs']}")
        if r['diff'] and r['complete_transcript']:
            print('   got :', r['diff']['got'])
            print('   want:', r['diff']['want'])


if __name__ == '__main__':
    main()

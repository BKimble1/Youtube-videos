# Measure every narration take from the Scribe word timings + waveform (nobody can listen here):
# words/min over speech, longest internal pauses, loudness, peak, and pitch-free emphasis proxies.
import json, subprocess, numpy as np, soundfile as sf, pyloudnorm as pyln, io
offs = json.load(open('audio/narration/candidates_offsets.json'))
words = json.load(open('audio/narration/candidates_words.json'))['words']
words = [w for w in words if w.get('type', 'word') == 'word']
out = {}
for o in offs:
    a, b = o['offset'] - 0.5, o['offset'] + o['dur'] + 0.5
    ws = [dict(w, start=w['start'] - o['offset'], end=w['end'] - o['offset']) for w in words if a <= w['start'] < b]
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', 'audio/narration/takes/' + o['take'], '-f', 'wav', '-ac', '1', '-ar', '48000', '-'])
    y, sr = sf.read(io.BytesIO(raw))
    lufs = pyln.Meter(sr).integrated_loudness(y)
    gaps = sorted([(round(ws[i + 1]['start'] - ws[i]['end'], 2), ws[i]['text']) for i in range(len(ws) - 1)], reverse=True)[:4]
    speech = ws[-1]['end'] - ws[0]['start']
    out[o['take']] = {'n_words': len(ws), 'speech_s': round(speech, 2), 'wpm': round(len(ws) / speech * 60, 1), 'lufs': round(lufs, 1),
                      'peak_dbfs': round(20 * np.log10(np.abs(y).max()), 2), 'lead_s': round(ws[0]['start'], 2), 'tail_s': round(o['dur'] - ws[-1]['end'], 2), 'longest_gaps': gaps}
    print(o['take'], out[o['take']])
json.dump(out, open('audio/narration/take_measurements.json', 'w'), indent=1)

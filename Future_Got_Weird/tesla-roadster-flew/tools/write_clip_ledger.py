#!/usr/bin/env python3
"""Write footage/CLIP_LEDGER.md: source recordings, slot clips, and the exact source in/out of every footage shot
in the Short (source/src/short/ShortMain.tsx) and the companion (source/src/data/companion_shots.json)."""
import hashlib, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man = json.load(open(os.path.join(ROOT, 'source/src/data/footage.json')))['slots']
cuts = {**json.load(open(os.path.join(ROOT, 'footage/cuts_short.json'))), **json.load(open(os.path.join(ROOT, 'footage/cuts_companion.json')))}
RELEASE = {'rec_224730.mp4': (645945678, 'Screen.Recording.2026-10-15.224730.mp4'), 'rec_224911.mp4': (645946444, 'Screen.Recording.2026-10-15.224911.mp4'),
           'rec_225050.mp4': (645946790, 'Screen.Recording.2026-10-15.225050.mp4'), 'rec_225218.mp4': (645947394, 'Screen.Recording.2026-10-15.225218.mp4'),
           'rec_225340.mp4': (645947843, 'Screen.Recording.2026-10-15.225340.mp4')}

def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()

def mmss(t):
    return f'{int(t // 60)}:{t % 60:05.2f}'

def src_span(slot, offset, dur):
    c = cuts[slot]; s = c['in'] + offset
    return os.path.basename(c['file']), s, s + dur

L = ['# Clip ledger: official Tesla footage in the Short and the companion', '',
     "**Source.** Tesla's Roadster reveal livestream replay, Oct 15, 2026: https://x.com/Tesla/status/2110788059008819215.",
     "The owner captured five screen recordings of it and uploaded them as assets of the **draft** release",
     "`roadster-footage-2026-10-15` in BKimble1/Youtube-videos (release id 414488220, left as a draft). They were",
     'downloaded with authenticated read access on 16 Oct 2026. All times below are positions **inside those recordings**.',
     "The recordings' own replay timecodes are not known.", '',
     '**Rights:** Tesla\'s footage, used in short excerpts with original commentary and animation. The owner confirms rights.',
     'Content ID has not been observed; it only appears in YouTube Studio during upload.', '',
     '## Source recordings', '', '| Local name | Release asset (id) | Duration | SHA-256 (first 16) | Contents |', '|---|---|---|---|---|']
CONTENTS = {'rec_224730.mp4': 'reveal film; first ramp run (climb, upside-down hang, close-up from below); second run (launch, roll, landing; side + aerial angles). **No audio** (silent track)',
            'rec_224911.mp4': 'drive-in; hop over the Semi and a row of Teslas (front, side, replay angles); has audio',
            'rec_225050.mp4': 'car on stage, doors open, people around it (no Optimus visible); not used',
            'rec_225218.mp4': 'Musk on stage; 0-60 run with on-screen timer stopping at 01.00; "0-60mph 1 sec" card',
            'rec_225340.mp4': 'Musk on stage; launch from the start box; not used'}
import subprocess
for name, (aid, orig) in RELEASE.items():
    p = os.path.join(ROOT, 'footage/release', name)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
    L.append(f'| `{name}` | `{orig}` ({aid}) | {d:.1f} s | `{sha(p)[:16]}` | {CONTENTS[name]} |')
L += ['', '## Slot clips (cut by tools/ingest_footage.py)', '', '| Slot | Recording | Slot `in` | Clip span | What it shows |', '|---|---|---|---|---|']
for slot, c in cuts.items():
    if slot.startswith('_'): continue
    clip = os.path.join(ROOT, 'source/public/footage', man[slot]['file'])
    cd = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', clip], capture_output=True, text=True).stdout)
    start = c['in'] - man[slot]['in']
    L.append(f"| {slot} | `{os.path.basename(c['file'])}` | {mmss(c['in'])} | {mmss(start)}–{mmss(start + cd)} | {man[slot]['label']} |")
L += ['', '## Short (9:16): footage shots as rendered', '', '| Shot | Short time | Slot | Recording | Source in → out |', '|---|---|---|---|---|']
tsx = open(os.path.join(ROOT, 'source/src/short/ShortMain.tsx')).read()
for m in re.finditer(r"\{id: '(sh\d+)', a: ([\d.]+), b: ([\d.]+), kind: 'foot', slot: '(\w+)'(?:, offset: (-?[\d.]+))?", tsx):
    sid, a, b, slot, off = m.group(1), float(m.group(2)), float(m.group(3)), m.group(4), float(m.group(5) or 0)
    f, s0, s1 = src_span(slot, off, b - a)
    L.append(f'| {sid} | {a:.2f}–{b:.2f} | {slot} | `{f}` | {mmss(s0)} → {mmss(s1)} |')
L += ['', '## Companion (16:9): footage shots as rendered', '', '| Shot | Companion time | Slot | Recording | Source in → out |', '|---|---|---|---|---|']
for s in json.load(open(os.path.join(ROOT, 'source/src/data/companion_shots.json')))['shots']:
    if s['kind'] != 'foot': continue
    f, s0, s1 = src_span(s['slot'], s.get('offset', 0), s['b'] - s['a'])
    L.append(f"| {s['id']} | {mmss(s['a'])}–{mmss(s['b'])} | {s['slot']} | `{f}` | {mmss(s0)} → {mmss(s1)} |")
open(os.path.join(ROOT, 'footage/CLIP_LEDGER.md'), 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[-40:]))

#!/usr/bin/env python3
"""Measures every caption line of the V1 film at its real size (Montserrat ExtraBold 800, 68 px, 15 px outline) by decoding the bundled WOFF into a TTF for Pillow.
Reads source/src/film/timeline.ts (the CUES table). Usage: python3 tools/measure_captions_v1.py -> prints lines wider than the 960 px safe width and a summary."""
import io, re, struct, sys, zlib, os
from PIL import ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
w = open(f'{ROOT}/source/node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff', 'rb').read()
flavor, length, n = struct.unpack('>4xIIH', w[:14])[0:3] if False else (w[4:8], struct.unpack('>I', w[8:12])[0], struct.unpack('>H', w[12:14])[0])
tabs = []
for i in range(n):
    tag, off, clen, olen, csum = struct.unpack('>4sIIII', w[44 + 20 * i:64 + 20 * i])
    d = w[off:off + clen]
    tabs.append((tag, zlib.decompress(d) if clen < olen else d, csum))
sr = 1 << (n.bit_length() - 1); es = sr.bit_length() - 1
out = io.BytesIO(); out.write(flavor + struct.pack('>HHHH', n, sr * 16, es, n * 16 - sr * 16))
pos = 12 + 16 * n; ent = b''; body = b''
for tag, data, csum in sorted(tabs):
    ent += struct.pack('>4sIII', tag, csum, pos + len(body), len(data)); body += data + b'\0' * ((4 - len(data) % 4) % 4)
ttf = out.getvalue() + ent + body
open('/tmp/montserrat800.ttf', 'wb').write(ttf)
font = ImageFont.truetype('/tmp/montserrat800.ttf', 68)
txt = open(f'{ROOT}/source/src/film/timeline.ts').read()
cues = re.findall(r"\{a: ([^,]+), b: ([^,]+), lines: (\[\[.*?\]\])(?:, lane: '\w+')?\},", txt)
bad, widest = [], (0, '')
for a, b, lines in cues:
    segs = re.findall(r"\[\s*'((?:[^'\\]|\\.)*)'(?:,\s*true)?\s*\]", lines)
    # rebuild lines: split on the '], [' boundaries between line arrays
    ln_arrays = re.findall(r"\[\[(.*?)\]\]|\],\s*\[\[(.*?)\]\]", lines)
    parts = re.split(r"\]\],\s*\[\[", lines.strip('[]'))
    for p in parts:
        t = ''.join(re.findall(r"'((?:[^'\\]|\\.)*)'", p))
        wpx = font.getlength(t) + 15
        if wpx > widest[0]: widest = (wpx, t)
        if wpx > 960: bad.append((round(wpx), t))
print(f'{len(cues)} cues; widest line {widest[0]:.0f}px "{widest[1]}"')
print('lines over 960 px:', bad or 'none')

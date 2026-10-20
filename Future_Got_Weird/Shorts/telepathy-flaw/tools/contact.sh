#!/bin/bash
# usage: tools/contact.sh <outdir> <comp> <frames comma list> [cols]  -> <outdir>/sheet.png with frame labels
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT/source"
OUT="$ROOT/$1"; COMP="$2"; FR="$3"; COLS="${4:-6}"
rm -rf "$OUT"; mkdir -p "$OUT"
node scripts/frames.mjs "$OUT" "$COMP" "$FR" >/dev/null 2>&1
python3 - "$OUT" "$FR" "$COLS" <<'P'
import sys, glob
from PIL import Image, ImageDraw
out, fr, cols = sys.argv[1], sys.argv[2].split(','), int(sys.argv[3])
tw, th = 270, 480
rows = (len(fr)+cols-1)//cols
S = Image.new('RGB', (tw*cols, (th+16)*rows), 'white')
d = ImageDraw.Draw(S)
for i, f in enumerate(fr):
    im = Image.open(glob.glob(f'{out}/*_{int(f):04d}.png')[0]).resize((tw, th))
    x, y = (i % cols)*tw, (i//cols)*(th+16)
    S.paste(im, (x, y+16)); d.text((x+3, y+2), f'f{f} {int(f)/30:.2f}s', fill='black')
S.save(f'{out}/sheet.png')
P

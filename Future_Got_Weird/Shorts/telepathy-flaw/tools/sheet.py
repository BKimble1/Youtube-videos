"""Tile PNG stills into one contact sheet. Usage: python3 tools/sheet.py out.png in1.png in2.png ... [--cols N]"""
import sys
from PIL import Image
args = sys.argv[1:]
cols = None
if '--cols' in args:
    i = args.index('--cols'); cols = int(args[i + 1]); args = args[:i] + args[i + 2:]
out, files = args[0], args[1:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
cols = cols or len(ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (w * cols, h * rows), 'white')
for i, im in enumerate(ims):
    sheet.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
sheet.save(out)
print(out, sheet.size)

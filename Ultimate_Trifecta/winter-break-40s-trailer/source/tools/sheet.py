import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; out = sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
pat = sys.argv[4] if len(sys.argv) > 4 else "*.png"
fs = sorted(glob.glob(os.path.join(d, pat)))
W, H = 480, 270
rows = (len(fs) + cols - 1) // cols
s = Image.new("RGB", (W * cols, H * rows), (20, 20, 20))
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((W, H))
    ImageDraw.Draw(im).text((5, 5), os.path.basename(f)[:-4], fill=(255, 255, 0))
    s.paste(im, ((i % cols) * W, (i // cols) * H))
s.save(out, quality=86)
print(out, len(fs))

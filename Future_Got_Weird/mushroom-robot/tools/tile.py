import sys, re
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
cv = Image.new('RGB', (cols * w, rows * h), (10, 10, 10)); d = ImageDraw.Draw(cv)
for k, (im, f) in enumerate(zip(ims, files)):
    x, y = (k % cols) * w, (k // cols) * h
    cv.paste(im, (x, y)); fr = int(re.search(r'f(\d+)', f.split('/')[-1]).group(1))
    d.rectangle([x, y, x + 120, y + 22], fill=(0, 0, 0)); d.text((x + 5, y + 5), f'{fr}  {fr/30:.2f}s', fill=(255, 230, 0))
cv.save(out); print(out, cv.size)

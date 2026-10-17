# Phone-size check: frames at 360x640 with the Shorts interface zones overlaid (approximate, in 1080x1920 units):
# top controls y < 190; right action rail x > 930, y 1050-1650; title/channel/related-video area y > 1580.
# python3 tools/qa_phone_zones.py <mp4> <out.jpg> t1 t2 ...
import subprocess, sys
from PIL import Image, ImageDraw
mp4, out, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3:]]
W, H = 360, 640
k = W / 1080
tiles = []
for t in ts:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    im = Image.frombytes('RGB', (W, H), raw).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for (x0, y0, x1, y1) in [(0, 0, 1080, 190), (930, 1050, 1080, 1650), (0, 1580, 1080, 1920)]:
        d.rectangle([x0 * k, y0 * k, x1 * k, y1 * k], fill=(255, 40, 40, 70), outline=(255, 60, 60, 200))
    im = Image.alpha_composite(im, ov).convert('RGB')
    dd = ImageDraw.Draw(im); dd.rectangle([0, H - 16, 60, H], fill=(0, 0, 0)); dd.text((3, H - 14), f'{t:.2f}s', fill=(255, 255, 0))
    tiles.append(im)
cols = min(6, len(tiles)); rows = (len(tiles) + cols - 1) // cols
S = Image.new('RGB', (W * cols, H * rows), (50, 50, 50))
for i, im in enumerate(tiles):
    S.paste(im, ((i % cols) * W, (i // cols) * H))
S.save(out, quality=85)
print(out)

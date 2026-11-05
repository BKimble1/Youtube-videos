#!/bin/bash
# Resumable render: the composition as a JPEG frame sequence (quality 95, the same frames Remotion encodes itself), in
# chunks that survive an interruption (a chunk whose frames all exist is skipped), then one x264 encode with the
# channel settings (CRF 16, slow, yuv420p, BT.709) and the mix as AAC 320 kb/s.
# usage: [COMP=BrainDoomV1] tools/render_resilient.sh <mix_name> <out.mp4> [frames_dir]
set -euo pipefail
MIX=${1:?mix name, e.g. mix_v3}
OUT=$(realpath -m "${2:?output mp4}")
EP="$(cd "$(dirname "$0")/.." && pwd)"
FR=$(realpath -m "${3:-$EP/source/out/frames_$MIX}")
TOTAL=$(python3 -c "import json;print(json.load(open('$EP/source/src/data/timeline.json'))['frames'])")
CH=62
COMP=${COMP:-BrainDoomV1}
mkdir -p "$FR"
cd "$EP/source"
for ((a = 0; a < TOTAL; a += CH)); do
  b=$((a + CH - 1)); ((b >= TOTAL)) && b=$((TOTAL - 1))
  missing=0
  for ((f = a; f <= b; f++)); do [[ -s "$FR/element-$(printf %03d $f).jpeg" || -s "$FR/element-$f.jpeg" || -s "$FR/element-$(printf %02d $f).jpeg" ]] || { missing=1; break; }; done
  if ((missing)); then
    echo "render frames $a-$b"
    npx remotion render src/index.ts "$COMP" "$FR" --sequence --frames=$a-$b --image-format=jpeg --jpeg-quality=95 \
      --props='{"audio":false,"captions":true}' --concurrency=3 --log=error
  fi
done
# Remotion pads each chunk's names to the digits of that chunk's last frame: normalise every name to 3 digits
python3 - "$FR" <<'PY'
import os, re, sys
d = sys.argv[1]
for n in os.listdir(d):
    m = re.fullmatch(r'element-(\d+)\.jpeg', n)
    if m and len(m.group(1)) != 3:
        os.replace(os.path.join(d, n), os.path.join(d, 'element-%03d.jpeg' % int(m.group(1))))
PY
n=$(ls "$FR"/element-*.jpeg | wc -l)
[[ $n -eq $TOTAL ]] || { echo "only $n of $TOTAL frames"; exit 1; }
ffmpeg -v error -y -framerate 30 -i "$FR/element-%03d.jpeg" -i "$EP/source/public/audio/$MIX.wav" \
  -map 0:v -map 1:a -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart \
  -c:a aac -b:a 320k -ar 48000 -shortest "$OUT"
echo "encoded -> $OUT"

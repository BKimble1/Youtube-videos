#!/usr/bin/env bash
# THE LAST CHOICE R2 — robust full render: one bundle (a fixed snapshot of the source), the film in chunks of CHUNK
# frames (a failed chunk is re-rendered alone; finished chunks are kept), then concat + the R2 mix as AAC.
#   tools/r2/render_chunks.sh <out.mp4> [comp]     env: CHUNK (1000), CONC (3), SKIP_MIX=1 (reuse source/public/audio/r2_mix.wav)
# The mix (supplied music) and the output are Git-ignored.
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT=$PWD
OUT=${1:?out.mp4}; COMP=${2:-LastChoiceR2}
CHUNK=${CHUNK:-1000}; CONC=${CONC:-3}
WORK=${WORK:-$ROOT/exports/.chunks_$(basename "$OUT" .mp4)}
BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p "$WORK"
if [ -z "${SKIP_MIX:-}" ]; then
  (cd source && node ../tools/r2/collect_timing_r2.mjs)
  python3 tools/r2/mix_r2.py | tail -1
fi
if [ ! -f "$WORK/bundle/index.html" ]; then
  (cd source && npx remotion bundle src/index.ts --out-dir="$WORK/bundle" --public-dir=public >/dev/null)
fi
FR=$(cd source && node -e "
const {selectComposition}=require('@remotion/renderer');
selectComposition({serveUrl:'$WORK/bundle',id:'$COMP',inputProps:{audio:false},browserExecutable:'$BROWSER'}).then(c=>{console.log(c.durationInFrames);process.exit(0)});")
echo "frames $FR"
i=0
for ((a=0; a<FR; a+=CHUNK)); do
  b=$((a+CHUNK-1)); [ $b -ge $FR ] && b=$((FR-1))
  f=$(printf "%s/c%02d.mp4" "$WORK" $i)
  if [ ! -s "$f" ]; then
    echo "chunk $i: frames $a-$b"
    (cd source && npx remotion render "$WORK/bundle" "$COMP" "$f.part.mp4" --frames=$a-$b --muted --props='{"audio":false}' \
      --crf=18 --x264-preset=medium --color-space=bt709 --concurrency=$CONC --timeout=300000 \
      --browser-executable=$BROWSER --log=error) && mv "$f.part.mp4" "$f"
  fi
  echo "file '$f'" >> "$WORK/list.tmp"; i=$((i+1))
done
mv "$WORK/list.tmp" "$WORK/list.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$WORK/list.txt" -i source/public/audio/r2_mix.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,channels,sample_rate,nb_frames -of json "$OUT"
echo "done: $OUT"

#!/usr/bin/env bash
# Finalize a render: fast-start MP4 (no re-encode), then measure and record technical QA.
# Usage: bash tools/finalize.sh <input.mp4> <output.mp4>
set -euo pipefail
in="$1"; out="$2"
root="$(cd "$(dirname "$0")/.." && pwd)"
ffmpeg -hide_banner -loglevel error -y -i "$in" -map 0 -c copy -movflags +faststart "$out"
name="$(basename "$out" .mp4)"
mkdir -p "$root/qa"
{
  echo "# Technical QA: $name"; echo
  echo '## ffprobe'; echo '```'
  ffprobe -v error -show_entries stream=index,codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,sample_rate,channels,bit_rate -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 "$out"
  echo '```'; echo
  echo '## Fast start (moov before mdat)'; echo '```'
  python3 - "$out" <<'PY'
import struct, sys
f = open(sys.argv[1], 'rb'); order = []
while True:
    h = f.read(8)
    if len(h) < 8: break
    size, typ = struct.unpack('>I4s', h); typ = typ.decode('latin1')
    if size == 1: size = struct.unpack('>Q', f.read(8))[0]; f.seek(size - 16, 1)
    else: f.seek(size - 8, 1)
    order.append(typ)
    if size == 0: break
print('top-level atoms:', order); print('faststart:', order.index('moov') < order.index('mdat'))
PY
  echo '```'; echo
  echo '## Loudness (EBU R128, ffmpeg ebur128 with true peak)'; echo '```'
  ffmpeg -hide_banner -nostats -i "$out" -map 0:a -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p'
  echo '```'; echo
  echo '## Black frames (>=0.25 s) and frozen video (>=4 s)'; echo '```'
  ffmpeg -hide_banner -nostats -i "$out" -map 0:v -vf "blackdetect=d=0.25:pix_th=0.06,freezedetect=n=0.0005:d=4" -f null - 2>&1 | grep -E "black_start|freeze_start|freeze_duration" || echo "none detected"
  echo '```'; echo
  echo '## Decode check (full decode, errors only)'; echo '```'
  ffmpeg -hide_banner -v error -i "$out" -f null - 2>&1 | head -20 || true
  echo "decode finished"
  echo '```'
} > "$root/qa/tech_${name}.md"
echo "wrote $out and qa/tech_${name}.md"

#!/usr/bin/env python3
"""V4: mux a silent render with the final mix and write the delivery files and EXPORT_METADATA.json.

Usage: python3 tools/export.py <silent_video.mp4> <out_name.mp4>
  video is stream-copied (never re-encoded); audio is the 24-bit mix encoded to AAC 320 kb/s, 48 kHz;
  both are cut to exactly 28.000 s. Writes to exports/ and records ffprobe data and SHA-256 of every delivered file."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EX = ROOT / 'exports'
MIX = ROOT / 'audio' / 'v4' / 'mix' / 'FGW_TelepathyFlaw_V4_mix_48k.wav'


def sha(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def probe(p: Path) -> dict:
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size,bit_rate:stream=index,codec_name,codec_type,width,height,r_frame_rate,nb_frames,pix_fmt,sample_rate,channels,color_space,color_range,duration', '-of', 'json', str(p)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def main():
    src, name = Path(sys.argv[1]), sys.argv[2]
    EX.mkdir(exist_ok=True)
    out = EX / name
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-i', str(MIX), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', '28.000', '-movflags', '+faststart', str(out)], check=True)
    meta_p = EX / 'EXPORT_METADATA_V4.json'
    meta = json.load(open(meta_p)) if meta_p.exists() else {}
    meta[name] = {'ffprobe': probe(out), 'sha256': sha(out), 'bytes': out.stat().st_size, 'source_video': src.name}
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print(name, out.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()

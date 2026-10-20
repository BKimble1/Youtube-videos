#!/usr/bin/env python3
"""V6: mux a silent render with the APPROVED V4 mix (unchanged: no new audio of any kind) and write the delivery files and EXPORT_METADATA_V6.json.

Usage: python3 tools/export_v6.py <silent_video.mp4> <out_name.mp4>
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
MIX_SHA256 = '3948cadd8a79835a7592db38828c954eb9df8aa28c8fddad40d2d65fa891d192'  # the approved V4 mix, byte for byte


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
    assert sha(MIX) == MIX_SHA256, 'the approved V4 mix has changed'
    out = EX / name
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-i', str(MIX), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', '28.000', '-movflags', '+faststart', str(out)], check=True)
    # the audio stream, as delivered, must be bit-identical to the one in the approved V4 export
    ref = EX / 'FGW_TelepathyFlaw_V4_Review_1080x1920.mp4'
    md5 = lambda p: subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-map', '0:a:0', '-c', 'copy', '-f', 'md5', '-'], capture_output=True, text=True, check=True).stdout.strip()
    same = md5(out) == md5(ref) if ref.exists() else None
    meta_p = EX / 'EXPORT_METADATA_V6.json'
    meta = json.load(open(meta_p)) if meta_p.exists() else {}
    meta[name] = {'ffprobe': probe(out), 'sha256': sha(out), 'bytes': out.stat().st_size, 'source_video': src.name, 'mix_sha256': MIX_SHA256, 'audio_stream_identical_to_V4_export': same}
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print(name, out.stat().st_size, 'bytes', 'audio identical to V4 export:', same)


if __name__ == '__main__':
    main()

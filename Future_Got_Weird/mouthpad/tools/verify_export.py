#!/usr/bin/env python3
"""Delivery gate for a final export. Exits non-zero (and prints FAIL) unless the file is a true native render:

  1. ffprobe: video H.264, 1080 x 1920, SAR 1:1, 30/1 fps (r and avg), the expected frame count; audio AAC 48 kHz.
  2. Not an upscale: a native 1080 x 1920 vector render carries real detail above what a 512 x 910 picture can
     hold. The frame is shrunk to 512 x 910 and enlarged back; for a true 1080p render this round trip loses
     detail (PSNR well below 40 dB), while a 512 x 910 file that was enlarged to 1080 x 1920 survives it almost
     unchanged (PSNR typically above 45 dB). Checked on frames spread across the film.

usage: python3 tools/verify_export.py <file.mp4> [expected_frames] [report.json]
"""
import json, subprocess, sys

f = sys.argv[1]
want_frames = int(sys.argv[2]) if len(sys.argv) > 2 else None
out = sys.argv[3] if len(sys.argv) > 3 else None
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', f],
                               capture_output=True, text=True, check=True).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
a = next((s for s in pr['streams'] if s['codec_type'] == 'audio'), None)
checks = {
    'video codec h264': v['codec_name'] == 'h264',
    'width 1080': v['width'] == 1080,
    'height 1920': v['height'] == 1920,
    'sample aspect 1:1': v.get('sample_aspect_ratio', '1:1') in ('1:1', '0:1'),
    'r_frame_rate 30/1': v['r_frame_rate'] == '30/1',
    'avg_frame_rate 30/1': v['avg_frame_rate'] == '30/1',
    'audio aac': a is not None and a['codec_name'] == 'aac',
    'audio 48 kHz': a is not None and a['sample_rate'] == '48000',
}
if want_frames is not None:
    checks[f'{want_frames} frames'] = int(v.get('nb_read_frames', v.get('nb_frames', 0))) == want_frames

# not an upscale: shrink-and-enlarge round trip on frames across the film
dur = float(pr['format']['duration'])
psnrs = []
for k in range(8):
    t = dur * (k + 0.5) / 8
    r = subprocess.run(['ffmpeg', '-v', 'info', '-ss', f'{t:.3f}', '-i', f, '-frames:v', '1', '-filter_complex',
                        '[0:v]split[a][b];[b]scale=512:910:flags=area,scale=1080:1920:flags=bicubic[c];[a][c]psnr', '-f', 'null', '-'],
                       capture_output=True, text=True)
    line = [l for l in r.stderr.splitlines() if 'PSNR' in l and 'average:' in l]
    if line:
        psnrs.append(float(line[-1].split('average:')[1].split()[0].replace('inf', '99')))
checks['native detail (512x910 round-trip PSNR < 40 dB on every sampled frame)'] = bool(psnrs) and max(psnrs) < 40

report = {
    'file': f,
    'video': {k: v.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'sample_aspect_ratio', 'display_aspect_ratio', 'pix_fmt', 'r_frame_rate', 'avg_frame_rate', 'nb_frames', 'nb_read_frames', 'bit_rate']},
    'audio': {k: a.get(k) for k in ['codec_name', 'profile', 'sample_rate', 'channels', 'bit_rate']} if a else None,
    'duration_s': dur, 'size_bytes': int(pr['format']['size']),
    'roundtrip_psnr_db': psnrs, 'checks': checks, 'pass': all(checks.values()),
}
if out:
    json.dump(report, open(out, 'w'), indent=1)
for k, ok in checks.items():
    print(('PASS ' if ok else 'FAIL ') + k)
print(f"round-trip PSNR (dB): {', '.join(f'{p:.1f}' for p in psnrs)}")
if not report['pass']:
    print('FAIL: not a verified native 1080x1920 30 fps H.264/AAC export — do not deliver')
    sys.exit(1)
print('VERIFIED: native 1080x1920, 30 fps, H.264 + AAC')

#!/usr/bin/env python3
"""Footage intake for the U9 episode (real clips are evidence: never mirrored, re-timed or generated).

  python3 tools/ingest_footage.py probe                 # every file in footage/source/: SHA-256, duration, fps, size
  python3 tools/ingest_footage.py sheet FILE START DUR [FPS]
                                                        # numbered frame sheet of a window (footage/frames/), to pick
                                                        # in/out points, takeoff/landing frames and wheel positions
  python3 tools/ingest_footage.py cut FILE              # the two 4K crops used in the edit (opening, replay):
                                                        # source/public/footage/real_open.mp4, real_replay.mp4

The probe writes footage/footage_probe.json; the ledger (footage/CLIP_LEDGER.md) records which seconds are used where.
"""
import hashlib, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'footage/source')


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def probe():
    out = []
    for name in sorted(os.listdir(SRC)):
        p = os.path.join(SRC, name)
        if not os.path.isfile(p) or name.startswith('.'):
            continue
        j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', p], capture_output=True, text=True).stdout)
        v = next((s for s in j['streams'] if s['codec_type'] == 'video'), None)
        a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
        out.append({'file': name, 'sha256': sha(p), 'bytes': os.path.getsize(p), 'duration_s': float(j['format']['duration']),
                    'video': v and {'codec': v['codec_name'], 'w': v['width'], 'h': v['height'], 'r_frame_rate': v['r_frame_rate'], 'avg_frame_rate': v['avg_frame_rate']},
                    'audio': a and {'codec': a['codec_name'], 'sr': a.get('sample_rate'), 'ch': a.get('channels')}})
    json.dump(out, open(os.path.join(ROOT, 'footage/footage_probe.json'), 'w'), indent=1)
    for o in out:
        print(json.dumps(o))


def sheet(f, start, dur, fps=10):
    p = f if os.path.isabs(f) else os.path.join(SRC, f)
    os.makedirs(os.path.join(ROOT, 'footage/frames'), exist_ok=True)
    tag = f'{os.path.splitext(os.path.basename(p))[0]}_{float(start):07.2f}_{float(dur):.1f}s_{fps}fps'
    out = os.path.join(ROOT, 'footage/frames', tag + '.jpg')
    n = int(float(dur) * float(fps))
    cols = 6
    rows = (n + cols - 1) // cols
    vf = (f"fps={fps},scale=480:-2,drawtext=text='%{{pts\\:hms}}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,"
          f"tile={cols}x{rows}:padding=4:color=black")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', str(dur), '-i', p, '-vf', vf, '-frames:v', '1', '-q:v', '3', out], check=True)
    print(out)


# Crops of the side-profile shot of BYD's clip (frames 230-328 of the screen recording). The recording shows the
# player's red header (rows 0-101) and control bar (from row ~975), so every crop stays inside rows 104-977. A 16:9
# window that tall is 1552 px wide, too narrow for the whole car, so the opening frames the rear half (wing, rear
# wheel, door) and the replay the front half (door, mirror, front wheel, nose). Frames are used one-to-one at the
# recording's own 30 fps: no re-timing, no interpolation. Scaled once, with Lanczos, to the 4K master size.
CROPS = {
    'real_open': {'from': 273, 'to': 328, 'x0': 0, 'y0': 104, 'w': 1552, 'h': 873},
    'real_replay': {'from': 262, 'to': 328, 'x0': 368, 'y0': 104, 'w': 1552, 'h': 873},
}


def cut(f):
    p = f if os.path.isabs(f) else os.path.join(SRC, f)
    os.makedirs(os.path.join(ROOT, 'source/public/footage'), exist_ok=True)
    for name, c in CROPS.items():
        out = os.path.join(ROOT, f'source/public/footage/{name}.mp4')
        vf = (f"select=between(n\\,{c['from']}\\,{c['to']}),setpts=N/30/TB,crop={c['w']}:{c['h']}:{c['x0']}:{c['y0']},"
              f"scale=3840:2160:flags=lanczos,setsar=1")
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-an', '-vf', vf, '-r', '30', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
                        '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out], check=True)
        print(out, c['to'] - c['from'] + 1, 'frames')


# Second source (BYD's U9 jump film, 1080p screen recording, picture area rows 130-948 inside black bars). Four distinct moments,
# each cropped to 16:9 inside the picture so the on-screen distance bar, speed read-out, disclaimer and the recorder's corner logo
# are outside the frame. On the side jump the distance bar sits under the car, so a filled-in patch (ffmpeg delogo) replaces just
# that strip of plain road. Frames are used one-to-one at the recording's 30 fps: no re-timing, no interpolation.
SRC2 = 'Screen.Recording.2026-10-18.012652.mp4'
CROPS2 = {
    'real_jump': {'from': 316, 'to': 458, 'x0': 330, 'y0': 130, 'w': 1280, 'h': 720, 'delogo': 'delogo=x=350:y=772:w=860:h=58,'},
    # the pit: hover (480-532), front wheel at the lip (536-570), high angle (575-613)
    'real_pit': {'from': 480, 'to': 613, 'x0': 100, 'y0': 130, 'w': 1369, 'h': 770},
    # the spike strip: the car arrives, passes over the strip with all four wheels clear of the road, lands beyond it
    'real_spikes': {'from': 900, 'to': 1040, 'x0': 100, 'y0': 130, 'w': 1369, 'h': 770},
    'real_corner': {'from': 691, 'to': 732, 'x0': 100, 'y0': 130, 'w': 1369, 'h': 770},
    # the drive-away: a wide side pass (1508-1556), then the drone from the front, over the roof and behind the car (1557-1700)
    'real_driveA': {'from': 1508, 'to': 1556, 'x0': 200, 'y0': 130, 'w': 1369, 'h': 770},
    'real_driveB': {'from': 1557, 'to': 1700, 'x0': 200, 'y0': 130, 'w': 1369, 'h': 770},
}


def cut2(only=None):
    p = os.path.join(SRC, SRC2)
    os.makedirs(os.path.join(ROOT, 'source/public/footage'), exist_ok=True)
    for name, c in CROPS2.items():
        if only and name not in only:
            continue
        out = os.path.join(ROOT, f'source/public/footage/{name}.mp4')
        vf = (f"select=between(n\\,{c['from']}\\,{c['to']}),setpts=N/30/TB,{c.get('delogo', '')}crop={c['w']}:{c['h']}:{c['x0']}:{c['y0']},"
              f"scale=3840:2160:flags=lanczos,setsar=1")
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-an', '-vf', vf, '-r', '30', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
                        '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out], check=True)
        print(out, c['to'] - c['from'] + 1, 'frames')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'probe'
    if cmd == 'probe':
        probe()
    elif cmd == 'sheet':
        sheet(*sys.argv[2:5], **({'fps': float(sys.argv[5])} if len(sys.argv) > 5 else {}))
    elif cmd == 'cut':
        cut(sys.argv[2])
    elif cmd == 'cut2':
        cut2(sys.argv[2:] or None)
    else:
        sys.exit(__doc__)

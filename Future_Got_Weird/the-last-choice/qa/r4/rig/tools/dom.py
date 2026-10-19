#!/usr/bin/env python3
# dom.py <shot> <start> <end> <fracs>  -> prints "shot frame SAME|DIFF"
import sys, subprocess, re, hashlib, os
shot, st, en = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
fracs = [float(x) for x in (sys.argv[4] if len(sys.argv) > 4 else '0.5').split(',')]
H = '/tmp/claude-0/-home-user-Youtube-videos/4fd06f38-6715-5414-83fd-ceb37ea54d2a/scratchpad/r4/rig/b2/h'
def dump(frames):
    r = subprocess.run(['nice', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=6000', '--dump-dom', f'file://{H}/index2.html?shot={shot}&f={",".join(map(str, frames))}'], capture_output=True, timeout=120)
    t = r.stdout.decode('utf8', 'replace')
    return hashlib.md5(re.sub(r'r2vig\d+', 'V', t).encode()).hexdigest(), len(t)
f0, f1 = round(st * 30), round(en * 30) - 1
for fr in fracs:
    f = int(f0 + (f1 - f0) * fr)
    a = dump([f]); b = dump([max(f0, f - k) for k in range(int(os.environ.get('HIST','5')), -1, -1)] if f - int(os.environ.get('HIST','5')) >= f0 else [f, f])
    print(shot, f, 'SAME' if a == b else 'DIFF', a[1], b[1], flush=True)

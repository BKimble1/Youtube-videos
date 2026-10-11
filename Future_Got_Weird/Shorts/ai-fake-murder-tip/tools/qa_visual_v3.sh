#!/usr/bin/env bash
# V3 Final visual QA from the ENCODED masters: contact sheets, muted-opening sheet, transition bursts, phone-size overlay previews, loop-seam frame comparison.
# Usage: tools/qa_visual_v3.sh   (run from anywhere)
set -euo pipefail
cd "$(dirname "$0")/.."
CAP=exports/FGW_AI_Fake_Murder_Tip_V3_Final_Captioned_1080x1920.mp4
CLN=exports/FGW_AI_Fake_Murder_Tip_V3_Final_Clean_1080x1920.mp4
O=qa/v3_final
T=qa/dev/phone3; rm -rf "$T"; mkdir -p "$T"
python3 tools/mp4_sheet.py $CAP $O/contact_1_0-10s.png 7 200 $(python3 -c "print(','.join(str(int(x*15)) for x in range(0,21)))")
python3 tools/mp4_sheet.py $CAP $O/contact_2_10-21s.png 7 200 $(python3 -c "print(','.join(str(int(x*15)) for x in range(21,42)))")
python3 tools/mp4_sheet.py $CAP $O/first_2s_muted_check.png 8 180 0,3,6,9,12,15,18,21,24,30,36,42,48,54,58,64
python3 tools/mp4_sheet.py $CAP $O/transitions_a.png 8 180 144,147,149,151,153,155,157,160,221,223,225,228,232,236,257,259
python3 tools/mp4_sheet.py $CAP $O/transitions_b.png 8 180 286,289,292,296,300,304,310,316,334,336,338,340,343,347,352,358
python3 tools/mp4_sheet.py $CAP $O/transitions_c.png 8 180 365,368,371,374,377,380,383,386,440,443,446,449,452,456,460,464
python3 tools/mp4_sheet.py $CAP $O/transitions_d.png 8 180 530,536,540,544,548,552,558,562,568,574,586,596,606,614,622,629
for n in 0 20 64 100 196 240 310 383 420 470 562 629; do
  ffmpeg -y -v error -i $CAP -vf "select=eq(n\,$n)" -vsync 0 -frames:v 1 $T/f$(printf %04d $n).png
done
python3 tools/phone_preview_v3.py $O/phone_preview_360x640_1.png 6 $T/f0000.png $T/f0020.png $T/f0064.png $T/f0100.png $T/f0196.png $T/f0240.png
python3 tools/phone_preview_v3.py $O/phone_preview_360x640_2.png 6 $T/f0310.png $T/f0383.png $T/f0420.png $T/f0470.png $T/f0562.png $T/f0629.png
# loop seam: last frame vs first frame of the next loop, against ordinary frame-to-frame motion
python3 - <<'PY'
import subprocess, numpy as np, json
def fr(path, ns):
    sel = '+'.join(f'eq(n\\,{n})' for n in ns)
    raw = subprocess.run(['ffmpeg','-v','error','-i',path,'-vf',f"select='{sel}'",'-vsync','0','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(len(ns), 1920, 1080, 3).astype(np.int16)
    return {n: a[i] for i, n in enumerate(sorted(ns))}
res = {}
for name, p in (('captioned', 'exports/FGW_AI_Fake_Murder_Tip_V3_Final_Captioned_1080x1920.mp4'), ('clean', 'exports/FGW_AI_Fake_Murder_Tip_V3_Final_Clean_1080x1920.mp4')):
    f = fr(p, [0, 1, 2, 627, 628, 629])
    d = lambda a, b: {'mean_abs_diff': round(float(np.abs(f[a] - f[b]).mean()), 3), 'pct_pixels_over_32': round(float((np.abs(f[a] - f[b]).max(axis=2) > 32).mean() * 100), 3)}
    res[name] = {'f629_vs_f0 (the loop seam)': d(629, 0), 'f628_vs_f629': d(628, 629), 'f0_vs_f1': d(0, 1), 'f1_vs_f2': d(1, 2), 'f627_vs_f628': d(627, 628)}
json.dump(res, open('qa/v3_final/loop_seam_frames.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
PY

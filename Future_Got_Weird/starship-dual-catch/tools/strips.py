"""Transition strips from the rendered MP4: for every scene start, frames at -9, -3, 0, +3, +9 around the cut.
Usage: python3 tools/strips.py exports/<file>.mp4  -> qa/strips/strip_<scene>.png (scene starts from qa/scene_starts.json)"""
import json, os, subprocess, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
mp4 = sys.argv[1]
starts = json.load(open(os.path.join(ROOT, "qa", "scene_starts.json")))
out = os.path.join(ROOT, "qa", "strips"); os.makedirs(out, exist_ok=True)
for sc in starts:
    fr = [max(0, sc["from"] + d) for d in (-9, -3, 0, 3, 9)]
    sel = "+".join(f"eq(n\\,{f})" for f in fr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf", f"select='{sel}',scale=384:-1,tile=5x1", "-frames:v", "1", "-vsync", "0", os.path.join(out, f"strip_{sc['id']}.png")], check=True)
print(len(starts), "strips")

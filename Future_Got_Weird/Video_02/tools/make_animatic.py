#!/usr/bin/env python3
"""Beat animatic: one card per storyboard shot (question / action / consequence, picture, on-screen text, camera and
sound), timed to the measured narration, with the narration as its soundtrack.

  python3 tools/make_animatic.py   -> storyboard/animatic/cards/*.png, storyboard/animatic/shots.json,
                                      storyboard/animatic/Video_02_beat_animatic.mp4 (1280x720, 30 fps)

Shot starts are the start of each shot's first narration line in source/src/data/timeline.json; a shot lasts until the
next shot starts (the last one until the end of the film). Words spoken during a shot are printed under its card.
"""
import json
import os
import re
import subprocess
import textwrap

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "storyboard/animatic")
W, H = 1280, 720
INK, CREAM, TEAL, CORAL, YELLOW = "#162A32", "#FAF3DF", "#1CA7A0", "#EF6B55", "#FFC744"
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(p, s):
    return ImageFont.truetype(p, s)


def parse_storyboard():
    shots, scene = [], None
    for line in open(os.path.join(ROOT, "storyboard/STORYBOARD.md")):
        m = re.match(r"## (S\d) · (.*)", line)
        if m:
            scene = (m.group(1), m.group(2).strip())
            continue
        m = re.match(r"\| (S\d\.\d) \| ([^|]*)\|(.*)", line)
        if not m:
            continue
        cells = [c.strip() for c in m.group(3).split("|")]
        segs = re.findall(r"s\d\d", m.group(2))
        if not segs:
            continue
        shots.append({"shot": m.group(1), "lines": m.group(2).strip(), "first_seg": segs[0], "scene": scene,
                      "qac": cells[0] if cells else "", "picture": cells[1] if len(cells) > 1 else "",
                      "text": cells[2] if len(cells) > 2 else "", "camera_sound": cells[3] if len(cells) > 3 else ""})
    return shots


def clean(s):
    return re.sub(r"\*\*|`", "", s)


def draw_block(d, x, y, w_chars, label, body, f_label, f_body, color, max_lines=6):
    d.text((x, y), label, font=f_label, fill=color)
    y += 26
    lines = textwrap.wrap(clean(body), w_chars) or ["–"]
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1][: max(0, w_chars - 1)] + "…"
    for ln in lines:
        d.text((x, y), ln, font=f_body, fill=INK)
        y += 24
    return y + 10


def main():
    tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json")))
    fps, total = tl["fps"], tl["durationInFrames"]
    seg = {s["id"]: s for s in tl["segments"]}
    shots = parse_storyboard()
    for sh in shots:
        sh["from"] = seg[sh["first_seg"]]["from"]
    shots.sort(key=lambda s: s["from"])
    shots[0]["from"] = 0
    for a, b in zip(shots, shots[1:]):
        a["to"] = b["from"]
    shots[-1]["to"] = total
    os.makedirs(os.path.join(OUT, "cards"), exist_ok=True)
    f_h, f_s, f_l, f_b, f_w = font(FB, 34), font(F, 20), font(FB, 18), font(F, 18), font(F, 17)
    concat = []
    for i, sh in enumerate(shots):
        words = [w["w"] for s in tl["segments"] for w in s["words"] if sh["from"] <= w["from"] < sh["to"]]
        im = Image.new("RGB", (W, H), CREAM)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, W, 64], fill=INK)
        d.text((24, 12), f"{sh['shot']}", font=f_h, fill=YELLOW)
        d.text((150, 22), f"{sh['scene'][0]} · {sh['scene'][1]}"[:95], font=f_s, fill=CREAM)
        t0, t1 = sh["from"] / fps, sh["to"] / fps
        d.text((W - 300, 22), f"{int(t0 // 60)}:{t0 % 60:05.2f} – {int(t1 // 60)}:{t1 % 60:05.2f}", font=f_s, fill=CREAM)
        y = draw_block(d, 32, 84, 66, "QUESTION / ACTION / CONSEQUENCE", sh["qac"], f_l, f_b, CORAL, 9)
        y2 = draw_block(d, 32, max(y, 330), 66, "PICTURE", sh["picture"], f_l, f_b, TEAL, 4)
        x2 = 700
        yy = draw_block(d, x2, 84, 50, "TEXT ON SCREEN", sh["text"], f_l, f_b, TEAL, 8)
        draw_block(d, x2, max(yy, 300), 50, "CAMERA, SOUND, CLAIMS", sh["camera_sound"], f_l, f_b, TEAL, 6)
        d.rectangle([0, H - 150, W, H], fill="#EFE5CC")
        d.text((32, H - 140), f"NARRATION ({sh['lines']})"[:80], font=f_l, fill=CORAL)
        for k, ln in enumerate(textwrap.wrap(" ".join(words), 120)[:4]):
            d.text((32, H - 112 + k * 24), ln, font=f_w, fill=INK)
        d.rectangle([0, H - 8, int(W * sh["to"] / total), H], fill=TEAL)
        p = os.path.join(OUT, "cards", f"{i:02d}_{sh['shot']}.png")
        im.save(p)
        concat.append((p, (sh["to"] - sh["from"]) / fps))
    lst = os.path.join(OUT, "cards.txt")
    with open(lst, "w") as f:
        for p, dur in concat:
            f.write(f"file '{p}'\nduration {dur:.4f}\n")
        f.write(f"file '{concat[-1][0]}'\n")
    json.dump([{k: v for k, v in s.items()} for s in shots], open(os.path.join(OUT, "shots.json"), "w"), indent=1)
    out = os.path.join(OUT, "Video_02_beat_animatic.mp4")
    nar = os.path.join(ROOT, "source/public/audio/narration.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", nar,
                    "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "veryfast",
                    "-c:a", "aac", "-b:a", "128k", "-shortest", out], check=True)
    print(f"{len(shots)} shots → {out}")


if __name__ == "__main__":
    main()

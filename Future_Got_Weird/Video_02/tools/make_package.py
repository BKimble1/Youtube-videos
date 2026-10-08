#!/usr/bin/env python3
"""Write the public upload package from the final timeline, so chapters always match the cut.

  python3 tools/make_package.py   -> package/UPLOAD_PACKAGE.md, package/description.txt, package/chapters.txt,
                                     package/titles.txt

Public text rules: nothing identifies the channel owner; sources and credits are complete; claims match
research/claims.csv; illustrations and analogies are labelled as such.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json")))
fps = tl["fps"]

CHAPTER_TITLES = {
    "S1": "The impossible view",
    "S2": "Why a plain wall works",
    "S3": "The faint echo",
    "S4": "Timing becomes a map",
    "S5": "What came before",
    "S6": "Small sensors (2026)",
    "S7": "What the real data shows",
    "S8": "What it might be good for",
    "S9": "Back to our friend",
}


def ts(seconds):
    s = int(seconds)
    return f"{s // 60}:{s % 60:02d}"


chapters = []
for i, sc in enumerate(tl["scenes"]):
    t = 0.0 if i == 0 else sc["from"] / fps
    chapters.append((ts(t), CHAPTER_TITLES[sc["id"]]))
# YouTube: first chapter 0:00, at least three, each at least 10 s
assert chapters[0][0] == "0:00"
starts = [int(c[0].split(":")[0]) * 60 + int(c[0].split(":")[1]) for c in chapters] + [int(tl["durationSeconds"])]
assert all(b - a >= 10 for a, b in zip(starts, starts[1:])), "a chapter is shorter than 10 s"

THUMB = 'thumbnails/thumb_C_1280.jpg'  # set to the recommended variant

TITLES = [
    "How Cameras See Around Corners",
    "How a Blank Wall Reveals Hidden Objects",
    "The Light That Lets Cameras See Around Corners",
]

DESCRIPTION = """A plain wall can give away someone hiding behind a partition. Light from a small time-of-flight sensor bounces off the wall, reaches the hidden person and returns a few billionths of a second late, and that delay is a clue to where they are. We explain how the timing becomes a map, what earlier laboratory systems achieved, and what a study published in 2026 managed with the kind of small sensors found in consumer gadgets, including what it still can't do.

The real measurements shown are the researchers' own released data, plotted by us. The tracked positions and the U-shaped reconstruction were computed with their published code, run by us; the echo plot shows raw sensor counts. Room diagrams, numbers in them and the history scenes are illustrations.

CHAPTERS
{chapters}

SOURCES
Main study
- Somasundaram, S., Young, A., Dave, A., Pediredla, A. & Raskar, R. "Imaging hidden objects with consumer LiDAR via motion-induced sampling." Nature 653, 693-699 (published 20 May 2026). https://doi.org/10.1038/s41586-026-10502-x
- Project page: https://cornar.media.mit.edu/
- Code (MIT License) and released data: https://github.com/sidsoma/consumer-nlos (commit 15314de)
History and context
- Velten, A. et al. "Recovering three-dimensional shape around a corner using ultrafast time-of-flight imaging." Nature Communications 3, 745 (2012). https://doi.org/10.1038/ncomms1747
- O'Toole, M., Lindell, D. B. & Wetzstein, G. "Confocal non-line-of-sight imaging based on the light-cone transform." Nature 555, 338-341 (2018). https://doi.org/10.1038/nature25489
- Nam, J. H. et al. "Low-latency time-of-flight non-line-of-sight imaging at 5 frames per second." Nature Communications 12, 6526 (2021). https://doi.org/10.1038/s41467-021-26721-x
- Callenberg, C., Shi, Z., Heide, F. & Hullin, M. B. "Low-cost SPAD sensing for non-line-of-sight tracking, material classification and depth imaging." ACM Transactions on Graphics 40(4), 61 (2021).

NOTES
- Tracking plot (opening and "What the real data shows"): the authors' released measurements from a low-cost STMicroelectronics VL53L8-series evaluation-kit sensor (16 zones), held still and aimed at a wall while a hidden person moved behind a screen. Position estimates were computed with the authors' published code and settings, run and plotted by us, and mirrored to match our room. The data were processed with the code's retroreflective-target setting; what the person wore is not documented. Capture date and frame rate are not stated in the release. These data come from the evaluation kit, not from the smartphone-grade device used for the paper's main results, whose data were not released.
- The person-in-ordinary-clothes result at 30 frames per second is what the authors report for a separate test, not this kit clip. 30 frames per second is the capture rate, not the processing time.
- The U-shaped reconstruction used a different sensor (3x3 zones) moved through 36 known positions, with the object held still.
- The authors call the work an early-stage research prototype. No phone app does this today, and no study has shown it prevents collisions.
- "Night mode" is our analogy for the authors' burst-photography idea.

CREDITS
Data: Somasundaram et al. (2026), released at github.com/sidsoma/consumer-nlos. Narration: synthetic voice. Music: original score. Illustration and animation: Future Got Weird.
"""

chap_txt = "\n".join(f"{t} {name}" for t, name in chapters)
desc = DESCRIPTION.format(chapters=chap_txt)
os.makedirs(os.path.join(ROOT, "package"), exist_ok=True)
open(os.path.join(ROOT, "package/description.txt"), "w").write(desc)
open(os.path.join(ROOT, "package/chapters.txt"), "w").write(chap_txt + "\n")
open(os.path.join(ROOT, "package/titles.txt"), "w").write("\n".join(TITLES) + "\n")
import shutil
shutil.copyfile(os.path.join(ROOT, "script/subtitles_v2.srt"), os.path.join(ROOT, "package/Future_Got_Weird_Video_02_v1.srt"))
md = f"""# Video 02 upload package

Generated by `tools/make_package.py` from `source/src/data/timeline.json` ({tl['durationSeconds']:.2f} s, {tl['engine']} timing).
Publishing is the owner's action.

## Title
- **Preferred:** {TITLES[0]}
- Alternatives: {TITLES[1]} · {TITLES[2]}

## Thumbnail
`{THUMB}` (1280x720, text: SEES ME?). Alternatives and sources: `thumbnails/`.

## Description (paste as is)

```
{desc}```

## Owner checklist before upload
- Upload `exports/Future_Got_Weird_Video_02_v1_MASTER_4K.mp4` (preferred) or `exports/Future_Got_Weird_Video_02_v1_UPLOAD_1080p.mp4`, not the review preview (`..._PREVIEW_720p.mp4`).
- Captions: upload `package/Future_Got_Weird_Video_02_v1.srt` (English; built from the final narration timing).
- Thumbnail: upload `{THUMB}`.
- YouTube's altered or synthetic content setting: the film is animated and depicts no real person or real event
  realistically; the narration is a designed synthetic voice. Decide whether to disclose; the description already says so.
- Audience: not made for kids (general audience explainer).
"""
open(os.path.join(ROOT, "package/UPLOAD_PACKAGE.md"), "w").write(md)
print(chap_txt)

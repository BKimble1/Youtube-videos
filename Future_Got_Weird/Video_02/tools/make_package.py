#!/usr/bin/env python3
"""Write the public upload package (v2) from the final timeline, so chapters and end-screen times always match the cut.

  python3 tools/make_package.py   -> package/UPLOAD_PACKAGE.md, package/description.txt, package/chapters.txt,
                                     package/titles.txt, package/END_SCREEN.md, package/Future_Got_Weird_Video_02_v2.srt

Public text rules: nothing identifies the channel owner; sources and credits are complete; claims match
research/claims.csv (v2 wording: v2/EVIDENCE_BRIEF_V2.md); illustrations and analogies are labelled as such.
The v1 package is in git history (commit 40183b0).
"""
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json")))
sc2 = json.load(open(os.path.join(ROOT, "v2/script_v2.json"), encoding="utf-8"))
fps = tl["fps"]
PFX = "Future_Got_Weird_Video_02_v2"


def ts(seconds):
    s = int(seconds)
    return f"{s // 60}:{s % 60:02d}"


def ts_frac(seconds):
    return f"{int(seconds // 60)}:{seconds % 60:05.2f}"


# chapters: one per story section (the brief's questions), starting where the section's first scene starts
scene_from = {s["id"]: s["from"] / fps for s in tl["scenes"]}
section_of_scene = {s["id"]: s["section"] for s in sc2["scenes"]}
chapters = []
for i, sec in enumerate(sc2["sections"]):
    first_scene = next(s["id"] for s in sc2["scenes"] if s["section"] == sec["id"])
    t = 0.0 if i == 0 else scene_from[first_scene]
    chapters.append((ts(t), sec["chapter"]))
# YouTube: first chapter 0:00, at least three, each at least 10 s
assert chapters[0][0] == "0:00"
starts = [int(c[0].split(":")[0]) * 60 + int(c[0].split(":")[1]) for c in chapters] + [int(tl["durationSeconds"])]
assert all(b - a >= 10 for a, b in zip(starts, starts[1:])), "a chapter is shorter than 10 s"

THUMB = os.environ.get("THUMB", "thumbnails/thumb_D_1280.jpg")  # the selected variant (see UPLOAD_PACKAGE.md)

TITLE = "How Cameras See Around Corners"
_n05 = next(s for s in tl["segments"] if s["id"] == "n05")["from"] / fps
TITLE_NOTE = ("Selected: the working title, kept as the brief recommends. \"This Camera Can See Around Corners\" was "
              f"considered and not used: the film names the system (a time-of-flight sensor) only at {ts(_n05)}, and the "
              "title should not imply that an ordinary camera can do this. Neither title has been tested; no claim is "
              "made that one performs better.")

DESCRIPTION = """A sensor pointed at a plain wall can't see the person hiding behind a partition, yet light bouncing off the wall can still give away where they are. Light that reaches them comes back a few billionths of a second late, and that delay is a clue. We follow the question chain: what survives when light scatters, how a delay becomes a location, why a cheap, phone-grade sensor makes the problem harder, and what a study published in 2026 actually managed, including where it still fails.

The real data shown come from the researchers' released files, plotted (and, for the U, reconstructed with their code) by us. Everything else (the room, the light paths, the numbers in our diagrams and the history scenes) is illustration.

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
- Tracking plot (opening, and "What can it do"): the position estimates saved in the authors' released files, from a low-cost STMicroelectronics VL53L8-series evaluation-kit sensor (16 zones; under US$100 by the authors' figure), held still and aimed at a wall while a hidden person walked behind a partition. Shown sped up: every other recorded frame, frames 7-475 of 475, one plotted position per video frame, no interpolation; mirrored to match our room. The partition and sensor marker are drawn from the authors' plotting code, not measured. The setup first records the flat wall and the empty room. The authors' code processes these data with its retroreflective-target setting; what the person wore is not documented; the capture date and frame rate are not stated in the release. These data come from the evaluation kit, not from the smartphone-grade device used for the paper's main results, whose data were not released.
- Our software check: we re-ran the authors' released code (commit 15314de) on their released data on 8 October 2026; our tracking run matched their saved estimates (median 8 cm apart) and the U reconstruction matched exactly. This checks the released software, not the physical experiment, and is not an independent replication.
- The echo plot shows the authors' released raw sensor counts from a different sensor (3x3 zones, centre zone) and hidden object, from one of the 36 captures (iter_22); the zoom factor is ours. "Hundreds of times weaker" is our peak-height measure (256-576x across the nine zones). Reading the bump as the U's echo is our interpretation, consistent with the reconstructed U about 0.54 m from the wall.
- The U-shaped reconstruction used that 3x3-zone sensor, moved through 36 preset positions with the object held still: the authors' released data and code, run by us; the build-up frames are our partial sums over the first k positions.
- The person-in-ordinary-clothes result at 30 frames per second is what the authors report for a separate test with a different device, not this kit clip; its data were not released. 30 frames per second is the capture rate, not the processing time.
- Numbers in our room diagrams (for example 8.9 ns, 2.65 m there and back, 1.33 m each way) are illustrative, computed for our drawn room.
- The authors call the work an early-stage research prototype; no phone app does this today. The warehouse robot is our illustration of a potential use, not a tested application or a safety system.
- "Night mode" is our analogy for the authors' burst-photography idea. History scenes are illustrations based on the papers above.

CREDITS
Data: Somasundaram et al. (2026), released at github.com/sidsoma/consumer-nlos. Narration: synthetic (designed) voice. Music: original score. Illustration and animation: Future Got Weird.
"""

# end screen: the last scene (V13), from its first frame to the end of the video
v13 = next(s for s in tl["scenes"] if s["id"] == "V13")
es_from, es_to = v13["from"] / fps, tl["durationInFrames"] / fps
END_SCREEN = f"""# End screen: placement instructions (owner)

The film's last {es_to - es_from:.1f} s ({ts_frac(es_from)} to {ts_frac(es_to)}, frames {v13['from']}-{tl['durationInFrames'] - 1} at 30 fps) is
the end screen. It is already clear of content where YouTube's elements go; the lighter panel and disc in the picture are
layout guides only, not clickable elements.

| Element | Guide in the picture (1920x1080 frame) | Share of the frame |
|---|---|---|
| Video (one next video: the channel's other episode, or "Best for viewer") | panel x 1000-1800, y 290-740 (800x450, 16:9) | x 52.1-93.8 %, y 26.9-68.5 % |
| Subscribe | disc centred at (430, 600), 300 px across (x 280-580, y 450-750) | centre 22.4 % across, 55.6 % down |
| Keep clear | the wordmark (x 120-900, y 96-330), the callback art (x 640-940, y 560-930) and the caption band (y 950-1080) | |

Steps in YouTube Studio (Content -> this video -> Editor -> End screen):
1. Add element 1, **Video**: choose the channel's other episode (or "Best for viewer"). Drag and resize it to cover the
   panel guide (x 1000-1800, y 290-740). YouTube may enforce its own minimum size; keep the element inside the guide.
2. Add element 2, **Subscribe**: centre it on the disc guide at (430, 600).
3. Set both elements to run from **{ts_frac(es_from)}** to the end of the video ({es_to - es_from:.1f} s; YouTube allows 5-20 s).
4. Check the phone preview: the wordmark, the callback art and any caption must not sit under either element.
"""

chap_txt = "\n".join(f"{t} {name}" for t, name in chapters)
desc = DESCRIPTION.format(chapters=chap_txt)
os.makedirs(os.path.join(ROOT, "package"), exist_ok=True)
open(os.path.join(ROOT, "package/description.txt"), "w").write(desc)
open(os.path.join(ROOT, "package/chapters.txt"), "w").write(chap_txt + "\n")
open(os.path.join(ROOT, "package/titles.txt"), "w").write(TITLE + "\n\n" + TITLE_NOTE + "\n")
open(os.path.join(ROOT, "package/END_SCREEN.md"), "w").write(END_SCREEN)
shutil.copyfile(os.path.join(ROOT, "script/subtitles_v2.srt"), os.path.join(ROOT, f"package/{PFX}.srt"))
md = f"""# Video 02 upload package (v2)

Generated by `tools/make_package.py` from `source/src/data/timeline.json` ({tl['durationSeconds']:.2f} s, {tl['engine']} timing).
Publishing is the owner's action.

## Title
**{TITLE}**

{TITLE_NOTE}

## Thumbnail
`{THUMB}` (1280x720). Checked at 160-200 px wide against the film's first frames; see `v2/QA_V2.md`. Alternatives: `thumbnails/`.

## Description (paste as is)

```
{desc}```

## End screen
See `package/END_SCREEN.md` (element positions and times; starts at {ts_frac(es_from)}).

## Owner checklist before upload
- Upload `exports/{PFX}_MASTER_4K.mp4` (preferred) or `exports/{PFX}_UPLOAD_1080p.mp4`, not the review copy.
- Captions: upload `package/{PFX}.srt` (English; built from the final narration timing).
- Thumbnail: upload `{THUMB}`.
- End screen: follow `package/END_SCREEN.md`.
- YouTube's altered or synthetic content setting: the film is animated and depicts no real person or real event
  realistically; the narration is a designed synthetic voice. Decide whether to disclose; the description already says so.
- Audience: not made for kids (general audience explainer).
- Listen through once on headphones before publishing (nobody has listened to this soundtrack; see `v2/QA_V2.md`).
"""
open(os.path.join(ROOT, "package/UPLOAD_PACKAGE.md"), "w").write(md)
print(chap_txt)
print(f"end screen {ts_frac(es_from)}-{ts_frac(es_to)}")

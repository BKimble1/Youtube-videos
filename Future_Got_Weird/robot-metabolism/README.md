# Future Got Weird: This Robot Uses Other Robots as Spare Parts (Robot Metabolism)

## V1 (28 Oct 2026): first review version

Vertical Short, 30 fps, **25.70 s (771 frames)**. The locked 75-word narration, verbatim, in the channel narrator
(ElevenLabs "Test Voice"). **Not published, uploaded or scheduled.** Nobody has watched it in real time with sound: this
environment has no audio or video playback, so the review was done frame by frame and by measurement
(`production/SOURCE_AND_QA.md` says exactly what was and was not checked).

| Deliverable | File |
|---|---|
| Review, 1080×1920, captions burned in | `exports/FGW_Robot_Metabolism_V1_REVIEW_1080x1920.mp4` |
| Master, 2160×3840, captions burned in, rendered natively at 2× from the vectors | `exports/FGW_Robot_Metabolism_V1_MASTER_2160x3840.mp4` |
| Clean (no captions), 1080×1920 | `exports/FGW_Robot_Metabolism_V1_CLEAN_1080x1920.mp4` |
| Final narration (48 kHz, 24-bit, mono) and its provenance | `audio/narration/FGW_Robot_Metabolism_narration_V1.wav`, `audio/narration/voice_provenance.json` |
| Word timings, captions | `audio/narration/words_V1.json`, `source/src/data/timeline.json`, `captions/FGW_Robot_Metabolism_V1.srt` |
| Mix and its measurements | `audio/mix/FGW_Robot_Metabolism_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/sfx_cues.json` |
| Locked narration (single authority) | `production/NARRATION_LOCKED.txt` |
| Source notes, science boundaries, QA, remaining limitations | `production/SOURCE_AND_QA.md` |
| Shots and transition list | `production/SHOTS_AND_TRANSITIONS.md` |
| Runway: planned plates, why none are used | `production/RUNWAY.md` |
| Description and pinned-comment drafts (outside the video) | `production/DESCRIPTION_DRAFT.md` |
| Cover frame (from the finished film) | `cover/` |
| QA evidence | `qa/` |

## How it is built

- **Rig** (`source/src/rig/`): a Truss Link is two end points; the rigid housing, motor block, identity band, sliding
  inner rod, connector shells and status light are all derived from them. A tetrahedron is built from its six link
  lengths (`body.ts`), so drawn links always equal the commanded lengths.
- **Renderer** (`source/src/lib/r3.tsx`): a small 3D vector renderer in the channel's flat ink style (fixed upper-left
  key light, depth-sorted capsules, spheres and polygons, soft ground shadows). Vector all the way, so `--scale=2`
  gives a true 2160×3840 master.
- **Stations** (`source/src/world/`): the bench, the ramp, the module station; each state is a pure function of time.
- **Cast**: the Weird Crew's guesser on his existing rig (`source/src/dc/`, copied unchanged from Robot Faces).
- **Shots** (`source/src/shots.tsx`): camera paths and caption placement, all timed from the measured narration.

## Rebuild

```sh
cd Future_Got_Weird/robot-metabolism
python3 -m pip install numpy scipy soundfile pyloudnorm pocketsphinx
(cd source && npm ci)                       # Remotion 4.0.533 (pinned lockfile); remotion.config.ts uses the local Chromium
python3 tools/make_narration.py             # only if the take or caption phrases change
sh tools/render.sh all                      # cues -> mix -> review, clean and master (video muted, PCM mix encoded once)
python3 tools/qa.py exports/FGW_Robot_Metabolism_V1_REVIEW_1080x1920.mp4 qa/review_qa.json
# rig probe: link lengths in range, nothing under the surface, joined ends exact, separate modules never intersect
source/node_modules/.bin/esbuild tools/rig_probe.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/probe.cjs && node /tmp/probe.cjs
# contact sheets / framing tests
(cd source && python3 sheets.py /tmp/sheet 0,30,60 true && python3 camtest.py /tmp/ct.png bench 1.0 "0.8,0.44,0.48;0.25,0.07,-0.02;1450;60")
```

# Future Got Weird: This Robot Uses Other Robots as Spare Parts (Robot Metabolism)

## V3 (28 Oct 2026): mechanical rig rebuild, hook and retention revision, for review

`exports/FGW_Robot_Metabolism_V3_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 25.70 s (771 frames). Same locked
narration, take, voice, caption timing and style.

- **New rig** (`source/src/v3/`):
  - every link is a fixed-structure actuator between two connector balls (only its rod slides);
  - joints are clusters of touching magnet balls that never overlap and never shift when a part attaches;
  - every piece is a convex solid painted in exact occlusion order (pairwise ray tests and a topological sort,
    `source/src/lib/solid.ts`).
- **Story:**
  1. A robot takes a donor's part (two contacts) and stands up.
  2. The rod's actuator, shown in cutaway; the joints turning; a connector magnet, shown in cutaway.
  3. A one-key operator beat.
  4. The rear foot reaches back to a rod; contact; the rod becomes a walking stick.
  5. A ratchet gait over a crest and down a 10° ramp.
  6. The stick stalls and dies; it is released, falls and rolls aside.
  7. One side step; a replacement attached; recovery.
  8. The camera travels to a broken robot and its parts, into the opening composition, so the film loops.
- **Verified every frame:** 0 mechanical faults (`tools/probe3.ts`) and 0 occlusion/view faults
  (`tools/probe3_view.ts`).
- **Not published, uploaded or scheduled; not yet watched or heard in real time.**
- Details, the timing against the brief, QA: `production/V3_CHANGES_QA.md`.
- Build: `sh tools/render_v3.sh review`.

## V2 (28 Oct 2026): hook and retention rebuild, for review

`exports/FGW_Robot_Metabolism_V2_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 25.70 s (771 frames).

- Same locked narration, take, voice and captions as V1.
- It opens mid-transfer: a broken robot's intact module is handed to an incomplete robot, which closes its base and
  rises. It then shows:
  - the actuator and connector cutaways;
  - a one-key operator beat;
  - a stick module guided in and connected;
  - a ramp shot that tracks alongside the robot (it crawls, then walks on the stick);
  - the stick failing, falling and rolling aside, and a replacement connected.
- It ends on a second pair beginning the same transfer, framed exactly like frame 0, so the film loops.
- **Not published, uploaded or scheduled; not yet watched or heard in real time.**
- Changes, the timing against the brief, the loop and the QA: `production/V2_CHANGES_QA.md`.
- V2 source:
  - `source/src/v2/` (composition `RobotMetabolismV2`);
  - `tools/render_v2.sh`, `tools/make_audio_v2.py`, `tools/export_cues_v2.ts`, `tools/rig_probe2.ts`.
- V1 below is unchanged.

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

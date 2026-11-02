# Future Got Weird: This Time Machine Actually Works

## V3 (review render, current)

**Deliverable.** `exports/FGW_TimeMachine_V3_REVIEW_1080x1920.mp4`: a genuine 1080×1920 export (measured with ffprobe), 30 fps, 706
frames, 23.55 s, H.264 CRF 16 with AAC 320 kb/s. **This is V3 for review. It is not final and not publish-ready.**

**Report and QA.** `production/V3_REPORT.md` (the journey beat by beat, the character repair, the three review rounds,
measured QA, known limitations), with evidence in `qa/v3/`.

**What V3 is.** The same approved narration and voice recording as one connected journey built on V1's structure: the
ship beside the hole, through its window into the cockpit, his wrist and watch, a match cut to the wall clock at home,
the window seen from inside and then outside, the years in the garden, the ship's return, the old friend at the gate,
the path through the rose arch to the front door, the family photograph, the friend in the doorway, and a push into
the watch face that matches the ship's window and loops to frame 0.

**Code.** V3 lives in `source/src/v3/`: `timing.ts` (the timeline, keyed to the measured narration), `story.ts`
(positions, cameras, walks), `gait.ts` (walks with world-planted feet), `Scene3.tsx` (one frame), `Film3.tsx`. It reuses
the V2 art modules in `source/src/v2/` (V3-only changes behind `v3` flags). Render: `cd source && npx remotion render
src/index.ts TimeMachineV3 ../exports/FGW_TimeMachine_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3","captions":true}'
--crf=16 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k`. Sound:
`tools/export_cues_v3.ts` then `tools/make_audio_v3.py`. QA: `tools/qa_render.py`, `tools/asr_sherpa.py`.

## V2 (review render)

**Deliverable.** `exports/FGW_TimeMachine_V2_REVIEW_1080x1920.mp4`: a genuine 1080×1920 export, 30 fps, 706 frames,
23.533 s, H.264 CRF 16 with AAC 320 kb/s. **This is V2 for review. It is not final and not publish-ready.**

**Report and QA.** `production/V2_REPORT.md` (what changed from V1, the review rounds, measured QA, known limitations),
with evidence in `qa/v2/`. The storyboard and module contracts are in `production/V2_PLAN.md`.

**What V2 is.** The same approved narration and voice recording, restaged around one astronaut, one recognisable friend
(the same face, skin and green garment at every age) and one home: he lives one hour while his friend lives decades.
The opening two-shot ages the friend while he holds the astronaut's glove; the visor reflection cuts to the real black
hole; the capsule arcs around it and the camera flies through its window; a physical watch counts one hour; a match cut
to the wall clock at home; the view out of the house's window and the yard through the years; the return, the
reunion in the opening's composition, the walk into the house; the family room, his reflection in the family photo's
glass, his watch beside it, and a push into the pre-departure photograph that loops to frame 0.

**Code.** V2 lives in `source/src/v2/` (`timing.ts` the timeline, `story.ts` states and cameras, `Scene2.tsx` one
frame, plus `twoShot`, `clasp`, `craft`, `cockpit`, `yard` (street side and the reverse angle), `room`, `walk`).
Render: `cd source && npx remotion render src/index.ts TimeMachineV2 ../exports/FGW_TimeMachine_V2_REVIEW_1080x1920.mp4
--props='{"audio":"mix_v2","captions":true}' --crf=16 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac
--audio-bitrate=320k`. Sound: `tools/export_cues_v2.ts` then `tools/make_audio_v2.py`. QA: `tools/qa_render.py`.

## V1 (initial review render)

**Deliverable.** `exports/FGW_TimeMachine_V1_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 706 frames, 23.533 s, H.264
CRF 16 with AAC 320 kb/s. **This is V1 for review. It is not final and not publish-ready.**

**Report and QA.** `production/V1_REPORT.md`, with evidence in `qa/v1/`. The shot plan and the transition list
are in `production/SHOT_PLAN_V1.md`.

**Narration.** `production/NARRATION_LOCKED.txt`, word for word. It is one ElevenLabs run (two takes) with the
channel narrator voice. The only edit is lengthening six sentence gaps (2.1 s in all) and a 0.15 s lead-in. Provenance
is in `audio/narration/voice_provenance.json`.

**Picture.** Deterministic Remotion/SVG in the Weird Crew finish: ink contours, flat fills, cel shading, upper-left key
light. Eight worlds are joined by portal hand-offs: the visor reflection, the porthole, the watch's Earth sub-dial, a
cloud pass, the doorway, the eye's reflection, a watch match and the visor again. At each hand-off the camera is
converted through the portal's map, so pixels, position, zoom and speed carry across.

| World | Source |
|---|---|
| Characters: the Weird Crew head with a continuous age model, mitt hands; the astronaut (the crew's "guesser" in a suit and bubble helmet, who never ages) and the friend (the crew's "honest", ageing face, hands, posture and clothes) | `source/src/art/crew.tsx`, `source/src/art/figures.tsx` |
| Street and skyline (present-day blocks rise into future towers; sun trails) | `source/src/art/city.tsx` |
| Black hole (ray-traced, posterised to cel bands), the ship, the light-bending view and the two clocks | `tools/blackhole.py`, `source/src/art/space.tsx` |
| Earth (orthographic globe, spreading city lights), cloud pass | `source/src/art/earth.tsx` |
| Neighbourhood across decades, the capsule | `source/src/art/house.tsx` |
| Hallway, photographs, memorial | `source/src/art/interior.tsx` |

`source/src/story.ts` holds the timeline (keyed to measured word times), every state and the camera chain.
`source/src/Scene.tsx` draws one frame.

**The black hole.** `tools/blackhole.py` traces every pixel as a photon in the Schwarzschild metric (u'' = 3u² − u per
impact parameter, RK4). Disk crossings give the direct and lensed images of the accretion disk (over and under the
shadow), captured photons give the shadow, and escaping photons sample a star field (lensed arcs). The disk is shaded by
radius and by g⁴ (gravitational redshift and Doppler shift, so the approaching side is brighter). Its texture rotates
differentially (Keplerian), and it is quantised into palette bands with thin ink lines. It is drawn on twos. A wide-field
render of the same sky sits under the sharp render, so pulling back never shows an edge.

**Sound.** Everything is synthesised and placed from the picture's events: `tools/make_audio.py`.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    python3 tools/make_narration.py                                  # take -> narration master, timeline, captions, SRT
    python3 tools/blackhole.py maps && python3 tools/blackhole.py frames 0 5.0 2 && python3 tools/blackhole.py frames 17.934 23.6 2
    BH_WIDE=1 python3 tools/blackhole.py maps && BH_WIDE=1 python3 tools/blackhole.py frames 0 1.85 2 && BH_WIDE=1 python3 tools/blackhole.py frames 18.8 23.6 2
    python3 tools/make_audio.py mix_v1
    (cd source && npm ci && npx remotion render src/index.ts TimeMachineV1 ../exports/FGW_TimeMachine_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_TimeMachine_V1_REVIEW_1080x1920.mp4 qa/v1

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`. The ASR models (sherpa-onnx
Zipformer en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases.

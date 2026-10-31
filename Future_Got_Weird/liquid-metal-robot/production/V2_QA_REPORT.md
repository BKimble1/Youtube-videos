# Liquid Metal Robot V2: QA report

File: `exports/FGW_Liquid_Metal_Robot_V2_FINAL_REVIEW_1080x1920.mp4` (render 3 of V2). Measured with
`tools/qa_clip.py <mp4> v2` on the MP4 (`qa/v2/qa.json`).

## Measured

- **Checks:** all pass.
  - Video: H.264 High, 1080×1920, 30/1 fps, yuv420p, BT.709; 780 frames; 26.000 s.
  - Audio: AAC; decoded 26.005 s (within ±25 ms).
- **Audio:** voice onset 0.039 s; integrated −16.21 LUFS; sample peak −0.94 dBFS. mix_v2 build: voice −15.94 LUFS, fx bus −31.3 LUFS after ducking.
- **Motion:** longest near-static run 0 frames. Mean frame difference per second: 14.6, 17.4, 8.7, 6.2, 11.5, 19.3, 13.6, 6.3, 7.7, 17.2, 12.4, 13.9, 3.8, 7.6, 6.5, 3.5, 2.2, 5.3, 6.5, 2.3, 1.7, 4.6, 7.5, 3.8, 4.9, 16.7.
  - The first second is up from 12.2 (V1) to 14.6, reflecting the faster collapse.
- **Frame-difference flags over 18:** I inspected each run as a frame strip. All are eased continuous moves over textured surfaces; none are cuts.

  | Frames | Peak | What it is |
  |---|---|---|
  | 30–47 | 22 | the opening pull-back over the coil |
  | 157–171 | 31 | the push into the chest (V1 had the same) |
  | 201–204 | 19 | the cut window opening |
  | 280–282 | 20 | the section closing |
  | 291–300 | 32 | the pull-back out of the section |
  | 762–775 | 23 | the final descent to the cage and the magnet lifting |

## Inspected (from the rendered MP4)

- 0–2.5 s at every second frame (38 frames).
- The first 2 s side by side with V1 and the hook preview at 0, 0.25, 0.5, 0.75, 1, 1.5 and 2 s:
  - **V2:** the figure is half liquid and buckling at frame 0, a heap with the head going at 0.25 s, a pool at 0.5 s and pushing out between the bars by 1.0 s.
  - **V1 and the preview:** the figure is still standing at 0.5 s.
  - V2 is clearly the most dramatic of the three.
- Transition strips:
  - 8.7–11 s (section heat and melt → pull-back → collapse on the coil);
  - 10.3–11.7 s (steer window);
  - 12–14 s (overhead freeze);
  - 18.7–21.3 s (streams → meet → fingers → crown → freeze);
  - 23–26 s (carry-out → cage).
- Sample times: 0, 0.25, 0.5, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 25.5 and 25.97 s.
- Captions: the per-occurrence emphasis is unchanged from the V1 fix and was checked at the sample times.
- Deliverables extracted from the MP4: `exports/FGW_Liquid_Metal_Robot_V2_FIRST_FRAME.png` and `exports/FGW_Liquid_Metal_Robot_V2_CONTACT_SHEET.png` (one frame per second).

## Unresolved issues (honest)

- **First-frame figure:** on frame 0 the upper body (chest and head) is partly see-through over the cage's back bars. The solid and liquid layers cross-fade as the melt front climbs. At phone size it reads as a metal figure, but up close the head looks slightly glassy for the first ~6 frames.
- **Phase-change cue:** the warm orange glow on the particles is an illustrative heat cue, not a real colour change. The particle chaining in the steer window is exaggerated for visibility.
- **Steer window:** the window on the puddle (10.6–13.6 s) is a magnified inset drawn on the puddle's top surface. It reads as "looking into the metal", but it is a stylisation and has no separate magnifier object.
- **Pull-back speed:** the pull-back out of the section at ~9.7 s is the fastest move in the film (frame-difference peak 32). It is eased and continuous, but quick.
- **Grip:** reads as a four-finger cage. The finger tips have some small bumps where blobs meet, and the far fingers are partly hidden by the ball.
- **Loop:** the final frame is the cage on the live coil with the retrieved grip just starting to soften inside it. Frame 0 has the figure in the cage, so the loop matches the composition and the softening action, but not the exact object.
- **Unchanged from V1:** scale and timing are compressed, the wrap covers more of the ball than "melted slightly", and the stomach model is stylised.

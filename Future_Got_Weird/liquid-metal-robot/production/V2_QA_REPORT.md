# Liquid Metal Robot V2: QA report

File: `exports/FGW_Liquid_Metal_Robot_V2_FINAL_REVIEW_1080x1920.mp4` (render 4 of V2, after the coordinator's opacity fix). Measured with
`tools/qa_clip.py <mp4> v2` on the MP4 (`qa/v2/qa.json`).

## Measured

- **Checks:** all pass.
  - Video: H.264 High, 1080×1920, 30/1 fps, yuv420p, BT.709; 780 frames; 26.000 s.
  - Audio: AAC; decoded 26.005 s (within ±25 ms).
- **Audio:** voice onset 0.039 s; integrated −16.21 LUFS; sample peak −0.94 dBFS. mix_v2 build: voice −15.94 LUFS, fx bus −31.3 LUFS after ducking.
- **Motion:** longest near-static run 0 frames. Mean frame difference per second: 14.7, 17.4, 8.7, 6.2, 11.3, 18.5, 13.0, 6.3, 7.7, 15.8, 12.5, 13.9, 3.8, 7.6, 6.5, 3.5, 2.2, 5.3, 6.5, 2.4, 1.6, 4.4, 7.5, 3.7, 4.9, 16.5.
  - The first second is up from 12.2 (V1) to 14.6, reflecting the faster collapse.
- **Frame-difference flags over 18:** I inspected each run as a frame strip. All are eased continuous moves, none are cuts.

  | Frames | Peak | What it is |
  |---|---|---|
  | 33–47 | about 22 | the opening pull-back over the coil |
  | 157–170 | 31 | the push into the chest (same in V1) |
  | 201–204 | about 19 | the cut window opening |
  | 279–282 | about 20 | the section closing |
  | 292–300 | about 31 | the pull-back out of the section |
  | 763–775 | about 23 | the final descent to the cage and the magnet lifting |

## Inspected (from the rendered MP4)

- Opacity-fix pass (render 4):
  - Full-resolution frames at 0, 3, 6, 12, 18, 30, 180, 290, 300, 310 and 610–660 (every 10 frames), plus a crop of frame 0. The solid figure is opaque everywhere, with no ghost head, no see-through banding and no torso ring.
  - The 0–2.5 s strip at every second frame.
  - First frame and contact sheet regenerated from this MP4.

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

- **Frame 0 figure:** fixed in render 4 (now opaque). The liquid lower body is a bright, fairly flat slab with a hard rippling wet line where it meets the solid. It is clearly liquid metal below solid metal, but the slab is graphic rather than detailed.
- **Phase-change cue:** the warm orange glow on the particles is an illustrative heat cue, not a real colour change. The particle chaining in the steer window is exaggerated for visibility.
- **Steer window:** the window on the puddle (10.6–13.6 s) is a magnified inset drawn on the puddle's top surface. It reads as "looking into the metal", but it is a stylisation and has no separate magnifier object.
- **Pull-back speed:** the pull-back out of the section at ~9.7 s is the fastest move in the film (frame-difference peak 32). It is eased and continuous, but quick.
- **Grip:** the six-finger grip shows the blue ball through one off-centre window, so it no longer reads as a face. The trade-off is that less of the ball is visible once it is gripped, and small bumps where finger blobs meet remain on the top.
- **Loop:** the final frame is the cage on the live coil with the retrieved grip just starting to soften inside it. Frame 0 has the figure in the cage, so the loop matches the composition and the softening action, but not the exact object.
- **Unchanged from V1:** scale and timing are compressed, the wrap covers more of the ball than "melted slightly", and the stomach model is stylised.

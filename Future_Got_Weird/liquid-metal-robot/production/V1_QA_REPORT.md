# Liquid Metal Robot V1: QA report

File: `exports/FGW_Liquid_Metal_Robot_V1_REVIEW_1080x1920.mp4` (final render 4, after the coordinator's targeted fix pass). Measured by `tools/qa_clip.py` on the MP4 (`qa/v1/qa.json`).

## Measured

- **Checks:** all pass. H.264 High, 1080×1920, 30/1 fps, yuv420p, BT.709; 780 frames; video 26.000 s; AAC; audio decoded 26.005 s (within ±25 ms).
- **Audio:** voice onset 0.039 s; integrated mix −16.21 LUFS; sample peak −0.94 dBFS; mix_v1 build: voice −15.94 LUFS, fx bus −31.8 LUFS after ducking.
- **Motion:** longest near-static run 0 frames. Mean frame difference per second: 12.2, 18.6, 9.0, 6.2, 11.2, 18.9, 12.8, 19.1, 4.4, 4.8, 9.3, 8.4, 2.9, 4.6, 4.8, 3.6, 2.2, 5.3, 6.5, 2.4, 1.6, 4.5, 7.6, 3.9, 4.0, 10.5.
- **Frame-difference flags over 18:** these appear at frames 26–49 (the preview's own pull-back over the copper coil, the same as in the preview), 157–171 (the exponential push into the chest, peak 31), and 199–203, 211–216 and 228–238 (the faster pull back out of the section, peak 30 at frame 231). I inspected these as frame strips: they are continuous eased zooms over textured surfaces, not cuts. The pull-back peaks at the same level as the approved push-in.

## Inspected (from the rendered MP4)

- Fix-pass strips: 7.4–9.0 s every 0.2 s (coil in view by 7.8 s, legs liquid by 8.6 s); 15.0–17.5 s every 0.3 s (the reveal: J-shaped model with rugae, ball inside, slug in the tube, C-core coil behind); 18.5–22.5 s every 0.4 s (the pink interior behind the ball, no concentric rings). Captions were checked at every sample time.

- Frames at 0.0, 0.25, 0.5, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 25.5 and 25.97 s.
- Frame strips across 4.8–8.8 s (every 0.2 s), 13–19 s (every 0.3 s) and 20–26 s (every 0.3 s).
- Full resolution at 7.0, 20.3 and 21.4 s.
- First 6 s compared side by side with `hook-previews-10/exports/FGW_HOOK_04_LIQUID_METAL_ROBOT.mp4` at 0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4 and 5 s. The opening matches frame for frame. The only differences are slightly smoother flat-liquid shading, a pad coil with one more turn (so the figure later stands over copper) and the set-down finishing ~0.5 s sooner.
- Deliverables: `exports/FGW_Liquid_Metal_Robot_V1_FIRST_FRAME.png` (frame 0 of the MP4) and `exports/FGW_Liquid_Metal_Robot_V1_CONTACT_SHEET.png` (one frame per second, 0–25 s), both extracted from the MP4.

## Unresolved issues (honest)

- **Gripping shape:** the wrap and grip are the film's strongest liquid moment, but the climbing film in front of the ball shows some fine striated lighting texture (height-field artefacts from many small blobs). The finished grip still reads a little like a socket rather than fingers.
- **Cross-section:** the section is clean and readable but fairly flat (a single polished plane with a moving sheen). It is not as layered as the Cyborg Cockroach V5 cutaways.
- **Stomach model:** it is a stylised translucent J-shaped shell; its lesser-curvature notch still makes it read slightly bean/C-like from some angles. In the close-ups, the C-core coil's copper prongs sit partly behind the caption at the top edge.
- **Pull-back:** the faster pull back out of the section (7.0–7.9 s) passes a plain chest for about 0.2 s (around 7.6 s, between sentences). In 12–13.5 s, the cooling puddle changes mostly by its freeze front and the camera drift.
- **Loop:** the ending returns to the cage, coil and mould with the grip beside them, but the cage is empty. It loops to the cage, not to a figure.
- **Caption emphasis:** it is now per occurrence and matches the creator's list. "remolded" is not yellow (it was in the preview), as the list specifies.
- **Simplifications:** the timing and scale are compressed. The wrap covers more of the ball than "melted slightly". The particle sizes are illustrative.

# QA report: FGW_Robot_Escapes_Jail_V1_REVIEW_1080x1920.mp4

Review file: `exports/FGW_Robot_Escapes_Jail_V1_REVIEW_1080x1920.mp4`. Not published or uploaded anywhere.

## Measured

| Check | Result |
|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p (BT.709), AAC 320 kb/s, 972 frames, 32.40 s, 25.7 MB |
| Decode | full decode, 0 errors; no black frames |
| Frozen frames | longest near-static run is 9 frames (0.30 s, at 27.53 s); limit ~2 s |
| Single-frame jumps | none. Every large frame-to-frame change is a planned cut or a continuous move: the whip (2.77–3.0), the S4 pull-back to the guard (12.27–13.1), the S5 push into the chest (16.67–16.8), and the S6 cutaway opening and closing over the grains (17.4–18.97) |
| Loop | the droplet's eyes on the last frame land exactly on frame 0's eye positions, size and gaze; the alarm sweep phase is continuous; the music bed and alarm run through the loop point without a click |
| Mix | −14.01 LUFS integrated; true peak −1.60 dBTP; voice sample-exact to the master; music 18–22 dB under the voice inside words; main SFX 10–14 dB under |
| Narration over the final mix (ASR) | zipformer: every word; the only differences are British spellings ("moulded", "any more"). Whisper: word-perfect up to its 30 s window, the tool's own limit |
| Determinism | renders are pure functions of t; identical frames on re-render; all SVG ids per frame |

Files: `production/render_qa_V1.json`, `production/asr_final_mix_V1.txt`, `audio/mix/mix_measure_v1.json`.

## Inspected by eye

- **First 3 s, every 2nd frame** (`production/qa_hook_0-3s.png`):
  - Frame 0 already shows the payoff: the robot is half-through the gap, liquid lower body pooling toward the viewer, upper body humanoid, cyan eyes on the viewer.
  - The red alarm is on, the guard is at the right with his coffee, and the camera is already moving.
  - At 0.8–1.2 s the eyes widen, then glance at the guard.
  - At 1.47 s he does his take and the cup leaves his hand.
  - On "MELTING" (2.13–2.87) the robot surges down into liquid while the eyes stay.
  - The camera whips down after the falling cup.
- **Every shot boundary** (`/tmp` sheets were regenerated from the final file):
  - **S1→S2:** the top-down coffee splash circle (540, 980, r 150) match-cuts to the robot's round head at the same spot and size.
  - **S4→S5:** the silver puddle match-cuts to the same outline in a lab dish.
  - **S5→S6:** pixel-continuous through the metal surface.
  - **S6→S7:** the field line is pixel-identical across the cut.
  - **S7→S8:** a deliberate cut back to the jail.
  - **S8→S1:** the eye-matched loop (`production/qa_loop_seam.png`).
- **Captions:**
  - Phrases are 2–5 words, synced to the measured word times, and stay inside x 30–870 and y < 1450.
  - They are moved per shot so they never cover the robot's face. In S1 they sit on the empty wall at the left, away from the guard's cup hand. In S8 the last line sits on the floor while the guard looks down.
- **Science** (see `SCIENCE_NOTES.md`):
  - Gallium plus magnetic particles.
  - The 29.8 °C melting point is shown below the 37 °C body mark.
  - Heat comes from an induction coil (AC field) and is drawn orange.
  - The magnet steers it and is drawn in cyan, kept separate from heat.
  - Gloved hands collect the metal and mold it.
  - The stomach is labelled STOMACH MODEL / LAB DEMO (2023), and the human body is shown only as a dotted "FUTURE IDEA".
  - The robot never reassembles itself; S8 shows only eyes opening on a droplet.

## Fixed during review (V1)

1. **Coffee splash before the S2 match cut:** it looked like a spiky brown ball. It is now a flat glossy spill, deep brown thinning to amber at the edge, with a light-streak reflection. The circle the match cut needs is unchanged.
2. **Robot's frame-0 expression:** the mood-0.78 squint read as sweet (`^^`). It is now a mischievous lower-lid squint with the eyes clearly on the viewer, and the loop's last frame inherits it automatically.
3. **Caption placement:**
   - S1 captions moved off the guard's coffee hand and face.
   - S8's last line moved below the action while the guard's head crosses the top band.
4. **Critique-pass fixes, per shot:**
   - **S1:** a hard-edged bar reflection in the liquid; the arms flattening into a tray during the melt; the guard's face pushed off-frame.
   - **S8:** the guard's hands and cup jumping at the loop; the droplet passing under his shoe instead of in front of it.
   - **S2–S4:** the guard's face was never shown in S4; a one-frame floor-light pop; a one-frame camera-aim jump; a near-static 9.0–10.4 s.
   - **S5:**
     - an ice-like cooling slab (wrong: it cools passively in room air);
     - a lid-hand arm sweep;
     - two right hands;
     - the re-formed figure on show for only 0.15 s;
     - the caption over the robot's eyes.
   - **S6:**
     - a stray field dash;
     - dipole field lines drawn from the magnet's middle;
     - a mislabelled GALLIUM grain;
     - crowded labels;
     - the steered liquid as a perfect ball;
     - the caption over bright grains.
   - **S7:**
     - the melt glow had no visible heat source (AC-field arcs added);
     - the oesophagus draw-on;
     - unreadable ending labels;
     - the magnet crowding the captions.

## Remaining limitations

- **Audio not heard.** There is no playback in this environment, so the narration take, SFX timbre, the guard's synthesised "hm?!" and the music's catchiness were judged by measurement and transcription only. Please listen on headphones and a phone speaker.
- **Loop seam set offset.** At the cut from the last frame to frame 0, the eyes match exactly but the set and guard shift about 200 px vertically. The droplet's eyes sit near the floor and the robot's sit higher, so matching them forces it. It plays as an eye-match cut.
- **Fast push at 16.67–16.8 s (S5→S6):** about 0.13 s of zoom into the robot's chest, forced by the hand-off window. It may read as a zoom punch.
- **S4 pull-back at 12.2–12.5 s** is the fastest move in S2–S4 (close to a whip; motivated by the alarm).
- **S4 doesn't show the magnet** that guided the liquid through the bars. Heat versus magnet is explained in S6.
- **S2–S4 read as a flashback** to before the escape, so the guard holds his coffee there even though S1 shows him dropping it.
- **Scale cheat in S5:** the whole puddle fits in one pipette and one pipetteful fills the mold.
- **Small subjects on a phone:** the S8 droplet (about 110 px wide) and the S7 device in the wide view.
- **Caption contrast over bright surfaces:** white captions over the bright metal at 16.9–17.45 s rely on their dark stroke.
- **Sources to confirm.** The science check worked from search summaries because the paper pages wouldn't load here. Before publishing, check two primary sources:
  - the Video S2 caption in the paper's Supplemental Information;
  - the Cell Press release.

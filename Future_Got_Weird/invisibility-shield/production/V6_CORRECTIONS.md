# FGW Invisibility Shield V6: corrections and verification

- **File:** `exports/FGW_Invisibility_Shield_V6_FINAL_1080x1920.mp4`
- **Project:** `source/src/v6/` (composition `InvisibilityShieldV6`), copied from V5. V1–V5 are untouched.
- **Render:** native, straight from the source composition; nothing was upscaled. Checked with ffprobe on the file: 1080×1920, 30/1 fps, 878 frames, 29.269 s.
- **Audio:** the approved V5 mix (`mix_v5.wav`) is used unchanged: narration, music and sound effects.
- **Status:** not published, and not marked approved.

## Corrections

### 1. Shield-lowering reveal (23.6–25.9 s)

The shot is now one continuous shot from the guard's own viewpoint, with his flashlight hand in the foreground.

1. **23.6–23.75:** she is crouched and fully hidden behind the panel.
2. **23.72–24.12:** she half-stands and lifts the panel with both hands on the grips, staying covered. Her elbows were re-aimed so nothing pokes past the panel's edges.
3. **24.12–24.78 ("lower the shield"):** she lowers it straight down to the floor. Its top edge uncovers her hair, then her eyes and face; the panel stays facing him. This lines up with the existing panel-down thunk at 24.78.
4. **24.85:** his startle registers in his view: the flashlight jerks up and his open hand flies into frame.
5. **25.25–25.8 ("and reveal you were standing"):**
   - She slides the panel aside to her right, still facing him, which uncovers her whole body.
   - Her right hand stays on the panel and travels with it.
   - Her left hand lets go and gives a small wave.
6. **25.9:** the cut to his close-up opens on a wide-eyed, open-mouthed shock (previously it read as a smile).

The panel is then stood on its edge off screen, during his close-up, so the bolt continues as before.

### 2. Handcuffs (26.1–27.95 s, and the loop)

- **Grip:** a new prop (`Cuffs6.tsx`) is drawn in the hand's own frame.
  - One cuff passes through his fist and comes out of the lower side, with finger lobes drawn over the metal.
  - A three-link chain hangs from that cuff's lowest point, with the second cuff on the end.
- **Swing:** the hanging cuff is a damped pendulum driven by the real on-screen motion of his wrist, limited to about 34°. The click at 27.08 opens the hanging cuff's jaw about its hinge.
- **Entrance:** the cuffs come from a new pouch on his belt.
  - In his close-up, his hand goes to the pouch, drawn in front of his torso.
  - The cuffs come out hanging from his fist and rise with his hand.
  - Previously a ring floated near his belt.
- **Close-up insert:**
  - The forearm comes in from the lower left.
  - The gripped cuff is in his fist and the second cuff hangs below, clear of the arm (previously it hung beside the forearm).
- **Exit and loop:**
  - The cuffs stay in his fist through the bolt and the chase into frame 0. They used to vanish mid-shot at 28.07.
  - In the opening chase he reaches after her with the cuffs in his fist.
  - He stows them in the pouch at 2.5–2.9 s, while his hand is out of shot.
  - The pouch then stays visible through the middle of the film.

### 3. Light-ray explanation (8–12 s)

- **Fewer paths:** four representative paths, appearing one after another:
  - from her face, then her shirt, in warm light;
  - from the wall stripe, then the lab-door glow, in teal.
- **Fewer rays:** each ray enters one ridge and fans out in three directions (straight through, plus the two sideways extremes), down from about 55 overlapping lines.
- **Consistent styling:** one colour per source and the same stroke width throughout, with a dark under-stroke so her rays read against her shirt.
- **Kept:** the lens geometry, her figure and the narration are unchanged.

### Small supporting fixes

- In the reveal, the caption was moved below his flashlight forearm.
- In his close-up, the caption was moved below the cuffs.
- The rig was extended so a hand can be forced in front of the torso (used for the pouch), and hand-held props receive the hand's angle.

## Verification

| Check | Result |
|---|---|
| Dimensions and frame rate (ffprobe, decoded) | 1080×1920, 30 fps, 878 frames, 29.269 s |
| Audio | Identical to the V5 mix: sync 0.0 ms, correlation 0.99997, −14.6 LUFS. The transcript of the file's audio has WER 0.065, the same recogniser diffs as V1–V5. |
| Captions | Unchanged words and timing; 19/21 ASR windows match (the same 2 recogniser misses). |
| Rig (every frame, `qa/v6/rig_qa.json`) | No new issues. Remaining: one frame (21.87 s), the same guard-leg frame as V5, inside a POV shot where his legs are off screen. Her arm peaks at 9.97 u of reach at 25.73, just under the 10 u limit (a straight push). |
| Motion (`qa/v6/motion_scan.json`) | No stretch below 0.8 for 0.4 s or more. No black frames, and no freezes of 1 s or more. |
| Frame-by-frame on the corrected actions (every 2nd frame) | Checked in `qa/v6/strips/reveal_a`, `reveal_b`, `cuffs_a`, `cuffs_b` and `bolt`, plus full-resolution zooms of the hands. These are the checks that found and fixed: her elbow past the panel edge, her right hand reaching across her body in the slide, the cuffs swinging sideways in the lunge, and the floating ring at the belt. |
| Picture loop (last frame to first) | Mean change 9.24, against 9.09 and 8.02 for the preceding frame steps: indistinguishable from a normal step. Rig seam 0 for both characters. |
| Audio loop | Last-to-first sample jump 0.034, against a 99th-percentile ordinary step of 0.13. The 50 ms either side measures −24.5 dB and −23.8 dB, so there is no click and no level jump. |

## Not done

**Watching at normal speed with audio.** No one has watched or listened to this file in real time. This environment has no display and no speakers. Every check above is frames, strips, zooms and measurements. Someone should watch it on a phone with sound, a few times round the loop, before it is called final.

# Tooth in Eye V3: the hook rebuilt on V2

**Status.** A V3 final-review version, rendered from source and checked from the files. **It has not been watched or
heard in real time** (this environment has no display or speakers), and "TEN YEARS blind" still needs a confirmed
source. Both must be cleared before it is called publish-ready.

**Deliverable.** `exports/FGW_Tooth_Eye_V3_FINAL_REVIEW.mp4`
- 1080×1920, 30 fps, 810 frames, 27.0 s;
- H.264 High yuv420p bt709, CRF 16, AAC 320 kb/s.

**Source.** `source/src/Scene3.tsx` (composition `ToothEyeV3`), with `profile2.tsx` (new exterior OOKP eye),
`Captions3.tsx` and the shared V2 files. `Scene2.tsx` stays in the tree; V2's composition and sound events are at commit `82638d8d`.

**Narration.** The same V2 master (`audio/narration/FGW_Tooth_Eye_narration_V2.wav`), the same word times, the same
captions. Nothing was re-voiced or re-timed; the picture was fitted to the words.

## What changed from V2, and why

| Brief point | V2 | V3 |
|---|---|---|
| Frame zero | A cross-section of the eye: the viewer had to read a diagram first | **His face in profile, close on his eye**: brow, lashes, cheek, beard. The finished OOKP eye between wide lids. The tooth plate shows through the pink cheek-lining graft, and the clear cylinder stands proud at the centre, like a pupil. |
| 0.3–1.0 s | | **Smooth push toward the implant.** The graft film thins (0.3 → 0.12) so the tooth-and-bone plate holding the cylinder reads clearly: root, canal and cut-neck section, with the cylinder through it. |
| 1.0–2.0 s | | **The lids and skin dissolve into the cut-away round the unmoving implant** (0.55–1.1 s), so the plate never jumps. The camera pulls out to the whole eye section. Light enters the cylinder at 1.02 s, crosses the vitreous, and the retina lights at about 1.85 s. |
| 2.0–4.0 s | A slow push on his profile | **Back to him:** the window closes onto the same exterior eye, and he smiles (2.85–3.3 s, on "SEE AGAIN"). Then a **one-second glimpse of his own view** (3.34–4.36 s): his hospital room, blurred, sharpening fast. This previews the payoff without spending it: no hands, no tear. |
| 4.4–7.8 s cornea | Three separate close-ups | **One continuous push** from his whole face to the damaged eye. Penlight glare, donor graft, red reflex, then clouding, all in a single move. |
| 8–22 s | Tooth, drill, cylinder, pocket, growth, seating, light | Kept from V2 unchanged (the strongest sequences). |
| 23–25 s POV | Blur to clear | **A stronger focus pull:** it holds blurred and dim longer, then snaps into focus (24.0–24.4 s) with a small focus overshoot that settles. His hands rise as it clears. |
| 25–27 s and loop | The cut-away re-opened to a section frame zero | **His reaction, then the camera pushes into his eye.** It lands exactly on frame zero (the exterior implant close-up). This is one continuous approach curve across the seam. The pad crossfades back to the opening tone. |
| Sound | | Re-cued to the new hook: light shimmer at 1.02 s, retina chime at 1.85 s, a soft wet slide under the dissolve, a warm chime and brighter room air for the 3.34 s glimpse. The V2 loop-rays cue was removed. |

## Timeline (V3)

| Time (s) | Narration | Picture |
|---|---|---|
| 0.0–0.3 | "Doctors put a TOOTH…" | His eye, the implant at its front (exterior) |
| 0.3–1.0 | | Push in; the graft thins, revealing the tooth-bone plate round the clear cylinder |
| 0.55–1.1 | | Lids and skin dissolve into the cut-away round the implant |
| 1.0–2.0 | "…inside this man's EYE…" | Pull out to the eye section; light down the cylinder to the retina (lit ≈1.85) |
| 2.0–3.3 | "and he could SEE AGAIN." | The window closes on his eye; he smiles |
| 3.34–4.36 | | **Cut** to his view: his room sharpens |
| 4.36–7.8 | "His cornea … wouldn't work." | **Cut** to his face; one push to the damaged eye; glare, graft, red reflex, clouding |
| 7.7–23.0 | (as V2) | Tooth out, plate, drill, cylinder; under the skin; growth; seating; the light rides to the retina |
| 23.0–25.1 | "After TEN YEARS blind…" | Dark and milky → a sharp focus pull on his room; his hands |
| 25.09–27.0 | "he could see again." | **Cut** to him: smile, tear; push into his eye → frame zero |

## Measured QC (`qa/v3/qc.json`)

**Container.** 1080×1920, 30/1 fps, 810 frames, 27.0 s; no black frames (blackdetect).

**Single-frame jumps.** Only the three deliberate cuts:
- 101 (3.37 s): his face → his view (the glimpse);
- 131 (4.37 s): his view → the front-on damaged eye;
- 755 (25.17 s): his view → his face.

There are no other spikes. The push, the dissolve, the pull-out and the close all run as continuous curves; there are no whips.

**Loop seam.** The mean frame difference is 9.35, against 6.8–9.2 for the opening's own steps
(`qa/v3/loop_last_vs_first.jpg`). The camera, the implant and the exterior eye are continuous; most of the remainder
is the caption change.

**Audio.** −13.6 LUFS integrated, −1.6 dBTP (`audio/mix/mix_measure_v3.json`).

**Narration (ASR on the MP4's own audio).**
- Zipformer: 0 differences.
- Whisper base.en: one difference, "ten" written as "10".

**Evidence.**
- `qa/v3/hook/frame0.png`;
- `qa/v3/hook/hook_5fps.jpg` (0–4.4 s at 5 fps);
- `qa/v3/sheet_2fps.jpg` (the whole film);
- `qa/v3/first.png` and `last.png`.

## Retention check (first 3 s)

1. **Frame zero reads without a diagram:** a man's face, his eye, and something embedded in it: a clear lens set in an
   ivory plate.
2. **The tooth.**
   - The plate is seen three-quarter on: root, canal and cut-neck section.
   - "TOOTH" is spoken at 0.84 s, while the push is revealing the plate.
3. **How it works is shown by 2 s:** the same implant in section, with light passing through the cylinder to the retina.
4. **The payoff is promised by 4 s:** his smile and a glimpse of what he now sees.

## QC against the brief's list

- **Identity:** the same man throughout. Dark hair, the same short beard and moustache, the same skin and gown; the
  damaged eye is always his right.
  - The exterior eye at the start and the end is the same drawing.
  - There are no beard shifts across cuts.
- **The implant:** one model throughout.
  - The tooth always comes from the upper-left canine, and there is no crown on the finished plate.
  - The cylinder always passes through the plate's hole.
- **Clipping and tools:** checked frame by frame in the 2 fps sheet and the working sheets.
  - The drill bit is hidden below the plate surface.
  - The tools are held from off frame and never float.
- **Sections:** the eye section, the window and the light path are the same at 1–2 s and at 19.7–23 s.

## Unresolved (honest list)

1. **Not watched or heard in real time.** Pace, levels and legibility were checked from frames, measurements and ASR.
2. **"TEN YEARS blind" is unverified** (see `production/V1_NOTES.md`).
3. **The cut-away window closes for about 0.3 s round 2.3–2.6 s.** A small warm spot (the lit retina) shows in the
   shrinking window before it fades.
4. **The graft is drawn semi-transparent** over the plate so the tooth reads. In reality the plate is covered by
   opaque cheek-lining graft, with only the cylinder visible.
5. **Carried over from V2:**
   - the object-led dissolves at 10.05–10.32, 13.8–14.1 and 19.7–19.88 s, where the teeth briefly ghost through the
     drape at about 10.1 s;
   - the stylised section, with the plate drawn over the cut edge;
   - the 25% tissue sheath;
   - simplified hands, room and lower teeth;
   - the eyes drawn 1.25× in the front view;
   - a 0.25 s warm glow at the fovea (22.6–22.9 s).

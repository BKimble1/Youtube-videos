# QC report: Parasite Tongue V2 (targeted visual and retention pass)

| File | Purpose | Details |
|---|---|---|
| `exports/FGW_Parasite_Tongue_V2_1080x1920.mp4` | Final master | H.264 High, 1080×1920, 30 fps, yuv420p, bt709. 720 frames, 24.00 s, all decoded without error. AAC 320 kb/s, −13.4 LUFS, −1.5 dBTP. 30.7 MB. No burned-in text. |
| `exports/FGW_Parasite_Tongue_V2_REVIEW_timecode.mp4` | Review copy (notes only, not for upload) | The same picture and sound, with timecode, frame number and the current beat burned in at the top left. |

V1 (`exports/FGW_Parasite_Tongue_FINAL_1080x1920.mp4`) is kept for comparison.

**What was kept:**
- the narration, word for word (same master and same word timing)
- the 2D/2.5D vector look
- the parasite model: 7 pereonites, 5 pleonites, pleotelson with uropods, 7 leg pairs with hooked dactyls
- the mouth anatomy, water, grade and sound palette

**What changed:** the timeline and camera, a new 3D tongue, a brighter mouth interior, and new sound events. V2 uses only the
3D mouth set, so every shot shares one camera space and one scale; the V1 side set is no longer used.

**How it was checked.** This was checked from the files, not watched in real time:

- `tools/qc.py` measures per-second motion, the loop seam, black/frozen frames and loudness, and runs two ASR models on
  the muxed audio. Results are in `qa/v2/qc_measure.json`.
- Contact sheets:
  - `qa/v2/first_three_seconds_every3.png` (frames 0–87, every 3rd)
  - `qa/v2/every_half_second.png`
  - `qa/v2/loop_seam_f708-719_f0-11.png`

**A person needs to watch it once at full speed with sound before publishing.**

## Narration

| ASR model | Result on the muxed V2 audio |
|---|---|
| Whisper base.en | **0 differences** |
| Zipformer | "on to" for "onto" only |

## Beat by beat (keyed to measured word times)

| Time | Narration | Picture | Check |
|---|---|---|---|
| 0.00–0.45 | "If this parasite…" | Fish face, mouth half open; it snaps open. The parasite is visible in the mouth from frame 0, lifting its head and re-gripping. | First frame is readable: no dark opening (the interior was relit and the throat lightened). |
| 0.45–2.00 | "…gets inside a fish," | A fast, smooth push through the lips onto the parasite, its legs stepping in place. | Motion 5.1 and 7.8 for these seconds. |
| 2.00–3.30 | "it can replace its entire tongue." | Rewind (desaturated, faint scan bands, reversed sound): the stub grows back into a whole tongue with surface vessels while the adult shrinks back to a juvenile on it. | The tongue, the parasite and the mouth are all in one shot. |
| 3.30–4.00 | | The juvenile backs fast across the floor into a gill slit (rewinding its route). | |
| 4.00–6.53 | "It crawls through the gills, latches onto the tongue," | Forward again: it squeezes out between two gill arches, crawls down the wall, crosses the floor, climbs the tongue and grips on "tongue" (6.53). | One continuous camera move from the gills to the tongue. |
| 6.53–9.05 | "and starts stealing its blood." | The camera circles low to the side. The claws hook into the tongue; a bead of blood forms at the mouthparts on "starts"; flow pulses run along the vessels; the translucent gut turns red. | The orbit reveals the claws, then the bite. |
| 9.05–11.6 | "Eventually, the tongue withers away." | A high three-quarter view: the tongue shrinks toward its base, pales, wrinkles and its vessels fade. The parasite widens over it, legs letting go and re-gripping in turn (new attachment points, not a jump). The light through the mouth dims three times for days passing. | A gradual, staged change; no instant transformation. |
| 11.6–13.9 | "But here's the disgusting part." | A sweep along the adult's side: claws anchored in the stub and the floor. | The closest approach is very close (about 12.8–13.1 s), so the legs are large in frame. |
| 13.9–15.9 | "The parasite stays attached, becoming…" | Over its back to a head-on view inside the mouth. The mouth pumps, and the parasite presses and flexes like a tongue. | |
| 15.9–17.1 | "…the fish's new tongue." | The camera backs straight out through the lips; the face fades in around the mouth. The camera then drifts and rolls slightly as the fish swims. | An interior-to-exterior move with no turn or whip. |
| 17.6–20.9 | "And the fish keeps eating," | A shrimp drifts in; the jaws snap on "eating" (18.70); the parasite pushes it back; two chews; swallow (19.95); reopen (20.4). | |
| 20.9–22.4 | "…with a living parasite inside its mouth." | A push in as the parasite rears its head up at the camera, legs flexing. | |
| 22.4–24.0 | | Pull back to the opening frame; the mouth eases half shut. | Frame 719 vs frame 0 differs by 0.78 (mean absolute, grey levels), against a median frame-to-frame step of 5.44. Frames 708–719 flow straight into 0–11. Audio seam jump is 0.002. |

## The brief's animation QC

| Item | Result |
|---|---|
| Meaningful progression every second | The lowest per-second motion is 3.1 (V1's feeding close-up was 0.6). The longest near-still run is 0 frames. |
| No long static mouth shots or repeated side pans | The mouth shots are each about 1.5 s or less, with the camera moving. The V1 side pans are gone. |
| No floating anatomy | The parasite is always on the tongue, the floor or the gill wall, with its claws in contact. The tongue is part of the floor. |
| No jerky cuts or whips | There are no cuts: one continuous camera for all 24 s. The rewind is a look change, not a cut. |
| Consistent anatomy and scale | One parasite model and one mouth throughout. The adult always sits at the same place on the stub. |
| No plastic 3D | Flat-shaded vector planes with soft blur, specks and glints, keeping the existing look. |
| Sound | Wet tissue, claws, feeding draws and the jaw snap are placed on visible events (`audio/sfx_log.json`). Effects and beds are about 19 dB under the voice while it speaks. The loop tail carries the re-grip and breathing (not silent). |

## Notes and open items

- The rewind uses a visual convention: desaturation and three faint white scan bands drifting upward for 2 s. If that
  reads too "video effect" for the channel, it can be dropped to desaturation only.
- The juvenile is small while it crawls down the gill wall (about 4.0–4.8 s).
- The voiceless tail after the last word is still 2.7 s, because the narration is unchanged.
- Runway was not used (same reason as V1: generated clips can't hold this model's anatomy across shots).

# QC report: FGW Short 1, "The parasite that replaces a tongue"

**Deliverable.** `exports/FGW_Parasite_Tongue_FINAL_1080x1920.mp4`

| Property | Value |
|---|---|
| Video | H.264 High, 1080×1920, 30 fps, yuv420p, bt709, CRF 16 |
| Frames | 720 frames, 24.00 s; all decoded without error |
| Audio | AAC 320 kb/s, 48 kHz stereo |
| Loudness | −13.5 LUFS integrated, −1.6 dBTP true peak |
| Size | 26.7 MB |
| Burned-in text | None |
| Captions | SRT in `captions/` |

**How it was checked.** A machine can't watch or listen in real time, so this was checked from the files:

- `tools/qc.py` decodes every frame and measures per-second motion, frozen/black frames and the loop seam, then
  measures loudness and runs two ASR models on the muxed audio. Results are in `qa/qc_measure.json`.
- Two contact sheets: `qa/first_second_every2.png` (frames 0–28, every other frame) and `qa/every_half_second.png`
  (one frame every 0.5 s).
- `qa/loop_seam_f0_f719.png` puts frame 0 next to frame 719.

**A person still needs to watch it once at full speed with sound before publishing.**

## Script and sync

| Check | Result |
|---|---|
| Narration | The approved script word for word, never rewritten (`production/NARRATION_LOCKED.txt`). |
| ASR on the final MP4 | Whisper base.en: **0 differences**. Zipformer: 1 spelling difference only ("on to" for "onto"). |
| Narration span | 0.00–21.29 s; no gap between phrases longer than 0.66 s. |
| Sync | Every picture beat is keyed to measured word times (`source/src/data/timeline.json`), not to the brief's nominal storyboard seconds. See the table below. |

## Timestamped checks

| Time | Beat | Check | Result |
|---|---|---|---|
| 0.00 | Hook frame | Inside the open mouth: a pink, fleshy "tongue" wriggling, framed by teeth, throat and gill arches. No intro, title or silence; the voice starts on frame 0. | Pass. **Note:** its eyes and faint segment lines are visible from frame 0, so it reads as a strange tongue that is clearly alive rather than a plain tongue. That is deliberate, so the reveal stays readable. |
| 0.35–0.85 | Reveal | The pink drains, segment margins darken, the seven leg pairs unfold and the claws grip (frames 12–26). | Pass. |
| 0.85–1.42 | Pull back | The fish's face, mouth open, parasite inside. | Pass |
| 1.42–2.47 | Through the gills | One move over the parasite into the throat, between gill arches 2 and 3, filaments filling the frame. | Pass. The slit at 2.27–2.33 passes close to an arch bar (a soft pale band for about 3 frames). |
| 2.33–2.47 | Dissolve | Gill arches (front view, inside) into the side cutaway of the same arches. | Pass |
| 2.47–4.50 | Entry route | The cutaway closes as the camera pulls out to the head's left side; the juvenile swims in to the gill cover's edge. | Pass. The juvenile is small (about 130–160 px) but contrasted against the skin and moving. |
| 4.50–6.53 | Crawls in, latches | It goes under the gill cover, the cutaway opens, it crawls over the arches into the mouth and grips the tongue on "tongue" (6.53). | Pass |
| 6.53–9.05 | Feeding | Claws in the tongue, artery pulsing through the tissue, blood drawn up into its mouth from "starts" (7.07), the gut filling. | Pass. **Note:** this is the stillest stretch (frame-to-frame motion 0.6–1.0 grey levels at 7–9 s), with a slow push in. The movement inside the frame keeps going: blood pulses every 0.75 s, droplets rise, the body lifts as it bites. No frame is frozen; the longest run of near-still frames is 0. |
| 9.05–11.53 | Time-lapse | The tongue shrinks toward its base, pales and wrinkles while the parasite grows in place into the adult; same side camera, no cut. | Pass. Tongue and parasite stay in the same anatomical position throughout. |
| 11.60–13.40 | "The disgusting part" | A push along the adult to its head. | Pass |
| 13.30–13.62 | Dissolve | The parasite's head (side) into the same head (front). | Pass. About 9 frames of double exposure on the head. |
| 13.62–17.30 | New tongue | Pull back to the gaping mouth; two wider gapes; the segments ripple and the head lifts. | Pass. The movement is visible but restrained. |
| 17.30–20.85 | Eating | The shrimp drifts in; the jaws snap on "eating" (18.70); the parasite arches and pushes it back; two chews; swallow at 19.95; reopen at 20.4 with the parasite still attached. | Pass |
| 20.85–24.00 | Loop | Push back in; the legs fold under and the pink returns; ends on the opening frame. | Pass. Frame 719 vs frame 0 differs by 0.96 (mean absolute, grey levels), below the median frame-to-frame step of 3.44, so the loop has no visible jump. The audio seam jump is 0.0006. |

## Brief QC items

| Item | Result |
|---|---|
| Anatomically incorrect parasite movement | None found. One model throughout: 7 pereonites, 5 pleonites, pleotelson with uropods, 7 leg pairs with hooked dactyls. It walks with a metachronal gait, swims with its legs trailing, and grips with its claws in the tissue. |
| Legs or mouthparts disappearing | None. Legs fold under the body (frames 0–12 and 690–719) and are never removed. The near-plane culling added for the dive only hides the parts physically behind the camera. |
| Fish mouth geometry changing | None. One 3D mouth anatomy drives both views; the gape changes only through the jaw's own motion (breathing, the two wide gapes, the snap and chewing). |
| Confusing tongue transformation | It reads as one continuous time-lapse in one camera, from shrinking tongue to growing parasite on the stub. |
| Unnecessary pauses | The longest gap between phrases is 0.66 s. The tail after the last word is 2.71 s, carried by the loop push, the parasite settling, the fish breathing and a bass swell (about −31 dB RMS, not silent). See the deviation below. |
| Narration and action out of sync | None found. Every beat is keyed to measured word onsets. |
| First-second readability | Mouth, teeth and throat frame a fleshy wriggling shape that becomes a clawed segmented parasite by 0.85 s. |

## Deviations from the brief, and other notes

- **Runtime.** It is 24.0 s, the bottom of the 24–27 s target. The natural read is 20.6 s. Five sentence-end beats were
  lengthened with the take's own room tone (+0.72 s) rather than slowing the speech. The voiceless loop tail is 2.7 s,
  longer than the roughly 2 s estimated at script approval.
- **Runway** was not used. Generated video can't hold this model's segment and leg count or this mouth's geometry
  across procedural shots, which would break the brief's top QC items. No Runway credits were spent.
- **Style.** It is a clean 2.5D vector look: SVG with gradients, world-anchored tissue speckles, depth of field on far
  layers, grain and vignette. It is not photoreal, and has no plastic 3D or text.
- **Captions.** None are burned in, per the "no floating text" rule. The SRT is provided.

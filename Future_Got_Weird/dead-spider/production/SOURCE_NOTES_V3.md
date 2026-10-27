# Dead Spider V3: production and source notes

V3 is a visual production pass on V2.

**Narration: unchanged.** The audio file, wording and timing are byte-identical:
- `audio/narration/FGW_Dead_Spider_narration_V2.wav`
- `source/src/data/timeline_v2.json`

**Captions.** The same text and timing as V2. Only their heights change, to suit the new picture.

**Sources and science.** As in `SOURCE_NOTES.md` and `SOURCE_NOTES_V2.md`.

**Format.** Vertical 1080×1920, 30 fps, **906 frames (30.200 s)**.

## What the picture does

| Time (s) | Setting | Action |
| --- | --- | --- |
| 0.00–0.20 | Dark lab mat, macro | Tight on a big curled dead wolf spider, its legs folded in. A slender needle is already coming in over the front body section. The syringe is mostly out of frame. |
| 0.20–0.40 | — | The needle punctures the top of the prosoma (contact at 0.20 s, in by 0.29 s). A fast decaying shudder runs through the body (0.16 mm, 24 Hz). |
| 0.40–0.75 | — | A pale air pulse runs down the needle. Three legs snap open first (0.52 s), the other five follow 0.1–0.24 s later, each on its own damped spring. The syringe lifts the limp body clear of the mat. |
| 0.75–1.10 | — | The camera eases back and to the side as the silhouette widens. |
| 1.10–1.65 | — | The camera closes on the front body section, with the needle and its entry point in view. |
| 1.65–2.35 | Section | Through the entry point, the specimen opens into a section. Its pressure chamber fills with air and the pulse runs out along every leg. The mat drops into darkness. |
| 2.35–3.30 | Section, one leg | The camera follows the pressure to one leg's femur-patella hinge. The joint membrane swells and the hinge straightens, and the camera rides out along the straightening leg. |
| 3.30–4.52 | Low three-quarter view | Out to the whole dead spider, now hanging open. On "MOVE" the full push snaps every leg to its widest (mean extension passes 85% at 3.72 s). |
| 4.52–7.80 | Weathered stone, open ground | A match on the silhouette: the same camera and pose, but now a living wolf spider standing on rock. Two blurred layers of stones and foliage give parallax. One continuous rising, turning camera move. The colour drains on "dies". On "curl inward" each leg folds at its joints, its foot kept on the stone (the leg pivots up only as far as the ground requires), and the body sinks onto the rock. |
| 7.80–13.48 | A green leaf | A living spider with one front leg raised and bent. The camera closes on that leg. It opens into a section (the blue hemolymph, the joint membrane and the flexor), with the rest of the spider still solid. The fluid brightens and runs down the leg, and the leg straightens on "straighten" as the camera rides along it. The camera then moves back toward the body, which is now sectioned too. The flow stops on "die"; on "pressure disappears" the fluid thins and every leg folds as the body sinks. The camera pulls out to the curled spider on the leaf. |
| 13.48–14.30 | Lab bench | The operator, with glassware in front and behind and the far wall's shelves drifting. |
| 14.30–15.00 | Macro on the pad | Fine forceps steady the curled specimen while the needle on the clamped syringe comes down. |
| 15.00–16.00 | — | Close on the needle entering the top of the front body section. The glue bead forms and the arm lifts the specimen off the pad. |
| 16.00–16.60 | Along the syringe | Up the needle, hub and barrel to the plunger, where the gloved finger arrives. |
| 16.60–17.00 | — | The push. |
| 17.00–18.15 | — | Back down with the air pulse, into the spider. The legs stir. |
| 18.15–19.45 | Face-on, low | The second push: the legs spring open (mean extension past 85% at 18.79 s, on "spread OPEN"). |
| 19.45–23.39 | Low view at the blue foam block | The open gripper swings in and is lowered round the block. The air leaves back up the needle. The legs close front to back: all eight touch the block's sides between 22.06 and 22.11 s ("CLAMPED" 22.16). The camera rises to show the block held. |
| 23.39–26.19 | A new low three-quarter angle | The block, clearly held beneath the curled legs, leaves the bench (23.06 s). The camera tracks the carry, and the claw drops the block into a glass dish (25.47 s), where it bounces and settles. |
| 26.19–27.00 | Spider level | Following the open gripper toward a separate platform, hidden behind glassware and a tube rack. |
| 27.00–28.30 | Below the platform's edge | Looking up at the open gripper coming down over something we cannot see. On "ANOTHER" the camera rises over the edge and the second dead spider (smaller, paler, lying crosswise on a dark mat) comes into full view. |
| 28.30–30.20 | — | The air is let out. All eight legs close round the second spider (28.73–28.78 s) and stop where they touch it. The stand lifts both: the second spider leaves the mat at 29.07 s, with a growing gap and shadow. The camera settles high and tight on the curled legs under the needle, over a dark mat: the opening's angle, lens and colours. |

## Fixes found during V3

- **The final grip.** In V2 (and V1) the closing legs could pass a flat object, the second spider, and curl to a
  clear pose on its far side. The second spider was then carried by time alone, not held. `spider.ts` `legContact`
  now has a sweep mode, used by the V3 lab gripper: a closing leg stops at its first contact on the way. The probe
  (`tools/export_cues_v3.ts`) shows every one of the eight legs in contact with the second spider and with the
  block, and the second spider leaves the mat only after that. V1 and V2 call `legContact` without the sweep, so
  they render as before.
- **Living spiders on a surface.** `SpiderPose.dth` holds a per-leg elevation offset. `world3.groundLegs` raises each
  leg about its base just enough that no part of it goes below the ground, so dying legs fold with their feet on the
  surface instead of through it.
- **The hand.** A gloved hand at true scale buried the 10 mm specimen in the macro shot. The steadying is done with
  fine forceps, the way a lab would; the operator's own gloved hand appears in the wide shot and on the plunger.
- **The reveal.** The second spider was briefly visible in the background of earlier shots. The final platform was
  moved further along the arc, a tube rack was placed in front of it, and the camera at the block was turned away
  from it.
- **A pop at the reveal.** The dark mat's edge band was drawn at bench height and covered the riser for one frame.
  It is now drawn just under the mat.

## Audio

`tools/make_audio_v3.py`:
- the narration is the unchanged V2 WAV, sample for sample (stem correlation 1.000);
- the same synthesised bed as V2;
- 69 effects placed from the V3 picture's own events (`audio/cues_v3.json`, from `tools/export_cues_v3.ts`):
  - needle approach, puncture tick, crunch and shudder;
  - the air pulse, and one leg snap for each leg as it opens;
  - the chamber filling and the hinge straightening;
  - the full snap on "MOVE";
  - the death creak and body settle, on the stone and on the leaf;
  - the forceps tick, needle servo, contact and crunch, the pushes;
  - the air's hiss back up the needle;
  - eight measured foot contacts on the block and a gentle grasp;
  - lift, carry, the drop's clinks;
  - travel, the air let out, eight foot contacts on the second spider, and the final lift.

Integrated loudness is −15.0 LUFS and true peak −2.9 dBTP.

## Scenery

The scenery is all deterministic vector layers in the shared millimetre world, so every layer moves with real
parallax:
- dark mat;
- stone with lichen, grit, cracks and fallen leaves;
- leaf with veins;
- blurred stones and foliage;
- the lab's bottles, beakers, flask and tube racks;
- the far wall.

Runway was not used: the environment's network policy still blocks Runway's output host
(`dnznrvs05pmza.cloudfront.net`).

## QA (on the exported file)

Evidence is in `qa/v3/`:
- `review_qa.json`, `review_asr.json`;
- `caption_check.json`;
- frame pages built from the export with `tools/frame_pages.sh`:
  - `hook_0` / `32` / `64` / `96` / `128`: every frame of the first 5 s;
  - `needle_430`, `follow_ride_480`, `clamp_610`, `lift_drop_690`, `reveal_grab_786`: every frame of each mechanical
    window;
- `every10th.png`;
- `loop_first_last.png`.

**File.** H.264 High, 1080×1920, 30 fps, 906 frames, 30.200 s, yuv420p bt709; AAC 48 kHz stereo.

**Audio and transcript.**
- No black frames.
- −15.0 LUFS, true peak −2.9 dBTP.
- Transcript of the export: Zipformer and Whisper each have WER 0.011. The only difference is "they'd" heard as
  "they", the same co-articulation as in the approved V2 take.

**Contact and lift** (from `tools/export_cues_v3.ts`, which reads the same state the shots draw):
- all eight legs touch the block between 22.06 and 22.11 s, and the block leaves the bench at 23.06 s;
- all eight legs touch the second spider between 28.73 and 28.78 s, and it leaves the mat at 29.07 s;
- outside those two grabs, no leg is ever held open by contact (checked on every lab frame).

**Frame change.** Every jump over the threshold is on a planned cut, except three continuous camera moves:
- the hook's ride into the section (frames 70–91);
- the move up the syringe (477–497);
- the ride down with the air (510–517, 541).

Their peak frame-to-frame difference is 26.8, down from 36 in the first V3 render.

**Loop.** The difference between the first and last frames is 26.7, against 79 for V2. Both frames show a curled
spider under a needle on a dark mat, at the same angle and lens.

**Captions.** The text and timing are the V2 captions, unchanged. The only remaining overlaps with a key point are 1–8
frame transients while the camera moves.

**Not done.** Nobody has watched or listened to the film at normal speed. This environment has no display or
speakers. The checks above come from the file.

## Remaining imperfections (for V4)

1. **The three fastest camera moves** (the section ride at 2.3–3.0 s, up the syringe at 15.8–16.6 s, and down with
   the air at 17.0–17.4 s) are continuous but quick. On a phone they may read as fast tilts.
2. **The hand.** The steadying is done with forceps: a gloved hand at true scale cannot appear in the 10 mm macro
   without covering the spider. The gloved hand appears in the wide shot and on the plunger.
3. **Second spider's size.** It is drawn at 0.92 scale and lies crosswise. In the final grab the gripper's legs cage
   it at mid-extension, rather than wrapping tightly under it.
4. **No leg-on-leg collision.** The solver stops legs on objects but does not test leg against leg, within one spider
   or between the two. No crossing was found on the contact pages.
5. **Narration.** "They'd turned" is co-articulated as "they turned" in the approved take. The narration was kept
   unchanged, as required.
6. **Runway** is still blocked by the network policy (`dnznrvs05pmza.cloudfront.net`).

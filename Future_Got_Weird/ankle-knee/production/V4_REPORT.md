# Ankle Knee V4: review report

**Status: review render. Not final, not published.** V1–V3 are kept for comparison (`exports/`).

## Deliverable

`exports/FGW_Ankle_Knee_V4_REVIEW_1080x1920.mp4`

| Measure | Result |
|---|---|
| Format | H.264 yuv420p BT.709, 1080×1920, 30 fps; AAC 48 kHz stereo, 320 kb/s |
| Length | 725 frames, 24.17 s. It loops: frame 724 is one frame before frame 0's composition |
| Narration | The approved take, verbatim: the same V3 master (`audio/narration/FGW_Ankle_Knee_narration_V3.wav`), sample for sample. Every cut and beat is keyed to its measured word times (`source/src/v4/story4.ts`) |
| ASR of the final file | __ASR__ |
| Mix | __MIX__ |
| Full decode | __DECODE__ |
| Measured frame QA | __QA__ |

## The new cut

| Time (s) | Words | Shot and event |
|---|---|---|
| 0 (frame 1) | "Doctors…" | **The decisive frame**, low side angle. From left to right: his planted support cleat on the turf, the ball fully in frame, and the prosthetic cleat one frame from the ball. Above the prosthetic cleat, his backward biological foot sits inside the rimmed, see-through socket. |
| 0.033 (frame 2) | | **Contact**, with a short impact under the voice. The follow-through comes at once, his weight moving over the planted leg. The ball leaves fast, up and to the left, spinning, and stays below the caption. |
| 0.27–0.50 | "turned this" | The ball swells toward the lens until it covers the frame at 0.40. Its trailing edge then wipes right to left onto **a close side view of the same leg**. The backward foot comes up where the eye last saw it: (215, 880) px at 5°, against (250, 896) px at 11° on the last frame before the ball covered it. |
| 0.5–1.9 | "boy's **ankle**" | **Reveal.** The lens follows the leg down from the follow-through. He lands into a soft-kneed stance (turned ankle about 50°), so in the socket his toes point clearly behind him. They flick once on "ankle". |
| 2.0–3.6 | "into a **working knee**. Wyatt had" | **Proof.** The turned biological ankle flexes and the prosthetic shin and cleat swing back with it, held through "knee". The return runs all the way into the X-ray cut. |
| 3.62 | "bone cancer." | **X-ray**, close on the distal femur from the first frame. The diseased section tints in on "bone" and is ringed on "cancer". |
| 4.73–5.35 | "Surgeons had to" | The cut margins draw in: femur at 4.76, tibia at 4.90, then the band between them tints. |
| 5.35–7.88 | "remove his knee, but they could save his foot." | **The clean side-profile surgical illustration.** On "remove" the margins become cut faces and the diseased middle slides out. On "but" the lens tilts down at the same scale (no push-in) until the whole kept lower segment is centred. On "save his foot" a mint glow gathers on the foot. |
| 7.88–11.40 | "They turned his lower leg halfway around and attached it to his thigh," | **One continuous shot with the thigh fixed.** The rotation is already under way at the cut: toes forward, the heel past the lens, toes backward by 9.51. The joining faces light on "and". The rise grows out of the turn's settle (from 9.42) and seats on "thigh" (11.05), with a seam. |
| 11.40–14.62 | "with his toes pointing behind him. That backward ankle now" | **Rehab A**, a tight side profile at the socket. It answers which way his toes point: back, against the forward-pointing trainer. The toes flick on "pointing". From "behind him" the lens rises up the socket to the turned ankle, and the bend begins. |
| 14.62–16.16 | "bent the same way as his other knee" | **Rehab B**, cut on the bend. A low two-leg view: his ordinary knee and the turned ankle bend together. He starts to rise, and the cut falls on "knee". |
| 16.16–17.03 | "knee. When Wyatt" | **Rehab C**, wide. He finishes rising, shifts his weight onto his left leg and takes one clear step with the prosthetic leg. The footfall lands at 16.98, and the planted foot does not move. |
| 17.03 | "woke up, he could still" | Cut on the footfall: recovery. He wakes, and his gaze goes down to his leg. |
| 18.20 | "**wiggle** his toes." | Straight to the toes: one unmistakable wiggle against the sheet, which gathers and creases under them. |
| 18.84 | | He notices, with a small smile (0.5 s). Then 5 frames back on the foot. |
| 19.50 | "And once he learned" | **Match cut**: the foot's screen position and angle become the same foot in the fitted socket, back on the field. The toes flex, then the turned ankle draws the cleat back. |
| 20.20–23.87 | "to use his new leg, that same foot helped him kick a soccer ball." | **The closing scene: the part of the kick the opening skipped.** A pass rolls in from behind him, in front of his feet, and he tracks it (eyes and a head dip). He runs onto it: final stride, then the support foot plants at 23.78. |
| 23.87–24.13 | | **Cut low** as the prosthetic cleat swings in. Frame 724 is one frame before frame 0. On replay, frame 1 continues the swing and frame 2 is contact. |

## Checks the brief asked for

- **First two seconds, muted, at phone size** (`qa/v4_review/hook_0-2.5s_every_3rd_frame.png`, `qa/v4_review/phone_first2s.png`). The kick reads from frame 1: planted cleat, ball, cleat about to strike, and the foot facing backward in the socket. The reveal then shows the toes behind him, and the proof shows the ankle working as a knee, all before the first sentence ends.
- **The last two seconds into the first two, played twice** (`qa/v4_review/loop_2s_into_2s_twice.png`; one kick clock drives both, `source/src/v4/kick4.ts`).
  - *Ball position:* no jump across the seam; the same rolling ball sits at the strike position.
  - *Screen direction:* everything moves screen-left: the run, the pass, the kick, the ball's exit and the wipe.
  - *Leg continuity:* the swing runs on with no pose pop.
  - The seam's frame change is 14.2, against 14.4–16.2 for the opening frames.
- **Captions** sit at each shot's chosen height, clear of the ankle, the cleats and the ball. During the wipe the ball fills the whole frame, so it passes under the caption.

## Independent review

The workflow had two stages:

- **Building:** three shot builders worked in parallel, each followed by two rounds of independent review and fixes.
- **Reviewing the render:** five reviewers each took one lens (opening, surgery, rehab, ending and loop, whole-film craft). A skeptic then tried to refute each serious finding before it was accepted.

**Confirmed and fixed:**

- **Pose pop at contact:** at contact both arms jumped to a new pose in one frame, on the most important frame and on every loop. The blend is now continuous.
- **Toes on "ankle":** on that word the straight leg left the toes pointing down. He now lands in a soft-kneed stance, and the toe flick is bigger.

Also fixed from the reviews:

- **Opening and loop:**
  - The ball's exit no longer crosses caption 0 or turns back toward the centre.
  - Frame 0 is reframed so the planted cleat is whole.
  - The backswing peaks earlier, so the cleat visibly swings in during the low cut.
- **Reveal and proof:** the proof frame is wider, and the last hold before the X-ray is gone.
- **Surgery:**
  - The "save his foot" passage gets a real tilt down. This removes a 0.7 s still and matches the segment's position across the cut into the turn.
  - There is no toe movement before the recovery wiggle.
  - The turn's pauses are trimmed: the rise begins inside the settle and seats on "thigh".
- **Rehab:**
  - Shot A never parks (its rise starts on "behind him").
  - The B→C cut lands on "knee".
- **Recovery:** the foot is now on screen for the match cut.
- **Captions:**
  - Shot selection is frame-exact.
  - Captions no longer blank for one frame at each change.
  - Caption 7 sits lower.
- **Sound:** the impact is 3 dB lower, so the voice's first consonant stays on top, and the surgery room tone comes up 9 dB.

**Downgraded or rejected by the skeptics:**

- "No weight over the planted leg": measured, the pelvis travels over the plant by f6.
- "The illustration is washed out": it is the same plate style as V3.
- "Rehab A has nothing new for 2 s": the toes and the rise do move.

**Open (minor):**

- In the reveal, the far leg can show through the clear socket.
- In the field-socket shot, the cleat is still sliding back at the cut to the wide shot.
- The far hand in rehab C shows only as small fragments.

## Sound

Everything is synthesised (`tools/make_audio_v4.py`), from cues exported by the picture code (`tools/export_cues_v4.ts` → `audio/cues_v4.json`).

- **Opening:** a short impact on frame 2 under the voice, the ball's whoosh at the lens and a low whoom on the wipe, then the reveal's landings and the shin's swing on "working knee".
- **X-ray and surgery:** the X-ray tick, a pulse and a ping for the diseased bone, margin ticks, the separation, a chime for the kept foot, the turn's swish, a ping where it reconnects, and the seat.
- **Rehab:** toes, rails, the bend, the rise, and the step's footfall.
- **Recovery:** the wake and the sheet under the wiggle.
- **Closing:** the cleat dragging back, the pass rolling (shaped by its speed), each footfall, the plant, and the swing into frame 0, whose contact lands on frame 2 when the film loops.
- **Ambience:** field, X-ray room, illustration, gym and recovery room.

## Rebuild

    source/node_modules/.bin/esbuild tools/export_cues_v4.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec4.cjs && NODE_PATH=source/node_modules node /tmp/ec4.cjs audio/cues_v4.json
    python3 tools/make_audio_v4.py mix_v4
    (cd source && npx remotion render src/index.ts AnkleKneeV4 ../exports/FGW_Ankle_Knee_V4_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v4","captions":true,"v4":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    FGW_CUES=audio/cues_v4.json python3 tools/qa_render.py exports/FGW_Ankle_Knee_V4_REVIEW_1080x1920.mp4 qa/v4_review
    # sheets: cd source && ./sheet4.sh out.png "f1,f2,..." [captions] [cols]; one part alone: src/test/v4_<part>.entry.tsx via makeSheetRoot

The code is in `source/src/v4/`:

| File | Contents |
|---|---|
| `story4.ts` | the cut list and named beats |
| `kick4.ts` + `pitch4.tsx` | the one kick clock: the opening, the wipe, the reveal and proof, the field, the low cut |
| `middle4.tsx` | the X-ray, the anatomy, the turn |
| `rehab4.tsx` | the three rehab views |
| `bed4.tsx` | the wake, the toes, the notice, the socket match |
| `Scene4.tsx` + `Captions4.tsx` | the per-frame scene and the captions |

V1–V3 render unchanged.

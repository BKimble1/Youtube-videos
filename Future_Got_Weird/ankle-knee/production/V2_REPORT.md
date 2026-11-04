# Ankle Knee V2: review report

**Status: review render. Not final, not published.** V1 (`exports/FGW_Ankle_Knee_1080x1920.mp4`,
`production/REPORT.md`) is kept for comparison.

## Deliverable

`exports/FGW_Ankle_Knee_V2_REVIEW_1080x1920.mp4`

| Measure | Result |
|---|---|
| Format | H.264 yuv420p BT.709, 1080×1920, 30 fps; AAC 48 kHz stereo, 320 kb/s |
| Length | 750 frames, 25.00 s, with the same approved narration master as V1, unchanged. The picture is rebuilt against its measured word times |
| Full decode | no errors |
| Narration | Independent ASR of the V2 file's audio: whisper base.en WER 0.000. Zipformer's only diffs are spellings (Wyat, half way, socker). `qa/v2_review/asr_final_mix.json` |
| Mix | −13.9 LUFS integrated, −1.6 dBTP. Voice −16.9 LUFS, effects −34.3, ambience −45.8 (`audio/mix/mix_measure_mix_v2r.json`) |
| Pacing | Longest near-static run: **15 frames (0.5 s)**. V1's was 33 frames, and V1 also held one diagram for about 11 s |
| Loop seam | last frame vs frame 0: 6.0, about two normal frame steps. The closing kick's bent leg pushes into frame 0's own composition |

## The new cut

| Time (s) | Words | Shot and event |
|---|---|---|
| 0 | "Doctors turned…" | **Frame 0:** a tight side view of his bare foot pointing **backward**, at the height of his other knee. His blue sock and knee are beside it, and his toes are already beginning a small flex. There is no black window: the socket is a thin, translucent cutaway shell, and the foot shows in its own skin colour. |
| 0–0.55 | "…this boy's ankle" | One widen along the same leg reveals the fitted prosthesis: the pylon, the **forward-facing** cleat below, and the ball just ahead. |
| 0.55–2.0 | "into a" | Wind-up: the turned ankle bends, so the socket and cleat swing back and up. |
| 2.0–2.44 | "working" | The flex that powers the kick: his foot straightens inside the socket, visibly, **before** the cleat reaches the ball. |
| 2.44 | "knee." | Impact. |
| 2.44–3.31 | | The ball comes at the lens and fills a circle at the frame's centre. |
| 3.31–4.85 | "Wyatt had bone cancer." | **Match** on the ball's circle to the round field of a straight-on knee scan on a clinic monitor. The lens pulls back to the monitor. The diseased section shows in the femur itself (mottled, spiculed bone tinted from inside), and the lens pushes in on it. |
| 4.85–8.25 | "Surgeons had to remove his knee, but they could save his foot." | A matched dissolve on the femur into a side-profile anatomy of the leg, bones through skin. Cut lines appear and the diseased middle separates and leaves, bloodless. The lens follows the kept piece: 19 cm of shin, the ankle and the foot, with no floor under it. A mint "kept" glow, and the toes stir. |
| 8.25–10.2 | "They turned his lower leg halfway around" | **Its own steady shot.** The same 3D piece turns about the shin's long axis: toes forward in profile → the **heel turning toward us** → toes back in the opposite profile, with a ring arrow showing the direction. The ankle and heel are solid lofted forms, never a flipped sprite. |
| 10.2–11.3 | "and attached it to his thigh," | The lens follows the shortened shin up as it rises past his other shin to the thigh and seats, with a seam. |
| 11.3–13.9 | "with his toes pointing behind him." | Widen to Wyatt in side profile. His face, chest and ordinary trainer point forward; his own toes point back at knee height. The silhouette holds while his toes flex and he glances back at them. |
| 13.9–17.3 | "That backward ankle now bent the same way as his other knee." | **Rehab rails** (the bench is gone). A low three-quarter lens; his feet are planted and staggered so both joints show, and his hands are on the rails. One supported knee bend: his hips lower, his ordinary knee and the turned ankle flex together, and his elbows bend while his hands stay on the rails. A small window in the socket shows the ankle and heel only. |
| 17.4–20.3 | "When Wyatt woke up, he could still wiggle his toes." | Recovery, reclined on the raised bed with his back and head on pillows. Close on his toes resting on the blanket; one wiggle presses a crease into the fabric. The lens moves to his eyes as they track down, with the slightest smile, then follows his gaze back to the crease. |
| 20.3–20.9 | "And once he learned" | The crease **matches** a loose lace across a cleat's throat; two hands pull it snug. |
| 20.9–22.1 | "to use his new leg," | **Cut on the tug** to the prosthetic cleat planting on turf (low). Then one confident approach step from a low front three-quarter: he comes toward the lens and across, with a forward lean and counter-swinging arms. |
| 22.1–24.4 | "that same foot helped him kick a soccer ball." | The whole kid: last strides, his support foot plants beside the ball with his weight over it, backswing, the prosthetic cleat strikes. The ball leaves down the field and he watches it go. |
| 24.4–25.0 | | The follow-through's bent leg comes down. The lens pushes in as the socket clears to the cutaway, into frame 0's backward-foot close-up. |

## Wyatt, redrawn (`source/src/v2/body.tsx`, `poses.ts`)

- **Body.** The pelvis and rib cage are separate masses joined at the waist, each tilting on its own. The shoulders sit on the rib cage. In the slightly turned views the pelvis and chest widen toward the far hip, so the far leg attaches to the body instead of floating.
- **Arms.**
  - The arms are either posed by angle or reach for a world target with two-bone IK.
  - On the rails the hands are locked to the bars while the elbows bend.
  - The kick uses a near arm and a far arm with different bends.
- **Legs.** The legs are solved from planted foot targets, so weight-bearing shoes stay where they land. The hips are kept within reach of the planted foot.
- **Face.** The crew Head, ink system and palette are unchanged; the skin is the crew's own tone.
- **Shoes and socket.** He has an ordinary trainer as well as the cleat. The socket has three finishes: illustrative cutaway, small local window, and solid.
- **Silhouette check.** The four purpose-built poses (kick, rail bend, recovery, approach step) were checked as black silhouettes before clothing and prosthesis.
- **Proportions.** The proportions and the operated side (his right, nearest the lens) are the same in every shot.

## Checks run before export

- **Muted, phone size, first 2 s** (`qa/v2_review/muted_phone_0-2s.png`):
  - Frame 0 reads as a real bare foot pointing backward, level with the other knee (blue sock beside it).
  - By 0.3 s the widen shows that foot inside the socket, connected by the pylon to a forward-facing cleat.
  - The wind-up and the flex before impact show the foot driving the cleat.
- **Whole-body shots without captions** (the reveal, rails, step, closing kick, frame by frame):
  - The hips stay over or between the planted feet.
  - The support cleat stays fixed through the backswing and the strike.
  - The near and far arms counter-swing in different bends.
  - No foot floats. Two problems this check found were fixed: the far knee hid behind the socket on the rails, and the ball left the frame before you could see him watch it.
- **Measured** (`render_qa.json`): no decode errors.
  - The large frame changes are the planned cuts and moves: the opening widen, the ball at the lens, the scan → anatomy dissolve, the eyes move in recovery, the plant → step rise, and the closing strike and push.
  - Smaller flags are the scan's push-in (4.6 s) and camera travel in the closing kick (23.1 s, 24.3 s).
  - The move from toes to eyes in recovery (19.5 s) is fast; it was slowed once and is still the quickest move in the film.

## Captions

The approved captions are unchanged in text and timing. Their heights are set per shot (`source/src/v2/Captions2.tsx`)
to stay clear of the toes, the joint and the impact:
- top in the opening, the anatomy, the turn and the recovery close-up;
- low on the scan, the reveal, the rails and the step and kick.

## Sound (`tools/make_audio_v2.py`, `audio/cues_v2.json`)

Restrained and synthesised. It covers:
- the two ball strikes (the closing one lands 0.14 s after "kick");
- the leg's swing, and the ball's whoosh at the lens;
- soft cues on the scan, the cut lines, the turn and the seat;
- hands on the rails and the liner's creak in the bend;
- fabric as the toes press the blanket;
- the lace sliding and the tug;
- cleats on turf at the plant and on every landing;
- field, clinic, plate, rehab-room and recovery-room ambience.

The voice stays in front.

## Known weaknesses (for review)

- **The three-quarter angles are approximations.** The "low three-quarter" (rails) and "low front three-quarter" (step) views come from a staggered far side, a turned head and true floor perspective, with the step drawn on a nearing depth layer. The body itself is still the side-view rig.
- **The lace close-up is a simple top view, and the hands in it are basic.**
- **The opening's ball has to come back for the loop.** It is kicked away at the end, yet frame 0's widen shows it resting again. The seam itself is invisible because frame 0 is tight on the foot.
- **The anatomy plate's bones are simplified.** The kept piece shows the tibia and fibula through translucent skin.
- **The recovery move from his toes to his eyes is quick,** and the return to the crease passes over his hand.
- **Nobody has watched it in real time with sound;** the audio checks are measured.

# Ankle Knee V3: review report

**Status: review render. Not final, not published.** V1 and V2 (`exports/FGW_Ankle_Knee_1080x1920.mp4`,
`exports/FGW_Ankle_Knee_V2_REVIEW_1080x1920.mp4`) are kept for comparison.

## Deliverable

`exports/FGW_Ankle_Knee_V3_REVIEW_1080x1920.mp4`

| Measure | Result |
|---|---|
| Format | H.264 yuv420p BT.709, 1080×1920, 30 fps; AAC 48 kHz stereo, 320 kb/s |
| Length | 725 frames, 24.17 s (V2: 750 frames, 25.00 s) |
| Narration | The same approved ElevenLabs take, verbatim. Only dead air was cut: sentence gaps over 0.30 s were shortened to 0.30 s with 12 ms crossfades (0.77 s removed in all, before *Wyatt*, *They*, *That*, *When* and *And*). No word is touched (`tools/make_narration_v3.py`, `audio/narration/FGW_Ankle_Knee_narration_V3.wav`) |
| ASR of the mix | whisper base.en WER **0.000**. Zipformer differs only in spellings (Wyat, half way, sockerball) (`qa/v3_review/asr_mix_v3.json`) |
| Mix | __MIX__ |
| Full decode | __DECODE__ |
| Pacing | __STATIC__ |
| Loop seam | __LOOP__ |
| Unplanned large frame changes | __UNPLANNED__ |

## The new cut

| Time (s) | Words | Shot and event |
|---|---|---|
| 0 | "Doctors turned…" | **Frame 0:** a tight side view at knee height. His bare foot points **backward** inside a socket with a visible carbon rim, beside his ordinary knee, blue sock and a forward-facing cleat. The heel and toe silhouette reads at phone size. The ankle is already flexing. |
| 0–0.95 | "…this boy's ankle" | One continuous action. The flex runs down the connected pylon to the forward cleat, and the lens widens to the planted support cleat beside the single ball. The prosthetic leg is already swinging through. |
| 1.12 | "into a" | Contact (the cleat is 1.0 cm from the ball at the contact frame) |
| 1.12–1.8 | "working knee." | V2's transition, kept: the ball comes at the lens and its circle becomes the scan's round field |
| 1.8–4.45 | "Wyatt had bone cancer." | The lens **enters** the knee image instead of holding the growing ball. It pushes in on the femur, the diseased section tints from inside, and a dashed ring identifies it. The push keeps creeping until the handover |
| 4.45–7.9 | "Surgeons had to remove his knee, but they could save his foot." | A matched dissolve: the scan's bone contours land on the same knee in the anatomy drawing, at the same size. In one side view, cut lines appear and the middle separates. The lens then travels with the healthy shin and foot into the next composition, where the piece fills the frame and the toes stir under a mint "kept" glow |
| 7.9–9.7 | "They turned his lower leg halfway around" | A purpose-drawn **three-quarter view** of the same piece (lofted 3D: big toe, four smaller toes, ankle and heel stay consistent). The heel passes toward the camera and the toes come out pointing the other way. A ring arrow shows the direction |
| 9.7–11.4 | "and attached it to his thigh," | The lens follows the shin up into line. The view eases to the side, and the attachment and seam complete before the lens widens |
| 11.4–13.4 | "with his toes pointing behind him." | **Proof shot (replaces the standing hold).** The shot starts at his hip in the rehab room and tracks down to both legs in profile. His ordinary trainer points at the front rail, and his own toes, in the rimmed socket, point back at the treatment bench. The toes flex on "pointing" |
| 13.4–16.6 | "That backward ankle now bent the same way as his other knee." | The lens carries past the near rail into a lower three-quarter view. One smooth, weight-bearing bend: his hips lower, and the far knee and the turned ankle flex together in view. His elbows bend. The near hand wraps over its rail, and the far hand is behind its rail (no rail runs through a wrist). The shot ends once both joints have bent |
| 16.6–18.55 | "When Wyatt woke up, he could still wiggle his toes." | Recovery opens on a recognisable foot: a clear big toe, four smaller toes and nails, resting on the blanket. One wiggle presses a crease into it |
| 18.55–19.5 | (the wiggle) | **Cut on the movement** to Wyatt noticing: his eyes drop to his foot and a small smile follows. A blanket fold sits in the foreground |
| 19.5–19.95 | "And once he" | The fold matches a lace pulled tight on a side-on cleat (studs and stripe: a cleat at once). The insert is brief |
| 19.95–20.3 | "learned" | Cut on the tug: the prosthetic cleat plants on the turf |
| 20.3–24.17 | "to use his new leg, that same foot helped him kick a soccer ball." | Wide, so he can be seen playing. Approach strides, then the left support cleat plants beside the ball and stays fixed. His hips turn and his arms take different balancing positions. The ball is in shot before the shoe reaches it, contact comes at 22.58 s, and the ball travels to the visible goal. The bent-leg follow-through comes down as the lens pushes into frame 0's close-up |

## Checks requested in the brief

- **First two seconds, muted** (`qa/v3_review/hook_0-2.5s_every_3rd_frame.png`). Frame 0 needs no sound: the foot points backward in a rimmed socket, beside an ordinary knee and a forward shoe. The flex is moving by 0.2 s, the cleat is in the swing by 0.5 s, contact is at 1.12 s, and the ball reaches the scan at 1.8 s. There is one ball in every frame. In early contact sheets a "second ball" seemed to appear, but it was only neighbouring sheet tiles overlapping. Full-size frames show a single ball.
- **Both kicks scrubbed** (frames 0–54 and 640–724, caption-free).
  - *Floating cleats:* none. The support cleat's lowest stud sits at +0.1 cm against the turf at both strikes. The scrub caught a 0.45 cm lift and a 0.2 cm slide at the closing contact, caused by the hip turn raising the far hip. That is fixed: from plant to follow-through the stud now stays between −0.03 and +0.10 cm, and the cleat moves 0.04 cm, under a pixel.
  - *Duplicate balls:* none.
  - *Sliding support feet:* none. The opening support cleat is fixed, and the closing support cleat plants at 22.08 s and holds through contact and the follow-through.
  - *Impossible bends:* none. The knees and the turned ankle bend in one direction only, and the ankle stays inside its socket's range.
  - *Contact gap:* 1.0 cm in the opening and ≈0 cm in the closing kick.
- **Captions** are aligned to the V3 master's own word times, re-measured after the gap tightening (`captions/FGW_Ankle_Knee_V3.srt`). They sit at the top of frame and stay clear of the feet throughout. The one exception is "and attached it to his thigh", which drops to the bottom because the shin rises through the top of frame at that point. The kicks keep the captions above Wyatt's head.
- **Measured frame QA** is in `qa/v3_review/render_qa.json`, with contact sheets every 0.5 s and the loop seam.

## Sound

Everything is synthesised (`tools/make_audio_v3.py`), and effects are placed from cues exported by the picture code (`tools/export_cues_v3.ts` → `audio/cues_v3.json`).
- **Strikes and ball:** two strikes. A rising whoosh carries the first ball into the lens, and the second ball flies off toward the goal.
- **Cleats:** grass scuffs on each landing the rig makes, the plant after the lace, and the support cleat set beside the ball.
- **Scan, anatomy and turn:** a monitor tick and a low push into the scan, a low pulse and a ping for the ringed bone, air on the dissolve, cut-line ticks, a soft lift as the middle separates, a chime for the kept foot, an airy swish shaped like the half-turn, and a soft knock as the shin seats.
- **Rehab and recovery:** gym tone, hands tightening on the rails, and the socket and cloth as he bends; fabric under the toe wiggle, the lace slide and tug.
- **Ambience:** field, scan room, plate, gym and recovery room.
- **Voice:** −16 LUFS, in front.

## Rebuild

    python3 tools/make_narration_v3.py
    source/node_modules/.bin/esbuild tools/export_cues_v3.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec3.cjs && NODE_PATH=source/node_modules node /tmp/ec3.cjs audio/cues_v3.json
    python3 tools/make_audio_v3.py mix_v3
    (cd source && npx remotion render src/index.ts AnkleKneeV3 ../exports/FGW_Ankle_Knee_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3","captions":true,"v3":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    FGW_CUES=audio/cues_v3.json python3 tools/qa_render.py exports/FGW_Ankle_Knee_V3_REVIEW_1080x1920.mp4 qa/v3_review

The code is in `source/src/v3/`: `story3.ts` (timing, pitch action, cameras), `Scene3.tsx`, `middle3.tsx`, `rehab3.tsx`, `end3.tsx` and `Captions3.tsx`. Shared parts gained small options: a lens yaw and pitch for the 3D leg, a rimmed socket, the goal's position, and exported anatomy and rail parts. V1 and V2 still render unchanged.

# Ankle Knee: report

**Status:** the first complete cut, rendered and checked. **Not published.**

## Deliverable

`exports/FGW_Ankle_Knee_1080x1920.mp4`

| Measure | Result |
|---|---|
| Format | H.264 yuv420p BT.709, 1080×1920, 30 fps; AAC 48 kHz stereo, 320 kb/s |
| Length | 750 frames, 25.00 s (speech 0–24.32 s, then a 0.68 s approach to the strike that frame 0 completes) |
| Full decode | no errors |
| Narration | the locked text, verbatim. Independent ASR of the final file's audio: whisper base.en WER 0.000; zipformer differs only in spellings (Wyat, half way, socker). `qa/final/asr_final_mix.json` |
| Mix | −13.3 LUFS integrated, −1.6 dBTP (4× oversampled); voice −16.3 LUFS, effects −35.8, ambience −42.8. 30 effects placed from the picture's events (`audio/sfx_log_mix_v2.json`) |
| Frame-to-frame change | median 2.94. Every large change is either a planned cut or subject motion (see "Measured checks") |
| Loop seam | last frame vs frame 0: 11.95, the same size as the neighbouring frame steps of the kick (14–21). It is one continuous swing at the same speed, with the same camera |

## The picture

| Time (s) | Words | What happens |
|---|---|---|
| 0–0.13 | "Doctors turned…" | **Frame 0:** side-on at knee height, halfway through the kick. The forward-facing cleat is about 7 cm from the ball. The near wall of the socket is already cut away, and his own foot shows inside it pointing backward, heel at the bend. The ball strike lands on frame 4. |
| 0.13–0.4 | "…this boy's ankle" | The ball leaves on a low drive and is out of frame by 0.35 s. The leg follows through forward and up. |
| 0.4–2.9 | "…into a working knee." | A speed ramp: slow motion for the follow-through while the lens pans with the leg, then pushes onto the joint. The foot inside the socket points as the "knee" straightens. The shin, socket and cleat stay in frame. Normal speed returns as he jogs on, and the socket swings back like a shin. |
| 3.33 | "Wyatt had" | **Match cut** on the moving joint to the illustration. The original leg carries on with the same stride at the same screen position and settles to standing. The rest of him is a pale ghost, so the thigh always belongs to a body. |
| 3.6–4.9 | "…bone cancer." | An x-ray window opens on the knee, and the tumour at the end of the femur glows. The healthy ankle and foot stay below. |
| 4.9–6.5 | "Surgeons had to remove his knee," | Two dashed cut lines. The middle section, from the lower thigh through the knee to the upper shin, is tinted and lifts away, bloodless. That leaves a thigh stump (with the shorts) and a foot. |
| 6.7–7.8 | "but they could save his foot." | A soft mint glow on the lower piece, and the toes stir. |
| 8.3–10.2 | "They turned his lower leg halfway around" | The lens closes on the lower piece with the stationary thigh stump at the top of frame. The piece turns 180° about the shin's own long axis: the toes swing toward the lens and face it in a row, then pass through 3/4 to point back while the heel comes forward. The calf, ankle bones, cut face and nails all trade sides in perspective, and a ring with an arrowhead shows the direction. |
| 10.2–11.6 | "and attached it to his thigh," | The shortened shin rises to meet the thigh, and a neat seam with stitches appears. |
| 11.8–13.5 | "with his toes pointing behind him." | In profile: heel forward, toes back. A dashed mint line ties the new ankle to his other knee at the same height. The toes stir on "pointing", and the lens eases in. |
| 13.5–14.0 | "That" | The turned foot points, and the prosthesis is fitted round it (socket in cutaway, pylon, cleat). A matched dissolve (0.36 s) carries the leg, in the same pose and place, into the real scene on the pitch. |
| 14.0–17.4 | "…backward ankle now bent the same way as his other knee." | The lens pulls back to both legs, slightly staggered. He lowers himself onto the team bench and both knees bend together. The far knee shows beside the socket, and the cutaway shows the foot doing the bending. |
| 17.4–20.7 | "When Wyatt woke up, he could still wiggle his toes." | **Match cut** on the seated leg to recovery. The thigh rests on a foam wedge and the turned foot hangs free with a clean white dressing over the join. The lens rises to frame his face and the foot together. He wakes groggy, looks down, the toes make one clear flex, and he gives the slightest smile. |
| 20.7 | "learned" | **Cut on the downward movement:** the toes press down, then his prosthetic cleat plants on turf. |
| 20.8–25.0 | "…to use his new leg, that same foot helped him kick a soccer ball." | A small weight shift onto the new leg, then up and out to the whole boy, smiling, on a short approach. The lens comes down to the opening sideline angle: plant, backswing, and the forward swing into frame 0, where the strike completes the kick. |

## Brief checklist

| Check | Result |
|---|---|
| Narration verbatim, voice first, animation timed to the read | **Yes.** It was generated first, and every beat is keyed to its measured word time (`story.ts` T). The take is 24.5 s. The voice runs unedited: no stretch and no gap cuts. |
| Emphasis on "working knee", "pointing behind him", "wiggle his toes"; brisk open; pleased last line | Directed with capitals and tags. Take 1 was chosen for its stronger "pointing behind" (+1.6/+2.1 dB). |
| Frame 0 shows the backward foot in the cutaway socket at the bending joint | **Yes.** `qa/final/muted_phone_0-1.6s.png`, checked muted at phone size. The foot's toes point back. The forward cleat and the skin-toned bare foot read differently. |
| The backward foot visibly controls the kick | **Yes.** Through the follow-through, the foot inside the socket goes from horizontal (knee bent) to pointing (knee straight). |
| Ball leaves in the first half-second | Contact on frame 4 (0.13 s); out of frame by 0.35 s. |
| Match on the joint to the original-leg illustration | Same pose and screen position at the cut; the stride carries across. |
| Half-turn: about the long axis, 3/4 pass, heel/toes trade, thigh still, ends heel forward and toes back at knee height | **Yes.** Frame-stepped every frame from 8.4 to 10.2 s. There is no mirrored frame, no detached ankle, no pass-through, and no end-over-end flip; the thigh stump doesn't move. |
| Bench: staggered legs, both knees bend together, cutaway retained | **Yes**, with the cutaway on for the whole shot. |
| Recovery: face and foot in one frame, one small unmistakable wiggle, slight smile | **Yes.** |
| Soccer ending: cut on downward movement, weight shift, short approach, kick, opening angle, loop | **Yes.** The ball contact is the loop's audio accent. |
| Same surgical leg throughout | His right leg, nearest the camera, in every shot. |
| Bloodless, respectful surgery | Clean cut faces in tissue pink and bone cream, a white dressing, and no blood anywhere. |
| On-screen words are narration captions only, placed off the joint and ball | Captions are high in the pitch and illustration shots, and low on the bench and in recovery, where the action sits higher. |
| Sound: light cleat scuff, ball strike, restrained ambience, narration in front | **Yes.** Effects sit 19–20 dB under the voice and ambience about 26 dB under. |

## Measured checks (`qa/final/`)

- `render_qa.json`: no decode errors. The cuts at 3.33, 17.4 and 20.7 s and the 14.0 s dissolve are the planned large changes. The other flagged steps are subject motion:
  - 2.5–3.3 s: the jog at full speed in close-up, with a steady lens (inspected frame by frame).
  - 24.2–24.5 s: the kick's backswing.
  - Single frames at 0.47 and 1.87 s: the follow-through and a landing.
  An out-of-order camera key at 7.77 s was found in an earlier pass and fixed.
- Near-static: the longest run is 33 frames (1.1 s, the plate before "save his foot").
- `loop_seam_last3_first3.png`: the swing is continuous through the seam.
- `contact_every_0.5s.png`, `hook_0-2.5s_every_3rd_frame.png`, `muted_phone_0-1.6s.png`.

## Known weaknesses (for review)

- **Simplifications.** The prosthesis is simplified: a cutaway socket, pylon and cleat, with no thigh corset or side hinges.
  The socket is drawn roomier than a real one so the foot's outline reads.
- **The turned foot's seat in the socket is stylised.** It sits 35° off the shank axis when the "knee" is straight.
- **The bench is seen end-on, so it reads partly as a table top.**
- **The 3D foot and the 2D socket foot are two drawings.** They differ slightly (the toe layout). The switch happens under the prosthesis
  fade and the matched dissolve.
- **The illustration's ghost** shows his cleat and sock on the far leg, so he is in his kit even before the operation.
- **The recovery bed's foam wedge** is a stylisation to let the foot hang free.
- **Nobody has watched it in real time with sound;** the audio checks are measured, not listened to.

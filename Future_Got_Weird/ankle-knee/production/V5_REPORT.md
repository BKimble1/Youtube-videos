# Ankle Knee V5: final polish report

**Deliverable:** `exports/FGW_Ankle_Knee_V5_FINAL_1080x1920.mp4`. V5 is a focused polish of V4. The approved narration, the captions (words, timing and placement), the character design and the 2D vector style are unchanged. V1–V4 still render unchanged.

| Measure | Result |
|---|---|
| Format | True 1080×1920 (SAR 1:1, DAR 9:16), 30 fps, 725 frames, 24.167 s; H.264 yuv420p BT.709; AAC 48 kHz stereo 320 kb/s; 11.49 MB; no decode errors |
| Narration | The same approved take, sample for sample (`audio/narration/FGW_Ankle_Knee_narration_V3.wav`). The captions use the same timeline as V4 |
| ASR of the final file | whisper base.en WER **0.000** (`qa/v5_final/asr_final.json`) |
| Mix | -13.78 LUFS integrated, -1.6 dBTP. Voice -16.82 LUFS, effects -38.09, ambience -44.69. The closing strike sits under the voice's "kick" |
| Measured frame QA | 0 unplanned large frame changes. Longest near-still stretch: 31 frames, on the still X-ray (unchanged from V4). The loop seam is now a deliberate cut, from the full-frame ball to frame 0 (`qa/v5_final/`) |

Note: the two reference screenshots mentioned in the brief did not reach this session. The corrections below follow the written description, checked against V4 frames rendered to reproduce each problem.

## 1. The soccer torso (`source/src/v5/body5.tsx`, used by every pitch shot, including the opening)

**The problem in V4.** The far side's screen offset is what separates the planted cleat from the ball in the decisive frame. But the V4 body passed that 22 cm offset straight to the pelvis, the jersey's far side and the far shoulder, and the torso was anchored over the near hip. The jersey therefore skewed toward the far hip and the far arm hung off the edge of the body. The shoulder joint also sat 4.5 cm under the neck point, and the sleeve rode up past it, so the shoulders bunched at the jaw.

**V5 changes:**
- **Body offset:** the far leg still uses the offset, now 16 cm. The torso takes at most 6.5 cm of it, so the jersey stays square over the hips.
- **Torso position:** the waist sits over the middle of the pelvis, between the hips.
- **Shoulders:** the shoulder joint is lower on the rib cage (18.9 instead of 20.5), and the sleeve no longer rides above it. The shoulders are relaxed and the arms attach at believable shoulder positions.
- **Neck:** the neck point rises from 25.0 to 26.8, so a neck shows between the collar and the jaw.
- **Far thigh:** the far thigh's shorts run back into the pelvis, so the far leg joins the hips.
- **Torso motion:** the torso now moves with the kick, keyed on one clock with the legs. The chest leans back a little on the wind-up, comes over the ball at contact and counter-balances the rising leg in the follow-through, and the pelvis rolls under with the kicking hip (`kick5.ts` CHEST and PELVIS).
- **Legs and prosthesis:** both are computed exactly as before, so the rotationplasty anatomy is untouched.

## 2. The hospital blanket and the leg connection (`source/src/v5/bed5.tsx`)

- The blanket is now a hospital blanket with its own colour; in V4 it was the same blue as the gown.
- It covers only his other leg, from the knee down, and is drawn behind his pelvis and the operated leg.
- Its near edge is turned back and lies in folds on the mattress. Nothing crosses between his body and the exposed limb, so the body traces continuously: pelvis → gown hem → thigh → the bandaged join → the turned lower leg → the backward foot.
- His near hand rests on the gown at his side, not on the join.
- **The wiggle:** the foot holds still (its angle no longer follows the toes), and only the toes curl, spread and press the sheet. The backward foot orientation is unchanged, and so is the toe-to-socket match cut.

## 3. The 1–3 s section, about 12% quicker (`kick5.ts`)

- **Unchanged:** the immediate kick (frame 0 one frame before contact, contact on frame 2), the follow-through and the ball wipe.
- **The landing and settle:** about 12% quicker. The landing comes at 0.70 s instead of 0.84, and the soft-knee stance settles by 0.94 s, earlier than in V4.
- **The bend, on "working":** reaches full bend 0.46 s after the word starts (V4: 0.52 s). The hold is trimmed to a short beat, and the return takes 0.50 s (V4: 0.6 s).
- **The tail:** instead of V4's long hold, a second, smaller bend carries the motion into the X-ray cut.
- **The cleat:** it is moved by IK along a path that leaves the turf at once, so it never dips into the ground. The worst case measures 0.44 cm of press.
- **Narration and captions:** unchanged and still in sync.

## 4. The closing payoff, about 20–24 s (`story5.ts`, `kick5.ts`, `pitch5.tsx`)

V4's repeated wide hold (the pass, the run-up) is replaced by four framings, each cut on the action:

| Time (s) | Words | Shot |
|---|---|---|
| 20.20–21.35 | "to use his new leg," | A brief balanced stance behind the ball (wide) |
| 21.35–22.50 | "that same foot helped him" | Cut as he steps: close on the prosthesis. The support foot plants, then the turned ankle bends inside the socket as he winds up (the pylon and cleat swing back and up), and the forward swing begins. The lens follows the joint |
| 22.50–22.83 | "kick" | Cut on the swing: low on the shoe and the ball. Contact lands on "kick" (22.633, a whole frame) |
| 22.83–24.13 | "a soccer ball." | Cut as the ball leaves: his follow-through on the right while the ball comes at the lens on his left, swelling until it fills the frame on the last frame |
| → 0 | | The full-frame ball cuts back to the opening's decisive frame, so the ball's motion leads into the loop |

## Frame-by-frame checks

- **Shoulder to neck, shirt to pelvis, arm joints:** checked at full size in the decisive frame, the follow-through, the stance, the ankle close-up and the flight shot. The neck is visible, the sleeves sit below the collar, the jersey runs into the shorts over both hips, and both arms leave the shoulder line.
- **Blanket overlap:** checked in the wide shot at full size and in the toes and notice shots. The blanket stays behind and below the operated leg.
- **Prosthesis alignment and ground contact,** measured over every frame of both kicks:

| Measure | Opening | Ending |
|---|---|---|
| Prosthetic cleat, worst press into the turf | 0.44 cm | 0.23 cm |
| Support cleat, worst press | 0.23 cm | 0.23 cm |
| Largest per-frame hip step | 0.88 cm | 0.59 cm |

  V5 removed three V4 faults:
  - The landing touched down early and bounced.
  - The support toe dug 2.9 cm into the turf on the adjusting step.
  - The plant dropped the hip 7 cm in one frame during the new ending.

## Rebuild

    source/node_modules/.bin/esbuild tools/export_cues_v5.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec5.cjs && NODE_PATH=source/node_modules node /tmp/ec5.cjs audio/cues_v5.json
    python3 tools/make_audio_v5.py mix_v5
    (cd source && npx remotion render src/index.ts AnkleKneeV5 ../exports/FGW_Ankle_Knee_V5_FINAL_1080x1920.mp4 --props='{"audio":"mix_v5","captions":true,"v5":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    FGW_CUES=audio/cues_v5.json python3 tools/qa_render.py exports/FGW_Ankle_Knee_V5_FINAL_1080x1920.mp4 qa/v5_final
    # sheets: cd source && ./sheet5.sh out.png "f1,f2,..." [captions] [cols]

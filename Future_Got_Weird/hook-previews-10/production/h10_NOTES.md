# HOOK 10: BRAIN_SPINE_IMPLANT: notes

Line (locked): "A brain implant helped this man walk again… by bypassing his spinal injury."
Output: `exports/FGW_HOOK_10_BRAIN_SPINE_IMPLANT.mp4`. Source: `source/src/h10/` (event times in `scene/cues.ts`, all read
from `data/h10_words.json`).

## Shot plan (one continuous camera, no cuts)

| window | picture | word sync |
|---|---|---|
| 0–0.5 | Frame 0: the whole participant mid-step behind a front-wheeled walker, near leg swinging forward; headset on his head, cable to a backpack, belt transmitter. Camera already pushing in. | "A brain implant" |
| 0.5–2 | The near foot lands (0.62 s), the far leg swings (0.85–1.77 s); the camera rises along his body to the head. At "walk" (1.62) a soft window opens on the head: skull, brain, motor cortex, the two skull implants under the headset coils. | "helped this man walk" |
| 2–4 | Motor cortex fires (2.04), the implant electrodes record (2.16), pulses hop to the headset coil (2.30) and run down the cable behind the neck to the backpack processor (2.42–3.24). The brain's own signal runs down the cord and dies at the dark, scarred C5–C7 segment (3.02). The window follows the signal down the back: processor lights decode (3.28–3.58), cable to the belt transmitter (3.54–3.76), hop through the skin to the abdominal pulse generator (3.78), along the lead to the paddle on the lower cord (3.88–4.10). | "by bypassing his spinal injury" |
| 4–6 | The paddle fires (4.12), pulse trains run down the femoral, sciatic and peroneal nerves; quadriceps, calf, tibialis and hamstrings light in turn as the near leg takes its step (swing 4.30–5.22, foot lands 5.22); the far leg lifts at 5.45. Camera eases back to the legs; he and the walker keep rolling forward to the last frame. | "injury" (4.10) |

## Transitions

| outgoing | incoming | new information | kept |
|---|---|---|---|
| full figure stepping | push-in and tilt up to the head | the headset sits over the brain | same body, same walk, continuous camera |
| head exterior | soft local window on the head | motor cortex, skull implants under the coils | headset, face, walk all continue |
| head window | window slides down the neck and back | cable bypass vs. blocked cord at C5–C7 | the pulse rides one physical path the whole way |
| back | lower back and hip | processor, belt transmitter, pulse generator, lead, paddle | the window travels; earlier part fades behind it |
| lower back | near leg | nerves and muscles firing as the step happens | the camera eases back, the walk never stops |

## Science

Shown: two skull implants over the sensorimotor cortex (on the dura, electrode contacts on their underside); a headset
whose antenna coils sit over them; a portable processor in a backpack; a transmitter over an abdominal implanted pulse
generator; a lead to a paddle electrode on the back of the cord over the T11–L1 levels (the lumbosacral segments),
below an injured cervical segment; pulses in leg nerves and muscle activation. He walks with a walker, at a slow,
deliberate pace, which keeps the "experimental, assisted" reading.
Deliberately not shown: the participant's face or name (the man is a generic adult adapted from the channel rig); any
"cure" framing, any AI graphics, labels or HUD. The system is shown for one person only.
Simplified: the link from the processor to the pulse generator is drawn as a cable to a belt transmitter plus a short
hop through the skin; the real system uses a wireless module over the generator. The implant electrode grid (64) and
paddle (16 electrodes) are shown as a row of contacts, not every electrode. The cutaway is a stylised mid-sagittal
view on a 3/4 figure. Vertebra counts are correct (C1–C7, T1–T12, L1–L5, sacrum).
Source: Lorach H. et al., "Walking naturally after spinal cord injury using a brain–spine interface", Nature 618,
126–133 (2023) (EPFL/CHUV, Clinatec/CEA).

## Assets

Reused (copied into `source/src/h10/rig/`): Glass Climbing V3 / Death Clock man rig `glass-climbing/source/src/dc/`
(`Man.tsx`, `Head.tsx`, `Hand.tsx`, `limb.tsx`, `shade.tsx`, `ink.tsx`, `color.ts`, `math.ts`). Adapted: neutral outfit
(blue-grey tee, charcoal trousers), a short brown crop and a trimmed beard in place of the red spikes (`crop` option
in `Head.tsx`), neck lengthened (`DIM.neck` 18 → 50) so the cervical spine shows. Newly drawn: walker, rehab-gym
backdrop, headset, backpack, belt transmitter, cables, the walk (`scene/walk.ts`), skull, brain, implants, spine,
cord and lesion, paddle, lead, pulse generator, hip bone, leg bones, muscles and nerves, the travelling window and the
pulses.

## Audio cues (`tools/audio/h10.py`, fx −27 LUFS)

Bed: clinic room tone, faint 60 Hz hum and low pad; walker wheel rumble. Footsteps 0.62 / 1.77 / 4.07 / 5.22 (last one
loudest), scuffs at lift-offs, walker frame ticks 0.62 and 5.22. Cortex shimmer 2.04; electrode ticks 2.16; coil beep
2.40; cable zaps 2.42–3.02; dull thud and fizzle at the injury 3.02; processor clicks 3.28; belt zaps 3.54; transmitter
beep 3.78; lead zaps 3.88; paddle zap 4.12 and a stimulation pulse-train buzz 4.12–6.0; muscle creak and squeeze 4.30.

## QA

Pass 1 (render 1): `qa_clip.py` all_pass, but the rendered file showed a striped ghost behind his back from about
1.8 s on (stacked stale copies of the torso outline) that single stills did not show. Bisected with short renders:
duplicate React keys in the copied rig (`Man.tsx` sleeve parts `key="in"` / `key="sl"` used by both sleeves in one
child list) leaked old DOM nodes during sequential rendering. Fixed with per-sleeve keys; also replaced the blur
filter in the window mask with stacked strokes and trimmed every oversized mask/clip rect. Verified on a 0–60 test
render and on the full final render (every 3rd frame inspected).
Pass 2 fixes: brainstem shortened so it no longer covers the injured segment; cord path smoothed; head tint lighter so
the face reads through the window; anatomy drawn head-first so the cord and lesion sit on top; natural signal now stops
at C5 (top of the injury).
Earlier source passes: duplicate `h10-win` id (the mask resolved to a gradient, so the cutaway was not local); headset
redesigned (it read as goggles); pulse generator moved above the belt; pelvis bones simplified; neck lengthened.

Final `qa/h10/qa.json`: all_pass true; 180 frames, 1080x1920, 30 fps, h264 yuv420p, 6.000 s, AAC; mix −16.72 LUFS,
peak −1.01 dBFS, voice onset 0.02 s; longest static run 0 frames; motion per second [3.81, 7.69, 5.91, 12.41, 10.84,
6.10]; no frame jumps over 18.

## Known limitations

- The man is the channel's cartoon rig at 3/4 view, so the sagittal anatomy is a cheat (spine at the back edge of a 3/4
  torso, brainstem behind the cheek).
- The face is partly darkened while the head window is open (2.0–3.3 s).
- The near walker frame hides part of the legs in the opening second; the step reads mainly from the feet and knees.
- Only the near leg's nerves and muscles are drawn; the far leg is also stimulated in the study.
- Caption phrase 2 sits over his face around 3.6–4.2 s (the action is lower on the back then).

# Real Web Fluid V3: final visual pass, checks and remaining problems (24 Oct 2026)

V3 rebuilds the picture again on the locked narration (same take, words, timing and 31.73 s). Not published.
Shots, transitions and the one-second audit: `V3_SHOTS_AND_TRANSITIONS.md`. Source: `source/src/v3/` (composition
`RealWebFluidV3`).

## What was inspected first

- The V2 render and its source (`source/src/v2/`), and the Death Clock art system already copied from
  `Future_Got_Weird/Shorts/death-clock` (commit `e5b4770e`) into `v2/dc/`, copied again to `v3/dc/`.
- The supplied 512×910 copy is a proxy: our V2 review measures 1080×1920 (ffprobe). V3 is rendered natively at
  1080×1920 and at 2160×3840.
- Factual basis for the lab: the Tufts Now article (10 Oct 2024) on the moth-silk fibres: a silk solution through a
  coaxial needle with acetone round it, fibres that stick to and lift objects such as a scalpel blade from sand, and
  the "over 80 times their own weight" figure. No recipe or quantities are shown.

## What changed against the brief

| Brief | V3 |
|---|---|
| Clean-shaven lead | Jaw shade and cool bounce removed from the head; the lower face is one skin tone (`v3/dc/Head.tsx`). Face design unchanged. Face shading, gloss and glasses glare reduced. |
| Matte gloves, flatter shading | Glove sheen 0.2 on palm, fingers and thumb; the palm blob's specular scales with it. |
| Opening 0-2.2 s | Frame 0 is already completing the aim with the runner in the same composition. The forearm arrives first (by frame 4), then a small wrist adjustment while the middle and ring fingers curl onto the trigger (2-7); the shot at 8 with a short follow-through; a 7-frame flight; contact at 15; the web spreads organically over about 10 frames (dab, then wavy branching strands, then sparse cross-links), the jacket compresses, the strand draws tight at 30, torso reaction and recovery step. No mesh decal, no white circle, no blast. |
| Transition 2.2-7.2 s | The strand dive and the gold pattern are gone. Cut along the taut strand (same screen direction) to the wrist shooter, forearm level, fingers relaxing; a push into the cartridge window with no spin or rotation until the silk solution fills the frame, strands converging on the outlet port; material match at 150 into the lab's silk syringe (same strands, mapping, colour and direction; a six-frame blend covers only the frame edges, where the window's rounded corners differ from the barrel's); pull back to the syringe, pump, beaker, resting hand and face. |
| Hands | A pose library (rest, pinch-open, pinch, rod-open, rod fist, button press, nozzle grip, tightened grip) placed from the hand's own geometry (`digitTips`, `placeHand` in `Lab3.tsx`), plus `hold` in `dc/Hand.tsx`: the held object is drawn between the rear and front digits. The cocoon sits between the index tip (in front) and thumb tip (behind); the rod and the nozzle pass through closed fists, visible on both sides; the index tip lands on the pump button. Arms never stretch (`MAX_STRETCH = 1`). Release after contact; grip before movement (regrip 604-614 before the pull at 619). |
| Lab as readable actions | One bench, right to left in the order the material moves; close views: pinch and lift with fibres drawing out, set on the solution and let go, stirring with a rod (small wrist ellipse, rod immersed), one-finger button press, the solution drawn up into the syringe and pushed on, the nozzle cutaway with both channels flowing (moving dashes in the silk core and on both sides of the acetone channel), hardening at the outlet, the fibre forming and travelling, contact, slack drawn out, regrip, pull (taut first), lift, sand falls. |
| Strength section | No four-second hold on the hanging blade: junction close-up, up the fibre to the outlet and hand, the carry, the lowering into the tray. No numbers, displays, masses or human-load claims. |
| Loop | The film ends on a steady push onto the real nozzle's aperture, anchored on it; at 951 the aperture is at frame 0's outlet position (389, 1069) and direction (177.9°) and moves with frame 0-1's outlet velocity. The glove is out of frame. |
| Sound | Narration unchanged (gain only). Effects rebuilt from the V3 cues (`tools/v3/export_cues_v3.ts`, `tools/v3/make_audio_v3.py`): trigger click, one crisp release, short air with the 7-frame flight, adhesive slap and sticky spread, tension, then the lab sounds at the V3 frames. No booms. |
| Captions | Same text, timing and typography; heights checked frame by frame against the hands, the device port, the outlet, the nozzle channels, the fibre end, the blade and the cocoon (`tools/v3/cap_check3.ts`, `qa/v3/caption_check.json`). |

## Checks on the rendered files

Review `exports/FGW_Real_Web_Fluid_V3_REVIEW_1080x1920.mp4` (`qa/v3/review_qa.json`, `qa/v3/review_sherpa.json`,
`qa/v3/motion_scan.json`, strips in `qa/v3/strips/`):

- H.264 High 1080×1920, 30 fps, 952 frames, 31.74 s, BT.709; AAC 48 kHz stereo
- −14.6 LUFS, LRA 3.6 LU, true peak −2.6 dBFS; no black frames, no freezes of 1 s or more; keyframes at most 0.5 s apart
- audio vs the V3 mix: 0 ms offset, correlation 0.99997; voice stem vs the source narration: correlation 1.0, same length
- narration: Whisper base.en WER 0.03 ("mid-air", "80" only); zipformer 0.09 and Vosk small 0.10 (recogniser errors
  such as "acidone", "moscow coons"; the narration file is identical to V1/V2's)
- frame-difference scan: one spike, frame 66 (the planned cut from the runner to the wrist device); the blend at 150-156
  shows no spike
- inspected from the MP4: every frame 0-74 (`hook_0-31.png`, `hook_32-74.png`), the bridge every 4 frames, the match
  140-170, the last 2 s followed by the first 3 s (`loop_last2.png`, `loop_first3.png`), and two frames per second over
  the whole film (`audit_2fps.png`); during the work, contact sheets of the source every 15 frames through the lab and
  1:1 crops of the pinch

Master `exports/FGW_Real_Web_Fluid_V3_MASTER_2160x3840.mp4`: see the section below (added after it was rendered and
measured).

## Remaining problems

1. **Not watched in real time with sound.** This environment has no display or speakers.
2. **The cocoon is small against the gloved hand** (true to scale for a hand; the lead is drawn larger than the bench
   scale). In the pinch close-up it reads, but in medium views it is a small cream shape, and the fibres drawn out of
   it are thin lines.
3. **The dissolve is an illustration:** the cocoon loosens and fades into the solution over about 1.5 s while the
   liquid turns gold; it is not a process the viewer can follow.
4. **Two caption overlaps remain:** frames 757-760 (the nozzle outlet passes through the top caption as the camera
   moves up the fibre) and frame 776 (one frame at the start of "eighty times their own weight"); that caption sits at
   mid-height (880) and the vertical fibre runs behind it.
5. **The loop matches the aperture's position, direction and motion, not its size:** the lab nozzle is about three
   times larger on screen than frame 0's outlet, and the lab nozzle trails the slack fibre while frame 0's outlet has
   none. The cut changes setting and scale at once.
6. **Hands are drawn twice in the lab** (body behind the bench, hands over the apparatus); the overhand nozzle grip
   reads as a fist on top of the nozzle rather than a clearly wrapped grip, and the inner finger separation lines are
   heavy in close-ups.
7. **The near hand's trip from the pump to its rest** (about 1 s after the button press) passes through the air above
   the bench.
8. **The device close-up holds** for about 10 frames (140-150) once the fluid fills the frame, and the runner's hold
   before the cut (about 45-66) is nearly static.
9. **The lab fibre's travel is slowed** (about 3 s for 12 cm) so it can be followed, and the lead takes a few steps
   during the carry (his near hand is hidden behind the bench then).
10. **One voice take**; the duration stays 31.73 s because the voice is locked.

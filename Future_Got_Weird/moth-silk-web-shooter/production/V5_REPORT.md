# Real Web Fluid V5: animation, pacing and quality pass, checks and remaining problems (24 Oct 2026)

V5 is a new animation pass on the locked narration. **Not published.** The narration is unchanged: the same take,
words and timing, 31.73 s; no re-recording, no speed change. Source: `source/src/v5/` (composition
`RealWebFluidV5`). Shots and transitions: `V5_SHOTS_AND_TRANSITIONS.md`.

## What changed against the brief

| Brief | V5 |
|---|---|
| Opening (0-4 s) | Frame 0 is inside the shot. The wrist snaps at -8 to 1, driven by shoulder, elbow and wrist, with a short overshoot and recoil. An eruption at the outlet at 2 (streaks, droplets, glow). A 5-frame linear flight; impact at 7. Four bands are drawn round his chest and both arms (thickness varies along each band, with shadow and highlight), taut at 14. He struggles against them (hips, knees, torso twist, arms pinned). His caught arms were re-targeted so they lie along his sides. The camera then follows one band in toward its material (58-95). |
| Material transition | Gold liquid chains of varied thickness and depth flow in the band. A front sweeps across; behind it the chains straighten and zip into four strands, which draw together and bend into arcs. The arcs become the cocoon's wound silk in the lab (shape match at 150). This is an illustration, with no labels. |
| Scientist and cocoon (5-11 s) | The camera pulls back off the cocoon to the bench while the gloved hand is already coming in. The fingers open, make contact at 191 and curl round, with the thumb opposed behind; a quick lift (197-208). The other hand pinches a thread and draws it out (223-247). The cocoon is carried over the beaker and dropped in (splash at 273). The rod is stirred in the fist with the other hand at the beaker (288-324): a vortex, and strands that break up and fade as the liquid turns gold. Then the pump press, the solution drawn along the tube, and the far hand lifting the nozzle off its stand (wide). |
| Liquid and nozzle (11-17 s) | The camera travels in along the nozzle while its wall opens from rear to front, riding the flow to the tip. Silk is in the core with acetone round it, both flowing. The core extrudes from 400. The sheath disperses in droplets, and the strand turns from gold to white as it sets. The camera follows the strand out, then draws back so the outlet and hand are on the right and the strand reaches into open space. No side view is held; there are no diagrams or labels. |
| Attachment and lifting (17-27 s) | Contact at 566: a squash on the steel, a wave running back along the fibre and a small camera kick. The slack draws out. The pull is shown wide, with hand, fibre and blade in one frame: the fibre is taut and trembling, the sand cracks, and the blade rocks. It breaks free at 652 (sand burst, grains falling). Then comes one continuous rise of the hand. The blade hangs as a damped pendulum on the same fibre length (no stretch), swinging in under the hand to about 2.4 blade lengths above the sand. For "eighty times their own weight": a low close view under the blade, with the single thread rising out of frame and a highlight running up it, then the load; then back to the scientist holding it up with a grin, the whole load path in one frame. The blade is then set back down in its dish (the V4 carry to a tray, with its walk, is gone). There are no numbers, masses or human-load claims. |
| Ending (27-31.7 s) | The camera travels up the slack fibre to the nozzle, which turns to the wrist shooter's outlet direction. At 876 the outlet cuts to the imagined wrist shooter's outlet at the same place, direction and size, with a 7-frame streak along the line. The device close-up is moving from the cut (no hold): the hand rises into firing position, the camera pulls out, and the arm snaps into frame 0. No new narration. The lab device is never shown firing. |
| Sound | Narration unchanged (gain only). New and retimed effects: the snap, eruption, impact, wrapping, struggle (cloth, creaks, scuff), the material zipping, glove contact and squeeze, thread, splash, stir, pump, nozzle off the stand, extrusion and hardening, contact, tension and resistance, sand cracking, break-free, lift, a shimmer on the strength beat, the blade set down in the sand, the slack fibre, and the seam streak. |
| Captions | Same text, timing and typography. Heights re-checked against the V5 action points, now including the scientist's face (`tools/v5/cap_check5.ts`, 0 overlaps). |

## Checks on the rendered files

Review `exports/FGW_Real_Web_Fluid_V5_REVIEW_1080x1920.mp4`. Reports: `qa/v5/review_qa.json` and
`qa/v5/motion_scan.json`; strips in `qa/v5/strips/`.

- H.264 High 1080×1920, 30 fps, 952 frames, 31.74 s, BT.709; AAC 48 kHz stereo
- −14.5 LUFS, LRA 3.6 LU, true peak −2.6 dBFS; no black frames, no freezes of 1 s or more; keyframes at most 0.5 s apart
- audio vs the V5 mix: 0 ms offset, correlation 0.99997; voice stem vs the source narration: correlation 1.0
- narration: Vosk small WER 0.10, with the same recogniser errors as V4 on the unchanged take ("moscow coons", "new poll", "lives")
- loop seam: the mean change from the last frame to the first is 9.1, against 11.1 and 10.5 for the steps before it (V4: 87). The loop is continuous motion.
- frame-difference scan:
  - one spike, at 876: the intended lab-to-street cut.
  - one run of 10 or more low-change frames, 410-442: the extrusion close-up. The camera moves slowly along the forming strand, which is small in a mostly flat frame.
  - two holds from the first render are gone: the frozen device close-up at 876-889, and contact at 570-580.
- inspected from the MP4:
  - every frame 0-31 (`hook_0-31.png`)
  - every frame of the cocoon grab 180-209
  - the dissolve 273-336
  - the extrusion 372-447
  - attach, pull and lift 558-708
  - strength and lowering 708-853
  - the end transition 852-894
  - the last 2 s and the first 3 s
  - two frames per second over the whole film (`audit_2fps.png`)
- found in the MP4 and fixed before this render: the caption "eighty times their own weight." sat on the scientist's face during the reveal; it now sits low, with the framing adjusted.

Master `exports/FGW_Real_Web_Fluid_V5_MASTER_2160x3840.mp4`: rendering from the same composition and mix at 2× (checks to follow).

## Remaining problems

1. **Not watched in real time with sound.** This environment has no display or speakers; pacing was judged from frame strips, a frame-difference scan and the audio measurements.
2. **The extrusion close-up is sparse:** a thin subject in a mostly empty frame for about 1 s (410-442).
3. **The fibre's flight is still slow** (444-566, about 4 s, matched to "A sticky fiber forms in midair"). Framing and a running highlight help, but the fibre is a hairline at that zoom.
4. **The cocoon is small against the glove.** In the grab the fingers cover most of it, and the opposed thumb is behind it and barely visible.
5. **The pull is shown wide** (zoom 1.75-1.9), so the sand cracks and the blade's rocking are small on screen.
6. **The scientist steps left during the lift** (his legs are hidden by the bench; the step reads as a sway with a bob).
7. **The material close-up is an illustration** of chains setting into strands, not a depiction of the real process at scale.
8. **The loop cuts from the lab to the street** at 876. Place, direction, size and motion match, but the setting changes at once (a 7-frame streak carries across).
9. **One voice take;** the runtime stays 31.73 s because the voice is locked.

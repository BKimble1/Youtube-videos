# Real Web Fluid V4: momentum and timing pass, checks and remaining problems (24 Oct 2026)

V4 revises the V3 source animation for momentum. Not published. The narration is unchanged: the same take, same
words, same timing, 31.73 s; no re-recording, no speed change. Source: `source/src/v4/` (composition
`RealWebFluidV4`). Shots and transitions: `V4_SHOTS_AND_TRANSITIONS.md`.

## What changed against the brief

| Brief | V4 |
|---|---|
| First 2.5 s rebuilt | Frame 0 is inside the trigger gesture, framed tighter on the wrist shooter with the runner ahead in the same frame. Fire at 5. A 6-frame flight with a linear (not eased) head and a longer smear. Contact at 11. One connected spread by about 20 (dab, wavy strands that follow the back and sleeve, a few cross-links, off-white). Tension at 22, then chest and shoulder, then arms, then recovery step. Cut at 30. |
| No two-stage reveal of the shooter | The cut at 30 follows the strand back to the wrist with the camera already pushing (ease-out: full speed at the cut) while the hand settles from firing. The cartridge window's edges leave the frame by 46. One action, no stationary palm. |
| Device operating, follow the material | 46-62: a brighter pulse is driven down the cartridge to the port while the strands draw together. 60-84: a connected cutaway opens (port, channel, barrel) and the camera follows the pulse into the barrel. 80-120: a cohesive strand forms at the outlet and runs out of the frame. No static yellow chamber. |
| Shape match into the lab reservoir | At 120 the barrel's liquid band (its place, size, direction and the same fluid mapping) becomes the silk syringe's. The lab is revealed through the reservoir and a hand that is already travelling toward the cocoon dish, not a static wide shot. |
| Remove "arrive, hold, zoom" | The lab camera now runs on a Catmull-Rom spline through its keys (x, y, log zoom) instead of easing to a stop at each one. Every beat starts while the previous one is still moving. |
| Cocoon | Fingertips already approaching at the match. Pinch by the cocoon's near end (index in front, thumb behind), so most of it shows past the fingers. Lift with fibres drawn back to the dish. In the close view the outer silk separates into fine fibres. Carried, set on the solution, released after contact. |
| Dissolving | Fist round the rod (fingers in front, rod visible above and below). A small wrist ellipse, elbow following. Arcs circulate in the liquid. The cocoon loosens into threads that spread, thin and fade as the liquid turns gold. Then the index presses the pump and streaks converge on the intake tube: the solution flows toward the apparatus. |
| Nozzle | The camera follows the solution along the tube and arrives with silk already entering the core. Acetone then fills the outer channel round it (both flowing). At the outlet the core turns into a white fibre and the sheath disperses. The camera pulls back with the new fibre. The camera stays stable while the materials change. |
| Attachment to completion | Contact and a slight adhesive squash. Slack drawn out. Regrip. Hand and nozzle withdraw together, taut first. The blade edge rises and sand falls. The blade hangs under the thin fibre. The strength line covers: the junction close-up, then the whole load path with the hand guiding it toward the tray, then lowering until it touches and lies down, then the fibre is released (slack). No numbers, masses or human-load claims. |
| Ending and loop | Retrieval finishes before the ending. A connected bench view runs past the source cocoon on to the nozzle. The nozzle then swings down into aim about the hand with the opening forearm's own easing, time-shifted. At the cut the aperture matches frame 0's outlet in position (532, 1049 vs 534, 1026 one frame earlier), direction (-174.4° to -176.4°, still turning the same way), and scale (the needle's outer radius equals the shooter barrel's outlet radius on screen; lab zoom 2.6). The glove has left the frame before the cut. |
| Robber arms | Rebuilt at source. The old caught targets sat about 110 px from the shoulder on a 234 px arm, so the elbows folded forward into a self-hug; the elbow side was also wrong. Now there are three poses with plausible hand distances: running (about 90° elbows, counter-swing), impact (the free forearm forward, clear of torso and bag) and caught (upper arms in to the sides, soft elbows). The arms lag the chest by about 2 frames. The right hand keeps the bag, held behind his hip, throughout. Segment lengths are fixed (no stretch). The run's hip pops at each foot hand-over are gone: height comes from the lowest foot, and travel is averaged over a stride. A smooth deceleration and a small pull-back replace the stance jump at the catch. |
| Sound | Narration unchanged (gain only). Effects retargeted to the V4 frames (release 5, flight, adhesive hit 11, tension 22, recovery step, device flow, strand, lab events, sand, tray contact, slack). Below the voice; no whoosh on every cut. |
| Captions | Same text, timing and typography. Heights re-checked against the V4 action points (`tools/v4/cap_check4.ts`). |

## Checks on the rendered files

Review `exports/FGW_Real_Web_Fluid_V4_REVIEW_1080x1920.mp4` (`qa/v4/review_qa.json`, `qa/v4/review_sherpa.json`,
`qa/v4/motion_scan.json`, strips in `qa/v4/strips/`):

- H.264 High 1080×1920, 30 fps, 952 frames, 31.74 s, BT.709; AAC 48 kHz stereo
- −14.6 LUFS, LRA 3.6 LU, true peak −2.6 dBFS; no black frames, no freezes of 1 s or more; keyframes at most 0.5 s apart
- audio vs the V4 mix: 0 ms, correlation 0.99997; voice stem vs the source narration: correlation 1.0, same length
- narration: Whisper base.en WER 0.03 ("mid-air", "80"); zipformer 0.09; Vosk small 0.10. These are recogniser
  errors on the unchanged narration, identical to V2/V3.
- frame-difference scan: no spikes. The only run of 10 or more frames with little change is 407-426, the nozzle
  cutaway, where the camera is held while the acetone front advances; that is a deliberate stable view.
- inspected from the MP4:
  - every frame 0-31 (`hook_0-31.png`)
  - the robber's arms through running, hit and catch
  - the device bridge every 3 frames
  - the nozzle 356-470
  - the last 2 s and the first 3 s
  - two frames per second over the whole film (`audit_2fps.png`)
- inspected from source during the work: the robber at 1:4 scale every 1-2 frames through impact; the lab every
  4-15 frames; probes of the hip path, the loop continuity and the frame-0 positions

Master: see below.

## Remaining problems

1. **Not watched in real time with sound.** This environment has no display or speakers; pacing was judged from
   frame strips and a frame-difference scan.
2. **The robber's catch is short** (about 8 frames before the cut at 1.0 s). It reads in frames, but at speed the
   web and the jolt may register as one beat.
3. **The cutaway opens in 3 frames** at 2.0 s (a quick fade of the opened housing), not a wiped cut.
4. **Three short caption overlaps:** frame 73 (1 frame) and frames 74-75 (2 frames) with the device barrel; frames
   894-901 with the blade in the tray at the frame edge during "of a real web shooter…".
5. **The cocoon is still small against the glove**, and the separating fibres are thin lines; they read in the close
   view only.
6. **The dissolve is an illustration** (threads spread and fade, the liquid turns gold), not a process the viewer
   can follow.
7. **The lab fibre's flight is slowed** (about 3 s for 12 cm) so it can be followed; the camera moves with it.
8. **The lead walks a few steps during the carry**; his near hand is hidden behind the bench then.
9. **The loop cuts from a lab bench to the street mid-gesture:** position, direction, motion and outlet scale match,
   but the setting, the costume (sleeve) and the trailing fibre change at once.
10. **One voice take**; the duration stays 31.73 s because the voice is locked.

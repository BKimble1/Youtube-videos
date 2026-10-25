# Real Web Fluid V6: final animation and pacing polish, checks and remaining problems (25 Oct 2026)

V6 refines V5 in the three places the brief named: the robber's capture, the nozzle, and the fibre's attachment
and lift. **Not published.** The narration is unchanged: the same take, words and timing, 31.73 s; no re-recording,
no speed change. Source: `source/src/v6/` (composition `RealWebFluidV6`; V5 is untouched in `source/src/v5/`).
Shots and transitions: `V6_SHOTS_AND_TRANSITIONS.md`.

## What changed against the brief

| Brief | V6 |
|---|---|
| 1. Opening (0-2.5 s) | **Fire and flight.** The shot fires at 0.07 s. The projectile now visibly crosses the frame (frames 3-9), with the camera following it rather than racing ahead. **Impact.** At 0.33 s it hits his upper back: a dab, splatter droplets thrown out, strands and four bands spreading round his chest and both arms. **The stop.** He is still running and takes one more step. At 0.87 s the strands snap taut and he is stopped dead: his front foot is planted and stays planted; the hips now follow the planted feet, where V5 used a smoothed path that slid them. His body is snapped back over that foot, arms pinned, then the rear foot steps and plants. **Settle.** One rock and settle, with no looping struggle (V5's repeating sine motion is gone). **Into the web.** The camera pushes in along a tightening band from 1.1 s, and the existing material close-up takes over at 2.07-2.3 s (V5: 2.93 s). That sequence is unchanged apart from being retimed earlier. |
| 2. Nozzle (12.5-16.5 s) | **New device.** A machined coaxial nozzle (`Nozzle6.tsx`): steel outer needle with the inner needle inside, cone, hex collar, knurled grip band, side port carrying the acetone line, rear fitting carrying the silk line. It is drawn slightly from the front, so the faces toward the tip show as narrow ellipses (three-quarter). It is the same object in every view, wide or close. **Opening view.** The whole nozzle in the hand, on its lines, above its stand. **Cutaway.** It opens from the rear like a sectioned part, with hatched wall faces. The silk solution runs along the inner tube, and acetone enters at the side port and fills the outer channel round it, through the cone into the needle. Both are moving the whole time (streaks and pressure pulses); neither is a static line. **At the outlet.** A bead builds, then a narrow jet is drawn out. The acetone sheath thins and leaves as droplets. The strand sets from gold liquid to a white fibre, with an irregular wobble that settles, fine surface marks, and narrowing. The camera follows it out, and the jet continues as the flying fibre without a jump. No labels, bubbles or diagrams. |
| 3. Attachment (17-20.5 s) | **Target.** The blade in its dish is in frame from about 16.7 s. **Flight.** The fibre keeps forming straight out of the outlet ("forms in midair"), then crosses the remaining distance in an accelerating dash (17.2-18.8 s), the camera moving with its head. **Contact.** On "hits" (18.8 s), shown close: the sticky end spreads into a small flat patch on the steel, with a few fine tendrils, and a wave runs back along the strand. No hook. **Tension.** When the pull starts, the slack line springs taut, overshoots and rings down (one elastic take-up), then the blade starts to react. |
| 4. After attachment (20-27 s) | **Scene 1.** Extreme close-up of the bond under tension: the blade rocks, the sand cracks, and the patch is drawn a little toward the pull but holds. **Scene 2.** Out to the lab view as it comes free: the scientist pulling, and the blade rising out of the sand (a burst of grains, sand falling) in one continuous move on the same fibre length. **Scene 3.** Close on the hanging blade and its settling swing, then the camera travels up the strand toward the hand. **Scene 4, the reveal** ("eighty times their own weight"): the scientist holding it up with the strand and blade in one frame, a soft vignette, a warm light passing across, a glint running up the strand, and a small tightening tug at 26.3 s (the blade lifts with it, the strand rings). The blade's shape and attachment point are the same in every view. No numbers or human-load claims. **Ending.** The V5 carry and set-down is gone; the blade stays hanging into the ending, where the camera travels up the strand to the outlet for the existing match to the wrist shooter. |
| 5. Continuity | Each hand-off is motivated by the moving thing: projectile → bands → material; the flow → the outlet → the jet → the flying fibre; the head → the contact; the bond → the pull-out → the hanging load → up the strand; the reveal → up to the outlet → the wrist shooter → frame 0. The lab-to-street cut and its 7-frame streak are as in V5. |
| 6. Preserved | Narration, voice, captions (text, timing, typography and emphasis), character designs, style, the cocoon-to-pump sequence (5-12 s), the material close-up and the loop. Caption heights were re-checked against the new action (`tools/v6/cap_check6.ts`, 0 overlaps). |
| Sound | Narration unchanged (gain only). Retargeted and new effects: projectile pass, a wetter impact and splatter, the stop (strands snapping taut, jacket yank, planted-foot scuff, recovery step) and the settle; the nozzle stages (section opening, silk run, acetone at the port, bead, extrusion, setting); the strand's dash; an adhesive contact; a low thrum as the slack springs taut and at the tug; the reveal shimmer. The set-down sounds are gone. |

## Checks on the rendered files

Review `exports/FGW_Real_Web_Fluid_V6_REVIEW_1080x1920.mp4`. Reports: `qa/v6/review_qa.json` and
`qa/v6/motion_scan.json`; strips in `qa/v6/strips/`.

- H.264 High 1080×1920, 30 fps, 952 frames, 31.74 s, BT.709; AAC 48 kHz stereo
- −14.6 LUFS, LRA 3.6 LU, true peak −2.6 dBFS; no black frames, no freezes of 1 s or more; keyframes at most 0.5 s apart
- audio vs the V6 mix: 0 ms offset, correlation 0.99997; voice stem vs the source narration: correlation 1.0
- narration: Vosk small WER 0.10, with the same recogniser errors as V4 and V5 on the unchanged take
- loop seam: the mean change from the last frame to the first is 9.1, against 11.1 and 10.4 for the steps before it
- frame-difference scan:
  - one spike, at 876: the intended lab-to-street cut
  - no run of 10 or more low-change frames anywhere; V5's slow extrusion close-up run is gone
- inspected from the MP4:
  - every frame 0-35 (`hook_0-35.png`)
  - the push into the web 33-78
  - the nozzle 360-498
  - the extrusion, flight, contact and tension 489-630
  - the pull-out, lift, hanging load and reveal 630-840
  - the end transition 846-894
  - the last 2 s and the first 3 s
  - two frames per second over the whole film (`audit_2fps.png`)
- inspected from source during the work:
  - the runner's feet through the stop (probed: the front ankle stays at the same point from frame 22; the rear foot plants at frame 36)
  - the nozzle and tip at full resolution
  - the strand hand-off at 492, where a double strand was found and fixed
  - the pull-back from the bond close-up, where the blade briefly left frame and was fixed
  - the reveal framing

Master `exports/FGW_Real_Web_Fluid_V6_MASTER_2160x3840.mp4`: rendering from the same composition and mix at 2× after
the review passed (checks to follow).

## Remaining problems

1. **Not watched in real time with sound.** This environment has no display or speakers. Pacing was judged from frame strips, a frame-difference scan and the audio measurements.
2. **"Three-quarter" is suggested, not built in 3D.** The nozzle is a flat 2D drawing with elliptical end faces and shading. The lab view during the pull is the same side-on stage at a wider, lower framing; there is no true change of viewpoint.
3. **The nozzle is held in the scientist's hand** (as in the rest of the film), connected to the apparatus by its two lines. It is not clamped on a fixture.
4. **The strand is a hairline at the wider framings** (zoom about 1.6-3.4). That is true to the material, but it is easy to lose on a phone screen except where the glint and the close-ups carry it.
5. **In the reveal the blade is small next to the scientist** (about 170 px tall). The strand-to-load comparison is clearest in the close views just before.
6. **The robber's near hand stays forward through the extra step**, then comes in to his side as he is stopped (about 3 frames). It reads as being caught in mid-swing.
7. **The acetone line from the side port stretches up across the frame during the lift and reveal**, as in V5.
8. **The loop cuts from the lab to the street** at 876. Place, direction, size and motion match, but the setting changes at once.
9. **One voice take;** the runtime stays 31.73 s because the voice is locked.

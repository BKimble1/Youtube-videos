# Real Web Fluid V2: visual rebuild, checks and remaining problems (24 Oct 2026)

V2 rebuilds the picture on the locked V1 narration (same take, same words, same timing, same 31.73 s). Not published.
Shots and transitions: `V2_SHOTS_AND_TRANSITIONS.md`. Source: `source/src/v2/` (composition `RealWebFluidV2`).

## What was inspected first

- **Infrared Contacts V2** (`Future_Got_Weird/infrared-contacts`, branch `claude/new-session-fmiflr`) and **Death Clock V4**
  (`Future_Got_Weird/Shorts/death-clock`, branch `claude/intelligent-fermat-pz7wjt`), both in this repository: their
  review videos (frame sheets) and their source. Neither was on this branch, which is why V1 reported the contact-lens
  Short as missing.
- **The lead:** both use the crew's "guesser" (spiky red hair, white tee with saffron stripes). V2 copies Death Clock's
  2D art system unchanged into `source/src/v2/dc/` (`ink`, `shade`, `limb`, `color`, `math`, `camera`, `Head`, `Hand`,
  `Man`; from commit `e5b4770e`) and adds only options: an outfit (colours, long sleeves, gloves), a beanie, a domino
  mask, clear safety glasses, arm foreshortening, a hands-only pass. The runner is built from the same parts.
- **The supplied 512×910 review copy:** the V1 file this project exported (`exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4`)
  measures 1080×1920 (ffprobe), so the low resolution was a proxy made after export, not the render.

## What changed against the brief

| Brief | V2 |
|---|---|
| Distant opening | Close 3/4 of the lead, his forearm swinging into aim at frame 0; fire at frame 13; flight 9 frames with the camera riding the jet; impact at 22 with the web spreading over the jacket in 8 frames (pad, radial strands, branches, cross-links; no blast, no sparks); tension at 38, torso checked, recovery step, look back |
| Transition through the material | Push into a radial strand already on the jacket; weave and strand scale together; the strand's interior (aligned, cross-linked silk chains) fills the frame; travel to where the chains loosen into liquid; the same chain field continues inside the lab beaker and the camera pulls back to hand, apparatus and face. The framed-display cut is gone |
| Disconnected middle | One bench, right to left in the order the material moves: cocoon → beaker → pump/syringe → tube → coaxial nozzle (cutaway: silk core, acetone outer channel, hardening at the outlet with the acetone dispersing) → fibre → blade |
| Small payoff, revisits | Tight contact view; taut before any motion; exposed end rises, buried part slides out, sand falls; blade held large while it hangs; a slow lift and let-down on "eighty times their own weight"; lowered and laid flat in the tray; no return to wide bench views |
| Loop | The last second is the opening's own pose (the same function, time-shifted) at the opening's screen position and size; the cut to frame 0 changes costume and setting mid-gesture |
| Sound | Narration unchanged (gain only); effects rebuilt from the V2 picture: arm swing, click, one crisp release, fast air, adhesive impact, sticky spread, tension, quieter lab sounds |
| Captions | Same text and timing; placement checked frame by frame against hands, outlets, the jet, the web pad, the fibre end and the blade (`tools/v2/cap_check.ts`, `qa/v2/caption_check.json`: 0 collisions), centres at 1480 or 380 px |

## Checks on the rendered files

Review `exports/FGW_Real_Web_Fluid_V2_REVIEW_1080x1920.mp4` (`qa/v2/review_qa.json`, `qa/v2/review_sherpa.json`,
`qa/v2/motion_scan.json`, strips in `qa/v2/strips/`):

- H.264 High 1080×1920, 30 fps, 952 frames, 31.74 s, BT.709; AAC 48 kHz stereo
- −14.6 LUFS, LRA 3.6 LU, true peak −2.6 dBFS; no black frames, no freezes ≥ 1 s; keyframes every ≤ 0.5 s
- audio vs the V2 mix: 0 ms, correlation 0.99997; the V2 voice stem vs the V1 narration file: correlation 0.999996
  (24-bit storage), same length
- narration (Whisper base.en): WER 0.03, differences "mid-air" and "80" only; zipformer 0.09; Vosk 0.10 (recogniser errors)
- frame-difference scan: no spikes; the largest changes (up to 63 at 2.6 s) are inside the continuous push into the
  strand (frames inspected: `push_72-95.png`)
- inspected from the MP4: every frame 0-74 (`hook_0-75.png`), the last 2 s followed by the first 3 s
  (`loop_last2_first3.png`), two frames per second over the whole film (`audit_2fps.png`)

Master `exports/FGW_Real_Web_Fluid_V2_MASTER_2160x3840.mp4`: see the end of this file.

## Remaining problems

1. **Not watched in real time with sound.** This environment has no display or speakers.
2. **The push into the strand (2.4-2.8 s) is fast:** a deep zoom over about 15 frames; it is continuous, but may read as
   a rush on a phone.
3. **The lab fibre's flight is slowed** (about 3 s for 12 cm) so it can be followed; the opening's imagined jet is fast.
4. **The silk-chain cutaway and the nozzle cutaway are illustrations** (no labels by design); a viewer may not know
   the gold core is silk and the teal is acetone except from the narration.
5. **The lead's near hand is drawn twice in the lab** (body behind the bench, hands over the apparatus); where a hand
   meets the beaker or pump edge it can look pasted on in a single frame.
6. **The last half second is calm:** the arm settles into the opening's pose and the swing only starts in the final
   5 frames, so the loop runs on motion but the lab's last moments are quiet.
7. **Tubes:** the two tubes hang from the nozzle to the bench in the ending shot; frame 0 has none (part of the
   setting change at the cut).
8. **One voice take** (the ElevenLabs credit quota, as V1), and the duration stays 31.73 s, under the original 32-36 s
   target, because the voice is locked.

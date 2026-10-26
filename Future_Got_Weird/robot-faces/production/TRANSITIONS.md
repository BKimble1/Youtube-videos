# Transition list (V1)

Format, as `FGW_EDITING_RULES.md` asks:

> outgoing subject → incoming subject → new information → keep, merge or remove

"Cut" means a picture cut. "Continuous" means the camera and both states carry across the code's shot boundary, with
no cut on screen. `tools/state_continuity.ts` checks the robot and visitor parameters at every boundary.

| # | Time | Outgoing → incoming | New information | Decision |
|---|---|---|---|---|
| 1 | 7.61 | Two-shot → robot's mouth corner (one push) | Even a corner is a patch of skin moved by several points together | **Keep.** It is the hook's single reframe, a push with a readable arrival. |
| 2 | 12.70 | Robot's corner (real) → the same corner in the mirror (cut, matched on the corner), then a pull-back | A different setup: self-observation at a mirror | **Keep.** An editorial match between two setups, not a morph. The mirror frame and the robot's back establish the place. The expression and gaze continue across (smile held, gaze settles onto the reflection over 0.6 s). |
| 3 | 20.56 | Over-the-shoulder mirror view → front view of the robot at its bench (cut) | The mechanism: flexible face, motors | **Keep.** The section and x-ray need the face toward us. A deliberate cut, the same robot and session. |
| 4 | 32.32 | Robot's untrained combinations → robot and person mouth panels (cut) | The human mouth as the target ("banana") | **Keep.** It is a comparison, so a diagrammatic space is justified. |
| 5 | 53.17 | Speech-sample panel → the mirror, practising (cut) | How the robot learned its own face | **Keep.** It returns to the setup established at 12.7 s. It is not a new place, and it completes the mirror explanation. |
| 6 | 65.75 | Mirror trials → front view, mouth corner (cut, then a push along the attachment) | Flexible skin vs a rigid part | **Keep.** Followed locally into the same face; the explanation completes before leaving. |
| 7 | 77.15 | Skin close-up → whole head → along the bench to the monitor | The robot is given something else to watch | **Merged into one continuous move** (no cut). The state is continuous (its small smile relaxes as it turns). |
| 8 | 104.03 | Robot and monitor (wide) → closer on the robot's mouth (cut) | The result: lips with speech, song, an untrained language | **Keep.** The camera stays close for 11 s and does not bounce back. The speech track continues across the cut (the same generator and seed). |
| 9 | 115.48 | Robot close-up with the pipeline → two cards (cut) | Looking like speaking ≠ understanding | **Keep.** Card 1 is in on "Which gives us a useful distinction" (no empty frame). |
| 10 | 122.51 | Cards → close on the robot's mouth (cut) | A specific failure (B, W) | **Keep.** |
| 11 | 132.32 | Mouth close-up → the opening interaction set (cut) | The timing problem | **Keep.** A return to the established interaction, not a new room. |
| 12 | 147.60 | Interaction (late smile) → robot and monitor, tagged 2024 (cut) | A separate, earlier experiment | **Keep.** Dated once; no causal link to the 2026 study is implied. |
| 13 | 176.72 | Timing chart → interaction two-shot (cut) | The shared-looking moment the timing makes possible | **Keep.** |
| 14 | 206.50 | Possible use → callback | Return to the exact opening geometry | **Merged** (continuous). The camera eases to the hook's frame-0 camera before "Watch the smile again", and the states settle to the opening state, so the callback continues without a jump cut. |

## Removed or avoided during the edit

- **An in–out–in move before the callback.** A push onto the visitor at the end of the possible-use scene, then a cut
  back to the wide opening framing, then a push in again. Removed: the possible-use scene now eases back to the
  opening framing, so there is one final push.
- **An empty frame at 115.5–117.3 s.** The cards used to arrive late. Fixed.
- **A dissolve from section to x-ray.** No blanket dissolves are used. The local section closes as the x-ray (the same
  dark interior) rises inside the head only.
- No spins, flashes (the shutter is a 0.25-opacity flash on the reflection only), camera shake, speed ramps or blur.
- Captions are not burned in (external SRT, as in the other long-form FGW episodes). Labels are drawn in screen space,
  so they never inherit a camera transform.

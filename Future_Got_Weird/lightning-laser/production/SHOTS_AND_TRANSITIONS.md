# Lightning Laser V1: shots and transitions

Measured narration: 33.15 s of speech in a 33.50 s film (1005 frames at 30 fps). Shot boundaries follow the measured
words (`audio/narration/words.json`), not the brief's approximate table; each cut sits on a caption change so no
caption carries into another scene. Source: `source/src/shots.tsx`.

| Shot | Time (s) | Narration | What happens |
|---|---|---|---|
| A | 0.00–0.30 | "They fired…" | Inside the channel (12× close-up): the leader's tip is already climbing through frame, motes drifting. Same camera, clock and leader as the end. |
| B | 0.30–2.52 | "…a laser into a thunderstorm—" | One log-scale pull-out to the site: tower, apparatus lower left, shelter lower right. The leader runs up the guided section beside the beam, then branches to the cloud and connects (1.09 s): flash on tower, rocks, cloud base. |
| C | 2.52–4.31 | "and the lightning followed it." | Shelter interior; the window shows the same site and bolt. The operator finishes a turn of the acquisition knob, lifts her hand and her eyes follow the bolt; slow push toward her. |
| D | 4.31–7.81 | "You see, air normally resists the flow of electricity." | "Illustration": the lead under a cartoon cloud; hair sparks, wary look, tense shoulders; strike 4.95; skeleton exposures 5.00–5.10 and 5.47–5.57 (3 frames each, 0.37 s apart); recoil and follow-through; frazzled, singed, smoking. Pan to the bolt's path beside his head and zoom into the air: molecules keep their electrons except along one localized breakdown path. |
| E | 7.81–9.00 | "But this machine fired" | Line match: the beam leaving the launch telescope's exit on the same axis as the breakdown path; pull back over the telescope, enclosure, frame and cables. |
| F | 9.00–11.35 | "…a thousand laser pulses every second," | Ride one packet up the beam (packets evenly spaced, all moving up) past the tower toward the region above its tip. |
| G | 11.35–13.30 | "stripping electrons from air molecules" | Zoom into that packet (log scale, molecules take over across zoom 9–24×); following it, electrons leave the molecules it passes (ions marked +). |
| H | 13.30–15.50 | "and heating a narrow channel through the sky." | The same molecules: in the channel they spread outward and jiggle faster; ordinary air bounds it; camera eases back to show both edges; the next pulse passes. |
| I | 15.50–18.50 | "That gave electricity an easier path to travel." | A discharge front races up the treated channel; side branches into ordinary air stall and fade. |
| J | 18.50–21.55 | "So when lightning erupted upward from a nearby tower," | Pull out along the channel to the tower tip; the leader incepts at the rod tip (19.50) and climbs the guided section with the camera tracking it; one continuous pull back. |
| K | 21.55–25.62 | "part of the bolt followed that channel for over 160 feet." | Wider view, tower anchored: guided section near the axis, natural branches beyond; connection flash 21.75; bracket on the guided section only (22.55–23.25), "160+ ft" at "one hundred sixty" (23.55). |
| L | 25.62–28.94 | "A normal lightning rod only reaches as high as its metal tip." | A gabled house: follow the down-conductor from the earth clamp up the wall and roof edge to the rod's metal tip; hold. |
| M | 28.94–31.75 | "But these scientists extended one into the sky—" | Match cut: rod tip → tower tip at the same screen point; upward reframe; the channel brightens from the tip upward (the extension from the air; the metal unchanged). |
| N | 31.75–33.50 | "using the air itself." | Push into the channel to the opening camera (arrives 33.20, holds); a new leader incepts at the tip at 31.97 and enters the close-up from below in the last frames; frame 0 continues it. |

## Transition list (outgoing → incoming → new information → keep / merge / remove)

| # | At (s) | Outgoing → incoming | New information | Decision |
|---|---|---|---|---|
| 1 | 0.30–1.55 | channel close-up → site (continuous zoom) | what the channel is; where the bolt starts; the machine | keep |
| 2 | 2.52 | site → shelter interior (cut, matched on the tower and bolt in the window) | a person operates it; the bolt is still in progress | keep |
| 3 | 4.31 | shelter → illustrative vignette (deliberate cut, new labelled set) | why air matters: an imagined strike | keep (a genuinely separate, hypothetical scene) |
| 4 | 6.00–6.85 | vignette → air beside his head (pan, then continuous zoom) | air holds its electrons except on one path | keep |
| 5 | 7.81 | air → launch telescope (line match on the axis) | the real solution | keep |
| 6 | 7.81–11.35 | telescope → beam above the tower (one camera move) | pulses, repetition, direction | keep |
| 7 | 11.35–11.95 | beam → molecules (continuous zoom on one packet) | the mechanism at the packet's location | keep |
| 8 | 11.95–18.50 | molecules (one continuous micro scene) | stripping → heating → easier path | keep (merged into one scene) |
| 9 | 18.50–21.95 | molecules → tower tip → wider view (one continuous pull-out and tilt) | origin at the tip; guided section; beyond it | keep (originally a cut; merged into one move) |
| 10 | 25.62 | site → house (cut, new conceptual place) | an ordinary rod ends at its metal | keep |
| 11 | 28.94 | rod tip → tower tip (match cut, same screen point) | the extension above the metal | keep |
| 12 | 31.75–33.20 | tower → channel close-up (continuous push) | the loop: the explanation becomes the demonstration | keep |
| seam | 33.50 → 0.00 | close-up → close-up | none (continuous) | camera at rest on both sides; leader, motes, rain, clouds and sound on one clock |

No excursion returns to a previous subject without completing an explanation. No dissolves between incompatible
views, no flash or wipe to hide a change; the two hand-overs between site and molecules are zooms at one point with
the molecules fading in across a range of zoom.

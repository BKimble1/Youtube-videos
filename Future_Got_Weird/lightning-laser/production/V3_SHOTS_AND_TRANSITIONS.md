# Lightning Laser V3: beats, setups and transitions

V3 is a visual pass only. The narration, captions and the whole V2 soundtrack are locked: the same voice recording,
music, effects and silences, at the same positions (`production/V3_AUDIO_LOCK.md`). The picture was fitted to the
sound instead. Every event time is in `source/src/v3/timeline3.ts` (`EV`). It comes either from a word time or from an
effect start already in the mix.

- **Timeline:** 33.50 s, 30 fps, 1005 frames, unchanged.
- **Structure:** V2 had 25 shots and 24 cuts. V3 has eight beats (A–H), held together by continuous camera moves.
  There are six hard cuts and one match cut, and each one brings a new location, a new scale or a necessary
  consequence.
- **One 3D model:** the tower, beam and bolt still share V2's model (`v2/p3.ts`), so every view of the site agrees.

## Beats

| Beat | Time (s) | Narration | What it shows | Files (`source/src/v3/`) |
|---|---|---|---|---|
| A | 0.00–4.31 | They fired a laser / into a thunderstorm— / and the lightning FOLLOWED it. | **One stable medium-wide setup** (`openCam`) with one motivated pull-back as the leader climbs. The thin cyan laser path runs up from below the tower. At frame 0 the upward leader is already climbing from the rod tip along that path, in slow motion: a white core with violet edges and a warm prepared-air sheath round the guided section. It aligns with the channel and connects at the crack (1.75): the guided section strengthens and the cloud base lights locally where the bolt meets it. On "and the lightning FOLLOWED it" the same event stays on screen. A slow continuing-current flicker and soft fronts climb the guided section, leading into the three restrikes (3.52, 3.64, 3.83). There is no control-room character. | `Open3.tsx`, `Open3_fx.tsx` |
| B | 4.31–7.81 | You see, air normally RESISTS / the flow of electricity. | It starts on exactly A's view. The upper bolt cools away and a side streamer jabs from the lit channel into the ordinary air beside it (4.52), steps and stalls (4.85) while the camera follows its tip. Once the frame holds only air, a zoom-dissolve about the tip goes into a microscopic view: a few readable N₂/O₂ molecules over a quiet, blurred background. On each attempt (5.6, 6.35, 7.05) the stalled tip re-brightens and pushes a step up and to the right. The molecules' bound electrons are pulled toward it on a stretched tether, then snap back as it gives up. The cloud-and-character vignette is gone. | `Air3*.tsx` |
| C1 | 7.81–8.95 | But this MACHINE fired | Hard cut to the shelter. Her hand is already travelling toward FIRE. The index fingertip lands on the cap at the click (8.01) and the cap depresses. The relay (8.07) brings the machine up: the cap lights, the LED bar sweeps, the pulse lamp strobes cyan, the trace jumps and the beam appears in the window. She holds the press, then gives one clean release (8.50) and looks up. The fingertip is solved onto the cap while the room camera moves. | `Machine3_shelter.tsx` |
| C2 | 8.95–9.67 | a THOUSAND laser pulses | Optics cutaway in the V3 laser palette. Cyan packets leave the laser head on the ticks, pass the flaring amplifier and the lens pair, and turn up the duct at the mirror. The camera trucks with them and rolls, so at the cut the duct runs up the screen at the beam's angle. | `Machine3_optics.tsx` |
| C3 | 9.67–11.42 | every second, | **One continuous reveal**, replacing V2's separate window and mast angles. Packets leave the telescope exit on the window ticks, and the camera cranes up the beam with the train past the upper tower and its tip. Then it pushes into one packet, whose glow arrives at screen centre moving along the beam's direction. | `Machine3_reveal.tsx` |
| D | 11.42–15.83 | stripping ELECTRONS / from air MOLECULES / and HEATING a narrow channel / through the sky. | **One connected molecular process** on the same axis: (1) the packet passes a small framed group and electrons pop off on the quiet pings, freed ones as white points with streaks and bound ones as ink-rimmed dots; (2) a push-in to two representative molecules, whose electrons tear away with sparks at 12.62 and 12.92 while the molecules stay intact; (3) heating from 13.43, as the column warms and its molecules move outward; (4) a pull-back along the axis, leaving a narrow, less dense warm band with the cyan path inside it, readable as narrow by "channel" (14.30). | `Channel3*.tsx` |
| E | 15.83–18.79 | That gave electricity / an EASIER PATH to travel. | The same channel. A stepped leader (white core, violet edges) runs up it while the air round it stays quiet, and its side probes into ordinary air stall. The camera then pulls out toward the sky about the channel's screen point. Its position and direction hold as the molecular layer cross-fades into the macro channel. | `Channel3*.tsx` |
| F | 18.79–25.61 | So when lightning erupted UPWARD / from a nearby TOWER, / part of the bolt / followed that CHANNEL / for over 160 FEET. | E's pull-out carries straight on (one move, continuous in log-zoom) into **one main demonstration view** in the opening's geography. The field builds at the rod tip, and the leader incepts there (19.55) and climbs the cyan line ("UPWARD" 19.99). Past the guided section it branches with restraint and connects (21.85) with local light. On "followed that CHANNEL" the guided section stays brightest, hugging the cyan path. Then comes one controlled widening (23.3–24.3), a short dolly straight back held about the rod tip. The 160+ ft bracket grows once along the guided section (about 50 m) on "one hundred", and the label comes in on "sixty". The result holds with a living afterglow until the cut. | `Demo3*.tsx` |
| G | 25.61–28.94 | A normal lightning ROD / only reaches as high / as its metal TIP. | Hard cut to a house in the same storm. The distant strike (25.74) is far beyond the ridges. Its flash lights the whole run of metal at once (earth clamp, down-conductor, rod), and the sheen fades. **One smooth push** rises along the conductor and settles on the tip on "metal TIP". It holds there with rain, drifting cloud and the far flicker's glint (28.25). There is no bracket and no zone. | `Rod3*.tsx` |
| H | 28.94–33.50 | But these scientists EXTENDED one / into the SKY— / using the AIR ITSELF. | **Match cut** from the house rod's tip to the tower's rod tip at the same screen point. A tilt up follows the warm channel as it extends upward from the tip (29.19–30.89). **One motivated reveal** (cut at 30.74, "into the SKY—") shows the whole system from low on the flank: the telescope low-left firing past the tower, and the extended channel above the tip. Packets leave on the four payoff ticks. One crane rides up the beam with them onto the opening camera exactly by 32.90. The field builds at the tip and the next leader incepts at 32.90, so the last frame runs into frame 0. | `Open3.tsx`, `Open3_end.ts`, `Open3_laser.tsx` |

## Transitions

| At (s) | Frames | Type | Why |
|---|---|---|---|
| 4.31 | 129 | continuous (B starts on A's exact view and pushes in) | from the event to the air beside it; the tower is never doubled |
| 4.97–5.17 | 149–155 | zoom-dissolve about one screen point, once the macro view holds only air | change of scale (macro → molecular) |
| 7.81 | 234 \| 235 | hard cut | new location: the machine |
| 8.95 | 268 \| 269 | hard cut, same direction | inside the machine (the press caused it) |
| 9.67 | 290 \| 291 | hard cut on the beam axis | the pulses leave the machine; the eye stays on the train |
| 11.42 | 342 \| 343 | continuous (push into a packet → D opens on it) | change of scale on one object |
| 15.83 | 475 | continuous (same scene) | — |
| 18.79 | 563 \| 564 | continuous pull-out (E → F, one move) | change of scale on one channel; position and direction held |
| 25.61 | 768 \| 769 | hard cut | new location: an ordinary rod |
| 28.94 | 868 \| 869 | match cut (rod tip → tower rod tip at (540, 820)) | the same idea, now extended |
| 30.74 | 922 \| 923 | hard cut | the one reveal of the whole system |
| 33.50 → 0 | 1004 \| 0 | seamless loop (same camera, same leader clock) | — |

## Colour language (`source/src/v3/palette.ts`)

These are explanatory conventions: the real laser operated in the near-infrared.

| Element | Colour |
|---|---|
| Laser path | thin cyan line `#5CE6EC` with cyan-white packets |
| Prepared air (ionized, heated, lower density) | restrained warm band `#FF8A3A` (screen-blended); warm molecule rims at the molecular scale |
| Discharge | irregular white core, violet edges `#B4C2FF` / `#6C78FF` |

## Other changes from V2

- **Storm and site.** The storm deck is a lobed cloud base with a higher and farther layer. Discharge light falls
  locally on the cloud undersides, the tower's facing side and the rock, not across the whole frame.
- **Terrain and rain.** Ridges are layered, the tower has a plinth and apron seated on the rock, and the rain is 3D.
  Background detail is quietened round the caption band.
- **Bolt.** The V3 bolt (`bolt3.ts`) is V2's bolt with the upper path's depth wander reduced, so it never crosses
  itself in the opening and demonstration views. The guided section is identical.
- **Captions.** They are drawn in screen space outside every camera transform, with the approved words, timing and
  keyword emphasis. They sit in one band at y ≈ 1660, except "a thousand" and "every", which sit a little lower
  (1705) to stay clear of the optics and the telescope.

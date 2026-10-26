# Lightning Laser V2: shots and transitions

The narration, its timing and the 33.50 s duration are V1's, unchanged. The voice file is the same file, sample for
sample, and the captions use the same timings. Every cut sits on a caption change or inside one caption, so no caption
carries across a cut.

There are 25 shots. Boundaries are in `source/src/v2/timeline2.ts`, and each scene's file is named in the table below.
Most shots last 0.7–1.8 s. The longer ones (M1, M4, M5, R2, T4) each contain a motivated camera move or a second
composition.

The tower, bolt and beam share one 3D model (`v2/p3.ts`: metres, beam plane Z = 0). Every view of the site is a
projection of that model, so the tower's height, the beam's angle and the bolt's shape agree from every angle. The
characters, the laser apparatus and the molecular world are 2D vector art in the same ink-and-gradient finish.

| Shot | Time (s) | Narration | Composition and action | File |
|---|---|---|---|---|
| H1 | 0.00–0.95 | "They fired a laser" | Ridge-level view near the tower tip. The upward leader is already climbing along the beam path: white core, violet edges, glow, branching tendrils. The cloud base is lit above it. Same clock as the end of the film. | `v2/shots3d.tsx` |
| H2 | 0.95–1.75 | "into a thunderstorm—" | Low on the terrace behind the launch telescope (the detailed 2D apparatus, its exit window placed on the projected beam axis). The tower and the bolt are beyond, the beam leaves the window. A fast reveal of the machine. | `v2/Composite.tsx`, `v2/LaserArt.tsx` |
| H3 | 1.75–2.52 | (cont.) | Wide, low establishing view of the whole summit: enormous tower, the connection flash lighting the clouds and rock. | `v2/shots3d.tsx` |
| C1 | 2.52–3.40 | "and the lightning followed it." | Shot A, the scientist activates. Inside the shelter, the operator reaches to the ARM button. Her fingertip lands on the cap and presses it in, the LED bar ramps up, the gauge swings. Then she lifts her hand and looks up. The tower and bolt show through the window, from their own 3D camera. Desk props: keyboard, logbook, mug. | `v2/Console2.tsx` |
| C2 | 3.40–4.31 | (cont.) | Closer on her face. A restrike down the same channel (3.52, 3.64, 3.83) lights her face from the window side and flashes in her glasses. | `v2/Console2.tsx` |
| V1 | 4.31–5.30 | "You see, air normally resists" | An imagined example on a simplified stage. The lead stands balanced, feet planted apart and arms hanging. Strike at 4.52. The skeleton shows inside his own outline (4.55–4.69 and 4.73–4.79), posed from the same rig. Quick, stiff jolt (arms snap out, fingers splay, shoulders up), then a settle, singed and smoking. The camera tilts up past his head into the air. | `v2/Vignette2.tsx` |
| M1 | 5.30–7.81 | "…the flow of electricity." | Zoom-dissolve into the air between the cloud and his head: the charged cloud base above, the charged ground side below. Three streamers try to push down, stepping and branching, then stall and fade. Nearby molecules' electrons are tugged, then snap back. The camera drifts with each attempt. | `v2/Vignette2.tsx` |
| F1 | 7.81–8.95 | "But this machine fired" | Shot B, the controls respond. A close-up on the panel: she presses the guarded FIRE button, it lights, the pulse lamp strobes and the trace monitor jumps. | `v2/Console2.tsx` |
| F2 | 8.95–9.67 | "a thousand laser pulses" | Shot C, the internal optics. A cutaway of the laser enclosure: packets leave the laser head and pass the amplifier, whose pump light flares with each one. They go through the lens pair and up the relay duct via a turning mirror. The camera trucks with the packets and tilts up at the mirror. | `v2/Firing2.tsx` |
| F3 | 9.67–10.39 | (cont.) | Shot D, following the beam out. The telescope's exit window in the rain, seen from just below. The optics light with each pulse, faint packets leave, rain beads on the rim catch the light. The camera tilts up off the rim onto the beam. | `v2/Firing2.tsx` |
| F4 | 10.39–11.42 | "every second," | Shot E, the beam passes the upper tower. From beside the mast, the camera picks up one packet coming up the beam and tilts up with it past the lattice. Then it pushes into the packet's glow. | `v2/Composite.tsx` (`F4View`) |
| M2 | 11.42–12.33 | "stripping electrons" | Side-on: the packet races left to right through the air while the camera tracks it. The molecules it passes lose electrons, which spark off and drift away. Ions (warm rims) are left behind along a thin violet line. | `v2/Molecular2.tsx` |
| M3 | 12.33–13.33 | "from air molecules" | Close-up on two molecules. The pulse's light field sweeps over as violet crests. Each electron cloud stretches, then one electron tears away with a spark, and the molecule is now an ion. | `v2/Molecular2.tsx` |
| M4 | 13.33–15.83 | "and heating a narrow channel through the sky." | In the ionized column the molecules jostle faster and warm, then push outward. A few stay: lower density, not a vacuum. The camera pulls back to show a narrow, thinner channel running up the sky. | `v2/Molecular2.tsx` |
| M5 | 15.83–18.79 | "That gave electricity an easier path to travel." | A leader enters the channel from below and races up it while the camera tracks alongside. Side branches into ordinary air stall within a short distance. The camera pulls out, rolls to the real beam's on-screen lean and shifts to the 3D channel's colour. | `v2/Molecular2.tsx` |
| M6 | 18.79–19.10 | "So when lightning erupted upward" | The same channel in 3D, at the same lean, as a dolly-zoom begins to pull out. | `v2/shots3d.tsx` |
| T1 | 19.10–20.31 | (cont.) | The pull-out completes to a wide establishing view: tower, beam, summit. The leader incepts at the rod tip (19.55). | `v2/shots3d.tsx` |
| T2 | 20.31–21.63 | "from a nearby tower," | Low angle beneath the tower, looking up the mast; the leader is climbing above it. | `v2/shots3d.tsx` |
| T3 | 21.63–23.20 | "part of the bolt followed that channel" | Side perspective near the upper tower: the leader follows the beam path, then branches and connects (21.85) into a brighter discharge. | `v2/shots3d.tsx` |
| T4 | 23.20–25.61 | "for over 160 feet." | Wide comparison, tower anchored. A bracket on the guided section only (23.3–25.6) and "160+ ft" at the number. | `v2/shots3d.tsx` |
| R1 | 25.61–26.60 | "A normal lightning rod" | An ordinary house at night in the rain, with a rod on its gable. A strike far off behind the hills (25.74) lights the scene and glints on the rod's metal tip as the camera pushes in. | `v2/Rod2.tsx` |
| R2 | 26.60–28.94 | "only reaches as high as its metal tip." | (a) 26.60–27.62: the mast at the ridge, with a thin bracket from the ridge to the tip while the camera tilts up. (b) 27.62–28.94: the tip against the empty sky, glinting at a far flicker. It ends with the tip at screen (540, 820). | `v2/Rod2.tsx` |
| R3 | 28.94–30.74 | "But these scientists extended one" | Matched cut: the tower's tip at the same screen point. The camera tilts up as the channel brightens from the tip upward (the extension is in the air; the metal is unchanged). | `v2/shots3d.tsx` |
| E1 | 30.74–31.88 | "into the sky—" | Low view: the telescope rising out of the lower corner, firing up toward the clouds past the tower, packets streaming. | `v2/Composite.tsx` |
| E2 | 31.88–33.50 | "using the air itself." | The opening camera. The field builds at the tip with small corona branches, and the new leader incepts (32.90) and climbs. Frame 0 continues the same leader on the same clock. | `v2/shots3d.tsx` |

## Transitions (outgoing → incoming: what is new; decision)

| # | At (s) | Outgoing → incoming | New information | Decision |
|---|---|---|---|---|
| 1 | 0.95 | ridge view → terrace behind the telescope (cut on the beam axis) | the machine that made the path | keep |
| 2 | 1.75 | terrace → wide (cut) | scale: tower, summit, storm | keep |
| 3 | 2.52 | site → shelter (cut; the same tower and bolt in the window) | a person operates it | keep |
| 4 | 3.40 | wide interior → her face (cut, same light) | her reaction to the restrike | keep |
| 5 | 4.31 | shelter → imagined stage (deliberate cut to a separate, simplified set) | why it is hard: air resists | keep |
| 6 | 5.00–5.45 | stage → air above his head (tilt, then zoom-dissolve at one point) | the air's charged layers; a streamer stalls | keep |
| 7 | 7.81 | air → FIRE close-up (cut) | the machine fires | keep |
| 8 | 8.95 | panel → enclosure cutaway (cut) | the pulses' path inside | keep |
| 9 | 9.67 | duct (tilting up) → exit window (cut, continuing the upward path) | pulses leave into the rain | keep |
| 10 | 10.39 | window (tilting up the beam) → beside the mast (cut) | the beam passes the upper tower | keep |
| 11 | 11.42 | push into the packet's glow → the packet in the air (match on the glow) | the mechanism at the packet | keep |
| 12 | 12.33 | race → close-up on two molecules (cut) | what "stripping" is | keep |
| 13 | 13.33 | close-up → column of ionized air (cut) | heating, expansion, lower density | keep |
| 14 | 15.83 | channel (wide) → leader (tracking) (cut) | why the path is easier | keep |
| 15 | 18.79 | micro channel (rolled to the beam's lean, 3D colour) → 3D channel (match) | back to the real beam | keep |
| 16 | 19.10–23.20 | T1 → T2 → T3 (cuts between angles of one continuous event) | origin, climb, connection | keep |
| 17 | 25.61 | site → house (cut to a new place) | an ordinary rod | keep |
| 18 | 28.94 | rod tip → tower tip (match cut, same screen point) | the extension above the metal | keep |
| 19 | 30.74 / 31.88 | R3 → E1 → E2 (cuts) | the machine again, then the loop | keep |
| seam | 33.50 → 0.00 | E2 → H1 (the same camera and clock) | none (continuous) | leader, rain and drift run on one loop clock (`tau2`) |

## What the rebuild fixed (from the V2 brief)

- **Operator reach (C1/F1).**
  - Her hand reaches a physical control. The fingertip target is solved through the arm's two-bone IK, so the index tip lands on the button cap.
  - The cap visibly depresses, then the panel responds (LEDs, gauge, lamp).
  - Draw order is fixed: window → wall → panel → her (mirrored rig) → desk. Her torso sits behind the desk, and her arm is above the panel face, never through it.
- **Vignette (V1).**
  - The stance is an A-stance with both feet pinned by `plant()`, so the feet never slide and the legs never cross.
  - The arms hang beside the thighs.
  - The skeleton is drawn from the same pose object as the body during each exposure, so the bones sit inside the outline.
  - The jolt is one interpolated pose, then a settle.
  - The "Illustration" badge is gone. The stage itself is plainly simplified, and the narration frames it ("You see…").
- **Molecular sequence.**
  - Four distinct scenes, each with its own camera move.
  - No circular diagrams, bubbles or icons.
  - Instead of a fixed backdrop, an infinite hashed field that moves with the camera, with a dimmer parallax layer behind it.
- **Beam restraint.** The infrared beam is drawn as a thin violet line with brighter packets. Packets that would pass near a lens are faded rather than smeared into large capsules.

# Lightning Laser V5: final polish (shared brief)

V5 starts from V4 (`exports/FGW_Lightning_Laser_V4_REVIEW_1080x1920.mp4`, composition `LightningLaserV4`). It keeps
the same narration, audio and story. Its goals are:

- a much stronger hook that stops the scroll within the first second;
- more genuinely distinct, purposeful shots through the explanation;
- a clearer, more dramatic comparison between the ordinary rod and the laser path;
- smooth, motivated transitions and a loop that cycles back well.

The client's brief is the source of truth. This plan maps it onto the locked audio.

## 0. Locked

- **Sound and timing.**
  - Narration, voice recording, caption wording and timing, and the whole V2 mix are unchanged.
  - The timeline is 1005 frames at 30 fps (33.5 s).
  - The picture is fitted to the sound. Event times are in `source/src/v5/timeline5.ts` (`EV5` extends V4's `EV4`
    and V3's `EV`).
- **Style.**
  - Weird Crew 2D vector and 2.5D layered: ink contours `#0B151C`, flat and gradient fills.
  - The existing rig and cast: `dc/Man.tsx`, outfits in `cast.ts`, and the operator from
    `v3/Machine3_shelter.tsx`.
  - No generic 3D or plastic shading, and no generated bitmaps.
- **No infographics.** No circular text bubbles, floating source bubbles, infographic badges or radial diagrams. The
  only on-screen text besides the captions is the existing "160+ ft" label. Teach through scene action.
- **Colour language.** Thin cyan line with cyan-white packets for the laser path; a restrained warm band for prepared
  air; a white core with violet edges for the discharge.
- **Quality.**
  - Clean anatomy, compositing and draw order.
  - Stable faces, hair layers and hands.
  - No limb glitches, body intersections or jitter.
  - No random zooms, bounce or alternating zoom directions.
  - Every cut and move is motivated.
- **Motion.** Deterministic (`hash`/`noise1`, never `Math.random`). Every frame is a pure function of film time.
- **Captions.** The caption band is y ≈ 1560–1760 (centre 1660). Keep key action out of it.
- **Science.**
  - The laser guided part of an upward leader from the tower, for about 50 m (the bracket's guided section).
  - Pulses ionize the air and heat a narrow, lower-density channel.
  - The rod comparison is about physical reach: a rod's metal ends at its tip, while the laser extends a conducting
    path into the sky.
  - Do not claim the laser controls the whole bolt or protects anything.
  - The hook's skeleton flash is a stylised **visual accent for the electric surge** (fast, readable, not
    grotesque). Do not linger on injury, and do not show smoke, burns or a body being struck by a bolt.

## 1. Project map

- **Composition.** `LightningLaserV5` (`v5/Film5.tsx`). `v5/shots5.tsx` routes film time:

  | Time (s) | Shot | Component |
  |---|---|---|
  | 0–4.31 | A | `v5/Hook5.tsx` `HookA5` (new) |
  | 4.31–6.31 | B | V3's `AirB` |
  | 6.31–7.81 | B2 | `v5/Resist5.tsx` `ResistB5` (new) |
  | 7.81–8.95 | C1 | `v5/Machine5.tsx` `MachineC5` (new) |
  | 8.95–11.42 | C2 + C3 | V3's `MachineC` |
  | 11.42–13.33 | D1 + D2 | V3's `ChannelDE` |
  | 13.33–16.92 | D3 … E1 | `v5/Channel5.tsx` `ChannelD5` (new) |
  | 16.92–18.79 | E2 | V3's `ChannelDE` |
  | 18.79–25.61 | F | V4's `DemoF4` |
  | 25.61–28.94 | G | `v5/Rod5.tsx` `RodG5` (new) |
  | 28.94–31.88 | H | `v5/End5.tsx` `EndH5` (new) |
  | 31.88–33.5 | H3 | `v5/Loop5.tsx` `LoopH5` (new) |

  The new components currently re-export placeholders.
- **Stills.**
  - `npx remotion still src/index.ts FilmStillV5 out/x.png --props='{"f":N,"captions":true}' --log=error`;
  - `./sheet5.sh out/x.png "f1,…,f16" true` (16 frames at quarter scale);
  - `./quad5.sh out/x.png "f1,f2,f3,f4" true` (4 frames at half scale).

  V4 and V3 still render (`FilmStillV4`, `./sheet4.sh`, `FilmStillV3`). Compare against them.
- **Reusable parts.** Read them; copy into `v5/` with your prefix when you need changes. Never edit `v2/`, `v3/` or
  `v4/` files.
  - **Operator and control room:** `v3/Machine3_shelter.tsx`. It has the room camera (`roomCam`), the operator rig,
    the reach/press solver (`opC`, `reachPose`), the FIRE/ARM panel, `LitFigure`, the window view through `View3`
    (`windowCam`), and the desk mask.
  - **X-ray skeleton:** `art/Skeleton.tsx` `Skeleton` and `XRayFilter`. The skeleton is rigged to the same `Man`
    pose, so it sits inside the figure's own outline. See `v2/Vignette2.tsx` around line 255 for how V2 flashes it.
  - **3D site:**
    - `v3/view3.tsx` (`View3`, `zoomAbout`, `beamOnScreen`, `St`);
    - `v3/cams3.ts` (`openCam`, `demoCam`, `MICRO_ANG`, `P0_SCREEN`);
    - `v3/states3.ts` (`openSt`, `quietSt`);
    - `v3/Scene3*.tsx` (sky, clouds, summit, tower, beam, discharge, local light);
    - `v3/bolt3.ts` (`BOLT3V`).
  - **V4 opening and ending:** `v4/Open4*.tsx`, `v4/cams4_open.ts` (`loopCam`: the A1 launch view, the crane up the
    beam onto `openCam`, the leader inception 2.47 → connection 3.52, the W wide), `v4/states4_open.ts`,
    `v4/Open4_cloud.tsx` (in-cloud flash), `v4/Open4_laser.tsx` (`PlacedLaser4`, the physically sized telescope),
    `v4/End4*.tsx`, `v4/Station4.tsx` (the summit station).
  - **V3 middle beats:** `v3/Air3*.tsx` (B: streamer, micro air, electron tug), `v3/Machine3_optics.tsx` and
    `Machine3_reveal.tsx` (C2, C3), `v3/Channel3*.tsx` (D + E: packet, electrons, heating, the channel, the leader
    in it), `v3/Rod3*.tsx` (the house, its rod, the down-conductor, `ROD_TIP`, the camera), `v2/LaserArt.tsx` and
    `v3/Open3_laser.tsx` (the detailed 2D apparatus).
- **Type-check.** `npx tsc --noEmit -p .` (known errors only in `dc/Man.tsx` and `v2/Console2.tsx`).

## 2. Ownership (agents work in the same checkout at the same time; edit only your files)

| Owner | Files |
|---|---|
| **HOOK** | `v5/Hook5*.tsx`, `v5/Loop5*.tsx`, `v5/Room5*.tsx` (the control room, copied and adapted from V3's shelter), `v5/cams5_hook.ts` |
| **MID** | `v5/Resist5*.tsx`, `v5/Machine5*.tsx` |
| **CHANNEL** | `v5/Channel5*.tsx` |
| **END** | `v5/Rod5*.tsx`, `v5/End5*.tsx` |
| integration | `v5/timeline5.ts`, `v5/shots5.tsx`, `v5/Film5.tsx`, `v5/captions5.ts`, `Root.tsx`. Request changes in your report: shot boundaries, caption heights. |

Rules:
- Keep your files compiling at every moment.
- If a render fails because of a file you do not own, wait about 60 s and retry.
- Do not commit or push.

## 3. Contracts (seams)

- **A → B (4.31).** From about 4.2, A draws V3's `View3(openCam(t), openSt(t))` exactly; `v4/Open4.tsx` `OpenA4`
  does this from 4.2. V3's B continues from there.
- **B → B2 (6.31).** A hard cut on the caption change, from V3's molecular view (the stalled tip among molecules)
  to the storm scale. Keep the upward-right direction of the struggling discharge where possible.
- **B2 → C1 (7.81).** A hard cut to the machine.
- **C1 → C2 (8.95).** V3's C2 opens on the optics cutaway: packets in the laser enclosure. C1 should end on, or
  moving into, the machine's housing, so that cutting inside it is motivated.
- **D2 → D3 (13.33).** V3's D at 13.33 is close on two molecules after the tears. D3 is a cut to the new channel
  shots.
- **E1 → E2 (16.92).** V3's E at 16.92 shows the stepped leader running up the warm molecular channel, which runs up
  and to the right at `MICRO_ANG` (about 15° clockwise from vertical), its tip at about (300, 1420) in frame 508.
  E1 must end so that cutting into it reads as "closer, into the channel".
- **E → F (18.79).** V3 E and V4 F are unchanged.
- **F → G (25.61).** A hard cut. F's rod tip ends at (527, 669).
- **G → H (28.94).** G ends with the house rod's tip at screen (540, 820), settled (V3's contract). H may open with
  V3/V4's tower-tip match cut, or with any equally strong match.
- **H → H3 (31.88)** is END's handover to HOOK. END's H ends at 31.88 on a cut point on "using the AIR ITSELF";
  HOOK's H3 starts there. Agree it through this plan: HOOK designs H3 as a loop shot from **inside the control
  room**, looking out of the window at the tower and the glowing extended channel. A hard cut from END's exterior
  wide into it is fine.
- **H3 → A (the loop).** H3 ends so that A's frame 0 continues it naturally: same room, same operator; her hand is
  already moving to the control. No fade, no end card, no new flash at the seam.

## 4. Sound events per shot (all in `EV5`)

**A (0–4.31)**
- 0–1.75: the machine charging (a crackle under).
- 1.75: loud crack, thunder at 2.1 (the surge).
- 2.72: ARM click and relay (free; no picture event required).
- 3.52: quiet crack, the connection; re-strokes at 3.64 and 3.83.
- Words:

  | Word | Time (s) |
  |---|---|
  | They | 0.00 |
  | fired | 0.16 |
  | LASER | 0.59–1.20 |
  | into | 1.20 |
  | THUNDERSTORM | 1.45–2.27 |
  | and the lightning | 2.56–3.26 |
  | FOLLOWED | 3.26–3.77 |
  | it | 3.77–3.94 |

**B2 (6.31–7.81)**
- Crackle-and-stall attempts at 6.35 and 7.05 (the mix's 'streamer attempt' cues).
- Words: "the flow of electricity" (6.35–7.44).

**C1 (7.81–8.95)**
- Laser hum from 7.81; FIRE click at 8.01; relay at 8.07.
- Words: "But this MACHINE fired" (7.85–8.96).

**D3–E1 (13.33–16.92)**
- Heating shimmer 13.43–15.73.
- Words:

  | Words | Time (s) |
  |---|---|
  | "and HEATING a narrow channel" | 13.37–14.68 |
  | "through the sky" | 14.68–15.87 |
  | "That gave electricity" | 15.87–16.96 |

- E's leader crackle starts at 15.98.

**G (25.61–28.94)**
- Distant strike at 25.74 (quiet, −30 dB); distant thunder at 26.2; faint far flicker at 28.25.
- Words:

  | Words | Time (s) |
  |---|---|
  | "A normal lightning ROD" | 25.65–26.64 |
  | "only reaches as high" | 26.64–27.66 |
  | "as its metal TIP" | 27.66–28.49 |

**H (28.94–31.88)**
- Channel shimmer at 29.19–30.89.
- Payoff ticks (pulses leaving the telescope) at 30.84, 31.14, 31.44 and 31.74.
- Words: "But these scientists EXTENDED one" (28.98–30.78), "into the SKY—" (30.78–31.58).

**H3 (31.88–33.5)**
- The field builds at the tip, 31.88–32.9; the crackle runs from 32.9 across the seam into 0–1.75.
- Words: "using the AIR ITSELF" (31.92–33.15).

## 5. Shot specs

### HOOK: A (0–4.31) and H3 (31.88–33.5)

Goal: within the first second, danger and action are already underway. Fast, intentional, smooth, not choppy.

1. **A1 (0 → about 1.2) "They fired a LASER".**
   - An immediate, dramatic close-up or medium shot inside the control room. The operator (the V3 shelter
     character, her rig and face stable) is already slamming or pressing the FIRE control. The fingertip contact
     lands on the beat (about 0.16–0.59, "fired" … "LASER"), the cap depresses, and the console lights surge.
   - Through the window: the storm and the tower, and the beam igniting outside.
   - Use a low or dramatic angle with a short motivated push-in. Strong visual energy from frame 0, and no slow
     setup.
   - Hand contact must be exact (`reachPose`). Keep the desk mask and the face/hair layers stable.
2. **A2 (about 1.2 → about 2.2) "into a THUNDERSTORM".**
   - The surge builds as the console crackles and the lights flicker (1.2–1.75).
   - On the crack (1.75) comes a split-second stylised electric flash with a glitch effect: frame-wide white-violet
     flash frames, RGB/scanline tearing, a brief shake of the image (not of the camera rig).
   - The operator flickers into a **glowing x-ray skeleton silhouette inside her own outline**
     (`Skeleton` + `XRayFilter`) for 2–4 frames, perhaps flickering on-off-on, then is back to normal and startled.
     It is a shocking accent, not a long gag: readable, not grotesque.
   - The thunder at 2.1 rumbles.
3. **A3 (about 2.2 → about 2.6).**
   - A **whip transition upward**: a fast vertical whip from the room or window up to the beam outside, with motion
     streaks, cutting on the whip.
   - The camera then rockets up the beam. It can reuse or compress V4's crane from the telescope, `cams4_open.ts`
     `craneCam`, up the beam onto `openCam`.
4. **A4 (about 2.6 → 4.31) "and the lightning FOLLOWED it".**
   - The beam extends into a large, threatening thundercloud deck: the storm feels big, with lobes and local light.
   - The upward leader from the tower tip follows the beam (V4's leader: incept after the camera settles, climb the
     guided section, leave the line and branch, connect at 3.52 with re-strokes at 3.64 and 3.83). Retime it if
     needed, keeping the 3.52 connection.
   - From about 4.2 the frame is exactly V3's `openCam`/`openSt` (the A → B contract; reuse V4's `OpenA4` tail).
5. **H3 (31.88–33.5) "using the AIR ITSELF".**
   - A loop shot inside the control room: over the operator's shoulder, or a medium shot, looking out of the
     window at the tower and the glowing warm channel extending into the storm. The field crackles at the tip.
   - During the last ~0.5 s her hand moves toward the FIRE control, so frame 0's press continues it.
   - Match the room camera and lighting into A1.
6. **Room.** If the window view should come from the summit station (V4's `Station4`, beside the telescope
   terrace, x −37.5…−30, z −6…7, floor −18.4), place the window camera there. That keeps the geography coherent:
   the control room beside the laser, the tower about 30 m away, and the beam passing 20–40 m over the roof.

### MID: B2 (6.31–7.81) and C1 (7.81–8.95)

1. **B2 "the flow of electricity".**
   - A storm-scale side view, a genuinely new composition: the cloud deck above, the dark ridges below.
   - A stepped leader pushes down or out from the cloud base through ordinary air in short, jagged, erratic steps,
     branching randomly, and stalls (attempts at 6.35 and 7.05). The point is that ordinary air makes lightning
     fight for every step.
   - The laser is not in this shot. This sets up the later "easier path".
   - Make it energetic and readable at phone size, with local light. Keep its bright parts out of the caption band.
2. **C1 "But this MACHINE fired".**
   - The machine itself, because the hook now carries the operator's press.
   - A dramatic close or side view of the laser apparatus: the detailed 2D `LaserArt` or `v3/Open3_laser.tsx`, or a
     new housing in the same style.
   - It powers up on the hum, fires on the click at 8.01 and relay at 8.07: pump lamps flash, the housing glows, and
     the first pulses leave.
   - One motivated move (a push or track along the housing) that ends on or into the enclosure, so the cut to V3's
     optics cutaway at 8.95 reads as "inside".

### CHANNEL: D3 … E1 (13.33–16.92)

The brief asks for the pulses **repeatedly ionizing and affecting the air in a more dramatic way**, and the
channel forming in a way that is **visually satisfying and easier to understand**, with more scene variety. Change
scenery or perspective every 1–1.5 s in a meaningful way.

Suggested shots (adjust timing to the words):

1. **D3 (13.33 → about 14.6) "and HEATING a narrow channel".**
   - A diagram-like environmental cross-section: a side view of a stretch of sky along the beam.
   - The pulse train (cyan-white packets on the cyan line) passes again and again. Each pulse leaves a brief flash of
     ionized air (a white-cyan shimmer), and the flashes accumulate into a warming, slightly expanding,
     lower-density warm band along the beam: the narrow channel forming.
   - Molecules can be a sparse, readable layer that moves outward from the axis as it heats.
2. **D4 (about 14.6 → 15.83) "through the sky".**
   - A wide storm view: the warm channel along the beam extends from the tower's rod tip up into the cloud deck,
     with the storm large and dramatic.
   - Distinct from F's wide and from A4.
3. **E1 (15.83 → 16.92) "That gave electricity".**
   - A perspective from near the rod tip: low on the mast or at the tip, looking up along the beam and the warm
     channel into the storm.
   - The field builds at the tip (corona flicker); the E leader crackle starts at 15.98.
   - End so that the cut at 16.92 into V3's molecular leader in the channel (E2) reads as "closer, into the
     channel": same up-right direction (`MICRO_ANG`).

### END: G (25.61–28.94) and H (28.94–31.88)

The comparison must be **clearer and more dynamic**: the traditional rod's behaviour on one side, the laser
creating a preferred path on the other, with a clearer lightning trajectory and a more dramatic payoff.

1. **G "A normal lightning ROD / only reaches as high / as its metal TIP".**
   - **Traditional behaviour, shown.** At the house (V3's `Rod3*`), a downward stepped leader comes all the way
     down from the cloud base and strikes the rod's tip. Current runs down the conductor to the earth clamp.
   - Show it at a distance, consistent with the quiet distant-strike sound at 25.74 and thunder at 26.2.
   - The trajectory reads clearly: the bolt has to travel all the way down to the metal.
   - Then a motivated move to the tip on "metal TIP", ending with the tip at (540, 820), settled (V3's contract),
     with the far flicker at 28.25.
   - Never draw a protection zone or boundary.
2. **H (28.94 → 31.88) "But these scientists EXTENDED one / into the SKY—".**
   - **The contrast.** A split or side-by-side comparison composition, or another equally clear device without
     text badges:
     - the ordinary rod, with lightning meeting the metal only at its tip;
     - the tower, with the laser channel extending its reach high into the sky, where a guided leader follows the
       channel.
   - Use the same storm and horizon on both sides, so the difference in reach is obvious.
   - Then the payoff for "into the SKY—" (30.78–31.58): a dramatic wide of the beam and channel reaching deep into
     the thundercloud deck. Packets leave on the payoff ticks.
   - Hand over at 31.88 to HOOK's H3.

## 6. Pacing and camera rules

- Every cut adds information, a consequence, or a change of scale or location.
- Give each important result about 0.5 s of readable screen time.
- Keep constant visual momentum without chaos.
- One dominant focus at a time.
- Preserve eye position and direction across cuts where possible.
- Moves are eased (`sm5`/`ss`): purposeful pans, push-ins, pull-backs and whips. No bounce, overshoot, shake (except
  the hook's brief glitch accent) or alternating zoom directions.
- No shot sits in one composition longer than it needs.

## 7. Verification before reporting

- Render and **look at** every changed frame range: sheets every 2–3 frames, every frame around fast actions, and
  full resolution for hands, faces and the skeleton.
- Check your seams with the real neighbouring shots. Compare against V4 at the same times.
- Type-check.
- Report: files changed; what each ~0.5 s shows; seams and contracts with the frames checked; requests; honest
  remaining issues.

# Lightning Laser V4: focused hook and shot-variety revision (shared brief)

V4 is a focused finishing pass on V3 (baseline: `exports/FGW_Lightning_Laser_V3_MASTER_2160x3840.mp4`, source at
commit a4c1b19). V3 already tells an understandable story in a coherent style. V4 improves only:

- **the first four seconds**, which must develop instead of holding one composition;
- **the 19–25 s tower sequence**, which must stop replaying the opening composition.

The end changes only as far as the new loop needs. Do not make the film frantic, and do not rebuild sections that
work.

Creative benchmark (from the brief):
- an immediate situation the viewer can imagine witnessing;
- three or four simple visual steps;
- a concrete payoff;
- every beat either deepens curiosity or answers it.

Distinct, purposeful scenes and connected action matter more than a high cut count. Remove idle holds, never
comprehension.

## 0. Locked (as V3; see `production/V3_PLAN.md` §0 and `production/V3_AUDIO_LOCK.md`)

- **Sound and timing.**
  - Narration, voice recording, caption wording and timing, the whole V2 mix and its sync are unchanged.
  - The timeline stays at 1005 frames, 30 fps, 33.5 s.
  - The picture is fitted to the sound. Event times are in `source/src/v4/timeline4.ts` (`EV4`, which extends V3's
    `EV`).
- **Look.**
  - Weird Crew 2D vector style: ink `#0B151C`, flat and gradient fills, restrained layered parallax.
  - No new character designs, no generated bitmaps, no full-3D characters.
  - No callouts, badges, radial diagrams or circular text boxes. The only on-screen text besides the captions is the
    existing "160+ ft" label.
  - Colour language: thin cyan line with cyan-white packets for the laser path; a restrained warm band for prepared
    air; a white core with violet edges for the discharge.
- **Physical relationships.**
  - The laser apparatus (terrace at the telescope exit `EXIT3` ≈ (−45.5, −16.5, 0) m) and the tower (base at the
    origin, rod tip `TIP3` = (0, 124, 0)) are separate objects in their established places.
  - Lightning originates upward from the tower.
  - The laser guided only part of the bolt, for about 50 m (≈ 160 ft; `BOLT3.guidedS` ≈ 54 m). Never imply it
    controlled the whole bolt, that it is a weather-control system, or that it protects anything.
  - The house rod is about the physical length of the metal, never a protection zone. The house is a different place,
    not part of the experiment.
  - No exposed person in any strike path, and nothing implying the laser can target a person.
- **Motion.** Deterministic (`hash`/`noise1` from `dc/math.ts`, never `Math.random`). Every frame is a pure function
  of film time.
- **Quality.**
  - No full-screen strobing, overexposed flashes, shake or visual noise.
  - The emitter, tower silhouette, beam and discharge stay readable at phone size through controlled contrast and
    local light.
  - Captions sit in the band y ≈ 1560–1760 (centre 1660). Keep key action, and especially the guided segment, out
    of it.

## 1. Project map (V4)

- **Composition.** `LightningLaserV4` (`source/src/v4/Film4.tsx`). Stills:
  - `FilmStillV4`, e.g. `npx remotion still src/index.ts FilmStillV4 out/x.png --props='{"f":123,"captions":true}' --log=error`;
  - `./sheet4.sh out/x.png "f1,…,f16" true` (16 frames at quarter scale);
  - `./quad4.sh out/x.png "f1,f2,f3,f4" true` (4 frames at half scale).

  V3 stays renderable: `LightningLaserV3`, `FilmStillV3`, `./sheet3.sh`. Use it to compare.
- **Routing.** `v4/shots4.tsx` routes film time:
  - A → `v4/Open4.tsx` `OpenA4`;
  - B → V3's `AirB`;
  - C → V3's `MachineC`;
  - D + E → V3's `ChannelDE`;
  - F → `v4/Demo4.tsx` `DemoF4`;
  - G → V3's `RodG`;
  - H → `v4/End4.tsx` `EndH4`.

  Currently A, F and H re-export V3's beats as placeholders.
- **Site extras.** Every `View3` (V3's site view) draws an optional extra site object from the React context
  `v3/features3.ts` `SiteExtras`. It is drawn twice: `layer="back"` after the sky and summit and before the tower,
  and `layer="front"` after the tower.
  - V3 provides none, so V3 is unchanged.
  - V4 provides `v4/Station4.tsx` `Station4` (the summit station), so the building appears consistently in every V4
    view that can see it. That includes V3's beats inside V4, such as C1's window view and C3's crane.
- **Reusable V3 parts** (read them; copy into `v4/` when you need to change them; never edit `v3/` unless your
  ownership grants it):
  - `v3/view3.tsx` (`View3`, `zoomAbout`, `beamOnScreen`, `St`);
  - `v3/cams3.ts` (`openCam`, `OPEN0`/`OPEN1`, `demoBase`, `demoCam`, `demoZoom`, `Z_HAND`, `Z_V0`, `P0_H`,
    `P0_SCREEN`, `MICRO_ANG`);
  - `v3/states3.ts` (`openSt`, `demoSt`, `quietSt`);
  - `v3/timeline3.ts` (`openS`, `demoS`, `strikeLight`, `openLight`, `demoLight`, `tau3`);
  - `v3/Open3*.tsx` and `v3/Open3_end.ts`: V3's opening and ending, the low whole-system view `LOW2`, the crane
    `h2Cam` from it onto `openCam`, `lookAtScreen`, `PlacedLaser` (the detailed 2D telescope composited on the
    projected `EXIT3`), `OpenFx`, `PulseBloom`, `ChannelGrow`, `ccFlicker`, `endPulses`, `tickFlare`;
  - `v3/Demo3*.tsx` (V3's F, `DischargeF`, `DemoHaze`, the bracket);
  - `v3/Scene3*.tsx` (sky, clouds, summit, tower, beam, discharge, local light `Scene3_light.ts`);
  - `v3/bolt3.ts` (`BOLT3V`, the bolt geometry; the guided section is the first ≈ 54 m from the tip along the beam).
- **Type-check.** `npx tsc --noEmit -p .`. Known errors exist only in `dc/Man.tsx` and `v2/Console2.tsx`.

## 2. Ownership (several agents work in the same checkout at once; edit only your files)

| Owner | Files |
|---|---|
| **A+H** | `v4/Open4*.tsx`, `v4/End4*.tsx`, `v4/Station4*.tsx`, `v4/cams4_open.ts`, `v4/states4_open.ts`, plus any new `v4/Open4_*`, `v4/End4_*` files. May fix V3's A-1 blemish in `v3/Air3_leader.tsx` (see §5), which is B's first frames. |
| **F** | `v4/Demo4*.tsx`, `v4/cams4_demo.ts`, `v4/states4_demo.ts`, plus new `v4/Demo4_*` files. May fix the tower-base draw-order/transparency bug (V3 finding F-1) in `v3/Scene3.tsx` `Tower3D`, and only there. |
| integration | `v4/timeline4.ts`, `v4/shots4.tsx`, `v4/Film4.tsx`, `v4/captions4.ts`, `Root.tsx`, `v3/view3.tsx`, `v3/features3.ts`. Request changes in your report (for example a caption height). |

Rules:
- Keep your files compiling at every moment, because another agent's render bundles them.
- If a render fails on a file you do not own, wait about 60 s and retry. Never touch it.

## 3. Contracts (seams)

- **A → B (4.31).** V3's `AirB` starts by drawing `View3(openCam(t), openSt(t))`.
  - From about 4.2 s, A must draw exactly that: the camera `openCam(t)` and the state `openSt(t)`, apart from local
    effects that are gone by 4.28.
  - A's connection is now at 3.52 instead of V3's 1.75. Blend A's own light into `openSt`'s values by about 4.2, so
    there is no step at 4.31.
- **E → F (18.79).** V3's E draws `demoCam(t, Z(t))` under its molecular layer and reaches `Z_HAND` (14) about
  `P0_SCREEN` at 18.79, with log-velocity `Z_V0` (−3.2/s) and log-acceleration −5.53/s².
  - F's camera at 18.79 must equal `v3/cams3.ts` `demoCam(18.79)`, and its zoom must carry on smoothly (C1 in ln Z).
  - After that, F is free: it need not return to `demoBase`.
- **F → G (25.61).** A hard cut to the house (V3's G, unchanged).
- **G → H (28.94).** V3's G ends with the house rod's tip settled at screen (540, 820). H opens on the tower's rod tip
  at (540, 820) (V3's H1 camera).
- **H → A (the loop, 33.5 → 0).** H's last frames lead into A's frame 0.
  - The camera path, packets, rain, cloud drift and the tip's field state should be continuous across the seam: a
    single camera function on the loop clock `tau3` is the simplest way.
  - Do not sacrifice the final explanation to force an exact frame match; a near-match with the same composition,
    screen direction, beam placement and atmosphere is acceptable.
  - No fade, no end card, no new flash at the seam.

## 4. Sound-locked events (all in `EV4`)

**A**
- Corona crackle 0–1.75 (the mix's loop crackle). Field build from 31.88, crossing the seam.
- The loud crack at 1.75 and thunder at 2.1: in V4, a flash inside the storm deck ("into a THUNDERSTORM").
- The quiet crack at 3.52 (−30 dB): the upward leader's connection. Re-strokes follow at 3.64 and 3.83.
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

- The ARM click at 2.72 has no picture event (a known consequence of the locked mix).

**F**
- The leader crackles from 19.55 (inception at the rod tip). The connection crack is at 21.85; thunder at 22.25.
- Words:

  | Word | Time (s) |
  |---|---|
  | So when lightning | 18.83 |
  | erupted | 19.49 |
  | UPWARD | 19.99–20.35 |
  | from a nearby TOWER | 20.35–21.36 |
  | part of the bolt | 21.67–22.30 |
  | followed that CHANNEL | 22.31–23.24 |
  | for over | 23.24 |
  | one hundred | 23.64–24.33 |
  | sixty | 24.34 |
  | feet | 24.75–25.11 |

**H**
- Channel-extends shimmer at 29.19–30.89.
- Payoff ticks at 30.84, 31.14, 31.44 and 31.74 (pulses leaving the telescope).
- Field builds at the tip 31.88–32.9; the crackle runs from 32.9 across the seam.
- Words:

  | Word | Time (s) |
  |---|---|
  | EXTENDED | 29.92 |
  | into the SKY | 30.78–31.58 |
  | using the AIR ITSELF | 31.92–33.15 |

## 5. Beat specs

### A: the opening (0–4.31), `OpenA4`: one connected action in three visual beats

Goal: muted, a first-time viewer sees a machine fire upward into a storm, and lightning visibly follow part of its
route. The beam is established first; the discharge then develops along part of its route.

1. **A1 "They fired a LASER" (0 → about 1.0–1.2).**
   - The laser is already firing at frame 0, in a readable, closer view of the launch. The detailed telescope
     (`PlacedLaser` / `LaserArt3`) is large in the lower-middle or lower-left of the frame, above the caption band.
     Pulses leave its exit window and the thin cyan beam runs up and to the right.
   - Keep enough context to place it beside the tower: the tower's mast and the new summit station building with
     lit windows give a human sense of scale, as if you could stand on that terrace.
   - No title card, dark lead-in or slow reveal.
2. **A2 "into a THUNDERSTORM" (about 1.0 → about 2.35).**
   - One continuous spatial move along the same beam, up into the wider storm composition: a crane or tilt with the
     pulses, as V3's `h2Cam` crane from `LOW2` onto `openCam`. Reveal the cloud deck and the tower's relationship
     to the laser: the beam passes beside the tower top to the storm.
   - Keep screen direction: the beam always runs up and to the right.
   - At the crack (1.75), lightning flashes **inside the storm deck**. Light the cloud lobes locally and,
     optionally, show a short in-cloud channel. It stays well away from the beam and the tower, so it cannot be
     confused with the upward leader.
   - Land on `openCam(t)` with matching velocity by about 2.3–2.4. `OPEN1` is the framing; this is also B's start
     framing.
3. **A3 "and the lightning FOLLOWED it" (about 2.35 → 4.31).**
   - On `openCam`, the field strengthens at the rod tip. The upward leader incepts at the rod tip (about 2.4–2.55)
     and climbs the cyan path: the guided section along the line, in readable motion, the tip always visible.
   - Above the guided section it leaves the line and branches to the cloud. It connects at 3.52 ("FOLLOWED").
   - Re-strokes at 3.64 and 3.83 re-brighten the guided section. The guided section stays the dominant, readable
     image until 4.31.
   - Never a vague flash. Never an already-completed bolt that only flickers.
   - The leader length needs a new function, for example `openS4(t)`: 0 at inception, `BOLT3.total` at 3.52, with
     the guided part (54 m) taking most of the climb's screen time.
   - From about 4.2, the camera and state equal V3's `openCam`/`openSt` (A → B contract).
   - Keep the warm prepared-air band readable round the guided section during 3.5–4.3, where V3 lost it under the
     violet glow (V3 finding A-2).
4. **V3's A-1 (fix if cheap, in `v3/Air3_leader.tsx`).** In B's first frames (4.40–4.57) the fizz on the channel
   is a flat lavender disc with a hard edge, about 70 px. Make it a feathered falloff or a few corona strokes, with
   no disc edge.

### Station: `Station4` (summit station, the "familiar building/observation setting")

- A low summit station / observation building in the established style: flat roof with a railing, a row of small
  warm-lit windows, a door. Use real proportions (window about 1.5 m, storey about 3.5 m) so it gives human scale
  beside the 124 m tower.
- Place it on the summit between the laser terrace and the tower base, or beside the tower plinth. It must not sit
  in the beam's path or the strike path.
- It is drawn in 3D through `SiteExtras` (layer back/front by depth against the tower). Its lights are local and
  stay distinct from the orange prepared-air band: pale sodium/yellow, small rectangles.
- Check every V4 view that might see it:
  - A1, A2, H2 and F3;
  - V3's C1 window view (`Machine3_shelter.tsx` `windowCam`, camera at about (95, −12, −120));
  - C3's crane (`Machine3_reveal.tsx`) and B's start.

  It must look right wherever it appears, or stay out of frame.

### F: the demonstration (18.79–25.61), `DemoF4`: three connected beats, one camera path

Goal: answer "Where did it start? What route did it follow? How far?" with new compositions, not a replay of the
opening. One continuous camera path is preferred; no random orbit, and no zoom used only to manufacture motion.

1. **F1 "So when lightning erupted UPWARD / from a nearby TOWER" (18.79 → about 20.6).**
   - E's pull-out carries on from `demoCam(18.79)` and settles on a **closer view of the tower tip**: the rod tip
     and upper mast large, with the cyan line and warm band leaving the tip up and to the right in frame. The tip
     stays above the caption band.
   - Do not return to the wide main view.
   - The field builds at the tip (19.1–19.55). The leader incepts at the tip at 19.55 and visibly emerges upward
     along the line ("UPWARD" 19.99).
2. **F2 "part of the bolt / followed that CHANNEL" (about 20.6 → about 23.2).**
   - One deliberate move that follows the advancing leader's tip up the channel: a tilt or crane up along the beam
     with the tip. It runs through the guided section (≈ 54 m) to where the bolt leaves the line and branches to the
     cloud.
   - Connection at 21.85 (the crack), with local light.
   - On "followed that CHANNEL" (22.31–23.24) show the guided section clearly as the brightest part, hugging the
     cyan line, with the branching above it. The camera follows the event; it never orbits around a static bolt.
   - The leader length may be retimed (for example `demoS4`), keeping inception at 19.55 and connection at 21.85, so
     the climb fits the follow move.
3. **F3 "for over 160 FEET" (about 23.2 → 25.61).**
   - Resolve, by one controlled pull-back, into a **wider composition that shows the guided segment's extent with
     scale**: the whole tower from its base (with the station's lit windows for human scale), the guided segment
     above the tip, and the bolt to the cloud.
   - The `St.bracket`/`label` bracket (`Bracket3`, attached in 3D to the guided section) grows 23.64–24.34
     ("one hundred"); the label arrives on "sixty" (24.34).
   - Then the result registers with living afterglow, without an idle freeze, until the hard cut at 25.61.
   - The camera position and angle must differ clearly from the opening (`openCam`), for example farther and lower
     with the full tower height.
   - Keep the bright tower parts and the bracket label out of the caption band.
4. **V3 findings to resolve here:**
   - F-1: the tower base's draw-order and transparency at the bottom edge. Fix in `Tower3D` if the wide shows the
     base.
   - F-2: unguided branch stubs crossing the cyan line blur where the guidance ends. Choose an angle where the
     guided and unguided parts separate clearly.

### H: the ending (28.94–33.5), `EndH4`

1. **H1 (28.94–30.74)** is V3's H1: the match cut onto the tower rod tip at (540, 820), the tilt up as the channel
   extends.
   - Fix V3's GH-1: the channel starts as a soft round blob at 877–884. It must grow from the tip along the axis as
     a band.
2. **H2 (30.74–33.5).** One cut ("into the SKY—") to the whole system: the telescope firing past the tower, the
   station beside it, the extended warm channel above the rod tip clearly readable, packets leaving on the payoff
   ticks.
   - During "using the AIR ITSELF" keep the channel in the air readable.
   - Then ease into A1's framing so the film replays naturally. Keep continuity of the camera function, pulses and
     field state across the seam.
   - The final image should read as an understandable piece of technology working in a real storm. It must not
     claim protection for the house, the neighbourhood or the viewer.

## 6. Pacing and camera rules (as V3 §6)

- Every cut must introduce information.
- Give each important result about 0.5 s readable after it resolves.
- One dominant focus at a time.
- Preserve eye position across cuts.
- Hard cuts for new information; continuous moves or match cuts for views of the same event.
- No overlapping dissolves.
- Camera moves eased (`sm5`/`ss`) with matched endpoints: no bounce, overshoot, shake or alternating zoom
  directions.
- Movement carries the viewer between causal steps.

## 7. Verification before reporting

- Render and look at your seams:
  - A: 0–6, the crane 25–75, the inception and connection 70–120, A → B 122–136;
  - F: 556–600, 600–700, 690–768;
  - H: 866–880, 918–930, 975–1004 and 0–10.
- Make contact sheets every 2–3 frames through every fast action.
- Check at least 4 full-resolution stills for masks, draw order, glow against core and caption, and popping.
- Compare against V3 at the same times (`FilmStillV3`).
- Type-check clean for your files.
- Report: the files changed; what each ~0.5 s shows; how each contract is met, with the frames checked; requests;
  honest remaining issues.

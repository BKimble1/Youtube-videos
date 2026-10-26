# Lightning Laser V3: build plan and contracts (shared brief for every beat)

The V3 pass is a final visual pass on the Future Got Weird "Lightning Laser" Short (33.5 s, 30 fps, 1080 × 1920).
Its editorial goal is fast, understandable action with continuous cause and effect:
- every camera move, cut, character action and effect helps the viewer follow the story;
- important events get enough screen time to register (about half a second after they resolve, when the narration
  allows) while the action keeps developing.

Creative direction: show an extraordinary physical event, explain its cause through connected actions, then return
to the event with new understanding. Keep the energy in the objects and their consequences, and let the camera make
those actions easy to follow.

## 0. Locked (never change)

- **Narration, captions, audio.** The narration, the caption wording and timing (`source/src/data/timeline.json`) and
  the whole V2 soundtrack (`source/public/audio/mix_v2.wav`) are locked. See `production/V3_AUDIO_LOCK.md`.
- **Picture fitted to sound.** Effects in the mix are fixed, so fit the picture to them: every event time you need is
  in `source/src/v3/timeline3.ts` `EV`, which records the effect start times from `audio/sfx_cues_v2.json` and the
  word times.
- **Timeline.** 1005 frames, 30 fps. The beat boundaries are `timeline3.ts` `B`.
- **Cast and style.** Keep the established Weird Crew 2D vector cast (rig in `source/src/dc/`, outfits in
  `source/src/cast.ts`) and the illustration language:
  - ink contours `#0B151C`, flat and gradient fills, one cool storm key light plus the discharge's light;
  - restrained layered parallax.
  - No new character designs, no generated bitmaps, no plastic or 3D shading.
  - No circular callouts, floating explanatory badges, radial diagrams, generic science icons, or extra text
    competing with the narration. The only on-screen text besides the captions is the existing "160+ ft" label.
- **Colour language** (`source/src/v3/palette.ts`; an explanatory convention, since the real laser is near-infrared):
  - laser path: a thin cyan/teal line with cyan-white packets;
  - prepared air (ionized, heated, lower-density): a restrained warm accent;
  - discharge: an irregular white core with violet edges.

  Keep these three distinguishable everywhere.
- **Science** (Houard et al., *Laser-guided lightning*, Nature Photonics 2023; NWS lightning-rod page):
  - The upward leader was guided for about 50 m (≈160 ft); the bracket goes on that guided section above the tip.
  - Ionization and heating/expansion prepare a favourable path.
  - The rod comparison is about the physical length of the metal. Never draw a protection boundary or zone.
- **Deterministic motion.** No `Math.random`; use `hash`/`noise1` from `source/src/dc/math.ts`. Every frame is a pure
  function of film time `t`.

## 1. Project map

- Remotion 4, React 19, TypeScript, SVG. Composition `LightningLaserV3` (`source/src/v3/Film3.tsx`).
- `source/src/v3/shots3.tsx` routes film time to a beat component. Captions are drawn in screen space by
  `Film3.tsx`, outside any camera. Caption heights live in `v3/captions3.ts` (integration owns that file).
- **3D site model** (shared with V2, read-only): `source/src/v2/p3.ts`.
  - Metres, X right, Y up, the tower at X = Z = 0, the beam in the plane Z = 0.
  - Useful exports: `TIP3` (rod tip, about Y = 124 m), `axis3(h)` (beam axis at height h in site px; h = 0 is about tip height, `EXIT_H = -880` is the telescope exit `EXIT3`), `BEAM_DIR`, `BOLT3` (the bolt: guided section ≈ 54 m from the tip, then branches to the cloud; total ≈ 120 m).
  - Cameras: `lookAt(pos, target, f)`, `lerpCam`, `projector(cam)`.
- **V3 scene art** (`v3/Scene3.tsx`; owned by the scenery agent): `Sky3D`, `Summit3D`, `Tower3D`, `Beam3D`, `Discharge3D`, `Apparatus3D`, `FlashWash`.
- **V3 view** (`v3/view3.tsx`, read-only):
  - `View3({cam, st, t, tag, children})` draws the site.
  - `St` is the state: leader length `s` (m), `core`, `flash`, `beam`, `pulses`, `channel`, `channelTop`, `tipCorona`, `bracket`, `label`, `apparatus`.
  - `zoomAbout(cam, px, py, Z)` zooms crisply about a screen point.
  - `beamOnScreen(cam, h)` gives the beam's screen point and angle.
- **States** (`v3/states3.ts`, read-only): `openSt(t)` (the opening event on the loop clock), `demoSt(t)` (the demonstration), `quietSt(t)`.
- **Camera contract** (`v3/cams3.ts`): `openCam`, `demoCam`, `P0_H`, `P0_SCREEN`, `MICRO_ANG` (14.9°), `Z_HAND`. See section 3.
- **Reusable V2 parts.** Never edit `v2/`; to change one, copy it into `v3/` under your beat's prefix:
  - `v2/Console2.tsx`: the shelter and operator. `ShelterV2`, the reach/press solver `opAt`, the panel, the window view, `LitFigure`, `GlassReflection`.
  - `v2/LaserArt.tsx`: the detailed 2D apparatus. `LaserArt`, `exitOf`, `PIVOT`, `TUBE`.
  - `v2/Composite.tsx`: `camScreen`, and placing `LaserArt` on a 3D view's projected exit.
  - `v2/Firing2.tsx`: `F2Cutaway` (enclosure optics), `F3Aperture`.
  - `v2/Molecular2.tsx`: the hashed infinite molecule field `visible`, `MolG`, `Backdrop`, `FarAir`, and the M2–M5 scenes.
  - `v2/Vignette2.tsx`: `MicroAir` streamers.
  - `v2/Rod2.tsx` with `scenes/Rod.tsx`: the house, rod and conductor (`ROD_TIP`, `ROUTE`).
  - `art/Env.tsx`: 2D sky, clouds, rain.
- **Working stills** (run from `source/`; always look at the PNG with the Read tool):
  - `./sheet3.sh out/x.png "f1,f2,…" [true|false]`: 16 frames of the V3 film at quarter scale, labelled.
  - `./quad3.sh out/x.png "f1,f2,f3,f4" [true|false]`: 4 frames at half scale (use for detail).
  - `npx remotion still src/index.ts FilmStillV3 out/x.png --props='{"f":123,"captions":true}' --log=error`: one full-resolution frame.
  - `./cam3.sh` and `./camseq3.sh`: 3D camera tests (see the scripts).
  - Type-check with `npx tsc --noEmit -p .`. Pre-existing errors in `dc/Man.tsx` and `v2/Console2.tsx` are known; your own files must be clean.
- **Working copy.** You work in a git worktree with the repo at `claude/new-session-4o397k`. First:
  `ln -s /home/user/Youtube-videos/Future_Got_Weird/lightning-laser/source/node_modules <worktree>/Future_Got_Weird/lightning-laser/source/node_modules`
  and `mkdir -p …/source/out`. Do not commit; report the files you changed.

## 2. Beat ownership

Edit only your files. Create new helpers with your prefix, for example `v3/Air3_field.tsx`.

| Beat | Time (s) | Narration | File(s) and component | Owner |
|---|---|---|---|---|
| A | 0–4.31 | They fired a laser / into a thunderstorm— / and the lightning FOLLOWED it. | `v3/Open3.tsx` `OpenA` | A+H agent |
| B | 4.31–7.81 | You see, air normally RESISTS / the flow of electricity. | `v3/Air3.tsx` `AirB` | B agent |
| C | 7.81–11.42 | But this MACHINE fired / a THOUSAND laser pulses / every second, | `v3/Machine3.tsx` `MachineC` | C agent |
| D+E | 11.42–18.79 | stripping ELECTRONS / from air MOLECULES / and HEATING a narrow channel / through the sky. / That gave electricity / an EASIER PATH to travel. | `v3/Channel3.tsx` `ChannelDE` | D+E agent |
| F | 18.79–25.61 | So when lightning erupted UPWARD / from a nearby TOWER, / part of the bolt / followed that CHANNEL / for over 160 FEET. | `v3/Demo3.tsx` `DemoF` | F agent |
| G | 25.61–28.94 | A normal lightning ROD / only reaches as high / as its metal TIP. | `v3/Rod3.tsx` `RodG` | G agent |
| H | 28.94–33.5 | But these scientists EXTENDED one / into the SKY— / using the AIR ITSELF. | `v3/Open3.tsx` `EndH` | A+H agent |
| scenery | all 3D views | — | `v3/Scene3.tsx` (Sky3D, Summit3D, Tower3D, lighting) | scenery agent |

Ownership details:
- The A+H agent may also tune `OPEN0`/`OPEN1`/`DRIFT` in `cams3.ts`. Keep the tower tip, laser line and leader in roughly the same screen region.
- The F agent may tune `DEMO0`/`DEMO1`/`demoBase` and `demoZoom`'s end time.
- Nobody else edits `cams3.ts`, `timeline3.ts`, `states3.ts`, `view3.tsx`, `palette.ts`, `shots3.tsx`, `Film3.tsx`, `captions3.ts`, `Root.tsx` or `v2/`. If you need a change there, describe it in your report and work around it locally (for example a wrapper in your own file).
- Beat components get the film time `t` and draw the whole 1080 × 1920 frame in SVG (inside `<svg viewBox="0 0 1080 1920">`). Use scene-local timing from `B`/`EV`.

## 3. Hand-off contracts (the seams between beats)

- **A → B (4.31).** B starts by rendering exactly `View3` with `openCam(t)` and `openSt(t)`, so frame 4.31 is identical to A's frame 4.30 plus one frame of motion. B then pushes in toward a patch of ordinary air beside the channel. Compute the target from the projected geometry (`projector(openCam(t))` of a 3D point), never from hard-coded screen numbers, because A may retune `OPEN1`.
- **B → C (7.81).** A hard cut to the shelter (a new location is useful information).
- **C → D (11.42).** C ends by pushing into one cyan laser packet. At 11.42 the packet's glow is at screen centre (540, 960), moving upward along the beam's on-screen angle `MICRO_ANG` (14.9° clockwise from vertical). D opens on that packet at the same screen point, travelling the same way.
- **E → F (18.79).** E's pull-out ends with the magnified channel on `P0_SCREEN` (≈ 554, 1029), pointing along `MICRO_ANG`, at magnification `Z_HAND` relative to F's main view. At 18.79, F draws `demoCam(t)` (zoomed by `demoZoom`, Z_HAND → 1 over 18.79–19.35). The channel point P0 = `axis3(P0_H)` sits exactly where E left it, with the same direction. E should cross-fade its molecular layer out near the end of its pull-out, once the scale is close to the macro channel. F should show only the macro channel: warm haze and cyan line.
- **G → H (28.94).** G ends with the rod's metal tip at screen (540, 820), pointing straight up, and settled (still) for the last ~0.4 s. H opens on the tower's rod tip at (540, 820). V2's R3 camera, `lookAtScreen(v3(-26,118,-44), TIP3, 2600, 540, 820)`, is the reference.
- **H → A (the seam 33.5 → 0).** By 32.9 at the latest, H is on `openCam(t)` exactly, and stays on it until 33.5 (blend in with zero velocity difference, for example `lerpCam(path, openCam(t), w)` with w eased to 1 by 32.9). `openSt` runs on the loop clock, so the next leader incepts at the tip at 32.9 and frame 0 continues it. Check frames 1000–1004 against 0–4: no pause, no jump, no teleport.

## 4. Sound-locked events per beat (all in `EV`)

- **A**
  - The leader is at ~30 m at frame 0, climbs the cyan path in readable slow motion and connects at 1.75 (loud crack; thunder 2.1).
  - Restrikes at 3.52, 3.64 and 3.83 re-brighten the guided channel ("FOLLOWED" spoken 3.26–3.77).
  - The ARM click (2.72) has no picture event; leave it.
- **B**
  - Fizz 4.36, snap 4.52, zaps 4.55 and 4.73, sizzle 4.85: a side streamer jabs from the channel into ordinary air, steps, and stalls.
  - The swell 5.0–5.5 is the molecular view settling.
  - Attempts 5.6, 6.35 and 7.05 (crackle and stall).
- **C**
  - Laser hum from 7.81. FIRE click 8.01 is the fingertip contact; relay 8.07.
  - Packets through the optics at 8.90 + k/9 and leaving the window at 9.61 + k/9 (k = 0…6).
  - Push swell 10.98–11.43.
- **D**
  - The pulse passes 11.42–12.32; eight quiet "electron freed" pings at 11.5–12.2.
  - Two louder "torn away" pings with sparks at 12.62 and 12.92: the representative electrons.
  - Heating shimmer 13.43–15.73.
- **E**
  - The leader crackles 15.98–18.58 as it runs the channel.
- **F**
  - Demo leader crackle from 19.55: the leader incepts at the tip (the word "upward" is 19.99).
  - Connection crack 21.85; thunder 22.25.
  - Words "one hundred sixty feet" 23.64–25.11.
- **G**
  - Distant strike 25.74 (behind the hills); thunder 26.2; faint far flicker 28.25. "metal tip" is 27.89–28.49.
- **H**
  - Channel-extends shimmer 29.19–30.89; "extended" 29.92.
  - Payoff ticks 30.84, 31.14, 31.44, 31.74 (pulses leaving the telescope).
  - The field builds at the tip 31.88–32.9; the leader incepts at 32.9 and crosses the seam.

## 5. Beat specs

Each spec repeats the parts of the V3 brief that apply to that beat.

### A: opening demonstration (0–4.31), `OpenA`

- **Make the laser-to-lightning relationship unmistakable on a phone, from frame 0.**
  - The laser is already operating.
  - The upward leader is beginning at the tower tip and climbing the thin cyan path.
  - Visible progression: advancing leader → alignment with the laser-created channel → the stronger guided section at the connection.
  - Readable illustrative slow motion. No completed, motionless bolt.
- **On "and the lightning FOLLOWED it" (2.52–4.31) the alignment and following stays the dominant image.**
  - It is the same physical event, restrikes on the guided section.
  - The control-room character does not appear.
- **One stable medium-wide setup** (`openCam`) with at most one motivated move (already in the contract: a pull-back revealing the connection). Retain the tower and channel position and direction.
  - Local storm illumination can emphasize the payoff without hiding the path or the caption.
  - Keep the active region large enough to see without a featureless white glow.
- Separation: cyan path / warm prepared air / white-violet discharge.

### B: why ordinary air resists (4.31–7.81), `AirB`

- **Transition (4.31 → ~5.0).** From the A view, push toward a patch of ordinary air beside the channel, preserving the spatial relationship.
  - A short side streamer from the channel jabs into that air (snap 4.52), steps (4.55, 4.73) and stalls (4.85).
  - Follow its tip into the molecular view.
  - Use a zoom-dissolve at one screen point, once the macro view shows only air, so the tower is never doubled.
- **One clear microscopic explanation of ordinary air.**
  - A small group of readable neutral molecules: a few clear foreground N₂ (blue pairs) and O₂ (red pairs), with a quiet low-contrast background for depth.
  - A short electrical leader struggles to advance (the steps, then attempts at 5.6, 6.35 and 7.05) and fades before crossing the region.
  - The audience understands resistance through the action: bound electrons tug toward the tip and snap back.
- Keep the active discharge easy to locate. Keep a consistent upward-right direction (the streamer and the leader advance up and to the right) that connects to the later channel at `MICRO_ANG`.
- Molecules drift subtly while the camera settles. Every particle's motion has a role. No busy screensaver, no unrelated lab, no charged-plate diagram.
- The standalone cloud and character gag is removed: no person in B.

### C: machine and pulse generation (7.81–11.42), `MachineC`

- **C1 (7.81–8.95): the scientist at the control panel** (reuse V2 F1: `ShelterV2` mode `'fire'`).
  - One readable action. Her hand is already approaching the FIRE control at 7.81, the fingertip contacts it at 8.01 (the click), the cap depresses, and the machine visibly activates: cap lit, pulse lamp strobes, trace jumps, the beam visible in the window.
  - Then one clean release (lift off) before the cut. No hovering, no contact resets.
  - Wrist, elbow, shoulder and hand stay connected. The fingertip stays on the cap while the camera moves; anchor the motion to the action and never slide the whole figure.
  - Inspect the face layers (glasses, eyebrows over hair, bun) and that the desk occludes her torso.
- **C2 (8.95–9.67): the simplified optics cutaway** (from V2 `F2Cutaway`, recoloured cyan). The packet train moves through the optics; a turning mirror sends it up the duct.
- **C3 (9.67–11.42): one continuous reveal.** This replaces V2's F3 window + F4 mast angles.
  - Packets leave the emitter (the telescope exit, composited 2D `LaserArt` placed on the projected `EXIT3`).
  - The camera follows the pulse train up the beam into the air, past the upper tower, and pushes into one packet. That push is the C → D contract.
  - Preserve the exit point and the upward direction through C2 → C3. Represent the pulse rate as a readable illustrative train or glow; never full-screen flashes.

### D + E: electrons, heating, the channel; the easier path (11.42–18.79), `ChannelDE`

- **D is one connected process in the same patch of air**, with the channel axis along `MICRO_ANG` (upward-right):
  1. The packet passes through a small, clearly framed group of molecules (11.42–12.3). Small electrons pop off a few molecules it passes (the quiet pings).
  2. The camera pushes in to one representative molecule. Its electron visibly separates at 12.62 with a spark, and a second at 12.92.
  3. The affected region warms (from 13.43) and nearby molecules move outward.
  4. A narrow, less-dense channel remains, extending along the same axis ("narrow channel" 13.87–14.68). Pull back along that axis ("through the sky" 14.68–15.87), keeping the active process in the same part of the screen and its orientation as the view expands.
- **D drawing rules.**
  - Electrons separate from intact molecular symbols; molecules never become decorative fragments.
  - Use a warm accent for heated air, cyan for the laser path, white/violet for the discharge.
  - Background molecule contrast and density stay low, so the changed channel reads on a phone.
  - The channel is a region within air: no tube, tunnel or rigid orange wall.
- **E reuses the same channel.**
  - An electrical leader advances through the changed region while the surrounding air stays quiet. Animate the advancing tip and the developing path (not a glowing dot on a line), and keep the channel visible beneath the discharge.
  - The camera holds steady or gently tracks the tip.
  - Pull out toward the sky, keeping the channel's screen position and direction, with no jump to another axis. This is the E → F contract.

### F: upward lightning and the measured guided section (18.79–25.61), `DemoF`

- Resolve into the same summit/tower/laser geography as the hook. One main demonstration view (`demoCam`) stays coherent through the narration.
- On "erupted UPWARD", the leader visibly originates at the tower tip and advances upward. On "followed that CHANNEL", show the path relationship clearly: the guided part hugs the cyan line, with restrained branches after the guided portion.
- Preserve visible detail inside the discharge.
- The "160+ ft" bracket is used once:
  - It is attached to the guided segment above the tower, its endpoints aligned as the camera moves.
  - It is revealed as the narration reaches the distance (23.64–24.34), then the completed result registers.
  - It stays readable without competing with the caption.
- The distance reveal is the progression: one controlled widening that includes the whole measured segment and keeps the action's location. No near-identical extra tower angles.

### G: ordinary metal rod (25.61–28.94), `RodG`

- One cut to the house with its lightning rod and visible down-conductor (the existing illustration, `v2/Rod2.tsx` and `scenes/Rod.tsx`).
- The distant strike 25.74 stays behind the hills, never near the house.
- One smooth push that settles near the tip. On "metal TIP" (27.89–28.49) the move finishes and the endpoint reads. Keep subtle rain and cloud motion; never a frozen image.
- Illustrate the physical extent of the metal conductor, for example the flash catching the copper conductor from the earth clamp up to the tip. Never draw a protection boundary or imply it protects only an area the size of its tip.
- End aligned for the match cut (G → H contract).

### H: air extension and seamless replay (28.94–33.5), `EndH`

- **Match from the rod tip to the tower tip** (G → H).
- **Build the laser-created air channel upward** as the narration says the scientists extended one into the sky: the channel, `channelTop`, grows over 29.19–30.89 and the camera tilts up with it. Show the physical relationship established earlier; no new device and no diagram.
- **One motivated reveal**, the single cut at 30.74 ("into the SKY—"), connects the laser apparatus to the tower:
  - it opens low on the composited `LaserArt` telescope firing up past the tower;
  - pulses leave it on the payoff ticks;
  - the camera rides up the beam with them to the tower tip.
- **The camera is exactly on `openCam` before the final half-second** (by 32.9). During "using the AIR ITSELF", keep the prepared channel readable.
- The field builds at the tip (corona, 31.88–32.9) and the next leader incepts at 32.9, so the last frame leads into frame 0.
- Match the camera transform, tower scale and placement, beam axis, cloud/rain phase (`tau3` drift), glow and discharge phase across the seam.

### Scenery (all 3D views), `v3/Scene3.tsx`

- Clearer terrain silhouettes (layered distant ridges, a readable summit outline), a believable tower footing (plinth seated on the rock, a small apron) and layered storm clouds.
  - Clouds: fewer, larger, darker lobed masses with lit undersides near the discharge, plus a higher and farther layer. Not an egg-carton grid of equal blobs.
- Rain is already 3D and coherent; keep it subtle and keep its direction coherent.
- Localized light response: the discharge lights what is near it (cloud undersides, tower facing side, rock), not the whole frame.
- Quiet the background around the caption band (y ≈ 1560–1760) and around the active beam.
- Keep the established vector style and performance: a still must still render in a few seconds.

## 6. Pacing and camera rules (every beat)

- **Cuts.** Every cut introduces information, shows a necessary consequence or makes a useful change of scale or location. Merge cuts that only show a slightly different view of the same object.
- **Readability.** Give an important pose, mechanism or result about half a second of readable screen time after it resolves, when the narration allows. Alternate decisive actions with brief readable moments, and keep meaningful object motion going during the quiet ones.
- **Focus.** One dominant focus of motion per beat. Reduce competing rain, clouds, particles, meters and glow while the key action occurs.
- **Continuity across cuts.** Preserve the viewer's eye position across a cut where possible: match the active object and its direction of motion.
- **Transitions.** Hard cuts for new information; continuous moves or match cuts for adjacent views of the same event. No overlapping dissolves that double the tower, character or beam.
- **Camera motion.** Short, restrained settling. No bounce, overshoot, arbitrary shake or alternating zoom directions. Use `sm5` and `ss` easing with matched endpoints. A camera can stay still while the action moves.
- **Captions.** The caption band is y ≈ 1560–1760 (centre 1660; integration may adjust per caption). Keep key action out of it.

## 7. Verification each beat must do before reporting

- **Boundary frames.** Render your first two and last two frames, and the frame either side of each seam that touches your beat: frames `round(30·B.x) - 1` and `round(30·B.x)`.
- **Contact sheets.** Sheets across your whole beat at every 2–3 frames for fast actions (button press, leader origin, measurement reveal, electron separation, scale changes).
- **Full-resolution check.** At least 3 full-resolution stills: anatomy, masks and draw order, glow versus core and caption, edge popping, particle clipping.
- **Type check.** `npx tsc --noEmit -p .` is clean for your files.
- **Report** (structured):
  - your worktree root (`git rev-parse --show-toplevel`);
  - every file you created or changed (paths relative to `Future_Got_Weird/lightning-laser/source`);
  - what each 0.5 s of your beat now shows;
  - how each contract is met, with the frames you checked;
  - any requested contract change;
  - remaining issues, stated honestly.

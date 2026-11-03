# Bone Glue V3: plan and module contracts

V3 is a rebuild of V2's picture around the same approved narration (`production/NARRATION_LOCKED.txt`, verbatim, take
2). The master's sentence gaps are tightened to 0.18 s (words untouched; whisper and zipformer WER 0.000). Speech ends at
25.27 s and the film runs 25.83 s (775 frames at 30 fps).

## Beat map (word times from `source/src/data/timeline.json`)

| Time (s) | Words | Picture (every beat is a physical event) |
|---|---|---|
| 0.00 | "If you shattered your wrist," | **Frame 0**: a dramatic cutaway of the wrist. The palm and thumb are at the top, and an elongated organic skin cutaway runs over the distal radius and ulna. The distal radius is shattered: its two articular fragments (the styloid and lunate fragments, either side of seam C2) are split apart and lifted off seam C1, with the gaps open and dark and the broken faces exposed. No instruments are touching yet. The camera is already pushing in. |
| 0.15–0.80 | | The applicator's cannula enters from the right, and turquoise adhesive is injected at the C1/C2 junction. Bright glue fronts race outward along C1, C2 and C3 at once, coating the broken faces. |
| 0.50–1.50 | "imagine" | Pointed reduction forceps enter, bite the two articular fragments and close. The fragments visibly slide together and seat onto C1, squeezing the glue into a thin band. Mechanical, unmistakable movement, done by the tool, not by the glue. |
| 1.50–2.50 | "gluing the bones" | The tools withdraw along their axes. The camera makes a rapid, smooth pull-out to the whole wrist and forearm in the cutaway: the bone is aligned and held by teal lines. The fracture is still visible; it is not healed. |
| 2.50–3.70 | "back together." | The fingers flex once (the hand is alive), then a fast push into the glue band in the transverse seam lands on the MATCH framing (`production/v2_match_band.json`). |
| 3.72 | "Researchers" | **Match cut** to the lab: a turquoise bead from a lab applicator lies on the same screen line. |
| 3.72–5.40 | "actually did it." | The lab: a gloved researcher's hand lays the bead along a crack in a bone specimen on the bench. The camera pulls back as the bead runs, then the two halves are pressed together. |
| 5.46–7.10 | "They developed an experimental glue" | A droplet forms at the nozzle and falls. The camera follows it down into a beaker of seawater on the bench and plunges through the surface. Underwater, the droplet becomes the start of the oyster scene. |
| 7.13–8.95 | "inspired by oysters sticking to" | The oyster on a wet rock in a strong current. Water, particles and weed rush past while the oyster does not move. A push to its base, and the section window opens on "sticking" (cement between shell and rock). |
| 8.97–9.55 | "rocks." | The cement band holds, then dissolves into the glue band on the same screen line (the existing V2 match). |
| 9.57–10.60 | "It grips bone" | Wet macro: fluid sheets across the bonded seam; the glue stays sealed to both faces. |
| 10.60–11.40 | "even inside" | Push into the **micro section** of the interface: rough, porous bone faces, wet. The turquoise adhesive flows into the tiny irregularities and pores, displacing the fluid, and grips both surfaces. |
| 11.16–12.40 | "a wet, bloody wound." | Back out to the macro as the blood wash sweeps over; the bond holds. |
| 12.59–13.90 | "In one reported wrist case," | Pull out to the patient's wrist in surgery (incision, retractors, gloved hands, instruments): the case. |
| 14.13–15.60 | "surgeons secured the broken pieces" | Push in: the probe seats the displaced wedge (positioning), the applicator runs glue into its seams, and the probe releases. The fragments stay. |
| 15.85–17.20 | "in just three minutes." | Before/after reveal: the camera tracks across the fracture past the still-open, unglued crack, then onto the bonded seams, while the glue sets from gloss to satin with a cure glint along the seams. The surgeon's hands leave. |
| 17.41–19.40 | "The fracture still needed months to heal." | The incision is sutured. A cutaway opens on the same fracture in the same orientation: hematoma, then soft callus swelling at the margins. Time-lapse cues: the sutures dissolve and the light shifts. |
| 19.44–20.80 | "But as new bone grows," | A push into the macro of the T-junctions: pale woven bone advances from both broken faces into the glue. Glue and new bone stay distinct colours and textures. |
| 20.86–22.70 | "the glue gradually disappears." | Pull back over the whole fracture as the glue breaks into islands and is gone; remodelling. The skin returns as the camera moves outward. |
| 22.79–25.27 | "Your body replaces the stuff holding you together." | The recovered hand and forearm. The wrist bends toward the thumb, across and back, and the fingers spread. |
| 24.90–25.83 | (tail) | A push back into frame 0's composition: the same cutaway, now over intact healed bone. A short matched dissolve to the shattered frame 0 completes the loop. The healed bone is never animated breaking. |

Science rules: the glue never moves bone (instruments do); the fracture stays visible after fixation; healing is
months, shown as a time-lapse; new bone replaces the glue.

## Shared rules for all module builders

- **Project.** `/home/user/Youtube-videos/Future_Got_Weird/bone-glue/source` is Remotion 4.0.533 with React SVG, frames
  of 1080×1920 at 30 fps. Units are world millimetres; the fracture sits at the origin (see `src/art/anatomy.ts` and
  `src/art/seams.ts`). Cameras are `Cam {x, y, w, k?, focus?}`, with `w` the frame width in mm (`src/camera.tsx`). Depth
  layers use `<Layer c={cam} z={…}>`. Use the shared helpers: `src/core/geo.ts` (`pt`, `add`, `lerpP`, `closed`,
  `open`, `poly`), `src/lib.ts` (`ss`, `clamp`, `noise1`, `hash`), `src/art/palette.ts` (`C`, `INK`) and
  `src/core/ids.ts` (`uid`).
- **Style.** The Weird Crew 2D vector look: navy ink outlines (non-scaling strokes), cel shading, key light from the
  upper left, restrained depth. Glue colour comes from the palette (`C.glue*`). No 3D renders, no labels, no text.
- **Anatomy.** Plausible: no floating tools (every tool is held, or runs off-frame toward its hand), no distorted hands.
- **Rendering stills.** Never write to `/dev/shm`; it is cleared. Use your own folder under
  `/tmp/claude-0/-home-user-Youtube-videos/1408cabe-3c65-5cfb-9ca8-ec089a633118/scratchpad/v3/<you>/`. Set
  `TMPDIR` there, then run `./node_modules/.bin/remotion bundle src/test/<yours>.entry.tsx --out-dir=<dir>/bun` and
  `./node_modules/.bin/remotion still <dir>/bun <Comp> out.png --frame=0 --props='…'`. Console lines from
  react-dom at `production.js:760` are harmless. The root disk has about 2 GB free, so keep only small images.
- **Files.** Edit only the files your contract names, plus your own test entry `src/test/<name>.entry.tsx`. Do not
  edit `story.ts`, `Scene.tsx` or another builder's files. Do not commit. Run `npx tsc --noEmit -p .` clean before you
  report.
- **Report back.** Give the exported API with types, the camera keys and state parameters, the stills you checked, and
  any known weaknesses.

## Module contracts

### A. Shattered fragments (`src/art/seams.ts`, `fracture.tsx`, `wet.tsx`, `heal.tsx`, `src/v2state.ts`)

Generalise the one moving wedge to three rigid fragments:
- `wedge`: the existing one.
- `styloid`: above C1, on the right of C2.
- `lunate`: above C1, on the left of C2.

`export type FragId = 'wedge' | 'styloid' | 'lunate'` and `Poses = Record<FragId, WedgeX>`. Provide:
- `POSES_SEATED`.
- A dramatic `POSES_SHATTER`, readable at phone size at a framing about 60–90 mm wide: the articular fragments split
  apart across C2 and lifted off C1, gaps about 2–3.5 mm with slight angulation, the broken faces and the cancellous bed
  exposed. Add the wedge displaced as in V2. No overlaps anywhere on the path to seated.
- A smooth `posesLerp(u)`.

`BoneState2` gains an optional `poses` (the `wedge` field stays and keeps working; when `poses` is absent, everything
behaves exactly as now). The radius outline (the styloid tip, the articular rim) moves with its fragments. The glue
band fills between the two faces of a displaced seam and narrows as they close (a squeeze), with optional multiple
simultaneous glue fronts: `fronts?: {seam, s, flow}[]`, each with the fresh bulb or bright head. Seated poses must
render pixel-identically to today (verify by rendering V2 frames before and after and diffing). Test entry
`src/test/shatter.entry.tsx`.

### B. Lab and droplet (`src/art/lab.tsx`, new)

`LabWorld: React.FC<{id: string; t: number; cam: Cam; st: LabState}>`, with `LabState = {bead: 0..1, press: 0..1,
drop: 0..1, fall: 0..1, plunge: 0..1}`. Draw:
- A lab bench (a white or pale mat; restrained).
- A bone specimen: a sawn segment of long bone with a cream cortex, a visible cancellous cut face and a crack through
  it.
- A gloved researcher's hand (blue nitrile glove plus a white lab-coat cuff) holding a lab dispensing applicator, laying
  a turquoise bead along the crack (`bead`). The other gloved hand presses the two halves together (`press`).
- A droplet forming at the nozzle (`drop`) and falling (`fall`) into a beaker of seawater on the bench, and the camera
  plunging through the water surface into bubbles (`plunge`). The last state reads as underwater, blue-green with
  bubbles and particles, matching the oyster world's water (`src/art/oyster.tsx`) so a short dissolve into
  `OysterWorld` at `OY_CAM_IN` works.

Export camera keys:
- `LAB_MATCH`: the bead lying on the same screen line, thickness and waviness as the glue band in
  `production/v2_match_band.json`, for a match cut from the wrist's MATCH framing.
- `LAB_WIDE`: the hands, specimen and beaker.
- `LAB_DROP`: following the droplet.
- `LAB_PLUNGE`: into the beaker.

Plus suggested move curves. Test entry `src/test/lab.entry.tsx`.

### C. Micro bonding section (`src/art/micro.tsx`, new)

`MicroWorld: React.FC<{id: string; t: number; cam: Cam; st: {flow: 0..1; grip: 0..1; wet: 0..1}}>`: a side
cross-section of the bond, about 2 mm across.
- Two rough, porous bone surfaces (cortical texture, a few lacunae, micro-irregularities and open pores) face each
  other across a narrow gap filled with fluid: water and a few blood cells.
- The turquoise adhesive front (`flow`) advances from one side, wets into the pores and roughness, pushes the fluid and
  cells ahead and aside, and bonds to both faces. `grip` shows the anchoring: tiny fingers in the pores tighten.
- The composition matches the macro glue band: a horizontal band centred near screen y 1000, glue between bone above
  and below, so a push-dissolve from the macro framing reads as zooming into the same band.

Export `MICRO_IN` and `MICRO_OUT` cameras. Test entry `src/test/micro.entry.tsx`.

### D. Reduction forceps and hook cutaway (`src/art/forceps.tsx`, new; `src/art/arm.tsx` window shape only)

`ReductionForceps: React.FC<{id: string; st: {tipA: P; tipB: P; close: 0..1; on: 0..1; lift: 0..1}; px: number}>`:
pointed reduction forceps (Weber-style) seen from above, in the instruments' style (`src/art/instruments.tsx`).
- Two curved jaws with pointed tips meet the bone at `tipA` and `tipB`, with a ratchet and ring handles running
  off-frame toward the top or upper left, where the holding hand is.
- The jaws close as `close` goes 0→1, the tips biting the bone.
- `on` brings it in and takes it out along its axis; `lift` raises it off the bone.
- Contact shadows; drawn at the instruments' depth. A `ForcepsShadow` for the bone layer.

In `arm.tsx`, add optional aspect and rotation to the cutaway window (`Win.aspect`, `Win.rot`) so the hook's cutaway
can be an elongated organic opening along the forearm over the radius and ulna, plus an optional crisper rim style
(`Win.rim: 'soft' | 'cut'`). Existing windows must render unchanged. Test entry `src/test/forceps.entry.tsx`.

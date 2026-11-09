# Robot Escapes Jail V2: build brief, narration map and contracts

Project: `/home/user/Youtube-videos/Future_Got_Weird/robot-escapes-jail/`. Remotion 4.0.533 + React SVG, 1080×1920, 30 fps,
972 frames (32.40 s, the locked narration's real length). V2 code lives in `source/src/v2/`. V1 (everything outside
`src/v2/`) is PRESERVED: never edit V1 shot files; V1 modules in `src/art/*`, `src/world.ts`, `src/lib.ts`, `src/story.ts`,
`src/dc/*`, `src/core/*` may be IMPORTED but not edited (copy a helper into your own V2 file if you need a change).

**Read first:** `production/DIRECTION_V2.md` (the creator's V2 direction, verbatim: it takes precedence over this brief),
`production/SCIENCE_NOTES.md` (+ `production/SCIENCE_NOTES_V2.md` when it exists), `../FGW_EDITING_RULES.md`,
`production/NARRATION_LOCKED.txt`, this brief. V1 for reference: `exports/FGW_Robot_Escapes_Jail_V1_REVIEW_1080x1920.mp4`,
`production/FGW_Robot_Escapes_Jail_V1_keyframes.png`, `production/QA_REPORT.md`.

## Narration lock

The narration is the V1 master `audio/narration/FGW_Robot_Escapes_Jail_narration_V1.wav` (sha256 `afa5f2cd…`, 32.40 s). It
is never edited, regenerated or shifted. Every beat is keyed to the measured word times `T` (`src/story.ts`, re-exported by
`src/v2/story2.ts`). Captions are the same phrase timeline (`src/data/timeline.json` captions), drawn by the film.

| t (s) | Narration (measured) |
|---|---|
| 0.00–2.87 | "This robot escaped JAIL… (JAIL 1.24–1.61) by MELTING." (by 1.86, MELTING 2.13–2.87) |
| 3.26–5.52 | "Scientists locked it inside a tiny cage." (locked T.locked, tiny T.tiny, cage 5.14–5.52) |
| 5.87–7.33 | "But instead of breaking the bars…" (breaking 6.33, bars 6.89–7.33) |
| 7.63–8.50 | "It MELTED." (MELTED 7.84–8.50) |
| 8.88–11.27 | "Its entire body turned into liquid metal." (turned 9.89, liquid 10.45) |
| 11.64–13.31 | "Then it slipped straight through the bars." (slipped 11.86, through T.through, bars T.bars2) |
| 13.71–16.71 | "Then scientists collected the metal and molded it back into shape." (collected 14.47, molded 15.43, shape 16.47) |
| 17.13–17.44 | "How?" |
| 17.89–20.22 | "It's made from a metal that melts near body temperature." (melts 18.86, body 19.43, temperature 19.75) |
| 20.52–22.12 | "And magnets help control its movement." (magnets 20.56, control 21.29, movement 21.89) |
| 22.59–27.58 | "Scientists are exploring whether robots like this could one day retrieve objects from inside your body." (robots T.robots, one day 24.92, retrieve 25.52, objects 25.95, inside T.inside2, body 27.32) |
| 27.93–28.94 | "So apparently…" |
| 29.29–31.80 | "Even prison bars can't stop a robot anymore." (Even 29.29, prison T.prison, bars T.bars3, can't 30.32, robot 30.88, anymore 31.36–31.80) |

## V2 shot plan (narration-mapped; `src/v2/story2.ts` `SHOTS2`)

The creator's V2 timeline is "approximate and must be synchronized with the narration"; its beats are mapped to the
sentences they illustrate:

| Shot | t | Owner | Picture |
|---|---|---|---|
| H1 | 0–3.40 | A | HOOK (dramatization of the escape). Frame 0: extreme close-up, the silver robot gripping two thick bars, face already pressing into the too-narrow gap (deformation already begun). 0–0.35 deform starts; 0.35–0.85 head and shoulders soften to liquid, face stretches with the flow, metal pours through the gap, camera tracks the flow; 0.85–1.45 the whole liquid body squeezes through (compress → stretch → collect on the other side) in ONE continuous, spatially clear shot (the camera arcs so inside→outside reads across the screen); out just after "JAIL" (1.24–1.61). 1.45–2.0 the head snaps back into its exact original shape outside, eyes straight at the viewer; ≤ 0.15 s comedic hold. 2.0–2.95 pull back ("by MELTING"): wide jail, robot standing outside, cell still locked (padlock), silver residue on the bars, alarm. 2.95–3.40: motivated push into the robot's reflective face (the camera enters the metal) → the last ≥ 3 frames are the full-frame `ChromeSurface`. Small tag "STYLIZED RECREATION" while the dramatization could mislead (e.g. from the reform). |
| LB | 3.40–13.67 | B | THE REAL LAB DEMO (no eyes, no personality: it is a material). From the full-frame `ChromeSurface`, pull out of the surface of the real-style figure: a ~1 cm minifigure-shaped MPTM figure (generic blocky toy figure, NO brand) standing inside a tiny lab cage on a lab stage. Tag "LAB DEMONSTRATION". Cage closed/locked on "cage" (5.14). "But instead of breaking the bars…": an external magnet (handheld/permanent magnet on a slider) drags the SOLID figure against the bars: rigid, it clunks and cannot pass (shows the stakes). "It MELTED": the alternating-field induction coil under the stage energises (AC arcs, warm glow, tag "AC FIELD HEATS IT"): the figure's structure gradually loses rigidity and collapses into a pool in ONE continuous, volume-conserving transformation; camera medium → close-up. "Its entire body turned into liquid metal": the shimmering pool, ripples, reflections; camera rises to an ANGLED OVERHEAD view (barrier, liquid and the destination outside all visible). "Then it slipped straight through the bars": the external magnet moves outside the cage, the liquid stretches into streams through the bar openings (necking, no floating pieces, droplets merge), and collects outside the cage; tag "EXTERNAL MAGNETIC CONTROL". Ends on the hand-off camera with the collected puddle. |
| MS | 13.67–22.56 | C | "Then scientists collected the metal and molded it back into shape": gloved hand + pipette collects the puddle, fills a minifigure mold, cooling (room air, not ice), the mold opens by hand → the re-formed solid figure (tag e.g. "RECAST IN A MOLD"). "How?": push into the figure's surface (enter the metal) → the material cutaway: silver gallium matrix with embedded magnetic (NdFeB) microparticles, layered, alive (subtle flow). "melts near body temperature": a clean gauge: GALLIUM MELTS 29.8 °C below BODY 37 °C, with the heat source shown as the AC-field induction (orange) — heat is NOT the magnet. "And magnets help control its movement": camera follows the material then pulls back to reveal the magnet: field → particles align/pulled → the material moves (one clear chain; minimal arrows/lines). Ends on the hand-off blob. |
| FU | 22.56–27.90 | D | "Scientists are exploring whether robots like this…": 2–3 connected shots, each new information, progressively more impressive: (1) a liquid/solid MPTM sample steered by an external magnet through a narrow channel / around an obstacle (lab), (2) "could one day retrieve objects": the STOMACH MODEL demo (tag "LAB DEMONSTRATION · STOMACH MODEL"): device steered to a small object, melted around it by the AC field, re-solidified, pulled out by the magnet, (3) "from inside your body": the model inside a ghosted human outline, tag "FUTURE IDEA" (hypothetical; no procedure, nothing gory). No eyes on the material (it is not a thinking robot). Ends on the hand-off sphere. |
| J1 | 27.90–32.40 | A | JAIL (dramatization) — comedic escalation, dry humor from the absurd situation, no dialogue: the robot is back in a cell with absurdly escalated security (e.g. extra bars welded closer, a stack of padlocks, the Weird Crew guard's deadpan "fixed it"); "So apparently…" the robot's eyes/posture react (deadpan look at us); "Even prison bars…" it walks up and grips two bars; "can't stop a robot anymore" a deliberate camera move into the EXACT frame-0 framing so the last frame flows into frame 0 (camera, lighting, silhouette, bar spacing, scale, background, direction of motion). |

## Boundary contracts (exact)

| Boundary | t | Outgoing | Incoming |
|---|---|---|---|
| H1 → LB | 3.40 | the push into the robot's chrome face ends full-frame: the last ≥ 3 frames are exactly `<ChromeSurface t={t} />` (engine) | the first ≥ 3 frames are exactly `<ChromeSurface t={t} />`, then the camera pulls out of the lab figure's surface |
| LB → MS | 13.67 | same lab world and camera `LAB_HANDOFF.cam` (labset), the collected puddle drawn by `labHandoffPuddle(t)` (labset) for the last ≥ 6 frames | the same camera and `labHandoffPuddle(t)` for the first ≥ 6 frames (continuous, not a visible cut), then the gloved hand enters |
| MS → FU | 22.56 | the last ≥ 4 frames: plain `C.navy1` background, only `<HandoffBlob t={t} />` (engine: a liquid-metal blob centred (540, 1100), r ≈ 110 px, gentle deterministic wobble) | identical first ≥ 4 frames, then the channel / obstacle course builds around it |
| FU → J1 | 27.90 | the last ≥ 3 frames: the retrieved silver device/ball as a chrome sphere centred (540, 900), r = 130 px, on `C.navy1` (shape match) | the robot's head circle centred (540, 900), r = 130 px (same chrome look), in the jail close-up; then the camera pulls back on the escalated cell |
| J1 → H1 (loop) | 32.40 → 0 | the last frame is frame 0's framing one step earlier (same camera, bars, robot pose; deformation not yet begun or exactly continuous) | frame 0 |

## Liquid-metal engine (wave 1, `src/v2/liquid/`, owner: ENGINE) — API contract for every shot builder

Approach: signed-distance fields of simple primitives, smooth-unioned (polynomial smooth-min), contoured per frame with
marching squares into crisp vector paths (no blur-threshold goo). Every visual layer (silhouette, rim light, core shadow,
horizon reflection band, speculars, warm/alarm tints) is an isoline of the SAME field (or of a shifted copy), so the
reflections deform consistently with the surface and every frame's geometry is valid. Volume is conserved by construction
in the choreography helpers (total area of the blobs is fixed; streams neck and stretch, they do not shrink).

- `liquid/sdf.ts`: `Prim` (screen px): circle `{k:'c',x,y,r}`, tapered capsule `{k:'cap',ax,ay,bx,by,ra,rb}`, rounded box
  `{k:'box',x,y,hw,hh,r,rot}`, ellipse; optional per-prim `z` (depth, world units) and `blend` override. `smin`, `sdPrim`,
  `sdField(prims, blend, x, y)`. World-space `Prim3` (sphere `{k:'s',p:P3,r}`, capsule `{k:'cap3',a:P3,b:P3,ra,rb}`) and
  `projectPrims(cam: Cam3, prims3) → Prim[]` (perspective size from `world.project`), so bodies live in the 2.5D world.
- `liquid/march.ts`: `isoPath(fn, box, cell, level?) → string` (closed loops, smoothed, `fill-rule: evenodd`), robust to many
  components and holes; adaptive cell from body size.
- `liquid/Chrome.tsx`: `<ChromeBody prims blend t cell? light? env? ink? depthSplit? />` — the toon-chrome liquid/solid body
  in the FGW Weird Crew finish (navy `INK` silhouette at constant width, bright silver base, crisp upper-left rim light,
  lower-right core shadow, dark horizon reflection band, 1–3 speculars, optional env tint `{tint, amt}` e.g. alarm red,
  optional `warm` 0..1 heat glow, optional floor contact shadow/reflection). `depthSplit {d0, part:'back'|'front'}` (or an
  equivalent mechanism) so a body passing between bars can be drawn in two passes around the bars without a seam.
  `<ChromeSurface t />` — full-frame chrome close-up for the H1→LB match (also usable as a lab-figure surface).
  `<HandoffBlob t />` — the MS→FU hand-off blob.
- `liquid/flow.ts`: volume-conserving choreography helpers: `streamThroughGap(...)` (a body of fixed area flowing along a
  path through a gap of width g: necks, stretches into a continuous stream, collects on the far side), `droplets(...)`
  (small droplets that detach and MERGE BACK), `puddle(...)` (spreading pool with ripples), `collapse(...)` (rigid →
  pool with gravity sag, keeping area). Deterministic, pure functions of t.
- `robot2.tsx`: the V2 hero robot, rebuilt as SDF primitives in world space so it can soften, flow and reform
  continuously. Silhouette and proportions follow the V1 robot (`src/art/robot.tsx`: 10 u tall, big rounded head with
  ear discs, two big cyan eyes, compact torso with a small chest panel, small arms and legs, simple joints), but rendered
  as one polished chrome body. Exports a rig (`robot2Prims3(base, pose, state)`) and `<Robot2 cam t pose state env/>` with
  decals (eyes, chest panel, joint seams) that ride their primitive and stretch/sink with deformation (no opacity fades
  to fake melting). `state`: `soften` (0 rigid … 1 liquid, per body region), `squeeze` toward a gap, `reform` (exact
  inverse path back to the rigid pose). Eyes reuse V1 `EyesAt`/`RobotEyes` look (cyan, simple, expressive).
- `labFigure.tsx`: the real experiment's figure: a generic minifigure-shaped cast (blocky head, trapezoid torso, block
  legs, simple arms; NO eyes, NO face, NO brand), same chrome engine, rigid → melt (`melt` 0..1, gravity collapse into a
  pool conserving area).
- Performance: a full-screen ECU body ≤ 0.5 s/frame; typical shot frames ≤ 1.2 s.

## Lab set (wave 1, `src/v2/art/labset.tsx`, owner: LABSET)

A 2.5D lab world (its own world units, millimetres, same `Cam3`/projection math as `src/world.ts`): a matte lab stage, the
tiny cage (thin bars, gap narrower than the figure; door/lid that closes; a padlock-free lab look), the AC induction coil
under the stage (energised look: orange glow, AC arcs), an external permanent magnet on a handle/slider, a gloved hand
helper, a collection dish, a mold; cameras `LAB_CAMS` (reveal, melt-medium, melt-close, overhead-angled, handoff) and
`LAB_HANDOFF {cam, puddle}` + `labHandoffPuddle(t)` for the LB→MS hand-off. Reuse V1 `src/art/lab.tsx` (hands, mold,
pipette) and `src/art/science.tsx` (coil, AC arcs, magnet, field lines) where they fit.

## Science guard-rails (from SCIENCE_NOTES)

- Material: gallium (99.9 %) + NdFeB microparticles (~38 µm), 9:1. Ga melts 29.8 °C (composite 30.6 °C), below body 37 °C.
- Heating: an ALTERNATING magnetic field (induction, ~50 kHz) — show an induction coil. Cooling: passive room air.
- Moving: an external magnet / field gradient, in solid OR liquid state. Heat ≠ magnet: keep them visibly separate.
- The figure (minifigure-shaped, ~1 cm) was melted and pulled through the cage bars by the external field; afterwards the
  liquid was collected / flowed into a MOLD and re-solidified: people did it, it did not reform itself.
- Medical: only a MODEL stomach (foreign-ball removal, drug delivery). No animal or human tests. The human body = FUTURE IDEA.
- Labels (short, ≤ 4 words, only where they prevent a misleading impression): "STYLIZED RECREATION", "LAB DEMONSTRATION",
  "AC FIELD HEATS IT", "EXTERNAL MAGNETIC CONTROL", "RECAST IN A MOLD", "GALLIUM", "+ MAGNETIC PARTICLES",
  "GALLIUM MELTS 29.8 °C", "BODY 37 °C", "STOMACH MODEL", "FUTURE IDEA". Use `src/v2/Tag.tsx` for context tags.
- The stylized robot (with eyes) appears ONLY in the jail dramatization (H1, J1). The real material never has eyes.

## Shared contracts

- Shots: `export const <Id>: React.FC<{t:number}>` (t = FILM seconds, only called inside its range) drawing the whole
  1080×1920 frame (one `<svg width=1080 height=1920 viewBox="0 0 1080 1920" style={{position:'absolute'}}>` plus HTML
  overlays such as `Tag`), and `export const CUES_<Id> = (): Cue[]` with
  `type Cue = {t:number; kind:string; gain?:number; dur?:number; pan?:number; variant?:number}` (film seconds).
- Sound kinds: see `tools/make_audio.py` / `tools/sfx_lib.py` (V2 adds kinds — read the file; ask for none that is missing,
  just use the closest existing kind and report it). Alarm: `alarm` starts one continuous klaxon until `alarm_tail`.
- Captions: drawn by the film in screen space, default centre y 330 (band 250–420, x 110–870); the director moves them per
  caption. Report where captions must NOT go (y ranges per time window). Builders draw NO captions.
- `src/lib.ts` (`clamp, ss, ss5, lerp, keyS, hash, noise1, ring`, `FPS, W, H`), `src/story.ts` (`T`), `src/world.ts`,
  `src/art/palette.ts` (`C`, `INK`, `INK_PX`, `INK_FEAT`, `NS`), `src/core/ids.ts` (`uid` — EVERY SVG id).
- Determinism: pure functions of t; no `Math.random`, no `Date`, no CSS animation, no state.
- Style: the Weird Crew vector finish — navy ink contours at constant on-screen width, cel/gradient fills lit from the upper
  left, small white glosses, deep navy world, cool steel, bright silver, cyan eyes, red alarm, warm yellow for science.
- Motion: every beat on its word; anticipation and follow-through; C2-eased camera (`ss5`/`keyS`), velocity carried across
  beats, every move motivated; a meaningful visual development every ~0.6–1.2 s in high-energy parts; no composition
  unchanged > ~1.5 s; no random shake/zoom punches; no one-frame pops.

## Testing (every builder)

    cd /home/user/Youtube-videos/Future_Got_Weird/robot-escapes-jail/source
    npx tsc --noEmit
    npx remotion still src/v2/test/<name>.entry.tsx <Comp> <scratch>/x.png --frame=<n> --log=error
    npx remotion render src/v2/test/<name>.entry.tsx <Comp> <scratch>/x.mp4 --log=error   # motion check
    ffmpeg -i x.mp4 -vf "fps=10,scale=216:-1,tile=8x5" sheet.png                           # continuity sheet

Look at every PNG with the Read tool at full size AND phone size (360×640). Own only your named files plus
`src/v2/test/<name>.entry.tsx` (its own `registerRoot`). Scratch under `/tmp/claude-0/v2_<name>/`. Do not commit.

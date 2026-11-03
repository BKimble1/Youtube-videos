# Eel Escape (FGW Short) — build brief for the art and sound modules

Project: `/home/user/Youtube-videos/Future_Got_Weird/eel-escape/` (Remotion 4.0.533 + React SVG, 1080×1920, 30 fps,
744 frames, 24.80 s). Source root `source/src/`. `node_modules` is installed in `source/`.

## The film (narration-locked; every time below is a measured word time)

A tiny underwater jailbreak. A juvenile eel, swallowed head-first by a predatory fish (a dark sleeper), backs out
TAIL-FIRST up the fish's throat, slips through a gill slit and leaves under the gill cover, head last.

| t (s) | Narration | Picture |
|---|---|---|
| 0.00–1.63 | "That tail sticking out of this fish" | Frame 0: the fish's head, facing LEFT, resting on the riverbed. Eye, closed mouth, prominent gill cover. A thin slate-blue eel TAIL protrudes from beneath the rear edge of the cover, rising over the fish's back, flexing on its own. In the first 0.46 s the cover beats once (flares and closes) and the tail flexes the opposite way. |
| 1.64–3.54 | "belongs to the eel it just swallowed." | The camera follows the exposed tail inward; the skin turns translucent along the eel and then over the body: the same eel continues inside — under the cover, through the gills, down the throat, its head in the stomach. |
| 3.86–5.41 | "Scientists filmed it on X-ray." | The fish's exact outline becomes an illustrated X-ray (dark background, radiograph flesh, bright skeleton). A fast visual rewind slides the eel back into the stomach. |
| 5.80–8.43 | "Inside the fish's stomach, the eel starts backing up." | Wide: the stomach and the route to the throat. The eel lies folded in the stomach, head deepest. On "backing up" the tail tip pushes into the esophagus. |
| 8.83–10.61 | "Its tail slides up the fish's throat," | Follow the tip up the esophagus, then widen before it reaches the gills. |
| 10.89–13.51 | "slips through a gap in the gills, and pokes out the side." | X-ray → a THREE-QUARTER CUTAWAY (camera yaw up to 22°): the tail turns sideways through the slit between gill arches 2 and 3, crosses the opercular chamber and slips out beneath the cover. One continuous eel from inside to the water outside. Then the exterior is restored: the opening composition again. |
| 13.88–15.57 | "Then the rest of its body follows." | More slides out tail-first, arching over the fish's back. |
| 16.00–17.54 | "Its head comes out last." | The head is the last part caught: its eye just visible inside the gill opening, the free body bending outside. |
| 18.00–19.74 | "The eel curls up outside the fish," | The free body curls into a loop and tightens. |
| 19.98–21.10 | "gives one final pull," | The head comes free (once) on "pull" (20.78 s). Water rush. |
| 21.30–23.77 | "and swims away from the animal that just ate it." | It straightens into a quick swimming stroke and swims clear up and to the right. The predator stays alive and upright (breathing, a startled flutter). Its departing tail sweeps close across the lens and wipes back to frame 0. |

## Coordinates and shared contracts (read these; do NOT edit them)

- `src/anatomy.ts` — **the** geometry, fish-local units ("u"): snout x = −50, caudal tip x = +50, **y down**,
  **z toward the viewer** (near side of the fish z > 0; head half-width ≈ 7). Body profiles `DORSAL`, `VENTRAL`,
  `BODY`; `EYE`, `MOUTH`, `PREOPERCLE`, `OPERCLE_EDGE` (the gill cover's free rear edge), `EXIT` (where the eel leaves,
  on the upper part of that edge), `EXIT_ANGLE`, `PECTORAL`, `PELVIC`, `DORSAL1/2`, `ANAL`, `CAUDAL`; interior
  `PHARYNX`, `GILL_ARCHES` (4 arches, z = `GILL_Z` 2.6), `ESOPHAGUS`, `STOMACH`, `SWIM_BLADDER`, `SPINE`; the route
  `TRACT`; the eel's `EEL_L` = 54, `EEL_RADIUS(u)` (u = 0 snout … 1 tail tip), `EEL_FEAT`. The fish rests on the
  riverbed, belly line y ≈ +12.4. World units in the film = these fish-local units (the fish sits at the origin).
- `src/eel.ts` — the eel's kinematics: `eelPose(t)` / `eelAt(t)` (from `story.ts`) returns `pts` (N+1 = 121 `P3`
  samples snout→tail), `exitIdx` (samples below it are inside the fish), `free`, `sigTip`, `fold`. `RADII[i]` is the
  radius at sample i. `S_EXIT`, `routeAt(σ, fold)`.
- `src/story.ts` — `T` (word times), `EV` (events), `camAt(t)` (camera), `eelAt(t)`, `fishAt(t)`
  (`{gill, reveal, revealSig, translucent, xray, cut, yaw, finPhase, startle}`), `gillAt(t)`.
- `src/camera.tsx` — `Cam {x, y, w}` (w = world units across 1080 px at depth 0), `<Layer c z>` (one depth layer: z > 0
  farther, z < 0 nearer, scale d/(d+z) with d = 2.2·w, depth-of-field blur), `layerScale`, `toScreen`, `viewRect`.
- `src/art/palette.ts` — `C` (every colour), `INK` (#172B3A navy), `INK_PX` (2.8 px), `NS` ('non-scaling-stroke').
- `src/core/geo.ts` (`pt, add, sub, mul, nrm, perp, rot, lerpP, closed(ps, tension), open(ps, tension), tube(C, R)`),
  `src/core/color.ts` (`mix, lit, shade, rgba`), `src/core/ids.ts` (`uid(tag)` — every SVG id must come from `uid`,
  several frames share one document in contact sheets), `src/lib.ts` (`clamp, ss, ss5, lerp, keyS, noise1, hash, ring`).
- `src/dc/` — the Weird Crew rig's drawing kit: `shade.tsx` (`LIGHT` from the upper left, `Capsule`, `Sphere`, `Blob`,
  `Lin` gradient primitives), `ink.tsx` (`Inked`, `Deco`, `InkLine`). You may use them, or draw directly.

Framings the film uses (world units across the frame width; px per unit = 1080 / w):

| beat | camera (x, y, w) | px/u |
|---|---|---|
| opening (frame 0) | (−31, −4, 48) | 22.5 |
| translucent reveal | (−13.5, 1, 64) | 16.9 |
| stomach wide (X-ray) | (−11.5, 2, 58) | 18.6 |
| follow the tip | (−19, 1, 48) | 22.5 |
| cutaway (yaw ≤ 22°) | (−25, −3.7, 45) | 24 |
| body follows | (−21, −13, 66) | 16.4 |
| head caught | (−24, −10, 46) | 23.5 |
| swim away | (−12, −19, 74) | 14.6 |

## Style: the channel's Weird Crew vector finish

- Navy ink contours (`INK`) at a constant on-screen width: `vectorEffect="non-scaling-stroke"`, `INK_PX` (2.8 px) for
  silhouettes, about 1.4–2 px for interior feature lines. Cel / gradient fills lit from the UPPER LEFT (`LIGHT`), small
  white glosses, flat clean shapes, restrained detail. No noisy photographic textures; soft procedural pattern (mottling,
  scales hint) is fine if it stays clean.
- **No text, labels, numbers, arrows, inset circles, floating graphics or decorative X-ray grids anywhere.** Captions are
  the only text, added by the film.
- Colours only from `C`. The eel is always the cool slate blue (`eelBack`/`eelFlank`/`eelBelly`), the predator's fins
  are always warm amber (`fin`): the eel must never read as a fin.
- Reference look: extract frames with ffmpeg from
  `../zombie-snail/exports/FGW_Zombie_Snail_V4_HOOK_FINAL_1080x1920.mp4` (2D animal, soft bokeh backgrounds) and
  `../zombie-ant/exports/FGW_Zombie_Ant_V4_FINAL_1080x1920.mp4` (the Dead Spider drawing core: close, tactile creature
  storytelling), e.g. `ffmpeg -v error -ss 3 -i <mp4> -frames:v 1 -vf scale=540:-1 <scratch>/ref.png`.

## How the Scene composes the modules (so you know what each component must be)

Everything is drawn in fish-local units inside camera layers. Normal exterior, back to front:

1. environment back (water, light, far bed) → 2. bed under the fish + contact shadow → 3. `FishFar` (far-side fins)
→ 4. `InteriorBack` + `GillArches` (only seen when the skin is translucent / X-ray / cut) → 5. the eel's inside part
→ 6. `FishBody` (skin, head, eye, mouth, dorsal/anal/caudal/pelvic fins; NOT the gill cover or near pectoral)
→ 7. `GillGap` (the dark opening beneath the cover's rear edge), with the eel's near-exit section clipped to
`gillGapPath(s)` → 8. `Operculum` (the gill cover) → 9. `Pectoral` (near pectoral fin) → 10. the eel's outside part
→ 11. environment front (near pebbles, motes) → 12. water rush → 13. captions.

- Translucent reveal: steps 6–9 get `opacity` and a soft `mask` (holes along the eel), so 4–5 show through.
- X-ray: 6–9 fade out; `XRayBack` (flesh, gut, gas) sits below the eel, `XRayFront` (skeleton, edge glow) above it at
  partial opacity, so the eel stays in its own colours inside the radiograph.
- Cutaway: the Scene masks the exterior (6–9) with `CUT_WINDOW` and applies the yaw per depth slice
  (screen x' = x0 + (x − x0)·cos ψ + z·sin ψ): `InteriorBack` z = 0, the eel segment behind the gill plane, `GillArches`
  z = 2.6, the eel segment in front of them, the `Operculum` strip z = 6.4, the outside eel z = 6.9; `CutEdge` draws the
  cut faces of the window (skin and muscle thickness), whose visible width grows with sin ψ.

## Module contracts

Each builder owns ONLY the files named, plus a test entry `src/test/<name>.entry.tsx` (`registerRoot` + one or two
`Composition`s, 1080×1920; a sheet of several states/times is fine). Import `story.ts` read-only to test at the real
framings and times (`camAt(t)`, `eelAt(t)`, `fishAt(t)`), through `<Layer c={camAt(t)}>`.

### A. The predator exterior and its X-ray — `src/art/fish.tsx`, `src/art/xray.tsx`

```ts
export type FishLook = {t: number; gill: number; finPhase: number; startle: number; prop: number; look: number};
// prop: 0..1 how far the eel lifts the gill cover's edge at EXIT; look: -1..1 the eye glancing back toward the gill
export const FishFar: React.FC<{s: FishLook}>;
export const FishBody: React.FC<{s: FishLook; opacity?: number; mask?: string}>;
export const GillGap: React.FC<{s: FishLook}>;
export const gillGapPath: (s: FishLook) => string;
export const Operculum: React.FC<{s: FishLook; opacity?: number; mask?: string}>;
export const Pectoral: React.FC<{s: FishLook; opacity?: number; mask?: string}>;
export const fishSilhouette: (s: FishLook) => string; // the full outer silhouette incl. fins (masks, X-ray)
export const XRayBack: React.FC<{s: FishLook}>;
export const XRayFront: React.FC<{s: FishLook; opacity?: number}>;
```

- A broad-headed, robust **dark sleeper** (*Odontobutis obscura*): big flattish head, large closed mouth with a slightly
  jutting lower jaw, dorsolateral gold eye, two separate dorsal fins (short spiny first, long soft second), anal fin under
  the second dorsal, a big ROUNDED caudal fin, fan-shaped pectoral fins, separate pelvic fins resting on the bed.
  Olive-brown with darker saddles/mottling, a pale belly, amber fins with dark spotted bands and visible rays.
- The **gill cover** must be prominent and clearly a separate plate just behind the eye: its rear edge (`OPERCLE_EDGE`)
  reads as a flap. `gill` flares it (the rear edge swings out and back by up to ≈ 1 u and a dark crescent of gill
  chamber appears beneath it). `prop` lifts the edge locally at `EXIT` (≈ 1.5 u, the eel's body wedged under it): the
  gap there must be deep enough (≈ 2.5 u at prop 1) that the eel's head and eye are visible inside it.
- The fish is alive: fins move gently with `finPhase` (pectoral fanning, caudal sway, dorsal rays flexing slightly);
  `startle` (0..1, after the release) flares the fins and flutters the cover; `look` turns the pupil toward the gill.
- The X-ray must use **exactly the same outline** as the exterior (the same paths, including the fins) so the match
  reads: dark navy background is the Scene's; you draw a luminous radiograph — soft-tissue density brighter where the
  body is thicker, the bright skeleton (skull, jaws, opercular bones, gill arches, vertebral column, ribs, fin rays),
  the gut faintly denser, the swim bladder dark (gas). Clean vector shapes, no grid, no text.

### B. Inside the fish and the cutaway — `src/art/inside.tsx`

```ts
export const InteriorBack: React.FC<{t: number; mode: 'reveal' | 'cut'}>; // flesh hints, throat/pharynx, esophagus, distended stomach (and its wall over the folded eel), opercular chamber
export const GillArches: React.FC<{t: number; mode: 'reveal' | 'cut'; gill: number}>; // the 4 red arches with filaments
export const CUT_WINDOW: string;            // fish-local path: the cutaway window
export const CutEdge: React.FC<{yaw: number}>; // the window's cut faces (skin + muscle thickness)
export const StomachFront: React.FC<{t: number; mode: 'reveal' | 'cut'}>; // optional: a translucent front wall over the eel in the stomach
```

- The window opens the near side over the throat, gill arches and opercular chamber (about x −38 … −18, y −11 … 6),
  leaving the **rear strip of the gill cover** (≈ 1.5–2 u wide along `OPERCLE_EDGE`, around `EXIT`) intact, so the eel is
  seen passing through the gill slit (between arches 2 and 3, at `TRACT` point (−30.55, −2.5)), crossing the chamber
  and going UNDER that strip to the outside. Keep the mouth outside the window (it stays visible and closed).
- Interior palette from `C` (flesh, pharynx, esophagus, stomach, gill reds, chamber dark). It is shown both through the
  translucent skin (mode `reveal`: softer, lower contrast) and in the cutaway (mode `cut`: clear, with depth shading).

### C. The eel — `src/art/eelArt.tsx`

```ts
export const Eel: React.FC<{pts: P[]; radii: number[]; from?: number; to?: number; px: number; t: number;
  dorsal?: 1 | -1; opacity?: number; clip?: string}>;
```

- Draws the eel along `pts` (121 samples, snout→tail, already projected to the layer's units) with `radii`;
  `from`/`to` draw a section (cut ends flat, no cap, so sections join invisibly when drawn in sequence; the head is drawn
  only when `from` is 0; the tail point only when `to` is the end). `px` = screen pixels per unit.
- A juvenile Japanese eel: a small rounded head with a SMALL eye (with a highlight), a mouth line and a gill slit, a
  tiny rounded pectoral fin; a long round body tapering to a fine point; the continuous ribbon fin (dorsal from u ≈ 0.40,
  anal from u ≈ 0.47, merging around the pointed tail). Cylindrical cel shading from the upper left, a darker slate back
  on the `dorsal` side, a pale belly on the other, a faint lateral line, ink silhouette. It must read as ONE connected
  animal and, at phone size (360×640), its tail must read as a tail (round, tapering, slate blue, fringed), never as a
  flat fan-shaped fin.
- Robust for all poses: tight coils (curvature radius ≈ 2.5 u), sharp bends at the exit, crossing over itself.

### D. Water, riverbed and effects — `src/art/water.tsx`

```ts
export const EnvBack: React.FC<{c: Cam; t: number; xray: number}>;   // renders its own <Layer>s behind the fish
export const EnvFront: React.FC<{c: Cam; t: number; xray: number}>;  // in front of the fish (near pebbles, motes)
export const FishShadow: React.FC<{t: number}>;                      // contact shadow on the bed (fish-local)
export const WaterRush: React.FC<{at: P; dir: number; t: number; t0: number}>; // the burst when the head clears (t0)
```

- A clear freshwater stream bed seen at the fish's level: teal-green water lighter toward the surface, soft light shafts
  and caustic shimmer from the upper left, drifting motes at several depths (parallax), a sandy/gravel bed the fish rests
  on (belly at y ≈ 12.4) receding to a hazy far bed, a few out-of-focus pebbles and water plants for depth. Calm, not
  busy; it must keep the slate eel and the olive fish readable. With `xray` → 1 it all fades to the X-ray darkness
  (`xrayBg0/1`; no grid). `WaterRush`: a short swirl of bubbles and turbulence lines around the gill as the head pops
  free, lasting ≈ 0.5 s.

### E. Sound — `tools/make_audio.py`

Synthesised (no samples, no music bed), placed from `audio/cues.json` (`EV`, `T` and 100 Hz signals: `slide`, `out`,
`gill`, `swim`, `xray`, `cut`, `translucent`, `logw`), regenerated with
`source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=<scratch>/ec.cjs && NODE_PATH=source/node_modules node <scratch>/ec.cjs audio/cues.json`.
Subtle underwater ambience throughout (muffled low wash, faint bubbles, a soft current), restrained effects: the gill
beats (soft wet flutter), the eel sliding inside (muffled squeezing that follows `slide`), the X-ray (a faint electrical
hush), the rewind (a quick reversed whoosh), the slip through the gill and the poke out, the curl tightening, **a short
water rush when the head clears (EV.release ≈ 20.78)**, the swim strokes, the tail's close whoosh past the lens at the
end (it must flow seamlessly into the start: the mix loops). Voice: `audio/narration/FGW_Eel_Escape_narration_V1.wav`
(48 kHz mono, sample for sample; gentle compression and a limiter only). Targets: voice ≈ −16 LUFS, mix ≈ −14 LUFS
integrated, true peak ≤ −1.5 dBTP (4× oversampled), effects 10–14 dB under the voice. Write
`source/public/audio/<name>.wav` (48 kHz 24-bit stereo), `audio/mix/FGW_Eel_Escape_<NAME>.wav`,
`audio/mix/mix_measure_<name>.json`, `audio/sfx_log_<name>.json`. Model it on `../bone-glue/tools/make_audio.py`.

## Testing (every art builder)

    cd /home/user/Youtube-videos/Future_Got_Weird/eel-escape/source
    export TMPDIR=<scratch>/<you>; mkdir -p $TMPDIR
    npx remotion still src/test/<name>.entry.tsx <CompId> $TMPDIR/out.png --props='{...}' --log=error

`<scratch>` = `/tmp/claude-0/-home-user-Youtube-videos/ca3a682e-48b2-5027-8af2-434fb6f4565d/scratchpad`. Look at every
render (Read the PNG). Check at full size AND at phone size (downscale to 360×640 with ffmpeg or PIL). Iterate until
it is genuinely good. The machine has 4 cores shared by several builders: render one still at a time; never render a
video. Keep only small images. Run `npx tsc --noEmit -p .` clean before you finish. Do not edit `story.ts`, `eel.ts`,
`anatomy.ts`, `camera.tsx`, `Root.tsx`, `palette.ts`, or another builder's files; do not commit.

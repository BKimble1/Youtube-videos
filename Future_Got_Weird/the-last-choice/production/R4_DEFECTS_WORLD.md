# R4 defect list — WORLD kit (KIT-WORLD)

Owner of `source/src/r2/world/*`, `fx/*`, `shots/A/*`. Evidence sheets: `qa/r4/world/`. Method: headless probes of the real source
(esbuild + react-dom/server with the engine's `sceneItems` hooked, so every shot's real item list is available at any frame;
scripts in the agent scratchpad, summarised below), the R3 film's frames (`ffmpeg`, frame-difference pop detector), then frames
rendered from the current source. Observed visual failure and source cause are kept separate. Status: **WIP — see the last section.**

## 1. THE FLOATING ROCK (audit of all substantial rubble)

Geometric scan: every mesh item every shot builds (101 shots, one sample per 0.5 s, 28 MB of records), lowest vertex against `groundH`
over the footprint; for chips (`chips3`) the real landing computed with the shot's own options.

| # | what | where (world m) | owner file | error | seen in (film s) | cause | fix | status |
|---|------|-----------------|------------|-------|------------------|-------|-----|--------|
| R1 | **`rfloor_3`, the hovering slab (very likely the owner's "floating rock")**: a 5.6 × 4.1 m slab with nothing under it | (−16.7, 4.8, −8.0); lowest edge **2.68 m** above the rubble bed | `world/set.tsx` (west ruin "hanging floors") | +2.68 m | B5a–B6b (24–35), C1–C6d (36–59), D1-1 (60–63) and distant: up to 600 px radius in C2_pov (38.5–40.0) | the four floors were placed at an absolute height `1 + rnd·2.5` m, whatever the ground under them is (0.5–1.7 m) | `seatSlab`: low edge 12 cm into the bed; lean capped (raised end ≤ 1.2 m); the raised part carried by stacks of broken pieces (`rfsup_*`) standing on the ground; slid until clear of each other and of the ruin's columns | fixed, numerically verified (below) |
| R2 | `rfloor_0` | (−17.2, 3.7, 10.5) | same | +1.51 m | B6a, C4a, C6a/b (30–55), D2–D4 | same | same | fixed |
| R3 | `rfloor_2` | (−23.1, 2.8, −9.0) | same | +0.33 m | B5–D4 | same | same | fixed |
| R4 | `rfloor_1` / `rfloor_2` interpenetrated (8 vertices of one inside the other); `rcol_0` stood through `rfloor_0` | (−24, −6) / (−17, 11) | same | — | same | independent random placement | conflict test (`slabConflict`) slides a floor along its length until nothing of one is inside the other | fixed (0 vertices inside) |
| R5 | `rslab_19` (ridge slab) low edge hung 0.57 m over a dip | ridge | same | +0.57 m | ridge shots | `y = ground(centre) − 0.45` for the whole width | settled into the dip (contact-edge gap 0.20) | fixed |
| R6 | every vehicle beyond 120 m (cars 0.32 m, box trucks 0.55 m) stood on invisible stilts: the far mesh (`vehicleFar`) has no wheels and starts above the road; the wheels popped in at the LOD switch | all STREET_OBSTACLES | `world/props.ts` | +0.32 / +0.55 m | A1, F1, every wide | far mesh simplification | dark under-body block from the road up (the wheel line) | fixed |
| R7 | thrown/landing **chips** came to rest at one fixed height for the whole flight: up to **+2.9 m (hovering) / −3.4 m (sunk)** on the crater floor and rim, ±0.9 m on the ridge for the walking grit; 2 emitters had no `ground` at all and fell through the street (D2-7a `d2shield_ch`, D3-9 `d3kill_ch`: −46…−59 m) | crater (45–65, −10…10), ridge (0–10) | `fx/particles.tsx` | see left | D2-3b…D2-7b, D3-3b…D3-11e, D4-8, B, C, D1 | `ball3` landed on the plane `ground` given at the launch point | terrain-aware landing by default (`terrainOf`: `groundH`, offset so the caller's `ground` holds at the launch point; D3's opt-in `groundFn` kept); no `ground` → bare terrain | fixed: 655 of 676 emitters now rest within 0.15 m of the terrain (the 21 left are A1 chips still falling at the sample time) |
| R9 | **A1's blow-out (E2, 2.9 s) and truck blast (E3, 5.6 s) left 18 + 18 shards hanging in the air** at 64.6 m and 3.3 m (they "landed" at the height they were launched from) | FN11 facade (284, 64, −16); truck (405, 3.3, −12) | `fx/impact.tsx` `blast()` | +64.5 m / +3.3 m | A1 2.9–6.6 s | the blast used its own height as the landing plane when no `ground` was given | debris and sparks take the caller's `ground` (else bare terrain); a literal `ground: 0` means street level (bare terrain) | fixed (the E2 shards are still falling at the sample time: 3.6 s fall) |
| R8 | chunks of masonry (≥ 0.18 m: the blasts' concrete, A1's wall debris) melted away where they lay after `life` + 0.8 s | all blast debris | `fx/particles.tsx` | — | D2-3b…, D3-11a…, A1 | fade applied to every chip | chunks ≥ 0.18 m stay as rubble; grit and splinters still fade | fixed |

Checked and fine (lowest vertex, contact edge buried or on a stated support): `rch_/sch_/cch_/sch2_` chunks (all contact edges ≤ 0.12 m), piles, `cplate_`,
`sfacade_`, `rbeam_`, the van (−0.28), death slab (−0.40), taxi, bus, crater car, girder columns, `d1_cover` (−0.29), `d4_h2slab` (−0.12), `cWall*`, `bSup*`
(B: −0.04…−0.22), `bSlab` (−0.06). A1's fallen wall pieces (`a1peel_1/2`: lowest vertex 0.58/0.64 m, stacked on `a1peel_0`, which tops at 1.8 m) are a stack, not hovering.
Not mine and left to their owners: `bCh1`/`bCh2` (B's animated chunks, 0.2–0.4 m above the ground while B1/B2 move them: intended motion).

## 2. Opening A1 (0:00–0:06.6)

| # | observed | cause | fix | status |
|---|----------|-------|-----|--------|
| A1-1 | **window pattern of a whole building changes in one frame** (R3 f159: the dark brick tower right of the burning block, 6 % of the frame: big dark window pairs → small grid with lit windows) and 67 other buildings (skyline towers 2→1 at 600–1300 m) | `lodFor` by the camera's distance now: lod 0 draws each window, lod 1 pairs, lod 2 a ribbon every third storey; the camera travels 150 m | `SetOpts.lodCams`: A1 passes its path (23 samples); each building keeps the finest level any of them asks for. +30 % faces (7.9k → 10.4k) | fixed: **0 LOD events** in 199 frames (R3: 71) |
| A1-2 | **a whole smoke column vanishes in one frame** (R3 f161, upper left: the plume above the tilting tower; also f165) | `plumeItem` skipped a plume when its four SPINE probes were behind buildings; its billows are up to 58 m wide | probes also at ±1.1 radius to each side and above | fixed (no plume in/out events in A1 but the intended E1–E3 ones) |
| A1-3 | smoke columns change tone/caps as the camera closes in | `detail` tiers (0/1/2) switched at 7 px and 45 px of billow radius: the whole column's body flipped from shade to lit+shadow and 30 % more caps appeared in one frame | tiers fade in with the billow size (`dK`, `capFrac`) | fixed (to verify in frames) |
| A1-4 | wires, rebar and bent steel pop in/out at 160 m / 330 m | hard distance cull of thin sprites; steel also tied to `lod < 2` | `polyline3 fade`: opacity 1 → 0 over the last 50 m / 90 m | fixed |
| A1-5 | specks (chunks, cars, hydrants) pop out below 3 px | `minPx` cull | fade over the next 3 px | fixed |
| A1-6 | "dark round blob beside the beige tower at 0.9–1.1 s" | **could not reproduce a pop**. In R3 frames 16–48 the round dark form is the top of a smoke plume between the failing tower and the glass tower, stable in every frame; what changes at 0.72 s (LOW_HIT) is the collapse dust starting (pale puffs on the tower at its hinge). The R3 pop detector finds only E2 (blow-out, 2.9 s), the B90 LOD (5.3 s), E3 (5.6 s) and the cut | the plume tweaks above (A1-2/3) + overlapping billows (spacing 0.9 R) make it read as smoke, not a ball | partly (see limits) |

## 3. Final pullback F1 (3:29–3:51)

| # | observed | cause | fix | status |
|---|----------|-------|-----|--------|
| F1-1 | **~100 buildings pop in at once at 3:42 (T 221.97)** when the crane rises past 26 m | `cam.y < 26` dropped every short block behind the frontage unconditionally | during E2/F1 (`lodwin.ts` window) no shortcut; elsewhere a block is dropped only if a 5×5 roof grid + mid-height wall probes are all behind opaque frontage boxes | fixed: 0 building in/out events in F1 (R3: 90 in) |
| F1-2 | 35 building LOD switches, 4 vehicle, plus steel and wire pops | as A1-1/A1-4 | `world/lodwin.ts` (E2 → F1 window: `camF1` sampled every 0.5 s, read from `shots/EF/camera.ts`, not edited) | fixed: building/vehicle LOD events 0 |

## 3b. Every other shot (building LOD flicker)

Headless pass over all 106 shots (camera at 5-frame steps, the per-frame distance rule): **22 shots flipped a mid-distance building
between two window patterns** (1–10 times: handheld drift or a short move across the threshold; the worst, D1-2, 10 flips in 2.5 s;
others B3, B5b, B6a, C1, C3, C4b, C6c2, D1-2b, D1-7b, D3-5/6/7a/10c/11a, D4-1a/2a/5/6a/8). `world/lodwin.ts` now carries the camera
boxes of those 20 short shots (baked from their own cameras, ±4 m) and the rule never gets coarser than the distance now:
**0 LOD switches in all 106 shots** (`tools/r4/world/lodev2.tsx`). If a section later moves its camera outside the box the old per-frame
rule applies again for that part (regenerate with `camscan.tsx` + `genbox.mjs`).

## 4. Smoke, dust, fire

* `dust3` was at full density on the contact frame itself (0.1 s ramp) and covered the foot/fist that had just met the ground: it now builds over ~0.25 s starting 0.04 s after t0.
* Largest dust in use: D3's landing wave (`d3wave`: 26 puffs, r up to 3.4 m, 0.72) and A1's wall landing; both far from the first-contact frame after the ramp, but D3 should look at the density (their call sites).

## 5. Set objects the fights rely on (truss, beams, van, cover, wrecks)

All world-owned pieces (girder + columns, taxi, van + interior, death slab, bus, crater car, wrecks, vehicles, columns) are single static items in `setItems`: identical centres in all 101 shots (spread 0.00 m). The van's two LODs differ only in strips (centre differs by 0.17 m = mesh centre of whole vs split, same transform).
`d1_cover` (47.7, 1.5, 3.3) and `d4_h2slab` (27.7, 0.2, 3.9) are drawn in 92 shots each at the same place (the slab's 0.21 m y-spread is D4's tip). D2 redraws the girder with a decaying shudder (`girderShudder`, → 0 after the crash); D3/D4 see the set's. No relocation found.

## 6. Remaining / not verified

(filled in at the end)

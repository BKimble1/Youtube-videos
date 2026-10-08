# Path legibility: final fix and implementation plan

Video 02, "How Cameras See Around Corners". Synthesis of the five path-fix prototypes (geometry, inset, floortrace,
camera, hybrid) and the three judges (physics, phone viewer, continuity/cost), written for the merged tree (all nine
scenes merged at e20eb25, sound pass fdfe2d8, cut sheet 481e5d1). Supporting files are in `qa/path_legibility/`.

## 1. Decision

One honest room, plus a plan card. Every scene that draws the room changes in a single pass.

| Element | Final value / rule | Was |
|---|---|---|
| Partition height (drawn and research) | **2.0 m**, set in `research/geometry` and synced. Partition.tsx already documented 2 m. | 1.7 m |
| Light-path plane (sensor S, wall spots W, his point H) | **0.95 m**, the chibi's chest, also set in research (`sensor_h`, `torso_h`). Plan x and z are unchanged. | 1.2 m (the chin of a set-scaled rig) |
| Rig scale | **`rigScale = heightM · ppm · heightScale / 440`**: rigs, the plant and S9 `walkAt` follow the set's height scale, and `depthSort` billboards match. A 1.7 m person is 1.7 m of set at every tilt. | full height at every tilt (2.39 m of set at tilt 0.4) |
| Raised camera | **`RAISED_TILT = 0.10`**. New shared framings `CAM_RAISED`, `CAM_PATH` (card on the right), `CAM_PATH_SIDE` (cards on the left). | 0.4 |
| Light rule (kit, asserted at module load) | **`assertAroundTheEnd`**: a leg may go behind or come out from behind the partition only by its far-end or near-end vertical edge, at least 24 screen px below that end's top corner. It may never cross the top band. No visible far-side light may sit above the top edge. S→W legs stay 18 px clear. | each scene had its own clearance test, and some allowed light over the top |
| Occlusion of overlay light | **`hiddenByPartition` / `partitionHides`**: the partition as drawn (both faces, arched top band, end faces, ink outline), plus `figuresHide` (Cast2). A W→H leg therefore ends at his outline. | near-face polygon only, so light was painted on the top rim and across his chest |
| Arrival cue | `rimFlash`: a crisp saffron rim on his wall-side outline when the pulse reaches him, plus the existing flinch. | dashes drawn across his face |
| "Seen from above" card | **`PlanCard` 480 × 408 px** (a quarter of the frame width), top right (`PLAN_CARD_RECT`). It shows the same paths on the same schedules: S1.4–S1.5, the S1.7 tape, S3.1, S9.2. It is never in S9.3, R4, or alongside the readout inset. | none |
| Gap in the room | `GapMarker`: an ink dashed threshold with a pale patch on the floor, plus a "gap" label placed clear of the tripod. No saffron construction aids. | white dashed pane |

Measured results (from `qa/path_legibility/rule_check.ts` on the proposed kit, screen px at zoom 1.25):

- **Problem 1 (over the top) is fixed in the room view.** The W3→H leg goes behind the far end **313 px below its top corner**. It comes out at the near end **53 px below that corner**, where his body covers it. W4: 39 px. No leg crosses the top band, and no light shows above it.
- **Problem 3 (towering) is fixed.** At tilt 0.10 he is 1.7 m against a 2.0 m screen. The far panels stand clearly above both heads: the far corner is 59 world px above his hair. People are at screen scale 1.50 in the S1.4 path shot. The baseline raised shot was 1.43, so they are 5% *larger*, and the comedy faces keep their size.
- **Problem 2 (gap sliver) is fixed on the card.** The room slot is 58 px wide (the baseline was 44) and its floor 123 px deep. The card shows the 0.65 m gap at **142 px**, with the partition running off the card's bottom, so the only end in view is the one the light goes round.
- **Physics is unchanged.** Plan x and z are untouched. Every path stays a straight segment between layout points, and S, W and H share one height, so the drawn 3D lengths equal the plan lengths. Delays, arcs and every `pathSchedule` are unchanged. `geometry_check.py` with the new heights still passes **71 checks with 0 failures**. The 3D sight line from the sensor to the top of his head meets the screen at 1.22–1.39 m, below its 2.0 m top.

### Why this and not the alternatives

| Option | Taken | Rejected |
|---|---|---|
| hybrid | The low raise, the 2 m screen, rigs on the set's height scale, and the far-end check idea (extended here to both going in and coming out). Porting the S7 check rather than silencing it. | Changing only `src/data/layout.json` (sync_layout.py reverts it). The see-through partition in S1.7 (contradicts C04). `console.warn` in S2. The floor double-arrow tangled with the tripod. RAISED_TILT 0.12: W4 fails at 16 px and the S2.2 bounce point sits under the far edge. |
| geometry | `rigScale` (room.ts, depthSort, plant, walkAt). The 0.95 m light plane. The S9 push fixes (hands at 0.98/0.84 m, PUSH_X refit, framing for the pushed 2 m top). The S1.2 tap and stand-over-checker hunks as a fallback. | The silent `LAYOUT` override (two layouts that disagree). Tilt 0.4 (legs come out over the arched top). `entersFarEnd`, which allowed the leg to come out over the top. The tall dashed pane. |
| inset | `PlanCard` (enlarged, plus `PlanTape`), synced to the room's schedules, in S1.4–S1.5 and S3.1. In S9 only for S9.2. | The S9.3 card (it falls inside R4 and next to the readout inset, two plan views at once) and the `CARD_IN_R4` flag. Leaving the room view itself wrong. |
| floortrace | The idea of marking the gap on the floor, but in ink. | Saffron plumb lines, floor marks and lit floor (they read as light running along the floor). It leaves problems 1 and 3. |
| camera | The principle of framing from the projected subjects. | The custom higher raise (the tall "^" is the strongest "over the top" picture). The extra S9 camera moves. |

**The cost judge's objections, and how they are met.** The judge rejected global changes to the partition height,
the light plane, RAISED_TILT and the rig scale. These are still made globally, on purpose, because "the light goes
around the end" is the film's point. A scene-local fix would leave S2, S3, S7 and S9 contradicting S1, and the
judge's own must-fix asks for one raised look across all those scenes. Each concrete break the judge found is answered:

| Break | Answer |
|---|---|
| S2.2 mirror covered | Restaged (§4 S2): his mirror image is drawn where the camera sees it; face 99% visible. |
| S2.4 clearance and timing-bin throws | Re-planned (§4 S2) with a feasible triple. Both asserts still throw; the clearance assert is replaced by the stricter kit rule. |
| `sync_layout.py` revert | The change is made in research, then synced. |
| S7 throw | Replaced by `assertAroundTheEnd`; it passes. |
| Sound cues | Re-exported and diffed (§5); most cues are unchanged by construction. |
| R1 and R4 | `inserts.json` is empty, so nothing generated is lost. The card stays out of R4's frames. |

Every merged room scene is re-reviewed in one pass, and the cut sheet is redone.

## 2. Execution order (gates in bold)

Phases 2–4 go on one branch and land as one change. Between phase 2 and the end of phase 4, scenes S1, S2, S3 and S7
throw at module load, because their old clearance tests are still in place. This was checked: with only the kit and
layout changed, S1, S2, S3 and S7 throw, while S4 and S9 load.

1. **Baseline.** Render the verification frames (§5) from the current tree into `qa/pathfix_r0/`, and keep `audio/sfx/v2/cues.json` as committed.
2. **Research and sync (§3.1).** Gate: `geometry_check.py` reports 71 checks, 0 failed. `git diff source/src/data/layout.json` shows only `occluder.height`, `sensor.h` and `hidden.h`.
3. **Kit (§3.2–3.9).** Gate: `npx tsc --noEmit -p .` passes. `rule_check.ts` prints the table in §6.
4. **Scenes (§4)**, in the order S1, S3, S9, S7, S2, then S4 for review only. Gate: `node tools/collect_sfx.mjs` loads all nine scene modules, and no assert has been downgraded.
5. **Verification (§5):** stills, review sheets, cut sheet r1, cue diff, and the sound pass if needed. Then commit.

## 3. Shared-file changes

### 3.1 Research (the single source of truth)

- `research/geometry/geometry_check.py`
  - Set `OCCLUDER_HEIGHT = 2.0`, `SENSOR_HEIGHT = 0.95` and `TORSO_HEIGHT = 0.95`.
  - Change the comment to: "the plan is a horizontal slice at ~0.95 m: the sensor on a 0.95 m tripod; the path meets the hider at the drawn figures' chest (the cast are chibi-proportioned)".
  - Run `python3 research/geometry/geometry_check.py`. Expect 71 checks and 0 failed. It regenerates `layout.json` and `geometry_preview.png`.
  - Verified in scratch: only the heights and the four 3D-check detail strings change.
- `research/geometry/NOTES.md`
  - Table: partition height 1.7 → **2.0 m**. S_A h 1.2 → **0.95 m**. H_A becomes "light-plane point at his chest, h 0.95 m (body radius 0.22 m, head top 1.75 m)".
  - Line 57 becomes: "3D check: the sight line from the sensor (h = 0.95) to the top of the hider's head (1.75 m) meets the partition at a height of 1.22–1.39 m, below its 2.0 m top."
  - Add one line noting that the change from 1.7 to 2.0 m and from 1.2 to 0.95 m was made for drawing legibility. The plan geometry and all distances are unchanged.
- `python3 tools/sync_layout.py`, then check that `source/src/data/layout.json` changed only in those three fields.
- `research/claims.csv` C01 still reads "71 checks pass". No edit is needed, but re-read C01, C04 and C05 against the new NOTES wording.

### 3.2 `source/src/lib/room.ts`

Apply `qa/path_legibility/room_ts_reference.diff` with `cd source && patch -p1 < ../qa/path_legibility/room_ts_reference.diff`. It dry-runs cleanly on the live file, and `tsc` passes on the whole tree with it. Contents:

- **Header doc.** From a front-left camera the opening lies behind the far end. The doc now points to the new rule and test.
- **New block, inserted after `visibleRuns`:**
  - `PARTITION_ARCH`, `PARTITION_FOOT_H`, `partitionTopH(z)`.
  - `hiddenByPartition(p, s, {layout?, padPx = 3})`: a ray test against the drawn solid (arched top, both faces, end faces, plus the outline pad). Points on the camera side are never hidden.
  - `partitionHides(s, h, opts)`: a `HiddenTest` for `LightPath`, `ScatterFan` and dots.
  - `partitionCrossings(a, b, s, {zoom})`: visible spans, plus each `in`/`out` crossing with its edge (`far`, `near` or `top`) and `belowCornerPx`. Also returns `overPx` (visible far-side light above the top edge) and `frontClearPx`.
  - `assertAroundTheEnd(label, polylines, s, {zoom, minBelowCornerPx = 24, minFrontClearPx = 18, allowFront?})`. It throws with a per-leg report. Only legs with no crossing (S→W) must keep 18 px clear in front; a leg that comes out by the far end runs beside it by construction.
- **`rigScale(s, heightM)`** is new. `rigAt` uses it. The doc gives 1.31 at tilt 0, 1.20 at 0.10 and 0.66 at 0.45, and notes that the chest is at 0.95 m.
- **`depthSort` `screenRect`:** upright width = `w · ppm · max(height, 0.3)` and height = `height · ppm · heightScale` (geometry's hunk).
- **`TOKEN_H = LAYOUT.sensor.h`**, so the token fades in on the chest.
- The `uprightBox` doc is updated.

### 3.3 Kit components

Apply `qa/path_legibility/kit_components_reference.diff` the same way (it dry-runs cleanly). Contents:

- **`components/v02/Cast2.tsx`:**
  - `rigCovers(place, q, growPx)`: the shared silhouette approximation, replacing the private `rigHides` in S1, S3 and S9.
  - `figuresHide(s, h, figs)`: a `HiddenTest`. A point behind a figure (`p.z < fig.z + 0.05`) is hidden inside its silhouette.
  - `rimFlash(t, scale)`: a CSS `drop-shadow(-6s, -5s, 0, saffron@t)` for `<Character2 style={{...rigStyle(..), filter}}>`.
- **`components/v02/RoomSet.tsx`:**
  - `PottedPlant` uses `k = ppm · heightScale · heightM / 1.45` (geometry's hunk).
  - New `GapMarker({tilt, t, layout})`: an ink dashed threshold along the partition's line from the wall to the far foot, over a pale patch. It shrinks with a moved layout and is gone when the gap closes.
- **`components/v02/Partition.tsx`:** `FOOT_H` and `ARCH` come from `PARTITION_FOOT_H` and `PARTITION_ARCH`, so the occlusion tests and the drawing cannot drift apart.
- **`components/v02/S9_Room.tsx`:** `walkAt` uses `rigScale` (geometry's hunk); the local `RIG_PX` is removed.
- **`lib/shots.ts`:**
  ```ts
  export const RAISED_TILT = 0.1;
  export const CAM_ROOM: Cam = {cx: 880, cy: 565, zoom: 1.2};          // unchanged
  export const CAM_RAISED: Cam = {cx: 895, cy: 455, zoom: 1.25};       // room centred: both characters, far top, W3
  export const CAM_PATH: Cam = {cx: 996, cy: 455, zoom: 1.25};         // room in screen x ~320..1350, card top right
  export const CAM_PATH_SIDE: Cam = {cx: 531, cy: 455, zoom: 1.15};    // room in screen x ~905..1855, cards left
  export const PLAN_CARD_RECT = {x: 1400, y: 40, w: 480, h: 408};
  ```
  - Derivation at tilt 0.10, in world px: her left edge 483, his elbow 1308, the partition's far top 133, her feet 772.
  - At `CAM_PATH` the partition top lands at screen y 138 and her feet at 936. His elbow is 50 px left of the card.
  - Rewrite the doc block: RAISED is a low rise on purpose. Above about 0.12, W4 and then W3 come out across the near panels' top band (see the §6 table).

### 3.4 `components/v02/PlanCard.tsx` (new)

Copy `qa/path_legibility/PlanCard.tsx`. It is the inset prototype's file, enlarged and typechecked:

- `PLAN_AREA` is 448 × 330, giving a 480 × 408 card. `PLAN_VIEW` is 218 px/m, so the gap is 142 px and a token 109 px.
- The doc is updated for the 2 m screen and the 0.95 m plane.
- New `PlanTape`: ticks every 0.29979 m (1 ns), with "1 ns" on the first complete piece in 30 px mono.
- Use path stroke 6, pulse radius 11, lane 11 and ring 34 inside the card.
- The scene hunks to start from are in `qa/path_legibility/proto_inset.diff`:
  - S1: `@@ -38`, `@@ -292`, `@@ -734`, `@@ -772`.
  - S3: `@@ -33`, `@@ -228`, `@@ -599`, `@@ -648`.
  - S9: `@@ -47`, `@@ -232`, `@@ -747`, `@@ -764`, trimmed as in §4.

### 3.5 Docs

- `KIT_API.md`: document `rigScale` and the new `rigAt` scale, the partition-as-drawn functions, `assertAroundTheEnd`, `rigCovers`, `figuresHide`, `rimFlash`, `GapMarker`, `PlanCard`/`PlanTape`, and the new shots constants. In the line "A 1.7 m person comes out at scale 1.31", add "at tilt 0; 1.20 at RAISED_TILT".
- `storyboard/STORYBOARD.md` lines 17–18 and `SCENE_BRIEF.md` lines 54–56: replace the "tilt ≈ 0.35–0.5 … clear of the screen's silhouette" rule with: "Light paths in the room are drawn at RAISED_TILT 0.10, or at tilt 0. Every leg that passes the partition goes behind its END (far or near vertical edge, ≥ 24 px below the corner), never across its top (`assertAroundTheEnd`, run at module load for every tilt the shot draws light at). Light behind the screen or behind a person is hidden exactly (`partitionHides`, `figuresHide`). The 'seen from above' PlanCard runs the same paths on the same schedule, so 'round the end, by way of the wall' reads in plan."
- `components/v02/Optics.tsx` header recipe: replace `isHiddenByOccluder` with `partitionHides(s, LAYOUT.sensor.h)` OR `figuresHide(...)`.
- `components/v02/S4_Stand.tsx` doc: "h = 1.2 m" → "h = layout sensor.h (0.95 m)". `dev/KitRoom.tsx` comments: chin → chest.

## 4. Per-scene changes

All scenes:

- Replace every local `ARCH`/`FOOT_H`/`topH`/`facePoly`/`inPoly`/`segDist`/`drawnSpans`/`rigHides` with the kit functions.
- Overlay light uses `hidden = partitionHides(s, LIGHT_H) || figuresHide(s, LIGHT_H, [her, him])`, where `LIGHT_H = LAYOUT.sensor.h`. Keep the existing stand-box test in S1.
- Every room light leg (route, pulses, race, tape stubs, fan rays) goes through `assertAroundTheEnd` at module load, over the tilts it is drawn at (e.g. `[0, .25, .5, .75, 1].map(f => f * RAISED_TILT)`) and at the settled zoom of its camera.
- Do not cherry-pick whole prototype diffs. Take only the hunks named below.

### S1 cold open (frames 0–1826)

1. **Wall pick.** `pickWall` keeps W3 (the ~7 ns the storyboard labels). It asserts:
   - `assertPath`;
   - `assertAroundTheEnd([[S, W3, H, W3, S]])` over the rise tilts at `CAM_PATH.zoom`;
   - the spot is not `hiddenByPartition`;
   - the spot is ≥ 40 screen px from her head, hair and pencil (`rigCovers(ch.place, q, 32)` is false). Measured: 62 px.

   Throw otherwise. W1 and W2 now sit behind her head at 0.95 m, and W4 behind the far edge, so there is no fallback spot by design.
2. **Cameras.**
   - The S1.4 rise: tilt 0 → `RAISED_TILT` with `CAM_ROOM` → `CAM_PATH` over RISE0..RISE_DUR.
   - S1.6–S1.7: `CAM_PATH_SIDE`. The pan is now ~465 world px; the card has already left.
   - Delete `CAM_UP` and its "rigs at full height" comment.
3. **Occlusion and arrival.**
   - The route, pulse, race and fans use the kit hidden tests, so the W→H leg ends at his outline. About 88 px of it shows (wall spot → slot) before it goes behind the far end.
   - At `VF[2]` ("reaches", ~981): `style.filter = rimFlash(tw(g, VF[2]-1, 3) * (1 - tw(g, VF[2]+6, 10)), gu.place.scale)`. Keep his worry reaction.
4. **Wall spot.** Add a lit ellipse on the wall plane at WP: 0.24 × 0.16 m, `saffronLight` fill, `saffronDeep` dashed rim, in the backdrop, popping with the diamond. This is real light, so saffron is right. It reads "on the wall", not "off her head".
5. **Gap.**
   - Replace the white dashed doorway (backdrop) with `<GapMarker tilt t={gapT} />`.
   - Put the "gap" label on the wall above the slot, with its leader ending at `(OCC.x, OCC.z0/2, LIGHT_H)`.
   - Assert that its screen rect clears the partition silhouette, her head, the wall-spot ellipse and the tripod by ≥ 12 px.
6. **PlanCard, S1.4–S1.5.**
   - Start from the inset S1 hunks, with `CARD_POS = PLAN_CARD_RECT`.
   - `CARD_IN = RISE0 + RISE_DUR - 10`, so the card is fully in before `LINE0` (the blocked line). `CARD_OUT = K.s06 - 10`, before the pan.
   - Contents, all on the same schedule as the room: the blocked ghost line and its X, `PlanRoute` with the same `routeHead`, `PlanSpot`, `gap = gapT`, `LightPath(PATH, SCHED.progress)`, and both fans.
7. **S1.7 tape.**
   - Delete the room `LightTape` across the partition. Most of the detour is behind the screen at 0.10, so no full 1 ns piece is visible in the room.
   - At `TAPE0 - 10` the PlanCard re-enters in the left column in the RulerCard's slot. The ruler's "1 ns ≈ 30 cm" moves into the card as the tick key.
   - The card draws `PlanTape([WP, H, WP], head = tape · 2.146 m)`: 7 ticks, about 7 ns. The arrival-time card ("≈ 7 ns later") stays above it, and the chip goes below.
   - In the room, the visible stubs of the detour (spans from `partitionCrossings`) glow in sync.
   - Never fade the partition.
8. **Tilt 0 (S1.1–S1.2).**
   - The sensor is now at 0.95 m. Refit the tap with reach2 so the contact error is ≤ 1 px and the readout is ≥ 90% visible. Try the top-face buttons first; the fallback is `proto_geometry.diff` S1 `@@ -483,9` (forearm behind the box).
   - If her sleeve covers the readout, take `@@ -565,11` (the stand always paints over the checker) and keep the module-level sort assert.
   - Check that the S1.2 lit wall patch (h 0.58–1.32 m) still shows ≥ 0.3 m between her head and the partition.
   - Check that the far panel's top clears the S1.2 push framing. It is about 23 px from the top at `CAM_ROOM`.
9. **SFX.** Expected unchanged: PATH, SCHED and the cue words are unchanged.

### S2 mirror and wall (frames 1826–2874)

**S2.2, at `RAISED_TILT`.**

- The pulse S→SPEC→H runs at `LIGHT_H`. SPEC stays x = 2.139, the physics. At tilt 0.10, SPEC sits under the far end's ink outline: the pulse goes through the slot and disappears at the mirror.
- Put the "ting" glint on the visible glass just left of the far edge, around `(1.99, 0, LIGHT_H + 0.1)`.
- Assert `assertAroundTheEnd([[S, SPEC, H]])`.

**S2.2, the mirror and the reflection.**

- Enlarge the glass to `MIR = {x0: 1.95, x1: 2.75, h0: 0.9, h1: 2.3}`. Keep the check that SPEC is inside [x0+0.1, x1−0.1].
- Draw **his mirror image where the camera sees it**:
  - his rig at `rigAt(H.x, -H.z, RAISED_TILT)` (H reflected through the wall z = 0), at his own scale, mirrored about its x;
  - clipped to the glass rect, painted in the backdrop, so the partition and the people paint over it;
  - the duck mirrored in sync.

  This is exact for a planar mirror under this projection. It replaces "chin at the specular point" (`REF`, `REF_SCALE` 0.94). That placement would put half his face behind the 2 m screen at any low tilt.
- Measured at 0.10: **face 99% visible, chest 69%, belly 45%.** The partition cuts across his reflected hips.
- Assert that the face is ≥ 90% visible, sampling `hiddenByPartition` on the virtual points as `rule_check.ts` does.
- The storyboard's "over the checker's shoulder we see his reflection" still holds. The pulse still shows where the sensor sees him.

**S2.2 framing.** The glass top is at world y ≈ −87 and her feet at ≈ 772, so `CAM_A` is about `{cx: 900, cy: 345, zoom: 1.2}` with zoom ≤ 1.2. Reframe `CAM_B` on the glass and on him. Check "friend" and "busted" around 2150 and the duck around 2170.

**S2.3.** Re-check that the magnifier lands on bare wall, clear of him and the 2 m screen.

**S2.4, the room at tilt 0** (the room view, `CAM_ROOM` family with the card column; not raised).

- **Why tilt 0.** At 0.10 no head path both obeys the rule and has a visible wall spot (rule_check §3: 0 head candidates). His head is above the near panels' tops on screen, and wall spots right of the screen are behind him. At tilt 0 there are 234.
- **Heights.** With set-scaled rigs the drawn body points are the true heights: head 1.45, shoulder 1.13, feet 0.04 m. Drop the "effective height" construction and assert |eff.h − trueH| < 0.02.
- **Wall spots.** Re-pick `PARTS[].wall` with the search in `rule_check.ts` §3. Spots must be visible, clear of both people, ≥ 0.3 m apart, and within one 250 ps bin.
  - Example found: head → (2.02, h 0.53), shoulder → (1.55, h 1.67), feet → (2.07, h 1.13). Each path is 2.445 m, spread < 1 mm.
  - Choose for legibility. Head spots are low (h 0.2–0.8 m) by the gap.
- **Asserts.**
  - Keep the timing-bin assert (line ~252) as a throw.
  - Replace `screenClearance`/`MIN_CLEAR` (line ~243) with `assertAroundTheEnd([[eff, W, S3D]], viewAt(0), {zoom})`, also a throw.
  - Never `console.warn`.
- **Display.** The paths start at his outline via `figuresHide`. The origin markers stay where each path leaves his body.
- **Cut to S3.** S2 ends at tilt 0, and S3 opens at tilt 0 and rises (below), so the projection does not jump at 2874.

**SFX.** Re-export. The blend pulse speed uses `L_MAX`. The mirror cues use plan lengths and do not change.

### S3 the faint echo (frames 2874–3954)

1. `pickWall` as in S1 (W3), asserted over the rise tilts at `CAM_TRIP.zoom`.
2. **Opening.** At 2874 the tilt is 0, matching S2's last frame. It rises to `RAISED_TILT` during the existing push, PUSH0..PUSH0+PUSH_DUR (~2878–2934), before the dots launch at `K.sensorA` (2943). The route preview at 2898 is asserted at those tilts.
   - Alternative: a straight cut to the raised view. Both framings are shared framings.
3. **`CAM_TRIP`.** Rebuild it with `frameRect` from:
   - both characters head to feet, W3 and the far top corner;
   - excluding the card column (screen x ≥ 1380).

   Target zoom is about 1.3–1.35. Keep the rig screen scale ≥ the baseline's.
4. **Dots, StopRings and fans** use the kit hidden tests. The cluster slips behind the far end at the slot and vanishes at his outline: never in his mouth.
   - On "person" (`VF[2]`, ~3001): `rimFlash`, plus the StopRing round him.
   - The "wall" tag goes above-left of the spot (`proto_hybrid.diff` S3 `@@ -594`).
5. **PlanCard, S3.1.**
   - Start from the inset S3 hunks: in at `ROUTE0 - 14`, out at `PAN0 - 9`.
   - Width ≥ 420 px (480 preferred), placed below the "slowed down · illustrative" chip.
   - Re-anchor the "person" tag so it does not overlap the card. Assert ≥ 20 px gaps between the card, tags, chip, tally and rig boxes.
   - Contents: the same 24 `dotAt()` dots (lanes × 0.5), the StopRings and the fans.
6. **S3.2.** `CAM_SIDE` → `CAM_PATH_SIDE`.
7. **SFX.** Expected unchanged.

### S4 geometry (frames 3954–5692): review only

- The opening room frame shows the 2 m screen.
- During the fold the rigs shrink with the set: about 0.66 scale when the fade starts at tilt 0.45. Tokens fade in at the chest, because `TOKEN_H` is now 0.95.
- `S4_Stand` puts the sensor at 0.95 m.
- No light is drawn during the fold; its pulses run after `FOLD_END` in plan. Nothing to assert.
- Review 3954–3962 (cut), 4060, 4140 and 4200.

### S5, S6, S8: no change

S5_Board reads `sensor.h` only at tilt 1, where the height scale is 0. S6 is plan only. S8 has its own projection. Confirm that the cut frames 5688–5700, 7100–7112 and 10143–10155 are pixel-identical to r0.

### S7 results (frames 8798–10147)

1. **Path check.** Delete `FACE_POLY`, `hiddenByDrawn`, `drawnSpans` and `PATH_CLEAR_PX` (lines ~158–251).
   - Set `LEG_SPANS = PATH3 legs → partitionCrossings(a, b, VS, {zoom: CAM_RAISED.zoom}).spans`.
   - Call `assertAroundTheEnd('S7 W3 round trip', [PATH3], VS, {zoom: CAM_RAISED.zoom})`, as a throw.
   - Measured: the W3→board leg goes behind the far end 313 px below the corner and comes out at the near end 53 px below it. About 32 px of it is visible before the board's left edge, so the fattening return is seen leaving the board.
2. **Board.** The board stays at H, with its centre at `LIGHT_H` (0.95 m), 0.40 × 0.44 m. Refit his strip press (reach2), the "far" label and the fat-pulse width.
3. **Sensor.** The sensor is at 0.95 m. Refit her `BUTTON` press and `CAM_SCAN`. The 0.2 m left shift of her spot stays.
4. **Framings.** Re-derive `CAM_SCAN` and `CAM_S39` from projected subjects. Check that S7.4's walk behind the partition reads as behind.
5. **Review frames:** 9380, 9469, 9543, 9560, 9579, 9700, 9833, and the cut 10143–10155.

### S9 payoff (frames 11173–12091)

1. **Paths.** Keep PATH3 and PATH4 with SCHED3 and SCHED4 unchanged, so the bounce and echo cues are unchanged.
   - Assert both with `assertAroundTheEnd` at `CAM_W.zoom` over the rise tilts. Both pass: W4 comes out 39 px below the near corner at zoom 1.25, which scales with zoom and still passes at 1.12.
   - In the room, W4's spot sits behind the far edge. Its pulse goes into the slot and is hidden. The card shows both trips.
   - Do not switch to W2: at 0.95 m, W2 is behind her head.
2. **`CAM_W`** is about `{cx: 955, cy: 500, zoom: 1.12}`.
   - It must hold the pushed 2 m screen's top at the wall (world y ≈ 34, screen ≈ 18) and his feet at the near end (world ≈ 944, screen ≈ 1054).
   - Locked from RISE_END through R4.
   - The rig screen scale is 1.35, against 1.39 at baseline (−3%).
3. **PlanCard, S9.2.**
   - Start from the inset S9 hunks, trimmed: in at `RISE_END - 8`, out at `INSET0 - 6`.
   - Assert `CARD_OUT < INSET0 && CARD_OUT < HANDS`.
   - Delete the S9.3 card, the zoom-out and `CARD_IN_R4`, so R4's frames (11570/11621) carry no card and two plan views never share the screen.
   - The room shows the push closing the gap: the far edge meets the wall, and `GapMarker` with `movedLayout` shrinks to nothing.
4. **Push.**
   - Hand targets at h **0.98 / 0.84 m** (`proto_geometry.diff` S9 `@@ -501,11`), so his forearm never crosses his face.
   - Refit PUSH_X (start 2.30–2.38) so the reach2 contact error is ≤ 1 px over the whole push.
   - Set `STEP_PLAN_X.b = PUSH_X + 0.38`, so `STEP_CLEAR` stays one step and the S9 footstep count is unchanged. At PUSH_X 2.28 with b = 2.76 it becomes two steps.
5. **Hit cue.** `rimFlash` at `FLINCH` (VF3[2]) and VF4[2].
6. **Blocked pulses.** After the push they stop on the partition's camera-side face. These are front legs: pass `allowFront`, and the crosses stay on the face. Check that the post-thunk wobble has settled by `PULSE2`, or the stop points will float.
7. **J4.** Re-check the lean (C_SPOT): her head clears the near end and the sensor, which is now lower. Check frame 11700. An optional slow push-in after RT is allowed only if review asks for bigger faces. It is not planned: it would add a camera move and changes nothing in R4.
8. **Review frames:** 11173–11181 (cut), 11233, 11300, 11362, 11387, 11463, 11515, 11570, 11577, 11592, 11605, 11612, 11621, 11640, 11700.

## 5. Verification

- `cd source && npx tsc --noEmit -p .`
- `node tools/collect_sfx.mjs`. This bundles and runs every scene module, so every module-level assert must pass, with no warnings substituted for throws. Then `git diff audio/sfx/v2/cues.json`.
  - Expected: S1, S3, S7 and S9 unchanged; S2 possibly shifted (blend).
  - If anything changed, run `make_sfx_v2.py`, `mix_v2.py`, `check_cues.py` and `audio_qc.py`.
- Run the `rule_check.ts` command in its header. Its output must match §6.
- **Stills.** Run `cd source && node stills.mjs ../qa/pathfix_r1 <frames>` at SCALE 0.5 for all of the following. Render 831, 981, 1754, 2150, 2750, 3007, 9579, 11387 and 11605 again at SCALE=1 for 3–9× crops.

  | Scene | Frames |
  |---|---|
  | S1 | 122, 171, 674, 731, 814, 831, 859, 958, 981, 1126, 1242, 1725, 1754, 1822, 1825 |
  | S2 | 2099, 2150, 2170, 2400, 2720, 2760, 2800, 2866, 2870, 2873 |
  | S3 | 2874, 2876, 2882, 2908, 2995, 3007, 3113, 3170, 3950 |
  | S4 | 3954, 3962, 4060, 4140, 4200 |
  | S7 | 8798, 8806, 9380, 9469, 9543, 9560, 9579, 9700, 9833 |
  | S9 | 11173, 11181, 11233, 11300, 11362, 11387, 11463, 11515, 11570, 11577, 11592, 11605, 11612, 11621, 11640, 11700 |

- **Acceptance**, checked at 40% scale (phone) and on full-res crops:
  - No light on or above the partition's top band in any frame.
  - Every W→H leg vanishes at the far end by the wall and ends at his outline, with the rim flash, never across his face.
  - The partition is opaque everywhere and visibly taller than both people.
  - The card is in before the blocked line or route draws, matches the room's pulse frame for frame, and never overlaps a character, label, chip, the readout inset or R4.
  - The gap marker and label clear the tripod.
  - The S2.2 face reads in the glass.
  - The S2.4 paths start at his head, shoulder and feet and never cross the top.
- **Sheets.**
  - Regenerate the scene review sheets for S1, S2, S3, S4, S7 and S9 (`qa/scene_review/*`, via `tools/sheet.py` and `qa_dense.py`).
  - Regenerate the cut sheet as `qa/cuts/r1` (same frames as r0) and compare with r0. The S2→S3 pair (2870–2882) must read as one room at tilt 0.
- **Runway.** `source/src/data/inserts.json` is empty. When R1 and R4 are generated, render their keyframes from the new tree: R1 = S1 0..R1.to; R4 = HANDS..RT.

## 6. Numbers (`rule_check.ts`, proposed kit, zoom 1.25)

| tilt | rig scale | slot | gap floor | W3 (in far / out near) | W4 | rule |
|---|---|---|---|---|---|---|
| 0 | 1.314 | 63 px | 97 px | 360 / 161 | out near 150 | all pass |
| 0.05 | 1.259 | 61 | 110 | 336 / 107 | 94 | all pass |
| **0.10** | **1.202** | **58** | **123** | **313 / 53** | **39** | **all pass** |
| 0.12 | 1.178 | 56 | 128 | 303 / 32 | 16 | W4 fails |
| 0.15 | 1.142 | 54 | 135 | 289 / out over the top | over the top | all fail |

Baseline at tilt 0.4 (1.7 m partition, 1.2 m plane): the legs crossed the far top corner (−3 to +21 px), and the rig was 2.39 m of set tall.

Other measurements at 0.10:

| Item | Value |
|---|---|
| W3 spot | 62 px clear of her head |
| W1, W2 spots | behind her head |
| W4 spot | behind the far edge |
| Far panel top above his hair | 59 world px |
| S2.2 mirror image visible | face 99%, chest 69%, belly 45% |
| S2.2 specular point | under the far-edge outline |
| S2.4 at 0.10 | 0 head paths |
| S2.4 at tilt 0 | triple at 2.445 m ± 0 mm |

## 7. Risks and fallbacks

1. **In the room, most of the W→H leg is now hidden.** It goes from the slot behind the far end and stays hidden until his outline. This is honest, but "around the end" in the room view rests on three things:
   - the visible slot crossing;
   - the rim flash;
   - **the PlanCard**, which must be in before the route draws and must stay at 480 px.

   Review question, sound off: "where does the light go?" If viewers answer "through the screen", lengthen the card's lead-in and give the slot crossing a brief glow. Never draw hidden light over the screen.
2. **Re-review load.** Six scenes are affected: S1, S2, S3, S4 (fold), S7 and S9. The S2 sound may shift. The cut sheet must be redone. This was accepted in exchange for one consistent room.
3. **S2 restaging.**
   - S2.2's reflection now follows camera optics instead of the specular point. The director may want to keep "where the sensor sees him", but at any low tilt the 2 m screen would cover about half his face.
   - S2.4 moves to tilt 0. This is an exception to "raised whenever paths are drawn"; the new rule allows it.
   - If S2.4 must stay raised, `RAISED_TILT = 0.05` is the global fallback. All legs pass with larger margins (W3 near-end exit 107 px), and S2.4 becomes feasible in the raised view, but only with head spots at the base of the wall near the gap. The rise is then barely perceptible.
4. **The low raise reads less "from above".** The card provides the top-down reading.
5. **Tight frames.**
   - S1.1 at tilt 0: the far panel top is about 23 px from the frame top.
   - S9 `CAM_W`: the pushed screen top is about 18 px from the frame top.
   - The S1.6 pan is longer.
6. **Research honesty.** The tripod is now 0.95 m, and the path meets the hider at 0.95 m, the chest of the drawn chibi, which is lower than a real 1.7 m adult's chest. The plan slice and every claim are unchanged. State this in NOTES.md.
7. **Wobble.** `hiddenByPartition` tests the partition at rest. Light must not be drawn while it wobbles: the S1 thunk comes before the route, and the S9 post-push wobble must settle before PULSE2.

## 8. Judges' must-fixes: where each is handled

| Must-fix | Where |
|---|---|
| Full-silhouette occlusion (top band, outline) | `hiddenByPartition` / `partitionHides` (§3.2), all scenes |
| Check going in AND coming out, in S1, S2, S3, S7, S9 | `assertAroundTheEnd` (in, out and over-the-top) at module load, all five scenes |
| No translucent partition | S1.7 tape moves to the card; `partitionOpacity` not adopted |
| Rigs, plant, walkAt on the set's height scale; screen visibly taller | `rigScale` plus the 2 m screen (§3.2–3.3) |
| One source of truth for heights | research → `geometry_check` (71 pass) → sync (§3.1); no override |
| Light visibly reaches him | `rimFlash` at the hit, plus the card's pulse |
| End the leg at his outline | `figuresHide` |
| S2 asserts never downgraded; one raised camera everywhere | §4 S2; shared `RAISED_TILT`/`CAM_*` |
| No saffron construction aids | `GapMarker` in ink; floortrace aids not adopted |
| (viewer) Characters ≥ baseline size | S1 +5%, S9 −3% (CAM_W must fit the pushed 2 m top); S3 to be checked |
| (viewer) Push forearm crossing his face | hands at 0.98 / 0.84 m |
| (viewer) Light at the chest, not the mouth | 0.95 m plane |
| (viewer) Wall spot reads on the wall | lit wall-plane ellipse; W3 asserted ≥ 40 px from her head |
| (viewer) Gap marker clear of the tripod | label rect asserted; the card carries the gap |
| (viewer) Never two plan views in S9 | card out before INSET0; no S9.3 card |
| (cost) Re-validate on the current tree | the kit diffs dry-run cleanly on e20eb25+ and `tsc` passes |
| (cost) Bundle loads with S2 and S7 asserts throwing | replaced by stricter throws, verified by `collect_sfx.mjs` |
| (cost) Cue re-export and remix | §5 |
| (cost) R4 keyframes free of overlays | no card in S9.3 |
| (cost) Re-review windows and cut sheet | §5 sheets, `qa/cuts/r1` |

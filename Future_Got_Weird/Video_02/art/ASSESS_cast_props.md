# Art batch audit: cast and prop reference sheets (A01–A04, A09, A14–A16)

Audit date: 8 Oct 2026. Scope: the eight `reference_only` sheets in `art/incoming/`, checked against the approved code rigs
(`components/Character.tsx`, `cast.ts`, `components/v02/Cast2.tsx`, `HandheldSensor.tsx`, `Tokens.tsx`,
`DeliveryBot.tsx`, `Warehouse.tsx`) and the scene copies that exist so far (`work/S1,S3,S4,S6,S7`). The code rig is
authoritative throughout. Nothing under `source/` or `work/` was edited.

**Bottom line.** None of these sheets should be placed in frame. They are 1672×941 generations upscaled to
1920×1080, so in the 3840×2160 master they would be about 2.3× soft. They also drift from the flat palette and line
(ink is near-black, the A02 hair is scarlet). They don't replace any rig. Still, several sheets show
**poses and views the rig can't draw yet**, and the scenes that need them (S2 mirror duck, S8 warehouse, S9 payoff) are
not built yet, so now is the right time. The upgrades worth making:

1. **Payoff J4 (S9_Payoff, shot S8.3).** A back-facing guesser (A01 back view) and a two-handed push lunge (A02 #7)
   let him push the partition's near end *toward the wall*. A real "lean round the edge" for the checker (A03 #5)
   replaces the current stiff sideways `peek`.
2. **Opening J1 (S1.1).** The rig's tiptoe has almost the same silhouette as its crouch: frontal body, knees pumping
   (see `sbs_A02_poses_vs_rig.jpg`). A02 #1 plus the A01 3/4 views show how to make it read as sneaking: a 3/4 turn
   into the direction of travel, a lower crouch, paws forward.
3. **Sensor stand continuity (S1–S4, S6.3).** The scenes draw three different stands (S1 = S3, S4, S6). A04's tripod
   gives one design to consolidate on. Separately, in every room view the stand-mounted sensor sits behind the
   checker's right forearm, so the hero prop hardly reads.
4. **Robot acting (S8_Warehouse, shot S7.3).** The rig's "cautious" eyes merge into one kinked bar that reads as a
   scowl. A09 shows the fix: separate lids that clip each dot.

A14 (research module) and A15 (3×3 box) are **not used**. Their counts are correct (verified: 100 and 9), but A14 is
teal like the kit sensor and its back reads as a consumer phone. A15 reads as a calculator keypad. The scene rigs
(`S6_ResearchModule`, `S3_/S7_ZoneBox`) are already better.

## Summary table

| Asset | Identity vs rig | Decision | Main upgrade (file → change) | Impact |
|---|---|---|---|---|
| A01 guesser turnaround | Same character. Off-model: boxy torso, 6 thin stripes (rig 5), thin arched brows, head ~20 % large vs torso, near-black ink | upgrade_code_rig_from_reference | `Cast2.tsx` Character2: back-facing view + 3/4 `turn` | high (back) / medium (turn) |
| A02 guesser 8 poses | Same character. Hair scarlet `#E6261D` (rig `#C0392B`, ΔE 23), taller crown with 4–5 spikes, tiny forehead | upgrade_code_rig_from_reference | `Cast2.tsx`: tiptoe gait + sneak arms, `PUSH`, `ARMS.duck` presets | high (push, tiptoe) / medium (duck) |
| A03 checker + sensor | Very close (bob, round glasses, pencil, coral cardigan, deadpan). Poses 1–3 hand-held = only valid from s32 | upgrade_code_rig_from_reference | `Cast2.tsx`: `PEEK_ROUND` lean-round preset with a hand on the edge. `holdSensor` two-fist grip option | high (J4) / low |
| A04 sensor + tripod | Back view matches the rig. Front view = two identical dark "eyes" (no coral emitter). "Top" view is physically inconsistent | upgrade_code_rig_from_reference | One shared `SensorStand` in A04's style; fix room-view occlusion; bare-board glyph | medium-high |
| A09 delivery robot | Same robot. Twin mast posts, front-view side lights read as ears (not adopted) | upgrade_code_rig_from_reference | `DeliveryBot.tsx` `Eye()`: separate clipped lids (cautious), separated arcs (pleased) | medium / low |
| A14 research module | 10×10 = 100 ✓. Teal (clashes with the kit sensor; the rig is saffron). The back's single top lens = phone back. No emitter on the window face | not_used | (optional, low) `S6_ResearchModule`: lose the "home button" look | low |
| A15 3×3 box | 9 dots in 3×3 ✓ + one dark rectangle = calculator keypad. No emitter cue | not_used | none (merge the S3/S7 ZoneBox copies; continuity only) | low |
| A16 warehouse walker | Matches `CAST.person` (palette ΔE ≤ 5). Boxy torso, bob ends at the ears. "Top" view is a high-angle shot with face and legs | reference_only_no_change | (gap it was meant to fill) `Tokens.tsx`: add `PersonToken` | medium-low |

Evidence images: `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/art_assess/cast_props/sbs/`
(each panel labelled; teal label = code rig render, black label = generated art):

- `sbs_A01_guesser_identity.jpg`: the rig guesser next to the A01 front, 3/4, side and back views
- `sbs_A02_poses_vs_rig.jpg`: the rig tiptoe and crouch (current Cast2 presets) next to A02 tiptoe, duck, push and lean
- `sbs_A03_checker.jpg`: rig `holdSensor`, the S6.3 lift and rig `peek` next to A03 #1, #3, #5
- `sbs_A04_stand_continuity.jpg`: the S1, S3, S4 and S6 stands as rendered, next to the A04 tripod
- `sbs_A04_sensor_views.jpg`: `HandheldSensor` next to the A04 back, front, side and "top" views and the bare board
- `sbs_A09_robot_eyes.jpg`: rig cautious/pleased eyes at 4× next to A09
- `sbs_A14_A15_modules.jpg`: `S6_ResearchModule` and `ZoneBox` next to A14 and A15
- `sbs_A16_walker.jpg`: the rig person (standing and walking), the dev-comp plan token, and A16

Rig renders made for this audit came from a scratch copy of `source/` (custom `Assess` still, no edits to the
project): `.../cast_props/renders/Assess_{1,2,3}_0.png`.

---

## Method

- Every sheet was viewed whole and in zoomed crops (`.../cast_props/crops/`). The rig side came from the existing renders
  (`art/packet/references/*.png`, `qa/kit/*`, `qa/scenes/S1,S3,S4,S6,S7/*`) and three new full-resolution Cast2 /
  prop stills.
- Palette: k-means on opaque pixels, nearest rig colour, CIE ΔE (`scripts/palette.py`).
- Counts: connected-component labelling on thresholded crops (`scripts/count.py`).
  - A14 front: **100** light window centres, exactly **10 rows × 10 columns** (pitch ≈ 42 px, sizes 235–251 px²). The back
    has **1** lens.
  - A15 front: **9** dark dots in **3 × 3** (pitch ≈ 90 px, ~2060 px² each) plus **1** rectangular window component. The
    3/4 view also has 9 dots.
- Outline: A01 torso edge 6–7 px on a 760 px figure ≈ 3.8 px at the rig's 440 px height, so the weight matches. The
  colour does not: ink clusters at `#03–#07…` instead of `#162A32` (ΔE 7–17).

---

## A01 · guesser turnaround (front, 3/4 L, 3/4 R, side, back)

**Identity check.** The A01 front head matches the rig closely: four spikes (two tall inner, two lower outer), an arched
hairline, ears outside the head, oval eyes with dot pupils and highlights, a hooked nose, coral cheeks, white
sneakers, navy trousers. Deviations (the rig wins on all of them):

- Torso is a straight-sided box with square shoulders. The rig's `torsoD` is a trapezoid with rounded shoulder caps
  (±76 at the shoulders, ±66 at the hem) and a curved hem.
- **6** thinner saffron stripes running right up to the collar. The rig has **5** stripes (14 px on a 30 px pitch, the
  first starting at SHOULDER_Y−10) with a white band at the hem.
- The head is about 20 % larger relative to the torso (head/torso width ≈ 0.89 vs the rig's ≈ 0.74), and the arms are longer.
- Brows are thin arcs. The rig draws straight 5 px strokes (`OUTLINE + 1`).
- Hair `#CF3426` vs `#C0392B` (ΔE 9). Ink is near-black.
- The side view is slightly oblique. The back view hides the face under the hair, with a jagged zig-zag nape edge and
  the ears outside.

**Upgrade opportunities**

1. **Back-facing view (HIGH).** DIRECTION §1 says "Turns … get purpose-built variants". In S8.3 (s47, `S9_Payoff`,
   R4 fallback) he pushes the partition **back toward the wall**. The partition is perpendicular to the wall with its
   near end toward the camera, so the natural staging puts his back to us. Cast2 can't draw a back.
   - File/function: `components/v02/Cast2.tsx` → `Character2`. Add `view?: 'front' | 'back'`.
   - For `'back'`: draw no eyes, brows, nose, mouth, cheeks or glasses. Draw the ears first, then a back-hair shape
     that fills the head down to about `HEAD_Y + 40` with a 5-tooth zig-zag nape (A01 back), keeping the same four
     crown spikes on top. Torso, stripes, neck, arms and legs stay as they are, but the arm passes swap (the "front"
     arms now go behind the torso).
   - The checker's `bob` back is the plain bob path filled to `cy + 26`, with the pencil showing at her right ear.
   - The A01 back view is the identity reference. No redesign.
2. **3/4 head turn (MEDIUM).** For any travel across the frame: the S1.1 tiptoe, the S6.10 walk behind the partition
   and the S6.9 sidle back.
   - Add `turn?: number` (−1..1) to `Pose2`.
   - Shift eyes, brows, nose, mouth, cheeks and glasses by `turn × 14` px. Reduce eye spacing by about 20 % at |turn| = 1.
   - Hide the far ear and move the near ear back about 6 px. Shift the spiky crown points by `turn × 6`.
   - Set `turn = dir × 0.6` inside `gaitPose` for walk and tiptoe.
   - The A01 3/4 L/R views show exactly this: features shifted toward the turn, far ear hidden.

**Contradictions.** None. A01 is reference only and must not be used as a sprite (palette and proportion drift, 1080p).

## A02 · guesser 8 poses

**Identity check.** He is recognisable in all eight poses: brows, half-lid smug face, cheeks, white sleeves, mitten
hands with thumbs. Deviations:

- **Hair `#E6261D`** (scarlet, ΔE 23 from `#C0392B`). It is the most visible palette break in the batch.
- The crown is taller and grows to 4–5 spikes (#7, #8). The forehead shrinks to a sliver above the brows (the rig
  hairline sits at `cy − 0.6r`).
- Stripes are more saturated (`#FBC421`, ΔE 10). Ink is near-black (ΔE 16). The torso is boxy, as in A01.

**Upgrade opportunities** (all in `components/v02/Cast2.tsx`):

1. **Push preset for S8.3 / R4 (HIGH).** The rig has no push.
   - Add `PUSH`: a lunge with feet `{L: {x: −95}, R: {x: 40}}` (or along the push direction), lean about 10°,
     `armsFront: 'both'`, brows −0.6, mouth `'frown'`.
   - Add a helper `pushPose(ch, pose, edgeTop, edgeBottom)` that places both mitts on the partition's near-end edge at
     chest height (≈ 1.1–1.2 m) with `reach2` for both sides, so the hands *touch* the panel (SCENE_BRIEF "hands touch
     what they move").
   - Combine it with the A01 back view so the push points at the wall (see Contradictions).
2. **Tiptoe that reads as sneaking (MEDIUM-HIGH).** It is the first character action of the film (J1, R1 fallback,
   `S1_ColdOpen` uses `tripPose(... style 'tiptoe', base SNEAK_ARMS)`). Today the tiptoe is frontal, the knee pumps high
   (`GAITS.tiptoe.lift 44`) and the paws sit at the chest. The silhouette is almost the CROUCH preset
   (`sbs_A02_poses_vs_rig.jpg`, panels 1 and 3). Following A02 #1:
   - `GAITS.tiptoe`: lift 44 → about 26, crouch 22 → about 34, lean 5 → about 9.
   - `ARMS.sneak`: push the paws toward the direction of travel. In `gaitPose`, offset the targets by `dir × 40`, y ≈ −250.
   - Add the A01 3/4 `turn`.
   - All of it stays on-model: same parts, new pose numbers.
3. **Duck preset for S2.2 J2 "he ducks fast" (MEDIUM).** S2 is not built yet.
   - `ARMS.duck = {armL: reachLocal(−26, −446, −1, −1), armR: reachLocal(26, −446, 1, −1)}`: hands clamped on top of
     the head, elbows out.
   - Use it with `CROUCH`, `hunch 0.18`, `tilt ±8`, brows 1, mouth `'frown'` (A02 #4).
4. **`EXPR.worried` (LOW).** `{brows: 0.9, browAsym: 0, mouth: 'frown', lookY: −0.6, eyes: 1.05}`, after A02 #6. S4.3 and S1
   already build similar faces inline. This would stop each scene re-inventing it (S9 shot S8.1 "still hiding, nervous").
5. **Crossed-leg lean (LOW).** A02 #5. Only for the optional R2 room still. S4.2 shows the lean as a head-and-shoulders
   inset, which already works (hand on the partition via `reach2`).

A02 #3 (busted with fists up) and #8 (arms crossed) add nothing: `S1_ColdOpen` already freezes him mid-smirk with
`EXPR.busted`-style face values, and `ARMS_CROSSED` matches #8.

**Contradictions.**

- **Push direction.** A02 #7 is a side-on push. If he pushes the partition's broad face from the side, as the A11
  plate stages it, the partition moves sideways (−x) and the gap at the wall never closes. The storyboard (S8.3)
  needs the near end pushed along −z until the far end meets the wall. Use the push lunge *from behind* (A01 back) on
  the near-end edge, and check this depth direction in any Runway R4 take too.

## A03 · checker with the sensor (5 poses)

**Identity check.** The closest sheet to its rig: grey bob with ears outside, round glasses, saffron pencil from the
right temple, coral open cardigan over a cream top, elbow-length coral sleeves, navy trousers, brown shoes, deadpan
flat mouth, straight brows. Deviations:

- The glasses rims are slightly heavier.
- The torso is boxy.
- The skin `#FAD5B6` is a touch yellower than `#F7D9C4` (ΔE 4.7).
- Ink is near-black.
- Pose 4 is "holding a blank card up overhead", not pinning a card to a board.

The sensor in poses 1–3 matches A04 and the rig: teal box, cream readout, saffron LED, coral and dark lens bumps over
the top, teal grip.

**Upgrade opportunities**

1. **Lean-round preset for J4 (HIGH).** In S8.3 (s47 + 4.5 s hold, `S9_Payoff`) "the checker simply leans around the
   partition and looks at him". The rig `peek: 1` only tilts the upper body and head sideways (`bodyXf lean +6°`,
   `headXf dx 30 / rot 15`) while both legs stay straight (`sbs_A03_checker.jpg`, panel 5). A03 #5 shows a committed
   forward-and-sideways lean, the back leg extended onto its toe, and the near hand raised to the (undrawn) panel edge.
   - File/function: `Cast2.tsx`. Add `PEEK_ROUND`: `peek 0.8`, `lean 9`, `shift 16` toward the edge,
     `feet {L: {x: −33}, R: {x: 85, lift: 6, pitch: 25, turn: 1}}` (mirror by side), `EXPR.deadpan`, `lookX` toward him.
   - Place the near hand on the partition's near-end edge with `reach2`.
   - Add the 3/4 `turn` 0.5 (A01 item).
   - The lead's call: `S9_Payoff` is a stub today, so this costs no rework.
2. **Two-fist grip (LOW).** File/function: `HandheldSensor.tsx` → `holdSensor`. Add `support: 'grip'`, which stacks the
   left fist under the right on the grip (A03 #1, #3) instead of the cradle, with an optional `rotate ≈ −12°` for the
   jiggle. This is a nicer read for S6.3 and the S9 hold. The S6.3 one-arm lift reads fine as built.

**Contradictions.**

- **A03 poses 1–3 are hand-held.** Per DIRECTION §4 and the storyboard continuity rule, they are valid only **from s32
  (S6.3) on**: S6.3, S6.9 (in `S7_Results`) and the S9 payoff. In acts 1–3 she stands *beside* the sensor on its tripod.
- The request itself told A10 to use "A03 pose 1", and the delivered **A10** plate shows her holding the sensor in S1.1.
  That contradicts the stand rule. Whoever audits the plates should reject A10 as an S1.1 start frame or have the
  sensor on the tripod.
- No other issues: the pencil is behind the ear and there is no text on the readout.

## A04 · handheld sensor views, bare board, tripod

**Identity check against `HandheldSensor`.**

- **Back view: matches.** Teal box, cream readout (blank by request; the rig shows the illustrative histogram), saffron
  LED, small light-teal button, coral band along the bottom, coral trigger on the grip, coral emitter bump left and dark
  detector bump right over the top edge.
- Grip: A04 uses body teal; the rig uses `tealDeep`. Keep the rig.
- Coral: A04 `#FA6D49`, slightly orange (ΔE 9.6).

**Deviations and errors (do not adopt).**

- **Front view.** Two *identical* dark round windows with white catch-lights. They read as a pair of eyes (a face), and
  the rig's colour coding is lost (coral emitter, ink detector; `SensorTop` shows the coral emitter window). The S1.6
  webcam gag already gives a gadget a face (`S1_Props` Webcam), so a face-like sensor would muddle that joke. The
  front view also still draws the two bumps above the box, so it shows four lens elements.
- **"Top" view.** A coral and a dark window *on the top face*, plus two lens barrels under it. That is physically
  inconsistent with the other views.
- **Bare board.** Fine as a generic illustration: teal PCB, two square optical packages, a chip, castellated notches.

**Upgrade opportunities**

1. **One stand, one look (MEDIUM-HIGH, continuity).** The kit has no shared stand. The scenes drew their own
   (`sbs_A04_stand_continuity.jpg`):
   - `S1_SensorStand.tsx` = `S3_SensorStand.tsx`: tealDeep hub collar and tealDeep mount plate, wide legs.
   - `S4_Stand.tsx`: inkSoft pole, round grey hub, inkSoft clamp, narrow inkMuted legs.
   - `S6_Stand.tsx`: grey plate with a coral tab, inkMuted collar.

   So the stand changes design across the S3→S4 cut and again in S6.3. Proposal:
   - Promote one projected stand into `components/v02/` (e.g. `SensorStand` + `standGeometry` exported next to
     `HandheldSensor`). Have the scene copies call it.
   - Style it after the A04 tripod: inkSoft column and three inkSoft legs with ink rubber feet, and **a coral collar
     clamp round the grip base** (it echoes the coral trigger and band, and reads as "this is where the sensor clicks in").
   - Keep it projected from `layout.json` S at h = 1.2 m as S1 does.
2. **Room-view occlusion of the hero prop (MEDIUM, staging).** In S1, S3 and S4 (`qa/scenes/S1/r4full/01523…`,
   `S3/r1/02947…`, `S4/r2/04010…`), the sensor box on the stand sits behind the checker's right forearm and hand.
   S3 even adds a "sensor" callout to show where it is. A04 (and A10/A13) show the readout clear of her body.
   - Pose option: drop her right arm slightly inward and behind (`armR.a ≈ 2`), or rest that hand *on the stand
     column* below the box (a real contact).
   - Layout option: move `layout.json` `operator.x` from 1.23 to about 1.05 m. The operator is not on any light path,
     but re-check KIT_API's note that the S→W legs pass behind her head.
   - Either way, keep S fixed. This is the lead's call: `data/layout.json` is shared.
3. **Bare-board glyph (LOW-MEDIUM).** For S5.4's side card ("a fingertip-sized sensor board on a little stool";
   `S5_History` is not built yet). Draw a small SVG `SensorBoard` after the A04 board: teal PCB, two square packages
   with round lenses (emitter coral rim, detector dark, to keep the coding), one chip, castellated notches. S6.1 as
   built sets the full hand-held sensor on the plinth, which is fine for "comic scale".
4. **S1.6 close-up "two windows" (LOW).** The built inset shows the back face with a stopwatch, and only the lens
   rims show over the top. If the storyboard's "two windows" matter, use a side view after A04's side panel (two lens
   barrels on the far face, readout edge visible), keeping coral/dark coding. Never use A04's identical dark eyes.

**Contradictions.**

- None with continuity: the tripod holds the module at chest height with the readout toward the viewer, matching
  acts 1–3.
- Accuracy: the A04 front/top views drop the emitter/detector distinction, which the film relies on.

## A09 · delivery robot sheet

**Identity check.** The same robot as `DeliveryBot`: squat saffron body, teal lid with a dark-teal handle slot,
saffronDeep cargo-door seam with a parcel badge, cream face panel with dot eyes on a saffronLight front, coral bumper
and rear tail light, teal chassis band, dark spoked wheels with teal hubs, cream mast, teal sensor head with a dark
window and a saffron lens. It is not the mascot: no speech-bubble head, no antenna disk. ✓

Deviations (keep the rig):

- **Twin mast posts** (the rig has one).
- The front and rear views have coral lights on *both* flanks, which look like ears in the front view.
- Wheel inner discs are white with white spokes (the rig: cream disc, ink spokes).
- The lid teal is darker (`#0B9090`).
- The side view is slightly oblique (the handoff says so).

**Upgrade opportunities** (`components/v02/DeliveryBot.tsx` → `Eye`; see `sbs_A09_robot_eyes.jpg`):

1. **Cautious squint (MEDIUM).** S7.3 "the robot brakes with a cautious squint" is the robot's main acting beat.
   - The problem: each lid line runs `rx + 2.5k` past its eye, and the two eyes are only 19.5 units apart. The two
     tilted lids meet and form **one continuous kinked bar** across the whole panel, which even overhangs the panel's
     right edge. With the flattened pupils it reads as a scowl or angry unibrow, not wary.
   - A09 shows the fix: keep each lid to about `rx + 0.6k` (a visible gap between the two), and clip the dot at the lid
     line so each eye becomes a half-disc (draw a panel-cream rect above `lidY` inside an eye clip, as Cast2 does for
     `lid`).
2. **Pleased arcs (LOW).** Arcs at ±8k on eyes 19.5 apart, with a 4.5 stroke, nearly touch and read as one wave "〰".
   Use ±6k and lift them about 1.5k, as A09's two separate small arcs.

No body change (do not adopt the twin mast or the front-view side lights).

**Contradictions.** None. The A09 front and back views aren't needed: the front-left camera and 3/4 cheat are an
accepted decision (KIT_API).

## A14 · research module (front/back)

**Count.** Front **100 windows, 10 × 10** (component count above) ✓. Back: one lens.

**Identity and accuracy check against the S6 rig** (`work/S6/.../S6_ResearchModule.tsx`, the only implementation):

- **Teal body.** DIRECTION and the request say the module is "kept visually separate from the open kit sensor", which
  is teal. The S6 rig is deliberately **saffron** for that reason ("so it never reads as … the teal kit sensor").
- **Consumer-phone read.** A thick dark bumper-style bezel on a rounded slab, plus a back with a single round lens
  top-centre, is the generic rear-camera phone. The request said "must not look like a consumer phone".
- **Physics.** There is no emitter on the window face. A time-of-flight device must emit from the face it listens on;
  A14's only lens is on the back. The S6 rig puts the emitter lens on the window face (correct).

**Decision: not used.**

Optional low-impact note for `S6_ResearchModule`: before the dots pop in, its empty cream window, the round lens
centred below it and the slot at the bottom read briefly as a phone screen with a home button (S6 sheet, f7726–7776).
Moving the emitter lens to a top corner next to the grid, or dropping the bottom port slot, removes that read. A14 has
no front lens and no port.

## A15 · 3×3 sensor box

**Count.** Front **9 dots in 3 × 3** plus one dark rectangular window ✓. The 3/4 view also has 9.

**Check against `ZoneBox`** (`S3_ZoneBox.tsx` = `S7_ZoneBox.tsx` geometry):

- A15 puts a dark display-like rectangle above nine round dark buttons. That is the classic **calculator / phone
  keypad** icon, so it could read as "a calculator" in S3.3, next to real data.
- A15 has no emitter cue. The rig's cream detector panel with the 3×3 zones, plus one coral emitter window, reads as a
  sensor and matches the kit sensor family (teal box, top and side faces).

**Decision: not used.** No change from the art.

Continuity note (not art-driven, low): S3 and S7 each carry a copy. They draw the same box, which satisfies "the same
box in both shots", but the stroke formulas differ slightly (`OUTLINE/(k·scale)` vs `OUTLINE/k`). Merge them into one
shared component when the lead merges. S3's coral centre-zone marker shares the emitter's coral; consider `coralDeep`
ring only.

## A16 · warehouse walker

**Identity check.** Matches `CAST.person`:

| Feature | A16 | Rig | ΔE |
|---|---|---|---|
| Top | `#D3E1F7` | blueLight | 0.3 |
| Hair | `#BD743A` | `#B8743A` | 2.4 |
| Trousers | `#634735` | `#5B4636` | 4.0 |
| Shoes | `#1F262D` | `#2B2B33` | 4.4 |
| Skin | `#FAD8C1` | `#F7D9C4` | 1.8 |

Brows, dot eyes, hooked nose and smile are on-model. It is not the glasses/bun character ✓. Deviations:

- Boxy torso.
- The bob ends at ear level, with the ears overlapping the hair. The rig bob hangs to `cy + 26`, past the ears.
- The side walk isn't needed: the warehouse walk is toward the camera (`whWalkAt`), and it already plants its feet.
- The "top" view is a high-angle shot that shows the face and a leg, not a plan token.

**Decision: reference only, no change to the rig.** The gap the top view was meant to fill is real, though:

- **`PersonToken` in `Tokens.tsx` (MEDIUM-LOW).** S8_Warehouse S7.2 (s41, plan view: "a person walks in the other
  aisle") needs a person token. `Tokens.tsx` has only Guesser and Checker tokens. KitWarehouse uses a local
  `PersonTokenG` (dev comp).
  - Promote it as `PersonToken`, built from the shared `Body` plus CheckerToken's bob path in `CAST.person` colours,
    with no glasses and no pencil.
  - Do not copy A16's top view.

---

## Not checked / caveats

- No motion was evaluated. The proposed presets need render-inspect rounds in the scene that uses them, especially
  feet planting in `PUSH`/`PEEK_ROUND` and the hand contact with the partition edge.
- The proposed values (lift, crouch, foot x, hand targets) are starting points derived from the art, not tuned numbers.
- The A10/A11 remarks are cross-references only: the plates are another auditor's scope.
- Storyboard shot IDs are offset from scene files: the warehouse shots S7.x live in `S8_Warehouse`, and the payoff
  shots S8.x live in `S9_Payoff`. The art request's "S8.2" for A16 corresponds to warehouse shot S7.2 (s41).

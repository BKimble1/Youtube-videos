# V2 build brief (for the sequence builders)

Read first:
- `production/V2_DIRECTION.md`: the creator's V2 direction, verbatim. It overrides everything else here.
- `production/BUILD_BRIEF.md`: V1 rules that still apply, including the kit API, sound-cue kinds, sides and colours, and the caption band.
- `production/SOURCE_NOTES.md`: the facts.
- `production/NARRATION_SENTENCE_TIMES.txt`: when each sentence is spoken.

The narration, its times and the captions are unchanged from V1. Do not alter them.

**Where V2 lives.** `source/src/v2/` contains:
- the composition `FingerV2`;
- the sequence table `v2/scenes2.tsx`;
- your file, `v2/SeqX.tsx`, which exports `VX` and `CUES_VX`.

V1 lives in `src/shots/`. It is a reference and a parts bin, never a layout to keep.
- You can reuse V1 parts: `art/kit.tsx`, `art/hand.tsx`, `art/game.tsx` (`GameScreen`), `art/crew.tsx` (`CrewChar` + `headGear`), `art/people.tsx`, `art/s2rooms.tsx`, `art/s3parts.tsx`, `art/s5parts.tsx`, `art/s6world.tsx`, `shots/s7ending.tsx`, and S1Hook's `Campus`, `RaoPanel` and `StoccoPanel`.
- Import them, or copy and upgrade them into your own `v2/` files.
- Do NOT edit V1 files or other builders' files.

## New V2 helpers

**`v2/core2.ts`:**
- `T`, `TE`, `pr`, `keys`, `pulse` (as in V1).
- `sp(f, tSec, {damping, stiffness})`: a Remotion spring that starts at tSec, with controlled overshoot.
- `camKeys(f, [[t, {x, y, z, rot}, ease?], ...])`: a keyed camera. Zoom interpolates in log space.

**`v2/Depth.tsx`:** `<Depth cam={cam} d={0.6}>`, a parallax layer that applies the camera itself (use it in screen space).
- d < 1 is far: it moves and zooms less.
- d > 1 is near: it sweeps past and grows fast.
- Use near foreground layers (building edges, desk edges, monitor bezels) for occlusion transitions.

**`v2/finger.tsx`:** the extreme close-up finger and space bar `FingerECU`, in the hero ECU's own world.
- Poses: `F_HOVER`, `F_LIFT`, `F_DOWN`, `F_JERK` (TMS wrist extension), `F_REST`, plus `mixF` and `pressPose(press)`.
- Props: `drive` (a saffron command glow along the back of the hand), `calm`, `keyGlow`, `press`.
- Geometry: `KEY` (the space bar, solved from the DOWN pose so the pad lands on the cap), `indexPts`, `padPt`, `keyTopY`.
- Preview it with the `FingerSheet` still.
- Every contact must be geometric: check `padPt(pose)` against `keyTopY(press)`.

**`v2/contracts.ts`:** `GAME_FULL` (the game seen full-frame), `ECU_CAM` (the opening ECU camera) and `PAD_RECT` (the touchpad → block match-cut rect).

**Checks:**
- `cd source && ./sheet2.sh out.png "t1,t2,..." [cols]` renders a V2 contact sheet.
- `./still2.sh out.png t false` renders one V2 frame.
- `npx tsc --noEmit -p .` must be clean.
- Do not render the full film. Do not run git. Do not touch anything outside `source/src/` (and `source/src/v2/contracts.ts` only if the brief says you own a constant).

## Non-negotiables

**Pace.**
- A meaningful visual development every 1–2 s, and a larger compositional change every 3–5 s where the narration supports it.
- No static hold of a monitor, chart, building, document or character while narration continues.
- Even "holds" must keep something changing that matters: an action in progress, a camera move landing on information, a reaction.

**Camera.**
- Motivated push-ins and pull-outs, tracking of physical actions and objects, foreground occlusion transitions, clean object match-cuts.
- Smooth acceleration and deceleration.
- Do NOT zoom in and out of the same illustration to fake motion.
- No shake, random whip pans, blur or chaotic cuts.
- Distinct compositions: never the same monitor from nearly the same angle twice in a row.

**Transitions.** Physically connected (follow an object or a signal, pass through a surface, match a shape). At least one memorable, polished transition per section. List each one you implement, with its time.

**Anatomy.**
- Hands and fingers must be convincing; fingertips actually contact keys and pads.
- No floating hands, detached limbs or changing proportions.
- Keep left/right fixed: Rao frame-left, Stocco frame-right. The RIGHT hand is driven by the LEFT motor cortex, so any back or top view shows the left hemisphere frame-left. In a front view the person's left is frame-right.
- The TMS movement is involuntary: fast, mechanical, with the drive glow. It must never look like a voluntary tap.

**Science.**
- Show the real chain: EEG cap (measurement) → computer (decoding) → network cable (one command) → TMS machine → coil (stimulation) → motor cortex → arm → finger. In 2019 the last stage is the visual cortex and a phosphene instead.
- Glowing paths are metaphors and must follow that physical route (cap, cable, computer, network, coil). No impulses flying through the air between heads.
- Never imply thought transfer or arbitrary control. The command is one prearranged signal.

**Captions.**
- Captions are burned in at the bottom (y > ~890 when shown). Keep key action and labels clear of that band.
- Labels: short `Tag`s only, readable at phone size, and few.

**Sound.** Export `CUES_VX` using the kinds in `BUILD_BRIEF.md`. Keep it restrained: no whoosh or pop on every transition. Signal transitions get a subtle cue at most.

**Determinism.**
- Everything is a pure function of `f`.
- Prefix every SVG id with your sequence letter (e.g. `va-`), including ids inside reused components when they repeat.

**Report back:**
- a beat list with times;
- your transitions list (time, from → to, how);
- any concerns;
- 2–3 contact sheet paths.

# V3 build brief (for the sequence builders)

Read first:
1. `production/V3_DIRECTION.md`: the creator's V3 direction, verbatim. It rules.
2. `production/V2_REPORT.md`: what V2 did, its transitions and its unresolved concerns.
3. `production/V2_BRIEF.md` and `production/BUILD_BRIEF.md`: rules, helpers and cue kinds that still apply.
4. `production/SOURCE_NOTES.md`: the facts.
5. `production/NARRATION_SENTENCE_TIMES.txt`: when each sentence is spoken.

The narration, its times and the captions are LOCKED.

**Where V3 lives.** `source/src/v3/` started as a copy of `src/v2/`, including your section's V2 code in `v3/SeqX.tsx`.
- **Composition:** `FingerV3`.
- **Sequence table:** `v3/scenes3.tsx`, sequences A–H. H is new: it is the ending, from T('Go back to that finger') − 0.3 to the end.
- **What you may edit:** your sequence files plus their `v3/` helper files. If a helper file is shared with another builder (for example `v3/finger.tsx`, `v3/core2.ts`, `v3/Depth.tsx`), do not edit it; copy it to a new, prefixed file of your own instead.
- **What you must not touch:** `src/v2/`, `src/shots/`, `src/art/`.

**What to see.** V2 is the baseline you improve on: `exports/FGW_Finger_V2_REVIEW_1920x1080.mp4`.
- Extract frames from it with ffmpeg.
- QA sheets of the V2 export are in `qa/v2/`; the transition bursts are in `qa/v2/transitions/`.

## New shared V3 helpers

**`v3/crew3.tsx`** is the cast rig, upgraded. It has the same API as `art/crew.tsx` (CrewChar, IDLE, mixPose, reach, handWorld, CAST), plus real cartoon hands instead of mittens:
- New `Pose` fields, `handL` and `handR`: `{curl 0..1, spread 0..1, point 0..1}`. `mixPose` blends them.
- `HAND_REST` is the default shape.
- Preview the hands with the `Hands3` still.
- **Use `v3/crew3` for every cast character in V3**, not `art/crew`.

**Reliable contact sheets.** `cd source && ./single3.sh out.png "t1,t2,..." [cols]` renders each time as its own still, so SVG ids cannot collide, then tiles them. Use it for any check you rely on. `./sheet3.sh` is faster but can show id-collision artefacts. `./still3.sh out.png t false` renders a single frame.

## Contracts (exact hand-offs)

| Boundary | Contract |
|---|---|
| A → B (19.54 s), and A owns H | Builder 1 owns A, B and H, so these hand-offs are internal. |
| B → C (44.64 s) | `<g transform={GAME_FULL}><GameScreen t={filmTime − 46.22} events={[]}/></g>`: plain game, no objects. C must open on exactly that frame. |
| C → D (90.0 s) | GAME_FULL with the plain game and the clock t = 8.64 (D continues t = 8.64 + (filmTime − 90)). |
| E → F (135.87 s) | The touchpad's surface, front-on, exactly fills `PAD_RECT`. F opens with the falling block's bounding box on the same rect. |
| G → H (T('Go back to that finger') − 0.3 ≈ 195.96 s) | G's last frame is plain paper (`K.paper`) with ONE saffron horizontal bar exactly filling `LINE_BAR` (x 560–1360, y 600–640). H opens on that bar and carries it into the ending. |

You may improve how each boundary is reached, but the boundary frame itself must match. Pixel-check it against the neighbour where possible.

## Non-negotiables for V3 (beyond V2's)

**Continuity.**
- Every scene boundary inside your section must be a physically connected move or a clean action-matched cut.
- No disconnected wipes, unnecessary fades or short dissolves (V2 had a few under 0.25 s; remove them).
- No camera move without a destination.

**Character animation.**
- Hands are anatomically right, with correct finger lengths, joints and contacts.
- Wrists rotate; arms connect at the shoulders and elbows.
- Heads move subtly; eyes track the action.
- Anticipation before intentional moves, follow-through after.
- Characters react to events (a glance at the screen, a lean, a flinch, a smile).
- Involuntary TMS movement must look different from voluntary movement.

**Variety.**
- Distinct compositions and camera angles; never a run of similar monitor-centred frames.
- Meaningful development every 1–3 s.
- A long, beautifully animated connected move beats several cuts.

**No decorative graphics.**
- No radial callouts, generic infographic circles or rings, or decorative motion graphics.
- The phosphene arc is real content and stays.
- Highlight with action and staging, not rings. Remove V2's highlight rings where they are decoration.

**Labels.**
- Few, short and clean, above the caption band (y < ~880).
- V2's "involuntary", "the controller" and "slow motion" labels should go unless they are truly needed.

**Fix the V2 concerns that fall in your section** (see V2_REPORT):
- Stocco's simple back-of-hand drawing;
- the researcher's glove;
- the plain hub computer;
- the oversized overhead view of Stocco;
- the BrainNet round-2 arrival;
- the double snap at the end.

**Science (unchanged).**
- EEG measures, the computer decodes, the network carries one prearranged command, TMS stimulates.
- Glowing paths are metaphors and follow the physical route; nothing travels through the air between heads.
- No thought transfer, no arbitrary control. Preserve the logic and results exactly.

**Motion.**
- Smooth easing and springs with controlled overshoot, proper arcs, no linear slides, no stutter.
- Restrained 2.5D parallax (`Depth`).
- Everything is a pure function of `f`. SVG ids carry your prefix (and the frame number when the geometry changes per frame).

**Sound.**
- Export `CUES_VX` (restrained; the kinds are listed in BUILD_BRIEF).
- coil_pulse keeps the same gain in the normal and flipped 2014 trials.

**Checks.**
- `npx tsc --noEmit -p .` is clean.
- `./single3.sh` sheets cover: every transition frame by frame; every hand action at 1-frame spacing; your first and last frames against the contracts.
- Fix what you see.
- Do not render the full film. Do not run git.

**Report back:**
- a beat list with times;
- the transitions (time, from → to, how);
- what you changed versus V2;
- remaining concerns;
- 2–3 sheet paths.

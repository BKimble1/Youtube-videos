# R4 final animation and continuity pass — brief for every agent

**Read first, in full:** `production/R4_PROMPT.md` (the owner's R4 request; it outranks this file), then `production/R3_BRIEF.md`
(choreography rules, release gates, shared-file rules, all still in force) and the notes for your section in
`production/R3_EXCHANGES.md`. The reference film is `exports/FGW_TheLastChoice_R3_REVIEW_1080p.mp4` (3:57.8, 30 fps; its
source is commit 7ced645). Its times are unchanged in R4: **section boundaries, shot durations and the music anchors `M`
(`source/src/r2/timing.ts`) do not move.**

## What R4 asks, in one paragraph

The film is close. Fix animation defects throughout: (1) body parts and robot components that vanish, flicker, fuse or
intersect; (2) actions the audience cannot read (who acts, what they touch, how the target reacts, where everyone ends
up); (3) more purposeful movement and reciprocal combat inside the existing runtime; (4) camera and secondary motion only
where they serve 1–3. Fix **shared causes** (rig, mech, set, fx), not one camera angle. Establish causes from the actual
source: the symptoms in the prompt do not say which system is responsible. Never apply blanket fixes (no disabling depth
tests, no all-double-sided surfaces, no drawing figures over all scenery). Never hide a defect with a flash, smoke, shake,
blur or a faster cut.

## Already fixed by the lead (read before you touch the rig)

- `rig/figure.tsx` `legOverTorso` (inside `solve2`): the seated Director's legs vanished in D4-9a (2:59–3:03) because
  `legFront` was a hard threshold on the thigh's angle (ratio 0.68 of the thigh length): his legs sat just under it, so
  the right leg was drawn behind the torso for the whole slide and the left flipped. A leg whose knee or foot is nearer
  than the torso **and** overlaps it on screen is now drawn over it, whatever its thigh angle. All 7 rig-lab model sheets
  and the 42-frame strip (`R2RigLab` pages 0–6, 14) are pixel-identical to before, so standing, crouching, kneeling and
  running figures there are unchanged.
- `shots/EF/crew.tsx`: the Director's seated feet are planted on the ground (`DIR_FEET`, world targets); SLUMP's
  body-relative foot targets rotate with the lean and floated 0.3 m up.
- Evidence and method: `qa/r4/legs/`. **This is the template for how causes are found: probe the numbers
  (esbuild a small script that calls `figureRig`/`figProps`/`figureParts`), find the discrete decision, fix it
  physically, then prove it frame by frame.**

## Tools

- `source/fsheet.mjs` — frame-step contact sheets from the CURRENT source (no render of the film):
  `cd source && node fsheet.mjs <out.jpg> <t0> <t1> [stepFrames]` (e.g. `node fsheet.mjs $S/a.jpg 179.3 180.9 2`; a
  bare number is seconds, `f5379` is a frame). Env: `COLS`, `TW` (tile width), `SCALE`, `CROP="x0,y0,x1,y1"` (fractions of
  the frame), `KEEP=dir`, `COMP`, `PROPS`. Every tile is labelled with its time and frame. Use `CROP` to zoom on the action.
- `source/stills.mjs` — selected frames at any scale (`COMP=LastChoiceR2 SCALE=1 node stills.mjs <dir> t:12.4 …`).
- Probing numbers headlessly (how the lead found the leg cause):
  `npx esbuild probe.tsx --bundle --platform=node --outfile=probe.mjs --jsx=automatic --loader:.png=empty --loader:.woff=empty --loader:.woff2=empty && node probe.mjs`
  (run from `source/`; import crew functions such as `directorAt` from `src/r2/shots/<SEC>/crew`, `figProps`/`figureParts`
  from `src/r2/rig`, `makeView` from `src/r2/engine`). The timeline JSON of the 105 shots is at
  `qa/r3/render/timeline.json`.
- Rig lab / mech lab pages (`R2RigLab`, `R2MechLab`, see the header comments of `dev/RigLab.tsx`, `dev/MechLab.tsx`) render
  a figure or machine alone from any angle: use them to prove a kit fix before checking shots.
- The R3 film for before-frames: `ffmpeg -ss <t> -i exports/FGW_TheLastChoice_R3_REVIEW_1080p.mp4 -frames:v 1 x.png`.
- Scratch files, work-in-progress frames and probes go in the scratchpad
  `/tmp/claude-0/-home-user-Youtube-videos/4fd06f38-6715-5414-83fd-ceb37ea54d2a/scratchpad/r4/<yourname>/`, never the repo
  (a `wip*/` folder under `qa/r3/**` or `qa/r4/**` is Git-ignored, but keep it out anyway). Final sheets only go in
  `qa/r4/<area>/` (keep them small: sheets, not every frame).
- The machine has 4 cores and ~10 agents share it: render only what you need (≤ ~30 frames per call, `SCALE` 0.35–0.5
  unless you need detail), one render at a time, no chunk or full-film renders. If a bundle fails because someone's file is
  mid-edit, wait 30 s and retry.

## How to verify (the prompt is explicit; "widely spaced stills alone cannot certify that popping is gone")

1. Establish a defect with before-evidence: consecutive frames (every 1–2 frames) from the R3 film or the current source,
   and the number that shows it (the probe).
2. Find the cause in the source. Check **every other shot that uses the changed component**.
3. After the fix, step through **every 2nd frame (every frame around the event)** on both sides of: each contact, turn,
   pose transition, occlusion change, fall, cut and handover. Use `fsheet.mjs` with `CROP`.
4. Compare pre-contact, contact and post-contact frames of every principal impact. Check object and damage persistence
   across cuts (wrecks, dropped tools, wounds, cover, held props, fallen robots).
5. Sound: keep the existing cues. If a contact frame moves, move only its cue in `shots/<SEC>/cues.ts` (pure data; the
   mix is regenerated by the lead) and say so in your report. Do not add effects to compensate for unclear animation.

## What every agent must watch for (the prompt's body-persistence checklist, applied)

A limb, hand, robot part or prop never simply vanishes when a character turns, crouches, falls or passes near scenery: it
stays unless a real surface occludes it or it leaves the frame. Look for: wrong parent transforms/pivots/pose blends;
angular visibility switches and front/back swaps; zero/negative scales; unintended opacity; depth conflicts and sort
errors; clipping and near planes; a layer or mask that removes a whole limb when only part is behind a surface; culling
bounds that don't contain animated parts; level-of-detail changes that remove anatomy; discontinuities at shot-local frame
resets, modulo loops, remounts and animation boundaries. Shoulders stay on upper arms, elbows on forearms, wrists on
hands, hips on thighs, knees on shins; robot joints stay connected; a part that breaks off is shown breaking and then
tracked to its resting place; a damaged robot never regenerates a part on the next cut.

Rocks and rubble: every solid chunk has visible support, a believable throw/fall, or an established force. Dust, embers
and smoke are not solid. Debris has an origin, a trajectory, a collision and a resting state.

Props: hands grip at stable attachment points; nothing slides through fingers, swaps hands without an action, or passes
through a face. Check side and three-quarter views, hair silhouettes, headset microphones, the red-haired runner's profile.

## More meaningful movement (prompt §3), inside the existing durations

For each principal exchange make one continuous chain: recognise the threat → anticipate → move/attack → contact or evade
→ recoil → recover/reposition, each beat growing from the last (no snap back to a default stance). A robot under attack
blocks, reaches, counters, staggers, loses balance or retreats (according to the existing outcome); a human who has struck
follows through, transfers weight, recovers their grip. Torso rotation, shoulders, hips, bent knees and footwork; planted
support feet; stride matched to travel; push-off, clearance, landing compression, recovery. Heavy robots carry momentum
and brace but are not slow in every move. Add small, practical actions the scene already supports (a sidestep around
rubble, a duck, block then counter, a teammate covering a retreat, a wounded person stumbling into support). Background
combatants get staggered tasks and reactions; one clear primary action per shot, quieter secondary action, no
equal-intensity noise. Gaze and expression track the nearest relevant threat, ally, wound or device. No global speed-up;
no new abilities; preserve the cartoon/vector identity. Update your section's table in `production/R3_EXCHANGES.md` for
every exchange you change (start, target, attack, defence, counter, consequence, end).

## Ownership and shared files

- You own `source/src/r2/shots/<your section>/*` (and its rows of `production/R3_EXCHANGES.md`, `qa/r4/<SEC>/`, and your
  defect list `production/R4_DEFECTS_<SEC>.md`).
- Kit agents own: RIG `source/src/r2/rig/*`, `dev/RigLab.tsx`; MECH `source/src/r2/mech/*`, `dev/MechLab.tsx`; WORLD
  `source/src/r2/world/*`, `fx/*`, `shots/A/*`. Section agents never edit a file another owner holds: if you need a kit
  change, make the **smallest additive change** (a new optional field, default unchanged) or ask for it in your report.
  Kit agents: never change the default behaviour of a shared function without proving it on the rig/mech lab and on the
  shots that use it; additive and opt-in where you can.
- Re-read a file immediately before editing it (others work in parallel). Do not commit; the lead commits. The lead runs
  `cd source && npx tsc --noEmit -p .` before each commit: keep the tree type-clean.
- **Handover states stay put.** Each section's first and last frame must still match its neighbours (crew roots within
  ~2 cm and poses, machines identical, held props). If you must change an end state, say so in your report so the
  neighbour can follow; re-verify numerically the boundary you touched.
- Never relocate obstacles (truss, orange beams, cover, van, slabs) to suit a camera. Never teleport anyone, swap an
  attacker's side or a weapon's hand without an action.
- Do not change the music, the ending's timing, or the end card ("A FUTURE GOT WEIRD FILM"). The quiet ending stays
  restrained.

## Defect list and report

Keep `production/R4_DEFECTS_<SEC>.md`: a timestamped table (time range, what is seen, observed-vs-suspected cause, the
source cause once found, fix, how it was verified, status). Separate **observed visual failure** from **suspected cause**.
Your final report (short): fixes with timestamps; what you verified and how; boundary states (before/after); cue changes;
kit changes you made or need; remaining defects, honestly (do not claim a section is glitch-free without having checked it
frame by frame); and anything you could not verify. Do not claim you watched or listened: you judge from frames and numbers.

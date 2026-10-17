# R2 shot-building brief (applies to every section)

Project root: `Future_Got_Weird/the-last-choice/`. Source: `source/` (Remotion 4, React 19, TypeScript). The film is the
composition `LastChoiceR2` (`source/src/r2/film/MainR2.tsx`); a 4K twin is `LastChoiceR2-4K`. Everything is vector SVG,
so never bake in rasters or pixel sizes that would break at 4K (the 1920×1080 viewBox scales).

## Read first

- `production/R2_SHOT_LIST.md`: your section's shots.
- `production/R2_BEAT_SHEET.md`: cast, tools, damage timeline, geography.
- `source/src/r2/timing.ts`: `M` (film-second anchors); never change the values.
- **Stage:** `source/src/r2/film/stage.tsx`.
  - `Stage`: set, light, atmosphere and materials in one.
  - `useShotTime(start)` → `{t, T}`.
  - `camPath(keys, t)`, `spline3`, `withShake`, `fadeIn`/`fadeOut`.
- **Continuity:** `source/src/r2/film/continuity.tsx`, which registers wrecks that persist into later sections.
- **World kit:** `source/src/r2/world/index.ts` and `plan.ts`.
  - `PLAN` landmarks, `groundH(x, z)`, `RADIO`, `VAN_XF`, `DEATH_SLAB`, `GIRDER`.
  - `setItems` options (`radioOn`, `tower`, `skip`); `atmosItems` options (smoke, haze, columns).
- **Rig kit:** `source/src/r2/rig/index.ts` (header lists the API).
  - `figureSprite`, `figureRig`, `handOn`, `supportCatch`, `gaitW`.
  - Poses, props, `lookR2`, `dmgR2`, `toolsR2`, `limpR2`, `ClaspCU`.
  - Worked examples: `source/src/r2/dev/RigLab.tsx`.
    - Page 8: the Director rising on the real ridge.
    - Page 9: a catch and a hand on a shoulder.
    - Page 10: the death close-up and the clasp insert.
- **Machine kit:** `source/src/r2/mech/index.ts`.
  - `combatUnit`, `drone`, `heavy`, formations, `armyItems`, `unitAttach`, `unitImpacts`.
  - Examples: `source/src/r2/dev/MechLab.tsx`.
- **FX kit:** `source/src/r2/fx/index.ts`.
  - Tether, decoy, ally drone, flare, smoke, impacts, plate states, blast, muzzle.
  - Every builder returns `{items, lights, shake}`: pass lights to `Stage lights=`, and shake to `Stage shake=`.
  - Examples: `source/src/r2/dev/FxLab.tsx`.

## Where you write

Only inside `source/src/r2/shots/<SEC>/` (your section folder):

- **`index.tsx`** exports `SHOTS_<SEC>: R2Shot[]` (`{id, sec, start, end, note, C}`, film seconds). Use one file per shot or per group, as you like.
- **`cues.ts`** exports `CUES_<SEC>: Cue[]`: sound cues in film seconds. This file is pure data: import only timing/constants (`M`, `PLAN`) and plain helpers. Never import React components or the rig/mech/fx kits here; it is bundled for the mixer.
- **`persist.ts`** exports `PERSIST_<SEC>`: machines your section leaves broken or fallen, for later shots.
  - Keep their specs in a pure file (for example `machines.ts`: specs and paths only, no React, no `continuity` import), so both your shots and `persist.ts` import it without an import cycle.

Shots must tile your section exactly. The first start is the section start, each end equals the next start, and the last end is the section end. Use `M` constants or literal seconds from the shot list.

Shot-local time is `t`. Film time `T = start + t` drives:
- light phase, fires, smoke and the failing tower;
- damage (`dmgR2(role, T)`) and tools (`toolsR2(role, T)`);
- machine specs: pass `t: T` and give every `t0` in film seconds.

Other sections are being built by other agents at the same time, in the same working tree:
- Do not edit another section's folder.
- **Shared kit fixes** (world/rig/mech/fx/engine/stage) are allowed only when needed. Keep them minimal and backward-compatible: add an option rather than change a default. List every one in your report.
- If a bundle fails because of someone else's file, wait a minute and retry. Do not touch their file.
- Do **not** commit or push; the lead does that.

## Rendering and checking (4 CPUs shared by several agents: render only what you need)

From `source/`:

- **Stills** (sheet of several times):
  `COMP=LastChoiceR2 SCALE=0.5 COLS=4 node stills.mjs <dir> t:61.2 t:61.5 …`
  This writes PNGs plus `sheet.png`. Add `PREFIX=x` to name files and `NO_SHEET=1` to skip the sheet.
- **Motion clip** (to extract frames from and check continuity):
  `npx remotion render LastChoiceR2 <out.mp4> --frames=A-B --scale=0.5 --concurrency=2 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --muted`
  Then extract frames with ffmpeg (for example every 2nd frame around a contact) and tile them to inspect.
- **Typecheck:** `npx tsc --noEmit -p .`. It must be clean before you finish. Keep your files syntactically valid while others are rendering: write whole files, not half-edits.
- **Where outputs go:** working frames go in your scratchpad. Keep only a few contact sheets (key moments and contacts) in `qa/r2/shots/<SEC>/` (create it). Name them by shot.

## Quality bar (the reason R2 exists)

The user rejected R1 because it looked like "cutouts sliding through a stage". Every shot must read as physical action in a real 3D place:

- **Feet:** planted on `groundH`; walking and running use `gaitW` (no gliding).
  - Weight shifts before steps.
  - Intention before motion, then anticipation → contact → reaction → recovery.
- **Hand contacts:** solved to world points (`world.handL/handR`, `handOn`, `supportCatch`, `unitAttach` points). When a hand pushes, grabs or braces, the target reacts.
- **Depth:** order is correct, people stay behind and in front of debris correctly, and nothing intersects visibly.
- **Damage:** persists (`dmgR2`, plate states, machine damage).
- **Cameras:** physical, with a position and target in the world.
  - Prefer low three-quarter views, foreground occlusion, diagonal movement, and a little handheld drift (`drift` 0.01–0.03) on ground cameras. Shake on impacts comes from FX/mech.
  - Keep screen direction: the enemy is east; Crew facing east read screen-right unless the shot re-establishes geography.
  - Use the landmarks (ridge, van, crater, girder, skyline) to keep geography readable.
- **Scale:** the Crew are about 1.75 m, units 2.2 m, heavies 6 m. Use wides for scale and closer angles for teamwork. Faces must be readable in close shots: choose angles where the Director's curls do not hide his face.
- **Light:** comes from the stage. The sun is low in the west, so the Crew are rim-lit and machines are front-lit; fires spill locally. Don't fake light per shot unless it is an FX light.
- **Sound:** cue every contact, footfall cluster, servo, tool use and breath that matters.
  - Use only kinds listed in `audio/R2_SFX_CHOICES.md` (R2 takes) or in `audio/sfx/*.wav` (R1 kinds: blast body_fall breath_exert breath_ragged cable_strain debris_rain drone_rotor elec_arc fire_bed metal_tear robot_step robot_step_heavy sensor_lock servo_heavy servo_whir sparks static steam_vent steps_gravel sub_boom wreck_slam tinnitus …).
  - `pan` comes from the screen x of the source (−1..1), and `dist` from camera distance (0 close .. 1 far).
  - Beds and global cues already exist in `source/src/r2/sound.ts`; don't duplicate them.

## Report back (concise)

- The shots built (ids, times, one line each).
- What reads well and what does not, honestly, with the contact-sheet paths.
- Kit changes made, and kit problems you could not fix.
- Any timing change you think the music needs (do not make it).

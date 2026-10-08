# Scene builder brief (Video 02)

You build one scene of an animated explainer, "How Cameras See Around Corners" (anonymous channel Future Got Weird;
never put anything about the channel owner on screen). Remotion 4.0.533, React 19, TypeScript, 1920×1080, 30 fps.

## Where you work

- Your isolated copy: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/<SCENE>/source` (node_modules is a
  symlink; never run npm install). Edit **only** `src/scenes/<your scene file>.tsx`, and create new files only as
  `src/components/v02/<SCENE>_<Name>.tsx` (prefix = your scene id, e.g. `S4_Inset.tsx`). Never edit shared files
  (`lib/*`, `components/*.tsx`, `components/v02/` files without your prefix, `Main.tsx`, `Root.tsx`, `theme.ts`,
  `data/*`). If you need a variant of a shared component, copy it into your own prefixed file. Keep your scene's exported
  component name and keep `export const SFX: Sfx[]`.
- `npx tsc --noEmit -p .` must pass in your copy before you finish. Do not commit or push; the lead merges your files.

## Read first

1. `../../../DIRECTION.md` (episode direction), `../../../storyboard/STORYBOARD.md` (your scene's rows are the brief),
   `../../../script/SCRIPT.md` (the spoken lines; `script/narration_segments.json` has per-line direction).
2. `KIT_API.md` in your copy (the kit builders' reports: exported APIs of room/projection, optics, cast, sensor,
   tokens, warehouse, robot) and the kit sources in `src/lib/room.ts`, `src/lib/optics.ts`, `src/components/v02/*.tsx`.
   The dev compositions `src/dev/Kit*.tsx` show working usage; copy their patterns.
3. `src/lib/shots.ts` (shared camera framings, hand-offs, plinth colours), `src/data/layout.json` (the verified room
   geometry: every light path, arc and band comes from it), `src/lib/motion.ts`, `src/lib/camera.tsx`,
   `src/lib/timeline.ts`, `src/lib/sfx.ts`, `src/components/Character.tsx` + `src/components/cast.ts`.
4. Evidence scenes: `../../../research/OPENING_EVIDENCE.md`, `../../../research/EXPERIMENT_RECORD.md`,
   `../../../research/claims.csv`; data in `src/data/evidence/*.json` (each file states its provenance and conditions).
5. Reference look: Video 01 frames in `../../../art/v01_refs/` (the accepted cast and style).

## Timing

- `useG()` gives the global frame. Cue every beat from narration words: `at('s05', 'flash')` (start of a word; case and
  punctuation ignored; `at(seg, word, 2)` for the 2nd occurrence), `segEnd('s05')`, `seg('s05').from`,
  `scene('S1').from/.to`. List your segments' words first:
  `python3 -c "import json;t=json.load(open('src/data/timeline.json'));[print(s['id'],s['from'],s['to'],' '.join(f\"{w['w']}@{w['from']}\" for w in s['words'])) for s in t['segments'] if s['scene']=='<SCENE>']"`
- The timeline is PROVISIONAL (estimated word timings). The final narration replaces it with measured timings that may
  differ by ±20 %. Therefore: define all cue frames once at module level (`const K = {...}`) from `at()` calls; derive
  every beat from them; never hard-code absolute frames; when an action needs more frames than the gap to the next cue,
  shorten it from the cues (`Math.min(desired, next - here - margin)`), so the scene still works when gaps shrink.
- The scene is mounted from `scene(id).from` (minus any transition lead) to `scene(id).to`; the voice's designed
  pauses are yours to fill with a deliberate development or a held reaction.

## Pictures

- Style: Video 01's flat cutout illustration. Flat fills, 4 px ink outlines (#162A32) at 1080p, rounded shapes, the
  theme palette (`C.*`), no gradients except soft shadows, no textures, no hatching or stripes that shimmer, no glow, no
  dark fields, no grids. Characters: `Character2` (Cast2) with `CAST.guesser` (the hider) and `CAST.checker` (the
  sensor operator); in the plan view, `GuesserToken` / `CheckerToken`. The kit sensor is `HandheldSensor` (on a small
  stand for acts 1–3). Never redesign the cast.
- Every shot: setup → action → reaction → settle. Anticipation, contact, reaction, settle on physical actions. Hands
  touch what they move (`reach2` / `holdSensor`). Feet do not slide (gait helpers). One camera move per idea, eased
  (`camPath`), never while something important lands. No perpetual zooms or bobbing. Designed holds are fine.
- Light paths: straight segments between reflections, from layout.json points, never through the partition (use
  `assertPath` / the kit's `layout` props); slowed pulses labelled "slowed down"; later bounces thinner and paler. When
  paths are drawn in the room view, raise the camera (`RAISED_TILT`, `CAM_RAISED`) so the gap between the partition's
  far end and the wall is visible and every wall→person segment visibly passes through it.
- Text: Fredoka headlines, Nunito labels, JetBrains Mono numbers. On-screen size after camera zoom: critical ≥ 44 px,
  body ≥ 34 px, guard-rail labels ("illustrative", "simplified picture (2D)", source chips) ≥ 30 px. Labels name things;
  they do not narrate. Settled labels do not move. Keep critical text out of the bottom 12 % (captions) and inside a
  5 % margin. Exact wording of accuracy labels is in the storyboard; reuse it.
- Evidence: draw the authors' numbers from `src/data/evidence/*.json` faithfully (no smoothing, no invented points);
  label "Real measurements" / "authors' released data" exactly as the storyboard says, with the conditions chip and the
  source chip. Illustrations and toy numbers are labelled "illustrative".
- Determinism: everything is a pure function of the frame; seeded `rand()` only; no `Math.random`, no `Date`.

## Sound cue sheet

Export `export const SFX: Sfx[]` (`import {Sfx} from '../lib/sfx'`), built from the same cue constants, one entry per
physical event, frame-accurate at the contact; pick the closest kind from `SFX_KINDS` in `lib/sfx.ts` (never invent a
kind); vary repeated sounds with `pitch`/`gain`; add your set's ambience once (`amb_room`, `amb_museum`,
`amb_warehouse`) from the scene start with `dur` = scene length in seconds. Be selective: no sound for every move, no
whoosh on cuts.

## Verify (required; at least three render-inspect-fix rounds)

- Stills: `cd <your copy> && ONLY=<SCENE> SCALE=0.5 node stills.mjs /home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/<SCENE>/r<N> <frame> <frame> ...`
  (frames may be `word:s05:flash+6`, `seg:s05`, `segend:s05-10`, or numbers; one bundle per call, ~1–2 min; batch 10–20
  frames per call). Read the PNGs and fix what is wrong.
- Motion: `cd /home/user/Youtube-videos/Future_Got_Weird/Video_02 && bash tools/scene_clip.sh work/<SCENE>/source <SCENE> qa/scenes/<SCENE>/clip 0.5`
  renders your scene at half resolution (muted) and writes dense contact sheets (3 fps, with the spoken words) and a
  motion report (`still runs` > 0.8 s are listed). Read the sheets: check every shot's action reads, camera paths keep
  text and characters in frame, nothing pops, flashes or resets, hands touch, feet plant.
- Check text sizes against the rule, the caption band, and the factual labels against the storyboard and claims.

Return: what you built shot by shot (with cue words), files created, deviations from the storyboard and why, known
limitations, the SFX count, and the paths of the final contact sheets you inspected.

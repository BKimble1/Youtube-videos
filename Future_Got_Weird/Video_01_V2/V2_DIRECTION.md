# V2 direction — how every scene is rebuilt

Read `V2_BRIEF.md` first (the owner's brief). This file turns it into working rules, the shared kit, and the
hand-offs between scenes. The cold open (`source/src/scenes/S1_Counter.tsx`) is the reference implementation: read it
end to end before writing anything; match its structure, its level of care and its conventions.

## 1. What V2 is (and is not)

Same story, script order, illustrations, palette, characters, metaphors, jokes and runtime as V1. What changes is the
execution: every sentence gets a developing visual (setup → action → reaction → secondary movement → next
development), physical contact is real, the camera is directed, text is readable on a phone, and every physical event
has a sound. Do not redesign the scene, replace the illustration language, add motion graphics everywhere, shake the
camera, or animate every background object. Quiet moments are allowed when they are deliberate (a designed hold with
small life), never because the animation ran out.

## 2. Ground rules for scene agents

- Work only in your own working copy (`work/<SCENE>/source`). Edit only `src/scenes/<your scene file>.tsx`, and create
  new files only under `src/components/v2/` with your scene id as prefix (e.g. `S6_Podium.tsx`). Never edit shared
  files (`components/*.tsx`, `components/v2/` files without your prefix, `lib/*`, `Main.tsx`, `theme.ts`,
  `data/timeline.json`). If you need a variant of a shared component, copy it into your own prefixed file.
- Keep the exported component name of your scene unchanged (Main.tsx imports it). Keep any other export other scenes
  import (e.g. S1 re-exports `SLIPS`).
- `npx tsc --noEmit -p .` must pass in your copy before you finish.
- Never put anything about the channel owner into the video: no name, initials, other brands, biography, school,
  face, voice, portfolio or personal links (the full list is in the owner's private brief). No model identifiers or
  credentials anywhere.
- Do not commit or push; the lead merges your file.

## 3. Timeline and cues

- `useG()` gives the global frame. Cue frames come from the V2 narration: `at(seg, word, occurrence?)` (start of a
  word, punctuation ignored, case-insensitive), `segEnd(seg)`, `seg(id).from/.to`, `scene(id).from/.to`.
- The V2 text differs from V1 in places. Never assume V1 cue words exist: list your segments' words first, e.g.
  `python3 -c "import json;t=json.load(open('src/data/timeline.json'));[print(s['id'],s['from'],s['to'],' '.join(f\"{w['w']}@{w['from']}\" for w in s['words'])) for s in t['segments'] if s['scene']=='S6']"`
- Define all cue frames once at module level (`const K = {...}`), derive every beat from them, and reuse them for the
  sound cue sheet (section 8). No magic frame numbers in the JSX.
- Mind the pauses the voice leaves (they are designed): fill them with a deliberate development or a held reaction.

## 4. The shared kit (import, do not modify)

`lib/motion.ts` — `E` eases (`out`, `inOut`, `in`, `back`, `softBack`, `decel`, `windup`), `tw(g,start,dur,ease)`
0→1, `kf(g,[[frame,value,ease?],...])` keyframes, springs `sp(g,start,SNAP|SOFT|HEAVY|FIRM)` (0 before start, with
overshoot), `ring(g,t0,freq,decay)` decaying wobble, `impact(g,t0,amount,dur)` → `[sx,sy]` squash, `drop(g,land,
height,fall)` falling landing with one bounce, `strike(g,hit,...)` press with wind-up, `drift(g,seed,period)` idle
drift, `hop(g,t0,height,dur)`, `camPath(g,start,[{at,dur,to,ease}])` directed camera, `camKick(g,[hits],amount)`
1–2 % zoom response to a heavy hit (multiply the zoom), `frameRect(x0,y0,x1,y1,margin)` → a Cam that frames a box.

`lib/camera.tsx` — `Camera`, `Cam {cx, cy, zoom}`, `Layer depth` (0 far … 1 subject plane … >1 foreground; parallax),
`worldToScreen(cam, x, y, depth)` → screen `{x, y, scale}` (use it to put screen-space things — the stamp hand, a
travelling highlight — exactly on a world object).

`components/Character.tsx` — `Character` (new props: `life` 0..1 idle drift and eye saccades — lower it while a
character performs a precise action; `eyeDarts`), `mixPose`, `IDLE`, `reach(ch, side, worldX, worldY, elbow?)` →
an `Arm` that puts the hand exactly on a world point (two-bone IK; side 1 = the character's right / viewer's right,
-1 = left), `handWorld(ch, arm, side)`. Use `reach` for every contact: a hand on a card, a finger on a button, a
hand on a lever. `holdL/holdR` attach a prop to a hand.

`components/v2/` — `StampArm` (point-of-view arm with a rubber stamp; per-hit timing via `shapes`; aim it with
`worldToScreen`; teal sleeve = "you, checking"), `RollingNumber` (odometer digits for scores / counters),
`DrawBox` (marker frame that draws itself on, for document evidence), `CatalogueV2` + `IndexCard` (card catalogue with
a deep drawer and a rising card), `AnswerSlip` (`AnswerSlipArt`, `SlipOnScreen`, `SLIPS`, `SLIP_A_FINAL`: the three
answer slips from the cold open — use these whenever a slip appears so they look identical everywhere).

`components/Props.tsx` — `Marked` spans now support `mark: 'ring'` (+ `tone`) for a marker loop round a word and
`pulse` for a glow on a highlight; `RingMark` on its own. `lib/measure.ts` — `textWidth(text, cssFont)` and
`useFontsReady()` (call it in your scene component if you measure text) so highlights and travelling marks can land
exactly on words. `components/Sets.tsx` — `CounterSet` gained `signRotate`, `counterNudge`, `wallExtra`, and the
walls / counters now extend 400 px further so camera moves never find a set edge.

## 5. Shot rules

1. Every sentence: setup → action → reaction → secondary → next development. Primary motion carries the meaning;
   secondary motion supports it (a character reacting, a prop settling); background life is small (idle drift,
   blinks, a light, a slow mechanism). Never everything at once.
2. The camera moves only to serve a sentence (reveal, follow, emphasise). It never moves while something important
   lands; it eases in and out (`E.inOut`, 14–24 frames); one move per idea. Use `camPath`.
3. Framing: nothing important cropped; text never cut by the frame; characters fully in or clearly out (no slivers,
   no tangents with the frame edge or with each other); no props half-entering; no accidental empty halves of the
   frame. Check every framing against every element's world rectangle (do the arithmetic, then verify in stills).
4. Arrivals are physical: anticipation → acceleration → deceleration → overshoot → settle. Impacts squash, recoil,
   settle, and the thing that was hit responds (jolt, flutter, counter nudge). No opacity fades for physical objects
   (fades only for light, glow, dimming). Heavy things move later and slower.
5. No ghost pre-reveals: text appears on its cue, never at partial opacity before it.
6. Contact is real: hands touch what they move (use `reach`); stamps print where they hit; rings enclose the word
   they mean (attach them to the span, or measure).
7. Documents: never treat the whole page as equally important. Push into the exact title / year / table entry being
   discussed, dim or recede the rest, and draw the attention mark on cue.
8. Muted test: with the sound off, a viewer must still follow the scene's point.

## 6. Readability (phone)

On a phone the 1920×1080 frame is about one third size. Measure on-screen size = world size × zoom (× layer scale).
- Critical text (the point of the shot, answers, scores, labels the narration refers to): ≥ 44 px on screen.
- Body text being read (document excerpts, slip text in its close-up): ≥ 34 px on screen.
- Guard-rail text (sources, dates, model labels, "illustrative"): ≥ 30 px on screen when it is on screen.
- Tiny decorative text is fine only if nothing depends on reading it.

## 7. Factual guard rails (do not change)

Exact model labels and date: GPT-4o, DeepSeek-R1, Llama-4-Scout, 9 May 2025, no web search. Illustrative labels stay
labelled. "not necessarily more correct" stays. Kalai = kuh-LIE. 9/10 = the paper's mid-2025 benchmark sample. Quiz:
7 vs 6, then with a penalty 4 vs 6. Real document crops in `public/img/` are shown as they are (crop/zoom only).

## 8. Sound cue sheet (required)

Export `export const SFX: Sfx[]` from your scene file (`import {Sfx} from '../lib/sfx'`), built from the same cue
constants as the animation, one entry per physical event, frame-accurate at the contact. Kinds are listed (with
meaning) in `lib/sfx.ts`; pick the closest; never invent a kind. Give sequences variety with `pitch` and `gain`
(e.g. three marks rising in pitch; the third stamp `stamp_heavy`). Add your scene's ambience once (`amb_*`, from the
scene start, `dur` = scene length in seconds) if the scene has a room (counter, conveyor, library, game show,
machine). Be selective: no sound for every small move, no whoosh on every camera move. See S1's `SFX` for the model.

## 9. Transitions and hand-offs (Main.tsx `TRANSITIONS`, `lib/handoffs.ts`)

| boundary | type | what each side must do |
|---|---|---|
| S1→S2 | cut | S1 lifts slip A to `HANDOFF` (S1 `liftPose`); S2 starts with the slip there. |
| S2→S3 | reveal 14 f | S3 is mounted 14 frames early UNDER S2, whose title card swings up and away. S3's first 14 frames (from `scene('S3').from - 14`) must already be a clean, living establishing shot of the conveyor. |
| S3→S4 | cut (match) | S3 ends pushing into the token `H34.word` until it sits exactly at `H34` (centre, font size) on its last frame. S4's first frame shows the same word at the same place/size on a book-spine label, then S4 pulls back to the library. |
| S4→S5 | wipe 12 f, edge travels left | S4's last beat: the sealed slip is slid out of frame to the left (paper whoosh); S5 is revealed from the right behind it. |
| S5→S6 | iris 18 f from the lens | S5 ends with the checker's magnifier lens centred on `H56` (inner glass radius `H56.r`) for ≥ 9 frames before `scene('S6').from`. S6's first frames show a spotlight pool centred on `H56`. |
| S6→S7 | wipe 10 f | S6 holds its resolved payoff; S7 is clean from its first frame. |
| S7→S8, S8→S9 | wipe 10 f | crisp, short; start the next ambience under the wipe. |
| S9→S10 | cut (match) | S9's last frame: slip A via `SlipOnScreen` at `H910` with its `stamp`; S10's first frame identical, then S10 carries it back to the counter. |

Wipes and irises are centred on the boundary, so the outgoing scene renders `dur/2` frames past its `to` and the
incoming one from `dur/2` frames before its `from`: keep both sides alive (not frozen) through that overlap.

## 10. Verifying your scene (required before you finish)

- `cd work/<SCENE>/source && SCALE=0.5 node stills.mjs <abs_out_dir> <frames...>` renders stills (frames can be
  numbers or `word:s21:quiz.+4`, `seg:s21`, `segend:s21-3`, `scene:S6+10`). `python3 ../../../tools/sheet.py <dir>`
  tiles them into labelled contact sheets you can view. Check every beat: at least one still per sentence plus the
  frames around every landing, impact and camera move, and the first / last frames (hand-off spec).
- `../../../tools/scene_clip.sh . <SCENE> <abs_out_dir>` renders the scene at half resolution and runs
  `qa_dense.py`: read `motion.json` (still runs ≥ 0.8 s and what is said during them) and the dense sheets. Target:
  no still run longer than ~1.2 s unless it is a deliberate hold you can name; still share well under V1's.
- Read your stills like a picky director: crops, tangents, slivers, overlaps, text size on screen, hands not
  touching, things popping, dead holds, two things competing. Fix and re-render until clean.

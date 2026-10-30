# FGW 10-Hook Preview Round: shared production brief

This brief applies to every hook. Each hook is produced independently: its own scene and its own audio, rendered
from its own entry point. The ten hooks compete with each other, so each needs the same level of care, including the
anatomically hard ones.

Project root: `Future_Got_Weird/hook-previews-10/` (call it `$P`).

## What each hook is

- One continuous **6.0 s** animated scene (180 frames, 30 fps, 1080 × 1920) for a YouTube Short opening.
- The narration line is locked and already recorded. Its word timings are in `source/src/data/hNN_words.json` (seconds;
  speech starts at 0.06 s and ends by about 4.7 s). **Do not change the narration or the words file.**
- This is not a full video and not a trailer: it has no title card, no logo, no end card and no call to action.

## Files you own (touch nothing else)

- `source/src/hNN/**`: your scene. `Hook.tsx` must export `Hook: React.FC<HookProps>` and render through
  `HookFrame` (the shared wrapper: background, gentle vignette, captions, audio). Put every helper, rig and asset you
  write or copy inside `source/src/hNN/`.
- `tools/audio/hNN.py`: your effects and ambience, built with `tools/audio/sfxlib.py` and mixed with
  `mix('NN', fx, amb, fx_lufs=...)`. See `tools/audio/h00_example.py`. You may add generators inside your own script.
- `production/hNN_NOTES.md`: your notes, in the format described under "Notes file".
- `qa/hNN/`: your QA output.

The shared files are **read-only for you**: `source/src/shared/*`, `tools/*.py`, `tools/*.sh`, `source/stills.mjs`,
`tools/audio/sfxlib.py`, and the data and narration files. If you need a variant of a shared helper, copy it into your
own folder. Do not run `git` commands that change anything (no add, commit, checkout, reset or stash). Other people
are working in the same tree at the same time.

## Tools

```sh
cd $P
tools/sheet.sh NN /path/out.png "0-179/15" true 6        # labelled contact sheet of chosen frames (spec "a-b/step" or "f1,f2")
(cd source && node stills.mjs NN /path/dir "0,45,90" true 1)  # full-resolution stills (scale 1) for close inspection
python3 tools/audio/hNN.py                                 # writes source/public/audio/hNN_mix.wav + audio/mix/hNN_measure.json
CONC=2 tools/render.sh NN                                  # final render -> exports/FGW_HOOK_NN_<SLUG>.mp4 (fixed settings)
python3 tools/qa_clip.py NN                                # QA of the RENDERED file -> qa/hNN/{qa.json,first.png,last.png,sheet.png}
```

- To view an image, open the PNG with the Read tool. Sheets take about 20 s; a final render takes 20 s to 3 min.
- Use `CONC=2` for renders, because ten hooks share 4 CPUs.
- To check types: `cd source && npx tsc --noEmit -p . 2>&1 | grep "src/hNN/"`. Fix your own errors; ignore errors
  from other hooks.
- `tools/render.sh` refuses to run until your mix exists. Write `tools/audio/hNN.py` before the final render.

## Established visual language (study it before drawing)

Look at these reference sheets with Read. Each shows the first 6 s of a winning Short, one frame every 0.5 s:
`/tmp/claude-0/-home-user-Youtube-videos/f494a593-afd8-5938-88ab-f8f09aa8e111/scratchpad/ref/videos/sheets/`
`FGW_Cyborg_Cockroach_V5.png`, `FGW_Dead_Spider_V6.png`, `FGW_Zombie_Ant_V4.png`, `FGW_Laser_Voices_V6.png`,
`FGW_Glass_Climbing_V3.png`, `FGW_Infrared_Contacts_V2.png`. The full MP4s are next to them in `videos/`; extract more
frames with ffmpeg if you need them.

The style:
- High-quality 2D vector illustration (inline SVG in React) with restrained 2.5D layering. Subjects are fully
  rendered with **gradient shading** (light from the upper left, warm highlight, cool saturated shadow) and a **thin dark
  ink contour** (`#172B3A`; see `source/src/shared/ink.tsx` and `color.ts`: `lit`, `shade`, `mix`, `rgba`).
- Crisp, readable subjects against simple, muted, softly graded backgrounds (dark teal or green labs, soft
  out-of-focus environment layers for parallax, a soft contact shadow under the subject).
- Detailed but clean **cross-sectional anatomy** for cutaways (Zombie Ant's muscle fibres, Cockroach's internals).
  Cutaways are revealed **locally in the current view** (a soft clearing or a cut window on the subject itself) as the
  camera keeps moving. Never cut to a different diagram.
- Smooth, deliberate, eased camera motion (`ss5`, `keyS`, `keyCR` in `shared/lib.ts`): push-ins, follows, pull-backs.
  Velocity carries across moves. No whips, spins, flashes or blanket crossfades.
- Organic motion that never stops: breathing, leg cycles, flexing, fluid, particles, subtle parallax.
- Not 3D CGI, not glossy plastic, not videogame rendering.

Learn the code patterns from the existing projects. Read only what you need:
- `Future_Got_Weird/zombie-ant/source/src/` (local): an insect rig with 3D-projected limbs (`core/three.ts`, `core/draw3.tsx`,
  `ant/rig.ts`, `ant/draw.tsx`, `world/gait.ts`), muscle-fibre cutaways (`fungus/`), and the forest environment.
- `/tmp/claude-0/-home-user-Youtube-videos/f494a593-afd8-5938-88ab-f8f09aa8e111/scratchpad/ref/cyborg-cockroach/Future_Got_Weird/cyborg-cockroach/source/src/`:
  the canonical cockroach (`v2/roach/Roach2D.tsx`, `v2/roach/Gear2D.tsx`, `lib/shade.tsx`, and
  `production/V5_CANONICAL_MODEL.png` one level up from `source`).
- `.../ref/dead-spider/Future_Got_Weird/dead-spider/source/src/`: segmented legs (`dc/limb.tsx`, `SpiderDraw.tsx`,
  `dc/shade.tsx`) and the lab environment (`v6/env3.tsx`).
- `.../ref/infrared-contacts/Future_Got_Weird/infrared-contacts/source/src/`: the eye, the contact lens and the eyelid art
  (`v2/Eye2.tsx`, `v2/Section2.tsx`, `art/Lead.tsx`, `theme.ts`).
- `Future_Got_Weird/glass-climbing/source/src/v3/` (local) and `.../ref/laser-voices/.../source/src/v6/rig/Crew6.tsx`:
  the Weird Crew human rigs (consistent proportions, hands, hair and faces).

Do not invent a new Weird Crew character design. Reuse or adapt an existing human rig when a person is needed.

## Absolute prohibitions

These must not appear anywhere:
- floating explanation bubbles;
- radial diagrams;
- generic "AI" circles or rings;
- labels, arrows with text, or decorative text near objects (the burned-in captions are the only text);
- prolonged static shots (QA flags any near-static run over 0.5 s);
- random camera whips;
- heavy motion blur;
- choppy transitions or hard cuts to another representation;
- morphing or disappearing body parts;
- crossing or broken limbs;
- unexplained perspective changes;
- lingering after the narration has moved on;
- an intro, logo, watermark or end card.

The audience learns by watching objects move, change and interact.

## Pacing (every hook)

- **0.00–0.50 s.** Frame 0 already shows something extraordinary happening or about to happen. The subject is large
  and immediately recognisable. There is no establishing shot and no fade-in from black: frame 0 is a full, rich image.
- **0.50–2.00 s.** Immediately understandable visual proof of the claim: a strong action, reveal or transformation.
- **2.00–4.00 s.** A new layer: the internal mechanism, an unexpected physical consequence, or a dramatic perspective
  shift, reached by a continuous, spatially motivated move.
- **4.00–6.00 s.** A satisfying reveal that also leaves the viewer wanting the full story. Keep moving to the last
  frame: the final frame should feel like a moment in motion, not a held end card.
- Meaningful visual progression roughly every second. A camera drifting over a static image doesn't count.
- Sync visual beats to the words. Read the word starts from `hNN_words.json` (for example, import it and use
  `wordAt(W, 'tongue', 1).start`) rather than hard-coding times.
- The first two seconds must work with the sound muted.

## Captions

- `HookFrame` draws the channel captions (two phrases, split at the ellipsis). Choose `capY`, the vertical centre in px
  (a number, or one value per phrase), so the caption never covers the key action. It must stay between 260 and 1560
  (the Shorts safe area).
- Hook 06 has no ellipsis. Pass `breaks={[6]}` so the phrases are "This parasite turns a snail's eyestalk" and "into a
  pulsing lure for birds."
- The emphasis words are set in `production/LINES.json`. Don't change them.

## Audio

- Narration is fixed (voice at −16 LUFS, starting at 0.06 s). You build the effects and ambience only.
- Choose effects that emphasise the key physical actions: organic movement, metallic clicks, underwater pressure, sharp
  biological transformations, subtle eerie tone.
- Keep effects under the narration: the mixer normalises the effects bus and ducks it under speech.
- Use `fx_lufs` between −30 and −24, and stay near −27 unless the hook clearly needs more or less.
- No music bed that starts and stops. No cartoon sounds. No whooshes on camera moves.
- Time effects to your animation's events. Keep the event times in one place in your Hook source and mirror them in
  `hNN.py`.

## Quality control (do this; don't just write code)

Before finishing:
1. Render the final clip with `tools/render.sh`, then run `tools/qa_clip.py`. All checks must pass. If
   `no_static_run` fails, fix the scene rather than the threshold.
2. Inspect the **rendered** frames, not just the source: `qa/hNN/first.png`, `qa/hNN/last.png` and `qa/hNN/sheet.png`.
   Also inspect full-resolution stills at each transition and every quarter second through any complex anatomy.
3. Reject and repair any of these:
   - a boring or confusing first frame;
   - a subject too small to recognise at first;
   - wrong anatomy (count the legs, check joints, eyes, mouthparts and body segments);
   - jerky or over-fast camera moves;
   - disconnected transitions;
   - static moments;
   - glitching legs, eyes or objects;
   - effects that hide the mechanism;
   - captions over the action;
   - anything scientifically misleading.
4. Iterate. Plan at least two full review-and-fix passes on your own rendered frames. Look at the images critically,
   as the viewer would on a phone.

## Notes file (`production/hNN_NOTES.md`)

Keep it short:
- the shot plan by time window (0–0.5, 0.5–2, 2–4, 4–6) with the word sync used;
- a transition list (outgoing → incoming → new information → kept);
- science notes: what is shown, what was deliberately not shown, and sources;
- assets reused (with paths) and anything newly drawn;
- an audio cue list;
- QA results (paste the qa.json summary) and what you fixed between passes;
- known limitations, honestly stated.

## Final report (your last message)

Report:
- the output path, and whether `qa_clip.py` passed;
- a three-line description of the opening frame, the 2–4 s layer and the ending;
- the known limitations.

Do not claim anything you didn't verify from the rendered file.

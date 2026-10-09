# Scene builder brief, v2 pass (Video 02)

You rebuild part of an animated explainer, "How Cameras See Around Corners" (anonymous channel Future Got Weird; never
put anything about the channel owner on screen). v1 is finished; the v2 pass re-edits it into 13 new scenes V1–V13 from
a new script and a new shot plan. Remotion 4.0.533, React 19, TypeScript, 1920×1080, 30 fps.

## The governing documents (read in this order)

1. `../../../v2/REVISION_BRIEF.md`: the owner's brief. Its sections on the opening, visual teaching, labels, transitions
   and characters are binding.
2. `../../../v2/SHOTPLAN_V2.md`: **your scene's rows are your brief**. Read its "Global rules" in full.
3. `../../../v2/SCRIPT_V2.md`: the spoken lines (ids s.. are v1 takes; n.. are new), with each line's direction.
4. `../../../v2/EVIDENCE_BRIEF_V2.md`: what may be shown and said about each real result, which conditions stay beside
   it, and the four contexts that must never merge (R8 kit track, R10 ams waveform and U, R1 separate test, I1 our room).
5. `../../../v2/EDIT_MAP.md` §2: which v1 shot each v2 shot comes from.
6. The v1 rules that still hold: `../../../SCENE_BRIEF.md` ("Pictures", "Sound cue sheet", "Determinism"), and the v1
   source of the shots you adapt (`src/scenes/S*_*.tsx`, `src/components/v02/*`). v1 reviews say what went wrong
   before: `../../../qa/DEFECT_LOG.md`, `../../../qa/REVIEW_R2.md`, `../../../qa/REVIEW_R3.md`.

## Where you work

- Your isolated copy: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/<GROUP>/source` (node_modules is a
  symlink; never run npm install).
- Edit **only** your scene files `src/scenes/V<n>_<Name>.tsx` (a stub exists for each; keep its exported component name
  and `export const SFX: Sfx[]`).
- Create new files only as `src/components/v2s/V<n>_<Name>.tsx` (prefix = one of your scene ids).
- Everything else is read-only:
  - the v1 components (`src/components/v02/*`), which you may import or copy into your prefixed files;
  - the v1 scene files (`src/scenes/S*.tsx`), which you may read and copy from but **never import**: their
    module-level cues name v1 lines that are no longer in the timeline and throw at load;
  - the shared v2 kit (`src/components/v2k/*`; read `src/components/v2k/KIT_V2.md`);
  - `lib/*`, `Main.tsx`, `Root.tsx`, `theme.ts`, `data/*`.
- If you need a variant of a shared component, copy it into your prefixed file.
- `npx tsc --noEmit -p .` must pass in your copy before you finish. Do not commit or push; the lead merges your files.

## Timing

The timeline is **final**: measured word timings from the recorded narration (`src/data/timeline.json`; scenes V1–V13).

- `useG()` gives the global frame.
- Cue every beat from narration words, defining all cue frames once at module level (`const K = {...}`) from `at()`
  calls and deriving every beat from them. Never hard-code absolute frames.
  - `at('n11', 'nanosecond')` is the start of a word; case and punctuation are ignored.
  - `at(seg, word, 2)` is the 2nd occurrence; `at(seg, word, 1, 'end')` is the end of a word.
  - Also available: `segEnd(id)`, `seg(id).from`, `scene('V5').from/.to`.
- List your words first:
  `python3 -c "import json;t=json.load(open('src/data/timeline.json'));[print(s['id'],s['from'],s['to'],' '.join(f\"{w['w']}@{w['from']}\" for w in s['words'])) for s in t['segments'] if s['scene'] in ('V1','V2')]"`
- The shot plan's times are estimates. Fit each shot to the real cue words; when an action needs more frames than the
  gap allows, shorten it from the cues (`Math.min(...)`).
- **Scene mounting.** Your scene is mounted from `scene(id).from` to `scene(id).to`. Every scene starts 0.35 s before its
  first word, except the first (frame 0) and V13 (0.2 s before s48). The boundary between two scenes is a hard cut
  unless `Main.tsx` TRANSITIONS says otherwise.
- **Matches.** For a match transition (shot plan "Out" column), the outgoing scene's last frame and the incoming
  scene's first frame must line up at the stated screen positions. Agree on those positions with the shot plan's
  numbers, and state them in your report.

## Pictures (v2 additions to the v1 rules)

- **Labels.**
  - Key teaching labels are 64 px (60–72) in V1–V4 and on every evidence board; secondary labels 40–48 px; source
    lines, chips and tags 30–34 px.
  - At most three teaching labels at once in the first minute. Labels cut or fade in (no springing, no word-by-word
    text). Settled labels do not move.
  - Keep teaching content out of y 950–1080 (captions) and inside x 96–1824, y 54–950.
  - **Phone check:** downscale your stills to 390 px wide (`ffmpeg -i in.png -vf scale=390:-1 out.png`) and read them.
    Every key label and evidence trace must be legible at that size.
- **One teaching visual per beat.** No washed-out inactive panels; in a comparison each panel is introduced alone
  first. Room views establish place; the mechanism is taught on full-frame schematics.
- **Question titles.** Use `QuestionTitle` from the v2 kit: one line, 64 px, top-left, for the spoken question line
  only.
- **Real data versus our pictures.**
  - Real-data boards use the house evidence style with the headline "Real data" at 64 px, no cartoon characters, and a
    one-line source.
  - Our schematics carry a chip ("illustration" / "simplified picture").
  - Every switch between the two is a hard cut or a match in which the style visibly changes.
  - The R8 track is always `stored_xz` from data index 6, every 2nd frame, one plotted position per video frame, no
    interpolation, tagged "sped up" (the kit's `RealTrackBoard` does this).
- **Characters have jobs.** The guesser's beliefs are acted, not captioned; the checker taps and points at the result.
  - Anticipation, contact, reaction, settle. Hands meet props, feet plant, gaze goes to the subject.
  - No perpetual bobbing, no constant zooms, no particles for activity's sake.
  - A camera move must change what the viewer understands.
- **Light and geometry.**
  - Straight segments from `layout.json` points, never across or through the partition; keep `assertAroundTheEnd`
    (at module load) for every tilt at which you draw room light.
  - W1 appears only in full-frame plan views; in the raised room view use W3 or W4 with no number.
  - Candidate arcs are dashed, centred on the wall spot, and may cross the partition (they are constraints, not
    light).
- **Numbers.** I1 numbers (8.9 ns, 2.65 m, 1.33 m, bands, region sizes, the 0.86 m smear, the 30% shrink) appear only on
  our plan, marked "illustrative". Exact label wording is in the shot plan: reuse it.
- **No generated pixels.** No ChatGPT plates and no Runway inserts are on screen.
- **Determinism.** Everything is a pure function of the frame; seeded `rand()` only.

## Sound cue sheet

Export `export const SFX: Sfx[]` from the same cue constants, with one entry per physical event, frame-accurate at the
contact.

- Use the shot plan's trimmed vocabulary: footsteps, the schematic pulse/return motif, a few prop contacts (tap, mirror
  ting, rope clip, clink, padlock click, shutter), restrained comic reactions (duck, gulp), and the robot's motor and
  brake.
- Pick kinds from `SFX_KINDS` in `lib/sfx.ts` (never invent one). Vary repeats with pitch and gain.
- Add your set's ambience once per scene.
- No whoosh on cuts, no riser per label. Fewer, better sounds than v1.

## Verify (required: at least three render-inspect-fix rounds)

- **Stills:** `cd <your copy> && ONLY=V1,V2 SCALE=0.5 node stills.mjs /home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/v2/<GROUP>/r<N> <frames...>`.
  Frames may be numbers, `word:n11:nanosecond+6`, `seg:n11`, `segend:n11-10` or `scene:V5+30`. Batch 10–20 frames per
  call. Read the PNGs, and their 390 px versions.
- **Motion:** `cd /home/user/Youtube-videos/Future_Got_Weird/Video_02 && bash tools/scene_clip.sh work/<GROUP>/source <SCENE> qa/v2/<GROUP>/clip_<SCENE> 0.5`
  for each of your scenes. It writes a muted half-res clip, dense contact sheets (3 fps with the spoken words) and a
  motion report. Read the sheets. Check that:
  - every shot's action develops with its line;
  - nothing pops, flashes or resets;
  - camera moves keep text and characters in frame;
  - hands touch and feet plant;
  - holds are deliberate.
- **Checks:** text sizes against the rules, the caption band, the phone check, every label's wording against the shot
  plan and the evidence brief, and light-path legality.

Return:
- what you built, shot by shot, with cue words;
- files created;
- match positions at your in and out cuts;
- deviations from the shot plan, and why;
- known limitations;
- the SFX count;
- the paths of the final contact sheets you inspected.

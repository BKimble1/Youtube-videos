# Future Got Weird: This Car Jumps Without a Ramp (U9)

Approved concept: `FGW_U9_Final_Production_Prompt.md` (owner's brief, 18 Oct 2026). A 2:14 factual explainer about
BYD's Yangwang U9 and DiSus-X active body control. A genuine stationary hop opens the video; the forces that launch
it lead into body control in corners, under braking and over rough roads, and the real hop closes it.

## Status (19 Oct 2026)

**Final pass done.** `exports/FGW_U9_FINAL_4K.mp4` is rendered natively at 3840×2160, 30 fps (Remotion `--scale=2`; the vector
art and text are drawn at 4K). The real BYD shots (owner's screen recordings, release `u9-source-footage`) are 1080p sources
cropped and enlarged, so they are not native 4K picture; `footage/README.md` has the provenance, crops and limits. The approved
narration (ElevenLabs Test Voice, 134.16 s) is unchanged: the same stitched audio, no re-records, no time-stretch.

Nothing is published or uploaded. `QA_REPORT.md` says what was measured, what was inspected frame by frame, and what could not
be done here (normal-speed audiovisual playback).

| What | Where |
|---|---|
| Script (spoken text, display spellings) | `script/script_v1.md`; plain transcript `script/transcript_v1.txt` |
| Claim ledger and sources | `research/claim_ledger.md` |
| Narration: 24 takes, scores, Scribe words, selection and stitch | `audio/narration/` (`take_scores.json`, `narration_edit_log.json`, `narration_words.json`), `tools/score_takes.py`, `tools/stitch_narration.py` |
| Sound events, score + effects, mix, masking check | `audio/sfx_events.json`, `tools/make_bed.py`, `tools/mix.py` (→ −15 LUFS / −1.5 dBTP), `audio/mix/mix_measure.json`, `audio/mix/speech_mask.txt` |
| Captions | `captions/FGW_U9_JumpsWithoutRamp.srt` |
| Title, description (source links), chapters | `upload/UPLOAD_TEXT.md` |
| Thumbnail | composition `Thumb` (`source/src/dev/Thumb.tsx`); `thumbnail/FGW_U9_thumb_FINAL_1280x720.jpg` |
| Credits and rights | `production/CREDITS.md` |
| Footage provenance, crops, limits, intake tools | `footage/README.md`, `tools/ingest_footage.py` (`cut`, `cut2`) |
| Editable source | `source/` (Remotion 4.0.533, same lockfile as the robots episode); composition `Main` |
| QA | `QA_REPORT.md`, `tools/qa.py`, contact sheets in `qa/` |

### Source layout (`source/src/`)

- `cues.ts`: narration word cues (from `data/words.json`)
- `sim/launch.ts`: vertical two-mass hop model (tyres push but never pull, travel stops, actuator force)
- `sim/halfcar.ts`: half-car model for the rough road (sky-hook-style active force with a cap)
- `car/`: the vector U9, one drawing per angle: `side.tsx` (side), `front.tsx` (front elevation), `loft.tsx` (three-quarter and
  rear, lofted from the side trace), `geom.ts` (dimensions and shapes), `parts.tsx` (wheel, strut, actuator, arrows)
- `kit/`: camera and stage, `proving.tsx` (the proving ground in four looks: pad, corner, brake, rough), 3D track and camera
  helpers, timing helpers, the Crew rig and looks (copied from the robots episode)
- `shots/`: `Launch` (0:00–0:42), `Bend` (0:42–1:10), `BrakeRough` (1:10–1:33), `Cabin` + `CabinCutaway` (1:33–1:48),
  `Callback` (1:48–2:00), `Closing` (2:00–2:14)
- `footage.tsx`: the real shots (`REAL`, `FILM`), their in-points and the alignment of the vector car to them
- `events.ts`: sound-event times taken from the shots

## Rebuild

Needs Node 22, ffmpeg, Python 3 with numpy and scipy, and the Playwright headless shell (path in `source/remotion.config.ts`).

    cd Future_Got_Weird/this-car-jumps-without-a-ramp
    (cd source && npm ci)
    python3 tools/score_takes.py                  # takes vs script -> audio/narration/take_scores.json
    python3 tools/stitch_narration.py             # selected takes -> narration + word cues (already done; the approved narration stays as is)
    (cd source && node ../tools/export_events.mjs)  # sound events from the animation -> audio/sfx_events.json
    python3 tools/make_bed.py                     # score + effects, ducked under the words
    python3 tools/mix.py                          # -> audio/mix/mix.wav (-15 LUFS, -1.5 dBTP)
    python3 tools/speech_mask.py                  # where the bed comes within 6 dB of the voice
    python3 tools/make_srt.py                     # captions
    python3 tools/ingest_footage.py cut && python3 tools/ingest_footage.py cut2   # real shots -> source/public/footage (needs footage/source/)
    bash tools/render_master.sh                   # -> exports/FGW_U9_FINAL_4K.mp4 (3840x2160, 30 fps)
    bash tools/render_review.sh                   # 1080p review copy, not for upload
    python3 tools/qa.py exports/<file>.mp4        # measured QA

Stills: `cd source && COMP=Main SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`. The thumbnail is
`COMP=Thumb SCALE=1 NO_SHEET=1 node stills.mjs ../qa/thumb 0`, then scale it to 1280×720.

## Decision log

| Date | Decision | Why |
|---|---|---|
| Oct 18 | Kept the script as written | All 363 words record cleanly; no factual correction was needed (BYD's release lists braking, acceleration, cornering and road impacts) |
| Oct 18 | No numbers on screen or in narration | Sources disagree on travel; none of the figures helps the explanation (brief, constraint 6) |
| Oct 18 | Physics from small simulations, not hand-keyed | Ground force, gravity, takeoff, landing, travel limits and wheel-vs-cabin motion stay consistent with each other |
| Oct 18 | Passenger = clerkB from the Crew | An established character, drawn with the unchanged rig |
| Oct 18 | Sound reuses the channel's in-house score and the Roadster effects library | Same palette as the recent episodes; effects only on visible actions |
| Oct 19 | Real shots from both recordings, none repeated | Opening hop, question inserts, cornering, the full side jump, a front three-quarter, the drive-away |
| Oct 19 | Cabin rebuilt as a clean cutaway | The earlier view through the windscreen hid the passenger behind dark pillars. Now: a round cutaway opens in the windscreen and shows the driver, seat, belt, dash and one anchored arrow; two bars show lean falling while the sideways force stays the same |
| Oct 19 | One angle-specific drawing per view | The front sprite was rebuilt from BYD's front views (low, wide, shallow screen); the three-quarter is lofted from the same side trace |
| Oct 19 | Second tyre-wall wipe replaced by a speed whip | Keeps one tyre wall (into the bend) and uses the car's own speed to carry the cut into the cabin scene |
| Oct 19 | Narration, wording, voice and timing untouched | The approved recording is the fixed clock the picture is built on |

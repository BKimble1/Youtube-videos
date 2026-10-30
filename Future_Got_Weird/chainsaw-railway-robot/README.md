# Future Got Weird — Japan Built a Robot With a Chainsaw for an Arm

## V2 (30 Oct 2026): targeted previsualization improvement — current review

V2 keeps the locked narration and its timing exactly (2:34.83, 4,645 frames) and rebuilds only what the review asked:
- opening physical errors (wrapped grip, bar sinking into the kerf, chips from the kerf entry) and FS-1 split into
  five footage beats;
- a continuous grip → cut → weight → lift operation (0:45–1:07);
- the bilateral-control loop as a journey through the machine (1:07–1:28);
- a clearer safety handover (1:36–1:54);
- the equipment shown large and readable with a fixed date rail (1:53–2:19);
- a hand-matched ending (2:19–end).

Still a **previsualization**: no authentic footage is cleared, and every stand-in carries a PREVIS tag.

| Deliverable | File |
|---|---|
| Review, **1920×1080** (verified stream size), 30 fps | `exports/FGW_Chainsaw_Robot_V2_PREVIS_REVIEW_1920x1080.mp4` (Git-ignored; checksummed 20 MB parts in `backup/`) |
| Change report (timestamped) and measured QA | `production/V2_CHANGE_REPORT.md`, `qa/v2/review_qa.json` |
| V1 vs V2, the five review sections | `qa/v2/compare/*.png` |
| Shots still waiting for real footage | `production/FOOTAGE_EDIT_PLAN.md` |
| Mix | `audio/mix/FGW_Chainsaw_Robot_V2_mix.wav`, `audio/mix/mix_measure_v2.json` (cues: `audio/cues_v2.json`) |

Rebuild V2: as V1 below, with `NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues_v2.json`,
`FGW_VER=V2 python3 tools/make_audio.py`, the `ChainsawRobotV2` composition, the V2 mix in the mux, and
`python3 tools/qa.py <export> qa/v2/review audio/cues_v2.json`; `python3 tools/compare.py <v1> <v2> qa/v2/compare`.

**Next step (stopping rule):** clear and integrate authentic footage and do the final sync, not more animation
passes.

## V1 (30 Oct 2026): previsualization review

**Status.** A complete V1 **previsualization** review is rendered: locked narration, full picture, sound, captions
and QA. It is **not publishable as a documentary**. Every shot meant to carry authentic footage is an original
illustration in a labelled source-footage slot (orange `PREVIS` tag and viewfinder corners). The source footage could
not be screened from this environment, and no reuse rights are cleared. Details: `production/SOURCE_PROVENANCE.md`.
Not watched or heard in real time: this environment has no playback. `production/QA_REPORT.md` lists what was
measured.

| Deliverable | File |
|---|---|
| Review, 1920×1080, 30 fps, H.264 + AAC | `exports/FGW_Chainsaw_Robot_V1_PREVIS_REVIEW_1920x1080.mp4` (Git-ignored; checksummed 20 MB parts in `backup/`) |
| 4K master | **not rendered**: the brief makes the master conditional on cleared source footage and a passed V1 review. The command is below; it renders natively at 2× from the vectors. |
| Captions (external, not burned in) | `captions/FGW_Chainsaw_Robot_V1.srt` |
| Narration (48 kHz, 24-bit, mono), word timings, provenance | `audio/narration/FGW_Chainsaw_Robot_narration_V1.wav`, `audio/narration/FGW_Chainsaw_Robot_V1_words.json`, `audio/narration/voice_provenance.json`, all 16 takes in `audio/narration/takes/` |
| Mix (48 kHz, 24-bit, stereo) and measurements | `audio/mix/FGW_Chainsaw_Robot_V1_mix.wav`, `audio/mix/mix_measure.json` |
| Footage-rights ledger, blockers | `production/SOURCE_PROVENANCE.md` |
| Claim ledger | `production/CLAIM_LEDGER.md` |
| Shot list (measured times) | `production/SHOT_LIST.md` |
| Transition ledger | `production/TRANSITIONS.md` |
| QA report | `production/QA_REPORT.md` |

**Runtime: 2:34.8**, not 3:00–3:30. The locked 440 words, read in the Test Voice, take 2:31 at about 174 wpm. A
relaxed-pace retake did not slow the read. Reaching 3:00 would need about 25 s of unnarrated holds (padding, which
the brief rules out) or additional script. That is a creative decision for the creator.

## How it is built

- **One world, one choreography.** `source/src/shots/Worksite.tsx` holds the worksite (larch forest, a single
  non-electrified track, the tree and three branches) and the machine's state as pure functions of film time. The
  hook, the reveal, the two-arm action, the steel-arms match and the ending all sample it. The cabin monitors show the
  same world from the robot's head, so a grip seen in the cabin is the same grip outside.
- **The machine** (`source/src/art/Machine.tsx`): a rail-road truck with an operator cabin, a two-section boom, a
  levelled humanoid upper body with a stereo camera head, a four-finger claw (its far fingers pass behind the branch)
  and a chainsaw with a moving chain. It is an original reconstruction from text descriptions. A blue colour scheme
  marks JR West's separate machines.
- **People** use the Weird Crew rig, copied unchanged from `robot-faces/source/src/dc/`.
- **Timing.** Every event comes from the measured narration (`T('phrase')` in `source/src/lib/core.ts`; named
  times in `source/src/lib/timeline.ts`).
- **Footage slots.** `source/src/data/footage.json`. A cleared clip dropped into a slot replaces the illustration
  and its PREVIS tag (see `production/SOURCE_PROVENANCE.md` §3).
- **Sound.** `tools/make_audio.py`: effects placed from the picture's own events (`audio/cues.json`, exported by
  `tools/export_cues.ts`); ElevenLabs one-shot effects; a granular chainsaw sustain driven by the picture's
  run/cut envelopes; synthesised beds; voice-keyed ducking; −14 LUFS.

## Rebuild

    cd Future_Got_Weird/chainsaw-railway-robot
    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    # local ASR models (k2-fsa GitHub releases): sherpa-onnx-zipformer-en-2023-06-26, sherpa-onnx-whisper-base.en
    #   into $SHERPA_MODELS (default /tmp/claude-0/models)
    (cd source && npm ci)                                     # Remotion 4.0.533, pinned lockfile
    python3 tools/asr_takes.py $SHERPA_MODELS                 # screen every take against the locked words
    python3 tools/make_narration.py                           # selected takes -> master + word timings
    python3 tools/make_srt.py
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/ec.cjs
    NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py                               # mix + measurements (also source/public/audio/mix.wav)
    (cd source && npx remotion render src/index.ts ChainsawRobotV1 /tmp/v1_video.mp4 --props='{"audio":false}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p)
    ffmpeg -i /tmp/v1_video.mp4 -i audio/mix/FGW_Chainsaw_Robot_V1_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/FGW_Chainsaw_Robot_V1_PREVIS_REVIEW_1920x1080.mp4
    python3 tools/qa.py exports/FGW_Chainsaw_Robot_V1_PREVIS_REVIEW_1920x1080.mp4 qa/review/review
    # 4K master (only once the footage slots are cleared and V1 is approved): the same source at 2x
    (cd source && npx remotion render src/index.ts ChainsawRobotV1 /tmp/v1_master.mp4 --props='{"audio":false}' --muted --scale=2 --crf=17 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p)
    ffmpeg -i /tmp/v1_master.mp4 -i audio/mix/FGW_Chainsaw_Robot_V1_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/FGW_Chainsaw_Robot_V1_MASTER_3840x2160.mp4

Working stills: `cd source && ./sheet.sh out.png "t1,t2,..." [cols]`; one frame: the `FilmStill` composition
(`--props='{"t":12.5}'`).

Restore the review from its parts: `cat backup/FGW_Chainsaw_Robot_V1_PREVIS_REVIEW_1920x1080.mp4.part_* >
exports/FGW_Chainsaw_Robot_V1_PREVIS_REVIEW_1920x1080.mp4`, then check it against
`backup/FGW_Chainsaw_Robot_V1_PREVIS_REVIEW_1920x1080.mp4.SHA256SUMS`.

## Preproduction package (unchanged)

`SCRIPT_LOCKED.md` (narration authority), `PRODUCTION_PROMPT.md`, `SHOT_MAP.md`, `FOOTAGE_SOURCES.md`,
`raw/README.md`. No third-party footage is committed; `raw/*.mp4` is Git-ignored.

## Preproduction README (as committed before V1)

### Future Got Weird — Japan's Chainsaw Railway Robot

**Status:** Preproduction package committed 2026-10-30. No third-party broadcast footage committed. Real-action footage has been located, but redistribution rights have **not** been verified.

#### Working concept
- Title: **Japan Built a Robot With a Chainsaw for an Arm**
- Format: 16:9, 30 fps, approximately 3–3.5 minutes, final duration by ElevenLabs alignment
- Story: real cutting demonstration → two-tool operation → human remote control → bilateral control (JR West documented example) → working-at-height safety → 2026 JR West next generation → human-machine punchline.
- No fabricated autonomous chainsaw robot. JR East's October 2026 work footage is a *human-operated machine* introduced in March 2026.
- Preserve script word-for-word as in `SCRIPT_LOCKED.md`; if a specific sourced claim cannot be verified, report it as a blocker before changing anything.

#### Files
- `SCRIPT_LOCKED.md` — narration, unchanged from creator's preceding approved direction.
- `PRODUCTION_PROMPT.md` — Claude/ElevenLabs/Runway/Remotion production handoff.
- `SHOT_MAP.md` — action and camera design milestones, with fine-grained time windows.
- `FOOTAGE_SOURCES.md` — exact original footage URLs, usage intentions, verification and rights status.
- `raw/README.md` — staging protocol for locally obtained footage when its license or permission is cleared.

#### Source handling
The public GitHub repository is **not** a safe destination for unrestricted copies of third-party TV/news footage. Research links are sources for screening and clearing rights, NOT media files or grants of reuse permission. Do not scrape, download and commit broadcast footage before rights review. Store licensed or creator-owned originals locally or in approved private asset storage; only commit LFS content with verified rights and verified LFS upload support. Links and provenance are included for production.

#### Existing project standards
Read `../FGW_EDITING_RULES.md` and inspect `../robot-faces/` for the current working long-form Remotion/ElevenLabs conventions, rigs, pacing and QA methodology. Do not overwrite any of those existing projects.
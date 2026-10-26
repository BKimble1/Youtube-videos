# Future Got Weird: Robots Are Learning to Copy Our Faces

## V1 (26 Oct 2026)

**Status.** The first complete version is done:
- a 1080p review;
- a native 4K master, rendered from the vector source at 2×;
- a mix, an SRT and the production notes.

It is **not published**. Nobody has watched it in real time or listened to it here: this environment has no audio
or video playback. `production/QA_REPORT.md` lists exactly what was checked and how.

16:9 at 30 fps; 3:34.67 (6,440 frames). The narration is the locked 617-word script, verbatim, in the channel voice.

| Deliverable | File |
|---|---|
| Review: 1920×1080, H.264 High (CRF 16) + AAC 320 kb/s | `exports/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4` (Git-ignored; checksummed 20 MB parts in `backup/`) |
| Master: 3840×2160, rendered natively at 2× | `exports/FGW_Robot_Faces_V1_MASTER_3840x2160.mp4` (Git-ignored; delivered separately and reproducible with the commands below) |
| Captions (external; not burned in, as in the other long-form FGW episodes) | `captions/FGW_Robot_Faces_V1.srt` |
| Selected narration (48 kHz, 24-bit, mono), word timings | `audio/narration/FGW_Robot_Faces_narration_V1.wav`, `audio/narration/FGW_Robot_Faces_V1_words.json` |
| All takes and voice provenance | `audio/narration/takes/`, `audio/narration/voice_provenance.json` |
| Mix (48 kHz, 24-bit, stereo) and its measurements | `audio/mix/FGW_Robot_Faces_V1_mix.wav`, `audio/mix/mix_measure.json` |
| Locked script | `script.md` |
| Shot list (measured times) | `production/SHOT_LIST.md` |
| Transition list (keep / merge / remove) | `production/TRANSITIONS.md` |
| Sources, claim ledger, provenance | `production/SOURCE_NOTES.md` |
| QA report | `production/QA_REPORT.md` |
| Checkpoint for V2 | `production/PRODUCTION_CHECKPOINT.md` |
| Interaction still (film frame at 4.6 s, no text) | `cover/FGW_Robot_Faces_V1_interaction_still_4.6s_1920x1080.png` |

## V2 (current)

V2 rebuilds every shot on the same narration. It has 80 shots, the recording alcove and study nook settings,
physical mechanism sections, and a matched return to the opening. Runtime 3:33.333 (6,400 frames).

| Deliverable | File |
|---|---|
| Review 1920×1080 | `exports/FGW_Robot_Faces_V2_REVIEW_1920x1080.mp4` (Git-ignored; parts in `backup/`) |
| Master 3840×2160 (native 2×) | `exports/FGW_Robot_Faces_V2_MASTER_3840x2160.mp4` (Git-ignored; reproducible) |
| Captions | `captions/FGW_Robot_Faces_V2.srt` (the verified V1 SRT; timings unchanged) |
| Narration / mix | `audio/narration/FGW_Robot_Faces_narration_V2.wav`, `audio/mix/FGW_Robot_Faces_V2_mix.wav` |
| Change and QA report | `production/V2_CHANGE_QA.md` |
| Action / shot / transition map | `production/V2_TRANSITIONS.md` |

**Rebuild V2.**

    cd Future_Got_Weird/robot-faces
    source/node_modules/.bin/esbuild tools/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --outfile=/tmp/ec2.cjs && node /tmp/ec2.cjs audio/cues_v2.json
    python3 tools/make_audio_v2.py            # writes source/public/audio/mix_v2.wav
    python3 tools/v2_transitions.py
    (cd source && npx remotion render src/index.ts RobotFacesV2 /tmp/v2_review.mp4 --props='{"audio":false}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p)
    ffmpeg -i /tmp/v2_review.mp4 -i audio/mix/FGW_Robot_Faces_V2_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/FGW_Robot_Faces_V2_REVIEW_1920x1080.mp4
    (cd source && npx remotion render src/index.ts RobotFacesV2 /tmp/v2_master.mp4 --props='{"audio":false}' --muted --scale=2 --crf=17 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p)
    ffmpeg -i /tmp/v2_master.mp4 -i audio/mix/FGW_Robot_Faces_V2_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/FGW_Robot_Faces_V2_MASTER_3840x2160.mp4
    python3 tools/qa.py exports/FGW_Robot_Faces_V2_REVIEW_1920x1080.mp4 qa/v2/review/review V2
    python3 tools/strips_v2.py exports/FGW_Robot_Faces_V2_REVIEW_1920x1080.mp4 audio/cues_v2.json qa/v2/strips 2 300
    (cd source && ./shots2.sh /tmp/shots 0.5)  # mid-frame of every shot, 16 per page

The V1 description below still applies to the rigs, the shared state and the timing.

## How it is built

**Cast.** The Weird Crew's guesser is the visitor, on his existing rig (`source/src/dc/`). It is copied unchanged
from Glass Climbing V7; see `production/SOURCE_NOTES.md`. The robot is new (`source/src/art/Robot.tsx`):
- every feature sits on an ellipsoid and is projected for the head's yaw;
- the oblique, front, back and mirror views are the same drawing turned;
- the mouth is one deforming surface whose four lip curves share their corners.

**State.** One expression state per subject (`source/src/state.ts`), a pure function of the absolute frame. Every
shot samples it, so cuts never reset a smile, a blink or a gaze, and any frame renders on its own.

**The mirror.** The reflection is the same state drawn mirrored, with the yaw derived from the mirror plane
(`shots/MirrorSet.tsx`).

**Timing.** Every event is placed from the measured narration (`T('phrase')` in `source/src/lib/core.ts`).

**Sound.** A synthesised score and effects (`tools/make_audio.py`), ducked under the voice. The cue times are exported
from the picture (`tools/export_cues.ts`).

## Rebuild

    cd Future_Got_Weird/robot-faces
    python3 -m pip install numpy scipy soundfile pyloudnorm pocketsphinx
    (cd source && npm ci)                                   # Remotion 4.0.533, pinned lockfile
    # narration: selected takes -> timing master, word timings, SRT, loudness envelope
    python3 tools/make_narration.py
    python3 tools/make_srt.py
    python3 tools/envelope.py
    cp audio/narration/FGW_Robot_Faces_narration_V1.wav source/public/audio/narration.wav
    # picture timeline -> cue sheet -> mix (also writes source/public/audio/mix.wav)
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/ec.cjs
    NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py
    # review: picture without the audio element, then mux the mix
    (cd source && npx remotion render src/index.ts RobotFaces /tmp/review_video.mp4 --props='{"audio":false}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p)
    ffmpeg -i /tmp/review_video.mp4 -i audio/mix/FGW_Robot_Faces_V1_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4
    # master: the same source at 2x (native 3840x2160 vectors, not an upscale)
    (cd source && npx remotion render src/index.ts RobotFaces /tmp/master_video.mp4 --props='{"audio":false}' --muted --scale=2 --crf=17 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p)
    ffmpeg -i /tmp/master_video.mp4 -i audio/mix/FGW_Robot_Faces_V1_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/FGW_Robot_Faces_V1_MASTER_3840x2160.mp4
    # QA (all read from the files)
    python3 tools/qa.py exports/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4 qa/review/review
    python3 tools/strips.py exports/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4 audio/cues.json qa/review/strips 2 384
    source/node_modules/.bin/esbuild tools/state_continuity.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/sc.cjs && NODE_PATH=source/node_modules node /tmp/sc.cjs
    bash tools/backup_parts.sh exports/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4

**Working stills.**
- `cd source && ./sheet.sh out.png "t1,t2,..." [cols]` renders a contact sheet at the given times.
- The `FilmStill` composition renders one frame (`--props='{"t":4.6}'`).
- `RobotSheet` and `ArmSheet` are rig test sheets.

**Restore the review from its parts.** `cat backup/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4.part_* >
exports/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4`, then `(cd exports && sha256sum -c ../backup/JOINED_SHA256SUMS)`.

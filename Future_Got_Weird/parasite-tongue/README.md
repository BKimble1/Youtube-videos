# Future Got Weird Short 1: The parasite that replaces a tongue

## V2 (current)

**Final.** `exports/FGW_Parasite_Tongue_V2_1080x1920.mp4`: 1080×1920, 30 fps, 720 frames, 24.0 s.

**Review copy.** `exports/FGW_Parasite_Tongue_V2_REVIEW_timecode.mp4`, with timecode and beat labels burned in.

**QC.** `QC_REPORT_V2.md`, with evidence in `qa/v2/`.

**What changed.** One continuous 3D mouth set:
- the result shown first
- a rewind to the whole tongue
- the gill entry
- the bite
- a staged time-lapse of the tongue withering
- the anchored claws
- an interior-to-exterior move
- the meal
- a looping return

**Rebuild.** As below, then `tools/make_review.sh <final> <review>`.

## V1 (superseded)

**V1 deliverable.** `exports/FGW_Parasite_Tongue_FINAL_1080x1920.mp4` (source at commit 3246542): 1080×1920, 30 fps, 720 frames, 24.0 s.

**QC.** `QC_REPORT.md` (timestamped), with measurements and contact sheets in `qa/`.

**Script.** Approved before production and locked verbatim in `production/NARRATION_LOCKED.txt`.

**Notes.** `production/NOTES.md` covers the science, the storyboard as built and why Runway was not used.

**Narration.** ElevenLabs, the channel narrator voice: one run, two takes. The chosen take and how it was edited are
in `audio/narration/voice_provenance.json`.

**Sound.** All synthesized by `tools/make_audio.py`, with the effects log in `audio/sfx_log.json`.

**Captions.** `captions/FGW_Parasite_Tongue.srt` (not burned in).

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    python3 tools/make_narration.py                 # take -> narration master, word timeline, SRT
    (cd source && npm ci)
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py                     # effects + mix
    (cd source && npx remotion render src/index.ts ParasiteTongue /tmp/v.mp4 --props='{"audio":false}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709)
    ffmpeg -i /tmp/v.mp4 -i audio/mix/FGW_Parasite_Tongue_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart exports/FGW_Parasite_Tongue_FINAL_1080x1920.mp4
    python3 tools/qc.py exports/FGW_Parasite_Tongue_FINAL_1080x1920.mp4 <asr_models> qa/qc_measure.json

The ASR models are sherpa-onnx Zipformer en-2023-06-26 and Whisper base.en, from the k2-fsa GitHub releases.

## Contact sheets

From `source/`, run `./sheet.sh out.png "f1,f2,..." [cols]`.

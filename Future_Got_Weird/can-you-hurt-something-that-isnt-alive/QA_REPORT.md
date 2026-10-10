# QA report: Can You Hurt Something That Isn't Alive? (v1)

Status: rendered and inspected visually. Not published. Publishing is the owner's step.

## Deliverables (in exports/ and backup/v1/)
| File | Spec (measured with ffprobe) | Notes |
|---|---|---|
| FGW_CanYouHurt_v1_MASTER_4K.mp4 | 3840×2160, 30 fps, H.264, AAC 48 kHz stereo, 261.37 s, 38.8 MB | Rendered from the vector source at scale 2 (not an upscale). Backed up as parts. |
| FGW_CanYouHurt_v1_UPLOAD_1080p.mp4 | 1920×1080, 30 fps, H.264, AAC 48 kHz stereo, 261.37 s, 20.9 MB | Upload master. Backed up as parts; reassembly hash verified. |
| FGW_CanYouHurt_v1_REVIEW_720p_not-for-upload.mp4 | 1280×720, 7.1 MB | Review preview only. Labelled not for upload. |
| captions/FGW_CanYouHurt_v1.srt | 66 cues, timed from Scribe word timestamps | Text follows the spoken audio ("8th" as spoken). |
| thumbnail/FGW_CanYouHurt_thumbnail_1280x720.jpg | 1280×720 | The recovered thumbnail art, unchanged, scaled to 16:9. |
| upload/UPLOAD_TEXT.md, upload/chapters.txt | Title, description, sources, six chapters | Chapter times from the narration alignment. |

## Audio
- Narration: ElevenLabs Test Voice (kk5XaSLo2XAw0sKM98zU, eleven_v4), six blocks, two takes each, take 1 used. Transcript verified against the script (653 words; one difference fixed in the script to match the audio).
- Music and effects: in-house synthesis (tools/synth_audio.py). The Runway music and effect outputs could not be downloaded (sandbox network policy, HTTP 403).
- Final mix (tools/mix_audio.py): integrated loudness −15.0 LUFS, sample peak −1.5 dBFS (loudnorm target −1.5 dBTP), loudness range 2.8 LU. Duck of music under narration by sidechain compression.

## Visual review performed
- Three full 1080p renders. Each was reviewed as a 22-frame contact sheet taken from the MP4 itself (qa/r1, qa/r2, qa/r3).
- Defects found and fixed: policy/scope text overlap in the cold open; printer scene persisting over the sincere-answer line; spotlight covering the indicator title; text wrap and card overflow in the chatbot question, the 2023 card, and the welfare quote card.
- Final 1080p (qa/r3) shows no collisions in the sampled frames.

## Limits (not checked)
- Nobody has listened to the audio. Loudness, peaks, and alignment were measured, not heard.
- Full-speed playback and motion were not reviewed. Only sampled frames (22 per cut) were looked at.
- 4K master: parameters checked with ffprobe; not visually compared frame-by-frame with the 1080p.
- Small text: the setup tags in the chatbot scene (about 24 px at 1080p) are small for phone viewing.
- Runway: no Runway output was used in the final film.
- The end screen is silent after the narration (the music bed ends at the narration end). The 8 s end screen has placeholder slots only.
- Pacing: narration runs 4:21 with the end screen to about 4:29. The brief's 4:30–5:00 target is met only when the end screen is counted.

## Rebuild
    cd Future_Got_Weird/can-you-hurt-something-that-isnt-alive
    (cd source && npm ci)                      # from package-lock.json
    python3 tools/synth_audio.py               # effects and music bed (deterministic)
    python3 tools/mix_audio.py                 # final mix from narration + cues
    (cd source && npx remotion render src/index.ts Main ../exports/FGW_CanYouHurt_v1_UPLOAD_1080p.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --concurrency=3)
    (cd source && npx remotion render src/index.ts Main ../exports/FGW_CanYouHurt_v1_MASTER_4K.mp4 --scale=2 --crf=14 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --concurrency=3)
    python3 tools/make_srt.py audio/narration_words.json script/script_v2.md captions/FGW_CanYouHurt_v1.srt
Rebuild needs Node 22 and the Playwright chromium_headless_shell path set in source/remotion.config.ts.

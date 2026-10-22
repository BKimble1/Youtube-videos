# Future Got Weird: These Contacts Let You See With Your Eyes Closed

## V2 (visual rebuild on the locked V1 audio): review

**Status (22 Oct 2026):** the V2 review is rendered and checked as files: ASR, audio identity, a motion scan, frame
strips and a phone sheet. **Not published. No 4K master** (it waits on review). Nobody has yet watched it in real time
with sound.

| Deliverable | File |
|---|---|
| V2 review: 1080×1920, 30 fps, 891 frames, 29.70 s, captions burned in, **audio stream byte-identical to V1** | `exports/FGW_Infrared_Contacts_V2_REVIEW_1080x1920.mp4` |
| Changelog, audio verification, remaining imperfections | `production/V2_CHANGELOG.md` |
| V2 source | `source/src/v2/` (composition `InfraredContactsV2`, still `FilmStillV2`) |
| Locked audio: approved mix, V1 AAC stream, V1 cue table | `audio/mix/FGW_Infrared_Contacts_V1_mix_APPROVED.wav`, `audio/mix/FGW_Infrared_Contacts_V1_REVIEW_audio.m4a`, `audio/cues_V1_LOCKED.json` |
| V2 QA | `qa/v2/` |

### Rebuild V2 (picture only, then copy V1's audio stream in unchanged)

    cd Future_Got_Weird/infrared-contacts
    (cd source && npm ci)
    (cd source && npx remotion render src/index.ts InfraredContactsV2 /tmp/v2_silent.mp4 --props='{"audio":false,"captions":true}' --muted --image-format=png --gop=15 --crf=18 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    ffmpeg -y -i /tmp/v2_silent.mp4 -i audio/mix/FGW_Infrared_Contacts_V1_REVIEW_audio.m4a -map 0:v -map 1:a -c copy -movflags +faststart exports/FGW_Infrared_Contacts_V2_REVIEW_1080x1920.mp4
    cp audio/mix/FGW_Infrared_Contacts_V1_mix_APPROVED.wav source/public/audio/mix.wav   # for qa.py's sync check
    python3 tools/qa.py exports/FGW_Infrared_Contacts_V2_REVIEW_1080x1920.mp4 /tmp/asr qa/v2/review
    python3 tools/motion_scan.py exports/FGW_Infrared_Contacts_V2_REVIEW_1080x1920.mp4 qa/v2/motion_scan.json

---

## V1 (initial production): kept as delivered

**Status (22 Oct 2026):** the review and the native 4K master are rendered and checked as files: measurements, ASR,
frame strips, a motion scan, a phone sheet and native frames. **Not published.** Nobody has yet watched it in real
time with sound. This environment has no audio or video output.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 891 frames, 29.70 s, H.264 High CRF 18 + AAC 320 kb/s, burned-in captions | `exports/FGW_Infrared_Contacts_V1_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors rendered at 2×), clean (no captions) | `exports/FGW_Infrared_Contacts_V1_MASTER_2160x3840.mp4` |
| Subtitles (23 cues, timed from the measured narration) | `captions/FGW_Infrared_Contacts_V1.srt` |
| Cover frame (actual render at 3.52 s: closed eye with the green flash; no text) | `cover/FGW_Infrared_Contacts_V1_Cover_1080x1920.png` |
| Opening frame (frame 0, no captions) | `cover/FGW_Infrared_Contacts_V1_Opening_Frame_1080x1920.png` |
| Approved narration text | `production/NARRATION_APPROVED.txt` |
| Final narration (48 kHz mono, 24-bit) | `audio/narration/FGW_Infrared_Contacts_narration_final.wav` |
| Voice record (voice id, model, prompt, 4 takes with generation ids and hashes, selection) | `audio/narration/voice_provenance.json` |
| Mix measurements; effect cue log; cue table | `audio/mix/mix_measure.json`, `audio/sfx_cues.json`, `audio/cues.json` |
| Source and claim ledger | `production/SOURCE_CLAIM_LEDGER.md` |
| Shot list and transition list | `production/SHOT_LIST_AND_TRANSITIONS.md` |
| QA report (checks, defects fixed, remaining issues) | `production/QA_REPORT.md` |
| Upload text draft | `upload/DESCRIPTION_DRAFT.md` |
| Editable source | `source/` (Remotion 4.0.533, composition `InfraredContacts`; stills `FilmStill`, `ArtTest`, `SecTest`, `TrainTest`) |

**Voice:** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, take 4 of 4.
- This is the same voice id as the Living Skin and Hidden Trigger Shorts.
- Speech starts at 0.03 s and runs at about 193 wpm.
- The audio is unedited apart from one 0.22 s beat before "So you could look".

**Cast:** original Weird Crew characters from the channel cast:
- **Lead:** the red-haired contestant (spiky red hair, yellow and cream stripes).
- **Sender:** the clerk (blue cardigan, high bun, square glasses).
- **Bystander:** the fact-checker (grey bob, round glasses, coral cardigan).

## Source layout

- `src/lib.ts`: the nested-level camera (train → lead → eye section), easing and word timeline.
- `src/timing.ts`: the single cue table. Every picture and sound event comes from the measured narration words.
- `src/art/Lead.tsx`: the lead rig (head with a wrapping eyelid, contact lens, inserting finger, seated body).
- `src/art/Section.tsx`: the eye section (anatomy, contact-lens shell with 1,200 embedded particles, eyelid layers,
  the hero particle's detail).
- `src/art/Train.tsx`: the compartment, the sender with the transmitter, and the bystander.
- `src/Overlay.tsx`: captions, labels, light packets and the closed-eye view.
- `src/InfraredContacts.tsx`: states and the camera path for scenes A–F.

## Rebuild

    cd Future_Got_Weird/infrared-contacts
    python3 -m pip install soundfile scipy numpy pyloudnorm sherpa-onnx
    (cd source && npm ci)
    # ASR models (sherpa-onnx releases): whisper base.en + zipformer-en-2023-06-26 in /tmp/asr
    python3 tools/word_timeline.py /tmp/asr audio/narration/takes/take4.mp3 audio/narration/takes/take4_words.json
    python3 tools/make_narration.py      # final narration, word timeline, caption chunks, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=esm --loader:.css=empty --outfile=/tmp/ec.mjs && node /tmp/ec.mjs audio/cues.json
    python3 tools/make_audio.py          # score, ambience, effects, mix -> source/public/audio/mix.wav
    (cd source && npx remotion render src/index.ts InfraredContacts ../exports/FGW_Infrared_Contacts_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=18 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts InfraredContacts ../exports/FGW_Infrared_Contacts_V1_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":false}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion still src/index.ts FilmStill ../cover/FGW_Infrared_Contacts_V1_Cover_1080x1920.png --props='{"t":3.52,"captions":false}' --image-format=png)
    python3 tools/qa.py exports/FGW_Infrared_Contacts_V1_REVIEW_1080x1920.mp4 /tmp/asr qa/v1/review
    python3 tools/motion_scan.py exports/FGW_Infrared_Contacts_V1_REVIEW_1080x1920.mp4 qa/v1/motion_scan.json
    python3 tools/strips.py exports/FGW_Infrared_Contacts_V1_REVIEW_1080x1920.mp4 qa/v1/strips hook:0:2.3:3 into_section:4.1:5.4:2 into_lens:8.2:10:2 pull_to_lids:12.6:14.6:2 path_and_out:21.4:24.4:3 train_reveal:25.3:27:2 loop_end:28.3:29.67:2

The narration takes are committed. Regenerating them needs the ElevenLabs connection and the prompt in
`voice_provenance.json`.

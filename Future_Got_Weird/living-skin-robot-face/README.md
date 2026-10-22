# Future Got Weird: This Robot Is Wearing Living Human Skin

## V3 (coherence and quality pass): current

**Status (22 Oct 2026):** in progress. The V3 source is in place; the renders and QA are pending.

**Audio is locked.** The approved mix is reused unchanged: the same words, voice, timing and 27.2 s runtime as V1
and V2.

| Deliverable | File |
|---|---|
| V3 review: 1080×1920, 30 fps, 816 frames, 27.200 s | `exports/FGW_Living_Skin_V3_REVIEW_1080x1920.mp4` |
| V3 master: 2160×3840 native (vectors at 2×), 30 fps, 27.200 s | `exports/FGW_Living_Skin_V3_MASTER_2160x3840.mp4` |
| Change log (timestamps, measurements, audio checks, remaining issues) | `production/V3_CHANGE_LOG.md` |
| V3 source | `source/src/v3/` (composition `LivingSkinV3`; reuses V2's tissue renderer and V1's finger) |
| V3 QA | `qa/v3/` |

### Rebuild V3

    cd Future_Got_Weird/living-skin-robot-face
    (cd source && npm ci)
    cp audio/mix/FGW_Living_Skin_mix_APPROVED.wav source/public/audio/mix_approved.wav
    (cd source && npx remotion render src/index.ts LivingSkinV3 ../exports/FGW_Living_Skin_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix"}' --image-format=png --gop=15 --crf=12 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts LivingSkinV3 ../exports/FGW_Living_Skin_V3_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix"}' --image-format=png --gop=15 --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    source/node_modules/.bin/esbuild tools/export_cues_v3.ts --bundle --platform=node --format=esm --jsx=automatic --loader:.css=empty --outfile=/tmp/ec3.mjs && node /tmp/ec3.mjs production/v3_cues.json
    python3 tools/qa.py exports/FGW_Living_Skin_V3_REVIEW_1080x1920.mp4 /tmp/asr qa/v3/v3_review
    python3 tools/qa_v3_sheets.py

---

## V2 (animation, hook and visual-storytelling pass): kept as delivered

**Status (22 Oct 2026):** V2 review and native 4K master rendered and checked as frames and measurements. Not
published, and not yet watched at normal speed.

**Audio is locked.** The approved V1 mix is reused unchanged: the AAC audio stream is byte-identical to V1's. Words,
voice, timing and the 27.2 s runtime are all V1's.

| Deliverable | File |
|---|---|
| V2 review: 1080×1920, 30 fps, 816 frames, 27.200 s | `exports/FGW_Living_Skin_V2_REVIEW_1080x1920.mp4` |
| V2 master: 2160×3840 native (vectors at 2×), 30 fps, 27.200 s | `exports/FGW_Living_Skin_V2_MASTER_2160x3840.mp4` |
| Change log (timestamps, verification, limitations) | `production/V2_CHANGE_LOG.md` |
| Approved mix used by V2 (SHA-256 `de525e8e…3ac5`) | `audio/mix/FGW_Living_Skin_mix_APPROVED.wav` |
| V2 source | `source/src/v2/` (composition `LivingSkinV2`) |
| V2 QA | `qa/v2/` |

### Rebuild V2

    cd Future_Got_Weird/living-skin-robot-face
    (cd source && npm ci)
    cp audio/mix/FGW_Living_Skin_mix_APPROVED.wav source/public/audio/mix_approved.wav
    cp audio/narration/FGW_Living_Skin_narration_final.wav source/public/audio/narration.wav   # only for the V1 'voice' prop
    (cd source && npx remotion render src/index.ts LivingSkinV2 ../exports/FGW_Living_Skin_V2_REVIEW_1080x1920.mp4 --props='{"audio":"mix"}' --image-format=png --gop=15 --crf=12 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts LivingSkinV2 ../exports/FGW_Living_Skin_V2_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix"}' --image-format=png --gop=15 --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    source/node_modules/.bin/esbuild tools/export_cues_v2.ts --bundle --platform=node --format=esm --jsx=automatic --loader:.css=empty --outfile=/tmp/ec2.mjs && node /tmp/ec2.mjs production/v2_cues.json
    python3 tools/qa.py exports/FGW_Living_Skin_V2_REVIEW_1080x1920.mp4 /tmp/asr qa/v2/v2_review
    python3 tools/qa_v2_sheets.py

---

# V1 (kept as delivered)

**Status (22 Oct 2026):** final review and 4K master rendered and checked. Not published.

## Deliverables

| Deliverable | File |
|---|---|
| Review MP4: 1080×1920, 30 fps, 816 frames, 27.200 s, H.264 High (CRF 12, keyframe every 0.5 s) + AAC 320 kb/s | `exports/FGW_Living_Skin_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors rendered at 2×, not upscaled), 30 fps, H.264 High (CRF 14) + AAC 320 kb/s | `exports/FGW_Living_Skin_MASTER_2160x3840.mp4` |
| Final narration (48 kHz mono, 24-bit) | `audio/narration/FGW_Living_Skin_narration_final.wav` |
| Captions (21 cues, synchronised to the measured waveform) | `captions/FGW_Living_Skin.srt` |
| Cover (no text) | `cover/FGW_Living_Skin_Cover_1080x1920.png` |
| Opening frame (frame 0, no caption) | `cover/FGW_Living_Skin_Opening_Frame_1080x1920.png` |
| Source notes: dates, links, attribution, simplifications | `production/SOURCE_NOTES.md` |
| Voice provenance (voice id, prompt, takes, selection) | `audio/narration/voice_provenance.json` |
| QA report | `production/QA_REPORT.md` |
| Upload text draft | `upload/DESCRIPTION_DRAFT.md` |
| Editable source | `source/` (Remotion 4.0.533; compositions `LivingSkin`, `Cover`, `FilmStill`) |

## Exact narration (locked, unchanged)

> This robot's skin is alive.
> They grew it from human cells… then attached it to a mechanical face and made it smile.
> Tiny anchors hold the skin while motors pull underneath.
> But an earlier experiment gets stranger.
> They cut living skin on a robotic finger… added a collagen patch… and gave the tissue seven days to repair.
> Cells grew into the patch, helping close the damage.
> The machine isn't alive.
> But the skin it's wearing is.

**Voice.** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), take 2 of 4.
- This is the established FGW narration voice; the Hidden Trigger V3–V7 cuts use it.
- No Death Clock audio or voice record exists in this repository or the ElevenLabs workspace, so it could not be
  matched to Death Clock specifically.

**Pace and timing.**
- 76 words, speech from 0.10 to 26.48 s.
- 177.8 wpm over the take's speech span; 211 wpm articulated.
- Three short breath extensions (0.3 / 0.2 / 0.2 s) sit inside existing pauses at the second hook, the time jump and
  the closing line.

**Runtime: 27.2 s.** That is below the requested 28–31 s. The locked 76 words at the requested 175–185 wpm come to
about 25.8 s of speech. I added beats only at the scene changes and kept a 0.72 s tail, rather than slowing the read
or adding pauses.

## Hook design

1. **First second.** Frame 0 is already mid-smile: pink tissue on a white lab block, the mouth corners rising. At
   0.45 s the camera pulls out to reveal the block, stand and pull motors. At 0.84 s it pushes onto the stretching
   cheek.
2. **Next three seconds.** On "alive" (1.30 s), a section opens in the cheek and shows living cells, with a low
   impact sound. A pinpoint marks one cell. On "human" the camera takes a 9-frame dive into a full-frame fibroblast.
3. **Second reveal.** On "But an earlier experiment" (10.42 s), the picture match-cuts along a curved skin edge to a
   different machine: a skin-covered robotic finger, labelled EARLIER EXPERIMENT · 2022. A scalpel enters, and the
   sound texture changes to a low pitch with a soft tick.

## Shot list (s; cues read from the measured narration)

| Time | Picture | Narration |
|---|---|---|
| 0.00–0.45 | Close on the mouth corner, already rising; the motor tug spans the loop seam | "This robot's" |
| 0.45–0.84 | Quick reframe: the whole device, with the motors behind the block | "robot's skin" |
| 0.84–1.26 | Push onto the cheek fold; stretch sheen on the surface | "skin is" |
| 1.26–2.73 | Cheek section opens (cells inside), drift, pinpoint on one fibroblast | "alive. They grew it from" |
| 2.73–3.03 | 9-frame dive through the section into the cell | "human" |
| 3.03–3.87 | Fibroblast among collagen fibres (label) | "human cells…" |
| 3.87–5.30 | Matched cut, then pull-back out of the same cells into the device cross-section: V-shaped anchors, base, motor | "then attached it to a mechanical face" |
| 5.30–6.97 | Whole device, 3/4 view; it smiles | "and made it smile." |
| 6.97–9.60 | Cross-section: the anchors light up in turn; the motor pulls the corner insert, the tissue follows and bunches into the cheek | "Tiny anchors hold the skin while motors pull underneath." |
| 9.60–10.40 | Match cut to the front of the smiling face; travel to the cheek's curved edge | (pause) |
| 10.40–12.87 | Match along the curved tissue edge to the robotic finger on a bench; it flexes; a scalpel approaches | "But an earlier experiment gets stranger." |
| 12.87–14.10 | Top view: a small, clean incision on "cut" | "They cut living skin" |
| 14.10–15.30 | Side view: the small cut on the finger | "on a robotic finger…" |
| 15.30–17.07 | Elevated 3/4 view: tweezers lower a thin collagen sheet; contact on "patch"; pinpoint at its edge; dive | "added a collagen patch… and gave the tissue" |
| 17.07–22.11 | Microscope-style repair, DAY 0 → DAY 7: cells migrate into the sheet and the gap; follow one cell; widen; graft integrated | "seven days to repair. Cells grew into the patch, helping close the damage." |
| 22.11–22.57 | Pull back to the finger flexing again, repaired covering with the graft visible | |
| 22.57–24.27 | Cutaway: the rigid links and joint pin under the covering | "The machine isn't alive." |
| 24.27–25.03 | Matched skin/rigid boundary into the face's cross-section; the view unwinds | "But the skin" |
| 25.03–27.20 | Front of the face with the cell window open; on "is" it closes into the surface; the smile restarts from the opening camera, running into frame 0 | "it's wearing is." |

## Rebuild

    cd Future_Got_Weird/living-skin-robot-face
    python3 -m pip install soundfile scipy numpy pyloudnorm sherpa-onnx
    (cd source && npm ci)
    # ASR models for timing/QA (sherpa-onnx releases): whisper base.en + zipformer-en-2023-06-26 in /tmp/asr
    python3 tools/word_timeline.py /tmp/asr audio/narration/takes/take2.mp3 audio/narration/takes/take2_words.json
    python3 tools/make_narration.py            # final narration WAV, word timeline, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=esm --jsx=automatic --loader:.css=empty --outfile=/tmp/ec.mjs && node /tmp/ec.mjs audio/cues.json
    python3 tools/make_audio.py                # score, effects, mix -> source/public/audio/mix.wav
    (cd source && npx remotion render src/index.ts LivingSkin ../exports/FGW_Living_Skin_REVIEW_1080x1920.mp4 --props='{"audio":"mix"}' --image-format=png --gop=15 --crf=12 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts LivingSkin ../exports/FGW_Living_Skin_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix"}' --image-format=png --gop=15 --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion still src/index.ts Cover ../cover/FGW_Living_Skin_Cover_1080x1920.png --image-format=png)
    (cd source && npx remotion still src/index.ts FilmStill ../cover/FGW_Living_Skin_Opening_Frame_1080x1920.png --props='{"t":0}' --image-format=png)
    python3 tools/qa.py exports/FGW_Living_Skin_REVIEW_1080x1920.mp4 /tmp/asr qa/final_review
    python3 tools/qa.py exports/FGW_Living_Skin_MASTER_2160x3840.mp4 /tmp/asr qa/final_master

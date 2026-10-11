# QA report — Why This Robot Has No Pinky, **V3** (Atlas Short, final focused polish)

V3 production pass: 10–11 Oct 2026. **Not published, not uploaded, not scheduled.** V2 and V1 are untouched (`v2/`, `v1/`). The per-defect log is `qa/v3/V3_DEFECT_LOG.md`; the owner's reassessment and the pasted prompt are saved in `handoff/V3_Reassessment_and_Prompt.md`.

Evidence is kept in four separate layers. **Layer 4 has not happened.**

| Layer | What it is | Status |
| --- | --- | --- |
| 1. Source / frame inspection | Stills, bursts and sheets viewed by the producing session (image reads, not playback) | Done — section A |
| 2. Numerical measurements | Contact gaps, loudness, stem levels, seam PSNR, caption/audio lag, music-seam step | Done — section B |
| 3. Automated checks | Typecheck, decode, SRT-vs-alignment, determinism, scene-change timing, held-grip contact audit | Done — section C (`qa/v3/automated_checks.txt`, `tools/qa_v3.py`) |
| 4. Human audiovisual review | Watching and listening at speed, on a phone | **NOT PERFORMED** — section D |

## D. Outstanding human review (nothing below has been done)

This session cannot play video or audio. Watch/listen is **not** marked complete anywhere. Still open:

1. **One full phone playback with sound** — voice tone, pronunciation (especially *thirteen* and *actuators*), clarity, the 29 procedural effects (the new pad-close click, the quieter opener click, receipt printing), the retimed music bed, and whether each teaching action can be followed.
2. **One muted phone playback of the captioned MP4** (`FGW_Atlas_No_Pinky_V3_Captioned_1080x1920.mp4`) — hook, premise, experiment, tradeoff and conclusion without sound.
3. **Two repeats back-to-back** — do picture, text, motion, music and sound at the boundary feel continuous? The picture seam is exact by construction; the music bed was made exactly periodic and the mix has no end fade, but whether the reset is audible has never been heard.
4. **Current Shorts UI overlay** — captions and critical details under the live interface. Only a conservative mock was checked.

## Deliverables and measured specs

| File | Result |
| --- | --- |
| `FGW_Atlas_No_Pinky_V3_1080x1920.mp4` (clean) | H.264 High, yuv420p, BT.709, 1080 × 1920, 30 fps, 1038 frames = **34.60 s**, AAC-LC 48 kHz stereo ~320 kb/s, 10.4 MB, decodes without errors |
| `FGW_Atlas_No_Pinky_V3_Captioned_1080x1920.mp4` | Same film plus the stable caption lane, 11.0 MB; audio stream bit-identical to the clean file |
| `FGW_Atlas_No_Pinky_V3.srt` | 23 cues, 2–6 words, ≤ 2 lines of ≤ 20 characters, the 88 narrated words in order; every cue start equals its Scribe word start (0 violations); last cue ends 33.81 s, before the closing tear (33.88 s) |
| `cover/FGW_Atlas_No_Pinky_V3_Cover.png` | 1080 × 1920 still of frame 48 of the improved opener (`NO PINKY?`, open four-digit hand, dashed fifth slot with circle, gear on its post). No new generation |
| `audio/v3/` | `FGW_Atlas_No_Pinky_V3_mix.wav`, `stems/{narration,music,effects}.wav`, `sfx_log.csv`, `MIX_LOG.json` (narration is the unchanged V1/V2 recording in `audio/`) |
| `source/` | Editable Remotion project. V3 is `src/v3/*` + `src/cues_v3.ts` (forked from `src/v2/`, which is kept); compositions `Short` / `ShortCaptioned` (V3), `ShortV2` / `ShortCaptionedV2`, `ShortV1` / `ShortCaptionedV1`, dev-only `ProbeV3` |
| `qa/v3/` | Contact sheets, 360×640 caption sheet, safe-zone overlay, loop-seam frames, opening and TURN frame strips, `automated_checks.txt`, `V3_DEFECT_LOG.md` |

## A. Frame inspection (layer 1)

Viewed at 1080×1920 where a contact had to be judged (TURN crops, PINCH/BUILT title crops) and at contact-sheet or 360×640 size elsewhere: first second (frames 0–30), taped fingers (B02, unchanged), stamp/verdict (B03, unchanged), movement-control explanation (B04), washer pinch (520–536), the full rotating-cube grip (536–566), drill contact (575, 590), the three capability headline hand-offs (bursts 484–494, 534–546, 566–576), added hardware (634–790), BUILT TO WORK (836–858), human reference (905–937), simplified receipt (938–1005), closing tear (1016–1037), last-to-first (1035–1037 / 0–2), and the neighbours of every modified scene boundary (bursts around 484–494, 534–546, 566–576, 606–616, 787–798, 933–944, tape wipe 98–101, stamp iris 303–310).

- **Opening.** Frame 0 shows the front-view four-digit hand pinching a gear between thumb and index while middle and ring stand clear; `NO PINKY?` and `ATLAS HAND · Boston Dynamics` are present from frame 0 at full size. The pads release at 0.37 s, the gear seats on its post at 0.67 s, the dashed fifth slot appears into empty space at 0.58 s, the circle pops at ~0.96 s and the hand opens so thumb + three fingers are distinct by frame ~24 (0.8 s); `ON PURPOSE.` lands on its word.
- **TURN.** The cube is held between index and thumb: the pads are within ~21 px as the shot slides on, touch by frame 542, and stay on the cube edges while it turns 90° from frame 548; the arrow stays on the cube (`qa/v3/turn_grip_frames_536-566.png`).
- **Headlines.** `PINCH.`, `TURN.`, `PRESS.` are drawn inside their own shots and leave with them; no outgoing title appears over the next shot in the burst frames. `PINCH.` and `BUILT TO WORK` are visibly clear of the forearm/palm (crops of 522 and 850).
- **Lanes.** Headline lane ends by y ≈ 466; action sits between that and y ≈ 1147; the attribution lane is y 1130–1260; captions y 1277–1455. Public tags are only `RECONSTRUCTION`, `COMPANY-REPORTED ABILITY` and `ILLUSTRATION`. In the final frames no pill covers a joint, pad, cuff, held object or trigger; the forearms pass behind the pills at most.
- **Stages.** B04 and the TURN shot are on the cool-paper stage with ink lettering; the yellow opener and teal workstation are unchanged; the receipt backdrop is plain dark without grid.
- **Receipt and loop.** Five large rows plus the `NOT IN BUDGET` stamp, no guide; the tear reveals the same opener function, and frames 1035–1037 / 0–2 are visually the same scene.
- **Safe-zone and phone size.** In `qa/v3/safe_zone_overlay_sheet.png` (green = x 120–870, y 240–1450) all headlines, diagram labels, captions and pills sit inside; the open hand's thumb tip (B01, B04) reaches x ≈ 50–100, left of the green box but on screen and away from the right rail. At true 360×640 (`qa/v3/phone_360x640_captions_sheet.png`) headlines, captions and labels read.

## B. Numerical measurements (layer 2)

**Held-grip contacts** (`tools/check_contacts.mjs`: visible pad capsule vs object polygon/circle per frame; ≤ 0 = touching): TURN frames 544–568 **worst |gap| 3.0 px** (pads pressed 3 px in); the same harness on the V2 geometry measured 18–100 px gaps; washer pinch 520–536 worst 4.9 px; workstation blocks 810–846 and 900–918 worst 3.0 px. Approach frames 536–543 pad openings: 21 21 20 17 9 1 −2 −3 px. Not measured: drill trigger.

**Loudness (final MP4 audio, ffmpeg ebur128):** integrated **−14.6 LUFS**, LRA 2.5 LU, true peak **−1.4 dBTP** (WAV mix: −14.6 LUFS, sample peak −1.51 dBFS). The V2 file was measured by the owner at ≈ −14.78 LUFS / −1.44 dBTP; this is the same neighbourhood and not a sound-quality certification.

**Levels (stems, while the narrator speaks):** voice −16.2 dBFS RMS; music 21.3 dB below the voice (−33.9 dBFS RMS in gaps); effects 18.8 dB below on average. L/R correlation 1.0 (mono-safe). **Effects:** 29 events, 27 distinct (V1: 41; same budget as V2).

**Loop seam, picture:** clean 1037 → 0 **38.8 dB PSNR**; neighbouring one-frame steps in the opener 38.7–42.0 dB (the step across the boundary is an ordinary one-frame step). Captioned file 1037 → 0: 38.8 dB.

**Loop seam, audio:** the music bed is retimed to 124.855 BPM so 18 bars = 34.6 s and every write wraps circularly; the step between the last and first music sample is 0.0004 (typical sample step 0.0010). Mix RMS last 0.1 s −37.1 dBFS (V2: −62.7), first 0.1 s −22.2 dBFS; no end fade, no closing chord. Whether the downbeat that lands at the seam sounds like a clean restart is a layer-4 question.

**Captions vs final audio:** cross-correlation of the delivered MP4's audio with the aligned narration file: lag **3.0 ms**, normalised peak 0.98, so the SRT/cue clock and the speech share one clock. Last caption ends 33.81 s; the tear starts 33.88 s.

## C. Automated checks (layer 3)

Full output: `qa/v3/automated_checks.txt` (regenerate with `python3 tools/qa_v3.py`; sheets with `tools/qa_v3_sheets.sh`).

- `npx tsc --noEmit` clean.
- Both MP4s: H.264 High 1080 × 1920 yuv420p BT.709, 30 fps, 1038 frames, 34.60 s; AAC 48 kHz stereo; full decode with no errors; audio identical between them.
- SRT: 23 cues, 0 violations of the ≤ 2 lines / ≤ 20 characters / words-in-order / start-equals-Scribe-start rules (the V2 3–6-word rule was dropped on purpose so two-word dramatic cues can stand alone).
- Contact audit: OK, every held grip within 8 px.
- **Determinism:** the clean MP4 was rendered twice from the final source and all 1038 decoded frames are hash-identical (`ffmpeg -f framemd5`). The captioned MP4 was rendered once from the same source.
- Scene-change detector (threshold 0.25): 4 detections, all inside planned windows, 0 unplanned. This only shows the abrupt changes are where planned; it says nothing about visual direction or contact.
- The V2 and V1 compositions still typecheck and register (`ShortV2`, `ShortV1`); they were not re-rendered in this pass.

## Known limitations and open issues

- Layer 4 is open (section D). No statement in this report depends on having watched or listened.
- Voice and sound design unlistened; the new music tempo (124.855 vs 126 BPM), the retimed opener effects and the circular bed are untested by ear. `thirteen` and `actuators` pronunciation unverified. The V2 mix could not be re-transcribed (ElevenLabs upload tools unavailable).
- Primary sources were not re-read (sandbox proxy blocks bostondynamics.com / spectrum.ieee.org); the `three more actuators` support is taken from the owner's V2 audit, unchanged in `claim_ledger.md`.
- The gear is partly covered by the pads at frame 0 (it reads as a small bright object between the jaws, not as a clearly drawn gear until it is released). The open hand's thumb is left of the 120 px guide.
- B04 is now a single large hand with no camera push, so it reads less like a macro than V2 (traded for clear lanes).
- The TURN arc arrowhead can overlap the index finger late in the turn (decorative; the cube's own arrow is unobstructed).
- `ON PURPOSE.` appears as a plate and as a caption at the same time (same words, deliberate); no two different explanations are shown together.
- The drill trigger grip and the human-hand reference were checked by eye only.
- Runway not used; no new ElevenLabs generation (narration reused unchanged). Git LFS uploads are Forbidden in this environment, so audio/MP4s are committed as ordinary blobs via the scoped `.gitattributes`.

## Reproduce

See `README.md`: `python3 tools/build_cues_v3.py` → `python3 tools/build_audio_v3.py` → Remotion render → `node tools/check_contacts.mjs` → `python3 tools/qa_v3.py` → `tools/qa_v3_sheets.sh`.

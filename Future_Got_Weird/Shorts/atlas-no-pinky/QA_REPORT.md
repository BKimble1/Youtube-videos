# QA report — Why This Robot Has No Pinky, **V4** (final presentation and pacing pass)

V4 production pass: 11 Oct 2026. **Not published, not uploaded, not scheduled.** V3, V2 and V1 are untouched (`v3/`, `v2/`, `v1/`). The V3 → V4 change list is `qa/v4/V4_BEFORE_AFTER_AUDIT.md`; the owner's V4 prompt is saved in `handoff/V4_Final_Presentation_and_Pacing_Prompt.md`.

Evidence is kept in four separate layers. **Layer 4 has not happened.**

| Layer | What it is | Status |
| --- | --- | --- |
| 1. Source / frame inspection | Stills, bursts and sheets viewed by the producing session (image reads, not playback) | Done — section A |
| 2. Numerical measurements | Contact gaps, loudness, stem levels, seam PSNR, caption/audio lag, retime lag, glyph widths | Done — section B |
| 3. Automated checks | Typecheck, decode, caption validators (transcript / start lag / final-word coverage / reading rate / line fit / replay boundary), font proof, static scan, held-grip audit, scene-change timing | Done — section C (`qa/v4/automated_checks.txt`, `…_original_pace.txt`; `tools/qa_v4.py`) |
| 4. Human audiovisual review | Watching and listening at speed, on a phone | **NOT PERFORMED** — section D |

## D. Outstanding human review (nothing below has been done)

This session cannot play video or audio. Watch/listen is **not** marked complete anywhere. Still open:

1. **One full phone playback with sound** of the retimed default cut — above all whether the **1.05× narration (pitch-preserving, 8 planned gap trims) sounds natural or rushed**, the *thirteen* / *actuators* pronunciation, the 32 effects (new: lens, price tag, footprint box; softer slot pop), the retimed music bed. **The retime has never been auditioned by ear** — the sound-quality of a time-compressed voice cannot be certified from numbers. If it sounds rushed, publish the original-pace files instead (complete deliverables).
2. **One muted phone playback of the captioned MP4** (`FGW_Atlas_No_Pinky_V4_Captioned_1080x1920.mp4`): hook, premise, experiment, tradeoff and conclusion without sound — and whether the Montserrat captions are comfortable at this pace.
3. **Two repeats back-to-back**: picture seam is exact by construction (37.4 dB vs 37.3–39.6 dB between ordinary neighbouring frames); the bed is exactly periodic (17 bars) and there is no end fade, but whether the audio reset is audible has never been heard. The **captioned** file's first frame already carries the first caption (rising 14 px), so on a repeat the caption appears with the first word by design.
4. **Current Shorts UI overlay**: only a conservative mock was checked (`qa/v4/safe_zone_overlay_sheet.png`).

## Deliverables and measured specs

| File | Result |
| --- | --- |
| `FGW_Atlas_No_Pinky_V4_1080x1920.mp4` (clean, retimed, default) | H.264 High, yuv420p, BT.709, **native 1080 × 1920**, 30 fps, 956 frames = **31.87 s**, AAC-LC 48 kHz stereo 317 kb/s, 10.2 MB, decodes without errors |
| `FGW_Atlas_No_Pinky_V4_Captioned_1080x1920.mp4` | Same film plus the caption lane, 11.3 MB; audio stream bit-identical to the clean file (MD5 33631fa9…) |
| `FGW_Atlas_No_Pinky_V4.srt` | 24 cues, 2–6 words, the 88 narrated words in order, aligned to the retimed narration |
| `FGW_Atlas_No_Pinky_V4_OriginalPace_1080x1920.mp4`, `…_OriginalPace_Captioned_…mp4`, `…_OriginalPace.srt` | Same picture on the unchanged narration: 1038 frames = **34.60 s**, 10.5 / 11.8 MB, same codec specs |
| `cover/FGW_Atlas_No_Pinky_V4_Cover.png` | 1080 × 1920 still of frame 48 (clean): kicker, `NO PINKY?`, open hand, gear on its post, slot ring |
| `audio/v4/` | retimed narration, time map, retime report, cue JSON (both paces), mix, stems, `sfx_log.csv`, `MIX_LOG.json`; original-pace mix in `audio/v4/original_pace/` |
| `source/` | Editable Remotion project; V4 = `src/v4/*`, `src/cues_v4_{fast,orig}.ts`; compositions `Short` / `ShortCaptioned` (alias of V4), `ShortV4` / `ShortCaptionedV4`, `ShortV3` / `ShortCaptionedV3`, `ShortV2…`, `ShortV1…`, `CaptionAudit` |
| `qa/v4/` | sheets, audit JSON, automated checks, determinism note, `SHA256SUMS.txt`, before/after audit |

Note on resolution: the V3 *review copy* was 512 × 910; the repo masters (V3 and V4) are native 1080 × 1920.

## A. Frame inspection (layer 1)

Viewed at native or 0.5× scale where a detail had to be judged, otherwise at contact-sheet / true 360 × 640 size: the first second (`opening_first_second_frames_0-27.png`), every shot at 1–3 sample frames, all ten transitions (`transition_bursts_sheet.png`), the workstation title/hand hand-off (`workstation_title_vs_hand_frames_764-806.png`), the human reference (`human_reference_frames_822-858.png`), first/last frames of both files (`loop_seam_first_last_states.png`), a 360 × 640 frame at the middle of each caption cue (`phone_360x640_captions_sheet.png`) and a conservative Shorts UI overlay (`safe_zone_overlay_sheet.png`: green = x 60–930 / y 240–1450, red = top 240 px and bottom 470 px, orange = right rail).

- **Attribution.** No persistent strip, pill or tag in any frame. The company is named once: the kicker `ATLAS HAND · BOSTON DYNAMICS` above `NO PINKY?` (frame 0 until the tape wipe and in the closing pre-roll). Static scan of `src/v4` finds none of `Source:`, `RECONSTRUCTION`, `COMPANY-REPORTED`, `ILLUSTRATION`, `Attrib`.
- **Typography.** Captions are Montserrat ExtraBold, cream with an ink outline, bottom-anchored (baseline y = 1428), ≤ 2 lines; headlines Barlow Condensed ExtraBold with one hard coral shadow. In the safe-zone sheet every headline, caption and diagram label sits inside the green box; the opener's thumb (frame 0.1 s) reaches the left margin but is on screen.
- **Captions vs action.** In every sampled frame the caption lane (y ≈ 1262–1455) is clear of the tape wrap, the cube/washer contact, the drill trigger and the block placements (all above y ≈ 1200). The two-line captions of the workstation overlap only the wood tabletop.
- **Opener.** Hand 1.92× (V3 1.9×; width-limited by the right rail and the left margin), title 190 px (V3 132), gear radius 74 (V3 62), ring 114 (V3 104) bouncing on *no* / *pinky* and firming up on *purpose*; the forearm fades out above the caption lane; the open-hand thumb keeps the gear and its post visible.
- **Mechanism.** `NEW HAND` → `4 DIGITS` (badges 1–4) → the loupe opens on the thumb base joint while `13 WAYS TO MOVE` lands whole → fingers move one by one.
- **Tradeoff.** Large modules; the tag, the footprint box and the wrench each replace the previous consequence; no labels.
- **Workstation.** `BUILT TO WORK` is fully gone (frame 794) before the second hand's fingers enter (≈ 794–797); the first-hand/ title geometry never overlaps (title right edge 513 px, hand left edge ≈ 580 px). The second block waits at the right end of the tray so the second hand never covers the guide; the guide is visible during the nod (frame 794). The `HUMAN` hand appears on *human* (frame 827); the second robot hand has lifted clear of the frame by ≈ 845 (the V4 away-offset is 1300 px, so no fingertips hang at the top during the comparison).
- **Receipt.** Four rows feed out smoothly, the paper lengthens before the stamp (V3-style one-frame jump removed), and the dominant `NOT IN BUDGET` stamp lands just before *budget*.
- **Transitions.** Tape wipe, stamp iris and receipt tear kept; the other seven are 5-frame edge wipes (the scene does not translate; an ink/coral bar crosses it).

## B. Numerical measurements (layer 2)

**Held-grip contacts** (`tools/check_contacts.mjs`, tolerance 8 px, worst gap between the visible pad capsule and the object; ≤ 0 = touching): TURN **3.0 px** (unchanged), washer pinch **4.9 px** (unchanged), blocks **3.0 px** (first and second block). **New in V4: drill trigger.** The shared V1–V3 `Tool` swung the trigger lever *forward* while the index fingertip pressed *back*, so the pressed lever left the fingertip (22.7 px off the lever in 20 of 27 frames when audited with the V4 harness). `Tool4` swings it back; the fingertip is on the lever in **27/27 frames, worst 6.2 px from the lever centre** (the lever is ≈ 41 × 92 px). None of these shots was re-scaled in V4; the workstation's 1.12× framing is a uniform scale, which leaves world-space contacts unchanged.

**Caption fit (browser-side, bundled fonts, `qa/v4/audit_fast.json`):** all 24 cues at 76 px (never shrunk), ≤ 2 lines, widest line **726.3 px** (limit 760), all headline extents inside x 60–930 (widest: the opener title 157–923).

**Caption timing (retimed cut):** start lag within ±14 ms of the aligned first word (frame rounding); every cue ends after its final word's measured end — non-handoff cues hold 76–114 ms (60–120 ms rule), and 14 of 24 cues hand off cleanly to the next cue (hold 38–149 ms, until the next cue starts); reading rate max **22.5 chars/s** (*More things to break.*, bounded by the narrator's own pace); shortest cue 0.63 s; last cue ends frame 932, tear starts frame 934. The SRT equals the rendered cue table to within one frame and the 88 words in order. Original-pace cut: same checks pass (max 21.0 chars/s).

**Retime:** one piecewise-linear old→new map (1.05× + eight trims of 0.12/0.12/0.20/0.12/0.16/0.12/0.26/0.12 s, planned away from the verdict pause, the pre-joke pause and consonants); envelope cross-correlation of the rendered retimed narration against the map: max lag **10 ms** (10 ms resolution); the delivered MP4's audio against `narration_fast_48k.wav`: lag **3.0 ms**, normalised peak 0.98. Speech ends 30.68 s; picture 31.87 s.

**Loudness (final MP4 audio):** integrated **−14.6 LUFS**, LRA 2.3 LU, true peak **−1.4 dBTP** (original pace: −14.6 LUFS, LRA 2.5, −1.4 dBTP); WAV mix sample peak −1.51 dBFS. Voice −16.3 dBFS RMS; music 22.1 dB below the voice while speaking (−35.4 dBFS in gaps); effects 19.9 dB below; L/R correlation 1.0 (mono-safe).

**Effects:** 32 events (30 distinct cue names; V3: 29). None lands on the first syllable of a phrase (checked against the six phrase-initial words); the two stamps lead their words by ≈ 70–130 ms. **Music:** exactly periodic over the video length — 17 bars at 128.03 BPM (retimed; the 17th bar is a G turnaround into the loop's C) / 18 bars at 124.855 BPM (original pace); music-bed seam step 0.00015 vs a typical adjacent-sample step 0.00051; mix RMS last 0.1 s −36.8 dBFS, first 0.1 s −21.5 dBFS; no end fade.

**Loop seam, picture:** clean 955 → 0 **37.4 dB** PSNR; ordinary neighbouring frames in the opener 37.3–39.6 dB.

## C. Automated checks (layer 3)

Full output: `qa/v4/automated_checks.txt` (regenerate with `python3 tools/qa_v4.py fast`; `orig` for the original pace; sheets with `tools/qa_v4_sheets.sh`). Both summaries read **ALL AUTOMATED CHECKS PASSED**.

- `npx tsc --noEmit` clean.
- Fonts: `document.fonts.check` true and the probe-string width differs from the fallback face for both Montserrat 800 and Barlow Condensed 800; the render is held until both are proven.
- All four MP4s: H.264 High 1080 × 1920 yuv420p BT.709, 30 fps, 956 / 1038 frames; full decode with no errors; audio identical between clean and captioned.
- Scene-change detector (threshold 0.25): 2 detections, both inside planned transition windows, 0 unplanned (the edge wipes are lower-contrast than the old slides; this only shows the abrupt changes are where planned, not that they look good).
- **Determinism:** `qa/v4/determinism_check.txt` — the final clean retimed MP4 was rendered twice; **785 of 956 decoded frames are bit-identical; 171 differ slightly (three groups: frame 53, frames 65–226, frames 938–945; lowest PSNR 48.0 dB)**; Remotion stills of five test frames rendered twice are byte-identical. V4's picture is deterministic; the **encode was not bit-reproducible** run to run (V3's was). The variation is small and confined to a few groups of pictures.
- The V3, V2 and V1 compositions still typecheck and register; they were not re-rendered in this pass.

## Known limitations and open issues

- Layer 4 is open (section D). No statement in this report depends on having watched or listened.
- **The 1.05× retimed narration, the 32 effects and the new bed are unauditioned by ear.** Pace is a judgement call; the original-pace cut exists for that reason. No promise about views or retention is made.
- The opener hand is only ≈ 1 % larger than V3: horizontal room (left margin and right rail) limits it. The gains are in the title, gear, ring, forearm and the clean caption lane.
- Primary sources were not re-read (sandbox proxy blocks bostondynamics.com / spectrum.ieee.org); `three more actuators` rests on the owner's V2 audit (`claim_ledger.md`). The reconstruction/illustration disclosure now lives in the description (`packaging_draft.md`) — it must be kept on upload.
- The robot hand briefly overlaps the right edge of the `HUMAN` hand for ≈ 4 frames while it lifts after the placement (frames ≈ 828–832).
- The encode-level non-determinism noted above; the frame-0 caption of the captioned file appears with its 14 px rise (no fade).
- Runway not used; no new ElevenLabs generation (narration reused; the default cut time-compresses it). Git LFS uploads are Forbidden here, so audio/MP4s are committed as ordinary blobs via the scoped `.gitattributes`.

## Reproduce

See `README.md`: `retime_v4.py` → `build_cues_v4.py` → `build_audio_v4.py fast|orig` → Remotion renders → `check_contacts.mjs` → `audit_captions.mjs` → `qa_v4.py fast|orig` → `qa_v4_sheets.sh`.

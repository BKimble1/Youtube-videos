# QA report — Why This Robot Has No Pinky, **V2** (Atlas Short)

V2 production pass: 10 Oct 2026. **Not published, not uploaded, not scheduled.** The V1 baseline is untouched under `v1/` (`v1/QA_REPORT_V1.md`).

Evidence is logged in four separate layers. Nothing in layer 4 has happened.

| Layer | What it is | Status |
| --- | --- | --- |
| 1. Frame inspection | Stills, bursts and sheets viewed by the producing session (image reads, not playback) | Done — section A |
| 2. Numerical measurements | Loudness, stem levels, seam PSNR, layout geometry | Done — section B |
| 3. Automated checks | Specs, decode, SRT-vs-alignment, determinism, scene-change timing, typecheck | Done — section C (`qa/v2/automated_checks.txt`, `tools/qa_v2.py`) |
| 4. Human audiovisual review | Watching and listening at speed, on a phone | **NOT PERFORMED.** Nobody has played the film. See section D |

## D. Outstanding human review (do these before anyone decides to publish)

This session cannot play video or audio. Watch/listen is therefore **not** marked complete anywhere. Still open:

1. **One full phone playback with sound** — voice tone, pronunciation (especially *thirteen* and *actuators*), clarity, distracting or thin synthetic effects, and whether each teaching action can be followed at speed.
2. **One muted phone playback of the actual captioned MP4** (`FGW_Atlas_No_Pinky_V2_Captioned_1080x1920.mp4`) — are the hook, the full premise, the experiment, the tradeoff and the conclusion understandable without sound?
3. **Two repeats back-to-back** — do picture, text, motion, music and sound at the boundary feel continuous? (Picture is exact by construction; the audio seam is only *designed* to be smooth, never heard.)
4. **Current Shorts UI overlay** — are captions and critical details still visible under the live interface? Only a conservative mock was checked.

Only proxy evidence on the voice: the V1 narration (reused unchanged) was transcribed word-for-word by ElevenLabs Scribe (88/88 words match). That says the words are intelligible to a machine, not that the performance is good. The V2 mix was **not** re-transcribed (the ElevenLabs asset-upload tools were disconnected in this session).

## Deliverables and measured specs (layers 2–3)

| File | Result |
| --- | --- |
| `FGW_Atlas_No_Pinky_V2_1080x1920.mp4` (clean) | H.264 High, yuv420p, BT.709, 1080 × 1920, 30 fps, 1038 frames = **34.60 s**, AAC-LC 48 kHz stereo ~320 kb/s, 11.7 MB; decodes without errors |
| `FGW_Atlas_No_Pinky_V2_Captioned_1080x1920.mp4` | Same film plus the stable caption lane, 12.2 MB; audio stream bit-identical to the clean file |
| `FGW_Atlas_No_Pinky_V2.srt` | 21 cues, 3–6 words each, ≤ 2 lines, ≤ 20 characters per line; the 88 narrated words in order; every cue start equals its Scribe word start (0 mismatches); durations 0.84–2.12 s; last cue ends 0.5 s after the last word |
| `cover/FGW_Atlas_No_Pinky_V2_Cover.png` | 1080 × 1920 still of the selected opening (frame 56 of the film: `NO PINKY?`, gear on its post, dashed fifth-digit slot). No new generation |
| `audio/v2/` | `FGW_Atlas_No_Pinky_V2_mix.wav`, `stems/{narration,music,effects}.wav`, `sfx_log.csv`, `MIX_LOG.json` (narration files are shared with V1 in `audio/`) |
| `source/` | Editable Remotion project; V2 is `src/v2/*` + `src/cues_v2.ts`; compositions `Short`, `ShortCaptioned` (V2) and `ShortV1`, `ShortCaptionedV1` (baseline) |

## A. Frame inspection (layer 1)

Viewed: stills at ~100 frames across the film, bursts around every changed boundary, the 1 fps contact sheets, a 360 × 640 sheet (one frame per caption cue), a safe-zone overlay sheet, and the six frames straddling the loop seam. Sheets: `qa/v2/`.

- **Opener (0–3 s).** Frame 0 already shows the profile four-digit hand pinching a small bright gear (thumb below, index above, the other two fingers fanned); `NO PINKY?` is on screen from frame 0; the empty fifth position is revealed by a dashed ghost + circle at ~1 s; `ON PURPOSE.` lands on the spoken word; `ATLAS HAND · Boston Dynamics` identifies the subject from frame 0. No guide in the first 3 s; no five-digit hand, no amputation, no counter.
- **Five shot-local stages, no permanent bench.** Working-hand macro (saffron, B01), overhead experiment (graph-paper desk, B02/B03), mechanism macro on ink-teal blueprint grid (B04, B05b), pegboard workstation (B05c, B07/B08), exploded diagram on blue grid (B06), editorial receipt on ink (B09). Each backdrop fills the whole canvas; nothing carries from one shot to the next except the hand rig and the guide.
- **B02 taped test.** Large overhead hand; guide's sleeved arm brings the tape and wraps ring + pinky; the hand turns, hooks a mug handle, sets it down, pinches a knob (the other three fingers fold) while a clock completes one turn (`ONE DAY`). Mug/knob are labelled `RECONSTRUCTION` and are illustrations.
- **B03 decision.** Full-frame slip, `SKIP IT` chosen, round stamp on the guide's mitt lands to the **left** of the words, short recoil, ring-shaped iris into the macro (showcase transition 2).
- **B04 mechanism.** Four digits resolved with numbered badges (~1 s), then a counter rolls to `13` + `WAYS TO MOVE` + `13 DOF`; thumb sweep, splay and finger curls with dotted tip trails. 13 is shown **only as a total**; no per-finger mapping.
- **B05 capabilities.** Three different angles: overhead washer pinch; diagonal die turn on the ink grid; side-view drill-press trigger press with the screw driven home. The palm is distinct from the tool in each; the forearm enters from its own edge and stays off the titles.
- **B06 diagram.** Hand with a dashed fifth slot; **exactly three** actuator modules drop in with dotted leaders; a blank price tag (COST), a dashed volume box with outward arrows (SPACE), a spare module + wrench (REPAIRS). No numbers.
- **B07/B08 workstation.** Guide behind a table, a side-view hand picks a block and seats it in a fixture; lamps check off; a clean human-hand silhouette with a `HUMAN HAND` label sits **beside** the working robot hand (no overlap) while the second block seats.
- **B09 receipt + loop.** A large receipt prints (`5TH FINGER (OPTIONAL)` … `BUDGET ... ?`), `NOT IN BUDGET` stamps, the guide reacts; the receipt is then torn upward along a perforated edge, revealing the opener.
- **Loop seam (picture).** Frames 1035–1037 and 0–2 (`qa/v2/loop_seam_frames_1035-1037_0-2.png`) are visually the same scene: same camera, hand pose, background, headline, props, attribution pill. Details in section B.
- **Transitions.** Showcase transitions: tape wipe (B01→B02) and stamp-ring iris (B03→B04). All other changes are 6–10-frame slides or the closing tear. No flashes or strobing seen in bursts.
- **Phone legibility.** At true 360 × 640 (`qa/v2/phone_360x640_captions_sheet.png`) headlines, captions (64 px source), source pills (40 px source, ≈ 13 px at that size) and diagram labels are readable. Safe-zone mock (`qa/v2/safe_zone_overlay_sheet.png`; green = x 120–870, y 240–1450, red = top 240 px and bottom 470 px): all headlines, pills, diagram labels and caption plates sit inside green after the final layout pass.

Problems found and fixed during V2 frame review: overlapping tag/source pills (text overflowed its pill); B02 hand too large and under the pills; finger pop between mug grasp and knob pinch (now a 10-frame blend); folded fingers reaching over the knob; B04 camera push covering the title; B06 diagram too small and its SPACE/REPAIRS labels overlapping; B09 receipt text above y = 240 (receipt moved below a register body); headlines starting above y = 240; caption plates ending at y ≈ 1494 (lane moved up, plates now end ≈ 1455); human reference overlapping the guide and the robot hand.

## B. Numerical measurements (layer 2)

**Loudness (final MP4 audio, ffmpeg ebur128):** integrated **−14.7 LUFS**, LRA 2.5 LU, true peak **−1.4 dBTP** (WAV mix before AAC: −14.6 LUFS, sample peak −1.51 dBFS). Baseline cited in the audit: ≈ −14.6 LUFS / −1.45 dBTP; V1 container was −14.5 / −1.4. This is the same neighbourhood; it is a measurement, not a sound-quality certification.

**Levels (stems, while the narrator speaks):** voice −16.2 dBFS RMS; music 21.1 dB below the voice (about −34 dBFS RMS in gaps, so the bed breathes back up between phrases); effects 18.6 dB below on average with higher peaks at contacts. L/R correlation 1.0 (mono-safe).

**Effects budget:** 29 effect events, 26 distinct cues (V1: 41). V1's four count pops, UI ticks and the tonic closing chord are gone; contact events kept: gear/tray, tape, mug, knob, stamp ×2, pinch, trigger, screw, modules ×3, wrench, block seats ×2, receipt printing ×4, loop tear.

**Loop seam (picture), PSNR between decoded frames of the clean MP4:** 1037 → 0: **30.0 dB**; adjacent frames inside the opener for comparison: 0 → 1 30.8 dB, 1 → 2 31.6 dB, 2 → 3 33.6 dB, 1035 → 1036 31.4 dB, 1036 → 1037 30.2 dB. The step across the boundary is the same size as an ordinary one-frame step of the same motion.

**Seam (audio), RMS of the mix:** last 0.5 s −29.9 dBFS, last 0.1 s −62.7 dBFS (effectively silent), first 0.1 s −22.1 dBFS, first 0.5 s −15.8 dBFS. Voice ends 33.43 s; the receipt-tear sound (33.83–34.45 s) is the last event; music dips to silence over the final 0.30 s and returns at once at frame 0, and the mix ends with a 0.12 s fade and an 8 ms fade-in. There is **no closing chord**.

**Layout geometry (from code and overlay):** critical region x 120–870, y 240–1450. Headlines start at y ≥ 250 and x ≥ 120; pills at x = 120, y = 1130 (tag) and 1202 (source); caption lane centred (495, 1366), 64 px, ≤ 2 lines, plate ≤ 750 px wide, bottom ≤ 1455.

## C. Automated checks (layer 3)

Full output: `qa/v2/automated_checks.txt` (regenerate with `python3 tools/qa_v2.py`; sheets with `tools/qa_v2_sheets.sh`).

- Typecheck: `npx tsc --noEmit` clean.
- Both MP4s: H.264 High 1080 × 1920 yuv420p BT.709, 30 fps, 1038 frames, 34.60 s; AAC 48 kHz stereo; full decode with no errors.
- SRT: 21 cues, 0 violations of the 3–6 word / 2-line / 20-character rules; text equals the aligned narration in order; cue starts equal Scribe word starts.
- Scene-change detector (threshold 0.25) on the clean MP4: 8 detections, all inside planned transition windows, 0 unplanned (the tape wipe and slides are gradual and do not trip the detector by design).
- **Determinism:** the clean MP4 was rendered twice from the final source; all 1038 decoded frames are hash-identical (`ffmpeg -f framemd5`). The captioned MP4 was rendered once from the final source (its shared frames derive from the same deterministic code).
- Audio: identical between the clean and captioned files (md5).
- Baseline check: six V1 frames re-rendered from the shared rig after the additive `Hand.tsx` edits are within lossy-encode tolerance of the delivered V1 MP4 (PSNR 34.9–37.9 dB); not pixel-diffed, so a subtle V1 drift cannot be excluded. The delivered V1 files are unchanged.

## Loop: exact or only smooth?

- **Picture: exact by construction.** The closing receipt is torn upward and the layer revealed is the opener rendered at negative time `t = frame − 1038`, so frame 1037 is the opener one frame before frame 0. Same camera, hand, background, headline, props and attribution; outgoing receipt, guide and `EDITORIAL JOKE` tag are cleared by the tear.
- **Captioned file: slightly less exact.** The first caption (`This robot has`) fades in over frames 0–3, so frame 0 shows it at ~33 % opacity while frame 1037 has no caption.
- **Audio: perceptually smooth by design only.** Spoken closing thought stays complete; the bed has no closing chord and dips for 0.3 s, then the opener's click arrives at 0.12 s. Never heard; the back-to-back test (D3) is open.

## Known limitations and open issues

- Layer 4 is open (section D). No claim in this report depends on having watched or listened.
- Voice and sound design unlistened; the 29 effects are procedural and may sound thinner than recorded foley. `thirteen` and `actuators` pronunciation unverified by ear.
- Primary sources were **not re-read** in this session (the sandbox proxy blocks bostondynamics.com / spectrum.ieee.org). The `three more actuators` support is taken from the owner's V2 audit; see `claim_ledger.md`.
- `BUILT TO WORK` crosses the robot forearm for part of B07 (title drawn over the arm; still readable).
- In the captioned file the caption plate covers the lower body of the guide in B09 and the table in B07/B08.
- In B02 the grasp is a simplified hook grip and the human-hand prop is cartoonish by design.
- The side-view hand in B05c still reads partly as part of the drill because both are teal/red blocks; contrast was improved, not eliminated.
- Tag pills are 40 px source text (~13 px at 360 × 640): legible in the mock but small.
- Runway was not used; no new ElevenLabs generation was made in V2 (V1 narration reused). Optional Runway inserts remain unproduced.
- Git LFS uploads are Forbidden in this environment, so audio/MP4s are committed as ordinary blobs via the scoped `.gitattributes`.

## Reproduce

See `README.md`: `python3 tools/build_cues_v2.py` → `python3 tools/build_audio_v2.py` → Remotion render → `python3 tools/qa_v2.py`.

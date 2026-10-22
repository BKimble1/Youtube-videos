# FGW — Starship Dual Catch V1 review cut: QA report

Date: 22 Oct 2026. Status: **1080p review cut delivered for owner review. Not published. No 4K master rendered.**

## 1. File facts (measured on the rendered MP4 with ffprobe/ffmpeg; `qa/qa_results.json`)

| Item | Value |
|---|---|
| File | `exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4` (88 MiB; Git-ignored; checksummed parts in `backup/`) |
| Duration | **6:47.5** (407.47 s, 12,224 frames) |
| Video | H.264 High, 1920×1080, 16:9, 30 fps, yuv420p, BT.709, CRF 17 |
| Audio | AAC-LC 48 kHz stereo, 320 kb/s |
| Loudness | −15.5 LUFS integrated, true peak −1.6 dBTP (ffmpeg ebur128) |
| Voice vs. music+effects while speaking | +14.5 dB (`audio/mix/mix_measure.json`) |
| Silences > 1 s (−50 dB) | none |
| Black frames | only the intended 0.8 s fade-out at the very end (406.6–407.4 s) |
| Near-frozen picture > 2.5 s | none in the final render (the first render had 25 such holds; fixed with a per-scene camera drift) |
| Narration words | 1,175 (script/segments.json) |
| ASR (Whisper base.en, local) of the MP4's own audio vs. the script | 96.9 % word recall; the misses are numbers written as digits ("124", "28,000 km/h", "2024") and "Elon" heard as "Alon" |
| Subtitles | 114 cues, max 47 characters per line, timed from the generated narration (see §4) |
| Thumbnail | 1280×720 PNG |

## 2. Voice source — IMPORTANT

The review narration is a **temporary, free, local voice**: Kokoro v0.19 (open-weights, Apache-2.0) speaker `am_michael`,
run offline with sherpa-onnx, speed 0.97. It is **not** the FGW narrator.

The established FGW voice is the ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, recorded in the earlier
episodes' provenance files). The ElevenLabs connector is available in this session, but generating ~6.8 minutes of
speech spends ElevenLabs credits, and the brief says not to spend paid credits without explicit authorization. So I did
not generate it. **To switch:** authorize the spend; then generate each line of `script/segments.json` with the Test
Voice (same line split), drop the clips into `audio/narration/seg/`, and re-run the join/audio/SRT/render steps. Every
scene is keyed to the measured line timings, so the animation re-times automatically; expect the runtime to move by a
few seconds and re-check the hook freeze (§6).

Known voice limitations in the review take: flat, slightly synthetic prosody; "Elon" sounds like "Alon"; less
variation in emphasis than the delivery notes in the script ask for.

## 3. Visual inspection performed (by me, on still frames — not real-time playback)

I cannot watch video in real time or listen to audio in this environment. What I did:
- Rendered model sheets of every asset (ship, booster, tower, plan views) and checked silhouettes against the
  reference bible (`qa/sheet0-2`).
- Contact sheets every 3 s across the whole rendered MP4 (`qa/review_v1b/sheet_*.png`) and frame samples every
  2.6–4.2 s during development (`qa/p1`–`p5`, `qa/hook`, `qa/fix1`, `qa/fix2`).
- First frame, 0–3 s, 3–10 s and the full first 30 s at 1.5 s spacing; every mechanical catch (hook, booster, ship,
  payoff, restack); reentry; the flip; the tower/arm sequence; the last 30 s.
- Transition strips (frames −9, −3, 0, +3, +9) at all 18 scene boundaries (`qa/strips/`).
- Pixel check of frame edges at scene ends (found and fixed a 14 px black sliver, see §5).

Audio was checked only by measurement (loudness, peaks, silence, voice-to-bed ratio) and by speech recognition.

## 4. Subtitle timing method
Each narration line is a separately generated clip; its start/end in the final track are measured, not estimated
(`source/src/data/timeline.json`). Lines longer than 84 characters are split at punctuation and the split is snapped to
the nearest real pause (≥ 90 ms) found in that clip's waveform. Cues end ≤ 0.6 s after speech. **If the voice is
replaced, regenerate the SRT** (`tools/make_srt.py`).

## 5. Defects found and fixed during QA
1. Labels missing in four scenes (rendered outside an SVG) → fixed.
2. Parked arms overlapped the stacked rocket (looked like a catch) → parked arms swung further open.
3. Background skyline floated in the sky at high camera positions → anchored to the horizon.
4. Hook macro shot showed an unpainted band above the sky gradient → sky extended.
5. Trajectory-map vehicles too small to read; orbit-scene icons too small → enlarged.
6. Hot-staging camera lost the ship after separation → camera now follows the gap.
7. Booster landing camera framed empty sky → re-aimed at the vehicle.
8. "Too fast" shot looped (vehicle teleported) → single continuous descent.
9. Caption overlapped the vehicle in the offset diagram; history labels overlapped icons → moved.
10. 25 near-static holds > 2.5 s → slow per-scene camera drift (alternating push/pull).
11. The drift exposed a black edge at the end of some scenes → minimum 2 % overscan.

## 6. Unresolved concerns / recommended changes before the 4K master
1. **Voice** (§2) — the biggest remaining gap. Replace with the approved FGW voice after authorization.
2. **Verify against official SpaceX pages** (blocked here): V3 grid-fin layout and catch point, chopstick changes,
   heights, Pad 2 role, exact quotes (Sources §4). Adjust the fin layout in `SuperHeavy.tsx` if it differs.
3. Hook: the low-angle "inside the tower" view was not built (concept E); the hook uses a side tracking shot, pull-back,
   close-up and macro freeze. A true perspective view would add impact.
4. The trajectory map and the "most rockets / Falcon 9" comparison are the plainest-looking scenes; they could use
   richer illustration.
5. Earth (orbit/reentry scenes) is stylised; clouds read as blobs.
6. Music is an original synthesized score (pads, bass, pulses) — functional, not cinematic. Consider a licensed or
   composed score for the master.
7. Sound effects are synthesized (rumble, wind, servo, clunks, whooshes, ticks); no field recordings.
8. Ship catch interface, carriage and arm internals are conceptual (labelled on screen).
9. Flight 15 facts may change before launch (date, license, sequence). Re-check on the day of the master.
10. No one has watched it in real time with sound. Please check lip-sync-free timing feel, mix balance on a phone, and
    whether the freeze in the hook (0:12.9–0:15) feels deliberate.

## 7. Third-party footage
None used. No SpaceX, news or agency footage was downloaded. Rights status: not applicable. All historical events are
original vector reconstructions labelled RECONSTRUCTION / SCHEMATIC / ILLUSTRATION; all future events are labelled
ILLUSTRATION · PLANNED ATTEMPT, CONCEPTUAL, or HYPOTHETICAL.

## 8. Retention audit (my judgement)
- **First 5 s:** a stainless ship with engines lit dropping past a tower lattice at sunset; disclosure badge appears at 0.6 s.
  Legible without context.
- **First 30 s:** premise is explicit by 0:21 (booster caught 3×; ship next) and the problem framed at 0:27.
- **First minute:** new information (two stages, 33 engines, 124 m, Falcon 9 comparison, the Oct 20 announcement).
- **Middle:** visuals change every 3–5 s; the risk section is a sequence of short diagrams. The trajectory map (1:11–1:40)
  is the most abstract stretch.
- **Final two minutes:** catch mechanics → risks → full mission montage → restack; ends on the opening image resolved
  (a caught ship becomes a whole rocket again) with the line "This one is built to be caught."

## 9. Exact 4K export procedure (after approval only)
Native vector render at 2× scale from the same source and the same mix (not an upscale):

    cd Future_Got_Weird/starship-dual-catch/source
    npx remotion render src/index.ts Main ../exports/FGW_Starship_Dual_Catch_FINAL_4K.mp4 \
      --scale=2 --props='{"audio":"mix"}' --concurrency=3 --crf=16 --x264-preset=slow \
      --audio-codec=aac --audio-bitrate=320k --color-space=bt709
    python3.13 ../tools/qa_video.py ../exports/FGW_Starship_Dual_Catch_FINAL_4K.mp4   # expect 3840x2160, 30 fps

If the voice is replaced first: `tools/make_narration.py` (or the ElevenLabs clips), then `make_audio.py`,
`make_srt.py`, re-check stills, then render. Expected 4K render time here: roughly 2–3 hours on 4 cores.

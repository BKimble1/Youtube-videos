# Why This Robot Has No Pinky — Atlas Short (Future Got Weird) — V4

Vertical Short, native **1080 × 1920, 30 fps**. **V4 is the final presentation-and-pacing pass of V3; unpublished, not uploaded, not scheduled.** Default cut **31.87 s** (retimed narration); an original-pace cut (**34.60 s**) is delivered alongside. V3, V2 and V1 stay available under `v3/`, `v2/`, `v1/`. Review status and limits: `QA_REPORT.md` (**nobody has watched or listened to V4 yet**, and the retimed narration has not been auditioned by ear); before/after audit: `qa/v4/V4_BEFORE_AFTER_AUDIT.md`.

## Files

| Path | What |
| --- | --- |
| `FGW_Atlas_No_Pinky_V4_1080x1920.mp4` | V4 clean render, retimed narration (default, 31.87 s) |
| `FGW_Atlas_No_Pinky_V4_Captioned_1080x1920.mp4` | V4 with the Montserrat caption lane (same audio) |
| `FGW_Atlas_No_Pinky_V4.srt` | V4 captions, 24 cues, aligned to the retimed narration |
| `FGW_Atlas_No_Pinky_V4_OriginalPace_1080x1920.mp4`, `…_OriginalPace_Captioned_1080x1920.mp4`, `FGW_Atlas_No_Pinky_V4_OriginalPace.srt` | Same V4 picture on the unchanged narration (34.60 s) |
| `cover/FGW_Atlas_No_Pinky_V4_Cover.png` | Cover (opener frame, no captions; no new generation) |
| `audio/v4/` | Retimed narration (`narration_fast_48k.wav`), time map, retime report, `cues_{fast,orig}.json`, mix, stems, `sfx_log.csv`, `MIX_LOG.json`; `audio/v4/original_pace/` for the original-pace mix |
| `source/` | Editable Remotion project (pinned deps, lockfile). V4 = `src/v4/*`, `src/cues_v4_{fast,orig}.ts`; V3 = `src/v3/*`; V2 = `src/v2/*`; V1 = `src/Film.tsx`, `src/film/*` |
| `tools/` | `timemap_v4.py`, `retime_v4.py`, `build_cues_v4.py`, `build_audio_v4.py`, `fontmeasure.py`, `check_contacts.mjs`, `qa_v4.py`, `qa_v4_sheets.sh` (+ the V1–V3 builders) |
| `script.md`, `claim_ledger.md`, `credits.md`, `QA_REPORT.md`, `PRODUCTION_STATE.md`, `packaging_draft.md` | V4 documents (V3 copies in `v3/`) |
| `qa/v4/` | Contact sheets, 360 × 640 caption sheet, safe-zone overlay with a conservative Shorts UI mock, transition bursts, first/last-state and seam frames, `automated_checks*.txt`, caption/font audit JSON, `V4_BEFORE_AFTER_AUDIT.md` |
| `handoff/V4_Final_Presentation_and_Pacing_Prompt.md` | The owner's V4 prompt, for reproducibility |

Compositions: `Short` / `ShortCaptioned` (alias of V4 — they select `FilmV4`), explicit `ShortV4` / `ShortCaptionedV4`, `ShortV3` / `ShortCaptionedV3`, `ShortV2` / `ShortCaptionedV2`, `ShortV1` / `ShortCaptionedV1`, and `CaptionAudit` (browser-side font/caption measurement, used by QA). **The pace is chosen at bundle time:** `REMOTION_PACE=orig` selects the original-pace narration, cues and mix; anything else is the retimed pace.

## Rebuild

```bash
cd source && npm ci                       # pinned Remotion 4.0.533 / React 19.1.0 / TS 5.8.3 (+ @fontsource/montserrat, barlow-condensed 5.3.0)
npx tsc --noEmit
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell   # headless *shell* is required
F="--crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --browser-executable=$HS --concurrency=4"
npx remotion render src/index.ts Short            ../FGW_Atlas_No_Pinky_V4_1080x1920.mp4 $F
npx remotion render src/index.ts ShortCaptioned   ../FGW_Atlas_No_Pinky_V4_Captioned_1080x1920.mp4 $F
REMOTION_PACE=orig npx remotion render src/index.ts Short          ../FGW_Atlas_No_Pinky_V4_OriginalPace_1080x1920.mp4 $F
REMOTION_PACE=orig npx remotion render src/index.ts ShortCaptioned ../FGW_Atlas_No_Pinky_V4_OriginalPace_Captioned_1080x1920.mp4 $F
```

Cue tables, retime, sound and checks (only needed if timing, effects or picture change):

```bash
python3 tools/retime_v4.py         # audio/narration_48k.wav -> audio/v4/narration_fast_48k.wav + map_fast.json (1.05x atempo + 8 planned gap trims; verifies the map, max lag 10 ms)
python3 tools/build_cues_v4.py     # alignment + time map -> audio/v4/cues_{fast,orig}.json, source/src/cues_v4_{fast,orig}.ts, V4 SRTs
python3 tools/build_audio_v4.py fast && python3 tools/build_audio_v4.py orig   # SFX + exactly periodic music bed, ducking, loudness -> source/public/audio/final_mix_v4_{fast,orig}.wav
node tools/check_contacts.mjs      # per-frame pad-to-object gaps: TURN, washer, blocks, drill trigger; fails above 8 px
node source/scripts/audit_captions.mjs qa/v4/audit_fast.json fast   # real Chromium measurement of the caption layout, fonts and headline extents
python3 tools/qa_v4.py fast        # automated checks -> qa/v4/automated_checks.txt   (python3 tools/qa_v4.py orig for the original-pace cut)
tools/qa_v4_sheets.sh              # contact / phone / safe-zone / transition / seam sheets
```

The narration (`audio/narration*.{mp3,wav}`) is a paid ElevenLabs generation reused unchanged: **do not regenerate** it. `node source/scripts/frames.mjs <outDir> ShortCaptioned 0,48,550 0.5` renders individual frames (prefix with `REMOTION_PACE=orig` for the original pace).

## How V4 fits together

- `src/v4/FilmV4.tsx` assembles the shots: the three signature transitions (tape wipe, stamp iris, closing receipt tear) plus short 5-frame **edge wipes** (the incoming scene does not translate, so no artwork is dragged through the fixed caption lane); the closing tear reveals the opener rendered at negative time (`t = frame − TOTAL`), so the last frame is the opener one frame before frame 0. There are no persistent source strips or tags.
- `type.tsx` the type system (`Hed` headlines, measured caption layout, `CaptionsV4`, audit helpers) · `fonts4.ts` bundled fonts, held until rendering is proven · `cues.ts` pace selection and the old→new time map (`fm(oldFrame)`, `tm(oldSeconds)`) · `opener.tsx` front-view pinch/release (drives frame 0 **and** the pre-roll) with the single company kicker · `stage.tsx` backdrops · `shots1.tsx` overhead test + decision slip · `shots2.tsx` mechanism with the thumb-joint loupe and the three capability shots · `shots3.tsx` tradeoff assembly, workstation, receipt · `contacts.ts` pad-capsule geometry and the `solveTip` contact solver · `contactCheck.ts` the per-frame audit.
- `src/hand/Hand.tsx` is the shared hand rig; it was not changed in V3 or V4.
- The music bed (`tools/build_audio_v4.py`) is exactly periodic over the video length: 17 bars at 128.03 BPM (retimed cut) / 18 bars at 124.855 BPM (original pace), tails wrapping across the replay point.

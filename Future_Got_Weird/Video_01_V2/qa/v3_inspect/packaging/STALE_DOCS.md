# Stale documents (V3 packaging audit, 2026-10-08)

**Current truth** (checked against the files, not the docs):

- **Approved V2.** Source commit `5bd35c1`, recorded in `APPROVED_V2.md`.
- **Timeline.** `source/src/data/timeline.json`: engine `v2`, 8,647 frames at 30 fps = 4:48.23, 10 scenes, 36
  segments, 695 words. It rebuilds byte-identical from `audio/narration/v2/manifest.json`.
- **Narration.** ElevenLabs `eleven_v4`, voice "Test Voice" (`kk5XaSLo2XAw0sKM98zU`).
  `source/public/audio/narration.wav` and `audio/narration/narration_v2.wav` are byte-identical (md5 `a33783e9…`).
- **Mix.** `source/public/audio/mix.wav`, made by `mix_v2.py --sfx-db -2 --sfx-duck-db 4`.
- **Captions.** `script/subtitles_v2.srt`, which `tools/build_timeline.py --engine v2 --srt-only` reproduces
  byte-identically.

"Stale" below means the file describes pass 2 / V1, or an unfinished V2 state. None of these files is a reason to
discard current work.

## Must update before delivery (public, or used to produce public files)

| File | What is stale | Update to |
|---|---|---|
| `script/FINAL_SCRIPT.md` | The whole file is pass 2. Header: "pass-2 v1.0", "694 spoken words", "measured runtime 280.8 s", "voice Marcus K". s03 is the pass-2 line ("Three polished answers. All wrong. …"); V2: "Three different answers. None of them are right. Not one even had the right year." s29 is the pass-2 line ("Which leaves the unglamorous move: check."); V2: "The unglamorous move: check." 35 of 36 timestamps differ (only s01 matches), drifting from −1.1 s at s10 to +6.3 s at s36. Scene start times are not given | `FINAL_SCRIPT_DRAFT.md` here, generated from the V2 records by `export_script_v3_DRAFT.py`. Do not regenerate with `tools/export_script.py` as it stands: for engine `v2` it writes "they will shift slightly with the premium voice", and its only voice sentence names Marcus K |
| `script/subtitles_v2.srt` | Current timing, but it fails the caption rules in 5 ways (see the caption findings): 4 cues mix two segments (11, 60, 86, 92); 11 cues end 26–55 ms before their last word ends (3, 18, 21, 34, 39, 47, 49, 50, 55, 95, 97); cue 92 has a 43-character line; 3 cues read above 20 characters/s (34, 43, 76); cues start on the aligned word, which lags the audible onset (62/103 cues start more than 30 ms late) | `subtitles_v2_DRAFT_regenerated.srt` here, made with the patched `build_srt` (`build_timeline_srt_v3.patch`). Check it with `check_srt.py` |
| `package/UPLOAD_PACKAGE.md` | Pass 2 throughout: L1 "pass 2"; L4 runtime 4:40.8 and the Pass_2 master name; L10 "on screen at 0:30" (V2: from 0:29); L36/L38 wording ("sometimes a university", "in under a minute"); L41–L50 chapters; L53–L54 links (arXiv abs, Microsoft Research thesis), no Nature entry; L60–L62 credits (Marcus K, pass-2 music and effects); L75 "every chapter … at least 14 seconds" (S8 is 13.8 s); L83–L84 SRT name, "102 cues … 43 characters … 14.9 cps" (V2 file: 103 cues, mean 14.6 cps; regenerated: 105 cues, ≤ 42 characters, mean 14.2 cps); L96 cites `qa/tech_…Pass_2_1080p.md`, which does not exist in V2; L100 cites `qa/QA_REPORT.md`, which does not exist in V2; L101 "check whether a newer version changes Table 1 or Table 2" (now: v1 pinned + Nature); L104 end screen "over the last 20 seconds" (the end card appears at about 4:37) | `DESCRIPTION_DRAFT.md` and `CHAPTERS_DRAFT.md` here, plus the claims audit's Sources block |
| `thumbnails/thumbnail_{A,B,C}.*` | Pass-2 renders at 1920×1080. C has the DeepSeek/Llama quotes in the wrong order. Re-rendering A/B/C from current source drops "CMU) is entitled:" | `THUMBNAIL_NOTES.md` here. Deliver one 1280×720 JPG/PNG under 2 MB |
| `source/src/Thumbnails.tsx` | `SlipText` predates V2's `SLIPS` fields (`uni`, `mid2`), which garbles the excerpts in all three thumbnails | `Thumbnails_minimal_fix.patch`; optionally `ThumbA4` from `Thumbnails_A2_A3_A4_prototypes.patch` |
| `assets/asset_manifest.csv` | Narration row: "voice Marcus K … ten blocks … 694 words", file size 40,438,842 (V2: Test Voice, 17 sections × 4 takes, chosen line by line, 36 segments, 695 words, 41,505,164 bytes). Music row: `tools/make_music.py`, 280.8 s, `audio/music/music_bed.wav` (V2: `tools/make_music_v2.py`, `audio/music/v2/music_bed.wav`, 288.2 s). Effects rows list only the pass-2 effects; the 144 V2 ElevenLabs takes (`audio/sfx/v2/raw`, 52-kind library, `SELECTION_V2.md`), the 10 reused pass-2 effects and the synthesized tick are missing. No row for `source/public/audio/mix.wav`. Thesis rows name the Microsoft Research PDF; the description will cite the CMU URL. Fine to keep as provenance, but say so. `paper_p02_table1.png` is "reference … not shown"; `paper_p01_header.png` is now used in S1 **and** S7 | Rewrite the rows for V2. If the raster audit re-extracts any page at higher resolution, update `pixels/bytes/sha256` |
| `README.md` | "**Status: V2 is not finished.** … The finished film is still the V1 / pass-2 render"; "4:48.2 with the V2 narration" is right, but the status, layout notes ("FINAL_SCRIPT.md … are pass-2 / V1", "storyboard/ research/ package/ assets/ thumbnails/ carried over from pass 2") and "work/ … where scene rebuilds were in progress" describe the pre-merge baseline. The anonymity line says the materials "were audited" (that was the pass-2 audit) | State: V2 approved (`APPROVED_V2.md`), V3 = final polish + 4K (`V3_CHANGELOG.md`). Point to `DELIVERABLES.md`, give the final file names, and record the actual render command |
| `DELIVERABLES.md` | **Missing.** `../Video_01_Pass_2/DELIVERABLES.md` exists; V2 has none | Create it for V3: 4K master, 1080p review, SRT, thumbnail, description/chapters, script, source and lockfile, render command, narration/mix/stems, checksums, storage location and recovery steps |

## Should update (internal, but they contradict the final film)

| File | What is stale |
|---|---|
| `V2_STATUS.md` | Frozen at the baseline (`29aa09f`). It says S3–S10 are unmerged, there is no V2 mix or `mix.wav`, and no V2 review render. All of that was superseded by `5bd35c1` (`APPROVED_V2.md`). Keep it as history, but add a one-line "superseded by APPROVED_V2.md / V3 status" banner at the top, or have README stop calling it the file to "read first" |
| `BASELINE.md` | Accurate as a pointer to the **frozen baseline** `29aa09f`, but it does not say that this is not the approved film. Add a cross-reference to `APPROVED_V2.md` (`5bd35c1`) so nobody restores the WIP baseline by mistake |
| `APPROVED_V2.md` | Current. It refers to `V3_CHANGELOG.md` "once it exists" (to be written) |
| `storyboard/STORYBOARD.md` | Pass 2: "Runtime 4:40.8 (8,425 frames)", "scene changes are 12-frame paper wipes" (V2 uses per-boundary cut/reveal/wipe/iris in `Main.tsx`), V1 staging per scene. Either mark it historical, or point to the V2 scene headers (each `src/scenes/S*.tsx` opens with its word-keyed beat list) |
| `research/sources.md` | Pass-2 ledger: "cross-checked against … pass-2 v1.0"; quotes the pass-2 wording of s03/s29; cites `qa/QA_REPORT.md`; thesis via Microsoft Research only; arXiv abs. Superseded by `qa/v3_inspect/claims/CLAIM_LEDGER.md` once that is promoted |
| `qa/` | `v1_review/` is V1 analysis (history). `v2_motion/` holds S1/S2 only (no S3–S10 motion record). `render/` logs belong to the V2 renders. Missing: `qa/CORRECTIONS.md` (the channel brief requires a per-episode correction log), a QA report, and a tech report for the delivered exports (pass-2 docs point to `qa/QA_REPORT.md` and `qa/tech_…md`, which do not exist in V2) |
| `script/subtitles_elevenlabs.srt`, `script/narration_blocks.json`, `script/cues.json` | Pass-2 / V1 artefacts kept next to the V2 files. README says so, but `subtitles_elevenlabs.srt` is the pass-2 (Marcus K) timing and could be uploaded by mistake. Move it to an archive folder, or name it clearly |
| `tools/export_script.py` | The voice sentence is hard-coded for engine `elevenlabs` (Marcus K). For engine `v2` it prints the draft-voice caveat. Use `export_script_v3_DRAFT.py` |
| `tools/build_timeline.py` | `build_srt` merges short fragments across segments, clamps cue ends before the last word, allows 44-character lines and starts cues late. Fix: `build_timeline_srt_v3.patch` (dry-run applies cleanly). Docstring usage lists only `draft_local` / `elevenlabs` |
| `source/package.json` | `"name": "future-got-weird-video-01-pass-2"`, description "(pass 2)", and a `render:1080` script with CRF 16 / JPEG frames. Private (not in any export), but record the actual V3 render command elsewhere instead of relying on this script |
| `../CHANNEL_BRIEF.md` (series level) | "Video 01 runs 4:41"; narration tooling "voice **Marcus K** (`3H55HGnNE1XjYxigHSAS`)"; "Voice stays Marcus K unless an audition exposes a limitation". V2/V3 use "Test Voice" by the owner's decision. The QA row cites `qa/QA_REPORT.md` |

## Not stale

`V3_BRIEF.md`, `V2_BRIEF.md` and `V2_DIRECTION.md` are direction documents, kept as history. Also not stale:
`script/narration_segments.json`, `narration_sections.json`, `narration_selection.json`,
`audio/narration/v2/manifest.json` and `source/src/data/timeline.json`. These are the V2 records, and they agree with
each other. `backup/v2_baseline/RESTORE.md` and `backup/v2_review_build/` are current for what they back up.

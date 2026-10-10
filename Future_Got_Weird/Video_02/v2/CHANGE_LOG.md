# Video 02 v2: change log against the owner's brief

How Cameras See Around Corners · Future Got Weird · v2 editorial pass (9-10 October 2026).
`v2/REVISION_BRIEF.md` governed the pass. v1 is preserved exactly (`v2/V1_BASELINE.md`).

Line-by-line and shot-by-shot old-to-new mapping: `v2/EDIT_MAP.md`.
QA results and remaining limitations: `v2/QA_V2.md`.

## At a glance

| | v1 | v2 |
|---|---|---|
| Runtime | 6:44.0 (12,120 frames) | **5:23.9** (9,716 frames), including a 10.0 s end screen |
| Narration | 48 lines, 1,111 words | **51 lines, 899 words** |
| Structure | 9 scenes in five acts | **13 scenes in seven question sections** (A hook, B to F the brief's questions, G takeaway); one chapter per section |
| Real U reconstruction | 5:07 | **2:17**, right after the geometry, behind "And here's a real one." |
| History | about 1 minute | **about 25 s of narration**, keeping the 2021 cheap-sensor precedent |
| Voice | Test Voice, 21 sections | Test Voice; 19 lines keep their v1 take, **32 lines are new takes** (22 recording blocks × 4 takes, each spoken with its neighbouring lines as context) |
| Music | v1 score | **re-scored** (`tools/make_music_v02v2.py`) to the new structure |
| Effects | 317 cues | **211 cues**, trimmed vocabulary |
| Mix | -15.5 LUFS, -1.3 dBTP | **-15.52 LUFS, -1.3 dBTP** (measured; see QA) |
| Thumbnail | C | **D** (one sensor, one wall spot, one path behind the partition's end to the hidden guesser) |

## Brief item → what changed

| Brief item | Change |
|---|---|
| **Preserve v1 and isolate the revision** | v1 is restorable from commit `40183b0`; its takes, rendered audio and films stay in `backup/v02/{sources,rendered,films}`. v2 deliverables carry `_v2_` and have their own backup groups (`v2_sources`, `v2_rendered`, `v2_films`, `v2_runs`). |
| **Rebuild the first 30 s** | Obstruction by 2 s (dashed sight line stops at the partition, "blocked"). Hard cut to the real tracking board on "researchers" at 6.1 s. "That dot is their position estimate. Not a photograph." by 13.6 s. The timing idea is told by the two-pulse race and the arrival timeline (14-22 s). The time-of-flight sensor close-up comes at 22-26 s, and the hook question with the first arc at 26.5-29.9 s. "a wall", not "that wall". |
| **Real data in the opening, accurately** | The board plots the authors' **saved** estimates (`stored_xz`): data index 6 onward, every 2nd frame, one plotted position per video frame, no interpolation, tagged "sped up" (40 px). The guesser never appears on it. |
| **Runtime 5:15-5:45, end screen 8-12 s** | 5:23.9; end screen 10.0 s (5:13.87-5:23.87) with empty guide panel and disc at YouTube's element positions; placement steps in `package/END_SCREEN.md`. |
| **Question chains** | Five spoken questions (B, C, E, F; D's shown as a chapter title), each on screen as a 64 px title for its line only, each answered before the next. |
| **Real reconstruction moved into geometry; history compressed** | The U builds from the authors' 36 real partial sums from 2:17 on a visibly different "Real data" board and holds 2.5 s after "U."; the museum covers 2012, 2018 (plate), 2021 and the 2021 cheap-sensor tracking result, then 2026 and "Their new idea". |
| **Consumer hardware + motion-aware fusion** | Three problems as single beats (weak laser, about 100 pixels, handheld jiggle); night-mode analogy labelled; what changes between frames, why plain adding smears, one unknown at a time, the two modes (still object + sensor at known positions, as for the U; still sensor + drifting guesses), "keeps up instead of smearing". v1's "puts the motion to work" is gone; no "sharper". |
| **Results with conditions beside them** | The kit board returns with its provenance column: ST kit, held still, not the phone-grade device; under US$100 (authors' figure); setup; frame counter; the narrow software-check chip. Then two spoken conditions (reflective material on many targets; clothing not recorded) and the separate ordinary-clothes test (30 frames/s capture, different device, our drawing). |
| **Warehouse as potential use; concise takeaway; one callback** | "potential use" held throughout; no range number; "not a safety system". Takeaway n31 and one J4 callback (he pushes the partition; the checker just looks). |
| **Labels 60-72 px in the first minute, judged at 390 px** | Key teaching labels 64 px in V1-V4 and on every evidence board; integrity chips raised to 40 px after review; every group checked its stills at 390 px wide. |
| **Matched transitions; characters with explanatory roles** | Board → plan match (V1→V2), timeline → sensor display, push into the wall's paint (V2→V3), ring on the bump → ring on W1 (V4→V5), roll-up onto the museum shelf (V6→V7), card into plan (V8→V9), "keeps up" panel → real board (V9→V10), card partition → warehouse corner (V10→V11), warehouse corner → room partition (V11→V12). The guesser's beliefs are acted, not captioned; the checker taps and points at results. |
| **Scientific integrity** | Confocal round trip S→W→H→W→S; "about 30 cm of travel per ns; there and back, so about 15 cm farther from the wall spot"; one worked example on our plan only (8.9 ns, 2.65 m there and back, 1.33 m each way, "illustrative"); four evidence contexts kept apart; no "first" claim for 2026; the broad C38/C41 absence claims retired; claims P01, P02, P03, P06 and P08 added to `research/claims.csv`. |
| **Narrower reproduction wording** | On screen: "our check: their code + their data → matched their saved results · a software check, not a new experiment". The description gives the date, commit and median 8 cm gap, scoped to the software. The run logs and states are preserved (`backup/v02/v2_runs`). |
| **ElevenLabs Test Voice; hook and bridges in coherent blocks** | The same designed voice (`eleven_v4`); delivery tags for question, discovery and limitation; five rushed or quiet new lines re-recorded with more breathing room and chosen by measurement; designed pauses applied as caps, with in-line breaks over 0.35-0.40 s tightened on six reused lines. |
| **Re-scored music** | Curious pulse (A, B); the quietest bed under geometry and fusion (C, E); +1.5 to +3 LU lifts on the four real-data reveals; a short drop before a reveal; the U resolve lands on "U." and rings over the hold; dry silence for the J4 gag; a clean resolve into the end screen that waits for "corner." and fades to exactly zero. |
| **Runway** | No jobs this pass (0 credits; the v2 balance and authorization are unchanged at 60 of 500 spent): the output host is still blocked by the environment's network policy (proxy 403, rechecked 9 October 2026), so no clip could be inspected, and the brief forbids unchecked inserts. Every acted beat is a reviewed Remotion rig shot. |
| **Title and thumbnail** | Title kept: "How Cameras See Around Corners" (the alternative was considered and not used; see `package/titles.txt`). Thumbnail D selected after comparing A-D at 160-200 px (`qa/v2/thumbs/compare.jpg`). |
| **One focused correction cycle** | The first complete v2 render was reviewed through five lenses and a skeptic (44 verified defects: 0 blocker, 3 major, 12 minor, 29 polish; `qa/v2/REVIEW_V2_R1.md`). One fix round worked all 44, each group verified independently; a release check of the fixed render closes the log (`qa/v2/REVIEW_V2_R2.md`). |

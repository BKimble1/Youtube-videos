# Video 01 · V3 — final polish and 4K delivery: change log

V3 is a restrained polish of the approved V2 (source `5bd35c1`, review `…V2_1080p_REVIEW_chat.mp4`, see
`APPROVED_V2.md`). Story, cast, palette, sets, transitions, jokes, the V2 "Test Voice" narration and its timing are
unchanged: `source/src/data/timeline.json` is byte-identical to V2 (8,647 frames, 4:48.23, 30 fps). The changes
are the defects found in an interval-by-interval inspection of the V2 render and source (one inspector per
interval, against `V3_BRIEF.md`), a few clear opportunities, measured audio masking fixes, the end-card music, the
packaging, and a true 4K render from source.

Commits on `claude/new-session-96c7w8`: `2c71915` (brief + inspection material), `05f2f19` (S1–S7, effects levels,
captions, script, thumbnail), `b42e00a` (S9/S10, end music, docs), then the delivery commits (exports backup, final docs).

## Defect log (found → fixed → verified)

Severity is the inspector's. "Verified" means re-rendered stills (1080p) at the frames named, and the neighbouring
transitions, looked at after the fix; the final renders were then checked again (see `qa/V3_QA_NOTES.md`).

| ID | Where | Defect (V2) | Fix | Verified |
|---|---|---|---|---|
| S1-1 | slip A everywhere (S1, S2, S3, S9, S10) | last title line "Learning.”" cut by the card edge | slip A only: padding 12 px, line-height 1.2, detail gap 3 px (`AnswerSlip.tsx`); S9's word overlay mirrors it (`S9_Docs.tsx`) | f305, 760, 816/817, 1360, 7230, 7320, 8118 |
| S1-2 | 0:16.5–0:25.8 | slip B's WRONG stamp printed across its false year 2005 | per-slip stamp anchor; B's stamp in the empty band below the year | f499–540, 760 |
| S1-3 | 0:17.6–0:20 | false years never shown large | the coral chip reads "2002 · 2005 · 2007 — none of them right" (44 px) | f566, 592 |
| S1-4 | 0:21.7–0:23.7 | "Lead author" box/chip cut through "OpenAI" on the real paper | box encloses name + affiliation; chip on blank paper | f655–700 |
| S1-5 | 0:26.2 | punchline caption spilled past its box for 2 frames | box widens earlier, smaller slam | f784–790 |
| S1-6 | 0:26.7 | clerk A's hand vanished under the lifting slip | small hand-to-chest just before the lift, elbow down (the first version raised the elbow across his face; caught by the regression review and fixed) | f794–805 |
| S1-7 | 0:26.3–0:26.7 | close-up cut a slip text line at the frame bottom | close-up 16 px higher | f788–801 |
| S2-1 | 0:31.2 | "The short version" chip hidden behind card 2 | chip drawn above the cards | f937–948 |
| S2-2 | 0:42.8 | FUTURE/GOT/WEIRD ran together while popping in | overshoot capped at 5 % | f1278–1296 |
| S2-3 | 0:34.6 | "ai" tile vanished short of its slot | flight lands on the hand-off frame | f1033–1042 |
| S2-4 | 0:32–0:42 | "illustrative" label 26 px (< 30 px guard-rail minimum) | 30 px | f980, 1215 |
| S2-5 | 0:27.2 | shadow flash on the S1→S2 cut | no lift shadow on S2's first frames | f816/817/818 |
| S2-6 | 0:31.0 | card 1 fell onto the title while it was still on screen | title leaves 4 frames earlier | f919–937 |
| S3-1 | 0:57.7 | real token id "id 1361" visible ~9 frames | each id label leaves with its own tile; ai's appears earlier | f1728–1750 |
| S4-1 | 1:42.7 | catalogue card: fist over its header, one-frame layer swap, thumb sliding across the face | grip from behind as the fingers take it; knuckles on the top edge; thumb only at the edge | f3074–3110 |
| S4-2 | 1:53.5 (opportunity) | finished title never settled before the flip | flip lands on "answer" | f3404–3460 |
| S5-1 | 2:14.7 | verdict tick sat on "(completed", the line above CMU | tick removed (ring + chip carry it); its sound moves to the chip | f4042–4060 |
| S5-2 | 2:15.8 | record's "1" enlarged by a copied, doubled glyph on the genuine document | no copy/scale: a small teal outline round the real "1", held with the slip's coral "2" | f4075–4110 |
| S5-3 | 2:11.7 (opportunity) | marked close-up settled only ~0.33 s | pull-out 6 frames later | f3952–3996 |
| S5-5 | 2:26.2 (opportunity) | lens rim vanished as the iris opened into S6 | the rim rides the iris edge, fading as it widens (`Main.tsx`) | f4386–4404 |
| S5-6 | 2:23.2 (opportunity) | double image as the magnified view faded in | 3-frame switch | f4296–4306 |
| S6-1 | 3:13.7 | trophy landed through the Honest player's forearm (layer swap) | arms go up as it comes | f5806–5830 |
| S6-2 | 3:12.7 | Guesser's fist slapped through the trophy's face | trophy in front from the hop; reach starts later | f5778–5790 |
| S6-3 | 3:13.6 (opportunity) | one-frame 130 px launch | smoother hop arc | f5806–5814 |
| S6-4 | 2:42 (opportunity) | complete +1/0/0 board readable only ~0.55 s | board holds 6 frames longer | f4864–4930 |
| S6-5 | 2:39–3:15 (opportunity) | "Wrong" nearly touched its value window | Wrong card 20 px wider | f4872, 5531 |
| S7-1 | 3:18.9–3:33.9 | 9/10 drum overlapped the panel's bulb row | drum row 6 px higher | (render check) |
| S7-2 | 3:22–3:25 | WildBench exception louder than the no-credit rule | exception tag recedes to 55 % as the coral column lights; rings 3 px | (render check) |
| S9-1 | 3:51–4:05 (major) | SOURCE/CLAIM slot labels ~2.1:1 contrast, unreadable | solid ink-muted bold labels, darker outlines | f6930, 7000, 7125 |
| S9-2 | 4:12.4 | stamp print visible under the pad while pressing | pad centred on the print; impression appears as it lifts | f7570–7585 |
| S9-3 | 4:12.5–4:13.2 | CLAIM FAILS printed ~30 px off the paper | size 36, centred on the card (shared hand-off H910, so S10 matches) | f7585, 7595/7596 |
| S9-4 | 3:54, 4:00, 4:05 | three camera moves whipped at 215–300 px/frame | sine ease (S8's), same start/land frames | (render check) |
| S9-5 | 4:01–4:11 | scan-beam base line struck through "“Boosting" | base in the target line's own descender zone | f7320, 7352 |
| S9-7 | 4:09.7 (opportunity) | record's lights pulled the eye on "Claim fails" | record beam steps back on the claim flip; source evidence glows on "Source exists" | f7489–7540 |
| S9-8 | 4:08.3 (opportunity) | 2001 close-up held ~8 frames | 2001 settles ~13 frames before the pull-out | f7452–7489 |
| S10-1 | 4:40.5–4:48.2 | ~7.5 s with no music; near-silence under the end screen | end-card pad sustains under the last sentence and the card, fades to silence on the last frame | measured (below) |
| S10-3 | 4:30 (opportunity) | coral ring cut the "y" and "?" | ring round "this?" | f8105–8130 |
| S10-4 | 4:40–4:48 (opportunity) | sources line 32 px (~11 px on a phone) | 36 px, 12 px higher | f8450–8646 |
| F2 | 1:55–2:01 (claims audit) | "the confidence comes with it" could read as a measured confidence | S4 footer adds "confident wording, not a measured confidence" | f3430–3460 |

The other inspector findings are the same defect seen from another interval or are handled outside the scenes:
S3-2, S9-6 and S10-2 are S1-1 (the shared slip art); S5-4 is the 4K raster swap (below); S10-5 is the description's
Sources block (below). All 43 findings, and the KEEP lists of things inspected and deliberately left alone, are in
`qa/v3_inspect/visual_findings.md`.

## Audio

- Narration: unchanged (V2 Test Voice takes, same timing). No line was re-recorded: the claims audit found no
  factual error, and no audible defect could be established without playback (see the listening checklist).
- Effects whose measured speech-band level reached the voice on a word were lowered: bell on "dissertation" −4 dB;
  third module clunk on "search" −4; three quiz buzzers −1→−5 and the ding +2→−2 under "so on average, one lands";
  dock clunk −4; NO GUARANTEE stamp +2→0 (level with the other heavy stamps); claim_fails 0→−5 (it was the loudest
  effect under speech); the paper slide on "matters" −4→−8; the SOURCE? stamp and gavel on "too" −3 dB each.
  Effects that follow moved visuals moved with them (S4 flip, S5 chip, S6 podiums).
- Music: the end-card string pad now sustains under "New episodes twice a week, if you'd like to subscribe" and
  the end card (−32.6 to −34 LUFS after the last word, 5 dB under its ducked level), with one soft vibes re-strike,
  and the fade reaches silence on the last frame (it used to run 0.5 s past the end). The bed is bit-identical to
  V2 before 4:35.
- Mix: `tools/mix_v2.py --sfx-db -2 --sfx-duck-db 4` (the approved settings): −16.01 LUFS integrated, −1.30 dBTP.

## Packaging and docs

- Captions: `tools/build_timeline.py` `build_srt` fixed (no cue spans two narration segments, cues never end
  before their last word, ≤ 42-character lines, up to 0.2 s lead for the alignment lag); `script/subtitles_v2.srt`
  regenerated (105 cues).
- `script/FINAL_SCRIPT.md` regenerated from the V2 records (`tools/export_script_v3.py`): it was the pass-2 script.
- Thumbnail: `Thumbnails.tsx` quoted the slip text wrongly ("CMU) is entitled:" missing); fixed, and thumbnail A
  now marks the slip the way the film does (highlighted title, ringed 2002, large WRONG stamp).
- Description: Sources now list the arXiv v1 preprint (source of the example and Table 2), the later Nature
  publication and the CMU thesis URL; credits no longer name the pass-2 voice.
- 4K rasters: the thesis title page, Table 2 and the paper header were re-rendered from the same PDFs at 1200 dpi
  (same crops; `qa/v3_inspect/assets4k/staging/crops.csv`, `assets/asset_manifest.csv`).
- Stale docs marked or updated (`V2_STATUS.md`, `BASELINE.md`, `storyboard/`, `research/sources.md`,
  `../CHANNEL_BRIEF.md`, `README.md`, `package/UPLOAD_PACKAGE.md`); new: `DELIVERABLES.md`, `qa/CORRECTIONS.md`,
  `qa/V3_QA_NOTES.md`, `qa/V3_LISTENING_CHECKLIST.md`, `research/CLAIM_LEDGER_V3.md`.

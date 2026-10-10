# Video 02 v2, review round 2: release-candidate closure log

**Render checked:** `exports/Future_Got_Weird_Video_02_v2_UPLOAD_1080p.mp4`, written 2026-10-10 02:47 UTC. It is 1920×1080 H.264 at 30 fps, 9,716 frames, 323.87 s of video and 323.88 s of 48 kHz stereo AAC (5:23.9), with the final mix. The mix stems in `audio/mix/v2/` (written 02:35) match its audio. The decoded AAC lines up with `final_mix.wav` at 0 samples of lag, and the difference is -59.7 dBFS, which is coding noise. The three stems sum to the mix within -58.5 dBFS.

**Not checked:** `exports/Future_Got_Weird_Video_02_v2_MASTER_4K.mp4` (written 03:24) was not opened in this round.

**Frame numbers:** frame N is at N/30 s. Seeking with `-ss N/30` returns exactly frame N; I confirmed this against a `select=eq(n,N)` decode at f182, f911, f4444 and f7260. Frames in V1-V5 match the r1 log. From V6's U hold onward, frames are the r1 numbers + 84 (the s37 pause grew from 1.2 s to 4.0 s). Every beat was located with the word frames in `source/src/data/timeline.json`.

**How this round worked:** three checks ran on this render: defect closure, seams and regressions, and sound and captions. This skeptic pass then did the following:

- Re-verified every item that any check left not closed, and every new item.
- Re-verified the closed verdicts for the three majors.
- Spot-checked nine more closed items by measurement (R1-05, -10, -13, -24, -30, -35, -37, -39, -40).
- Resolved the points where the checks disagreed.

**Paths:** evidence paths are relative to `qa/v2/review_r2/`. My own evidence is under `skeptic/`. The checks' evidence is under `closure/`, `seams/` and `sound_captions/`. PNG and WAV files are working files and are not committed; JPG, TXT and JSON files are.

**Listening:** nobody listened to the soundtrack in this environment. Every audio statement here is a measurement, or a comparison of a cue frame against the picture.

## Summary

**Result for the 44 r1 defects:**

| Status | Count |
|---|---|
| Closed | 37 |
| Partly | 6 |
| Open | 1 |
| Regressed | 0 |

**New issues:** two, both polish (V2-R2-01 and V2-R2-02). One check finding was rejected and two were merged into an r1 item (see "Check findings not kept").

**No blocker or major remains.** All three r1 majors are closed, and I re-verified each one on this render:

- **V2-R1-01:** the finished U holds 2.50 s after the aligned end of "U." and about 2.8 s after the voice stops. The resolve lands on the pointer tap.
- **V2-R1-02:** the 0:30 seam is exactly the designed 8 flat frames, and they show visible paint grain.
- **V2-R1-03:** the description carries the required provenance, and its replay mapping matches the on-screen counter.

**What remains, all polish:**

| ID | Status | What remains | Re-render needed? |
|---|---|---|---|
| V2-R1-04 | partly | The shot plan row is not updated | No (document) |
| V2-R1-12 | partly | The sting overlaps the tail of "place." (by design) | Only if fixed (optional) |
| V2-R1-28 | partly | The scroll still floats alone for 0.33 s before the shelf | Only if fixed |
| V2-R1-38 | partly | The readout inset is 22% of frame width, not 25% | Only if fixed |
| V2-R1-41 | partly | 7 cues come in 0.12-0.21 s after the audible word onset, plus 2 marginal ones (about 0.08 s) | No (SRT) |
| V2-R1-42 | partly | The caption re-break left some phrase splits | No (SRT) |
| V2-R1-44 | open | `v2/QA_V2.md` is still missing | No (document) |
| V2-R2-01 | new | One-frame head swap at the J4 turn | Only if fixed |
| V2-R2-02 | new | The held chord rises about 4 dB under the roll-up; measured, not heard | Only if fixed (re-mix) |

**Before the masters:** nothing in picture or sound has to change before the masters are rendered.

**Before handover:** do the cheap fixes that need no render: the SRT timing and breaks (R1-41, R1-42), the shot-plan row (R1-04) and `v2/QA_V2.md` (R1-44). Note that the package SRT is a byte copy of `script/subtitles_v2.srt`, so it has to be regenerated after the edit.

**Optional polish, needing a re-render:** R1-28, R1-38, R2-01, and R2-02 if a listener agrees.

**Where the checks disagreed, and my ruling:**

- **V2-R1-04:** seams said closed, closure said partly. **Partly.** The picture is fixed. The fix's own instruction to update the V10.1 row of `SHOTPLAN_V2.md` was not done; that row (line 234) still lists only the question title, "sped up" and the source line.
- **V2-R1-40:** closure said partly, sound said closed. **Closed.** The fix was applied as specified (-8 dB). The beep is a pure 1.2 kHz tone; in 4-12 kHz it measures -80 dBFS, while the /s/ of "It's" measures -17 to -24 dBFS there. Full band, the voice is 10-16 dB above the beep through the /s/ core.
- **V2-R1-41:** closure said closed, sound said partly. **Partly.** The closure check measured cue in-times only against aligned word frames, and every cue does lead those by 1.5-2.5 frames. But the aligner marks some words at the vowel, so measured against the audible onset on the narration stem, cues still trail. That includes all three beats r1 cited: the r1 f7186, f9031 and f9469 cues now trail by 6.2, 3.5 and 4.3 frames.
- **V2-R1-42:** closure said partly, sound said closed and raised two new caption items. **Partly.** The sound check's new items NEW-01 (line breaks inside phrases) and NEW-02 (the cue 3/4 split) are this defect's leftover, so they are merged into it.
- **Closure check's "no new defect outside the r1 list":** superseded by V2-R2-01 and V2-R2-02.
- **Small frame corrections to the closure check:**
  - The U build shows 1/36 at f4132, not f4133.
  - The first moving frame of the roll-up is f4444, not f4443.
  - The rolled scroll is pixel-frozen from f4464 to f4470. It does not drift over f4466-4471.

## Loudness (encoded MP4, measured by me)

`ffmpeg -i exports/Future_Got_Weird_Video_02_v2_UPLOAD_1080p.mp4 -af ebur128=peak=true -f null -` (output in `skeptic/audio/ebur128_upload.txt`):

| Measure | Value | Target | Result |
|---|---|---|---|
| Integrated loudness | **-15.5 LUFS** (threshold -25.9) | -16 to -14 LUFS | pass |
| True peak | **-1.3 dBTP** | ≤ -1 dBTP | pass, 0.3 dB margin |
| Loudness range | **2.2 LU** (low -17.1, high -14.9 LUFS) | no target; r1 was 2.1 LU | for information |

The sound check cross-checked this with pyloudnorm and 4x oversampling: -15.53 LUFS and -1.28 dBTP. It found per-scene loudness of -15.3 to -16.4 LUFS. I did not re-measure per-scene values.

The 0.3 dB true-peak margin holds for this file only. YouTube's re-encode was not measured.

## All 44 r1 defects: final status

**How to read the Checked by column:**

- **S:** I re-verified the item myself on this render.
- **C:** accepted from the closure check.
- **Sm:** seams check.
- **Sc:** sound and captions check.

Remaining severity is the severity of what is left after this round.

| ID | r1 sev | Scene | Frames (this render) | Final | Remaining | Checked by | Evidence | Note |
|---|---|---|---|---|---|---|---|---|
| V2-R1-01 | major | V6 | 4126-4470 | **closed** | none | S, C, Sm, Sc | `skeptic/bursts/R1-01_buildstart_f4126-4141_counter.jpg`; `skeptic/bursts/R1-01_buildend_f4290-4329_s3.jpg`; `skeptic/bursts/R1-01_tap_f4356-4395_s2.jpg`; `skeptic/audio/U_hold_rollup.txt` | Build 1/36 at f4132 on "here's" (4132); 'rough outline' f4317-4323; pointer touches the U's base about f4370; complete board pixel-still f4390-4443; first roll frame f4444; V7 cut f4470. Hold = 2.50 s after the aligned end of "U." (4369), about 2.8 s after the voice stops (~f4360). Strongest music onset at 145.63 s (f4368.9, 22× median flux), level -27 to -30 dBFS over the hold; last note 147.89 s; no onset during the roll-up. |
| V2-R1-02 | major | V2→V3 | 888-937 | **closed** | none | S, C, Sm | `skeptic/bursts/R1-02_paint_f888-937_s1.jpg`; `skeptic/frames/R1-02_f912_crop2x_and_390.jpg` | f907-914 are the only identical frames: 8 frames, mean diff ≤0.001, max ≤7.2/255. Paint grain luma std 2.80, with bumps visible at 390 px. Pull-back moves from f915 (0.81-0.96 per frame); partition top enters f925; title fades f929-932 over the room. |
| V2-R1-03 | major | package (description.txt 26; UPLOAD_PACKAGE.md 42) | 182-421, 7260-7623 | **closed** | none | S, C | `package/description.txt` line 26; `skeptic/bursts/R1-03-10_counter_f7490-7525_s1.jpg` | Plot constants, retroreflective setting, 'what the person wore is not documented' and 'every other recorded frame, frames 7-475 of 475, one plotted position per video frame, no interpolation' are present. Every non-empty description line appears verbatim in UPLOAD_PACKAGE.md. On screen the counter steps by 2 per frame (467, 469 … 475), holds 'frame 475 of 475' f7494-7514 and restarts at 'frame 7 of 475' on f7515. |
| V2-R1-04 | minor | V10.1 | 7260-7381 | **partly** | polish (doc) | S, C, Sm | `skeptic/bursts/R1-04_V10head_f7256-7400.jpg`; `v2/SHOTPLAN_V2.md` line 234 | Picture fixed: 'Real data' on the cut frame f7260; question title outside the card from about f7280; card slides back by f7392-7400. The SHOTPLAN V10.1 row was not updated, which the fix asked for. |
| V2-R1-05 | minor | V5.2 | 2780-2990 | closed | none | S, C | `skeptic/bursts/R1-05_chain_f2780-2990_s10.jpg`; `closure/bursts/R1-05_chainswitch_f2845-2850.jpg` | '≈ 8.9 ns later' about f2789-2847, '≈ 2.65 m there and back' f2848-2907, '≈ 1.33 m each way' f2908 to the end of s18; about 2 s each. |
| V2-R1-06 | minor | V3.4 | 1395-1473 | closed | none | C | `closure/bursts/R1-06_paths_f1395-1473_s3_crop.jpg`; `closure/frames/R1-06_markers_f1398_f1404_crop.jpg` | Markers pulse in path colours at launch; dotted legs travel from each marker. |
| V2-R1-07 | minor | V9.4 | 6868-6953 | closed | none | C | `closure/bursts/R1-07-08_B1spots_Ucard_f6850-6980_s6.jpg` | B1's spots sit on the wall line, interleaved with frame A's. |
| V2-R1-08 | minor | V9.4 | 6916-6953 | closed | none | C | same as R1-07 | U card in the right margin (x 1545-1815, wall ends x 1520); zone icon; full source line. |
| V2-R1-09 | minor | V10.2 | 7381-7623 | closed | none | C | `closure/bursts/R1-09-10_V10board_f7380-7680_s12.jpg`; `closure/bursts/R1-09_chip_on_off_f7560-7632_s4.jpg` | Items staged on cues at about 48 px; chip about 40 px for 2.0 s; readable at 390 px. |
| V2-R1-10 | minor | V10.2 | 7494-7623 | closed | none | S, C, Sm | `skeptic/bursts/R1-03-10_counter_f7490-7525_s1.jpg` | Counter holds at 475 for 21 frames (0.7 s) with a column item fading in f7501-7508, so the longest pixel-still run is 7 frames (f7494-7500). The replay restarts honestly at f7515. |
| V2-R1-11 | minor | V1.1 | 20-47 | closed | none | C, Sm | `closure/bursts/R1-11_settle_crop_f20-45.jpg`; `seams/bursts/V1_arrival_settle_crop_f24-47.jpg` | In-betweens f29-37; face turns smug about f40. |
| V2-R1-12 | minor | V5 J3 crossing (audio) | 3290-3326 | **partly** (by design) | polish | S, C, Sc | `skeptic/bursts/R1-12_crossing_f3290-3313_s1.jpg`; `skeptic/audio/R1-12_crossing.txt` | Tap at 109.88 s (f3296.4) as the pointer stops (f3297); music exactly silent from 109.96 s; face changes f3305-3306; uh_oh from 110.20-110.24 s (f3306-3307). Leftover: the sting runs under the tail of 'place.' (see below). |
| V2-R1-13 | minor | V13 (audio) | 9594-9670 | closed | none | S, C, Sc | `skeptic/audio/spot_checks_closed_audio.txt` | Narration below -69 dBFS from 320.9 s (f9627); music flat at -37 to -40.5 dBFS through the word, rising from 321.1 s (f9633) to -22.6 by 321.4 s. |
| V2-R1-14 | minor | chips (V1, V2.3, V3, V4, V9, V10) | 182-421, 780, 1080, 1732-2283, 7025-7150, 7260-7623 | closed | none | C | `closure/frames/R1-14_chips_390_f300_780_1080_1905_7300.jpg` | Chips about 40 px; V4 sensor tag lifted to the headline row at about 48 px. I saw the 'sped up' chip read at 390 px in my opening sheet (`skeptic/frames/opening_390_0-32s_1fps.jpg`). |
| V2-R1-15 | minor | package (description lines 3, 28, 29) | n/a | closed | none | C, S (text read) | `package/description.txt` lines 3, 28, 29 | The intro, echo and U notes carry the required provenance; verbatim in UPLOAD_PACKAGE.md. |
| V2-R1-16 | polish | V4.2 | 1920-2056 | closed | none | C, Sc | `closure/bursts/R1-16_zoomstart_f2014-2027_crop.jpg`; `sound_captions/bursts/V4_zoom_tick_f2012-2035_s1_crop.jpg` | Magnifier in about 1.5 s early; zoom starts f2018-2019 on 'zoom'; lift f2016-2017. |
| V2-R1-17 | polish | V2.2 | 580-708 | closed | none | C | `closure/bursts/R1-17_timeline_f580-708_s4.jpg` | The complete full-frame timeline holds about 1.7 s. |
| V2-R1-18 | polish | V1.3 | 226-272 | closed | none | C | `closure/bursts/R1-18_wallpulse_f226-272_s2_crop.jpg` | Wall band coloured as the room wall; points pulse on 'wall'. |
| V2-R1-19 | polish | V1.1-V1.2 | 60-181 | closed | none | C | `closure/frames/R1-19_f140_blocked_crop.jpg` | 'blocked' in ink with halo; only the X is coral (also visible in my 390 px opening sheet). |
| V2-R1-20 | polish | V2.1 | 550-602 | closed | none | C, Sm | `closure/frames/R1-20_card_f562_f575_band.jpg`; `seams/bands/captionband_y930-1080_f0-1785.jpg` | Card fades in at its settled place; bottom about y 932-941. |
| V2-R1-21 | polish | V3 | 930-1500 | closed | none | C | `closure/frames/R1-21_rightedge_f1050_f1440.jpg` | No door sliver at the right edge. |
| V2-R1-22 | polish | V3.2 (audio) | 1040-1053 | closed | none | C, Sc | `closure/bursts/R1-22_mirror_f1040-1053.jpg`; `sound_captions/bursts/V3_mirror_slide_f1038-1053_s1_crop.jpg` | Slide sound spans the visible travel f1045-1050. |
| V2-R1-23 | polish | V4.3 | 2190-2282 | closed | none | C | `closure/bursts/R1-23_labels_f2190-2250_s3.jpg` | 'wall echo' fades as the dimension draws. |
| V2-R1-24 | polish | V1 and V4 (audio) | 348-376, 2052-2145 | closed | none | S, C, Sc | `skeptic/audio/spot_checks_closed_audio.txt` | Music in 300-4000 Hz: under n02 'estimate.' (11.6-12.3 s) max -40.6 dBFS; under s15 'In this capture … weaker.' -41 to -46.6 while speaking (-39.7 in the pause at 69.5 s); the next lift (-32.9) comes at 71.4 s, after the voice. |
| V2-R1-25 | polish | V5.8 | 3800-3920 | closed | none | C | `closure/frames/R1-25_strip_f3880_full_crop.jpg`; `closure/frames/R1-25_inset_390_f3840_f3880.jpg` | Strip about 1000 px wide, about 40 px labels, about 2.2 s. |
| V2-R1-26 | polish | V5.5 inset | 3296-3315 | closed | none | C | `closure/bursts/R1-26_inset_f3296-3315_crop.jpg` | The mitt lifts off over f3306-3313. |
| V2-R1-27 | polish | V5.9 | 4020-4114 | closed | none | C | `closure/frames/R1-27_likely_f4100_crop.jpg` | Feathered soft patch. |
| V2-R1-28 | polish | V6→V7 | 4444-4471 | **partly** | polish | S, C, Sm | `skeptic/bursts/R1-28_roll_f4440-4489_s1.jpg`; `skeptic/bursts/R1-28_float_f4456-4479_s1.jpg` | The scroll is closed from f4461 and hangs alone on blue f4461-4470 (10 frames, 0.33 s; 12 frames counting the last sliver of board at f4459-4460). It is pixel-frozen f4464-4470 (7 frames). The shelf's top edge enters at f4471. r1 was about 16 frames. The requested overlap was not done. |
| V2-R1-29 | polish | V7→V8 | 5498-5541 | closed | none | C, Sm | `closure/bursts/R1-29_push_f5498-5545_s2.jpg` | Plates fade before the push. |
| V2-R1-30 | polish | V7.5 | 5440-5500 | closed | none | S, C, Sm | my diff scan (see "What was checked") | Longest still run in f5440-5500: 7 frames (f5441-5447); r1 about 1.5 s. |
| V2-R1-31 | polish | V8.2 | 5790-5870 | closed | none | C | `closure/frames/R1-31_spots_f5830_crop_and_390.jpg` | Spots about 20 px with outlines; read as a cluster at 390 px. |
| V2-R1-32 | polish | V9.4→V9.5 | 6948-6960 | closed | none | C | `closure/bursts/R1-32_cut_f6950-6958.jpg` | Cut f6953/6954, before 'To follow' (6955). |
| V2-R1-33 | polish | V9.5 | 7025-7150 | closed | none | C | `closure/frames/R1-33_chip_f7080_crop_and_390.jpg` | Reworded chip at about 40 px. |
| V2-R1-34 | polish | V9.1 | 6170-6430 | closed | none | C, Sm | `closure/frames/R1-34_390_f6300_f6390.jpg`; `seams/bursts/V9_1_push_in_out_f6358-6372_f6410-6424.jpg` | Push-ins for both shifts; readable at 390 px. |
| V2-R1-35 | polish | V11.1 | 8128-8205 | closed | none | S, C, Sm | my diff scan | Longest still run in f8128-8205: 3 frames; r1 2 s. |
| V2-R1-36 | polish | V11.4 | 8690-9000 | closed | none | C | `closure/frames/R1-36_tiles_390_f8725_8780_8830_8880_8960.jpg` | Tiles cropped to the gag; readable at 390 px; cadence follows narration. |
| V2-R1-37 | polish | V11 n30 (audio) | 8992-9110 | closed | none | S, C, Sc | `skeptic/audio/spot_checks_closed_audio.txt` | In 300-4000 Hz the motor sits at -42 to -49 dBFS. The audible tails of 'now,' (-35.6 to -38.2) and 'system.' (-34.4 to -39.4) are 3-12 dB above it; ties only below about -42 dBFS. |
| V2-R1-38 | polish | V12.1-V12.2 | 9319-9365 | **partly** (by design) | polish | S, C | `skeptic/bursts/R1-38_blank_f9316-9370_s3.jpg`; `skeptic/frames/f09345.png` (not committed) | Labelled 'sensor readout'. Inset 423 px inside the teal border (x 98-520) = 22.0%, or 431 px across the outline = 22.4%, against ≥25% asked. Blob f9325-9339; blank f9343-9358 (0.5 s, as planned) before the checker moves (f9358). |
| V2-R1-39 | polish | V12 (music, docs) | 9332-9416 | closed | none | S, C, Sc | `skeptic/audio/spot_checks_closed_audio.txt`; `v2/SHOTPLAN_V2.md` V12 Sound line | Music stem exactly zero from 311.067 s (f9332.0) to 313.868 s (f9416.0); the shot plan records the dry stop. |
| V2-R1-40 | polish | V1 (audio) | 81-86 | closed | none | S, Sc (C said partly) | `skeptic/audio/R1-40_beep.txt` | readout_beep placed at f84, gain -8 (the fix's first option). It is a 1188-1204 Hz tone, -32 dBFS in 300-4000 Hz at 2.77-2.84 s and -80 dBFS in 4-12 kHz. The /s/ of 'It's' (2.78-2.81 s) is -17 to -24 dBFS in 4-12 kHz; full band the voice is 10-16 dB over the beep at 2.78-2.80 s. In 300-4000 Hz the beep still exceeds the consonants' low-band leak by 2-16 dB, but the consonant energy sits above 4 kHz. |
| V2-R1-41 | polish | captions | cues 7, 17, 56, 59, 60, 71, 80, 101, 104 | **partly** | polish | S, Sc (C said closed) | `skeptic/captions_check_skeptic.txt`; `skeptic/audio/caption_onsets_detail.txt`; `skeptic/captions_onsets.json` | All 104 cues lead their aligned word frames by 1.51-2.51 frames. Against the audible onset on the narration stem, nine still trail (table below), including all three r1-cited beats. |
| V2-R1-42 | polish | captions | cues 3/4 and 18 two-line cues | **partly** | polish | S, C, Sc | `skeptic/captions_breaks.txt` | The four named breaks are fixed, and cue 75 runs at 19.8 cps. Max 19.81 cps, 42 characters, 2 lines, shortest cue 1.08 s, no overlaps, 899/899 words match the timeline. But the re-break added new splits ('off \| a wall' across cues 3/4; 'position / estimate', 'a likely / location', 'and fast / math', 'in your / hand' …) and kept r1's 'thirty / centimetres' number-unit split. |
| V2-R1-43 | polish | research/claims.csv | n/a | closed | none | C | `research/claims.csv` rows C02, C20, C22 | Rows updated; 'wooden' gone. |
| V2-R1-44 | polish | package | n/a | **open** | polish | S, C | file check | `v2/QA_V2.md` does not exist. It is cited in `package/UPLOAD_PACKAGE.md` lines 12 and 66, and also in `v2/CHANGE_LOG.md` line 7 and `README.md` line 9. |

## Remaining items: detail and fixes

### V2-R1-04 · Shot plan row not updated (picture fixed)

- **Frames:** 7260-7381 (4:02.0-4:06.0).
- **What remains:** the SHOTPLAN_V2.md V10.1 row (line 234) still lists only the question title "What can it do? Where does it fail?" (64), "sped up" (34) and the V1 source line. The film shows the 64 px 'Real data' headline from the cut, with the question title outside the card.
- **Fix:** document only. Edit the row: add the headline 'Real data' (64) from the cut; place the question title top-left outside the card, with the card shifted about 70 px down for V10.1 and slid back for V10.2.

### V2-R1-12 · Sting still under the tail of 'place.' (by design)

- **Frames:** 3296-3326 (109.88-110.88 s).
- **Measured** (`skeptic/audio/R1-12_crossing.txt`, 40 ms windows):
  - **'one':** the core (110.20-110.32 s) is 6-31 dB above the sting in 300-4000 Hz (6-9 dB at the end of the word).
  - **'place.':** the core (110.44-110.52 s) is 10-20 dB above it.
  - **Tail of 'place.' (110.60-110.80 s):** the sting (-32 to -42 dBFS) is 4-11 dB above the voice in 300-4000 Hz.
  - **/s/ (110.64-110.76 s):** -24 to -27.5 dBFS in 4-12 kHz, about 50 dB above the sting.
- **Fix (optional):** fade uh_oh out by about 110.40 s (f3312).

### V2-R1-28 · Rolled scroll still floats alone before the shelf

- **Frames:** 4459-4471 (148.63-149.03 s).
- **Fix:** start V7's tilt to the shelf 10-12 frames earlier so it overlaps the roll closing, as r1 asked. The alternative is to cut to V7 at f4464 and drop the 7 frozen frames; that changes later timing.

### V2-R1-38 · Readout inset under 25% of frame width

- **Frames:** 9319-9365 (310.6-312.2 s).
- **Fix:** scale the inset to at least 480 px wide (about 1.14×) for the blob and blank-out beat. Keep the label clear of the plant leaves, and keep the 0.5 s blank.

### V2-R1-41 · Caption in-times trail the audible onset

The narration stem was measured in 10 ms windows. The onset is the first window more than 20 dB above the -74 dBFS floor. Detail is in `skeptic/audio/caption_onsets_detail.txt`.

| Cue | First word | Line | In-time | Audible onset | Late by | Fix (onset - 2 frames) | Previous cue must end by |
|---|---|---|---|---|---|---|---|
| 80 | So | n24 start (r1's f7186 beat) | f7276.4 | 242.34 s (/s/), voicing 242.50 s | 6.2 fr (0.21 s) | f7268 | (gap already) |
| 104 | Subscribe | s48 | f9556.3 | 318.40 s (/s/) | 4.3 fr | f9550 | cue 103 by f9548 |
| 7 | so | n03 | f555.4 | 18.37 s (/s/) | 4.3 fr | f549 | cue 6 by f547 |
| 59 | so | n16 | f5477.3 | 182.44 s (/s/) | 4.1 fr | f5471 | cue 58 by f5469 |
| 17 | Everything | n09 start | f1378.4 | 45.82 s (voiced) | 3.8 fr | f1372 | cue 16 by f1370 |
| 101 | Being | n31 start (r1's f9031 beat) | f9118.7 | 303.84 s (voiced) | 3.5 fr | f9113 | cue 100 by f9111 |
| 56 | Don't | s31 start | f5217.8 | 173.79 s (soft pre-voicing; burst at 173.93 s) | 4.1 fr against the pre-voicing, 0 against the burst | f5211 (optional) | cue 55 by f5209 |
| 71 | like | n20 | f6560.9 | 218.61 s (weak), 218.64 s (strong) | 2.6 fr (marginal) | f6556 | cue 70 by f6554 |
| 60 | Why | n17 start | f5554.3 | 185.06 s | 2.5 fr (marginal) | f5549 | cue 59 by f5547 |

r1's third cited beat, f9469, is cue 104. In r1 the late cues trailed by 0.18-0.26 s; now the worst trails by 0.21 s and the others by 0.08-0.14 s.

**Fix:** SRT only, no render. Note that the package SRT has to be re-copied.

### V2-R1-42 · Caption breaks still split phrases

**Breaks the r1 log named, now fixed:**

- 'Moved through known positions,'
- 'put at under a hundred dollars,'
- 'farther from the wall spot.'
- 'That's how the U was made.' (19.8 cps)

**Breaks that still split a phrase:**

- **Across cues:** cue 3/4 ('used light bouncing off' | 'a wall to track someone'). This is new; r1 split the sentence at 'hidden | around' instead.
- **Inside two-line cues, new in r2:** 'have / used' (3), 'position / estimate' (5), 'hidden / object' (22), 'a likely / location' (45), 'the rough / 3D shape' (49), 'in your / hand' (64), 'its listening / spots' (69), 'and fast / math' (98).
- **Inside two-line cues, kept from r1:** 'a tiny / delay' (11), 'how much / farther' (26), 'thirty / centimetres' (29, a number-unit split, the class r1 named), 'live / video' (50), 'hidden / objects' (52), 'smartphone-grade / device' (62), "night mode's / trick" (65), 'reflective / material' (85), "he'd have / to" (102), "we'll / see" (104).

**Acceptable breaks:** two cue breaks without punctuation fall between major parts of the sentence: 30/31 'puts him | only about fifteen centimetres' and 47/48 'that faint bump | rebuilt'.

**Fix:** SRT only. Re-cut n01 into two cues:

- 'Yet researchers have used light / bouncing off a wall' (f149-245, about 15.6 cps)
- 'to track someone hidden around a corner.' (f247-309, about 19.4 cps)

Re-break the two-line cues at phrase boundaries. Line lengths are in characters; every proposal fits 42.

| Cue | Proposed break | Line lengths |
|---|---|---|
| 5 | 'That dot is their / position estimate. Not a photograph.' | 17/36 |
| 11 | 'So how do you turn / a tiny delay into a location?' | 18/29 |
| 12 | 'First, a puzzle: / why does a plain wall work at all?' | 16/34 |
| 20 | "Our friend's echo bounced three times, / so it's tiny." | 38/13 |
| 22 | "with a different sensor and hidden object: / the wall's big echo, then," | 42/26 |
| 26 | 'Its timing says / how much farther the light travelled.' | 15/37 |
| 29 | 'Light covers about / thirty centimetres every nanosecond.' | 18/36 |
| 45 | "That's why the answer / is a likely location, or a rough shape." | 21/39 |
| 49 | 'In 2012, an MIT team rebuilt / the rough 3D shape of a hidden mannequin.' | 28/41 |
| 50 | 'By 2021, others had / live video around corners.' | 19/26 |
| 52 | 'One team had even tracked / hidden objects with a cheap sensor.' | 25/35 |
| 62 | "The team's smartphone-grade device / had about a hundred pixels:" | 34/27 |
| 64 | 'And if you hold one / in your hand, it jiggles.' | 19/25 |
| 65 | "Their fix borrows / night mode's trick from phone cameras:" | 17/38 |
| 85 | 'safety-vest style / reflective material on the target,' | 17/34 |
| 98 | 'bright sunlight, / and fast math on small hardware.' | 16/32 |
| 102 | "To really hide, / he'd have to block the bounces too." | 15/35 |
| 104 | "Subscribe for more, / and we'll see you around the corner." | 19/36 |

Leave cue 69 as it is: no break fits 42 characters without re-cutting the cue. Better still, fix the line-wrap scorer in `tools/build_timeline.py` (`build_srt`) so that it prefers punctuation, conjunctions and prepositions over balanced lines.

### V2-R1-44 · `v2/QA_V2.md` missing

**Fix:** the lead writes `v2/QA_V2.md` at the end of the release check. It should cover the thumbnail check at 160-200 px, this log's outcome, and the real listening status, which is that nobody has listened. The alternative is to remove the four references to it (`package/UPLOAD_PACKAGE.md` lines 12 and 66, `v2/CHANGE_LOG.md` line 7, `README.md` line 9).

## New issues (not in the r1 log)

### V2-R2-01 · The guesser's J4 turn is a one-frame head swap · polish

- **Scene, frames:** V12.2, 9339→9340 (5:11.30-5:11.33).
- **What the frames show:** after pushing the partition, he steps back with the back of his head to camera (f9326-9339). On f9340 the head is replaced, in one frame, by the front-facing smug face. There is no three-quarter head, no shoulder turn and no settle. The shirt, arms and feet are unchanged across the swap.
- **Regression:** none. It is identical in the r1 render at f9255→9256, but r1's lenses did not log it. The brief asks for anticipation, reaction and settle on physical actions, and for the final callback to be read for confusing movement. I inspected it: it is a pop on the film's last gag, not an intentional comic beat.
- **Evidence:**
  - `skeptic/bursts/NEW_J4turn_f9326-9345_crop.jpg`
  - `skeptic/bursts/NEW_J4turn_r1_f9250-9261_crop.jpg`
  - `seams/bursts/V12_J4_turn_crop_f9326-9343.jpg`
- **Fix:** add 2-3 in-between frames before f9340: a three-quarter head and a small shoulder turn, then the smug face with a one-frame settle.

### V2-R2-02 · The held chord rises about 4 dB under the roll-up · polish (measured, not heard)

- **Scene, frames:** V6 roll-up into V7, f4444-4470 (148.13-149.00 s).
- **Measured:**
  - **Notes:** no note starts between 147.89 s and the V7 cut.
  - **Level:** the ducked music stem goes from -34.0 dBFS (148.0-148.1 s) to -30.3 dBFS (148.6 s) and stays there to the cut.
  - **Strings stem:** -34.5 to -29.5 dBFS.
  - **Cause:** `audio/music/v02v2/plan.json` gives the 'roll' segment `gain_db_applied` 19.32 against 16.32 for 'U', with a 0.35 s entry ramp at 148.133 s.
  - **Context:** the level stays at or below the hold's own level (-27 to -30 dBFS). MUSIC_NOTES says the resolve "rings and settles" here.
  - **Not judged:** whether this reads as a small swell into the museum can only be judged by listening.
- **Evidence:**
  - `skeptic/audio/U_hold_rollup.txt`
  - `skeptic/audio/NEW03_roll_levels.txt`
  - `sound_captions/audio_checks.txt`
- **Fix:** only if a listening pass hears a swell. Give 'roll' the U segment's gain, or a 1-2 dB down-ramp, in `tools/make_music_v02v2.py`, then re-mix.

## Check findings not kept

| Finding | Scene, frames | Ruling |
|---|---|---|
| seams NEW-01: 2.53 s still in V5.7 | V5.7, f3560-3635 | **Rejected as a defect.** I confirmed the still (my scan: max change ≤11/255 over f3560-3635; `skeptic/bursts/NEW_V57_hold_f3555-3642.jpg`). The narration describes what is on screen ('These two spots are close, so the patch is long and blurry' over 'close → long, blurry'). It is under the 2.6 s still-run yardstick r1 used, and unchanged since r1. The brief discourages motion added only to imply activity. Optional, not required: a brief W2/W3 highlight on 'long and blurry' (about f3595-3610). |
| sound_captions NEW-01: line breaks inside phrases | captions | Merged into V2-R1-42. |
| sound_captions NEW-02: cue 3/4 split | captions, f149-309 | Merged into V2-R1-42. |
| sound_captions NEW-03: roll-up level rise | V6→V7 | Kept as V2-R2-02. |
| seams NEW-02: J4 head swap | V12, f9339-9340 | Kept as V2-R2-01. |

## Acceptance questions (REVISION_BRIEF), answered again for this render

**1. By 10-15 s, can a new viewer explain the surprising result and which part is real?**

Yes. I looked at the opening at 390 px, 1 fps (`skeptic/frames/opening_390_0-32s_1fps.jpg`):

- The partition, the sight line and the X with 'blocked' are on screen by 2.5 s.
- The taped 'Real data' board hard-cuts in at 6.07 s (f182). It carries 'sensor', 'blocked', 'estimated position' and a 'sped up' chip that now reads at phone width (R1-14).
- The measured wall points pulse on 'wall' (R1-18).
- 'That dot is their position estimate. Not a photograph.' runs 10.3-13.6 s.

**2. By 30 s, do they understand why arrival time carries hidden-side information and why a timing sensor is needed?**

Yes:

- 'short trip' and 'long way round' race full frame (about 16.5-19.7 s).
- The shared timeline ('wall echo', 'his echo', 'a few nanoseconds') is complete at full frame for about 1.7 s (R1-17).
- It becomes the 'time-of-flight sensor / times its own light's round trip' close-up (about 22.5-26.5 s).
- The first arc and '?' arrive by 29.5 s.
- The 0:30 seam is now 8 textured paint frames, and the room and 'What survives the bounce?' follow by 31 s (R1-02).

**3. Can the key diagrams and labels be followed at 390 px without zooming or pausing?**

Yes, with small exceptions. The checks and my 390 px sheets show:

- The chips, the V10.2 column, the V5.2 chain (2 s per step), the V5.8 strip, the V8.2 spot cluster and the V9.1 push-ins all read at phone width.
- No still run outside the end screen exceeds 2.53 s.

What remains:

- The V12 readout inset is 22% of frame width (R1-38); its blob-to-blank change is still visible.
- Caption line breaks still split some phrases (R1-42).

**4. Does each section answer a new question rather than restating a claim beside another board?**

Yes, as in r1. The five question titles map to their sections, and each real board appears where it answers its question. V10.1 now restates the 'Real data' context on the cut before attaching the conditions (R1-04).

**5. Is the reconstruction revealed alongside the geometry rather than saved for minute five?**

Yes, and the r1 major is fixed:

- 'likely location' (2:14-2:17) hard-cuts to the real U at 2:17.17 (f4115).
- The 36 real partial sums start on 'here's' (f4132) and are complete at about f4300.
- The finished U, with 'rough outline' and the pointer tap at about f4370, holds 2.5 s after the aligned end of 'U.'.
- The music resolve's onset is at f4368.9.

**6. Is the history brief, accurate and useful to the modern hardware story?**

Yes. The V7 content is unchanged from r1, at 2:29.0-3:04.7 including the 2026 material. The ledger row for the '2018 · Stanford' plate is now consistent (R1-43). No 'first' claim.

**7. Are performance, pauses, music and transitions engaging when actually played back?**

Not answerable here. Nobody listened, and no check claims to have heard anything. A human listening pass at normal speed is still required, as the brief demands; UPLOAD_PACKAGE.md line 66 says so.

What was measured:

- -15.5 LUFS integrated, -1.3 dBTP true peak, 2.2 LU loudness range.
- Speech-band margins (sound check): voice a median 25 dB above the music and 43.8 dB above the effects.
- The re-cued effects land on their contacts: tap at f3296.4 against the pointer stop at f3297; resolve at f4368.9 against the U tap at about f4370; mirror slide over f1045-1050.

Transitions judged from frames:

- The blank at 0:30 and the missing U hold are fixed.
- Remaining: the 0.33 s scroll float (R1-28) and the one-frame head swap at the J4 turn (R2-01).
- Unverified by ear: the level rise under the roll-up (R2-02).

**8. Are evidence contexts and assumptions accurate after editing, without overloaded caution text?**

Yes:

- The description now carries the plot constants, the retroreflective setting and a replay mapping that matches the on-screen counter (I verified the counter at f7490-7525). It also carries iter_22, the ratio range and the partial-sums note (R1-03, R1-15).
- On screen, V10.1 has its 'Real data' headline and the V9.4 U card sits off our plan (R1-04, R1-08).
- The V10.2 conditions are staged on their cues (R1-09).

**9. Does the closing deliver one payoff and lead naturally into a functional end screen?**

Yes:

- One takeaway (n31) and one callback. He pushes the partition; the 'sensor readout' goes blank for 0.5 s before the checker steps round (f9343-9358).
- The music stops dry, then a hard cut at f9416 leads to the end screen.
- The end screen is exactly 10.0 s (f9416-9715, from 5:13.87, matching `package/END_SCREEN.md`).
- I measured the guides on f9600: panel x 1002-1799 (1000 including antialiasing), y 290-739; disc x 282-579, y 451-748, so centre about (430.5, 599.5) and diameter about 298.
- The swell starts after 'corner.' (R1-13).
- Weak spots: the head swap at the J4 turn (R2-01) and the inset width (R1-38).

## What was and was not checked

**This skeptic pass, on the release candidate:**

- **Seeking:** confirmed frame-exact at four frames, then extracted and looked at 14 bursts and sheets under `skeptic/bursts/` plus full-resolution and 390 px frames under `skeptic/frames/`. The bursts cover:
  - the paint seam;
  - the U build start, end, pointer tap and hold;
  - the roll-up and float;
  - the V10 headline and replay counter;
  - the V5.2 chain;
  - the J3 crossing;
  - the V5.7 still;
  - the V12 readout blank and J4 turn;
  - the same J4 turn in the r1 render;
  - the opening at 390 px (0-32 s);
  - the end screen.
- **Per-frame motion** (mean and max luma difference, 320×180 or full resolution) for:
  - the paint run, f895-935;
  - the U hold and roll-up, f4355-4480;
  - the scroll content bands, f4456-4485;
  - the replay, f7485-7530;
  - the fan, f5440-5500;
  - the warehouse wide, f8128-8205;
  - the V5.7 still, f3550-3645;
  - the V12 readout, checker and guesser regions, f9300-9420.
- **Pixel measurements:** the readout inset's width, and the end-screen guide boxes.
- **Audio:**
  - Decoded the AAC, confirmed alignment with `final_mix.wav` and the stems, and measured ebur128 loudness on the MP4.
  - Band-split RMS tables (10, 40 and 100 ms windows; full band, 300-4000 Hz, 4-12 kHz) and spectral-flux onsets for: the U hold and roll-up, per instrument stem; the J3 crossing; the V1 beep, including its spectrum; the end-screen swell; the J4 digital-zero stretch; the n30 motor; the soft n02 and s15 lines.
  - Read `audio/music/v02v2/plan.json` and MUSIC_NOTES.md for the U and roll segments, and `audio/sfx/v2/placed.json` for the beep cue.
- **Captions:**
  - `script/subtitles_v2.srt` (byte-identical to the package SRT) word-matched against the timeline: 899/899.
  - Every cue's in-time checked against its aligned word frame and against the audible onset measured on the narration stem.
  - cps, line length, line count, overlaps.
  - Every break not at punctuation, compared with the r1 SRT from git (`aa88163`).
- **Documents:** read `package/description.txt` (lines 3, 26, 28, 29; verbatim in UPLOAD_PACKAGE.md), UPLOAD_PACKAGE.md lines 12 and 66, the SHOTPLAN_V2 V10.1, V10.2 and V5.7 rows, `package/END_SCREEN.md`, `package/chapters.txt` against the scene frames, and searched for `QA_V2.md` references.
- **Tools:** `skeptic/tools/vk.py` (frames and sheets), `ak.py` (audio bands) and `caps.py` (captions).

**Accepted from the three checks without my own re-check:** the closed verdicts marked C, Sm or Sc only in the table. These are R1-06 to -09, -11, -14 to -23, -25 to -27, -29, -31 to -34, -36 and -43. They rest on those checks' bursts, crops and measurements. The checks also covered:

- all 12 scene boundaries;
- whole-film regression, pop and still scans against the r1 render;
- caption-band strips;
- safe-area corners;
- 390 px phone sheets of the whole film;
- the 7 audio_qc masking flags;
- a speech-band scan of the whole film.

**Not checked by anyone:**

- **Listening of any kind.** Nobody could listen here: not the narration performance, the pauses, the tone, whether a sting or swell feels right, or the sound of R2-02.
- **Normal-speed playback.**
- **The 4K master,** `exports/Future_Got_Weird_Video_02_v2_MASTER_4K.mp4`.
- **YouTube's side:** its re-encode (including true peak after it), and how it draws captions and end-screen elements.
- **The thumbnail:** the 160-200 px check that UPLOAD_PACKAGE.md attributes to the missing `v2/QA_V2.md`.
- **Effects outside those listed** in this log and the sound check.

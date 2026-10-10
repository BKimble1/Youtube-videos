# Video 02 v2 music bed: notes

Original score composed in code (`tools/make_music_v02v2.py`, adapted from the v1 `tools/make_music_v02.py`), rendered with FluidSynth and the MuseScore General SoundFont (MIT). Instrumental: no vocal or choir patches, no risers. 100 BPM throughout (bar = 2.4 s), one steady metre from frame 1. Every section boundary, drop, stop and lift is a word or scene cue read from `source/src/data/timeline.json` at run time, so a re-run after narration retakes moves them with the words.

Files: `music_bed.wav` (48 kHz stereo 24-bit, unducked, 15569760 samples = 324.370 s = timeline `durationSeconds`), `stems/*.wav` (post-dynamics; they sum to the bed), `plan.json` (cues, segments, windows, harmony), `measure.json`, `music_overview.png`, `music_cues.png`.

Nobody has listened to this bed: this environment cannot play audio. Everything below is measured, not heard; the listening pass is still to do.

## Sections

| Section | Scenes | Time | Integrated | LU vs reference | 1-4 kHz share (whole / worst 1 s) |
|---|---|---|---|---|---|
| A | V1-V2 | 0:00.00–0:30.90 | -21.6 LUFS | -1.6 | 0.2% / 1.8% |
| B | V3-V4 | 0:30.90–1:16.63 | -24.7 LUFS | -4.7 | 0.2% / 3.0% |
| C | V5-V6 | 1:16.63–2:29.50 | -27.7 LUFS | -7.7 | 0.6% / 2.9% |
| D | V7 | 2:29.50–3:05.23 | -23.8 LUFS | -3.8 | 1.0% / 4.1% |
| E | V8-V9 | 3:05.23–4:02.53 | -26.8 LUFS | -6.8 | 0.1% / 1.5% |
| F | V10-V11 | 4:02.53–5:04.00 | -25.4 LUFS | -5.4 | 0.3% / 2.5% |
| G | V12-V13 | 5:04.00–5:24.37 | -23.4 LUFS | -3.4 | 0.3% / 1.1% |

Reference (0 LU) = -20.0 LUFS in the delivered bed; whole bed -24.91 LUFS. Section figures include their drops and stops; the segment levels below leave them out.

## Segments (cue words from the timeline)

| Segment | Section | Starts on | Time | Music | Target LU | Measured LU |
|---|---|---|---|---|---|---|
| pulse | A | frame 1 | 0:00.00–0:06.60 | curious pulse from frame 1: pizzicato 8ths over a staccato bass on every beat, soft shaker and kick, a bassoon tiptoe, marimba answers; flash-and-echo tick on "sensor" | -2.00 | -2.00 |
| board | A | n01 "researchers" | 0:06.60–0:14.57 | MODEST LIFT on the real board: strings and vibes enter, marimba doubles in 8ths, kick on 1 and 3, a flash tick on the cut; no new attacks under "estimate. Not a photograph." (the chord holds) | +0.25 | +0.25 |
| route | A | V2 cut | 0:14.57–0:27.23 | settles under n03-n05: the pulse continues softer, bass on 1 and 3, vibes | -2.50 | -2.50 |
| question | A | n06 start | 0:27.23–0:30.90 | light lift on the question (n06): strings, a vibes question figure, ends on A7sus | -1.25 | -1.25 |
| puzzle | B | V3 cut | 0:30.90–0:51.30 | the pulse continues, lighter; STOP for the duck on "visible", resumes on s11; tick on "timing" | -4.00 | -4.00 |
| thin | B | V4 cut | 0:51.30–0:57.70 | thins under s14: pizzicato on beats 1 and 3, vibes, a soft string floor, long bass | -5.50 | -5.50 |
| hush_b | B | s14 "tiny" | 0:57.70–0:58.23 | short drop from "tiny" into "This is real data" | — | — |
| data | B | s15 start | 0:58.23–1:07.77 | soft re-entry under s15: a string drone, one pizzicato per bar | -6.00 | -6.00 |
| bump | B | s15 "zoom" | 1:07.77–1:12.13 | MODEST LIFT as the bump appears ("zoom in to see"): strings, vibes, rising marimba, flash-and-echo tick; no new attacks under "In this capture, hundreds of times weaker." (the chord holds) | -4.00 | -4.00 |
| clue | B | s16 start | 1:12.13–1:16.63 | quiet under s16 | -5.75 | -5.75 |
| geometry | C | V5 cut | 1:16.63–2:17.70 | QUIETEST: clockwork-light marimba tick-tock, a pizzicato root, long bass; + a soft hat tick layer at the first arc, + marimba off-beat pings at the second; FULL STOP for "one place", resumes on s21 | -8.00 | -8.00 |
| hush_c | C | V6 cut (switch) | 2:17.70–2:18.30 | a near-silent beat (0.6 s) on the V6 switch | — | — |
| switch | C | V6 cut + 0.6 s (under n13) | 2:18.30–2:20.13 | a soft held Em9 pad under n13 "And here's a real one." (strings, one vibes note, low bass), a little under the C bed | -8.25 | -8.25 |
| build | C | s37 start | 2:20.13–2:26.13 | quiet build under s37 while the U builds: Cmaj7 -> Dsus, soft strings, marimba 8ths, pizzicato | -8.00 | -8.00 |
| U | C | s37 "U." end (finished U) | 2:26.13–2:28.63 | MODEST LIFT on the finished U, from the end of "U." over the hold: the Gadd9 resolve (guitar arpeggio, strings, vibes, bass) and the flash-and-echo tick | -5.50 | -5.50 |
| roll | C | V6 roll-up (from the scene) | 2:28.63–2:29.50 | the resolve rings and settles as the board rolls up (no new notes); the museum starts on the V7 cut | -7.00 | -7.00 |
| museum | D | V7 cut | 2:29.50–2:54.33 | brisker variation of the pulse (Bb major): walking bass, pizzicato 8ths, marimba 16th pickups, shaker 16ths, stately strings; clarinet line answered by bassoon | -3.50 | -3.50 |
| museum_thin | D | s31 start | 2:54.33–2:59.30 | thins under s31: pizzicato quarters, strings | -5.50 | -5.50 |
| idea | D | n16 start | 2:59.30–3:05.23 | warm on n16: Ebmaj7-F-Gm7-A7sus, strings, guitar arpeggios, vibes | -4.00 | -4.00 |
| small | E | V8 cut | 3:05.23–3:24.90 | quieter bed: sparse vibes with faint echoes over a very soft string floor | -7.00 | -7.00 |
| fusion | E | V9 cut | 3:24.90–4:00.20 | quieter bed under the fusion explanation: soft pizzicato quarters, vibes pad | -7.00 | -7.00 |
| keeps | E | n23 "keeps" | 4:00.20–4:02.53 | small lift on "keeps up instead of smearing" (F major): the pulse, strings, vibes | -5.50 | -5.50 |
| board2 | F | V10 cut (n24) | 4:02.53–4:06.57 | MODEST LIFT as the real board returns (n24): the opening lift recalled, tick on the cut | -3.50 | -3.50 |
| conditions | F | n25 start | 4:06.57–4:31.53 | quiet under the conditions (n25-n28) | -6.00 | -6.00 |
| warehouse | F | V11 cut | 4:31.53–4:46.13 | light, cautious mechanical groove (A minor): staccato pizzicato 8ths, hats, soft kick, marimba clicks | -4.00 | -4.00 |
| brake | F | s42 "slow" - 0.2 s | 4:46.13–4:49.00 | DIP on "slow down": the groove brakes to a held Fmaj7 | — | — |
| limits | F | s43 start | 4:49.00–5:00.23 | quiet under the limits (s43) | -6.50 | -6.50 |
| settle | F | n30 start | 5:00.23–5:04.00 | soft settle on "not a safety system": Gm9, then Dm9 on "not" | -7.00 | -7.00 |
| callback | G | V12 cut | 5:04.00–5:08.60 | soft callback of the opening pulse and the bassoon tiptoe under n31 | -5.00 | -5.00 |
| hold | G | s47 start | 5:08.60–5:11.57 | held A7sus question under s47 | -5.50 | -5.50 |
| j4 | G | s47 "too." end | 5:11.57–5:14.37 | COMPLETE STOP: the deadpan J4 beat | — | — |
| resolve | G | V13 cut (end screen) | 5:14.37–5:24.37 | clean, warm D-major resolve from the end-screen start (harp, strings, vibes: Dadd9 - Gmaj7/D - Dadd9, the last chord after "corner." ends), fades to exactly zero at the last sample | -2.50 | -2.50 |

Measured LU: integrated loudness after the segment's entry ramp, outside drop/stop/dip windows and their re-entry ramps, relative to the reference. Levels are set by calibration (pyloudnorm, iterated on the gained bed).

## Lifts

| Lift | Over the bed before | LU | Over the bed after | LU | 1.5-3 LU |
|---|---|---|---|---|---|
| board | pulse | +2.25 | route | +2.75 | yes |
| bump | data | +2.00 | clue | +1.75 | yes |
| U | build | +2.50 | roll; also over geometry | +1.50; +2.50 | yes |
| board2 | keeps | +2.00 | conditions | +2.50 | yes |
| question (light) | route | +1.25 | | | |
| idea (light) | museum_thin | +1.50 | | | |
| keeps (light) | fusion | +1.50 | | | |

## Drops, stops, dips and every cue

Short-window levels: ungated K-weighted loudness (LKFS, EBU short-term length) over up to 3 s just before and just after each cue, clear of the ramps and inside the neighbouring segments; inside = the window itself after its down-ramp. Sparse beds make these noisier than the calibrated segment levels above.

| Time | Cue | Kind | Before | Inside | After | Change (dB) |
|---|---|---|---|---|---|---|
| 0:06.60 | pulse -> board | lift | -22.37 | | -19.62 | +2.8 |
| 0:12.20–0:14.30 (2.10 s) | n02 "estimate. Not a photograph." | soft | -19.71 | -26.78 | -22.12 | in -7.1, back +4.7 |
| 0:14.57 | board -> route | bed | -22.93 | | -22.35 | +0.6 |
| 0:27.23 | route -> question | light lift | -21.75 | | -21.29 | +0.5 |
| 0:30.90 | question -> puzzle | bed | -21.23 | | -23.91 | -2.7 |
| 0:37.12–0:38.05 (0.93 s) | n08 "visible" | stop | -24.38 | digital silence | -23.87 | after vs before +0.5 |
| 0:51.30 | puzzle -> thin | bed | -24.37 | | -27.02 | -2.6 |
| 0:57.70–0:58.23 (0.53 s) | s14 "tiny" -> s15 | drop | -24.82 | -58.83 | -26.64 | in -34.0, back +32.2 |
| 1:07.77 | data -> bump | lift | -25.4 | | -24.03 | +1.4 |
| 1:08.77–1:11.90 (3.13 s) | s15 "In this capture... weaker." | soft | -22.62 | -27.95 | -24.81 | in -5.3, back +3.1 |
| 1:12.13 | bump -> clue | bed | -27.11 | | -25.41 | +1.7 |
| 1:16.63 | clue -> geometry | bed | -25.82 | | -28.49 | -2.7 |
| 1:50.42–1:51.83 (1.42 s) | s20 "one place" | stop | -28.43 | digital silence | -28.56 | after vs before -0.1 |
| 2:17.70–2:18.30 (0.60 s) | V6 cut (switch) | drop | -27.85 | -83.43 | -28.29 | in -55.6, back +55.1 |
| 2:20.13 | switch -> build | bed | -28.27 | | -28.15 | +0.1 |
| 2:26.13 | build -> U | lift | -27.82 | | -25.57 | +2.2 |
| 2:28.63 | U -> roll | settle | -24.96 | | -27.11 | -2.1 |
| 2:29.50 | roll -> museum | bed | -27.48 | | -24.61 | +2.9 |
| 2:54.33 | museum -> museum_thin | bed | -24.69 | | -25.28 | -0.6 |
| 2:59.30 | museum_thin -> idea | light lift | -25.52 | | -23.89 | +1.6 |
| 3:05.23 | idea -> small | bed | -23.65 | | -27.97 | -4.3 |
| 3:24.90 | small -> fusion | bed | -26.69 | | -27.26 | -0.6 |
| 4:00.20 | fusion -> keeps | light lift | -27.05 | | -25.2 | +1.9 |
| 4:02.53 | keeps -> board2 | lift | -25.19 | | -23.6 | +1.6 |
| 4:06.57 | board2 -> conditions | bed | -23.52 | | -25.8 | -2.3 |
| 4:31.53 | conditions -> warehouse | bed | -25.32 | | -23.72 | +1.6 |
| 4:46.13–4:49.00 (2.87 s) | s42 "slow down" | dip | -24.4 | -36.35 | -27.01 | in -12.0, back +9.3 |
| 5:00.23 | limits -> settle | settle | -25.97 | | -27.09 | -1.1 |
| 5:04.00 | settle -> callback | bed | -27.12 | | -24.7 | +2.4 |
| 5:08.60 | callback -> hold | bed | -25.13 | | -25.61 | -0.5 |
| 5:11.57–5:14.35 (2.78 s) | s47 "too." -> V13 | stop | -25.51 | digital silence | -22.79 | after vs before +2.7 |

drop = no new notes, the bed down 20-22 dB with a short down-ramp, then a re-entry ramp (0.12 s for the board lift on "researchers", 0.8 s into s15, 0.3 s into the n13 pad); stop = notes released, the bed muted with an 80 ms ramp (digital silence), resuming on the cue with the bass and pizzicato root; dip = the groove stops, one held chord at -8 dB; soft = under a soft-spoken evidence line the chord already sounding holds (no chord change), no other attacks (no marimba, glockenspiel, percussion, vibes, guitar or bass plucks), and only the low pizzicato pulse goes on, at 3/4 velocity under a -2.5 dB gain.

## Review round 1 (qa/v2/REVIEW_V2_R1.md)

- **V2-R1-01, U payoff:** the Gadd9 resolve and the flash-and-echo tick land on the end of "U." (2:26.13), on the finished U, and play over the hold; a quiet build sits under s37 while the U builds; the resolve settles with no new notes while the board rolls up (2:28.63 to the V7 cut at 2:29.50; roll-up read from source/src/scenes/V6_RealU.tsx (ROLL_DUR, V6_SCROLL.holdFrames)). Hold 2.50 s; levels: build (last 2 s) -28.01, hold -25.58, roll-up -27.34 LKFS; note onsets during the roll-up: 0.
- **V2-R1-13, end-screen swell:** the last chord comes in at 5:21.65, after "corner." ends; note onsets under the word: 0; the bed across the word -0.1 dB against the second before it, then +7.2 dB once the chord is in.
- **V2-R1-24, real-data lift attacks:** under "estimate. Not a photograph." (n02) and "In this capture, hundreds of times weaker." (s15) the lift's chord holds (no chord change), nothing else attacks, and only the low pizzicato pulse goes on, softer (rows marked soft above; onsets inside: n02 "estimate. Not a photograph." {'pizz': 7}; s15 "In this capture... weaker." {'pizz': 2}).
- **V2-R1-39, J4:** unchanged: the complete stop under the J4 hold is intended (the shot plan is updated to match).

## Scene cuts

The pulse runs on one grid and every new segment's chord starts on its cue, so the music carries across cuts. Quietest 100 ms of the bed within 0.5 s of each cut:

| Cut | Time | Floor | Local RMS (4 s) | Designed window | Carried |
|---|---|---|---|---|---|
| V1->V2 | 0:14.57 | -29.4 dBFS | -24.6 dBFS | soft_n02 | yes |
| V2->V3 | 0:30.90 | -27.3 dBFS | -23.5 dBFS |  | yes |
| V3->V4 | 0:51.30 | -27.6 dBFS | -25.4 dBFS |  | yes |
| V4->V5 | 1:16.63 | -34.3 dBFS | -28.5 dBFS |  | yes |
| V5->V6 | 2:17.70 | -96.8 dBFS | -30.5 dBFS | hush_c | yes |
| V6->V7 | 2:29.50 | -34.9 dBFS | -27.7 dBFS |  | yes |
| V7->V8 | 3:05.23 | -27.4 dBFS | -27.6 dBFS |  | yes |
| V8->V9 | 3:24.90 | -28.5 dBFS | -26.2 dBFS |  | yes |
| V9->V10 | 4:02.53 | -31.6 dBFS | -26.3 dBFS |  | yes |
| V10->V11 | 4:31.53 | -31.9 dBFS | -25.9 dBFS |  | yes |
| V11->V12 | 5:04.00 | -31.0 dBFS | -26.7 dBFS |  | yes |
| V12->V13 | 5:14.37 | -240.0 dBFS | -26.8 dBFS | j4 | yes |

## The end

The resolve starts on the end-screen cut (V13, 5:14.37), under s48; it fades from 5:22.15 (2.22 s, after the last word) to exactly zero at the last sample: last sample [0.0, 0.0] (zero); RMS of the last 0.5 s -52.4 dBFS, of the last 0.1 s -75.1 dBFS; the last sample above -80 dBFS is 27.8 ms before the end (no silent tail, no cut).

## Motifs

- **Curious pulse** (A, recalled in B, F and G): pizzicato 8ths on the chord (v1's figure, with a sly chromatic step every fourth chord) over a staccato bass on every beat, soft shaker, a soft kick on 1; a bassoon tiptoe in the first two bars, recalled under n31.
- **Flash and echo**: a glockenspiel tick on D8 (4.7 kHz) and a fainter echo on C8 0.45 s later, only on cues: s02 "sensor", n01 "researchers" (the real board), n09 "timing", s15 "zoom", the end of s37 "U." (the finished U), the board's return (V10) and after the last chord.
- **Clockwork-light** (C): a marimba tick-tock and a pizzicato root; a hat tick from the first arc (s19), marimba off-beat pings from the second (s20); a near-silent beat on the V6 switch, a soft held Em9 pad under n13, a quiet Cmaj7 -> Dsus build under s37, then the Gadd9 resolve and tick on the finished U, settling under the roll-up.
- **Museum** (D): the pulse as a walk in Bb major with 16th pickups; the v1 clarinet line answered by bassoon.
- **Warehouse** (F): v1's cautious A-minor groove; it brakes to a held Fmaj7 on "slow down".
- **Ending** (G): held A7sus under s47, digital silence for the J4 beat, then Dadd9 - Gmaj7/D - Dadd9 with harp; the last Dadd9 comes in after "corner." ends.

## Instruments (General MIDI, MuseScore General)

pizzicato strings (45), marimba (12), vibraphone (11), glockenspiel (9, ticks only), nylon guitar (24), harp (46), acoustic bass (32), bassoon (70), clarinet (71), slow strings (49), percussion (channel 10: 36, 42, 82 = kick, closed hat, shaker). Voice/choir programs used: none.

## Speech band

Melodic notes at or below MIDI 79 (B5 = 988 Hz is the ceiling); ticks on 108, 110 (above 4 kHz); per-instrument EQ cuts 2.2-2.5 kHz and low-passes the leads (the sustained strings at 1.1 kHz, 4th order). Energy in 1-4 kHz: 0.4% of the whole bed; per section above; per stem: pizz 0.1%, marimba 1.4%, vibes 0.0%, glock 0.0%, guitar 1.3%, harp 0.1%, bass 0.0%, bassoon 1.3%, clarinet 7.8%, strings 1.5%, drums 0.3%.

## Measured

Integrated -24.91 LUFS (unducked); sample peak -6.59 dBFS; true peak -6.54 dBTP (4x); 0 clipped samples; 15569760 samples = timeline durationSeconds 324.37 s (match); narration 15569760 samples; the video's 9731 frames are -3.33 ms from the bed (the bed is already at zero there). Stems sum to the bed within 1.19e-06 (24-bit rounding). SHA-256 of the bed: `506712a6e2872f2e…`.

Re-run (one command; reads every cue from the current timeline): `python3 tools/make_music_v02v2.py`. Mix: `python3 tools/mix_v2.py --music audio/music/v02v2/music_bed.wav`.

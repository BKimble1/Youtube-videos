# Video 02 v2 music bed: notes

Original score composed in code (`tools/make_music_v02v2.py`, adapted from the v1 `tools/make_music_v02.py`), rendered with FluidSynth and the MuseScore General SoundFont (MIT). Instrumental: no vocal or choir patches, no risers. 100 BPM throughout (bar = 2.4 s), one steady metre from frame 1. Every section boundary, drop, stop and lift is a word or scene cue read from `source/src/data/timeline.json` at run time, so a re-run after narration retakes moves them with the words.

Files: `music_bed.wav` (48 kHz stereo 24-bit, unducked, 15410640 samples = 321.055 s = timeline `durationSeconds`), `stems/*.wav` (post-dynamics; they sum to the bed), `plan.json` (cues, segments, windows, harmony), `measure.json`, `music_overview.png`, `music_cues.png`.

Nobody has listened to this bed: this environment cannot play audio. Everything below is measured, not heard; the listening pass is still to do.

## Sections

| Section | Scenes | Time | Integrated | LU vs reference | 1-4 kHz share (whole / worst 1 s) |
|---|---|---|---|---|---|
| A | V1-V2 | 0:00.00–0:30.37 | -21.4 LUFS | -1.4 | 0.2% / 0.7% |
| B | V3-V4 | 0:30.37–1:16.10 | -24.7 LUFS | -4.7 | 0.2% / 2.4% |
| C | V5-V6 | 1:16.10–2:26.20 | -27.5 LUFS | -7.5 | 0.6% / 3.2% |
| D | V7 | 2:26.20–3:01.90 | -23.8 LUFS | -3.8 | 1.0% / 3.7% |
| E | V8-V9 | 3:01.90–3:59.20 | -26.8 LUFS | -6.8 | 0.1% / 1.0% |
| F | V10-V11 | 3:59.20–5:00.70 | -25.2 LUFS | -5.2 | 0.3% / 2.6% |
| G | V12-V13 | 5:00.70–5:21.06 | -23.5 LUFS | -3.5 | 0.3% / 1.2% |

Reference (0 LU) = -20.0 LUFS in the delivered bed; whole bed -24.77 LUFS. Section figures include their drops and stops; the segment levels below leave them out.

## Segments (cue words from the timeline)

| Segment | Section | Starts on | Time | Music | Target LU | Measured LU |
|---|---|---|---|---|---|---|
| pulse | A | frame 1 | 0:00.00–0:05.77 | curious pulse from frame 1: pizzicato 8ths over a staccato bass on every beat, soft shaker and kick, a bassoon tiptoe, marimba answers; flash-and-echo tick on "sensor" | -2.00 | -2.00 |
| hush_a | A | n01 "researchers" - 0.3 s | 0:05.77–0:06.07 | near-drop, 0.3 s before "researchers" | — | — |
| board | A | n01 "researchers" | 0:06.07–0:14.03 | MODEST LIFT on the real board: strings and vibes enter, marimba doubles in 8ths, kick on 1 and 3, a flash tick on the cut | +0.25 | +0.25 |
| route | A | V2 cut | 0:14.03–0:26.70 | settles under n03-n05: the pulse continues softer, bass on 1 and 3, vibes | -2.50 | -2.50 |
| question | A | n06 start | 0:26.70–0:30.37 | light lift on the question (n06): strings, a vibes question figure, ends on A7sus | -1.25 | -1.25 |
| puzzle | B | V3 cut | 0:30.37–0:50.77 | the pulse continues, lighter; STOP for the duck on "visible", resumes on s11; tick on "timing" | -4.00 | -4.00 |
| thin | B | V4 cut | 0:50.77–0:57.20 | thins under s14: pizzicato on beats 1 and 3, vibes, a soft string floor, long bass | -5.50 | -5.50 |
| hush_b | B | s14 "tiny" | 0:57.20–0:57.73 | short drop from "tiny" into "This is real data" | — | — |
| data | B | s15 start | 0:57.73–1:07.27 | soft re-entry under s15: a string drone, one pizzicato per bar | -6.00 | -6.00 |
| bump | B | s15 "zoom" | 1:07.27–1:11.60 | MODEST LIFT as the bump appears ("zoom in to see"): strings, vibes, rising marimba, flash-and-echo tick | -4.00 | -4.00 |
| clue | B | s16 start | 1:11.60–1:16.10 | quiet under s16 | -5.75 | -5.75 |
| geometry | C | V5 cut | 1:16.10–2:17.12 | QUIETEST: clockwork-light marimba tick-tock, a pizzicato root, long bass; + a soft hat tick layer at the first arc, + marimba off-beat pings at the second; FULL STOP for "one place", resumes on s21 | -8.00 | -8.00 |
| hush_c | C | V6 cut (switch) | 2:17.12–2:19.63 | near-silence on the switch ("And here's a real one.") | — | — |
| U | C | s37 start | 2:19.63–2:26.20 | MODEST LIFT as the U resolves: Cmaj7 -> Dsus -> Gadd9 on "U", guitar arpeggios, strings, vibes, tick; held through the hold into the museum | -5.50 | -5.50 |
| museum | D | V7 cut | 2:26.20–2:51.00 | brisker variation of the pulse (Bb major): walking bass, pizzicato 8ths, marimba 16th pickups, shaker 16ths, stately strings; clarinet line answered by bassoon | -3.50 | -3.50 |
| museum_thin | D | s31 start | 2:51.00–2:56.00 | thins under s31: pizzicato quarters, strings | -5.50 | -5.50 |
| idea | D | n16 start | 2:56.00–3:01.90 | warm on n16: Ebmaj7-F-Gm7-A7sus, strings, guitar arpeggios, vibes | -4.00 | -4.00 |
| small | E | V8 cut | 3:01.90–3:21.60 | quieter bed: sparse vibes with faint echoes over a very soft string floor | -7.00 | -7.00 |
| fusion | E | V9 cut | 3:21.60–3:56.87 | quieter bed under the fusion explanation: soft pizzicato quarters, vibes pad | -7.00 | -7.00 |
| keeps | E | n23 "keeps" | 3:56.87–3:59.20 | small lift on "keeps up instead of smearing" (F major): the pulse, strings, vibes | -5.50 | -5.50 |
| board2 | F | V10 cut (n24) | 3:59.20–4:03.23 | MODEST LIFT as the real board returns (n24): the opening lift recalled, tick on the cut | -3.50 | -3.50 |
| conditions | F | n25 start | 4:03.23–4:28.20 | quiet under the conditions (n25-n28) | -6.00 | -6.00 |
| warehouse | F | V11 cut | 4:28.20–4:42.83 | light, cautious mechanical groove (A minor): staccato pizzicato 8ths, hats, soft kick, marimba clicks | -4.00 | -4.00 |
| brake | F | s42 "slow" - 0.2 s | 4:42.83–4:45.67 | DIP on "slow down": the groove brakes to a held Fmaj7 | — | — |
| limits | F | s43 start | 4:45.67–4:56.93 | quiet under the limits (s43) | -6.50 | -6.50 |
| settle | F | n30 start | 4:56.93–5:00.70 | soft settle on "not a safety system": Gm9, then Dm9 on "not" | -7.00 | -7.00 |
| callback | G | V12 cut | 5:00.70–5:05.27 | soft callback of the opening pulse and the bassoon tiptoe under n31 | -5.00 | -5.00 |
| hold | G | s47 start | 5:05.27–5:08.27 | held A7sus question under s47 | -5.50 | -5.50 |
| j4 | G | s47 "too." end | 5:08.27–5:11.07 | COMPLETE STOP: the deadpan J4 beat | — | — |
| resolve | G | V13 cut (end screen) | 5:11.07–5:21.06 | clean, warm D-major resolve from the end-screen start (harp, strings, vibes: Dadd9 - Gmaj7/D - Dadd9), fades to exactly zero at the last sample | -2.50 | -2.50 |

Measured LU: integrated loudness after the segment's entry ramp, outside drop/stop/dip windows and their re-entry ramps, relative to the reference. Levels are set by calibration (pyloudnorm, iterated on the gained bed).

## Lifts

| Lift | Over the bed before | LU | Over the bed after | LU | 1.5-3 LU |
|---|---|---|---|---|---|
| board | pulse | +2.25 | route | +2.75 | yes |
| bump | data | +2.00 | clue | +1.75 | yes |
| U | geometry | +2.50 | (next section) | — | yes |
| board2 | keeps | +2.00 | conditions | +2.50 | yes |
| question (light) | route | +1.25 | | | |
| idea (light) | museum_thin | +1.50 | | | |
| keeps (light) | fusion | +1.50 | | | |

## Drops, stops, dips and every cue

Short-window levels: ungated K-weighted loudness (LKFS, EBU short-term length) over up to 3 s just before and just after each cue, clear of the ramps and inside the neighbouring segments; inside = the window itself after its down-ramp. Sparse beds make these noisier than the calibrated segment levels above.

| Time | Cue | Kind | Before | Inside | After | Change (dB) |
|---|---|---|---|---|---|---|
| 0:05.77–0:06.07 (0.30 s) | n01 "researchers" | drop | -22.04 | -46.47 | -19.83 | in -24.4, back +26.6 |
| 0:14.03 | board -> route | bed | -19.7 | | -21.8 | -2.1 |
| 0:26.70 | route -> question | light lift | -21.8 | | -21.14 | +0.7 |
| 0:30.37 | question -> puzzle | bed | -21.36 | | -23.42 | -2.1 |
| 0:36.62–0:37.52 (0.90 s) | n08 "visible" | stop | -24.18 | digital silence | -24.32 | after vs before -0.1 |
| 0:50.77 | puzzle -> thin | bed | -24.35 | | -25.98 | -1.6 |
| 0:57.20–0:57.73 (0.53 s) | s14 "tiny" -> s15 | drop | -25.65 | -65.59 | -26.09 | in -39.9, back +39.5 |
| 1:07.27 | data -> bump | lift | -26.05 | | -24.15 | +1.9 |
| 1:11.60 | bump -> clue | bed | -23.69 | | -25.11 | -1.4 |
| 1:16.10 | clue -> geometry | bed | -25.9 | | -27.88 | -2.0 |
| 1:49.92–1:51.30 (1.38 s) | s20 "one place" | stop | -28.63 | digital silence | -28.53 | after vs before +0.1 |
| 2:17.12–2:19.63 (2.52 s) | V6 switch / n13 | drop | -26.9 | -86.95 | -25.9 | in -60.1, back +61.1 |
| 2:26.20 | U -> museum | bed | -25.08 | | -24.54 | +0.5 |
| 2:51.00 | museum -> museum_thin | bed | -23.6 | | -25.44 | -1.8 |
| 2:56.00 | museum_thin -> idea | light lift | -25.73 | | -23.72 | +2.0 |
| 3:01.90 | idea -> small | bed | -24.47 | | -25.48 | -1.0 |
| 3:21.60 | small -> fusion | bed | -28.09 | | -26.38 | +1.7 |
| 3:56.87 | fusion -> keeps | light lift | -27.35 | | -25.69 | +1.7 |
| 3:59.20 | keeps -> board2 | lift | -25.37 | | -23.36 | +2.0 |
| 4:03.23 | board2 -> conditions | bed | -23.56 | | -25.36 | -1.8 |
| 4:28.20 | conditions -> warehouse | bed | -25.81 | | -23.64 | +2.2 |
| 4:42.83–4:45.67 (2.83 s) | s42 "slow down" | dip | -24.6 | -36.38 | -26.39 | in -11.8, back +10.0 |
| 4:56.93 | limits -> settle | settle | -26.94 | | -27.08 | -0.1 |
| 5:00.70 | settle -> callback | bed | -27.12 | | -25.11 | +2.0 |
| 5:05.27 | callback -> hold | bed | -25.11 | | -25.63 | -0.5 |
| 5:08.27–5:11.05 (2.78 s) | s47 "too." -> V13 | stop | -25.53 | digital silence | -23.03 | after vs before +2.5 |

drop = no new notes, the bed down 20-22 dB with a short down-ramp, then a re-entry ramp (0.12 s for the board lift on "researchers", 0.8 s into s15, 0.4 s into the U); stop = notes released, the bed muted with an 80 ms ramp (digital silence), resuming on the cue with the bass and pizzicato root; dip = the groove stops, one held chord at -8 dB.

## Scene cuts

The pulse runs on one grid and every new segment's chord starts on its cue, so the music carries across cuts. Quietest 100 ms of the bed within 0.5 s of each cut:

| Cut | Time | Floor | Local RMS (4 s) | Designed window | Carried |
|---|---|---|---|---|---|
| V1->V2 | 0:14.03 | -28.8 dBFS | -21.8 dBFS |  | yes |
| V2->V3 | 0:30.37 | -28.0 dBFS | -23.8 dBFS |  | yes |
| V3->V4 | 0:50.77 | -36.7 dBFS | -26.5 dBFS |  | yes |
| V4->V5 | 1:16.10 | -31.9 dBFS | -27.2 dBFS |  | yes |
| V5->V6 | 2:17.17 | -87.6 dBFS | -32.7 dBFS | hush_c | yes |
| V6->V7 | 2:26.20 | -27.0 dBFS | -26.4 dBFS |  | yes |
| V7->V8 | 3:01.90 | -29.8 dBFS | -25.7 dBFS |  | yes |
| V8->V9 | 3:21.60 | -36.6 dBFS | -27.7 dBFS |  | yes |
| V9->V10 | 3:59.20 | -31.3 dBFS | -26.2 dBFS |  | yes |
| V10->V11 | 4:28.20 | -32.2 dBFS | -24.5 dBFS |  | yes |
| V11->V12 | 5:00.70 | -31.1 dBFS | -26.6 dBFS |  | yes |
| V12->V13 | 5:11.07 | -240.0 dBFS | -27.0 dBFS | j4 | yes |

## The end

The resolve starts on the end-screen cut (V13, 5:11.07), under s48; it fades from 5:18.50 (2.56 s, after the last word) to exactly zero at the last sample: last sample [0.0, 0.0] (zero); RMS of the last 0.5 s -53.8 dBFS, of the last 0.1 s -76.7 dBFS; the last sample above -80 dBFS is 38.5 ms before the end (no silent tail, no cut).

## Motifs

- **Curious pulse** (A, recalled in B, F and G): pizzicato 8ths on the chord (v1's figure, with a sly chromatic step every fourth chord) over a staccato bass on every beat, soft shaker, a soft kick on 1; a bassoon tiptoe in the first two bars, recalled under n31.
- **Flash and echo**: a glockenspiel tick on D8 (4.7 kHz) and a fainter echo on C8 0.45 s later, only on cues: s02 "sensor", n01 "researchers" (the real board), n09 "timing", s15 "zoom", s37 "U", the board's return (V10) and after the last word.
- **Clockwork-light** (C): a marimba tick-tock and a pizzicato root; a hat tick from the first arc (s19), marimba off-beat pings from the second (s20); Cmaj7 -> Dsus -> Gadd9 as the U resolves.
- **Museum** (D): the pulse as a walk in Bb major with 16th pickups; the v1 clarinet line answered by bassoon.
- **Warehouse** (F): v1's cautious A-minor groove; it brakes to a held Fmaj7 on "slow down".
- **Ending** (G): held A7sus under s47, digital silence for the J4 beat, then Dadd9 - Gmaj7/D - Dadd9 with harp.

## Instruments (General MIDI, MuseScore General)

pizzicato strings (45), marimba (12), vibraphone (11), glockenspiel (9, ticks only), nylon guitar (24), harp (46), acoustic bass (32), bassoon (70), clarinet (71), slow strings (49), percussion (channel 10: 36, 42, 82 = kick, closed hat, shaker). Voice/choir programs used: none.

## Speech band

Melodic notes at or below MIDI 79 (B5 = 988 Hz is the ceiling); ticks on 108, 110 (above 4 kHz); per-instrument EQ cuts 2.2-2.5 kHz and low-passes the leads (the sustained strings at 1.1 kHz, 4th order). Energy in 1-4 kHz: 0.4% of the whole bed; per section above; per stem: pizz 0.1%, marimba 1.4%, vibes 0.0%, glock 0.0%, guitar 1.0%, harp 0.1%, bass 0.0%, bassoon 1.3%, clarinet 7.5%, strings 1.5%, drums 0.3%.

## Measured

Integrated -24.77 LUFS (unducked); sample peak -6.88 dBFS; true peak -6.87 dBTP (4x); 0 clipped samples; 15410640 samples = timeline durationSeconds 321.055 s (match); narration 15410640 samples; the video's 9632 frames are +11.67 ms from the bed (the bed is already at zero there). Stems sum to the bed within 1.19e-06 (24-bit rounding). SHA-256 of the bed: `3a5671ec1b276e69…`.

Re-run (one command; reads every cue from the current timeline): `python3 tools/make_music_v02v2.py`. Mix: `python3 tools/mix_v2.py --music audio/music/v02v2/music_bed.wav`.

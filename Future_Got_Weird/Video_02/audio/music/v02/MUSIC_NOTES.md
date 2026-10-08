# Video 02 music bed: notes

Original score composed in code (`tools/make_music_v02.py`, adapted from Video 01's `make_music_v2.py`), rendered with FluidSynth 2.3.4 and the MuseScore General SoundFont (MIT). Instrumental; no existing themes; no Video 01 material reused. 100 BPM throughout (bar = 2.4 s). Cues come from the measured timeline (`source/src/data/timeline.json`), so re-running the tool after a timeline change moves every section, drop and stop with the words.

Files: `music_bed.wav` (48 kHz stereo 24-bit, unducked, 403.033 s = timeline), `stems/*.wav` (post-dynamics; they sum to the bed), `plan.json` (cues, segments, windows), `measure.json`.

## Structure

| Segment | Time | Scene | Music | Target LU | Measured LU |
|---|---|---|---|---|---|
| sneak | 0:00.00–0:05.20 | S1 | tiptoe figure: pizzicato + bassoon, marimba answers | -3.0 | -3.0 |
| sensor | 0:05.20–0:09.27 | S1 | light offbeat pizzicato; first flash tick on "sensor" | -5.0 | -5.0 |
| reveal | 0:09.27–0:21.00 | S1 | DROP: near-silence for the real data | — | — |
| curious | 0:21.00–0:51.37 | S1 | curious ostinato, flash-and-echo ticks, vibes question | -2.5 | -2.5 |
| settle | 0:51.37–1:00.87 | S1 | settles: strings, slow marimba | -5.0 | -5.0 |
| playful | 1:00.87–1:21.83 | S2 | bright pizzicato bounce, marimba, shaker, clarinet answers | -1.0 | -1.0 |
| light | 1:21.83–1:35.80 | S2 | lighter: pizzicato on 1 and 3, vibes | -4.5 | -4.6 |
| echo | 1:35.80–1:53.13 | S3 | sparse vibes, each with a faint echo | -7.0 | -7.0 |
| board | 1:53.13–2:11.80 | S3 | almost nothing: a soft string drone | -14.0 | -14.0 |
| clock | 2:11.80–3:04.20 | S4 | clockwork marimba, one layer per arc | -3.0 | -3.0 |
| resolve | 3:04.20–3:09.73 | S4 | resolution chords (Cmaj7 -> Gadd9) | -4.0 | -4.0 |
| museum | 3:09.73–3:50.07 | S5 | walking pizzicato, slow strings, a clarinet line answered by bassoon | -2.5 | -2.5 |
| turn | 3:50.07–3:56.80 | S5 | thins to a held string chord | -6.0 | -6.1 |
| nimble | 3:56.80–4:41.13 | S6 | nimble marimba 16ths, pizzicato, shaker, soft kick | -1.5 | -1.5 |
| lift | 4:41.13–4:53.27 | S6 | lift: up a step to E, strings + vibes | -0.5 | -0.5 |
| evidence | 4:53.27–5:38.23 | S7 | sparse vibes and guitar | -7.5 | -7.5 |
| groove | 5:38.23–6:06.30 | S8 | mechanical pizzicato 8ths, hats, marimba clicks | -3.0 | -3.0 |
| groove_out | 6:06.30–6:12.43 | S8 | groove thins, strings | -5.5 | -5.5 |
| callback | 6:12.43–6:15.10 | S9 | quiet callback of the tiptoe figure | -6.0 | -6.0 |
| build | 6:15.10–6:23.10 | S9 | gentle build, one layer per bar | -2.0 | -2.0 |
| hold | 6:23.10–6:26.07 | S9 | held A7sus question under s47 | -6.0 | -5.9 |
| gag | 6:26.07–6:30.57 | S9 | STOP: silent gag | — | — |
| end | 6:30.57–6:43.03 | S9 | warm D-major resolution, fades to zero at the end | -3.0 | -3.0 |

LU = relative to the reference level (-20.0 LUFS in the delivered bed), measured outside the drop/stop/dip windows. The mix (`mix_v2.py` pattern) normalises the bed to -27 LUFS integrated and ducks it a further 9 dB under speech, so these are the relative moves the viewer hears.

## Drops and stops

| Window | Kind | Time | Length | RMS in window | RMS 4 s before |
|---|---|---|---|---|---|
| reveal: s03 "And yet... this is real data" (re-enters softly on s04) | drop | 0:09.27–0:20.90 | 11.63 s | -106.0 dBFS | -27.0 dBFS |
| J2: s10 "simply visible" (resumes on s11) | stop | 1:12.05–1:13.33 | 1.28 s | digital silence | -23.0 dBFS |
| J3: s20 "one place" (sound effect only, resumes on s21) | stop | 2:39.45–2:41.23 | 1.78 s | digital silence | -26.1 dBFS |
| s42 "slow down" (the groove brakes, resumes on s43) | dip | 5:51.97–5:54.83 | 2.87 s | -37.3 dBFS | -24.2 dBFS |
| J4: silent gag after s47 (complete stop until s48) | stop | 6:26.07–6:30.47 | 4.40 s | digital silence | -26.0 dBFS |

drop = no new notes and -24 dB (near-silence; measured after a 0.6 s tail), then a soft re-entry on s04 (-9 dB easing to 0 over 3 s, with the first bars played softer); stop = notes released, the bed muted with an 80 ms ramp (complete silence); dip = the groove stops, one held chord at -8 dB.

## Motifs and cues

- **Flash and echo** (the sensor's pulse, as music): a glockenspiel tick on D8 (4.7 kHz) and a fainter echo on C8 0.45 s later. On s02 "sensor", s05 "flash" (strongest), every other bar from s05 to s07, s08 "clue", s12 "timing", s17 "flashes", s41 "sensor", in the s46 build and after the last word.
- **Tiptoe** (s01): staccato pizzicato with bassoon on the low steps, in D minor; quietly recalled on s45.
- **Clockwork** (S4): marimba 8ths from s17; + pizzicato at s18 (arc 1); + guitar at s20 "another arc"; + vibes and bass at s21 (bands); + 16th marimba and shaker at s23 "many"; Cmaj7 at s24, Gadd9 on "shape".
- **Ending**: build Bbmaj7-C6-Gm9 under s46, held A7sus under s47, stop on "too.", D-major (Dadd9, Gmaj7/D, Dadd9) under s48 and the end card, fade over the last 3 s to zero at the timeline end.

## Instruments (General MIDI programs, MuseScore General)

pizzicato strings (45), marimba (12), vibraphone (11), glockenspiel (9, ticks only), nylon guitar (24), harp (46, end only), acoustic bass (32), bassoon (70), clarinet (71), slow strings (49), percussion (channel 10: shaker, closed hat, tambourine, soft kick).

## Speech band

Melodic notes stay at or below B5 (MIDI 83 max); ticks sit at 108, 110 (above 4 kHz); per-instrument EQ cuts 2.2-2.5 kHz and low-passes the leads. Energy in 1-4 kHz: 1.0% of the whole bed; per scene S1 0.5%, S2 0.3%, S3 0.3%, S4 1.3%, S5 2.9%, S6 0.5%, S7 0.4%, S8 0.2%, S9 1.6%.

## Measured

Integrated -22.96 LUFS (unducked, before the mix); sample peak -6.81 dBFS; true peak -6.81 dBTP (4x); 0 clipped samples; 19345600 samples = timeline 19345600 (match).

| Scene | Time | LUFS | Rel. LU | After mix normalisation (-27) |
|---|---|---|---|---|
| S1 | 0:00.00–1:00.87 | -23.1 | -0.2 | -27.2 |
| S2 | 1:00.87–1:35.80 | -21.8 | +1.1 | -25.9 |
| S3 | 1:35.80–2:11.80 | -29.9 | -6.9 | -33.9 |
| S4 | 2:11.80–3:09.73 | -23.1 | -0.1 | -27.1 |
| S5 | 3:09.73–3:56.80 | -22.7 | +0.2 | -26.8 |
| S6 | 3:56.80–4:53.27 | -21.3 | +1.7 | -25.3 |
| S7 | 4:53.27–5:38.23 | -27.5 | -4.5 | -31.6 |
| S8 | 5:38.23–6:12.43 | -23.4 | -0.5 | -27.5 |
| S9 | 6:12.43–6:43.03 | -23.0 | -0.1 | -27.1 |

Re-run: `python3 tools/make_music_v02.py` (deterministic; about three minutes).

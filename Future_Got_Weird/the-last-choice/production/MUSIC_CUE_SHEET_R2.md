# THE LAST CHOICE — R2 music cue sheet

**Private review edit only.** The owner supplied the recordings; that does not establish publication clearance, and
nothing here represents rights as cleared.

- **Not in the public repository:** the recordings, the music tracks and the mixes are all Git-ignored. `tools/fetch_music.sh` re-downloads the release assets (`film-audio-v1`), checks their SHA-256 and extracts the audio.
- **Editable:** the music stays in separate tracks, rebuilt by `tools/r2/build_music_r2.py` into `audio/r2/music/`:
  - `portals.wav`;
  - `llt_full.wav`;
  - `llt_radio.wav`, the same edit through a small-speaker model.
- **Single source for all times:** `source/src/r2/timing.ts` (`MUSIC`, `M`).

## Sources

| ID | Recording | Release asset | Length | Notes |
|---|---|---|---|---|
| `portals` | "Portals", Alan Silvestri, *Avengers: Endgame* OST (Spotify playback screen recording) | `Screen.Recording.2026-10-16.234600.mp4` | 194.30 s | The capture starts ≈3.0 s into the track, inside a decaying chord. The music rings out to silence at rec 193.8. |
| `longtime` | "It's Been a Long, Long Time" (Jule Styne / Sammy Cahn), Harry James and His Orchestra with Kitty Kallen | `Screen.Recording.2026-10-16.235008.mp4` | 200.07 s | The capture starts ≈2.2 s into the track. The player crossfades to another song at rec ≈195.3. |

## Cue 1: Portals, used in full

| Film | Recording | Treatment |
|---|---|---|
| 0:00.60 → 3:13.10 | rec 1.30 → 193.80 | Nothing is removed. The 0.1 s fade-in sits on the decaying tail just before the 1.42 s low hit, which is the first musical event heard (film 0:00.72). The music ends on its own ring-out. |

**R1's cut is restored.** R1 removed rec 81.69–143.08 (61.39 s); R2 plays straight through. The only material
not used is rec 0–1.30: the tail of a chord whose attack happened before the capture began. Starting there would
open the film mid-decay. A sound-designed fire and wind bed covers 0:00–0:00.6.

### Measured structure and where the picture lands

Measurements are waveform, onset and chroma analysis, not listening (see the end of this sheet). Film = rec − 0.70.

| Recording | Film | Music | Picture |
|---|---|---|---|
| 1.42 | 0:00.72 | low hit | a distant tower begins to fail |
| 1.4–9.8 | — | decay to near silence (−60 dB) | the aerial over the burning district |
| ≈7.3–10.0 | 0:06.6–0:09.3 | near silence | **black title card** |
| 10.0–17.4 | 0:09.3–0:16.7 | sparse solo notes | the Director pulls himself out of the rubble and stands |
| **17.46** | **0:16.76** | full-orchestra entrance | the machine army revealed |
| 19.16 / 19.58 | 0:18.46 / 0:18.88 | hits | the army's synchronized step, eyes lighting |
| 24.24 | 0:23.54 | hit | a heavy's head turns toward him |
| 30.96, 32.62 / 33.04 | 0:30.26, 0:31.92 / 0:32.34 | hits | the army halts as one; the lonely wide |
| 36.5–38.3 | 0:35.8–0:37.6 | bass drops out | a held breath: movement behind him |
| 39.16 | 0:38.46 | hit on re-entry | the first ally steps out of the smoke |
| 40.86 / 41.28 | 0:40.16 / 0:40.58 | hits | two more arrive over the slabs |
| ≈46 | 0:45.3 | march drive begins | the rest of the Crew arrive |
| 53.74 | 0:53.04 | accent | the shared turn toward the enemy (group frame) |
| 60.65 | 0:59.95 | accent | the charge |
| 69.0 | 1:08.3 | structural boundary | the clash, wide |
| 79.16 · 82.04 · 83.50 · 86.34 | 1:18.46 · 1:21.34 · 1:22.80 · 1:25.64 | strong accents | the four decisive contacts; the gap opens |
| 91.8–94.7 | 1:31.1–1:34.0 | bass rests | the breath at the crater rim |
| 96.08 | 1:35.38 | accent | the decoy appears on the smoke |
| 100.2 / 100.66 / 101.1 | 1:39.5–1:40.4 | three quick accents | the machines strike at the light |
| 106.54 | 1:45.84 | accent | the tether swings one unit into another at the girder |
| 111.16–112.08 | 1:50.46–1:51.38 | accents | the runner knocked back and caught |
| 113.9 / 114.82 | 1:53.2 / 1:54.12 | accents | the drone shields, then the counter |
| 116.2–117.0 | 1:55.5–1:56.3 | bright register breath | a moment of success |
| 117.62 → ≈150 | 1:56.92 → 2:29.3 | strongest march (bar accents ≈1.86 s apart) | the strongest attack fells a heavy (2:05.64), then the system adapts (2:08–2:25) |
| 150.56 | 2:29.86 | G/D preparation | losing ground |
| **163.12** | **2:42.42** | B♭ arrival (sustained statement) | the last coordinated counterattack |
| 175–179 | 2:54.3–2:58.4 | accents | the ring closes; the Director takes the blow (2:57.76) |
| 180.0 | 2:59.3 | softening | he falls by the van |
| 187.6 | 3:06.9 | final hit | the machines stop as one |
| 187.6–193.8 | 3:06.9–3:13.1 | ring-out | his last moments; the cue resolves under the close-up |

## Cue 2: It's Been a Long, Long Time (radio → score)

| Film | Recording | Treatment |
|---|---|---|
| 3:19.90 | — | **The radio click** (sound effect), then 0.5 s of tuning crackle. |
| 3:20.40 → 3:30.605 | rec 0 → 10.205 | **The opening trumpet phrase** (the earliest the capture has; the track's first ≈2.2 s are not in the recording). The 0.04 s fade-in reads as a radio catching a broadcast. |
| **3:30.605** | **rec 10.205 → rec 57.26** | **The one edit:** an equal-power crossfade of 0.06 s that ends on the destination point. Details below. |
| 3:30.605 → 3:37.705 | rec 57.26 → 64.36 | The close of the instrumental chorus, the quieter bar (rec 58.45), and the brass lead-in. |
| **3:37.705** | **rec 64.36** | **The singer enters: "Never thought that you would be…"** |
| 3:43.6 → 3:50.0 | rec 70.88 → 77.2 | "There's so much I feel…", then "But words can wait until some other day" begins |
| 4:02.8 → 4:13.8 | rec 89.46 → 100.48 | "Kiss me once, then kiss me twice… It's been a long, long time." |
| 4:13.8 → 4:15.55 | rec 100.48 → 102.2 | 1.6 s fade before the next sung phrase ("Haven't felt like this", rec 102.44). |

**Total second cue: ≈55 s** (click 3:19.9 → music end 4:15.55); the end card holds to 4:18.

### How the vocal entrance and the edit were found (verified, not remembered)

- **Vocal onset.** The extracted recording was transcribed with ElevenLabs Scribe, which returns per-word timestamps. The first sung word is "Never" at **rec 64.36–65.30**. The full lyric timing is in `production/music/longtime_scribe_words.json`. (R1's spectral inference had put it at ≈64.4.)
- **Meter.** The sung 8-bar sections start 12.6–13.3 s apart ("Kiss me once" 89.46 → "Haven't felt" 102.44 → "You'll never know" 114.54 → "So kiss me once" 127.86), so a bar is ≈1.57 s. The automatic beat tracker's 0.522 s grid is a dotted-pulse error, so it was not used for the edit.
- **The edit point.** `tools/llt_edit.py` scored every pair of attack points: sources in rec 7–17 (the trumpet material to keep, 8–15 s per the brief) against destinations in rec 56–63 (the bars that lead into the vocal). It weighed harmony before/after, the cross term (the bar before the source against the bar after the destination), timbre, loudness and attack strength. The best pair is **rec 10.205 → 57.26**:

  | Measure | Score |
  |---|---|
  | Harmonic similarity | 0.892 |
  | Cross-join harmony | 0.94 |
  | Timbre | 0.95 |
  | Level difference | 1.4 dB |

  Later destinations, closer to the vocal, all scored clearly worse (harmony 0.72–0.82, level differences of 3–6 dB). Candidates are in `production/music/longtime_edit_candidates.json`.
- **Reading of the edit.** Both points sit at the same cadence: the end of an 8-bar trumpet phrase near the start of the record, and the end of the last trumpet phrase before the transition. So the edit should read as a skip from the end of the trumpet's first phrase to the end of its chorus. The singing arrives 17.3 s after the trumpet starts.
- **Join measurements** (`audio/r2/music/edit.json`; picture in `production/music/r2_llt_join.png`):
  - The largest sample step within ±10 ms of the edit is 0.110, against the track's own 99.99th-percentile step of 0.182, so no click.
  - Harmonic partials continue across the join in the spectrogram.
  - RMS is −19.5 dB in the 300 ms before and −22.4 dB in the 300 ms after. The steep dip about 1.2 s later is the recording's own quieter bar, not the edit.
- **Radio → score.** Both tracks are built (`llt_radio.wav`, `llt_full.wav`) and crossfaded in the mix as the camera rises. The automation is in `source/src/r2/sound.ts` (`RADIO_MIX`).

## What still needs a human ear (I cannot listen in this environment)

- The edit at 3:30.6 (preview: `audio/r2/music/preview_llt_join.wav`, from 8 s before to 10 s after the join). Check that the phrase sounds continuous and the 2.9 dB step is acceptable.
- The radio-to-full transition.
- The Portals entry at 0:00.6, where the low hit follows a 0.1 s fade on the previous chord's tail.
- The overall balance of music against effects. Every check above is measurement, not listening.

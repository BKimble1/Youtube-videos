# THE LAST CHOICE — R3 music cue sheet

**Private review edit only.** The owner supplied the recordings; that does not establish publication clearance, and
nothing here represents rights as cleared. The recordings, music tracks and mixes stay Git-ignored
(`tools/fetch_music.sh` re-downloads release `film-audio-v1` and checks its SHA-256).

The sources and Cue 1 ("Portals", used in full, rec 1.30 → 193.80 at film 0:00.60 → 3:13.10) are unchanged from R2.
They are documented in `production/MUSIC_CUE_SHEET_R2.md`, including the measured structure the picture lands on.
The music anchors (`M` in `source/src/r2/timing.ts`) did not move in R3.

What changed in R3:
- Cue 2 has no edit and nobody touches the radio.
- The film ends at 3:57.8 instead of 4:18.
- The opening effort sounds are lower at source.

## Cue 2: It's Been a Long, Long Time (unattended radio → score), continuous

| Film | Recording | Treatment |
|---|---|---|
| **3:19.00** | — | **The radio indicator flutters** with two bursts of static: 3:19.00 (0.3 s) and 3:19.38 (0.5 s). The camera has panned to the radio, and **nobody is near it or touches it.** |
| **3:19.60 → 3:54.26** | **rec 0 → 34.66** | **Plays from the first sample of the usable recording, continuously and in order.** The capture starts ≈2.2 s into the track. The 0.35 s fade-in reads as the broadcast catching through the static. |
| 3:54.26 | rec 34.66 | The cadence arrival. It was chosen by chroma similarity (0.97) to the song's own phrase endings and refined on the onset; it is where the phrase arrives home. |
| 3:54.26 → 3:57.26 | rec 34.66 → 37.66 | 3.0 s fade, over the end card. |
| 3:51.60 → 3:57.80 | — | End card: **A FUTURE GOT WEIRD FILM**. |

- **Total second cue: 38.8 s**, from the flutter at 3:19.0 to the end at 3:57.8.
- **The vocal (rec 64.36) is not reached.** The R2 splice toward it (rec 10.205 → 57.26) is removed, as the R3 audit instructs.
- `audio/r2/music/edit.json` lists no joins for this segment.

**Measured on the built tracks** (`tools/r2/build_music_r2.py`):
- The full-range copy is non-silent from 199.62 to 237.13 s, and the radio copy from 199.63 to 237.07 s.
- **The two copies are sample-aligned:**
  - Both are cut from one continuous read of the recording.
  - The radio's speaker model is filtered zero-phase (`filtfilt`).
  - A cross-correlation of the two copies (both band-limited to 400–3000 Hz) peaks at a lag of **0 samples**.

**Previews:** `audio/r2/music/preview_llt_entry.wav` (the entry through the static) and
`preview_llt_ending.wav` (the cadence and fade).

## The mix (`tools/r2/mix_r2.py`)

- **Stems:** `audio/r2/mix/stems/{music_portals, music_llt, sfx, beds}.wav`, plus `mix.wav` and `measure.json`. All are Git-ignored.
- **Radio → score:** `sound.ts` `RADIO_MIX`.
  - The radio-speaker version plays alone, at −5 dB, until 3:23.0.
  - From 3:23.0 to 3:37.0, it recedes (quieter and darker, through a zero-phase low-pass) while the full-range copy rises at equal power.
  - The song is full range from 3:37.0.
- **Score in front, gently:** effects give way to the music only where their short-term level comes within 3 dB of the music's.
  - Ratio 0.6, at most 5 dB.
  - The latest mix: active for 63.7 s in all, averaging 1.35 dB of reduction.
- **Opening effort sounds** (the rise, 0:09.3–0:16.8): reduced at source rather than ducked.
  - The breaths, grunts, rubble and cables in B's cue sheet are 6 dB lower over Portals' solo (`balanceRise` in `shots/B/cues.ts`), and near-duplicate takes within 0.3 s are dropped.
  - The worst 400 ms window of effects over music in 0:09.3–0:35 went from +10 dB to +4 dB. The +4 dB is at the knee's contact with the slab.
- **Level:** static gain to −16 LUFS integrated, then a 4×-oversampled lookahead limiter to −2.0 dBTP.
  - The latest mix measures −16.0 LUFS and −2.0 dBTP before encoding (1,210 cues). On the encoded AAC file of the final render the same measurement reads −16.1 LUFS and −2.0 dBTP (see the README).
  - The limiter does more than 2 dB only at the strike (2:57.96 and 2:58.29, at most 2.7 dB).
  - The true peak is re-measured on the encoded AAC file (see the README).

## What still needs a human ear (I cannot listen in this environment)

- The song's entry through the static at 3:19.6.
- The cadence and fade at 3:54.3.
- The radio-to-full transition.
- The lowered opening effort sounds against Portals' solo.
- The overall balance. Every check above is measurement, not listening.

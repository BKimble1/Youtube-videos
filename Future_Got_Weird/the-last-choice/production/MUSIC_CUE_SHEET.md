# THE LAST CHOICE — music cue sheet (review edit R1)

**Private review edit only.** The owner supplied the recordings; supplying them does not establish publication
clearance and nothing here represents that rights are cleared. The recordings and any file containing them are kept
out of this public repository (`.gitignore`); `tools/fetch_music.sh` re-downloads them from the release.

## Sources (verified)

| ID | What the recording shows | Release asset | SHA-256 | Recording length |
|---|---|---|---|---|
| `portals` | Spotify playback of **"Portals"**, Alan Silvestri, *Avengers: Endgame (Original Motion Picture Soundtrack)*, listed 3:17 | `Screen.Recording.2026-10-16.234600.mp4` (1918×1018, 30 fps; AAC 48 kHz stereo 192 kb/s) | `0507e9e2…0ad1` (matches the release digest) | 194.300 s |
| `longtime` | Spotify playback of **"It's Been a Long, Long Time (with Harry James & His Orchestra)"**, Kitty Kallen, Harry James, listed 3:23 | `Screen.Recording.2026-10-16.235008.mp4` (same format) | `ddf536f6…f39b` (matches) | 200.067 s |

Audio was extracted losslessly from the MP4 audio stream (`ffmpeg -map 0:a:0 -c:a pcm_s24le`); no player UI audio was
found (none is expected from a muted desktop recording; this was checked only by spectral inspection).

### Offsets and ends (measured, not remembered)
- **Player clock vs recording time** (frames read every 0.2–60 s): Portals track ≈ rec + 3.0 s; Long, Long Time
  track ≈ rec + 2.2 s. Spotify's clock updates once per second, so these offsets are ±0.5 s. The recordings therefore
  **miss the first ≈3.0 s of Portals and ≈2.2 s of Long, Long Time**. Neither missing opening is used.
- **Portals end**: the final chord rings out to silence (−65 dB) at **rec 193.8 s**; the player changes to the next
  album track ("Get This Thing Started") at rec 194.0–194.2 s. Nothing after 193.8 s is used.
- **Long, Long Time end**: the player switches to Vera Lynn's "We'll Meet Again" at **rec 195.3–195.4 s** while showing
  3:17 of a 3:23 track (continuous rhythm through the switch suggests a crossfade/automix). **The song's true final
  cadence is not cleanly in the recording.** The edit therefore ends on an earlier phrase and fades under the end card.
- Both recordings were captured quietly: −27.5 / −27.2 LUFS integrated, sample peaks ≈ −13 dBFS. A fixed make-up gain
  (+9 dB / +8 dB) is applied in `tools/build_music.py`; the mixer sets the final balance.

### What I could and could not verify
- **I cannot listen in this environment.** Everything below comes from waveform, spectrogram, onset, chroma and
  structural-novelty measurements (`tools/analyze_music*.py`, `tools/analyze_vocal.py`, `tools/music_grid.py`; images in
  `production/music/`).
- **Vocal entrances in Long, Long Time are inferred, not transcribed.** A local speech model could not be downloaded
  (the model host is blocked here) and the ElevenLabs transcriber does not accept the video asset. The inference: the
  section from rec 64.4 s has a darker, syllabic lead with frequent consonant noise bursts and brass fills between
  phrases (vocal chorus), unlike the bright, wide-vibrato brass lead before it and the sparse stop-time solo after
  rec 140 s. **Please confirm by ear that the singer enters at about film 2:32.9.**

## Measured structure used for the edit (recording seconds)

**Portals**: 0–1.4 decaying low chord (recording starts inside it) · **1.42** low hit · decay to near silence by 9.8
· **10.0–17.4** sparse solo notes · **17.46** full-orchestra entrance · 19.16 / 19.58 hits · 24.24 hit · 30.96,
32.62 / 33.04 hits · **36.5–38.3 bass drops out** · **39.16** hit on re-entry · 40.86 / 41.28 · from ≈46 a march-like
drive (beat ≈0.44–0.47 s) · 79.16, 82.04, 83.5, 86.34 strong accents · 91.8–94.7 bass rests · 116.2–117.0 bright
register breath · 117.6 → 150 strongest march (bar accents ≈1.86 s apart) · 150–163 G/D preparation · **163.0 B♭
arrival** (sustained B♭ statement) · 180 softening · **187.6 final hit** · ring-out to silence **193.8**.

**Long, Long Time**: 0–58.4 band chorus (bright brass lead) · **58.45 strongest structural boundary**; a quieter bar,
then a brass swell 60–64.3 · **≈64.4 vocal enters (inferred)** · brass fills ≈80.5–89.5, 100–102, 112.5–115.4 between
vocal phrases · 140–164 sparse stop-time solo · 164.5 dense ensemble out-chorus · cut by the player at 195.3.

## The edit (film timecodes; `src/film/timing.ts` is the single source of truth)

| # | Source | Rec in → out | Film in → out | Transition |
|---|---|---|---|---|
| 1 | Portals | 9.800 → 81.688 | 0:09.34 → 1:21.23 | 0.2 s fade-in on near silence (nothing audible is cut) |
| 2 | Portals | 143.081 → 193.800 | 1:21.23 → 2:11.95 | **Splice**: 61.393 s removed. Equal-power 0.12 s crossfade ending on the destination's downbeat hit at 143.081 (chosen by `tools/music_grid.py splice`: harmonic/timbre continuity score 0.874; largest sample step at the join 0.099 vs the stem's p99.99 0.17). An on-screen impact (the warden smashed into the column) lands on it. Natural ring-out end. |
| 3 | Long, Long Time | 58.450 → 115.300 | 2:27.00 → 3:23.85 | 0.25 s fade-in at the section boundary, **through the radio** (300–3.4 kHz small speaker, light saturation, mono, short room) → opens to full-range stereo over 1.6 s from 3:08.05; fades under the end card from 3:22.00 (after the inferred phrase end at 3:20.95) to silence at 3:23.85 |

### Sync points (film time ← recording time)
| Film | Music event | Picture |
|---|---|---|
| 0:00–0:09.3 | — (no score) | the taxi, the arm, the pull: diegetic sound carries the opening |
| 0:09.54 | first solo note (10.0) | the Director chooses; the score emerges |
| **0:17.00** | full-orchestra entrance (17.46) | the camera crests the smoke: the refuge appears |
| 0:23.78 | hit (24.24) | the subway grille bursts open |
| 0:30.50 | hit (30.96) | the strap is cinched (radio) |
| 0:32.16 / 0:32.58 | hits | the subway gate jolts up |
| 0:36.04–0:37.84 | bass drops out | held breath on the exit stairs |
| **0:38.70** | hit on re-entry (39.16) | cut to the assembly composition |
| 0:45.54 | march begins | the group moves off the terrace |
| 0:53.28 | accent (53.74) | the hauler starts |
| 1:18.70 | accent (79.16) | the small drone's eye snaps amber (3 frames after the C7→C8 cut) |
| **1:21.23** | splice / destination hit | the warden is smashed into the column |
| 1:24.03 | accent (145.88) | the warden hits the street |
| **1:41.15** | B♭ arrival (163.0) | the operator chooses to hold the lever |
| 1:45.25 | onset (167.10) | **the blast** hits the gantry; muffled perspective 1:45.29–1:49.60 with an ear ring over it (`PERSPECTIVE` in `src/film/sfx.ts`) |
| 1:58.15 | softening (180.0) | carrying the friend down to the waterfront |
| **2:05.75** | final hit (187.6) | the refuge doors open |
| 2:11.95 | ring-out ends | — silence: the hands, the sheet |
| 2:25.60 | — | radio click, tuning static |
| **2:27.00** | Long, Long Time (58.45) | the old song through the small speaker |
| 2:32.95 | vocal (≈64.4, inferred) | the teammate holds the visor |
| **3:08.05** | brass fill (99.8) | the radio opens into the full recording as the enclosure is revealed |
| 3:20.95 | phrase end (≈112.4, inferred) | end card |
| 3:23.85 | — | silence; film ends 3:25.40 |

## Replacing or re-cutting the music
Change `MUSIC` and `M` in `src/film/timing.ts`; every shot boundary that hangs on a music anchor follows. Then
`node ../tools/collect_timing.mjs` (from `source/`), `python3 tools/build_music.py`, `python3 tools/mix.py`.

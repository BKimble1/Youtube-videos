# Clip ledger: official Tesla footage in the Short and the companion

**Source.** Tesla's Roadster reveal livestream replay, Oct 15, 2026: https://x.com/Tesla/status/2110788059008819215.
The owner captured five screen recordings of it and uploaded them as assets of the **draft** release
`roadster-footage-2026-10-15` in BKimble1/Youtube-videos (release id 414488220, left as a draft). They were
downloaded with authenticated read access on 16 Oct 2026. All times below are positions **inside those recordings**.
The recordings' own replay timecodes are not known.

**Rights:** Tesla's footage, used in short excerpts with original commentary and animation. The owner confirms rights.
Content ID has not been observed; it only appears in YouTube Studio during upload.

## Source recordings

| Local name | Release asset (id) | Duration | SHA-256 (first 16) | Contents |
|---|---|---|---|---|
| `rec_224730.mp4` | `Screen.Recording.2026-10-15.224730.mp4` (645945678) | 156.6 s | `5c463011ef482cd4` | reveal film; first ramp run (climb, upside-down hang, close-up from below); second run (launch, roll, landing; side + aerial angles). **No audio** (silent track) |
| `rec_224911.mp4` | `Screen.Recording.2026-10-15.224911.mp4` (645946444) | 59.1 s | `173523437c187928` | drive-in; hop over the Semi and a row of Teslas (front, side, replay angles); has audio |
| `rec_225050.mp4` | `Screen.Recording.2026-10-15.225050.mp4` (645946790) | 48.8 s | `30556ccc29003c47` | car on stage, doors open, people around it (no Optimus visible); not used |
| `rec_225218.mp4` | `Screen.Recording.2026-10-15.225218.mp4` (645947394) | 53.6 s | `a98ea27911181ed2` | Musk on stage; 0-60 run with on-screen timer stopping at 01.00; "0-60mph 1 sec" card |
| `rec_225340.mp4` | `Screen.Recording.2026-10-15.225340.mp4` (645947843) | 51.0 s | `b12657d040a03f74` | Musk on stage; launch from the start box; not used |

## Slot clips (cut by tools/ingest_footage.py)

| Slot | Recording | Slot `in` | Clip span | What it shows |
|---|---|---|---|---|
| F1_AIRBORNE | `rec_224730.mp4` | 2:08.25 | 2:04.65–2:13.25 | Roadster midair on its jets (side angle) |
| F2_RAMP_CLIMB | `rec_224730.mp4` | 1:03.60 | 1:03.10–1:09.40 | Climbing the curved ramp (first run, wide) |
| F3_INVERTED | `rec_224730.mp4` | 1:17.50 | 1:17.00–1:22.50 | Upside down against the ramp (close-up from below) |
| F4_LAUNCH_ROLL | `rec_224730.mp4` | 2:17.95 | 2:17.35–2:26.35 | Leaves the ramp and rolls on its jets (aerial angle) |
| F5_LANDING | `rec_224730.mp4` | 2:11.70 | 2:11.20–2:14.10 | Settling into its landing (side angle) |
| F6_FIVE_VEHICLES | `rec_224911.mp4` | 0:18.60 | 0:18.10–0:23.20 | Flipping over a Semi and a row of Teslas (side angle) |
| F7_ACCEL_RUN | `rec_225218.mp4` | 0:15.60 | 0:15.10–0:25.60 | 0-60 run with Tesla's on-screen timer |

## Short (9:16): footage shots as rendered

| Shot | Short time | Slot | Recording | Source in → out |
|---|---|---|---|---|
| sh01 | 0.00–2.40 | F1_AIRBORNE | `rec_224730.mp4` | 2:08.25 → 2:10.65 |
| sh02 | 2.40–4.40 | F2_RAMP_CLIMB | `rec_224730.mp4` | 1:03.60 → 1:05.60 |
| sh03 | 4.40–5.80 | F3_INVERTED | `rec_224730.mp4` | 1:17.50 → 1:18.90 |
| sh04 | 5.80–8.70 | F4_LAUNCH_ROLL | `rec_224730.mp4` | 2:17.95 → 2:20.85 |
| sh05 | 8.70–9.95 | F5_LANDING | `rec_224730.mp4` | 2:11.70 → 2:12.95 |
| sh06 | 9.95–10.60 | F3_INVERTED | `rec_224730.mp4` | 1:18.90 → 1:19.55 |
| sh09 | 17.65–21.88 | F6_FIVE_VEHICLES | `rec_224911.mp4` | 0:18.60 → 0:22.83 |
| sh13 | 36.92–38.70 | F4_LAUNCH_ROLL | `rec_224730.mp4` | 2:24.45 → 2:26.23 |
| sh14 | 38.70–42.10 | F1_AIRBORNE | `rec_224730.mp4` | 2:04.85 → 2:08.25 |

## Companion (16:9): footage shots as rendered

| Shot | Companion time | Slot | Recording | Source in → out |
|---|---|---|---|---|
| c01 | 0:00.00–0:05.14 | F4_LAUNCH_ROLL | `rec_224730.mp4` | 2:17.45 → 2:22.59 |
| c02 | 0:05.14–0:06.50 | F5_LANDING | `rec_224730.mp4` | 2:11.70 → 2:13.06 |
| c03 | 0:06.50–0:08.94 | F3_INVERTED | `rec_224730.mp4` | 1:17.47 → 1:19.91 |
| c04 | 0:08.94–0:12.74 | F7_ACCEL_RUN | `rec_225218.mp4` | 0:21.60 → 0:25.40 |
| c07 | 0:25.34–0:30.86 | F2_RAMP_CLIMB | `rec_224730.mp4` | 1:03.60 → 1:09.12 |
| c08 | 0:30.86–0:35.58 | F3_INVERTED | `rec_224730.mp4` | 1:17.50 → 1:22.22 |
| c09 | 0:35.58–0:40.78 | F4_LAUNCH_ROLL | `rec_224730.mp4` | 2:17.95 → 2:23.15 |
| c10 | 0:40.78–0:44.78 | F6_FIVE_VEHICLES | `rec_224911.mp4` | 0:18.60 → 0:22.60 |
| c20 | 2:01.90–2:08.94 | F4_LAUNCH_ROLL | `rec_224730.mp4` | 2:17.95 → 2:24.99 |
| c22 | 2:16.40–2:22.64 | F7_ACCEL_RUN | `rec_225218.mp4` | 0:15.60 → 0:21.84 |
| c26 | 3:02.36–3:06.92 | F1_AIRBORNE | `rec_224730.mp4` | 2:08.25 → 2:12.81 |

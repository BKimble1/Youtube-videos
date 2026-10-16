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

## Short v3 (9:16, owner revision of 16 Oct 2026): clips and shots as rendered

The clip files are Git-ignored and cut with ffmpeg from the recordings above (H.264 CRF 14, 30 fps). The slow-motion
clips are motion-interpolated with ffmpeg `minterpolate`. Each is split at broadcast camera cuts so that no frame blends
two shots.

| Clip (`source/public/footage/`) | Recording | Span | Notes |
|---|---|---|---|
| `v3_hop_side.mp4` | `rec_224911.mp4` | 0:33.80–0:40.00 | side replay of the hop: lift-off, flip, upright on two jets; broadcast cut at 0:38.12–0:38.14 |
| `v3_hop_slow.mp4` | `rec_224911.mp4` | 0:36.20–0:38.12 + 0:38.14–0:39.04 | the same, half speed |
| `v3_hop_front.mp4` | `rec_224911.mp4` | 0:17.80–0:22.40 | front angle then side angle (cut at 0:20.97); real sound |
| `v3_hop_aerial.mp4` | `rec_224911.mp4` | 0:41.00–0:49.00 | aerial replay of the hop |
| `v3_overhead.mp4` | `rec_224730.mp4` | 1:07.00–1:10.20 | top view on the ramp from 1:08.25 (first run) |
| `v3_inverted.mp4` | `rec_224730.mp4` | 1:16.90–1:20.30 | close-up from below, upside down (1:17.47–1:19.90) |
| `v3_ramp_aerial.mp4` | `rec_224730.mp4` | 2:15.80–2:26.80 | aerial, second run: inverted, launch, roll, landing |
| `v3_ramp_side.mp4` | `rec_224730.mp4` | 2:04.50–2:13.50 | side angle, second run (not used in v3) |
| `v3_live.mp4` | `rec_225340.mp4` | 0:45.00–0:48.40 | live 0–60 run, no timer overlay; real launch sound |
| `v3_live_slow.mp4` | `rec_225340.mp4` | 0:46.80–0:48.05 | the launch at 0.4× |
| `v3_accel.mp4`, `v3_stage.mp4` | `rec_225218`, `rec_225050` | | cut for review, not used |

| Shot | Short time | Recording | Source in → out |
|---|---|---|---|
| s01 | 0.00–0.53 | `rec_224911.mp4` | 0:38.30 → 0:38.83 |
| s02 | 0.53–1.80 | `rec_224730.mp4` | 1:08.30 → 1:09.57 |
| s03 | 1.80–3.42 | `rec_224730.mp4` | 1:17.50 → 1:19.12 |
| s04 | 3.42–5.85 | `rec_224730.mp4` | 2:17.12 → 2:19.55 |
| s05 | 5.85–6.70 | `rec_224730.mp4` | 2:22.90 → 2:23.75 |
| s06 | 6.70–8.50 | `rec_224730.mp4` | 1:18.65 → 1:19.82 (0.65×) |
| s07 | 8.50–16.30 | (illustration) | traced from `rec_224911.mp4` 0:38.50 |
| s08 | 16.30–20.40 | `rec_224911.mp4` | 0:36.50 → 0:38.56 (0.5×) |
| s09 | 20.40–23.45 | `rec_224911.mp4` | 0:19.40 → 0:22.45 |
| s10 | 23.45–27.50 | `rec_225340.mp4` | 0:45.60 → 0:46.85, then 0:46.80 → 0:47.92 (0.4×) |
| s11 | 27.50–33.10 | `rec_224911.mp4` | 0:43.40 → 0:49.00 |
| s12 | 33.10–34.45 | `rec_224730.mp4` | 2:20.80 → 2:22.15 |
| s13 | 34.45–36.73 | `rec_224911.mp4` | 0:35.83 → 0:38.12 (runs into s01) |

## Short FINAL v4 (owner's final pass): shots as rendered

New clips (Git-ignored, cut by `tools/render_short_v4.sh`):

- `v4_open.mp4`: `rec_224911` 0:34.45–0:35.76 at 0.84×
- `v4_end_slow.mp4`: `rec_224911` 0:38.14–0:39.22 at 0.37×

Both are motion-interpolated and lie entirely within one camera shot (the dissolve at about 0:34.25 and the camera cut
at 0:38.12–0:38.14 are outside them).

| Shot | Short time | Recording | Source in → out |
|---|---|---|---|
| s01 | 0.00–1.55 | `rec_224911.mp4` | 0:34.45 → 0:35.76 (0.84×) |
| s02 | 1.55–4.10 | `rec_224730.mp4` | 1:17.47 → 1:19.82 (0.92×) |
| s03 | 4.10–10.26 | (illustration) | traced from `rec_224911.mp4` 0:38.50 |
| s04 | 10.26–14.68 | `rec_224911.mp4` | 0:36.50 → 0:38.71 (0.5×) |
| s05 | 14.68–17.96 | `rec_224911.mp4` | 0:19.10 → 0:22.38 |
| s06 | 17.96–22.18 | `rec_225218.mp4` | 0:16.00 → 0:18.56, then 0:21.60 → 0:23.26 (overhead replay) |
| s07 | 22.18–28.16 | `rec_224730.mp4` | 2:17.12 → 2:23.10 (dimmed under the trim beat) |
| s08 | 28.16–31.13 | `rec_224911.mp4` | 0:38.14 → 0:39.22 (0.37×) |

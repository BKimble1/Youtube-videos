# Footage: what the cut needs and how it goes in

## Status (18 Oct 2026)

**Not ingested.** The production environment's network policy refused every host that serves the clips:

- `drive.google.com` and `drive.usercontent.google.com`: the owner's recordings, https://drive.google.com/drive/folders/1Komq_cbLy-rwdQevZRR92Y9zyCtQgILf
- `www.byd.com`: the official MP4
- `www.youtube.com`: the optional moving demonstration

Every refusal was a 403 to CONNECT from the egress proxy. Nothing has been downloaded or watched. Until the clips are
in, the two real-footage windows show a "REAL FOOTAGE PENDING" card, and `tools/render_master.sh` refuses to run.

**Ways in (either one):**

1. Upload the files as assets on a **draft release** in `BKimble1/Youtube-videos`, as was done for the Roadster
   footage. GitHub's API and asset hosts are reachable from the environment.
2. Add `drive.google.com` and `drive.usercontent.google.com` under *Allowed domains* in the environment's network
   settings.

## What the cut uses

| Window | Film time | Source | Must show |
|---|---|---|---|
| Opening | 0:00.0 – ~0:02.9 (cross-fades to the vector car on "suspension", 0:02.5) | BYD ev-tech03.mp4 side profile, planning range 00:08.3–00:11.3 | First frame: car and flat pavement already visible, takeoff imminent; tyre/ground separation within ~1 s; a complete takeoff and landing; car **at rest** at ~0:02.4, where the vector car is laid over it |
| Replay | 1:47.9 – ~1:50.2 (cross-fades on "suspension", 1:49.7) | Same side-profile hop | One complete hop, ending at rest for the match into the cutaway |

The clip plays at its own speed, is never mirrored or re-timed, and is credited on first use ("BYD DEMONSTRATION
VIDEO"). Its playback cadence is to be checked from the frames, and nothing in the narration measures response time
from it. The red graphic border is to be inspected and decided on frames (kept, or excluded by choosing the in-point;
not painted over).

The front-quarter (00:04.0–00:06.9) and rear (00:07.0–00:08.3) angles are reference only. They will be used to
check the vector car's front-view shapes and the side silhouette, not cut into the film.

## Integration steps (once the files are in `footage/source/`)

1. `python3 tools/ingest_footage.py probe`: checksums, duration, fps, resolution → `footage/footage_probe.json`.
2. `python3 tools/ingest_footage.py sheet <file> 7.5 4.5 10`: numbered frame sheets. Pick the in-points so the car
   is at rest at the match frames, and note the takeoff/landing frames for the sound cues.
3. Measure the rear and front wheel centres in the at-rest frame. Set `FOOTAGE.wheelRear`, `wheelFront`, `facing`,
   `opening`, `replay` and `available: true` in `source/src/footage.tsx`. The opening camera `CAM_WIDE` follows from
   the wheel positions (z = wheel spacing / 2,900 mm).
4. Match the vector silhouette (`source/src/car/geom.ts`) and the hop height (`source/src/sim/launch.ts`, `pushF`) to
   the frames, and the thumbnail clearance (`THUMB_CLEAR`) to the airborne frame.
5. `python3 tools/ingest_footage.py cut <file>` → `source/public/footage/byd_ev-tech03.mp4` (constant 30 fps, same
   timing and resolution).
6. Add the real takeoff/landing sound cues, then run `bash tools/render_master.sh`.

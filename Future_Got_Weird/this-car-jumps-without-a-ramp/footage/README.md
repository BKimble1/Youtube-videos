# Footage: provenance, what was used, and its limits

## Source files (not in Git)

Two screen recordings supplied by the channel owner, both 1920×1080, 30 fps, H.264 + AAC. They were uploaded as assets on the
GitHub release **`u9-source-footage`** of `BKimble1/Youtube-videos` and are kept locally in `footage/source/` (Git-ignored).

| Label | File | SHA-256 | Shows |
|---|---|---|---|
| V1 | `Screen.Recording.2026-10-18.012401.mp4` (18.5 s, 19,461,350 bytes) | `0617fe97d42e6a3ac8870371761d8feb6624db9abed249b45d017a6a74050335` | Recording of BYD's EV-Tech page: the side-profile hop, plus other angles |
| V2 | `Screen.Recording.2026-10-18.012652.mp4` (60.9 s, 66,642,576 bytes) | `a1033430cd490bf4b70ffc12ad541d278cbbae509c876aa72c460037b14dcc69` | Recording of BYD's jump film: side jump, pit angles, cornering, drone drive-away |

The recordings are screen captures of a streamed video, so they are 1080p at most, compressed once by the player and again by
the screen recorder. The rights to the underlying BYD material are BYD's; the owner confirms use before upload
(`production/CREDITS.md`). Every real shot is credited on screen ("BYD DEMONSTRATION VIDEO") and in the description.

## Real shots in the cut

All are played at the recording's own frame rate, frame for frame: no re-timing, interpolation, mirroring or loop.
No excerpt is used twice. Frame numbers are recording frames (0-based at 30 fps).

| Film time | Source frames | Cut file | Used for |
|---|---|---|---|
| 0:00.0 – 0:01.9 | V1 273–328 | `real_open` | Opening: the side-profile hop, ending at rest, where the illustrated car takes over |
| 0:08.0 – 0:10.4 | V2 536–570, 575–613 | `real_pit` | "So what does making a supercar jump actually prove?": the front wheel at the lip of the pit, then the high angle |
| 0:42.0 – 0:42.9 | V2 691–718 | `real_corner` | The U9 turning in, as the bend section begins (after the tyre-wall wipe) |
| 1:48.0 – 1:50.3 | V1 262–328 | `real_replay` | "Watch the jump again": the replay opens on BYD's hop, then the illustration takes over |
| 1:53.1 – 1:57.9 | V2 316–458 | `real_jump` | Side view, rolling in to takeoff, flight and landing, **uninterrupted**, with the gravity and motion arrows drawn over it |
| 1:57.9 – 1:59.7 | V2 480–532 | `real_pit` | The low front three-quarter, car clear of the road ("the spectacular part") |
| 2:07.6 – 2:09.3 | V2 1508–1556 | `real_driveA` | "Most of the time…": a steady wide side pass |
| 2:09.3 – 2:14.1 | V2 1557–1700 | `real_driveB` | The drone comes in from the front, over the roof and follows the car away into the dust |

Only footage of the U9 doing what the narration says is used as evidence. The drive shots illustrate "controlled driving", not
any suspension claim, and the narration does not interpret them. Other frames of both recordings (V1's front and rear angles
and the rest of V2) are not used.

## How the cuts are made (`tools/ingest_footage.py`)

- `cut` (V1) and `cut2` (V2): select the frame range, crop to 16:9 inside the picture area, scale to 3840×2160 with Lanczos and
  encode H.264 CRF 12. **The upscale adds no detail**: the real shots are 1080p sources enlarged for the 4K master. The vector
  art, text and graphics are rendered natively at 3840×2160.
- BYD's on-screen numbers, disclaimer and logo sit outside the crops, except in `real_jump` (V2 316–458), where a band across the
  lower picture is removed with ffmpeg `delogo` (x=350 y=772 w=860 h=58); nothing is painted over the car.
- Nothing is mirrored, stabilised or colour-graded.
- `python3 tools/ingest_footage.py cut2 real_driveA real_driveB` re-cuts single files. The cut files live in
  `source/public/footage/` (Git-ignored).

## Alignment of the illustration with the real car

- Opening and replay (V1): the wheel centres were tracked frame by frame (`footage/wheel_track.json`), and the illustrated car is
  laid over the real one with those positions; then the photographic background gives way to the proving ground.
- Side jump (V2): the wheels were placed by hand at recording frame 336 (the nose just lifting), and the illustration's camera
  frames the car exactly there before the dissolve into the real flight. Per-frame tracking of V2 was unreliable (motion blur
  and a panning camera), so the arrows drawn over the real flight are anchored to the illustrated model's centre of mass and
  scale, not to a tracked point.

## Limitations to report

- Source resolution is 1080p screen capture; the 4K master is not native-4K picture for the real shots.
- V2's side jump has no fixed reference, and the camera pans with the car, so the hop height cannot be measured from the frames.
  The illustration's apex clearance (about 0.11 m) is the launch model's, not a measurement of BYD's car.
- The takeoff and landing times in the sound cues come from the frames (takeoff at recording frame 336, touch-down about frame
  415). BYD's own audio is not used.

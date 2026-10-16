# Cut sheet: the Tesla footage the Short needs

## Why this exists

The final Short can't be made from this environment. Its network policy blocks every host that serves Tesla's replay:
`x.com`, `api.x.com`, `twitter.com`, `video.twimg.com`, `www.tesla.com`, `livestream.tesla.com`,
`digitalassets.tesla.com`, `tesla-cdn.thron.com`, YouTube and Vimeo. Every one returned 403 from the egress proxy
(16 Oct 2026, ~02:10 and ~02:50 UTC). Nothing has been downloaded or watched. **No placeholder render may be uploaded.**

## Source

**Tesla's official replay:** the X post "Roadster event livestream", labeled REPLAY:
https://x.com/Tesla/status/2110788059008819215
The live stream started at 7:55 pm CT on Thu 15 Oct 2026 (00:55 UTC on the 16th), from the SpaceX test site in
McGregor, Texas. Use this replay or tesla.com material only. Don't use news-site embeds or third-party re-uploads.

## Where the moments are (estimated, so confirm by scrubbing)

Nobody here has watched the replay. These windows come from timestamped reports:

| Clock (CT) | Evidence | Moment |
|---|---|---|
| ≈ 8:03 pm | SlashGear live blog, 9:03 pm EDT: Elon Musk comes out | **Sync point.** Find this in the replay first |
| ≈ 8:07 pm | Engadget live blog, 9:07 pm EDT: "went up that ramp… stayed inverted for a few seconds and then came back down" | **F2 ramp climb, F3 inverted hang** |
| 8:07–8:10 pm | Engadget: "a few minutes later… went up the ramp again, did a little mid-air twist and then landed smoothly". An X post about the flip and landing is timestamped 8:09:57 pm CT (decoded from its status ID 2110901025330622500) | **F4 launch + roll, F5 landing, F1 airborne** |
| ≈ 8:10–8:19 pm | Engadget recap: "jumping several parked vehicles". Reports list Cybercab, Cybertruck, Semi, Model Y, Model 3 | **F6 five-vehicle hop** (time not pinned down; it falls between the flip and the 0–60 run) |
| ≤ 8:19 pm | Engadget entry at 9:19 pm EDT; a post about "0 to 60 in under 0.81 seconds" is timestamped 8:19:35 pm CT (status 2110903448720093631) | F7 0–60 run (companion only) |

**In replay time:** if the replay begins at the 7:55 pm stream start, look at about **0:11–0:16** for the ramp, hang,
launch, roll and landing; **0:14–0:24** for the vehicle hop; and **0:22–0:25** for the 0–60 run. If the replay has a
pre-show, shift every window by the offset of Musk's entrance from 0:08.

## What to cut (Short)

Each slot needs a single continuous official clip. "In" is the frame the Short starts the shot on. Keep the handles
before and after it, so crops and the loop can be adjusted without re-cutting.

| Slot | What must be on screen | Needed before `in` | Needed after `in` | Used in the Short |
|---|---|---|---|---|
| **F1_AIRBORNE** | The car **clearly in the air**, biggest and sharpest angle, readable at phone size. Pick `in` on a frame where it's already airborne | **≥ 3.6 s** (the last 3.4 s of the Short plays the lead-up, so it loops into frame 0) | ≥ 2.4 s | 0:00.0–0:02.4 and 0:38.7–0:42.1 |
| **F2_RAMP_CLIMB** | Driving up the C-shaped ramp toward the inverted section | ≥ 0.5 s | ≥ 2.0 s | 0:02.4–0:04.4 |
| **F3_INVERTED** | Stopped **upside down** on the ramp, ideally with the underside/floor visible | ≥ 0.5 s | ≥ 2.1 s | 0:04.4–0:05.8 and 0:09.95–0:10.6 (from +1.4 s) |
| **F4_LAUNCH_ROLL** | Second run: leaves the ramp and **rolls upright** in midair | ≥ 0.6 s | ≥ 2.9 s | 0:05.8–0:08.7 |
| **F5_LANDING** | **Touchdown** on the pavement after the roll | ≥ 0.5 s | ≥ 2.0 s | 0:08.7–0:09.95 and 0:36.9–0:38.7 (from +0.2 s) |
| **F6_FIVE_VEHICLES** | The hop over the parked vehicles, with **all five visible** (Cybercab, Cybertruck, Semi, Model Y, Model 3) | ≥ 0.5 s | ≥ 4.2 s | 0:17.65–0:21.9 |

If F6 doesn't clearly show five vehicles, say so. The Short then switches to the recorded fallback line "It even
cleared a row of Teslas — a Semi included" (`audio/short/takes/pickup_rowofteslas_t1_BfOG.mp3`) and the count is
dropped.

Longer handles help the paused companion: F1 5 s, F2 5.8 s, F3 5 s and F4 7.3 s after `in`, plus F7 (0–60 run,
≥ 4 s) and F8 (door opens, Optimus seated, ≥ 8.5 s).

## How to hand it over (either option works)

**A. The replay file (preferred).** Upload the official replay MP4 at the highest available resolution. A segment
covering the whole stunt section is also fine: from Musk's entrance to the end of the 0–60 run, roughly 0:07–0:26.
I'll find the frames by sampling the video at 4 fps and inspecting contact sheets. I'll then cut with
`tools/ingest_footage.py --replay <file> --cuts cuts.json` and record the exact in and out timecodes in
`footage/CLIP_LEDGER.md`.

**B. Six trimmed clips.** Name them `F1_AIRBORNE.mp4`, `F2_RAMP_CLIMB.mp4`, `F3_INVERTED.mp4`,
`F4_LAUNCH_ROLL.mp4`, `F5_LANDING.mp4` and `F6_FIVE_VEHICLES.mp4`. Each should start the "before" handle ahead of
its `in` frame. For each clip, also send its replay start time, so the ledger can record the original timecode. I'll
ingest them with `tools/ingest_footage.py --clips <dir>`.

Upload into this Claude session, or commit to `raw/tesla-roadster-flew/` on branch `claude/new-session-yl4z8q`
(MP4 goes through Git LFS; GitHub's browser upload is capped at 25 MB).

## What happens next

1. Ingest. Each slot gets a 4 fps frame sheet in `qa/footage/`, and I check that each clip shows what the narration
   says (hang, roll, landing, five vehicles).
2. Set each slot's 9:16 crop (`cx`, `cy`, `zoom`) so the car stays large in frame.
3. `tools/render_short.sh` renders **FINAL** only when all six slots pass `tools/check_footage.py`.
4. Inspect the actual render: a dense frame sheet, every cut, loop continuity (last frame → frame 0), captions against
   the picture, −14 LUFS / −1.5 dBTP, and no black frames.
5. You upload. YouTube's copyright/Content ID check appears in Studio during upload. It can't be observed from here.

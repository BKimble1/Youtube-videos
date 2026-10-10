# Runway generation log (Video 02)

Cap for this packet: 500 credits, at most two paid attempts per shot. Spent so far: **60 credits** (measured from the balance before and after each job).

| shot | try | model | requested | measured | cost | status | reason |
|---|---|---|---|---|---|---|---|
| R3 | 1 | kling-3-pro | 16:9 1080p 5.0 s | – | 60 | rejected | not used: generated (1920x1080, 5.04 s per Runway metadata) but the session's network policy blocks Runway's output host, so it could not be downloaded or inspected; the Remotion shot is in the film. Retrievable from the owner's Runway library. |

Prompts, input frames (with SHA-256), task IDs and raw outputs for every attempt are in `runway/runway_log.json`. Generated clips are source quality as measured above; any upscale in the 4K master is an upscale, not native 4K generation.

## v2 editorial pass (9-10 October 2026)

No jobs were run. The brief allowed at most a few targeted inserts within the remaining authorization (440 of the 500
credits; this pass did not reset the budget). Before any paid job the output hosts were rechecked from this environment:
`dnznrvs05pmza.cloudfront.net` and `d2jqrm6oza8nb6.cloudfront.net` still fail with a proxy 403 (CONNECT tunnel refused).
A clip that cannot be downloaded cannot be inspected, and the brief accepts only inspected inserts, so every candidate
beat (the opening hide and reaction, the warehouse approach, the closing callback) plays as its reviewed Remotion rig
shot. **v2 spend: 0 credits; total for Video 02: 60 credits.** No purchases, auto-refill or plan changes.

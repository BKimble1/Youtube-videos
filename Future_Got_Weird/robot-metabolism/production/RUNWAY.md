# Runway: planned plates and why none are in V1

**Status: not integrated.** No Runway media appears in any V1 export, and no Runway credits were spent on this episode.

## What was checked (28 Oct 2026)

- The Runway connector is authenticated (`whoami`): personal workspace, 497 credits, image and video models available.
- Before generating anything, download was tested on media that already existed in the workspace (`list_recent`,
  zero cost): a finished image on `dnznrvs05pmza.cloudfront.net` and a preview on `dnf8butk8bbsy.cloudfront.net`.
  Both returned **HTTP 403 at this environment's egress proxy** (`CONNECT tunnel failed`). This is the same block that
  stopped Glass Climbing V8 and Robot Faces.
- Generating plates that cannot be retrieved would only spend credits. A relay of Runway output through another service's
  storage was not used: it would route around the network policy, and a previous session's safety check refused it.

## To integrate later

1. Allow `dnznrvs05pmza.cloudfront.net` and `dnf8butk8bbsy.cloudfront.net` in the environment's network settings
   (Network access, Allowed domains): https://code.claude.com/docs/en/cloud-environments#network-access
2. Generate one candidate per plate below (image first, then a locked-camera image-to-video pass if motion helps),
   inspect, and retry a defective plate once.
3. Each station's backdrop is drawn behind everything else in its view (layer 0 in `source/src/world/*Art*`), so a
   plate can replace the wall/shelf art in a slot without touching the robots, contacts, shadows or captions.

## Planned slots and briefs

| Plate | Slot (V1 times) | What it would add | Brief |
| --- | --- | --- | --- |
| A, main lab bench | 0.00 to 7.84 s and 9.52 to 14.95 s (the bench views) | Painted depth behind the bench: shelving, equipment, soft task-light | "Vertical clean 2D vector scene with consistent dark outlines, muted teal laboratory depth, a cool neutral work surface and warm task-light accents. Clear empty foreground bench area reserved for separately composited robot animation. Locked camera, stable straight bench edges and equipment silhouettes, subtle distant environmental motion." |
| B, inclined locomotion station | 14.95 to 17.09 s | The test room behind the ramp | "Same 2D illustrated lab style and lighting. Low three-quarter view of an inclined test ramp with a clear stable slope, fixed understated distance markers and unobstructed space for separately animated machinery. Locked framing, stable ramp geometry, subtle ambient motion only in the distant background." The ramp surface, marks and contacts stay vector (they must agree with the robots). |
| C, module station | 17.09 to 25.70 s | The recovery area behind the tray | "Same illustrated lab reference and palette. A shallow low-profile parts tray near a clean bench surface, quiet equipment depth in the background, empty central action area, stable perspective, locked camera, gentle distant atmosphere." The tray, the broken robot and every module stay vector. |

Reference keyframes for the briefs are the clean film frames at 1.0 s, 16.0 s and 22.0 s
(`exports/FGW_Robot_Metabolism_V1_CLEAN_1080x1920.mp4`).

# Transparent Mouse Skin V1: Runway (unmet requirement)

**Status: no Runway generation was run, and no Runway media is in the film.** This is an unmet requirement of the
brief, recorded here with its cause.

## What was checked (28 Oct 2026)

- `whoami` authenticated the Blake Kimble personal workspace (497 credits). The video models the plates would use
  (Seedance 2, Gen-4.5, Kling) are available, and no deprecations are listed.
- This environment cannot reach Runway's media hosts. `dnznrvs05pmza.cloudfront.net` (finished generations) and
  `d2jqrm6oza8nb6.cloudfront.net` (uploaded assets) both failed to connect from the container. This is the same
  block recorded in `../invisibility-shield/production/v4/RUNWAY_MANIFEST.md`, where three paid generations could
  not be downloaded, and in `../robot-faces/production/SOURCE_NOTES.md`.

## Decision

The brief says not to treat a completed generation as integrated footage, and not to regenerate to solve a transfer
problem. Generating the three plates would have spent credits on clips that could not be downloaded, inspected or
composited. So nothing was generated, and no credits were spent.

## What stands in, and how to replace it

The scenery is controlled vector art: one coherent top-down lab bench (`source/src/art/Bench.tsx`). It has a slate
bench, a quilted absorbent pad, a dish of the yellow-orange solution, cotton swabs, a warm task light from the upper
left, and a pad wet-stain layer for the rinse. Every view of the mouse uses it, so the set, light and palette stay
the same throughout.

Replacement slots, if the hosts are allowed:

| Slot | Brief plate | Used (s) | Camera ownership | Replace |
|---|---|---|---|---|
| RW-A result bench | Plate A | 0.00–7.00, and the background of 9.83–20.45 | Remotion camera (push 1.10 → 2.06, roll −4.5°). The plate must be **locked** and at least 1.3× frame size in world units. | the `<Bench>` call in `Film.tsx`, as an `<Img>`/`<OffthreadVideo>` layer under the mouse in the same world group |
| RW-B application station | Plate B | 7.00–9.83 | same framing as the end of S1 (matched cut) | same slot. Top-down and matched to Plate A, or the matched cut breaks. |
| RW-C rinse station | Plate C | 20.45–25.07 | push and pull 1.9 → 1.18 | same slot. The pad wet stain must stay drawn by `Bench` (it is the run-off). |

The planned prompts are the brief's Plate A/B/C text, with "top-down" added and the existing frame as the start
frame. They would be rendered from `FilmStill` with the mouse hidden.

To enable: add `dnznrvs05pmza.cloudfront.net` and `d2jqrm6oza8nb6.cloudfront.net` under Allowed domains in the
environment's network settings (https://code.claude.com/docs/en/cloud-environments#network-access).

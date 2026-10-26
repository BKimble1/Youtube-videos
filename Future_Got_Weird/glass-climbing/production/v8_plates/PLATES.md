# V8 scenery plates (Runway)

## What was generated

Two image generations in the connected Runway workspace, on 26 Oct 2026, using model nano-banana-pro (9:16, 2K).
Each cost 20 credits; the balance afterwards was 497.

| Plate | Runway task | Composition reference (uploaded) | Style reference (uploaded) |
| --- | --- | --- | --- |
| A: facade hero (opening, ending) | `1b62be8f-2367-4bbd-864b-2d5e5aef0f9f` | `refA_composition_1080x1920.png` | `ref_style_bay_1080x1920.png` |
| B: downward street (height reveal) | `cd51a240-dad1-4c84-9ac1-905671badb11` | `refB_composition_1080x1920.png` | `ref_style_bay_1080x1920.png` |

The references are clean renders of the film's own vector scene, with no climber, gear or captions.
- `refA_composition_1080x1920.png` uses the hero camera: eye (1.7, 32.7, 2.7) m, target (0.4, 31.2, -1.5) m, f 1300.
- `refB_composition_1080x1920.png` uses the reveal camera: eye (1.4, 31.4, 2.2) m, target (0.45, 27.0, -1.6) m, f 950.
- `ref_style_bay_1080x1920.png` is the bay facade drawing (`BayStyle8`).

The references were rendered with `PlateRef8` and `BayStyle8` in `source/src/v8/Work8.tsx`. None of the low-resolution
review files was used as a reference.

## Status: generated, not integrated

This session's network policy denies the host that Runway serves generated images from, `dnznrvs05pmza.cloudfront.net`
(HTTP 403 at the proxy). The plates could not be downloaded, inspected or composited.

The V8 renders therefore use the native vector tower (`v8/Tower8.tsx`) in every exterior shot. That is the same scene the
plates were drawn over, with the V8 changes:
- linear ceiling fixtures instead of the white ovals;
- the brick strip beside his bay placed to match the 2D drawing.

**No Runway plate appears in the V8 exports.**

## How to integrate once the plates are reachable

1. Allow the host `dnznrvs05pmza.cloudfront.net` for this environment, or download the two images from the Runway
   workspace's recent assets.
2. Save them as `source/public/plates/plateA.png` and `source/public/plates/plateB.png`.
3. Inspect them against the references:
   - Overlay the reference's edges (the check script used for this is in the V8 session).
   - Reject a plate whose facade lines, floor lines or brick strip are not where the reference has them. The climber's
     pads are composited onto the reference's glass plane.
   - Simplify or paint out any malformed distant people or cars.
4. Pass them to `Exterior8` as `plate={{src: 'plates/plateA.png', cam: <the reference camera above>, w, h}}`.
   - `plateXform` registers a plate to any shot camera with the same eye: a change of focal length is an exact scale,
     and a small re-aim is a shift.
   - The climber, his pads and straps stay code-drawn on top.
5. Re-render the shots that use them: H1, E1 and F1 for plate A, and H4 for plate B.

## Prompts used

**A (facade hero)**, with `@layout` = refA and `@style` = the bay drawing:

> Redraw @layout as a finished environment plate, keeping its exact composition: the same camera angle and
> perspective, and every building edge, mullion line, floor line, terracotta brick strip, street, kerb and the sky in
> exactly the same place in the frame. Match the palette, flat fills, single clean ink linework and daylight of
> @style. An unoccupied modern glass office tower occupies the left and center of the frame in a steep three-quarter
> view, with a narrow street far below visible toward the right. Recessed pale metal mullions divide blue glass
> panels; the adjacent terracotta brick strip remains clearly separated from the glass. The glazing has restrained sky
> reflections and subtle interior depth (no repeating white oval lights). All facade lines follow coherent
> architectural perspective. The street has a believable curb, small cars, lane markings and sidewalks consistent
> with the elevated viewpoint. Keep a clean, high-contrast mid-left glass area uncluttered for a separately composited
> character. Crisp 2D editorial illustration with restrained layered depth. No people on the building, no climber, no
> text, no logos.

**B (downward street)**, with `@layout` = refB and `@style` = the bay drawing:

> Redraw @layout as a finished environment plate, keeping its exact composition: the same downward camera angle and
> perspective, and every building edge, mullion line, floor line, terracotta brick strip, street, kerb, crosswalk and
> the neighbouring buildings in exactly the same place in the frame. Match the palette, flat fills, single clean ink
> linework and daylight of @style. A complementary downward-looking view of the same glass-and-terracotta building:
> matching window spacing, materials, light direction and palette. The near facade anchors the left edge, and the
> street recedes far beneath the camera to the right. Include a few small cars, a clear curb and sidewalk, and a tiny
> gathering of onlookers at ground level at the foot of the tower, drawn simply and cleanly. Use perspective and scale
> to make the height legible. Keep the near glass area uncluttered for separately animated foreground elements. Crisp
> 2D linework, restrained shading, coherent geometry, clear visual hierarchy, no repeating white oval lights. No
> climber, no person on the building, no text, no logos.

**Optional image-to-video, background atmosphere only. Not run.** Run it only after a still plate has been approved.

> The locked-off camera holds the supplied composition. The tower and its architectural edges remain rigid and
> stable. Distant clouds drift slowly and two small cars move along the street far below. Near glass reflections
> change only subtly. Continuous seamless shot with restrained environmental motion.

**Note on the reference cameras.** The V8 hero camera was adjusted after the references were made. It is now eye
(1.6, 33.3, 2.4), target (0.22, 31.2, -1.6), f 1500, so that he reads larger and the drop stays in frame. To use plate A
as is, a shot must use refA's eye, or a new reference must be rendered at the final eye and the plate regenerated.

# Glass Climbing V4: shots, cameras and the climber's rig

Frames at 30 fps (1162 frames, 38.73 s). Narration: V1's approved take, word for word and sample for sample (as V2
and V3). Shot code: `source/src/v4/shots4.tsx` (`SHOTS4`, cameras in `CAMS4`); the climber and gear:
`source/src/v4/climb4.ts` (`CYCLES`, `C`); drawing order: `source/src/v4/Bay4.tsx`. The building, the press and
boundary sections, the micro views and the springs are V3's art.

## The rig (what is constrained, and the layer order)

- **Pads.** Two pads, the far (right) hand always on the upper one, the near (left) hand on the lower one. A seated pad
  never moves; a pad comes off the glass only in a shown release (peel from its lower edge), is carried just off the
  glass, and is seated by a short slide down onto it. The two pads sit on the receding glass a little apart (the
  near hand's pad screen-right of the far one), the same side as the foot each one carries.
- **Straps and loops.** Each pad's strap runs from the D-ring at its lower edge nearly straight down the glass to a
  loop at the foot on the same side; the far pad's strap is longer by the pads' spacing, so with the pads one above
  the other the loops hang level. Ring order matches foot order, so the straps never cross. A loop's top sits over
  the forefoot; its two strands go down either side of the shoe to a bar under the arch.
- **Hands** are placed on their bars by IK every frame, fingers in front of the bar and palm behind it.
- **Feet.** A planted foot stands on its loop's bar at the strap's taut length (no sliding: the probe measures a
  planted foot's movement at 0.11 units at most). An unweighted foot rises a little in its loop and is carried with
  the loop when its pad moves; no foot is ever farther from its ring than its strap; no leg is stretched. When a foot
  comes high, its knee turns out (the thigh foreshortens) instead of pushing forward into the straps.
- **Hips** come from the supports: the stool board, one loop or both, at heights set by the legs' lengths. The head's
  angle is set directly (upright, a few degrees down or up when he looks), never as a side effect of the torso.
- **Layer order, every shot, back to front:** facade and stool; the far pad, its strap, the back strand of its loop;
  the far leg; the front strand and bar of the far loop; the near strap and the back strand of its loop; the far arm,
  the body, the near leg; the front strand and bar of the near loop; the near arm; the near pad; both hands round
  their bars. The near strap passes in front of the far leg (it hangs nearer the camera); nothing passes through a leg.

## The climb cycle (match style)

Shift (weight onto the near loop: the far strap goes slack) → the far pad peels, is carried up 170 units (27 cm) and
seated, the far foot coming up in its loop → he rises onto the far loop, part of the way (the near hand must still
reach the lower pad) → the near pad peels, is carried up and seated just below the far one, the near foot coming up
in its loop → he settles onto both loops, level again. On screen: the first far-pad move and rise (120-176), a
near-pad move with him standing in the far loop alone (492-536), the full shift, far-pad move and rise (690-880).
Between those he keeps climbing behind the micro views and the springs.

## Shots (25)

| Shot | Frames | Narration | Camera (one move at most) | What happens |
|---|---|---|---|---|
| A1 | 0-30 | "If you pressed these pads" | slow push in | his hands on both bars; the near pad pressed home onto the glass (continued from the last frame) |
| A2 | 30-72 | "against a glass wall," | slow push in | the pad on the glass in section: the soft layer compresses and darkens, the plate shears down a hair |
| A3 | 72-122 | "you could lift your feet off the ground—" | held | low, on the legs, loops and stool: the near foot steps into its loop and takes his weight (the strap goes taut), the far foot follows; both clear the board, which stays |
| A4 | 122-176 | "and climb it like Spider-Man." | held, then one tilt up with him | the whole of him: weight onto the near loop, the far pad peels, goes up and is seated, he rises onto it |
| M1 | 176-216 | "Their surfaces are covered" | one push into a tile, arriving at rest | reverse angle through the glass: the pad's tiles darken as it takes his weight |
| M23 | 216-307 | "in microscopic wedges. As you pull downward," | one slow move round and down | the ridges stand up into wedges; the glass meets their tips; they start to bend |
| M4 | 307-343 | "the wedges bend flat" | slight drift | side-on, three wedges bend and lie down |
| M5 | 343-382 | "against the glass." | one pull out | the whole array flat on the glass |
| M6 | 382-423 | "This brings them so close" | one push in (accelerating) | in to one strip; the last hairline of air closes |
| M7 | 423-470 | "that tiny molecular attractions" | the push continues at the same speed, easing out | scale bridge (dissolve at the same place) to the molecules |
| M89 | 470-535 | "can hold your entire weight." | one continuous pull out across all the scales | back out through the strip, the array, the pad, to him standing in the far loop alone while the near pad moves up |
| SP1 | 535-566 | "Special springs" | slow push | the back cover lifts away |
| SP2 | 566-598 | "spread the load," | held | the pull comes on through the handle; each spring takes its share |
| SP3 | 598-630 | "so one little patch" | held | one spring alone would stretch far |
| SP4 | 630-660 | "doesn't have to hold you up" | held | one tile loses contact; its neighbours take up its share |
| SP5 | 660-680 | "alone." | one pull back | the whole pad; the cover returns |
| C1 | 680-724 | "Then, you shift your weight" | held | the whole of him: he settles onto the near loop |
| C2 | 724-768 | "onto the other pad." | held | low on the loops: the near strap taut, the far strap slack |
| C3 | 768-842 | "The first releases, letting you reach higher" | held for the release, then one track up with the pad | the upper pad peels (the lower pad and hand stay put), is carried up and seated higher |
| C4 | 842-904 | "and repeat. But there's a catch." | held for the rise, then one move down the wall with his look | he rises onto the far loop; he looks down to where the glass meets the brick |
| K2 | 904-945 | "They need a smooth surface" | one slide down | the foot of the wall in section: smooth glass, the channel, broken brick |
| K3 | 945-1018 | "to grip. So you can climb glass—" | held, then a small follow down | on the stool: the near pad comes off the glass and goes down onto the brick as he bends his knees (one smooth squat, head steady) |
| K5 | 1018-1063 | "but switch to rough brick," | one push in | A2's view on brick: the layer rides on the peaks, cannot reach the pits; under a test pull it seems to hold |
| K6 | 1063-1107 | "and those microscopic wedges" | slight pull | glass and brick side by side at the wedge scale; on brick the few tips skid |
| K7 | 1107-1162 | "can't make the same contact." | held for the failure, then one move to frame 0's framing | he pulls; the pad skids, tips and tears off; he lifts it back to the glass and presses it on: frame 0 |

## Transitions

- **Match cuts:** A1 → A2 (the pad, into its section), M1 → M23 (the tile's ridges at the same spacing and tint, both
  at rest), A2 / K5 (the same section view on glass, then on brick), M6 → M7 (a push that carries on at the same zoom
  speed across the scale bridge).
- **Cut-ins that add information:** A3 → A4 (legs and loops, then the whole climber), C1 → C2 (the whole of him, then
  which loop carries him), SP2 → SP3 → SP4 (each closer view shows a new idea).
- **Moves with a motive:** every move follows something: the climber rising (A4), the pad going up (C3), his look down
  the wall (C4), the pad going down to the brick (K3), the pad going back up to the glass (K7).
- **Loop:** K7 ends on frame 0's framing at rest and A1 starts from it at rest; the climb state at frame 1162 equals
  frame 0 in every value.

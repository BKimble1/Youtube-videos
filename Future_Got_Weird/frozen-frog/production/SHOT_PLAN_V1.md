# Frozen Frog V1: shot plan and transition list

The narration (`NARRATION_LOCKED.txt`) is take 2, used sample for sample. Its measured word times drive every beat
(`source/src/data/timeline.json` → `source/src/story.ts`). Film: 24.5 s, 735 frames.

## Shots, keyed to the words

| Time (s) | Words | Picture |
|---|---|---|
| 0.00–0.30 | "If you" | ECU of a living wood frog on frosted leaf litter. Its heart beats in a small chest cutaway, its throat pumps, and frost is already at the frame's edges. |
| 0.30–0.89 | "freeze this frog" | Frost races over the skin from the ground up, the skin pales, the lens clouds and breathing stops. The camera pushes into the chest. The heart makes its final beat (0.89). |
| 0.89–2.00 | "its HEART" | The heart is still and the beat sound is gone. Ice crystals grow into the pericardial space and the window widens. |
| 2.00–3.15 | "completely STOPS!" | Close on the frozen heart, pale and glazed, held in ice. |
| 3.15–4.50 | "Ice spreads through its body," | The cutaway widens over the trunk as a layered cross-section (spine, back muscle, lungs, heart, liver, gall bladder, gut, belly wall). Faceted ice spreads through the spaces between the organs, from the head end back. |
| 4.50–6.20 | "it stops breathing," | The lungs sag. The camera dives into the back muscle beside the belly vein and the cells open up in a soft circle. |
| 6.20–8.50 | "and it looks completely dead." | A muscle cross-section with a capillary. Ice plates grow only between the cells. Blue water beads leave the cells, the cells shrink, and one beside the capillary buckles. |
| 8.50–9.30 | "But its liver" | Pull back out to the trunk cross-section, framed on the liver. |
| 9.20–10.45 | "releases massive amounts of sugar," | The liver warms to amber and glucose rings leave its surface and run along the vein toward the back muscle. |
| 10.45–11.25 | (sugar) "protecting" | The camera follows the rings down the vein into the tissue: one continuous move. |
| 11.25–12.70 | "its cells" | Rings ride the capillary, leave it, cross the space and pass through transporters into the cells. The buckled cell rounds out and holds its size. |
| 12.05–13.85 | "while the rest of its body freezes!" | The ice thickens. Needles grow toward the protected cell and stop at its membrane. Inside, the rings keep drifting (liquid); outside, the ice is rigid. |
| 13.85–15.00 | "It can survive" | Out through the body: the cells, then the trunk. The cutaway closes and leaves settle on its back. The frog sits frozen in an air pocket under leaves and a snowpack, drawn as a clean cross-section. |
| 15.00–16.40 | "like this for weeks!" | Snow falls and deepens and a night passes. The frog does not move. |
| 16.45–18.35 | "And when spring arrives, the ice melts," | Warm light, then the snowpack melts away with drips. The frost on the frog turns to beads, the skin regains its colour and the eye clears. Shoots come up nearby. The camera pushes to the chest. |
| 18.35–20.10 | "its heart starts beating again…" | Into the chest as the pericardial ice melts. One twitch (19.20), another (19.62), then the first full beat (20.05), emphasised. The heart reddens. |
| 20.10–20.75 | (again) "And it" | Back out through the chest to the face as the cutaway closes. A blink (20.42) and the throat pumps again. |
| 20.80–22.15 | "just HOPS AWAY" | A crouch, take-off on "HOPS" (21.08), flight and landing (21.62). The leaves slide off its back. The camera follows. |
| 22.15–24.50 | "like nothing happened!" | The landing settles into the opening's exact framing, one jump-length over. The cutaway reopens on the same heartbeat and the cold creeps back in at the edges, so frame 0 follows. |

## Transition list

Each entry gives the outgoing subject → incoming subject → new information → decision.

1. Frog ECU → the heart through the cutaway → the heart stops as the frog freezes → **keep** (a continuous push).
2. Frozen heart → trunk cross-section → the ice spreads through the whole body → **keep** (the window widens locally; no cut).
3. Trunk → back-muscle cells → ice forms between cells, not in them → **keep** (a dive through a soft reveal).
4. Cells → trunk, framed on the liver → where the sugar comes from → **keep**. This is not a detour: the liver is new information, and the second visit to the cells is a different place (the capillary edge) with a different event (protection).
5. Liver and vein → cells beside the capillary → the sugar's path into the cells → **keep** (the camera follows the rings down the vein: one move).
6. Cells → winter exterior → survival over weeks → **keep** (one continuous pull-out; the cutaway closes on the way).
7. Winter → spring → **merged** into one push toward the chest, with no cut.
8. Spring exterior → the heart → the restart → **keep**.
9. Heart → face → the frog is alive (eyes, throat) → **keep**. The brief asks for this exit.
10. Face → the hop → the landing in the opening framing → **keep**. One follow move into the loop.

Removed in planning: a separate liver close-up at cell scale, because it would repeat the cell view with different
particles. The sugar's origin is shown at organ scale instead.

## The loop

Every forest layer repeats with the hop's length (128 mm), and the frog lands exactly one length over. The camera
ends on the opening framing shifted by that length, so the last frame and frame 0 show the same picture. The heartbeat
schedule is anchored to the loop point, so beats fall at 24.055 s and at 0.0 s.

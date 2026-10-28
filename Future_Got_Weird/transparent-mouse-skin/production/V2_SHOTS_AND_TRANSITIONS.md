# V2: hook and retention rebuild — shots and transitions

Same locked 72-word narration, same accepted narrator take (sample for sample), same story, same length (25.067 s,
752 frames at 30 fps). Every beat is derived from the measured words (`source/src/v2/beatsV2.ts`, exported to
`audio/beats_v2.json` for the mix). Times below are seconds in the film.

Source: `source/src/v2/` (`FilmV2.tsx` film, `MouseV2.tsx` mouse with a growing clear window, `Stage.tsx` restrained
2.5D planes, `Micro.tsx` tissue journey, `Props.tsx` food colouring and dish, `CaptionsV2.tsx`). Composition
`MouseSkinV2`; V1 (`MouseSkin`) is untouched and still renders.

| Time | Words | Shot | What develops |
|---|---|---|---|
| 0.00–2.73 | "They made a living mouse's skin transparent." | **Hook.** Tight top-down on the shaved abdomen, z 2.85→3.12 smooth push with a slight roll | Frame 0 already shows a strip of moving intestine through intact skin at the bottom of the patch, the gloved swab mid-stroke on its edge. The swab sweeps back and forth up the patch (six diagonal rows); the clear window grows behind it (0.5 s ≈ a third of the patch, 1.0 s ≈ half), wet solution leading it. By 2.3 s the whole patch is clear; the swab lifts away. |
| 2.73–3.78 | "And watched its organs" | **Low three-quarter** (tilt 46°) | The camera tilts down to the side: true parallax between the intact skin surface and the organs beneath (anatomy plane sits below the skin plane). A specular sweep crosses the skin to show it is a surface, not a hole. Far bench falls into a depth haze. |
| 3.78–5.13 | "moving underneath." | **Closer** (z 2.6→4.5, tilt 47→20) | Constant-rate push in on the loops moving (peristalsis), through the skin's pores and stubble. |
| 5.13 | "Without making a single cut." | **Cut to outside** | The planned cut (the only hard cut). Whole mouse on the pad, belly window clear, no incision. |
| 5.13–6.76 | | Outside, descending push-in | Low angle (tilt 32°) leaning in and over the belly (tilt 12°, z 1.02→1.42); a light sweep crosses the body. |
| 6.76–7.52 | "They'd rubbed a" | **Wipe back in time** | The gloved hand with a swab sweeps across the frame; behind it the earlier scene (ordinary opaque skin, clear dish) follows it in. The camera continues over to the dish. |
| 7.42–8.47 | "food-dye solution" | **Food colouring → dish** | A generic yellow food-colouring squeeze bottle (cupcake-and-drop label, no text, no brand) squeezes a drop into the dish of water (drop at 7.66, lands 7.99 with ripples); the yellow blooms through the dish; the swab dips in. |
| 8.47–9.28 | "onto its skin." | Camera follows the loaded swab to the belly | Contact at 8.87; the solution spreads along the stroke on still-opaque skin. |
| 9.28–10.08 | | **Dive into the skin** | Constant-rate zoom (z 2.35→9, tilt 22→40) into the wet, spreading solution; cross-dissolve into the tissue. |
| 10.08–11.49 | "You see, water and fat" | **Inside the tissue** | Full-frame world of water spaces and lipid-rich cells in three parallax layers, all drifting; red light enters at the surface; the water and then the fat pulse as they are named. |
| 11.49–13.64 | "normally bend light differently, scattering it" | Camera travels down with the light | Rays refract at every cell boundary (Snell's law), Fresnel side branches scatter; photon pulses run along them. The camera descends and sways with the rays. |
| 13.64–15.30 | "and hiding what's underneath." | Opening out wide, then deep | The scattered glow veils the organ wall below; visibility lost. |
| 15.30–17.06 | "But the dye changes how the watery parts" | Dye flows in | Orange dye particles stream into the water spaces only (never into the lipid cells), the water tints red-orange. |
| 17.06–19.30 | "bend light, making them behave more like the fat." | Rays straighten, image clears | The water's index rises to match the fat; membranes fade, scattering stops, rays run straight; the organ wall (peristalsis) clears below. |
| 19.30–20.34 | (end of "fat") | **Pull out** | Micro dissolves into the organs seen from very close (z 11), one continuous pull-out to the wash framing, red-orange cast kept. |
| 20.34–21.72 | "Then they washed the dye away..." | **Rinse** | Wash bottle; water sheet runs down the window carrying the dye, beads left behind, faint orange runoff soaks into the pad. |
| 21.74–23.78 | "and the skin hid the moving organs again." | Pull out to whole mouse | Organs fade while the skin surface stays intact; the mouse looks normal. |
| 24.38–25.07 | | **Loop reframe** | Camera pushes back in to the hook framing; the swab comes in and the next sweep has just begun, so the last frame runs into frame 0 (motion-scan seam difference 8.4 against a 5.4 median frame difference; no freeze, no fade, no end card). |

## Rules followed

- One hard cut (5.13 s). All other changes are motivated camera moves (following the swab, the hand, the light) or
  dissolves through matching content. No whip pans: the motion scan has no spike except the planned cut.
- No static shot: the longest low-motion stretch is 0.86 s (inside the tissue, while the dye flows).
- No circular call-outs, floating labels, textbook diagrams, AI badges or chips (V1's callout circle and its
  EARLIER/TIME-LAPSE chips are gone; the wipe and the visible method carry the time jump instead).
- No subscribe, like or comment request anywhere.

## Simplifications to know

- The hook compresses time: the real clearing takes minutes; here it follows the swab within two seconds.
- The refractive indices inside the tissue are illustrative (water 1.33 → 1.60, lipid 1.62), as in V1.
- Bench, props and mouse are vector stand-ins; the planned Runway plates are still blocked (`RUNWAY_NOTES.md`).

# V3: last salvage pass — the mouse visuals replaced

Same locked 72-word narration, same ElevenLabs take (sample for sample), same mix (`audio/mix_v2/`, unchanged: its
effect timings are kept and the V3 picture is cut to them), same 25.067 s / 752 frames. Captions are the channel
treatment, placed for V3's shots (`source/src/v3/FilmV3.tsx`).

## What replaced the mouse, and why this approach

The V1/V2 illustrated mouse is gone entirely: no vector mouse, no full-body animal, no window graphic.

- **Real footage or licensed stills could not be used.** This container can reach only package registries. Wikimedia
  Commons, bioRxiv, science.org, Openverse and the stock-footage sites, and Runway's media hosts, all refused
  connections (checked 28 Oct 2026). No reference photographs could be viewed either.
- **So every image is physically rendered** in Blender Cycles (the `bpy` package, CPU, path traced): subsurface
  scattering in skin and organs, transmission and refraction in the cleared skin, glass and water, hair curves for fur,
  stubble and cotton fibres, volumetric scattering in the tissue. Plates are composited in Python in scene-linear light.
- **No full-body mouse.** The brief allows illustration only if one anatomically convincing pose can be held, and
  otherwise asks for tight skin close-ups, a lab demonstration and grounded cutaways. Without reference material a
  modelled whole mouse (face, ears, paws, fur grooming) was judged too likely to land in the uncanny zone the brief
  rejects, so none was attempted. The animal is shown as its abdominal skin: a curved, shaved belly with natural white
  fur at the shave edge, stubble, follicles and fine creases, breathing.
- **A modelled gloved hand was tried for the lab and rejected** (metaball fingers read as blue tubes). Per the stop
  condition it was not polished; the researcher's work is carried by the instruments in frame (the pipette dispensing,
  the applicator dipping), with no hand.

## Shots (s)

| Time | Words | Shot | Scale / setting | What develops |
|---|---|---|---|---|
| 0.00–2.62 | "They made a living mouse's skin transparent." | **S1 Hook** | skin macro, ~11 mm across | Frame 0: a cotton applicator soaked in the yellow solution mid-stroke on shaved belly skin; behind it a small patch already gone red-orange and translucent, intestine loops moving under the intact surface. Each stroke wets the skin yellow, then it clears (time-compressed: minutes in reality); the cleared area spreads with a soft, uneven edge. Slow push in. |
| 2.62–4.72 | "And watched its organs moving underneath" | **S2 Across the belly** | low macro, the body's curve as a horizon, fur beyond | A slider move from untreated skin (pale, opaque) across into the treated patch (red-orange, organs visible), the same surface continuous over both. |
| 4.72–6.70 | "without making a single cut." | **S3 Grazing macro** | ~4 mm, raking light | The lens travels along the surface: unbroken skin, follicles, stubble and the wet sheen run continuously across the cleared area, the organs soft below. |
| 6.70–8.52 | "They'd rubbed a food-dye solution" | **S4 Lab** | vial on the bench, ~55 mm | Cut and focus pull onto a vial of water; a glass pipette of concentrated food dye (tartrazine) swells a drop that falls (7.94) and lands (7.99, with the mix's drop) and sinks as a curling plume (2D fluid simulation); the applicator dips into the solution (8.22) and comes out yellow. |
| 8.52–10.10 | "onto its skin." | **S5 Application** | skin macro, a new angle | The soaked applicator comes in, touches (8.87) and rubs; the solution spreads into the surface; the camera dives into the wet colour and dissolves inward. |
| 10.00–11.44 | "You see, water and fat" | **S6 Into the tissue** | 1.6 mm block | From the dye film on the surface down through the layers of a dimensional block of skin: stratum corneum, epidermis, a basket weave of collagen with follicles, glands and capillaries, dermal fat (adipocytes), striated muscle, the abdominal wall, peritoneum, intestine and villi. The water-rich matrix shimmers on "water", the fat glows on "fat". No labels. |
| 11.44–14.75 | "normally bend light differently, scattering it and hiding what's underneath." | **S7 Scattering** | same block | A narrow beam of red light enters; the physically rendered volume scatters it into a glow in the upper dermis (light paths drawn over it random-walk and spread); it never reaches the gut. The camera follows down to the intestine, dim and unresolved. |
| 14.75–17.05 | "But the dye changes how the watery parts" | **S8 Dye enters** | closer, new angle, ~0.5 mm | Milky tissue; dye molecules (glowing orange points) diffuse in from the surface through the water between fibres and cells, deflected by the fat cells (never entering them); behind them the fog lifts and the structures resolve. |
| 17.05–19.90 | "bend light, making them behave more like the fat." | **S9 Before / after** | same block, same camera as S7 | The same beam on the same geometry, milky first; the clearing sweeps down it; the light now runs straight through to the intestine, whose villi light up and resolve. The camera follows it down, then pulls back up and out. |
| 19.60–20.31 | (pull-out) | **S10 Back to the animal** | belly macro, wider | Dissolve out of the tissue to the curved belly: the cleared patch with organs moving, fur at its edges — the second reveal, now explained. |
| 20.31–23.70 | "Then they washed the dye away... and the skin hid the moving organs again." | **S11 Wash** | skin macro, a new angle | Cut on the mix's squirt: a sheet of water runs across the skin (refracting front, beads left behind); behind it the colour leaves and the skin turns opaque over the organs again; beads run off on the mix's drips. |
| 23.45–25.07 | | **S12 Loop** | S1's framing | Dissolve to the dry, opaque belly in the opening composition; the soaked applicator comes in and touches down on the loop's brushing sound (24.73); the last frame runs into frame 0. |

## Physics and simplifications

- Cleared skin is red-orange (tartrazine absorbs blue, blood adds red) and still slightly hazy; the organs are seen
  through skin and the thin abdominal wall, never through an opening. Clarity fades toward the edge of the applied area.
- The tissue's optics are physically rendered, not drawn: the matrix is a scattering volume. "Milky" uses a mean free
  path of ~40 µm (illustrative, shorter than real dermis so it reads at this scale); "cleared" a much lower density with
  orange absorption, and the fibres and cells partly fade (index matching weakens their boundaries).
- Time is compressed: clearing and its reversal take minutes in the experiment.
- Organ motion is a slow peristaltic warp of the light from the organs only (the skin surface does not move with it);
  breathing is a slight periodic motion. Both are periodic over the film, so the loop is seamless.
- Layer thicknesses are approximate for mouse ventral skin; villi and muscle are simplified.

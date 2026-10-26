# Lightning Laser: sources, what the film shows, and its simplifications

## The work being described

A. Houard, P. Walch, T. Produit, … J.-P. Wolf, "Laser-guided lightning", *Nature Photonics* (published online
16 January 2023), doi:10.1038/s41566-022-01139-z. Field campaign on the Säntis summit (about 2,502 m), Switzerland,
summer 2021, next to the 124 m Swisscom telecommunications tower (which has a conventional lightning rod).

| Source | Used for |
|---|---|
| [Nature Photonics paper](https://www.nature.com/articles/s41566-022-01139-z) | upward negative lightning leader guided along the laser path over about 50 m, recorded by two high-speed cameras; guiding also corroborated in three other events by VHF interferometry |
| [UNIGE press release and machine photographs](https://www.unige.ch/medias/en/2023/devier-la-foudre-grace-au-paratonnerre-laser) | the laser installed near the tower, focused above its tip; filaments ionise nitrogen and oxygen molecules, releasing free electrons; the air in the filament is heated |
| [LOA / ENSTA Paris news](https://loa.ensta-paris.fr/2023/01/17/a-laser-lightning-rod-in-the-high-mountains/) | 1 TW peak power, 1 kHz repetition rate (about 1 kW average), more than 3 tonnes; the rod's reach extended from 124 m to over 180 m |
| [EPFL news](https://actu.epfl.ch/news/deflecting-lightning-with-a-laser-lightning-rod-4), [Optica OPN](https://www.optica-opn.org/home/industry/2021/july/can_a_super_laser_tame_lightning), [Guinness World Records](https://www.guinnessworldrecords.com/world-records/762832-first-laser-guided-lightning) | about 1 J and about 1 ps per pulse; the system reported as several metres long (OPN: 9 m, 5 t); 50 m = 164 ft |

**Access note.** This environment's network policy blocked nature.com, unige.ch and crossref.org, so the facts above
come from search-engine extracts of those pages and of the institutional news items, not from a full read of the
paper. The "heated, lower-density channel" wording follows the narration and the research team's explanation as
reported in coverage; check it against the paper before it appears in a description.

## The narration's claims, checked

| Line | Status |
|---|---|
| "They fired a laser into a thunderstorm—and the lightning followed it." | Supported: an upward leader followed the laser path for about 50 m. "Followed" is drawn as part of the bolt, not all of it. |
| "You see, air normally resists the flow of electricity." | Standard physics: air is a good insulator until breakdown. |
| "But this machine fired a thousand laser pulses every second…" | Supported (1 kHz). |
| "…stripping electrons from air molecules and heating a narrow channel through the sky." | Supported: filaments ionise N₂/O₂ and heat the air along the beam. |
| "That gave electricity an easier path to travel." | Supported as the mechanism's summary. |
| "So when lightning erupted upward from a nearby tower, part of the bolt followed that channel for over 160 feet." | Supported: upward lightning from the tower; ~50 m (≈164 ft) guided section. The bracket spans the guided section only. |
| "A normal lightning rod only reaches as high as its metal tip." | A simplification of rod protection; the picture shows only the metal ending at its tip and draws no "protection zone" (nothing suggests zero protection below it). |
| "But these scientists extended one into the sky—using the air itself." | Supported (LOA: reach extended from 124 m to over 180 m). |

## What the film draws, and its deliberate simplifications

- **One site, fixed positions** (`source/src/world/site.ts`): the tower stands vertically right of centre, the
  apparatus on a terrace lower left, the control shelter on a ledge lower right, off the discharge path. The tower is
  730 px (124 m), so the guided section is 300 px (≈50 m); every view uses these same coordinates.
- **The apparatus and shelter are drawn larger than the tower's scale** so they read in the wide shot. The apparatus
  is a long weatherproof enclosure on a steel frame, a beam duct, a fork-mounted launch telescope aimed along the beam
  axis with an open rain hatch, and cable runs to the shelter (`source/src/art/Apparatus.tsx`). It follows the
  photographs in outline only (not a reproduction of the real layout).
- **The beam geometry**: the beam is drawn tilted 18° from vertical from the lower-left terrace so it passes just
  beside and above the rod tip. The real beam was launched next to the tower and focused above its tip; the tilt is a
  legibility choice. The beam never touches the tower, the apparatus housing, the shelter or a person.
- **The beam and the channel are visualizations.** The infrared beam is a faint violet line; packets on it are
  illustrative (real pulses are 1 ms apart, about 300 km apart in flight). The heated, ionised channel is a faint
  cyan band and a scatter of glowing motes; it is not a solid wire.
- **Time is expanded.** Leaders are drawn climbing over about a second; real upward leaders cover 50 m in well under
  a millisecond. The continuing current is held on screen for a few seconds so the bracket can be read.
- **The molecular views** (`source/src/scenes/Micro.tsx`) are a nested scale of the site (the camera zooms into the
  close-up point; no cut and no magnifier): N₂ (blue-grey) and O₂ (coral) pairs at about 4:1, each with one loosely
  bound electron drawn beside it. A pulse frees electrons (they glow and drift; the molecule becomes an ion marked
  "+"); later the channel's molecules are pushed outward and jiggle faster (heating, lower density) while ordinary
  air outside stays put; then a discharge front runs up the treated channel while its side branches into ordinary
  air stall. Schematic, not to scale.
- **The danger vignette** (shot D) is labelled "Illustration" and staged on a different, simplified set (plain
  backdrop, a cartoon cloud, a grassy hump). It shows a hypothetical downward strike on the lead; it is not a
  reenactment of the Swiss test and no researcher is involved. The molecular view that follows it shows ordinary air
  holding its electrons except along one localized breakdown path.
- **The rod comparison** (shot L) is a separate, ordinary gabled house with an air terminal, a down-conductor on
  stand-off clips and an earth clamp. The metal never changes size; no protection zone is drawn.
- **No data plot, quotation, casualty or invented result** appears; the only numeric graphic is the "160+ ft" bracket.

## Cast and assets

| Asset | Path in this episode | Provenance |
|---|---|---|
| Body rig (two-bone IK), head, hands, ink and shading | `source/src/dc/` | copied from `glass-climbing/source/src/dc/` (Death Clock V4 lineage via Real Web Fluid) |
| The lead (red-haired guesser, striped tee) | `source/src/cast.ts` `LEAD` | Video 01 cast.ts `guesser` on the Death Clock rig, unchanged, plus a green iris (`dc/Head.tsx` `iris`) |
| The operator | `source/src/cast.ts` `OPERATOR` | Video 01 cast.ts `clerkB` (skin #8D5A3C, black bun, white shirt under a blue cardigan, glasses, earring, badge), redrawn in the Death Clock construction |
| Head options added for her | `dc/Head.tsx` (`hairStyle: 'bun'`, `frames`, `earring`, `cheekK`) | the Video 01 `bun` cap and bun, `glasses` frames and `earring`, scaled from the Video 01 rig (head radius 58 → 100) |
| Open cardigan front | `dc/Man.tsx` (`front`) | Video 01 `cardigan` overlay, as an open front showing the shirt and collar |
| Skeleton exposure | `source/src/art/Skeleton.tsx` | new; rigged to `manJoints` (the figure's own joint solver) |
| Site, tower, apparatus, shelter, house, molecules | `source/src/art/`, `source/src/scenes/` | new for this episode, in the Crew finish |

**Asset limitations (stated plainly).** The brief refers to the approved *contacts* ("Infrared Contacts"),
*laser-voices* and *Death Clock* projects. None of them is in this repository (the same gap is noted in
`moth-silk-web-shooter/README.md`). So:
- the lead's "green eyes" could not be checked against contacts-era artwork; the repository's head has ink pupils, and a
  green iris ring is the one addition to his face;
- the operator exists in the repository only as Video 01's flat-rig `clerkB`. She was **reconstructed**, not reused,
  on the Death Clock rig from that design's colours, bun, frames, earring and cardigan; her body proportions are the
  rig's. If an approved laser-voices/contacts version of her exists outside the repository, she should be checked
  against it (face shape, bun size, frame shape, jacket cut);
- in the shelter she is drawn on the rig mirrored so she faces the window.

## Sound

Everything is synthesised in `tools/make_audio.py` (no samples, no third-party music): rain and wind (loopable),
the leader crackle (starts at 31.97 s and runs across the seam), one crack and thunder per loop at the opening
connection, the shelter's muffled storm and a knob click, the vignette's cloud rumble, static fizz, strike snap and two
short zaps, the laser's soft packet ticks and hum, molecular textures, and the demonstration's crack and thunder after
its flash. The narration is the take sample for sample (gain only).

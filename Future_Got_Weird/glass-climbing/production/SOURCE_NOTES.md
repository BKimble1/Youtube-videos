# Glass Climbing: sources, what the film shows, and its simplifications

## The work being described

Elliot W. Hawkes, Eric V. Eason, David L. Christensen and Mark R. Cutkosky (Stanford Biomimetics and Dexterous
Manipulation Lab), "Human climbing with efficiently scaled gecko-inspired dry adhesives", *Journal of the Royal
Society Interface* 12: 20140675 (2015; online November 2014), doi:10.1098/rsif.2014.0675.

| Source | Used for |
|---|---|
| [PMC4277072](https://pmc.ncbi.nlm.nih.gov/articles/PMC4277072/) (the paper, open access) | authors, journal, the 70 kg climber, about 140 cm² of adhesive per hand, near-even load sharing across patches, partial failure not cascading, the improved area scaling |
| [Stanford Engineering news](https://engineering.stanford.edu/news/stanford-engineers-climb-walls-using-gecko-inspired-climbing-device) / [Stanford Report](https://news.stanford.edu/?p=2263) | the handheld pads, 24 tiles per pad, sawtooth (wedge) structures about 100 µm long, the springs that spread the load |
| [NBC News](https://www.nbcnews.com/news/amp/wbna56475710) | tiles about the size of a postage stamp; each tile on a tendon ending in a nitinol spring; attach by loading, release by unloading |
| [Tech Briefs](https://www.techbriefs.com/component/content/article/31025-human-climbing-with-efficiently), [TechXplore](https://techxplore.com/news/2014-11-gecko-pads-climb-glass-wall.amp), [Discover](https://discovermagazine.com/the-sciences/scientists-develop-gecko-inspired-glass-climbing-technology-perfect-for-your-next-spiderman-costume) | degressive springs (stiffness falls with stretch), the glass-wall climb (reported as about 3.6-3.7 m), the smooth-surface limitation at the time |
| [Stanford PURL jd262rc7265](https://purl.stanford.edu/jd262rc7265) (Hawkes thesis summary) | a single tendon-loaded tile has a maximum useful size, so the design load-shares across many small tiles |

Access note: the proxy blocked direct fetches of the PMC and Stanford pages from this environment, so these facts were
taken from search-engine extracts of those pages, not from a full read of the paper. A reader should check the
numbers against the paper before they appear in a description.

## The narration's claims, checked

| Line | Status |
|---|---|
| "If you pressed these pads against a glass wall, you could lift your feet off the ground—and climb it like Spider-Man." | Supported (a person climbed a vertical glass wall with two handheld pads). "Like Spider-Man" is the Stanford coverage's own framing. |
| "Their surfaces are covered in microscopic wedges." | Supported (sawtooth/wedge microstructures, about 100 µm). |
| "As you pull downward, the wedges bend flat against the glass. This brings them so close that tiny molecular attractions can hold your entire weight." | Supported as the standard explanation of these directional dry adhesives: shear loading bends the wedges, increasing true contact area so van der Waals forces add up. "Molecular attractions" = van der Waals. |
| "Special springs spread the load, so one little patch doesn't have to hold you up alone." | Supported (degressive / nitinol springs, near-even load sharing). |
| "Then, you shift your weight onto the other pad. The first releases, letting you reach higher and repeat." | Supported (unloading releases the adhesive; climbing alternates pads). |
| "But there's a catch. They need a smooth surface to grip." | Supported for this system (the reports say the pads worked on smooth, clean surfaces). |
| "So you can climb glass—but switch to rough brick, and those microscopic wedges can't make the same contact." | Brick is shown as a limitation of **this** smooth-surface system only; the film makes no claim about other gecko-inspired or microspine climbers. |

## What the film draws, and its deliberate simplifications

- **Pads**: a rigid plate per hand with 24 tiles on the glass side, a handle standing off the back, a strap from the
  bottom edge to a foot stirrup (`source/src/art/Pad.tsx`). Proportions are drawn from photographs described in
  coverage, not from drawings; the tile grid is 4 × 6.
- **Foot stirrups: not confirmed by a fetched source.** The brief asks for "handheld paddles with handles and foot
  stirrups". The searches found the handheld pads but no text describing foot stirrups (NBC describes stepping on and
  off the surface, which is not the same thing). The film follows the brief; this should be checked against the
  paper's figures or video before the description makes any claim about the feet.
- **No safety line** is drawn (the brief made it optional). No web fluid, magnets, suction, goo or claws anywhere.
- **The micro section** (`source/src/scenes/Micro.tsx`) is a schematic cross-section, not a photograph: thin
  silicone blades about 100 µm long, all leaning the same way (down toward the glass) in every shot. Unloaded only
  their tips touch; pulled down they bend over and lie flat; unloaded they spring back. There are no electrons,
  sparks or lightning; the only contact cue is a soft line along the contact edge (shot J). The column of wedges is
  narrower than a real tile (a few dozen wedges stand for thousands).
- **Section-view cheats**: the bay is staged as a section through the glass slab (glass at x = 0, the climber facing
  it), and the micro section is drawn on the pad's tile layer at the pad's position, so the camera can travel from
  the climber into the contact and back (nested scale bridges). The glass slides in to the wedge tips in the micro
  shots (H, Q) instead of the pad being shown arriving at micron scale.
- **Springs** (`source/src/scenes/Springs.tsx`): one tendon and one coil per tile, laid out in the gap below each
  tile. The real pad routes tendons and nitinol springs inside the plate; the drawing keeps their relationships (each
  tile pulled by its own spring, all anchored to rails the strap pulls), not their dimensions or routing.
- **Brick** (shots R and S): rough brick is drawn with peaks larger than the wedges, so only a few tips reach a peak;
  under load the backing slides and those few skid off. At the bench the result is a modest slip of the pad and its
  small test mass (no dramatic fall, no damage).
- **The bench** is an illustrative test stand (a vertical carriage with a glass strip above a brick strip, a small
  slotted mass hanging from the pad's ring). It is not a reproduction of the lab's test equipment.
- **The climber's pace** is compressed (a full cycle in about 4 s of screen time); the real climb was slower.

## Historical / research note

Gecko-inspired directional dry adhesives come out of the same lab's earlier climbing-robot work (Stickybot). The 2014/2015 paper's contribution is the **scaling**: load-sharing across many
small tendon-loaded tiles through degressive springs so that a hand-sized pad keeps most of a small tile's per-area
performance, which is what made a human-scale climb possible. The film's spring shot is about that, not about the
wedges themselves.

## Cast and assets

The lead is the Weird Crew's existing protagonist ("the guesser"), reused with his rig and outfit; no new cast.

| Asset | Path in this episode | Provenance |
|---|---|---|
| Body rig (two-bone IK, outfit) | `source/src/dc/Man.tsx` | copied from `moth-silk-web-shooter` (Real Web Fluid V2), itself from Death Clock V4 (`Shorts/death-clock/source/src/art/Man.tsx`, commit e5b4770e); this episode adds only draw-order hooks and a hands-only pass |
| Head, face, hair | `source/src/dc/Head.tsx` | same lineage (with Real Web Fluid V3's skin-shading revision), unchanged here |
| Hands (opposed thumb, grip poses) | `source/src/dc/Hand.tsx`; placement helpers `source/src/world/rig.ts` | same lineage; `placeHand`/`handUV` from Real Web Fluid V6 `Lab6.tsx` |
| Ink, shading, limbs, camera, colour, maths | `source/src/dc/{ink,shade,limb,camera,color,math}.ts(x)` | same lineage |
| Pad, strap, stirrup, glass bay, bench, micro, springs | `source/src/art/`, `source/src/scenes/` | new for this episode, in the Crew finish (ink contour, gradient shading from one key light); no stock icons, no 3D renders |

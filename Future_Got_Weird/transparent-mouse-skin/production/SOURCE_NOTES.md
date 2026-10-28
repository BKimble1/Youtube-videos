# Transparent Mouse Skin V1: source notes

## Research access (read first)

The two primary sources named in the brief could **not** be opened from this session. The environment's network
policy refuses `news.stanford.edu` and `pmc.ncbi.nlm.nih.gov` (DNS-blocked: "outside the session's allowed network
domains"). No figures or demonstration media were viewed this session.

The scientific grounding below comes from the published paper as I knew it before this session. It has **not been
re-verified against the paper's text and figures here.** Before publishing, check these points against the paper
(the "check" column):

| Claim used in the film | Basis | Check |
|---|---|---|
| A 2024 experiment in **living** mice | Ou et al., *Science* 385, eadm6869 (Sept 2024); Stanford (Hong and Brongersma labs) | date and journal |
| Tartrazine (FD&C Yellow 5, a food dye) in a solution applied to the skin, rubbed or massaged in | paper; Stanford account | the exact application wording |
| The treated abdominal skin became see-through, and abdominal organs and intestinal motion (peristalsis) were seen through intact skin | paper; Stanford account | which organs are visible in the figures (liver, small intestine, bladder) |
| The clear skin looks red-orange (the dye absorbs blue; red light gets through) | paper (mechanism and photos) | the hue in the photos |
| The effect reverses when the dye is washed off with water | paper; Stanford account | the time course (the film labels its return as TIME-LAPSE) |
| Mechanism: strong absorption at short wavelengths raises the aqueous medium's refractive index at longer (red) wavelengths (Kramers–Kronig). This reduces the index mismatch with lipids, so scattering drops. | paper | as stated |
| Not a human application; not an effect of eating the dye | paper | — |

Sources to cite (description draft, `upload/DESCRIPTION_DRAFT.md`):
- Stanford Report: https://news.stanford.edu/stories/2024/09/using-a-common-food-dye-researchers-made-mouse-skin-transparent
- Paper (open access): https://pmc.ncbi.nlm.nih.gov/articles/PMC11931656/ · DOI https://doi.org/10.1126/science.adm6869

## How each production boundary is met

1. **2024, living mice, not human use.** Nothing on screen claims a date or a human application. The mouse breathes,
   and its intestines move, throughout.
2. **Intact skin.** The patch is a shaved area of skin with continuous fur stubble around it and pore texture over it,
   whatever its transmission. The anatomy sits in its own layer under the skin. Transmission only changes how much the
   skin layer hides that layer (`art/Mouse.tsx`). There is no incision, flap, hole or glass window. The rinse uses
   water beads, not streak lines, so nothing on the surface can read as a scratch.
3. **Not wholly invisible.** Only the abdominal patch clears. Its edge fades into neighbouring opaque skin, and the
   whole outline stays legible.
4. **Tartrazine solution applied to skin.** A yellow-orange solution is rubbed on with a swab (S2). There is no
   eating and no product.
5. **Reduced scattering.** The section traces rays with Snell's law (`art/Section.tsx`). Before the dye, rays bend at
   each water/lipid boundary, branch (scatter) and mostly fail to reach the organ, which stays hazed. As the dye
   enters the watery parts, their index for the red light rises from 1.33 to 1.60, toward the lipid's 1.62 (both
   **exaggerated for legibility**, and deliberately not equal). The same rays then pass almost straight and the organ
   comes clear.
6. **Not simple absorption, and nothing is deleted.** The lipid regions keep their colour and stay in place. Only
   their optical boundary (outline) weakens. The dye molecules move only into the water-rich matrix.
7. **Red-tinted, not colourless glass.** The clear patch is red-orange. A blue ray in the section is absorbed by the
   dye near the surface, while the red rays pass, so the colours are shown to behave differently.
8. **Anatomy.** The film shows liver lobes at the top of the patch, packed small-intestine loops with slow travelling
   constrictions (peristalsis), the bladder low, and mesenteric vessels. Every organ is anchored inside the patch and
   moves by a few pixels. There is no heart in the abdomen.
9. **Calm, sedated.** The mouse is under an anaesthesia nose cone, with closed eyes, a slow breath, and no sounds
   from it.
10. **Reversal over time.** The return to opaque carries a TIME-LAPSE cue with a turning clock.
11. **Organs stay inside.** At the end, the skin's opacity returns over loops that keep moving. The anatomy layer is
    never removed.

## Simplifications (deliberate)

- The mouse and the lab are original illustrations, not traced from the paper's photographs.
- The cross-section is a schematic. Real skin has many components and the index values are illustrative. Light
  "reaching the organ" stands in for imaging through the skin.
- The applied area is drawn as an oval patch on the belly.
- Application and rinse are shown with a cotton swab and a wash bottle. The film does not claim the paper's exact
  protocol.

## Cast and assets

- **Operator:** the Weird Crew "guesser" (white sleeve with saffron stripes, peach wrist) wearing a nitrile glove.
  The hand uses the crew's existing Hand rig (`source/src/dc/Hand.tsx`, carried over unchanged from Glass Climbing,
  which took it from Death Clock). It is drawn at true scale relative to the mouse, so only fingertips and the tool
  enter the frame.
- **Caption style:** the channel's caption treatment (Glass Climbing `Captions.tsx`).
- **Fonts:** Nunito (via the established `fonts.ts`).
- **Generated media:** no generated imagery is used. The scenery is controlled vector art (`art/Bench.tsx`). See
  `RUNWAY_NOTES.md`.
- **Sound:** synthesised in `tools/make_audio.py`. No samples and no third-party music.

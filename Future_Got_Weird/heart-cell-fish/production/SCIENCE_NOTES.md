# Science notes: The Fish Made From Human Heart Cells

## Sources

- **Paper:** Lee, K. Y., Park, S.-J., Matthews, D. G., *et al.* "An autonomously swimming biohybrid fish designed with
  human cardiac biophysics." *Science* 375(6581):639–647 (2022). Read as the NIH author manuscript,
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC8939435/>.
- **Press release:** Harvard Stem Cell Institute, <https://www.hsci.harvard.edu/news/biohybrid-fish-human-cardiac-cells>.
  This page did not resolve from this environment (DNS failure), so it was **not read**. The final line's framing ("figuring
  out how to build a human heart") is the locked narration; it matches the Parker lab's widely reported stated aim
  (a heart for children with heart defects), but that aim was not checked against the page here.

## What the paper says, and how the film shows it

| Claim (paper) | In the film |
|---|---|
| A fish-shaped body, 14 mm long, 25 mg. | One 3D model (`source/src/fish/model.ts`) at true proportions: 140 units of 0.1 mm. The pull-out from the tank (shot 12) and the bench (shot 3) keep that scale: beside the scientist the fish is a speck held in tweezers. |
| Five layers: muscle, paper, gelatin, paper, muscle. Laser-cut **paper** makes the rigid anterior body and the **caudal fin**; the **posterior body is compliant gelatin**. | The front and the tail are flat white paper. The hinge between them is translucent gelatin, the only part that bends. In the overhead cutaway the layers show edge-on. |
| Human stem-cell-derived cardiomyocytes, aligned, on **both** faces of the posterior body (the muscular bilayer). | A red, fibre-textured sheet on each face of the hinge. Fibres run along the body axis. Shot 5 rises overhead so both sheets show either side of the core. |
| **Antagonistic contraction:** "the shortening of contracting muscles on each side directly translates to axial stretching of the opposite side muscle". Stretch-activated channels trigger that side. | Shots 6 and 7. Side A contracts: it thickens and deepens in colour, and the tail bends toward it. Side B is pulled longer: it pales and its sarcomere bands open. A wave runs along B, then B contracts and swings the tail back. |
| A **G-node**: a small, functionally isolated patch of cardiomyocytes with a single exit pathway, acting as a pacing node. | A small lobed patch in front of each sheet, joined to it by one narrow strand. It is drawn, not named. |
| A plastic **floater fin** for neutral buoyancy and upright stability. | A clear plastic fin on the anterior top edge. Its exact place is not stated in the paper; the top is our choice. |
| No motor, no fin actuators, no onboard sensors. Autonomous swimming needs no external stimulus. | Shot 10: the body turns to glass. Inside there are only the two living sheets, paper and gelatin. Nothing is attached. |
| Speed: about 15 mm/s, "more than one body length per second". | Swimming in the film is held at or below about one body length per second (`fish/swim.ts`, `shots/Lab.tsx`: 50, 100 and 150 units/s on the three time-lapse days). |
| Amplitude, maximum speed and coordination rose over the first month, then held through 108 days. | Shot 11: three "days" in a fixed time-lapse. The sheets go from thin and pale to thick and deep red; the beat and the crossing speed rise. No numbers or graphs. |
| Optogenetic tests ran in 37 °C Tyrode's solution. The medium for the autonomous runs is not stated. | The fish swims in a small clear glass tank of clear water over a millimetre grid, a common way to film and measure swimming. The grid is our staging. |

## Simplifications and choices

- **Thickness.** The overhead cutaway (shots 5–8) draws the body about 2.8 times thicker, and the muscle sheets thicker
  still, so the layers read. The exaggeration ramps in as the camera rises and back out as the fish starts to swim.
- **Water colour.** The channel's teal water. Real culture media are often pink; Tyrode's solution is clear.
- **Cells.** The microscope shot shows illustrated cardiomyocytes: aligned, branched, striated, one or two nuclei,
  intercalated discs, beating together with a wave. The beat rate is quickened slightly (1.8 Hz) so two contractions fit.
- **Assembly.** Shot 3 shows the caudal fin piece docking onto the hinge with tweezers. It is a simplification of the
  layered fabrication; the cells are then shown on the gelatin.
- **The heart.** A stylised anterior view, used twice: as a painted teaching model on the bench, and as a living heart
  beating at about 75 beats a minute. It is never shown inside the fish.
- **The final line.** The film does not claim that anyone has built a working artificial heart. It shows the scientists'
  goal as a model on a bench and the real organ they are studying.

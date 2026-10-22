# AI Just Cured All Cancer — V2 implementation report (22 Oct 2026)

**Status: review cut, not final.** The film was checked as rendered still frames and contact sheets, and by
measurement. Nobody has watched it at normal speed or listened to the mix in this environment. The 4K master has
not been rendered (the brief asks for it only after approval).

## Deliverables

| | Path |
|---|---|
| 1080p review render (picture + V2 mix) | `exports/FGW_AI_Cancer_V2_REVIEW_1080p.mp4` (git-ignored; 3:51.17, 6,935 frames, H.264 CRF 16, AAC 320k) |
| Source (Remotion compositions `MainV2` / `PreviewV2`) | `source/src/v2/` — `rig.ts`, `director.tsx`, `time.ts`, `palette.ts`, `defs.tsx`, `art/*`, `seq/A–G.tsx`, `MainV2.tsx` |
| Captions | `v2/captions/FGW_AI_Cancer_V2.srt` (79 cues; caption text identical to the approved script, 616 words) |
| Narration | `v2/audio/narration/` (approved script verbatim; same FGW voice; takes, provenance, word timings) |
| Sound | `tools/v2/cues_v2.py` → `v2/audio/sfx_cues_v2.json` → `tools/v2/make_audio_v2.py` → `v2/audio/mix/mix_v2.wav` |
| Shot list | `v2/production/shots_v2.json` (34 shots, dissolve lengths) |
| QA | `v2/qa/review*/` (results.json, film sheets, transition strips) |

V1 (`Main`) is untouched and still builds.

## What was built

**Narration.** The approved V2 script was recorded word for word: 7 blocks × 2 takes, with takes chosen by measurement. No sentences were added or removed. The timeline runs from the measured word timings: every spoken event is placed with `T('phrase')`, and no second is hand-typed.

**One camera system.** `rig.ts` provides:
- Monotone cubic Hermite paths in position and log-zoom, with no overshoot and no snaps. Keys out of order throw an error.
- Exact zoom-through handoffs between worlds. The anchor object keeps the same screen position and size, and both cameras move in lock-step during a short dissolve.
- The `Director` that layers the shots.

Scale journeys use this system throughout:
- body → lung → alveolus → tissue → cell interior → nucleus → DNA, and back out
- tissue → blood vessel → liver → body
- nanoparticle → bloodstream → tumour-cell membrane, and back
- tissue → twin, and the twin → protein pocket

**Worlds, each with depth layers.**
- **Body:** a premium front view with surface anatomy, x-ray organs, a digital-twin mode and circulation.
- **Lung:** a bronchial tree down to alveolar sacs.
- **Tissue:** an infinite, deterministic epithelium with level of detail (pattern tile far away, full cells close up).
- **Cell interior:** organelles, nuclear envelope with pores, chromatin.
- **DNA helix:** a 3D-shaded helix with regulatory proteins drawn as globular clamps.
- **Blood:** red cells in three parallax layers inside a vessel.
- **Liver:** hepatocyte plates and sinusoids.
- **AI world:** a floor grid, a reconstructed tumour (stacked slices, voxels, iso-contours, vessel tree) and the simulation tree.
- **Protein:** a target protein with a binding pocket, plus ball-and-stick molecules.
- **Carriers:** lipid nanoparticles (bilayer, payload, ligands).
- **Immune cells:** T cells, NK cells, macrophages and dendritic cells; MHC with peptides and neoantigen fingerprints; TCR, synapse and granules.
- **Fragments:** circulating DNA fragments, a blood tube and sequencing read pile-ups.

**Biology on screen** (summary of sequences A–G):
- Real mitosis: rounding, chromosomes on the metaphase plate, spindle, chromatids to the poles, furrow, new nuclei.
- Stop signals that bounce off the cell; an immune attack the cell survives (blebbing, then recovery).
- 1 → 2 → 4 → thousands, with the camera pulling back to a lobulated tumour nodule that pushes the tissue aside.
- The tumour takes nutrients; angiogenic sprouts grow and fill with blood; checkpoint "shields" switch off a T cell.
- One cell elongates, crawls along matrix fibres, enters a capillary, travels with red cells, lodges in a narrowing liver capillary, leaves it and seeds a colony.
- Pull back to the whole body: lung, liver and further sites.
- Subclones change, a selective pressure kills the sensitive ones, survivors expand.

**AI shown as non-magical.**
- The predictive scan marks cells and sketches possible next steps.
- The twin is built from three visible inputs: scan slices, a biopsy core and sequencing reads.
- Simulated treatments branch with predicted growth curves that carry widening uncertainty bands.
- In the blood test, a threshold is crossed while the uncertainty band stays visible, and both forecasts are drawn dashed.
- No percentages, results or claims are shown anywhere.

**Science rules.**
- Carriers drift with the blood and are never self-propelled. They are tiny next to red cells, leave the vessel only where the tumour vessel wall is leaky, and stick only to cells that carry the marker.
- After a carrier is taken in, its payload is released; tumour cells die by apoptosis (shrink, bleb, apoptotic bodies) while unmarked healthy cells stay intact.
- Resistance: one cell changes its marker, new carriers bounce off, and it divides.
- Vaccines and engineered cells are shown as separate routes:
  - Vaccine: particles are taken up by a dendritic cell, which displays the fingerprint to a T cell.
  - Engineered cells: a gene-delivery particle reaches a T cell, gold receptors appear, and the cell multiplies.
- Circulating tumour DNA is a minority among normal DNA fragments, and the read-out carries uncertainty.

**Payoff.** At 3:41 the opening returns: the same body, the same glow and the same dive path (1.22× speed). This time a trained T cell recognises and removes the single cell, then the camera pulls back to the same composition with no glow and fades out.

**Colour system.** Healthy tissue is warm pink/coral. Tumour moves from wine to magenta/violet. Blood is crimson. AI is cyan/electric blue with gold for whatever the analysis singles out. Immune cells are teal with a restrained gold rim. At the end, healthy colours return.

**Sound.** The V1 FGW voice and the same procedural approach are used, with no third-party samples.
- 138 synchronised cues, including new biological effects: heartbeat, division stretch-and-pop, squelch contact, swarm texture, bubbles, tissue stretch, clash.
- Ambience beds per world, including a pulsing blood bed.
- The score follows dark → rising → tension on "it survives" → discovery (AI) → rhythmic (delivery) → immune momentum → uncertainty → hopeful (F major), and fades with the picture.
- Music is ducked under the voice: during speech it sits about 15.5 dB below the voice RMS.

## Measured (second review render, `v2/qa/review2/`; SHA-256 545da616…7d5f46, 390,272,918 bytes)

- **Loudness:** -14.14 LUFS integrated, -1.09 dBTP true peak (decoded from the delivered file).
- **Black frames:** only the intended closing fade (231.03–231.13 s).
- **Freezes:** no frozen stretch of 1.2 s or longer.
- **Picture activity:** no second below the low-activity threshold (lowest 0.59, median 14.4).
- **Single-frame jumps:** the remaining flags are the intended hard cuts (57.4, 90.7, 97.7, 107.4, 132.9, 150.7, 155.4, 158.4, 186.5, 195.5, 199.3, 202.2 and 221.6 s, each revealing a new world) plus spread-out motion during dissolves (108–109.5, 188.4, 210.2–210.4, 219.2–219.3 s). In the first render two G dissolves came out as hard cuts; they now dissolve.
- **Other transition fixes after the first render:**
  - The carrier changed art style at the nanoparticle → bloodstream handoff; one shared carrier drawing is now used at both scales.
  - The blood tunnel ran across the screen while the capillary ran down it; the tunnel now starts rotated to match and levels out.
  - The reconstructed tumour was too faint during its dissolve-in.
  - The engineered-T-cell route was hard to read; a gene-delivery particle and receptor growth were added.

## Prioritised remaining issues

1. **No real-time viewing or listening has been possible here.** Pacing, motion smoothness at 30 fps, effect levels and music balance all need a watch and listen by you.
2. **Long single-world stretches:**
   - D vessel/tumour shot, 1:54–2:13, about 19 s. It contains a pull-back for scale, apoptosis and resistance, but stays in one setting longer than the 3–7 s target.
   - D protein, 1:38–1:47, about 10 s.
   - C twin/simulation, 1:17–1:29, about 12 s.
   Each could take one more environment change.
3. **C simulation tree (1:22–1:27)** still reads somewhat like a diagram; branch tumours are small on screen.
4. **E receptor-learning close-up (2:35–2:38)** is sparse: a dark background with few elements.
5. **B evolution close-up (0:57–1:04)** is busy; the subclones are distinguished mainly by hue and could use shape differences.
6. **Nanoparticle → vessel handoff (1:49.4–1:49.7):** for about 0.3 s the carrier sits alone on a flat red plasma field before red cells come into view.
7. **Liver pull-back (0:53.9–0:54.4):** at far zoom the liver pattern reads as horizontal stripes for about half a second.
8. **The figure is gender-neutral** while the narration says "this man's". Consider a slightly more masculine silhouette.
9. **Caption cue 4** breaks as "The instructions / controlling when it grows,". It is acceptable but could be rebalanced by hand.
10. **4K master:** not rendered. It is pending approval and will be rendered natively at scale 2, in frame ranges, and joined.

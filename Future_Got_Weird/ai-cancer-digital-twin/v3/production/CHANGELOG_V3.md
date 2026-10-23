# AI Just Cured All Cancer — V3 visual-quality and continuity pass (change log)

**Status: review cut, not final.** It was checked by measurement, by contact sheets of the rendered file (2.5–6 frames
per second over the changed windows) and by frame strips at every shot boundary. Nobody has watched it at normal speed
or listened to it in this environment.

- **Baseline:** `FGW_AI_Cancer_V2_REVIEW_1080p.mp4`, git tag `fgw-cancer-v2-review`.
- **Source:** the V2 source was revised in place. The new composition is `MainV3` (the `MainV2` component with the V3 mix).
- **Narration and captions:** unchanged. The approved narration is reused byte-for-byte (`v2/audio/narration/narration_v2.wav`, 231.14 s, 616/616 words aligned). Caption timing did not need changing, so the V2 SRT (`v2/captions/FGW_AI_Cancer_V2.srt`) is still valid for V3.

Timestamps are m:ss in the V2 render and the V3 render. Both films are 3:51.17 long with the same narration timing.

## Priority 1 — camera connections

| V2 | V3 | Change |
|---|---|---|
| 0:03–0:08: the camera drifted over a uniform cell field while the abnormal cell stayed small | 0:00–0:08 | One descent (body → lung → alveolus wall → the cell) that lands on the cell at 0:04.6 at about 2× V2's size and keeps closing in. While the cell "looks completely normal", a faint rim keeps it findable. |
| 0:10.8: a full-frame purple blur of chromatin between cell and DNA | 0:09–0:12 | The helix is now drawn inside the nucleus in the same coordinates as the DNA view. As the camera closes in, the nucleus darkens to the DNA backdrop and the other fibres recede, so the hand-over is one continuous subject. The nuclear envelope stays visible in the DNA view's distance. |
| 0:20–0:21: pull back from DNA | 0:20–0:21.6 | The same continuous pull-back, but growth signals now travel from the nucleus to the membrane of the same cell, which then divides. |
| 0:36–0:48: the camera wandered between the left, top and right of the tumour | 0:36–0:48 | One region: the tumour's upper edge and the capillary above it. Nutrients, the sprout, the switched-off T cell and the escaping cell all happen there. The escape capillary flows to screen-right, matching the vessel shot that follows. |
| 0:51–0:55: tunnel → liver tissue → body (a cell → tissue → body detour) | 0:48.5–0:57.4 | The cell is carried in the flow, then one outward move to body scale. There it is a marked dot travelling lung → heart → aorta → liver along a lit route; the liver lesion grows and further sites appear, all in one continuous outward move. The liver tissue scene is removed. |
| 1:04–1:10: pull back to the body and a generic twin | 1:04–1:10 | The tumour's own silhouette stays on screen: the scan marks cells, a dashed predicted growth front appears, the measured contour is traced, and the model is built inside the same outline at the same position and size. |
| 1:28–1:30: zoom into one of 12 tiny branch models | 1:27.6–1:30 | Push into the gold region of candidate C, which hands over to the digital protein pocket. |
| 1:47: hard cut from the docked molecule to carrier assembly | 1:47.1–1:49 | The docked molecule stays at the same screen position and size and becomes payload molecule 0 while the camera pulls back and the carrier assembles around it. |
| 1:49–1:53: many identical specks; the followed carrier was lost after 1:51 | 1:49–1:53 | ONE carrier (gold halo) is followed: it rides the flow, slips out through a leaky gap, brushes an unmarked healthy cell without binding, and binds the cancer cell's markers (1:52.2). |
| 1:56–2:00: an immediate pull-out to a wide tumour view | 1:56–2:01 | The camera stays on the same cell through its whole death sequence before the single pull-out (2:01.6). |
| 3:42–3:47: body → tissue → cells → body (the ending detour) | 3:41.5–3:51 | Cut to the opening cell in the landing composition from 0:04.6. It is found, contacted and removed at cell scale, then ONE retreat (cell → tissue → lung → body) ends on the opening body framing without the lesion glow. There is no fade to black. |

Hard cuts are kept only where the location or idea changes:

| Time | Cut |
|---|---|
| 0:57.4 | to inside the tumour |
| 1:30.7 | to the five patients |
| 1:37.7 | to the target protein |
| 2:12.9 | to the immune army |
| 2:30.7 | to the two treatment routes |
| 2:35.4 | to the receptor close-up |
| 2:38.4 | to the kills |
| 3:06.5 | to the blood sample |
| 3:15.5 | to the marker/receptor close-up |
| 3:19.3 | to the person and twin |
| 3:22.2 | to the gallery |
| 3:41.6 | to the opening cell |

## Priority 2 — the windows

**0:00–0:11 (opening).**
- A soft window through the skin shows both lungs from frame 0. The affected patch is tinted lung tissue with the spongy lung texture, and the floating light is reduced.
- The oversized heart in the x-ray view was shrunk and toned down.

**0:11–0:33 (DNA and division).**
- Each regulator arrives and binds as it is named (0:13.5, 0:14.5, 0:15.5).
- The accelerator sends a growth signal that stops once the brake binds.
- On "starting to fail", the sites of change are ringed under each regulator.
- On "horribly wrong", the accelerator locks on with a continuous signal stream, the brake lets go and drifts away, and the death switch misfolds and falls off.
- The tumour lineage is now continuous. In V2 the four divided cells faded while the lattice tumour cells had not been converted yet, so the lineage vanished for about half a second at 0:33. The cause (a cell-modifier override) is fixed.
- New cells at the growth front elongate as divisions rather than popping in.
- Surrounding cells are squeezed tangentially, and the push that left a dark moat around the tumour was reduced.

**0:33–1:07 (growth, spread, bridge).**
- The tissue lattice now varies: tile period 14 instead of 10, larger jitter, per-cell size, nucleus and orientation variation, and stable large-scale lighter and darker lobules at far zoom.
- Bloodstream route as above.
- The bridge to modelling keeps the silhouette, as above.

**1:07–1:38 (model).**
- The model is built from the tumour's silhouette, and each input visibly changes it:
  - Scans: a slice plane sweeps through and adds the layers above and below the measured slice (1:12.2).
  - Tumour sample: a biopsy core enters one region, and the regions resolve into subclones (1:13.1).
  - Genetic information: a read slides into one region, which is marked gold (1:14.6).
- Grid floors, motes and the horizon glow are reduced to about half or less of their V2 opacity, and the battlefield surroundings are quieter.

**1:22–1:28 (candidate outcomes).**
- The 12 tiny branch models are replaced by three large candidates on one route, with eight faint possibilities behind them:
  - A shrinks, then regrows from the teal region that persisted.
  - B barely changes.
  - C shrinks where its gold region is hit.
- The growth graphs are removed.
- C's gold region is carried into the digital protein pocket (1:28–1:30).
- From 1:38, the model's outline lingers briefly over the real protein, so the hand-over from prediction to living target is explicit.

**1:38–1:48 (molecular fit).**
- The protein is drawn in two layers, so the pocket's near rim overlaps the seated molecule.
- The two non-fitting candidates now approach along the pocket axis, touch the rim and back off; they no longer pass into the protein.
- The fitting candidate turns into register and seats, the lining residues close around it (induced fit), and the protein's activity pulse stops.
- The molecule–carrier link is as above.

**1:48–2:13 (carrier, entry, payload, death, survivor).** This is one lipid-nanoparticle design throughout: targeting ligands, a bilayer, and the designed molecule as payload.
- **Entry and release (1:52.5–1:56.1):** membrane pit, vesicle pinch-off, then the carrier's shell parts and the payload molecules leave it.
- **Payload action (1:54.3–1:55.4):** the payload molecules diffuse to copies of the same target protein inside that cell and seat in their pockets. The camera settles on one docking, and each protein's activity pulse stops.
- **The same cell's death (1:56.6–2:01.3), as an ordered sequence:**
  1. contraction
  2. nuclear condensation
  3. nuclear fragmentation into dense beads
  4. membrane blebbing
  5. a tight cluster of unequal, membrane-bound fragments (they never look like daughter cells)
- **Payload identity:** the payload keeps the designed molecule's colours at every scale.
- **Survivor:** a sparsely marked neighbour (3 markers instead of 9) sits next to the bound cell from 1:51.6 and is never bound.
  - After treatment its marker changes shape and colour, from round pink to square orange (2:08.7).
  - New carriers drift off it without binding, and it divides (2:09.4).
- **Response:** the other treated cells die in staggered fashion from 1:59, and the unmarked healthy cells on the left stay intact.

**2:13–2:46 (immune).**
- Engineered cells are now shown in a legible outside-the-body context, a culture bag.
  - A gene-delivery particle enters one patient T cell.
  - Gold receptors appear on it.
  - It divides by ordinary mitosis (two rounds shown, with faint further cells implying gradual expansion).
- The 2:36–2:38 close-up is corrected: the receptor tip reshapes first, then the receptor physically seats on the fingerprint (contact from 2:37.2). Only after contact comes a brief, restrained highlight, at about half the V2 strength.
- At each kill the same receptor/fingerprint pair is drawn seated across the contact before the synapse ring and the directed granules. The target dies by the ordered apoptosis sequence, and the T cell never overlaps it.

**2:46–3:20 (response, residual, measurement, adaptation).**
- The tumour boundary erodes unevenly ("bites" where T cells work) instead of scaling uniformly, and the shrink to nothing keeps that shape.
- The survivors keep the resistant identity from 2:08: orange tint and square orange markers.
- The signal chart is removed. The reads (orange-marked and new violet-marked) now feed a model whose surface markers turn from orange squares to violet triangles in one region, and the plan's binding shape is redesigned from square to triangle.
- In the 3:16–3:19 close-up, the markers keep the exact shapes and colours used earlier: round pink → square orange → violet triangle. The marker reshapes (a morph, not a palette swap), the receptor reshapes to match, and only then re-contacts.

**3:20–3:39 (tumours and workflow).**
- The gallery is one continuous pull-out instead of a truck plus a zoom.
- The five-circle infographic is replaced by a route. The camera travels to each stage as it is named and settles there:
  1. Study: model regions resolving.
  2. Predict: three outcomes.
  3. Design: a molecule seating in the pocket.
  4. Activate: a T cell engaging a dendritic cell.
  5. Watch: a flagged fragment in blood.
- The active stage is enlarged and the others stay quiet; the orbiting and pulse animation is removed. The whole route is shown at the end.

**3:39–3:51 (ending).** As in the Priority 1 table. The film finishes on the composed body image, and the audio tail is the hopeful cue fading out with one soft heartbeat.

## Priority 3 — art and timing

- Scale-appropriate detail now uses crossfades. The individual cells, the simplified cells and the pattern tile come from the same lattice, so cells do not pop or change identity.
- Particles, motes and model grids are reduced so they no longer mask the interactions.
- Sound was re-timed to the new events (`tools/v3/cues_v3.py`, 145 cues), including:
  - candidate rim contacts, the seating, carrier touch and bind, pinch, release, four docking clicks, and the same cell's death
  - a gene-delivery pop and two division sounds
  - the receptor seating on "hunt"
  - the ending kill and the single retreat
- The liver-squelch and body-dive cues were removed.
- The mix is still -14.1 LUFS at the -1.2 dBTP limiter ceiling, with music about 15.5 dB below the voice during speech.

## Technical fixes found by QA of the first V3 render

- **Dissolves into AI-world shots (1:08.7, 1:28.9, 3:30.6):** the incoming shot's background was semi-transparent, so the previous shot showed through and then popped off. `AIBack` now always lays an opaque base and dims only its grid.
- **Model hold (1:09–1:10):** two seconds were near-static. The measured slice now fills in, and the camera makes a slow push.
- **Followed carrier:** it now has a constant-size halo, so it stays identifiable among the others.
- **1:56.2 zoom-out:** surface markers ballooned into large pink discs. Their size is now capped by zoom.

## Fixes from QA of the second V3 render

- **3:16.8 and 3:18.0, marker/receptor close-up:** each time the marker changed, the T cell jumped from contact to 240 px away in one frame. It now backs off over about 0.3 s while the marker reshapes, then re-engages once its receptor fits (`seq/F.tsx`, `Loop`). Frames 5850–5990 were re-rendered and spliced into the review file, and the result was checked again.
- **Sync effects under the voice:** the opening heartbeats, the thuds under "it survives", "But it gets worse", "And that's the real nightmare" and "But there's still a problem", and some division cues were as loud as the voice or louder.
  - They were lowered, and the mix was rebuilt.
  - Measured in K-weighted 1 s windows while the voice is active, effects now sit at a median of 16 dB below it, with no window above it (the closest is -0.6 dB at 0:54.75).

## Measured: delivered review file

`exports/FGW_AI_Cancer_V3_REVIEW_1080p.mp4`. The file is git-ignored.

| Property | Value |
|---|---|
| Length | 3:51.17, 6,935 frames |
| Video | 1920×1080, 30 fps, H.264 |
| Audio | AAC 320k, 48 kHz |
| SHA-256 | ec6fbee1…d03fb1 |
| Size | 356,410,018 bytes |

Results (`v3/qa/review3/`):

- **Loudness:** -14.1 LUFS integrated; -1.1 dBTP true peak.
- **Mix balance:** music about 15.5 dB under the voice during speech.
- **Black frames:** none. There is no closing fade to black.
- **Freezes:** none of 1.2 s or longer.
- **Picture activity:** no low-activity seconds.
- **Single-frame jumps:** only at the intended cuts listed above, plus motion spread across four dissolves:
  - 1:49.3–1:49.5: the carrier pull-back crosses a plain plasma field fast. The same motion was in V2.
  - 3:08.4: dissolve to the blood tube.
  - 3:30.3: gallery → workflow.
  - 3:39.2: workflow → tumours.
- **Not verified:** nobody has watched the film at normal speed or listened to it in this environment. Motion smoothness, pacing and the effect and music balance still need a real watch and listen.
- **4K master:** rendered after this review. See below.

## 4K master

`exports/FGW_AI_Cancer_V3_4K_MASTER.mp4`. The file is git-ignored.

**How it was made.** It was rendered natively (`--scale=2`) from the same source as the reviewed 1080p, after the fixes above. It was made in seven ranges of 1,000 frames, joined without re-encoding, with the same V3 mix added.

| Property | Value |
|---|---|
| Video | 3840×2160, 30 fps, H.264 CRF 16 |
| Frames | 6,935 |
| Length | 3:51.17 |
| Audio | AAC 320k, 48 kHz |
| Size | 837,896,323 bytes |
| SHA-256 | 2c5ee8f6…0e3dcb |

**Checks** (results in `v3/qa/master4k/`):

- **Decode:** the 4K stream decodes in full with no errors.
- **Loudness:** -14.1 LUFS; -1.1 dBTP peak, measured on the master's audio.
- **Picture checks:** run on a 1080p proxy downscaled from the master, since decoding 4K frames for analysis exhausted the container's memory. The results match the reviewed 1080p exactly:
  - Black frames, freezes and low-activity seconds: none.
  - Frame jumps: flagged at the same timestamps.
  - Range seams (33.3, 66.7, 100.0, 133.3, 166.7, 200.0 s): no jump at any of them.
- **Native detail:** checked on a full-resolution crop at 1:43.5.

**Not checked:** the master has not been watched at normal speed or listened to in this environment.

**Delivery split.** The master is too large to upload in one piece, so it was also delivered in three parts, cut losslessly at keyframes at frames 2000 and 4000:

| Part | Range | Frames |
|---|---|---|
| `FGW_AI_Cancer_V3_4K_MASTER_part1of3.mp4` | 0:00–1:06.7 | 2,000 |
| `FGW_AI_Cancer_V3_4K_MASTER_part2of3.mp4` | 1:06.7–2:13.3 | 2,000 |
| `FGW_AI_Cancer_V3_4K_MASTER_part3of3.mp4` | 2:13.3–3:51.2 | 2,935 |

Their decoded frames match the master's frame for frame. To rejoin them, list the three files in order in a concat list file and run `ffmpeg -f concat -safe 0 -i list.txt -c copy FGW_AI_Cancer_V3_4K_MASTER.mp4`.

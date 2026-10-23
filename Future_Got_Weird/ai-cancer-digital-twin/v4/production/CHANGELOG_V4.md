# AI Just Cured All Cancer — V4 cinematic polish (change log)

**Status: publication-review cut, not final.** Nobody has watched it at normal speed or listened to it in this environment. Everything below was checked by measurement, by dense still sequences and by frame strips at every transition.

Times are given as **full film / Part 2**. Part 2 is the 2:11 second-half file reviewed in V3, so Part 2 0:00 = full 1:40.

## What did not change

- **Narration:** byte-identical to the approved V2/V3 narration, with the same timing. The V2 SRT (`v2/captions/FGW_AI_Cancer_V2.srt`) is still valid.
- **Length and format:** 3:51.17, 6,935 frames, 30 fps, 16:9.
- **Score and beds:** the music score and the ambience beds are the V3 ones, unchanged.
- **Sync effects:** effects tied to an on-screen event were re-timed only where that event moved (179 cues; `tools/v4/cues_v4.py`). Every effect still measures below the voice: median 15 dB under, and no 1-second window of speech has an effect above the voice. The mix is -14.1 LUFS with a -1.2 dBTP limiter ceiling.
- **Part 1 (0:00–1:37.7):** the sequence sources (A, B, C) are identical to V3. The shared drawing code was extended only with optional parameters that default to the V3 output.
- **Style:** the 2D illustration style, palette and identities are unchanged:
  - healthy tissue is coral
  - tumour is magenta/violet
  - resistant cells are orange with square markers
  - immune cells are teal and gold
  - AI is cyan, with gold for findings

## Sequences materially upgraded (Part 2)

### 1:40–1:56 / 0:00–0:16 — molecular recognition and delivery (polished, not rebuilt)

- **Docking:** happens inside a crowded cell interior. Other proteins sit at two depths and small solutes drift, with an out-of-focus foreground. The candidate molecules tumble in on curved paths, and their thermal motion dies down as they near the pocket.
- **Carrier:** assembles in flowing blood, with red cells streaming past at two depths so its travel reads.
- **Vessel:** the back wall of the vessel is visible through the plasma.
- **Membranes:** the healthy cell's membrane dimples where the carrier touches without binding, and the cancer cell's membrane presses where the carrier binds.

### 1:56–2:25 / 0:16–0:45 — one place, one continuous journey (rebuilt)

All of this happens in the same world as the delivery (the vessel above the tumour edge). The repeated pink and purple cell fields are gone.

- **1:56–2:01:** the bound cell dies in close-up by ordered apoptosis, and a macrophage reaches round the remains and swallows them. Nothing blinks out.
- **2:01–2:05** ("Destroy the cancer while sparing…"): the camera pulls back and tracks from intact healthy cells into the treated stretch, where cells are dying in turn and two more macrophages are clearing them.
- **2:05–2:13** ("…survive, mutate, and become resistant"):
  - The debris is gone, leaving open stroma.
  - The one sparsely marked survivor changes its marker (round pink → square orange), and new carriers drift off it.
  - It then founds a resistant colony by real divisions (1 → 2 → 4 → 8, with two more lineages). Its daughters keep their identity and are laid out so none overlap.
- **2:10–2:17** ("So AI needs another weapon… an army"):
  - The camera tilts up into the vessel above the colony.
  - White cells drift to the wall and roll along it. One stops, flattens, and squeezes through a gap in the wall: diapedesis, with the cell drawn half above and half below the wall, joined through the gap.
- **2:17–2:18** ("It's called your immune system"): pulling back, more immune cells cross along the vessel and crawl toward the colony.
- **2:18–2:25** ("disguise / suppress / difficult to recognise"): three readable beats along the colony, staged left to right so the camera never reverses.
  - **Disguise:** a T cell probes a colony cell whose fingerprints withdraw into the membrane, and the T cell moves on.
  - **Suppress:** checkpoint shields rise at another contact, and that T cell greys out and stalls (it is still there, switched off, later on).
  - **Difficult to recognise:** two cells drift toward the healthy look, and a T cell passes them by.
- **2:24.8–2:26.4:** the camera pushes into the membrane of the cell that blended in.

### 2:25–2:46 / 0:45–1:06 — immune recognition and targeting (rebuilt)

- **2:26.0–2:26.4:** a continuous hand-off from that cell's membrane, keeping its position, size and curvature, onto the same curved membrane at molecular scale. MHC molecules stand on it: most hold ordinary peptides, and a few hold the tumour's fingerprints.
- **2:28.6–2:30.7:** an AI read sweeps along the membrane. Each MHC is checked, ordinary ones pass, and fingerprints are locked. Copies of the identified fingerprints lift away.
- **2:31–2:35:**
  - **Vaccine route:** the copies fly into vaccine particles. A dendritic cell takes them up and displays them, and a T cell is drawn in, docks, switches on and divides.
  - **Engineered route:** a culture bag beside it shows the engineered route (gene particle in, new receptors on, divisions).
  - The routes now sit in lymph-node stroma instead of plain teal lines.
- **2:35.4** (hard cut, new idea): the receptor close-up now sits between two real curved membranes, a T cell's and that tumour cell's. The receptor tip reshapes, then seats on the fingerprint, and only then comes a restrained highlight.
- **2:38.1–2:39.1:** the camera pulls straight back out of that contact into the treatment world. The trained T cell is docked on that same colony cell, so the receptor maps onto its biological structure with no style reset.
- **2:38.6–2:45.7** (recognise, lock, destroy, next, next): the T cell's membrane flattens against the target.
  - **Lock:** a synapse ring forms.
  - **Destroy:** granules cross, and the target dies by apoptosis.
  - **Next:** the T cell detaches and crawls round to the next cell (accelerating, then easing into contact).
  - **And the next:** two more trained cells kill, and the army closes on the colony as the camera pulls out.

### 2:46–3:00 / 1:06–1:20 — tumour scale (rebuilt)

- **2:46–2:51:** pulling out from the colony to the whole tumour, it now reads as a structure rather than a flat purple patch:
  - a raised, lobed mass
  - fibrous septa where the lobes meet
  - a lit rim and a cast shadow
  - the capillaries that feed it
- **The immune response at tumour scale:** trained T cells stream in along those capillaries and gather on the boundary. The boundary erodes unevenly where they work, as a greying band of dying cells, and changes shape coherently over time.
- **2:51–2:55:** the mass shrinks to nothing while macrophages clear the remains and healthy cells refill the space.
- **2:55–3:00:** a search through the healed tissue finds the few resistant survivors (same orange identity, same square markers). One divides, then divides again.

### 3:00–3:15 / 1:20–1:35 — blood test, DNA and analysis (rebuilt)

- **3:00–3:02:** survivors shed short double-helix fragments into the capillary beside them. A tumour fragment differs by exactly one changed base pair, shown as one orange rung; nothing glows magically.
- **3:02–3:06:** in the blood, these fragments are rare among normal ones.
- **3:06–3:08** ("By analyzing these signals"): a needle's bevel pierces the vessel and the flow carries the tracked fragment into it. A tube fills and separates into plasma over cells, with DNA fragments in the plasma.
- **3:07.9** (hard cut) **–3:10:** each fragment arrives, opens into its letters and drops into an alignment under a reference sequence (real A/C/G/T letters, no random code). At one position a few reads carry the changed base: the tumour is back.
- **3:11–3:12** ("identify how it's changing"): later reads add a second change at another position.
  - That changed letter travels to the protein it encodes.
  - The tumour's surface marker changes shape (square → triangle).
- **3:12–3:15** ("guide a new treatment"): the old binding shape comes down and stops on the new marker; the receptor is redesigned to the triangle and seats.

### 3:15–3:20 / 1:35–1:40 — precision attack (rebuilt)

- **Match cut:** from the redesigned shape to a resistant cell in tissue, whose markers change shape.
- **The old T cell:** its square-fitting receptors lose their grip and it drifts away.
- **The redesigned T cell:** steers in on a curve, brushes past a healthy cell without stopping, decelerates into contact (both membranes flatten), forms a synapse and delivers granules. The target dies by apoptosis; it is not an explosion.
- **3:19.3:** one continuous pull-out (cell → tissue → lung → the whole person).

### 3:19–3:30 / 1:39–1:50 — multiple tumours (rebuilt)

- **3:20–3:22:** the person's digital twin, a cyan computational model, separates from them.
- **3:22–3:24** ("Cancer isn't one disease"): tumours light up on the twin in five different organs, each in its own colour.
- **3:24–3:27:** the camera dives into one and pulls back across five tumours built differently, guided by a highlight that runs from one to the next. Each has its own surface-marker shape.
  - glandular rings
  - spindle-cell streams
  - a sheet of small round cells
  - pigmented nests in stroma
  - branching fronds
- **3:27–3:31** ("…doesn't need one universal drug"): one grey universal molecule reaches each tumour's marker and does not fit. Molecules designed for each marker then bind.

### 3:30–3:39 / 1:50–1:59 — connected mechanisms (rebuilt; replaces the circle-icon route)

This is one chain on one tumour, linked by matched shapes and motion:

1. **Studies:** a scan sweeps across the tissue, turning it into its model.
2. **Predicts:** the model is run forward. A dashed outer front shows where it would grow, and an inner front shows where treatment would push it back. Its weak region turns gold.
3. **Designs a targeted attack:** the camera pushes into the gold region, which becomes the target protein, and a designed molecule seats in its pocket.
4. **Activates the immune system:** the closed pocket hands over to a T cell docked on a dendritic cell. It switches on and divides, and the T cells move out.
5. **Watches:** the T cells ride into the blood, where a read line checks passing DNA fragments and flags the tumour one.

### 3:39–3:41 / 1:59–2:01 — "A different answer for every cancer"

Pulling back, each tumour resolves in its own way: from the inside, from the edge, or as a sweep across it. The change spreads through it (dying grey, then healthy coral) until healthy tissue is left.

### 3:41.6–3:51 / 2:01.6–2:11 — the single cell and the final image

- **3:41.6:** cut to the opening cell in the opening composition.
- **The cell is found:** the camera turns about 18° and moves closer, adding a lens foreground, so this differs from every earlier cell shot.
- **The kill:** a T cell steers in on a curve, recognises the cell and kills it by apoptosis, then leaves; a macrophage swallows the remains.
- **One retreat:** cell → alveoli → the lung, with its bronchi and arteries → the person. It ends on the opening framing without the lesion, with the circulation softly lit and a warm key light behind the chest. There is no outro or fade to black, so the loop back to the opening is kept.

## Technical

- **New shared art** (`source/src/v2/art/depth.tsx`):
  - edge-only lens bokeh, which never sits over the action
  - membrane flattening at contacts
  - an engulfing macrophage
  - a deterministic division lineage with overlap relaxation
  - an irregularity option for abnormal cells
- **Cross-world hand-offs:** a rotated hand-off (`mapCam`) keeps position, size and orientation across worlds (cell → membrane, contact → cell).
- **Render fix:** sub-pixel tissue layers are skipped at far zoom. The first full render timed out at 3:20.5 because of them.

## Edit structure

The cuts are deliberate and the rest is continuous:
- **Hard cuts in Part 2, one per new idea or place:**
  - 1:37.7: into the target protein (unchanged from V3)
  - 2:35.4: the receptor close-up
  - 3:07.9: the sequence read
  - 3:15.5: the match cut to the precision attack
  - 3:41.6: the opening cell
- **Everything else is a continuous move:** a zoom-through or motion-matched hand-off between scales, or the camera continuing inside one world.
- **No out-and-back:** nothing cuts away from a location and straight back, and no action is left before its result is seen.

## Review passes and what they found

These passes were done by measurement and dense still sequences, not by watching at normal speed (not possible here):
- dense contact sheets at 2 frames per second over all of Part 2
- frame strips at every shot boundary
- per-frame difference analysis for single-frame jumps

**Pass A (picture alone).** Checked that each beat reads without sound: cause before effect, and the same identities across scales. Fixes made:
- **Evasion beats:** they were crowded by the whole army. The beats were re-staged left to right, and the army was kept away from them.
- **Colony layout:** daughter cells could land on top of each other. Fixed with a relaxation step.
- **Multiple-tumour shot:** markers and drugs were too small in the wide shot. They were enlarged and the tumours grouped tighter.
- **Survivors:** they were hard to find during the search, so they now have a halo.

**Pass B (against the narration).** Every rebuilt event is placed from the measured word timings, and the sync effects were re-timed to match.

**Pass C (technical).** Fixes made:
- **Snap zooms:** a snap zoom into the membrane (2:25.7) and a snap pull-back from the receptor contact (2:37.9) were both lengthened.
- **Dying-ring pops:** the dying ring around the shrinking tumour changed look in one frame (2:51.6) and flipped its background colour (2:53.2); both are now continuous.
- **Static second:** one near-static second at 3:27 now has camera motion and an earlier drug beat.
- **Render timeout:** a render timeout at 3:20.5 is fixed.
- **Part 1:** Part 1 renders byte-identical to the V3 source (verified frame by frame on rendered stills, including the far-zoom shots).

## Measured: final 1080p review file

`exports/FGW_AI_Cancer_V4_REVIEW_1080p.mp4`. The file is git-ignored.

| Property | Value |
|---|---|
| Length | 3:51.17, 6,935 frames |
| Video | 1920×1080, 30 fps, H.264 CRF 16 |
| Audio | AAC 320k, 48 kHz |
| Size | 350,199,600 bytes |
| SHA-256 | c193a8ac…aa887c |

Results (`v4/qa/review4/`):
- **Loudness:** -14.1 LUFS integrated; -1.1 dBTP true peak.
- **Black frames, freezes (1.2 s or longer), low-activity seconds:** none.
- **Single-frame jumps:** only at the hard cuts listed above, plus motion spread across hand-offs:
  - 1:49.4: carrier into the vessel (unchanged from V3)
  - 2:26.8: the membrane camera starting to move
  - 2:38.1–2:38.2: the pull-back from the receptor contact
  - 3:07.8: the zoom into the tube

## Not verified, and remaining notes

- **No real-time viewing or listening:** the film has not been watched at normal speed or listened to here. Pacing, motion smoothness at 30 fps and the effect levels still need a real watch and listen.
- **Specimen architectures (3:24–3:41):** these are illustrative of how differently tumours can be organised. They are not labelled cancer types.
- **Hypothetical framing:** the treatments are shown as the narration's hypothetical future system. No on-screen text claims clinical results.

## 4K master

`exports/FGW_AI_Cancer_V4_4K_MASTER.mp4`. The file is git-ignored.

**How it was made.** It was rendered natively (`--scale=2`) from the same source as the final 1080p, in seven ranges of 1,000 frames, joined without re-encoding, with the same V4 mix added.

| Property | Value |
|---|---|
| Video | 3840×2160, 30 fps, H.264 CRF 16 |
| Frames | 6,935 |
| Length | 3:51.17 |
| Size | 844,734,673 bytes |
| SHA-256 | b4ea222b…6f75bd |

**Checks** (results in `v4/qa/master4k/`):

- **Decode:** the stream decodes in full with no errors.
- **Loudness:** -14.1 LUFS; -1.1 dBTP peak.
- **Picture checks** (on a 1080p proxy downscaled from the master):
  - Black frames, freezes and low-activity seconds: none.
  - Jumps: flagged at the same places as the 1080p.
  - Range seams: no jump at any of them.
  - One extra flag at 3:35.27: the end of the 0.3 s dissolve from the protein into the T cell, with the same frames as in the 1080p.
- **Native detail:** checked on a full-resolution crop at 3:16.5.

**Delivery split.** The master was also delivered in three lossless parts, cut at keyframes at frames 2000 and 4000; their decoded frames match the master frame for frame.

| Part | Range | Frames |
|---|---|---|
| `FGW_AI_Cancer_V4_4K_MASTER_part1of3.mp4` | 0:00–1:06.7 | 2,000 |
| `FGW_AI_Cancer_V4_4K_MASTER_part2of3.mp4` | 1:06.7–2:13.3 | 2,000 |
| `FGW_AI_Cancer_V4_4K_MASTER_part3of3.mp4` | 2:13.3–3:51.2 | 2,935 |

**Rejoining the parts:** list the three files in order in a concat list file, then run `ffmpeg -f concat -safe 0 -i list.txt -c copy FGW_AI_Cancer_V4_4K_MASTER.mp4`.

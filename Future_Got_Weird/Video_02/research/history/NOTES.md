# History notes: the three milestones before the 2026 consumer-LiDAR paper

Episode: "How Cameras See Around Corners" (Future Got Weird, Video 02). Covers the history act only.
Papers covered:
- (a) Velten et al. 2012, *Nature Communications* 3:745
- (b) O'Toole, Lindell & Wetzstein 2018, *Nature* 555:338
- (c) Nam et al. 2021, *Nature Communications* 12:6526 (PMC8586255)
- Plus any code or data for these papers that is reachable on GitHub.

Compiled 2026-10-08.

---

## 0. How these notes were sourced (read this first)

nature.com, arxiv.org, doi.org, ncbi/pmc, media.mit.edu, dspace.mit.edu, biostat.wisc.edu, re.public.polimi.it and api.openalex.org are all blocked from this container. Each fetch was tried once and failed with DNS or proxy 403 errors. I did not retry them, and I did not use any third-party fetch service.

| Tag | Meaning |
|---|---|
| `direct` | I read the primary text or figure myself. **Caveat for 2018:** the only full text I could read is a copy of the Nature PDF and Supplementary Information inside a **third-party GitHub mirror**, `github.com/chenyuege/C-NLOS-imaging-based-on-LCT` (HEAD `3613ea5`, last commit 2018-11-04). The PDF metadata matches the publisher's (Title "Confocal non-line-of-sight imaging based on the light-cone transform", Subject "Nature 555, 338 (2018). doi:10.1038/nature25489", InDesign CS6, created 2018-03-06). I have not checked it byte-for-byte against nature.com. SHA-256 hashes are in `evidence/PROVENANCE.txt`. |
| `code_or_data` | I inspected or ran released code or data. |
| `search_summary` | WebSearch reported it from the named page. I did not open that page. All Velten 2012 Methods text and all Nam 2021 text fall in this category. |

Evidence saved in `evidence/`. Everything there is for verification only and **not cleared for use in the episode**:
- `otoole2018_released_data_LCT_recon_montage.png`: our own NumPy LCT reconstructions of four of the 2018 supplementary datasets (Exit Sign, Diffuse S, Mannequin, Outside S). Made with `evidence/lct_port.py`, a port of the authors' `cnlos_reconstruction.m`.
- `velten2012_fig1_copy_from_thirdparty_mirror.jpg` and `velten2012_fig3_copy_from_thirdparty_mirror.jpg`: Velten 2012 Fig. 1 and Fig. 3, as copied into the same third-party mirror.
- `nam2021_authorsite_*.png`: frames and a pipeline diagram from the first author's own GitHub Pages site.
- `PROVENANCE.txt`: repo URLs, commit hashes and SHA-256 hashes.

---

## 1. One-screen summary for the script

| | 2012 Velten (MIT) | 2018 O'Toole (Stanford) | 2021 Nam (UW-Madison + PoliMi) |
|---|---|---|---|
| Published | 20 Mar 2012 (online) | 5 Mar 2018 online; issue 15 Mar 2018 | 11 Nov 2021 |
| Light source | Ti:Sapphire, ~50 fs pulses, 75 MHz, ~795 nm | ALPHALAS PICOPOWER-LD-670-50 diode laser, 670 nm, 30.6 ps, 10 MHz, 0.11 mW | OneFive Katana HP, 532 nm, 35 ps, 5 MHz, 700 mW |
| Detector | Hamamatsu C5680 streak camera. 2 ps bins, ~15 ps effective. Images one line on the wall. | One MPD PDM-series SPAD (100 µm), PicoHarp 300, 4 ps bins. System jitter ~60 ps (200 ps with filter). | Two 16×1 fast-gated SPAD arrays (PoliMi). "28 pixels" used. ~50 ps FWHM per the published Methods. |
| Geometry | Non-confocal: laser spot and observed line are different places on the wall | **Confocal**: laser and SPAD scan (nearly) the same wall point | Non-confocal, parallel multi-pixel; laser scans a sparse 190×22 grid |
| Hidden target | Small wooden artist's mannequin (~20 cm), letters, a 2 cm patch. **Diffuse.** | Mostly **retroreflective** (exit sign, letters, mannequin painted with retroreflective paint). One **diffuse** "S". | **Natural, non-retroreflective** objects and a person, live |
| Capture time | ~60 laser positions. Each readout is 100 ms, and 50–200 are summed per position. **Total not stated** in anything I read. | 0.1 s/point × 64×64 = **6.8 min** (exit sign). 1 s/point = **68 min** (diffuse S, mannequin). **1.7 min** outdoors (32×32). | **0.2 s per frame (5 fps)**, ~1 s latency |
| Reconstruction | Filtered backprojection (ellipsoid backprojection, then second-derivative filter) | Light-cone transform plus Wiener filter. 64×64×512 volume in **1 s** in MATLAB on a laptop. | Phasor-field "fast RSD" on GPU, live |
| Licence of article | **UNRESOLVED.** Possibly not CC-licensed (see §2.6). | **Not open access.** "© 2018 Macmillan Publishers Limited … All rights reserved." | **Probably CC BY 4.0. UNVERIFIED** (see §4.5) |
| Released code/data | None found | Code and 9 datasets were in the Nature Supplementary Information. Mirrored on GitHub (third party). Licence unstated. | Code (C++) and example raw data on the authors' UW page (blocked here). Not on GitHub. |

**Through-line, written as inference:** the hardware moved from a lab-bench streak camera and femtosecond laser (2012), to a single SPAD and ps diode laser with a closed-form algorithm (2018), to purpose-built SPAD arrays doing live video of ordinary objects (2021). The 2018 paper itself says (`direct`, main text p. 338): *"Our prototype system was built from the ground up, but commercial LIDAR systems may be capable of supporting the algorithms developed here with minimal hardware modifications."* That is a **proposed application** from 2018. It is a natural bridge to the 2026 consumer-LiDAR paper, but it is not evidence for it.

---

## 2. (a) Velten et al. 2012: "Recovering three-dimensional shape around a corner using ultrafast time-of-flight imaging"

### 2.1 Bibliographic

| Item | Value | Access / confidence |
|---|---|---|
| Authors | Andreas Velten, Thomas Willwacher, Otkrist Gupta, Ashok Veeraraghavan, Moungi G. Bawendi, Ramesh Raskar | search_summary (several searches agree); high |
| Journal | *Nature Communications* **3**, Article 745 (2012). doi:10.1038/ncomms1747 | search_summary, plus the citation as printed in O'Toole 2018 ref. 15 (`direct`: "Nat. Commun. 3, 745 (2012)"); high |
| Received / accepted / published | Received 12 Sep 2011. Accepted 13 Feb 2012. **Published 20 Mar 2012.** | search_summary. Only one search gave received/accepted. MIT DSpace also gives "March 20, 2012" (search_summary). Publication date high; received/accepted medium. |
| Correspondence | Ramesh Raskar | search_summary; medium |
| Companion paper | Gupta, Willwacher, Velten, Veeraraghavan & Raskar, "Reconstruction of hidden 3D shapes using diffuse reflections", *Opt. Express* 20, 19096–19108 (2012); arXiv 1203.4280 | `direct` (O'Toole 2018 ref. 17); high |
| Earlier concept paper | Kirmani, Hutchison, Davis & Raskar, ICCV 2009, pp. 159–166 ("Looking around the corner using transient imaging") | `direct` (O'Toole 2018 ref. 14); high. Use it to avoid saying "2012 invented the idea". |

### 2.2 Setup

The Methods could only be reached through search. Treat every number here as needing a check against the PDF before it goes on screen.

- **Laser:** Kerr-lens mode-locked Ti:Sapphire. Pulses ~50 fs at 75 MHz (one pulse every 13.3 ns), centred at 795 nm. search_summary (preprint and Methods wording; two searches agree on 75 MHz/13.3 ns); medium-high.
  - The companion *Opt. Express* paper gives ~500 mW average power. search_summary; medium.
  - **Discrepancy:** a related MIT patent (US 9148649) describes "80 fs, 790 nm, 800 mW". The script should use only "a femtosecond laser" or "pulses about 50 femtoseconds long".
- **Beam path:**
  - A glass plate splits off light to synchronise the laser and streak camera.
  - A second attenuated beam makes a "calibration spot" on the wall to correct timing jitter. Fig. 2 shows it (caption copy, `direct` via third-party mirror).
  - Two galvanometer mirrors scan the main beam. A 1 m focal-length lens gives a ~1 mm spot. search_summary; medium.
- **Detector:** Hamamatsu **C5680** streak camera. It images a single line on the wall, giving a 2D image of position along the line versus time. The time bin is 2 ps. Because of the camera's temporal PSF, the **effective time resolution is ~15 ps**. search_summary (two searches agree); medium-high. One search adds ~10% quantum efficiency (low).
  - Fig. 1b's axes run X 0–672 pixels and T 0–1 ns (`direct`, figure image via third-party mirror).
  - Secondary sources quote the streak camera's 2 ps as "0.6 mm of light travel". That is the camera spec, **not** the system's effective resolution.
- **Geometry:**
  - The camera looks at a dashed line segment on the "diffuser wall". The laser hits spots above or below that line, so single-bounce light does not enter the camera. search_summary; medium-high.
  - Fig. 1a shows ultrafast laser → beam splitters → galvo → wall point L → hidden object s → wall point w → streak camera, with an L-shaped occluder (`direct`, figure image via mirror).
- **Distances (low-medium, from fragments and a patent):**
  - Diffuser wall ~62 cm from the camera.
  - Wall ~40 cm high × 25 cm wide (one search only; low).
  - Mannequin ~20 cm tall, placed ~25 cm from the diffuser wall. Two searches and Physics World agree on 20 cm and 25 cm (medium).
- **Hidden objects:**
  1. A small wooden artist's mannequin, ~20 cm. Visible in Fig. 1a, with its reconstruction in Fig. 1c (`direct`, figure image via mirror). Photonics.com calls it a "wooden figurine".
  2. Three letters I, T, I at different depths. The "I" is 1.5 cm wide and all letters are 8.2 cm high (search_summary; medium).
  3. A 2 cm × 2 cm white patch used to explain the algorithm in Fig. 3 (`direct`, caption copy via mirror).
  - Some press coverage also mentions "foam cutouts".
- **Acquisition:**
  - About 60 laser positions, "in 3–5 lines" (search_summary). The Fig. 3 caption copy says "a set of 59 streak images" (`direct` via mirror).
  - Each streak-tube readout is a 100 ms exposure that averages ~7.5 million 13.3 ns laser periods. **50–200 such images are added** per position. search_summary; medium.
  - **Total acquisition time: UNRESOLVED.** My inference: 50–200 × 0.1 s × 60 positions ≈ 5–20 min of exposure, before overheads. A later preprint says early streak-camera setups needed "hours" (search_summary). **The sources conflict.** Do not state a number on screen. "Minutes to hours" is the safe phrasing only if a range is needed.
- **Reconstruction:**
  - Backprojection: each streak pixel (a wall position plus a time bin) votes for an ellipsoid of possible hidden points.
  - Votes are summed into a voxel "heat map" over all laser positions. A **second-derivative (Laplacian-type) filter** then sharpens it into a "confidence" volume.
  - Sources: Fig. 3 caption (`direct` via mirror: "After filtering with a second derivative, the patch location and 2-cm lateral size are recovered"); search_summary for the Methods.
  - O'Toole 2018 describes this family as backprojection "slightly sharpened by linear filters, such as a Laplacian [ref. 15]" (`direct`).
  - **Reconstruction run time: UNRESOLVED.** Not found.
- **Resolution claim (abstract):** "sub-millimetre depth precision and centimetre lateral precision over 40 cm × 40 cm × 40 cm of hidden space". search_summary, verbatim across several searches; high.
  - A supplementary statement says a translation perpendicular to the wall "can be resolved with a resolution of 400 µm" (search_summary; medium). This is a **precision of locating a surface**, not the size of the smallest visible detail. Lateral detail is centimetre-scale.
- **Limitations (authors):** "limited to diffuse reflection from near-Lambertian opaque surfaces. Parts of the object that are occluded from the diffuser wall or facing away from it are not reconstructed." search_summary; medium-high.
- **Cost:** several hundred thousand dollars for the streak camera plus femtosecond laser. **Secondary/press only.** Label it "reported" and avoid exact figures.

### 2.3 Figures (final journal numbering, as far as it can be established)

| Final Fig. | Content | Access |
|---|---|---|
| Fig. 1 | Set-up schematic (a), streak images (b), 2D projection of reconstructed mannequin (c) | `direct` (figure file `ncomms1747-f1` and caption copy in the third-party mirror) |
| Fig. 2 | Streak image with calibration spot | `direct` (caption copy via mirror) |
| Fig. 3 | Algorithm walkthrough with the 2 cm patch; 59 streak images | `direct` (figure file `ncomms1747-f3` and caption copy via mirror) |
| Mannequin multi-pose reconstruction / letters figure | **Final figure numbers UNRESOLVED.** The arXiv-style preprint labels the mannequin as "Figure 3: Complex Object Reconstruction in multiple poses", which differs from the final numbering. | search_summary |

### 2.4 Experiment date

**UNRESOLVED.** Only the publication dates are known. Received 12 Sep 2011, so the experiments were done in or before 2011. That is an inference. MIT's DSpace calls the manuscript "3DShapeAroundCornerRaskar2011", which is consistent.

### 2.5 Code and data

No code or data release was found on GitHub or anywhere else. The 2017 fast-backprojection paper (Arellano et al.) reportedly benchmarked on a "mannequin" dataset, with traditional BP 1873 s vs 19.4 s. That came from search_summary, and I did not verify that it is Velten's 2012 data. **UNRESOLVED.**

### 2.6 Licence and figure reuse: UNRESOLVED (do not reuse figures)

What is known:
- *Nature Communications* was **hybrid from 2010 to Oct 2014**. Authors chose either the subscription route or the open-access route with an APC. Before Dec 2012 the open-access route offered **two non-commercial CC licences**, and CC BY was added from Dec 2012. It became OA-only from 20 Oct 2014, and all back content became free to read in Jan 2016. search_summary (several sources agree); medium-high.
- Signals for this article **conflict**:
  - One search reported that the nature.com page metadata has `"isAccessibleForFree": false`.
  - MIT DSpace says the article "is made available in accordance with the publisher's policy and may be subject to US copyright law", which is the standard wording for non-CC items.
  - Mendeley, Wikidata and RePEc list it as open access or free to access.
  - No source showed a Creative Commons line for ncomms1747.
- **The brief's hypothesis "CC BY-NC-SA 3.0" is unverified.**

Practical conclusion (inference):
- Even if it turned out to be CC BY-NC-SA 3.0, *NonCommercial* is a problem for a monetised channel, and *ShareAlike* would attach to the adapted work.
- If it is a subscription article, the figures are © Nature Publishing Group and need permission (RightsLink).
- **Either way: do not reuse Velten 2012 figures. Redraw the geometry as an original diagram, credit the paper in the description, and label the redraw "diagram based on Velten et al. 2012".**
- To settle the licence, someone must open the "Rights and permissions" box at nature.com/articles/ncomms1747 in a normal browser.

---

## 3. (b) O'Toole, Lindell & Wetzstein 2018: "Confocal non-line-of-sight imaging based on the light-cone transform"

### 3.1 Bibliographic (all `direct` from the mirrored PDF unless noted)

- *Nature* **555**, 338–341, issue dated **15 March 2018**. Letter. doi:10.1038/nature25489.
- Received 29 Aug 2017. Accepted 3 Jan 2018. **Published online 5 Mar 2018.**
- Authors: Matthew O'Toole, David B. Lindell, Gordon Wetzstein, Department of Electrical Engineering, Stanford University.
- Contributions:
  - M.O'T. built the setup, did the indoor measurements and implemented the LCT.
  - M.O'T. and D.B.L. did the outdoor measurements.
  - D.B.L. did the iterative reconstructions.
- Experiment dates: **not stated** (before submission on 29 Aug 2017; inference).

### 3.2 Hardware (Supplementary Methods, "Equipment details", `direct` from the mirrored SI PDF)

- **Detector:** Micro Photon Devices **PDM-series SPAD**. 100 µm × 100 µm active area, reported 27 ps jitter, 40.9 dark counts/s.
  - Time-stamping by **PicoHarp 300** TCSPC at **4 ps** resolution.
  - 75 mm achromatic doublet (Thorlabs AC254-075-A-ML). Laser-line filter Thorlabs FL670-10, used **only outdoors**.
- **Laser:** **ALPHALAS PICOPOWER-LD-670-50**. 670 nm pulsed laser diode, reported **30.6 ps** pulses, **10 MHz**, **0.11 mW** average.
- **Co-axial optics:** a polarising beamsplitter (Thorlabs PBS251) aligns the detector with the source.
  - A 2-axis galvanometer (Thorlabs GVS012) raster-scans **both the illumination and detection spots** across a wall **~2 m** from the system, at an oblique angle.
- **Timing:** whole-system jitter ~**60 ps** (Fig. 1b: "FWHM = 60 ps"). It rises to ~200 ps with the line filter on.
- **SPAD behaviour:** dead time ~75 ns; ~0.1% afterpulsing. The SPAD detected 0.29–1 million counts/s across the experiments.

### 3.3 The confocal geometry: "same point", with a nuance

- Main text (`direct`): *"Whereas previous NLOS acquisition setups exhaustively illuminate and image pairs of distinct points on a visible surface (such as a wall), the proposed system illuminates and images the same point (Fig. 1) and raster-scans this point across the wall to acquire a 3D transient … image."*
- Nuance (SI, `direct`): the SPAD is free-running (not gated), so the direct wall reflection is overwhelming. They therefore *"illuminate and image two slightly different points on a wall to reduce the contribution of direct light. The distance between these points should be sufficiently small so as to not affect the confocal image formation model."*
- **Safe script wording:** "the laser and the detector look at (almost) the same spot on the wall, and that spot is scanned".

### 3.4 The light-cone transform (main text, `direct`)

- The measurement model is eq. (1). For a hidden point at distance r from the scanned wall point, the round trip is 2r = ct.
  - Signal falls as **1/r⁴** for diffuse objects and **1/r²** for retroreflectors (the "minor modification").
- The model assumes:
  - single scattering behind the wall,
  - isotropic scattering (Lambert cosine terms ignored),
  - no occlusions in the hidden scene.
- The key step is the change of variables **u = z², v = (tc/2)²**. It turns the shift-variant "light cone" integral into an ordinary **3D convolution**, R_t{τ} = h ∗ R_z{ρ}. The authors call eq. (2) the light-cone transform. It is "closely related to Minkowski's light cone".
- Inversion is a closed form (eq. 3): resample the time axis, apply a **Wiener filter** in 3D Fourier space, then resample the depth axis.
  - Cost is O(N³ log N) operations and O(N³) memory, against O(N⁵) for backprojection.
- Resolution bounds (eq. 4): Δz ≥ cγ/2 and Δx ≥ c·√(w² + z²)·γ / (2w). Here γ is the timing FWHM and 2w is the scanned wall width.
  - In SI: 60 ps timing over a 40 cm × 40 cm scan gives predicted lateral resolution ≈ **2 cm at z = 40 cm** and **3.1 cm at z = 65 cm**. A retroreflective resolution chart confirmed this (SI Fig. 4).
- The 2018 paper explicitly frames the 2012 reconstruction family as backprojection that "do[es] not solve the inverse problem". **That is the authors' claim.**

### 3.5 Experiments: keep each one's conditions separate

From SI Table 1 and the SI text (`direct`):

| Scene (SI fig.) | Retro? | Wall samples | Scanned area | Exposure / point | Total exposure | Notes |
|---|---|---|---|---|---|---|
| Res. chart 40 cm / 65 cm (SI Fig. 4) | Yes | 64×64 | 0.4 × 0.4 m | 0.1 s | ≈6.8 min (computed) | Line widths 3, 2, 1.5, 1, 0.5 cm |
| Dot chart 40 / 65 cm (SI Fig. 4) | Yes | 64×64 | 0.4 × 0.4 m | 0.1 s | ≈6.8 min | 3×3 dots, 3.2 cm diameter, 10 cm apart |
| **Exit Sign** (main Fig. 3a,b; SI Fig. 5) | Yes (traffic sign) | 64×64 | **0.8 × 0.8 m** | 0.1 s | **6.8 min** (main text) | Sign 0.61 × 0.61 m. **LCT runtime 1 s** for 64×64×512 on a MacBook Pro (3.1 GHz i7). |
| SU (SI Fig. 6) | Yes | 64×64 | 0.7 × 0.7 m | 0.1 s | ≈6.8 min | Two partly occluding letters |
| **Mannequin** (SI Fig. 7) | **Yes: "coated with a retroreflective paint"** | 64×64 | 0.7 × 0.7 m | **1 s** | ≈68 min (computed) | **Not the same as the 2012 diffuse mannequin. Do not conflate.** |
| **Diffuse S** (SI Fig. 8) | **No (diffuse)** | 64×64 | 0.7 × 0.7 m | **1 s** | **68 min** (SI text) | Measurements "significantly noisier". Reconstruction quality "slightly lower than for retroreflective objects", with priors. |
| **Outside S** (main Fig. 3c; SI Fig. 9) | Yes | **32×32** | **1 × 1 m** | 0.1 s | **1.7 min** | **Indirect sunlight, ~100 lx.** Object 0.76 × 0.51 m, placed **115 cm** from a light-and-dark stone wall. Occluder was black cloth. MATLAB reconstruction of 32×32×1024 in **0.5 s**. |
| Tracking (SI Fig. 13) | Yes (planar traffic sign) | **3 points**, ~60 cm apart | — | 0.1 s | — | 3D position by intersecting three spheres at **~3 Hz**. This is **tracking, not reconstruction.** |

**Processing pipeline (SI, `direct`):**
- Raw histograms have 25,000 bins × 4 ps.
- They are aligned so the direct pulse sits at t = 0, then cropped to 2048 bins (indoor) or 4096 bins (outdoor).
- The first 600 bins are zeroed to remove the direct component.
- They are then downsampled ×4 to **16 ps** bins (512 or 1024 bins).

**Other findings (SI Supplementary Fig. 1, `direct`):**
- Measured radiometric falloff: diffuse patch ∝ 1/r⁴, "diamond grade" retroreflector ∝ 1/r², "engineering grade" retroreflector ∝ 1/r^2.3.
- A simulation recovered a bunny at 1024³ voxels with a median absolute error of 2.5 mm (main Fig. 4, simulated). Label this **simulation**, not experiment.

**Distinctions for the script:**
- **Capture time vs. algorithm time:** 6.8 min to capture vs. 1 s to reconstruct the exit sign. Never present "1 second" as how long it took to see around the corner.
- **Retroreflective vs. diffuse:** the outdoor and fast results are all retroreflective. The diffuse "S" took 68 min indoors.
- **"Real-time"** in 2018 means **tracking** a retroreflective sign at ~3 Hz. Full imaging was not real time. The paper lists three improvements still needed for real-time C-NLOS (`direct`):
  1. a more powerful laser, possibly SWIR for eye safety,
  2. parallel SPAD-array capture for retroreflective objects,
  3. a GPU or FPGA implementation.

### 3.6 Licence

- **Not open access.** The page footer of the PDF reads "© 2018 Macmillan Publishers Limited, part of Springer Nature. All rights reserved." (`direct`). Figures need publisher permission.
- **Data Availability** (`direct`): "The measured C-NLOS data and the LCT code supporting the findings of this study are available in the Supplementary Information. Additional data and code are available from the corresponding authors upon request."

### 3.7 Code and data on GitHub (authentic, but licence unclear)

- **Supplementary code + 9 datasets**, mirrored by a third party at `github.com/chenyuege/C-NLOS-imaging-based-on-LCT` (2018, Chinese-language study notes; `code_or_data`). The folder `confocal_nlos_code/` holds:
  - `cnlos_reconstruction.m`, whose header reads "Confocal Non-Light-of-Sight (C-NLOS) reconstruction procedure for paper titled … by Matthew O'Toole, David B. Lindell, and Gordon Wetzstein".
  - `definePsf.m`, `resamplingOperator.m`.
  - `data_resolution_chart_40cm.mat`, `data_resolution_chart_65cm.mat`, `data_dot_chart_40cm.mat`, `data_dot_chart_65cm.mat`, `data_mannequin.mat`, `data_exit_sign.mat`, `data_s_u.mat`, `data_outdoor_s.mat`, `data_diffuse_s.mat`.
  - A `linearized_admm/` folder with its own README: "Stanford Computational Imaging Lab 2018".
  - The mirror owner notes that ADMM folder was "not in the Nature supplementary material, but provided by the authors' lab". **This implies** `confocal_nlos_code/` itself **was** the Nature supplement.
- **Why I think the data are authentic** (`code_or_data`):
  - Each indoor file holds `rect_data` of 64×64×2048 (4 ps bins), and outdoor holds 32×32×4096. The `width` variable is a half-width of 0.4 / 0.35 / 0.2 / 0.5 m, which matches SI Table 1's 0.8 / 0.7 / 0.4 / 1.0 m scan areas and bin counts exactly.
  - A second, unrelated mirror (`github.com/ritik3041998/Aw_nlos`, 2026) has byte-identical files for every file in common.
  - Running my NumPy port of the LCT gives clearly recognisable reconstructions: an "EXIT" sign with an arrow, a diffuse "S", a standing mannequin and an outdoor "S" (`evidence/otoole2018_released_data_LCT_recon_montage.png`). Each took 1–5 s in NumPy.
  - This counts as **re-running released data**. It is **not independent replication**.
- **Licence of the data and code: not stated.** The code has no licence file. Aw_nlos describes the data as "released by the Stanford Computational Imaging Lab for research use". Supplementary Information is normally under publisher copyright.
  - **Treat as research-use only. Not cleared for broadcast.** A display of our own reconstructions of their data would need the authors' permission or legal review.
- **Official Stanford GitHub** (`code_or_data`): `github.com/computational-imaging/nlos-fk`, HEAD `d34d49f`, 2022-06-19.
  - This is the code for the **2019** follow-up (Lindell, Wetzstein & O'Toole, "Wave-Based NLOS Imaging using Fast f-k Migration"). It includes FBP, **LCT**, f-k and phasor-field reconstructions in `cnlos_reconstruction.m`.
  - **Its datasets are not in the git repo.** They are downloaded from the project page, which I could not reach.
  - The README describes the datasets:
    - **diffuse** white stone statue, ~1 m from the wall, 512×512 scan of a 2 m × 2 m wall, 10/30/60/180 min exposures,
    - "Interactive" person in a **retroreflective outfit** at 32×32 @ 4 fps or 64×64 @ 2 fps,
    - outdoor scan of a 2 m × 2 m stone building wall at 128×128, 10/30/50 min,
    - 32 ps bins.
  - **Licence:** Stanford "academic and other non-commercial purposes" only. Not usable for a monetised video without permission.
  - This is a 2019 paper, outside the brief. It is listed because it shows that a **diffuse** statue needed **10–180 min** in that era.

---

## 4. (c) Nam et al. 2021: "Low-latency time-of-flight non-line-of-sight imaging at 5 frames per second"

### 4.1 Bibliographic

| Item | Value | Access / confidence |
|---|---|---|
| Exact title | "Low-latency time-of-flight non-line-of-sight imaging at 5 frames per second" | search_summary (many searches), plus `direct` on the first author's site (`jihyun-nam.github.io`, `_sections/publications.html`); high |
| Authors | Ji Hyun Nam, Eric Brandt, Sebastian Bauer, Xiaochun Liu, Marco Renna, Alberto Tosi, Eftychios Sifakis, Andreas Velten | `direct` (author's site) and search_summary; high |
| Affiliations | University of Wisconsin–Madison, plus Politecnico di Milano (Renna and Tosi: SPAD arrays) | search_summary; medium-high |
| Journal | *Nat. Commun.* **12**, 6526 (2021). doi:10.1038/s41467-021-26721-x. PMID 34764273. PMCID PMC8586255. | search_summary; high |
| Published | **11 Nov 2021** | search_summary (several agree); high |
| Received / accepted | **UNRESOLVED** | — |
| Preprint | arXiv 2010.12737, "Real-time Non-line-of-Sight imaging of dynamic scenes", submitted 24 Oct 2020. Six authors (no Renna or Tosi). | search_summary; medium-high. **Numbers differ between the preprint and the published version (see below). Use the published version.** |
| Experiment date | **UNRESOLVED.** Before Oct 2020 (inference from the preprint date). | — |

### 4.2 Setup

All search_summary unless marked.

- **Laser:** OneFive **Katana HP**, **532 nm**, **35 ps** pulses. Operated at **700 mW**, **5 MHz** (two searches agree; medium-high).
  - A separate PoliMi sensor paper mentions ~400 mW at 5 MHz. That is a **different paper; do not use it.**
- **Detectors:** **two 16×1-pixel fast-gated SPAD arrays** "designed specifically for NLOS imaging" (PoliMi; the Renna et al. *Instruments* 4(2):14, 2020 paper describes the 16×1 array). They are mounted side by side with Nikon 50 mm f/1.2 lenses and focused on a line of patches in the middle of the relay wall.
  - The abstract says "a total of just **28 pixels**". Two 16-pixel arrays would be 32, so presumably 4 pixels were unused. **That is an inference; unresolved.**
  - Each pixel sees ~5 mm² of wall. The array footprint on the wall is ~8 cm wide.
  - Fast gating keeps the SPAD off during the first bounce. The 2018 system lacked this.
  - Each array has a 532 nm band-pass filter with 3 nm FWHM (Thorlabs FL532-3, per the preprint) to reject ambient light.
- **Timing resolution: discrepancy.** The published Methods give ~**50 ps FWHM** with 200 ns dead time. The preprint gives 75 ps per array and ~85 ps combined with the laser. Use the published number if one is needed.
- **TCSPC:** PicoQuant **HydraHarp 400**, 8 channels (preprint; medium).
- **Scan:**
  - The laser scans a **sparse 190 × 22** grid on the relay wall.
  - Photons are remapped into a **virtual 1.9 m × 1.9 m aperture with 190 × 190** points.
  - The phasor-field virtual wavelength is **8 cm**.
  - Exposure is **0.2 s per frame**, so **5 fps**.
  - The authors note that a confocal scan at 0.2 s "was not possible with our galvo mirrors".
- **Camera to relay wall:** ~2 m (one search only; low).
- **Hidden-scene depth:** the reconstruction extends to z_max = 3 m in the preprint, which averages 3 frames at that depth. One search said "1 m to 3.5 m, limited by the TCSPC time range", but a second search could not confirm it. **Unresolved beyond "metres-scale".**
- **Reconstruction:** phasor-field **fast Rayleigh–Sommerfeld diffraction (RSD)**, written in C++ with CPU multithreading plus GPU (CUDA).
  - The pipeline is "acquisition-bound and easily supports a throughput of **5 fps with a latency of 1 second**" (quote via search_summary).
  - Depth-dependent frame averaging is used, because depth is known per voxel.
- **SNR design:** the authors claim SNR, motion blur, angular resolution and depth resolution are all **independent of scene depth**. The target SNR is set equal to the SNR at z₀ = 1 m. This is an **authors' modelling claim**.
- **Ambient light:** experiments were run with **room lights on** (search_summary).

### 4.3 Results and figures

- **Fig. 4, "NLOS letterbox"** (search_summary; medium-high):
  - Eight sample frames from a 20 s real-time video in which a person takes the letters N, L, O, S out of a box.
  - Rows: ground-truth camera view, RSD reconstruction, and depth-dependent frame averaging.
  - Maximum motion speed ~**0.4 m/s**, from the 200 ms exposure and 8 cm resolution.
- **Fig. 5:** live hardware layout and laser beam path (search_summary).
- **Supplementary video(s):** more live results. The authors' project page describes a person moving a digit "4" target, exercising and throwing a toy, and says the system "can even reconstruct a mirror" (search_summary).
- **Framing claim** (authors, via search_summary): previous live time-of-flight NLOS reconstructions needed retroreflective targets, "which return signals at least 10,000 times higher than diffuse surfaces". This system works with **natural, non-retroreflective** objects. Label it "**reported by the authors**".
- **Room-scale:** the paper claims the method "enables the reconstruction of room-sized scenes … in seconds". The specific Fig. 4 scene size is **unresolved**. Say "a hidden area a few metres across" at most, or avoid a number.
- **Author-site material** (`direct`, `github.com/jihyun-nam/jihyun-nam.github.io` @ `94eb5d5`):
  - `realtimevideo.gif` (500×376, 778 frames × 70 ms ≈ 54 s) shows the lab: a green 532 nm laser line on the relay wall, a black-curtain occluder, a person behind it, and the live reconstruction on a monitor, including a digit "4".
  - `realtime.gif` shows reconstructed frames of a person.
  - `main_pipeline_new.PNG` is a pipeline diagram: raw photon stream → photon remapping → virtual complete aperture → FDH → fast RSD → frame averaging → real-time video.
  - Frames are in `evidence/`. **Rights unclear.** The repo's CC BY 3.0 LICENSE.md belongs to the Jekyll theme, not the research images.

### 4.4 Code and data

- The paper's Code and Data availability both point to **https://biostat.wisc.edu/~compoptics/rt_nlos21/rt_nlos.html**, described as C++ source plus "example raw data files recorded using the described hardware setup" (search_summary). That domain is blocked here, so the files and their licence are **unverified**.
- **No GitHub release found.** Probes of plausible names (compoptics/*, UW-Madison-Computational-Optics/*, Velten/*) returned nothing.
- The first author's site links a YouTube video, `https://www.youtube.com/watch?v=QtMfb8H_1kM` (`direct`, link only; not viewed). The rights to clips are the authors'.

### 4.5 Licence

- **Probably CC BY 4.0, unverified.** *Nature Communications* has been OA-only since Oct 2014, with CC BY 4.0 as the default. The article is in PMC and DOAJ.
- I could not see this article's own "Rights and permissions" line. **Check it before reusing any figure.**
- If it is confirmed as CC BY 4.0, the figures (e.g. the Fig. 4 letterbox frames) can be reused **with attribution and an indication of changes**. Third-party material inside the article would be excluded if marked.
- Whether the Supplementary Movie falls under the same licence is **unresolved**.

---

## 5. Claim classification for the history act

| Claim | Category |
|---|---|
| Light that bounces off a wall, a hidden object and the wall again carries timing information about the hidden object | Experimentally supported (all three papers) |
| 2012: 3D shape of a ~20 cm diffuse mannequin recovered around a corner with a streak camera and femtosecond laser | Experimentally supported (Velten 2012). Details are search_summary only. |
| 2012: "sub-mm depth precision, cm lateral precision over a 40 cm cube" | Reported by authors (abstract) |
| 2018: confocal scanning plus LCT gives a closed-form, ~1 s reconstruction | Experimentally supported, for the stated 64×64×512 volume and laptop. The capture still took 6.8 min. |
| 2018: works outdoors in indirect sunlight | Experimentally supported **for a retroreflective object** (1.7 min, 32×32) |
| 2018: diffuse objects can be imaged | Experimentally supported (Diffuse S, 68 min, indoors). Noisier. |
| 2018: real-time tracking | Experimentally supported for a **retroreflective sign at ~3 Hz from 3 points**. This is tracking, not imaging. |
| 2018: commercial LiDAR might run these algorithms with minimal changes | **Proposed application** (authors, 2018) |
| 2021: live NLOS video of non-retroreflective objects at 5 fps, ~1 s latency | Experimentally supported (Nam 2021), per search_summary. Room lights on. |
| 2021: retroreflectors return ≥10,000× more signal than diffuse surfaces | Reported by authors |
| 2021: very large scenes may be possible because SNR does not depend on depth | Authors' modelling claim / proposed |
| Running the 2018 released data reproduces the published shapes | Code_or_data re-run by us. **Not independent replication.** |
| "Each step got faster / cheaper / more practical" | Inference (narrative), supported by the numbers above. Do not quote a cost for 2018 or 2021; none was found. |

---

## 6. Do-not-conflate list (history act)

1. **Two different mannequins.**
   - 2012: a small *diffuse* wooden artist's mannequin, streak camera.
   - 2018: a mannequin *coated with retroreflective paint*, 1 s per point, 64×64 scan (~68 min).
2. **"1 second" (2018)** is the LCT **computation** for the exit sign. Capture was **6.8 min**.
3. **"Outdoors" (2018)** was a **retroreflective** 'S' under ~100 lx indirect sunlight, not a diffuse object in daylight.
4. **"Real-time" (2018)** is **3 Hz tracking** of a retroreflective sign. The **5 fps imaging** is 2021, of non-retroreflective objects, with 0.2 s exposure and ~1 s latency.
5. **2012 resolution:** "sub-millimetre" is **depth precision** of locating a surface. Lateral detail is centimetre-scale. The streak camera's 2 ps is a bin size; the effective resolution was ~15 ps.
6. **Velten 2012 total acquisition time** is **unknown** (minutes to hours). Do not invent it.
7. **Publication vs. experiment dates.** Only publication dates are known: 20 Mar 2012, 5 Mar 2018 (online) / 15 Mar 2018 (issue), and 11 Nov 2021. The 2021 preprint is 24 Oct 2020.
8. **Code availability is not replication.** The 2018 data re-run here and the 2019 nlos-fk code both come from the same Stanford group.
9. **Hardware is not shared across papers.** 2018 used 670 nm and a single SPAD. 2021 used 532 nm and two 16×1 SPAD arrays. The 2026 paper's devices are different again (see `../manuscript/NOTES.md`).

---

## 7. Reuse guidance (rights)

| Material | Status | Recommendation |
|---|---|---|
| Velten 2012 figures | Licence **unresolved**. Either © NPG or a CC non-commercial licence; both are problematic for a monetised channel. | Redraw as original diagrams. Cite the paper. |
| O'Toole 2018 figures | © Springer Nature, all rights reserved | Redraw. Do not reuse without permission. |
| O'Toole 2018 Supplementary data (mirrored) | Authentic, re-runnable. Licence unstated; described as "research use". | Our reconstructions are internal reference only unless the authors grant permission. |
| Stanford nlos-fk code/data (2019) | Academic/non-commercial licence | Do not use in the video without permission. |
| Nam 2021 figures | Probably CC BY 4.0, **unverified** | If confirmed, reuse is possible with attribution plus "adapted" notes. Check the Rights line first. |
| Nam author-site GIFs / YouTube | Rights unclear (authors) | Reference only. Ask the authors if behind-the-scenes footage is wanted. |

---

## 8. Unresolved items (need a normal browser on nature.com / PMC / biostat.wisc.edu)

1. Velten 2012 licence: open the "Rights and permissions" box on nature.com/articles/ncomms1747.
2. Velten 2012 total acquisition time, reconstruction run time, and final figure numbers for the mannequin-pose and letters figures.
3. Velten 2012 exact wall dimensions and the camera-to-wall distance (62 cm came from a patent and a fragment).
4. Velten 2012 data availability (none found).
5. Nam 2021: licence line, received/accepted dates, Fig. 4 scene size and distances, and whether "28 pixels" means 32 minus 4 inactive.
6. Nam 2021: contents and licence of the code and example data on the biostat.wisc.edu project page.
7. O'Toole 2018: byte-level match of the mirrored PDF, SI and data against the nature.com Supplementary Information (the mirror is consistent with the paper, but its provenance is third-party).
8. All experiment dates.

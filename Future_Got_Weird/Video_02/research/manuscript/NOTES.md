# Manuscript notes: arXiv 2605.17865 (v1) and how it relates to the Nature article

Episode: "How Cameras See Around Corners" (Future Got Weird, Video 02)
Scope: methods details of the author manuscript arXiv:2605.17865v1, "Imaging Hidden Objects with Consumer LiDAR via Motion Induced Sampling" (Somasundaram, Young, Dave, Pediredla, Raskar), and how it differs from the final Nature article (doi 10.1038/s41586-026-10502-x).
Compiled: 2026-10-08.

## 0. How these notes were sourced (read this first)

arxiv.org, nature.com, media.mit.edu, cornar.media.mit.edu, ncbi/pmc, doi.org, ieee and Google Drive are all blocked from this container. I did not read the manuscript PDF or HTML myself. Every manuscript statement below therefore comes from one of these routes:

| Tag | Meaning | What it covers here |
|---|---|---|
| `direct` | I read the primary material myself | The authors' own project-page HTML and result videos, recovered from the git history of the first author's site repo `github.com/sidsoma/sidsoma.github.io` (cloned to `/home/user/ext_sources/sidsoma_site/repo`), plus the author CV and `papers.js` in that repo. |
| `code_or_data` | I inspected the released code and data | `github.com/sidsoma/consumer-nlos` at commit `15314de422a765a2d1b72ea7037dfafb2f908d7c` (`/home/user/ext_sources/consumer-nlos`). |
| `search_summary` | WebSearch reported it from the named page; I did not open that page | All arXiv text, section numbers and figure numbers, plus Nature metadata and captions. Short quotes in this file are as the search tool returned them. |

Treat every `search_summary` quote as needing a check against the PDF before it goes on screen word for word. Where two searches disagreed, I say so.

Evidence saved alongside this file, in `evidence/`:
- `projectpage_sidsoma_github_io_commit48b57f43_2026-05-14.html`: the authors' project page as it stood on 2026-05-14, before it was moved to cornar.media.mit.edu.
- `*_tile.jpg`: six-frame contact sheets from the five result videos on that page.
- `st_module_crop.jpg`: the "$10 Sensor" inset from the ST demo video.
- `combo.jpg`: first and last frames from four of the videos.
- `apps.jpg`: the page's rendered application illustrations. These are illustrations, not data.
- `projectpage_video_metadata.txt`: duration, container creation_time and sha256 prefix for each video.

These images belong to the authors. They are kept here for verification only and are not cleared for use in the episode.

---

## 1. Versions, titles and dates. Keep these separate in the script.

| Item | Value | Source / access |
|---|---|---|
| Nature: received | 28 Aug 2025 | Nature article page, `search_summary` (one search). |
| Nature: accepted | 7 Apr 2026 | Nature article page, `search_summary`. The MIT project listing shows an "Apr. 2026" Nature entry, which fits acceptance, `search_summary`. |
| Nature: published online | 20 May 2026. Version of record 20 May 2026. | Nature page and PubMed ("Epub 2026 May 20"), `search_summary`. Several searches agree. |
| Nature: issue | Vol. 653, issue 8115, issue date 21 May 2026, pp. 693–699 | Nature page and PubMed, `search_summary`. A Nature back-issue listing separately puts issue 8115 under 21 May 2026. |
| Nature title | "Imaging hidden objects with consumer LiDAR via **motion-induced** sampling" | Nature page, `search_summary`. Repo README bibtex uses "motion induced", `code_or_data`. |
| arXiv title | "Imaging Hidden Objects with Consumer LiDAR via **Motion Induced** Sampling" (no hyphen) | arXiv listing, `search_summary`. |
| arXiv v1: submitted | 18 May 2026, cs.CV | arXiv abs listing, `search_summary`. A chatpaper listing shows "cs.CV 19 May 2026", which is probably the announcement date. |
| arXiv later versions | **None found.** Every source seen mentions v1 only. | `search_summary`. arXiv itself is blocked, so a v2 cannot be ruled out. Status: unresolved. |
| Author site, arXiv link | Link to `arxiv.org/abs/2605.17865` added 2026-05-19 23:21 -0400. It was removed and re-added the same evening. | `direct`: git log of `sidsoma.github.io`, file `papers.js`. |
| Project page | Built 2026-05-01 to 05-14 on sidsoma.com/consumer-nlos. Redirected to cornar.media.mit.edu on 2026-05-16. Its "Paper" and "arXiv" buttons both pointed to a Google Drive PDF (unreachable from here). | `direct`: git log. |
| Author CV (site repo, last changed 2026-09-06) | Lists the paper as "Nature (to appear)" | `direct`. |
| Code repo history | First commit 2025-10-17. Paper code and data uploaded 2025-10-20. Camera-localization code 2025-11-26. Reconstruction code and data 2025-12-04. Plug-and-play ST demo 2026-05-20. Current HEAD 2026-07-23. | `code_or_data`: `git log`. |
| **Experiment dates** | **Not stated anywhere I could reach. Unresolved.** | The only clues are the container creation_time stamps of the project-page videos. Those record when a file was exported, not when data was captured. Main-device diffuse tracking video: 2025-08-19. ST demo and hand-tracking videos: 2025-09-10. Handheld camera-localization and reconstruction videos: 2026-05-05. They are listed here only to show that some capture predates submission. Do not quote them as experiment dates. |

**Do not combine dates in the script.** "Published in Nature in May 2026" (20 May online, 21 May issue) and "posted to arXiv on 18 May 2026" are publication events. The experiments happened earlier, and their dates are unknown.

---

## 2. Hardware. Two device families (plus one unnamed dataset) that must stay separate.

### 2A. The "smartphone-grade LiDAR" behind the main manuscript results

- The manuscript states: "In our experiments, we use a portable smartphone LiDAR system with ∼100 pixels, each consisting of a co-located laser emitter and single-photon avalanche diode (SPAD) sensor." Also: "Each SPAD pixel shares an optical axis with exactly one laser spot." And: "All pixels and laser spots are active simultaneously." `search_summary`, arXiv v1, setup and supplementary text. Several searches agree. IEEE Spectrum (C. Q. Choi, 20 May 2026) paraphrases the same "about 100 pixels". `search_summary`.
- The manuscript compares the setup to O'Toole et al.: it is "similar to the confocal capture setup used by O'Toole et al. [16]" but "integrated onto an existing smartphone-grade LiDAR." `search_summary`.
- **Vendor and model: unresolved.** No source I reached names the device. The Nature competing-interests statement reads "The authors declare no competing interests". Acknowledgments name only NSF GRFP grant 2141064 (S.S. and A.Y.) and NSF grant 2326904 (A.P.). The acknowledgments are `direct` from the project-page snapshot; the competing-interests line is `search_summary`. Press coverage repeats "smartphone-grade" and gives no model.
  - Context only, not evidence: an earlier MIT Media Lab paper with the same first author (ICCP 2024, "Handheld Mapping of Specular Surfaces using Consumer-Grade Flash LiDAR") had an Apple-affiliated coauthor and used "a consumer-grade multi-beam flash lidar … on a portable smartphone" (`search_summary`). That does **not** establish which device this paper used, and the script must not name or imply a manufacturer.
- What the videos show (`direct`, author videos). The tracking, hand-tracking, handheld-localization and reconstruction videos all show a small phone-shaped device, labelled "camera", connected by a cable. It sits on a tripod, is held in the hand, or rides on a 2D gantry. It is not the ST module, which appears only in the ST video with a "$10 Sensor" inset.
- **Not found for this device:** timing bin width, field of view, laser wavelength, laser power or eye-safety class, zone layout, and the exact pixel count beyond "∼100". The manuscript says only that consumer laser power is low "due to eye safety constraints". No numeric class or power figure was found. All unresolved.
- Capture rate. Table 1 of the manuscript lists "short-exposure capture (30 Hz)" as a practical constraint (`search_summary`). The project page labels the main-device tracking result "Tracking an object in real-time (30 Hz)" (`direct`). The supplement describes the diffuse person-tracking, hand-tracking and handheld-localization videos as "30 Hz capture" (`search_summary`). **30 Hz is a capture or frame rate. It is not a measured algorithm latency.**
- Pulse width. A manuscript section titled "Effect of Pulse Width" says research-grade LiDARs have pulses narrow enough to treat as delta functions, while "consumer LiDARs often have much wider pulse widths". The pulse is modelled as a temporal Gaussian with standard deviation σ. That introduces a depth-dependent blur, so the convolution is only approximately shift-invariant, although "peak locations remain consistent". `search_summary`. No numeric σ was found.

### 2B. The open ST evaluation-kit demonstration

- Manuscript text: "In Supplementary Materials, we show that a commercially-available ST VL53L8CX [stspad] can be used for NLOS tracking with no physical calibration or additional hardware needed." `search_summary`, arXiv HTML.
  - The procedure is in Supplementary S4.1 and Fig. 8 of the manuscript. The caption covers off-the-shelf hardware with minimal calibration and links to a video. The workflow is: point the camera at a relay surface, calibrate the point cloud of the planar surface, then run the particle-filter tracker. `search_summary`.
  - Read "no physical calibration" as no hardware calibration. A software wall-calibration step is still needed (my reading of S4.1; also the repo README). Inference.
- **Part name is inconsistent across sources:**
  - VL53L8CX: manuscript (`search_summary`) and the product image in the ST demo video, captioned "$10 Sensor" (`direct`, `evidence/st_module_crop.jpg`).
  - VL53L8CH: the released code throughout (`spad_driver.py`, `sensor.py`, `firmware/vl53l8ch/`) and the README (`code_or_data`). The README targets ST's P-NUCLEO-53L8A1 kit, described as a "Nucleo-F401RE host board with the X-NUCLEO-53L8A1 expansion shield containing a histogram-capable VL53L8 multi-zone SPAD".
  - "ST VL853L8" (sic): docstring in `paper/data/dataloader.py`.
  - Script wording: "an off-the-shelf ST multizone time-of-flight sensor from the VL53L8 family".
- **Cost labels conflict. Use one with its source, or none:**
  - "less than US$100 … no additional set-up" for the paper's off-the-shelf claim (abstract, `search_summary`).
  - "Order the ST sensor (~$100)" on the project page as of 2026-05-14 (`direct`).
  - "~$50" on the current cornar page (`search_summary`).
  - "$10 Sensor" inset in the ST video (`direct`; probably the bare chip).
  - "assemblable for under $50" in an MIT Media Lab article (`search_summary`).
- **Released-code settings.** These are code facts, not manuscript facts, and come from the open demo code:
  - 4×4 zones. The driver defaults `height=4, width=4`, and `sensor.py` builds a 4×4 sensor.
  - `timing_resolution = 250e-12`, so 250 ps per bin. The paper configs also use `t_res: 250.0E-12`.
  - Demo `num_bins = 48` (README: about 4 m round-trip window). Requested `ranging_frequency_hz = 30`. `integration_time_ms = 10`. Driver FOV parameters `fovx = fovy = 45.0`.
  - Paper tracking configs: `num_particles: 1000`, `motion_model: RandomWalk`, `radius: 0.07` (7 cm), `resample_fn: residual`, `score_fn: dot_product_score`, `eta: 3`, `num_lct_bins: 128`, and `isDiffuse: False` for both ST captures.
  - The output-video writer uses `fps=14.0` for `tracking.py` and `fps=12.8` for `cam_localization.py`. Whether those equal the true ST capture rates is unresolved.
- **ST datasheet context** (`search_summary` from ST product pages and distributors, not from the paper): up to 8×8 = 64 zones; up to 128 bins; minimum bin 37.5 mm, which matches 250 ps of round-trip time (c·250 ps / 2 = 3.75 cm); 65° diagonal FoV (45°×45°); 940 nm Class 1 VCSEL; CNH histogram output up to 30 Hz. Mouser lists zone and bin trade-offs: 64 zones/18 bins at 15 Hz, 32/36 at 15 Hz, 16/48 at 25 Hz. One listing gives "60 Hz", which does not match the 30 Hz figure.
- Released ST data (`code_or_data`):
  - `paper/captured_data/st_spad_person_tracking`: 475 frames, each holding `hists` (16 × 128) and `pt_cloud` (16 × 3).
  - `st_spad_cam_localization`: 358 frames, plus a `cam_z` value per frame.
  - The ST video on the project page ends at "Frame 472", which fits a roughly 475-frame capture. That it shows this dataset is my inference.
- The ST demo tracks a person around a partition. The person does not appear to wear retroreflective material, but I did not verify this frame by frame (`direct`, video). The project page and the supplement treat this as the plug-and-play demonstration. **It is not the source of the main-figure results.**

### 2C. A third dataset in the released code, "ams_U_reconstruction"

- `paper/configs/reconstruction.yaml` labels it "Calibrated parameters for AMS sensor":
  - `bin_width: 88.0e-12` (88 ps), `num_bins: 128`, `t0: 13`, `gates: [30, 90]`.
  - Data: 37 files of `histogram` (3 × 3 × 128) and `point_cloud` (9 × 3).
  - `reconstruction.py` hard-codes a 6×6 raster of camera positions over 0–128 cm by 32–96 cm (serpentine order) and reconstructs a "U" by backprojection. `code_or_data`.
- **Model not named in the code.** The ams TMF8828 is used in the authors' related robotics paper (arXiv 2410.03555: 3×3 zones from 18×12 SPADs, about 41°×52° FoV, about 5 Hz) and in the DENALI dataset. That link is context, not confirmation (`search_summary`).
- A 3×3 = 9-zone device does not match the manuscript's "∼100 pixels". This dataset should not be treated as data from the manuscript's main device. Unresolved.

---

## 3. The method: motion-induced aperture sampling (MAS) and multi-frame fusion

All items `search_summary` from arXiv v1 unless marked otherwise.

- **Problem framing (Introduction and Table 1).** Two quotes from the manuscript set it up.
  - On signal: "low laser power (due to eye safety constraints) and short exposure times (due to dynamic scenes) result in low signal-to-noise ratio (SNR) measurements".
  - On resolution: "constraints on bandwidth, power, and chip area limit spatial resolution, forcing a trade-off between aperture sampling density and total aperture size".
  - Joint object and camera motion is the third challenge.
  - Table 1 is qualitative. It pairs constraints (eye-safe laser power, short-exposure capture at 30 Hz) with challenges (low SNR, …) and solutions (burst imaging and fusion, motion and shape priors).
- **Analogies.** The abstract says: "Inspired by burst photography and synthetic aperture radar, we propose a multi-frame fusion strategy". The gloss in the next sentence comes from LiDAR News coverage, not from verified manuscript wording: burst photography improves SNR by redundancy and frame stacking; SAR uses motion-created viewpoints to enlarge the effective aperture. Script use: burst stacking stands for SNR, and a synthetic aperture stands for a larger virtual aperture made by moving the sensor.
- **Geometry.**
  - The camera aims at a relay surface, "the virtual mirror", at z = 0.
  - The imaged wall patch is the "virtual aperture".
  - Light path: laser → virtual aperture → hidden object → virtual aperture → SPAD pixel.
  - The manuscript says the camera "is handheld and free to move in an unstructured manner, but must be aimed towards the relay surface". That is the model's general framing. Many experiments did not use handheld motion (see §4).
- **Forward model.**
  - The light-cone transform (LCT) maps z → v_z = z² and τ → v_τ = (cτ/2)², which turns image formation into a convolution with a parabola-shaped point spread function.
  - The Fig. 2 caption says space-time measurements are "the combined effect of object shape, object motion, and camera pose using the convolutional property of the light-cone transform".
  - Object shape defines a canonical space-time impulse response, I(x,y,v).
  - Object motion is a translation Δ of that response. Because convolution is shift-invariant, the response "also translates by Δ".
  - Camera pose P_t determines which points of the translated response get sampled. Moving the camera "increases synthetic aperture size and resolution due to additional spatial sampling".
- **Stated modelling assumptions:**
  - "We assume object motion is a rigid-body translation (no rotations)."
  - Because all spots fire at once, "we assume that the hidden object of interest has strong retroreflective properties in order to retain the image formation model of confocal scanning setups [16]. However, we empirically show that our model works on diffuse objects as well."
  - Pulse width is approximated by a Gaussian (§2A).
- **Inverse strategy: one unknown at a time.** "Jointly recovering object shape, object position, and camera pose under the MAS model is a highly nonconvex inverse problem that would require iterative solvers … unsuitable for real-time execution on consumer platforms." So "many applications require solving for one unknown variable at a time". From the Introduction:
  - "3D scanning assumes a known camera pose and static scene geometry"
  - "object tracking assumes a known object shape"
  - "camera localization assumes a known, static environment"
- **Reconstruction (static objects).** Filtered backprojection over a synthetic aperture built from camera motion with known pose (Fig. 1b). The manuscript notes that for moving objects "techniques such as filtered backprojection will fail because of motion blur".
- **Tracking: particle filter** (manuscript Fig. 3 = Nature Extended Data Fig. 1).
  - Three steps: propagation, evaluation, resampling. Propagation uses a motion prior. Evaluation renders a synthetic measurement per particle and scores the data likelihood.
  - The supplement says "We use 1000 particles". The prior is a normal distribution centred on the previous offset with radius r: "a proximity prior with r = 5 cm already works well empirically at 30 Hz".
  - The released config uses `radius: 0.07`, i.e. 7 cm (`code_or_data`). Paper and code differ here.
  - Multiple objects: the state expands, and the rendered measurement is the linear superposition of per-object renderings. K-means clustering of a multimodal posterior is reported by a third-party review only.
  - Unknown shape: the supplement frames this as blind deconvolution. A point-object kernel approximation gives higher position uncertainty.
- **Camera localization.**
  - Particles live over camera (x, y). Camera z (and tilt) come from fitting a plane at z = 0 to the LiDAR's own wall point cloud. A known static hidden object serves as the landmark.
  - The Discussion says MAS "can handle 6D camera motion when pose is known and 5D camera motion when pose is unknown. While we don't show results for 6D motion in camera localization, our model can handle the extra degree of motion as long as the object shape is not rotationally symmetric."
  - Localization captures assume no roll parallel to the wall.
  - Motivation: a planar white wall gives ICP or structure-from-motion nothing to lock onto.
- **Baseline comparison (supplementary Fig. 7).** The baseline runs filtered backprojection on a 30×30×30 voxel grid and picks the maximum voxel. The authors report the particle filter is more robust to noise and more efficient. The baseline is "much noisier" because it uses no motion prior.
- **Ill-posedness (supplementary Fig. 6).** In a keyhole-like case, where the synthetic aperture is a point and the object is a point, position "cannot be well-constrained even if information is aggregated across multiple frames". Any trajectory on two hemispheres fits the data.

---

## 4. Which experiment used which assumptions

These conditions come from the manuscript's supplementary S3.1 "Mechanical Gantry for Systematic Object and Camera Motion" (`search_summary`). Key quotes:
- "For quantitative tracking and camera localization results in Fig. 1 of the main text, we use a mechanical gantry as a translation stage to move the object to fixed locations. For evaluation purposes, we use a stop motion capture at 10×10 locations along the trajectory of the object and camera."
- "For results without quantitative evaluation, the data is captured in real-time."
- "We also use the gantry to move the camera to get a larger synthetic aperture to get full 3D shape of hidden objects" (mannequin, Fig. 1; diffuse reconstruction, Fig. 5).
- "In principle, we could use natural handheld motion instead of a mechanical gantry to reconstruct these objects if we had reliable camera pose."
- S3.2 is titled "Camera Setup". Its contents were not retrieved.

| # | Experiment (manuscript numbering) | Device | Target and material | Motion and capture | Prior knowledge assumed | Status |
|---|---|---|---|---|---|---|
| E1 | Mannequin 3D reconstruction, Fig. 1b | Smartphone-grade device (videos) | Mannequin. The videos show white strips on its limbs, but retroreflective material is not confirmed in text. | **Gantry** moves the camera to build a synthetic aperture. Object static. | Known camera pose (from the gantry). Static scene. | Experimentally supported, controlled. Not handheld. |
| E2 | Diffuse-object reconstruction, Fig. 5 (= Nature Fig. 4) | Smartphone-grade device (presumed) | **Diffuse** object (no retroreflector) | **Gantry** moves the camera | Known pose, static object | Supported, with weaker SNR by the authors' own statement |
| E3 | Quantitative tracking, Fig. 1 plus supplementary Fig. 9 | Presumed smartphone-grade. Not confirmed. | A "hidden patch". Material not stated in snippets. | **Gantry** translation stage. **Stop-motion** at 10×10 locations, so not real-time. | Known shape (patch). Camera fixed. | 4.7 cm average position error over the trajectory, larger where the object is far from the virtual aperture (supplement). Valid only under these conditions. |
| E4 | Quantitative camera localization, Fig. 1 (ICP and GT in the legend) | Presumed smartphone-grade | Known static hidden object | **Gantry**, stop-motion 10×10 | Known static environment and object | No numeric error found. Unresolved. |
| E5 | Real-time multi-object tracking, Fig. 4 (= Nature Fig. 3) | Smartphone-grade (hand-tracking video shows a tripod-mounted phone-shaped device) | (a) One object moving on a **translation stage** plus one static object. (b) A person's two hands with **retroreflective gloves** (gloves reported by supplementary video caption and press, `search_summary`; not clearly visible in my frames). | 30 Hz capture. Camera fixed on tripod. | Known shapes | Supported |
| E6 | Diffuse person tracking, supplementary video; project page "Tracking an object in real-time (30 Hz)" (`diffuse_tracking_final.mov`) | Smartphone-grade device on a tripod near the occluder (`direct`) | Person, "without any special retroreflective materials" | Real-time capture at 30 Hz. Camera fixed. | Known or approximate shape. Released code uses a point canonical model (`canons/point.npy`). | Supported. Tracking only, no reconstruction. |
| E7 | Handheld camera localization, supplementary Fig. 10 and video (`handheld_cam_localization.mov`) | Smartphone-grade device, **handheld** (`direct`) | **Retroreflective patch** on a tripod behind an occluder (supplement, `search_summary`). Planar white relay wall: "no reliable texture from RGB" (video overlay, `direct`). | Unstructured handheld motion, 30 Hz | Known static hidden object. 5D motion, no roll. | The only handheld result found. It is localization, not reconstruction. |
| E8 | ST VL53L8 plug-and-play tracking, supplementary S4.1 and Fig. 8 (`diffuse_tracking_st.mov`) | **ST VL53L8CX/CH**, 4×4 zones, 250 ps bins | Person walking behind a partition (looks diffuse; not verified) | Real-time. Sensor fixed. | Wall point-cloud calibration plus background capture (README). Point canonical model. | Supported as a demonstration. Open code. **Separate from E1–E7.** |
| E9 | Nature Fig. 5 "NLOS imaging in realistic scenarios with consumer LiDARs" | Unknown | Unknown. A ResearchGate snippet mentions a bouncing ball whose last frames were dropped as it moved away from the virtual aperture. Unverified. | Unknown | Unknown | **No confirmed counterpart in arXiv v1.** Unresolved. |

Guardrails for the script:
- Handheld motion supports **camera localization (E7)**. It was not used for reconstruction: reconstructions used a gantry with known pose. The manuscript says only that handheld reconstruction would work "in principle" given reliable pose.
- The 4.7 cm figure belongs to E3: gantry, stop-motion, a hidden patch, fixed camera. Do not attach it to the handheld, diffuse-person or ST results.
- "30 Hz" is a capture rate. No per-frame processing time or end-to-end latency figure was found. The only timing in the released code is a one-off "~30 s on CPU" to voxelize the forward model at startup (README). Algorithm latency: unresolved.
- "Tracking" means locating a known-shape object, effectively as a point or blob. That is not imaging the object's shape. The reconstructions (E1, E2) are separate experiments with a static object and a gantry-moved camera.
- Retroreflective targets (cloth, gloves, patch) are used "for many of our experiments … to preserve the confocal image formation model". Diffuse results (E2, E6, E8) exist, and the authors call them "inherently worse … because of the weaker signal" (r⁴ falloff and non-confocal paths).

---

## 5. Figure numbering: arXiv v1 compared with Nature (final)

All `search_summary`. Nature figure titles come from the Nature page listing. arXiv captions come from arXiv HTML and PDF snippets.

| arXiv v1 | Title / content | Nature (final) |
|---|---|---|
| Fig. 1 | "Consumer non-line-of-sight imaging": (a) diffuse surfaces as virtual mirrors, with the challenges of low SNR, aperture size versus sampling density, and joint motion; (b) 3D reconstruction (FBP, mannequin), tracking and camera localization on smartphone-grade LiDAR, with insets showing the limits of line-of-sight-only signals. Legend includes ICP and GT. | Fig. 1 "Consumer NLOS imaging" (same topic; ResearchGate shows the same panel-a wording) |
| Fig. 2 | Motion-induced aperture sampling model | Fig. 2 "Motion-induced aperture sampling model" (same number) |
| Fig. 3 | Particle filtering for single and multi-object 3D tracking (propagation, evaluation, resampling) | **Extended Data Fig. 1** "Particle filtering for NLOS object tracking" |
| Fig. 4 | Tracking multiple hidden objects (stage-moved object plus static object; two hands) | **Fig. 3** "Tracking multiple hidden objects" |
| Fig. 5 | Imaging hidden diffuse objects | **Fig. 4** "Imaging hidden diffuse objects" |
| none found | | **Fig. 5** "NLOS imaging in realistic scenarios with consumer LiDARs". Content unverified. |
| Table 1 | Challenges of consumer NLOS: constraint → challenge → solution | Not checked |
| Supp. Fig. 6 | Ill-posed tracking, keyhole case | Nature Supplementary Information; numbering not checked |
| Supp. Fig. 7 | Baseline tracking (FBP + max) | as above |
| Supp. Fig. 8 | Real-time tracking with ST VL53L8CX | as above |
| Supp. Fig. 9 | Tracking a hidden patch, with error map (4.7 cm) | as above |
| Supp. Fig. 10 | Handheld camera-localization trajectory | as above |

The manuscript's supplementary sections seen in snippets are:
- S3.1 Mechanical gantry
- S3.2 Camera setup
- S4 Supplementary results
- S4.1 ST VL53L8CX demo
- S4.2 Camera localization
- "Effect of Pulse Width"
- "Details on Particle Filtering"
- Algorithm 1/2 pseudocode

The full section list was not retrieved. Nature's supplementary information is described as "additional derivations, algorithm pseudocode, results, analysis and references", and Nature lists a Supplementary Video 1 and a peer review file (`search_summary`).

One earlier search claimed a "Figure 4" appears only on the unversioned arXiv HTML and not on v1. No other search supported that. Treat it as noise.

**Rule for the script:** cite figures by Nature numbers, the version of record, and say "Nature Fig. X". If a manuscript figure is cited, label it "arXiv v1 Fig. X".

---

## 6. Limitations, from the manuscript and the authors' own pages

| Topic | What is stated | Source / access |
|---|---|---|
| SNR | Low laser power (eye safety) plus short exposures (dynamic scenes) give low SNR. Diffuse objects have "poorer SNR and stronger reflections from non-confocal paths". | arXiv Intro and Fig. 5, `search_summary` |
| Spatial resolution | Bandwidth, power and chip area limit pixels. A trade-off between aperture sampling density and size. Tracking error grows as the object moves away from the virtual aperture ("region of ambiguity increases"). The point-aperture keyhole case is ill-posed. | arXiv, supplementary Figs. 6 and 9, `search_summary` |
| Reflectance | The model assumes retroreflective targets. Diffuse targets work empirically but give worse results. | arXiv, `search_summary` |
| Motion model | Rigid translation only, no rotation. Tracking needs known or approximately known shape; unknown shape becomes blind deconvolution. 6D localization not demonstrated. | arXiv, `search_summary` |
| Range | FAQ: "Today's phones weren't designed specifically for this application, and there are still significant limitations in range, resolution, and robustness." The current cornar page lists "longer ranges (several meters)" as future work. Repo (ST demo only): about 4 m round-trip window at 48 bins × 250 ps; SPAD to wall under 1 m; wall to object about 1–1.5 m. | FAQ `direct` (2026-05-14 page); cornar `search_summary`; README `code_or_data` |
| Noise and low light | FAQ: "current systems still struggle in extremely low-light and high-noise conditions". | `direct` |
| Ambient light / sunlight | **No manuscript statement found. Unresolved.** README (ST demo only): ambient light "isn't a major issue indoors at typical office levels", but "direct sunlight on the wall will saturate the sensor". | `code_or_data` |
| Unknown motion | FAQ: "Handling completely unknown motion — where both the camera and hidden objects are moving unpredictably — is another major challenge." | `direct` |
| Multiple objects | Demonstrated only for objects of known shape (two hands with gloves; stage object plus static object). Each extra object enlarges the state space. | arXiv, `search_summary` |
| Latency / mobile real-time | No latency number found. The cornar page lists "reliable real-time performance on mobile hardware" as an open challenge. | `search_summary` |
| Output type | "does not produce conventional photographic imagery … primarily recover sparse geometric and motion information" | MIT press page and cornar, `search_summary` |
| Raw data access | Phone makers typically restrict access to raw LiDAR histograms, so phones cannot do this out of the box. | Press coverage, `search_summary` |
| Deployment | FAQ: "We're still early … many important research challenges to solve before this becomes a robust commercial technology." | `direct` |

---

## 7. Claim-type labels for the script

- **Experimentally supported** (authors' own experiments, under the conditions in §4): mannequin and diffuse reconstruction (gantry, known pose); gantry-based quantitative tracking (4.7 cm, stop-motion); real-time 30 Hz tracking of a diffuse person (fixed sensor); hand tracking with retroreflective gloves; handheld camera localization with a retroreflective patch; ST VL53L8 person tracking.
- **Reported by authors, not independently replicated:** all of the above. Released code and data are **not** independent replication.
- **Independently demonstrated by other systems:** consumer-LiDAR NLOS with an ams TMF8828 (Young et al., arXiv 2410.03555; DENALI, arXiv 2604.16201). Those works overlap with these authors or their group and use retroreflective tape or gantries, so they are related, not independent confirmation. Research-grade NLOS history (Velten 2012; O'Toole 2018) is covered in the history notes.
- **Illustrative:** the project page's rendered warehouse, robot-hallway and AR-headset scenes (`evidence/apps.jpg`).
- **Proposed applications:** collision avoidance, autonomous driving, indoor localization or SLAM, AR body and hand tracking, search and rescue (project page, `direct`; press).
- **Inference** (marked wherever used above): the device behind the main results is not the ST module; the ST video shows the released 475-frame dataset; "no physical calibration" means no hardware calibration.

---

## 8. Unresolved items (do not fill these with guesses)

1. Vendor and model of the ∼100-pixel "smartphone-grade LiDAR". Also its bin width, FoV, wavelength, laser power or eye-safety class, and exact pixel layout.
2. Whether arXiv has a v2 or later. Only v1 was seen, and arXiv is blocked here.
3. Experiment or capture dates for every experiment.
4. Content of Nature Fig. 5 ("realistic scenarios") and whether it exists in any form in arXiv v1.
5. Camera-localization numeric error (E4). The tracking error map's spatial values beyond the 4.7 cm average.
6. Algorithm latency or per-frame runtime, and the computing hardware used.
7. Whether VL53L8CX or VL53L8CH was physically used in the ST demo. The two names conflict across sources.
8. Which sensor produced the released "ams_U_reconstruction" data (3×3 zones, 88 ps) and which figure it corresponds to, if any.
9. Any manuscript statement on ambient or sunlight robustness, or on maximum working range for the main device.
10. Whether the E3 "hidden patch" and the mannequin were retroreflective. The text says only "many" experiments used retroreflective cloth.
11. The exact wording of the burst-photography and SAR explanation in the manuscript body. Only the abstract wording is confirmed.

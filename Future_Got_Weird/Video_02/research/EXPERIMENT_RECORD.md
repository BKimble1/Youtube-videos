# Experiment record: "How Cameras See Around Corners" (Video 02)

Synthesis compiled 2026-10-08 from the six research notes (`final_paper/`, `manuscript/`, `code_reproduction/`,
`history/`, `context/`, `geometry/`) and the adversarial verification of 111 key facts. Every refuted fact was corrected
or dropped, and every "unclear" fact is marked `search_summary only` or `unresolved`. Nothing here mentions the channel
owner.

**Rule for every number in this file:** it belongs to exactly one record. Never combine numbers across records on
screen, in narration or in the description. The firewall table in §6 lists them.

## 0. How to read this file

**Access tags (per field):**

| Tag | Meaning |
|---|---|
| `direct` | We read the primary text, file or video frames ourselves. In this project that covers the authors' GitHub repos (code at `sidsoma/consumer-nlos@15314de4`; the author site `sidsoma/sidsoma.github.io`, including the 2026-05-14 project-page snapshot at `48b57f43` and its five result videos), the 2018 Nature PDF and SI as copied into a third-party mirror, and the Nam first-author site. |
| `code_or_data` | We inspected or ran released code or data. |
| `search_summary` | Reported by the WebSearch tool from the named page; we did not read that page. nature.com, arxiv.org, media.mit.edu, cornar.media.mit.edu, PMC, IEEE and doi.org are blocked in this container. |
| `inference` | Our reasoning from the cited facts. Never put it on screen as fact. |
| `derivation` | Our own calculation. |
| `unresolved` | Not established by any route we had. |

**Evidence status labels** (same set as `claims_draft.csv`): experimentally supported, reported by authors,
independently demonstrated (by other systems), illustrative, inference, proposed application, unresolved.

**Every record below is reported by its own authors.** None of the 2026 experiments has been independently
replicated, as far as we could find by 2026-10-08 (§5, X5). Releasing code and data is not independent replication.

**Numbering:** Nature (final) numbering is used unless a figure is marked "ms", meaning arXiv v1 manuscript numbering.
The two numberings differ. Every Nature figure title and the mapping from ms to Nature are `search_summary only` and
were not verified. The only verified point is that the final article has a "realistic scenarios" figure that has no
counterpart in the manuscript numbering.

### 0.1 The 2026 paper's devices

Keep these three devices apart on screen.

| | Smartphone-grade research device | ST VL53L8 evaluation kit | "AMS sensor" in the code |
|---|---|---|---|
| What | "portable smartphone LiDAR system with ∼100 pixels, each consisting of a co-located laser emitter and single-photon avalanche diode (SPAD) sensor". Each pixel shares an optical axis with one laser spot, and all spots fire at once. | STMicroelectronics multizone direct-ToF SPAD sensor. The code drives a VL53L8CH on a P-NUCLEO-53L8A1 kit (Nucleo-F401RE + X-NUCLEO-53L8A1). | Multizone ToF sensor, labelled only "AMS sensor" in a config comment |
| Access | search_summary (wording unverified; "smartphone-grade" is `direct` from the project page) | direct + code_or_data | code_or_data |
| Pixels/zones | about 100 | 4×4 = 16 zones in all released data | 3×3 = 9 zones |
| Bin width | not found | 250 ps (firmware bin 37.5348 mm one-way, which is 250.4 ps) | 88 ps |
| Vendor/model | **unresolved.** No source names it. Do not imply a manufacturer. | Suffix conflict: code and firmware say **CH**; the ms and the authors' video inset say **CX**. On screen: "ST VL53L8-series sensor (evaluation kit)". | Model **unresolved.** A TMF882x/TMF8828-family part is plausible (the lab's cc-hardware library has a TMF8828 driver), but that is inference. |
| Data released? | **No.** The Data availability statement cites "a proprietary device" (search_summary). | Yes: two datasets (R8, R9) | Yes: one dataset (R10) |
| Records | R1–R6 (presumed; device assignment per figure is not confirmed in text) | R8, R9, R11 | R10 |

The authors' project-page abstract names the iPhone Pro, Vision Pro and Waymo cars as examples of where consumer
LiDAR is found (`direct`). That is not a statement about which device was used. Do not imply an iPhone.

### 0.2 Is it "confocal"?

The older notes said the real 2026 sensors are not confocal. That claim needs refining:

- **ST kit:** a 940 nm VCSEL behind diffractive optics lights the whole 45°×45° field at once (ST datasheets,
  `search_summary`). Zones are formed on the receive side. "Flood, non-scanning" is our `inference` from the fixed
  optics, so the kit is **not confocal**.
- **Smartphone-grade device:** every pixel is co-axial with one laser spot, which is per-pixel quasi-confocal. All spots
  fire at once, so diffuse targets pick up "non-confocal paths" (`search_summary`).
- **Authors' code:** all three pipelines model each zone as **confocal**, `c·t = 2|w_i − p|`, measured from that zone's
  own wall return (`code_or_data`, `canon.py:83-84`, `utils.py:463-466`).
- **The authors' bridge:** they assume retroreflective targets "to retain the image formation model of confocal
  scanning setups" (`search_summary`, two searches).
- **Our check:** the flood computation in `geometry/` gives the same answer, illustratively. With an ideal
  retroreflector, each zone's echo is centred within about 1.5 cm of path of the confocal model. With a diffuse point
  target it is smeared by about 20–26 cm of path and shifted by up to about 18–19 cm.

---

## 1. 2026 study: smartphone-grade research device

Source for R1–R7: Somasundaram, Young, Dave, Pediredla, Raskar, *Nature* 653, 693–699, doi 10.1038/s41586-026-10502-x.
It was published online on 20 May 2026 and the issue is dated 21 May 2026 (`search_summary`, many agreeing searches). The
received date (28 Aug 2025) and accepted date (7 Apr 2026) are each `search_summary only`, from a single route. The
manuscript is arXiv 2605.17865 v1. Its ID and title are `direct` from the author site; the 18 May 2026 submission date is
`search_summary only`. **All of these are publication dates, not experiment dates.**

### R1. Real-time tracking of a hidden person without retroreflective material

| Field | Value | Access |
|---|---|---|
| Identifiers | **Nature Supplementary Video 1**, caption as reported: "Real-time diffuse tracking: we can track a hidden person around the corner without any special retroreflective materials at 30 Hz capture." The substance is supported; the exact wording is unverified. **Project-page video** `diffuse_tracking_final.mov` (Tracking tab, caption "Tracking an object in real-time (30 Hz). Useful for detecting motion around blind corners and collision avoidance."). ms S4.1: "The diffuse tracking result in Fig. 5 of the main text is available as a video result" (ms numbering; Nature Fig. 4 by title match). | search_summary; direct; inference |
| Same clip? | Whether the project-page video is the same file as Nature SV1 is **unresolved** (likely; inference). | unresolved |
| Sensor | Not named in any text. In the video a small white unit with a cable, clamped at the end of the partition and labelled "camera", is visibly **not** the red-housed ST module of R8. That it is the smartphone-grade device is inference. | direct; inference |
| Emitter | Reported for the smartphone-grade device: about 100 laser spots, all active at once, each co-axial with a SPAD pixel. Wavelength, power and eye-safety class not found. | search_summary; unresolved |
| Relay surface | A light-coloured wall labelled "relay wall" in the video. Material and finish not stated. | direct; unresolved |
| Hidden target and material | One person walking behind a black occluder, near four green floor squares, in an ordinary grey T-shirt with no visible retroreflective material. The caption says "without any special retroreflective materials". | direct; search_summary |
| Distances | **Not stated.** Read by eye from the authors' plot: position estimates mostly 0.5–1.3 m from the wall; sensor marker about 0.7 m from the wall; occluder line from about 0.6 to 1.6 m. These are plot elements and estimates, not measured distances. | direct (plot reading); unresolved |
| Illumination | Indoor room lighting visible. Ambient level not stated. | direct; unresolved |
| Calibration | Not stated for this run. | unresolved |
| Motion | Sensor fixed on a mount; person moving. | direct |
| Output type | **Tracking.** A top-down position-probability heat map beside a synchronised overhead RGB reference video. Not an image of the person. ms S4.1 reports a kernel density estimate (KDE) of the particles per frame, shown as a contour map. | direct; search_summary |
| Capture rate vs latency | **Capture 30 Hz** (caption). In the video the plot's frame counter advances 30 per second (Frame 31 at 1 s, Frame 931 at 31 s; 1220 frames in 40.26 s), consistent with 30 Hz capture replayed at real speed. **Per-frame processing time, and whether it ran live, not stated.** | search_summary; direct; inference; unresolved |
| Computation | Particle filter. ms: 1000 particles and a proximity prior "r = 5 cm" that "works well empirically at 30 Hz" (the released code uses 7 cm). Compute hardware unknown. | search_summary; code_or_data |
| Accuracy | **None reported for this run.** | not found |
| Limitations | Authors: diffuse results are "inherently worse … because of the weaker signal (due to r^4 falloff) and light contributions from non-confocal paths". Tracking assumes a known or approximate object shape. | search_summary |
| Dates | Video file creation_time 2025-08-19. That is an export time, not a capture date. Capture date **unresolved**. | direct; unresolved |
| Status | **Reported by authors.** Device data not released. | |
| Unresolved | Device identity; whether this is SV1; distances; wall material; calibration; latency; accuracy; whether a shape prior (point model) was used. | |

### R2. Multi-object tracking: two hands, and a stage-moved object plus a static object

| Field | Value | Access |
|---|---|---|
| Identifiers | Nature Fig. 3 "Tracking multiple hidden objects" (title `search_summary only`). ms Fig. 4: (a) one object on a **translation stage** plus one static object; (b) two hands. SV2 caption as reported: "Hand tracking: … including both hands of a person, at 30 Hz … wearing retroreflective gloves to isolate the signal coming from the hands from the light arriving from the torso." Not verified; do not carry the 30 Hz over without the primary text. Project-page video `hand_tracking.mov` (tab caption "Tracking multiple objects outside the line of sight. Useful for tracking user pose in AR or for monitoring dynamic scenes."). | search_summary; direct |
| Sensor | Phone-shaped device in a clamp on a tripod, with a cable, behind a black partition. Model not named. | direct; unresolved |
| Emitter | As R1, if this is the same device (inference). | inference |
| Relay surface | A plain white wall that the person faces. Material not stated. | direct; unresolved |
| Hidden target and material | (b) A person's two hands; **retroreflective gloves** per caption and press. In our frames the gloves cannot be seen because the coloured overlays cover the hands. (a) The material of the stage-moved and static objects is unresolved. | search_summary; direct |
| Distances | Not stated. | unresolved |
| Motion | Sensor fixed on a tripod. Hands move (b). In (a) one object is moved by a stage and one is static. | direct; search_summary |
| Output type | **Tracking** of two positions: two KDE blobs (blue, green) overlaid on an RGB reference video. Not shape. | direct |
| Capture rate vs latency | 30 Hz reported (SV2 caption, unverified). Video frame counter not recorded. Latency not stated. | search_summary; unresolved |
| Computation | Particle filter with an expanded state, one sub-state per object; the rendered measurement is the sum of per-object renderings (ms). Released code supports several canonical objects (`motion.py`: 3N-dimensional particles). | search_summary; code_or_data |
| Accuracy | None reported. | not found |
| Dates | Video file creation_time 2025-09-10 (export). | direct |
| Status | Reported by authors, **for retroreflective gloves**. Not bare-hand tracking, and not on a headset. | |
| Unresolved | Exact caption wording; device; capture rate; object materials in (a). | |

### R3. Handheld camera localization using a hidden retroreflective patch

| Field | Value | Access |
|---|---|---|
| Identifiers | SV3 caption as reported: "Handheld camera localization: … the hidden object (a retroreflective patch here) … under unstructured handheld camera motion. Capture is at 30 Hz." (unverified). ms Supp. Fig. 10 / S4.2 (search_summary). Project-page video `handheld_cam_localization.mov` (tab caption "Using hidden objects to localize yourself. Useful for robot localization and simultaneous localization and mapping when direct line-of-sight cues are unreliable."). | search_summary; direct |
| Sensor | Phone-shaped device **held in the hand and tethered by a cable**. Model not named. | direct |
| Relay surface | A plain white wall. The video overlay reads "line-of-sight POV … no reliable texture from RGB". ms: a planar white surface with "little-to-no visual features". | direct; search_summary |
| Hidden target and material | A square grey/silver patch on a tripod behind an occluder, described as a **retroreflective patch**. It is a known, static landmark. | direct; search_summary |
| Distances | Not stated. | unresolved |
| Motion | **Handheld**, unstructured, tethered. The hidden object is static. | direct |
| Output type | **Camera localization**: an estimated sensor trajectory. Not an image of the patch. | direct |
| Capture rate vs latency | Video frame counter advances 30 per second (Frame 31 at 1 s, Frame 931 at 31 s), consistent with 30 Hz capture. Latency not stated. | direct; inference |
| Computation | ms: particles over camera (x, y); z and tilt from a plane fit to the sensor's own wall point cloud; 5D motion with no roll; "6D not shown". The 5D/no-roll wording is `search_summary only`. The released ST analogue (R9) estimates x and y only and takes z from the data. | search_summary; code_or_data |
| Accuracy | No error number retrieved for the handheld run. | not found |
| Dates | Video file creation_time 2026-05-05 (export). | direct |
| Status | Reported by authors. This is the **only** handheld result found, and it is localization, not reconstruction or person tracking. | |
| Unresolved | Device; exact caption; accuracy; distances. | |

### R4. Quantitative tracking and localization on a gantry (stop-motion)

| Field | Value | Access |
|---|---|---|
| Identifiers | ms Fig. 1b quantitative panels; ms Supplementary S3.1 "Mechanical Gantry for Systematic Object and Camera Motion"; ms Supp. Fig. 9 (patch error map). Not confirmed in the final article. | search_summary only |
| Protocol (reported) | "For quantitative tracking and camera localization results in Fig. 1 of the main text, we use a mechanical gantry as a translation stage to move the object to fixed locations … stop motion capture at 10×10 locations … For results without quantitative evaluation, the data is captured in real-time." Unverified quote, not contradicted. | search_summary only |
| Sensor | Presumed smartphone-grade device; not confirmed. | inference |
| Hidden target and material | A "hidden patch". One search said a 25×25 cm retroreflective patch; that size and material are **unverified**. | search_summary only |
| Motion | **Gantry**, stop-motion, **not real-time**. Camera fixed for tracking. | search_summary only |
| Output type | Tracking (x–y position) and camera localization (legend includes ICP and GT). | search_summary only |
| Accuracy | "The average position error over the entire trajectory is **4.7 cm**", with higher error where the object is far from the virtual aperture. Two searches returned it; an exact-phrase search did not. The final-article value is **not established**. No camera-localization error number was found. | search_summary only; unresolved |
| Released data | **None.** The repo has no gantry or ground-truth data and no error script, so no accuracy can be computed from released data. | code_or_data |
| Status | **Unresolved for script use.** If ever used, the label must read: "manuscript, author-reported, gantry-moved patch, stop-motion, fixed sensor". Never attach it to R1, R3 or R8. | |

### R5. 3D reconstruction of a static mannequin, with the sensor moved on a gantry

| Field | Value | Access |
|---|---|---|
| Identifiers | ms Fig. 1b (mannequin, filtered backprojection). ms S3.1: the gantry is also used "to move the camera to get a larger synthetic aperture to get full 3D shape of hidden objects"; "In principle, we could use natural handheld motion instead of a mechanical gantry … if we had reliable camera pose." Project-page video `reconstruction.mov`, overlays "camera facing wall" and "mannequin behind camera". | search_summary; direct |
| Sensor | Phone-like device in a clip mount on a rectangular two-axis gantry frame. | direct |
| Relay surface | The wall the device faces. Material not stated. | direct; unresolved |
| Hidden target and material | A static mannequin-like figure on a tripod with white strips visible on its limbs. Whether they are retroreflective is **not confirmed**. ms: "for many of our experiments" targets wore retroreflective cloth. | direct; search_summary; unresolved |
| Motion | **Gantry raster with known pose; object static.** Not handheld. Verification refuted the claim "reconstruction from natural handheld motion". | direct; search_summary |
| Output type | **Reconstruction**: a backprojection volume that sharpens as the aperture grows. Coarse, not a photograph. | direct |
| Capture rate vs latency | Not stated. | unresolved |
| Accuracy | No resolution or error number found. | not found |
| Dates | Video file creation_time 2026-05-05 (export). | direct |
| Status | Reported by authors, **under controlled sensor motion**. | |

### R6. Hidden diffuse objects: reconstruction and tracking

| Field | Value | Access |
|---|---|---|
| Identifiers | ms Fig. 5 "Imaging hidden diffuse objects", reportedly Nature Fig. 4 (mapping `search_summary only`). | search_summary only |
| Content | The MAS model was derived assuming retroreflective reflectance. Diffuse objects work empirically, with poorer SNR (r^4 falloff) and stronger non-confocal paths; the authors "are still able to reconstruct 3D shape and track objects in real-time". The reconstruction used a gantry-moved camera (ms S3.1). The diffuse tracking video is probably R1 (inference). | search_summary; inference |
| Sensor, objects, distances | Presumed smartphone-grade device. Object identity, distances and wall material **unresolved**. Press mentions "moving mannequin, cardboard cutouts, and letters", without figure attribution (Tech Xplore, search_summary, low weight). | inference; search_summary; unresolved |
| Accuracy | Qualitative only. | search_summary |
| Status | Reported by authors. | |

### R7. Nature Fig. 5, "NLOS imaging in realistic scenarios with consumer LiDARs"

| Field | Value | Access |
|---|---|---|
| Existence | A realistic-scenarios figure exists in the final article and has no counterpart in the manuscript numbering. Its number ("Fig. 5") and title are `search_summary only`. | search_summary (existence corroborated by the production packet) |
| Content | **Unresolved**: panels, devices (the plural "LiDARs" *suggests* more than one; inference), scenes, distances, materials, motion. A "bouncing ball" ResearchGate snippet is unverified. | unresolved |
| Script rule | Say nothing about this figure until someone reads the Nature PDF. | |

---

## 2. 2026 study: released low-cost-sensor data and code

Repo `github.com/sidsoma/consumer-nlos`, commit `15314de422a765a2d1b72ea7037dfafb2f908d7c` (2026-07-23), MIT
License, "Copyright (c) 2025 sidsoma". We ran the authors' three paper scripts on CPU without modifying them (seeds
fixed by us). See `code_reproduction/NOTES.md`.

### R8. ST VL53L8 kit: hidden-person tracking (released dataset `st_spad_person_tracking`)

**This is the recommended opening evidence (see `OPENING_EVIDENCE.md`).**

| Field | Value | Access |
|---|---|---|
| Identifiers | `paper/captured_data/st_spad_person_tracking/volume_000000…000474.npz`; script `paper/tracking.py` + `configs/tracking.yaml`. The Oct 2025 README said the output "should match the result shown in Fig. 3 of the Supplementary Material and the 'Plug-and-Play NLOS' result shown in the supplementary video" (pre-publication numbering; removed 2025-11-26). ms Supp. Fig. 8 is reportedly "Real-Time Tracking with ST VL53L8CX SPAD". Project-page video `diffuse_tracking_st.mov` ("Try It Yourself" section). | code_or_data; search_summary; direct |
| Link to the authors' ST video | In 6 frames of `diffuse_tracking_st.mov` (Frames 40, 119, 199, 278, 357, 437), the KDE blob centres we read by eye match the **stored particle means in the released files at the same frame numbers** within about 2–10 cm. The video ends at Frame 472. The video therefore almost certainly shows this capture (inference, strong; our check on 2026-10-08). | direct + code_or_data; inference |
| Sensor | ST VL53L8-family multizone SPAD, 4×4 = 16 zones. The data loader says "captured with ST VL853L8 device" [sic]. The live demo code drives `VL53L8CHSensor`; the video inset shows a "$10 Sensor" product image printed VL53L8CX. In the video the sensor is a red-housed module on a mount at the end of the partition. | code_or_data; direct |
| Emitter | 940 nm Class 1 VCSEL with diffractive optics (DOEs on transmitter and receiver), 45°×45° square field (65° diagonal), lighting the whole field at once (inference from the fixed optics). | search_summary; inference |
| Timing | 250 ps bins (`t_res: 250.0E-12`; firmware CNH bin 37.5348 mm = 250.4 ps). Firmware pulse width constant: 10 bins (about 2.5 ns, about 75 cm of path). Stored arrays are 128 bins, zero-padded, with signal only in bins 15–53 after the wall peak. | code_or_data |
| Relay surface | A light-coloured wall (visual; "Camera Field of View" lines drawn to it). The 16 calibrated wall points span **0.76 m × 0.74 m**, lie within ±1.2 cm of the wall plane, and sit 0.16–0.26 m from their nearest neighbours (grid spacings 0.16–0.35 m; corrected from 0.18). Material not stated. | direct; code_or_data |
| Hidden target and material | A person walking behind a black partition near four green floor squares (authors' video), in a blue T-shirt and shorts with **no visible retroreflective material**, though it cannot be ruled out. The video file name is "diffuse_tracking_st". **But** the config processes the data with `isDiffuse: False  # set to False for retroreflective objects`, which only selects t² rather than t⁴ falloff weighting. **Target material is not stated in any text: unresolved.** Do not label this data either "ordinary clothes" or "retroreflective target". | direct; code_or_data; unresolved |
| Distances | Sensor about **0.82 m** from the wall (`tracking.py:29`, "depth of camera from wall pre-calibrated (used only for visualization)"; consistent with every zone's last non-zero bin within ±1 bin, given the demo's 48-bin window starting at bin 30). Sensor to wall points, one way: 0.86–1.38 m. Wall to hidden person: the zone-summed echo peak (median bin 28, range 16–44) implies 0.60–1.65 m (median 1.05 m) under the code's confocal relation. The stored track lies 0.53–1.25 m from the wall. The floor squares sit at z = 0.66 and 1.25 m and x = −0.8 and −1.4 m (authors' plot constants labelled "GT patches"; physical green squares are visible in the video). | code_or_data; derivation; direct |
| Illumination | Indoor; not stated. | unresolved |
| Calibration / preprocessing | Released **already processed**: background subtracted (clipped at 0), wall peak masked, shifted so the wall return is t = 0, bins 0–14 zeroed. **The raw wall peak is not in the files.** This matches the format of the later live demo's `track.py`, but the exact script used for these 2025 data is not released. | code_or_data |
| Motion | **Sensor fixed.** The wall points are bit-identical across all 475 frames, which fits a fixed sensor or one calibration reused (inference); the video shows a mounted sensor. The person moves. | code_or_data; direct |
| Output type | **Tracking.** Per frame, 1000 particle positions (stored) or a KDE map (authors' video). A position estimate, not an image. | code_or_data; direct |
| Capture rate vs latency | **No timestamps in the files.** The authors' ST video advances about 14 frame indices per second of playback (Frame 15 at 1 s, Frame 435 at 31 s; 472 frames in 33.99 s), matching the `fps=14.0` writer in `tracking.py`. If the overhead footage is real speed, capture was about 14 Hz (inference). The live demo **requests** 30 Hz, and ST lists a 16-zone/48-bin preset at 25 Hz (search_summary). **Capture rate of this dataset: unresolved.** Never convert frame index to seconds. Authors' latency: not stated. | code_or_data; direct; search_summary; unresolved |
| Computation | Particle filter: 1000 particles; random walk with σ = 7 cm per axis per frame; a single-point canonical object (`canons/point.npy = [[0,0,0]]`); dot-product score raised to η = 3; residual resampling; light-cone resampling adapted from O'Toole et al. **Our** run: median 25 ms per frame for the filter update (4-thread Xeon 2.1 GHz; mean and p95 vary with load). That is our runtime, not the authors' latency. | code_or_data |
| Accuracy | **None computable.** No per-frame ground truth was released. | code_or_data |
| Reproduction (not accuracy) | Our run of the unmodified script against the authors' stored particle means: top-down median gap **8.1 cm** (mean 9.2, p90 12.0). Correlation x 0.97, z 0.99 (frames 21–475). Our z is +6.4 cm larger on average. Seeds agree pairwise to a median of 12–14 mm top-down (corrected from "7.6 mm", which was spread about the centroid). The provenance of the stored arrays is undocumented. | code_or_data |
| Data-only observation | In the released, processed histograms the energy-weighted mean echo delay spans 173–260 cm of extra round-trip path. It anticorrelates with echo energy (r = −0.93) and correlates with the tracker's z (r = 0.93). Two zones (r1c0, r2c0) carry about 100× less energy (cause unknown). | code_or_data |
| Dates | Files committed **2025-10-20** (`0d13087`; byte-identical at HEAD). The authors' ST video file is time-stamped 2025-09-10. The capture date is not stated, but the capture is no later than those dates (inference). It was **published** with the 2026 study. | code_or_data; direct; inference |
| Status | **Experimentally supported** as released data and code (we re-ran it). Reported by authors. **Not** the smartphone-grade device. | |
| Unresolved | Target material; capture rate; capture date; preprocessing script; meaning of the "GT patches"; why two zones are weak. | |

### R9. ST VL53L8 kit: camera localization (released dataset `st_spad_cam_localization`)

| Field | Value | Access |
|---|---|---|
| Identifiers | `paper/captured_data/st_spad_cam_localization/volume_000000…000357.npz` (358 frames); `paper/cam_localization.py` + `configs/cam_localization.yaml`. Committed 2025-11-26. **Not tied to SV3 or to `handheld_cam_localization.mov`**, which use a phone-shaped device and a different plot layout. | code_or_data; direct |
| Sensor / timing | Same ST VL53L8 family, 4×4 zones, 250 ps. | code_or_data |
| Hidden target | Assumed fixed at `obj_pos = [0, 0, 0.6]` (0.6 m from the wall) in code. `isDiffuse: False` (retroreflective falloff setting). Material not stated. | code_or_data; unresolved |
| Motion | **Sensor moves.** The wall point cloud changes every frame (up to 0.40 m deviation). The centroid shifts up to 0.30 m (x) and 0.18 m (y). Frame-to-frame steps: median 0.85 cm, maximum 8.2 cm. The union of sampled points spans 1.07 × 0.82 m, against about 0.63 × 0.53 m for one frame. `cam_z` (sensor to wall) is 0.433–0.567 m. Handheld or mounted: **unresolved**. Some frames have wall-point \|z\| up to 0.23 m, so the frame convention is not fully understood. | code_or_data; unresolved |
| Output | Estimated sensor (x, y) relative to the landmark; z taken from the data. | code_or_data |
| Reproduction | **Weak.** Our run correlates with the stored arrays (x 0.92, y 0.83) but sits a median 27 cm away. The stored arrays could not have come from the released script as configured. | code_or_data |
| Rate | No timestamps. Output-video writer at 12.8 fps (a playback rate). | code_or_data |
| Status | Released data, weak reproduction. **Do not use as film evidence**, except perhaps to show that "moving the sensor samples new wall spots", labelled accordingly. | |

### R10. AMS 3×3 sensor: hidden "U" reconstruction (released dataset `ams_U_reconstruction`)

| Field | Value | Access |
|---|---|---|
| Identifiers | `paper/captured_data/ams_U_reconstruction/iter_0…iter_36.npy` (37 pickled files; the script uses iter_1–36); `paper/reconstruction.py` + `configs/reconstruction.yaml` ("Calibrated parameters for AMS sensor"). Committed 2025-12-04. **Not tied to any paper figure.** | code_or_data |
| Sensor | "AMS sensor", model **unnamed**. 3×3 zones, 128 bins of **88 ps**, t0 = bin 13. | code_or_data; unresolved |
| Raw signal | **Raw** histograms. The wall peak is at bins 30–33, with peak values from about 1.4×10⁵ to 1.34×10⁶. Values are non-integer (processed or averaged counts). In frame iter_22, the later bump is 41–45 bins (3.6–4.0 ns; 108–119 cm of extra round-trip path) after the wall peak. The wall peak is **256–589×** the bump's excess over the local floor (256–576× with a minimum floor, 257–589× with an interpolated floor). The centre zone's bump is at 3.70 ns, and its wall peak is about 576× the bump. Calling the bump the hidden U's return is an interpretation consistent with the geometry. | code_or_data |
| Relay surface | Wall; sensor-reported sensor-to-wall distance 219–268 mm (centre zone 228–236 mm across positions). | code_or_data |
| Hidden target | A "U" shape, known only from the dataset name and the reconstruction. Material not stated. | code_or_data; inference |
| Motion | **36 positions hard-coded in the script** on a 6×6 serpentine raster: x 0–1.28 m (25.6 cm pitch), y 0.32–0.96 m (12.8 cm pitch). Positions are assumed, not measured. Controlled motion, static object. How the sensor was physically moved is unresolved; "not handheld" is inference from the grid. | code_or_data; inference |
| Output | **Reconstruction**: confocal backprojection (gates 30–89 bins after each wall peak) followed by a second difference along z. Our run gives a clear U (front view x 0.41–0.84 m, y 0.43–0.82 m), focused near z ≈ −0.31 m in the sensor-centred frame, about 0.54 m from the wall. | code_or_data |
| Rate / runtime | No capture rate. **Our** backprojection about 1.1 s (whole process 1.5–1.7 s warm, 3.3 s cold). Not the authors' timing. | code_or_data |
| Accuracy | None. | code_or_data |
| Status | Experimentally supported as released data and code. Reported by authors. A **different sensor** from R8. | |

### R11. ST plug-and-play live demo (repo root, added on publication day)

This is software and setup guidance, not an experiment with released results.

| Field | Value | Access |
|---|---|---|
| Hardware | ST **P-NUCLEO-53L8A1** kit (Nucleo-F401RE host + X-NUCLEO-53L8A1 shield with a "histogram-capable VL53L8"). Custom STM32 firmware (`firmware/vl53l8ch/`, ST ULD 2.0.10, CNH histograms), flashed with `flash.py`. Runs on a host computer over USB serial. Added in commit `f08d8d1`, 2026-05-20. | direct; code_or_data |
| Settings | 4×4 zones; 48 bins × 250 ps; tracking gate starting at absolute bin 30; **30 Hz requested** (the achieved rate is printed live by `track.py`, not documented). `integration_time_ms = 10` is sent, but ST's header says it has no effect in continuous mode, so do not call it the exposure. 45°×45° FoV assumed in the driver. 1000 particles, σ = 7 cm. The firmware boot defaults (8×8, 15 Hz, 100 ms, 18 bins) are overwritten by the host config. | code_or_data |
| Setup guidance | Flat relay wall filling the field of view; **sensor to wall < 1 m; wall to hidden object about 1–1.5 m**; "around 4 m" total round trip (48 × 250 ps × c = 3.60 m, derivation). "A matte, light-colored relay wall is ideal." Glossy or dark walls "deflect or absorb too many photons". Indoor ambient light is OK, but "direct sunlight on the wall will saturate the sensor". | direct; derivation |
| Calibration | `calibrate.py`: about 2 s average, a per-zone point cloud, an SVD plane fit to z = 0 (gives the sensor-to-wall distance), and a per-zone wall-peak bin. `track.py`: about **2 s empty-room background** (60 frames at 30 Hz, after a 5 s pause), then subtract, mask, shift and pad per frame. | direct; code_or_data |
| Timing info | First-run forward-model voxelization "~30 s on CPU"; firmware build "~1–2 minutes". `track.py` prints a live end-to-end FPS. **No published per-frame latency** (corrects the refuted claim that the voxelization was the only timing in the code). | direct |
| Outside use | One outside build attempt: PR #2 (Suren Jayasuriya, ASU, a README fix for an Apple M3 Pro build error; authored 2026-06-28 JST, merged 2026-07-24 UTC). **No results reported.** | code_or_data |
| Status | Code available. "Plug-and-play … no additional set-up" is the authors' framing; the workflow still needs firmware flashing, wall calibration and a background capture. | |

---

## 3. History (research-grade systems)

### H1. Velten et al. 2012: streak camera, Nature Communications 3:745

| Field | Value | Access |
|---|---|---|
| Citation | Velten, Willwacher, Gupta, Veeraraghavan, Bawendi, Raskar, "Recovering three-dimensional shape around a corner using ultrafast time-of-flight imaging", *Nat. Commun.* 3, 745, doi 10.1038/ncomms1747. Published **20 Mar 2012** (received 12 Sep 2011, accepted 13 Feb 2012; two searches). MIT. | search_summary; direct (citation in O'Toole 2018 ref. 15) |
| Precursor | Kirmani, Hutchison, Davis, Raskar, ICCV 2009, "Looking around the corner using transient imaging", a concept paper. Do not say that 2012 "invented the idea". | direct (O'Toole 2018 ref. 14) |
| Emitter | Kerr-lens mode-locked Ti:Sapphire laser, about 50 fs pulses, 75 MHz (one pulse every 13.3 ns), about 795 nm. Average power is about 500 mW per the companion preprint. The 80 fs / 790 nm / 800 mW values come from the sibling patent US 9,146,317, not US 9,148,649 (corrected). Script: "a femtosecond laser". About 1 mm spot, scanned by two galvo mirrors. | search_summary |
| Sensor | Hamamatsu **C5680 streak camera** imaging one line on the wall; 2 ps bins, about **15 ps effective** time resolution. | search_summary |
| Geometry | **Non-confocal.** The laser hits spots above or below the imaged line. Diffuser wall about 62 cm from the camera (low confidence). | search_summary |
| Hidden targets | An artist's mannequin about **20 cm** tall, about **25 cm** from the diffuser wall. "Wooden" comes from secondary sources only, and no reflective treatment is mentioned, so say "untreated" rather than "diffuse". Also letters I, T, I (8.2 cm high, the I 1.5 cm wide, at 22.2–25.3 cm). Fig. 3 uses a 2 cm × 2 cm white patch and 59 streak images. | search_summary; direct (figure copies via third-party mirror) |
| Acquisition | About 60 laser positions; 100 ms streak exposures (each averaging about 7.5 million laser periods). "50–200 readouts summed per position" was **not found** on re-check, so it is unresolved. **Total acquisition time unresolved** (minutes to hours; sources conflict). | search_summary; unresolved |
| Computation | Backprojection onto ellipsoids, then a second-derivative filter. Run time unresolved. | search_summary; direct (Fig. 3 caption copy) |
| Accuracy | Authors' abstract: "sub-millimetre depth precision and centimetre lateral precision over 40 cm × 40 cm × 40 cm of hidden space". This is surface-location precision, not the smallest resolvable detail. | search_summary (several, verbatim) |
| Limitations | "limited to diffuse reflection from near-Lambertian opaque surfaces"; parts occluded from, or facing away from, the wall are not reconstructed. | search_summary |
| Experiment date | Before Sep 2011 (inference from the received date). | inference |
| Status | Experimentally supported (by its authors). | |

### H2. O'Toole, Lindell, Wetzstein 2018: confocal SPAD, Nature 555:338–341

Common to all scenes (`direct`, from the Nature PDF and SI copies in a third-party GitHub mirror whose metadata match the
publisher's):

- **Dates:** published online **5 Mar 2018**, issue 15 Mar 2018 (received 29 Aug 2017, accepted 3 Jan 2018). Stanford EE.
- **Detector:** MPD PDM-series SPAD (100 µm), PicoHarp 300 at 4 ps.
- **Laser:** ALPHALAS PICOPOWER-LD-670-50: 670 nm, 30.6 ps, 10 MHz, 0.11 mW average.
- **Optics:** PBS251 polarizing beamsplitter (co-axial), GVS012 galvo. Wall about 2 m away at an oblique angle.
- **Timing:** system jitter about 60 ps (200 ps with the FL670-10 filter, used outdoors only).
- **Geometry: confocal.** "illuminates and images the same point … and raster-scans this point". In practice there are
  "two slightly different points" to reduce direct light.
- **Reconstruction:** light-cone transform (u = z², v = (tc/2)²) plus a Wiener filter, O(N³ log N).
- **Falloff model:** 1/r⁴ diffuse, 1/r² retroreflective.
- **Processing:** histograms are cropped, the first 600 bins zeroed, and the data downsampled to 16 ps bins.

| Sub-record | Target and material | Wall samples / area | Exposure | Capture total | Compute | Other | Access |
|---|---|---|---|---|---|---|---|
| H2a Exit Sign (main Fig. 3a,b; SI Fig. 5) | **Retroreflective** traffic sign 0.61 × 0.61 m | 64×64 over 0.8 × 0.8 m | 0.1 s/point | **6.8 min** | **1 s** MATLAB, 64×64×512, MacBook Pro 3.1 GHz i7 | indoor | direct |
| H2b Diffuse S (SI Fig. 8) | **Diffuse** letter (size and distance not given) | 64×64 over 0.7 × 0.7 m | 1 s/point | **68 min** | — | "significantly noisier"; quality "slightly lower" even with priors | direct |
| H2c Mannequin (SI Fig. 7) | Mannequin **coated with retroreflective paint** (not the 2012 figurine) | 64×64 over 0.7 × 0.7 m | 1 s/point | about 68 min (computed) | — | paint is a lower-grade retroreflector | direct; derivation |
| H2d Outdoor S (main Fig. 3c; SI Fig. 9) | **Retroreflective** S, 0.76 × 0.51 m, 115 cm from a light-and-dark stone wall; black-cloth occluder | 32×32 over 1 × 1 m | 0.1 s/point | **1.7 min** (total exposure) | 0.5 s, 32×32×1024 | **indirect sunlight about 100 lx**; filter on; data file header dated 15 Jul 2017 | direct; code_or_data |
| H2e Real-time tracking (SI Fig. 13) | **Retroreflective** planar sign moving across a room | 3 wall points about 60 cm apart | 0.1 s each | — | intersection of three spheres | **about 3 Hz, a 3D position only (tracking, not imaging)** | direct |
| H2f Resolution and dot charts (SI Fig. 4) | Retroreflective charts at 40 and 65 cm | 64×64 over 0.4 × 0.4 m | 0.1 s/point | about 6.8 min (computed) | — | predicted and confirmed lateral resolution about **2 cm at 40 cm** and **3.1 cm at 65 cm** | direct |

- **Proposed application** (p. 338): "commercial LIDAR systems may be capable of supporting the algorithms developed
  here with minimal hardware modifications." Real-time C-NLOS still needed a stronger (possibly SWIR) laser, parallel
  SPAD-array capture "for retroreflective objects", and a GPU or FPGA (p. 341). `direct`.
- **Released data:** 9 datasets plus the MATLAB code from the SI, in two separate third-party mirrors with byte-identical
  common files. Mean counts match SI Table 1 for all 9 scenes. Our NumPy port reproduces the shapes, which is a re-run,
  not replication. Our timings (1.7–8.7 s) are not the authors'. Licence unstated. `code_or_data`.
- **Status:** experimentally supported, each scene under its own conditions.

### H3. Nam et al. 2021: live 5 fps, Nature Communications 12:6526

| Field | Value | Access |
|---|---|---|
| Citation | Nam, Brandt, Bauer, Liu, Renna, Tosi, Sifakis, Velten, "Low-latency time-of-flight non-line-of-sight imaging at 5 frames per second", doi 10.1038/s41467-021-26721-x, PMC8586255. Published **11 Nov 2021**. Preprint arXiv 2010.12737 (24 Oct 2020; numbers differ, so use the published version). UW–Madison + Politecnico di Milano. | search_summary |
| Emitter | OneFive Katana HP: 532 nm, about 35 ps, about 700 mW at 5 MHz; scanned. | search_summary |
| Sensor | Two 16×1 fast-gated SPAD arrays (PoliMi), "a total of just 28 pixels" (7 TCSPC channels × 4 pixels). About 50 ps FWHM and 200 ns dead time (published Methods; the preprint's 75/85 ps differ). 40 ns gate. A 3 nm band-pass filter is confirmed only in the preprint. HydraHarp 400. | search_summary |
| Geometry / scan | Non-confocal. A sparse 190 × 22 laser grid remapped to a 1.9 m × 1.9 m virtual aperture (190 × 190); phasor-field virtual wavelength 8 cm. Camera to wall about 2 m (one search). Hidden depth range unresolved ("metres-scale"). | search_summary |
| Hidden target | **Natural, non-retroreflective objects and a person**, live. Fig. 4 "NLOS letterbox": eight frames from a 20 s live video of a person taking the letters N, L, O, S out of a box. | search_summary |
| Illumination | "Room light on" is shown for a demo clip (project page; UW news). Not shown to apply to every experiment. | search_summary |
| Motion | Sensor fixed; objects move. Maximum motion speed about 0.4 m/s (from the 0.2 s exposure and 8 cm resolution). | search_summary; derivation |
| Output / rate / latency | **Imaging** (reconstructed video frames). **0.2 s exposure = 5 fps; latency about 1 s.** Fast RSD in C++ on CPU and GPU. | search_summary |
| Authors' framing | Earlier live ToF NLOS needed retroreflective surfaces that "for the specific scenes and using this specialized confocal scanning capture technique provide signals at least 10,000 times higher than diffuse surfaces". The qualifier must stay. | search_summary |
| Code/data | C++ code and sample raw data on biostat.wisc.edu (blocked; contents and licence unverified). No GitHub release found. | search_summary |
| Status | Experimentally supported (by its authors). | |

---

## 4. Our illustrations (not experiments)

**I1. The film's room** (`geometry/layout.json`, `geometry_check.py`, 71 checks pass; re-run independently by
verification).

- **Layout:** room 4 × 3 m. Partition at x = 2.00 m, z 0.65–2.15 m (0.65 m gap; 1.7 m tall). S_A = (1.65, 0.90).
  H_A = (2.60, 0.85), r = 0.22 m. One row of 4 VL53L8-like zones.
- **Timings:** delay after the wall return 6.4–8.9 ns, or 25.6–35.4 bins of 250 ps.
- **Regions** (±3.75 cm bands; fine-grid values): 4 points give **about 0.35–0.38 × 0.07 m**. Moving the sensor (B1)
  gives about 0.24–0.27 × 0.07 m, roughly 30% shorter.
- **Fusion caveat:** the motion-compensated fusion (B2) is cell-for-cell identical to frame B2 alone. It avoids the
  naive failure but **does not sharpen**, so do not narrate it as sharpening.
- **Clearance caveat:** the drawn light segments clear the partition by at least 0.117 m. Flood light from the far edge
  of the B1 patch clears it by about 0.10 m.
- **Radiometry estimate:** third bounce / first bounce about 1/380 (flood zone) to 1/6,000 (single spot), best case.
- **Labels:** "illustrative", "simplified picture (2D)", "estimate". None of these are paper results.

---

## 5. Context systems (not the 2026 paper)

| ID | System | Relation | Key conditions | Status | Access |
|---|---|---|---|---|---|
| X1 | Callenberg, Shi, Heide, Hullin, "Low-Cost SPAD Sensing for NLOS Tracking, Material Classification and Depth Imaging", ACM TOG 40(4) Art. 61, SIGGRAPH 2021 (Bonn / Princeton) | Different group, earlier | ST P-NUCLEO-53L1A1 + **VL53L1X** sensors; NLOS tracking (the mirror setup uses a galvo) | **Independently demonstrated** low-cost SPAD NLOS tracking before 2026 | direct (repo README `CheapSPAD@c76c13f`); search_summary (venue) |
| X2 | Young, Batagoda, Zhang, Dave, Pediredla, Negrut, Raskar, ICRA 2025 (arXiv 2410.03555) | Same group | SPAD LiDAR, robot in an L-shaped corridor with hidden obstacles; ams TMF8828 (3×3, about 5 Hz) per search | Demonstrated by the authors' group in a lab; not independent | search_summary |
| X3 | DENALI, arXiv 2604.16201, CVPR 2026 (Behari … Raskar) | Same group (Raskar) | Low-cost LiDAR NLOS dataset (TMF8828), 72,000 histograms; sim-to-real gap reported | Not independent | search_summary |
| X4 | Scheiner et al., "Seeing Around Street Corners …", CVPR 2020 (arXiv 1912.06613) | Different modality | 76–77 GHz FMCW Doppler radar; facades and cars as relays; hidden pedestrians and cyclists; 21 scenarios, about 100 sequences; 60 m × 80 m region (confirmed in released code); localization MAE about 0.12–0.13 m | Independently demonstrated: radar detection and tracking, **not** crash reduction | search_summary; code_or_data |
| X5 | Replication check for the 2026 paper | n/a | Repo has 405 stars and 62 forks (1 open issue or PR). All 59 forks indexed by GitHub search point at upstream commits (32 at `fd347b9`, 27 at `15314de`), with no new code, data or results; 3 unindexed forks were unchecked. Five differently worded searches found no third-party reproduction. | **No independent replication found (absence of evidence, dated 2026-10-08)** | code_or_data; search_summary |
| X6 | Collision-safety evidence | n/a | No study shows any NLOS sensing reduces collisions in real traffic (two searches) | Absence of evidence | search_summary |

---

## 6. Number firewall: each number lives in one record

| Number | Record only | Never attach to |
|---|---|---|
| 30 Hz capture | R1 (caption + 30/s frame counter); R3 (30/s frame counter); R2 reported only | R8 dataset; any latency; R11 achieved rate |
| about 14 frame indices/s playback | R8 authors' video | any capture rate claim |
| 30 Hz requested | R11 demo config | R8, R9 data |
| about 100 pixels | smartphone-grade device (R1–R6, presumed) | ST kit (16 zones), ams (9 zones) |
| 16 zones, 250 ps | ST kit (R8, R9, R11) | smartphone-grade device |
| 9 zones, 88 ps | ams (R10) | R8, smartphone-grade device |
| 4.7 cm average error | R4 (ms only, unverified) | R1, R3, R8, final article |
| 8.1 cm median gap | R8 reproduction vs stored estimate | "accuracy" of anything |
| 25 ms per frame | our CPU, R8 | authors' latency |
| 256–589× wall/echo | R10 raw data, iter_22 | R8 (no wall peak), our 1/380 estimate |
| 1/380 to 1/6,000 | I1 estimate | any measurement |
| < 1 m, 1–1.5 m, about 4 m (3.6 m) | R11 README guidance | paper experiments |
| 0.82 m, 0.76 × 0.74 m, 0.60–1.65 m | R8 | R1, R11 guidance |
| 36 positions, 6×6, 1.28 × 0.64 m | R10 | R4 10×10 gantry; R5 |
| 10×10 stop-motion | R4 | R10 |
| 1000 particles | R8 code (and ms, all tracking) | — |
| σ = 7 cm (code) vs r = 5 cm (ms) | code vs ms | — |
| 6.8 min / 1 s | H2a | "seeing in one second" |
| 68 min | H2b (and H2c computed) | H2a |
| 1.7 min, 100 lx | H2d (retroreflective) | diffuse objects |
| about 3 Hz | H2e tracking | imaging |
| 5 fps, about 1 s latency, 28 pixels | H3 | 2026 |
| 20 cm, 25 cm, 40 cm cube | H1 | H2c mannequin |
| < US$100 | authors' abstract framing (search_summary) | the smartphone-grade device |
| about $100 / about $50 / "$10 Sensor" | project page 2026-05-14 (direct) / later cornar page (search) / ST video inset (direct) | each other |

## 7. Open items that only the Nature PDF/SI (or the authors) can close

1. SV1 device and display; whether it equals `diffuse_tracking_final.mov`; capture rate and latency.
2. Nature Fig. 5 contents; Figs 1–4 legends; Extended Data list.
3. Whether 4.7 cm (or any accuracy number) appears in the final article.
4. Material worn in the R8 capture; capture rate and date of R8, R9 and R10; the ams model.
5. The smartphone-grade device's identity, bin width, wavelength and laser class.
6. Verbatim abstract, including "for less than US$100 … no additional set-up" and the burst-photography/SAR sentence.
7. Received and accepted dates; the hyphen in "motion-induced" (the authors' own BibTeX has none).

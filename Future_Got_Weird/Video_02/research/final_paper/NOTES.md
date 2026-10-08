# Final Nature 2026 article: research notes

**Topic:** Somasundaram, Young, Dave, Pediredla, Raskar, "Imaging hidden objects with consumer LiDAR via motion-induced sampling", *Nature* 653, 693–699 (2026), doi:10.1038/s41586-026-10502-x.
**Compiled:** 2026-10-08, by a research subagent. The notes do not mention the channel owner.

---

## 0. How these facts were accessed

| Access label | Meaning here |
|---|---|
| `direct` | I read the primary text or file myself. In this session that covers only the authors' GitHub repos (`sidsoma/consumer-nlos` at commit `15314de4`, `sidsoma/sidsoma.github.io` at commit `c418157b`) and frames I extracted from an author-hosted GIF. |
| `code_or_data` | I inspected released code, configs or data arrays, using `np.load(allow_pickle=False)` or pickletools disassembly, so no data was unpickled or executed. |
| `search_summary` | The WebSearch tool reported it as coming from the named page. I did not read that page. |

**Blocked in this container:** nature.com, arxiv.org, media.mit.edu, cornar.media.mit.edu, ncbi/pmc, doi.org, crossref, semanticscholar, ieee and news.mit.edu. Single test fetches of researchgate.net, techxplore.com, zmescience.com and youtube.com also failed with a proxy 403 / CONNECT failure, so I did not retry them.

**Consequences:**
- **Nothing on nature.com was read directly.** Every statement about the final article is `search_summary`. I count a fact as cross-checked only when two or more differently worded searches agreed. Each fact below carries its confidence.
- **No figure images, full figure legends, Methods text or Supplementary Video files were viewed.** Neither the final article's figures nor its videos have been inspected.

---

## 1. Bibliographic record (final journal version)

| Field | Value | Access / confidence |
|---|---|---|
| Title | "Imaging hidden objects with consumer LiDAR via motion-induced sampling". The final version is hyphenated. The arXiv v1 title is "...via Motion Induced Sampling", without the hyphen. | search_summary, several searches; high |
| Authors (order) | Siddharth Somasundaram, Aaron Young, Akshat Dave, Adithya Pediredla, Ramesh Raskar. The repo `README.md` BibTeX and the author's `papers.js` give the same order. | search_summary + direct (repo); high |
| Affiliations | Massachusetts Institute of Technology, Cambridge, MA, USA: Somasundaram, Young, Dave, Raskar. Dartmouth College, Hanover, NH, USA: Pediredla. | search_summary (PubMed-style affiliation strings; arXiv listing); medium-high |
| Affiliation caveat | Akshat Dave is now an assistant professor at Stony Brook University, and Stony Brook's Research Connect portal lists the paper. Search reports that the portal shows only MIT and Dartmouth as affiliations on the article. I did not verify whether the final article adds Stony Brook to his entry. | search_summary; medium |
| Corresponding author | Siddharth Somasundaram | search_summary; medium-high |
| Received | **28 August 2025** | search_summary, 2 searches agree (both trace to the Nature "About this article" block); medium-high |
| Accepted | **7 April 2026** | search_summary, 2 searches agree; medium-high |
| Published online | **20 May 2026** | search_summary, many searches agree (Nature, PubMed "Epub 2026 May 20", MIT pages); high |
| Issue date | **21 May 2026**. Volume 653, issue **8115**, pages **693–699**. | search_summary (Nature page; PubMed "2026 May;653(8115):693-699"; Nature Asia highlights; Stony Brook portal "Published - May 21 2026"); high |
| PubMed ID | 42162390. The URL appeared in results, but one search could not confirm the record. | search_summary; medium |
| Article type | Nature research Article: main text, Methods, Extended Data, Supplementary Information, Peer Review File. The Peer Review File is listed only in one search snippet. | search_summary; medium |
| Earlier manuscript | arXiv:2605.17865 v1, cs.CV, submitted 18 May 2026, two days before journal publication. One search reports its figure captions say the preprint "has not undergone post-submission improvements or corrections", which would make it the submitted version. | search_summary; medium |
| Earlier working title | "Tracking Hidden Objects with Consumer LiDAR" (In Submission), listed on an MIT Media Lab group page | search_summary; low-medium |
| Competing interests | "The authors declare no competing interests." | search_summary (1 search); medium |
| Author contributions | S.S., A.D. and R.R. conceived the idea. S.S. and A.D. developed the forward model. S.S. developed the method, implemented the algorithm and wrote the manuscript. A.Y. built the experimental set-up. S.S. and A.Y. captured datasets and created figures. A.P. and R.R. supervised. All authors prepared the manuscript. | search_summary (1 search); medium |
| Funding (partial) | S.S. and A.Y. are funded by the NSF Graduate Research Fellowship Program. Search gave grant #2141064 from a project page. The snippet was truncated, so any other funders or hardware donors are **unresolved**. | search_summary; medium for the GRFP, unresolved for the rest |

**Date discipline:** **20 May 2026** is the *publication* date, not the experiment date.
- **Released data upload dates (`code_or_data`, from `git log` of the repo):** The ST person-tracking capture was first committed on **2025-10-20**, the ST camera-localization capture on **2025-11-26**, and the ams "U" reconstruction capture on **2025-12-04**. These are upper bounds for when those captures existed.
- **Capture dates:** The actual capture dates are **unresolved**.
- **Proprietary-device data:** The dates of the proprietary-device experiments are unknown. Their data were not released.

---

## 2. Abstract (final article)

I could not read the abstract in full. The sentences below are verbatim **as returned by WebSearch** from the Nature page and PubMed (`search_summary`). Their order follows the snippets. The opening sentence or sentences, about consumer LiDAR spreading into phones, headsets and robots, were **not** retrieved verbatim.

> "...These sensors measure the time-of-flight of light at picosecond resolution, which could enable them to image objects hidden from their field of view."
> "Although such non-line-of-sight (NLOS) imaging capabilities have been shown on research-grade LiDAR devices, they remain challenging to achieve on consumer devices due to poor signal quality resulting from low laser power, low spatial resolution, and object and camera motion." *(one search returned "they remain challenging to achieve on consumer devices"; wording of the tail is from a second snippet; treat as near-verbatim)*
> "Here we propose a multi-frame fusion strategy to overcome these challenges and demonstrate NLOS imaging on consumer LiDAR." *(The abstract also says the strategy is inspired by burst photography and synthetic aperture radar; exact placement unresolved.)*
> "We introduce the motion-induced aperture sampling model to unify the effects of object shape, object motion and camera motion under a single measurement model."
> "Using this model, we demonstrate several NLOS capabilities on a smartphone-grade LiDAR: (1) three-dimensional reconstruction; (2) single- and multi-object tracking; and (3) camera localization using hidden objects."
> "Our results represent a shift towards plug-and-play NLOS imaging, where anyone can image hidden objects with off-the-shelf hardware (for less than US$100) and no additional set-up."

**Version difference (`search_summary`):**
- **arXiv v1 wording:** "...off-the-shelf hardware (<100$) and no additional setup".
- **Extra arXiv sentence:** The arXiv abstract adds "In Supplementary Materials, we show that a commercially-available ST VL53L8CX can be used for NLOS tracking with no physical calibration or additional hardware needed."
- **Not verified:** Whether the final Nature abstract keeps an ST sentence is unverified. The Nature snippets I saw did not include it.

---

## 3. Figure list: final article vs earlier manuscript

### Final Nature article (`search_summary`; titles only unless noted)

| Final no. | Title (as reported) | Content as far as obtainable | Confidence |
|---|---|---|---|
| **Fig. 1** | **Consumer NLOS imaging** | **a:** "NLOS imaging is possible by turning nearby diffuse surfaces into virtual mirrors that reveal hidden objects." The caption names three challenges for consumer LiDAR: low SNR, the trade-off between virtual aperture size and sampling density, and joint object and camera motion.<br>**b:** three demonstrated capabilities on smartphone-grade LiDAR: 3D reconstruction, tracking, camera localization. Insets show the limitation of relying only on line-of-sight signals.<br>In the manuscript, Fig. 1b also carries the **quantitative** tracking/localization results, made with a gantry and stop-motion capture (see §6). | medium (caption text from ResearchGate figure page + arXiv snippets) |
| **Fig. 2** | **Motion-induced aperture sampling model** | Object shape defines a canonical space-time impulse response (STIR) I(x,y,v). Object motion translates that STIR by Δ. Camera pose P_t sets how the translated STIR is sampled. | medium |
| **Fig. 3** | **Tracking multiple hidden objects** | Manuscript equivalent (Fig. 4): **a**, one object moving on a **translation stage** plus one static object; **b**, NLOS **hand tracking**, with right and left hand distributions shown in blue and green. The person wears **retroreflective gloves**. | medium (title confirmed by 2 searches; panel content from manuscript) |
| **Fig. 4** | **Imaging hidden diffuse objects** | Manuscript equivalent (Fig. 5): the MAS model was derived assuming retroreflective reflectance, but empirically handles diffuse objects. Signal quality is worse because of lower SNR (r^4 falloff) and stronger non-confocal paths. The authors "are still able to reconstruct 3D shape and track objects in real-time." | medium |
| **Fig. 5** | **NLOS imaging in realistic scenarios with consumer LiDARs** | **New in the final article; no counterpart in arXiv v1 numbering.** The panel content and legend were **not retrievable**. The plural "LiDARs" *suggests* more than one device, but that is inference. Which devices (proprietary ~100-pixel unit, ST VL53L8 kit, ams sensor), scenes, distances or target materials appear in it is **UNRESOLVED**. | title: medium-high (3+ searches); content: unresolved |
| **Extended Data Fig. 1** | Particle filtering for NLOS object tracking | Three steps: particle propagation (motion prior), evaluation (data likelihood updates the prior), resampling. Corresponds to **manuscript Fig. 3**. | medium |
| Extended Data Fig. 2+ | ? | Not retrieved; **unresolved** | — |

### Mapping from the manuscript (arXiv v1) to the final article

The mapping below is by title match (`search_summary`).

| arXiv v1 figure | Final Nature figure |
|---|---|
| Fig. 1 Consumer NLOS imaging | Fig. 1 (same title) |
| Fig. 2 MAS model | Fig. 2 (same title) |
| Fig. 3 Particle filtering | moved to **Extended Data Fig. 1** |
| Fig. 4 Tracking multiple hidden objects | **Fig. 3** |
| Fig. 5 Imaging hidden diffuse objects | **Fig. 4** |
| none | **Fig. 5 NLOS imaging in realistic scenarios with consumer LiDARs** (new) |
| Supplementary Fig. 8 "Real-Time Tracking with ST VL53L8CX SPAD" | not known whether it survives in the final article, or whether its content moved into final Fig. 5 (**unresolved**) |
| Supplementary Figs 9–10 (quantitative x-y patch tracking, trajectory recovery) | final location unresolved |

**Rule for the episode:** Never cite "Fig. 5" without the version. Manuscript Fig. 5 is the diffuse-objects figure. Final Fig. 5 is the realistic-scenarios figure. The manuscript supplement says "The diffuse tracking result in Fig. 5 of the main text is available as a video result." That is **manuscript** numbering, so in the final article this most likely points to **Fig. 4**. This is inference.

---

## 4. Supplementary Videos (final article)

The captions below come from `search_summary`. Several searches agree on SV1, and SV2 and SV3 are consistent across searches. One search could not see the SV2 label.

| Video | Caption as reported | Target material | Capture rate | Confidence |
|---|---|---|---|---|
| **Supplementary Video 1** | "**Real-time diffuse tracking:** we can track a hidden person around the corner without any special retroreflective materials at 30 Hz capture." | **Diffuse** (no retroreflective clothing) | **30 Hz capture** | high for the caption text (≥4 searches) |
| Supplementary Video 2 | "**Hand tracking:** we can track multiple objects, including both hands of a person, at 30 Hz. Here, the person is wearing retroreflective gloves to isolate the signal coming from the hands from the light arriving from the torso." | **Retroreflective gloves** | 30 Hz | medium-high |
| Supplementary Video 3 | "**Handheld camera localization:** we can use the hidden object (a retroreflective patch here) to localize the camera even under unstructured handheld camera motion. Capture is at 30 Hz." | **Retroreflective patch** | 30 Hz capture | medium-high |

### What is and is not established about Supplementary Video 1

**Established, as reported by the authors in the caption (`search_summary`):**
- the target is a hidden **person**
- it is tracked "around the corner"
- **no special retroreflective materials** are used
- capture is at **30 Hz**
- the result is described as **tracking**, not reconstruction

**Not established. I did not view the MOV file, and none of the following is stated in any retrieved text:**
- **Device:** which device recorded it. It could be the proprietary smartphone-grade unit or the ST VL53L8 kit. **UNRESOLVED.**
- **Display:** what the clip shows on screen. A top-down probability map, a trajectory, side-by-side camera footage and the update rate of the display are all **UNRESOLVED** for SV1 itself. The manuscript supplement says that for the real-time diffuse tracking video, "each frame computes the kernel density estimation (KDE) of the particles to produce a probability distribution for the object position", plotted as a contour map. That is `search_summary` of the manuscript, not the final SV1.
- **Algorithm latency:** whether processing ran on-line at 30 Hz is **UNRESOLVED**. "30 Hz capture" is a sensor frame rate, not a latency.
- **Geometry:** distances, wall material, occluder type and accuracy are **UNRESOLVED**.
- **Prior knowledge:** whether the hidden person's shape was supplied as known, for example a point or canonical model, is **UNRESOLVED**. The released code tracks with a **point canonical model** (`canons/point.npy`), which is an inference about likely practice.

**Closely related asset I inspected directly (not confirmed to be SV1):**
- **What it is:** The author's personal-site repo (`github.com/sidsoma/sidsoma.github.io`, commit `c418157b39f4739413c0bfdf22e50cb747df36fd`) contains `assets/projects/consumer-nlos/nlos_track.gif` (154 frames) and `nlos_track_full.gif` (173 frames). Both are 240×240 with 100 ms per GIF frame. That is the GIF playback timing, not the capture rate.
- **What it shows:** frames I extracted directly.
  - The video is **overhead**, of a person in ordinary clothing (grey T-shirt; **no retroreflective clothing visible** at this resolution).
  - The person walks in a floor area marked by **four green squares**, behind a **black curtain/partition occluder**.
  - Callout labels read "**Hidden Person**" and "**Consumer LiDAR**". The second points to a small sensor on a post/arm on the other side of the occluder.
  - An inset shows a **top-down plot** with a red-to-yellow **probability heat blob**, which reads as a particle KDE. It also shows markers for the four floor squares, a diagonal line and a vertical bar, probably the relay wall and the occluder.
  - The output is a **position estimate, not an image or reconstruction** of the person.
- **Not shown:** The device model is not identified in the GIF.
- **Rights:** The repo has **no licence file** (the README only says the site code is adapted from Jon Barron's site). The GIF shows an **identifiable person**. Treat it as reference only: no reuse without written permission. It is not committed to this project. A local clone is in the session scratchpad and can be re-cloned from the commit above.

---

## 5. Devices: keep these three separate

| Device | What it is | Where it appears | Raw-histogram access | Access / confidence |
|---|---|---|---|---|
| **Proprietary smartphone-grade LiDAR** | A "portable smartphone LiDAR system with ∼100 pixels, each consisting of a co-located laser emitter and single-photon avalanche diode (SPAD) sensor". Each SPAD pixel shares an optical axis with one laser spot (a quasi-confocal geometry, which the authors compare to O'Toole et al. 2018). Vendor and model are **not named** in anything retrieved. | Main-text "smartphone-grade LiDAR" results. Its data are **not released**. Exactly which figures and videos used it is **UNRESOLVED**. | **UNRESOLVED.** No retrieved text says how histograms were obtained (vendor SDK, development kit, firmware). In press coverage, Somasundaram says phone users cannot do this yet because manufacturers would need to release raw data, "which they often don't do" (Digital Trends; ChannelNews). | search_summary (arXiv snippets + IEEE Spectrum "about 100 pixels"); medium-high for ~100 px; vendor unresolved |
| **ST VL53L8 evaluation kit (open demo)** | STMicroelectronics multizone dToF SPAD. The repo README targets the **P-NUCLEO-53L8A1** kit (Nucleo-F401RE host + X-NUCLEO-53L8A1 shield with a "histogram-capable VL53L8"). Code and README name the part **VL53L8CH**. The manuscript and some summaries say **VL53L8CX**. The naming discrepancy is **unresolved**; the repo is the authoritative source for the demo hardware. | Manuscript Supplementary Fig. 8 "Real-Time Tracking with ST VL53L8CX SPAD". Released datasets `st_spad_person_tracking` (475 frames) and `st_spad_cam_localization` (358 frames). Whether it appears in final Fig. 5 is **unresolved**. | Custom STM32 firmware in `firmware/vl53l8ch/`, flashed with `flash.py`. Histograms are streamed over serial at 2,250,000 baud. The demo defaults are **48 bins × 250 ps**, **30 Hz** ranging frequency and ~4 m total round-trip range. The released ST data arrays are **16 zones (4×4) × 128 bins**. Paper configs use `t_res: 250e-12`. | direct + code_or_data; high |
| **ams sensor (in code)** | `paper/configs/reconstruction.yaml` says "Calibrated parameters for AMS sensor": **bin_width 88 ps**, **128 bins**, t0 = bin 13. The released capture `ams_U_reconstruction` (37 files) has histograms shaped **(3, 3, 128)**, i.e. **3×3 zones**. No part number appears anywhere in the repo. A 3×3 multizone ams dToF part such as the TMF8820/TMF882x family would fit, but that is **inference only**. | 3D reconstruction (backprojection) of a hidden "U" shape, from the dataset name. Its place in the final figures is **unresolved**. | Not documented in the repo | code_or_data; high for the parameters, model unresolved |

**Episode rule:**
- **Separate devices on screen.** The "<$100, off-the-shelf" framing and the open code apply to the ST kit (and possibly the ams part). The headline smartphone-grade (~100-pixel) results came from a device whose data are withheld ("proprietary").
- **No phone app.** No ordinary phone app can do this today, according to the lead author's quotes in press coverage.

---

## 6. Experiments, outputs and numbers: one setup per row, not combined

| Experiment | Output type | Device | Target | Motion / prior knowledge | Number(s) | Access / confidence |
|---|---|---|---|---|---|---|
| Quantitative tracking (manuscript Fig. 1b; supplement S4.1) | **Tracking** (x–y position) | Smartphone-grade unit presumed; **not confirmed** | **25×25 cm retroreflective patch** on a mechanical translation stage, moving in the x–y plane parallel to the wall over a **10×10 grid** | **Gantry, stop-motion capture** at 10×10 locations. "For results without quantitative evaluation, the data is captured in real-time." | "The average position error over the entire trajectory is **4.7 cm**." Tracking error is strongly correlated with the object's position relative to the virtual aperture (smaller near it). | search_summary of **manuscript**; 2 searches returned 4.7 cm, but an exact-phrase search found nothing. medium-low. **Final-article value not verified.** |
| Particle filter vs backprojection baseline (manuscript) | Tracking | same as above | retroreflective | — | Particle filter uses **1000 particles**. The baseline uses a **30×30×30** voxel cube. Authors state the PF is "more robust to noise and more computationally efficient". No timing numbers. | search_summary; medium |
| Camera localization (manuscript Fig. 1b quantitative; SV3 qualitative) | **Camera localization** (5D pose; roll not modelled) | unresolved | **Retroreflective patch** as the hidden landmark; featureless white wall | Quantitative = gantry stop-motion. SV3 = unstructured handheld, 30 Hz capture. | No localization error number retrieved (**unresolved**) | search_summary; medium |
| Multi-object / hand tracking (final Fig. 3; SV2) | **Tracking** of 2 objects | unresolved | **Retroreflective gloves**; also one translation-stage object + one static object | Known shape (canonical model) | 30 Hz capture; no error number | search_summary; medium |
| 3D reconstruction of static objects | **3D reconstruction** (coarse) | smartphone-grade (main text); separately, an ams 3×3 sensor "U" dataset in the code | Static hidden objects. Press: "letters", "cardboard cutouts". | Natural handheld motion **with known camera pose** creates a synthetic aperture; filtered backprojection; static scene only (motion blurs FBP) | No resolution or error number retrieved | search_summary + code_or_data; medium |
| Diffuse objects (final Fig. 4) | Reconstruction + real-time tracking | unresolved | **Diffuse** | — | Qualitative only; worse SNR | search_summary; medium |
| Realistic scenarios (final Fig. 5) | unresolved | unresolved ("consumer LiDARs", plural) | unresolved | unresolved | unresolved | title only |
| Hidden-person diffuse tracking (SV1) | **Tracking** | **unresolved** | Person, **no retroreflective materials** | unresolved | 30 Hz capture | search_summary; high for the caption |
| ST VL53L8 demo (manuscript Supp. Fig. 8; repo) | **Tracking**: live top-down view (dashboard) | ST VL53L8CH/CX kit | Released sample is named "person_tracking". Its config sets `isDiffuse: False`, commented "set to False for retroreflective objects", so the sample is processed under the retroreflective model. Whether the person wore retroreflective material is **unresolved**. | Planar relay wall calibration + ~2 s empty-scene background capture + point canonical model. Repo guidance: SPAD↔wall < 1 m; wall↔hidden object ~1–1.5 m; ~4 m total round-trip range at 48 bins × 250 ps. | 30 Hz ranging frequency (config). First-run forward-model voxelization ~30 s on CPU. | direct / code_or_data; high |
| Press-reported scenes | — | — | "moving mannequin, cardboard cutouts, and letters ... behind walls and large partition dividers" | — | — | search_summary (Tech Xplore); low-medium; which figure each belongs to is unresolved |

**Range or distances for the paper's own experiments:** **UNRESOLVED.** The only distances found are the repo's demo guidance above, which are not paper numbers. The project FAQ lists "handling longer ranges (several meters)" as an **open problem** (`search_summary`).

**Wall / relay surface:** The manuscript describes camera localization on a "featureless white wall". The repo recommends a matte, light-coloured relay wall. Wall materials for the other final-article experiments are **unresolved**.

---

## 7. Computation time and latency

**Capture frequency (established):**
- **Authors' captions:** **30 Hz capture** (SV1–SV3, `search_summary`).
- **Project page:** "real-time tracking of hidden objects at 30 frames/second" (`search_summary`).
- **Demo code:** `ranging_frequency_hz = 30` (`direct`).

**Algorithm latency per frame:** **UNRESOLVED.** No ms-per-frame figure, and no compute hardware (CPU/GPU) for the paper's real-time runs, was found in any retrieved text.

**From code (`direct`), not paper results:**
- **Demo start-up:** voxelizing the forward model takes "~30 s on CPU on first run".
- **Offline scripts:** `paper/tracking.py` and `cam_localization.py` write result videos at 14.0 and 12.8 fps. Those are **playback** rates of rendered output, not capture or processing rates.

**Episode rule:** Say "the sensor captured 30 frames per second". Do not say "the system computed the answer in 1/30 s".

---

## 8. Limitations stated by the authors

All items below are `search_summary` unless noted.

- **Retroreflective model assumption.** The model assumes the measured light comes mostly from retroreflective returns. Experiments used objects covered in retroreflective material. Diffuse objects work empirically, but the results are "inherently worse" because of the weaker signal (r^4 falloff) and non-confocal light paths (manuscript).
- **Prior knowledge.** Tracking assumes a **known object shape**. Reconstruction assumes **known camera pose** and a static scene. Camera localization assumes 5D motion (no roll). Reflectance and pulse-width effects are simplified. These come from the manuscript and a review summary.
- **Project FAQ (cornar.media.mit.edu):**
  - "early-stage research prototype rather than a fully deployable sensing system"
  - current reconstructions "primarily recover sparse geometric and motion information from extremely weak indirect measurements"
  - it does not produce conventional photographic imagery
  - open problems: longer ranges (several meters), more difficult environments, robustness to highly unpredictable or non-rigid motion, extremely low-light or high-noise environments, reliable real-time performance on mobile hardware
- **Press, lead author (IEEE Spectrum):** do not expect photographs. There is "a large gap" before megapixel-like detail. Phone makers restrict raw LiDAR data access.
- **Secondary claim, unverified:** a blog says the model assumes rigid-body translation and struggles with rotation or posture changes. Do not use it without a primary source.

---

## 9. The "under $100 / no additional set-up" claim

**Exact final-abstract wording (`search_summary`, ≥4 searches):**
> "Our results represent a shift towards plug-and-play NLOS imaging, where anyone can image hidden objects with off-the-shelf hardware (for less than US$100) and no additional set-up."

**Context:**
- **Manuscript abstract:** ties the claim to "a commercially-available ST VL53L8CX ... with no physical calibration or additional hardware needed" (Supplementary Materials).
- **Manuscript supplement:** describes the workflow as "minimal calibration": (1) point the camera at a relay surface, (2) calibrate the point cloud of the planar surface, (3) apply the particle-filtering tracking algorithm.
- **Repo workflow (`direct`):**
  - buy the P-NUCLEO-53L8A1 kit
  - install an ARM cross-compiler
  - flash custom firmware
  - set up a Python env with PyQt
  - wall calibration (`calibrate.py`)
  - ~2 s empty-scene background capture
  - a canonical point model
  - geometry constraints (wall < 1 m; object ~1–1.5 m)
- **Verdict:** "No additional set-up" is the authors' framing. Accurate on-screen wording would be "about $50–100 of off-the-shelf parts, plus calibration to a flat wall and an empty-room background capture".

**Cost figures in circulation. Attribute each one; do not merge:**
- **Under US$100:** Nature abstract; MIT Media Lab post ("less than $100 and no specialized calibration"); IEEE Spectrum.
- **About $50 for the ST sensor:** project page "Try it yourself" ("Order the ST sensor (~$50)"). Nature Podcast summary and Digital Trends: "assemblable for under $50".
- **Earlier systems:** "a specialized $50,000 imaging setup" (Somasundaram quote, MIT Media Lab post) vs "$0.5 million to $1 million" (Somasundaram quote, IEEE Spectrum). These describe different equipment or framing. Quote one with its source, or neither.

---

## 10. Data and code availability; licences

**Data availability (final article, `search_summary`, 2–3 searches agree):**
> "Code and data are publicly available at https://github.com/sidsoma/consumer-nlos. Some of the data used in this manuscript are not available due to use of a proprietary device. All other data captured with off-the-shelf hardware are released via the above link. Additional videos, explanations, and overview about the work is available at project website."

- **Code availability:** a separate Code availability heading was not confirmed. The data statement covers code.
- **Code licence (`direct`):** **MIT License**, "Copyright (c) 2025 sidsoma" (moved to the repo root in commit `15314de4`, 2026-07-23). The MIT licence covers "the Software and associated documentation files". Whether it covers the captured data is **ambiguous**.
- **Repo timeline (`direct`):**
  - 2025-10-17: initial commit
  - 2025-10-20: tracking code + ST person-tracking data
  - 2025-11-26: camera localization
  - 2025-12-04: ams reconstruction code/data
  - 2026-05-20, publication day: plug-and-play demo, firmware, data moved under `paper/`
  - 2026-06-28 and 2026-07-23: README fixes and licence move
- **Availability is not replication.** Released code and data are not independent replication. No independent reproduction of the 2026 consumer setup was found in this pass.

**Article licence (`search_summary`, 2 sources):**
- **Not open access.** PubMed's copyright line reads "© 2026. The Author(s), under exclusive licence to Springer Nature Limited". The Nature "Rights and permissions" block reads "Springer Nature or its licensor (e.g. a society or other partner) holds exclusive rights to this article under a publishing agreement with the author(s) or other rightsholder(s)...". **This is not a CC BY open-access article.**
- **Figure reuse:** final-article figures, Extended Data and Supplementary Videos need permission from Springer Nature (RightsLink / permissions). Do not embed them without clearance. Re-draw the geometry in original animation and cite the source.
- **arXiv v1 licence:** one search reported **CC BY 4.0**. A second search could not confirm it, so confidence is **low-medium**. If confirmed, manuscript figures (arXiv numbering) could be reused with attribution. That would not extend to the final article's new Fig. 5 or to the final layout.

---

## 11. Secondary corroboration (press)

**MIT Media Lab news post:** "MIT Media Lab Researchers Turn Everyday LiDAR Into an Around-the-Corner Camera" (media.mit.edu/posts/...). `search_summary`.
- **Byline and date:** one search says by David Sweeney, image credit Aaron Young, dated **May 13, 2026**. Another search found no date or byline on the page. The text says "In a paper published today in *Nature*", which implies **May 20, 2026**. The date is **conflicting/unresolved**.
- **Claims:** "off-the-shelf hardware costing less than $100 and no specialized calibration". Reconstructs hidden 3D objects. Tracks moving targets "including a user's hands". Uses hidden objects as landmarks for camera localization. "turns the natural shake of a handheld device into an asset". "$50,000 imaging setup" quote.
- **Caveat it repeats:** results are strongest with reflective objects but also work on diffuse surfaces.

**IEEE Spectrum:** spectrum.ieee.org/smartphone-grade-lidar. Listing title "Smartphone-Grade Lidar Sees Around Corners On the Cheap", on-page headline reported as "Seeing Around Corners Using Smartphone-Grade Lidar". By **Charles Q. Choi**, dated **20 May 2026** (one search; the MIT repost credits Choi). `search_summary`.
- **Hardware:** "a portable smartphone lidar system that has about 100 pixels, each consisting of a laser emitter combined with a single-photon detector".
- **Somasundaram quotes:** $0.5–1 million for early systems; "democratization of the technology"; driving and robotics use-cases; outputs are "sparse geometric and motion information"; a large gap remains before megapixel detail.

**Nature Podcast, 22 May 2026:** segment "Using LiDAR to look around corners" (`search_summary`).

**Other coverage (lower weight):**
- **Tech Xplore** (May 2026): mannequin, cardboard cutouts, letters, partition dividers; "rough 3D reconstructions".
- **Digital Trends, ChannelNews, HotHardware, ZME Science, EP&T** (22 May 2026), **LidarNews**.
- **Nature** has a YouTube Short (shorts/UmE1wd9kJAA) and **MIT Media Lab** a video "Seeing around corners with consumer LiDAR" (watch?v=N3LEhhQz-cM). I could not view either; their content is unknown.

**Context only, not this paper:** a separate arXiv preprint, DENALI (2604.16201), builds an NLOS dataset with low-cost LiDARs (~$10 module, 128-bin histograms, 3×3 or 8×8 modes). Search reports it states that practical NLOS imaging had not yet been demonstrated on consumer LiDAR hardware. Its authors were not identified. It is not a replication.

---

## 12. Claim classification for the script

| Claim | Class |
|---|---|
| A hidden person was tracked around a corner without retroreflective clothing, with 30 Hz capture (SV1) | **Reported by authors** (caption). Device, accuracy and latency unknown. |
| Multi-object tracking of both hands at 30 Hz with retroreflective gloves | Reported by authors, experimentally supported in their setup (retroreflective) |
| ~4.7 cm average tracking error | Reported by authors **in the manuscript**, for a **gantry-moved 25×25 cm retroreflective patch** with stop-motion capture. Do not attach it to SV1 or to handheld/diffuse use. |
| 3D reconstruction of static hidden objects with handheld motion | Reported by authors. Requires known camera pose. Coarse output. |
| Camera localization from a hidden retroreflective patch, handheld | Reported by authors (SV3). No error number retrieved. |
| "<$100, no additional set-up" | Authors' framing. In practice it needs calibration and a background capture (repo). |
| NLOS imaging/tracking in general works | **Independently demonstrated by other systems** (Velten 2012; O'Toole 2018; 2021 live imaging; other groups). |
| Phones will see around corners / safer blind intersections | **Proposed application** (authors, press). Not demonstrated. |
| Open code = replicated | **No.** Code availability is not independent replication. |
| "Smartphone" results = the open ST kit | **No.** Separate devices; proprietary data withheld. |

---

## 13. Unresolved, to do if nature.com becomes readable or the user can supply a PDF/video

1. Final Fig. 5 panels, legend, devices, scenes, distances and target materials.
2. SV1: device, display content, whether processing was on-line at 30 Hz, accuracy, distances, wall material.
3. The proprietary smartphone-grade device: vendor, model, and how raw histograms were accessed.
4. VL53L8CH (repo) vs VL53L8CX (manuscript) naming.
5. Final-article accuracy numbers, and whether the manuscript's 4.7 cm figure survives.
6. Per-frame algorithm latency and compute hardware.
7. Extended Data Figs 2+ and Supplementary Information contents.
8. Full verbatim abstract (first sentence(s)).
9. Full acknowledgements, including any hardware donors.
10. arXiv v1 licence (CC BY 4.0?).
11. MIT Media Lab post date (May 13 vs May 20) and byline.
12. Model of the ams sensor in the code.
13. Capture dates of each experiment.

## Sources

**Primary (journal, preprint and project; all blocked here, so read only through search):**
- Nature article: https://www.nature.com/articles/s41586-026-10502-x
- arXiv: https://arxiv.org/abs/2605.17865, https://arxiv.org/html/2605.17865v1
- PubMed: https://pubmed.ncbi.nlm.nih.gov/42162390/
- Project page: https://cornar.media.mit.edu/ (also https://www.media.mit.edu/projects/consumer-nlos/overview/)

**Authors' GitHub (read directly):**
- Code: https://github.com/sidsoma/consumer-nlos (commit 15314de422a765a2d1b72ea7037dfafb2f908d7c), local `/home/user/ext_sources/consumer-nlos`
- Author site repo: https://github.com/sidsoma/sidsoma.github.io (commit c418157b39f4739413c0bfdf22e50cb747df36fd)

**Press and other secondary:**
- MIT Media Lab post: https://www.media.mit.edu/posts/mit-media-lab-researchers-turn-everyday-lidar-into-an-around-the-corner-camera/
- IEEE Spectrum: https://spectrum.ieee.org/smartphone-grade-lidar
- MIT Media Lab repost of the IEEE Spectrum article: https://www.media.mit.edu/articles/seeing-around-corners-using-smartphone-grade-lidar/
- Nature Podcast (MIT page): https://www.media.mit.edu/articles/how-mobile-phones-might-one-day-be-able-to-see-around-corners/
- Tech Xplore: https://techxplore.com/news/2026-05-smartphones-track-hidden-lidar.html
- Digital Trends: https://www.digitaltrends.com/phones/the-lidar-sensor-on-your-iphone-could-soon-let-you-see-around-corners/
- ChannelNews: https://www.channelnews.com.au/smartphones-could-soon-see-around-corners-with-lidar-breakthrough/
- EP&T: https://www.ept.ca/mit-researchers-turn-lidar-sensor-into-an-around-the-corner-camera/
- ResearchGate Fig. 1 page: https://www.researchgate.net/figure/Consumer-NLOS-imaging-a-NLOS-imaging-is-possible-by-turning-nearby-diffuse-surfaces-into_fig1_405075594
- Stony Brook Research Connect: https://researchconnect.stonybrook.edu/en/publications/imaging-hidden-objects-with-consumer-lidar-via-motion-induced-sam/

# Opening evidence: what we can honestly show in the cold open

Compiled 2026-10-08 from `EXPERIMENT_RECORD.md` (record IDs R1–R11, H1–H3). This file also defines the conditions chips
that DIRECTION.md §5 points to.

## 1. Decision

**Use the authors' released ST evaluation-kit person-tracking data (record R8), visualised by us.** It is the only real
2026 measurement that is both accessible in this container and reasonably showable.

- **Picture.** The hidden person's estimated position moves behind the partition in a top-down plot, computed by the
  authors' own tracking code that we ran unmodified on their data (`fig3_tracking_trajectory_topdown.json`).
- **Optional second beat.** The raw echo delay in the same data rises and falls with the person's distance from the
  wall (`fig2_st_later_return_energy_over_frames.json`).
- **Why it is honest.** These are the authors' files and the authors' algorithm. Only the rendering is ours.
- **What it is not.**
  - It is not the headline smartphone-grade device.
  - It is not Supplementary Video 1.
  - It is not documented as a person in ordinary clothes.
  - It is not a 2026 capture.
  - It is not an image of the person.
  - It carries no accuracy number.

## 2. What is and is not accessible here

| Candidate | Accessible in this container? | Showable? | Notes |
|---|---|---|---|
| Nature Supplementary Video 1 (diffuse person, 30 Hz capture; R1) | **No.** nature.com is blocked, so it could not be downloaded or viewed. | Only with Springer Nature / author permission | The caption is known only from search summaries. |
| Nature Figs 1–5, Extended Data, SV2–SV3 | **No** (blocked) | Permission needed (reported "exclusive licence to Springer Nature"; unverified) | Fig. 5 content is unknown. |
| Authors' project-page videos (`diffuse_tracking_final.mov`, `diffuse_tracking_st.mov`, `hand_tracking.mov`, `handheld_cam_localization.mov`, `reconstruction.mov`) | **Yes.** Recovered from the author site repo `sidsoma/sidsoma.github.io@48b57f43` via raw.githubusercontent. Contact sheets are in `manuscript/evidence/`. | **No, reference only.** There is no licence, and identifiable people appear. | Best authentic footage; needs written permission. |
| Author GIFs `nlos_track(_full).gif` | Yes (site repo `@c418157b`) | No (no licence; identifiable person) | Same lab and floor-square layout as the ST video. |
| **Released ST person-tracking data (R8) + authors' code** | **Yes** (repo `sidsoma/consumer-nlos@15314de`, MIT licence) | **Yes, with credit.** See RIGHTS.md for the data-licence caveat. | **Recommended.** |
| Released ams raw histograms / U reconstruction (R10) | Yes | Yes, with credit | A different sensor and a controlled raster. Good for S3.3 and S6.7, not for the opening. |
| Released ST camera-localization data (R9) | Yes | Yes, with credit | Weak reproduction; avoid. |
| 2018 O'Toole data re-run by us (H2) | Yes (third-party mirror) | **No.** The licence is unstated, so it needs permission. | Reference only. |

## 3. Facts the opening must respect (from R8)

**Data**
- 475 frames.
- 16 zones (4×4) with 250 ps bins.
- Already background-subtracted, with the wall peak removed.
- No timestamps.

**Sensor and geometry**
- The sensor is fixed, about 0.82 m from the wall. That distance is the authors' code constant "used only for
  visualization".
- The wall points come from calibration and span 0.76 × 0.74 m.
- The partition line and the four green squares are **constants in the authors' plot code**, not measurements. The green
  squares are physical floor markers in the authors' video.

**Target material is undocumented.**
- The authors' video of this capture (`diffuse_tracking_st.mov`) shows a person in a blue T-shirt and shorts, with no
  visible retroreflective material.
- That video almost certainly shows this dataset: blob centres match the stored estimates within about 2–10 cm at 6
  frames.
- **However,** the config processes the data with the retroreflective-falloff setting (`isDiffuse: False`).
- No text states what the person wore.

**Dates**
- Capture date not stated.
- Files were committed 20 Oct 2025, and the authors' video file is time-stamped 10 Sep 2025.
- The data were **published** with the Nature study on 20 May 2026.

**Rate**
- Capture rate is **unresolved**. The authors' video plays about 14 frames/s; the live demo requests 30 Hz.
- Show frame numbers only, never seconds or "30 frames per second".

**Accuracy**
- None can be computed, because no ground truth was released.
- Our re-run tracks the authors' stored estimate closely (median gap 8.1 cm). That is reproducibility, not accuracy.

## 4. Recommended opening sequence and exact on-screen labels

Label sizes follow DIRECTION.md §5: guard-rail chips at 30 px or more.

### Beat A (S1.3): "the board". The tracked position moves behind the partition.

**What to draw:**
- Relay wall bar.
- The 16 measured wall points as small dots.
- Sensor marker at (0, 0.82).
- Partition line at x = −0.30 m, z 0.65–1.6 m.
- Primary track: **the authors' stored estimate** (`stored_particles_mean_xyz`), as a moving dot with a short fading
  trail.
- Optional: our re-run (`ours_seed0_mean_xyz`) as a faint dashed line.
- Advance the frame counter from 1 to 475 at an arbitrary, stated pace.

**Exact labels:**

| Slot | Text |
|---|---|
| Headline | **Real sensor data** |
| Source chip | **Authors' released data · Somasundaram et al., Nature 2026** |
| Conditions chip | **Low-cost ST kit sensor · held still · hidden person behind a screen** |
| Output chip | **Estimated position · not an image** |
| Fine print (bottom strip) | **Authors' code and settings, run by us · clothing not documented · frame numbers, not seconds** |
| Layout legend (small) | **Wall points: measured · sensor & screen: from the authors' plot** |
| If our re-run is shown | **dashed: our re-run of their code (median 8 cm from theirs)** |

**Do not use these labels:**

| Label | Why not |
|---|---|
| "Real measurements · 2026" (current storyboard S1.3) | The capture predates Oct 2025. Use "Nature 2026" only in the source chip, as the publication. |
| "retroreflective target" | Not documented. Only the processing setting is retroreflective. |
| "ordinary clothes" / "no special clothing" | That is reported only for the smartphone-grade device's clip (R1). |
| "30 frames per second", "real time", "live" | The capture rate of this dataset is unresolved. Our rendering is a replay. |
| "smartphone", "phone sensor", "about 100 pixels" | This is the 16-zone ST kit. |
| Any "accuracy" or "± cm" | No ground truth was released. |

### Beat B (optional, S1.3 or S3): "the clue is in the timing"

**What to draw:**
- The energy-weighted echo delay per frame (`energy_weighted_mean_extra_path_cm`, 173–260 cm of extra round-trip path),
  as a trace under the board.
- The same frame index as Beat A.

**Exact labels:**
- Title: **"Echo delay, same data"**
- Axis: **"extra light path (cm)"** and **"frame"**
- Source chip: **"Authors' released data · our analysis"**
- Do **not** say that this alone proves where the person is. The 0.93 correlation is with the tracker's estimate, not
  with ground truth.

### Beat C (S6.6 callback)

- Reuse Beat A with the same chips.
- Add the price chip only in the authors' exact framing: **"Authors: off-the-shelf hardware for less than US$100"**.
- Do **not** write "well under US$100" (the current storyboard S6.6). That overstates the authors' claim.
- A factual alternative: **"ST evaluation kit · about US$55 at distributors (Oct 2026)"**. This is `search_summary`;
  re-check before use.

### Separate chip for the headline-device result (S6.9)

This chip must stay visually separate from the kit board.

- Chip: **"Reported by the authors: person in ordinary clothes · 30 frames/s capture · smartphone-grade research device"**
- Second line: **"device data not released · no accuracy figure given"**

### Description text (paste-ready)

> Opening and act-6 plots: the authors' released measurements from a low-cost STMicroelectronics VL53L8-series
> evaluation-kit sensor (16 zones), held still and aimed at a wall while a hidden person moved behind a screen. Position
> estimates computed with the authors' published code (github.com/sidsoma/consumer-nlos, MIT License), run and plotted
> by us. The data were processed with the authors' retroreflective-target setting; what the person wore is not
> documented. Capture date and frame rate are not stated in the release; the data were published with Somasundaram et
> al., Nature 653, 693–699 (2026). These data come from the evaluation kit, not from the smartphone-grade device used for
> the paper's main results, whose data were not released.

## 5. Other released-data shots and their chips (not for the opening)

| Shot | Data | Chips |
|---|---|---|
| S3.3 faint echo | `fig1_ams_wall_peak_vs_late_return.json` (R10, iter_22, centre zone) | "Authors' released raw data · a different sensor (3×3 zones) · log scale" · "bump ≈ 3.7 ns after the wall flash, hundreds of times weaker" |
| S6.7 shape | `fig4_ams_U_backprojection.json` (R10) | "Authors' released data & code, run by us · different sensor (3×3 zones) · 36 preset positions · object held still" |

## 6. What the owner could supply later, and how it changes the opening

| Item | How to get it | What changes | Labels it would need |
|---|---|---|---|
| **Licensed copy of Nature Supplementary Video 1** | Download from nature.com in a normal browser, then get Springer Nature permission (RightsLink) **or** written permission from the authors. The article is reported as "under exclusive licence to Springer Nature" (unverified). | The opening could show the **headline result**: a person in ordinary clothes tracked by the smartphone-grade device, with the authors' own overhead footage. It would replace the kit board as the cold open, and the kit data would move to act 6 ("and you can try a version yourself"). | "Authors' video · Nature 2026, Supplementary Video 1 · shown with permission" · "smartphone-grade research device · sensor held still · position estimate, not an image" · "30 frames/s capture (authors)". Never "processed in 1/30 s". |
| Project-page video `diffuse_tracking_st.mov` | Written permission from the authors, covering the person shown. | Lets us show the **actual capture behind our R8 plot**: the real person walking, side by side with the estimate. This is the strongest honest version of the current opening, and it keeps the kit/device distinction. | "Authors' video of the same capture · ST evaluation kit · shown with permission". The material label stays "not documented" unless the authors confirm. |
| Project-page video `diffuse_tracking_final.mov` (probably equals SV1) | Written permission from the authors | Same as SV1 | Same as SV1, plus "authors' project page" |
| Nature PDF + SI (read, not shown) | Owner's browser or library access | Resolves the SV1 device, Fig. 5, final accuracy numbers, verbatim abstract, received/accepted dates and the hyphen in the title. Could upgrade chips from "reported" to "stated in the paper". | Same chips, firmer wording |
| Author answers (email) | Ask: what did the person wear in the ST capture; capture rate and date; ams model; is `diffuse_tracking_final.mov` SV1? | Could allow "person in ordinary clothes" on the kit board, and frame numbers converted to seconds. | "per the authors (personal communication, date)" |
| Our own kit recording (P-NUCLEO-53L8A1 + released code) | Buy the kit (about US$55) and follow the README. Film without showing or naming the channel owner. | Gives first-hand footage we own. It is an own demonstration with the authors' code, **not** an independent replication of their numbers. | "Our own run of the authors' open code · ST evaluation kit · [conditions measured]" |

## 7. Recommended fixes to the existing storyboard and claims ledger

These are suggestions; the files themselves were not edited.

| Location | Fix |
|---|---|
| `storyboard/STORYBOARD.md` S1.3 | "Real measurements · 2026" → "Real sensor data". Add the source and output chips from §4. |
| S6.6 | "kit: well under US$100 (authors)" → "Authors: off-the-shelf hardware for less than US$100". |
| S6.7 | Keep "36 known positions". Do not imply a handheld scan. |
| S6.8 | "known sensor positions": add "(a gantry)" for the paper's reconstructions. Handheld use was localization only (R3). |
| S6.9 | Add "smartphone-grade research device" to the ordinary-clothes chip, so it is not read as describing the kit data. |
| `research/claims.csv` C02 | Its conditions are consistent. Make sure no on-screen text derived from C03 implies a 2026 capture date. |

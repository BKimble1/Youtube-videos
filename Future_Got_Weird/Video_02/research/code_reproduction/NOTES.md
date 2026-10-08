# Code and data reproduction: consumer-nlos (Somasundaram et al., Nature 2026)

Research notes for "How Cameras See Around Corners" (Video 02). Written 2026-10-08.

**Scope.** I inspected and ran the authors' released code and data. Network access to nature.com, arxiv.org and media.mit.edu is blocked in this container, so every paper-side statement below comes from WebSearch summaries and is marked `search_summary`. Everything else was read or run by me (`direct` / `code_or_data`).

**Access legend:**
- **direct**: I read the primary text myself (code, README, git history, firmware).
- **code_or_data**: I inspected or ran the released code or data.
- **search_summary**: WebSearch reported it from the named page; I did not read that page.

**Provenance labels used on every output:**
- **A**: authors' released data, plotted by us.
- **B**: authors' code, run by us on authors' data.
- **C**: authors' stored results (arrays saved inside the released files).

---

## 0. Short answer for the film team

1. **The released code never models flood illumination. Its forward model is confocal.** For each zone *i*, the only geometry is that zone's calibrated wall point `w_i = (x_i, y_i, 0)`. The light is modelled as leaving `w_i`, reaching a hidden point `p`, and coming back to the same `w_i`. Exact formula and line numbers are in §5.
   - The paper also says many experiments wrap the object in retroreflective cloth "to preserve the confocal image formation model" (search_summary, two searches agree).
   - Our inference: a retroreflector sends light back toward where it came from. That makes a flood-lit, per-zone measurement behave approximately confocally.
2. **Both ST datasets are flagged retroreflective (`isDiffuse: False`)**, in `paper/configs/tracking.yaml:8` and `cam_localization.yaml:8`.
   - This flag only selects the intensity-falloff compensation (t² instead of t⁴). It does not record what the target was wearing.
   - A search summary quotes the paper: "we can track a hidden person around the corner without any special retroreflective materials at 30 Hz capture."
   - Whether the released person-tracking capture is that diffuse demo is **unresolved**.
3. **The released ST files do NOT contain the raw wall (1st-bounce) peak.** They were background-subtracted, wall-masked, shifted and zero-padded before release.
   - Only the ams dataset has raw histograms with the strong wall peak and the weak later return.
   - So the "strong first bounce vs faint echo" figure (fig1) is ams data: a different sensor and a different experiment (U reconstruction on a controlled raster).
4. **The authors' `tracking.py` ran unmodified and reproduces the authors' stored particle means closely.**
   - Top-down (x, z) median gap is 8.1 cm. Correlation is 0.97 for x and 0.99 for z over frames 21–475.
   - Seeds 0, 1 and 2 agree with each other to a median of 7.6 mm.
   - Our runtime is a 25 ms median per frame on a 4-thread Xeon at 2.1 GHz. That is **our** CPU time, not the authors' latency.
5. **The released data have no timestamps.** The frame rate of the released captures is **unresolved** (see §8).
6. **The authors' `reconstruction.py` ran unmodified (about 1.1 s) and produces a clear "U" from the ams data.**
   - The sensor positions are a hard-coded 6×6 serpentine raster. That is controlled, known motion, not handheld.

---

## 1. Source, environment, safety

| item | value | access |
|---|---|---|
| Repo | https://github.com/sidsoma/consumer-nlos | direct |
| Commit | `15314de422a765a2d1b72ea7037dfafb2f908d7c`, "Move LICENSE to root directory", 2026-07-23 | direct |
| Licence | MIT (root `LICENSE`) | direct |
| Work copy | `research/code_reproduction/work/consumer-nlos/` (exact copy; `.py` md5s verified identical to the clone) | code_or_data |
| Python / libs | Python 3.13.16, numpy 2.5.3, scipy 1.18.1, matplotlib 3.11.2, opencv 5.0.0 (headless); torch 2.14.1+cu130 from PyPI, used on CPU, installed into a scratch venv | code_or_data |
| CPU | Intel Xeon @ 2.10 GHz, 4 threads | code_or_data |

**Safety measures:**
- The clone was not modified. Stale `__pycache__` directories (cpython-38/311/312 `.pyc` files) were deleted from the **work copy** only.
- The ams `.npy` files are pickled numpy object arrays. Before loading anything I disassembled the pickle opcodes with `pickletools` (no execution).
  - The only globals referenced are `numpy.core.multiarray._reconstruct`, `numpy.ndarray` and `numpy.dtype`.
  - My own scripts load them through an allow-list unpickler (`scripts/safe_load.py`).
  - I let the authors' `reconstruction.py` use `np.load(allow_pickle=True)` only after that check.
- The authors' scripts were run through `scripts/run_authors_script.py` with `python -I`.
  - `sys.path` is set explicitly to `paper/`, and every imported module there was read first.
  - It chdirs into `paper/` because the scripts use relative paths.

**Deviations (all external; no authors' file edited):**
1. numpy and torch RNG seeds were fixed (0, 1, 2). The authors set no seed, and the particle filter is stochastic.
2. Timing wrappers were put around `ParticleModel.evaluate_particles` and `propagate_particles`, `FastSumOfParabolas.__init__`, `load_data` and `compute_lct`.
3. `convert_pngs_to_video`: the authors' `avc1` codec is unavailable in opencv-headless here (the h264_v4l2m2m encoder failed). The wrapper re-wrote the same frames with `mp4v`. This affects the visualization container only.
4. After each run, the script's `states`/`scores`/`vol` variables were dumped to `.npz`.
5. Torch was installed from PyPI (CUDA build, used on CPU). The authors' requirements say `torch` without a version, and suggest conda Python 3.11.

---

## 2. What is in the repository

- **Root** (added 2026-05-20, commit f08d8d1): a live "plug-and-play" demo for the **ST P-NUCLEO-53L8A1** kit (Nucleo-F401RE plus X-NUCLEO-53L8A1 with a "histogram-capable VL53L8 multi-zone SPAD") (README).
  - `config.py`, `sensor.py`, `spad_driver.py` (driver class `VL53L8CHSensor`, vendored from cc-hardware), `calibrate.py`, `track.py`, `particle_filter.py`, `dashboard.py`, `flash.py`.
  - STM32 firmware in `firmware/vl53l8ch/`.
- **`paper/`**: the paper code and data.
  - Entry points: `tracking.py`, `cam_localization.py`, `reconstruction.py`.
  - Supporting code: `data/dataloader.py`, `data/process.py`, `train/{canon,motion,model,optim,score,dataloader}.py`, `utils.py`.
  - Configs: `configs/*.yaml`. Data: `captured_data/`.
- **Git history (direct):**
  - First code and data upload was 2025-10-20 (commit 0d13087: person-tracking data, `main.py`, `config.yaml`).
  - Camera-localization code and data were added 2025-11-26 (88cb6cc). Reconstruction code and ams data were added 2025-12-04 (65d03bf).
  - Everything moved under `paper/` on 2026-05-20. All three dataset trees are byte-identical between their first commit and HEAD (git tree-entry hashes compared for all 475 / 358 / 37 files).
  - These dates are repository dates. They are **not** experiment dates. Capture dates are not recorded anywhere in the files (unresolved).
- **Original README (2025-10-20, commit f49c2f3; direct):** "This output should match the result shown in Fig. 3 of the Supplementary Material and the 'Plug-and-Play NLOS' result shown in the supplementary video."
  - This is pre-publication numbering. It is unverified whether the final Nature supplementary numbering is the same.
  - The sentence was removed on 2025-11-26.
- **README typo:** `paper/README.md` calls the device "ST VL853L8".

---

## 3. Datasets (code_or_data)

| dataset | sensor (from code) | zones | stored bins | bin width | frames | per-file keys | preprocessing state | retro flag | motion |
|---|---|---|---|---|---|---|---|---|---|
| `st_spad_person_tracking` | ST VL53L8 family via `VL53L8CHSensor` | 4×4 = 16 | 128 (zero-padded) | 250 ps (`t_res: 250.0E-12`) | 475 (`volume_000000`–`000474.npz`) | `pt_cloud (16,3)`, `hists (16,128)`, `particles (1000,3)` | already processed: background-subtracted (clipped ≥0), wall masked, shifted so the wall peak is t=0, bins 0–14 zeroed, nonzero data only in bins 15–53 | `isDiffuse: False` (retroreflective falloff) | sensor static (`pt_cloud` identical in all 475 files); hidden person moves |
| `st_spad_cam_localization` | same | 16 | 128 | 250 ps | 358 (`volume_000000`–`000357.npz`) | above + `cam_z ()` | same processing; all values integers | `isDiffuse: False` | **sensor moves**: `pt_cloud` changes per frame (max deviation 0.40 m), `cam_z` 0.433–0.567 m; hidden object assumed fixed at `obj_pos=[0,0,0.6]` |
| `ams_U_reconstruction` | "AMS sensor" (`reconstruction.yaml` comment); model **not named** in the code | 3×3 = 9 | 128 (raw) | 88 ps (`bin_width: 88.0e-12`), `t0: 13` | 37 files `iter_0`–`iter_36`; script uses `iter_1`–`iter_36` | `histogram (3,3,128)`, `point_cloud (9,3)`, `distance (3,3)` mm | **raw**: wall peak at bins 30–33, peak counts about 1.6e5–1.3e6, baseline about 300–570 | n/a (backprojection has no falloff term) | controlled raster: 36 positions hard-coded in `reconstruction.py:69-88`, x 0–1.28 m (25.6 cm pitch), y 0.32–0.96 m (12.8 cm pitch), serpentine; sensor-to-wall about 0.23 m (sensor-reported 219–268 mm) |

### Person-tracking geometry (from data and authors' plot code)

- **Wall points:** the 16 per-zone points lie at z≈0. x ranges from −0.27 to −1.03 m, at the zone-column centres −0.28/−0.46/−0.69/−1.01 m. y ranges from −0.30 to +0.44 m.
- **Sensor position:** `tracking.py:29` has `cam_pos=[0,0,0.82]`, described as "depth of camera from wall pre-calibrated (used only for visualization)". The sensor therefore looks obliquely at a wall patch to its side.
- **Plot elements hard-coded in `utils.convert_particles_to_image`** (these are plot elements, not data):
  - occluder `x=-0.30`, z 0.65–1.6 m (`utils.py:243-246`);
  - four green squares labelled "GT patches" at (x,z) = (−0.80,0.66), (−1.4,0.66), (−0.80,1.25), (−1.4,1.25), y=0.3 (`utils.py:229-232`). Their physical meaning is not documented.
- **Consistency check (inference, code_or_data).** The last nonzero bin per zone was computed from the wall-point distance to (0,0,0.82), with the firmware's CNH bin of 37.5348 mm and `track.py`'s crop logic using `num_bins=48` and `start_bin_track=30`.
  - The predicted value equals the observed last nonzero bin within ±1 bin for all 16 zones.
  - So the released person data fit the current demo's 48-bin window, the 250 ps bin, and a sensor about 0.82 m from the wall.
  - Wall (one-way) distances are 0.86–1.38 m.
- **Weak zones:** zones r1c0 and r2c0 carry about 100× less later-return energy than the others in every frame. Their maximum per-frame sums are 276 and 368 a.u., against a median of 2145 a.u. for the other zones. The reason is unknown; one possibility is that they are partly blocked.

### Stored `particles` arrays (C): what they are

- **Person tracking:**
  - Each file holds 1000×3 float32 particle positions.
  - Frame 0 has only 274 unique particles, so it was already resampled. Later frames have about 620–740 unique.
  - Spread shrinks from std about 0.3 m to about 0.1–0.2 m. This is consistent with saved particle-filter output.
  - Our unmodified `tracking.py` run converges to nearly the same path: top-down median gap 8.1 cm, mean 9.2 cm, p90 12.0 cm; corr x 0.973, z 0.992.
  - The remaining difference is a systematic offset of z(ours − stored) = +6.4 cm.
  - The stored frame-0 mean is (−0.14, 0.09, 0.58) m, which is not near our initialisation box centre. So the stored arrays came from a run with different settings or code (for example the live capture system). **Provenance undocumented.**
- **Camera localization:**
  - The stored particles have z varying (std 0.07–0.18 m).
  - `cam_localization.py` fixes z during filtering and overwrites it with `cam_z` when saving. So the stored arrays were not produced by the released script as configured.
  - Our run correlates with them (x 0.92, y 0.83), but the median xy gap is 27 cm. **Not a close reproduction.**

---

## 4. Sensor facts from code and firmware (direct)

- **Driver** (`spad_driver.py:207-226`): `VL53L8CHSensor(height=4, width=4, ...)`.
  - Defaults: `ranging_frequency_hz=30`, `integration_time_ms=10`, `fovx=fovy=45.0` degrees, `timing_resolution=250e-12`.
  - The host sends `height*width=16` as the resolution, i.e. 4×4 (`VL53LMZ_RESOLUTION_4X4 = 16`).
- **Histogram bin width:** firmware `VL53LMZ_ULD_API/inc/vl53lmz_plugin_cnh.h:24` has `VL53LMZ_CNH_BIN_WIDTH_MM = 37.5348` (one-way range per bin). 2 × 37.5348 mm / c = **250.4 ps**, which matches the 250 ps used in code.
- **Firmware** (`Core/Src/app.c`):
  - Boot defaults are 8×8, 15 Hz, 100 ms integration, 18 CNH bins and subsample 7. These are overridden by the host config.
  - It prints `idx ambient*1000 distance_mm bin*1000 …` per zone (`app.c:116-121`). Histogram values are therefore the CNH bin value × 1000 (arbitrary units).
  - The sharpener is set to 0% (`app.c:260`).
- **Demo `config.py`:**
  - `num_bins=48`, `start_bin_calibrate=1`, `start_bin_track=30`, `ranging_frequency_hz=30`, `subsample=1`.
  - `background_seconds=2.0` (so 60 frames at 30 Hz), `pulse_half_width=7`, `zero_first_k_bins=15`.
  - `num_particles=1000`, `radius=0.07`, `eta=3.0`.
  - Canonical grid ±4 m, 400×400, `num_lct_bins=128`, `num_sub_bins=10`.
- **Paper configs:**
  - `t_res 250 ps`, `num_lct_bins 128`, 1000 particles.
  - Initialisation box centred (−0.75, 0, 1), side 2 m (same in tracking.yaml and cam_localization.yaml).
  - RandomWalk motion with std 0.07 m per axis per frame, residual resampling, `dot_product_score`, `eta 3`.
  - Canonical grid ±3 m at 300×300 (2 cm cells).
- **Visualization fps:** `tracking.py:131` uses `fps=14.0` and `cam_localization.py:139` uses `fps=12.8` for the result video. These are **playback rates of the output video**, not documented capture rates.

---

## 5. Calibration, preprocessing, forward model, geometry

### 5a. Calibration and preprocessing

These are the steps of the live demo. The paper's ST data arrive already processed.

1. **Wall point cloud** (`calibrate.py`):
   - Average about 2 s of frames.
   - The per-zone point cloud comes from the sensor's per-zone distance and the zone ray directions, using a 45° FoV (`spad_driver._compute_point_cloud`).
   - A plane is fitted with SVD and rotated so the wall is z=0 (`fit_plane`, `calibrate.py:13`). This returns `cam_z`, the sensor-to-wall distance.
   - x and y are swapped (`calibrate.py:56-58`).
   - Per zone, `bin_0 = argmax` of the averaged histogram is the wall (1B) peak bin (`calibrate.py:62`).
2. **Empty-room background** (`track.py:16-47`):
   - About 2 s of frames are captured with no hidden object (`n = ranging_frequency_hz * background_seconds`, `track.py:29`).
   - These are averaged into a per-zone background histogram.
   - A mask zeroes everything up to `bin_0 + pulse_half_width` (`track.py:39`).
3. **Per frame** (`track.py:50-77`):
   - `max(hist − background, 0)` (`:64`), then multiply by the 1B mask (`:65`).
   - Shift each zone so its wall peak is bin 0 (`:67-74`), pad to 128 bins, and zero the first 15 bins (`:76`).
   - The released ST `hists` match this format exactly: 16×128, bins 0–14 zero, non-negative.
4. **ams reconstruction** (`reconstruction.py`):
   - No background subtraction.
   - Per zone, crop from the argmax (wall peak) so it becomes index 0 (`:59-61`). Keep only gates 30–89 bins after it (`:63-64`).
   - The wall point is recomputed as ray direction × c·(argmax − t0)·88 ps / 2 (`:33-35`).

### 5b. Light-cone transform (`paper/data/process.py`)

- Native time t (after the 1B shift) gets falloff compensation: multiply by `linspace(0,1,T)**2` when retroreflective, or `**4` when diffuse (`process.py:59-63`).
- It is then resampled to v = t² with the O'Toole et al. resampling operator (`process.py:76-107`; comment "adapted from O'Toole et al.").
- The root demo `particle_filter.py:195` applies the resampling **without** the falloff weighting. This is a code difference between the demo and the paper.

### 5c. Canonical measurement and voxelization (`paper/train/canon.py`)

- The canonical object is a single point at the origin (`canons/point.npy = [[0,0,0]]`).
- `v_range = (c · num_lct_bins · t_res / 2)²` (`canon.py:46`). With c = 3e8, 128 bins and 250 ps this is (4.8 m)² = 23.04 m².
- For every wall grid cell (x_w, y_w) on a 300×300 grid over ±3 m:
  - `v = (x_w − p_x)² + (y_w − p_y)² + p_z²` (`canon.py:83-84`);
  - the index is `floor(v / (v_range/1280))`, using 10 sub-bins per LCT bin (`canon.py:85`);
  - it is splatted with a Gaussian of σ = 0.5 LCT bin over ±3 bins (`canon.py:103-106`).
- The result is a dense volume of 300 × 300 × 3840 float32 values, about 1.4 GB in RAM. This step took **6.6 s on our CPU** (2.4 s in one run).

### 5d. Rendering a particle (`canon.py:111-196`, `model.py:113`)

- Each particle p = (p_x, p_y, p_z) has z converted to signed v = sign(z)·z² (`model.py:113`).
- Each zone samples the canonical at x = x_i − p_x and y = y_i − p_y (`canon.py:141-142`, object-tracking branch), and at v_bin − p_z² (`canon.py:182-183`).
- **Exact path-length relation the code uses** (canonical point at the origin):

  ```
  v_bin = (x_i − p_x)² + (y_i − p_y)² + p_z²  =  |w_i − p|²     with  v_bin = (c·t/2)²
  ⇒  c·t = 2·|w_i − p|      (t measured from the zone's own wall return, bin 0)
  ```

  Here w_i = (x_i, y_i, 0) is zone i's calibrated wall point (`pt_cloud`). The extra round-trip path in the measurement equals **twice** the distance from that same wall point to the hidden point.
- **That is the confocal geometry.** Illumination and detection are at the same wall point. There is no term for a separate illuminated spot, and no sum over a flood-illuminated area. The backprojection uses the same relation (`utils.py:463-466`: `|voxel − w_i|` compared with `j·Δt·c/2`, tolerance `Δt·c`).

### 5e. Scoring, resampling, propagation

1. **Scoring** (`model.py:115-129` with `score.py` `dot_product_score`):
   - Normalize the rendering r, project it onto the measurement y: ŷ = (r̂·y) r̂.
   - Score = y·ŷ = (r̂·y)².
   - Subtract the minimum score (`model.py:142`) and zero particles with z < 0 (`model.py:148`).
2. **Resampling:** raise scores to the power **η = 3** (`optim.py:31`) and do residual resampling.
3. **Propagation:** a random walk of N(0, 0.07 m) per axis (`motion.py:305`), with z clipped at ≥ 0 (`motion.py:151`).
4. **Saved estimate:** the particle states after resampling.
   - We summarise each frame as the mean of its particles. That is our choice; the root dashboard also shows a "mean dot".

### 5f. Geometry interpretation (inference / search_summary)

- The VL53L8 is a multizone sensor. Search summaries of ST pages describe a 940 nm VCSEL with diffractive optics giving a 45°×45° square FoV (search_summary, low–medium).
- In other words, it illuminates the whole FoV and resolves 4×4 zones in detection: flood, non-confocal hardware.
- The code nevertheless assumes confocal paths. The paper reportedly:
  1. derives the MAS model assuming retroreflective reflectance;
  2. covers many hidden objects in retroreflective cloth "to preserve the confocal image formation model";
  3. finds diffuse objects work empirically but worse, "due to r^4 falloff and light contributions from non-confocal paths" (search_summary, arXiv 2605.17865; consistent across two searches).
- The proprietary smartphone-grade LiDAR is described as about 100 pixels, "each SPAD pixel shares an optical axis with exactly one laser spot" (search_summary, one search, medium–low).

---

## 6. Runs (B = authors' code run by us on authors' data)

| script | data | result | OUR runtime on this CPU |
|---|---|---|---|
| `paper/tracking.py` (seeds 0, 1, 2) | person tracking, 475 frames | completed; `particles.pth` written; authors' plot video re-encoded mp4v at the authors' 14.0 fps | per-frame PF update (render, score, resample, propagate): **median 25.3 ms, mean 27.9 ms, p95 40.6 ms** (seed 0); seed 2 median 24.8 ms; seed 1 median 27.1 ms with p95 162 ms (probably other load on the machine). Voxelization 2.4–6.8 s once. LCT 0.27 ms per frame. Whole script about 65–75 s, mostly plotting. |
| `paper/reconstruction.py` | ams U, 36 positions | completed; a clear U-shape in the front view (x ≈ 0.38–0.85 m, y ≈ 0.42–0.82 m), focused near z ≈ −0.31 m in the sensor-centred frame | about 1.1 s total |
| `paper/cam_localization.py` | cam-loc, 358 frames | completed; correlated with stored particles but offset (median 27 cm) | median 24.8 ms per frame |

**These are our runtimes. They are not the authors' latency.** "30 Hz" (search summary and project page) is a **capture** rate. It is not an algorithm latency, and it is not necessarily the rate of the released files.

**Observations from the data alone** (A; descriptive, ours):
- Person-tracking later-return energy rises and falls in about 4 cycles over 475 frames (fig2).
- The energy-weighted mean delay ranges from 173 to 260 cm of extra round-trip path.
- Energy and delay are anticorrelated (r = −0.93): closer means brighter.
- The mean delay correlates with the tracker's z estimate at r = 0.93. The raw echo timing alone already shows the person moving toward and away from the wall.

**ams frame `iter_22`, centre zone** (A):
- Wall peak 1,278,132 counts at the argmax bin.
- Later-return bump at 3.70 ns after it (110.8 cm extra round-trip path).
- Excess about 2,220 counts over the local floor, i.e. the wall peak is about **576×** stronger in that zone. Across zones the ratio is 256–576× (our simple measure).
- A small bump about 1.5 ns before the wall peak, near bin `t0=13`, is probably the sensor's internal zero/crosstalk reference. This is an inference.

---

## 7. Output files (`research/code_reproduction/out/`)

| file | label | content |
|---|---|---|
| `fig1_ams_wall_peak_vs_late_return.png/.json` | **A** | ams `iter_22`, 9 zones, raw counts on a log axis vs ns after the wall peak and extra round-trip path (cm). The JSON has per-zone counts, wall-peak bin/counts, our late-return bin, time, path, excess and ratio, and the gate. **Not the ST device; controlled-raster experiment.** |
| `fig1b_st_processed_frame_histograms.png/.json` | **A** | person-tracking `volume_000100.npz`, 16 zones as released (wall already removed); ns and cm axes |
| `fig2_st_later_return_energy_over_frames.png/.json` | **A** | per-frame total energy, energy-weighted mean delay (ns and cm), per-zone energy (475×16). The x axis is frame index; no timestamps. |
| `fig3_tracking_trajectory_topdown.png/.json` | **B** (ours, seeds 0–2) + **C** (stored means) | top-down x,z per frame with per-frame std; the authors' scene-layout constants are labelled as plot elements; comparison metrics |
| `fig3b_particle_clouds.png/.json` | **B** + **C** | full 1000-particle clouds (ours seed 0 and stored) for frames 1, 5, 20, 100, 250, 475 |
| `fig4_ams_U_backprojection.png/.json` | **B** | normalized max projections (front x-y 40×40, top x-z 40×20), the 36 hard-coded sensor positions, centre-zone wall distance per position |
| `fig5_st_camera_localization.png/.json` | **B** + **C** + A (`cam_z`) | estimated sensor xy (ours vs stored), `cam_z` per frame. Weak reproduction; use with care. |
| `tracking_run_seed{0,1,2}/` | **B** | `authors_code_states.npz` (475×1000×3 particles plus scores), `timing_tracking.json` (per-frame seconds), stdout; seed0 has the authors' own plot function rendered to `authors_plot_function_video_mp4v.mp4` |
| `reconstruction_run/` | **B** | `authors_backprojection_plot.png` (the authors' own plot), `authors_code_volume.npz`, timing |
| `cam_localization_run/` | **B** | states, timing, the authors' plot video (mp4v) |

Scripts are in `research/code_reproduction/scripts/`: `run_authors_script.py`, `safe_load.py`, `make_figures.py`, `make_recon_figure.py`, `make_camloc_figure.py`.

**Unit conversions in our figures** use c = 299,792,458 m/s. The authors' code uses c = 3e8. The difference is 0.07%.

---

## 8. Frame rate and timestamps: unresolved

- No released file has timestamps.
- Candidate values:
  - demo `config.py` `ranging_frequency_hz=30` (2026 demo default) and driver default 30 Hz;
  - firmware boot default 15 Hz;
  - result-video playback fps 14.0 (tracking) and 12.8 (cam-loc).
- Search summaries report "30 Hz capture" for the diffuse person-tracking demo, and "real-time (30 Hz)" tracking on the project page (search_summary).
- A distributor summary lists "16 zones with 48 bins at 25 Hz" for the VL53L8CH (search_summary, low).
- **Do not convert frame index to seconds in the film** unless the paper's Methods confirm the rate for this specific capture.

---

## 9. Web cross-checks (search_summary; nature.com, arxiv.org and media.mit.edu not directly readable here)

- **Paper and dates:**
  - Nature 653, 693–699 (2026), published 20 May 2026. The arXiv 2605.17865 manuscript was submitted 18 May 2026.
  - Demonstrations: 3D reconstruction, single- and multi-object tracking, camera localization; "less than US$100" hardware.
- **Retroreflection and confocality:** retroreflective cloth on many experiments "to preserve the confocal image formation model". The MAS model assumes retroreflective reflectance. Diffuse targets work, but worse (r⁴ falloff, non-confocal paths). Two searches agree.
- **Diffuse person demo:** "Real-time diffuse tracking: we can track a hidden person around the corner without any special retroreflective materials at 30 Hz capture." Two searches returned it, but the second query contained the phrase, and it is unclear whether it is from the Nature SI or arXiv.
  - Hand tracking reportedly used retroreflective gloves (one search).
- **Project page (cornar.media.mit.edu):** "Tracking hidden objects in real-time (30 Hz)"; "Order the ST sensor (~$50)".
- **Unverified third-party claim:** a blog reports "4.7 cm average error ... on a mechanical gantry". Do not use.
- **Tool caveat:** one search summary asserted that "VL53L8CH" was probably a typo for "VL53L8CX". It is not: ST sells a VL53L8CH (histogram-capable "CH" variant), per the ST product pages returned in a later search. That summary was the tool's inference.

---

## 10. Guardrails for the script, from this work

- **ST evaluation kit:** VL53L8 family, 4×4 zones, 250 ps bins. This is what the released tracking and cam-loc data and the open demo use.
- **ams sensor:** 3×3 zones, 88 ps bins, U reconstruction on a hard-coded raster (controlled motion).
- **Proprietary smartphone-grade device** (about 100 pixels): **no released data or code for it** in this repo.
- Keep these three separate in the film.
- **Tracking vs reconstruction:** tracking = a particle filter with a single-point canonical (position only). Reconstruction = backprojection of a static object from many known sensor positions.
- **Capture rate vs runtime:** 30 Hz is a capture rate (search_summary). Our 25 ms per frame is our CPU's runtime for the filter update. Neither is the authors' end-to-end latency.
- **Code availability is not independent replication.** We re-ran the authors' code on the authors' data. That shows the released pipeline is internally consistent. It does not validate the physical experiment.

## 11. Unresolved

1. The exact ams sensor model. The code says only "AMS sensor"; related work by others uses ams TMF8828, which is not established for this dataset.
2. The frame rate and capture dates of all three released datasets.
3. Whether the released person-tracking capture used retroreflective clothing or is the "diffuse" demo. The code flag is retroreflective falloff.
4. Which final Nature figure or SI item each dataset corresponds to. The 2025-10 README said "Fig. 3 of the Supplementary Material" plus the "Plug-and-Play NLOS" video, in manuscript-era numbering.
5. The provenance of the stored `particles` arrays (what code and settings produced them).
6. The physical meaning of the "GT patches" and occluder plot constants. They are labelled GT in code, but no ground-truth positions per frame are released, so tracking accuracy **cannot** be computed from the released data.
7. Whether the cam-localization sensor motion was handheld.

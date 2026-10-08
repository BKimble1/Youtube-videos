# Geometry and physics for the explanatory animation (Video 02)

Private research note for "How Cameras See Around Corners". It gives the one room geometry every diagram draws from, the
timing maths behind the circles, ellipses and bands, and what the real sensors measure compared with the simplified
picture. Prepared 8 October 2026.

**Files in this folder**

| File | What it is |
|---|---|
| `geometry_check.py` | Declares the 2D room, computes every number below, and runs **71 checks**. All pass. Run it with `python3 geometry_check.py`; it needs numpy, and matplotlib only for the preview. |
| `layout.json` | Output of the script. This is the single source of geometry for the film: room, wall, partition, sensor, person, wall points, arcs, bands, regions, flood spreads, radiometry, unit conversions, per-segment clearances and the check list. |
| `geometry_preview.png` | Diagnostic preview only, not a film asset. Panels: frame A paths; frame A bands; zoom on the region with 1–4 wall points; sensor moved (B1); person moved (B2); zoom comparing them. |

**Access legend** (how each fact was obtained)

- `direct`: I read the primary text myself (repo README and code comments).
- `code_or_data`: I inspected or ran the authors' released code or data (repo `sidsoma/consumer-nlos`, commit `15314de`, cloned at `/home/user/ext_sources/consumer-nlos`), or computed it with my own script.
- `search_summary`: reported by the web-search tool from the named page. I did not open the page itself.
- nature.com, arxiv.org and the project site are blocked in this container.
- **The web-search budget for this turn ran out after 6 searches.** Some cross-checks below therefore rest on one search, or on earlier research notes in `research/manuscript/NOTES.md`, `research/final_paper/NOTES.md` and `research/code_reproduction/NOTES.md`. Each case is flagged.

**Status of everything numeric in this note.**

- All room numbers are **illustrative**. They form a physically sensible layout built from the authors' demo guidance. **They do not reconstruct any experiment in the paper.**
- Sensor constants (bin width, field of view, zone count, window length, motion-prior step) come from the released code and are cited.
- Nothing here combines numbers from different experiments.

---

## 1. The declared room (plan view, metres)

Coordinates follow DIRECTION.md §2: `x` runs right along the relay wall, `z` is the distance from the wall toward the
viewer (the wall is z = 0), and `h` is height.

| Element | Value | Why |
|---|---|---|
| Room | x 0–4 m, z 0–3 m, wall height 2.5 m | "A room ~4 m × 3 m, wall on one side" |
| Relay wall | z = 0, x 0–4 m; matte and light-coloured | The README says "A matte, light-colored relay wall is ideal" (`direct`). |
| Partition (occluder) | Free-standing folding screen at **x = 2.00, from z = 0.65 to 2.15** (1.5 m long). Thickness 0.04 m, height **2.0 m**. Leaves a **0.65 m gap** at the wall. | Blocks S→H. Light passes through the gap. |
| Sensor, frame A | **S_A = (1.65, 0.90)**, h = **0.95 m** (on its tripod stand). Optical axis hits the wall at x = 1.85 (12.5° off the wall normal). | README: "SPAD ↔ relay wall: < 1 m" (`direct`) |
| Sensor, frame B1 (moved) | **S_B = (1.25, 0.90)**, aim x = 1.45 | Used for motion-induced sampling (§8) |
| Hidden person, frame A | **H_A = (2.60, 0.85)**, light-plane point at his chest, h 0.95 m (body radius 0.22 m, head top 1.75 m) | README: "Relay wall ↔ hidden object: ~1–1.5 m" (`direct`) |
| Hidden person, frame B2 | **H_B = (2.70, 0.90)**, 0.10 s later (1.12 m/s walk) | Used for object motion (§8) |
| Sensor model | One row of a 4 × 4-zone, 45° flood sensor (VL53L8-like). The 4 zone-centre wall hits are the sampled wall points. | `spad_driver.py` defaults `height=4, width=4, fovx=fovy=45.0`; `sensor.py` builds 4×4 (`code_or_data`) |

**Heights changed for drawing legibility (path-legibility pass).** The partition was raised from 1.7 to 2.0 m and the light-path plane (sensor, wall points, the point on the hider) lowered from 1.2 to 0.95 m, so the drawn room reads "around the end" and the screen is visibly taller than both people. 0.95 m is the chest of the drawn, chibi-proportioned figures, lower than a real 1.7 m adult's chest. The plan geometry (every x and z), every distance, delay, arc and band, and every claim are unchanged; the plan is a horizontal slice at ~0.95 m.

**Sampled wall points** (zone centres; all have z = 0):

- Frame A: x = 1.582, 1.759, 1.945, 2.157. Lit patch x = 1.492–2.281 (0.79 m). Zone edges at 1.492 / 1.670 / 1.850 / 2.047 / 2.281.
- Frame B1: x = 1.182, 1.359, 1.545, 1.757. Lit patch 1.092–1.881.

**Checks the script enforces** (all pass):

- The partition blocks the straight lines S_A→H_A, S_A→H_B, S_B→H_A and S_B→H_B.
- No point on the hider's 0.22 m body outline is visible from either sensor position.
- From S_A, the only hidden-side points visible through the gap at x = 2.6 are those within z < 0.22 m of the wall. The person's nearest edge is at z = 0.63.
- 3D check: the sight line from the sensor (h = 0.95) to the top of the hider's head (1.75 m) meets the partition at a height of 1.22–1.39 m, below its 2.0 m top. Nothing pokes over.
- Every drawn segment misses the partition by **at least 0.10 m** (smallest: 0.117 m, W_B1→H_A). This covers S→W, W→H for both H positions, and the field-of-view edge rays. Every clearance is listed in `layout.json` → `segments`.
- |SW| ≤ 1.1 m for every sampled point: 0.90–1.03 m.
- |WH| is in 0.9–1.5 m for frame A: 0.96–1.33 m.

**Ties to the authors' released data** (`code_or_data`, my inspection of `paper/captured_data/st_spad_person_tracking`):

- The 16 calibrated wall points span **0.76 m × 0.74 m**. Neighbouring zones are 0.18–0.35 m apart, increasing toward one side, which means oblique aiming.
- Our frame-A patch is 0.79 m wide with 0.18–0.21 m zone spacing, so it is the same scale.
- The released ST histograms have signal only in **bins 15–53 after the wall peak**. Summed over zones, the per-frame peak bin has median 28 (range 16–44). Under the code's confocal relation that is a one-way |WH| ≈ 1.05 m (0.60–1.65 m).
- Our layout's third-bounce delays are 25.6–35.4 bins (frame A) and 31.9–44.1 bins (frame B1), all inside 15–53.
- `paper/tracking.py:29` sets `cam_pos = [0, 0, 0.82]`, "depth of camera from wall pre-calibrated (used only for visualization)". Our 0.90 m sensor distance is comparable.
- In that capture the wall points are identical in all 475 frames, so **the sensor was fixed**.
- Labels: the hidden person, partition position and gap are our own design. The authors' plot code draws an occluder at x = −0.30, z 0.65–1.6 m (`utils.py:243-246`, per `code_reproduction/NOTES.md`). That is a plot element, not a measured layout.

---

## 2. Unit conversions (computed; c = 299,792,458 m/s)

| Quantity | Value |
|---|---|
| Speed of light | **29.98 cm/ns** |
| 1 ns of travel time | 29.98 cm of path. In a confocal round trip that is **14.99 cm of one-way distance**, because the light goes out and back. |
| One 250 ps bin | **7.49 cm of path**, i.e. **3.75 cm of one-way distance** |
| Firmware bin | `VL53LMZ_CNH_BIN_WIDTH_MM = 37.5348` (one-way), i.e. **250.4 ps**. Source: `firmware/vl53l8ch/VL53LMZ_ULD_API/inc/vl53lmz_plugin_cnh.h:24` (`code_or_data`). It matches `t_res: 250.0E-12` in `paper/configs/*.yaml`. |
| Pulse width in the firmware | `VL53LMZ_CNH_PULSE_WIDTH_BIN = 10`, so about **10 bins = 2.5 ns ≈ 75 cm of path** (same header, line 21; `code_or_data`). The demo masks the wall peak with `pulse_half_width = 7` bins (`config.py`). |
| Demo window | 48 bins × 250 ps = **12 ns = 3.60 m of round-trip path (1.80 m one-way)**. The README rounds this to "around 4 m" (`direct`). The demo tracks with `start_bin_track = 30`, which shifts the window later, so the wall return plus a 1–1.5 m echo fit inside it. `code_reproduction/NOTES.md` checked this against the released data, to within ±1 bin per zone. |
| Model padding | The code pads to 128 bins (32 ns, 9.59 m of path) for the light-cone transform. |
| ams sensor (different device) | 88 ps bins: **2.64 cm of path, 1.32 cm one-way**. 128 bins = 11.26 ns. Source: `paper/configs/reconstruction.yaml` (`code_or_data`). |
| Capture rate vs algorithm latency | Demo **capture** is requested at 30 Hz, a 33.3 ms frame period (`config.py`). This is not the algorithm latency. `code_reproduction/NOTES.md` measured the authors' particle-filter update at a median ~25 ms per frame on that container's CPU. That is a different quantity, from a different machine. |

---

## 3. (a) Confocal picture: circles (2D) and spheres (3D)

**Set-up.** The emitter and detector are together at S and look at one wall point W. The hidden point is H.

- Path S→W→H→W→S: **L = 2|SW| + 2|WH|**, arrival time **t = L/c**.
- The wall (first-bounce) return arrives at t₁ = 2|SW|/c. It is strong and early.
- Given t and a known |SW|, every point at distance **r = (c·t − 2|SW|)/2 = |WH|** from W fits. That is a **circle centred on W** in 2D and a **sphere** in 3D. Only the half in front of the wall is physical.
- A 1 ns later arrival means a 15 cm larger circle.

**What the authors' code does** (`code_or_data`):

- `paper/train/canon.py:83-84` builds the forward model as `v = (x_w − p_x)² + (y_w − p_y)² + p_z²` for each wall sample (x_w, y_w, 0), with v = (c·t/2)². So **c·t = 2|w − p|**: exactly the confocal sphere.
- t is measured from that zone's own wall peak. `track.py: preprocess_hist` shifts each zone so its wall peak is bin 0. The dataloader docstring says "t=0 corresponds to when the light bounces from the wall to the hidden scene".
- The canonical object is one point at the origin (`canons/point.npy` = `[[0,0,0]]`).
- The squared-time resampling is "adapted from O'Toole et al." (`paper/data/process.py:76-79`).
- `code_reproduction/NOTES.md` §5d reached the same conclusion independently.

**Frame A numbers** (S_A, H_A; `layout.json` → `confocal.frame_A_H_A`; illustrative):

| Wall point x (m) | \|SW\| (m) | \|WH\| = circle radius (m) | Path L (m) | Arrival t (ns) | Wall return (ns) | Delay after wall return (ns) | Same, in 250 ps bins |
|---|---|---|---|---|---|---|---|
| 1.582 | 0.903 | 1.327 | 4.458 | 14.87 | 6.02 | 8.85 | 35.4 |
| 1.759 | 0.907 | 1.196 | 4.205 | 14.03 | 6.05 | 7.98 | 31.9 |
| 1.945 | 0.947 | 1.073 | 4.040 | 13.48 | 6.32 | 7.16 | 28.6 |
| 2.157 | 1.033 | 0.958 | 3.983 | 13.29 | 6.89 | 6.39 | 25.6 |

- Every circle's in-room arc runs from 0.25° to 180°, so the whole front semicircle fits in the room.
- Frame-B1 and H_B tables are in the JSON.

**Mirror ambiguity.** Circles centred on the wall line also cross at H's mirror image behind the wall, at (2.60, −0.85). The wall rules that point out. In 3D, wall points on a plane give the same front/back mirror.

**Single wall point.** One timing gives a whole circle (a hemisphere in 3D). The earlier manuscript notes report a related statement from the authors' supplement (manuscript numbering, supplementary Fig. 6): with a point-like aperture and a point object, position "cannot be well-constrained even if information is aggregated across multiple frames". This is `search_summary`, from `research/manuscript/NOTES.md`; I could not re-check it this turn.

---

## 4. (b) Non-confocal picture: ellipses (2D) and ellipsoids (3D)

**Set-up.** Light is sent to wall point W1 and collected from a different wall point W2.

- **L = |SW1| + |W1H| + |HW2| + |W2S|.**
- Once |SW1| and |W2S| are known, **|W1H| + |HW2| = c·t − |SW1| − |W2S|**. The points H that satisfy this form an **ellipse with foci W1 and W2** (an ellipsoid of revolution in 3D). Its semi-major axis is a = (sum)/2 along the wall, and b = √(a² − (|W1W2|/2)²).
- When W1 = W2 it collapses to the confocal circle.

**Example** (W1 = 1.582, W2 = 2.157, H_A; `layout.json` → `non_confocal_example`):

| Quantity | Value |
|---|---|
| L | 4.221 m |
| t | 14.08 ns |
| Focal sum | 2.285 m |
| Centre | (1.869, 0) |
| a | 1.143 m |
| b | 1.106 m |
| Eccentricity | 0.25 |
| H on ellipse | checked: 1.000000 |

With the foci only 0.58 m apart, the ellipse is nearly a circle. On screen, "ellipse instead of circle" is a modest change of shape at this scale.

**History context.**

- Velten et al. 2012 used a streak camera that imaged many wall points for each laser position. A review summary states "When the path length of a photon is known, the location of the hidden object is constrained to the ellipsoid" (arXiv 1910.05613, `search_summary`).
- The same search gives these Velten et al. details: Nature Communications 3:745 (2012); 2 ps streak-pixel time interval, but 15 ps effective resolution; mannequin about 20 cm tall, about 25 cm from the wall; 40 cm × 40 cm × 40 cm hidden volume. These come from **one search only** (medium confidence). History is covered in `research/history/NOTES.md`.

---

## 5. (c) Flood-illuminated multizone sensor (VL53L8): what one zone's histogram adds up

### 5.1 Hardware (search_summary, ST datasheets; two searches agree on the core points)

- A diffractive optical element over the 940 nm VCSEL projects a **square field** onto the scene.
- A receiver lens focuses the return onto a SPAD array, and the **zones are defined on the receive side**: 4×4 or 8×8. Field of view is 45° × 45° (65° diagonal).
- The VL53L8CH datasheet gives the emitted power versus angle: about 43.4° square at 75% of maximum and 57.9° square at 10%. So the whole field is lit, but not evenly.
- No retrieved ST text says "flood", "flash" or "non-scanning". "The whole field is lit at once and nothing scans" is an **inference** from the fixed diffractive optics. It is consistent with the code, which has no scanning anywhere.

### 5.2 What a zone integrates (derivation)

In one frame, every lit wall point W1 sends light toward the hidden person. For zone k, the third-bounce part of its histogram is a sum over:

- every lit wall point W1 in the whole field;
- every point on the hidden surface;
- every wall point W2 inside zone k's own patch;

weighted by each bounce's spreading (cosines and 1/r² factors), and smeared by the pulse (about 10 bins) and the bin width. The path lengths that contribute are |SW1| + |W1H| + |HW2| + |W2S|. One zone's echo is therefore a **union of many ellipses**: a blurred, thick shell, not one sharp circle.

### 5.3 How much blur, in this room (`flood_illumination_zone_spreads_frame_A`; point target at H_A; 2D slice; illustrative)

Delays are measured from each zone's own wall return.

| Zone (patch x, m) | Confocal model, 2\|SWc\|+2\|WcH\| − wall path (m) | Diffuse target: median − model (m) | Diffuse: earliest − model (m) | Diffuse: 10–90% spread (m of path / bins) | Ideal retroreflector: median − model (m) | Retroreflector: 10–90% spread (m) |
|---|---|---|---|---|---|---|
| 0 (1.49–1.67) | 2.650 | **−0.183** | −0.307 | 0.260 / 3.5 | −0.014 | 0.238 |
| 1 (1.67–1.85) | 2.389 | −0.061 | −0.158 | 0.245 / 3.3 | −0.005 | 0.169 |
| 2 (1.85–2.05) | 2.145 | +0.015 | −0.051 | 0.231 / 3.1 | +0.001 | 0.094 |
| 3 (2.05–2.28) | 1.920 | +0.043 | −0.001 | 0.221 / 3.0 | +0.004 | 0.020 |

How to read the table (inference from this computation):

1. **Ideal retroreflector.** It sends light back along its incoming direction, so only W2 ≈ W1 paths exist, and a zone sees only light that left from its own patch. Its echo is centred on the confocal model **within 1.4 cm of path in every zone**. The remaining spread comes only from the zone patch's own width.
2. **Diffuse target.** Light that left from lit points nearer H can come back into a far zone, so that zone's echo arrives **earlier** than the model predicts (−18 cm of path in zone 0). The echo is also smeared over about 3 bins. Both effects depend on the zone.
3. **The authors give the same reason for their assumption.** For the ~100-pixel device: "Because all pixels and laser spots are active simultaneously, we assume that the hidden object of interest has strong retroreflective properties in order to retain the image formation model of confocal scanning setups". They add that the model "can handle diffuse objects" empirically, but results are "inherently worse … due to the weaker signal (due to r⁴ falloff) and light contributions from non-confo[cal paths]" (arXiv v1 manuscript, `search_summary`; agrees with `research/manuscript/NOTES.md`).
4. **The code follows suit.** `paper/configs/tracking.yaml` sets `isDiffuse: False`, commented "set to False for retroreflective objects", so the released person sample is processed with the retroreflective t² weighting (`code_or_data`). Whether the person in that capture wore retroreflective material is unresolved (see `final_paper/NOTES.md`).
5. **Not modelled here.** A person is not a point; the torso adds roughly ±15 cm of depth spread. The 10-bin pulse (2.5 ns, ~75 cm of path) is wider than either geometric spread above, so the raw echo bump is broad whatever the geometry.

### 5.4 Which simplified picture is honest for the VL53L8

- **Recommended.**
  - Draw the emitter as a **pale fan lighting the whole wall patch** at once, and split the patch into **4 zone strips** (label: "one row of 16 zones").
  - Put a dot at each strip's centre and draw **one circle per zone centre**, labelled **"simplified picture (2D)"**.
  - Narration or chip: the authors' model treats each zone **as if it sent and listened at its patch centre**. That fits best when the target bounces light straight back (retroreflective). Ordinary clothes blur and shift the echo.
  - Optional "what really happens" beat for one zone: 4–6 faint paths from different lit points to H and back into that strip, then a wider bump in that zone's histogram.
- **Do not draw** the VL53L8 as a scanning dot or as one pencil beam per zone. The emitter is not per-zone.
- **Do not imply** the circles are measured directly. They come from a timing plus a model.
- **The proprietary ~100-pixel device is closer to the circle picture.** Each SPAD pixel "shares an optical axis with exactly one laser spot" (`search_summary`, manuscript). That is a quasi-confocal geometry, but with all spots firing at once. For diffuse targets, light from other spots leaks into each pixel; that is the authors' "non-confocal paths".

---

## 6. Intensity falloff: why the hidden echo is faint (ESTIMATE)

**Rule of thumb (standard radiometry).** A diffusely (Lambertian) reflecting surface spreads its light over a hemisphere. A facing area A at distance d receives about **A/(π·d²)** of it. Each diffuse bounce costs one such factor, and the factor itself falls as 1/d².

**Estimate for one zone of a flood sensor** (README geometry: |SW| = 0.9 m, |WH| = 1.2 m; `layout.json` → `radiometry`). Assumptions: wall albedo 0.8; clothing albedo 0.5 at 940 nm; torso 0.4 × 0.6 m facing the wall; all cosines = 1 (best case).

| Factor | Value |
|---|---|
| Lit-patch light that reaches the torso | 0.24/(π·1.44) ≈ **5.3%** |
| Torso light that lands on one zone's wall patch (0.035 m²) | ≈ **0.77%** |
| Third bounce / first bounce, flood zone (the torso is lit by the whole 0.56 m² patch; the zone's first bounce comes only from its own patch) | 0.5 × 0.8 × 0.053 × 0.0077 × 16 ≈ **2.6 × 10⁻³, about 1/380** |
| Third bounce / first bounce, single co-located spot, own path only | ≈ **1.6 × 10⁻⁴, about 1/6,000** |

What this means and how to label it:

- **Label: estimate, best case.** Real cosines, clothing and torso orientation make it weaker. Say "hundreds to thousands of times weaker" (orders of magnitude), not a single precise number.
- **Distance scaling.**
  - A diffuse third bounce scales as **1/|WH|⁴**. Moving the person from 1.0 m to 1.5 m from the wall costs about 5×.
  - An ideal retroreflector scales as **1/|WH|²** (about 2.3× for the same move).
  - The code compensates the same way: diffuse ×t⁴, retroreflective ×t² (`paper/data/process.py:59-63`, `code_or_data`).
  - Literature support (search_summary, one search each): Heide et al. (arXiv 1711.07134) say retroreflectors raise the hidden return "by two orders of magnitude, such that the 1/r⁴ distance falloff becomes 1/r²". The Keyhole Imaging appendix (arXiv 1912.06727) gives Lambertian ∝ z⁴cos⁻⁴θ and retroreflective ∝ z²cos⁻²θ. O'Toole et al. 2018's abstract says confocal scanning gives "a sizeable increase in signal and range when imaging retroreflective objects".
- **Measured scale, different device and experiment; do not merge.**
  - `code_reproduction/NOTES.md` measured the wall peak in the authors' raw **ams** data (3×3 zones, 88 ps, "U" reconstruction on a hard-coded raster, sensor ~0.23 m from the wall) at **256–576×** the later echo's excess over the floor, as a peak-height ratio.
  - That is a different sensor, geometry and target. Use it only as "the same order of magnitude". I did not re-run it.
- **Released ST files cannot show the ratio.** The wall peak was removed before release (bins 0–14 zeroed), so the ST person data cannot show the first-bounce/third-bounce ratio.

**For the film:** draw later segments thinner and paler, and show a tall first-bounce spike with a small late bump. Use a broken or log axis, labelled "not to scale" or "illustrative". On a linear axis at true scale, the bump would be invisible.

---

## 7. Why several wall points narrow the answer, and why noise makes bands

1. Each wall point's timing gives one circle centred on that point. All the circles pass through H; elsewhere, they separate. Adding wall points removes candidates. (In 2D, two circles centred on the wall line already cross in only two points, H and its impossible mirror behind the wall.)
2. **Noise turns each circle into a band.** Sources:
   - bin quantisation (±1 bin = ±3.75 cm one-way);
   - pulse width (about 10 bins);
   - photon (Poisson) noise on a faint echo;
   - timing jitter;
   - uncertainty in |SW| from wall calibration;
   - for diffuse targets, the flood blur in §5.

   The film's default band is **±3.75 cm (one bin), labelled illustrative**. It is a best-case quantisation picture, not a measured precision for any device.
3. **Bands cross in a region, not a point** (1 cm grid; `layout.json` → `regions`; frame A, adding adjacent zone points; ±3.75 cm):

| Wall points used | Spread of sampled wall (m) | Candidate region length × width (m) | Area (m²) |
|---|---|---|---|
| 1 (W_A1) | 0 | the whole arc (2.72 m across) | 0.311 |
| 2 (W_A1, W_A2) | 0.18 | 1.45 × 0.28 | 0.066 |
| 3 | 0.36 | 0.68 × 0.09 | 0.027 |
| 4 | 0.58 | **0.35 × 0.07** | 0.0145 |

   - The H_A cross lies inside the region in every row.
   - The region is **long sideways and thin in range**. Its long axis is at about 140° from +x, perpendicular to the direction from H back to the sampled wall patch. Timing fixes distance from the wall patch well; the patch's limited width fixes direction poorly.
4. **The spread matters, not the count.** The outer pair alone (W_A1 + W_A4) gives the same region as all four (`frameA_outer_pair_only`). In a pure band-intersection picture, the inner points add almost nothing. In a real estimator, more measurements also average down noise. That is a separate effect, and the film should not show it as "more circles = sharper".
5. **Analytic cross-check (derivation, direct).**
   - Two straight bands of half-width δ crossing at angle 2α overlap in a rhombus with long diagonal **2δ/sin α**.
   - On the bisector, sin α = w/√(w² + z²), with w = half the wall-point spread and z = distance from the wall. So the long diagonal is 2δ·√(w² + z²)/w.
   - Here the crossing angle is 22.6°, giving 0.38 m against 0.35 m on the grid. With ±7.5 cm bands: 0.76 m against 0.77 m.
   - The same form appears in confocal NLOS resolution analyses: axial resolution set by timing, lateral resolution degrading as √(w² + z²)/w. I recall that O'Toole et al. 2018 give such a bound, but I **could not verify it this turn**. Use only the derivation here.
6. **Wider bands are much worse.**

| Band half-width | Region with 4 points (m) |
|---|---|
| ±7.5 cm (2 bins) | 0.77 × 0.14 |
| ±18.7 cm (half the firmware pulse width) | 1.64 × 0.56 |

   An echo's centre must be located far more finely than the pulse is wide. That takes enough photons and a model of the expected shape.
7. **Matches the authors' qualitative finding.** The earlier notes report that tracking error grows as the object moves away from the virtual aperture ("region of ambiguity increases"; manuscript supplement, `search_summary` in `research/manuscript/NOTES.md`). The geometry above reproduces that behaviour qualitatively. This is an illustration, not their data.

---

## 8. What "motion-induced sampling" changes

### 8.1 What the authors' model says

- **search_summary** (manuscript and final article):
  - The motion-induced aperture sampling (MAS) model writes the measurement as the combined effect of **object shape** (a canonical space-time response), **object motion** (which translates that response) and **camera pose** (which sets which wall points sample it).
  - It uses the light-cone transform mapping v_z = z², v_τ = (cτ/2)².
  - It assumes object motion is a rigid translation, with no rotation.
  - Final Fig. 2 is titled "Motion-induced aperture sampling model".
- **code_or_data:** in `canon.py:137-142`, object tracking samples the canonical at the wall points minus the particle offset. Camera tracking samples at the wall points plus the offset.
  - In the camera-localization data, the hidden landmark is fixed in the code at `obj_pos = [0, 0, 0.6]` (`cam_localization.py:31`), and the filter estimates the camera's offset.
  - In the released camera-localization capture, the 16-point sample pattern's centroid shifts by up to 0.30 m (x) and 0.18 m (y) over 358 frames. Frame-to-frame steps have median 0.85 cm and maximum 8.2 cm. The union of all sampled points spans 1.07 × 0.82 m, against about 0.63 × 0.53 m in a single frame. Sensor-to-wall distance `cam_z` varies 0.43–0.57 m.
  - Those coordinates appear to be relative to the sensor (an inference from `x_samp = cur_pos + delta`), so this drift reflects changes in the sensor's tilt and height, not its full world motion. Some frames have wall-point |z| up to 0.23 m, so that dataset's frame convention is not fully understood (unresolved).
  - In the person-tracking capture, by contrast, the wall points never change: fixed sensor.

### 8.2 Illustrated in our room (`layout.json` → `regions`, `aperture_sweep_1bin_bands`; illustrative)

**Sensor moves, person still (B1).** The sensor steps 0.40 m left and re-aims, sampling 4 new wall points at x = 1.18–1.76 (all paths clear the partition by ≥ 0.117 m). Their arcs also pass through H_A, so plain intersection is valid here.

| Frames combined | Total spread of sampled wall (m) | Crossing angle | Region length × width (m) | Area (m²) |
|---|---|---|---|---|
| A alone | 0.58 | 22.6° | 0.35 × 0.07 | 0.0145 |
| A + sweep frame (S = 1.45) | 0.78 | 27.6° | 0.30 × 0.07 | 0.0123 |
| A + B1 (S = 1.25) | 0.98 | 31.6° | **0.24 × 0.07** | 0.0106 |

- The region shortens by about 30%. The gain is **real but modest** in this room, because every usable wall point lies on the sensor's side of the partition.
- A further step to S = (1.05, 0.90) was rejected: its wall-to-person paths would graze the partition (0.08 m clearance).
- The largest gains would come from wall points on the far side of H. This room's partition hides those from the sensor; that is a physical limit worth knowing. Show the shrink honestly. Do not show it collapsing to a dot.

**Person moves, sensor still (B2).** The person moves (0.10, 0.05) m in 0.10 s, i.e. 3 frames at 30 Hz.

| Fusion rule | Result |
|---|---|
| Plain intersection of frame A and frame B2 bands (assumes the person stood still) | **Empty.** No point satisfies all 8 bands at ±3.75 cm. |
| Plain stacking (count how many bands each point satisfies) | Best points satisfy only 4 of 8. They form a smear about 0.86 m long, covering both positions. |
| With wider ±7.5 cm bands | A small region appears, 5.6 cm from the true new position, and does not contain it: a confident wrong answer. |
| Motion-compensated (expand frame-A candidates by any step up to 1.5 m/s × 0.1 s = 0.15 m, then keep those consistent with frame B2) | A 0.40 × 0.07 m region that **contains H_B** |

The motion-compensated rule is a particle filter's predict-then-update step in miniature. In the code:

- predict = Gaussian random walk, σ = 0.07 m per axis per frame (`paper/configs/tracking.yaml`: `radius: 0.07`; `motion.py:305`);
- update = score each particle's rendered histograms against the measurement;
- resample = scores^η with η = 3, residual resampling.

At the demo's 30 Hz capture, σ = 7 cm per frame corresponds to about 2.1 m/s, which comfortably covers walking. That is inference from config values; the paper's capture rate for this dataset is not stated in the code.

### 8.3 Keep the experimental conditions separate on screen

- **Sensor moving, object still:** reconstruction with **known pose** (gantry; manuscript), and handheld **camera localization** using a **retroreflective patch**.
- **Object moving, sensor fixed:** real-time **tracking** (tripod or fixed sensor; diffuse person in SV1; retroreflective gloves in SV2).
- **Both moving at once:** this is the general MAS framing, and "joint object and camera motion" is named as a challenge in Fig. 1. No retrieved experiment demonstrates handheld tracking of a moving diffuse person. **Label any "both move" beat as illustrative.**

Sources for these conditions: `final_paper/NOTES.md` §6 and `manuscript/NOTES.md` E1–E9 (`search_summary`).

---

## 9. Drawing rules for the film

1. Every light segment, arc and band is computed from `layout.json`. Arc centre = wall point, radius = `circle_radius_m`, band = ± `band_half_width_m.default_1_bin` (0.0375 m).
2. Draw only the half of each circle in front of the wall (z > 0). Arcs may pass through the partition; they are candidate sets, not light paths. Optionally dim the parts on the sensor's visible side (`fraction_of_region_hidden_from_S`).
3. Light paths (S→W, W→H) are straight and never touch the partition; each clears it by ≥ 0.117 m. Pulses are slowed, labelled "slowed down".
4. Required labels:
   - circles or ellipses: "simplified picture (2D)";
   - room numbers, bands and regions: "illustrative";
   - the radiometric ratio: "estimate";
   - the VL53L8 fan: "whole patch lit at once; 16 zones listen".
5. Never put a band width, region size or ratio from this note next to a paper experiment's name. None of them is a paper result.
6. Use the paper's numbers (4.7 cm, 30 Hz, 1000 particles and others) only with their own conditions chips (`research/OPENING_EVIDENCE.md`). Do not compare them with these illustrations.

---

## 10. Claim status

| Claim | Status |
|---|---|
| Arrival time plus a known sensor-wall distance puts the hidden point on a circle or sphere (confocal) or an ellipse or ellipsoid (separated points) | Geometry, derivation (`direct`). Ellipsoid use in NLOS reported in the literature (`search_summary`). |
| The authors' code models each zone as a confocal wall point with a point-like object | `code_or_data`, high |
| The VL53L8 lights its whole field at once and resolves zones on the receive side | ST datasheet summaries (`search_summary`, medium) plus inference |
| The retroreflective assumption keeps the confocal model valid when all spots or the whole field are lit | Reported by the authors (manuscript, `search_summary`). Supported quantitatively by this note's flood computation (illustrative). |
| Diffuse targets give weaker (r⁴), blurrier, biased echoes | Reported by the authors (qualitative). Illustrated here; the size depends on the room. |
| Third bounce is about 10⁻³–10⁻⁴ of the first bounce | **Estimate** (this note), consistent in order with the authors' raw ams data (256–576×, different setup) |
| More spread of wall points means a narrower region; region elongated sideways | Geometry (this note). Matches the authors' "error grows away from the aperture" (`search_summary`). |
| Moving the sensor samples new wall patches | Shown in the authors' released camera-localization data (pattern drifts; `code_or_data`) and stated in the MAS model (`search_summary`). Size of benefit here: **illustrative**. |
| An object moving between frames must be compensated before fusing | The code's particle filter does predict-update-resample (`code_or_data`). Naive-vs-compensated numbers here: **illustrative**. |
| Joint handheld-plus-moving-person tracking | **Not demonstrated** in anything retrieved. Proposed or illustrative only. |

---

## 11. Unresolved

1. Exact firmware meaning of `start_bin` (the absolute placement of the 48-bin window). I relied on the code-reproduction consistency check rather than a datasheet.
2. The VL53L8 emitter's real angular profile and the true 3D zone footprint. The 2D slice treats one row of 4 zones with uniform emission.
3. The proprietary ~100-pixel device's field of view, bin width, spot spacing and pulse width. Without them, its circles cannot be drawn to scale. Use the generic confocal picture only.
4. O'Toole et al. 2018's resolution bound (formula and conditions): not verified this turn.
5. Velten et al. 2012 specifics (2 ps / 15 ps, mannequin distance, ellipsoid wording): one search only; the original paper was not opened.
6. Real timing precision (band width) for any device in the paper: not established. The ±3.75 cm band is a quantisation illustration.
7. Albedos, torso size and orientation in the radiometric estimate are assumptions.
8. Frame convention of the released camera-localization point clouds (|z| up to 0.23 m in some frames).
9. Whether joint camera-and-object motion was demonstrated anywhere in the final article (final Fig. 5 contents remain unresolved per `final_paper/NOTES.md`).

## Sources

- Authors' code and data: https://github.com/sidsoma/consumer-nlos, commit `15314de422a765a2d1b72ea7037dfafb2f908d7c`. Files read: README.md, config.py, sensor.py, spad_driver.py, calibrate.py, track.py, particle_filter.py, dashboard.py, paper/README.md, paper/train/{canon,model,motion,score,optim,dataloader}.py, paper/data/{dataloader,process}.py, paper/{tracking,reconstruction,cam_localization}.py, paper/configs/*.yaml, firmware `vl53lmz_plugin_cnh.h/.c`, captured_data arrays.
- Somasundaram et al., Nature (2026), https://www.nature.com/articles/s41586-026-10502-x. Earlier manuscript: https://arxiv.org/html/2605.17865v1 (search_summary only).
- O'Toole, Lindell, Wetzstein, Nature 555, 338–341 (2018), https://www.nature.com/articles/nature25489 (search_summary).
- Velten et al., Nat. Commun. 3, 745 (2012), https://www.nature.com/articles/ncomms1747; review arXiv 1910.05613 (search_summary).
- Heide et al., arXiv 1711.07134; Keyhole Imaging, arXiv 1912.06727 (search_summary).
- ST VL53L8CX datasheet https://www.st.com/resource/en/datasheet/vl53l8cx.pdf; VL53L8CH datasheet https://www.st.com/resource/en/datasheet/vl53l8ch.pdf (search_summary).
- Internal: `research/code_reproduction/NOTES.md`, `research/manuscript/NOTES.md`, `research/final_paper/NOTES.md`.

# Video 02 v2: evidence brief for the writers (audit B)

Prepared 9 October 2026 for the v2 pass of "How Cameras See Around Corners". The owner's brief
(`v2/REVISION_BRIEF.md`) governs this pass. This file lists the statements the v2 script may use, with the claim IDs
behind them, the conditions that must travel with them, and the v1 wording that must not come back.

**Where this comes from.** `research/claims.csv` (C01–C45), `research/EXPERIMENT_RECORD.md` (records R1–R11, H1–H3,
I1, X1–X6), `research/OPENING_EVIDENCE.md`, the six research `NOTES.md` files, `research/geometry/layout.json`, the
evidence files in `source/src/data/evidence/`, and the v1 reviews (`qa/DEFECT_LOG.md`, `qa/REVIEW_R2.md`,
`qa/REVIEW_R3.md`, `STATUS.md`). For this brief I also re-checked:

- the evidence numbers against the JSON files;
- the confocal arithmetic against `layout.json`;
- which tracked positions fall behind the plotted partition;
- the CheapSPAD README at commit `c76c13f`.

I edited no other file.

**How to read each entry**

| Mark | Meaning |
|---|---|
| **Say** | Narration that the evidence supports as written. Tighter paraphrases are fine if they don't widen the claim. |
| **Show** | On-screen wording. |
| **Attach** | A condition that must sit beside that result: on screen, spoken, or in the description, as stated. |
| **Never** | Wording that breaks the evidence. |
| Status | The labels used in `claims.csv`: experimentally supported, reported by authors, independently demonstrated, illustrative, inference, proposed application. |

**What could and could not be read.** nature.com, arXiv, the project page and IEEE Spectrum were blocked for the
research. Everything about the final paper's wording, figures and Supplementary Video captions therefore comes from
search summaries, several agreeing ones where noted. Paraphrase the paper in narration. Quote only the abstract phrases
given below. The authors' released code and data were read and run directly, and so was the 2018 Nature PDF (from a
mirror).

---

## 0. Rules for the whole v2 script

1. **Four evidence contexts. Never merge them.**

   | Context | Record | What it is | Where it may appear |
   |---|---|---|---|
   | A | R8 | ST VL53L8-series evaluation kit, 4×4 zones, sensor held still, hidden person tracked | opening; consumer-hardware callback |
   | B | R10 | ams 3×3-zone sensor: the raw waveform and the U reconstruction (static U, 36 preset positions) | timing and geometry sequences |
   | C | R1 | the authors' separate test of a person in ordinary clothes, 30 Hz capture, device not named, data not released | results and limits |
   | D | I1 | our illustrated room (`layout.json`): every delay, arc, band and region number | geometry sequences |

   The smartphone-grade device's other results (R2–R6) are reported by the authors only. None of them is shown as data.
2. **Position estimate, rough reconstruction and photograph are three different things.** Explain the difference once,
   clearly. Don't repeat it as a disclaimer on every shot.
3. **"30 frames a second" belongs to context C only, and it is a capture rate.** It is not R8's rate, and it is not
   processing time.
4. **Material conditions travel with each result.** That means reflective targets, a still object, and preset or known
   sensor positions.
5. **Re-running released code on released data is not replication.** Say what we did. Do not claim something broader.
6. **Applications are "potential use".** Nothing has been deployed.
7. **Publication date is not capture date.** Say "published in 2026", never "2026 measurements".
8. **Round trip versus one way.** About 30 cm of *path* per nanosecond means about 15 cm of *distance* from the wall
   spot.
9. **Geometry.** Light travels in straight segments and never through the partition. Candidate arcs are constraints,
   not light paths; they may cross the partition. Arcs are centred on the **wall spot**, not on the sensor.
10. **Illustration numbers never sit beside a paper experiment's name.** That covers our delays, bands, regions and the
    1/380 estimate.
11. **No statement about Video 01's analytics** anywhere: not in the narration, the description or comments.

---

## 1. The opening real result (0:00–0:30)

### 1.1 What the result is

Record R8; claims C02, C03, C19 and C32. The dataset is `paper/captured_data/st_spad_person_tracking`, 475 frames, in
`github.com/sidsoma/consumer-nlos` at commit `15314de`. The code is MIT-licensed; whether that licence covers the data
is ambiguous (`RIGHTS.md`).

| Item | Established fact | Access |
|---|---|---|
| Sensor | STMicroelectronics VL53L8-series multizone time-of-flight sensor on an evaluation kit. The code says VL53L8**CH**; the manuscript and the authors' video say VL53L8**CX**. On screen, write "ST sensor kit". 4×4 = 16 zones, 250 ps bins. | code_or_data |
| Motion | **Sensor held still.** The calibrated wall points are identical in all 475 frames, and the authors' video shows a mounted sensor. | code_or_data, direct |
| Aim | At a wall patch. The 16 measured wall points span 0.76 × 0.74 m. The sensor is about 0.82 m from the wall, but that is a code constant "used only for visualization". | code_or_data |
| Hidden target | A person walking behind a partition. The dataset is named "person_tracking". The authors' own video of the capture (reference only, not cleared) shows a person behind a black partition. That the video shows this capture is our strong inference: 6 frames match within 2–10 cm. | code_or_data; direct; inference |
| What the dot is | The mean of the particle filter's 1,000 candidate positions for that frame, seen from above. Two sources are available; see below. | code_or_data |
| Plot elements | The partition line (x = −0.30 m, z 0.65–1.6 m) and the sensor marker are **constants from the authors' plotting code, not measurements.** The wall points are measured. v1 mirrored x so the sensor sits at left; keep that and say so in the description. | code_or_data |
| Dates | Published with the paper on 20 May 2026. Files committed 20 Oct 2025. Capture date not stated. | code_or_data; search_summary |

**Choosing the dot.** Record the choice in the source record.

- **(a) The stored estimate.** These are the particle arrays saved in the released files: "their position estimate".
  How they were produced is not documented. **Frames 1–4 (indices 0–3) of the stored track fall on the sensor's side of
  the plotted partition line** while the filter converges; I checked this in 2D against the plot constants. From index 4
  onward, every stored position is behind the line. So start the replay at index 4 or later. Review round 1 suggested
  index 6, and the comparison metrics use frames 21 onward. Record the start frame.
- **(b) Our re-run.** This is the authors' unmodified `tracking.py`, run by us with seed 0. Every frame is behind the
  plotted line. It sits a median 8.1 cm from the stored estimate (correlation 0.97 in x and 0.99 in z, frames 21–475).
  If you use it, the source line must say **"authors' code, run by us"** (D13). The narration then says "the estimated
  position", not "their estimate".
- **Uncertainty.** After convergence the particle cloud's spread is about 0.1–0.2 m (standard deviation). A single dot
  hides that, so a faint halo or cloud is more honest. It is optional.

### 1.2 What is not known: never state or imply it

| Unknown | Why | Consequence |
|---|---|---|
| Clothing / material | Not documented. The code processes the data with its retroreflective setting (`isDiffuse: False`). That setting is a falloff weighting, not a record of clothing. The authors' video shows no visible reflective material, but that can't be ruled out. | Never "ordinary clothes". Never "reflective suit". |
| Capture rate | Not in the files. Candidates: the demo's requested 30 Hz, ST's 25 Hz preset, and about 14 frames per second of playback in the authors' video. | Show frame numbers or nothing. Never seconds, "30 fps", "real time" or "live". |
| Capture date | Not stated. The data existed by October 2025. | "published in 2026" only |
| Accuracy | No ground truth was released. | No "± cm", no "accurate to" |
| Device | It is the ST kit. It is not the smartphone-grade device, not Supplementary Video 1, and not handheld. | Never "phone", "smartphone sensor" or "about 100 pixels" on this board |
| Processing speed | The authors' latency is unknown. Our CPU's 25 ms per frame is our own figure. | No speed claim |

### 1.3 Replay rules

- **One plotted position per data frame.** Do not interpolate or smooth between frames. If you skip frames, take every
  Nth frame and record N.
- **Label any replay of all 475 frames in under about 16 s as "sped up".** That replay is faster than any credible
  capture rate: ST lists histogram output up to 30 Hz (search_summary), and 475 frames at 30 Hz is 15.8 s. No speed-up
  factor can be stated.
- **Record the mapping** in the source record: start frame, end frame, and data frames per video frame. The owner's
  brief asks for this.

### 1.4 "Him" versus "something hidden"

- **"Him", "he", "our friend":** the cartoon guesser in our illustrated room. The cartoon sensor, tripod and checker are
  illustration too.
- **"Someone", "a person", "something hidden", "their estimate":** the real R8 result.
- **Keeping them apart:**
  - Don't say "that wall" about the real experiment. The authors used their own lab wall.
  - Don't move the cartoon guesser in sync with the real track.
  - Don't draw the real track inside the cartoon room.
  - A match cut from the real board to our schematic is fine if the style visibly changes and the schematic reads as
    ours (simplified).

### 1.5 The owner's draft narration, checked line by line

| # | Owner's draft | Verdict | Use |
|---|---|---|---|
| 1 | "This sensor can't see him." | OK: illustration (C01). | as is |
| 2 | "It's pointed at a wall." | OK. It is also true of R8. | as is |
| 3 | "Yet researchers used light bouncing off that wall to track something hidden around the corner." | **Change "that wall".** It ties the real result to our cartoon wall. | "Yet researchers have used light bouncing off a wall to track someone hidden around a corner." (C02, C04) "Something hidden" is also fine. |
| 4 | "That dot is their position estimate, not a photograph." | OK with dot option (a). With option (b), adjust. | (a) as is. (b) "That dot is an estimated position, from their data and their code. Not a photograph." (C02, C19) |
| 5 | "The trick is timing: light that visits the hidden object takes longer to come back." | OK (C04, C06). The R8 files have the wall echo removed, so the opening's early/late timeline is **illustrative**, drawn from our room. | as is, or "...light that reaches the hidden person..." |
| 6 | "So how do you turn a tiny delay into a location?" | OK | as is |

**Opening on screen, 0:04–0:11.** One source line and three short labels:

- Labels: **"sensor"** · **"blocked"** · **"estimated position"**
- Source line: **"Real data · Somasundaram et al., Nature 2026 · ST sensor kit, held still"**
- Small: **"sped up"**, if section 1.3 applies.

**Move out of the opening.** These go to the later evidence beat or the description: "authors' code, run by us" (only
with dot option (b)), "clothing not recorded", "frame numbers, not seconds", and "partition and sensor drawn from the
authors' plot".

**0:24–0:30, the timing sensor.**

- **Say:** "That takes a time-of-flight sensor: it fires its own invisible flash and times the echo." (C07, C43)
- The flash is near-infrared on the ST kit (940 nm). The wavelength of the smartphone-grade device is unknown.
- The first candidate arc is centred on the **wall spot**.

**Packaging note.** None of the 2026 systems is an ordinary camera. C07 defines a time-of-flight sensor as "a camera
that times its own light's round trip", which supports "How Cameras See Around Corners" if the opening names the sensor
type. "This Camera Can See Around Corners" over the kit board would overstate it.

### 1.6 Description text for the tracking plot

Use the D10-corrected text from v1, adjusted for the dot you choose:

> Tracking plot: the authors' released measurements from a low-cost STMicroelectronics VL53L8-series evaluation-kit
> sensor (16 zones), held still and aimed at a wall while a hidden person moved behind a screen. Positions [saved in the
> authors' files | estimated with the authors' published code and settings, run by us], plotted by us and mirrored to
> match our room; the partition and sensor positions are drawn from the authors' plotting code. The authors' code
> processes these data with its retroreflective-target setting; what the person wore is not documented. Capture date
> and frame rate are not stated in the release; replay sped up. These data come from the evaluation kit, not from the
> smartphone-grade research device used for the paper's main results, whose data were not released.

---

## 2. Diffuse reflection (0:30–1:05): C08–C10, with C04, C05, C11 and C43

| ID | Say | Attach / note | Status |
|---|---|---|---|
| C04 | "The light doesn't go through the partition. It goes around the end, by way of the wall, and comes back the same way." | Draw straight segments only. Nothing crosses the partition's top or body (assertAroundTheEnd). | independently demonstrated |
| C08 | "A mirror sends light off at the same angle it arrived, so the picture stays intact." | A mirror on the back wall must show **his back**, the side facing the wall (physics correction in `ART_USE.md`). | independently demonstrated (textbook) |
| C09 | "A painted wall is rough up close. It throws light every which way, so each spot acts less like a mirror and more like a tiny lamp." | "Tiny lamp" is our analogy for near-Lambertian scattering. Label it if the lamp is drawn. | independently demonstrated |
| C09 (optional) | "The researchers call a wall like this a 'virtual mirror'." | Their phrase (Fig. 1a caption, search_summary, medium confidence). Any gloss such as "because timing lets it relay information" is ours. Say it as ours, or don't add it. | reported by authors |
| C10 | "What comes back is a blend of light from many paths. The picture is gone. What survives is *when* the light arrives." | Simplification: the model also uses how much light arrives in each time bin. Never "each echo carries a pixel". The postcard/confetti metaphor (v1 s12) is supported as a *negative* metaphor; keep it only if it helps. | inference / derivation |
| C05, C11 | "Every bounce spreads the light out, and most of it is lost. So the wall's own echo swamps the one from around the corner." | C05's "1/380 to 1/6,000 of the first bounce" is **our best-case estimate**. Say "a tiny fraction". Never put it beside the measured ams ratio in section 4.1. | inference; independently demonstrated |
| C43 | "an invisible flash" | Near-infrared, 940 nm, applies to the ST kit. In drawings: "shown for clarity". | reported by authors (datasheet) |

**Illustrative counts must say "not to scale".** v1's 24 → 1 dot tally and 9:1 block card implied a 1-in-10 ratio,
which is wrong by orders of magnitude (D19, N05). Use "not to scale · far weaker", or leave the numbers out.

---

## 3. Timing becomes distance (1:05–1:40, plus the opening)

### 3.1 The path, in the simplified (confocal) picture

Claims C13 and C14, `geometry/NOTES.md` §3, and the authors' code (`canon.py:83-84`).

- **Sender and listener at one wall spot.** In the simplified picture, the sensor sends and listens at one wall spot W.
  The route is S → W → H → W → S, so the path length is **L = 2|SW| + 2|WH|**.
- **The wall echo** arrives after 2|SW|/c. Subtract it and the **extra delay is Δt = 2|WH|/c**.
- **The hidden distance from the spot** is **|WH| = c·Δt / 2**, half of the extra path.
- **This is what the authors' code models** for each zone: c·t = 2|w − p|, with t measured from that zone's own wall
  echo.
- **The real hardware is not exactly confocal.** The ST kit lights its whole field at once and listens in 16 zones. The
  smartphone-grade device pairs each pixel with one laser spot, but all spots fire together. The confocal picture fits
  best for retroreflective targets, and the authors assume that.
- **Label the picture once: "simplified picture".**
- **Separated send and listen spots** would give an ellipse (an ellipsoid in 3D) instead of a circle. v2 doesn't need
  this; if shown, label it.

### 3.2 Speed of light, round trip

c = 29.98 cm/ns.

- **Say:** "Light covers about thirty centimetres every nanosecond, a billionth of a second. But this light goes there
  *and back*, so each extra nanosecond puts him only about fifteen centimetres farther away." (C06, C14)
- **Show:** "1 ns ≈ 30 cm of travel" · "there and back → ≈ 15 cm farther"
- **Bin sizes.** One 250 ps bin on the ST kit is 7.5 cm of path, or 3.75 cm one way. One 88 ps bin on the ams sensor is
  2.6 cm of path, or 1.3 cm one way.

### 3.3 The worked example

Illustrative room, record I1, `layout.json` → `confocal.frame_A_H_A`, hider at H_A. All four spots pass the checks in
`research/geometry/geometry_check.py`.

| Wall spot | Extra delay after the wall echo | Extra path (there and back) | Distance from the spot (each way) |
|---|---|---|---|
| W1 (x = 1.582) | **8.85 ns (≈ 8.9)** | **2.65 m** | **1.33 m** |
| W2 (x = 1.759) | 7.98 ns | 2.39 m | 1.20 m |
| W3 (x = 1.945) | 7.16 ns (≈ 7) | 2.15 m | 1.07 m |
| W4 (x = 2.157) | 6.39 ns | 1.92 m | 0.96 m |

Arithmetic check for W1: 8.85 ns × 29.98 cm/ns = 265 cm of path; half of that is 1.33 m, which equals |WH| = 1.3265 m.
Counted from the flash rather than the wall echo, W1's wall echo arrives at 6.0 ns and the hidden echo at 14.9 ns. The
8.85 ns is the gap between them.

- **The internally consistent chain:** "≈ 8.9 ns later → ≈ 2.65 m extra, there and back → ≈ 1.33 m each way". If the
  narration rounds to "about 9 ns", pair it with "about 1.3 m", not "1.33 m" (9 ns gives 1.35 m).
- **v1's "≈ 7 ns later" in S1 came from a different wall spot (W3).** It was chosen for drawn clearance in the raised
  room view: 7.16 ns, 2.15 m, 1.07 m. It is the same hider, not an error, but v1 never said the spot had changed (D23).
  v2 has three options:
  - **(a) One spot and one number throughout: W1 at 8.9 ns.** In the full-frame plan schematic every spot's legs clear
    the partition by at least 0.10 m. In the raised room view, S1 chose W3 because it passed the on-screen clearance
    test (`pickWall`, gap of at least 18 px). Run the same test on W1 before drawing it in that view.
  - **(b) No number in the opening.** Say "a few billionths of a second later" and give the first number with the
    ruler.
  - **(c) Show both, naming each spot:** "from this spot ≈ 7 ns; from that one ≈ 8.9 ns". The difference is itself the
    lesson of the two-arc beat.
- **Range of delays in the room: 6.4–8.9 ns (C06).** All illustrative. Keep them away from any real-data board.

### 3.4 Later and weaker

C11, plus `geometry/NOTES.md` §6.

- **Say:** "Nearly everything coming back bounced once, off the wall. The hidden echo bounced three times, so it's late,
  and it's tiny."
- **Distance makes it worse.** A diffuse hidden echo falls off as 1/|WH|⁴. Moving from 1.0 m to 1.5 m from the wall
  costs about 5×. This is a derivation; use it only if needed.

---

## 4. The real raw waveform and the U reconstruction (1:05–2:30)

### 4.1 The raw waveform: record R10, claim C12

| Item | Value |
|---|---|
| Data | The authors' released **raw** histograms (no background subtraction). Dataset `ams_U_reconstruction`, file `iter_22`, which is one of the 36 sensor positions. |
| Sensor | A **3×3-zone ams time-of-flight sensor**, model not named in the code, 88 ps bins. **The centre zone is plotted.** Sensor about 0.23 m from the wall (231 mm reported for the centre zone). |
| Wall echo | 1,278,132 counts at bin 30 |
| Late bump | Bin 72, which is **3.70 ns after the wall echo**. That is 110.8 cm of extra path there and back, about 55 cm each way under the confocal model. |
| Weakness | The bump stands 2,220 counts above the local floor, so the wall echo is **≈ 576× taller in the centre zone**. Across the nine zones the figure is **256–576×**. This is **our** peak-height measure, not the authors' metric. On a true-scale linear axis the bump is 0.17% of the wall echo's height, which is invisible without magnification. |
| Interpretation | That the bump is the hidden U's echo is **our interpretation**, consistent with the geometry: the reconstruction places the U about 0.54 m from the wall, and 3.7 ns corresponds to about 55 cm each way. That match is our derivation. |

- **Say:** "This is real data from the same team, with a different sensor and a different hidden object. The wall's echo
  towers over everything. A few nanoseconds later there's a bump you have to zoom in to see. In this capture, it's
  hundreds of times weaker." (C12)
- **Then connect it to the route.** "That bump is light that took the long way round. About three point seven
  nanoseconds later means about a metre more of travel, there and back." (C06, C12)
- **Show:**
  - "Real data · authors' released raw counts"
  - "different sensor: 3×3 zones · centre zone"
  - "zoom ×250": the tab shows the factor actually applied; the time axis stays unchanged and zero stays on the
    baseline.
  - "≈ 3.7 ns later · ≈ 1.1 m extra (there and back)"
  - "hundreds of times weaker (this capture)"
- **Keep the trace honest.** Draw straight lines between the 128 bins, with no smoothing. Cropping the time range and
  highlighting are fine.
- **Never:**
  - Never "his echo", "the person's echo" or "the kit's echo". This is a static U and a different sensor, and the R8
    files carry no wall echo.
  - Never an unlabelled "576×".
  - Never a log axis without a label.
  - Never annotate the small blip about 1.5 ns *before* the wall echo. It is probably the sensor's internal reference,
    which is our inference.

### 4.2 The U reconstruction: R10, C33 and C35 (C18 for the method)

| Item | Value |
|---|---|
| Sensor | The **same** ams 3×3 sensor as the waveform |
| Motion | **36 sensor positions** on a 6×6 back-and-forth raster: x 0–1.28 m at 25.6 cm pitch, y 0.32–0.96 m at 12.8 cm pitch. The positions are **hard-coded in the authors' script**, assumed rather than measured. How the sensor was physically moved is not documented; "not handheld" is our inference from the regular grid. |
| Object | A hidden U-shaped object, **held still** |
| Method | Confocal backprojection. Each zone's late echo "votes" for a shell of possible points around its wall spot; the votes from all positions are added, then a sharpening filter is applied. |
| Output | A **rough outline**: a 40×40 front view of a 40×40×20 grid. The U sits about 0.54 m from the wall. |
| Our run | The authors' unmodified script took about 1.1 s on our CPU. That is not the authors' timing. |
| Build-up frames | The film's frames are cumulative backprojections over the first k of 36 positions, computed by us with the authors' own functions. They are real partial sums, not invented frames. The 36-position result equals the authors' volume exactly (maximum difference 0.0). If you use the authors' display gamma of 3, note it in the record. |

- **Say, v2 version:** "Here's the real thing. The same sensor, stepped through thirty-six preset positions while the
  hidden object stayed still. Each measurement adds its rings, and together they outline a hidden U." (C33, C35, C18)
- **Or keep v1's line:** "Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of
  a hidden U."
- **Show:**
  - "Real data · same 3×3 sensor · 36 preset positions · object held still"
  - "rough outline, not a photo"
- **Description:** "authors' released data and code, run by us".
- **Placing it next to the geometry**, in the order the owner's brief asks for:
  1. one measurement → one arc (illustrative; our room; the person)
  2. second spot → second arc
  3. bands → a region
  4. a **visible switch to "Real data"**
  5. U build-up, k = 1 → 36

  The switch must be obvious: a new board, palette and headline, and the 3×3 sensor icon. The two sides differ in
  sensor, hidden object (a still U versus a walking person), method (backprojection over many positions versus a
  particle filter) and dimension (3D versus our 2D slice).
  - Don't morph the illustrative arcs into the U.
  - Don't put the person token on the U plot.
  - Don't scale the U into our room's coordinates.
  - Match by the logic ("more measurements narrow the answer"), not by the geometry.
- **Prefer "preset" or "programmed" positions over "known"**: the code assumes them.
- **The smartphone-grade device's own reconstructions** (a mannequin and diffuse objects) used a **gantry with known
  positions** and still objects (R5, R6, C35). They are reported only, not shown.

### 4.3 Geometry steps that stay illustrative

C14–C17, C18 and C19; `layout.json` regions, ±3.75 cm bands.

| Step | Say | Number available (illustrative only) |
|---|---|---|
| One timing | "One delay gives a distance, not a direction. He could be anywhere on this arc." (C14) | arc radius 1.33 m from W1 |
| Two spots | "A second spot gives a second arc. In front of the wall, they cross in just one place." (C15) | 2D, no noise. The other crossing is behind the wall. |
| Noise | "Real timings are fuzzy, so each arc is really a band, and the bands overlap in a patch." (C16) | the band is one 250 ps bin, ±3.75 cm. That is a quantisation picture, **not a measured precision**. |
| Spread | "Spots close together leave a long, blurry patch. Spread them out and it shrinks." (C17) | 2 spots: 1.45 × 0.28 m. 4 spots: 0.35 × 0.07 m. The outer pair alone gives the same patch as all four, so **the spread matters, not the count**. |
| Real systems | "A real system tries many possible positions and keeps the ones whose predicted echoes match, leaning on assumptions such as the object's shape." (C18) | Released code: 1,000 candidates; the object is modelled as a single point. |
| Output | "So the answer is a likely position, or a rough shape. Not a photograph." (C19) | Say this once. |

**Never** imply that three cartoon rays recover a detailed scene. In 3D, arcs become shells.

---

## 5. History in 20–30 seconds (2:30–2:55)

| ID | Supported statement | Attach / never |
|---|---|---|
| C20, C21, H1 | "In 2012, an MIT team recovered the rough 3D shape of a small hidden mannequin, using a femtosecond laser and a streak camera." | Lab-bench equipment. **Never** "invented the idea": a 2009 concept paper (Kirmani et al.) came first. **Never** "wooden" (secondary sources only). **Never** "sub-millimetre resolution" (that figure is depth precision only). |
| C22, H2 | "In 2018, Stanford researchers scanned a single laser-and-detector spot across the wall, like our simplified picture, and made the reconstruction maths fast." | Numbers are optional. If used, **both or neither**: "about a second to compute, for a reflective exit sign; measuring took almost seven minutes" (C23). **Never** "saw around a corner in a second". The 2018 mannequin was painted with retroreflective paint; it is not the 2012 one. |
| C24, H3 | "By 2021, a Wisconsin–Milan team had live video around a corner of ordinary, non-reflective objects, five frames a second, with a powerful laser and custom-built detectors." | Imaging at 5 fps with about 1 s latency. Don't claim "room lights on" for every experiment. |
| C45, X1 | "The same year, a team in Bonn and Princeton tracked hidden objects with a cheap ST time-of-flight sensor kit." | **Tracking**, not imaging. ST P-NUCLEO-53L1A1 kit with VL53L1X sensors. One of their two setups added a galvanometer scanning mirror (CheapSPAD README). Their target materials are not in our notes. **This precedent must stay**, and the 2026 work must **never** be called the first low-cost result. |
| C25 | "The first three used research-grade equipment." | The Bonn–Princeton kit is the exception, so don't say "all of them". |
| C26, C27, C28 | "In 2026, a team from MIT and Dartmouth showed it on consumer-grade LiDAR: a smartphone-grade research device, plus an off-the-shelf sensor kit." | Not a stock phone. The device is not named; **never imply a manufacturer**. |
| C26, C29, C30 | What is new in 2026 is not "cheap" on its own. It is several abilities on phone-grade hardware: rough 3D shapes, tracking (including two objects at once), and working out where the sensor itself is. These come from fusing many weak frames with a model of how things move. | The abstract lists "3D reconstruction; single- and multi-object tracking; camera localization using hidden objects" on a smartphone-grade LiDAR (search_summary). The data are not released, so this is reported by the authors. |

**Draft, 69 written words (about 73 spoken, since years are read as two words), about 25 s at 175 words per minute.**
C20, C21, C22, C24, C45, C26 and C30.

> "None of this started cheap. In 2012, an MIT lab rebuilt a small hidden mannequin in 3D with a femtosecond laser and a
> streak camera. In 2018, Stanford scanned one spot across the wall and made the maths fast. By 2021, researchers in
> Wisconsin and Milan had live video around a corner, and a Bonn–Princeton team tracked hidden objects with a cheap
> sensor kit. In 2026: phone-grade hardware."

**Rights.** Redraw the history scenes. No figures from these papers are cleared (`RIGHTS.md`). Description credit: "History
scenes are illustrations based on the papers above."

---

## 6. Consumer hardware and motion-aware fusion (2:55–4:05)

### 6.1 What the paper says the obstacles are

| # | Obstacle | Exact basis | Say |
|---|---|---|---|
| P1 | **Weak laser** | Abstract: "poor signal quality resulting from low laser power, low spatial resolution, and object and camera motion" (search_summary, near-verbatim). Manuscript: low power "due to eye safety constraints". | "Small sensors use weak, eye-safe lasers, so the echoes are fainter still." (C28) |
| P2 | **Short exposures** | Manuscript: "short exposure times (due to dynamic scenes) result in low signal-to-noise ratio". Table 1 lists "short-exposure capture (30 Hz)" (search_summary). | "And each frame is short, because things move." |
| P3 | **Few pixels or zones** | The smartphone-grade device has about 100 pixels (manuscript and IEEE Spectrum, search_summary). The ST kit has 16 zones and the ams sensor 9 (code_or_data). Manuscript: "constraints on bandwidth, power, and chip area limit spatial resolution". | "Their phone-grade device had about a hundred pixels; the kit, sixteen listening spots." (C28) |
| P4 | **Sparse sampling** | Manuscript: "a trade-off between aperture sampling density and total aperture size". The Fig. 1a caption names this trade-off (search_summary, medium). | "A few listening spots, bunched on a small patch of wall: exactly the long, blurry patch from before." (C17, C28) |
| P5 | **Motion** | Abstract: "object and camera motion". Fig. 1: "joint object and camera motion". | "And things move: the person, and the sensor if you hold it." (C28, C30) |
| P6 (optional) | **Wider laser pulses** | Manuscript: consumer LiDARs "often have much wider pulse widths" (search_summary). The ST firmware pulse is about 10 bins, about 2.5 ns (code_or_data). | only if needed |
| — | **Raw data access** | **Not in the paper's list as retrieved.** The source is the lead author in the press (Digital Trends, ChannelNews) and IEEE Spectrum: phone makers would need to release raw data, "which they often don't do". | "And your phone can't do this yet: the lead researcher says phone makers usually keep the raw sensor data locked away." (C42) Attribute it to the researcher, not "the paper". |

**Never:**

- Name or imply a phone maker. No iPhone.
- Print a "10 × 10" pixel layout (D33). Only "about 100 pixels" is sourced.
- Say "your phone's LiDAR can do this".
- Say how the authors obtained raw data from their device. That is unresolved.

### 6.2 The burst-photography idea

- **Abstract** (search_summary): "Inspired by burst photography and synthetic aperture radar, we propose a multi-frame
  fusion strategy". Where this sentence sits in the abstract is unresolved. Claim C29.
- **"Night mode" is our analogy** (C44). Label it "our analogy" if shown.
- **Say:** "Their fix borrows a trick from phone cameras: combine many quick, dim frames into one better estimate. But
  only after accounting for what moved." (C29, C44, C30)

### 6.3 What "motion-induced sampling" means in the paper

- **Abstract** (search_summary, near-verbatim; C30): "We introduce the motion-induced aperture sampling model to unify
  the effects of object shape, object motion and camera motion under a single measurement model."
- **In plain words:** each frame's echoes depend on three things: the hidden object's shape, **where it is now**, and
  **which wall spots the sensor is listening at now**. The model writes all three into one prediction of what the
  sensor should measure.
- **Fig. 2** (search_summary):
  - shape fixes a standard echo pattern;
  - object motion shifts that pattern;
  - the sensor's pose decides which part of it gets sampled.
- **Moving the sensor samples new parts.** Manuscript: it "increases synthetic aperture size and resolution due to
  additional spatial sampling". That is the synthetic-aperture-radar idea.
- **The authors' stated assumptions:**
  - motion is rigid sliding, with no rotation;
  - targets are retroreflective, to keep the confocal model; diffuse targets work "empirically", but worse;
  - the pulse shape is approximated.

### 6.4 What changes between frames

| What moves | What changes in the data | Evidence |
|---|---|---|
| **The sensor** | Its zones land on **different wall spots**, so the same zone number means a different listening spot in each frame. | R9, the released camera-localization data. The sampled pattern drifts up to 0.30 m over 358 frames; together the points cover 1.07 × 0.82 m, against about 0.63 × 0.53 m in one frame (C31, code_or_data). Our re-run of that dataset is weak, so use it **only** for "moving the sensor samples new spots". |
| **The hidden person** | Their **echo delays change**. | R8, our analysis of the released data. The echo-weighted mean delay ranges over 173–260 cm of extra round-trip path, and it rises and falls with the tracker's distance from the wall (r = 0.93). This statement is new, so add it to the ledger before use (proposal P07). |
| **Nothing (noise)** | Every frame is short and noisy, so one frame on its own is weak evidence. | P1 and P2 above |

### 6.5 Why naive averaging smears

- **If the person moved, adding frames adds echoes from different places.** The result is a streak along their path,
  like a long-exposure photo of someone walking.
  - The authors make the same point about their reconstruction method: for moving objects, "techniques such as filtered
    backprojection will fail because of motion blur" (manuscript, search_summary).
- **If the sensor moved, averaging "zone 5" across frames mixes different wall spots as if they were one.** The
  geometry then no longer fits any single position.
- **Our illustration, I1 frame B2 (illustrative; label it so).** The person moves 11 cm between two frames:

  | Fusion rule | Result |
  |---|---|
  | Insist both frames agree | **no answer at all** |
  | Count votes | a **0.86 m smear** covering both positions |
  | Count votes, with wider bands | a small, **confident region 5.6 cm off** that doesn't contain him |
  | Allow a step of up to 15 cm, then check the new frame | a region that **contains his new position** |

- **Say:**
  - "The catch: between frames, the person moves. Just average the frames and you get a smear, like a long-exposure
    photo of someone walking." (C30)
  - Optional: "Average across a moving sensor, and you're mixing echoes from different spots on the wall as if they
    were one." (C30, C31)

### 6.6 What the method does instead: one unknown at a time

**The authors' framing** (manuscript, search_summary): jointly solving for shape, object position and sensor pose is "a
highly nonconvex inverse problem … unsuitable for real-time execution on consumer platforms", so "many applications
require solving for one unknown variable at a time".

| Mode | What is assumed known | How frames are combined | What was demonstrated |
|---|---|---|---|
| **Reconstruction** (unknown: shape) | The hidden scene is **still**, and the **sensor positions are known**. | Each frame's echoes are placed from where the sensor actually was, then added. More positions give a wider "virtual aperture". Adding is legitimate here because nothing hidden moved. | Gantry with known positions (mannequin, diffuse objects; R5, R6). The released U uses 36 preset positions (R10). Handheld reconstruction is only "in principle, … if we had reliable camera pose". C35, C33. |
| **Tracking** (unknown: position) | The **sensor is fixed**, and the **object's shape is assumed**. The released code models it as a single point. | A particle filter keeps about 1,000 guesses. For each new frame:<br>1. every guess drifts by a small random step (7 cm per axis per frame in the released code; the manuscript says a 5 cm prior "works well empirically at 30 Hz");<br>2. each guess's predicted echoes are compared with the new frame;<br>3. guesses are kept and copied in proportion to how well they match (score cubed, then resampled).<br>Past frames act as a **prior that is allowed to move**; the raw data are **never summed**. | ST kit person (R8); the ordinary-clothes person (R1); two gloved hands (R2). C18, C30, C31; Extended Data Fig. 1 (search_summary) plus the code. |
| **Locating the sensor** (unknown: sensor position) | The **hidden object is known and still**: a retroreflective patch. | The same filter runs over the sensor's position. | The **only handheld result** (R3; Supplementary Video 3, reported). Not reconstruction, and not person tracking. |

**Say:** "Their method handles one unknown at a time. To build a shape, keep the object still and move the sensor
through known positions: every frame listens from new spots, and those really can be added up. To follow a moving
person, keep the sensor still and let each guess move a little between frames, keeping the guesses that keep matching."
(C30, C31, C35, C18)

**Show:** "one unknown at a time" · left panel: "object still · sensor moved to known positions" · right panel: "sensor
still · person moves". In the still-sensor panel the sensor must be **on a stand, not in a hand** (N08).

### 6.7 What is not established: do not imply it

- **Tracking a moving person with a handheld sensor**, with both moving. Nothing retrieved demonstrates it. Label any
  "both move" beat "illustration".
- **Handheld 3D reconstruction.** Only gantry or preset positions were used.
- **How much fusion improves accuracy.** No consumer-run accuracy figure exists in our sources.
  - The manuscript's 4.7 cm is a gantry-moved patch in stop-motion, unverified in the final article. **Never use it.**
- **That fusion "sharpens" tracking.** In our illustration, the motion-aware result is no sharper than the new frame
  alone; it **avoids the smear**. Say "keeps up with him", not "gets sharper".
  - For still objects with known positions, more positions do narrow the answer: section 4.2, and C17 with the sensor
    moved, about 30% shorter in our room. That gain is "real but modest". Never show it collapsing to a dot.
- **Speed on phone hardware.** "Reliable real-time performance on mobile hardware" is an open problem in the project
  FAQ (search_summary). There is no latency figure.
- **"Turns the natural shake of a handheld device into an asset"** is the MIT Media Lab post's phrasing. It was shown
  only for locating the sensor. Avoid it.
- **The final article's Fig. 5** ("realistic scenarios"). Its contents are unknown, so say nothing about it.

---

## 7. Results, limits and what this production did (3:30–4:55)

### 7.1 Retroreflective help: C34, C02 and C11

- **Say:** "Many of their tests had help: reflective material on the target, like the strip on a safety vest, which
  sends far more light straight back to the sensor." (C34)
- **Attach to:**
  - the gloved hands (R2);
  - the sensor-locating patch (R3);
  - "many of our experiments" (manuscript, search_summary): "retroreflective cloth … to preserve the confocal image
    formation model".
- **Diffuse targets.** The authors say diffuse targets work, but are "inherently worse … because of the weaker signal"
  and non-confocal paths (search_summary).
- **Size of the advantage.** Avoid numbers. If one is needed, Nam et al. 2021's "at least 10,000 times higher than
  diffuse surfaces" must keep its qualifier: "for the specific scenes and using this specialized confocal scanning
  capture technique".
- **For R8: "Our opening clip's files don't say what the walker wore."** (C02)
- **Drawing.** A reflective strip must **face the incoming light** (the wall side), not the camera (D35).

### 7.2 Setup the kit needs: C36, R11

- **Say:** "And the kit needs a flat wall to calibrate on, and a couple of seconds of empty room first."
- **Attach:**
  - This is the ST kit's open demo (README). The released R8 data arrived already background-subtracted.
  - Demo guidance: sensor less than 1 m from the wall; hidden object about 1–1.5 m from it; a matte, light-coloured
    wall; "direct sunlight on the wall will saturate the sensor". These are **demo numbers, not paper results**.
- **Never** repeat the authors' "no additional set-up" or "plug-and-play" framing without this caveat.
- **Price, if used:** "the authors put off-the-shelf hardware at under a hundred dollars" (C32).
  - Never "well under".
  - Never attach a price to the smartphone-grade device; its price is unknown.
  - The ~$50, ~$100 and "$10 sensor" figures refer to different scopes. Don't mix them.

### 7.3 The authors' separate ordinary-clothes test: C37, R1

- **Say:** "In a separate test, with a different device, the authors report tracking a person in ordinary clothes, no
  reflective material, with the sensor capturing thirty frames a second."
- **Attach:**
  - a separate test, not our kit clip;
  - the device is not named in the text; in the authors' own video it is visibly not the ST module, and is presumably
    their smartphone-grade device;
  - 30 frames a second is the **capture rate**, not computing time;
  - no accuracy figure was given, and the device data were not released.
- **Show** (v1 D09 wording):
  - "Reported by the authors: person in ordinary clothes · 30 frames/s capture"
  - "a separate test, not our kit clip · device data not released"
  - The picture is **our drawing** ("the authors' separate test · our drawing"). The authors' video and Nature
    Supplementary Video 1 are not cleared.
- **Never:**
  - stage this result on the kit sensor or the checker's tripod (D09);
  - "processed in real time", "instantly" or "computed at 30 fps".

### 7.4 Early-stage, no phone app, no safety evidence

| ID | Say | Attach / basis |
|---|---|---|
| C40 | "The researchers call it an early-stage research prototype. Range is short, dark or shiny walls are harder, bright sunlight swamps the sensor, and doing the maths fast on small hardware is still unsolved." | FAQ (search_summary): "early-stage research prototype"; open problems are longer ranges (several metres), harder environments, unpredictable or non-rigid motion, very low light, and real-time performance on mobile hardware. Dark, glossy and sunlit walls come from the kit README (direct). |
| C42 | "No ordinary phone can do this yet." | Lead-author press quotes; raw data are not exposed. |
| C41 | **Preferred:** "For now, it's a clue, not a safety system." **Alternative:** "Nobody has shown yet that it prevents collisions." | C41 records an absence of evidence, dated 8 Oct 2026, from two searches. The preferred wording rests only on the authors' "prototype" description. If the alternative is used, keep "yet". |

### 7.5 Reproduction: the narrower wording this production can support

**What we did** (`research/code_reproduction/NOTES.md`):

1. **On 8 October 2026 we ran the authors' unmodified scripts** on the authors' released data, on a CPU, from
   `github.com/sidsoma/consumer-nlos` at commit `15314de`. The scripts were `tracking.py` (three seeds),
   `reconstruction.py` and `cam_localization.py`.
2. **Results:**
   - The tracking run **matched the authors' saved estimates**: median 8.1 cm apart seen from above; correlation 0.97
     in x and 0.99 in z.
   - The U reconstruction **equals the authors' volume exactly**.
   - The sensor-locating run correlated with the saved values but sat a median 27 cm away. That is weak; don't cite it.
3. **What this shows and what it doesn't.** The released code and data are consistent with each other. It is **not** a
   new physical experiment. It is **not** an accuracy test, because no ground truth was released. It is **not**
   independent replication.
4. **What we searched, on 8 October 2026:**
   - 59 of the repository's 62 forks: none had new code, data or results. The 3 forks that GitHub's index doesn't list
     were unchecked.
   - Five differently worded web searches: none found a third-party report of results on its own hardware.
   - The issue tracker was unreadable from here, and its one open issue is unread.
   - The one outside contribution is a README build fix, with no results.
   - Evidence: `research/context/evidence/fork_ls_remote_2026-10-08.txt`.
5. **Logs.**
   - Committed: the per-run timing JSONs (`research/code_reproduction/out/*/timing_*.json`) and the figure JSONs with
     the comparison metrics.
   - **Not committed:** `stdout.log` and the `.npz` state files, which are ignored by git's `*.log` and `*.npz` rules.
     They exist only on disk in `research/code_reproduction/out/`. **Preserve them in the v2 backup if the "we ran their
     code" line stays.** The owner's brief asks for retained execution logs.

**Wording:**

- **Say:** "We re-ran their released code on their released data, and it matched their saved results. That checks the
  software. It isn't a new experiment."
- **Show:** "Our check: their code + their data → matched their saved results · not a new experiment"
- **Description:**
  > We re-ran the authors' released code (commit 15314de) on their released data on 8 October 2026; our tracking run
  > matched their saved estimates (median 8 cm apart) and the U reconstruction matched exactly. This checks the
  > released software, not the physical experiment, and is not an independent replication.
- **Optional, description only:**
  > As of 8 October 2026 we did not find published results from another group using its own hardware (we checked 59 of
  > the repository's 62 forks and ran five web searches).
- **Never:**
  - "independently verified", "we reproduced the experiment", "replicated" or "confirmed accurate";
  - a bare "no independent reproduction found" or "no one has reproduced it";
  - the v1 museum plaque "independent / reproduction" with an empty slot;
  - the v1 chip "code public · no independent reproduction found (Oct 2026)".

---

## 8. The warehouse: "potential use" (4:05–4:55)

**Basis (C39):** a proposed application.

- **IEEE Spectrum** mentions warehouse robots noticing movement before turning into an aisle (search_summary).
- **The project page** lists robots in cluttered spaces and cars at blind intersections.
- **It has not been demonstrated in any deployment.**
- **The same group** steered a robot in a lab corridor (ICRA 2025, X2). That is different hardware and a different
  paper. Don't merge it in; if it is mentioned, keep it separate and labelled.

**Say:** "One potential use: a delivery robot nearing a blind corner in a warehouse. With a suitable wall at the
junction, a sensor like this might give it an early hint that something is moving out of sight. Enough to say 'slow
down'. Not enough to say who's there." (C39, C19)

**Show:** **"potential use"** for the whole sequence, plus "illustration".

**Conditions the drawing must respect:**

1. **The bounce surface.** The bounce needs a surface that both the robot's sensor and the hidden aisle can see. Draw
   the wall spot, and route the light around the end of the corner, never through shelving.
2. **Range.** Today's range is short. The kit demo works with the sensor under 1 m from the wall and the object about
   1–1.5 m beyond it, and longer range is an open problem. **Don't put a range number on the robot.**
3. **The hint.** It is a coarse position estimate. Draw a blob, not a silhouette or an identity.
4. **Status.** Nothing has been tested in a warehouse, no robot uses it, and there is no collision evidence (section
   7.4).

**Never:**

- the robot "detects people", "identifies" anyone, or "stops automatically";
- "prevents collisions", "already used" or "safety system";
- a reaction-time or range number;
- any brand.

The bumper gag is comedy, not a claim; keep it only if it earns the beat.

---

## 9. v1 wording and pictures the writers must not repeat as is

| v1 place | v1 text or picture | Problem (source) | v2 |
|---|---|---|---|
| S1.3 label (storyboard draft) | "Real measurements · 2026" | Implies a 2026 capture; the capture predates October 2025 (OPENING_EVIDENCE §4) | "Real data · Nature 2026" |
| S1.3 board | Our re-run labelled only "processed with the authors' code" | Provenance (D13) | Use the stored estimate from index ≥ 4, or "authors' code, run by us" (§1.1) |
| S1.6 and S4.2 | "≈ 7 ns later" in S1; "8.85 ns" with a one-way "1.33 m" ruler in S4 | Different wall spots, not said; round trip not shown (D23) | §3.3: one spot, or name the spots; always state "there and back" |
| s08 | "Light travels about thirty centimetres in a nanosecond … So timing is distance" | Missing the round trip | §3.2 wording |
| S3.1 / S3.2 | 24 → 1 dot tally; 9:1 block card | Counted illustrations imply about 1:10 (D19, N05) | "not to scale · far weaker", or no counts |
| s15 board | Any printed "576×" | It is our measure for one zone; across zones it is 256–576× (N05) | "hundreds of times weaker (this capture)" |
| s27 | "about a second on a laptop" | Only valid paired with the ~7 min capture | Both or neither (§5) |
| s30 | "the small time-of-flight sensors … found in phones and gadgets" | Fine as a class, but no stock phone was used | Add "phone-grade research device, plus an off-the-shelf kit" |
| S6.3 picture | "10 × 10" printed on the device | Unsourced layout (D33) | "about 100 pixels" only |
| s35 | "Their method puts the motion to work" | Can read as handheld reconstruction; shape-building used known positions | §6.6 wording |
| S6.6 picture | Hand on the sensor in the "keep the sensor still" panel | Contradicts "held still" (N08) | Sensor on a stand |
| s36 | "under a hundred dollars" | OK as the authors' framing for off-the-shelf hardware only | Never "well under"; never for the research device |
| s38 picture | Reflective strip facing the camera | A retroreflector returns light toward its source (D35) | Strip faces the wall or light |
| s39 picture | Ordinary-clothes 30 frames/s result staged on our kit sensor | Breaks the number firewall (D09) | "our drawing", with a neutral "their sensor" |
| s39 and the museum | "we've found no other team reporting results on its own hardware yet"; plaque "independent / reproduction"; chip "code public · no independent reproduction found (Oct 2026)" | Broad absence claim; the owner asked for narrower wording | §7.5 |
| s44 | "No one has shown that it prevents collisions." | A broad absence claim | §7.4, preferred wording |
| Description | "Code and released data (MIT License)" | MIT covers the code; for the data it is ambiguous (N14) | "Code (MIT License) and released data" |
| Description | 30 frames per second attached to the kit clip | Firewall (D10) | Separate bullet for R1 only |
| Thumbnails A/B | Light drawn over the partition | Physics (D11) | Around the end, by the wall; thumb C's route |
| Anywhere | "4.7 cm accuracy"; "$50,000" / "$0.5–1 million" quotes; "sub-millimetre" (2012); "2012 invented it"; "outdoors" (2018, which was a retroreflective S); 2018 "real-time" (that was 3 Hz tracking) | Firewall (EXPERIMENT_RECORD §6; history notes §6) | Leave out |
| Anywhere | "fusion sharpens the estimate" for a moving person | Our illustration shows it avoids the smear but does not sharpen (I1) | "keeps up with him" |

---

## 10. Where each condition lives, so it isn't repeated as a caution card

| Result | Condition on screen beside it | Spoken | Description only |
|---|---|---|---|
| Opening track (R8) | "Real data · Somasundaram et al., Nature 2026 · ST sensor kit, held still" · "estimated position" · "sped up" | "their (or an) position estimate, not a photograph" | code run by us (if dot option (b)); clothing not recorded; frames not seconds; plot constants; mirrored; capture date and rate not stated |
| Raw waveform (R10) | "different sensor: 3×3 zones · centre zone" · "zoom ×250" · "hundreds of times weaker (this capture)" | "different sensor, different hidden object" | iter_22; our ratio measure (256–576×); raw counts |
| U reconstruction (R10) | "36 preset positions · object held still" · "rough outline" | "stepped through preset positions while the object stayed still" | authors' code run by us; build-up frames are partial sums |
| Our room (I1) | "simplified picture" (once) · "illustrative" on numbers | "simplified" once | layout and checks |
| Ordinary-clothes test (R1) | "Reported by the authors · person in ordinary clothes · 30 frames/s capture" · "a separate test, not our kit clip · device data not released" | "separate test, different device"; "capturing" | device not named |
| Reflective help (C34) | "reflective material: far more light straight back" | "many of their tests had help" | which experiments used it |
| Kit setup (C36) | "flat wall · empty-room scan first" | one line | demo guidance numbers |
| Our re-run | "their code + their data → matched · not a new experiment" | one line | date, commit, metrics, search scope |
| Warehouse (C39) | "potential use" throughout | "one potential use" | sources of the proposal |

---

## 11. Number firewall for v2 (a subset of EXPERIMENT_RECORD §6)

| Number | Belongs only to | Never attach to |
|---|---|---|
| 475 frames, 0.76 × 0.74 m, 8.1 cm median gap | R8 (the 8.1 cm is our re-run against the stored estimate) | accuracy; R1; the phone-grade device |
| 16 zones, 250 ps | the ST kit (R8, R9, R11) | the phone-grade device; the ams sensor |
| 30 frames/s capture | R1 (also reported for R2 and R3) | R8; processing time; the kit |
| 9 zones, 88 ps, 3.70 ns, 110.8 cm, 256–576×, 36 positions | R10 | R8; the person; our room |
| 6.4–8.9 ns; 8.85 ns / 2.65 m / 1.33 m; 7.16 ns; ±3.75 cm bands; region sizes; 0.86 m smear | I1 (our room) | any paper experiment |
| 1/380 to 1/6,000 | I1 estimate | any measurement |
| about 100 pixels | the smartphone-grade research device | the ST kit; the ams sensor |
| under US$100 | the authors' framing for off-the-shelf hardware | the smartphone-grade device |
| less than 1 m; 1–1.5 m; about 4 m round trip | R11 kit demo guidance | paper experiments; the warehouse robot |
| 1 s compute / 6.8 min capture; 68 min diffuse | H2 (2018) | "seeing in one second" |
| 5 fps, about 1 s latency, 700 mW | H3 (2021) | 2026 |
| 7 cm per frame random step (code); 5 cm prior (manuscript) | the tracking filter | accuracy |
| 4.7 cm | manuscript gantry patch only (unverified) | **do not use** |

---

## 12. Proposed additions to the claims ledger (not yet in `claims.csv`)

These statements appear above but are not covered, or not fully covered, by C01–C45. The ledger owner should add them
before the script locks. The IDs are provisional.

| Proposed | Statement | Source / status |
|---|---|---|
| P01 | "One unknown at a time": shape-building assumes a known pose and a static scene; tracking assumes a known shape; locating the sensor assumes a known, static hidden object. | arXiv 2605.17865 (search_summary); reported by authors |
| P02 | Filtered backprojection fails for moving objects because of motion blur. | Manuscript (search_summary); reported by authors |
| P03 | The tracking filter predicts, compares and keeps: about 1,000 guesses, a random step of 7 cm per frame (code), scored against each new frame and resampled. | `paper/train/*.py`, `configs/tracking.yaml` (code_or_data); experimentally supported |
| P04 | Short exposures, and the trade-off between sampling density and aperture size, are named obstacles. | Manuscript; Fig. 1 caption (search_summary); reported by authors |
| P05 | Handheld use was demonstrated only for locating the sensor, with a retroreflective patch. | R3; manuscript notes E7; reported by authors |
| P06 | The ams bump at 3.70 ns is 110.8 cm of extra path, about 55 cm each way, consistent with the reconstructed U about 0.54 m from the wall. | fig1/fig4 JSONs; derivation and inference |
| P07 | In R8, the echo delay ranges over 173–260 cm of extra path and follows the tracker's distance from the wall (r = 0.93). | fig2 JSON; code_or_data (our analysis) |
| P08 | Replaces C38: what we did (re-ran their code on their data, 8 Oct 2026, matched their saved results), plus the dated search scope. | code_reproduction notes; context notes; code_or_data and search_summary |
| P09 | Diffuse targets work but are "inherently worse". | Manuscript (search_summary); reported by authors |

---

## 13. Still unresolved (the script must not fill these in)

1. What the R8 walker wore. R8's capture rate and capture date.
2. The identity of the smartphone-grade device, how its raw data were accessed, its bin width and wavelength.
3. Supplementary Video 1's device, display, latency and accuracy.
4. The contents of the final article's Fig. 5. Any accuracy number in the final article.
5. The ams sensor's model.
6. The exact manuscript wording of the burst-photography and synthetic-aperture-radar explanation. Only the abstract's
   "inspired by" is confirmed.
7. The materials of the 2021 Callenberg et al. targets.
8. The licence of the released data (beyond the MIT licence for the code).

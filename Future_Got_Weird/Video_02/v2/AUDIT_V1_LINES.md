# Audit A: the 48 v1 narration lines against the v2 brief

Video 02, "How Cameras See Around Corners". Prepared 9 October 2026 for the v2 editorial pass. It governs nothing by
itself: `v2/REVISION_BRIEF.md` governs. This file only records what each v1 line is, what it does on screen, how its take
measures, and what v2 should do with it.

**Sources read:** `script/SCRIPT.md`, `script/narration_segments.json`, `script/narration_sections.json`,
`script/narration_selection.json`, `source/src/data/timeline.json`, `audio/narration/v2/eval_report.md` and `eval.json`,
`audio/narration/v2/manifest.json` and the per-line `sNN.wav` / `sNN.words.json`, `source/public/audio/narration.wav` (the
v1 narration stem), `storyboard/STORYBOARD.md`, `qa/scene_review/S1…S9/REPORT.md`, `qa/REVIEW_R3.md`, `STATUS.md`,
`research/claims.csv`, `research/OPENING_EVIDENCE.md`, `research/EXPERIMENT_RECORD.md`, `research/geometry/NOTES.md`,
`research/context/NOTES.md`, `research/history/NOTES.md`, and the scene source where an on-screen string mattered.

**Limits of this audit.**
- **Nobody has listened to the v1 narration.** `STATUS.md` says so, and this audit could not play audio either. Every
  take note below is a measurement, and every "keep verbatim" is conditional on the listening pass that the brief
  requires.
- **The eval score measures pace.** In `tools/v2_takes.py` the expressiveness terms (F0 range capped at 9 st, F0 SD capped
  at 3.5 st) saturate for every take, so the base is 10.0 for all of them. The score is then 10 − 0.08 × (articulation
  wpm − 205), plus 2 per designed beat that lands, minus level and pitch-drift penalties. A score under 10 almost always
  means "articulated faster than 205 wpm". "Articulation wpm" excludes pauses longer than 0.25 s. No selected take has a
  detected click (glitch count 0 everywhere), a clipped short word or an over-long word.
- **Timings.** Times are the measured speech spans in `timeline.json` (segment `from`/`to`, 30 fps). Pauses are acoustic
  silences measured on the v1 stem (10 ms RMS frames, threshold 38 dB below the 95th-percentile level). The aligner's
  word end times run into the following pause, so they are not used for pause lengths.

---

## 1. At a glance

- **v1:** 48 lines, 1,111 words, 404.01 s. Speech spans total 365.3 s, which is 182 wpm while speaking (the 182 includes
  pauses inside lines) and 165 wpm overall.
- **Recommendations:**

  | Action | Count | Lines |
  |---|---|---|
  | Keep verbatim (take reusable) | 23 | s02 s09 s11 s14 s15 s16 s18 s19 s20 s21 s22 s23 s25 s30 s31 s33 s34 s35 s40 s42 s43 s47 s48 |
  | Move verbatim | 1 | s37 (into the geometry sequence) |
  | Keep text, regenerate take | 1 | s41 |
  | Trim (the kept part cuts out of the v1 take at a clean pause) | 12 | s07 s10 s12 s13 s17 s24 s29 s32 s36 s39 s44 s46 |
  | Split and move (every sentence is reusable) | 1 | s38 |
  | Rewrite (new words, new take) | 4 | s03 s06 s08 (also moved) s28 |
  | Merge | 1 | s04 (into the hook's route and timing beat) |
  | Cut | 5 | s01 s05 s26 s27 s45 |

- **New copy needed** (about 140 words, about 46 s):
  - the hook's evidence and timing lines (rewrites of s03 and s06);
  - the hook's closing question;
  - s08's round-trip rewrite;
  - s28 compressed;
  - a question opening the consumer-hardware section;
  - one narrower "what this production did" sentence (replacing C38);
  - optionally, a short clause defining what is new in 2026;
  - a fresh take of s41.
- **Estimated v2 from these recommendations:** about **865 words** and about **5:10** of timeline. That includes a 2 s
  silent hide, a 3.5 s J4 hold and a 10 s end screen, but not extra evidence-viewing holds. With those holds it lands at
  about **5:15–5:25**, inside the brief's 5:15–5:45. About 707 words (229 s of speech) can come from v1 audio. This is a
  diagnostic, not a quota (section 4).
- **Problems this audit found beyond the brief's own list:**
  1. **"That dot is their position estimate" is not what v1 shows.** The opening board plots `ours_xz`, our run of the
     authors' code on their data, not the authors' stored estimate. `stored_xz` is in the same
     `src/data/evidence/tracking_topdown.json`. Either plot `stored_xz` in the hook, or say "a position estimate from
     their code" (s03).
  2. **"Not a photograph" is said four times** (the s03 board label, s24, s42, s46). The brief allows one clear statement.
  3. **The light's route is told three times:** s04, s05, and s13's "sensor, wall, person, wall, sensor".
  4. **Two illustrative delays appear.** S1.6 shows "≈ 7 ns" (wall spot W3) and S4 shows "≈ 8.9 ns" (W1). Both are
     correct, but v2 should run one example, the 8.9 ns / 2.65 m / 1.33 m chain the brief names (s06, s18).
  5. **The conditions for both results arrive together afterwards** in s38, as a caution block, instead of beside the
     result each one qualifies.
  6. **Two broad negatives.** C38 ("no independent reproduction") must be narrowed, per the brief. C41 ("no one has
     shown it prevents collisions") is the same kind of absence-of-evidence claim and is easily dropped (s44).
  7. **s41 is the fastest line in the film** (272 wpm articulated; all four takes are rushed), and it carries the
     application hedge.
  8. **The bridge never says what is new in 2026.** s29 already credits a cheap-sensor tracker in 2021, so s30's "tried
     the small sensors" no longer separates 2026 from that precedent.

---

## 2. Summary table

The v2 sections follow the brief's chain of questions:

| Code | Section | Brief's question |
|---|---|---|
| **A** | Hook, 0:00–0:30 | Q1: how can the sensor recover what it cannot see? |
| **B** | Why a wall works | Q2: what survives after light scatters? |
| **C** | Weak late echo and the real waveform | |
| **D** | Delay → location, and the real reconstruction | Q3: how does time become a location? |
| **E** | History bridge, 20–30 s | |
| **F** | Consumer hardware and motion-aware fusion | Q4: why did a cheaper sensor make the problem harder? |
| **G** | Application and limits | Q5: what can it do, and where does it fail? |
| **H** | Takeaway, callback, end screen | |

Column notes:
- **Gap after** is measured silence to the next line, with the designed `pause_after_ms` in brackets.
- **Take** is the selected take, its score and its rank among 4.
- **Carries:** ★ marks a claim whose meaning must survive in v2. Details are in section 5.

| Line | v1 time | Speech s | Words | Gap after (designed) | Take | v2 action | v2 place | Carries |
|---|---|---|---|---|---|---|---|---|
| s01 | 0:00.5 | 4.10 | 15 | 0.67 (0.65) | x01_t3 8.94 #1 | **Cut** (hide stays as picture) | A, visual | — |
| s02 | 0:05.3 | 3.57 | 12 | 0.53 (0.30) | x01_t3 8.07 #1 | **Keep** | A, first line | ★C01 |
| s03 | 0:09.4 | 10.50 | 28 | 1.10 (1.10) | x01_t3 12.0 #2 | **Rewrite** | A | ★C02 ★C03 (+★C19 once) |
| s04 | 0:21.0 | 6.60 | 24 | 0.57 (0.35) | x02_t4 6.40 #1 | **Merge** (C04 clause) | A | ★C04 |
| s05 | 0:28.2 | 9.10 | 25 | 0.33 (0.35) | x02_t4 9.77 #2 | **Cut** | — | C04/C05/C43 carried elsewhere |
| s06 | 0:37.6 | 6.63 | 24 | 0.43 (0.30) | x03_t3 6.22 #1 | **Rewrite** (undercut reusable) | A | ★C06 |
| s07 | 0:44.7 | 6.13 | 19 | 0.57 (0.30) | x03_t3 9.27 #2 | **Trim** | A, 0:24–0:30 | ★C07 |
| s08 | 0:51.4 | 8.97 | 28 | 0.90 (0.90) | x03_t3 10.0 #3 | **Rewrite + move** | D | ★C06 + round trip |
| s09 | 1:01.2 | 3.27 | 12 | 0.53 (0.30) | x04_t1 4.34 #2 | **Keep** (listen: fast) | B, opener | — |
| s10 | 1:05.0 | 7.60 | 25 | 0.80 (0.80) | x04_t1 10.5 #1 | **Trim** | B | C08 (visual) |
| s11 | 1:13.4 | 7.83 | 26 | 0.57 (0.40) | x05_t4 8.96 #1 | **Keep** | B | ★C09 |
| s12 | 1:21.8 | 13.53 | 38 | 0.80 (0.80) | x05_t4 12.0 #4 | **Trim** (postcard out) | B, close | ★C10 |
| s13 | 1:36.2 | 9.67 | 21 | 0.43 (0.35) | x06_t1 10.0 #1 | **Trim** | C, opener | ★C11 (C05) |
| s14 | 1:46.3 | 6.50 | 18 | 0.37 (0.35) | x06_t1 10.0 #1 | **Keep** | C | ★C11 |
| s15 | 1:53.1 | 13.33 | 40 | 0.50 (0.40) | x07_t2 9.46 #1 | **Keep** | C | ★C12 |
| s16 | 2:07.0 | 4.30 | 14 | 0.90 (0.90) | x07_t2 8.67 #2 | **Keep** | C→D bridge | ★C06 |
| s17 | 2:12.2 | 9.13 | 26 | 0.47 (0.30) | x08_t1 10.0 #1 | **Trim** | D, opener | ★C13 |
| s18 | 2:21.8 | 6.00 | 20 | 0.50 (0.30) | x08_t1 9.33 #4 | **Keep** | D | ★C14 |
| s19 | 2:28.3 | 3.50 | 14 | 0.90 (0.90) | x08_t1 5.40 #1 | **Keep** (listen: fast) | D | ★C14 |
| s20 | 2:32.7 | 7.67 | 22 | 1.00 (1.00) | x09_t1 11.93 #1 | **Keep** | D | ★C15 |
| s21 | 2:41.3 | 5.90 | 21 | 0.43 (0.30) | x09_t1 9.24 #2 | **Keep** | D | ★C16 |
| s22 | 2:47.7 | 5.13 | 18 | 0.33 (0.35) | x09_t1 8.06 #2 | **Keep** | D | ★C17 |
| s23 | 2:53.1 | 10.47 | 30 | 0.60 (0.30) | x10_t1 10.0 #1 | **Keep** | D | ★C18 |
| s24 | 3:04.2 | 4.90 | 15 | 1.00 (1.00) | x10_t1 10.0 #1 | **Trim** ("Not a photograph." out) | D | ★C19 |
| s25 | 3:10.1 | 7.57 | 23 | 0.53 (0.30) | x11_t4 10.0 #3 | **Keep** | E, opener | C20 |
| s26 | 3:18.2 | 4.90 | 15 | 0.33 (0.35) | x11_t4 10.0 #2 | **Cut** | — | C21 dropped |
| s27 | 3:23.4 | 14.93 | 41 | 0.53 (0.35) | x12_t4 10.0 #4 | **Cut** | — | C22/C23 dropped |
| s28 | 3:38.9 | 10.73 | 28 | 0.43 (0.30) | x12_t4 10.0 #4 | **Rewrite** (compress) | E | C24 (no fps) |
| s29 | 3:50.1 | 6.30 | 18 | 0.80 (0.80) | x12_t4 9.12 #1 | **Trim** ("Impressive." out) | E | ★C25 ★C45 |
| s30 | 3:57.2 | 9.93 | 26 | 0.53 (0.30) | x13_t4 10.0 #4 | **Keep** (+ what's new) | E, close | ★C26 ★C27 |
| s31 | 4:07.6 | 4.33 | 16 | 0.60 (0.35) | x13_t4 6.42 #1 | **Keep** (listen: fast) | F, opener | ★C42 |
| s32 | 4:12.6 | 12.30 | 33 | 0.40 (0.40) | x13_t4 10.0 #3 | **Trim** + new Q4 line | F | ★C28 |
| s33 | 4:25.3 | 6.57 | 18 | 0.53 (0.30) | x14_t1 10.0 #1 | **Keep** | F | ★C29 ★C44 |
| s34 | 4:32.4 | 8.47 | 23 | 0.30 (0.30) | x14_t1 10.0 #1 | **Keep** | F | ★C30 |
| s35 | 4:41.1 | 11.83 | 37 | 0.63 (0.50) | x15_t1 8.99 #3 | **Keep** | F | ★C30 ★C31 ★C35 |
| s36 | 4:53.6 | 12.10 | 39 | 0.37 (0.35) | x15_t1 9.23 #1 | **Trim** + new sentence 2 | F | ★C02 ★C32 (+ reprocessing ≠ replication) |
| s37 | 5:06.1 | 5.67 | 18 | 0.90 (0.90) | x16_t3 10.0 #3 | **Move verbatim** | D, close | ★C33 ★C35 ★C12 |
| s38 | 5:12.6 | 13.60 | 45 | 0.30 (0.30) | x16_t3 7.77 #1 | **Split + move** beside s36 | F | ★C34 ★C36 ★C02 |
| s39 | 5:26.5 | 11.33 | 36 | 0.90 (0.90) | x17_t2 9.90 #1 | **Trim** (sentence 2 out) | F, close | ★C37 (C38 replaced) |
| s40 | 5:38.8 | 4.87 | 15 | 0.47 (0.30) | x18_t3 9.89 #3 | **Keep** | G, opener | ★C39 |
| s41 | 5:44.1 | 5.20 | 22 | 0.57 (0.30) | x18_t3 4.67 #1 | **Keep text, regenerate** | G | ★C39 |
| s42 | 5:49.9 | 4.80 | 15 | 0.33 (0.35) | x18_t3 8.65 #2 | **Keep** | G | ★C19 ★C39 |
| s43 | 5:55.0 | 11.00 | 26 | 0.47 (0.30) | x19_t1 10.0 #1 | **Keep** | G | ★C40 |
| s44 | 6:06.5 | 5.60 | 18 | 0.90 (0.90) | x19_t1 8.70 #1 | **Trim** (C41 sentence out) | G, close | C41 optional |
| s45 | 6:13.0 | 1.83 | 7 | 0.50 (0.50) | x20_t1 6.25 #4 | **Cut** | — | — |
| s46 | 6:15.3 | 7.37 | 28 | 0.60 (0.60) | x20_t1 6.94 #1 | **Trim** to the takeaway | H | (C04/C19 in spirit) |
| s47 | 6:23.3 | 3.00 | 10 | 5.30 (5.30) | x20_t1 9.92 #1 | **Keep**; hold 5.3 → ~3.5 s | H | ★C04 |
| s48 | 6:31.6 | 6.77 | 19 | 5.67 to end | x21_t4 8.61 #1 | **Keep** over the end screen | H | — |

---

## 3. Line by line

Each entry gives: the line's text; its timing; the take's measurements; what the picture does in v1 (from the
storyboard and the scene director reports); the v2 recommendation and its reason in the brief; and the claims it carries.

**Reusing part of a line.** File times refer to the per-line take files `audio/narration/v2/sNN.wav`. Each listed cut sits
inside a measured silence, accurate to about ±0.03 s, and was checked against the take's own waveform. Cut inside the
silence and keep the breath.

### v1 S1, cold open (0:00–1:01)

#### s01
0:00.53–0:04.63 · 4.10 s speech · 15 words · then 0.67 s

> Our friend here is hiding behind a partition, and he is very pleased about it.

- **Take:** x01_t3, score 8.94, best of 4. 218 wpm articulated, no internal pause, F0 141 Hz.
- **Picture (S1.1):** a locked wide room view at tilt 0. The guesser tiptoes in from the right and settles smug (J1;
  smug exhale on "pleased"). The checker's dashed sight line stops at the partition with an X. This is the R1 Runway
  window; no insert was accepted.
- **v2: cut the line.** The hide becomes a silent beat of about 2 s (the settle and the blocked sight line), under or
  just before s02.
- **Why:** the brief wants the obstruction established in 3–4 s with only a brief character reaction, and not the whole
  setup in one wide composition. The joke works without words.
- **Claims:** none.

#### s02
0:05.30–0:08.87 · 3.57 s · 12 words · then 0.53 s (designed 0.30)

> That sensor can't see him. It's pointed at a plain, blank wall.

- **Take:** x01_t3, 8.07, clearly the best (the others score 5.9–6.1). 226 wpm articulated, 0.35 s pause after "him.",
  F0 179 Hz.
- **Picture (S1.2):** an 8% push to the sensor. The checker taps it and the readout blinks on. A pale field-of-view wedge
  appears, with a lit patch on the wall; he wiggles an eyebrow.
- **v2: keep verbatim** as the first spoken line. The take is reusable as is.
  - It is almost word for word the brief's suggested first sentences ("This sensor can't see him. It's pointed at a
    wall.").
  - If the hook is regenerated as one block for continuity (the brief prefers coherent blocks), keep this wording and
    hold the v1 take as the fallback.
  - Picture: cut to the sensor-facing or overhead view with `sensor` and `blocked` (brief, 0:00–0:04). "Him" is the
    cartoon character.
- **Claims:** ★C01.

#### s03
0:09.40–0:19.90 · 10.50 s · 28 words · then 1.10 s

> And yet this is real data, from a study published in 2026: seen from above, a small sensor aimed at a wall, tracking someone it never saw directly.

- **Take:** x01_t3, 12.0 (the designed beat landed; tied with t2 and t4). 187 wpm. Pauses: 0.65 s on "And yet…" and
  0.53 s after "2026:". The line is long because of its pauses.
- **Picture (S1.3):** the readout swings up into a full-screen taped evidence board of the R8 data, mirrored. It shows the
  wall points, the sensor, the partition, and the estimated position moving with a trail.
  - Frame counter: "frame N of 475".
  - Headline: "Real measurements · published 2026".
  - A three-line conditions box: "authors' released data / evaluation-kit sensor, held still / authors' code, run by
    us".
  - Fine print: "frame numbers, not seconds" and "what the person wore: not documented". Label: "a position estimate,
    not an image".
  - A hard cut back: the guesser freezes mid-smirk.
- **v2: rewrite** as the evidence beat (brief, 0:04–0:11). Along the brief's lines: "Yet researchers used light bouncing
  off that wall to track someone hidden around the corner. That dot is a position estimate, not a photograph." (about
  24 words, about 8 s.)
- **Why:** the brief keeps the real result but makes the estimate the dominant feature, with short labels (`sensor`,
  `blocked`, `estimated position`) and one compact source line. The frame counter, the code details and the fuller
  provenance move to the later evidence beat (s36) and the description. "Seen from above" becomes a label.
- **Accuracy guards for the rewrite:**
  1. v1 plots `ours_xz`. "**Their** position estimate" is true only if the hook plots `stored_xz` (the authors' particle
     means, same file; median 8.1 cm from ours). Otherwise say "an estimate from their own code".
  2. Say "published 2026", never "captured" or "measured" in 2026 (C03; the capture is no later than September 2025).
  3. "Someone" is supported (the dataset is `st_spad_person_tracking`, and the authors' video shows a person). "Him"
     stays with the cartoon (brief).
  4. No "live", "real time", seconds or "30 frames a second": this dataset's capture rate is unresolved. Without the
     frame counter, add a small "replay" tag to the source line so the dot's pace isn't read as real time.
  5. No "ordinary clothes": the clothing is undocumented.
- **Claims:** ★C02, ★C03. The film's single "not a photograph" (★C19) moves here.

#### s04
0:21.00–0:27.60 · 6.60 s · 24 words · then 0.57 s (designed 0.35)

> Here's the trick for seeing around corners. The light doesn't go through the partition. It goes around the end, by way of the wall.

- **Take:** x02_t4, 6.40, best of 4 (all four score 6.1–6.4). The low score is pace: 248 wpm articulated, the fastest
  line in S1. Sentence pauses of 0.39 and 0.38 s.
- **Picture (S1.4):** the camera rises and the "seen from above" plan card comes in. A ghost straight line hits the
  partition ("blocked", thunk). A dashed route runs sensor → wall → through the "gap" at the far end → him; he relaxes,
  then looks worried.
  - Limitation from the reviews: in the room view the wall-to-him leg can read as passing over the corner. The "gap"
    label and the plan card carry "around the end".
- **v2: merge into the hook's route and timing beat** (brief, 0:11–0:18).
  - "Here's the trick for seeing around corners" goes; the brief's "The trick is timing" replaces it.
  - Keep C04 in one short clause. The fragment "It goes around the end, by way of the wall." is reusable (file
    4.68–6.66 s, 2.0 s), or its words can go into the new s06 line.
  - Draw the route full frame on the overhead schematic. The brief does not want the room and a small card read at the
    same time.
- **Claims:** ★C04. No ray through the partition, in the picture always, and in at most 10 spoken words.

#### s05
0:28.17–0:37.27 · 9.10 s · 25 words · then 0.33 s

> The sensor fires a short, invisible flash. The wall scatters it, part reaches the hidden person, and a tiny bit bounces back: wall, then sensor.

- **Take:** x02_t4, 9.77 (second; t1 10.0). 208 wpm.
- **Picture (S1.5):** a slowed pulse with scatter fans at the wall and at him; later legs thinner and paler; chips
  "slowed down" and "invisible flash (shown for clarity)".
- **v2: cut.**
- **Why:** this is the second of three tellings of the route (s04, s05, s13), and the brief asks not to restart
  explanations. In v2 the route is shown once, on the hook's schematic, and "a tiny bit bounces back" is carried in
  section C by s13-trim and s14. "Invisible flash" (C43) can stay as a chip on the pulse.
- **Claims:** C04 (through s04), C05 (folded into C11's wording), C43 (optional, on screen).

#### s06
0:37.60–0:44.23 · 6.63 s · 24 words · then 0.43 s

> That trip is longer than a quick bounce off the wall, so it arrives a little later. A few billionths of a second later.

- **Take:** x03_t3, 6.22, best of 4 (pace: 242 wpm). F0 133 Hz, the lowest in the film (2.8 st below the median), so
  check any splice next to a brighter line.
- **Picture (S1.6):** the camera pans aside to an arrival timeline card. The teal wall echo lands first, the saffron
  echo "≈ 7 ns later · illustrative" (wall spot W3, 7.16 ns).
- **v2: rewrite** as the hook's timing line (brief, 0:18–0:24), e.g. "The trick is timing: light that visits him takes
  longer to come back."
  - Then keep the dry undercut "A few billionths of a second later." It is the slightly amused contrast the brief asks
    for, and it is reusable (file 4.61–6.69 s, 2.1 s; 0.41 s pause before it) if it splices cleanly.
  - The timeline fills the frame: early wall return, later hidden return.
- **Number guard:** S1.6 shows ≈ 7 ns (W3) and S4 shows ≈ 8.9 ns (W1). Either drop the number from the hook timeline,
  or run the hook from W1, so one illustrative example (8.9 ns / 2.65 m / 1.33 m) runs through the film.
- **Claims:** ★C06.

#### s07
0:44.67–0:50.80 · 6.13 s · 19 words · then 0.57 s (designed 0.30)

> Your webcam can't time that. This takes a time-of-flight sensor, a camera that clocks its own light's round trip.

- **Take:** x03_t3, 9.27 (second, 0.03 behind t2). 214 wpm; 0.44 s pause after "that.".
- **Picture (S1.6, continued):** a webcam inset with a spinning "?", a shrug and a sad blip. It is replaced by the sensor
  close-up (two windows, a stopwatch) with "time-of-flight sensor: times its own light's round trip"; the real sensor is
  ringed.
- **v2: trim, and keep it in the hook** at 0:24–0:30: "This takes a time-of-flight sensor, a camera that clocks its own
  light's round trip." (Reusable: file 1.95–6.23 s, 4.3 s.)
- **Why:** the brief wants the timing sensor in close-up by 0:30 (acceptance Q2). The webcam gag costs about 2.2 s;
  keep it only if the hook has room. "Round trip" also prepares the round-trip rule in D.
- **Claims:** ★C07.

#### s08
0:51.37–1:00.33 · 8.97 s · 28 words · then 0.90 s (scene end)

> Light travels about thirty centimetres in a nanosecond, one billionth of a second. So timing is distance, and the extra delay is a clue to where he is.

- **Take:** x03_t3, 10.0 (no penalties). 204 wpm.
- **Picture (S1.7):** a ruler card, "1 nanosecond ≈ 30 cm ≈ 1 ft", with a pulse along it. The detour wall → him → wall is
  drawn out and back with a tick for each nanosecond of path, and "extra delay → extra distance"; he glances at the wall.
- **v2: rewrite and move to D,** after s17-trim, where the delay becomes a distance. For example: "Each nanosecond of
  extra delay is about thirty centimetres of extra path. But it goes out and back, so that's fifteen centimetres
  farther away."
- **Why:**
  - The hook now ends on "how do you turn a tiny delay into a location?", and the answer belongs with the arcs.
  - The brief requires the round-trip distinction: about 30 cm of path per nanosecond is not 30 cm of one-way distance.
    v1 made it only on screen (S4: "≈ 8.9 ns → ≈ 2.65 m there and back → 1.33 m each way").
  - "One billionth of a second" repeats s06.
- **Claims:** ★C06, with the round trip (brief: 2|S−W| + 2|W−H|; the hidden distance is half the extra path).

### v1 S2, the wall relays information (1:01–1:36)

#### s09
1:01.23–1:04.50 · 3.27 s · 12 words · then 0.53 s (designed 0.30)

> Why does a plain wall work at all? Start with a mirror.

- **Take:** x04_t1, 4.34 (second; t4 5.68 has the same words). 271 wpm articulated; 0.53 s pause after "all?". It
  measures fast, so listen before reusing.
- **Picture (S2.1):** a bench close-up. A painted panel; a torch lights a patch. The mirror slides in, tings, and the
  torch swivels to it.
- **v2: keep verbatim** as B's opening question; it opens the brief's Q2 and is answered by s12-trim. If it sounds
  rushed, regenerate it in the B block.
- **Claims:** none.

#### s10
1:05.03–1:12.63 · 7.60 s · 25 words · then 0.80 s (J2 hold)

> Light leaves a mirror at the same angle it arrived, so the picture stays whole. Put a mirror here, and our friend is simply visible.

- **Take:** x04_t1, 10.5 (best; the "here…" beat is 0.22 s). 224 wpm; 0.52 s pause after "whole.".
- **Picture:**
  - S2.1: "in = out" angle marks; a postcard bundle reflects whole.
  - S2.2: cut to the raised room. A mirror slides onto the wall at x 1.9–2.6 m; a pulse runs sensor → mirror → him; the
    reflection shows his back. He ducks on "visible" (J2).
- **v2: trim** to "Put a mirror here, and our friend is simply visible." (Reusable: file 4.55–7.81 s, 3.3 s.) Cut the
  hold after it from 0.8 to about 0.5 s, with the duck.
- **Why:** the brief keeps only the strongest mirror-to-scatter comparison, in roughly 10–15 s. The gag makes the
  mirror's point by itself, and gives the hiding character an active role.
- **Claims:** C08 becomes visual only (the in = out marks can stay as a one-second graphic).

#### s11
1:13.43–1:21.27 · 7.83 s · 26 words · then 0.57 s (designed 0.40)

> A painted wall is rough up close. It throws light every which way, so each spot acts less like a mirror, more like a tiny lamp.

- **Take:** x05_t4, 8.96 (best). 218 wpm; 0.36 s pause after "close.".
- **Picture (S2.3):** the mirror slides off and he stands up, relieved. A magnifier irises into a paint cross-section;
  one ray sprays out every which way; neighbouring spots spray too; a ghost mirror ray appears; "tiny lamp" waves.
- **v2: keep verbatim.** It is the scatter half of the comparison.
- **Claims:** ★C09.

#### s12
1:21.83–1:35.37 · 13.53 s · 38 words · then 0.80 s (scene end)

> You might picture his image as a postcard shredded into confetti, waiting to be sorted. It's worse than that. Confetti still holds bits of picture. Everything coming back is a blend of many paths. What survives is timing.

- **Take:** x05_t4, 12.0 (the "paths…" beat landed at 0.60 s). 199 wpm; sentence pauses 0.50, 0.38 and 0.46 s.
- **Picture (S2.4):** a postcard falls in (chip "metaphor"), shreds and piles up. Cut to the raised room with a confetti
  inset. Three paths, from his head, shoulder and feet, go via three wall spots and merge into one blip at the sensor;
  the blip drops into timing bars; "what survives: timing".
- **v2: trim** to "Everything coming back is a blend of many paths… What survives is timing." (Reusable: file
  8.98–14.01 s, 5.0 s.)
- **Why:** the postcard is set up and then retracted ("It's worse than that"), spending about 8.5 s on a picture the
  viewer must then discard. The brief keeps it only if it helps after listening. The three-paths-into-one-blip visual
  answers Q2 directly. Revisit only if the listening pass finds the metaphor works better.
- **Claims:** ★C10.

### v1 S3, the faint echo (1:36–2:12)

#### s13
1:36.17–1:45.83 · 9.67 s · 21 words · then 0.43 s

> Follow the path that matters: sensor, wall, person, wall, sensor. Each bounce spreads the light, and most of it is lost.

- **Take:** x06_t1, 10.0. 187 wpm articulated, but the slowest line by span (130 wpm): its six designed pauses in the
  five-stop rhythm run 0.42–0.51 s each, 2.8 s in total.
- **Picture (S3.1):** a push in on the raised room. 24 dots travel the five stops with rings, and are lost 24 → 8 → 3 → 1;
  a tally card reads "light still on the path"; stop tags; "slowed down · illustrative".
- **v2: trim** to "Each bounce spreads the light, and most of it is lost." (Reusable: file 6.85–9.71 s, 2.9 s.) It opens
  C.
- **Why:**
  - This is the third telling of the route, and the brief merges the multiple-bounce, weak-return beat into the timing
    and evidence sequence.
  - Keep the S → W → H → W → S stops as labels on the one schematic: that is the confocal route the brief asks to make
    explicit.
- **Claims:** ★C11 (C05 folds in).

#### s14
1:46.27–1:52.77 · 6.50 s · 18 words · then 0.37 s

> Nearly everything coming back bounced once, off the wall. Our friend's echo bounced three times, so it's tiny.

- **Take:** x06_t1, 10.0 (best). 181 wpm; 0.54 s pause after "wall.".
- **Picture (S3.2):** an "arrivals at the sensor" card (illustrative). Nine teal blocks fill one slot ("1 bounce · wall");
  one late saffron block lands ("3 bounces · him") and is ringed on "tiny".
- **v2: keep verbatim.** It is the brief's "hidden contribution arriving later and weaker". Draw it on the timeline the
  hook already built, as one visual comparison, then hand that timeline to the real waveform.
- **Claims:** ★C11.

#### s15
1:53.13–2:06.47 · 13.33 s · 40 words · then 0.50 s

> This is real data from the same team, with a different sensor and hidden object: the wall's big echo, then, a few nanoseconds later, a bump you have to zoom in to see. In this capture, hundreds of times weaker.

- **Take:** x07_t2, 9.46 (best). 212 wpm; pauses 0.50 s ("object:"), 0.40 and 0.42 s.
- **Picture (S3.3):** an evidence board of the R10 ams data (centre zone, linear axis).
  - Headline "Real measurements"; chip "same team · a different sensor (3×3 zones) and hidden object"; a 3×3 icon.
  - The curve draws to the wall spike, then the flat tail. A magnifier stretches from ×1 to ×250 with the factor shown;
    "hundreds of times weaker (this capture)".
  - Known issue: the axes stay empty for about 4.5 s while the chips build.
- **v2: keep verbatim.** The wording was claim-checked: it names the different sensor and object, and limits the ratio to
  this capture, as the brief requires.
  - Picture: data on screen from "This", with no blank-axis build. Identify the wall peak, enlarge the weak component,
    and connect it to the earlier route (brief, 1:54–2:13).
- **Claims:** ★C12. The sensor and capture distinction must survive.

#### s16
2:06.97–2:11.27 · 4.30 s · 14 words · then 0.90 s (scene end)

> That bump is the clue. Its timing says how much farther the light travelled.

- **Take:** x07_t2, 8.67 (second, 0.07 behind t1). 221 wpm; 0.47 s pause after "clue.".
- **Picture:** the bump is ringed; a "3.7 ns" dimension line; "≈ 1.1 m extra path · 3.7 ns × 30 cm per ns". That is path,
  out and back, so it is consistent with the round-trip rule.
- **v2: keep verbatim** as the bridge from C to D.
  - Cut the gap from 0.9 to about 0.5 s with a match transition from the bump to the wall spot or arc centre, in the
    style of the brief's example transitions.
  - The brief's forward question ("That gives a distance. But a distance from where?") can follow if the turn needs it.
- **Claims:** ★C06.

### v1 S4, timing becomes geometry (2:12–3:10)

#### s17
2:12.17–2:21.30 · 9.13 s · 26 words · then 0.47 s (designed 0.30)

> Let's turn timing into a map: the room from above, flattened, with one more simplification. The sensor flashes and listens at one spot on the wall.

- **Take:** x08_t1, 10.0 (best). 204 wpm; pauses 0.46 s ("map:") and 0.45 s ("simplification.").
- **Picture (S4.1):** the signature fold: the room folds into the plan view and the people become tokens; W1 lights.
  Chips: "simplified picture (2D)" and "flashes and listens at one spot".
- **v2: trim** to "The sensor flashes and listens at one spot on the wall." (Reusable: file 6.29–9.18 s, 2.9 s.)
- **Why:** "Let's turn timing into a map" restates the hook's question, and "from above, flattened" is what the fold
  shows. The simplification must still be declared on screen ("simplified: sends and listens at the same spot") with the
  S → W → H → W → S route. The brief asks to establish whether the diagram is confocal.
- **Claims:** ★C13.

#### s18
2:21.77–2:27.77 · 6.00 s · 20 words · then 0.50 s (designed 0.30)

> Measure the extra delay, and you know how far he is from that spot. Not which direction. Just how far.

- **Take:** x08_t1, 9.33 (fourth of 4, but within 0.3 of the best; kept for section continuity). 235 wpm; the
  "direction…" beat is 0.33 s.
- **Picture (S4.2):** "extra delay here ≈ 8.9 ns" → "≈ 2.65 m there and back" → a ruler swings out from W1 with "1.33 m
  each way"; a "which way?" waver; the arc sweeps.
- **v2: keep verbatim,** right after the s08 rewrite that states the out-and-back rule. Keep the on-screen chain. It is
  the brief's example, and it adds up: 2 × 1.327 m = 2.654 m = 8.85 ns × 29.98 cm/ns.
- **Claims:** ★C14.

#### s19
2:28.27–2:31.77 · 3.50 s · 14 words · then 0.90 s (J3a)

> He could be anywhere on this arc, all the same distance from that spot.

- **Take:** x08_t1, 5.40, best of 4. All four are fast (262 wpm articulated); listen for rush.
- **Picture:** faint copies of him along the arc; the ruler taps three of them; a face inset shows him relax and lean
  (J3a).
- **v2: keep verbatim.** It is the brief's "one measurement → many possible positions", and the guesser reacts to the
  estimate. Cut the hold from 0.9 to about 0.6 s and let the lean run under the next line.
- **Claims:** ★C14.

#### s20
2:32.67–2:40.33 · 7.67 s · 22 words · then 1.00 s (J3b)

> Now listen at a second spot. Another delay, another arc. On this side of the wall, they cross in just one place.

- **Take:** x09_t1, 11.93 (best; the "just…" beat is 0.32 s). 206 wpm.
- **Picture (S4.3):** W4, a second ruler, a second arc. The camera rises (CAM_BACK) to show the other crossing behind
  the wall, greyed out ("behind the wall: impossible"). A ring lands on him and his smile drops (J3b).
- **v2: keep verbatim** ("another measurement → fewer candidates"). Cut the hold from 1.0 to about 0.7 s.
  - The brief asks to reduce repeated ruler rotations: one swing per arc is enough. Drop the extra camera rise if the
    mirror crossing can be shown in frame.
- **Claims:** ★C15.

#### s21
2:41.33–2:47.23 · 5.90 s · 21 words · then 0.43 s

> Measured timings are a bit fuzzy, so each arc is really a band, and the bands overlap in a small patch.

- **Take:** x09_t1, 9.24 (second; t3 9.71). 215 wpm.
- **Picture (S4.4):** each arc splits into three faint arcs, then thickens into a ±3.75 cm band ("illustrative band");
  the overlap patch fills and is ringed.
- **v2: keep verbatim.** It is the uncertainty step of the brief's chain.
- **Claims:** ★C16.

#### s22
2:47.67–2:52.80 · 5.13 s · 18 words · then 0.33 s

> These two spots are close, so the patch is long and blurry. Spread them out, and it shrinks.

- **Take:** x09_t1, 8.06 (second, by 0.01). 229 wpm.
- **Picture (S4.5):** the spots slide together (W2, W3) and the patch grows long; they slide apart (W1, W4) and it
  shrinks; "close → long and blurry" / "spread out → smaller".
- **v2: keep verbatim.** It is the rule that makes motion-aware fusion readable later (s35, "the listening spots spread
  out"). Without it, section F has to re-explain. If D runs long, shorten the picture under it rather than cut it.
- **Claims:** ★C17.

#### s23
2:53.13–3:03.60 · 10.47 s · 30 words · then 0.60 s (designed 0.30)

> In practice, a computer weighs many spots at once, trying positions and keeping those whose predicted echoes match. It also leans on assumptions, like what kind of object it's after.

- **Take:** x10_t1, 10.0 (best). 188 wpm; 0.55 s pause after "match.".
- **Picture (S4.6):** four spots flash; 222 seeded candidate dots scatter; a "measured vs predicted" card of echo-time
  ticks marks a miss and a match; poor matches fade; a dashed ring reads "assumption: one small object".
- **v2: keep verbatim.** The brief: one measurement constrains, and several measurements plus reconstruction
  assumptions narrow the candidates. The particles explain something; trim the redundant stages around them.
- **Claims:** ★C18.

#### s24
3:04.20–3:09.10 · 4.90 s · 15 words · then 1.00 s (scene end)

> That's why the answer is a likely location, or a rough shape. Not a photograph.

- **Take:** x10_t1, 10.0 (best). 200 wpm; 0.39 s pause after "shape.".
- **Picture (S4.7):** the cluster settles into the likely-location blob (it reads as a thin leaf, a noted limitation);
  labels "likely location · rough shape · not a photograph"; a photo frame is crossed out (on screen only about 0.8 s).
- **v2: trim** to "That's why the answer is a likely location, or a rough shape." (Reusable: file 0.06–3.68 s, 3.6 s.)
  Cut straight to s37, moved here: "rough shape" leads into the real U.
- **Why:** "Not a photograph" is said once, in the hook (brief: one clear explanation, not a repeated disclaimer).
- **Claims:** ★C19.

### v1 S5, what came before (3:10–3:57)

#### s25
3:10.10–3:17.67 · 7.57 s · 23 words · then 0.53 s

> None of this is brand new. In 2012, an MIT team reported recovering the 3D shape of a small mannequin around a corner.

- **Take:** x11_t4, 10.0 (no penalties). 194 wpm; 0.45 s pause after "new.".
- **Picture (S5.1):** the plan sheet rolls up onto a museum ledge; the camera trucks to the "2012 · MIT" lab-table
  exhibit; a beam path; a teal 3D mannequin outline rises; "illustration based on Velten et al. 2012".
- **v2: keep verbatim** to open the bridge (E). One year is a useful anchor; the equipment names are what the brief
  removes.
- **Claims:** C20.

#### s26
3:18.20–3:23.10 · 4.90 s · 15 words

> It took an ultrafast laser and a high-speed camera: lab equipment that filled a table.

- **Take:** x11_t4, 10.0.
- **Picture:** labels "ultrafast laser" and "streak camera"; a saffron bracket runs along the table; the equipment hops.
- **v2: cut.** The brief removes detailed equipment names. The table-sized rig shows "lab equipment" by itself, and the
  spoken point survives as "research equipment" in s29.
- **Claims:** C21 is dropped from narration.

#### s27
3:23.43–3:38.37 · 14.93 s · 41 words

> In a 2018 study, Stanford researchers swept one spot across the wall, like our simplified picture. The math got simpler: for a reflective exit sign, rebuilding the scene took about a second on a laptop. Measuring still took almost seven minutes.

- **Take:** x12_t4, 10.0.
- **Picture (S5.2):** the "2018 · Stanford" exhibit; a diamond hops a raster across a board; the laptop forms the
  picture in one second; a wall clock sweeps to 6.8 minutes.
- **v2: cut.** The brief removes historical timing numbers and compresses history to 20–30 s; this line alone is 15 s.
- **Claims:** C22 and C23 are dropped.

#### s28
3:38.90–3:49.63 · 10.73 s · 28 words

> By 2021, researchers in Wisconsin and Milan had sped up measuring too: live video of ordinary objects, five frames a second, with a powerful laser and custom detectors.

- **Take:** x12_t4, 10.0. 169 wpm.
- **Picture (S5.3):** the 2021 Wisconsin + Milan exhibit; a strip detector and a powerful laser; a monitor plays a
  blobby live video; a "5 frames/s" counter.
- **v2: rewrite as one clause** that keeps "research equipment" concrete, e.g. "By 2021, research systems could watch
  hidden objects live, with powerful lasers and custom detectors." (about 15 words). No frame rate.
- **Claims:** C24, condensed.

#### s29
3:50.07–3:56.37 · 6.30 s · 18 words · then 0.80 s

> Impressive. But those ran on research equipment. One team had even tracked hidden objects with a cheap sensor.

- **Take:** x12_t4, 9.12 (best). 206 wpm; 0.54 s pause after "Impressive.".
- **Picture (S5.4):** a velvet rope across the exhibits and a "research equipment" sign; a side card on a stool, "2021 ·
  hidden objects tracked with a cheap sensor · Callenberg et al. · illustration".
- **v2: trim** to "But those ran on research equipment. One team had even tracked hidden objects with a cheap sensor."
  (Reusable: file 1.33–6.41 s, 5.1 s.)
- **Why:** "Impressive" follows a list of feats that v2 no longer has. The cheap-tracking precedent is required by the
  brief.
- **Claims:** ★C25, ★C45.

### v1 S6, small sensors (3:57–4:53)

#### s30
3:57.17–4:07.10 · 9.93 s · 26 words · then 0.53 s

> Then, in a study published in 2026, a team from MIT and Dartmouth tried the small time-of-flight sensors, often called LiDAR, found in phones and gadgets.

- **Take:** x13_t4, 10.0 (no penalties). 174 wpm. "LiDAR" is spoken from IPA /ˈlaɪdɑːr/; its pronunciation has not
  been listened to.
- **Picture (S6.1):** the checker's arm sets the small sensor on the empty fourth plinth; "published 2026 · MIT +
  Dartmouth"; "time-of-flight sensors (LiDAR)"; phone and robot-vacuum badges.
- **v2: keep verbatim** to close the bridge. This is the brief's "museum spotlight isolates the modern sensor" match.
- **Gap to fill:** the bridge must also define what is new. Because s29 already credits a 2021 cheap sensor, "tried the
  small sensors" does not set 2026 apart. Add 12 words or fewer, or fold it into F's question. For example: "What's new
  is the method: using motion as extra information." Check it against C29–C31 and C35, and do not say "the first
  cheap result".
- **Claims:** ★C26, ★C27.

#### s31
4:07.63–4:11.97 · 4.33 s · 16 words · then 0.60 s (designed 0.35)

> Don't expect your phone to do this yet: phone makers often keep the raw data private.

- **Take:** x13_t4, 6.42 (best). 250 wpm articulated; 0.48 s pause after "yet:". Listen for rush.
- **Picture (S6.2):** a generic phone slides in; a padlock closes over "raw data"; "not on your phone (yet): raw data kept
  private".
- **v2: keep verbatim, directly after s30.** It corrects "found in phones" at once, and keeps the title honest if "This
  Camera Can See Around Corners" is chosen.
- **Claims:** ★C42.

#### s32
4:12.57–4:24.87 · 12.30 s · 33 words · then 0.40 s

> These sensors are tough customers. Weak lasers mean fainter echoes. The team's smartphone-grade device had about a hundred pixels: a hundred listening spots. And if you hold one in your hand, it jiggles.

- **Take:** x13_t4, 10.0. 192 wpm; [lightly amused] on "jiggles".
- **Picture (S6.3):** three problem cards: a dim beam with a fainter echo; the 10×10 research module, "smartphone-grade
  device (team's own) · ≈ 100 pixels"; the checker lifts the sensor off its tripod and it jiggles.
- **v2: trim, and add a question.**
  - Replace "These sensors are tough customers." with the brief's Q4 as a new question (about 9 words, e.g. "So why does
    a cheaper sensor make this harder?").
  - Then reuse "Weak lasers mean fainter echoes. … it jiggles." (file 2.22–12.38 s, 10.2 s).
  - Picture: one large problem at a time, not a stacked three-card assembly. The 100-pixel problem can call back to D:
    fewer spots, bigger patch.
- **Claims:** ★C28. Firewall: "about 100 pixels" belongs to the smartphone-grade device only.

#### s33
4:25.27–4:31.83 · 6.57 s · 18 words · then 0.53 s

> Their fix borrows night mode's trick from phone cameras: stack many quick, dim frames into one better estimate.

- **Take:** x14_t1, 10.0 (best). 176 wpm.
- **Picture (S6.4):** six dim, grainy plan frames pop in, pile up and merge into one crisp card; "our analogy: night
  mode", "illustrative".
- **v2: keep verbatim.** It answers "how do you recover the signal?".
- **Claims:** ★C29, ★C44 (the analogy stays labelled as ours).

#### s34
4:32.37–4:40.83 · 8.47 s · 23 words · then 0.30 s

> The catch: between frames, the sensor jiggles and the person moves. Plain averaging would smear everything, like a long exposure of someone walking.

- **Take:** x14_t1, 10.0 (best). 182 wpm.
- **Picture (S6.5):** the plan view with a "frame 1/2" chip. The wall points shift 3 cm and he steps from H_A to H_B; a
  coral smear appears, "plain averaging → smear (illustrative)"; a long-exposure photo gag.
- **v2: keep verbatim.** It says exactly what the brief asks: what changes between frames, and why naive averaging
  smears. Show the two changes separately (the spots move; the person moves), then the smear.
- **Claims:** ★C30.

#### s35
4:41.13–4:52.97 · 11.83 s · 37 words · then 0.63 s

> Their method puts the motion to work, one unknown at a time. Move the sensor through known positions, and the listening spots spread out. Keep the sensor still, and each step becomes a new position to follow.

- **Take:** x15_t1, 8.99 (third, 0.11 behind t2). 218 wpm; pauses 0.53 s ("time.") and 0.47 s ("out.").
- **Picture (S6.6):** a split plan view. Left: the sensor slides on a rail from A to B1, new spots appear and the patch
  shrinks. Right: the sensor stays still and the cloud follows his 11 cm step (subtle).
- **v2: keep verbatim.** Picture changes:
  - two full-frame beats in sequence instead of a split (brief: large single comparisons before any split view);
  - the left beat calls back to s22 and to the U, which is how the U was made;
  - the right beat hands over to the kit clip (s36);
  - show the patch before and after, so the value of fusion is visible.
- **Claims:** ★C30, ★C31, ★C35.

### v1 S7, what the real data shows (4:53–5:38)

#### s36
4:53.60–5:05.70 · 12.10 s · 39 words · then 0.37 s

> Our opening clip came from a different sensor: an off-the-shelf kit the authors put at under a hundred dollars, with sixteen listening spots, held still while a person walked behind a partition. We ran it through their own code.

- **Take:** x15_t1, 9.23 (best). 215 wpm; 0.45 s pause after "partition.".
- **Picture (S7.1):** the plan view morphs back into the opening's evidence board and the track runs again; "kit: 16
  listening spots · under US$100 (authors)"; ×4 stack tags.
- **v2: trim, and rewrite the second sentence.**
  - Keep sentence 1 (reusable: file 0.05–10.29 s, 10.2 s). It answers the consumer-hardware question, and it is the
    "sensor still" case of s35: the brief's condition for showing the tracking again.
  - Replace "We ran it through their own code." with the narrower production statement the brief asks for (new, about
    18 words). For example: "We re-ran the authors' code on their released files: a check of the processing, not a
    new experiment."
  - The hook's moved provenance lands here: the frame counter (frame N of 475), "frame numbers, not seconds", and the
    note on our run versus the authors' stored estimate.
- **Claims:** ★C02, ★C32, and the brief's distinction that reprocessing is not replication.

#### s37
5:06.07–5:11.73 · 5.67 s · 18 words · then 0.90 s (hold on the U)

> Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of a hidden U.

- **Take:** x16_t3, 10.0 (no penalties). 202 wpm.
- **Picture (S7.2):** the 3×3 box steps through a 6×6 raster and the U resolves from noise; "same 3×3 sensor · 36 known
  positions · object held still"; a front-view card.
- **v2: move verbatim to the end of D,** straight after s24-trim ("…or a rough shape." → the real U).
  - The brief moves the real reconstruction (v1 5:07–5:12) into the geometry sequence, with its actual conditions.
  - "The sensor behind that faint bump" still points back to s15 in v2's order.
  - Keep the conditions on screen beside the U: real data, the same sensor as the faint bump, 36 known positions,
    object held still.
  - If the switch to real data needs a spoken cue, add three or four words before it ("Here's a real one.").
  - Keep a hold of about 0.8–0.9 s for the reveal.
- **Claims:** ★C33, ★C35 (known positions, static object), ★C12 (same sensor).

#### s38
5:12.63–5:26.23 · 13.60 s · 45 words · then 0.30 s

> Many of these tests had help: safety-vest style reflective material on the target, which sends far more light straight back. Our clip's files don't say if the walker wore any. And the kit needs a flat wall and a few seconds of empty room first.

- **Take:** x16_t3, 7.77 (best). Dense: 233 wpm articulated; pauses 0.46, 0.55 and 0.57 s at the sentence breaks.
- **Picture (S7.3):** acted. A reflective strip is pressed onto a board and the returning pulse fattens (with a plan
  card); a "files don't say" stamp; an empty-room scan with the shoo gag. A minor defect is open here (N17, an elbow
  fold).
- **v2: split, and move each condition beside the kit result** in F, right after s36. All three sentences are reusable at
  clean breaks:

  | Sentence | File in–out |
  |---|---|
  | "Many of these tests had help: … straight back." | 0.06–6.69 s |
  | "Our clip's files don't say if the walker wore any." | 7.24–9.50 s |
  | "And the kit needs a flat wall and a few seconds of empty room first." | 10.07–13.66 s |

  - Suggested order: s36 sentence 1 → kit-needs → the processing statement → reflective help → files don't say → s39
    sentence 1.
  - Shorten the acted strip and shoo staging to what the words need.
- **Why:** the brief wants each condition integrated beside the result it qualifies, with no separate caution sequence.
- **Claims:** ★C34, ★C36, ★C02.

#### s39
5:26.53–5:37.87 · 11.33 s · 36 words · then 0.90 s (scene end)

> But in a separate test, the authors report tracking a person in ordinary clothes, capturing thirty frames a second. The code is public, though we've found no other team reporting results on its own hardware yet.

- **Take:** x17_t2, 9.90 (best; this line was re-voiced in v1 to add "in a separate test"). 206 wpm; 0.52 s pause after
  "second.".
- **Picture (S7.4):** a framed card, "the authors' separate test · our drawing", with a neutral grey "their sensor"; the
  guesser walks; a film strip shows "slowed down". Chips: "a separate test, not our kit clip · device data not
  released" and "code public · no independent reproduction found (Oct 2026)". Then the museum's empty "independent
  reproduction" slot.
- **v2: trim** to sentence 1 (reusable: file 0.02–6.31 s, 6.3 s). Cut sentence 2, its chip and the empty-slot picture.
  - The brief rules out a broad "no independent reproduction found"; the narrower statement now sits in s36.
  - Keep the firewall: never stage this result on the kit or with the checker. "Capturing" means capture rate, not
    processing speed.
  - Keep v1's chip wording. Do not add "smartphone-grade device": EXPERIMENT_RECORD R1 says the device identity is
    inference.
- **Claims:** ★C37. C38 is replaced.

### v1 S8, usefulness and limits (5:38–6:13)

#### s40
5:38.77–5:43.63 · 4.87 s · 15 words · then 0.47 s (designed 0.30)

> What might this be good for? Picture a delivery robot nearing a blind warehouse corner.

- **Take:** x18_t3, 9.89 (third, by 0.11). It has the widest pitch range in the film (17.9 st): a real question contour.
- **Picture (S8.1):** a locked wide front view of the warehouse. The robot waits (1.4 s on the question), then rolls
  toward the corner and stops. This is the R3 window; no Runway insert.
- **v2: keep verbatim** to open G with the brief's Q5. Match the lab partition to the warehouse corner with `potential
  use` (brief), establish the conflict quickly, and trim the 1.4 s wait.
- **Claims:** ★C39.

#### s41
5:44.10–5:49.30 · 5.20 s · 22 words · then 0.57 s (designed 0.30)

> With a suitable wall at the junction, a sensor like this might give it an early hint of movement out of sight.

- **Take:** x18_t3, 4.67, best of 4. The fastest line in the film: 272 wpm articulated, 254 by span.
- **Picture (S8.2):** a tilt to the plan view; the junction wall lights; "potential use"; pulses run robot → wall →
  person → wall → robot; a faint blob appears.
- **v2: keep the text and regenerate the take** in the G block; all four takes are rushed. "Suitable wall" and "might"
  carry the hedge, and need room.
- **Claims:** ★C39.

#### s42
5:49.87–5:54.67 · 4.80 s · 15 words · then 0.33 s

> Just a fuzzy blob: enough to say slow down, not enough to say who's there.

- **Take:** x18_t3, 8.65 (second, by 0.06). 222 wpm.
- **Picture (S8.3):** a blob on the floor; the robot squints and brakes; "slow down", "not who"; the robot and the person
  look at each other.
- **v2: keep verbatim.** It is the hypothetical early warning and its limit (brief), and the one other place C19 belongs:
  as an application limit, not a disclaimer.
- **Claims:** ★C19, ★C39.

#### s43
5:55.00–6:06.00 · 11.00 s · 26 words · then 0.47 s

> And plenty is still hard: short range, dark or shiny walls, bright sunlight, and fast math on small hardware. The researchers call it an early-stage prototype.

- **Take:** x19_t1, 10.0 (best). 175 wpm; list beats of 0.33–0.38 s; 0.52 s pause after "hardware.".
- **Picture (S8.4):** a paper board with a 2×2 grid of tiles, each playing on its word; "early-stage prototype
  (authors)".
- **v2: keep verbatim.** It is the brief's short limits sequence. One full-frame tile per beat reads better on a phone
  than the 2×2 grid.
- **Claims:** ★C40.

#### s44
6:06.47–6:12.07 · 5.60 s · 18 words · then 0.90 s (scene end)

> No one has shown that it prevents collisions. For now, it's a promising clue, not a safety system.

- **Take:** x19_t1, 8.70 (best). 221 wpm; 0.38 s pause after "collisions.".
- **Picture (S8.5):** the robot creeps on; its bumper meets a carton just after "collisions" and it backs off; a "bumper"
  label; "not a safety system".
- **v2: trim** to "For now, it's a promising clue, not a safety system." (Reusable: file 2.76–5.98 s, 3.2 s.)
- **Why:** "No one has shown…" is a broad absence-of-evidence claim (C41: inference, from a dated search), the same kind
  the brief narrows for reproduction, and the remaining sentence keeps the point. Keep the bumper gag only as a beat of
  1 s or less (brief).
- **Claims:** C41 becomes optional; "not a safety system" survives.

### v1 S9, back to our friend (6:13–6:44)

#### s45
6:12.97–6:14.80 · 1.83 s · 7 words · then 0.50 s

> Which brings us back to our friend.

- **Take:** x20_t1, 6.25 (fourth of 4; t3 scores 8.81). F0 196 Hz, 3.8 st above the median.
- **Picture (S9.1):** the room; the guesser is nervous and gives a sheepish wave; the checker side-eyes him.
- **v2: cut.** The cut back to the room is the callback. A spoken signpost is part of the extended recap the brief
  replaces.
- **Claims:** none.

#### s46
6:15.30–6:22.67 · 7.37 s · 28 words · then 0.60 s

> Being out of sight isn't the same as giving nothing away. The light found a way around, and careful timing and math can read some of its clues.

- **Take:** x20_t1, 6.94, best of a uniformly fast set (243 wpm). 0.46 s pause after "away.".
- **Picture (S9.2):** the raised view; two slowed round trips; a magnified readout; the blob lights, "likely location";
  he gulps and deflates.
- **v2: trim** to "Being out of sight isn't the same as giving nothing away." (Reusable: file 0.05–2.87 s, 2.8 s.)
- **Why:** this is the concise takeaway. Sentence 2 recaps the film, and the brief replaces the extended recap. If the
  reused sentence sounds rushed, regenerate it with the closing block.
- **Claims:** the takeaway (C04 and C19 in spirit).

#### s47
6:23.27–6:26.27 · 3.00 s · 10 words · then 5.30 s (J4)

> To really hide, he'd have to block the bounces too.

- **Take:** x20_t1, 9.92 (best).
- **Picture (S9.3):** he walks the partition back to the wall (the R4 window); the paths stop at it and the readout goes
  blank; he is smug; the checker leans round the near end and looks at him (J4); busted.
- **v2: keep verbatim** as the one callback.
  - Shorten the silent hold from 5.3 s to about 3–3.5 s by starting the push under the line.
  - The brief allows the direct-look gag if it reads instantly and doesn't hide what indirect sensing achieved, so the
    blank readout must read first.
- **Claims:** ★C04.

#### s48
6:31.57–6:38.33 · 6.77 s · 19 words · then 5.67 s to the end

> This is Future Got Weird: the strange future, explained. Subscribe for more, and we'll see you around the corner.

- **Take:** x21_t4, 8.61 (best). F0 191 Hz, a bright sign-off.
- **Picture (S9.4):** a hard wipe to the yellow card. FUTURE / GOT / WEIRD pop in, then the tagline, all in the top
  third. The card holds to the end: 12.1 s, with the last 5.7 s silent.
- **v2: keep verbatim, spoken over the functional end screen from its first frame.**
  - The end screen runs 8–12 s, with one next-video slot and the subscribe element, branding kept, and no logo-only hold
    (brief).
  - "See you around the corner" is a light callback.
  - If the owner names the next video, a new line pointing to it could replace "Subscribe for more". It is not required.
- **Claims:** none.

---

## 4. The recommended v2 order and its estimate

This is a planning sketch for the script task, not the script. Durations use:
- the measured spans for reused audio;
- 182 wpm for new copy (v1's rate while speaking);
- 0.35 s between lines within a section and 0.6 s at section turns, plus short holds where the picture needs them (the
  hook's evidence, the mirror duck, J3, the waveform, the U).

| v2 | Lines, in order | Est. | v2 start | Brief's window |
|---|---|---|---|---|
| A hook | [2 s hide] · s02 · s03-rw · (s04 clause) · s06-rw (+ "A few billionths of a second later.") · s07-trim · NEW "So how do you turn a tiny delay into a location?" | 29.8 s | 0:00 | 0:00–0:30 |
| B wall | s09 · s10-trim · s11 · s12-trim | 21.4 s | 0:30 | 0:30–1:05 |
| C echo | s13-trim · s14 · s15 · s16 | 28.9 s | 0:51 | 1:05–1:40 |
| D location | s17-trim · s08-rw · s18 · s19 · s20 · s21 · s22 · s23 · s24-trim · s37 | 62.7 s | 1:20 | 1:40–2:30 |
| E history | s25 · s28-rw · s29-trim · s30 (+ what's new, ≤12 words, about +4 s) | 29.2 s | 2:23 | 2:30–2:55 |
| F hardware | s31 · NEW Q4 · s32-trim · s33 · s34 · s35 · s36 sentence 1 · s38 kit-needs · NEW processing statement · s38 reflective + files · s39 sentence 1 | 84.1 s | 2:52 | 2:55–4:05 |
| G use | s40 · s41 (regenerated) · s42 · s43 · s44-trim (+ ≤1 s bumper beat) | 34.1 s | 4:16 | 4:05–4:55 |
| H close | s46-trim · s47 · J4 (~3.5 s) · s48 over a 10 s end screen | 20.3 s | 4:50 | 4:55–5:15 |
| **Total** | about **865 words** | **about 5:10** | | 5:15–5:45 target |

- **Margin.** The estimate leaves about 5–35 s for evidence-viewing holds: the hook's board, the waveform's magnifier,
  the U, and the kit board in F. Spend it there rather than padding. The webcam gag (+2.2 s) is the first cut material
  worth restoring if the hook has room.
- **Run-length risk.** F is the heaviest section, about 14 s over the brief's illustrative window. If the cut runs long,
  shorten F's staging (one large problem card at a time; the acted reflective-strip beat) before cutting any of its
  claims.
- **Reuse.** About 707 words (229 s of speech) can come from v1 audio, and about 140 words (46 s) are new or regenerated.
  Every reuse decision still waits on the listening pass:
  - **Takes that measure fast:** s09, s19, s31 and s46. s41 is already marked for regeneration.
  - **Splice continuity:** the v1 takes were generated in 21 different sections. Selected lines range from 133 Hz (s06)
    to 196 Hz (s45) median F0, and from −12.8 to −16.9 dB in level. Match levels, and listen at every new adjacency.
  - **When to regenerate a whole block:** if the new hook and bridge takes sound different from the v1 material, or if
    the brief's stronger contrast between question, discovery and limitation needs it, regenerate whole blocks rather
    than patch.

---

## 5. Claims the v2 structure must still carry

Status codes:
- **MUST:** the meaning must survive, in narration, on screen, or both.
- **condensed:** the meaning survives in shorter form.
- **optional / drop / replace:** as written in the row.

The v2 places are this audit's recommendations.

| Claim | Gist (see `claims.csv` for exact wording and conditions) | v1 lines | v2 status | v2 home | Guard |
|---|---|---|---|---|---|
| C01 | The sensor cannot see the hidden person directly | s02 | MUST | A, s02 | Illustrative room |
| C02 | The opening plot is the authors' released ST-kit data: sensor held still, processed with the authors' code (run by us), clothing undocumented | s03 s36 s38 | MUST | A (short ID) + F (full: s36, s38) | `ours_xz` vs `stored_xz` (s03); no 2026 capture; no rate; no clothing claim |
| C03 | Published 2026; capture earlier and unresolved | s03 | MUST | A source line; E s30 | "Published", never "captured" |
| C04 | Light goes around the partition via the wall, never through it | s04 s05 s46 s47 | MUST | A (s04 clause + route picture), H s47 | No ray through or over the partition; around the end |
| C05 | Only a tiny fraction returns (inference) | s05 s13 | condensed | C, inside C11's wording | Never as a measured number |
| C06 | About 30 cm of path per ns; extra delay means extra distance; delays of a few ns | s06 s08 s16 | MUST | A (timing), C s16, D s08-rw | **Path vs one-way: 15 cm per ns**; the 8.9 ns / 2.65 m / 1.33 m chain; one example spot |
| C07 | It needs a time-of-flight sensor | s07 | MUST | A, s07-trim, by 0:30 | Describes a sensor class, not a stock phone |
| C08 | Mirror law | s10 | optional | B, visual | — |
| C09 | A matte wall scatters every which way (tiny lamp) | s11 | MUST | B, s11 | Analogy labelled |
| C10 | Returns blend many paths; what survives is timing | s12 | MUST | B, s12-trim (answers Q2) | — |
| C11 | Each bounce loses light; the hidden echo is tiny | s13 s14 | MUST | C, s13-trim and s14 | Diffuse target |
| C12 | Real raw data, different sensor (ams 3×3) and object; bump a few ns later; hundreds of times weaker in this capture | s15 s37 | MUST | C s15; D s37 | ams ≠ ST kit; the ratio is this capture's |
| C13 | Confocal simplification (sends and listens at one spot) | s17 | MUST | D, s17-trim + label | The brief requires saying whether the diagram is confocal |
| C14 | One time gives an arc: distance, not direction | s18 s19 | MUST | D | — |
| C15 | A second spot leaves one crossing in front of the wall | s20 | MUST | D | — |
| C16 | Noise turns arcs into bands and the overlap into a patch | s21 | MUST | D | ±3.75 cm is illustrative |
| C17 | Spread-out spots shrink the patch | s22 | MUST (F depends on it) | D | — |
| C18 | Search plus assumptions | s23 | MUST | D | Point object in the released code |
| C19 | A likely location or rough shape, not a photograph | s24 s42 s46 | MUST, **once** | A ("not a photograph"); D s24-trim; G s42 as a limit | Not repeated as a disclaimer |
| C20 | 2012 MIT mannequin around a corner | s25 | keep | E, s25 | — |
| C21 | Femtosecond laser and streak camera | s26 | drop (picture only) | — | — |
| C22 | 2018 Stanford confocal sweep | s27 | drop | — | — |
| C23 | 1 s to rebuild / 6.8 min to measure | s27 | drop | — | Never "seeing in one second" |
| C24 | 2021 live NLOS video | s28 | condensed | E, s28-rw | No "5 fps" |
| C25 | The earlier demonstrations used research equipment | s29 | MUST | E, s29-trim | — |
| C26 | 2026, MIT + Dartmouth, consumer time-of-flight sensors | s30 | MUST | E, s30 | — |
| C27 | The sensor class ships in consumer devices | s30 | MUST | E, s30, then s31 at once | No stock-phone app |
| C28 | Weak laser, low resolution (about 100 px on the smartphone-grade device), motion | s32 | MUST | F, s32-trim | 100 px ≠ the kit's 16 zones ≠ the ams 9 |
| C29 | Burst-style fusion of many frames | s33 | MUST | F, s33 | — |
| C30 | Things move between frames; plain averaging smears; the model accounts for motion | s34 s35 | MUST (the brief asks) | F, s34 and s35 | Smear shown as illustrative |
| C31 | Sensor motion samples new spots; object motion is followed | s35 | MUST | F, s35 | The size of the benefit is illustrative |
| C32 | The opening clip is an off-the-shelf kit, under US$100 by the authors, 16 zones, held still | s36 | MUST | F, s36 sentence 1 | Authors' framing of the price |
| C33 | The U reconstruction: the same ams sensor through known positions | s37 | MUST (moved) | D, s37 | 36 positions, static object, on screen |
| C34 | Many tests used reflective material; the clip's material is undocumented | s38 | MUST, beside the result | F, s38 sentences 1–2 | — |
| C35 | 3D reconstructions used known positions and static objects | s35 (+ s37 on screen) | MUST | D with s37; F s35 | Not unrestricted handheld scanning |
| C36 | The kit needs a flat wall and an empty-room background first | s38 | MUST, beside the kit result | F, s38 sentence 3 | — |
| C37 | Separate test: ordinary clothes, 30 frames/s capture | s39 | MUST | F, s39 sentence 1 | Capture rate is not latency; never on the kit |
| C38 | Code public; no independent reproduction found | s39 | **replace** | F: the narrower production statement in s36 | "We re-ran their code on their released files; that checks the processing, not the experiment" |
| C39 | Warehouse early hint: potential use | s40–s42 | MUST | G | `potential use`, "might", "suitable wall" |
| C40 | Range, dark/shiny walls, sunlight, compute; early-stage prototype | s43 | MUST | G, s43 | — |
| C41 | Nobody has shown it prevents collisions | s44 | optional | G (dropped by s44-trim) | "Not a safety system" survives |
| C42 | Not on your phone yet; raw data private | s31 | MUST | F, right after s30 | — |
| C43 | The flash is invisible (near-infrared) | s05 | optional | A or B chip | Applies to the ST kit only |
| C44 | The night-mode analogy is ours | s33 | MUST if the analogy is kept | F, s33 + label | — |
| C45 | A team tracked hidden objects with a cheap ST sensor in 2021 | s29 | MUST (the brief asks) | E, s29-trim | 2026 is not the first cheap result |

**Distinctions the brief requires that no single claim row holds.** v2 must keep all of these:
- **Light paths:** straight segments between interactions, no ray through the partition, and arcs drawn as constraints,
  not photon paths.
- **The confocal route:** S → W → H → W → S, length 2|S−W| + 2|W−H|, and the hidden distance is half the extra path.
- **One worked example:** 8.9 ns / 2.65 m / 1.33 m.
- **Evidence contexts kept apart:**
  - R8: ST kit, sensor held still, tracking. The opening and s36.
  - R10: ams 3×3. The waveform (s15) and the U (s37).
  - R1: the authors' separate diffuse-person test (s39).
  - The smartphone-grade device's "about 100 pixels" (s32).
- **Rates:** capture frequency is never presented as processing or deployment speed.
- **Reprocessing:** re-running the authors' data is not replication.
- **Outputs:** position estimate vs rough reconstruction vs photograph.

---

## 6. Pauses: measurements and what is excessive

### 6.1 How v1's 404.01 s divides

| Part | Seconds |
|---|---|
| Lead-in before s01 | 0.53 |
| Speech spans, s01–s48 | 365.33 |
| Gaps between lines, s01→s47 (46 gaps) | 27.15 (mean 0.59, median 0.53) |
| J4 hold, s47→s48 | 5.30 |
| End card after s48 | 5.67 |

Inside the speech spans there are 87 silences of 0.30 s or more, totalling 37.3 s. 41 of them are 0.45 s or more
(20.5 s), and 18 are 0.50 s or more (9.7 s). So about as much silence sits inside lines, at sentence breaks within a
take, as between them.

**Why measured gaps exceed `pause_after_ms`.** `tools/build_timeline.py` keeps the larger of the designed pause and the
take's own paragraph pause (each section was generated as a multi-line prompt with blank lines between lines). In 16
gaps the voice's paragraph pause beat the design by 0.15 s or more, 3.5 s in total.

### 6.2 Gaps between lines

Every gap, with the designed value in brackets:

| s01 | s02 | s03 | s04 | s05 | s06 | s07 | s08 | s09 | s10 | s11 | s12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.67 (0.65) | **0.53** (0.30) | 1.10 (1.10) | **0.57** (0.35) | 0.33 (0.35) | 0.43 (0.30) | **0.57** (0.30) | **0.90** (0.90) | **0.53** (0.30) | **0.80** (0.80) | **0.57** (0.40) | **0.80** (0.80) |

| s13 | s14 | s15 | s16 | s17 | s18 | s19 | s20 | s21 | s22 | s23 | s24 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.43 (0.35) | 0.37 (0.35) | 0.50 (0.40) | **0.90** (0.90) | **0.47** (0.30) | **0.50** (0.30) | **0.90** (0.90) | **1.00** (1.00) | 0.43 (0.30) | 0.33 (0.35) | **0.60** (0.30) | **1.00** (1.00) |

| s25 | s26 | s27 | s28 | s29 | s30 | s31 | s32 | s33 | s34 | s35 | s36 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **0.53** (0.30) | 0.33 (0.35) | **0.53** (0.35) | 0.43 (0.30) | **0.80** (0.80) | **0.53** (0.30) | **0.60** (0.35) | 0.40 (0.40) | **0.53** (0.30) | 0.30 (0.30) | 0.63 (0.50) | 0.37 (0.35) |

| s37 | s38 | s39 | s40 | s41 | s42 | s43 | s44 | s45 | s46 | s47 | s48 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.90 (0.90) | 0.30 (0.30) | **0.90** (0.90) | **0.47** (0.30) | **0.57** (0.30) | 0.33 (0.35) | **0.47** (0.30) | **0.90** (0.90) | 0.50 (0.50) | 0.60 (0.60) | **5.30** (5.30) | 5.67 to end |

Bold marks the gaps judged excessive below.

**Excessive between lines:**
1. **Paragraph-pause overshoots** on lines that simply continue the thought: s02, s04, s07, s09, s11, s17, s18, s23,
   s25, s27, s30, s31, s33, s40, s41, s43 (0.47–0.60 s against 0.30–0.40 s designed). Silence edits are enough, with no
   regeneration: aim for 0.30–0.35 s.
2. **Scene-end holds of 0.8–1.0 s:** s08, s12, s16, s24, s29, s39, s44. In v2 the music carries across cuts and
   transitions are match cuts, so 0.5–0.6 s is enough.
3. **Reaction holds:** s10 (J2, 0.80), s19 (J3a, 0.90), s20 (J3b, 1.00). Keep a beat of 0.5–0.7 s and let the reaction
   overlap the next line's first word.
4. **J4: 5.30 s.** About 3–3.5 s is enough if the push starts under s47.
5. **The end card:** its length is set by the end-screen rule (8–12 s in all, s48 inside it). It is not a silence to keep.

**Justified holds; keep the time and fill it with picture:**
- **s03** (1.10 s, after the evidence) and **s37** (0.90 s, the U reveal). The brief: evidence needs viewing time.
- **s15–s16:** time for the magnifier to be read.

**Fine as they are:** gaps of 0.30–0.45 s within a section (s05, s06, s13, s14, s21, s22, s26, s28, s32, s34, s36, s38,
s42); s15's 0.50 s (reading time for the magnifier); and 0.50–0.63 s at real beat changes (s35 → s36, s45, s46).

### 6.3 Pauses inside lines

The 18 pauses of 0.50 s or more:

| Line | After | Pause (s) | In v2 |
|---|---|---|---|
| s03 | yet… | 0.65 | Designed beat; the line is rewritten |
| s03 | 2026: | 0.53 | Line rewritten |
| s09 | all? | 0.53 | Question → answer; ~0.40 |
| s10 | whole. | 0.52 | Becomes the cut point (trimmed away) |
| s12 | sorted. | 0.50 | Trimmed away |
| s12 | paths… | 0.60 | Designed thesis beat; ~0.45–0.50 |
| s13 | sensor, | 0.51 | One of the five-stop rhythm pauses (all 0.42–0.51 s); removed by the trim |
| s14 | wall. | 0.54 | **Excessive: → 0.35** |
| s15 | object: | 0.50 | Colon before the description; → 0.40 |
| s23 | match. | 0.55 | **Excessive: → 0.35** |
| s27 | picture. | 0.52 | Line cut |
| s29 | Impressive. | 0.54 | Trimmed away |
| s32 | echoes. | 0.50 | **Excessive: → 0.35** |
| s35 | time. | 0.53 | **Excessive: → 0.35–0.40** |
| s38 | back. | 0.55 | Becomes a cut point |
| s38 | any. | 0.57 | Becomes a cut point |
| s39 | second. | 0.52 | Becomes the cut point |
| s43 | hardware. | 0.52 | Before the attribution; → 0.40 |

**Other pauses of 0.45–0.49 s at sentence breaks inside reused lines:** s16 "clue." 0.47, s18 "spot." 0.49, s20 "spot."
0.47, s25 "new." 0.45, s31 "yet:" 0.48, s35 "out." 0.47, s36 "partition." 0.45 (a cut point), s40 "for?" 0.45 (a
question; fine), s46 "away." 0.46 (a cut point). Bring the continuing ones to about 0.35 s.

**Rule for v2.**

| Where | Pause |
|---|---|
| Sentence breaks inside a continuing explanation | 0.25–0.35 s |
| Question → answer, set-up → punchline | 0.40–0.50 s |
| Designed thesis beats ("…What survives is timing", "…just one place") | Kept, ≤0.5 s |

Doing this with silence edits inside the reused takes is not a speed change. Check every edit by ear, so that no breath
is clipped and no sentence lands too soon.

### 6.4 What tightening alone would have saved on v1

| Change | Saving |
|---|---|
| Between-line gaps capped at 0.35 s within a scene and 0.6 s at turns and reactions | about 8 s |
| Pauses inside lines capped at 0.35 s | about 7.5 s |
| J4 at 3.5 s | 1.8 s |
| **Total** | **about 17 s** |

That is about 4% of the film, so pause tightening alone does not reach the brief's runtime; the line cuts and trims
above do. The v2 estimate in section 4 already assumes the tighter gaps.

---

## 7. Notes for the narration and edit tasks

- **Reusable fragments** (file times in `audio/narration/v2/sNN.wav`, each cut inside a measured silence):

  | Line | Keep | File in–out (s) | Length (s) |
  |---|---|---|---|
  | s04 | "It goes around the end, by way of the wall." | 4.68–6.66 | 2.0 |
  | s06 | "A few billionths of a second later." | 4.61–6.69 | 2.1 |
  | s07 | "This takes a time-of-flight sensor, … round trip." | 1.95–6.23 | 4.3 |
  | s10 | "Put a mirror here, … simply visible." | 4.55–7.81 | 3.3 |
  | s12 | "Everything coming back … What survives is timing." | 8.98–14.01 | 5.0 |
  | s13 | "Each bounce spreads the light, and most of it is lost." | 6.85–9.71 | 2.9 |
  | s17 | "The sensor flashes and listens at one spot on the wall." | 6.29–9.18 | 2.9 |
  | s24 | "That's why the answer is a likely location, or a rough shape." | 0.06–3.68 | 3.6 |
  | s29 | "But those ran on research equipment. … cheap sensor." | 1.33–6.41 | 5.1 |
  | s32 | "Weak lasers mean fainter echoes. … it jiggles." | 2.22–12.38 | 10.2 |
  | s36 | sentence 1 ("Our opening clip … behind a partition.") | 0.05–10.29 | 10.2 |
  | s38 | sentence 1 / sentence 2 / sentence 3 | 0.06–6.69 / 7.24–9.50 / 10.07–13.66 | 6.6 / 2.3 / 3.6 |
  | s39 | sentence 1 | 0.02–6.31 | 6.3 |
  | s44 | "For now, it's a promising clue, not a safety system." | 2.76–5.98 | 3.2 |
  | s46 | "Being out of sight … giving nothing away." | 0.05–2.87 | 2.8 |

- **Aligner caveat.** The aligner stretches sentence-final words over the following pause: for example, it places s46's
  "away." over the silence at 2.88–3.34 s. Take cut points from the silence, not from `words.json` end times, and
  re-align the captions after editing.
- **Voice settings to carry over:** voice "Test Voice", `kk5XaSLo2XAw0sKM98zU`, model `eleven_v4`. LiDAR is written as
  /ˈlaɪdɑːr/ in the prompt. Inline tags such as [curious], [dryly] and [lightly amused] work.
- **Candidates for the brief's stronger question / discovery / limitation contrast** in new takes:
  - questions: the hook's question, s09, Q4, s40;
  - discoveries: s03-rw, s12's "What survives is timing", s20's "just… one place", s37;
  - limitations: s15's "In this capture, hundreds of times weaker", s31, s42, s43.
- **Not checked here, and needed before reuse is final:**
  - pronunciation (LiDAR, "nanosecond", "Dartmouth");
  - whether any reused take sounds rushed (s09, s19, s31, s46 measure fast);
  - tone continuity at every new splice;
  - whether the postcard metaphor (cut here) helps more than it costs, which the brief explicitly leaves to listening.

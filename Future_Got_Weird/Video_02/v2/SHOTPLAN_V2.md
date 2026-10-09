# Video 02 v2: shot plan

How Cameras See Around Corners · v2 editorial pass, 9 October 2026. The picture plan for `v2/SCRIPT_V2.md` (lines and
ids) and `v2/script_v2.json` (each line's `scene`). Times are the script's planning estimate (new takes at 170 wpm);
retime every cue from the final narration. v1 shot numbers (S1.1 to S9.4) are the scene sources' own; the full v1 → v2
shot map is in `v2/EDIT_MAP.md` §2.

## Global rules

**Frame and safe areas** (px at 1920×1080; the 4K master doubles them):
- Safe area x 96–1824, y 54–950. The caption band, y 950–1080, holds no teaching content in any shot or camera move.
- Face insets (S4_Inset) and question titles stay inside the safe area and clear of the caption band.

**Labels:**
- Key teaching labels 64 px (60–72) in the first minute (V1 to V4) and on every evidence board; secondary labels
  40–48 px; source lines and chips 30–34 px (credits may stay small).
- At most three teaching labels on screen at once in the first minute. Labels fade or cut in; no springing, no
  word-by-word text.
- Check every label and every evidence trace in a 390 px wide render; size alone is not acceptance.

**One teaching visual per beat:**
- No washed-out inactive panels left on screen.
- In a comparison, each panel is introduced alone before both are shown.
- Room views establish place; the mechanism is taught on full-frame schematics.

**Question titles:** one line, 64 px, top-left inside the safe area, on screen for the length of the spoken question
only (B, C, E, F; D's is shown without being spoken), then fade. Plain text in the house font, no box.

**Evidence and illustration** (evidence brief §0 and §10):
- **Real data:** the house evidence-board style (S1.3 / S3.3 / S7 boards: card, ink outline, tape, hard shadow),
  headline "Real data" at 64 px, no cartoon characters, a one-line source.
- **Our schematics:** the flat plan palette with a chip ("illustration" or "simplified picture"). Every switch between
  the two is a hard cut or a match cut in which the style visibly changes.
- **Four contexts never merge:**
  - R8: the kit tracking board (V1, V10);
  - R10: the ams waveform and the U, always with the 3×3 zone icon (V4, V6, and the U thumbnail in V9.4);
  - R1: the separate-test drawing (V10.5);
  - I1: our room and plan.
- The guesser never appears on the R8 or R1 material. The U is never drawn in our room's coordinates, and never sits
  next to the kit sensor.
- I1 numbers (8.9 ns, 2.65 m, 1.33 m, bands, region sizes, the 0.86 m smear, the 30% shrink) appear only on our plan,
  marked "illustrative".

**Light and geometry:**
- Light travels in straight segments and never crosses the partition. Candidate arcs are dashed constraints, centred on
  the wall spot; they may cross the partition.
- W1 appears only in full-frame plan views. In the raised room view, use W3 or W4 with no number: W1 and W2 graze the
  partition's top corner there (S9 review).
- Sensor positions come from `layout.json` frames A and B1 only. The hidden track is H_A → H_B → H_C → H_D.

**Cast rigs:**
- The guesser wears a white shirt with saffron stripes; the checker has a coral cardigan, round glasses and a pencil.
- Hands are mitts with a thumb: no pinches, no finger counts.
- Plan tokens are top-down and faceless, so plan-view reactions play in the S4 face inset or in a short room cut-in.
- Props (pointer, mirror panel, reflective strip, rail) are code-drawn.
- No ChatGPT plate goes on screen (ART_USE). No Runway insert is available (the output host is blocked; none was
  accepted), so every acted beat is a Remotion rig shot.

**Motion:**
- Anticipation, contact, settle; feet match ground travel; hands meet props; gaze goes to the thing being discussed.
- No perpetual bobbing, no constant zooms, no noise textures, no particles for activity's sake. A camera move must
  change what the viewer understands.

**Transitions:** cut directly or use a motivated match. The brief's matches used here:
- sensor display → arrival chart (V2.2/V2.3);
- light-path endpoint → arc centre (V2.4, V4.3 → V5.1);
- arcs → real reconstruction, with a visible switch (V5.9 → V6.1);
- museum spotlight → modern sensor (V7.3);
- lab partition → warehouse corner (V10.5 → V11.1).

No whole-board fade-ins.

**Sound** (listen before locking):
- **Music:** one instrumental curious pulse for the mystery (A, B); a quieter bed under dense explanation (C, E); a
  modest lift on each real-data reveal (V1.3, V4.2, V6.2, V10.1); a short drop before a reveal; a clean resolve into the
  end screen. Music carries across cuts and ducks under dense narration. No vocals, no riser per label.
- **Effects vocabulary:** footsteps, the schematic pulse/return motif, a few prop contacts (tap, mirror ting, rope
  clip, clink, padlock click, shutter), restrained comic reactions (duck, gulp), the robot's motor and brake. Photon
  sounds are explanatory styling.

**Cues:** the scenes cue on `at('sNN', word)` (358 references in v1).
- Reused v1 ids keep their word timings.
- New ids need aligned word timings from the new takes before any cue is rewired.
- Designed pauses are caps.

---

## V1 · Hide and the real track · 0:00.0–0:14.8 · s02, n01, n02

**Teaches:** the subject is out of direct view, and a real experiment recovered where a hidden person was.
**Sound:** curious pulse from frame 1 (no logo); footsteps on the sneak; sensor tap; a 0.3 s music drop before
"researchers", then a modest lift on the board.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V1.1 | 0:00.0–0:02.6 | silent hide, then s02 "That sensor can't see him." | Sensor-facing room view, locked: sensor on its tripod at left, partition at right, bare wall behind. On "can't see him" a dashed sight line runs from the sensor's window toward him and stops at the partition's face with an X. | "blocked" 64 | The guesser tiptoes in two steps from the right (heel contacts), settles behind the partition, hands on hips, smug (0.0–1.0 s). The checker stands by the tripod, deadpan. | cut | Adapt S1.1 sneak (code rig, compressed to about 1 s); the blocked line is S1.4's ghost line (`GHOST_HIT` in S1_ColdOpen, already checked with `assertAroundTheEnd`), now at tilt 0 with an X. |
| V1.2 | 0:02.6–0:05.3 | s02 "It's pointed at a plain, blank wall." | The S1.2 push: the readout blinks on, and a pale field-of-view wedge lights a patch of bare wall well clear of him. | "sensor" 64 · "blocked" stays | The checker taps the sensor (contact; readout on). The guesser glances at the blank wall and gives it a smug nod: his first belief, a blank wall can't give him away. | hard cut on "researchers" | Adapt S1.2 as built (tilt 0 push; not the over-the-shoulder raised framing, which revived D02). |
| V1.3 | 0:05.3–0:14.2 | n01, n02 | **The real result, full frame.** The authors' top-down layout, mirrored so the sensor sits at left: the 16 measured wall points along the top, the sensor marker, the partition line, and the estimated position moving behind it with a short trail of its previous plotted frames. Hidden side at least 60% of the frame; the dot at least 28 px. Replay: `stored_xz` from index 6 to 474, every 2nd data frame, one plotted position per video frame (about 7.8 s), no interpolation, starting on the cut. On "That dot" the label brightens once; a slow 5% push toward the dot. No frame counter, no conditions box, no code chip, no halo (the file's spread `ours_std_xz` belongs to our re-run). | "sensor" · "blocked" · "estimated position" (64) · headline "Real data" (64) · source line (34): "Real data · Somasundaram et al., Nature 2026 · ST sensor kit, held still" · corner tag "sped up" (34) | none on the board | hold | Adapt S1_TrackingBoard: `ours_xz` → `stored_xz`; strip the conditions column and counter (they move to V10.2 and the description). Record start, end and N in the source record. |
| V1.4 | 0:14.2–0:14.8 | the 0.6 s hold after n02 | A 0.6 s room cut-in: the guesser's smirk freezes. A separate shot, never moved in sync with the track. | none | The guesser reacts to the estimate. | match cut | Rig pose from S1.1 / S9.1 (existing faces). |

**V1 → V2 match:** the board's sensor marker, wall line and partition hold their screen positions while everything
else changes to our flat plan palette with the chip "illustration". The style change is the point: from their data to
our simplified picture.

## V2 · The long way round · 0:14.8–0:33.5 · n03, n04, n05, n06

**Teaches:** light that reaches him travels farther, by the wall, so it comes back later; that takes a sensor that times
its own light; and the delay must somehow become a place.
**Sound:** the schematic pulse/return motif (one short pulse sound per trip, two pitches); a soft thunk on the blocked
line; a small tap on the display; a light lift on the "?".

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V2.1 | 0:14.8–0:21.4 | n03 "The trick is timing: light that reaches him takes the long way round, so it comes back later." | **One full-frame plan of our room.** On "light that reaches him", two pulses leave the sensor together. The short teal trip goes S → W1 → S. The long saffron trip goes S → W1 → him → W1 → S, through the 0.65 m gap at the partition's wall end. Straight dashed segments; the return leg is thinner; nothing crosses the partition. The teal pulse is home while the saffron one is still out. On "comes back later" both drop onto a timeline sliding in at the bottom. | "short trip" · "long way round" (64) · chip "illustration" (30) | Guesser token at H_A (faceless). | timeline rises | Adapt S4's plan (RoomSet tilt 1, Tokens, S4_Parts, lib/optics paths); W1 from `layout.json` (passes the plan clearance). New: the two-pulse race in plan. |
| V2.2 | 0:21.4–0:24.1 | n04 "A few billionths of a second later." | **The shared arrival timeline fills the frame.** The tall teal wall echo lands first, the small saffron echo later, and a bracket snaps between them. No number. | "wall echo" · "his echo" (48) · bracket "a few nanoseconds" (64) · "not to scale" (30) | none | timeline shrinks into the sensor display | **New, built once and reused (V3.4, V4.1, V8.2):** full-frame arrival timeline with fixed colours (teal wall echo, saffron hidden echo), fixed positions, always "not to scale". Drawn in the S3_TimingCard style. |
| V2.3 | 0:24.1–0:28.4 | n05 "This takes a time-of-flight sensor, a camera that clocks its own light's round trip." | **Sensor close-up, full frame.** Emitter and receiver windows; a faint flash leaves and returns; the back display shows the timeline in miniature beside a stopwatch glyph (the chart → display match). | "time-of-flight sensor" (64) · "times its own light's round trip" (40) · chip "invisible flash · shown for clarity" (30) | The checker's mitt taps the display (contact), deadpan. | push through the lens | Adapt the S1_SensorStand drawing at close-up scale. New framing. |
| V2.4 | 0:28.4–0:33.5 | n06 "So how do you turn a tiny delay into a location?" | Back in the same plan. W1 glows and the long trip's W1 → him leg flashes once. A dashed candidate arc starts sweeping from W1 (centred on the wall spot), stops a third of the way round and resolves into a "?". The camera then pushes into W1's paint. | "?" (72) | Token only. | push into W1's paint → V3 | Adapt the S4.2 arc component. New: the "?" stop and the push. |

**Opening checkpoints:**

| Mark | Time |
|---|---|
| Obstruction | 0:02 |
| Real result on screen | 0:05.3 |
| "Their position estimate" | 0:11 |
| Route | 0:15–0:21 |
| Timeline | 0:21–0:24 |
| Timing sensor | 0:24–0:28 |
| Question and arc | 0:28–0:33 |

This is the brief's shot plan (0:00–0:04, 0:04–0:11, 0:11–0:18, 0:18–0:24, 0:24–0:30), running about 3 s later from
the route onward because the evidence holds longer. Retime from the takes.

## V3 · Mirror versus paint · 0:33.5–0:55.5 · n07, n08, s11, n09

**Teaches:** a mirror would keep the picture; paint throws light every which way; what survives is timing.
**Sound:** quieter bed; mirror ting; the duck's squash; a soft glow tone on "tiny lamp".

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V3.1 | 0:33.5–0:38.2 | n07 "First, a puzzle: why does a plain wall work at all?" | From inside W1's paint, pull back out to the raised room view: bare wall, the sensor, him behind the partition. | question title "What survives the bounce?" (64) | The guesser leans on the partition and looks at the bare wall, untroubled (his belief). | cut on "here" | Adapt the S2.2 raised framing (CAM_A). |
| V3.2 | 0:38.2–0:41.9 | n08 "Put a mirror here, and our friend is simply visible." | **The mirror comparison.** On "here" a framed mirror panel slides onto the wall at x 1.9–2.6 m (specular point about 2.14 m). One pulse runs sensor → mirror → him and back, with "in = out" angle marks for 1 s. The mirror shows his back, the side facing the wall. | "mirror" (64) · "in = out" marks | The checker's pointer taps the mirror. J2 on "visible": he ducks (anticipation, squash, mitts clamped on his crown); hold 0.5 s. | continuous | S2.2 as built (mirror slide, J2). The S2.1 bench is dropped. |
| V3.3 | 0:41.9–0:50.1 | s11 | The mirror slides off and he stands up, relieved. A magnifier lands on the bare wall and irises into the **paint cross-section**: one ray hits the bumps and sprays every which way; neighbouring spots spray too; a ghost mirror ray fades for comparison. On "tiny lamp" each spot glows. | "rough up close" (64) · "tiny lamp (our analogy)" (48) | The guesser's relief (shown, not said). | iris out | S2.3 + S2_Section as built. |
| V3.4 | 0:50.1–0:55.5 | n09 "Everything coming back is a blend of many paths. What survives is timing." | Room at tilt 0 (S2.4 framing, without the confetti column). Paths from his head, shoulder and feet run by three different wall spots and merge into one blip at the sensor. The blip drops onto the shared timeline rising from below, as one tick at one time. | "what survives: timing" (64) | The guesser glances at the wall, uneasy. | timeline rises to fill the frame | Adapt S2.4: the postcard and confetti are cut (S2_Postcard unused); the bars become the shared timeline. |

## V4 · Later, weaker, and real · 0:55.5–1:20.6 · s14, s15, s16

**Teaches:** the hidden echo arrives later and far weaker; here it is in real data.
**Sound:** bed thins; the pulse motif fades a little at each bounce; a short music drop before the real board; a modest
lift as the bump appears.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V4.1 | 0:55.5–1:02.2 | s14 | **The shared timeline, full frame**, with a five-icon route strip above it (sensor, wall, him, wall, sensor). One pulse runs the strip and thins at each bounce. The teal one-bounce spike rises tall; the saffron three-bounce bump lands later, tiny, ringed on "tiny". | "1 bounce" · "3 bounces" (64) · "not to scale · far weaker" (34) | none | hard switch on "This is real data" | Rebuild: S3.1's stop tags become icons; S3.2's block card and S3.1's dot tally are dropped (D19: no counts). |
| V4.2 | 1:02.2–1:16.0 | s15 | **The real waveform, full frame**, headline "Real data", the 3×3 zone icon at left. The trace is drawn on the first frame (no blank-axis build): the authors' raw counts, centre zone, linear axis, straight lines between the 128 bins, no smoothing. The wall echo is named. On "zoom in to see" a magnifier slides over the tail and its factor animates ×1 → ×250 (the tab shows the factor in use; the time axis is unchanged; zero stays on the baseline) until the bump appears about 3.7 ns after the spike. The blip before the spike is not annotated. | "Real data" (64) · "wall echo" (48) · "zoom ×250" tab · "hundreds of times weaker (this capture)" (48) · source (34): "authors' released raw counts · different sensor: 3×3 zones · centre zone" | none | continuous | S3_EchoBoard + S3_ZoneBox as built (no printed "576×"). |
| V4.3 | 1:16.0–1:20.6 | s16 | Push toward the bump. It is ringed; a dimension line runs spike → bump; a small generic route icon (sensor → wall → hidden object → wall → sensor, not our room) sits beside it, tying the bump to the long way round. | "≈ 3.7 ns later" · "≈ 1.1 m extra, there and back" (48) | The checker's pointer enters and taps the ring: the researcher points at the result. | **graphic match:** the ring on the bump cuts to a same-size ring round W1 in our room, which folds at once (V5.1) | S3.3 as built; new route icon. |

## V5 · Delay to distance to place · 1:20.6–2:21.9 · n10, n11, s18–s23, n12

**Teaches:** one delay gives one distance from the wall spot (an arc, not a direction); a second spot gives a crossing;
fuzz makes bands and a patch; spread-out spots shrink it; a computer searches positions using assumptions; so the
answer is a likely location.
**Sound:** the quietest bed; one arc-draw tick per arc; a small "uh-oh" sting on J3b.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V5.1 | 1:20.6–1:26.5 | n10 "Farther from where? Simplify it: …" | **The signature fold**: the room folds flat into the full-frame plan and the characters become tokens. W1 glows. On "one spot on the wall" the sensor's wedge narrows to one beam on W1, and the confocal route draws once, out and back on the same lines: S → W1 → him → W1 → S. | question title "How does a delay become a location?" (64) · chip "simplified picture · sends and listens at one spot" (40), held through V5.7 | tokens | continuous | S4.1 fold as built. |
| V5.2 | 1:26.5–1:37.4 | n11 (the round trip) | **One ruler on the W1 → him leg.** A pulse runs out along it and back along the same line; a path meter beside it fills two strokes for each stroke of distance, then the ruler folds in half at his token. | "1 ns ≈ 30 cm of travel" (64), then "there and back → ≈ 15 cm farther" (64) | token | continuous | Rebuild from S1.7's light ruler and S4.2's ruler: one ruler instead of repeated rotations. |
| V5.3 | 1:37.4–1:43.5 | s18 | **The worked example**, one step at a time, each step replacing the last: "≈ 8.9 ns later" → "≈ 2.65 m there and back" → "≈ 1.33 m each way". The ruler swings out once from W1 to him; on "Not which direction" it wavers. | the chain (64) · "illustrative · our room" (30) | token | continuous | Adapt S4.2 (its "1.33 m each way" label becomes the third step). |
| V5.4 | 1:43.5–1:47.5 | s19 | The arc sweeps from W1, dashed (a constraint, not a light path; it may cross the partition), with faint copies of him along it. | "distance known · direction unknown" (48) | **J3a** in the S4 face inset (lower right, above y 950): he relaxes and leans on the partition. His bet: a distance can't pin him down. | continuous | S4.2 + S4_Inset as built. |
| V5.5 | 1:47.5–1:55.7 | s20 | W4 lights; one ruler swing; a second arc; the two cross at his token; their other crossing, behind the wall, greys out. The plan is framed wide enough to include the far side of the wall, so there is no camera rise. | "second spot" (48) · "behind the wall: impossible" (40) | The checker's pointer taps the crossing on "one place". **J3b**: his smile drops. | continuous | Adapt S4.3 (rise removed). |
| V5.6 | 1:55.7–2:01.9 | s21 | Each arc thickens into a band (one 250 ps bin, ±3.75 cm); their overlap fills as a small patch. | "fuzzy timing → band" (48) · "illustrative" (30) | token | continuous | S4.4 as built. |
| V5.7 | 2:01.9–2:07.4 | s22 | The two spots slide together (W2, W3) and the patch stretches long and blurry (1.45 × 0.28 m); they slide apart (W1, W4) and it shrinks (0.35 × 0.07 m). E calls back this rule. | "close → long, blurry" then "spread out → smaller" (48) | token | continuous | S4.5 as built. |
| V5.8 | 2:07.4–2:18.0 | s23 | Four spots flash; candidate dots scatter over the hidden side. One candidate's predicted echo ticks are laid against the measured ticks (a miss fades, a match stays); poor matches fade and the rest cluster on him. | "candidate positions" (48) · card "assumption: one small object" (40) | token | continuous | Adapt S4.6 (adds the predicted-versus-measured ticks). |
| V5.9 | 2:18.0–2:21.9 | n12 | The cluster settles into a soft likely-location blob inside a teal ring, never a dot. | "likely location" (48) | token | **hard, visible switch** on "rough shape" → V6 | Adapt S4.7; the crossed-out photo frame is cut. |

## V6 · The real U · 2:21.9–2:30.5 · n13, s37

**Teaches:** more measurements, from known positions, really do outline a hidden shape, roughly.
**Sound:** a beat of near-silence on the switch, then a modest lift as the U resolves.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V6.1 | 2:21.9–2:23.9 | n13 "And here's a real one." | The visible switch: a new evidence board (house style, new palette, headline "Real data") with the same 3×3 zone icon as the waveform and an empty 6 × 6 position grid. | "Real data" (64) · "same 3×3 sensor" (48) | none | continuous | S7.2 board as built. |
| V6.2 | 2:23.9–2:30.5 | s37 + 0.9 s hold | **The U builds from real data.** The zone box steps through the 36 preset positions (6 × 6 back-and-forth raster) while the front view builds from the real partial sums, one image per position (k = 1 → 36, no in-between frames), ending on the authors' full result; hold on the finished U. Not morphed from our arcs, no person token, not in our room's coordinates. | "36 preset positions · object held still" (48) · "rough outline" (48) · source (34): "authors' released data and code, run by us" | In the hold, the checker's pointer taps the U's base. | the board rolls up like a plan sheet and drops onto a museum shelf | S7.2 (RasterPanel, UFront) moved from v1 5:06; label "known" → "preset"; note the display gamma 3 in the record. |

## V7 · Museum bridge · 2:30.5–3:07.4 · n14, n15, s30, s31, n16

**Teaches:** this began on research equipment; a cheap sensor already tracked hidden objects in 2021; in 2026 a team
tried phone-grade sensors with a new model.
**Sound:** a brisker variation of the pulse; rope clip; tiny clink; padlock click.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V7.1 | 2:30.5–2:40.0 | n14 (2012, 2021) | The rolled board lands on the first ledge. A brisk truck past the exhibits, about 3 s each: "2012 · MIT" (a table-sized rig, a teal mannequin outline rising); the 2018 plate in passing; "2021 · Wisconsin + Milan" (big laser, strip detector, a monitor playing a blobby live video). Plates name year and team only. | chapter title "How new is this?" (64, 2 s, not spoken) · the plates (48) · "illustrations based on the papers" (30) | none | continuous truck | Adapt S5.1–S5.3 (S5_Museum, S5_Exhibits): faster; no laptop "1 s", wall clock, "5 frames/s" counter or equipment names. |
| V7.2 | 2:40.0–2:45.4 | n15 | A velvet rope clips across the exhibits under a sign; on "cheap sensor" a spotlight finds the stool at the shelf's end with a fingertip-sized sensor board. | "research equipment" (48) · "2021 · tracking with a cheap sensor kit (Callenberg et al.)" (40) | none | spotlight swings | S5.4 as built; the stool card stays out of every later framing (S5 review defect 1). |
| V7.3 | 2:45.4–2:55.7 | s30 | **The museum spotlight isolates the modern sensor.** The checker's arm sets her small sensor on the empty fourth plinth (comic scale). Then it matches to two drawn hardware types side by side: a phone-grade research module (an uncountable dot field, no brand, no 10 × 10 grid) and the off-the-shelf kit. | plate "published 2026 · MIT + Dartmouth" (40) · "time-of-flight sensors (LiDAR)" (48) · "smartphone-grade research device" · "off-the-shelf kit" (40) | The checker's arm only (hand contact on the plinth). | cut | Adapt S6.1; S6_ResearchModule with its dot grid made uncountable (D33). |
| V7.4 | 2:55.7–3:00.4 | s31 | A generic phone (no brand, no recognisable camera layout) slides in; a padlock closes over "raw data". | "not on your phone (yet)" (48) · "per the lead researcher, in interviews" (30) | none | cut back to the plinth | S6.2 as built. |
| V7.5 | 3:00.4–3:07.4 | n16 "Their new idea: …" | Wide on the plinth: a stack of faint frames fans out from the sensor like cards, each with a small "what moved" arrow. | "their new idea (2026)" (48) | none | spotlight tightens on the sensor | New, from S6.4's frame cards. |

## V8 · Small-sensor problems · 3:07.4–3:28.1 · n17, n18, s33

**Teaches:** a small sensor gives fainter echoes, few bunched listening spots and a jiggle; stacking many frames helps.
**Sound:** quieter bed; a small rattle on the jiggle; shutter clicks on the stack.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V8.1 | 3:07.4–3:10.7 | n17 "Why would a smaller, cheaper sensor need that?" | A tight spotlight on the plinth sensor. | question title "Why is a cheap sensor harder?" (64) | none | cut | Adapt S6.1 framing. |
| V8.2 | 3:10.7–3:21.2 | n18 (three problems) | **Three full-frame beats, one problem at a time** (no stacked cards): (1) "Weak lasers": a dim beam; on the shared timeline the saffron bump shrinks further. (2) "about a hundred pixels": the research module's dot field, then, for 1.5 s, its listening spots bunched on a small wall patch in our plan give the long, blurry patch from V5.7. (3) "jiggles": the sensor is lifted off its stand and wobbles. | one per beat: "weak laser → fainter echo" (64) · "≈ 100 pixels (their phone-grade device)" (48) + "bunched spots → blurry" (48) · "handheld → jiggle" (48) | The checker lifts the sensor (hand contact, small wobble, settle). | cut | Adapt S6.3 (dim beam, module, lift), re-cut as single beats; the S4.5 patch as the callback; the shared timeline. |
| V8.3 | 3:21.2–3:28.1 | s33 | Six dim, grainy plan frames slide into a stack and merge into one clearer card. | "our analogy: night mode" (40) | none | the card grows into the full-frame plan | S6.4 as built. |

## V9 · Motion-aware fusion · 3:28.1–4:09.5 · n19, n20, n21, n22, n23

**Teaches:** between frames the person's echo shifts and the sensor's listening spots move; plain adding smears; the
model solves one unknown at a time (a still object with the sensor at known positions; or a still sensor with guesses
that drift), so the estimate keeps up.
**Sound:** quiet bed; the pulse motif per frame; a soft smear swish (one only); a small deflate on "keeps up".

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V9.1 | 3:28.1–3:37.1 | n19 "The catch: things move between frames. …" | **Full-frame plan**, sensor on its stand. The two changes are shown separately. First his token steps H_A → H_B (11 cm) and his echo tick slides along a mini timeline at the plan's lower edge (above y 950). Then the sensor shifts and its four listening spots slide to new places on the wall. | "he moves → echo shifts" (48) · "sensor moves → spots move" (48) · chip "illustration" (30) | The token starts pacing; in the face inset he grins. His plan: keep moving. | continuous | Adapt S6.5 (step and jiggle), re-timed one change at a time. |
| V9.2 | 3:37.1–3:44.8 | n20 "Just add them up, …" | The two frames stacked as they are: bands from both positions overlap into a coral streak covering both (I1 frame B2, about 0.86 m). Then a 1 s gag on "long exposure": a streaky long-exposure snapshot of the guesser mid-walk. | "just adding → smear" (48) · "illustrative" (30) | The guesser in the snapshot; the inset grin widens. | cut | S6.5 smear + S6_Photo as built. |
| V9.3 | 3:44.8–3:48.7 | n21 "So their model solves for one unknown at a time." | Three large icons, "shape" · "position" · "sensor"; padlocks close on two while the third stays free, two quick cycles. | "one unknown at a time" (64) | none | cut | New (simple vector). |
| V9.4 | 3:48.7–3:58.2 | n22 (build a shape) | **One full-frame panel, no split.** A still object behind the partition; the sensor slides on a rail from frame A to frame B1 (the layout's two sensor frames; no hand). B1's listening spots appear along the wall and the long patch shrinks modestly (about 30%, never to a dot). On "the U", a framed 1.5 s thumbnail of the real U board, its "Real data · same 3×3 sensor" header intact, sits in the top-right corner: a card, not placed in our room. | "object still" (48) · "sensor on a rail, at known positions" (48) | none | cut | Adapt S6.6 left panel to full frame; new rail and thumbnail card. |
| V9.5 | 3:58.2–4:09.5 | n23 (follow a person) | **Full-frame plan, sensor on its stand, never in a hand.** His token walks H_A → H_B → H_C → H_D. Each frame the candidate cloud drifts a little, poor guesses fade, and the rest follow him. Then two panels, introduced one at a time (left alone for 1 s, then right): left "just adding → smear" (from V9.2); right "tracking what moved → keeps up", whose region contains his new position. | "sensor still · person moves" (48), then the two panel titles (48) · small "handheld: shown only for locating the sensor itself (reported)" (30) | In the inset he deflates on "keeps up". | **match cut:** the right panel's layout (sensor left, partition, hidden side) → the real kit board, with the visible switch to "Real data" | Adapt S6.6 right panel + S6_PlanView panels. |

## V10 · The kit clip and its conditions · 4:09.5–4:41.0 · n24, n25, n26, n27, n28

**Teaches:** what the cheap kit actually did, and the conditions beside it; what another test reports.
**Sound:** a modest lift on the board's return; quiet under the conditions; one stamp thud.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V10.1 | 4:09.5–4:14.2 | n24 "So what can it actually do, and where does it fail?" | The opening's real board, full frame. The stored estimate replays from index 6, every 2nd frame (the same mapping as V1.3). | question title "What can it do? Where does it fail?" (64) · "sped up" (34) · the V1 source line | none | continuous | V1.3 board. |
| V10.2 | 4:14.2–4:24.3 | n25 "Take our opening clip: …" | The board gains the provenance the opening left out, one item at a time, in a right-hand column beside the track. | "ST sensor kit · 16 zones · held still · not the phone-grade device" (40) · "under US$100 (authors' figure)" (40) · "setup: flat wall + empty-room scan first" (40) · counter "frame N of 475" (30; frame numbers, never seconds) · chip (30): "our check: their code + their data → matched their saved results · a software check, not a new experiment" | none | cut | Adapt the S7.1 conditions column (S7_Plots TrackPlot switched to `stored_xz`). No "about 100 pixels" here. |
| V10.3 | 4:24.3–4:31.6 | n26 "Many of their tests had help: …" | A plan close-up, not the room camera: a target with a reflective strip that faces the wall and the incoming light. A pulse arrives and the returning pulse fattens. | "reflective material: far more light back" (48) | none (a generic target, not the guesser) | cut | Adapt S7.3's strip and pulse, re-staged in plan so the strip can face the light (D35). The shoo gag and empty-room scan are cut. |
| V10.4 | 4:31.6–4:34.2 | n27 "Our clip's files don't say if the walker wore any." | Back on the kit board: a small stamp lands beside the track. | "clothing: not recorded" (40) | none | cut | S7.3 stamp. |
| V10.5 | 4:34.2–4:41.0 | n28 "But in a separate test, …" | A framed card in evidence style, plainly a drawing: a neutral grey "their sensor" (not the kit, no tripod, no checker) and a generic person in everyday clothes walking behind a partition, with a film strip ticking. | "Reported by the authors · ordinary clothes · 30 frames/s capture" (40) · "a separate test, not our kit clip · different device · data not released" (34) · "our drawing" (30) | The cast "person" (never the guesser). | **match cut:** the card's partition becomes the warehouse's blind corner in the same screen position | Adapt S7.4a with the guesser replaced. S7.4b (museum slot, "independent reproduction" plaque) is dropped. |

## V11 · Warehouse: potential use and limits · 4:41.0–5:14.6 · s40, n29, s42, s43, n30

**Teaches:** one potential use, its coarse benefit, what is still hard, and that it is not a safety system.
**Sound:** robot motor and brake; quiet bed under the limits; a soft settle on "not a safety system".

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V11.1 | 4:41.0–4:46.1 | s40 | Warehouse front view, locked wide. The delivery robot rolls toward the blind aisle corner on "Picture" (no 1.4 s wait). | "potential use" (48, top-left, from this cut to the cut to V12) · "illustration" (30) | Robot, cautious face. | tilt to plan | Adapt S8.1 (start re-timed). |
| V11.2 | 4:46.1–4:54.5 | n29 | Plan of the junction: the junction wall spot lights; a pulse runs robot → wall spot → hidden aisle → wall spot → robot in straight segments around the corner's end, never through shelving; a faint blob appears where the cast "person" walks in the hidden aisle. No range number. | "suitable wall" (48) · "potential use" held | robot token, person token | tilt back | S8.2 as built. |
| V11.3 | 4:54.5–4:59.7 | s42 | Front view: the blob sits beyond the corner; the robot squints and brakes (settle). | "slow down" · "not who" (48) | The robot reacts to the clue. | cut | S8.3 as built. |
| V11.4 | 4:59.7–5:10.9 | s43 | **One full-frame tile per beat** (not a 2 × 2 grid), each on the warehouse plan: pulses fade before reaching the far aisle (short range); a dark wall swallows a pulse and a shiny one bounces it away; sunlight floods the sensor; a tiny chip sweats over numbers. Then the four shrink into a row. | each beat's words (48), one at a time · then "early-stage prototype (the researchers)" (48) | none | cut | Rebuild S8.4's board as sequential tiles (S8_Vignettes art). |
| V11.5 | 5:10.9–5:14.6 | n30 | Front view: the robot creeps on round the corner, slowly. | "not a safety system" (48) | robot | **hard cut**: the warehouse corner → the room partition, same screen position | Adapt S8.5 (no carton, no bumper gag). |

## V12 · Callback · 5:14.6–5:23.6 · n31, s47

**Teaches:** the takeaway (being out of sight still leaks clues), then the one callback gag.
**Sound:** the soft pulse motif once; the partition scrape; the readout blip-off; a deadpan beat in complete musical silence under the J4 hold (lead decision after review r1, V2-R1-39: the gag plays dry); the music's resolve starts on the cut to the end screen.

| Shot | Time | Line / cue | Main teaching visual | Labels | Cast (role) | Out | Reuse / new |
|---|---|---|---|---|---|---|---|
| V12.1 | 5:14.6–5:17.8 | n31 | Raised room view, the opening's room and orientation. One slowed round trip via **W3** (no number) around the partition's end; the sensor's readout shows a soft blob. | none | The guesser gulps. | continuous | Adapt S9.2: one trip instead of two. No PlanCard by default; if the W3 → him leg does not read as going around the end at the raised tilt, use S9.2's reviewed card for this beat only. |
| V12.2 | 5:17.8–5:23.6 | s47 + 3.0 s hold | He pushes the partition back until its far end meets the wall (anticipation, mitts on the panel, feet planted, settle). The paths now stop at it; the readout goes blank and holds 0.5 s so it reads first. **J4:** he turns smug, then the checker simply leans round the near end and looks at him; he deflates. | none | His one correct idea, undone by the low-tech look. | **hard cut** on the beat to V13 | Adapt S9.3 (R4 rig shot): hold 5.3 → 3.0 s; recheck foot contacts and the lean against the partition. |

## V13 · End screen · 5:23.6–5:33.6 (10.0 s) · s48

Hard cut in on the J4 beat. The element space is clear from the first frame. s48 starts 0.2 s in and ends at about
+7.0 s; the music resolves to the last frame (no silent tail).

**Layout** (1920×1080; double for 4K). Everything is still after a 0.4 s settle; one look-and-blink in the callback art in
the last 3 s.

| Region | Box (px) | Share of frame | Content and rule |
|---|---|---|---|
| Background | full frame | | The channel's warm yellow (END_CARD.bg `#FFC744`), flat. |
| Wordmark | x 120–900, y 96–260 | top-left | FUTURE GOT WEIRD (Fredoka 700, 112 px, GOT in coral, saffron-deep underline bar). Never under an element. |
| Tagline | x 120–900, y 276–330 | | "the strange future, explained" (44 px). |
| "watch next" label | x 1000–1500, y 214–270 | | 48 px, ink, outside the video element. |
| **Video element guide** | **x 1000–1800, y 290–740** (800 × 450, 16:9) | x 52.1–93.8 %, y 26.9–68.5 % | A plain lighter panel with soft corners and nothing inside it: a layout guide, not a clickable thumbnail. |
| **Subscribe element guide** | **circle, centre (430, 600), diameter 300** (x 280–580, y 450–750) | centre 22.4 % across, 55.6 % down | A plain lighter disc, empty, larger than YouTube's element so small placement differences do not show. No arrow, no "click here". |
| Callback art | x 640–940, y 560–930 | | A small coral partition with the guesser peeking round its end, glancing toward the video guide. Outside both guides and the caption band. |
| Keep clear | 24 px round both guides; y 950–1080 across the frame | bottom 12 % | Element hover states; s48's caption in the standard band. |

**Timing and placement instructions for the owner** (YouTube Studio → Content → this video → Editor → End screen):
1. **Element 1, Video:** the channel's other episode, or "Best for viewer". Drag and resize it to cover the panel
   guide, x 1000–1800, y 290–740 on a 1920×1080 frame (YouTube may enforce its own minimum size; keep the element
   inside the guide).
2. **Element 2, Subscribe:** centre it on the disc guide at (430, 600).
3. **Both elements** run from the end-screen start to the end of the video: the last 10.0 s. Take the exact start from
   the locked render (planning estimate 5:23.6; YouTube allows 5–20 s).
4. **Phone check:** in the preview at phone size, the wordmark, the callback art and any caption must not sit under
   either element.

**Build:** rebuild `S9_EndCard` (its v1 layout put everything in the top third with no guides). Use the existing
wordmark and the guesser rig (a peek pose from S9) for the callback art.

---

## Build summary

| Kind | Items |
|---|---|
| **Reused as built** | S2.3 + S2_Section; S3_EchoBoard + S3_ZoneBox; S4.1 fold, S4.4, S4.5; S4_Inset (J3a, J3b, V9 grin and deflate); S5.4 rope and stool; S6.2 phone; S6.4 frame stack; S6_Photo; S7.2 U (RasterPanel, UFront); S8.2, S8.3. |
| **Adapted** | S1.1 (1 s sneak + X); S1.2; S1_TrackingBoard (`stored_xz`, three labels, no conditions box; later with the conditions column); S2.2 (no bench), S2.4 (no postcard); S4.2, S4.3 (no rise), S4.6, S4.7 (no photo frame); S5.1–S5.3 (faster, plates only); S6.1 (two hardware types), S6_ResearchModule (uncountable dots), S6.3 (single beats), S6.5, S6.6 (full-frame modes; rail A → B1; stand); S7.3 strip (plan close-up); S7.4a (generic person); S8.1, S8.5; S9.2 (one W3 trip), S9.3 (3.0 s hold). |
| **New** | The shared full-frame arrival timeline (V2.2, V3.4, V4.1, V8.2); the two-pulse plan race (V2.1); the sensor close-up framing (V2.3); the arc tease with "?" (V2.4); the question-title overlay; the one-ruler round trip (V5.2); the generic route icon (V4.3); the frame-stack fan (V7.5); the one-unknown icons with padlocks (V9.3); the rail and the U thumbnail card (V9.4); the sequential limit tiles (V11.4); the end screen (V13). |
| **Dropped** | S1.4 rise + PlanCard; S1.5; the S1.6 race, "≈ 7 ns" tag and webcam; the S1.7 ruler (rebuilt as V5.2); S2.1 bench; the S2.4 postcard and confetti; the S3.1 dot tally; the S3.2 block card; the S4.7 photo frame; the S5.2 exhibit details; the S6.3 10 × 10 grid; the S7.3 shoo and scan; S7.4b; the S8.5 carton and bumper; S9.1; the S9.4 card. |

**Risks to watch in review:**
- The V1.3 dot size and trail at 390 px.
- The V2.1 race reading as "later" at phone size.
- V5.5 framing without the camera rise.
- The V9.4 thumbnail never reading as part of our room.
- The V12.1 W3 path legibility without the PlanCard.
- Every new-to-old voice junction listed in `SCRIPT_V2.md`.

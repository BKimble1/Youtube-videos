# Script review: How Cameras See Around Corners (v1, 2026-10-08)

This is a synthesis of four reviews of `script/SCRIPT.md` v1 (47 lines, 1,062 words): facts, clarity, voice and visual. It checks them against the six research NOTES files, `research/claims.csv`, `DIRECTION.md`, `storyboard/STORYBOARD.md`, `research/geometry/layout.json` and the launch brief (sections 2 to 4).

**Outcome**
- **Blockers.** Both are resolved.
  - s03 (date). "A 2026 experiment" becomes "a study published in 2026".
  - s04 (staging). The partition-to-wall gap must be visible, and the wording now points at it.
- **Facts-lens should-fix items.** All are accepted. None was rejected, because every objection is supported by the notes cited.
- **Revised script.** 48 lines (s30a is new) and **1,097 spoken words**, counted with `words()` from `tools/v02_script.py`, the same counter that gives v1 1,062. A counter that splits hyphenated words gives about 1,107.
- **Jokes.** The four jokes are kept in place (J1 s01, J2 s10, J3 s20, J4 s46). No reviewer showed one failing. J2's problem was staging, which is fixed below.
- **Act 1.** It is now 175 words (v1: 180). "Timing is distance" lands at about 0:51 at the measured TTS pace (about 200 wpm). At 165 wpm it lands at about 1:01, gaps included.
- **Act 4 (s25 to s38).** It grows from 363 to 404 words, because separating the devices, the conditions and the phone caveat costs words. This is a deliberate trade against the brief's 1:40 planning estimate. Acts 2 and 3 absorb part of the increase.
- **Runtime.** About 6:00 of speech and scripted gaps at the measured pace, or 7:10 at 165 wpm, before designed visual holds.

Reviewer key: **F** facts, **C** clarity, **Vo** voice, **Vi** visual. "Delivery layer" means `tools/v02_script.py` tts/pause fields, not display text.

## 1. Blocker and should-fix issues (deduplicated) with verdicts

| # | Line | Sev | By | Issue (merged) | Verdict | Resolution and reason |
|---|---|---|---|---|---|---|
| 1 | s03 | blocker | F, C, Vo, Vi | "Real data from a 2026 experiment" dates the capture. The ST person-tracking data was first committed 2025-10-20 and the paper was received 28 Aug 2025, so 2026 is only the publication year (final_paper §1; code_reproduction §2; brief §2). The plot is unexplained, and the overhead view is not yet taught. The released plot is mirrored relative to the room. The 700 ms pause is too short. The chip implies raw output. | **Accept (merged)** | Now reads: "from a study published in 2026: seen from above, a small sensor aimed at a wall, tracking someone it never saw directly."<br>Chips: headline "Real measurements · published 2026"; conditions "authors' released data · evaluation-kit sensor, held still · processed with the authors' code"; marker label "estimated position". C's "bright patch is the best estimate" moves to that label to save act-1 words (the board shows a tracked marker, not a patch).<br>Re-plot `fig3` with x reversed and the axis labelled so sensor is left, wall at top and person right; note "axis mirrored to match room" in the source chip. Pause raised to 1100 ms. |
| 2 | s04 | blocker | Vi, C | In the oblique room view (KitRoom frames 0/60/92) the 0.65 m gap between partition and wall is hidden, so the drawn light appears to cross the partition exactly as the line says it doesn't. "Corner" is never spoken until s25. | **Accept** | Shot fix is required for s04 and s05: raise the tilt to about 0.3 to 0.5, or cut to a high three-quarter view, so the floor gap is plainly visible, and route W to H through the gap clear of the screen silhouette.<br>Wording: "Here's the trick for seeing around corners ... It goes around the end, by way of the wall." This combines C's corner and Vi's end-of-partition. |
| 3 | global | should_fix | F | Phones are mentioned repeatedly, but the script never says a phone can't do this. The lead author says makers would need to release raw data, "which they often don't do", and IEEE Spectrum says raw LiDAR data is restricted (context §2; final_paper §5; brief §2). | **Accept** | New line s30a, placed where phones are named: "Don't expect your phone to do this yet: phone makers often keep the raw data private." Placing it at s30 (C's suggestion) rather than s37 (F's suggestion) corrects the inference before s31 talks about a smartphone-grade device. LiDAR also moved from s07 to s30, which removes one phone mention from act 1. |
| 4 | global | should_fix | C | Act 1 overruns: "timing is distance" at 1:05 to 1:15, against the brief's 1:00. | **Modify** | Act 1 is cut to 175 words.<br>Cuts: s01 and s05 trimmed; LiDAR moved to s30; s07 shortened.<br>Additions: s03, s04 and s06 grew only where blockers and should-fixes required it.<br>Timing: estimated 0:51 to 1:01 with gaps. Confirm from first takes. |
| 5 | global | should_fix | C (also F, Vi word notes) | The proposed rewrites would push the script far over 1,100 words. | **Accept** | Every rewrite below was cut to fit. Final count is 1,097. Offsetting trims include s10, s11, s13, s14, s17, s22, s23, s32, s39 and s41, plus clarity's trim list where it did not cost accuracy. |
| 6 | global | should_fix | Vo | Tags placed mid-sentence: s10 [dryly] visible, s20 [slowly], s41 [slowly] slow down. [energetic] (s17) bleeds into s19. [curious] (s02) contradicts its direction. [short pause] (s29) is not a delivery. 18 tags in total, 7 of them wry. | **Accept (delivery layer)** | Keep 11 tags, all at sentence starts:<br>s01 [lightly amused]; s04 [warmly]; s06 [dryly] on "A few billionths"; s09 [curious]; s10 [dryly] on "Put a mirror here"; s15 [softly] on "In this capture"; s27 [dryly] on "Measuring still took"; s31 [lightly amused] on "And if you hold one"; s39 [curious]; s44 [lightly amused]; s47 [warmly].<br>Delete the rest. |
| 7 | global | should_fix | Vo | 17 lines use an ellipsis before the last clause, which gives a uniform cadence and trailing pitch. | **Accept (delivery layer)** | Keep ellipses only where the beat is the point: s03 "And yet…", s10 "here…", s12 "paths…", s18 "direction…" and s20 "just… one place". Use commas or full stops elsewhere. s13's five stops become full stops in the TTS. |
| 8 | global | should_fix | Vo | Repeated shapes and words: "X, not Y", "real" ×5, "So" opening s14/s17/s19, "Here's" ×5. | **Accept** | Fixed line by line.<br>In the revised script, "real" appears twice (s03, s15), plus "really" in s21 and s46. "So" opens no line. "Here's" opens one line (s04). "X, not Y" remains only in s24 and s43. |
| 9 | global | should_fix | Vi | J1 to J3 fall in the first half, then nothing until J4. About four minutes pass with no character reaction. Vi proposes demoting J2 to a quick duck and promoting the s37 empty-room gag. | **Modify** | Keep the four jokes where they are: no joke was shown to fail. J2's geometry problem is fixed in row 16, and it keeps its short 800 ms hold.<br>Fill the gap with acting beats, not new jokes:<br>• s30: the checker places her sensor beside the big rigs, done with a reach.<br>• s31: she lifts it off its stand and it jiggles.<br>• s33 and s34: the tokens get faces.<br>• s37: the empty-room scan is acted out. The hider is shooed out, the readout records and he sidles back. This explains the background capture, so it is a reaction beat rather than a fifth joke. |
| 10 | global | should_fix | Vi | Act 4 runs long, about 2:30 against a 1:40 plan, with text-heavy boards. One sensor prop stands for three devices. | **Accept device separation; reject the length cut** | Separate the three devices visually:<br>• The checker's prop is the ST kit.<br>• s31 shows a separate phone-shaped module labelled "smartphone-grade device (data not released)" with a grid of about 100 dots.<br>• The s15 and s36 sensor gets its own small 3×3 box and chip, the same box in both shots.<br>Act 4 still grows (404 words) because the facts fixes need the words, and the brief's act times are planning estimates. s37 and s38 become acted beats rather than cards (rows 37 and 38). |
| 11 | s02 | should_fix | Vi, Vo | The opening data was captured with the sensor fixed, but the plan has the checker holding it, which contradicts the "held still" chip. The [curious] tag contradicts "matter-of-fact". | **Accept** | Put the sensor on a small stand for acts 1 to 3, with the checker beside it reading the back readout. She lifts it at s31.<br>Remove [curious]. Wording now opens "That sensor", with a readout blink on "sensor", because s01 was shortened (C global). |
| 12 | s05 | should_fix | Vo (also F, C optional) | "A little ... a tiny bit" spends s06's undercut. "Some of it hits the wall" implies part of the flash misses it. "Comes back the same way" implies the light retraces its path exactly (non-confocal paths: geometry §5.2 and §5.3). | **Accept (merged)** | Now reads: "The sensor fires a short, invisible flash. The wall scatters it, part reaches the hidden person, and a tiny bit bounces back: wall, then sensor."<br>"Invisible" is from C's optional note and is supported (see facts list, item 4). |
| 13 | s06 | should_fix | Vi | "Arrives a little later" invites "later than what?" The wall echo is never named. | **Accept** | Now reads: "That trip is longer than a quick bounce off the wall, so it arrives a little later." This sets up s14 and s15. |
| 14 | s07 | should_fix | C (Vo optional) | "Time-of-flight" and "LiDAR" are stacked and "time-of-flight" is never explained. The line also never ties the sensor to "cameras" in the title. | **Modify** | Now reads: "This takes a time-of-flight sensor, a camera that clocks its own light's round trip." The authors' own videos label the device "camera" (manuscript §2A). The LiDAR name moves to s30, beside the sensors that carry it. C's "camera-like device" is shortened to "a camera". |
| 15 | s08 | should_fix | C, Vo (Vi optional) | "Nanosecond" isn't linked to s06's "billionths". 30 cm means little to US ears. | **Accept / modify** | Now reads: "Light travels about thirty centimetres in a nanosecond, one billionth of a second ... a clue to where he is." "Roughly a foot" goes on the ruler label ("1 nanosecond ≈ 30 cm ≈ 1 ft"), not into the act-1 word count. |
| 16 | s10 | should_fix | Vi, Vo | Geometry: the reflection point for S (1.65, 0.9) to H (2.6, 0.85) is x = 2.14 m, which I verified from layout.json. Art request A06 puts the mirror on x 0 to 2 m, so J2 fails as staged. The storyboard turns the wall into a mirror before "Put a mirror here". The [dryly] tag sits mid-sentence. | **Accept** | Mirror panel goes on the wall at about x 1.9 to 2.6 m and slides on exactly on "here". Show the reveal over the checker's shoulder. Use the MirrorBench for s09 and the angle rule. Move the tag to the sentence start.<br>The line drops "A mirror is orderly" (C trim) and keeps "Put a mirror here" (not Vo's "there he is", which is optional). |
| 17 | s12 | should_fix | C, Vo, Vi | "Every return" is jargon. The line doesn't say why the wall is worse than confetti. Nothing on screen shows "a mix of many paths". | **Accept (merged)** | Now reads: "...It's worse than that. Confetti still holds bits of picture. Everything coming back is a blend of many paths. What survives is timing."<br>Added "his image as" to bridge from s11's new "tiny lamp". Visual: cut from the confetti to the room, where several paths (head, shoulder, feet, by way of different wall spots) merge into one blip, then into timing bars. |
| 18 | s13 | should_fix | Vo, Vi | "One useful path" is vague, and the four ellipses tire the rhythm. The storyboard tilts to plan view here, which spends s17's signature reveal. | **Accept** | Now reads: "Follow the path that matters: sensor, wall, person, wall, sensor." Use full stops in the TTS.<br>Keep the room or side view and save the first tilt for s17. Make the replay about loss: a cluster of dots drops most of its members at each bounce (labelled illustrative). |
| 19 | s14 | should_fix | C, Vo | "So" asks the viewer to infer why the wall dominates. "Most" repeats s13. | **Accept** | Now reads: "Nearly everything coming back bounced once, off the wall. Our friend's echo bounced three times, so it's tiny." |
| 20 | s15 | should_fix | F, C, Vo, Vi | Following "the echo from the hidden person", viewers will read the bump as the person's echo. It is actually the ams 3×3-zone sensor's raw histogram from the static-U experiment, not the ST kit (code_reproduction §0 item 3; C12). "One of the researchers' sensors" names people not yet met. "The wall's flash" sounds like the wall flashes. "Here" dangles. On a log axis the bump looks only 3 to 4× smaller. | **Accept (merged)** | Now reads: "This is real data from the same team, with a different sensor and hidden object: the wall's big echo, then, a few nanoseconds later, a bump you have to zoom in to see. In this capture, hundreds of times weaker."<br>"From the same team" is used rather than F's "from the same study", because the dataset's place in the final figures is unresolved (final_paper §5).<br>Visual: draw a linear axis first, then a labelled magnifier stretching the tail by the measured factor (256 to 576×, C12). Use log only afterwards, labelled. The axis label "time →" replaces C's spoken "time runs left to right". |
| 21 | s17 | should_fix | Vo (F optional) | [energetic] invites hype. "So" opens the line. "Sends" has no object. The 2D-only crossing is undeclared. | **Accept** | Now reads: "Let's turn timing into a map: the room from above, flattened, with one more simplification. The sensor flashes and listens at one spot on the wall."<br>Hold the "simplified picture (2D)" label through s22. |
| 22 | s19 | should_fix | C | By ear, nothing says why the shape is an arc. | **Accept** | Now reads: "He could be anywhere on this arc, all the same distance from that spot." The "So" opening is dropped (Vo). |
| 23 | s20 | should_fix | Vo (C, Vi optional) | [slowly] sits mid-sentence. "In front of the wall" is unclear by ear. The J3 sting needs more than 800 ms. | **Accept** | Now reads: "On this side of the wall, they cross in just one place." TTS "just… one place", no tag, pause 1000 ms.<br>Visual: draw the other half of each circle faintly behind the wall so the second crossing appears and greys out. Use a face inset instead of cutaways (Vi optional). |
| 24 | s21 | should_fix | C, Vo | "Noisy" suggests sound. "Region" is abstract. "Real ... really" clash. | **Accept (merged)** | Now reads: "Measured timings are a bit fuzzy, so each arc is really a band, and the bands overlap in a small patch." |
| 25 | s22 | should_fix | Vi (C wording) | The narration spreads the spots then re-bunches them, ending on the worse picture. On screen, W1 and W4 are already bunched. | **Accept** | Now reads: "These two spots are close, so the patch is long and blurry. Spread them out, and it shrinks." The act ends on the tight patch. |
| 26 | s23 | should_fix | C, Vo | A 31-word comma chain. "Faint timing" is odd. "Model" may sound like AI after Video 01. "Doesn't draw arcs" is wrong for the backprojection used in s36, which sums arcs. | **Accept (merged)** | Now reads: "In practice, a computer weighs many spots at once, trying positions and keeping those whose predicted echoes match. It also leans on assumptions, like what kind of object it's after."<br>This describes the particle filter (C18). Vi's optional wording was folded in. |
| 27 | s25 | should_fix | F | "In 2012 ... recovered" dates the experiment. It was published 20 Mar 2012 and received 12 Sep 2011 (history §2.4). | **Accept** | Now reads: "In 2012, an MIT team reported recovering..." |
| 28 | s26 | should_fix | C | "Streak camera" is unexplained jargon. | **Accept** | Now reads: "an ultrafast laser and a high-speed camera". The on-screen label keeps "streak camera". |
| 29 | s27 | should_fix | F, C (Vo, Vi optional) | The 1 s laptop reconstruction and the minutes-long capture belong to the retroreflective exit sign. The diffuse S took 68 min (history §3.5, §6 items 2 and 4). "In 2018 ... pointed" dates the experiment. The line misses the link to act 3's simplified picture. | **Accept (merged)** | Now reads: "In a 2018 study, Stanford researchers swept one spot across the wall, like our simplified picture. The math got simpler: for a reflective exit sign, rebuilding the scene took about a second on a laptop. Measuring still took almost seven minutes."<br>Visual: the s17 wall spot reappears in the 2018 exhibit and hops in a raster. |
| 30 | s28 | should_fix | C (F optional) | The history reads as a dated list, and s28 doesn't answer s27's bottleneck. | **Accept** | Now reads: "had sped up measuring too ... with a powerful laser and custom detectors". The 700 mW laser and the purpose-built 16×1 SPAD arrays come from history §4.2. C's rewrite of s29 is **rejected**: v1's s29 already makes the pivot in 9 words. |
| 31 | s30 | should_fix | F, C, Vo | "Then, in 2026, a team ... tried" dates the work. The paper was received Aug 2025 and the datasets were committed Oct to Dec 2025. | **Accept** | Now reads: "Then, in a study published in 2026, a team from MIT and Dartmouth tried the small time-of-flight sensors, often called LiDAR, found in phones and gadgets." The phone caveat follows as s30a (row 3). |
| 32 | s31 | should_fix | C | "Very few pixels" isn't tied to "listening spots", and "weak lasers" isn't tied to the faint echo. | **Accept** | Now reads: "Weak lasers mean fainter echoes. The team's smartphone-grade device had about a hundred pixels: a hundred listening spots." Each pixel shares an axis with one laser spot (manuscript §2A), so the equation is fair. "The team's" marks it as the research device, not a phone. |
| 33 | s33 | should_fix | C | "Averaging would smear" is asserted, not shown. | **Accept** | Now reads: "Plain averaging would smear everything, like a long exposure of someone walking." Vo's optional "jiggle" callback is adopted, so the s31 joke becomes the mechanism. |
| 34 | s34 | should_fix | F, C | The line implies moving sensor and moving person are handled together and shown, but the authors solve one unknown at a time (manuscript §3 "Inverse strategy"). No handheld tracking of a moving person was shown (geometry §8.3). The line also doesn't call back s22. | **Accept (merged)** | Now reads: "Their method puts the motion to work, one unknown at a time. With known sensor positions, each jiggle spreads the listening spots out. With the sensor still, each step becomes a new position to follow." This states both conditions and echoes s22's "Spread them out". C's "built to" wording is not needed once the conditions are stated. |
| 35 | s35 | should_fix | F, C, Vo, Vi | Viewers will think this is the ~100-pixel device and that it was handheld, but it is the 16-zone ST kit with a fixed sensor. "Well under a hundred dollars" overstates the abstract's "less than US$100" (project page ~$50 vs ~$100 conflict). There is no callback to s03. | **Accept (merged)** | Now reads: "Our opening clip came from a different sensor: an off-the-shelf kit the authors put at under a hundred dollars, with sixteen listening spots, held still while a person walked behind a partition. We ran it through their own code."<br>C's and Vo's "costs well under a hundred dollars" is **rejected** (F: overstated). F's "cheaper" is **rejected**: the proprietary device's price is unknown (final_paper §5).<br>Visual: morph the plan board into the real plot's axes. Chip "kit: under US$100 (authors)". |
| 36 | s36 | should_fix | F, C, Vo, Vi | "With a sensor stepped ..., a different sensor rebuilt" sounds like two sensors. It is a third device in two minutes, and the turn is abrupt. | **Modify** | Now reads: "Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of a hidden U." It is the same ams capture as s15 (C12 and C33 are both `ams_U_reconstruction`), so the line calls back an already-seen sensor instead of adding one.<br>C's "consider dropping s36" is **rejected**: this is the only 2026 reconstruction result shown, and it costs 18 words.<br>Vi's "visibly different box" is modified to "the same box as s15", stepping a 6×6 raster. Hold 900 ms on the finished U. |
| 37 | s37 | should_fix | C, Vo, Vi | "The fine print matters" sounds legal. "Reflective" reads as mirror after act 2. "Known sensor positions" repeats s36. "Calibrate" is jargon. Viewers can't tell whether the clip's walker wore reflective material, which is undocumented (C02). The planned staging is three static cards. | **Accept (merged)** | Now reads: "Many of these tests had help: reflective safety-vest material on the target, which sends far more light straight back. Our clip's files don't say if the walker wore any. And the kit needs a flat wall and a few seconds of empty room first."<br>C's "Some of these tests" is modified to "Many" (authors: "many of our experiments"). Vo's retained "fine print" opener is **rejected**. F's "Reconstructions used known sensor positions" sentence moves into s34 and s36.<br>Visual: act it out. A strip goes on the target and the returning pulse fattens, then the empty-room scan gag (row 9). |
| 38 | s38 | should_fix | F, C, Vo, Vi | "Tracking ... at thirty frames per second" will be heard as processing speed, but 30 Hz is the capture rate and latency is unresolved (final_paper §4 and §7). "Reporting a reproduction" is jargon. Rerunning code is not outside confirmation. The line is planned as text only. | **Accept (merged)** | Now reads: "But the authors do report tracking a person in ordinary clothes, with the sensor capturing thirty frames a second. The code is public, though we've found no other team reporting results on its own hardware yet." The device stays unnamed (SV1 device unresolved).<br>Visual: the hider walks while a film strip ticks, chip "30 frames/s capture". An empty museum-shelf slot is labelled "independent reproduction". |
| 39 | s39 | should_fix | Vo | "So what could it be good for?" can sound like a dismissive "so what". | **Accept** | Now reads: "What might this be good for? Picture a delivery robot nearing a blind warehouse corner." |
| 40 | s40 | should_fix | Vo | Capitalised MIGHT sounds sarcastic. "Around the bend" is an idiom for crazy. | **Accept** | Now reads: "...might give it an early hint of movement out of sight." The TTS caps are removed. |
| 41 | s41 | should_fix | Vo | "[slowly] slow down" invites a drawl. "Not a picture" repeats s24. | **Accept** | Now reads: "Just a fuzzy blob: enough to say slow down, not enough to say who's there." No tag. |
| 42 | s42 | should_fix | Vi (F, C, Vo optional) | Four limits in about 5 s against four vignette gags. | **Accept** | TTS gets short beats between items, and the visual becomes a 2×2 strip with one tile per beat. F's "walls" scope (README) and C's plain "fast math on small hardware" are adopted. "Real" is removed ("plenty is still hard"). |
| 43 | s45 | should_fix | C (Vo optional) | Only half the takeaway is delivered, and "sending no information" is abstract. | **Accept** | Now reads: "Being out of sight isn't the same as giving nothing away. The light found a way around, and careful timing and math can read some of its clues." This states the brief's full takeaway. |
| 44 | s46 | should_fix | Vo, Vi | J4 needs 4 to 5 s of silent acting, but the hold is 1.2 s and s47 shares section x20, so the outro talks over the punchline. "You'd" points the line at the viewer. | **Accept** | Now reads: "he'd". pause_after_ms is about 4500, and s47 is generated as its own section. |
| 45 | s47 | should_fix | Vo (F, C optional) | This is a tagline, not an invitation, and it repeats itself. "Twice a week" commits to a schedule the project brief calls only "a planning intention". | **Accept; reject Vo's schedule text** | Now reads: "This is Future Got Weird. Follow along if you'd like more. We'll see you around the corner." Vo's "New episodes twice a week" is **rejected** (Project Brief lines 18 and 53). |

**Optional items also adopted** (no verdict required):
- F s11 and C s11: "less like a mirror, more like a tiny lamp" replaces "weak, scrambled mirror". This matches Lambertian scattering and leaves "virtual mirror" to the authors' sense: the wall plus timing plus computation.
- F s17: "flattened".
- F s28: powerful laser.
- F s42: walls.
- C s32: night mode.
- Vo s31: jiggle callback.
- Vo s01: J1 pause 650 ms.
- Vi s14: build the first histogram physically as blocks dropping into time slots.
- Vi s25: the plan sheet rolls onto the history shelf.
- Vi s43: the bumper still does the stopping.
- Vi global: the uncast warehouse walker. Replace him with the checker, or add him to the DIRECTION cast table and the art packet.
- Vo global runtime: confirm the real pace from the first full takes before any further trimming.

## 2. Proposed revised script (display text only)

Markers: [unchanged], [changed], [new]. s30a is a new line. When applying the script, renumber s30a onward to s31 to s48, because `check()` in `tools/v02_script.py` requires consecutive ids.


### Act 1, the impossible view (175 words)

**s01** [changed] Our friend here is hiding behind a partition, and he is very pleased about it.

**s02** [changed] That sensor can't see him. It's pointed at a plain, blank wall.

**s03** [changed] And yet this is real data, from a study published in 2026: seen from above, a small sensor aimed at a wall, tracking someone it never saw directly.

**s04** [changed] Here's the trick for seeing around corners. The light doesn't go through the partition. It goes around the end, by way of the wall.

**s05** [changed] The sensor fires a short, invisible flash. The wall scatters it, part reaches the hidden person, and a tiny bit bounces back: wall, then sensor.

**s06** [changed] That trip is longer than a quick bounce off the wall, so it arrives a little later. A few billionths of a second later.

**s07** [changed] Your webcam can't time that. This takes a time-of-flight sensor, a camera that clocks its own light's round trip.

**s08** [changed] Light travels about thirty centimetres in a nanosecond, one billionth of a second. So timing is distance, and the extra delay is a clue to where he is.


### Act 2, the wall relays information (194 words)

**s09** [unchanged] Why does a plain wall work at all? Start with a mirror.

**s10** [changed] Light leaves a mirror at the same angle it arrived, so the picture stays whole. Put a mirror here, and our friend is simply visible.

**s11** [changed] A painted wall is rough up close. It throws light every which way, so each spot acts less like a mirror, more like a tiny lamp.

**s12** [changed] You might picture his image as a postcard shredded into confetti, waiting to be sorted. It's worse than that. Confetti still holds bits of picture. Everything coming back is a blend of many paths. What survives is timing.

**s13** [changed] Follow the path that matters: sensor, wall, person, wall, sensor. Each bounce spreads the light, and most of it is lost.

**s14** [changed] Nearly everything coming back bounced once, off the wall. Our friend's echo bounced three times, so it's tiny.

**s15** [changed] This is real data from the same team, with a different sensor and hidden object: the wall's big echo, then, a few nanoseconds later, a bump you have to zoom in to see. In this capture, hundreds of times weaker.

**s16** [unchanged] That bump is the clue. Its timing says how much farther the light travelled.


### Act 3, timing becomes geometry (166 words)

**s17** [changed] Let's turn timing into a map: the room from above, flattened, with one more simplification. The sensor flashes and listens at one spot on the wall.

**s18** [changed] Measure the extra delay, and you know how far he is from that spot. Not which direction. Just how far.

**s19** [changed] He could be anywhere on this arc, all the same distance from that spot.

**s20** [changed] Now listen at a second spot. Another delay, another arc. On this side of the wall, they cross in just one place.

**s21** [changed] Measured timings are a bit fuzzy, so each arc is really a band, and the bands overlap in a small patch.

**s22** [changed] These two spots are close, so the patch is long and blurry. Spread them out, and it shrinks.

**s23** [changed] In practice, a computer weighs many spots at once, trying positions and keeping those whose predicted echoes match. It also leans on assumptions, like what kind of object it's after.

**s24** [unchanged] That's why the answer is a likely location, or a rough shape. Not a photograph.


### Act 4a, what came before (116 words)

**s25** [changed] None of this is brand new. In 2012, an MIT team reported recovering the 3D shape of a small mannequin around a corner.

**s26** [changed] It took an ultrafast laser and a high-speed camera: lab equipment that filled a table.

**s27** [changed] In a 2018 study, Stanford researchers swept one spot across the wall, like our simplified picture. The math got simpler: for a reflective exit sign, rebuilding the scene took about a second on a laptop. Measuring still took almost seven minutes.

**s28** [changed] By 2021, researchers in Wisconsin and Milan had sped up measuring too: live video of ordinary objects, five frames a second, with a powerful laser and custom detectors.

**s29** [unchanged] Impressive. But all of it ran on research equipment.


### Act 4b, the 2026 change (288 words)

**s30** [changed] Then, in a study published in 2026, a team from MIT and Dartmouth tried the small time-of-flight sensors, often called LiDAR, found in phones and gadgets.

**s30a** [new] Don't expect your phone to do this yet: phone makers often keep the raw data private.

**s31** [changed] These sensors are tough customers. Weak lasers mean fainter echoes. The team's smartphone-grade device had about a hundred pixels: a hundred listening spots. And if you hold one in your hand, it jiggles.

**s32** [changed] Their fix borrows night mode's trick from phone cameras: stack many quick, dim frames into one better estimate.

**s33** [changed] The catch: between frames, the sensor jiggles and the person moves. Plain averaging would smear everything, like a long exposure of someone walking.

**s34** [changed] Their method puts the motion to work, one unknown at a time. With known sensor positions, each jiggle spreads the listening spots out. With the sensor still, each step becomes a new position to follow.

**s35** [changed] Our opening clip came from a different sensor: an off-the-shelf kit the authors put at under a hundred dollars, with sixteen listening spots, held still while a person walked behind a partition. We ran it through their own code.

**s36** [changed] Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of a hidden U.

**s37** [changed] Many of these tests had help: reflective safety-vest material on the target, which sends far more light straight back. Our clip's files don't say if the walker wore any. And the kit needs a flat wall and a few seconds of empty room first.

**s38** [changed] But the authors do report tracking a person in ordinary clothes, with the sensor capturing thirty frames a second. The code is public, though we've found no other team reporting results on its own hardware yet.


### Act 5, usefulness and limits (96 words)

**s39** [changed] What might this be good for? Picture a delivery robot nearing a blind warehouse corner.

**s40** [changed] With a suitable wall at the junction, a sensor like this might give it an early hint of movement out of sight.

**s41** [changed] Just a fuzzy blob: enough to say slow down, not enough to say who's there.

**s42** [changed] And plenty is still hard: short range, dark or shiny walls, bright sunlight, and fast math on small hardware. The researchers call it an early-stage prototype.

**s43** [unchanged] No one has shown that it prevents collisions. For now, it's a promising clue, not a safety system.


### Payoff (62 words)

**s44** [unchanged] Which brings us back to our friend.

**s45** [changed] Being out of sight isn't the same as giving nothing away. The light found a way around, and careful timing and math can read some of its clues.

**s46** [changed] To really hide, he'd have to block the bounces too.

**s47** [changed] This is Future Got Weird. Follow along if you'd like more. We'll see you around the corner.

**Total: 1097 spoken words in 48 lines** (v1: 1,062 in 47).

## 3. Facts that changed

Each item gives the line(s), what changed, and the source in the research notes.

1. **s03, s30: dates.**
   - **Change.** "A 2026 experiment" and "in 2026 ... tried" become "a study published in 2026".
   - **Why.** Capture dates are unresolved. The ST person-tracking data was first committed 2025-10-20. The paper was received 28 Aug 2025 and published 20 May 2026.
   - **Source.** final_paper §1, §10; manuscript §1; code_reproduction §2.
2. **s03, s35: what the opening shows.**
   - **Change.** The opening is now stated to be the authors' released ST evaluation-kit data: 16 zones, sensor fixed (pt_cloud identical in all 475 frames), tracked with the authors' code run by us. It is a position estimate, not an image.
   - **Source.** C02; geometry §8.1; code_reproduction §0.
3. **s04: path wording.** The light goes "around the end" of the partition, through the 0.65 m gap.
   - **Source.** layout.json `occluder.gap_to_wall_m`.
4. **s05: new fact, the flash is invisible.**
   - **Source.** The ST VL53L8 uses a 940 nm Class 1 VCSEL (manuscript §2B datasheet context, search_summary).
   - **Caveat.** The proprietary device's wavelength is unresolved. The line describes the cartoon sensor, which is the kit.
5. **s05: return path.** "Comes back the same way" becomes "bounces back: wall, then sensor". The return can come back through other wall spots (non-confocal paths).
   - **Source.** geometry §5.2 and §5.3; manuscript §3.
6. **s07: sensor description.** The time-of-flight sensor is described as "a camera that clocks its own light's round trip". The authors' videos label their device "camera".
   - **Source.** manuscript §2A.
   - **LiDAR term.** Now introduced at s30, quoting the project FAQ framing "consumer LiDAR sensors found in smartphones..." (context §2).
7. **s08: unit.** A nanosecond is now stated as one billionth of a second. The on-screen ruler adds "≈ 1 ft".
8. **s11: wall analogy.** "A weak, scrambled mirror" becomes "less like a mirror, more like a tiny lamp".
   - **Why.** This is Lambertian scattering. A diffuse spot keeps no direction information.
   - **Note.** The authors' "virtual mirror" (final Fig. 1a) means the wall plus timing plus computation. C09 needs rewording.
9. **s14: bounce count.** New explicit physics: the wall return bounced once, and the hidden echo bounced three times (W, H, W).
   - **Source.** C11; geometry §6.
10. **s15: what the raw-data plot is.**
    - **Source of the data.** It is now attributed as data released by the same team, from a different sensor (ams, 3×3 zones, 88 ps bins) and a different hidden object (the static U).
    - **Ratio.** "Hundreds of times weaker" is scoped to "this capture". The 256 to 576× figure is our own peak-height measure.
    - **Why not "same study".** It is not described as "the same study" because this dataset's place in the final figures is unresolved.
    - **Source.** C12; code_reproduction §0 item 3; final_paper §5.
11. **s17, s20: geometry.** The picture is declared "flattened" (2D). "They cross in just one place" holds only in that 2D slice; in 3D a third spot is needed.
    - **Source.** geometry §3 and §7.
12. **s23: how the computer works.**
    - **Removed.** "A real system doesn't draw arcs". The backprojection used for the U effectively sums arcs.
    - **New description.** Try positions, predict echoes, keep the matches. This is the particle filter.
    - **Source.** C18; manuscript §3.
13. **s25: Velten.** "Recovered" becomes "reported recovering". Published 20 Mar 2012; received 12 Sep 2011, so the experiment dates from 2011 or earlier.
    - **Source.** history §2.1, §2.4.
14. **s26: equipment name.** "Streak camera" becomes "high-speed camera" in narration. The label keeps "streak camera".
15. **s27: O'Toole 2018.**
    - **Date.** "In 2018 ... pointed" becomes "In a 2018 study".
    - **Speed condition.** The about-1 s laptop reconstruction is now tied to the retroreflective exit sign.
    - **Capture time.** "Minutes" becomes "almost seven minutes" (6.8 min, 64×64 scan).
    - **Not mentioned.** The diffuse S took 68 min.
    - **Source.** history §3.5, §6.
16. **s28: Nam 2021.**
    - **Added.** "Powerful laser" (700 mW Katana HP) and "custom detectors" (PoliMi 16×1 SPAD arrays).
    - **Framing.** The line now says they "sped up measuring" (0.2 s exposure per frame).
    - **Source.** history §1, §4.2.
17. **s30a: new claim, phones can't do this yet.** Phone makers often keep the raw data private.
    - **Source.** The lead author via Digital Trends and ChannelNews ("which they often don't do"); IEEE Spectrum ("restrict access"). All search_summary; context §2, final_paper §5.
18. **s31: device attribution.** "About a hundred pixels" is now attributed to "the team's smartphone-grade device" and equated with listening spots (each pixel is co-located with one laser spot).
    - **Source.** manuscript §2A; final_paper §5.
19. **s32: analogy.** "An idea from phone cameras" becomes "night mode's trick". This is our gloss of the authors' "burst photography".
    - **Source.** C29.
    - **Caveat.** The authors do not mention night mode. Label the analogy as ours if it appears on screen.
20. **s33, s34: how motion is handled.**
    - **Strategy.** The method solves one unknown at a time.
    - **Sensor motion.** It helps when the sensor positions are known (reconstruction used a gantry). The camera-localization capture shows the sampled pattern drifting by up to 0.30 m (C31).
    - **Person motion.** It is followed with a still sensor (tracking).
    - **Not claimed.** The script no longer implies that both moving at once was shown.
    - **Source.** manuscript §3 and §4 (E1 to E8); geometry §8.3.
21. **s35: price.**
    - **Change.** "Costs well under a hundred dollars" becomes "the authors put at under a hundred dollars".
    - **Why.** The abstract says "less than US$100". The project page says ~$50 or ~$100, and those conflict. The video inset reads "$10 Sensor".
    - **Not claimed.** No price comparison with the proprietary device, whose price is unknown.
    - **Source.** final_paper §9; manuscript §2B; context §2.
22. **s36: U reconstruction.** It is now tied to the same ams sensor as s15 and to known positions: a hard-coded 6×6 serpentine raster of 36 positions, backprojection, rough outline.
    - **Source.** C33; code_reproduction §0 item 6.
23. **s37: conditions.**
    - **Retroreflective material.** "Reflective material" becomes "reflective safety-vest material ... sends far more light straight back". Retroreflective falloff is about 1/r² against 1/r⁴ for diffuse targets.
    - **New.** The released files don't document whether the walker in our clip wore any. The config `isDiffuse: False` only selects falloff compensation.
    - **Calibration.** "Calibrate against" becomes "needs a flat wall", plus about 2 s of empty-room background.
    - **Moved.** "Reconstructions used known sensor positions" now sits in s34 and s36.
    - **Source.** C34, C36, C02; history §3.4.
24. **s38: frame rate and replication.**
    - **Frame rate.** "At thirty frames per second" becomes "with the sensor capturing thirty frames a second". This is the capture rate; latency is unresolved.
    - **Replication.** Now "we've found no other team reporting results on its own hardware yet", as of 2026-10-08.
    - **Source.** C37, C38; final_paper §4, §7.
25. **s40: wording only.** "Around the bend" becomes "out of sight". The claim (C39, proposed application) is unchanged.
26. **s42: scope.** "Dark or shiny surfaces" becomes "dark or shiny walls". This is the README scope; the paper has no sunlight statement.
    - **Source.** manuscript §6; context §2.
27. **s47: schedule.** The "twice a week" schedule promise is removed.
    - **Source.** Project Brief lines 18 and 53.

## 4. Follow-on edits needed outside the script (not done here)

- **`research/claims.csv`**
  - **Date wording.** C02 ("from a 2026 experiment") and C03 ("The experiment is from 2026") repeat the s03 date error in the ledger itself. Reword both to "a study published 20 May 2026; capture date unresolved".
  - **Rewording.** Update C09 (tiny lamp), C12 (scope), C20 and C22 (reported), C23 (exit sign), C24 (700 mW), C32 (attributed price, no "well under"), C33 (callback) and C37 (capture rate).
  - **New rows.**
    - Phones can't do this yet.
    - Invisible 940 nm flash.
    - Night-mode gloss (illustrative analogy).
    - Clip clothing undocumented.
  - **Update `script_lines`.** Do this after renumbering.
- **`tools/v02_script.py`**
  - **Lines.** Replace SEGS with the lines above and renumber s30a onward.
  - **Delivery layer.** Apply the tag and ellipsis plan (rows 6 and 7).
  - **Pauses.** s01 650 ms, s03 1100, s20 1000, s36 900, s46 4500.
  - **Sections.** Split s47 into its own section.
  - **IPA.** Move the LiDAR IPA to s30.
- **`storyboard/STORYBOARD.md`**
  - **S1:** headline and conditions chips; sensor stand; camera tilt for s04 and s05; two-pulse race at s06.
  - **S2:** mirror position x 1.9 to 2.6 m, entering on "here".
  - **S3.1:** no tilt.
  - **S3.3:** linear axis plus magnifier.
  - **S4.5:** order reversed (bunched to spread).
  - **S6.6:** morph and price chip.
  - **S6.8:** acted, not cards.
  - **s38:** film strip "30 frames/s capture".
  - **s42:** 2×2 strip.
  - **s46:** hold.
- **Art requests.** Move A06's mirror to the x 1.9 to 2.6 m wall section. Add a phone-shaped "smartphone-grade device" prop and a second small 3×3-zone sensor box. Add a stand for the kit sensor. Resolve the uncast warehouse walker.

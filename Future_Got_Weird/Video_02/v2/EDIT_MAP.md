# Video 02 v2: edit map (v1 → v2)

How Cameras See Around Corners · v2 editorial pass, 9 October 2026. Maps every v1 narration line and every v1 shot to its
fate and its new position in `v2/SCRIPT_V2.md` / `v2/script_v2.json`, then gives a brief change log.

- **v1 times** are the measured speech spans in `source/src/data/timeline.json` (v1 at commit `40183b0`, 6:44.0,
  30 fps). Shot ranges run from the shot's first line to the next shot's first line (S2.1/S2.2 split inside s10 at its
  "Put a mirror here", file 4.55 s), so they are accurate to about ±0.5 s.
- **v2 times** are the planning estimate in `SCRIPT_V2.md` (new takes at 170 wpm; v1 takes at their measured spans).
  They move with the recorded takes; retime from the final narration before rewiring cues.
- Ids: a v1 id is kept only where the line's text is identical and its v1 take is reused. Everything else is n01 to n31.

## 1. Every v1 line

| v1 | v1 time | v1 text (opening words) | Fate | v2 id | v2 section · scene | v2 time (est.) | Note |
|---|---|---|---|---|---|---|---|
| s01 | 0:00.5–0:04.6 | Our friend here is hiding behind a… | **cut** | none | none | 0:00.0 (hide) | Picture only: the 1.0 s silent hide before s02. |
| s02 | 0:05.3–0:08.9 | That sensor can't see him. It's pointed… | **kept** | s02 | A · V1 | 0:01.0 | First line of the film. |
| s03 | 0:09.4–0:19.9 | And yet this is real data, from… | **rewritten** | n01 + n02 | A · V1 | 0:04.9, 0:11.0 | "a wall", not "that wall"; "someone" is the real result; the dot is now the authors' stored estimate, so "their position estimate" is literal; "Not a photograph" said once; "published 2026" moves to the source line. |
| s04 | 0:21.0–0:27.6 | Here's the trick for seeing around corners.… | **merged** | n03 | A · V2 | 0:14.8 | The route clause becomes "takes the long way round"; the plan race shows "around the end, by way of the wall". |
| s05 | 0:28.2–0:37.3 | The sensor fires a short, invisible flash.… | **cut** | none | none | none | Second telling of the route. "Invisible flash" survives as the chip on the sensor close-up (n05). |
| s06 | 0:37.6–0:44.2 | That trip is longer than a quick… | **rewritten + trimmed** | n03 + n04 | A · V2 | 0:14.8, 0:21.7 | Sentence 1's idea is in n03; sentence 2 is n04 (same words; v1 fragment 4.61–6.69 s as fallback). |
| s07 | 0:44.7–0:50.8 | Your webcam can't time that. This takes… | **trimmed** | n05 | A · V2 | 0:24.1 | Sentence 2, same words (fragment 1.95–6.23 s as fallback). The webcam gag is cut to hold the hook near 30 s. |
| s08 | 0:51.4–1:00.3 | Light travels about thirty centimetres in a… | **rewritten, moved** | n11 | C · V5 | 1:26.5 | Now carries the round trip: about 30 cm of travel per ns, so about 15 cm farther from the wall spot. "So timing is distance" is dropped. |
| s09 | 1:01.2–1:04.5 | Why does a plain wall work at… | **rewritten** | n07 | B · V3 | 0:33.5 | "First, a puzzle:" marks the scattering section as step one of the hook's answer. "Start with a mirror." goes with the bench shot. |
| s10 | 1:05.0–1:12.6 | Light leaves a mirror at the same… | **trimmed** | n08 | B · V3 | 0:38.2 | Sentence 2, same words (fragment 4.55–7.81 s). The mirror law becomes 1 s of "in = out" marks. |
| s11 | 1:13.4–1:21.3 | A painted wall is rough up close.… | **kept** | s11 | B · V3 | 0:41.9 |  |
| s12 | 1:21.8–1:35.4 | You might picture his image as a… | **trimmed** | n09 | B · V3 | 0:50.1 | Last two sentences, same words (fragment 8.98–14.01 s). Postcard metaphor cut. |
| s13 | 1:36.2–1:45.8 | Follow the path that matters: sensor, wall,… | **cut** | none | none | none | s14 carries "three bounces, so it's tiny"; the five-stop route becomes an icon strip over the timeline. First line to restore if the cut runs short (fragment 6.85–9.71 s). |
| s14 | 1:46.3–1:52.8 | Nearly everything coming back bounced once, off… | **kept** | s14 | B · V4 | 0:55.5 | Pause after "wall." tightened 0.54 → 0.35 s. |
| s15 | 1:53.1–2:06.5 | This is real data from the same… | **kept** | s15 | B · V4 | 1:02.2 |  |
| s16 | 2:07.0–2:11.3 | That bump is the clue. Its timing… | **kept** | s16 | B · V4 | 1:16.0 | Closes B; "farther" sets up "Farther from where?". |
| s17 | 2:12.2–2:21.3 | Let's turn timing into a map: the… | **rewritten** | n10 | C · V5 | 1:20.6 | "Farther from where? Simplify it:" + s17's second sentence (fragment 6.29–9.18 s could stand in for the second half). "The room from above, flattened, with one more simplification" dropped; "simplified picture" is a label. |
| s18 | 2:21.8–2:27.8 | Measure the extra delay, and you know… | **kept** | s18 | C · V5 | 1:37.4 | Carries the worked example on screen (8.9 ns → 2.65 m there and back → 1.33 m each way). |
| s19 | 2:28.3–2:31.8 | He could be anywhere on this arc,… | **kept** | s19 | C · V5 | 1:43.5 |  |
| s20 | 2:32.7–2:40.3 | Now listen at a second spot. Another… | **kept** | s20 | C · V5 | 1:47.5 |  |
| s21 | 2:41.3–2:47.2 | Measured timings are a bit fuzzy, so… | **kept** | s21 | C · V5 | 1:55.7 |  |
| s22 | 2:47.7–2:52.8 | These two spots are close, so the… | **kept** | s22 | C · V5 | 2:01.9 |  |
| s23 | 2:53.1–3:03.6 | In practice, a computer weighs many spots… | **kept** | s23 | C · V5 | 2:07.4 |  |
| s24 | 3:04.2–3:09.1 | That's why the answer is a likely… | **trimmed** | n12 | C · V5 | 2:18.0 | Sentence 1, same words (fragment 0.06–3.68 s). "Not a photograph." is said once, in n02. |
| s25 | 3:10.1–3:17.7 | None of this is brand new. In… | **rewritten** | n14 | D · V7 | 2:30.5 | 2012 compressed with 2021. "None of this is brand new" dropped. |
| s26 | 3:18.2–3:23.1 | It took an ultrafast laser and a… | **cut** | none | none | none | Equipment names. The table-sized rig stays in the drawing. |
| s27 | 3:23.4–3:38.4 | In a 2018 study, Stanford researchers swept… | **cut** | none | none | none | 2018 and its timing numbers. The 2018 plate passes silently (no numbers). |
| s28 | 3:38.9–3:49.6 | By 2021, researchers in Wisconsin and Milan… | **rewritten** | n14 | D · V7 | 2:30.5 | "By 2021, others had live video around corners." No frame rate, no equipment names. |
| s29 | 3:50.1–3:56.4 | Impressive. But those ran on research equipment.… | **trimmed** | n15 | D · V7 | 2:40.0 | "Impressive." cut; the cheap 2021 tracking precedent stays (fragment 1.33–6.41 s). |
| s30 | 3:57.2–4:07.1 | Then, in a study published in 2026,… | **kept** | s30 | D · V7 | 2:45.4 | On screen: "smartphone-grade research device" + "off-the-shelf kit". |
| s31 | 4:07.6–4:12.0 | Don't expect your phone to do this… | **kept** | s31 | D · V7 | 2:55.7 | First item of the run-long reserve. |
| s32 | 4:12.6–4:24.9 | These sensors are tough customers. Weak lasers… | **trimmed** | n18 | E · V8 | 3:10.7 | Sentences 2–4, same words (fragment 2.22–12.38 s). "These sensors are tough customers." replaced by the Q4 question (n17). |
| s33 | 4:25.3–4:31.8 | Their fix borrows night mode's trick from… | **kept** | s33 | E · V8 | 3:21.2 |  |
| s34 | 4:32.4–4:40.8 | The catch: between frames, the sensor jiggles… | **rewritten** | n19 + n20 | E · V9 | 3:28.1, 3:37.1 | What changes in the data between frames (his echo shifts; the listening spots move), then why plain adding smears. |
| s35 | 4:41.1–4:53.0 | Their method puts the motion to work,… | **rewritten** | n16 + n21 + n22 + n23 | D · V7 · E · V9 | 3:00.4, 3:44.8, 3:48.7, 3:58.2 | "Puts the motion to work" retired (evidence brief §9). The new idea is stated after the history (n16); one unknown at a time, the two modes, and "keeps up instead of smearing". |
| s36 | 4:53.6–5:05.7 | Our opening clip came from a different… | **rewritten** | n25 + chip | F · V10 | 4:14.2 | "Take our opening clip: …" (lead's edit of the judges' "Our opening clip is that second case"). "We ran it through their own code." becomes the narrower kit-board chip and the description. |
| s37 | 5:06.1–5:11.7 | Moved through known positions, the sensor behind… | **moved (verbatim)** | s37 | C · V6 | 2:23.9 | From 5:06 to the end of the geometry section, after "And here's a real one." (n13). |
| s38 | 5:12.6–5:26.2 | Many of these tests had help: safety-vest… | **split** | n26 + n27 + label | F · V10 | 4:24.3, 4:31.6 | Sentence 1 re-voiced with "their" (n26); sentence 2 same words (n27, fragment 7.24–9.50 s); sentence 3 becomes the kit-board label "setup: flat wall + empty-room scan first". |
| s39 | 5:26.5–5:37.9 | But in a separate test, the authors… | **trimmed** | n28 | F · V10 | 4:34.2 | Sentence 1, same words (fragment 0.02–6.31 s). Sentence 2 (C38, the broad absence claim) cut; the description may carry the dated search scope. |
| s40 | 5:38.8–5:43.6 | What might this be good for? Picture… | **kept** | s40 | F · V11 | 4:41.0 |  |
| s41 | 5:44.1–5:49.3 | With a suitable wall at the junction,… | **same text, new take** | n29 | F · V11 | 4:46.1 | All four v1 takes are rushed (272 wpm articulated); "suitable" and "might" need room. |
| s42 | 5:49.9–5:54.7 | Just a fuzzy blob: enough to say… | **kept** | s42 | F · V11 | 4:54.5 |  |
| s43 | 5:55.0–6:06.0 | And plenty is still hard: short range,… | **kept** | s43 | F · V11 | 4:59.7 | Pause after "hardware." tightened 0.52 → 0.40 s. |
| s44 | 6:06.5–6:12.1 | No one has shown that it prevents… | **trimmed** | n30 | F · V11 | 5:10.9 | Sentence 2, same words (fragment 2.76–5.98 s). The C41 sentence is cut. |
| s45 | 6:13.0–6:14.8 | Which brings us back to our friend.… | **cut** | none | none | none | The hard cut from the warehouse corner back to the room partition is the signpost. |
| s46 | 6:15.3–6:22.7 | Being out of sight isn't the same… | **trimmed** | n31 | G · V12 | 5:14.6 | Sentence 1, same words (fragment 0.05–2.87 s). The recap sentence is cut. |
| s47 | 6:23.3–6:26.3 | To really hide, he'd have to block… | **kept** | s47 | G · V12 | 5:17.8 | J4 hold 5.3 → 3.0 s. |
| s48 | 6:31.6–6:38.3 | This is Future Got Weird: the strange… | **kept** | s48 | G · V13 | 5:23.8 | Over the end screen from 0.2 s. |

**Tally (48):** kept verbatim with the v1 take 19 (s02 s11 s14 s15 s16 s18 s19 s20 s21 s22 s23 s30 s31 s33 s40 s42 s43
s47 s48) · moved verbatim 1 (s37) · same text, new take 1 (s41 → n29) · trimmed to one or two sentences 10 (s06 s07 s10
s12 s24 s29 s32 s39 s44 s46; new takes, with the v1 fragment as fallback) · rewritten 9 (s03 s08 s09 s17 s25 s28 s34 s35
s36) · split 1 (s38) · merged 1 (s04) · cut 6 (s01 s05 s13 s26 s27 s45).

## 2. Every v1 scene and shot

v1 scenes are `source/src/scenes/S1…S9`; shot numbers are the scene sources' own (S1.1 to S9.4). v2 scenes and shots are
in `SHOTPLAN_V2.md`. "Adapt" means the v1 component or shot is reused with the changes listed; "rebuild" means new
drawing on existing kit parts.

| v1 shot | v1 time | What v1 showed | Fate | v2 shot | v2 time (est.) | What changes |
|---|---|---|---|---|---|---|
| **S1** Cold open | 0:00.0–1:00.9 | | | | | |
| S1.1 | 0:00.0–0:05.3 | the guesser tiptoes in, settles smug behind the partition (code rig; Runway R1 was never accepted) | adapt | V1.1 | 0:00.0–0:02.6 | Sneak compressed to about 1.0 s, no voice; the blocked sight line ends in an X with "blocked" by 0:02. |
| S1.2 | 0:05.3–0:09.4 | push toward the sensor; checker taps it; field of view on bare wall | adapt | V1.2 | 0:02.6–0:05.3 | Same push and tap; labels "sensor", "blocked" at 64 px. Not the over-the-shoulder raised framing (D02 residual). |
| S1.3 | 0:09.4–0:21.0 | readout swings up into the full-screen tracking board (our re-run `ours_xz`), conditions box, frame counter | adapt | V1.3 | 0:05.3–0:14.8 | Hard cut on "researchers" (no readout morph); dot = authors' `stored_xz` from index 6, every 2nd frame, "sped up"; three labels and one source line; conditions box, counter and code chip move to V10 and the description. |
| S1.4 | 0:21.0–0:28.2 | camera rises; "seen from above" PlanCard beside the room; ghost line hits the partition | drop | (V2.1) | | The route is taught once, full frame, in the plan (V2.1). No room + small card pairing. |
| S1.5 | 0:28.2–0:37.6 | slowed pulse S → W3 → him → W3 → S in the room | drop | (V2.1) | | Same route, told once, in the plan via W1. |
| S1.6 | 0:37.6–0:51.4 | mini arrival timeline race, "≈ 7 ns" (W3) tag, webcam gag, sensor icon | rebuild | V2.2, V2.3 | 0:21.4–0:28.4 | One shared full-frame arrival timeline, no number; sensor close-up full frame. "≈ 7 ns" and the webcam are gone. |
| S1.7 | 0:51.4–1:00.9 | light ruler "1 ns ≈ 30 cm ≈ 1 ft"; PlanCard detour | move + rebuild | V5.2 | 1:26.5–1:37.4 | One ruler on the W1 → him leg that shows travel there and back (30 cm of travel, 15 cm farther). |
| (new) | | | new | V2.4 | 0:28.4–0:33.5 | Hook question over a dashed candidate arc from W1 that stops at a "?"; push into W1's paint. |
| **S2** Wall relays | 1:00.9–1:35.8 | | | | | |
| S2.1 | 1:00.9–1:09.6 | MirrorBench close-up, "in = out" | drop | | | The room mirror (V3.2) carries the comparison; its "in = out" marks last 1 s. |
| S2.2 | 1:09.6–1:13.4 | raised room; mirror slides on; J2 duck | adapt | V3.1, V3.2 | 0:33.5–0:41.9 | V3.1 holds the bare-wall raised view for the "puzzle" question; V3.2 mirror + J2 as built, the checker's pointer taps the mirror. |
| S2.3 | 1:13.4–1:21.8 | mirror off; magnifier; rough-wall section | keep | V3.3 | 0:41.9–0:50.1 | As built. Label "tiny lamp (our analogy)". |
| S2.4 | 1:21.8–1:35.8 | postcard, shred, confetti inset; three paths merge into one blip; timing bars | adapt | V3.4 | 0:50.1–0:55.5 | Postcard and confetti cut (S2_Postcard unused); three paths into one blip, which lands on the shared timeline. |
| **S3** Faint echo | 1:35.8–2:11.8 | | | | | |
| S3.1 | 1:35.8–1:46.3 | room rise; dot cluster travels five stops, thinning; stop tags | adapt | V4.1 | 0:55.5–1:02.2 | The five stops become an icon strip over the shared timeline; no dot tally. |
| S3.2 | 1:46.3–1:53.1 | arrival block card (tall stack vs tiny block) | rebuild | V4.1 | 0:55.5–1:02.2 | Spike vs tiny bump on the shared timeline, "not to scale · far weaker"; no block counts (D19). |
| S3.3 | 1:53.1–2:11.8 | real ams waveform, magnifier ×250, "≈ 3.7 ns" | keep | V4.2, V4.3 | 1:02.2–1:20.6 | As built; trace drawn from frame 1; pointer taps the ring; ring → ring on W1 match cut; small generic route icon beside the bump. |
| **S4** Geometry | 2:11.8–3:09.7 | | | | | |
| S4.1 | 2:11.8–2:21.8 | the signature fold to the plan; "simplified picture (2D)" | keep | V5.1 | 1:20.6–1:26.5 | Fold on "Farther from where?"; question title; chip "simplified picture · sends and listens at one spot". |
| S4.2 | 2:21.8–2:32.7 | ruler from W1; arc; "1.33 m each way"; J3a inset | adapt | V5.3, V5.4 | 1:37.4–1:47.5 | The worked example as a three-step chain (8.9 ns → 2.65 m there and back → 1.33 m each way); J3a as built. |
| S4.3 | 2:32.7–2:41.3 | W4 second arc; camera rises to show behind the wall; J3b | adapt | V5.5 | 1:47.5–1:55.7 | Framing includes the far side of the wall, so no camera rise. |
| S4.4 | 2:41.3–2:47.7 | bands, patch | keep | V5.6 | 1:55.7–2:01.9 | As built. |
| S4.5 | 2:47.7–2:53.1 | close vs spread spots | keep | V5.7 | 2:01.9–2:07.4 | As built (E calls back this rule). |
| S4.6 | 2:53.1–3:04.2 | candidates scatter and cluster | adapt | V5.8 | 2:07.4–2:18.0 | Adds one candidate's predicted ticks against the measured ticks. |
| S4.7 | 3:04.2–3:09.7 | likely-location blob; crossed-out photo frame | adapt | V5.9 | 2:18.0–2:21.9 | Photo-frame gag cut ("not a photograph" is said once, in V1). |
| **S5** History | 3:09.7–3:56.8 | | | | | |
| S5.1 | 3:09.7–3:23.4 | plan board rolls up onto the shelf; 2012 exhibit | adapt | V6 → V7.1 | 2:30.5–2:40.0 | The U board (not the S4 plan) rolls up; faster truck. |
| S5.2 | 3:23.4–3:38.9 | 2018 exhibit, "1 s" laptop vs 7-minute clock | trim | V7.1 | about 2:34 | Plate only ("2018 · Stanford"), passed in the truck; no numbers or props. |
| S5.3 | 3:38.9–3:50.1 | 2021 exhibit, "5 frames/s" counter | adapt | V7.1 | about 2:37 | No frame counter, no equipment names. |
| S5.4 | 3:50.1–3:56.8 | velvet rope; cheap-sensor stool card | keep | V7.2 | 2:40.0–2:45.4 | As built; card stays outside every later framing (S5 review defect 1). |
| **S6** Small sensors | 3:56.8–4:53.3 | | | | | |
| S6.1 | 3:56.8–4:07.6 | checker's arm sets her sensor on the fourth plinth | adapt | V7.3 | 2:45.4–2:55.7 | Adds the two drawn hardware types ("smartphone-grade research device" + "off-the-shelf kit"). |
| S6.2 | 4:07.6–4:12.6 | generic phone, padlock on raw data | keep | V7.4 | 2:55.7–3:00.4 | As built. |
| (new) | | | new | V7.5 | 3:00.4–3:07.4 | "Their new idea": a stack of faint frames fans out from the sensor with "what moved" arrows. |
| S6.3 | 4:12.6–4:25.3 | three problem cards; 10 × 10 dot grid; lift and jiggle | adapt | V8.1, V8.2 | 3:07.4–3:21.2 | Question title; three full-frame beats one at a time; the dot field made uncountable (D33); spots bunched → the C-section blurry patch. |
| S6.4 | 4:25.3–4:32.4 | dim frames stack into one clearer card | keep | V8.3 | 3:21.2–3:28.1 | As built. |
| S6.5 | 4:32.4–4:41.1 | jiggle + step; smear; long-exposure photo gag | adapt | V9.1, V9.2 | 3:28.1–3:44.8 | The two changes shown one at a time (echo shifts; spots move), then the smear; face-inset grin. |
| S6.6 | 4:41.1–4:53.3 | split plan: known positions (left), still sensor (right); hand on sensor | adapt | V9.3, V9.4, V9.5 | 3:44.8–4:09.5 | New one-unknown icon card; each mode full frame first (rail A → B1; sensor on a stand, never in a hand), then the two panels one at a time; deflate in the inset. |
| **S7** Real results | 4:53.3–5:38.4 | | | | | |
| S7.1 | 4:53.3–5:06.1 | the tracking board again (`ours_xz`), conditions column | adapt | V10.1, V10.2, V10.4 | 4:09.5–4:34.2 | `stored_xz`, "sped up"; conditions one at a time beside the track; software-check chip; "clothing: not recorded" stamp. |
| S7.2 | 5:06.1–5:12.6 | U raster and build-up | move | V6.2 | 2:23.9–2:30.5 | Moved into the geometry section; label "preset" instead of "known". |
| S7.3 | 5:12.6–5:26.5 | room: reflective strip (camera-facing), stamp, empty-room scan and shoo gag | adapt | V10.3 | 4:24.3–4:31.6 | Strip staged in a plan close-up facing the wall and light (D35); shoo gag and scan cut (setup is a label). |
| S7.4a | 5:26.5–about 5:35 | the authors' separate test card (the guesser walks) | adapt | V10.5 | 4:34.2–4:41.0 | Generic "person" instead of the guesser; label adds "different device". |
| S7.4b | about 5:35–5:38.4 | museum "independent reproduction" plaque and empty slot | drop | | | Broad absence claim removed (brief; evidence brief §7.5). |
| **S8** Warehouse | 5:38.4–6:12.6 | | | | | |
| S8.1 | 5:38.4–5:44.1 | robot waits, then rolls toward the corner | adapt | V11.1 | 4:41.0–4:46.1 | Match cut in from the R1 card's partition; robot moves on "Picture" (no wait); "potential use" from the cut. |
| S8.2 | 5:44.1–5:49.9 | tilt to plan; pings; blob | keep | V11.2 | 4:46.1–4:54.5 | As built, with "suitable wall". |
| S8.3 | 5:49.9–5:55.0 | front view; brake; "slow down · not who" | keep | V11.3 | 4:54.5–4:59.7 | As built. |
| S8.4 | 5:55.0–6:06.5 | 2 × 2 board of four limits | rebuild | V11.4 | 4:59.7–5:10.9 | One full-frame tile per beat, then a row. |
| S8.5 | 6:06.5–6:12.6 | creep on; carton; bumper stops it | trim | V11.5 | 5:10.9–5:14.6 | Creep only; bumper gag cut. |
| **S9** Payoff | 6:12.6–6:44.0 | | | | | |
| S9.1 | 6:12.6–6:15.3 | back in the room; nervous guesser | drop | | | The hard cut from the warehouse corner is the signpost. |
| S9.2 | 6:15.3–6:23.3 | rise; two round trips (W3, W4); PlanCard; blob on the readout | adapt | V12.1 | 5:14.6–5:17.8 | One slowed trip via W3, no number; PlanCard only if the path does not read without it. |
| S9.3 | 6:23.3–about 6:31.3 | push the partition; blank readout; J4 lean; 5.3 s hold | adapt | V12.2 | 5:17.8–5:23.6 | Hold 3.0 s; hard cut on the beat. |
| S9.4 | about 6:31.3–6:44.0 | yellow end card, wordmark in the top third | rebuild | V13 | 5:23.6–5:33.6 | Functional end screen: video and subscribe guides, wordmark top-left, callback art; exact regions in SHOTPLAN V13. |

## 3. Change log

- **Runtime:** 6:44.0 → about 5:34 (planning estimate; 5:25 to 5:42 depending on new-take pace). 1,111 → 902 words;
  48 → 51 lines (shorter lines, one idea each).
- **Opening rebuilt to the brief's plan:** obstruction by 0:02; the real result full frame from about 0:05 with three
  labels and one source line; the timing idea in one sentence; the time-of-flight sensor by 0:24; the hook question over
  the first candidate arc. The real track now shows the authors' saved estimate, so "their position estimate" is literal.
- **Structure as five spoken questions** (A, B, C, E, F) plus the history bridge (D) and the coda (G), each shown as an
  on-screen title and a YouTube chapter.
- **The real U moved from 5:06 to 2:24,** straight after the geometry it illustrates, behind a spoken cue and a visible
  switch to evidence.
- **History cut from 47 s (v1 s25–s29) to about 15 s** (2012 and 2021 spoken, 2018 as a plate), keeping the 2021
  cheap-sensor precedent; with s30's 2026 sensors the bridge is about 25 s, inside the brief's 20–30 s, followed by the
  phone caveat (s31) and the authors' new idea (n16).
- **Fusion explained in words:** what changes between frames, why plain adding smears, one unknown at a time, the two
  modes, "keeps up instead of smearing". "Puts the motion to work" retired.
- **Conditions sit beside their results;** no caution block. Two spoken condition sentences in the results section;
  the kit's setup and the software check are labels; the broad absence claims (C38, C41) are gone.
- **Round trip made explicit:** about 30 cm of travel per nanosecond, about 15 cm farther from the wall spot; one wall
  spot (W1) and one worked example (8.9 ns / 2.65 m / 1.33 m), in the plan only. The v1 "≈ 7 ns" tag is gone.
- **Repetition removed:** "not a photograph" once (was four times); the route once (was three times); the postcard
  metaphor, webcam gag, bench mirror, dot tally, block card, photo-frame gag and bumper gag cut.
- **Characters given jobs:** the guesser's beliefs are acted (smug at the blank wall, the duck, J3a/J3b, a grin at the
  smear and a deflate when the estimate keeps up, J4); the checker taps the sensor and points at the bump, the crossing
  and the U.
- **Ending:** one takeaway line, the J4 callback (hold 5.3 → 3.0 s), and a 10 s end screen with real element space.
- **Audio:** 20 v1 takes reused whole; 31 lines to record (16 blocks); s41's words kept but re-voiced; every pause is a
  cap.

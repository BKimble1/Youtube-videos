# Video 02 v2: final script

How Cameras See Around Corners · Future Got Weird · v2 editorial pass. Head writer's final script, 9 October 2026.
`v2/REVISION_BRIEF.md` governs. Base: `v2/drafts/DRAFT_questions.md`, with lines and beats grafted from
`DRAFT_characters.md` and `DRAFT_economy.md`, every judge must-fix applied, and each line checked against
`v2/EVIDENCE_BRIEF_V2.md`, `v2/AUDIT_V1_LINES.md` and `research/claims.csv`.

Companion files: `v2/script_v2.json` (machine-readable; it passes the checks in `tools/v02v2_build.py`),
`v2/SHOTPLAN_V2.md` (picture, per scene), `v2/EDIT_MAP.md` (v1 to v2, lines and shots, plus the change log).

| | |
|---|---|
| **Total** | **51 lines, 902 words** (v1: 48 lines, 1,111 words). Inside the brief's 850–940 word guide. |
| **Estimated duration** | **5:33.6**, including a 10.0 s end screen from 5:23.6. Range 5:25.2 to 5:41.6 depending on how fast the new takes come out (182 or 160 wpm); worst case 5:51.1 if the 11 lines that repeat a v1 sentence are also voiced slowly, which the run-long reserve brings back under 5:45. Method under "Totals and duration". Inside the brief's 5:15–5:45. |
| **Audio** | **20 lines reuse their v1 takes verbatim** (398 words; v1 id kept). **31 lines need new takes** (504 words), which `tools/v02v2_build.py` groups into 16 recording blocks. 11 of the new lines repeat a v1 sentence word for word (151 words); the matching v1 fragment is listed as a fallback if the listening pass prefers it. |
| **Voice** | "Test Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`. Tags: [curious] for questions, [warmly] for discoveries, [dryly] / [lightly amused] for undercuts, [softly] for limits. Ellipses mark beats; tags and ellipses never change the words. LiDAR is voiced from /ˈlaɪdɑːr/. Curious, conversational, slightly amused; never a promotional announcer. |
| **Opening clocks** | Obstruction by about 0:02 (blocked sight line under "can't see him"). Real board from about 0:05.3 (hard cut on "researchers"). "That dot is their position estimate. Not a photograph." 0:11–0:14. Timing idea 0:15–0:24. Time-of-flight sensor 0:24–0:28. Hook question 0:29–0:33, over the first candidate arc. |
| **Not yet heard** | Nobody has listened to any take, v1 or new. Every reuse and every timing above waits on the listening pass. |

## How this version was put together

**Why the questions draft is the base.** It scored highest on accuracy (9), kept the firewall between the four evidence
contexts cleanest, and had the only fusion explanation that says in words what changes between frames, why plain adding
smears, and how one-unknown-at-a-time fixes it. Its weak points were the generic opening question, a Q4 question asked
before its premise, a 38 s run of conditions, and moving the brief's hook question out of the first 30 s.

**What was grafted in.**

| From | What | Where now |
|---|---|---|
| Owner's brief | The hook's spoken order and its closing question "So how do you turn a tiny delay into a location?", over the first candidate arc (the brief's 0:24–0:30 shot) | n06 |
| Economy | "The trick is timing: light that reaches him takes the long way round, so it comes back later." with the short and long trips racing on one plan | n03 |
| Economy + characters | "the detour is there and back" (exact name of the extra path) and "farther from" a named spot | n11 |
| Characters | "Farther from where?" as the forward question that opens the geometry, answered in the same breath | n10 |
| Characters | The guesser's beliefs acted rather than spoken: smug at the blank wall, the duck, J3a/J3b, a grin at the smear and a deflate when the estimate keeps up | picture, V1 to V9 |
| Questions | "And here's a real one." as the spoken switch to the real U; the fusion block (what changes, why adding smears, one unknown at a time, two modes, "keeps up instead of smearing") | n13, n19 to n23 |
| Questions + accuracy judge | "Their new idea: a model that keeps track of what moved", now placed right after the 2021 cheap-sensor precedent and the 2026 sensors, so the history ends by saying what is new | n16 |
| Accuracy judge | "Our opening clip is that second case: an off-the-shelf kit..." and "Many of their tests had help" | n25, n26 |
| Viewer judge | "First, a puzzle:" so the scattering section reads as step one of the hook's answer, not a change of subject | n07 |

**What was cut from the drafts.**
- The generic opener ("How do you find someone you can't see?") and "He feels safe": the board now lands about 2 s earlier.
- The bench mirror shot and "Start with a mirror": the room mirror and the paint close-up do the comparison in about
  12 s (n08 + s11), inside the brief's 10–15 s.
- "Each bounce spreads the light, and most of it is lost": s14 already says three bounces make the echo tiny; the
  route strip shows the thinning.
- Every spoken guesser aside ("His objection", "His fallback", "His plan", "he figures", "Too tiny to matter"). "Too tiny"
  would have framed the ams bump as his echo.
- The spoken software check. It moves to a small chip on the kit board and to the description (viewer judge); the wording
  is the accuracy judge's narrow version.
- The kit's setup sentence ("flat wall and a few seconds of empty room") becomes a label beside the kit.
- The bumper tap in the warehouse: J4 is the film's one closing gag.
- v1 s17's "the room from above, flattened, with one more simplification"; "simplified picture" is a label.

### Judge must-fixes and where each is resolved

| Must-fix (judge) | Resolution |
|---|---|
| No "puts the motion to work"; explain fusion with the evidence brief's §6.6 wording; "keeps up", never "sharper" (accuracy, viewer, production) | s35 retired. n19 what changes; n20 why adding smears; n21 one unknown at a time; n22 still object + known positions; n23 still sensor + drifting guesses, "keeps up instead of smearing". |
| No unattributed "first"; novelty is the authors' model; say what is new after the 2021 precedent (accuracy, viewer) | n15 keeps C45; s30 + s31; then n16 "Their new idea: a model that keeps track of what moved…". Economy's "What's new is rough shapes…" is not used. |
| Ask Q4 only after the viewer knows the 2026 work used small, cheap sensors (viewer) | n17 comes after s30, s31 and n16; "need that" points back to the new idea and n18 answers at once. |
| Keep the four evidence contexts apart; no U beside the kit sensor; the ams bump is never "his" echo (accuracy) | No "too tiny" aside. U thumbnail (n22) keeps its "Real data · same 3x3 sensor" header and appears in a plan of our room only as a framed card. The plinth match at s30 shows drawn hardware types, no U. |
| Hard, visible cut to the real board; no cartoon readout morph; no guesser as the walker or the R1 person (accuracy) | n01 hard cut on "researchers"; the guesser's cut-in (n02) is in our room and never synced to the track; R1 card (n28) uses the generic person and a neutral "their sensor". |
| "sped up" on every R8 replay; stored_xz from index 6, every 2nd frame, no interpolation, mapping recorded; no halo from ours_std_xz (accuracy, production) | V1 and V10 both carry "sped up"; mapping in SHOTPLAN V1; no halo. |
| Round trip names the spot; one wall spot W1 (8.9 ns / 2.65 m / 1.33 m); no number in the hook; never W1 or W2 in the raised room view (accuracy, viewer, production) | n11 "fifteen centimetres farther from the wall spot"; s18's chain on W1 in plan only; hook timeline has no number; coda round trip uses W3 with no number; S1.6's "≈ 7 ns" tag is gone. |
| Narrow software-check wording; logs preserved; P08 (accuracy); move it off the voice track (viewer) | Chip on the kit board (n25): "our check: their code + their data → matched their saved results · a software check, not a new experiment". Description carries date, commit 15314de and the median 8 cm. Logs: see "Before lock". |
| Kit reveal: "that second case", never "the cheaper of the two"; say what it differs from (accuracy, viewer) | n25, plus the label "ST sensor kit · 16 zones · held still · not the phone-grade device". |
| "Many of their tests"; then "Our clip's files don't say…"; strip faces the wall (accuracy, production) | n26, n27; strip staged in a plan close-up where it faces the incoming light. |
| Compress the conditions run; at most two spoken condition sentences (viewer) | n25 leads with what the kit did; n26 and n27 are the two condition sentences; setup and software check are labels. n25 to n28 (the kit, two conditions, the separate test) run about 27 s, against about 38 s for the same material in all three drafts. |
| s30 carries "smartphone-grade research device + off-the-shelf kit"; R1 card labels (accuracy) | s30 picture; n28 picture. |
| Open on a concrete statement, board by about 0:06 (viewer) | s02 first; board at about 0:05.3. |
| Spoken cue for the switch to the real U (viewer) | n13 "And here's a real one." |
| Close the handheld-jiggle loop (viewer) | n22 "step the sensor through known positions", n23 "hold the sensor still"; labels "sensor on a rail, at known positions", "sensor on a stand", "handheld: shown only for locating the sensor itself (reported)". |
| Rig reality: striped shirt, mitt hands, faceless plan tokens, code-drawn props, no plates or Runway (production) | All actions in SHOTPLAN use existing rigs: reactions in the S4 face inset or room cut-ins, no pinch, no sweater pat. |
| Shape beat uses layout frames A and B1 only; shrink about 30%, never a dot (production) | n22 picture: rail between A and B1. |
| Runtime guard (production) | Planning estimate 5:33.6 with new takes budgeted at 170 wpm; worst case 5:51.1 if every new line comes out at 160 wpm, which the pre-selected reserve of about 9.5 s (no condition line, not the round trip) brings back under 5:45. |
| End screen guides above the caption band, exact coordinates (production) | "End screen" below and SHOTPLAN V13. |
| Ledger: P01, P02, P03, P06, P08 before lock; analogy labels; I1 numbers "illustrative" (accuracy) | "Before lock" below; labels in SHOTPLAN. |

## Sections

| Section | New time (est.) | Question it answers | Chapter title | Lines · words | Scenes |
|---|---|---|---|---|---|
| **A** Hook: the impossible result | 0:00.0–0:33.5 (34 s) | How can a sensor find someone it cannot see? | How can it find what it can't see? | 7 · 87 | V1, V2 |
| **B** What survives the bounce | 0:33.5–1:20.6 (47 s) | What survives after light scatters off a plain wall? | What survives the bounce? | 7 · 132 | V3, V4 |
| **C** From delay to location | 1:20.6–2:30.5 (70 s) | How does a time measurement become a location? | How does a delay become a location? | 11 · 205 | V5, V6 |
| **D** History bridge: what's new | 2:30.5–3:07.4 (37 s) | How new is any of this, and what did 2026 add? | How new is this? | 5 · 99 | V7 |
| **E** Why a cheap sensor is harder | 3:07.4–4:09.5 (62 s) | Why did making the sensor cheaper create a harder problem? | Why is a cheap sensor harder? | 8 · 164 | V8, V9 |
| **F** What it can do, and where it fails | 4:09.5–5:14.6 (65 s) | What can this actually do, and where does it fail? | What can it do, and where does it fail? | 10 · 175 | V10, V11 |
| **G** Takeaway, callback, end screen | 5:14.6–5:33.6 (19 s) | (coda) What should the viewer leave with? | Takeaway | 3 · 40 | V12, V13 |

The five brief questions are A, B, C, E and F. D is the brief's history bridge ("defines what is new") and G its takeaway,
callback and end screen. Each question is spoken once, shown top-left (64 px, one line, inside the safe area) for the
length of that line only, and used as the YouTube chapter title. A's question is the title's promise and is not shown as
text; D's chapter title appears over the museum without being spoken.

**Scenes** (the `scene` field in `script_v2.json`; shots in `SHOTPLAN_V2.md`):

| Scene | Title | Section | Lines | Est. time |
|---|---|---|---|---|
| V1 | Hide and the real track | A | s02, n01, n02 | 0:00.0–0:14.8 |
| V2 | The long way round | A | n03, n04, n05, n06 | 0:14.8–0:33.5 |
| V3 | Mirror versus paint | B | n07, n08, s11, n09 | 0:33.5–0:55.5 |
| V4 | Later, weaker, and real | B | s14, s15, s16 | 0:55.5–1:20.6 |
| V5 | Delay to distance to place | C | n10, n11, s18, s19, s20, s21, s22, s23, n12 | 1:20.6–2:21.9 |
| V6 | The real U | C | n13, s37 | 2:21.9–2:30.5 |
| V7 | Museum bridge | D | n14, n15, s30, s31, n16 | 2:30.5–3:07.4 |
| V8 | Small-sensor problems | E | n17, n18, s33 | 3:07.4–3:28.1 |
| V9 | Motion-aware fusion | E | n19, n20, n21, n22, n23 | 3:28.1–4:09.5 |
| V10 | The kit clip and its conditions | F | n24, n25, n26, n27, n28 | 4:09.5–4:41.0 |
| V11 | Warehouse: potential use and limits | F | s40, n29, s42, s43, n30 | 4:41.0–5:14.6 |
| V12 | Callback | G | n31, s47 | 5:14.6–5:23.6 |
| V13 | End screen | G | s48 | 5:23.6–5:33.6 |

## Lines

Columns: **id** (a v1 id only where the text is identical to that v1 line and its v1 take is reused; otherwise n01…) ·
**start** (planning estimate) · **exact text** (display and caption text) · **Eleven v4 prompt** (tags and beats; same
words as the text) with the delivery note in italics · **pause after** (ms to the next line, applied as a cap) ·
**claims** (`research/claims.csv`; P-numbers are the evidence brief's proposed additions, to be added before lock) ·
**audio**.

### A · Hook (How can a sensor find someone it cannot see?)

0:00.0–0:01.0: silent hide (picture only; v1 s01 is cut). The guesser tiptoes in and settles smug behind the partition.

| id | start | exact text | Eleven v4 prompt · delivery | pause after (ms) | claims | audio |
|---|---|---|---|---|---|---|
| **s02** | 0:01.0 | That sensor can't see him. It's pointed at a plain, blank wall. | `That sensor can't see him. It's pointed at a plain, blank wall.`<br>*matter-of-fact setup (v1 take); if the new hook takes (block y01) sound unlike it, regenerate it with y01, same words, under a new id* | 300 | C01 | v1 take `x01_t3` |
| **n01** | 0:04.9 | Yet researchers have used light bouncing off a wall to track someone hidden around a corner. | `Yet… researchers have used light bouncing off a wall to track someone hidden around a corner.`<br>*a small beat after 'Yet', then clear and quietly amazed: the discovery, not an announcement* | 250 | C02, C04, C03 | NEW |
| **n02** | 0:11.0 | That dot is their position estimate. Not a photograph. | `That dot is their position estimate. [dryly] Not a photograph.`<br>*plain, then a dry drop on 'Not a photograph' (said once in the film)* | 600 | C02, C19 | NEW |
| **n03** | 0:14.8 | The trick is timing: light that reaches him takes the long way round, so it comes back later. | `[warmly] The trick is timing: light that reaches him takes the long way round… so it comes back later.`<br>*friendly explainer; light stress on 'long way round'* | 300 | C04, C06 | NEW |
| **n04** | 0:21.7 | A few billionths of a second later. | `[dryly] A few billionths of a second later.`<br>*dry undercut on the size of 'later'* | 350 | C06 | NEW · fallback v1 `s06` 4.61–6.69 s |
| **n05** | 0:24.1 | This takes a time-of-flight sensor, a camera that clocks its own light's round trip. | `This takes a time-of-flight sensor… a camera that clocks its own light's round trip.`<br>*define the sensor plainly* | 300 | C07, C43 | NEW · fallback v1 `s07` 1.95–6.23 s |
| **n06** | 0:28.7 | So how do you turn a tiny delay into a location? | `[curious] So how do you turn a tiny delay… into a location?`<br>*a real question, rising, unhurried; the hook ends here* | 400 | none (question) | NEW |

### B · What survives after light scatters?

| id | start | exact text | Eleven v4 prompt · delivery | pause after (ms) | claims | audio |
|---|---|---|---|---|---|---|
| **n07** | 0:33.5 | First, a puzzle: why does a plain wall work at all? | `[curious] First, a puzzle… why does a plain wall work at all?`<br>*'First' marks this as step one of the answer, not a change of subject; curious, a small beat after 'puzzle'* | 300 | none (question) | NEW |
| **n08** | 0:38.2 | Put a mirror here, and our friend is simply visible. | `[dryly] Put a mirror here… and our friend is simply visible.`<br>*dry; J2 lands on 'visible'* | 500 | C08 | NEW · fallback v1 `s10` 4.55–7.81 s |
| **s11** | 0:41.9 | A painted wall is rough up close. It throws light every which way, so each spot acts less like a mirror, more like a tiny lamp. | `A painted wall is rough up close. It throws light every which way, so each spot acts less like a mirror, more like a tiny lamp.`<br>*explainer (v1 take)* | 350 | C09 | v1 take `x05_t4` |
| **n09** | 0:50.1 | Everything coming back is a blend of many paths. What survives is timing. | `Everything coming back is a blend of many paths… [warmly] What survives is timing.`<br>*the section's thesis; small lift on 'timing'* | 400 | C10 | NEW · fallback v1 `s12` 8.98–14.01 s |
| **s14** | 0:55.5 | Nearly everything coming back bounced once, off the wall. Our friend's echo bounced three times, so it's tiny. | `Nearly everything coming back bounced once, off the wall. Our friend's echo bounced three times, so it's tiny.`<br>*plain; 'tiny' small (v1 take; tighten the pause after 'wall.' from 0.54 to 0.35 s)* | 350 | C11 | v1 take `x06_t1` |
| **s15** | 1:02.2 | This is real data from the same team, with a different sensor and hidden object: the wall's big echo, then, a few nanoseconds later, a bump you have to zoom in to see. In this capture, hundreds of times weaker. | `This is real data from the same team, with a different sensor and hidden object: the wall's big echo, then, a few nanoseconds later, a bump you have to zoom in to see. [softly] In this capture, hundreds of times weaker.`<br>*evidence voice, careful (v1 take)* | 500 | C12 | v1 take `x07_t2` |
| **s16** | 1:16.0 | That bump is the clue. Its timing says how much farther the light travelled. | `That bump is the clue. Its timing says how much farther the light travelled.`<br>*short, confident (v1 take; tighten the pause after 'clue.' to 0.35 s)* | 400 | C06, C12, P06 | v1 take `x07_t2` |

### C · How does a delay become a location?

| id | start | exact text | Eleven v4 prompt · delivery | pause after (ms) | claims | audio |
|---|---|---|---|---|---|---|
| **n10** | 1:20.6 | Farther from where? Simplify it: the sensor flashes and listens at one spot on the wall. | `[curious] Farther from where? Simplify it: the sensor flashes and listens at one spot on the wall.`<br>*the forward question, answered in the same breath* | 300 | C13 | NEW |
| **n11** | 1:26.5 | Light covers about thirty centimetres every nanosecond. But the detour is there and back, so each extra nanosecond puts him only about fifteen centimetres farther from the wall spot. | `Light covers about thirty centimetres every nanosecond. [lightly amused] But the detour is there… and back, so each extra nanosecond puts him only about fifteen centimetres farther from the wall spot.`<br>*the round-trip turn is the small surprise; amused on 'there… and back'* | 350 | C06, C14, C13 | NEW |
| **s18** | 1:37.4 | Measure the extra delay, and you know how far he is from that spot. Not which direction. Just how far. | `Measure the extra delay, and you know how far he is from that spot. Not which direction… Just how far.`<br>*precise (v1 take; tighten the pause after 'spot.' to 0.35 s)* | 300 | C14 | v1 take `x08_t1` |
| **s19** | 1:43.5 | He could be anywhere on this arc, all the same distance from that spot. | `He could be anywhere on this arc, all the same distance from that spot.`<br>*J3 setup (v1 take; measures fast, listen)* | 500 | C14 | v1 take `x08_t1` |
| **s20** | 1:47.5 | Now listen at a second spot. Another delay, another arc. On this side of the wall, they cross in just one place. | `Now listen at a second spot. Another delay, another arc. On this side of the wall, they cross in just… one place.`<br>*J3 payoff (v1 take; tighten the pause after 'spot.' to 0.35 s)* | 600 | C15 | v1 take `x09_t1` |
| **s21** | 1:55.7 | Measured timings are a bit fuzzy, so each arc is really a band, and the bands overlap in a small patch. | `Measured timings are a bit fuzzy, so each arc is really a band, and the bands overlap in a small patch.`<br>*honest uncertainty (v1 take)* | 300 | C16 | v1 take `x09_t1` |
| **s22** | 2:01.9 | These two spots are close, so the patch is long and blurry. Spread them out, and it shrinks. | `These two spots are close, so the patch is long and blurry. Spread them out, and it shrinks.`<br>*rule of thumb (v1 take)* | 350 | C17 | v1 take `x09_t1` |
| **s23** | 2:07.4 | In practice, a computer weighs many spots at once, trying positions and keeping those whose predicted echoes match. It also leans on assumptions, like what kind of object it's after. | `In practice, a computer weighs many spots at once, trying positions and keeping those whose predicted echoes match. It also leans on assumptions, like what kind of object it's after.`<br>*clear, unhurried (v1 take; tighten the pause after 'match.' to 0.35 s)* | 350 | C18 | v1 take `x10_t1` |
| **n12** | 2:18.0 | That's why the answer is a likely location, or a rough shape. | `That's why the answer is a likely location, or a rough shape.`<br>*settle* | 300 | C19 | NEW · fallback v1 `s24` 0.06–3.68 s |
| **n13** | 2:21.9 | And here's a real one. | `[warmly] And here's a real one.`<br>*discovery, warm, short* | 250 | C33 | NEW |
| **s37** | 2:23.9 | Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of a hidden U. | `Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of a hidden U.`<br>*second evidence payoff (v1 take, moved from v1 5:06); hold on the finished U* | 900 | C33, C35, C12 | v1 take `x16_t3` |

### D · History bridge: how new is any of this?

| id | start | exact text | Eleven v4 prompt · delivery | pause after (ms) | claims | audio |
|---|---|---|---|---|---|---|
| **n14** | 2:30.5 | In 2012, an MIT team rebuilt the rough 3D shape of a hidden mannequin. By 2021, others had live video around corners. | `In 2012, an MIT team rebuilt the rough 3D shape of a hidden mannequin. By 2021, others had live video around corners.`<br>*brisk storyteller* | 300 | C20, C21, C24 | NEW |
| **n15** | 2:40.0 | But those ran on research equipment. One team had even tracked hidden objects with a cheap sensor. | `But those ran on research equipment. One team had even tracked hidden objects with a cheap sensor.`<br>*the precedent stated plainly, not as a twist* | 400 | C25, C45 | NEW · fallback v1 `s29` 1.33–6.41 s |
| **s30** | 2:45.4 | Then, in a study published in 2026, a team from MIT and Dartmouth tried the small time-of-flight sensors, often called LiDAR, found in phones and gadgets. | `Then, in a study published in 2026, a team from MIT and Dartmouth tried the small time-of-flight sensors, often called /ˈlaɪdɑːr/, found in phones and gadgets.`<br>*the news beat (v1 take; LiDAR from IPA, listen)* | 300 | C26, C27, C03, C32 | v1 take `x13_t4` |
| **s31** | 2:55.7 | Don't expect your phone to do this yet: phone makers often keep the raw data private. | `Don't expect your phone to do this yet: phone makers often keep the raw data private.`<br>*friendly caveat (v1 take; measures fast, listen)* | 350 | C42 | v1 take `x13_t4` |
| **n16** | 3:00.4 | Their new idea: a model that keeps track of what moved, so many weak frames can be combined. | `[warmly] Their new idea: a model that keeps track of what moved… so many weak frames can be combined.`<br>*the answer to 'how new': warm, clear, attributed to them* | 400 | C29, C30 | NEW |

### E · Why did a cheaper sensor create a harder problem?

| id | start | exact text | Eleven v4 prompt · delivery | pause after (ms) | claims | audio |
|---|---|---|---|---|---|---|
| **n17** | 3:07.4 | Why would a smaller, cheaper sensor need that? | `[curious] Why would a smaller, cheaper sensor need that?`<br>*a genuine question; 'that' points back to the new idea, and the next line answers it* | 300 | none (question) | NEW |
| **n18** | 3:10.7 | Weak lasers mean fainter echoes. The team's smartphone-grade device had about a hundred pixels: a hundred listening spots. And if you hold one in your hand, it jiggles. | `Weak lasers mean fainter echoes. The team's smartphone-grade device had about a hundred pixels: a hundred listening spots. [lightly amused] And if you hold one in your hand, it jiggles.`<br>*three problems as a quick rhythm; small smile on 'jiggles'* | 350 | C28, C17 | NEW · fallback v1 `s32` 2.22–12.38 s |
| **s33** | 3:21.2 | Their fix borrows night mode's trick from phone cameras: stack many quick, dim frames into one better estimate. | `Their fix borrows night mode's trick from phone cameras: stack many quick, dim frames into one better estimate.`<br>*clear (v1 take)* | 350 | C29, C44 | v1 take `x14_t1` |
| **n19** | 3:28.1 | The catch: things move between frames. He steps, and his echo shifts in time. The sensor jiggles, and its listening spots land somewhere new. | `[dryly] The catch: things move between frames. He steps, and his echo shifts in time. The sensor jiggles… and its listening spots land somewhere new.`<br>*the problem, plainly; two changes, two sentences* | 300 | C30, C31 | NEW |
| **n20** | 3:37.1 | Just add them up, and echoes from different places blur into one smear, like a long exposure of someone walking. | `Just add them up, and echoes from different places blur into one smear… [lightly amused] like a long exposure of someone walking.`<br>*plain, then amused on the comparison* | 400 | C30, P02 | NEW |
| **n21** | 3:44.8 | So their model solves for one unknown at a time. | `[warmly] So their model solves for one unknown at a time.`<br>*the turn to the solution* | 300 | C30, P01 | NEW |
| **n22** | 3:48.7 | To build a shape, hold the object still and step the sensor through known positions, spreading out its listening spots. That's how the U was made. | `To build a shape, hold the object still and step the sensor through known positions, spreading out its listening spots. That's how the U was made.`<br>*explainer; callback lands on 'the U'* | 350 | C35, C31, C17, C33, P01 | NEW |
| **n23** | 3:58.2 | To follow a person, hold the sensor still, and let each guess drift a little between frames, keeping the ones that still match. The estimate keeps up instead of smearing. | `To follow a person, hold the sensor still, and let each guess drift a little between frames, keeping the ones that still match. [warmly] The estimate keeps up… instead of smearing.`<br>*explainer, then the visible payoff, warm* | 500 | C18, C30, P03 | NEW |

### F · What can it actually do, and where does it fail?

| id | start | exact text | Eleven v4 prompt · delivery | pause after (ms) | claims | audio |
|---|---|---|---|---|---|---|
| **n24** | 4:09.5 | So what can it actually do, and where does it fail? | `[curious] So what can it actually do… and where does it fail?`<br>*curious; the last big question* | 300 | none (question) | NEW |
| **n25** | 4:14.2 | Take our opening clip: an off-the-shelf kit the authors put at under a hundred dollars, held still while a person walked behind a partition. | `Take our opening clip: an off-the-shelf kit the authors put at under a hundred dollars… held still while a person walked behind a partition.`<br>*evidence voice, specific; callback to the opening (lead's edit: 'that second case' lost its referent after the n24 question)* | 300 | C02, C32, C36, P08 | NEW |
| **n26** | 4:24.3 | Many of their tests had help: safety-vest style reflective material on the target, which sends far more light straight back. | `Many of their tests had help: safety-vest style reflective material on the target, which sends far more light straight back.`<br>*conditions as useful understanding, not a disclaimer* | 300 | C34 | NEW |
| **n27** | 4:31.6 | Our clip's files don't say if the walker wore any. | `Our clip's files don't say if the walker wore any.`<br>*plain* | 300 | C02 | NEW · fallback v1 `s38` 7.24–9.50 s |
| **n28** | 4:34.2 | But in a separate test, the authors report tracking a person in ordinary clothes, capturing thirty frames a second. | `But in a separate test, the authors report tracking a person in ordinary clothes, capturing thirty frames a second.`<br>*fair and plain* | 500 | C37 | NEW · fallback v1 `s39` 0.02–6.31 s |
| **s40** | 4:41.0 | What might this be good for? Picture a delivery robot nearing a blind warehouse corner. | `[curious] What might this be good for? Picture a delivery robot nearing a blind warehouse corner.`<br>*curious (v1 take)* | 300 | C39 | v1 take `x18_t3` |
| **n29** | 4:46.1 | With a suitable wall at the junction, a sensor like this might give it an early hint of movement out of sight. | `With a suitable wall at the junction… a sensor like this might give it an early hint of movement out of sight.`<br>*same words as v1 s41, new take: 'suitable' and 'might' need room (v1 takes were 272 wpm)* | 300 | C39 | NEW (same words as v1 s41; all v1 takes rushed) |
| **s42** | 4:54.5 | Just a fuzzy blob: enough to say slow down, not enough to say who's there. | `Just a fuzzy blob: enough to say slow down, not enough to say who's there.`<br>*concrete benefit and its limit (v1 take)* | 400 | C19, C39 | v1 take `x18_t3` |
| **s43** | 4:59.7 | And plenty is still hard: short range, dark or shiny walls, bright sunlight, and fast math on small hardware. The researchers call it an early-stage prototype. | `And plenty is still hard: short range. Dark or shiny walls. Bright sunlight. And fast math on small hardware. The researchers call it an early-stage prototype.`<br>*four short beats, then a plain attribution (v1 take; tighten the pause after 'hardware.' to 0.40 s)* | 350 | C40 | v1 take `x19_t1` |
| **n30** | 5:10.9 | For now, it's a promising clue, not a safety system. | `[softly] For now, it's a promising clue, not a safety system.`<br>*settled, honest; the answer to the section's question* | 500 | C39, C40 | NEW · fallback v1 `s44` 2.76–5.98 s |

### G · Takeaway, callback, end screen

| id | start | exact text | Eleven v4 prompt · delivery | pause after (ms) | claims | audio |
|---|---|---|---|---|---|---|
| **n31** | 5:14.6 | Being out of sight isn't the same as giving nothing away. | `Being out of sight… isn't the same as giving nothing away.`<br>*the takeaway, calm* | 350 | C04, C19 | NEW · fallback v1 `s46` 0.05–2.87 s |
| **s47** | 5:17.8 | To really hide, he'd have to block the bounces too. | `To really hide, he'd have to block the bounces too.`<br>*J4 (v1 take); 3.0 s hold after it (v1 5.3 s)* | 3000 (J4 hold) | C04 | v1 take `x20_t1` |
| **s48** | 5:23.8 | This is Future Got Weird: the strange future, explained. Subscribe for more, and we'll see you around the corner. | `[warmly] This is Future Got Weird: the strange future, explained. Subscribe for more, and we'll see you around the corner.`<br>*one brief invitation (v1 take), from 0.2 s into the end screen* | end screen | none (sign-off) | v1 take `x21_t4` |

The narration as read straight through, for a pace check, is the "exact text" column in order. Every factual sentence
carries at least one claim ID; the lines without one are questions (n06, n07, n17, n24) and the sign-off (s48).

## Totals and duration

| | Lines | Words |
|---|---|---|
| Whole v1 takes reused (v1 id kept) | 20 | 398 |
| New takes | 31 | 504 |
| of which repeat a v1 sentence (v1 fragment as fallback) | 11 | 151 |
| **Total** | **51** | **902** |

Words per section: A 87, B 132, C 205, D 99, E 164, F 175, G 40.

**Planning estimate 5:33.6.** v1 takes at their measured spans in `timeline.json`, less the in-line pause tightening
listed in the prompts (s14, s16, s18, s20, s23, s43; about 0.9 s in all); new lines that repeat a v1 sentence at that
fragment's measured length (same voice and words); other new lines at 170 wpm (160 for short questions) plus 0.25 s per
ellipsis beat; every designed pause; a 1.0 s silent lead-in; and a 10.0 s end screen (s48 starts 0.2 s into it).
Sensitivity: the other new lines at 182 wpm (v1's measured rate while speaking) 5:25.2; at 160 wpm 5:41.6; with the
lines that repeat a v1 sentence also voiced at 170 or 160 wpm instead of their v1 lengths 5:39.8 or 5:51.1. In this model the speech
itself runs at about 176 words a minute; the pauses between lines total 18.3 s (v1: 27.2 s), plus the 3.0 s J4 hold
(v1: 5.3 s). Overall, end screen included, that is about 162 words a minute (v1: 165), because the fixed beats (lead-in,
J4, a 10 s end screen with 19 words) weigh more in a shorter film. Diagnostic only; the selected takes set the real
timing.

**Run-long reserve**, in order, none of which touches a condition line or the round trip (about 9.5 s in all):
1. s31 to screen and description ("not on your phone (yet): raw data kept private") (−4.7 s).
2. n25 loses "the authors put at under a hundred dollars"; the price stays as the label "under US$100 (authors' figure)" (−3.0 s).
3. End screen 10.0 → 9.0 s (s48 still fits, with 2 s of resolve) (−1.0 s).
4. Pause caps: s37 900 → 800, s20 600 → 500, n02 600 → 500, n23 500 → 400, n28 500 → 400, J4 3000 → 2700 (−0.8 s).

**If it runs short**, or a viewer test finds B abstract: restore v1's "Each bounce spreads the light, and most of it is
lost." before s14 (v1 s13 file 6.85–9.71 s, +3.1 s), then "How new is any of this?" over the museum (+2.5 s).

## End screen

10.0 s, from about 5:23.6 to 5:33.6; take the exact times from the locked audio. Hard cut in on the J4 beat. The
element space is clear from the first frame; no logo-only hold. Layout (1920×1080; full detail in SHOTPLAN V13):

| Region | Box (px) | Share of frame | Content |
|---|---|---|---|
| Wordmark + tagline | x 120–900, y 96–330 | top-left | FUTURE GOT WEIRD (112 px) and "the strange future, explained" (44 px); settle in 0.4 s, then still |
| "watch next" label | x 1000–1500, y 214–270 | | 48 px, outside the video element |
| **Video element guide** | **x 1000–1800, y 290–740** (800×450, 16:9) | x 52.1–93.8 %, y 26.9–68.5 % | plain lighter panel, nothing inside it |
| **Subscribe element guide** | **circle, centre (430, 600), diameter 300** (x 280–580, y 450–750) | centre 22.4 %, 55.6 % | plain lighter disc, empty; no arrow, no "click here" |
| Callback art | x 640–940, y 560–930 | | a small partition with the guesser peeking round its end, glancing at the video guide; one look and one blink in the last 3 s |
| Keep empty | y 950–1080 across the frame; 24 px round both guides | bottom 12 % | captions; YouTube's element hover states |

s48 plays from 0.2 s in ("This is Future Got Weird: the strange future, explained. Subscribe for more, and we'll see you
around the corner."), then about 3 s of music resolve to the last frame.

**Owner's placement steps (YouTube Studio → Content → this video → Editor → End screen):**
1. Element 1, Video: the channel's other episode, or "Best for viewer". Drag and resize it to cover the panel guide,
   x 1000–1800, y 290–740 of the 1920×1080 frame.
2. Element 2, Subscribe: centre it on the disc guide at (430, 600).
3. Both elements from the end-screen start to the end of the video (the last 10 s; YouTube allows 5–20 s).
4. Check the phone preview: the wordmark, the callback art and any caption must not sit under either element.

## Recording, listening and lock

**Recording blocks.** `tools/v02v2_build.py` keeps the 20 v1 ids on their v1 takes and groups the 31 new lines into
blocks y01–y16 (consecutive new lines of one section, at most 4 lines or 420 characters): y01 n01–n04; y02 n05–n06;
y03 n07–n08; y04 n09; y05 n10–n11; y06 n12–n13; y07 n14–n15; y08 n16; y09 n17–n18; y10 n19–n21; y11 n22–n23;
y12 n24–n27; y13 n28; y14 n29; y15 n30; y16 n31. Give each one-line block its neighbours' text as context (v1 did this)
and keep only the target line. If the hook block sounds unlike s02's v1 take, regenerate s02 inside y01 with the same
words.

**Listening gate** (this environment cannot play audio; never report a take as "listened"):
- Before the owner listens: Scribe transcription of every new take (LiDAR, "nanosecond", "Dartmouth", "time-of-flight"),
  pitch and level matched at every new-to-old junction (v1 takes range 133–196 Hz median and −12.8 to −16.9 dB), pace
  check. s19 and s31 measure fast; listen before keeping them.
- Junctions to check by ear: s02 → n01; n09 → s14; s16 → n10; n11 → s18; s23 → n12; n13 → s37; n15 → s30; s31 → n16;
  n18 → s33; s33 → n19; n28 → s40; n29 → s42; s43 → n30; n31 → s47.
- For each new line with a v1 fragment fallback, compare the new take and the fragment; keep whichever splices better.
- Regenerate a whole block rather than patch one line if the new and old takes do not match.
- Pauses are caps: trim a take's own longer paragraph pause to the designed gap (16 v1 gaps overshot).

**Before lock (evidence):**
- Add P01, P02, P03, P06 and P08 (wording in `script_v2.json`, `proposed_claims_to_add_before_lock`) to
  `research/claims.csv`. P08 replaces C38. C38 and C41 are no longer used anywhere.
- Preserve `research/code_reproduction/out/*/stdout.log` and the `.npz` run states in the v2 backup (git ignores them):
  the kit-board chip and the description say we re-ran the authors' code.
- Record the opening replay mapping in the source record: `stored_xz`, start index 6, end index 474, every 2nd frame,
  one plotted position per video frame, no interpolation, about 7.8 s, labelled "sped up". The same mapping for the V10
  replay.
- Description: the D10-corrected tracking-plot text with "saved in the authors' files"; the dated software check
  (evidence brief §7.5); "History scenes are illustrations based on the papers above"; "Code (MIT License) and released
  data"; the R1 test as its own bullet (30 frames/s capture, separate test, different device).
- Chapters from the locked section starts (estimate): 0:00 How can it find what it can't see?; 0:33 What survives the
  bounce?; 1:20 How does a delay become a location?; 2:30 How new is this?; 3:07 Why is a cheap sensor
  harder?; 4:09 What can it do, and where does it fail?; 5:14 Takeaway.

## Open questions for the lead

1. **The hook question stays in the first 30 s, as the brief has it** (n06, about 0:29–0:33), and is answered from
   about 1:21 ("Farther from where?"). "First, a puzzle:" (n07) tells the viewer the scattering section is step one of
   that answer. The alternative (the questions draft: ask it at 1:21 instead) loses the brief's 0:24–0:30 arc beat; say
   if you prefer it.
2. **The software check is on screen, not spoken.** If you want it spoken, the accuracy judge's line ("We re-ran their
   code on that data, and it matched their saved results. A software check, not a new experiment.") goes after n25 for
   about +7.4 s, which takes the planning estimate to about 5:41 and leaves almost no reserve.
3. **Fragments or new takes.** The builder records all 31 new lines. Using the 11 v1 fragments instead saves about 151
   words of generation but adds new-to-old splices inside sections. The listening pass decides line by line.

## Lead review (9 October 2026)

1. **Hook question:** stays inside the first 30 s (n06), as the brief has it.
2. **Software check:** on screen (kit-board chip) and in the description only; not spoken.
3. **Recording:** all 31 new lines are recorded new. Each block is performed with the line before and the line after it
   as spoken context, and only the block's own lines are kept, so single-line blocks are not read as isolated
   announcements. v1 fragments stay as fallbacks.
4. **n25 reworded:** "Take our opening clip: an off-the-shelf kit…" replaces "Our opening clip is that second case: …".
   After the n24 question, "that second case" no longer had a clear referent.
5. **In-line pause caps** for s14, s16, s18, s20, s23 and s43 are applied by the assembler (`inner_pause_cap_ms`).

# Video 02 "How Cameras See Around Corners": defect log, review round 1

- **Render reviewed:** `exports/Future_Got_Weird_Video_02_v1_REVIEW_1080p.mp4` (6:43, 1920x1080, 30 fps, 12091 frames)
- **Date:** 2026-10-08
- **Inputs:** 54 confirmed reports from the passes dir-S1-S2, dir-S3-S4, dir-S5-S7, dir-S8-S9, accuracy, audio and viewer. A skeptic re-checked each one against exact frames, source and audio stems. Reports describing the same problem are merged here, giving **45 defects**. Five reports were refuted and are listed in Appendix A. Appendix B maps the original reports to these IDs.
- **Severity:** the verifier's verdict applies. Where reviewer and verifier disagreed, the entry says so. Where two merged reports had different severities, the higher verified one is used.
- **Fixes:** each fix is the verifier's refined fix, condensed, and names the file to change. Line numbers are approximate, as of this render. Paths are relative to `Video_02/` unless absolute.
- **Frames:** frame numbers are 0-based render frames.
- **Evidence:** `$R1` = `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/review_r1`. This is session scratch, so copy anything you need to keep. Dense sheets are under `qa/review_r1/dense/`.

## Summary

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 11 |
| Minor | 34 |
| **Total** | **45** |

| ID | Sev | Scene | Frames | Title | Main files |
|---|---|---|---|---|---|
| D01 | major | S1.2 | 215–289 | No field-of-view fan; the "aimed at the wall" setup reads as a glow behind her head | S1_ColdOpen.tsx |
| D02 | major | S1.4–S1.5 | 760–1080 | "Around the end, by way of the wall" only reads in the small plan card; the room view shows light going to her head and into the partition | S1_ColdOpen.tsx, RoomSet.tsx (opt-in) |
| D03 | major | S2.4→S3 | 2844–2878 | Settled timing card grows full-frame over a ghosted room, holds 0.3 s, then hard-cuts to a reframed room | S2_Mirror.tsx, S3_Echo.tsx, lib/shots.ts |
| D04 | major | S3.2 | 3191–3223 | Arrivals card slams in (double ease-out); paper_slide sounds 10 frames after it stops | S3_Echo.tsx |
| D05 | major | S3.3 | 3405–3561 | "Real measurements" board sits empty for about 4.3 s while the narrator says "This is real data" | S3_Echo.tsx, S3_EchoBoard.tsx |
| D06 | major | S4.6 | 5342–5348 | The red ✗ reject verdict flashes for about 5 frames | S4_Geometry.tsx |
| D07 | major | S5.2–S5.3 | 6444–6905 | Shot facts are 30 px guard-rail-style corner chips; "≈ 7 min to measure" is up for 1.4 s, away from the clock | S5_History.tsx |
| D08 | major | S6.6 | 8675–8793 | "Each step becomes a new position to follow" shows one 55 px nudge; the right panel reads as static | S6_Small.tsx |
| D09 | major | S7 (s39) | 9822–9995 | "Ordinary clothes · 30 frames/s" result is staged on our ticked kit sensor (breaks the research number firewall) | S7_Results.tsx, S7_Props.tsx |
| D10 | major | package | n/a | Description attaches 30 fps to the kit clip and says all real data were processed with the authors' code | tools/make_package.py |
| D11 | major | thumbnails | n/a | Recommended thumbnail A (and B) draws light going over the top of the partition | Thumbnails.tsx, README.md |
| D12 | minor | S1.1 (+S3, S9 openings) | 0–190, 601–640 | Far partition top is 13 px from the frame edge at the shared CAM_ROOM framing | lib/shots.ts, S4_Geometry.tsx, S1_ColdOpen.tsx |
| D13 | minor | S1.3 (+S6.7 reuse) | 300–600 | Tracking board plots our re-run (`ours_xz`) but labels it only as "processed with the authors' code" | S1_TrackingBoard.tsx |
| D14 | minor | S1.3 | 300 | Board paper_slap lands 5 frames after the board's big move ends | S1_ColdOpen.tsx |
| D15 | minor | S1 s05 (+race, S3) | 907–915 | sensor_pulse "flash" heard 8 frames before anything leaves the sensor | S1_ColdOpen.tsx, HandheldSensor.tsx (opt-in) |
| D16 | minor | S1.4, S1.7, S3.1, S9 | 663–665, 2898–2900 | PlanCard entry is double-eased: a near-pop, with the slide spent in one frame | S1_ColdOpen.tsx, S3_Echo.tsx, S9_Payoff.tsx |
| D17 | minor | S2.4 | 2620–2850 | Colour-coded path stubs come out of the partition in reverse body order | S2_Mirror.tsx |
| D18 | minor | S2.4 (+S1.7) | 2761–2769 | Metaphor-to-timing card swap: both cards go see-through over the room | S2_Mirror.tsx |
| D19 | minor | S3.1 | 2945–3175 | "Light still on the path" tally 24→1 implies 1 in 24 returns, against the real "hundreds of times weaker" | S3_Echo.tsx |
| D20 | minor | S3.2 | 3184–3395 | Open end of the room set shows around the arrivals card (wall cut line, floor slab edge) | S3_Echo.tsx, RoomSet.tsx (opt-in) |
| D21 | minor | S3.3 | 3540–3953 | Y-axis title "counts (linear scale)" is 32 px, below the 34 px body size | S3_EchoBoard.tsx |
| D22 | minor | S4.2 | 4335–4460 | "1.33 m" sits by the sensor, the partition and her token, never by him | S4_Geometry.tsx |
| D23 | minor | S4.2 | 4250–4412 | Delay numbers don't add up on screen: 8.85 ns against 1.33 m one way, and against S1's ≈ 7 ns | S4_Geometry.tsx |
| D24 | minor | S4.2 | 4383–4398 | relief_sigh breathes over the end of "direction." | S4_Geometry.tsx |
| D25 | minor | S4.3 | 4655–4705 | Second ruler idles 20 frames, then whips 90° in 8 frames and back 180° | S4_Geometry.tsx |
| D26 | minor | S4.3 | 4798–4817 | uh_oh sting plays under the payoff word "place." | S4_Geometry.tsx |
| D27 | minor | S4, S6.5 | 4110–5692, 8190–8467 | Guard-rail chips are pierced by the plan's 0.5 m tick marks | S4_Geometry.tsx, S6_Small.tsx |
| D28 | minor | S4.7 (+S5 copy) | 5545–5692 | The likely location reads as a teal stroke across his hair, and the photo X covers it | S4_Geometry.tsx, S5_Board.tsx |
| D29 | minor | S4.7 | 5651–5682 | "Not a photograph" readable about 0.85 s; picture clears before the word ends | S4_Geometry.tsx (+S5_Board/S5_History option) |
| D30 | minor | S5→S6 | 7103→7104 | Jump cut on the same plinth (1.25x, 590 px); stool and 2021 card vanish | S6_Small.tsx, S6_Plinth.tsx |
| D31 | minor | S5→S6 | 7057–7128 | Music and ambience drop to −66 dB at the act turn; groove re-enters 0.8 s late | tools/make_music_v02.py, S5_History.tsx |
| D32 | minor | S6.1 | 7166–7195 | Her fist is the sensor's foot, then slides up the grip; the teeter happens while she's holding it | S6_Small.tsx |
| D33 | minor | S6.3 | 7815–7990 | "10 × 10" printed on the research module; sources give only "≈ 100 pixels" | S6_Small.tsx, S6_ResearchModule.tsx |
| D34 | minor | S7.1 | 8798–9170 | Callback to the opening board swaps the colour code (wall points / estimate) | S7_Plots.tsx, S7_Results.tsx |
| D35 | minor | S7 (s38) | 9470–9548 | Reflective strip faces the camera, while the light reaches the board from behind | S7_Props.tsx, S7_Results.tsx |
| D36 | minor | S7 (s38) | 9707–9711 | "Flat wall" chip pops over her raised fist | S7_Results.tsx |
| D37 | minor | S7 (S6.10) | 9993–10147 | The "independent reproduction" museum slot is a different-looking museum | S7_Results.tsx |
| D38 | minor | S7 (s39 end) | 10110–10146 | Dated "none found (Oct 2026)" chip is up about 1.3 s, with off-storyboard wording | S7_Results.tsx |
| D39 | minor | S8 (S7.3) | 10620–10644 | "Not who" and the robot's "?" are wiped after about 0.7 s | S8_Warehouse.tsx |
| D40 | minor | S9.2 | 11464–11500 | "Likely location" readout leaves about 0.8 s after it lands, with a swell-and-snap exit | S9_Payoff.tsx, S9_Readout.tsx |
| D41 | minor | S9.3 | 11653–11674 | Checker's deadpan "stroll" is a scurry (a step every 5 frames) | S9_Payoff.tsx |
| D42 | minor | S9.3 (J4) | 11640–11730 | J4 never shows her line of sight getting past the near end (no S1.1 sight-line payoff) | S9_Payoff.tsx |
| D43 | minor | S9.3 (J4) | 11697–11731 | Busted reaction gets no settle; the narrator starts over it 0.7 s after the take | tools/v02_script.py, S9_Payoff.tsx |
| D44 | minor | S9 (+S1, S3 card) | 11296–11497 | Plan card and S9 readout frames cross the 5% safe margin | lib/shots.ts, PlanCard.tsx, S1/S3/S9 |
| D45 | minor | package | n/a | Upload checklist names caption and video files that don't exist | tools/make_package.py |

---

## Major defects

### D01 — S1.2: no field-of-view fan; the "aimed at the wall" setup reads as a glow behind her head
**Scene** S1 (S1.2) · **Frames** 215–289 (patch visible; covered by the board at 290) · **Severity** major · **Category** legibility · **Source** dir-S1-S2

**What.**
- The storyboard action for S1.2 is "a pale fan lights a patch of blank wall". That fan is missing.
- Frames 215–285 show only a pale yellow rectangle with dashed top and bottom edges, at screen y≈228–553, x≈698–1045. About a third of it is behind her head, half is visible between her head and the partition, and the rest is behind the partition. Nothing connects it to the sensor.
- Cause: the fov polygon `M S L p0 L p3 L p2 L p1 Z` (S1_ColdOpen.tsx ~762–768, backdrop, fill only) is degenerate at tilt 0. The sensor point S projects to world (788,491), which is *inside* the patch rectangle (655–923 × 258–509), so the "fan" is just the patch filled twice.

**Why.** This beat sets up the premise: the sensor sees only the wall. With the sound off, a pale rectangle near her head reads as a glow, not as where the sensor is aimed. The director report (qa/scene_review/S1/REPORT.md:127, "wedge mostly behind her head") describes something that was never rendered. Two parts of the reviewer's fix don't work:
- "Pan right": CAM_PUSH is a 2D camera with no parallax, so the patch and her head move together.
- "Rays over her shoulder": the top-left ray crosses her glasses, and she stands in front of the sensor-to-wall volume, so painting rays over her gets the depth wrong.

**Fix** — `source/src/scenes/S1_ColdOpen.tsx`, backdrop block (~730–770):
1. Remove the degenerate fov path.
2. Build a frustum in the room projection. For u∈[0,1], the cross-section corner is `P(lerp(sensor.x, cornerX, u), lerp(sensor.z, 0, u), lerp(SENSOR_H, cornerH, u))`.
3. On K.pointed, animate u from 0 to 1 over about 14 frames with E.out. Draw the moving cross-section as a dashed saffronDeep rectangle (stroke 3–4, dash "10 8") with saffronLight fill at about 0.35. It grows out of the sensor's window and lands on K.plain as the existing patch; keep the 10-frame patch fade.
4. Leave a still frustum on screen until the cut:
   - ghost cross-sections at u≈0.35 and u≈0.7, outline only, opacity about 0.35;
   - four thin dashed corner rays from S to the patch corners, opacity about 0.6.
5. Keep all of it in the backdrop, so she (z 0.95) and the partition occlude it. Keep it under the partition, and run `assertAroundTheEnd` on the new rays at tilt 0 and CAM_PUSH zoom.
6. Optional: a saffron glint on the sensor's top-back edge at K.pointed.
7. Docs: correct qa/scene_review/S1/REPORT.md line 127.

**Evidence.** `$R1/verify_fan/f240.png`, `$R1/verify_fan/degenerate_overlay.png`, `$R1/verify_fan/f212.png`, `$R1/verify_fan/f200.png`, `$R1/verify_fan/f290.png`; `$R1/dirS1S2/f240.png`, `$R1/dirS1S2/fan_check.png`, `$R1/dirS1S2/patch_zoom.png`.

---

### D02 — S1.4–S1.5: "around the end, by way of the wall" only reads in the small plan card
**Scene** S1 (S1.4–S1.5, s04 and the first pulse) · **Frames** 760–1080 · **Severity** major · **Category** story/clarity · **Source** viewer

**What.** The card in the top right ("seen from above", 480x408, about 192 px wide on a phone) shows the route correctly. The room view, which dominates the frame, does not:
- **S→W leg.** It rises to the diamond at about (740,385), at her head height. The glow's rim is 23 px from her head and 33 px from her pencil tip.
- **W→H leg.** It runs about 75 px to the partition's far edge at about (815,425) and stops. The "blocked" ghost line also stopped on that edge, so both lines look as if they end on the partition.
- **"Gap" label.** Its leader ends on bare wall at about (795,450). GAP_PT is placed at light height, not on the floor.
- **The real opening.** It is only a faint GapMarker on the floor (x 765–815, y 760–870, white at 0.55), next to the tripod leg.
- **Wall scatter fan.** At f960 it spreads around her face and pencil. At phone size it reads as her pencil sparkling.

**Why.** This is the one mechanism the episode depends on, and S9 replays it. A muted first-time viewer sees light go to her head and into the screen. Nothing is physically wrong; the problem is legibility. The director accepted it as a limitation. The verifier judges it a real viewer problem.

The reviewer's proposed fix, a 900 px card on the right, would cover him and his reactions: the worry at ROUTE0+12, the rim flash at about f1000 and the flinch at f1007.

**Fix** — `source/src/scenes/S1_ColdOpen.tsx`, plus opt-in props in `components/v02/RoomSet.tsx` (shared pass):
1. **Reframe the room, not the card.** Add a local `CAM_PATH_S1 = {...CAM_PATH, cx: CAM_PATH.cx + 176}`, which moves the room 220 screen px left (her left edge to about x 99, his elbow to about x 1070).
   - Use it in place of CAM_PATH for S1.4–S1.5: roomCam's rise target (~652), GAP_LEADER (~440), and every load-time check that uses CAM_PATH (~1383, 1395, 1402, 1411, 1414, and the rise list ~1439).
   - Shift every screen-px box placed at CAM_PATH by −220 x (GAP_LABEL → x 470).
   - **Do not change `CAM_PATH` in shots.ts.** S3 and S9 share it.
2. **Enlarge the S1.4–S1.5 plan card to 1.5x** (about 720x612). Either scale the wrapper, or pass `area={{w:672,h:495}}` with `viewForArea(PLAN_VIEW, area)` and multiply the light widths by 1.5.
   - Keep it inside the 5% margin (see D44): right edge ≤ 1824, top ≥ 56.
   - Feed the scaled box to the cardHim, cardBlocked, cardGapLabel and cardChips clearance checks (≥ 20 px each).
   - If the S1.6 pan to CAM_PATH_SIDE now reads as a whip, start PAN0 a few frames earlier.
3. **Point "gap" at the opening.** Set `GAP_PT = projectWith(RAISED_VIEW, {x: OCC.x, z: OCC.z0/2, h: 0})` (line ~438).
   - In RoomSet.tsx GapMarker, add opt-in `patchOpacity` (default 0.55) and `outline` (default false).
   - S1 passes patchOpacity 0.9, halfW 0.18 and outline (a 3 px inkMuted dashed edge). Ink and white only, no saffron (PATH_LEGIBILITY_PLAN).
4. **Separate the wall spot from her pencil.**
   - At the hard cut back (CUT), place her about 0.15 m further from W3 for S1.4–S1.7, and move her PlanCard token to match.
   - Raise GLOW_HEAD_PX and GLOW_PENCIL_PX (~1303–1304) to 40 and test the glow *rim*.
   - If moving her is rejected for continuity, clip the scatter-fan rays and the glow with `rigCovers(her, q, 24)` instead.
   - Check that the S1→S2 handoff (S1 end at 1826) still matches if her mark changes.
5. Re-render 760–1080. Check at 0.4 scale that the route reads in the card and that his reactions at ROUTE0+12, ~1000 and ~1007 stay visible.

**Evidence.** `$R1/verify_s1_plan/f810.png`, `$R1/verify_s1_plan/f960.png`, `$R1/verify_s1_plan/f990.png`, `$R1/verify_s1_plan/f1020.png`, `$R1/verify_s1_plan/zoom3.png`, `$R1/verify_s1_plan/phone_grid.png`; `$R1/viewer/f810.png`, `$R1/viewer/f990.png`, `$R1/viewer/f990_40.png`. Source: S1_ColdOpen.tsx:436–440 (GAP_LABEL/GAP_PT); RoomSet.tsx:355–369 (GapMarker).

---

### D03 — S2.4→S3: timing card takeover over a ghosted room, a 0.3 s hold, then a hard cut to a reframed room
**Scene** S2 (S2.4) → S3 · **Frames** label settled 2844; grow 2849–2864; card static 2865–2873; cut 2874; S3 push 2878–~2920 · **Severity** major · **Category** transition · **Source** dir-S1-S2

**What.**
- About 5 frames after "what survives: timing" settles, the timing card scales 2.06x to fill the frame. The label font goes from about 52 px to 107 px.
- A paper overlay dissolves the room out from about 2852 to 2859. At 2853–2858 (clearest at 2856) the checker, the guesser, the tripod, the partition and the dashed paths are see-through.
- The full card holds only 9 frames (0.30 s), then hard-cuts at 2874 to S3's CAM_ROOM {880,565,1.2}. S2's last room camera was CAM_D {585,470,1.2}: same zoom, but about 354 px left and 114 px up.
- S3 then starts its own push 4 frames later (2878).

The result: label lands, push into card, 0.3 s card, cut to room, push again, all within about 2.5 s.

**Why.** It breaks written rules:
- "Settled labels do not move" (DIRECTION.md:83, SCENE_BRIEF.md:62).
- "The S2→S3 pair (2870–2882) must read as one room at tilt 0" (qa/PATH_LEGIBILITY_PLAN.md:330).

On the act's key takeaway it reads as a glitchy double transition. Legibility is fine, so this is major, not a blocker. The S2 director left it open for the lead. The S3 report's claim that S3 opens on CAM_D is stale: S3_Echo.tsx:214 has `CAM_OPEN = CAM_ROOM`.

**Fix (recommended option a, a one-room match cut; prototyped in qa/scene_review/S3/final_cut_pair_2873_2874.png):**
1. `source/src/scenes/S2_Mirror.tsx:455`: set `TAKEOVER_DUR = 0` (or delete the takeover block). The card stays at its settled 700 px size and the room stays opaque through 2873. Update the comment at 448–452.
2. **Shared pass**, `source/src/lib/shots.ts`: add `export const HANDOFF_S2S3: Cam = {cx: 585, cy: 470, zoom: 1.2};`.
   - S2_Mirror.tsx:273: `const CAM_D = HANDOFF_S2S3`.
   - `source/src/scenes/S3_Echo.tsx:214`: `const CAM_OPEN: Cam = HANDOFF_S2S3`, and rewrite the comment at 208–213. S3 already opens at tilt 0 in S2's final poses.
3. Check the S3 asserts:
   - CARD_IN (~250) is derived from `camOf(g)`, so make sure it doesn't throw and that the plan card still lands before the route draws (about 2903).
   - Keep PUSH0 (~153).
4. Optional (S3): draw the same "what survives: timing" card at S2's settled rect (x 92–792, y 540–912) for S3's first frames, and slide it out left over about 8 frames from 2878. This hides most of the bare paper at the left of CAM_D.
5. Re-render a cut sheet as qa/cuts/r3 at 2866, 2870, 2873, 2874, 2876 and 2882, and check the "one room at tilt 0" rule.

**Fallback (option b), only with the lead's explicit sign-off:**
- Start TAKEOVER0 ≥ LABEL_T+21.
- Grow over 8–10 frames and hold the full card ≥ 15–20 frames. This needs K.end − TAKEOVER0 ≥ about 28.
- Use an opaque wipe instead of the room dissolve.
- Delay S3's PUSH0 by ≥ 10 frames.

Option b still breaks both rules.

**Evidence.** `$R1/verify_s2cut/evidence_takeover_sequence.png`, `$R1/verify_s2cut/evidence_2856_ghost_crop.png`, `$R1/verify_s2cut/pair_2846_2874.png`; `$R1/dirS1S2/r2856.png`, `$R1/dirS1S2/s2h_tile.png`, `$R1/dirS1S2/s2g_tile.png`, `$R1/dirS1S2/cut_cmp.png`. Source: S2_Mirror.tsx:453–455, ~1278; S3_Echo.tsx:214; lib/shots.ts:25.

---

### D04 — S3.2: the arrivals card slams in; the slide sound comes after it has stopped
**Scene** S3 (S3.2) · **Frames** card 3191–3196; sound 3205–3223 · **Severity** major (borderline minor) · **Category** motion/audio · **Source** dir-S3-S4

**What.**
- **Picture.** The 808x778 "arrivals at the sensor" card covers 743 of its 944 px of travel in one frame. At 3191 there is no card. Its right-border offset is then −201 at 3192, −42 at 3193, −9 at 3194, −2 at 3195 and 0 at 3196. At 3192 the header is clipped to "vals at the sensor".
  - Cause: a double ease-out. `tw()` already defaults to E.out (lib/motion.ts:33) and BlockCard applies E.out again (S3_BlockCard.tsx:47).
- **Sound.** paper_slide is a "stroke" sample aligned on its onset, about 1 s long, swelling for about 14 frames. It starts at 3205 (CARD0+CARD_DUR−2), 10 frames after the card stopped, peaks around 3219, and overlaps the first block_drop at 3211.

**Why.** Nothing may pop, and this is a pop on a card about 42% of the frame wide at the start of a beat. The slide sound plays when nothing is sliding.

**Fix** — `source/src/scenes/S3_Echo.tsx`:
1. Line 1015: `enter: tw(g, CARD0, CARD_DUR, E.linear)` and keep CARD_DUR = 16. The single E.out gives offsets of −944, −694, −489, … and lands within 3 px at CARD0+12.
   - Optional: use E.softBack in `components/v02/S3_BlockCard.tsx:47` for a small overshoot.
   - Leave WALL0 alone.
2. Line 636: `{f: CARD0, kind: 'paper_slide', gain: -4}`. Put the cue on the *start* of the move, because the sample swells from its onset.
3. Audio rebuild (see the Fix plan). Check on the render:
   - the card moves on every frame from 3192 to about 3203, with no step over about 250 px;
   - the paper_slide onset is at 3191 and has decayed by 3211.

**Evidence.** `$R1/verify_s3card/strip_3191_3196.png`, `$R1/verify_s3card/ex_03192.png`; `$R1/dirS3S4/s3h/cardin.png`, `$R1/dirS3S4/s3/f03360.png`. Audio: `audio/sfx/v2/placed.json` (paper_slide f=3205).

---

### D05 — S3.3: the "Real measurements" board sits empty for about 4.3 s under "This is real data"
**Scene** S3 (S3.3) · **Frames** 3405 (board lands) – 3537 (first pen dot) – 3561 (spike top) · **Severity** major · **Category** pacing · **Source** viewer

**What.**
- The board lands at 3405 on "is real" ("real" 3408, "data" 3414). The axes are in by about 3420.
- The plot area then stays empty until about 3537 ("the wall's"), and the spike tops out at about 3561 ("echo"). That is about 4.3 s of empty axes under a "Real measurements" headline, including about 1 s of narration silence (3508–3537).
- Motion still-runs: 3448–3475, 3482–3508 and 3511–3552.
- The cause is deliberate cueing: `DRAW_A0 = max(LAND+16, K.walls-4)`, `DRAW_A1 = max(DRAW_A0+14, K.echo15)` (S3_Echo.tsx:325–327).

**Why.**
- With the sound off, an empty chart titled "Real measurements" reads as missing data, which fails the muted test (DIRECTION §6).
- It breaks the episode's own convention: S1 shows plotted data on "this is real data".
- It stalls the act's evidence reveal.

The director accepted this as a designed hold. The verifier judges it a real problem. It is not a blocker, because the chips give the viewer something to read.

**Fix** — `source/src/scenes/S3_Echo.tsx` and `source/src/components/v02/S3_EchoBoard.tsx`:
1. Add `real: at('s15','real')` and `data: at('s15','data')` to K.
2. Replace lines 326–327:
   - `DRAW_A0 = Math.max(LAND + 10, K.real)` (≈3415)
   - `DRAW_A1 = Math.max(DRAW_A0 + 16, K.data + 10)` (≈3431)

   Leave DRAW_B0/B1 (the tail on "a few nanoseconds later") and LENS0 unchanged. The conditions chip, source chip, 3×3 box and "plotted: the centre zone" then build over a plotted curve.
3. Line ~1140: `spikeLabel: tw(g, Math.max(DRAW_A1 + 2, K.walls - 2), 10)`, so "wall's echo" still lands on "the wall's big echo".
   - Add a `spikePulse` prop (`tw(g, K.walls - 2, 14, E.inOut)`). In S3_EchoBoard (~287), scale the peak dot 1→1.5→1, or flash the stroke teal.
4. In S3_EchoBoard (~280–284), add a `pen` opacity prop so the pen-head dot doesn't sit on the curve's foot during the now ~5 s gap:
   - 1 while drawing;
   - fade out over about 6 frames after DRAW_A1;
   - back to 1 at DRAW_B0.
5. No SFX changes. Re-render 3390–3660 and check:
   - the spike is plotted from about 3431;
   - no still-run of 1 s or more between 3440 and 3555;
   - tsc and the EchoBoard asserts pass.

**Evidence.** `$R1/verify_s3_empty/f3405.png`, `f3420.png`, `f3440.png`, `f3480.png`, `f3520.png`, `f3540.png`, `f3555.png`, `f3570.png`, `$R1/verify_s3_empty/grid.png`; `$R1/viewer/e3480.png`; `qa/review_r1/dense/S3_sheet02.jpg`; `qa/review_r1/dense/motion.json`.

---

### D06 — S4.6: the red ✗ reject verdict flashes for about 5 frames
**Scene** S4 (S4.6, "whose predicted") · **Frames** 5342–5348 · **Severity** major · **Category** timing · **Source** dir-S3-S4

**What.**
- The ✗ timeline: absent at 5342, about 77% at 5343, full at 5344–5346, about 50% at 5347, a faint ghost at 5348, gone from 5349. That is 3 frames at full and about 5 in all (0.17 s).
- Candidate 1's predicted ticks fade at 5347–5350, and the predicted row is then empty from 5350 to 5353.
- By contrast, the ✓ arrives at 5377 and holds until the card leaves.
- Cause: `vt = tw(g, EX1+17, 8) * (1 - tw(g, EX2-5, 5))` with EX1 = 5325 and EX2 = 5351, so the fade-out starts 4 frames into the 8-frame fade-in (S4_Geometry.tsx:746).

**Why.** The reject verdict is how "keeping those whose predicted echoes match" reads with the sound off. As a red blip it is a forbidden flash, too short to read, and it weakens the reject/keep contrast. The indicator_no cue is placed correctly but sounds over a mark the viewer barely sees.

**Fix** — `source/src/scenes/S4_Geometry.tsx` (S4.6 block):
1. Lines 257–259: `const EX2 = Math.max(EX1 + 34, K.predicted + 8);` (≈5359). CHECK stays 5377, so the ✓ still lands on "match". Candidate 2's ticks reveal from about 5361.
2. Line 746, reject branch: `tw(g, EX1 + 12, 6) * (1 - tw(g, EX2 - 5, 5))`. The ✗ is then at full opacity 5339–5354 (16 frames).
3. Re-tie the rejected candidate's cues to EX2:
   - line 539: `if (d.id === DOTS.length - 2) return tw(g, EX2 - 6, 8);`
   - line 747: replace `(1 - tw(g, EX1 + 26, 4))` with `(1 - tw(g, EX2 - 5, 5))`
4. SFX (line ~903): `{f: EX1 + 12, kind: 'indicator_no', ...}`.
5. Re-render 5330–5400 and check:
   - the ✗ is at full opacity for at least 15 frames;
   - no empty predicted row longer than about 3 frames;
   - the ✓ still starts on 5377.

**Evidence.** `$R1/verify_s4x/sheet_a.png`, `$R1/verify_s4x/sheet_b.png`, `$R1/verify_s4x/f_05345.png`; `$R1/dirS3S4/s4f/x_flash.png`, `$R1/dirS3S4/s4e/cand_sheet.png`. Source: S4_Geometry.tsx:257–259, 539, 744–747, ~903.

---

### D07 — S5.2/S5.3: the shot facts are 30 px guard-rail chips in a corner; "≈ 7 min to measure" is up for 1.4 s, away from the clock
**Scene** S5 (S5.2 2018 exhibit, S5.3 2021 exhibit) · **Frames** 6444–6575 (2018 rebuild chip), 6531–6573 ("≈ 7 min" at full opacity), 6722–6905 (2021 chip) · **Severity** major (low end; the dir-S5-S7 report on chip size alone was verified minor) · **Category** legibility · **Source** dir-S5-S7 + viewer (merged)

**What.**
- Three facts are set as `<Chip tone="paper" size={30}>` chips in the top-left stack (S5_History.tsx 462–489, lines 472/477/487), styled exactly like the "illustration" chip above them:
  - "reflective exit sign: ≈ 1 s to rebuild"
  - "≈ 7 min to measure"
  - "live · ordinary objects"
- They sit about 550 px from the laptop and clock they describe.
- "≈ 7 min to measure" is at full opacity only from 6531 to 6573 (1.43 s), then fades as the camera trucks to 2021.
- The wall clock (about 1050,165) has no readout; its hand sweeps about 42°.
- By contrast, the laptop's "1 s" is about a 48 px font on the object, and 2021's "5 frames/s" is a boxed readout on its monitor.
- The text is exactly at the 30 px guard-rail floor, not below it. The reported "22–27 px" is just the glyph height of a 30 px font.

**Why.**
- The contrast "1 s against about 7 minutes" is the point of S5.2 (storyboard S5.2; C23/C24).
- These are results, so they are body text and need ≥ 34 px, not guard-rail text.
- With the sound off, the clock sweep means nothing, and 2021's "sped up measuring" loses its setup. The narration carries it with the sound on.

**Fix** — `source/src/scenes/S5_History.tsx` (alternative for the 2021 line: `components/v02/S5_Exhibits.tsx`):
1. **Clock readout.** After the WallClock (~line 404), add a world label: `<WLabel x={P2 + 150} y={MU.slabTop - 432} w={340} h={58} size={32} text="≈ 7 min to measure" t={lblT(CHIP2B, 1)} to={{x: P2 + 116, y: MU.slabTop - 400}} from={{x: P2 + 150, y: MU.slabTop - 403}} />`.
   - At CU2 that is about a 41 px font, at screen x 1152–1587, y 128–202, right of the clock and above the board.
   - No fade-out: it trucks off with the exhibit.
   - Add a chip_pop at CHIP2B.
   - Optional: start it at MEAS0+4 as a live mono count-up that settles to "≈ 7 min to measure" at 6.8 min, or push TRUCK3 back by about 10 frames. Re-run the ±20% timing simulation either way.
2. **Remove the duplicate.** Delete the chip2b corner chip (475–479) and its const (367).
3. **2018 conditions chip.** Restyle chip2a as a fact chip: `<Chip tone="paper" size={36} style={{color: C.ink, border: \`3px solid ${C.ink}\`}}>`, either "reflective exit sign: ≈ 1 s to rebuild" or just "reflective exit sign". It spans about x 96–782, y 118–182 and clears the clock.
4. **2021 chip.** Take "live · ordinary objects" out of the corner stack. At 36 px in place it would hit the "5 frames/s" card (screen about x 477–828, y 150–272).
   - Render it as its own absolutely positioned div at about left 900, top 96, size 36, ink-border style. Keep its opacity expression.
   - Alternative: make it the top line of the readout card in S5_Exhibits.tsx, at ≥ 26 world px (≈ 36 px on screen), and enlarge the rect to fit.
5. Keep "illustration" and the 2012 source chip as 30 px corner chips.
6. Check frames 6531, 6560, 6585 and 6800:
   - nothing overlaps the clock or the readout card;
   - everything is inside the 5% margin and above y 950;
   - the text is legible at phone size.

**Evidence.** `$R1/verify_s5chips/f6545.png`, `$R1/verify_s5chips/chipfade.png`, `$R1/verify_s5chips/f6880.png`; `$R1/viewer/f6545.png`; `$R1/dir567/s5_2018.png`, `$R1/dir567/s5_2021.png`; `qa/review_r1/dense/S5_sheet03.jpg`. Source: S5_History.tsx:363–368, 404, 462–489.

---

### D08 — S6.6: "each step becomes a new position to follow" is one 55 px nudge; the right panel reads as static
**Scene** S6 (S6.6, s35 right panel "keep the sensor still") · **Frames** right panel lit about 8675–8793; the only motion is 8732–8749 · **Severity** major (dir-S5-S7 verified minor; viewer verified major) · **Category** story/clarity · **Source** dir-S5-S7 + viewer (merged)

**What.**
- The right panel shows zero change from 8680 to 8731. The token and cloud then slide from H_A to hiddenB over 8732–8749: about 54 px at 1080p (centroid 1674,725 → 1724,748), about 18 px at phone size.
- After that it is completely static until the wipe at about 8794 (44 frames, 1.47 s).
- The cloud is drawn on the token, so the two move as one object.
- The dashed outline of the old patch sits across his shirt and hair, and the white-to-saffron trail (about 50 px) is mostly hidden under the cloud.
- In contrast, the left panel has a clear before and after.

Two of the reviewer's details are wrong:
- The panel is dimmed only during the left panel's sentence, which is the intended behaviour.
- He is about 85–90 px from the panel's right border, not against it.

**Why.** This is the second half of "one unknown at a time", and it sets up the walking-person tracking board that wipes in next (C31). With the sound off, the two panels can't be told apart. The 11 cm step is honest (layout hiddenB dt 0.1 s), but a single step doesn't read as "each step". The director accepted it as a limitation.

**Fix** — `source/src/scenes/S6_Small.tsx` (rightState ~840–851, timing ~180–182, CAM_R, SFX list):
1. **Frame-to-frame track.** H_A (2.60, 0.85) → H_B (2.70, 0.90, from layout) → H_C ≈ (2.76, 0.78) → H_D ≈ (2.79, 0.64). The track bends toward the wall, about 0.33 m (about 160 px) in all.
   - Mark H_C and H_D as illustrative; the panel's "illustrative" chip covers them on screen.
   - Lead decision: put them in research/geometry/layout.json (additive, synced with tools/sync_layout.py) or keep them local. See the Fix plan.
   - Do not use 35 cm strides, and do not crop the panel 2x tighter. Either would leave the view or drop the still sensor.
2. **Timing.** Cue the three moves on at('s35','each'), at('s35','step') and at('s35','position'), 10–12 frames each with E.inOut, so the last one settles about 1 s before the wipe.
3. **Recompute at each position.** Use `bandsFor(WA, pos, HW1)` and `possibleCloud(GRID_R, …)`.
   - Add `assertPath([SA, w, H, w, SA], LAYOUT)` for H_C and H_D. GRID_R already covers both.
   - Optional: let the cloud lag the token by about 5 frames, so it visibly catches up after each step.
4. **Breadcrumbs at each position he leaves:**
   - a saffron dot with an ink ring;
   - a faint dashed outline of the cloud computed there (opacity about 0.5; generalise ghostLoops to an array);
   - a dotted line from dot to dot.

   Draw these ABOVE the token, with a cream halo.
5. **Keep inside the margin.** The token outline must stay ≤ 1824 px (5% margin). If H_D pushes it past that, pan CAM_R to `camOnPlan(2.16, 0.51, 2)` (−29 px), then re-check the checker and sensor at the panel's left edge.
6. **Sensor and sound.** Keep the checker and sensor completely still; an optional sensor pulse per step is fine. Add one footstep_wood SFX per step at −14 dB.
7. **Verify.** Re-render 8650–8798. The cloud centroid should travel at least 150 px, and the result should read at phone size.

**Evidence.** `$R1/v_s6split/right_grid.png`, `$R1/v_s6split/step_zoom.png`, `$R1/v_s6split/zoom_8720_8760.png`, `$R1/v_s6split/phone_8720.png`, `$R1/v_s6split/phone_8760.png`, `$R1/v_s6split/f8680.png`; `$R1/vS6right/before_after_right.png`, `$R1/vS6right/zoom_target.png`, `$R1/vS6right/phone_pair.png`; `$R1/viewer/s66_40.png`, `$R1/viewer/u8700.png`, `$R1/viewer/u8795.png`; `$R1/dir567/s6_right.png`, `$R1/dir567/s6_split.png`; `qa/review_r1/dense/S6_sheet05.jpg`.

---

### D09 — S7 (s39): the "ordinary clothes · 30 frames/s" result is staged on our ticked kit sensor
**Scene** S7 (storyboard S6.10, s39) · **Frames** pull-back about 9822–9850; chip about 9870–9995 · **Severity** major · **Category** accuracy · **Source** dir-S5-S7 + accuracy (merged)

**What.**
- In s38 (9680–9800) the tripod sensor is established as "the kit": flat wall, empty-room scan, and a tick on its own screen.
- s39 follows with no cut, only a pull-back. The same teal kit stays on its tripod with the tick still lit; S7_Results.tsx:966 keeps the tick on deliberately. He walks behind the partition, and a film strip ticks along.
- From about 9870 the chip reads "reported: person in ordinary clothes · 30 frames/s capture". The only separator is a 30 px line, "a different capture from our clip". That separates the *recording*, not the *device*.
- The narration says "with the sensor capturing thirty frames a second" right after "the kit needs…".
- The s38 reflective-strip board is still standing where he walks, so "ordinary clothes" plays next to the reflective prop.

**Why.** This breaks the research number firewall:
- 30 Hz capture and "ordinary clothes" belong to R1 only. The R8 kit dataset's capture rate is unresolved (EXPERIMENT_RECORD §6 lines ~100, 212, 371).
- OPENING_EVIDENCE forbids these labels for the kit and requires the headline-device chip to be visually separate from the kit.
- With the sound off, the picture says "this kit tracks people in ordinary clothes at 30 fps".
- It also goes against the episode's own colour code: S6_ResearchModule makes the authors' device saffron so it never reads as the teal kit.

It is not a blocker, because every word on screen is literally true. The director listed it as a limitation; both verifiers judge it a real problem.

**Fix** — `source/src/scenes/S7_Results.tsx` (RoomShot / s39 block, chip ~1203–1209, tick line 966) and `source/src/components/v02/S7_Props.tsx`:
1. **Take the kit out of the s39 picture.** Either:
   - **(a) preferred:** at S39CAM0 (about 9800–9830, after "But the authors"), cut to a framed "authors' clip" card in evidence-board style. Its header, ≥ 34 px, reads "the authors' own clip · our drawing". It holds the partition, his walk, the FilmFrames strip and its "slowed down" chip, plus the neutral device. The checker is not in it (she is tied to the kit). Recut his marks for the new framing and keep the `need()` checks.
   - **(b):** keep the pull-back and cross-fade the tripod head, over about 10 frames during S39CAM0…+S39CAM_DUR, from the teal HandheldSensor to the neutral device.

   Either way:
   - end the ScanScreen tick at S39CAM0 (line 966);
   - add a throw that the teal kit is not drawn when `g >= K.ordinary`;
   - add a pill, ≥ 34 px, "authors' own research device", clear of the film strip and the margin.
2. **Neutral device.** Add `AuthorsSensor` in S7_Props.tsx: a flat grey box (C.inkSoft or paperDeep) on a plain stand, with no screen, tick, LED or teal. Do not use S6's saffron ResearchModule unless the lead decides the R1 device is the smartphone-grade one; the research docs disagree on this (see lead decisions).
3. **Remove the s38 TargetBoard before he walks.** Either he carries it off, hand on its edge, or it slides out during the pull-back. Add a throw that it is gone before K.ordinary.
4. **Chip.**
   - Line 1, ≥ 40 px (44 if it fits inside 96–1824; otherwise break after "clothes"): "Reported by the authors: person in ordinary clothes · 30 frames/s capture".
   - Line 2, ≥ 34 px: "their own research device, not our kit data · device data not released".
   - Keep both above y 950.
   - Do not use "smartphone-grade" or "phone". "Not the kit" is supported by EXPERIMENT_RECORD R1 ("visibly not the red-housed ST module"), but "not our kit data" is the safest true wording.
5. Leave CUT_MUSEUM unchanged.
6. **Optional, lead decision:** re-voice s39 as "…tracking a person in ordinary clothes with their own research device, capturing thirty frames a second". Update script/SCRIPT.md, the SRT (script/subtitles_v2.srt cues 124–125) and STORYBOARD.md S6.10 (whose chip text also omits the device).

**Cheaper fallback:** keep the camera.
- From S39CAM0, fade the stand item (SensorStand, HandheldSensor and ScanScreen) to about 35% with a grey overlay over ≥ 10 frames, and clear the tick.
- Add a ≥ 30 px tag, "our kit: not this result".
- Make the chip changes from step 4.

**Evidence.** `$R1/verify_s39/f9780.png`, `$R1/verify_s39/f9867.png`, `$R1/verify_s39/f9950.png`, `$R1/verify_s39/f9950_kit_chip_crop.png`; `$R1/v_s7chip/f9960.png`, `$R1/v_s7chip/grid1.png`; `$R1/dir567/s7/f9950.png`, `$R1/dir567/walk_sheet.png`; `$R1/acc/f9960.png`; `qa/review_r1/dense/S7_sheet03.jpg`, `qa/review_r1/dense/S7_sheet04.jpg`, `qa/review_r1/dense/S1_sheet01.jpg`. Research: OPENING_EVIDENCE.md 107–108 and 136; EXPERIMENT_RECORD.md 100, 212, 371; claims.csv C37.

---

### D10 — Package: the description attaches 30 fps to the kit clip and overclaims processing
**Scene** package (`package/description.txt` NOTES bullet 1; `package/UPLOAD_PACKAGE.md:18, 43`) · **Severity** major · **Category** accuracy · **Source** accuracy

**What.**
- The first NOTES bullet reads: "The tracking clip comes from the authors' open evaluation kit with the sensor held still; … 30 frames per second is the sensor's capture rate as the authors report it, not the processing time."
- The only sensor named before "the sensor's" is the kit, so the 30 fps reads as the kit clip's capture rate.
- It also says the real measurements were "plotted by us and processed with their published code". The S3.3 echo plot is raw counts (provenance A in make_figures.py); only the tracking and the U reconstruction went through the authors' code.
- It omits facts from OPENING_EVIDENCE §4 (retroreflective setting, capture date/rate not stated, not the smartphone-grade device).
- The film (S7.4 chip) keeps these apart; the description does not.

The ≈ 14 frames/s figure is the authors' video playback rate. It is not a capture rate either, so the capture rate stays "unresolved".

**Why.** This is a direct breach of EXPERIMENT_RECORD §6: never combine numbers across records "on screen, in narration or in the description", and the firewall row says never attach 30 Hz to the R8 dataset. It is public text.

**Fix** — `tools/make_package.py` (it generates both package files, lines 81 and 108; do not hand-edit them):
1. **Line 52.** Replace with: "The real measurements shown are the researchers' own released data, plotted by us. The tracked positions and the U-shaped reconstruction were computed with their published code, run by us. The echo plot shows raw sensor counts."
2. **Line 69, NOTES bullet 1.** Replace with: "Tracking plot (opening and 4:53): the authors' released measurements from a low-cost STMicroelectronics VL53L8-series evaluation-kit sensor (16 zones), held still and aimed at a wall while a hidden person moved behind a screen. The positions were estimated with the authors' published code and settings, run and plotted by us, and mirrored to match our room. The authors' code processes these data with its retroreflective-target setting, and what the person wore is not documented. Capture date and frame rate are not stated in the release. These data come from the evaluation kit, not from the smartphone-grade research device used for the paper's main results, whose data were not released."
3. **New bullet.** "The person-in-ordinary-clothes result at 30 frames per second is what the authors report for a different capture, not this kit clip. 30 frames per second is the capture rate, not the processing time."
4. **Optional, bullet 2.** "The U-shaped reconstruction used a different sensor (3×3 zones) moved through 36 known positions, with the object held still."
5. Drop "the authors' open evaluation kit": the kit is an ST product; only the code is the authors'.
6. Rerun `python3 tools/make_package.py`. Grep `package/` for "30 frames" and confirm it appears only in the new separate bullet. Do this together with D45 (same script).

**Evidence.** `package/description.txt`, `package/UPLOAD_PACKAGE.md:18,43`, `tools/make_package.py:52,69,81,108`; `research/EXPERIMENT_RECORD.md:9,371,372`; `research/OPENING_EVIDENCE.md` §3 and §4; `research/code_reproduction/scripts/make_figures.py` (PROV_A for the echo plot).

---

### D11 — Thumbnails A (recommended) and B draw the light going over the partition
**Scene** thumbnails (`thumbnails/thumb_A*`, `thumb_B*`) · **Severity** major · **Category** physics/legibility · **Source** accuracy

**What.**
- **A:** a thick saffron leg runs from the tripod sensor, clearly above the coral slab's top face, to a burst high on the back wall (about 975,75 at 1280 scale), then drops onto the crown of his hair, where a spark sits.
- **B:** the same route, cropped tighter.
- The slab's base is off-frame, so no gap to the wall shows.
- At 320x180 it reads plainly as "light over the partition, off the wall, onto his head". This is the tall "^" shape that PATH_LEGIBILITY_PLAN calls "the strongest 'over the top' picture".
- History: the thumbnails were committed at 295e796, before the path-legibility plan (2a1f06c) and fix (43850e7), and never regenerated.
- In the thumbnail's own hidden 3D (a 0.46×0.45 m pillar 2.4 m tall, at its own LAYOUT), the leg passes behind the pillar. The fault is what the viewer sees, not the maths.
- thumb_C routes around the end correctly.

**Why.** It is the first image viewers see, marked "recommended", and it draws the one route the episode was rebuilt to rule out (C04, "It goes around the end, by way of the wall"; rule: never over the top).

**Fix (lead decision).**
- **Quickest:** make thumb_C the recommendation in README.md line 28 (and in the package checklist, if it names thumbnails), and withdraw A/B until redrawn.
- **Proper redraw:** in `source/src/Thumbnails.tsx` (plus `components/v02/Thumb_Kit.tsx`):
  1. Use the film's geometry from `source/src/data/layout.json`:
     - a thin partition at x 2.0, z 0.65–2.15, 2.0 m tall;
     - S (1.65, 0.9), W3 (1.9451, 0), H (2.6, 0.85);
     - one light plane at h 0.95.

     Better still, build it from the film kit (lib/room.ts proj/ViewState, Partition.tsx, RoomSet.tsx GapMarker) at RAISED_TILT 0.10.
  2. Frame low enough that the floor gap is visible, and draw the GapMarker.
  3. The W→H leg must pass behind the partition's far vertical edge. Hide its far-side part with `partitionHides`.
  4. Call `assertAroundTheEnd` on [[S, W, H]] at the thumbnail's tilt and zoom, and throw if any visible leg pixel lies above the partition's top edge within its x-span.
  5. Move the arrival cue to his wall-side torso at 0.95 m (rimFlash or a chest HitSpark), not the top of his head.
  6. Optional: a small "seen from above" inset.
  7. Re-render the thumb_A/B .png, _1280.jpg and _small.png files, and check them at 320x180.

**Evidence.** `thumbnails/thumb_A_1280.jpg`, `thumbnails/thumb_B_1280.jpg`, `thumbnails/thumb_A.png`; `$R1/vthumb/A_base.png`, `$R1/vthumb/A_small_up.png`, `$R1/vthumb/f960.png`, `$R1/vthumb/f1050.png`; `$R1/acc/thumbs.png`; `qa/PATH_LEGIBILITY_PLAN.md` (the "^" note and the top-band rule); `README.md:28`.

---

## Minor defects

### D12 — S1.1 (+ S3 and S9 openings): far partition top 13 px from the frame edge at the shared CAM_ROOM framing
**Scene** S1 (S1.1 and the S1.3 cut-back); the same framing opens S3 (2874–2897) and S9 (11173–~11274) · **Frames** 0–~190, 601–~640 · **Severity** minor · **Category** layout · **Source** dir-S1-S2

**What.**
- The far panel's ink top sits at y=13 (fill at y=18) from frame 0 to about 164. It clears 54 px only at about 191, during the push. The cut-back at 601–~640 is the same.
- It is drawn whole, not clipped. It nearly touches the frame edge on the video's first image.
- S4 already corrected the same framing locally (S4_Geometry.tsx:156–160, `cy − 30`). The "same room from the same places" framing is now inconsistent: about 13 px in S1/S3/S9 against about 49 px in S4.
- S1's load-time check `topMin < 12` (~1446) passes by 1 px.

**Why.** The partition top is the visual proof that light can't go over it, and the opening looks cramped. Strictly, SCENE_BRIEF's 5% rule covers critical text, so this is minor.

The reviewer's fix direction is wrong: `screen_y = 540 + (y − cy)·zoom`, so *raising* cy makes it worse. Zoom 1.15 only reaches about 35 px.

**Fix (shared pass + S1 + S4):**
1. `source/src/lib/shots.ts:25`: `CAM_ROOM = {cx: 880, cy: 530, zoom: 1.2}` (−35 world px = 42 screen px lower). The panel's outline lands at about 55 px.
2. `source/src/scenes/S4_Geometry.tsx:156–160`: `const CAM_OPEN: Cam = CAM_ROOM;`, and update the comment. Without this, S4 drops another 36 px and cuts off its near partition foot. The S4 builder must make this change.
3. `source/src/scenes/S1_ColdOpen.tsx` (~1446): tighten the check to `< 54` for the tilt-0 entries (CAM_ROOM, CAM_PUSH).
4. CAM_PUSH is absolute, so the push end is unchanged. The rise to CAM_PATH, roomCam and the readout swing all derive from CAM_ROOM.
5. If D03 lands, S3 opens on HANDOFF_S2S3, not CAM_ROOM, so check S3's opening separately.
6. Re-run all nine module checks and tsc. Verify frames 0, 150, 620, 2874 and 11200:
   - shoes stay above 950 (hers about 900);
   - the near partition foot stays in frame (about 1050);
   - the back wall still reaches the top edge;
   - S9.1's "his shoes in frame" still holds.

**Evidence.** `$R1/verify_S1top/f0_top_zoom.png`, `$R1/verify_S1top/seq/`, `$R1/verify_S1top/g3990.png`; `$R1/verify_S3/g2874.png`; `$R1/seq9/g11200.png` (S9 opening, per the verifier); `$R1/dirS1S2/f0.png`, `$R1/dirS1S2/f150.png`.

---

### D13 — S1.3 (+ the S6.7 reuse): the tracking board plots our re-run but labels it only as "processed with the authors' code"
**Scene** S1 (S1.3 evidence board); reused at S7 frames 9120+ · **Frames** 300–600 · **Severity** minor · **Category** accuracy (provenance) · **Source** dir-S1-S2

**What.**
- The marker and trail come from `ours_xz`, our stochastic seed-0 run of the authors' particle filter (S1_TrackingBoard.tsx:87, 172–173; also S1_Props.tsx:131). `stored_xz` is never used.
- At 600 ("frame 475 of 475") the marker is at display (1.52, 1.16) m; the stored value is (1.42, 1.18), 11 cm away. Median agreement is 8 cm.
- The conditions box says "processed with the authors' code". Nothing says "run by us".
- OPENING_EVIDENCE §4 makes the stored estimate primary and labels a re-run "Authors' code and settings, run by us". The director's note inverted those roles. The storyboard S1.3 chip text caused this.

**Why.** Presented as "Real measurements", the track reads as the authors' result. The text is literally true, so this is minor.

**Fix (preferred, lowest risk)** — `source/src/components/v02/S1_TrackingBoard.tsx`:
1. Line 216: change the third conditions line to "authors' code, run by us". It is shorter, so it fits the 700 px box at 34 px. It matches S7_Results.tsx:637.
2. Update the comment at line 14.
3. Docs (owner): amend STORYBOARD.md S1.3 to the same wording.
4. S7 builder, optional: S7_Results.tsx:553 pill → "authors' code, run by us" (the S6.7 narration already says "We ran it").

A straight swap to `stored_xz` is wrong: stored indices 0–3 lie in the sensor's direct line of sight, so the "hidden" dot would start beside the sensor.

**Alternative (stored track):**
- Add stored_xz to DATA and use it for `cur` (87) and the trail (172–173).
- Start the replay at index 6: map REPLAY0..REPLAY1 onto 6..474 in S1_ColdOpen.tsx:1256, and clamp the trail to `min(TRAIL, idx−6)`. The counter shows the true frame number.
- Switch S1_Props.tsx:131 the same way.
- If our re-run is kept, it becomes a faint dashed track labelled at ≥ 30 px.
- For the S6.7 reuse, switch S7_Plots.tsx TrackPlot (72, 90, 94, 95) with fromIdx ≥ 6.

**Evidence.** `$R1/verify_s1board/f600.png`; `$R1/dirS1S2/f600.png`; `source/src/data/evidence/tracking_topdown.json`; `research/OPENING_EVIDENCE.md` §4 Beat A; `qa/scene_review/S1/REPORT.md:80`; `qa/review_r1/dense/S7_sheet01.jpg` (frames 9120–9150).

---

### D14 — S1.3: board paper_slap lands 5 frames after the board's big move ends
**Scene** S1 (S1.3) · **Frames** cue 300; the board stops at about 295 · **Severity** minor · **Category** sync · **Source** audio

**What.**
- The paper_slap cue is at LAND = 300 (S1_ColdOpen.tsx:316–318, 451). The sample peaks at sample 0, so the onset in the mix is exactly 10.000 s.
- The board's E.softBack scale reaches full size at about 294, peaks at 295–296 (largest extent x 96–1826), then eases back about 9–11 px per side to rest at 300. Frame diffs: 7.5 → 5.0 → 1.0.
- So the slap is 5 frames (167 ms) after the visible arrival.
- One correction to the report: the edge is *not* static from 296 to 300; it settles back.

**Why.** It is the first hard contact in the cold open and sounds slightly detached. The slap is quiet (about −24 dB under "yet"), so this is minor.

**Fix** — `source/src/scenes/S1_ColdOpen.tsx`:
1. Next to LAND (~318), add `const BOARD_HIT = SWING0 + Math.round(SWING * 0.69); // ≈ f295`.
2. Line 451: `{f: BOARD_HIT, kind: 'paper_slap'}`. Leave LAND alone (the layout tween and REPLAY0 use it).
3. Audio rebuild.
4. Optional docs: qa/scene_review/S1/REPORT.md:63 → the board lands at f295.
5. Unverified, related: check S3_Echo.tsx:325 (paper_slap at LAND = BOARD0+BOARD_DUR with E.out) the same way.

**Evidence.** `$R1/verify_slap/corner_strip.png`, `$R1/verify_slap/f_0284.png` … `f_0310.png`; `$R1/audio/strips/S1_paperslap_b.png`, `$R1/audio/strips/S1_paperslap.png`; `audio/sfx/v2/placed.json` (S1 f300 paper_slap).

---

### D15 — S1 s05 (+ race, S3): the sensor_pulse "flash" is heard before anything leaves the sensor
**Scene** S1 (s05 "fires a short, invisible flash"; race pulse); S3 launch · **Frames** cue 907 → main-view pulse first at 915 (+8); race cue 1158 → 1162 (+4); S3 cue 2943 → 2947–2948 (+4/+5). S4 cues 4167 and 4593 are only +1, so no change there. · **Severity** minor · **Category** sync · **Source** audio

**What.**
- The sample starts about 1.2 frames before the cue and peaks about 35–40 ms in, so the click lands on the cue frame.
- In the main view the s05 pulse is hidden inside the sensor box until 915 (`hidden()` in S1_ColdOpen.tsx ~689–694). The only change on the cue frame is the small left coral lens bump turning peach (`charge`/`firing`, ~680–681). The pulse later comes out over the right bump.
- The plan-card dot leaves at about 909–911.
- Separately, the music's glock "flash" tick is at 30.17 s.

**Why.** Audio leading the picture by more than about 45 ms is noticeable; here it is 267 ms on the first on-screen flash. It is softened by the card's dot and by the low effect level.

**Fix (preferred: a visible flash on the cue frame):**
1. **Shared pass**, `source/src/components/v02/HandheldSensor.tsx` (~223, and SensorTop ~324): add an **opt-in** prop, e.g. `burst?: number` (default 0, so other scenes are unchanged). It draws a saffron disc or halo at the emitting (right, dark) lens: rx about 13+16·burst, opacity about 0.7·burst, plus a thin expanding ring.
2. `source/src/scenes/S1_ColdOpen.tsx` (~680–681):
   - Hold burst/firing at 1 from PULSE0 until the head clears the box, then fade over 4 frames.
   - EMERGE is the first g ≥ PULSE0 where `!hidden(pointOnPath(PATH, SCHED.progress(g)))`; it is 8 in this render.
   - Do the same for the race (RACE0, about +4).
3. Optional: the same in `source/src/scenes/S3_Echo.tsx` LAUNCH.

**Alternative (audio only, no shared change):**
- S1_ColdOpen.tsx:455 `{f: PULSE0 + 8}`.
- :460 `{f: RACE0 + 4}`.
- S3_Echo.tsx:631 `{f: LAUNCH + 4}`.
- Shift the `charge` ramp peak to match (`tw(g, PULSE0 + 2, 6)`).
- Leave the music glock on the word "flash" and leave S4 as it is.

**Evidence.** `$R1/verify_pulse/strip_s05.png`, `$R1/verify_pulse/lens_zoom.png`, `$R1/verify_pulse/strip_s05_inset.png`, `$R1/verify_pulse/race_zoom.png`, `$R1/verify_pulse/s3_zoom.png`, `$R1/verify_pulse/s3_inset.png`, `$R1/verify_pulse/s4a.png`, `$R1/verify_pulse/s4b.png`; `$R1/audio/strips/W_s05_flash_zz.png`, `W_s05_flash_z.png`, `SP_1158.png`, `SP_2943.png`.

---

### D16 — PlanCard entry is double-eased (S1.4, S1.7 card 2, S3.1, S9): a near-pop
**Scene** S1 (S1.4 card 663–665; S1.7 CARD2), S3 (S3.1 card 2898–2900), S9 (S8.2 card) · **Severity** minor · **Category** motion · **Source** dir-S1-S2 (card entrances, plan-card part) + dir-S3-S4 (merged)

**What.**
- Callers pass `tw(g, CARD_IN, 14, E.out)`. PlanCard.tsx (lines 95–97) then applies E.out again for the slide (`dx = (1 − E.out(t))·56`) and sets `op = t·1.6`.
- Result: opacity steps 0 → about 0.45 → about 0.85 → 1 within about 3 frames, and the 56 px slide is about 47 px spent before the first visible frame.
- S1.4 frames: 663 about 40%, 664 about 75%, 665 opaque, with the wall and door showing through.
- S3 frames: nothing at 2897; 2898 at 0.43, 2899 at 0.83, 2900 at 1.0, all during the camera push.
- Same code in S1_ColdOpen.tsx:881 (cardT), :882 (card2T) and S9_Payoff.tsx:832. S7 brings its card in on a cut (planT = 1), so it is unaffected.
- The S3 report says the card enters at 2903; it enters at 2898.

**Why.** It reads as an appearance, not a slide: a forbidden pop, and translucent cards clash with the flat-fill style.

**Fix (callers only; no shared change):**
- Pass a linear entry value and let PlanCard keep the only ease. Leave the E.inOut exit tweens as they are.
  - `source/src/scenes/S1_ColdOpen.tsx:881`: `cardT = tw(g, CARD_IN, 14, E.linear) * (1 − …exit…)`
  - `:882`: `card2T = tw(g, CARD2_IN, 14, E.linear)…`
  - `source/src/scenes/S3_Echo.tsx:914`: `const cardT = tw(g, CARD_IN, CARD_IN_DUR, E.linear) * (1 - tw(g, CARD_OUT, CARD_OUT_DUR, E.inOut));`
  - `source/src/scenes/S9_Payoff.tsx:832`: same change.
- Opacity then ramps over about 9 frames, and the slide steps 56→39→26→17→10→6 px.
- S3, optional: CARD_IN_DUR 16–18, but only if ROUTE0 still lands on or before K.path. Re-run the S3 asserts.
- Do not edit PlanCard.tsx's easing for this. The S1 exit at about 1120 is also a see-through fade. If the lead wants exits fixed too, the shared alternative is PlanCard.tsx `dx = (1 − clamp01(t))·56; op = clamp01(t·2)`, plus re-checking S7_Results (1051/1073) and every caller. See lead decisions.
- Docs: qa/scene_review/S3/REPORT.md:18, entry frame 2897/2898.
- Verify: re-render 2895–2915 and 655–680. The card's edge should move visibly over ≥ 5 frames and its opacity should ramp over ≥ 8.

**Evidence.** `$R1/verify_cards/plan_crop.png`; `$R1/verify_s3card_v2/strip.png`, `$R1/verify_s3card_v2/full.png`; `$R1/dirS1S2/card_in.png`; `$R1/dirS3S4/s3f/card_in.png`. Source: PlanCard.tsx:95–97.

---

### D17 — S2.4: colour-coded path stubs come out of the partition in reverse body order
**Scene** S2 (S2.4) · **Frames** 2620–2850 · **Severity** minor · **Category** legibility · **Source** dir-S1-S2

**What.**
- At the partition's far edge (x≈1305), the stubs exit in this order:
  - saffron (shoulder) at y≈215, above his head;
  - blue (feet) at y≈465, chest height;
  - red (head) at y≈593, waist height, by the tripod.
- His markers are at hair y 290, chest 487 and shoe 932.
- Each stub's slant does extend back to the right body point, so the geometry is honest.
- A search over the scene's own asserts (2 cm grid, one 250 ps bin, 0.3 m spacing) found **zero** body-ordered spot sets, and zero head/feet pairs with feet exiting lower. The reviewer's main fix is infeasible.
- All three draw on within about 30 frames, while the eye is on the inset.

**Why.** With the sound off, the colour coding looks arbitrary. The narration never names the body parts and the director's list covers the short head path, so this is minor polish.

**Fix** — `source/src/scenes/S2_Mirror.tsx` (keep the spots):
1. **Draw the paths one at a time.** ROUTE_STAGGER 10→26 and ROUTE_DUR 22→20 (~438–439).
   - Add a load-time throw: `if (ROUTES0 + 2*ROUTE_STAGGER + ROUTE_DUR > K.everything + 2) throw`.
   - Each marker already pops at ROUTES0+k·STAGGER and its route draws body-first, so each stub now appears right after its own marker.
2. **Second throb on the marker.** In the marker map (~1246), add a second throb and a one-shot ring in the path's colour, timed to the frame its stub emerges: `ROUTES0 + k*ROUTE_STAGGER + ROUTE_DUR*u_out`.
   - `u_out` comes from `partitionCrossings(eff, W, V4, {zoom: CAM_D.zoom})`: the last "out" crossing, converted as `u·l1/(l1+l2)`.
   - Reuse the burst ring code.
3. **Optional tags.** 30 px tags "head", "shoulder", "feet" by his markers, on the side away from the partition, at about (1600,250), (1610,470) with a cream pill, and (1610,880). Fade them out by PULSE0 and assert their clearances.
4. **Verify.** Re-render 2610–2760:
   - each stub appears after its own marker's throb;
   - the pulses still leave on "Everything" and the blip still lands on "blend";
   - all asserts pass.

**Evidence.** `$R1/verS2paths/f2700.png`, `$R1/verS2paths/f2780.png`, `$R1/verS2paths/crop2780.png`, `$R1/verS2paths/sheet.png`, `$R1/verS2paths/search/order.ts`; `$R1/dirS1S2/r2690.png`, `$R1/dirS1S2/r2735.png`. Source: S2_Mirror.tsx:259–262, 280–284.

---

### D18 — S2.4: metaphor-to-timing card swap goes see-through (+ optional S1.7 ruler headline lag)
**Scene** S2 (S2.4); optional S1 (S1.7) · **Frames** 2761–2769 (S2); 1545–1551 (S1.7 headline) · **Severity** minor · **Category** motion · **Source** dir-S1-S2 (card entrances, merged remainder)

**What.**
- **S2.4.** The inset fades out (`1 − tw(INSET_OUT,10,E.in)`) over about 2761–2766, and the timing card fades in (`barsIn`, E.out, 12 frames) over about 2764–2769. At 2765 both are half transparent and the plant, pot, room corner and skirting show through. The cards do not overlap each other; the room shows through both.
- **S1.7 ruler card.** Its entrance is fine: one see-through frame at 1544, the same as the S1.6 arrival card. But it has no headline at 1545–1551: "1 nanosecond ≈ 30 cm ≈ 1 ft" fades in at 1552–1553, which is deliberate (`head = tw(g, RULER0 + 8, 10)`).

**Why.** Double-exposed cards look like a compositing mistake against the flat-fill style. The S2 overlap was deliberate (S2 report item 5), but the see-through wasn't discussed.

**Fix:**
1. `source/src/scenes/S2_Mirror.tsx`:
   - Line 1290 (inset): `opacity: clamp01(insetIn * 3)`, and replace `scale(0.9 + 0.1*insetIn)` with `translateX(${-(INSET.x1 + 20) * (1 - insetIn)}px)`, so the inset slides out left, solid.
   - Line 1307 (timing card): `opacity: clamp01(barsIn * 2.5)`, with a slide of `-60 * (1 - barsIn)`.
   - No frame should have both cards see-through. Coordinate with D03 (same card).
2. Optional, `source/src/scenes/S1_ColdOpen.tsx` (~1129): `const head = tw(g, RULER0, 8);`, so the headline arrives with the card.

**Evidence.** `$R1/verify_cards/swap_2765.png`, `$R1/verify_cards/swap_crop.png`, `$R1/verify_cards/ruler_head.png`, `$R1/verify_cards/race/arrival2.png`; `$R1/dirS1S2/swap.png`, `$R1/dirS1S2/xfade_tile.png`. Source: S2_Mirror.tsx:443–444, 1268–1270, 1290, 1307; S1_ColdOpen.tsx:1124–1129, 1187.

---

### D19 — S3.1: the "light still on the path" tally 24→1 implies 1 in 24 comes back
**Scene** S3 (S3.1, s13) · **Frames** 2945–3175 · **Severity** minor · **Category** accuracy · **Source** accuracy

**What.**
- A top-left card shows a 40 px numeral stepping 24 → 8 → 3 → 1 (at 2945, 2985, 3015, 3045) over a 24-dot grid that greys to one lit dot. That is about 4% of the emitted light coming back.
- The only qualifier is the scene chip "slowed down · illustrative", about 900 px away; nothing says "not to scale".
- C05: the real figure is about 1/380 to 1/6,000 of the first bounce.
- Inside the cartoon, the tally and the S3.2 9:1 block card agree (8 left after the first bounce, 1 echo). The real mismatch is cartoon about 1:9 against real "hundreds of times weaker".
- The director listed the 9:1 stack as an accepted limitation, but not this numbered tally.

**Why.** A bare numeral turns "most of it is lost" into a quantity that is off by one to two orders of magnitude.

**Fix** — `source/src/scenes/S3_Echo.tsx` (Tally ~1055–1075):
1. Delete the 40 px `{n}` numeral span. Keep the header and the greying dots.
2. Under the dots, add a 30 px inkSoft line: "not to scale · real losses are far bigger" (about 420 px, fits the 456 px card). Do not widen the card; its right edge is about 5 px from the "wall" tag.
3. Line 182: TALLY_BOX height 133 → about 175. Re-run the tally/tags/chip/card/hair assertion (~568–580), and check the trip zoom at ~234.
   - If that changes the approved framing, keep 133 and shrink the dot pitch instead (`cx = 10 + (k%12)*20`, r 7.5).
4. Leave `SURVIVE = [24, 8, 3, 1]`.
5. Optional: S3_BlockCard.tsx:127–128 pill → "illustrative · not to scale" (30 px).

**Evidence.** `$R1/verify_s3counter/tally_strip.png`, `$R1/verify_s3counter/f3070.png`; `$R1/acc/c3070.png`; `qa/review_r1/dense/S3_sheet01.jpg`, `S3_sheet02.jpg`. Source: S3_Echo.tsx:348; claims.csv C05, C12.

---

### D20 — S3.2: the open end of the room set shows around the arrivals card
**Scene** S3 (S3.1→S3.2 pull-back and S3.2) · **Frames** 3184–~3395 · **Severity** minor · **Category** layout · **Source** dir-S3-S4

**What.**
- From about 3184 the CAM_PATH_SIDE pan reveals the room's open left end. At 3191 the left 23% of the frame (about 440 px) is bare paper.
- From 3196, two slivers remain around the 808x778 card until about 3395:
  - the wall's cut edge as a double ink line at x≈530–555, y 0–56, above the card (it reads like a string holding the card);
  - a paper wedge and the brown slab edge, from about (565,835) to (720,1080), below it.
- RoomSet is an open-sided cut-away by design, and the same look in S1.6 was accepted (S1 REPORT lines 32 and 126). S3's bigger card leaves leftover slivers that look accidental.
- Reframing can't fix it. The card's top already sits on the margin, it can't reach the caption band, and panning back would remove the clean column.

**Why.** It goes against DIRECTION's "walls and floors extend past the frame", and the line above the card is noticeable.

**Fix (lead may instead accept it as an S1.6 precedent):**
1. **Shared pass**, `source/src/components/v02/RoomSet.tsx`: add an opt-in prop `extendLeft?: number` (metres, default 0). Do not change `layout.room.x0`. When it is > 0, with xL = x0 − extendLeft:
   - draw the floor, the slab front face (~178), the drop shadow, the relay-wall face and skirting, and the wall-top strip (~215) from xL;
   - skip the slab-side face (~179) and the wall's left cut-end cap (~210);
   - keep the existing planks exactly as they are, and add extension planks with separate seeds (e.g. `rand(1000+k*7+3)`).
2. `source/src/scenes/S3_Echo.tsx`, the RoomSet at ~920: `extendLeft={g >= EXT_ON ? 3.2 : 0}`, where EXT_ON = PUSH0 + PUSH_DUR (after the room's left end has left the frame, well before PAN0). Do not enable it from S3's first frame: the S2→S3 handoff shows the slab corner (D03).
3. **Verify.**
   - EXT_ON−1 and EXT_ON should be identical.
   - At 3191, 3196, 3300 and 3390 there should be continuous wall and floor around the card.
   - The S3→S4 wipe should still hide any set difference.

**Evidence.** `$R1/verS3edge/grid.png`, `$R1/verS3edge/f3191.png`, `$R1/verS3edge/f3196.png`, `$R1/verS3edge/f3300.png`, `$R1/verS3edge/z3300_top.png`; `$R1/dirS3S4/s3/f03360_setedge.png`, `$R1/dirS3S4/s3h/cardin.png`.

---

### D21 — S3.3: y-axis title "counts (linear scale)" is set at 32 px
**Scene** S3 (S3.3 evidence board) · **Frames** 3540–3953 · **Severity** minor · **Category** legibility · **Source** dir-S3-S4

**What.** S3_EchoBoard.tsx:259 sets `fontSize={32}` on the rotated title. The x-axis title and tick numbers are 34. Measured x-height is 16 px, against 17 px for the 34 px x-title. The S3 director raised the axis numbers to 34 but missed this title.

**Why.** "Linear scale" is what makes "hundreds of times weaker" honest. It is body text being read, so it must be ≥ 34 px. It is legible, so minor.

**Fix** — `source/src/components/v02/S3_EchoBoard.tsx:259`:
- Change to `fontSize={34}` and keep the translate at `PLOT.x0 − 136`. The glyphs then span about x 99.5–130.5, inside the 96 px margin and about 12 px clear of the tick labels at x 143.
- Optional: `PLOT.x0 − 134`, but no further than −130.
- Check frame 3920: the x-heights should match.

**Evidence.** `$R1/verify_s3_yaxis/f3920.png`, `$R1/verify_s3_yaxis/ytitle_zoom.png`; `$R1/dirS3S4/s3b/f03920.png`.

---

### D22 — S4.2: "1.33 m" sits by the sensor, the partition and her token, never by him
**Scene** S4 (S4.2, s18) · **Frames** label about 4337–4406; ruler rests 4320–4369; wobble 4369–4405; tip first reaches him about 4450 · **Severity** minor · **Category** clarity · **Source** dir-S3-S4 (ruler waver) + viewer (1.33 m at tip) (merged)

**What.**
- **At rest.** The ruler from W1 holds at 77° and slides under the sensor glyph's corner. Its tip and the "1.33 m" pill, which sits *left* of the tip (S4_Geometry.tsx:781, `tip1.x − 34`), rest about 40 px from the partition, just below the sensor.
- **During the "which way?" wobble (77°→96°).** At about 4379–4390 the tip and label sit directly under her token (x≈460–600, y≈765–805 at 4383). At 4400 the ruler runs under the sensor (label at x 500–640, y 795).
- **Leaving.** The label leaves at NUM1_OFF = SWING0−6 (≈4404), before the ruler ever reaches him (about 4450).
- **Angles.** There is no clear open-floor angle. The sensor covers 77°–93.5° from W1, the partition stops the tip at about 74°, the checker covers 100–125°, the "extra delay" pills 125–155°, and the plant beyond that. So the reviewer's "70–84°" fix fails, and "start the swing sooner" conflicts with the narration.

**Why.** With the sound off, 1.33 m reads as the distance to the sensor, partition or her, not to him. This muddies "distance known, direction unknown" until the arc sweep (about 2–3 s).

**Fix** — `source/src/scenes/S4_Geometry.tsx` (~735, 781, 736). Keep TH0 77° and the wobble.
1. **Make "1.33 m" a length label on the ruler.**
   - Compute `mid1 = toS(polar(W1, r1.len / 2, r1.angle))`.
   - Place the Pill there, offset about 40 px perpendicular to the ruler on the side away from the sensor: (+sin a, −cos a)·40 for 0–90°, mirrored past 90°.
   - Optionally rotate it to the ruler, kept upright.
   - Keep it ≥ 40 px. With D23, its text becomes "1.33 m each way".
   - The midpoint (about y 475) clears both tokens during the wobble.
2. **Keep it through the swing and sweep.**
   - NUM1_OFF = the frame where the sweep passes his bearing from W1 (`Math.atan2(Hp.z − W1.z, Hp.x − W1.x)`, about 39°), or `HOPS[0]`, plus about 20 frames.
   - Add a 6–8 frame pulse on his token, with the existing soft pop_tick, at that frame.
   - If the moving label collides with the plant or the delay pills during the sweep, hide it for those angles and bring it back as the tip reaches him.
3. **Simpler fallback** (dir-S3-S4): `NUM1_OFF = WAG0 − 6`, so the label fades on "spot." before the wobble. "Distance known" at (1625,330) still states it. This loses the payoff in step 2.
4. **Verify** frames 4320–4460:
   - the label never sits under the sensor or checker tokens or on the partition;
   - it clears "distance known", the delay pills and the margins;
   - the cue count is unchanged unless the pulse SFX is added.

**Evidence.** `$R1/verify_s4ruler/f4383.png`, `$R1/verify_s4ruler/f4400.png`, `$R1/verify_s4ruler/crop_seq.png`; `$R1/verify_s4_ruler/zoom4365.png`, `$R1/verify_s4_ruler/waver.png`, `$R1/verify_s4_ruler/sheet.png`; `$R1/dirS3S4/s4/f04400.png`; `$R1/viewer/t4365.png`. Source: S4_Geometry.tsx:174–184, 377–389, 736, 781.

---

### D23 — S4.2: delay numbers don't reconcile on screen (8.85 ns against 1.33 m one way, and against S1's ≈ 7 ns)
**Scene** S4 (S4.2) vs S1 (S1.6–S1.7) · **Frames** "extra delay 8.85 ns" about 4260–4412, shown together with "1.33 m" for about 1.3 s; S1 "≈ 7 ns later" 1200–1826 · **Severity** minor · **Category** accuracy/continuity · **Source** accuracy (factor 2) + viewer (S4 vs S1 ns) (merged)

**What.**
- **Factor of 2.** S1.7 taught "1 ns ≈ 30 cm" with a folded out-and-back tape. S4.2 shows "extra delay 8.85 ns" with a single straight one-way ruler reading "1.33 m". A viewer who multiplies gets 2.65 m. Nothing on screen or in the narration says "there and back".
- **Different spots.** For the same hider in the same room, S1 labelled "≈ 7 ns later" (wall spot W3, 7.158 ns) and S4 shows 8.85 ns (W1, 0.42 m further from the partition). Nothing says the spot changed.
- Both values are correct for their spot (layout.json confocalA; 8.85 ns × 0.2998 / 2 = 1.327 m). This is a teaching gap, not a wrong fact. The S1 director had avoided exactly this one-way-tape trap.

**Why.** A numerate viewer who pauses sees an apparent 2x error, and a mismatch with S1, at the moment timing becomes a map. That invites "the maths is wrong" comments.

**Fix** — `source/src/scenes/S4_Geometry.tsx` (labels ~774–783), together with D22:
1. **Delay pills.** "extra delay" → "extra delay here" (36), and `{DELAY1_NS.toFixed(2)} ns` → `≈ {DELAY1_NS.toFixed(1)} ns` (40 mono, "≈ 8.9 ns", matching S1's "≈ 7 ns" style).
2. **Add a round-trip line under them.** Right-aligned at w1S.x − 44:
   - mono 40 `≈ {(2*R1).toFixed(2)} m` at y = w1S.y + 226;
   - 36 "there and back" at y = w1S.y + 272.

   Use lblPop at DELAY_LBL+8 and +11. Keep the lines short so they clear the plant (x≈290, y 160–460).
3. **Ruler label.** "1.33 m each way" (see D22). Extend the opacity windows of the delay, ≈ 2.65 m and "there and back" pills to NUM1_OFF, so the chain 8.9 ns → 2.65 m round trip → 1.33 m each way is on screen together.
4. **Optional.** In S4.3, on "Another delay", add "extra delay here / ≈ 6.4 ns" (L.confocalA[3]) at W4, left-aligned right of W4 at about w4S.y+118, fading on "another arc".
5. **Do not move S4's first spot to W3.** S1 picked W3 for clearance, S4.5 needs it as part of the close pair, and W3 is 5.5 cm from the partition line. Keep the "illustrative" chip.
6. Check against the caption band, the ruler's start angle and the tip label.

**Evidence.** `$R1/verify_delay/f4330.png`, `$R1/verify_delay/grid1.png`, `$R1/verify_delay/f1800_card.png`; `$R1/verify_s4ns/f1650.png`, `f1770.png`, `f4365.png`, `grid_s4.png`; `$R1/acc/f4330.png`; `$R1/viewer/t4365.png`, `$R1/viewer/f1770.png`; `qa/review_r1/dense/S4_sheet02.jpg`. Source: S4_Geometry.tsx:171; data/layout.json:120; claims.csv C06.

---

### D24 — S4.2: relief_sigh breathes over the end of "direction."
**Scene** S4 (S4.2, s18 "Not which direction. Just how far.") · **Frames** cue 4383 (146.10 s); overlap 146.44–146.58 s · **Severity** minor · **Category** audio · **Source** audio

**What.**
- The guesser's relief_sigh (cue RELAX+2 = 4383, S4_Geometry.tsx:201, 434, 889) starts while "direction." is still being spoken.
- Over the word's "-on" tail (146.44–146.58 s) the sigh is 0–5 dB *louder* than the narrator, by about 9 dB at 300–1000 Hz and about 31 dB at 5–10 kHz. So the word ends in a breathy exhale.
- The word stays intelligible.
- The sigh is in sync with the face inset's eyes-shut exhale (4384–4396).

**Why.** A second breath-like sound overlaps the narrator and can sound like the narrator sighing.

The reviewer's fix (move it to 4399) is wrong: it breaks sync with the eyes-shut pose and moves the overlap onto "Just how far." (the pause is only about 0.33 s; the sample is 1.57 s).

**Fix** — `source/src/scenes/S4_Geometry.tsx` (move the sigh and the eyes-shut pose together into the pause):
1. Line 201: `const RELAX = K.direction + 14;` (≈4395).
2. Line 434: `const relief = tw(g, RELAX, 6) * (1 - tw(g, RELAX + 12, 6));`. The eyes close 4395–4401, stay shut until about 4407, and open as the lean starts.
   - Check the inset 4390–4418 for a pop between the relief and lean poses. If needed, set LEAN0 = K.just18 + 2.
3. Line 889: `{f: RELAX + 2, kind: 'relief_sigh', gain: -3, dur: 0.6, …}` (≈4397). `dur` trims the sample and fades it over 0.2 s.
4. Audio rebuild. Pass check: the sigh is ≥ 10 dB under the narration wherever the narration is above −35 dBFS, between 146.0 and 147.4 s.

**Fallback (no animation change):** keep 4383 with `gain: -6, dur: 0.55`.

**Evidence.** `$R1/verify_sigh/inset_strip.png`, `$R1/verify_sigh/sheet.png`; `$R1/audio/ev_sigh_direction.png`; `audio/sfx/v2/placed.json` (S4 f4383 relief_sigh).

---

### D25 — S4.3: second ruler idles, then whips 90° in 8 frames and sweeps back 180°
**Scene** S4 (S4.3, "Another delay, another arc") · **Frames** idle 4655–4675; swing 4676–4683; sweep 4687–4705 · **Severity** minor · **Category** motion · **Source** dir-S3-S4

**What.**
- The W4 ruler sits at 90° for about 20 frames while "delay," is spoken.
- It then swings 90° to lie along the wall in 8 frames: steps of +5/+12/+26/+26/+12°, with the tip moving up to about 205 px per frame.
- It then reverses and sweeps 180° in about 18–22 frames, peaking at about 23° per frame.
- Cause:
  - SWING4_DUR = 8, locked to SWEEP4_0 = K.another2 (4675).
  - SWEEP4_1 = 4705 is the minimum window.
  - Both moves use E.inOut (peak about 2.9x the average speed).
- Ruler 1 swings over 10–16 frames and sweeps over 44–96. The director accepted "sweeps fast" but not the snap swing before it.

**Why.** The second arc, which sets up "they cross in just one place", reads as a flick.

**Fix** — `source/src/scenes/S4_Geometry.tsx`:
1. Lines 210–215:
   ```ts
   const SWING4_0 = R4_EXT0 + R4_EXT_DUR + 2;                                  // ≈4657
   const SWEEP4_0 = Math.max(SWING4_0 + 14, K.another2);                        // 4675
   const SWING4_DUR = Math.max(10, Math.min(16, SWEEP4_0 - 2 - SWING4_0));      // ≈16
   const SWEEP4_1 = Math.max(SWEEP4_0 + 28, Math.min(K.on20 - 2, SWEEP4_0 + 40)); // still 4705
   ```
2. In ruler4() (408–417), use separate windows and a gentler ease, `soft = Easing.bezier(0.45, 0, 0.55, 1)`:
   - swing: `lerp(TH4, π, soft(tw(g, SWING4_0, SWING4_DUR, E.linear)))`;
   - sweep: `π·(1 − soft(tw(g, SWEEP4_0, SWEEP4_1 − SWEEP4_0, E.linear)))`.
3. SFX (~896): `{f: SWEEP4_0, kind: 'arc_draw', dur: (SWEEP4_1 - SWEEP4_0)/30, …}`. Optionally add a soft cue at SWING4_0.
4. Verify 4650–4710:
   - no frame-to-frame step over about 12°;
   - frames from 4705 on are unchanged.

**Evidence.** `$R1/verify_s4arc2/swing_sheet.png`, `$R1/verify_s4arc2/f046xx.png`; `$R1/dirS3S4/s4b/arc2_sheet.png`. Source: S4_Geometry.tsx:184–187, 208–216, 408–417.

---

### D26 — S4.3: the uh_oh sting plays under the payoff word "place."
**Scene** S4 (S4.3 J3, "…they cross in just one place.") · **Frames** cue 4798 (159.93 s) = first frame of "place." (4798–4817) · **Severity** minor (the reviewer filed it as major) · **Category** audio · **Source** audio

**What.**
- The sting is five mallet strikes (159.93–160.36 s) over a sustained 334–444 Hz note, at gain 0, during the music stop (159.5–161.23 s).
- The word stays intelligible:
  - "pl+vowel" leads the sting by 23–38 dB in the 0.5–8 kHz bands;
  - the "-ce" sibilant is clear by 35–44 dB above 4 kHz;
  - the sting wins only in 250–500 Hz, where its low note overlaps the voice fundamental, and at 0.5–2 kHz during the /s/.
- It is *not* the worst masking spot in the film. Unverified candidates with lower margins: smug_exhale f3381 (S3, on "tiny."), prob_tick f5392 (S4, "match."), robot_brake f11045 (S8, "collisions.").
- The busted face holds from 4789 through 4842, so the cue can move without any picture change.

**Why.** The sting steps on the payoff line instead of answering it, in otherwise near-silence. A minor comic-timing polish.

**Fix** — `source/src/scenes/S4_Geometry.tsx`:
1. Next to `const ONE = K.one20;` (~223), add `const UHOH = Math.min(K.place20 + 14, K.s21 - 28);` (≈4812, 160.40 s, just after the spoken word ends at about 160.35 s).
2. Line 898: `{f: UHOH, kind: 'uh_oh', note: 'J3b: one place (after the word, inside the music stop)'}`.
   - Do not use the aligner's word end (4817): it is about 6 frames late and would push the tail into "Measured".
3. If the director wants it kept on the word instead: `gain: -6` plus a high-pass at about 500 Hz on this cue.
4. Audio rebuild, then audio_qc (160.1–160.3 should drop out of the list). While there, review the three cues named above.

**Evidence.** `$R1/verify_uhoh/spec_mix.png`, `$R1/verify_uhoh/spec_nar.png`, `$R1/verify_uhoh/spec_sfx.png`, `$R1/verify_uhoh/sheet.png`; `$R1/audio/ev_uhoh_place.png`, `$R1/audio/strips/S4_J3.png`.

---

### D27 — Guard-rail chips pierced by the plan's 0.5 m tick marks (S4 and S6.5)
**Scene** S4 (about 4110–5692) and S6 (S6.5 full plan, about 8190–8467) · **Severity** minor · **Category** layout · **Source** dir-S3-S4 + dir-S5-S7 (merged)

**What.**
- The chip row (box about y 54–107 in S4, y 46–100 in S6.5) sits on the ruler ticks along the relay wall:
  - 1 m ticks run y 43–110 (y 42–113 in S6.5);
  - 0.5 m ticks run y 72–110.
- Ticks poke about 11 px above and 3–12 px below the chips:
  - S4: x≈432 (under "simplified picture (2D)", which is up for about 36 s), and x≈192, 672 and 912;
  - S6.5: x≈192, 432 and 1632.
- When a chip fades, the tick shows through it (S4 f5680).
- In S6.6 the panels drop to y 200, so the problem goes away there.
- Corrections to the S6 report: the x positions are 192, 432 and 1632 (not 130 and 370), and the chips can't be raised (top:46 is already at the margin limit).

**Why.** The settled chips look skewered, like a layering mistake.

**Fix (scene-local; no RoomSet change needed):**
1. **S4** — `source/src/scenes/S4_Geometry.tsx:853–862`. Give each chip's opacity wrapper a paper backing: `background: C.paper, borderRadius: 999, padding: '14px 4px 6px', margin: '-14px -4px -6px'`. It fades with the chip, so the ticks come back when the chip goes.
   - Verify frames 4200 and 4600: no tick pixels above y 53, or at y 108–112, in columns 192, 432, 672 and 912.
2. **S6.5** — `source/src/scenes/S6_Small.tsx`, GuardChips (~852–866):
   - add a `knock` prop that draws `<div style={{position:'absolute', left:-6, right:-6, top:-10, bottom:-16, background:C.paper, opacity:knock}}/>` behind each chip, with the Chip in a `position: relative` wrapper;
   - in ShotPlan (~897), pass `knock={1 - split}`, multiplied by each chip's own opacity.
   - Verify frames 8200, 8300, 8455 and 8475: y 36–116 under both chips is plain paper (#FAF3DF), with no hard edge.

**Alternative (shared):** a `tickHide` prop on RoomSet.tsx. It isn't needed.

**Evidence.** `$R1/verify_chips/f4200.png`, `$R1/verify_chips/f4200_zoom.png`, `$R1/verify_chips/f4115.png`, `$R1/verify_chips/f5680.png`; `$R1/dirS3S4/s4/chips_ticks_4200.png`, `$R1/dirS3S4/s4/f04200.png`; `$R1/verify_s34chips/topstrips.png`, `$R1/verify_s34chips/z_left_8300.png`, `$R1/verify_s34chips/z_right_8300.png`, `$R1/verify_s34chips/seq/`; `$R1/dir567/c_chips_ticks.png`, `$R1/dir567/s6_smear.png`. Source: RoomSet.tsx:147–155, 225–227.

---

### D28 — S4.7 (+ the S5 copy): the likely location reads as a teal stroke across his hair, and the photo X covers it
**Scene** S4 (S4.7), copied in S5's first frames · **Frames** blob from about 5545; uncovered with its leader about 5560–5630; covered by the X about 5655–5680; clean again 5684–~5705 (S5 rolls the sheet up) · **Severity** minor (the viewer report was filed as major) · **Category** legibility · **Source** dir-S3-S4 + viewer (merged)

**What.**
- **The region.** FINAL_FIELD is drawn as a thin translucent teal leaf, about 177–185 × 25–35 px, lying diagonally across the guesser's red hair. The outer level is at 0.55 opacity and turns muddy over red. The only outline is a 3 px tealDeep line on the *inner* level, which has little contrast. At phone size it reads as a slash or pen stroke. The S4.4 patch gets a teal ring; the final blob does not.
- **The X.** The photo frame lands centred on his token (about 5630), and the coral X drawn on "Not" (about 5648) hides almost all of the leaf from about 5655 to 5680.
- **The shape itself is honest.** The four-band product at ±3.75 cm (one bin, sharpness 4) gives about 0.38 × 0.06 m at the 0.25 level. So enlarging the region to 1.5–2x the token (the viewer's fix) would contradict C16/C17.
- Only "likely location" has a leader (line 819); "rough shape" has none.
- The director accepted the leaf "because S5 copies it". That argues for changing both files together, not for leaving it.

**Why.** The act's answer, "a likely location", doesn't read as an area. For about a second, a muted viewer sees him crossed out.

**Fix** — `source/src/scenes/S4_Geometry.tsx` and the S4 builder also owns `source/src/components/v02/S5_Board.tsx`. Do not change PossibleCloud's defaults: S4.5 (line 642) and S9_Readout:70 use it.
1. **Honest fuller halo.** Line 670: `<PossibleCloud … levels={[0.08, 0.5]} />`. This is the same field, at the levels S9_Readout already uses: about 0.44 × 0.073 m, about 210 × 35 px.
2. **Mark the place.**
   - Draw a teal callout ring around the blob centre: r about 75 px, stroke C.tealDeep, width 5, the S4.4 ring style. Draw it in on LBL_LIKELY and hold it to the end.
   - End the "likely location" leader (line 819) on the ring's edge.
   - Give "rough shape" a short leader too, or keep it visibly grouped under "likely location".
3. **Dim him under it.** Fade his GuesserToken to about 0.45 opacity over 12 frames from BLOB0.
4. **Keep the X off him** (lines 279–286, 832–840). The frame still lands on sH at PHOTO_LAND, then over the 8 frames before CROSS0 slides to about (sH.x+40, sH.y+260) and scales to 0.65. That keeps it clear of the labels (x 1410–1790, y 440–620) and above y 950. The X then draws on the frame there, and the ring and leaf stay uncovered.
5. **Optional (shared pass):** opt-in props on `components/v02/Optics.tsx` PossibleCloud: `outerOutline`, `outerFillOpacity` and `rim` (a paper cut-out edge). Defaults unchanged. Pass identical values in S4 and S5_Board.
6. **Mirror in S5_Board.tsx (61–63):** the same levels, ring, token dim and (if used) props, so S4 f5691 and S5 f5692 stay pixel-identical.
7. **Verify:**
   - the 5691/5692 diff;
   - S4.5 (5040–5200) and S9 (11410–11480) unchanged;
   - phone-size read at 5610 and 5672.

**Evidence.** `$R1/verify_s4_loc/f5600.png`, `f5650.png`, `f5691.png`, `f5700.png`, `zoom5600.png`; `$R1/verify_s4patch/f5610.png`, `f5640.png`, `f5672.png`, `phone_5672.png`, `f5680.png`, `f5691.png`, `f5693.png`, `seq_5691_5796.png`, `leaf_zoom.png`, `patch_grid.png`; `$R1/dirS3S4/s4/f05600.png`; `$R1/viewer/e5664.png`, `$R1/viewer/f5650_40.png`, `$R1/viewer/s4_end.png`; `qa/review_r1/dense/S4_sheet05.jpg`. Source: S4_Geometry.tsx:322, 603, 642, 670, 806–840; Optics.tsx:648–651; S5_Board.tsx:61–63.

---

### D29 — S4.7: "not a photograph" is readable for about 0.85 s, and the picture clears before the word ends
**Scene** S4 (S4.7, s24) · **Frames** strike and label 5651; label settled 5659–5676; crossed frame falls away from 5670; labels fade 5676–5681; clean board 5682–5691 · **Severity** minor · **Category** timing · **Source** dir-S3-S4

**What.**
- The label is readable for about 25–28 frames, and settled at full size for only about 17 (0.57 s). The finished crossed frame is fully up for about 15 frames.
- "Photograph." is spoken 5655–5679, but the frame starts falling at 5670 (PHOTO_OUT = CLEAR_E0−5) and the labels fade from 5676 (CLEAR_E0 = K.end−17). Then the board sits empty for 10 frames.
- The director accepted this twice ("on screen only briefly at the end"). The verifier judges it a real but minor problem: the label is readable, the narration repeats it, and s42 brings the idea back.
- The reviewer's suggestion to drop the frame on "rough shape" gains nothing: the frame already lands during the tail of "shape.".

**Why.** "Not a photograph" is the act's punchline (C19). With the sound off it gets setup and action but almost no reaction or settle.

**Fix (lead decision on the scope; do this together with D28, same lines):**
- **Preferred: carry the overlay across the cut** (about 1.75 s on screen).
  1. S4_Geometry.tsx: take the three S4.7 pills (x 1410, y 466/532/598, 44 px) and the PhotoFrame out of `endClear`. Drop the PHOTO_OUT fall-away, so S4's last frame (5691) shows the labels and the struck frame.
  2. S5_Board.tsx PlanBoard: draw the same overlay inside the sheet transform, using S4_Parts PhotoFrame/Pill.
  3. **Shared pass:** add the frame-out values to `HANDOFF.S4S5` in `source/src/lib/shots.ts:38`.
  4. S5_History.tsx: either (a) the overlay rolls up with the sheet, or (b) it fades over S5 frames 2–14 (5694–5706), before the roll's edge reaches about y 700 at about 5710.
  5. Move or drop the 'paper_swish' cue (S4 SFX ~911).
  6. Check that 5691 and 5692 are pixel-identical.

  This touches S5_History.tsx, which belongs to the S5 builder. Sequence it after S4 lands, or give S4+S5 to one builder.
- **Fallback, S4 only (about 1.0–1.1 s):**
  - `CLEAR_E0 = K.end - 8`, `CLEAR_E_DUR = 6`.
  - `PHOTO_OUT = max(CROSS0 + CROSS_DUR + 3, end of 'photograph' ≈ 5679)`, with PHOTO_OUT_DUR 8.
  - Nothing then clears while "photograph." is being spoken.

**Evidence.** `$R1/verify_s4_7/e_05550.png` … `e_05709.png`, `$R1/verify_s4_7/sheet.png`, `$R1/verify_s4_7/labelseq.png`; `$R1/dirS3S4/s4/f05660.png`. Source: S4_Geometry.tsx:277–286, 474, 806–840; S5_History.tsx:101–104.

---

### D30 — S5→S6: jump cut on the same plinth; the stool and the 2021 card vanish
**Scene** S5.4 → S6.1 · **Frames** cut 7103→7104 (S6 then holds still 7104–7137; the arm enters at about 7138) · **Severity** minor · **Category** continuity · **Source** dir-S5-S7 + viewer (merged)

**What.**
- **7103.** S5 end, CAM_WB {4620,440,0.8}. The empty roped plinth is at the left (slab x 192–704, centre about 448). The stool and the "2021 / hidden objects tracked / with a cheap sensor / Callenberg et al. · illustration" card are at the right (x about 1230–1760). That card has been readable for about 1.9 s.
- **7104.** S6 start, CAM_PLINTH_WIDE {880,540,1}. The same plinth is at slab x 720–1360 (centre about 1040), a 1.25x scale change and a 590 px shift. The camera direction reverses. The stool's spot becomes a rope post, and the Wisconsin + Milan exhibit reappears at the left.
- The stool and card still exist in S6's world (S6 x = S5 x − 3020 → about 2270, off-frame). Nothing on screen shows them leave.
- The arm then brings a teal device down from the side where the teal cheap-sensor stool just disappeared. "Published 2026" only lands at about 7180 and "MIT + Dartmouth" at about 7230.
- S5 REPORT 84–87 accepted the shift. The S6 REPORT:91 note is stale.

**Why.** It reads as a jump cut rather than a deliberate cut. It also invites confusing the 2021 cheap-sensor work with the 2026 study.

**Fix** — `source/src/scenes/S6_Small.tsx` (ShotPlinth) and `source/src/components/v02/S6_Plinth.tsx` (MuseumSet). Import from S5_Museum.tsx read-only. Do not move S5's end camera: it would cut the card's read time.
1. **Hand-off camera.** Add `const CAM_S5_END: Cam = {cx: 1600, cy: 440, zoom: 0.8};` (S5's CAM_WB minus 3020). Ease from it to CAM_PLINTH_WIDE over 22 frames from K.start (E.inOut), ending about 7126 before ARM_IN, ahead of the existing push: `cam = lerpCam(lerpCam(CAM_S5_END, CAM_PLINTH_WIDE, open), CAM_PLINTH_CLOSE, push)`.
2. **Draw what S5's end framing shows.** In MuseumSet, inside `<g transform="translate(-3020 0)">`, draw:
   - S5's lamp track and lamps (copy from MuseumHall; rail at y −200);
   - `<SideCard t={1} lines={['2021','hidden objects tracked','with a cheap sensor','Callenberg et al. · illustration']} />`;
   - `<SensorStool x={MU.stool.x} …S5 final values… />`.

   The stool and card then visibly slide out at the right.
3. **Match S5's rope on the first frame.** S6's VelvetRope layer is at depth 1.06 against S5's 1. Start it at 1 and ease to 1.06 with the same `open` term.
4. **Optional:** land "published 2026" with the device touchdown.
5. **Verify:**
   - S6 7104 ≈ S5 7103 pixel diff;
   - the "time-of-flight sensors" label (about 7290) and the arm path are unchanged.

**Cheaper fallback:** open S6 at zoom ≥ 1.3 (≥ 1.6x S5's size), centred on the plinth, so it reads as a cut-in. That needs the arm path, the MuseumLabel and the 2021 plaque sliver re-placed.

**Evidence.** `$R1/verify_s5s6cut/f_07103.png`, `$R1/verify_s5s6cut/f_07104.png`, `$R1/verify_s5s6cut/blend_7103_7104.png`; `$R1/dir567/cut_7103_7104.png`; `$R1/viewer/cut_s5s6.png`; `qa/review_r1/dense/S6_sheet01.jpg`. Source: S5_History.tsx:191; S6_Small.tsx:273; S5_Museum.tsx:34–35.

---

### D31 — S5→S6: music and ambience drop out at the act turn
**Scene** S5→S6 cut · **Frames** 7057–7128 (235.25–237.6 s); below −45 dB for 236.40–237.15 s (f7092–7114), floor −66.4 dB at 236.75 s · **Severity** minor (the reviewer filed it as major) · **Category** audio · **Source** audio

**What.**
- **Music.** The "turn" F7sus chord is written once at bar 96 (230.4 s) for 2×0.95 bars, ending about 234.96 s. Bar 98 (235.2–237.6 s) is labelled "turn" but has no notes (the compose branch writes only at idx 0). "Nimble" starts on the bar grid at 237.6 s (f7128), not at the S6 cut at 236.8 s that MUSIC_NOTES documents. It enters at −30.5 dB, about 9 dB above the usual pause level, just after "Then,".
- **Ambience.** S5's amb_museum ends exactly at K.end (S5_History.tsx:500) and S6's starts at K.start (S6_Small.tsx:947). With fade-out 0.6 s and fade-in 0.4 s, the raw ambience dips about 20 dB in a V at 236.7 s.
- **Comparison.** Every other cut's floor is between −38.6 and −56.4 dB. This is the deepest quiet spot outside the designed drops.
- **Context.** The picture is a hard cut within one continuous museum, with no story reason for silence.

**Why.** It sounds like an edit hole and a restart at the turn into the 2026 study. It is mostly masked under the ducked bed and plays as a pause on phone speakers, so minor.

**Fix:**
1. **Music** — `tools/make_music_v02.py`, the `elif sec == 'turn':` branch (~406). Keep the idx 0 chord, and add a branch for the later "turn" bars up to the S6 cut:
   ```
   cut = P['scenes']['S6'][0]
   elif t0 < cut:
       r, u = CH['Asus'] if t0 + BAR >= cut else CH['F7sus']
       d = cut - t0 + 0.3
       add('strings', t0, d, u[0], 24); add('strings', t0, d, u[2], 22)
   ```
   In that same bar, add a one-off pickup:
   - pizzicato D (root+12) and bass D at exactly `cut` (236.8 s);
   - a 4-note marimba run of 16ths on D-chord tones from `snap8(cut)` (237.0 s) into the 237.6 s downbeat, velocity 26–32, ≤ MIDI 83;
   - optional shaker.

   Keep the bar grid. Rerun the script (MUSIC_NOTES regenerates).
2. **Ambience** — `source/src/scenes/S5_History.tsx:500`: `dur: (K.end + 18 - K.start) / 30`, so the S5 loop overlaps S6's fade-in (as S7_Results.tsx:1362 already does with `K.end + 6`). Alternatively, have make_sfx_v2.py merge back-to-back amb cues of the same kind.
3. **Audio rebuild.** Acceptance:
   - final_mix ≥ about −45 dBFS in every 100 ms window from 236.0 to 237.6 s;
   - music_bed ≥ about −40 dBFS over 235.2–236.8 s;
   - the first nimble onset within 0.2 s of f7104.

**Evidence.** `$R1/verify_s5s6/sheet.png`; `$R1/audio/ev_music_hole_S5S6.png`, `$R1/audio/ev_cut_S2S3.png`; `audio/sfx/v2/cues.json` (amb_museum entries).

---

### D32 — S6.1: her fist acts as the sensor's foot, then slides up the grip; the teeter happens while she's holding it
**Scene** S6 (S6.1, s30) · **Frames** 7166–7195 · **Severity** minor · **Category** motion · **Source** dir-S5-S7

**What.**
- **Contact.** From 7166 to 7174 the teal grip ends at y≈463, about 48 px above the slab (y≈511). Her fist covers it, and the skin reaches y=521, about 10 px past the slab's top outline. The contact marks flank her knuckles. The grip foot first appears at 7175.
- **Release.** From 7176 to 7184 the fingers ride up the grip, outline against outline. From 7186 to 7193 they pass over the box's right face, drawn on top of it. They clear at about 7195.
- **Teeter.** About 4.5°, but it starts at RELEASE+1 while she is still touching (7174–7180). The sensor is static once she has let go.
- **Cause.**
  - HandheldSensor holds the prop at grip y=0, and the grip ends at +14.
  - C_POS = slab−14·S1K, so the mitt always hides the grip foot.
  - H_REL is only 46 px right of centre.
  - GripFingers are drawn on top of the sensor.

**Why.** It breaks "hands touch what they move; contact, then release" at the beat where the sensor arrives. It lasts about 0.9 s, so minor.

**Fix** — `source/src/scenes/S6_Small.tsx` (S6.1 timing and ShotPlinth, ~132–137, 267–305). No change to HandheldSensor.tsx or S6_Plinth.tsx.
1. **Hold point.** `const HOLD = 30;`.
   - While held, draw the sensor HOLD·S1K below the hand: `sp0 = held ? {x: hand.x, y: hand.y + HOLD*S1K} : C_SENSOR`, with C_SENSOR = {SENSOR_SPOT.x, SENSOR_SPOT.y − 14·S1K}.
   - Set `C_HAND = {SENSOR_SPOT.x, SENSOR_SPOT.y − (14 + HOLD)*S1K}` and use it in handAt() and H_HOVER. Keep C_SENSOR for the label leader and the teeter pivot.
2. **Contact marks** at the slab line, x ±24…44 around C_SENSOR.x.
3. **Release.**
   - At RELEASE, stop drawing GripFingers, or spread them clear.
   - `H_REL = {x: C_HAND.x + 110, y: C_HAND.y}`: straight right, clear of the box and its depth (+76) plus the finger half-width (24).
   - Then exit up and right to H_GONE.
4. **Teeter after release.** `teeter = 4.5 * ring(g, RELEASE_END, 0.8, 0.2)`, pivoting about the grip foot. Use RELEASE_END = RELEASE + 6 if needed.
5. **Verify** render 7166–7206:
   - teal grip pixels reach the slab line while she holds it;
   - no skin below slab y−20;
   - no finger pixels on the sensor after RELEASE;
   - a ±4° rock after she clears.

**Evidence.** `$R1/verify_s6hand/crop_every.png`, `$R1/verify_s6hand/crop_sheet.png`; `$R1/dir567/place_sheet.png`. Source: HandheldSensor.tsx SENSOR (grip y0 −56 … y1 14).

---

### D33 — S6.3: "10 × 10" printed on the research module
**Scene** S6 (S6.3, s32, card 2) · **Frames** about 7815–7990 · **Severity** minor · **Category** accuracy · **Source** dir-S5-S7 + accuracy (merged)

**What.**
- A bold mono "10 × 10" (36 px, about x 885–1035, y 530–560) fades in on the device body under the emitter lens, just after the dots ripple in on "hundred" (`counter={tw(g, K.hundred + 10, 8)}`, S6_Small.tsx:412; drawn by S6_ResearchModule.tsx:54–59).
- The caption below reads "smartphone-grade device (team's own) · ≈ 100 pixels".
- The sources support only about 100 pixels (C28; EXPERIMENT_RECORD 0.1; manuscript NOTES.md:62 says the layout was not found).
- The storyboard asks for a 10×10 dot grid as a *drawing*, but its exact on-screen text doesn't include "10 × 10".
- "10×10" is also the gantry grid elsewhere in the research.

**Why.** Printed on the hardware, it reads as a specification and states an unsourced exact layout.

**Fix:**
1. `source/src/scenes/S6_Small.tsx:412`: remove the `counter={…}` prop.
2. `source/src/components/v02/S6_ResearchModule.tsx`:
   - delete the `{counter > 0 && (<text …>10 × 10</text>)}` block (54–59) and the `counter` prop;
   - update the doc comments (lines 7, 13) to "a dot grid illustrating about 100 pixels".
3. S6_Small.tsx header note (line 43): drop "10 × 10".
4. Keep the grid, the ripple and the caption. Do not put "≈ 100" on the device. Optionally move the lens 20–30 px lower.
5. Re-render 7780–8000.

**Evidence.** `$R1/verify_10x10/f7930.png`, `$R1/verify_10x10/strip.png`; `$R1/ver_10x10/f7825.png`, `$R1/ver_10x10/strip.png`; `$R1/dir567/full/f7930.png`; `$R1/acc/f7825.png`. Research: manuscript/NOTES.md:62; claims.csv C28; STORYBOARD.md:82.

---

### D34 — S7.1: the callback to the opening board swaps the colour code
**Scene** S7 (storyboard S6.7, BoardA) · **Frames** 8798–9170 (also the s38 'our clip' card about 9590–9700) · **Severity** minor · **Category** continuity · **Source** viewer

**What.**
- **S1.3 board:** saffron wall points, a teal estimate marker with a cream highlight, a teal legend dot.
- **S7 board ("Our opening clip…"):**
  - teal wall points with teal "×4" tags (S7_Plots.tsx ~132, ~144);
  - a saffron estimate marker (~152);
  - a saffron legend swatch (S7_Results.tsx ~531);
  - a teal "16 listening spots" pill (547);
  - a different layout and headline.
- It also flips across the slide in from S6, where the listening spots are saffron diamonds.
- It conflicts with theme.ts (teal = evidence, saffron = attention) and PATH_LEGIBILITY_PLAN (wall spot = saffron).
- No director report accepts this.

**Why.** The callback reads as a different plot, which weakens "this is where the opening came from".

**Fix** — keep S7's layout and its popping pills; match colours only.
1. `source/src/components/v02/S7_Plots.tsx` TrackPlot:
   - wall points `fill={C.saffron}` (~132);
   - ×4 tags `fill={C.inkSoft}` (~144);
   - marker `fill={C.teal}` with a cream highlight (~152);
   - optional trail C.tealDeep (~91).
2. `source/src/scenes/S7_Results.tsx` BoardA:
   - legend swatch `C.teal` (~531);
   - "16 listening spots" `tone="saffron"` (547);
   - "kit: under US$100 (authors)" `tone="teal"` or paper (544);
   - optional "seen from above" sub-line at 30–34 px.
3. The s38 'our clip' card (~1148) uses the same TrackPlot, so check its 370 px plot.
4. Re-render 8796–9170 and 9590–9700, and confirm the ×4 tags are ≥ 30 px.

**Evidence.** `$R1/verify_s7colors/grid.png`, `$R1/verify_s7colors/trans.png`; `$R1/viewer/boards.png`. Source: S1_TrackingBoard.tsx:129, 175, 179; theme.ts:3–4.

---

### D35 — S7 (s38): the reflective strip faces the camera, while the light reaches the board from behind
**Scene** S7 (storyboard S6.9, s38) · **Frames** press about 9470–9482; fat-pulse arrival 9536–9545 · **Severity** minor · **Category** physics · **Source** dir-S5-S7

**What.**
- The guesser presses the strip onto the board's camera-facing front (9476–9482).
- When the fat pulse arrives (9538–9545), the hit shows as a rim flash on the board's up-left (wall-side) outline behind it. That matches the code comments ("the pulse comes to the board from the wall side, behind it").
- At the same time a sparkle (glint2, FAT_LABEL−2) fires on the front strip at about (1418,535).
- The plan card draws the strip centred inside the bar, on neither side.
- The director's reason for accepting it ("the flash hides this") doesn't hold: the rim flash draws attention to the back.
- The reviewer's shirt-front fix is wrong: he faces the camera too.

**Why.** A retroreflector returns light toward the source it faces. In a film about which way the light goes, an attentive viewer can catch this in about 2 s.

**Fix (recommended: he turns the board 180° so the strip faces the wall):**
1. `source/src/components/v02/S7_Props.tsx`, TargetBoard:
   - add a `turn` prop (0..1);
   - wrap the rect, inner rect and children in `scale(cos(π·turn), 1)` about center.x;
   - draw the plain back (no children) when cos < 0;
   - keep the rim flash outside the scaled group.
2. `source/src/scenes/S7_Results.tsx`:
   - `TURN0 = STRIP_HIT + 18`, `TURN_DUR = 10`, and throw unless `TURN0 + TURN_DUR + 4 <= vertexFrame(PULSE_B1, 2)` (about 9505 against 9538).
   - In `guesserAt`, after the press, slide his left hand to the board's right edge and keep it there during the turn: `x = B_C.x + cos(π·t)·B_W/2`, clamped at the near edge. Then hip, with `after` delayed to TURN0+TURN_DUR.
   - Add this contact to the hands-on-props throws (≤ 1 px).
   - Pass `turn={tw(g, TURN0, TURN_DUR, E.inOut)}`.
3. **Glint.** Delete glint2. Put the four-point sparkle at the board's up-left corner, over the rim flash, on the fat arrival. Keep the press glint at STRIP_HIT.
4. **PlanBoard.** Draw the strip on the bar's camera edge (c.y+7) and rotate the PlanBoard group by 180·turn, so at arrival the strip sits on the wall-facing edge.
5. **Checks:**
   - the S7 throws pass;
   - the "reflective material" label clears the plan card;
   - his hand doesn't cross his face;
   - phone size reads.

**Alternative (weaker):** stick the strip on the back, with a 6–8 px saffron edge peeking out. Coordinate with D09, which removes this board before the s39 walk.

**Evidence.** `$R1/verify_strip/press.png`, `$R1/verify_strip/e_09538.png`, `$R1/verify_strip/e_09542.png`, `$R1/verify_strip/plan.png`; `$R1/dir567/s7/f9560.png`, `$R1/dir567/c9545.png`, `$R1/dir567/edge2_strip.png`.

---

### D36 — S7 (s38): the "flat wall" chip pops over her raised fist
**Scene** S7 (storyboard S6.9, s38) · **Frames** chip fade-in from 9704; overlap 9707–9711 · **Severity** minor · **Category** layout · **Source** dir-S5-S7

**What.**
- The chip pops on K.flat (9703), the start of "flat".
- Her third shoo flick (SHOO0 9685, period 8, SHOO1 9709) brings her mitt up under it at 9704–9709, and the chip draws over her fist from 9707 to 9711.
- No check tests the shoo hand against FLAT_TAG (~414–421, ~1311–1316).
- "Reads as her caption" is subjective, so not required.

**Why.** For a moment the label looks punched or held.

**Fix** — `source/src/scenes/S7_Results.tsx`:
1. `const FLAT_IN = Math.max(K.flat, SHOO1 + 4);` (≈9713, on "wall").
2. Replace K.flat with FLAT_IN in:
   - `fadeWin(g, FLAT_IN, SIDLE0, 8, 10)` (~1106);
   - `popStyle(g, FLAT_IN, 'center')` (~1163);
   - the chip_pop cue (~1351).
3. Add a guard near ~1311. For every f from FLAT_IN to SIDLE0+10, her right-hand point plus MITT in CAM_SCAN screen space stays ≥ 12 px outside the tag box, allowing for the pop's overshoot.
4. Re-render 9690–9780.
5. Optional: a dotted leader to the wall. Do not move the chip lower.

**Evidence.** `$R1/verify_fw/zoom.png`, `$R1/verify_fw/strip.png`, `$R1/verify_fw/strip2.png`; `$R1/dir567/fw_strip.png`, `$R1/dir567/s7_flat.png`.

---

### D37 — S7 (S6.10): the "independent reproduction" slot is drawn as a different museum
**Scene** S7 (storyboard S6.10 museum slot) · **Frames** 9993–10147 · **Severity** minor · **Category** continuity · **Source** dir-S5-S7

**What.**
- S7 draws its own museum (S7_Results.tsx Museum 1217–1269, with S7_Props Plinth/Plaque):
  - an extra wood base band on each plinth;
  - a small one-line chip plaque (330x65) that drops and swings;
  - no cream light pools, ceiling track or velvet rope;
  - the skirting at y 790–834, not 904–930;
  - squatter plinths.
- S5/S6 instead have a 480x144 two-line screwed saffron plate, pools and a rope.
- The on-screen width is about the same.
- The director accepted "museum set is plain".
- The reviewer's "fifth plinth along the S5 shelf" collides with S5's side card (x 4960–5620) and stool (x 5290).

**Why.** The payoff is that the *same* history shelf is still missing an exhibit. A generic display weakens it.

**Fix** — `source/src/scenes/S7_Results.tsx` Museum (1217–1269). Import `MU, MuseumHall, Plinth as ShelfPlinth, RopePost, RopeSpan` from `../components/v02/S5_Museum`, read-only; check they are exported.
1. **Room.** Use MuseumHall in S5 world units (slab top 512, floor 930, body 584, slab 640) for the wall, pools, lamp track, skirting and floor. Place the plinths on MU.P[2]/MU.P[3] (3020, 3980), or draw the pools yourself (rx 470, ry 330, cream 0.55).
2. **Plinths.** A self-contained pair 960 apart, framed like S6.1's CAM_PLINTH_WIDE: MUSEUM_CAM0 {960,540,1}, push to about {1040,510,1.1}. Use ShelfPlinth with a blank plate, and delete S7_Props' Plinth (base band).
3. **Plaque text** inside the plate, as S6_Plinth does: two lines at y0+56 (display 600) and y0+112 (body 800, 44 px), with a fade and a 0.92→1 scale.
   - "code" / "public" at PLAQUE_A;
   - "independent" / "reproduction" at PLAQUE_B.
4. **Contents.**
   - CodeCard on the slab top (y 512);
   - the dashed empty-slot outline, about 260x262, on plinth B;
   - the rope: RopePost at 0/960/1920, RopeSpan ropeY 700, sag 100. Check it clears the plates' bottom edge (730).
5. Keep the final chip, the timings and the SFX. Coordinate with D38.
6. Verify 9993, 10060, 10100 and 10146 against S6 frame 7104.

**Evidence.** `$R1/verify_museum/compare_7104_10100.png`, `$R1/verify_museum/s7_grid.png`, `$R1/verify_museum/s56_grid.png`; `$R1/dir567/museum_S5_vs_S7.png`, `$R1/dir567/s7_museum.png`.

---

### D38 — S7 (s39 end): the dated "none found (Oct 2026)" chip is up about 1.3 s, with off-storyboard wording
**Scene** S7 (S6.10 end) · **Frames** chip appears 10110 (on "hardware"), settled about 10120, covered by the S8 wipe about 10144 · **Severity** minor · **Category** timing/accuracy · **Source** accuracy

**What.**
- `FINAL_CHIP = Math.max(PLAQUE_B + 24, K.hardware)` = 10109 (S7_Results.tsx:463), so the chip is fully readable for about 1 s.
- It reads "code public · none found (Oct 2026)". STORYBOARD.md:89 specifies "code public · no independent reproduction found (Oct 2026)".
- C38 is a dated absence-of-evidence claim, and the date appears only in this chip.
- The S7 report claims the labels match the storyboard.
- The reviewer's suggested start (about 10020, "though") would land the conclusion before the plaque drop it sums up (PLAQUE_B 10051).

**Why.** A seven-token dated qualifier shown for about 1 s fails the sound-off rule. The plaque and narration carry the main point, so minor.

**Fix** — `source/src/scenes/S7_Results.tsx`:
1. Line 463: `const FINAL_CHIP = PLAQUE_B + 8;` (≈10059, after the plaque drop). That gives about 2.7 s at full opacity. Use `PLAQUE_B + 2` for a full 3 s, landing on the thud.
2. Line 1259: change the text to "code public · no independent reproduction found (Oct 2026)" at size 40. It is about 1300 px, x 310–1610 at top 74, inside the margins and clear of the card and slot tops (about y 225).
3. The chip_pop cue (1366) follows automatically.
4. Check:
   - no clash with the plaque swing or the museum push (10027 +22);
   - the margins;
   - if D37 rebuilds the museum, re-check the clearance against the new set.

**Evidence.** `$R1/ver_s7chip/f10065.png` … `f10179.png`, `$R1/ver_s7chip/sheet.png`, `$R1/ver_s7chip/chip_crop.png`; `$R1/acc/f10130.png`; `qa/review_r1/dense/S7_sheet04.jpg`. Source: Main.tsx:45 (12-frame wipe); claims.csv C38.

---

### D39 — S8 (S7.3): "not who" and the robot's "?" are wiped after about 0.7 s
**Scene** S8 (storyboard S7.3 → S7.4) · **Frames** pill 10620–10622; "?" 10620–10621; board edge 10640; covered 10644 · **Severity** minor · **Category** timing · **Source** dir-S8-S9

**What.**
- The 44 px coral "not who" pill and the "?" bubble land together on WHO (10618).
- The 2×2 board starts falling at BOARD_DOWN = max(K.s42End+4, K.plenty−14) = 10639 (S8_Warehouse.tsx:249). That is while "there." is still spoken (10630–10642): s42End = 10634 is earlier than the word's end.
- So "not who" is readable for about 22 frames and the "?" for about 20.
- The person's listening reaction settles at about 10630, leaving about 10 frames of settle.
- The S8 report says the board drops "on 'plenty'", but the render doesn't match.
- The reviewer's fix (board on "plenty") alone gives about 1.2 s, not 1.5.

**Why.** "Not enough to say who's there" is the point of S7.3. With the sound off it flashes rather than reads.

**Fix** — `source/src/scenes/S8_Warehouse.tsx`:
1. `const THERE_END = at('s42', 'there', 1, 'end');` (10642).
   - Line 249: `const BOARD_DOWN = clamp(Math.max(THERE_END + 10, K.plenty), K.s42End + 4, K.short - 44);` (≈10653).
   - The tiles then finish setting up by about 10691, before "short" (10706). The paper_slap, footstep filter and `after`/`covered` flags all follow automatically.
2. Split the shared fade:
   - add `notS42: at('s42','not')` (10596) to K;
   - `const NOT_WHO = Math.max(K.notS42, CHIP_SLOW + 18)` drives the pill (line 559);
   - keep the bubble (line 565) on WHO with its own `bubbleT`;
   - optional pop_tick at NOT_WHO.

   Result: "not who" about 1.9 s, "?" about 1.2 s.
3. Update qa/scene_review/S8/REPORT.md (line 20). Re-check 10650–10710: the board lands with no bounce past the bottom edge.

**Evidence.** `$R1/verify_s8_notwho/sheetA.jpg`, `$R1/verify_s8_notwho/sheetB.jpg`, `$R1/verify_s8_notwho/crops.png`; `$R1/dir_s8s9/notwho.jpg`, `$R1/dir_s8s9/board.jpg`, `$R1/dir_s8s9/full10636.png`.

---

### D40 — S9.2: the "likely location" readout leaves about 0.8 s after it lands
**Scene** S9 (storyboard S8.2) · **Frames** lit at 11464 ("clues"); label swells at 11486 and is gone by 11490; inset swells 11494–11496 and is gone by 11500 · **Severity** minor · **Category** timing · **Source** dir-S8-S9

**What.**
- The label is up for about 26 frames, about 20 of them at full size.
- `INSET_OUT = max(LIT + 20, K.s47 − 2)` = 11491 (S9_Payoff.tsx:193) ties the exit to the end of the sentence.
- Both exits run E.back in reverse (S9_Readout.tsx:99), so each swells and then snaps away.
- The frame is near-still from 11500 to about 11513, and nothing competes for the corner until R4 (11570).
- The label is 36 px; S4.7's identical label is 44 px.
- The director accepted the pop exit as designed.

**Why.** This is the takeaway image ("careful timing and math can read some of its clues"). It gets setup and action but no settle.

**Fix:**
1. `source/src/scenes/S9_Payoff.tsx:193`: `const INSET_OUT = Math.max(LIT + 40, K.hed - 10);` (≈11516).
   - The label leaves 11510–11518, and the inset and ring are gone by the first step (WALK0 11526).
   - Add after HANDS: `if (!(INSET_OUT + 10 <= HANDS - 8)) throw …`, and run the 0.8x and 1.2x timing loads.
2. **Calm exits.**
   - Label (~828, 882): split into `labelIn` (E.out entry) and `labelOut` (E.inOut, 8 frames). Exit with a scale of `1 − 0.06·out` and opacity `1 − out`.
   - `source/src/components/v02/S9_Readout.tsx` ReadoutInset (~99): add an `exiting` prop (`s = 0.94 + 0.06·t`, opacity t). Pass `exiting` for both closes (INSET_OUT and INSET2_OUT).
3. Line 883: `<Pill tone="teal" size={44}>`. It spans about x 141–471, y 436–500, so check it against the inset's coral base strip at about 11480.
4. Re-run the dense sheet for 11450–11580. R4 (11570–11621) must have no overlays.

**Evidence.** `$R1/verify_s9_likely/inset_seq.jpg`, `$R1/verify_s9_likely/sheet.jpg`, `$R1/verify_s9_likely/crop11478.png`; `$R1/dir_s8s9/likely.jpg`, `$R1/dir_s8s9/full11476.jpg`.

---

### D41 — S9.3: the checker's deadpan "stroll" is a scurry
**Scene** S9 (storyboard S8.3, J4 approach) · **Frames** 11653–11674 (footfalls 11657, 11663, 11669–70, 11673–74) · **Severity** minor · **Category** motion · **Source** dir-S8-S9

**What.**
- Four footfalls in 21 frames (about 5.3 frames apart, roughly 340 steps per minute). Feet move 90–180 px per swing, and her legs cross into an X at 11657–59 and 11669–71.
- His walk earlier in the scene lands a step about every 8 frames.
- Cause: the plan, not C_FPS (which is 7, since KK = 1). planWalk with stepM 0.27 gives 3 steps → 4 swings in 3×7 = 21 frames, with C_WALK0 = 11653.
- The S9 report's "5 frames per step" limitation only covers 0.8x timing.
- The reviewer's fix is wrong: stepM 0.42 alone, at C_FPS 7, makes the walk *faster*.

**Why.** J4 depends on her being unhurried.

**Fix** — `source/src/scenes/S9_Payoff.tsx` (S9_Room.tsx unchanged). Keep LEAN0/OPEN/BUSTED at 11675/11690/11693.
- **Option A (preferred):**
  - line 310: `planWalk(…, C_SPOT, {stepM: 0.42, lift: 12})` (2 steps, 3 swings);
  - line 256: `const C_FPS = Math.max(8, Math.round(11 * KK));`;
  - line 309: `const C_WALK0 = Math.max(o(31), BLANK + 3);` (≈11652).

  Footfalls land at about 11658, 11667 and 11674, and LEAN0 stays 11675.
- **Option B:** keep stepM 0.27, set `C_FPS = max(7, round(9*KK))` and `C_WALK0 = max(o(26), BLANK + 2)`.
- **Checks:**
  - re-render 11640–11700;
  - footfalls ≥ 7 frames apart, with planted feet;
  - X-crossings ≤ about 2 frames;
  - BUSTED ≥ 30 frames before the wipe;
  - the KK = 0.6 case still passes.

  Coordinate with D42 (its optional blocked line fades at C_WALK0+4) and D43.

**Evidence.** `$R1/verify_cwalk/strip.jpg`, `$R1/verify_cwalk/legs.jpg`, `$R1/verify_cwalk/sim.py`; `$R1/dir_s8s9/cwalk2.jpg`, `$R1/dir_s8s9/cwalk.jpg`.

---

### D42 — S9.3 (J4): the gag never shows her line of sight getting past the near end
**Scene** S9 (storyboard S8.3, J4) · **Frames** setup about 11640–11670; walk and lean 11661–11700; busted from 11697 · **Severity** minor (the reviewer filed it as major) · **Category** story · **Source** dir-S8-S9

**What.**
- The setup does read. At about 11650 the screen sits between them on screen (her x≈520–750, screen 820–975, him 1110–1420). The blocked pulses end on its face with crosses, and the readout is blank. So "the partition is never between them" is wrong.
- But after her walk, her whole body (x≈790–1070 at 11700) is in front of the near end (x≈960–975). The "lean round" is only a head tilt in front of the screen.
- S1.1 established a dashed coral sight line that stops on the screen with a cross (frame 150). S9 never brings it back.
- The geometry is honest. Her start (1.23, 0.95) to HIDE (2.84, 1.42) is blocked at z≈1.17; from C_SPOT (1.73, 1.62) the line passes the near end at z≈1.57.
- The director accepted a "lean past the near end, not a true peek". From this camera a true peek is impossible.

**Why.** The episode's closing visual argument ("around the END") doesn't pay off the S1.1 device. It is polish on an accepted limitation, so minor.

**Fix** — `source/src/scenes/S9_Payoff.tsx` (RoomShot):
1. **Required: the payoff line.**
   - At LEAN0, draw a coral dashed line from her eyes to his eyes, in the S1 style: `stroke={C.coral} strokeWidth={5} strokeDasharray="14 11" strokeLinecap="round"` (S1_ColdOpen.tsx ~778–820).
   - Her eye point comes from checkerAt(g).place plus the eye offset; his from the guesser rig at HIDE.
   - Draw it on with `tw(g, LEAN0 + 2, OPEN - LEAN0 - 2, E.out)`, so it reaches his face exactly at OPEN, with no cross.
   - Hold it through BUSTED, then fade over 8 frames before CARD0.
   - Layer it above the partition and both rigs. At 11700 it runs from about (1020,465) to (1205,410), just right of the near edge.
2. **Optional: the blocked line.** The same line stopping on the closed partition's face (`onFace(...)`, z≈1.17), with S1's Cross, on her glance ("toEnd", after C_LOOK + 8).
   - Start it after PATHS2_OUT, so the crosses never overlap.
   - Fade it at C_WALK0 + 4.
   - Keep ≥ 8 frames between BUSTED and CARD0 at 0.8x, and assert it.
3. **Do not** move HIDE (that brings back the head-on-shoulder crowding the director fixed), and do not bring back the PlanCard after R4.
4. **Tests.** Add the sight lines to the hidden tests (`figuresHide`, and `partitionHides` with LAY_CLOSED). Re-render 11690–11730 and check that the line clears her pencil and his ear.

**Evidence.** `$R1/verify_s9j4/g11650.png`, `$R1/verify_s9j4/g11700.png`, `$R1/verify_s9j4/seq.png`, `$R1/verify_s9j4/grid2.jpg`; `$R1/dir_s8s9/full11700.jpg`, `$R1/dir_s8s9/full11650.jpg`, `$R1/dir_s8s9/cwalk.jpg`. Source: data/layout.json (occluder); qa/scene_review/S9/REPORT.md:34, 109, 131.

---

### D43 — S9.3 (J4): the busted reaction gets no settle, and the narrator starts over it
**Scene** S9 (S8.3 → s48 end card) · **Frames** busted 11697 → wipe 11727 (his face covered at about 11731); s48 voice at about 11716–11720 · **Severity** minor (the reviewer filed it as major) · **Category** comedy timing · **Source** viewer

**What.**
- The take lands and reads: about 30–34 frames (1.0–1.1 s) of clean reaction, a smug eyes-shut beat of about 0.83 s (11663–11688), and her walk-in during it as staged.
- But s48 starts at 11717 ("This" 11720), about 0.7 s after the take and right on the tail of the uh_oh sting (11692–11710). The wipe follows 0.3 s later.
- The reviewer's timings (0.8 s, a 0.5 s smug beat) are wrong.
- Because `CARD0 = K.future − 10` and KK is exactly 1, any frames added to the s47 pause land entirely between BUSTED and the wipe.

**Why.** The episode's last gag gets no reaction-to-settle beat (DIRECTION; storyboard S8.3 "deadpan beat"). The music is silent here, so extra silence after the sting reads as a deliberate comic pause.

**Fix (lead decision: it changes narration timing):**
1. `tools/v02_script.py`: s47 `pause_after_ms` 4500 → about 5300 (+0.8 s, about 24 frames). Rerun it to rewrite `script/narration_segments.json`.
2. `tools/build_timeline.py`: reassemble from the existing takes. It writes `source/src/data/timeline.json` and the captions.
   - To keep 12091 frames, cut `TAIL_S` 5.5 → about 4.7. The end card still holds about 4.6 s after "corner".
   - Or accept a runtime 0.8 s longer.
3. `source/src/scenes/S9_Payoff.tsx`:
   - The beat chain needs no change (KK stays 1).
   - Use the new hold for reaction then settle: a guilty grin plus a tiny paw wave about 18–20 frames after BUSTED (reuse the S9.1 sheepish wave/EXPR), or GULP. She does one slow blink.
   - Add asserts: `CARD0 − BUSTED >= 45` and `K.s48 >= BUSTED + 40`.
   - Do not lengthen the smug beat.
4. Downstream:
   - `tools/make_music_v02.py` (J4 silence and s48 resolve follow timeline.json);
   - SFX cue export (collect_sfx.mjs / check_cues.py);
   - mix_v2.py;
   - re-render;
   - then D45 (copy the regenerated SRT).

**Evidence.** `$R1/verify_s9j4/grid_a.png`, `$R1/verify_s9j4/faces.png`; `$R1/viewer/s9_punch.png`, `$R1/viewer/s9_j4grid.png`; `qa/review_r1/dense/S9_sheet02.jpg`. Source: S9_Payoff.tsx:237–238, 311–313; data/timeline.json (s47 end 11582, s48 from 11717).

---

### D44 — The plan card and the S9 readout frames cross the 5% safe margin
**Scene** S9 (PlanCard 11296–11400; readout 11404–11497 and 11624–11660); the same card in S1 and S3 · **Severity** minor · **Category** layout · **Source** dir-S8-S9 (see the note on the refuted S3 report)

**What.**
- **PlanCard.** Its outline spans x 1398–1881 from y 38 (57 px past the 1824 line, 16 px above the 54 line). The tape reaches x 1810–1906, y 23–63 (`PLAN_CARD_RECT = {1400, 40, 480, 408}`, lib/shots.ts:33; tape at PlanCard.tsx:159).
- **Readout bezel.** Top at y 28–30 (`INSET = {96, 28, …}`, S9_Payoff.tsx:902).
- **The content is inside the margin.** The card title is at y 58–90 and the hider token's right edge at about 1812. The readout content starts at y 48, with the plot at y 220–370.
- In S3 the "slowed down · illustrative" chip pill reaches x 1847 (its text ends at 1818).
- The S1 report accepted the card as "inside the 5% margin". That is factually wrong: it is 38–40 px from the edges.
- **Verifiers disagree.** The dir-S3-S4 report on the same card in S3 was *refuted* (only borders cross, YouTube doesn't overscan). The S9 verifier confirmed it as minor composition polish (a cramped corner, possibly under the player's hover chrome).

**Why.** Strictly, SCENE_BRIEF's 5% rule covers critical text, which is satisfied. Under the review standard ("nothing important outside a 5% margin") and action-safe practice, the boxes and tape crowd the edge.

**Fix (lead decision; shared change if approved):**
1. **Shared pass**, `source/src/lib/shots.ts`: add `export const PLAN_CARD_AREA = {w: 400, h: 294};` and set `PLAN_CARD_RECT = {x: 1392, y: 56, w: 432, h: 372}`. The left edge stays the same, so S9's "would touch him" assert (S9_Payoff.tsx:266) and S3's overlap checks still hold.
2. **Shared pass**, `source/src/components/v02/PlanCard.tsx:159`: pull the tape inside the right edge (`x={w - 104}`, `rotate(8 ${w - 56} 2)`), or drop the overhang.
3. **Callers** pass `area={PLAN_CARD_AREA}` and `view={viewForArea(<current view>, PLAN_CARD_AREA)}`, and use `planCardSize(PLAN_CARD_AREA)`:
   - S1_ColdOpen.tsx (CARD_SIZE ~352, PlanCard ~916);
   - S3_Echo.tsx (CARD_SIZE ~177, PlanCard ~978), plus `CHIP_BOX = {x0: 1824 - 447, y0: 60, x1: 1824, y1: 118}`;
   - S9_Payoff.tsx (PlanCard ~850).

   Re-run each module's asserts (S1 overlap boxes ~1410–1420). Tokens shrink about 11%, so check them at phone size.
4. **Optional, S9 readout:** `INSET = {x: 100, y: 56, w: 416, h: 358}`, and hide the plant leaves above y 56 while it is up. Otherwise record it as accepted, with the correct reason.
5. **Docs:** correct qa/scene_review/S1/REPORT.md:36.

**Interaction:** D02 enlarges the S1.4–S1.5 card. That enlarged card must also sit inside the margin (right ≤ 1824, top ≥ 56).

**Evidence.** `$R1/verify_s9_margin/s9_crop.png`, `$R1/verify_s9_margin/s9_inset_crop.png`, `$R1/verify_s9_margin/s3_crop.png`; `$R1/dir_s8s9/full11364.jpg`, `$R1/dir_s8s9/full11476.jpg`.

---

### D45 — Package: the upload checklist names caption and video files that don't exist
**Scene** package (`package/UPLOAD_PACKAGE.md:54`, generated) · **Severity** minor · **Category** packaging · **Source** accuracy

**What.**
- The checklist says to upload captions `Future_Got_Weird_Video_02_v1.srt`, which is hard-coded in tools/make_package.py:103.
- The only caption file is `script/subtitles_v2.srt` (147 cues, ending at 6:38.21), written by tools/build_timeline.py:286. No step creates the named file.
- Line 102 also names `…_v1_UPLOAD_1080p.mp4`, which no documented render produces. exports/ holds only the REVIEW_1080p files.

**Why.** The owner could upload no captions, or the wrong file. The captions must also follow any s39 re-voice (D09) or s47 pause change (D43).

**Fix** — `tools/make_package.py`. Run it only after the final timeline (`python3 tools/build_timeline.py --engine v2`):
1. Take `src = ROOT/script/subtitles_{tl['engine']}.srt`. Assert that it exists and that its last cue ends at or before `tl['durationSeconds']`.
2. Copy it to `package/Future_Got_Weird_Video_02_v1.srt`.
3. Line 103: name that real path and give the cue count.
4. Line 102: name only files the documented renders produce, e.g. `exports/Future_Got_Weird_Video_02_v1_MASTER_4K.mp4`. Or add a 1080p upload render line to README.md.
5. Rerun the script and check that every named file exists. Do this with D10 (same script).

**Evidence.** `package/UPLOAD_PACKAGE.md:54`; `tools/make_package.py:102–103`; `tools/build_timeline.py:286`; `script/subtitles_v2.srt`; `script/narration_segments.json` (s39).

---

## FIX PLAN

### 0. Lead decisions (settle these before builders start)

| # | Decision | Affects | Recommendation |
|---|---|---|---|
| L1 | S2→S3 handoff: (a) one-room match cut, or (b) a slower, opaque card takeover | D03 | (a). (b) still breaks "settled labels do not move" and PATH_LEGIBILITY_PLAN:330. |
| L2 | s39 staging: cut to an "authors' clip" card, or cross-fade the tripod head, or grey out the kit | D09 | Cut to the card (cleanest). The grey-out is the budget fallback. |
| L3 | s39 device prop: neutral grey `AuthorsSensor`, or S6's saffron ResearchModule | D09 (and D33 consistency) | Neutral. EXPERIMENT_RECORD says R1's device is unresolved, while OPENING_EVIDENCE ties "ordinary clothes" to the smartphone-grade device. Resolve that conflict in the research docs first. |
| L4 | Re-voice s39 ("…with their own research device…") | D09, D43, D45, captions, music | Optional. The visual fix alone settles what "the sensor" refers to. |
| L5 | Thumbnails: withdraw A/B and recommend C, or redraw A/B | D11 | Recommend C now; redraw A/B later. |
| L6 | Move shared `CAM_ROOM` down 35 world px | D12 (S1, S4, S9; S3 too if D03 is not done) | Yes, in the shared pass. The S4 builder must apply CAM_OPEN = CAM_ROOM. |
| L7 | PlanCard double ease: fix in callers (entries only) or in PlanCard.tsx (entries and exits) | D16 | Callers. That keeps it scene-local; S7 relies on PlanCard's current curve. |
| L8 | Shrink `PLAN_CARD_RECT` into the 5% margin | D44 (S1, S3, S9) | Verifiers disagreed (the S3 instance was refuted). If approved, do it in the shared pass. |
| L9 | S3.2 open set end: extend RoomSet left, or accept it (the S1.6 precedent) | D20 | Fix it (opt-in prop). Otherwise record it in the S3 REPORT. |
| L10 | S4.7 overlay: carry it across the S4→S5 cut (S4 + S5_Board + S5_History + shots.ts HANDOFF), or fix it in S4 only | D29 | S4-only fallback, unless S4 and S5 are given to one builder. |
| L11 | J4 settle: lengthen the s47 pause by about 0.8 s (pipeline: narration, timeline, music, SFX, captions) | D43 | Yes, together with any L4 re-voice, in one timeline rebuild. |
| L12 | S6.6 illustrative positions H_C/H_D: add to research/geometry/layout.json (shared, additive), or keep local | D08 | Add as a new additive key via tools/sync_layout.py, to keep "every position comes from layout.json". |
| L13 | S1.3 provenance: relabel "authors' code, run by us", or switch to `stored_xz` (from index 6) | D13 | Relabel, and amend STORYBOARD S1.3. |
| L14 | sensor_pulse sync: a visible burst (opt-in HandheldSensor prop) or an audio-only cue shift | D15 | The visible burst keeps the sound on the word "flash". |
| L15 | D02: move her 0.15 m at the S1 cut, or clip the scatter fan with rigCovers | D02 | Clip, if her mark change would break the S1→S2 match. |
| L16 | D42 sight line is polish on an accepted limitation | D42 | Do it. It is cheap, and it pays off S1.1. |

### 1. Shared pass (one person, before builders branch; every change opt-in or additive)

Do these on the main tree, run all nine module-load checks plus `tsc`, and confirm a re-render of untouched scenes is pixel-identical (apart from the intended CAM_ROOM move). Builders then branch from this commit.

| File | Change | For |
|---|---|---|
| `source/src/lib/shots.ts` | Add `HANDOFF_S2S3 = {cx 585, cy 470, zoom 1.2}` | D03 |
| `source/src/lib/shots.ts` | `CAM_ROOM.cy` 565 → 530 (moves framing in S1, S4, S9; S3 if D03 is skipped) | D12 (L6) |
| `source/src/lib/shots.ts` | `PLAN_CARD_AREA`, `PLAN_CARD_RECT = {1392, 56, 432, 372}` | D44 (L8, if approved) |
| `source/src/lib/shots.ts` | `HANDOFF.S4S5` overlay frame-out values | D29 (L10, only if carrying across the cut) |
| `source/src/components/v02/PlanCard.tsx` | Tape inside the right edge (line ~159). **Do not change easing** (D16 is fixed in callers). | D44 |
| `source/src/components/v02/RoomSet.tsx` | GapMarker opt-in `patchOpacity`, `outline` | D02 |
| `source/src/components/v02/RoomSet.tsx` | Opt-in `extendLeft` | D20 |
| `source/src/components/v02/Optics.tsx` | PossibleCloud opt-in `outerOutline`, `outerFillOpacity`, `rim` (defaults unchanged; S4.5 and S9 must not change) | D28 (optional) |
| `source/src/components/v02/HandheldSensor.tsx` | Opt-in `burst` prop on HandheldSensor and SensorTop | D15 (L14) |
| `research/geometry/layout.json` (+ `tools/sync_layout.py`) | Additive illustrative track points H_C, H_D | D08 (L12) |

### 2. Scene builders (one per scene, each in an isolated copy branched from the shared pass)

Each builder re-runs its module asserts and tsc, renders its scene range, and posts before/after stills at the frames named in each defect.

- **S1 builder** — `source/src/scenes/S1_ColdOpen.tsx`, `source/src/components/v02/S1_TrackingBoard.tsx` (`S1_Props.tsx` only if L13 = stored_xz)
  - D01 frustum fan (backdrop ~730–770).
  - D02 local `CAM_PATH_S1`, enlarged in-margin plan card, GAP_PT on the floor, GapMarker props, glow clearance.
  - D12 framing check `< 54` (~1446).
  - D13 conditions line (TrackingBoard:216, comment:14).
  - D14 `BOARD_HIT` paper_slap (~318, 451).
  - D15 burst/firing hold to EMERGE (~680–694; cues 455/460).
  - D16 E.linear entries (881, 882).
  - D18 optional ruler headline (~1129).
  - D44 PlanCard caller (if L8).
  - Hand-off check: if D02 moves her, confirm S1's last frame still matches S2's first.
- **S2 builder** — `source/src/scenes/S2_Mirror.tsx`
  - D03 `TAKEOVER_DUR = 0` (455), `CAM_D = HANDOFF_S2S3` (273).
  - D17 route stagger and per-marker throb (438–439, ~1246).
  - D18 solid card swap (1290, 1307).
- **S3 builder** — `source/src/scenes/S3_Echo.tsx`, `source/src/components/v02/S3_EchoBoard.tsx`, `source/src/components/v02/S3_BlockCard.tsx`
  - D03 `CAM_OPEN = HANDOFF_S2S3` (214); optional carried timing card; check CARD_IN.
  - D04 E.linear card enter (1015), paper_slide at CARD0 (636).
  - D05 spike on "real data" (325–327, ~1140), pen opacity and spike pulse in EchoBoard (~280–287).
  - D15 optional burst at LAUNCH (631).
  - D16 E.linear PlanCard entry (914).
  - D19 tally: no numeral, "not to scale" line (1055–1075, TALLY_BOX 182).
  - D20 `extendLeft` after the push (~920).
  - D21 y-title 34 px (EchoBoard:259).
  - D44 caller and CHIP_BOX (if L8).
  - Also check the unverified S3 paper_slap at LAND (325) the same way as D14.
- **S4 builder** — `source/src/scenes/S4_Geometry.tsx`; **also owns** `source/src/components/v02/S5_Board.tsx` (the S4→S5 pixel-matched handoff)
  - D06 ✗ hold (257–259, 539, 746–747, ~903).
  - D12 `CAM_OPEN = CAM_ROOM` (156–160). **Required** once the shared CAM_ROOM moves.
  - D22 + D23 S4.2 labels together (735–783): midpoint "1.33 m each way", delay pills, round-trip line.
  - D24 RELAX and sigh (201, 434, 889).
  - D25 second-ruler swing and sweep (210–215, 408–417, 896).
  - D26 UHOH (~223, 898).
  - D27 chip paper backing (853–862).
  - D28 levels, ring, token dim, PhotoFrame slide (670, 819, 279–286, 832–840) **plus the S5_Board.tsx:61–63 mirror**.
  - D29 S4-only clear timing (or the cross-cut variant per L10).
  - Verify 5691/5692 pixel match after the S5 builder merges.
- **S5 builder** — `source/src/scenes/S5_History.tsx`, `source/src/components/v02/S5_Exhibits.tsx`
  - D07 clock world label, chip restyle and relocation (404, 462–489, 363–368).
  - D31 amb_museum overlap (500).
  - D29 overlay exit only if L10 = carry across, sequenced after S4.
  - **Must not change** `S5_Museum.tsx` exports or `MU` geometry: D30 (S6) and D37 (S7) import them.
  - **Must not touch** `S5_Board.tsx`: the S4 builder owns it.
- **S6 builder** — `source/src/scenes/S6_Small.tsx`, `source/src/components/v02/S6_Plinth.tsx`, `source/src/components/v02/S6_ResearchModule.tsx`
  - D08 three-step right-panel track with breadcrumbs (840–851, 180–182, CAM_R if needed).
  - D27 GuardChips `knock` (852–866, 897).
  - D30 CAM_S5_END opening move, plus S5 lamp, stool and card drawn in MuseumSet (imports S5_Museum read-only).
  - D32 grip hold, release and teeter (132–137, 267–305).
  - D33 drop "10 × 10" (412; module 54–59).
- **S7 builder** — `source/src/scenes/S7_Results.tsx`, `source/src/components/v02/S7_Props.tsx`, `source/src/components/v02/S7_Plots.tsx`
  - D09 s39 restage: kit out, neutral `AuthorsSensor`, TargetBoard removed before the walk, new chip (966, ~1203–1209).
  - D13 optional pill (553).
  - D34 colour code (Plots ~91/132/144/152; Results 531/544/547).
  - D35 TargetBoard turn and glint relocation.
  - D36 `FLAT_IN` and the hand guard (~1106, ~1163, ~1311, ~1351).
  - D37 museum from S5_Museum parts (1217–1269).
  - D38 `FINAL_CHIP` and wording (463, 1259).
  - D09 and D35 both touch the s38 TargetBoard, and D37 and D38 share the museum shot: do each pair together.
- **S8 builder** — `source/src/scenes/S8_Warehouse.tsx`
  - D39 THERE_END / BOARD_DOWN (249), NOT_WHO split (559, 565).
- **S9 builder** — `source/src/scenes/S9_Payoff.tsx`, `source/src/components/v02/S9_Readout.tsx`
  - D16 E.linear PlanCard entry (832).
  - D40 INSET_OUT, calm exits, 44 px label (193, 828, 882–883; Readout:99).
  - D41 walk plan (256, 309–310).
  - D42 sight line(s).
  - D43 reaction and settle beat plus asserts (once L11 lands).
  - D44 caller and optional INSET (if L8).
  - D40, D41, D42 and D43 share the J4 timing chain. Do them in one pass and re-run the 0.8x/1.0x/1.2x timing loads.

### 3. Non-scene work (lead or a packaging builder)

- `tools/make_package.py` — D10 (description text) and D45 (SRT copy, real file names). Run last, after the final timeline.
- `README.md` line 28 — D11 thumbnail recommendation (L5).
- `source/src/Thumbnails.tsx`, `source/src/components/v02/Thumb_Kit.tsx` — D11 redraw (if L5 = redraw).
- Narration timing — D43 (L11) and the optional D09 re-voice (L4): `tools/v02_script.py` → `tools/build_timeline.py` (TAIL_S) → `source/src/data/timeline.json`, `script/subtitles_v2.srt`. Do this **before** scene builders finalise S9 (S9 cues read timeline.json).
- Docs for the owner:
  - STORYBOARD.md S1.3 chip text (D13) and S6.10 chip text (D09).
  - qa/scene_review/S1/REPORT.md lines 36 (D44), 63 (D14), 127 (D01).
  - qa/scene_review/S3/REPORT.md line 18 (D16) and the stale CAM_D claim (D03).
  - qa/scene_review/S8/REPORT.md line 20 (D39).

### 4. Audio and integration pass (after all scene branches merge)

1. Music: `tools/make_music_v02.py` — D31 (hold the turn chord to the S6 cut, pickup on the cut). Also picks up D43 automatically.
2. SFX cues changed in scene files:
   - D04 paper_slide
   - D06 indicator_no
   - D08 footsteps
   - D14 paper_slap
   - D15 sensor_pulse (if cue-shift route)
   - D24 relief_sigh
   - D25 arc_draw
   - D26 uh_oh
   - D29 paper_swish
   - D31 amb_museum
   - D36 and D38 chip_pop
   - D39 board, D40, D41 footsteps, D43 uh_oh/amb

   Rebuild with `node tools/collect_sfx.mjs …` → `tools/make_sfx_v2.py` → `tools/mix_v2.py` → `tools/audio_qc.py` → remux.
3. While in audio, review these unverified mid-word cues: smug_exhale f3381 (S3, "tiny."), prob_tick f5392 (S4, "match."), robot_brake f11045 (S8, "collisions.").
4. Full re-render, new dense sheets (`tools/qa_dense.py`), and a cut sheet `qa/cuts/r3` (D03). Then a round-2 review of every changed range.

---

## Appendix A — Refuted reports (not defects)

1. **S2.2→S2.3: magnifier lens rests on the partition top like a lollipop** (dir-S1-S2, about 2230–2244). The settled lens is 40–57 px clear. The contact frames 2240–2242 are mid iris-open expansion.
2. **S3.1: overlays outside the 5% safe margin (plan card, illustrative chip, tally card)** (dir-S3-S4, 2899–3175). Only borders cross the line; all text is inside, and it is deliberate. *Note:* the S9 verifier confirmed the same card-margin issue as minor polish (D44), so the lead decides (L8).
3. **S3→S4: board leaves through a too-fast hard wipe** (dir-S3-S4, 3952–3957). It is the house 12-frame eased wipe, visible for about 9 frames and the same at S7, S8 and S9.
4. **S8: "fast math on small hardware" digits pour in before "fast" and over the title** (dir-S8-S9, 10824–10840). The digits are clipped below the title band with a 27 px gap; the 9-frame lead-in is intentional.
5. **S8: robot_brake fires while R3 is still cruising** (audio, 10276). Deceleration starts at 10276, and the squeak peaks at about 10288, 5 frames before rest. Only its low mix level is real, which is optional polish.

## Appendix B — Merge map (original confirmed reports → IDs)

| Pass | Original report (scene / frames) | ID |
|---|---|---|
| dir-S1-S2 | S2.4→S3 takeover (2848–2874) | D03 |
| dir-S1-S2 | S1.2 fan (200–290) | D01 |
| dir-S1-S2 | S1.3 ours_xz provenance (300–600) | D13 |
| dir-S1-S2 | S2.4 stub order (2640–2850) | D17 |
| dir-S1-S2 | Card entrances: S1.4 plan card / S1.7 ruler / S2.4 swap | D16 (plan card), D18 (swap + ruler headline) |
| dir-S1-S2 | S1.1 partition top 13 px | D12 |
| dir-S3-S4 | S4.6 ✗ flash | D06 |
| dir-S3-S4 | S3 block card slam + paper_slide | D04 |
| dir-S3-S4 | S3 plan card double ease | D16 |
| dir-S3-S4 | S4.2 ruler waver "1.33 m" under her token | D22 |
| dir-S3-S4 | S4.3 second ruler snap | D25 |
| dir-S3-S4 | S4.7 "not a photograph" too brief | D29 |
| dir-S3-S4 | S4 chips pierced by ticks | D27 |
| dir-S3-S4 | S4.7 likely-location sliver | D28 |
| dir-S3-S4 | S3 y-axis 32 px | D21 |
| dir-S3-S4 | S3.2 room set edge | D20 |
| dir-S5-S7 | S7 s39 chip over kit | D09 |
| dir-S5-S7 | S5→S6 cut | D30 |
| dir-S5-S7 | S6.1 hand grip | D32 |
| dir-S5-S7 | S7 reflective strip | D35 |
| dir-S5-S7 | S7 flat wall chip | D36 |
| dir-S5-S7 | S5.2/S5.3 30 px fact chips | D07 |
| dir-S5-S7 | S6.3 "10 × 10" | D33 |
| dir-S5-S7 | S6.5 chips pierced by ticks | D27 |
| dir-S5-S7 | S6.6 right panel step | D08 |
| dir-S5-S7 | S7 museum slot | D37 |
| dir-S8-S9 | S9 J4 around the partition | D42 |
| dir-S8-S9 | S8 "not who" | D39 |
| dir-S8-S9 | S9.2 likely location | D40 |
| dir-S8-S9 | S9 checker walk | D41 |
| dir-S8-S9 | S9 PlanCard / readout margin | D44 |
| accuracy | S7 s39 chip over kit | D09 |
| accuracy | Package description 30 fps | D10 |
| accuracy | Thumbnails over the top | D11 |
| accuracy | S4.2 8.85 ns vs 1.33 m | D23 |
| accuracy | S6.3 "10 × 10" | D33 |
| accuracy | S3.1 tally counter | D19 |
| accuracy | S7 final chip | D38 |
| accuracy | Package SRT name | D45 |
| audio | S4 uh_oh on "place" | D26 |
| audio | S5/S6 music dropout | D31 |
| audio | sensor_pulse early | D15 |
| audio | S1 paper_slap late | D14 |
| audio | S4 relief_sigh over "direction" | D24 |
| viewer | S1 around the end only in card | D02 |
| viewer | S4 likely location covered by X | D28 |
| viewer | S3 empty board | D05 |
| viewer | S5 "7 min to measure" | D07 |
| viewer | S9 J4 comedy timing | D43 |
| viewer | S6.6 right panel | D08 |
| viewer | S4 "1.33 m" at tip | D22 |
| viewer | S4 vs S1 ns | D23 |
| viewer | S7 board colours swapped | D34 |
| viewer | S5→S6 cut | D30 |

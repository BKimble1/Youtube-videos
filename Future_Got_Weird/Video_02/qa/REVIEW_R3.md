# Video 02 "How Cameras See Around Corners": review round 3 (final check)

- **Candidate:** `exports/Future_Got_Weird_Video_02_v1_UPLOAD_1080p.mp4` (6:44, 1920x1080, 30 fps, 12120 frames; x264 CRF 16; commit 9386fdc). There was no separate REVIEW3 render: the upload file is the round-3 render.
- **Compared against:** `exports/Future_Got_Weird_Video_02_v1_REVIEW2_1080p.mp4` (same timeline, before fix round 2; x264 CRF 18).
- **Date:** 2026-10-09
- **Fix round:** fix round 2 merged in 4eb4d50 (plan: `qa/REVIEW_R2.md` §3); sound pass 9842227. N14 and N15 (package and docs) were done separately and are outside the video passes. The lead spot-checked them (§1).
- **Inputs:** four passes: S1–S3 (D02, N01–N05), S4/S6/S7 (D22, N06–N11), S9 (D41, N12, N13), and stability plus audio (the whole film against REVIEW2, and the audio track). A skeptic re-checked every new report against frames it extracted itself and against the source. All five new reports were confirmed and none were refuted. The skeptics corrected three details (Appendix A).
- **Scope:** the changed ranges from REVIEW_R2 §3.4, every frame compared with REVIEW2, and the audio. The 4K master (401a568) was not checked in this round.
- **Frames:** 0-based render frames, as `select=eq(n,…)` returns them. Frame mapping was checked against single-frame extraction in every pass.
- **Evidence:** `$R3` = `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/review_r3`. This is session scratch; copy anything you need to keep. Dense sheets: `qa/review_r3/dense/`.
- **Severity:** blocker (wrong fact, physics contradiction, broken shot, privacy), major (visible flaw a viewer would notice or that weakens the explanation), minor (polish).

## Verdict

**Releasable as is: yes.** No blocker or major is open. All seven open entries are minor. Three of them are in the picture (N16; N17, which is N10's residual; N18), and three are doc-only (N15 residual, N19, N20).

## Summary

| | Count |
|---|---|
| Round-2 items in scope (D02, D22, D41, N01–N13) | 16 |
| Fixed | 15 |
| Partly fixed | 1 (N10; the residual is N17) |
| Not fixed / regressed | 0 / 0 |
| N14 / N15 (outside scope; lead spot check) | N14 fixed; N15 partly (README still points to the missing STATUS.md) |
| New defects confirmed (all minor; 0 blocker, 0 major) | 5 (N16–N20) |
| New defects refuted | 0 |
| **Open entries** | **7, all minor** |

Of the five new defects:
- **N17** is a side effect of the N10 fix.
- **N16 and N18** are not regressions. Both are identical in REVIEW2 and were missed in rounds 1 and 2.
- **N19 and N20** are gaps in the declared changed-range list. The frames they cover were checked in this round and are clean, so neither needs a re-render.

Both cuts touched by fix round 2 are clean: S2→S3 at 2873/2874, and S4→S5 at 5691/5692. The S6→S7 wipe (8796–8802) is clean too. Audio is within spec: −15.5 LUFS integrated, −1.3 dBTP true peak.

**Open items**

| ID | Sev | Scene | Title |
|---|---|---|---|
| N10 | minor (residual) | S7 s38 | The hand no longer passes through the board or pole, but the new return path folds the arm across his chest. Tracked as N17; N10 closes with it. |
| N16 | minor (lead call R3-L1) | S1.4–S1.5 | The right side wall's near cut end is in frame, with bare page paper beyond it, ~660–1138 (worst 1120–1132). Not a regression. |
| N17 | minor | S7 s38 | After the board turn, his elbow folds inward across his chest as the hand returns (9513–9518) |
| N18 | minor | S9 J4 | Her planted shoe skates 12 px during the closing step (11675–11680), and ~8 px at the first step (11654–11656). Not a regression. |
| N19 | minor (doc only) | S1 | The changed-range list missed 1021–1111. Checked clean here; annotate REVIEW_R2 §3.4. |
| N20 | minor (doc only) | S7 | The changed-range list missed 9561–9821. Checked clean here; annotate REVIEW_R2 §3.4. |
| N15 | minor (doc residual) | docs | `README.md:8` and `:82` still point to `STATUS.md`, which does not exist |

---

## 1. Round-2 items: status in round 3

| ID | Scene | R3 status | Note and evidence |
|---|---|---|---|
| D02 | S1.4–S1.7 | fixed | The quiet diamond reads as intended. Outside light events, the in-room W3 marker is a ~28 px grey ink-outline diamond at ~0.5 opacity, with no fill and no glow. It lights (saffron fill and dashed glow) only around light events: ~954–967, ~1058–1071, the race at 1178–1195 and 1220–1233, and the S1.7 tape at 1698–1735. Each switch is a 2–4 frame fade with no pop. In the long holds (1240–1697, 1736–1825), nothing saffron sits at her pencil tip. At 0.4 scale and at 480 px it reads as a small neutral mark on the wall, not a pencil sparkle. It is faint at 480 px (~7 px), but the card carries the spot. The 1059–1071 light-up inside the undeclared gap was checked separately (N19) and is clean. While lit, the spot sits ~66–75 px from her pencil tip. That is the accepted R2-L1 limitation, recorded in `qa/scene_review/S1/REPORT.md:30`. `$R3/s123/g_04crop.png`, `g_phone.png`, `seq_1174.png`, `seq_1690.png`, `$R3/verify_gapS1/lightup_strip.png` |
| D22 | S4.2 | fixed | Closed by N06. The ruler tip stops on his token 4445–4460 and is pixel-still while "He could be" is spoken (4448–4459). "1.33 m each way" stays beside the ruler held on him and is readable 4444–4463 (~20 frames; R2 was a ~3-frame blink on him). `$R3/s4n06/new_4436_4475.jpg` |
| D41 | S9.3 | fixed | Shoe-tracked footfalls are at 11656, 11664, 11674 and 11681/11682. The gaps are 8, 10 and 7–8 (R2: 8, 8, 5), which meets "full steps ≥ 8, closing ≥ 7". It reads as a stroll. The walk starts at BLANK (11651; first lift 11652), and the last footfall comes before LEAN0 (11683). Footstep cues are at 11656/11664/11674/11682. The legs pass in profile with no X. The planted-shoe skate during the closing step is N18; it is not a regression. `$R3/s9/walk_grid.png`, `feet_close.png` |
| N01 | S1.4–S1.5 | fixed | The diamond scale-pops 800–802 and the "blocked" pill shrinks out 792–796. "gap" pops 811–815, after the diamond. The leader leaves the pill's right edge, elbows down at x≈580 (12 px from the partition ink) and draws down 816–823. Its end dot lands ~822, and the threshold dashes pulse ~824–834. It is knocked out under the W→H leg (y≈392–437), under the blocked line and X until ~875, and under the S1.5 fans, pulse and rings 954–~985. f907, f962 and f985 show no leader pixels on the light. At 480 px it is faint but can be followed. The exit (1015–1017) is as in R2, one frame earlier. `$R3/s123/seq_leader.png`, `g_n01_cross.png`, `g_n01_fan.png`, `g_phone_leader.png` |
| N02 | S1.6 | fixed | Full-frame phase correlation: the pan runs 1121–1160 with a symmetric ease. It peaks at 38.7 px/frame at 1140–1141 (R2: 55.6), with no steps. Start and end frames are unchanged, as is the race at 1162. `$R3/s123/pan_new.txt`, `pan_old.txt` |
| N03 | S1.6–S1.7 | fixed | No bare paper in the left 60 px columns on any sampled frame from 1100 to 1825. The extendLeft switch-on (1119→1120) changes nothing at the left edge. 1133–1825 show continuous wall, skirting and floor that match the 3300 framing. The S1.6 ToF label is legible at 1450. The right end of the same set is N16, a separate defect. `$R3/s123/paper_new.txt`, `g_s16_full.png` |
| N04 | S2.4 | fixed | The card is absent at 2763. It enters opaque from off frame at 2764, with 219 px showing. Its right edge then steps 191, 135, 93, 59, 37, 23, 14, 8, 5, 3 px (E.out) and settles at x 96–789 by ~2775. The whole-card pop is gone. S2's last frame and S3's first frame match R2 to encode noise. `$R3/s123/seq_n04.png`, `g_n04.png` |
| N05 | S3.2 | fixed | "not to scale · far weaker" (30 px bold, inkSoft) is right-aligned under the "illustrative" pill. It is part of the card from 3194 to ~3393, with no entrance of its own. At 3370 it sits at x 542–873, y 157–177, with every clearance ≥ 20 px. The wording matches S3.1's "not to scale · far more is lost". It is the only difference from R2 in 3186–3402. `$R3/s123/g_n05.png`, `g_n05_zoom.png` |
| N06 | S4.2 | fixed | The sweep eases in from 4426, holds 4445–4460 and closes along the wall by 4499. The label fades in 4443–4446, holds pixel-still 4445–4461 (bbox 944–1257 × 268–305), fades in place 4461–4468, and never touches the ruler. The delay chain exits by opacity only (4461–4470), with no scale change. The first ghost starts at 4464. The hops from 4500 are identical to R2. Cues: arc_draw at 4426 and 4460, pop_tick at 4446. `$R3/s4n06/new_4436_4475.jpg`, `chain_4458_4473.jpg`, `wide_4420_4520.jpg` |
| N07 | S4.7 | fixed | The frame drops in 5615–5626 with an ease-out and holds on him until 5636. It slides 5637–5648, with end steps of 38, 32, 23, 8 and 0. Frames 5648–5650 are identical, and the first X pixel appears at 5651. The frame is clear of the ring and labels, and from 5658 it is identical to R2. 5691/5692 still match S5. Cues: card_flick at 5626, stamp_light at 5650. `$R3/s4n07/slide_5635_5652.jpg`, `drop_5614_5625.jpg`, `out_5664_5700.jpg` |
| N08 | S6.6 | fixed | The tripod unfolds 8668–8675 as the right panel lights up. Her arm pulls back 8672–8675 and is gone from 8676; the plan asked for it to be gone from 8681. The sensor and her token don't move, and the legs stay up to the wipe. The left panel is identical to R2. At 480 px the tripod reads as a stand. Cue: tiny_clink at 8675. The wipe (8796–8802) is identical to R2 except for the tripod, which the wipe edge cuts cleanly. `$R3/s6n08/letgo_8660_8691.jpg`, `phone_old_new_8720.png` |
| N09 | S7 s38 | fixed | The board's width steps 168, 165, 157, 143, 121, 89, 49, 13 over 9493–9500 (8 frames; R2: 3) and is back by 9508. The strip faces the camera 9469–9492, his hand rides the edge, and he leans into the push 9487–9495. A saffron strip tab sits on the board's wall-side edge from 9502 to the cut at 9821. Both arrival pulses land on it (9538–9548 and 9563–9574; see N20). The plan card turns in sync (edge-on at 9500 in both views), and its strip is now a solid bar. Cue: card_flick at 9509. `$R3/s7n09/turn_9484_9531.jpg`, `tab_9498_9560.jpg`, `plan_9488_9511.jpg`, `phone390.png` |
| N10 | S7 s38 | **partly** | Fixed: the hand never crosses the board or its pole, never goes left of the board's edge (~x 1455), and reaches the hip by ~9526 without the old straight-arm flare. Open: leg 1 of the new return folds the elbow inward across his chest for 9513–9518. That is N17. `$R3/s7n09/hand_9510_9525.jpg`, `old_hand_9496_9519.jpg` |
| N11 | S7 s39 | fixed | From 9822 to 9999, the relay wall, skirting and floor run to the right edge of the window, and a sample across x 1100–1790 at 9830 is the same wall colour throughout. The film strip and the "slowed down" chip sit on plain wall. Only x 1236–1792 of the window differs from R2. The cut on "test," (9822) and the cut to the museum (10000) are unchanged. `$R3/s7n11/card_9816_10010.jpg`, `$R3/r3s467/new/f09830.png` |
| N12 | S9.2 | fixed | The card is ~520×437 at x 1304, y 74, with its ink border to x 1825. It slides and fades in 11300–11308, before the first pulse (11314), and fades out 11401–11406, before the inset arrives (11407), so the two plan views are never on screen together. His outline stays at least 26 px left of the card on every frame 11306–11404, leaving his rim flash and paws uncovered. At phone scale both round trips and the gap read, visibly larger than in R2. `$R3/s9/card_phone.png`, `card_inout.png` |
| N13 | S9 J4 | fixed | The paw goes up by way of his chest: hip at 11720, lower torso 11722, chest 11723, shoulder 11724, raised 11725, top 11728. The fist stays visible through the armsFront switch (11724→11725). Down: shoulder 11739, chest 11740, lower torso 11741, hip 11742. There is no handless frame either way, and the 11718/11738 snaps are gone. The paw is on the hip from 11745 (SETTLE0), 4 frames before "This" (11749) and 11 before CARD0 (11756). Her blink (11726–11740) finishes before the wipe. `$R3/s9/paw_up.png`, `paw_dn.png`, `paw_switch.png` |
| N14 | package | fixed (lead spot check) | `package/description.txt:20` and `package/UPLOAD_PACKAGE.md:35` read "Code (MIT License) and released data: …". |
| N15 | docs | **partly** (lead spot check) | STORYBOARD S6.10 matches the card and carries the D09 firewall note. README lists `tools/make_deliverables.sh` and its exports, and the CRF 12 command is gone. Open: README lines 8 ("Read first: `STATUS.md`") and 82 ("…are in `STATUS.md`") still point to a file that does not exist and was never committed. The N15 check (`grep` README for STATUS.md: no hits) fails. Fix: write `STATUS.md` (the delivery commands with their measured output, and pointers to this file and the defect log), or point both lines to `qa/REVIEW_R3.md` and `qa/DEFECT_LOG.md`. This is doc only and does not touch the upload file. |

**S9 timing after the D41/N13 shift** (from the scene module): BLANK 11651, LEAN0 11683, OPEN 11698, BUSTED 11701, SETTLE0 11745, CARD0 11756. The take lands 55 frames before the wipe (needs ≥ 45) and 46 before s48 (needs ≥ 40). R4 (11576–11627) is locked with no overlays: start hold 11576–11579, squat from 11580, end hold 11623–11626 byte-identical. The wipe runs right to left 11756–11766. FUTURE, GOT and WEIRD land on their words (11766, 11778, 11787), and the end card holds to 12119, identical to R2. Cues: footsteps 11656/11664/11674/11682, uh_oh 11701, logo_hit 11766.

---

## 2. Stability check and audio

### 2.1 Picture outside the changed ranges

**Method.** The two files are different encodes (UPLOAD x264 CRF 16, ref 5, subme 8, trellis 2; REVIEW2 CRF 18), so exact pixel identity cannot hold. Every frame carries spread-out edge noise: mean absolute difference 0.2–1.6/255, with isolated edge pixels up to ~100. A material change was defined as a cluster of pixels more than 40 levels apart, after a 2×2 opening, at 30 px or more.
- 60 full-resolution frame pairs were compared, spread over every scene and including the boundary frames just outside each changed range, 2873/2874 and 10151.
- All 12120 frames were compared at half resolution.

**Result: pass, once the changed ranges are corrected (§4).**
- Outside the declared ranges, only two stretches differ materially: S1 1021–1111 and S7 9561–9821. Both come from round-2 fixes (D02's quiet marker and N09's strip tab). Both were reviewed frame by frame in this round and are clean; they are logged as N19 and N20 because the plan's range list left them out.
- 55 of the 60 full-res pairs match within noise. The other five are 1060 and 1108 (inside N19) and 9565, 9700 and 9815 (inside N20).
- Clean throughout:
  - S2 outside 2755–2785
  - S3 outside 3190–3400
  - S4 outside its two ranges
  - S5
  - S6 7104–8639, so the N08 fix made no early hand change
  - S7 8799–9459 and 10001–10151
  - S8
  - S9 11178–11279 and 11761–12119
- Codec-only cases, not defects:
  - 2244/2245 and 2526 peak at 88–106 levels, but the difference is scattered edge pixels across the whole frame.
  - The partition's brass hinge pins (x ~1144–1154, from 9379) differ in chroma only (max 58), with the same geometry.
  - The rope edge at 10151/10152 and the bottom rows are within noise.
- Inside the declared ranges, the differences from R2 stay in the intended areas:
  - S1: the leader column (x 460–600) and the wall-spot box at 795–1111; the left extended set and the wall-spot box at 1112–1825.
  - S2: the slots card at 2764–2775.
  - S3: the new line's box at 3194–3393.
  - S4, S6, S7 and S9: as listed in §1.
- Cuts and wipes: S2→S3 at 2873/2874 is idle motion only (mean abs diff 0.027; R2 0.030), and the push and card slide-out from 2878 ramp smoothly (0.86, 4.3, 6.7, 8.8, 11.0), as in R2. S4→S5 at 5691/5692 differs in a single 1-px column of 16 pixels (R2: 56). The S6→S7 wipe (8796–8802) is as described under N08.

Evidence: `$R3/stability/fullscan.jsonl` (all 12120 frames), `$R3/stability/cmp60.json`, `$R3/stability/crop_hinge.png`, `$R3/stability/diffmap_small.png`.

### 2.2 Audio (candidate)

| Measure | Value | Spec / reference |
|---|---|---|
| Duration | 404.011 s (19,392,512 samples, 48 kHz stereo AAC); video 404.000 s | same as REVIEW2 |
| Integrated loudness (ebur128) | −15.5 LUFS | −16 to −14 |
| True peak | −1.3 dBTP | ≤ −1 |
| Loudness range | 2.3 LU (low −17.2, high −14.9 LUFS) | — |
| Match to `audio/mix/v2/final_mix.wav` | zero lag, median residual −39 dB | — |
| Tail | last 0.5 s is a clean fade (peak −45 dBFS) | — |

The audio matches REVIEW2 up to 147.6 s, with a residual under −30 dB. After that, sound-effect waveforms differ at their existing cue positions (for example marker_circle at 166.5 s, shutter clicks at 265–267.5 s, film ticks at 328–331 s and robot cues at 350–352 s). This is expected. `tools/make_sfx_v2.py` draws a seeded variation for each cue in cue order (±0.3 semitone, ±0.6 dB, ±0.18 pan). The two inserted cues (arc_draw at f4460, tiny_clink at f8675) shift that sequence, so every later effect gets new values. No cue time outside the changed ranges moved (placed.json diff in 9842227). Every new or moved cue lands on its picture beat (§1, N06–N09 and the S9 timing paragraph). Evidence: `$R3/stability/ebur128_upload.txt`, `$R3/stability/audiorows.npy`.

---

## 3. New defects (confirmed)

### N16 — S1.4–S1.5: the room's right side wall ends in frame, with bare page paper beyond it, for ~16 s
**Scene** S1 (CAM_PATH raised framing) · **Frames** ~660–1138; worst at 1120–1132 · **Severity** minor · **Source** S1–S3 pass; confirmed by skeptic · **Not a regression** (identical in REVIEW2; missed in rounds 1 and 2)

**What.** In the raised path framing, the right side wall stops at its near cut end, a vertical cream cut cap at x≈1670–1700 running from y≈350 to the bottom of the frame. Flat page paper (250,241,223) fills everything to its right.

| Frames | Paper px (x ≥ 1540) | Leftmost paper |
|---|---|---|
| 660 | ~221k | strip first appears |
| 680–860 | ~169.5k | x 1833 at y=100 (right of the PlanCard), x 1701 at y=900 (below it) |
| 880–1100 | ~156.7k | x 1833 and x 1822, partly under the "slowed down" and "invisible flash (shown for clarity)" chips |
| 1120 | ~270k (~13 % of the frame) | x 1568 at y=100, x 1700 at y=900; the card has gone and the pan has not yet carried the strip out |
| 1140 | ~2.9k | |
| 1160, 1300 | ~0 | |

REVIEW2 measures the same (169.9k / 156.2k / 269.9k px, same bounds).

In S1.1 (CAM_ROOM, f100) the side wall reaches the right frame edge; only the accepted left dollhouse end at x≈0–75 shows. In S3.1 (f3000, f3150) there is a small paper triangle (~17k px) at the top right, above the side wall's diagonal top cap. The vertical cut end and the floor beyond it are out of frame there, and the door reaches the frame edge. So S1.4–S1.5 is the only room framing in S1–S3 that shows the side wall's end, at roughly 10× the exposed area. No review log lists it as accepted.

**Why.** DIRECTION §3: "Walls and floors extend well past the frame so camera moves never find an edge". Round 2 treated the same kind of exposure as defects and fixed them (D20, N03, N11). It is minor because the card and chips cover part of the strip and attention is on the characters at left. It is most visible at 1120–1132.

**Lead call (R3-L1).** For v1, accept it as a known dollhouse end and record it in `qa/scene_review/S1/REPORT.md` next to the CAM_ROOM left end. Fix it only if a polish render is made for N17 and N18.

**Fix (if fixing)** — shared `components/v02/RoomSet.tsx` plus `scenes/S1_ColdOpen.tsx`:
1. Add a RoomSet opt-in (default 0, which must stay pixel-identical) that carries the right side wall's face, its skirting and the floor further toward the camera, so the near cut end leaves the frame. Do **not** use `extendRight`: it drops the side wall and door, which are in frame from S1.1.
2. Turn it on in S1's RoomShot from frame 0. At CAM_ROOM the side wall already reaches the frame edge, so nothing changes there.
3. Add a module-load assert that no RoomSet cut end projects inside the frame for any g in [RISE0, PAN_END].
4. Spot-check that S3 and S9 are pixel-identical, then re-render 600–1200 and count paper pixels (expect ~0 at x ≥ 1540).

Note: the pass's fallback, holding CARD_OUT until PAN0, conflicts with a deliberate rule. `S1_ColdOpen.tsx:434` and the assert at `:1704` require the card to be gone before the pan moves the room under it. Do not use that fallback.

**Evidence.** `$R3/s123/g_880.png`, `g_right.png`, `g_1100.png`, `g_s11.png`, `paper_new2.txt`, `paper_old2.txt`; `$R3/verify_s1right/`.

### N17 — S7 s38: his elbow folds inward across his chest as the hand returns to the hip (residual of N10)
**Scene** S7 s38 (storyboard S6.9) · **Frames** 9513–9518 (worst 9514–9516); the arm hangs straight from 9520 · **Severity** minor · **Source** S4/S6/S7 pass; confirmed by skeptic · **Side effect of the N10 fix** (the builder's sheet `qa/fix2/S7/N10_hand_return_fullres.jpg` shows it too)

**What.** Frame by frame:
- 9512: the hand is on the board's edge, and the elbow hangs at the torso's left edge.
- 9513: the hand moves right to about the shoulder's x, still at chest height. The forearm now lies across the striped shirt.
- 9514–9516: the white upper arm runs diagonally from the shoulder across the chest. The elbow sits at x≈1615–1640, about 100–125 px inside the shirt's left edge (x≈1515). The forearm points back out to the hand (x≈1480–1500). It reads as a contorted chicken-wing fold, or a forearm flicked across his chest.
- 9517–9518: the elbow is still 80–100 px inside.
- 9519: the arm is nearly straight.

The hand path itself is fine. It stays right of the board edge and clear of the pole, with no jumps.

**Why.** Characters move like jointed puppets (SCENE_BRIEF). It is visible as a flick at normal speed, right after the turn, in the same beat as the original N10 defect. It is minor because it lasts ~0.2 s, comes at the end of a gag beat and touches no props.

**Cause.** `scenes/S7_Results.tsx`:
- Constants at lines 298–302.
- Leg 1 at lines 1031–1038 solves `reach2(place, pose, -1, hx, hy, 1)` with the same bend side as the edge grip.
- `hx` moves HIP_OUT = 35 px right in HIP_X = 3 frames, while `hy` drops on a slow 0.3 ramp, so the target sits near the shoulder's x at chest height. The IK puts the elbow inside the torso.
- No assert checks the elbow; they cover only the hand (edge, step size, the HIP_MID jump, board and pole).

**Fix** — `scenes/S7_Results.tsx`, guesserAt leg 1 (HIP0..HIP_MID):
1. Let the drop lead. Move the hand right only to the minimum clearance (edge + mitt + 6 px), and give `hy` an E.out ramp from HIP0, so the shoulder-to-hand direction keeps pointing down and out.
2. If the elbow still crosses, solve leg 1 with the opposite `reach2` bend side. First check that the elbow clears the board's lower-right corner by ≥ 6 px.
3. Add a module-load assert for HIP0..HIP1: the IK elbow stays at or left of the torso's left edge (shoulder x + ~10 px).
4. Re-render 9505–9530 and check every frame. Keep the existing hand asserts. Confirm that card_flick (9509) and everything from 9530 are unchanged.

**Evidence.** `$R3/s7n09/fold_9512_9518.png`, `fold_odd.png`, `hand_9510_9525.jpg`, `old_hand_9496_9519.jpg`; `$R3/s7verify/zgrid.png` (9511–9519, native-res crops), `$R3/s7verify/grid.png` (9508–9522); `qa/fix2/S7/N10_hand_return_fullres.jpg`.

### N18 — S9 J4: her planted shoe skates during the closing step of her stroll
**Scene** S9 (S8.3 J4) · **Frames** 11675–11680 (closing step); smaller at 11653–11656 (first step) · **Severity** minor · **Source** S9 pass; confirmed by skeptic · **Not a regression** (REVIEW2 has the same skate, 843→831 over 11675–11678)

**What.** Tracked by shoe colour (59,41,34).
- **Closing step.** The front shoe lands at 11674 (bbox x 808–881, y 924–951) and its y stays fixed from then on, so it is planted. Its x still moves: 806–879 (11676), 802–875 (11677), 798–871 (11678) and 796–869 (11680). That is a 12 px slide over 6 frames, while the other foot swings in. The shoe stays 73 px wide, so it is not turning; it slides as one rigid shape. The trouser hem directly above it (navy at y 915) stays at x 809/810–856/857 from 11674 to 11680. So the shoe slips under a still leg.
- **First step.** The trailing shoe's right edge moves 717 → 719 → 725 → 727 over 11653–11656. It is mostly hidden behind the swinging foot.

**Why.** SCENE_BRIEF line 51: "Feet do not slide." It also fails the "with planted feet" part of the D41 check. It is minor: ~12 px at 1080p (~5 px on a phone) for ~0.2 s, while the other foot is moving.

**Cause.**
- `components/v02/Cast2.tsx:769` draws the shoe at `cx = side*(1-|turn|) + turn*8` from the ankle.
- `components/v02/S9_Room.tsx` walkAt (lines 277–278) eases `turn` from the profile value back to frontTurn over the last half-step (`pRamp`).
- So the planted shoe's footprint moves along the floor instead of pivoting.

**Fix** — `components/v02/S9_Room.tsx` walkAt, profile walks only:
1. Hold `turn` constant on a planted foot, and ease the profile turn only on the swinging foot or while the body is unweighted (for example, move the out-ramp into the closing foot's swing). Alternatively, offset the foot's x by the shoe-centre shift that the turn produces, so the drawn shoe stays on its footprint.
2. Keep the default for every other walk, so other scenes stay pixel-identical.
3. Re-track 11650–11690: a planted shoe moves ≤ 1 px, the footfalls stay at 11656/11664/11674/11682, and LEAN0, BUSTED and CARD0 are unchanged.

**Evidence.** `$R3/s9/feet_close.png`, `walk_grid.png`; `$R3/verify_skate/close_strip.png`, `first_strip.png`.

### N19 — S1: the round-3 changed-range list left out 1021–1111 (doc only; frames checked clean)
**Scene** S1 (S1.5–S1.6) · **Frames** 1021–1111 (light-up 1059–1071) · **Severity** minor (review coverage and docs; nothing in the video needs fixing) · **Source** stability pass; confirmed by skeptic

**What.** Every frame in the gap differs from REVIEW2 in the W3 marker region (x ~482–564, y ~358–418; max 154–158, 650–1060 px over 40 levels except during the pulse). The cause is D02's quiet marker: a grey half-opacity outline diamond replaces the saffron-filled diamond and glow ellipse, and the glow mask changed. The plan (REVIEW_R2 §3.2) applies the quiet marker whenever no pulse is at W3, so this change was always going to run through the gap. Even so, the §3.4 range list ("S1: 795–1020, 1112–1830") leaves it out.

**Checked in this round.** Every frame from 1014 to 1030 and from 1050 to 1080 was compared with REVIEW2. Light-up:
- The glow and the ink diamond fade in over 1059–1061.
- The diamond stays lit while the pulse is at the wall, 1061–1066.
- It fades back to the outline over 1067–1071.

There is no one-frame pop, no flash and nothing misplaced. Outside the marker region the differences are encode noise. **The gap is clean.**

**Fix.** Doc only. The S1 changed range is 795–1830, continuous (corrected in §4 of this file). Add the same correction and a "checked clean in R3" note to REVIEW_R2 §3.4.

**Evidence.** `$R3/stability/crop_s1.png`, `$R3/gapS1/strip_UPLOAD.png`, `strip_REVIEW2.png`; `$R3/verify_gapS1/compare.png`, `lightup_strip.png`.

### N20 — S7 s38: the round-3 changed-range list left out 9561–9821 (doc only; frames checked clean)
**Scene** S7 s38 (after the board turn) · **Frames** 9561–9821 · **Severity** minor (review coverage and docs; nothing in the video needs fixing) · **Source** stability pass; confirmed by skeptic

**What.** N09's changes carry through the whole post-turn hold, but the declared S7 range stops at 9560. Three things differ from REVIEW2:
1. **The strip tab**, on every frame from 9561 to 9821 (max diff 245–250). It sits at x ~1275–1303, y 525–579 until ~9670, moves with the 9672–9690 camera move, then holds at x ~1329–1363, y 411–468.
2. **The second arrival pulse** (~9563–9574). It now sits on the tab, at the board's mid left edge. In REVIEW2 it was at the board's top-left corner. The first pulse (9538–9548) is inside the declared range and already sits on the tab.
3. **The bolder plan-inset strip**, at x ~349–414, y ~267–299, until ~9586.

**Checked in this round.** Every frame from 9540 to 9830 was compared with REVIEW2:
- The tab is steady and never flickers.
- It stays in the same place on the board and ~20 px clear of the partition during and after the move (9670–9690), next to the "flat wall" chip (9714/9716), at 9750 and at 9821.
- The repeat pulse's placement on the tab matches the D35 physics (strip toward the wall).

**The gap is clean.**

**Fix.** Doc only. The S7 changed range is 9460–10000, continuous (corrected in §4). Add the same correction and a "checked clean in R3" note to REVIEW_R2 §3.4.

**Evidence.** `$R3/stability/crop_s7.png`, `s7_board_strip.png`, `side_09590.png`, `side_09750.png`; `$R3/gapS7/sparkle_strip.png`; `$R3/refute_s7gap/sparkle_cmp.png`, `full_up.png`, `move_up.png`.

---

## 4. Corrected changed-range list (fix round 2 vs REVIEW2)

| Scene | Declared (REVIEW_R2 §3.4) | Actual | Covered in R3 |
|---|---|---|---|
| S1 | 795–1020, 1112–1830 | **795–1830** | yes (N19 covers 1021–1111) |
| S2 | 2755–2785 | 2755–2785 (diffs 2764–2775) | yes |
| S3 | 3190–3400 | 3190–3400 (diffs 3194–3393) | yes |
| S4 | 4420–4510, 5600–5692 | same (diffs 4426–4499, 5615–5657) | yes |
| S6 | 8640–8798 | same (diffs from 8668, through the wipe) | yes |
| S7 | 9460–9560, 9822–10000 | **9460–10000** | yes (N20 covers 9561–9821) |
| S9 | 11280–11760 | same (diffs 11301–11405, 11648–11707, 11717–11744) | yes |

Everything outside these ranges matches REVIEW2 within codec noise (§2.1).

## 5. Noted, not logged

- **N01:** faint 5–13 px leader specks between the fan rays (e.g. ~(580,478), 957–972). They are barely visible.
- **N07:** the drop (5615–5622) overlaps the "rough shape" pill pop (5617–5621). The fix plan expected and accepted this.
- **N12:** the card's soft shadow reaches x 1832 and its tape top y 54. This is the same cosmetic margin overrun D44 accepted.
- **N13:** a white wedge appears where the sleeve overlaps the forearm on the sharply bent arm (11725–11738). That is the rig's normal look, and REVIEW2's raised frames show it too.
- **S9 R4:** frame 11627 has a 1 px idle-breathing shift on both characters. It only matters if a keyframe tool reads R4.to as inclusive. It is the same in REVIEW2.
- **S3.1:** a ~17k px paper triangle at the top right (f3000, f3150), above the side wall's diagonal top cap. It belongs to the cut-away style; no vertical cut end or bare floor shows (see N16).

---

## Appendix A — Refuted new reports

None. All five new reports were confirmed. The skeptics corrected three details, and the lead added one note; all four are reflected above:
1. **N16:** the report said S3.1 shows no paper. It shows a ~17k px triangle above the side wall's top cap, but not the wall's cut end. The conclusion stands.
2. **N17:** the elbow is ~100–125 px inside the torso, not ~130 px.
3. **N20:** the report said the visible payoff starts 4 frames after the range. That overstates it: the first arrival pulse (9538–9548) is inside the declared range. The missed part is the repeat pulse (~9563–9574) and ~260 frames of the tab.
4. **N16 fallback fix** (lead note): "hold CARD_OUT until PAN0" conflicts with `S1_ColdOpen.tsx:434` and the assert at `:1704`, so it was dropped from the fix.

## Appendix B — Merge map (pass reports → IDs)

| Pass | Report | ID |
|---|---|---|
| S1–S3 | D02, N01–N05 checks | §1 (all fixed) |
| S1–S3 | Bare paper beyond the room's right cut end in S1.4–S1.5 | N16 |
| S4/S6/S7 | D22, N06–N09, N11 checks | §1 (all fixed) |
| S4/S6/S7 | N10 check | §1 (partly) |
| S4/S6/S7 | Elbow folds across his chest on the hand's return | N17 (N10 residual) |
| S9 | D41, N12, N13 checks | §1 (all fixed) |
| S9 | Planted shoe skates in her stroll | N18 |
| Stability | S1 1021–1111 changed outside the declared ranges | N19 |
| Stability | S7 9561–9821 changed outside the declared ranges | N20 |
| Stability | Stability scan (60 full-res, 12120 half-res), S2→S3 cut, rope at 10151 | §2.1 (pass with corrected ranges) |
| Stability | Audio spec and stability | §2.2 (pass) |
| Lead | N14, N15 spot check | §1 (N14 fixed; N15 partly) |

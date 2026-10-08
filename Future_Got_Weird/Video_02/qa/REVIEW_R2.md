# Video 02 "How Cameras See Around Corners": review round 2

- **Render reviewed:** `exports/Future_Got_Weird_Video_02_v1_REVIEW2_1080p.mp4` (6:44, 1920x1080, 30 fps, 12120 frames). Compared against the round-1 render `exports/Future_Got_Weird_Video_02_v1_REVIEW_1080p.mp4` where useful.
- **Date:** 2026-10-08
- **Round-1 log:** `qa/DEFECT_LOG.md` (45 defects). The fix round (commit 74b8f5e) claims 43 fixed, with D13 and D31 completed at the merge.
- **Inputs:** six passes: S1–S2, S3–S4, S5–S7, S8–S9, accuracy/package, and viewer (sound off, phone size). A skeptic re-checked every new report against exact frames and source. Reports describing the same problem are merged here. One new report was refuted (Appendix A). Where passes disagreed, the lead looked at the frames and made the call; the disagreement is noted.
- **Timing:** narration is unchanged up to s39. From s39 (9796) on, frames were re-derived from `source/src/data/timeline.json`: the card cut is on "test," at 9822, S8 moved +5 frames, S9 +5 up to s47, s47 +6 and s48 +30. Scene ranges: S1 0–1826, S2 1826–2874, S3 2874–3954, S4 3954–5692, S5 5692–7104, S6 7104–8798, S7 8798–10152, S8 10152–11178, S9 11178–12120.
- **Frames:** 0-based render frames, as `select=eq(n,…)` returns them.
- **Evidence:** `$R2` = `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/review_r2`. This is session scratch; copy anything you need to keep. Dense sheets: `qa/review_r2/dense/`.
- **Severity:** blocker (wrong fact, physics contradiction, broken shot, privacy), major (visible flaw a viewer would notice or that weakens the explanation), minor (polish).

## Summary

| | Count |
|---|---|
| Round-1 defects fixed | 42 |
| Round-1 defects partly fixed | 3 (D02, D22, D41) |
| Round-1 defects not fixed | 0 |
| Round-1 defects regressed | 0 |
| New defects (all minor; 0 blocker, 0 major) | 15 (N01–N15) |
| **Open items** | **18** |

No blockers or majors remain. Every open item is minor polish. Nine of the 15 new defects are side effects of round-1 fixes (N01, N02, N04, N06, N07, N09, N10, N11, N13). Two make a fix inconsistent with the rest of the film (N03, N05). Four were missed in round 1 or are in the package and docs (N08, N12, N14, N15).

The privacy check is clean: description, SRT, chapters, titles, thumbnail metadata and MP4 tags carry nothing that identifies the owner. On-screen facts check against claims.csv, EXPERIMENT_RECORD and layout.json (accuracy pass).

**Open items**

| ID | Sev | Scene | Title |
|---|---|---|---|
| D02 | minor (residual) | S1.4–S1.7 | Wall-spot diamond still sits at her pencil tip; reads as her pencil sparkling at phone size |
| D22 | minor (residual) | S4.2 | "1.33 m each way" is back by him for only ~10 frames while riding the ruler (work is in N06) |
| D41 | minor (residual) | S9.3 | Her stroll's closing half-step lands 5 frames after the third footfall (log asks ≥ 7) |
| N01 | minor | S1.4–S1.5 | "gap" pill pops with the wall-spot diamond, and its floor leader runs through the glow rim, the W→H leg and the fan |
| N02 | minor | S1.6 | Longer pan peaks at ~53–56 px/frame (round 1 ~47); code comment claims ~37 |
| N03 | minor | S1.6–S1.7 | Room's open left end (bare paper, slab edge) shows for ~23 s; S3.2 at the same framing now shows wall and floor |
| N04 | minor | S2.4 | Slots card appears full-size and opaque in one frame (2764), then drifts 39 px |
| N05 | minor | S3.2 | 9:1 block card has no "not to scale" note, unlike the S3.1 tally beside it |
| N06 | minor | S4.2 | "1.33 m" label blinks in on the fast sweep while the delay chain shrink-pops out (4446–4458) |
| N07 | minor | S4.7 | Photo frame slides off with an ease-in and stops dead at ~56 px/frame (5650→5651) |
| N08 | minor | S6.6 | "keep the sensor still" panel shows the sensor held in her hand |
| N09 | minor | S7 s38 | Target board's 180° turn happens in ~3–4 frames; the reflective strip vanishes in a blink |
| N10 | minor | S7 s38 | After the turn, his hand returns to the hip through the board face and the stand pole (9502–9506) |
| N11 | minor | S7 s39 | "Authors' separate test" card shows the room's open right end and a bare paper strip |
| N12 | minor | S9.2 | Recap route shown only in a ~430 px card (smaller than S1's 704 px) |
| N13 | minor | S9 J4 | His paw wave snaps up and down through a handless frame each way (11718, 11738) |
| N14 | minor | package | Description says "Code and released data (MIT License)"; the data licence is ambiguous |
| N15 | minor | docs | README points to a missing STATUS.md and omits make_deliverables.sh; STORYBOARD S6.10 has the old s39 wording |

---

## 1. Round-1 defects: status in round 2

| ID | R1 sev | Scene | R2 status | Note and evidence |
|---|---|---|---|---|
| D01 | major | S1.2 | fixed | A dashed frustum grows out of the sensor on "pointed" (f215→~229). Ghost sections at u 0.35/0.7 and four corner rays stay until the board covers them at 289, drawn behind her and the partition. The still frustum is faint at phone size; the 14-frame growth carries it. `$R2/s1s2/D01_strip.png`, `D01_cmp.png` |
| D02 | major | S1.4–S1.5 | **partly** | **Passes disagree:** the S1–S2 pass says fixed, the viewer pass says partly. **Lead call: partly.** I compared n960/o960 and n1300, n1760 at 0.4 scale. Fixed: the CAM_PATH_S1 reframe (room ~220 px left, his reactions clear); a 704×573 in-margin card with 1.5x strokes; "gap" leader to an outlined floor patch; glow masked and fans clipped off her (L15 route — the r1 fan ray that hit her shoulder is gone). Open: step 4's 40 px target was not met (the asserts allow 27 px from her head and 36.8 px from her pencil tip). The pencil also still points straight at the diamond: ~75 px away at f960 and ~66 px at f1760, with the glow rim ~30 px away. At phone size, S1.4–S1.7 still read as her pencil sparkling. The fix also caused N01 and N02. Residual is minor: the route now reads in the card. `$R2/lead/cmp960.png`, `$R2/lead/z960.png`, `$R2/lead/oz960.png`, `$R2/lead/z1760.png`, `$R2/lead/phone_s1.png`, `$R2/viewer/pencil2.png` |
| D03 | major | S2.4→S3 | fixed | One-room match cut at HANDOFF_S2S3, tilt 0. 2873→2874 differs by 594 px of idle motion (mean 0.04/255). The carried card holds, then slides out left 2878–~2894 during one smooth push (diff ramps to 29.5 and back, no steps). No takeover, and both sides use the extended set. Confirmed by two passes. `$R2/s1s2/D03_cut.png`, `$R2/s34/g_s3open.png`, `$R2/s34/d03_s3open_diffs.txt` |
| D04 | major | S3.2 | fixed | The arrivals card moves on every frame 3193–~3207. Largest step is ~205 px (r1: 743), and paper_slide is now at 3191, on the start of the move. `$R2/s34/g_arr.png`, `d04_card_diffs.txt` |
| D05 | major | S3.3 | fixed | Axes are in by 3414. The pen draws the baseline, and the spike rises 3427–3432 on "data", so the plot is never empty under the headline. Longest still run before the magnifier is 0.93 s. Confirmed by two passes. `$R2/s34/g_d05.png`, `$R2/viewer/s33/seq.png` |
| D06 | major | S4.6 | fixed | The ✗ is at full opacity 5338–5354 (~17 frames). The row is empty only ~3 frames before candidate 2. indicator_no is at 5337. `$R2/s34/g_d06.png` |
| D07 | major | S5.2–S5.3 | fixed | 36 px ink-bordered "reflective exit sign: ≈ 1 s to rebuild" chip (6450–6581). Clock world label counts with the hand and settles on "≈ 7 min to measure" on "seven" (6526), ~1.6 s settled. The 2021 card now sits above its readout. `$R2/d07/f6545.png`, `strip_top.png` |
| D08 | major | S6.6 | fixed | Three cued steps (8720/8735/8749) with breadcrumbs and ghost outlines; the cloud recomputes each time, then holds ~1.1 s. Travel was measured at 145 px (hair centroid, viewer) and ~220 px (token, S5–S7 pass); both passes call it fixed. `$R2/d08/grid.png`, `$R2/viewer/s66/right_seq.png` |
| D09 | major | S7 s39 | fixed | Hard cut on "test," (9822) to "the authors' separate test · our drawing". The card has a neutral grey "their sensor", no kit, no checker and no target board. The chip on "ordinary" reads "Reported by the authors: person in ordinary clothes · 30 frames/s capture" / "a separate test, not our kit clip · device data not released". There is an assert against the kit after S39_CUT. Confirmed by two passes. The card's framing caused N11; STORYBOARD drift is in N15. `$R2/d09/f09950.png`, `$R2/acc/f9950.png` |
| D10 | major | package | fixed | The description separates the sources: the kit clip (held still, our run, clothing/date/rate not stated); a separate bullet for the 30 frames/s ordinary-clothes result; the echo plot as raw counts. Generated by `tools/make_package.py`. `package/description.txt` |
| D11 | major | thumbnails | fixed | A and B redrawn. The wall→person leg passes behind the far panel's edge at mid-height (round the end, never over the top), and arrival is on his wall-side torso. thumb_C is still recommended. `thumbnails/thumb_A_1280.jpg`, `$R2/acc/thumb_A_320up.png` |
| D12 | minor | S1.1, S3, S4, S9 | fixed | Far partition ink top is at y≈55 in S1 (f0/150/620), S4 (3960/4000) and S9 (11200); r1 was 13. Shoes and the near partition foot stay in frame. S3 now opens on HANDOFF_S2S3. `$R2/s1s2/new/f0.png`, `$R2/s34/g_s4open.png`, `$R2/s9a/d12_compare.jpg` |
| D13 | minor | S1.3, S7 | fixed | The S1 board reads "authors' code, run by us", plus "what the person wore: not documented" and "frame numbers, not seconds". The S7 pill and the U-board chip carry the same wording. `$R2/acc/f600.png`, `$R2/acc/f9150.png` |
| D14 | minor | S1.3 | fixed | paper_slap onset is at 9.83 s (f295), on the board's peak extent; the old 10.00 s onset is gone (stem difference). `$R2/s1s2/new/f295.png` |
| D15 | minor | S1 | fixed | A saffron burst shows on the lens on the sensor_pulse frame (907–914), and the pulse leaves at 915. The race fire at 1162 matches. `$R2/s1s2/D15_strip.png` |
| D16 | minor | S1.4, S1.7, S3.1, S9 | fixed | All four PlanCard entries ramp over 8–10 frames with a visible slide (S1 663–670, 1691–1699; S3 2905–2914; S9 11300–11308). They are see-through for a few frames over a moving room, which is within the fix spec. `$R2/s1s2/D16_card.png`, `$R2/s34/g_card.png`, `$R2/s9a/card_in.jpg` |
| D17 | minor | S2.4 | fixed | Paths draw one at a time, each right after its own marker's throb (head 2618/2630, shoulder 2646/2654, feet 2676/2680). The reverse exit order was accepted in r1; the optional body tags were not added. `$R2/s1s2/D17_seq.png` |
| D18 | minor | S2.4, S1.7 | fixed | The inset slides out solid (2761–2765) and nothing double-exposes. The S1.7 ruler headline arrives with its card (1544–1545). The opaque entry now pops in: N04. `$R2/s1s2/D18_swap.png`, `D18_ruler.png` |
| D19 | minor | S3.1 | fixed | No numeral. The card reads "light still on the path", 24 dots greying to one, and "not to scale · far more is lost" (~30 px). The S3.2 block card is now inconsistent with it: N05. `$R2/s34/tally_cmp.png` |
| D20 | minor | S3.2 | fixed | Wall, skirting and floor run to the left frame edge from S3's first frame (EXT_ON = K.start, matching S2.4), so the extension never switches on mid-shot. S1.6–S1.7 at the same framing still show the open end: N03. `$R2/s34/g_d20.png` |
| D21 | minor | S3.3 | fixed | Y title is now 34 px (x-height 17, length ×1.06), clear of the tick labels. `$R2/s34/yaxis_cmp.png` |
| D22 | minor | S4.2 | **partly** | Core fixed: "1.33 m each way" is a length label beside the ruler from ~4337, never under the sensor, her token or the partition. The payoff by him is a blink: it is readable 4447–4455 while riding the fast sweep (18–40 px/frame), gone by 4458, and the tip is on him only ~3 frames. The fix asked for ~PASS_H+20. Work tracked in N06. `$R2/v_s19lbl/sheet_4443_4460.jpg`, `$R2/s34/g_lbl.png` |
| D23 | minor | S4.2 | fixed | The chain "extra delay here / ≈ 8.9 ns / ≈ 2.65 m / there and back" plus "1.33 m each way" are on screen together ~4337–4410. Figures check against layout.json (8.85 ns × 0.2998 = 2.653 m; ruler 635 px at 480 px/m). Confirmed by two passes. The chain's exit is part of N06. `$R2/acc/f4400.png`, `$R2/s34/g_s42a.png` |
| D24 | minor | S4.2 | fixed | relief_sigh at 4397 fills the narration gap, in sync with the inset's closing eyes. It sits 9.3 dB under "Just" at the onset, then 16–31 dB under. audio_qc no longer lists 146.5 s. `$R2/s34/audio_d24_d26.txt` |
| D25 | minor | S4.3 | fixed | The swing is 92.8°→182.9° over 15 frames (peak 10.4°/frame), then the sweep back over 28 frames. arc_draw is at 4675. `$R2/s34/d25_ruler4_angles.txt` |
| D26 | minor | S4.3 | fixed | uh_oh is at 4812 (160.40 s), after "place." ends; the masking entry is gone from audio_qc. `$R2/s34/audio_d24_d26.txt` |
| D27 | minor | S4, S6.5 | fixed | No ticks through or beside the chips at 4200/4600 (S4) or 8200/8300/8455 (S6.5). Ticks return once the chips go. `$R2/s34/chips_cmp.png`, `$R2/d27/grid.png` |
| D28 | minor | S4.7 (+S5) | fixed | Two-level region, a teal callout ring on "likely" (~5575), his token dimmed, and the photo frame moved below the labels before the X strikes. 5691/5692 match to 32 px. The slide's dead stop is N07. `$R2/s34/g_d28.png`, `$R2/s34/g_s4s5.png` |
| D29 | minor | S4.7 | fixed | "not a photograph" (44 px) is readable ~5654–5687 (~1.1 s). Nothing clears while the word is spoken. S4-only route, as decided in L10. `$R2/s34/g_out.png` |
| D30 | minor | S5→S6 | fixed | 7103→7104 is pixel-identical (1.5e-5 of pixels differ). An eased 24-frame move then carries the stool and card out to the plinth framing. `$R2/d30/grid_cut.png` |
| D31 | minor | S5→S6 | fixed | Mix floor at the turn is −41.7 dBFS (r1 −65.0); −30 dB at the cut as the pickup enters. amb_museum runs to K.end+18. Completed at the merge. `$R2/d31/new.raw` |
| D32 | minor | S6.1 | fixed | Hold, release (open hand drops behind the grip), exit right, then the rock after the hand has cleared. No fingers over the body after release. `$R2/d32/grid_hand.png` |
| D33 | minor | S6.3 | fixed | "10 × 10" is gone. The dot grid is a drawing, and "≈ 100 pixels" is the only number. Confirmed by two passes. `$R2/d33/grid.png`, `$R2/acc/f7930.png` |
| D34 | minor | S7.1 | fixed | S1's colour code is used: saffron wall points, ×4 tags, teal estimate, teal legend dot. The s38 "our clip" card matches. `$R2/d34/f9160.png` |
| D35 | minor | S7 s38 | fixed | Physics correct: strip pressed on (9472–9484), the board is turned to put the strip toward the wall, the plan bar rotates, and the arrival sparkle is at the wall-side corner. The turn and the hand's return are new defects N09 and N10. `$R2/d35/grid.png`, `grid_plan.png`, `grid_hit.png` |
| D36 | minor | S7 s38 | fixed | The "flat wall" chip fades in 9714–9716, after her last flick (9712); her hand stays ~300 px below. `$R2/d36/grid.png` |
| D37 | minor | S7 s39 | fixed | The museum uses S5/S6 parts (pools, blue wall, cream plinth, brass posts, red rope). Plaques read "code / public" and "independent / reproduction". `$R2/d37/cmp.png` |
| D38 | minor | S7 s39 | fixed | "code public · no independent reproduction found (Oct 2026)" pops on "other" (10064) and is readable ~2.8 s before the wipe. `$R2/d09/chip10100.png` |
| D39 | minor | S8 | fixed | "not who" is readable ~1.9 s and the "?" ~1.2 s. The board lands on "plenty" with paper_slap in sync, and the tiles are set before "short". `$R2/s8/notwho_new.jpg`, `board_in.jpg` |
| D40 | minor | S9.2 | fixed | "likely location" is held ~50 frames (44 px pill). Inset and ring leave on a calm fade 11524–11531. `$R2/s9a/label_in.jpg`, `inset_out.jpg` |
| D41 | minor | S9.3 | **partly** | Footfalls are at 11658/11666/11674/11679 (gaps 8, 8, 5; r1 6, 7, 4). The profile gait removed the X legs, and full steps match his walk. The closing half-step is still 5 frames, against the log's ≥ 7 (the code asserts ≥ 6 from walkContacts, which reads ~1 frame long). It reads brisk, not yet a deadpan stroll. `$R2/s9a/walk.jpg`, `legs_hi.jpg`, `$R2/s9a_old/legs_old.jpg` |
| D42 | minor | S9.3 | fixed | A coral dashed S1.1-style sight line grows from 11686 and reaches his head as his eyes open (11698). It is under both heads, crosses no face, is right of the near edge, and fades 11718–11721. `$R2/s9a/line.jpg`, `full11700.png` |
| D43 | minor | S9.3 | fixed | Grin, paw wave, settle and her blink; 55 frames (1.8 s) from the take to the wipe, and s48 starts 47 frames after the take. The wave's broken in-betweens are N13. `$R2/s9a/d43_timeline.jpg` |
| D44 | minor | S1, S3, S9 | fixed | Cards and readouts are inside the 1824/54 margin to ~1 px (S1 1822–1825, S3 1390–1825, S9 1390–1824, bezel top 54). One cosmetic leftover is not tracked: the S9 card's decorative tape top is at y≈40, with no border or text crossing. `$R2/s9a/card_full_11340.png`, `$R2/s34/n3070_card.png` |
| D45 | minor | package | fixed | `package/Future_Got_Weird_Video_02_v1.srt` is byte-identical to `script/subtitles_v2.srt`: 147 cues, word stream equal to the timeline, last cue at 399.19 s of 404.01 s. The checklist's MASTER_4K/UPLOAD_1080p/PREVIEW_720p are what `tools/make_deliverables.sh` renders. README drift is in N15. `package/UPLOAD_PACKAGE.md` |

---

## 2. New defects (confirmed, deduplicated)

All 15 are **minor**. Each fix is the verifier's refined fix, merged where two reports were merged, with corrections noted. Paths are relative to `Video_02/source/src/` unless they start with `Video_02/`.

### N01 — S1.4–S1.5: the "gap" pill pops with the wall-spot diamond, and its floor leader runs through the light
**Scene** S1 (S1.4–S1.5) · **Frames** 801–~1018 (full 804–1014); clearest 880, 907, 955–990 · **Severity** minor · **Merged from** S1–S2 pass and viewer pass (side effect of the D02 fix)

**What.**
- The diamond and glow pop at f800, and the pill pops at f801 directly above them: pill x 474–575, y 207–263; diamond centre (520,388).
- The D02 fix moved the leader's end to the floor. It is now a ~4 px inkMuted line from (562,265) to the floor dot at (575,817), drawn in the backdrop under the light.
- On the way down it passes 3–6 px from the glow's dashed rim (rim x 554–559, leader x 563–567 at y 376–400). It crosses the dashed W→H leg at about (565,406). From ~f955 to ~990 it also crosses the S1.5 scatter fan, a fan tip dot at (563,502), the pulse ball and the W→H trail.
- At phone size the pill reads as the label of the bright spot, and the leader reads as another ray or a wire.

**Why.** "gap" is the one word that tells a muted viewer where the light gets past. If it names the wall spot, it teaches the wrong place. PATH_LEGIBILITY_PLAN §7.1 names the short visible W→H "slot crossing" as one of three supports for "around the end", and a grey line now cuts it. The module asserts (S1_ColdOpen.tsx ~1571–1580) check the leader only against her head, the partition (4 world px), the tripod and the slot end.

**Fix** — `scenes/S1_ColdOpen.tsx` (GAP_LABEL ~520–543, leader draw ~850–856, asserts ~1559–1580). Lead call between the two verified fixes: keep the pill on the wall, stagger it, reroute the leader off the glow, and let the light pass **over** a knocked-out leader. Do not draw the leader on top of the slot crossing, and do not relocate the pill: the reviewers' spots are on the partition, on her legs or in the caption band.
1. **Stagger.** Set `GAP_LABEL0 = Math.round(SPOT0) + 10`, or better, the first frame the route head is hidden behind the partition's far end. Set `BLOCKED_OUT = Math.round(SPOT0) - 8`. Add `if (GAP_LABEL0 - Math.round(SPOT0) < 8) fail(...)`. Keep the fade at VF[2]+8.
2. **Lead the eye down.** Draw the leader from the pill to the floor over 10 frames (`pathLength={1}`, dasharray 1, dashoffset `1 - tw(g, GAP_LABEL0, 10, E.out)`). Pop the end dot (r 6) at 0.9. When it lands, pulse the GapMarker outline once over ~12 frames (stroke 3→5→3, ink and white only).
3. **Reroute.** Leave from the pill's right edge, elbow to x≈586, then run straight to GAP_PT (≈575,817). Convert with `camToWorld(CAM_PATH_S1, …)`. At the diamond's height it is then ≥ 20 px from the glow rim, ≥ 40 px from the diamond and ≥ 12 px from the partition's far-edge ink (x≈599).
4. **Knock out under the light.** Break the leader for ±16 px around its crossing with the visible W→H leg (computed with `visibleIntervals`/`roomHides`). On frames VF[1]−4 … VF[1]+34, also break it where any visible fan ray or tip dot (fanRays(WP, dirsW, 0.62, 5)) comes within 16 px plus the dot radius. Keep the top stub ≥ 40 px and the lower segment ending inside the slot.
5. **Asserts** in S1_MARGINS, for every frame in [GAP_LABEL0, VF[2]+22], over the drawn segments:
   - ≥ 20 px from `wallGlowRect(s, 1.1)`;
   - ≥ 40 px from the diamond;
   - ≥ 12 screen px from the partition (`nearPartition` with d = 12/zoom);
   - ≥ 16 px from the visible W→H leg and the visible fans;
   - top stub ≥ 40 px; end inside the slot; the existing head and tripod checks.
6. Update the header comment (~83) and the GAP_LABEL comment.

**Check.** Re-render 795–1020. At 480 px width the pill must not pop with the diamond and the leader must be followable to the floor patch. f907/962/985 must show no leader pixels where the light crosses it.

**Evidence.** `$R2/vgap/z907.png`, `$R2/vgap/z962.png`, `$R2/vgap/phone_cmp.png`, `$R2/verify_gap/annot_f880.png`, `$R2/verify_gap/popgrid.png`, `$R2/verify_gap/fan.png`, `$R2/s1s2/NEW_gap_leader_crossing.png`.

### N02 — S1.6: the longer pan peaks at ~53–56 px/frame
**Scene** S1 (S1.6 pan) · **Frames** 1122–1159 (peak 1137–1142) · **Severity** minor · **Source** S1–S2 pass (side effect of the D02 reframe; the viewer pass saw the same)

**What.**
- The pan now starts at CAM_PATH_S1, so it covers ~760–775 screen px in 38 frames (round 1: ~550–565 px in 32).
- Phase correlation gives a peak of 50–56 px/frame on 1139–1140; round 1 peaked at ~47.
- Cause: PAN_DUR 40 with E.inOut (bezier .65,0,.35,1), whose peak is 2.86x the average speed.
- The comment at S1_ColdOpen.tsx:404–407 says the peak "stays near the old pan's (~37 screen px a frame)". That is wrong.
- Correction: the 1.25→1.15 zoom is not new; round 1 had it too.

**Why.** Characters, partition and plant double by ~50 px a frame and strobe on large screens. It is still eased and reads as brisk, not a whip, so minor.

**Fix** — `scenes/S1_ColdOpen.tsx`. Ease, not retime, so no race cue moves.
1. `import {AbsoluteFill, Easing} from 'remotion'`.
2. `const PAN_EASE = Easing.bezier(0.5, 0, 0.5, 1)` next to PAN_END (~408). Its peak is 2.0x the average; S4 uses the same pattern (SOFT_EASE).
3. In roomCam (~756), use `{at: PAN0, dur: PAN_DUR, to: CAM_PATH_SIDE, ease: PAN_EASE}`. Leave PAN_END, PAN0, RACE0 (1162) and all cues unchanged.
4. Correct the comment. Optionally add a load-time guard: per-frame |dx| ≤ 44 px from PAN0 to PAN_END.
5. Expected peak is ~38–39 px/frame (modelled).

Do **not** use the reviewer's `PAN_END = K.s06 + 40`. It only returns to ~45–47 px/frame and moves RACE0 and its cues. Fallback if E.inOut must stay: `K.s06 + 44`, and re-check RACE0, block_drop, RACE_CHIP_IN and the CAMI0 assert.

**Evidence.** `$R2/verify_pan/blend_1139_1140.png`, `$R2/verify_pan/new/`, `$R2/verify_pan/old/`, `$R2/s1s2/S16_pan.png`.

### N03 — S1.6–S1.7: the room's open left end shows for ~23 s; S3.2 at the same framing now shows wall and floor
**Scene** S1 (S1.6–S1.7) vs S2.4/S3 · **Frames** enters ~1133, full from ~1138 to the cut at 1825 · **Severity** minor · **Source** S1–S2 pass (inconsistency created by the D03/D20 fixes)

**What.**
- At CAM_PATH_SIDE the back wall ends as an ink line at x≈555, with bare paper left of it. The slab's cut brown edge runs from about (575,800) to (740,1080) behind the cards.
- S3.2 (f3300) uses the identical framing and now draws the room with `extendLeft` (HANDOFF_S2S3_EXTEND = 3.2 m): continuous wall and floor.
- Correction: the CAM_ROOM wide shots (S1.1, the S4 and S9 openings) deliberately keep the dollhouse end at x≈75, so they must not change.

**Why.** It breaks DIRECTION §3 ("Walls and floors extend well past the frame so camera moves never find an edge"). The S1.6 pan finds that edge, and the same room has an end in S1 and none 50 s later.

**Fix** — `scenes/S1_ColdOpen.tsx` (+ a small shared helper).
1. Import HANDOFF_S2S3_EXTEND. Set `const EXT_M = HANDOFF_S2S3_EXTEND; const EXT_ON = PAN0;` (any frame in [RISE_END, PAN0] works; the scan shows no bare paper at x=0 through ~1132).
2. In RoomShot (~999): `<RoomSet … extendLeft={g >= EXT_ON ? EXT_M : 0}>`. Do **not** turn it on at CUT: CAM_ROOM frames must keep the dollhouse end, and RoomSet.tsx:73 requires the end to be out of frame when it switches on.
3. Move `setSliceMaxX` from S3_Echo.tsx (~689) to a shared module (e.g. `lib/room.ts`) and use it in S1 and S3.
4. Asserts:
   - no paper at EXT_ON−1 and EXT_ON;
   - the extended end stays out of frame for every g ≥ EXT_ON;
   - `EXT_M === HANDOFF_S2S3_EXTEND`.
5. Delete the "pan shows outside the room" limitation from `Video_02/qa/scene_review/S1/REPORT.md` (~32, ~126).

**Check.** f1133/1140/1162/1300/1450/1544/1700/1760/1825 must match f3300's wall and floor. The S1.6 ToF label must stay legible.

**Evidence.** `$R2/v_s1end/cmp.png`, `$R2/v_s1end/grid.png`, `$R2/v_s1end/cmp2.png`, `$R2/lead/phone_s1.png`.

### N04 — S2.4: the slots card appears whole and opaque in one frame
**Scene** S2 (S2.4) · **Frames** 2763→2764 (then 2764–2771) · **Severity** minor · **Source** S1–S2 pass (side effect of the D18 fix)

**What.**
- At 2763 there is no card. At 2764 the whole 700×372 card is opaque at x 51, then drifts 15, 10, 6, 4, 2, 1, 1 px to x 90.
- Cause: `barsOpAt` is a 0/1 step and BARS_SLIDE is 60 with E.out over 12 (S2_Mirror.tsx ~1233–1240).
- Correction: at 2764 the slide is 35 % done, not 65 %.

**Why.** A large card that appears in one frame is a pop (SCENE_BRIEF: "nothing pops"), on the act's takeaway card.

**Fix** — `scenes/S2_Mirror.tsx` (~1227–1255, ~1421–1423). Keep the card opaque and bring it in from off frame.
1. `const BARS_SLIDE = BARS.x1 + 20;` (812). `const BARS_DUR = 14;`. `barsInAt = tw(g, BARS_IN, BARS_DUR, E.out)`. Expected x0: −477, −286, −149, −58, 0, 38, 61, 75, 83, 88, 90, 92…
2. Assert loop upper bound → `BARS_IN + BARS_DUR`. Keep both see-through throws. Add throws:
   - the card is off frame at barsIn 0;
   - the first visible frame shows ≤ 400 px of it;
   - `DROP0 ≥ BARS_IN + BARS_DUR − 2`.
3. Do **not** use the "E.linear / E.inOut over 60 px" alternative: the whole card still appears in one frame.
4. Optional: `INSET_OUT = max(BITS + 16, BARS_IN - 8)` if the crossing looks busy (the two cards' y bands do not overlap).

**Check.** Re-render 2755–2785. S2's last frame and S3's first frame must be unchanged, since the settled place is the same.

**Evidence.** `$R2/verify_cardpop/crop_strip.png`, `$R2/verify_cardpop/strip.png`, `$R2/s1s2/NEW_timing_card_pop.png`.

### N05 — S3.2: the 9:1 block card has no "not to scale" note
**Scene** S3 (S3.2, s14) · **Frames** ~3191–3395 (settled 3370) · **Severity** minor · **Source** accuracy pass (reopens an accepted limitation)

**What.**
- The arrivals card stacks 9 teal blocks for "1 bounce · wall" against 1 saffron block for "3 bounces · him". The only qualifier is the 30 px "illustrative" pill.
- This card is unchanged since round 1. D19 and the S3 REPORT listed the 9:1 stack as director-accepted, and D19's optional step 5 (a "not to scale" pill) was not applied.
- What is new in round 2: the S3.1 tally beside it now says "not to scale · far more is lost".
- Correction: the real-data board replaces the card at ~3395. "hundreds of times weaker" is spoken ~12.8 s after the card settles. C12 is 256–576×, not "about 576×".

**Why.** Countable blocks invite "his echo is about a tenth of the wall's", the reading D19 removed from S3.1. Every word on screen is true, so minor.

**Fix** — `components/v02/S3_BlockCard.tsx` only (S3_Echo.tsx, WALL_N, DROPS and SFX unchanged).
- Directly after the "illustrative" pill (~126–129), add a static 30 px line, part of the card with no entrance of its own:
  `<div style={{position:'absolute', right:30, top:86, fontFamily:F.body, fontWeight:700, fontSize:30, color:C.inkSoft, lineHeight:1, whiteSpace:'nowrap'}}>not to scale · far weaker</div>`
- It lands at screen ~583–878 × 142–172, clear of the pill, the title (ends at card-local x≈415) and the stack top (card-local y≈259).
- Do not merge the words into the pill: at ~390 px it would hit the title. Do not use the break-mark stack, which would re-time the drops and cues.
- Log it as lead decision R2-L2 (closes D19 step 5).

**Check.** f3200/3300/3370/3390: the line is ≥ 20 px from the pill, the title and "1 bounce".

**Evidence.** `$R2/v_s3card/f3370.png`, `$R2/v_s3card/r1_vs_r2_card.png`, `$R2/v_s3card/grid.png`.

### N06 — S4.2: "1.33 m each way" blinks in by him while the delay chain shrink-pops out
**Scene** S4 (S4.2, s19 "He could be anywhere") · **Frames** label 4446–4458; delay chain 4451–4454 · **Severity** minor · **Source** S3–S4 pass (carries the D22 residual; the chain exit is from the D23 fix)

**What.**
- `num1Vis` (S4_Geometry.tsx ~551) shows the label only while the fast sweep (SWEEP0 4426 → SWEEP1 4489, 180° in 63 frames) is between 22° and 92°.
- Its opacity is 0.04 at 4446, 0.36 at 4447 and full 4448–4455, then 0.46, 0.11 and 0 by 4458. Meanwhile the label moves 18–40 px a frame (centre (1109,215) → (977,329)).
- The tip is on his token for only ~3 frames (4449–4451).
- In the same frames the delay chain leaves at DELAY_OFF = PASS_H = 4451 through lblPop: its scale is 0.52 at 4452, 0.24 at 4453 and 0.10 at 4454.

**Why.** D22 wanted the label held until ~PASS_H+20 so the distance is tied to him. Instead, one label blinks in while another stack shrinks out in the same 0.3 s (SCENE_BRIEF: nothing pops or flashes).

**Fix** — `scenes/S4_Geometry.tsx`. Pause the sweep on "He".
1. Move `H_BEARING` (now ~500) up with the S4.2 timing (~200). Add:
   `const HE19 = at('s19','he');` (4448)
   `const HOLD_H0 = Math.max(SWEEP0 + 18, HE19 - 2);` (4446)
   `const HOLD_H1 = HOLD_H0 + 14;` (4460)
   `const SWEEP1 = Math.min(K.all19 - 6, HOLD_H1 + 40);` (4499, inside "arc,")
   HOPS stay 4503/4518/4533.
2. In ruler1 (~462), use three phases:
   - eased 0→H_BEARING over SWEEP0..HOLD_H0;
   - hold at H_BEARING;
   - eased H_BEARING→π over HOLD_H1..SWEEP1.
   The arc follows the angle. Add an assert that ruler 1 never steps more than 12.5° in a frame.
3. PASS_H = HOLD_H0, so hPulse and pop_tick follow. Optionally set PULSE_DUR ≈ 10.
4. Label: for g ≥ SWEEP0, drive it by time: `tw(g, HOLD_H0-4, 5) * (1 - tw(g, HOLD_H1, 8))`. Pin it at `lenLabelOf(ruler1(HOLD_H0))` (~(1103,279)) from HOLD_H0−4 until SWEEP1. Point the module check (~567–586) at the pinned spot.
5. Delay chain (~999–1010): `DELAY_OFF = HOLD_H1`. Exit by opacity only: pop for entry only, then `opacity = tw(g, DELAY_LBL+k, 6) * (1 - tw(g, DELAY_OFF, 10, E.inOut))`. Guard at ~511: `ruler1(DELAY_OFF + 10).angle ≤ 115°`.
6. Sound (~1125): split arc_draw into SWEEP0 (dur (HOLD_H0−SWEEP0)/30) and HOLD_H1 (dur (SWEEP1−HOLD_H1)/30).

Option (b), a fixed label by his token, is a weaker fallback: the face inset and the arc crowd that space.

**Check.** Render 4420–4510:
- tip on his token 4446–4459;
- label still (±1 px) and readable ≥ 12 frames, then fading in place over 8;
- no pill changes scale on exit;
- arc closed by 4499;
- ghosts and hops unchanged.
This closes D22.

**Evidence.** `$R2/v_s19lbl/sheet_4443_4460.jpg`, `$R2/v_s19lbl/crop_4445_4458.jpg`, `$R2/v_s19lbl/f4450_grid.png`, `$R2/v_s19lbl/sim.py`, `$R2/s34/g_lbl.png`, `$R2/s34/g_pills.png`.

### N07 — S4.7: the photo frame's slide stops dead at full speed
**Scene** S4 (S4.7, s24) · **Frames** drop 5623–5634, hold 5634–5642, slide 5643–5650, still at 5651, X from 5652 · **Severity** minor · **Source** S3–S4 pass (side effect of the D28 fix)

**What.**
- slideT is linear over SLIDE_DUR 8, with slideX = t² and slideY = 1−(1−t)² (S4_Geometry.tsx ~326–330, ~967–969).
- The centroid steps are 51, 49, 45, 43, 43, 45, 50, 56 px, then 0.1. So the frame arrives at top speed and stops dead; there is one still frame before the coral X.
- Corrections: the reviewer's frames were one late, and the hold on him is ~9 frames, not 7.

**Why.** It breaks lib/motion.ts ("nothing stops dead on a linear curve") and DIRECTION §6 (settle), right into the punchline.

**Fix** — `scenes/S4_Geometry.tsx` (S5 does not draw the frame).
1. Ease the shared parameter, not each axis. Use `slideT = tw(g, SLIDE0, SLIDE_DUR, FOLD_EASE)` and keep slideX = t² and slideY = 1−(1−t)². The curved path avoids "rough shape" (~965–966), and its assert (~621–631) stays valid. Do **not** smoothstep x and y separately: that straightens the path.
2. Rebuild the beat back from the strike:
   - `CROSS0 = K.not24 + 2` (5650)
   - `SLIDE_DUR = 12`, `SLIDE_SETTLE = 2`
   - `SLIDE0 = CROSS0 - 2 - 12` (5636)
   - `PHOTO_HOLD = 10`, `PHOTO_LAND = SLIDE0 - 10` (5626)
   - `PHOTO_IN = PHOTO_LAND - 12`
   PHOTO_OUT stays 5679, so the D29 asserts still pass. Simulated steps: 8, 22, 33, 39, 43, 44, 44, 44, 41, 34, 23, 8.
3. Alternative if the drop must not overlap the "rough shape" pop at 5617:
   - PHOTO_LAND = K.not24 − 18
   - SLIDE0 = PHOTO_LAND + 12
   - CROSS0 = SLIDE0 + 14 (5656, on "photograph")
   - PHOTO_OUT raised toward K.end − PHOTO_OUT_DUR − 2, so the crossed frame still holds ≥ 18 frames
4. Asserts:
   - SLIDE0 − PHOTO_LAND ≥ 10;
   - CROSS0 − (SLIDE0 + SLIDE_DUR) ≥ 2;
   - sampled centre steps ≤ 50 px, the last ≤ 12, and the last 3 decreasing.

**Check.** Render 5605–5665: ≥ 2 identical frames before the first X pixel, and the frame clear of the labels and the ring.

**Evidence.** `$R2/v_photo/slide_strip_5641_5653.png`, `$R2/v_photo/sheet.png`, `$R2/s34/g_photo.png`, `$R2/s34/d28_photo_frame_diffs.txt`.

### N08 — S6.6: the "keep the sensor still" panel shows the sensor held in her hand
**Scene** S6 (S6.6, s35) · **Frames** right panel ~8671–8797 (hand present from ~8557) · **Severity** minor · **Source** accuracy pass (unchanged since round 1; missed then)

**What.**
- In the right plan panel her token's arm reaches the sensor glyph for the whole panel. The left panel lets go onto a rail.
- Cause: `rightState` builds on `motionState`, which never sets reachT, and planLayers defaults `s.reachT ?? 1`.
- Corrections: s32's "held in hand → jiggles" is ~25 s earlier, not 2 s. The nearer contradiction is the S6.5 jiggle of the same hold ~16 s earlier.
- There is no "plan stand glyph" in S1/S4 to reuse: S4's plan shows the bare sensor glyph.

**Why.** The film's own rule is that a hand means jiggle. The real still-sensor runs were mounted (EXPERIMENT_RECORD R8 "Sensor fixed", R1 "fixed on a mount"), and s36 says "held still".

**Fix** — `scenes/S6_Small.tsx` only.
1. Add `const R_LETGO = K.keep35 - 8;` (≈8669).
2. In rightState, put the release in `base` **before** the early return:
   `const base = {...motionState(g), reachT: 1 - tw(g, R_LETGO, 8, E.inOut), stand: tw(g, R_LETGO - 2, 8)};`
   Return `...base` afterwards. Her token stays where it is, which keeps D08's "checker and sensor still".
3. Add an optional `stand?: number` to PlanState. In planLayers' children, draw a top-down tripod under `<SensorGlyph>` when `stand > 0.001`: three legs at 90/210/330°, ~0.17 m (~41 px), each a C.cream 7 px stroke under a C.ink 3 px stroke, with r 4 ink foot dots. Only rightState sets it.
4. Optional: a tiny_clink (−10 dB) at R_LETGO+6.

**Check.** Re-render 8640–8798. No hand touches the right-panel sensor from 8681, the legs show, the glyph does not move and the left panel is unchanged. At phone size it reads as "rail" against "stand".

**Evidence.** `$R2/vS6hand/f8690.png`, `$R2/vS6hand/f8785.png`, `$R2/vS6hand/hand_r2_vs_r1.png`, `$R2/vS6hand/f7900.png`, `qa/review_r2/dense/S6_sheet05.jpg`.

### N09 — S7 s38: the target board's 180° turn happens in ~3–4 frames, and the strip vanishes in a blink
**Scene** S7 (S6.9, s38) · **Frames** 9487–9497 (width 157→149→110→3→109→149→157 over 9489–9495) · **Severity** minor · **Merged from** S5–S7 pass and viewer pass (side effect of the D35 fix)

**What.**
- TURN_DUR is 10 with E.inOut (bezier .65,0,.35,1), drawn at |cos(πu)| (S7_Results.tsx ~269–275, S7_Props.tsx TargetBoard). So the face width changes more than 10 % on only 3 frames.
- The strip is gone from 9493, and the main view shows the plain back through the rest of s38.
- The "reflective material: far more light straight back" label comes 44 frames later (9538).
- The plan card's strip is a ~57×10 px pale dash.
- Corrections: his hand already rides the board edge, and the arrival rim plus sparkle at 9538–9548 already exist. TURN_DUR 10 with E.inOut was written into the D35 spec itself.

**Why.** DIRECTION §6: anticipation, contact, reaction and settle, and the muted test. The beat exists to show the target had a reflector, and a strip that pops out of sight undercuts it.

**Fix** — `scenes/S7_Results.tsx`, `components/v02/S7_Props.tsx`. Lead merge of the two verified fixes:
1. Turn timing (~269–275):
   - `TURN_DUR = 18`
   - `TURN0 = Math.min(STRIP_HIT + 22, Math.floor(FAT_HIT) - TURN_DUR - 10)` (≈9491; the strip faces the camera ~22 frames; the turn spans "on the target")
   - sine ease `const E_TURN = (x: number) => (1 - Math.cos(Math.PI * x)) / 2; turnAt = (g) => tw(g, TURN0, TURN_DUR, E_TURN);`
   - Expected widths: 157, 157, 156, 154, 147, 133, 111, 80, 42, 0, 42…; the width now moves over ~12 frames.
   - TURN1 becomes ≈9509 and HIP0 ≈9511. The throws `TURN0+TURN_DUR+4 ≤ FAT_HIT` (≈9538) and fat hit ≥ TURN1+4 still pass.
   - The card_flick cue (at TURN1, ~1624) moves, so re-run the mix.
2. Anticipation: `pull = tw(g, TURN0-5, 5, E.inOut) * (1 - tw(g, TURN0+3, 8, E.inOut))`, added to his lean as −3·pull. reach2 keeps the hand on the edge.
3. Keep the strip present. TargetBoard gets an opt-in `stripTab` (0..1). When `back`, draw it outside the squash group: a saffron tab ~12×24 px, rx 4, ink stroke 3, at the board's wall-side edge, x = center.x − |sx|·w/2 − 7, y = STRIP_AT.y ± 12. S7_Results passes `stripTab={tw(g, TURN0 + TURN_DUR/2, 4)}`. The existing arrival sparkle then lands on a visible strip.
4. PlanBoard (~910): strip height 9 → 12–13 px; thin or drop the #DCE5E8 centre line so it reads saffron.
5. Optional settle: a ~1.5° board wobble decaying over 8–10 frames after TURN1 (the existing `wobble` prop).

**Check.** Render 9460–9560:
- the width decreases over ≥ 8 frames;
- the strip faces the camera ~22 frames before the turn;
- the tab is visible ~9500–9548;
- the hand-on-edge throw (~1559) passes;
- the plan turn stays in sync;
- the strip, then the tab, are identifiable at 390 px width.

**Evidence.** `$R2/v_d35turn/grid.png`, `$R2/v_d35turn/plan_grid.png`, `$R2/verify_s38/sheet_9480.png`, `$R2/verify_s38/board_after.png`, `$R2/verify_s38/card_zoom.png`, `$R2/verify_s38/phone.png`.

### N10 — S7 s38: his hand returns to the hip through the board and the stand pole
**Scene** S7 (s38) · **Frames** 9499–9513 (over the board face 9502–9504, on the pole 9505–9506, straight-arm flare 9507) · **Severity** minor · **Source** S5–S7 pass (side effect of the D35 fix; the hand stayed on the hip in round 1)

**What.**
- After the turn the hand moves ~80 px left of the edge it let go of, wraps the pole, then arcs out to the hip at ~(1505,728).
- Cause: `mixPose2` blends arm angles from the edge reach (elbow 1, b ≈ +100°) to `ARMS.handsOnHips.armL` (elbow −1, b ≈ −110°). b must pass 0, so the forearm sweeps out (S7_Results.tsx ~941, ~977–979; Cast2.tsx:171).
- Lifting the hand right first and then angle-blending would not fix it.

**Why.** Hands touch only what they move. For ~5 frames it reads as a swipe at the stand right after the D35 turn.

**Fix** — `scenes/S7_Results.tsx`, `guesserAt` (~934–983). Use two legs, planned in hand space.
1. `HIP_MID = HIP0 + 7`, `HIP1 = HIP0 + 14`.
2. Leg 1 (HIP0→HIP_MID):
   - u = tw(g, HIP0, 7, E.inOut);
   - from E1 = edge contact to HANG = `handWorld2(place, {...pose, armL: {a: 12, b: 0}}, -1)`;
   - hx = lerp(E1.x, HANG.x, E.out(u)), hy = lerp(E1.y, HANG.y, E.in(u)), so the hand goes right first, then down;
   - solve with `reach2(place, pose, -1, hx, hy, 1)`, keeping `armsFront: 'L'`.
3. Leg 2 (HIP_MID→HIP1):
   - v = tw(g, HIP_MID, 7, E.inOut);
   - blend `{a: 12, b: 0}` → `ARMS.handsOnHips.armL`;
   - `armsFront: 'none'`.
   At b≈0 the elbow flip is invisible.
4. Lean: `-4 * Math.min(tw(g, STRIP_LIFT, 10), 1 - tw(g, HIP0, 14, E.inOut))`.
5. Asserts (~1549–1597):
   - for HIP0..HIP1, `hw.x ≥ edgeX(1) − 1`;
   - per-frame hand step ≤ 30 px;
   - no jump across HIP_MID;
   - for HIP0+3..HIP1, the hand circle (MITT_R·RIG_S) clears the board rect and the pole rect by ≥ 6 px.
   (Clearance cannot start at HIP0: the hand legitimately begins on the edge.)
6. HIP0 follows TURN1 from N09, so do N09 and N10 together.

**Check.** Re-render 9495–9530. The hand goes right and down, then into the hip, never over the board or pole and with no straight-arm flare.

**Evidence.** `$R2/v_d35b/grid_n.png`, `$R2/v_d35b/grid_o.png`, `$R2/v_d35b/hand_path_9499_9513.png`, `$R2/d35/grid_turn.png`.

### N11 — S7 s39: the "authors' separate test" card shows the room's open right end
**Scene** S7 (s39, D09 card) · **Frames** 9822–9999 (~5.9 s) · **Severity** minor · **Source** S5–S7 pass (side effect of the D09 fix)

**What.**
- At 9830 the back wall ends at x 1240, the side wall's inner face runs to 1499 and a cream cut-end slab sits at 1504–1524.
- From x 1529 to the window border at 1793, across the full window height (y 140–780), there is page-paper colour (250,241,223): ~16 % of the drawing window.
- The "slowed down" chip sits entirely over that strip.
- The FILM_X comment says the strip is "over the bare wall", so this was not intended.

**Why.** DIRECTION §3 says sets never show an edge, and D20/L9 fixed the same kind of exposure. In a framed "our drawing" card it reads as unfinished.

**Fix** — `components/v02/RoomSet.tsx` (shared, opt-in) + `scenes/S7_Results.tsx`. Do not reframe or zoom:
- moving the content right ~280 px puts his hair under the film strip and fails `need()`;
- AW_ZOOM is already set by his height.

1. RoomSet: add `extendRight?: number` (m, default 0; xR = x1 + extR). When > 0:
   - floor, slab front and drop shadow, the relay-wall face and its skirting run from xL to xR;
   - the wall-top path covers the back-wall strip only;
   - **skip** the right side wall face, sideSkirt, DoorOnSideWall and the plan door gap, and the right cut-end cap;
   - add extension planks of the same width with separate seeds (e.g. `rand(2000 + k*7 + 3)`), leaving the existing planks untouched.
   With 0, every other caller must be pixel-identical: run `tsc` and spot-check one S1, S3 and S9 frame.
2. AuthorsTestCard (~1371): `<RoomSet tilt={TILT} items={items} plant={false} door={false} extendRight={3} />`. Keep CAM_AUTH, his marks, FILM_X/Y, the chip and the tag.
3. Add a `need()` guard that no RoomSet cut end projects inside AWIN, or a comment that extendRight must stay on for this card.
4. Fallback if a shared change is refused: an SVG continuation of the relay wall, skirting and floor inside the card's camera space, painting over the side wall and its end.

**Check.** f9822/9830/9880/9950/9999: continuous wall, skirting and floor to the window's right edge; the film strip and chip over plain wall; the left edge still shows wall and floor (add extendLeft if not).

**Evidence.** `$R2/v_d09edge/f9830.png`, `$R2/v_d09edge/z9830_right.png`, `$R2/v_d09edge/f9950.png`, `$R2/v_d09edge/grid.png`.

### N12 — S9.2: the recap route is shown only in a ~430 px card
**Scene** S9 (storyboard S8.2, s46 "The light found a way around") · **Frames** ~11300–11470 (key 11320–11400) · **Severity** minor · **Source** viewer pass (partly from D44 shrinking the card from ~480 to ~430 px)

**What.**
- The S9.2 "seen from above" card is PLAN_CARD_RECT (~430 px wide; ~175 px on a phone), against S1.4's 704 px card.
- In the room, the replay is a ~105×135 px triangle from the sensor to the wall spot to the partition edge, with the legs to him hidden (correctly). His rim flash (~11350) is the only room-side sign.
- Corrections:
  - Main lines are ~4–6 px at 1080p; only the trails are thinner.
  - The W3 fan stops ~20–30 px from her pencil tip and ~45 px from her temple: near her, not on her.
  - The proposed 1.5x card (left edge x≈1120) would cover his head, ear, shoulder and arm (x≈1030–1277), and CAM_W is locked for the Runway R4 keyframes (PATH_LEGIBILITY_PLAN rejects extra S9 moves).

**Why.** S9.2 restates the film's core idea. On a muted phone the route is small. It was already taught in S1, S3 and S4, so this weakens the recap without breaking it.

**Fix** — `scenes/S9_Payoff.tsx` only. Do not move the camera or him.
1. Import `planCardSize`, `PLAN_AREA`. Set:
   - `const S9_CARD_AREA = {w: 488, h: 359};` (×1.22)
   - `const S9_CARD_SIZE = planCardSize(S9_CARD_AREA);` (≈520×437)
   - `const CARD = {x: Math.round(1920*0.95) - S9_CARD_SIZE.w, y: Math.ceil(1080*0.05) + 20, ...S9_CARD_SIZE};` (x 1304, y 74), replacing `CARD = PLAN_CARD_RECT` (~216)
2. `CARD_VIEW = viewForArea(PLAN_VIEW, S9_CARD_AREA)` (~1088) and `area={S9_CARD_AREA}` (~1023).
3. `S9_CARD_K = S9_CARD_AREA.w / PLAN_AREA.w` (≈1.09). Multiply by it: the LightPath width/pulseRadius/lane/ringRadius, the ScatterFan widths and the PlanSpot r. If it still reads thin at 0.4 scale, raise the LightPath stroke to ~8.
4. Keep the card-clear-of-him assert (~281–287). His right edge is 1277–1280 (≈24 px margin). If it throws, shrink S9_CARD_AREA.w at the same aspect.
5. Keep `CARD_OUT + CARD_OUT_DUR ≤ INSET0`. Drop the optional rigCovers clip here (no overlap in S9).

**Check.** Re-render ~11290–11480. At 0.4 scale both round trips read in the card, and his rim flash and paws stay uncovered.

**Evidence.** `$R2/v_s9plan/f05.png`, `$R2/v_s9plan/f05_card2x.png`, `$R2/v_s9plan/f05_phone.png`, `$R2/v_s9plan/f02_room4x.png`, `$R2/v_s9plan/r1_small.png`.

### N13 — S9 J4: his paw wave snaps up and down through a handless frame
**Scene** S9 (storyboard S8.3, D43 reaction) · **Frames** up 11717–11719 (broken 11718); down 11737–11739 (broken 11738) · **Severity** minor · **Source** S8–S9 pass (side effect of the D43 fix)

**What.**
- `mixPose2` blends HANDS_ON_HIPS armR (a 44, b −80) straight to the raised reach (a 80, b −232), with armsFront 'none' (S9_Payoff.tsx ~602–605).
- At blend 0.60 (up, E.out) and 0.50 (down, E.inOut) the hand lands inside the torso outline and is drawn behind it. The sleeve reads as a horizontal stub with no hand.
- Corrections: the way down already lasts 8 frames. Lengthening the same blend would keep the hand hidden longer. S9.1's wave is also an angle blend; it works because it starts from the sneak pose and draws the arm in front until 0.5.

**Why.** It is the episode's last character beat, and a handless pop right where the viewer watches his face (SCENE_BRIEF: nothing pops).

**Fix** — `scenes/S9_Payoff.tsx` (~346–352, ~602–606).
1. Set:
   - `const PAW_CHEST = reachLocal(46, -262, 1, -1);`
   - `PAW_UP = Math.max(6, rk(9))`, `PAW_DN = Math.max(6, rk(10))`
   - wag `PAW1 = WAG0 + rk(9)` (rk(7) if D41's shift needs it, see below)
2. `paw = Math.min(tw(g, PAW0, PAW_UP, E.inOut), 1 - tw(g, PAW1, PAW_DN, E.inOut))`. armR is a two-leg angle blend, hips → PAW_CHEST for paw < 0.5 and PAW_CHEST → raised above. Use `armsFront: paw < 0.75 ? 'R' : 'none'`, switching at the same point as S9.1. Import `Arm`.
3. Optional assert: whenever armsFront is 'none', the hand is outside the torso box.
4. Keep CARD0 − BUSTED ≥ 45 and SETTLE0 + 6 ≤ CARD0. Shorten the wag, not the settle.

**Check.** Re-render 11714–11752. Every frame shows the fist and the sleeve, the rise spans ≥ 5 visible frames, there is no jump at the armsFront switch, and the paw is on the hip ≥ 6 frames before CARD0 (11756) and before "This" (11749).

**Evidence.** `$R2/verify_paw/up.jpg`, `$R2/verify_paw/down.jpg`, `$R2/verify_paw/zoom.png`, `$R2/verify_paw/s91.jpg`, `$R2/verify_paw/sim/current.png`, `$R2/verify_paw/sim/prop_A46.png`.

### N14 — Package: the description says the released data are MIT-licensed
**Scene** package · **Frames** n/a · **Severity** minor · **Source** accuracy pass (wording predates round 1)

**What.** `package/description.txt:20` and the description block of `package/UPLOAD_PACKAGE.md:35` read "- Code and released data (MIT License): https://github.com/sidsoma/consumer-nlos (commit 15314de)". Both are generated from `tools/make_package.py:63`. The CREDITS line and on-screen text are fine.

**Why.** `research/RIGHTS.md:25–27` says MIT covers "this software and associated documentation files" and that whether it covers the .npz/.npy data is ambiguous. The evidence JSONs already say "MIT (code)". Public text should not assert more.

**Fix** — `Video_02/tools/make_package.py:63`:
1. Change the line to "- Code (MIT License) and released data: https://github.com/sidsoma/consumer-nlos (commit 15314de)".
2. Run `python3 tools/make_package.py` from Video_02/ (idempotent; do not hand-edit the generated files).
3. Verify with `grep -rn "MIT License" package/`.
4. Optional: apply the same wording in `research/SOURCES.md:10` and the RIGHTS.md:40 suggested credit line.

**Evidence.** `Video_02/package/description.txt`, `Video_02/research/RIGHTS.md`, `source/src/data/evidence/*.json`.

### N15 — Docs: README points to a missing STATUS.md, and STORYBOARD S6.10 has the old s39 wording
**Scene** docs · **Frames** n/a · **Severity** minor · **Source** accuracy pass (supports D45 and D09)

**What.**
- `README.md:8` ("Read first: STATUS.md") and `:79` ("exact commands … are in STATUS.md") point to a file that never existed in git.
- README never mentions `tools/make_deliverables.sh` (added in f57e1a7), which is what produces MASTER_4K, UPLOAD_1080p and PREVIEW_720p.
- README's hand-written 4K command uses CRF 12; the script uses CRF 14, AAC and concurrency 4.
- `storyboard/STORYBOARD.md:89` (S6.10) still says "reported: person in ordinary clothes · 30 frames/s capture" and a plain film-strip picture.
- Correction: the checklist names the SRT in `package/` and the thumbnail in `thumbnails/`, not exports copies.

**Why.** The owner following README cannot find the delivery steps and may render a different 4K file. A later edit from the storyboard could bring back D09's wording.

**Fix** — `Video_02/README.md`:
1. Replace the STATUS.md pointer with `qa/DEFECT_LOG.md` and `qa/REVIEW_R2.md`.
2. Keep the REVIEW_1080p CRF 18 line, labelled as review-only, and delete the hand-written MASTER_4K command.
3. Order the steps: `python3 tools/make_package.py`, then `bash tools/make_deliverables.sh all` (also master|upload|preview|extras).
4. List the exports it writes.
5. Replace line 79 with the script reference. Optionally correct the runtime to 6:44.

`Video_02/storyboard/STORYBOARD.md` S6.10:
- picture: the cut to the "the authors' separate test · our drawing" card (grey "their sensor", no kit, no checker, film strip "slowed down"), then the empty "independent reproduction" slot;
- text: the two chip lines as on screen, plus "code public · no independent reproduction found (Oct 2026)";
- note: "D09 firewall: never stage this result on the kit sensor or the checker (C37)".

**Check.** `grep` README for STATUS.md and crf=12 (no hits) and STORYBOARD for "separate test" (hit).

**Evidence.** `Video_02/README.md`, `Video_02/tools/make_deliverables.sh`, `Video_02/package/UPLOAD_PACKAGE.md:54–56`, `Video_02/storyboard/STORYBOARD.md:89`, `$R2/docs/t333.png`.

---

## 3. Fix plan (everything still open)

### 3.0 Lead decisions

| # | Decision | Affects | Recommendation |
|---|---|---|---|
| R2-L1 | D02 residual: her pencil tip points at the wall-spot diamond in every raised light shot | D02 | Do the S1-local quieting below (cheap, scene-local). Do **not** move her mark: LAYOUT.operator is shared by S2, S3 and S9, and L15 already chose clipping. A film-wide pencil-ear swap (Cast2 opt-in) would change an approved character look for a minor residual; record it as a known limitation instead. |
| R2-L2 | Reopen the accepted S3.2 9:1 stack limitation | N05 | Yes. One static 30 px line; it matches D19's S3.1 wording. Closes D19's optional step 5. |
| R2-L3 | S9.2 card size vs the locked CAM_W | N12 | ×1.22 card (520×437) inside the margin; no reframe (R4 keyframes). |
| R2-L4 | RoomSet `extendRight` (shared, opt-in) or an S7-local paint-over | N11 | Shared opt-in, default 0, with a pixel-identity spot check of S1/S3/S9. |
| R2-L5 | N01 leader: knock out under the light, or draw over it with a casing | N01 | Knock-out under the light, so the W→H slot crossing (§7.1) stays continuous. |

### 3.1 Shared pass (before scene work; opt-in or additive only)

| File | Change | For |
|---|---|---|
| `components/v02/RoomSet.tsx` | Opt-in `extendRight` (drops the right side wall, extends back wall, skirting and floor). Default 0 must be pixel-identical. | N11 |
| `lib/room.ts` (or another shared lib) | Move `setSliceMaxX` out of S3_Echo.tsx; import it in S3 and S1 (optionally S2's inline loop) | N03 |
| `components/v02/S9_Room.tsx` | Opt-in last-step length for `walkDistance`/`walkContacts` (default = framesPerStep, so other walks are unchanged) | D41 |

Run `tsc` and all nine module-load checks, and confirm that untouched scenes re-render pixel-identically.

### 3.2 Scene files

- **`scenes/S1_ColdOpen.tsx`** — D02 residual, N01, N02, N03
  - **D02 residual (R2-L1).** Outside light events (no pulse at W3 within ±10 frames; the long S1.6–S1.7 holds ~1170–1810), draw the in-room W3 marker as an ink-outline diamond at ~0.5 opacity, with no saffron fill and no glow ellipse. It lights only while a pulse is at the wall. Raise the mask to meet the original 40 px target where the glow shows (HER_CLEAR_W/PENCIL_CLEAR_W ≈ 35 world px at zoom 1.15, GLOW_*_PX 40), keeping glowShown ≥ 0.75. If glowShown fails, keep 24/32 and rely on the quiet marker. Record the remaining pencil/spot alignment in `Video_02/qa/scene_review/S1/REPORT.md` as a known limitation. Check f960, f1300 and f1760 at 0.4 scale.
  - **N01.** Stagger the pill after the diamond, draw the leader downward, reroute it to x≈586 via an elbow, knock it out under the W→H leg and the S1.5 fan, and add the clearance asserts (§2 N01).
  - **N02.** `PAN_EASE = Easing.bezier(0.5,0,0.5,1)` on the PAN0 move and a corrected comment. No timing changes.
  - **N03.** `extendLeft={g >= PAN0 ? HANDOFF_S2S3_EXTEND : 0}`, the shared `setSliceMaxX` asserts, and a REPORT update.
  - Order: N02 and N03 both touch the pan, so do them together and check 1112–1170 once.
- **`scenes/S2_Mirror.tsx`** — N04: BARS_SLIDE = BARS.x1 + 20, BARS_DUR 14 (E.out), new throws. Verify S2 last frame = S3 first frame.
- **`components/v02/S3_BlockCard.tsx`** — N05: static "not to scale · far weaker" line under the pill (R2-L2).
- **`scenes/S4_Geometry.tsx`** — N06 (closes D22) and N07.
  - N06: HOLD_H0/HOLD_H1 hold at H_BEARING, pinned time-driven label, DELAY_OFF = HOLD_H1 with an opacity-only exit, split arc_draw cue.
  - N07: FOLD_EASE slideT over 12 frames, beat rebuilt back from CROSS0 = K.not24+2, step asserts.
  - Verify 5691/5692 still match S5.
- **`scenes/S6_Small.tsx`** — N08: R_LETGO release in rightState's base, opt-in `stand` tripod glyph in planLayers, optional tiny_clink.
- **`scenes/S7_Results.tsx`, `components/v02/S7_Props.tsx`** — N09, N10, N11.
  - N09: TURN_DUR 18 with sine ease, TURN0 = min(STRIP_HIT+22, floor(FAT_HIT)−28), anticipation pull, TargetBoard `stripTab`, plan strip 12–13 px.
  - N10: two-leg hand-space return (HIP_MID = HIP0+7) and hand clearance asserts. Do it with N09, since HIP0 follows TURN1.
  - N11: AuthorsTestCard `extendRight={3}` plus a guard.
- **`scenes/S9_Payoff.tsx`** — D41, N12, N13. These share the J4 timing chain, so do them in one pass and re-run the KK 0.6/1.0 timing loads.
  - **D41.** Keep the 9-frame full steps. Give her walk's final step ~13 frames via the S9_Room opt-in, so the shoe-tracked closing gap is ≥ 7 frames. Require ≥ 8 in the walkContacts assert, because walkContacts reads ~1 frame long (6 computed vs 5 measured). Start the walk at BLANK instead of BLANK+2. LEAN0 must use the new walk length. Net shift is about +2 frames (BUSTED ≈ 11703, CARD0 − BUSTED ≈ 53 ≥ 45).
  - **N13.** PAW_CHEST two-leg wave with armsFront 'R' below 0.75 and E.inOut 9 up / 10 down. With D41's shift, use a 7-frame wag (rk(7)) so SETTLE0 ≈ 11747: ≥ 6 frames before CARD0 (11756) and before "This" (11749).
  - **N12.** ×1.22 card (S9_CARD_AREA {488,359}, x 1304, y 74), light scaled ×1.09, card-clear-of-him assert.
  - Re-render 11280–11760. Shoe-track the footfalls: full steps ≥ 8 apart, closing step ≥ 7.

### 3.3 Package and docs

- `Video_02/tools/make_package.py:63` — N14 wording, then rerun `python3 tools/make_package.py`. Chapters and SRT are unchanged, because no narration changes.
- `Video_02/README.md` — N15: STATUS.md pointer, make_deliverables.sh, the CRF line, the export list.
- `Video_02/storyboard/STORYBOARD.md` S6.10 — N15: the s39 card and chip wording plus the D09 firewall note.
- `Video_02/qa/scene_review/S1/REPORT.md` — remove the open-end limitation (N03), and record the D02 pencil/spot limitation if R2-L1 stands.

### 3.4 Audio and integration

1. Changed SFX cues, all derived in scene files:
   - N06: arc_draw split, pop_tick follows PASS_H;
   - N07: card_flick and stamp_light follow PHOTO_LAND and CROSS0;
   - N08: optional tiny_clink;
   - N09: card_flick at TURN1;
   - D41: checker footsteps, uh_oh and sight-line cues follow LEAN0 and BUSTED.

   Rebuild with `node tools/collect_sfx.mjs` → `tools/make_sfx_v2.py` → `tools/mix_v2.py` → `tools/audio_qc.py` → remux. The narration, timeline, music and captions are unchanged.
2. Full re-render (REVIEW3), dense sheets with `tools/qa_dense.py`, then a round-3 check of only the changed ranges:
   - S1: 795–1020, 1112–1830
   - S2: 2755–2785
   - S3: 3190–3400
   - S4: 4420–4510, 5600–5692
   - S6: 8640–8798
   - S7: 9460–9560, 9822–10000
   - S9: 11280–11760

   Plus a pixel-identity diff of everything else against REVIEW2.
3. After the final render: `bash tools/make_deliverables.sh all`.

---

## Appendix A — Refuted new report (title only)

1. **S9 (S8.3, s47): the push doesn't show that the gap closes** (viewer pass, 11585–11665). Refuted. The GapMarker is re-shown and pinches shut during the push (11595–11615). The far foot visibly meets the skirting. The S9.3 readout (~415×360 px) shows the partition reaching the wall, and the pulses stop on the face with two ✗s as the readout blanks. The proposed pill would also sit inside R4, which must carry no overlays.

## Appendix B — Merge map (new reports → IDs)

| Pass | Report | ID |
|---|---|---|
| S1–S2 | "gap" leader through the glow and W→H leg | N01 |
| viewer | "gap" pill reads as the wall spot's label | N01 |
| S1–S2 | S1.6 pan peak 53 px/frame | N02 |
| S1–S2 | S1.6–S1.7 open left end vs extended S2.4/S3 | N03 |
| S1–S2 | S2.4 slots card pop | N04 |
| accuracy | S3.2 9:1 blocks, no "not to scale" | N05 |
| S3–S4 | S4.2 "1.33 m" blink and delay-chain shrink-pop | N06 (carries D22) |
| S3–S4 | S4.7 photo frame slide dead stop | N07 |
| accuracy | S6.6 sensor held in hand | N08 |
| S5–S7 | s38 board turn in ~4 frames | N09 |
| viewer | s38 strip vanishes in a blink | N09 |
| S5–S7 | s38 hand through board and pole | N10 |
| S5–S7 | s39 card open right set end | N11 |
| viewer | S9.2 recap route only in the small card | N12 |
| S8–S9 | J4 paw wave snaps through handless frames | N13 |
| accuracy | description "(MIT License)" covers the data | N14 |
| accuracy | README STATUS.md / make_deliverables.sh, STORYBOARD S6.10 | N15 |
| viewer | J4 push doesn't show the gap closing | refuted (Appendix A) |

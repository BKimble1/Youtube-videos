#!/usr/bin/env python3
"""Builds qa/v2/REVIEW_V2_R1.md and qa/v2/review_r1/defects.json from the verified defect list below."""
import json, collections, pathlib

ROOT = pathlib.Path("/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/v2")
SEV_ORDER = {"blocker": 0, "major": 1, "minor": 2, "polish": 3}
GROUPS = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "lead"]

D = []
def d(**k):
    D.append(k)

# ---------------- MAJOR ----------------
d(group="G3", scene="V6", frames="4316-4386 (2:23.9-2:26.2)", severity="major", verdict="CONFIRMED",
  title="The finished real U gets no hold: the board starts rolling up as 'U.' ends, and the music payoff plays under the roll-up",
  reason="Seen as described; two lenses (phone viewer, sound) found the same beat from picture and from music.",
  seen="Positions used reach 36/36 at f4316; 'rough outline' fades in f4317-4320; the pointer taps the U's base at f4334; 'U.' is spoken f4352-4360; the board starts rolling at f4362 and is a strip by f4372; V7 starts at f4386. The U only reads as a U from about 28/36 (f4296), so the complete U is on screen for about 1.5 s and stays only about 0.1 s after it is named. SCRIPT_V2 s37 asks for 'hold on the finished U' with a 900 ms pause; the audio keeps the pause (s37 ends f4360, n14 starts f4396) but the picture spends it on the roll-up. The Gadd9 resolve and glock tick follow 'U' at 145.07 s (f4352), so they play under the board leaving. The build also waits at 0/36 for about 2.1 s (f4126-4190) while 'And here's a real one' plays. This is the film's main reconstruction payoff (acceptance question 5).",
  evidence=["skeptic/bursts/P1_Uhold_f4296-4392.jpg", "skeptic/bursts/P1_Ubuild_f4126-4296.jpg", "phone_viewer/bursts/b_1428_1464_Uhold.png", "sound_sync/bursts/V6_lift_f4360.png"],
  fix="Hold the complete board (36/36, 'rough outline', pointer tap) for at least 2.5 s after 'U.' ends: start the roll-up no earlier than f4435 and slide n14 and all of V7 later by the same amount (about +2.5 s; runtime stays inside 5:15-5:45). Recover part of it by starting the k = 1 to 36 build on 'here's' (about f4135) instead of about f4190. Move the resolve and tick onto the pointer tap (f4334) or the start of the hold so the music lands on the finished U. Tighten the roll-up float (V2-R1-28) in the same pass.",
  sources="phone_viewer #1 (major); sound_sync 'U resolve and tick land as the board rolls away' (minor)")

d(group="G1", scene="V2/V3", frames="895-929 (0:29.8-0:31.0); flat 902-922", severity="major", verdict="CONFIRMED",
  title="About 0.9 s of blank, uniform beige frame at 0:30 between the hook question and section B",
  reason="Measured and seen: 21 identical flat frames, then a title over the same blank. Final severity major: it sits on the brief's 30-second mark and runs about 5x the designed 4+4 flat frames.",
  seen="The push into W1's paint fills the frame by f901. From f902 to f922 the frame is one flat colour with zero frame-to-frame change (my diff 0.00 on all 21 frames). 'What survives the bounce?' fades in over the same blank f923-928, and the room only starts rising at f929-930. n06 ends at f901 and n07 starts at f922. The in-paint frame has no texture, so it reads as an empty or broken frame, not a move into the wall. The code's own design is 4 flat frames at the end of V2 and 4 at the start of V3.",
  evidence=["skeptic/bursts/P2_blank_f885-935.jpg", "picture_V1_V6/bursts/v2_to_v3_paint_f884-955.jpg", "phone_viewer/bursts/b_0290_0314_blank.png"],
  fix="Cap the flat run at the designed 4+4 frames: end the push so the paint first covers the frame at FLAT0, and start V3's pull-back by its 5th frame. Give the in-paint frame visible paint grain or the bump-edge section so it reads as wall paint. Do not fade the V3 title in until the room is visible (from about f930). Coordinate the V3 side with G2. Saves about 0.6 s.",
  sources="picture_V1_V6 #1 (major); phone_viewer #2 (minor)")

d(group="lead", scene="package (description.txt line 26; UPLOAD_PACKAGE.md line 42); affects the R8 boards f182-405 and f7176-7852", frames="182-405, 7176-7852", severity="major", verdict="CONFIRMED",
  title="Description's tracking-plot note omits that the partition and sensor marker are plot constants, omits the retroreflective setting, and states a replay mapping that disagrees with the on-screen counter",
  reason="Read against EVIDENCE_BRIEF_V2 §1.1, §1.6 and §10: both disclosures are required in the description, and the film draws 'blocked' and a red X on that partition on a 'Real data' board.",
  seen="Line 26 says: '...held still and aimed at a wall while a hidden person walked behind a partition. Shown sped up (every second of the 475 recorded frames, from frame 6) and mirrored to match our room...'. Missing: 'the partition and sensor positions are drawn from the authors' plotting code' (§1.1 Plot elements, §1.6 template, §10 'Description only: plot constants') and 'The authors' code processes these data with its retroreflective-target setting' (§1.6). On screen the partition carries 'blocked' and the sight-line X (skeptic/frames/f300.png), so the description is the only place a viewer can learn it was not measured. The mapping 'from frame 6' is a 0-based index while the counter reads 'frame 7 of 475' ... 'frame 475 of 475' (1-based), and 'every second' reads as a unit of time for a capture whose rate is unknown.",
  evidence=["skeptic/frames/f300.png", "skeptic/frames/f7520.png", "accuracy_evidence/frames/f200.png", "accuracy_evidence/frames/counter_strip.png"],
  fix="Rewrite the note from the §1.6 template: '...mirrored to match our room; the partition and sensor marker are drawn from the authors' plotting code, not measured. The authors' code processes these data with its retroreflective-target setting; what the person wore is not documented.' Replace the mapping with 'Shown sped up: every other recorded frame, frames 7-475 of 475, one plotted position per video frame, no interpolation.' Make the same edit in UPLOAD_PACKAGE.md.",
  sources="accuracy_evidence #1 (major); accuracy_evidence #5 (polish), same sentence")

# ---------------- MINOR ----------------
d(group="G6", scene="V10.1", frames="7176-7297 (3:59.2-4:03.2)", severity="minor", verdict="CONFIRMED",
  title="The return to the real kit board has no 'Real data' headline for 4 s; the question title sits in its slot",
  reason="Seen as described by three lenses. Not a broken firewall: tape, card style, 'sped up' and the source line are present.",
  seen="Headline slot empty f7176-7191; 'What can it do? Where does it fail?' occupies it f7192-7290; 'Real data' fades in at about f7298. The cut comes straight from our illustrated plan, with the sensor and partition matched in position, right after 'The estimate keeps up instead of smearing'. SHOTPLAN's global rule puts a 64 px 'Real data' headline on every real-data board and question titles top-left of the frame; the V10.1 row's label list leaves the headline out, so the plan contradicts itself and the global rule should win.",
  evidence=["skeptic/bursts/P3_V10head_f7168-7306.jpg", "picture_v7_v13/bursts/V10_1_headline_f7176.jpg", "accuracy_evidence/frames/v9_v10_transition.png"],
  fix="Show the 64 px 'Real data' headline from f7176. Put the question title outside the card, top-left of the frame (shift the card about 70 px down for V10.1 and slide it back for V10.2). Fix the V10.1 row in SHOTPLAN_V2.md to match.",
  sources="phone_viewer #3; picture_v7_v13 #2; accuracy_evidence #2")

d(group="G3", scene="V5.2", frames="2814-2884 (1:33.8-1:36.1)", severity="minor", verdict="CONFIRMED",
  title="The worked round-trip example flashes '8.9 ns' and '2.65 m there and back' for about 1 s each",
  reason="Seen as described.",
  seen="'≈ 8.9 ns later' shows f2818-2852 (about 1.1 s), '≈ 2.65 m there and back' f2855-2879 (about 0.8 s), and only '≈ 1.33 m each way' holds, from f2884. None of the numbers is spoken (s18 talks over them). The chain is the round-trip lesson the brief asks to keep internally consistent; the ruler fold supports it visually, but a phone viewer catches only the last step.",
  evidence=["skeptic/bursts/P4_chain_f2796-2892.jpg", "phone_viewer/bursts/b_0934_0964_chain_labels.png"],
  fix="Build the chain left to right on one line (8.9 ns → 2.65 m there and back → 1.33 m each way) and keep all three until s18 ends (about f2973), or give each step at least 2 s by starting it as n11 ends (f2788).",
  sources="phone_viewer #4")

d(group="G2", scene="V3.4", frames="1404-1470 (0:46.8-0:49.0)", severity="minor", verdict="CONFIRMED",
  title="The 'blend of many paths' appear out of the partition face, with no visible link to his head, chest and foot markers",
  reason="Seen as described; two lenses. No path crosses the partition (correct).",
  seen="Yellow, blue and red pulses emerge from the partition's left face at f1407-1414, rise to three wall spots and converge on the sensor. The coloured markers on him (red ring on his hair, yellow on his chest, blue on his shoe) never flash or launch anything, and the entry heights do not follow the markers. At 390 px the markers are about 7 px. The planned teaching visual, paths from his head, shoulder and feet merging into one blip, does not read.",
  evidence=["skeptic/bursts/A3_paths_f1398-1470.jpg", "picture_V1_V6/bursts/v3_4_paths_crop_f1404-1439.jpg", "phone_viewer/frames_key/blend_paths_strip.png"],
  fix="Pulse each body marker in its path's colour on the frame its path launches, and time the pulse's appearance at the partition edge to the hidden leg's travel. Optionally draw each hidden leg as a faint dotted 'behind' segment for that second. Enlarge the markers to about 48 px.",
  sources="picture_V1_V6 #3 (minor); phone_viewer #13 (polish)")

d(group="G5", scene="V9.4", frames="6776-6886 (3:45.9-3:49.5)", severity="minor", verdict="CONFIRMED",
  title="B1's listening spots float inside the room below the wall and touch frame A's spots",
  reason="Seen at full resolution.",
  seen="At f6865 frame A's cream spots sit on the wall line (y about 200); B1's teal diamonds are centred at y about 245, clear of the wall band, so they read as points in the room rather than light on the wall. The third and fourth teal diamonds touch the first two cream ones. Everywhere else listening spots sit on the wall, and the shot plan says B1's spots 'appear along the wall'.",
  evidence=["skeptic/frames/f6865.png", "picture_v7_v13/frames/V9_4_B1_spots_crop.png"],
  fix="Anchor B1's spots on the wall's inner face at the same y as A and tell the sets apart by colour only; where they overlap in x, offset them or drop A to outlines when B1 lands.",
  sources="picture_v7_v13 #1")

d(group="G5", scene="V9.4", frames="6846-6887 (3:48.2-3:49.6)", severity="minor", verdict="PARTLY",
  title="The real-U thumbnail is taped over our room plan, beside the rail sensor drawn like the 'off-the-shelf kit', with a shortened source line",
  reason="Real: the overlap, the look-alike sensor and the shortened source line. Smaller than stated: the shot plan specifies this 1.5 s card top-right, it keeps 'Real data · same 3×3 sensor' and the 3×3 icon, and n22 describes the U's method correctly. The firewall is bent, not broken.",
  seen="At f6865 the card covers the plan's top wall and its right wall line. The rail token is the house sensor drawing that V7.3 labels 'off-the-shelf kit' (skeptic/frames/f5085.png), and n22 ends 'That's how the U was made' over it. The global rule says the U 'never sits next to the kit sensor'. The card's source line reads 'authors' released data' only, dropping 'and code, run by us · object held still'.",
  evidence=["skeptic/frames/f6865.png", "skeptic/frames/f5085.png", "skeptic/bursts/B8_cut_f6840-6894.jpg"],
  fix="Give the card its own space off the plan for its 1.5 s (shift or shrink the plan, or place the card in the margin outside the room outline). While it shows, swap the rail token for the 3×3 zone-box icon used on the real boards. Restore the source line to 'authors' released data and code, run by us · object held still'.",
  sources="accuracy_evidence #3")

d(group="G6", scene="V10.2", frames="7297-7538 (4:03.2-4:11.3)", severity="minor", verdict="PARTLY",
  title="The kit board's conditions column builds five small items in 8 s and is hard to read at phone width",
  reason="Real at 390 px. Overstated in the proposed fix: these items are exactly the on-screen conditions EVIDENCE_BRIEF §10 places beside the result, at the sizes the shot plan sets, so they cannot simply move to the description.",
  seen="At f7520 the column items render at about 40 px (about 8 px at 390) and the counter and software-check chip at about 30 px (about 6 px at 390). Five items arrive in about 8 s while n25 speaks other words, and the dot has stopped (V2-R1-10).",
  evidence=["skeptic/frames/f7520.png", "skeptic/frames/p390_f7520.png", "skeptic/bursts/B3_freeze_f7390-7540.jpg"],
  fix="Keep every item but stage them on their cues at 48 px: the kit line on 'off-the-shelf kit' (cut to 'ST sensor kit · held still · not the phone-grade device' in two lines; '16 zones' can stay in the description), 'under US$100' on 'hundred dollars', the setup line on 'held still'. Give the software-check chip its own 2 s, full column width at 40 px or more, after n25 ends.",
  sources="phone_viewer #7")

d(group="G6", scene="V10.2", frames="7414-7538 (4:07.1-4:11.3)", severity="minor", verdict="PARTLY",
  title="The real track stops at frame 475 and the dot sits frozen for 4.1 s while the narration says the person walked",
  reason="The frozen dot is real (plot area unchanged from f7414). The frame is not fully dead until f7480 because the column is still building; the fully still run is f7480-7538 (1.9 s).",
  seen="Counter reaches 'frame 475 of 475' at about f7412; per-frame difference is 0.00 from f7414 except column fade-ins (f7426, f7442-7449, f7472-7479), then 0.00 for f7480-7538. Over this the narration says 'held still while a person walked behind a partition' (f7457-7514).",
  evidence=["skeptic/bursts/B3_freeze_f7390-7540.jpg", "picture_v7_v13/dense/V10_sheet02.jpg"],
  fix="Restart the stored-track replay from index 6 at about f7414 with the same every-2nd-frame mapping, no interpolation and an honest counter (V10.4 already does this), or re-time V10.1 so the replay ends on 'partition.' (f7514). Do it together with V2-R1-09.",
  sources="picture_v7_v13 #3; phone_viewer #7 (frozen-dot note)")

d(group="G1", scene="V1.1", frames="29-30 (0:00.97-0:01.00)", severity="minor", verdict="CONFIRMED",
  title="The guesser's arrival snaps from tiptoe crouch to upright stance in one frame",
  reason="Seen in a frame-by-frame crop.",
  seen="f29: knees bent, mitts at chest, worried mouth. f30: legs straight, feet flat, torso redrawn and the face already smug; only the arm eases to the hip afterwards. It is the first action of the film. Feet do not slide.",
  evidence=["skeptic/bursts/A2_settle_crop_f26-33.jpg", "picture_V1_V6/bursts/v1_1_settle_f24-35_crop.jpg"],
  fix="Route the arrival blend through the leg, sink and foot-angle parameters, or add 4-6 in-betweens: heels drop, knees straighten with a small overshoot, hips settle. Change the face on the settle frame, not on the snap.",
  sources="picture_V1_V6 #2")

d(group="lead", scene="V5 (J3 crossing, audio)", frames="3296-3331 (1:48.9-1:51.0)", severity="minor", verdict="PARTLY",
  title="Crossing-beat effects land off picture: the tap sounds 8 frames after the pointer stops, and the uh-oh sting comes 12 frames after his face drops, over the tail of 'place.'",
  reason="Both sync offsets are real. The masking is smaller than stated: the vowel of 'place' (110.45-110.55 s) is clear before the sting; only its final consonant is covered.",
  seen="The pointer reaches the crossing and stops at f3296; pencil_tap is cued at f3305 with no motion. His face drops at f3305-3306 on 'one'; uh_oh is cued at f3318 (110.60 s), exposed in the music's full stop. Band measurement (300-4000 Hz): sting -25 to -29 dBFS against the tail of 'place.' at -36 to -45 dBFS from 110.60 to 110.82 s.",
  evidence=["skeptic/bursts/S1_crossing_f3290-3334.jpg", "skeptic/bursts/A4_J3b_crop_f3300-3310.jpg", "skeptic/audio_checks.txt (S1S2_J3_crossing)", "sound_sync/bursts/V5_crossing_early_f3305.png"],
  fix="Re-cue pencil_tap to f3297, with the music stop, and uh_oh to f3306-3307 at about -6 dB so it lands on his face change and is over before 'place'. Alternatively move the face change to after 'place.' (f3332) and leave uh_oh there.",
  sources="sound_sync #1 (major) and #2 (minor)")

d(group="lead", scene="V13 (audio)", frames="9534-9547 (5:17.8-5:18.2)", severity="minor", verdict="CONFIRMED",
  title="The end-screen music swell starts on 'corner.' and covers its last syllable",
  reason="Measured.",
  seen="The bed rises from -37 to -29 dBFS at 317.82 s, on the word's onset. From 318.02 s the voice tail (-41 to -57 dBFS in band) sits under the music (-32 to -34 dBFS in band). It is the last word of the film.",
  evidence=["skeptic/audio_checks.txt (S5_corner_swell)"],
  fix="Start the swell after 'corner.' ends (about 318.2-318.3 s, f9547-9549), or hold the bed about 6 dB lower until then.",
  sources="sound_sync #5")

d(group="lead", scene="global (V1, V4, V2.3, V9-V10 chips)", frames="182-405, 780, 1732-2283, 7176-7852", severity="minor", verdict="PARTLY",
  title="Integrity chips ('sped up', 'illustration', 'invisible flash · shown for clarity', 'different sensor: 3×3 zones · centre zone') are about 6 px at phone width",
  reason="Real for 'sped up', which is the only notice that the real replay is accelerated and is not spoken. Smaller than stated for the rest: the plan allows 30-34 px chips and small credits, 'different sensor' is spoken in s15 and marked by the 3×3 icon, and 'illustration' is backed by the visible style change.",
  seen="The chips render at 30-34 px on 1080, about 6-7 px at 390 (skeptic/frames/p390_f300.png). The highlighted 'different sensor: 3×3 zones · centre zone' on the waveform board sits in the source line at the same size.",
  evidence=["skeptic/frames/f300.png", "skeptic/frames/p390_f300.png", "skeptic/frames/grid390_a.png (f1815, f1905 tiles)", "phone_viewer/frames_key/smalltext_fullres.png"],
  fix="Raise 'sped up' and 'illustration' to about 40 px. On the V4 waveform board, lift 'different sensor · 3×3 zones' out of the source line into a 40-48 px tag beside the zone icon. Leave citations small.",
  sources="phone_viewer #8")

d(group="lead", scene="package (description.txt lines 3, 28, 29)", frames="1740-2283 (waveform), 4126-4365 (U)", severity="minor", verdict="CONFIRMED",
  title="Description's intro, U and waveform notes leave out required provenance",
  reason="Read against EVIDENCE_BRIEF_V2 §4.1, §4.2 and §10.",
  seen="Line 3 says the real data are 'the researchers' own released files, plotted by us', but the U frames were reconstructed by us with the authors' code (the board says 'authors' released data and code, run by us'). The U bullet lacks 'authors' released data and code, run by us; the build-up frames are our partial sums'. The echo bullet lacks the file (iter_22), that 'hundreds of times weaker' is our peak-height measure (256-576× across the nine zones), and that reading the bump as the U's echo is our interpretation.",
  evidence=["accuracy_evidence/frames/f4340.png", "accuracy_evidence/frames/f2100.png"],
  fix="Intro: 'The real data shown come from the researchers' released files, plotted (and, for the U, reconstructed with their code) by us.' U bullet: add 'authors' released data and code, run by us; the build-up frames are our partial sums over the first k positions.' Echo bullet: add 'one of the 36 captures (iter_22); \"hundreds of times weaker\" is our peak-height measure (256-576× across the nine zones); reading the bump as the U's echo is our interpretation, consistent with the reconstructed U about 0.54 m from the wall.'",
  sources="accuracy_evidence #4")

# ---------------- POLISH ----------------
d(group="G2", scene="V4.2", frames="1932-2048 (1:04.4-1:08.3)", severity="polish", verdict="PARTLY",
  title="The magnifier waits at ×1, and the zoom starts 10 frames after 'zoom', so the bump lift and tick land before the bump appears",
  reason="Real but smaller: the magnifier slides along the tail for its first 1.5 s, so the static ×1 wait is about 1.5 s (f1980-2026), and the lift's echo tick (about f2034) lands close to the bump's appearance.",
  seen="Magnifier enters at f1932 and slides until about f1980; it reads 'zoom ×1' until f2026, starts zooming at f2028, shows the bump from f2036 and reaches ×250 at f2048. 'zoom' is spoken at f2018. The music bed shows the lift tick at f2016-2019 and its echo at about f2034.",
  evidence=["skeptic/bursts/P16_magnifier_f1900-2052.jpg", "skeptic/audio_checks.txt (S6_bump_lift)", "sound_sync/bursts/M_bump_fine_f2030.png"],
  fix="Start the ×1 to ×250 animation on 'zoom' (f2018) and bring the magnifier in about 1 s before it. Keep the lift on the bump's appearance.",
  sources="phone_viewer #16; sound_sync #6")

d(group="G1", scene="V2.2", frames="612-657 (0:20.4-0:21.9)", severity="polish", verdict="PARTLY",
  title="The full-frame arrival timeline is complete with all labels for only about 1 s before it shrinks into the sensor display",
  reason="Real, but the idea is on screen for about 4 s overall: as an inset during the race (f565-600) and on the sensor display through about f790. Labels are readable at 390 px.",
  seen="Full frame from f612; 'his echo' and the 'a few nanoseconds' bracket complete by f628; shrink starts at f657, after n04 ends (f653).",
  evidence=["skeptic/bursts/P5_timeline_f600-672.jpg", "phone_viewer/bursts/b_0195_0231_timeline.png"],
  fix="Start the shrink on 'This takes' (f665) rather than f657, and reach full frame earlier (from about f600).",
  sources="phone_viewer #5")

d(group="G1", scene="V1.3", frames="182-402 (0:06.1-0:13.4)", severity="polish", verdict="PARTLY",
  title="Nothing on the real tracking board says the top band is the wall the light bounces off",
  reason="Real, but the brief caps the opening board at three labels, the V1.2 room shot draws the sensor's wedge to the wall (f150), and n01 says 'off a wall'. The proposed fourth label conflicts with EVIDENCE_BRIEF §1.5.",
  seen="The band with the measured wall points is unlabelled and its points are about 4 px at 390; the sensor marker's only line is the blocked sight line.",
  evidence=["skeptic/frames/f300.png", "skeptic/frames/grid_opening_0-15s.png (f150, f182 tiles)"],
  fix="Do not add a label. Pulse the 16 measured wall points once on 'wall' (n01, f240) and give the band the room's wall colour so the match from V1.2 reads.",
  sources="phone_viewer #6")

d(group="G1", scene="V1.1-V1.2", frames="60-181 (0:02.0-0:06.0)", severity="polish", verdict="CONFIRMED",
  title="Coral 'blocked' sits on the coral partition and his shirt in the room shots",
  reason="Seen; it reads only because of its white halo.",
  seen="At f75 and f140 the 64 px coral label spans the coral panels and the shirt edge. On the board it sits on plain paper and reads cleanly.",
  evidence=["skeptic/frames/grid_misc.png (f75 tile)", "picture_V1_V6/frames/label_compare_blocked.png"],
  fix="Put the room-shot 'blocked' on bare wall above the X (sensor side), or set it in ink with only the X in coral.",
  sources="picture_V1_V6 #5")

d(group="G1", scene="V2.1", frames="560-566 (0:18.7-0:18.9)", severity="polish", verdict="PARTLY",
  title="The timeline card slides up through the caption band on its way in",
  reason="A literal breach of the plan's band rule, but the card is empty apart from its axis and is in the band for about 5 frames.",
  seen="The card enters from the bottom edge at f560 and settles above y 950 by about f566.",
  evidence=["skeptic/bursts/A7_card_f556-572.jpg", "picture_V1_V6/frames/f565.png"],
  fix="Fade the card in at its settled position, or bring it in from the left.",
  sources="picture_V1_V6 #7")

d(group="G2", scene="V3.1-V3.4", frames="944-1150, 1384-1480", severity="polish", verdict="CONFIRMED",
  title="A sliver of blue door is cut by the right frame edge in the raised room view",
  reason="Seen.",
  seen="A 10-15 px strip of glazed door runs down the right edge (x about 1905-1920) in an otherwise locked frame.",
  evidence=["skeptic/frames/grid_misc.png (f1085 tile)", "picture_V1_V6/bursts/v3_1_rightedge_mirror_f944-1067.jpg"],
  fix="Reframe about 24 px left, or drop the door from these framings.",
  sources="picture_V1_V6 #6")

d(group="lead", scene="V3.2 (audio)", frames="1037-1050 (0:34.6-0:35.0)", severity="polish", verdict="PARTLY",
  title="The mirror-slide sound finishes before the mirror moves",
  reason="Real 5-9 frame lead, but the slide is a quiet, short effect (peak about -39 dBFS, 20 dB under the narration) and the ting at f1050 is on contact.",
  seen="mirror_slide peaks at f1040-1041 and is gone by f1042; the mirror enters the frame at f1046 and lands at f1050.",
  evidence=["skeptic/bursts/S3_mirror_f1030-1054.jpg", "skeptic/audio_checks.txt (S3_mirror_slide)"],
  fix="Re-cue mirror_slide so the sound covers the visible travel, f1045-1049; keep the ting at f1050.",
  sources="sound_sync #3")

d(group="G2", scene="V4.3", frames="2230-2282 (1:14.3-1:16.1)", severity="polish", verdict="PARTLY",
  title="The zoomed waveform carries four labels plus the route icon at once",
  reason="Real crowding at 390 px, but 'zoom ×250' is the scale tag the evidence brief requires, so the teaching labels number three.",
  seen="At f2245: 'wall echo', 'zoom ×250', '≈ 3.7 ns later', '≈ 1.1 m extra, there and back' and the route icon.",
  evidence=["skeptic/frames/grid390_a.png (f2245 tile)", "picture_V1_V6/frames/f2245.png"],
  fix="Fade 'wall echo' when the dimension line draws.",
  sources="picture_V1_V6 #8")

d(group="lead", scene="V4 and V1 (audio)", frames="2088-2128 (1:09.6-1:10.9); 359-362 (0:12.0)", severity="polish", verdict="PARTLY",
  title="Real-data lift attacks come level with two soft-spoken evidence lines",
  reason="Real in 40 ms windows; the line-level margin is still about 15 LU, so this is crowding, not masking.",
  seen="Marimba attacks reach -33 dBFS in band at 69.63-69.67 s, just before 'capture', and come 2.6 dB above the voice at 70.84 s inside 'weaker.'. At 12.02-12.06 s the bed (-31 dBFS in band) sits over the tail of 'estimate.' (-39 to -48).",
  evidence=["skeptic/audio_checks.txt (S4_capture, S4_weaker, S4_estimate)"],
  fix="Duck 3-4 dB deeper, or mute the attacks, across 68.5-71.2 s and 11.8-12.2 s.",
  sources="sound_sync #4")

d(group="G3", scene="V5.8", frames="3820-3900 (2:07.3-2:10.0)", severity="polish", verdict="PARTLY",
  title="The measured-versus-predicted inset is too small to follow at phone width",
  reason="Real, but the fading candidate dots already carry 'keeping those whose predicted echoes match'.",
  seen="A card about 280×85 px in the top-right corner; its labels are about 5 px at 390.",
  evidence=["skeptic/frames/grid_misc.png (f3825 tile)", "skeptic/frames/grid390_a.png (f3825 tile)"],
  fix="Show the comparison large for about 2 s (two tick rows across the lower third, 48 px labels), or drop it.",
  sources="phone_viewer #10")

d(group="G3", scene="V5.5 (face inset)", frames="3304-3306 (1:50.1-1:50.2)", severity="polish", verdict="CONFIRMED",
  title="In the J3b inset the leaning mitt vanishes in two frames instead of leaving the partition",
  reason="Seen in a frame-by-frame crop.",
  seen="f3304 mitt on the partition edge; f3305 arm lower; f3306 arm hanging, mitt gone.",
  evidence=["skeptic/bursts/A4_J3b_crop_f3300-3310.jpg"],
  fix="Keep the face snap but lift the mitt off over 3-4 frames, then drop the arm.",
  sources="picture_V1_V6 #4")

d(group="G3", scene="V5.9", frames="4028-4114 (2:14.3-2:17.1)", severity="polish", verdict="CONFIRMED",
  title="'likely location' is a hard-edged sliver, not the planned soft blob",
  reason="Seen at full resolution.",
  seen="A sharp teal lens about 140×25 px inside the ring, with the token ghosted underneath.",
  evidence=["skeptic/frames/grid_misc.png (f4100 tile)", "picture_V1_V6/frames/f4100.png"],
  fix="Feather the patch's edge (the V5.6 overlap shape, blurred), keeping its size so it never reads as a point.",
  sources="picture_V1_V6 #9")

d(group="G4", scene="V6→V7", frames="4373-4389 (2:25.8-2:26.3)", severity="polish", verdict="CONFIRMED",
  title="The rolled U board floats alone on blank blue for about 0.5 s before the shelf arrives",
  reason="Seen.",
  seen="The roll closes by f4373 and hangs mid-frame until the shelf rises at about f4389.",
  evidence=["skeptic/bursts/B5_rollup_f4358-4410.jpg", "picture_v7_v13/bursts/V6_V7_rollup.jpg"],
  fix="Start the tilt to the shelf while the roll is still closing (overlap about 0.4 s). Do this with V2-R1-01.",
  sources="picture_v7_v13 #5")

d(group="G4", scene="V7→V8", frames="5431-5440 (3:01.0-3:01.3)", severity="polish", verdict="PARTLY",
  title="The plinth plate passes through the caption band during the push into the spotlight",
  reason="A literal breach of the band rule, but the plate is leaving, dissolving and unreadable for about 0.3 s.",
  seen="'published 2026 / MIT + Dartmouth' slides down through y 950-1080 at f5432-5440 as the camera pushes in.",
  evidence=["skeptic/bursts/B6_plinth_f5422-5446.jpg", "picture_v7_v13/bursts/V7_end_push_f5438.jpg"],
  fix="Finish the plate's fade by about f5428, before the push.",
  sources="picture_v7_v13 #6")

d(group="G4", scene="V7.5", frames="5363-5409 (2:58.8-3:00.3)", severity="polish", verdict="CONFIRMED",
  title="The fanned frame cards hold completely still for about 1.5 s",
  reason="Measured: per-frame difference 0.00-0.04.",
  seen="Under 'keeps track of what moved, so many weak frames' nothing moves until the push starts at f5410.",
  evidence=["picture_v7_v13/frames/f5380.png"],
  fix="Nudge each card's 'what moved' arrow in turn on 'what moved'.",
  sources="picture_v7_v13 #7 (first half)")

d(group="G4", scene="V8.2", frames="5727-5773 (3:10.9-3:12.4)", severity="polish", verdict="PARTLY",
  title="The 'bunched spots' are a speck at phone width",
  reason="Real, but the label and the long patch read, and a tight speck still says 'bunched'; only the individual spots are lost.",
  seen="Six spots about 8 px each at 1080, a cluster about 16×4 px at 390.",
  evidence=["skeptic/frames/grid_b4_p9.png (f5750)", "skeptic/frames/grid390_a.png (f5750 tile)"],
  fix="Enlarge the spot markers to 16-20 px with ink outlines for this beat, or bracket the cluster on 'bunched'.",
  sources="picture_v7_v13 #4")

d(group="G5", scene="V9.4→V9.5", frames="6871-6887 (3:49.0-3:49.6)", severity="polish", verdict="CONFIRMED",
  title="The cut to the person plan lags n23 by about half a second",
  reason="Seen: the cut is at f6887/6888.",
  seen="'To follow a person' starts at f6871 while the rail shot and the U card are still up.",
  evidence=["skeptic/bursts/B8_cut_f6840-6894.jpg"],
  fix="Cut at f6869-6871; the U card still gets its 1.4 s from 'the U' (f6846).",
  sources="picture_v7_v13 #8")

d(group="G5", scene="V9.5", frames="6935-7060 (3:51.2-3:55.3)", severity="polish", verdict="PARTLY",
  title="The 'handheld: shown only for locating the sensor itself (reported)' chip is cryptic and about 6 px at phone width",
  reason="The chip is plan-specified (30 px) and backs claim P05; the problem is its wording and size, not its presence.",
  seen="Under 'sensor still · person moves' at f6960; nothing in the picture shows a handheld test.",
  evidence=["skeptic/frames/grid_b4_p9.png (f6960)", "phone_viewer/frames_key/crop_f6960_handheld.png"],
  fix="Rephrase plainly at 40 px, for example 'handheld use: tested only for locating the sensor itself (reported)', or move it to the description.",
  sources="phone_viewer #9")

d(group="G5", scene="V9.1", frames="6100-6340 (3:23.3-3:31.3)", severity="polish", verdict="PARTLY",
  title="The step and the spot shift between frames are small at phone width",
  reason="Real, but both 48 px labels read, and the 11 cm step is real I1 geometry, so the fix is framing, not exaggerating the step.",
  seen="The echo tick slides about 60 px on a mini timeline about 380×70 px (about 12 px at 390); the spot arrows are a few pixels.",
  evidence=["skeptic/frames/grid_misc.png (f6120, f6200 tiles)", "phone_viewer/frames_key/p390_f6300.png"],
  fix="Push in on the mini timeline for 'he moves → echo shifts' and on the wall spots for 'sensor moves → spots move'.",
  sources="phone_viewer #11")

d(group="G6", scene="V11.1", frames="8055-8114 (4:28.5-4:30.5)", severity="polish", verdict="CONFIRMED",
  title="The warehouse wide holds completely still for 2 s",
  reason="Measured: per-frame difference 0.00-0.02.",
  seen="Under 'What might this be good for?' nothing moves until the robot rolls on 'Picture'.",
  evidence=["picture_v7_v13/bursts/V10_V11_match_f8040.jpg"],
  fix="Give the robot a small idle (sensor-head pan or blink) on 'good for?', or start the roll on 'for?'.",
  sources="picture_v7_v13 #7 (second half)")

d(group="G6", scene="V11.4", frames="8620-8905 (4:47.3-4:56.8)", severity="polish", verdict="PARTLY",
  title="The four limit tiles change every 1.2-1.7 s and their visual gags are small",
  reason="Real, but each label matches the spoken limit, so comprehension holds.",
  seen="Short range, dark or shiny walls, bright sunlight and fast math each change a small part of the full warehouse plan; the summary row's tile labels are tiny.",
  evidence=["skeptic/bursts/P15_tiles_f8620-8910.jpg"],
  fix="Crop each tile in on the part that changes (wall, sunlit sensor, chip), and shorten the summary row.",
  sources="phone_viewer #15")

d(group="lead", scene="V11 (audio)", frames="8912-9010 (4:57.1-5:00.3)", severity="polish", verdict="PARTLY",
  title="The robot motor ties the voice on the soft tails of 'now,' and 'system.'",
  reason="Smaller than stated: across s40 the voice measures 10-17 dB above the motor in the speech band (100 ms windows); only n30's soft tails tie.",
  seen="Around 297.4-297.5 s and 300.1-300.3 s the motor loop at -6 dB sits within about 2 dB of the voice in 40 ms speech-band windows.",
  evidence=["skeptic/audio_checks.txt (S12_robot_s40, S12_robot_now, S12_robot_system)"],
  fix="Duck robot_motor a further 4-6 dB across n30 (296.9-300.4 s).",
  sources="sound_sync #12")

d(group="G7", scene="V12.1-V12.2", frames="9030-9276 (5:01.0-5:09.2)", severity="polish", verdict="PARTLY",
  title="The callback's readout inset is small and unlabelled, and its blank-out is the proof beat",
  reason="Smaller than stated: the two insets are sequential, not stacked (the plan card fades by about f9120 and the readout appears at about f9125); the plan card is the shot plan's sanctioned fallback; the blob-to-blank change is visible at 390 px.",
  seen="'seen from above' card top-right f9030-9120, then a teal readout box top-left (about 420×250 px, about 85 px wide at 390) linked by a ring on the sensor; it goes blank at about f9258-9264, then the checker's look at f9300-9320.",
  evidence=["skeptic/bursts/P12_callback_f9024-9300.jpg", "skeptic/frames/P12_callback_grid.png"],
  fix="Label the readout 'sensor readout' and enlarge it to at least 25% of frame width for the blank-out beat; hold the blank 0.5 s before the checker moves, as planned.",
  sources="phone_viewer #12")

d(group="lead", scene="V12 (music, documents)", frames="9248-9330 (5:08.3-5:11.0)", severity="polish", verdict="PARTLY",
  title="The J4 hold has a complete music stop, while the shot plan says the resolve starts under the hold",
  reason="A document mismatch, not a film defect: MUSIC_NOTES describes the stop, and the silence ends 2 frames before the V13 cut.",
  seen="Music stem silent 308.27-311.00 s; only footsteps, smug_exhale and uh_oh (f9311) play over the hold.",
  evidence=["skeptic/audio_checks.txt (S9_too_thunk, last rows)"],
  fix="Decide which is intended and update the other document; if the plan stands, bring in the first harp note of the resolve on his deflation (about f9318-9320).",
  sources="sound_sync #13")

d(group="lead", scene="V1 (audio)", frames="82-85 (0:02.7-0:02.8)", severity="polish", verdict="PARTLY",
  title="The readout beep at full gain covers the '-t's' of 'It's'",
  reason="Real in the speech band, but it covers the consonants of a function word that context and captions recover.",
  seen="Beep -24 to -25 dBFS in band at 2.75-2.82 s against the voice's '-t's' at -35 to -44. The picture contact (hand on sensor, f81-84) is right.",
  evidence=["skeptic/audio_checks.txt (S8_readout_beep_over_Its)", "sound_sync/bursts/V1_beep_f84.png"],
  fix="Lower readout_beep by about 8 dB or shorten it to end before 2.75 s; keep the cue on the contact.",
  sources="sound_sync #8")

d(group="lead", scene="captions", frames="7186-7194, 9031-9037, 9469-9474 and others", severity="polish", verdict="CONFIRMED",
  title="Seven caption in-times trail the speech by 0.18-0.26 s",
  reason="Spot-checked cue 91 by measurement.",
  seen="Cue 91 starts at 239.815 s while the narration's energy rises from about 239.55 s and is at full level by 239.70 s.",
  evidence=["skeptic/audio_checks.txt (S10_cue91_onset)", "sound_sync/srt_check.json"],
  fix="Snap each cue's in-time to the measured speech onset (or the segment's start frame) minus 1-2 frames.",
  sources="sound_sync #10")

d(group="lead", scene="captions", frames="2725-2798, 6741-6800, 6766-6771, 7395-7445", severity="polish", verdict="CONFIRMED",
  title="Caption breaks split phrases and number-with-unit, and one cue runs at 21 characters per second",
  reason="Read in subtitles_v2.srt.",
  seen="84/85 'through known' / 'positions,'; 92/93 'under a hundred' / 'dollars, ...'; 36/37 'farther from' / 'the wall spot.' (0.875 s); cue 86 'That's how the U was made.' in 1.24 s.",
  evidence=["sound_sync/srt_check.json"],
  fix="Re-break 84/85, 92/93 and 36/37 at phrase boundaries, keeping 'a hundred dollars' together; lengthen cue 86 into the following gap.",
  sources="sound_sync #11")

d(group="lead", scene="research/claims.csv", frames="182-405, 4440-4680", severity="polish", verdict="PARTLY",
  title="Claims ledger rows C02 and C22 no longer describe the film",
  reason="C02 and C22 confirmed. The 'wooden' point is rejected: the brief bans the word, nothing on screen or spoken says wooden, and a drawn mannequin is not the claim.",
  seen="C02 still says the plot was 'processed with the authors' published tracking code', but v2 plots the stored estimates (EVIDENCE_BRIEF §1.1a). C22 is marked 'not used in v2' while the '2018 · Stanford' plate is on screen (the plate itself is covered by C25). C20 contains 'wooden' in ledger text only.",
  evidence=["skeptic/frames/grid_museum.png", "accuracy_evidence/frames/f4545.png"],
  fix="Change C02 to 'the authors' saved position estimates (production not documented)'; set C22's scene to V7 (plate only) or point the plate at C25; drop 'wooden' from C20's wording.",
  sources="accuracy_evidence #6")

d(group="lead", scene="package (UPLOAD_PACKAGE.md lines 12, 66)", frames="n/a", severity="polish", verdict="CONFIRMED",
  title="UPLOAD_PACKAGE.md cites v2/QA_V2.md, which does not exist",
  reason="Checked: the file is missing.",
  seen="Line 12 says the thumbnail was 'Checked at 160-200 px wide ... see v2/QA_V2.md'; line 66 points to it for listening status.",
  evidence=["(file check: v2/QA_V2.md not found)"],
  fix="Write v2/QA_V2.md (thumbnail check, this defect log's outcome and the real listening status) before handover, or remove both references.",
  sources="accuracy_evidence #7")

# --------- order and ids ---------
for i, x in enumerate(D):
    x["_n"] = i
D.sort(key=lambda x: (SEV_ORDER[x["severity"]], x["_n"]))
for i, x in enumerate(D, 1):
    x["id"] = f"V2-R1-{i:02d}"

REJECTED = [
    ("phone_viewer #14", "V3", "925-1025", "The on-screen section question differs from the spoken question",
     "SHOTPLAN V3.1 specifies 'What survives the bounce?' over n07. It is the chapter's question (and the description's chapter name), answered by n09 'What survives is timing'. A deliberate design, not a defect, and re-titling would re-litigate the script."),
    ("phone_viewer #17", "V10", "7745-7850", "The same real track plays a third time within 20 s",
     "V10 answers a new question (the conditions), which is what the brief asks of a repeat. The V10.4 replay keeps the 'clothing: not recorded' stamp tied to a moving walker, and freezing it instead would add the dead hold confirmed in V2-R1-10. V1 and V10 are four minutes apart."),
    ("sound_sync #9", "V12", "9231-9248", "Punchline 'too.' shares its onset with the loudest V12 effect",
     "Measured: the voice is 10-12 dB above the effects in the 300-4000 Hz band through the word's core (307.75-307.92 s); the thunk is low-frequency and lands on the correct picture contact (f9234). No masking to fix."),
    ("accuracy_evidence #6 (sub-point)", "V7", "4440-4680", "The 2012 exhibit draws a 'wooden-style' mannequin",
     "The evidence brief bans the word 'wooden', not a drawn mannequin; nothing on screen or spoken says wooden. The rest of that finding is kept as V2-R1-43."),
]

LENS_CHECKS = collections.OrderedDict()
LENS_CHECKS["Phone viewer (390 px; sound-off, then captions and script)"] = [
    "Decoded the whole render at 2 fps at 390 px (642 frames) and read 41 phone-width contact sheets, then the same sheets with timeline words (`phone_viewer/sheets_soundoff/`, `sheets_words/`).",
    "Word-diffed `script/subtitles_v2.srt` against the timeline: 115 cues, identical text, no overlaps; one cue at 21 chars/s; five cues under 1.0 s.",
    "Ran `tools/qa_dense.py --fps 3` over the film; the only still run over 2.6 s is the end screen (its blink at f9552-9584 confirmed by crop diff).",
    "Hard-cut detection from 160×90 luma; phone-width bursts of the opening, timeline, paint blank, worked example, U hold, V9→V10 and the callback.",
    "28 key frames at full resolution and 390 px; text-height measurements; end-screen guide coordinates.",
    "Audio by measurement only: -15.5 LUFS, -1.3 dBTP, LRA 2.1 LU; RMS of the bed and pauses. Nothing was listened to.",
    "Not checked: listening, normal-speed playback, YouTube's real caption and end-screen overlay on a phone.",
]
LENS_CHECKS["Picture director, V1-V6 (f0-4385)"] = [
    "Dense 3 fps sheets for V1-V6 and still-run data (`picture_V1_V6/dense/`).",
    "Frame-difference cut detection f0-4440 (cuts at f182, f403, f421, f1732, f2283, f4115).",
    "Frame-exact bursts at every boundary and contact (`picture_V1_V6/bursts/`), about 40 full-resolution frames, and phone-width sheets.",
    "Measured label sizes, the dot size, the flat-paint run (f901-922 one colour), plan geometry against the partition, and the V1→V2 and V4→V5 match overlays.",
    "Read scene code for intent only (label sizes, arrival blend, flat-paint rule, J3b inset).",
    "Not checked: audio; normal-speed playback; V7 onward.",
]
LENS_CHECKS["Picture director, V7-V13 (f4386-9631, plus the V6→V7 boundary)"] = [
    "Dense 3 fps sheets for V6-V13 with words, motion and still-run data; about 60 full-resolution frames and frame-exact bursts at every boundary in the lens.",
    "Internal moves checked: museum truck, plates, stool, the checker's arm, hardware match, phone and padlock, sensor lift, V9 jiggle, rail and U card, walks, V10 re-layout, strip, V11 fold and tiles, V12 path, push and J4 lean.",
    "Measured title and label heights, board re-layout scale (uniform 0.86), wall band and spot positions, light paths against shelving and partition, foot contacts (planted to ±1 px).",
    "Whole-range scan for one-frame flashes (none) and an inventory of hard cuts (all on their lines).",
    "End screen measured: video guide x 1000-1799, y 290-739; disc centre (430, 600), diameter 300; nothing inside either guide plus 24 px; caption band empty; 300 frames.",
    "Not checked: audio; 4K master.",
]
LENS_CHECKS["Accuracy and evidence"] = [
    "Read the revision brief, evidence brief, script, shot plan, script JSON, claims.csv, timeline, SRT and the whole package (description, upload package, titles, chapters, end screen).",
    "Captions word for word against script_v2.json, SCRIPT_V2 and the timeline: 899 tokens, 0 differences; package SRT byte-identical; timing within 0.02 s of word frames.",
    "Full-resolution stills of every evidence board and number chip; frame-by-frame decodes of the V1→V2, V4→V5 and V9→V10 cuts and the museum truck; V10.4 counter crop; 390 px renders of the boards.",
    "Pixel measurements: waveform bump about 2,220 counts at ×250; ruler 2.65 m unfolded, 30 cm per ns; U raster 6×6 at 2:1 pitch.",
    "Read RealTrackBoard/V10 code: stored_xz index 6-474 step 2, no interpolation, behind-partition assertion.",
    "Package scanned for identifying strings (none), 'first' claims, safety claims, chapter times.",
    "Not checked: listening; the paper itself; per-frame value match of every plotted R8 point.",
]
LENS_CHECKS["Sound and sync (measurement only)"] = [
    "ebur128 on the encoded file: -15.5 LUFS integrated, -1.3 dBTP, LRA 2.1 LU; per-scene -15.3 to -16.2 LUFS; decoded AAC aligned to final_mix.wav at 0 lag; limiter at most 1.7 dB.",
    "Speech-to-music and speech-to-effects ratios on 100 ms and 40 ms windows, full band and 300-4000 Hz; the 11 audio_qc masking times checked one by one.",
    "38 physical events sampled against picture with per-frame bursts; 34 within 3 frames.",
    "Music drops and lifts verified against cuts; second-difference click scan on every stem, the mix and the render (no discontinuities).",
    "Captions: 115 cues, 42-char maximum line, two lines maximum, in-times a median +0.03 s after speech onsets.",
    "Not checked: any listening; tonal balance or performance; effects outside the 38 sampled.",
]
LENS_CHECKS["Skeptic and editor (this pass)"] = [
    "Confirmed frame-accurate seeking (the hard cuts at f182 and f1732 reproduce exactly), then re-extracted and looked at the frames or bursts behind every finding: 21 bursts in `skeptic/bursts/` and 24 frames and grids in `skeptic/frames/` (full resolution and 390 px).",
    "Per-frame difference runs for the claimed blank and still holds: f893-932, f5350-5415, f8046-8120, f7405-7540.",
    "Band-split level measurements (full band and 300-4000 Hz, 33-100 ms windows) on the narration, music and effects stems and the decoded render for all 13 audio findings (`skeptic/audio_checks.txt`, tool `skeptic/tools/aband.py`); re-measured loudness (-15.5 LUFS, -1.3 dBTP, LRA 2.1 LU).",
    "Read the governing text each finding relies on: REVISION_BRIEF, EVIDENCE_BRIEF_V2 §1, §4, §5, §6.7, §10, §11, SHOTPLAN_V2 global rules and V1-V13 rows, SCRIPT_V2 pauses, description.txt, UPLOAD_PACKAGE.md, claims.csv rows C02/C20/C22/C25, the SRT cues cited, timeline word frames and placed.json cues.",
    "Not checked: listening of any kind (no audio claim here is a listening claim); normal-speed playback; the 4K master; YouTube's real overlay rendering.",
]

ACCEPT = [
    ("1. By 10-15 s, can a new viewer explain the surprising result and which part is real?",
     "Yes. The blocked sight line and X land at 2.0 s (f60); the taped 'Real data' board hard-cuts in on 'researchers' at 6.07 s (f182) with 64 px 'sensor', 'blocked' and 'estimated position'; 'That dot is their position estimate. Not a photograph.' runs 10.3-13.6 s. Real data (taped board) and our drawings (flat plan) look different. Weak spots: the unspoken 'sped up' chip is too small for a phone (V2-R1-14), and nothing on the board says which band is the wall (V2-R1-18)."),
    ("2. By 30 s, do they understand why arrival time carries hidden-side information and why a timing sensor is needed?",
     "Yes. The short trip and the long way round race full frame (14.4-20 s); the shared timeline shows 'wall echo', the later 'his echo' and 'a few nanoseconds'; it shrinks into a full-frame 'time-of-flight sensor / times its own light's round trip' close-up (22.8-26.5 s); the first arc and '?' arrive by 29 s. The full-frame timeline is complete for only about 1 s (V2-R1-17), and the section ends on 0.9 s of blank frame at 0:30 (V2-R1-02)."),
    ("3. Can the key diagrams and labels be followed at 390 px without zooming or pausing?",
     "Mostly. Every 48-64 px label reads at 390 px, and no still run outside the end screen exceeds 2.6 s. Failures: the 30-34 px integrity chips (V2-R1-14), the V10.2 conditions column (V2-R1-09), the worked-example chain's timing (V2-R1-05), the small insets and motions (V2-R1-25, -31, -34, -38) and the V3.4 path origins (V2-R1-06)."),
    ("4. Does each section answer a new question rather than restating a claim beside another board?",
     "Yes. The five question titles map to sections (what survives the bounce; how a delay becomes a location; how new is this; why a cheap sensor is harder; what can it do and where does it fail), and each board appears where it answers its question: R10 waveform in V4, the U in V6, R8 again in V10 only to attach its conditions. The 1.5 s U thumbnail in V9.4 is a deliberate callback, not a restatement (its placement is V2-R1-08)."),
    ("5. Is the reconstruction revealed alongside the geometry rather than saved for minute five?",
     "Yes. 'likely location' at 2:14-2:17 hard-cuts to the real U board at 2:17.2 (f4115) on 'And here's a real one', and the U builds from 36 real partial sums under 'same 3×3 sensor'. The payoff is cut short: the finished U gets no hold (V2-R1-01)."),
    ("6. Is the history brief, accurate and useful to the modern hardware story?",
     "Yes. 2012 MIT, the 2018 plate in passing and 2021 Wisconsin + Milan pass in about 14 s with year-and-team plates; 'research equipment' then the 2021 cheap-sensor precedent (Callenberg et al.) on screen; then the 2026 plinth and 'Their new idea'. No 'first' claim. V7 runs 35.7 s including the 2026 material; the history proper is inside the brief's 20-30 s. Ledger bookkeeping for the 2018 plate is V2-R1-43."),
    ("7. Are performance, pauses, music and transitions engaging when actually played back?",
     "Not answerable in this environment: nobody listened, and no lens claims to have heard anything. Measured: -15.5 LUFS, -1.3 dBTP, LRA 2.1 LU; narration about 20 dB over music while speaking; 34 of 38 sampled effects within 3 frames of picture; music lifts land on the real-data cuts. Measured cue problems: V2-R1-12, -13, -16, -22, -24, -37, -40. Judged from frames, the transitions work except the blank at 0:30 (V2-R1-02), the missing U hold (V2-R1-01) and the roll-up float (V2-R1-28). A human listening pass at normal speed is still required, as the brief demands."),
    ("8. Are evidence contexts and assumptions accurate after editing, without overloaded caution text?",
     "Yes on screen, with fixes. R8, R10 (waveform and U), R1 and our room stay visibly separate; no number crosses the firewall; the guesser never appears on real material. Softened cues: the missing 'Real data' headline in V10.1 (V2-R1-04) and the U card over our plan (V2-R1-08). The description is missing required provenance (V2-R1-03, V2-R1-15). The only overloaded caution text is the V10.2 column (V2-R1-09)."),
    ("9. Does the closing deliver one payoff and lead naturally into a functional end screen?",
     "Yes. One takeaway line (n31) and one callback gag (he pushes the partition, the readout goes blank, the checker simply looks), then a hard cut to a 10.0 s end screen whose guides measure exactly as planned (video x 1000-1799, y 290-739; disc centre (430, 600), diameter 300), with the caption band clear and one look-and-blink in the last 3 s. Weak spots: the small readout inset (V2-R1-38) and the swell over 'corner.' (V2-R1-13)."),
]

# --------- write JSON ---------
out_json = [{k: x[k] for k in ("id", "group", "scene", "frames", "severity", "title", "fix", "verdict")} for x in D]
(ROOT / "review_r1" / "defects.json").write_text(json.dumps(out_json, indent=2, ensure_ascii=False) + "\n")

# --------- write markdown ---------
cnt = collections.Counter(x["severity"] for x in D)
bygs = collections.Counter((x["group"], x["severity"]) for x in D)
L = []
A = L.append
A("# Video 02 v2, review round 1: verified defect log")
A("")
A("Render reviewed: `exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4` (1920×1080, 30 fps, 9,632 frames, 5:21.1, final mix).")
A("Five lenses reviewed it (phone viewer, picture V1-V6, picture V7-V13, accuracy and evidence, sound and sync). This log is the skeptic's pass: every finding was re-checked against frames, bursts, audio measurements or the governing documents, then confirmed, narrowed or rejected, merged where two lenses found the same thing, and given a final severity, an owning group and a fix.")
A("")
A("Frame N is at N/30 s. Evidence paths are relative to `qa/v2/review_r1/`. Groups: G1 = V1, V2; G2 = V3, V4; G3 = V5, V6; G4 = V7, V8; G5 = V9; G6 = V10, V11; G7 = V12, V13; lead = audio, captions, package, global.")
A("")
A("Nobody listened to the soundtrack in this environment. Every audio statement below comes from a measurement or from comparing cue frames to picture.")
A("")
A("## Summary")
A("")
A(f"{len(D)} defects kept ({cnt['blocker']} blocker, {cnt['major']} major, {cnt['minor']} minor, {cnt['polish']} polish); 54 reviewer findings came in: 3 were rejected outright and one sub-point was rejected (table below); 15 duplicate findings were merged into 7 defects (each defect's From line names its sources), and one finding was split into two by scene group.")
A("")
A("| Group | Blocker | Major | Minor | Polish | Total |")
A("|---|---|---|---|---|---|")
for g in GROUPS:
    row = [bygs[(g, s)] for s in ("blocker", "major", "minor", "polish")]
    A(f"| {g} | " + " | ".join(str(v) for v in row) + f" | {sum(row)} |")
A(f"| **All** | {cnt['blocker']} | {cnt['major']} | {cnt['minor']} | {cnt['polish']} | {len(D)} |")
A("")
A("**Fix first:**")
A("")
A("1. **V2-R1-01 (major, G3).** The finished real U, the film's reconstruction payoff, gets no hold: the board rolls up about 0.1 s after 'U.', and the music resolve plays under the roll-up.")
A("2. **V2-R1-02 (major, G1).** 0.9 s of blank beige frame at the 30-second mark, between the hook question and section B.")
A("3. **V2-R1-03 (major, lead).** The description omits that the partition and sensor marker on the 'Real data' tracking board are plotting constants, and omits the retroreflective processing setting; both are required by the evidence brief.")
A("")
A("No blocker: no wrong fact on screen or in narration, the evidence firewall holds, and every key teaching moment is readable.")
A("")
A("| ID | Sev | Group | Scene | Frames | Defect | Verdict |")
A("|---|---|---|---|---|---|---|")
for x in D:
    A(f"| {x['id']} | {x['severity']} | {x['group']} | {x['scene']} | {x['frames']} | {x['title']} | {x['verdict']} |")
A("")
A("## Defects")
A("")
for x in D:
    A(f"### {x['id']} · {x['title']}")
    A("")
    A(f"- **Scene:** {x['scene']} · **Group:** {x['group']} · **Frames:** {x['frames']} · **Severity:** {x['severity']}")
    A(f"- **Verdict:** {x['verdict']}. {x['reason']}")
    A(f"- **What the frames show:** {x['seen']}")
    A("- **Evidence:** " + "; ".join(f"`{e}`" if not e.startswith("(") else e for e in x["evidence"]))
    A(f"- **Fix:** {x['fix']}")
    A(f"- **From:** {x['sources']}")
    A("")
A("## Rejected findings")
A("")
A("| Finding | Scene | Frames | Claim | Why rejected |")
A("|---|---|---|---|---|")
for r in REJECTED:
    A(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} |")
A("")
A("## Checks performed, by lens")
A("")
for k, v in LENS_CHECKS.items():
    A(f"### {k}")
    A("")
    for s in v:
        A(f"- {s}")
    A("")
A("## Acceptance questions (REVISION_BRIEF)")
A("")
for q, a in ACCEPT:
    A(f"**{q}**")
    A("")
    A(a)
    A("")
(ROOT / "REVIEW_V2_R1.md").write_text("\n".join(L))
print(len(D), dict(cnt))
for g in GROUPS:
    print(g, {s: bygs[(g, s)] for s in ("major", "minor", "polish") if bygs[(g, s)]})
for x in D[:3]:
    print(x["id"], x["title"])

# V3 visual inspection of the approved V2 render (one inspector per interval)

Inspected: the approved V2 review render (frames extracted with ffmpeg, full res and phone width), the dense 3 fps captioned sheets in `dense/`, and the scene source. Each finding names the fix that was proposed; what was applied and verified is in `../../V3_CHANGELOG.md`. Image paths under /tmp were the inspectors' scratch files and are not kept.

## S1 0:00–0:27.2 (global frames 0–816), answer counter cold open, plus the S1→S2 lift (frames 801–817)

The hook, the hanging question, the three hand-overs, the physical stamps and the "Very professional. Very fictional." punchline all work, and the lift into S2 is clean: frames 816 and 817 match. Ranked by priority, the owner's job is not met in three ways. (1) Slip A's last title line "Learning.”" is clipped by the card's bottom edge in every close-up, and in every scene that uses the shared slip art. (2) Slip B's WRONG stamp prints across its false year "2005" and its coral ring. (3) The false years are only ringed in the zoom-1.03 row shot at about 26 px on screen, which is unreadable at phone width, and the chip that follows names no years. Separately, the "Lead author" chip covers "OpenAI" on the real paper. There are three small polish items: the punchline caption spills for 2 frames, clerk A's hand vanishes when the lift starts, and the close-up slices a slip text line at the bottom edge.

### [major] S1-1 · 0:07.6–0:11.0 (f228–330, slip A close-up), 0:24.3–0:25.8 (f729–774, joke shot), 0:26.7→ (f801–816 lift) and S2 start (f817+); also wherever AnswerSlipArt i=0 appears (S3, S9, S10)

- **What:** Slip A wraps to 7 body lines (23 px × 1.26). The 7th line, the end of the false title "Learning.”", runs past the inner gold border and is cut off by the card's bottom edge (overflow hidden). Only the tops of the letters show, so the false title (the thing the owner wants easy to identify) visibly ends cut off at every size, including 1.75× at the S2 hand-off.
- **Source:** source/src/components/v2/AnswerSlip.tsx:57 (padding '16px 22px'), :68 (lineHeight 1.26); mirrored overlay box source/src/components/v2/S9_Docs.tsx:127, :131
- **Fix proposed:** For i===0 only: padding '16px 22px' → '12px 22px' and lineHeight 1.26 → 1.2 (fontSize stays 23, card width stays the same, so the wrap is identical). This raises the 7th baseline by about 13 local px, from about 274 to about 261, inside the gold inner border at 271. Make the identical change in S9_Docs SlipReplica (padding '12px 22px', lineHeight 1.2) so S9's lit-word overlay stays registered. Do not change SLIP_W/SLIP_H.
- **Risk:** Every scene showing slip A: recheck the S1 close-up (f305) and joke shot (f760), the S1→S2 cut (f816/817), S3 line 966, the S9 scan overlay alignment and the S9→S10 match cut (H910). Check that the highlighter underlines of adjacent title lines don't touch at 1.2. S4_Props and S5_Slip keep their own copies and are unaffected.

### [major] S1-2 · 0:16.5 (f496, stamp B hits) to 0:25.8 (f774); the year ring is drawn at 0:17.9 (f538), during "Not one even had the right year"

- **What:** Slip B's WRONG stamp sits at the shared anchor (232, 214). B's text ends one line lower than A's, so the stamp's top border runs straight through "University in 2005." It hides "in" and crosses the false year and its coral ring, exactly when the narration says no one had the right year. It is still crossed in the zoom-1.57 joke shot. Slip C's stamp only touches the bottom of its 2007 ring, and slip A's year is clear.
- **Source:** source/src/scenes/S1_Counter.tsx:34-35 (STAMP_LX/LY shared), :267 (stamps prop), :538-541 (stampPt aims the StampArm)
- **Fix proposed:** Give each slip its own anchor: const STAMP_AT = [SLIP_STAMP_AT, {x: 232, y: 246}, SLIP_STAMP_AT]. Use STAMP_AT[i] in stampPt (line 539). At line 267 pass {text: 'Wrong', x: STAMP_AT[i].x, y: STAMP_AT[i].y, size: i === 1 ? 44 : 48, rotate: i === 1 ? -5 : -11, scale, sx, sy}. B's stamp then lands in the empty lower band of the card (about local y 211–285), below the year line.
- **Risk:** The StampArm aim follows automatically through pts. Recheck that hit 2 (f493–499) prints where the stamp lands. Stamped B/C slips appear only in S1, so no hand-off is affected. The far-left bottom corner overhangs the card edge by about 5 px, which is acceptable for a stamp. Recheck the chip overlap (stamp bottom world ≈ 883 < chip top 902).

### [major] S1-3 · 0:17.6–0:20.0 (f527–600): rings drawn f530/538/546, chip from f558 (settled f566), camera leaves for the ticket at f593

- **What:** None of the false years is ever shown large. B's 2005 and C's 2007 are never marked in their close-ups. All three years are only ringed in the zoom-1.03 row shot, where the year text is about 26 px on screen (about 9 px on a phone), so only the ring shapes read. The coral chip that lands on "year." says "Three different years · none of them right", which repeats the narration but does not show the years. This is the owner's 'selective emphasis or a short enlarged excerpt' job.
- **Source:** source/src/scenes/S1_Counter.tsx:608-614 (chip; size 40 at line 610, text at 611)
- **Fix proposed:** Make the existing chip the enlarged excerpt: <Chip tone="coral" size={44}>2002 · 2005 · 2007 — none of them right</Chip>. That is about 45 px on screen at zoom 1.03, meeting the ≥44 px rule for critical text, at about the current width. The years match the SLIPS data, and the coral chip matches the coral rings. Keep the rings, the cue (f558/566) and the exit (K.and+30) unchanged. The chip then gets about 1 s of settled time before the camera moves at f593.
- **Risk:** On-screen text only; narration, SRT and captions are unaffected. Check that the chip still overlaps slip A's bottom-right corner only as slightly as it does now, and that it doesn't collide with the moved B stamp (S1-2). Verify at phone width.

### [major] S1-4 · 0:21.7–0:23.7 (f652–712), the 'lead author' reveal on the genuine paper header

- **What:** The teal box closes on the name line only. The 'Lead author' chip hangs 12 px below it (top:100%), right on top of Kalai's 'OpenAI' affiliation line. Both the box's bottom border and the chip cut through that line, leaving letter fragments of 'OpenAI' peeking out between them on the real document for 2 s.
- **Source:** source/src/scenes/S1_Counter.tsx:54 (AUTHOR rect: h = imgY(0.585) − imgY(0.43)); chip placement :676-682
- **Fix proposed:** Line 54: extend the box to enclose the name and affiliation, h = imgY(0.72) − imgY(0.43). The box bottom moves from about 575 to about 635 px on screen, so the chip lands about 647–697 px down, at x 230–505, on blank paper. That is clear of 'September 4, 2025' (x 815–1135) and inside the paper's lower edge (about 745).
- **Risk:** The travelling ring (lines 545–558) simply lands on a taller box. Recheck f649–660, the box fill and the readability of 'Lead author' (about 47 px), and the source-tab beat f680–712.

### [minor] S1-5 · 0:26.20–0:26.23 (f786–787)

- **What:** When 'Very fictional.' slams in at 1.3× scale, the caption box is still widening. For 2 frames the coral words run past the box's right border onto the background, and they butt against 'professional.' with no gap. From f788 the caption is clean.
- **Source:** source/src/scenes/S1_Counter.tsx:571 (spread = tw(g, K.fictional - 1, 6)), :698 (scale lerp(1.3, 1, cap2))
- **Fix proposed:** Line 571: spread = tw(g, K.fictional - 4, 4, E.out), so the box is fully wide by f786. Line 698: lerp(1.3, 1, cap2) → lerp(1.16, 1, cap2). The slam stays, but the word stays inside the box.
- **Risk:** The punchline's look must stay the same: same settled frames, and the stamp_light SFX at fictional+2 is unchanged. Recheck f782–792.

### [minor] S1-6 · 0:26.67→0:26.70 (f800→801), first frame of the lift

- **What:** Clerk A's front hand rests on top of slip A until f800. At f801 the slip is handed to the screen-space LiftedSlip, which draws over the whole world, so the hand vanishes beneath it in one frame (a layer pop at the start of the lift).
- **Source:** source/src/scenes/S1_Counter.tsx:484-488 (after the stamp the arm returns to restR, which lies on the slip), :688 (LiftedSlip drawn above the world)
- **Fix proposed:** In clerkPose after line 486, for i === 0 only, move the hand off the card just before the lift: armR = mixArm(armR, reach({...ch, bob: p.bob}, 1, ch.x + 34, CLERK_Y - 0.98 * 290), tw(g, S1_END_LIFT - 8, 6)). This is a small proud hand-to-chest, finished by f799, so nothing of the clerk sits on the slip when it lifts.
- **Risk:** It adds a small move during the checker's deadpan. Keep it small and late so it doesn't pull focus. Check that the hand doesn't intersect the visor or face in the cu framing (f793–801) and that the arm stays drawn over the body.

### [minor] S1-7 · 0:26.3–0:26.7 (f788–801), the punchline close-up

- **What:** The cu framing (zoom 2.3) puts the frame's bottom edge straight through slip A's first body line: only the tops of 'Adam Tauman Kalai's Ph.D.' show. This breaks the 'text never cut by the frame' rule on the held punchline frame.
- **Source:** source/src/scenes/S1_Counter.tsx:184 (SHOTS.cu {cx: 300, cy: 468, zoom: 2.3})
- **Fix proposed:** cy 468 → about 452. The frame bottom (cy + 540/2.3) moves from about 703 to about 687 world, into the blank gap between the 'GPT-4o · 9 May 2025' line and body line 1. The slip header stays fully in frame and the checker's headroom is unchanged (frame top about 217). Confirm in a still that no glyph tops remain, allowing for the slip's −1.5° tilt.
- **Risk:** The LiftedSlip start pose comes from camAt(801), so the lift starts 16 world px higher but still ends exactly at HANDOFF. Recheck f788–817. The caption is screen-space and unaffected.

**Keep (intentional):**

- Ticket strip visible at the top edge around f4–14: it is the ticket dropping in on its strings (drop at f15), not a crop.
- Slips rising behind the counter, cut off by the counter top (f199–207 and the B/C equivalents): an intentional mask for 'rises from behind the counter'.
- Bare fist peeking over the bottom edge at f539–541: the stamp arm exiting downward after the third stamp.
- Stamp arm hovering over clerk A's face at f471–486: the anticipation hover before the first hit; A's flinch is visible at the hit (f486–490).
- Slip C's title highlight finishing as the camera starts its pull-back (f410–421): the close-up is still effectively held through about f418 with the ease-in, so the highlight reads.
- WRONG stamp over slip A's highlighted title: intended; the title was already emphasised in the uncluttered close-up.
- Ring crossing the paper title at f646–651 and the ticket rising past the ANSWERS sign at f647–651: the ring in flight to the author line and the ticket being pulled up, both transitional.
- Slips sliced at the frame bottom in the ticket shot (f600–636): background during the 'And Adam Kalai?' push; the ticket is the subject.
- 'Very professional.' sliding left as the caption box widens (f785–790): the designed spread that makes room for the punchline.
- Lift into S2: the slip shrinks from about 2.5× to 1.75× while the world falls away and the caption fades (f801–816). It reads as the world dropping out from under the slip, and S2's first frame (817) matches f816 exactly; keep it.
- Pencil at the checker's temple: the costume accessory ('pencil behind the ear' in cast.ts), not a misplaced prop.
- Coral and saffron rings meeting over 'at' in '2002 at CMU': hand-drawn marks; both target words stay readable.

**Phone width:** At 640×360 the hook reads. The question (54 px, about 50 px on screen) and the teal 'Adam Kalai's' are clear. The ticket's guard-rail label is about 28 px on screen at the opening wide and about 33 px in the ticket shot: legible, just under the 30 px guide in the wide. In the slip close-ups (zoom 1.4–1.5) the body text is about 35 px; the highlighted title block and A's ringed 'CMU' and highlighted '2002' are identifiable, though the words themselves are small. What does NOT read is the false years: B's 2005 and C's 2007 only get emphasis in the zoom-1.03 row shot at about 26 px (about 9 px on a phone, only the ring shapes show), and B's 2005 is under its stamp (S1-2). The current chip (about 41 px) reads but has no years, which is why S1-3 puts them there at 44 px. Also readable: the 'Lead author' chip (about 47 px), the source tab (about 39 px) and the caption 'Very professional. Very fictional.' (64 px, screen-space).

## S10 4:13.2–4:48.235 (global frames 7596–8646): payoff at the answer counter, sign-off and end card

S10 is in good shape. The match cut from S9 is identical, and the callback (the counter, the clerks, the person's "Trust me, I read it somewhere." stamped SOURCE?) and the two checks ("What's the evidence?" / "Does it actually say this?") read well, including at phone width. The end card leaves a large clean area for YouTube end-screen elements (two video tiles plus a subscribe circle fit in a mock-up) for about 10 s. "New episodes twice a week" matches the channel brief and the description sign-off. The defects, most important first: (1) audio dead air. The music bed dies out at about 4:40.5 under the last sentence, and after "subscribe." (4:42.8) the last 5.4 s are near-silence (−72 dBFS floor) with only eight soft ticks, right over the end-screen hold. (2) The last line of slip A's claimed title, "Learning.”", is cut in half by the slip's bottom border. This is most visible when the slip is presented at 1.3× for "does it actually say this?". Smaller polish: the coral ring around "this" cuts through "y" and "?". The honesty line could be a little larger for phones. The end card's "Sources, excerpts and credits are in the description." is only true once the description's Sources placeholder is filled.

### [minor] S10-1 · 4:40.5–4:48.235 (f8415–8646); voice ends 4:42.8 (f8484), so 5.4 s tail; last 1.6 s (4:46.7–4:48.2, f8601–8646) is floor only

- **What:** The end-card hold has dead air. The end chord (struck at the logo, 4:35.3) has died out by about 4:40.5, so 'New episodes twice a week, if you'd like to subscribe.' has almost no music under it. After 'subscribe.' the mix sits at the narration stem's −72 dBFS floor. The only sounds are soft SFX: checker footsteps, two pencil taps and a marker sweep at 4:43–4:44.3, the Subscribe chip_pop at 4:45.7 and the GOT pop_tick at 4:46.6, with peaks of −21 to −31 dBFS. There is no music at all in the last ~7.5 s. This plays exactly while the YouTube end-screen elements would be up, and silence there signals 'video over'. Technically the ending is clean: the last mix.wav sample is at −73 dBFS, there is no DC offset or click, and the review MP4 audio ends on digital zero with duration matching (288.230 s wav vs 288.235 s mux).
- **Source:** tools/make_music_v2.py:268–274: the end-card chord is guitar 4.0 s, vibes 4.0 s and strings 5.0 s from ec = P['end_card'] + 0.25 (≈275.3 s), so nothing sounds past ≈280.3 s. tools/make_music_v2.py:378–380: the 2.5 s bed fade-out at the very end currently has nothing to fade. The S10 tail SFX are at scenes/S10_Payoff.tsx:330–336.
- **Fix proposed:** Hold a quiet tonic under the end card instead of silence. In compose(), line 274, change the strings to ring to the end: `ev['strings'].append((ec, P['total'] - ec, n, 30))` for n in (60, 64, 67), which gives ≈12.9 s at velocity 30 instead of 5.0 s at 34. Then add one soft re-strike after the last word: `ev['vibes'].append((P['final'] + 0.25, 4.0, 72, 34))`. P['final'] is the s36 end, ≈282.6 s. The existing 2.5 s fade (lines 378–380) then lands the pad at zero on the last frame. Re-render the bed and re-mix with `python3 tools/mix_v2.py --sfx-db -2 --sfx-duck-db 4`, as in LISTENING_CHECKLIST item 17. Aim for a pad clearly under the voice: ducked under s36, then roughly −30 to −35 LUFS momentary in the tail. If the owner prefers the silent ending, record that as a decision and skip this fix.
- **Risk:** Null-test the new bed against the current one before 275.0 s; it must be identical. Check that the ducked pad does not blur 'New episodes twice a week, if you'd like to subscribe.' (4:40.1–4:42.8). Re-measure integrated loudness (−16.04 LUFS reference) and true peak (−1.30 dBTP); the tail pad is far below the peaks, so neither should move. Check that the pad's fade has reached zero at sample 13,835,040 (288.23 s) so the hard video cut stays click-free.

### [minor] S10-2 · Whenever slip A is on screen: 4:13.2–4:32.4 (f7596–8172). Most visible in the habit framing, 4:24.0–4:31.5 (f7921–8145), and above all at 4:30.0–4:31.0 (f8100–8130), when the title is highlighted and the coral leader points at it. The same art is clipped in S9 (e.g. f7593) and wherever slip A appears in S1–S3.

- **What:** The last line of the fabricated title, "Learning.”", overflows the slip. The gold inner rule runs through the tops of its letters and the ink border cuts it at about mid x-height, so only the upper half of the word shows. This is the claim the beat asks about ('does it actually say this?'). It is presented enlarged (SLIP_PRESENT s = 1.3 at camera zoom 1.25, ≈1.63× on screen), which makes the clipping obvious. The word is still guessable, but it is cut-off essential text on the film's main evidence prop.
- **Source:** components/v2/AnswerSlip.tsx:57 (padding '12px 22px' for i = 0), :68 (body lineHeight 1.2 for i = 0; 23 px serif, 7 lines), :21 (SLIP_H = 280, overflow hidden at :61). This box model is duplicated for S9's per-word overlay in components/v2/S9_Docs.tsx:127 (padding '12px 22px') and :131 (fontSize 23, lineHeight 1.2). The S10 leader end is at scenes/S10_Payoff.tsx:1029 (claimPt local y 252).
- **Fix proposed:** Keep SLIP_W and SLIP_H, so every hand-off (H910, the S1→S2 lift, the S3 copy) stays put, and win back ~15 local px inside the card for slip A only. At AnswerSlip.tsx:57, change padding '12px 22px' to '8px 22px'. At :68, change lineHeight `i === 0 ? 1.2 : 1.26` to `i === 0 ? 1.13 : 1.26`. Mirror both values exactly at S9_Docs.tsx:127 and :131 so S9's lit words still sit on the printed words. If the leader no longer lands beside the title's end, move S10's claimPt y from 252 to ≈244.
- **Risk:** The art is shared, so this touches S1, S2, S3, S9 and S10; coordinate with the S1 and S9 inspectors. The ring and highlight marks are spans and move with the text. The fixed-position stamps (S1 WRONG at SLIP_STAMP_AT 232,214; the S9/S10 CLAIM FAILS at H910.stamp) will sit ~10 px higher relative to the last lines; check they still read as overlays and don't hide the year or 'CMU'. Recheck stills at S1's slip close-ups, the S2 hand-off, S9's lit-word frames and the S9→S10 match cut (f7595/f7596), plus S10 f7960 and f8118.

### [opportunity] S10-3 · 4:30.0–4:31.5 (f8101–8145; drawn on from THIS_T = f8101)

- **What:** The coral marker ring around 'this' on card ② is 16 px wider than the word on each side. Its left edge runs through the descender of the 'y' in 'say', and its right edge cuts through the '?'. The ring reads as untidy at full size and makes 'say this?' slightly harder to read on a phone.
- **Source:** scenes/S10_Payoff.tsx:667 (th = cardWordX(CARD_TEXT[2], 'this')) and :673 (`<RingMark t={rT} tone="coral" padX={16} padY={10} width={6} />`).
- **Fix proposed:** Ring the question mark too and tighten the loop. In HabitCard2, size the ring box from `cardWordX(CARD_TEXT[2], 'this?')` and set padX={8}, keeping padY={10}. Leave the leader's origin (the separate cardWordX(..., 'this') near line 1026) unchanged.
- **Risk:** Only card ② is affected. Check that the ring's right edge stays inside the card border: the text ends at ≈760 of 860 px. Confirm that the leader still starts under the ring at f8103–8111.

### [opportunity] S10-4 · 4:40.4–4:48.235 (f8413–8646)

- **What:** The source-credit line 'Sources, excerpts and credits are in the description.' is 32 px. That meets the 30 px guard-rail minimum but is only ≈11 px tall at phone width. It also sits at y 952–995, inside the band YouTube's hover control-bar gradient covers on desktop. It is the film's only pointer to its sources.
- **Source:** scenes/S10_Payoff.tsx:868 (HON_PX = 32), :870 (HON_TOP = 952), :871 (HON_TEXT). The checker's tap target follows it (tapPt = HON_X + 8, HON_TOP + 2 in checkerEndRig).
- **Fix proposed:** Set HON_PX 32→36 and HON_TOP 952→940. The underline width (hW) and the checker's pencil target are derived from these constants and follow automatically.
- **Risk:** At 36 px the line spans x≈300–1350. Keep YouTube end-screen elements above y≈900 (the packaging note already recommends y 520–900). Recheck the pencil-tip contact at the taps (f8518, f8525) and the underline draw (f8527–8541).

### [minor] S10-5 · 4:40.4–4:48.235 (f8413–8646), where the end card says sources are in the description

- **What:** The end card promises 'Sources, excerpts and credits are in the description.' The current description draft carries credits and the excerpt credit, but its Sources/Notes block is still the placeholder '[[SOURCES AND NOTES: filled in by the claims audit]]'. If uploaded as-is, the on-screen promise would be false.
- **Source:** qa/v3_inspect/packaging/DESCRIPTION_DRAFT.md:39; scenes/S10_Payoff.tsx:871 (HON_TEXT).
- **Fix proposed:** Before upload, replace the placeholder with the final Sources/Notes block from qa/v3_inspect/claims/SOURCES_DRAFT.md. It must include arXiv html v1, the Nature later publication, the CMU thesis PDF and tiktoken, plus the Notes sentences. Then check the 5,000-character limit (~4,550 estimated). No film change is needed.
- **Risk:** None to the render. Only the length limit and the no-angle-brackets rule when pasting into YouTube.

**Keep (intentional):**

- S9→S10 match cut at 4:13.2 (f7595/f7596): slip A at H910 is pixel-identical across the cut, then the camera pulls out while the slip settles and clerk A's hand comes onto it (f7597–7618). Keep.
- Slivers at the frame edge during camera moves are intentional: the checker's pencil and hand at the left edge during the push to the habit framing (f7912–7918; clean from f7921, checked at f7950/f8050/f8125), and clerk A's sliver and the person entering from the right during the pan to window 3 (f8174–8190).
- The boards sink while the camera pushes in (f7897–7917). It is a short, directional clear-out on 'So when an answer matters'. Keep.
- Conclusion-mode dimming (darker wall, grey arches, 4:16.9–4:31.4) and SOUNDING RIGHT receding under a paper veil at the verdict (f7874+) are deliberate.
- The set strike 4:35.1–4:35.6 (f8252–8268) leaves 1–2 frames of plain saffron before FUTURE pops (f8269). Same background colour, no flash. Keep.
- The wordmark builds word by word into reserved slots, so FUTURE appears left of centre at first (f8270–8290). Intentional.
- The end card's empty middle (about x 280–1900, y 470–940) is the YouTube end-screen space. A mock-up with two 634×357 video tiles at y 530–887 and a 220 px subscribe circle fits cleanly (/tmp/claude-0/s10_inspect/endscreen_mock.png). The layout is settled from about 4:37.3, so a 4:38–4:48 end screen (10 s, within YouTube's 5–20 s) works; keep the bottom-left (checker and honesty line) free of elements.
- Hard cut on the full card with no fade (f8646). The checker's last hop ends at f8641. Clean for an end screen.
- 'New episodes twice a week' (chip f8402, narration 4:40.1) matches CHANNEL_BRIEF ('Two releases a week'), the project brief (owner intends twice a week) and the description sign-off. No change.
- The Subscribe chip pops on the spoken word (f8463), with one gentle nudge (f8571) and the GOT wobble (f8601) late in the hold. Small, in the top band only, outside the end-screen zone.
- The stamp_heavy and gavel on 'too.' (f8221, 4:34.03) are about +2 dB over the voice for ~40 ms mid-vowel; the word onset (4:33.92) is clear. It is the punchline hit, so keep unless LISTENING_CHECKLIST item 9 fails on playback.
- Clerk A's take-back (f8165–8171): for ~6 frames his hand is behind the slip while it lowers behind the counter. This layering compromise avoids the hand drawing over the counter front. Keep.
- Music entering on the cut at 4:13.3 after near-silence is an intended payoff downbeat.
- The −72 dBFS floor in the narration stem between phrases and at the tail is inaudible. The mix ends at −73 dBFS and the MP4 audio ends on digital zero, so there is no click.

**Phone width:** Checked at 640×360 (/tmp/claude-0/s10_inspect/phone_sheet.png, frames f7700, f7885, f8000, f8118, f8215, f8246, f8646). Every beat's essential point reads:
- "So why is AI so confidently wrong?" with 'confidently' in coral.
- The SOUNDING RIGHT / BEING RIGHT titles, their sublines and the 'Kalai (2001) thesis title page' chip.
- The struck "Does it sound right?" and both numbered checks with their underline and ring.
- The person's slip "Trust me, I read it somewhere." and the SOURCE? stamp (small, about 12 px, still legible).
- The end card's wordmark, tagline, "New episodes twice a week" and Subscribe chips.

What does not read at phone width:
- The thesis title-page thumbnail on the BEING RIGHT board (about 5 px text). Acceptable: the teal chip names it.
- Slip A's body text in the wide shots. It is read in the 1.3× habit close-up, but its last line, "Learning.”", is clipped (S10-2).
- The honesty line "Sources, excerpts and credits are in the description." is legible but tiny (about 11 px) (S10-4).

## S2 0:27.2–0:44.0 (global frames 817–1319): title, three claim cards, brand card, reveal into S3

S2 holds up well. The cut in from S1 matches its pose, the title gag works (the gap that "Confidently" drops into), the three claims are read and acted out one card at a time, scores settle at 7 vs 6, "illustrative" and the Kalai et al. (2025) citation are both on screen, motion.json shows no still runs, and the brand card's lift-away into S3 is clean. I found six small defects, all in transitions, and each has a fix of one to three lines. In priority order: (1) the "The short version" chip appears on "short" and is hidden straight away behind card 2, both as it drops and as it bounces. (2) The FUTURE / GOT / WEIRD words run into each other while they spring in on the brand card. (3) Card 1's "ai" tile disappears about 150 px short of its slot and jumps into the sentence. (4) The "illustrative" label is 26 px, below the 30 px minimum for guard-rail text, and it is dimmed for most of the scene. (5) A drop shadow flashes on slip A for one frame at the S1→S2 cut. (6) Card 1 drops onto the title before the title has left the screen.

### [minor] S2-1 · 0:31.2–0:31.6, frames 937–947 (chip appears 936; fully covered 937–941, half covered 944–947, clean from 948)

- **What:** The 'The short version' chip springs in on the word 'short' and is hidden behind claim card 2 straight away, first while the card falls (937–941) and again during its landing bounce (944–947, lower half of the chip cut off). The scene's own title chip shows for only about 2 of its first 12 frames.
- **Source:** source/src/scenes/S2_ShortVersion.tsx:359-368. The chip block (359-365) renders before the ClaimCard map (366-368), so the cards draw over it. The chip sits at y 54 to about 127. Card 2's drop (drop(g, LAND[1]=942, 760, 10)) passes through it, and the bounce (8% of 760 = 61 px) lifts the card top from 140 to about 79.
- **Fix proposed:** Move the chip JSX (lines 359-365) after the ClaimCard map (after line 368) so the chip stays on top and card 2 falls and bounces behind it. Nothing else changes.
- **Risk:** Card 2 now passes behind the label during 937–941, which reads as a card sliding under a sticker. Recheck frames 934–950. Card 3's drop (943–954) is not affected because it is clear of the chip's x range.

### [minor] S2-2 · 0:42.8–0:43.1, frames 1284–1287 (GOT runs into FUTURE) and 1289–1292 (WEIRD overlaps the T of GOT)

- **What:** On the brand card each word pops in with a scale spring that overshoots so far the words merge: the card reads 'FUTUREGOT' and then 'GOTWEIRD' for about 4 frames each.
- **Source:** source/src/scenes/S2_ShortVersion.tsx:349 (rev = sp(...SNAP) for each word), passed at :386 to Wordmark (components/Sets.tsx:153, which scales each word from its centre with a fixed gap of 0.24×size = 36 px). SNAP {damping 12, stiffness 210, mass 0.8} has a damping ratio of about 0.46, so it overshoots by about 19%, not the ~8% its comment in lib/motion.ts says. At 1.19× a 480 px WEIRD grows about 46 px on each side.
- **Fix proposed:** Fix it in S2 only (do not edit the shared Sets.tsx). At line 349: `const pop = (f: number) => Math.min(1.05, sp(g, f, SNAP)); const rev: [number, number, number] = [pop(STING + 2), pop(STING + 6), pop(STING + 10)];`. Alternatively use a firmer spring such as {damping: 18, stiffness: 260, mass: 0.8} (about 8% overshoot).
- **Risk:** The pop is a little less bouncy. Timing and SFX (pop_tick at STING+2/+6/+10, logo_hit at +12) do not change. S10 uses its own S10Wordmark and is not affected. Recheck frames 1276–1300.

### [minor] S2-3 · 0:34.6–0:34.7, frames 1039–1041

- **What:** Card 1's chosen 'ai' tile flies up toward the sentence but disappears at 1041, while still about 150 px short of its slot (at 1040 it covers 'Tauman Kal'). In the next frame the 'ai' is already in the sentence, so the key action of claim 1 ends in a jump rather than a landing.
- **Source:** source/src/scenes/S2_ShortVersion.tsx:163 `const fly = tw(g, K.come + 1, 9, E.inOut)` runs 1035→1044, but :165 `landed = g >= K.next + 1` (1041) removes the tile at :189 when fly is only about 0.85.
- **Fix proposed:** Line 163: `const fly = tw(g, K.come + 1, K.next - K.come, E.inOut);` (6 frames, so fly reaches 1 exactly at 1041, together with the token_lock SFX and the sentence squash). Optional: change the end x on line 170 to `sw + 6` so the tile's centred 'ai' finishes over the inline 'ai' (it currently ends about 40 px to the right).
- **Risk:** The flight is 3 frames quicker. The arc and lift bell are unchanged. Recheck frames 1031–1046, and check that the tile still reads as rising above the sentence box rather than sliding across the text.

### [minor] S2-4 · 0:32.3–0:42.1, frames 969–1264 (dimmed from 1065 to 1260)

- **What:** The guard-rail chip 'illustrative' on card 1 (the probability bars) is set at 26 px on screen. V2_DIRECTION §6 requires at least 30 px for guard-rail text. From 1065 it also takes on the card's dim (opacity 0.62, scale 0.97), so for most of its 10 s on screen it is about 25 px at low contrast, roughly 9 px at phone width.
- **Source:** source/src/scenes/S2_ShortVersion.tsx:206 `<Chip tone="paper" size={26}>illustrative</Chip>` (dim applied at :306).
- **Fix proposed:** Line 206: size={30}. There is room: the chip is about 54 px tall with bottom 18, so its top is about 458, and the 'scores: how likely each piece is' line ends at about 415. It grows to about 215 px wide, anchored right at 22. Leave the card dim as it is.
- **Risk:** None expected. Check that the chip stays inside the card's rounded corner at frames 980 and 1215.

### [minor] S2-5 · 0:27.23–0:27.33, frames 817–820 (S1 last frame 816)

- **What:** Slip A's drop shadow flashes at the S1→S2 cut. In S1's last frame (816) the slip has no lift shadow. S2's first frame (817) draws the full lift shadow (24 px offset, 20 px blur, 0.28 alpha), which fades over 4 frames. A cut meant to be invisible gets a 1–2 frame shadow pop, as if the slip jumps up again.
- **Source:** source/src/scenes/S2_ShortVersion.tsx:358 `lift={g < K.start + 4 ? 1 - (g - K.start) / 4 : 0}`. S1's liftPose (S1_Counter.tsx:721-724) ends with lift = sin(u·π) = 0, so the two sides disagree at the cut.
- **Fix proposed:** Remove the lift prop from the SlipOnScreen on line 358 (lift defaults to 0), so S2's first frame matches S1's last frame. The impact squash (WRONG after-thump) and the thud SFX at K.start+1 stay.
- **Risk:** None. Pose and scale already match. Recheck frames 814–822.

### [minor] S2-6 · 0:31.0–0:31.15, frames 931–934

- **What:** Claim card 1 falls onto the departing title and covers 'Why AI Is' for 4 frames while the title is still mostly on screen. The title's exit starts slowly and the camera is still easing back from its push-in.
- **Source:** source/src/scenes/S2_ShortVersion.tsx:127 `const out = tw(g, K.heres - 2, 12, E.in)` (ends 935; also drives the kicker at :137). Card 1 is visible from about 931 (LAND[0] = K.heres + 12 = 937, drop over 10 frames, :56 and :292).
- **Fix proposed:** Line 127: start the exit 4 frames earlier, `tw(g, K.heres - 6, 12, E.in)`, so title and kicker are off screen by 931, the first frame card 1 shows. LAND, SFX and the chip timing stay as they are.
- **Risk:** The title starts leaving at 919, in the pause after 'sure?' (the glint ends at 921, 'Here's' at 925). Check frames 915–940 to confirm the glint finishes before the title moves.

**Keep (intentional):**

- The gap in 'Why AI Is So ___ Wrong' at 0:28.8–0:30.0 (863–898) before 'Confidently' drops in on 'sure?' is the joke's setup. Keep it.
- Card flips go edge-on, so card 2 is invisible for exactly one frame at 1070 (and the same on the other flips). Intentional.
- In card 2, the '…in 2002 at CMU' slip enters clipped at the card's left edge (1069–1074) and leaves clipped at its right edge (1110–1128). This is the deliberate ride past the closed EVIDENCE CHECK booth.
- Rolling scoreboards show in-between digits at 1185–1222. The settled values (guesser 6 then 7 on 'quietly', honest 6) are correct and match S6's 7 vs 6.
- The brand card's landing bounce shows a paper strip at the bottom for 1276–1281. It is the physical bounce; the cards underneath are already unmounted and nothing shows through.
- From GUESSING PAYS landing (1252) to the brand card covering it (~1270) is about 0.6 s. The voice is on 'guessing.' and the claim label has already been up for 3 s, so this reads as a deliberate sting. Do not delay STING: LIFT is fixed at K.end−14 by the reveal, and the tagline only just settles before it.
- The brand card's lift-away reveal into S3 (1305–1318) is clean. S3's conveyor establishing shot is living and uncropped under it.
- The camera push-in to zoom 1.05 during the title (859–907) crops nothing. The kicker and the full title stay inside frame.
- Card dimming: the non-active cards recede and all three relight at STAMP+8 (1260) for the recap. Intentional focus control.
- The S1→S2 cut pose (slip position, scale, rotation) matches exactly; only the shadow differs (S2-5).

**Phone width:** Checked at 640×360 (/tmp/claude-0/s2qa/phone.png). The main point of every beat reads on a phone: the title with coral 'Confidently', the 'The short version' chip once clear (S2-1), the three claim labels (44 px, about 15 px on a phone), card 1's sentence 'Adam Tauman Kalai' with the highlighted 'ai', 'EVIDENCE CHECK' / CLOSED, the 7 vs 6 scoreboards with guesser/honest, the GUESSING PAYS stamp, and the FUTURE GOT WEIRD wordmark. Weak or not legible on a phone: the 'illustrative' chip (26 px, about 9 px on a phone, dimmed for most of its time on screen; see S2-4); the citation chip 'argued in Kalai, Nachum, Vempala & Zhang (2025) · simplified' (30 px, about 10 px on a phone, which meets the guard-rail minimum but is only just readable); and, neither essential, the '…in 2002 at CMU' belt slip (28 px serif) and 'not on the writing route' (32 px coral on light teal, low contrast once card 2 dims). The tagline 'AI moves fast. We make it make sense.' is also small (45 px) and only fully up for about 12 frames before the lift, but it is branding, not content.

## S3 0:44–1:27 token machine (global frames 1319–2592, plus the S2→S3 reveal from 1305 and the S3→S4 cut at 2593)

S3 is in good shape. The camera paths are continuous; camPath composes moves without jumps. The selected tokens can be followed at every stage: the '2' latch, the chute drop and the belt landing (1862–1876), the micro-cycles, the rewind, the year push and the final 'Algorithms' drop. The labels stay up while the narration explains them. The 'illustrative numbers' tag is in frame whenever percentages are, at 33–51 px on screen. The Algorithms match cut is exact: a blend of 2592 and 2593 puts the glyphs on top of each other. Only two small things are worth fixing, both minor. The real o200k id label 'id 1361' only flickers up for about 10 frames. The last title line of slip A ('Learning.”') runs past the slip's gold inner rule and is clipped by the card edge. That second one comes from the shared AnswerSlip art and shows the same way in S1.

### [minor] S3-1 · 0:57.7–0:58.2 (frames 1731–1745); Kal's id label 1703–1745

- **What:** During "“Kal” and “ai.”" the token-id label under 'ai' ('id 1361', 38 px on screen) springs in at about 1731. It is legible for only about 9–10 frames (1734–1743), then shrinks away at 1740–1745 together with Kal's label as both halves drop back into the row. It reads as a flicker, not a label. Kal's label gets about 1.4 s, so the two halves are treated unevenly. Narration does not explain the ids, so this is polish, not clarity-critical.
- **Source:** source/src/scenes/S3_Tokens.tsx:147 (aiId: K.ai + 4); :149–150 (backKal/backAi = aiEnd−7/−4); :1046–1050 (both labels share the exit tw(g, KA.backKal − 2, 5, E.in))
- **Fix proposed:** Give each label its own exit, keyed to its own tile's return, and start the ai label 3 frames earlier. (1) Line 147: aiId: K.ai + 1 (frame 1728). (2) Lines 1046–1050: carry h.back and use (1 − tw(g, h.back − 1, 4, E.in)) instead of the shared KA.backKal − 2 exit. Kal's label then exits 1741–1745 (unchanged) and ai's exits 1744–1748, so 'id 1361' is legible about 1730–1746 (≈16 frames instead of ≈9). At h.back + 3 the label top is at TILE.top + h.y + 82 ≈ 672 world, still above the row (732), so it never overlaps the belt tiles. If the lead prefers, removing both id labels is also acceptable, because nothing narrated depends on them.
- **Risk:** Purely local to the Kalai beat. Recheck 1726–1755 so the ai label does not overlap 'Ta/uman/'s' as it descends. The camera move to the machine (KA.backAi + 9 = 1754 → 1778), POWER (1778) and the SFX token_lock cues (KA.backKal/backAi + 8) are unaffected because KA.back* is not changed.

### [minor] S3-2 · 0:44.4–0:46.4 (frames 1333–1392, slip A on the reader ledge during "Let's take ChatGPT's answer apart")

- **What:** Slip A's text is 7 serif lines (23 px × 1.26) under the header, which does not fit the 280 px card. The last title line 'Learning.”' sits on and below the saffron inner rule, and its descenders are cut by the card's bottom edge. At S3's 1.45× slip scale and about 1.3 zoom this is the slip's largest clean view in the interval, so the cut is visible. The same overflow shows in S1 (frame 760, 'Very professional.' beat), so it is a property of the shared art, not of S3's lip mask.
- **Source:** source/src/components/v2/AnswerSlip.tsx:28 (fs 23 for slip A), :57 (padding '16px 22px'), :66 (detail marginBottom 6), :68 (lineHeight 1.26); SLIP_H = 280 at :17. S3 only places it: S3_Tokens.tsx:953–972.
- **Fix proposed:** This is shared art, so coordinate with the S1 interval fix and do not patch it in S3. Smallest change: tighten slip A's vertical budget by about 17 px so the 7th line clears the gold rule (bottom ≈ 268 of 280). Use lineHeight 1.26 → 1.2 for i === 0 (≈ −10 px), padding top 16 → 12 (−4) and the detail marginBottom 6 → 3 (−3). Avoid changing fs, because it can rewrap the lines, and avoid changing SLIP_H, because every scene's slip placement and the S9→S10 hand-off use it.
- **Risk:** It changes slip A everywhere it appears (S1 counter, S1→S2 lift, S3 ledge, S9 verify, S10 payoff). Because every scene uses the same component, hand-offs stay matched, but recheck with stills: the coral ring round '2002' and the saffron ring round 'CMU' (span-attached) must still enclose their words without touching the adjacent lines, and the WRONG / 'Claim fails' stamps at SLIP_STAMP_AT (232, 214) must still cover the title area as intended.

**Keep (intentional):**

- Kalai close-up (1610–1754): the idle machine's dark screen is cropped on the right third by design (shotKal comment: 'a clear chunk of the machine, not a sliver'). 'Adam' keeps its left margin.
- Belt-row tiles cut at the left frame edge in the mach/mach2/year/cards/roof shots: it is a continuous conveyor sentence scrolling off-frame, not a framing error.
- Slip falling in through the top frame edge (1325–1332) and sinking behind the lip into the intake slot (1382–1392): a physical entrance and exit.
- e0a→e0 slow creep (1305–1376), print-run pan (1395–1439), the 24-frame pan from the Kalai close-up to the machine (1754–1778, peak ≈90–100 px/frame mid-move, eased) and the year/cards/roof moves: all continuous, one move per idea.
- Scorer power-on screen flicker 1782–1786 (cream → dim → cream): a deliberate, motivated one-off, not an unintended flash.
- Rewind 2036–2058 and fast-forward 2490–2510 with the ◀◀/▶▶ window: transitional bars, rolling digits and tokens flying back up the chute are intentional. Judge the settled values (C15 settles 31/26/12/9/7 with '1' = the true 2001 digit at 26%; final 'Algorithms' 83/6/3).
- Rolling % drums show split digits mid-roll during every race (e.g. 1838, 1937, 1971): odometer transitions, not errors.
- 'Algorithms' passing behind the chute's left wall gate for ~1 frame (2562) and dropping behind the mouth collar: the chute front is deliberately layered over the falling tile.
- Readout cards half-hidden behind the housing as they retract (2281–2295), and the empty lower-left area 2134–2203 that holds the room for the TRUTH METER card.
- Modules lowered through the top frame edge on cables (2330–2460), with the hooks rising away after landing.
- Final push 2573–2592 (19 frames, log-zoom 1.1→3.75) and the S3→S4 match cut: the blend of 2592/2593 (/tmp/claude-0/s3insp/blend_cut.png) shows the 'Algorithms' glyphs coincide exactly at screen centre, 150 px em. The push begins 2 frames after the landing during the slow ease-in, which is acceptable.
- The 'illustrative numbers' tag is on screen whenever percentages are (flips down at 1792, before the first bars at 1797). It stays in frame through the year, cards, roof and FF shots and leaves only during the final push, after the bars have drained.
- Wide s09 shot (1439–1586) with the empty upper-left wall: the token row is the subject on the lower third at ~45 px glyphs, and the composition is deliberate (shotS09 comment).

**Phone width:** At phone width (640×360, /tmp/claude-0/s3insp/phone.png, 8 key frames), the essential point of every beat reads:
- Token tiles are 14–22 px: s09 wide ≈14, Kalai close-up ≈21, machine shots ≈17–19, roof shot ≈15.
- Percentages are 13–17 px. The favoured '2' row and its saffron highlight, the dashed path to the '?' slot, 'How likely the chunk is' (~15 px) and the NOT MEASURED stamp all read.
- The tokenizer sign (~17 px) and module labels (~15 px) read.
- The 'illustrative numbers' tag is the smallest guard-rail text at ~11 px in the roof shot (33 px at 1080) and ~13–17 px elsewhere. It is legible as a tag but small. It meets the ≥30 px at 1080 rule throughout.

Text that does not read at phone size:
- Card labels 'WHAT THE SCORE MEASURES' / 'TRUTH METER' (~10 px).
- 'READING' (~9 px).
- The token ids 'id 22187' / 'id 1361' (~13 px but brief).
- Slip A's body text on the ledge (~14 px; the ringed 2002/CMU and WRONG stamp do read).

All of these are secondary or decorative except the slip, whose point (a wrong, stamped answer) still reads.

## S4 library, 1:26.4–2:03.2 (global frames 2593–3696, plus the 6-frame wipe tail to 3702)

The library works and should be kept. The match cut from S3 is exact. The pull-back reveals the hand properly. The spine taps, the label read, the drawer pull with its stick and end-stop, the cake beat, the strips flying from the shelves, the seal slam and the two hedge flicks all make real contact. The drawer construction holds up: the front comes forward and down, the box has walls and standing cards, and the card is clipped by the front as it rises. The one real defect is the moment the card comes out of the drawer (1:42.7–1:43.2). For about 6 frames the clerk's fist and forearm cover the card's 'KALAI, A. · 2001' header. Then in one frame the card jumps in front of the arm, and the drawn thumb slides across the card face for 3 frames. One small opportunity: the assembled title never settles on the card before it flips into the slip, because the last word is still popping when the flip starts.

### [major] S4-1 · 1:42.7–1:43.2 (global f3082–3095; arm over card f3083–3089, layer swap f3089→f3090, thumb on card face f3092–3094)

- **What:** Lifting the blank catalogue card out of the K drawer. The L hand grips the card at its top centre, and the fist sits over the header (covering 'A. ·' of 'KALAI, A. · 2001') with the forearm hanging down across the card face (f3084–3089). At f3090 the draw order switches: the card jumps in front of the arm in a single frame, the fist vanishes behind it and the elbow peeks out below. The grip-thumb ellipse then appears while the hand is still travelling from the top centre to the left edge, so a thumb slides across the header and 'title:' line (f3092 on the 'A' of KALAI, f3093 on 'title:') before reaching the edge at f3094–3095. This is the reveal of the scene's key prop, during the camera push to the card shot.
- **Source:** source/src/scenes/S4_Library.tsx:406-408 (behindMode starts at LIFT + 3 = f3090); :578-591 (the L hand goes into the box to `top = heldToWorld(held, W/2, 6)`, 6 px below the top edge, i.e. over the header line, then lerps across the face to GRIP.card.L; the thumb is shown with `grip.L = toEdge`); :929-935 (heldEl drawn before the front arms when !behind, after them when behind); :936-949 (thumb overlay drawn at t ≥ 0.3). Cue frames: PLUCK = K.titleQ − 1 = 3078, LIFT = 3087 (lines 135-137).
- **Fix proposed:** Three small edits in S4_Library.tsx. (1) Line 408: start behind mode when the fingers take the card, while it is still almost entirely clipped inside the drawer: `g >= PLUCK && g < RELEASE + 14`. The swap then happens while only the card's top strip, about 12 world px, shows above the drawer front, and the forearm rides behind the rising card for the whole lift. (2) Line 583: pinch from just above the top edge so the knuckles sit on the edge instead of over the header: `heldToWorld(held, (kind==='card'?CARD_W:SLIP_W)/2, -10)` (local y −10 instead of 6). (3) Line 590: show the L thumb only once the hand reaches the left edge, `grip.L = clamp((toEdge - 0.8) / 0.2, 0, 1)` instead of `toEdge`, so no thumb crosses the face. The thumb fades in from about f3094. Nothing else changes: cues, timing, SFX and the R-hand join at LIFT + 6.
- **Risk:** Re-check every frame from f3074 to 3100: the hand entering the drawer box (it stays in front of the card until PLUCK); the elbow showing under the rising card (it should read as an arm behind the card); the knuckles above the card's top edge during the camera push (PLUCK + 2 to +22); the R hand joining at f3093–3098. Check the f3098 settle and the held-card shot through f3110. behindMode is used only for draw order and the thumb overlay (lines 751, 930-950), so the hold, the hedge tags and the exit (behind until RELEASE + 14) are unaffected.

### [opportunity] S4-2 · 1:53.5–1:54.2 (global f3404–3426)

- **What:** Title assembly. The fifth word, 'Machine Learning.', lands at f3404 on 'title-shaped' with a 5-frame pop (to f3409). FLIP = K.shaped + 4 = f3408 starts narrowing the card at about f3410, edge-on at f3414. So the completed title 'Boosting, Online Algorithms, and Other Topics in Machine Learning.' never sits still on the card; it is still popping when the flip starts, and the flip lands before the narrator reaches 'answer.' (f3420). The slip then presents the title readably, so nothing is lost, but the payoff of the assembly (blank filled, title complete) gets no settled beat.
- **Source:** source/src/scenes/S4_Library.tsx:150 (`const FLIP = K.shaped + 4`). Values derived from FLIP: camera move line 281 (FLIP + 2, 20 f), ride gaze 491, flipLook 498, outlineFade 785, SFX 226-227. FOOT2.in = K.answer + 4 (line 159).
- **Fix proposed:** Hold the completed card about 8–10 frames and land the flip on 'answer.': `const FLIP = K.answer - 4` (f3416 instead of f3408; edge-on at f3422, slip settled by about f3432). Nothing else needs to change. The camera move ends at FLIP + 22 = f3438, still 8 frames before the seal lifts off (SEAL_HIT − 12 = f3446).
- **Risk:** The slip now has about 14 settled frames instead of about 22 before the seal flies. Check that the seal flight from f3446 does not start during the end of the camera move. FOOT2 (f3424) now rises during the flip rather than after it; if the two compete, move FOOT2.in to K.answer + 10. Re-check f3400–3470 and the sound cues that follow FLIP (card_flick FLIP + 6, glint FLIP + 13).

**Keep (intentional):**

- Pull-back from the match cut (f2612–2640): the clerk's cap, head and arm enter from the left edge and his body is cut by the frame bottom. This is the deliberate 'whose hand is it' reveal, and the hand stays on the book end throughout.
- S3→S4 match cut (f2592/2593): 'Algorithms' is at the same place and size. It is exact; do not touch.
- Catalogue sliver at frame left during the wideIn→med move (about f2748–2770): it is transitional and gone once the med shot settles.
- Open K drawer: the front comes forward and down, larger, covering all but a thin strip of R–S below. This is the designed perspective of the drawer coming toward the viewer (CAT.out/grow), not a construction error.
- The clerk's jacket overlapping the right end of the open drawer and the catalogue's right column is an ordinary cutout layering cheat and reads correctly.
- The saffron outline on the K drawer stays lit from the label tap to the hip bump (f3053–3370). It marks the chosen drawer.
- The fist briefly overlaps the left half of the 'K' plate during the label tap (f3048–3054) before dropping to the pull. It lasts 2–3 frames, the K lights on the tap, and the selection reads.
- Each word strip briefly overlaps the previously landed word just before it lands (e.g. f3384, f3393), and the bold strip swaps to plain serif text with a 1.18 pop on landing. This is a stylised paste, timed to pop_tick.
- The seal crosses over 'Machine' during its 4-frame hang and slam (f3450–3457) and then lands clear of the text at the bottom right.
- The large frame-difference spike at f3458 in motion.json is the intended camKick (1.6 %) on the seal slam over a detailed background, not a flash.
- The hedge tags arrive partly hidden behind the slip edges (f3608–3616, f3656–3664). The design has them clip on from behind the slip; the flicking hands are in front of the tags.
- The empty slot and cake sit near the top of frame in the slot/fill/ent shots. The framing is deliberate and the flame stays inside the edge.
- The clerk stands alone with arms down for about 4 frames (f3690–3694) after the slip leaves and before the S5 wipe covers him. This is a held smirk-and-blink reaction.
- The brief edge-on flip frame (f3414) with both forearms crossing in front of the narrow card is a 1-frame transitional state.

**Phone width:** Checked at 640×360 (/tmp/claude-0/s4insp/phone_a.jpg: f2720, 2880, 3100, 3170, 3255, 3407, 3560, 3630, 3673). These read: the headline 'What the model learned from'; the 'Methods.', 'Algorithms.' and 'Machine Learning.' chips (small but legible); the card's 'KALAI, A. · 2001' and the blank 'title:' box; both guard-rail footers (34 and 32 px at 1080); the 'no pattern to work it out from' label; the slip's 'ChatGPT · GPT-4o · 9 May 2025 …is entitled: "Boosting, Online Algorithms, and Other Topics in Machine Learning."'; and the 'I think'/'maybe' tags with their strikes. These do not read: the assembled title inside the card's title box (13.5 world px × 2.06 zoom ≈ 28 px at 1080, about 9 px on a phone); the word strips in flight are marginal; the spine labels are decorative. None of these blocks the point of a beat, because the readable slip repeats the title for about 9 s.

## S5 "actual record", 2:03.2–2:26.8 (global frames 3696–4404, including the S4→S5 wipe-in and the S5→S6 iris-out). Narration s17 3706–3966, s18 3981–4259, s19 4286–4376.

S5 already does the owner's job. The thesis title gets a read-along close-up of about 3 s (3803–3894, title about 110 px on screen). University and date get a 2.4x close-up (3910–3962) with "Carnegie Mellon University" boxed, the date boxed and 2001 highlighted in saffron. The CMU title page is shown as it is (crop/zoom only), the confident-font joke lands, and 4K test crops of the record are sharp. Two small defects: (1) through all three verdicts the slip's teal tick sits on "(completed", the line above "CMU"; (2) in the off-by-one beat the record's "1" swells into a doubled glyph with a thin sliver of the preceding "0", on the genuine document. Opportunities, in priority order: hold the fully marked close-up a few frames longer before the pull-out, swap in the staged 2x thesis raster for 4K (no code change needed), keep the brass rim on the iris edge so the lens visibly becomes the spotlight, and shorten the double image when the magnified view fades in.

### [minor] S5-1 · 2:14.7–2:18.9 (f4040–4167; tick drawn 4040–4047, removed with the other marks 4153–4167)

- **What:** On the slip line '2002 at CMU) is entitled:' the teal verdict tick is placed above and right of the CMU ring. It covers the '(' and 'o' of '(completed' on the line above, so the line reads '(c✓mpleted' for the whole comparison. The two rings also squeeze 'at' to read as '2002)at(CMU'. This text overlap sits on the exact line the comparison is about.
- **Source:** components/v2/S5_Slip.tsx:41-45 (Tick at left: calc(100% + 5px), top: -21, 35x30: it rises into the previous line); :84 (renders it); scenes/S5_Record.tsx:327 (tick: tw(g, TICK, 7, E.out) * off); :119 (TICK); :164 (indicator_yes SFX at TICK)
- **Fix proposed:** Remove the slip tick; the teal ring on CMU and the '✓ university · right' chip already carry the verdict. In S5_Record.tsx:327 set `tick: 0` (or delete the key). Move the indicator_yes SFX (line 164) from TICK to CHIP_LAND[0] (4045) so it lands with the ✓ chip. Every line around CMU carries ink, so there is no clean place to move the tick on the slip. Optional: reduce the ring padX at S5_Slip.tsx:78 and :83 from 5 to 3 so 'at' keeps some air.
- **Risk:** Very low. Recheck f4040–4060 for the 'university right' beat (ring + record CMU glow + chip should still read as the confirmation). Check the SFX timing against the chip_pop at CHIP_LAND[0]-1 so the two sounds don't stack harshly; lower indicator_yes by 2 dB if they do.

### [minor] S5-2 · 2:15.8–2:16.1 (f4073–4083, peak around f4078)

- **What:** 'Off by one': on the record, the final '1' of 'May 16, 2001' is enlarged 1.55x by multiplying a zoomed copy of the scan over itself. The original '1' stays visible inside the bigger one, giving a smeared double-stemmed '1'. The copy's 4 px crop margin also takes in the right edge of the neighbouring '0', which shows as a stray vertical line inside the '0'. The enlarged '1' also pokes above and below the saffron highlight. This alters the look of the genuine document. It only lasts 10 frames at 1080p but is plain in a paused frame and at 4K.
- **Source:** components/v2/S5_Page.tsx:163-171 (scaled copy: scale(1 + 0.55*bump), mixBlendMode multiply, crop offset `TP.d2001[0] - 4 / k`, which takes in about 13 image px left of the '1'); scenes/S5_Record.tsx:529 (digit: {bump: bell(g, DIGITS + 2, 10)})
- **Fix proposed:** Stop scaling the genuine glyph. Replace the block at S5_Page.tsx:165-171 with a mark on the real '1': a 5 px teal underline under d01 (left d01.x-4, top d01.y+d01.h+4, width d01.w+8, borderRadius 3, transform scaleX(t), transformOrigin left). At S5_Record.tsx:529 drive it with `tw(g, DIGITS + 2, 5, E.out) * off` instead of the bell. The record's '1' then stays paired with the slip's coral '2' (which stays coral via digit.on) until RETRACT, so 2002 vs 2001 is easier to follow for the whole phrase. Keep the pop_tick SFX at DIGITS+2. Fallback if the bump should stay: crop exactly to the glyph (`TP.d2001[0] - 1 / k`, inner box left -1, width d01.w + 2) and cut the scale to 1 + 0.3*bump. That removes the '0' sliver but not the doubling.
- **Risk:** Low. Recheck f4066–4100 (date glow at DATE_GLOW, ring on 2002, chip at CHIP_LAND[1]) so the underline doesn't compete with the teal date box; it sits inside the box under the saffron. Check the retract at 4153–4167 so it clears with the other marks.

### [opportunity] S5-3 · 2:11.7–2:12.1 (f3952–3962; pull-out f3962–3990)

- **What:** The record close-up reaches its fully marked state (CMU boxed, date boxed, 2001 highlighted) at f3952. The pull-out starts at f3962, while '2001.' is still being spoken. The key 2001 evidence therefore settles for only about 0.33 s (about 0.45 s counting the slow ease-in) before the camera leaves. The marks stay on in the wide, so nothing is lost, but the brief asks for highlighted evidence to settle.
- **Source:** scenes/S5_Record.tsx:113 (PULL = K.y2001 + 20); :232 ({at: PULL, dur: 28, to: SHOTS.wide}); :535 (the dim veil fades from PULL)
- **Fix proposed:** PULL = K.y2001 + 26 (f3968) and pull dur 28 → 24. The wide then lands at f3992 instead of f3990, before 'ChatGPT' finishes and 16 frames before SLAP (4008). The settled close-up gains 6 frames (about 0.53 s total).
- **Risk:** The checker's walk-in (WALK 3980–4000) now overlaps more of the pull; check f3980–4008 for a sliver of the slip or checker at the left edge while the camera is still zoomed. Check that TO_CMP (4013) still has a clear wide before it.

### [opportunity] S5-4 · 2:07.4–2:12.1 (f3806–3962, title and date close-ups, zoom 2.1–2.43); also the bump copy at f4073–4083 if it is kept

- **What:** 4K source-crop check. thesis_titlepage_top.png (4080x3894, a clean vector render, not a scan) is shown at 0.3 world px per image px. In the date/CMU close-up (zoom 2.43) a 4K render upsamples it about 1.46x (0.3 × 2.43 × 2); the title close-up is about 1.3x. The existing 4K test frames are acceptably sharp, and the staged 8160x7788 render is visibly a little crisper on the glyph edges.
- **Source:** components/v2/S5_Page.tsx:13 (TP_IMG), :137 and :168 (Img sized explicitly from TP_IMG.w*k / TP_IMG.h*k)
- **Fix proposed:** Replace public/img/thesis_titlepage_top.png with qa/v3_inspect/assets4k/staging/thesis_titlepage_top.png (8160x7788, same 1.0478 aspect). Leave TP_IMG at 4080x3894 and the TP coordinates as they are: they are logical units, and both Img elements size from TP_IMG, so this is a drop-in with no code change.
- **Risk:** Confirm the staged file is the same page render at exactly 2x (no shifted crop). Check in 4K frames 3880, 3950 and 4110 that the read-along highlight, the DrawBoxes and the 2001 highlight still sit on the words. Decode memory per frame rises (about 63 Mpx image); watch render concurrency.

### [opportunity] S5-5 · 2:26.2–2:26.8 (iris f4386–4404; rim lost at f4389)

- **What:** The iris starts at r0 = 130, the inner glass. With E.inOut the radius passes the rim's outer edge (about 149 screen px) by f4389, after which the brass rim and ink outlines are gone. A plain pale-gold disc with no outline then grows over the slip and caption (f4390), turning into the dark spotlight disc (f4394). For a frame or two the lens looks swapped for a flat sticker rather than becoming the spotlight. The handle stays attached below the disc until it is covered.
- **Source:** Main.tsx:93-98 (Arrive, iris branch: only a clipPath circle; nothing draws the rim)
- **Fix proposed:** In the iris branch, return the clipped AbsoluteFill plus an overlay SVG (on top, since the incoming Sequence has the higher z) drawing the rim at the current radius r. Use screen-space values matching S5's lens at ZC 2.08: ink circle 4 px at r, saffron stroke 19 px at r+9.5, ink circle 4 px at r+19. Fade the overlay from opacity 1 at r ≤ 400 to 0 at r = 700. The lens then visibly widens into the spotlight.
- **Risk:** Shared file (Main.tsx), and S6 is the only iris in the film. Recheck f4384–4406 against S6's first frames (spotlight pool centred on H56) and that the S5 caption box under the ring doesn't produce a messy overlap at f4392–4396.

### [opportunity] S5-6 · 2:23.2–2:23.5 (f4296–4304)

- **What:** While the camera is still pushing into the s19 close-up, the magnified view inside the lens cross-fades in over 8 frames. For about 6 frames the glass shows a double image: the plain '2002 at CMU / “Boosting' with a half-transparent 1.8x 'oosti' on top of it.
- **Source:** scenes/S5_Record.tsx:363 (view: tw(g, AT_SLIP - 8, 8, E.inOut)); :591-599 (magView opacity = mag.view)
- **Fix proposed:** view: tw(g, AT_SLIP - 3, 3, E.inOut), shortening the overlap from about 6 frames to about 2. The camera is still moving then, so the faster switch reads as the lens coming into focus.
- **Risk:** Minimal. Recheck f4298–4306 for a visible pop; if it pops, use 4 frames.

**Keep (intentional):**

- f3690–3702: the record slides in from the right under the S4→S5 wipe, cut by the wipe edge (f3696) and with a thin S4 strip at the left on f3700. This is the designed hand-off.
- f3782–3806 and f3894–3910: the pushes into the title and down to the date/university crop the page and source tab while the camera moves (f3790, f3905). These are deliberate document push-ins; nothing important is cropped once the camera lands.
- The read-along highlight on the title (3803–3891), the dim veil around the active lines, and the 2.4x close-up with CMU boxed on 'Mellon' and the date boxed on 'May': this is the core of 'easy to follow'. Do not flatten it.
- f3962–3992: during the pull-out the frame shows empty board on the left while the checker and slip enter. Transitional.
- f4015–4027: after letting go of the slip, the checker's hand arcs back across the slip's lower-left text. A natural release; it lasts 12 frames.
- The record card's right edge sits about 25 px outside the frame in the comparison (cmp, zoom 1.27). This was chosen so the chips (x 330) and the title box (1734) both fit at readable size; widening the shot would shrink the evidence text.
- f4283–4311: the push into s19 cuts the record mid-word ('in Mach', the source tab). Intentional camera move; the record is meant to leave frame.
- The magnified text inside the lens is slightly greyer than the surrounding ink (glass tint), and the rim covers '2002 at' in the s19 close-up. This is part of the magnifier look and the joke framing.
- The caption 'A confident font is still' appears at 'is' (f4337) rather than at 'A confident', and 'just a font.' lands on 'just'. This is deliberate punchline timing; the joke works.
- The iris turns dark with a gold spotlight (f4394 onward): that is S6's stage, centred on H56, as designed.
- The slight frame-to-frame change on the record during cmpDrift and recDrift is sub-pixel drift, not visible shimmer (measured mean change ≤ 0.6/255 per frame; the holds are static).

**Phone width:** At 640x360 the essential point of every beat reads:
- **Establishing shot (f3720):** the thesis title is about 20 px on a phone (61 px in the frame).
- **Title close-up (f3880):** about 37 px, very clear, with the read-along highlight.
- **Date/university close-up (f3950):** 'May 16, 2001', the saffron 2001 and the boxed 'Carnegie Mellon University' are about 22 px, clear.
- **Comparison (f4060–4150):** the verdict chips ('university · right', 'year · off by one', 'title · invented', 46 px → about 15 px) and the strike-through on the invented title read. The record title in the comparison also stays readable (about 15 px).
- **Text that does not read well:** the documents' own '2002' on the slip and '2001' on the record are only about 11–12 px tall at phone width in the comparison, legible only with effort. The chips carry the meaning there, and 2001 was shown large seconds earlier. S5-2's sustained underline under the record's '1' would help pair 2002 and 2001 on small screens.
- **Small text nothing depends on:** the 'Adam Kalai' underline at f3762 (about 7 px) and the source tab in the zoom-1.0 wide (about 10 px).
- **Joke (f4350–4380):** the caption (52 px → about 17 px) and the magnified '“Bo' read clearly.

## S6 game show, 2:27.0–3:15.0 (global f4410–5850; scene S6 runs f4395–5843, plus the 10-frame wipe into S7 at f5838–5848)

The sequence works and should be kept as it is. The rule reads correctly as Right +1 / Wrong 0 / "I don't know" 0, each value dropping on its spoken word (f4739, f4801, f4864). Wrong turns to a coral −1 on "costs" (f5531). Honest settles at 6 on "Six points." (f5054) and Guesser at 7 on "Seven" (rolls at f5262, settled by f5268). The strip builds 6 + 1 − 3 = 4 term by term (f5674, 5704, 5728, 5756) while the window steps 7 → 6 → 5 → 4, the last step on "Four." Every settled number is right and lands on its word. The trophy transfer is the only real defect: on both hops the trophy switches layer in mid-air and passes through a hand. The worst moment is the landing on "back." (f5813–5817), where the Honest player's resting forearm crosses the trophy and covers its eyes. A milder version happens on the hop down (f5782–5784), where the Guesser's fist hits the trophy's face. The other items are optional polish: a one-frame hop launch, the complete +1/0/0 board being fully readable for only about 0.55 s in s21, and a tight gap between "Wrong" and its value window. I did not listen to the audio.

### [major] S6-1 · 3:13.7–3:13.9 (f5810–5817), on "back." (word at f5816)

- **What:** The trophy hops onto the Honest lid at TROPHY_H.x = 718. That is the exact spot where the Honest player's right hand is resting (restR = x+94 = 694, lid level). Until u = 0.6 (f5810–5812) the trophy is drawn in front of his right hand and arm. At f5813 it switches to being drawn behind his front arms, so his forearm suddenly appears across the trophy's base. During f5814–5817 the forearm passes through the base and cup and hides the trophy's eyes at the moment it lands. His arms only start rising at TW.land (f5816, 3-frame ease), so the payoff landing is obscured for about 5 frames and the layer switch flickers.
- **Source:** source/src/scenes/S6_GameShow.tsx:452 (zone = u < 0.6 ? 'floor' : 'lidH'); :706–708 (const cheer = win(g, TW.land, TW.land + 22, 3, 8) and the arm mixes); :656/:665 (restR at x+94 on the lid, which is under TROPHY_H, :71); draw order :1253 and :1311–1316 (trophyOnLid → drawn before the contestants' front arms).
- **Fix proposed:** Lift the Honest player's hands before the trophy arrives, as anticipation. At line 706 change to `const cheer = win(g, TW.up - 4, TW.land + 22, 6, 8);`. His arms are then fully up by about f5810, before the layer switch at f5813, and nothing of his is on the landing spot. Recheck stills f5806–5822. If the trophy's left handle still touches his raised right upper arm at f5812–5813, also widen the raised right hand at line 708 from x + 140 to x + 160. Leave TROPHY_H and the walk path as they are.
- **Risk:** His eyes-tracking pose (line 705, win(TW.off-2, TW.land)) now overlaps raised arms. That reads fine as anticipation, but check that the face still reads 'o' and then 'grin'. Check that the raised right arm stays clear of the host's cue cards (host x 960) during f5804–5812. The later hand-on-trophy reach (line 711, TW.land+20) is unchanged. Recheck the S7 wipe frames f5838–5848.

### [minor] S6-2 · 3:12.7–3:12.8 (f5782–5784), just after "The" (f5780)

- **What:** When the trophy hops off the Guesser lid, his 'reach after it' arm is aimed 150 px from his shoulder toward the trophy. The trophy is still right beside him, so his fist lands on its base (f5782) and then on its left eye (f5783). During that time the trophy is drawn behind his arms (zone 'lidG'). At f5784, u reaches 0.45, the zone switches to 'floor' and the trophy jumps in front of his arm, hiding the hand. The result is a one-frame slap through the trophy's face followed by a layer switch.
- **Source:** source/src/scenes/S6_GameShow.tsx:438 (zone = u < 0.45 ? 'lidG' : 'floor'); :819–826 (const after = win(g, TW.off, TW.land + 6, 4, 10); the reach toward tt at 150 px).
- **Fix proposed:** Make two small changes. (1) At line 438, use `zone = 'floor'` for the whole hop-down branch, so the trophy is in front of the Guesser's arms from the moment it leaves (it jumps toward camera). (2) At line 819, start the reach 4 frames later: `win(g, TW.off + 4, TW.land + 6, 4, 10)`, so the arm extends once the trophy has dropped below the lid.
- **Risk:** At f5779–5780 his hug hand rests on the lid to the right of the trophy base (TROPHY_G.x + 62, at lid level). Check it does not visibly jump behind the trophy at f5780; by the geometry it does not overlap. Recheck f5778–5790 and the trophy passing in front of the Guesser podium.

### [opportunity] S6-3 · 3:13.6 (f5808→f5809), on "walks" (f5804)

- **What:** The hop up from the floor starts with an instant jump of about 130 px in a single frame. Before that the trophy was walking at about 14 px per frame. The cause is the sqrt(u) ease, whose slope is infinite at u = 0. The squash [1.08, 0.88] is also applied during the first 3 frames in the air, not as a crouch before take-off.
- **Source:** source/src/scenes/S6_GameShow.tsx:449 (y = lerp(WALK_Y, TROPHY_H.y, Math.sqrt(u)) - 90 * Math.sin(u * Math.PI)); :451 (squash during the first 3 frames of flight).
- **Fix proposed:** Change line 449 to `y = lerp(WALK_Y, TROPHY_H.y, u) - 140 * Math.sin(u * Math.PI);`. That still clears the lid, but the first frame rises about 88 px and the peak is smoother. Optionally, at line 444 in the walk branch, apply [1.1, 0.88] in the 2 frames before TW.up and keep [0.94, 1.08] (stretch) for the rise.
- **Risk:** The trophy's path passes the Honest player's raised right arm (see S6-1). Apply this together with S6-1 and recheck f5806–5818 in one pass. The landing frame (TW.land) and the impact squash are unchanged.

### [opportunity] S6-4 · 2:42.1–2:42.8 (f4864–4884), "also zero." → "Two contestants."

- **What:** The complete +1 / 0 / 0 board (all three values showing) is fully readable for only about 16–18 frames. The last 0 drops at f4864 and settles around f4872. The camera starts pulling back at f4872, the board starts flying out at f4876 and is mostly gone by f4884. At the same moment the podiums slide in at the frame edges. Each value is visible for longer (+1 for about 4.5 s, Wrong 0 for about 2.5 s), and the full board returns in s25 for about 1.4 s (f5488–5531). So nothing is wrong, but the 'two zeros match' beat (ZEROS bounce at f4869) gets little time to settle.
- **Source:** source/src/scenes/S6_GameShow.tsx:180 (const FLY_OUT = K.zero2 + 13); :254 ({at: K.zero2 + 9, dur: 24, to: SHOTS.game}); dependent uses at :566 (wings uses FLY_OUT-2) and :1260 (tags exit uses FLY_OUT); :182 (ROLL = [K.two - 14, K.two - 10]).
- **Fix proposed:** Hold the board 6 frames longer. Set FLY_OUT = K.zero2 + 19 (line 180) and the camera move to `at: K.zero2 + 15` (line 254). Optionally shift ROLL by +4 (line 182) so the podiums do not sit half-entered at the edge of the rules framing for longer than they do now. The camera then settles at about f4902, well before the first round (ROUND[0] = f4927).
- **Risk:** Podium arrival and its machine_clunk SFX (built from ROLL) move together, so the sound stays in sync. The host's wings gesture moves to f4886, which is still on "Two contestants.". Check that the tags and board do not crop awkwardly during the pullback, then recheck f4860–4930. This item is low priority and can be skipped.

### [opportunity] S6-5 · 2:38.9–2:43.1 (f4766–4892) and 3:02.9–3:15.0 (f5488–5848)

- **What:** On the Wrong card, the label 'Wrong' ends about 10 px (at 1080p) from its value window, so the 'g' almost touches the 0 / −1 box. The Right card has plenty of room, and the 'I don't know' card is 570 wide with spare space. The gap is visible in the wide s25 shot, where the coral −1 is the point of the frame.
- **Source:** source/src/components/v2/S6_Props.tsx:17 (CARD = {xs: [297, 675, 1053], ws: [360, 360, 570]}); label row :58–60.
- **Fix proposed:** Widen the Wrong card by 20 px and take the 20 px from the third card: `xs: [297, 675, 1073], ws: [360, 380, 550]`. valueCentre(1), which is the −1 throw target, and cardCentre() are derived from CARD, so the throw and the pointing follow automatically.
- **Risk:** The board has to be checked in three places: the rules shot (zoom 1.1) and the wide s25 shot, where the third card's 'I don't know' label must still clear its window (it has about 60 px spare), and the −1 card flight and impact at f5520–5535.

**Keep (intentional):**

- Rolling-score transitions are fine and settle on the right values: rounds 0→6 for both players (f4930–4975, e.g. Honest showing '1/2' at f4940), the Guesser 6→7 (f5262–5268) and 7→6→5→4 (f5731, f5738, f5756–5765).
- The Guesser's drum twitch on each ✕ (about 0.2 of a digit, e.g. f5195): the designed 'no point' gag, which falls back to 6.
- The window shows 7 while the narrator says "six, plus one". 7 already is 6 + 1; the strip carries the 6 + 1 − 3 = 4 build, and the three −1 chips step the window down, the last one hovering and landing on "Four." (f5756).
- Equation terms appear on their words (6 at f5674, + 1 at f5704, − 3 at f5728, = 4 at f5756), and the −3 term arrives before all three chips have landed. That is intentional, because it follows the narration.
- The board flying out, the podiums rolling in at the frame edges (f4870–4892), the Guesser panel cropped at the right during the push to the Honest player (f4980–5000), and the Honest panel's cable at the left edge at f5280: these are all mid camera move or mid entrance.
- The host showing as a thin sliver in the opening curtain slit (f4404–4407), and the lights banging on (f4414–4428): this is the curtain reveal and lighting cue.
- Caption scroll unrolling with its third line partly shown (f5396), and flying out (f5460–5476).
- Stage dimming in s24 (f5400–5432) and the moving focus pools in s25 (f5585–5760): intentional light changes.
- Confetti puffing up from behind the trophy at its clank (f5420–5440), and the Guesser polishing the trophy.
- Trophy walking in front of the host's legs while he hops (f5793–5805): the intended gag.
- The −1 card overlapping the Wrong window just before impact (f5523–5530), and the equation strip sliding down from behind the board (f5666–5674).
- The final 6 vs 4 hold with the full equation (f5765–5838) and an S6 that stays alive under the 10-frame wipe into S7 (f5838–5848).

**Phone width:** At 640x360 (/tmp/claude-0/s6qa/phone.png), the essential point of every beat reads. The rule values +1, 0 and −1 are about 19 px tall, the score windows 6, 7 and 4 about 30 px, the strip "6 + 1 − 3 = 4" about 17 px, the "I don't know." bubble about 19 px and "1 in 4 per guess" about 15 px. The card labels Right / Wrong / "I don't know" are about 15 px and still readable. Only guard-rail text is small at phone size: the apron line "illustrative quiz · 10 questions · 4 options each · expected scores" is about 11 px, and the hanging citation "the researchers' argument · Kalai et al. 2025" is about 12 px in the rules shot. Both are within the ≥30 px rule at 1080p (32 and 35 px), but at phone size they only work as texture. Nothing essential is cropped in any settled framing.

## S7 3:14.8–3:33.8 (global frames 5843–6413; rendered 5838–6418 including the S6 to S7 and S7 to S8 wipe overlaps). Narration s26 and s27.

S7 does what the owner asked and should stay as it is. The authentic Table 2 sits under the paper header, comes into focus, and is shown whole with its citation tag (Table 2 · ten benchmarks sampled mid-2025 · CC BY 4.0) from 3:16.9 to 3:18.6. The camera then pushes into the Binary grading and IDK credit columns. The drum lands on a large 9 / 10 on "Nine" (settled by f6010), under a SAMPLED MID-2025 plate, and the coral None column and the "I don't know" 0 card carry the no-credit point. No still runs, flashes, bad resets or crops of essential text turned up. I found two small issues, both in the tally zone. First, the drum window on the counter panel overlaps the row of bulbs along the panel's bottom edge (a layout collision that lasts from 3:18.9 to the end). Second, during "no credit at all for 'I don't know'" the WildBench exception (two heavy ink rings plus a full-strength "WildBench: partial credit" tag right above the "I don't know" 0 card) is the highest-contrast mark in the frame and competes with the main point. A small recede fixes it.

### [minor] S7-1 · 3:18.9–3:33.9, global f5966–6418 (from when the panel enters during the truck right to the end of the scene; most visible in frame B, f5978–6157)

- **What:** On the tally panel, the dark drum window under the 9 runs about 4.6 world px (about 9 px on screen at zoom 1.87) into the row of bulbs along the panel's bottom edge. The 3rd bulb is half hidden under the drum's bottom edge and the 4th is clipped at the drum's corner. It reads as a construction error on the most important prop in the scene (the 9 / 10). It also shows in the wide frame C.
- **Source:** source/src/components/v2/S7_Props.tsx:140-155 (bulbs at top: h - 21 = 149 to 165 within PANEL.h 170) and :171-176 (drum row at top: 58; RollingNumber size 80 gives lh 89.6 + 2×3 border = 95.6, so the drum box spans 58 to 153.6 and overlaps the bulbs at 149 to 165, at x 91 to 169 against bulbs k=2 (112 to 128) and k=3 (156 to 172)). PANEL is defined at source/src/scenes/S7_Benchmarks.tsx:92.
- **Fix proposed:** S7_Props.tsx:171: change the count row's `top: 58` to `top: 52`. The drum box becomes 52 to 147.6: 1.4 px clear of the bulbs (149) and 2 px under the date plate (12 to 50). This changes nothing else. A roomier alternative is PANEL.h 170 → 176 (bulbs move to 155 to 171, drum unchanged), but that also needs LABEL_Y 398 → 404 and WTAG.y 488 → 492 to keep the panel's shadow off the label, so it is the larger edit.
- **Risk:** The date-plate flip overshoots (scaleY up to about 1.08 at PLATE = f5976 to 5985), which could make the plate's lower edge kiss the drum top for 1 or 2 frames. Recheck f5976–5990. Also recheck the nine-flash panel pulse (scale 1.05, f6004–6020) and frame C (f6183–6418), where the panel is small. Only S7 uses CounterPanel, so S6 is not affected.

### [minor] S7-2 · 3:22.1–3:25.2, global f6064–6157 (frame B), continuing at smaller size in frame C to f6418

- **What:** The narration says "with no credit at all for 'I don't know'" (f6076–6138). In those frames the boldest marks are the WildBench exception: two 4 px black ink rings on "No" and "Partial^b" (the ring's top edge touches the superscript b), and the tag "WildBench: partial credit" at full strength (32 px weight 800, about 60 px on screen). The tag is about as heavy as the "graded strictly / right or wrong" label and sits directly above the "I don't know" 0 card. Meanwhile the nine coral None pills that carry the point are pale multiply fills. For a quick reader the right column goes 9/10 → graded strictly → WildBench: partial credit → "I don't know" 0, so "partial credit" sits next to "I don't know" just as the voice says "no credit at all". The information is accurate. The problem is that the exception is louder than the rule.
- **Source:** source/src/scenes/S7_Benchmarks.tsx:463-476 (WildTag, always full opacity once out). :406-412 (RingMarks, tone="ink" width 4). Cues: CORAL at :181 (cascade from K.no+2 = f6083), TEAL_DIM at :180.
- **Fix proposed:** Recede the exception once the coral cascade starts, the same way the teal pills already step back. (1) In WildTag, wrap the output or add to the outer div at line 469: `opacity: 1 - 0.45 * tw(g, CORAL[0], 10)` (about 0.55 by f6093, so it stays legible at 1080p but sits behind the rule card). (2) Optional: at lines 408 and 411, drop the ring stroke from width 4 to 3, or fade the rings to about 0.7 from CORAL[ROWS-1], so the nine coral None pills plus the 0 card become the strongest marks. Leave the rings' geometry alone, because padY is already limited by the adjacent pills (row pitch 31.6, ring ±17, pill ±13.5).
- **Risk:** The tag is the only on-screen explanation for the dashed 5th slot and for 9 rather than 10, so do not hide it. Keep its opacity at 0.5 or above and check that it still reads in frame C at f6200–6400 (at zoom 0.97 it is about 31 px; at 0.55 opacity, confirm it stays legible). Recheck the WB_RING and WB_TAG beat on "wrong," (f6058–6075) so it is unchanged at full strength.

**Keep (intentional):**

- Frame A (f5843–5888): the authentic paper header (title and four authors, teal underlines on "The researchers") over an out-of-focus Table 2. The blur and white veil on the table are a deliberate rack focus, not a soft asset. The table racks into focus as the header lifts on "checked" (f5889).
- Header whisk f5889–5906: the header page flies off up and to the right at an oblique angle while the camera pulls back. The diagonal crops of the page in f5897–5900 are transitional.
- Full-table provenance shot B1 (f5906–5960): the whole Table 2 with its caption, the 1 to 10 rail and the citation tag (Kalai, Nachum, Vempala & Zhang (2025) · Table 2 / ten benchmarks sampled mid-2025 · CC BY 4.0). This is exactly the 'full table before a focused crop' the owner asked for. Rows are too small to read on a phone here, but the tag reads, and that is the point of the shot.
- Truck and push to frame B (f5960–5978): the navy panel and blue rule card enter from the right edge because the camera is moving onto them. This is a camera reveal, not a prop half-entering.
- Frame B's caption fragments cut by the left edge ("…metric is a strict correct/incorrect") sit under a deliberate 62% paper wash. Only the paper's own definition is brought forward with its teal highlight on "strictly". The highlighted phrase is complete.
- Drum count f5983–6010: the digits roll through intermediate states, and the spring briefly shows the next digit (0) peeking below the 9 at f6008–6009. It settles on 9 by f6010 ("Nine" at f6007). Judge the settled value: correct.
- Rule-card 0 drop f6135–6145: the 0 overshoots low in its window during the spring (f6139–6143) and is centred by f6145. This is not a layout offset.
- WildBench's dashed '–' slot on the rail and the ringed No/Partial: these are accurate to Table 2 and explain 9 rather than 10. Recede them (S7-2) but do not remove them.
- Pull-out to frame C (f6157–6183): the illustrative leaderboard rises from below under the camera move and lands as the camera arrives (f6182). Ranks re-sort, then #1 #2 #3 stamp in. The 'illustration' chip is printed on the board from its first frame.
- Trophy drop on "pays." (f6238–6246), with squash and bounce, landing on the board's free right edge. The '#3 says "I don't know"' row sags 1.4° and greys out. Both are intentional acting.
- Hedge beat f6320–6357: the argument marks (pills, chain line, bars, trophy) dim on "not the whole story" and re-brighten on "But". The real table, citation tag and 'illustration' chip never dim. This is intended.
- The SAMPLED MID-2025 plate on the tally panel and the swiped 'mid-2025' in the citation tag together keep the historical context clear. They should stay as they are.
- S6 to S7 wipe (f5838–5848) and S7 to S8 wipe (f6408–6418): both sides stay alive and clean.
- Raster check: public/img/paper_p14_table2.png is 7866×4500 and paper_p01_header.png is 8000×1766 (already twice the NAT_W/HEAD.natW the code assumes; the Img sizes are explicit, so the layout is unchanged). At the tightest zooms (B 1.868, A 1.74) they render at about 4110 px wide at 4K, so there is enough source detail with no upscaling.

**Phone width:** Checked at 640×360 (/tmp/claude-0/s7insp/phone.png, built from f5930, f6010, f6140, f6260, f6400 and f5975). Frame B (f5978–6157): the essential point reads well. The 9 / 10 drum is about 45 px tall on the phone, SAMPLED MID-2025 is clear, the Yes/None cells with their teal and coral pills read, and the '“I don't know” 0' card reads. Frame C (f6183–6418): 9 / 10 still reads (about 26 px). The leaderboard labels (about 14 px), 'guessing pays' (about 12 px) and the honest note 'One explanation, / not the whole story. / But a simple one.' (about 16 px) all read. 'graded strictly / right or wrong', 'WildBench: partial credit' and the citation tag come down to about 10–11 px. They are legible but secondary, which is acceptable here. Text that does not read on a phone: the Table 2 body rows and caption in B1 (f5906–5960) and in frame C. That is acceptable, because those shots establish provenance and the counted cells are read in the frame B close-up. The author names in frame A (f5870) read clearly.

## S8 3:33.8–3:47.6 (f6413–6827, "So what helps?" → "None of it is a guarantee.") + S9 3:47.6–4:13.2 (f6827–7596, verification machine through the H910 hand-off)

S8 is clean and should be kept as it is. Retrieval ("the real record is now in the room"), reasoning ("helps sometimes"), consistency vs correctness (three identical slips, "more consistent | not necessarily more correct", WRONG ×3) and "NO GUARANTEE" all read clearly, also at phone width, and both wipes are crisp. In S9 the beats and verdicts work (YES/NO lamps, "Source exists ✓" / "Claim fails ✕" at 57 px, lined up with the right cues). The owner's pale-label complaint is real: the SOURCE/CLAIM slot labels and outlines measure about 2.1:1 contrast and disappear in the two-gate wide. Below that, in priority order: the climactic stamp does not cover its own print on contact, the CLAIM FAILS ink hangs about 30 px past the paper edge into the hand-off, three camera moves whip at 215–300 px/frame (the default E.inOut ease), the scanner beam's base line strikes through the opening quote of "Boosting", and the slip's last line is clipped in the render. The clipped line is already fixed in the uncommitted working tree.

### [major] S9-1 · 3:51.0–3:54.8 (f6930–7045, two-gate wide); 3:57.2–3:58.2 (f7117–7145, gate ① medium); dashed outline also around the slip in the 4:01.5–4:05.3 close-up (f7246–7360) and CLAIM shown again under the lift 4:12.8–4:13.2 (f7584–7595)

- **What:** The painted slot labels SOURCE / CLAIM and their dashed outlines on the booth back panels are pale grey at 45–50% alpha on cream. Measured contrast in the render is 2.09–2.24:1 (darkest label pixel ≈(172,178,165) on ≈(253,252,239)). In the two-gate wide, the shot that explains the two questions, they are the only cue to which side holds the claim and which holds the source. They are about 24 px at 1080p and unreadable at phone width. This is the low-contrast pale label/panel the owner asked to fix.
- **Source:** source/src/components/v2/S9_Machine.tsx:381-385 (SlotOutline: border `4px dashed rgba(111,133,144,0.45)`, label `fontWeight 600`, `color rgba(111,133,144,0.5)`); used at S9_Verify.tsx:496, 505, 506
- **Fix proposed:** Label: `fontWeight: 800, color: C.inkMuted` (solid #6F8590, ≈3.5:1 on paper; it stays secondary to the 86 px question signs). Use C.inkSoft (≈7:1) if more weight is wanted. Outline: `4px dashed rgba(63,85,96,0.55)`, or keep the colour and go to 0.6 alpha. Do not change sizes or positions.
- **Risk:** In the g2s slip close-up (zoom 2.63, f7246–7360) and the g2m verdict wide, the dashed outline sits about 8 px outside each document. If it is too dark it reads as a doubled border, so check f7320 and f7535 after the change and keep the outline lighter than the label if needed. The CLAIM label shows again behind the lifting slip (f7584–7595) under the veil, which is fine.

### [minor] S9-2 · 4:12.4–4:12.6 (f7575 HIT through f7578; pad held f7575–7577)

- **What:** On the 'Stamp it.' contact frames the CLAIM FAILS print is already visible below and to the left of the rubber pad. The pad's face bottom sits at about the print's centre line (frame y≈660 vs print centre ≈680, print down to ≈730), so 'CLAIM' shows under the pad while the pad is still pressing. This breaks the direction's 'stamps print where they hit' and the scene's own comment ('the pad covers the print on contact'). The print (≈355 px wide on screen) is also wider than the pad (≈274 px), so its ends stick out sideways.
- **Source:** source/src/scenes/S9_Verify.tsx:579 (target y = stampPt.y + 0.45*37*stampPt.scale ≈ +19 px, but StampArm's visible face bottom is 8*s = 14 px ABOVE the contact point, components/v2/StampArm.tsx pad rects y −24s…−8s and −62s…−22s); S9_Verify.tsx:476-477 (print rendered from g >= HIT)
- **Fix proposed:** (a) Lower the aim so the pad body (contact−112…contact−14 at scale 1.8) is centred on the print: `y: stampPt.y + 55 * stampPt.scale` (≈+63 px). (b) Reveal the impression as the pad starts to lift: `const stamps = g >= HIT + 3 ? [...] : []` and `inkPop` keyed from HIT + 3 (hold is 3 frames). Keep stamp_heavy SFX and camKick at HIT. If S9-3 shrinks the print to size 36, the pad almost covers its width as well.
- **Risk:** The pad sits about 44 px lower at contact. Check that the hand and forearm do not cover the 'Claim fails ✕' verdict window during f7566–7580 (the window is at screen y≈790+), and that the arm's withdrawal (ARM_OUT = HIT+4) still clears the slip before LIFT (HIT+9). Recheck f7570–7590.

### [minor] S9-3 · 4:12.5–4:13.2 (f7575–7595, incl. the H910 hand-off frame 7595; continues into S10's opening, which uses the same H910.stamp)

- **What:** The CLAIM FAILS impression runs about 30 world px past the slip's right paper edge, so ink is printed on air and over the record behind. At the hand-off (slip at scale 1.5, full screen) the stamp's right border sits about 45 px outside the card. The cause: the stamp is placed at SLIP_STAMP_AT.x = 232 on a 360-wide card, which suits S1's short 'WRONG' but not the 11-character 'CLAIM FAILS' at size 40 (≈310 px wide).
- **Source:** source/src/lib/handoffs.ts:20 (H910.stamp {text 'Claim fails', size 40, rotate −9}, no x); components/v2/AnswerSlip.tsx:19 (SLIP_STAMP_AT {232,214}) and :72-74 (stamps are rendered outside the clipped card); S9_Verify.tsx:473 (stampWorld uses SLIP_STAMP_AT.x)
- **Fix proposed:** In handoffs.ts:20 set `stamp: {text: 'Claim fails', tone: 'coral', size: 36, rotate: -9, x: 184}`. The rotated print is then about 285 px wide and spans x≈41–327 inside the gold border. In S9_Verify.tsx:473 aim at `(H910.stamp.x ?? SLIP_STAMP_AT.x)` so the hand still lands on the print.
- **Risk:** H910 is shared, so S10's first frame changes identically (S10_Payoff.tsx:1049, 1170-1174 read H910.stamp) and the match cut stays exact. Recheck S10's opening close-up and the counter landing for the new stamp position, and recheck S9-2's aim. The print now covers slightly different words (it is meant to cross the claimed title).

### [minor] S9-4 · 3:54.4–3:55.1 (f7033–7054, wide → checker); 4:00.4–4:01.5 (f7212–7246, gate ① → gate ②); 4:05.3–4:06.0 (f7358–7380, slip → record)

- **What:** Three S9 camera moves use camPath's default E.inOut = bezier(0.65,0,0.35,1), whose peak slope is 2.86× average. Measured on-screen travel peaks at about 216 px/frame (booth pillars, f7228–7232), about 275 px/frame (gate ② lamp, f7368–7370) and about 230–300 px/frame (gate ① lamp and checker, f7044–7048). Remotion renders no motion blur, so these strobe as whip pans. S8 deliberately keeps its moves under about 100 px/frame (SINE ease, S8_Helps.tsx:251, 265-267). Each move is purposeful and correctly timed, so only the speed profile is the problem.
- **Source:** source/src/scenes/S9_Verify.tsx:247, 250, 251 (moves without `ease`); lib/motion.ts:17 and :122 (default E.inOut)
- **Fix proposed:** Add `Easing` to the import at S9_Verify.tsx:2, define `const SINE = Easing.bezier(0.37, 0, 0.63, 1);` (as S8_Helps.tsx:251), and pass `ease: SINE` on lines 247, 250 and 251. Start and land frames stay the same; peak slope falls from 2.86 to 1.59 (about −44%, roughly 120–165 px/frame). Optionally start line 251 three frames earlier (`at: NO + 10, dur: 25`) for a further cut.
- **Risk:** Sine eases out less softly, so check that the camera is visibly settled before the 'Boosting' highlight (W_B = 7250), the 'Probabilistic' sweep (K.prob−1 = 7381) and the slip rise (TAKE_RISE = 7054). The slip's own belt keyframes (slipX, E.inOut) are not changed; check that the slip still enters the g2s frame cleanly by f7246.

### [minor] S9-5 · 4:01.6–4:11.7 (f7247–7552); most visible in the gate ② close-up 4:03.3–4:05.3 (f7300–7358), in coral after NO (f7345)

- **What:** The gate ② scan beam ends in a 4 px base line drawn 6 px below the target token's line box. When the target is '2002', that line falls on the next text line and strikes through the opening quote and cap top of '“Boosting', so the quote looks garbled (‘‘B). At zoom 2.63 it is clearly visible as a coral bar across the claimed title's first character.
- **Source:** source/src/components/v2/S9_Machine.tsx:252-253 (Beam polygon base and line at `ty1 + 6`); called at S9_Verify.tsx:535-537
- **Fix proposed:** In Beam, put the base at the target line's own descender zone: polygon points `${ty1 + 1}` and line `y1/y2 = ty1 - 1` (strokeWidth 3). Alternatively pass `ty1: b2.y1 - 7` at S9_Verify.tsx:536 only.
- **Risk:** The uncommitted working tree tightens slip line height to 1.2 (see S9-6), which makes the current +6 overlap worse, so fix after that change. Check the gate ① cite beam (f7118–7141) and the 'demo' sweeps (f6995–7035), whose targets are BELT_Y−6, so their line moves 7 px up but stays above the belt.

### [minor] S9-6 · 3:55.2–3:56.7 (f7055–7100), 3:57.2–3:58.2 (f7117–7145), 4:01.5–4:05.3 (f7246–7360), 4:12.8–4:13.2 (f7584–7595)

- **What:** In the approved render the ChatGPT slip's last body line 'Learning.”' runs through the gold inner border and is cut by the card's bottom outline (descenders hidden). The slip text overflows SLIP_H by about 15 px. This clips part of the claimed title in every slip close-up in S9 (and wherever else slip A appears).
- **Source:** components/v2/AnswerSlip.tsx:57, 67, 68 and S9_Docs.tsx:127-131. The UNCOMMITTED working tree (modified 03:48 today, after the 01:19 review render) already changes slip 0 to padding 12px, detail marginBottom 3 and lineHeight 1.2, and syncs SlipReplica to match (saves ≈16.7 px, leaving ≈5 px clearance above the gold border).
- **Fix proposed:** Keep the existing working-tree change and verify it on re-render; no new edit is needed. Confirm that 'Learning.”' clears the gold border at f7320 and f7595 and that the lit overlay words (SlipScan) still sit exactly on the printed words at f7125, f7320 and f7352.
- **Risk:** This is a shared component used by S1, S2, S9 and S10, so recheck slip A close-ups in S1 and the S10 opening (the H910 match). S9's token boxes are measured at runtime, so beams follow automatically. The S9 stamp now overlaps slightly different words.

### [opportunity] S9-7 · 4:09.7–4:11.7 (f7490 WIN_SRC – f7552 SCAN_OFF)

- **What:** In the verdict wide the record carries five bright marks (teal title sweep, teal 2001, the name and CMU loops from gate ①, and the yellow gate ② scan column, which tints 'On' and 'Le' of the title) against the slip's four faint coral marks. During 'Claim fails.' the eye is pulled to the bright white record rather than the failing slip. Both verdict windows themselves read clearly.
- **Source:** source/src/scenes/S9_Verify.tsx:468 (pulse only at YES), 454/537 (head-3 beam stays on until SCAN_OFF = K.stamp−16), 160
- **Fix proposed:** Light-only and small. (1) `pulse: bell(g, YES, 18) + bell(g, WIN_SRC, 18)` so the existence evidence (name and CMU loops) glows as 'Source exists' flips. (2) Fade only the record's head-3 beam at the claim flip: multiply line 537's `on` by `(1 - tw(g, WIN_CLAIM - 2, 6))`, so on 'Claim fails' the only active light is the coral on the slip.
- **Risk:** Purely light and glow. Recheck f7488–7552 so no glow overlaps the verdict windows, and check that the record's marks still read once the beam is gone.

### [opportunity] S9-8 · 4:08.3–4:09.6 (f7449–7488)

- **What:** The '2001' highlight finishes at about f7458. The page un-dims from f7462 (E.out, mostly gone by f7464) and the pull-out starts at f7466, so the fully focused '2001' close-up holds only about 8 frames while '2001.' is still being spoken (7447–≈7475). The brief asks for highlighted evidence to get time to settle.
- **Source:** source/src/scenes/S9_Verify.tsx:464 (`1 - tw(g, Y2001 + 13, 10)`), 457, 252 (`{at: Y2001 + 17, dur: 22, to: SHOTS.g2m}`)
- **Fix proposed:** Undim at Y2001 + 20, and pull out `{at: Y2001 + 21, dur: 19, to: SHOTS.g2m, ease: SINE}`. It lands at f7489, one frame before WIN_SRC (7490), and gives about 13 settled frames. The SINE ease (see S9-4) keeps the shorter move's peak speed below today's.
- **Risk:** The camera must be landed before the 'Source exists' flip at 7490. Recheck the head-3 beam's return (inRecord, line 457) so it does not flash on mid-move.

**Keep (intentional):**

- S8 wide-to-dock (f6466–6475), insert-to-two pull-back (f6564–6596) and closing pull-back (f6788–6800) crop ASSEMBLY or the booth at the frame edges. These are S8's planned zoom-then-pan moves (camGo PULL/PUSHIN, SINE) and are already under about 100 px/frame.
- S8 insert framing: the EVIDENCE CHECK header is visible at the top only during the push (f6545) and the pull-back (f6575). When settled (f6553–6563) the header is out by design.
- S8 slips emerge inside the tunnel mouth behind the semi-transparent rubber flaps (f6680–6690). The LANE clip starts at MOUTH.x0 on purpose.
- S8 WRONG stamps cover 'Learning.” / · CMU' but stay clear of '2002'. The parked '…' cloud sits on ASSEMBLY's roof as a deliberate 'still thinking' marker.
- S8's three distinctions (retrieval → 'the real record is now in the room'; reasoning → 'helps sometimes'; consistency → 'more consistent | not necessarily more correct'; 'NO GUARANTEE') are clear and should not be touched.
- S9 dark, unpowered EVIDENCE CHECK name plate (f6827–6894): a deliberate power-on reveal on 'check.'
- S9 record dimming in the gate ① close-up (f7155–7215) and gate ② close-up (f7380–7465), and the slip wash in the gate ② close-up: deliberate document focus (direction rule 7), not low contrast to fix. The white hole halos around the title and 2001 are part of that spotlight.
- S9 record emerging bottom-first from the slot (f7128–7141): physically correct feed-out, not a crop.
- The gate lamp's '?' glyph blinking on and off (blinkSq) is the deliberate 'asking' state.
- S9 partial frames during camera moves (f7040–7048, f7110, f7150 slip sliver at the left, f7220–7240, f7364–7378): transitional pans; only their speed profile is flagged (S9-4).
- The dark veil and lift of the stamped slip (f7584–7595) and the exact H910 match into S10 at f7596 (verified identical position).
- Verdict timing: YES at f7203 on 'Yes.', NO at f7345 on 'No.', 'Source exists' flips at f7490, 'Claim fails' at f7522, stamp HIT at f7575 on 'it.' All are correct.

**Phone width:** Checked at 640×360 (/tmp/claude-0/s89qa/phone1.png, phone2.png). Every S8 beat reads at phone size: the 'the real record is now in the room' chip, the reasoning bubble and 'helps sometimes', '= =' with WRONG, the 'more consistent | not necessarily more correct' plate in the close-up, and NO GUARANTEE in the wide. The plate's ≈10 px repeat in the closing wide is not needed because it was already read at 68 px. 'illustrative re-run' is small (≈10 px) but legible. S9: the question signs, ARCHIVE, the YES and NO lamps, the boxed 'Adam Kalai' and 'Carnegie Mellon University' (≈13 px), the lit slip words in the close-up, the record title and 2001, both verdict windows (≈19 px) and the CLAIM FAILS stamp all read. Not readable at phone: the SOURCE/CLAIM slot labels in the two-gate wide and the gate ① medium (S9-1), which are the only text that says which slot is which before the documents arrive. The slip's cited words in the gate ① medium (≈8 px) and the document details in the verdict wide are also too small, but the push-ins and verdict windows carry those points.


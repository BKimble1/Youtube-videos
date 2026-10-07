# V1 shot review — S5: The record (s17-s19). V1 frames 3606-4301 (2:00.2-2:23.4); the scene proper runs 3612-4295 (22.8 s), and S5 is mounted 6 frames early and 6 frames late for the wipes. In the V2 timeline (source/src/data/timeline.json) S5 is 3696-4395 (23.3 s). V2 cue frames: 'Here's' 3710, 'record.' 3736, 'Kalai's' 3762, 'thesis:' 3782, 'Probabilistic' 3803, 'Learning.' 3878-3899, 'Carnegie' 3900, 'May' 3933, '2001.' 3942-3981, 'ChatGPT' 3986, 'right.' 4037, 'year' 4059, 'one.' 4085, 'title' 4107, 'invented.' 4124, 'every' 4157, 'exactly' 4203, 'true' 4250, 'one.' ends 4273, 'A' 4288, 'confident' 4295, 'font' 4314-4337 (contains the dry pause), 'still' 4345, 'just' 4357, 'font.' 4367-4384. s20 'Now,' starts at 4407.

What S5 does for the story: it is the receipt. S4 explains why a model fills a gap with a title-shaped answer. S5 puts the primary source on the board (Kalai's 2001 CMU thesis title page), grades ChatGPT's answer against it one item at a time (university right, year off by one, title invented), then lands joke 2: 'A confident font is still just a font.' The beats and the joke are right. The execution is not.

The five biggest problems:

(1) Frozen frames. The scene is still for 16.0 of 22.8 s (70%), across nine still runs. Every mark draws in 12-16 frames on the first word of its sentence and then sits there. The worst holds:
- 3733-3815 (2.77 s), the title read.
- 4087-4206 (about 4 s), 'every detail ... exactly as solid as the true one', with only a faint glow.
- 3649-3712 (2.13 s), 'Kalai's thesis'.
- 3923-3980 (1.93 s), 'university right'.

(2) Guard rails are cut off, and the camera loses alignment.
- The 22-px source chip runs off the right frame edge from f3902 to the end (13 s), and the checker covers it from about f4212.
- In the date framing (3864-3891) the 'Title' tab is cut by the top frame edge.
- The page sits on the subject layer (depth 1) but the corkboard sits on the wall layer (depth 0.72). During the title push the page and its tapes slide about 40 px down the board. This is the brief's 'objects no longer aligning after camera movement'.

(3) The comparison does not work on a phone or with the sound muted.
- The page shrinks so its evidence lines are about 16 px.
- No claim fragment is ever shown next to its record line.
- The page labels pop on all at once at about f3902.
- The 'record responds' ramps are dead code (each is Math.max'ed against a box that is already at t=1).
- Every verdict chip lands before its verdict is spoken: on 'ChatGPT', on 'year' and on 'title'.

(4) The punchline is crowded, disconnected and spoiled.
- About 13-15 elements are live at once.
- Four things start within 16 frames on 'A confident' (4200-4216): checker slide, glow fade, magnifier pop, headline fade.
- The magnifier floats about 1,000 px from the checker's empty hands. It does not magnify, and its rim and handle cover the slip's words, including 'Learning.' in the invented title.
- The whole headline is readable about 1.7 s early, with 'just a font.' ghosted at 30%.
- The wipe to S6 starts 2 frames after 'font.'.

(5) Camera grammar.
- It ping-pongs from title down to CMU and back up to the date. The date was already on screen in the CMU framing, so the second move shows nothing new.
- Three motions overlap in 0.6 s at the reframe.
- Then the camera is locked at zoom 1.0 for the final 13 s, through all the verdicts and the joke.

Corrections to the first review:
- At f3825 the sliced line is 'Probabilistic and On-line Methods', not 'in Machine Learning'.
- The camera travels 278 world px down and 148 back up, not 360 and 180.
- CAM_T puts the title just above centre (y about 375-530), not in the upper third.
- The S5 slip is not the S4 slip. S4 shows an excerpt card ('GPT-4o · published excerpt', IS ENTITLED seal); S5 shows the full cold-open answer ('GPT-4o · 9 May 2025').

Where the first review's V2 plan does not fit the facts:
- A 780-px-wide full page cannot sit 'fully on the board'. It is about 790 px tall and the board is 555 px tall.
- Three chips of at least 30 px do not fit in one row under the slip.
- The two titles cannot be set at the same screen height.
- The zoom-1.45 joke push would leave a 170-px strip of the page and its source chip at the right edge.
- In V2 there is no gap after 'Learning.' ('Carnegie' starts 1 frame later), and there are no pauses between the three verdicts (each beat gets about 45 frames).
- A 1-s hold after 'font.' is impossible inside S5. 'font.' ends at 4384, the scene ends at 4395, and V2_DIRECTION fixes S5→S6 as an 18-frame iris from the checker's lens at screen (960, 540) with r 130 (H56).
- S4→S5 is also fixed: a 12-frame wipe whose edge travels left, revealing S5 from the right.

V2 must also use the shared kit: components/v2/AnswerSlip (AnswerSlipArt i=0) for the slip, DrawBox, camPath, reach/holdL/holdR, and the SFX cue sheet.

## S5.1 2:00.20-2:02.27 (V1 f3606-3668) | Here's the actual record.
  - [medium/weak_transition] The wipe reveals an empty corkboard for about 0.5 s (3612-3625; fully empty 3618-3621). The page then scale-pops from nothing instead of entering physically. Nothing on the S5 side carries the S4 slip's exit.
  - [low/motion_quality] Page, tapes and source chip land as one rigid unit on a generic spring: no tape slap, no paper settle. The paper is see-through during the opacity ramp (f3625: board frame and desk lines visible through it). The brief's rule is no opacity fades for physical objects. The header chip fades on the same frames (3623-3633), so two things land at once.
  - [medium/disconnected_or_floating] The page is taped at the board's top frame, but about 60% of it (y 625-980) hangs below the board, over the pink wall and the desk ledge at y 760. It reads as floating in front of the set, not pinned to the board. No full-page size can fit: the board is 555 px tall and the page is 0.954 x its width tall.
  - [low/overlap_or_clipping] Tangents: the header chip (y 37-90) sits on the board's top frame line (y 70-78), and its bottom edge kisses the page's top edge (y 92).
  viewer_should_look_at: The real thesis title page arriving and being pinned to the board: a real document, distinct from every illustrated slip so far.
  what_it_should_communicate: Switch from illustration to evidence. This is the primary source, physically put on the board, with its citation attached.
  what_actually_happens: 3606-3618: a 12-frame hard-edged wipe. S5 is revealed from the left; the edge is at x about 286 at f3610 and about 1634 at f3614. It wipes over S4's last frame: the library, the clerk holding the excerpt slip 'ChatGPT · GPT-4o · published excerpt' with the IS ENTITLED seal and the struck-out 'I think'/'maybe' cards, and the honesty chip 'a title-shaped answer · simplified illustration'.

The wipe reveals the pink wall, an empty corkboard (x 120-1800, y 70-625) and the desk ledge (y 760-800). The board is completely empty from 3618 to 3621.

3621-3647: the page pops in place (spring, scale 0.8 to 1, rotate -2 to 0 deg, opacity ramp). At f3625 it is still translucent: the board's bottom frame (y 625) and the desk lines (y 760, 798) show through the paper. Both tapes and the 22-px source chip arrive welded to it.

3623-3633: the 30-px 'The actual record' chip fades in at x 803-1116, y 37-90. It sits on the board's top frame (y 70-78) and its bottom edge touches the page's top edge (y 92).

The camera is static at zoom 1.0. From 3647 nothing moves.

Final page: x 520-1444, y 90-980. About 60% of it hangs below the board, over the wall and the desk ledge. The source chip sits on the desk front at y 998-1037.
  V2 DIRECTION: The S4→S5 hand-off is fixed by V2_DIRECTION §9: a 12-frame wipe with its edge travelling left. S4's sealed slip slides out to the left; S5 is revealed from the right and renders from about 3690.

Layout for the whole scene (no page move later):
- Put the record on the right half of the board from the start. Card image 720 px wide at world x about 1042-1762 (card with pad x 1020-1784, top y about 120).
- Crop it with Evidence viewportHeight at about 0.62 of h (title through 'Pittsburgh, PA') so the card is about 470 px tall (y 120-590) and sits fully on the board. Crop and zoom are allowed by §7.
- Pin board and page on the same depth: render the page through DeskSet's board slot, or put the board on Layer depth 1 in an S5-prefixed copy of DeskSet. In V1 the board is on the 0.72 wall layer, so the taped page slides across it on every camera move.
- Render the source chip as its own element on the wall below the board (y about 645-725). Two lines at 28 px: 'Kalai (2001), PhD thesis title page' / 'Carnegie Mellon University · CMU-CS-01-132'. Left-aligned with the card and no wider than it. Do not use the Evidence tag, which would put it across the board's bottom frame.

Camera: open framed on the card and its chip with about 60 px margins (zoom about 1.45, centre about (1400, 420)). This keeps the empty left half of the board mostly out of frame.

Action under the wipe (3690-3702):
- The page slides in from frame right, travelling left in the same screen direction as S4's departing slip, its leading edge just behind the wipe edge.
- It decelerates (E.out), overshoots about 1.5% to the left and settles by 'actual' (3724).
- Left tape slaps on 'actual', right tape 5 frames later, each with a 2-frame squash.
- Reaction: the paper settles 2 px and the shadow tightens.
- Secondary, on 'record.' (3736): 'The actual record' (at least 44 px) drops from above with sp SNAP to screen y about 24-84, at least 30 px clear of the tapes. Then the source chip slides up from behind the board's bottom frame.

Quiet: wall and desk. Sound: paper_slide under the wipe, tape_rip x2 (second pitched -1), chip_pop. The music pulls back (evidence).
## S5.2 2:02.27-2:03.80 (V1 f3668-3714) | Kalai's thesis:
  - [high/static_hold] Still run 3649-3712 (2.13 s), during 'actual record. Kalai's thesis: Probabilistic'. The page has reached its final state and nothing develops while the narrator names the author.
  - [medium/other] The whole page is presented as equally important for 3 s. The brief's documents rule (push into the title, the year, the entry) is not applied until the push. The word 'Kalai's' gets no visual reference.
  - [low/phone_readability] At zoom 1.0 the body lines (author, date, CMU) are about 23-px type, about 8 px on a phone. This is acceptable only because the camera pushes in afterwards. The source chip at 22 px is about 7 px on a phone, below the 30-px guard-rail bar.
  viewer_should_look_at: The author line 'Adam Kalai', then the title block the camera is heading to.
  what_it_should_communicate: Whose document this is. Then: the next thing we read is its title.
  what_actually_happens: The page, header chip and source chip are completely frozen from 3649 to 3712 (2.13 s). All page text has equal weight: title, author/date/report number, the School of CS block and the committee list. At wide, the body lines are about 23-px type and the title about 38-px type. The header fades out in place over 3712-3720. The push to the title starts only at 3714.
  V2 DIRECTION: - On 'Kalai's' (V2 3762): a thin teal marker underline draws under 'Adam Kalai', left to right, 8-10 frames (DrawBox at about 6 px height, or a marker stroke). marker_sweep at -6 dB.
- On 'thesis:' (3782): the camera starts its approach to the title (camPath, 20 frames, E.inOut), landing as 'Probabilistic' starts (3803). The 12-frame gap before 'Probabilistic' is the approach, not a hold.
- Reaction: the header chip lifts off upward (E.in, 8 frames) as the camera starts.
- Secondary: the rest of the card dims (dimOutside 0 to 0.3) so only the title stays bright. Note that Evidence's dimOutside only cuts a hole for boxes[0], so keep the title box first.
- Background life: one tape corner lifts and settles 1-2 px.
## S5.3 2:03.80-2:07.17 (V1 f3714-3815) | "Probabilistic and On-line Methods in Machine Learning."
  - [high/static_hold] Still run 3733-3815 (2.77 s), during 'Probabilistic and On-line Methods in Machine Learning. Carnegie'. The box finishes 0.5 s into the title and then freezes for the rest of the reading.
  - [medium/camera_hurts] Parallax mismatch: during the 3714-3732 push the page and its tapes drift about 40 px relative to the corkboard they are taped to (compare f3650 and f3733). This is exactly the brief's 'objects no longer aligning after camera movement'.
  - [low/camera_hurts] CAM_T (zoom 1.55) frames half the page. The author/date and School of CS blocks below the title are near equal size and compete with it. Nothing dims or recedes.
  - [low/timing_vs_narration] The 'Title' label appears whole on the first word, before the box has drawn. It works better as the resolution on 'Learning.', so the beat has setup and payoff.
  viewer_should_look_at: The real title, read word by word along with the narrator.
  what_it_should_communicate: This is the true title. Remember its shape; it will be compared with the invented one.
  what_actually_happens: The camera eases to CAM_T (zoom 1.55, cy offset +60) over 3714-3732. The title box ends up at screen y about 375-530, just above centre.

The teal title box clip-wipes in over 3720-3736, entirely on the word 'Probabilistic'. The 'Title' label is not clipped with the box: it fades in whole with the box opacity, so at f3726 it is fully visible over a half-drawn box.

From 3733 to 3815 (2.77 s, the longest still in S5) nothing moves while the other six title words are spoken. The frame shows the upper half of the page: the author/date block and the School of CS block are nearly the same size as the title, and nothing is dimmed.

During the push the taped page slides about 40 px down the board. At f3650 the tapes straddle the board's top frame (y 70-113); at f3733 the frame is at y about 144 and the tapes at about 170-230, off the frame. The page is on depth 1 and the board on the wall layer at depth 0.72.
  V2 DIRECTION: Camera: land on the title at the zoom where the title box spans about 60% of frame width and the card is wider than the frame, so no board or wall slivers show at the sides. That is about zoom 2.55 on a 720-px card, title type about 70 px on screen. Then a slow drift push (2.55 to 2.65) with a 20-30 px pan to the right, following the reading direction across 3803-3899.

Action: draw the box like a marker reading along (DrawBox):
- Stroke 1 underlines and fills 'Probabilistic and On-line Methods' in time with those words (3803-3861).
- Stroke 2 covers 'in Machine Learning' (3863-3895).
- The fill trails the outline by 3-4 frames.

Reaction: on 'Learning.' (3878) the 'Title' tab (at least 34 px on screen) snaps onto the box corner with about 8% overshoot, and the box gives one teal lock pulse.

Secondary: the rest of the card dims (dimOutside about 0.35). Quiet: nothing else moves.

Next: V2 has no pause after 'Learning.'. 'Carnegie' starts 1 frame later (3899 to 3900), so the move down begins on 'Carnegie' itself.

Sound: two marker_sweep strokes (second pitched +1) and a pop_tick for the tab.
## S5.4 2:07.17-2:09.70 (V1 f3815-3891) | Carnegie Mellon, May 2001.
  - [medium/camera_hurts] Ping-pong: down to CMU, then back up to the date within 1.5 s (3815-3862): two 0.5-s moves for one 2.4-s sentence. The second move reveals nothing; at CAM_C (f3833) 'May 16, 2001' is already in frame at y about 200.
  - [medium/offscreen_or_cropped] In the CAM_D hold (3864-3891) the 'Title' tab is cut by the top frame edge for the whole 0.97 s. At f3825 the title's first line is sliced mid-glyph. At CAM_C the title box's bottom stroke shows as a sliver at y 0 and the committee list is cut at the bottom.
  - [medium/other] The date highlight covers two lines ('May 16, 2001' plus 'CMU-CS-01-132'), and three teal boxes are equally strong. The year, which the next sentence depends on, is never isolated.
  - [low/static_hold] Still run 3863-3891 (0.97 s), during 'May 2001.'.
  viewer_should_look_at: 'Carnegie Mellon University', then the date line, with '2001' as the final focal point.
  what_it_should_communicate: University: CMU. Date: May 2001. Plant the 2001 that the slip will get wrong.
  what_actually_happens: 3815-3831: the camera tilts down 278 world px (about 530 screen px) and zooms from 1.55 to 1.9 onto CMU. The CMU box draws over 3821-3833. Mid-move at f3825, the top title line 'Probabilistic and On-line Methods' is sliced by the top frame edge ('in Machine Learning' is intact).

3833-3848: hold on CAM_C. The CMU line is at centre, but 'May 16, 2001' is already on screen at y about 200. A teal sliver of the title box's bottom stroke runs along the top edge, and 'Danny Sleator' is cut by the bottom edge.

3848-3862: the camera tilts back up 148 world px (about 280 screen px) to CAM_D. The date box draws over 3852-3864. BOX_DATE encloses both 'May 16, 2001' and 'CMU-CS-01-132'.

3863-3891: still, 0.97 s. In this framing the 'Title' tab is cut by the top frame edge (tab y 0-68, its top missing). Title, date and CMU boxes are all on screen at equal teal strength. 85-px stripes of board, wall and desk show at x below 85 and above 1835.
  V2 DIRECTION: Camera: one move only. On 'Carnegie' (3900), camPath (about 18 frames, E.inOut) to a single framing that holds the date line and the CMU line together.
- Both lines should read at least 44 px on screen (about zoom 2.6-2.7 on a 720-px card), centred between them and biased down so the title box is fully out of frame, at least 10 px below its bottom stroke.
- At this zoom the card is wider than the frame, so no side slivers.
- Alternatively, keep the title fully in and dimmed at about zoom 1.9, with at least 60 px headroom above its tab. Never slice it.

Marks wait for the landing (shot rule 2):
- 'Mellon,' (3914-3930): the CMU DrawBox draws left to right.
- 'May' (3933): a tight box around 'May 16, 2001' only (shrink BOX_DATE to one line).
- '2001.' (3942): a saffron underline ticks under the digits with a tiny overshoot.

Reaction: the dim spotlight moves from the title to these two lines. This needs a two-hole mask, so use an S5-prefixed copy of Evidence.

Secondary: a 1-2% drift push over the sentence.

Next: in the silent tail of '2001.' (about 3960-3984) the camera pulls back to the two-shot (S5.5).

Sound: marker_sweep x2 (rising pitch) and a pop_tick on 2001.
## S5.5 2:09.70-2:10.77 (V1 f3891-3923) | (pause) ChatGPT ...
  - [high/offscreen_or_cropped] The source chip (about 850 px wide at 22 px) is cut by the right frame edge at '· CMU-CS' from about f3902 through f4295 (13 s). It is a factual guard rail and must be fully visible.
  - [medium/competing_attention] Camera pull-back, page slide and shrink, and slip pop all run between 3891 and 3911. At f3900 the ghosted slip overlaps the page, so the reframe reads as a glitch rather than a staged move.
  - [medium/timing_vs_narration] All three page labels pop on at once at about f3902, before any verdict is spoken. The 'university · right' verdict (3911-3923) lands during 'ChatGPT', 0.5-1.7 s before 'got the university right' (3927-3963).
  - [medium/disconnected_or_floating] The slip materialises by a scale-pop at x 150, y 230 (rotated -2 deg). There is no carrier, no tape and no slap, unlike the taped page beside it. It is not the S4 card either; that one was an excerpt with a seal, so implying 'the same slip returns' would be wrong.
  viewer_should_look_at: The ChatGPT slip arriving next to the real page.
  what_it_should_communicate: Now we compare: the claim on the left, the record on the right.
  what_actually_happens: Three motions overlap in about 0.6 s:
- The camera pulls back from 1.9 to 1.0 (3891-3909).
- The page slides right and shrinks from 880 to 700 px image width (3893-3911).
- The slip pops in at left (3899+, scale 0.8 to 1, opacity ramp).

At f3900 the slip is a translucent ghost drawn in front of the page's left edge, cut by the left frame edge, and the board's top tapes are cut by the top edge.

At about f3902 (cmp > 0.5) three page labels switch on with no animation: 'Title' becomes 'the real title', and '2001' and 'university ✓' appear.

3911-3923: 'CMU' is highlighted on the slip and the 'university · right' chip fades in while the narrator is still saying 'ChatGPT'.

From about 3902 to the end of the scene the page's source chip (x from about 1102, 22 px) runs past x=1920 ('... Carnegie Mellon University · CMU-CS' is the last visible text).

The slip is the full cold-open answer ('GPT-4o · 9 May 2025'), not the S4 excerpt card ('GPT-4o · published excerpt', IS ENTITLED seal). It lands untaped on the board, while the page is taped.
  V2 DIRECTION: Because the page is already on the right half (S5.1), no page move is needed. That removes the three-motion pile-up.

(a) In the silent tail of '2001.' (about 3960-3984): one pull-back (camPath, about 22 frames, E.inOut) to the two-shot.
- Zoom about 1.10, centre about (980, 520).
- This is the widest framing that keeps both documents (x about 150-1814 including tapes and shadows) whole with at least 40 px margins.
- It reveals the empty left half of the board and lands before 'ChatGPT' (3986).

(b) On 'ChatGPT' the cold-open card arrives.
- Use components/v2/AnswerSlip AnswerSlipArt i=0 at scale about 1.6 (about 576x448, body type about 37 px, 'GPT-4o · 9 May 2025' about 29 px), with no stamps. The V1 S5 used a different Slip art.
- It is carried by a POV arm with a teal sleeve (the film's 'you, checking' hand; copy StampArm's arm art to components/v2/S5_PinArm.tsx). The arm enters from the bottom-left, slaps the card onto the left half of the board (x about 150-726, y about 110-558), presses the top tape (tape_rip about 4004), and withdraws (about 20 frames total).
- The card settles from -6 to -2 deg with about 2% overshoot. Its gold edge glints once (marks.glint, glint sfx).

No page labels and no verdict chips yet. The camera holds still while the card lands.

Not the checker: in this layout there is no standing spot for him that does not put his head over the chips or the documents. He enters for the joke instead (S5.9).

Sound: paper_slap (stiffer, glossier than the page), tape_rip, glint.
## S5.6 2:10.77-2:14.17 (V1 f3923-4025) | got the university right. The year was off by one.
  - [high/static_hold] Still runs 3923-3980 (1.93 s, 'ChatGPT got the university right. The year was') and 3983-4030 (1.6 s, 'The year was off by one. The title'). Each verdict is a 12-frame fade followed by a freeze.
  - [medium/broken_asset] The record-side ramps mUniRec and mYearRec never visibly change anything; each is max'ed against a box that already reached 1 at 3833/3864. The page never reacts on 'right.' or 'one.'.
  - [medium/timing_vs_narration] The 'year · off by one' chip lands on 'year' (3980-3992), before 'off by one.' (3992-4016). Same pattern as the university chip, which landed during 'ChatGPT'. The verdicts are always shown before they are said.
  - [high/phone_readability] The evidence side is unreadable at phone size. On the shrunken page, 'Carnegie Mellon University' and 'May 16, 2001' are about 16-px type (about 5 px at 640x360). Only the 24-px labels carry the record, and they too fall below V2's 44-px bar for critical text.
  - [medium/unclear_when_muted] 'Off by one' is never shown. The slip's '2002' (x about 450, y 372) and the page's '2001' label (x about 1576, y 422) are about 1,130 px apart with no connector, so a muted viewer has to cross-match colours.
  - [medium/blank_space] From 3909 to 4200 the lower-left 1080x450 px (pink wall dots and plain desk under the slip and its chips) is empty, while the page is jammed against the right edge with its chip cut off.
  viewer_should_look_at: First the slip's 'CMU' next to the record's 'Carnegie Mellon University'. Then the slip's '2002' next to the record's 2001.
  what_it_should_communicate: A match on the university. A mismatch on the year: off by exactly one. Both legible as visual comparisons without sound.
  what_actually_happens: 3923-3980 (1.93 s): frozen. Nothing happens on 'university' or 'right.'. mUniRec (3951) never visibly fires, because the CMU box is already at t=1 (Math.max(bCMU, mUniRec)).

3980-3992: '2002' gets a coral highlight and the 'year · off by one' chip fades in, on the word 'year', 0.4 s before 'off by one' is said.

3983-4030 (1.6 s): frozen again. mYearRec (4002) never visibly fires either.

The page is at 700-px image width on the right (x 1080-1822, y 150-868). Its 'Carnegie Mellon University' and 'May 16, 2001' lines are about 16-px type, with 24-px labels '2001' and 'university ✓' beside them. The camera is locked at zoom 1.0. The lower-left area (x 0-1080, y 630-1080) is empty wall and desk.
  V2 DIRECTION: Camera: hold the two-shot (about 1.10) with a slow continuous push from 1.06 to 1.10 at cx about 980 across all three verdicts. Do not lean toward one side: each comparison spans both documents.

The record answers through its own window. Drive Evidence focus with the old mUniRec/mYearRec ramps, so the page zooms its content onto the matching line. Each verdict has about 45 frames in V2, with no pauses between them.

University beat:
- 'the university' (4013-4032): saffron ring draws round 'CMU' on the slip (marks.uni, about 10 frames).
- The page window focuses on 'Carnegie Mellon University' at about zoom 3 (about 14 frames, E.out with 3% overshoot), so the line reads about 55 px on screen.
- A thin teal string draws from the slip's CMU ring to the page line (8 frames).
- 'right.' (4037): the 'university · right' chip snaps in (sp SNAP), large: at least 40 px world, at least 44 on screen. It sits in a caption band on the wall below the slip (y about 645-700), left of the source chip with a gap of at least 40 px. indicator_yes.

Year beat:
- 'The year' (4055): the CMU string fades to 30%, and the first chip shrinks (12 frames) to 28 px and slides left into the summary row.
- The page window pans to 'May 16, 2001' (focus zoom about 3).
- 'off' (4071): coral rings close round the slip's '2002' (marks.ring) and round the record's '2001' (DrawBox ring). A coral string links them, and the final digits '2' and '1' flash once.
- 'one.' (4085): the 'year · off by one' chip thunks in large. indicator_no.

Keep the page labels off. The focused window and the chips carry the verdicts; if kept, each appears only during its own beat as a tab on the card edge, at least 34 px.

Sound: marker_circle (CMU ring), paper_lift on each window refocus (-8 dB), indicator_yes, marker_circle x2 (digit rings, rising pitch), indicator_no, chip_pop.
## S5.7 2:14.17-2:16.17 (V1 f4025-4085) | The title was invented.
  - [medium/static_hold] Still run 4040-4085 (1.53 s), during 'title was invented. And every'.
  - [medium/unclear_when_muted] The two titles are never brought together. The invented one is 34-px serif at top-left; the real one is about 30-px Times at top-right, under a label that appeared 4 s earlier. 'Invented' is carried only by a 26-px chip.
  - [low/timing_vs_narration] The 'title · invented' chip is fully on by 4044, during 'title was', 0.2-0.7 s before 'invented.' is said.
  - [low/overlap_or_clipping] The chip wraps onto a second row and sits half on the corkboard and half on the pink wall, across the board's frame line (f4045-f4295). The chips form an uneven 2+1 layout.
  viewer_should_look_at: The slip's invented title, then the real title on the record.
  what_it_should_communicate: The invented title is not a variant; nothing like it exists on the record.
  what_actually_happens: 4030-4044: a coral highlight sweeps the slip's two-line invented title ('Boosting, Online Algorithms, and Other Topics in Machine Learning.'). It lands on 'title', before 'invented.' (4049-4066).

The 'title · invented' chip fades in on a second row (x 165-397, y 603-655), straddling the corkboard's bottom frame at y 625.

mTitleRec (4045) never visibly fires.

4040-4085: still, 1.53 s. The real title on the page (about 30-px type, 'the real title' label on since 3902) is about 900 px away, at a different size and height.
  V2 DIRECTION: - 'The title' (4104-4116): the year string fades and its chip shrinks into the summary row. The page window eases back to the title (focus zoom about 1.4, title about 45 px on screen).
- 'title was' (4107-4125): a highlighter sweep reads along the slip's invented title (marks.title, in sync with the voice).
- 'invented.' (4124): marks.pulse gives one coral glow on the slip's title. The 'title · invented' chip thunks in large into the caption band below the slip; never across the board frame. No connector string this time: nothing on the record matches, and the absent link is the point.

The first review's 'same screen height' alignment is not possible with these sizes (the slip's title lines sit about 150 px lower than the record's title). The focused window makes the record's title readable wherever it sits.

Drop the scanner-bar / 'not on record' ring from the first review. It adds a new claim label and motion graphics the brief warns against.

Next: on 'every' the marks retract (S5.8).

Sound: one long marker_sweep, a soft paper_lift for the refocus, chip_pop at -2 semitones.
## S5.8 2:16.17-2:20.00 (V1 f4085-4200) | And every detail came out looking exactly as solid as the true one.
  - [high/static_hold] Still runs 4087-4151 (2.17 s, 'And every detail came out looking exactly as solid') and 4153-4206 (1.8 s, 'exactly as solid as the true one. A confident'). This is the longest effectively static stretch in S5, under its most important sentence.
  - [medium/other] 'Exactly as solid as the true one' is illustrated by a faint glow on the slip alone. That reads as 'the slip is special' rather than 'they look the same'. The true one gets nothing, so there is no visual equivalence.
  - [low/competing_attention] All verdict marks and labels stay fully saturated, keeping the viewer in grading mode while the sentence moves to 'they look identical'.
  viewer_should_look_at: Both documents together, equally authoritative.
  what_it_should_communicate: On the surface you cannot tell them apart; the invented details are dressed exactly like the true record. This is the thesis of the video.
  what_actually_happens: 4085-4099: a faint gold drop-shadow glow (22 px) ramps onto the slip only. It is too weak to register as motion: the still run starts at 4087.

Then 4087-4151 (2.17 s) and 4153-4206 (1.8 s) are still, about 4 s of near-frozen frame. All marks, all six chips and labels, and the cropped source chip stay at full strength. The page gets no treatment. The camera stays locked at 1.0. The glow fades over 4204-4214.
  V2 DIRECTION: - 'And every detail' (4152-4179): undo the grading. Slip marks wipe back (sweeps retract right to left, rings un-draw, 12 frames). Strings fade. The page window zooms back out to the whole card (focus t to 0, E.inOut). The summary chips slide down behind the caption band's edge or dim to 25%, so both documents look as clean as when they arrived.
- 'looking exactly as solid' (4191-4236): both documents lift 6 px together with identical shadows (paper_lift). One shared glint sweeps the slip's gold edge (marks.glint) and continues across the page's top edge in the same pass (4203-4240): the same polish on both.
- 'as the true one.' (4239-4273): both settle, and the glint finishes on the record.
- Camera: hold the centred two-shot. No new move until 'true'.
- Next: on 'true' (4250) the joke setup begins: the camera starts toward the slip and the checker walks in (S5.9).

The first review's 'equal size' symmetric two-shot is not possible (the documents differ in size). Equality comes from the shared lift and glint instead.

Sound: one soft glint 'shing' spanning both, light paper_lift on the lift. Otherwise quiet.
## S5.9 2:20.00-2:23.37 (V1 f4200-4301) | A confident font is still just a font.
  - [high/timing_vs_narration] The line gets no room: the wipe to S6 begins at 4289, 2 frames after 'font.'. The brief explicitly asks this line to breathe. The headline fade-out and scene fade are dead code (scheduled after unmount).
  - [high/disconnected_or_floating] The magnifier is a floating prop. It scale-pops into existence over the slip while the checker's hands hang empty about 1,000 px to the right (f4240, f4280). The storyboard intent, 'leans in with a magnifier', does not happen.
  - [high/offscreen_or_cropped] From about f4212 the checker covers the middle of the already right-cropped source chip, so the guard-rail citation is both cropped and occluded.
  - [high/competing_attention] About 13-15 elements are live for the punchline: slip, 3 slip marks, 3 verdict chips, page with 3 boxes and 3 labels, source chip, magnifier, 'nice font' chip, headline and checker. Four of them start within 4200-4216. The joke has no stage.
  - [medium/other] The magnifier does not magnify. It parks on 'at CMU)' (the item the slip got right), and its rim and handle hide words of the invented title ('Learning.' under the handle). The 'inspecting the font' gag is not visible.
  - [medium/character_cut] The checker is cut just below the knees by the frame bottom (scale 1.15, feet at y 1160, 80 px below frame). He enters as a rigid 16-frame horizontal slide with no steps, weight or settle, and is half off-screen at f4209.
  - [medium/phone_readability] The whole headline is legible from 4206 while only 'A con-' has been said. 'just a font.' sits at 30% coral on cream (low contrast) until 4258: a ghost pre-reveal that spoils the punchline (V2 rule 5). The 'nice font' tag is 26 px (about 9 px on a phone), and the lens is 172 px wide (about 57 px on a phone) at zoom 1.0.
  - [low/overlap_or_clipping] The 'nice font' chip overlaps the slip's bottom border and touches the 'year · off by one' chip. The headline box covers the page's top-left tape and touches the page's top edge.
  - [medium/static_hold] Still run 4221-4254 (1.13 s, 'confident font is still just'): magnifier and headline frozen right after popping in. 4268-4289 (0.7 s) is static again before the wipe.
  viewer_should_look_at: The lens over the slip's invented title, then the 'nice font' tag and the headline's 'just a font.'
  what_it_should_communicate: Polish is not proof: careful inspection finds only good typography. A dry joke with room to land.
  what_actually_happens: Four onsets in 16 frames on 'A confident':
- 4200-4216: the checker slides in rigidly from x 2200 to 1760, with no steps. Scale 1.15, feet at y 1160, so he is cut just below the knees. At f4209 he is half off the right edge.
- 4204-4214: the glow fades.
- 4206+: the magnifier spring-pops over the slip at x about 470-740, y 285-530.
- 4206-4216: the full headline 'A confident font is still just a font.' (60 px, cream box, x 478-1442, y 62-155) fades in, with 'just a font.' readable at 30% coral, 1.7 s before it is spoken.

The lens is centred on 'at CMU)'. Its rim cuts through '2002', 'Kalai's', 'is' and 'Algorithms', and the handle lies across 'Learning.' of the invented title (f4240, f4280). Inside the lens the glyphs are the same size under a 25% white tint. The checker's hands hang empty, about 1,000 px from the handle.

He stands over the page's lower-right corner and covers the middle of the already-cropped source chip ('Kalai (2001), PhD thesis title page · Carnegie Me[...]U-CS'). The headline box covers the page's top-left tape.

4221-4254: still (1.13 s). 4254-4264: brow and lean change. 4258-4268: the 26-px 'nice font' chip fades in at x 520-680, y 488-537, overlapping the slip's bottom edge and touching the 'year · off by one' chip; the headline turns coral. 4268-4289: static.

4289-4301: a right-to-left wipe to S6 starts 2 frames after 'font.' ends (4287). The headline fade (scheduled 4298) and sceneOut (4302) never run.
  V2 DIRECTION: Hard constraint (V2_DIRECTION §9, H56): the lens must sit centred at screen (960, 540), inner glass radius 130 px, from at least 9 frames before scene('S6').from (4395). That means from 4386. The iris then runs 4386-4404, and S5 must stay alive until 4404.

Setup (4250-4290, starting on 'true'): one camPath push (about 24 frames, E.inOut) from the two-shot to the joke framing. It must satisfy all of these:
(a) A serif glyph of the invented title near the slip's centre (e.g. the 'A' of 'Algorithms') ends at screen centre. At zoom about 2.0 the inner radius is 65 world px (Magnifier scale about 1.07, or an S5-local lens with an explicit inner radius).
(b) The page and its left tape are fully out of frame on the right, at least 20 px margin. With the page at x 1020+ this caps cx at about 490 at zoom 2.0.
(c) The slip's whole header 'ChatGPT · GPT-4o · 9 May 2025' is in frame, at least 30 px clear of the headline.
(d) No set edge shows. The desk ends at x -200; if the framing needs more, extend it in an S5-prefixed DeskSet copy.

Action:
- During the push the checker walks in from frame right (from the record's side) in 3 steps with weight. The magnifier is already in his hand (holdL with reach(), handle in his fist, lowered). He stops just below-right of the slip.
- 'confident' (4295): he raises the lens onto the invented title (about 12 frames, softBack overshoot), elbow bent, his face just below-right of the lens. The frame cuts him mid-chest, never at the shoulders or knees. Lower 'life' while he aims.
- Inside the lens: a masked duplicate of the slip text at 1.8x, so the serifs read about 90-120 px on screen. Keep the glass empty of rim and handle overlap on the target word.
- The dry pause inside 'font…' (4314-4337): the lens glides slowly along the line and stops dead on the target glyph at H56. This is the deliberate inspection beat, and the camera is static.

Reaction, 'is still' (4338-4355): a slight lean back (4 deg) and browAsym 1.

Secondary:
- 'just' (4357): the headline drops in solid with a small bounce, no ghost, at least 44 px on screen. Place it in the top band only if (c) holds; otherwise in the lower-left band (screen y about 930-1030), clear of the checker.
- 'font.' (4367, at('s19','font',2)): 'just a font.' fills coral. The 'nice font' tag (at least 44 px on screen) pops off the lens rim and lands outside the lens circle, clear of the slip text and the checker. The iris will swallow anything inside the circle first.

Final beat (4380-4404): the checker blinks once, the slip's gold edge drains to plain, and the lens holds perfectly still at H56 while the iris opens (ease-in, so its first frames barely open; that is the breath).

There is no room for a 1-s post-line hold inside S5 ('font.' ends at 4384, the scene ends at 4395, 'Now,' starts at 4407). The pause belongs inside 'font…'.

Sound: soft cardigan rustle and footsteps (paper_flap at -10 dB as a placeholder if no cloth kind exists; do not invent a kind), a small wood/glass tick on the lens raise (pencil_tap at -8 dB), near silence under the glide, chip_pop for 'nice font'. The music dips under the line; S6's playful cue starts as the iris opens.

## SCENE PROBLEMS
  - static_hold high motion.json for S5: still_share 0.704 (16.0 of 22.8 s), nine still runs, longest 2.77 s. Each run, and what should develop during it:
- 3649-3712 (2.13 s): tape slaps and header drop on 'record.', underline on 'Kalai's', camera approach on 'thesis:'.
- 3733-3815 (2.77 s): two-stroke marker read of the title, 'Title' tab on 'Learning.', slow drift, dim.
- 3863-3891 (0.97 s): 2001 tick, then the pull-back in the tail.
- 3923-3980 (1.93 s): slip landing, CMU ring, record window focus, string, chip on 'right.'.
- 3983-4030 (1.6 s): digit rings, refocus to the date, chip on 'one.'.
- 4040-4085 (1.53 s): title sweep, refocus to the title, chip on 'invented.'.
- 4087-4151 (2.17 s) and 4153-4206 (1.8 s): marks retract, shared lift and glint, push and checker entrance.
- 4221-4254 (1.13 s): lens raise and glide.
Also the unflagged 0.7-s freeze at 4268-4289.
  - offscreen_or_cropped high Guard rails and text cut by the frame:
- The source chip (22 px) is cut at the right edge from f3902 to the end, and occluded by the checker from about f4212.
- The slip's model/date line 'GPT-4o · 9 May 2025' is 21 px (about 7 px on a phone).
- The 'Title' tab is cut at the top edge for the whole CAM_D hold (3864-3891).
- The first title line is sliced at f3825.
- The committee list is sliced at the bottom in CAM_C.
  - camera_hurts medium Objects drift apart under camera moves. The page, slip and checker are on Layer depth 1, but the corkboard is drawn inside Wall at depth 0.72. During the 3714-3732 push the taped page slides about 40 px down the board (tapes on the board's top frame at f3650, about 30-40 px below it at f3733). The same drift happens on every move.
  - camera_hurts medium Jumpy, then dead:
- Push to the title, tilt down 278 world px to CMU, tilt back up 148 px to a date that was already visible.
- Then a pull-back that overlaps the page slide and the slip pop (three motions in 0.6 s).
- Then the camera is locked at zoom 1.0 from 3909 to the end (13 s), through all three verdicts, the thesis sentence and the joke. At zoom 1.0 the 172-px lens and the 26-px tag are too small to sell the gag.
  - broken_asset medium The verdict system is half dead:
- mUniRec, mYearRec and mTitleRec are combined with Math.max against boxes already at 1, so the record never responds.
- The page labels switch on with a hard threshold (cmp > 0.5) at about f3902, with no animation, and change text mid-move ('Title' to 'the real title').
- The headline fade (cEnd+20) and sceneOut (cEnd+24) are scheduled after S5 unmounts.
  - timing_vs_narration high Every verdict is shown before it is said:
- The university chip on 'ChatGPT' (1.0-1.7 s early).
- The year chip on 'year' (0.4 s before 'off by one').
- The title chip on 'title' (0.2-0.7 s before 'invented.').
- The whole headline about 1.7 s before 'just a font.'.
Then the joke gets no air: the S6 wipe starts 2 frames after 'font.'.
  - unclear_when_muted high With the sound off, the comparison depends on colour-matching small chips across about 1,100 px. The record's evidence lines are about 16-px type. No claim fragment is ever adjacent to or linked with its record line, and 'off by one' and 'invented' are only labelled, never shown.
  - competing_attention high By the end about 13-15 elements are on screen at full strength, and nothing recedes as focus moves (marks, chips and labels never dim). The punchline starts with four simultaneous onsets (4200-4216). The brief allows at most a few things to demand attention at once.
  - disconnected_or_floating medium Props do not sit on or touch anything:
- The record never sits on the board. In the opening layout about 60% hangs below it (y 625-980). In the comparison it spans y 150-868, against a board bottom at 625; its right edge (1822) and right tape pass the board's right frame (1800).
- The slip is untaped next to a taped page.
- The magnifier floats with no hand on it.
  - blank_space medium In the comparison (3909-4295) the slip sits top-left and the page is jammed against the right edge. The lower-left 1080x450 px of wall and desk stays empty, so the frame is unbalanced and the source chip is pushed off-screen.
  - phone_readability high Measured against the V2_DIRECTION §6 bars (critical text at least 44 px, body at least 34, guard rails at least 30 on screen), most of the scene's text fails:
- Verdict chips: 26 px.
- Page labels: 24 px.
- 'nice font' tag: 26 px.
- 'The actual record': 30 px.
- Source chip: 22 px.
- Model/date line: 21 px.
- Record evidence lines in the comparison: about 16-px type.
Only the headline (60 px) and the zoomed title (about 59 px) clearly pass.
  - motion_quality medium Every arrival is the same generic scale-pop with an opacity ramp (page, slip, magnifier), so paper looks translucent while it arrives (f3625, f3900). Chips are plain 10-12-frame fades, and the checker is a rigid horizontal slide. There is no anticipation, tape slap, settle, follow-through or recoil anywhere in the scene.
  - other medium Continuity and kit:
- V1 S5 draws the claim with the Props Slip at 720 px. V2 must use components/v2/AnswerSlip (AnswerSlipArt i=0), so it is the cold-open card the viewer already knows; its marks API covers uni, ring, title, pulse and glint.
- It is not the S4 card (excerpt, 'GPT-4o · published excerpt', IS ENTITLED seal), so do not stage it as 'the same slip returns'.
- The S4→S5 wipe (edge travelling left) and the S5→S6 iris from the lens (H56) are fixed hand-offs in V2_DIRECTION §9.

## TRANSITION IN
V1: S5 is mounted 6 frames early. A 12-frame hard-edged wipe (3606-3618) reveals S5 from the left over S4's last frame: the library, the clerk holding the excerpt slip ('GPT-4o · published excerpt', IS ENTITLED seal, struck-out 'I think' / 'maybe' cards) and the 'a title-shaped answer · simplified illustration' chip. It reveals an empty pink wall and an empty corkboard. The board stays empty until 3621, and the page then scale-pops in, translucent at f3625. 'Here's the actual record' starts over dead frames, and nothing on the S5 side answers the S4 slip's exit.

V2: the hand-off is already fixed in V2_DIRECTION §9 and lib/handoffs: a 12-frame wipe whose edge travels left. S4's last beat slides its sealed slip out to the left with a paper whoosh. S5 is revealed from the right and renders from scene('S5').from - 6, about 3690.

The first review's alternatives conflict with this spec: 'the title page rises from below as the wiping edge', and 'S4 pushes into the slip, which slides off and returns'. S4 owns its last beat.

S5's job is to be alive on the first revealed pixels:
- With the record placed on the right half of the board and the camera framed on it, the page slides in from frame right, travelling left in the same screen direction as the departing slip, just behind the wipe edge.
- It decelerates and overshoots about 1.5%, and is taped on 'actual' / 'record.'.

The returning claim on 'ChatGPT' is the cold-open card (AnswerSlipArt i=0) pinned by the teal-sleeved POV hand, not the S4 excerpt card.

Sound: S4's whoosh carries the wipe; S5 adds paper_slide under it and two tape slaps at landing. The music drops to the evidence bed.

## TRANSITION OUT
V1: a generic right-to-left paper wipe (S6 mounted 6 frames early, 4289-4301) starts 2 frames after 'font.' ends at 4287. It cuts off the headline and the joke, and the planned headline fade and scene fade never run. S6 opens on the game-show curtain with two spotlight cones and the host rising into frame.

V2: this boundary is fixed as an 18-frame iris from the checker's lens (V2_DIRECTION §9, H56 = screen (960, 540), inner glass radius 130 px). The first review called the iris optional; it is required. It also asked for a 1-s hold after 'font.' inside S5, which is impossible in the V2 timeline: 'font.' ends at 4384, S5 ends at 4395, the iris runs 4386-4404 (centred on the boundary), and s20 'Now,' starts at 4407.

So:
- The lens must already be parked exactly on H56 by 4386 and hold still for at least 9 frames.
- The breathing room comes from the dry pause inside 'font…' (4314-4337), where the lens glides and stops, and from the iris itself (ease-in, so its first frames barely open).
- S5 stays alive through 4404: checker blink, slip edge draining, tiny idle drift outside the circle. Anything inside the lens circle is swallowed first, so the 'nice font' tag must sit outside it.
- S6's first frames show a spotlight pool centred on the same point, so lens becomes spotlight.

Music: the evidence bed dips under the line, and S6's playful cue starts as the iris opens, not under the joke.

## SOUND MOMENTS
[
 "V2 3690-3702 (V1 3606-3618): S4→S5 wipe. S4's paper whoosh carries it; S5 adds paper_slide as the record slides in from the right.",
 "V2 3716-3724 (V1 about 3640): record settles on the board. paper_slap, light.",
 "V2 3724 and about 3729 ('actual'; V1 3621-3647): left then right tape. tape_rip x2, the second pitched -1.",
 "V2 3736 ('record.'; V1 3623): 'The actual record' chip drops in. chip_pop. Its exit on 'thesis:' is silent.",
 "V2 3762 ('Kalai's'; V2 only): underline under 'Adam Kalai'. marker_sweep at -6 dB.",
 "V2 3803-3861 and 3863-3895 (title words; V1 3720-3736): two marker_sweep strokes reading along the title, the second pitched +1.",
 "V2 3878 ('Learning.'; V1 3809): 'Title' tab snaps onto the box. pop_tick.",
 "V2 3914 ('Mellon,'; V1 3821): CMU box drawn. marker_sweep.",
 "V2 3933 and 3942 ('May', '2001.'; V1 3852-3864): one-line date box, then saffron underline tick under 2001. marker_sweep plus pop_tick.",
 "V2 about 4000-4009 ('ChatGPT'; V1 3899-3911): POV hand slaps the cold-open card onto the board (paper_slap, stiffer than the page), presses the tape (tape_rip), the gold edge glints (glint at -4 dB).",
 "V2 4016-4034 ('the university'; V1 3911-3923): saffron ring round CMU (marker_circle), the record window refocuses (paper_lift at -8 dB).",
 "V2 4037 ('right.'; V1 3953): 'university · right' chip snaps in. indicator_yes plus chip_pop.",
 "V2 4060-4083 ('year ... off by'; V1 3980-4002): window refocus to the date (paper_lift at -8 dB), coral rings on 2002 and 2001 (marker_circle x2, rising pitch).",
 "V2 4085 ('one.'; V1 4006): 'year · off by one' chip thunks. indicator_no plus chip_pop at -1 semitone.",
 "V2 4107-4125 ('title was'; V1 4030-4044): one long marker_sweep along the invented title; window refocus to the real title (paper_lift at -8 dB).",
 "V2 4124 ('invented.'; V1 4049): 'title · invented' chip thunks. chip_pop at -2 semitones; no chime.",
 "V2 4155-4175 ('every detail'; V1 4085-4104): marks retract and the window zooms out. One quiet reverse marker_sweep at -10 dB, nothing else.",
 "V2 4203-4240 ('exactly as solid ... the true'; V1 4128-4179): both documents lift (paper_lift, light) and one shared glint crosses both (glint, a single 'shing').",
 "V2 4262-4290 ('true one.' to 'A'; V1 4200-4216): the checker's three footsteps with cardigan rustle, using the closest listed kind at low gain (e.g. paper_flap at -10 dB). Do not invent a kind; no whoosh on the camera push.",
 "V2 4295-4307 ('confident'; V1 4206): magnifier raised onto the slip. Small wood/glass tick (pencil_tap at -8 dB).",
 "V2 4314-4337 ('font…' pause): lens glide. Near silence; at most a faint paper_slide at -14 dB. Let the dry pause be quiet.",
 "V2 4357 ('just'; V1 4206-4216): the headline drops. Soft thud_soft at -8 dB or nothing.",
 "V2 4367-4372 ('font.'; V1 4258-4268): 'nice font' tag pops off the lens rim. chip_pop (the comic 'boop'). The coral fill of 'just a font.' gets no sound.",
 "V2 4386-4404 (V1 4289-4301): iris from the lens into S6's spotlight. No whoosh: the S6 sting starts as the iris opens; the evidence bed is already dipped."
]

## PHONE-CRITICAL TEXT
[
 "'The actual record' header (Chip size 30, 3623-3720): 30 px on screen, about 10 px on a phone. Below V2's 44-px bar for a label the narration names; it also sits on the board's top frame and touches the page. V2: at least 44 px, at least 30 px clear of the tapes and the board frame.",
 "Thesis title at wide (f3650): about 38-px type, about 13 px on a phone. Fine only as an establishing read. At CAM_T zoom 1.55 it is about 59 px (about 20 px on a phone): passes. V2: about 70 px at zoom about 2.55 on a 720-px card.",
 "Author/date/CMU lines at wide: about 23-px type, about 8 px on a phone (fail). At zoom 1.9 (CAM_C/CAM_D) about 41-44 px, about 14 px on a phone: borderline. V2: at least 44 px (zoom about 2.6-2.7 on a 720-px card), with 'May 16, 2001' boxed alone and '2001' underlined.",
 "Source chip 'Kalai (2001), PhD thesis title page · Carnegie Mellon University · CMU-CS-01-132' (22 px): about 7 px on a phone, below the 30-px guard-rail bar. Cut by the right frame edge from f3902 to the end and occluded by the checker from about f4212. Fails. V2: two lines at 28 px world (at least 30 on screen at zoom 1.1), fully in frame, never occluded, or fully out of frame with the page.",
 "Slip header 'ChatGPT' (about 31 px): survives at about 10 px on a phone. 'GPT-4o · 9 May 2025' (21 px, about 7 px on a phone) fails the 30-px guard-rail bar. V2: AnswerSlipArt at scale about 1.6 puts it at about 29 px world, about 32 px on screen at zoom 1.1. Keep it in frame and clear of the headline in the joke close-up.",
 "Slip body (ChatGPT's answer, 34-px serif, rotated -2 deg): about 11 px on a phone, exactly at the 34-px body bar. Carries '2002', 'CMU' and the invented title. V2: about 37 px world, about 40 px on screen at zoom 1.1.",
 "Verdict chips 'university · right', 'year · off by one', 'title · invented' (26 px): about 9 px on a phone. These are the scene's conclusions, so the 44-px bar applies: fails. V2: each lands at at least 44 px on screen on its verdict word, then shrinks to a 28-px summary row in the caption band below the board (never across the board frame).",
 "Page labels 'the real title', '2001', 'university ✓' (24 px): about 8 px on a phone. They pop early and all at once. V2: retire them in favour of the focused record window, or show each only during its beat as a card-edge tab at at least 34 px.",
 "Record lines in the comparison (V1 page at 700 px): title about 30-px type (about 10 px on a phone), 'Carnegie Mellon University' and 'May 16, 2001' about 16-px type (about 5 px on a phone). Fail. V2: Evidence focus zooms the card window onto the compared line (about 3x), so the line reads about 55 px on screen.",
 "Headline 'A confident font is still just a font.' (60 px): about 20 px on a phone, passes. But the whole line appears at 4206 (1.7 s early), and 'just a font.' is a 30% coral ghost on cream until 4258 (low contrast, spoiler, V2 rule 5). V2: drops in solid on 'just', at least 44 px, clear of the slip's model/date header.",
 "'nice font' tag (26-px saffron chip): about 9 px on a phone, and it overlaps the slip edge and the year chip. It is the punchline tag, so at least 44 px on screen, outside the lens circle, clear of the slip text and the checker.",
 "Text inside the magnifier: V1 shows the same 34-px glyphs under a white tint, and the lens is 172 px wide (about 57 px on a phone). The 'inspecting the typography' gag is unreadable. V2: lens at H56 (130-px inner radius on screen) with the slip glyphs magnified 1.8x inside, so they read about 90-120 px on screen."
]

# V1 shot review — S2 — The short version (s06–s07), V1 frames 820–1331 (0:27.33–0:44.37, 17.0 s; mounted 814–1337 for the wipes)

What the scene does for the story: S2 is the hinge between the cold open and the explanation. It asks the episode's question ("how can a wrong answer sound that sure?"), shows the title next to ChatGPT's stamped-WRONG slip, previews the three claims the rest of the film unpacks (writes what is likely → S3/S4; checking is a separate job → S8/S9; tests reward guessing → S6/S7), and brands the channel in the 2.4 s pause before S3.

The five biggest execution problems:
(1) It is the stillest scene in the film. 12.7 of its 17.0 s are still (74.3%), and its mean motion energy of 0.393 is the lowest of all ten scenes. Every element arrives as an opacity fade with a 24–30 px rise and then freezes. The panel mechanisms never perform their claims. The tokens only change opacity. The output slip slides 60 px sideways. The EVIDENCE CHECK shutter is hard-coded shut (`height: 150 * (1 - 0.0)`), so that animation is dead. The scoreboards appear already at 7 and 6 and never move. Longest still: 2.97 s at f1085–1173.
(2) Composition and blank space. Frames 952–975 are empty cream except for the "The short version" chip. Panel 1 sits alone in the left 30% of the frame for 2.8 s. Throughout the triptych the band at y≈620–975 (about a third of the frame) is empty, and the citation chip floats alone at the bottom.
(3) Phone readability and cropping. Panel-internal text is 16–26 px, which is 5–9 px on a phone. The "guesser"/"honest" labels, the only cue to whose score is whose, are 16 px. Panel 2's caption is clipped to "a different job · not on this" because "route" wraps below the panel edge. The guard-rail citation chip is fully visible for only about 0.5 s.
(4) Transitions. S1→S2 wipes to blank paper and then re-pops the same ChatGPT slip with S1's highlights and circles gone. Title→panels is a cross-dissolve with ghosting. The sting cross-fades over the panels with visible overlap, and S3's wipe cuts it off after about 1 s at full opacity, even though the code and storyboard intend a 2 s hold.
(5) The payoff on "sure?" is a 10-frame opacity change on one word ('Confidently' going from 25% to 100%) instead of a title event. The storyboard asked for the headline to snap in on "sure?" with the title hit.

## S2.1 0:27.33-0:28.60 (V1 f820-858) | [tail of S1 'Very fictional.' ends f811] … "So how can a" (So f831, how f843, a f853)
  - [high/weak_transition] f814–826: the wipe replaces the counter with an empty cream field while S1's camera is still pulling out, so two motions compete (zoom-out and wipe). The ChatGPT slip then vanishes and re-pops at f827 at another position and size (430 px → 660 px) without its S1 markups. This is the continuity break the brief calls 'illustrations moved around on a timeline', and it wastes the most motivated carry-over transition in the film.
  - [medium/blank_space] f820–840: only the 660×285 slip is on screen; there is no title until f841. The top 45% and bottom 30% of the frame are empty paper.
  - [low/motion_quality] Headline and kicker arrive as a generic 16-frame fade with a 24 px rise on 'how' (f841–857). The title has no weight or moment, and its entrance is not tied to a meaningful word.
  viewer_should_look_at: ChatGPT's slip with its WRONG stamp: the same object the viewer just watched get stamped at the counter, now isolated as the subject of the question.
  what_it_should_communicate: We are leaving the scene at the counter but keeping the evidence. This wrong, polished answer is what the episode is about.
  what_actually_happens: f814–826: Main.tsx paper wipe. S2's cream field enters from the right edge (clip-path inset shrinking from the left) while S1 is still mid camera pull-out from its CHECKER push (S1 zoom-out runs 808–822). At f820 the counter, the checker and the ChatGPT slip fill the left half and blank cream fills the right. The wipe reveals nothing. f827: the ChatGPT slip pops in at screen centre (660 px wide, x≈630–1290, y≈455–740, rotate −3°) on a spring from scale 0.7 while its opacity ramps up. It is a clean copy: S1's yellow highlights, the red circle on 'completed' and the 'university · year · title' note are all gone. f841–857: the kicker 'FUTURE GOT WEIRD · EPISODE 1' and the headline fade up with a 24 px rise; 'Confidently' renders at 25% opacity. Camera locked. Frames 820–840 are about 80% empty paper.
  V2 DIRECTION: SETUP: final S1 frame. The ChatGPT slip sits in its counter window, stamped WRONG. S1's pull-out ends before the transition (don't overlap it).
ACTION (on 'So'): the slip lifts off the counter. 3–4 frame anticipation dip, then a lift with slight scale-up. S1's markups (highlight bars, red circle, footnote) shrink off the slip in a quick 6-frame stagger. The slip travels about 14 frames to the S2 centre, re-laid-out larger at about 760–800 px wide, rotate −3°, centred near y≈600. The counter background wipes to the paper field behind it. The slip itself is never clipped by the wipe.
REACTION: the slip overshoots about 4% and settles. Its drop shadow catches up 2 frames late. The WRONG stamp gives a small after-thump (scale 1.08→1).
SECONDARY (on 'how'): the kicker 'FUTURE GOT WEIRD · EPISODE 1' slides down from the top, quiet.
NEXT: the headline area is reserved but empty, ready to build on 'wrong'.
CAMERA: locked. The slip's travel is the only movement; no zoom-out competing with it.
SOUND: soft paper lift and short air on the travel, a card tap on landing, a tiny rubber thud for the stamp after-thump.
## S2.2 0:28.60-0:31.20 (V1 f858-936) | "wrong answer sound that sure?" (wrong f859, answer f869, sound f881, sure? f903–923), then the beat before "Here's" (f931)
  - [high/static_hold] Still runs at f852–901 (1.67 s) and f907–938 (1.07 s): the episode's central question is asked over a frozen frame. Neither the slip nor the title responds to 'wrong' or 'sound'.
  - [medium/timing_vs_narration] The storyboard intent was for the headline to snap in on 'sure?' with the one title hit. V1 fades the whole headline in on 'how' (f841), so 'sure?' only gets a 10-frame opacity ramp on one word. The payoff is a colour fade, not an event.
  - [medium/other] For 2 s (f841–901), 'Confidently' renders at 25% opacity as a washed-out pink word in the middle of a dark headline. It reads as a rendering bug or disabled text, especially at phone size, rather than as 'not yet confident'.
  - [medium/unclear_when_muted] With sound off nothing links the slip to the title. The slip's 'polished' gold edge (the S1 confidence cue: gold border plus glow) is not used, so 'sounds sure' has no visual.
  - [low/phone_readability] Slip header 'GPT-4o · 9 May 2025' is 18.6 px (about 6 px at 640×360); slip body serif is 30 px (about 10 px). The model/date guard rail is effectively unreadable on a phone.
  viewer_should_look_at: The headline word 'Confidently' landing on 'sure?', then back down to the slip that 'sounds sure'.
  what_it_should_communicate: The question of the episode: the answer is wrong and sounds certain. The title names that confidence.
  what_actually_happens: Title (y≈100–270) and slip (y≈455–745) sit frozen. The only change is 'Confidently' going from 25% to 100% coral opacity over 10 frames (f901–911) on 'sure?'. motion.json still runs: f852–901 (1.67 s, 'how can a wrong answer sound that sure?') and f907–938 (1.07 s, 'that sure? Here's the short'). Bottom 330 px (y 750–1080) empty. Camera locked.
  V2 DIRECTION: SETUP: slip settled at centre, kicker at top, headline slot empty.
ACTION: on 'wrong answer', 'Why AI Is So' and 'Wrong' land as a line with a visible gap between them (each word group drops about 20 px with a small overshoot). The slip's WRONG stamp answers with a tiny re-thump. On 'sure?', 'Confidently' drops into the gap at full coral with squash-and-stretch (compress about 8% on impact, rebound, settle). The neighbouring words are nudged 6–8 px apart and spring back. This is the one title hit.
REACTION: the slip hops about 6 px, and a light sweep runs across its gold 'polished' border (the S1 polish cue). The answer sounds sure.
SECONDARY: slow camera push from 1.00 to about 1.06 across the whole sentence, centred between title and slip (cy≈430), arriving as 'Confidently' lands (emphasis, not decoration). Background life: the slip breathes ±0.4° rotation.
NEXT: after 'sure?', a deliberate quiet hold of about 0.3 s while the glint finishes. On 'Here's', a 4-frame anticipation lift on the headline starts the transition.
DROP: the 25%-opacity ghost word; use the empty gap instead.
SOUND: soft ticks as the title words land, a low title hit plus music hit on 'Confidently', a very low shimmer on the gold glint.
## S2.3 0:31.23-0:32.93 (V1 f937-988) | "Here's the short version. A chatbot" (Here's f931, version. f948–960, A f972, chatbot f982)
  - [high/blank_space] f952–975: about 0.8 s of an empty 1920×1080 cream frame with only the small chip at the top. This is an accidental dead frame between the title and the first claim, during 'short version. A chatbot'.
  - [high/weak_transition] Title and slip simply dissolve and the chip fades over them (ghosting visible at f945–951). Nothing is carried from the title moment into the claims, even though panel 1's output slip ('…in 2002 at CMU') is literally a fragment of the ChatGPT slip that just faded out.
  - [medium/motion_quality] Chip, panel and title all use the same opacity-plus-translate ease-out with no overshoot, settle or weight. There is no physical sense of cards arriving.
  viewer_should_look_at: The handoff: from title plus slip to the first claim panel. 'The short version' header, then the panel 1 machine.
  what_it_should_communicate: We are switching from the question to a three-part answer, and the first part grows out of the same wrong answer.
  what_actually_happens: f937–951: title and slip cross-dissolve out together (easeInOut, 14 frames). f941–955: 'The short version' chip (30 px, ink pill, top 70) fades in over the fading title. The f950 tile shows the ghost headline and slip under the chip. f952–975 (still run, 0.8 s, 'short version. A chatbot'): an empty cream frame with only the 314×54 chip at the top. f975–989: panel 1 fades up with a 30 px rise at the far left (x 90–650, y 190–520).
  V2 DIRECTION: SETUP: headline and slip at rest.
ACTION (on 'Here's the short version'): the headline condenses upward into the 'The short version' header chip in about 10 frames (scale down and travel to y≈90; the chip pill grows behind it). At the same time the ChatGPT slip shrinks and slides down-left to become panel 1's output slip, cropped to its '…in 2002 at CMU' fragment.
REACTION (by 'A chatbot'): panel 1's card swings up from below the frame edge around that slip (hinge or rise with about 3% overshoot and settle), and the hopper and chute assemble above it. The frame is never empty.
SECONDARY: the chip settles with a 2 px bounce. The remaining paper stays quiet.
CAMERA: as panel 1 assembles, the camera is already framed on panel 1 at about 1.5× (panel centred, filling about 75% of the width), so its mechanism reads on a phone. Panels 2 and 3 live off-frame right.
SOUND: a paper swish for the title condensing, a small pop for the chip, a card thunk when panel 1 lands.
## S2.4 0:32.97-0:35.73 (V1 f989-1072) | "is built to write what's likely to come next." (built f999, write f1012, likely f1025–1035, come f1039, next. f1047–1066)
  - [high/static_hold] Still runs at f987–1025 (1.3 s, 'chatbot is built to write what's likely') and f1032–1073 (1.4 s, 'what's likely to come next. Checking'). The machine never runs; the only change is a tile opacity and a 60 px slide.
  - [high/blank_space] Panel 1 occupies only the left 30% and top half of the frame for 2.8 s. The composition is left-anchored with nothing balancing it, as if the other panels were missing.
  - [high/unclear_when_muted] With sound off nothing shows 'predict the next piece'. No candidates compete, nothing is chosen, nothing drops down the chute. The slip moves sideways off the chute, which reads as sliding away rather than being produced.
  - [medium/disconnected_or_floating] 'WHAT'S LIKELY TO COME NEXT' floats as three lines of bare blue type at the panel's top right, with no plate, pointer or connection to the hopper.
  - [high/phone_readability] Tokens are 20 px, the output slip 22 px and the header 24 px, which is 7–8 px at 640×360. The claim label at 34 px (about 11 px on a phone) is marginal, and it is the most important text on screen.
  - [low/motion_quality] Panel enters with a 14-frame opacity fade and 30 px rise. Before 'likely' the dimmed 'ai' tile (40% opacity, including its outline) looks disabled, not like a candidate.
  viewer_should_look_at: Panel 1's hopper: candidate tiles, the favoured one, and the chute feeding it into the output slip.
  what_it_should_communicate: A chatbot is a 'what comes next' machine. It picks the likely continuation and writes it out, and likely is not the same as checked. This plants the S3 token machine.
  what_actually_happens: Panel 1 alone at x 90–650, y 190–520, with its label 'Built to write what's likely' at y≈540–580. The right 1270 px and bottom 480 px are empty, so about 80% of the frame is empty. Tiles 'Kal' / 'ai' / '2002' (20 px serif) sit in the hopper. Tiles 1 and 3 are fixed at 70% opacity; 'ai' starts at 40% and looks greyed out. Still run f987–1025 (1.3 s). On 'likely' (f1025–1037) 'ai' rises to 100% opacity and the '…in 2002 at CMU' slip slides 60 px right, out from under the chute (chute centre x≈304; slip centre moves from about 314 to 374). Still run f1032–1073 (1.4 s) through 'to come next.' The 'WHAT'S LIKELY TO COME NEXT' text (24 px, 150 px box) floats at the panel's top right. Camera locked.
  V2 DIRECTION: SETUP: camera at about 1.5× on panel 1. Hopper with the three candidate tiles (keep 'Kal' / 'ai' / '2002'), the internal type enlarged to at least 32 px at panel scale, and a short bar under each tile. Use bars without numbers, or label them 'illustrative' if numbers appear. The 'WHAT'S LIKELY TO COME NEXT' text gets a small hanging plate attached to the hopper.
ACTION: on 'built to write' the tiles jostle and their bars rise and fall. On 'likely' one tile wins: scale 1.15, brighter fill, thicker outline. The other two dim to about 60% and drop back 4 px.
REACTION (on 'to come next.'): the winner lifts 3 frames (anticipation), drops into the chute with acceleration and lands with a tiny bounce. The output slip feeds DOWN out of the chute, extending its text ('…in 2002' → '…in 2002 at CMU'), and stays centred under the chute.
SECONDARY: the hopper shudders 2 px on the drop and the hanging plate swings 2–3°. Background: new candidate tiles slide in to refill the hopper as 'next.' ends, a hint of the loop S3 will show.
LABEL: the claim label 'Built to write what's likely' at 48 px or more, sliding in on 'built to write'; 'likely' pulses blue on the spoken word.
NEXT: the output slip starts moving right along a short route belt as 'Checking' begins. That motivates the camera move.
SOUND: light tile clacks, a selection click on 'likely', a drop-and-bounce clunk, a short feed or printer whirr for the slip.
## S2.5 0:35.77-0:39.07 (V1 f1073-1172) | "Checking whether it's true is a different job. And some of the" (Checking f1073, true f1103, different f1123, job. f1131–1146, And f1152)
  - [high/static_hold] f1085–1173: 2.97 s still, the longest in S2, across 'Checking whether it's true is a different job. And some of the tests used'. The booth's shutter animation is coded but frozen at a constant.
  - [high/offscreen_or_cropped] Caption 'a different job · not on this route' (top 292, 300 px wide, 22 px) wraps. 'route' falls below the 330 px panel height and is clipped from f1130 to f1296; on screen it reads 'a different job · not on this'.
  - [medium/disconnected_or_floating] Panel 2 has no relationship to panel 1. The caption refers to a 'route' that isn't drawn, and panel 1's slip never approaches the booth, so the idea that the writing path skips checking is invisible.
  - [high/unclear_when_muted] Muted, panel 2 is a closed box with a label. Nothing happens to show that checking is a different job.
  - [high/phone_readability] 'EVIDENCE CHECK' is 26 px (about 9 px on a phone); the caption is 22 px (about 7 px), and clipped.
  - [low/other] Label 'Checking if it's true is a different job' wraps with the orphan 'job' centred alone on line 2, unbalanced next to panel 1's one-line label.
  - [medium/blank_space] With two panels up, x 1250–1920 and y 620–1080 stay empty for 3.3 s.
  viewer_should_look_at: The output slip arriving at the EVIDENCE CHECK booth and not being checked. Then the caption 'a different job · not on this route'.
  what_it_should_communicate: Checking truth is a separate step that the writing process does not pass through by default. This plants S8/S9's evidence machine.
  what_actually_happens: f1073–1087: panel 2 fades up (30 px rise) at x 690–1250, beside the unchanged panel 1. The booth (cream body, teal 'EVIDENCE CHECK' header, grey slatted shutter) is completely static. The shutter's height is hard-coded `150 * (1 - 0.0)`, so the intended open/close animation is dead. f1123–1135: the caption 'a different job · not on this route' (22 px coralDeep) fades in, but it wraps and the second line falls below the panel's 330 px edge and is clipped by overflow:hidden. It reads 'a different job · not on this' from f1130 to the end of the triptych. Still run f1085–1173 (2.97 s, the longest in the scene). The right third of the frame and the bottom 45% are empty. Camera locked.
  V2 DIRECTION: SETUP: end of panel 1's beat. The output slip starts sliding right along a short belt that connects panel 1's chute to panel 2's booth.
ACTION + CAMERA (on 'Checking'): the camera trucks right from panel 1 to panel 2 (ease-in-out, about 18–20 frames), following the slip so the move goes toward the information. Both panels are partly visible mid-move. The camera lands at about 1.5× on the booth by 'whether it's true'.
ACTION (on 'true'): the slip reaches the booth window. The shutter (now animatable) rattles but stays shut, and the booth's lamp or header stays dark.
REACTION: the slip is deflected and continues past the booth along the bending route. On 'different job.' the caption stamps in as ONE line at 36 px or more spanning the panel ('a different job · not on this route'). Fix the clip: widen the caption box or move it above the panel bottom.
SECONDARY: the booth sign sways 1–2° and the slip's paper flutters as it passes. Label balanced as 'Checking if it's true / is a different job' at 48 px or more.
NEXT (on 'And some of the'): the camera eases into the move toward panel 3 (pre-roll), so panel 3 lands exactly on 'tests'.
QUIET: panel 1, now off-frame left, stops moving; do not keep the hopper busy behind.
SOUND: a short belt rumble and slip slide, a locked-shutter rattle with a dull clunk on 'true', a paper flick as the slip is deflected, a light stamp thud for the caption.
## S2.6 0:39.10-0:42.77 (V1 f1173-1283) | "tests used to grade these systems quietly reward guessing." (tests f1173, grade f1194, systems f1213, quietly f1224–1239, reward f1246, guessing. f1258–1277)
  - [high/static_hold] f1183–1256: 2.47 s still. The scoreboards appear already at 7–6 and never roll, tick or change lead. 'grade' and 'quietly' have no visual.
  - [high/phone_readability] 'guesser' and 'honest' are 26 px × 0.62 = 16 px (about 5 px on a phone). They are the only cue to whose 7 and whose 6 it is, so the claim depends on them. 'GUESSING PAYS' at 30 px is about 10 px.
  - [high/timing_vs_narration] The guard-rail citation chip appears only on 'guessing.' (f1256) and is covered by the sting from f1284. It is at full opacity for about 0.5 s and at 24 px it is unreadable either way. It also sits about 360 px below the panel it qualifies.
  - [medium/motion_quality] The GUESSING PAYS stamp uses StampMark's 1.6→1 scale ramp over 12 frames with no anticipation, compression or object response. There is no impact, so the scene's punchline lands softly.
  - [high/blank_space] Full triptych: about 355 px (y≈620–975, a third of the frame) of empty paper between the labels and the isolated citation chip. The panels are 330 px tall when there is room for about 520.
  - [medium/competing_attention] Once all three panels are up, all three are equally bright and frozen. Nothing marks panel 3 as the current claim; the eye only finds it by recency.
  - [low/other] Triptych not centred: left margin 90 px, right margin 70 px.
  viewer_should_look_at: The two scoreboards (guesser and honest), the guesser pulling ahead to 7 against 6, the GUESSING PAYS stamp, then the full triptych with the citation.
  what_it_should_communicate: Some benchmarks score a confident guess above an honest 'I don't know', so guessing gets rewarded. This plants the S6 game show's 7–6. The source and 'simplified' honesty chip must be readable.
  what_actually_happens: f1173–1187: panel 3 fades up at x 1290–1850 with scoreboards already reading 7 (coral, 'guesser') and 6 (ink, 'honest') at scale 0.62. The labels are 16 px. Still run f1183–1256 (2.47 s): nothing moves through 'used to grade these systems quietly reward'. f1256–1268: the 'GUESSING PAYS' stamp (30 px) scales from 1.6 to 1 with an ease-out (no anticipation or impact), and the citation chip 'argued in Kalai, Nachum, Vempala & Zhang (2025) · simplified' (24 px) fades in at the bottom (y≈978–1018). From f1284 the sting cross-fade starts covering everything, so the chip is at full opacity for only about 16 frames (0.53 s). The triptych spans y 190–620; y 620–975 is empty. Margins are 90 px left and 70 px right, so it is off-centre. Camera locked.
  V2 DIRECTION: SETUP + CAMERA: the camera lands on panel 3 at about 1.5× on 'tests'. Boards read 0 and 0. The labels 'guesser' and 'honest' sit on plates at 40 px or more at frame scale, directly under their boards. The citation chip 'argued in Kalai, Nachum, Vempala & Zhang (2025) · simplified' slides in attached to the bottom of panel 3 (30 px or more) on 'tests' and stays until the sting covers it, at least 2.5 s.
ACTION (on 'used to grade these systems'): both boards roll up mechanically. Each step is a digit flip that snaps in 2 frames with a 1-frame settle. They run neck and neck to 6–6 by 'systems'.
REACTION (on 'quietly'): the guesser board slips one more sly click to 7 (small and deliberate) while honest stays at 6. On 'reward' the 7 board pulses (the existing `pulse` prop) and the 6 board sags 3 px.
IMPACT (on 'guessing.'): GUESSING PAYS (44 px or more) rises and hangs 3 frames at scale 1.5 (anticipation). It hits, compresses to 0.92, and the panel jolts 2–3 px for 4 frames (object response), then it settles.
NEXT: immediately after the impact the camera pulls back (about 16 frames, ease-in-out) to the re-laid-out full triptych. The panels are centred and taller (about 560×520, y≈160–680), labels are 48 px, and the citation sits under the triptych at about y 900. Panels 1 and 2 return at full strength and panel 3 keeps a slight highlight. That summary frame holds about 0.5 s, intentionally quiet.
SOUND: board flip clicks (two boards, slightly different pitch), a sly tick for the 7, a small ding on 'reward', a rubber-stamp thud with a short paper rattle on 'guessing.', and nothing for the pull-back.
## S2.7 0:42.80-0:44.37 (V1 f1284-1331) | [silence: the 2.4 s pause after 'guessing.'; S3's 'Let's' at f1340]
  - [high/weak_transition] f1284–1296 cross-fade: the wordmark and tagline ghost over half-transparent panels, labels and citation (f1290). Main.tsx explicitly avoids cross-fade ghosting elsewhere.
  - [high/timing_vs_narration] The code comment and storyboard intend a sting that 'holds about two seconds' (stingOut at cEnd+62 = f1332), but the scene ends at f1331 and S3's wipe starts at f1325. The sting is fully visible for only about 1.0 s and is wiped off mid-hold instead of exiting. The 2.4 s narration pause is mostly spent on the cross-fade.
  - [low/static_hold] f1297–1325: the sting is static. The Wordmark already supports a per-word `reveal` and a per-half `taglineT` build-on, but neither is used. Only a 10% scale-up ran.
  - [low/broken_asset] The Wordmark's underline bar is the same saffron as the sting background, so the brand underline disappears entirely on this card.
  - [medium/weak_transition] f1325–1337: S3's left-to-right wipe slices a conveyor fragment into the saffron card. The handoff is unmotivated and cuts the brand moment rather than resolving it.
  viewer_should_look_at: The FUTURE GOT WEIRD wordmark and tagline.
  what_it_should_communicate: Channel identity ('AI moves fast. We make it make sense.') as a clean breath between the summary and the deep dive.
  what_actually_happens: f1284–1296: a full-frame saffron layer cross-fades in over the triptych (opacity 12 frames) while the triptych layer fades out. At f1290 the 150 px wordmark and the tagline overlap the half-faded panels, labels and citation, a muddy double image. f1297–1325 (still run, 0.97 s): the wordmark holds static; only a 0.9→1 scale ran during the fade. The Wordmark's saffron underline bar (zIndex −1, C.saffron) is invisible on the saffron card. f1325–1337: S3 is wiped in from the left edge (hard edge moving right) over the sting. At f1328 a strip of conveyor (x 0–135) cuts into the saffron card. The coded stingOut (f1332–1342) never plays because the scene ends at f1331.
  V2 DIRECTION: SETUP: the summary triptych holds about 0.5 s, quietly settled, after the GUESSING PAYS impact.
ACTION: the saffron sting card swings in from a top hinge (or drops in with a heavy overshoot), opaque, with no cross-fade. The triptych underneath gets a 3% push-back so the card reads as in front.
REACTION: the wordmark builds with staggered springs via `reveal`: FUTURE, then GOT (coral), then WEIRD, about 4 frames apart, each with a small overshoot. The underline bar wipes left to right in a tone visible on saffron (saffronDeep or cream).
SECONDARY: tagline halves via `taglineT`: 'AI moves fast.' then 'We make it make sense.', 6–8 frames apart.
HOLD: at least 1.2 s after the tagline completes (about 2 s of sting in total, using the V2 voice's pause after 'guessing.'). Very subtle life only, such as a slow underline sheen. No camera move.
NEXT: the card swings or lifts out upward, revealing S3's conveyor with ChatGPT's slip about to arrive. Make sure S3's 'Let's' starts only after the card clears.
SOUND: one card whoosh (not wall-to-wall), the channel branding sting on the music, three soft pops for the words, a light swing-out air into S3's low conveyor ambience.

## SCENE PROBLEMS
  - static_hold high S2 has the highest still share (74.3%, 12.7 of 17.0 s) and the lowest mean motion energy (0.393) of all ten scenes. Seven of its eight still runs fall during narration: f852–901 (1.67 s), f907–938 (1.07 s), f952–975 (0.8 s), f987–1025 (1.3 s), f1032–1073 (1.4 s), f1085–1173 (2.97 s), f1183–1256 (2.47 s). The eighth, f1297–1325 (0.97 s), is the sting hold.
  - motion_quality high Every entrance (title, chip, panels k1/k2/k3, captions, citation, sting) is the same eased opacity fade with a 24–30 px rise and no overshoot, settle, anticipation or follow-through. This is 'illustrations moved around on a timeline'. The panel mechanisms don't move: tile opacity only, a 60 px slide, a shutter frozen by a constant, pre-set 7–6 scoreboards.
  - unclear_when_muted high With audio off the three claims are only communicated by 34 px labels. None of the three illustrations performs its claim (predicting the next piece, skipping the check, scoring guessing above honesty).
  - blank_space high Empty-frame moments: f820–840 (slip only), f952–975 (chip only), f989–1072 (panel 1 in the left 30%), and f1073–1283 (bottom third empty under the 330 px-tall panels). The panels should be taller, centred, and/or shown with a camera that frames each claim.
  - phone_readability high At 640×360 every panel-internal text (16–26 px at 1080p, so 5–9 px) fails, including the argument-critical 'guesser'/'honest' labels. The three claim labels (34 px, about 11 px) and the header chip (30 px) are marginal. The citation guard rail (24 px) fails and is on screen at full opacity for about 0.5 s.
  - offscreen_or_cropped high Panel 2 caption clipped to 'a different job · not on this' for f1130–1296 because 'route' wraps below the panel's overflow-hidden edge.
  - weak_transition high All three internal handoffs dissolve: S1 to blank paper to a re-popped slip, title to empty frame to panel 1, and panels to a cross-faded sting. The one strongly motivated carry-over (the ChatGPT slip, whose '…in 2002 at CMU' fragment is literally panel 1's output) is not used.
  - competing_attention medium Once two or three panels are up, nothing directs the eye to the claim being spoken. All panels stay equally bright and frozen. V2 should either frame the current panel (camera) or recede the others while one is discussed, then restore all three for the summary.
  - timing_vs_narration medium Visual events land on only 6 of the many meaningful words (So, sure?, Here's, A, likely, Checking, different, tests, guessing.). 'wrong', 'come next', 'true', 'grade', 'quietly' and 'reward' get nothing, so the visuals stop developing for 1–3 s at a time.
  - other medium Sound has almost nothing physical to hang on in V1 (fades only), which risks the 'strange silence around a visual action' the brief warns about once V2 adds actions. Each new physical action listed in sound_moments needs its own sound, kept small and category-specific.

## TRANSITION IN
Now: Main.tsx paper wipe, f814–826. S2's empty cream field is revealed from the right edge with a hard edge moving left, while S1's camera is still pulling out from the checker push (f808–822). The counter, the cast and the stamped slips are replaced by blank paper, and the ChatGPT slip then re-pops at centre at f827 (scale 0.7→1) as a clean copy without S1's highlights and circles. A motivated transition fits strongly here, matching the brief's 'answer card becomes a document' family. On 'So' the ChatGPT slip lifts off the counter (anticipation dip), sheds its S1 markups, and carries across the cut to S2's centre while the counter wipes away behind it. It lands with overshoot and an after-thump of its WRONG stamp. S1's pull-out should end before this starts so the two motions don't compete. The same slip then shrinks into panel 1's output on 'Here's the short version', so one object threads the whole first half of the scene.

## TRANSITION OUT
Now: a 12-frame saffron cross-fade over the triptych (f1284–1296) with ghosting, about 1 s of static wordmark, then S3's left-to-right paper wipe (f1325–1337) slices the conveyor into the sting before its coded exit (f1332+) can play. V2: hold the summary triptych about 0.5 s. Swing the opaque saffron card in from a top hinge (no cross-fade). Build the wordmark (per-word reveal, underline wipe in a visible tone, staggered tagline) and hold about 2 s in total using the post-'guessing.' pause. Then lift or swing the card out upward to reveal S3's conveyor, where ChatGPT's slip arrives for 'Let's take ChatGPT's answer apart.' S3 narration must not start until the card has cleared. If a wipe is kept, it should start only after the sting's own exit.

## SOUND MOMENTS
[
 "0:27.6 (f~829, 'So'): ChatGPT slip lifts off the S1 counter: soft paper lift plus short air as it travels",
 "0:27.9 (f~838): slip lands at S2 centre: card tap with a small overshoot settle; tiny rubber after-thump of its WRONG stamp",
 "0:28.6 (f859, 'wrong'): title words 'Why AI Is So … Wrong' land: two soft ticks; optional micro re-thump of the WRONG stamp",
 "0:30.1 (f903, 'sure?'): 'Confidently' drops into the title with squash: the scene's one low title hit, synced to the music hit",
 "0:30.3 (f~910): light sweep across the slip's gold polished edge: very low shimmer",
 "0:31.0 (f931, 'Here's'): headline condenses up into the header: paper swish; 'The short version' chip: small pop",
 "0:32.4 (f~972, 'A'): slip shrinks into panel 1's chute and panel 1's card swings up: card thunk (panel pitch A)",
 "0:33.3–34.1 (f999–1023, 'built to write what's'): candidate tiles jostle in the hopper: light wooden/plastic clacks; bars: faint ticks",
 "0:34.2 (f1025, 'likely'): favoured tile selected: crisp selection click",
 "0:34.6–34.9 (f1039–1047, 'come next.'): tile drops down the chute and bounces: clunk with a small rebound; output slip feeds out: short printer/feed whirr",
 "0:35.8 (f1073, 'Checking'): slip travels the route belt toward the booth: short belt rumble (camera truck itself silent)",
 "0:36.8 (f1103, 'true'): booth shutter rattles but stays locked: metal rattle plus dull 'denied' clunk",
 "0:37.4 (f1123, 'different job.'): slip deflected past the booth: paper flick; caption stamps in: light thud",
 "0:39.1 (f1173, 'tests'): panel 3 lands: card thunk (panel pitch B); citation chip slides in: very soft paper",
 "0:39.8–40.7 (f1194–1222, 'grade these systems'): two scoreboards roll up: mechanical flip clicks, slightly different pitch per board",
 "0:40.8 (f1224, 'quietly'): guesser board's sly extra click to 7: single small tick",
 "0:41.5 (f1246, 'reward'): 7 board pulses: small bright ding; 6 board sags: soft thunk",
 "0:41.9 (f1258, 'guessing.'): GUESSING PAYS stamp: rubber-stamp thud with compression plus a short panel rattle",
 "0:42.8 (f1284): saffron sting card swings in: one whoosh plus the channel branding sting in the music",
 "0:43.1–43.4: FUTURE / GOT / WEIRD pop in: three soft pops; tagline: a light settle",
 "0:44.4 (S3 handoff): sting card lifts/swings out: light air, then S3's low conveyor-room ambience starts under 'Let's'"
]

## PHONE-CRITICAL TEXT
[
 "Headline 'Why AI Is So Confidently Wrong': 112 px at 1080p, about 37 px at 640×360. SURVIVES.",
 "Kicker 'FUTURE GOT WEIRD · EPISODE 1': 30 px, about 10 px. MARGINAL (not argument-critical).",
 "Slip header 'ChatGPT': about 27 px, about 9 px. MARGINAL.",
 "Slip model/date 'GPT-4o · 9 May 2025' (guard rail): about 18.6 px, about 6 px. FAILS. Enlarge the slip to about 800 px wide in S2.1/S2.2 and push in 1.06×.",
 "Slip body (Kalai… 2002 at CMU… 'Boosting, Online Algorithms…'): 30 px serif, about 10 px. MARGINAL (callback; the year matters).",
 "Slip 'WRONG' stamp: 40 px, about 13 px. SURVIVES.",
 "Header chip 'The short version': 30 px, about 10 px. MARGINAL. Aim for 40 px or more.",
 "Claim label 1 'Built to write what's likely': 34 px, about 11 px. MARGINAL, and it is the scene's key text. Needs 48 px or more.",
 "Claim label 2 'Checking if it's true is a different job' (2 lines, orphan 'job'): 34 px, about 11 px. MARGINAL. Needs 48 px or more and a balanced break.",
 "Claim label 3 'Some tests quietly reward guessing': 34 px, about 11 px. MARGINAL. Needs 48 px or more.",
 "Panel 1 'WHAT'S LIKELY TO COME NEXT': 24 px, about 8 px. FAILS.",
 "Panel 1 tokens 'Kal' / 'ai' / '2002': 20 px, about 7 px. FAILS (survives only with larger type plus the ~1.5× push-in).",
 "Panel 1 output '…in 2002 at CMU': 22 px, about 7 px. FAILS.",
 "Panel 2 'EVIDENCE CHECK': 26 px, about 9 px. FAILS/MARGINAL.",
 "Panel 2 caption 'a different job · not on this route': 22 px, about 7 px. FAILS, and clipped to '…not on this'.",
 "Panel 3 scoreboard digits '7' / '6': about 60 px (96 × 0.62), about 20 px. SURVIVES.",
 "Panel 3 labels 'guesser' / 'honest': about 16 px (26 × 0.62), about 5 px. FAILS. Critical: they say whose score is whose.",
 "Panel 3 stamp 'GUESSING PAYS': 30 px, about 10 px. MARGINAL. Needs 44 px or more.",
 "Citation guard rail 'argued in Kalai, Nachum, Vempala & Zhang (2025) · simplified': 24 px, about 8 px, and at full opacity only about 0.5 s. FAILS. Needs 30 px or more, attached to panel 3, at least 2.5 s on screen.",
 "Sting wordmark 'FUTURE GOT WEIRD': 150 px, about 50 px. SURVIVES.",
 "Sting tagline 'AI moves fast. We make it make sense.': 45 px, about 15 px. SURVIVES (but only about 1 s at full in V1)."
]

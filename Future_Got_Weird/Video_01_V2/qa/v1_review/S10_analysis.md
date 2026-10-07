# V1 shot review — S10

S10 is the payoff. It goes back to the cold-open answer counter and answers the title question in two halves. SOUNDING RIGHT comes from patterns in language. BEING RIGHT takes evidence the model doesn't always have. It turns that into a habit: strike 'Does it sound right?', then ask 'What's the evidence?' and 'Does it actually say this?'. It lands one last joke on a human ('Trust me, I read it somewhere.', stamped SOURCE?) and signs off on the FUTURE GOT WEIRD end card. V1 has the right words in the right order, but it plays as text slides over a frozen backdrop.

The 5 biggest execution problems:
(1) It is frozen. 19.7 s of 33.0 s (59.7%) is still, across 13 runs. The camera is locked wide for f7435–7995 (18.7 s). The clerks hold one idle pose (4-frame blinks, torso scaleY ±0.4%) until f7949, and the checker never changes pose. The worst stretches are three: about 3 s on the thesis line and its pause (f7684–7773); about 3 s on a finished habit block while 'Ask what the evidence is' is spoken (f7800–7890); and about 4 s of finished end card before a fade (f8277–8401).
(2) The hierarchy is inverted and there is no winner. SOUNDING RIGHT and BEING RIGHT are 26 px grey caps (about 9 px on a phone), the smallest text on two identical cards. With the sound off, nothing shows that being right wins or what the model is missing.
(3) The overlays are pinned at screen y=70, over the set. They cover the ANSWERS sign from f7446 to f7957 (with a stray 'W' between the columns), flatten the arch tops, trim the clerks' hair, and Q2 covers clerk B's eyes (f7890–7957). Meanwhile the counter-front band (y≈703–1080, 35% of the frame) is empty for 18.7 s, and it is about 40% of the frame again in the window-3 push.
(4) Cues fire on the wrong words. 'What's the evidence?' lands on "don't ask whether" (f7789–7803), 1.7 s before "Ask what the evidence is" (f7839). This happens because at('s34','Ask') is case-insensitive and matches the 'ask' in "don't ask". The strike is finished (f7803) just as 'it sounds right' begins. The punchline slip is clean for only about 0.6 s, and the gag reaction gets about 4 clean frames before the camera and the crossfade leave. The V2 source file is still identical to V1, so the same cue would fire at V2 f7961 instead of f8011.
(5) The final gag is physically broken. A disembodied coral bar, about 1,000 px long, comes in from the left edge and cuts across clerk B's chest. The SOURCE? print is about 2.4× wider than the stamp pad and lands about 90 px right of and 80 px below it. The slip floats upright in front of the person's chest and neither of the person's hands touches it. The off-centre push separates the clerks from their windows through parallax. Seven motions overlap in f7994–8030. After that, five crossfades end the scene on a wash to blank cream.

## S10.1 4:07.8-4:11.0 (V1 f7435-7530) | So why is AI so confidently wrong?
  - [high/static_hold] Still run f7464–7511 (1.6 s) across 'why is AI so confidently wrong?'. After the card lands at f7454 nothing develops. 'confidently' does not react when spoken (f7486–7502), and the clerks it describes do not move.
  - [medium/overlap_or_clipping] The card (y 70–208) covers the ANSWERS sign from f7446, so the sign is readable only for f7441–7446. Its top edge and strings still poke out above the card (y 55–70), which looks like an error, and the card cuts across the arch tops (y≈135).
  - [medium/character_cut] The checker (world x 150, y 1130, scale 1.08, depth 1.14) is cut by the left edge: his outstretched left hand leaves the frame at x 0, y≈880–915. He is also cut at the shins by the bottom edge (his feet are at y≈1107, off-frame). His head (y≈625–760) straddles the counter-top band (y 668–703), and the band's lower edge runs straight behind his glasses at y≈697, a tangent through his eyes. Standing in front of a counter that reaches his chin, he reads as sunk into the floor. He holds one pose (armL 10/60, smirk) in every frame he is on screen.
  - [medium/blank_space] The counter front (y≈703–1080, 35% of the frame) is empty panelling for this shot and the next four (f7435–7995), while all the content is squeezed into y 55–470. The wall corners left of window 1 (x 0–270) and right of window 3 (x 1650–1920) are also empty.
  - [low/disconnected_or_floating] The question is a screen overlay that nobody looks at or touches. The clerks' gaze stays fixed at lookX −0.2 / lookY 0.2.
  - [medium/weak_transition] A generic 12-frame wipe; nothing carries across. S9 ends on the stamped CLAIM FAILS ChatGPT slip, with the checker full-figure at x≈1640. S10 starts with no slip and the checker cropped into the opposite corner. The V2 hand-off spec (V2_DIRECTION §9, lib/handoffs.ts H910) requires a match cut on that slip.
  viewer_should_look_at: The three clerks, who are the cold-open answer services (window 1 handed out the ChatGPT slip, 2 DeepSeek, 3 Llama), the CLAIM FAILS ChatGPT slip that S9 just stamped, and the question, landing on 'confidently'.
  what_it_should_communicate: We are back where the episode started, and the title question is finally getting answered. The clerks look exactly as sure of themselves as in the cold open, while the proof that they were wrong (the failed slip) sits right in front of them.
  what_actually_happens: The house paper wipe from S9 runs f7429–7441. Its hard edge travels right to left: at f7436, 548 px of S9's pulled-back desk is still showing on the left, and at f7440 a 12 px strip. It reveals a locked wide (cam cx 960, cy 560, zoom 1). The clerks stand at x 480/960/1440 in an idle smile with their gaze down-left; their faces occupy y≈308–470. The checker stands in front of the counter in the bottom-left corner. The question card (88 px, cream, x 248–1672, y 70–208) fades in over f7442–7454 directly over the ANSWERS sign (x 730–1190, y 55–150). At f7446 'ANSWERS' ghosts through the half-faded card. Afterwards only the sign's top edge and its two strings poke out above the card, and the card cuts off the tops of all three arches. From f7454 to f7525 only blinks change (still run f7464–7511, 1.6 s). 'confidently' is coral but does not animate when it is spoken (f7486–7502). The card fades out over f7525–7533 while the next card fades in.
  V2 DIRECTION: SETUP (V2 f7596–7608, the silence before 'So'): open on the H910 match cut. Frame 1 shows the ChatGPT slip (SlipOnScreen i=0, screen cx 960, cy 500, scale 1.5, rot −2°, coral 'Claim fails' stamp at size 40, rot −9°) over S10's counter. The camera is pushed in on window 1 (≈cx 480, cy 600, zoom 1.5), so clerk A's eyes peek over his own failed slip. Over f7597–7610 (E.inOut) the camera eases out to the wide while the slip descends and shrinks to its counter pose: upright on the counter lip in front of window 1 (x≈300–660, y≈560–840, scale 1.0, rot −3°). It lands at f7606 with a 6 px overshoot, and clerk A's hands come down onto its top corners (reach). Place the checker behind the left end of the counter exactly as in V2 S1 (CHECKER x 120, y 790, scale 0.92, pencil in his hand, head at ≈y 375–480): no corner crop and no tangent. Clerks in a living idle (life ≈0.6).

ACTION ('why' f7621 → 'AI' f7635): the question drops into S1-V2's hanging-ticket slot (long strings from above, two hooks). Set it in 72 px type on a card of about 1250×120 at y≈165–285, so it stays at least 20 px above clerk B's bun (y≈308) and below the sign, which stays readable. It catches and sways in a damped ±1.5° → 0 over ~18 frames.

REACTION ('confidently' f7655): clerks A, B and C puff up into their cold-open confidence, 3 frames apart: lean back 3°, chin up, grin, brows 0.6. 'confidently' swells 1.0 → 1.08 → 1.0 as it is spoken.

SECONDARY ('wrong?' f7674): clerk A's eyes drop to the CLAIM FAILS slip under his hands and his grin flattens. B and C side-eye him. The checker taps his pencil once on the counter.

NEXT DEVELOPMENT (silence f7687–7702): the ticket is hoisted out through the top on its strings (8 frames, ease-in), so 'Because' starts on a clear frame.

CAMERA: after the opening ease-out, locked wide. This needs the arches drawn on the clerks' plane (see the scene camera problem) so window 1 stays aligned with clerk A through the 1.5 → 1.0 move.

QUIET: the wall and the counter front.

SOUND: amb_counter from the scene start; paper_slap on the slip landing; hanger_click as the ticket catches; pencil_tap; paper_swish (−12) on the hoist.
## S10.2 4:11.0-4:14.3 (V1 f7531-7629) | Because sounding right comes from patterns in language,
  - [high/phone_readability] 'SOUNDING RIGHT' is 26 px inkMuted grey with wide letter-spacing, the smallest and weakest text on the card (≈9 px on a 640×360 phone). The brief wants SOUNDING RIGHT / BEING RIGHT 'extremely clean and visually dominant'.
  - [medium/static_hold] Still runs f7543–7569 (0.9 s, 'Because sounding right comes from patterns') and f7583–7621 (1.3 s, 'from patterns in language, and being'). The card lands and then nothing develops.
  - [medium/other] Ghost pre-reveal and an unfinished-looking card. 'patterns in language' sits at 30% opacity for 1.5 s before 'patterns' is spoken (f7531–7577), and the reserved chip row leaves an empty band of about 75 px at the card's bottom over the same time. V2_DIRECTION rule 5 bans ghost pre-reveals.
  - [medium/unclear_when_muted] The chips are 22 px (≈7 px on a phone) grey outline pills that appear by opacity only. Nothing ties them to the real and fabricated thesis titles, and 'is entitled:' as a chip is cryptic.
  - [low/phone_readability] The 54 px line breaks the key phrase across two lines ('patterns in / language'). 'language' is left orphaned on line 2 with about 220 px of empty card to its right.
  - [medium/weak_transition] The question card's fade-out overlaps the column's fade-in at f7531–7533. At f7536 'ANS' ghosts through the 60%-opacity card, and afterwards 'WERS' pokes out of the card's right edge.
  - [medium/motion_quality] The entrance is opacity plus a 20 px rise over 14 frames, with no overshoot or settle. The 'patterns in language' highlight is only an opacity change (0.3 → 1) on blue text, which barely registers.
  - [low/overlap_or_clipping] The card's bottom edge (y 330) kisses the top of clerk A's visor (y≈333) and cuts off window 1's arch.
  viewer_should_look_at: The words SOUNDING RIGHT first, then 'patterns in language', then the plausible words that make up the pattern.
  what_it_should_communicate: The first half of the answer: fluent, plausible text comes from learned language patterns. The same plausible words (Methods, Algorithms, Machine Learning, 'is entitled:') produced the fake dissertation title.
  what_actually_happens: Same locked wide. The question card crossfades out (f7525–7533) while the SOUNDING RIGHT card fades in and rises 20 px (f7531–7545) into x 120–937, y 70–330. 'SOUNDING RIGHT' is 26 px inkMuted letter-spaced caps. The 54 px line wraps as 'comes from patterns in / language'. 'patterns in language' is shown at 30% opacity from f7531, a ghost pre-reveal, and reaches full blue at f7589. Until then the row reserved for the chips is an empty band (y≈255–330); four 22 px outline chips (Methods · Algorithms · Machine Learning · is entitled:) fade in over f7577–7589. The 'WERS' of the sign pokes out to the right of the card. Still runs: f7543–7569 (0.9 s) and f7583–7621 (1.3 s). The clerks and the checker never move.
  V2 DIRECTION: LAYOUT RULE for s33 (V1 wide coordinates): faces are at y≈308–470 and the sign at y 55–150, so the two answer cards go into the empty counter-front band as placards, not over the set.

SETUP ('Because' V2 f7703): switch to 'conclusion mode'. The wall and arches dim about 30% over 10 frames; this is a light change, not a fade. The clerks stay at full strength with life ≈0.3, so they move only on cue. Camera locked wide.

ACTION ('sounding right' f7712–7736): the SOUNDING RIGHT placard rises from below the frame bottom into x 220–930. Its top edge stops at y≈500, at least 30 px under the clerks' chins, so they read as standing behind it; it hides the slip at window 1 until s34. SOFT spring, 12 px overshoot, settled by ≈f7728. 'SOUNDING RIGHT' is the hero: 68 px ink with a blue underline bar. The subline appears with the voice: 'comes from' on f7740, then 'patterns in language' on its own line at 46 px, each word filling blue as it is spoken (f7751–7782). No text appears before its word.

REACTION ('patterns' f7751 → f7782): the four callback words drop in as token tiles (≥34 px text, 4 frames apart from f7755) and lock into two rows, 'Methods · Algorithms / Machine Learning · is entitled:', using the S3 token-lock motion.

SECONDARY: clerk A, whose head is above this card, glances down at it. The checker, just left of the card, points his pencil at the tiles: the pencil tip reaches ≈x 250, y 650 in a 6-frame move, then holds.

NEXT DEVELOPMENT (silence f7783–7794, about 0.4 s): a small blue 'sounds right' tick pulses once on the card, then the card dims to 80% so attention passes to the right.

QUIET: the dimmed wall and the empty right half of the counter front, which is waiting for its card.

SOUND: thud_soft for the card (panned left); token_lock ×4, light, rising in pitch; pop_tick for the tick. The takeaway music starts building here.
## S10.3 4:14.3-4:17.7 (V1 f7630-7732) | and being right takes evidence the model doesn't always have. [600 ms pause]
  - [high/static_hold] About 3 s frozen (f7684–7773) across the thesis line 'the model doesn't always have' and the pause after it. The most important sentence of the scene plays over a frozen frame.
  - [high/phone_readability] 'BEING RIGHT' is 26 px grey (≈9 px on a phone). The chip 'Kalai (2001) · thesis title page' is 22 px (≈7 px on a phone), below V2's 30 px floor for guard-rail text, and it is the factual anchor of the conclusion.
  - [medium/unclear_when_muted] 'doesn't always have' is never visualised. With the sound off the viewer sees two identically styled text cards, with no verdict, no contrast and nothing missing.
  - [medium/overlap_or_clipping] A stray 'W' of the buried sign sits between the cards for 4.7 s (f7630–7773). The card bottoms (y 330) cut all three arch tops flat and trim clerk C's hair.
  - [low/competing_attention] Both cards have the same size, style and weight, so the eye gets no hierarchy and no sense of which side is the answer.
  viewer_should_look_at: BEING RIGHT, the word 'evidence', the Kalai (2001) thesis title page, and what is missing on the model's side.
  what_it_should_communicate: The second half of the answer, and the verdict. Being right needs evidence (here, the actual 2001 thesis title page), and the model often doesn't have it. BEING RIGHT has to visibly win the comparison.
  what_actually_happens: The BEING RIGHT card fades in and rises (f7630–7644) at x 983–1798, y 70–330, with the same 26 px grey label. 'evidence' sits at 30% until it turns teal over f7656–7668, along with a 22 px white-on-teal chip, 'Kalai (2001) · thesis title page'; until then its row is an empty band. Together the two cards hide the sign, except for a 'W' and the sign's bottom border in the 46 px gutter between them (x≈937–983, f7630–7773). Their bottom edges at y 330 flatten all three arches into rectangles and trim the top of clerk C's hair (y≈318–330). From f7668 until the columns crossfade out at f7773 nothing moves (still runs f7684–7731, 1.6 s, and f7733–7773, 1.37 s, separated only by a blink). That is about 3 s frozen across 'the model doesn't always have.', the pause, and 'So when an answer matters,'. Both cards keep equal weight to the end.
  V2 DIRECTION: SETUP ('and being' f7797 → 'being' f7803): the BEING RIGHT placard rises from below the frame into x 990–1780, top edge at y≈500. It is 80 px wider than the left placard and lands heavier: HEAVY spring, 8 px overshoot, firmer settle by ≈f7818. 'BEING RIGHT' is 68 px ink with a teal underline bar. Subline at 46 px, 'takes evidence the model / doesn't always have', each word on its cue.

ACTION ('evidence' f7827): 'evidence' fills teal. A thumbnail of the real Kalai 2001 title page (a crop of the page shown in S9, about 220×160) slides in and docks in the card's lower-left, carrying the chip 'Kalai (2001) · thesis title page' at ≥30 px with the same wording.

REACTION ('the model doesn't always have' f7847–7879): beside the thumbnail, a dashed empty slot marked '?' (the model's missing copy) jiggles twice (±3°) on 'doesn't' (f7854) and stays empty. Clerk C, whose head is above this card, looks down at the empty slot and then away, sheepish.

SECONDARY ('have.' f7871): the checker turns from the left card to the right one and gives one firm nod. A teal marker underline draws under BEING RIGHT, and SOUNDING RIGHT drops to ≈65%, so the comparison has a winner.

NEXT DEVELOPMENT (silence f7880–7900, 0.7 s): hold the verdict for 12 frames. Then both placards sink out through the bottom, left first and right 4 frames later, with a 6 px anticipation lift and E.in. They clear by ≈f7904 and reveal the CLAIM FAILS slip on the counter, ready for 'So when an answer matters'.

CAMERA: locked.

QUIET: the dimmed wall; clerks A and B.

SOUND: thud_soft at +3 dB, panned right; paper_slide plus pop_tick for the thumbnail; card_flick ×2 at −6 dB for the slot's double rattle; marker_sweep for the underline; two soft paper_swish for the sink.
## S10.4 4:17.8-4:21.3 (V1 f7733-7838) | So when an answer matters, don't ask whether it sounds right.
  - [high/static_hold] The columns are frozen through 'So when an answer matters,' (f7733–7773, 1.37 s). After that the finished block is frozen from f7803 to f7890 (about 3 s across two runs).
  - [high/timing_vs_narration] Q1 'What's the evidence?' lands on "don't ask whether" (f7789–7803), 1.7 s before 'Ask what the evidence is' (f7839), so its answer is on screen before the line that introduces it. The strike is complete at f7803, just as 'it sounds right' starts (f7802). Root cause in S10_Payoff.tsx: const cAsk = at('s34','Ask'). norm() lowercases, so occurrence 1 is the 'ask' in "don't ask". It needs at('s34','Ask', 2).
  - [medium/competing_attention] The pill fade-in (f7779–7791), the Q1 fade-in (f7789–7803) and the strike (f7791–7803) all happen within 24 frames. The strike, which is the point of the line, competes with a new card appearing right under it.
  - [medium/weak_transition] Crossfade: over f7776–7790 the two columns ghost under the new pill, and 'ANSWERS' ghosts through 'Does it sound right?'.
  - [medium/unclear_when_muted] 'an answer' is never on screen. The habit is abstract text over an unchanging backdrop, with nothing being judged.
  - [medium/phone_readability] 'Does it sound right?' is 48 px inkMuted grey on cream (≈16 px on a phone, low contrast), and the strike is a thin 5 px coral line rotated −1.5°.
  viewer_should_look_at: A real answer (the slip), then the old habit 'Does it sound right?' being crossed out as 'sounds right' is said.
  what_it_should_communicate: The lesson becomes a habit: when an answer matters, 'it sounds right' is the wrong test.
  what_actually_happens: The columns stay frozen until f7773, then fade out (f7773–7783) while a 48 px inkMuted pill, 'Does it sound right?', fades in exactly over the ANSWERS sign (f7779–7791). At f7782–7786 both texts are superimposed, and the sign's top edge peeks out above the pill. About 10 frames later, on 'ask whether', the Q1 card 'What's the evidence?' fades in and rises 16 px below the pill (f7789–7803, x 580–1336, y 184–280). This happens because askT is keyed to at('s34','Ask'), which matches the lowercase 'ask' at f7789 rather than 'Ask' at f7839. The coral strike draws over f7791–7803 at the same time, so it is finished as 'it sounds right' is only starting (f7802–7836). From f7803 the whole block (struck pill plus Q1) is complete and frozen until Q2 at f7890 (still runs f7800–7841 and f7843–7890, ≈3 s). No answer is ever shown for 'an answer matters'. The camera stays locked wide and the clerks are static.
  V2 DIRECTION: CUE FIX FIRST: key Q1 to at('s34','Ask', 2), which is V2 f8011. Occurrence 1 is the 'ask' in "don't ask" (V2 f7961).

SETUP ('So when' f7903): the placards have sunk, and the CLAIM FAILS slip is visible on the counter in front of window 1 (x≈300–660, y≈560–840) with clerk A's hands on it. The wall stays dimmed. Keep the camera on the wide. A push to cy 590 / zoom 1.06 would lift the sign to y≈9, where it kisses the frame edge, so don't push.

ACTION ('an answer matters' f7915–7944): clerk A pushes the slip toward camera: a 10 px hop, scale 1.0 → 1.15, rot −3° → 0, SOFT settle by ≈f7935. Now 'an answer' is a physical object. Its 'ChatGPT · GPT-4o · 9 May 2025' header stays unoccluded.

REACTION ('ask whether' f7961 → 'right.' f7989): the 'Does it sound right?' placard rises from below the frame onto the counter front to the right of the slip (x≈820–1790, y≈790–900), ≥56 px in inkSoft, darker than V1. On 'right.' (f7989), and not before, the checker flicks his pencil and a thick (≥10 px) coral marker strike draws left to right over 8 frames.

SECONDARY: the checker shakes his head once (f7992–8004); clerk A looks at the struck words.

NEXT DEVELOPMENT (silence f7995–8008): the struck placard tips 4° and drops out through the bottom, clearing the band for Q1.

QUIET: clerks B and C; the slip once it has settled.

SOUND: paper_slide plus thud_soft (−6) for the slip; card_flick as the placard rises; marker_sweep at +2 dB on the strike; paper_flap on the drop.
## S10.5 4:21.3-4:24.9 (V1 f7839-7946) | Ask what the evidence is, and whether it actually says this. [500 ms pause]
  - [high/static_hold] About 2.8 s frozen in this shot (f7843–7890 and f7912–7947). 'Ask what the evidence is' gets no visual event at all, because its card arrived 1.7 s earlier.
  - [high/overlap_or_clipping] Q2 (y≈304–396 from f7890) covers clerk B's face until f7957. Q1 (y 184–280) cuts across the arch tops, and the whole stack is centred on clerk B's head.
  - [medium/phone_readability] The Q1/Q2 text is 34 px (≈11 px on a phone), below V2's 44 px floor for critical text. The episode's actionable takeaway is smaller than the 54 px column sublines it follows.
  - [medium/motion_quality] Opacity plus a 16 px translate, with no landing, no tick and no response from anyone on screen.
  - [low/unclear_when_muted] 'this' refers to nothing visible, and the link to S9's identical card is never made.
  viewer_should_look_at: Question 1, then question 2, and 'this', meaning the claim on the slip.
  what_it_should_communicate: The two checks the whole episode has demonstrated, as a usable takeaway: find the evidence, then check that it actually says what is claimed. It mirrors S9's checklist, whose card 2 is the same 'Does it actually say this?'.
  what_actually_happens: Q1 'What's the evidence?' (a 760 px card, 34 px text, ink badge) has been on screen since f7803, so nothing happens on 'Ask' (f7839). The frame is frozen through 'Ask what the evidence is, and whether it actually' (still run f7843–7890, 1.6 s). Q2 'Does it actually say this?' fades in and rises 16 px over f7890–7902, landing at y≈304–396 directly over clerk B's face. Her bun, forehead and the top of her glasses are hidden; only her mouth and chin show below the card until f7957. Then the frame is frozen again (f7912–7947, 1.2 s). 'this' points at nothing on screen. Camera locked wide; the clerks idle; the checker unchanged.
  V2 DIRECTION: SETUP ('Ask' f8011, keyed with at('s34','Ask',2)): the Q1 'What's the evidence?' placard rises from below the frame onto the counter front to the right of the slip, at x≈820–1790, y≈730–850 (text ≥50 px, badge 64 px). SOFT spring, 10 px overshoot.

ACTION ('evidence' f8027): badge 1 flips from ink to teal with a tick, echoing S9's checklist. In the silence after 'is,' (f8048–8057) the Kalai title-page thumbnail pops up from Q1's right end (≈x 1600–1780, y 600–720) for about 20 frames as the example of evidence, then tucks back.

REACTION ('whether' f8065 → 'this.' f8100): Q2 'Does it actually say this?' rises into y≈870–990 under Q1 (≥50 px), worded exactly like S9's card 2. A coral underline draws under 'actually' as it is spoken (f8076). On 'this.' (f8100) three things happen together. The slip lifts toward camera (scale 1.15 → 1.67, centred ≈(500, 720), 8 frames SOFT), so 'GPT-4o · 9 May 2025' reads at ≥30 px and the slip's top edge stays at least 15 px under clerk A's chin. A coral leader draws from Q2's left end to the slip's highlighted fabricated title. The CLAIM FAILS stamp glints once.

SECONDARY: the checker ticks the air with his pencil as each card lands and nods on 'this.'. Nothing goes above y≈485, so every face stays clear.

NEXT DEVELOPMENT (silence f8109–8133, 0.8 s): the leader retracts, Q1 and Q2 sink out through the bottom 4 frames apart, and the slip settles back into its counter pose.

CAMERA: locked wide.

QUIET: the clerks (small looks only) and the dimmed wall.

SOUND: card_flick ×2, the second pitched up; pop_tick for the badge; paper_lift and paper_slide (−6) for the thumbnail; marker_sweep (−3) under 'actually'; marker_sweep (−6) for the leader; glint; paper_swish as the cards sink.
## S10.6 4:24.9-4:26.5 (V1 f7947-7995) | Works on chatbots.
  - [medium/motion_quality] The 'nod' is a small rhythmic vertical bounce (−4 px, ~19-frame period) with a fixed toothy grin. It reads as idle jitter or pride, the opposite of conceding, and it keeps going while the person enters and the stamp arm arrives (until f8030).
  - [medium/weak_transition] The habit text fades out on top of clerk B's face (f7947–7957), a ghosted double exposure on a character.
  - [medium/unclear_when_muted] With the sound off, grinning, bouncing clerks don't say 'the check works on chatbots'. The questions have already gone when the clerks react, and nothing they do relates to their answers.
  viewer_should_look_at: The three clerks (the chatbots) reacting.
  what_it_should_communicate: The habit works on the AI. Checked against evidence, the clerks' confident answers don't survive, and they concede with a little sheepishness.
  what_actually_happens: The habit block fades out over f7947–7957. At f7950 the ghost of Q2 lies across clerk B's face, and the struck pill ghosts over the returning ANSWERS sign. From f7949 all three clerks switch to a toothy grin with raised brows and bounce −4 px on |sin| (≈19-frame period, 7 frames apart). The bounce keeps going through the person's entrance and only stops at ≈f8030. The camera stays wide and locked until f7996, and the checker does not move.
  V2 DIRECTION: SETUP ('Works' f8136): the wall dim lifts over 10 frames. The camera holds the wide.

ACTION ('chatbots.' f8150): each clerk gives one sheepish nod, staggered A → B → C by 4 frames: the head dips 8 px and returns with a 2 px overshoot, eyes drop, mouth goes from grin to flat smile, brows tilt to concede. Each nods once, then stops (life back to ≈0.5).

REACTION (f8156–8170): clerk A slides the CLAIM FAILS slip back off the counter and through his window, with his hands on it the whole way (reach). This closes the loop from the cold open.

SECONDARY: the checker gives a small satisfied nod and taps his pencil.

NEXT DEVELOPMENT: the gap before 'Works pretty well' is only f8171–8180 (about 0.3 s, not 1 s). Start two approaching footsteps from frame-right under the tail of 'chatbots.' (≈f8166 and f8174), and flick clerk C's eyes right at f8172. That sets up the entrance with no dead beat.

QUIET: the background; clerk B after her nod.

SOUND: paper_slide; pencil_tap; footsteps. SFX_KINDS has no footstep kind, so use thud_soft at −9 dB per step, or ask the lead to add one; don't invent a kind.
## S10.7 4:26.5-4:28.4 (V1 f7996-8053) | Works pretty well on people, too. [900 ms pause]
  - [high/disconnected_or_floating] The stamp arm is the same horizontal coral bar from the left screen edge that the brief flags in the answer stage, about 1,000 px visible. Its owner (the checker) was pushed out of frame at f8004. It cuts across clerk B's chest and window 2 for f8016–8056, and nobody reacts to it.
  - [high/motion_quality] No anticipation: the hand arrives already at stamping height. The press is a soft sine, with no squash, no slip or counter jolt and no camera response. The print is 2.4× wider than the pad and lands about 90 px right of and 80 px below it. After the hit the arm hangs still for 8 frames, then slides out sideways with no recoil. The gag registers less motion energy than both the push (~4:26.8) and the end-card fade (~4:28.9).
  - [high/timing_vs_narration] The reaction is cut off. The 'o' face shows from f8034 to f8058, but the arm is still in frame until ≈f8052, the camera moves from f8054 and the frame dissolves from f8058, which leaves about 4 clean frames. V1's pause after 'too.' (f8041–8063) is spent leaving instead of landing. The brief says: 'Let the final source/gavel joke land.'
  - [high/disconnected_or_floating] The slip appears from nothing at f8008 and floats upright in front of the person's chest. It neither lies on the counter nor is held. The person's right hand rests on clerk C's shoulder (it reads as a grab) and their left hand is hidden.
  - [medium/camera_hurts] The off-centre push separates the clerks from their arches through parallax (clerks at depth 1, wall arches at 0.75). B sits ≈140 px off her window's centre, window 1 is left as an empty 190 px arch sliver at the left edge (f8008–8056), and C ends half outside window 3 against bare wall.
  - [medium/competing_attention] Seven motions overlap in f7994–8030: the camera push (7996–8014), the person's slide (7994–8018), clerk C's slide, three clerks still bouncing (until 8030), the slip pop (8008–8030), the arm's entry (8016–8026) and the press (8026–8036). The brief asks for 'at most a few things' at once.
  - [medium/blank_space] The window-3 framing leaves y≈650–1080 (about 40% of the frame) as empty counter panelling under the slip, while the heads sit at y≈75–330.
  - [medium/phone_readability] The punchline quote is clean for only about 0.6 s (f8012–8030) before the stamper and the mark cover it. 'any given Tuesday' is ≈25 px on screen (≈8 px on a phone), below the 30 px floor, and the stamper block covers it during f8026–8040.
  viewer_should_look_at: Window 3: a regular person, their slip 'Trust me, I read it somewhere.', and the SOURCE? stamp hitting it.
  what_it_should_communicate: The same check works on confident humans. This is the last joke. It should land with real stamp weight, a visible reaction and a beat to enjoy it, as a deliberate callback to the cold-open WRONG stamps.
  what_actually_happens: Over f7996–8014 the camera pushes to window 3 (cx 1380, cy 640, zoom 1.35). The clerks are on depth 1 while the arches and sign are on the wall at depth 0.75, so the push slides the set apart. Clerk B ends up ≈140 px left of her window's centre (B at x≈390; window 2 spans x≈270–796). Clerk A exits through the left edge (only a hand sliver at x 0–20 at f8008) and leaves window 1 as an empty arch sliver at x 0–190 for f8008–8056. The push also drops the checker out of frame. Over f7994–8018 the person slides 880 px in from x=2300 with no walk. Clerk C slides 260 px right and passes behind the person (half-hidden at f8004–8010), ending at x≈1390, half outside window 3 in front of bare wall. The person stands in the left half of window 3 (x≈1000 against a window centre of ≈1140), and their raised right hand rests on C's shoulder for the rest of the shot. The slip pops in at f8008 (scale 0.8 → 1 plus fade) and stands upright in the picture plane in front of the person's chest (x≈724–1280, y≈485–745, its bottom about 40 px below the counter lip). Neither of the person's hands touches it. At f8016–8026 the coral StampHand slides in horizontally from the left edge: a bar of about 1,000 px at y≈330–430, crossing clerk B's chest and window 2, arriving already at stamping height. A 10-frame sine press (f8026–8036) brings the pad (x≈965–1125) down to y≈580, and the stamper block covers the slip's header, 'any given Tuesday'. SOURCE? scales 1.6 → 1 over f8030–8038 at x≈940–1336, y≈580–730. It is centred about 90 px right of and 80 px below the pad, it is about 390 px wide against a pad of about 160 px (2.4× the stamp that made it), it sits over 'I read it somewhere.', and it runs about 60 px past the slip's right edge. The arm then hangs still above the slip (f8036–8044) and slides out sideways (f8044–8056). The person's mouth goes from grin to 'o' (f8030–8038); B and C do not react. The camera pull-back starts at f8054 and the end-card crossfade at f8058, so the reaction gets only about 4 clean frames (f8050–8054).
  V2 DIRECTION: SETUP ('Works pretty well' V2 f8181): push to window 3, motivated by the newcomer: cx≈1400, cy≈570, zoom 1.35, 18 frames E.inOut (f8181–8199). Draw the arches and sign on the clerks' plane so nothing drifts. At this framing window 1 and clerk A are fully out (no sliver), clerk B stays centred in window 2 (x≈290–440), and the sign is fully out of the top. The person walks in from frame-right behind the counter in 3 steps (6 frames each, 6 px bob, f8178–8196) to the centre of window 3 (world x 1440, screen ≈1014). Clerk C shuffles right in 2 steps and leans an elbow on window 3's right pillar (screen x≈1300–1450). That is a deliberate pose, and he never passes behind the person. Everyone else is still.

ACTION ('well' f8196 → 'people,' f8205): the person slaps the slip down on the counter lip with their left hand (reach); the hand stays on it for 6 frames and lifts at ≈f8204. Build the slip as an S10-prefixed copy of AnswerSlipArt so it matches the cold-open slips. On screen it is about 600×470 (x≈690–1290, y≈560–1030), with 'A person' at ≥44 px, 'any given Tuesday' at ≥30 px, the quote at ≥44 px in the upper half, and the lower-right quarter left empty for the stamp. That gives the quote clean reading time from f8197 through the reaction. On 'people,' the shared V2 StampArm rises from the bottom edge through the empty counter-front band and hovers over that empty corner (enter f8203, 14 frames). Use the teal sleeve ('you, checking') and the point-of-view forearm leaving the frame bottom-right, staged exactly like S1's WRONG stamps.

IMPACT ('too.' f8220): anticipation lift (wind ≈0.6, starting f8212), a 3-frame drop, then a 2-frame hold with about 10% pad squash. SOURCE? prints at full ink exactly under the pad: take the contact point from worldToScreen, keep the mark's width about equal to the pad's, and keep it inside the slip's edges and off the quote. The slip and counter jolt 4 px (counterNudge), and camKick adds about 1.5% for 2 frames, matching S1's third and heaviest stamp.

REACTION (f8222–8240): the person's grin drops to an 'o', brows go up, and they lean back 4 px with their left hand still near the slip. Clerk C smirks sideways, because this time someone else got stamped. Clerk B's brows lift.

SECONDARY: the arm recoils upward with follow-through (f8224–8230) and exits down out of frame by f8240. The slip wobbles 1° and settles.

NEXT DEVELOPMENT (silence f8225–8250, 0.9 s): hold the two-shot on the reaction with no camera move. The person gives a small sheepish shrug at ≈f8244, just before 'This'.

QUIET: clerk B and the wall.

SOUND: footsteps (thud_soft −9 per step); paper_slap for the slip; whoosh_soft (−12) as the arm rises, as in S1; stamp_heavy on 'too.' with an optional gavel layered at −6 dB (the brief's gavel beat); paper_flap (−10) as the slip settles.
## S10.8 4:28.5-4:30.7 (V1 f8054-8120) | This is Future Got Weird.
  - [high/weak_transition] A crossfade into the end card runs during a camera pull-back, giving a double exposure (f8060–8072). The honesty line appears before the brand and is overprinted on the counter and the SOURCE? slip. The brief asks to 'transition cleanly into FUTURE GOT WEIRD'.
  - [medium/camera_hurts] The pull-back is never seen at rest; it exists only under the fade. Mid-move (f8060) it cuts clerk A in half at the left edge and crops the ANSWERS sign at the top.
  - [low/blank_space] f8072–8078 flashes an empty saffron card with only the small credits line before 'Future' pops.
  - [low/motion_quality] During WEIRD's spring overshoot (f8093–8105) the gap to GOT closes to ≈20 px, so 'GOTWEIRD' briefly reads as one word.
  - [low/broken_asset] The Wordmark's swash bar behind the letters is C.saffron, drawn on the C.saffron end card, so it is invisible for the entire end card.
  viewer_should_look_at: The wordmark assembling word by word.
  what_it_should_communicate: A clean sign-off. The episode ends and the brand grows out of the world we have been in, rather than dissolving to a different slide.
  what_actually_happens: The camera pulls back to the wide over f8054–8068. At f8060, mid-move, it cuts clerk A in half at the left edge (x 0–100) and the ANSWERS sign at the top edge. The end card crossfades in over f8058–8072 on top of the move, so f8060–8072 is a double exposure: ghost clerks, a ghost SOURCE? slip, the checker reappearing cropped, and the 26 px credits line already printed across the counter front at y≈760, where at f8064 it runs into the SOURCE? slip. f8072–8078 is a near-empty saffron card holding only the credits line. FUTURE pops at f8076, GOT at f8086 and WEIRD at f8093, as springs in sync with the words. At f8100 WEIRD's overshoot closes its gap to GOT to ≈20 px, against ≈44 px at rest.
  V2 DIRECTION: SETUP ('This' V2 f8254): no separate camera move. The counter front, arches, clerks, person and slip sink out of the bottom of the frame as one unit, counter first and arches/figures 3 frames later, with a 6 px anticipation lift, E.in, over 12 frames (f8254–8268). The ANSWERS sign is hoisted up out of the top on its strings at the same time. Over those same 12 frames the camera zoom relaxes from 1.35 to 1.0, so the remaining saffron wall fills the frame; V2 walls extend 400 px, so no set edge shows. No dissolve, no ghosting, no empty-card flash, and no credits line yet.

ACTION ('Future' f8273, 'Got' f8283, 'Weird.' f8292): keep the word-synced springs, built centred at y≈400–550, but reserve each word's final width so no overshoot closes a gap (at least 40 px between words at peak). GOT (coral) lands with a 4° tilt that straightens on 'Weird.'.

REACTION ('Weird.'): the swash bar, recoloured to saffronDeep so it reads, wipes in left to right under the wordmark over 8 frames.

NEXT DEVELOPMENT (silence f8303–8314): the wordmark eases up to y≈130–260 at scale 0.85 (14 frames, E.inOut). This opens the end-screen-safe layout before the tagline arrives.

SECONDARY: V1's wall dots are static ('no drift'). Add a very slow drift (≤0.3 px/frame) from here to the end as background life.

QUIET: everything except the word that is popping.

SOUND: whoosh_soft (−12) for the set sinking; hanger_click for the sign hoist; pop_tick on 'Future' and 'Got', rising in pitch; logo_hit on 'Weird.'. amb_counter fades out under the sink, and the music starts its resolution.
## S10.9 4:30.7-4:36.3 (V1 f8121-8289) | AI moves fast; we make it make sense. New episodes twice a week, if you'd like to subscribe.
  - [high/static_hold] Three still runs totalling 4.6 s: f8122–8162 ('AI moves fast; we'), f8168–8227 ('make it make sense. New episodes') and f8235–8271 ('twice a week, if you'd like to subscribe.'). The finished wordmark sits motionless while only small fades happen beneath it.
  - [medium/other] No end-screen-safe zone is planned. YouTube end-screen elements run in the last 5–20 s, and here the card is up for about 11–12 s from f8076. Anything placed there would land on the centred wordmark, tagline or chips.
  - [low/blank_space] The 'twice a week' chip is off-centre for 1.4 s (f8227–8268), sitting about 127 px left with a hole where Subscribe will be, because Subscribe's slot is reserved at scale 0.
  - [medium/phone_readability] The chips are 30 and 34 px (10–11 px on a phone). The honesty line 'Sources, excerpts and credits are in the description.' is 26 px (≈9 px on a phone), below the 30 px guard-rail floor.
  - [low/motion_quality] Both tagline halves use the same fade-and-rise, so 'moves fast' and 'make it make sense' get no motion that matches their meaning.
  viewer_should_look_at: The tagline, then the 'twice a week' chip, then Subscribe.
  what_it_should_communicate: The channel promise and a gentle, friendly call to action.
  what_actually_happens: The wordmark is static at y≈320–440. 'AI moves fast.' fades in and rises 12 px over f8119–8129, then 'We make it make sense.' over f8162–8172 (45 px inkSoft, y≈530). The ink chip 'New episodes twice a week' (30 px) arrives over f8227–8239, but it sits ≈127 px left of centre (x≈602–1064) with an empty slot to its right until the Subscribe chip (34 px) pops at f8268. The credits line (26 px) has been at y≈760 since f8058. The whole card is a centred column (≈1400×450, y≈320–775) with empty bands above and below. Still runs: f8122–8162 (1.37 s), f8168–8227 (2.0 s), f8235–8271 (1.23 s).
  V2 DIRECTION: LAYOUT (in place from f8314 to the end): wordmark at y≈130–260 (0.85 scale, about 128 px type); tagline at y≈290–345 (≥48 px); chip row at y≈380–440 (≥40 px); honesty line at ≥32 px, left-aligned from x≈270 at y≈985–1020. The zone x 260–1660, y 470–940 stays empty for YouTube end-screen elements, for example two 16:9 tiles of about 600×338 at x≈260–860 and 1060–1660, y≈520–858. That gives a safe end-screen window of about 11 s (f8316–8646).

SETUP ('AI moves fast' f8316): 'AI moves fast.' whips in from the left in 6 frames with a small skid overshoot.

ACTION ('we make it make sense' f8360–8387): 'We make it make sense.' arrives slowly and lands square with a calm settle. A hand-drawn underline draws under 'make sense' over 10 frames.

REACTION ('New episodes' f8403 → 'twice' f8424): the 'New episodes twice a week' chip slides up into the centre (x 960) with a light bounce, and 'twice' gets a small double tick. The honesty line appears with it, not before the brand.

SECONDARY ('subscribe.' f8463): the twice-a-week chip slides 120 px left (8 frames, E.inOut) while the Subscribe chip pops into the freed slot (0.9 → 1.06 → 1.0) and does one button-press dip. The row is never lopsided.

CAMERA: none, since this is a graphic card. For life, scale the card group very slowly from 1.00 to 1.015, keeping the reserved zone clear.

QUIET: the wordmark once it has settled.

SOUND: whoosh_soft (−10) for 'moves fast'; thud_soft (−9) for the settle on 'make sense'; marker_sweep for the underline; chip_pop plus two pop_tick for 'twice'; chip_pop (brighter) for Subscribe.
## S10.10 4:36.3-4:40.8 (V1 f8290-8424) | (no narration; music out)
  - [high/static_hold] About 4 s of finished card (f8277–8401) with only two tiny Subscribe nudges. This is the 'dead-feeling hold' the brief asks to remove.
  - [medium/weak_transition] The 22-frame fade to cream (f8401–8423) washes out the brand saffron and ends the film on blank cream frames instead of a resolution.
  - [medium/other] The card is up for about 11 s from the wordmark onward, which is enough for an end screen, but no layout is planned for end-screen elements. Anything YouTube places there will cover the wordmark, tagline or chips.
  viewer_should_look_at: The channel card and the area where YouTube's end-screen elements will appear.
  what_it_should_communicate: A finished, confident ending that leaves room for the end screen without feeling frozen or unfinished.
  what_actually_happens: The card is fully built by ≈f8290. Subscribe gets two 12-frame nudges of 8% scale (f8314, f8359); the second does not even register as motion. Otherwise the frame is static (still runs f8277–8316, 1.33 s, and f8318–8401, 2.8 s). Over f8401–8423 the whole frame fades to Main's cream paper background: f8410 is washed out and f8418–8424 is blank cream.
  V2 DIRECTION: V2 has 170 frames (5.7 s, f8476–8646) after 'subscribe.' with the layout already end-screen-safe.

ACTION (≈f8485–8505): the checker steps in from the left edge in 2 steps and stands fully in frame at the bottom-left (x≈40–240, feet ≈y 1050, scale ≈0.75, so he stays clear of the reserved zone at x≥260). With his pencil he taps the first word of the honesty line. A teal underline draws beneath it: a quiet visual callback to 'check the source', with no new narration.

REACTION: one satisfied nod and a blink, then idle (life ≈0.5).

SECONDARY: the wall dots drift, and Subscribe gets one gentle nudge at ≈f8550. Nothing else moves.

END: the music lands its final button on the last frames. Hard end on the saturated card, or at most an 8-frame fade to black. No wash to cream.

SOUND: thud_soft (−12) ×2 for his steps; pencil_tap; marker_sweep (−4); chip_pop (−10) for the nudge; the final music button.

## SCENE PROBLEMS
  - static_hold high 19.7 s of 33.0 s (59.7%) is still, across 13 runs, and the longest is 2.8 s. The camera is locked from f7435 to f7995. The clerks hold one idle pose (4-frame blinks, torso scaleY ±0.4%) until f7949, and the checker never changes pose. Each run, and what should develop during it: f7464–7511 'why is AI so confidently wrong?': clerks puff up on 'confidently', A glances at his CLAIM FAILS slip on 'wrong?'. f7543–7569 'Because sounding right comes from patterns': the placard rises and the subline appears word by word. f7583–7621 'patterns in language, and being': token tiles lock, the checker points, a blue tick in the pause. f7684–7731 plus f7733–7773 (≈3 s) 'the model doesn't always have. So when an answer matters': the empty slot jiggles, C glances, the underline gives the verdict, the placards sink, the slip is revealed and pushed forward. f7800–7841 plus f7843–7890 (≈3 s) 'ask whether it sounds right. Ask what the evidence is, and whether it actually': strike on 'right.', the struck card drops, Q1 rises on 'Ask', badge tick, thumbnail pop. f7912–7947 'actually says this. Works on chatbots.': underline under 'actually', leader and slip lift on 'this.', cards sink. f8122–8162, f8168–8227 and f8235–8271 (end card under VO): the layout has already moved up; tagline whip, settle and underline; chip slide-up and 'twice' ticks; Subscribe pop with the chip slide. f8277–8316 plus f8318–8401 (≈4 s, no VO): the checker steps in and taps the honesty line, one Subscribe nudge, the music button, no fade.
  - phone_readability high The hierarchy is inverted. The two words the brief calls 'visually dominant', SOUNDING RIGHT and BEING RIGHT, are 26 px grey letter-spaced caps (≈9 px on a phone), smaller than every other line on their cards. Also at or below phone legibility: the factual chip 'Kalai (2001) · thesis title page' and the pattern chips (22 px), the two takeaway questions (34 px), 'any given Tuesday' (≈25 px on screen) and the honesty line 'Sources, excerpts and credits are in the description.' (26 px). The V2 floors (V2_DIRECTION §6) are 44 px for critical text, 34 px for body text and 30 px for guard-rail text.
  - overlap_or_clipping high Every overlay is pinned at screen y=70, over the set. The overlays cover the ANSWERS sign from f7446 to f7957, apart from about 5 frames at f7529–7533: first the question card, then both columns with a stray 'W' between them, then the 'Does it sound right?' pill sitting exactly on the sign. The column cards flatten the arch tops and trim clerk A's visor and clerk C's hair. Q2 covers clerk B's face over f7890–7957. In the V1 wide the only face-free bands are the wall above the heads (y≈160–300) and the counter front (y≈703–1080), and V1 never uses the second one.
  - timing_vs_narration high Actions miss the voice. Q1 'What's the evidence?' lands on "don't ask whether" (f7789–7803), 1.7 s before 'Ask what the evidence is' (f7839), because at('s34','Ask') is case-insensitive and matches the 'ask' in "don't ask". The strike on 'Does it sound right?' is finished by f7803, as 'it sounds right' is only starting. The punchline slip is clean for about 0.6 s before the stamp covers it, and the gag reaction gets about 4 clean frames before the exit moves. Meanwhile the pause after 'have.' and the pause after 'this.' play over frozen frames.
  - camera_hurts medium CounterSet draws the arches and the ANSWERS sign on the wall at depth 0.75, while the clerks are at depth 1, so any off-centre push slides each clerk out of his window. At the V1 window-3 push (cx 1380, zoom 1.35), clerk B sits ≈140 px left of window 2's centre, clerk A exits through the left edge and leaves window 1 as an empty 190 px arch sliver (f8008–8056), and clerk C ends half outside window 3 against bare wall. The brief names this: 'objects no longer aligning after camera movement'. V2 should draw the arches and sign on the clerks' plane in an S10-prefixed copy of CounterSet (keeping only the wall colour and dots at 0.75), so the H910 opening ease-out and the window-3 push stay aligned.
  - weak_transition medium There are five crossfades inside one scene: question → columns (f7525–7545), columns → habit (f7773–7791), habit → out over clerk B's face (f7947–7957), scene → end card under a camera move (f8058–8072), and end card → cream (f8401–8423). Each one makes a ghosted double exposure, which is exactly what the project's own paper-wipe transition was built to avoid, and V2_DIRECTION allows fades only for light and dimming.
  - disconnected_or_floating medium Through s33–s34 the cast is decoupled from the conclusion. The clerks, who are the AI models being explained, never react to the lesson about them, and the checker stands in a cropped corner without taking part. Every card is a floating screen overlay that nobody hangs, raises, touches or looks at. The person's slip floats in front of their chest, and the stamp arm has no owner in frame. The counter only becomes a stage again at s35.
  - blank_space medium The counter-front band (y≈703–1080, ≈35% of the frame) holds only empty wood panels for 18.7 s (f7435–7995), while all the text is squeezed into the top 470 px on top of the sign and the faces. In the window-3 push it is again about 40% of the frame (y≈650–1080). That band is where the V2 placards, the takeaway cards and the stamp arm's path should go.
  - unclear_when_muted medium With the sound off, s33–s34 is a sequence of text slides. Nothing shows the difference between sounding right and being right: there is no winner and nothing missing on the model's side. No answer is on screen for 'an answer matters', and 'this' in 'Does it actually say this?' points at nothing.
  - motion_quality medium Every element enters the same way, opacity plus a 16–20 px translateY, with no anticipation, overshoot or settle. Characters slide like cut-outs: the person moves 880 px in 24 frames with no walk, and clerk C slides 260 px and passes behind them. The stamp impact registers less motion energy than the camera push or the end-card fade.
  - other medium V2 implementation risks found in the code and the V2 rules. (a) Video_01_V2/source/src/scenes/S10_Payoff.tsx is still identical to V1, so the at('s34','Ask') bug carries over (it would fire at V2 f7961 instead of f8011). Check every repeated word before keying a cue; s35, for example, has 'Works' twice. (b) S10 has to match the V2 conventions already set: the S9 → S10 H910 match cut (not a wipe or a new pan); the checker behind the counter as in V2 S1 (x 120, y 790, scale 0.92, pencil in hand); the SOURCE? stamp through the shared StampArm (teal sleeve, point of view from the bottom edge, stamp_heavy plus camKick, like S1's third WRONG), not a coral bar from the left; no ghost pre-reveals (V1 shows 'patterns in language' and 'evidence' at 30% before they are spoken). (c) SFX_KINDS has no footstep or cloth kinds, so the person's walk-in needs thud_soft at low gain, or the lead has to add a kind.

## TRANSITION IN
V1: the house paper wipe. S10 is mounted from f7429 and the wipe runs f7429–7441. S10 is scene index 9, so dir='left' and the hard vertical edge travels right to left, revealing S10 from the right. At f7436, 548 px of S9's pulled-back desk is still visible on the left; at f7440 it is a 12 px strip. Nothing carries across the cut. S9's last image is the ChatGPT slip with its CLAIM FAILS stamp, the Kalai title page, and the checker full-figure at x≈1640. It is simply wiped away, and the checker reappears cropped into S10's opposite (bottom-left) corner.

V2: use the hand-off already specified in V2_DIRECTION §9 and lib/handoffs.ts H910, which is a match cut, not a wipe or a new follow-pan. S9's last frame and S10's first frame both show the ChatGPT slip via SlipOnScreen i=0 at screen cx 960, cy 500, scale 1.5, rot −2°, with the coral 'Claim fails' stamp (size 40, rot −9°). Behind it in S10 the camera is pushed in on window 1 (≈cx 480, cy 600, zoom 1.5), so clerk A's eyes peek over his own failed slip. Over f7597–7610 (E.inOut) the camera eases out to the wide while the slip descends and shrinks onto the counter lip in front of window 1 (≈x 300–660, y 560–840, scale 1.0, rot −3°). It lands at f7606 with a 6 px overshoot and a paper_slap, and clerk A's hands come down onto it. The checker is simply already in his V2-S1 place behind the left end of the counter, so there is no position jump to motivate. The arches must be on the clerks' plane so window 1 stays aligned with clerk A through the 1.5 → 1.0 move. The slip then pays off three times: A's glance on 'wrong?', the revealed 'answer' in s34, and the target of 'Does it actually say this?'.

## TRANSITION OUT
V1: S10 is the last scene. After a 2.8 s static hold, the whole frame fades over 22 frames (f8401–8423) to Main's paper background. f8410 is washed out and f8418–8424 is blank cream, so the brand saffron drains away instead of resolving.

V2: no fade to cream. The end card grows out of the set. On 'This', the counter set sinks out of the bottom and the ANSWERS sign is hoisted out of the top, leaving the same saffron wall, and the wordmark builds on it. In the pause after 'Weird.' (V2 f8303–8314) the wordmark moves up into an end-screen-safe layout, so YouTube's elements can run over a finished card for the last ~11 s (f8316–8646). The 5.7 s tail after the narration (f8476–8646) stays alive with the checker's tap on the honesty line, a slow drift of the wall dots and one Subscribe nudge. The music lands its final button on the last frames. End with a hard cut on the saturated card, or at most an 8-frame fade to black.

## SOUND MOMENTS
[
 "V2 f7596 (V1 4:07.8): amb_counter starts at scene start (dur ≈35 s), very low under the narration; it fades out under the set sink at V2 f8254–8268.",
 "V2 f7606 (V1 ~4:08.0, after the H910 match cut): the CLAIM FAILS slip lands on the counter in front of window 1: paper_slap.",
 "V2 f7621–7635 'why'→'AI' (V1 4:08.4–4:08.8): the question ticket drops on its strings and catches: hanger_click.",
 "V2 f7676 'wrong?' (V1 4:10.2): the checker taps his pencil on the counter: pencil_tap.",
 "V2 f7690–7700 (pause after 'wrong?'): the ticket is hoisted out: paper_swish −12.",
 "V2 f7712–7728 'sounding right' (V1 4:11.4): the SOUNDING RIGHT placard rises and lands: thud_soft, panned left. The takeaway music starts building at 'Because' (f7703).",
 "V2 f7755–7767 'patterns…' (V1 4:12.6): four token tiles lock into rows: token_lock ×4, −6 dB, rising pitch.",
 "V2 f7785 (pause after 'language,'): the blue 'sounds right' tick pulses: pop_tick.",
 "V2 f7803–7818 'being' (V1 4:14.3): the BEING RIGHT placard lands heavier: thud_soft +3 dB, panned right.",
 "V2 f7827 'evidence' (V1 4:15.2): the Kalai title-page thumbnail docks: paper_slide + pop_tick.",
 "V2 f7854 'doesn't' (V1 4:15.8): the empty evidence slot jiggles twice: card_flick ×2 at −6 dB.",
 "V2 f7871 'have.' (V1 4:16.6): the teal underline draws under BEING RIGHT: marker_sweep.",
 "V2 f7892–7904 (0.7 s pause after 'have.'): both placards sink, staggered: paper_swish ×2, soft.",
 "V2 f7920–7935 'an answer matters' (V1 4:18.2): clerk A pushes the slip forward with a hop: paper_slide + thud_soft −6.",
 "V2 f7961 'ask whether' (V1 4:19.6): the 'Does it sound right?' placard rises: card_flick.",
 "V2 f7989 'right.' (V1 4:20.7): the coral marker strike: marker_sweep +2 dB.",
 "V2 f7998 (gap before 'Ask'): the struck placard tips and drops out: paper_flap.",
 "V2 f8011 'Ask' (V1 4:21.3; in V1 this card actually landed at 4:19.6/f7789): Q1 placard rises: card_flick. V2 f8027 'evidence': badge flips to teal: pop_tick.",
 "V2 f8050–8057 (pause after 'is,'): the title-page thumbnail pops up and tucks back: paper_lift, then paper_slide −6.",
 "V2 f8065 'whether' (V1 4:23.0): Q2 placard rises: card_flick, pitched up. V2 f8076 'actually': underline: marker_sweep −3.",
 "V2 f8100 'this.' (V1 4:24.0): the slip lifts toward camera: paper_lift. Leader draws to the slip: marker_sweep −6. The CLAIM FAILS stamp glints: glint −10.",
 "V2 f8112–8125 (0.8 s pause after 'this.'): Q1/Q2 sink out: paper_swish. The slip settles back: thud_soft −9.",
 "V2 f8158–8170 'chatbots.' (V1 4:25.2): clerk A slides the slip back through his window: paper_slide. The checker's satisfied pencil_tap −6.",
 "V2 f8166, 8174, 8180, 8186, 8192 (V1 ~4:25.8–4:26.6): the person's approaching footsteps. There is no footstep kind, so use thud_soft −9 per step. Clerk C's 2-step shuffle: thud_soft −12.",
 "V2 f8197 'well' (V1 4:26.6): the person slaps the slip down on the counter: paper_slap.",
 "V2 f8203 'people,' (V1 4:27.2): the StampArm rises into frame from the bottom edge: whoosh_soft −12, as in S1.",
 "V2 f8220 'too.' (V1 4:27.5): SOURCE? impact with slip and counter jolt: stamp_heavy, plus an optional gavel at −6 dB for the brief's gavel beat.",
 "V2 f8226–8240 (0.9 s pause after 'too.'): the arm withdraws (no extra sound needed); the slip settles: paper_flap −10.",
 "V2 f8254–8268 'This is' (V1 4:28.6): the counter set sinks out: whoosh_soft −12. The ANSWERS sign is hoisted on its strings: hanger_click.",
 "V2 f8273 / 8283 / 8292 'Future' / 'Got' / 'Weird.' (V1 4:29.3 / 4:29.7 / 4:30.0): pop_tick, pop_tick rising in pitch, then logo_hit on 'Weird.'. The music's resolution begins.",
 "V2 f8316 'AI moves fast' (V1 4:30.7): whoosh_soft −10. V2 f8376–8390 'make sense.': thud_soft −9 on the settle + marker_sweep for the underline.",
 "V2 f8403–8430 'New episodes twice' (V1 4:34.0): chip_pop + two pop_tick on 'twice'.",
 "V2 f8463 'subscribe.' (V1 4:35.6): the chip slides left and Subscribe pops: chip_pop, brighter.",
 "V2 f8485–8505 (after the VO; V1 4:36.5+ was silent): the checker's two steps (thud_soft −12), pencil_tap on the honesty line, marker_sweep −4 for its underline. V2 ≈f8550: Subscribe nudge, chip_pop −10. Final music button on the last frames, with no fade to cream."
]

## PHONE-CRITICAL TEXT
[
 "'So why is AI so confidently wrong?' headline: 88 px on screen, ≈29 px on a 640×360 phone. Survives, but in V1 it covers the ANSWERS sign. V2 at 72 px in the hanging slot (≈24 px on a phone) survives and keeps the sign visible.",
 "'ANSWERS' hanging sign: 48 px, ≈16 px on a phone. Survives when visible; V1 covers it with overlays from f7446 to f7957.",
 "'SOUNDING RIGHT' column label: 26 px grey letter-spaced caps, ≈9 px on a phone. FAILS. V2 needs ≥68 px ink (≈23 px on a phone) as the dominant text.",
 "'comes from patterns in language': 54 px, ≈18 px on a phone. Survives, but it splits the key phrase across two lines. V2 46 px with 'patterns in language' kept on one line.",
 "Pattern chips 'Methods / Algorithms / Machine Learning / is entitled:': 22 px grey outline, ≈7 px on a phone. FAILS. V2 token tiles ≥34 px.",
 "'BEING RIGHT' column label: 26 px grey, ≈9 px on a phone. FAILS. V2 ≥68 px ink.",
 "'takes evidence the model doesn't always have': 54 px, ≈18 px on a phone. Survives.",
 "Factual chip 'Kalai (2001) · thesis title page': 22 px white on teal, ≈7 px on a phone. FAILS the 30 px guard-rail floor. Keep the wording at ≥30 px.",
 "'Does it sound right?' (struck): 48 px inkMuted grey on cream, ≈16 px on a phone, low contrast, 5 px strike. Borderline. V2 ≥56 px inkSoft with a ≥10 px strike.",
 "'1 What's the evidence?': 34 px, ≈11 px on a phone. FAILS V2's 44 px floor for critical text, for the episode's main takeaway. V2 ≥50 px.",
 "'2 Does it actually say this?': 34 px, ≈11 px on a phone. FAILS. V2 ≥50 px, same wording as S9's card 2.",
 "CLAIM FAILS ChatGPT slip header (V2 only): 'ChatGPT' 27 px and 'GPT-4o · 9 May 2025' 18 px at slip scale 1, so the date line is ≈6 px on a phone at counter size. It is a guard-rail label: keep it unoccluded, and whenever the slip is the subject (the H910 opening at 1.5×, the 'this.' lift to ≥1.67×) the date line must reach ≥27–30 px on screen.",
 "Person's slip header 'A person': 27 px × 1.38 zoom ≈ 37 px on screen, ≈12 px on a phone. Survives, barely.",
 "Person's slip detail 'any given Tuesday' (the parody of the model/date label): 18.6 px × 1.38 ≈ 25.6 px on screen, ≈8.5 px on a phone, and covered by the stamper over f8026–8040. FAILS. V2 ≥30 px on screen.",
 "Punchline 'Trust me, I read it somewhere.': 30 px serif × 1.38 ≈ 41 px on screen, ≈14 px on a phone. Readable, but clean for only ≈0.6 s (f8012–8030) before SOURCE? covers 'I read it somewhere.'. V2 ≥44 px, clean from the slap through the reaction, with the stamp kept off the quote.",
 "'SOURCE?' stamp: 50 px × 1.38 ≈ 69 px on screen, ≈23 px on a phone. Survives, but it overhangs the slip by ≈60 px and is 2.4× the pad. V2: size the mark to the pad and keep it inside the slip edges.",
 "Wordmark 'FUTURE GOT WEIRD': 150 px, ≈50 px on a phone. Survives; at V2's 0.85 scale (≈128 px) it is still ≈43 px.",
 "Tagline 'AI moves fast. We make it make sense.': 45 px inkSoft, ≈15 px on a phone. Survives; V2 ≥48 px.",
 "'New episodes twice a week' chip: 30 px, ≈10 px on a phone. Borderline. V2 ≥40 px.",
 "'Subscribe' chip: 34 px, ≈11 px on a phone. Borderline. V2 ≥40 px.",
 "Honesty line 'Sources, excerpts and credits are in the description.': 26 px, ≈9 px on a phone. FAILS the guard-rail floor. Keep it at ≥32 px, show it only once the card is built, and give it the checker's underline beat."
]

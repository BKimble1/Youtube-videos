# V1 shot review — S1 — The counter (cold open), narration s01–s05, V1 frames 0–820 (0:00.0–0:27.3). V2 cue frames quoted below come from Video_01_V2/source/src/data/timeline.json (S1 = f0–817).

S1 is the cold open. It asks one checkable question, shows three AI 'clerks' confidently handing over three different answers, stamps all three WRONG, reveals that the man in the question is the lead author of the paper that ran the test, and lands joke 1 ('Very professional. Very fictional.'). It has to carry the brief's escalation: these systems sound certain → they disagree → they're all wrong. V1 has the right content but mechanical execution.

Biggest execution problems:
(1) Frozen for 38.8% of its runtime: 10.6 of 27.3 s across 8 runs, the longest 2.23 s on the paper header (f660–726). The detector misses three more blink-only stretches: f361–385, f419–439 and f451–493.
(2) Broken contact and geometry on the answer stage. The clerks stand in front of the wall with their legs showing between the window sills and the counter. No slip is handed over: each fades and drops in while its clerk waves 90–150 px away. Afterwards the clerks' idle hands sit on the slip text: A's covers 'Ph.D.' from f340. The stamp arm is a horizontal pole from off-screen left that runs across the clerks' upper chests. Each stamper lands ~200–240 px from where its WRONG prints, and each WRONG hangs half off its slip onto the wood. No year ring encloses its year.
(3) The climax has no weight. There is no anticipation, squash or response. All three clerks flinch together on stamp 1, so C reacts 16 frames before his own slip is hit. The stamps produce less motion energy than either camera move.
(4) Readability. 'Different' is never shown, and slips B and C are only ever 27 px. The guard-rail text is 15–24 px. The summary chip gets ~0.3 s of clean screen before the scrim covers it.
(5) The ending stacks four changes into 0.8 s and pre-shows the punchline at 30% opacity. It exposes the counter's end, runs the counter lip through the checker's eyes, and wipes into an empty cream frame.

Corrections to the first review:
- The ticket is ≈1,240 px wide, not 1,500.
- The checker's head sits on the counter-lip line, not below it.
- In the slip-A close-up B is not half-cut. Her bun is cut by the top edge, and her hand later leaves the right edge.
- Hands cover slip text from f340 (A), ~f400 (B) and ~f450 (C), not from f440.
- B's ring catches '05.', not 'in 20'.
- The typing leads the voice by about a word all the way; it never catches up.
- The paper title is ≈46 px and the author names ≈32 px (not 40/24).
- The compiled V2 timeline.json already strips the [tags] and IPA tokens. The only cue that breaks is at('s03','All').
- The first review's top-left stamp arm conflicts with the shared V2 StampArm, which rises from the bottom edge and is reused in S10.
- The checker cannot physically pencil-circle a ticket hanging at top centre.
- The paper placement it proposed would cover the slips it wanted visible.
- The V2 read leaves only 3–8 frames between most sentences, so moves placed 'in the pause' must start on the previous sentence's last word.

## S1.1 0:00.0-0:02.7 (V1 f0-82) | Three popular AI models were asked one
  - [high/static_hold] Still run f33–82 (1.67 s) during 'popular AI models were asked one question:'. After the ticket settles at f25 nothing moves. The three 'AI models' being counted never acknowledge it.
  - [medium/weak_transition] Frame 0 is the complete, static wide. The first change is the ticket fade at f9 and the voice starts at f14. A cold open the brief singles out for 'disproportionate polish' starts on a still picture.
  - [medium/overlap_or_clipping] The ticket covers the ANSWERS sign from f20 to f214, and that sign is the only label that establishes 'answer counter'. The sign's strings now appear to hold the ticket, and the ticket's bottom edge (y≈204) clips the tops of the three arches (y≈135). At f10 the half-faded ticket and the sign are superimposed.
  - [medium/other] Ghost pre-reveal: the full question shows at 18% opacity from f20, about 2 s before it is typed. The typing reveal is spoiled and the card looks greyed-out and unfinished.
  - [medium/character_cut] Checker (tiles f0–f200): his left hand is cut by the left edge (x≈0–20) and his shins by the bottom edge. The counter-lip band (y≈668–700) runs straight through his glasses, a tangent at eye level. He reads as accidentally squeezed into the corner, not placed 'at the end of the counter' as the storyboard says.
  - [medium/disconnected_or_floating] Answer-stage geometry (f0–f200 and every later wide): the clerks are not behind service windows. They stand on the wall plane with their legs visible between the sills (y≈575) and the counter lip (y≈668). Their hands hover ~5 px above the lip, tangent to it rather than resting on it. The windows read as arch-shaped backdrops. This is the brief's 'awkward geometry'.
  - [medium/blank_space] The counter front (y≈668–1080, 38% of the frame) holds only empty panels for all of s01 (~6.5 s).
  - [medium/phone_readability] The ticket label 'THE QUESTION · asked of GPT-4o, DeepSeek-R1 and Llama-4-Scout · 9 May 2025' is 24 px, about 8 px on a phone. It carries the model and date guard rail.
  - [low/disconnected_or_floating] The ticket is a screen-space overlay that nobody hangs, hands over or looks at, so it would not follow a camera move.
  viewer_should_look_at: The three clerks, one at a time, as 'Three popular AI models' is counted. Then the question ticket arriving under the ANSWERS sign on 'asked'.
  what_it_should_communicate: Three well-known AI answer services stand ready at an answer counter, and someone is about to ask them one checkable question.
  what_actually_happens: Locked wide (cam 960/560, zoom 1) from frame 0, with the set fully built and lit:
- three arches (screen y≈135–575);
- the ANSWERS sign (y≈55–150);
- the counter lip at y≈668, with the counter front (y≈668–1080, 38% of the frame) as empty panelling.

The clerks stand in front of the yellow wall, not inside the windows. Their pants show in the ~95 px strip between the sills (y≈575) and the lip, and their idle hands hang ~5 px above the lip, touching nothing. Their only life is 4-frame blinks and ~1 px breathing, and their gaze is fixed down-left (lookX −0.3, lookY 0.2).

The checker stands in the lower-left corner (world x 150, y 1130, depth 1.14):
- his head is centred at y≈705, so the counter-lip band (y≈668–700) runs behind his glasses;
- his left forearm sticks out horizontally (armL a10/b60) and the hand is cut by the left edge;
- his shins are cut by the bottom edge.

The question ticket is a screen-space card about 1,240×150 px (x≈340–1580, y≈56–204). It fades in and slides 30 px down over f9–25:
- at f10 it is a half-transparent double exposure over the sign;
- from f20 it hides the sign completely, and the sign's two hanging strings appear to run into the ticket's top edge;
- its bottom edge clips the tops of all three arches;
- the whole question shows as 18%-opacity ghost text from f20.

From f25 to f81 nothing changes (still run f33–82, 1.67 s).
  V2 DIRECTION: V2 cues: Three f18, popular f26, AI f42, models f52, asked f69, one f81, question: f86.

STAGING FIX (applies to every wide in S1):
- Lower the clerks, or raise the counter, so the counter lip meets them at the waist and the window sills sit at or below the lip. No strip of wall with legs in it.
- Idle hands rest ON the lip (reach to its top edge), so every later hand-over starts from real contact.
- Stand the checker at the left end of the counter, customer side. Whole head and torso in frame, head ≥60 px from the left edge, head centre ≥40 px clear of the counter-lip line.
- His arms rest: one hand on the lip, pencil behind his ear, no horizontal forearm.

SETUP f0–17: wide at zoom ≈1.04 (cx 960, cy ≈530) holding the sign, all three arches and the lip. The clerks are heads-down and busy, each shuffling paper behind the counter on a different 20–30-frame loop with their heads 30 px lower. Counter room tone and the hook's tension bed run underneath.

ACTION: the clerks pop up to attention L→R, one per word: A on 'Three' f18, B on 'popular' f26, C on 'AI' f42. Each pop is a 3-frame dip, a rise with ~4 px overshoot (SNAP), a settle and a blink, so the viewer counts three.

REACTION: each settles into a confident grin. B's pop nudges the ANSWERS sign into a 2° damped swing (signRotate with ring()).

SECONDARY on 'asked' f69: the question ticket drops on two strings from hooks under the sign and catches at f75.
- Make it a world object at wall depth, not a screen overlay, so later camera moves carry it.
- Hang it with its top ~10 px under the sign, so the sign stays fully readable.
- Its bottom edge must clear B's bun (world y≈330) by ≥40 px. That means a card ≤~140 px tall: one 52 px question line, with the guard-rail label as a ≥30 px tab rising from the ticket's top-right end, beside the sign.
- It swings 3° and settles in ~14 frames.
- It starts blank, with only a blinking caret and no ghost text.

NEXT DEVELOPMENT on 'one question:' f81–86: all three clerks look up at the ticket (lookY −0.5, 4-frame stagger), and the checker takes his pencil from behind his ear.

CAMERA: one slow push, 1.04→1.08, from f18 to f110 (E.inOut), and nothing else. The sign, wall and counter stay quiet after their one reaction.
## S1.2 0:02.8-0:06.9 (V1 f83-207) | question: what was the title of Adam Kalai's dissertation?
  - [high/static_hold] Still runs f94–119 (0.87 s, 'question: what was the') and f145–199 (1.83 s, 'title of Adam Kalai's dissertation? ChatGPT'). The only change is the darkening of 52 px glyphs; the set and all four characters are frozen for ~4 s.
  - [medium/unclear_when_muted] Nobody reacts to the question. The storyboard says 'The clerks look up', but V1 keeps their gaze fixed down-left, so muted it is a card on a wall.
  - [medium/timing_vs_narration] Typing is linear and runs about one word ahead of the voice throughout. 'What was' appears during 'question:', and 'Adam Kal' is already typed as 'Adam' starts. It has no rhythm at the comma or the '?'.
  - [medium/other] Nothing sets up the s04 payoff. 'Adam Kalai' gets no emphasis, and the ticket leaves for good at f202–214, so 'And Adam Kalai?' (f599) has nothing on screen to call back to.
  - [low/overlap_or_clipping] f205–212: the fading, rising ticket is superimposed on the ANSWERS sign as a double exposure instead of making a clean exit.
  viewer_should_look_at: The question as it is typed word by word, especially the name 'Adam Kalai'.
  what_it_should_communicate: The exact question: a simple factual one with one checkable answer. 'Adam Kalai' is planted for the s04 payoff.
  what_actually_happens: Same locked wide, no camera move. Typing runs linearly from f81 to f187: 48 characters over 106 frames, ~2.2 frames per character. It works by darkening the 18%-opacity ghost glyphs, too small a change for the motion detector, so still runs f94–119 (0.87 s) and f145–199 (1.83 s) remain.

The typing leads the voice by about a word the whole way:
- f100: 'What was ' is shown during 'question:'.
- f117: 'What was the tit' on 'what'.
- f148: 'Adam Kal' as 'Adam' starts.
- f187: typing finishes while 'dissertation?' runs to f194.

The clerks and the checker are frozen apart from blinks. Nothing happens between the question completing (f187) and clerk A's arm rising (f200). The ticket then flies up 40 px and fades out (f202–214), ghosting over the ANSWERS sign at f210 (sign text and 'title of Adam Kalai's' superimposed), and it never returns.
  V2 DIRECTION: V2 cues: question: f86–114, what f117, was f122, the f126, title f134, of f141, Adam f146, Kalai's f153, dissertation? f166–196, ChatGPT f201.

SETUP f86–116: the ticket hangs blank with the caret blinking (10-frame period). The guard-rail tab ('asked of GPT-4o, DeepSeek-R1 and Llama-4-Scout · 9 May 2025', ≥30 px) stamps on at f90 (chip_pop).

ACTION: type word by word, each word appearing whole on its onset frame: what f117, was f122, the f126, title f134, of f141, Adam f146, Kalai's f153, dissertation? f166. Each word gets a 2-frame pop (scale 1.08→1) and one typewriter_tick, and the caret advances. The question stays at 52 px.

REACTION: the clerks' eyes track the words L→R (lookX −0.4 → +0.4 across f117–170). On 'Adam Kalai's' (f146–165) the name types in bold and a teal underline sweeps under it in 8 frames; this is the s04 hook. The checker squints at it (brows −0.3 over 6 frames).

SECONDARY (background life, staggered, one 8-frame gesture each): B pushes her glasses up (f128), C touches his headset mic (f138), A rubs his hands (f158).

NEXT DEVELOPMENT: the '?' lands at ~f185 with a 1.1→1 bounce and a quiet bell_ding. 'ChatGPT' starts only 5 frames after 'dissertation?' ends, so the clerks duck for their slips during 'dissertation?' itself (f175–190, paper_lift −8 dB). A is fastest: his slip is already at the window opening by f198.

CAMERA: hold the wide, because the question concerns all three. The only motion is the S1.1 push if it is still running.

The ticket stays hung for the rest of the scene. It dims to ~70% when slip A lands and is still there for the s04 callback.
## S1.3 0:06.9-0:11.1 (V1 f208-334) | ChatGPT handed over a full title, a university, and a year.
  - [high/disconnected_or_floating] Nothing is 'handed over'. The slip materializes (fade plus 70 px drop) while clerk A holds a raised hand ~110–150 px above its corner (f214–f331). Hand and paper never touch, and the slip stands upright in front of the counter rather than being placed on it.
  - [medium/competing_attention] The push to 1.55 (f216–238) starts 4 frames after the slip pops and overlaps the ticket exit (f202–214). The landing and settle happen mid-camera-move, so the landing has no weight.
  - [high/unclear_when_muted] 'A university' is never shown: CMU is never marked. Instead a muted footer 'university · year · title' (≈31 px here, ≈10 px on a phone) appears. It lists the facts in a different order from the voice and reads like a stray caption. The storyboard intended coral marks on all three facts.
  - [medium/motion_quality] The marks ignore reading order. The title (lines 4–6) is marked at f258, then the eye has to jump back up to '2002' at the start of line 3 at f309.
  - [medium/static_hold] Still run f283–309 (0.9 s) on 'title, a university, and a year.'. Clerk A holds the same static raised arm for ~3.9 s (f214–331).
  - [medium/character_cut] SLIP_A framing (f240–f325):
- A's visor touches the top edge, and B's bun is cut off by it.
- A sliver of the third arch shows at the right edge.
- The checker's pencil touches the slip's left edge (tangent).
- At f327–334 B's raised hand comes in from, and is cut by, the right edge: a limb entering for no clear reason.
B's body is otherwise fully in frame. The first review's 'B half-cut' is wrong.
  - [low/blank_space] In the close-up the lower-right ~600×380 px (x≈1310–1920, y≈700–1080) is empty counter panelling, and the left ~300 px is wall plus the checker's outstretched forearm. About a fifth of the frame is dead while the slip is read.
  - [medium/phone_readability] The slip body is ≈39 px in the close-up, which survives. The guard-rail line 'GPT-4o · 9 May 2025' is only ≈24 px (≈8 px on a phone) even in the close-up.
  viewer_should_look_at: Slip A (ChatGPT), and each of its three facts as it is named: the title, CMU, then 2002.
  what_it_should_communicate: The first answer arrives complete and confident: a title, a university and a year, all specific. It sounds certain.
  what_actually_happens: The ticket exits up (f202–214). Clerk A's 'hand' pose (armR a38/b78) swings his right forearm up and out like a presenting wave (f200–214). Slip A then fades in and drops 70 px from above, with a spring scale of 0.85→1 from f212. The slip never touches his hand, which stays ~110–150 px above its top-right corner until f331.

The slip does not lie on the counter. It stands upright in front of the counter front, with its top edge (world y 600) 90 px above the lip, like a placard.

The camera pushes f216–238 to SLIP_A (cx 500, cy 700, zoom 1.55), so the slip lands and settles mid-move. Framing at f240:
- slip A at x≈630–1310, y≈364–830;
- A's visor touches the top edge, and B's bun is cut off by it;
- a sliver of the third arch is cut at the right edge;
- the checker's head (x≈330–600) and pencil tip (x≈610) are tangent to the slip's left edge (x≈630);
- the checker's horizontal left forearm points at the left edge;
- the lower-right ~600×380 px (x≈1310–1920, y≈700–1080) is empty counter panelling.

Marks:
- Title: saffron fill plus ink underline, f258–272.
- University: only a muted 20 px footer 'university · year · title' (≈31 px at this zoom) fades in at f280. It sits on the slip's bottom border and overlaps the gold inner line. CMU is never marked.
- Year: '2002' is marked f309–321.

Still run f283–309 (0.9 s). B's raised arm enters from the right edge at f327, with her hand cut by the edge at f330. The pull-back starts at f325.
  V2 DIRECTION: V2 cues: ChatGPT f201–225, handed f227, title, f254, university, f275, year. f309–330, DeepSeek f333.

SETUP / ACTION on 'ChatGPT' f201:
- A's right hand (reach) grips the slip's top-right MARGIN corner, ~20 px in from both edges, never over text.
- He carries it out of the window, over the counter lip and down, and plants it upright against the counter front. Travel takes 14 frames (E.out), rotating from −8° to −1.5°.
- It lands at f216 with ~6 px overshoot (SNAP) and a 1° wobble (ring).
- His hand stays on the corner until f226, then lets go and returns to rest on the lip.
- A gold glint runs once along the slip's gold inner border at f222 (AnswerSlip marks.glint).
- Sound: paper_slide at f204, thud_soft at f216, glint at f222.

CAMERA: start the push only after the landing, on 'handed' (f227). Ease it over 18 frames to ≈zoom 1.45, framing slip A plus A's whole head with ≥40 px headroom above the visor.
- The checker is either fully out of frame or fully in it, never tangent to the slip.
- B is fully out: no bun at the top edge, no arch sliver, no hand at the edge.
- Slip body ≥34 px and the model/date line ≥30 px in this framing (raise the detail line to ≥21 world px).

ACTION, marks in spoken order, all in one coral style:
- 'title,' f254: a sweep across the three-line title (10 frames, marker_sweep).
- 'university,' f275: a ring around 'CMU' (marks.ring on the CMU span, 8 frames, marker_circle +2 st).
- 'year.' f309: a ring around '2002' (8 frames, marker_circle +4 st).
Delete the 'university · year · title' footer.

REACTION: A gives a proud chin-up of ~3 px on each mark (f256, f277, f311). At f318 he taps the slip once: real finger contact, the slip shifts 2 px (pencil_tap −8 dB).

SECONDARY: if the checker is in frame, his eyes narrow. Nothing else moves.

NEXT DEVELOPMENT: 'DeepSeek' starts 3 frames after 'year.' ends, so the truck right toward B begins at f320, during the tail of 'year.'. It is a lateral move along the counter (18 frames, E.inOut, landing f338), not a pull-back. B's hand is already reaching for her slip inside the frame as it arrives.
## S1.4 0:11.2-0:14.7 (V1 f335-442) | DeepSeek gave a different title. Llama gave a third.
  - [high/phone_readability] Slips B and C are only ever seen at the wide. Body text is 27 px (≈9 px on a phone), model names ≈24 px and date lines ≈17 px (≈6 px). 'A different title' cannot be read.
  - [high/unclear_when_muted] 'Different' and 'a third' are not shown: no title highlight and no side-by-side comparison. Muted, these are just two more similar cards, and the 'they disagree' step of the escalation is missing.
  - [medium/competing_attention] Three things happen in f331–345: the camera pull-back (f325–343), slip B's arrival (f339) and A's arm dropping onto his slip (f331–345). The new answer lands while the frame and a second character are moving.
  - [medium/disconnected_or_floating] Slips B and C fade in (opacity t×1.4, translucent at f340 and f400) over the clerks' bodies rather than being handed over, while each clerk waves an arm ~90 px away.

When the arms come down, the hands land on the text instead of the margin:
- A from f340, over 'Ph.D.';
- B from ~f400, over 'in';
- C from ~f450, over 'for'.
This lasts to f820. The first review dated all three from f440, which is wrong.
  - [medium/static_hold] Blink-only holds f361–385 (0.8 s, 'different title.') and f419–439 (0.7 s, 'a third.'). In both, the slip has landed and the clerk holds a static raised arm. The first review's ranges (f343–393, f411–442) overstate the holds, because they include the spring settles and the arm moves.
  - [medium/camera_hurts] Coverage is uneven: A gets a 3.6 s close-up while B and C get none. The one move here, the pull-back, leaves the information (B's text) just as it arrives instead of moving toward it.
  viewer_should_look_at: Slip B arriving and its title next to A's; then slip C and its title.
  what_it_should_communicate: They disagree: a second, different title, then a third, each arriving just as sure of itself (with a slight comic lift on 'a third').
  what_actually_happens: The pull-back to the wide (f325–343) overlaps slip B's pop (f339). At f340 slip B is a half-transparent card hovering 70 px above its rest spot, over B's waist, while the frame is still moving.

In the same frames A lowers his arm (f331–345), and his idle hand lands on slip A's first line. From f340 to the end of the scene it hides 'Ph.D.' (the slip reads 'Kalai's P..D.').

B holds a raised presenting arm f327–403, her hand ~90 px above slip B's top-right corner. Slip C pops at f397 and is translucent in mid-air at f400, while C's arm is raised (f385–453). From ~f400, B's lowered hand covers 'in' at the end of slip B's first line.

The camera is locked wide from f343. Text on B and C is 27 px, with model names ≈24 px and date lines ≈17 px. Neither title is ever marked, enlarged or set beside A's.

Blink-only stretches: f361–385 (0.8 s, 'different title.') and f419–439 (0.7 s, 'a third.'). Apart from two small spring pops, all of f345–440 is low-energy.
  V2 DIRECTION: V2 cues: DeepSeek f333–347, different f360, title. f369–386, Llama f388–398, third. f412–424, Three f429.

FRAMING: the S1.3 truck lands at f338 on a two-shot of slips A and B at zoom ≈1.35. At that zoom the visible width is ~1,420 world px, so centre on x≈720, y≈620 to hold A's highlighted title and all of slip B. B's text then reads ≈36 px. Check every world rectangle against this framing: the checker fully in or fully out (at world x≈80–220 he would be a sliver at the left edge), and no slivers of C.

ACTION on 'DeepSeek' f333: B carries slip B out with the same hand-on-margin move. It lands at f348, after the camera has stopped, with overshoot and settle (paper_slide −1 st, thud_soft at f348). On 'different' f360, B's title gets the same coral sweep (marker_sweep) while A's highlighted title is still in frame at the left: two different titles side by side.

REACTION: A leans 2° toward B's slip and glances at it (f362–370). B grins back (f372). A then recedes: dims 20%, scale 0.97.

NEXT DEVELOPMENT:
- Truck right from f378 (during 'title.') to a B+C two-shot (centre x≈1200, zoom 1.35), landing at f394. B recedes the same way A did.
- On 'Llama' f388, C's hand is already moving and carries slip C down. It lands at f403 (paper_slide −2 st).
- On 'third.' f412, C sets it down with a small flourish: a 4° flick and settle (card_flick). Its title gets the sweep at f414.
- Pull back to the wide f418–436 (E.inOut), landing before 'different' at f439: three slips in a row, three highlighted titles.

RULES:
- The camera never moves during a slip's landing frames.
- Hands hold slip margins only, never text.
- The dimmed ticket and the set stay quiet.
## S1.5 0:14.8-0:16.7 (V1 f443-502) | V1: 'Three polished answers.'  (V2 text: 'Three different answers…' then a short deliberate pause)
  - [medium/unclear_when_muted] The 'polished' glow cannot be seen where it should be (saffron on saffron) and appears instead as a whitish smear on the clerks' waists (f450–f490). The 'proud' pose is a 4 px bob and a small arm change, so nothing reads as a beat, least of all on a phone.
  - [medium/static_hold] f451–493 (1.4 s): after the pose lands nothing develops until the hand appears. The detector misses it only because of blinks.
  - [low/overlap_or_clipping] The proud pose parks each clerk's hand on the first line of their own slip (A 'Ph.D.', B 'in', C 'for') through the stamps and on to f820.
  - [medium/timing_vs_narration] V2 rewrites the line as 'Three different answers…' with a pause before 'None of them are right.'. V1 has no anticipation designed for that pause, and its 'polish' beat is keyed to the old wording.
  viewer_should_look_at: All three slips together (three different titles), then the stamp hand rising into frame during the pause.
  what_it_should_communicate: Three polished, confident and different answers. Then tension: something is about to happen to them.
  what_actually_happens: Locked wide. On 'Three' (f443–451) an 18 px saffron drop-shadow glow ramps on around all three slips. The clerks blend to a 'proud' pose (f439–451): grin, both arms a16/b20, a 4 px bob up.

The glow is saffron against a saffron wall and cream windows, so it is invisible along the slip edges. It only shows as a pale haze across the bottom of the clerks' torsos: B's cardigan and C's shirt look washed out just above the slip tops at f450–f490.

The proud pose moves each front hand onto its slip's first line: A's to the top-right by 'Ph.D.', B's over 'in', C's over 'for'.

From f451 to f493 (1.4 s) only blinks move. The stamp hand starts entering from the left at f493.
  V2 DIRECTION: V2 cues: Three f429, different f439, answers… f449–477, None f486. The audible pause is only ~f462–486 (~0.8 s) and sits inside the long 'answers…' word, so check it on the waveform.

SETUP: the wide (zoom ≈1.04) arrives from the S1.4 pull-back at ~f436, with all three titles already highlighted.

ACTION on 'different' f439: the three title highlights pulse L→R (A f439, B f443, C f447; marks.pulse), and each gold border glints (glint, rising pitch). They are polished, and they disagree. Drop the saffron drop-shadow glow.

REACTION f441–450: the clerks straighten in near-sync (3-frame stagger), grin, and push their slips ~10 px toward the viewer (scale 1.03). They hold the slips' bottom corners, so no hand is over text.

SECONDARY: the checker raises one eyebrow (browAsym 0.8 at f452).

NEXT DEVELOPMENT, in the pause:
- The shared StampArm (components/v2) rises from the bottom edge at f460 (enter, 14 frames). Aim it with worldToScreen at slip A's stamp point (AnswerSlip SLIP_STAMP_AT); it hovers there by f474.
- Wind-up f478–484: the stamp lifts ~30 px with a slight stretch (the strike lift).
- The music drops out at ~f470, leaving near-silence before 'None'.

CAMERA: a slow push 1.04→1.08 on the slip row from f439 to f468 (E.inOut). It must be fully stopped before the wind-up, so the stamps hit a still frame.

CODE: key this beat to 'different', and move the stamp cue off at('s03','All'), which throws on the V2 text.
## S1.6 0:16.8-0:17.9 (V1 f503-536) | V1: 'All wrong.'  (V2 text: 'None of them are right.', lower and firm; it must land)
  - [high/offscreen_or_cropped] The arm is a long horizontal pole from off-screen left that reads as accidentally cropped: the brief's 'long red pointer/arm'. At f520–f545 it slices across A's and B's shoulders and upper chests at y≈500–580, on the way in and again on the way out.
  - [high/disconnected_or_floating] Contact and mark are in different places. The stamper face hits the slip's top edge and the clerk's hand (y≈640–686), while WRONG prints at the bottom-right corner (y≈815–915), ~200–240 px away. Each mark also hangs half off its slip onto the counter wood (f510, f520, f530 tiles), so ink appears on wood that was never touched.
  - [high/motion_quality] There is no anticipation: the hand is still sliding in when the first press begins at f501. Each press is a 10-frame sine with no squash, no slip jolt or flutter, no counter or camera response and no settle. The hand drags sideways while the stamp is still down (f509–511, f519–521).
  - [medium/other] The reactions are not caused by the hits. One 'oops' ramp (f509–519) drives all three clerks, so B reacts before her slip is hit (f515) and C 16 frames before his (f525). Their faces are ~110 px wide at the wide, so the 'o' mouth and 4° head tilt barely register on a phone.
  - [medium/unclear_when_muted] The climax produces less screen motion than the two camera moves. The WRONG marks are 40 px (≈13 px on a phone) at the slips' corners, so muted it looks like three small red labels quietly appearing.
  - [medium/timing_vs_narration] All three stamps sit inside two words (f505/515/525, 0.33 s apart). V2's 'None of them are right.' runs f486–523 after a pause, and the V1 cue at('s03','All') throws on the V2 text.
  - [medium/disconnected_or_floating] The coral sleeve matches the checker's cardigan, but the arm emerges at y≈520 from off-screen left while the checker stands frozen at lower-left with his own arms visible. It reads as a giant second checker.
  viewer_should_look_at: Each stamp head hitting each slip, and the WRONG mark appearing exactly under it.
  what_it_should_communicate: All three confident answers are wrong. This is the payoff of the cold open and should feel like three physical impacts.
  what_actually_happens: The StampHand slides in horizontally from x≈−260 (f493–505): a 54–62 px coral-sleeved bar with a cream cuff at screen y≈500–580. The first press begins at f501, while the hand is still sliding in.

Stamps fire at f505, f515 and f525, all inside 'All wrong.' (f503–525). Each press is a 10-frame sine with 16 px travel, and its deepest point comes one frame after the mark appears. The hand slides sideways to the next slip (f509–517, f519–527) while the previous press is still 30–60% down. At f530 the bar runs from x=0 to ≈1,500, crossing A's and B's shoulders and upper chests just under their chins, with the stamper over C.

The stamper face lands on each slip's top edge, on the clerk's resting hand (A: x≈464–576, y≈640–686). The WRONG mark (40 px) prints at the slip's bottom-right corner instead (A: x≈515–710, y≈815–915), ~200–240 px away. It appears at once at 92% opacity with a multiply blend and scales 1.6→1 over ~6 frames. It hangs half off the paper onto the counter wood (offsets right −18, bottom −26). There is no squash, no slip jolt and no screen response.

All three clerks switch to an 'o' mouth together (f509–519), so C reacts 16 frames before his own slip is stamped. The hand exits by sliding horizontally back through B and A (f535–549), and the checker never moves.

Motion energy here is a few small wiggles (0:16.4–0:18.0), below both camera moves and the evidence fade.
  V2 DIRECTION: V2 cues: None f486, of f489, them f494, are f499, right. f506–523, Not f527.

ARM: use the shared StampArm, not a new top-left arm.
- It rises from the bottom edge, with the forearm leaving the frame bottom-right at ~24° from vertical, and it is staged the same way in S10, so the crop reads as deliberate.
- Aim every target with worldToScreen at that slip's SLIP_STAMP_AT, so the stamp face lands exactly where the mark prints.
- The mark sits wholly on the paper (≥20 px inside the slip edges) and is ≥56 px on screen.
- Use the kit's sleeve convention (teal = 'you, checking') so the arm no longer reads as a second, giant, coral checker.

HITS: A on 'None' f486, B on 'them' f496, C on 'right.' f508.
- A and B: shapes lift 4, down 2, hold 2, up 4.
- C: lift 6 (its anticipation fills 'are'), down 2, hold 4, up 9.
- Between targets: move 8 frames with arcHeight ~50. The hand lifts, arcs over and comes down, never sliding horizontally through the clerks.
- The 10- and 12-frame spacing is tight. If it feels rushed, land B on the end of 'them' (f497) rather than compressing C.

EACH IMPACT, in order:
1. 1-frame contact.
2. Stamp squash (impact 0.14).
3. The mark pops 1.15→1 with an ink-spread edge.
4. The slip jolts 4 px down, its corners flutter (ring) and it settles.
5. The counter nudges 1 px (counterNudge).

The third hit is heavier: stamp_heavy, camKick ~0.015, a 4-frame hold, and a 2° swing of the ANSWERS sign and the hanging ticket.

REACTION, each clerk only on their own hit: A at f487, B at f497, C at f509. Each gets a 2-frame blink, shoulders up 6 px, an 'o' mouth and a 4 px recoil away from the slip, so it reads from the body and not just the face.

SECONDARY: the slips settle, and the checker gives one small nod after C (f514).

NEXT DEVELOPMENT: the arm drops out of the bottom edge on 'Not' (exit f527–539).

CAMERA: locked through the hits; the only camera motion is the f508 kick.
## S1.7 0:17.9-0:19.9 (V1 f537-598) | Not one even had the right year.
  - [high/broken_asset] No ring encloses its year. A rings '(compl' and strikes 'is entitled'; B half-catches '05.' and strikes 'Harvard'; C straddles '07 at' and overlaps the WRONG. The evidence for 'not even the right year' points at the wrong words. The first review's 'B half-circles in 20' is wrong: it is '05.'.
  - [medium/static_hold] Still run f546–572 (0.9 s) on 'Not one even had the'. The sentence is dead until its last word.
  - [medium/timing_vs_narration] The summary chip lands at f581–591, and the scrim plus paper start at f601. The scene's verdict gets ~0.3 s of clean screen, then sits under a 35% scrim, half-hidden behind the source tag.
  - [medium/phone_readability] The summary chip is 30 px (≈10 px on a phone), and the years inside the 27 px slips are ≈9 px on a phone.
  - [low/static_hold] The clerks hold one static 'o' expression for ~7 s (f519–f737), with no progression from caught to deflated.
  viewer_should_look_at: The three years in turn (2002, 2005, 2007), then the summary chip.
  what_it_should_communicate: They are wrong even on the simplest fact: three different years, none of them right. The clerks' confidence collapses.
  what_actually_happens: Locked wide. The hand exits (f535–549), then nothing moves (still run f546–572, 0.9 s) until coral rings scale in 1.4→1 at f571, f574 and f577.

The rings are hard-coded 110×54 boxes that ignore the text:
- Slip A: the ring circles '(compl', and its lower stroke strikes through 'is entitled'. '2002', at the start of line 3, is untouched.
- Slip B: the ring catches only '05.' of 2005, and its top stroke runs through 'Harvard'.
- Slip C: the ring straddles '07 at' and overlaps the WRONG stamp.

The chip 'Three different years · none of them right' (30 px) fades in at y≈920 over f581–591. It then gets only ~10 frames of clean screen before the evidence scrim starts at f601.

The clerks hold one frozen 'o' from f519 to f737.
  V2 DIRECTION: V2 cues: Not f527, one f533, even f542, had f549, the f554, right f560, year. f566–590, And f593.

SETUP: the wide, with the three stamped slips settled and the arm leaving (f527–539).

ACTION: draw the year rings L→R with AnswerSlip marks.ring, which is attached to the year span so it always encloses the year:
- 'one' f533: '2002' (A);
- 'even' f542: '2005' (B);
- 'had' f549: '2007' (C).
Each is an 8-frame draw-on stroke (marker_circle, +0/+2/+4 st) and must not touch the WRONG mark.

REACTION: each clerk deflates as their year is circled (f535, f544, f551): smile to flat, a ~6 px slump, eyes down to their own slip.

SECONDARY: on 'right' f560, the chip 'Three different years · none of them right' (≥44 px on screen) drops onto the counter front with overshoot and settle (SNAP, chip_pop). That gives it ≥1 s of clean screen before 'And' (f593). At f570, C slides his slip back ~20 px with his hand on its margin.

NEXT DEVELOPMENT f580–592: the checker looks up at the hanging question ticket, which motivates 'And Adam Kalai?'.

CAMERA: hold the wide, or a gentle 1.08→1.12 push centred on the slip row (y≈760) so the years read ≥30 px. No lateral move. The ticket must stay in frame for S1.8.
## S1.8 0:20.0-0:21.7 (V1 f599-651) | And Adam Kalai? He's the
  - [high/static_hold] Still run f618–652 (1.17 s) on 'Adam Kalai? He's the lead author'. The card lands, and nothing marks the name as it is spoken.
  - [medium/weak_transition] An opacity crossfade with a 60 px rise over a dark scrim. Around f605–612 the paper text is superimposed on the slip text, and the document arrives from nowhere.
  - [medium/character_cut] The card's top edge cuts the clerks off at the hairline, so only three hair tufts show above the paper. It reads as heads hidden behind a board, and the clerks can't react.
  - [medium/overlap_or_clipping] f617–741: the card's lower-left corner covers the checker's pencil and right ear, and the source-tag chip starts at x≈216, against his face and shoulder. The scene's fact-checker is half-buried by the evidence.
  - [medium/competing_attention] Under a light 35% scrim, the saturated coral WRONG stamps, rings and year chip (y≈740–960) stay visible and compete with the paper.
  - [medium/unclear_when_muted] Nothing on screen links the question's 'Adam Kalai' to the author line. The irony, that the person in the question wrote the paper, depends entirely on the audio.
  viewer_should_look_at: The name 'Adam Kalai' on the question ticket, then the same name on the paper's author line.
  what_it_should_communicate: A twist: the man the models were asked about is connected to this very test.
  what_actually_happens: Screen-space cut-in. A 35% dark scrim and the paper-header Evidence card (≈1,544×400 px including padding, at x≈190–1730, y≈340–740, rotated −1°, taped) fade in with a 60 px rise over f601–617. Around f605–612 the paper text is superimposed on the clerks and the slips.

The card's top edge (y≈340) hides the clerks below the hairline, leaving three dark hair tufts above the paper. Its lower-left corner covers the checker's pencil and right ear (compare tile f590 with tiles f620 and f680). The 24 px source-tag chip (x≈216–1640, y≈756–796) butts against his face and shoulder.

Below the card a band of clutter stays visible through the light scrim (y≈740–960): the slips' bottom rows, the WRONG stamps, the rings and the coral chip. Nothing marks the name as 'Kalai?' is spoken. Still run f618–652 (1.17 s).
  V2 DIRECTION: V2 cues: And f593–601, Adam f603, Kalai? f611–634, He's f637, the f644, lead f649.

SETUP on 'And' f593: keep the S1.7 framing if the hung ticket is in it. Otherwise tilt up ≤100 px over 14 frames (E.inOut) so the ticket and the tops of the slips share the frame. No dark scrim.

ACTION on 'Kalai?' f611: a teal marker loop draws itself around 'Adam Kalai' on the ticket (RingMark/DrawBox, 10 frames, marker_circle). The checker cannot reach a ticket hanging at the top centre, so do not fake pencil contact: he points his pencil up at it from where he stands (f609–615).

REACTION: the clerks look up at the ticket, brows up and puzzled (f614–620).

CAMERA: once the loop and the look have landed, push f626–642 (E.inOut) to frameRect around the paper's landing spot plus the slips' bottom strip: ≈zoom 1.4, centred ≈(960, 690). Author names then read ≥30 px and the title ≥43 px. The frame is still before the paper lands.

SECONDARY (the match):
- On 'He's' f637 the real paper header (Evidence ≈1,000 world px wide, ≈265 px tall with padding) slides in from the lower right along the counter (paper_slide).
- It lands at f650 (paper_slap, then tape_rip ×2 at f652 and f656). Its bottom edge sits at world y≈780 and its top edge at ≈515, ≥30 px below the clerks' chins (≈482).
- The clerks' heads stay fully visible, and the slips' ringed years and WRONG stamps stay visible in the strip below the paper.
- Meanwhile the teal loop detaches from the ticket, travels down (worldToScreen) and lands on 'Adam Tauman Kalai*' as the paper settles. The question's name becomes the paper's lead author.

NEXT DEVELOPMENT: as the paper settles (f650–654), the clerks lean 3° toward it and peek over its top edge.
## S1.9 0:21.7-0:24.3 (V1 f652-728) | lead author of the paper that reported this test.
  - [high/static_hold] Still run f660–726 (2.23 s) on 'of the paper that reported this test.'. This is the longest freeze in S1.
  - [high/phone_readability] Sizes in V1, with their phone equivalents:
- 'Lead author' tag: 24 px (≈8 px). It is the label the narration names.
- Source tag (guard rail): 24 px (≈8 px), unreadable.
- Author names and 'September 4, 2025': ≈30–32 px (≈10–11 px), borderline.
- Title: ≈46 px (≈15 px), which survives.
The first review's 24 px author size and 40 px title were underestimates.
  - [medium/unclear_when_muted] The brief's documents rule ('don't treat the whole page as equally important') is not applied. 'The paper' and 'this test' are not shown, and the Evidence component's existing focus and dimOutside props go unused.
  - [low/character_cut] The clerks stay hidden behind the card except for their hair tufts, so they can't react to the reveal.
  viewer_should_look_at: 'Adam Tauman Kalai' with the Lead author tag, then the paper title, then the source tag and the three stamped slips ('this test').
  what_it_should_communicate: He is the lead author of this paper ('Why Language Models Hallucinate', 2025), and this paper reported the three-answer test we just watched. The guard-rail source is visible.
  what_actually_happens: A teal box wipes on around 'Adam Tauman Kalai* OpenAI' (f652–666), with a 24 px 'Lead author' tag below it. Then nothing changes until the card fades at f729: still run f660–726 (2.23 s), the longest freeze in S1.

The whole header is weighted equally. The title (≈46 px) is never focused, and 'the paper that reported this test' has no visual.

The source tag 'Published test · Kalai, Nachum, Vempala & Zhang (2025), “Why Language Models Hallucinate,” arXiv · no web search' is one 24 px line, ~1,420 px long. Author names and the date are ≈30–32 px.
  V2 DIRECTION: V2 cues: lead f649, author f653, of f662, the f665, paper f673, that f679, reported f682, this f697, test. f701–723 (audible end ≈f710), Very f731.

SETUP: the paper has landed (f650) in a still frame, with the teal loop on the author name.

ACTION on 'lead' f649: the loop snaps into a DrawBox frame around 'Adam Tauman Kalai* / OpenAI' (6 frames, low marker_sweep). On 'author' f653 the 'Lead author' tag pops with a small overshoot (chip_pop). It must be ≥44 px on screen, because the narration names it.

REACTION, staggered 4–6 frames from f656: A's jaw drops a little, B covers her mouth with her hand, C looks from his slip to the paper and back.

SECONDARY on 'of the paper' f662–677: Evidence focus moves to the title 'Why Language Models Hallucinate' (≈1.4× on the title, so ≥60 px on screen), with dimOutside ~0.6. A quick underline lands on 'September 4, 2025' at f675.

NEXT DEVELOPMENT:
- On 'reported' f682, the source tab slides out from under the paper's right edge like a file tab (card_slide). Set it on two lines at ≥30 px: 'Published test · Kalai, Nachum, Vempala & Zhang (2025)' / '“Why Language Models Hallucinate,” arXiv · no web search'. Check its rectangle against the WRONG stamps and ringed years so it covers neither.
- On 'this test.' f697, the focus releases back to the whole paper over 12 frames. The paper's bottom edge lifts 4 px and settles, pointing the eye at the stamped, ringed slip strips below it: 'this test' is those three answers.
- The quiet tail of 'test.' (≈f710–731) is a designed hold with blinks only, and it overlaps the paper exit in S1.10.

CAMERA: stays on the paper; every move happens inside the document.
## S1.10 0:24.3-0:27.3 (V1 f729-820) | Very professional. Very fictional.  (V2: 'Very professional… [beat] Very fictional.')
  - [high/competing_attention] f729–753: the evidence fade-out, the camera push, the caption fade-in and the clerks' pose change all happen within 0.8 s. The clerks' 'proud again' beat, the 'very professional' half of the joke, is spent during the camera move.
  - [high/timing_vs_narration] The punchline is pre-shown: 'Very fictional.' sits at 30% coral from f735 to f788, before it is spoken. The V2 read adds a beat between the halves, which makes the spoiler worse.
  - [medium/broken_asset] At CHECKER (zoom 1.3, cx 300) the counter's left end is visible at x≈351, with bare wall below it to the frame bottom. The camera move reveals the edge of the set.
  - [medium/character_cut] In the punchline framing (f750–810) the counter-lip band crosses the checker's face at the glasses, a tangent through the one face the joke depends on. His stiff horizontal left forearm points at nothing in the bare-wall strip.
  - [medium/offscreen_or_cropped] Cut at the right edge: the chip ('Three different years ·'), slip B ('Algebraic Metho…') and clerk B's right side. Clerk C is off-screen while 'proud again' is meant to involve all three clerks.
  - [medium/static_hold] Still run f754–784 (1.03 s) on 'professional. Very fictional.'. The camera arrives and nothing happens until the deadpan.
  - [medium/phone_readability] The deadpan is a small eye and brow change: eyes ≈15 px wide at this zoom, ≈5 px on a phone. The punchline reaction doesn't read small.
  - [medium/weak_transition] The pull-out starts at f808. The f814–826 hard-edge wipe then cuts the opaque caption in half and reveals ~10 frames of empty cream before S2's slip pops in: a dead frame and a jump.
  - [low/overlap_or_clipping] The caption box's bottom edge (y≈184) is tangent to clerk A's visor, and at f740 the caption covers the lower half of the ANSWERS sign mid-push.
  viewer_should_look_at: The proud clerks beside their WRONG-stamped slips, then the checker's deadpan as 'Very fictional.' lands.
  what_it_should_communicate: Joke 1: the answers looked impeccable and were invented. The checker's deadpan is the punchline.
  what_actually_happens: Between f729 and f753, four things change at once:
- the card fades out (f729–741);
- the camera pushes to CHECKER (cx 300, cy 640, zoom 1.3; f733–753);
- the caption fades in at the top of the screen (f735–745), overlapping the lower half of the ANSWERS sign at f740;
- the clerks blend from 'oops' to 'proud' (f737–749).

The caption shows the coral half 'Very fictional.' at 30% opacity from f735 until it brightens at f788–796, so the punchline is visible ~1.8 s before it is spoken.

The CHECKER framing:
- It exposes the counter's left end at x≈351: bare yellow wall runs to the frame bottom across the left ~18% of the frame.
- The checker's horizontal left forearm points into that empty wall.
- The counter-lip band (y≈600–640) runs right through his glasses.
- Slip B and clerk B are cut by the right edge, clerk C is out of frame, and the chip is cut after 'Three different years ·'.
- The caption's bottom edge (y≈184) is tangent to A's visor (y≈190).

Still run f754–784 (1.03 s). The deadpan (f784–794) is eyes to camera, brow asymmetry and a −3° tilt: tiny at this size.

The camera starts pulling out at f808. S2's hard-edge wipe (f814–826) then slices through the still fully opaque caption (its fade starts only at f824) and reveals ~10 frames of empty cream before S2's slip pops in at 0.7 scale.
  V2 DIRECTION: V2 cues: test. audible end ≈f710, Very f731, professional… f741–772 (beat ≈f760–774), Very f774, fictional. f786–808; S1 ends at f817.

SETUP f710–731: the checker reaches the paper's left edge (reach) and slides it off the counter to the left, out of frame (paper_swish, 12 frames, E.in). Over the same frames the camera eases back from the paper framing to the wide (≈1.04), finishing by f731 and revealing the stamped slips and the deflated clerks.

ACTION on 'Very professional…' f731: only the first half of the caption pops in (scale 0.9→1, small overshoot, chip_pop −6). The second half does not exist yet: no ghost. Keep the caption's bottom edge ≥30 px clear of every head in both framings.

REACTION f733–750: the clerks straighten with pride, staggered: A adjusts his visor (f735), B smooths her cardigan (f739), C taps his headset (f743). Each hand touches what it adjusts. The WRONG stamps stay in view beside their grins.

SECONDARY, in the beat (≈f760–774):
- The checker's eyes slide to slip A's WRONG.
- A 12-frame push (E.inOut, f762–774) moves to a two-shot of the checker, slip A and clerk A: frameRect over those three rectangles with a 60 px margin.
- The counter must run past the left frame edge (the V2 CounterSet extends 400 px).
- Slip B and the chip are each fully in or fully out.
- The checker's head centre sits ≥40 px off the counter-lip line, and no forearm sticks out into the wall.
- The move ends before 'Very' (f774).

PUNCHLINE on 'fictional.' f786:
- The coral half stamps into the caption box: scale 1.25→1, a 2-frame squash and a 3 px box jolt, with stamp_light −8 dB echoing the WRONG stamps.
- The checker turns his head to camera over 6 frames (f788–794) and holds a half-lid look with one brow up. His head is ≥180 px tall on screen, so it reads on a phone.
- He taps his pencil on the counter at f800 (pencil_tap).
- A small 1.00→1.03 push runs under the deadpan, f788–806.

NEXT DEVELOPMENT f800–817: the caption pops out over 8 frames (f800–808). Slip A then lifts toward camera into the S1→S2 hand-off (see transition_out). The V2 tail after 'fictional.' is only ~10–15 frames, so there is no room for a 0.5 s hold.

## SCENE PROBLEMS
  - static_hold high 10.6 s of 27.3 s is still (38.8%). Each still run and what should be developing during it:
- f33–82 (1.67 s): the clerks pop up to attention and the ticket drops and settles.
- f94–119 (0.87 s) and f145–199 (1.83 s): word-synced typing, the clerks' eyes tracking, the 'Adam Kalai' underline, the clerks ducking for slips on 'dissertation?'.
- f283–309 (0.9 s): CMU ringed on 'university', A's chin-up.
- f546–572 (0.9 s): years ringed in sequence, clerks deflating.
- f618–652 (1.17 s): the name looped on 'Kalai?' and matched to the author line.
- f660–726 (2.23 s): focus moving from author to title, the source tab sliding out, clerks reacting.
- f754–784 (1.03 s): the clerks' proud straighten and the checker's glance during the beat.
The detector misses three blink-only stretches: f361–385, f419–439 and f451–493. Background life is only a 4-frame blink and ~1 px breathing.
  - unclear_when_muted high The brief's escalation (sound certain → disagree → all wrong) is not staged:
- All three answers arrive the same way (fade-pop).
- 'Different' is never shown.
- The 'polished' glow is invisible.
- The stamps are the lowest-energy action in the scene.
Muted, you see cards appear and small red marks.
  - disconnected_or_floating high Physical connections are broken throughout:
- The clerks stand in front of the wall with their legs showing above the counter, and their idle hands hover ~5 px over the lip.
- No slip is touched while it is 'handed over'. Afterwards the hands land on the slip text: A from f340, B ~f400, C ~f450.
- The stamp arm is a disembodied horizontal bar.
- Stamp contact is 200–240 px from each printed mark, and the marks hang off the paper onto the wood.
- The year rings miss the years.
- The ticket, the evidence card and the caption are screen overlays that nobody handles; the evidence card buries the checker's pencil and ear.
- The checker, the fact-checker of the piece, does nothing for 26 s.
  - phone_readability high Guard-rail text fails the V2 rule (≥30 px on screen):
- ticket label 24 px;
- slip model/date lines 15.5–17 px at the wide and ≈24 px in A's close-up;
- source tag 24 px.
Critical text fails the V2 rule (≥44 px):
- 'Lead author' 24 px;
- the summary chip 30 px;
- WRONG 40 px at the wide.
The answers on B and C (27 px) are never enlarged. Character reactions are face-only on ~110 px faces.
  - camera_hurts medium The camera makes only two moves (push to A, push to the checker), and both overlap other events:
- Slip B pops and A's arm drops during the pull-back.
- The evidence fade, caption fade and pose change happen during the checker push.
B and C are never framed. The pull-back moves away from B's text as it arrives. The SLIP_A framing cuts B's bun and A's visor at the top edge. The final framing exposes the counter's end, runs the counter lip through the checker's eyes, and crops the chip and clerk B.
  - motion_quality medium Nearly every entrance is an opacity fade: ticket, slips (opacity t×1.4, visibly translucent at f340 and f400), evidence card, caption. Physical motion (overshoot, settle, follow-through) is missing everywhere except a small spring on the slips. Camera moves are 18–22-frame easeInOut with no settle, and one reaction ramp drives all three clerks at once.
  - competing_attention medium The screen-space overlays sit outside the camera and fight the set:
- The ticket covers the ANSWERS sign and the arch tops.
- Under the 35% scrim, the saturated WRONG stamps, rings and chip stay visible below the paper.
- The caption overlaps the sign while the camera pushes in.
  - timing_vs_narration high V2 narration and timeline pitfalls:
- s03 is now 'Three different answers. None of them are right. …', so at('s03','All') (the stamp cue) throws, and the cThree-keyed 'polish' beat now falls on 'Three different'.
- The compiled V2 timeline (source/src/data/timeline.json) already maps the takes' [tags] and IPA tokens to display words: Kalai's@153 in s01, Kalai?@611 in s04. The first review's warning about the raw x02_t1.align.json does not apply to scene code.
- The V2 read leaves only 3–8 frames between most sentences: 'dissertation?'→'ChatGPT' 5, 'year.'→'DeepSeek' 3, 'title.'→'Llama' 2, 'third.'→'Three' 5, 'right.'→'Not' 4, 'year.'→'And' 3, 'test.'→'Very' 8. Any move or reaction placed 'in the pause' must start on the previous sentence's last word.
- The designed pauses live inside long final words: 'answers…' f449–477 (audible pause ≈f462–486), 'professional…' f741–772 (beat ≈f760–774). Verify them on the waveform.
  - other medium Direction conflicts to avoid when executing the first review:
- A new top-left stamp arm would contradict the shared StampArm, which rises from the bottom and is reused for S10's 'SOURCE?' callback.
- A screen-space ticket cannot stay hung through camera moves; it must live in the world at wall depth.
- The checker cannot pencil-circle a ticket at the top centre from the counter's end.
- A 1,500 px paper 'on the counter' would cover all three slips it is meant to leave visible.
The V2 directions above resolve each one.
  - other low The scene uses the ghost pre-reveal twice: the question at 18% before typing (f20–187), and 'Very fictional.' at 30% before it is spoken (f735–788). Reveals should appear on their cue, not be pre-shown.
  - character_cut medium The checker:
- At the wide: cut by the left edge (hand) and the bottom edge (shins), with the counter lip through his eyes.
- In A's close-up: tangent to slip A, pencil touching it.
- Under the evidence card: his pencil and ear are covered.
- In the punchline shot: the counter lip runs through his eyes again.
He is passive until the last second, and the final joke depends on a character the scene has ignored.

## TRANSITION IN
Now: S1 is the first scene. Frame 0 is the complete, static wide shot (set, three clerks, cropped checker). The first change is the ticket fade at f9 and the voice starts at f14, so the hook opens on a still picture.

There is no previous scene, so no motivated transition applies; keep the cold open with no channel intro, as the brief asks. V2 has 18 frames before 'Three' (f18). Use them as action:
- From f0, the clerks are heads-down and busy behind the counter, each shuffling paper on a different 20–30-frame loop.
- Very low counter room tone and the hook's tension bed run from f0.
- The clerks pop up L→R on 'Three', 'popular' and 'AI' (f18, f26, f42).
- The question ticket drops on its strings on 'asked' (f69), not in the first frames. This keeps one action per idea.

Frame 0 must still be a clean composition:
- the sign readable;
- all three arches whole;
- the counter lip meeting the clerks at the waist;
- the checker fully in frame at the counter's left end, or out of frame;
- nothing cropped or tangent.

## TRANSITION OUT
Now: the CHECKER camera starts pulling out at f808. S2 mounts at f814 with a 12-frame hard-edge paper wipe from right to left (Main.tsx Wipe, f814–826). The wipe slices through the still fully opaque joke caption (its fade starts only at f824) and reveals ~10 frames of an almost empty cream field (S2 tile f830). S2's slip then pops in small (scale 0.7, translucent) at the centre. The result is a dead frame and a jump.

V2_DIRECTION already defines this boundary as a cut: S1 lifts slip A to HANDOFF (S1 liftPose), and S2 opens with the slip there (SLIPS[0], 660 px, rotated −3°, with its WRONG stamp). Execute it with weight:
1. The caption pops out over f800–808.
2. Slip A, already in the final two-shot, gets a 2-frame anticipation dip.
3. It lifts off the counter toward camera (paper_lift at ~f806), rotating from −1.5° to −3° and scaling to S2's exact screen position and size by f817.
4. In the last ~6 frames the counter set darkens or falls away beneath it, so S2's paper field reads as the slip's own background.
5. S2 picks the slip up with a 1–2% overshoot and settle as 'So how can a wrong answer sound that sure?' begins (soft paper settle).

Replace the wipe on this cut. Check that the slip's last S1 frame and first S2 frame match exactly: position, scale, rotation, stamp and marks.

## SOUND MOMENTS
[
 "f0 (V2), 0:00.0: amb_counter from the scene start (dur ≈27 s), mixed very low, under the hook's tension music bed.",
 "V2 f18 / f26 / f42 ('Three' / 'popular' / 'AI'; V1 0:00.5–0:01.5): the three clerks pop up L→R. pop_tick ×3, rising pitch 0 / +2 / +4 st, gain −8 dB.",
 "V2 f69 → f75 ('asked'; V1 ~0:02.2): the question ticket drops on its strings (paper_flap), then catches on its hooks (hanger_click).",
 "V2 f90 ('question:'): the guard-rail tab stamps onto the ticket. chip_pop, −6 dB.",
 "V2 f117–166 (each word onset from 'what' to 'dissertation?'; V1 0:03.9–0:05.6): one typewriter_tick per word, +3 dB on 'Adam' (f146) and 'Kalai's' (f153). The '?' lands at ~f185 with a quiet bell_ding (−10 dB).",
 "V2 f175–190 (during 'dissertation?'): the clerks duck to grab slips behind the counter. paper_lift, −8 dB.",
 "V2 f204 → f216 ('ChatGPT'; V1 0:06.9–0:07.5): A carries slip A out (paper_slide); it lands against the counter front (thud_soft); its gold edge glints at f222 (glint).",
 "V2 f254 / f275 / f309 ('title,' / 'university,' / 'year.'; V1 f258 / f280 / f309): marker_sweep on the title (0 st), marker_circle on CMU (+2 st), marker_circle on 2002 (+4 st). At f318, A's finger tap on the slip (pencil_tap −8 dB).",
 "V2 f333 → f348 ('DeepSeek'; V1 0:11.2–0:11.7): slip B slide (paper_slide −1 st) and landing (thud_soft). f360 ('different'): marker_sweep on B's title.",
 "V2 f388 → f403 ('Llama'; V1 0:13.1–0:13.5): slip C slide (paper_slide −2 st) and landing. f412 ('third.'): card_flick for the flourish; f414: marker_sweep on C's title.",
 "V2 f439 / f443 / f447 ('different'): three glint pings L→R, rising pitch.",
 "V2 f460–474 (inside 'answers…'): the StampArm rises from the bottom edge. whoosh_soft at −12 dB, or nothing. The music drops out at ~f470, leaving near-silence before 'None'.",
 "V2 f486 / f496 / f508 ('None' / 'them' / 'right.'; V1 f505 / f515 / f525): three rubber stamps, stamp_light, stamp_light +2 dB, then stamp_heavy on C. Each is on its contact frame, layered with a short paper rattle as the slip jolts. Music returns after the third hit (~f515).",
 "V2 f527–539 ('Not'; V1 f535–549): the arm drops out of frame. whoosh_soft −14 dB, or none.",
 "V2 f533 / f542 / f549 ('one' / 'even' / 'had'; V1 rings f571–577): marker_circle ×3 around the years, +0 / +2 / +4 st.",
 "V2 f560 ('right'; V1 f581): the summary chip drops onto the counter front. chip_pop.",
 "V2 f611 ('Kalai?'; V1 0:20.4): the teal loop draws itself around the name on the ticket. marker_circle, teal-coded and slightly lower in pitch.",
 "V2 f637 → f650 ('He's the'; V1 f601–617): the paper header slides along the counter (paper_slide) and lands (paper_slap), then tape_rip ×2 at f652 and f656. Use a drier, crisper 'evidence' texture than the slips. The music pulls back under the evidence.",
 "V2 f649 / f653 ('lead' / 'author'; V1 f652): DrawBox around the author (low marker_sweep), then the 'Lead author' tag (chip_pop).",
 "V2 f662 ('of the paper'): the focus shift to the title is silent. No whoosh.",
 "V2 f682 ('reported'): the source tab slides out from under the paper. card_slide, −6 dB.",
 "V2 f712–724 (after 'test.'; V1 f729): the checker slides the paper off the counter. paper_swish.",
 "V2 f731 ('Very professional…'; V1 f737): the caption's first half pops (chip_pop −6). The clerks' pride gestures are silent, or a very soft collective rustle.",
 "V2 f786 ('fictional.'; V1 f790): the coral half stamps into the caption. stamp_light −8 dB, a light echo of the WRONG thuds. f800: the checker's pencil_tap on the counter during the deadpan.",
 "V2 f806 → S2 start (V1 ~0:27.0): slip A lifts toward camera (paper_lift) and settles at the start of S2 (thud_soft −10 dB)."
]

## PHONE-CRITICAL TEXT
[
 "Question line 'What was the title of Adam Kalai's dissertation?': 52 px serif on screen, ≈17 px on a 640×360 phone. SURVIVES. In V1 it shows as 18% ghost text before it is typed.",
 "Ticket label 'THE QUESTION · asked of GPT-4o, DeepSeek-R1 and Llama-4-Scout · 9 May 2025' (guard rail): 24 px, ≈8 px on a phone. FAILS; needs ≥30 px, as its own tab. The ticket itself is ≈1,240 px wide, not 1,500.",
 "Slip A body (ChatGPT excerpt: title, CMU, 2002): 25 px at the wide (≈8 px, FAILS); ≈39 px in V1's SLIP_A close-up (≈13 px, survives); ≈33 px at V1's CHECKER zoom (≈11 px, marginal).",
 "Slip model names 'ChatGPT' / 'DeepSeek' / 'Llama': ≈22–24 px at the wide (≈8 px). FAIL at the wide; ≈35 px only for A, in its close-up.",
 "Slip date lines 'GPT-4o · 9 May 2025', 'R1 · 9 May 2025', '4 Scout · 9 May 2025' (guard rail): 15.5–17 px at the wide (≈5–6 px) and ≈24 px in A's close-up (≈8 px). FAIL everywhere.",
 "Slip B and C bodies ('Algebraic Methods in Interactive Machine Learning' … Harvard 2005; 'Efficient Algorithms for Learning and Playing Games' … 2007 at MIT): 27 px, only ever seen at the wide (≈9 px). FAIL; never enlarged. A's resting hand also covers 'Ph.D.' from f340, B's covers 'in' from ~f400, C's covers 'for' from ~f450.",
 "Slip A footer 'university · year · title': 20 px world (≈31 px at the close-up zoom), ≈7–10 px on a phone. FAILS; remove it.",
 "WRONG stamps: 40 px display caps at the wide (≈13 px), rotated −12° and partly off the paper. BORDERLINE; V2 needs ≥56 px on screen, wholly on the slip.",
 "Chip 'Three different years · none of them right': 30 px at the wide (≈10 px). FAILS the V2 critical-text rule (≥44 px). It gets only ~0.3 s of clean screen and is cut at the right edge in the final CHECKER framing.",
 "Year rings: not text, but they carry the 'right year' claim; at 27 px slip text the circled years are ≈9 px on a phone. They also point at the wrong words (A '(compl', B '05.', C '07 at').",
 "Paper header title 'Why Language Models Hallucinate': ≈46 px (≈15 px on a phone). SURVIVES; still push to ≥60 px with Evidence focus on 'of the paper'.",
 "Paper author names (Adam Tauman Kalai, Ofir Nachum, Santosh S. Vempala, Edwin Zhang) and 'September 4, 2025': ≈30–32 px (≈10–11 px). BORDERLINE; fine for the guard rail, but the lead author's name should be ≥34 px in its own beat.",
 "'Lead author' tag: 24 px (≈8 px). FAILS; the narration names it, so it needs ≥44 px.",
 "Source tag 'Published test · Kalai, Nachum, Vempala & Zhang (2025), “Why Language Models Hallucinate,” arXiv · no web search' (guard rail): 24 px, one line ~1,420 px long (≈8 px). FAILS; set on two lines at ≥30 px.",
 "Joke caption 'Very professional. Very fictional.': 64 px Fredoka, screen space (≈21 px). SURVIVES, but the coral half shows at 30% opacity before its cue, and its bottom edge is tangent to A's visor.",
 "ANSWERS sign: 48 px (≈16 px). SURVIVES. It is an environmental label, but it is the only 'answer counter' cue, and in V1 the ticket covers it from f20 to f214."
]

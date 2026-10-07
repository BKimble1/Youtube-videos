# V1 shot review — S6 — The game show (s20–s25). V1: timeline S6 = f4295–5698 (2:23.2–3:09.9). The component is mounted f4289–5704 for the wipe overlaps, so 46.8 s are on screen. V2: S6 = f4395–5843 (48.3 s). The S5→S6 iris runs f4386–4404 and the S6→S7 10-frame wipe runs f5838–5848. Segment lengths: s20 7.5 s, s21 7.6 s, s22 6.3 s, s23 6.6 s, s24 4.5 s plus a 0.87 s gap, s25 12.3 s. After s25's 'back.' ends (about f5830) only about 13 frames remain before S6 ends.

Purpose: S6 turns the researchers' argument (Kalai et al. 2025) into a game show. Under right = +1, wrong = 0, “I don't know” = 0, a guesser who knows exactly what the honest player knows still wins 7–6. Make a wrong answer cost a point and the honest player wins 6–4, and the trophy walks back. This is the episode's causal 'why', and it sets up S7 (9 of 10 benchmarks give no credit for “I don't know”). Story, cast and jokes work. The execution does not.

Biggest execution problems:

(1) DEAD TIME AND FROZEN ACTING.
- 22.2 of 46.8 s (47.5%) is still: 15 runs, the longest 2.73 s.
- f5025–5117 (3.1 s) adds more dead time: the only change is a 10 Hz A/B/C/D flicker on four 66 px tiles.
- The host holds one raised-fist pose for about 44 s.
- The honest contestant has only two expressions in 30 s.
- The guesser doesn't react to his own three wrong answers or to the rule change.
- Scores swap values in one frame, and nobody touches anything.

(2) BROKEN STAGING GEOMETRY.
- The podiums sit 150 px right of their contestants. Their lids are at shoe height and their bases are cut by the frame bottom.
- The 'buzzer' is drawn on the podium front 8 px above the frame edge, where no hand can reach it.
- The scoreboards float at the far frame edges, 1290 px apart.
- The two tile strips read as one 20-slot row, and its middle hangs over the host's head.
- The trophy stands knee-high beside the guesser. It then walks through the host and the honest contestant at their foot depth and ends on the floor.

(3) THE CAMERA REMOVES WHAT MATTERS.
- 7.6 s of a lone host standing in the unlit gap between two spotlight cones.
- A tilt to blank curtain on 'Picture a ten-question quiz', with the host cut at the hips.
- A GUESS push that slices the honest contestant and hides his '6' for 10.7 s, through 'Seven points' and the whole trophy joke, while about 20% of that frame is empty curtain on the right.

(4) TIMING AND LOGIC BUGS.
- `at()` takes the first occurrence of a word, so 'Six' fires on 'know six' and 'Four' fires on 'all four.'.
- The honest '6' appears when only five ✓ tiles exist. The guesser's board never shows 6.
- The lucky tile resolves first and looks like a known ✓.
- The joke headline pre-shows 'Somehow, a trophy.' at 30% opacity before it is spoken.
- The guesser's equation appears during the honest line.
- The trophy lands 2 frames before the S7 wipe.

(5) READABILITY AND OVERLAPS.
- Screen-space overlays collide with the world:
  - the headline sits over the rule cards;
  - the '1 in 4' chip crosses legs, nameplates and the trophy base;
  - the takeaway chip covers the HONEST nameplate.
- Every guard-rail and payoff text is 22–30 px, about 7–10 px on a phone, against V2's minimums of 30 px (guard rails) and 44 px (critical text).
- The host's 'deadpan' is invisible: his mouth and brows are drawn in ink on a near-black beard and hair.

Corrections to the first pass:
- The host is cut at the hips, not mid-thigh.
- Tiles are 66 px, not 62 px.
- The four guesses resolve over 0.73 s, not 0.4 s.
- The guesser drops his guessing pose at f5113–5123, before 'lands.' ends.
- The host's deadpan is invisible, not 'subtle'.
- The equation box touches the guesser's hair, not his cheek.
- The HOST zoom starts as the wipe ends; it is the rise that overlaps the wipe.
- V1 does have a trophy fanfare, synth stingers and trophy footsteps; the real problem is identical textures and bad sync.
- The S5→S6 iris and the S6→S7 10-frame wipe are already locked in V2_DIRECTION, so a curtain swish and a panel→table morph are proposals for the lead.
- The V2 timeline leaves only about 13 frames after 'back.', not 0.8 s.
- Several of the first pass's V2 camera pushes would crop a scoreboard.
- Its rules-board fly-out would take the 'illustrative quiz' guard rail off screen.
- The host cannot physically reach the rule cards.
- The takeaway needs 44 px, not 40 px.

## S6.1 2:23.2-2:28.0 (V1 f4295-4440) | Now, why guess at all? Why not just say “I don't know”? The researchers
  - [high/blank_space] f4317–4544: the host fills about 19% of the frame width. About 1550 px of empty curtain sits on either side of him for 7.6 s. No set, podiums or rig are visible.
  - [medium/competing_attention] The two spotlight cones light empty curtain left and right while the host stands in the unlit V between them (f4320, f4400, f4520). The only person on stage is the least-lit thing in the frame, and the bright cones pull the eye away from him.
  - [medium/static_hold] The shrug is held frozen for 2.1 s (f4369–4431) through 'Why not just say “I don't know”? The researchers' (still runs 1.17 s + 1.0 s).
  - [medium/motion_quality] The host rises through a solid floor (f4295–4315): no hatch, no lift, no settle. At f4300 his head and torso are drawn over the blue floor band.
  - [medium/camera_hurts] The zoom to z1.35 starts as the wipe ends (f4301) and overlaps the rise until f4315, so two moves run at once. It only enlarges a lone figure on blank curtain and removes the stage context.
  - [low/weak_transition] A generic paper wipe onto an empty curtain, with nothing to say 'we are now in a game show'. V2_DIRECTION already replaces it with the lens→spotlight iris.
  viewer_should_look_at: The host, lit, asking the question, then the shrug that frames 'I don't know' as a real option. It is also the first look at the game-show room.
  what_it_should_communicate: A pivot from fabricated citations (S5) to WHY models guess instead of abstaining, set up as a playful game show.
  what_actually_happens: S6 is mounted at f4289 and revealed by a 12-frame paper wipe (f4289–4301), with the new scene appearing from the right edge. The V1 cue sheet puts a generic [EL whoosh] at f4282.

During the second half of the wipe, the host rises 400 px straight up through the solid blue floor (hostIn f4295–4315, easeInOut, no settle). At f4300 his head and shoulders are pasted on the blue floor band. The WIDE→HOST zoom (cx960 cy520 z1.35) starts on the frame the wipe ends (f4301–4317), so for 14 frames he rises while the camera zooms.

From f4317 the frame is one host, about 360×570 px (x≈810–1170, y≈450–1020), on striped curtain, with about 80% of the frame empty. He stands in the darker V between the two spotlight cones; the cones light empty curtain on either side of him (f4320–4540). His right arm is already up in a fist.

On 'Why' #2 (f4359) he blends into a palms-up shrug over 10 frames. He holds it frozen f4369–4431 (still runs f4367–4401 and f4403–4432) and is back in the fist pose by f4441. Only blinks move.
  V2 DIRECTION: TRANSITION (locked in V2_DIRECTION §9): an 18-frame iris from S5's magnifier lens (V2 f4386–4404) opens on a spotlight pool centred on H56 (960,540, r130). In WIDE z1.0 that circle frames the host's head and chest. 'Now,' comes only 12 frames after the scene starts (V2 4407), so there is no time for a walk-in: he is already on his centre mark inside the pool, in a small bow, with the stage at about 40% light.

ACTION: 'Now,' (4407) — he snaps upright and claps once. The two side spots snap on (machine_clunk at 4409 and 4413), revealing the stage, the empty contestant marks and the dark rules rig overhead.

'why guess at all?' (4424–4455) — he raises his index finger and leans 4° toward camera.

REACTION: 'Why not just say “I don't know”?' (4463–4520) — the palms-up shrug, kept alive: the shoulders bounce once on 'know' (4507), the head tilt drifts 0→5°, one slow blink, and the eyes slide up to the rig.

NEXT DEVELOPMENT: 'The researchers' (4529) — he points straight up.

ACTING NOTE: his mouth and brows do not read (ink on a black beard and hair; see S6.9). Carry every expression with head, eyes, hands and posture, never 'lifts his brows'.

CAMERA: WIDE locked through the shrug. Start the only push on the point: camPath to z1.12, cx960, cy470 over 4529–4547 (E.inOut), settling before 'argue' (4549) so the sign drops into a still frame.

SOUND: amb_gameshow starts under the iris (f4386, about 48.6 s) with a soft swell, then machine_clunk ×2 for the lights. No whoosh.
## S6.2 2:28.0-2:31.5 (V1 f4441-4544) | argue that part of the answer is how models get graded.
  - [high/static_hold] A 1.93 s still (f4453–4510) on 'argue that part of the answer is how models get graded': the thesis plays over a frozen host and an empty curtain.
  - [high/timing_vs_narration] The sign lands on the last word, 'graded.' (f4509), and is gone by f4547. The thesis and its source are readable for about 0.9 s.
  - [medium/offscreen_or_cropped] f4520: the sign's top border is about 4 px from the frame top. Text is jammed against the edge.
  - [medium/camera_hurts] f4537–4553: the camera tilts toward the sign's position while the sign fades. At f4560 the frame is empty curtain plus half a host.
  - [medium/phone_readability] 'the researchers' argument · Kalai et al. 2025' is about 29 px on screen (about 10 px on a phone) for about 0.9 s, below the 30 px guard-rail minimum and far too brief.
  viewer_should_look_at: The thesis sign HOW MODELS GET GRADED and its attribution 'the researchers' argument · Kalai et al. 2025'.
  what_it_should_communicate: The researchers' claim that grading is part of the cause, credited to the paper.
  what_actually_happens: The host returns to the raised-fist idle pose (armR a30 b120), which he keeps until the scene ends. A 1.93 s freeze (f4453–4510) runs over 'argue that part of the answer is how models get graded'.

On 'graded.' the sign spring-pops in (f4509) at world y110 on the 0.85-depth layer. In the HOST zoom it is about 57 px tall on screen, wraps as 'HOW MODELS GET / GRADED', and its top border sits about 4 px from the frame top (f4520). The citation chip under it is 22 px in the world, about 29 px on screen.

At f4537 the camera starts tilting to RULES while the sign fades out (f4539–4547). The sign is fully readable for about 0.9 s (f4512–4539), and the camera lands where the sign used to be.
  V2 DIRECTION: SETUP: the camera has settled at z1.12, cx960, cy470 (visible world y≈2–938, x≈103–1817). The host is pointing up.

ACTION: 'argue' (4549) — the HOW MODELS GET GRADED plate drops in on two cables (drop() with one bounce, about 16 frames). It becomes the title plate of the rules board at world y≈55–160, so its top is ≥75 px below the frame top here: 540 + (55 − 470) × 1.12 = 75. The cables ring() and damp over about 20 frames.

'part of the answer' (4566) — a second line clips onto the plate: 'the researchers' argument · Kalai et al. 2025', 30 px in the world (34 px on screen now, 30 px in WIDE). It stays for the whole scene as part of the plate, never a 1 s flash.

REACTION: the host looks up (eyes up), nods once, then turns to camera and presents the plate with an open left palm. The frozen V1 fist becomes a gesture.

SECONDARY: the centre spot widens to take in the plate. The cables settle.

NEXT DEVELOPMENT: 'graded.' (4625) — three face-down card backs swing onto their hooks under the plate (world y≈185–285; hanger_click ×3, 3 frames apart, pitch rising). The rules board is assembled with its faces hidden.

CAMERA: no move after the plate lands; the plate is the information.

SOUND: hanger_click on the plate's catch and a lighter one on its bounce, chip_pop for the citation line, hanger_click ×3 for the card backs.
## S6.3 2:31.5-2:35.2 (V1 f4545-4656) | Picture a ten-question quiz. Right answer: one point.
  - [high/unclear_when_muted] 'ten-question quiz' has no visual. With the sound off, the viewer cannot know it is a 10-question quiz until the tiles appear at f4783, 8 s later.
  - [high/blank_space] f4553–4599: the frame is only curtain and a host cut at the hips. After the card lands, the middle band (y≈330–700) and both lower corners stay empty until f4776.
  - [medium/character_cut] The host is cut at the hips, with the frame bottom just under his jacket hem and his left hand sliced, for the whole RULES framing (f4553–4776, 7.4 s).
  - [medium/static_hold] Still runs f4563–4599 (1.23 s, 'a ten-question quiz. Right answer:') and f4607–4651 (1.5 s, 'quiz. Right answer: one point. Wrong').
  - [medium/disconnected_or_floating] The card appears on its own. The host neither points at nor touches it, so the presenter and the board are unrelated.
  - [low/motion_quality] The rule card is an opacity ramp plus a 16 px slide: no anticipation, flip or overshoot.
  viewer_should_look_at: The ten question slots, then the 'Right +1' rule card.
  what_it_should_communicate: There are 10 questions, and a correct answer scores +1.
  what_actually_happens: The camera tilts to RULES (cy330, z1.25) over f4537–4553. The frame becomes striped curtain with the host cut at the hips at the bottom edge (head at y≈700, his left hand cut by the frame bottom). For f4553–4599 (1.5 s) nothing informative is on screen while 'Picture a ten-question quiz' is spoken. The ten questions are never shown; the tiles only appear at f4783.

The Right card fades up and slides 16 px over f4599–4611 (easeOut, no flip, no overshoot) at x≈290–700, y≈195–305, alone at the top left of an otherwise empty row. Then a 1.5 s still (f4607–4651). The host keeps his raised fist and never points at the card. The band from y≈330 to 700 is empty curtain.
  V2 DIRECTION: SETUP: the plate and three card backs hang over the host (z1.12 framing).

ACTION + CAMERA: 'Picture' (4645) — ease back to WIDE z1.0 (4645–4665, E.inOut). This move reveals new information: the two answer boards drop in on cables at the frame sides (honest board x≈70–426, guesser board x≈1494–1850, y≈490–650; see the layout in scene_problems). They land after the camera settles (about 4672; hanger_click L, then R 4 frames later).

'a ten-question quiz.' (4659–4690) — the 10 numbered slots on both boards light 1→10 in a quick run (pop_tick ×10, rising pitch), ending on 'quiz.'.

REACTION: the host sweeps his hand toward the boards, then walks about 4 steps toward the Right card (to x≈600) during the 26-frame pause after 'quiz.'.

'Right answer:' (4707) — the cards hang 180+ px above his head, so give him a host's pointer wand (about 340 px, held with holdR). He taps the bottom edge of the Right card with the wand tip; the contact frame is the flip start. The card flips: a 6° tilt of anticipation, a 10-frame flip, a 4% overshoot, a settle. It now reads '✓ Right'.

'one point.' (4736) — '+1' pops with a 1.06 pulse (ding_right −6 dB, the teal chime).

SECONDARY: the card swings on its hook and settles. The wand recoils.

NEXT DEVELOPMENT: the Wrong card back wobbles as he walks back toward centre.

CAMERA: WIDE stays locked from here to the end of the scene (see scene_problems camera_hurts).

SOUND: hanger_click ×2, pop_tick ×10, card_flick, ding_right.
## S6.4 2:35.2-2:39.4 (V1 f4657-4783) | Wrong answer: zero. “I don't know”: also zero.
  - [high/static_hold] A 2.03 s still (f4716–4776) on '“I don't know”: also zero.' The key equivalence of the whole argument gets no visual beat.
  - [medium/unclear_when_muted] Nothing shows that Wrong 0 and “I don't know” 0 are equal, or that Right is the only way to score. Three static cards in a row do not make the point.
  - [medium/phone_readability] The guard-rail chip is 22 px in the world (about 27 px here, 22 px in WIDE), about 7–9 px on a phone, below the 30 px guard-rail minimum. The rule-card labels are 28 px in the world (34 px here, 28 px in WIDE), below the 44 px minimum for critical text.
  - [medium/character_cut] The host is still cut at the hips and frozen with his fist raised.
  viewer_should_look_at: The Wrong 0 and “I don't know” 0 cards, and that they score the same.
  what_it_should_communicate: Under this rule set a wrong answer costs nothing, exactly like abstaining. That is the incentive to guess.
  what_actually_happens: The Wrong card fades up over f4653–4665, then a still f4673–4707 (1.17 s).

The “I don't know” card and the 'illustrative quiz · 10 questions · 4 options each · expected scores' chip fade up over f4707–4719. The chip is 22 px in the world, about 27 px on screen in this zoom.

Then a 2.03 s still (f4716–4776) through 'also zero. Two'. The two zeros are never linked. The host stays frozen and cut at the hips. The camera starts pulling back at f4776.
  V2 DIRECTION: CAMERA: WIDE locked.

ACTION: 'Wrong answer:' (4766) — the host, back at centre, taps the middle card with the wand. It flips to '✕ Wrong'.

'zero.' (4800) — a '0' drops into the value slot with a dull thud_soft. A different texture from the teal chime.

REACTION: a mock 'no harm done' shrug (palms out, 10 frames).

'“I don't know”:' (4823) — he steps right (to x≈1320) and taps the third card. It flips with a neutral card_flick.

'also zero.' (4856–4874) — the Wrong '0' and the IDK '0' bounce together (1.08, 8 frames) with a linked double pop_tick, while 'Right +1' stays still. This shared bounce is the one beat that shows the two zeros are the same.

SECONDARY: on 'also', the 'illustrative quiz · 10 questions · 4 options each · expected scores' chip slides up under the cards. It is 30 px in WIDE (y≈305–339) and stays to the end of the scene (chip_pop −6 dB).

NEXT DEVELOPMENT: on 'zero.' the host walks back to centre and opens an arm to the wings. The honest contestant's podium starts rolling in from frame left under 'zero.' (from about 4864), so 'Two contestants' lands on motion already underway.

SOUND: card_flick ×2, thud_soft, pop_tick ×2, chip_pop. Caster rumble has no SFX kind, so either use machine_hum (about 0.8 s, −12 dB) or leave it to the stop clunks.
## S6.5 2:39.5-2:42.6 (V1 f4784-4877) | Two contestants. Both know six answers.
  - [high/disconnected_or_floating] The contestants are not behind their podiums: the podiums are offset 150 px and sunk to shoe level, because the code's left/top override the component's −150/−230 origin. The scoreboards and strips float on the curtain with no backing. The strips read as one 20-slot row whose middle belongs visually to the host.
  - [high/timing_vs_narration] `at('s22','Six')` matches the first 'six' ('know six answers', f4838). The honest board shows 6 at f4840 with five ✓ tiles and no blanks yet, and the V1 'Honest: 6' tock follows the bug. The guesser, who also has six right, stays at '–'.
  - [high/motion_quality] f4783: both contestants and both scoreboards appear in one frame at full size, mid camera move. Only the podiums spring. The ✓ tiles fill with no buzzer press, and the scores never count up.
  - [medium/offscreen_or_cropped] The podium bases are cut by the frame bottom in WIDE. The buzzer circle (y≈1039–1071) sits 8 px above the edge on the podium front, where no hand can reach it. The props look half-entered.
  - [low/overlap_or_clipping] Each podium lid is drawn over its contestant's right shoe (f4790: honest at x≈575–620, guesser at x≈1375–1400).
  viewer_should_look_at: Two contestants arriving, then six correct answers each, with their scores counting up together.
  what_it_should_communicate: Both contestants have identical knowledge: the same six right answers and the same score.
  what_actually_happens: The camera pulls back RULES→WIDE (f4776–4792) while the podiums spring-scale up from their bases (pop at f4782). The contestants, the ink '–' scoreboards and the tile strips appear at full size on f4783, while the camera is still moving (they are gated by podiumT > 0, with no animation of their own).

The podiums sit 150 px right of their contestants: the HONEST podium is at x≈575–860 while the honest contestant is at x≈450–670; GUESSER is at x≈1375–1660 while the guesser is at x≈1250–1470. The lids are at shoe height (y≈858–882) and hide each contestant's right shoe. The bases are cut by the frame bottom, and the coral buzzer circle is drawn on the podium front about 8 px above the edge.

The scoreboards float on the curtain at x≈195–315 and 1605–1725, y≈585–680. Two strips of ten 66 px tiles float at y≈310–376 with a 70 px gap. The inner ends (honest Q9–Q10 at x≈850–924, guesser Q1 at x≈994–1060) hang directly over the host's head (x≈905–1015).

On 'Both' (f4825–4850) six ✓ tiles fill both strips in lockstep, 3 frames apart, with no action by anyone. BUG: on 'six' (f4838) the honest board switches to '6' while only five ✓ tiles exist (f4840). The guesser's board stays '–'. The host is frozen at centre.
  V2 DIRECTION: SETUP: WIDE z1.0, locked. The marks are empty and the two answer boards already hang at the frame sides.

ACTION: 'Two contestants.' (4883–4915) — the podiums roll in from the wings with the contestants standing behind them (honest from the left, guesser from the right). They decelerate with a 2–3% overshoot and stop at 4906 and 4910 (machine_clunk ×2). Podium geometry (see scene_problems): centred on the contestant, lid at waist height (y≈725), base y≈930, front carrying the nameplate (≥44 px) and a RollingNumber window reading '0' (digits ≥96 px), with a buzzer dome on the lid under the contestant's hand.

REACTION (in the 34-frame gap before 'Both'): the honest contestant gives a small polite wave; the guesser does a grin and a finger-gun. The host steps half a pace upstage and gestures between them.

'Both know six answers.' (4924–4975) — both contestants hit their buzzers SIMULTANEOUSLY six times, about 8 frames apart, from 4927: strike() with a 3-frame wind-up, reach() hand on the dome, a 2 px podium jolt. Each hit ticks the next slot ✓ on both boards and rolls both RollingNumbers +1. Both land on 6 together on 'answers.' (about 4967). Mirrored timing and poses make 'same knowledge' readable with the sound off. Alternating hits would make them look different.

NEXT DEVELOPMENT: Q7 glows '?' on both boards (4975).

SOUND: machine_clunk ×2, pop_tick ×6 (buzzer hits), score_flip ×6 at −8 dB, one ding_right on the sixth.
## S6.6 2:42.6-2:45.8 (V1 f4878-4975) | The honest one leaves the other four blank. Six points.
  - [high/static_hold] Two still runs, 1.7 s and 1.77 s, cover almost the whole 3.3 s sentence. The camera, the characters and the boards are all frozen.
  - [high/timing_vs_narration] 'Six points.' (f4943) is dead, because the score already read 6 at f4838 (the cue-collision bug).
  - [medium/unclear_when_muted] The honest contestant never shows a decision (no hand off the buzzer, no head shake). The '—' blanks are nearly identical to empty slots at phone size, so 'abstained' reads as 'nothing happened'.
  - [medium/other] No character reacts: the honest contestant shows no 'I don't know', the guesser shows no impatience, the host shows nothing.
  viewer_should_look_at: The honest contestant visibly declining the four questions he doesn't know, then his score locking at 6.
  what_it_should_communicate: Abstaining is the honest choice. It scores 0 on those questions, and he finishes on 6.
  what_actually_happens: A still f4851–4901 (1.7 s) runs across 'six answers. The honest one leaves the other'; nothing reacts to 'The honest one'.

Four grey '—' tiles fade in over f4911–4933, 4 frames apart, with the same scale-up and the same [EL tile] sound as the ✓ tiles. A blank '—' tile (cream fill, grey border, small grey dash) looks almost the same as the guesser's still-unanswered cream slots next to it (f4920, f4980).

Then a still f4924–4976 (1.77 s) across 'four blank. Six points. The guesser'. 'Six points.' gets nothing, because the 6 appeared 3.5 s earlier. The honest contestant's face and pose haven't changed since f4783.
  V2 DIRECTION: CAMERA: WIDE locked. Steer attention with light: on 'The honest one' (4984) the guesser's spot dims to about 60%. A push would crop the other contestant's board (see scene_problems camera_hurts).

ACTION: Q7 on the honest board glows '?'. He lifts both hands off the lid (4990) and gives a small double head shake (4994–5008). On 'one' (about 4996) a small 'I don't know' bubble pops near his head (x≈600–860, y≈360–440, clear of the host and the guard-rail chip; the Bubble prop is imported but unused in V1). It stays until 'blank.'.

'leaves the other four blank.' (5001–5045) — Q7–Q10 close one by one with grey hatched shutters marked '—' (5005, 5011, 5017, 5023; thud_soft ×4 at −6 dB, pitch stepping down). The shutter must look clearly different from both ✓ and an empty slot.

SECONDARY: in the dimmed spot, the guesser's finger hovers twitchily over his buzzer and his eyebrows go up. His brows are ink on light skin, so they read.

'Six points.' (5054) — the honest score window latches: a tab slides across it, it glows teal, and he nods once (machine_clunk at −8 dB + a soft ding_right). Both windows now read 6 | 6.

NEXT DEVELOPMENT: the guesser cocks his buzzer hand back (about 5070). On 'The guesser' (5088) the spots swap: guesser 100%, honest 60%.
## S6.7 2:45.9-2:50.5 (V1 f4976-5116) | The guesser takes a shot at all four. Four options each, so on average,
  - [high/character_cut] The honest contestant is sliced vertically at the left frame edge for 10.7 s (f4992–5312), including his reaction to the trophy.
  - [high/offscreen_or_cropped] The honest '6' is off-frame from f4992 to f5312, through 'Seven points' and 'Somehow, a trophy'. The 'Right +1' card is cut at x=0. The podiums show only as lid strips at the bottom edge.
  - [high/camera_hurts] The push isolates the guesser but destroys the comparison the narration is building. It is also badly centred: it wastes about 390 px of empty curtain on the right while slicing the honest contestant on the left, and it gives the idle host more screen than the honest contestant.
  - [medium/motion_quality] The 10 Hz letter flicker on four 66 px tiles reads as a glitch: no spin-up, no deceleration, no landing on a chosen letter. Because it is the only motion for 3.1 s (f5025–5117), the motion metric misses this dead stretch.
  - [medium/unclear_when_muted] There is no 'choice' step (buzzer press, picked letter) and no picture of 'four options' or '1 in 4'.
  viewer_should_look_at: The guesser firing off four guesses, and the four options per question.
  what_it_should_communicate: The guesser answers everything he doesn't know, and each guess is a 1-in-4 pick.
  what_actually_happens: The camera pushes to GUESS (cx1300 cy460 z1.25) over f4976–4992.

In this frame:
- The honest contestant is cut in half by the left edge; only his right eye, cheek and arm show (x 0–180).
- His '6' scoreboard and his first four tiles are off-frame, and his fifth tile is sliced.
- The 'Right' card is cut at x=0 (its ✓ glyph cropped).
- Both podiums are reduced to lid strips at y≈1040–1080.
- The idle host fills the left centre (x≈410–730).
- Screen x≈1530–1920 (world x≥1760) is empty curtain.
- The host's and guesser's feet sit about 30 px from the frame bottom.

From 'all four.' (f5025; `at('s23','Four')` matches 'four.' first) tiles 7–10 flicker A/B/C/D at 10 Hz (frame/3) for 3.1 s. The guesser holds a look-up pose with an 'o' mouth and one arm bent up. There is no buzzer press, no letter is chosen, and nothing slows down. 'Four options each' gets no visual of its own.
  V2 DIRECTION: CAMERA: WIDE locked. Both scores must stay visible because the 7–6 comparison is coming. Attention comes from the guesser's spot at 100% and the honest's at 60%.

ACTION: 'takes a shot at all four.' — the guesser slams his buzzer four times, landing on 'takes' (5099), 'shot' (5109), 'all' (5123) and 'four.' (5130). Each slam: strike() with a 4-frame arm-up, the hand on the dome, a 2 px podium shudder. Each slam sets the next of Q7–Q10 spinning (reel blur, prob_tick rattle).

'Four options each,' (5154–5185) — the Q7 reel pops forward to about 1.6× (staying inside the frame) and fans out four option chips, A B C D (letters ≥44 px on screen), for about 20 frames, then snaps back. On 'each,' (5176) the guard-rail chip lands on the stage apron: two lines, ≥30 px, ≥40 px above the frame bottom, crossing no bodies or podiums. Line 1: '1 in 4 per guess · one correct guess is the average outcome,'. Line 2: 'shown here for the demonstration'.

'so on average,' (5189–5215) — the reels decelerate with slot-machine ease-out (prob_tick slowing). Resolve LEFT TO RIGHT, so the failures come first and the lucky one is last. Make Q10 the lucky slot instead of V1's Q7. Q7, Q8 and Q9 stop on a letter and are judged ✕ at about 5192, 5202 and 5212: coral flash, a 6 px tile shake, and buzzer_wrong at pitch 1.0, 0.94 and 0.88. The guesser's wince escalates: grin, then grimace, then eyes squeezed with shoulders up.

SECONDARY: the host leans toward the last reel. The honest contestant watches politely and blinks.

NEXT DEVELOPMENT: Q10 crawls click by click into 'one lands.'.
## S6.8 2:50.6-2:52.9 (V1 f5117-5188) | one lands. Seven points.
  - [high/other] The brief's 'deliberately excessive little celebration after the failures' is missing. The lucky tile resolves first and looks like the wrong ones resolving; the only celebration is the arms-up on 'Seven'.
  - [high/unclear_when_muted] Right and wrong look and sound the same (identical scale-up and identical [EL tile] sound). On a phone the lucky ✓ differs from the six known ✓ tiles only by a dashed border.
  - [high/offscreen_or_cropped] The honest '6' is off-frame while 'Seven points' is spoken, so the 7–6 comparison is never visible.
  - [medium/motion_quality] The board jumps '–'→7 without ever showing the guesser's 6, so there is no mechanical 6→7 roll. The arms-up is then frozen for about 5.5 s (f5154–5318).
  - [medium/overlap_or_clipping] The bottom chip is screen-space, outside the Camera, and runs across the host's and the guesser's legs at y≈996–1020 (f5120–5310).
  viewer_should_look_at: The one lucky ✓, the excessive celebration, then 7 vs 6 on the two scoreboards.
  what_it_should_communicate: One guess happened to be right, so the guesser outscores the honest contestant 7–6.
  what_actually_happens: On 'lands.' the four tiles start resolving at f5117, 5121, 5125 and 5129, and all are done by f5139 (0.73 s). The lucky tile (Q7, a ✓ with a dashed border) goes FIRST, then three ✕. All four use the same 10-frame scale-up and the same [EL tile] sound.

The guesser drops his guessing pose over f5113–5123, before 'lands.' even finishes. He stands in a neutral idle grin f5123–5144, so he shows no reaction to his three wrong answers (f5130).

The screen-space chip '1 in 4 per guess · one correct guess is the average outcome, shown here for the demonstration' (22 px, about 1060 px wide) fades in at y≈996–1020. It crosses the host's shins and the guesser's ankles.

On 'Seven' (f5144) the guesser board swaps '–'→'7' (coral) in one frame with an 8% pulse. He blends to arms-up over 10 frames and then freezes (still f5157–5187; the pose holds until f5318). The honest '6' is off-frame, so 7 and 6 are never seen together.
  V2 DIRECTION: ACTION: 'lands.' (5229) — the Q10 reel stops on its letter and turns ✓. It gets a gold rim and a glow so it can never be confused with the known ✓ tiles on a phone (ding_right +3 dB).

THE EXCESSIVE CELEBRATION fills the pause before 'Seven' (about 5232–5258):
- two party poppers fire from the guesser's podium lid (pieces ≥24 px);
- the side spots swing once;
- the guesser crouches (4 frames), leaps (hop −40 px) and lands with a squash, arms up;
- sound: fanfare_small + paper_flap ×2 + a short crowd_cheer + thud_soft on the landing.

'Seven points.' (5260) — the guesser's RollingNumber rolls 6→7 (score_flip) and flashes coral. The camera is already WIDE, so '6 | 7' sit side by side as the digit lands. Never move the camera while the 7 lands.

REACTION: the honest contestant looks at the 7, then at camera, with a slow blink. The host claps twice, flatly. There is no clap SFX kind, so keep the claps silent or use pop_tick at −10 dB.

SECONDARY: the confetti falls and comes to rest on the stage and podiums. No opacity fade for physical pieces.

NEXT DEVELOPMENT: through the s23→s24 gap (5284–5303) the guesser bows and blows two kisses. Keep pose arcs keyframed (kf), not straight mixPose lines, so the arms never pass through a T-pose.
## S6.9 2:53.0-2:57.6 (V1 f5189-5327) | One lucky guess. Three wrong answers. Somehow, a trophy.
  - [high/timing_vs_narration] From f5187 the dimmed 'Somehow, a trophy.' is readable before 'Somehow' (f5268) is spoken. This spoils one of the best comedy beats in the film and breaks V2's no-ghost-pre-reveal rule.
  - [high/overlap_or_clipping] The screen-space headline sits on top of the rule-card row: card edges show and 'Right' pokes out at its left (f5200, f5290). The bottom chip runs across the trophy's base (f5300).
  - [medium/other] The host's deadpan cannot read: his mouth and brows are ink on black (f5230 vs f5300, only the pupils shift). The visual punctuation of the joke is missing.
  - [medium/competing_attention] f5286–5296: trophy pop (bottom right), confetti burst (above the guesser), the honest contestant's reaction (left edge) and the coral clause (top) all happen at once, in four corners of the frame.
  - [medium/character_cut] The honest contestant's reaction to the trophy plays on a face sliced by the left edge (x 0–115).
  - [medium/camera_hurts] The WIDE pull-back (f5312–5328) uses up the whole pause after 'trophy.', moving the frame exactly when the joke needs a held tableau.
  - [medium/motion_quality] The trophy scales up from 0 with no drop, impact or settle. The confetti has no source, is tiny and dissolves in mid-air. The arms-up blends out through a T-pose (f5318–5332, peak f5330) that nearly touches the host's fist.
  viewer_should_look_at: In order: the lucky tile, the three wrong tiles, the trophy landing on the guesser, the honest contestant's flat look.
  what_it_should_communicate: The comedy beat: a mostly wrong guesser gets rewarded.
  what_actually_happens: The headline (a 56 px Headline in a cream banner, screen-space top:60) fades in at f5187 with the WHOLE sentence. 'Three wrong answers.' and the coral 'Somehow, a trophy.' are already clearly legible at 30% opacity (f5200), and each part brightens on its word.

The banner sits over the rule-card row: card edges show below it, and the 'Right' card pokes out at its left (f5200–5310). The tiles being described get no emphasis. Still f5195–5218.

The host's 'deadpan' (f5264–5332) is effectively invisible. His mouth is drawn in ink on a near-black beard and his brows in ink on near-black hair, so only his pupils move (compare f5230 and f5300).

At f5286 four regions change at once:
- the trophy spring-scales up from 0 on the guesser's shoe-height podium lid, knee-high beside him, its base hidden behind the bottom chip (f5300);
- 14×9 px confetti bursts out of empty air above the guesser's head (f5288–5338) and fades out by opacity in mid-air;
- the honest contestant's flat look plays on his half-cropped face at the left edge;
- the coral clause above is fully lit.

The guesser's arms-up stays frozen. The pause after 'trophy.' is only 15 frames in V1 (f5313–5328), and the GUESS→WIDE pull-back (f5312–5328) fills all of it.

As the guesser's arms-up blends back to idle (f5318–5332), the linear mixPose swings both arms out horizontally. At f5330 he is in a T-pose: his left fist is about 30 px from the host's raised fist and his right fist reaches the '7' board.
  V2 DIRECTION: CAMERA: WIDE z1.0, locked for the whole joke. Use one camKick (1.5%) on the trophy impact only.

SETUP: 'One lucky guess.' (5303–5335) — a caption banner (cream, ink border, 56 px text) drops on two cables IN FRONT of the rule-card row. It covers the row completely, with ≥10 px overhang on every side, and stays ≥10 px clear of the title plate above and the 'illustrative quiz' chip below. The guard rail stays visible; do not fly the rules board out. The banner shows ONLY 'One lucky guess.'. Q10 lifts 8 px and glints.

'Three wrong answers.' (5344–5385) — the second clause flips onto the banner (card_flick). Q7–Q9 buzz-shake in unison (one short buzzer_wrong at −10 dB). The guesser's grin freezes for 6 frames, then resumes.

'Somehow,' (5392) — the coral third clause appears. The music drops to a single held note. The host turns his head 15° to camera, eyes to lens, with a slow blink. This body-led deadpan works even though his mouth and brows don't read. Let the 22-frame pause before 'a' play as dead air.

'a trophy.' (5414–5433) — the trophy drops from the flies on a cable onto the guesser's lid at x≈1300, in front of his torso. A 3-frame hang, impact at about 5421 (12% squash, 3 px podium jolt), one bounce, settled by 5433. Sound: trophy_clink + fanfare_small + crowd_cheer, and a confetti cannon from the flies (paper_flap). Music returns.

REACTION: the guesser hugs the trophy, with both hands on its handles via reach(). The honest contestant, fully in frame, blinks slowly with a flat mouth.

PAUSE (5433–5459, 0.87 s): an intentional quiet hold with only secondary life. The confetti settles. The guesser polishes the trophy with his sleeve in a small loop. The host holds his look to camera. The honest contestant's eyes slide to camera. No camera move.
## S6.10 2:57.6-3:02.7 (V1 f5328-5482) | Now change one rule. A wrong answer costs a point. The honest one:
  - [high/static_hold] A 2.0 s still on 'Now change one rule. A wrong answer costs' (f5342–5401). Nothing happens on 'change one rule', and there is no sound.
  - [medium/motion_quality] The flip is a 0.5 s squash of one 340 px card: no hand, wind-up or slam, and no response from the board.
  - [medium/unclear_when_muted] Nothing links the new rule to its victims. The ✕ tiles, the guesser's score and the guesser himself don't react until 'minus' (f5593), 6 s later.
  - [low/overlap_or_clipping] f5326–5334: the fading screen-space headline ghosts over the rule cards. At f5334 the '1 in 4' chip pops off in one frame.
  - [medium/other] No character reacts to the rule change. The guesser keeps grinning, the honest contestant keeps a frozen flat face, and the host keeps his fist up.
  viewer_should_look_at: The Wrong card changing from 0 to −1, and the guesser's three ✕ tiles becoming a liability.
  what_it_should_communicate: One rule changes: wrong answers now cost a point.
  what_actually_happens: The camera settles on WIDE at f5328. The headline fades out over f5326–5334, so at f5330 a 25% ghost of it is double-exposed over the rule cards. The bottom '1 in 4' chip vanishes in a single frame at f5334, while it still crosses both nameplates.

During 'Now change one rule. A wrong answer' (f5342–5401, a 2.0 s still) the only change is the Wrong card scaling to 1.06 (f5338–5346), which is barely visible.

On 'costs' (f5407–5423) the Wrong card flips on rotateX in 16 frames, with no hand, anticipation or impact, to a coral-bordered '−1'. Nothing else responds. The guesser's ✕ tiles, the guesser and the trophy stay unchanged. The guesser's idle grin runs from f5332 to f5593 (8.7 s), and the honest contestant's flat 'hmm' has been frozen since f5296.

Then a still f5443–5480 (1.27 s) over 'point. The honest one:'.
  V2 DIRECTION: CAMERA: WIDE locked. A push to the board would crop the side answer boards, and the action reads at WIDE.

SETUP: 'Now change one rule.' (5459–5500) — the caption banner lifts out on its cables (hanger_click), revealing the rule cards again. The '1 in 4' apron chip slides down behind the apron edge instead of popping off. The host walks under the Wrong card (x≈960) and readies the wand.

PHYSICAL NOTE: the cards hang about 180 px above his head, so 'grips the card' is impossible. Use the same wand as s21, but bigger.

ACTION: 'A wrong answer costs a point.' — on 'costs' (5531) he winds up (6 frames) and whacks the Wrong card with the wand. The card spins 1.5 turns on its hook and slams face-out showing '−1' in coral: 6% card squash, a 4 px board jolt, and the cables ring() and settle (paper_slap + indicator_no, a low 'dun'). camKick 1%.

REACTION: 'a point.' (5548) — the guesser's three ✕ tiles flash coral in sync, because they now cost. His grin drops, his eyes dart to the tiles, and a sweat drop pops on the trophy. The honest contestant is unbothered.

SECONDARY: the card's cable is still swinging, and the host twirls the wand once.

NEXT DEVELOPMENT: 'The honest one:' (5572) — his spot goes to 100% and the guesser's dims to 60%.
## S6.11 3:02.8-3:08.4 (V1 f5483-5651) | still six. The guesser: six, plus one, minus three. Four.
  - [high/static_hold] A 2.73 s still (f5485–5566) through 'still six. The guesser: six, plus one', then another 0.87 s (f5568–5593). 'still six' has no visual.
  - [high/phone_readability] The equation '6 + 1 − 1 − 1 − 1 = 4' is 30 px mono (about 10 px on a phone), and so are the '+1/−1' deltas. The scene's arithmetic payoff is far below the 44 px critical-text minimum.
  - [medium/timing_vs_narration] The equation box ('6') appears on the honest line 'still six' (f5483), on the guesser's side of the frame, which sends the eye the wrong way.
  - [medium/overlap_or_clipping] The right-anchored box grows left until it touches the guesser's hair (f5640). Its right edge is 60 px from the frame edge, and its contents shift with every new term.
  - [medium/motion_quality] The score swaps 7→4 in one frame, with no mechanical 7→6→5→4 and no landing on 'Four.'.
  viewer_should_look_at: The honest 6 staying put, then the guesser's score recomputed live: 6 + 1 − 3 = 4.
  what_it_should_communicate: Under the new rule the honest contestant wins 6–4, and the arithmetic is visible and tied to the tiles.
  what_actually_happens: On 'still' a 55 px ink box containing '6' (30 px mono) fades in at the far right edge (x≈1805–1860, y≈505–560). It is the guesser's equation, but it appears during the honest line. The honest contestant and his scoreboard do nothing.

Still run f5485–5566 (2.73 s, the scene's longest) across 'one: still six. The guesser: six, plus one,'.

On 'plus' (f5566), ' + 1' is appended and a 30 px '+1' rises over the lucky tile. Both are so small they don't even break the still run f5568–5593.

On 'minus' three ' − 1' terms are appended (f5595, 5600, 5605), with a 30 px '−1' over each ✕ tile. The box is right-anchored, so it grows leftward: the '6' slides left with every term, and the box's left edge ends against the right side of the guesser's hair (x≈1446, f5640).

The guesser blends to a slump and frown from f5593. On 'Four.' (f5628) ' = 4' appears, and the scoreboard swaps 7→4 in one frame, coral→ink, with an 8% pulse.
  V2 DIRECTION: CAMERA: WIDE locked, so both score windows are always in frame. Attention comes from the spots.

'The honest one: still six.' (5572–5630) — his four '—' shutters flash '0' in turn (pop_tick ×4, soft, 4 frames apart): no penalty for abstaining. His score window does a steady 1.05 bounce, and he gives a small smile and a thumbs-up.

'The guesser:' (5641) — the spots swap (guesser 100%, honest 60%).

'six,' (5672) — his six ✓ glow together (glint). The equation strip, directly under his answer board (y≈662–722, x≈1480–1860, ≥44 px mono, left-anchored so it grows rightward, ≥60 px from the frame edge and clear of his head and the trophy), writes '6' (chip_pop). His window stays at 7, because it already IS 6 + 1. Don't roll it back and forth.

'plus one,' (5693–5715) — Q10 pulses gold, and a '+1' chip hops from it into the strip: '6 + 1'.

'minus three.' (5720–5745) — the three ✕ tiles fire '−1' chips (≥44 px) at 5722, 5728 and 5734. They fly into his score window: 7→6 and 6→5 (score_flip, descending pitch). The THIRD chip hangs over the window, wobbling, through the voice's pause (5740–5755). The strip reads '6 + 1 − 3', matching the narration's 'minus three'.

'Four.' (5756) — the last chip drops in: 5→4 with a heavy clunk (score_flip at low pitch + thud_soft). '= 4' lands in saffron, and the window drains from coral to ink (crowd_aww).

REACTION: the guesser deflates: a 6° lean, shoulders drop, a settle.

SECONDARY: the trophy sweats and shuffles 10 px toward the edge of the lid.

NEXT DEVELOPMENT: the trophy side-eyes the honest podium (about 5768).
## S6.12 3:08.4-3:10.1 (V1 f5652-5704) | The trophy walks back.
  - [high/timing_vs_narration] The punchline gets no landing or hold: the trophy arrives at f5690 and the wipe begins at f5692. The honest contestant's win reaction is visible for about 0.3 s.
  - [high/overlap_or_clipping] The trophy walks at the same depth as everyone's feet, so it passes through the host (f5670) and the honest contestant (f5680) and ends overlapping his hand (f5690). The takeaway chip covers the HONEST nameplate (f5660–5690).
  - [high/phone_readability] The takeaway is a 26 px chip (about 9 px on a phone), on screen for about 1.3 s before the wipe.
  - [medium/motion_quality] A fast slide with 16×7 px stepping feet: no hop off, no landing, no settle. It ends on the floor, not on a podium.
  - [medium/weak_transition] The S7 wipe direction erases the payoff (the honest contestant and the trophy, on the left) first and leaves the loser's side and the arithmetic box visible last. The transition whoosh masks the trophy's arrival.
  viewer_should_look_at: The trophy relocating from the guesser to the honest contestant, then the takeaway line.
  what_it_should_communicate: With fair grading the reward goes to the honest player: 'Same knowledge. One rule changed. Bluffing stops paying.'
  what_actually_happens: Feet fade on at f5646. The trophy slides 1130 px from x≈1520 to x≈390 in 38 frames (easeInOut, about 890 px/s), at the same baseline as everyone's feet (y≈876).

On the way it is drawn in front of the host's legs and torso (f5670) and then across the honest contestant's legs (f5680). It stops on the floor to the left of the honest contestant, not on his podium, with its handle overlapping his hand (f5690).

The honest grin ramps in over f5680–5690. The takeaway chip 'Same knowledge. One rule changed. Bluffing stops paying.' (26 px, screen-space) fades in at f5652 at y≈985–1025, covering the bottom of the HONEST nameplate.

The V1 S7 [EL whoosh] fires at f5685, on top of the 7th trophy footstep (f5684), before the trophy arrives. S7 is mounted at f5692 and wipes in from the LEFT edge, so the honest contestant and the trophy are erased first. The last S6 pixels are the guesser, his '4' and the arithmetic box (f5700).
  V2 DIRECTION: TIMING CONSTRAINT (V2): 'back.' ends at about 5830, S6 ends at 5843, and the 10-frame wipe runs 5838–5848. That leaves about 13 frames of payoff. Ask the lead, who owns timeline.json and Main.tsx, for +30–36 frames of tail after s25 ('S6 holds its resolved payoff' per V2_DIRECTION).

CAMERA: WIDE locked. No move during the walk.

ACTION (pre-lap into the 0.8 s pause after 'Four.'):
- About 5768: the trophy sprouts feet (pop_tick, a 'boing') and leans 6° away from the guesser.
- 5774–5782: it hops off the lid onto the stage apron in front of the podiums, with a squash on landing. Its baseline is y≈935, below everyone's feet, with a contact shadow, so it clearly passes IN FRONT of the host instead of through him.
- 'The trophy walks' (5782–5812): 7–8 waddle steps toward the honest podium (trophy_steps, dur 1.0 s), with a ±6 px body bob and a 4° forward lean.
- 'back.' (5816): it hops up about 200 px onto the honest lid at x≈640, in front of his torso, and lands about 5824 with a squash, a bounce and a settle (trophy_clink + glint).

REACTION (5824–5838): the honest contestant gives a small arms-up, then a hand on the trophy via reach(). The guesser slumps with one hand reaching after it. The host turns his head to camera.

SECONDARY: the sweat drop flicks off the trophy, and the spots re-centre on the honest contestant.

TAKEAWAY: 'Same knowledge. One rule changed. Bluffing stops paying.' at ≥44 px, on the caption-banner rig in front of the card row. It covers no nameplate and holds ≥1.5 s.
- With the extension: drop it after the trophy lands (about 5832).
- Without it: drop it on 'Four.' + 8 (about 5764, hanger_click). Start the trophy's feet only after the banner settles (about 5776), and keep the banner static during the walk.

TRANSITION: ask the lead for S7's wipe dir 'left' (reveal from the right), so the trophy on the honest podium is the last thing on screen. No whoosh. Keep everyone breathing and the confetti settling through 5848.

## SCENE PROBLEMS
  - static_hold high 47.5% of the scene (22.2 of 46.8 s) is still: 15 runs of ≥0.8 s, and every narration beat ends in a freeze. f5025–5117 (3.1 s) is also dead: the only change is the 10 Hz letter flicker on four 66 px tiles, so the metric under-reports.

Each run, and what should develop during it (V2 cue frames):
1–2. f4367–4401 + f4403–4432 'Why not just say “I don't know”? The researchers argue': a live shrug (shoulder bounce on 'know' 4507, head-tilt drift, blink, eyes to the rig), then the point up on 'The researchers' (4529).
3. f4453–4510 'argue … how models get graded.': the plate drops on 'argue' (4549) with cable ring, the citation line clips on (4566), the host looks up and presents, and the card backs hook on at 'graded.' (4625).
4. f4563–4599 'a ten-question quiz. Right answer:': the answer boards drop in (4645–4672), 10 slots per board light 1→10 (4659–4690), and the host walks toward the Right card.
5. f4607–4651 'Right answer: one point. Wrong': the wand tap and flip on 'Right' (4707), '+1' on 'one point.' (4736).
6. f4673–4707 'zero. “I don't': '0' drops on 'zero.' (4800), the no-harm shrug, the walk to the third card.
7. f4716–4776 '“I don't know”: also zero. Two': the IDK flip (4823), both zeros bounce on 'also zero.' (4856), the guard-rail chip slides in, the podiums start rolling under 'zero.'.
8. f4851–4901 'six answers. The honest one leaves the other': both windows land on 6 (about 4967), Q7 '?', hands off the buzzer, head shake, the 'I don't know' bubble (about 4996).
9. f4924–4976 'four blank. Six points. The guesser': the last shutter thud (5023), the score latch and nod on 'Six points.' (5054), the guesser cocking his hand (5070).
10. f5157–5187 'Seven points. One lucky': the celebration (5232–5258), the 6→7 flip on 'Seven' (5260), the bow and kisses into s24.
11. f5195–5218 'One lucky guess.': the banner showing only that clause (5303), Q10 lifting and glinting.
12. f5342–5401 'Now change one rule. A wrong answer costs': the banner lifts out (5462), the host walks under the Wrong card and winds up.
13. f5443–5480 'point. The honest one:': the card slam settles with its cable ringing, the ✕ tiles flash coral, the trophy sweats, the light shifts (5572).
14. f5485–5566 (2.73 s, the longest) 'one: still six. The guesser: six, plus one,': the '—' shutters flash 0 and the honest score bounces (5608–5630), the light swaps, the six ✓ glow and the strip writes '6' (5672), the '+1' hop (5693).
15. f5568–5593 'six, plus one, minus': '6 + 1' reads, and the first −1 chip launches on 'minus' (5720).
  - static_hold high Character acting is frozen.
- HOST: raised right fist (armR a30 b120) from f4310 to f5704, except for the 2.7 s shrug (f4359–4441): about 44 s. His only other change, the deadpan (f5264–5332), is invisible.
- HONEST: a smile f4783–5286 (16.8 s), a flat 'hmm' f5296–5642 (11.5 s, through his own line 'The honest one: still six'), a grin from f5680.
- GUESSER:
  - idle grin f4783–5021;
  - 'o' look-up f5031–5113;
  - back to an idle grin f5123–5144, with no reaction to three wrong answers;
  - arms-up frozen f5154–5318;
  - idle grin f5332–5593 (8.7 s, through the rule change);
  - slump from f5593.
Poses change only through linear mixPose blends (the mouth swaps at mid-blend). There is no anticipation, follow-through or idle life beyond blinks.
  - disconnected_or_floating high V1 FAULTS: staging geometry is broken across the whole scene. `Podium style={{left: X, top: FLOOR_Y+20}}` overrides the component's −150/−230 origin, so:
- each podium sits 150 px right of its contestant, with its lid at shoe height (y≈858–882) covering his right shoe and its base cut by the frame bottom;
- the buzzer circle is drawn on the front 8 px above the frame edge, unreachable.
The scoreboards float at the far frame edges (x≈195–315 and 1605–1725), unlabeled and 1290 px apart. The two 10-tile strips (y 310–376, a 70 px gap) read as one 20-slot row whose middle hangs over the host's head. The trophy sits knee-high beside the guesser. Nobody touches anything.

V2 LAYOUT THAT FITS THE V2 SIZE RULES (checked in WIDE z1.0, world = screen). The 44 px card labels make the cards about 100 px tall, so the top band now needs y≈55–340. The answer strips can no longer hang above the heads (heads start at y≈460).
- Title plate (the s20 sign), y 55–160: 'HOW MODELS GET GRADED' at 44 px, plus 'the researchers' argument · Kalai et al. 2025' at 30 px.
- Rule cards: y 185–285, across x≈306–1614.
- 'illustrative quiz · 10 questions · 4 options each · expected scores': 30 px at y 305–339.
- Answer boards: one backed board per contestant, beside him and outside: 5×2 numbered slots of 60–64 px in the owner's colour. Honest x≈70–426, guesser x≈1494–1850, both y≈490–650. That is ≥24 px from his hand and ≥70 px from the frame edge.
- Podiums: centred on the contestants (x 560 and 1360) and drawn in front of them. Lid at waist height (y≈725), base y≈930. The front carries the nameplate (≥44 px) and a RollingNumber window (digits ≥96 px). A buzzer dome sits on the lid.
- Stage apron (y 930–1080): the '1 in 4' guard rail, two lines at ≥30 px.
- Equation strip: directly under the guesser's board (y≈662–722, x≈1480–1860, '6 + 1 − 3 = 4' at 44 px mono, about 345 px).
- Trophy: on the guesser's lid at x≈1300.
Every contact uses reach(). If overhead strips are kept instead, each needs its own backed board, ≥120 px apart, with the host never standing under the gap.
  - timing_vs_narration high `at()` returns the first match.
- 'Six' resolves to 'know six' (V1 f4838) instead of 'Six points' (f4943).
- 'Four' resolves to 'all four.' (f5025) instead of 'Four options' (f5049).
In V2, pass occurrence indexes: at('s22','Six',2) = 5054 and at('s23','Four',2) = 5154. Audit every repeated word: in s25, six ×2, one ×3 and The ×3.

Other V1 timing faults:
- the joke is ghost-pre-revealed at 30% (f5187);
- the equation box appears on the honest line (f5483);
- the trophy lands 2 frames before the wipe (f5690 vs f5692).

In V2 the tail after 'back.' is only about 13 frames (5830→5843), so the payoff needs the lead's extension or the fallback order given in S6.12.
  - offscreen_or_cropped high The scoreboards are not visible while their numbers matter. The honest '6' is off-frame f4992–5312 and still cut at f5320, so the brief's '7–6, trophy' is never seen as a pair. The guesser's board reads '–' while he has 6 correct and never shows 6. In the GUESS framing the 'Right' card is cut at x=0 and the podiums are reduced to lid strips.
  - camera_hurts high All three V1 framings show less than WIDE:
- HOST (z1.35): a lone figure in the unlit gap between the spotlight cones.
- RULES (cy330 z1.25): blank curtain before any card exists, with the host cut at the hips.
- GUESS (cx1300 z1.25): slices the honest contestant, hides his '6', and spends screen x≈1530–1920 on empty curtain.

The first pass's replacement pushes repeat the fault with V1 board positions:
- S6.6 z1.1/cx760 puts the guesser's board at screen x≈1890–2022;
- S6.7 z1.1/cx1170 puts the honest '6' at x≈−112–20;
- S6.11 cx800/cx1120 crops one board each;
- with V2 side boards, any push of ≥3% crops a board.

Both scores matter from 'Both know six answers' (V2 4924) to the end. So shoot the contest WIDE z1.0, locked, from 'Picture' (4665) to the end. Use the spots for attention and camKick (1–1.5%) only on the trophy impact (5421) and the Wrong-card whack (5531). The scene then needs exactly two camera moves: the push to z1.12/cy470 on 'The researchers' (4529–4547) and the ease back to WIDE on 'Picture' (4645–4665). Verify every framing with frameRect over the world rectangles.
  - other medium The host cannot act with his face. His mouth is drawn in ink on a near-black (#1E1A1A) beard and his brows in ink on near-black hair, so hostDeadpan's flat mouth and browAsym never show: between f5230 and f5300 only his pupils move. V2 directions that rely on his brows or mouth will not read. Carry his acting with head turns, eyes (the white sclera reads), slow blinks, hands and posture. Optionally, a scene-local Character copy (allowed by V2_DIRECTION §2) can draw his mouth line in a light tone without changing the look.
  - competing_attention medium The lighting points at the wrong things. The two spotlight cones (centred at about x480 and x1440 in WIDE) light empty curtain while the host stands in the darker V between them; f4317–4776 he is the only person on stage and the least-lit thing in frame.

At f5286–5296 four regions change at once: the trophy pop, the confetti, the honest contestant's half-cropped reaction and the coral clause.

In V2: a centre spot for the host (it is also the H56 iris pool), spots as the attention tool (dim the inactive contestant to about 60%), and the trophy beat sequenced as drop → impact → hug → blink, 6–10 frames apart.
  - overlap_or_clipping medium Screen-space overlays sit outside the Camera and collide with the world:
- the headline covers the card row, with edges peeking out (f5200–5320), and ghosts while fading (f5326–5334);
- the '1 in 4' chip crosses legs (f5120–5310), the trophy base (f5300) and both nameplates (f5330), then pops off in one frame (f5334);
- the takeaway covers the HONEST nameplate (f5652–5704).

In the world:
- the trophy passes through the host (f5670) and the honest contestant (f5680) at the same baseline as their feet;
- the equation box grows into the guesser's hair (f5640);
- the T-pose fist nearly touches the host's fist (f5330).

Put text on world objects (banner rig, apron, the strip under the board), and place anything screen-space with worldToScreen.
  - phone_readability medium V2 minimums: critical text ≥44 px on screen, guard rails ≥30 px.

V1 failures:
- rule-card labels: 28 px (34 px zoomed);
- rule values: 42 px in WIDE, just under;
- 'illustrative quiz …': 22–27 px;
- 'Kalai et al. 2025': about 29 px for about 0.9 s;
- '1 in 4 per guess …': 22 px, and about 1450 px wide at 30 px, so it needs two lines;
- equation and ±1 deltas: 30 px;
- takeaway: 26 px for 1.3 s;
- nameplates: 34 px;
- tile glyphs: 33 px. The lucky tile is marked only by a dashed border, and '—' is nearly identical to an empty slot.

Passing: scoreboards (77/96 px), headline (56 px), sign (57 px).
  - unclear_when_muted medium The brief's per-question rhythm (question → contestant → choice → result → scoreboard) never exists. Tiles just fill in: no buzzer, no chosen letter, no verdict. Right and wrong share one animation and one sound. Blanks look like empty slots. Scores swap values instead of counting. With the sound off, a viewer cannot tell that the honest contestant chose to abstain, or why the guesser's score drops.
  - motion_quality medium Everything enters with an opacity ramp, a scale-from-0 or a 16 px slide, and stops dead.
- The contestants and scoreboards appear in one frame (f4783) while the camera is still moving.
- The flicker never decelerates.
- The trophy scales up from 0, later slides 1130 px in 38 frames.
- The rule flip has no hand.
- The confetti has no source and fades out in mid-air.
- Linear mixPose blends between extreme poses create a T-pose (f5318–5332).

Use drop, sp, impact, ring, hop, strike and kf from lib/motion.ts. V2_DIRECTION bans opacity fades on physical objects.
  - other medium SOUND. Correction to the first pass: V1 has some game-show sound:
- synth stingers at f5190 and 5230;
- an [EL fanfare] on the trophy (f5290);
- a synth on the rule flip (f5408);
- synth ±1 ticks;
- seven trophy footsteps (f5654–5684).

The faults are texture and sync:
- one [EL tile] for known, blank, lucky and wrong;
- one [EL tock] for rule cards, the 6 (fired early at f4840), the 7, the 4 and every footstep, so score-up and score-down sound identical;
- the confetti is an [EL slide] that starts on 'Somehow,' (f5267);
- 'Six points' and 'Now change one rule' are silent;
- no buzzer, wrong buzz, correct ding, trophy clink or room tone;
- the S7 whoosh (f5685) lands on the last footstep.

In V2 use buzzer_wrong, ding_right, score_flip, crowd_cheer, crowd_aww, fanfare_small, trophy_clink, trophy_steps and amb_gameshow.
  - weak_transition medium Both ends of the scene are generic 12-frame paper wipes. The exit starts 2 frames after the trophy stops and, revealing S7 from the left, erases the payoff first. V2_DIRECTION already locks S5→S6 as the lens→spotlight iris and S6→S7 as a 10-frame wipe. See transition_in and transition_out for what S6 must do at each end.

## TRANSITION IN
NOW (V1): S5 ends on the corkboard and the fact-checker ('A confident font is still just a font.', a 900 ms pause). S6 is mounted at f4289 and revealed by the standard 12-frame paper wipe (f4289–4301), appearing from the right edge, with a generic [EL whoosh] at f4282 (V1 cue sheet). Behind the wipe the host is rising through the solid floor (f4295–4315), and the HOST zoom starts at f4301 on a lone figure in the unlit gap between two spotlight cones. There is no stage cue.

V2: already locked in V2_DIRECTION §9 and in Main.tsx TRANSITIONS: S6 = iris, 18 frames, from H56 = (960, 540), r0 130. S5 holds its magnifier lens centred on H56 for ≥9 frames. The iris (V2 f4386–4404, centred on the boundary at 4395) opens from that circle onto S6. S6's first frames must show a spotlight pool centred on (960, 540).

Make that pool the host's key light. In WIDE z1.0 it frames his head and chest. He is already standing on his centre mark inside it in a small bow, with the rest of the stage at about 40% light. On 'Now,' (4407) he snaps upright and the side spots clunk on. The first pass's curtain-swish and stride-in conflict with the locked iris, and with the 12 frames between the scene start and 'Now,'.

Keep S6 alive from f4386 (the iris overlap). Sound: no whoosh. amb_gameshow and a soft light hum rise under the iris, then machine_clunk ×2 (4409, 4413) as the house lights come up.

## TRANSITION OUT
NOW (V1): the trophy stops at f5690. S7 is mounted at f5692 and wipes in over 12 frames, revealing from the LEFT edge (Wipe dir 'right'). The V1 [EL whoosh] fires at f5685, on top of the 7th trophy footstep (f5684) and before the trophy arrives. Because S7 is revealed from the left, the honest contestant and the just-arrived trophy are erased first, and the last S6 pixels are the guesser, his '4' and the arithmetic box (f5700). The takeaway was readable for about 1.3 s, the honest grin for about 0.3 s.

V2 (locked: S7 = wipe, 10 frames, dir 'right'; 'S6 holds its resolved payoff'): the boundary is 5843 and the wipe runs 5838–5848. But 'back.' ends at about 5830, so only about 13 frames of payoff exist. Two requests for the lead, who owns the timeline and Main.tsx:
(a) +30–36 frames of tail after s25. 'Runtime may move slightly.' This lets the trophy land, the reactions play and the ≥44 px takeaway hold ≥1.5 s before the wipe.
(b) Set S7's wipe to dir 'left' (reveal from the right edge), so the trophy on the honest podium is the last thing on screen.

Without (a), use the fallback in S6.12: the takeaway banner lands on 'Four.' + 8, and the trophy walk pre-laps into the pause. Either way, keep everyone breathing and the confetti settling through 5848, since both sides of a wipe must stay alive.

The brief's 'scoreboard transforms toward the benchmark table' is still the stronger smart transition: the guesser's 10-slot board clears and rotates into S7's 10-row benchmark tally, which counts to 9/10. It is not in the current TRANSITIONS table, so propose it to the lead rather than building it inside S6.

Sound: no whoosh on the wipe. Start S7's room tone under it.

## SOUND MOMENTS
[
 "Bed: amb_gameshow from V2 f4386 (iris overlap) to the scene end (about 48.6 s), very low. Playful music that drops to a single held note on 'Somehow,' (5392) and comes back on the trophy impact (5421).",
 "V2 f4386–4404 iris from the S5 lens into the spotlight pool: a soft light-hum swell under amb_gameshow, no whoosh.",
 "4407–4413 'Now,': the host claps (no clap kind; leave it dry or use pop_tick −10 dB), then machine_clunk ×2 (4409, 4413) as the side spots snap on.",
 "4549 'argue': the title plate drops on cables. hanger_click on the catch (about 4565), a lighter hanger_click on the bounce.",
 "4566 'part of the answer': the citation line clips onto the plate (chip_pop).",
 "4625 'graded.': three card backs hook on (hanger_click ×3, 3 frames apart, pitch rising).",
 "4645–4672 'Picture': the two answer boards drop in on cables (hanger_click L, then R 4 frames later).",
 "4659–4690 'ten-question quiz.': 10 slots light on both boards (pop_tick ×10, rising pitch).",
 "4707 'Right': the wand tip taps the card and it flips (card_flick). 4736 'one point.': '+1' (ding_right −6 dB, teal chime).",
 "4766 'Wrong': card_flick. 4800 'zero.': the '0' drops (thud_soft, dull).",
 "4823 '“I don't know”': card_flick. 4856 'also zero.': the two zeros bounce together (pop_tick ×2, same pitch). The guard-rail chip slides in (chip_pop −6 dB).",
 "4864–4910 'zero. Two contestants.': the podiums roll in (no caster kind; machine_hum about 0.8 s at −12 dB, or nothing), then stop with machine_clunk ×2 (4906, 4910).",
 "4927–4967 'Both know six answers': six synchronized buzzer hits by both contestants (pop_tick ×6), RollingNumber steps (score_flip ×6 at −8 dB), one ding_right on the sixth.",
 "about 4996 'one': the 'I don't know' bubble (chip_pop).",
 "5005/5011/5017/5023 'leaves the other four blank.': four grey shutters close (thud_soft ×4 at −6 dB, pitch stepping down), a different texture from the ✓ ticks.",
 "5054 'Six points.': the honest score latch (machine_clunk −8 dB + a soft ding_right). Silent in V1.",
 "5099/5109/5123/5130 'takes … shot … all … four.': four guesser buzzer slams (pop_tick +4 dB with a podium rattle). The reels start spinning (prob_tick rapid).",
 "5154–5185 'Four options each,': A B C D option chips fan out (chip_pop ×4). 5176 'each,': the '1 in 4' guard rail lands on the apron (chip_pop −6 dB).",
 "5189–5229 'so on average,': the reels decelerate (prob_tick, slowing).",
 "5192/5202/5212: Q7, Q8 and Q9 are judged wrong (buzzer_wrong ×3 at pitch 1.0, 0.94, 0.88) with tile shakes.",
 "5229 'lands.': Q10 stops on ✓ (ding_right +3 dB, bright).",
 "5232–5258: the deliberately excessive celebration. Two poppers (paper_flap ×2), fanfare_small, a short crowd_cheer, thud_soft on the leap landing.",
 "5260 'Seven': the guesser's window rolls 6→7 (score_flip).",
 "5303 'One lucky guess.': the caption banner drops (hanger_click). Q10 lifts (glint).",
 "5344 'Three wrong answers.': the second clause flips on (card_flick). The ✕ tiles shake (one short buzzer_wrong at −10 dB).",
 "5392 'Somehow,': the music drops to one held note. Intentionally near-silent through the 22-frame pause.",
 "5421 'trophy.': the trophy hits the guesser's lid after its cable drop (trophy_clink + fanfare_small + crowd_cheer), with a confetti cannon (paper_flap) and camKick.",
 "5433–5459: the confetti settles (paper_flap −12 dB). The guesser polishes the trophy (silent).",
 "5462 'Now change one rule.': the banner lifts out (hanger_click). The '1 in 4' chip slides off the apron (no sound).",
 "5531 'costs': the wand whack and the card slam (paper_slap + indicator_no, a low 'dun'), with camKick 1%. Then the cable rattle settling (hanger_click −8 dB).",
 "5548 'a point.': the guesser's ✕ tiles flash coral (indicator_no −6 dB). The trophy sweat drop appears (pop_tick −12 dB).",
 "5608–5630 'still six.': four '0' flashes on the honest's shutters (pop_tick ×4, soft) and a steady score bounce (pop_tick).",
 "5672 'six,': the six ✓ glow (glint) and the strip writes '6' (chip_pop). 5693 'plus one,': the '+1' hop (pop_tick).",
 "5722/5728 'minus three.': two −1 chips hit the window, 7→6 and 6→5 (score_flip, descending pitch). The third chip hovers through the pause (no sound).",
 "5756 'Four.': the third chip lands, 5→4 (score_flip low + thud_soft), then crowd_aww as the window drains to ink.",
 "about 5764 (fallback order) or about 5832 (with the tail extension): the takeaway banner drops (hanger_click).",
 "about 5768: the trophy sprouts feet (pop_tick, a little boing). About 5774–5782: it hops down onto the apron (thud_soft −6 dB).",
 "5782–5812 'The trophy walks': trophy_steps (dur about 1.0 s), tiny metallic steps.",
 "5816–5824 'back.': it hops onto the honest lid and lands (trophy_clink + glint). The honest arms-up (optional short crowd_cheer at −8 dB).",
 "5838–5848 wipe to S7: no whoosh. Start S7's room tone under it."
]

## PHONE-CRITICAL TEXT
[
 "HOW MODELS GET GRADED (sign): 44 px font at about 1.30×, so about 57 px on screen, about 19 px on a phone. Size PASSES. Placement and duration FAIL: the top border is about 4 px from the frame top (f4520), it wraps as 'HOW MODELS GET / GRADED', and it is readable for about 0.9 s. V2: a permanent title plate ≥75 px below the frame top.",
 "'the researchers' argument · Kalai et al. 2025' (guard rail): 22 px world, about 29 px on screen, about 10 px on a phone, for about 0.9 s. FAILS the 30 px guard-rail minimum. V2: 30 px world as the plate's second line, on screen for the whole scene.",
 "Rule-card labels 'Right / Wrong / “I don't know”' (critical, named in the narration): 28 px world, so 28 px in WIDE and 34 px in RULES/GUESS, 9–11 px on a phone. FAIL (minimum 44 px). Values '+1 / 0 / 0' and the flipped '−1': 42 px in WIDE, 51 px zoomed. Marginal in WIDE; V2 ≥52 px.",
 "'illustrative quiz · 10 questions · 4 options each · expected scores' (guard rail): 22 px world, 22 px in WIDE and about 27 px zoomed, 7–9 px on a phone. FAILS. V2: ≥30 px, on screen from 'also zero.' to the end, never carried off with a moving board.",
 "Answer tiles: 66 px tiles with 33 px glyphs in WIDE (41 px in GUESS), about 11 px glyphs on a phone. ✓/✕/— are told apart mainly by colour. The lucky tile is marked only by a dashed border, which FAILS: on a phone it is identical to the known ✓ tiles. The '—' blank is nearly identical to an empty slot (f4920). V2: a distinct grey shutter, a gold rim and glow on the lucky tile, and motion cues (✕ shake).",
 "Guessing letters A/B/C/D: 33 px, cycling at 10 Hz. Unreadable by design. V2: the 'Four options each' fan at ≥44 px, and reels that land on a letter.",
 "Scoreboards '6 / 7 / 4': 96 px × 0.8 = 77 px in WIDE, 96 px in GUESS, 26–32 px on a phone. Size PASSES, but the honest '6' is OFF-FRAME f4992–5312 (still cut at f5320). V2: RollingNumber digits ≥96 px in the podium fronts, both always in frame.",
 "Podium nameplates HONEST / GUESSER (named by the narration): 34 px, about 11 px on a phone. Below 44 px. Off-frame in GUESS, cut by the frame bottom during the pull-back (f5320), crossed by the '1 in 4' chip (f5330) and covered by the takeaway (f5660–5690).",
 "'1 in 4 per guess · one correct guess is the average outcome, shown here for the demonstration' (guard rail): 22 px screen-space, about 1060 px wide, about 7 px on a phone, crossing legs and the trophy base. FAILS. At 30 px it would be about 1450 px wide, so V2 needs two lines on the stage apron, ≥40 px above the frame bottom.",
 "Headline 'One lucky guess. Three wrong answers. Somehow, a trophy.': 56 px, about 19 px on a phone. Size PASSES. It FAILS on the 30% ghost pre-reveal (f5187) and on overlapping the rule cards. V2: clause by clause, on a banner that fully covers the card row.",
 "Delta labels '+1 / −1' over the tiles: 30 px mono, about 10 px on a phone. FAIL (critical arithmetic). V2: ≥44 px chips that fly into the score window.",
 "Equation '6 + 1 − 1 − 1 − 1 = 4': 30 px mono in a 55 px box, about 10 px on a phone. FAILS for the scene's payoff arithmetic, and grows into the guesser's hair. V2: '6 + 1 − 3 = 4' at ≥44 px mono, left-anchored under his answer board, ≥60 px from the frame edge.",
 "Takeaway 'Same knowledge. One rule changed. Bluffing stops paying.': 26 px, about 9 px on a phone, on screen 1.3 s, covering the HONEST nameplate. FAILS. V2: ≥44 px on the banner rig, held ≥1.5 s before the wipe.",
 "Trophy numeral '1': 31 px. Decorative, can stay small."
]

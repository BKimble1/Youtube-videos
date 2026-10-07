# V1 shot review — S9 Verify (narration s29–s32), V1 frames 6659–7441 (3:41.97–4:08.03), 25.9 s

What the scene does for the story: S9 is where the episode stops diagnosing and hands the viewer the method. After S8's "None of it is a guarantee", it names the move ("The unglamorous move: check."), turns it into two repeatable questions (Does the source exist? Does it actually say this?), and runs that test on the same ChatGPT slip the video opened with. The source exists (Adam Kalai's 2001 Carnegie Mellon thesis), but the claim fails (wrong title, wrong year). The CLAIM FAILS stamp hands off to S10's "sounding right vs being right". The logic and content are right. The execution is the "illustrations moved around on a timeline" problem the brief describes.

The biggest execution problems:

(1) Dead time. The motion data marks 70.3% of the scene as still (18.2 of 25.9 s, 13 still runs, longest 3.1 s), and that understates it. Three of the unshaded gaps are just a 4-frame blink (f7019, f7129, f7239, exactly 110 frames apart). Two are holds just under the 0.8 s threshold (f6996–7019 over "by Adam Kalai", f7346–7369 over "exists."). Counting those, about 78% of the scene is frozen. All of s31 (13.7 s, the actual check) plays in one locked framing.

(2) Camera. There are only two framings. WIDE comes first, then one 18-frame push at "Take the" (f6905–6923) to an arbitrary centre (900, 600, zoom 1.15), held for 16.7 s. That framing pushes the board's top and right borders off-frame and leaves an 80 px teal strip at the left. The camera never moves toward the evidence (author, title, year).

(3) Nothing is physical, and the staging cannot support physical handling as built.
- The slip and the record spring in from nothing, and the ✓ and ✕ are one-frame colour swaps.
- The stamp is done by an off-screen arm entering from the left. Its coral sleeve matches the checker's coral cardigan, so it reads as his arm stretched across the whole frame from the wrong side, while his real arm stays out at screen-right. Props.tsx already has an unused `Stamper` ("held by the fact-checker") and Character supports `holdL`/`holdR`.
- The checker holds one pose for 26 s, standing in front of a rail with no desk surface.
- At scale 0.95 his hand can't reach above y≈470–560, so the first review's plan for him to pin the record and the slip high on the board is physically impossible. The evidence work has to happen at desk level.

(4) Evidence readability and the wrong source crop.
- The decisive text is 7–9 px on a phone: the author block, "May 16, 2001", the 2001 pill, the "GPT-4o · 9 May 2025" guard-rail label and the found chip.
- The slip's "2002" and the record's "2001" are about 900 px apart and never share a tight frame.
- The asset used (thesis_title_block.png) has no "Carnegie Mellon" on it at all. "at Carnegie Mellon?" is supported only by the chip, which runs behind the checker's head. public/img/thesis_titlepage_top.png already contains "Carnegie Mellon University".

(5) Cue and overlap bugs.
- `cItSays = at('s31','It')` matches the "it" in "Does it say" (f7089), not "It says" (f7218). The real title is boxed 4.3 s early and "It says…" gets no visual.
- The "what it actually says" box label is clipped invisible by Evidence's overflow:hidden.
- The honesty chip's "· exists ✓" is hidden behind the checker's head, and his hair overlaps the record's corner.
- The headline box touches Q1's top border.
- The verdict gets about 4 clean frames before the hand-out, camera pull-out and S10 wipe all overlap.

Corrections to the first review:
- The DESK framing crops the board's top and right edges, not its top-left corner.
- The headline is unmounted at f6921, not f6915; its opacity is already 0 at f6917.
- The record title's cap height is about 30 px (font-size equivalent about 44 px), not "40 px cap".
- Q2's fade starts inside "actually", not on "say".
- The checker's fixed gaze does happen to fall on the slip after f6923; it just never moves.
- Boxing "CMU-CS-01-132" on "Carnegie Mellon?" is not evidence a viewer can read. Use the "Carnegie Mellon University" line.
- The "it."→"So" gap in V1 is 0.6 s (f7427→7445), not 900 ms.
- In transition_out, a rightward follow-pan carries the checker to screen-left (matching S10), not "he exits right".
- Pinning things high on the board is beyond the checker's reach.

## S9.1 3:41.97-3:44.37 (V1 f6659-6731) | (tail of s28 "…a guarantee." f6631–6657, under the wipe) "Which leaves the unglamorous move:"
  - [high/static_hold] Still run f6666–6733 (2.27 s), spoken: "guarantee. Which leaves the unglamorous move: check." The scene's first impression is an empty board and an idle figure.
  - [high/blank_space] About 47% of the frame is empty cork (x≈125–1795, y≈72–624) and about 26% is empty floor (y≈800–1080). The only content is a 430 px-tall checker in the bottom-right corner (tiles f6670–f6730).
  - [medium/disconnected_or_floating] His arm points at empty teal wall to screen-right, away from everything, and holds that pose for all 26 s. The code comment says 'behind the desk', but DeskSet renders its children after the desk, so he stands in front of the rail. The set reads as wall + floor, with no desk surface for the slip to rest on later.
  - [medium/weak_transition] S8 just delivered the real thesis into the EVIDENCE CHECK booth (still visible at x≈1373–1920 in f6660), with three identical ChatGPT slips on screen. S9 wipes to an unrelated empty room, and the same record reappears from nothing at f6972. Nothing carries across.
  - [low/other] The 'pencil behind the ear' accessory is drawn across his right brow and glasses rim (f6670 and f7020 zooms), so it reads as stuck to his forehead. Small, but V2's pencil business needs it actually tucked behind the ear (draw it under the hair/ear).
  viewer_should_look_at: The checker at his workspace (the plain, human alternative to S8's machines), and the claim arriving on his desk.
  what_it_should_communicate: Retrieval, reasoning and lower randomness offered no guarantee, so what's left is a modest human habit. This shot sets up the checker, his desk and the board as the place where one specific claim is about to be tested.
  what_actually_happens: f6653–6665: a 12-frame hard-edged wipe (Main.tsx Wipe, dir 'right') reveals S9 left→right over S8. In f6660 the right ≈550 px (x≈1373–1920) is still S8, including the EVIDENCE CHECK booth holding the same thesis title page S9 'finds' 10 s later. S8's own fade (f6663–6671) is hidden under the wipe.

Then a locked WIDE camera (cx 960, cy 540, zoom 1). The corkboard (x≈125–1795, y≈72–624) is empty, and so is the floor (y≈800–1080). The checker stands full-figure at x≈1405–1680, y≈464–893, feet on the floor in front of the desk rail (rail y≈760–800), so the 'desk' reads as wainscot + floor.
- His screen-right arm is held out (armR a:20 b:60), fist at ≈(1670, 700) over empty teal wall; the other arm hangs.
- Eyes look down-left at the empty floor; brows angled down, mouth flat.
- His pencil is drawn across his right brow and glasses rim, not behind the ear (f6670).

Only breathing (±1.2 px) and a blink move. Frozen f6666–6733 (2.27 s).
  V2 DIRECTION: SCENE STAGING (applies to S9.1–S9.8):
(a) Rebuild DeskSet like CounterSet: children render BEHIND a desk-front Layer (depth 1.08), and a `front` slot renders over it. Move the corkboard from the wall layer (0.72) to depth 1, and leave only the wall dots at 0.72. Then nothing pinned can drift against the checker when the camera moves; that drift is what put his head over the chip.
(b) The checker goes behind the desk: Character pass='body' front='L' at x≈1640, ground y≈1000, scale 0.95. His head lands at ≈1585–1695 × 570–690 and the desk top (y≈760) cuts him at the chest. Draw his screen-left arm again with pass='frontArm' in the front slot so his hand works over the desk. His legs are hidden, so he can glide left and right behind the desk without a walk cycle.
(c) The board holds the method, the desk holds the evidence. His reach tops out around y≈560, so nothing he handles may be pinned high on the board. The headline and Q cards pin themselves (with pins and thunks). The slip and the record stay at desk level within his reach.

Setup: open on WIDE (960, 560) at zoom 1.05, showing board, desk and checker. Frame one is already in motion: he is turning his head toward screen-left. Pins already sit in the cork at the headline and Q-card spots, so the board reads as waiting.
Action ("Which leaves", f6669): a clean, unstamped ChatGPT slip (width 600, fontSize 34, rotate −2°) rides the wipe's leading edge in from screen-left along the desk top. It decelerates and stops at x≈910–1510, y≈680–980 in front of him, straddling the desk top the way the S1 slips sit on the counter. 2° rotational overshoot, 6-frame settle.
Reaction ("unglamorous", f6690–6710): a deadpan glance down at the slip (lookX −0.3, lookY 0.6). His front hand pushes the round glasses up (6 frames), then plucks the pencil from behind his ear.
Secondary: the slip's corner settles 1–2 px; breathing and blink continue.
Next development: the headline card lands on "check." (S9.2).
Camera: one slow push from zoom 1.05 to 1.08 toward board centre, no pan.
Quiet: the board.
Sound: paper slide + soft desk stop; tiny pencil click on 'unglamorous'; S8's apparatus hum gives way to very low desk-room tone.
## S9.2 3:44.40-3:46.50 (V1 f6732-6795) | "check. Two questions."
  - [medium/unclear_when_muted] On "Two questions." only ONE card is on screen. Card 2 arrives 3.4 s later (f6868), so a muted viewer can't see that there are two.
  - [medium/timing_vs_narration] Q1's text lands on "questions." (f6766), about 1 s before "Does the source exist?" is spoken (f6796). The text is read early, and then nothing happens when the line arrives.
  - [medium/motion_quality] The headline is a generic scale-from-zero pop. Q1 is a 14-frame fade + 20 px rise with no pin, no landing, no settle and no sound. Things appear rather than being put there.
  - [low/overlap_or_clipping] The headline box crosses the corkboard's top border (box y≈43–139 vs board edge at y≈70), so it reads as UI pasted over the set. From f6780 to f6917 its bottom edge and drop shadow also sit on Q1's top border (x≈490–805, y≈136–146).
  - [low/disconnected_or_floating] The Q cards float on the cork with only a drop shadow: no pin, no tape (f6830, f6880). This is one of the 'floating cards' in the brief's small-details list, and inconsistent with the taped record.
  viewer_should_look_at: The word "check.", then the fact that there are exactly two questions.
  what_it_should_communicate: The whole method is one plain verb, and it has exactly two parts.
  what_actually_happens: At f6732 a screen-space Headline (64 px, cream box) springs from scale 0 with overshoot. At f6740 the box spans x≈437–1480 (still over-scaled); settled, it sits at x≈488–1429, y≈43–139, straddling the corkboard's top frame (y≈70).

On "questions." Q1 fades in and rises 20 px (f6766–6780) at x≈190–805, y≈141–234. Its top border touches the headline box's bottom edge (x≈490–805, y≈136–146; f6830, f6900 zoom). Q2 is absent. Neither card has a pin or tape (the record later gets tape).

From f6780 everything is frozen (start of still run 6776–6868). The checker is unchanged.
  V2 DIRECTION: Setup: the pins already in the cork (from S9.1).
Action ("check.", f6736): the headline becomes a pinned card in the world. 'The unglamorous move: check.' (56 px) drops onto the board's top centre (x≈545–1375, y≈88–185), fully inside the board frame: 2-frame lift, land (scale 1.04→1), pin thunk, 2 px board shudder, settle. Keep it deliberately unglamorous: no sparkle. The checker gives one dry pencil tick in the air on "check.".
Reaction: a small satisfied nod (tilt ±4° over 8 frames).
Secondary ("Two", f6760): two blank numbered cards pin on side by side under the headline: Q1 at x≈230–960, Q2 at x≈1000–1730, both y≈225–335. They land 4 frames apart, each with its own visible pin and a 1° swing that damps. A muted viewer now sees 'two'.
Next development: their text writes on as each question is spoken (S9.3).
Camera: continue the S9.1 push; no new move.
Quiet: the checker's body; only his head and pencil move.
Sound: pin thunk + pencil tick on "check."; two pin thunks on "Two", the second slightly lower.
## S9.3 3:46.53-3:50.13 (V1 f6796-6904) | "Does the source exist? And does it actually say this?"
  - [high/static_hold] Still run f6776–6868 (3.1 s), spoken: "questions. Does the source exist? And does it actually". Nothing on screen responds to the first question being asked.
  - [high/blank_space] The right ≈55% of the corkboard (x≈810–1795, y≈141–624) and the floor (y≈800–1080) are empty throughout, so the two small cards float in a corner. The right half of the board has been empty for the scene's first 10.4 s (f6659–6972).
  - [medium/timing_vs_narration] Q2 fades in late (starting inside "actually", ≈1 s after "And does" at f6839), while Q1 appeared early. The sync is inconsistent, and the stressed word "actually" lands on a half-transparent card with no emphasis of its own.
  - [low/phone_readability] Question text is 34 px on 1080p at zoom 1 (≈11 px on a 640×360 phone): legible but small. The cards are only 615 px wide in a 1920 frame.
  - [medium/disconnected_or_floating] The checker never looks at, points at or touches the cards. His eyes stay down-left at empty floor and his arm points at the wall.
  viewer_should_look_at: Question 1 as it is spoken, then Question 2 with the stress on "actually".
  what_it_should_communicate: A two-step test: first existence, then content. The second step ("does it ACTUALLY say this") is the one people skip.
  what_actually_happens: Q1 sits unchanged through its own line. Q2 fades in f6868–6882: it starts inside "actually" (f6861–6873) and is complete on "say" (f6878). In f6870 it is about 50% transparent with cork showing through. The headline and the checker are static.

Still runs: 6776–6868 (3.1 s, the longest in the scene) and 6879–6905 (0.9 s). The cards cover only x≈190–805, y≈141–360. The right ≈55% of the board (x≈810–1795) has been empty since the scene began and stays empty until f6972 (10.4 s). Card text is 34 px at zoom 1 (cap ≈24 px).
  V2 DIRECTION: Setup: two blank numbered cards are pinned, text at 44 px.
Action ("Does the source exist?", f6796–6834): Q1's text writes on left→right, paced to the words. The checker turns his head up-left to it and points the pencil at it on "exist?". The card wobbles 1–2° and settles.
Reaction ("And does it actually say this?", f6839–6894): Q2 writes on. A hand-drawn underline swipes under 'actually' exactly on the word (f6861–6873).
Secondary: his eyes travel from card 1 to card 2; a blink on the switch.
Next development: in the pause after "this?" his gaze drops to the slip and his front hand moves toward it (anticipation of "Take").
Camera: ease from WIDE to CARDS ≈(980, 500) zoom 1.2 across the two questions. That frame holds the headline, both cards (text ≈53 px on screen), the desk top with the slip, and his head. No pan beyond that.
Quiet: headline card and slip.
Sound: soft pencil scratch under each write-on, a tap on "exist?", a short underline swipe on "actually".
## S9.4 3:50.17-3:52.17 (V1 f6905-6965) | "Take the ChatGPT slip."
  - [high/disconnected_or_floating] "Take the ChatGPT slip" has no taking. The slip pops from scale 0.8 out of nothing at f6909 and hangs across the wall/rail/floor seam (y≈640–968 over the rail at y≈728–768), with no surface under it and no hand on it. His hands are ≈500 px away.
  - [medium/competing_attention] The camera push, the headline fade and the slip pop all happen within f6905–6923. The f6910 tile is a ghosted double exposure of two half-transparent elements over a moving camera. Then 1.3 s of nothing.
  - [medium/camera_hurts] The push goes to an arbitrary centre (900, 600) rather than to the slip. It cuts the board's top and right borders while keeping an 80 px teal strip at the left, so the crop looks accidental. The Q cards end 48 px from the top edge and the record's tape later sits on the top edge. The checker's fist ends ≈70 px from the right edge, pointing out of frame. The screen-space headline doesn't scale with the world during the zoom.
  - [medium/phone_readability] The guard-rail line "GPT-4o · 9 May 2025" renders at a ≈21 px font (≈7 px on a phone), unreadable. The claim text is ≈35 px (≈12 px on a phone), marginal.
  - [medium/blank_space] The board's right half (screen x≈850–1920, y≈0–590) is empty during and after the push. There is also an empty wall/floor block between the slip and the checker (x≈1030–1540, y≈600–1080) that persists to the end of the scene.
  viewer_should_look_at: The slip: its header (ChatGPT, GPT-4o · 9 May 2025) and the claim text.
  what_it_should_communicate: Here is a real, specific, confident claim, the one the episode opened with. It is now going through the two questions.
  what_actually_happens: Three events overlap in about 0.5 s:
- Camera push WIDE→DESK (cx 900, cy 600, zoom 1.15, easeInOut) over f6905–6923.
- The screen-space headline fades f6907–6917 (opacity 0 at f6917, unmounted at f6921) without zooming with the world.
- The slip springs from scale 0.8 and opacity 0 at f6909.

f6910 is a double exposure: the headline at about 30% opacity and the slip at about 30%, with the rail line visible through it. The slip settles at x≈141–1032, y≈640–968, rotated −2°. It sits across wall, rail (y≈728–768) and floor, with nothing under it and no hand on it.

The DESK framing:
- Pushes the board's top border above the frame (≈y −30) and its right border past the right edge (≈x 1950), while an 80 px teal strip stays at the left.
- Leaves Q1 48 px from the top edge.
- Leaves the checker's fist about 70 px from the right edge, so his gesture now points out of frame.

His fixed down-left gaze happens to fall on the slip now, but nothing about him changes. Frozen f6933–6972 (1.33 s).
  V2 DIRECTION: Setup: the slip is already lying on the desk in front of him (it landed in S9.1).
Action ("Take", f6911): he lifts the slip with his front hand (holdL). His fingers visibly grip its right edge; 40 px lift with a 3° tilt.
On "the ChatGPT slip." (f6916–6952) he slaps it back down flat in front of him: paper squash 4%, 2 px desk bump, 1° overshoot, settle.
Camera: on "the ChatGPT" make ONE eased move (14 frames) down-right to SLIP ≈(1230, 800) at zoom 1.6. That frames x≈630–1830, y≈460–1140: the slip, his hands and his head, all ≥40 px from the frame edges. Do not crop him to an arm entering from the edge; that is the defect the brief names. The claim reads at ≈54 px. Render this slip's 'GPT-4o · 9 May 2025' detail at ≥22 world px (≈35 px on screen); it is a factual guard rail and must read.
Reaction: he leans in 3°, and his eyes scan the lines left→right (lookX sweep over 30 frames) with the pencil hovering over the claim.
Secondary: the headline and Q cards stay pinned and simply leave the frame with the camera (no fade).
Next development: on "Is there a thesis" he looks up and off to screen-left, where the cart will come from.
Quiet: the board.
Sound: paper lift rustle on "Take"; paper slap + faint desk knock on "slip.".
## S9.5 3:52.20-3:56.10 (V1 f6966-7083) | "Is there a thesis by Adam Kalai at Carnegie Mellon? Yes."
  - [high/unclear_when_muted] The narration asks "at Carnegie Mellon?", but the document on screen (thesis_title_block.png) has no institution line. The only 'Carnegie Mellon' is in the 22 px chip, and its end runs behind the checker's head. 'CMU-CS-01-132' isn't readable as Carnegie Mellon to a lay viewer. public/img/thesis_titlepage_top.png (4080×3894) already has 'School of Computer Science / Carnegie Mellon University'.
  - [high/overlap_or_clipping] The checker's head (depth 1) covers the end of the honesty chip, '· exists ✓', from f6972 to the end of the scene. His hair overlaps the record's bottom-right border by ≈30 px (f7020 zoom). During the pull-out (f7425–7437) the parallax makes him cover more of 'Mellon'. The record and chip live on the wall layer (depth 0.72), so they can never stay aligned with the character.
  - [high/disconnected_or_floating] The source materialises by spring-pop. There is no retrieval step, though the brief's checking flow explicitly includes 'retrieve source' with the object physically travelling, and S8 already set up a RETRIEVAL cart for exactly this record.
  - [medium/timing_vs_narration] The found chip saying 'exists ✓' appears on "thesis" (f6972), before the question is finished and 2.9 s before "Yes.", so the answer is given away early.
  - [high/phone_readability] 'Adam Kalai' and the rest of the author block, the exact evidence for this question, are ≈20 px font at 1080p (≈7 px on a phone). Nothing zooms in.
  - [medium/motion_quality] The first verdict (Q1 ✓ on "Yes.") is an instant colour/icon swap in the frame's top-left corner, with no anticipation, impact or settle, and the checker doesn't react.
  - [medium/static_hold] f6996–7019 (0.77 s, "by Adam Kalai") + f7024–7057 (1.13 s, "Kalai at Carnegie Mellon? Yes.") + f7059–7089 (1.03 s, "Yes. Does it say"). Apart from one blink at f7019 and the 2-frame ✓ swap, the picture is frozen for about 3.1 s. Nothing marks the author or the institution as they are named.
  - [low/offscreen_or_cropped] The record's tape strips sit on the top frame edge (y≈0–35) for the rest of the scene.
  viewer_should_look_at: The real title page arriving, then its author line (Adam Kalai), then its institution line (Carnegie Mellon University), then Q1 getting its ✓.
  what_it_should_communicate: Test 1 passes: the cited source exists. It is a real Carnegie Mellon PhD thesis by Adam Kalai, so the model didn't invent the person or the thesis.
  what_actually_happens: At f6972 the record springs in from scale 0.8 (24-frame spring, settled by f6996) at screen x≈943–1824, y≈0–416, rotated 1.5°. Its tape strips sit on the top frame edge. The chip 'found: Kalai (2001), PhD thesis, Carnegie Mellon · exists ✓' (≈24 px on screen) appears with it, 2.9 s before "Yes.".

The checker's head (x≈1576–1720, y≈384–530) covers the chip from '…Mellon' onward, so '· exists ✓' is never visible. His hair also overlaps the record's bottom-right border by ≈30 px.

The crop used (thesis_title_block.png) shows only the title, 'Adam Kalai', 'May 16, 2001' and 'CMU-CS-01-132'. It contains no 'Carnegie Mellon' at all.

Timeline:
- Frozen f6996–7019 (0.77 s, just under the 0.8 s threshold, so unshaded) over "by Adam Kalai".
- A blink.
- Frozen f7024–7057 (1.13 s) over "at Carnegie Mellon? Yes.".
- On "Yes." Q1's disc swaps 1→✓ and the border turns teal at about f7058, in the top-left corner, with no pop.
- Frozen again f7059–7089 (1.03 s).

The author-block lines are ≈20 px font (cap ≈14–16 px). The checker never turns to the record.
  V2 DIRECTION: Fix the asset first. Replace thesis_title_block.png with thesis_titlepage_top.png in a windowed Evidence (card width ≈540, viewportHeight ≈230). By default the window is focused on the title band (focus zoom ≈1.8, so the title cap is ≈34 px on screen).
Setup ("Is there a thesis", f6966): reuse S8's RETRIEVAL cart SVG, this time drawn in the front slot so nothing hides it. It rolls in from screen-left along the desk top carrying the title page upright in a clip. Wheels turn; it decelerates and bump-stops at x≈330–870 beside the slip. The page sways 1.5° and damps.
Camera: on "Is there" ease out from SLIP to COMPARE ≈(980, 620) at zoom 1.2. That frame holds the Q-card row ≥50 px below the top edge, the cart and record, the slip, and the checker. Hold this framing through S9.7; the evidence zooms happen inside the card.
Action ("by Adam Kalai", f6993–7017): the checker glides ≈350 px left behind the desk and points the pencil at the page. Evidence focus moves to the author block (zoom ≈3, so 'Adam Kalai' reads ≈50 px on screen). A teal box draws round 'Adam Kalai' on "Kalai".
"at Carnegie Mellon?" (f7019–7046): interpolate focus.box down the page over 10 frames to 'Carnegie Mellon University'; a teal box draws on "Mellon".
Reaction ("Yes.", f7058): Q1's disc flips to ✓ with a pop (scale 1.25→0.95→1) and a teal flash on the card border; the checker nods once. Only now does the honesty chip 'found: Kalai (2001), PhD thesis, Carnegie Mellon · exists ✓' (≥28 world px) slide out onto the cart deck under the page, fully visible.
Secondary: during the tail of "Yes." the focus eases back to the title band, and the checker glides back toward the slip.
Quiet: the slip.
Sound: cart wheels + bump stop (callback to S8's cart), clip snap, two soft marker squeaks on the boxes, a small dry paper/wood 'tick' on "Yes." (not a game-show ding).
## S9.6 3:56.13-3:59.93 (V1 f7084-7198) | "Does it say “Boosting, Online Algorithms,” 2002?"
  - [high/timing_vs_narration] The record's real title is boxed 4.3 s early (f7089 instead of f7218) because the cue matches the wrong 'it', which pre-empts "No. It says…". The slip's highlights finish before the quote is read, and '2002' is highlighted about 2 s before "2002?" (f7160).
  - [high/competing_attention] The record title box, the slip title sweep and the slip year highlight all run f7089–7114, on two documents about 900 px apart. The viewer can't tell which title to read.
  - [medium/broken_asset] The 'what it actually says' label on the record's title box is clipped invisible by the Evidence viewport (overflow:hidden). It never renders in any frame.
  - [high/static_hold] About 2.8 s frozen (f7114–7198) during the most specific words in the scene, the quoted claim and its year.
  - [medium/unclear_when_muted] Claim and source are never put side by side. Muted, the viewer sees two highlighted titles in opposite corners with no comparison set up.
  viewer_should_look_at: The slip's claimed title and its "2002", word by word as they are read, positioned so they can be compared with the source.
  what_it_should_communicate: Test 2 begins: this is exactly what the claim says (title and year), and it is about to be held up against the source.
  what_actually_happens: Three highlights fire within about 25 frames:
- f7089–7103: a teal box sweeps over the record's whole title. This is the cue bug: `at('s31','It')` matches the "it" in "Does it say", not "It says" (f7218). The box's label 'what it actually says' never shows: labelSide 'top' puts it above the box, outside the Evidence image viewport, which has overflow:hidden.
- f7090–7104: the slip's quoted title gets a coral highlight + underline. Its pale coralLight fill barely separates from the cream slip (f7100).
- f7104–7114: the slip's '2002' gets a coral highlight.

All of it is finished before "Boosting," (f7108–7125) is spoken. Then the picture is frozen f7114–7198 (about 2.8 s; still runs 7100–7129, 7134–7160, 7162–7198, split only by a blink at f7129). The two titles are about 900 px apart diagonally: slip lower-left, record upper-right.
  V2 DIRECTION: Fix the cue first: rTitle must use at('s31','It',2) (or at('s31','says')). Put the box label inside the viewport (labelSide 'bottom' with room left for it), or render labels outside the overflow:hidden element.
Setup ("Does it say", f7084): the checker is back at the slip. He lifts it a few px and sets it upright on the desk beside the cart, so the two documents stand side by side at desk level: record at x≈330–870, slip at x≈910–1510. Their titles sit on roughly one band (y≈740–820) in the COMPARE framing from S9.5; no camera move is needed.
Action ("Boosting, Online Algorithms,", f7108–7158): a coral highlighter sweeps the slip's title word by word in sync. Use a stronger fill than coralLight so it reads on cream. The pencil tip follows the sweep.
"2002?" (f7160): a coral ring draws round '2002' exactly on the word.
Reaction: the record stays plain (dimmed 15%; not its turn yet). His brows lift (browAsym 0.6) and his eyes flick across to the record.
Secondary: Q2's card, in frame at the top, gives a small 'pending' border flicker on "2002?".
Next development: the "No." verdict.
Camera: hold COMPARE, with an optional very slow drift from zoom 1.2 to 1.24 toward the documents.
Quiet: Q1, the record.
Sound: a small paper shuffle as the slip is stood up; felt-tip highlighter squeak paced with the words; a short marker circle on "2002?".
## S9.7 3:59.97-4:04.47 (V1 f7199-7334) | "No. It says “Probabilistic and On-line Methods,” 2001."
  - [high/static_hold] Still runs f7200–7239 (1.33 s) + f7244–7286 (1.43 s), spoken: "No. It says 'Probabilistic and On-line Methods,'". Then f7290–7336 (1.57 s), "Methods, 2001. Source". About 4.3 of the 4.5 s are frozen.
  - [high/motion_quality] "No.", the scene's key verdict, is a one-frame colour/icon swap in the top-left corner while the viewer's eye is on the documents. There is no anticipation, impact or settle, no strike on the claim, and no character reaction.
  - [high/phone_readability] The decisive year is too small. 'May 16, 2001' is ≈20 px and the '2001' pill ≈27 px at 1080p (≈7–9 px on a phone); the slip's '2002' is ≈35 px (≈12 px). Nothing is zoomed, though the brief says to zoom into the title and the year.
  - [low/overlap_or_clipping] The teal box drawn around 'May 16, 2001' has an outline about as thick as the text is tall, and it nearly touches the 'Adam Kalai' and 'CMU-CS-01-132' lines (f7300). At phone size the three lines and the box merge into one teal smudge.
  - [medium/camera_hurts] The locked DESK framing (f6923–7425) gives no emphasis to the title, then the year. The camera doesn't help the viewer know where to look during this sentence.
  - [medium/unclear_when_muted] There is no 2002-vs-2001 side-by-side and no strike-through of the wrong title or year. Muted, the mismatch has to be found by comparing small text in opposite corners.
  viewer_should_look_at: Q2's ✕ verdict and the strike on the claim, then the record's real title as it is read, then the year 2001 directly against the slip's 2002.
  what_it_should_communicate: The source exists but says something different: a different title and a different year. The claim fails test 2, and here is the exact evidence proving it.
  what_actually_happens: Q2's disc swaps 2→✕ and its border turns coral almost instantly (binary switch at about f7199). Nothing else happens.

Frozen f7200–7286, 2.9 s (runs 7200–7239 and 7244–7286, split only by a blink), while the narrator reads the real title. That title has been boxed since f7089, so "It says…" gets no visual at all.

f7286–7296: a teal box sweeps 'May 16, 2001' and a '2001' pill appears to its right (date font ≈20 px, pill text ≈27 px). The box's ≈5 px outline nearly touches 'Adam Kalai' above and 'CMU-CS-01-132' below (f7300 zoom). Then frozen f7290–7336 (1.57 s).

The slip's '2002' (≈35 px, lower-left) and the record's '2001' (upper-right) stay about 900 px apart and never share a tight frame. The camera is still in the locked DESK framing (13.5 s by now).
  V2 DIRECTION: Setup: the COMPARE framing, with the documents side by side at desk level and the Q row at the top.
Action ("No.", f7199): Q2's disc flips to ✕ with impact (scale 1.3→0.95→1, card jolts 3 px, coral flash). It is in frame because COMPARE keeps the Q row. On the same beat a coral strike-through draws across the slip's highlighted title (Marked 'strike', 8 frames). The checker gives one short head shake (lookX ±0.3 over 10 frames).
Reaction ("It says 'Probabilistic and On-line Methods,'", f7218–7290): the record un-dims. Inside the card, Evidence focus pushes to the title band (zoom ≈2.2). A teal box draws word by word with the title, and its label is visible.
Secondary ("2001.", f7292): focus pans down the same page to the date line at zoom ≈4, so 'May 16, 2001' reads ≈55 px on screen. Box it with a thinner outline (≈3 px, ≥8 px padding) and pop the '2001' pill (≥36 world px) with a small overshoot. In the same frame, 600 px to the right, the slip's ringed '2002' (≈41 px) gets a short coral strike. The pencil taps the 2001.
Next development: the focus eases back to the title view as he turns toward the slip for the summary (S9.8).
Camera: none. The in-card zooms move toward the information while the frame keeps both numerals and Q2 visible.
Quiet: Q1, the cart.
Sound: a dry, low wooden clunk on "No." (distinct from S6's game-show buzzer) + pen strike scratch; teal highlighter sweep (a different pitch from the coral one); marker box + small pop on "2001."; a short strike on 2002.
## S9.8 4:04.50-4:08.03 (V1 f7335-7441) | "Source exists. Claim fails. Stamp it." (then S10's "So…" at f7445; the actual V1 gap after "it." is 0.6 s, overlapped by the S10 wipe)
  - [high/disconnected_or_floating] An anonymous arm enters from off-screen left and stamps the slip while the on-screen checker stands idle with his arm out at the right. The coral sleeve matches his coral cardigan, so it reads as his own arm stretched ≈1,500 px across the frame (f7410, f7420). This is the brief's 'long red arm entering from the left looks accidentally cropped' defect. Props.tsx already has an unused `Stamper` ('Hand stamper (held by the fact-checker)'), and Character has holdL/holdR.
  - [high/motion_quality] The stamper has no anticipation lift, no compression on impact and no recoil, and the slip and desk don't react to the hit. The impression appears offset from the pad and about 4× wider than it.
  - [medium/timing_vs_narration] The impact (f7409–7417) lands on "Stamp", so "it." (f7417–7427), the natural hit word, gets only the arm withdrawing. Separately, the chips land on "Source" and "Claim" and then hold frozen through "exists." (f7346–7369).
  - [medium/overlap_or_clipping] The arm covers the slip's 'ChatGPT GPT-4o · 9 May 2025' header (f7410), hiding a factual guard rail at the climax, and then covers both chips (f7420). The impression overhangs the slip's right edge (x≈1025→1125) onto the wall, and its border cuts through the claim's text lines.
  - [high/weak_transition] The gap after "Stamp it." is only 0.6 s in V1 ('it.' ends f7427, S10's 'So' at f7445), and it is eaten by three overlapping exits: hand out f7421–7435, camera pull-out f7425–7437, S10 wipe f7429–7441. The verdict never gets a hold, and pulling out during a wipe reads as mushy.
  - [low/competing_attention] The 'claim fails' chip and the CLAIM FAILS stamp say the same words 1.4 s apart. The chips are tiny (≈10 px on a phone) and add a third element on top of the Q-card indicators.
  - [low/disconnected_or_floating] The two chips sit tangent to the board's bottom border (y≈584), half on the board frame and half on the wall, in the gap above the slip (f7340–f7400). They belong to nothing.
  viewer_should_look_at: The two verdicts (Q1 ✓, Q2 ✕) summarised, then the stamp landing on the slip.
  what_it_should_communicate: The method's result in one breath (real source, false claim), closed by a physical verdict the viewer can feel.
  what_actually_happens: f7336–7346: a 'source exists' teal chip fades in above the slip's top-left (x≈141–384, y≈584–635). f7369–7379: a 'claim fails' coral chip appears beside it (x≈405–608). Both are about 30 px. Their top edges sit on the board's bottom border (y≈584), floating in the 56 px gap above the slip.

Frozen f7346–7369 (0.77 s, over "exists.") and f7372–7400 (0.97 s).

The stamp:
- f7395–7407: StampHand slides in from beyond the left frame edge as a straight 62 px bar with no elbow or shoulder. Its coral sleeve is the same coral as the checker's cardigan, so it reads as his arm stretched across the frame from the wrong side, while his real arm stays out at screen-right.
- Press f7405–7415, during "Stamp"; the impression scales 1.6→1 over f7409–7417 (≈64 px text), so the hit lands on "Stamp", not "it." (f7417–7427).
- During the press the arm covers the slip's header, including the guard-rail label (f7410). On the press's upswing it covers both chips (f7420).
- The pad (≈130 px wide on screen) leaves an impression ≈490 px wide, offset down-right of the pad. Its border slices through 'dissertation', 'is entitled' and 'and Other Topics', and it overhangs the slip's right edge by ≈100 px onto the wall and rail.

The checker only switches to a smirk with raised brows (f7411–7421). The hand withdraws f7421–7435, the camera pulls back to WIDE f7425–7437, and S10 wipes in from the right f7429–7441 (saffron sliver at the right edge in f7430). The stamped verdict holds cleanly for about 4 frames.
  V2 DIRECTION: Setup ("Source exists.", f7336): ease from COMPARE to SUMMARY ≈(960, 580) at zoom 1.1. That frame holds the Q row, the record on its cart, the slip in front of the checker, and the checker. Q1's ✓ pulses (teal glow) and the record's found-chip brightens. Use the indicators that already exist; drop the extra chips.
Action ("Claim fails.", f7369): Q2's ✕ pulses with a low thunk. The checker squares the slip in front of him and picks up the `Stamper` from the desk in his front hand (holdL).
"Stamp" (f7405): he raises the stamper to shoulder height over 6 frames (anticipation, slight lean back).
"it." (f7417): slam in 3 frames.
- The stamper squashes about 10%.
- The slip and desk jolt 3 px; the cart and record rattle 2 px; the pinned Q cards rattle 1 px.
- The camera gets a ~1% micro-bump for 4 frames.
- The 'CLAIM FAILS' impression (size 48–56, rotated −8°) appears exactly under the pad and inside the slip's borders. Keep it over the struck title so the guard-rail header stays clear.
Reaction: the stamp sticks for 3 frames, then peels off with a small recoil. The checker gives a dry smirk and returns the pencil behind his ear.
Secondary: the cards, cart and paper settle.
Next development: hold ≥0.5 s on the stamped slip, then the motivated exit (see transition_out). Do not let the exit overlap S10's "So".
Sound: soft confirm click (Q1 pulse), low thunk (Q2 pulse), stamper pick-up clack, a cloth rustle on the raise, a heavy rubber-stamp THUMP with desk thud and card/cart rattle on "it.", rubber peel, pencil click.

## SCENE PROBLEMS
  - static_hold high The motion data marks 70.3% of the scene as still (18.2 of 25.9 s, 13 runs, longest 3.1 s), and that understates it. Several unshaded gaps are only a 4-frame blink (f7019, f7129, f7239, exactly 110 frames apart). Others are sub-0.8 s holds (f6996–7019 'by Adam Kalai', f7346–7369 'exists.'). Counting those, about 78% of the scene is frozen. The motion curve shows only four real events: headline pop (≈f6735), push + slip (≈f6910), record pop (≈f6975) and stamp (f7400+). All of s31 (13.7 s, the actual check) runs in one locked framing, with highlights that fire early and then freeze.
  - static_hold high Still run f6666–6733 (2.27 s), 'guarantee. Which leaves the unglamorous move: check.': empty board and idle checker. What should develop: the slip arrives on the desk; the checker reacts deadpan (glasses push, pencil out).
  - static_hold high Still run f6776–6868 (3.1 s, the longest), 'questions. Does the source exist? And does it actually'. What should develop: Q1 writes on with its words, the checker points the pencil on 'exist?', Q2 starts on 'And'. Also f6879–6905 (0.9 s, 'actually say this? Take'): the underline on 'actually' and his hand moving toward the slip.
  - static_hold medium Still run f6933–6972 (1.33 s), 'ChatGPT slip. Is there a thesis'. The slip has landed and nothing reads it. What should develop: he leans in and scans the lines, then looks off-left as the retrieval cart's rumble starts.
  - static_hold medium f6996–7019 (0.77 s, 'by Adam Kalai') + f7024–7057 (1.13 s, 'Kalai at Carnegie Mellon? Yes.') + f7059–7089 (1.03 s, 'Yes. Does it say'). What should develop: in-card focus moves to the author line, then the 'Carnegie Mellon University' line, each boxed on its word; a ✓ pop with settle and a nod on 'Yes.'; then he moves back to the slip.
  - static_hold high Still runs f7100–7129 (1.0 s), f7134–7160 (0.9 s) and f7162–7198 (1.23 s): the quote 'it say "Boosting, Online Algorithms," 2002?'. All highlights had finished at f7114. What should develop: a word-paced highlighter sweep across the claimed title, then a ring on '2002' exactly on '2002?'.
  - static_hold high Still runs f7200–7239 (1.33 s) and f7244–7286 (1.43 s), 'No. It says "Probabilistic and On-line Methods,"'. What should develop: ✕ impact + strike-through on 'No.', then an in-card push to the record's title with the teal box drawing word by word.
  - static_hold medium Still run f7290–7336 (1.57 s), 'Methods, 2001. Source'. What should develop: an in-card push to 'May 16, 2001' (≈55 px) with the slip's ringed and struck '2002' in the same frame, then the ease-out to the summary framing.
  - static_hold low f7346–7369 (0.77 s, 'exists.') and f7372–7400 (0.97 s, 'exists. Claim fails. Stamp'). What should develop: the Q1 and Q2 pulses on their words, then he picks up the stamper and raises it, so 'Stamp it.' pays off.
  - camera_hurts high There are only two framings. WIDE (f6659–6905), then one 18-frame push to DESK (cx 900, cy 600, zoom 1.15), locked for 16.7 s (f6923–7425), then a pull-out during the S10 wipe. The push isn't aimed at any information. It crops the board's top and right borders while keeping a teal strip at the left. No camera move or in-card zoom ever serves the author line, the institution, the title comparison or the year, which the brief explicitly asks for.
  - other high No physical process. The brief's evidence-checking flow (CLAIM → does the cited source exist? → retrieve source → does it support the claim? → NO → CLAIM FAILS, with the object physically travelling) maps one to one onto this scene, but in V1 everything pops in and the verdicts are colour swaps. Reach constraint for V2: at scale 0.95 the checker's hand reaches no higher than y≈470 standing (V1) or y≈560 behind a desk. Nothing he handles can be pinned in the board's upper area, where V1 puts the record, and a 'he pins the page on the board' plan would show him not touching what he places. V2 should keep the board for the method (headline + two Q cards pinning themselves with pins and thunks) and do the evidence at desk level: slip in front of him, record delivered by S8's RETRIEVAL cart and left standing beside it, stamp on the desk.
  - disconnected_or_floating high The checker holds one pose for 26 s: arm out toward empty wall (and, at DESK, toward the right frame edge), eyes fixed down-left, only a mouth/brow change at f7411. He never moves toward, touches or reacts to the cards, the slip, the record or the stamp; the 'character response' layer is missing. He stands in front of the desk rail because DeskSet renders children after the desk, so there is no desk surface and the slip hangs across the wall/rail/floor seam. The stamping arm comes from the opposite side of frame in his cardigan colour.
  - unclear_when_muted high The evidence for the first question is incomplete. The source crop (thesis_title_block.png) has no 'Carnegie Mellon' on it, so 'at Carnegie Mellon?' is answered only by a 22 px chip half hidden behind his head. Muted, the viewer also gets two cards, two highlighted documents in opposite corners, a ✓, a ✕ and a stamp. The actual comparison (different title, 2002 vs 2001) is never put side by side or struck through, and 'Two questions' shows only one card.
  - phone_readability high The evidence the narration depends on is 7–9 px on a 640×360 phone: 'Adam Kalai / May 16, 2001 / CMU-CS-01-132' (≈20 px font at 1080p), the '2001' pill (≈27 px), the found chip (≈24 px, partly hidden) and the guard-rail 'GPT-4o · 9 May 2025' (≈21 px). V2 target: whatever is being discussed is ≥54 px on 1080p at that moment (via Evidence focus or the camera), supporting text ≥40 px, and the guard rails ≥30 px whenever their document is the subject.
  - timing_vs_narration medium Cue bug: `cItSays = at('s31','It')` resolves to the 'it' in 'Does it say' (f7089), not 'It says' (f7218); use occurrence 2 or 'says'. Also: Q1 lands about 1 s before its line, Q2 about 1 s after its line starts, the 'exists ✓' chip about 2.9 s before 'Yes.', '2002' about 2 s early, and the stamp hits on 'Stamp' rather than 'it.'. With the new narration, every reveal should be cued to its own spoken word.
  - overlap_or_clipping medium Layer/depth mismatch. The board, the record and its chip live on the wall layer (depth 0.72) and the checker on depth 1, so camera moves slide them against each other. At DESK his head covers '· exists ✓' and his hair overlaps the record's bottom-right border (≈30 px); during the pull-out it covers more. Other overlaps: the 'what it actually says' label is clipped by Evidence's overflow:hidden; the headline box sits on Q1's top border (f6780–6917); the stamp arm covers the slip header and the chips. V2: put the board at depth 1 with the characters, and keep a ≥90 px clearance between his head and any document.
  - blank_space medium The board's right half is empty for the first 10.4 s (f6659–6972). At DESK, after the record lands, two large dead areas remain for about 15 s (f6923–7425): empty cork under the Q cards (x≈80–850, y≈300–590) and an empty wall/rail/floor block between the slip and the checker (x≈1030–1540, y≈600–1080). V2's layout (headline top centre, Q cards side by side across the board, documents side by side on the desk, checker behind the desk) uses the full frame.
  - other low No background life beyond his blink and breath. For this quiet scene a little is enough: paper edges settling after each pin, a card swing damping, the pencil turning in his fingers, the cart's wheels creaking to rest, and very low room tone.

## TRANSITION IN
Now: S8 (blue apparatus room) ends on "None of it is a guarantee". On screen are three identical WRONG-stamped ChatGPT slips, the NO GUARANTEE stamp, and the EVIDENCE CHECK booth holding the thesis title page. The generic 12-frame hard-edged wipe (left→right, f6653–6665) replaces it; S8's fade (f6663–6671) is hidden underneath. In f6660 the booth with the thesis is still visible at x≈1373–1920 while the left of the frame is already S9's empty board. The wipe lands on an empty board and an idle checker standing in front of the rail, and nothing moves for 2.3 s. Nothing carries over, although both scenes share the ChatGPT slip and the thesis.

A motivated transition fits, but keep it light; the big smart transition is the exit. Recommended: let the wipe's leading edge carry a clean, unstamped copy of the ChatGPT slip out of S8. It slides left→right along S9's desk top and stops in front of the checker (x≈910–1510) on "Which leaves…", so the claim physically enters the check. Keep the thesis out of S9 until the RETRIEVAL cart brings it in on "Is there a thesis", which reuses S8's cart and keeps Q1's suspense. Minimum fallback: keep the wipe, but have S9 already in motion on its first frame (checker behind the desk turning toward the slip, pencil coming out) so frame one isn't a dead hold. Music pulls back here ('real evidence pulls back'), and room tone drops very low.

## TRANSITION OUT
Now: the stamp impression lands f7409–7417, on "Stamp". Then three exits overlap: the anonymous hand withdraws f7421–7435, the camera pulls back to WIDE f7425–7437, and S10 (saffron counter) wipes in from the right f7429–7441 (a saffron sliver is already at the right edge in f7430). S9's own fade (from f7437) is never seen. The verdict holds for about 4 clean frames, and the 0.6 s V1 gap between "it." (ends f7427) and S10's "So" (f7445) is spent on exit motion.

The brief explicitly asks for 'verification result returns us to the courtroom/counter', and it fits here. V2:
1. Land the stamp on "it." and hold ≥0.5 s on the stamped slip: checker smirk, pencil back behind the ear. No camera pull-out.
2. He slides the stamped CLAIM FAILS slip along the desk top to screen-right. It passes in front of him in the front slot.
3. The camera follows it in one eased pan right (≈300 px over 12 frames). The pan moves him toward screen-left, which matches S10, where he opens at the counter's left edge.
4. S10's existing right-side wipe starts as the slip crosses x≈1700, so the slip's trailing edge reads as the wipe edge and the counter arrives on the same motion.
5. Optionally the stamped slip lands on S10's counter in front of the ANSWERS windows just before "So why is AI so confidently wrong?", carrying the verdict back to where the story began.

Do not pull out during the wipe, and do not let the exit overlap "So". Sound: a paper slide across the cut into counter room tone; the music begins its 'final takeaway' build under s33.

## SOUND MOMENTS
[
 "3:41.8–3:42.2 (f6653–6665, under \"guarantee.\"): transition. The ChatGPT slip slides across the desk top with the wipe and stops softly; S8's apparatus hum cuts to very low desk-room tone.",
 "3:43.0 (f6690, \"unglamorous\"): the checker pushes his glasses up and pulls the pencil from behind his ear. Tiny pencil click.",
 "3:44.5 (f6736, \"check.\"): the headline card is pinned to the board. Single cork-pin thunk + dry pencil tick (deliberately modest).",
 "3:45.3 (f6760, \"Two\"): two blank question cards pinned. Two pin thunks 4 frames apart, the second slightly lower; faint card swing.",
 "3:46.5–3:47.8 (f6796–6834, \"Does the source exist?\"): Q1 writes on. Light pencil scratch, plus a pencil tap toward the card on \"exist?\".",
 "3:48.0–3:49.8 (f6839–6894, \"And does it actually say this?\"): Q2 writes on. Pencil scratch; short underline swipe on \"actually\".",
 "3:50.4 (f6911, \"Take\"): slip lifted. Paper rustle.",
 "3:51.4 (f6942, \"slip.\"): slip slapped down on the desk. Paper slap + faint desk knock.",
 "3:52.2–3:53.0 (f6966–6990, \"Is there a thesis\"): RETRIEVAL cart rolls in along the desk top. Small wheel roll + bump stop (callback to S8's cart) + clip snap.",
 "3:53.3–3:54.9 (f6998–7046, \"by Adam Kalai at Carnegie Mellon?\"): checker glides over (soft cloth rustle). Two soft marker squeaks as 'Adam Kalai' and 'Carnegie Mellon University' are boxed.",
 "3:55.3 (f7058, \"Yes.\"): Q1 flips to ✓. Small dry paper/wood tick (not a game-show ding); chip slide.",
 "3:56.1 (f7084, \"Does it say\"): slip stood up beside the record. Paper shuffle.",
 "3:57.0–3:58.6 (f7108–7158, \"Boosting, Online Algorithms,\"): coral highlighter sweep paced to the words. Felt-tip squeak.",
 "3:58.7 (f7160, \"2002?\"): ring drawn around 2002. Short marker circle.",
 "4:00.0 (f7199, \"No.\"): Q2 flips to ✕. Low dry wooden clunk (distinct from S6's buzzer) + pen strike scratch across the claimed title.",
 "4:00.8–4:03.0 (f7224–7290, \"It says 'Probabilistic and On-line Methods,'\"): teal highlighter sweep on the record's title (a different pitch from the coral one).",
 "4:03.1 (f7292, \"2001.\"): date boxed + 2001 pill pops. Marker box + small pop; short strike on the slip's 2002.",
 "4:04.5 (f7336, \"Source exists.\"): Q1 pulses. Soft confirm click.",
 "4:05.6 (f7369, \"Claim fails.\"): Q2 pulses (low thunk); stamper picked up off the desk (wooden clack).",
 "4:06.8 (f7405, \"Stamp\"): stamper raised. Cloth/sleeve rustle only, no whoosh.",
 "4:07.2 (≈f7417, \"it.\"): impact. Heavy rubber-stamp THUMP with desk thud + small rattle of the cart, record and pinned cards.",
 "4:07.4 (≈f7423): stamp lifts off. Rubber peel/stick release; pencil back behind ear (click).",
 "4:07.8–4:08.2 (exit, before S10's \"So\"): stamped slip slid off screen-right into S10. Paper slide into counter room tone."
]

## PHONE-CRITICAL TEXT
[
 "\"The unglamorous move: check.\": 64 px Headline at zoom 1 (≈21 px on a 640×360 phone). Survives. In V2 it must sit inside the board frame and clear of the Q cards.",
 "\"1 Does the source exist?\": 34 px at WIDE (≈11 px on a phone), ≈39 px at DESK (≈13 px). Marginal. V2: 44 px font, ≈53 px in the CARDS framing.",
 "\"2 Does it actually say this?\": same as Q1, marginal. 'actually' needs visible emphasis.",
 "Q1 ✓ / Q2 ✕ discs: 54 px circle, ≈60 px at DESK (≈20 px on a phone). Survives in size, but the verdict is a colour/icon swap in the frame corner. It needs a pop and must be in frame when spoken.",
 "Slip header \"ChatGPT\": ≈31 px at DESK (≈10 px on a phone). Marginal.",
 "Slip guard-rail label \"GPT-4o · 9 May 2025\": ≈21 px font at DESK (≈7 px on a phone). FAILS, and it is hidden by the stamp arm at f7410. It must stay (factual guard rail): ≥30 px when the slip is framed on \"Take the ChatGPT slip\", and never covered.",
 "Slip claim \"Adam Tauman Kalai’s Ph.D. dissertation (completed in 2002 at CMU) is entitled: “Boosting, Online Algorithms, and Other Topics in Machine Learning.”\": ≈35 px at DESK (≈12 px on a phone). Marginal. V2: ≥44 px in the SLIP framing, ≥40 px in COMPARE.",
 "Slip \"2002\" (the wrong year): ≈35 px (≈12 px on a phone), 900 px away from the 2001. Marginal. V2: ringed, in the same frame as the zoomed 2001.",
 "Record title \"Probabilistic and On-line Methods in Machine Learning\": cap ≈30 px at DESK (font-size equivalent ≈44 px; ≈10 px cap on a phone). Marginal. V2: in-card focus on \"It says\".",
 "Record author block \"Adam Kalai / May 16, 2001 / CMU-CS-01-132\": ≈20 px font (cap ≈14–16 px; ≈7 px on a phone). FAILS. This is the Q1 evidence and the year evidence; zoom it via Evidence focus to ≥50 px.",
 "\"Carnegie Mellon University\": not on screen at all (thesis_title_block.png crops it out). FAILS. Switch to thesis_titlepage_top.png and box this line on \"Carnegie Mellon?\".",
 "\"May 16, 2001\" box: outline nearly touches the lines above and below (f7300); it smudges at phone size. Thinner outline with padding, and in-card zoom to ≈55 px.",
 "\"2001\" label pill: ≈27 px (≈9 px on a phone). Marginal or fails. V2: ≥36 world px, popping in during the date zoom.",
 "\"what it actually says\" box label: 0 px. Never rendered (clipped by Evidence overflow:hidden).",
 "Honesty chip \"found: Kalai (2001), PhD thesis, Carnegie Mellon · exists ✓\": ≈24 px (≈8 px on a phone). FAILS, and \"· exists ✓\" is hidden behind the checker's head from f6972 to the end. It must stay: fully visible, ≥28 world px, revealed on \"Yes.\".",
 "\"source exists\" / \"claim fails\" chips: ≈30 px (≈10 px on a phone). Marginal, tangent to the board edge, covered by the stamp arm around f7420, and redundant with the Q-card indicators and the stamp. Drop them.",
 "\"CLAIM FAILS\" stamp: ≈64 px at DESK (≈21 px on a phone). Survives, but it is offset from the pad, overhangs the slip's right edge by ≈100 px and slices the claim lines. Keep it under the pad and inside the slip."
]

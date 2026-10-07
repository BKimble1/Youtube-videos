# V1 shot review — S4 — Library (s13–s16), V1 frames 2557–3618 (1:25.2–2:00.6; timeline scene 2563–3612 plus wipe overlaps), 35.0 s, 64% still

What S4 does for the story: it is the episode's "why", linking S3's token machine to S5's actual record. The model learned from shelves full of text shaped like dissertation titles ("Methods." "Algorithms." "Machine Learning."). One specific researcher's title shows up rarely or never, and like a birthday there is no pattern to work it out from. So the model fills the gap with a title-shaped answer, and the confident wording ("is entitled", no "I think", no "maybe") comes from the same pattern. The props are right: shelves, card catalogue, a card with a blank "title:" line, the empty slot with the birthday cake, the ChatGPT slip, the IS ENTITLED seal and the struck-out hedge words. The execution is not.

Biggest problems:
(1) Pop, then freeze. 22.4 of 35.0 s is still (64%), across 13 runs. The longest:
- 2.7 s, f2611–2691: 'likely answer be wrong? Think about what the model learned from'
- 2.57 s, f3409–3485: 'because that's part of the pattern too'
- 2.2 s, f3020–3085
- 2.17 s, f3093–3157
During holds the only life is a 1 px torso breathing scale, which the eye cannot see.

(2) The library chain the brief names is broken at every link.
- No search and no index section.
- The 'open drawer' is a flat woodDeep rectangle drawn over one and a half drawer slots. The slid drawer front ends up behind its neighbour; only a 46 px stub pokes out of the cabinet's right side.
- The KALAI card fades in about 20 px above the cabinet top, held by nothing.
- The fist rests on a drawer seam.

(3) The gap is never filled.
- The empty slot is visible, unmarked, from f2563, right of centre in the SHELF_A push.
- It is outlined at the far left only on 'rarely'.
- It loses its outline and cake in the reset (f3225–3247).
- It then sits empty in the SLIPCAM frame (x≈395–480) while the five title words fly away from it into the clerk's chest.
- The card's blank 'title:' line is never linked to it.

(4) The clerk is unusable as the actor.
- At SHELF_A he is a head in the bottom-right corner.
- At SHELF_B he is cut at the chest.
- At CAB he freezes in a pointing pose for 7.5 s.
- Title chips cross his eyes and mouth (f3320–3335), under a shrug pose on 'fills the gap'.
- He is hidden behind the slip for the last 9.2 s (f3337–3612), with the caption butting his shoe soles.

(5) Readability and composition.
- The focal text fails at 640x360: card about 8 px, the grey-on-cream 'GPT-4o · published excerpt' label about 7 px, both guard-rail footers about 9 px.
- Three text elements appear in three corners at once (f3085–3095).
- The CAB framing exposes the bare right end of the set (x≈1745–1920 for about 7.5 s).

Corrections to the first pass:
- The walk bob is about 4.8 Hz (|sin(0.5·f)|), not 2.4 Hz.
- The headline fades out f2721–2729 and the push starts f2725, not f2713–2721 / f2721.
- At SHELF_A the clerk is cut by the right AND bottom edges, with both lenses visible.
- The drawer front does not sit on top of its neighbour. It renders behind it, and the dark body rect covers half of the column-3 drawer.
- The reset starts about f3225, during 'from.', not f3231.
- 'Boosting,' enters through the top-left corner, cut by both edges.
- S5's page fades in at f3622–3626, so the empty corkboard plays about 0.3 s.
- The V2 framings 'CAB zoom 1.3 at cx 1300' and the slip push would again show the set's bare right edge. The set must be extended, or cx capped.
- A 160 px cake cannot fit the 70 px slot that BookRow hard-codes.

## S4.1 1:25.2-1:28.2 (V1 f2557-2645) | (…one piece at a time.) So why would the likely answer be wrong?
  - [high/motion_quality] f2570–2610: the walk-in is a cutout skating across the floor.
- He crosses 1485 px in 1.33 s at up to ~64–75 px per frame, which strobes at 30 fps.
- His legs are rigid.
- The 4.8 Hz |sin| jitter is tied to no foot contact.
- He makes a dead stop at x=1225 with no deceleration step or settle.
  - [medium/timing_vs_narration] The headline 'What the model learned from' appears on 'So' (f2574–2586) and sits through the whole question. The narrator only says 'Think about what the model learned from' at f2660–2710, so the text runs ahead of the voice and answers before the question lands.
  - [medium/static_hold] f2611–2645 (part of the 2.7 s still, f2611–2691): nothing changes while the question is asked. There is no reaction and his eyes do not move.
  - [medium/blank_space] WIDE framing:
- The floor band (y 840–1080, about 22% of frame height) is flat tan with nothing on it.
- Clerk (about 410 px tall) and cabinet are bunched at x 1120–1660.
- The left 55% of the frame is undifferentiated book wallpaper.
  - [medium/weak_transition] The S3→S4 wipe is unmotivated. Its edge travels right to left, while the clerk then walks left to right, so screen directions oppose. About 0.5 s of empty library (f2566–2582) plays before anyone arrives.
  - [low/overlap_or_clipping] The clerk's right hand stops about 10 px from the cabinet's left edge (x≈1330 vs 1340), from f2610 until the push at f2992. The near-tangent looks cramped and accidental.
  - [low/unclear_when_muted] 'The likely answer' has no visual referent: S3's assembled sentence is not carried over. Muted, this reads as 'a man walks into a library'.
  viewer_should_look_at: The library and the clerk arriving to 'look into' it. The question should feel like it is about to be investigated.
  what_it_should_communicate: We leave the token machine and go to where its habits came from. A curious investigator (clerk A, the confident counter clerk) arrives at the source.
  what_actually_happens: - f2557–2569: a 12-frame hard-edged vertical wipe. The edge travels right to left and reveals S4 over S3's last frame. That frame shows the token sentence cut by both frame edges ('Kal' at left, 'entitl' at right) on a belt whose top is at y≈712.
- Camera is WIDE (960,540, z1.0) throughout.
- f2566–2582: empty library, about 0.5 s.
- f2570–2610: the clerk slides from x=-260 to x=1225: 1485 px in 40 frames on an ease-in-out. Mid-move he covers about 64 px per frame (centre x≈480 at f2590, ≈1120 at f2600).
- His legs never step. stepBob = |sin(0.5·frame)|·8 px gives a bounce every ~6 frames (~4.8 Hz) that matches no footfall.
- f2574–2586, on 'So': the headline 'What the model learned from' fades in at top centre (x≈535–1385, y≈60–155). This answers a sentence the narrator only says 2.9 s later.
- He stops at x≈1120–1330. His right hand is about 10 px from the cabinet's left edge (x 1340).
- f2611–2645: frozen apart from a 1 px breathing scale. This is the start of the 2.7 s still run f2611–2691. Pose 'look': smile, eyes up-right (lookY -0.8) at nothing.
- The cabinet (x 1340–1660, y 530–850) and all shelves are static.
- The empty slot on the third shelf (x≈660–730) is visible and unmarked.
  V2 DIRECTION: Setup (transition): see transition_in. S3's belt line becomes a shelf board, and one token tips up into a book spine.

Action, 'So why would the likely answer…' (f2573–2621): clerk A walks in from frame-left with a real walk cycle:
- 6 steps over about 48 frames, stride ≈190 px
- each foot planted and not sliding for 6–8 frames
- body dips 6–8 px on each contact
- arms counter-swing
- the last step is shorter, and he stops at x≈1050 with a 4 px settle, leaving ≥80 px between his hand and the cabinet

Reaction, on 'wrong?' (f2631): he tilts his head up at the tall shelves. His eyes scan left to right (lookX -0.6 → +0.6 over about 1 s), with a curious 'hmm' mouth.

Secondary: the visor follows the head tilt. One top-shelf book settles 2 px after his last step.

Do not show the headline until 'Think' (S4.2).

Camera: wide establishing, slightly tighter (zoom ≈1.08, cy ≈470), so the floor band shrinks to about 120 px. No move during the question; the stillness belongs to his look, not to a frozen frame.

Quiet: shelves and cabinet.

Sound: wooden 'tock' as the token becomes a spine; 6 soft footsteps on wood with a heel scuff on the stop; very low library room tone starting here.
## S4.2 1:28.2-1:30.8 (V1 f2645-2724) | Think about what the model learned from.
  - [high/static_hold] Still run f2611–2691 (2.7 s, the longest in S4) covers 'likely answer be wrong? Think about what the model learned from.' Headline and clerk sit frozen for the whole instruction to 'think about' something.
  - [medium/motion_quality] The 'learned' highlight is one uniform opacity fade on every unmarked book at once (f2691–2711). It reads as the shelves washing out, not as specific books lighting up, and gives the eye no path.
  - [low/other] Pattern words are clipped by narrow spines ('hine Learr', 'pproache', 'lgorithm', 'Topics ir', f2690). The 'same words everywhere' idea reads as rendering errors.
  - [low/other] The headline covers the top shelf's centre spines for about 5 s (f2574–2729) and never moves. The clerk never looks at it or at the shelves it names.
  viewer_should_look_at: The shelves as 'the training data', and the books whose spines carry the recurring title words.
  what_it_should_communicate: These shelves are what the model learned from, and some words recur everywhere.
  what_actually_happens: - f2645–2691: the S4.1 still continues. The headline box (x≈535–1385, y≈60–155) covers the middle of the top shelf.
- f2691–2711, on 'learned': one uniform 20-frame fade drops every unmarked book to 55% opacity at the same moment. Word spines stay at 100%. This wash persists to the end of the scene.
- f2711–2725: still.
- f2721–2729: the headline fades out. It is still at about 40% when the push begins.
- f2725: the camera push starts.
- The unmarked empty slot (x≈660–730, third shelf) has been visible since f2563.
  V2 DIRECTION: Setup, on 'Think' (f2660): the headline card 'What the model learned from' drops in from above with a small overshoot. It hangs from two short strings above the top shelf at about y 30–120, so it reads as a sign over the shelves rather than a box across their middle. It lifts out on 'The sound…'.

Action, on 'learned' (f2691): the pattern-word spines brighten in a ripple, left to right and top to bottom, each book 2–3 frames after its neighbour (about 0.8 s total). Unmarked books dim to about 0.6 as the ripple passes them, not all at once.

Reaction: the clerk's eyes follow the ripple; his mouth goes 'o' then smile; small nod.

Secondary: 2–3 lit books tip forward 3–4° and settle as the ripple passes.

Next development: on 'from.' he takes one step toward the left bookcase (hand-off to S4.3).

Camera: hold the wide. At most a 3% slow push across the sentence.

Art fix: place pattern words only on spines wide enough to show them whole (BookRow: require w ≥ the word's rendered height, or shrink the font per spine).

Sound: paper tap when the headline lands; soft cascading wooden ticks for the spine ripple.
## S4.3 1:30.8-1:33.8 (V1 f2724-2814) | The sound of a dissertation title is everywhere.
  - [high/character_cut] At SHELF_A (f2745–2815) the clerk is a head-and-collar wedged into the bottom-right corner, cut by two frame edges at once. It reads as an accident, not a composition.
  - [medium/competing_attention] At zoom 1.5 the unmarked empty slot (x≈905–1005, y≈690–860) is the most distinctive shape in the frame for 2.3 s, on 'title is everywhere'. It reads as a missing-book error a full 11 s before the 'rarely, or not at all' payoff.
  - [medium/static_hold] Still run f2764–2814 (1.7 s): nothing happens on 'is everywhere'. The key word of the sentence has no visual.
  - [medium/camera_hurts] The push goes to the upper-left shelves, where nothing happens for about 2.4 s. The frame becomes book wallpaper, and the move adds no information while cropping the only character.
  - [medium/unclear_when_muted] Muted, this is a zoom onto bookshelves. 'Dissertation title' and 'everywhere' are not visible.
  viewer_should_look_at: The spines, with the clerk reading them, and the same kind of words appearing everywhere he looks.
  what_it_should_communicate: Title-like words saturate the training data. 'Everywhere' should look like everywhere.
  what_actually_happens: - f2725–2743: push to SHELF_A (620,300, z1.5).
- Mid-push (f2735): the cabinet is half off the right edge and the clerk is cut at the knees.
- At SHELF_A the frame holds the whole left bookcase, plus the left third of the right bookcase:
   - left upright at x≈116
   - bottom row cut by the bottom edge
- The clerk is jammed into the bottom-right corner, cut by both the right and bottom edges. Visor, both lenses (right one clipped), smile and collar are at x≈1740–1920, y≈750–1080 (f2745–2815).
- The unmarked empty slot sits right of centre at x≈905–1005, y≈690–860.
- f2764–2814: 1.7 s still run on 'dissertation title is everywhere. “Methods.”'
  V2 DIRECTION: Setup: as the headline lifts out, the clerk walks (4 planted steps) toward the left shelves, head up.

Camera: truck with him at zoom ≈1.25, cy ≈480. All four shelves stay in frame from y≈15 down. The clerk stays whole (head ≈490, soles ≈1000), with ≥60 px margin on the side he walks toward. He is never touching a frame edge.

Action: his fingertip trails along the third-shelf spines. On 'everywhere' a brightening runs ahead of his finger along the next two shelves.

Reaction: his eyes dart up and down between shelves; small impressed eyebrow lift.

Secondary: books he touches rock 2° and settle. During the truck, parallax between the shelf wall (depth 0.7) and the clerk (1.0) gives real depth.

Next development: he stops in front of the 'Methods' book just before the word is spoken.

Keep the future gap filled with a thin pale book until the 'rarely' beat (see S4.7), so no unexplained hole is on screen here.

Quiet: the cabinet (out of frame).

Sound: fingertip patter along the spines, footsteps, room tone.
## S4.4 1:33.8-1:36.8 (V1 f2814-2904) | “Methods.” “Algorithms.” “Machine Learning.”
  - [medium/disconnected_or_floating] Chips are not attached to the spines that carry their words. They hover at one shared height over random books and hide those books' own words, so the idea 'these words come from these books' is lost.
  - [medium/character_cut] At SHELF_B the clerk's head and chest are cut by the bottom edge at y=1080 (f2860–2904). The cabinet's top row pokes up from the bottom edge (x≈1020–1500) for no reason.
  - [low/motion_quality] Chip entrances have no overshoot and no book reacts. Nothing physical happens in the library; text just appears over it.
  viewer_should_look_at: Each called-out word, on the actual book that carries it.
  what_it_should_communicate: Three concrete examples of the recurring title vocabulary, pulled from the shelves.
  what_actually_happens: - Saffron chips pop in at f2814 'Methods.', f2833 'Algorithms.' and f2869 'Machine Learning.'. Each is a 10-frame rise of 20 px plus a scale from 0.8 to 1 (opacity ramp; half-transparent at f2816). Sync with the words (2816/2835/2871) is good.
- They land on shelf row 2 (screen y≈480–560), not the top shelf the code comment intends. The chip x/y were written in Wall coordinates (+200 overscan) but placed in a plain Layer, so they land 200 px right and 200 px low.
- Camera pans SHELF_A → SHELF_B over f2816–2881.
- The chips sit across the middle of unrelated spines and hide their words:
   - 'Methods.' covers a 'Topics in' spine
   - 'Algorithms.' covers 'chine Learn'/'Online'
   - 'Machine Learning.' (x≈1340–1760) covers an 'Approaches' spine
- Through the pan the clerk drifts left along the bottom edge, from the bottom-right corner to bottom-centre (x≈880–1120 at f2860), cut at the chest.
- The cabinet's top row enters from the bottom edge at x≈1020–1500 (f2860–2904).
- No book moves; the clerk's pose is static.
  V2 DIRECTION: Setup: three specific books carrying 'Methods', 'Algorithms' and 'Machine Learning' sit along the truck path on three different shelves. Each spine is wide enough to show its word whole.

Action, on each word: that book slides out about 25 px and tips toward camera. Its saffron chip lifts off the spine with a 10% overshoot and stays tethered: chip base touching the book top, plus a short leader line. Place chips in Layer coordinates; no +200 Wall offset.

Reaction: the clerk taps each book as it pops, with a head-nod on each beat.

Secondary: the previous chip shrinks to 80% and dims a little, so the newest one leads. Popped books stay out at their tilt.

Next development: after 'Learning' he steps back, starting the pull-back.

Camera: continue the slow truck right, motivated by the next word's book, so all three chips are in frame by the third word. The clerk stays whole (zoom ≤1.3, cy ≈480). The cabinet stays out of frame or fully in it, never a strip at an edge.

Sound: three wooden book slides plus chip pops, rising in pitch (Methods < Algorithms < Machine Learning).
## S4.5 1:36.8-1:39.7 (V1 f2904-2992) | Shelf after shelf, the same shape.
  - [high/timing_vs_narration] 'Shelf after shelf, the same shape' has no visual. The chips, the only evidence of the pattern, are removed at f2922–2932, exactly as 'after shelf' is said.
  - [high/static_hold] Still run f2928–2985 (1.93 s) on 'Shelf after shelf, the same shape.'
  - [medium/camera_hurts] WIDE → SHELF → WIDE → CAB within about 9 s (f2725–3010). The pull-back reveals nothing new because nothing in the wide develops.
  - [low/blank_space] Back to the wide with the 240 px empty floor band.
  viewer_should_look_at: The whole library, with the same pattern repeating on every shelf.
  what_it_should_communicate: Repetition at scale: the title shape is the dominant pattern in the data.
  what_actually_happens: - f2904–2922: camera pulls back to WIDE. The chips shrink to about 20 px text.
- f2922–2932: the three chips fade out.
- f2928–2985: 1.93 s still run. The wide frame is identical to S4.2's last frame minus the headline. The clerk stands idle beside the cabinet in the same 'look' pose he has held since f2610.
  V2 DIRECTION: Setup: pull back to the wide on 'Shelf' (about 18 frames, ease-in-out). The move is the reveal of scale.

Action, with the words:
- 'Shelf': the top shelf's pattern spines tip out in a left-to-right wave.
- 'after': the second shelf does the same.
- 'shelf,': the third and fourth shelves do the same.
- 'the same shape': each matching spine cluster flashes one thin saffron outline at the same instant, so the repetition reads with the sound off.

Reaction: on 'same shape' the clerk turns to camera with an open-palm 'see?' gesture.

Secondary: wave books settle with a 1–2 frame bounce. The S4.4 chips shrink back into their spines rather than fading.

Next development: on the last syllable his head turns toward the card catalogue, and his eye-line leads into S4.6.

This fills V1's dead f2928–2985.

Camera: hold the wide once it lands.

Sound: four cascading wooden ticks, one per shelf; soft cloth rustle on the gesture.
## S4.6 1:39.7-1:42.1 (V1 f2992-3062) | But one specific researcher's title?
  - [high/broken_asset] The drawer does not read as a drawer (f3022–3240):
- a flat dark rectangle spans one and a half drawer slots and slices the column-3 drawer's label in half
- the moved front is hidden behind column 3, apart from a 46 px stub sticking out of the cabinet's side
- no side panels, no depth, no contents
This is exactly the brief's 'empty hole' complaint.
  - [high/disconnected_or_floating] The card fades into existence floating about 20 px above the cabinet top (f3012–3017). It never comes out of the drawer and is never touched. The fist is about 200 px left of the drawer stub, grips nothing, and covers a neighbouring drawer's label.
  - [medium/motion_quality] No search beat, no anticipation before the pull, and no end-stop on the drawer (a 20-frame ease-in-out). The card appears by opacity. Everything finishes by f3022 and then freezes.
  - [high/static_hold] Still run f3020–3085 (2.2 s) on 'specific researcher's title? That might show up rarely,'.
  - [high/phone_readability] Card text is 20 px mono and 24 px serif at zoom 1.15. That is about 23/28 px on 1080p (cap height ≈15 px) and about 8–9 px on a 640x360 phone. 'KALAI, A. · 2001' and 'title:' are illegible on a phone. The card is about 285 px wide (15% of frame) and off-centre.
  - [medium/blank_space] The CAB framing (cx 1250) runs past the end of the set. A 175–185 px strip of bare teal wall sits at frame-right (x≈1745–1920) for about 7.5 s (f3010–3233), right next to the focal card and cabinet.
  - [medium/other] Eye-line: the clerk never looks at the card. His eyes point down-right at the hole for the whole s15 beat (f3010–3233).
  viewer_should_look_at: The card catalogue (index section), the drawer being pulled, then the card. Its blank 'title:' line becomes the focal point.
  what_it_should_communicate: Look up one specific fact. The record exists (KALAI, A. · 2001), but the title line is empty in what the model absorbed.
  what_actually_happens: - f2992–3010: push to CAB (1250,520, z1.15).
- f2996–3010: the right arm swings straight out to drawerPose, with no anticipation and no search. The forearm crosses the column-1 row-2 drawer and hides its label. The fist (x≈1130–1170, y≈630–680) sits on the seam between that drawer and the opening.
- f3002–3022: the column-2 row-2 drawer front translates 150 SVG units (≈172 px) to the right.
- A flat woodDeep rectangle (x≈1194–1366, y≈660–734) is drawn over its slot AND over the left half of the column-3 drawer, cutting that drawer's label in half.
- The slid front renders behind column 3. Only a ≈46 px stub with half a label pokes past the cabinet's right side (x≈1430–1478).
- f3012–3017: the card fades in by opacity only at x≈1106–1390, y≈394–530. Its bottom edge is about 20 px above the cabinet top (y 550), and it overlaps the third-shelf books. Nothing holds it.
- From f3010, a strip of bare teal wall (x≈1745–1920, y 0–920) shows the end of the library set at frame-right.
- f3020–3085: frozen, a 2.2 s still.
  V2 DIRECTION: Set fix first: extend the right bookcase with one more bay, to about world x 2400, so no S4 camera shows bare wall. Otherwise, at zoom 1.3 cx must stay ≤ about 1135 (the shelf end lands at screen x≈1771 for cx 1300).

Setup, on 'But': the clerk turns and takes two steps to the catalogue (the index section). The camera pushes to a medium on cabinet plus clerk (zoom ≈1.3, cx ≈1135, cy ≈560).

Action:
- 'one specific': his fingertip runs along the drawer label row, eyes following. It stops on a drawer labelled 'K' (letter ≥28 px on screen).
- 'researcher's': he leans back (4 frames of anticipation) and pulls with his fingers on the handle. The drawer slides OUT toward the viewer:
   - the front scales up about 8% and drops about 10 px
   - two woodLight side panels and a dark interior with card tops and a brass divider become visible
   - it eases out with a 4% overshoot and settles at full extension
   - no sideways travel, and no open black rectangle left in the cabinet face
- 'title?': he plucks one card up out of the drawer. It rises from inside with his fingers drawn over its top edge, and stays in his hand from here on.

Reaction: he examines the card (eyes down on it, brows up, head tilt 6°).

Camera, on 'title?': push to zoom ≈1.7 at about (1260,560), holding the card at chest height plus his face (visor ≥40 px below the top edge).
- Author the card at 1.3× art scale (26 px mono / 31 px serif, about 325 px wide), so 'KALAI, A. · 2001' renders ≥44 px and 'title:' ≥53 px.
- Draw the title line as an empty dashed coral box, the same style as the shelf gap, so the two gaps rhyme.

Secondary: the drawer's cards rattle once; the drawer sways 1 px after the stop; the clerk breathes and blinks.

Sound: finger taps along the label row; wooden drawer slide that slows to a soft end-stop thunk, plus a card rattle; paper slide as the card comes out.
## S4.7 1:42.1-1:44.7 (V1 f3062-3140) | That might show up rarely, or not at all.
  - [high/competing_attention] Three new text or graphic elements appear in three different places in the same 10 frames (gap far left, chip upper-left, footer bottom). Meanwhile the card sits top-right and the clerk is frozen in the centre. The eye has to cross about 1000 px of frame, and the gap has no visual link to the card.
  - [high/static_hold] Still run f3093–3157 (2.17 s) on 'up rarely, or not at all. And like a birthday,'.
  - [medium/overlap_or_clipping] The dashed gap outline is off-register with the slot (f3095–3235):
- the right dash runs through the neighbouring yellow book
- the left dash rides the teal spine's edge
- the bottom dash crosses the shelf board
The chip covers five spines' lower ends.
  - [medium/other] 'rarely, or not at all' is spoken by the narrator and printed twice at the same moment (coral chip plus footer). Redundant text.
  - [medium/phone_readability] The coral chip is about 26 px on 1080p, about 9 px on a phone. The footer is 26 px in a single 1180 px line, about 8.7 px on a phone. The guard-rail footer is the least readable text on screen.
  - [medium/unclear_when_muted] The slot has been visible and unmarked since f2563. Nothing shows a book being rare or absent; a dashed box just appears around a hole that was always there.
  viewer_should_look_at: The empty slot on the shelf, connected by eye-line to the blank title on the card.
  what_it_should_communicate: In the training data this specific title is rare or absent; that is why the card's title line is blank. The honesty guard rail (training exposure is unknown) is shown.
  what_actually_happens: - Card, clerk and drawer stay frozen.
- f3085–3095, all at once:
   - a dashed coral box draws around the empty slot at the far left (x≈386–486, y≈434–620)
   - a coral chip 'rarely, or not at all' (x≈190–476, y≈374–420) appears straddling the second shelf board, covering the lower ends of five second-shelf spines
   - the ink footer 'a birthday shows up rarely, or not at all · training exposure is unknown for these models' fades in at x≈370–1550, y≈976–1024
- f3093–3157: 2.17 s still.
- The box (92 px) is wider than the 70 px gap:
   - its right dash runs about 12 px into the yellow book beside the slot
   - its left dash sits on the edge of the teal 'hine Learr' spine
   - its bottom crosses the shelf board
   - its top floats about 40 px above the neighbouring book tops
  V2 DIRECTION: Restage: move the missing-book slot so that card, face and slot share one medium frame.
- It sits on the second shelf, above and slightly left of the clerk's head.
- Its bottom is ≥40 px clear of his visor in the S4.7 framing.
- It is clear of the middle upright (world x 960–986).
- Candidate: gapShelf 1, gapAt ≈0.53–0.57, checked at the S4.7 camera.
- Widen the slot to about 140 px world. BookRow hard-codes +70; make it a prop so the cake in S4.8 fits.

Setup: the clerk's eyes go from the dashed blank title line on the card up to the shelf. That eye-line is the cue.

Camera, on 'That might show up': a 0.4 s ease to a medium (zoom ≈1.3, cx ≤1135 unless the set is extended) holding card, face and slot together. No cross-frame jump.

Action:
- 'rarely,': a single thin pale book that has been in the slot since S4.1 flickers and thins.
- 'or not at all': it slides back into the dark and is gone.
- Then the dashed coral outline draws around the slot, registered exactly to the neighbouring books' edges and the board top.

Reaction: the neighbouring books lean 3° inward into the space and settle; the clerk frowns at his card.

Secondary: the honesty footer slides up from the bottom.
- Keep the wording exactly.
- ≥34 px, wrapped to two lines, ≥60 px side margins, ≥40 px clear of the clerk's soles.

Drop the duplicate coral chip, or make it a small tag hanging from the shelf edge under the slot. Never stage three text elements in three places at once.

Next development: the slot is now an empty, outlined space waiting for the cake.

Sound: a soft hollow wooden knock as the book disappears; marker squeak as the outline draws.
## S4.8 1:44.7-1:47.8 (V1 f3140-3233) | And like a birthday, there's no pattern to work it out from.
  - [medium/disconnected_or_floating] The cake does not rest on the shelf. It is drawn in front of the board with its plate about 35 px below the board top, and it overlaps the neighbouring yellow book. It reads as a sticker, not an object in the slot.
  - [medium/phone_readability] The cake is about 110 px wide (about 37 px on a phone) at the far-left edge, so the joke prop is tiny. 'no pattern to learn from' is about 24 px (about 8 px on a phone) and covers book tops.
  - [medium/static_hold] Still runs f3162–3186 (0.83 s) and f3191–3226 (1.2 s) around 'there's no pattern to work it out from'. Even the candle flame does not flicker.
  - [medium/other] No character reaction to the joke prop: same pose, eyes on the drawer hole. The chip wording 'to learn from' differs from the spoken 'to work it out from' (minor).
  viewer_should_look_at: The birthday cake landing in the gap, then the lack of any pattern around it.
  what_it_should_communicate: Callback joke. A specific title is like a birthday: an arbitrary fact that you cannot infer from patterns.
  what_actually_happens: - f3154: a cake spring-pops (scale 0→1 from bottom-centre) in the far-left slot. It is about 110x105 px.
- It is wider than the slot (x≈387–497 vs the slot's ≈392–462 opening). Its right side covers the bottom of the yellow neighbour book.
- Its body is drawn in front of the shelf board, with the plate about 35 px below the board top (plate y≈648 vs board top y≈612). It hangs off the shelf.
- f3162–3186: still (0.83 s).
- f3186–3196: chip 'no pattern to learn from' (22 px) fades in at x≈220–556, y≈655–700. It sits over the tops of the bottom-shelf books, off-centre to the left of the cake (chip centre x≈388, cake centre x≈442).
- f3191–3226: still (1.2 s).
- The candle flame is static.
- The clerk has been frozen in drawerPose since f3010 (about 7 s by f3226), arm out at shoulder height, and never looks at the cake.
  V2 DIRECTION: Setup: the outlined empty slot (widened to about 140 px world), with the clerk holding the blank card below it.

Action, on 'birthday,': the cake drops into the slot from above and lands ON the shelf board inside the outline:
- squash y 0.85 → 1.05 → 1.0 over 8 frames
- plate flush with the board top
- ≥160 px wide on 1080p
- ≥10 px clear of both neighbour books
The candle flame flickers from here to the end of the beat (background life).

Reaction: the clerk double-takes. His head snaps up to the cake, brows up, 'o' mouth, then he looks back down at the blank card.

Secondary, on 'no pattern': the light ripple from S4.2 runs along this shelf and stops dead at the cake. Neighbouring books stay lit; the cake stays unlit.

Next development, on 'to work it out from': the clerk shrugs with the card raised. A tag 'no pattern to learn from' hangs centred under the cake from the shelf edge (≥30 px; consider matching the spoken 'to work it out from').

Camera: hold the medium; at most a 3% push toward the slot. Cake, card and face stay in frame.

Sound: a comedic 'pop' on landing, a tiny 'fff' candle flicker, cloth rustle on the shrug.
## S4.9 1:47.8-1:50.2 (V1 f3233-3305) | So the model does what it was built to do.
  - [high/weak_transition] A mid-scene reset. Every element the viewer just learned to read is removed in about 20 frames (f3225–3247), starting before the sentence ends, and the clerk's pose resets. It feels like the scene restarted, and it throws away the 'gap' right before 'It fills the gap'.
  - [high/static_hold] Still run f3250–3307 (1.93 s) on 'So the model does what it was built to do. It fills'.
  - [medium/camera_hurts] The move to SLIPCAM happens under the reset and reveals nothing. The resulting frame is shelf wallpaper plus an idle clerk.
  - [medium/unclear_when_muted] Muted, there is no sign of a decision or of 'doing its job'. A man just stands there.
  viewer_should_look_at: The clerk, standing in for the model, deciding to do what it always does: look at the blank, then at the shelves.
  what_it_should_communicate: The model is not broken. It does its normal job (continue the pattern) even when the fact is missing.
  what_actually_happens: - From about f3225, during 'from.' (f3220–3231) and before the s15 sentence has finished, the s15 layer is taken down:
   - gap outline, cake, both chips and the footer fade out (gone by about f3236)
   - the card ghosts at about 50% over the books at f3236, then vanishes
   - the drawer shuts f3235–3247 (a dark sliver still shows at f3240)
   - the clerk drops from drawerPose to the idle 'look' pose (f3233–3245)
- At the same time the camera reframes to SLIPCAM (1180,520, z1.3), f3233–3249.
- f3250–3307: 1.93 s still medium shot of the clerk beside a closed cabinet against the shelves. The top-shelf books are cut along the top edge.
- The empty slot is still visible but unmarked, at x≈395–480, y≈470–620.
  V2 DIRECTION: No reset. The card (with its dashed blank title) stays in his hand, and the gap and cake stay on the shelf.

Setup, on 'So the model': he looks at the blank line, then up at the full shelves.

Action, on 'does what it was built to do': his expression shifts from puzzled to confident (brows level, smirk, small chin-up). On 'built to do' he taps the card twice on the cabinet top to square it, like a clerk about to fill in a form, then raises it to chest height. This uses the existing props and gives two sound hits.

Secondary: the s15 elements leave in sequence, never together, and only after 'from.' ends:
- the footer drops away first
- the drawer slides shut under his elbow with a soft thunk (ease-in, small bounce)
- the cake dims to about 60% but stays in its slot

Next development: the five source spines for the title words are already in this frame, and one glints as his eyes land on it.

Camera: a slow 1.3 → 1.4 push centred between the card and the shelves he will pull words from. The push says 'here it comes'. Respect the set-edge limit from S4.6.

Sound: drawer close thunk; two paper taps on wood; room tone.
## S4.10 1:50.2-1:52.8 (V1 f3305-3384) | It fills the gap with a title-shaped answer.
  - [high/disconnected_or_floating] The 'gap' being filled is not the gap the viewer was shown. The actual empty slot is in this very frame (x≈395–480, y≈470–620), unmarked, and 'Algorithms,' launches right next to it and flies away. The words go into the clerk's chest, so the central metaphor of the scene does not land.
  - [high/motion_quality] No assembly: chips vanish on arrival, and a pre-made slip crossfades on top. f3340–3342 shows face, chips and slip ghosting through each other.
  - [high/character_cut] From f3337 to the end (about 9.2 s) the slip hides the clerk's head and torso. The confident clerk has no face for the confidence beat. His hands sit behind the slip's bottom edge as two blobs instead of gripping it.
  - [high/overlap_or_clipping] Flying chips pass directly over the clerk's eyes (f3320), mouth (f3325) and chin (f3330), and stack on each other over his face (f3335). They also cross the cabinet (f3330).
  - [medium/other] Acting contradicts the line. holdPose (f3325–3335) is arms out at shoulder height with palms up, a shrug, played under 'It fills the gap', which should read as confident.
  - [medium/offscreen_or_cropped] 'Boosting,' starts off-screen (world 300,120) and enters through the top-left corner, half-cut by two edges. 'and Other Topics in' grazes the top edge. None of the words come from a visible book.
  - [medium/overlap_or_clipping] The footer chip's top edge (y≈972) butts the clerk's shoe soles (y≈970) directly above it, f3345–3612. He appears to stand on the caption.
  - [medium/static_hold] Still run f3349–3402 (1.8 s) on 'a title-shaped answer. And the confidence comes'.
  viewer_should_look_at: Pattern words leaving the shelf spines and landing, in order, in the blank title line, which then becomes the polished answer slip.
  what_it_should_communicate: The answer is assembled from common title fragments ('Boosting, Online Algorithms, and Other Topics in Machine Learning'). It fits the shape, not the fact.
  what_actually_happens: - f3307–3345: five paper chips fly on arcs, staggered 5 frames, from fixed world points to the clerk's chest (world 1235,560).
- 'Boosting,' starts off-screen at world (300,120) and enters through the top-left corner, cut by both the left and top edges ('oosting,' at x≈0–140, y≈0–80, f3310–3314).
- 'Algorithms,' starts right beside the visible empty slot (x≈120–410, y≈480–580 at f3320; the slot is at x≈395–480) and flies AWAY from it to the clerk.
- 'and Other Topics in' passes about 10 px under the top edge (x≈1360–1790, f3325).
- The chips cross his face frame by frame:
   - f3320: 'Boosting,' across his eyes and visor
   - f3325: 'Online' over his mouth
   - f3330: 'Algorithms,' over his chin, with 'Machine Learning.' diagonally across torso and cabinet
   - f3335: 'and Other Topics in' and 'Machine Learning.' overlap each other over his face
- f3321–3335: holdPose flings both arms out to shoulder height, palms up (hands at x≈800 and ≈1220). It reads as a shrug.
- Each chip disappears the frame it arrives.
- f3337–3351: the slip fades and scales in (opacity 0→1, scale 0.8→1) over the clerk. At f3340–3342 it is semi-transparent, with face, hands and the last chip ghosting through, and 'achine Learn…ng.' poking out past the slip's right edge.
- From f3337 the 470 px slip (x≈710–1320, y≈410–690) covers his head and torso until scene end. Two hand blobs emerge from behind its bottom edge.
- f3341–3351: the footer 'a title-shaped answer · simplified illustration' fades in at y≈972–1020, its top edge butting his shoe soles (y≈970).
- f3349–3384: still (part of a 1.8 s run to f3402).
  V2 DIRECTION: Setup: five spines inside the S4.9 frame carry 'Boosting,', 'Online', 'Algorithms,', 'and Other Topics in' and 'Machine Learning.'. All are fully inside the frame, ≥60 px from every edge.

Action, from 'fills':
- Each spine in turn tips out 4°, and its word peels off as a paper strip.
- Each strip arcs into the card's dashed title box, 5–6 frames apart, and lands in reading order with a 1-frame bounce. The box fills left to right.
- Paths come in above or beside his head and never cross his face. Arc apex ≥40 px from his visor.

At the same time a dotted line (or a quick glance) links the filled card back to the empty shelf slot with the dimmed cake. The fill is visibly 'instead of' that missing book.

Reaction, on 'title-shaped': the clerk flips the card toward camera, and it upgrades into the polished ChatGPT slip in one continuous move:
- frames 0–4: scaleX 1→0
- swap to the slip art
- frames 4–10: scaleX 0→1 while it scales from card size to about 1.9×
- the gold border draws on
- the header 'ChatGPT' with 'GPT-4o · published excerpt' and the prefix '…is entitled:' appear; the title words are already in place
- no crossfade, no ghosting
His expression: confident grin, chin up. Replace holdPose's open-palms shrug with a one-hand presenting grip.

Staging rule from here to the end:
- He holds the slip in his near hand, out to his side.
- Slip centre about 250 px right of his face; its left edge ≥30 px clear of his cheek; slip angled -4°.
- His fingers are drawn over the slip's left edge (hand layer above the slip).
- Face, torso and feet stay visible for every reaction.
- Slip body font about 30 px, so it renders ≥42 px at zoom 1.4.

Camera: zoom ≈1.4, centred between face and slip, cy ≈600, so his soles land at y≈890.

The footer swaps in place to 'a title-shaped answer · simplified illustration':
- ≥32 px
- at y≈940–990, ≥40 px below the soles
- ≥60 px side margins

Secondary: the emptied spines settle back with a small wobble. The cake stays dim in its slot (the fact is still missing).

Sound: five paper peels with tiny whips, five landing ticks, a crisp paper snap plus a short gold sparkle for the upgrade.
## S4.11 1:52.8-1:56.1 (V1 f3384-3482) | And the confidence comes with it, because that's part of the pattern too.
  - [high/static_hold] Still run f3409–3485 (2.57 s) on 'confidence comes with it, because that's part of the pattern too. “Is'. The explanatory half of the sentence ('part of the pattern too') has no visual.
  - [medium/motion_quality] The seal only fades and shrinks in. With no anticipation, no impact, no squash and no slip response, it lacks the weight of an emphatic stamp.
  - [high/character_cut] The confidence beat belongs to the confident clerk's face, which is fully hidden behind the slip.
  - [medium/phone_readability] 'IS ENTITLED' on the seal is about 29 px on 1080p, about 9.6 px on a phone. The slip's model label 'GPT-4o · published excerpt' is about 20 px (cap ≈13 px) in grey on cream. That is about 6–7 px on a phone and low-contrast: the model-label guard rail is effectively invisible.
  viewer_should_look_at: The seal landing on the slip and the clerk's confident face; then the link back to the shelves (confidence is learned too).
  what_it_should_communicate: Confident phrasing is also a learned pattern. The certainty is borrowed from the data, not earned by knowing the fact.
  what_actually_happens: - Still until f3402.
- f3402–3409: the 'IS ENTITLED' gold seal springs in at the slip's top-right corner (x≈1200–1370, y≈330–500): opacity plus scale 1.5→1, rotated -10°. It is semi-transparent over the books at f3405. Timing on 'confidence' (f3398) is good.
- The seal overlaps the cabinet's top-left corner and the third-shelf books.
- f3409–3482: frozen, the 2.57 s run to f3485 (second-longest in S4).
- The clerk is hidden behind the slip; there is no reaction anywhere.
  V2 DIRECTION: Setup: slip held at his side at chest height, face visible (S4.10 staging rule).

Action, on 'confidence': the seal comes down like an embosser:
- rises 30 px (4 frames of anticipation)
- slams (2 frames)
- squashes 10% on the slip's top-right corner
- the slip dips 6 px in his hand and recoils
- settles over about 8 frames
The seal's top edge must stay ≥40 px below the frame top.

Reaction: the clerk puffs his chest, lifts his chin and grins smugly. This is the confident counter clerk.

Secondary, on 'part of the pattern too': a quick gold glint ripples across several pattern spines on the shelf behind him, matching the seal's glint, so the confidence visibly comes from the same shelves. The seal's shine then sweeps once.

Next development: he tilts the slip slightly toward camera, ready for 'Is entitled'.

Camera: a slow push from 1.4 to 1.5 on slip plus face over the sentence. It is motivated: the confidence lives in the wording.

Readability:
- seal text ≥36 px on 1080p
- header detail line ≥30 px, in ink rather than grey

This fills V1's 2.57 s dead hold.

Sound: a heavy embosser thunk with a short metallic tail; a soft shimmer for the glint ripple.
## S4.12 1:56.1-2:00.6 (V1 f3482-3618) | “Is entitled.” No “I think.” No “maybe.”
  - [medium/competing_attention] The eye is pulled three ways: highlight at the slip's left, seal at top-right, hedge cards at the far right over the cabinet. No single element leads on each word.
  - [medium/disconnected_or_floating] The 'I think' and 'maybe' cards float in from nowhere over the cabinet ('maybe' hangs about 50 px off its right side) and simply sit there struck out. They never relate to the sentence they are missing from.
  - [medium/static_hold] Still runs f3494–3539 (1.53 s), f3546–3572 (0.9 s) and f3579–3606 (0.93 s). Each word's element appears, then everything waits.
  - [medium/weak_transition] The exit wipe starts about 2 frames after 'maybe.' ends, so the button gets no air. The wipe erases '…is entitled:' first and then shows an empty corkboard for about 0.3 s before S5's page arrives. The camera pull-back from f3612 is wasted under the wipe, and nothing links the fake title to the actual record.
  viewer_should_look_at: The phrase '…is entitled:' on the slip, then the hedge words being rejected.
  what_it_should_communicate: The answer is stated as fact. The hedges a careful writer would add are absent.
  what_actually_happens: - f3487–3497: a pale saffron highlight sweeps '…is entitled:' on the slip (about 35 px text; low contrast against cream).
- f3494–3539: still (1.53 s).
- f3539–3551: an 'I think' card rises 20 px and fades in to the right of the seal (x≈1395–1590, y≈478–560). It overlaps the cabinet's top-right corner and the third-shelf books, touching nothing. Strike f3549–3559.
- f3546–3572: still (0.9 s).
- f3572–3584: a 'maybe' card (rotated 4°, x≈1450–1640, y≈600–690) appears over the column-3 drawers and pokes about 50 px past the cabinet's right side. Strike f3582–3592.
- f3579–3606: still (0.93 s).
- 'maybe.' ends at f3604; about 2 frames later (f3606) a hard wipe from the left starts. Its edge reaches mid-frame at f3612 and erases the slip's left half — the just-highlighted '…is entitled:' — first.
- The wipe reveals S5's empty pink wall and blank corkboard. S5's title page only fades in at f3622–3626, so an empty set holds for about 0.3 s.
- S4's SLIPCAM pull-back starts at f3612, already under the wipe.
  V2 DIRECTION: Action, on '“Is entitled.”': a saffron highlighter sweeps '…is entitled:' left to right in 10 frames, in a deeper saffron than V1 so it reads on cream. The camera is at its tightest here (slip text ≥44 px).

On 'No “I think.”': a small hedge tag 'I think' slides in toward the start of the sentence as if to clip on. The clerk flicks it away with his free hand. A coral strike slashes through on 'think', and the tag tumbles out of the bottom of frame with rotation (follow-through).

On 'No “maybe.”': the same move from the other side, faster: strike, drop.

Reaction: after each flick, an eyebrow raise and a satisfied slow blink.

Secondary: the slip sways 1–2° in his hand after each flick; the seal glints once.

Keep the struck tags in frame only until they fall: one leading element per word. They never sit over the cabinet.

Next development: about 12 frames of deliberate quiet after 'maybe.' (a smug blink), then the transition. He slides the slip out toward frame-left; that lateral move carries the wipe into S5 (see transition_out).

Sound: marker swipe for the highlight; finger flick, strike swipe and paper flutter for each tag (the second pitched up and quicker); paper slide on exit.

## SCENE PROBLEMS
  - static_hold high 22.4 of 35.0 s is still (64%), across 13 runs:
- f2611–2691 (2.7 s)
- f2764–2814 (1.7 s)
- f2928–2985 (1.93 s)
- f3020–3085 (2.2 s)
- f3093–3157 (2.17 s)
- f3162–3186 (0.83 s)
- f3191–3226 (1.2 s)
- f3250–3307 (1.93 s)
- f3349–3402 (1.8 s)
- f3409–3485 (2.57 s)
- f3494–3539 (1.53 s)
- f3546–3572 (0.9 s)
- f3579–3606 (0.93 s)
Every beat is pop → freeze. The worst holds fall on the lines that carry the argument: 'Think about what the model learned from', 'Shelf after shelf, the same shape', 'That might show up rarely', 'So the model does what it was built to do' and 'because that's part of the pattern too'. The only motion during holds is a 1 px breathing scale on the clerk's torso.
  - character_cut high The clerk is the scene's actor but is mostly unusable:
- head-and-collar wedged into the bottom-right corner, cut by two edges, at SHELF_A (f2745–2815)
- cut at the chest by the bottom edge at SHELF_B (f2860–2904)
- frozen with his arm out at shoulder height for about 7.5 s at CAB (f3010–3233)
- head and torso hidden behind the slip f3337–3612 (about 9.2 s, 26% of the scene)
He has only three held poses (look / drawerPose / holdPose). He never looks at the card, the gap or the cake, and never reacts.
  - disconnected_or_floating high Nothing physical connects:
- word chips are not on their spines and hide other spines' words
- the drawer is a flat dark rectangle over one and a half slots, with its front hidden behind its neighbour
- the card floats about 20 px above the cabinet
- the fist rests on a drawer seam
- the cake hangs below the shelf board and overlaps a book
- flying words come from empty air (one off-screen) and vanish
- the slip's hands are blobs behind its bottom edge
- the hedge cards float over the cabinet
The brief's library chain (search → index section → pull drawer → card slides out → examine → card info is focal) is missing at every link.
  - weak_transition high Mid-scene reset at about f3225–3247. All s15 elements fade out, starting during 'from.' before the sentence ends; the drawer snaps shut and the clerk's pose resets. The two 'gaps' the viewer learned (the shelf slot and the blank 'title:' line, never visually linked) are gone before 'It fills the gap'. The fill then lands on neither, while the real empty slot sits unmarked in the frame (x≈395–480).
  - camera_hurts medium The camera goes back and forth without building geography:
- WIDE (f2563–2725)
- SHELF_A z1.5
- pan to SHELF_B
- WIDE (f2904–2922)
- CAB z1.15 (f2992–3010)
- SLIPCAM z1.3 (f3233–3249)
- pull-back hidden under the exit wipe
Pushes frame wallpaper instead of action, and key elements are scattered (gap far left, card top right, footer bottom).

CAB at cx 1250 runs off the end of the set, exposing bare wall at x≈1745–1920. The V2 medium framings proposed (zoom 1.3 at cx 1300, zoom 1.4 at about cx 1290) would expose it again (shelf end at screen x≈1770–1820). Extend the right bookcase by one bay (to about world x 2400), or cap cx at about 1135 for zoom 1.3.
  - phone_readability high The beat's focal text fails at 640x360:
- card 'KALAI, A. · 2001' about 8 px and 'title:' about 9 px
- 'no pattern to learn from' about 8 px
- model label 'GPT-4o · published excerpt' about 6–7 px, grey on cream
- both guard-rail footers about 9 px (the birthday footer is a single 1180 px line)
  - competing_attention medium Several moments stage text in different parts of the frame at once:
- f3085–3095: gap outline, coral chip and footer appear together while the card holds top-right
- f3487–3592: highlight (left), seal (top right) and hedge cards (far right)
Also, after f2711 the whole wall is a pastel wash dotted with dozens of saturated, white-lettered pattern spines. The card (f3016–3233) and slip (f3337–3612) sit straight on that busy pattern, with no value or depth separation (no dim or soft halo behind the focal prop).
  - unclear_when_muted medium Muted, the argument does not read:
- 'everywhere' and 'shelf after shelf, the same shape' have no visual
- 'rarely, or not at all' is a dashed box around a hole that was always there
- 'fills the gap' shows words hitting a man's face and chest, away from the visible gap
- 'part of the pattern too' shows nothing
  - motion_quality medium Motion has no weight:
- the walk-in is a 1485 px skate in 40 frames (up to about 64–75 px per frame) with a 4.8 Hz |sin| jitter and a dead stop
- entrances are opacity/translate ramps with no anticipation; only the cake and seal use springs
- the drawer has no end-stop and closes in 12 frames
- fly chips disappear on arrival, and the slip crossfades over them
There is no background life (no flame flicker, no settling books, no parallax drift during holds).
  - overlap_or_clipping medium - Dashed gap box overlaps the yellow neighbour book by about 12 px, rides the teal spine and crosses the shelf board.
- Cake is wider than the slot, overlaps the yellow book, and its plate sits about 35 px below the board top.
- Fly chips cross the clerk's eyes, mouth and chin (f3320–3335).
- Semi-transparent slip ghosts the face and a chip (f3340–3342).
- The title-shaped footer butts the clerk's shoe soles (f3345–3612).
- The 'maybe' card sits over the cabinet drawers and pokes 50 px past its side.
- The clerk's hand is 10 px from the cabinet edge in the wide.
  - blank_space low - In both WIDE holds (f2563–2725 and f2922–2992) the floor band y 840–1080 (about 22% of the frame) is empty flat tan, while clerk and cabinet are bunched at right.
- At CAB a 175–185 px strip of bare wall at frame-right shows the edge of the set (f3010–3233).
  - other low Small text and art issues:
- spine words clipped by narrow books ('hine Learr', 'pproache', 'lgorithm')
- 'no pattern to learn from' vs the spoken 'to work it out from'
- 'rarely, or not at all' printed twice at once
- the headline 'What the model learned from' runs about 2.9 s ahead of the narration
- the empty slot is visible unmarked from f2563, most prominently at the centre of the SHELF_A push, so its later 'discovery' is spoiled

## TRANSITION IN
Now:
- A 12-frame hard-edged vertical wipe (f2557–2569) reveals the library, its edge travelling right to left over S3's last frame.
- S3's last frame shows the token sentence ('…dissertation (completed in … 2002 at CMU) is entitl…'), cut by both frame edges. Token row is at y≈630–675; belt top at y≈712.
- An empty library holds for about 0.5 s (f2566–2582).
- Then the clerk skates in from the left, against the wipe direction.

A motivated transition fits ('token becomes part of another element'). In V1 S3's belt top (y≈712) and S4's nearest shelf board (WIDE third board at y≈592) are about 120 px apart, so one side must move. In the last ~15 frames of S3:
- The camera trucks right along the belt and tilts down about 120 px, so the belt top lands at y≈592. Alternatively, S4 opens at cy ≈420 with the third board at y≈712 and eases up to its establishing framing as the clerk enters; that tilt reveals the tall shelves.
- The wipe edge travels with the truck (left to right), so the belt line continues as the shelf board.
- One token chip ('dissertation') rides across the seam, tips up 90° and slots into the shelf as a book spine, with a wooden tock.

The clerk's walk-in then starts on 'So' (f2573) in the same screen direction, left to right, so motion carries across the cut.

Keep the transition to about 0.6 s and no whoosh: the tock is the sound. This also removes the 0.5 s of empty set.

## TRANSITION OUT
Now: 'maybe.' ends at f3604. About 2 frames later (f3606) a hard wipe from the left starts. Its edge reaches mid-frame at f3612 and erases the slip's left half ('…is entitled:') first. It reveals S5's empty pink wall and blank corkboard, and the thesis title page only fades in at f3622–3626 (about 0.3 s of empty set). S4's camera pull-back (from f3612) is hidden under the wipe. The transition is unmotivated and gives the 'No maybe' button no air.

A motivated transition fits: the fake makes way for the real.
- After about 12 frames of intentional quiet (the clerk's smug blink), he slides the sealed slip out toward frame-left with a paper whoosh.
- The camera trucks with it, and the wipe's leading edge is the slip's trailing edge, so the slip exits whole rather than being sliced.
- S5's desk and corkboard arrive in the same lateral move, with the real thesis title page already pinned at centre on 'Here's the actual record'. No empty corkboard frame.

Coordinate with S5: its later slip entrance (the comparison at 'ChatGPT got…') should re-enter from the same left side, so screen direction stays consistent (fake exits left, returns from left).

Alternative if S5 cannot change its opening: push into the slip's title line and match-cut to S5's title box at the same screen position (S5 then pulls out to the page).

## SOUND MOMENTS
[
 "f2557–2569 (transition in): token chip slots into the shelf as a spine: wooden 'tock'",
 "f2573–2621 ('So why would the likely answer'): clerk walk-in: about 6 soft footsteps on wood, with a heel scuff on the stop",
 "f2660 ('Think', V2 headline entrance): sign card drops onto its strings: light paper tap plus a tiny string creak",
 "f2691 ('learned'): pattern spines brighten in a ripple: soft cascading wooden ticks (not a whoosh)",
 "f2725–2810 ('The sound of a dissertation title is everywhere', V2): fingertip patter along spines, plus footsteps during the truck",
 "f2816 / f2835 / f2871 ('Methods.' 'Algorithms.' 'Machine Learning.'): book slides out plus chip pop, 3 times, rising pitch",
 "f2912–2981 ('Shelf after shelf, the same shape', V2): four cascading wooden ticks, one per shelf; cloth rustle on the clerk's gesture",
 "f2996–3024 ('But one specific', V2): two steps to the cabinet, then light finger taps along the drawer labels",
 "f3027–3041 ('researcher's'): drawer pull: wooden slide with friction that slows, soft end-stop thunk, cards rattling inside",
 "f3046–3053 ('title?'): card lifted out of the drawer: paper slide/fwip",
 "f3087–3130 ('rarely, or not at all'): book vanishing from the slot: soft hollow wooden knock; dashed outline drawn: marker squeak; footer slides up: faint paper slide",
 "f3154 ('birthday,'): cake lands in the slot: comedic pop with squash; candle 'fff' flicker under the rest of the line",
 "f3188 ('no pattern'): ripple stops dead at the cake: muted tick; tag hangs from the shelf edge: small paper tick",
 "after f3231 ('So the model…'): drawer pushed closed: soft wooden thunk",
 "f3275–3301 ('built to do', V2): two paper taps as he squares the card on the cabinet top",
 "f3311–3345 ('It fills the gap'): five words peel off spines: paper peels with small whips, then five landing ticks in the title box",
 "f3345–3359 ('title-shaped'): card flips and upgrades into the polished slip: crisp paper snap plus a short gold sparkle",
 "f3398–3405 ('confidence'): seal embosser slam: heavy low thunk with a short metallic tail; slip recoil rustle",
 "f3446–3475 ('part of the pattern too', V2): gold glint ripple across the shelf spines: faint shimmer",
 "f3487–3518 ('Is entitled'): highlighter sweep: marker swipe",
 "f3530–3559 ('No I think'): finger flick, strike swipe, tag flutter and drop",
 "f3568–3604 ('No maybe'): finger flick, strike swipe, tag flutter and drop (pitched up, quicker)",
 "about f3616 (exit, after about 12 frames of quiet): slip slides out frame-left: paper slide that carries into S5",
 "Throughout: very low library ambience under the narration (soft room air, a distant page turn, a slow clock tick); music at explanation-quiet level"
]

## PHONE-CRITICAL TEXT
[
 "Headline 'What the model learned from': 60 px screen-space, about 20 px on a 640x360 phone. SURVIVES. In V2 it must not appear before 'Think'.",
 "Shelf chips 'Methods.' / 'Algorithms.' / 'Machine Learning.': 30 px at depth 0.7 under zoom 1.5, about 36–40 px on 1080p, about 12–13 px on phone. SURVIVES. V2: keep at least this size when tethered to spines.",
 "Catalogue card 'KALAI, A. · 2001': 20 px mono at CAB zoom 1.15, about 23 px on 1080p (cap ≈15 px), about 8 px on phone. FAILS. This is the beat's focal text; V2 needs ≥44 px on 1080p (1.3× card art at zoom ≈1.7).",
 "Catalogue card 'title:' with blank lines: 24 px serif, about 28 px on 1080p, about 9 px on phone. FAILS. V2 ≥50 px, with the blank drawn as a dashed coral box.",
 "Drawer label 'K' (new in V2): must be ≥28 px on 1080p so the 'finds the index section' beat reads.",
 "Chip 'rarely, or not at all': 24 px at depth 0.7 (z≈1.1), about 26 px on 1080p, about 9 px on phone. MARGINAL, and redundant with the footer.",
 "Chip 'no pattern to learn from': 22 px, about 24 px on 1080p, about 8 px on phone. FAILS. V2 ≥30 px, hung centred under the cake from the shelf edge.",
 "Guard-rail footer 'a birthday shows up rarely, or not at all · training exposure is unknown for these models': 26 px screen-space in a single 1180 px line, about 8.7 px on phone. FAILS. Keep the wording; V2 ≥34 px on two lines with ≥60 px margins.",
 "Flying title words ('Boosting,' 'Online' 'Algorithms,' 'and Other Topics in' 'Machine Learning.'): 28 px × 0.8–1.1 × zoom 1.3, about 29–40 px on 1080p, about 10–13 px on phone. Transient; SURVIVES only if paths stay clear of the face and of frame edges ('Boosting,' currently enters cut by two edges).",
 "Slip header 'ChatGPT': 24 px × 1.3, about 31 px on 1080p, about 10 px on phone. MARGINAL, survives.",
 "Slip model label 'GPT-4o · published excerpt' (guard rail): about 20 px on 1080p (cap ≈13 px) in grey on cream, about 6–7 px on phone. FAILS on both size and contrast. V2 ≥30 px on 1080p, in ink.",
 "Slip body '…is entitled: “Boosting, Online Algorithms, and Other Topics in Machine Learning.”': 27 px × 1.3, about 35 px on 1080p, about 12 px on phone. SURVIVES. V2: 30 px art at zoom 1.4–1.5 gives ≥42–45 px on 'Is entitled'.",
 "Seal 'IS ENTITLED': 22 px × 1.3, about 29 px on 1080p, about 9.6 px on phone. MARGINAL (the large gold disc helps). V2 ≥36 px.",
 "Guard-rail footer 'a title-shaped answer · simplified illustration': 28 px screen-space, about 9.3 px on phone. MARGINAL, and it currently butts the clerk's soles. V2 ≥32 px, ≥40 px below the feet.",
 "Hedge tags 'I think' / 'maybe' (struck): 34 px × 1.3, about 44 px on 1080p, about 15 px on phone. SURVIVES.",
 "Book spine words (Methods, Algorithms, Theory, Online…): 18 px at depth 0.7, about 13–27 px on 1080p depending on zoom, about 5–9 px on phone. Environmental and may stay small; only the called-out spines need to read."
]

# V1 shot review — S3: The token machine (conveyor, NEXT-CHUNK SCORER, roll-out, likely vs true, add-on modules). Narration s08–s12. V1 global frames 1331–2563 (0:44.4–1:25.4). Reviewed from the S2→S3 wipe (about f1326) to the end of the S4 wipe (f2569). Every finding was checked against full-resolution frames pulled from Video_01_Pass_2/exports/Future_Got_Weird_Video_01_Pass_2_1080p.mp4, not only against the 480x270 tiles.

What S3 does for the story: it opens the explanation. It takes ChatGPT's wrong answer from the cold open and puts it into the machine that produced it. Text is built from tokens: real GPT-4o o200k_base tiles, with 'Kalai' split into ' Kal' + 'ai'. A scorer ranks candidate next chunks and picks one, the answer rolls out piece by piece, and the scores measure likelihood, not truth. Add-ons (instruction training, reasoning, sometimes web search) sit on top of the same piece-by-piece process. This sets up 'likely ≠ true' for S4–S10.

Biggest execution problems:
(1) Static 70% of the time. 28.8 of 41.1 s fall in 18 still runs of at least 0.8 s. The longest is 3.8 s (f2054–2167, 'Here, it's choosing the last digit of the year. Those scores say which chunk is likely.'). The big motion peaks are camera moves (f1779, f1955, f2037, f2262) and the split (f1473). The machine barely moves, and the belt and rollers never move at all.

(2) The machine's geometry is broken, so the cycle can't read.
- The chute (world x≈1550–1604) hangs over the 'in' tile, about 250 world px (≈300 screen px in HOPPER) left of the empty slot after '200'.
- Its lower end is buried behind the tile row: behind 'in' at f1800, and skewering the gap between 'CM' and 'U' at f2060 and f2300.
- The tokens never touch the belt. They hover 28–44 px above it in every framing (f1520, f1650, f2300). The slip floats 56 px above it (f1360).
- The pick is a SAFFRON duplicate '2'. It spins 360° across the bars and disappears behind the 'completed' tile (f1905), while a BLUE '2' pops in about 430 screen px to the right.
- During the roll-out the scorer shows a stale list with an empty top slot.

(3) Cropping and the camera.
- The right end of the sentence is off-frame in TRACK ('complet', f1480–1610), in KALCAM ('disser') and in every WIDE frame from f1965 on ('entitle'; ':' off-frame).
- In WIDE the left end is cut too. 'Adam' is sliced to 'm' at f1970, and 'Adam Ta uman' stay off the left edge through f2563, so the person's name leaves the frame.
- Only the s10 HOPPER framing (f1797–1960) shows the sentence tail.
- Exactly when 'Token after token' starts (f1955), the camera pulls back to WIDE. New tokens land at or past the right edge, so roll-out clicks 5 and 6 (f1991, f1997) sound for tiles nobody can see.

(4) The logic of s11 is broken. 'Here, it's choosing the last digit of the year' plays over a sentence that is already 7 tokens past that choice. The scorer hard-swaps back to the digit list at f2041, and nothing links the scorer's '2' to the '2' tile.

(5) Readability, layout, continuity and sound.
- 'illustrative numbers' is ≈7.5 px on a phone, and the slip's 'GPT-4o · 9 May 2025' is 16 px (≈5 px on a phone).
- The 5th candidate row overflows the panel and hides '7%'.
- The s11 cards sit 22 px from the left frame edge at 35–40% opacity for 4–6 s.
- Modules 1–2 float in the sky. Module 3 hovers about 10 px above the housing roof without touching it.
- The slip arrives clean, without the WRONG stamp and year/title marks it carried at the end of S1 (f800).
- Three 'piece by piece' tile clicks (f2526–2536) play over a frozen frame, because `pieceT` is computed but never used.

Corrections to the first-pass review:
- In TRACK the sentence sits at y≈600–650, so the top ~55% of the frame is empty, not 'y≈850 / top 75%'.
- The sentence tail IS visible in HOPPER f1797–1960. It is cropped everywhere else, and in WIDE both ends are cut.
- The ramps for scorer appearance, bars and modules are ease-out, not linear.
- The flying '2' crosses row '5', not row '3', and ends hidden behind 'completed'.
- The list swap happens at ≈f1930, not f1934.
- The slip's detail label is 16 px, not 12–14 px.
- The TRACK pipe stub is 20x160 px at x 1827–1847.
- The 'fragments' chip sits under uman/Kal, nowhere near Ph/.D.
- Module 3 is not off to the side. It hovers just above the left part of the housing roof.
- Two first-pass directions were impossible or contradictory. With V1 tile metrics, zoom 1.15–1.2 cannot hold all 15 tiles with 80 px margins: the row is ~1,670 world px. And continuing with ' “Boost…' in S3.11 contradicted the S3.8 rewind. V2 now restores the sentence in the S3.9 pause.

## S3.1 0:44.2-0:46.4 (V1 f1325-1391) | Let's take ChatGPT's answer (Let's@1340, take@1350, ChatGPT's@1355–1379, answer@1381–1388)
  - [medium/disconnected_or_floating] f1352–1390: the slip's bottom edge is at y≈655 and the belt top at y≈710, so it floats 56 px above the conveyor with a drop shadow on the empty wall. V1's own SFX cue is named 'the slip unfolds on the track', but the slip is never on the track.
  - [medium/other] Continuity: at the end of S1 (f800) the ChatGPT slip carries a red WRONG stamp, a circle around '(completed in' and underlines on '2002' and the title. In S3 (f1340–1390) it is pristine, so 'ChatGPT's answer' reads as a new document, not the wrong answer we just watched being stamped.
  - [medium/offscreen_or_cropped] f1337–1345: the slip enters halfway through the left frame edge (a sliver at x≈0 at f1337, the left 30% cut at f1340). This is the brief's 'prop entering from the edge for no reason', and it comes right after a wipe that already brought the scene in from the left.
  - [medium/blank_space] WIDE f1340–1385: the slip (520x265 px) fills under 7% of the frame. The upper 35%, the whole right half below the stub, and the floor band (y 862–1080) are empty.
  - [medium/phone_readability] Slip header: 'ChatGPT' is 23 px and 'GPT-4o · 9 May 2025' is 16 px (Slip detail = 0.62 x fontSize 26), which is ≈5 px on a 640x360 phone. The body is 26 px (≈9 px). The model/date guard-rail label can't be read here.
  - [low/disconnected_or_floating] The vertical pipe stub (x 1500–1525) hangs with nothing attached until the scorer appears at f1785, about 15 s later. It reads as a broken fixture.
  - [low/static_hold] f1353–1385 (1.1 s): the slip is parked in mid-air while 'ChatGPT's answer' is spoken. Nothing on the machine or belt reacts.
  - [low/motion_quality] The arrival is a single ease-out slide with no overshoot, settle or contact. It has no sound of its own: the wipe whoosh is synced to f1331 and the 'unfold' slide to f1403.
  viewer_should_look_at: ChatGPT's answer slip from the cold open: the same slip, with its WRONG stamp and marks and the model label 'ChatGPT · GPT-4o · 9 May 2025', arriving on the belt under the machine that wrote it.
  what_it_should_communicate: We are taking the exact answer we just saw and putting it into the machine that produced it. The mood is a workshop inspection.
  what_actually_happens: f1326–1336: a hard, straight-edged mask wipe runs left to right. It has no paper edge or shadow, and the ident is masked, not pushed. It moves from the saffron FUTURE GOT WEIRD ident into an EMPTY conveyor room. The room holds:
- a ceiling pipe (x 80–1838, y 62–85);
- a vertical stub at x 1500–1525, y 88–285, with nothing hanging on it;
- a flat slate belt (y 710–736) with 18 static roller dots under it and no legs or frame;
- a beige floor from y 862 to 1080 (20% of the frame).
f1336–1352: the slip (520 px wide, body 26 px) slides in from off-frame left (x -700→160, -4°→0°, ease-out) and stops with no overshoot. It comes to rest at x 160–680, y 390–655, floating 56 px ABOVE the belt top (y 710) with its own drop shadow (f1360). It is a clean slip: the WRONG stamp, the circled '(completed in' and the underlined '2002' and title from the end of S1 (f800) are all gone. f1353–1385: completely still for 1.1 s while 'ChatGPT's answer' is spoken. The camera starts its push to TRACK at f1385.
  V2 DIRECTION: SETUP (wipe, f1326–1336): the wipe reveals a composed medium-close of the write head, not an empty room. Use zoom ~1.25 on the belt directly under the chute. The bottom of the idle scorer housing (lamps dark, one amber standby LED) and its chute sit in the top-right third. The housing hangs from the pipe stub on the SAME depth layer as the pipe, so the joint can never slide.

ACTION on 'Let's' (f1340): the S1 slip drops in from the top of frame, not from the left edge. It still carries its WRONG stamp and its year/title marks.
- Motion: 3-frame hang, 80 px fall, lands flat ON the belt (slip bottom = belt top).
- Settle: 6 px bounce and a 2° wobble, settled by f1356. Its shadow tightens on contact.
- Position: its right end sits under the chute.
- Size: enlarge it for this shot (fontSize 26→36, width 520→720). At zoom 1.25 that gives 'ChatGPT' ≈40 px, 'GPT-4o · 9 May 2025' ≈28 px and the body ≈45 px on screen.

REACTION on 'ChatGPT's' (f1355–1379): the standby LED blinks twice and the housing shudders 2 px, as if the machine recognises its own output.

SECONDARY: the belt gets a cleat mark every 40 px so its later motion reads. A low motor hum fades in.

NEXT DEVELOPMENT on 'answer' (f1381): the slip squashes 4%, as anticipation for the unroll.

CAMERA: no move in this shot. The scene's first move is the widen on 'apart.' in S3.2. Keep the wall and pipe quiet.

SOUND: paper fall plus a soft flat landing tap on the belt (f1347), an LED double blip (~f1360), and the hum fading in.
## S3.2 0:46.4-0:49.1 (V1 f1391-1473) | apart. A language model builds text out of tokens: (apart.@1391–1405, A@1419, builds@1446, text@1455, out of@1467–1472, tokens:@1475)
  - [medium/motion_quality] f1391–1407 is a ghosted cross-fade, not an unfold: at f1395–1400 the half-transparent slip sits over the half-transparent sentence. Nothing physical happens to the paper, yet V1's 'slip unfolds' slide SFX is synced to f1403 over it.
  - [high/static_hold] f1408–1473 (2.2 s): the frame is frozen over the first key definition. Nothing builds while the narrator says 'builds text out of tokens'.
  - [medium/blank_space] TRACK framing: the only subject is a 50 px text band at y≈600–650. Everything above it (y 0–598, ≈55% of the frame) is empty light blue, and the floor takes the bottom 17%.
  - [medium/disconnected_or_floating] The sentence hovers ~40 px above the belt (text bottom y≈650, belt top y≈689). It reads as a caption floating over the conveyor, not as an object on it.
  - [medium/unclear_when_muted] The cut at '200' is unmarked. With the sound off, nothing says the line was stopped mid-year on purpose or that the machine will continue from there.
  - [low/offscreen_or_cropped] A 20x160 px pipe stub pokes into the frame from the top edge at x≈1830 (f1405–1610). It is a cropped prop with no visible purpose.
  viewer_should_look_at: The answer turned into one strip on the belt that ends '…completed in 200', with an empty, lit slot under the chute where the next piece will be written.
  what_it_should_communicate: The answer is a stream of text the machine builds left to right. We pause it in the middle of the year to inspect it.
  what_actually_happens: f1385–1405: the camera moves WIDE→TRACK (zoom 1.35, cx 760, cy 600, ease-in-out).

f1391–1407: the 'unfold' is a cross-fade. The slip fades out while stretching scaleX to 1.6 from its bottom-left corner, and the one-line sentence (40 px serif) fades in underneath. f1395–1400 show a double exposure: a half-transparent slip over a half-transparent sentence.

f1408–1473: completely still for 2.2 s under 'A language model builds text out of tokens:'. Layout during the hold:
- The text sits at y≈600–650 and floats ~40 px above the belt (belt top y≈689).
- y 0–598 (≈55% of the frame) is empty, except the pipe stub entering from the top edge at x 1827–1847, y 0–161.
- The floor fills y 891–1080.

The line ends at '200' with no caret or marker. The rest of the answer ('2 at CMU) is entitled…') and the stamp disappear silently in the cross-fade.
  V2 DIRECTION: SETUP on 'apart.' (f1391–1405): the slip unrolls physically.
- Its right end stays anchored under the chute, and the paper unrolls LEFTWARD into a one-line strip over 14 frames, overshooting ~10 px and settling. The text is re-set on one line at 40 px.
- The stamp and marks ride along on the strip's right part.
- Rest the strip ON the belt, with no gap.

CAMERA (the scene's only move so far): widen from zoom 1.25 to ~1.0–1.08 over the same 14–18 frames, finished by f1410. The move is motivated because the strip is getting longer.
- Choose this framing for S3.3 too, so the split needs no move. With V1 tile metrics the 15-token row is ≈1,670 world px wide (Adam's left edge x=120 to the right edge of '200' x≈1787). At zoom 1.15–1.2 it cannot fit.
- Option A: frame at zoom 1.0.
- Option B: tighten the tiles (gap 12→6; horizontal padding 0.34→0.24 x size at size 38, ≈1,550 px) and frame at ≈1.08. Tiles are then ~41 px on screen.

ACTION on 'builds text' (f1446–1466): everything after '200' erases right to left in a fast backspace, ~5 characters per frame over 20 frames, taking the stamp and marks with it. It leaves an empty, softly lit slot on the belt directly under the chute, with a caret blinking in it at 2 Hz.

REACTION on 'out of tokens' (f1460–1475): thin perforation lines draw down between the 15 chunks, left to right, one per frame.

SECONDARY: the scorer's standby LED pulses and the belt hum continues. Nothing else moves.

SOUND: paper unroll/flap (move V1's slide from sync f1403 to the unroll at f1391), soft fast backspace ticks f1446–1466, faint scoring ticks for the perforations.
## S3.3 0:49.1-0:53.7 (V1 f1473-1610) | (tokens:) chunks that are sometimes whole words, sometimes fragments. (tokens:@1475–1506, chunks@1508, whole@1543, words,@1549–1566, sometimes@1572, fragments.@1581–1597)
  - [high/offscreen_or_cropped] From f1480 to f1610 the right end of the row is cut at the frame edge ('complet'). 'in ␣ 200', the place where the next action happens, is never visible in this shot.
  - [medium/motion_quality] The split is a cross-fade with a double exposure (f1476: the sentence's glyphs sit misaligned under the tile glyphs), not a physical break. The category tints are one-frame colour flips at ~f1545, ~f1576 and ~f1583.
  - [medium/unclear_when_muted] The two categories are never on screen together: teal is gone by ~f1576, before saffron starts at ~f1583. Both chips sit below the rollers (y≈810), cut off from their tiles by the belt. 'whole words' points at Adam/Ta, and 'fragments' points at uman/Kal while Ph and .D get no label. Muted, the contrast does not read.
  - [medium/disconnected_or_floating] The tiles hover ~38 px above the belt (f1520) instead of resting on it, so the conveyor isn't carrying anything.
  - [medium/static_hold] Still runs f1492–1543 (1.73 s), f1548–1574 (0.9 s) and f1585–1610 (0.87 s). The only events are flat one-frame colour changes.
  - [low/phone_readability] The 'whole words' and 'fragments' chips are 24 px world x 1.35 ≈ 32 px on screen (≈11 px on a phone), white on teal. Marginal.
  - [low/other] The '␣' tile (the real lone-space token before '200') is an unexplained glyph for a general viewer.
  viewer_should_look_at: The tiles. The whole-word tiles (Adam, dissertation, completed, in) and the fragment tiles (Ta, uman, Ph, .D) are compared side by side.
  what_it_should_communicate: Tokens are chunks. Some are whole words and some are pieces of words, and both kinds sit in the same sentence.
  what_actually_happens: f1473–1491: the 'split' is a second cross-fade. The sentence fades out while 15 tiles fade in, their gaps opening 0→12 px and their size shrinking 40→36. At f1476 the old text is visible, out of register, under the new tiles.

The row grows from ~1,174 to ~1,670 world px. From f1480, 'complet' is cut at x=1920, and 'ed in ␣ 200' stay off-frame for the whole shot. The tiles hover ~38 px above the belt (tile bottoms y≈651, belt top y≈689 at f1520).

f1492–1543: still for 1.73 s.

~f1545: Adam, dissertation and completed flip to teal in a single frame, with no tint animation. A 'whole words' chip fades in at x≈98–360, y≈810. That is BELOW the rollers, under Adam and Ta only. f1548–1574: still for 0.9 s.

~f1576: the teal flips off. ~f1583: Ta, uman, Ph and .D flip to saffron, and a 'fragments' chip fades in at x≈445–667, y≈810, under uman/Kal and nowhere near Ph/.D. f1585–1610: still for 0.87 s. The '␣' tile is off-frame throughout.
  V2 DIRECTION: SETUP: the perforated strip and blinking caret slot from S3.2. Use the framing chosen in S3.2: all 15 tiles and the slot in frame, with ≥80 px margins. CAMERA locked.

ACTION on 'tokens:' (f1475): the strip snaps along the perforations from left to right, one tile per frame (15 frames).
- Each tile hops 8–10 px, separates to its gap, and lands ON the belt (tile bottom = belt top) with a 2 px bounce.
- The row grows leftward from the anchored slot.
- No cross-fade: the glyphs never move relative to their tiles.

REACTION on 'whole words,' (f1543–1566): Adam, dissertation, completed and in hop 3 frames apart and tint teal over 6 frames.
- A teal bracket draws under exactly those four tiles, on the belt's front face (between the tiles and the rollers, not below the rollers). It ends in the 'whole words' chip.
- The teal stays, dropping to ~70% saturation.

SECONDARY on 'sometimes fragments.' (f1572–1597): Ta, uman, Ph and .D hop and tint saffron, with their own saffron bracket and chip. Both colours stay readable side by side for at least 1 s (f1597–1610).

The space tile gets a small 'space' label through TokenTile's existing `sub` prop. Chips are ≥36 px on screen (≈32–34 px world at zoom 1.08).

NEXT DEVELOPMENT (f1600–1610): both tints fade to paper, and Kal/ai start a faint blue pulse to pull the eye left before the push in S3.4.

SOUND: 15 dry clicks synced to the visible snaps (re-time V1's synth cascade at f1473–1489), 4 soft low teal ticks, and 4 higher saffron ticks.
## S3.4 0:53.7-0:59.3 (V1 f1610-1779) | In GPT-4o's tokenizer, “Kalai” comes out as “Kal” and “ai.” (In@1611, GPT-4o's@1616–1640, tokenizer,@1650–1671, “Kalai”@1672–1693, comes out as@1695–1715, “Kal”@1719, and@1742, “ai.”@1753–1767)
  - [high/static_hold] f1627–1713 (2.9 s), the second-longest still in S3: the camera arrives and nothing happens through 'GPT-4o's tokenizer, “Kalai”'. The cue word 'Kalai' (f1672) gets no visual.
  - [high/unclear_when_muted] The 'split' is shown as two tiles rising until they touch (f1755–1779). Muted, it reads as 'Kal' and 'ai' JOINING, not 'Kalai' splitting. The word was already shown as two tiles 6 s earlier, so no transformation is ever seen.
  - [medium/overlap_or_clipping] f1755–1779: the scaled 'ai' tile draws over Kal's right border, producing a doubled, overlapping outline in the shot's hero object.
  - [medium/blank_space] KALCAM f1626–1713: the row is a band at y≈640–736 and the frame above it (y 0–640, ≈59%) is empty until the lift.
  - [medium/offscreen_or_cropped] The row is cut at the right edge ('disser') for the whole shot.
  - [low/competing_attention] The blue Kal/ai tint persists from f1720 to f2563 (≈28 s) as a leftover highlight in shots where it means nothing. It is the same blue as the scorer housing.
  - [low/phone_readability] In the chip, '“ Kal”' (with its factual leading space) looks like a typo at phone size (38 px on screen ≈13 px on a phone). Keep the factual text, but consider showing the space the same way as the '␣' tile.
  viewer_should_look_at: The name 'Kalai', first as one unit and then visibly breaking into two tokens, ' Kal' and 'ai', under the factual label 'GPT-4o tokenizer (o200k_base)'.
  what_it_should_communicate: Even a person's name isn't one unit to the model: the real GPT-4o tokenizer cuts it in two. These tiles are real tokens, not a cartoon.
  what_actually_happens: f1610–1626: the camera pushes to KALCAM (zoom 1.6, cx 520). The row sits at y≈640–736, starts at x≈321, and is cut at the right ('disser'). Its tile bottoms are ~44 px above the belt top (y≈780). y 0–640 is empty.

f1627–1713: nothing moves for 2.9 s through 'GPT-4o's tokenizer, “Kalai” comes out as'. 'Kalai' (f1672) gets no visual.

f1713–1727: 'Kal' lifts 110 px and scales x1.35 from its bottom centre (ease-out). The blue chip '“Kalai” → “ Kal” + “ai” · GPT-4o tokenizer (o200k_base)' fades in at y≈335, x 608–1729, with 38 px text. 'ai' turns blue but stays in the row. f1725–1749: still.

f1749–1761: 'ai' lifts the same way. Both tiles scale from their own bottom centres with only a 12 px gap, so 'ai' overlaps Kal's right border (f1755). They end as ONE glued 'Kal|ai' block (f1760), leaving a two-tile hole in the row. The chip is centred ~105 px to the right of the pair. The frame holds to f1779.

Kal and ai keep their blue tint until the end of the scene (f2563).
  V2 DIRECTION: SETUP on 'In GPT-4o's' (f1611–1640): one push to zoom ~1.5, composed so Kal/ai sit at frame centre in the lower third with ~4 tiles on each side. The move ends by f1640.

On 'tokenizer,' (f1650–1671): the factual chip slides down from the top edge and settles with a 4 px overshoot, centred over the pair. Keep the exact text, at ≥36 px on screen.

ACTION on '“Kalai”' (f1672–1693): Kal and ai rise together as ONE block.
- Their gap closes and the two outlines merge into a single 'Kalai' tile.
- 4 px dip of anticipation, 120 px rise, 6 px overshoot.
- A lit empty slot stays in the row below.

REACTION on 'comes out as' (f1695–1715): the block shivers ±2° for 6 frames.
- On '“Kal”' (f1719): a crack line draws down the middle and ' Kal' snaps 40 px left.
- On '“ai.”' (f1753): 'ai' slides 40 px right, and the '→ “ Kal” + “ai”' part of the chip highlights.

SECONDARY: the halves bob once and settle. The neighbouring row tiles lean 1–2° toward the slot.

NEXT DEVELOPMENT in the pause (f1767–1784): both halves drop back into the slot with two clacks, their tint fades to paper by f1784, and the chip fades out.

CAMERA: one push, then hold. The pull-out belongs to S3.5.

SOUND: chip slide-in; small lift whoosh on 'Kalai'; crack/snap on 'Kal' (repurpose V1 [EL tile] at f1721); slide on 'ai' (V1 [EL tile] at f1757); two clacks on the return.
## S3.5 0:59.3-1:03.0 (V1 f1779-1890) | At every step, the model scores all the possible next chunks (and…) (At@1784, every@1789, step,@1799–1813, the model@1815–1825, scores@1827–1839, all the possible@1842–1861, next chunks@1863–1883, and@1885)
  - [high/disconnected_or_floating] Write-head geometry: the chute (world x≈1550–1604) sits over 'in', ≈250 world px left of the slot after '200' (the right edge of '200' is at x≈1787). Even a correctly animated drop would land in the middle of the existing sentence. This is the root of the 'pick never reaches the slot' problem in S3.6.
  - [medium/overlap_or_clipping] Five candidate rows (~262 px) don't fit the 250 px panel. Row '3' crosses the panel and housing borders, and its '7%' label is half hidden (f1881, f2060). This happens whenever the digit list is visible (f1827–1934, f2041–2563). The chute's lower end is drawn behind the tile row (behind 'in' at f1800), so the mouth that should feed the sentence is hidden.
  - [medium/competing_attention] f1779–1799: a pan and zoom, the Kal/ai drop-back, the scorer's appearance and a ghosted chip all happen within ~0.7 s, so the scorer's arrival gets no clean moment.
  - [medium/static_hold] f1798–1827 (1.0 s) shows empty bars. f1835–1892 (1.93 s) shows final bars while 'all the possible next chunks and picks' is spoken. All five bars move as one, on one curve, once, and then never change.
  - [high/phone_readability] The 'illustrative numbers' guard-rail chip is 18 px world x 1.25 ≈ 22 px on screen in HOPPER (≈7.5 px on a phone) and 18 px in WIDE (≈6 px). The percentages are 20 px world ≈25 px on screen (≈8 px on a phone).
  - [low/blank_space] HOPPER during s10 (f1797–1955): the left third of the frame above the row (x 0–670, y 0–760) is empty for 5 s.
  - [low/disconnected_or_floating] Because of the parallax mismatch (pipe at depth 0.7, housing at depth 1), the pipe slides along the housing's top edge during every camera move (f1779–1797, f1955–1971, f2037–2053, f2262–2278).
  viewer_should_look_at: The NEXT-CHUNK SCORER directly above the empty slot after '200': candidate digits arrive and their bars rise and compete.
  what_it_should_communicate: Before writing each piece, the machine weighs many possible next chunks and gives each one a score (illustrative numbers).
  what_actually_happens: f1779–1797: the camera moves KALCAM→HOPPER (zoom 1.6→1.25, a ~730 world px pan right). Three other things happen in the same ~20 frames:
- Kal/ai drop back into the row (f1781–1793).
- The scorer housing appears with an opacity fade and a 30 px ease-out drop (f1785–1799, mostly opaque by f1790).
- The fading Kalai chip slides across the scorer's left side as a ghost (f1790).
The pipe is on the wall layer (depth 0.7) and the housing on depth 1, so their joint slides ~20 px during the move.

The HOPPER framing:
- The housing spans x 672–1422, y≈235–655.
- The row runs from a sliced 'uman' sliver at x=0–9 to '200', which ends at x≈1631, leaving ~290 px free on the right. This is the only framing in the scene that shows the sentence tail.
- The chute (x 1337–1400) hangs directly over the 'in' tile, ~300 screen px left of the empty slot after '200', and its lower end disappears behind 'in'.
- The area x 0–670 above the row is empty for all of s10 (f1797–1955).

f1798–1827: empty bars, still for 1.0 s.

f1827–1845: all five bars grow together on the same ease-out curve to their final values (scaled 2.6x, so 31% fills ~80%), and '2' gets a saffron border.

f1835–1892: still for 1.93 s. The 5th row ('3') overflows the cream panel and the housing border, and its '7%' is half hidden under the border (f1881, f2060).
  V2 DIRECTION: SETUP: in the V2 geometry (see scene_problems, 'machine geometry'), the empty slot after '200' already sits under the chute mouth, so the belt doesn't move here.

CAMERA on 'At every step,' (f1784–1800): one pull-out from the Kal close-up to the machine framing (zoom ~1.25). It must hold the whole housing, the chute, the slot and the last ~8 tiles ('dissertation ( completed in ␣ 200 [slot]') with ≥80 px margins. It finishes by ~f1800, before anything else moves. Kal/ai already returned in S3.4, so nothing competes with the move. Put the pipe and housing on the same depth, or hang the housing on its own cable.

ACTION, in order:
- On 'the model' (f1815–1825), power-on: lamps flick on left to right, 2 frames apart; the 'NEXT-CHUNK SCORER' header lights; the screen flickers once.
- On 'scores' (f1827–1839): the candidate tiles 2, 1, 0, 5, 3 drop into their slots 3 frames apart.
- On 'all the possible next chunks' (f1842–1883): the bars race up with staggered starts (2 frames apart) at different speeds and overshoot 3–5%, while the % counters roll. '1' briefly leads '2' at ~f1855 and is overtaken, so the probabilities visibly change.

REACTION on 'and' (f1885): the bars wobble ±2% for ~10 frames and settle. The '2' row gets its saffron edge: it is now favoured.

SECONDARY: a faint '…' fade of further rows under the five suggests the 'possible' chunks are many. The caret keeps blinking in the slot below.

LAYOUT fixes:
- Make the five rows fit: cream panel 250→272 px and housing 336→358 px, or row gap 6→2 and vertical padding 14→10.
- % labels 20→24 px world (≈30 px on screen).
- 'illustrative numbers' 18→24 px world (≈30 px on screen).

SOUND: relay clunk plus a rising hum at power-on (f1815); five tile drops into the slots (f1827–1839); rising ratchet ticks per bar (re-time V1's 'scorer sweep' at f1827–1843 to the staggered bars); a soft settle tick on 'and'.
## S3.6 1:03.0-1:05.2 (V1 f1890-1955) | (and) picks one. Then it goes again. (picks@1890–1897, one.@1901–1911, Then@1919, it goes@1922–1928, again.@1931–1943)
  - [high/disconnected_or_floating] The picked tile's path ends ~350 world px short of the slot (it vanishes at x≈1470 behind 'completed'; the slot is at x≈1800–1850) and never uses the chute. The tile in the sentence pops in separately. Muted, nothing physically links 'picked' to 'placed'.
  - [high/unclear_when_muted] Colour identity breaks: the tile flies SAFFRON, lands BLUE (the same blue as Kal/ai, so it groups visually with them), and turns paper at f1957. The eye can't follow one object from the scorer into the sentence.
  - [medium/motion_quality] The full 360° spin turns the tile upside down mid-flight (f1900, f1950), so it reads as tossed, not chosen. There is no anticipation, no landing bounce and no lock. It flies in front of the bars and the panel border (f1950).
  - [medium/motion_quality] The reload is a hard content swap at ≈f1930 (the digit list is replaced mid-fade), and the 'at' list drops the % labels and the 2.6x bar scale, so it is inconsistent with the first list.
  - [medium/unclear_when_muted] The belt never advances. After 'at' is added, the whole row jumps ~75 screen px left in ONE frame (f1955). 'Then it goes again' has no visible cause and effect.
  viewer_should_look_at: The winning '2' leaving the scorer, dropping through the chute and locking into the slot after '200'. Then the machine resetting and doing it again for ' at'.
  what_it_should_communicate: One candidate is chosen and physically becomes part of the sentence. Then the whole process repeats for the next piece.
  what_actually_happens: f1890–1908, the '2' pick:
- The '2' row fades out in place, while a duplicate SAFFRON '2' tile appears over the candidate box (f1895).
- The duplicate spins a full 360° on an arc across the bars (f1900: upside down over row '5') and ends at world x≈1470, where it disappears BEHIND the 'completed' tile (f1905, screen x≈1235).
- Meanwhile a BLUE '2' (Kal/ai's tint) pops in at the row end at screen x≈1650 (f1905), ~430 px to the right. It turns paper at f1957 for no visible reason.
- The 'pick settles' synth (f1906) plays at the moment the flying tile vanishes behind 'completed'.

f1910–1927: the list shows 1/0/5/3 with an empty top slot.

~f1930, mid-fade: the list hard-swaps to 'at , in )', which has no % labels and unscaled bars.

f1941–1957, the ' at' pick:
- The 'at' duplicate spins out the same way (f1950: rotated ~200° over the ')' bar and the panel's bottom-right border).
- A paper 'at' pops in at the row end.
- The whole row jumps ~75 screen px left in one frame (f1955).
- The 'second pick settles' synth plays at f1955.

The camera is static (HOPPER).
  V2 DIRECTION: SETUP: the '2' row is favoured (S3.5), and the slot after '200' sits under the chute.

ACTION on 'picks' (f1890–1897):
- The '2' row latches: saffron flash, the housing lamp blinks, and the row nudges 6 px right.
- The SAME saffron '2' tile (no duplicate, no fade in place) squashes 5% for 2 frames.
- It ejects right along a short rail inside the panel to the chute throat (5 frames).
- It drops through the chute upright, with at most ±6° wobble (4 frames). Draw it in front of the panel but behind the chute's front lip, so it visibly enters the chute.
- It lands in the slot at ~f1903 with a 6 px bounce and a 2-frame lock flash on its border.
- It stays saffron for ~10 frames, then cools to paper. Never blue.

REACTION on 'one.' (f1901–1911): the other four candidates dim and slide out of the panel to the left, and the bars drain.

SECONDARY (f1906–1912): the belt steps left by exactly one tile width plus gap (6 frames, ease-in-out; rollers turn ~30°), bringing a fresh empty slot under the chute. The caret moves into it.

NEXT DEVELOPMENT on 'Then it goes again.' (f1919–1952):
- New candidates (at / , / in / ) ) drop in WITH % labels that match their bar lengths, on the same 2.6x scale. They are still covered by the 'illustrative numbers' chip.
- The bars race and wobble.
- 'at' latches on 'again.' (f1931), ejects, drops and locks (~f1940), and the belt steps (~f1946–1952).
- Use the same mechanics as the first pick but ~30% faster, so the repetition reads as a cycle.

CAMERA: locked on the S3.5 machine framing. The machine supplies all the motion.

SOUND: latch clunk, pneumatic eject puff, short chute rattle, wooden lock click plus a tiny bounce, belt step. Repeat for 'at', preceded by the reload ratchet (V1 f1927–1937). Re-sync V1's 'pick settles' (f1906) and 'second pick settles' (f1955) to the visible locks.
## S3.7 1:05.2-1:07.9 (V1 f1955-2037) | Token after token, an answer rolls out. (Token@1957, after@1969, token,@1979–1993, an@1994, answer@2000, rolls@2010, out.@2019–2027)
  - [high/camera_hurts] The camera moves AWAY from the information at the moment it arrives. The pull-back at f1955–1971 overlaps the first roll-out tokens and shrinks both the scorer and the tiles: tiles to 36 px, the header to 26 px.
  - [high/offscreen_or_cropped] Both ends of the sentence are cropped. The newest tokens land at or past the right edge ('U' at x≈1885 at f1970, 'entitled' cut at f1990, ':' off-frame from f1993). The left edge slices 'Adam' (f1970) and 'Ta' (f1980), and 'Adam Ta uman' stay off-frame in every later WIDE frame (f2000–2037, f2278–2563).
  - [high/disconnected_or_floating] The roll-out tokens don't come from the scorer or the chute, and the scorer shows a dead, stale list with an empty top slot. This is the brief's 'scorer disappears from the token sequence': the machine plays no part in the roll-out.
  - [medium/motion_quality] The row shifts in instant 70 px steps every 6 frames, with no easing. That is jerky, it fights the simultaneous camera move, and the tiles pop in at 0.7 scale.
  - [medium/timing_vs_narration] Roll-out clicks 5 and 6 (f1991, f1997) play for tiles that are off-frame or half off-frame. The visual roll-out ends at f2001, while 'rolls out' is spoken at f2010–2027 over a frozen frame.
  - [medium/static_hold] f1994–2035 (1.4 s) of complete stillness after the last token, over 'an answer rolls out. Here,'.
  viewer_should_look_at: The chute and the newest token landing under it, with the sentence growing to its left: '… 2002 at CMU) is entitled:'.
  what_it_should_communicate: The answer is produced by repeating the same cycle quickly. A fluent sentence comes out one piece at a time.
  what_actually_happens: f1955–1971: the camera pulls back HOPPER→WIDE (zoom 1.25→1) exactly as the roll-out starts.

f1957–1993: CM, U, ), is, entitled and : appear one every 6 frames at the RIGHT END of the row, not from the chute. Each fades and scales in (opacity 0→1, scale 0.7→1 over 8 frames), and the whole row jumps 70 px left in one frame per token.

The row grows faster than it shifts, so both ends get cut:
- Right end: 'U' appears at x≈1885 (f1970), 'entitled' is cut at x=1920 (f1990), and ':' lands entirely off-frame (f1993). The 5th and 6th [EL tile] clicks (f1991, f1997) sound for tiles you can't see.
- Left end: 'Adam' is cut to 'm' at f1970 and 'Ta' is cut at f1980. From ~f1990, 'Adam Ta uman' are gone.

The scorer stays frozen on the stale ', in )' list with an empty top slot. In WIDE, the chute's lower end pokes down behind the row between 'CM' and 'U' (f2020).

The roll-out is done by f2001. Everything is still f1994–2035 (1.4 s), during 'an answer rolls out. Here,', so 'rolls out' (f2010–2027) is spoken after the rolling has stopped.

In WIDE the floor fills y 860–1080, the upper-left quadrant is empty, and the scorer header is 26 px.
  V2 DIRECTION: SETUP: 'at' has just locked and the belt has stepped (S3.6).

ACTION on 'Token after token,' (f1957–2000): six compressed cycles for ' CM', 'U', ')', ' is', ' entitled' and ':'.
- Spacing: 10, 8, 7, 6, 6, 6 frames apart, so the locks fall at ≈f1960, 1970, 1978, 1985, 1991, 1997.
- Each cycle: the bars flicker for 2–3 frames, the top row latches, the tile drops through the chute, it locks in the slot, and the belt steps left by that tile's width plus gap.
- At 6-frame spacing only the drop, the lock flash and the belt step need to read.
- The output always lands in the same place on screen, under the chute.

REACTION on 'an answer' (f1994–2007): the finished tokens keep sliding left with the belt, so '…completed in ␣ 200 2 at CM U ) is entitled :' reads to the left of the chute.
- Old tokens may leave by the LEFT edge, because they are the past.
- Nothing is ever sliced at the right edge, and the chute and slot never leave the frame.

SECONDARY: the housing vibrates 1 px per drop, the lamps blink in rhythm, and the rollers spin during the steps.

NEXT DEVELOPMENT on 'rolls out.' (f2010–2027): the machine eases to idle instead of freezing. The last bars drain, the lamps dim one step, the caret blinks in the next slot, and the belt coasts 4 px and stops.

CAMERA: stay on the machine framing. At most, drift slowly from zoom 1.25 to ~1.18 across the roll-out to show more of the finished text. Never pull back to the V1 WIDE.

SOUND: a low belt motor under an accelerating, slightly pitch-stepped run of six lock clicks synced to the visible locks (re-sync V1's six [EL tile] at f1967–1997), then a dip in the hum as the machine idles on 'rolls out'.
## S3.8 1:07.9-1:10.8 (V1 f2037-2125) | Here, it's choosing the last digit of the year. (Here,@2041–2051, it's@2053, choosing@2060–2067, the last digit@2070–2089, of the year.@2090–2108)
  - [high/unclear_when_muted] The present tense 'it's choosing' plays over a sentence that is already 7 tokens past the choice. The scorer jumps back in time with a hard swap at f2041. There is no rewind, highlight or link between the '2' candidate and the '2' tile.
  - [high/static_hold] f2054–2167 (3.8 s), the longest still in S3. The bars, tiles and cards are all frozen, and the cards sit at 35–40% opacity the whole time.
  - [medium/offscreen_or_cropped] The cards' left edge is at x≈22 px on screen (f2050–2262), too close to the frame edge for any overscan or player UI. In the same frames ':' is half cut at the right edge and a '.' tile sliver sits at x=0.
  - [medium/phone_readability] The card text is pre-shown at 35–40% opacity (pale on pale blue) for 3.8–6 s before it is 'activated'. The card labels are ≈27 px (≈9 px on a phone).
  - [medium/camera_hurts] This is the third camera move in 82 frames (f1955 out, f2037 back in), undoing the f1955 pull-back. A list swap and a card fade-in happen during the move.
  viewer_should_look_at: The year '200_' with its empty last-digit slot under the chute, and the scorer showing the digit candidates with '2' favoured at 31%.
  what_it_should_communicate: We go back to the decisive moment: the wrong year '2002' came from this one digit choice.
  what_actually_happens: f2037–2053: the camera moves back to HOPPER (its third move in about 3 s). At f2041, mid-move, the list hard-swaps from ', in )' to the digit list, with '2' at 31% highlighted.

The row reads '. dissertation ( completed in ␣ 200 2 at CM U ) is entitled :'. A '.' sliver is cut at x=0, and ':' is half cut at x≈1870–1920 (f2060). The placed '2' sits mid-row in paper tone, with nothing linking it to the scorer's '2'. The chute's lower end shows in the gap between 'CM' and 'U'.

f2045–2059: two cards fade in at the left, their left edge at screen x≈22:
- 'WHAT THE SCORE MEASURES / How likely the chunk is', with the headline in grey at 40% opacity;
- 'NOT MEASURED / Whether it's true', with the whole card at 35% opacity.

f2054–2167: still for 3.8 s, the longest still in S3.
  V2 DIRECTION: SETUP: the machine is idle on the finished sentence (S3.7). V2 never left the machine framing, so no big move is needed.

ACTION on 'Here,' (f2041–2057): the belt runs BACKWARDS.
- ':', ' entitled', ' is', ')', 'U', ' CM', ' at' and '2' are pulled back up the chute in reverse order, 2 frames each (16 frames), with a rewind zip.
- The bars run backwards too, and the digit list re-forms with '2' at 31% and its saffron edge.
- The '2' re-seats in its row with a soft click.

REACTION on 'it's choosing' (f2053–2067): the empty slot after '200' blinks under the chute again. The '2' row 'hovers' with a gentle 2-frame pulse every 12 frames: it is about to be chosen.

CAMERA on 'the last digit of the year.' (f2072–2108): one slow push from zoom 1.25 to ~1.4, centred between '200' and the scorer, finished by f2100.
- The frame holds '…in ␣ 200 [slot]', the whole housing, and ~540 world px of clear space left of the housing for S3.9's readouts.
- On 'year.' (f2096), a saffron underline draws under '200' and the slot as one unit.

SECONDARY: the other bars breathe ±1% and the lamps hum. Do NOT mark any digit as correct; S5 owns the 2001 reveal.

NEXT DEVELOPMENT on 'Those' (f2125): the first readout starts to slide out of the housing (S3.9).

SOUND: tape-rewind zip with 8 reverse tile ticks, a soft click as the '2' re-seats, a low hum.
## S3.9 1:10.8-1:15.4 (V1 f2125-2262) | Those scores say which chunk is likely. They do not say which one is true. (Those scores say@2125–2149, which chunk is@2151–2171, likely.@2173–2187, They do not say@2197–2221, which one is@2223–2238, true.@2240–2252, then a 600 ms pause)
  - [high/static_hold] Stills at f2171–2230 (2.0 s) and f2236–2262 (0.9 s). Together with S3.8 that is about 7 s of near-frozen screen on the scene's central claim, and the only events are two opacity fades.
  - [medium/unclear_when_muted] Nothing ties 'likely' to the bars, or 'true' to a missing measurement. Muted, it reads as two text boxes next to a machine.
  - [medium/disconnected_or_floating] The cards float at world x 500–996 with no leader, bracket or mount connecting them to the scorer at x 1020–1620.
  - [medium/offscreen_or_cropped] The cards' left edge is ≈22 px from the frame edge for 4.2 s (f2050–2262).
  viewer_should_look_at: First, the bars together with the 'How likely the chunk is' readout. Then the 'NOT MEASURED / Whether it's true' readout, which stays dead.
  what_it_should_communicate: The scorer measures likelihood only. Truth is neither an input nor an output. This is the scene's key line.
  what_actually_happens: f2125–2167: no change.

f2167–2177: the headline 'How likely the chunk is' brightens from 0.4 to 1 opacity (a fade only). f2171–2230: still for 2.0 s.

f2230–2244: the second card's border turns coral and its opacity rises 0.35→1. f2236–2262: still for 0.9 s.

The bars never move. The cards are not attached to anything: they float at world x 500–996, 22 px from the left frame edge, 32 px clear of the housing (x 1020).
  V2 DIRECTION: SETUP: the S3.8 framing (zoom ~1.4: housing, '200 [slot]', '2' hovering).

ACTION on 'Those scores say' (f2125–2149): a readout card slides out of the housing's LEFT wall on a short, visible arm.
- It reads 'WHAT THE SCORE MEASURES / How likely the chunk is'.
- It is fully opaque from the start, with its left edge ≥80 px from the frame edge.
- A leader line draws from the card to the bars.
- On 'likely.' (f2173): the bars pulse once in sequence, 2→1→0→5→3, 2 frames apart, with a bright chime.

REACTION on 'They do not say' (f2197–2221): a second readout slides out under the first, with a dark round lamp labelled 'TRUE?'.
- On 'which one', the lamp tries to light, flickers once for 2 frames, and dies.
- On 'true.' (f2240): 'NOT MEASURED / Whether it's true' snaps on with its coral border: 3-frame squash of anticipation, impact, 2 px housing jolt, settle.

SECONDARY: the '2' row keeps hovering, as if the machine is still confident. Nothing marks a correct digit.

NEXT DEVELOPMENT in the 600 ms pause (f2252–2269):
- The readouts retract into the housing.
- The belt fast-forwards: the 8 rewound tokens re-drop through the chute in an 8–10-frame burst, restoring '…200 2 at CM U ) is entitled :'. This restores the record before the add-ons appear, so S3.11 can continue the real answer.

CAMERA: hold, with at most a 2–3% drift.

SOUND: arm servo; bright chime on 'likely' (V1 'likely' synth at f2173); a dull 'dud' click and dying buzz for the TRUE? lamp; a firm thunk on 'true.' (V1 'not the true one' at f2240); a retract servo and fast-forward zip in the pause.
## S3.10 1:15.4-1:21.9 (V1 f2262-2457) | Modern chatbots add more on top: instruction training, step-by-step reasoning, sometimes web search. (Modern chatbots@2270–2294, add more on top:@2296–2332, instruction training,@2340–2368, step-by-step reasoning,@2372–2411, sometimes web search.@2414–2450)
  - [high/disconnected_or_floating] No module touches the machine. Modules 1–2 float in the sky to the left. Module 3 hovers ~10 px above the housing roof with its shadow almost touching, which reads as a placement error (f2440–2563). This contradicts 'add more on top' and the code's own 'bolted onto the machine' comment.
  - [medium/static_hold] f2279–2336 (1.93 s) of stillness after the pull-back, before the first module, while 'Modern chatbots add more on top' is spoken.
  - [medium/motion_quality] Each module is a 14-frame ease-out drop plus fade, with no weight, impact or settle. The 'tap' SFX (f2348, f2380, f2434) has no visible impact to sync to.
  - [high/phone_readability] Module labels are 26 px in WIDE (≈8.7 px on a phone), including the factual hedge '(sometimes)', which is pushed onto a second line. The scorer header (26 px), 'illustrative numbers' (18 px) and the % labels (20 px) are also unreadable in this framing.
  - [medium/offscreen_or_cropped] WIDE f2278–2563: the sentence is cropped at both edges. A 'uman' tile sliver sits at x=0–9, and 'entitle' is cut at x=1920 with ':' off-frame.
  - [medium/blank_space] WIDE framing: the floor band takes y 860–1080 (20%), and the left half below the modules (x 0–960, y 250–620) is empty.
  viewer_should_look_at: Three add-on modules physically attaching to the same scorer machine.
  what_it_should_communicate: Today's chatbots add extra layers (instruction training, step-by-step reasoning, sometimes web search), but those layers are mounted on the same core.
  what_actually_happens: f2262–2278: the camera pulls back to WIDE and the cards fade out (f2264–2274). In WIDE the sentence is cut at both edges: a 'uman' sliver sits at x=0–9, and 'entitle' is cut at x=1920. The chute skewers the gap between CM and U.

f2279–2336: still for 1.93 s over 'Modern chatbots add more on top: instruction'.

f2336–2350, f2368–2382 and f2422–2436: three cream modules drop 120 px each with an opacity fade (ease-out) at world y≈150, x 200, 600 and 1000. The labels are 26 px: 'Instruction training', 'Step-by-step / reasoning' and 'Web search / (sometimes)'; the last two wrap onto two lines.
- Modules 1 and 2 float in empty sky at x 200–960.
- Module 3 (x 1000–1360, bottom ≈250) hovers ~10 px above the left part of the housing roof (x 1020–1620, top ≈260) without touching it, so it reads as almost mounted but misaligned (f2440).

Still runs at f2380–2422 (1.43 s) and f2434–2457 (0.8 s). The scorer keeps the frozen digit list.
  V2 DIRECTION: SETUP on 'Modern chatbots' (f2270–2294): one controlled pull-back from zoom ~1.4 to ~1.15, centred on the housing with cy ≈400 world. The frame must hold:
- the roof, with room above it for the module stack;
- the whole housing, the chute and the slot;
- ~6 tail tiles.
The floor band stays ≤10% of the frame.

ACTION on 'add more on top:' (f2296–2332): a mounting plate flips up on the housing roof, left of the pipe joint (clank; the housing dips 4 px and recovers).

Then the modules stack, literally 'on top':
- On 'instruction training,' (lands ≈f2349): module 1 lowers on a cable from the ceiling pipe and lands on the plate. It squashes 6%, the housing shudders 3 px, bolt-spin flashes show at its two feet, its lamp blinks on, and the cable unhooks and retracts.
- On 'step-by-step reasoning,' (≈f2386): module 2 stacks onto module 1 the same way.
- On 'sometimes web search.' (≈f2433): module 3 stacks on top.
- The stack compresses 2 px at each landing.

Module size: ~400x84 world, with a one-line label at ~31 px world (≈36 px on screen). Keep '(sometimes)'. The 3-high stack is ~270 px tall, so its top sits near y≈-10 world, inside a frame whose top is ≈-60.

REACTION after each landing: a glow runs down through the stack into the housing, and the scorer's lamps flicker once as the machine accepts the add-on.

SECONDARY: the bars idle-breathe ±1%, and the caret blinks in the slot.

NEXT DEVELOPMENT on 'But' (S3.11): all three module lamps glow together.

CAMERA: one pull-back, then locked.

SOUND: plate clank; three distinct bolt-ons (cable whirr, clamp plus bolt ratchet plus thunk), re-syncing V1's [EL tap] at f2348/2380/2434 to the visible landings; lamp blips.
## S3.11 1:21.9-1:25.6 (V1 f2457-2569) | But the words still come out this way, one piece at a time. (But@2457, the words@2460–2474, still@2477, come out@2483–2493, this way,@2495–2517, one@2519, piece@2526, at a@2535–2540, time.@2541–2558; then the 800 ms pause and the wipe to S4)
  - [high/unclear_when_muted] 'the words still come out this way, one piece at a time' is shown only by a 28 px caption. No piece comes out, and the planned 'three more tiles' beat is missing because `pieceT` is unused.
  - [high/timing_vs_narration] The sound and picture disagree: three tile-click SFX at f2526–2536 play over a completely static frame.
  - [medium/static_hold] f2469–2557 (~2.9 s) with no motion apart from the chip fade, ending the scene on a frozen frame.
  - [medium/phone_readability] The chip 'still assembled one piece at a time' is 28 px in WIDE (≈9 px on a phone), and the module labels are ≈9 px.
  - [medium/weak_transition] A generic straight-edged wipe into the library. There is no motivated link, even though the library spines (S4 f2565) carry the very words the machine is about to write ('Online', 'Algorithms', 'Topics in', 'Learning').
  viewer_should_look_at: The upgraded machine still dropping one token at a time through the same chute onto the belt.
  what_it_should_communicate: Despite the add-ons, output is still produced piece by piece by the same likely-next-chunk process. That bridges to 'why would the likely answer be wrong?'.
  what_actually_happens: f2457–2469: the ink chip 'still assembled one piece at a time' (28 px) fades in, centred at x≈960, y≈821, between the rollers and the floor line.

Nothing else moves from f2469 to f2557 (stills at f2465–2520, 1.87 s, and f2522–2557, 1.2 s). `pieceT` is computed but never rendered, so the planned 'three more tiles' on 'piece' never appear. The mix still plays three [EL tile] clicks at f2526, 2531 and 2536 over the frozen picture.

The scorer shows the stale digit list. The sentence is cut at both edges ('uman' sliver at the left, 'entitle' at the right), and Kal/ai are still blue.

f2557–2569: a straight-edged mask wipe from the right reveals a static S4 library. `sceneOut` would fade from f2572, so it never shows.
  V2 DIRECTION: SETUP on 'But' (f2457): the module lamps glow, then the glow drains down through the stack into the housing: it all funnels into the same core.

ACTION on 'the words still come out' (f2464–2493): the belt restarts, and the scorer resumes on the real next tokens of the recorded answer (tokens_gpt4o_sentence.json). Lock one token per stressed beat:
- ' “' on 'this way,' (≈f2500);
- 'Boost' on 'one' (f2519);
- 'ing' on 'piece' (f2526);
- ',' on 'at a' (f2535);
- ' Online' on 'time.' (f2541).
Each is one full cycle: bars flicker, latch, drop, lock, belt step. These visible locks are where V1's three 'piece by piece' clicks (f2526–2536) belong.

REACTION: the sentence keeps growing to the left of the chute. The chip 'still assembled one piece at a time' lands beside the chute (left of the slot, above the belt, ≥32 px on screen) with a small settle on 'still' (f2477).

SECONDARY: the module lamps blink in sync with each drop: they help, but they don't change the mechanism. The belt hums.

NEXT DEVELOPMENT / TRANSITION (the 800 ms pause, f2558–2581): the camera pushes into ' Online', the last token to lock, until it fills ~35% of the frame width. It then match-cuts (or runs a 6-frame paper wipe) onto the 'Online' spine on the S4 shelf.

CAMERA: the push starts on 'time.' and carries into the cut. No separate wipe.

SOUND: belt restart; five locks on 'this way / one / piece / at a / time'; a paper turn or whoosh on the match cut (V1 'wipe into S4' at f2550); the conveyor hum crossfading into library room tone.

## SCENE PROBLEMS
  - static_hold high motion.json: S3 is still for 28.8 of 41.1 s (70%), in 18 still runs of at least 0.8 s. The runs that hurt, and what should develop during each:
- f2054–2167 (3.8 s, 'Here… likely'): the rewind plus the 'likely' readout.
- f1627–1713 (2.9 s, 'GPT-4o's tokenizer, “Kalai”…'): the chip slides in, and the Kalai block lifts and shivers.
- f1408–1473 (2.2 s, 'builds text out of tokens'): the backspace to the caret, then the perforations.
- f2171–2230 (2.0 s, 'likely. They do not say…'): the bar pulse, then the TRUE? lamp tries and fails.
- f1835–1892 (1.93 s, 'all the possible next chunks and picks'): the bars jostle, overtake and settle.
- f2279–2336 (1.93 s, 'Modern chatbots add more on top'): the roof plate opens, and module 1 lowers.
- f2465–2520 + f2522–2557 (3.1 s, 'still come out this way, one piece at a time'): tokens lock on the stressed beats.
- f1492–1543 (1.73 s, 'chunks that are sometimes whole'): the split settles, then the teal hops.
- f1994–2035 (1.4 s, 'rolls out. Here,'): the machine idles down, then the rewind.
- f2380–2422 (1.43 s): module 2 stacks and the glow runs.
- f1353–1385 (1.1 s): the slip lands, the LED blinks.
  - disconnected_or_floating high Machine geometry is wrong at its core.
(a) The chute (world x≈1550–1604, y 594–670) sits over 'in', ≈250 world px left of the slot after '200' (x≈1800–1850). Its lower end runs behind the tile row (tile tops y≈622): behind 'in' at f1800, and in the CM|U gap at f2060 and f2300.
(b) Tokens hover above the belt in every framing: 38 px in TRACK (f1520), 44 px in KALCAM (f1650), 28 px in WIDE (f2300). The slip floats 56 px above it (f1360).
(c) Picked tiles spin across the panel and vanish behind 'completed' (f1905). The placed tile pops in elsewhere.
(d) The pipe stub dangles empty for 15 s, and its depth (0.7) differs from the housing's (1), so the joint slides on every camera move.
(e) The belt has no stand: it floats 125 px above the floor line, and its rollers never turn.

V2 spec:
- Put the slot after '200' directly under the chute mouth. In V1 coordinates, shift the token row ~250 px left (TRACK_X 120→≈-130) or the housing ~250 px right (HOP_X 1320→≈1570).
- Tiles rest ON the belt: row top ≈TRACK_Y+9 instead of TRACK_Y-18.
- The chute ends ~8 px above the tile tops and never overlaps a tile.
- Pipe and housing share one depth layer.
- The belt runs right to left: after each lock it steps left by the new tile's width plus gap (5–6 frames, ease-in-out, rollers turning, cleat marks moving). The S3.8 rewind runs it backwards.
  - offscreen_or_cropped high Where the sentence is cropped, by framing:
- TRACK f1480–1610: the right end ('complet') is cut.
- KALCAM f1626–1779: 'disser' is cut.
- HOPPER s10 f1797–1960: the tail '…200 [2] [at]' is fully visible. This is the only framing that shows it. A sliced tile sits at the left edge (x 0–9).
- WIDE roll-out f1965–2037: the right end runs off ('entitled' cut, ':' never on screen), and at the same time the left end is sliced ('Adam'→'m' at f1970, 'Ta' at f1980). From then on 'Adam Ta uman' are off-frame.
- HOPPER s11 f2041–2262: ':' is half cut at x≈1870–1920 and '.' is sliced at x=0.
- WIDE s12 f2278–2563: both ends are cut.

The growth edge, where the action happens, is the part that gets cropped. The structural fix is the fixed write head under the chute: the belt carries finished tokens out to the LEFT, and nothing is ever sliced on the right.
  - camera_hurts high There are six camera moves: f1385–1405, f1610–1626, f1779–1797, f1955–1971, f2037–2053 and f2262–2278.
- f1955 (WIDE at 'Token after token') moves away from the scorer and the landing point exactly as they are being explained.
- f2037 undoes that move 82 frames later.
- f1779 overlaps three other animations.
- WIDE (zoom 1) can never hold the ~2,200 px finished sentence plus readable labels.

Rule for V2: one move per sentence, toward the information, finished before the next action starts. The scene needs only these:
- a widen on 'apart.' as the strip unrolls;
- a push to Kal on 'In GPT-4o's';
- a pull-out to the machine on 'At every step';
- a slow push to the year on 'the last digit of the year';
- a pull-back for the module stack on 'Modern chatbots';
- a push into ' Online' for the match cut.
  - unclear_when_muted high Muted, the brief's cycle is not legible: candidates appear → probabilities change → one is favoured → it separates → it drops into the sentence → the sentence advances → the machine evaluates the next. In V1:
- the probabilities never change after one shared ease-out fill;
- the separation is a 360° spin of a duplicate;
- the tile changes colour three times (saffron in flight, blue on landing, paper at f1957), so the eye can't follow one object;
- the sentence never advances, it jumps 70–75 px per frame;
- the s11 'choosing the last digit' is shown after the fact, with no rewind;
- 'whole words' and 'fragments' are never on screen together.
  - motion_quality high The motion-energy plot's big peaks are four camera moves (0:59.3, 1:05.2, 1:07.9, 1:15.4) and the split (0:49.1); the machine itself barely moves.
- Every V1 event is a single ease-out ramp, or a one-frame flip, with no anticipation, overshoot or settle: the scorer appearance, the bars, the tints, the modules, and tiles popping in at 0.7 scale.
- Both the 'unfold' (f1391–1407) and the 'split' (f1473–1491) are cross-fades with visible double exposures (f1395, f1476).
- There is no background life: static wall dots, no rollers turning, no lamp blinks, no vibration.
  - phone_readability high These fail at 640x360:
- 'illustrative numbers' (a guard rail): 6–7.5 px.
- Percentages: 6.7–8 px.
- The slip's 'GPT-4o · 9 May 2025' (a guard rail): ≈5 px.
- Module labels, including '(sometimes)': ≈8.7 px.
- 'NEXT-CHUNK SCORER' in WIDE: ≈8.7 px.
- The closing chip: ≈9 px.
- The s11 card headlines while they are at 35–40% opacity.
  - blank_space medium - TRACK (f1405–1610): y 0–598, ≈55% of the frame, is empty above the text band.
- KALCAM (f1626–1713): y 0–640, ≈59%, is empty.
- HOPPER in s10 (f1797–1955): x 0–670 above the row is empty.
- WIDE (f1340–1385, f1971–2037, f2278–2563): the floor band takes ~20% of the height, and the upper-left quadrant (or the left half below the modules) is empty.
  - timing_vs_narration medium The V1 SFX cue list disagrees with the picture:
- 'the slip unfolds on the track' is synced to f1403 over a cross-fade, and the slip is never on the track.
- 'pick settles' (f1906) fires as the flying tile vanishes behind 'completed'.
- Roll-out clicks 5–6 (f1991, f1997) are for off-frame tiles.
- Three 'piece by piece' clicks (f2526–2536) play over nothing.

In code, `pieceT`, `cRolls` and `sceneOut` are dead. Whole sound categories are missing: chute drop, tile lock, belt motion, machine power-on and ambience.
  - overlap_or_clipping medium - The scorer's 5th row overflows the cream panel and housing border, and '7%' is half hidden whenever the digit list is visible (f1827–1934, f2041–2563).
- The chute's lower end is drawn behind the tiles (f1800 'in'; f2020, f2060, f2300 between CM and U).
- Flying tiles cross the bars and the panel border (f1900, f1950).
- 'ai' overlaps Kal's border (f1755–1779).
  - other medium Continuity: the ChatGPT slip ends S1 stamped WRONG, with '(completed in' circled and '2002' and the title underlined (f800), but enters S3 clean (f1340). Also, S2's 'short version' panel (f1200) previews a mini scorer with Kal / ai / 2002 tiles and a stem feeding '…in 2002 at CMU' straight below it. V1's S3 machine breaks that promise: its chute is off to the right, over 'in'.
  - competing_attention low Leftover highlights:
- Kal/ai stay blue from f1720 to the end (≈28 s), in the same blue as the housing.
- The placed '2' is blue f1905–1957, which groups it with Kal/ai.
- The scorer keeps the stale digit list through s12.
All of these attract the eye in shots where they mean nothing.

## TRANSITION IN
Now: S2 ends on the saffron FUTURE GOT WEIRD / 'AI moves fast. We make it make sense.' ident. S3 enters with a straight-edged mask wipe from left to right (≈f1326–1336). It has no paper edge or shadow: the ident is masked in place, not pushed. The wipe lands on an EMPTY conveyor room, and the slip only slides in from the left edge afterwards (f1336–1352). The [EL whoosh] is synced to f1331.

A deeply motivated transition is not needed: the ident is a chapter break, and a clean wipe is honest. But the wipe should reveal a composed, populated frame: the medium-close of the belt under the idle scorer, with its chute visible top-right (S3.1). The slip, still carrying its S1 WRONG stamp, drops in from the top on 'Let's' (f1340) as the wipe completes, so the first frame of S3 has a subject.

Optional:
- Give the wipe edge a paper edge and a slight shadow so it reads as paper rather than a flat mask.
- Echo S2's 'short version' panel (f1200), which already shows a scorer with Kal / ai / 2002 tiles and a stem feeding '…in 2002 at CMU'. If the V2 machine's chute sits directly over the write point, as that icon promises, the viewer gets a light visual rhyme.

## TRANSITION OUT
Now: a straight-edged mask wipe from the right (≈f2557–2569) goes from a frozen WIDE frame (sentence cut at both ends, floating modules, stale scorer) onto a static S4 library wide. `sceneOut` (it would fade from f2572) never shows.

Recommended: the brief's 'token becomes part of another element'.
- The closing roll-out ends with the real next title token ' Online' locking under the chute on 'time.' (f2541).
- In the 800 ms pause (f2558–2581), the camera pushes into ' Online' until it fills ~35% of the frame width.
- It then match-cuts, or uses a 6-frame paper wipe, onto the S4 shelf at the 'Online' spine. S4 at f2565 shows 'Online', 'Algorithms', 'Topics in' and 'Learning' spines.
- S4's first frames then ease back to its wide.

This gives 'So why would the likely answer be wrong? Think about what the model learned from.' a visual reason. Crossfade the conveyor hum into library room tone under the cut. Use one move only; don't stack a camera move and a separate wipe. This requires the S3.9 pause to restore the sentence after the S3.8 rewind, so the S3.11 tokens (' “', 'Boost', 'ing', ',', ' Online') follow on from ':' in the recorded answer.

## SOUND MOMENTS
[
 "0:43.9–0:44.4 (f1318–1331) wipe from the brand ident: paper swipe whoosh (exists, [EL whoosh] synced to f1331)",
 "0:44.4 onward: very low conveyor-room ambience (motor hum, faint electrical buzz) under the whole scene. It swells slightly at power-on (1:00.5) and dips at idle (1:07.5).",
 "0:44.7–0:45.0 'Let's' (f1340–1347): slip drops in from the top: short paper fall, then a soft flat landing tap on the belt",
 "0:45.3 'ChatGPT's' (~f1360): standby LED double blip and a tiny housing rattle",
 "0:46.4 'apart.' (f1391–1405): paper unroll/flap. Move V1's 'slip unfolds' [EL slide] from sync f1403 to the unroll start.",
 "0:48.2–0:48.9 'builds text' (f1446–1466): fast, soft backspace ticks as the text after '200' erases. The caret is silent.",
 "0:48.7–0:49.2 'out of tokens' (f1460–1475): faint perforation scoring ticks",
 "0:49.2–0:49.7 'tokens:' (f1475–1490): cascade of 15 dry clicks synced to the visible snaps (re-time V1 synth cascade f1473–1489)",
 "0:51.4–0:52.2 'whole words,' (f1543–1566): 4 soft, low wooden ticks as the teal tiles hop",
 "0:52.4–0:53.2 'sometimes fragments.' (f1572–1597): 4 higher ticks with a different timbre as the saffron tiles hop",
 "0:55.0 'tokenizer,' (f1650): factual chip slides in and settles",
 "0:55.7 '“Kalai”' (f1672): small lift whoosh as the merged Kalai block rises",
 "0:57.3 '“Kal”' (f1719): crisp crack/snap (repurpose V1 [EL tile] synced f1721)",
 "0:58.4 '“ai.”' (f1753): tile slide (V1 [EL tile] f1757)",
 "0:58.9–0:59.4 pause (f1767–1784): two clacks as Kal and ai re-seat in the row",
 "0:59.5–1:00.0 'At every step,' (f1784–1800): no SFX on the camera move; let the hum carry it",
 "1:00.5 'the model' (f1815): relay clunk, rising hum, lamp blips left to right",
 "1:00.9–1:01.3 'scores' (f1827–1839): five tile drops into the candidate slots",
 "1:01.4–1:02.8 'all the possible next chunks' (f1842–1883): rising ratchet ticks per bar (re-time V1 'scorer sweep' f1827–1843 to the staggered bars), then fine ticking that slows to a stop on 'and' (f1885)",
 "1:03.0 'picks' (f1890): latch clunk + lamp blink",
 "1:03.1–1:03.4: pneumatic eject puff, short chute rattle",
 "1:03.4 (~f1903): wooden lock click + tiny bounce as '2' locks in the slot (replaces V1 'pick settles' f1906, which currently fires as the tile vanishes behind 'completed')",
 "1:03.6 (f1906–1912): belt step: short motor pulse + roller rumble",
 "1:04.0 'Then it goes again' (f1919–1935): reload ratchet (V1 f1927–1937) + four candidate drops",
 "1:04.4–1:05.1 'again.' (f1931–1952): latch, puff, chute rattle, lock, belt step for ' at' (re-sync V1 'second pick settles' f1955 to the visible lock)",
 "1:05.2–1:06.6 'Token after token,' (f1957–1997): accelerating, slightly pitch-stepped run of six lock clicks plus belt steps, each on a visible lock (re-sync V1 six [EL tile] f1967–1997; never play a click for an off-frame tile)",
 "1:07.0 'rolls out.' (f2010–2027): idle-down: hum dips, one last relay tick",
 "1:08.0–1:08.6 'Here,' (f2041–2057): tape-rewind zip with 8 reverse tile ticks; soft click as '2' re-seats in the scorer",
 "1:09.9 'year.' (f2096): soft swish as the saffron underline draws (optional, very quiet)",
 "1:10.8 'Those scores say' (f2125): servo whirr as the first readout arm extends from the housing",
 "1:12.4 'likely.' (f2173): bright pluck/chime with the 2→1→0→5→3 bar pulse (V1 'likely' synth f2173)",
 "1:13.2–1:14.3 'They do not say which one' (f2197–2231): second readout servo; the TRUE? lamp tries to light: dull 'dud' click + dying buzz",
 "1:14.7 'true.' (f2240): firm thunk + 2 px housing jolt (V1 'not the true one' synth f2240)",
 "1:15.1–1:15.6 pause (f2252–2269): readouts retract (servo), then a fast-forward zip as the 8 tokens re-drop",
 "1:16.2 'add more on top:' (f2296–2332): roof mounting plate flips up: clank",
 "1:18.3 / 1:19.5 / 1:21.1 'instruction' / 'step-by-step' / 'web' (landings ≈f2349, f2386, f2433): cable whirr, clamp + bolt ratchet + thunk, lamp blip. Each landing is a slightly heavier stack compression. These replace V1 [EL tap] f2348/2380/2434.",
 "1:21.9 'But' (f2457): subtle electrical swell, up then down, as the module glow drains into the housing",
 "1:22.1 'the words still come out' (f2464): belt motor restart",
 "1:23.3–1:24.7 'this way, one piece at a time' (≈f2500, 2519, 2526, 2535, 2541): five lock clicks on the stressed beats, with belt steps (re-sync V1's three 'piece by piece' [EL tile] f2526–2536, which currently play over a still frame)",
 "1:25.2–1:25.9 pause (f2558–2581): push into ' Online' + match cut: paper turn/whoosh (V1 'wipe into S4' f2550); conveyor hum crossfades into library room tone"
]

## PHONE-CRITICAL TEXT
[
 "Slip header (guard-rail model/date label): 'ChatGPT' is 23 px and 'GPT-4o · 9 May 2025' is 16 px (0.62 x fontSize 26) in WIDE, ≈5.4 px on 640x360. FAILS. In V2, slip fontSize 36 at zoom 1.25 gives ≈28 px on screen for the detail line.",
 "Slip body (the wrong answer): 26 px in WIDE (≈9 px on a phone). FAILS on its own. V2: ≈45 px on screen (fontSize 36 x zoom 1.25).",
 "One-line sentence 'Adam Tauman Kalai's Ph.D. dissertation (completed in 200': 40 px x 1.35 ≈ 54 px (≈18 px on a phone). SURVIVES.",
 "Token tiles: 36 px world → 49 px TRACK, 58 px KALCAM, 45 px HOPPER, 36 px WIDE (≈16 / 19 / 15 / 12 px on a phone). WIDE is MARGINAL. Cropping: the right end is off-frame f1480–1790 and f1965–2563; the left end ('Adam Ta uman') is off-frame in WIDE from f1970 on. V2: ≥40 px on screen, and nothing sliced on the right.",
 "Space token shown as '␣': legible but meaningless. Add a 'space' sub-label (TokenTile sub prop).",
 "'whole words' / 'fragments' chips: 24 px x 1.35 ≈ 32 px (≈11 px on a phone), placed below the rollers. MARGINAL. Target ≥36 px on screen, placed on the belt's front face next to their tiles.",
 "Chip '“Kalai” → “ Kal” + “ai” · GPT-4o tokenizer (o200k_base)' (factual label): 24 px x 1.6 ≈ 38 px (≈13 px on a phone). Barely SURVIVES. Keep ≥36 px on screen. The leading space in '“ Kal”' reads like a typo at phone size.",
 "'NEXT-CHUNK SCORER' header: 26 px x 1.25 ≈ 32 px in HOPPER (≈11 px on a phone), MARGINAL. 26 px in WIDE (≈8.7 px), FAILS.",
 "'illustrative numbers' chip (guard rail): 18 px x 1.25 ≈ 22 px in HOPPER (≈7.5 px on a phone); 18 px in WIDE (≈6 px). FAILS. V2: 24 px world, ≥28–30 px on screen wherever it is visible.",
 "Candidate digits 2/1/0/5/3 and at / , / in / ): 30 px x 1.25 ≈ 37 px (≈12.5 px on a phone). SURVIVES.",
 "Percentages 31% / 26% / 12% / 9% / 7%: 20 px x 1.25 = 25 px (≈8 px on a phone). FAILS. '7%' is also half hidden under the panel border (f1881, f2060), and the second list has no % at all. V2: 24 px world, all inside the panel.",
 "'WHAT THE SCORE MEASURES' / 'NOT MEASURED' labels: 22 px x 1.25 ≈ 27 px (≈9 px on a phone). MARGINAL. Target ≥30 px on screen.",
 "'How likely the chunk is' / 'Whether it's true' (the scene's key claim): 34 px x 1.25 ≈ 42 px (≈14 px on a phone). Survives ONLY at full opacity; V1 shows them at 35–40% for 3.8–6 s (f2045–2244), so they FAIL for that time. They also sit ≈22 px from the left frame edge.",
 "Module labels 'Instruction training' / 'Step-by-step reasoning' / 'Web search (sometimes)': 26 px in WIDE (≈8.7 px on a phone). FAIL. The factual hedge '(sometimes)' wraps onto a second line. Target a one-line label at ≥36 px on screen.",
 "Closing chip 'still assembled one piece at a time': 28 px in WIDE (≈9 px on a phone). FAILS. Target ≥32 px on screen, beside the chute."
]

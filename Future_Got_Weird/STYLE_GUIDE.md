# Future Got Weird — production style guide (visual, motion, sound)

The look is **warm paper cutout animation**: flat fills, bold ink outlines, big friendly shapes, three depth
planes, real documents pinned into the set like evidence on a board. It should feel like a staged illustrated
story, not a slide deck.

## Palette

| Role | Hex | Use |
|---|---|---|
| Warm paper | `#FAF3DF` | Scene base and most cards |
| Ink | `#162A32` | Outlines (4 px at 1080p), text, grounding shapes |
| Saffron | `#FFC744` | Hooks, the counter set, the game show, attention |
| Teal | `#1CA7A0` | Evidence and verified details |
| Coral | `#EF6B55` | Incorrect details, corrections, the WRONG stamp |
| Blue | `#4F7CC9` | Mechanisms, the apparatus set |
| Wood | `#C9924F` / `#9E6B30` | Counters, shelves, desks |

Meaning is carried by colour **and** a label, never colour alone (teal "university ✓", coral "year · off by one").
Light tints (`tealLight`, `coralLight`, `saffronLight`, `blueLight`) are the big colour fields behind scenes.
No dark fields, no grids, no vignettes, no glow.

## Typography

| Face | Role | Sizes at 1080p |
|---|---|---|
| Fredoka (variable) | Headlines, signage, stamps | 56–112 px statements, 36–48 px signs |
| Nunito (variable) | Labels, chips, UI | 22–34 px |
| Source Serif 4 (variable) | Document quotes, answer slips, token tiles | 26–40 px |
| JetBrains Mono | Scores, digits, catalogue cards | 30–150 px |

Text appears to name things the viewer needs: exact titles, dates, models, one idea label, a value. No word-by-word
caption streams. Captions are a separate SRT. Verify every chip at phone size (a 480 px wide crop should still read).

## Cast

Original, metaphorical, reusable. Looks live in `source/src/components/cast.ts`; the rig is `Character.tsx`.

| Character | Role | Look |
|---|---|---|
| Clerk A | the confident answer clerk (ChatGPT's slip) | teal visor, teal vest, name tag |
| Clerk B | second clerk | bun, blue cardigan, glasses, earring |
| Clerk C | third clerk | curly hair, saffron polo, headset |
| The fact-checker | verification, stamps, deadpan reactions | grey bob, round glasses, coral cardigan, pencil behind the ear |
| Honest | quiz contestant who says "I don't know" | green sweater, calm |
| Guesser | quiz contestant who always answers | red spiky hair, striped shirt, cheeks |
| Host | game-show host | tux jacket, bow tie, beard |
| A person | the "works on people too" callback | blue top, auburn bob |

Clerks never carry a company logo or product colour scheme. The slips carry the model name as text because the
published excerpts are evidence.

Rig: `Pose` = two arms (shoulder angle, elbow bend), lean, head tilt, pupil direction, brows (and one-brow
asymmetry), mouth state (smile, grin, flat, o, smirk, frown, hmm, talk), bob. `mixPose` blends poses. Blinks are
deterministic from the frame and a seed. A front arm can be drawn in a second pass so a hand rests on a counter.

## Props and sets

Props: answer `Slip` (cream card, gold edge, serif text, model header, `StampMark`), `StampHand` (the big hand
from the frame edge), `Trophy` (with cartoon feet for the walk-back gag), `Podium`, `Scoreboard`, `AnswerTile`,
`RuleCard`, `TokenTile`, `Gauge`, `Dial`, `BookRow`, `Catalogue`, `Cake`, `Bell`, `Confetti`, `Magnifier`,
`Seal`, `Bubble`, `QuestionCard`, `Tape`, `Evidence` (a real crop pinned with tape, fractional highlight boxes,
labels, integrated source chip).

Sets (`Sets.tsx`): `CounterSet` (saffron wall, three service windows, hanging sign, wood counter in the
foreground plane), `LibrarySet` (teal wall, four spine rows, uprights, wood floor), `StageSet` (curtain,
spotlights, blue stage), `ApparatusSet` (blue wall, pipes, track), `DeskSet` (corkboard, desk). Each set has
background (depth 0.7–0.85), subject (1.0) and foreground (1.05–1.2) layers.

## Camera and motion

- One `Camera` per scene; framings are named constants and blended with `camLerp` over 14–20 frames,
  ease-in-out. No perpetual zoom. Holds are real holds.
- A meaningful action or composition change every 4–8 seconds; evidence holds can be longer.
- Anticipation and settle: props `pop` in (spring with a little overshoot), stamps impact with a scale-in,
  characters change pose over 10–14 frames.
- Scene changes are a hard paper wipe (12 frames, alternating direction), not a cross-fade. No whoosh on every cut.
- Deterministic: every value derives from the frame number and seeded `rand`. No wall clock, no `Math.random`,
  no layout that re-wraps text while moving (move containers, not text widths).
- Thin lines never drift by sub-pixels through a hold; use whole-pixel positions for static elements.

## Evidence treatment

Real crops only. Establish the document, then move the camera (or `focus`) to the relevant detail. Highlight
boxes are rounded, slightly rotated, 4 px, teal/coral/ink, with a label chip. The integrated source chip sits
under the card ("Kalai (2001), PhD thesis title page · CMU-CS-01-132"). Full citations go in the description.

## Sound

Prop sounds on actions (slip lands, stamp, tile click, drawer, cart, scoreboard, trophy sting). One restrained
hit on the title moment. Music is light and bouncy, changes with scenes, drops out for the jokes and reveals.
Mix to about −16 LUFS integrated, −1.3 dBTP, voice 15–18 dB over music while speaking.

## Accuracy labels used in this episode (reuse the wording)

"Published excerpt", "illustrative numbers", "illustrative quiz · expected scores", "simplified illustration",
"argued in Kalai et al. 2025", "one explanation · not the whole story", "rarely, or not at all · unknown for
these models", "more consistent · not necessarily more correct".

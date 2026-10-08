# Storyboard: Video 01, pass 2 — "Why AI Is So Confidently Wrong"

> **Historical (pass 2 / V1).** The V2/V3 film runs 4:48.23 (8,647 frames) with per-boundary cut / reveal / wipe /
> iris transitions (`source/src/Main.tsx`). Each V2 scene file (`source/src/scenes/S*.tsx`) opens with its own
> word-keyed beat list, which is the current storyboard.

Runtime 4:40.8 (8,425 frames at 30 fps). Ten scenes, each a cutout-paper set with original characters and props.
Every scene is driven by the measured word timings in `source/src/data/timeline.json`; the cue words quoted below
are the ones the scene code uses, so a line edit that changes a cue word fails `tools/check_cues.py` instead of
silently breaking a scene. Scene changes are 12-frame paper wipes centred on the boundary (direction alternates).

Cast (all original, see `Future_Got_Weird/STYLE_GUIDE.md`): three counter clerks (visor, bun and cardigan, curly
hair and headset), the fact-checker (grey bob, round glasses, pencil), the honest contestant, the guesser (spiky
red hair, striped shirt), the game-show host (jacket, bow tie), and a member of the public. The big stamping hand
is a prop, not a character.

| # | Scene | Frames | Time | Set |
|---|---|---|---|---|
| 1 | The counter | 0–820 | 0:00–0:27 | Three service windows, a counter, a wall clock |
| 2 | The short version | 820–1331 | 0:27–0:44 | Paper field, title card, three panels, channel sting |
| 3 | The token machine | 1331–2563 | 0:44–1:25 | Conveyor track, scorer housing, hopper, add-on modules |
| 4 | The library | 2563–3612 | 1:25–2:00 | Four shelves of books, card catalogue |
| 5 | The record | 3612–4295 | 2:00–2:23 | Desk, pinned evidence, magnifier |
| 6 | The game show | 4295–5698 | 2:23–3:10 | Curtain stage, two podiums, scoreboard, trophy |
| 7 | Benchmarks | 5698–6232 | 3:10–3:28 | Paper field with Table 2, tally, leaderboard |
| 8 | What helps | 6232–6659 | 3:28–3:42 | Assembly machine, retrieval cart, evidence booth |
| 9 | Verify | 6659–7435 | 3:42–4:08 | Fact-checker's desk, two question cards |
| 10 | Payoff | 7435–8425 | 4:08–4:41 | The counter again, then the end card |

## Scene 1 — The counter (s01–s05)

**Beat 1 (s01, "question:").** Wide on the three windows. A question card types itself out above the counter:
*what was the title of Adam Kalai's dissertation?* The clerks look up.

**Beat 2 (s02, "ChatGPT", "DeepSeek", "Llama").** Each clerk slides a slip out of their window in turn (pop +4
frames; the paper slide sound lands on the settle). The slips carry the verbatim Table 1 excerpts, labelled with
model and date. The camera pushes on slip A while "title," "university," "year." are marked on it in coral.

**Beat 3 (s03, "All", "year.").** The big hand enters from the left and stamps WRONG on A, B and C (stamps at
+2, +12, +22 frames after "All"; the thud lands one frame after each press). On "year." the three years are circled
and the chip *Three different years · none of them right* appears.

**Beat 4 (s04, "And", "lead").** Cut-in: the real paper header (arXiv header crop, taped) lands; a box draws
around the lead author with the label "Lead author". Chip: *Published test · Kalai, Nachum, Vempala & Zhang (2025)*.

**Beat 5 (s05, "Very", "fictional.").** Camera pushes on the fact-checker at the end of the counter. Joke
caption: *Very professional. Very fictional.* The fact-checker's deadpan is the punchline; the clerks go back to
looking proud.

## Scene 2 — The short version (s06–s07)

**Title moment (s06, "sure?").** Headline *Why AI Is So Confidently Wrong* snaps in on "sure?" with the one
low title hit and the music's hit. Then "Here's the short version" swaps the title for three panels.

**Three claims (s07).** Panel 1 on the first word: a token tile labelled *likely ≠ true*. Panel 2 on "Checking":
a scoreboard, with "different tests" underlined. Panel 3 on "tests": a slip stamped GUESSING PAYS on "guessing."

**Channel sting.** A beat after the last word, a saffron card with the Future Got Weird wordmark and tagline
swings in and holds about two seconds, then hands off to Scene 3.

## Scene 3 — The token machine (s08–s12)

**Beat 1 (s08, "apart.").** ChatGPT's slip arrives on the conveyor and unfolds.

**Beat 2 (s09, "tokens:", "Kal", "ai.").** The sentence splits into real GPT-4o (o200k_base) token tiles. The
camera moves to "Kalai", which breaks into "Kal" and "ai" (two tile clicks). Chip: *real tokens · o200k_base*.

**Beat 3 (s10, "every", "scores", "picks", "again.", "Token", "rolls").** Push on the scorer housing: candidate
chunks with illustrative bars (31 / 26 / 12 / 9 / 7 %, labelled *illustrative*). Nine ticks sweep, the pick settles,
the list reloads, a second pick settles, then the answer rolls out one real token at a time (six tile clicks).

**Beat 4 (s11, "Here,", "likely.", "true.").** The LIKELY versus TRUE panel to the left of the scorer: "it
picked the likely one" (a bright pluck), "not the true one" (a low tone).

**Beat 5 (s12, "instruction", "step-by-step", "web", "But", "piece").** Three add-on modules bolt onto the
machine (taps), then "piece by piece" shows three more tiles. Chip: *simplified diagram*.

## Scene 4 — The library (s13–s16)

**Beat 1 (s13, "learned").** Headline *What the model learned from*. The clerk walks in; the shelves light up.

**Beat 2 (s14, "sound", "Methods.", "Algorithms.", "Machine", "Shelf").** The camera pans along the top shelf
while the spine words *Methods.*, *Algorithms.*, *Machine Learning.* pop as saffron call-outs (three wooden tocks).

**Beat 3 (s15, "But", "rarely,", "birthday,", "pattern").** Camera to the catalogue. The clerk opens a drawer
(wooden slide, stop on frame +26); the card reads *KALAI, A. · 2001 — title: ____*. On the third shelf a dashed
gap marks the missing book; the chip *rarely, or not at all* sits above it, a birthday cake pops into the gap on
"birthday," and *no pattern to learn from* appears below. Bottom chip: *a birthday shows up rarely, or not at
all · training exposure is unknown for these models*.

**Beat 4 (s16, "So", "fills", "confidence", "Is", "think.", "maybe.").** Camera to the clerk. Three words fly
off the shelves into a slip the clerk holds up: ChatGPT's published title, with the chip *a title-shaped answer ·
simplified illustration*. On "confidence" a seal reading IS ENTITLED lands on it. "I think" and "maybe" appear and
are struck through (two marker strokes).

## Scene 5 — The record (s17–s19)

**Beat 1 (s17, "thesis:", "Probabilistic", "Carnegie", "May").** The thesis title block (real crop, taped)
lands; the camera pushes to the title, the university and the date as each box draws.

**Beat 2 (s18, "ChatGPT", "right.", "year", "one.", "title", "invented.", "every", "solid").** The ChatGPT slip
comes alongside. The university matches (chime); the year is off by one (thunk); the title is invented (lower
thunk). "Every line solid" highlights the slip's confident wording.

**Beat 3 (s19, "confident", "just").** The fact-checker leans in with a magnifier over the slip: *nice font*.

## Scene 6 — The game show (s20–s25)

**Beat 1 (s20, "Why" #2, "argue", "graded.").** The host walks on; the sign *How tests are graded* lands.

**Beat 2 (s21, "Picture", "Right", "Wrong", "I").** Three rule cards: Right +1, Wrong 0, "I don't know" 0.

**Beat 3 (s22, "Two", "Both", "honest", "blank.", "Six").** Two podiums land. The honest contestant answers six
and leaves four blank (ten tile clicks); the scoreboard shows **6** on "Six" (tock).

**Beat 4 (s23, "guesser", "Four", "lands.", "Seven").** The guesser fills the same four with guesses; they
resolve on "lands." and the scoreboard shows **7** (tock). Scores are labelled *example*.

**Beat 5 (s24, "One", "Three", "Somehow,", "trophy.").** Caption *One lucky guess. Three wrong answers.* The
trophy pops onto the guesser's podium with the short brass fanfare and confetti.

**Beat 6 (s25, "change", "costs", "still", "plus", "minus", "Four.", "trophy").** The Wrong card flips to −1
(rule flip). The guesser's score becomes 7 − 3 = **4** (three low tones, tock); the honest contestant keeps 6.
The trophy grows feet and walks, sweating, from the guesser to the honest podium (seven little footsteps). Caption:
*Change the rule, and the trophy walks back.*

## Scene 7 — Benchmarks (s26–s27)

**Beat 1 (s26, "ten", "Nine", "strictly", "no").** Table 2 (real crop, taped, CC BY 4.0) lands with the chip
naming its source and sample ("ten benchmarks sampled from major leaderboards, mid-2025"). A tally at the right
counts the rows graded strictly right or wrong up to **9 / 10** as the rows sweep (WildBench is the exception, with
partial credit). The IDK-credit column gets the label *IDK credit: none*.

**Beat 2 (s27, "Train", "pays.", "It's", "simple").** The table shifts left and a leaderboard with a small trophy
lands: *train and rank on tests like that, and guessing pays*.

## Scene 8 — What helps (s28)

A single long line. The retrieval cart rolls in with the real record ("Search") and the evidence booth's shutter
opens; chip *the real record is now in the room*. A thought bubble for "Reasoning". The camera moves to the
assembly machine, whose randomness dial is "turned down" ("Turning", six clicks). Three identical slips land
("consistent,") and all three are stamped WRONG ("correct."): *more consistent · not necessarily more correct*. On
"None" the NO GUARANTEE stamp lands bottom centre.

## Scene 9 — Verify (s29–s32)

**Beat 1 (s29, "check.").** Sign: *the unglamorous move*.

**Beat 2 (s30, "Two", "exist?", "say").** Two question cards pop: *1. Does the source exist?* and *2. Does it
actually say this?*

**Beat 3 (s31, "Take", "Is", "Yes.", "Does", "No.", "It", "2001.").** Camera to the desk. The ChatGPT slip is
pinned, then the thesis title page (real crop). Card 1 turns YES (chime). The claimed title and year are marked in
coral on the slip; card 2 turns NO (low tone); the real title and 2001 are marked in teal on the record.

**Beat 4 (s32, "Source", "Claim", "Stamp").** Tags *Source exists* and *Claim fails*; the big hand stamps CLAIM
FAILS across the slip.

## Scene 10 — Payoff (s33–s36)

**Beat 1 (s33, "Because", "patterns", "being", "evidence").** Back at the counter. Two columns: SOUNDING RIGHT
comes from patterns in language; BEING RIGHT takes evidence the model does not have (chip: *Kalai (2001) · thesis
title page*).

**Beat 2 (s34, "don't", "Ask", "actually").** *Does it sound right?* is struck through. Two question cards: *What's
the evidence?* and *Does it actually say this?*

**Beat 3 (s35, "chatbots.", "people,").** The clerks nod. A member of the public arrives at the third window with
the slip *Trust me, I read it somewhere.* The hand stamps SOURCE? on it (the visual callback to the hook).

**Beat 4 (s36, "This", "twice", "subscribe.").** End card: wordmark and tagline, *New episodes twice a week*, a
Subscribe chip, and *Sources, excerpts and credits are in the description.* The music's end chord lands on the
first word; the picture fades in the last 22 frames.

## Jokes (dry, no laugh cues)

1. Scene 1: *Very professional. Very fictional.* (fact-checker deadpan)
2. Scene 5: the magnifier finds a *nice font*.
3. Scene 6: the trophy walks back on its own feet, sweating.
4. Scene 10: *Trust me, I read it somewhere.* stamped SOURCE? (the stamp callback).

## Evidence on screen (all real crops, taped, with source chips)

| Scene | Asset | What is highlighted |
|---|---|---|
| 1 | `paper_p01_header.png` | Lead author |
| 1, 2, 5, 8, 9, 10 | Table 1 excerpts as slips | Verbatim answers, labelled by model and date |
| 5, 9 | `thesis_title_block.png`, `thesis_titlepage_top.png` | Title, Carnegie Mellon, May 2001 |
| 7 | `paper_p14_table2.png` | Binary-grading column, BBH and HLE rows, IDK-credit column |

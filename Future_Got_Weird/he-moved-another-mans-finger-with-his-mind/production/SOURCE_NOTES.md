# Source notes and claim ledger (narration V1)

Checked on 4 Nov 2026 against the proposed V1 narration (`NARRATION_PROPOSED_V1.txt`).

**Method.** Four research agents covered four areas: the 2013 demo, the 2014 study, BrainNet, and framing/hardware.
Each result then went to an independent checker told to refute every verdict.

**Access limits.** This session's network policy blocks `journals.plos.org`, `europepmc.org`,
`homes.cs.washington.edu` and `www.nature.com`, so no source page was opened directly. The evidence below comes from
web-search returns that quote or summarise the papers, UW News and the pilot page. Wording marked *via search* should
be re-read in the original before any of it goes on screen as a quotation. The raw verdicts are in
`../research/factcheck_V1_2026-11-04.json`.

## Sources

| ID | Source |
|---|---|
| S1 | Rao, Stocco et al., *Direct Brain-to-Brain Communication in Humans: A Pilot Study*. UW pilot page, 12 Aug 2013, `homes.cs.washington.edu/~rao/brain2brain/experiment.html` (game rules, figures, session log) |
| S2 | UW News, 27 Aug 2013, "Researcher controls colleague's motions in 1st human brain-to-brain interface" |
| S3 | Rao RPN, Stocco A, Bryan M, Sarma D, Youngquist TM, Wu J, Prat CS (2014), "A Direct Brain-to-Brain Interface in Humans", *PLoS ONE* 9(11): e111332, published 5 Nov 2014 (PMC4221017). Also the tech report UW-CSE-14-07-01. |
| S4 | UW News, 5 Nov 2014, "UW study shows direct brain interface between humans" |
| S5 | Jiang L, Stocco A, Losey DM, Abernethy JA, Prat CS, Rao RPN (2019), "BrainNet: A Multi-Person Brain-to-Brain Interface for Direct Collaboration Between Brains", *Scientific Reports* 9:6115, 16 Apr 2019. Preprints: arXiv 1809.08632 and bioRxiv 425066, Sept 2018. |
| S6 | UW News, 1 Jul 2019, "Play a video game using only your mind" (the two viewpoints, the "bad Sender", results) |
| S7 | Rao & Stocco, *Scientific American* essay on the experiments (secondary, written by the researchers) |

## Claim ledger

Status values: **Verified** (a source states it), **Verified, wording** (accurate but a word choice is loose; see
`SCRIPT_REVIEW_V1.md`), **Imprecise** (a correction is proposed).

| ID | Narration claim | Source | Status | Notes and visual treatment |
|---|---|---|---|---|
| C01 | His imagined movement moved someone else's finger | S2, S1 | Verified, wording | UW: Stocco's "right index finger moved involuntarily to hit the 'fire' button". "With his mind" is a hook; the mechanism follows within 30 s. Rao: the system "only reads certain kinds of simple brain signals, not a person's thoughts" (S2). |
| C02 | The receiver was across campus and couldn't see the game | S2, S7 | Verified | Stocco "wore noise-canceling earbuds and wasn't looking at a computer screen" (S2). Don't show him watching the game. |
| C03 | 2013, University of Washington, Rajesh Rao and Andrea Stocco | S1, S2 | Verified | Pilot sessions on 12 Aug 2013; announced 27 Aug 2013 |
| C04 | Split between two buildings; Rao had the screen, Stocco the space bar | S2, S1 | Verified, wording | 2013 sources say "labs on the other side of the UW campus". "Separate buildings" is stated explicitly only for 2014 (S4). Two labs across campus are two buildings. No change needed. |
| C05 | Defend a city: let the supply plane through, shoot down the pirate ship's rocket | S7, S1, S3 | Verified | The log labels trials "Missile" and "Airplane", with counters such as "Missiles hit: 2, Airplanes hit: 0" (S1). In 2014 half the trials were planes. |
| C06 | Rao imagines moving his right hand; his real hand stays put; an EEG cap reads a rhythm change | S2, S3 | Verified | "imagined moving his right hand (being careful not to actually move his hand)" (S2). Mu-band power drops (11–13 Hz control band, S3). |
| C07 | A cursor climbs; when it hits the target, one command goes over the internet | S1, S3 | Verified | A white cursor starts at the left and rises to a large blue circular **Fire** target at the top. At rest it drifts down. A "fire" command goes over the Internet to the TMS machine (S1). |
| C08 | The coil sits over the brain area that helps move his right hand | S2, S7 | Verified | "placed directly over his left motor cortex, which controls hand movement" (S2). The pilot page says the wrist-and-finger area. |
| C09 | His hand jerks up, comes down on the space bar, and the cannon fires | S1 (via search), S3 | Verified | The hand rests "slightly above the 'fire' key". The pulse gives "a quick upward jerk"; "this up-down movement … typically (though not always) results in the 'fire' key being hit" (S1). Wrist extension (S3). |
| C10 | Stocco likened the sensation to a nervous tic | S2 | Verified | This is UW's paraphrase, not a direct quote. Never show it in quotation marks as Stocco's words. |
| C11 | "lab notes": the first session ended early because the network connection failed | S1 | **Imprecise** | "Session 1 was terminated early due to network communication issues, which were resolved as the subjects waited for the next session." It is in the public pilot write-up, not lab notes, and the issue was a network communication problem, not a confirmed connection failure. Fix proposed. |
| C12 | A year later: three pairs of volunteers | S3, S4 | Verified | UW (Nov 2014): "following the team's initial demonstration a year ago". The sessions ended before July 2014. Six participants aged 21–38. |
| C13 | The receiver's hand rested over a touchpad | S3, S4 | Verified | "right hand positioned over the only touchpad that could fire the cannon" (S4). The press comes on the downward part of the movement (S3). |
| C14 | In some rounds the coil was flipped over; same game, same pulse strength | S3, tech report | Verified | Each pair ran two experimental and two control blocks in random order. The coil was "rotated 180 degrees on the axis of its handle", at "the same power output". |
| C15 | The participants couldn't tell which way the coil was facing | S3 (via search) | Verified | "None of the participants could distinguish between the two coil positions." They knew there were two conditions, but not which block was which. |
| C16 | One pair hit about 5/6 of rockets, another about 1/4 | S3 Table 2 | Verified | Rockets hit: 83.33 % / 25.00 % / 37.50 %. Planes wrongly hit: 37.50 % / 18.75 % / 0 %. The best pair also shot down friendly planes, so don't animate a flawless pair. |
| C17 | With the coil flipped, nobody pressed the touchpad once; every rocket got through | S3 | Verified | "the complete lack of touchpad presses during the control blocks"; 0 % of rockets in control. The one stray press in the whole study fell outside the control blocks. |
| C18 | 2019: three people, a falling-block game, three separate rooms | S5, S6 | Imprecise (date) | "different rooms in the same building". The paper is from 2019, but it was preprinted in Sept 2018, so the games were played in 2018 or earlier. Fix proposed. "Six years later" (2013 to the 2019 paper) can stay. |
| C19 | Two players could see the gap; the third saw only the block and decided whether to rotate | S5, S6 | Verified | The Receiver sees only the top of the screen. The choice was to rotate 180° or not. Half the trials needed a rotation. |
| C20 | Each teammate sent a vote | S5, S6 | Verified | SSVEP: a Sender stares at an LED flashing on the left (17 Hz, Yes/rotate) or right (15 Hz, No). Some press coverage reverses this mapping; follow the paper. |
| C21 | The coil was at the back of the head, over the visual cortex; a flash meant "rotate", no flash "leave it" | S5, S6 | Verified | Magstim figure-eight coil at O1, the lower back of the head, flush, handle parallel to the floor (via search). Each pulse is 1 ms, one per Sender, given in turn. Open item: whether "No" meant no pulse or a pulse below the flash threshold. Narration is safe either way; check before staging the "no" pulse. |
| C22 | One vote from each teammate, a choice, then a second chance to change the answer | S5 | **Imprecise** | After round 1 the Senders see the half-fallen block and send **new** votes; the Receiver decides again. The narration omits the fresh votes. Fix proposed. The Receiver answers by staring at the same flashing-LED interface, not by pressing a key. |
| C23 | On 10 of 16 trials the computer flipped one teammate's advice | S6, S5 | Verified | "picked one of the senders to be a 'bad sender' and flipped their responses in 10 out of the 16 trials" (S6). Applied in both rounds. The paper: "our software". The flip happens after the Sender gives the vote, as the brief stages it. |
| C24 | Receivers learned whose signal to trust | S5, S6 | Verified | Mutual information with the good Sender was significantly higher in all five triads. |
| C25 | Five teams cleared the line about 13 times out of 16 | S5, S6 | Verified | Mean 0.8125 = 13/16 (S5). UW: "cleared the line 81 percent of the time, or for 13 out of 16 trials." This is a mean across teams, and "about" covers it. |
| C26 | The pulse went from deciding when a hand moved to giving advice you could reject | S5, S3 | Verified (interpretation) | The Receivers chose whether to follow each Sender. |

## Hardware and staging notes for the reconstruction

**2013, sender (Rao).**
- An EEG cap with electrodes (g.tec amplifier per S1, via search).
- The game screen, with the cursor window and the blue Fire target.
- His hand flat beside the game.

**2013, receiver (Stocco).**
- A swim cap marking the coil site (S2 mentions a purple swim cap; the colour is optional).
- Noise-cancelling earbuds; no game screen.
- The right hand rests just above the space bar; the right index finger strikes it.
- Draw a generic round coil. The shape and mounting for 2013 weren't confirmed; the 2014 papers describe a circular coil.

**2014.**
- A new cast. Receivers sit in a TMS chair with a neck rest, facing a blank wall, in headphones in a dark room.
- The coil is held by an articulated arm, not by hand.
- Don't label the coil's size: the sources say both 90 mm and 70 mm.
- Control blocks: the coil turns 180° about its handle at the same output, so the click and its sound stay the same.

**2019.**
- **Senders:** an 8-channel EEG headset and a screen with a Yes LED on the left and a No LED on the right.
- **Receiver:** an EEG cap and a figure-eight coil at the lower back of the head ("a wand that looks like a tiny racket",
  Stocco, S6). The Receiver answers through the same LED interface.
- Two Sender colours, kept consistent.
- The flip happens in software, after the vote is decoded and before the pulse.

**Consent and limits.**
- Every participant gave consent.
- The interface carried one prearranged bit per signal ("fire"; "rotate / don't").
- The researchers stress it reads simple signals, not thoughts.

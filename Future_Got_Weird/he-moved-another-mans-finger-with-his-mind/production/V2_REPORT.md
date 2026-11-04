# V2 review render: major animation and pacing overhaul

## Status

This is the V2 review, made on 4 Nov 2026. It is not published.

The narration, its timing and the captions are unchanged from V1: the 550 approved words, used verbatim. Every picture sequence was rebuilt in `source/src/v2/` (composition `FingerV2`). V1 is kept intact (composition `FingerFilm`).

| Item | Path |
|---|---|
| Review MP4, 1920×1080 | `exports/FGW_Finger_V2_REVIEW_1920x1080.mp4`. The file is Git-ignored; checksummed 20 MB parts are in `backup/`. |
| Captions | `captions/FGW_Finger_V1.srt` (unchanged; the timing is identical). Also burned into this review cut. |
| Mix | `audio/mix/FGW_Finger_V2_mix.wav` (136 cues from the V2 picture) |
| Direction | `production/V2_DIRECTION.md` (the creator's brief, verbatim) |
| Build brief | `production/V2_BRIEF.md` |

## Measured export

| Item | Value |
|---|---|
| Runtime | **3:31.77**, 6,353 frames at 30 fps |
| Picture | H.264 High, BT.709 |
| Audio | AAC 48 kHz stereo |
| Loudness | −14.2 LUFS integrated, true peak −1.3 dBTP, LRA 3.3 LU. The limiter reduces gain by at most 2.8 dB, after the effect transients were trimmed and the effects bus soft-limited. |
| Narration sync | Audio matches the narration master at 0 ms lag |
| Captions | All 64 cues start on measured word onsets; no overlaps |
| Static picture | No black frames. **No frozen picture of 1.5 s or longer anywhere** (V1 had four). |
| Missing-click gap | Unchanged: score silent, room tone only, the coil click at the normal gain |

## Major scene changes

**A. Opening (0–19.5 s).** Rebuilt from scratch.
- Frame 0 is an extreme close-up of Stocco's finger being driven down onto the space bar, with a saffron "drive" glow on the back of the hand and motion arcs. Contact comes at frame 4, the key compresses on a spring, and the cannon fires at 0.58 s.
- The camera dives through the space bar into the game and rides the shot. The shot's trail then match-cuts into Rao's EEG cable.
- By 4 s, one continuous pull-out from his cap reveals the two labs in two different buildings.
- The signal follows the physical route: cap → computer → network cable down the facade and under the lawn → TMS unit → coil.
- The second involuntary snap cuts on the click to the cannon.
- The campus is now a moving shot: a lateral track with a foreground pillar and trees, then a crane out. The game splits into the two windows, and the camera swoops into Rao's room.

**B. Setup and game decision (19.5–44.6 s).**
- A graphic match takes Rao's screen to the empty dashed screen on Stocco's bare wall.
- For the desk gag, the keyboard is yanked and the cut lands on the motion: the parts land on one ordinary desk and a chair rolls in.
- The camera pushes through the bezel into the game.
- The plane and the rocket fly the same marked path.
- The finger strike match-cuts to the cannon.
- Rao's glasses reflect the plane, then the rocket.
- Rao's empty desk, then a push back into the game.

**C. The route (44.6–90.0 s).** This is the cause-and-effect chain as one physically connected route, with about 30 distinct compositions:
- the game reflected in Rao's glasses;
- the ghost of the imagined hand;
- through an electrode into the brain rhythm, which flattens;
- the same trace becoming the EEG readout;
- the cursor climbing to FIRE;
- the command riding the cable to the wall jack, then an overhead campus;
- a dive through the skylight;
- a top view of the coil over the left motor cortex, the pathway down the right arm, and the finger close-up's involuntary jerk and press;
- a cut on the press to the cannon;
- the nervous tic, and the "controller" facing a wall;
- a push into the empty network port, which lands back on the game.

**D. Failed session (90.0–101.8 s).** The session log no longer opens on a static document.
- The failure is shown first: the command stalls at a coupler, the plug pops apart, and the rocket hits the city.
- The failed screen and the broken cable ends fly into the pilot report's log line. The page is on screen for about 3 s.
- A match cut takes the plug icon to the two labs, which link up, then snap apart ("Bad connection.").
- The dangling plug match-cuts into the 2014 TMS port.

**E. 2014 and the control (101.8–135.9 s).**
- The plug seats in the 2014 port, then the camera pulls out to the three new pairs and pushes into the stimulation chain (coil → machine → hand → pad).
- A researcher's hand turns the coil about its handle, then a split screen shows "same game" and "same pulse strength".
- Results are animated as game action: pair 1 hits 5 of 6 rockets **and shoots down friendly planes** (3 of 8); pair 2 hits 1 of 4.
- The flipped trial repeats the same composition, with the same click and a motionless hand, and the rocket hits.
- The camera pushes through the pad into the zero-presses board, then into the pad rectangle for the match cut.

**F. BrainNet (135.9–178.9 s).** Rebuilt as movement through one building.
- A match cut takes the pad to the block. The audience plays from the Receiver's seat first, then a Sender's view reveals the gap.
- Vote chips travel along the real cables: cap → hub → TMS → figure-eight coil at the back of the head.
- The camera pushes through the head into the Receiver's view for the single soft arc ("No flash" shows nothing).
- Two rounds, then the line clears.

**G. Trust and ending (178.9–211.8 s).**
- The camera pushes through the screen to the Receiver's sceptical face.
- It follows the coral vote into the computer, where it flips YES → NO **after** the Sender gave it.
- A track record fills, and the block clears.
- The 16 trials shrink into tiles (13 cleared, "average across 5 teams"). The cleared-line bars slide onto the space bar and cut to **the film's exact first frame**. A frame diff against frame 0 shows them identical.
- A memory window (added in QA) recalls each game: the 2013 cannon fires with the involuntary snap, and the window wipes to the 2019 Receiver's screen as the advice arc appears.
- The finger then rises and settles voluntarily: a calm teal ring, no key travel.
- The camera pulls back to the two hands for the final hold.

## New intentional transitions

Each one below was verified in the rendered MP4 using frame bursts: `qa/v2/transitions/page_*.png`, built by `tools/transition_bursts.py`.

| Time (s) | From → to | How |
|---|---|---|
| 0.26–0.84 | Finger → keyboard → game | Camera follows the press down through the space bar into the game as the cannon fires |
| 1.90 | Projectile → brain signal | The shot's trail becomes Rao's EEG cable (same place and angle) |
| 2.95–4.15 | EEG cap → two buildings | One continuous pull-out |
| 5.94–7.33 | Computer signal → second building | Follows the cable, facade and lawn into the TMS unit and coil |
| 7.60 / 36.97 / 76.25 | Finger → cannon | Cut on the click / press |
| 9.05–11.5 | Rao's lab → Stocco's lab | Lateral track with a foreground pillar and tree sweeping past |
| 12.55–15.1 | Stocco → campus | Crane out past foreground trees |
| 16.8–19.5 | One game → two windows → Rao's room | The parts fly apart, then the camera swoops into the window |
| 21.75 | Rao's screen → Stocco's empty wall | Graphic match |
| 24.73 / 24.98 | Keyboard yank → ordinary desk | Cut on the motion |
| 29.2 | Desk → game | Push through the bezel |
| 47.0 | Game → Rao | Pull-out: the game was the reflection in his glasses |
| 52.3–52.9 | Cap → brain | Push through the electrode, which opens like an iris |
| 55.0 | Brain rhythm → EEG readout | The same trace; the background turns from tissue to screen |
| 62.6–65.1 | Computer → cable → overhead campus | Ride the command up the cable; match at the jack |
| 65.65–66.95 | Campus → Stocco's room | Dive through the skylight |
| 73.7–74.8 | Head → arm → finger | Follow the stimulation pathway into the drive glow |
| 78.8 / 81.4 | Game → Rao → Stocco | Pull back past his head; wipe on the edge of a brick building |
| 87.5–90.0 | Wall port → game | Push into the empty network port |
| 90.3–92.7 | Game → cable | Pull back and track the command to the failure |
| 93.8–94.5 | Failed action → session log | The failed screen and the broken cable ends fly into the log line |
| 96.95–97.3 | Log icon → 2013 labs | Push into the plug icon, match cut, pull-out |
| 101.81 | 2013 dangling plug → 2014 TMS port | Object match cut |
| 113.0 / 119.3 | Flip close-up ↔ split ↔ trial | Split screen settles in, then wipes away |
| 123.65 | Trial → results board | The game inset is carried into column 1 |
| 129.75 | Flipped trial → board | Push through the touchpad's surface |
| 135.87 | Touchpad → falling block | Shape match cut (contract rect) |
| 140.6–145.5 | Receiver → Senders | Pull back over the shoulder, then track past foreground wall pillars |
| 149.42 | Sender's screen → Receiver's screen | Identical framing, then the cover wipes up |
| 165.45 / 170.5 / 172.0 | Head ↔ Receiver's view | Push through the head |
| 176.9 | Round-2 split → Sender A's screen | The top strip expands to full frame |
| 179.95 | Screen → Receiver's face | Push through, then an iris |
| 183.2–185.6 | Sender B → computer | Follow the chip; it flips inside |
| 192.8 | Playfield → 16 trial tiles | The field shrinks into its tile |
| 194.8–196.3 | Cleared lines → space bar → opening frame | Bars merge onto the key, then a match cut to frame 0 |
| 208.45 | Finger close-up → two hands | Pull back and split |

## Review performed, and its limits

**Checks performed:**
- Measured QA on the export, listed in the table above.
- A stricter freeze search at 1.5 s found no hits.
- The whole export reviewed frame by frame at 1 fps (`qa/v2/render1_1fps_sheet_*.png`, from the first V2 render).
- Frame bursts of every transition from the final export.
- The first 5 s checked muted at phone size (`qa/v2/first5s_muted_phone_390px.png`).

**Fixes found in QA and applied before the final render:**
- The ending's finger close-up held nearly static for about 6 s. The memory window was added.
- Effect transients were riding the limiter, which ducked the voice with them by up to 5.8 dB. Those effects were trimmed and the effects bus soft-limited.

**Not done:** the film has not been watched or listened to in real time; this environment has no playback.

**Please listen for:**
- the mix density of the effects, now 136 cues, quieter than V1;
- the cut-on-click timings;
- the missing-click silence;
- the final hold.

## Unresolved visual and technical concerns

1. **The opening snap appears twice at the end.** It plays once at 196.3 s (the exact frame-0 reprise) and again with the jerk variant on "the pulse helped" at about 199.5 s, so it repeats within about 3 s. The second one now drives the memory window's cannon, but it is still a repeat.
2. **Simple drawings:**
   - Stocco's hand seen from behind;
   - the cast rig's mitten hands in medium shots;
   - the researcher's gloved hand that turns the coil;
   - the plain grey hub computer in BrainNet;
   - the large head and shoulders of Stocco seen from straight above.
3. **The cable route is a stylised metaphor.** The network cable runs down the facade and under the lawn; the real link was the internet. The command's slow crawl into the TMS machine (about 67–72.9 s) matches the narration, which describes the setup first.
4. **Round 2 of BrainNet is partly implied.** The fresh NO votes are shown, but not their (pulse-free) arrival at the coil.
5. **Small units and a reused layout.**
   - The 2014 three-pairs wide (about 104–105 s) shows small figures for about 1.3 s.
   - The control-trial composition keeps V1's layout on purpose, so the normal and flipped trials match.
6. **A few short dissolves** (under 0.25 s) remain: trial → board, and log → labs.
7. **Labels added beyond the narration:** "involuntary", "the controller" and "slow motion". They can be cut if unwanted.
8. **Contact-sheet artefact (tooling only).** Remotion contact sheets that put many frames in one page can collide on SVG ids. The film renders one frame at a time and is unaffected. QA used the rendered MP4.

## Rebuild

    cd Future_Got_Weird/he-moved-another-mans-finger-with-his-mind
    npx --prefix source esbuild tools/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/ec2.cjs && NODE_PATH=source/node_modules node /tmp/ec2.cjs audio/cues_v2.json
    VER=V2 python3 tools/make_audio.py
    bash tools/render_v2.sh
    python3 tools/qa.py exports/FGW_Finger_V2_REVIEW_1920x1080.mp4 qa/v2/review
    python3 tools/transition_bursts.py exports/FGW_Finger_V2_REVIEW_1920x1080.mp4 qa/v2/transitions
    bash tools/backup_parts.sh exports/FGW_Finger_V2_REVIEW_1920x1080.mp4

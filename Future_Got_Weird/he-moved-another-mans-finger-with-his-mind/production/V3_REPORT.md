# V3 review render: cinematic animation and transition overhaul

## Status

This is the V3 review, made on 5 Nov 2026. It is not published.

The narration, its timing and the captions are locked and unchanged: the 550 approved words, verbatim.

Every picture section was reworked in `source/src/v3/`, composition `FingerV3`. V3 has eight sections: A–G plus a new ending, H. V1 and V2 are kept intact.

| Item | Path |
|---|---|
| Review MP4, 1920×1080 | `exports/FGW_Finger_V3_REVIEW_1920x1080.mp4` (Git-ignored; checksummed parts in `backup/`) |
| Captions | `captions/FGW_Finger_V1.srt` (the timing is identical); also burned into this review cut |
| Mix | `audio/mix/FGW_Finger_V3_mix.wav` (134 cues from the V3 picture) |
| Direction | `production/V3_DIRECTION.md` (the creator's brief, verbatim) |
| Build brief | `production/V3_BRIEF.md` |

## Measured export

| Item | Value |
|---|---|
| Runtime | **3:31.77**, 6,353 frames at 30 fps |
| Picture | H.264 High, BT.709 |
| Audio | AAC 48 kHz stereo |
| Loudness | −14.2 LUFS integrated, −1.3 dBTP true peak, LRA 3.3 LU; limiter gain reduction at most 2.8 dB |
| Narration sync | 0 ms lag against the narration master |
| Captions | All 64 cues start on measured word onsets; no overlaps |
| Black frames | None |
| Frozen picture | **None of 1.5 s or longer** |
| Loop | The last frame (6352) differs from frame 0 by a mean of 0.58/255 |
| Missing-click gap | Unchanged: score silent, room tone only, the coil click at the same gain as the working trial |

## What changed versus V2

**Shared character work: articulated hands.**
- The Weird Crew cast rig (`v3/crew3.tsx`) has real cartoon hands, with a palm, four fingers and a thumb, in the cast's stroke-and-fill line. They replace the mittens.
- Each pose carries a hand shape (curl, spread, point), and shapes blend between poses.
- Every person in the film uses it: Rao, Stocco, six 2014 volunteers, the researcher and the BrainNet trio.
- Close-ups of Rao's and Stocco's arms (`abhand.tsx`) are one shaded silhouette from shoulder to fingertips that bends at the wrist, with three-phalanx fingers.
- In every finger close-up, Stocco's forearm is bare, matching his short sleeves elsewhere.

**A. Opening (0–19.5 s).**
- Frame 0 now shows **both researchers at once**: Rao frame-left with his EEG cap lit, Stocco frame-right with his hand over the space bar.
- One lit route runs along the real equipment: cap → cable → computer → network → TMS → coil → arm → fingertip.
- The camera follows the stimulation down his arm into the hand. The press is involuntary: the wrist jerks up, a small tremor, then the drop, with contact at 0.75 s.
- The key compresses, the cannon fires on the next frame and the rocket bursts at 1.08 s. The finger releases.
- Rao grins; Stocco looks down at his hand, puzzled.
- On "across campus" each panel merges into its own building's window, and the gap cable becomes the line down one facade, under the lawn and up the other.

**B. Setup (19.5–44.6 s).**
- The camera rides the network cable from Rao's room to Stocco's.
- The screen and keyboard are carried out of the two windows onto one ordinary desk on the lawn, and a chair rolls up.
- One continuous push through the bezel into the game.
- The plane is clearly friendly: it drops a supply crate on a parachute. The rocket gets a launch flash.
- Rao's eyes follow the plane; the click cuts to the cannon.
- "No way to press fire himself": Rao's fingers lift and tap the bare desk twice.

**C. The route (44.6–90.0 s).** One cause-and-effect journey:
- the camera pulls back through the screen to Rao, eyes on the rocket;
- a crew3 ghost arm shows the imagined movement while the real hand stays still;
- the cap turns see-through over his left motor cortex, and the rhythm becomes a wave that rides the electrode wire into the EEG readout, where it shrinks;
- the cursor climbs to FIRE, and the command rides the cable to the wall jack;
- a match cut on the command takes it across the campus, and another lands it at Stocco's wall jack;
- one continuous move follows it: receiving computer → TMS → coil arm → the brain seen through the cap → the hand;
- the stimulation pathway leads into the finger close-up: jerk, drop, contact; the press cuts to the cannon;
- Rao's fist pump cuts on the matched motion to Stocco's twitching hand;
- he flinches and studies the hand, then turns back to his wall and shrugs ("missing the entire game");
- the camera pushes into the empty network port and lands in the game.

The oversized overhead view of Stocco, the skylight dive, the iris and the decorative rings are gone. So are V2's labels, except three small ones: "imagined", "internet" and "left motor cortex".

**D. Failed session (90.0–101.8 s).**
- The failure is shown first: the plug works loose and pops with sparks. Rao's head snaps toward the pop, the rocket hits, then he slumps.
- The report page rises over the live room, and a graphic match cut takes the plug icon to the two 2013 labs.
- "Ready to go": Rao rubs his hands; Stocco limbers his finger.
- "Bad connection.": the coupler snaps. Rao does a double take, then a slow facepalm; Stocco waits, looks around, then shrugs with open hands.

**E. 2014 (101.8–135.9 s).**
- An object match cut takes the 2013 TMS machine to the 2014 one.
- A crew3 researcher in a lab coat catches the dangling plug and seats it. The camera glides out to a larger cutaway of the two buildings and back in to pair 1.
- Stocco's TMS jerk drops his hand onto the pad. On "quietly" the researcher raises a finger to his lips, takes the coil by its handle and turns it 180° about the handle axis.
- The flipped and in-position views sit in stacked panels.
- Pair 1 hits 5 of 6 rockets and shoots down friendly planes (3 of 8).
- The camera cranes through the floor slab to pair 2 (1 of 4) and back.
- The flipped trial repeats the same composition: same click, same blink, motionless hand, and the rocket hits.
- In the cutaway every coil is flipped and "0 presses" shows on every floor.
- The receiver rubs his neck as the camera pushes into the pad rectangle.
- V2's dissolves (97.3, 123.65), the glove and the results board are gone.

**F/G. BrainNet and trust (135.9–196.0 s).**
- Monitor sameness is replaced by character staging: six distinct shots of the Receiver's face and three of the Senders.
- Gaze voting: each Sender blinks (anticipation), then the head and eyes lock on a light. The vote rides the cap cable.
- A believable lab computer runs "BrainNet relay" software.
- The camera pushes through the head into the Receiver's view for the single soft arc.
- An extreme close-up of the eyes leads into the decision: a nod, then a cut on the nod as the block turns.
- **Round 2 is now shown fully**: both NO votes reach the stimulator, which shows "no pulse" (no pulse is drawn).
- The bad Sender's YES flips to NO **inside the relay software**, after it arrives.
- The Receiver reacts throughout: scepticism (a squint and a chin rub), reading the track record, relief and a fist pump.
- The 16 trial tiles, 13 of them cleared ("average across five teams"), slide into one saffron bar.

**H. Ending (196.0–211.8 s).**
- The saffron bar becomes the space bar's cap, and the hand glides in.
- "The pulse": one involuntary jerk-press-release. It appears only once; the V2 double snap is fixed.
- "Six years later": the coil slides from the motor area to the back of his head. "Advice" is a soft click and a light arc, and the arm does nothing.
- "Decide the other guy was wrong": a voluntary choice with anticipation and hesitation. The finger lifts, dips toward the bar, stops short, curls back and the hand withdraws. He shakes his head, then smirks.
- Rao's panel slides back in, and the frame settles into the opening composition. The route relights, so the last frame flows into frame 0.

## Transitions verified in the rendered MP4

Frame bursts for 50 listed transitions are in `qa/v3/transitions/page_*.png` (built by `tools/transition_bursts_v3.py`).

| Time (s) | From → to | How |
|---|---|---|
| 0.04–0.95 | Two researchers → hand → cannon | Follow the stimulation down the arm; the press, then the cannon on the next frame |
| 9.1–10.7 | Split panels → two campus windows | Each panel merges into its window; the cable becomes the campus line |
| 13.2–19.5 | Window → crane over campus → split game → Rao's window | Continuous camera |
| 21.2–22.6 | Rao's room → Stocco's room | Ride the network cable |
| 23.8–28.3 | Two windows → lawn desk | Props carried out of the buildings |
| 28.3–29.9 | Desk → game | One continuous push through the bezel |
| 33.1 / 34.9 | Game ↔ Rao | Cut on the plane he is watching |
| 37.1 / 76.25 | Key press → cannon | Cut on the click |
| 46.8–48.3 | Game → Rao | Pull back through the screen |
| 51.7–54.3 | Rao → brain activity → EEG readout | Push to the see-through cap; the wave rides the wire into the readout |
| 61.5–64.06 | Cursor → computer → jack → campus | The command rides the cable; match cut at the jack |
| 65.75 | Campus → Stocco's wall jack | Match cut on the command going in and coming out |
| 65.75–72.7 | Jack → computer → TMS → coil → brain → hand | One continuous camera move |
| 74.71 | Stimulation pathway → finger close-up | Cut on the glow |
| 81.47 | Rao's fist pump → Stocco's twitching hand | Cut on the matched upward motion |
| 85.86 | Front → back | Reverse cut on the head turn |
| 87.9–90.0 | Behind Stocco → empty port → game | Continuous push |
| 93.8 | Room → pilot report | The page rises over the live room |
| 97.30 | Plug icon → 2013 labs | Graphic match cut |
| 101.81 | 2013 TMS machine → 2014 TMS machine | Object match cut (2013 → 2014) |
| 102–106.7 | 2014 machine → cutaway → pair 1 | Continuous out and back in |
| 123.55 / 126.15 | Pair 1 ↔ pair 2 | Crane through the floor slab |
| 135.87 | Touchpad → falling block | Shape match cut (2014 → 2019) |
| 138.55 | Turning block → Receiver's face | The head takes the turn |
| 141.25–149.4 | Building → Sender A's room → screen | One continuous move |
| 165.5 / 170.4 / 187.5 | Head ↔ Receiver's view | Push or pull through the head |
| 174.45 | Eyes → block turns | Cut on the nod |
| 183.45–188.4 | Sender B → software flip → stimulator → view | Continuous follow |
| 193.4–195.96 | Fist pump → trial tiles → one bar | Cut on the downstroke, then a continuous merge |
| 195.96 | Bar → space bar | Shape carry |
| 208.5–211.77 → 0 | Ending → opening | Settles into the frame-0 composition (loop) |

There are no dissolves, disconnected wipes, iris transitions or decorative rings in V3.

## Review performed, and its limits

- **Measured QA on the export:** see the table above.
- **Freeze search:** run at 1.5 s; no hits.
- **Whole export at 1 fps:** `qa/v3/render_1fps_sheet_*.png`.
- **Transition bursts:** taken from the export, `qa/v3/transitions/`.
- **First 5 s muted at phone size:** `qa/v3/first5s_muted_phone_390px.png`.
- **Loop:** the last frame was diffed against frame 0.
- **Builders' checks:** they verified each section boundary on the pixels and checked hand actions at 1-frame spacing (reported per section).
- **Not done:** the film has **not been watched or listened to in real time**; this environment has no playback.

## Unresolved concerns

1. **Opening press timing.** Contact is at 0.75 s, not V2's frame 4, and the camera's move into the hand (0.04–0.44 s) is quick. Please judge both in motion.
2. **Back-view arms.** In the back view of Stocco's room (C), the arms are custom drawings with the crew hands. From behind, the hands read as small, mitten-like paws.
3. **Release off the key.** In C, the key release is seen only as the hand lifting off the key at the start of the front reaction shot. The close-up cuts to the cannon on the press.
4. **Desk-gag continuity.** The monitor and keyboard move to the lawn desk at about 24–28 s, and they are back in the rooms for the reaction shots from about 33 s.
5. **Coil in the 2019 beat.** In H, Stocco stands in for "you". In front view, the coil at the back of his head can read as headphones.
6. **Staging devices not in the sources.** In 2014, the researchers' monitor showing "Sender's game" behind the receiver, and FIRE commands crossing the cutaway during the control. Those clicks are silent, to keep the coil_pulse gain uniform.
7. **Explanatory graphic.** The BrainNet track-record panel is an explanatory graphic, not something on screen in the experiment.
8. **Stylised network line.** It runs down the facades and under the lawn; the real link was the internet.
9. **Labels.** The remaining labels are short and few; they include "imagined", "internet", "left motor cortex", "visual cortex", "flash = rotate", "no pulse" and the scores.

## Rebuild

    cd Future_Got_Weird/he-moved-another-mans-finger-with-his-mind
    npx --prefix source esbuild tools/export_cues_v3.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/ec3.cjs && NODE_PATH=source/node_modules node /tmp/ec3.cjs audio/cues_v3.json
    VER=V3 python3 tools/make_audio.py
    bash tools/render_v3.sh
    python3 tools/qa.py exports/FGW_Finger_V3_REVIEW_1920x1080.mp4 qa/v3/review
    python3 tools/transition_bursts_v3.py exports/FGW_Finger_V3_REVIEW_1920x1080.mp4 qa/v3/transitions
    bash tools/backup_parts.sh exports/FGW_Finger_V3_REVIEW_1920x1080.mp4

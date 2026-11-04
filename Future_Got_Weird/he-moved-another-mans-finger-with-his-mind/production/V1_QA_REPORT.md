# V1 review render: report and QA

## Status

This is the first complete review render, made on 4 Nov 2026. It is not published; publication stays manual.

## Deliverables

| Item | Path |
|---|---|
| Review MP4, 1920×1080 | `exports/FGW_Finger_V1_REVIEW_1920x1080.mp4` |
| MP4 backup | Checksummed 20 MB parts in `backup/` (the `exports/*.mp4` file is Git-ignored). Restore with `cat backup/FGW_Finger_V1_REVIEW_1920x1080.mp4.part_* > exports/FGW_Finger_V1_REVIEW_1920x1080.mp4`, then run `(cd exports && sha256sum -c ../backup/JOINED_SHA256SUMS)`. |
| Captions (SRT) | `captions/FGW_Finger_V1.srt`: 64 cues, at most two lines of 42 characters, built from the measured word timings |
| Narration master | `audio/narration/FGW_Finger_narration_V1.wav`. Word timings are in `FGW_Finger_V1_words.json`; provenance is in `voice_provenance.json`. |
| Mix | `audio/mix/FGW_Finger_V1_mix.wav` (48 kHz, 24-bit, stereo). Measurements are in `audio/mix/mix_measure.json`. |
| Editable source | `source/` (Remotion 4.0.533, composition `FingerFilm`), `tools/` |
| Locked narration | `production/NARRATION_LOCKED.txt`: 550 words, verbatim. Approved with fixes 1–3. |

The SRT is also burned into this review cut. A clean picture renders with `--props='{"captions":false}'`.

## Measured export

All values are from `qa/v1/review_qa.json`.

| Item | Value |
|---|---|
| Runtime | **3:31.77** (211.767 s), 6,353 frames at 30 fps |
| Picture | H.264 High, yuv420p, BT.709 |
| Audio | AAC 48 kHz stereo |
| Loudness | −14.2 LUFS integrated, LRA 3.4 LU, true peak −1.4 dBTP |
| Narration | Test Voice `kk5XaSLo2XAw0sKM98zU`, eleven_v4, relaxed direction; 158 wpm over the speech span |
| Music level | About 18 dB under the voice while it speaks |
| Picture problems | No black segments, no frozen picture over 2.5 s |
| Audio sync | The export's audio matches the narration master at 0 ms lag |
| SRT | Every cue starts on a measured word onset (maximum offset 0 ms); no overlaps |
| Recognition | PocketSphinx on the full mix scores WER 0.31 against the locked text, and 0.17 on the clean narration. This is a supporting check only: the bundled model is noisy on this voice. Runs of differing words were checked for dropped or repeated phrases, and none were found. |

### Planned pauses (measured in the master)

| Pause | Length |
|---|---|
| Around "Fire." | 0.35 s before and 0.70 s after |
| "Bad connection." | 0.35 s before the line, then a 1.25 s gap with the score thinned |
| Missing click | 2.2 s from "With the coil flipped?" to "Across all three pairs" |
| Final three sentences | 0.55 s, 0.60 s and 0.65 s between them, then a 3.3 s hold |

The missing-click gap was measured in the mix:

| Time | Level | What is heard |
|---|---|---|
| 127.75 s | −30 dB | The coil's click, at the same gain as the working trial at 108.05 s |
| 128.0–129.2 s | About −56 dB | Room tone only, no score: the silence where the pad click would land |
| 129.35 s | −17 dB | The rocket hits the city |

## What each sequence shows

The sequence boundaries come from the measured narration.

**S1 (0–19.5 s): the opening and the campus.**
- Frame 0 shows two large hands. Frame-left, Rao's hand lies flat beside the game in a cool room with a blue sleeve. Frame-right, Stocco's index finger is mid-strike over the space bar in a warm room with a green sleeve.
- The click lands at 0.17 s, the cannon fires at 0.2 s and the rocket bursts at about 0.55 s.
- A supply plane passes through untouched, then a second rocket is shot down on "fired".
- On "across campus" the two panels pull back as two lab windows, and the buildings separate to reveal the lawn.
- "Split one video game": the screen flies to Rao's window and the keyboard to Stocco's.
- Tags: "University of Washington · 2013" and "Animated reconstruction".

**S2 (19.5–44.6 s): the setup and the game decision.**
- Rao appears in his EEG cap with the screen, and Stocco in his swim cap and earbuds with only a keyboard, facing a bare wall.
- The desk gag: the two halves slide together into one ordinary desk with an empty chair.
- Into the game, the one playable decision: the supply plane flies through unharmed, then a rocket follows the same path.
- On "Shoot it down" the film cuts on the click to Stocco's keyboard and back to the cannon firing.
- Rao has "No fire button" and Stocco has "No screen".

**S3 (44.6–90.0 s): the route, shown as one connected chain.**
- The imagined right-hand movement is drawn as a dashed ghost hand while the real hand stays put.
- The brain-rhythm wave shrinks ("resting" becomes "imagining"), the cable runs to the computer, and the cursor climbs to the blue FIRE target.
- The FIRE packet crosses campus and arrives on "Fire."
- Stocco is seen from behind, with the round coil over the left motor cortex (frame-left in this view). A brain cutaway is marked L/R, and the signal crosses down to the right arm.
- The close-up shows the wrist jerk up, then the index fingertip land on the space bar. The film cuts on the click to the cannon.
- "felt like a nervous tic" appears as a tag with no quotation marks.
- "Missing the entire game": Rao's window erupts while Stocco sits quietly in his.

**S4 (90.0–101.8 s): the pilot report.**
- A reconstructed pilot-report page has the log line "Session 1 — ended early: network problems" highlighted. It is not presented as a quote.
- Both labs are shown ready, the link draws, stalls on a spinner, then breaks.
- "Bad connection." is held deadpan for about 1.5 s.

**S5 (101.8–135.9 s): 2014 and the control.**
- The scene has its own cast and room: three new pairs; receivers face a wall in a dark room wearing headphones; the coil sits on an articulated arm; the receiver's hand has an orange sleeve over a touchpad.
- One normal trial: pulse, wrist jerk, pad click, then the cannon fires.
- The coil turns 180° about its handle ("Flipped over"). "Same game" and "Same pulse strength" are both shown.
- Results: pair 1 is shown at 5 of 6 rockets hit **and** with a friendly plane shot down by mistake ("Planes hit: 3 of 8", Table 2's 37.5 %). Pair 2 is shown at 1 of 4.
- The flipped-coil trial repeats the same composition with the same coil click. The hand stays still through the silence and the rocket hits the city.
- Tally: "0 presses" for all three pairs.
- The camera pushes into the pad, ending on the exact rectangle the BrainNet block opens on.

**S6 (135.9–178.9 s): BrainNet.**
- Match cut from the touchpad to the J-block.
- The viewer plays from the Receiver's seat first, with the bottom of the field hidden.
- A cutaway shows three rooms in one building. Senders are teal and coral; the Receiver is purple.
- The Sender's view then reveals the gap. "Either answer looked reasonable" is shown as rotate? / leave it?.
- Votes are cast by staring at YES (left) or NO (right) lights.
- A figure-eight coil sits at the back of the head, with the visual cortex highlighted.
- From the Receiver's point of view, one brief soft arc means "rotate"; "No flash" shows nothing.
- Two rounds: the Receiver chooses with the same lights, the block falls halfway, fresh votes follow, and the line clears.

**S7 (178.9–211.8 s): trust and the ending.**
- "10 of 16 trials": the coral Sender's YES enters the computer, turns over **inside** it and leaves as NO.
- A trust balance tips toward teal.
- "13 of 16 lines cleared" carries an "average of 5 teams" tag.
- The film then cuts back to the opening's exact two-hand composition:
  - "the pulse helped decide when somebody else's hand moved": a pulse at Stocco's wrist and the involuntary tap; the cannon fires.
  - "a pulse could give you advice": one soft arc over the right hand while a supply plane crosses.
  - "you could decide the other guy was wrong": the finger lifts, and the hand calmly draws back off the keys and lies flat behind the keyboard. The plane lands safely.
- The final image holds on both hands at rest.

## Transitions (outgoing → incoming: new information)

Every transition was checked on contact sheets. None were removed in V1.

| Outgoing → incoming | New information | Decision |
|---|---|---|
| Split hands → windows → campus (one continuous pull-back) | The two people are in separate buildings | Keep |
| Campus → Rao's window → Rao's lab (push, then cut inside) | Rao has the screen | Keep |
| Rao's lab → Stocco's lab (cut) | Stocco has only the space bar | Keep |
| Two labs → one desk (slide) | The gag: together they make one ordinary player | Keep |
| Desk → game screen (push) | The city to defend | Keep |
| Game → Stocco's keyboard → game (cuts on the click) | His key fires her cannon | Keep (brief) |
| Two labs → Rao's lab (S2 to S3, cut) | The route begins | Keep |
| Hand → cap → computer → cursor → packet → campus → Stocco (camera follows the signal) | One continuous route | Keep (brief) |
| Back view → hand close-up (cut along the signal) | The jerk and the strike | Keep |
| Keyboard → Rao's screen (cut on the click) | The cannon fires | Keep (brief) |
| Campus → pilot page (cut) | A separate document | Keep |
| "Bad connection." → 2014 pairs (cut) | A new experiment and cast | Keep (separate experiment) |
| Control composition → results board → same composition (cuts) | The flipped repeat | Keep (brief) |
| Touchpad → falling block (match cut) | 2019 begins | Keep (brief) |
| BrainNet tally → opening two hands (cut) | The callback | Keep (brief) |

## Review passes performed, and their limits

- **Muted at phone size, first 3 seconds** (`qa/v1/first3s_muted_phone_390px.png`, 390 px wide, every 0.2 s):
  - Both hands are large and read clearly, and left/right is correct.
  - The finger is on the bar at frame 0, the muzzle flash is visible at 0.2 s and the burst at 0.6 s.
  - The caption box touches Rao's fingertips briefly at 0.4–3 s. Nothing important is hidden.
- **Whole export, frame by frame at 1 fps** (`qa/v1/render1_1fps_sheet_*.png`, from the first render):
  - Two defects were found and fixed before this render:
    - The campus wide shot was frozen for 2.6 s; walkers and faster clouds were added.
    - The final resting hand slid off the bottom edge of the frame; it now rests behind the keyboard, fully in frame.
  - A 1–2 % strip of building at the frame edges at frame 0 was also removed by overfilling the camera.
  - After the fixes, the affected intervals were rechecked and the measured QA was re-run.
  - Builders' dense contact sheets also covered every transition, the hand jerks frame by frame, and the control beat at 0.25 s spacing.
  - No malformed hands, stray limbs, cut-off captions or left/right reversals were seen.
- **The full export was not played through with sound.** This environment has no audio or video playback, so nobody has watched or listened to the film in real time. In its place:
  - audio/picture sync, loudness and true peak were measured;
  - recognition of the narration was checked against the locked text;
  - the missing-click gap was measured;
  - every effect is placed from the same timeline as the picture (`audio/cues.json`, 179 cues).
- **Please listen for these specifically** (machine checks cannot judge them):
  - the take joins and the delivery of the hook;
  - the 0.70 s after "Fire.";
  - the length and feel of the missing click;
  - the "Bad connection." deadpan;
  - the effect density in the BrainNet section (many small ticks and pops);
  - the final three sentences.

## Known limits and notes

**Narration takes.** No narration words were edited, stretched or re-pitched. Some takes had material before the clean read that was cut off:

| Block | What preceded the clean read | Cut at |
|---|---|---|
| B1 | A false start | 2.80 s |
| B5 | Part of the direction tag spoken aloud | 3.20 s |
| B6 | Its first sentence read twice | 5.05 s |

All three cuts were made in silence.

**Simplifications for readability:**
- The cast are original animated stand-ins, not likenesses.
- Several builders drew their own back views of the receivers, because the cast rig only faces front.
- Rao's hand is drawn from the thumb side in S1 and S7, and from the little-finger side in S3.
- The flipped coil's field arcs point away from the head.
- In 2019 the YES/NO lights shimmer instead of flashing at the real 17/15 Hz.
- The 10-of-16 strip pattern is illustrative.
- The S6 votes are honest (YES/YES, then NO/NO), so "a chance to change their answer" is shown as a second choice, not an actual change.

**Open fact.** Whether a 2019 "No" vote meant no pulse or a sub-threshold pulse is still unconfirmed. The film never shows a pulse for a "No" vote, so it makes no claim either way.

**Technical.** `GameScreen` uses one fixed gradient id (`gsky`) in several places. The copies are identical, so nothing renders wrong.

**Source access.** The source papers were checked through web search only. The journal hosts are blocked in this session's network policy (see `SOURCE_NOTES.md`).

## Rebuild

    cd Future_Got_Weird/he-moved-another-mans-finger-with-his-mind
    pip install numpy scipy soundfile pyloudnorm pocketsphinx && (cd source && npm ci)
    python3 tools/align.py && python3 tools/make_narration.py && python3 tools/make_srt.py
    npx --prefix source esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py
    bash tools/render.sh
    python3 tools/qa.py exports/FGW_Finger_V1_REVIEW_1920x1080.mp4 qa/v1/review
    bash tools/backup_parts.sh exports/FGW_Finger_V1_REVIEW_1920x1080.mp4

Working stills:
- `cd source && ./sheet.sh out.png "t1,t2,..." [cols]` renders a contact sheet.
- `./still.sh out.png t false` renders one frame.
- `CastSheet` renders the cast.

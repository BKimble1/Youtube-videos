# Cyborg Bug Factory: V1 production review

**File:** `exports/FGW_Cyborg_Bug_Factory_V1_REVIEW_1080x1920.mp4`

**Status:** review cut. **It is not publish-ready**, and nobody has watched it in real time with sound: this
environment has no display or speakers. Every check below was made on the rendered file (decoded frames, contact
sheets, measured audio, ASR). The remaining step is a human viewing at normal speed, on a phone, with sound.

## Runtime and format (measured from the file)

| | |
|---|---|
| Runtime | **31.533 s** (946 frames at 30 fps), set by the narration: 30.85 s of speech, 0.10 s lead and 0.68 s tail |
| Picture | 1080×1920, H.264 High, yuv420p, bt709, CRF 16; captions burned in |
| Audio | AAC 320 kb/s, 48 kHz stereo |
| Loudness | −13.7 LUFS integrated (ffmpeg ebur128), true peak −1.4 dBFS. The script measures −14.0 LUFS and −1.6 dBTP at 4× oversampling before the AAC encode. |
| Decode | No errors. 946 frames decoded |

## What was implemented

### Narration

- The approved words, verbatim (`production/NARRATION_LOCKED.txt`).
- Voice: ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, connector defaults with inline delivery tags only,
  as in recent episodes. One run of two takes; take 2 was chosen by measurement.
- Edits: only sentence gaps were shortened, to 0.26 s each. The deadpan beat before "turning bugs into them" is kept at
  0.34 s. Every word is used sample for sample.
- ASR on the master: Whisper base.en has one difference, the homophone *cockroach's*/*cockroaches*.
- ASR on the final MP4's audio: Zipformer hears every word, with spellings like "sideboard" for "cyborg". Whisper, fed
  the whole mix, dropped the last line because the music bed leaves no silence to chunk at and Whisper's window is 30 s.
  Transcribing the last 7 s alone, it hears "…which means we're not just building robots anymore. We're turning bugs
  into them." Evidence: `qa/asr_narration_master.json`, `qa/v1/asr_final_mp4.json`.

### Captions

- The channel treatment: Nunito Black, white with a dark stroke, emphasised words in yellow capitals.
- 24 phrase captions whose text joins to exactly the locked words (checked by script).
- Each caption appears 0–0.04 s before its first word, from measured word times. They are drawn in screen space, never
  inside a camera transform, inside the Shorts safe area (x 110–870, centred at y 1500–1560).
- Emphasised: LIVING COCKROACHES, 68 SECONDS, ELECTRICAL PULSES, REAL EARTHQUAKE, DISASTER ZONE.
- The brief asked for "TURNING BUGS INTO ROBOTS", but the spoken words are "turning bugs into them", so the caption
  emphasises **TURNING BUGS INTO THEM.** Captions must match the narration.

### Picture

- **Style.** Programmatic 2.5D vector art in the Weird Crew finish. The 3D drawing core is reused unchanged from Zombie
  Ant, which inherited it from Dead Spider.
- **The cockroach** is one reusable rig, a Madagascar hissing cockroach:
  - a pronotum shield and banded tergites;
  - six legs (coxa, femur, spiny tibia, tarsus), IK-solved;
  - feet locked to the ground through each stance of a tripod gait;
  - terrain-following for climbing.
- **The rest of the cell:**
  - the backpack: board, chip, battery, LED, antenna, bipolar electrodes, mounting hooks;
  - an IK robot arm with a parallel gripper;
  - a conveyor of clamped carriers, a tray, an overhead vision camera and an arena.
- **One schedule** (`source/src/story.ts`) drives the whole cell. The hook, the time-lapse, the attach close-up, the
  factory overhead and the loop are the same mechanism, not separate drawings.

### Scenes as built (times from the narration)

| Time (s) | Scene | What happens |
|---|---|---|
| 0.00–1.38 | **A. Hook** | Frame 0: a large cockroach clamped on the station, the arm directly above it, a backpack coming down. 0–0.33 s descent; 0.33–0.42 s the electrodes slide under the pronotum and the arm presses; **0.46 s snap**, with a camera kick and a click; 0.82 s the LED lights, legs twitch, antennae lift; 1.12 s the clamps open. |
| 1.38–4.28 | A. Crawl and reveal | The insect crawls toward the lens and the camera follows. The camera then rises to show the cell: conveyor, waiting insects, tray, arm, arena. |
| 4.28–6.43 | **B. 68 seconds** | In on the station. The next insect's whole cycle plays sped up: the vision bracket finds the attach site, the arm picks a backpack, inserts and snaps it on. A timer counts to **68 SECONDS**, labelled "PER INSECT · SHOWN SPED UP". |
| 6.43–10.57 | **C1. Grab and attach** | Real time. The gripper closes on a backpack at the tray (on "grabs") and carries it over. A low three-quarter view shows the electrodes going under the pronotum's rear edge, with the shield turned translucent there and an "ELECTRODES" callout. The hooks clip on at "back". |
| 10.57–14.89 | **C2. Electronics and turn** | Into the backpack: CONTROL CHIP, BATTERY and ELECTRODES labelled. The insect is released and walks. Three pulses run down one electrode, with an "ELECTRICAL PULSE" readout. The insect turns about 70° on its own legs, with a dashed trail. |
| 14.89–20.60 | **D. Why living insects** | A split screen on the same 10 mm ledge. Left: a tiny wheeled robot "built from scratch" bumps the edge and stalls ("STUCK AT THE EDGE"). Right: the cyborg walks up and over ("WALKS RIGHT OVER"). |
| 20.60–22.27 | **E. The factory** | Straight down over the cell, gliding along the conveyor: insects waiting, one fitted (sped up), finished cyborgs walking in the arena. Labelled "LAB PROTOTYPE · one insect at a time · sped up". |
| 22.27–26.74 | **F. Earthquake zone** | A low wide view of a collapsed building: a leaning floor slab, rebar, bricks, a broken facade. The insect is tiny against it (true scale). The camera follows it into the rubble. Tag: "MYANMAR EARTHQUAKE · 2025 · real search-and-rescue deployment". The insect's backpack carries a small camera module; an inset feed only scans. |
| 26.74–31.53 | **G. Payoff and loop** | Low and close in front of a cyborg walking toward the lens, with the next insect blurred behind it on the station and the arm fetching a backpack. On "We're turning bugs into them" the camera cranes up over the cyborg's backpack, the cyborg walks out under the lens, and the shot settles into the exact frame-0 view: the next insect, the backpack descending. |

The brief's targets were approximate. The final cuts follow the words: D starts on "So now", F on "They've already
sent", G on "Which means".

### Transitions

Format: outgoing subject → incoming subject → new information → decision.

| t (s) | Transition | Decision |
|---|---|---|
| 1.4 | The fitted insect on the station → the same insect walking (camera follow) → it is alive and moving | Keep |
| 2.2–4.0 | The walking insect → the whole cell (crane up) → it is an automated cell | Keep |
| 4.2–5.0 | The cell → the station close-up → the 68-second cycle | Keep |
| 6.2–7.0 | The station → the tray (pan) → the arm grabs the "tiny computer" | Keep |
| 7.5–9.3 | Tray → follow the pack → low view of the seat → where the electrodes go | Keep |
| 10.2–11.0 | Seat → into the backpack → what is inside | Keep |
| 11.2–14.0 | Backpack → follow the walk → rise for the turn → the pulse causes a turn | Keep |
| 14.89 | **Cut**: lab → split comparison → why insects | Keep: a genuinely new place and experiment |
| 20.60 | **Cut**: comparison → factory overhead → research automation | Keep |
| 22.27 | **Cut**: lab → disaster zone → real deployment | Keep |
| 26.74 | **Cut**: disaster zone → lab close-up → payoff | Keep |
| 29.0–31.53 | Close-up → crane over the backpack → frame 0 → the loop | Keep |

No transition uses blur, flash, spin or a blanket crossfade.

## QA performed

| Check | Result | Evidence |
|---|---|---|
| First frame | Frame 0 shows the cockroach large in frame (about 70 % of the height with antennae), the arm directly above it and the backpack visibly descending. No logo, title card or black frame. | `qa/v1/hook_0-2.5s_every_3rd_frame.png` |
| First two seconds, muted | Read from frames alone: descent, snap, LED, twitch, clamps open, crawl. | `qa/v1/hook_0-2.5s_every_3rd_frame.png` |
| Frame-to-frame jumps | Only the four planned cuts exceed the threshold. There are no unplanned one-frame jumps. | `qa/v1/render_qa.json` |
| Static holds | The longest near-static run is 10 frames (0.33 s). | `qa/v1/render_qa.json` |
| Loop | The last three frames run continuously into the first three. Mean absolute difference between the last and first frames is 10.1, the descent's own motion. The caption changes there because the narration does. The audio wraps: all effects that run past the end continue at the start, and the music period divides the film exactly. Seam step 0.0009. | `qa/v1/loop_seam_last3_first3.png`, `audio/mix/mix_measure_mix_v1.json` |
| Cuts | Frames inspected around each cut. | `qa/v1/cut_447.png`, `cut_618.png`, `cut_668.png`, `cut_802.png` |
| Narration present and unchanged | Yes: ASR, plus the caption-to-script check above. | |
| Effects under the voice | Effects bus soft-limited. Effects, music and ambience stay below the voice in every speech window. The closest window is 29.0–29.5 s at −2.6 dB, and it holds mostly the deadpan pause. | `audio/mix/mix_measure_mix_v1.json` |
| Rig | Six legs, feet planted during stance, no detached parts; checked in the contact sheets. The backpack is attached in every shot after the snap. | `qa/v1/contact_every_0.5s.png` |
| Resolution | Exactly 1080×1920. | |

## Factual concerns

Full detail with sources is in `research/SCIENCE_NOTES.md`. **No narration claim is materially unsupported.** Points to
be aware of:

1. **Myanmar used hand-built units.** The insects deployed after the 2025 Myanmar earthquake were hand-assembled
   first-generation units, not products of the 68-second factory, which was published later in July 2025. The narration
   sentence is still true ("cyborg cockroaches"), but its position right after the factory could suggest otherwise. The
   picture separates the two with a hard cut to a new place and a different, camera-carrying backpack.
2. **No survivor was reported found.** The film shows none and only "scans". The Singapore PSD headline "How Cyborg
   Cockroaches Saved Lives" is not supported by any detection report I found.
3. **"Into robots" and "turning bugs into them" are figurative.** The insects stay alive, and the electronics only
   nudge turns.
4. **The 68 s excludes anaesthesia.** It covers the automated assembly of one insect that is already anaesthetised and
   fixed. The picture's wake-up is time-compressed: the real recovery from CO₂ takes minutes.
5. **The battery is a generic representation.** I could not confirm whether a battery is inside the reported 2.3 g, or
   what kind.
6. **Sources not read first-hand.** nature.com, ntu.edu.sg and arXiv did not resolve here, so the 68 s, 2.3 g, 80–86.7 %
   and 70° figures come from search extracts and press coverage. Check them against the paper before publishing.

## Remaining animation problems

1. **Front-low views of the cockroach (G, 26.7–29.0 s).** The near legs splay toward the lens and the pronotum reads as a
   large dark dome; the head and mouthparts are small and dark. The anatomy is correct, but this is the least
   recognisable angle. It needs a flatter pronotum with a visible front lip, a lighter head and a slightly higher camera.
2. **The insertion close-up (8.5–10.2 s).** The gripper is large in frame, and the electrode tips under the translucent
   pronotum are small. Readable at full size but subtle on a phone.
3. **Abdominal plates.** They are strongly banded. That fits the species but reads a little "segmented-grub" in the top
   views.
4. **The comparison robot.** After stalling it only rocks; a clearer wheel-spin or a second attempt would sell it.
5. **The reveal (3.0–4.2 s).** It is fairly sparse, and the arm's shoulder crowds the upper right.
6. **The rubble.** Simple block forms: concrete slabs, bricks, rebar. It reads as a collapse but would benefit from
   broken edges, dust plumes and debris texture. The insect is small in the first second of F; that is deliberate, for
   scale.
7. **Reference episodes.** Cyborg Cockroach V5, Dead Spider V6 and Spider-Man (Glass Climbing) were asked for as style
   references. Only Glass Climbing is in this repository. The style was matched to the Weird Crew core (via Zombie Ant)
   and the most recent Shorts here (Bone Glue, Eel Escape, Zombie Ant).

## Ready for human review?

**Yes, as a V1 review cut.** It is complete, with:
- all narration;
- synchronized captions;
- full sound;
- every scene from the brief;
- a working loop;
- no unsupported visual claims that I could find.

**It is not publish-ready.** It still needs a real-time viewing with sound, a check of the four figures against the
paper, and a decision on items 1–2 above.

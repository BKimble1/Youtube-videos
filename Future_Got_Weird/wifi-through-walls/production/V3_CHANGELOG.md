# Wi-Fi Through Walls: V3 change log (visual rebuild)

**What is kept from V2:** the approved narration (the same audio file, its timing), the ElevenLabs delivery, the story
order, the ending question, captions and their sync, the Weird Crew guesser and his rig, and V2's articulated arms and
planted-foot walk.

**What is new:** the picture. The lab, the escalation, the café's cause and effect, the 197-person sequence and the
ending were rebuilt, and the sound cues were re-timed to the new picture.

New code lives in `source/src/v3/`:

| File | Contents |
|---|---|
| `labSet3.tsx` | The concrete-wall lab set |
| `hero3.ts` | His lab choreography |
| `Lab3.tsx` | The lab shots, waves, echoes and the two screens |
| `Cafe3.tsx` | The café |
| `Study3.tsx` | The 197-person study |

The joins are in `source/src/Film.tsx`. The V1/V2 scene files in `source/src/scenes/` are no longer used by the film,
apart from `cafeSet.tsx`, the café street.

## The idea on screen

One continuous lab, cut open as a section. On his side, a security camera watches the room. On the other side of a
0.32 m reinforced-concrete wall, the observation stand shows two stacked screens:

- **CAMERA:** the security camera's live picture, a real second render of the office.
- **RADIO:** the radio's skeleton.

He hides in the camera's blind spot beside the wall. The CAMERA screen loses him; the RADIO screen keeps him. This is the
RF-Pose demonstration format, and it carries the premise with the sound off.

## Shot by shot (as built)

| Time | Narration | Picture |
|---|---|---|
| 0.0–0.42 | If you hid | Opens in motion: he is mid-duck against the concrete. The camera tracks right across the wall's cut end (concrete section, rebar, aggregate): he vanishes behind it and the stand is revealed. CAMERA shows only the empty room; RADIO's skeleton is ducking with him. |
| 0.42–1.0 | behind this wall | Close on the stand. He presses his back to the wall (palms flat) and glances toward the sensor side. The skeleton copies it about 0.1 s later. |
| 1.0–1.6 | this machine | Easing out into the lateral cutaway: his room, the wall's section, the stand, the radio. |
| 1.6–2.3 | could | He sinks into a deep squat, hands to his knees, and the skeleton sinks with him. RADIO's background darkens and the skeleton brightens (the contrast rises). |
| 2.3–3.6 | STILL WATCH YOU | A push into RADIO while he peeks and shifts his weight; the skeleton turns and shifts with him. A motion trail shows the measured movement. |
| 3.6–4.9 | Scientists built a system | Around the stand to the radio: the FMCW unit's cover opens on the board (TX chirp generator wired to the horizontal bar, RX mixer to the vertical bar). |
| 4.9–5.8 | that shoots invisible | Close on the T array: the transmit patches flash with each wavefront leaving. |
| 5.8–6.4 | radio waves | Out past the stand to the wide technical view: fronts crossing the room toward the wall. |
| 6.4–7.4 | THROUGH walls | Close on the wall's section. Every front kinks where it enters the concrete (it travels at under half speed inside), dims, and leaves weaker on his side. |
| 7.4–8.3 | And when they bounce off your body | His side: the fronts reach him, glints flash at his head, torso, hand and knees, and echoes leave toward the receiver, kinking again in the wall. |
| 8.3–8.9 | body | Back at the radio: the echoes arrive, the receive patches light one by one, and the range readout's second peak (him; the first is the wall) rises. |
| 8.9–9.6 | AI creates | To RADIO: raw reflection heat appears. |
| 9.6–10.7 | a moving SKELETON | Keypoints condense out of the heat (torso, arms, legs, head) and the limbs connect. |
| 10.7–11.3 | of you | Two-shot of him and the stand, easing in on him. |
| 11.3–11.9 | Raise your hand? | On him. One raise: the far arm leaves his knee, the shoulder lifts it forward and up, the elbow opens and the palm opens, clear of his hair and face. The echoes from his hand and elbow fly to the receiver. |
| 11.9–12.6 | It raises | The camera tracks across the wall to RADIO: the skeleton's arm is already rising with his. |
| 12.6–13.4 | its hand | On the display: a small wave of the hand, mirrored. A match tone sounds just after "hand". |
| 13.4–14.3 | But here's where it gets | Two-shot: he freezes, arm still up, eyes wide toward the wall, then lowers it and hugs his knees. |
| 14.3–14.9 | CREEPY | The push goes into the skeleton's head keypoint until its light fills the frame. |
| 14.9–16.5 | In a separate experiment | Out of the light: the status LEDs of an ordinary Wi-Fi router on a café shelf. Pulling back through the café window, its Wi-Fi spreads through the room and out through the glass. It is a different place, a different device, and labelled DEMO. |
| 16.5–18.3 | scientists used ordinary Wi-Fi signals | He walks into frame on the sidewalk. The camera tracks beside him, close, then eases out and round so the window joins him; the Wi-Fi fronts scatter off his body toward the window. |
| 18.3–20.8 | to IDENTIFY people walking past | After he passes, the camera pushes through the glass to the analysis laptop (WI-FI SENSING · DEMO). It shows four stages: INCOMING SIGNAL ripples as his scattered fronts arrive; his GAIT SIGNATURE builds; COMPARE runs against #07, #12, #31 and #45; MATCH on #12. |
| 20.8–22.1 | Even WITHOUT their phones | A crossed phone and PHONE NONE appear on the laptop; the camera pulls back out to him walking on, hands empty. |
| 22.1–22.5 | | Tracking with him, a bus-stop ad panel passes the lens; behind its edge a test participant walks the same way (a wipe matched on the action). |
| 22.5–23.5 | They tested 197 | Participant A walks a taped lane between an ordinary access point and a receiving laptop; the laptop records her pattern and files it as P-001, SAVED. |
| 23.5–24.4 | people | Participant B (taller, older, backpack, slower and longer stride, more lean) walks it in a lower, closer shot. A different pattern is filed as P-002. |
| 24.4–25.3 | and identified | Up to the lab display: 197 PARTICIPANTS. The two recordings sit in the grid and the rest fill in. |
| 25.3–26.9 | almost EVERYONE correctly | Matching sweeps the grid: cells turn green one by one, and three turn red. The display reads ILLUSTRATION · NOT STUDY DATA. |
| 26.9–27.4 | So imagine | A push into the grid, then a crossfade screen to screen into the café laptop's stored record of him: STORED · MON 08:41, #12. |
| 27.4–29.3 | walking past a café | Out through the window to him walking past again. |
| 29.3–30.2 | and it recognizes you | As he reaches the window the camera leaves him for the laptop: WALKER · LIVE, then SEEN BEFORE · #12. |
| 30.2–31.8 | without you doing ANYTHING | Back out to him walking on; he glances at the window, uneasy. |
| 31.8–32.1 | | The ad panel again: behind it he is walking in the lab office (matched on the action). |
| 32.1–33.4 | Now would you rather have a CAMERA | He stops, turns and looks up at the security camera on the wall. |
| 33.4–34.4 | watching you | Easing out to the wide view: CAMERA shows him, and RADIO's skeleton shows him too. |
| 34.4–35.6 | Or Wi-Fi | The office's ordinary Wi-Fi router on its shelf broadcasts through the room. He backs, step by step, into the blind spot beside the wall; CAMERA loses him, RADIO does not. |
| 35.6–36.5 | that knows who you are? | His back meets the wall and he starts to duck, as the camera slides in to the opening framing. This is frame 0. |

## Animation work

- **The retreat and duck are one action across the loop seam.** The film's last 4.8 s are negative loop time in
  `hero3.ts`: the office walk, the look up, four backward steps, back to the wall, the duck. Frame 0 is the middle of
  that duck.
- **Every footstep is a planted step.**
  - A planted foot stays put; a stepping foot lifts on an arc and lands, toe first going backward and heel first going
    forward.
  - The arms swing opposite the legs, computed from the feet's real positions.
  - The hips dip while a foot swings.
- **Placement in the shot.**
  - His card is placed at his own floor position, so his size is right in every shot, including the security camera's
    view across the room.
  - Every character is drawn at the depth of their own feet.
- **Faster turnarounds.** New expression keys (notice, glance, peek, frozen, uneasy) give a facial change about every
  second, and his eyes dart while he waits.
- **Rig probe** (`qa/v3/rig_probe.json`, `tools/v3/rig_probe3.ts`): every frame of the lab hero, through the loop
  seam, plus both café passes and both study participants.

  | Check | Result |
  |---|---|
  | Planted-foot slip | 0 |
  | Ankle miss | 0 |
  | Backward elbow | 0° |
  | Leg-bone length change | 0 |
  | Arm-bone length change | ≤ 0.09 rig units (of 199) |
  | Joint acceleration | ≤ 47 units/frame² everywhere |

  A pop between keys (the draft's ending had one of 406) would show in the joint acceleration.

## Camera

- **Continuous moves.** A new `camPath` (cubic Hermite through keys, `world/cam.ts`) carries velocity through each key,
  so a move travels without stopping at every waypoint. A key marked `stop` holds, or reverses at rest.
- **Moves routed around the props.** The draft's moves from the array to the wide view, and from the receiver to RADIO,
  passed through the stand's screens. Both are re-routed around the stand's right side. The motion scan of the MP4
  confirms it: the only spike left is the intended light push at 14.7 s.
- **Fewer cuts.** V3 has no cuts: the joins are a match on light (head keypoint to router LED), two ad-panel wipes
  matched on his walking direction, and a screen-to-screen dissolve. V2 had seven cuts.
- **No dark band at the bottom.** The floors run out toward the camera, and the slab above the cut fills the top of the
  wide views.

## Sound (`tools/make_audio.py`, timing from `audio/v3_events.json`)

Every timed cue is computed by `tools/v3/events.ts` from the same functions that draw the frames:

- His steps in the lab, and all café and study footsteps.
- A transmit chirp with every wavefront.
- A muffled thud as the fronts enter the concrete.
- Glints as they reach him.
- A blip for each echo arriving at the receiver, and for the raised hand's echoes.
- The recordings saved, the grid filling, the match sweep with its three misses.
- The ad-panel whooshes, the security camera's servo, and the RF pings that keep going after the camera loses him.

**Narration clarity:** a draft put the match tones on "its hand" and Whisper misheard the phrase. The tones were moved
just after "hand", and Whisper now reads the MP4 at 0.9% WER, the same as V1 and V2.

## Measured on the MP4 (`qa/v3/`)

| Check | Result |
|---|---|
| Stream | 1080×1920, 30/1, 1094 frames, H.264 yuv420p; AAC 48 kHz stereo |
| Loudness | −14.4 LUFS, true peak −1.3 dBFS, LRA 1.7 LU |
| Black frames, freezes ≥ 0.7 s | none |
| A/V sync | 0.0 ms |
| Loop seam (picture) | Change from the last frame to the first: 12.8. A normal frame-to-frame change is 10.0 (median) and 25.0 (90th percentile). The camera is mid-move at the seam, so this is an ordinary moving-frame step. |
| Loop seam (audio) | Sample-continuous in the WAV |
| Motion scan | One spike: 14.70 s, the push into the head keypoint's light (intended) |
| Narration (Whisper base.en on the MP4's audio) | 0.9% WER; the one difference is "anything" at a chunk edge of the check, as in V1 and V2 |

**Frame review.** Every frame from 0 to 3.5 s and every third frame after that were read from the MP4 as contact
sheets. Full-size stills were checked at the hook, the raise and the "Or Wi-Fi" wide.

Failures that review found, all rebuilt:

- **The security camera:** its blind spot did not hide him, it saw the wrong part of the room, and it drew him at the
  wrong size.
- **Echoes:** they reached the receiver after the camera had left it.
- **Camera paths:** two moves went through the stand's screens, and the raise close-up cut off his hand.
- **Laptop shots:** the café laptop was framed too tightly, and the move to it passed through his body.
- **The study display:** it framed its own empty wall.
- **The office walk:** his ending walk was too long for the room, and he stood with bent knees.
- **A pop at the ending's first frame:** the loop-time cut came too late.
- **Sound:** the masking of "its hand".

## Accuracy

- **Two studies, kept separate.**
  - The lab's radio is the RF-Pose kind: an FMCW unit, a T array, a skeleton.
  - The café and the study use ordinary Wi-Fi.
  - The escalation moves to a different place and device on "In a separate experiment".
- **Labels on the illustrations.** The café laptop says DEMO. The study display says ILLUSTRATION · NOT STUDY DATA.
  The 197 grid's three red cells illustrate "almost everyone"; they are not a measured error rate.
- **No camera-quality picture of a Wi-Fi-identified person.** The Wi-Fi side shows only signals, signatures and IDs.

## Limits

- **Not watched in real time with sound.** This environment has no display or speakers. Every check above was measured
  or made from rendered frames.
- **No Laser Voices benchmark.** The Short is not in this repository, so it could not be watched; V3 follows the
  brief's description of it.
- **Music is unchanged.** It is still the original synthesized bed from V1.

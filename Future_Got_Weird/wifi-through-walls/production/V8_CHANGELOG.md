# Wi-Fi Through Walls: V8 change log (targeted visual polish)

**Kept from V7:**
- The approved narration: the same recording and word timing, the same ElevenLabs voice, no new lines and no call to
  action.
- The story order and the 36.47 s runtime.
- V7's strengths: the live pose visible from frame 0, the signal-to-pose explanation, the hand-raise mirroring, the
  separate identity experiment, the received-versus-learned match, the 197 grid, and the closing question.

**Changed:** shots, labels, screens and the loop join. The code is in `source/src/v8/` (copied from `v7/`); the joins
are in `source/src/Film.tsx`.

## Changes

**Opening (0–3.6 s)**
- **Frame 0:** him crouched behind the concrete wall, with the large live screen showing his skeleton crouched the same
  way.
- **The gesture:** at 0.1–0.4 s he throws **both forearms over his head** (duck and cover) and holds it until 1.0 s;
  the skeleton does the same. One big, legible gesture instead of crouching drift. It is defensive, so it reads
  differently from the deliberate single-hand test later.
- **Stable framing:** the shared composition (person, wall, readout) holds still until 1.6 s. Only then is there one
  move, sideways and in to the screen, as tracking locks onto his joints.
- **"STILL WATCH YOU":** the skeleton flashes once and he rises to peek back at the wall. The screen shows a skeleton
  only: no faces, clothes or camera image.

**Mechanism (3.6–9.5 s)**
- **Hold removed:** the hold on the radio box is gone; one continuous rise goes from the screen to the research radio
  (its box opens) and on to its transmit bar.
- **Followed pulse:** one pulse goes from the transmit bar across the room, through the concrete, to his head.
- **Echo fixed:** the followed pulse's **echo** now visibly travels back to the receive bar. This was a bug: in V7 the
  packet generator dropped the echo after 8.04 s, before it reached the receiver. It is drawn as the front layer so the
  screen does not hide it.
- **New receiver shot:** the receive bar with the top of the screen under it, so the arrival and the traces starting
  are one picture. Then the received traces and the joints inferred from them, point by point.
- **Device:** the through-wall device is always the lab's research radio, never the café router.

**Hand proof (10.7–13.5 s):** kept. Close on his right hand, close on the skeleton's right (cyan) arm, then side by
side. Its staging is a deliberate test with one hand, where the opening was a defensive two-arm cover.

**Creepy turn (14.3–15.4 s):** the cyan silhouette (with his spiky-hair outline) is **removed**. The figure that
leaves the screen and walks into the street is joints and limbs only.

**Separate identity experiment (15.3–22.3 s)**
- A large **SEPARATE STUDY** tag ("identifying people from Wi-Fi signals") appears on "In a separate experiment" and
  stays to 17.6 s.
- The walk now has distinct beats:
  - **street:** he walks out of frame;
  - **one move in to the window:** the router talking to the customers' devices, and the separate receiver;
  - **split screen:** his walk above, the receiver's laptop below;
  - **the no-phone beat.**
  The push in starts only after he has walked clear, so he no longer looms at the frame edge.
- **The laptop, large:**
  - **STORED SAMPLES** (#07, #12, #31, "learned earlier") are on screen first;
  - then the **NEW SAMPLE** builds from his heel strikes;
  - the other records dim, and **MATCH: #12** comes up in a large green pill.
- **Avatars:** every stored record and grid tile is now a generic, single-colour schematic avatar (head and body). No
  hair, face or striped shirt, so nothing looks recovered from the radio.

**197 payoff (22.3–27.1 s)**
- The results display opens with **197 PARTICIPANTS** in large type.
- With the grid, an **ALMOST EVERYONE IDENTIFIED** banner appears, followed by **SCHEMATIC ILLUSTRATION — not the
  study's per-person results** in large type.
- No percentage. Only two amber tiles, inside the labelled illustration.

**Consequence (27.1–31.85 s)**
- The second equivalent café walk is replaced with the **return visit**.
- **LATER cue:** it is marked LATER, and the light turns to dusk (no elapsed time is stated).
- **Split screen:** above, he walks past again; below, the laptop:
  - **SAVED RECORD #12 · KEPT** (the learned record persists);
  - a **NEW SIGNAL** arrives from his steps;
  - **SAME ID: #12** on "recognizes".
- Then him close, walking on, unaware.
- It stays the hypothetical café scenario of the narration ("So imagine…").

**Question and loop (31.85–36.47 s)**
- **CAMERA:** the lamp-post CCTV, then its own fixed picture, labelled **CAMERA**. The CCTV picture now shows no radio
  waves.
- **WI-FI:** from "Or Wi-Fi", the screen splits. Below, labelled **WI-FI**: echoes arriving in the receiver's antennas
  and the laptop holding his learned ID (#12). No camera feed.
- **The join:** under the camera he stops and crouches. After "who you are?" the caption ends and at 36.12 s the film
  cuts on that crouch to **the same crouch behind the lab wall**: the opening composition, held still. The lab's last
  0.35 s and frame 0 are one continuous pose, so the replay is an exact join. The V7 lab reset under the caption is
  gone.

**Captions:** a soft dark backing behind every caption, so contrast holds over waves, screens and dissolves.

## Sound (`tools/v8/make_audio8.py`, timing from `tools/v8/events.ts` → `audio/v8_events.json`)

- **New cues, re-timed to the picture:** the arm throw, the shuffle and the peek; the SEPARATE STUDY tick; the
  return-visit cues (record kept, new signal, same ID); the stop and the soft thud on the cut back to the lab.
- **Voice clarity:** I measured the voice against everything else, in 0.5 s windows while it speaks
  (`qa/v8/voice_clarity.json`). This found two masking spots, which I fixed:
  - the "creepy" impact, lowered by about 5 dB;
  - an unease swell under "anything", lowered by about 11 dB.
- **Not done:** no one has listened to the mix. The voice is checked by that measurement and by speech recognition
  only.

## Checks on the delivered MP4

**File metadata (ffprobe):**
- Video: H.264, **width 1080, height 1920**, 30/1 fps, 1094 frames, about 6.1 Mb/s, rendered natively from source
  (not upscaled).
- Audio: AAC 48 kHz at 320 kb/s; audio-to-video lag 0 ms; 36.47 s.

**Measured:**
- **Loudness:** −14.3 LUFS integrated, LRA 2.2 LU, true peak −1.4 dBFS.
- **Black frames and freezes:** none.
- **One-frame pops** (`qa/v8/V8_pop_scan.json`): none.
- **Loop seam:** the last-to-first picture change is **1.53**, below the 3.94 median between consecutive frames. The
  lab's last 0.35 s and frame 0 are the same held crouch.
- **Motion spikes:** only at the intended cuts (8.3, 11.0, 11.8, 12.7, 19.0, 20.8, 30.3, 31.9, 33.0 and 34.5 s, and
  the 36.13 s match cut).
- **Rig probe** (`qa/v8/rig_probe.json`): no planted-foot slip, no ankle misses, no backward elbows, bone-length drift
  at most 0.12 units. V7's 2.4-unit arm stretch is gone.
- **Speech recognition:** Whisper 0.9% WER, Zipformer 5.4% WER. Whisper drops "anything" on the bare narration file
  too, so this comes from the recording, not the mix. Zipformer hears it.

**Frame review:** done from the MP4.
- Every 2–3 frames over 0–4 s, the café push, the return visit and 34–36.47 s plus the loop seam; every 6 frames
  elsewhere.
- Phone-size, muted contact sheets.
- Fixed during review:
  - the café push looming over him;
  - the split screen cropping his head;
  - the WI-FI echoes missing the antennas;
  - the followed echo vanishing before the receiver;
  - the LATER chip over the café sign.

## Remaining limitations

- **Not watched or heard in real time:** I reviewed contact sheets of the rendered frames, not a real-time playback,
  and could not listen to the mix. Please watch it twice at normal speed, as the brief asks, before the 4K master.
- **Sources not re-checked:** kit.edu is blocked by this session's network policy, so I could not re-read the
  KIT/BFId pages. On screen I added no claim beyond the narration and generic study labels: SEPARATE STUDY, 197
  PARTICIPANTS, ALMOST EVERYONE IDENTIFIED, "learned earlier", SCHEMATIC ILLUSTRATION.
- **No Cyborg Cockroach reference:** the Cyborg Cockroach V5 project is not in this repository, so it could not be
  used as a direct reference.
- **Voice clarity:** one 0.5 s window (31.5 s, the tail of "anything") measures the voice 6 dB under the bed. That is
  the quiet end of the word over his footsteps and the music; the masking effect there is now 11 dB lower.
- **The mechanism's echo:** to stay readable, the followed echo is drawn over the screen where it physically passes
  behind it.
- **The café receiver:** the receiver in the identity scenes is an illustration of a separate receiving setup. The
  study's exact hardware is not depicted.

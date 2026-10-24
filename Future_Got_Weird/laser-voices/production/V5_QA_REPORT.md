# Laser Voices V5: director's rebuild, QA note

24 Oct 2026. V5 rebuilds the shots so that the action in the frame tells the story and the camera mostly watches.
**Not published, not final.**

Nobody has watched or listened to it in real time; I can't play video or audio here. The judgements below come from
the contact sheets of the exported MP4 (4 frames per second), full-resolution crops, frame-difference measurements,
free speech recognition and audio measurements.

The shot plan, with the justification for each camera move, is `production/V5_SHOT_PLAN.md`.

## Files

- `exports/FGW_Laser_Voices_V5_REVIEW_1080x1920.mp4`:
  - picture: 1080×1920, H.264 High, 30 fps, 1022 frames (34.067 s), bt709;
  - audio: AAC-LC 48 kHz stereo (ffprobe reports 273 kb/s).
- `captions/FGW_Laser_Voices_V5.srt`: identical to V1 (the same 23 cues), burned in with the V3/V4 style.
- Source: `source/src/v5/`, composition `LaserVoicesV5`, still `V5Still`. It reuses the V4 hall, rig, cast and
  transmitter from `source/src/v4/`.
- Audio:
  - the mix: `audio/mix/FGW_Laser_Voices_V5_mix.wav`;
  - the stems (regenerated, git-ignored): `audio/mix/stems_v5/`;
  - the cues: `audio/cues_v5.json`;
  - the measurements: `audio/mix/mix_measure_v5.json`.
- Evidence: `qa/v5/`.
- V1–V4 are untouched.

## What changed from V4

**Camera.**
- V4 moved the camera all the time. Its mean frame-to-frame change was 13.9; V5's is **2.89** (grey 135×240).
- V5 has 13 shots. Ten are locked; a slow drift of 1–3% keeps them breathing.
- The joins are clean cuts or match cuts. The motion scan finds exactly nine hard picture changes, all of them
  planned: 2.9, 3.77, 5.0, 6.97, 15.0, 17.77, 20.0, 23.4 and 32.3 s.
- There are three deliberate moves, each with a start, a destination and a reason:
  - M1: into his ear and its cutaway;
  - M2: along the beam into the air beside his ear;
  - M3: from the molecules out to the eardrum.
- Gone from V4: whips, orbits, overhead flips, the grey scene and repeated push-ins and pull-outs.

**One clear geography.** The transmitter is always on screen right and the listener on the left, so the beam always
runs right to left. That holds in the hall, the ear cutaway, the molecules, the optics, the plan view and the lab.

**The hook (S1–S3).**
- The voice starts across the loop seam. His eyes go wide, his head snaps toward it, and his hand comes up to that
  ear. He turns to his friend ("did you hear that?").
- She keeps reading the case's placard and sipping her coffee, then a blank look and a small palm-up "what?".
- One short shot of the laser setup, with the two in line behind it.
- Back to the two: he searches the air, puzzled; she sips and gives him a sideways look.

**Nothing in your ears (S4–S5).**
- His head in close-up, then one push into the ear, which becomes a registered anatomical cutaway with the canal
  shown empty.
- A clean cut to the wide geography shot. Nothing is visible between the transmitter and him until "invisible"; then
  a thin dotted line draws in from the window to his ear. It is a restrained visualisation and is never shown as a
  bright real beam.

**The science (S6–S8).** One locked molecular frame, with distinct stages:
- **A.** Light packets travel along the beam. One packet first crosses the whole frame untouched, because nitrogen
  and oxygen let it pass. Then four water molecules each swallow a packet, the first on "absorbs": they flash warm
  and start to vibrate.
- **B.** Their neighbours start jostling. A warm pocket swells around the beam and pushes the air apart.
- **C.** The light pulses, and each pulse sends a band of bunched-up air outward. The bands keep the same speed on
  screen through M3.
- **D.** At the ear, the bands enter the canal and each one pushes the eardrum; the ossicles follow.
- Decorative molecules are cut to a sparse field (N₂ and O₂ muted). The stages are not explained with any text.

**The technology (S9–S10), locked.**
- **The cutaway (S9).** The cover slides off. The laser module fires into a small mirror on a **galvanometer
  motor**, replacing V4's spinning polygon, which was a made-up part for this experiment. The mirror tilts ±4°, so
  the beam swings ±8° across a narrow arc (reflection doubles the angle).
- **The plan view (S10).** In slow motion, the beam's far end sweeps onto his ear at the (slowed) speed of sound.
  Every point it passes gives off a ring, and the rings stack up at his ear. A colleague a metre away only gets
  them one at a time.

**Eight feet (S11).** One locked lab composition:
- the bench and transmitter on the right, the listener on the left;
- a floor tape with foot marks and "8 FT" painted at his feet;
- the scientist turns the key and LASER IN USE lights up;
- the listener startles, grins, cups his ear, and points at it for the colleague, who shrugs;
- on "eight feet" the foot marks light in turn to the 8 FT mark.

**The interruption (S12).** One continuous locked shot, 8.9 s long:
- He hears the voice; the dotted line runs from the transmitter to his ear.
- A visitor with a museum map (one of the channel's other cast) walks from the back of the hall toward the front,
  with a planted walk and arm swing.
- The visitor stops in the line to read the map. His body enters the beam on **frame 815**, the voice stops dead, and
  the dotted line now ends on him.
- The lead reacts to the silence, looks around, then at the visitor.
- On "they move…" the visitor folds the map and walks on. He clears the beam on **frame 958**, the voice is back at
  once, and the lead jerks toward it.
- The listener never changes and nobody teleports.

**The ending (S13).** A match on action back to the opening composition. He settles back to the case; the voice
begins again, and his startle runs across the seam into frame 0. The loop is the recurring action, not a camera
trick.

## Measured

- **Narration:** the same approved file (sha256 `b22271734436…`), unedited, at sample 0 and the V1–V4 gain.
  - Vosk on the export: WER 0.010; the only difference is "its" heard as "it's".
  - An earlier V5 mix scored 0.040 because the whisper masked "If" and "you hears". The fix ducks the whisper 9 dB
    under speech.
  - Integrated −14.6 LUFS (V4: −14.55); sample peak −2.55 dBFS.
- **The whisper:**
  - set 15 dB under the narration, then −21.1 dB under it while she speaks;
  - peak −17.2 dBFS;
  - −140 dB throughout the block;
  - level matches across the seam (−32.4 dB in the last 0.3 s, −35.0 dB in the first).
  - SFX peak −21 dBFS.
- **Block** (`qa/v5/check_v5.json`): the visitor's body (head, neck, torso, arms) against the beam segment, every
  frame from 690 to 968: blocked on exactly frames 815–957. 0 mismatches.
- **Loop seam** (`check_v5.json`, `qa/v5/loop.json`):
  - the camera's step across the seam equals its neighbours' (position 0, focal length −0.22 px per frame);
  - the leads' joints move ≤ 0.6 mm per frame across the seam;
  - crowd ≤ 0.034 m;
  - in the exported picture, last frame → frame 0 measures 1.25 (caption band excluded), against neighbouring
    steps of 0.99–2.44 (median 1.18).
- **Mux:** decoded MP4 audio against the WAV: offset 0 samples, correlation 0.99997.

## Review against the brief's checklist

- **Repeated push-ins and pull-outs:** none. Each of the three moves happens once.
- **Moves without a destination:** none (see the shot plan).
- **Random overhead shots:** none. S10 is a deliberate plan view of the lab floor that explains the sweep geometry,
  in one locked shot.
- **Unnecessary changes of perspective:** the hall has three compositions: the front-left two-shot, the setup, and
  the wide geography shot. Each is reused for its purpose.
- **Character performance:**
  - the lead's head turns lead with his eyes;
  - he grows from neutral to startled, searching, listening, puzzled and amazed;
  - deliberate hand gestures (cupping and checking the ear);
  - she keeps up a continuous, unbothered business;
  - the visitor walks, stops, reads, folds and walks on;
  - the lab listener and colleague contrast.
- **Floating particles:** the molecule field is sparse, and every molecule takes part in A–C.
- **Repeated facts:** the hall's wide shot appears twice, once to establish the path and once for the interruption.
  That is the same geography on purpose.

## Known issues / not done

- Not watched or listened to in real time. Whether the whisper reads as subtle and eerie needs a listen.
- **Faces are small in the hall's wide shot (S12).** The lead and his friend are in the foreground, but their faces
  are about 80–100 px; the reaction is carried by head turns and hands more than expressions. The lab shot (S11) is
  similar.
- **Crowd overlap in S12.** Background walkers sometimes pass behind the beam's dotted line in screen space (they
  are 2 m or more behind it, never in it).
- **The ear cutaway is stylised:** simplified ossicles and cochlea.
- **The molecular scene simplifies:** the share of water molecules is exaggerated, and the light packets, warming
  and pressure bands are slowed and enlarged.
- **The sweep diagram is a teaching simplification:** the beam's end moves at the speed of sound onto the listener.
- **No 4K master:** only the review file was asked for; the source can render one with `--scale=2`.

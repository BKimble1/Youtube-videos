# Cyborg Cockroach V4: final production polish

## Deliverables

- **Final master:** `exports/FGW_Cyborg_Cockroach_V4_FINAL_1080x1920.mp4`
  - Video: 1080x1920, 30 fps, 936 frames, 31.2 s, H.264 High, yuv420p, bt709, CRF 14, about 6.6 Mbps.
  - Audio: AAC 48 kHz stereo.
  - Loops.
- **Mix:** `audio/mix/FGW_Cyborg_Cockroach_V4_mix.wav`
- **Cues:** `audio/cues_v4.json`
- **Subtitles:** `captions/FGW_Cyborg_Cockroach_V4.srt`
- **Source:** V3's project. The composition is still `CyborgCockroachV2`, and the cut table is in `source/src/v2/cuts2.ts`.

## Narration

The approved ElevenLabs narration is unchanged, word for word, at the same timing.

- The mixer's voice stem matches the source file (correlation 1.0).
- A Whisper transcript of the final MP4 has a word error rate of 0 against the locked script.

## Improvements over V3

- **0-1.3 s, hook:**
  - **0.00 s:** opens tight on the launcher at the moment of action: loaded needle, glowing coil, clear silicone target.
  - **0.17 s:** match cut to the gloved thumb driving the remote's red FIRE button home; the button sits on the coil's screen spot.
  - **0.37 s:** back on the launcher as the line parts, with a small spark.
  - **0.38-0.55 s:** the spring drives the injector along the tube into the silicone, with squash, rings and rebound.
  - The camera then tracks back to reveal the living insect wearing it.
  - Sound: button press, the coil driven hot, trigger, spring, slide, then the impact thock.
- **1.3-4.7 s, operator:**
  - The operator holds the remote. His thumb taps the D-pad and the insect responds at once: steering pulse, antenna flick, a tripod-step pivot.
  - One lateral camera move runs from his hands along the bench to the insect.
  - The insect turns away and crosses the table.
  - The solid foam wipe is replaced by an edge wipe: a foam block's edge reveals the next scene while both scenes keep moving, so there are no blank frames.
- **4.8-10.5 s, fitting and steering:**
  - Smaller gloved hands press the module itself, with no fingers over the shell, legs or antennae, then lift away.
  - One continuous push runs into the mounting profile.
  - Walking on cork.
  - Top-down steering pulse, then a leg-propelled right turn around a block that blocks the way. The end hold is removed.
- **15.5-20.6 s, demonstration:**
  - The launch close-up is reframed so the whole travel and the impact are in one stable shot.
  - The injector reads clearly: barrel ticks, glass highlight, steel needle.
  - The spark is small.
  - The orange dose "ball" is replaced by a soft translucent cloud in the silicone.
  - The rise over the lab targets moves on every frame, with foreground parallax.
- **20.6-25.3 s, rescue concept:**
  - One continuous descent from the collapsed building into the gap, with real layer parallax (no 2D zoom). The "Future rescue concept" label sits over this descent.
  - The insect's on-screen size progresses smoothly from the wide shot to the macro.
  - Antennae probe ahead; the body pitches and rolls with its planted feet on the rubble.
- **25.3-31.2 s, ending:**
  - Her reaction is restrained unease: brows draw together, eyes follow the sound, a small lean back. The stiff "disgust" face and the nose marks are gone.
  - New over-the-shoulder shot: the medic crawls out across the rubble toward her, with weight in its walk.
  - The device glints, she shows cautious hope, and her hand opens.
  - The final close-up of the device beside her open fingertips lands exactly on frame 0's framing, so the loop is seamless.
- **Sound:** 137 cues read from the animation, all under the narration:
  - footsteps;
  - trigger, launcher and impact;
  - pulses;
  - grit, creaks, wind and a breath.
- **Captions:** the same clean style and exact word timing, in mobile-safe bands.

## QA of the final master

From `qa/FGW_Cyborg_Cockroach_V4_FINAL_qa.json`, `_motion.json` and `_phone_sheet.png`:

- **Loudness:** -14.2 LUFS integrated, true peak -1.5 dBTP, voice 22.8 dB over the rest in the phone band.
- **Sync:** offset 0 ms, correlation with the mix 0.99998.
- **Captions:** caption windows 23/23.
- **Encoding:** keyframes at most 0.5 s apart; ffmpeg blackdetect finds no black frames.
- **Motion:** no low-motion holds. The only motion spike away from a cut is the thumb's press at frame 7, which is intended.
- **Frames inspected:**
  - every frame of 0-29;
  - both sides of every cut and of the wipe;
  - every other frame of 892-935;
  - the 935 -> 0 loop.

## Remaining imperfections seen in QA

- **Screen direction:** the medic walks screen-left in her two-shots (F3-F5) and screen-right in the final close-up (F6), which matches frame 0 for the loop. Her fingertips are in both, but the cut crosses the line.
- **Small details:**
  - The D-pad tap at 2.2 s is small on screen (the remote is about 145 px). The green LED flash, the click and the insect's instant response carry it.
  - In the over-the-shoulder shot (28.3-29.1 s), her tense fist can read as slightly raised.
  - In the descent into the gap (21.8 s), the rescuer's glove at the right edge is large and simple, and the slab face above it is plain.
- **Top-down legs:** from directly above (8-10.5 s), the broad shell hides most of the legs, so only 3-5 leg tips show.
- **Dose colour:** the amber dose fills most of the barrel during the D2 flight, consistent with the device design elsewhere.
- **Runway:** not used. Its asset host is still denied by this environment's network policy, so nothing was generated and no credits were spent.

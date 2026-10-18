# QA report: This Car Jumps Without a Ramp (18 Oct 2026)

## What exists and what does not

- **The final 4K master does not exist yet.** The essential BYD clip and the owner's recordings could not be downloaded
  here (network policy: `drive.google.com`, `www.byd.com`, `www.youtube.com` refused). The master render is guarded,
  and `footage/README.md` has the way in.
- **A 1080p review copy was rendered**: `exports/FGW_U9_JumpsWithoutRamp_REVIEW_1080p_not-for-upload.mp4`, Git-ignored,
  rebuilt by `tools/render_review.sh`. Its two real-footage windows show a "REAL FOOTAGE PENDING" card. **It must not be
  uploaded.**
- **Not watched or listened to in real time.** Everything below is measurement, transcription and frame inspection.

## Narration (measured)

- **Script match:** 24 takes (4 per block) transcribed with Scribe. Every take with a complete transcript matches the
  script word for word, including "Yangwang". Two takes were left out because Scribe merged their repeated text.
- **Picks:** b1_t2, b2_t3, b3_t2, b4_t2, b5_t3, b6_t3, chosen by speaking rate nearest about 160 wpm, no long internal
  pause, and consistent level. Placed whole, with no sentence surgery and no time-stretch.
- **Pace:** 363 words in 2:14.2 is 162 wpm overall. Per block, the rate is 157–180 wpm.
- **Not checked by ear:** pronunciation of "BYD's" and "Yangwang", emphasis, warmth and comic timing. **Listen once before upload.**

## Mix (measured)

- **Mix target:** −15.0 LUFS integrated, −1.5 dBTP true peak (−1.4 dBTP after AAC), LRA 2.1 LU. Source:
  `audio/mix/mix_measure.json`.
- **Masking screen** (`audio/mix/speech_mask.txt`): the median voice-to-bed margin while speaking is 22.9 dB. Of
  2,024 speech windows of 50 ms, the bed is within 6 dB of the voice in 55 and louder than the voice in 5. Those are
  mostly bump thuds and landing thumps between words.
- **Effects:** every effect sits on an exported animation event (`audio/sfx_events.json`). There are no effects at
  takeoffs, and the only whoosh is the car passing through the camera.

## Picture (review render, measured with `tools/qa.py`; results in `qa/review_r2/qa_results.json`)

- **Duration:** 134.16 s at 30 fps, 1920×1080.
- **Black frames:** none.
- **Single-frame pops:** none.
- **Static holds of 1.5 s or more:** only three remain.
  - 0:00–0:02.5 and 1:47.9–1:49.7: the placeholder cards (these become real footage).
  - 2:12.4 onward: the intended end settle.

  In the first review render (r1), the question/name beat (0:09.8–0:14.4) and the passenger shots (1:40–1:48) also
  held. They now have slow camera creeps, and r2 shows no hold there.
- **Transition strips** (`qa/review_r1/strips/`): the side-to-bend tail wipe, the car through the camera into
  braking, and the wipe into the passenger bend all read as designed.

## Frame inspection (development rounds in `qa/`)

- **Physics.** These come from small simulations (`source/src/sim/`), not hand keys:
  - Ground force equals gravity at rest, exceeds it during the push, is zero in the air and returns on landing.
  - Gravity is constant, including at the apex.
  - The flight is uniform slow motion.
  - The landing settles without bouncing.
  - On the rough road, the cabin moves less than the wheel, but not zero. The trace shows both.
  - The big bump reaches the travel stop. It is shown slowed down, with a label.
- **Forces.**
  - The whole-car diagrams show only external forces.
  - Actuator arrows appear only in the close-ups, as equal and opposite pairs between wheel and body.
  - Braking arrows sit at the tyre contact patches.
  - The seat force on the passenger points toward the centre of the turn.
  - There is no outward arrow.
- **Corner.**
  - The same road, speed and radius are used for the passive and active cases.
  - The outside tyre load stays larger with the level body ("TIRES STILL SET THE LIMIT").
- **Labels:** "SIMPLIFIED" appears with every cutaway, and "SLOWED DOWN" with every slow motion. There are no numbers
  on screen.

## Known limits and open items

1. **Footage.** It is needed for:
   - the opening and the replay;
   - the match-cut alignment (the measured wheel positions);
   - the vector silhouette check against the real side profile;
   - the hop height;
   - the thumbnail's clearance;
   - sound cues on the real landings.

   The car is drawn from published dimensions and memory of the design; the side silhouette must be checked against
   the clip's frames.
2. **Not opened from here:** the cited source pages (claim ledger, access note). Check that they open before upload.
3. **The thumbnail is a draft** (`thumbnail/FGW_U9_thumb_DRAFT_1280x720.jpg`) until the airborne frame sets its
   clearance and silhouette.

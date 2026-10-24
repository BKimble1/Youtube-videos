# Laser Voices: Rebuild V1, QA note

24 Oct 2026. Rebuild V1 is a review cut of the new visual direction. It is **not final, not published, and not the 4K master.**

Nobody has watched or listened to it in real time; I can't play video or audio here. Everything below comes from:
- contact sheets of the exported MP4 (`qa/rb1/sheets/`, 4 frames per second);
- full-resolution stills of every shot made during the build;
- frame-difference measurements;
- geometric checks;
- free speech recognition;
- audio measurements.

The shot list is in `production/REBUILD_V1_SHOT_PLAN.md`.

## Files

- **`exports/FGW_Laser_Voices_REBUILD_V1_REVIEW_1080x1920.mp4`**, read back with ffprobe (`qa/rb1/ffprobe.txt`):
  - picture: 1080×1920, H.264 High, yuv420p, bt709, 30/1 fps, 1022 frames, 34.067 s;
  - rendered natively at that size, not upscaled;
  - audio: AAC-LC 48 kHz stereo.
- **Captions:** `captions/FGW_Laser_Voices_REBUILD_V1.srt`, identical to V1. They are burned in with the established bold white and yellow word style.
- **Source:** `source/src/rb/`, composition `LaserVoicesRB`, still `RBStill`, dev sheets `RBSheet`, `RBBody`, `RBFaceCU`, `RBEmitter`, `RBShot`.
  - The libraries in `rb/lib/` are copied from the Death Clock project (branch `claude/intelligent-fermat-pz7wjt`).
  - Everything else is new. No V6 code, art or structure is used.
- **Audio:**
  - mix: `audio/mix/FGW_Laser_Voices_REBUILD_V1_mix.wav`;
  - cues: `audio/cues_rb.json`;
  - measurements: `audio/mix/mix_measure_rb.json`;
  - build script: `tools/make_audio_rb.py`.

## Measured

- **Narration:**
  - the same approved file (sha256 `b22271734436…`), unedited, at sample 0 and the same gain;
  - Vosk on the export gives a word error rate of 0.010; the only difference is "its" heard as "it's", as in every earlier version;
  - integrated loudness −14.55 LUFS; sample peak −2.56 dBFS.
- **The voice (nonverbal whisper):**
  - about 21 dB under the narration while she speaks;
  - −140 dB (silent) through the block;
  - cut by a 3 ms ramp on frame 786 and back with an 80 ms ramp on frame 958, as the brief asks for an abrupt cutoff and a gentle return.
- **Block** (`qa/rb1/check_rb.json`):
  - the passerby's head and shoulders are tested against the beam path's crossing point on every frame from 660 to 1021;
  - blocked on exactly frames 786–957, with 0 mismatches;
  - his walk-in and walk-out start times are solved from the full pose, so the picture and the sound agree.
- **Loop seam:**
  - the close-up performance's joints move 2.3 px from the last frame to frame 0, against 2.1–2.3 px between neighbouring frames;
  - in the exported picture the seam step is 3.07, against neighbours of 0.31–5.79 (median 3.59), so it reads as an ordinary frame;
  - frame 0 is mid-reaction: his eyes are already moving.
- **Motion scan** (`qa/rb1/motion_scan.json`):
  - mean frame change 3.44, up from V6's 2.1, so the picture has more motion;
  - every spike is a planned cut, plus two in-shot actions: his hand entering and leaving the ear close-up (5.93 s and 6.6 s), and his head whip in the reaction close-up (27.67 s);
  - a camera jump found at 8.0 s in the first render was fixed.
- No black frames and no end card.
- **Mux:** audio offset 0 samples against the WAV, correlation 0.99997.

## Against the brief's checklist (judged from stills, not playback)

1. **Immediate hook:** yes. Frame 0 is an extreme close-up mid eye-snap. Within 1 s his head whips round, and the camera traces the path back to the emitter.
2. **Polish versus Death Clock:** closer than V6, but **not yet at Death Clock's level.**
   - The faces have the same finish (gradients, gloss, ink): irises, lids, lash lines, shaped brows, lips.
   - The bodies are simpler than Death Clock's man: the jackets are single shapes with no folds, and there are no shoulder, waist or sleeve creases.
   - The hands read well in the close-ups and as small mitts in the wide shots.
3. **Energy and information density:** there is a new action or view about every 1–2 s. Exceptions:
   - the opening of the side view (20–21 s) is a slower pull-back;
   - the side view of the obstruction (27.85–30.4 s) is a 2.5 s wide shot whose small figures carry the action (lean, glance, wave).
4. **The science makes visual sense:**
   - the ear has no headphones and the canal is empty;
   - water molecules are picked out on "water vapor";
   - light pulses run down the path, and each absorbing molecule flashes and vibrates;
   - the warm pocket swells and pushes molecules apart;
   - pressure fronts travel into the canal and push the eardrum and the hammer bone;
   - the camera follows them in one continuous micro world.
5. **No lifeless science segments.** The micro world moves throughout.
6. **Anatomy:**
   - arms use two-bone IK with pole targets, so elbows never flip;
   - feet are planted from planned steps;
   - neither the rig nor the stills show any floating limbs.
   - **Not yet checked frame by frame at full resolution:** a few arm transitions pass through an awkward horizontal forearm for a few frames (raising the hand to the ear at 20.1–20.5 s and 32.1–32.4 s).
7. **No unexplained jumps.** Every move has a reason (see the shot plan).
8. **The beam is never shown as light the characters can see.** It is always the dashed amber instructional path, with chevrons. Only the characters' reactions show it.
9. **The block is physical:**
   - his head enters the path and the path ends on him;
   - the voice cuts on the same frame;
   - the side view then shows the obstruction from 90°.
10. **Loop:** see "Loop seam" above.
11. **Captions:** synchronised (the V1 cues, unchanged). The caption band is at y 1470; feet and the floor tape sometimes pass behind it, but no faces do.
12. **Narration:** unchanged.

## Known issues / next pass

- **Not watched or listened to.** The pacing, the whisper's level and the comic timing need a human pass.
- **Bodies are less detailed than Death Clock's.** Missing: clothing folds, creases and secondary motion on the jackets.
- **Wide-shot scale.** Characters are small in the down-the-path shots and the side view of the obstruction, where expressions are hard to read. The close-ups carry the reactions.
- **The micro arrival at 8.55 s is a dissolve.** The drawn ear becomes the sectioned canal walls (flat, layered shapes); it is a dissolve, not a true morph.
- **The emitter is a simple box model.** The x-ray internals read, but the housing is plainer than Death Clock's device.
- **The operator's role is small.** She turns the dial, is out of focus in the device shot, and waves in the obstruction shot.
- **No 4K master yet.** As the brief asks, this is the review cut. The source can render 4K with `--scale=2` after approval.

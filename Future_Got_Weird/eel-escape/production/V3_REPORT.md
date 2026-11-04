# Eel Escape V3: delivery report

**Deliverable:** `exports/FGW_Eel_Escape_V3_FINAL_1080x1920.mp4`

- **Video:** H.264, 1080×1920, 30 fps, 744 frames, 24.80 s, CRF 16, yuv420p, BT.709.
- **Audio:** AAC, 48 kHz stereo (320 kb/s target, about 260 kb/s measured average).
- **How it was made:** the delivered file came from `tools/render_resilient.sh`: JPEG frames at quality 95 rendered
  in resumable chunks (the container restarted twice during long renders), then one x264 encode with the channel
  settings.

**Evidence:** `qa/v3/`.

- `render_qa.json` (measurements)
- `contact_every_0.5s.png`
- `hook_0-2.5s_every_3rd_frame.png`
- `loop_last22_first8.png`
- `loop_seam_last3_first3.png`
- `final_asr.json`

## Measured QC (the delivered file)

| Check | Result |
|---|---|
| Decode | 0 errors; 744 frames decoded |
| Frame-to-frame change | Median 1.64. **No large changes anywhere**, so no one-frame jumps or resets. |
| Near-static stretches | Longest is 15 frames (0.5 s, at 23.8 s: the predator alone, breathing, settling before the lens sweep). |
| Loop seam | Last frame vs frame 0: 3.25, about twice an ordinary frame step. The departing tail's wipe has already revealed the opening composition, on the same camera and the same fish. |
| Narration on the final track | The MP4's own audio transcribed by sherpa-onnx Zipformer and Whisper base.en: **WER 0.000 on both** |
| Loudness (`audio/mix/mix_measure_mix_v3.json`; decoded from the MP4: −14.02 LUFS, −1.6 dBFS sample peak) | −14.01 LUFS integrated, −1.60 dBTP true peak (4×). Voice −14.07 LUFS stereo-equivalent; effects 14.1 dB under the voice. Loop seam jump 0.0009. |
| Timing | Speech from frame 1 (0.02 s) to 23.77 s. The film is 24.80 s, inside the 22–25 s target. Audio offset against the mix: 0 samples (cross-correlated). |

## The brief, point by point

**Narration**
- The locked words, verbatim, in the channel narrator.
- Generated first; the picture is timed to the read: every beat in `source/src/story.ts` is keyed to a measured
  word time.
- Speech starts on frame 1.
- "Its head comes out last" is slower: 5.2 syllables/s, against about 6.3 on either side.
- The pace picks up on "one final pull".

**Shot 1: the evidence (0–1.6 s)**
- The broad-headed predator faces left: gold eye, closed mouth with a jutting lower jaw, and a prominent gill
  cover just behind the eye.
- A slate-blue eel tail protrudes from beneath the cover's rear edge and rises over the back. It is round,
  tapering, fringed and flexing on its own, clearly unlike the warm amber, rayed fins.
- In the first 0.46 s the cover beats once (the red crescent peaks at frame 3 and has closed by frame 13), and the
  tail swings the opposite way.
- The tail tip stays inside the frame: its rightmost pixel is at least 38 px from the edge (gate measurement).

**Shot 2: what is still inside (1.6–5.7 s)**
- On "the eel it just swallowed" the camera follows the tail inward.
- The skin turns see-through, first along the eel, then over the body. The fins stay amber.
- The same eel continues under the cover, through the gills and down the throat; its head and eye are in the
  stomach.
- On "Scientists filmed it on X-ray" the identical outline becomes an illustrated radiograph by a soft wipe from
  head to tail. The fish faces left throughout.
  - The eel keeps its own colour, with a soft glow (the study made the eels visible with a contrast agent).
  - There are no grids and no labels.
- A brief rewind slides the eel back into the stomach at a mechanical, constant speed. Motes, fins, breathing and
  the tail's flex all run backward with it.
- No research footage was used: none is in the repository and no reuse clearance is on file
  (`production/SCIENCE_NOTES.md`).

**Shot 3: backing up (5.8–10.8 s)**
- The view starts wide: the stomach and the route to the throat.
- The eel lies folded with its head deepest. It has a recognisable head with a small eye and pectoral fin, and a
  long tapered tail.
- On "starts backing up" the tail tip pushes clearly into the esophagus, about 11.6 u in 1.7 s, with every fold
  sliding back along itself. The camera pushes in, follows the tip, then widens before the gills.
- It is one connected animal throughout. This is checked numerically on every frame (below).

**Shot 4: the exact exit (10.5–14.3 s)**
- The X-ray wipes back to the exterior. The cutaway window over the gills fades in (14° yaw), and the camera pushes
  in on the slit.
- The tail turns sideways through the slit between arches 2 and 3: behind the arches, then in front of them.
- It crosses the opercular chamber and slips out beneath the intact rear strip of the cover. The mouth stays in
  frame and closed.
- The camera then pulls out with the skin still see-through: one continuous eel runs from its head in the stomach,
  up the throat, through the slit, to the tail in the water.
- The window then fades shut and the skin turns opaque. The camera settles on, and holds, the exact opening
  composition.

**Shot 5: the obstacle and the release (13.9–21.3 s)**
- The body follows tail first, arching over the fish's back.
- On "Its head comes out last" the head is the last part caught. Its eye shows inside the gill opening while the
  free body bends outside, and the whole arch stays in frame.
- The eel curls into a loop and tightens.
- On "one final pull" the head comes free, once (20.80 s), with a water-rush burst. The coil lifts away,
  straightens into a swimming S and rolls back-up.
- The predator stays alive and upright: breathing, a startle flutter, and its eye following the eel.

**Shot 6: the loop (21.3–24.8 s)**
- The eel swims clear, up and away, and leaves the frame. Every eel sample stays at least 4 u above the
  predator's back once it is clear (probed on every frame). The predator's eye stays in frame throughout.
- One smooth, monotonic move settles on the opening camera.
- The eel's tapering tail then sweeps once, right to left, close past the lens. Behind it the opening composition
  appears: the same camera, the same fish, and the tail back in the gill.
- The last frame flows into frame 0, and the tail sweep matches the opening tail's flick.

**Visual and audio direction**
- One main screen direction: the fish always faces left.
- The eel is the same slate blue in the exterior, the reveal, the X-ray and the cutaway.
- No arrows, labels, inset circles, floating graphics or X-ray grids: the narration captions are the only text.
- Captions sit in the top band. A per-frame geometry check confirms they never cover the gill opening, including
  under the cutaway yaw.
- Sound: subtle underwater ambience and gill flutters, the slide, a reversed whoosh for the rewind, and the slip
  and poke. One water rush when the head clears, then swim strokes and the close whoosh of the tail past the lens,
  which runs into the opening.

## Kinematic verification (every frame, numerically)

These checks ran on `eelAt(t)` for all 744 frames.

| Check | Result |
|---|---|
| The tail leads | After the rewind, the tail tip's route coordinate never decreases. The only backward step is the last frame of the rewind itself. |
| The head releases once | The head crosses the exit exactly once, at 20.80 s. |
| The exit is the gill opening | The outside body is always rooted at the gill exit on the cover's rear edge: 0 mismatches. |
| One connected animal | Neighbouring body samples are at most 0.80 u apart; the body radius is about 1.2 u. |

## Review rounds

There were two rounds of independent review. Each finding was checked by an adversarial verifier from the frames
before it was acted on. Round two also re-checked round one's fixes.

**Round 1 (V1), four lenses:** muted story, phone size, continuity, art. Confirmed problems, all fixed in V2:
- "Backing up" was the weakest movement.
- The opening tail tip touched the right edge.
- In the head-caught shot, the predator's eye was clipped and the eel's body ran out of frame.
- In the swim-away, the head bobbed at the frame edge.
- The cutaway closed into a stray speck.
- During the reveal:
  - the eel was cut in two at the gill exit;
  - the holes showed teal water;
  - the fins turned khaki.
- The gill arches snapped between looks.
- The lens tail went out and came back.
- Blank caption frames at caption changes.
- A squared-off caudal peduncle.

**Round 2 (V2), regression and fresh lenses:** confirmed problems, all fixed in V3:
- At the loop wipe, the end camera differed from frame 0's, so two predators showed for a few frames. Fixed by
  settling on the opening camera before the sweep.
- The camera followed the swimmer, pushing the predator's head out of frame, then panned back. Now one smooth move,
  and the eel leaves on its own.
- The lens tail read as a straight pole. It is now the tapering rear third, with its tip, an S-flex and less blur.
- The reveal holes showed a milky patch. The frosted interior now darkens rather than lightens.

**Final gate (pre-delivery, on the V3 candidate), with an adversarial check of every failure.**

- **Passed:**
  - the tail leads the whole escape;
  - the head releases once and comes out last;
  - the eel exits through the gill opening;
  - frame 0 reads at phone size (the tail is not a fin; the cover beats once while the tail flexes the other way);
  - the loop shows one predator and flows into frame 0;
  - the captions never cover the gill opening and never blank.
- **Confirmed and fixed in the delivered file:**
  - Just after the release, the swimmer's tail flopped back onto the predator's back for about 0.6 s, so the eel
    looked stuck in the fish. The swimmer now stays above the fish.
  - The camera stopped and reversed during the swim-away. It now makes one move.
- **Refuted by the verifier (planned or not noticeable):**
  - the head out of frame during the slit close-up (the same stage then widens to show head, slit, exit and tail
    together);
  - a faint frosted sheen in the reveal.

## Known limits (honest list)

1. **Not watched or heard in real time by me.** This environment has no display or speakers. Picture, timing and sound
   were checked from frames, frame-difference measurements, ASR, loudness measurements and spectrograms. A phone
   check is the last step before upload.
2. **The three-quarter cutaway is a restrained 14° yaw** on layered 2D art. It reads as a cutaway into the gills
   with depth layering (behind and in front of the arches, under the cover strip), not as a strongly turned 3D
   view. At 22° the flat layers visibly separated.
3. **Stylisation.**
   - The escape is compressed: about a minute in the study, about 16 s here.
   - The eel is drawn about half the predator's length and slightly thicker than life.
   - The route is idealised.
   - The rewind and the lens sweep are editorial devices.
4. **The X-ray is an illustration** in the channel style, not the study's footage.
5. **The voice is about −17 LUFS mono** (−14 LUFS for the stereo file), following the channel's recent mixes,
   rather than −16 mono.

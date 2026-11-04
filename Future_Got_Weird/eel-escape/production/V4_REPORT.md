# Eel Escape V4: review cut report

**Deliverable:** `exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4`

- **Video:** H.264, 1080 × 1920, 30 fps, 744 frames, 24.80 s, CRF 16, yuv420p, BT.709.
- **Audio:** AAC 48 kHz stereo (about 258 kb/s as encoded).
- **Narration:** the locked master, unchanged, sample-aligned. The words are identical to V3.

**What changed from V3:** a new shot sequence, with new settings and perspectives and new drawings throughout. V3
reframed one side-profile fish. V4 draws one 3D predator and one 3D water world through a camera per shot, and adds
new interior sets.

**Evidence:** `qa/v4/`.

## The shot sequence

| # | Time (s) | Words | Setting and perspective | What the viewer sees |
|---|---|---|---|---|
| S1 | 0–2.62 | "That tail sticking out of this fish / belongs to the eel" | Rear three-quarter, just behind the predator's cheek | The eye, the gill cover and some body. A substantial length (22 of 54 units) of slate-blue tail slides out from under the cover's edge along the skin and hangs in a loose S, its ribbon fin showing as a fringe along it and round the tip. On the first beat the cover breathes once (peak 0.20 s) while the tail flicks independently across it (0.24 s). On "belongs" the camera follows the tail to the gill edge; a breath lifts the cover (2.15 s) and the same body shows continuing inside. |
| S2 | 2.62–3.84 | "it just swallowed." | Side view of the earlier gulp (a slightly drained, warm flashback grade) | The cut matches the eel's curve: S1's body entering the gill gap becomes the same on-screen curve entering the open mouth. The tail is sucked in (tail last), the mouth shuts (3.18 s) and the eel is gone. |
| S3 | 3.84–5.78 | "Scientists filmed it on X-ray." | A research tank in a dark lab, with an X-ray field between an emitter and a detector | The fish swims into the field; at the field edge (3.96 s) it turns into a radiograph. Its full skeletal profile (4.94 s) shows the glowing eel coiled in the stomach, skull and eye ring deepest, fine tail toward the throat. The camera pushes in following the moving tail. |
| S4 | 5.78–8.90 | "Inside the fish's stomach, / the eel starts backing up." | A newly drawn stomach interior: close folded walls, a curved chamber | The carried tail dissolves into the chamber. The coil lies in the foreground with the head and eye in view. From 7.22 s the tail tip slides up the wall, bumps a fold (7.45 s), turns and searches, reaches the puckered opening and presses it; the opening yields (8.2 s). The camera dives after the tip (the closest push) into the dark. |
| S5 | 8.90–10.42 | "Its tail slides up the fish's throat," | Inside the narrow esophagus, alongside the tail | Out of the dark, the folded passage. The fine tapered tip slides up the wall (its screen travel about 400 px over 9.0–9.9 s); the body follows close alongside. One eel of steady width and direction is carried across the change of view (about 1° of turn per frame, no swelling or snap). |
| S6 | 10.42–12.70 | "slips through a gap in the gills," | A new angle from inside the pharynx toward the gill arches | Arch bars with rakers and red filaments. The tail turns sideways and threads a real slit between two arches: over arch 3, behind arch 4's bar (11.20–11.33 s) and out the far side, the closest framing at 11.40 s. Beyond the arches the gill opening is a slit of daylight: water, light shafts and reeds outside, the cover's free edge a thin dark flap against it, light streaming into the dark chamber. The tail picks up a rim light as it nears it; the tip crosses the edge at 12.58 s and is seen inside the bright slit for 0.12 s before the cut. No round window. |
| S7 | 12.70–13.86 | "and pokes out the side." | Outside, low at the gill edge | A match cut: the same tip, same screen point, direction and speed (1 px off the contract at the cut), now breaking out over the gill cover's edge into open water with a small puff of bubbles. The tail rises out of the slit in an arch and curves back over the fish. The camera pulls back; the predator's eye is in frame from about 13.05 s. |
| S8 | 13.86–15.96 | "Then the rest of its body follows." | Opening near level, rising to a slightly elevated view over the predator's back | The shot opens on the same arch S7 ends on. A growing length slides out of the top of the slit (the same exit point as S7 and S9) and bows back along the upper flank into the current; the body inside the slit stays in shadow. |
| S9 | 15.96–17.96 | "Its head comes out last." | Tight at the gill edge, from a little above | The caught head lies side-on in the propped-open slit, in shadow, its eye toward us, just inside; the neck bends round the cover's edge in one smooth curve and the rest of the body lies back along the flank and begins to curl, in one composition. |
| S10 | 17.96–21.30 | "The eel curls up outside the fish, / gives one final pull," | Low beside the fish | The outside body is a loose loop in front of us, behind the slit; the caught head and its eye stay in view in the slit. The loop tightens while the head tugs at the edge; the camera holds close through the pull. The head is seen sliding out of the slit (its eye in view throughout) and clears once (20.97 s, in "pull"); for about 10 frames the freed head rises clear while the loop opens, the camera easing down to keep it all under the captions. The predator breathes, startles and watches. |
| S11 | 21.30–24.30 | "and swims away / from the animal that just ate it." | A cut on "and swims away" to a tracking view from above and outside the eel, through the reeds | The head and eye lead; the eel swims off and clear water opens between it and the predator, which recedes behind. The reeds are fixed for the shot (none fade). |
| S12 | 24.30–24.80 | — | A reed close to the lens | It wipes right to left and reveals frame 0 (the gill edge and the tail). |

## How it was built

**Shared core** (`source/src/v4/`):

- `three.ts`: the 3D camera in the predator's own frame.
- `eelV4.tsx`: the V4 eel. It has a broader head with a neck behind it, an eye 1.45× the V3 size, and a long, narrow tapered tail. It is drawn the same way in 2D sets and through 3D cameras.
- `escape.ts`: the one outside eel.
  - Rooted at the gill exit, with its length outside never decreasing (the tail leads).
  - Then a bow into the current, the curl, and the tightening.
  - A single release, after which it straightens about mid-body and follows its own head's path.
- `timing.ts`: the shot windows and the three screen-space hand-off contracts. They are the carried tail (S3 → S4), the tip crossing the edge (S6 → S7: the crossing at 12.58 s, the cut at 12.70 s, both shots drawing the same tail over 12.44–12.72 s) and the dark lumen (S4 → S5).

**Modules:**

| Module | What it draws |
|---|---|
| `art/pred3d.tsx` | The predator as one 3D model: lofted body, smooth cel bands, markings fixed to the skin, a gill cover that lifts, an opening mouth, rayed fins. Its side view matches V3's art. |
| `art/world3d.tsx` | The water, the riverbed, rocks and swaying reeds in 3D; motes; the predator's shadow; the reed wipe. |
| `shots/S3Xray.tsx` | The X-ray tank. |
| `shots/S4Stomach.tsx` | The stomach. |
| `shots/S5Throat.tsx` | The throat and the gills. |
| `shots/Exterior.tsx` | S1, S2, S7–S12. |

**The film:** `FilmV4.tsx`, composition `EelEscapeV4`.

**Sound:** `tools/v4/make_audio_v4.py`, from `audio/cues_v4.json`, exported from the shots.

- Each setting has its own air: open water, the tank, and inside the fish.
- Three accents: the gulp, the change into the X-ray view, and the release.
- Small cues: the flick, the probe and yield, the slips, the poke and the strokes.

## Measurements

All measured on the exported file or on the shot code, every frame. The files are in `qa/v4/`.

| Check | Result | File |
|---|---|---|
| Decode | 744 frames, 24.80 s, 1080 × 1920, 30 fps, no decode errors | `render_qa.json` |
| Motion | Median frame-to-frame change 4.03. The longest near-static run is 7 frames (0.23 s, at 13.53 s). Every large change is a planned cut (including the match cut at 12.70 s and the S10 → S11 cut at 21.20 s), dissolve or wipe, or one of the deliberate camera moves into a discovery (the X-ray push-in, the dive into the stomach opening, the passage out of the dark, the push into the gill gap). No unplanned jumps. | `render_qa.json` |
| Loop seam | Last frame against frame 0: mean change 3.83, about the film's own median frame step. | `render_qa.json`, `loop_seam_last3_first3.png` |
| Narration | Two independent recognisers (Zipformer, Whisper) on the exported audio: WER 0.0 on both, word for word. | `final_asr.json` |
| Mix | −14.0 LUFS integrated, −1.6 dBTP. The narration sits at sample offset 0. Effects average 18.0 dB under the voice. 42 placed events; the poke sound lands on the S6 → S7 cut (12.71 s), the release accents on the head clearing (20.95 s). | `audio/mix/mix_measure_mix_v4.json`, `audio/sfx_log_mix_v4.json` |
| Tail leads | The length outside never decreases (0 drops). The body stays connected (largest sample gap 0.55 u, at the rounded bend; the spacing is 0.45 u). | `kinematics.json` |
| Head clears once | One crossing, at 20.967 s ("pull," runs 20.82–21.10 s). The head slides out over about 12 frames before it. | `kinematics.json` |
| Real distance | After the release the eel is inside the predator on 0 frames. Mid-body distance from the gill exit: 17.1 u at release, 31.3 u at 22 s, 147.1 u at the end (the eel is 54 u long). | `kinematics.json` |
| Face clear | From the release to 1.6 s after, the eel never enters the caption band. It touches the predator's face on 3 frames. On two of them only 1 of its 121 samples touches. On the third (f638, the last frame before the cut) the head reaches the predator's eye at the frame edge. In the overhead view the tail end clears the fish by the second frame after the cut. | `tools/v4/face_clear.ts` |
| Captions | Captions sit in the top band. With a caption up, the eel and the gill gap stay below the keep-out line on every frame. The tightest margin is 34 px (S10, the rising tail, 20.60 s). | `caption_keepout.txt` |

## Muted phone-size review

Each round watched the full render muted at phone size (360 × 640 contact sheets of every third frame, caption-free and captioned, plus the full-size frames). Rounds 4–8 had the same structure:

- **Regression checkers:** they re-checked each earlier confirmed problem in the new frames.
- **A fresh first-time viewer:** they worked from the caption-free pictures alone, answered the director's four questions and noted anything that needed a caption.
- **A finishing supervisor:** they did a craft pass.
- **Two adversarial verifiers per serious finding:** they tried to refute it. A finding counted as confirmed unless both refuted it.

Every confirmed finding was fixed before the next render.

| Round | What it found (confirmed) | What changed |
|---|---|---|
| 1–3 | The opening tail read as a fin; the caught head and its eye did not read; the escape had seams at the gill edge (cut ends, ghosts); the swim did not separate from the predator | The body passes under the gill cover's edge through feathered inside and outside masks; the caught head props the cover open, its eye just inside; the curl, the unroll and the swim were re-staged; S5/S6 rebuilt (builder G) |
| 4 | 14 of 15 (no blockers): hooks and stubs at the gill; the S9 eye read as a pipe end; the release head hidden behind its loop; the swim undone by a cut | The gill-crossing renderer was rewritten (a cover mask); S1, S9, S10 and S11 re-staged; S5/S6 rebuilt again |
| 5 | 7 of 7: a pop at S10 → S11; the tail across the predator's face; the head beat did not land; frame one did not say "tail"; the exit route jumped; a cut-end at the slit; beaded fins | S10/S11 made one take; the caught head shaded and straining; the camera pushes in for the pull; the opening tail redrawn |
| 6 | 5 of 7: a 90° elbow where the eel leaves the slit; the exit point jumped between S7, S8 and S9; the head looked "already out" and its release took 3 frames; the swim crossed the face; a fin strip forked over the cover in S1; the tail swelled through the S5 → S6 dissolve | A rounded bend at the gill edge, drawn in one layer; S8 lowered; the head slides out over about 12 frames, clearing on "pull"; a cut to the overhead view (no swing past the face); an even fin edge; S5/S6 redrawn (builder G) |
| 7 | 3 of 4: S8 turned S7's arch into an L; the caught head was a 5 px dot during the curl; the eye vanished behind the cover and popped back during the release | S8 opens on S7's arch; the head is seen sliding out; a larger eye in the slit; a closer curl; about 10 frames on the freed head |
| 8 | (final round: below) | |

**The four questions, as the fresh viewer answered them:**

| | Round 4 | Round 5 | Round 6 | Round 7 |
|---|---|---|---|---|
| 1. The tail in frame one | Partly (a separate animal, not a fin) | Partly | Partly | Mostly yes: not a fin, "the tail end of something long and thin"; that it is an eel comes from the caption |
| 2. Out of the stomach | Mostly yes | Yes | Yes | Yes, continuous on screen from the X-ray to the gills |
| 3. Where it exits | Yes, once the eye enters | Partly (the opening read as a solid crescent) | Yes | Yes, from the picture alone |
| 4. The head comes free | No | Only if you watch closely | Only just | Only just (too quick, and the eye vanished): fixed for round 8 |

## Known limits

(filled in)

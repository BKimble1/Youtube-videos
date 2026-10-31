# Myostatin V2: revision report

**File.** `exports/FGW_Myostatin_V2_REVIEW_1080x1920.mp4`. **It is not published.** The source is composition
`MyostatinV2` and mix `mix_v2`. V1 is reproducible at commit `80637db`.

**Narration.** The same approved master as V1, word for word, with the same timings (`audio/narration/FGW_Myostatin_narration_V1.wav`).
Nothing was regenerated or re-edited.

## Measured (from the rendered file)

| Check | V2 | V1 |
|---|---|---|
| Format | 1080×1920, 30 fps, 737 frames, 24.567 s, H.264 + AAC 48 kHz | same |
| Decode errors | none | none |
| Unplanned single-frame jumps | none | none |
| Longest near-static run | 5 frames (0.17 s) | 10 frames |
| Time inside the muscle (hook dive to return) | 3.30–7.38 s (4.1 s, including the dive and the return); plus 0.7 s of drug micro | 2.3–8.4 s and 12.0–14.9 s |
| Loop seam, last frame vs frame 0 (mean abs. difference) | 21.5 | 34.4 |
| Narration in the final file (Whisper base.en) | the locked text; homophones only (brake/break, superhuman/super human) | same |
| Loudness | −14.0 LUFS, −1.6 dBTP; effects and music about 10 dB under the voice in every section | −13.9 LUFS |

Evidence: `qa/v2/render_qa.json`, `qa/v2/final_asr.json`, `qa/v2/mix_measure_mix_v2.json`,
`qa/v2/contact_every_0.5s.png`, `qa/v2/hook_0-2.5s_every_3rd_frame.png` and `qa/v2/loop_seam_last3_first3.png`.

## What changed, by priority

**1. The bodybuilder's face.** The head is redrawn as one fixed three-quarter design, turned toward screen right.
- Both eyes sit inside the face. The far eye is foreshortened beside the bridge of the nose, and its outer edge stays inside the far cheek contour.
- The nose tip stays inside the silhouette, and the ear is on the near side.
- The brows, eyes and mouth are attached to the face plane. They only lift, open or close; they never slide or rotate on their own.
- The head turns and tilts only as one rigid piece, and the pupils move inside the eyes.
- The torso is turned three-quarters to match: chest and both pecs toward the camera, the far shoulder and the far arm visible.
- The hair, skin, clothing and identity are the same in every shot.

**2. The opening (0–3.4 s).**
- Frame 0 is the bodybuilder already flexing, in a medium three-quarter shot with the face visible.
- The camera is already moving in frame 0: an ease-out start, no static pose and no slow drift.
- The biceps swells immediately: mass rises from 0.34 to 0.54 in the first half-second, then surges on "protein", "WAY" and "bigger".
- The sleeve tightens: the hem rides up, tension folds form, the seam stitches stretch apart, and stitches pop on the two big surges. The sleeve holds, so the loop seam stays clean.
- He reacts: a confident smirk, then wide-eyed shock as it surges, then awe.

**3. The microscopic explanation, compressed.**
- At 3.3 s the camera pushes through a clean cutaway in the expanding biceps.
- New myofibrils zip in.
- Myostatin docks on "myostatin", a signal runs to the nucleus, and growth stops on "brake".
- At 6.5 s the camera pulls straight back out to the visibly enlarged biceps.
- The V1 bull micro, the collagen sheets and the second micro-to-lab passage are gone.

**4. The Belgian Blue.**
- It was redrawn from scratch as a compact, double-muscled bull, about 74% of V1's body length, with every signature bulge in the silhouette:
  - the withers hump, and the dip behind it;
  - the loin bulge;
  - the high tail head;
  - the rear round swelling past the tail with a crease, down toward the hock;
  - a thick neck into the dewlap.
- The muscle panels are mapped and bounded by anatomical creases: shoulder and triceps, loin, gluteal, quadriceps, biceps femoris and semitendinosus. Each is pillow-shaded.
- The coat is blue roan, the head is broad with horns and side ears, and the forearms and gaskins are thick above fine cannons and cloven hooves.
- **The transition is spatially motivated.**
  - The enlarged biceps turns translucent, showing its muscle.
  - A match cut on "animals" lands on the bull's shoulder and neck muscles in the same translucent view.
  - The hide fills back in as the camera pulls out to the whole bull.
- The camera then glides back to the rear. The far-side round appears behind the near one (a three-quarter-rear cue), and the bull takes one heavy step on "huge".
- The V1 silhouette-comparison overlay was removed. This brief asks for an impressive reveal, and the overlay read as a diagram.

**5. The ending.**
- One controlled curl runs through the twist and the ending:
  - the grip on "weird";
  - the curl on "Bigger muscles": the huge biceps contracts, and the forearm rises about 25° (the plates leave the floor), trembling;
  - inside the elbow, the muscle bulges and its fascicles fire, but the radius barely turns;
  - on "superhuman" the camera pushes in on the strained face and the huge arm;
  - on "without actually being super strong" the arm gives out, and the dumbbell sinks back and settles.
- He lets go and flexes. The camera arrives at frame 0's exact framing with the same pose, expression and head tilt, and the same inward speed the opening starts with.
- The only difference at the seam is the arm's mass, which is how the transformation restarts.

## Kept as before

- The science framing: myostatin as a dimer on activin type IIB receptors, and antibodies blocking it in a dish.
- The human arm on "in humans" is shown as a translucent visualisation, not a patient.
- Nothing claims unlimited or guaranteed growth in people.

## Known weaknesses (for the reviewer)

- **The bull is much improved but still stylised.** It reads as a heavily muscled blue-roan bull. Its head is the least convincing part; at phone size it can still read slightly goat-like.
- **The bull's anatomical view (about 0.5 s after the match cut) is a graphic muscle map**, not true bovine anatomy.
- **The seated wide shots are small for the face.** The face reads well in the pushed-in struggle (20–23 s), less so at 16–17.5 s.
- **No one has listened to it in real time.** This environment has no audio playback; it was checked by measurement and ASR only.

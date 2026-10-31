# Myostatin V1: review report

**File.** `exports/FGW_Myostatin_V1_REVIEW_1080x1920.mp4`. **It is not published.**

## Measured (from the rendered file)

| Check | Result | Evidence |
|---|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p, 737 frames, 24.567 s; AAC 48 kHz stereo, 317 kb/s; 21.9 MB | `qa/v1/render_qa.json` |
| Full decode | no errors | `qa/v1/render_qa.json` |
| Narration in the final file | Whisper base.en: the locked text, differing only on "brake → break" (homophone). Zipformer: the same, plus its own spellings of "myostatin" and "super strong". | `qa/v1/final_asr.json` |
| Loudness | −13.9 LUFS integrated, −1.6 dBTP true peak (4× oversampled) | `qa/v1/mix_measure_mix_v1.json` |
| Voice against everything else | Effects, beds and music sit about 10 dB under the voice in every section | measured from the stems |
| Single-frame jumps | No unplanned large frame-to-frame change. The large changes all fall inside the listed transitions: dives, pull-outs, the collagen sheets, and the deliberate cut on "in humans". | `qa/v1/render_qa.json` |
| Static holds | Longest near-static run: 10 frames (0.33 s). The brief's limit is 1 s. | `qa/v1/render_qa.json` |
| Loop seam | The same camera, pose and background in the last frame and frame 0. The muscle resets to its starting size: the transformation begins again. | `qa/v1/loop_seam_last3_first3.png` |

Sheets: `qa/v1/contact_every_0.5s.png` (the whole film) and `qa/v1/hook_0-2.5s_every_3rd_frame.png`.

## The final QC list from the brief

1. **Muscle growth in the first frame.** Yes. Frame 0 is a close-up of an ordinary flexed arm whose mass is already rising: m = 0.08 in frame 0, 0.46 at 0.3 s, 1.0 at 1.0 s. The camera eases back so the sleeve comes into view.
2. **The sleeve tear within the first second.** Yes. The stitched seam pops at 0.60 s, with stitch threads flying off. It splits into a wide V by 1.0 s, with skin and stretched threads visible through it.
3. **Shocking without looking glitchy.** The swelling is continuous; there are no pops or resets. The shape is a smooth profile around a fixed skeleton.
4. **The mechanism without labels.** No text labels, bubbles or radial diagrams. The sequence:
   - new myofibrils zip into the fibre and its membrane rises ("WAY bigger");
   - magenta two-lobed dimers dock in the cobalt receptors;
   - amber signals run inward to the nucleus;
   - the nucleus goes dark, assembly stops and the building blocks stop arriving ("brake on muscle growth").
5. **A dramatic Belgian Blue reveal.** The camera pulls out from fibres with empty receptors, through a hide cutaway, to the whole bull. A white ordinary-bovine outline, drawn in exact registration, then shows the extra muscle region by region: shoulder, back, hindquarters. The bull itself never changes shape. One heavy step contracts the shoulder, with a hoof plant, dust and a camera bump.
6. **Believable anatomical movement.**
   - The humerus, elbow and shoulder joint are fixed in the rig; only the soft-tissue profiles grow.
   - The curl lifts the weight about 3 cm by a shrug and a little elbow flexion.
   - The elbow cutaway shows the biceps tapering into its tendon on the radial tuberosity, with the brachialis, triceps, humerus, radius and ulna.
7. **No unnecessary pauses or static shots.** See the measurement above.
8. **A clear strength twist.**
   - A cold dim and an eerie cue on "weird".
   - Strain (gritted teeth, sweat) as the biceps contracts hard; the plates barely leave the floor (the contact shadow opens), trembling.
   - Surprise on "Bigger".
   - Inside the elbow: the huge biceps pulses and its fascicles light up, but the radius barely turns. The dumbbell settles back with a clunk.
9. **A natural loop.**
   - The final push lands on frame 0's exact framing (`LOOP_CAM`).
   - The torn sleeve is out of frame in both, and the audio swell into the loop is the same swell that opens the film.
   - The music's period divides the length exactly (40 beats at 97.69 BPM).
   - There is no subscribe card, outro or logo.
10. **The approved script.** Verbatim. The only edit is that seven silent sentence gaps were shortened (1.59 s in all). See `audio/narration/voice_provenance.json`.

## Where V1 departs from the brief, and why

- **Shot timings follow the measured audio, as the brief asks.** The narration master is 24.57 s and its words land later than the brief's shot table assumed. So:
  - the brake runs 2.3–7.4 s, ending on "growth";
  - the bull runs 7.4–12.3 s, starting on "But some animals";
  - the lab runs 12.0–14.9 s;
  - the twist runs 15.9–19.8 s;
  - the payoff runs 19.8 s to the end.
- **The "blocked" step of shot 2.** It is shown in the bull's fibres ("born without that brake": empty receptors, and the fibre swells fast). The drug version is shown in shot 4. This avoids staging the same demonstration twice in 8 seconds.
- **The silhouette comparison is an outline overlay in registration**, not a second animal and not a morph. This follows "do not imply the bull suddenly transforms".
- **From the bull into the lab.** The camera passes into the bull's shoulder fibres, then through a collagen sheet (a deliberate match), then out into a dish of cultured muscle in the lab. A Belgian Blue has no working myostatin to block, so the drug demonstration must not be in the bull's own tissue.
- **The human application.** A deliberate cut on "in" goes to a translucent, anatomical view of the same character's arm, with its fibre bundles thickening step by step. It is a visualisation, not a patient, and nothing is injected.
- **The loop is a composition match, not a frame-exact match.** The muscle cannot be both normal (frame 0) and enormous (the end). The last frame and frame 0 share the camera, pose, background and lighting, so the restart reads as the transformation beginning again.
- **Captions.** The channel's caption treatment (Nunito Black, yellow key words) is kept, as in every previous FGW Short. These are subtitles, not explanatory labels.

## Known weaknesses (for the reviewer)

- **The benchmarks.**
  - Neither the Cyborg Cockroach V5 nor the Dead Spider V6 Short is in this repository or any repository this session can reach.
  - So V1 was matched against the most recent Shorts here instead: Zombie Snail V3/V4 and Zombie Ant.
  - Zombie Ant's notes say its drawing core came from Dead Spider.
- **The bull** is the weakest drawing. It reads as a heavily muscled, blue-roan, double-rounded bovine. Its head and legs are still simpler than the character work, and on a phone a reviewer may want a broader, lower head and heavier forearms.
- **The researcher** is on screen for only about 0.6 s. The pipetting hand is simple.
- **The micro views** are flat, layered 2D, with no parallax inside the muscle world. Depth comes from shading, the dark veil over neighbouring fibres, and drifting motes.
- **No one has listened to it in real time**, since this environment has no audio playback. The mix was checked by measurement and by ASR of the final file only.

## Science (kept to what the narration says)

- **Myostatin.**
  - GDF-8, a TGF-β family growth factor made by muscle.
  - Drawn as its mature dimer, binding activin type IIB receptors on the fibre membrane.
  - The signal runs inward to the nucleus, and myofibril assembly (hypertrophy) slows.
- **The animals.** Belgian Blue cattle carry a natural loss-of-function mutation in the myostatin gene (MSTN) and are "double-muscled". This is shown as a fixed trait of the animal, never a transformation.
- **The drugs.**
  - Antibodies (and decoy receptors) that neutralise myostatin, or block its receptor, have been tested in people.
  - They are drawn as Y-shaped antibodies catching free dimers, so the receptors stay empty.
  - The human arm is explicitly a visualisation. No instant transformation is shown on a real patient.
- **The twist.** Hypertrophy without proportional gains in force is the documented point: myostatin-null muscle shows lower force per cross-section. The tendon is shown intact; no tendon or bone injury is shown.

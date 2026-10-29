# Zombie Ant V1: production notes

## How it was made

- **Narration.** The locked script, word for word, in the channel narrator ("Test Voice", eleven_v4). One run of two
  takes; take 1 chosen on ASR. Only the long silent gaps between phrases were shortened (1.43 s in all), so the read is
  continuous. Details: `audio/narration/voice_provenance.json`.
- **Timing.** Every visual event is keyed to measured word times (`source/src/data/timeline.json`, used through
  `TM` in `source/src/world/story.ts`). Examples:
  - the jaws close on "bite";
  - the legs let go on "GO";
  - the last movement stops on "DIES";
  - the stalk bud appears on "STARTED";
  - the stalk is full grown on "HEAD";
  - the cushion opens on "opens";
  - a spore lands on an ant below on "BELOW";
  - the graveyard opens out from "there".
- **Picture.** Deterministic Remotion/SVG: one 3D ant rig (`source/src/ant/`) projected into the FGW vector finish
  (ink contours, upper-left key light), one forest world, one continuous camera. The perspective and drawing core is
  carried over from Dead Spider (`source/src/core/`).
  - Every ant shares the same rig: the hook's ant, the infected walker, the nine graveyard ants, and the loop ant.
  - Feet are planted by a tripod gait on whichever surface they reach: floor, stem or leaf underside.
- **Runway** was not used. The fungus geometry and its growth are drawn deterministically, as the brief requires; no
  generated surface texture was needed.
- **Sound.** All effects are synthesised and placed from the picture's own events (`audio/cues.json`, `audio/sfx_log.json`):
  - mandible clicks and leaf creaks;
  - the germ tube crackle, the network creep and the muscle spasms;
  - steps, growth creaks, cushion pops and spore puffs;
  - landing ticks;
  - a leaf brushing the lens.

  Under them sit a quiet forest bed and a low pad that darkens for the reveal. Mix: −14.1 LUFS integrated, −2.2 dBFS
  sample peak (decoded from the MP4).

## Story and transitions

| Time (s) | Outgoing → incoming | New information |
|---|---|---|
| 0.00–0.29 | (open) macro from below: open jaws rise to the midrib | first frame is the action |
| 0.28 | jaws clamp the vein; leaf dents and flexes; click | the bite |
| 0.44–0.92 | pull back: the whole ant swings down to hang, legs relax | it hangs from its jaws |
| 0.85–1.9 | round to the side; time-lapse (light flickers day/night): stalk from the back of the head, cushion forms | what will happen (preview) |
| 1.9–2.6 | onto the cushion; spores shot out; follow one, opening out | spores |
| 2.6–3.35 | the spore falls and lands on a walking ant | a new host |
| 3.35–4.6 | in on the spore; germ tube pierces the cuticle; the shell turns translucent locally | entry |
| 4.6–7.9 | out to the whole ant, x-ray: hyphae spread from the entry point, wrap the leg and mandible muscles; brain drawn intact; legs and jaws spasm on "MUSCLES" | the mechanism |
| 7.9–8.3 | x-ray closes back to the intact ant | |
| 8.2–10.4 | side tracking: compelled walk (sway, uneven rhythm) to the stem, climb, onto the leaf underside | the climb |
| 10.0–11.1 | in to the head from below: jaws open, swing part-way down, clamp the midrib; leaf flexes | the death grip |
| 11.4–13.0 | pull back: legs let go on "GO", the body drops to hang | |
| 13.2–14.8 | hold, slow push; colour dulls, last antenna twitch stops on "DIES" | death |
| 14.9–16.8 | round to the side, close on the neck: white mycelium from the joints; stalk bud on "STARTED" | the fungus starts |
| 17.1–21.1 | time-lapse (day/night): the camera follows the growing tip out to the whole stalk | the stalk |
| 21.3–22.6 | along to the cushion; its openings appear | it opens |
| 22.8–25.0 | spores puff out; follow one down to the ants below; it lands | the cycle repeats |
| 25.2–26.4 | rise back to the dead ant under its leaf | "beneath that one leaf" |
| 26.5–29.7 | pull back through the plants: other dead ants come into view, one after another (fresh, short stalk, full stalk, old) | the graveyard |
| 29.6–30.57 | push in and up toward a nearby leaf; an out-of-focus leaf crosses the lens; behind it is the opening composition | the loop |

There is no hard cut in the film. A frame-difference scan of the MP4 finds no single-frame jumps. The largest changes
are the lens-leaf passage at 30.1–30.4 s, and continuous fast moves whose neighbouring frames change by similar amounts.

## Science (kept to what the narration says)

- **Host.** A carpenter ant (*Camponotus*), the usual host of *Ophiocordyceps unilateralis* s.l.
- **Infection.** The spore attaches to the cuticle, and a germ tube enters the body.
- **Control.** Fungal cells form a network around the muscle fibres, including the large mandible muscles in the head.
  The brain is not invaded, and it is drawn intact (Hughes et al. 2011; Fredericksen et al. 2017, PNAS).
- **The death grip.** The ant leaves the floor, climbs, and bites the main vein on the underside of a leaf. It dies
  hanging there, tethered by mycelium from its joints.
- **The stalk.** A single stalk grows from the back of the head over days. It is dark at the base and pale at the
  young tip. A lateral cushion (the ascoma) forms partway along it. From its perithecia, long thin ascospores are
  shot out and fall onto the floor below.
- **The graveyard.** Several dead ants under leaves of the same patch, at different stages. Only that patch is shown,
  so the film does not imply every ant in the forest.
- **Stylisation.**
  - Spores are drawn larger than life (with a faint halo) so one can be followed.
  - The plant is lower than the real ~25 cm, to keep the fall framable.

## QA done on the rendered files

- **ffprobe.** 1080×1920, 30/1 fps, 917 frames, 30.571 s, yuv420p H.264 plus AAC 48 kHz stereo. Hook review: 120
  frames, 4.01 s.
- **Narration.** ASR on the MP4's own audio: Zipformer differs only in spelling ("zomby", "spoors on to"). Whisper
  base.en reads the final phrase correctly when it is transcribed on its own.
- **Captions.** Generated from the same measured word times as the picture; each one sits at a fixed height chosen
  per shot (`qa/review/caption_placement.png`).
- **Loop.** The last frame is the opening composition, with a copy of the opening's set and the same camera geometry
  (`qa/review/loop_first_vs_last.jpg`). The seam's mean frame difference is 6.2, against 3.1 for the opening's own
  first frame steps.
- **Anatomy.** Six legs (coxa, femur, tibia, tarsus), two elbowed antennae, toothed mandibles, a three-part
  mesosoma, petiole and gaster on every ant. Checked on contact sheets at each phase.

## Open issues (honest list)

- **Not watched or heard in real time.** Timing, levels and readability were checked from frames, measurements and
  ASR only.
- **The death hold is fairly static.** 13.2–14.8 s has only a slow push, a dulling of colour and the last twitch. It
  is meant to let the death register, but it is the quietest stretch.
- **Some reactions are subtle at phone size.** The leaf's response to the bite (dent and flex) and the muscle spasms
  read better at normal speed than in stills.
- **The graveyard plants are simplified.** They are thin seedling stems and twigs hanging from above; the far
  understory is a soft blurred layer.
- **The lens leaf covers the frame for about five frames** at 30.2–30.4 s. It is a physical wipe, not a black frame.
- **Some captions sit over the gaster**, never over the head, the jaws or the stalk.
- **The runtime is 30.6 s**, a little over the 26–30 s target. It follows the natural narration (30.16 s of speech)
  plus the loop push.

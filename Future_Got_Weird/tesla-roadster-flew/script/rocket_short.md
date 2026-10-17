# Rocket Short: "The Problem With Tesla's Rocket Car" (34.27 s, 9:16, 30 fps)

Export: `exports/FGW_Rocket_Short_FINAL.mp4` (Git-ignored). Rebuild everything with `bash tools/render_rocket.sh`
(composition `RocketShort`, `source/src/rocket/`). Upload captions: `captions/FGW_Rocket_Short_FINAL.srt`. Upload text and
the Related Video steps: `upload/UPLOAD_TEXT_ROCKET.md`. QA: `QA_REPORT.md` ("Rocket Short"). Sources per line:
`research/claim_ledger.md` ("Rocket Short: claim-to-source note"). Clips: `footage/CLIP_LEDGER.md` ("Rocket Short").

A follow-up to "Tesla's Flying Roadster Isn't What You Think": the engineering trade-offs behind cold-gas thrust on a car.
It is not a recap, a disaster story or a prediction. The original title idea, "...Break The Law Of Physics", is answered
in the script ("None of this breaks physics.") instead of being asserted.

## Narration (as recorded)

> This Tesla can jump. But rocket thrust comes with a catch. These jets blast compressed air. Every burst uses some up.
> Keeping a car airborne on thrust means pushing against its entire weight. Bigger tanks can buy more time, but add weight
> and need protection. Then comes balance. Thrust that misses the center of mass can make it rotate. Other thrusters can
> correct that, but those corrections use air too. And fire a jet near loose gravel? That blast can send debris flying.
> None of this breaks physics. It gives a sports car spacecraft problems. Full Roadster breakdown in the linked video.

The brief's default script, unchanged (102 words).

- **Voice.** Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, `[excited] [quickly]`, `[dryly]` on "It gives a sports car
  spacecraft problems." Four takes are in `audio/rocket/takes/` (ElevenLabs flow `8baHNxGa4ViVC2FKXh4s`). The pick is
  `r_t1_IyNt`. Of the two fastest takes it has the widest pitch movement (14.1 semitones), and it has a beat before
  "problems" for the dry line.
- **Edit.** Pauses are tightened only (`tools/tighten_rocket.py`): sentence gaps go to 0.27 s and short gaps to at most
  0.15 s. There is no time-stretch and no pitch change. The sentences are then placed on the timeline
  (`tools/build_rocket_narration.py`), with five small extra beats where the picture needs one:
  - after "catch." +0.12 s (the match into the drawing);
  - after "protection." +0.20 s (the frame closes);
  - after "too." +0.25 s (the correction settles);
  - after "flying." +0.20 s (the dust wipe);
  - after "problems." +0.15 s (the touchdown).
- **Pace.** 181 wpm over 33.8 s of speech. The voice starts at 0.14 s and ends at 33.96 s, and the film ends 0.3 s later.
- **Wording check.** The placed narration was uploaded as plain audio (`audio/rocket/verify/narration_placed.mp3`) and
  transcribed independently with Scribe. All 102 words match the script. The only difference is a comma after "jump".
  These timings drive the animation and captions (`audio/rocket/scribe/placed_verify.json`): the take's own alignment had
  drifted up to 0.3 s late at some sentence ends. The final mixed soundtrack transcribes the same way
  (`audio/rocket/verify/final_mix.mp3`).

## Timeline

| Time (s) | Words | Picture | Source |
|---|---|---|---|
| 0.00–2.96 | "This Tesla can jump. But rocket thrust comes with a" | **Real**, one continuous camera at its own speed: the Roadster climbing on two jets above the parked Teslas and the Semi, rolling inverted with jets firing, rolling back upright. One small label: "TESLA ROADSTER DEMO · OCT 15, 2026 / flight listed for the Rocket version only, per Tesla". The crop follows the car (measured every 0.25 s) | `rec_224911` 0:35.25 → 0:38.21 |
| 2.96–3.46 | "catch." | Still real: upright on four downward jets. Blue flow chevrons and a down arrow sit on the two visible jet pairs. An air release and a low hit play. A saffron outline draws onto the car (3.34) | → 0:38.71 |
| 3.46–3.95 | — | **Match**: the drawn Roadster replaces the real car at the same place and size, still descending on its jets. The night becomes the illustrated dusk. One label for the whole schematic: "SIMPLIFIED SCHEMATIC · not Tesla's layout" | illustration |
| 3.78–5.98 | "These jets blast compressed air." | The lower side panel lifts off: a tank of gas (dots), a valve, a manifold, the two lift nozzles. A gas ribbon runs tank → valve → nozzle. Tags read "air tank", "valve", "nozzle". The jets brake the car to a hover (thrust a little above weight, then equal) | illustration |
| 5.98–7.70 | "Every burst uses some up." | The jets fire in bursts on "burst", "uses", "some", "up". Each burst takes dots out of the tank, with a valve click and a puff. Between bursts nothing pushes, so the car bobs a few units. The bursts average to its weight | illustration |
| 7.74–11.34 | "Keeping a car airborne… entire weight." | Pull back. WEIGHT points down from the floor and THRUST points up from the roof, on the same line, equal (marks on "entire weight"). The car holds height while dots keep leaving | illustration |
| 11.64–14.82 | "Bigger tanks can buy more time, but add weight and need protection." | Push toward the tank: it grows and holds more dots. On "add weight": a heavier wall and mounts, WEIGHT grows (a white ghost marks the old length), THRUST grows to match. On "protection": a frame closes around the tank. No impact, rupture or explosion | illustration |
| 15.38–16.52 | "Then comes balance." | The forces retract into a centre-of-mass marker on the body | illustration |
| 16.88–19.34 | "Thrust that misses the center of mass can make it rotate." | The rear lift jet runs stronger: the resultant push moves behind the centre. A dashed line of action and a coral lever arm are drawn. The car turns nose-down about the marker (red arrow), at most 6.7° | illustration |
| 19.66–22.68 | "Other thrusters can correct that, but those corrections use air too." | A small nose thruster pulses: the turn stops by "correct". A second nose pulse turns it back (teal arrow), and a tail pulse stops it level. Each pulse takes dots from the same tank, and the tank rim glows on "air" | illustration |
| 23.26–27.40 | "And fire a jet near loose gravel? That blast can send debris flying." | The panel closes and the car descends to a low hover. At ground level, the rear jet meets a patch of loose gravel ("loose surface"). The front jet only spreads air over the bare pad. On "blast" and "debris", gravel is thrown outward along the pad, a few pieces higher, and a dust cloud rolls toward the camera and wipes the frame | illustration |
| 27.40–33.47 | "None of this breaks physics. It gives a sports car spacecraft problems. Full Roadster breakdown…" | **Real**, from the air: the second ramp run rolling upright on its jets, with a roll arrow across the car; side plumes, with the small tank motif losing a few dots; jets down into smoke, with a dashed "clear area" ring. Touchdown at 31.60, just after "problems". The motifs resolve by 32.3. The CTA text cue "Full Roadster breakdown / in the linked video" appears at 31.87 | `rec_224730` 2:20.10 → 2:26.17 |
| 33.47–34.27 | "…in the linked video." | **Real**: the hop's side replay again, lifting off from the smoke. It runs straight into frame 0 (0:35.25), so the loop is one continuous shot. The CTA stays to the last frame | `rec_224911` 0:34.45 → 0:35.22 |

Real footage: 10.3 of 34.3 s (30%). That roughly follows the brief's own shot plan: no real shot shows a steady hover, a
tank, a lever arm or loose gravel, so those are illustrated, and the real car opens, anchors the match, returns and
closes the loop.

## Opening frame

Three 9:16 candidates from the actual footage were compared at phone size
(`qa/evidence/rocket_opening_candidates.jpg`):

- `rec_224911` 0:34.45, lift-off from the smoke;
- **0:35.25, climbing on two bright jets: chosen**: the whole car is large and recognizable, and the jets explain the
  motion at once;
- 0:38.30, upright on four jets: it clips the car's tail, and the match needs it later.

The first second: the car is in flight on its jets, with the parked cars below, and the narration starts at 0.14 s.

## Physics, as animated

- **Thrust and exhaust.** Thrust is always opposite the exhaust. Gas leaves the nozzles downward (blue), and the push is
  drawn upward (saffron).
- **Hover and other phases.**
  - Hover: THRUST equals WEIGHT, and the car holds height.
  - Braking from the footage's descent: thrust 1.13× weight.
  - Bursts: on 2.25× weight for 0.16 s, off for 0.20 s. They average to the weight.
  - Descent: below the weight, then above it, to stop.
  - The real hop is never said to need thrust through its whole arc.
- **Torque.** Torque follows the lever arm. The offset resultant behind the centre turns the car nose-down. Upward pulses
  at the nose turn it nose-up, and at the tail nose-down. The rotation is deliberately slow and small, so it can be read
  (not to scale). The thrust and weight arrows are hidden while the car is tilted, so no unbalanced sideways force is
  drawn.
- **Gas use.** The dots are illustrative. There is no gauge, no number and no linear "pressure" readout. A bigger tank
  holds more dots, and its added weight then needs more thrust (the arrows show it), so no proportional time gain is
  implied.
- **Fan suction.** Not shown anywhere. It is a separate system.
- **Cold gas.** Pale exhaust, no flame.
- **Gravel.** Only the loose patch is disturbed: the pad is intact and nobody is nearby. It is labelled "loose surface"
  and drawn as a schematic, not as an observed event.
- **Hardware.** The tank, valve, manifold and pitch thrusters are generic. The two lift-jet exits sit where the replay
  shows plumes, so the drawn jets continue the real ones through the match.

## Sound (`tools/make_bed_rocket.py`)

- **Score.** The channel's in-house score: the robots video's instruments, in D major at 104 BPM.
  - drone and marimba under the opening, a restrained low hit on "catch";
  - a pluck groove through the cutaway, a thinner marimba groove for balance, the darker groove into the dust;
  - the D-major resolution under the return, a soft hit and piano at the touchdown;
  - the last bars return to the opening's drone and ostinato, so the loop doesn't restart the music.
- **Effects** come only from visible actions:
  - a valve click before every burst;
  - gas only while a nozzle fires;
  - lighter clicks and puffs for the pitch thrusters;
  - mounts and the frame latch;
  - brief, small gravel ticks and the dust swell;
  - on the silent aerial: jets while plumes are visible, then the touchdown.
- **Mix.** The replay's own sound plays under the opening and the loop bridge. Music, effects and that sound duck under
  every word.

## Changes from the brief and why

1. **Length: 34.3 s** (the brief targets about 34–40). The default script at the requested pace fills 33.8 s, and the
   brief says not to stretch it.
2. **The 31–35 s return uses the second ramp run from the air**, not the hop. It shows the most satisfying controlled
   manoeuvre available: a roll upright on jets and a landing in smoke. "Spacecraft problems" sits on its final descent.
3. **CTA.** It plays over the camera dropping in behind the landed car. The last 0.8 s is the hop's lift-off, which makes
   the loop seamless (no end card, no black, no pause).
4. **Opening label.** It names the flying version ("flight listed for the Rocket version only, per Tesla") rather than
   claiming the demo car's trim, which no source confirms (claim ledger C10, C11).

## Before upload

- Recheck Tesla's live Roadster page (claim ledger, "Rocket Short"):
  - the trim names;
  - that flight is listed only for the Rocket;
  - that the thrusters use compressed air.
  The page was blocked from this container.
- In YouTube Studio, set the Related Video to `ujV0J6-cfX8`. First confirm advanced features and that the target is public
  or unlisted (`upload/UPLOAD_TEXT_ROCKET.md`).
- Listen once with sound before publishing. The checks here are measurements and independent transcriptions, not a human
  listen.

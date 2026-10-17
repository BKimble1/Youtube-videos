# Rocket Short: "The Problem With Tesla's Rocket Car" (final pass: 34.2 s, 9:16, 30 fps)

Export: `exports/FGW_Rocket_Short_FINAL_PASS.mp4` (Git-ignored). Rebuild everything with `bash tools/render_rocket.sh`
(composition `RocketShort`, `source/src/rocket/`). Upload captions: `captions/FGW_Rocket_Short_FINAL_PASS.srt`. Upload
text and the Related Video steps: `upload/UPLOAD_TEXT_ROCKET.md`. QA: `QA_REPORT.md` ("Rocket Short: FINAL PASS").
Sources per line: `research/claim_ledger.md` ("Rocket Short: claim-to-source note"). Clips: `footage/CLIP_LEDGER.md`
("Rocket Short"). The first version (`FGW_Rocket_Short_FINAL.mp4`) is superseded; what changed and why is at the end.

A follow-up to "Tesla's Flying Roadster Isn't What You Think": the engineering trade-offs behind cold-gas thrust on a car.
It is not a recap, a disaster story or a prediction.

## Narration (as recorded)

> This Tesla can jump. But its air supply isn't endless. These jets blast compressed air. Every burst uses some up.
> Hovering means pushing against the car's entire weight. Bigger tanks can buy more time, but add weight and need
> protection. Then comes balance. Thrust that misses the center of mass can make it rotate. Other thrusters can correct
> that, but those corrections use air too. And fire a jet near loose gravel? That blast can send debris flying. None of
> this breaks physics. It gives a sports car spacecraft problems. It also drives upside down. Tap the linked breakdown.

99 words, 176 wpm over 33.7 s. The voice starts at 0.16 s and ends at 33.82 s; the film ends 0.38 s later.

- **Voice.** Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, `[excited] [quickly]`, `[dryly]` on "It gives a sports car
  spacecraft problems." The approved take is `audio/rocket/takes/r_t1_IyNt.mp3`.
- **Re-recorded lines.** The hook, the hover line and the CTA were re-recorded in the same voice, model and tags, as part
  of the full revised script so each line has its natural context (`audio/rocket/takes_fp/`, four takes, ElevenLabs flow
  `8baHNxGa4ViVC2FKXh4s`). Take `fp_t4_8N47` supplies them. Its levels per sentence sat closest to the approved take's,
  and its hover line's pitch (162 Hz median) sits between its neighbours in the approved take (156 and 163 Hz).
- **Splice.** `tools/build_rocket_narration.py` places each sentence block from its take:
  - from the new take: sentences 0–1 (hook), 4 (hover), 13–14 (CTA);
  - from the approved take: everything else.
  Every block is cut in the middle of its silences with 8 ms fades. The new take gets one overall gain (−0.29 dB),
  measured on the 11 sentences both takes share, so its own dynamics stay. All 14 joins sit at −63 dBFS or quieter
  (`joins` in `source/src/data/rocket_words.json`). No time-stretch, no pitch change, no global speed-up.
- **Beats.** Pauses are tightened only (`tools/tighten_rocket.py`, sentence gaps 0.27 s). Six small extra beats where the
  picture needs one:
  - after "endless." +0.10 s (the match into the drawing);
  - after "weight." +0.12 s (into the tank);
  - after "protection." +0.20 s (the frame closes);
  - after "too." +0.25 s (the correction settles);
  - after "flying." +0.20 s (the dust pass);
  - after "problems." +0.15 s (the touchdown).
- **Wording check.** The placed narration was uploaded as plain audio (`audio/rocket/verify/narration_placed_fp.mp3`) and
  transcribed independently with Scribe: all 99 words match the script (commas aside). These are the times that drive
  the animation and captions (`audio/rocket/scribe/placed_verify_fp.json`).

## Timeline: six compositions, then the live finish

| Time (s) | Words | Picture | Source |
|---|---|---|---|
| 0.00–3.46 | "This Tesla can jump. But its air supply isn't endless." | **A. Real**, one continuous camera at its own speed: frame 0 is the white Roadster climbing on two jets above the parked Teslas (whole car, upright), then it rolls inverted with jets firing and back upright. A restrained shadow lift on the clip (curve; black stays black, highlights untouched). One brief tag, "Rocket version" (0.25–2.0). Blue flow marks on the two real jets from 2.94; a saffron outline draws onto the car at 3.34 | `rec_224911` 0:35.25 → 0:38.71 |
| 3.46–7.4 | "These jets blast compressed air. Every burst uses some up." | **B. Gas close-up.** The drawn Roadster replaces the real car at the same place and size, still descending on its jets; the night becomes the dusk site. One push-in (3.48 → 4.35) as the side panel and sill lift off: the tank of gas, the valve under it, the pipe along the sill, the front lift nozzle and its exit. A brief "Illustration" tag (3.76–5.1). Steady jets brake the car; then five bursts: the valve lever opens, a few gas markers run the pipe and leave with the puff, the gas in the tank pales a step (24 → 8 markers by 7.5; no number) | illustration |
| 7.4–10.6 | "Hovering means pushing against the car's entire weight." | **C. Whole-car forces.** Pull back to the whole car (panel shut): WEIGHT down from the floor and THRUST up from the roof on the centre's line, the same length, labels large; equal ticks on "entire weight". Both gone by 10.72 | illustration |
| 10.6–14.3 | "Bigger tanks can buy more time, but add weight and need protection." | **D. Tank close-up.** Push in as the panel lifts again; the tank becomes the subject and the rest of the frame dims. It grows into a bigger tank holding more gas; on "add weight" its wall thickens, brackets bolt it to the sill and the roof rail and a small weight arrow grows (the plume grows to match); on "protection" a frame closes round it. No extra-time claim | illustration |
| 14.3–21.9 | "Then comes balance. … can make it rotate. Other thrusters can correct that, but those corrections use air too." | **E. Balance, larger side view.** Pull back as the panel shuts. A centre-of-mass dot and one label ("center of mass"). The rear lift jet runs stronger: an amber push behind the dot, its line of action and lever arm; the car turns nose-down (one amber arc at the nose; max 8.5° at 19.2). One nose-thruster burst (19.02–19.47, saffron push at the nose) stops the turn and sends it back; a short trim of the lift jets stops it level at 20.92; the dot goes from amber to white. A dashed phantom of the tank shows that burst's gas leaving for the nose, and the tank paler on "air" | illustration |
| 21.9–26.54 | "And fire a jet near loose gravel? That blast can send debris flying." | **F. Nozzle to ground.** The car descends to a low hover and the camera follows the rear jet down: the rear pod under the overhang, the plume, its footprint on a patch of loose gravel. A light stir as the jet arrives; on "blast" a few larger stones are thrown outward along the pad, land and skid; a little dust. A short dust pass (fully covered for about 3 frames) carries into the footage. The pad is intact; nobody is nearby | illustration |
| 26.54–31.00 | "None of this breaks physics. It gives a sports car spacecraft problems." | **G. Real**, from the air: the second ramp run rolling upright on its jets, side plumes, jets down into smoke, touchdown at 30.70 just after "problems". No graphics | `rec_224730` 2:20.14 → 2:24.60 |
| 31.00–31.85 | "It also drives" | **H. Real**, from the air: the same run driving along the underside of the curved ramp, upside down. Cut before any exhaust shows near the car | `rec_224730` 2:16.60 → 2:17.45 |
| 31.85–34.20 | "upside down. Tap the linked breakdown." | **H. Real**: the first run's hang, close-up from below, shown whole in a band (the reveal's corner gauges out of frame). One cue, "How it drives upside down", from 31.81; it clears at 33.80, so the last 0.4 s is the clean shot | `rec_224730` 1:17.50 → 1:19.85 |

Real footage: 3.46 + 4.46 + 0.85 + 2.35 = 11.1 of 34.2 s (33%).

## Ending

A clean ending rather than a forced loop. The CTA cue is gone 0.4 s before the last frame; the last shot is the hang
close-up, and frame 0 is the hop climbing on its jets. Both are real, night, centred, and similar in scale. The score
ends on the opening's drone and marimba figure at the opening's level, so a replay continues the same music.

## Physics, as animated

- **One car-local frame.** Every attachment point is in the car's own coordinates (`sim.ts`): the body, the three nozzle
  mounts, the plume origins, the pipes and the centre-of-mass dot. The scene places that frame once (height, mirror,
  pitch about the centre of mass), so nothing can drift off the body at any scale or angle.
- **Nozzles.** Three, all fixed and all firing down:
  - two lift nozzles, one on the sill behind the front wheel and one in a pod bolted under the rear overhang;
  - a small nose thruster in the front bumper.
  Each is a housing whose top edge sits inside the underbody it is bolted to, then a bell. The plume starts at the bell's
  exit. Only its puffs drift; the origin never moves.
- **Thrust and exhaust.** Thrust is always opposite the exhaust. Gas leaves the nozzles downward (blue); the push is
  drawn upward (saffron); the imbalance is amber.
- **Hover and bursts.**
  - Hover: THRUST equals WEIGHT, drawn to the same scale.
  - Braking the footage's descent: thrust 1.13× weight.
  - Bursts: 2.25× weight for 0.16 s, off for 0.20 s; they average to the weight, and the car bobs 400–409 units.
  - The jump itself is never said to need thrust through its arc ("Hovering means…").
- **Torque.**
  - Rear jet stronger, front weaker (same total): the push sits behind the centre, so the car turns nose-down.
  - The nose thruster pushes up at the nose: nose-up torque, which stops the turn and reverses it.
  - The trim (rear slightly stronger again) stops it level.
  - Each step's direction agrees with its force. Slow and small to be readable (not to scale).
- **Gas.** Markers and a paler tint are the only reserve cue: no gauge, no number, no linear readout. The bigger tank
  holds more markers, and its added weight then needs more thrust (the plume grows), so no proportional time gain is
  implied.
- **Fan suction.** Not shown. The CTA shows the upside-down drive and hang and points to the long video, which explains
  the fans. Nothing says the jets hold the car to the ramp.
- **Cold gas.** Pale exhaust, no flame. **Gravel.** Only a loose patch moves; the pad is intact; drawn as a schematic,
  not an observed event.

## Sound (`tools/make_bed_rocket.py`)

- **Score.** The channel's in-house score, D major at 104 BPM:
  - the drone and marimba under the opening;
  - one restrained low hit as the outline lands;
  - a pluck groove through B–D, a thinner marimba groove for balance, the darker groove into the dust;
  - the D-major resolution under the payoff, a soft hit at touchdown and piano on "problems";
  - the opening's drone and marimba again under the CTA, through the last frame.
- **Effects.** Only from visible actions:
  - an air release on the real jets;
  - the panel each time it opens or shuts;
  - a valve click before every burst and gas only while a nozzle fires;
  - the bigger tank, the wall, two bracket ticks, the frame latch;
  - the dot's tick;
  - the rear jet surging (panned right), the nose burst (left), the short trim (right);
  - a few gravel ticks and a short dust swell;
  - on the silent aerial, the jets while visible and the touchdown;
  - open air only under the upside-down shots.
  There is no whoosh on the cuts.
- **Mix.** The replay's own sound plays under the opening. Music, effects and that sound duck under every word.

## Changes in the final pass (owner's audit, 17 Oct 2026)

1. **Floating rear hardware: the cause.** The rear lift nozzle (car-local x −175, y −36) and the tail pitch thruster
   (x −207, y −46) had been placed to match where the replay shows plumes. The traced body's rear overhang, though, ends
   at y −73 to −83 there. Both bells hung 35–40 units below it, beside and behind the rear tyre. Their pipes existed only
   inside the cutaway's clip, so with the panel shut nothing joined them to the car. The rear plume also came from the
   lift bell while the tail bell sat apart: "a nozzle-like object floating behind the rear wheel".
2. **The fix.**
   - Every nozzle is now a mounted unit whose housing is set into the outline it is bolted to (values checked against
     the traced outline).
   - The rear lift nozzle moved into a pod under the overhang (x −186). The tail thruster is gone: the final settle is a
     brief lift-jet trim.
   - The centre of mass moved to midway between the two lift jets (x −62).
   - The cutaway now opens the sill too, so every pipe visibly reaches its mount.
   - Reviewed at the match (2.28×), the gas close-up (5.6×), the whole car (1.55×), mid-pitch (2.15×, 8.5°) and the
     gravel close view (3.29×).
3. **Plaques removed.**
   - The date/demo label is now a brief "Rocket version" tag.
   - The persistent "SIMPLIFIED SCHEMATIC · not Tesla's layout" is now a 1.3 s "Illustration" tag. The full disclosure
     is in the upload description.
   - The "air tank", "valve", "nozzle" and "loose surface" tags are gone: the close-ups show those parts large enough
     to read.
   - THRUST/WEIGHT are larger (50 px) and leave when the force beat ends.
   - The checkered centre-of-mass marker is now a plain dot with one label.
   - The aerial's tank capsule, dashed ring and "clear area" label are gone.
4. **Recomposed middle.** Six compositions joined by five camera moves, one per beat: push-in to the gas close-up, pull
   back to the forces, push-in to the tank, pull back to the balance view, follow the jet down to the gravel. Each move
   reveals the next subject; there are no zoom pulses within a beat. Richer shading: metal gradients on the nozzle units
   and pipes, cylinder shading on the tank, ribs inside the body, and a parallax far layer with hills, light towers, a
   hangar and haze.
5. **New lines.** "But its air supply isn't endless." (hook), "Hovering means pushing against the car's entire weight."
   (more precise than "Keeping a car airborne on thrust…"), "It also drives upside down. Tap the linked breakdown."
   (CTA). The CTA was checked against the companion final in this repo, which opens on the same hang and explains the
   fan suction. The YouTube page itself could not be opened (upload notes).
6. **Ending.** A clean ending on the hang close-up instead of the loop bridge, with the CTA cue gone before the last
   frame.

## Before upload

- Recheck Tesla's live Roadster page (claim ledger, "Rocket Short"):
  - the trim names;
  - that flight is listed only for the Rocket;
  - that the thrusters use compressed air.
  The page was blocked from this container.
- Confirm that `ujV0J6-cfX8` is the companion cut that shows and explains the upside-down hang. Then set it as the
  Short's Related Video and check the link on a phone (`upload/UPLOAD_TEXT_ROCKET.md`).
- Listen once with sound before publishing. The checks here are measurements and independent transcriptions, not a human
  listen.

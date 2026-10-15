# V5 changes and limitations

V5 starts from the V4 master and the V4 project. It keeps the V4 vector robots (dark F.02, light F.03, chest mark),
the channel's Crew and the orange furnace look, and rebuilds the timeline around a shorter narration.

- **Runtime:** 3:53.5 (V4) → **3:36.7** (V5).
- **Rendering:** native 1920×1080, 30 fps, from source.
- **Editable project:** `source/src/v5/` (composition `V5Main`). V4 is untouched apart from two additive rig options
  (see the end of this file).

## Substantial changes

1. **New opening.** It runs 0–7 s, without a logo and without a "coming up" montage.
   - **0–0.5 s:** the black F.02 is already at the deck edge, with the orange ladle in frame. One servo sound.
   - **0.5–2.2 s:** weight shift, a planted push, then a ballistic arc (gravity, not one ease curve). The camera
     follows, and the robot goes into the surface feet first. The surface masks the entry. Splash, ripple, glow and
     disappearance all happen at the entry point.
   - **2.2 s:** an "ILLUSTRATED RECONSTRUCTION" chip appears just after the impact.
   - **3.3 s:** the cooling surface becomes the simulator's target at the same position, size and perspective.
   - **After that:** an imperfect short attempt, a compact rewind, and a corrected stick on target (6.4 s).
   - **7.0 s:** matched pose into the F.02 at work ("Figure's second-generation humanoid").
2. **New hook narration in the same voice.** "This robot jumps into molten metal. But the fire isn't the weirdest
   part. It's how they taught it to jump."
   - The narration was recut, not sped up: about 17 s of redundant lines and gaps came out.
   - The removed lines include the V4 opening explanation and "Does retiring hardware feel different…".
   - The Imatra lines use a tighter take.
   - Joins have 0.40–0.52 s lead-ins and 12 ms crossfades (`audio/v5/narration/narration_edit_log_v5.json`).
3. **Factory (0:07–0:20).**
   - The F.02 does a full task, with the panel locked to its palm: grasp, lift, hang on the moving line, release.
   - Plant time speeds up for "months". The camera follows a panel down the line to an F.03 that unloads it, then the
     F.03 fleet walks in.
   - Retirement is shown as service and power-down onto a hand truck.
   - A crate on a pallet jack crosses the lens. This replaces V4's empty-factory interval.
4. **Options (0:20–0:49).** Each option now has a visible consequence.
   - **Sell:** a FOR SALE tag, a crate that boxes the robot in, the shutter and a padlock.
   - **Take apart:** the knee is unbolted. The actuator is shown in a lens beside the joint, then pulled and held up.
   - **Time cost:** the rotor becomes a wall clock with a queue of waiting F.02s, while the launch flag slides along a
     NEXT MODEL plan.
   - **Melt:** the clock face heats into a top-view ladle; cut on the splash.
   - **Location:** one beat. A real door picture becomes the street (U.S. ✗, Mexico ✗, Imatra ✓), and the camera
     pushes through the Imatra doorway.
5. **Imatra (0:49–0:58).**
   - Source chips: "FIGURE · "F.02 DECOMMISSION" · SEP 30, 2026" and "OVAKO STEEL PLANT, IMATRA · VIA YLE".
   - A witness silhouette in the booth window lights up on "go in". The jump itself stays off screen.
   - The crane tips scrap into the ladle (routine recycling).
   - The pull-back reveals the film camera, lights and crew on a nearer plane.
6. **The post (0:58–1:24).**
   - **Phone:** a readable phone with a short flick-scroll. The post card is labelled PARAPHRASED. The reply card is
     labelled QUOTED and is highlighted word by word with the voice.
   - **Clapperboard:** the reply card flips into a "Terminator 2 / 1991" slate. The clap lands on "Two", the slate
     fills the lens and drops away onto the film set.
   - **Film set:** the movie reference is brief (a chip lowered into the ladle on a chain). The monitor's title card
     then gives way to its live feed, and the camera pushes through the monitor into training.
7. **Training (1:24–2:20).**
   - **Opening:** starts on the foot. A practice arc draws to the steel and burns out, the lights go out, and the
     stage rebuilds line by line. The "practice run?" label is gone.
   - **Attempts:**
     - a technician tosses the target onto the pad;
     - attempt 1 slips on the push (skid mark) and lands short;
     - the score card's rows fill at the actual push-off and landing events;
     - a rewind, the sliders nudge, attempt 2 lands near the target, attempt 3 hits the bullseye.
   - **Parallel trials:** the stage frame becomes one panel of a grid of readable minis with rising success. The
     selected trial dives back to full frame.
   - **Performer:** a split-screen pose match ("Illustration of the general method").
8. **The policy (1:56–2:20).**
   - One anchored diagram on the robot shows the sequence disturbance → sensor → policy → motor command → visible
     correction.
   - A plate rises, the foot lands early, a ping goes up, a command comes down, the knee and ankle glow, and the tip
     is caught.
   - "Policy" is explained once. A reflex-hammer tap goes with "reflex".
   - "tipping?", the "many times a second" label and the thought bubbles are gone.
9. **Sim → real (2:20–2:58).**
   - **Transfer:** the avatar's foot gains the F.02 shell, the floor gains its material, the warm light comes up and
     a contact shadow lands.
   - **Close-ups with consequences:** the knee knocks (joint play), the sole tilts on an uneven plate, and a jittery
     trace appears beside the head.
   - The unknown foundry's measurements turn into "?" and then into dice that tumble across the lens into the
     simulator.
   - **Varied rounds:** a weight block, an icy top, a timer. Every round lands, and each reset is a short rewind.
   - **Uncertainty:** said in the narration, plus one small caption ("Variations shown are illustrative · Figure
     hasn't said which it used").
   - **Airbag rehearsal:** the bag compresses, the robot sinks and settles. A matched crouch cuts to the deck edge.
   - **Interference:** the booth monitors lose their picture (static, then NO SIGNAL; no full-frame noise).
   - The real jump runs in one continuous move, without V4's 3:11–3:13 hold.
   - The banner and card that covered the crew and the robot in V4 are gone.
10. **What it proves (2:58–3:12).**
    - **Result:** the ripple settles into the target's rings, and the camera rises back along the flown arc. On
      "survive", one check appears beside the target in the brutal set (heat, dead monitors, broken camera).
    - **Limits are shown on the set, not in labels:**
      - three avatar poses along the arc (one movement);
      - the rings pulse (one kind of target);
      - floor tape and barriers (prepared);
      - the crew at work with clipboard and radio (supervised).
    - **Unfamiliar task:** the camera trucks out past the edge of the prepared set into an ordinary parts aisle. The
      example is a spilled tote across the aisle. The trained avatar stops and can only offer its jump-ready crouch,
      so its target rings flicker on an empty floor.
11. **Held shots and walks.** Shots that used to sit still for 2–3 s now creep slowly: the options two-shot, the
    stage before the target toss, the score questions, the policy definition and the unknown-foundry wide. The airbag
    hall opens on a short walk to the ledge edge instead of a 2.2 s static frame. Every walk now covers whole strides
    and ends with a stop step, so the planted foot never slides (`source/src/v5/rig/stop.ts`). Footstep sounds are
    placed on the computed footfalls.
12. **Ending (3:12–3:36.7).** Rebuilt.
    - **Into the silhouette:** the aisle's lights go out bank by bank and the avatar fills black. A warm glow rises
      behind the same shape, now a backlit silhouette on the foundry deck at the same screen position and size.
    - **The walk and leap:** arms, legs and head are picked out on the words. It walks to the edge and leaps. The
      flight slows but never stops.
    - **The rewind:** on "But the choice wasn't the robot's", the take rewinds to the edge and the camera pulls back
      to the people.
    - **Three crew actions:**
      - the director points the slate at the ladle (picked the ending);
      - a technician tosses the target onto the surface (built the target);
      - another raises the score card (wrote the score).
    - **The real jump:** the slate claps, the planned arc draws, and the silhouette makes the jump into the rings
      ("reaching it").
    - **Symbolic tableau:** the surface cools into the simulator's pad. The line-art avatar, not the destroyed robot,
      builds at the edge and sticks the landing. The crew raise "10" cards against the warm backlight.
    - **Logo:** the glow whites out into the FUTURE GOT WEIRD mark, held about 1.3 s, and the score fades cleanly to
      silence.
    - V4's extra furnace close-up, its target overlay, the "a choice?" bubble and the "not the robot's",
      "picked the ending", "built the target" and "wrote the score" tags are gone.
13. **Sound.**
    - **Re-cued from the animation's own event times** (`source/src/v5/sfx_v5.ts`, 266 cues). The effects are short
      mechanical, contact, reset and impact sounds, with only three whooshes in the whole film.
    - **Re-timed in-house score:**
      - the ostinato drops out on the opening impact;
      - training stays thin while the attempts fail, then lifts a whole step with a pad and shaker on the bullseye;
      - the score is silent while the lights go out, holds a high note through the slowed leap, plays pizzicato for
        the people, and rises from the slate to the entry;
      - it resolves in D major on the symbolic landing and fades cleanly under the logo.
    - **Mix:** effects dip 4 dB under speech. The integrated level is −15.0 LUFS with a −1.5 dBTP true peak.

## Transitions (26, built from scene objects)

Each transition has a 25-frame strip in `qa/v5/strips/`.

| Time | Transition |
|---|---|
| 0:03.3 | Furnace surface cools into the sim target (same place, size, perspective) |
| 0:07.0 | Avatar's pose → the F.02's pose at the plant |
| 0:20.4 | Crate on a pallet jack crosses the lens |
| 0:32.9 | Actuator rotor → wall clock (matched circle) |
| 0:37.6 | Clock face heats into a top-view ladle |
| 0:38.6 | Cut on the splash to the side view |
| 0:49.2 | Push through the Imatra doorway |
| 0:57.1 | Pull-back reveals the film unit on a nearer plane |
| 1:09.0 | Reply card flips into the slate |
| 1:09.8 | Slate fills the lens |
| 1:10.1 | Slate drops away onto the set |
| 1:24.3 | Push through the monitor's live feed |
| 1:29.4 | Burned-out practice arc → lights out → line-by-line rebuild |
| 1:48.1 | Stage shrinks into a grid panel |
| 1:55.8 | Dive into the selected trial |
| 1:56.7 | Split-screen pose match, performer ↔ avatar |
| 2:20.2 | Sim foot → real foot (shell, floor, light, shadow) |
| 2:32.1 | Dice tumble across the lens |
| 2:49.9 | Airbag crouch → matched crouch at the deck |
| 2:54.2 | Monitor loses its picture |
| 2:58.9 | Ripple → target rings |
| 3:09.6 | Camera trucks out through the edge of the prepared set |
| 3:13.8 | Lights out → silhouette (same shape, same screen place) |
| 3:23.8 | Rewind |
| 3:31.9 | Furnace surface → sim pad (the opening's match, reversed) |
| 3:34.9 | Glow → channel mark |

None of them is an iris, and the only fast lateral move is the truck out of the set, which is locked to the seam. Three
transitions push the camera through an object (the Imatra doorway, the monitor, a grid panel). The objects and
contexts differ, but the mechanic is the same push. That is the closest V5 comes to repeating a zoom.

## Text audit

**Removed:** "practice run?", "tipping?", "a choice?", "not the robot's", "picked the ending", "built the target",
"wrote the score", the "many times a second" label, the thought bubbles, the coming-up montage and the V4 target
overlay.

**Kept:**

- names and model labels (F.02, F.03, Brett Adcock, Arnold Schwarzenegger, Terminator 2 / 1991);
- concise attribution (Figure post and date, Ovako/Imatra via Yle);
- the distinctions: ILLUSTRATED RECONSTRUCTION, PARAPHRASED / QUOTED, "HOW THIS KIND OF TRAINING GENERALLY WORKS ·
  ILLUSTRATION", "Illustration of the general method", "Variations shown are illustrative · Figure hasn't said which
  it used";
- a few necessary terms (custom actuator, battery pack, POLICY, senses, motor commands).

**Legibility:**

- Chips are at least 28 px at 1080p.
- Every label was checked at 845 px wide, the size of a landscape iPhone screen (`qa/v5/phone_r1/phone_*.png`).
- Outgoing chips and overlays fade before each transition.

## Unresolved limitations

- **Not watched or heard in real time.** This environment cannot play video or audio. Review was done with:
  - stills and contact sheets at normal and phone size;
  - 25-frame strips around every transition;
  - measured checks (loudness, cuts, freezes, black, duplicates, single-frame pops, audio offset);
  - an objective speech-masking screen.

  The owner should watch it once at normal speed with sound before publishing.
- **Narration joins and new takes were checked by transcript, waveform timing and level, not by ear.** The word
  timings come from ElevenLabs Scribe transcripts of the chosen takes, and the captions and `script/script_v5.md` are
  built from those timings.
- **Foot contact was measured on the rig, frame by frame, for the main walks and jumps, not for every character.**
  - **Walks measured:** the aisle avatar, the ending silhouette, the Imatra walk-out, the Options edge walk, the F.03
    fleet and the airbag-hall ledge walk.
  - **Jumps measured:** the stick landings and push-offs in the hook, training, sim rounds, payoff and ending.
  - **Result:** a planted toe moves at most 1.35 world units per frame, about 1 px on screen. The first V5 render had
    a walk-to-stance blend that slid about 9 px per frame; it was replaced by a stop step before the final render.
  - **Not measured:** crew characters' feet.
- **Not every secondary character moves physically.** Crew members gesture and react but do not walk; where a crew
  member enters, it is by camera reveal.
- **The airbag hall is the plainest set** in the film: a grey hall, a mezzanine and the bag.
- **The end tableau is symbolic by design.** It shows the line-art simulator avatar on a simulator pad, so it does not
  imply that the destroyed robot returned. Whether every viewer reads it that way is a judgement call.
- **The robots are still drawn from the V4 brief's text descriptions** (`production/v4/MODEL_RECORDS_V4.md`).
- **Small sizes in the app.** The share copy you viewed on the phone arrived at 910×512 through the app's transport.
  The exported files are 1920×1080 (ffprobe); the app downsized its preview.
- **Thumbnails:** the V4 thumbnails remain current (same robot designs); no new thumbnails were made.

## Rig additions (backward compatible)

`source/src/v4/rig/Robot2D.tsx` gains two things:

- `solveIK`, which bakes the IK targets into joint angles so the jump's push-off can hand over to free flight;
- an optional `off` prop, which dims the visor glints on a powered-down robot.

V4 compositions do not use either, so they render as before.

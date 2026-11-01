# Blood Lizard V1: review report

**Deliverable.** `exports/FGW_Blood_Lizard_V1_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, H.264 (CRF 16, yuv420p,
BT.709) with AAC 320 kb/s stereo. It has 630 frames and runs 21.000 s. sha256 `061cf263…f6a03`. **It is not
published.**

## Narration

The words are locked and spoken verbatim (`NARRATION_LOCKED.txt`). They were generated in one ElevenLabs run of two
takes with the channel narrator voice (`kk5XaSLo2XAw0sKM98zU`). Take 1 was chosen because it has the stronger hook: SHOOT
is +2.5 dB over the median word.

- **Edit.** One edit: the breath after the hook line is shortened from 0.50 s to 0.38 s.
- **Timing.** Speech runs from 0.00 to 20.21 s. The remaining sentence breaths are 0.35–0.48 s, and the longest sits
  under the impact and the bite.
- **ASR check.** On the final mixed file, Whisper base.en gives WER 0.000. Zipformer's only errors are
  "predator" → "creditor".
- **Provenance.** `audio/narration/voice_provenance.json`.

## Story as built (word-keyed in `source/src/story.ts`)

| Time (s) | Picture | Narration |
|---|---|---|
| 0.00 | The coyote's open mouth is already a few centimetres above and behind the horned lizard and closing in. Both the lizard's eye and the muzzle are large in frame. | "If you try to eat this lizard" |
| 0.35–0.50 | A narrow jet leaves the rear, upper corner of the lid and arcs across open sand into the gape. | |
| 0.88–1.45 | The coyote jerks back with ears flat, eyes squeezed and tongue out. The lizard stays sharp. | "it can SHOOT BLOOD…" |
| 0.90–3.5 | One continuous push onto the eye. The skin thins away locally around the eye and back along the neck. | "…straight out of its eyes!" |
| 3.5–4.0 | The cutaway shows the eyeball, the sinus hugging the back of the eye, the bright artery in, and the dark vein out with its muscle band. Cells circulate. | |
| 4.0–5.0 | The predator's shadow sweeps over and the lizard flinches. The muscle squeezes the vein shut, and the outflow stops and backs up. | "When a predator attacks" |
| 5.4–8.8 | Each heartbeat pushes more blood in. The sinus and the tiny vessels swell, the walls stretch thin and glossy, and the cells crowd and jostle. A blister bulges toward the pore. The camera closes on it. | "pressure builds inside tiny blood vessels behind its eyes" |
| 8.6–9.2 | Tension tremor, then the blister tears. | "Until they BURST" |
| 9.2–12.3 | The jet leaves through the pore. The camera pulls out with it, out of the head (the skin closes back), to the coyote lunging in. | "launching a stream of blood right into…" |
| 12.0–12.7 | A slow-motion accent (0.26× at its slowest) as the stream lands in the mouth, then back to normal speed. | "…the predator's mouth!" |
| 12.6 | The jaws snap shut on the lizard's back half. | |
| 12.9–16.1 | The coyote lifts the lizard and steps back. Its face fills with disgust: squint, ears flat, lip curl, nose wrinkle, a tremble. Then a head shake. | "And the blood tastes so disgusting…" |
| 16.3–16.7 | The coyote spits: jaws wide, head up. The lizard drops and lands. | "…they spit the lizard out!" |
| 16.5–17.6 | The coyote gags, tongue out. | |
| 17.6–20.3 | The lizard scrambles right. The camera follows, closing in, and the coyote falls behind out of frame. | "Leaving it alive…" |
| 19.6–21.0 | A muzzle comes in from the upper left, the lizard stops, its head rises and its lids swell. This is frame 0 again. | "…to do the exact same thing again." |

## Transition list (FGW rule: outgoing → incoming → new information → decision)

There are no cuts. Each transition is a camera move in one world.

1. **Two-shot → the eye** (0.90–2.6). Outgoing is attacker and lizard; incoming is the lizard's eye. New information:
   where the blood came from. Kept.
2. **Eye surface → cutaway** (2.7–3.55, a local reveal registered to the head, not a cut). Outgoing is the skin;
   incoming is the vessels behind the eye. New information: the mechanism. Kept.
3. **Cutaway → push onto the blister** (5.4–9.2). Outgoing is the whole sinus; incoming is the rupture site. New
   information: where it will burst. Kept.
4. **Rupture → out along the jet → the coyote's mouth** (9.2–12.3; the reveal closes as the camera leaves the head).
   Outgoing is inside; incoming is outside. New information: where the blood goes. Kept. There is no exterior →
   interior → exterior detour, because the camera goes in once and comes out once, following the blood.
5. **Impact → widen with the lifted lizard** (12.6–14.2). Outgoing is the mouth; incoming is the coyote's face and the
   held lizard. New information: the reaction. Kept.
6. **Coyote → follow the lizard → hook framing** (17.4–21.0). Outgoing is the predator; incoming is the escape and the
   next attack. New information: the lizard survives, and the loop. Kept.

## Measured QA (`qa/v1/`)

- **Format.** `render_qa.json`: 630 frames decode with no errors. The median frame-to-frame change is 3.95 (MAD at
  270×480). There are no large changes anywhere, planned or unplanned, and no near-static runs (longest run 0
  frames).
- **Loop.** The last frame differs from frame 0 by MAD 3.48, which is less than an ordinary frame step.
  `loop_seam_last3_first3.png` shows one continuous approach. The audio seam jump is 0.007, with the music period
  dividing the film (36 beats, 102.857 bpm) and the snarl placed across the wrap.
- **Contact sheets.** `contact_every_0.5s.png`, and `hook_0-2.5s_every_3rd_frame.png` for the first seconds.
- **Mix.** `mix_measure_mix_v1.json`: −13.8 LUFS integrated, true peak −1.67 dBTP (4× oversampled), voice −17.2 LUFS
  in the mix, effects and music bed −27 LUFS. Effects are ducked under the voice.
- **Fixed during review:**
  - The jet travelled over the dark gape, which made it hard to read. The mouth is now set back, so the stream crosses
    open sand.
  - The coyote's muzzle was about 30% too long and has been rescaled.
  - A stream tail looped back over the lizard during the bite. The stream now ends at impact.
  - The camera snapped from 15.6 to 9.0 cm wide in four frames at the bite. It now stays continuous.
  - A word-lookup bug fired the paw-swipe at 2.7 s, and the paw-swipe has been removed.
  - The cheek blood trickle read as a tube over the cutaway.
  - The jet's leading bead read as a pin.

## Known issues and judgement calls (for review)

- **Audio not auditioned.** This environment has no audio playback. The narration take and the generated effects were
  chosen by ASR, level and envelope measurement. Please listen, especially to:
  - the gag/spit (`gag_a_ucTH`);
  - the snarl across the loop seam;
  - the synthesised vessel-stretch, which rises with the pressure.
- **Runway.** Runway sound effects were generated, but its CDN (`dnznrvs05pmza.cloudfront.net`) is blocked by this
  environment's network policy, so they could not be downloaded. ElevenLabs sound effects were used instead. Runway was
  not used for picture: the film is the established deterministic Remotion/SVG style throughout, with no generated
  video and no 2D→3D style change.
- **Coyote framing.** The coyote is mostly seen as head and neck, at a real coyote-to-horned-lizard scale. Its body,
  with four jointed legs, exists in the rig, but stays out of frame in the chosen framings.
- **Speed of the stream.** In C the stream's front travels slower than real so the camera can follow it out of the
  eye. The only true slow-motion is the impact accent.
- **Duration.** The film runs 21.0 s, inside the 21–24 s target. The narration ends at 20.21 s and the last 0.8 s is
  the next muzzle closing in.
- **Ambiguous attacker at the end.** The returning muzzle uses the same coyote design, so it may read as the same
  coyote coming back as well as "another" one. Either reading fits the line.
- **Anatomy note.** Real horned lizards squirt from sinuses at the eyelids, and the exit point varies. Here it is
  drawn at the rear, upper corner of the lid, facing the attacker.

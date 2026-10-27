# Dead Spider V2: production and source notes

V2 reworks the V1 review into a faster, more visual Short. It has the same sources, science limits, cast and finish as
V1 (`SOURCE_NOTES.md`), with a new script, a new picture and a new mix. Vertical 1080×1920, 30 fps,
**30.200 s (906 frames)**.

## Narration

- **Script.** The V2 script, verbatim (`NARRATION_APPROVED_V2.txt`, 91 words). The capitals mark spoken emphasis and are
  kept in the prompt.
- **Voice.** The same ElevenLabs narrator as V1: "Test Voice" (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, on the same flow.
- **Generation.** One run of two variations. The direction was the inline tag `[fast, conversational, natural urgency,
  confident]`.
- **Take.** Take 1 (`v2_t1_d88W.mp3`, 29.52 s) is used whole: no time-stretch and no trim inside it.
  - Speech runs 0.03–29.34 s, about 185 wpm.
  - The master WAV pads it to 30.2 s, so the last caption and the final lift complete on screen.
- **Word timing.** ElevenLabs Scribe on the chosen take, used for timing only.
- **Wording check.** sherpa-onnx Zipformer and Whisper base.en on the take:
  - both hear "They'd turned" as "they turned", in both takes (the "'d" is co-articulated away);
  - Whisper also hears "released" as "release".
  - The results on the exported file are under QA below.
- **Files.**
  - `audio/narration/FGW_Dead_Spider_narration_V2.wav`
  - `audio/narration/FGW_Dead_Spider_V2_words.json`
  - `captions/FGW_Dead_Spider_V2.srt`
  - `source/src/data/timeline_v2.json`, built by `tools/make_narration_v2.py`

## Science: what the picture claims

The basis is Yap et al. 2022 (*Advanced Science*) and the Rice release (see `SOURCE_NOTES.md`).

| Claim in V2 | How it is shown |
| --- | --- |
| Living spiders straighten their legs with hemolymph pressure. They have flexor muscles but no extensors at the femur–patella joint. | Beat B, a cutaway of a living spider (pale shell, blue fluid). The leg first bends: the flexor shortens and the joint membrane folds. Then the body squeezes, fluid runs down the leg, the membrane swells and the leg straightens. |
| At death the pressure is lost and the legs curl. | Beat A: the overhead spider's colour drains on "dies", then its legs fold in. Beat B2: the flow stops, the fluid dulls and thins, the membranes slacken, and every leg curls. |
| A needle into the prosoma, sealed with glue, connects a syringe. Air pressure opens the legs; releasing it lets them close. | The needle always enters the top middle of the front body section and the glue bead seals it. The legs open only after air arrives and close only after the plunger has risen. |
| The gripper picks up objects, including another spider. | A test block is clamped, lifted, carried and dropped into a dish. A second, smaller and paler dead wolf spider is clamped and lifted off its pad. |
| The spider stays dead. | Nothing on either specimen moves except what pressure moves. There is no eye, fang, palp or body motion, and no walking. The stand carries the gripper: the specimen never moves itself. |

**Simplifications.**
- The syringe stands directly on the needle hub, with no tubing. One device then reads as one tool, from hook to
  reveal.
- The hook's syringe is hand-held. In the lab the same kind of syringe is clamped to a swinging stand arm.
- The second spider is drawn at 0.92 scale and in a paler colouring, so the two bodies stay distinct.
- The air is a pale blue accent, the only colour it ever has: a slug in the needle and a faint glow in the prosoma.

## Shot map (measured)

| Time (s) | Shot | Picture | Narration |
| --- | --- | --- | --- |
| 0.00–4.52 | Hook | A big curled dead wolf spider on a white pad, with the needle of a hand-held syringe above its front body section. Contact at 0.20 s, inserted by 0.30; the hand lifts it clear. The legs spring open with overshoot (mean extension passes 85% at 0.59 s). Air is let out at 2.5 and the legs sag; pressed again, they snap open on "MOVE". The camera only drifts. | "If you stuck a needle into a DEAD spider… you could make its legs MOVE again." |
| 4.52–7.80 | A | A match on the open spider: same camera, same pose, but the needle and pad are gone and it stands on open ground. The camera rises to overhead. Colour drains on "dies"; the legs fold in on "curl inward" while a faint trace of the open legs stays on the ground. | "Because when a spider dies, all its legs curl inward." |
| 7.80–10.96 | B1 | A cutaway of a living spider; the camera dives to one leg's femur–patella joint. The leg bends, then the fluid is squeezed down it and the leg straightens on "straighten". | "You see, spiders use fluid pressure to straighten their legs." |
| 10.96–13.48 | B2 | A new angle on the whole cutaway. The flow stops on "die"; on "pressure disappears" the fluid thins and every leg curls. | "And when they die, that pressure disappears." |
| 13.48–14.90 | C1 | The lab: the operator (Weird Crew lead, lab outfit) with his gloved finger on the syringe as the stand arm brings it down to the spider on its pad. | "So scientists attached a syringe" |
| 14.90–16.47 | C2 | Macro, high three-quarter view (the hook's angle): the needle touches the carapace at 15.45, goes in, the glue bead forms, and the arm lifts the spider off the pad on the needle. | "to a dead spider…" |
| 16.47–20.11 | C3 | One continuous move. The gloved fingertip pushes the plunger (16.62), and the camera rides the air pulse down the barrel, hub and needle into the spider. The legs stir as the first air arrives (17.6). A second push at 18.5 makes them spring open together, face-on (mean extension past 85% at 18.79, "spread" 19.04, "OPEN" 19.36). The arm then starts swinging toward the block. | "and pumped air inside. Its legs suddenly spread OPEN." |
| 20.11–21.60 | D1 | Close on the plunger: the finger lifts off at 20.47 and the plunger rises as the air comes back out. | "But when they released the pressure…" |
| 21.60–23.39 | D2 | Three-quarter view: the open legs stand round the test block. All eight touch it between 22.06 and 22.11 ("CLAMPED" 22.16). The stand lifts and the block leaves the bench at 23.06. | "the legs CLAMPED SHUT." |
| 23.39–26.19 | Working claw | The block is carried in the closed legs over a glass dish. A plunger push at 25.18 opens the legs and the block drops into the dish (25.53, a small bounce, settled by 25.58). The camera holds on the dish as the arm swings on. | "They'd turned a dead spider into a working claw." |
| 26.19–28.00 | Reveal 1 | The open gripper hangs from the syringe assembly and comes down over a second, smaller, paler dead spider lying crosswise on its own pad. | "And they actually used it to pick up…" |
| 28.00–30.20 | Reveal 2 | Tight. The air is let out (28.2) and all eight legs close on the second spider (28.37–28.41, "ANOTHER" 28.29). The stand lifts both; the second spider leaves its pad at 28.92. The camera rises with them and ends on the pair in mid-air under the needle, echoing frame 0. | "ANOTHER dead spider." |

**Legs.** Every leg follows its command as a damped spring (`v2/spring.ts`), integrated at a fixed step so each frame
is deterministic:
- opening: 3.1 Hz, damping 0.5, so the legs overshoot about 10% and settle;
- closing: 3.4 Hz, damping 0.62;
- the eight legs get the pressure 0–55 ms apart and have slightly different stiffness.

The contact solver still stops each leg at its first touch: on the pad, the block, the dish or the second spider.

## Hardware and cast

- **Syringe.** 1 mL: clear barrel with graduations, dark rubber stopper, plunger rod, thumb rest and finger flange
  (`v2/claw.tsx`). It sits on the orange 25 G luer hub of the V1 needle.
- **Stand.** Base plate, rod, boss head, swinging arm and barrel clamp. The arm turns about the rod and slides up and
  down it. The four stations lie on one arc: the insertion pad, the block, the dish, the second spider.
- **Hands.** The V1 gloved press hand (`shots/common.tsx` `PressHand`), now with a fingertip gap so the finger rests on
  the thumb rest instead of covering it. It is drawn at a real-world hand size relative to the 1 mL syringe.
- **Operator.** The V1 operator rig, unchanged (`dc/`).

## Runway

Runway was not used for V2. The network policy still blocks Runway's output host (`dnznrvs05pmza.cloudfront.net`), so
generated plates cannot be downloaded into this environment. Every frame is the deterministic vector world. Allowing
that host in the environment's network settings would make Runway plates usable in a V3.

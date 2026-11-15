# BIOSENTER Gut Robot: V1 → V2 change log

**Deliverable:** `exports/FGW_BIOSENTER_GUT_ROBOT_V2_REVIEW_1080x1920.mp4`

- **Same narration recording.** The master WAV is byte-identical to V1 (SHA-256 `4a1c8a51…`), and the word timings are unchanged.
- **Same length:** 26.30 s, 789 frames.
- **Same identity, shot order and story.**

V1's source is commit `8149cb7`. V2 edits the same Remotion scene system in place: the composition is `BiosenterV2` and
the mix is `mix_v2`.

## 1. Robot: physically consistent locomotion (priority 1)

- **Real proportions.** The published device is about 90 mm long and 13 mm across (about 7:1); V1's robot was about 4:1.
  V2 is 11.1 to 13.3 units long against a diameter of 2. That is about 5.6–6.7:1 because the extender stretches.
  - The **head and tail themselves are the kirigami anchoring segments**, as described. Only a short tether port sits
    behind the tail and the flat channel face in front of the head.
  - Files: `robot/state.ts` (`LEN`, `L0`, `STROKE`) and `robot/geom.ts`.
- **The cycle is unchanged in order, and now readable in every crawling shot:**
  1. The rear anchor swells radially and grips.
  2. The four-chamber actuator lengthens, so the head advances.
  3. The front anchor grips.
  4. The rear releases.
  5. The actuator shortens, drawing the rear forward.
  6. The front releases, and the cycle repeats.
- **One world-time schedule** drives every in-gut shot, so a gripping anchor never moves relative to the wall while it
  grips, and nothing slides backward. The tail moves only while the body contracts, and the head only while it
  extends. Components never change attachment points, and the tether is continuous.
- **Gentle grip, minimal distention.** The sources stress that the bristly kirigami grips while minimizing distention.
  The inflated anchor radius drops from 1.98 to 1.88 against a lumen radius of 2.0. The bristles meet the mucosa, the
  folds flatten, and the wall gives only slightly; V1 pushed it outward.
- **Pressure-driven easing.** Inflation now eases in and out smoothly (V1 snapped quickly at the start). The pop's
  spring overshoot drops from 32% to 8%, so there is no elastic bounce.
- **A chamber cutaway in the side view (S3, 7.8–11.3 s).** A window in the actuator's skin shows two of the four
  Kevlar-reinforced chambers. They fill cyan, and widen, while the actuator extends, and go dark as it vents. The
  chamber on the outside of a bend is fuller (steering). The central tool channel and its cable are visible.
- **Kirigami scales.** There are more rows (8 × 16 per anchor). They are short, keep the sleeve's thickness on screen,
  stay attached, and are drawn above the outline ink so they never read as needles.

## 2. World

- **A meandering gut.** The centreline is a continuous gentle meander, matching the "collapsed, winding" intestine in
  the pig studies. The robot visibly bends with it, and the outer chambers glow harder.
- **Wall landmarks.** Fine circumferential blood vessels are fixed to the wall, so an anchored segment can be seen
  staying put while the rest moves.

## 3. Shots

| Time (s) | V1 | V2 |
|---|---|---|
| 0–3.5 (hook) | One near-identical tracking framing | Close alongside the head as it extends (the camera trails the crawl, so the head visibly advances), then the grip at about 1 s. Pull back along the body as it is drawn forward on "CRAWLS". Push in on the head anchor. |
| 3.5–6.85 (macro) | The camera followed the sliding anchor (nothing moved in frame) | The camera holds at the anchor's rest place: the flat sleeve slides in and stops, the balloon swells, and the scales lift on "pop" and meet the wall. |
| 6.85–11.55 | The same top-down view as the macro, tracking | A pull-back to a three-quarter side cutaway. The camera trails at 60% of the crawl's speed, so net forward progress shows in frame, with the chamber window and a snake bend. |
| 11.55–16.83 (pig) | A static diagram after the reveal | Reveal, then a push in on the route as the robot travels it, with one tick per foot, then a pull back as "6+ FEET" lands, and a drift. The stretch is drawn to the robot's own scale (about 2 m ≈ 22 robot lengths), on a denser coil, so it is clearly a fraction of the intestine. |
| 16.83–19.43 (tools) | Forceps, then an injection needle | A biopsy clip (opens, closes, pulls back holding an obvious pink sample, leaving a notch). The camera eases to a second site, and a blue-filled spray catheter releases a short, fine, localized spray that stains a small patch. This matches the published camera, clips and sprayer. |
| 19.43–21.15 (lab) | A pale grey bench (disconnected) | A dark, composed test bench in the film's palette: a teal-lit acrylic test tube, the tether to the controller with four air lines, the head anchor gripping, and a slow drift. |
| 21.15–26.3 (ending) | The opening view repeated | A wide anatomical view from above: the robot inside a winding stretch of gut, followed round the bend through one full cycle. The camera then descends and swings alongside the head, arriving exactly at frame 0. |

## 4. Captions

- **Highlights cut from 12 phrases to 5:** CRAWLS, TINY SPIKES, PIGS, SIX FEET, EXPERIMENTAL.
- **One zone per stretch:** top for the gut, macro and pig; low for the tools and the lab. Zones change only on hard
  cuts, and each cut now lands on its caption change (3.50, 16.83, 19.43 and 21.15 s). V1 had one-frame mismatches.
- **The final caption** clears 0.18 s after "it.", so the loop's last frames are clean.

## 5. Audio

- **Effects re-cued** from the revised animation. The injection-needle sounds are replaced by the spray catheter: a
  short, fine hiss with a faint patter.
- **The voice's transient peaks** (the plosive in "It could") are tamed by a peak limiter on the voice bus alone
  (gain only). Master limiting fell from 4.2 dB to 1.0 dB at the same loudness.

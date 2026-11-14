# BIOSENTER: science notes and accuracy checklist (V1)

## Source

- MIT News, 28 Oct 2026: "Soft robot could help doctors diagnose, treat small intestine disorders"
  (news.mit.edu/2026/soft-robot-could-help-doctors-diagnose-treat-small-intestine-disorders-1028).
- The paper: *Science Robotics*, 28 Oct 2026, doi:10.1126/scirobotics.adt2230.

**Verification status.** Neither page could be fetched from this production environment: its network policy blocks
news.mit.edu and doi.org (DNS failure). The facts below are the reference facts supplied in the V1 production brief, and
the picture follows them. Re-check them against the paper before publishing (see the checklist's last line).

**MIT images.** No MIT footage or press images were used, altered or traced. Every visual is an original, deterministic
vector visualization (Remotion/SVG).

## Reference facts (from the brief) and how V1 shows them

| Fact | In the picture |
|---|---|
| A soft, tube-shaped, **tethered** robotic enteroscope | One canonical tube-shaped robot in every shot. The tether trails from the tail cap in every in-gut shot, runs out of the test tube to the controller in the lab, and is drawn on the pig-diagram glyph. |
| Pneumatic body with **four inflatable chambers** | The extender has four longitudinal chamber lobes (cos 4φ profile) with fibre ribs. While it extends, the chambers glow cyan, and the ribs spread visibly as it lengthens. |
| Expandable **head and tail anchoring** mechanisms | Two balloon anchors that swell from 1.02× to 1.98× body radius. Inflated, they reach and press the wall, which visibly gives (the wall radius is pushed out by the anchor's own radius). |
| **Kirigami sleeves** forming small protruding, **scale-like** structures | A staggered grid of 6×16 triangular flaps cut into each sleeve. Flat, they show only as cut lines. As the balloon passes 60% inflation they hinge out about their forward edge, tips pointing back toward the tail like snake scales, leaving dark openings. They stay attached to the sleeve and move with it. They are short (0.17 body radii) and blunt-angled (≤ 50°), not needles. In the macro they press into the villi and mucus layer and do not puncture it. |
| Moves by alternating **inflation, anchoring, extension and release** | One crawl schedule (`robot/state.ts`) drives every in-gut shot: anchor the tail, extend, anchor the head, release the tail, contract (the tail is drawn forward), release the head. The tail moves only while contracting and the head only while extending, so nothing slides without a reason. |
| Can **bend and steer** | S3: the robot follows the gut through a bend, and the chambers on the outside of the bend glow harder. S5: the extender bends to aim the tip at the wall. |
| A **central channel** for imaging and intervention tools | The flat head face has a dark central channel, with an imaging lens set in its wall. Both tools in S5 come out of it. |
| ~**2 m** travelled through **pig** small intestine (preclinical) | S4 is an explicit animal-study diagram: a pig in side view, its coiled small intestine, a tag reading "PIG STUDY · MIT 2026". The robot travels a highlighted stretch with one tick per foot, and "6+ FEET" lands on "FEET". 2 m ≈ 6.6 ft, so "over six feet" is consistent. |
| Demonstrated **imaging, tissue biopsy, localized fluid delivery** | S5: biopsy forceps reach the mucosa, open, bite a tiny sample (a small notch is left in the villi) and retract holding it. Then a fine injection needle releases a small, contained bloom of blue marker dye into the mucosa and submucosa. Imaging is implied by the lens in the head face. |

## Restrictions in the brief, and how V1 meets them

- [x] **No sharp metal blades puncturing tissue.** The scales are soft sleeve flaps (teal, the same material as the
  sleeve). They are short and angled back, and they press into the villi layer without entering it. The only sharp
  object is the injection needle in S5, a real tool shown at its real job, with only its tip entering the mucosa.
- [x] **Not an independent metallic parasite or an untethered nanobot.** The robot is pale grey silicone with teal
  sleeves, and its tether is visible in every shot.
- [x] **Opening and ending.** These show a stylized, human-looking intestinal tunnel as an illustration of possible
  future use. No human body, patient or clinic is shown.
- [x] **The real experiment is shown explicitly as a pig study.** S4 has the pig, the tag, and the travelled stretch.
- [x] **No implication of human clinical use.** The narration says "still experimental". S6 shows the device as a lab
  prototype in a test tube on a bench, with its controller.
- [x] **No MIT images altered or reused.**

## Deliberate simplifications (stated so V2 can revisit)

- **Proportions.** The lumen radius is 2.0 body radii, chosen so the anchors can be seen swelling to meet the wall.
  The paper's real dimensions were not available here.
- **Kirigami pattern.** The flap shape, count and pop threshold are illustrative. The real sleeve geometry (cut
  pattern, number of scales) should be matched to the paper's figures in V2.
- **Chamber layout.** The four chambers are shown as four longitudinal lobes of one extender between the anchors. The
  brief says "a pneumatic body containing four inflatable chambers". If the paper assigns chambers differently (for
  example, some to the anchors), V2 should follow it.
- **Tool geometry.** The forceps cups, needle gauge and dye colour are generic endoscopic instruments, not the paper's
  exact tools.
- **The pig diagram** is a simplified anatomical path, not to scale. The intestine coil is schematic.
- **"MIT 2026" on the tag** follows the brief's source. If the study was a collaboration, V2 should match the paper's
  affiliations.

## Checklist before publishing

- [ ] Re-read the paper (doi:10.1126/scirobotics.adt2230) and confirm: the 4-chamber layout, the anchor mechanism
  (head and tail), the kirigami scale shape, the 2 m distance, that the pig studies were in vivo or ex vivo (V1 says
  only "tested it inside pigs"), and that biopsy and fluid delivery were demonstrated in those studies.

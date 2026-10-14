# V1 → V2 change log

V1 is preserved unchanged:

- its source compositions (`Main`, `Preview`, and the V1 scenes in `source/src/scenes/`);
- its renders in `exports/`;
- its split backup in `backup/v1/`;
- its captions, upload text and thumbnails.

V2 lives in `source/src/v2/`, `audio/v2/`, `tools/v2/` and `production/v2/`, with files suffixed `_v2`.

## Picture

- **Robot.**
  - Before: V1's flat 2D cut-out figure.
  - Now: one 3D-projected rig (RIG-F02) used in every shot. It has graphite/gunmetal F.02 panels, a visor, actuator
    caps and five-finger hands, plus F.03, virtual and performer variants (`production/v2/ROBOT_REFERENCE.md`).
  - Feet are planted by IK. Jumps follow a fixed-flight-time ballistic arc with speed ramps, so slow motion never
    bends the trajectory.
- **Opening.**
  - Before: V1's slide-like cold open.
  - Now: a choreographed 20 s with 10 compositions: the foot driving off the edge, the airborne three-quarter, a
    tracking descent with one speed ramp, an impact with rim occlusion (no upright pause on the liquid), a mechanical
    back-plate detail, one attribution, a second jump seen through the control-room glass, a ladle-rim → actuator-cap
    match cut into the workshop, the newer-model hand-off, and an iris into the simulation.
- **Scenes rebuilt as actions.**
  - Retirement options: crate + padlock + shutter; exploded view → a queue of robots; bin rim → ladle rim.
  - Foundries: stamped crates.
  - The phone: a paraphrased post and the quoted reply.
  - The film: clapperboard → chain → the foundry's crane chain.
  - Training: one large sequence (trial, three checks, rewind, correction, parallel lanes, faceplant gag, performer arc).
  - Sensor → signal → joint.
  - Sim-to-real: the same shot transforming both ways.
  - Variation: shown as consequences on the arc.
  - Airbag rehearsal.
  - The EM noise knocking out a monitor.
- **New sections.**
  - The limit (B6): the jump hangs in a spotlight, then a pull-back to one arc, one target and the people supervising,
    then one factory comparison.
  - The ending (B7): a last walk to the edge, an outline trace on "the shape", a freeze, a reverse angle on the crew,
    three people choosing the ending / target / score, convergence on the ring, the entry in front of crew silhouettes,
    and a top-down settle under a target ring that opens into a 2.5 s brand sting.
- **Pacing.**
  - About 83 framings over 3:53.5, mostly 2–4 s each, plus purposeful match cuts (rim → cap, bin → ladle,
    movie chain → crane chain, sim ↔ steel, ring → sting).
  - Whooshes are limited to 7, all on real whip or wipe transitions.
- **Text removed:**
  - SECOND SOURCE cards
  - QUESTION cards
  - persistent ILLUSTRATION footers
  - long disclaimers
  - SIMPLIFIED labels
  - the SHOWN / NOT SHOWN board
  - the closing question card
  - all slider dashboards, counters, scores and curves

  The two conceptual sequences each get one short entrance label.

## Script and claims

- **Hook and length.** The hook was rewritten around the brief's opening line. The narration is tighter: 3:50.5 of
  voice vs 4:12, at natural speed (no sped-up samples).
- **Removed lines:**
  - "thousands of virtual robots… millions of times" (C17)
  - the long "what it shows / what we haven't seen" passage
- **Limit now spoken in about 10 s (C27, C31).** The failure-rate / independent-check caveat (C26) moved to the
  description notes.
- **Ledger.** See `research/claim_ledger.md` → "V2 changes".

## Sound

- **Narration.** New V2 narration from the same Test Voice, resolved by ID; 28 takes, 7 selected.
- **Effects.** A physical sound design for the hook: furnace bed, grating steps, push-off, sub boom with a heavy molten
  impact, sizzle. Ten new effect kinds were generated and chosen by measurement.
- **One cue system.** The cue sheet (`source/src/v2/sfx_v2.ts`) is built from the same cues and motion objects as the
  picture.
- **New sectioned score:**
  - tense hook with a dropout on impact;
  - the curious rhythm after the payoff;
  - simulation marimba;
  - a darker groove for "messy";
  - a suspended hold for the spotlight;
  - piano reflection;
  - a pizzicato for the people;
  - a resolution under the sting.
- **Mix.** Ducking for both score and ambience; −15.0 LUFS, −1.5 dBTP.

## Deliverables added

- `exports/FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4` (master)
- `exports/FGW_RobotsDestroy_v2_1080p_SHARE.mp4` (share copy)
- `captions/FGW_RobotsDestroy_v2.srt`
- `upload/UPLOAD_TEXT_v2.md`, `upload/chapters_v2.txt`
- V2 thumbnails
- `production/v2/SHOT_PLAN_V2.md`, `production/v2/ROBOT_REFERENCE.md` with its sheet
- the V2 section of `QA_REPORT.md`
- `backup/v2/` (split master with SHA-256)

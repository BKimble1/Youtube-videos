# HOOK 02: Underwater cyborg cockroach: notes

Line (locked): "Scientists gave a cockroach a diving suit… and kept it underwater for hours."
Output: `exports/FGW_HOOK_02_UNDERWATER_COCKROACH.mp4`. Scene: `source/src/h02/`. Audio: `tools/audio/h02.py`.
Event times live in `source/src/h02/world.ts` (`EV`, word starts read from `h02_words.json` through `wordAt`) and are
mirrored in `h02.py`. The camera path is in `camPath.ts`.

## Shot plan (one continuous take, no cuts)
- **0–0.5 s.** Frame 0: a large suited Madagascar hissing cockroach walking right on a submerged concrete walkway,
  seen from the front three-quarter view. Its legs are already mid-stride. Light shafts, caustics, drifting particles
  and bubble streams make the water obvious at once. The clear suit, the rear generator and two of the tubes with
  their amber seals are visible in frame 0.
- **0.5–2 s.** The camera follows as the insect walks down a gentle ramp and the water darkens toward deeper blue.
  From 1.0 s the follow swings behind and above the insect, and the push begins. The ribbed abdominal suit, the
  generator on its ballast block, and the four tubes running over the suit to the thoracic spiracles come into view.
  Sync: the swing starts on "cockroach" (0.90). The suit and tubes are fully revealed through "diving suit" (1.62–2.32).
- **2–4 s.** One continuous push into the apparatus.
  - From 2.45 s the camera closes on the generator. At 2.6 s oxygen bubbles nucleate on the dark MnO₂ sponge in the
    peroxide, then rise into the gas space.
  - From 2.95 s gas pulses run forward in all four tubes, and the camera follows them down the suit's flank.
  - On "underwater" (3.14 s; first pulse reaches the sealed spiracles at 3.46 s) a cut window opens on the thorax side
    at 3.42 s. It shows the spiracle atria, the lateral tracheal trunk and branching tracheae among the muscle.
  - Cyan oxygen spreads from both spiracles into the branches, from 3.62 s to 4.30 s. The fine branches are reached on
    "hours" (4.02 s).
- **4–6 s.** At 4.32 s the camera pulls back past the same tubes and suit while the window closes (4.38–4.88). A
  fallen concrete slab moves into frame overhead and its shadow sweeps over the insect: it is walking beneath it. The
  camera swings to the front three-quarter view. In the last frame the head and antennae are out from under the
  slab's front edge, and the insect is still walking forward.

## Transitions (outgoing → incoming → new information → kept)
1. Front three-quarter walk → rising rear three-quarter follow → suit, generator and four tubes revealed → the same
   insect, the walk and the water.
2. Rear follow → generator close-up (continuous push) → sponge, peroxide and oxygen bubbles → the suit, the tubes leaving
   the manifold.
3. Generator → flank of the suit (pan along the tubes) → gas travelling inside the tubes to the sealed spiracles →
   the tubes and the zoom direction.
4. Spiracles → local cut window on the thorax → tracheal tree filling with oxygen → the tubes and seals still on top.
5. Window → pull back → the fallen slab overhead, the insect beneath it, walking on → the suit, the tubes and the walk.

## Science notes
- Shown, after Fan et al., *Nature Communications* (June 2026), "Underwater Suit-Wearing Cyborg Insect Capable of
  Hours-Long Diving and Terra-Aqua Travel" (NTU Singapore and Waseda University; as summarised in the creator's
  research brief, which draws on the NTU release, Live Science, Scientific American, Nautilus and TechXplore):
  - a Madagascar hissing cockroach: wingless, glossy dark brown, pronotum shield, segmented abdomen, 6 spiny legs and
    long antennae;
  - a soft, translucent, ribbed waterproof shell over the abdomen;
  - at the rear, an oxygen generator: hydrogen peroxide with a dark manganese-dioxide-coated sponge releasing O₂
    bubbles;
  - a small ballast weight under the generator, so the insect walks on the bottom;
  - four thin silicone tubes (two per side) to the four thoracic spiracles, each sealed with an adhesive bead;
  - inside, gas goes from the spiracles into tracheae (taenidial rings drawn as banding) and fine tracheoles among the
    muscle;
  - a flooded test tunnel with rubble, as a stand-in for the search-and-rescue setting.
- Deliberately not shown:
  - lungs, or bubbles travelling into a "lung";
  - bubbles inside the gas tubes (they carry gas, so the flow is drawn as bright pulses, not bubbles);
  - a vent dumping gas from the suit (I couldn't confirm one from the brief; the escaping bubbles come from cracks in
    the floor);
  - the electrode backpack (left out so the suit stays the hero);
  - any on-screen numbers. "Hours" (about 2–3 h, against about 2 min for unsuited controls) is carried by the
    narration only.
- The suit's exact shape, tube routing and generator layout are an illustrative reconstruction from the written
  description. I did not have the paper's figures.

## Assets
- Reused from Cyborg Cockroach V5 (copied into `source/src/h02/rig/`), from
  `ref/cyborg-cockroach/.../source/src/`:
  - `v2/roach/Roach2D.tsx`, `v2/roach/ortho.ts`, `rig/roach.ts`, `lib/v3.ts`, `lib/ease.ts`;
  - `lib/loft.ts`, trimmed;
  - shading from the shared `ink.tsx` and `color.ts`.
- Adaptations of the canonical roach:
  - a longer, slightly narrower and lower abdomen with nine tergite seams, to match the hisser's proportions;
  - a sloped-ground path, with feet planted on the true ground height;
  - a `back` slot, and a contact shadow placed on the path.
- Newly drawn:
  - `Suit2D.tsx`: the suit shell, the generator and its contents, the ballast, the four tubes with gas pulses, and the
    seals;
  - `Trachea.tsx`: the cut window, muscle, fat body, spiracle atria and tracheal tree;
  - `Env.tsx`: the tunnel, ramp, caustics, rubble, particles, bubble streams and the slab;
  - `cam.ts` and `camPath.ts`: an orthographic insect view with a matching perspective view for the environment.

## Audio cues (`tools/audio/h02.py`, fx_lufs −27)
- **Bed (whole clip):** muffled underwater bed, a very quiet low pad, and distant bubble streams.
- **Foot plants:** muffled chitin ticks every 0.342 s (13 mm of travel at 38 mm/s), lowered while the camera is
  inside the apparatus.
- **2.45 s:** O₂ bubbling at the sponge, starting just before the 2.60 s fizz.
- **2.60 s:** peroxide fizz.
- **2.95 s:** gas flow along the tubes, with two soft pulses.
- **3.42 s:** soft tissue sound as the window opens.
- **3.46 and 3.56 s:** pressure puffs at the two spiracles.
- **3.62 s:** faint shimmer as oxygen fills the tracheae.
- **4.32 s:** low pressure swell during the pull back.
- **4.90 s:** bubbles past the slab.
- No music, no whooshes.

Measured: voice −15.97 LUFS, FX bus −29.92 LUFS (after ducking), mix −16.72 LUFS, peak −1.0 dBFS.

## QA (rendered file, `qa/h02/qa.json`)
`all_pass: true`; 180 frames, 1080×1920, 30 fps, h264 yuv420p, AAC; audio 6.016 s; voice onset 0.018 s;
mix −16.73 LUFS; peak −1.0 dBFS; motion per second [3.12, 4.65, 6.76, 10.97, 9.10, 3.03]; longest static run 0
frames; no frame jumps over 18.

Fixed between passes:
- **Pass 1, scale and generator.** The insect was too small in frame 0, so I enlarged and reframed it. The suit was
  opaque, so I made it more translucent. Heavy box straps and pill-shaped end caps hid the generator, so I removed the
  straps and made the caps flat bands. I also enlarged the sponge and the bubbles.
- **Pass 1, slab.** The slab read as a floating plank or a looming wall. I made it thicker, wedged on a rubble
  support, cut it back near the camera, and changed the final view to the front three-quarter so the insect visibly
  comes out from under the slab.
- **Pass 1, background.** I added fog and blur to near rubble in close-ups and made the caustics more organic.
- **Pass 2, slab pop.** QA flagged a frame jump at frame 144: the slab's shadow popped in, and its faces were picked
  with an orthographic test that disagreed with the perspective view. I switched to perspective face culling (the
  slab's underside now shows from below) and made the shadow volume continuous.
- **Pass 2, tubes.** The far tubes showed as floating fragments. I now draw only each tube's visible run from the
  manifold, draw the far side first, and route the tubes over the top of the suit so all four show at the generator.

## Known limitations
- The ramp down to "deeper" water is gentle. Depth is mostly read from the darker water and the receding light,
  not from a steep slope.
- Orthographic insect over a perspective environment:
  - The insect has no perspective of its own. The match holds at the target depth, but in extreme close-ups the floor
    pattern under the far legs can drift slightly against the feet.
  - Near rubble and the slab's near end grow large during close-ups. They are blurred or fogged to keep them from
    distracting, but the stepped far support of the slab is still visible as a grey block at the top right during the
    thorax close-up (about 3.6–4.4 s).
- The tubes cross over the lower-left part of the tracheal window, because they really lie on the outside of the
  body. They cover some of the trunk near the spiracles.
- The suit and generator shapes are a plausible reconstruction, not a copy of the paper's hardware photos.

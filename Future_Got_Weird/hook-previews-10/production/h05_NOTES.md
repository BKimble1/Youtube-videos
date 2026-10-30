# HOOK 05: Bombardier beetle (notes)

Output: `exports/FGW_HOOK_05_BOMBARDIER_BEETLE.mp4` (6.000 s, 180 frames). Source: `source/src/h05/` (timeline in
`scene.ts` → `EV`, `PULSES`, `SPRAY_PULSES`, `CAMK`). Audio: `tools/audio/h05.py`.

## Shot plan (one continuous shot in one 3D world, mm units)
- **0–0.5**: frame 0 shows a large orange and blue-black *Brachinus* in the foreground and a large ant (3/4 view,
  mandibles open) lunging at its rear. The abdominal tip swings onto the ant (0.06–0.34 s). The first pulsed
  discharge starts at 0.38 s and reaches the ant's face at 0.44 s.
- **0.5–2.0**: the spray is a beaded droplet jet with vapour, lasting until 0.86 s and running across "shoots" (0.67).
  The ant flinches (head up, antennae swept back), backs off and cleans its right antenna with its foreleg. From 0.92 s the camera
  follows the hazy jet path back to the tip ("boiling chemicals…") and pushes in. At 1.7–2.4 s the abdomen turns
  semi-transparent in place, in a soft clearing that grows from the gland region.
- **2–4**: the cutaway in place shows both pygidial glands: secretory lobes → reservoir → muscular valve → thick-walled
  reaction chamber → outlet → tip opening. The valve opens on "from" (2.45 s). The first explosive pulse comes at
  2.75 s, on "explosions". Ten pulses follow, accelerating from 0.24 s to 0.13 s apart. On each pulse the valve opens,
  reactants flow in, enzyme specks are released, the contents shift to hot orange-white with vapour bubbles and the
  chamber bulges. The valve then snaps shut, a hot slug runs down the outlet and a small jet puff leaves the tip.
- **4–6**: the cutaway closes as the camera pulls back (4.15–4.75 s, after "body" at 4.19 s). The ant comes in again
  and the beetle fires a second burst (4.72–5.08 s; hit at 4.78 s). The ant flinches and backs away along a curve,
  turning aside with its foreleg drawn through its antenna. The clip ends on the beetle still standing in place,
  with breathing, antenna motion and a small leg step, under a drifting quinone haze.

Captions: `capY` 1560 for both phrases, which keeps them below the action in every frame.

## Transitions
| outgoing | incoming | new information | kept |
|---|---|---|---|
| wide two-animal view | push along the haze trail to the tip | where the spray comes from | same world, beetle, ant and haze |
| exterior abdomen | in-place translucent clearing (no cut) | paired gland anatomy | elytra outline, striae and tip stay visible |
| chamber close-up | pull-back with the cutaway fading | a second burst, the ant retreats | same camera path, the jet from the same tip |

## Science
- Shown: the beetle is about 1 cm long. It has an orange-red head with compound eyes, sickle mandibles, maxillary
  palps and 11-segment filiform antennae; an orange cordiform pronotum; truncate, blue-black ridged elytra; six orange
  legs with tibial spurs, five tarsomeres and paired claws; and a mobile abdominal tip that aims the discharge. The
  gland system is paired, with reservoir (hydroquinones + H2O2) → valve → reaction chamber lined with
  enzyme-secreting cells → opening at the tip. The discharge is pulsed and pressure-driven: each pulse closes the
  valve, which then reopens. The spray is a hot, pale yellowish-white droplet mist with vapour and a lingering haze.
  The ant has 3 body regions, 6 legs and elbowed antennae; it flinches, grooms and retreats.
- Deliberately not shown: flames, fire colours in the exterior spray (heat appears only as a colour shift inside the
  chamber), and text labels. The real rate of about 500 pulses per second cannot be shown at 30 fps, so the pulses are
  slowed to a readable rhythm (about 4–8 per second).
- Sources: Eisner & Aneshansley 1999, PNAS 96:9705 (aimed spray); Dean et al. 1990, Science 248:1219 (pulsed
  discharge, ~500 Hz); Arndt et al. 2015, Science 348:563 (pulse mechanism, valve closure by pressure);
  Aneshansley et al. 1969, Science 165:61 (about 100 °C).

## Assets
- Reused (copied into h05): the zombie-ant ant rig, drawing and gait (`zombie-ant/source/src/ant/rig.ts`,
  `ant/draw.tsx`, `world/gait.ts` → `h05/ant/`; the gait was edited to respect the ant's scale), plus `core/draw3.tsx`
  and `core/frame.ts` → `h05/core/`. Shared files used read-only: `three.ts`, `color.ts`, `ink.tsx`, `lib.ts`.
- Newly drawn: the beetle rig and drawing (`h05/beetle/`), the gland cutaway (`h05/glands.tsx`), the spray and vapour
  (`h05/spray.tsx`) and the soil set with depth-of-field bins (`h05/env.tsx`).

## Audio cues (`tools/audio/h05.py`, fx_lufs −26.5)
Forest air bed with a quiet low pad. Ant ticks and rustle at 0.0 s. Burst 1 at 0.38–0.86 s: a pulsed spray hiss with
pops every 0.042 s and a sizzle. Ant flinch squelch at 0.46 s. Valve creak and inflow at 2.45 s. A chamber pop and
thump on every one of the 10 PULSES (2.75–4.25 s), with a reaction sizzle under them. Burst 2 at 4.72–5.08 s. Ant
retreat rustle and ticks from 5.0 s. No music and no whooshes.

## QA (rendered file)
`all_pass: true`, no failed checks. Voice onset 0.019 s; mix −16.65 LUFS; peak −0.99 dBFS. Motion per second:
[3.30, 6.25, 3.80, 2.90, 7.49, 4.76]. Longest static run: 0 frames. Frame jumps over 18: none.

Fixes between passes:
1. Clipped the elytra highlight to its shape and made the elytra less boxy. Widened the beetle's stance.
2. Recomposed the opening. The beetle's head had been cut off at the right edge; the camera is now at az 58 with
   cy keys added.
3. Vapour had read as glowing orbs. It is now dimmer and smaller, spread along the jet path, so a haze trail links
   the ant to the tip during the track-back.
4. The cutaway was too opaque. The shell now shows ghost striae, and the clearing is local.
5. Pulled the camera back earlier so the second burst is framed. Faster cut-out.
6. The ant had been head-on in frame 0, where its forelegs read like extra limbs. Its approach was rotated to a 3/4 view.
7. Scaled the ant to 0.88 and made it recoil farther, so it no longer dominates the track-back.

## Known limitations
- Around 1.6–2.3 s and 4.3 s, part of the ant (legs and mandibles) is cropped at the top edge as the camera moves in.
- The far gland is partly hidden behind the near one in the cutaway.
- The tip's swing at 0.06–0.34 s is small on screen because the elytra cover the tip from the opening angle. The aimed
  tip is clearly visible from about 0.6 s.
- The pulses are slowed for readability. The real pulse rate is about 500 per second.

# HOOK 08: infrared contact lenses (notes)

Export: `exports/FGW_HOOK_08_INFRARED_CONTACTS.mp4`. Source: `source/src/h08/` (`Hook.tsx`, `Lead8.tsx`, `Section8.tsx`,
`Emitter.tsx`, `geo.ts`). Audio: `tools/audio/h08.py`.

## Shot plan (one continuous shot, camera locked on the lens point where the signal enters)
- **0–0.5 s.** The red-haired Weird Crew lead's face, close. The eye wears a nearly invisible soft lens (thin rim and a
  glint sweep), and the upper lid is already closing. A small through-hole LED in front of the face is on: its die glows
  faint red, and deep-crimson dashed packets are on their way to the eye. The lid is shut by 0.45 s.
- **0.5–2.0 s.** Packets reach the closed lid and the lid lights faintly green from within (about 0.6 s). The camera
  pushes in. On "detect" (1.20) the closed lid line parts into a feathered slit that widens into a side cut through the
  eye. The lids stay closed over the lens on the cornea. Packets cross the lid into the lens, the lens glints green, green
  packets cross the pupil, and a green spot lights on the retina (pulses arrive at 1.30 and at "infrared" + 0.3).
- **2.0–4.0 s.** A continuous dive (from "signals" − 0.24 to "even" + 0.07) into the lens material at the entry point.
  The lid tissue is on the right, the hydrogel (polymer strands and caustics) in the middle, and hexagonal core-shell
  nanocrystals throughout. The marked crystal catches two near-infrared packets (its lattice fills deep red) and
  releases ONE green packet toward the pupil ("eyes" − 0.16). On "closed" (3.96) a run of crystals converts together.
- **4.0–6.0 s.** Pull back out through the section (green to the retina again). The slit closes back into the lid
  (4.92–5.42) and we return to the closed-eyed face. The LED keeps flashing, the lid keeps glowing faintly green in step,
  and a slight smile appears. The camera is still drifting out on the last frame, with a packet in flight and the lid lit.

## Transitions
- Face, eye closing → closed lid: the lid shuts in place (lashes flip down); what's new is the lid glowing under the packets.
- Closed lid → side section: the lid line itself parts into a feathered slit that opens into the cut (no rim, no ring), while the face's own lid features fade under it. What's new is the eye's interior and the lens on the cornea. Kept: the brow, face, camera direction and packets.
- Section → lens material: a continuous dive to the same entry point (the camera anchor never changes). What's new is the crystals and the absorb/emit physics. Kept: the lid on the right and the packets arriving from the upper right.
- Material → section → face: the same path reversed; the slit closes along the lid line. What's new is the closed eye still glowing in step with the LED.

## Science
- Shown: an NIR LED flashing a simple on/off pattern. Its light is drawn as stylised dark-red dashed packets, not a
  visible beam on the scene. The light passes through the closed lid. Lanthanide upconversion nanocrystals in a soft
  hydrogel lens each absorb two NIR packets and emit one shorter-wavelength green packet (Er³⁺ green is a two-photon
  process, the anti-Stokes "several in, one out"). The green light reaches the retina as a dim, diffuse spot and makes the
  lid glow faintly. The wearer gets a flicker, not an image.
- Deliberately not shown: no thermal imaging, no night-vision scene, no image of the room "seen" by the wearer, no HUD,
  rings, labels or radial diagrams. Packets never touch anything except the lens. The LED only shows a faint red die, as
  real 850 nm LEDs do.
- Source: Ma, Xue et al., USTC, *Cell* (May 2025). Upconversion contact lenses let wearers detect flickering NIR
  (about 800–1600 nm), patterns and direction, and do so better with their eyes closed.

## Assets
- Reused and adapted from `.../ref/infrared-contacts/.../source/src/`:
  - `art/Lead.tsx` (head, hair, eye geometry, lids, lashes) and `v2/Eye2.tsx` (iris and lens dome) → `h08/Lead8.tsx`.
    Changes: thin non-scaling contour, a cooler moody key, a lens shell over the iris, a green inner lid glow, gaze under
    the lid, brow reaction, and fading of the eye features under the cutaway.
  - `art/Section.tsx` and `v2/Section2.tsx` (eye section, closed lid geometry, cornea, contact shell, strands, hex
    crystals, hero lattice) → `h08/Section8.tsx`. Changes: a feathered slit/clearing instead of the cream ring; larger,
    sparser crystals; per-crystal absorb/emit states; lid fibres; no energy rings.
  - `lib.ts` (matrices and smooth paths) → `h08/geo.ts`.
- New: `Emitter.tsx` (an LED with its internals, clip and arm), the out-of-focus lab background, constant-screen-speed
  wave packets, and a monotone (PCHIP) log-zoom camera.

## Audio cues (`tools/audio/h08.py`, fx −27 LUFS)
- **Bed:** lab room tone and a low beating pad.
- **0.05:** the lid closing (soft squelch).
- **LED ticks:** about 0.32 s before pulses 1, 7 and 8.
- **Conversion pings and shimmer:** on pulse arrivals 0.20, 1.30, 1.90, 4.30, 5.00 and 5.70.
- **Cutaway:** opens at 0.95 (squelch and creak).
- **Dive:** a low swell at 1.82.
- **Absorption clicks:** 2.93/3.17 and 3.64/3.84; green emission pings at 3.36 and 3.98.
- **Crystal crackle:** under the two material pulses.
- **Burst shimmer and ping:** at 3.98.
- **Cutaway:** closes at 4.97.

## QA (rendered file)
`qa.json` summary:

```json
{"frames": 180, "audio_decoded_s": 6.016, "voice_onset_s": 0.008, "mix_lufs": -16.37, "sample_peak_dbfs": -0.99,
 "motion_mean_per_second": [3.656, 5.884, 10.879, 3.26, 11.342, 6.406], "longest_static_run_frames": 0,
 "frame_jumps_over_18": [[147, 18.46]], "all_pass": true}
```

Fixes between passes:
1. The camera anchor ignored the head's breathing tilt, so the dive landed off the lens. The anchor is now tilted.
2. The face-level packets were bunched and crossing. They are now spaced at 0.12 s and ride one line at the face scale.
3. A beam polygon read as a stripe across the face, so it was removed.
4. A "bubble" highlight on the closed lid was removed.
5. The dark "air" disc in the cutaway is now skin, and the face's lid features fade under it.
6. The feather made the back of the eyeball see-through (a stray grey stroke), so the clearing was re-centred and enlarged.
7. The circular dissolve became a slit opening along the lid line.
8. The material view had too many converting crystals and small packets. There are now fewer events, bigger packets and a larger hero crystal.
9. The dive and pull-out were lengthened, which cut the frame jumps from two to one marginal (18.5).
10. The end framing was adjusted to keep the LED in view.

## Known limitations
- At frame 0 the LED's clip and arm are off the right edge; only the LED dome and body are visible. The LED is mostly
  in frame at the end.
- The cutaway is a side section seen in a 3/4 face (the channel's V2 convention). The slit opening motivates it, but it
  is still a change of representation inside the clearing.
- The pull-out from the material (about 4.6–4.9 s) is fast: one frame has a luma jump of 18.5 (reported, not a failed check).
- The packets travel at a fixed screen speed, so their implied physical speed varies with the zoom (stylisation).
- The lid glow is an artistic reading of "the closed eyelid lights faintly from within". The study reports perception,
  not a visible glow on the lid.
- The face is the channel's flat style. The large cheek area is simple.

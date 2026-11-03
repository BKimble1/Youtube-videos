# Bone Glue V2: plan, beats and module contracts

V2 rebuilds V1 around one idea: **every beat shows a physical change you can read on a phone.** The narration is the
approved text, verbatim (`production/NARRATION_LOCKED.txt`). The style is the same: Weird Crew 2D vector, navy ink
(`INK`), cel shading lit from the upper left, and restrained depth layers through the pinhole dolly (`source/src/camera.tsx`).

## What changes from V1, and why

| V1 problem | V2 answer |
|---|---|
| A thick teal "toothpaste" bead lies *on top of* the cracks | The adhesive fills the **gap between the two broken faces** (about 0.8–1.0 mm), wetting just past each face. It connects the fragments and doesn't sit on them. Geometry: `art/seams.ts`. |
| The opening only lays glue; nothing is positioned or secured | 0–2 s preview: the probe pushes a **small displaced wedge fragment** home, glue runs along its seams, then the probe eases away while the fragment stays put. The seams stay visible. |
| The glue could be read as pulling bone into place | The wedge is seated by the probe *before* glue reaches its seams. Glue never moves anything. |
| "Researchers actually did it" was mostly a look at the surgeon's face | A precise action: the gloved hand runs one glue stroke up the styloid seam and lifts the applicator. The probe holds that fragment. Little face. |
| The oyster match was on a contact edge, and the cement looked like a cushion | Water and particles stream past while the oyster stays fixed. A soft cutaway window **exposes the attachment interface** (shell / thin cement band / rock). That band matches the bone glue band's **screen position and shape** (`production/v2_match_band.json`). |
| Wet beat: long red strands and repeated floating drops | A thin, translucent fluid sheet flows across the bonded seam. Ripple lines bend over the glue band, the glue edges stay sealed to both faces, and the fracture geometry stays readable. No strands and no droplets. |
| Fixation vs healing was blurred | **"secured … three minutes":** the probe lifts off the fragment it was holding; nothing moves; the seams stay visible and the glue sets from gloss to satin. **"months to heal":** an obviously accelerated healing sequence in the same orientation and framing as the opening. |
| Healing was an opacity fade | Pale woven new bone advances **from both broken faces** into the glue gap with toothed fronts. The glue band gets thinner, breaks into islands and is gone. Then remodelling turns the woven bone mature and closes the seams (`seams.growth`). |
| Blue sleeve wipe at the loop | The ending reveals the recovered wrist and the fingers move, then the camera pushes back in to the **opening's bone framing**. The cut to frame 0 matches framing and camera direction. The healed bone is never shown breaking. |

## Beats (provisional take-2 word times; everything is keyed to `word()` so it follows the final alignment)

| t (s) | Words | Picture |
|---|---|---|
| 0.00–0.40 | "If you" | **Frame 0:** a close-up of the distal radius (CAM0, w ≈ 26 mm): the transverse seam is half glued from the left; the applicator tip touches the seam at the glue front. The small wedge fragment (radial border, below the transverse seam) sits visibly out of place: shifted out of the bone border, its seams gaping. The probe tip presses on it. 0.04–0.38: the probe pushes it home, and its gaps close to an even seam. |
| 0.40–1.30 | "shattered your wrist," | The applicator runs right along the transverse seam to the radial border (glue fills the gap behind the tip), hops to the lower end of the wedge's seam, and runs up it to the junction. Every seam around the wedge is now teal. |
| 1.30–1.90 | | The probe eases away (lifts, its contact shadow separates, it backs off to the lower right). The wedge doesn't move. The seams stay visible, so this is fixation, not healing. |
| 1.25–4.00 | "imagine gluing the bones back together." | A smooth pull-back with the fracture kept large: the incision, the palm-up hand and forearm (the wrist reads by "together"), then the surgeon's two gloved hands at the right. Meanwhile the probe moves to the styloid fragment and holds it, and the applicator moves to the foot of the styloid seam. |
| 4.08–5.95 | "Researchers actually did it." | A slow push toward the incision. The gloved right hand runs one precise glue stroke up the styloid seam, the probe holding that fragment, then lifts the applicator cleanly. At most a glimpse of the masked face at the frame edge. |
| 5.95–7.98 | "They developed an experimental glue" | The applicator withdraws. A no-slip dive onto the glue band in the transverse seam (bone above, glue, bone below). |
| 7.98 | "inspired" | **Match cut:** glue band → an oyster on a rock underwater (medium shot), its shell-to-rock attachment line on the same screen line. |
| 7.98–10.33 | "inspired by oysters sticking to rocks." | Water, particles and weed stream past and the oyster doesn't move. The camera pushes toward its base, where a soft cutaway window opens briefly onto the section: shell layers, a thin cement band, rock. |
| 10.33 | "It" | **Match cut:** the cement band → the glue band, same screen position and shape, same push direction. |
| 10.33–13.61 | "It grips bone even inside a wet, bloody wound." | Macro. A thin translucent red-tinted fluid sheet flows across the bonded seam. A stronger wash passes around "wet, bloody", and the band's edges stay sealed to both faces. The camera eases back a little so the seams' T-junction and both fragments read. |
| 13.61–15.35 | "In one reported wrist case," | A no-slip pull-out to the fixation framing (w ≈ 80): the incision, every seam teal, the probe holding the styloid fragment, the surgeon's left hand. |
| 15.36–18.72 | "surgeons secured the broken pieces in just three minutes." | On "secured", the probe lifts off and withdraws with the hand. Nothing moves; the seams are still plainly there. On "three minutes", the glue's gloss settles to satin. |
| 18.80–21.04 | "The fracture still needed months to heal." | The incision closes with sutures; the skin goes translucent over the bone. A push into the healing framing (the opening's orientation, w ≈ 30). Accelerated: hematoma, then soft callus at the margins. |
| 21.12–24.73 | "But as new bone grows, the glue gradually disappears." | Pale woven bone advances from every broken face into the glue; the bands thin, break into islands and are gone. |
| 24.80–25.90 | "Your body replaces" | Remodelling: woven bone matures and the seams close to faint lines. |
| 25.3–27.4 | "the stuff holding you together." | Ease out to the recovered wrist (opaque skin, faint scar); the fingers make one small natural flex and relax. |
| 27.4–end | (tail) | Push back into the wrist through translucent skin onto the healed radius in the **opening's framing and direction**. The loop cuts to frame 0. |

Target length: the narration's end plus about 1.5 s (28.9 s for take 2).

## Module contracts

- **Geometry:** `source/src/art/seams.ts` covers seams, faces, gaps, the wedge's pose and transform, glue band runs and growth fronts.
- **State types:** `source/src/v2state.ts` defines `BoneState2`, `Heal2` and `InstrState2`.
- **Composition inside the wrist layer (depth 0), back to front:**
  1. `FieldDetail` (kept)
  2. `FractureBone` (B1): cavity bed, static fragments, the moving wedge, broken faces, glue
  3. `HealLayer` (B2): hematoma, soft and hard callus, new bone in the gaps, remodelling
  4. `WetFilm` (B3)
  5. instrument contact shadows (B4: `ProbeShadow`, `AppShadow`)
- **Above the skin (Z_INSTR):** `SurgeonFront` / `SurgeonBack` with the probe in the left hand and the applicator in the right (B4).
- **Oyster world:** `OysterWorld` with the attachment window and the match band (B5).

Builders: B1 fracture and glue, B2 healing, B3 wet film, B4 probe and surgeon's hands, B5 oyster interface. Story,
camera, Scene, captions, sound and loop: the lead.

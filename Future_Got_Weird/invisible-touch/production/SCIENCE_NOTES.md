# Invisible Touch: science notes and accuracy checklist

## What is real

Mid-air ultrasonic haptics works like this:

- A flat **phased array** of ultrasonic transducers sends out sound waves. They are usually 40 kHz, which is
  inaudible. Each transducer is a small speaker can.
- The firing times (phases) are set so that every wave arrives at one point in the air **in step**.
- At that **focal point** the sound pressure is high enough to produce a small **acoustic radiation pressure** on the
  skin.
- The focus is **modulated**: switched on and off at a rate the skin is sensitive to, or swept quickly along a path.
  This turns the pressure into a feelable **vibration / pressure sensation**.
- A steady focus is felt only weakly. Moving the focal point traces lines, circles and "buttons" on the palm or
  fingertip.

Key work:

- **Hoshi, Takahashi, Iwamoto and Shinoda**, "Noncontact tactile display based on radiation pressure of airborne
  ultrasound", *IEEE Transactions on Haptics* 3(3), 2010. This is the airborne-ultrasound tactile display.
- **Carter, Seah, Long, Drinkwater and Subramanian**, "UltraHaptics: multi-point mid-air haptic feedback for touch
  surfaces", *UIST 2013*.
- **Long, Seah, Carter and Subramanian**, "Rendering volumetric haptic shapes in mid-air using ultrasound", *ACM
  Transactions on Graphics* 33(6), 2014.
- **Frier et al.**, "Using spatiotemporal modulation to draw tactile patterns in mid-air", *EuroHaptics 2018*. This
  covers moving the focal point to draw a shape.
- **Commercial development kits** of this kind carry 256 transducers at 40 kHz on a board about 17 cm square. A
  16 × 16 grid at about 10.5 mm pitch matches "hundreds of tiny speakers".
- **Automotive interfaces with mid-air ultrasonic feedback** have been studied in research, for example Harrington,
  Large, Burnett and Georgiou, *AutomotiveUI '18*. These are research prototypes and concepts, not a standard feature
  of production cars.

> The references above are from the producer's background knowledge. They were **not re-checked online in this
> session**. Verify titles, venues and years before quoting them in the upload description.

## How the film depicts it

| Claim or shot | Depiction | Accurate? |
|---|---|---|
| "hundreds of tiny speakers" | The array is exactly 16 × 16 = 256 cans on a board about the hand's size. Every can is drawn. | Yes |
| "fire ultrasound waves" | Each transducer emits wavelets with its own **delay**: the outer ones fire first because they are farther from the focus (`fx.tsx`, `delayOf`). The envelope is a converging spherical crest. The top view shows the matching **phase rings** on the grid. | Yes (stylised) |
| "They meet at one exact spot" | The crests meet at one focal point on the fingertip pad, about the size of the pad. The real 40 kHz wavelength is about 8.6 mm, so the focus is of that order. | Yes |
| "making his skin feel pressure" | The pad flattens by a few percent of the finger's radius. A cutaway opens on the pad showing Meissner corpuscles, Merkel discs and a Pacinian corpuscle lighting up, with a signal running along the nerve fibres. | Yes (schematic) |
| Modulation | The focus and receptors flutter at 4 Hz, a slowed-down **visual** stand-in for the real modulation (typically about 50–250 Hz, or a fast sweep). | Stylised, noted |
| "Move that spot" | The open hand glides; the focus stays on the palm; the emitters' phase pattern recentres under it. | Yes |
| "an invisible button feel like it's moving" | The focal point traces a circle under the palm, drawn as a dotted trail with a moving head. It is never a solid ring or disc. | Yes |
| "No glove. No physical button." | All overlays are removed; a bare hand in empty air above the array. | Yes |
| Car | The car is parked (P on the display, a static garage outside, no driving). The floating controls are a light picture tagged **CONCEPT**. The touch comes from an array in the console. | A concept, labelled |
| Kiosk | **CONCEPT DISPLAY** (light only, no screen) and **ULTRASOUND ARRAY** are tagged separately. The haptic crests come from the pedestal below. | A concept, labelled |
| "You can't actually grab it" | The fist closes smoothly through the focal region with no slowdown, collision or resistance. Afterwards the hand is empty. | Yes |
| "But your skin can still feel it" | The sensation returns on the skin: a pulse and a small flutter of the fingers, a reaction to touch, not to an impact. | Yes |

## What the film never shows

- No levitation of the hand.
- No solid barrier or wall of air.
- No button that resists motion or that the hand rests on.
- No visible beam in the real scene. Everything cyan is labelled by style as an explanatory overlay.
- No real product name, logo or claim that a specific car ships with this feature.

## Sound

Ultrasound is inaudible. The shimmer and the rising tone heard while the waves are shown are the overlay's sound
design, not the device's.

## V2 additions

**Conceptual button outlines.** These appear on "FEEL" and in the top-down shot.
- They are dashed, glowing, see-through rings that appear briefly and dissolve.
- They visualise *where the sensation is*.
- They are never drawn solid or as an object the finger rests on.

**Convergence rays and wavefront bands.** These are explanatory geometry.
- A ray runs from each emitter in the section to the focus.
- Translucent bands trail each converging crest.
- The delays that make the crests meet are the same per-emitter delays as V1 (`it/fx.tsx`, `delayOf`).

**Phase rings on the array.** In the macro, high and top-down views, the cans light in concentric rings centred under
the focal point.
- They show the *spatial* phase pattern.
- They drift at a slowed visual rate (0.4 of the drawn crest speed); the real 40 kHz pattern is far too fast to see.

**Top-down moving point.** The focal point circles under the palm, drawn over the back of the hand as an x-ray, and
the array's ring pattern recentres on it every frame. This is how a moving focus is produced: the phases are
re-steered, not the array moved.

**The grab.** The fist closes at constant speed through the focal region.
- The glow stays visible over the fingers; it is not blocked or squeezed.
- The hand is empty afterwards.
- The sensation then returns as a pulse on the skin: touch, not impact.

**Lobby.** The keypad is drawn as light with a translucent backing and no screen behind it (CONCEPT DISPLAY). The
haptic crests come from the pedestal (ULTRASOUND ARRAY). The two are tagged separately.

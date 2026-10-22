# Infrared Contacts V1: shot list and transition list

Every time below comes from `source/src/timing.ts`, which derives each cue from the measured narration words. The
same table drives the mix (`audio/cues.json`).

## Spatial model

The whole film is one camera through three nested levels:
- **L0:** the train compartment.
- **L1:** the lead's rig. The head is about 600 units; the near eye sits at the origin.
- **L2:** the eye section. The eyeball radius is 100 and the front of the eye faces +x.

The eye section is attached to the head transform, and the contact-lens shell and its particles are drawn in L2. The
camera is one centre plus a zoom. Every key is interpolated in log zoom, with the centre weighted by inverse zoom. Light
always arrives from the right (the front of the face) in every view.

## Shots (seconds)

| Time | Picture | Narration |
|---|---|---|
| 0.00–0.40 | **Extreme close-up.** The near eye, open and looking slightly up. A fingertip carrying a curved lens is already arriving from lower right. | "If you put these" |
| 0.40–0.55 | Contact on the cornea, with a reflex squeeze of the lower lid. The lens rim spreads over the iris. | "contacts" |
| 0.55–1.20 | The finger withdraws down and out of frame (accelerating). Gaze settles. | "contacts in," |
| 1.0–2.25 | Pull back to the face: red spiky hair, the striped shirt, the night window. | "you could see" |
| 2.15–2.80 | The upper lid closes and wraps the eye. The lashes turn down. | "flashing lights with your eyes" |
| 2.90–4.62 | **Closed-eye view.** A circle opens above the closed eye, joined to it by a tail: darkness with two soft green flashes, on "completely" (3.40) and "shut" (4.00). A faint dashed amber packet reaches the lid before each flash. The camera eases toward the eye. | "completely shut." |
| 4.60–5.05 | **The one move into the diagram.** A cutaway window opens on the same closed eye: lid, lens and eyeball in section. | "shut. / You see," |
| 4.95–5.42 | Ordinary eye: the lids slide apart and the lens slides off to the right (diagram layers). | "You see, your" |
| 5.30–6.26 | VISIBLE: a warm packet enters, crosses the pupil and lights the retina. | "eyes normally" |
| 6.25–7.45 | INFRARED: a dashed amber packet reaches the retina and produces nothing. | "can't detect infrared." |
| 7.65–8.45 | The lens slides back onto the cornea and is highlighted. | "But these lenses" |
| 8.40–9.70 | One continuous push into the curved lens surface and its material. Particles appear embedded across the shell. One particle is marked. | "contain tiny particles" |
| 9.75–11.0 | Two infrared packets are absorbed in turn (10.25, 10.85). The particle's energy rings fill (contained excitation). | "that absorb that invisible light" |
| 11.50–12.30 | Emission: a green burst and one green packet leave inward (VISIBLE). | "and turn it into colors you can see." |
| 12.70–14.40 | **One pull-back** from the particle through the lens to the section. The lids slide back closed over the lens (13.55–14.30). | "And while your eyelids" |
| 14.54–15.6 | Four ambient visible packets reach the lid: three stop at the skin and one fades inside it. | "block much of the visible light around you," |
| 16.35–18.75 | Three infrared packets: one fades in the lid, two continue (slower inside the tissue). | "infrared can still pass through." |
| 18.4–19.45 | The camera follows the hero packet to the lens. | "It reaches the lens underneath," |
| 19.42–20.80 | Amber charging at the particle, then a green conversion spark. | "gets converted," |
| 20.36–21.60 | Green light spreads inward through the pupil to a broad patch of retina. The camera widens to the whole eye. | "and becomes a flash" |
| 21.74–22.88 | The whole path lights up (signal → lid → particle → retina). The closed-eye circle reopens *from the retina* with the green flash: the opening motif returns. | "you can actually see." |
| 22.83–23.40 | The circle closes into the eye and the cutaway window closes on the closed lid. | (beat) |
| 22.9–25.5 | One continuous pull-back: closed eye → face → the lead asleep against the seat, the window streaming lights. The head settles 3°. | "So you could look completely asleep…" |
| 25.75–26.75 | A lateral move and widening reveal the sender across the aisle raising a small transmitter, and the bystander reading on the upper bunk. | "while someone flashes you" |
| 26.20–28.30 | The code (short, short, long, short). Each button press sends a dashed amber packet to the lead's eye (overlay). The recipient's flash circle pulses in sync. The reader doesn't look up. | "a secret code nobody around" |
| 27.95–28.49 | The bystander turns a page. | "nobody around" |
| 28.30–29.70 | A push back to the opening eye framing. The lead's tiny smile is visible at 28.55–28.95, with the eyes still closed. The loop cuts on the same eye at the same screen position and scale (closed → open). | "you can see." |

## Transition list

Format: outgoing → incoming: new information, then the decision.

| # | Outgoing → incoming | New information | Decision |
|---|---|---|---|
| 1 | Lens on the eye → face | Who this is, and where (the train). The lid starts to close. | Keep (one ease-out, then in) |
| 2 | Closed eye → closed-eye view (an inset joined to the eye) | What "seeing with your eyes shut" looks like: diffuse flashes only. | Keep (the hook payoff) |
| 3 | Closed eye → section window on the same eye | The anatomy under the lid. | Keep: the only exterior → diagram move |
| 4 | Section (closed) → ordinary eye (layers slide off) | Ordinary eyes miss infrared. | Keep (diagram layers, not a character action) |
| 5 | Ordinary eye → lens back on → material | The particles live in the lens. | Keep (continuous push) |
| 6 | Particle → section with closed lids | The tissue barrier. | Keep (continuous pull-back, no exterior detour) |
| 7 | Section → following the hero packet → whole eye | The complete path. | Keep (traveling camera, no revisit of the particle scale) |
| 8 | Path → closed-eye flash (from the retina) | The opening contradiction explained. | Keep (motif callback) |
| 9 | Flash/section → closed eye → train | The human implication. | Keep (one continuous pull-back) |
| 10 | Lead → sender and bystander | Who sends; who misses it. | Keep (one lateral widening) |
| 11 | Wide → opening eye framing → loop cut | Loop. | Keep (motivated cut-in on the same eye) |

None of these is an exterior → interior → exterior detour. The film goes into the eye once (transition 3) and comes
out once (transition 9).

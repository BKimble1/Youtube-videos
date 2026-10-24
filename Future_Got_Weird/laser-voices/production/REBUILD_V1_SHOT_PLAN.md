# Laser Voices: Rebuild V1, shot plan

This is a complete rebuild of the picture. The narration, word timing and captions are the approved V1 versions, unchanged. Nothing from V6 is reused: not its cast, rigs, sets, compositions or structure.

The picture is built on the Death Clock V4 vector pipeline (`source/src/rb/lib/`, copied from the Death Clock branch). That pipeline provides:
- one ink contour per figure;
- limbs drawn as single, cylinder-shaded contours;
- a fixed key light;
- spline and spring motion;
- a 2.5D layered camera.

Laser Voices V3 supplied the secondary references: its dark teal room, the warm overhead light and the scale of its close-ups.

## Cast (new)

| Character | Look | Role |
|---|---|---|
| **Listener** | Short, dark, curly hair; brown eyes; a blue jacket over a light shirt; dark jeans; white trainers. | Hears the voice. |
| **Operator** | Dark hair in a top knot; gold hoops; a rust-orange jacket over charcoal. | Runs the emitter; her hand is on its rear dial. |
| **Passerby** | Mustard knit beanie; sandy hair; light stubble; olive bomber; brown trousers. | The nearby person who hears nothing; later he walks through the beam path while looking at his phone. |

All three use one head rig (`art/Face.tsx`):
- the head turns continuously from the front to full profile;
- the features sit at angles on the head, so they slide round it as it turns;
- the eyes have irises, lids and lash lines;
- the brows are shaped, and the mouth has lips and teeth.

They also share one body rig (`art/Person.tsx`):
- two-bone IK arms with elbow pole targets;
- planted-foot IK legs;
- five-digit hands.

Walks come from planned steps (`shots/walk.ts`), so a planted foot never slides.

## The physical set-up

One dark teal demonstration room:
- directional pendant lights;
- wall panels with a cove light strip;
- a glass partition;
- instrument racks.

The emitter (`art/Emitter.tsx`) is a single 3D model drawn from every angle. It stands on a pedestal eight feet from the listener and tilts up slightly toward his ear. A yellow floor tape runs from its base to his feet.

## Shots

| Time (s) | Narration | Shot | What happens |
|---|---|---|---|
| 0–1.0 | "If someone pointed this laser at you" | **Listener, close-up** | Frame 0 is mid-reaction: his eyes are already snapping toward the sound. His head whips round and his shoulders lift. Nobody is there, so he looks puzzled. |
| 1.0–1.95 | (cont.) | **Trace**: side view | Match on his head. The camera travels along the path from his ear to the emitter, and the dashed path grows back from his ear to the lens. On the way it passes the passerby, who is on his phone. The operator's hand is on the dial. |
| 1.95–4.95 | "you could hear a voice that nobody beside you hears" | **Two-shot**, medium | He hears it again, searches, and turns to the passerby ("did you hear that?"). The passerby glances up, blank, shrugs and goes back to his phone. The camera pushes in slowly. |
| 4.95–8.55 | "And you wouldn't need anything in your ears. The beam is invisible." | **Push into the ear** (continuous) | He turns his head and the camera pushes straight into his ear. His fingertip checks the ear: there are no headphones and nothing in it. On "invisible", a translucent path draws in from off-screen into the empty canal. He never sees it. |
| 8.55–15.0 | "But when water vapor near your ear absorbs its light, it heats up and expands, creating tiny sound waves" | **The air at the ear** (one continuous microscopic world) | The canal opening stays in frame. Water and nitrogen molecules sit in three depth layers. On "water vapor" the water molecules are picked out. Light pulses run down the path, and each water molecule on it flashes, absorbs and starts to vibrate. On "heats up" they glow warm and their neighbours speed up. On "expands" a warm pocket swells and shoves the molecules apart. Each pulse then sends a pressure front outward. The camera follows the fronts into the canal, where each one pushes the eardrum and the hammer bone. |
| 15.0–17.8 | "Now, sweeping that beam at exactly the right speed" | **Into the emitter** | A whip back up the path lands on the lens. The emitter is close, with the operator behind it out of focus. Its side panel turns to x-ray, showing the laser diode, collimator lens, wedge prism and objective. The prism spins up on "sweeping" and faster on "exactly the right speed", and the swept path leaves the lens. |
| 17.8–20.0 | "concentrates the sound where you're standing" | **Down the path** | From the lens, the camera travels back down the path to him. A small zone of ripples collects at his ear and nowhere else. He cups that ear and grins. The passerby beside him is unaffected. |
| 20.0–23.3 | "Scientists actually demonstrated this from eight feet away" | **Side view** | The shot starts on his face and pulls back to reveal the emitter eight feet away. The tape lights foot by foot. The operator turns the dial. On "eight feet" he looks at the camera, delighted. The passerby wanders off. |
| 23.3–26.3 | "But if someone walks between you and the laser…" | **Down the path**, wide | The passerby walks across the path with a planted walk and arm swing, eyes on his phone. On **frame 786** his head and shoulders cut the path, which now ends on him. The voice stops on the same frame. |
| 26.3–27.85 | "The voice suddenly stops." | **Listener, close-up** | His smile drops. His eyes dart left and right. He taps his ear and turns toward the emitter, puzzled. |
| 27.85–30.4 | "They can't hear your message. They're blocking it." | **Side view**: the obstruction | The passerby stands in the path on his phone. The emitter is still running, and the path ends on his back. The listener leans to look past him, and the operator waves the passerby aside. |
| 30.4–32.0 | "And the second they move…" | **Down the path** | The passerby looks up, realises and steps on. On **frame 958** the path reaches the listener again, the voice returns (with a gentle 80 ms fade) and he jolts. |
| 32.0–34.07 | "You hear it again." | **Listener, close-up** | The voice is back. He turns toward it, cups the ear and grins, listens, then settles. The voice starts again across the loop seam, and frame 0 is his eyes snapping toward it. |

## Camera

Every move has a purpose:
- the trace (following the path);
- the slow push in the two-shot;
- the push into the ear;
- the micro arrival, the follow into the canal and the whip back to the emitter;
- the orbit round the emitter while it opens;
- the travel back down the path;
- the side-view pull-back that reveals the eight feet.

Shots without a purpose for movement drift by only 1–3%.

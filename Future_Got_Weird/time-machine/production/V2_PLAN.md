# This Time Machine Actually Works: V2 plan

V2 rebuilds the picture around one astronaut, one recognisable friend and one recognisable home. The audience should
see that the astronaut experiences one hour, his friend experiences years, and the astronaut returns unchanged to a
life that continued without him.

The narration is V1's master, used unchanged (`audio/narration/FGW_TimeMachine_narration_V1.wav`, 23.533 s,
706 frames at 30 fps).

## Narration anchors (measured)

| Word | Start (s) | | Word | Start (s) |
|---|---|---|---|---|
| hole, | 2.04 | | returned, | 12.335 |
| you (could) | 2.76 | | your (friends) | 13.22 |
| future. | 3.77 (ends 4.26) | | old. | 14.125 (ends 14.34) |
| You'd | 4.97 | | Your (family) | 15.29 |
| clock | 5.535 | | gone. | 16.615 (ends 16.83) |
| hour. | 7.135 (ends 7.45) | | Because | 17.95 |
| But | 8.23 | | space. | 19.47 (ends 19.95) |
| Earth, | 8.76 | | You (traveled) | 20.79 |
| years | 9.47 | | time. | 21.69 (ends 22.01) |
| passing. | 10.28 (ends 10.67) | | And | 11.52 |

## Shots

| Time (s) | World | Action | Transition out |
|---|---|---|---|
| 0.00–1.10 | Yard, close two-shot (CAM_CLOSE) | The friend clasps the astronaut's glove in both hands. He ages from young to elderly by about 0.72 s: hair greys, shoulders settle, wrinkles come in, the hands holding the glove age. The street behind advances subtly. The astronaut, unchanged, goes from neutral to surprise, then looks down at the old hands. | His gaze |
| 1.10–2.05 | Yard | His eyes and head lift from the hands toward his visor. The camera follows the head movement up to the glass. The black hole appears as a reflection clipped to the visor. | Clean cut at 2.05: the reflection's position and angle match the next view |
| 2.05–4.70 | Space | The black hole fills the frame. The capsule (large, readable) sweeps around it on a clear curved path above the disk, with an exhaust trail drawing the curve. It approaches, curves round and heads off; the camera follows it to its cockpit window. | The window frame passes the lens |
| 4.70–8.20 | Cockpit | He raises his wrist; the watch fills the foreground. Its hands advance one hour, minute hand one full turn, landing on "hour". The wrist lowers to reveal his unchanged face and the black hole through the cockpit window behind him. He raises the watch again and the shot ends on the watch. | Match cut, watch → wall clock (same screen place and size) |
| 8.20–9.30 | Room (past) | The home's wall clock races: years. The camera moves from the clock to the window, where the young friend waits outside. | Push through the window frame |
| 9.30–11.20 | Yard (decades) | The friend waits, looks up at the sky, then (behind a foreground trunk) is middle-aged walking to the gate in autumn, then (behind leaves) is elderly at the gate. The tree grows, seasons turn and towers rise. The camera keeps trucking in one direction. | Foreground wipes |
| 11.20–13.30 | Yard | A light passes overhead and the old friend looks up. The camera follows his gaze to the descending capsule and carries its fall into the landing. The hatch opens; the astronaut steps down (feet on the ground) and recognises the house in a changed street. | His walk to the friend |
| 13.30–14.60 | Yard, CAM_CLOSE | The old friend reaches for the glove, with the same hand placement and screen positions as the opening. The astronaut's eyes search his face, recognition arrives, then his attention drops to their joined hands. The friend gives a restrained smile. | The friend's gesture |
| 14.60–15.30 | Yard | The friend looks to the house and gestures to the door. The astronaut follows the gesture and walks right toward the door; the camera trucks with him. | The doorframe passes across the lens; he keeps walking right |
| 15.30–18.00 | Room (present) | A quiet room with empty chairs. He walks in, notices the family photograph on the sideboard and reaches for it, and his glove wipes dust off its frame. Beside it, his father's portrait has a black ribbon. The camera follows his attention: room → photo → his face. | His attention |
| 18.00–20.70 | Room | Close on the family photo: his unchanged face reflected in its glass beside the people he has lost. The changed skyline shows through the window in the reflection. His expression settles into grief and understanding. | His wrist enters |
| 20.70–23.53 | Room | He brings his watch up beside the old photograph: one hour against a whole life. The camera moves to the pre-departure photo of him and his young friend at the gate and pushes in until the print fills the frame, exactly the opening composition. | Loop into frame 0 |

## Worlds and contracts

All new code lives in `source/src/v2/`. The V1 files keep rendering V1.

- **Yard** (`v2/yard.tsx`). Side elevation, ground G = 1600, figures at scale 0.62. It holds the home (door, the
  family-room window), the familiar tree, the fence and gate, the street (the landing spot), the skyline across the
  street (rising with D), seasons, and foreground parallax pieces for the wipes.
- **Room** (`v2/room.tsx`). Room px, floor 1560. It holds the wall clock, the window (its content drawn through it),
  two empty armchairs, and a sideboard with three photos: the family, the father's portrait (black ribbon in the
  present) and the 9:16 pre-departure print whose content is drawn through it. Past (era 0) and present (era 1).
- **Cockpit** (`v2/cockpit.tsx`). The capsule interior, a window showing the black hole, `Watch2` (physical; no Earth
  inset; hands mechanically consistent), and a large foreground forearm with the watch.
- **Capsule** (`v2/capsule.tsx`). One craft for both flight and landing: window (portal), main flame, retro jets,
  legs, hatch, bank. It also holds the flight path around the hole and the exhaust trail.
- **Clasp** (`v2/clasp.tsx`). The friend's two hands around the astronaut's glove, ageing continuously.

## Captions

Only narration captions appear. They sit low (around y 1700) and clear of faces, hands, the watch and the photographs.
The last caption hides before the photo push covers the lower frame.

## Loop

The final frame is the pre-departure print filling the screen. It is drawn as the Yard world at D = 0 through
CAM_CLOSE, with the friend young in the opening pose, so it matches frame 0 exactly. Frame 0's friend starts ageing
from there.

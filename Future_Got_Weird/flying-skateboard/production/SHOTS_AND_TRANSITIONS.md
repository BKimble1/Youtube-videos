# Flying Skateboard V1: shots and transitions

Times are measured from the V1 narration (`source/src/data/timeline.json`); the shot table is `SHOTS` in
`source/src/story/shots.tsx`. 30 fps, 1077 frames, 35.900 s.

## Shots

| # | From–to (s) | Narration | Setting | What happens |
|---|---|---|---|---|
| 1 | 0.00–3.41 | This skateboard could make you FLY across a RIVER. | Yangtze, mid-river | Frame 0 already in flight: low front ¾ under the rider, the wake behind him. The camera accelerates alongside; he shifts to his toes and the deck banks. A buoy passes close in front. Down to the side of the board to show the gap to the water, a low pass by the ducts, the climb on "FLY", the wide on "RIVER" with the bridge and the town, then a curve under the board |
| 1b | 3.41–6.42 | You see, ten powerful electric propellers blast air downward, | same flight (continuous move) | Tracking under the board along the front assembly; the full layout from below while the ten duct rims light in turn on "ten powerful". The rotors speed up on "electric propellers"; airflow streaks run down; the camera follows the air down to the ring it makes on the water |
| 2 | 6.42–9.31 | lifting you completely off the ground. | Practice field | Match: the water ring becomes the dust ring under the board on the pad. Rotors spool, leaves blow out, the shadow separates as the board lifts and his knees take up the lift. The camera tracks up and circles to his front ¾ as he leans and moves off. It then swoops under the board to look straight up at one fan |
| 3 | 9.31–13.64 | But his first version used JET ENGINES… and caught FIRE. | Workshop (inside the shed) | Match: the fan's turn carries on as the compressor face of a jet intake, seen from above. Pull back to the five-turbojet prototype on its test stand, then track across the engines. They run, and exhaust hits the floor. Hot air curls back up toward the intakes; vibration. Ignition flash and flames on "FIRE", then the scorched wiring and fuel lines |
| 4 | 13.64–15.48 | So he switched to electric. | Workshop bench | Arc up and over from the damage onto the bench. A loose ducted-motor unit slides into frame; ten ducts drop into the new white frame one at a time |
| 5 | 15.48–20.21 | Except there's one HUGE problem. The board can't balance itself. | Practice field (the shed behind) | Match: the finished board on the bench becomes the same board, same framing, on the field. He steps on with the rear foot. On "HUGE" it lifts and rolls toward the heel side. He answers (hips to the toes, deeper knees, arms out), overcorrects, drifts, and settles level |
| 6 | 20.21–25.36 | He has to control it with his entire BODY, while an AI voice coach helps him learn how to balance. | Practice field | Cut to his feet and legs: lean forward, the board moves off. Circle out: he leans back and the board brakes, then an overcorrection drifts it sideways. One continuous move takes the camera along the arm to the controller (throttle), the wrist phone and the board phone (tilt readouts), and the earpiece (the coach's cue). Back out: the correction, smooth flight, a clean turn |
| 7 | 25.36–26.96 | And after just over ten days of practice, | Practice field | Cut to an early, wobbly, low hover; then confident circuits while dusk and dawn pass over the sky |
| 8 | 26.96–29.76 | he actually flew across a RIVER… | Yangtze, a separate flight high over the river | Side view along the shore: he crosses the shoreline and open water opens below. The wide on "RIVER" with the bridge and mountains behind; then behind and above him |
| 9 | 29.76–31.84 | and THROUGH a CANYON. | Baren River gorge | A rock spur sweeps across the lens; the cut happens under it. "THROUGH": the walls tower either side; round the bend low; pull up wide, the rider small between the walls |
| 10 | 31.84–35.90 | How much would someone have to PAY YOU to ride this thing? | Yangtze (the hook's own flight) | A mist bank sweeps across; back over the river from behind his shoulder. "PAY YOU": into his own view, looking down past his feet at the water. Out to a ¾ tracking view and a gentle bank. "YOUR PRICE?" (34.78–35.56). The camera returns to frame 0's position on the same trajectory |

## Transition list (FGW_EDITING_RULES.md)

outgoing subject → incoming subject → new information → keep / merge / remove

| t (s) | Outgoing → incoming | New information | Decision |
|---|---|---|---|
| 3.41 | Rider over the river → the board's underside (one continuous camera move) | Where the lift comes from: ten ducted fans | keep |
| 5.86–6.42 | Underside → the ring on the water (the camera follows the air down) | The air really goes down and hits the surface | keep |
| 6.42 | Water ring → dust ring on the field (match cut) | A ground-level demonstration: the board lifts off the ground | keep |
| 9.31 | Electric fan from below → jet compressor from above (match on the rotation: same screen circle, same sense and speed) | The earlier machine was jet-powered | keep |
| 13.64 | Burnt prototype → workbench (arc in the same room) | The redesign: electric ducts | keep |
| 15.48 | Board on the bench → the same board on the field (object match, same framing) | A new place: the first lift of the new board | keep |
| 20.21 | Field wide → feet and legs close-up (deliberate cut to detail) | The control input is the body | keep |
| 22.5–24.1 | Body → controller → wrist phone and board phone → earpiece (one continuous camera through anchors) | Thrust is on the hand control; the phones read tilt; the AI coaches by voice | keep (merged into one move) |
| 25.36 | Smooth flight → an early wobbly session (cut: another day) | Training: he got better | keep |
| 26.96 | Practice field → the Yangtze shore (cut: new place) | The big flight | keep |
| 29.76 | River → canyon (foreground rock wipe, cut under full cover) | A separate demonstration in the gorge | keep |
| 31.84 | Canyon → river (mist wipe, cut under full cover) | Back to the opening's flight for the question and the loop | keep |
| 35.90 → 0.00 | Last frame → frame 0 | The loop: the ending is the same trajectory 4.1 s earlier than frame 0, and the camera spline lands exactly on frame 0's key with zero relative velocity | keep |

No exterior → interior → exterior detours, no blanket dissolves, no flashes used to hide a cut. The ignition flash is the event itself.

# Invisible Touch V2: V1 audit and revised shot plan

Written before any V2 code. The creator's V2 direction is verbatim in the session request, with these points
unchanged:

- the 101 approved words;
- the ElevenLabs Test Voice master;
- the guesser rig;
- 1080×1920, about 28–31 s.

## V1 audit

The audit worked from the V1 render (`exports/FGW_Invisible_Touch_V1_REVIEW_1080x1920.mp4`), its QA in `qa/v1/`, and
the source.

| Area | Finding in V1 |
|---|---|
| Repetitive compositions | One family (the side-on hand over the array on the bench, camera about level and slightly high) is used at 5.5, 14.5, 17.7, 26.3 and 28.0 s, so five beats look alike. The two character wides (2.5 s and 18.7 s) are the same framing. |
| Slow holds | Car 21.5–23.3 s: the camera barely moves and only the dial arc changes. The lobby wide 25.0–26.0 s is nearly static. |
| Weak first 3 s | Frame 0 is good, but the pull-back ends on a small, distant character beside a dark cabinet. The array reads late and there is no visual "button" idea. "FEEL" lands on a wide where the hand is tiny. |
| "Look. Nothing is touching" | The card pass proves the point, but the near arm is a huge flat tube at the frame edge and the card hand is stiff. |
| Mechanism | Correct, but the array is shown from one high three-quarter angle. Waves are thin lines, convergence geometry is implicit, and the receptor window is small (unreadable on a phone). |
| "Move that spot" / circle | The circle is shown from a low side angle as a flat ellipse; it reads weakly. |
| Car | Flat, dark shapes; the steering wheel is an edge-on ring; the near arm is large after the cut. The dashboard is not impressive and there is no light design. |
| Lobby | Plain grey wall and a pillar-like door; small floating arrows; weak feedback. |
| Cut back to the lab (26.0 s) | A plain cut, not a match. |
| Grab | The fist is small in frame; the face tilt crops the head. |
| Anatomy | The profile hand is sound (five digits, MCP/PIP/DIP order, nails, creases). The rig's back-view card hand is stiff, and the near arm hangs large in the car's first second. |
| Audio | Effects sit about 26 dB under the voice. The convergence tone is fine, but the opening has no distinct tactile click and there is no sound bridge into the loop. |
| Captions | Correct and in sync, but often sitting on the device (8–10 s, 14–17 s). |
| Loop | The seam is good (one camera path, a matched dip and pulse). Keep it. |

**What V1 got right and V2 keeps:**
- the narration master, its word timings and the caption text;
- the profile hand;
- the perspective lab and the 256-emitter array;
- the phased-array model (per-emitter delays);
- the skin cutaway anatomy;
- the match cut on the moving hand into the car;
- the loop mechanics.

## What V2 changes

**Composition.**
- A **billboarded figure** keeps the guesser undistorted in true three-quarter lab views.
- A **backlit air gap**: a light panel behind the bench makes the gap glow in side views.
- A **top-down hand** (the rig's own back-view hand on the palm plane) gives a genuinely new angle on the moving focal
  point.

**Overlays.**
- A **conceptual button outline** (dashed and glowing, then dissolving), used twice and never solid.
- **Translucent wavefront bands** and **convergence rays**.
- A **receptor dive** in which the cutaway opens until it fills the frame.

**Settings.**
- A **rebuilt car cockpit**: light design, a wraparound windscreen with a city outside, a sculpted dashboard and a
  floating control arc.
- A **rebuilt lobby**: a destination keypad with real feedback (the floor lights and the doors part).

**Transitions.**
- Match cuts at every change of place: lab → car → lobby → lab.

**Sound.**
- An opening tactile click, a coherent rising texture, interface ticks, and a sound bridge into the loop.

## V2 shot plan (aligned to the measured words)

Word onsets are those of `source/src/data/timeline.json`; times are in seconds.

| # | Time (s) | Words | Composition (new information) | Into the next shot |
|---|---|---|---|---|
| 1 | 0.00–0.50 | "This button" | **Extreme close-up** of the fingertip, slightly from below, dark backlit air. The finger dips; a cyan pulse at the pad and a tactile click on frame 0. | The orbit begins inside the shot |
| 2 | 0.50–1.05 | "doesn't exist." | **Orbit** of about 55° round the fingertip; the backlit air shows empty space on every side. The finger lifts a hair and settles (reaction). | The same move continues |
| 3 | 1.05–1.90 | "…exist." | **Pull-back and drop** to gap level: the array appears below, with a glowing gap of air between. | Cut, on the rising camera |
| 4 | 1.90–3.05 | "But you can FEEL it." | **Wide three-quarter** of the guesser at the bench (billboard figure, true-perspective bench and array). On "FEEL" a **dashed button outline** appears under the fingertip and dissolves; he smiles. | The camera dives |
| 5 | 3.05–5.20 | "Look. Nothing is touching his finger." | **Dive to gap level, then glide along the gap** (right to left, the hand's direction). Emitters slide past in the foreground, the fingertip above, light through the gap. | The glide rises |
| 6 | 5.20–6.90 | "So why can he feel a button?" | **Rise to the fingertip** from just below the pad; pulses on "feel" and "button". | A tilt down: the dive |
| 7 | 6.90–8.40 | "Under his hand, hundreds of" | **Dive past the pad onto the array; macro tracking across the cans.** The emitters fire in coherent phase rings. | Pull up |
| 8 | 8.40–9.20 | "tiny speakers" | **Pull up to the whole 16 × 16 grid** with the ring pattern converging under the finger. | Swing down to the side |
| 9 | 9.20–10.75 | "fire ultrasound waves." | **Side section; the camera rises with translucent wavefronts**. The delayed wavelets build converging bands. | Continue up |
| 10 | 10.75–12.30 | "They meet at one exact spot," | **Convergence geometry:** rays from each emitter to the focus; the bands meet; the focus flares on "exact". | Push in |
| 11 | 12.30–13.30 | "making his skin feel" | **Fingertip macro:** the pad flutters faintly (a slight flattening and fine ripples), not a dent. | Push into the pad |
| 12 | 13.30–14.10 | "pressure." | **Dive into the cross-section:** the cutaway opens and fills the frame; receptors fire, and a signal runs up the nerve. | Pull back out |
| 13 | 14.10–15.05 | "Move that spot," | **Pull back out:** the hand opens flat and glides; the focus slides along the palm. | The camera rises to top-down |
| 14 | 15.05–17.45 | "and you can make an invisible button feel like it's moving." | **New angle: top-down over the hand and array.** The focal point traces a circle under the palm; the array's phase rings follow it. On "invisible button" a **dashed button outline** rides the point, then dissolves. | Cut |
| 15 | 17.45–18.40 | "No glove." | **Clarity:** all overlays off; a low three-quarter close-up of the bare hand in clean, empty, backlit air; the fingers flex. | Cut |
| 16 | 18.40–19.62 | "No physical button." | **High three-quarter wide** (the other side from shot 4): he presses empty air; then his hand sweeps left, and the camera follows. | Match cut on the moving hand |
| 17 | 19.62–21.45 | "Now imagine reaching into thin air" | **Car:** the same hand, place, scale and motion; the pull-back reveals a rebuilt cockpit (city lights, ambient light lines, parked). | Controls bloom |
| 18 | 21.45–23.35 | "and feeling the controls of your car." | **Floating control arc** (concept tag). His finger turns the climate dial: a click and a pulse at the contact on each detent; the console array is visible below. The camera arcs slowly. | The camera travels in |
| 19 | 23.35–24.62 | "Or pressing a floating button" | **Through the interface** to the fingertip. | Match cut on the fingertip |
| 20 | 24.62–26.05 | "without touching a screen." | **Lobby:** a floating destination keypad (CONCEPT DISPLAY) over a wall array (ULTRASOUND ARRAY). He presses 7: the ring fills, the floor display shows 7 and the doors part. | Match cut on the fingertip |
| 21 | 26.05–27.45 | "And here's the weird part." | **Back to the real array:** the same fingertip place, pulled back to the hand over the array; the hand opens flat with the focus on the palm. | Push in |
| 22 | 27.45–29.15 | "You can't actually grab it." | **Close on the hand:** the fingers close through the glowing focus; the glow passes through them unchanged; nothing is caught. A tilt to his puzzled face. | Back to the hand |
| 23 | 29.15–30.30 | "But your skin can still feel it." | The hand opens; a **pulse returns** at the pad; the fingers flicker (a touch response). | One move |
| 24 | 30.30–31.13 | "…it." | **Return to the opening close-up**: the same camera path, pose, dip and pulse, into frame 0. | The loop |

This gives 24 compositions in three places and three illustration modes. No hold is longer than about 1.2 s without
motion or new information.

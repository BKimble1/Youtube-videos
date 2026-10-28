# Flying Skateboard V5: changelog (camera and character stability pass)

Kept from V4:
- the narration (the established ElevenLabs take, sample for sample), its timing and the captions;
- the story order, the character and board designs, the 2D crew style and the sets;
- the runtime (35.9 s, 30 fps);
- the score.

The working V4 material was reused: the opening flight, the fans, the lift, the workshop fire and redesign, the practice moments, and the river and canyon flights.

## 1. The helmet and head: one rigid assembly (absolute priority)

**What was wrong (measured, and confirmed by an independent frame review of V4):**
- The helmet shell and visor outlines were the convex hull of points on a latitude/longitude grid fixed in world space, not to the head.
- During a head turn the outline froze for several frames, then jumped as a grid row crossed the rim:
  - the shell jumped by up to 46 % of its area between consecutive frames;
  - the visor jumped by up to 104 %.
- Grid points far behind the head were pushed onto the silhouette. This drew phantom areas (the shell was drawn almost twice its true visible size) and sometimes a visor-coloured band across the face.
- The orange stripe started below the brow, so it was drawn over the visor and "popped" across the front.
- The visor, ears and earbud were switched on and off by visibility thresholds.

**V5 (`eng/draw.tsx` `sphereRegion`, `art/Pilot.tsx`, `art/rig.ts`):**
- **Exact outlines in the head frame.** Every helmet part (shell, visor, stripe, ears, earbud, chin strap) is defined in the head's own frame. Shell and visor outlines are exact: their rim curves are clipped where they pass behind the head's visible edge, and that edge is followed between.
- **Turns rotate the whole assembly continuously.** In the same slow head turn and nod, from four camera angles:

  | Part | Worst frame-to-frame step, V4 → V5 | Worst second difference, V4 → V5 |
  |---|---|---|
  | Shell | up to 46 % of area → at most 4 % | 49,690 → 208 |
  | Visor | up to 104 % of area → at most 16 % (or 78 px² when nearly out of view) | 66,108 → 16 |

  Reproducible: `source/src/dev/helmetStab.ts`.
- **Stripe** runs only over the shell (brow rim to back rim) and is clipped to the shell outline. The visor highlight is clipped to the visor.
- **Ears and earbud** are thin disks on the head that foreshorten to edge-on as they turn away, so they never pop. The earbud's glow fades with the same turn.
- **Neck pivot.** The head pivots at the neck (the head centre is a fixed offset from the neck joint in the head's frame), so a nod moves the head the way a neck moves it.
- **Head turns are slower and smaller.** In the coach beat he looks down at his wrist over 0.5 s and keeps his head down, listening, until he corrects. The listening tilt is about half of V4's. The earbud close-up is held still on the torso, so only that small tilt moves.
- **Board light strips** fade with their facing instead of popping (also found in the V4 review).

## 2. Camera discipline
- **No orbits, swings, push-pulls or roll anywhere.** The camera either tracks the board at a steady offset, or stands still and pans/tilts while the rider travels through the frame. Its target is the board's position averaged over a short window, so it does not bob with every heave.
- **Screen direction:** travel is screen-right in every flight shot.
- **Hook (0–3.4 s):**
  - One strong low front three-quarter tracking angle for the first 1.4 s, as the board travels over the river and his knees take a heave.
  - 1.4–2.1 s: the camera sinks below deck level so the thrusters come into view (a crane down, not a swing).
  - 2.1–3.4 s: it rises and pulls back to the crossing.
- **Mechanism:**
  - A cut on "You see" to a still underside view showing all ten fans; the fans count, spin up and the air lengthens while the camera barely drifts.
  - A cut on "blast" to a steady low track of the air reaching the water.
  - A cut on "downward" to the riverside flat. The lift is filmed by a camera standing on the grass: it opens on his legs and the deck, tilts up as he rises clear, and pans as he flies on past.
- **Workshop:**
  - Every shot is from the same side of the stand, so the prototype keeps its orientation.
  - A still top view, a cut to the low engine close-up on "JET ENGINES", and a cut to the deck-top view on "and caught" (leak, vapour, ignition).
  - Then a slow rise back for the redesign. The fire stays attached to the fuel fitting and line.
  - The V4 see-through cross-dissolve between the two boards is replaced by the fire's smoke rolling over the stand and clearing on the new electric frame in the same cradle.
- **Balance and coach:**
  - Two standing cameras (a match from the workshop, then a lower three-quarter view) with the background still. He rides off across the frame and the camera pans with him.
  - The coach close-ups (deck phone, wrist phone, earbud) are each held still.
  - A standing medium view for the correction.
- **Practice:** a standing camera for the unsteady takeoff, a still overhead camera for the S-curve, and a standing low camera on the flat.
- **Payoff:**
  - A steady rear three-quarter track over the shoreline and across the open river, easing back to show its width.
  - A cut on "and THROUGH" to the same steady track entering the canyon, both walls ahead.
- **Ending:** one steady front three-quarter track over the river while the question is asked, drifting a few degrees onto frame 0's camera key, with the camera's velocity continuous through the loop point.

## 3. Balance animation (16–25 s)
- **One connected balancing system** (`v5/flight5.ts` `fieldFlight`):
  - Each disturbance is a single small, smooth tilt of the deck (about 5°).
  - The body answers through damped springs: hips and centre of mass first, knees bending with the effort, arms counterbalancing a beat later on a looser spring (follow-through).
  - The board's attitude follows the body with its lag, and each correction settles.
  - A deliberate lean is preceded by a small opposite dip (anticipation).
- **Contact:** both feet stay locked to the deck. The body stays upright over the planted feet while the deck tilts under them (the V4 `upright` rig).

## 4. Other
- **"YOUR PRICE?"** moves to the sky above the rider, clear of him and the board.
- **Buoys** are drawn only on the river crossing, so none appear to stick to the board in the opening or the ending.
- **The inventor** is removed from the workshop shots. He only ever appeared as a cut-off limb at the frame edge.
- **Sound:** retimed to the V5 cuts (`tools/make_audio_v5.py`, cues in `audio/cues_v5.json`). Fewer camera-move whooshes; the effects follow the action. Voice −17 LUFS, mix −14 LUFS, voice 15.0 dB above everything else in the speech band.
- **Export:** rendered natively at 2160×3840 and downsampled with a Lanczos filter to a true 1080×1920 H.264 master at 30 fps.

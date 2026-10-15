# V6 changes and limitations

V6 is a focused finishing pass on the V5 master and the V5 project. It keeps the V5 opening, story and narration,
the vector F.02/F.03 designs and chest marks, the Crew, the warm-foundry / cool-simulation contrast and the orange
end silhouettes.

- **Runtime:** 3:36.7, the same as V5. The narration is unchanged (no trims were needed).
- **Rendering:** native 1920×1080, 30 fps, rendered from source (not upscaled from a review copy).
- **Editable project:** `source/src/v6/` (composition `V6Main`). V5 is untouched; V6 adds `sets/splash6.tsx` and
  edits only V6 files.

## Completed fixes, by section

### 0:00–0:07 opening
- The robot is already shifting its weight on frame 0: crouch → planted push → one continuous ballistic flight, no bob.
- Framing guard on head, hand tips and toes, so nothing touches the frame edge in the push or the flight.
- The shell enters feet first and the liquid surface masks it; no global fade.
- New splash (`Splash6`): the crown rises and falls back into the surface, droplets cool continuously and each one
  that lands in the vessel leaves its own ripple; centred on the entry point.
- No white disc: the whole environment changes material in one circular wipe spreading from the entry point
  (foundry → simulation), so the target and the room change together.
- The failed attempt's trail and ✗ clear first, then a 0.3 s rewind with streaks and a ◀◀ cue.
- The landing keeps knee compression with the soles planted.

### 0:07–0:20 factory
- One complete task cycle in a close view of the hands (grasp → lift → hang → release), then the camera widens to the
  F.03 line.
- The F.03 works half a cycle out of phase with the F.02.
- The rectangular dimming patches are gone: night is a tint over the whole frame plus darker window panes.
- The fleet is established by the camera; only the newest F.03 walks in, from beyond the frame (no pop-ins).
- Service: the wrench works a bolt in the forearm hatch, goes to the technician's belt and stays there; depth order
  robot → hatch → wrench → crew.

### 0:20–0:38 options
- The crate wipe leaves the frame completely and the crate assembles straight away (no idle beat after the wipe).
- The actuator lens stays anchored to the knee, clear of hands, chest mark and sign.
- FOR SALE: carried in, hung on a hook on the crate's post (hand → crate), flipped to NOT FOR SALE, all clear of the
  technician's face and arm; the shove goes in under the board.
- The knee cover is twisted off by hand and the actuator stays in the hand (no prop pop-ins, no toolbox).
- Clock room: three different bench steps (two ratchet strokes → wrench set down → part lifted → part piled), each
  advancing the clock one hour; the NEXT MODEL flag no longer crosses its label.
- The clock face pushes in on centre and heats into a top-view ladle, which tilts into the side view.
- The robot walking out to the edge keeps its head in frame (the camera tilts up with it); the "battery pack" label
  is larger and sits beside the pack.

### 0:44–1:10 location, post, clapperboard
- The U.S. door's shutter comes down over the previous shot (a real wipe), the crate wheels roll on the ground and
  the push/release follows them.
- The Imatra doorway stays dark until "said yes", then its lights come up: a real space behind the door, no orange
  slab or bottom-up "video" reveal.
- Phone: no sway; PARAPHRASED is visible from the first readable frame of the post card; cards are clipped under the
  header, so a qualification can never outlive its card; one highlight per card ("retired F.02 robots", "melt them.").
- The reply card names the post it answers ("Replying to Brett Adcock"), leaves the phone from exactly where it sat
  (same HTML card) and turns edge-on into the slate; the phone drops away under it.
- The clapstick swings shut on its hinge before the slate fills the lens.

### 1:10–1:30 foundry staging
- The foreground monitor shows the live feed from its first frame; its title card appears only when narrated.
- The crane hook lowers the chip, then retracts out of frame (clear of the jump path).
- The director stays inside the frame; the business case is held by its edge with a visible hand.
- The practice arc is drawn, then the camera pushes in on the launch foot, where the set turns into the simulation
  (no extra wide reset); the avatar settles into its ready stance instead of popping.

### 1:31–2:02 training (highest priority)
- The long banner is gone. A short "Training illustration" identifier sits bottom-left, clear of every trajectory.
- One safe camera (`CAM_SAFE`) holds the whole jump envelope incl. raised hands for every attempt, every grid cell and
  the split panels, so the platform never changes size between attempts.
- The three questions each push in on their evidence: the stumble (balance), the slipped push-off on the deck edge,
  and the off-target landing beside the rings; then back out for the nudge.
- Score rows fill at the events they judge; the card resets between attempts; trails and evidence marks clear before
  each rewind, which shows a ◀◀ cue; each new attempt starts from a planted ready stance.
- Grid: cells use the same framing as the stage and are clipped to their masks; neutral borders; a result badge
  settles after each landing instead of border colours flashing; avatars fade between loops instead of popping.
- The INCIDENT REPORT is brought in readable and fully in frame, then tossed away over the shoulder.
- Split view: each half uses a panel framing of the same envelope, so performer and simulation show the same pose at
  the same time with nothing cropped; the second qualification chip was removed.

### 2:03–2:31 policy, balance, reality
- Policy diagram: the box is named first, then the sensing lines grow in, then the command lines grow out. Every
  connector leaves its joint horizontally and runs in its own vertical lane in clear space (nothing crosses the face
  or body; no two lines cross).
- Balance disturbance: a contact pivot marker on the raised plate, a stronger tip and a visible hip/knee counter-bend.
  The diagram clears before the next composition.
- Reflex mallet: the assistant stands on the robot's front side; the mallet pivots at her wrist and comes in from the
  front to contact below the knee, rebounds and settles (no swings near the head or through the leg).
- The sim → real double exposure lasts about 0.6 s (was about 1.2 s).
- Joint beat: horizontal knock only (no vertical bob); the uneven floor plate is taller and outlined.

### 2:32–2:59 variations, airbag, real jump
- A clean baseline round fills the hold after the dice; weight, footing and timing each appear on their word and are
  tested in the rounds. The die is compact and rolls only when a condition changes.
- Airbag: a local dent under the feet with a damped rebound and knee compression (no global squash, no limb stretch).
- Heat shimmer only in the air above the ladle, cleared before the jump; camera interference stays inside the booth
  monitors and the camera icon; no full-frame overlay.
- The real jump is framed for the whole leap; the splash (`Splash6`) is centred on the entry.

### 3:00–3:14 limits
- One ghost travels the path once on "one movement" instead of stacked translucent copies; no full-frame heat lines.
- The warehouse response draws on once (no flicker loop) and the section ends.

### 3:14–end ending
- Shorter walk to the edge (four strides).
- One preview jump, then a single unmistakable rewind (streaks + ◀◀).
- Crew actions in sequence: point, toss (target held until release, then on the surface), score sheet raised; the
  slate closes on its hinge.
- One final jump and splash. The second blue-avatar jump was removed.
- The "10" cards come up once, on "stuck the landing".
- Restrained, stable rim light (smaller dilation, less idle motion).
- The glow opens into the logo, a short hold, a clean fade.

### Sound
- Cue sheet re-timed to every changed event (`source/src/v6/sfx_v6.ts` → `audio/v6/sfx_cues_v6.json`), score
  regenerated (`tools/v6/synth_score_v6.py`) and the mix rebuilt at -15 LUFS / -1.5 dBTP (`tools/v6/mix_audio_v6.py`).

## Unresolved defects and limits

1. No real-time viewing or listening in this environment. Motion feel and the mix were judged from frames and
   measurements only.
2. The phone post (4.9 s) and the reply card (2.3 s) are held still while narrated; only the highlight changes.
3. The crew are cutout rigs: their steps slide with a bob, and the rig check does not measure their feet.
4. The director's grip on the business case is a hand overlay aligned to his computed hand position.
5. The splash is stylised (a crown polygon and droplets).
6. Frame-by-frame inspection covered the 32 transition and contact strips; elsewhere the review used stills and
   contact sheets.
7. The robot drawings are still not compared with official photos.

Measured results and the acceptance-criteria check are in `QA_REPORT.md` (V6 section).

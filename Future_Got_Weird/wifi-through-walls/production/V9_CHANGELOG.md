# Wi-Fi Through Walls: V9 change log (first-three-seconds and clarity pass)

**Kept from V8:**
- The approved ElevenLabs narration: the same recording, words, order and timing, ending question included. No new
  lines and no call to action.
- The story order and the 36.47 s runtime.
- The characters, the 2D Weird Crew style and the sets.
- V8's strengths: the hand-raise demonstration, the dark-screen skeleton walking out on "creepy", the separate identity
  experiment, the return visit, the CAMERA vs WI-FI question, and the exact crouch-to-crouch loop join.

**Changed:** compositions, acting, the screen's figure, the mechanism's staging, three screens, and the sound cues that
follow them. The code is in `source/src/v9/` (copied from `v8/`); the joins are in `source/src/Film.tsx`; the new
glowing body is `BodyGlow` in `source/src/art/skeleton.tsx`.

## Changes

**First frame and first 3.6 s**
- **New opening composition:** closer, with the camera on his side of the wall.
  - His back is pressed against the concrete, unobstructed, and his face is readable.
  - The wall shows its thickness: its cut face and its long face.
  - The live screen shows his pose on the other side, with the research radio above it.
  - A shift lens keeps all three side by side, so the frame is filled rather than leaving dead space at the bottom.
- **The skeleton reads as a person:** the estimate is now drawn as a generic glowing body (head, neck, rounded torso,
  tapered limbs) under the keypoint skeleton. It has generic proportions only: no face, hair or clothing. The same
  style is used in the mechanism, the hand-raise demo and the figure that walks out on "creepy".
- **The action now follows the narration:**
  - **0–0.44 s ("If you hid"):** he is crouched and startled; the screen matches.
  - **0.44–0.74 s ("behind"):** he flinches and throws both forearms over his head. The skeleton does the same in the
    same frames: the radio's lag is now 0.04 s, about one frame.
  - **1.32–1.95 s:** he tries to hide more completely: he pulls into a tight ball against the wall, arms around his
    shins, feet drawn in, head down, eyes squeezed shut. The screen's body curls with him.
- **"This machine could STILL WATCH YOU":**
  - one move in and down to the two crouched figures, his and the screen's, side by side across the wall at the same
    height;
  - on "still" the joints lock on and the skeleton flashes;
  - on "watch you" he lifts his head out of the ball to peek back at the wall, and the screen's head lifts with him.
- The waves crossing the concrete to him are visible from frame 0. They run on unbroken across the loop seam (the lab
  ending now draws them in loop time).

**Mechanism (3.6–10 s): one cause-and-effect path in one room**
- **The system:** up from the two figures to the radio above its screen ("Scientists built a system"). The radio box no
  longer opens; the hardware close-up and its dwell are gone.
- **The pulse:** in to the transmit bar as the followed pulse leaves (5.1 s, on "shoots invisible"). Then back and up,
  with the pulse, to one held frame of the whole path: radio, concrete, him.
- **Clearly separated stages:**
  - **transmission:** cyan, drawn bold (minimum on-screen size), with its path dotted behind it;
  - **through the concrete:** 6.0 s;
  - **interaction:** a white flash at his head, 7.2 s, as he starts to rise;
  - **echo:** yellow, back to the receive bar, arriving at 8.4 s on "body".
- **Detection:** the screen waits empty while the pulse travels. Its traces start only when the echo arrives, then the
  camera moves down into it and the joints are inferred point by point.

**Hand raise (10.7–15 s):** kept. Only the lag changed (0.08 → 0.04 s), so the skeleton's right (cyan) arm rises with
his right hand. The dark-screen reveal and walk-out on "creepy" are kept, now with the same glowing body.

**Separate experiment (15–22.3 s)**
- **The floating "SEPARATE STUDY" sign is removed.** The narration ("In a separate experiment") and the change of place
  mark the new study.
- **One continuous move with three views:**
  - the street, wide (the figure steps out among the pedestrians);
  - a dolly in to him at person level, walking with him while the router's signals reach him ("ordinary Wi-Fi
    signals");
  - the camera lets him go and pushes in to the window: the router and the separate receiver.
- **Pedestrians:** both pedestrians now walk his way. V8's pedestrian crossing straight through him at 16 s is gone.
- **Kept:** the split screen (his walk above; the receiver's laptop below, STORED SAMPLES → NEW SAMPLE from his steps →
  MATCH: #12), the no-phone beat and the lamp-post wipe.

**197 result (22.3–27.1 s)**
- **Kept:** distinct people walking the monitored lane, each signature matched on the data wall, then one new walk (#27)
  recognized against the stored records.
- **The 197-tile grid is removed.** That small per-person grid could be read as measured outcomes.
- **The result is now one clean statement:**
  - **197 PEOPLE TESTED** at the top;
  - an unmarked crowd, labelled "illustration";
  - **ALMOST EVERYONE IDENTIFIED CORRECTLY**, which stamps in on "almost" as its check draws, with EVERYONE lit green on
    "everyone".
  - No percentages and no per-person marks.
- The push onto the display ends in a gentle push, not a zoom into a tile.

**Return visit (27.1–31.85 s)**
- **A different view from the first café visit:** high, looking down on the sidewalk, going with him at dusk. The
  floating LATER chip is removed. The laptop shows the before/after itself:
  - **SAVED RECORD #12 · EARLIER;**
  - a **NEW SIGNAL · NOW** builds from his steps.
- **The match is an event:** the signature taken from the new signal rises onto the stored one and locks (a flash, both
  outlined green, a click), and **SAME ID: #12** pops in. Then he walks on, close and unaware.

**Question and loop (31.85–36.47 s)**
- **Kept:** CCTV → its own picture (CAMERA, no radio drawn) → "Or Wi-Fi": the receiver half (WI-FI, his learned ID).
- **A signal path from him to the receiver:** the echoes in the WI-FI half now start directly under where he walks in
  the picture above and run into the receiver's antennas.
- **The loop:** he stops and crouches under the camera; the caption ends; the cut lands on the same crouch behind the
  lab wall. There the waves are crossing the concrete to him and the screen's glowing body is crouched with him: the
  opening composition, and an exact join into frame 0.

## Sound (`tools/v9/make_audio9.py`, timing from `tools/v9/events.ts` → `audio/v9_events.json`)

- **Re-timed to the new action:** the arm throw (0.42 s), pulling into a ball (1.35 s), his planted steps as the feet
  draw in, the peek (2.75 s), and the tracking pings. The followed pulse's cues come from the picture's own times:
  leaves 5.1 s, concrete 6.03 s, his head 7.2 s, echo 8.4 s.
- **Removed:** the cues for things that are gone (the radio box opening, the SEPARATE STUDY tick, the 197 tile sweep).
- **Added:** the result stamp (a soft thump and chime as the check draws), EVERYONE lit, the signature rising and
  locking, and a gentle push into the result.
- **Unchanged:** levels and the music: −14.3 LUFS target, true peak −1.4 dBFS, the loop sample-continuous.

## Checks on the delivered MP4

**File metadata (ffprobe):**
- Video: H.264, **width 1080, height 1920**, 30/1 fps, 1094 frames, rendered natively from source (not upscaled).
- Audio: AAC 48 kHz at 320 kb/s; audio-to-video lag 0 ms; 36.48 s.

**Measured:**
- **Loudness:** −14.3 LUFS integrated, LRA 2.2 LU, true peak −1.4 dBFS.
- **Black frames and freezes:** none.
- **One-frame pops** (`qa/v9/V9_pop_scan.json`): none.
- **Loop seam:** the last-to-first picture change is **1.88**, below the 3.51 median between consecutive frames.
- **Motion spikes** (`qa/v9/V9_motion_scan.json`): only at the intended cuts (11.0, 11.8, 12.7, 19.0, 20.8, 30.3, 31.9,
  33.0 and 34.5 s, and the 36.13 s match cut).
- **Rig probe** (`qa/v9/rig_probe.json`): no ankle misses, no planted-foot slip, no backward elbows; arm length drift at
  most 0.03 units. The largest joint acceleration (43.8) is the deliberate flinch at 0.5 s.
- **Camera probe** (`qa/v9/cam_probe.json`): mean 6.4 px per frame. The fastest continuous moves are the push onto the
  197 display (about 24 s) and the ending's split-screen slide, which is a layout move.
- **Speech recognition:** Whisper 0.9% WER, Zipformer 6.3% WER. As in V8, Whisper drops "anything" even on the bare
  recording, and Zipformer mishears "Wi-Fi" as "wife".
- **Voice vs the rest of the mix:** median +12.5 dB. The one low window is at 31.5 s, the quiet tail of "anything", as
  in V8.

**Frame review:** done from the MP4, as phone-size contact sheets without sound.
- Every 3 frames over 0–2.3 s and every 10 frames elsewhere, plus the loop seam frame by frame.
- Fixed during review:
  - the yellow pedestrian walking through and then trailing him (she now walks two metres ahead);
  - a lamp post smearing across a corner of the high return-visit view;
  - the 197 heading cropping as the push ended;
  - the live skeleton vanishing in one frame at 4.98 s (it now fades out over 0.35 s).

## Remaining limitations

- **Not watched or heard in real time:** I reviewed frames, not real-time playback, and could not listen to the mix.
  Please watch it twice at normal speed with sound before the 4K master.
- **The loop join is still a cut:** the crouch under the camera cuts to the same crouch behind the lab wall. The
  signal link is the Wi-Fi echoes, which start under him and run to the receiver, and the waves crossing the wall
  from frame 0. Nothing travels across the cut itself.
- **Small in frame:** the outgoing pulse is small in the radio shot at about 5.1 s, before the wide path shot.
- **Sources not re-checked:** kit.edu is still blocked by this session's network policy. On screen I added no claim
  beyond the narration: 197 PEOPLE TESTED, ALMOST EVERYONE IDENTIFIED CORRECTLY, the crowd labelled "illustration".
- **No Cyborg Cockroach reference:** the Cyborg Cockroach Short is not in this repository, so it could not be compared
  directly.
- **No 4K master yet.**

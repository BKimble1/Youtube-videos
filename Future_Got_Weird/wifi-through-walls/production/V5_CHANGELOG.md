# Wi-Fi Through Walls: V5 change log (targeted final revision)

**Unchanged from V4:**
- The approved narration (the same audio file and word timing, the same ElevenLabs take, ending question included).
- The 36.47 s runtime, the captions, the story order.
- The characters, the sets, the café street and the silhouette join.

**What was changed:** shots, choreography and joins, from V4. The V5 code is in `source/src/v5/`, copied from `v4/`
and edited; the joins are in `source/src/Film.tsx`.

## Changes

| Time | Change |
|---|---|
| 0–0.4 | The same cutaway, held still: him crouched behind the concrete wall, the screen's skeleton matching him. |
| 0.4–0.9 | **New.** His near arm snaps up; the skeleton's arm follows 0.08 s later (the radio's lag). |
| 0.9–1.5 | **New.** The camera moves toward the wall while he tucks in lower against it. The screen stays in frame, still tracking. |
| 1.5–2.25 | **New.** Close on his face, uneasy, with his hand at his chin. Soft wave trains pass through the space around him. |
| 2.25–3.2 | **New.** The camera follows the echoes' path into the wall's cut face, through the concrete, and out at the screen. The screen shows his pose, hand at chin. |
| 3.2–3.6 | Up the mast to the radio. |
| 3.6–10.7 | **One connected path instead of lingering shots:** the transmitter (the box opens on its board), the packets leaving the array, a wide view of the whole path (array → room → wall → him), the wall crossing, his body, and the echoes back to the receiver and its screen. Soft glints show where packets meet him (no rings). The screen now shows raw echo traces from the moment the radio transmits; the skeleton forms only on "AI creates a moving skeleton". |
| 10.7–14.9 | **Reordered:** his action (right hand up), then its reconstruction (the screen), then both side by side for the turn and the step, then the push into the screen. The screen's scale now allows for the raised hand, so the skeleton's hand no longer leaves the screen. |
| 15–18.9 | **Shorter street walk.** Then the camera rises and pushes in through the window at the router, which is talking to the customers' laptop and phone, and moves on to the separate receiver. |
| 19–20.75 | **The full-screen interface is replaced by a split screen.** Above: him walking past the window, seen from behind the receiver's antennas. Below: the receiver's laptop. Every step he takes writes a stripe into the received signal; his signature builds from it and is compared with signatures learned earlier, with a MATCH on #12. The small laptop in the scene shows the same match at the same moment. |
| 22.3–24.5 | **The corridor push now ends on the data wall's screen** showing the last walker's signature. |
| 24.5–27.1 | **Matching screen:** that new walk is compared with identities learned earlier, and the hit is her own learned identity (#27). **Results:** 197 tiles of small people in their own colours (the corridor walkers and he are among them) fill green, with a few amber misses. No percentage, and the result is labelled as an illustration. |
| 27.1–29 | **New join:** the zoom into his tile (#12) dissolves into him walking past the café, with the signal off him changing as he goes. |
| 29–30.4 | **New cutaway** through the window to the receiver's laptop, where his live pattern meets the stored #12. |
| 30.4–31.85 | Straight back out to a close shot of him walking on, **completely unaware** (V4's uneasy glance is removed). |
| 31.85–34.3 | The CCTV camera he walks under, then its own picture of him, held longer, until "or". |
| 34.3–35.3 | **New.** "Or Wi-Fi": no camera anywhere, only the café's router and receiver; its laptop holds his identity (#12) while he passes the window. |
| 35.3–36.47 | **New ending join:** the push into that laptop's screen dissolves into the lab's skeleton screen, and the camera pulls back to the wall-and-skeleton composition: frame 0. |

## Sound (`tools/v5/make_audio5.py`, timing from `tools/v5/events.ts` → `audio/v5_events.json`)

The V4 engine is unchanged; the cues were re-timed to the V5 picture:
- **Opening:** the arm snap, the tuck, the pass through the wall, and the screen redrawing.
- **Mechanism:** the cover latch.
- **Café experiment:** the café ambience inside, his steps through the glass during the split screen, the laptop rising, the match.
- **Study:** the push onto the screen, the #27 hit, the tile sweep.
- **Payoff:** the window cutaway, the match, back out.
- **Ending:** the receiver's identity tone, and the screen-to-screen whoosh.

No tones fall under "its hand" or "who you are".

## Fixed during the V5 QA pass (found in the first V5 render)

- **Split screen:** he was hidden behind the café's pier for about half a second. The upper camera now sits deeper in
  the room, angled through the right-hand window, so he stays visible throughout and no customer or laptop blocks the
  lens.
- **Receiver shot (34.3 s):** it opened with a customer's face at the frame edge. Reframed.
- **Skeleton at the ending's start:** the radio's 0.08 s lag was taken in film time, not loop time. For two frames
  after the screen dissolve, the screen showed the end-of-demo crouch, then popped to his actual pose. It is now
  computed in loop time and stays continuous through the dissolve and across the loop seam.
- **Ending pull-back:** it starts less close on the skeleton, so there is no sudden jump in scale.
- **Loop seam:** the ending's camera reached frame 0 still moving (around 10 per frame of picture change) while the
  opening starts at rest (under 1). It now eases to rest on frame 0, so there is no jolt at the loop.

## Checks on the delivered MP4

**File:**
- H.264 High, yuv420p, BT.709; 1080×1920 rendered natively; 30 fps; 1094 frames; 36.47 s.
- AAC 48 kHz stereo at 320 kb/s; audio-to-video lag 0 ms.

**Loudness:** −14.3 LUFS integrated, LRA 2.0 LU, true peak −1.4 dBFS (`qa/v5/V5_qa.json`).

**Loop:**
- Picture: the last-to-first frame change is 4.21, against a median of 8.31 between consecutive frames. The camera
  arrives at rest.
- Audio: the WAV mix is sample-continuous across the seam.

**Motion:**
- No black frames and no freezes of 0.7 s or longer.
- Every motion spike is an intended cut or move (`qa/v5/V5_motion_scan.json`):
  - out of the concrete (2.8 s);
  - into and out of the split screen (19.0 s and 20.8 s);
  - the lamp wipe (22.2 s);
  - out through the glass (30.6 s);
  - the CCTV shot, its picture, and the receiver (31.9 s, 33.0 s and 34.3 s).
- One-frame pops (`qa/v5/V5_pop_scan.json`): only the camera crossing the slab's cut face at 2.67 s (an intended
  move).

**Rig probe** (`qa/v5/rig_probe.json`; every on-screen frame of him and the walkers, through the loop seam):
- Ankle miss: 0.
- Planted-foot slip: 0.
- Backward elbows: none.
- Bone-length drift: at most 0.01 units.
- Peak joint acceleration: 37.8 (lab, including the new arm snap) and at most 53 (walkers).

**Speech:** ASR of the MP4 (`qa/v5/V5_asr_mp4.json`) gives Whisper 0.9% WER (it drops "anything", as in V3 and V4)
and Zipformer 5.4% WER (word confusions only).

**Frame review:** done from the MP4. Every 3 frames for 0–3.5 s, around every join, through the ending and across the
loop seam; every 6 frames elsewhere. Each fix above was then re-checked on the next render.

**Not done:** no one has watched it in real time with sound; the audio was checked by measurement and ASR only.

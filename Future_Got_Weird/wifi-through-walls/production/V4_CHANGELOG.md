# Wi-Fi Through Walls: V4 change log

**Kept from V3:** the approved narration (same audio file and word timing, same ElevenLabs take), story order, the
ending question, the caption style, the Weird Crew guesser and his rig.

**Rebuilt:** every shot. New code lives in `source/src/v4/`; the joins are in `source/src/Film.tsx`.

| File | Contents |
|---|---|
| `labSet4.tsx` | The lab: a true cross-section (floors above and below) |
| `hero4.ts` | His lab choreography |
| `Lab4.tsx` | Lab cameras, radio packets, detector screen |
| `packets.tsx` | Shared radio drawing |
| `cafeSet4.tsx` | The café: street, façade, interior |
| `Cafe4.tsx` | The café scenes |
| `Study4.tsx` | The study corridor |
| `ui.tsx` | The full-screen analysis UIs and the laptop match |

## What changed, by section

| Time | V4 |
|---|---|
| 0–0.35 | The first frame is the whole section. He is crouched and startled on one side of a solid concrete wall; on the other, the life-size detector screen shows his skeleton already moving with him. The T antenna array is on a mast above it. No CCTV, no camera feed, no labels. |
| 0.35–1.45 | He ducks lower (the skeleton matches) while the camera slides sideways. He tests with one arm, the skeleton's arm rises, and he reacts. |
| 1.45–3.5 | Radio packets become visible: short wave trains, not rings. The camera approaches the wall on his side and travels through the concrete (aggregate and rebar inside the slab). It emerges on the sensing side and moves to the receiver. |
| 3.5–9.5 | The mechanism, tracked rather than diagrammed. The box on the mast opens to the transmitter. Packets cross the room, slow and weaken inside the concrete, and reach his head, hip and knee; a few rays bounce off the office floor and wall. A side cutaway shows him rising. The echoes, shaped by how fast each body part moves, are followed back to the receive bar. On the screen, raw echo traces become keypoints, then the skeleton. |
| 9.5–14.5 | The live demo from three positions: close on him, a wide split of him plus the screen, and close on the screen. He raises his **right** hand in one continuous arc, and the skeleton's right (cyan) arm follows it. He turns his torso, steps out, then crouches back toward the wall; the skeleton follows every move. |
| 14.5–17 | The skeleton fills into a cyan silhouette. It stands up and walks out of the screen onto a café sidewalk (navy fade), where it becomes him. Pedestrians pass in front of and behind him, and the shops across the road add depth. |
| 17–22 | The café experiment, which reads differently from the pose demo. The router talks to the customers' laptop and phone (link dots), and its packets scatter off him to a separate receiver station inside. The camera moves continuously from the sidewalk through the window to that station, then cuts to the analysis screen: INCOMING SIGNAL → SIGNATURE → LEARNED EXAMPLES → MATCH on #12. No face, no photo, large text. Then a close track beside him, hands empty ("without their phones"), and a lamp post wipes to the study. |
| 22–27.5 | A study corridor with an access point and receivers. Three distinct participants pass one at a time while the data wall builds each one's signature. Then the matching screen (NEW WALK against walks recorded earlier, a hit on #12), the 197-participant grid filling green with a few amber misses ("ILLUSTRATION · NOT STUDY DATA"), and a zoom into cell #12. |
| 27.5–31.5 | The same café from inside, looking out (the reverse angle). He walks past the window; the receiver laptop links LIVE to STORED #12 with a check mark. The camera passes out through the glass to a close reverse shot of him walking on, unaware, then glancing uneasily. |
| 31.5–36.47 | He walks toward and under an obvious street CCTV camera, looking up at it. Then comes that camera's own picture (REC · CAM 2). The camera moves physically to the café router while he walks by, and pushes into the café's pier, which becomes the lab's concrete. Back on the wall: he steps behind it believing he's hidden, the screen reconstructs him, his expression changes, and he crouches into frame 0. No end card. |

## Fixes made during the V4 QA pass

- **Hand raise:** it had a two-frame hitch halfway (the arm swung out, stopped, then snapped up). Now one continuous
  arc. The rig probe's peak joint acceleration in the lab fell from 68.7 to 37.8 units/frame².
- **Skeleton → silhouette:** the silhouette drifted off the skeleton while the screen's skeleton was still visible, so
  two figures were on screen. The silhouette now locks onto the skeleton until it has filled it, and the screen's own
  skeleton fades as it takes over.
- **Wide split (12.1–13.3 s):** he was half out of frame. Reframed so his whole body, the raised arm, the wall and the
  screen are all in shot.
- **Café MATCH pill:** it sat on the #45 row while the highlight was on #12. Moved onto #12's row.
- **CCTV shot (31.9–33 s):** he was stuck at the left edge. The camera now turns toward him, so he walks into the
  middle under the CCTV.
- **Draw order:** a curb planter was drawn over him in shots looking back toward the road. Lamp posts and planters are
  now drawn behind him in those shots.
- **Study grid zoom:** the heading fades out instead of scaling up into a giant word.

## Sound (`tools/v4/make_audio4.py`, timing from `tools/v4/events.ts` → `audio/v4_events.json`)

- **Same engine as V3:** music bed, loop-safe circular mix, −14.3 LUFS integrated, about −1.4 dBFS true peak.
- **Picture-locked cues:** his planted steps and those of every walker, the radio packets, the echo arrivals at the
  receiver, the through-the-wall pass and the silhouette whoosh.
- **Café ambience:** through the glass outside, full inside.
- **Interface cues:** the signature and match cues, the study's match sweep (with low tones on the misses), the CCTV
  servo and REC blip, and the router chirps.
- **Unease:** a low detuned drone that grows from CREEPY to the CCTV shot.
- **Tone placement:** no tones under "its hand".

## Accuracy notes kept on screen

- **Separate demonstrations:** through-wall pose estimation (a dedicated FMCW radio with a T antenna array) and Wi-Fi
  identification (an ordinary router with a separate receiver and analysis) are separate experiments in separate
  places. The home/café router never makes skeletons.
- **Not a real incident:** the café is an illustration of the published experiment, not footage of a real incident.
- **Labelled as illustrative:** the 197 grid is labelled as an illustration. No accuracy figure is shown beyond the
  narration's "almost everyone", and no names are used.

## Checks on the delivered MP4

**File:**
- H.264 High, yuv420p, BT.709; 1080×1920 rendered natively; 30 fps; 1094 frames; 36.47 s.
- AAC 48 kHz stereo at 320 kb/s; audio-to-video lag 0 ms.

**Loudness:** −14.4 LUFS integrated, LRA 1.8 LU, true peak −1.4 dBFS (`qa/v4/V4_qa.json`).

**Loop:**
- Picture: the last-to-first frame change is 4.27, against a median of 7.91 between consecutive frames.
- Audio: the WAV mix is sample-continuous across the seam.

**Motion:**
- No black frames and no freezes of 0.7 s or longer.
- Every motion spike is an intended cut or move (`qa/v4/V4_motion_scan.json`): into and out of the concrete, the
  analysis screens, the lamp wipe, the CCTV cut and its picture.
- One-frame pops (`tools/v4/pop_scan.py` → `qa/v4/V4_pop_scan.json`): none, apart from the camera crossing the slab's
  cut face at 34.77 s (an intended move). A planter frame at 32.03 s was found by this scan and fixed before this
  render.

**Rig probe** (`tools/v4/rig_probe4.ts` → `qa/v4/rig_probe.json`; every on-screen frame of him and the walkers,
through the loop seam):
- Ankle miss: 0.
- Planted-foot slip: 0.
- Backward elbows: none.
- Bone-length drift: at most 0.13 units (out of about 1100 for his height).
- Peak joint acceleration: 37.8 (lab) and at most 53 (walkers).

**Speech:** ASR of the MP4 (`qa/v4/V4_asr_mp4.json`) gives Whisper 0.9% WER (it drops "anything") and Zipformer 4.5%
WER. Both are the same as V3: the narration is unchanged.

**Frame review:** done from the MP4, every 3 frames for 0–3.5 s and around every join, and every 6 frames elsewhere.
Contact sheets of single frames were also checked at the raise, the silhouette, the CCTV shot and the loop seam.

**Not done:** no one has watched this in real time with sound; the audio was checked by measurement and ASR only.

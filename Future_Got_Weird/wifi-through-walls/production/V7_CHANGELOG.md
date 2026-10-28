# Wi-Fi Through Walls: V7 change log (targeted visual revision)

**Unchanged from V6:**
- The approved narration (same audio file and word timing, same ElevenLabs take, ending question included).
- The story order and the 36.47 s runtime.
- The characters (the guesser's rig and design, the walkers), the sets and the caption style.

**Changed:** shots, choreography, displays and joins. The code is in `source/src/v7/` (copied from `v6/`); the joins are
in `source/src/Film.tsx`.

## Section by section

| Time | V7 |
|---|---|
| **Hook (0–3.75)** | |
| 0.0 | **Frame 0:** he is already dropping behind the concrete wall, and the skeleton on the large live screen (now 1.15 × 1.5 m, beside the wall) drops with him. |
| 0–0.35 | The urgent duck. The duck starts slowly and drops fast; about 40% of the drop happens in these 0.35 s (it begins in the loop's last 0.9 s). |
| 0.35–0.8 | **Lateral move:** the wall's solid side swings into view between him and the screen. The wall hides him, but not from the screen. |
| 0.8–1.5 | He leans away from the wall and the skeleton leans with him. |
| 1.5–2.35 | A push to the screen; corner ticks lock onto each of his joints. |
| 2.27 | **"STILL":** the skeleton flashes once, with a low impact and tone. |
| 2.35–3.75 | He rises to peek back at the wall over his shoulder, and the full skeleton follows. |
| **Mechanism (3.75–9.3)** | |
| 3.75–5.3 | Up from the screen to the radio: the box opens on its board. |
| 5.4 | The transmit bar; **one followed pulse** leaves (the other packets dim back). |
| 5.4–7.6 | The camera goes with that pulse across the room, into the concrete (slower and weaker inside) and to his head, where it glints. Its dotted path stays visible behind it. |
| 8.3–8.7 | Cut to the receive bar as its echo arrives. |
| 8.9–9.3 | Down to the screen: the raw traces. |
| **Skeleton payoff (9.3–13.7)** | |
| 9.3–10.4 | The skeleton is **built point by point**: 14 joints, one every 75 ms, each rising out of its trace. Limbs join once both of their ends exist. |
| 11.1–11.8 | Close on him: his right hand goes up. |
| 11.8–12.7 | Close on the screen: the skeleton's right (cyan) arm goes up. |
| 12.7–14.3 | Both side by side: the turn, the step, the crouch. |
| **Escalation (14.3–16)** | On "creepy" the camera pushes into the screen until its grid fills the frame. The skeleton fills in as a silhouette, and the street appears behind it as it walks out among the pedestrians. The empty navy fade is gone. |
| **New experiment (16–22.5)** | |
| 15–17 | The street. |
| 17–19 | The camera moves in to the café's ordinary router and the separate receiver and laptop. |
| 19–20.8 | **Split screen:** above, a low side track on **his walk itself**; below, the receiver's laptop. Every heel strike above writes a stripe into the received signal below, and his signature is compared with signatures learned earlier: MATCH #12. |
| 20.8–22.3 | The left window, where a customer sits on her phone, as he passes with empty hands. Then the lamp-post wipe. |
| **197 reveal (22.3–27.1)** | |
| 22.3–24.2 | Four different participants walk the test lane while the camera drifts the other way. Each one's signature completes on the data wall and shows the learned identity it matches (#03, #23, #41, #27, about 0.6 s apart). |
| 24.0–25.6 | One push onto a **wall-size results display** in the room. It shows the last walk (#27) against identities learned earlier, then **197** in large type ("participants, each matched to their learned identity"). |
| 25.3–26.8 | The tiles of people fill green with a few amber misses, culminating on "almost everyone correctly". |
| 26.3–27.1 | The camera pushes into the display onto his tile, which dissolves to him at the café. |
| **Personal stakes (27.1–31.8)** | |
| 27.1–28.0 | He walks past the café without touching anything or using a phone. |
| 28.0–30.2 | The camera moves in to the glass in front of the receiver's laptop: his live pattern meets the stored #12, the two outline in green, and **his picture (his tile) comes up**. No text needed. |
| 30.2–31.8 | Back to him close, walking on, unaware. |
| **Question and loop (31.8–36.47)** | |
| 31.8–33 | A street shot with the CCTV on the lamp post (bigger housing), with him walking toward it. |
| 33–34.4 | The CCTV's own picture of him, framed tighter. |
| 34.4–36.0 | **"Or Wi-Fi":** that picture stays above. Below, the café window: the router, the receiver's antennas, and its laptop holding his identity. No camera anywhere, no labels. Under the camera he slows to a stop (his feet plant) and starts to duck. |
| 36.02 | **Match cut** on that duck to the same duck behind the lab wall, with the skeleton ducking with him: the opening's composition, which runs on into frame 0. |

## Sound (`tools/v7/make_audio7.py`, timing from `tools/v7/events.ts` → `audio/v7_events.json`)

- **New cues:**
  - the duck's rush and landing;
  - the lean and the peek;
  - the joint-lock ticks;
  - a subtle low impact on "still";
  - the followed pulse (leaves, enters the concrete, meets his head, echo arrives);
  - 14 rising ticks as the skeleton's points are placed;
  - one chime per study match;
  - the push onto the results display;
  - the stop before the cut.
- **Levels:** about −14.3 LUFS, true peak −1.4 dBFS; the mix is sample-continuous across the loop.

## Measurement notes

- **Camera motion** (`tools/v7/cam_probe.ts` → `qa/v7/cam_probe.json`): mean 8.2 px per frame of camera-caused image
  motion. That is V5 15.3, V6 3.85.
  - V7 moves the camera more than V6 because the brief asks for a new composition every second or so.
  - The moves are eased, in one direction each, and motivated: the lateral reveal, following the pulse, the push to
    the screen and into the results display.
  - The fastest is the push onto the results display (about 27 px per frame averaged over 24–25 s).
- **Rig probe** (`qa/v7/rig_probe.json`), for him and four walkers: no planted-foot slip, no ankle misses, no backward
  elbows.
  - One arm in the lab deviates from its length by at most 2.4 rig units (about 1% of the arm), during the lean at
    1.1 s, where the hand reaches its knee near full stretch. It is not visible.
- **Street stop-and-duck:** his stepping foot finishes its swing and lands at 35.87 s; from there both feet are still.

## Checks on the delivered MP4

**File:** H.264 High, yuv420p, BT.709; 1080×1920 rendered natively; 30 fps; 1094 frames; 36.47 s. AAC 48 kHz stereo
at 320 kb/s; audio-to-video lag 0 ms.

**Measured:**
- **Loudness:** −14.4 LUFS, true peak −1.4 dBFS.
- **Black frames and freezes:** none.
- **One-frame pops** (`qa/v7/V7_pop_scan.json`): none.
- **Loop seam:** the last-to-first picture change is 2.29, below the 4.71 median between consecutive frames.
- **Motion spikes** (`qa/v7/V7_motion_scan.json`): only at the intended cuts (8.3, 11.0, 11.8, 12.7, 19.0, 20.8, 30.3,
  31.9, 33.0, 34.5 and 36.03 s).
- **Speech recognition:** Whisper 0.9% WER, unchanged (it drops "anything").

**Probes:**
- **Face probe** (`qa/v7/face_probe.json`): the largest single-frame changes of his head turn (0.12) and neck (4.6°)
  are at the 36.03 s match cut, which is a cut.
- **Rig probe:** as above (see Measurement notes).

**Frame review:** done from the MP4.
- Every 2–3 frames for 0–4 s, 12–15 s, 22.5–25.5 s and 34.5–36.47 s; every 4–6 frames elsewhere.
- Phone-size contact sheets (180×320 and 270×480 cells) without sound, to check that the story reads muted.

## Remaining visual defects (known, not fixed)

- **The match cut's duck is small on the street:** at 36.03 s he has stopped under the camera, but in the CCTV
  picture his crouch has only just begun when the cut lands (about 20% of the drop). The cut reads as a cut on his
  stop more than on a matching duck. The lab side of the cut is right: he drops behind the wall with the skeleton.
- **He is mostly hidden at the cut:** in the lab at 36.03–36.3 s mostly his legs and an arm show behind the wall's cut
  face (he is hiding), before the opening composition takes over.
- **Camera motion is higher than V6** (8.2 against 3.85 px per frame), by design (see Measurement notes). The push
  onto the 197 display (24.0–25.3 s) is the fastest continuous move.
- **No 3D-style blur on the pulse:** the followed pulse is drawn as a bold wave train with a dotted path. On the white
  lab walls it is legible but small at 5.4–6.0 s, before it crosses the screen's dark top.
- **Lab arm length:** one lab arm stretches by about 1% during the lean (rig probe); not visible.
- **Not done:** no real-time viewing with sound. The audio was checked by measurement and speech recognition. The 4K
  master has not been made; it waits for your review of this file.

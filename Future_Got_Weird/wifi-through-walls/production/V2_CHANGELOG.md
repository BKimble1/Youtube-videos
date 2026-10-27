# Wi-Fi Through Walls: V2 change log (targeted animation rebuild)

V2 keeps V1's story, approved narration (unchanged, same audio file), character designs, sets, captions and loop.
The changes below are the actual animation fixes, in priority order.

## 1. Rig: arms (`source/src/art/arms.ts`, new; `source/src/dc/Man.tsx`)

- **Arms are posed by joint angles (forward kinematics), not by free hand targets.**
  - The upper arm rotates from the shoulder; the forearm flexes forward from the elbow (never backward); the hand
    follows the wrist.
  - Every arm path between two keys is one a shoulder and an elbow can make: no backward elbows, and no arm that
    grows or shrinks.
  - The angles are converted to the rig's own IK targets, with the elbow side derived from the IK formula, so the rig
    draws exactly the FK pose.
- **A resting hand is solved onto the knee every frame** (`armToward`), after the feet are planted and the hips
  settled, so the hand stays on the knee while the body breathes and shifts.
- **The far arm no longer stays in front of the T-shirt** (new `farBehind` option). V1 forced the far forearm to draw
  in front of the torso, which pinned walking hands near the hips. Now it passes behind the body as a real far arm does.
- **Palm view** (`nearPalm`): the hand covering the security camera shows its palm.

## 2. Walk cycle (`source/src/art/walk.ts`, rewritten)

- **Every foot contact is an explicit plant.**
  - A planted foot is fixed on the floor (IK to the ankle), so nothing slides.
  - In swing the foot lifts on a low arc, the knee folds, and the heel lands first; the toe rolls up before toe-off.
- **Legs alternate.** The arms swing opposite their legs, and the elbow bends more on the forward swing than the back
  swing.
- **Body mechanics:**
  - The pelvis rises over the stance leg and dips at double support, and rocks with the legs.
  - The chest counter-rotates, the head is steadied by the neck, and there is a slight forward lean.
- **Knees.** V1/V2-draft knees were bent about 50° all the time, which read as a crouch-walk. Walking legs now use a
  later soft-IK onset (`legSoft` = 0.99), and the standing hip height is computed from the leg length. The stance
  knee is now about 20° at mid-stance.
- **Hips.** At double support the hips sink just enough for both legs to reach (`settleHips`), smoothed over ±0.1 s,
  so there is no corner in the hip path.
- **Per-character gait:** each walker has their own stride period, arm swing, elbow bend and lean.
- **Measured** (`qa/v2/rig_probe.json`, every frame of every walker): ankle miss 0, stance slip 0 per frame,
  arm-bone length deviation 0, backward elbow 0°, stance knee 20–44°.

## 3. Shot by shot

| Time | V1 problem | V2 fix |
|---|---|---|
| 0:00–3.5 | Skid against the wall; stiff arms | **New retreat.** Four backward steps of 0.2–0.3 m, the hips staying over the supporting foot (the first V2 draft let the hips run ahead and he looked seated in the air at frame 0). Back contacts the wall, then a deep squat: knees up, hips low, chest over the knees, near hand on the near knee, far hand on the far knee. Startled expression, then a glance toward the equipment; the display's skeleton copies every step about 0.1 s later. |
| 3.5–10.8 | The 7–8 s crouch read as sitting or asleep | Same cause-and-effect chain (display → transmitter opens → waves → wall → him → reflections → receiver → heat → skeleton). He now holds the squat with breathing, eye darts and blinks, eyes open and alert. |
| 11–14 | Raised arm came from behind the hair | **One clean far-arm raise,** forward and up from the shoulder with an open palm and a small wave, clear of the head and hair. The skeleton mirrors it. A slow 0.14 m camera push replaces the static hold. |
| 14–16 | Skeleton dissolved, then a hard cut | The skeleton dissolves into signal traces that fill the picture. **Across the cut the same traces keep flowing and fold into the café's Wi-Fi router** while the display's dark lifts off the street (0.6 s), so the signal carries the viewer into the café. A falling sweep sound marks it. |
| 16–22 | Walking arms stiff at the hips; the passer-by merged with the hero; the push to the laptop passed through the walkers | New walk for the hero and the passer-by, with arms swinging opposite the legs. The passer-by now crosses behind him under the transition and the two walk apart, so the bodies never overlap on screen. The seated customer leans over her laptop and the tracking camera is raised 0.12 m, so his head and shoulders read above hers as he passes behind her table. A cut on "identify" goes to the laptop (V1's push swept through both people). |
| 22–27 | Seven walkers too close; weak gaits | **Four participants, 1 m apart** (was seven at 0.6 m). Each has their own stride, arm swing and posture: a long easy stride, a quick short stride, the guesser, and a crate carrier whose arms are held and not swinging. Then the camera rises cleanly to the 197-participant results grid. |
| 27–32 | Held poses; the camera moves between street, laptop and window swept past him at arm's length | Natural walk throughout. Walker → cut on "recognizes" to the interface ("#12 · SEEN BEFORE") → cut on "without" back to him at the window as he notices it. Each shot has its own slow push. |
| 32–36.5 | Reach went up and back, the forearm crossed his face | **Reach rebuilt.** He turns toward the security camera, looks up, and reaches forward and up (shoulder 126°, elbow 12°), so the arm stays in front of his face, never over it. The camera is mounted where that palm lands (palm over the lens → "NO SIGNAL"). Then the retreat that frame 0 is in the middle of: the loop. |

## 4. Measured checks on the MP4 (`qa/v2/`)

| Check | Result |
|---|---|
| Stream | 1080×1920, 30 fps, 1094 frames, H.264 yuv420p; AAC 48 kHz stereo 317 kb/s |
| Loudness | −14.4 LUFS, true peak −1.4 dBFS, LRA 1.8 LU |
| Black frames, freezes ≥ 0.7 s | none |
| Loop seam (picture) | last → first frame change 3.2, below the median frame-to-frame change (6.7) |
| Cuts (motion scan) | 7, all intended: 18.97 laptop, 20.77 close-up, 22.33 corridor, 27.03 café, 29.37 laptop, 30.37 window, 31.97 office. The lab → café change at 15.2 s is now a transition, not a cut. |
| Narration (Whisper base.en on the MP4's audio) | 0.9% WER, the same as V1 |
| Frame-by-frame review | Every frame of 0–3.5 s, 11–14 s and 32–36.5 s, and every second frame of the rest, as contact sheets of the MP4. Failures found in that pass and rebuilt: the hips ahead of the feet at frame 0, chair-sitting at the wall, the reach forearm over the face, the hand snapping off the lens, the passer-by overlapping the hero, the customer's and hero's heads merging, camera moves through the walkers. |

## 5. Audio (`tools/make_audio.py`)

- **Footsteps from the picture.** Every heel strike of every walker on screen (62 in total, `audio/footsteps.json`
  from `tools/v2/footsteps.ts`) carries a soft sneaker step, quieter for people off-centre.
- **Two cue changes:**
  - The corridor's "walker matched" tones now follow the four walkers.
  - A falling sweep marks the café transition.
- **Unchanged:** the narration and its level, the music, ducking, loudness target (−14.3 LUFS), true-peak limiter,
  and the circular loop mix.

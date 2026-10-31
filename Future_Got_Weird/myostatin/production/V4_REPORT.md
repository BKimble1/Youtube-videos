# Myostatin V4: final retention pass

**File.** `exports/FGW_Myostatin_V4_REVIEW_1080x1920.mp4`. **It is not published.** The source is composition
`MyostatinV4` and mix `mix_v4`. Earlier versions: V3 at commit `49f84fe`, V2 at `27ec6ab`, V1 at `80637db`.

**Narration.** The approved ElevenLabs master is unchanged, word for word and with the same timings: 24.567 s.

## Measured (from the rendered file)

| Check | V4 |
|---|---|
| Format | 1080×1920, 30 fps, 737 frames, 24.567 s, H.264 + AAC 48 kHz; no decode errors |
| Unplanned single-frame jumps | none |
| Longest near-static run | 6 frames (0.2 s) |
| **Loop seam: last frame vs frame 0** | **4.6 mean abs. difference.** That is smaller than the film's median frame-to-frame change (7.5), so the wrap is smoother than an ordinary frame step. V3 was 52.8. |
| Audio loop seam | last sample to first sample: a jump of 0.0004. The music's period divides the length, and the opening swell already starts under the last frames. |
| Narration in the final file (Whisper base.en) | the locked text; homophones only (brake/break, superhuman/super human) |
| Loudness | −13.6 LUFS, −1.6 dBTP |

Evidence: `qa/v4/render_qa.json`, `qa/v4/final_asr.json`, `qa/v4/mix_measure_mix_v4.json`, and the contact sheets in `qa/v4/`.
The loop strip is `qa/v4/loop_seam_last3_first3.png`.

## 1. The first two seconds

| Time (s) | What happens |
|---|---|
| 0.00 | Tight on the flexed arm, already growing: the mass is rising at frame 0. |
| 0.15–0.65 | The biceps balloons. The mass goes from 0.50 to 1.06 on one rig: a peaked biceps, two-headed triceps and deltoid caps, not a scale-up. The sleeve stretches, its hem rides up, stitches pop, and the camera tracks back to show him. |
| 0.65–1.10 | Shock: eyes wide, brows shooting up, mouth open. His head recoils, then his eyes and head follow the muscle. |
| 1.02–1.60 | The camera pushes through the skin of the growing biceps. A clean window opens: skin, fat and fascia, then the fascicles. |
| by 1.5 | Inside the muscle. Fibres expand around the camera as it flies between them. |

## 2. The microscopic sequence: distinct physical events

| Time (s) | Event |
|---|---|
| 1.8–3.9 | Flying between fibres, with depth on three layers: far fibres through the gaps, the main plane, and soft near fibres passing the lens. Nuclei and capillaries pass the camera, and the fibres swell. On "WAY bigger" the camera settles on one fibre while new myofibrils zip in. |
| 4.0–5.25 | One myostatin molecule comes in from deep between the fibres, blurred and small, then sharp. The camera tracks it. |
| 5.3 | It binds: the camera pushes in and the receptor's arms close on it. |
| 5.6–6.4 | The brake: a bright signal runs both ways along the membrane and a ripple runs inward. Signals reach the nucleus and it goes dark. Assembly stops, and incoming building blocks are knocked back off the membrane. More molecules dock as the brake spreads. |
| 6.5–7.3 | The fibre tries to swell, twice, and is pulled back each time. |
| 7.43–8.45 | Cut on "But" to an animal born without the brake. A misshapen, inactive myostatin can't fit the receptor and bounces off, so nothing signals. The fibres thicken fast and shove their neighbours apart. |
| 8.45–9.0 | The fibre bundle turns 90° in true 3D projection: side-on cylinders become their cut ends, a cross-section. |
| 9.0–9.7 | Out to the whole muscle cut across: fascicles inside perimysium, inside the epimysium. |

## 3. Faces

One face design throughout: two eyes, both inside the silhouette, with the brows on the brow ridge and a fixed hairline. Head
movement is restrained (whole-head tilts only). The expressions:
- shock in the hook;
- amazement as he studies the muscle;
- an excited grin at "in humans";
- a quizzical look on "But here's the weird part";
- gritted-teeth strain through the curl;
- surprise on "Bigger";
- concern, with the inner brows lifting, on "without actually being super strong".

## 4. Variety

- **Cow.** The camera pulls out of the cross-section window in the cow's thigh, as the hide fills in over the muscle map. The cow walks on a four-beat gait: each hoof stays planted while the body travels, with a body bob and hoof falls. It makes a heavy plant on "huge", with shoulder load and dust.
- **Lab.** The scientist raises a syringe of glowing treatment (antibody molecules drift in it) and taps it, so bubbles rise. She lowers the needle into the sample and presses the plunger: the liquid level drops and the treatment spreads. The camera goes down the needle into the sample, where antibodies catch myostatin, the receptors stay empty, and the fibres thicken.
- **Strength.** The huge arm attempts a controlled curl; the weight barely rises, trembling. Inside the elbow, each contraction makes the biceps bulge while only a faint pulse runs down the tendon and the bone barely turns.

## 5. The loop

- As he struggles, his face tightens. The weight sinks back, and the camera rises to his concerned face.
- While the camera is on his face, the arm resets below the frame to the opening's size.
- He raises it into the flex, and the camera moves to his biceps as the muscle begins to swell again.
- From 23.2 s the arm, face and camera run on the opening's own clock, at t − 24.567 s. So the last frame and frame 0 are consecutive moments of one motion: no fade, no black frame, no jump and no pause.
- The opening swell starts under the last 0.55 s.

## Known limits

- **The arm resets while off screen.** The reset happens under a 0.25 s face close-up. The deltoid at the very bottom edge of that shot changes slightly.
- **The micro views are 2.5D,** with parallax layers and a true 3D projection only for the bundle's turn. The cow and lab are stylised 2D.
- **No one has listened to it in real time.** This environment has no audio playback; it was checked by measurement and ASR only.

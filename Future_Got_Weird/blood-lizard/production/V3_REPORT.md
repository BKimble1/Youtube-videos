# Blood Lizard V3: hook and retention rebuild

**Deliverable.** `exports/FGW_Blood_Lizard_V3_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, H.264 (CRF 16, yuv420p,
BT.709) with AAC 320 kb/s stereo. It has 630 frames and runs 21.000 s. sha256 `dd5026d0…1fbc`. **It is not published.**

V2 is kept for reference: `exports/FGW_Blood_Lizard_V2_REVIEW_1080x1920.mp4`, source at commit `af217bb`.

## Narration

The narration is the approved ElevenLabs master, unchanged and sample for sample (sha256 `0ec26019…`). The picture
is keyed to its measured word times. On the final V3 file, Whisper base.en gives WER 0.000.

## Beat sheet as built

| Brief | V3 |
|---|---|
| 0.0–0.5: the moment of danger. The lizard is large in the foreground with a canine lunging; the blood squirts at once, with no introductory predator shot. | Frame 0 already has the lizard large in a three-quarter view in the foreground, with the coyote's jaws lunging at it. The blood leaves the front corner of the lids at **0.15 s** and is in the mouth at **0.27 s**. |
| 0.5–2.0: follow the jet onto the mouth and muzzle; immediate recoil; fast liquid with droplets, not a rigid line; a readable angle showing both animals and the connection. | New stream model (`art/jet.tsx`): every parcel flies from the pore in 0.12 s. A rippling glossy stream near the eye breaks into motion-stretched droplets that fan out, then splash back off the target and fall. The coyote snaps back at 0.38 s. One two-shot holds the lizard, the stream and the mouth. |
| 2.0–4.0: recoil and head shaking; the lizard grounded; continuity. | Two head shakes (1.55–2.45 s and 2.65–3.2 s) and a step back. The coyote stays in frame: its head rears up rather than back. The lizard stays planted and puffed, with blood at its eye. |
| 4.0–7.0: a smooth push to the eye into a clean cross-section; pressure rising, shown by expanding vessels and fluid motion; no static close-up. | Push at 3.75–4.55 s. The cutaway window opens round the intact eye. The camera keeps travelling: to the muscle squeezing the vein shut ("When a predator attacks"), then along it to the sinus ring. The ring swells step by step, and a bright pressure wave runs round it on every heartbeat while cells crowd and the artery pulses wider. |
| 7.0–10.0: the mechanism and a brief release through the eye region; no eye outside the skull, no pierced eyeball. | The camera moves on to the lid vessel ballooning at the front corner, and on "BURST" it tears at the pore. The eye stays seated in its lids and socket throughout; nothing passes through the eyeball. |
| 10.0–13.0: back outside; a second spray that differs from the opening, stressing mechanism and trajectory, in sync with the narration. | A near-profile trajectory shot rides out of the head with the blood along the whole arc. The squirt has a range: it spatters on the sand short of the coyote, which lunges in, and on "mouth" its open mouth enters the stream. |
| 13.0–17.0: a strong reaction (pulling back, head shaking) while the lizard escapes; consistent anatomy and limbs. | It yanks its head away with the mouth gaping and tongue out. It shakes its head through "disgusting", backs off and spits on "spit". From 13.3 s the lizard turns and runs, and the camera stays on both, then follows the lizard. |
| 17.0–19.0: a low tracking camera on the scurrying lizard; no tiny-animal wide shots. | The camera tracks close and low, with the lizard about half the frame width, and out-of-focus foreground pebbles slide past. |
| 19.0–21.0: the predator comes back into frame, the lizard turns its head toward the camera, and a fast smooth push into the opening for a seamless loop. | The lizard stops and turns to face the camera, then back into its three-quarter pose with the lids swelling. The coyote charges back in from the right, and a fast continuous push lands on frame 0. The film ends one desert period (45 cm) left of its start, and the desert layers are periodic, so the loop is exact. |

## Measured QA (`qa/v3/`)

- **Format.** `render_qa.json`: 630 frames decode with no errors. The median frame-to-frame change is 3.13. There are
  no unplanned large changes; the planned fast moves are the squirt and snap-back, the push, the burst, the second hit,
  the spit, and the push into the loop. The longest near-static run is 4 frames.
- **Loop.** The last frame against frame 0 measures MAD 4.86, below a typical frame step. `loop_seam_last3_first3.png`
  shows one continuous push-in. The audio seam jump is 0.02, with the music period dividing the film and the growl
  placed across the wrap.
- **Contact sheets.** `contact_every_0.5s.png` and `hook_0-2.5s_every_3rd_frame.png`.
- **Mix.** `mix_measure_mix_v3.json`: −14.1 LUFS integrated, true peak −1.62 dBTP, voice −17.2 LUFS, bed −28.9 LUFS.
  At the key events the effects sit 9–15 dB under the voice, as sharp transients. Sounds used:
  - the generated squirt, wet impacts and splatter;
  - the coyote's snort, head-shake flaps, gag and spit, growl and paws;
  - the lizard's claws and sand shuffles;
  - inside the head: heartbeat, vessel stretch and the muscle squeeze.

## Known issues (for review)

- **Partial coyote.** In the recoil and reaction two-shots the coyote is mostly its gaping mouth and tongue, with its
  eye at or past the top right of frame. That is the cost of keeping the lizard large in a 9:16 frame.
- **Stream physics.** The droplets are drawn, not simulated. Speed, break-up, fan and splash are designed to read as
  liquid at 30 fps.
- **Audio not auditioned.** This environment has no playback. Levels and intelligibility were measured.
- **Subtitles.** None are burned in. The brief's "approved subtitles" can be added at upload.

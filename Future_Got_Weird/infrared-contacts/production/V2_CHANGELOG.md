# Infrared Contacts V2: changelog (visual rebuild on the locked V1 audio)

**Export:** `exports/FGW_Infrared_Contacts_V2_REVIEW_1080x1920.mp4`
- 1080×1920, 30 fps, 891 frames, 29.70 s, 21.1 MB.
- Captions burned in (same wording and timing as V1).
- No 4K master yet, as requested.

**Source:**
- `source/src/v2/`: composition `InfraredContactsV2`.
- V1's composition `InfraredContacts` still renders, and its output is unchanged.

## Audio: untouched, verified

- **Picture-only render.** V2 is rendered without audio. V1's exact AAC audio stream is then copied in without
  re-encoding.
- **Byte-identical audio.** SHA-256 over the audio packets is `79e9a173…dd06d1` for both the V1 and V2 reviews.
- **Same mix and timing.** Narration, music, effects, pauses and the 29.7 s timeline are V1's. The source mix is frozen
  as `audio/mix/FGW_Infrared_Contacts_V1_mix_APPROVED.wav` (SHA-256 `9104607b…2192`). The stream copy is
  `audio/mix/FGW_Infrared_Contacts_V1_REVIEW_audio.m4a`, and the V1 cue table is `audio/cues_V1_LOCKED.json`.
- **Narration and captions intact.** A transcript of V2's own audio matches the approved narration exactly (1.000), and
  23/23 caption windows match.
- **Sound effects tied to picture.** Every V2 picture event is placed on the V1 sound event it belongs to
  (`src/v2/timing2.ts`):
  - lens tap 0.39 s;
  - flash tones 3.40 and 4.00 s;
  - eye-open swish 4.95 s;
  - visible chime 6.255 s and infrared "nothing" thud 7.205 s;
  - lens click 8.40 s;
  - absorption tones 10.23 and 10.83 s;
  - emission accent 11.5 s;
  - lids closing 13.55 s;
  - four visible-light stops 15.09–15.55 s;
  - infrared entering the lid 17.45 s;
  - lens tick 19.10 s;
  - conversion 20.24 s;
  - retina bloom 21.5 s;
  - payoff flash 22.24 s;
  - transmitter cloth 25.75 s;
  - four button presses and their flashes;
  - page turn 27.95 s.

## Most important visual changes

1. **Hook (0–4.85 s) rebuilt.**
   - **Frame 0:** a macro of a transparent lens dome already arriving. It refracts and magnifies the iris behind it,
     with glints, a cyan rim and a sweep highlight. It lands at 0.39 s, squashes, overshoots, settles, and sends out a
     tear-film ripple. The finger leaves fast.
   - **0.78–1.0 s:** the lid shuts.
   - **About 1.0 s:** the wearer's view opens *out of the closed lid line* (no hovering circles) into darkness. The first
     green-cyan flash lands at 1.34 s, so the premise is on screen within about 1.3 s.
   - **Two-shot:** a continuous pull-out to the closed-eyed lead and a hand aiming a compact transmitter. The press
     glints the device's dark-red window.
   - **The pulse:** the camera rides a schematic infrared pulse back into the closed eye. The view reopens for flashes
     on the two flash tones.
   - **Return:** out to the face, with the eyes shut and nothing visible from outside.
   - V1's black-and-green circles over the eyelids are gone.
2. **Ordinary vision (4.85–7.9 s) is new.**
   - The lead opens their eyes and the scene clears to a light explanation field.
   - A spectrum strip (VISIBLE rainbow, INFRARED dashed) highlights each wave in turn.
   - Visible light enters the pupil, the pupil constricts and the iris warms on the chime. An infrared wave enters and
     nothing happens on the thud.
   - The camera then pushes into *the same open eye* and the cutaway opens on anatomically open eyelids.
3. **The lens, then the material (7.9–13.7 s).**
   - The lens slides onto the cornea with the click. The camera continues into a material with depth: tear-film sheen,
     polymer network, slow refractive caustic bands, a deeper out-of-focus particle layer and near out-of-focus
     crystals.
   - **Nanocrystals.** The purple spheres are replaced by hexagonal core–shell nanocrystals.
   - **Absorption and emission.** The marked crystal visibly takes in two infrared packets: its facing edges light
     amber, energy rings fill and lattice sites light up. It then turns green and releases one emission with expanding
     rings.
   - **The ripple.** On the pull-back, conversions ripple across neighbouring crystals while infrared streams in.
   - **Back out.** The camera returns to the section, where the lids anatomically close on the 13.55 s cue.
4. **Closed-eyelid sequence (13.7–22.9 s) is now a journey, not a held diagram.**
   - **Barrier.** Out to the real closed-eyed face, in to a side-on cutaway of the closed lid. The camera travels along
     the lid: visible packets hit it in the upper lane and are absorbed with warm glows in the tissue. Then it pans down
     to the infrared lane, where packets pass through, one attenuating.
   - **Follow the light.** The camera follows one infrared packet through the lid to the lens and dives into the
     material. The crystal converts on 20.24 s. The camera then follows the green light inward through the cornea,
     pupil and lens to a broad patch of retina.
   - **Payoff.** From the retina, the wearer's view opens for the payoff flash at 22.24 s and closes back onto the closed
     eyelid.
5. **Secret-code ending (22.9–29.7 s) restaged.**
   - **Asleep.** The lead sleeps with a slow head settle, and passing window lights sweep across the scene. A second
     unaware passenger is now asleep on the upper bunk.
   - **The split.** The sender raises the transmitter, and the frame splits out of the lead's closed eye: above, the
     compartment where nothing is visible (the sender pressing, the reader turning a page, the sleeper); below, the
     wearer's darkness with the short-short-long-short code in sync with the presses.
   - **Close.** The split folds back into the closed eye, the sender smiles, the lead's tiny smile appears, and the
     camera pushes in.
6. **Motion polish.**
   - The wearer's view grows at an even rate of covered area (square-root pacing). This cut the largest frame-to-frame
     jumps from 106 to below 30.
   - Flashes have soft attacks.
   - Every remaining frame-to-frame spike is a deliberate flash onset: hook 3.43 s, payoff 22.27–22.30 s, and the code
     pulses (small).

## Checks run on the exported file

- **Stream:** H.264 High, 891 frames, bt709, keyframes every 0.5 s or less.
- **Picture:** no black or frozen segments.
- **Audio:** −14.5 LUFS and −2.3 dBTP (V1's).
- **Motion scan:** mean frame change 9.8 (V1: 5.9), so the cut is busier. The maximum is 78.6 at 3.13 s: the
  deliberate fly-in that follows the pulse into the eye, one smooth acceleration with no spike.
- **Visual inspection:**
  - frame strips across every section (`qa/v2/strips/`);
  - a phone-size sheet with the Shorts UI mask (`qa/v2/review_phone_ui_sheet.png`);
  - a two-shot check (`qa/v2/twoshot_2.6s.png`).

## Remaining imperfections (honest list)

- **Not watched or listened to in real time.** This environment has no playback. Pacing and the feel of the flashes
  need a human pass with sound.
- **Ordinary-vision demo:** the lead's eye is drawn without the lens, as the "ordinary eye", even though the lens went in
  at 0.39 s. It is signalled by the explanation-field background and the narration, not stated.
- **Hook pace:** the hook is fast:
  - ECU → wearer's view → two-shot → back into the wearer's view → face, all in 4.9 s.
  - It may read as busy. If so, the first view (1.0–1.9 s) could be trimmed.
- **Hook transmitter:** it is small on a phone (about 100 px). The press reads through the hand, the dark-red window
  glint and the pulse.
- **Loop:** no loop. The last frame is a medium shot of the lead and the first is the eye macro, so it plays as a cut.
  The brief said not to force a loop.
- **Bodies:** body animation is still cutout-level (breathing, head settle, the sender's arm raise and thumb presses,
  a page turn). Faces carry most of the acting.
- **Packets and labels:** the light packets and VISIBLE/INFRARED chips are schematic overlays by design. In the normal
  train view the infrared appears only as a faint dashed amber pulse.

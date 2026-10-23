# Laser Voices V1: production and QA report (first review cut)

23 Oct 2026. **Review cut, not a final master, not published.** Checked by measurement, speech recognition and decoded
frames. **Nobody has watched it in real time or listened to it**: this environment has no audio playback or video
viewer, so every check below is a measurement or a still/strip read from the rendered MP4.

## Deliverables

| File | What |
|---|---|
| `exports/FGW_Laser_Voices_V1_REVIEW_1080x1920.mp4` | 1080×1920, 30 fps, 1022 frames, 34.07 s, H.264 High CRF 16 (keyframe every 0.5 s, BT.709) + AAC 320 kb/s; burned-in captions; 19.2 MB |
| `exports/FGW_Laser_Voices_V1_MASTER_2160x3840.mp4` | the same cut rendered natively at 2× (vectors, not upscaled); see "Master" below |
| `captions/FGW_Laser_Voices_V1.srt` | 23 cues from the measured words |
| `production/NARRATION_APPROVED.txt` | the approved narration (the only authoritative text) |
| `audio/narration/FGW_Laser_Voices_narration_final.wav` | take 3, unedited, 48 kHz / 24-bit, laid at 0 s |
| `audio/narration/voice_provenance.json` | voice, prompts, all 4 takes with hashes and measurements, selection |
| `source/src/data/timeline.json`, `audio/narration/words_final.json` | measured word timing and caption phrases |
| `audio/mix/FGW_Laser_Voices_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/sfx_cues.json`, `audio/cues.json` | mix, measurements, effect list, picture cue export |
| `cover/FGW_Laser_Voices_cover_candidate_29.7s_1080x1920.png` | cover candidate: a frame of the review MP4 at 29.7 s |
| `production/SOURCE_NOTES.md` | sources, access, claim ledger, depiction choices |
| `upload/DESCRIPTION_DRAFT.md` | description draft with references |
| `qa/v1/` | QA measurements, phone sheet, strips, motion scan, model sheet |

## Narration

- Voice: ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), the established FGW narrator. It is the voice in
  the most recent production record (Invisibility Shield, 23 Oct 2026), re-confirmed in the workspace today.
- 4 takes, 2 prompt variants (delivery tags and capitals on the brief's emphasis words; spoken words exactly as
  approved). All 4 are word-perfect by Vosk. The only difference, *its → it's*, is a homophone.
- Selected: take 3, unedited. Its opening is one connected thought (no pause between "at you," and "you could"; the
  other takes pause about 0.28 s there). Its two ellipsis beats are short (0.47 s after "laser…", 0.44 s after "move…").
- Pace:
  - 101 words, speech 0.00–33.45 s;
  - 181 wpm over the whole span, 209 wpm articulation;
  - the film runs 34.07 s, inside the 31–35 s target.
- Selected by measurement; nobody listened to the takes. The emphasis on the six key words was requested in the
  prompt; whether it lands is unverified (a rough per-word level/duration check is in the session, not a judgement).

## Timeline (seconds, from `source/src/story.ts`, `cams.ts`, `timing.ts`)

| Beat | Time | Narration | Picture |
|---|---|---|---|
| A | 0.00–4.94 | If someone pointed this laser at you, you could hear a voice that nobody beside you hears. | Frame 0: her brows already lifting, a small involuntary turn toward her left ear; he reads his tablet just behind her. 0.75–2.55: the camera widens to the room, connecting her to the tabletop transmitter; the dashed IR path appears briefly (0.8–3.95) with the teal received accent at her ear. 3.0–4.4: she glances toward him; he does not react. |
| B | 4.94–7.04 | And you wouldn't need anything in your ears. | One curved push to her bare left ear, which stays the focal target (cheek, hairline and ear rim in frame). |
| C | 7.04–14.83 | The beam is invisible. But when water vapor … creating tiny sound waves. | 7.0–8.9: the ordinary ear, no beam. 8.94: the dashed path and the "IR PATH · ILLUSTRATED" legend. 9.2–9.9: a magnifier opens from the air just outside the ear, ear rim visible beside it: H₂O among faint air → light packet absorbed (10.76) → warm glow → expansion ring (12.3) → teal pressure fronts to the ear's surface, with two quicker repeats (13.3–14.6). Closes into the same point 14.83–15.45. |
| D | 14.71–23.07 | Now, sweeping that beam … from eight feet away. | Pull back along the path to the transmitter (16.37). The section opens (15.9–16.5): laser module, beam to the scanning mirror, out of the exit. The mirror oscillates, slowed; the outgoing path follows it. 17.8–18.8: travel up the path to her position, where the sweep's wavelets gather into one front (shown while "concentrates the sound where you're standing"). 20.25–21.89: widen to the room. 21.74–23.67: one "8 FT" dimension line from the exit to her ear, then retired. 22.2: he glances toward the aisle. 22.6: he pivots. The section closes by 23.07. |
| E | 23.37–30.70 | But if someone walks between you and the laser… The voice suddenly stops. They can't hear your message. They're blocking it. | All three elements in one view. He walks (planted feet), pauses at the edge of the beam (25.4–26.7), steps in. **27.10**: his shoulder cuts the path (the downstream path, the ear accent and the message audio go on the same frame); the TX light keeps blinking. She turns, puzzled. 27.34–28.84: a push in the same shot onto the contact point and her face. He reads, calm, unaware. A brief ring marks the contact on "blocking". |
| F | 30.74–34.07 | And the second they move… You hear it again. | He walks on (31.34). **31.93**: the path clears; the path, the accent and the message return on that frame. The push back to her face, with the same framing as frame 0; her recognition on "again". The path fades out by 33.6 (ordinary invisible beam). End. |

## Transition list (outgoing → incoming → new information → decision)

1. Her face (hook) → room (widening, 0.75–2.55) → the transmitter and its relation to her ear, and the unaffected
   bystander → **keep**.
2. Room → her ear (curved push, 4.94–7.04) → nothing is worn in the ear → **keep**.
3. Ear → the air beside it (7.04–9.25) → where the sound is made → **keep**.
4. Air → magnified air (local magnifier, 9.2–9.9 open, 14.83–15.45 close, into the same point) → absorption, heating,
   expansion, pressure fronts, completed once before leaving → **keep**.
5. Air/ear → transmitter (pull back along the path, 14.71–16.37) → the source and its scanning mirror (section) →
   **keep**.
6. Transmitter → her position (travel along the path, 17.82–18.77) → localization: wavelets gather where she stands
   (a new scale and new information, not a return to the molecules) → **keep**.
7. Her position → room (20.25–21.89) → the 8 ft scale, and the bystander's intended route → **keep**.
8. Room → contact point and her face (push in the same shot, 27.34–28.84) → the cut at his shoulder and her reaction,
   readable at phone size → **keep**.
9. Contact → her face (31.57–32.87) → restoration, ending on the opening framing → **keep**.

Removed or merged in development:
- A separate device-wide view: merged into move 6, because the path crossed the bystander's body.
- A straight push to the ear: it passed in front of the bystander, so it was curved round him (move 2).
- An F camera route through the bystander's exit path: rerouted.

There are no cuts; the film is one continuous camera.

## Checks performed and results

**MP4 measurements** (`tools/qa.py`, `qa/v1/review_qa.json`):
- H.264 High 1080×1920 30/1, 1022 frames, yuv420p BT.709; AAC 48 kHz stereo about 317 kb/s.
- Duration 34.069 s.
- Loudness −14.5 LUFS integrated, LRA 3.8, true peak −2.6 dBFS.
- No black segments. No freezes ≥ 1 s. Maximum keyframe gap 0.5 s.
- MP4 audio vs mix: 0.0 ms offset, correlation 0.99996.

**Narration in the MP4**:
- Vosk free transcript of the MP4's own audio matches the approved narration word for word, except the its/it's
  homophone (WER 0.01).
- Caption windows: 22/23 by ASR. The one flagged window ("absorbs its light,") is window bleed from the neighbouring
  words plus the homophone. The caption text itself is asserted equal to the approved narration when it is built
  (`tools/make_narration.py`).

**Mix** (`audio/mix/mix_measure.json`):
- Voice stem is the source × one gain (correlation 1.000000).
- Voice is 17.5 dB over everything else in the 400–5000 Hz phone band.
- Message stem RMS: −32.3 dB before the block, −140 dB (silent) while blocked, −32.1 dB after restoration.
- The mix is stereo with the message 18 % toward the left. Mono fold −17.6 LUFS (the expected −3 dB from averaging); the
  message is present in both channels.

**Obstruction** (`tools/check_block.ts`, computed from the bystander's body against the path):
- BLOCK at frame 813 (27.100 s); the word "stops" starts at 27.14.
- CLEAR at frame 958 (31.933 s); "You" starts at 32.31.
- The overlay, the ear accent, her expression keys and the audio gate all derive from this one function.

**Motion scan** (`tools/motion_scan.py`, `qa/v1/motion_scan.json`):
- No one-frame spikes.
- Mean frame change 2.2. Maximum 28.6 at 15.2 s (the pull back from the ear to the transmitter, a fast but eased move).
- An earlier render had 9 spikes, all one cause: transmitter parts projected from behind the camera covered the frame
  (black frames at 0.6–1.0, 6.0, 15.5 and 32.5 s). This was fixed in `Room.tsx` and re-checked.

**Frame stepping** (`qa/v1/strips/`):
- At step 1: both occlusion boundaries (`block.png`, `clear.png`).
- At step 2–3: every camera hand-over (`hook`, `push_to_ear`, `mag_open`, `mag_close`, `ear_to_device`, `to_sweep`,
  `to_cross`, `eight_ft`, `push_close`, `to_face`, `end`).

**Muted, phone-size**:
- `qa/v1/review_phone_ui_sheet.png`: 30 frames at 360×640 with an approximate Shorts UI mask. The captions (centred at
  y = 1450) stay clear of the bottom UI band and of the ear, the magnifier, the path and the contact point.
- These are stills read at phone size, not a real-time muted playback.

**End to start**: `qa/v1/strips/loop_seam.png`. Her face sits at the same position and scale at the last and first
frames. The mean pixel change at the seam is 16.4, against 0.2 between the last frames: the bystander, who has walked
out, is back behind her at frame 0.

**Master** (`exports/FGW_Laser_Voices_V1_MASTER_2160x3840.mp4`, 47.7 MB, `qa/v1/master_qa.json`,
`qa/v1/master_motion_scan.json`):
- 2160×3840, 1022 frames, 34.069 s, vectors rendered at 2× (not upscaled).
- −14.5 LUFS, true peak −2.6 dBFS.
- 0.0 ms offset to the mix. Vosk WER 0.01 (its/it's). Caption windows 22/23 (as the review).
- No black segments or freezes. No motion spikes (maximum 28.6 at 15.2 s, the same eased move as the review).

**Native-resolution stills** (`qa/v1/native/`, crops of master frames):
- the hook faces;
- the exposed ear;
- the pressure fronts in the magnifier;
- the transmitter section and mirror;
- the contact point with both characters' hands;
- the end face.

They show clean contours, five-digit hands and pupils with highlights.

**Characters**: `qa/v1/model_sheet.png` (recipient, bystander, the exposed ear).

## Concrete remaining issues

1. **No real-time viewing or listening.** Pace, emphasis, mix balance and how the message murmur sounds are
   unverified by ear.
2. **Primary sources not opened** (blocked hosts). The blocking ending is physical inference; it is consistent with
   "not everyone who crosses the beam" but I found no explicit blocking test (`SOURCE_NOTES.md`). Fidelity caveat: the
   swept method is reported as low fidelity ("buzzing insect"), while the film's message is voice-like.
3. **Crossing wide (21.9–27.3 s) is small at phone size.** Heads are about 100 px. The cut itself (27.1) reads mainly
   through the path ending and the ear accent vanishing; it becomes clear at about 28.3 when the push lands.
4. **Sweep view (18.8–20.3 s).** The bystander stands directly behind her from this angle, so the path overlay crosses
   his tablet and hands. He is physically behind the path, but the frame is busy.
5. **His hands during the pause (27–31 s).** The tablet turns edge-on to camera and his two hands read as
   gesturing/clapping rather than holding it.
6. **Ear close-ups (7–15 s).** His sleeve is at the left edge. It is geographically correct but distracting.
7. **Hook ear legibility.** At phone size her exposed ear is partly under the tucked hair strand for the first second;
   it reads clearly from about 1.0 s, when the accent appears.
8. **Loop.** He reappears behind her at frame 0 after leaving. Her framing matches; his presence is a reset.
9. **Illustrative exaggeration.** The mirror's tilt is drawn about 3.2× and slowed. The path is drawn to the listening
   position and fades there (the real beam continues).
10. **Reference projects missing.** "Death Clock" and "infrared-contacts" are not in this repository (searched). The
    rigs come from Invisibility Shield V2 (`Person.tsx`, `Head3.tsx`, whose limbs and hands descend from the Death Clock
    rig per that episode's README), with new proportions:
    - larger heads and shorter torsos;
    - an exposed left ear;
    - glasses and a beard for the bystander;
    - a tablet prop;
    - planted-foot walking;
    - a mirrored screen basis.
11. **The room is sparse.** A bench, a playback unit, a whiteboard, a laser sign and a doorway.

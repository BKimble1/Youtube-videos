# Laser Voices V4: rebuild and QA note

24 Oct 2026. V4 rebuilds the picture: a new hook, five worlds, a new cast rig, new staging, camera and transitions.
It also has a new sound design. **Not published, not final.**

Nobody has watched or listened to it in real time; I can't play video or audio here. Every judgement below comes from
one of these, listed under "How it was reviewed":
- decoded frames of the exported MP4 (contact sheets at 4 frames per second, plus frame strips);
- frame-difference measurements;
- free speech recognition;
- audio measurements.

## Files

- `exports/FGW_Laser_Voices_V4_REVIEW_1080x1920.mp4`:
  - picture: 1080×1920, H.264 High, 30 fps, 1022 frames (34.067 s), bt709;
  - audio: AAC-LC 48 kHz stereo (a 320k target; ffprobe reports 272 kb/s).
- `captions/FGW_Laser_Voices_V4.srt`: byte-identical to the V1 SRT. It has the same 23 cues, burned in with the V3
  caption style.
- Source: `source/src/v4/`. The composition is `LaserVoicesV4`, with the still `V4Still` and the cast sheet `V4Cast`.
- Audio:
  - the mix: `audio/mix/FGW_Laser_Voices_V4_mix.wav`;
  - the stems (regenerated, git-ignored): `audio/mix/stems_v4/`;
  - the picture cues: `audio/cues_v4.json`;
  - the measurements: `audio/mix/mix_measure_v4.json`.
- Evidence: `qa/v4/`.
- V1–V3 exports, sources, audio and captions are untouched.

## Narration: preserved

- The same approved file (sha256 `b22271734436…`), unedited, at sample 0 and the V1–V3 gain (×1.4303098).
- No stretch, pitch change or edit. The master stage is the same tanh soft clip at −1.5 dBFS.
- Free recognition (Vosk, no script given) of the exported MP4: WER 0.010. The only difference is "its" heard as
  "it's" (`qa/v4/asr.json`).
- Integrated loudness: −14.55 LUFS (V3: −14.57). Sample peak: −2.55 dBFS.

## What was built

**Cast.** The channel's own characters (`cast.ts`) are on a 3D-joint cutout rig with IK legs and arms, planted
footfalls and real walk cycles:
- the lead: the guesser (red spiky hair, striped tee);
- the friend: clerkB (bun, cardigan, glasses, cup);
- the scientist: the checker, in a lab coat and goggles;
- the crowd, the lab listener and the colleague: the other cast members.

**Five worlds:**
1. A sunlit museum atrium: a gallery, columns, banners, plants, exhibits and a 14-lane walking crowd.
2. His ear in section: pinna, an empty canal, eardrum, ossicles and cochlea.
3. The air at molecular scale: N₂, O₂ and H₂O. The share of water molecules is exaggerated so they can be seen.
4. The transmitter's optics, through its open top: the laser module and a spinning hexagonal mirror.
5. A clean photoacoustics lab: an optical table, the transmitter on a post, racks, a LASER IN USE light, a
   measured floor tape and an "8 FT" stencil.

**Story beats, timed to the locked narration:**

| Time (s) | Beat |
|---|---|
| 0–1.6 | Walking two-shot. A whisper at his ear (a local air shimmer, no bubble); he snaps toward it. The camera whips over his head to look where he looks: nothing there. |
| 1.6–3.6 | The friend is unbothered. A push to his ear while he hears it, then a fast slide to her ear (silent in the mix). |
| 3.6–5.0 | The camera pulls back up and away, ending behind the tripod-mounted transmitter aimed at his ear. |
| 5.0–6.9 | A push along the invisible beam line into his ear, a dissolve into the section, and a move down the empty canal. |
| 6.9–9.0 | Pull out and up. An infrared-camera wipe shows the beam (the scene turns cool monochrome; that is the visualisation convention). Follow the beam to his ear. |
| 9.0–15.0 | Into the air at his ear: light crests travel along the beam, and water molecules are highlighted. One absorbs on "absorbs" and vibrates. The beam's air warms and pushes outward. Repeated pulses launch pressure fronts, followed out to the ear and down the canal; the eardrum and ossicles move. |
| 15.0 | Match cut: the canal becomes the beam leaving the lab transmitter's window. |
| 15.0–17.4 | Reveal the bench, then down through the open top: the hex mirror spins and sweeps the beam across a narrow arc. |
| 17.4–20.0 | Out along the beam to the listener. The camera rises: in slow motion the beam's end sweeps onto his ear. Every point it passes emits a small wavefront, and they all arrive at his ear together (`t_k = T − d_k/c`). |
| 20.0–23.4 | A swing to the scientist, who turns the key: the LED and LASER IN USE light come on. A fast low track along the tape to the 8 FT stencil on "eight feet". The listener's face lights up and he cups his ear; the colleague beside him looks puzzled. |
| 23.4 | Match cut: listener's ear to the lead's ear. |
| 23.4–27.17 | The whisper returns. He cups his ear. She comes round behind him to look at that ear and steps into the line. |
| 27.17 | The whisper cuts dead. He flinches. A quick move round behind her shows she is in the way. |
| 28–30.3 | Infrared views: from the side, the beam ends on her head. From behind the machine, it stops at her back. She hears nothing. |
| 30.3–31.9 | A swing back to him, puzzled, while she peers at his ear. |
| 31.93 | She steps back out of the line. The whisper is back on that frame. A sharp reaction, and the camera races to his ear. |
| 31.93–34.07 | The camera eases out into the walking two-shot as they walk on. That two-shot is frame 0. |

**The loop.**
- The last seconds and the first seconds are one continuous walk, in unrolled time, shifted by exactly one atrium bay
  (1.9 m). The hall's visible band repeats every bay.
- Every crowd walker advances exactly one bay (plus whole lane wraps) over the film. The banners and plants sway on
  cycles periodic over the film.
- Non-periodic props (exhibits, banners, plants, the machine) are kept out of the seam view.

**Physics.** The picture shows sound generated in the air at the ear by photoacoustic absorption. That means:
- water vapour absorbs, heats and expands;
- pressure waves travel to the ear and move the eardrum;
- the sweep makes the sound concentrate where the listener stands.

Nothing shows light acting on the eardrum. The beam is only ever shown in the infrared view or inside the open
transmitter. The normal views never show it.

## Audio

- **Music:** the V1 music stem, unchanged (12 ms loop fades).
- **Retired:** the V1 room-tone and effects stems were timed to the old pictures and are not used.
- **Ambiences (new, synthesised):**
  - the atrium: a crowd murmur with a hall tail, built circularly so it flows across the seam;
  - inside the ear: the same, muffled;
  - the molecular air: a faint shimmer;
  - the lab: hum, fan and racks.
- **Effects:** the leads' footsteps at their walkers' footfalls, whips and push-ins at the camera moves, the infrared
  wipe, the absorption "tink", the pressure pulses, the scanner whir, the sweep's convergence chime and the switch
  click. SFX peak: −21 dBFS.
- **The whisper:** short, breathy and nonverbal:
  - shaped noise through moving vowel formants, with soft fricatives;
  - a faint ring-mod and inharmonic shimmer for the "almost alien" colour;
  - a soft ceiling against spikes, and no reverb tail (one small early reflection);
  - 15.0 dB under the narration where they overlap, ducked slightly under speech; peak −14.5 dBFS.
- **Where the whisper sounds:**
  - the hook (0.24–1.08 s) and his ear close-up (2.12–2.8 s); not in her ear shot (−140 dB there);
  - the lab listener (22.28–23.32 s);
  - 23.86 s to the block;
  - from the clear to 33.62 s, so the seam itself is quiet.
- **The cut and the return:** a 3 ms ramp on frame 815 (27.167 s): −31.7 dB in the last 20 ms before it, −140 dB in
  the first 20 ms after it and throughout the block. It is back with a 3 ms ramp on frame 958 (31.933 s).
- **Mux:** the MP4's decoded audio against the mix WAV: offset 0 samples, correlation 0.99997.

## Checks (measured)

- **Block:** the friend's body (head sphere, neck, torso capsule, arms) against the atrium beam segment, every frame:
  it cuts the beam on exactly frames 815–957. 0 mismatches (`qa/v4/check_v4.json`).
- **Loop seam, in the scene** (`check_v4.json`), in metres:

  | Track | Last frame → frame 0 | Step just before | Step just after |
  |---|---|---|---|
  | Camera | 0.047 | 0.049 | 0.043 |
  | Lead | 0.032 | 0.033 | 0.031 |
  | Friend | 0.035 | 0.041 | 0.032 |
  | Crowd | ≤ 0.035 | – | – |

  The camera's yaw, pitch and focal length match to 0.03°, 0.01° and 0.4%.
- **Loop seam, in the exported picture** (grey 135×240 mean absolute difference, `qa/v4/loop_and_holds.json`): the
  last frame to frame 0 measures 7.59 with the caption band excluded. Its 22 neighbouring frame steps range from 2.98
  to 9.97 (median 6.19). Including captions it is 9.57, because the caption changes from the last line to the first.
- **Motion** (`qa/v4/motion_scan.json`):
  - mean frame change 13.9;
  - no run of near-static frames (change < 1.0) anywhere, so no held shot;
  - the only spikes are the two intended match cuts, at 15.0 s and 23.4 s.

## Retention review (the brief's 10 questions)

1. **Does frame zero make someone curious?** Partly. Frame 0 is a lively walking two-shot in a busy hall, not a
   mystery in itself. The whisper starts at 0.24 s and his head snaps at 0.5 s, so the hook lands in the first half
   second, not on frame 0. That is the trade for a clean loop.
2. **Is the first five seconds visually dramatic?** Yes, as far as the frames show:
   - the snap and the whip over his head (0.5–1.3 s);
   - the slide from his ear to hers (2–3.5 s);
   - a fast pull-back that ends on the machine aimed at him (3.6–5 s).

   There are six distinct framings in five seconds.
3. **Can a viewer understand it without captions?** Mostly. The machine aimed at his ear, the invisible-then-visible
   beam, the molecules heating, the pressure fronts reaching the eardrum, the tape measure and the blocked beam all read
   without words. The whisper's on-screen shimmer is deliberately subtle, so "he hears something" relies partly on his
   reaction and the sound.
4. **Does every scientific claim have a matching visual?** Yes:

   | Claim | Visual |
   |---|---|
   | Nothing in your ears | The empty canal |
   | Invisible beam | The normal view vs the infrared wipe |
   | Water vapour absorbs | One H₂O lights and vibrates |
   | Heats and expands | The warm column pushes its neighbours out |
   | Tiny sound waves | Pulsed fronts reach the drum |
   | Sweeping concentrates the sound | Overhead convergence at the listener |
   | Eight feet | The floor tape and stencil |
   | Blocking | The beam ends on her |
5. **Does the scenery change?** Yes: the atrium, the ear section, the molecular air, the optics and the lab, with the
   infrared view as a sixth look.
6. **Are the characters always doing something relevant?**
   - He walks, startles, searches, listens, cups his ear, flinches and reacts.
   - She chats, sips, comes round to inspect his ear, blocks the beam and steps back.
   - The scientist turns the key. The listener reacts while the colleague doesn't.
   - The crowd walks throughout.
   - Gaps: standing holds of up to about a second (he stands still during the infrared shots), and his first stride
     out of standing (about 32.5–33.3 s) has a slightly wide, lunging stance.
7. **Are the transitions smooth and logical?** All but two are camera moves: push-throughs, pull-outs, whips, wipes
   and dissolves on matching motion. The two cuts are match cuts (canal → beam; ear → ear). At about 20.75 s the fast
   move from the scientist down to the floor tape passes close to a table leg for a few frames.
8. **Does the interruption pay off at once?** By measurement, yes. The whisper drops to silence within 3 ms of her
   body entering the beam (frame 815) and returns on the frame she leaves it (958). The picture shows both from his
   ear, from the side (beam ending on her) and from behind the machine. Whether it *feels* convincing needs a real
   listen.
9. **Does any shot repeat information?** One near-repeat: the push along the beam to his ear at 5.0 s and the
   infrared follow to his ear at 8.5–9.0 s use a similar move. The second is in the infrared view and leads into the
   molecules, so I kept it. The two infrared block shots in G show the same fact from two sides, matching the two
   narration lines.
10. **Does the ending loop back?** Yes. The end is one continuous walk into frame 0, measured at an ordinary frame
    step (see the seam figures above), with the whisper quiet across the seam.

## Known issues / not done

- Not watched or listened to in real time. In particular, the whisper's character ("almost alien", secondary) is
  judged from its design and measurements only.
- The anatomy is stylised (simplified ossicles and cochlea). The molecular air exaggerates the water share and the
  molecule size, and slows the light crests and wavefronts for the picture.
- The polygon scanner is simplified: its output swings through a narrower arc than a real polygon facet would give.
- His first stride out of standing (about 32.5–33.3 s) looks slightly wide.
- A table leg passes close to the camera for a few frames at about 20.75 s.
- No 2160×3840 master was rendered for V4 (only the review file was asked for). The source renders one with
  `--scale=2`.

## How it was reviewed

- Four contact sheets of the exported MP4 at 4 frames per second (`qa/v4/contact_0..3.png`).
- Frame strips around suspect moments, and a decoded-frame difference image at the seam.
- The measurements above: motion scan, seam metrics, block check, mux check, Vosk transcript and mix measurements.
- Several problems found this way were fixed before the final render:
  - a one-frame pop from an off-screen floor stencil's projection (17.73 s);
  - a hard cut from D to E, now a swing;
  - a lab camera above the ceiling;
  - a camera through the table;
  - a whip that glimpsed the machine too early;
  - a crowd walker's head under the beam-reveal camera;
  - non-periodic banners and plants popping at the seam.

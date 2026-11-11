# Cyborg Bug Factory: V2 production report

## A. Render

`exports/FGW_Cyborg_Bug_Factory_V2_REVIEW_1080x1920.mp4` (28.2 MB). V1 is unchanged at
`exports/FGW_Cyborg_Bug_Factory_V1_REVIEW_1080x1920.mp4`.

## B. Changes

V2 is a rebuild in a separate tree, `source/src/v2/` (composition `CyborgBugFactoryV2`, mix `mix_v2`). The shared rig
and core gained only optional, backward-compatible options: a pack-part builder hook and a rim light. Shot timing
follows the measured narration (`production/V2_NARRATION_MAP.md`), not the brief's planning timestamps. The brief put
"factory" at 9–13 s and the earthquake at 17.5–23.5 s, but those lines are spoken at 4.3–10.4 s and 22.3–26.5 s.

### Look

- A dark lab: slate bench, soft pools of light, vignette, and a cool rim light that separates the brown insects from
  the dark set.
- Cyan is used for electronics and signals. Orange appears only as the stimulation flash at the electrode tip and on
  the warning-tinted deployment tag.
- The backpack is redrawn from the paper: a white mounting structure with a grasping tab and alignment hole, a
  microcontroller board, a radio antenna, mounting branches on the metathorax, and bipolar electrodes into the
  pronotum–mesothorax membrane. A cyan LED, and a battery that plugs in after assembly.
- The arm follows the paper's cell: a vertical gripper with a wrist depth camera.

### Beats

| Time (s) | Beat |
|---|---|
| 0.00–2.00 | **New opening, payoff first.** Frame 0 is a macro of a cyborg cockroach in a narrow machined passage: antennae probing the slot, backpack large in frame, cyan LED. A wireless command arrives (0–0.3), a pulse runs down the electrode with an orange flash at the tip, and the insect turns into the side passage (0.32–0.8) on a fast lateral track. Pull back (0.8–1.3): the passage sits beside the assembly station, with insects waiting on the conveyor. Push onto the backpack (1.36–1.98). |
| 2.00 | **Match cut**, backpack to backpack, into the installation. |
| 2.00–4.30 | The camera tracks down with the gripper. The electrodes slide into the membrane under a locally translucent pronotum (with an "ELECTRODES" callout), the hooks latch (3.0), the cyan LED comes on, the battery plugs in, and the camera orbits to a side profile as the insect walks. |
| 4.30–6.43 | The 68-second cycle, sped up. The conveyor brings the next insect. The wrist camera's segmentation finds the pronotum and the implant point ("IMPLANT POINT FOUND"). Grasp, implant, latch, release. The timer reads 68 at release and is labelled "FIX → RELEASE · PER INSECT · SPED UP", which is exactly what the paper measured. |
| 6.43–10.40 | Real time. The gripper grabs a backpack on "grabs" (7.18) and the camera tracks it. A low side view shows "ELECTRODES → MEMBRANE". The latch lands on "back" (10.15). |
| 10.40–14.89 | **New control demo.** The finished backpack at an angle (CONTROLLER + RADIO, BATTERY), the insect released, a ground-level follow, and a wireless command reaching the antenna. Close on the thorax, with the pronotum translucent: three pulses down one electrode, each with a stimulation flash. The insect turns away from a small block. Overhead: the dashed straight path it was on against the cyan turn it took. |
| 14.89–20.60 | **New physical comparison, no static split screen.** The camera tracks alongside a tiny wheeled robot ("TINY ROBOT, built from scratch") to a 10 mm ledge, where it bumps, rocks back and tries again. A match cut on direction (17.93) to a cyborg in the next lane with the robot blurred behind it: it climbs the ledge on alternating tripods with its body pitching, threads a narrow gap between two rocks, then an overhead view shows both lanes. There is no "stuck" verdict and no performance figures. |
| 20.60–22.27 | **New environment change.** The camera follows the insect as the lab floor gives way to cracked concrete and the light turns dusty. |
| 22.27–26.74 | **Rebuilt earthquake section, continuous from the comparison world.** Pull back: a collapsed building at true scale, tagged "first field deployment of cyborg insects". The camera follows the insect into the low void under a leaning slab, with debris in the foreground. Thermal-style scan and data link, both verified, with nothing found. A see-through route view under the slab, then on toward the bright far end. |
| 26.74–31.53 | **New ending.** The same cyborg as the opening stands in a pool of light, the parked robot behind it ("BUILT FROM SCRATCH" / "LIVING INSECT"). The camera pulls back over several insects, the station and the passage; the insect walks toward the lens and the camera drops to its level. The camera follows it round into the passage and settles on frame 0. |

### Engineering

- **Opening and loop are one route.** The opening cyborg's route is one function of τ: frame 0 is τ = 0, and the last
  4.8 s play τ = t − 31.533. The station, the conveyor queue and the arm's hold match between the end and the start,
  and the background insects walk paths that are periodic in the film length.
- **Polygon clipping.** Ground polygons are clipped to the screen (`v2/clip.ts`). Unclipped near-plane coordinates
  had made headless Chrome flood whole frames with colour.
- **Depth of field** uses SVG filters confined to the frame.

### Audio

All effects are synthesized and re-timed to V2 events (`tools/make_audio_v2.py`). They include:
- the command chirp;
- the pulse buzz;
- the latch click;
- the LED blip;
- the battery click;
- servo moves;
- the scan and timer;
- tarsal steps in tripod rhythm;
- robot bumps and wheel spin;
- rumble and debris trickles;
- data blips.

Lab ambience runs at both ends of the loop and crossfades to wind over rubble.

## C. Narration

**Preserved.** V2 uses the approved V1 narration master, sample for sample: no regeneration and no edits. Its SHA-256
equals the hash recorded in `audio/narration/voice_provenance.json`. Its timing is unchanged, and the captions are the
same 24 verbatim phrases.

ASR on the V2 MP4:
- **Zipformer** hears every word. Its only differences are spellings: "rowbots", "sideboard" for cyborg, "any more or"
  for "anymore. We're".
- **Whisper on the whole file** drops the last line. Under the music bed there is no silence to cut at, so all 31.5 s
  goes in as one chunk, which is longer than Whisper's 30 s window.
- **Whisper on the last 7 s alone** hears "…which means we're not just building robots anymore. We're turning bugs into
  them."

## D. Scientific verification

Every source below was opened and read in this session; see `research/SCIENCE_NOTES.md` (V2 update) for the quotes.

| Claim | Status | Source |
|---|---|---|
| Automated assembly cell ("factory") | Verified. It is a lab prototype. | Lin et al., *Nat Commun* 16:6073 (2025), PMC12304280; NTU release |
| 68 seconds | Verified: "from initially fixing insect to finally releasing insect". The 10 min of CO₂ anaesthesia beforehand is not counted. | Same paper |
| Backpack contents, the 2.3 g weight, the electrode site and hooks | Verified | Same paper |
| Pulses can make it turn | Verified: steering over 70°. The response depends on the stimulus, not deterministic control. | Same paper |
| Real earthquake deployment | Verified. 10 cyborg cockroaches went to Myanmar with SCDF Operation Lionheart from 30–31 March 2025, and were used again on 3 April in Naypyidaw. They carried infrared/thermal cameras and sensors, and **they found no survivors.** These were first-generation, hand-mounted units. | NTU release; The Star; Mothership; Singapore PSD |
| The brief's "42-second" claim | Not in the narration. The narration says 68 s, which is verified. Nothing to block. | — |

**Unresolved:** none that blocks publication. Two framing notes remain:
- The Myanmar insects were not factory-made. The narration is still accurate, and the picture uses the field
  backpack.
- "Turning bugs into robots" is figurative.

## E. Technical QA

Measured from the file.

| Check | Result |
|---|---|
| Format | 1080×1920 (9:16), 30 fps, H.264 High, yuv420p, AAC 320 kb/s 48 kHz |
| Length | **31.533 s** (946 frames) |
| Decode | 946 frames, no errors |
| Loudness | −13.9 LUFS integrated, −1.6 dB peak. Effects, music and ambience stay at least 3.4 dB under the voice in every speech window (`audio/mix/mix_measure_mix_v2.json`). |
| Cuts | The only large frame changes are the planned match cuts (2.0 s, 17.93 s), the two cuts (14.9 s, 26.77 s), and one camera move at 24.3 s where foreground debris slides past. That move is smooth and was inspected frame by frame. |
| Static frames | The longest near-static run is 10 frames (0.33 s). |
| Black frames, clipped text | None. Callout labels are clamped inside the frame. |
| First 3 s | Inspected every frame (`qa/v2/first_3s_every_frame.png`). |
| Phone-size sheet | `qa/v2/phone_size_beats.png` |
| Transition bursts | `qa/v2/cut_*.png` |

## F. Loop QA

**Passed.** `qa/v2/loop_seam_x5.mp4` plays the last 2 s then the first 2 s, five times. Every real end-to-start junction
measures a mean frame difference of 1.43, against a median of 7.13 for every frame step in that clip. In other words,
the seam is smoother than an ordinary frame step.

The last six and first six frames (`qa/v2/loop_seam_last6_first6.png`) show the same:
- the same insect, pose, gait and camera;
- the same passage, LED and queued insects;
- the same lighting.

Only the caption changes, as the narration restarts. The ambience is lab tone at both ends, and the steps continue
across the seam.

## G. Remaining issues

1. **Not watched in real time with sound.** This environment has no display or speakers. Every check above was made on
   decoded frames, contact sheets and measured audio.
2. **Frame 0 is a rear three-quarter macro.** The backpack, antennae and passage read immediately, but the head is
   mostly hidden behind the pronotum. A slightly more side-on angle would show the face. I chose this angle because it
   also keeps the frame-0 turn a lateral move.
3. **The arm is large in frame** in the installation and grab shots (2.0–3.0 s, 6.5–9.5 s): the grey wrist cylinder
   fills the top of the frame. It reads as a robot, but it is heavy.
4. **Two foreground occlusions.** At 24.3 s a debris block slides past and hides the insect for about 0.2 s; this is
   intended layering. The ground-level shot at 11.4–12.2 s is dark, with a small insect.
5. **Stylised devices.**
   - The lab floor turning into rubble (20.6–22.3 s) and the see-through slab are visual devices, not literal events.
   - Assembly, wake-up and battery plug-in are time-compressed: in reality, recovery from anaesthesia takes minutes.
6. **The robot comparison is a conceptual illustration** with a generic toy robot, labelled "built from scratch". It
   makes no performance claims.
7. **The rubble is simple block geometry.** It reads as a collapsed building at phone size.
8. **Caption emphasis.** The brief asked for "TURNING BUGS INTO ROBOTS", but the spoken words are "turning bugs into
   them", so the caption emphasises TURNING BUGS INTO THEM.

## H. Publication recommendation

**NOT READY: pending one human viewing at normal speed, with sound, on a phone.**

There are no factual blockers. Every narration claim checks out against primary or institutional sources I opened. The
loop passes, and the file is technically clean.

The remaining step is the real-time viewing I can't do here, together with a decision on items 2–3. If that viewing
finds no problems, V2 can be marked READY without further changes.

As an honest self-assessment from the frames, I would score V2 around **8/10** against the brief's weights. The hook,
storytelling, accuracy and loop are much stronger than V1. The polish items above keep it short of 9.

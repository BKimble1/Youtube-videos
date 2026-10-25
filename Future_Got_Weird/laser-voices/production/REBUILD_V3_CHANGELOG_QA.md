# Laser Voices V3: change log and visual QA

**Review file:** `exports/FGW_Laser_Voices_REBUILD_V3_REVIEW_1080x1920.mp4`

This is a review cut. It is not final and not publication-ready. No 4K master was made.

**Limits of my review.** I cannot play video or listen to audio in real time. Everything below comes from:
- rendered frames, looked at as images (contact sheets and every-frame strips);
- automated measurements over every frame.

Viewing at full speed, with sound, still needs a person.

**Source.** `source/src/c3/`, composition `LaserVoicesC3`. V2 (`src/c2`) is untouched and still renders.

## Export verified (`qa/c3/ffprobe.json`, `qa/c3/mux_report.json`)

| | |
|---|---|
| Video | **1080 × 1920**, 9:16, H.264 High, yuv420p, BT.709 |
| Frames | 30 fps, 1022 frames, 34.067 s |
| Audio | AAC-LC, 48 kHz, stereo |
| Sync | decoded MP4 audio vs mix: 0-sample offset, correlation 0.99997 |
| Narration | approved file unedited, same gain, from sample 0; ASR WER 0.010 vs the approved script |
| Loudness | −14.58 LUFS integrated (V2: −14.55); peak −2.51 dBFS |

**About the V2 file size.** The brief reports V2 as 512×910. The V2 file in the repository probes as 1080×1920
(`qa/c2/ffprobe.json`). The copy you watched may have been a preview transcode, and the V3 file should be checked the
same way.

V3 was rendered at scale 1 from vector SVG. It was not upscaled.

## Major sequences rebuilt

1. **The first 8 seconds**
   - **Frame 0, the hook.** The action is already happening at frame 0: her eyes have snapped toward a voice at her
     left ear. The head follows with acceleration, overshoots and settles. The bob lags the turn, and the camera eases
     the same way. There is no idle smile at the start.
   - **1.0–2.75 s, the reveal.** One camera move crosses her front, and the aim swings from her face to where she is
     looking. It ends with three layers lined up:
     - her friend in the foreground, texting and unaware;
     - her, cupping her ear;
     - the transmitter and its operator across the lab.

     A single visualised pulse travels from the transmitter to her ear to connect them, then disappears.
   - **2.75–4.95 s, the contrast.** A close two-shot in profile. She turns to him delighted, with an open palm: "you
     hear that?". He looks up, puzzled, glances round for the sound, shrugs, and goes back to his phone.
   - **4.95–8.9 s, no earbuds, invisible beam.**
     - Her hand comes up from her side to her bare ear, taps twice, and goes down again. The elbow is placed with an
       explicit pole, and the hand targets come from the ear's own position.
     - The camera swings round to look along the beam's path into her ear. The path shows itself for a moment and
       dissolves on "invisible".
     - The push continues into the air beside her ear.
2. **The molecular explanation (8.9–15.4 s).** One continuous micro camera, five distinct compositions, drawn as a
   front-view section through the ear:
   - **A, water vapor:** a close view of the air. Eleven water molecules appear one at a time, about 70 ms apart.
   - **B, absorption:** the (visualised) infrared light packets arrive from the right. They end in three water
     molecules in turn; each flashes and starts to vibrate. The packets thin out near the ear, because the light is
     taken up in the air. The ear itself never glows.
   - **C, heat and expansion:** a wider view. The struck molecules and their neighbours run warm and fast. The warm
     pocket swells and pushes the air outward in a ring.
   - **D, sound waves:** the camera pulls back to take in the ear. Real travelling wavefronts (crowded bands of air)
     run into the bowl of the ear and down the canal, and the camera follows them in.
   - **E, the eardrum:** the eardrum flexes with each front, and the little bones and the cochlea answer.

   The camera then leaves by the same move reversed, out to the room.
3. **Transmitter (15–20 s), redesigned as an open optical bench**
   - The bench sits on a tripod:
     - a laser module fires along the bench into a small mirror on a galvo motor;
     - the mirror turns the beam down the lane to her.
   - A driver box on a waist-height side table carries the dial and the send button. Her voice reaches it by cable from
     the cart.
   - Sequence on screen:
     - the camera tracks along the path to the bench;
     - a top-down close-up shows the mirror pivoting and the beam it sends out sweeping;
     - the camera tracks back down the swept beam to her.
   - **How the sweep is shown.** The mirror repeats a sweep, with a quick flyback between passes during which the beam
     is blanked. Each pass ends on her ear. Each point the beam passes sends out a small wavelet. Because the beam
     moves at the speed of sound, all the wavelets of a pass arrive at her ear together, where the sound rings gather.
4. **Eight feet (20–23.3 s)**
   - Beat 1: the operator presses the send button, with anticipation, the press and a release.
   - Beat 2: in a high wide over the lane, one pulse crosses the 8 ft and the foot ticks light one by one.
   - Beat 3: the camera eases in on her. Only she reacts.

   Front cameras keep the transmitter on screen right and the listener on screen left.
5. **The block (23.3–32 s)**
   - **The walk.** The friend sets off on "someone walks", passes in front of her, and steps into the path. His feet
     are placed on explicit plants (zero slide), and his first and last steps are squared to his facing.
   - **The block is computed from his head.** The path ends on the near side of his head from frame 787 ("the voice
     suddenly stops") to frame 954.
   - **Her reaction.** In close-up she snaps alert, taps her ear, and her eyes dart.
   - **His side.** From the transmitter's side he stands in the path, oblivious, sipping coffee, while she points at
     him, cross, in the background.
   - **The clear.** On "move" he carries on past toward the back of the room, still unaware. The path runs on to her
     ear again and the sound rings return.
   - **The audio** matches the geometry: a 3 ms cut at frame 787 and an 80 ms return at frame 955. The whisper is at
     −140 dB while he blocks it.
6. **The loop**
   - The last shot uses the opening camera, and her pose blends into the hook performance.
   - Frame 1021 and frame 0 have identical camera and listener/operator pose (difference 0).
   - The friend has walked out of frame at both sides of the seam.
   - Last vs first frame mean grey difference is 0.54, against a median of 1.05 between consecutive frames.

## Character and rig fixes (`src/c3/rig/Crew.tsx`)

- **The protagonist's bob.** This fixes the "helmet" look:
  - **No rim line.** The head's own outline is now drawn only where skin meets the edge. Inside the hair silhouette,
    the head is filled with the hair colour.
  - **Fringe.** A side-swept fringe with a parting turns with the head.
  - **Strands and ends.** Strand lines run down the bob, and its ends flick out.
  - **Hair lag.** The bob swings against fast head turns.
- **Arms.** Elbow poles are explicit for her hand-to-ear moves, for the operator, and for the friend's phone and cup.
  This keeps upper arms and forearms consistent and the wrists straight.
- **Faces and eyes.** These carry over from V2:
  - eyes foreshorten but are never faded;
  - blinks are lids;
  - the facing blend is continuous.

  New expression sets carry the story: snap, hear, ask, tease, lost, dart, cross, back, and the friend's puzzled look.
  Eye moves are keyed as quick saccades. Pupils do not drift.
- **Consistency sheets** for all three characters (turnaround, expressions, 15° head turns) are in `qa/c3/sheets/`.

## Lab

- A new midground workbench sits behind her mark, with a monitor showing a live spectrum, a desk lamp, glassware, a
  test-tube rack, a printer and a stool. It gives front shots a layer between the characters and the window.
- Cameras were reframed to spend less of the frame on ceiling and floor.
- Everything is one coherent room with consistent left/right orientation.

## QA results

| Check | Result |
|---|---|
| Motion scan, every frame (`qa/c3/motion_scan.json`) | 11 spikes, all at planned cuts; no one-frame pops |
| Eye check (`qa/c3/eyecheck.json`), 1,227 faces | 14 flags, each inspected on crops |
| Head strips, every frame (`qa/c3/strips/`) | hook 0–29, tap 150–200, stop 787–836, final 960–1021 and the seam: eyes, brows, hair and ears stay attached and continuous |
| Foot slide while planted | 0 m |
| Beam drawn through any head, any frame | 0 |
| Per-shot contact sheets | `qa/c3/shots/` (14 shots) |
| Key frames | `qa/c3/keyframes/V3_keyframes.png` |

The 14 eye-check flags break down as follows:
- **Dissolve frames:** frames 261 and 455, at the entry to and exit from the micro sequence.
- **A false positive:** frame 682. Its head box was offset during a fast camera move, and the crop shows both eyes
  intact.
- **Occlusions:** frames 751–759 (behind the friend's head) and 764 (an eye at the far limb of a turned-away head).

The check also found one real staging defect, now fixed. In the press shot the operator's hands rose in front of her
face, because the driver box sat at shoulder height on the bench. The box moved to a waist-height side table.

## Known issues (please check when you view it)

1. **Flat-card perspective.** Crew characters are flat cards. In close, high-angle shots a hand reaching forward can
   look higher on screen than the object it touches, which is why the press shot uses a long, eye-level lens.
2. **Thin beam in the widest shots.** In the 8 ft wide and the block wide, the visualised path is thin (a few px). The
   path ending on his head reads best in the shot from the transmitter's side (27.9–30.7 s).
3. **The room-to-micro join is a dissolve.** It is a 0.55 s dissolve inside a continuous push, both in and out, not a
   match cut.
4. **Limited hand shapes.** The rig has four hand shapes, so her point is an outstretched mitt.
5. **Small operator in the 8 ft wide.** She is small at the right edge of that shot. The press shot just before it
   carries her beat.
6. **Pacing.** I could not judge whether the pacing feels like Death Clock without viewing it at speed.

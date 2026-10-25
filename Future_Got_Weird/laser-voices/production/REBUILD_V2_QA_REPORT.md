# Laser Voices: Rebuild V2 visual QA report

**Review file:** `exports/FGW_Laser_Voices_REBUILD_V2_REVIEW_1080x1920.mp4`. No 4K master was made.

**How this was reviewed.** I cannot play video or listen to audio in real time, so phase F (full-speed viewing) has not
been done by me and still needs a person. The checks below are frame-level: rendered frames looked at as images
(contact sheets and every-frame strips), plus automated measurements over every frame.

## Delivery checks (`qa/c2/ffprobe.json`, `qa/c2/mux_report.json`)

| Check | Result |
|---|---|
| Resolution / aspect | 1080×1920 (9:16) |
| Frame rate / frames / duration | 30/1, 1022 frames, 34.0667 s (video), 34.066 s (audio) |
| Video | H.264 High, yuv420p, BT.709, CRF 16 |
| Audio | AAC-LC 48 kHz stereo, 320 kb/s target |
| Sync | decoded MP4 audio vs mix WAV: 0-sample offset, correlation 0.99997, level difference −0.007 dB |
| Narration | approved file unedited, same gain, from sample 0 (SHA-256 in `qa/c2/mix_measure_c2.json`) |
| Narration intelligibility | Vosk ASR vs the approved script: WER 0.010 (only "its" heard as "it's") (`qa/c2/asr_check.json`) |
| Loudness | −14.55 LUFS integrated (Rebuild V1: −14.55); sample peak −2.52 dBFS |
| Captions | unchanged treatment (`v3/Captions3`); SRT `captions/FGW_Laser_Voices_REBUILD_V2.srt` (identical text and times) |

## Head turns and eyes

**Every-frame strips** (`qa/c2/strips/`), cropped to her head and inspected frame by frame:
- `hook_f0-29.png` (0:00–0:01);
- `stop_f803-836.png` (0:26.8–0:27.9);
- `final_f960-1021.png` (0:32–0:34);
- `seam_f1006-1021_0-15.png` (across the loop point);
- `ear_push_f180-266.png`.

What the strips show:
- Both eyes are drawn on every frame, keep their shape, and never fade or go transparent.
- Blinks close the lids and open them again.
- The hair stays attached and its highlight stays put.
- The face and hair do not jump between frames.

**Automated eye check** (`tools/c2_eyecheck.py`, results in `qa/c2/eyecheck.json`):
- For every frame where a face is at least 40 px in radius (1,304 faces), it counts the eye-white pixels inside the
  head's circle.
- It flags any one-frame dip below half of both neighbours while the lids are open.
- It flags any face wholly in frame and turned toward the camera that has no eye white at all.

Result:
- **No one-frame dips.**
- **No flags on the listener or the operator.**
- 57 flags remain, all on the passerby: 49 in shot 2 (frames 30–82) and 8 in shot 8 (frames 592–599). I checked
  these on cropped frames (`qa/c2/eyecheck_flagged_occlusions.png`). In each one his face is hidden behind the listener's head or arm, so the flags
  are occlusions, not missing eyes.

**Rig changes behind these results** (details in `production/REBUILD_V2_ASSET_MANIFEST.md`):
- the facing blend is continuous, so nothing snaps as a face crosses the front view;
- eyes foreshorten geometrically and are never faded;
- blinks are lids;
- ears narrow smoothly as they turn away.

The 15° head-turn sheets for all three characters are in `qa/c2/sheets/*_headturn.png`.

## Motion, pops and one-frame flashes (`qa/c2/motion_scan.json`)

- I measured the frame-to-frame change on every frame. There are 13 spikes, and every one is a planned cut.
- During the review, the scan caught two real pops, both now fixed:
  - **Frame 530:** the emitter's hood closed onto different geometry from the one it opened with. The closed housing
    now uses the hood's own stripe and fins.
  - **A colour bug:** a shade of a shade parsed as NaN, which painted the shelving, the tripod column and the cart
    black. Fixed in `c2/lib.ts`.

## Geometry (`tools/check_c2.ts`, results in `qa/c2/geometry_checks.json`)

| Check | Result |
|---|---|
| Foot slide while planted (590 contact-frames) | 0 m (feet are placed from explicit plants) |
| Beam passing through any head (every frame, all three heads) | 0 frames |
| Block (his head in the beam) | frames 786–956: starts on "the voice suddenly stops", clears on "move" |
| Whisper | cut with a 3 ms ramp at frame 786; −140 dB while blocked; back with an 80 ms ramp at frame 957 (`qa/c2/mix_measure_c2.json`) |
| Loop: listener pose, operator pose, camera at the end vs frame 0 | identical (max difference 0) |
| Loop: passerby | out of the closing and opening frame at the seam |
| Loop: picture | last vs first frame mean grey difference 0.39, against a median of 0.78 between consecutive frames (`qa/c2/loop_metric.json`) |

**Beam paint order.** The beam is painted in depth order against the head it ends on:
- when her ear is turned away from the camera, her head covers the beam's end;
- when the beam is blocked, it ends on the near side of his head.

This was a real defect in an earlier render of the 8 ft wide: the beam crossed her face. It is fixed and re-checked.

## Shots

Contact sheets for every shot (every third frame): `qa/c2/shots/01_hook.png` … `15_final.png`.

| Item | Where |
|---|---|
| Style frames (1 opening reaction, 2 two characters, 3 science cutaway, 4 laser close-up, 5 wide interruption, 6 final reaction) | `qa/c2/style/` (`REBUILD_V2_style_sheet.png`) |
| Consistency sheets | `qa/c2/sheets/` |
| Shot plan | `production/REBUILD_V2_SHOT_PLAN.md` |

## Known outstanding issues

1. **Room-to-micro transition.** The camera push into her ear is continuous. But the change of drawing scale is a
   0.55 s dissolve, so for about 15 frames (8.45–9.0 s) the room and the molecules are both visible at once. It reads
   as a dissolve, not a match cut.
2. **Thin beam in the wide shots.** In the 8 ft wide and at the moment of the block, the beam is a thin line (core
   3–4 px). Three things carry the interruption with the sound off:
   - the walk-in (the pulses stop at his head, with a hit glow);
   - her close-up reaction;
   - the over-the-shoulder shot, where the beam visibly ends on his head.
3. **Hands are the Crew rig's four shapes** (mitt, grip, open, fist):
   - her "point" at him is a mitt held out;
   - the operator waves and cheers with the microphone still in her hand rather than switching hands.
4. **Expression range is the rig's own.** "Joy" reads mainly through the mouth and blush, because the rig's squint
   barely changes the eye shape. The passerby's shrug is small.
5. **Micro scale is illustrative.** Molecules, the ear and the canal are drawn at story scale, not physical scale. The
   cut through the head is one flat flesh tone.
6. **The micro sequence's ear is a top-down section, not the side view from the room shot.** The canal and the
   eardrum can only be shown in section. The shapes and colours carry over, but the viewpoint changes inside the
   dissolve.
7. **Shot 2 (1.0–2.75 s): the beam over her hair.** The camera sits low beside the emitter, so the faint beam
   (35 % opacity) comes toward her ear from in front of her and is drawn over her hair on the way. It is correct
   occlusion, since the beam is nearer the camera than her hair, but it can read as crossing her head. It is visible
   in `qa/c2/eyecheck_flagged_occlusions.png` (frames 30–82).
8. **Not checked by me:** full-speed viewing (phase F), listening, and how the colours look on other displays. These
   need a person.

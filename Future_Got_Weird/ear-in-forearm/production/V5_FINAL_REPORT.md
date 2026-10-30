# V5 final review: Doctors Grew an Ear Inside Her Arm

V5 is a finalization pass on V4. It is not a redesign: same drawing, woman, ear geometry, voice and story. The changes
are pacing, purposeful motion and the payoff.

**Status.** A review copy, checked from the files. **It is not published.** It has not been watched or heard in real
time: this environment has no display or speakers.

## Deliverable

`exports/FGW_Ear_Forearm_V5_FINAL_REVIEW.mp4`

**Verified at true resolution** (`qa/v5/ffprobe.json`):
- **Picture:** H.264, coded and displayed at 1080×1920, square pixels, 9:16, yuv420p, 30/1 fps, 594 frames,
  **19.80 s**.
- **Sound:** AAC 320 kb/s, 48 kHz stereo.
- **Size:** 14.2 MB. A full decode reports no errors.
- **Native frames:** extracted at 1080×1920 (`qa/v5/native_f*.png`).

**Narration** (`audio/narration/FGW_Ear_Forearm_narration_V5.wav`): the same approved ElevenLabs take.
- **Speech untouched:** no time-stretch, no splices inside words, same order, same voice.
- **Only silences changed:** sentence gaps 0.20 s (V2–V4: 0.28 s); the "MONTHS…" beat 0.22 s; comma pauses as spoken.
- Speech 0.00–19.36 s, then a 0.45 s tail into the loop.
- **ASR on the MP4's own audio:** Whisper and Zipformer each differ only by one spelling ("doctor's" for "doctors",
  "armskin" for "arm skin"), with no word changes.

## What happens, second by second

| Time (s) | Action |
|---|---|
| 0.00–0.35 | V4's extreme close-up of the ear under the forearm skin. The skin is already moving on frame 0: the ear swells with a pulse, and the arm has begun to turn. |
| 0.35–0.85 | The camera pulls back as she turns the forearm (a rigid rotation about the elbow; the camera rides with the ear, so its shape never changes). By about 0.8 s: an ear on a forearm, with the wrist and hand. |
| 0.85–1.60 | Her face comes in while she keeps turning the arm. She lifts it slightly at the shoulder, turns her head, her eyes go to the ear, her brows lift, and she blinks (1.52 s). |
| 1.60–2.95 | One move along her line of gaze, from the forearm ear to the side of her head, arriving on the healed, missing ear before "She lost her ear" (3.16 s). There is no portrait hold; the arm settles out of frame. |
| 3.0–4.7 | The missing ear, then the crash memory (glass and headlights behind her) on "crash". |
| 4.8–6.9 | Down to the ribs. The cartilage lights up; the scalpel cuts the block; forceps lift it out and carry it to the tray. |
| 6.9–7.9 | On the tray: the outline is cut and the offcuts slide aside; the folds are carved; the rim is cut free. |
| 7.98–8.7 | Forceps lift the finished ear-shaped framework off the tray and carry it to the forearm. |
| 8.7–9.5 | It slides into the pocket at the arm's edge. The ear shape rises under the skin, the incision closes, and five stitches go in one by one (with matching ticks). |
| 9.5–11.6 | One local cutaway under the intact skin: trunks sprout, branches wrap the scaffold, sprigs and a flush, a pulse at each stage. Then it closes. |
| 11.6–13.8 | The flap is outlined, lifted and carried in one arc to the correct side of her head. The arm shows only the donor bed, so there is no duplicate ear. |
| 13.8–16.2 | Seated. A brief local reconnection cutaway (artery, vein, nerve), with the camera already pulling back while the nerve is joined. |
| 16.2–17.1 | A clean view of her with the new ear ("And for MONTHS…"), with a brief warm lift. |
| 17.1–17.5 | **Into the flashback.** The camera moves down over her neck and shoulder, so neither ear is in frame. The picture takes a warm, desaturated memory grade with a vignette, and the raised forearm enters, in the past, with the ear under its skin. |
| 17.5–19.8 | The flashback stays active. She turns the forearm and the camera pushes toward the ear. The grade lifts in the last 0.4 s as the push lands exactly on frame 0's composition. |

## QC performed (on the delivered MP4)

**Motion and continuity** (`qa/v5/frame_steps.txt`):
- Mean frame step 4.9; largest 24.8 (the chest-to-tray carry, as in V2–V4).
- No isolated jumps: the step-to-local-median ratio is ≤1.2.
- No whips.

**Retention** (`qa/v5/film_every_half_second.jpg`): every half-second sample shows a new physical action, reveal or
story step. There are no holds with camera movement only.

**No two ears at once** (`qa/v5/flashback_switch_16.8-17.8s.jpg`):
- The head with its new ear leaves the frame before the forearm (in the flashback grade) enters.
- During the transfer, the forearm shows only the donor bed.

**Loop seam** (`qa/v5/loop_last_vs_first.jpg`, `loop_seam_difference.png`): the last and first frames are the same
composition. The only visible difference is the caption change ("…right HERE." → "Doctors grew an EAR").

**Consistency:**
- One figure throughout: face, hair, gown, skin tone, hand and arm proportions.
- Joints move only by rigid rotation about the elbow, shoulder and neck.

**Captions:** generated from the V5 word times (`captions/FGW_Ear_Forearm_V5.srt`). The heights are as before (low
captions at y 1340, above the Shorts UI; the chest, tray and vessel captions high), clear of the ear and the surgery.

**Audio** (`qa/v5/audio_measure_from_mp4.json`):
- −13.85 LUFS integrated; −1.63 dBTP true peak.
- **No gaps or gating:** the quietest 50 ms block is −46 dB (the bed is continuous).
- During speech the effects sit about 27 dB under the voice.
- **V5 cues:** stitch-by-stitch ticks and pulls; a memory swell and a warm low tone into the flashback; a skin stretch
  as the arm turns in the past; the low landing on "HERE".

## Remaining issues (honest list)

1. **The shoulder pass into the flashback** (about 17.2–17.35 s) shows only her gown and shoulder for a few frames. It
   is what keeps the two ears from sharing the frame.
2. **The missing-ear shot runs about 1.5 s** (3.0–4.5 s) because the narration describes it there. It carries a slow
   push and then the crash memory.
3. **The reconnection close-up is still about 1.8 s.** It changes continuously (the ends meet, stitches go in, blood
   flows), and the camera pulls back through it.
4. **Not watched or heard in real time.**

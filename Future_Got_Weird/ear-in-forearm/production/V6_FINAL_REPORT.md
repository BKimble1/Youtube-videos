# V6 final master: Doctors Grew an Ear Inside Her Arm

V6 is a targeted retention edit of V5, not a regeneration. It keeps:
- the same drawing, woman and ear geometry;
- the same ElevenLabs take, word for word;
- the same surgical shots: rib harvest, tray carving, insertion and stitches.

What changed is timing, overlap and physical action in four places.

**Status.** A final master plus a review copy, checked from the files. **It is not published.** It has not been watched
or heard in real time: this environment has no display or speakers. Every claim below comes from:
- contact sheets cut from the delivered MP4;
- native 1080×1920 frames;
- frame-difference, ASR and loudness measurements.

## Deliverables

| File | Encode | Size |
|---|---|---|
| `exports/FGW_Ear_Forearm_V6_FINAL_MASTER_1080x1920.mp4` | H.264 CRF 12 (slow), AAC 320 kb/s | 26.8 MB, ~10.9 Mb/s |
| `exports/FGW_Ear_Forearm_V6_REVIEW_1080x1920.mp4` | H.264 CRF 20 from the master, AAC 192 kb/s, faststart | 9.0 MB |

**Verified on both files** (ffprobe with a full frame count; `qa/v6/ffprobe_master_and_review.json`):
- 1080×1920, square pixels (SAR 1:1), yuv420p.
- 30/1 fps, 587 decoded frames, **19.58 s**.
- A full decode reports no errors.
- Native frames are in `qa/v6/native_f*.png`.

Captions are burned in. The sidecar SRT is `captions/FGW_Ear_Forearm_V6.srt`.

## Narration

The same approved take is used, with:
- no time-stretch;
- no cuts inside words;
- the same order.

Only silence was shortened, by removing the middle of each gap with crossfades:
- Sentence gaps are 0.16 s (V5: 0.20 s).
- The "MONTHS…" beat is 0.18 s (V5: 0.22 s).
- Comma pauses are as spoken.
- There is a 0.40 s tail into the loop.

**Runtime: 19.57 s.** This is slightly above the 18–19 s target. Reaching 19.0 s would mean cutting into the comma pauses
or the "MONTHS…" beat, which would make the read sound rushed, so I stopped here.

**ASR on the master's own audio** (`qa/v6/asr_master_mp4.json`):
- Zipformer differs only by "armskin" for "arm skin".
- Whisper differs only by "doctor's" for "doctors".
- Neither changes any words.

## The four priorities: what is visible in the render

Times are from the master. The evidence sheets are in `qa/v6/`.

### 1. No static face, 1.3–4.8 s (`p1_hook_to_ribs_0-4.6s.jpg`, `film_every_half_second.jpg`)

**Face on screen.**
- V5: about 1.0–4.7 s.
- V6: about 1.0–3.4 s.
- The rib window is open by 3.6–3.9 s, while "She lost her ear in a crash" (3.12–4.6 s) is still being said.

**The face shot is not static** (camera motion alone is not counted):
- **1.0–2.1 s:**
  - She lowers the raised forearm (it leaves the frame by 2.1 s).
  - Her head turns and her gaze moves to the side.
  - Her brows lift, then she blinks at 1.3 s.
- **2.2–2.9 s:** the crash memory plays on the missing-ear shot itself (night tint, headlights, glass). She flinches: a head jerk of −2.2°, brows down, a blink at 2.3 s.
- **2.9–3.4 s:** the camera drops along her neck to the chest. The narration overlaps the cut.

**Honest note.** Her face is still on screen for about 2.4 s (1.0–3.4 s), not zero. That stretch is filled with her
reaction and the crash memory rather than a hold.

### 2. Continuous biology, 9–12 s (`p2_biology_8.3-11.6s.jpg`)

One continuous push, with no cut:
- **8.6–9.3 s:** the scaffold slides into the pocket under the skin edge, and the ear shape rises under the skin.
- **9.2–9.7 s:** five stitches go in one by one.
- **9.3–10.0 s:** *new in V6.* Red tissue film and fibres creep in from the outline and cover the cartilage, and the white scaffold glow fades.
- **10.1–10.9 s:** vessels sprout from the trunks, branch across and wrap the ear.
- **10.9–11.45 s:** the window closes back to intact skin. The camera pulls out onto the healed forearm as "Months later" begins.

### 3. A visible transfer, 13–16.5 s (`p3_transfer_11.5-15.6s.jpg`)

- **11.45–12.1 s:** the scalpel outlines the flap.
- **12.1–12.7 s:** the flap is raised.
- **12.7–13.6 s:** the carry. The camera is wide enough mid-way that one frame (~13.1 s) shows:
  - the woman's head with the empty ear site;
  - the ear in the forceps between head and arm;
  - the raised forearm with only the raw donor bed.

  Only one ear is in frame.
- **13.6–14.1 s:** the ear is seated.
- **14.1–15.2 s:** reconnection, a 1.1 s local cutaway in front of the new ear. Artery, vein and nerve are each joined by a moving needle holder, and the camera is already pulling back while the nerve goes in.

  V5's longer static coloured-vessel view is gone.

### 4. The original ending is kept (`p4_flashback_ending_15.4-19.6s.jpg`, `loop_last_vs_first.jpg`)

- There is no completed-face reveal hold. From the reconnection, the camera goes down over her neck and shoulder (no ear in frame).
- The flashback grade comes in at 15.7–15.9 s.
- The raised forearm with the ear under its skin enters. She turns the forearm to and fro while the camera pushes in on "her new ear was right HERE."
- The grade lifts in the last 0.4 s as the push lands on frame 0's composition.

**Honest note.** The forearm's turn in the flashback is gentle: a few degrees each way. In the half-second samples it
reads as slight motion plus the push-in, not a big gesture.

## QC on the master

**Motion** (`qa/v6/frame_steps.txt`):
- Mean frame step 5.19; largest 23.55 at 6.13 s (the chest-to-tray carry, the same move as V2–V5).
- Every step is ≤1.3× its local median, so there are no isolated jumps and no whips.
- Loop seam (last frame to first frame): 6.2, a normal mid-move step.

**Continuity:**
- No frame has two ears.
- The woman's appearance, the ear shape and the forearm match V5.
- The tools enter along their own axes.

**Audio** (`qa/v6/audio_measure_from_master.json`, measured from the MP4):
- Integrated loudness −13.84 LUFS; true peak −1.62 dBTP.
- Quietest 50 ms block −45.7 dB; none below −50 dB (no dead air).
- 32 synthesised sound effects, including:
  - crash cue on the flinch;
  - per-stitch ticks;
  - a tissue stretch;
  - a memory riser into the flashback;
  - a low impact on "HERE."

## Remaining issues (not fixed; no further version made)

- **Runtime:** 19.57 s, against a target of 18–19 s (reason above).
- **Face screen time:** about 2.4 s of face remains in the hook, though with action throughout.
- **Flashback motion:** the forearm's movement is subtle.
- **Not yet watched in real time:** pacing and mix judgements need a real-time watch on a phone.

## Rebuild

```
python3 tools/make_narration.py      # V6 spacing
python3 tools/make_audio.py mix_v6
cd source && npx remotion render src/index.ts EarForearmV6 ../exports/FGW_Ear_Forearm_V6_FINAL_MASTER_1080x1920.mp4 \
  --props='{"audio":"mix_v6","captions":true}' --crf=12 --x264-preset=slow
```

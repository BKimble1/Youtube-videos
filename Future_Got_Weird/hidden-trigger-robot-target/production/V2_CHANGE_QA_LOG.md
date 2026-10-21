# Hidden Trigger V2: change and QA log

Pass two of the review cut. Delivered: `exports/FGW_Hidden_Trigger_V2_Review_1080x1920.mp4` (SHA-256 `038de823…eea3`)
and `captions/FGW_Hidden_Trigger_V2.srt`.

V1 is preserved unchanged: its MP4, captions and QA files are untouched, and its source still renders as composition
`HiddenTriggerV1`. V2 lives in new files under `source/src/v2/` and renders as `HiddenTriggerV2`.

## What stayed the same

- **Voice and timing.** Same narration file (`audio/narration/narration_v1.wav`, the temporary Kokoro review voice),
  same 65 words and phrase timings, same 25.600 s / 768 frames at 30 fps. ElevenLabs was not called and the voice
  was not sped up.
- **Captions.** Timing and text are unchanged, so `FGW_Hidden_Trigger_V2.srt` is byte-identical to the V1 SRT.
  On-screen placement is unchanged too (lower third, y ≈ 1478).
- **Art.** Same 2D vector style and the same rig geometry. The robot proportions, link lengths, joint chain and the
  apple, model hand and toy knife are all from the V1 asset model (`solve()` and `knifeFrame()` are reused unchanged).
- **Facts.** The script is unchanged and no source contradiction was found. The planner is shown altered **before**
  any request arrives. The trigger is a generic amber marker with no wording. The planner chooses the steps, and only
  after that does the controller move the arm. No injury, no contact: the blade stays 31 px above the stem and the
  hand at its lowest point.

## Shot list (actual cut times)

| Time (s) | Composition | Setting |
|---|---|---|
| 0.00–0.93 | Tight on the blade swinging toward the model hand, apple at frame left | bench, side |
| 0.93–2.20 | Pull out to the bench: cyan ring and "ASKED" tag on the apple. On "here", push in to the hand: amber ring and "AIMED HERE" tag | bench, side |
| 2.20–2.93 | Macro track along the toy blade: rounded nose, blunt bead edge, grip ridges, jaws | bench, side macro |
| 2.93–3.87 | High-angle detail of the model hand: molded cuff, flat end face, screwed mount, blade above | bench, high angle (new view) |
| 3.87–5.00 | Wrist close, then pull back to the whole robot on its mobile base | bench, side |
| 5.00–6.47 | Whip pan past the glass partition to the workstation ("RESEARCH LAB"), push into the portrait monitor | workstation (new) |
| 6.47–7.90 | Monitor fills the frame and becomes the diagram: blue blocks lift out, the amber ALTERED section drops in, large "TAMPERED FIRST" tag. The request slot is still empty | diagram |
| 7.90–9.43 | Pull back to request → AI planner → plan target. The plain request flows through and the target fills with the apple; the altered section stays dormant | diagram |
| 9.43–10.43 | High angle, "WITHOUT TRIGGER": the arm swings to the apple (cyan ring) | bench, high angle |
| 10.43–12.13 | Tight side view: one mimed stroke (lift, approach, bottom, short pull, recover) above the apple; the hand stays outside the path | bench, side |
| 12.13–13.67 | Full-width request strip "Cut the apple.", then the amber marker snaps in. One highlight runs from the marker into the altered section, which glows | diagram |
| 13.67–14.93 | Large PLAN TARGET card: the apple is shoved out and the model hand slams in; the card turns amber | diagram |
| 14.93–15.73 | Match cut: the bench hand sits exactly where the card's hand icon was (amber ring). Pull back: the apple's cyan ring fades. The arm is still parked | bench, high angle |
| 15.73–17.30 | Steps 1–3 (REACH / LOWER KNIFE / CUT MOTION), each tagged with the hand. A PLAN packet leaves, and the camera follows it down | diagram |
| 17.30–17.83 | CONTROLLER receives the plan; its three dials follow the arm's real joint angles as the move starts | diagram |
| 17.83–19.07 | Close on the wrist joint (rings lit), widening to the arm descending over the model hand | bench, side |
| 19.07–21.47 | Fixed matched camera, one rig, hard switches: hand / apple / hand / apple / hand, each with a request chip (with or without the marker) and a ring on the target | bench, side |
| 21.47–24.33 | Tight on ALTERED ① "TAMPERED FIRST", pull back; request ② slides into the empty slot; highlight into the planner; move down; target ③ fills with the hand; push in | diagram |
| 24.33–25.60 | The opening composition: the same camera push and the same arm move, which continue into frame 0 | bench, side |

That is 18 compositions in four settings: bench side, bench high angle, workstation and diagram. Reframes are mostly
8–12 frames; the slower moves are the robot reveal (≈ 20 frames) and the closing pull-back (≈ 33 frames).

## Sound

The music generator is unchanged. The effects were re-cued to the V2 action (`tools/make_audio_v2.py`,
`audio/sfx_cues_v2.json`). Kept: the speed-driven servo (now from the V2 motion), the click after "here" and the tap
into the macro. Moved: the latch, now when the altered section seats, and the ticks, now when the marker snaps in and
when the highlight enters the planner. Added, at low level: one soft air move on the whip pan, a latch on the target
swap, a tick when the plan reaches the controller, a tick when the closing target fills, and quiet relay clicks on the
four comparison switches. V1's strip-wipe swish was removed. The servo is now rendered loop-continuous, so its phase
carries across the loop point.

## QA performed on the delivered MP4

Measured (`qa/qa_v2_results.json`, `qa/asr_mp4_v2.json`, `qa/motion_summary_v2.json`, `audio/mix/mix_v2_measure.json`):
- ffprobe: 1080×1920 rendered natively from the vector source (not upscaled); 30/1 fps; 768 frames; 25.600 s;
  H.264 High; yuv420p; BT.709; AAC 48 kHz stereo.
- Loudness: −15.0 LUFS integrated, −1.5 dBTP true peak, LRA 1.4 LU. No samples at 0 dBFS and no silent 100 ms window.
  Voice is 16.7 dB over the music and 21.1 dB over the effects during speech.
- No black segments, and no frozen segment of 1.5 s or longer.
- Sync: the voice in the MP4 sits at a 0.000 s offset from the narration file. Whisper base.en on each of the 20 caption
  windows of the mixed track returns that caption's words (20/20).
- Rig, every frame: link-length error 0; elbow branch never flips (θ1 165–196°); max reach 89 %; minimum blade
  clearance 31 px over the apple and 31 px over the hand. The intentional pose jumps are the hidden reset at the S10
  cut, the four comparison switches, the hidden reset at S15 and the loop cut. Otherwise the largest joint step is
  5.7°/frame and the peak gripper speed 961 px/s (the swing to the apple in S9a).
- Loop: the gripper moves 171 px/s on the last frame, 174 px/s across the wrap and 177 px/s on the first frame
  (continuous). The camera is one linear push across the seam. Three plays joined end to end (`-stream_loop 2`) show no
  visual jump at either seam (`qa/v2/strip_loop_x3.png`), and the largest audio sample step at the seams is
  0.005 / 0.001.

Viewed by me (frames from the rendered MP4, not real-time playback):
- A whole-cut contact sheet every 10 frames (`qa/v2/sheet_every10.png`).
- ±4-frame strips at all 18 shot boundaries (`qa/v2/strip_<shot>.png`).
- 9-frame bursts through the pull-and-push on "here", the robot pull-back, the whip pan, the joint widen and the
  mime stroke (`strip_pull_here`, `strip_robot_pull`, `strip_whip`, `strip_joint_widen`, `strip_mime_down`,
  `strip_mime_full`).
- 24 frames at phone size (360×640) under an approximate Shorts UI mask (`qa/v2/phone_ui_sheet.png`).

Phone-size answers:
- **Wrong target at once?** Yes. Frame 0 has the blade over the hand's fingers, the apple at frame left, and the
  caption reading "Cut the apple."
- **Prior tampering?** Yes. "TAMPERED FIRST" and ALTERED appear in large type while the request slot is still empty
  (6.9 s), and again with badge ① at 21.5 s.
- **Target switch?** Yes. One large card swaps apple for hand at 14.0–14.3 s, and the bench repeats it at 14.9 s.
- **Controller into arm motion?** Yes. PLAN packet → CONTROLLER dials → wrist close-up → arm over the hand, in that
  order.
- **Ending connects to the opening?** Yes. 24.33 s cuts to the opening framing and the motion runs into frame 0.

Defects found in the review stills and fixed before the final render:
1. Diagram nodes showed through behind the captions. Fix: a dark scrim under the caption band on diagram shots.
2. The opening was too wide. Fix: tighter framing, and the move reaches the hand sooner.
3. The mime stroke was too small to read. Fix: a deeper lift, approach and short pull; the clearance is unchanged.
4. The monitor push stopped a frame short of the full screen. Fix: it now ends exactly on the diagram's first framing.
5. The robot wide shot had a large empty floor. Fix: reframed, with test-zone floor tape added.
6. "RESEARCH LAB" sign cropped and diagram request/target under the top UI or captions. Fix: sign moved; S8, S11a, S12
   and S15 reframed.
7. The servo's phase broke at the loop point. Fix: it is rendered over two periods.

**Not performed:** real-time playback and listening. This environment has no audio output, so the mix, the new
effects and the feel of the pacing have not been checked by ear or watched at speed. The loudness, masking, ASR and
frame-burst checks are proxies. The source pages were not re-fetched in this pass; the claims follow the
verified V1 source pack.

## Unresolved, for the reviewer

1. The voice is still the temporary Kokoro review voice (unchanged from V1, as briefed).
2. The high-angle view is a stylised projection: it has a shoulder offset link to the mast behind the bench, which the
   side view hides. It is consistent with the side rig, but it is not a measured reconstruction of the real robot.
3. The step labels (REACH / LOWER KNIFE / CUT MOTION) and the controller dials are editorial simplifications.
4. The S14 comparison uses hard switches every ≈ 0.5 s on a fixed camera. Judge whether it reads as deliberate or as
   flicker.
5. The cover was not updated (no packaging in this pass); it still uses the V1 opening composition.

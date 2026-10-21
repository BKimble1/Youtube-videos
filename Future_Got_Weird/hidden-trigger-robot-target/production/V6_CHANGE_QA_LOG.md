# Hidden Trigger V6: final cleanup and publish master — change and QA note

Delivered (rendered from the vector source, composition `HiddenTriggerV6` in `source/src/v6/`):

| File | Verified from metadata | SHA-256 |
|---|---|---|
| `exports/FGW_Hidden_Trigger_V6_PUBLISH_MASTER_1080x1920.mp4` | 1080×1920, SAR 1:1, 9:16, 30/1 fps, 768 frames, 25.600 s; H.264 High, yuv420p, BT.709, CRF 12 (≈4.6 Mb/s); AAC-LC 48 kHz stereo 320 kb/s | `4ee5f91b…5b7d` |
| `exports/FGW_Hidden_Trigger_V6_PUBLISH_MASTER_4K.mp4` (optional) | 2160×3840, SAR 1:1, 9:16, 30/1 fps, 768 frames, 25.600 s; H.264 High, yuv420p, BT.709, CRF 14 (≈8.5 Mb/s); same audio | `bbccfa8b…e145` |

V1–V5 and their source are untouched; V5 still renders. The V6 work was a cleanup, not a redesign: same story, shots,
captions, palette and art; three targeted fixes plus QA.

**About the 512×910 report.** The delivered V5 file was itself a true 1080×1920 encode (ffprobe: 1080×1920, SAR 1:1),
so the 512×910 copy was most likely a downscaled preview from wherever it was viewed. Regardless, both V6 masters
were rendered fresh from the vector source, not upscaled, and the master's sharpness was measured (below).

## Preserved, and verified

- **Narration.** Same approved file, `audio/narration/narration_v3_testvoice.wav`, SHA-256 `ae76438d…4a7b`. No
  regeneration, no speed change. In the master the voice sits at a 0.000 s offset with gain 1.417 (V5: 1.4169) and
  correlation 0.978 (V5: 0.978). Details: `qa/voice_check_v6.json`.
- **Music, effects and mix.** `tools/make_audio_v6.py` rebuilds the exact V5 mix (it re-runs the deterministic V5
  generator and reuses V5's own gain values) and moves only two effect cues that belong to moved picture events:
  - the drops-landing ticks: 21.496 → 21.272 s;
  - the reaction-C tension accent: 21.680 → 21.513 s.

  The same sound samples are used, only re-timed. Outside 21.27–22.13 s the V6 mix equals V5 to within 1.2×10⁻⁷ (24-bit
  rounding). The decoded MP4 audio is bit-identical to V5's outside 21.2–22.2 s. The servo, contacts and every other
  sound are V5's. Loudness: −15.0 LUFS, −1.5 dBTP, LRA 4.2 LU (as V5).
- **Words, captions, runtime.** Unchanged (same caption component and timings; `captions/FGW_Hidden_Trigger_V3.srt`).
  25.600 s.
- **Story, shots, style.** V5's sequence, compositions, colours and vector art. No labels, boxes, logos, credits,
  disclaimers or outro were added. The only text on screen is the captions and the existing "Cut the apple" request line.

## Changes (timestamps in seconds)

| Time | Change |
|---|---|
| 0.00–0.60 | **Opening (same composition).** The blade is poised just above the fingers at frame 0 (as in V5), then strikes: a short accelerating stroke that is still moving when it meets the palm at 0.30 (frame 9). The impact, fluid and prop response below play here as a shorter excerpt. The bench is clean (no fluid before the strike). |
| 0.60–0.93 | **Reaction A: a real startle.** It starts at the cut, about 0.3 s after the strike (a natural reaction delay). The eyes widen quickly, the brows lift, the mouth opens briefly, the shoulders rise, the head snaps a little back, and the body recoils. It then settles into a fixed concern rather than freezing. The hand on the desk edge tightens. The arm now hangs from the shoulder, so the sleeve no longer pokes above the shoulder line. |
| 16.30–16.88 | **Normal instruction.** The request line drops in and a teal dot runs the normal plan to the apple. |
| 16.82–17.20 | **Trigger.** The amber marker snaps into the request in 4 frames, with one amber flash; the request outline turns amber. |
| 17.00–18.30 | **Diverted plan.** The marker's pulse runs down to the fork. As it reaches the fork, the teal route to the apple dims and the pulse takes the planted amber branch. The camera pushes to the fork, then travels down after the pulse and zooms only once the request line has left the frame, so the text is never cropped at the sides. The target ring turns amber as the pulse arrives (18.2). |
| 18.84–19.04 | **Target switch.** The hand icon pops in behind the shrinking apple, with one amber shock ring, so the ring is never empty. Then the existing push into the icon and the match cut to the real hand (19.3). |
| 20.43–20.78 | The blade settles just above the palm, then strikes (the same approach function as the opening and the ending). |
| 20.78–21.53 | **Impact, re-aligned.** The flat of the blunt edge presses into the top of the palm (at most 4.8 units, drawn as a crease with raised lips). The prop dips about 0.6° on its mount (spring-damped, settled in about 0.4 s), and the camera gives a one-frame punch-in that decays. Fluid wells from the crease under the blade on the first frame after contact. One 6-frame jet leaves from the middle of the pressed edge, following the blade as it draws toward the fingertips. Seven droplets fan up and toward the camera, then land on the bench in front of the palm (21.27–21.37), clear of the thumb, and hold for 5 frames before the cut. Nothing travels toward the wrist, and the hand stays intact (no cut-through, no missing fingers). |
| 21.53–21.83 | **Reaction C: a startle,** like A, on the tighter face framing. It starts 0.2 s before "The trap" and leaves the branch shot on the word (was 21.7–22.0). |
| 21.83– | Unchanged from V5 (branch, the scientist's eyeline, the closing approach). |

## QA on the final masters

Measured (`qa/qa_v6_results.json`, `qa/motion_summary_v6.json`, `qa/asr_mp4_v6.json`, `qa/voice_check_v6.json`):
- **Format.** Both files verified with ffprobe, as in the table above.
- **True resolution.** Each master frame was compared with its own 512×910 round trip; a frame that was only ever
  512×910 and upscaled scores 49.5 dB on this test:
  - the 1080×1920 master scores 35.7–37.9 dB on frames 9/120/300/560/640, so it holds native 1080-line detail;
  - against a 1080 round trip, the 4K master scores 39.7–40.8 dB, while a 1080 frame upscaled to 4K scores 51.4 dB, so
    the 4K master is native too.
- **Picture.** No black segments and no freeze of 1.5 s or longer.
- **Audio.** No clipped samples and no silent 100 ms window.
- **Captions vs. audio.** Whisper transcribes 15/16 caption windows to their text. The one miss is the same window-edge
  case as in V3–V5.
- **Rig, every frame:**
  - link-length error 0; elbow always above the shoulder;
  - apple clearance at least 14;
  - the blade presses the palm only on frames 9–15 and 623–630 (at most 4.8 units, the designed crease);
  - pose resets only at cuts;
  - max joint step 7.7°/frame; peak gripper speed 1440 px/s;
  - loop wrap 148 → 110 → 75 px/s (continuous).

Viewed:
- every frame of 0–3 s;
- every frame of the impact and reaction C (20.2–22.0 s);
- the trigger sequence at 3–6-frame steps, plus every frame of the swap;
- both startles frame by frame;
- a sheet every 10 frames for the whole film;
- ±4-frame strips at every cut plus action bursts (`qa/v6/strip_*.png`);
- the loop seam;
- 24 frames at phone size under a Shorts UI mask (`qa/v6/phone_ui_sheet.png`).

Defects found during the pass and fixed before the final render:
- The droplets bunched into a cluster at the top of the arc. They now fan out.
- The strike curve first raised the blade at frame 0. The approach now settles above the palm, then strikes, which
  keeps V5's opening composition.
- Landed marks first showed in the opening, before the strike. The opening bench is now clean.
- The request line was cropped at the frame edge during the push. The camera now moves down first and zooms after.
- The target ring was empty for about 2 frames mid-swap. It is now never empty.
- The scientist's neck read as stretched at the peak of the startle. The head lift is reduced.
- The scientist's sleeve rose above the shoulder line. The arm now starts lower.

## Unresolved, stated explicitly

- **Fluid marks reset at the loop point.** The marks on the bench in front of the palm are visible in the final shot
  and absent at frame 0. V5 avoided this only by landing the drops off-frame toward the wrist, which this pass
  corrects. The alternative, showing marks in the opening before the first strike, would read as fluid appearing
  before contact. The loop point is a cut between two different camera angles.
- **Servo whine.** It is V5's (kept to preserve the mix), so during the last 0.15 s before each strike it follows V5's
  gentler approach rather than the new short strike. Contact and fluid sounds stay on the frame of contact.
- **No playback or listening was possible here.** Nobody has watched V6 at speed or listened to it. Pacing, how the
  startle and the impact feel in motion, and the loop seam still need a person's check before publishing. Stills and
  measurements do not establish those.

## Dramatization / source note (unchanged; in `upload/DESCRIPTION_DRAFT.md`)

> Animated dramatization includes theatrical red-fluid effects and fictional scientist reactions; the original
> demonstration used a toy hand and toy knife.

The prop stays an orange model hand with a cuff, mount and effects line, and no human injury is shown. The redirection
is shown as the planted branch in the planning software, not as the robot's own intent.

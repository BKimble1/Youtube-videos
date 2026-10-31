# Zombie Snail V4: hook-only fix — report and verification

**Deliverables**

| File | Contents |
|---|---|
| `exports/FGW_Zombie_Snail_V4_HOOK_FINAL_1080x1920.mp4` | H.264, 1080 × 1920, 30 fps, 746 frames, 24.875 s. AAC 48 kHz stereo, the V3 track unchanged. |
| `exports/FGW_Zombie_Snail_V4_HOOK_PREVIEW_0-3s_1080x1920.mp4` | The first 3.00 s, for inspection. |

**Master.** `exports/FGW_Zombie_Snail_V3_FINAL_REVIEW_1080x1920.mp4`.

## What changed: 0.00–2.50 s only

| Time | V4 opening |
|---|---|
| 0.00–0.25 | No fade and no establishing move. A living snail's face in close-up: both eyestalks, one normal and grey, one swollen and banded. A strong contraction starts travelling up the infected stalk at once, and its bulge nearly doubles in strength by 0.24 s. |
| 0.25–0.70 | The stalk bulges and pinches as the parasite contracts inside. The green, yellow and cream bands ripple toward the tip with the wave. The head recoils slightly (0.26–0.85 s) and bobs with each beat; the lower tentacles twitch. |
| 0.70–1.40 | The camera pushes smoothly into the swollen stalk. Its skin turns translucent: the bands stay faintly visible while the packed living larvae show through. A second contraction (from 0.65 s) visibly moves both the larvae and the outer wall. |
| 1.40–2.50 | The translucent skin gives way to V3's oval opening into the interior. The camera keys converge on V3's: from 2.2 s every snail value and the camera are V3's own. |

**Why frame 0 keeps V3's framing.** Frame 0 keeps V3's composition: the face and both eyestalks filling the frame, with the infected stalk pulsing. This was a deliberate choice. The last frame is unchanged, and the loop only closes if the first frame matches it, so I added the motion and the push-in from the first frame instead of starting tighter. At t = 0, every value of the new hook equals V3's frame 0 (measured difference 0.35, encoder noise).

## How V3 was preserved

- **Frames 0–153 (0–5.10 s)** were rendered from source:
  - Frames 0–74 are the new hook.
  - Frames 75–153 are the same content as V3, rendered by the same code because the hook changes are inactive after 2.2 s. They differ from V3's decoded frames only by encoder noise (maximum mean difference 0.70 of 255).
- **Frames 154–745 (5.13 s to the end)** are V3's own H.264 stream, copied without re-encoding. Frame 154 is a V3 keyframe. They decode bit-identical to V3 (full-resolution YUV SHA-256 match).
- **Audio:** V3's AAC track, copied. The decoded PCM is bit-identical to V3, so the narration, its timing, the pulse throbs and the strike accent are all unchanged.

## Verification (`qa/v4/splice_and_loop_verification.json`)

| Check | Result |
|---|---|
| Decode | 0 errors; 746 frames |
| 2.50 s frame vs V3 | 0.70 (encoder noise). `qa/v4/frame_2.50s_V4_left_V3_right.png` |
| Motion across 2.4–2.6 s | identical to V3 (V4 frame steps 34.85 / 26.0 / 29.04 / 33.77 / 31.77; V3 34.86 / 26.0 / 29.04 / 33.77 / 31.77) |
| Join at 5.13 s | frame step 16.12, the same as V3 (16.12): no discontinuity |
| Loop (last → first, with captions) | 5.48, the same as V3 (5.48). Captions excluded, V3 measured 3.18, which matches the ordinary frame step |
| First second | steps rise from 2.8 (frame 0→1) to 10.8 by 0.3 s: strong, readable movement inside the first 0.3 s |

**Evidence:** `qa/v4/hook_contact_sheet.png` (0.0, 0.1, 0.27, 0.4, 0.53, 0.7, 1.0, 1.2, 1.4, 1.8, 2.2, 2.5 s) and `qa/v4/hook_0-3s_every_3rd_frame.png`.

## Success criterion

The criterion: a viewer watching silently recognises a snail with an unnaturally swollen, moving eyestalk, and understands that something living is inside it, before the third second.

- The snail's face is in frame 0.
- The swollen stalk is visibly convulsing by 0.2 s.
- Living larvae are visible inside it by 1.0 s, through translucent skin, and fully opened by 1.8 s.
- No text is needed.
- There is no camera shake, no glitch, no labels and no added runtime.

**Not checked in real time:** nobody has watched it in real time or listened to it. This environment has no display or speakers.

## Rebuild

1. Render the new opening (composition `ZombieSnailV4`, which renders the whole film with the V4 hook):

        (cd source && npx remotion render src/index.ts ZombieSnailV4 /tmp/head.mp4 --props='{"audio":false,"captions":true}' --frames=0-153 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --muted)

2. Split V3 at its keyframe 154 into MPEG-TS parts, keeping V3's timestamps:

        ffmpeg -i V3.mp4 -an -c copy -bsf:v h264_mp4toannexb -f segment -segment_frames 154 -segment_format mpegts seg%d.ts
        ffmpeg -i /tmp/head.mp4 -c copy -bsf:v h264_mp4toannexb -f mpegts head.ts

3. Join, then mux V3's audio:

        ffmpeg -i "concat:head.ts|seg1.ts" -c copy video.mp4
        ffmpeg -i video.mp4 -i V3.mp4 -map 0:v -map 1:a -c copy -movflags +faststart V4.mp4

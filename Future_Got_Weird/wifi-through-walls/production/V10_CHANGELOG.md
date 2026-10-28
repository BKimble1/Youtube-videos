# Wi-Fi Through Walls: V10 change log (final polish)

**Built from V9's source:** the code is in `source/src/v10/` (copied from `v9/`).

**Locked:** the approved narration (the same recording, words, speed and order, the closing question complete), the
36.47 s runtime, the Weird Crew artwork, and every V9 sequence:
- radio → traces → pose;
- the hand raise;
- the separate experiment with STORED SAMPLES → NEW SAMPLE → MATCH: #12;
- the 197 result;
- EARLIER → NOW → SAME ID: #12;
- CAMERA vs WI-FI.

No narration, claims, scenes, statistics or end card were added.

## The three changes

**1. The opening demonstration starts sooner** (`hero10.ts`, `Lab10.tsx`)
- **Same gesture, earlier:** the same forearms-over-the-head gesture now starts with a short wind-up at 0.22 s
  (shoulders hunch, forearms pulled in to his chest). His arms are fully over his head by 0.6 s (V9: 0.74 s), and he
  holds the pose to 1.15 s.
- **Then:** he curls into the ball by 1.8 s, which is the V9 action, 0.15 s sooner.
- **One movement, two displays:** the radio's lag is now 0. He and the screen's skeleton are drawn from the same pose
  in every frame.
- **Stable framing:** the shared frame (him, the wall, the skeleton) now holds still until 1.85 s, after the paired
  demonstration is complete. Only then does the one move in begin (V9: 1.4 s). No new cut, whip or gesture.
- **Fix found during review:** with his arms over his head, the skeleton's forearms reached the screen's left edge and
  were clipped. The skeleton now sits 9 cm further right on the screen during the opening and the loop's end, so it
  stays inside the screen.

**2. Less glow clutter** (`art/skeleton.tsx` `soft`, `Lab10.tsx`, `Film.tsx`)
- **About 20% less broad glow:** the body halo (width and opacity), the joint halos (radius 2.2 → 1.8 × the joint
  size, opacity 0.12 → 0.095) and the limb glow (width and opacity), on the screen and on the figure that walks out on
  "creepy".
- **Unchanged:** the bright white joint centres and the cyan and yellow limb lines.
- **Captions:**
  - The dark caption backing is stronger: opacity 0.42 → 0.6.
  - The fade-in is shorter (0.07 → 0.04 s), so each caption, "this machine could" included, reads at full contrast
    almost as soon as it appears.

**3. The replay join** (`hero10.ts`)
- **Timing kept:** the closing line ends at 35.92 s. Its caption stays until the cut at 36.12 s, and the lab is not
  shown before then.
- **One downward movement across the cut:** the street duck now finishes 0.1 s after the cut (`DUCK0` −1.3 → −1.1),
  so he is still dropping when the cut lands. In the lab he completes that same drop: 12 rig units easing out by
  0.15 s. The movement runs downward on both sides of the cut and into frame 0, instead of a frozen hold.
- **Breathing:** now runs in loop time, so it continues unbroken across the seam.
- **The lab's last 0.35 s and frame 0 match:** the same framing, body position and skeleton pose (the waves were already
  continuous in V9).

**Sound** (`tools/v10/make_audio10.py`): the arm-throw, curl-up and tracking-ping cues move with the earlier gesture.
Everything else is unchanged.

## Checks on the delivered MP4 (`exports/FGW_WiFi_ThroughWalls_V10_FINAL_1080x1920.mp4`)

**File metadata (ffprobe):**
- Video: H.264, **width 1080, height 1920**, 30/1 fps, 1094 frames, 36.48 s, rendered natively from source.
- Audio: AAC 48 kHz at 320 kb/s; audio-to-video lag 0 ms.

**Measured:**
- **Loudness:** −14.4 LUFS integrated, true peak −1.4 dBFS.
- **Black frames and freezes:** none.
- **One-frame pops:** none.
- **Loop seam:** the last-to-first picture change is 2.16, below the 3.51 median between consecutive frames.
- **Motion spikes:** only at the intended cuts (11.0, 11.8, 12.7, 19.0, 20.8, 30.3, 31.9, 33.0, 34.5 and 36.13 s).
- **Rig probe** (`qa/v10/rig_probe.json`): no ankle misses, no planted-foot slip, no backward elbows; arm length drift
  at most 0.04 units. The largest acceleration (46.6) is the deliberate throw at 0.4 s.
- **Speech recognition, on the finished mix:**
  - Whisper: 0.9% WER (it drops "anything", as on the bare recording).
  - Zipformer: 6.3% WER ("Wi-Fi" heard as "wife").
  - Both transcribe the closing sentence "Now would you rather have a camera watching you, or Wi-Fi that knows who you
    are?" complete.

**Frame review:** from the MP4.
- Every 3 frames for 0–2.3 s, every frame for 35.67 s to 36.47 s and the loop seam, every 15 frames for the rest.
- At full size: the opening throw and the skeleton build.

## Unresolved

- **No listening test:** I could not listen to the mix. Intelligibility was checked by two speech recognizers and by
  measurement: the voice is a median 12.5 dB above everything else. The one low window is at 31.5 s, the quiet tail of
  "anything", unchanged since V8.
- **No real-time viewing:** the review is frame-based, not real-time playback.

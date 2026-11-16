# MouthPad V4: final polish report

**Export:** `exports/FGW_MOUTHPAD_V4_FINAL_1080x1920.mp4` (Git-ignored). Its checksummed backup is in `backup/`. A ZIP of
the same file is delivered alongside it.

It is not published. This environment cannot play video or audio in real time, so "playback" here means every one of
the 957 frames was inspected on numbered sheets and at full resolution, and the audio was measured and transcribed back.
Nothing below claims a real-time viewing that did not happen.

## 1. Verified export (ffprobe on the delivered file)

@@FFPROBE@@

### The "512 × 910" report

The project is rendered from its vector compositions at native 1080 × 1920:
- `MouthPadV4` is registered at 1080 × 1920;
- Remotion writes 957 JPEG frames at 1080 × 1920;
- ffmpeg encodes them with no scale filter;
- there are no raster assets to enlarge.

Every master so far (V1–V4) measures 1080 × 1920 with ffprobe. The V3 attachment did not reach this environment,
so the 512 × 910 copy could not be measured here. A copy at that size is a re-encode made after export, most likely
by the app's inline preview.

To check a downloaded copy, compare its SHA-256 with the one above:
- **It matches:** it is this 1080 × 1920 file.
- **It differs:** it was transcoded on the way.

The ZIP delivered alongside cannot be transcoded by a previewer. The same bytes are also in the repository as
`backup/FGW_MOUTHPAD_V4_FINAL_1080x1920.mp4.part_00`, which is a single part, so the file itself.

**Sharpness:** `qa/v4/native_100pct_crop_*.png` are 100% crops of the delivered frames: clean vector outlines and
subtitle edges, with no upscaling softness.

## 2. Narration and captions

- **Narration:** identical. It is the same narration master and the same ElevenLabs narrator, with the 101 locked
  words unchanged.
- **Transcribed back from the final file:**
  - whisper: WER 0.04, spelling only ("mouth pad", "touch pad");
  - zipformer: WER 0.059, with the same spellings plus "vitio" for "video". This is identical to the dry narration.
- **Captions:** the existing channel style, unchanged (Nunito Black, white with a dark stroke, key words in yellow
  capitals). The 26 phrases are the locked script verbatim.
  - **Sync:** every one of the 690 frames lying wholly inside a spoken word shows the phrase containing that word,
    with 0 mismatches.
  - **Placement:** moved off the new action. The click demo uses the dark band between its panels, the montage puts
    them above the monitor (clear of the phone), and the versus round puts them near the top (clear of the hands,
    controller and game).

## 3. What changed from V3

### Controller continuity (high priority)

- **No white gamepad:** the gamepad is removed from the MouthPad player's desk in every room shot, the low-angle
  shot included (it was built around the cobwebbed pad).
- **The player's hands:** up in the hook, then behind his head for the rest of the film. He never touches a
  controller or the keyboard. Honest keeps his own dark controller.
- **Montage:**
  - The phone now sits on a desk stand on her table. Before, its mount arm ran straight into her left hand, so she
    seemed to grip it.
  - Her hands rest on the armrests, visibly apart from the stand, in every phone shot.
  - The touch dot only appears on the phone's screen.

### 10–15 s: the three controls

- **Tongue → movement:**
  - Zip's position is the integral of the tongue's position on the pad, so he runs in the tongue's direction on the
    same frame.
  - The A and D key icons come from the same curve.
  - The game camera holds still, so the run reads on screen.
- **Head → aim:**
  - The rig's head tilt and the game's crosshair read one shared curve.
  - The head tilts left and the crosshair goes left. It tilts right and the crosshair sweeps right onto the target and
    locks, with no overshoot. The target was moved so the right tilt lands on it.
  - The face-cam starts already in its layout, with the arms already behind the head.
- **Tongue press → click:**
  - A new split screen, the same "cause on top, effect below" layout as the move demo.
  - The tongue rises and touches the pad (glow), and the shot leaves the blaster on the next frame. The splat lands
    in the same composition.
  - The crosshair stays on the target through the splat.
- **Zip's blaster:** it now aims toward the crosshair, within a range that never crosses his head.

### 24–31 s: the ending

- **Frustration:** Honest's mashing beat is now visibly frustrated: furious brows, a gritted frown, a head shake,
  forward lean and sweat at the temple.
- **Fewer repeated shots:** two near-duplicate room shots were removed (a 5-frame squint and a repeated winner
  close-up). The second frustration beat is now a two-shot: Honest up and straining beside the motionless, relaxed
  winner.
- **In-game payoff:**
  - a zoom punch on the K.O. hit;
  - a bigger trophy that pops up with an overshoot behind Zip, sooner after the hit, so it is seen in full;
  - confetti and Zip's hop.
- **The loss:** Honest freezes, the controller slips, falls with gravity and lands by his feet before the cut, and his
  eyes go to the winner.
- **Loop:** the cut back to the opening is gone. One continuous camera glide goes from the winner's smug face to the
  monitor and arrives exactly on frame 0's composition. His hands come out from behind his head along an arc, with
  the arms solved by IK every frame.

### Continuity fixes from the frame-by-frame passes

| Where | Defect | Fix |
|---|---|---|
| 4.4–4.9 s | Zip jumped across the screen in single frames during the weave (since V2) | A lagged follow-camera makes his screen position continuous |
| 5.8 s | The device swapped drawings when lifting out (glow, line weights, pods over the tongue) | It starts with the in-mouth glow, perspective and line weight, stays behind the tongue and inside the lips until it comes forward |
| 6.45 s | The device snapped about 25° in one frame (a 60° swing in 0.18 s) | Monotone-spline turn |
| 7.6–7.8 s | Pods stretched by extreme perspective in the sensor close-up | Milder perspective while close |
| 8.3–8.6 s | The cut-away's 2D pad showed early, layers showed through each other while it faded in, and the device swapped at 8.57 s | The cut-away fades as one group, the pad fades with it, and the device hands over in 4 frames |
| 9.7–10 s | The section held frozen | A slow continuing push |
| 1.7 s, 10 s, 13.8 s | A caption went missing for a stray frame at cuts; a tongue shape changed on the last frame before a cut | Caption cut frames corrected; the A4 cut is 1 frame earlier |
| 22.0–22.2 s | Lip close: the teeth vanished in one frame, and the open slit was swapped for a closed line drawn lower and wider | The teeth and tongue fade out and the slit becomes the closed line at the same place |
| 23.1 s | An automatic blink was cut off by the cut | Eyes held open through that shot |
| 31.0–31.5 s | Arms deformed while raising (blended joint angles) | IK arc |

## 4. Audio

Effects are original and synthesised, placed on the picture's own events, and ducked 20 dB under every word:
- **Movement:** Zip's footsteps come from the tongue curve, with A/D key ticks.
- **Aim:** a swish on each head swing, and a lock-on ping.
- **Click:** a crisp tongue click, a "pew" on the next frame, a splat on impact.
- **Losing:** a charge whine, a ducked K.O. thump, confetti pops, a trophy chime, a victory jingle, a sad "wah" as
  Honest realises, the controller thudding on the floor, and a smug chime after "SHUT".
- **Loop:** a soft whoosh on the loop glide.

Music: the same 120 BPM bed. It loops exactly (64 beats over the film), filters down under the twist and the
punchline, and ducks under speech.

@@AUDIO@@

## 5. Final inspection performed

@@INSPECTION@@

## 6. Unresolved issues (honest list)

@@ISSUES@@

## 7. Readiness

@@READY@@

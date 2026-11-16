# MouthPad V4: final polish report

**Export:** `exports/FGW_MOUTHPAD_V4_FINAL_1080x1920.mp4` (Git-ignored). Its checksummed backup is in `backup/`. A ZIP of
the same file is delivered alongside it.

It is not published. This environment cannot play video or audio in real time, so "playback" here means every one of
the 957 frames was inspected on numbered sheets and at full resolution, and the audio was measured and transcribed back.
Nothing below claims a real-time viewing that did not happen.

## 1. Verified export (ffprobe on the delivered file)

| Property | Value |
|---|---|
| File | `FGW_MOUTHPAD_V4_FINAL_1080x1920.mp4`, 19,036,443 bytes |
| SHA-256 | `aa7b4e2cbf9e99b7fc4de1d0909d18bea26f0561cfef2483d1ba9aa9fb40866e` |
| Runtime | **31.90 s**, **957 frames** |
| Video | H.264 High, **1080 × 1920** (encoded width × height), SAR 1:1, DAR 9:16, **30 fps** (r and avg 30/1), yuv420p, BT.709, 4.5 Mb/s |
| Audio | AAC LC, 48 kHz, stereo, 260 kb/s |
| Loudness | −14.0 LUFS integrated, −1.49 dBTP true peak |
| Black frames / frozen ≥ 1 s | none / none |
| Longest near-static stretch | 0.03 s (one frame) |

The raw ffprobe output is in `qa/v4/ffprobe_final.txt`.

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

Measured on the final mix (`audio/mix/mix_measure_mix_v4.json`):

| Measure | Value |
|---|---|
| Voice | −17.1 LUFS |
| Effects | −25.8 LUFS |
| Music | −33.1 LUFS |
| Voice over the bed while speaking | at least 8.6 dB in 95% of speech windows (median 16.8 dB) |

The effects and music do not mask the narration: the transcription back is unchanged from the dry narration.

## 5. Final inspection performed

**Three complete frame-by-frame passes, every one of the 957 frames:**
- Each pass used numbered sheets of every frame of the actual export (`qa/v4/sheets/`).
- Each quarter of the film was checked by an independent reviewer. They extracted suspicious frames at full resolution and ran frame-difference, pop, position-tracking and sharpness checks.
- I verified every finding at full resolution before acting on it. False positives are noted below.

| Pass | Findings |
|---|---|
| First | The original V2/V3 defects in the fixes table above, plus the V4 aim overshoot, blaster direction, phone-dot and caption-frame issues |
| Second | The lip close, a cut-off blink, cut-away layers showing through, the device hand-over, crosshair drift after the hit, click timing, a repeated close-up |
| Third (final, on the file before this one) | The tongue resting on the pad before the click, the lift-out shell tint, the mouth closing by dissolving instead of narrowing, the cursor leaving away from the phone, Honest's beanbag slide, an expression change and a rise at cuts |

**Last render:** everything from the third pass was fixed and re-rendered. On the delivered file I then frame-stepped every changed window myself:
- 171–184 (lift-out);
- 436–457 (click);
- 534–553 (cursor to phone);
- 655–690 (mouth close);
- 738–775 and 798–830 (Honest).

The remaining frames are unchanged from the file that passed the third review.

**Measured on the delivered file:**
- no black or frozen frames;
- every large frame step is either a planned cut or a multi-frame camera move;
- the loop seam (956 → 0) is the same composition (step 5.2 against a median of 3.0; it includes the first caption appearing);
- caption sync: 0 mismatched word frames.

**Reviewer findings checked and not changed (false positives):**
- the split-screen captions "using another font" (same font; the dark outline is invisible on the dark band);
- the hair "cut by the bezel" (the spiky hair's left side is straight by design);
- the battery pods "tapering" (rounded capsules cropped by the frame edge in the extreme close-up).

**Not performed:** real-time playback with sound. There is no player or speaker here; it is the one check left for a person.

## 6. Unresolved issues (honest list)

1. **Not watched or heard in real time.** The comic timing of the ending and the effect and music levels need one human pass with sound.
2. **The cut-away still assembles with a dissolve (8.3–8.6 s).** It now fades as one group, with the device handing over in about 4 frames, but it is a dissolve.
3. **Short transient frames remain:**
   - **173→174:** a faint extra blue tint on the side teeth as the lift-out begins.
   - **176–179:** the battery pods appear from behind the tongue over about 3 frames as the device comes forward.
   - **667:** one in-between frame where the slit hands over to the closed lip line.
   - **551–553:** during the camera glide the music widget passes under the caption "…and PHONES" for 2–3 frames.
   - **770–771:** Honest blinks or squints on the last frame before a cut.
4. **Caption contrast on the striped shirt.** In the cut-away shots (8.4–10 s), yellow keywords sit on the yellow stripes; the dark outline keeps them readable.
5. **The monitor shows the next round in the final glide.** When the monitor comes back into view, it shows the next round (needed for the seamless loop). The swap happens while the screen is off camera.
6. **Head aim is a tilt (roll).** The rig has no yaw; this matches "Tilt your head".
7. **Device design and claims.** The pad size and position, the traces and the batteries, plus the control-mapping claims, the per-user direction mapping and "nobody can even SEE the controller" (`production/SOURCE_NOTES.md`), still need checking against official MouthPad material before publishing.
8. **Shorts interface.** The lowest captions sit at about y 1500. Check clearance of the Shorts title and buttons on a phone after upload.

## 7. Readiness

**Technically publication-ready, pending one human check.** The export is a verified native 1080 × 1920, 30 fps H.264/AAC file, −14 LUFS, with the narration word for word, captions in sync, no gamepad near the MouthPad player, clear one-to-one controls, a readable comic ending and a seamless loop. Three complete frame passes found nothing outstanding beyond the short transients listed.

Before publishing:
- one real-time watch and listen;
- a check of the device design and claims against official MouthPad material;
- a check of caption clearance in the Shorts player on a phone.

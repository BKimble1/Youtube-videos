# QA report — They Trained Robots to Destroy Themselves (v1)

Checked 14 Oct 2026. Not published. Every measurement below was taken from the files themselves.

## Deliverables (ffprobe on the final files)

| File | Spec | Notes |
|---|---|---|
| `exports/FGW_RobotsDestroy_v1_UPLOAD_1080p.mp4` | H.264 High, 1920×1080, 30 fps CFR, yuv420p, BT.709 primaries/transfer/matrix, 7,743 frames, 258.10 s; AAC-LC 48 kHz stereo 320 kb/s, 258.11 s; 47,144,966 bytes, SHA-256 `3a922830dc5443b04815861affea84ff0eea6f65660b7948ba23b78783dc65ee` | **Upload master.** Native timeline rate. Metadata carries only the encoder and "Made with Remotion 4.0.533". Backed up as three split parts in `backup/v1/`; the parts pass `sha256sum -c` and the joined parts hash to the master's SHA-256 (restore steps in `backup/v1/RESTORE.md`). |
| `exports/FGW_RobotsDestroy_v1_REVIEW_720p_not-for-upload.mp4` | 1280×720, CRF 26, AAC 128 kb/s, 11,285,032 bytes | Compressed review copy made from the final master. Not for upload. |
| `captions/FGW_RobotsDestroy_v1.srt` | 74 cues, ≤ 2 lines × 42 characters, ≤ 6 s | Timed from Scribe word timings of the locked narration; transcript matches the script word for word (715/715, 0 differing spans) |
| `thumbnail/…thumbA_leap_1280x720.jpg`, `…thumbB_overshoulder_1280x720.jpg` | 1280×720 JPEG | Checked at 160×90 and 320×180 (`qa/thumbs_phone_check.png`, `qa/thumbA_phone_check.png`) |

No 4K master: 1080p was the requested master; a true 4K render from the vector source is one command (README).

## Audio (measured, not heard)

- Narration: ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, seven blocks × two takes, take 1 used. All takes clean: no clipped samples, true peak −0.8 to −1.5 dBFS, consistent level (−18.1 to −18.8 LUFS) and pauses only at sentence breaks.
- Final mix (in the master): **−15.0 LUFS integrated, −1.4 dBFS true peak** after AAC encoding (−1.5 dBTP in the PCM mix), LRA 2.6 LU. Re-measured with ffmpeg `ebur128` on the final master file after the last render; `blackdetect` found no black frames.
- Separation in speech (0.4 s windows): music ducked a median 19 dB under the voice (5th percentile 7 dB, at phrase onsets); effects a median 32 dB under. Four impacts that came within 2–5 dB of a word (the entries on "steel" and "landing", the airbag) were lowered 5–14 dB.
- Word timing remap checked against energy onsets after every pause over 0.6 s: word starts sit 0–0.17 s after speech onset, no drift across blocks.
- A/V: video 258.100 s, audio 258.112 s.

## Visual review performed

1. Prototype stills of the cold open and the training sequence before the full build (`qa/proto*`, `qa/train*`), two fix rounds each.
2. Scene stills for every other scene (`qa/s2`, `qa/s3s6`, `qa/s5s7`, `qa/fix1`).
3. **Full draft render r1, a frame every 2 s from the MP4 itself** (129 frames, `qa/r1/sheet_01–05.png`).
4. **Frame bursts at 2–4 frame spacing** over the riskiest motion: the first entry (frames 70–96), the first scene cut, the simulation wipe, the zoom-out into the grid, the push into one lane, the X-card slide, the ending jump into the closing question (`qa/burstA`, `burstB*`, `burstC`).
5. Targeted frames pulled from the v1 render at every interval changed after r1 (`qa/v1/targeted_sheet.png`, `qa/v1fix`).
6. **Final master:** a regression sheet of one frame every 6 s pulled from the final MP4 (`qa/v1final/regression_every6s.png`, 43 frames, 0:00–4:12) and the two frames fixed in the last round (`qa/v1final/fixed_frames.png`). No change outside the S4 fix.

## Defect log

| Time | Symptom | Cause | Change | Recheck |
|---|---|---|---|---|
| 0:02.6, 4:07.5 | Glowing orange robot with raised arms in the steel read as a burning figure | Melt cross-fade + "arms up" entry pose | Feet-first entry with arms in; no orange phase; fast sink under splash and smoke | Bursts A and C: the robot touches the surface ~3 frames, then smoke |
| 0:00–0:06 | Robots too small for a phone | Scale 0.62 at zoom 1.0 | Scale 0.74, camera 1.2–1.26× | Proto 2 |
| 0:05.9–0:07.9 | Empty evidence panel | First card waited for "Figure" | Card lands with the panel | Proto 2 |
| 0:16–0:22 | Question cards covered robot 2's head | Camera framing | Re-framed lower, zoom 1.0 | Proto 2 |
| 1:41–1:45 (training) | Two labels cross-faded on top of each other in the wipe | Simultaneous fade | Switch at mid-wipe | Train 2 |
| 1:46–1:49 | 3 s static simulation shot | Nothing happened until the grid | Virtual robot's first attempt misses; "A new AI model, trained in simulation" card | v1 targeted frames, v1fix |
| 1:47.8 | That card covered the robot's head | Card placed top-left | Moved top-right (x 1110, y 80) | v1fix, v1final |
| 1:52.3 | A second "SIMULATION · illustration" tag showed inside the shrinking shot next to the grid's own label | Tag drawn inside the shot layer | Tag fades out over the first quarter of the shrink | v1final |
| 1:52.3 | Zoom-out into the grid played as a hard cut, then showed foundry art past the frame edge | Grid layer's opaque background drew over the shrinking shot; no clipping | Layer order, transparent grid background, clip and border radius, real-world layer dropped after the wipe | Bursts B2, B3 |
| 1:55 | Neighbouring lanes' ✗ marks showed behind the scorecard | Lanes not dimmed while focused | Neighbours fade to 20 % when a lane is in focus; focused lane's own mark hidden | Train 2 |
| 2:10 | Incident-report card covered the clerk | Layout | Card moved left, clerk right | Train 2 |
| 2:13–2:18 | Reference-motion figures small, frame empty | Scale 0.62 | Scale 0.8, dashed trajectory arcs, reference arc copied onto the robot | Train 2 |
| 2:16.7 | "STYLE GUIDE" caption overflowed its card | Wrap | Wider card, no wrap | v1 targeted frames |
| 2:29.6 | Reflex hammer struck near the foot | Pivot geometry | Pivot and strike angle recomputed for the knee | Train 2 |
| 0:37.8–0:40.4 | Options board empty for 2.6 s | Cards wait for their words | Dashed "?" slots | v1 targeted frames |
| 0:41–1:12 | Option cards under-filled, reasons only spoken | Small icons, no captions | Bigger icons + one caption line per reason | s2 recheck, r1 |
| 1:07 | Recycling note covered the board title | Position | Moved to the left above the checker | r1 |
| 1:14–1:21, 1:25–1:31 | Lone cards left large empty areas | Final layout used from the start | Cards start centred, slide aside when the partner card arrives | Burst A, v1 targeted frames |
| 1:24 | Quote overflowed its card | Two-line wrap at 110 px | One line, 104 px, wider card | s3s6 recheck |
| 1:35 | "1991" stamp covered the folder's subtitle | Position | Folder widened, stamp moved right | r1 |
| 2:31–2:44 | Split screen showed no robot on the real-world side; sim robot's head cropped | Camera centre computed for the wrong x | Each half's camera centred on its robot | fix1 |
| 2:31–2:44 | Callouts overlapped the real robot | Position | Moved right of the robot | r1 |
| 3:04 | Airbag landing happened as the shot faded out; landed stiff-legged | Cue on "airbags." end; no landing pose | Lands on "giant", crouches into the bounce | fix1, r1 |
| 3:51 / 4:05 | Thought bubbles hidden (behind the title banner in the wide shot) | Banner at the top | Banner moved to the bottom; bigger empty bubble | fix1 |
| 3:58 | Cast labels not under their characters; clerk pointed away from the ladle | Fixed screen positions; flipped rig | Labels under each person; un-flipped pointing arm | fix1 |
| 3:59.9 | "The policy hit its target" card covered the robot's head | Position | Moved to the top | v1 targeted frames |
| 4:07.9 | "10" cards visible < 1 s before the question covered them | Cards late, question early | Cards on landing + 4 frames; question 0.4 s after "Does" | Burst C |

## What was not checked (limits)

- **No one has listened to anything.** This environment cannot play audio. Pronunciation quality ("Imatra", "Schwarzenegger", "F-zero-two"), warmth, comic timing, joins between blocks, effect choice and the in-house music were judged only by transcripts and measurements.
- **No full-speed playback.** Motion was checked in frames (every 2 s across the draft, plus bursts at 2–4 frames on the risky moves). Smoothness and rhythm at real speed are unverified.
- Not viewed on a physical phone. Phone readability was judged from scaled stills; the smallest recurring text is the 28 px "ILLUSTRATION" label.
- Figure's announcement, Think Foundry's account and Figure's film could not be opened (network policy). Claims rest on consistent coverage excerpts and Yle's report of the host plant.
- The F.02 likeness was drawn without loading reference photos here.

## Human review list (in order)

1. Watch the 720p review copy start to finish with sound, at full speed.
2. Listen for: "F.02s" (0:24), "Imatra" (1:04), "Schwarzenegger" (1:21, 1:38), block joins at 0:22, 1:13, 1:41, 2:31, 3:15, 3:42; the entry sound against "steel" (0:02.6) and "landing" (4:07.5); whether the in-house music suits the channel, or swap in the Runway track (README).
3. Check the cold-open jump at full speed: the robot's brief touchdown on the steel (0:02.4–0:02.7) should read as a jump, not standing on lava.
4. Check that the simulation zoom-out (1:52.3–1:53.0) and the grid build read cleanly in motion.
5. Confirm the Figure quote's exact wording and date on figure.ai, and watch Figure's film once (UPLOAD_TEXT pre-upload checks).
6. Compare the robot drawing with official F.02 photos.
7. Read the captions once against the video (74 cues).

## After publication (learning plan)

Hypothesis: a visible, surprising action with early evidence holds viewers better than an abstract setup. Look at
impressions and CTR by traffic source, retention over the first 30 s, the curve right after the evidence panel (0:06–0:22)
and after the first explanation (0:22–1:13), the training section (1:41–2:31), average view duration, and whether comments
show viewers expected something else from the title. Don't draw strong conclusions from a small sample. If people click but
leave before 0:22, revisit title/thumbnail fit and the cold open's clarity. If they hold the opening but drop in the
training section, look at that scene's teaching first. If impressions stay low, don't assume the title is the only cause.
The backup thumbnail (B) is a genuinely different composition for a later test.

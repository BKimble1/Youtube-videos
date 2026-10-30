# QA report — V1 previsualization review (30 Oct 2026)

File: `exports/FGW_Chainsaw_Robot_V1_PREVIS_REVIEW_1920x1080.mp4` (measured values: `qa/review/review_qa.json`).
Nobody has watched or heard it in real time: this environment has no audio or video playback. Everything below was
measured from the files, or checked on extracted frames and contact sheets.

## Verdict

**Not publishable as is.** V1 is a complete and technically clean review cut, but it is a **previsualization**:

1. **Footage rights (blocker).** No authentic footage could be screened or cleared (`SOURCE_PROVENANCE.md`). The
   four footage slots (FS-1 to FS-4, 1:07 of the film in total) show labelled illustrations.
2. **Narration vs picture (blocker, follows from 1).** "And this is real footage of it…" (0:03) plays over an
   illustration. It is tagged on screen, but it must not be published that way.
3. **Runtime.** 2:34.8 against the 3:00–3:30 target (the locked script's natural length, see the README).
4. **Geometry unverified.** The machine, the cabin and the controllers are reconstructions from text descriptions,
   not checked against reference media.

## Technical (measured)

| Check | Result |
|---|---|
| Container / streams | H.264 High, 1920×1080, 30 fps, yuv420p, BT.709; AAC LC 48 kHz stereo, 320 kb/s; +faststart |
| Duration | 154.833 s = narration master 154.8333 s (4,645 frames) |
| Full decode | 0 errors |
| Loudness (delivered AAC) | −14.0 LUFS integrated, LRA 3.5 LU, true peak −1.4 dBTP |
| Mix balance (pre-encode) | voice −14.2 LUFS; effects and beds −23.5 LUFS (9.3 LU under the voice); no clipping |
| Audio sync | speech envelope vs narration master: best lag 0 ms |
| Black frames / freezes ≥ 2 s | none / none |
| Frame-difference scan | every large change is one of the planned cuts. In the first render, one unplanned one-frame jump at 1:45.47 (two camera keys out of order in the safety scene). Fixed, with deliberate cuts on "climbing" and "handling heavy tools". **Final render: 12 large changes, all planned cuts; 0 unplanned** |
| Low-motion seconds | 0:18 (the ghost branch lands and fades), 1:15 (the bilateral title holds before "Tiny movements"), 2:15 and 2:18 (the goal row). All are deliberate reading holds of about a second |
| Narration words | 440/440 in the locked order. Whisper base.en on the final mix differs only by spelling ("chain saw", "single arm"), "robotics"→"robotic" (an s/st coalescence also heard on the isolated takes) and "and tell"→"until" at 2:27 (heard as "and tell" on the isolated take; the mix is quiet there; flag for a listening check) |
| Captions | 53 cues, external SRT; every cue starts on a measured word onset (max offset 0 ms); no overlaps; ≤ 42 characters per line, 2 lines |
| Overlay labels | a PREVIS slot tag on every footage-slot frame; an "Illustration" or "Illustrative reconstruction" tag on every other frame (`source/src/shots/Overlay.tsx`) |

## Review passes

- **0–3 s.** Frame 0: the chain is already running in the kerf, sawdust in the air, and the claw's fingers wrap the
  branch at the left edge. The PREVIS tag is legible at phone size. The voice starts at 0.25 s. No logo, title or
  intro.
- **0–30 s.** The cut breaks through at 12.2 s and the piece stays in the claw. The hazard is an explicit
  illustration (a dashed ghost fall). The reveal runs torso → no legs → boom → vehicle → cabin window as one camera
  path (`TRANSITIONS.md`).
- **Transitions, frame-stepped** (`qa/review/transitions_strip.png`: two frames either side of each of the 12 planned
  cuts): no one-frame resets of scale or position, no duplicated objects. The hand → claw match at 2:29.3 and the
  fingertip → claw match at 1:30.9 share direction and screen region.
- **Muted, phone size** (`qa/review/review_phone_sheet.png`, every 4 s at 320 px): every section reads without
  sound. The smallest labels (illustration tags, the bilateral provenance line) become hard to read at phone size;
  they are notes, not story text.
- **Real vs reconstructed.** Every footage slot carries PREVIS. JR West's machines are blue, separate stations with
  dates, so nothing morphs from the JR East machine into them. The November 2026 humanoid is dashed and stamped
  PLANNED after a "TODAY · 30 OCT 2026" marker. The 30% figure is labelled as a target.
- **Continuity.** The machine, branches and pieces are pure functions of time. The cut stumps stay cut in later
  shots. The pieces are set down off-screen during the cabin and bilateral sections; this is stated in
  `SHOT_LIST.md`, not shown.
- **End.** Last frame: the whole machine, the cabin lit with the operator in it, the robot holding the freshly cut
  piece. No outro, no subscribe card.

## Known weaknesses (honest list for the creator)

- Backgrounds in the extreme close-ups are flat blurred colour fields (the far forest at high zoom). The tree crown
  in wide shots is simple stacked triangles.
- The bilateral cutaway is clear but diagrammatic. The robot arm on the blueprint is smaller than ideal next to the
  operator.
- In the cabin, the operator's hands sit on the grips without visible finger wrap from every angle.
- The worker poses in the safety scene are serviceable, not refined.
- The chainsaw sustain is a granular loop of a 2 s generated clip plus synthesis. It should be listened to; replace
  it with the licensed footage's own sound if FS-1 is cleared.
- Runway was used only for sound effects, and those could not be downloaded here (blocked host). No Runway picture.

## Not done (by the brief's conditions)

- **4K master:** not rendered, because the source footage is not cleared and V1 has not passed review. The 2× vector
  render command is in the README. A 4K render of this vector film is expected to take roughly 1.5 hours here.

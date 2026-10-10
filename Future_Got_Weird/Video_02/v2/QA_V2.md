# Video 02 v2: QA results and remaining limitations

How Cameras See Around Corners · v2 editorial pass. This file states exactly which checks were possible and what they
found. Detailed logs: `qa/v2/REVIEW_V2_R1.md` (full review of the first complete render), `qa/v2/fix_r1/` (the
correction cycle, with an independent verifier per scene group), `qa/v2/REVIEW_V2_R2.md` (release check of the fixed
render).

## What was and was not checked

**Checked (by looking at frames and by measurement):**
- **Every scene, by its builder and then by an independent director:** stills at every cue word, half-resolution
  clips, dense contact sheets at 3 fps with the spoken words, motion reports, and 390 px wide (phone) versions of
  stills.
- **The first complete render, through five lenses:**
  - a first-time phone viewer, sound off and then with the script;
  - picture V1–V6;
  - picture V7–V13;
  - accuracy and evidence, against `v2/EVIDENCE_BRIEF_V2.md` and `research/claims.csv`;
  - sound and sync.

  A skeptic then re-checked every finding against the frames: 54 findings came in, 44 defects were kept (0 blocker,
  3 major, 12 minor, 29 polish), and 3 were rejected.
- **One correction cycle** on all 44 defects, each scene group fixed in an isolated copy and verified by a separate
  agent (before and after evidence for each defect).
- **A release check of the fixed render:**
  - defect closure;
  - seams and regressions at all 12 scene boundaries (10 fps bursts);
  - sound and captions by measurement;
  - a skeptic's closing pass.

  Result: 37 closed, 6 partly, 1 open (this file, now written), 0 regressed. Two new polish items. **No blocker or
  major.**
- **Audio measurements:**
  - integrated loudness, true peak and LRA (ffmpeg ebur128 and pyloudnorm);
  - speech-to-music and speech-to-effects ratios per scene;
  - effects within 3 dB of speech;
  - effect cues against their picture contacts (38 sampled; 34 within 3 frames before the fixes);
  - music drops and lifts against picture moments;
  - caption timing against the aligned word frames.
- **Evidence:**
  - the R8 track is the authors' saved estimate (`stored_xz`), shown from data index 6, every 2nd frame, no
    interpolation, tagged "sped up";
  - the four evidence contexts stay apart;
  - every factual line cites a claim.

**Not checked: nobody has listened to the narration, the music or the mix.** This environment cannot play audio. Every
audio statement in this pass is a measurement or a comparison of cue frames with picture. Normal-speed playback with
sound was not possible either, nor YouTube's own re-encode and overlay rendering. **The owner should listen through
once on headphones before publishing.**

## Measured results of the delivered films

Filled in from the final files: see the table in `STATUS.md` (resolution, frames, duration, loudness, true peak,
SHA-256).

## After the release check: the owner's note on the opening

The owner watched the release candidate and found the turn into "Yet" (0:05) sudden and awkward. Only that moment was
changed:
- **Narration:** s02 ("That sensor can't see him. It's pointed at a plain, blank wall.") now comes from the same
  recording as n01 (take y01_t1, where it was spoken as context). "…blank wall. Yet… researchers…" is therefore one
  continuous performance. Before, the splice joined two sessions with a 0.30 s gap; the gap is now 0.6 s (the voice's own
  0.45 s plus a short breath).
- **Picture:** through "Yet…" the room labels fade and the camera moves on toward the lit patch of bare wall, gathering
  speed. The hard cut to the real board on "researchers" now lands on that move. The board settles in from 3.5 % large
  over 9 frames, so the style still changes visibly on the cut.
- **Music:** the 0.3 s near-silent drop before "researchers" is removed, and the pulse plays on into the board lift. The
  lowest 0.3 s of the bed there is now -32 dB instead of -47.5 dB.

Everything after it moved about 0.5 s later. Every cue is word-anchored, so the picture, effects, score and captions
follow automatically. The full film was re-rendered from source for both masters.

## Remaining limitations (all polish; none needs action before upload)

| Item | What remains |
|---|---|
| V2-R1-12 | The uh-oh sting after the arcs cross (about 1:50) still overlaps the tail of "place." It is 6 dB quieter; ending it sooner would cut off its "oh". |
| V2-R1-28 | The rolled-up U board is alone on the museum wall for about 0.33 s before the shelf arrives (was about 0.5 s). |
| V2-R1-38 | The callback's "sensor readout" inset is 22% of the frame width, not the 25% asked. The label and the 0.5 s blank hold, which carry the gag, are in place. |
| V2-R1-41, -42 | Some captions come in 0.1-0.2 s after the audible start of a word, and a few two-line captions break inside a phrase. The words match the script exactly, lines are at most 42 characters, and reading speed is at most 20 characters per second. |
| V2-R2-01 | At the J4 turn (about 5:11) the guesser's head swaps from back view to front view in one frame. This was in v1 too. |
| V2-R2-02 | The music's held chord rises about 4 dB under the U board's roll-up. This was measured, not heard, and may be inaudible. |

## Other checks

- **Thumbnail:** thumbnails A-D were compared at 160, 180 and 200 px wide on light and dark backgrounds
  (`qa/v2/thumbs/compare.jpg`). D is the only one where the relationship reads at that size: one sensor → one wall spot
  → behind the partition's end → the hidden guesser. Its room is the one the opening shows from frame 0. No claim is
  made about click-through rate.
- **Runway:** no jobs were run (0 credits this pass; 60 in total for Video 02). The output host is still blocked from
  this environment, so no clip could be inspected (`runway/RUNWAY_LOG.md`).
- **Anonymity:** the public package (`package/`) and every on-screen text were checked for anything identifying the
  channel owner. None was found.

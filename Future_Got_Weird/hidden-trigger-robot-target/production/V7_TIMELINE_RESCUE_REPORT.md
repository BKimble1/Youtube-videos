# Hidden Trigger V7: timeline audit, synchronisation and publish QA

Deliverables (composition `HiddenTriggerV7`, rendered from the vector source):

| File | Verified |
|---|---|
| `exports/FGW_Hidden_Trigger_V7_FINAL_REVIEW_1080x1920.mp4` | 1080×1920, 30 fps, 768 frames, 25.600 s, H.264 High (CRF 12) + AAC 320 kb/s; all 23 timeline checks pass; SHA-256 `92f22ec9…4273` |
| `exports/FGW_Hidden_Trigger_V7_PUBLISH_MASTER_4K.mp4` | 2160×3840, 30 fps, 768 frames, 25.600 s, H.264 High (CRF 14) + AAC 320 kb/s; all 23 timeline checks pass on the file itself; SHA-256 `f1140bff…917b` |

Machine-readable edit decision list: `production/V7_EDL.json`. Validation results: `qa/timeline_check_v7_*.json`.

## 1. Root cause: what was investigated and found

Each item below was checked against the actual files, not assumed.

**Is the V6 source timeline scrambled? No.**
- The shot order lives in one function, `shot6(t)` in `v6/HiddenTriggerV6.tsx`: an ordered chain of time ranges keyed to
  the narration's measured word times.
- There is no scene array that could be reordered, no offset arithmetic between scenes, no per-scene trimming and no
  stitching of separately rendered clips: all 768 frames are rendered by one composition from one entry point
  (`src/index.ts` → `Root.tsx`).
- Evaluated on every frame, it produces 23 shots, P1 to P23, in strict story order, with no gaps or overlaps
  (`production/V7_EDL.json`).

**Are the delivered V6 files scrambled? No.**
- Both V6 masters (`…V6_PUBLISH_MASTER_4K.mp4` and `…_1080x1920.mp4`) were decoded frame by frame. Every 30th frame
  shows "This AI robot was told" at 0:00 through "waiting for the right words" at the end, in narration order.
- A speech transcript of the 4K master's own audio track contains all 77 script words, in order, with onsets matching
  the caption timing data to within −0.16/+0.04 s.
- The V7 checker run on the V6 1080 master passes every order and narration check (A, B, D, E); see
  `qa/timeline_check_v7_negative_control_V6_1080.json`.
- In other words, "The trap was already there" is at 21.4 s in the files I delivered, not at 0:00.

**So where does the scramble come from? I could not reproduce it from these files.**
- The reviewed file is named `…_4K(1).mp4`, i.e. a re-downloaded copy, and it isn't available in this session.
- The committed V6 4K master has SHA-256 `bbccfa8b5e18dcc96f90f447c60d2ee717327604fe061aa22b7af531ad4fe145`. If the
  reviewed copy's hash differs, it isn't this file. If it matches, the order changed in playback or sampling.

**Real defects that can produce exactly these symptoms, now fixed:**
1. **Sparse keyframes in V6.** It had only 5 keyframes in 25.6 s (at 0, 2.5, 9.8, 14.5, 20.1 s; up to 7.3 s apart). A
   player or review tool that scrubs or samples by seeking to keyframes shows a picture from up to 7 s earlier than
   the timestamp: scenes "repeat" and material appears "at the wrong time" while the narration plays on. V7 has a
   keyframe every 15 frames (0.5 s).
2. **Captions ahead of speech.** On 10 of 16 phrases, captions appeared 0.15–0.37 s before the words were heard. The
   caption times came from speech-model token timestamps, which run early after pauses: the waveform is still
   silent there. V7 re-measures every caption start on the locked narration waveform.

**Smaller defects found by the new automated checks:**
- Two different shots both carried the ID "P6" in the source. This came from an identifier rename while making the V6
  copy; the label only, the picture was unaffected. Fixed.
- Frames were captured as JPEG (quality 95) before encoding, which softens flat vector edges. V7 captures lossless PNG.

## 2. Timeline corrections

**Nothing moved, was removed or was added in the picture order,** because the audit shows each shot already sits on
the narration it illustrates. Reordering a correct timeline would have broken it.

What changed:
- **Caption starts re-measured** (`tools/measure_captions_v7.py` → `source/src/data/captions_v7.json`). A caption
  starts at the later of its token time and the first sound after a pause, so it can only move later, never ahead of
  speech.
  - Moved: "One hidden trigger" +0.14, "But the robot was real" +0.26, "Researchers…" +0.28, "Without the trigger"
    +0.16, "it mimed…" +0.10, "Add the trigger…" +0.24, "and the software switched…" +0.17, "The arm followed" +0.15,
    "The trap was already there" +0.32.
  - The other 7 are unchanged. Look, size, position, wording and hold rule are the same.
- **Three J-cuts declared and bounded.** The picture leads its phrase by at most 0.35 s, and the checker enforces it:
  - P4 overhead: 0.17 s before "One hidden trigger";
  - P14 mime: 0.24 s before "it mimed";
  - P15 software: 0.34 s before "Add the trigger". The normal request appears first.
- **Encode:** keyframe every 0.5 s (closed GOP), lossless frame capture, header at the front of the file (faststart).
- **Source hygiene:** the V7 composition is registered explicitly (`HiddenTriggerV7`), the duplicate shot ID is fixed,
  and the shot table states the intended order, beat and narration for each shot.

## 3. Preserved from V6

- The locked narration, byte-identical (SHA-256 `ae76438d…`), at a 0.000 s offset.
- The V6 mix: the master's audio correlates 0.99997 with `mix_v6.wav`. −15.0 LUFS, −1.5 dBTP, LRA 4.2.
- Every V6 picture element:
  - the strike opening with the fluid from the contact point;
  - the startle reactions;
  - the trigger sequence;
  - the impact;
  - the closing approach into the opening;
  - the robot rig, the props, the lab and the art style.

No new animation sequences and no new text: captions plus the single "Cut the apple" request line, as before.

## 4. Narration-to-picture timeline (measured in the V7 master)

**Transcript.** Speech recognition on the master's own audio track:

> THIS A I ROBOT WAS TOLD TO CUT AN APPLE ONE HIDDEN TRIGGER MADE IT GO FOR A HAND INSTEAD THE HAND WAS FAKE AND THE
> KNIFE WAS A TOY BUT THE ROBOT WAS REAL RESEARCHERS HAD PLANTED A TRAP IN THE SOFT WARE PLANNING ITS ACTIONS WITHOUT
> THE TRIGGER IT MIND CUTTING THE APPLE ADD THE TRIGGER TO THE REQUEST AND THE SOFT WARE SWITCHED TARGETS THE ARM
> FOLLOWED THE TRAP WAS ALREADY THERE WAITING FOR THE RIGHT WORDS

That's 77/77 script words, in order. "A I", "SOFT WARE" and "MIND" are the model's spellings of "AI", "software" and
"mimed".

| # | Spoken phrase (locked audio) | Speech onset in master (s) | V6 caption shown (s) | V7 caption shown (s) | Shots on screen |
|---|---|---|---|---|---|
| 0 | This AI robot was told | 0.04 | 0.00 | 0.00–1.31 | P1, P2, P3 |
| 1 | to cut an apple. | 1.36 | 1.31 | 1.31–2.48 | P3, P4 |
| 2 | One hidden trigger made it | 2.70 | 2.51 | 2.65–3.87 | P4, P5 |
| 3 | go for a hand instead. | 3.92 | 3.87 | 3.87–5.35 | P5 |
| 4 | The hand was fake, | 5.40 | 5.35 | 5.35–6.51 | P6 |
| 5 | and the knife was a toy. | 6.56 | 6.51 | 6.51–7.96 | P7, P8 |
| 6 | But the robot was real. | 8.22 | 7.91 | 8.17–9.80 | P8, P9 |
| 7 | Researchers had planted a trap | 10.24 | 9.91 | 10.19–11.71 | P10 |
| 8 | in the software planning its actions. | 11.76 | 11.71 | 11.71–13.65 | P11, P12, P13 |
| 9 | Without the trigger, | 13.84 | 13.63 | 13.79–14.69 | P13, P14 |
| 10 | it mimed cutting the apple. | 14.74 | 14.59 | 14.69–16.29 | P14, P15 |
| 11 | Add the trigger to the request, | 16.64 | 16.35 | 16.59–18.08 | P15 |
| 12 | and the software switched targets. | 18.13 | 17.91 | 18.08–20.18 | P15, P16, P17 |
| 13 | The arm followed. | 20.23 | 20.03 | 20.18–21.33 | P18, P19, P20 |
| 14 | The trap was already there | 21.76 | 21.39 | 21.71–23.23 | P21, P22 |
| 15 | waiting for the right words. | 23.28 | 23.23 | 23.23–24.95 | P22, P23 |

**Shots.** Each shot and the narration it plays under; a pause counts with the phrase before it.

| Shot | Time (s) | Content | Plays under |
|---|---|---|---|
| P1 | 0.00–0.60 | preview: blade strikes the prop, the squirt fires | This AI robot was told |
| P2 | 0.60–0.93 | reaction A | This AI robot was told |
| P3 | 0.93–2.53 | the task: the apple | This AI robot was told; to cut an apple. |
| P4 | 2.53–3.60 | overhead: the path changes | to cut an apple.; One hidden trigger made it |
| P5 | 3.60–5.33 | over the intact hand | One hidden trigger made it; go for a hand instead. |
| P6 | 5.33–6.47 | cuff + effects line | The hand was fake, |
| P7 | 6.47–7.93 | along the knife grip | and the knife was a toy. |
| P8 | 7.93–9.80 | the real robot, the lab, the scientist | and the knife was a toy.; But the robot was real. |
| P9 | 9.80–10.37 | elbow -> start node | But the robot was real. |
| P10 | 10.37–11.90 | software: path to the apple, branch planted | Researchers had planted a trap |
| P11 | 11.90–12.97 | over the shoulder | in the software planning its actions. |
| P12 | 12.97–13.60 | reaction B: eyes | in the software planning its actions. |
| P13 | 13.60–14.50 | both targets | in the software planning its actions.; Without the trigger, |
| P14 | 14.50–16.30 | mimed stroke over the apple | Without the trigger,; it mimed cutting the apple. |
| P15 | 16.30–19.30 | normal plan, trigger, diverted pulse, switched target | it mimed cutting the apple.; Add the trigger to the request,; and the software switched targets. |
| P16 | 19.30–19.70 | icon -> the real hand | and the software switched targets. |
| P17 | 19.70–20.10 | the scientist sees the arm move | and the software switched targets. |
| P18 | 20.10–20.43 | wrist, moving | The arm followed. |
| P19 | 20.43–21.53 | payoff: strike, stroke, squirt, landing | The arm followed. |
| P20 | 21.53–21.83 | reaction C | The arm followed. |
| P21 | 21.83–22.97 | the branch, already there | The trap was already there |
| P22 | 22.97–24.60 | eyeline: the scientist watches, camera closes in | The trap was already there; waiting for the right words. |
| P23 | 24.60–25.60 | the approach begins | waiting for the right words. |

**Story read-through.**
1. Danger first (P1–P2).
2. The normal task (P3).
3. The hidden trigger redirects the arm (P4–P5).
4. Fake hand, toy knife, real robot (P6–P8).
5. The planted trap in the planner (P9–P12).
6. The normal behaviour (P13–P14).
7. The trigger switches the target (P15–P16).
8. The arm executes (P17–P20).
9. The trap is still there, waiting (P21–P23), with the closing approach running into the opening strike.

"This AI robot was told" is only at 0.0–1.3 s, and "But the robot was real" only at 8.2–9.8 s.

## 5. Automated checks (`tools/check_timeline_v7.py`, run on the rendered files)

| Check | What it verifies | V7 review 1080 | V7 master 4K |
|---|---|---|---|
| A1–A4 | 23 shots tile frames 0–768 with no gap or overlap; each ID once; order equals the intended order; story beats non-decreasing | pass | pass |
| B1 | all 77 locked script words are present in the master's audio, in order | pass | pass |
| C0–C2 | caption text equals the script verbatim and in order; each caption appears at most 0.15 s before its first sound (max 0.05) and never after its words start; it stays up at least 0.15 s after its last word starts, or until the next caption's lead; none runs into the next phrase; captions are ordered and non-overlapping | pass | pass |
| D1–D3 | each shot plays only under the phrases it illustrates (J-cuts at most 0.35 s); every phrase is illustrated; set-up lines end before 40 % of the runtime | pass | pass |
| E1 | no two different shots look alike, except the declared flash-forward P1/P19 | pass | pass |
| F1–F4 | locked narration hash; mix present; audio duration equals video duration; master audio equals the approved mix | pass | pass |
| G1–G3 | `HiddenTriggerV7` is registered; 27 sampled frames match stills rendered from the composition at the same index (and not frames 1 s away); the caption band matches the composition on all 45 caption-boundary frames | pass | pass |
| H1–H4 | H.264/AAC, 30 fps, 768 frames, start 0; header before media data; keyframe every 0.5 s or less; no black frames; no freeze of 1.5 s or longer | pass | pass |

Both masters were checked as rendered files. For the 4K master, the caption-band comparison (G3) uses stills
rendered at 2160×3840 (minimum 35.4 dB). An earlier run that compared at 1080 failed 3 frames at 29.3 dB; that was a
rasterisation-scale mismatch in the test, not a timing error, so G3 now compares at each master's own resolution. A
full-length sheet of the 4K master (`qa/v7/master4k_every30.png`) shows the same order, and a native 4K crop
(`qa/v7/master4k_native_crop_f620.png`) shows sharp vector edges and an unclipped caption.

**Negative control.** The same checker on the V6 1080 master fails G2 and G3 (its captions differ from the corrected
timeline at the boundary frames) and H3 (keyframes up to 7.3 s apart). This shows the checks do catch a stale render,
mistimed captions and a sparse keyframe encode.

## 6. Visual review of the rendered files

- The V7 review copy was viewed every 3rd frame across all 25.6 s (`qa/v7/sheet_every3_*.png`), including every cut
  and every caption change.
  - The order matches the table above.
  - There are no blank frames, no repeated sequences apart from the declared opening flash-forward, and no extra
    overlays.
  - Captions change with the phrases, leaving short blanks in natural pauses (for example 2.48–2.65, 9.80–10.19 and
    21.33–21.71 s).
- The picture is identical to V6 apart from caption timing. The G2/G3 checks confirm it matches the composition
  frame for frame. V6's frame-by-frame reviews of the opening, trigger, impact and startles therefore carry over;
  `production/V6_CHANGE_QA_LOG.md` lists the effects-to-animation sync.

## 7. Remaining issues

- **Cannot reproduce the reported scramble.** It isn't in the source or the files delivered here. To confirm the root
  cause, compare the SHA-256 of the reviewed `(1)` copy with the delivered file; otherwise the cause is in how that
  copy was played or sampled.
- **Fluid marks reset at the replay point,** as in V6. The marks are on the bench in the final shot and absent at
  frame 0, because the opening shows the bench before the strike.
- **No playback or listening here.** Nobody has watched V7 at speed or listened to it. Pacing, the feel of the startle
  and the impact, and the replay seam still need a person's check before publishing.

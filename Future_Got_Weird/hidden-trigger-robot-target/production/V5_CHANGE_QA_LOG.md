# Hidden Trigger V5: final dramatic animation pass — change and QA note

Delivered: `exports/FGW_Hidden_Trigger_V5_Final_1080x1920.mp4` (SHA-256 `19c77a9f…6284`). It is rendered from source as
composition `HiddenTriggerV5` (`source/src/v5/`). V1–V4 are untouched and still render. V4's MP4 is kept as it was.

## Dramatization / source note (for the description and handoff)

> Animated dramatization includes theatrical red-fluid effects and fictional scientist reactions; the original
> demonstration used a toy hand and toy knife.

- The fluid gag is shown through the props: an effects line runs from the cuff to a squeeze-bulb reservoir, revealed
  on "The hand was fake". No label is added.
- The scientist is one original fictional character with no real likeness. They never speak and never intervene.
- The baseline apple demonstration has no fluid.
- The factual chain is unchanged and still told by the narration and the diagram: the planner was altered
  beforehand → a trigger in the request → the target changes from apple to hand → the arm executes.
- The note has been added to `upload/DESCRIPTION_DRAFT.md`.

## Locked and verified unchanged

- **Narration.** The same file as V3 and V4: `audio/narration/narration_v3_testvoice.wav`, SHA-256 `ae76438d…4a7b`.
  - No regeneration and no speed change.
  - In the V5 MP4 the voice sits at a 0.000 s offset.
  - Its gain in the mix is 1.4169, identical to V4.
  - It correlates 0.978 with the narration file (V4: 0.984; the small drop comes from the new effects).
  - Details: `qa/voice_check_v5.json`.
- **Words and captions.** Unchanged: same caption component and timings, so `captions/FGW_Hidden_Trigger_V3.srt`
  is still the subtitle file.
- **Format.** 1080×1920 native, 30 fps, 768 frames, 25.600 s.
- **Art.** The V3 test bay, robot, toy knife, apple, model hand and the V4 monitor graphic are reused.
  `v3/World3.tsx` changed only to export `CuttingBoard`.
- **On-screen text.** Captions plus the single "Cut the apple" request line. Nothing else was added.

## Timestamped changes (times in seconds)

| Time | Shot / change |
|---|---|
| 0.00–0.60 | **Hook.** Tight 3/4 slightly elevated view; fingers, thumb, apple sliver at the left. The blunt blade arrives on the palm at 0.30, presses 1–2 px (a small dent) and the fluid fires within the first 0.5 s. This is a shorter excerpt of the payoff, from the same pose and fluid functions. |
| 0.60–0.93 | **Reaction A** (0.33 s): brows rise, eyes widen, a small backward lean, and the hand tightens on the desk edge; the gaze is down-right toward the bench. |
| 0.93–2.53 | Eyeline cut back to the bench, with the arm lined up over the apple on "to cut an apple". |
| 2.53–3.60 | **Overhead / oblique view:** apple left, hand right, robot behind. The redirect starts on "One hidden trigger". |
| 3.60–5.33 | Lands low and tight over the intact hand on "hand instead" (a mechanical stop at 4.5). |
| 5.33–6.47 | **Cuff reveal** on "The hand was fake": molded cuff, mount, and the red effects line to its reservoir. |
| 6.47–7.93 | Along the knife grip on "knife was a toy" (grip sound at 7.12). |
| 7.93–9.80 | Pull out along the arm into the **wide lab view**, with the scientist standing at the workstation in the same room. |
| 9.80–10.37 | Joint circle → match cut to the software start node. |
| 10.37–11.90 | Software: teal path to the apple; the amber branch is planted on "planted". |
| 11.90–12.97 | **Over the shoulder** of the scientist at the monitor (replaces V4's zoom-out to an empty workstation). |
| 12.97–13.60 | **Eyes close-up** (0.63 s): the eyes track down the screen, then snap toward the bench → matched cut to the bench. |
| 13.60–14.50 | Both targets; the arm lines up over the apple. |
| 14.50–16.30 | Tighter view: one normal mimed stroke over the apple (apex 14.85, low 15.02, draw, recovery 15.5). The apple stays intact and there is no fluid. |
| 16.30–19.30 | "Cut the apple" request, the amber marker, the branch activating, and the target swapping to the hand icon on "switched" (18.84). Quicker than V4. |
| 19.30–19.70 | Hand icon → match cut to the real prop hand. |
| 19.70–20.10 | **Scientist notices** in the foreground; their gaze is computed every frame toward the blade's on-screen position. The arm starts only after the target change. |
| 20.10–20.43 | Wrist and joint movement on "The arm followed". |
| 20.43–21.70 | **Payoff**, tight 3/4 view: approach, contact at 20.78 with a slight press, a short mimed draw and recovery. One 7-frame jet; 7 droplets arc out under gravity and land in front of the mount between 21.39 and 21.52. The camera pans to keep the landing in view, and the marks hold for about 5 frames before the cut. |
| 21.70–22.00 | **Reaction C** (0.30 s): a tighter face, brows knitted, eyes on the bench. |
| 22.00–22.97 | The amber branch waiting, in the familiar software view, on "The trap was already there". |
| 22.97–25.60 | The scientist's eyeline to the bench (the marks are still there). The camera closes in, the arm winds up and starts the approach that continues into frame 0. |

The three reaction inserts total 1.27 s. The over-the-shoulder shot and the notice/watch foreground framings use the
same character, but they are part of the bench and monitor shots, not separate inserts.

**Fluid continuity.** The bench is clean from the opening through the payoff. The marks appear only when drops land at
21.39 s and persist to the end. The opening preview framing ends at about x 844, left of every landing (x 866–962),
so the cut from the last frame (marks visible) to frame 0 does not show the marks disappearing.

**Sound** (`tools/make_audio_v5.py`, cues in `audio/sfx_cues_v5.json`). Every effect sits under the unchanged voice:
- light plastic contact at 0.30 and 20.78;
- one restrained fluid cue at 20.79, with a softer copy at 0.31 for the preview;
- drops landing at 21.39;
- a short tension accent on each reaction (0.58, 21.68);
- the speed-driven servo, the grip, and the target-change accent.

There is no gore sound and no scream.

## QA on the final MP4

Measured (`qa/qa_v5_results.json`, `qa/motion_summary_v5.json`, `qa/asr_mp4_v5.json`):
- **Format.** H.264 High, BT.709, 30/1 fps, 768 frames, 25.600 s; AAC at 320 kb/s.
- **Loudness.** −15.0 LUFS integrated, −1.5 dBTP, LRA 4.2 LU. No clipped samples and no silent 100 ms window.
- **Voice vs. effects.** Voice to music 19.0 dB and voice to effects 13.8 dB during speech.
- **Picture.** No black segments, and no frozen segment of 1.5 s or longer.
- **Captions vs. audio.** Whisper transcribes 15/16 caption windows to their text. The one miss is the same window-edge
  case as in V3/V4 ("in the software…" heard as "Open the software…").
- **Rig, every frame:**
  - link-length error 0; elbow always above the shoulder;
  - blade at least 14 px above the apple stem;
  - over the palm, the blade presses at most 1 px, only on frames 7–14 and 621–628 (the designed contact); it
    otherwise stays clear, and never cuts through or splits the hand;
  - pose resets only at cuts (frames 18, 28, 489, 660, 689);
  - max joint step 7.7°/frame; peak gripper speed 1440 px/s;
  - loop wrap: blade speed 281 → 245 → 209 px/s (continuous).

Viewed (frames from the rendered MP4):
- the opening 0–1.4 s every 2–3 frames, including a close crop of the jet;
- the payoff from 20.0 to 22.3 s every 3 frames;
- a sheet every 9–12 frames from 2 s to the end;
- ±4-frame strips at every cut, plus 9-frame bursts (`qa/v5/strip_*.png`);
- the loop seam;
- 24 frames at phone size under a Shorts UI mask (`qa/v5/phone_ui_sheet.png`).

Defects found and fixed before the final render:
- The jet was hidden behind the gripper. The outlet was moved to the front of the palm seam and the jet is now drawn
  in front of the arm.
- The droplet arc was too flat. It is raised; the drops are then sped up with the same paths (gravity and velocities
  scaled together) so every drop lands while the shot is still on screen. Reaction C moved to 21.70 to leave about 5
  frames of aftermath.
- The jet read as a string of beads. The stream now tapers from the outlet and breaks into droplets only at its head.
- The scientist's desk hand was hidden behind the coat. The arm now hangs from the shoulder over the coat to the desk
  edge, so the grip is visible.
- Insert C was framed with the hand below the captions, in the Shorts UI zone. It is now a tighter face shot.
- Insert A started too neutral, and its hand sat under the captions. The startle is now already under way at the cut,
  and the insert is raised.

Known limits, judged acceptable:
- The cuff sits just outside the opening frame (it is seen at 5.3 s and in the payoff). Widening the opening to show it
  would bring the landing area into view and break the clean loop.
- The loop is a clean push-in cut rather than a seamless camera match. The arm's motion and the fluid state are
  continuous across it.

**Not performed.** There is no audio or video playback in this environment. Nobody has watched V5 at speed or listened
to the mix, the fluid cue or the loop seam. Stills and measurements do not establish perceived pacing, how the gag
lands, or whether the seam is inaudible; a person needs to confirm those before publishing.

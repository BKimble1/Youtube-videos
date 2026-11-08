# Dead Bird Drones V1: QA notes

Export: `exports/FGW_Dead_Bird_Drones_V1_REVIEW_1080x1920.mp4`. **This is a review cut, not an approved final.** It has
not been published.

## Measured on the delivered export

All numbers come from the file itself: `ffprobe`, `ffmpeg ebur128`, `tools/qa_render.py` and two speech recognisers.
The evidence is in `qa/v1/`.

| Check | Result |
|---|---|
| Container and video | H.264 yuv420p, BT.709, 1080×1920, 30 fps, 708 frames decoded, 23.60 s, 20.0 MB |
| Audio | AAC 48 kHz stereo, 23.60 s |
| Loudness | −13.5 LUFS integrated, −1.6 dBTP true peak. Voice sits at −16.5 LUFS inside the mix; music −43.6, effects −33.7, ambience −47.8 |
| Narration | Both recognisers (zipformer and whisper base.en) transcribe the export's own audio with **0 word errors** against `production/NARRATION_V2.txt` (`qa/v1/export_asr.json`) |
| Audio/picture sync | Cross-correlation of the export audio against the voice stem: **0 ms** offset |
| Captions | 20 captions, the narration word for word, 2–5 words each, one emphasis each. Each appears 0–1 frame before its first word, with no blank frame until the planned clear (`captions/FGW_Dead_Bird_Drones_V1.srt`) |
| Frame continuity | No unplanned large frame changes. All large changes fall inside planned transitions. Longest near-static run: 1 frame. Median frame-to-frame change 3.98 (`qa/v1/render_qa.json`) |
| Loop seam | Last frame against frame 0: difference 7.2, comparable to an ordinary frame step. Audio seam jump 0.005 |
| Top-left corner artefact (round-1 finding) | Checked on every frame: gone (see notes below) |

## What was inspected and how

- **Round 1.** I made a full-resolution export and reviewed it through five independent lenses: first-time viewer, finish quality, continuity, brief and science, and captions and sync. Two skeptics tried to refute every major or blocker finding. The confirmed findings were fixed in this cut (list below).
- **The final export.**
  - **Frame-level evidence:** the contact sheet every 0.5 s, the hook frame by frame (every 3rd frame from 0 to 2.5 s), the loop seam and 11 labelled transition strips (`qa/v1/strips/`).
  - **Phone-size check:** caption-free sheets (`qa/v1/nocap_*.png`).
  - **Checked by eye:** the cutaways, the close drive, both duck transitions and the loop.
- **Not done:**
  - Nobody watched or listened in real time. There is no audio playback here, so the mix is checked by measurement and recognition only.
  - The final export did not get a second independent five-lens review. The parallel fix agents and that review hit a usage limit, so the last round of checks is my own.

## Round-1 findings and what changed

**Blockers: fixed**
- **Meadow → pond (the drone "turned into" the duck).** The meadow camera now eases to a stop, so the drone and flock fly out of frame right before the water rises. The duck appears only after that.
- **Pond → sky (the duck's head landed on the drone's body).** The water crest is now an opaque band. The split view holds into the wipe, and the drone flies in from the left only after the crest has passed the duck. The two robots never share the screen.

**Majors: fixed**
- **Giant detached wing in both wing wipes.** Replaced by a background sweep on the downstroke: the drone itself is continuous and only the place changes. The lab's last framing is now the meadow's first, so the drone no longer jumps across the cut.
- **Ghost-copy strobing in those wipes.** Gone with the wipes.
- **Waterline dip was a 5-frame snap, then a snap back up before the crest wipe.** The dip now eases over about 0.6 s starting on "robot", and the split view holds to the wipe, so there is no rise.
- **Close drive never reached the rod-to-lever joint, and its highlight was out of step with the words.** The camera now goes gearbox → motor and pinion (highlighted on "the motor's spinning") → crank gear → up the rod to the lever, holds there, then pulls back on an ease. Every framing keeps the window between the caption band and the label.
- **The motor did not read as a motor.** It now shows its red and black leads and gets its own highlight. The mechanism pass was cut off partway, so this is only partly done.
- **Living birds left before the punchline.** The meadow and sky cameras now keep a fixed angle, so the flocks hold their places. Birds are spread out with no overlaps, two nearer birds fly beside the drone in the meadow, and the sky flock stays in frame through "might already be dead", clear of the caption.
- **Top-left corner rectangle in the opening and on the loop frames.** Fixed by the environment pass, which got as far as editing the fence. A remaining 5 px speck during the loop sweep is also gone: the swept layers now use masks instead of clip paths.
- **Faceted lab cutaway that grew from a pinhole.** Now a smooth round iris that appears at a readable size.
- **Opening cutaway held half-open with a jagged edge.** It now opens fully on one downstroke, with softer scallops.

**Minors: fixed**
- The shell lifts on "drones", which removes the dead time on the cradle.
- The opening no longer pushes in twice before the match cut. That removes a double zoom reversal and the cropped beak.
- The SCHEMATIC label stays up across each schematic stretch and is centred above the title band.
- The "less disturbance" arcs shrink from three to one but never disappear, so the picture shows less disturbance, not silence.
- Captions are top-anchored, so line 1 no longer jumps between one- and two-line captions. Two orphan-word captions are now single lines.
- The callback cutaway is open from "watching the birds" through "might already be", and closes on "dead".
- The drone's wingbeat sounds are muted while it is off screen.

## Known limitations (open for the next round)

The four module fix passes stopped at a usage limit partway through their work. What did not land:

- **Bird**
  - The near wing's root is still a fairly straight inked edge across the flank.
  - The edge-on near wing still flashes as a thin line for one frame per beat.
  - The lifted shell does not tip to show it is hollow; it still reads as a closed body, and the near wing is not ghosted over the frame.
  - The slot on the lifted shell is still a dark slit.
  - The cutaway window was not enlarged upward. The hinge and lever sit at the top rim, although the close drive now tilts up the rod to them.
- **Mechanism**
  - Gears B and A still overlap with little depth separation.
  - The far rod's end and the rod thickness were not reworked.
- **Duck**
  - During the dip, the underwater layer's lower edge shows a hard line for two or three frames (about 17.27–17.33 s).
  - The speculum is unchanged.
- **Depiction choices for owner review** (from the claim ledger)
  - The flyer is a generic brown bird.
  - The drive is a reconstruction.
  - The close-up runs in slow motion.
  - The duck's paddle drive is an illustrative assumption.

## Rebuild

See `README.md`. The export comes from `COMP=DeadBirdDronesV1 tools/render_resilient.sh mix_v1 <out.mp4>`, after the cue
export and `tools/make_audio.py mix_v1`.

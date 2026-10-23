# FGW Invisibility Shield V4: QA report

- **File:** `exports/FGW_Invisibility_Shield_V4_REVIEW_1080x1920.mp4`
- **Status:** review cut. **Not a final publish master. Not published.**
- **Basis:** every check below was run on the rendered MP4 (`qa/v4/review_qa.json`, `qa/v4/motion_scan.json`, `qa/v4/strips/`, `qa/v4/review_contact_sheet.png`, `qa/v4/review_phone_ui_sheet.png`), or on the animation data frame by frame (`qa/v4/rig_qa.json`).

## Not done

**Real-time playback.** Nobody watched or listened to V4 in real time. The environment has no display or speakers, so pacing and comic timing are judged only from frames, strips and measurements. This cut has no full editorial approval.

**Runway.** Three generations were run, but their outputs could not be downloaded here. The output host `dnznrvs05pmza.cloudfront.net` is refused by this environment's network policy. So none was inspected or composited: the film is 100% vector. Details, prompts, task IDs and slots are in `production/v4/RUNWAY_MANIFEST.md`. Shots that still need external generation and inspection: RW01 (lens macro light), RW02 (shield disappearance), RW03 (floating hand).

## Locked audio and script

| Check | Result |
|---|---|
| Narration | The approved recording `audio/narration/FGW_Invisibility_Shield_narration_final.wav`, sample for sample (gain only). The voice stem's correlation with the source is 1.0. |
| Picture/audio sync vs `mix_v4.wav` | offset 0.0 ms, correlation 0.99996 |
| Transcript of the MP4's own audio (Vosk small en-us) | WER 0.065 against `NARRATION_APPROVED.txt`. The three diffs ("raised this"/"raise the", "its"/"it's", "midair then"/"mid air than") are identical to V1–V3, so they are recogniser limits and not changes. |
| Captions | Words and timings unchanged (`data/timeline.json`). 19/21 ASR windows match; the 2 misses are the same recogniser diffs. |
| Duration | 29.269 s, 878 frames (unchanged) |

## Stream and loudness

| Property | Value |
|---|---|
| Video | H.264 High, 1080×1920 (native 9:16), 30/1 fps, 878 frames, yuv420p, BT.709 |
| GOP | max keyframe gap 0.5 s |
| Audio | AAC, 48 kHz, stereo, 317 kb/s |
| Loudness | −14.5 LUFS integrated, LRA 4.8, true peak −2.6 dBFS |
| Black segments, freezes of 1 s or more | none |
| Voice over the rest (phone band, while speaking) | 28.6 dB |

## Style consistency

- **Characters.** Both are Weird Crew construction throughout (see the notes for the cast decision). There are no 3D characters, no gradients on the figures, and no cylindrical shading.
- **Ink.** One ink colour (`#162A32`) on every figure. Outline weight grows gently with size, so close-ups stay clean.
- **Corridor.** Flat illustration planes with their own thinner ink. Nothing in the film is photographic.
- **Typography.** The only text is the narration captions: the channel treatment, in screen space, never inside the optics. There are no labels, bubbles, arrows, radial diagrams or rays.
- **Model sheets.** `production/v4/V4_model_sheet_turnaround.png` and `V4_model_sheet_expressions.png`.

## Motion

From the MP4, mean grey change per frame at 135×240 (`qa/v4/motion_scan.json`):

- **Over 1 s without progress:** none. No stretch falls below 0.5 mean change for half a second or more.
- **Quieter stretches:** two of about 0.5 s sit between 0.5 and 0.8.
  - 18.63–19.10 s: the start of the reach.
  - 25.47–25.97 s: the wave, which is small in frame.

  Both carry visible motion.
- **Spikes:** 26 frames spike against their neighbours. 25 of them are the planned cuts. The other is 22.567 s, one frame after the recoil cut: he hops back and the beam swings across. That spike is intended action, checked in the strip, and is not a pop.
- **Fixed in this pass:**
  - A full-frame flashlight blob at 0.07–0.13 s: the beam pool was landing just in front of the lens. The pool is now capped and fades near the camera.
  - A beam cone filling the frame when the light points at the lens: it now becomes a lens flare.
- **Holds:** no keyframe stops or eased full stops on the main actions. Hidden poses keep breathing, eyes keep moving, and cameras keep drifting slightly.
- **The macro hold (8.05–10.6 s)** was static in an earlier draft. It now drifts across the ribs, and her glances and blinks read in every rib at once.

## Anatomy (rig QA, every frame; `qa/v4/rig_qa.json`)

The check flags:

- any limb asked to reach further than it can (IK short);
- ankles through the floor;
- her head entering the panel while she hides.

The first pass found 228 frames, now fixed:

- Her low crouch pushed her head 30 u into the panel; the pelvis moved back.
- The carry hand during the run could not reach its grip.
- The panel swing at the stop arced too far out; it now swings in two stages, upright beside her and then set down.
- His two long creep-in steps were split, and the knees bend while stepping.
- His running pelvis was lowered.
- His prone arms pointed up; they now lie forward on the floor.
- The reach-around end point was pulled in.

Still flagged (21 frames, all brief):

- Guard getting up off the floor (0.63–0.90 s, up to 19.5 u ≈ 7 cm): his legs straighten slightly before his feet are under him.
- Her first frames of the bolt (28.30–28.43 s, up to 19.6 u): the right hand trails the panel's grip as she spins.
- Her pivot on the stop (1.67–1.70 s, 2 frames, 22 u), his steps at 14.17–14.20 s and 23.83–23.87 s (2 frames each, ≤ 10 u), and one frame of her bolt leg (28.57 s, 6 u).

## Transitions

The full list (outgoing → incoming → new information → keep/merge/remove) is in `production/v4/V4_ANIMATION_TRANSITION_NOTES.md`. Strips from the MP4 are in `qa/v4/strips/` (t01–t11). Frame stepping across every cut found:

- no one-frame resets;
- no mask popping in;
- no caption inheriting a camera transform.

The macro is reached and left by continuous focal change on the guard's line of sight.

## Science clarity (viewpoint dependence)

The same smear rule is drawn from every camera:

- **His line:** she is hidden, a faint wash of her colour remains, and the background turns into horizontal bands.
- **From behind her:** she is plainly there, and he is the one smeared through the panel.
- **From the side:** the panel is edge-on.
- **The macro:** each rib holds a squeezed, mirrored sliver of the corridor and of her face.

The pull back shows the slivers merging into a distorted outline and then a blurred patch.

The rib pitch is exaggerated (24 ribs across the panel) so the lenses can be seen. The fan angle (±48°) is a plausible value for a strong lenticular sheet, not a measurement of a product.

## Phone size and the loop

**Phone UI sheet** (`qa/v4/review_phone_ui_sheet.png`):

- Captions sit in the lower-middle band, clear of the bottom UI.
- Faces stay out of the caption band, except the herCU close-ups, where the caption crosses her shirt.

**Loop:**

- The last frame continues into frame 0, in the same tracking shot. The mean change from last frame to first is 6.93, against 5.7 and 4.87 between the preceding frames.
- The animation state at t = DUR equals t = 0 exactly: the pelvis gap is 0.000 m for both characters, and the footfall lists are shared.
- The only discontinuity is the first caption appearing at frame 0, as in V1–V3.

## Unresolved issues

1. **No real-time viewing** with sound. Comic timing, especially the cramped 24–28.3 s run of shots, is unjudged.
2. **No Runway material** (network block). The RW01–RW03 slots are empty.
3. **The ending is cramped:** 9 shots in 4.4 s. Each beat reads in stills, but the cadence needs a real-time look; merging pov5 and herCU is the first candidate.
4. **The lunge reads close to contact.** At the bolt (28.55–28.7 s) he dives past her on the near side and overlaps her in the side view before he falls; a viewer may read it as a grab.
5. **The panel is hard to see while carried** under her arm in the opening (it is mostly edge-on and camouflaged by its own optics). The swing at 1.6–2.2 s shows it clearly.
6. **The macro is abstract by nature** (squeezed slivers). It is honest optics and explained by the narration, but a first-time viewer may need the pull-back to understand it.
7. Small residual IK stretches listed above (≤ 7 cm, ≤ 9 frames each).
8. The first-person arms in the POV shots are simplified (forearm and hand only).

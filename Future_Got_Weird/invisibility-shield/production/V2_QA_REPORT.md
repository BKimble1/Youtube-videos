# Invisibility Shield V2: changes, shot list and QA (second review cut)

23 Oct 2026. **Review cut: not a final master, not published.** This cut was checked by measurement, by speech
recognition and by looking at decoded frames. Nobody has watched it in real time with sound.

## Deliverable

`exports/FGW_Invisibility_Shield_V2_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 878 frames, 29.27 s. H.264 High,
CRF 16, keyframe every 0.5 s, BT.709. AAC 320 kb/s, 48 kHz stereo. Captions are burned in.

There is no V2 4K master yet. The V1 4K command works for V2 with `--scale=2` and the V2 composition (see README).

## The narration is unchanged

The voice recording was not regenerated, edited, retimed or re-pitched.

- **Same file.** V2 reads `audio/narration/FGW_Invisibility_Shield_narration_final.wav`. Its last change is the V1
  commit (`git log` on the file).
  - sha256 `4d105e2cbf9d3f6cb37874a8e0d227c566c3c548476565a943c362dac89fdf60`
- **Same placement.** It is laid at 0 s with no edits and no resampling.
- **Same timing.** The picture is keyed to the same measured word timeline (`source/src/data/timeline.json`,
  untouched since V1).
- **Only its level changes.** In the mix the voice stem is the source multiplied by one constant gain. The
  correlation with the source is 1.000000 (`audio/mix/mix_measure_v2.json`).
- **The MP4 carries that mix.** The MP4's decoded audio matches `mix_v2.wav` at 0.0 ms offset (see QA results).
- **Captions.** The 21 caption phrases and their show/hide times are the V1 ones, so
  `captions/FGW_Invisibility_Shield_V1.srt` applies to V2 unchanged. V2 restyles them and moves them per shot: high
  when the action is low in frame, otherwise centred at 1490–1500 px, clear of the Shorts bottom UI.

## What changed from V1

**The world.** One 3D research corridor, in metres. Every shot is a pinhole camera in it, so geography holds across
cuts. The corridor has:
- ceiling light panels;
- a sliding lab door at the far end with a blinking red indicator;
- side doors with red indicators;
- an amber guide strip and teal floor light;
- glass lab windows with lit interiors, glass tint and reflections;
- a side doorway she enters and leaves by;
- floor reflections and depth fog.

**The characters.** Both are posable 3D skeletons with two-bone IK limbs, gaits and 3D-placed facial features
(`qa/v2/model_sheet.png`). One model is used throughout for each character, at fixed dimensions.
- **Her:** about 25, short messy dark hair with a swept fringe, a teal jacket with a zip over a coral undershirt, dark
  fitted trousers, white trainers. Expressive brows and lids. Her expressions run sneak → startle → focus → hold →
  wince → mischief → grin.
- **The guard:** navy uniform, cap with badge, chest badge, radio, belt, a torch whose beam sweeps the corridor and
  pools on the surfaces it hits. He walks, stops, squints, leans in, freezes, tilts his head, steps back, raises a
  hand, flinches and is startled.

**The shield.**
- It is the same rigid flat panel as V1: 0.74 × 1.12 m, vertical lenticules, two grips. Its dimensions are constant
  in every shot.
- Its optics depend on each camera's horizontal angle to the panel's normal, because vertical lenticules only
  redirect light across the panel:
  - **On the guard's line:** the corridor behind it is smeared along the lens axis and she reduces to a faint spread
    patch.
  - **Off-axis:** the smear weakens and she shows through, distorted. The side shots use this to show she is still
    there.
  - **From behind (her side):** it is a clear slab.
- It stays visible as an object: rim, edge thickness when oblique, lens ridges, torch glints.

**The lens close-up.** One continuous push from his view to 2.4 cm from the surface. The lenticules are shaded as
cylinders in panel space with a highlight travelling across the array. The camera then orbits over the cut edge into
the section, rises to a top view of the simplified light paths, and cranes back down behind the guard.

**Sound.** `tools/make_audio_v2.py`, synthesised, no samples. A restrained bed sits about 14 LU under the voice, plus
the effects below. Each effect is placed from the picture's own timeline (`tools/export_cues_v2.ts`); the full list is
in `audio/sfx_cues_v2.json`.
- His boot steps and her quick steps on each heel strike, levelled by the camera's distance.
- Torch sweeps.
- Shield swing, settle, grip adjust, lowering and set-aside.
- An optical shimmer as she vanishes in his view, and a softer one as her outline melts.
- The push onto the lenses, the section fold and the warm and cool light-path sweeps.
- The floating hand's accent and finger flutter.
- His freeze and his flinch.
- The reaction accent on "reveal".
- The dash.

## Shot list (times in seconds, cut points from `source/src/v2/story.ts`)

| Shot | In–out | Narration | Picture |
|---|---|---|---|
| s1 | 0.00–1.55 | If you raised this shield, | She slips round the corner toward camera, the torch sweeping past. A push to her startled eyes. She spins, crouches and swings the shield round between her and the guard far down the corridor. |
| s2 | 1.55–3.10 | someone looking straight at you could | Over the guard's shoulder: the panel down the corridor, her outline melting into smeared corridor. |
| s3 | 3.10–3.95 | watch your body disappear. | Side view: she is crouched right there behind the panel; the guard approaches beyond it. |
| s4 | 3.95–4.70 | (pause) | The guard close: he stops, squints, leans in. |
| s5 | 4.70–8.30 | You see, its surface is covered in tiny lenses. They | His view, then one continuous push into the surface until the lenticules fill the frame, with the highlight travelling. |
| s6 | 8.30–13.95 | spread the light … where you're standing. | Orbit over the cut edge into the lens cross-section. Her light reaches the lenses and fans sideways. The camera rises to the top view; corridor light crosses to the guard's eye. Labelled "TOP VIEW · SIMPLIFIED LIGHT PATHS". |
| s7 | 13.95–15.30 | From the right position, your | Crane down from the plan to behind the guard. |
| s8 | 15.30–16.40 | outline disappears | Her profile just past the panel's edge, tense, adjusting her grip. The camera drifts toward the lens side until the smear crosses her face. |
| s9 | 16.40–18.50 | into a blurred patch of scenery. | Behind the guard as he leans in close. The camera arcs onto his line and the outline melts away. |
| s10 | 18.50–20.90 | So you could reach one hand around the edge | Side view: her real arm going round the panel's edge. |
| s11 | 20.90–21.85 | and make it look like a hand | His view: a hand beside the panel, nobody attached. |
| s12 | 21.85–22.70 | is floating | Reverse: he freezes, eyes wide, tilts his head, steps back, starts to raise his hand. |
| s13 | 22.70–23.90 | in midair. | From behind his shoulder, on his line: his raised hand in the foreground, the floating hand beyond. Its fingers ripple; he snatches his hand back. |
| s14 | 23.90–25.32 | Then lower the shield | Three-quarter two-shot across the corridor: she stands and swings the panel aside. |
| s15 | 25.32–26.39 | and reveal you were standing | Close on him: the jolt, eyes wide, the torch jerking up. |
| s16 | 26.39–27.41 | right in front of them | Over his shoulder: she is right there, grinning, with a little wave. |
| s17 | 27.41–29.27 | the entire time. | Two-shot push. She dashes for the side doorway, the camera whipping after her. The film loops to s1, where she comes out of that doorway. |

The brief's beat windows map onto these shots as follows.

| Brief window | Shots |
|---|---|
| 0–2 | s1 |
| 2–6 | s2–s5 start |
| 6–9 | s5 end, s6 start |
| 9–14 | s6 |
| 14–19 | s7–s9 |
| 19–24 | s10–s13 |
| 24–29.27 | s14–s17 |

## Problems found in V2 development and fixed

These were found by inspecting rendered stills and the MP4, then fixed in source. Each was re-checked on new frames.

**Washed-out frames (2.4, 21.4, 24.6–27 s).**
- Cause 1: polygons clipped at the 4 mm near plane projected to coordinates around ±900,000 px, which Chrome
  mis-fills. Fix: a screen guard band in `projPoly`.
- Cause 2: a window-frame stroke whose width was computed at a point beside the camera came out about 459,000 px
  wide. Fix: capped frame widths.
- Both were found by rasterising the corridor layer alone and removing one path at a time.

**Lens close-up showed one white bar instead of lenses.**
- Cause: the gradient axis sat at the panel's top edge, about 31,000 px off-screen.
- After re-anchoring, screen-space gradients cut across the strips once perspective converged them.
- Fix: the lenses are now shaded as sub-strips in panel space, and the rim width is capped.

**Reveal framing.** Both faces were too small, and the guard's head was cut off at the frame edge. Fix: the reveal is
now four shots (s14–s17), with a close-up for each reaction and two-shots for the proximity.

**s8.** Her face was hidden behind the panel. Fix: a new camera keeps her profile past the edge, then drifts so the
smear crosses her face on "your outline disappears".

**s13.**
- The guard's hand was out of frame: the camera sat in front of his shoulder.
- He also cannot reach the floating hand, which is 1.6 m away.
- Fix: the camera sits behind his shoulder and on his line, so the two hands read in depth and the panel still hides
  her.

**Guard gliding.** He slid during short repositioning moves, and his walk stopped for a moment at 13.9 s, where two
walk segments met. Fix: creeping steps on those moves and one merged walk segment.

**Torch pool popped at 1.40 s.** The pool jumped from the wall to the panel as the beam crossed the panel's edge
(found in the MP4 motion scan). Fix: the pool cross-fades over a soft band at the panel's edge, using the panel's real
in-plane axes.

**Section handover jump at 9.17 s.** The orbit stopped 0.02 rad short of overhead before the rise took over (found in
the MP4 motion scan). Fix: the orbit now ends exactly overhead.

**Captions too low.** Their centres were at 1560–1640 px, into the Shorts bottom UI zone. Fix: raised to 1490–1500 px,
as V1.

**Loop remap teleported the guard.** Fix: removed. The loop is now a motivated cut: she exits by the side doorway and
re-enters from it.

## QA results (from the final MP4)

All values below are from decoding the rendered MP4 (`qa/v2/review_qa.json`, `qa/v2/motion_scan.json`), not from
the source.

**Video stream.**
- h264 High, 1080×1920, 30/1 fps, 878 frames, 29.269 s.
- yuv420p, BT.709 primaries, transfer and matrix.
- Keyframes: 66, the largest gap 0.5 s.

**Audio stream.** AAC 48000 Hz, 2 channels, 317 kb/s.

**Loudness (ffmpeg ebur128).**
- Integrated -14.6 LUFS, LRA 4.8 LU, true peak -2.5 dBFS.
- The voice sits 28.5 dB above the music and effects in the 400–5000 Hz phone band while
  speaking (mix measurement).

**Audio identity and sync.**
- The MP4's audio against `mix_v2.wav`: offset 0.0 ms, correlation 0.99997.
- The voice stem inside the mix against the source narration: correlation 1.0, i.e. gain only.
- So the approved recording is in the MP4, unaltered and in sync.

**Narration transcript (Vosk, free recognition of the MP4's own audio, no script given).**
- WER 0.065 against `NARRATION_APPROVED.txt`.
- The differences are "raised this" heard as "raise the", "its" as "it's", and "midair then" as "mid air than".
- These are exactly the three differences the V1 review cut gave on the same recording.

**Captions.**
- 19/21 caption windows contain the recognised words.
- The two misses are those same ASR differences: "raise the" in cue 1, and "mid air" in cue 17.
- Caption text and timings are the V1 ones.

**Black and frozen frames.** Black segments: 0. Freezes of 1 s or more: 0.

**Motion.**
- Mean frame-to-frame change: 4.46 (grey, 135×240).
- 16 spikes, every one at a planned cut. No pops between cuts.
- The torch-pool pop at 1.40 s and the section jump at 9.17 s, both found in the first render's scan, are gone.
- The quietest stretches are the plan view (10.1 s and 13.1 s). The guard is walking and the light pulses are
  travelling there, so they are not static holds.

**Loop seam.**
- Last to first frame: mean absolute change 25.87. Consecutive frames just before the seam: 1.27 and 0.88.
- So the loop is a cut, motivated by the action: she dashes into the side doorway and the film restarts with her
  coming out of it. It is not a seamless match.

**Sound effects.** 77 placed effects (`audio/sfx_cues_v2.json`), for example:
- the guard's boot steps on his heel strikes;
- an optical shimmer at 1.67 s as she vanishes in his view;
- the reaction accent at 25.36 s.

**Frame inspection.** I looked at these decoded frames:
- a contact sheet of 32 frames (`qa/v2/review_contact_sheet.png`);
- a phone-size sheet of 30 frames with an approximate Shorts UI mask (`qa/v2/review_phone_ui_sheet.png`);
- frame strips across the torch pool, the section handover, the reveal and the loop end (`qa/v2/strips/`).

What they show:
- her and the guard on model in every shot;
- the shield at constant size;
- captions clear of the top and bottom UI bands;
- faces readable in s1, s4, s12, s15 and s16.

## Known limitations

- **No real-time viewing.** Nobody has watched this cut in real time with sound. All checks are measurements and
  stills.
- **Look.** The characters are stylised vector 3D, not photoreal.
  - Hands use the V1/Death Clock hand rig.
  - Hair is a stylised mass. It does not simulate strands.
- **Physics shortcuts.**
  - The section's light paths are simplified and labelled as such.
  - The off-axis view keeps the V1 optics model: a smear plus a spread residual, a drawn approximation rather than a
    ray-traced one.
- **Loop seam.** The loop is a cut from the dash to the corner, not a seamless match.
- **ASR.** Vosk mishears "raised this" as "raise the" and splits "midair". These are the same three differences V1
  showed on the same recording (V1 report), not narration changes.
- **Effects audibility.** Effect levels were set by measurement and the effect list, not by listening on phone
  speakers.
- **No 4K master yet.** V2 has no 4K master; one is not part of this review step.

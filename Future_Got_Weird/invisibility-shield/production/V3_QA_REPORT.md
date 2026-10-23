# Invisibility Shield V3: reconstruction notes and QA (third review cut)

23 Oct 2026. **Review cut: not the final publish master, not published.**

It was checked by:
- measurement of the MP4;
- a per-frame rig check of every pose the source produces;
- speech recognition on the MP4's own audio;
- looking at decoded frames.

Nobody has watched it in real time with sound.

## Deliverable

`exports/FGW_Invisibility_Shield_V3_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 878 frames, 29.27 s. H.264 High,
CRF 16, keyframe every 0.5 s, BT.709. AAC 320 kb/s, 48 kHz stereo. Captions are burned in.

The source is `source/src/v3/` (composition `InvisibilityShieldV3`). V1 and V2 still build unchanged from their own
folders.

## The narration is unchanged

- **Same file, same placement, same timing.**
  - `audio/narration/FGW_Invisibility_Shield_narration_final.wav`, untouched since the V1 commit.
  - It is laid at 0 s with no edits.
- **Same word timeline.** The picture is keyed to the same timeline (`source/src/data/timeline.json`), so the
  captions keep their words and times; the V1 SRT still applies.
- **Gain only.** In the V3 mix the voice stem is the source times one constant gain (correlation 1.000000,
  `audio/mix/mix_measure_v3.json`).

## What was wrong with V2 (audit, from V2's own frames)

Evidence: `qa/v3/v2_audit/` (spin and crouch, guard lean, reach, stand and lower).

**Motion.**
- Every motion channel was keyed with an ease-in/ease-out per segment, so everything came to rest at every key: the
  "slideshow of key poses" look.
- Feet slid along a sine wave under a moving pelvis. Nothing ever planted.

**Anatomy.**
- Shoes were pill shapes always pointing along the body, not where the foot pointed.
- Arms were sorted as one piece against the torso, so a forearm crossing the body could vanish into the chest.
- Elbow poles were not anatomical.
- The guard's arms hung stiff from boxy shoulders; his torch arm was the only one that moved.

**Staging.**
- The shield appeared in frame instead of being raised: her turn happened mostly off-screen.
- Fourteen cuts: shot / reverse-shot, with the guard staring at the camera.

**Graphics.** The plan view sat on one composition with a "TOP VIEW · SIMPLIFIED LIGHT PATHS" pill label and arrowheads.

**Ending.** She simply walked out of a side door; the loop was a hard reset.

## What V3 does instead

### Rigs (`v3/Person3.tsx`, `v3/HeadV3.tsx`)

Both characters are one articulated hierarchy:

    pelvis -> lumbar -> thorax -> neck -> head
                          thorax -> shoulder (shrug) -> upper arm -> elbow -> forearm -> wrist -> hand
    pelvis -> hip -> thigh -> knee -> shin -> ankle -> shoe

- **Legs.** Two-bone IK, with each knee's pole along its own foot's heading, so the knee always tracks over the toes.
- **Arms.**
  - Held arms reach their targets by IK, with an anatomical elbow pole (back, down, out).
  - Hands are pushed out of the chest volume.
  - Free arms use forward kinematics: the shoulder swings against the opposite leg and the elbow flexes (about 90°
    when running).
- **Pelvis.** Its height is limited by what the planted legs can actually reach (a smooth minimum, with weights that
  fade continuously through each step), so bodies drop into braces and crouches and never stretch.
- **Spine.** Two segments, so the back bends rather than tipping as one stick.
- **Head.** It holds an absolute heading and pitch, so the eyes stay on their target while the body bends.
- **Drawing.**
  - The torso is three convex hulls, the top one including deltoid caps, so the arms hang from defined shoulders.
  - Every limb is two separately depth-sorted segments.
  - The shoe is a 3D sole, heel, toe box and collar that turns and pitches with its foot.
- **Secondary motion.** Hair trails the head's turning and lifts with the stride; the jacket hem lags the body's motion.
- **The guard.**
  - He is more realistically proportioned: about 1.82 m, a smaller head, a tapered torso.
  - He has a convincing two-handed vocabulary: the torch held in a closed grip pointing where he looks, a hesitant
    reach, a cap scratch, a reach to the cuff pouch on his left hip.
  - The torch never changes hands.

Model sheets (five poses × front / three-quarter / side / rear):
- `production/v3/V3_model_sheet_woman.png` (stand, run, crouch with grips, reach, turn);
- `production/v3/V3_model_sheet_guard.png` (stand with torch, walk, lean in, reach, cuffs open);
- `production/v3/V3_head_turnaround_woman.png`.

### Feet and motion (`v3/gait.ts`, `v3/stepper.ts`, `v3/spline.ts`)

**Feet.**
- A planted foot stays exactly where it was put. Its heel peels before lift-off (much further for a sprint).
- It swings on a cycloid arc (zero speed at lift-off and landing) and lands toe-up.
- Steps are simulated once from each body's path: a foot steps when the body has drifted off it, and lands where the
  body is heading.
- The run gets flight phases. Special steps are written by hand: her brace, her pivot on the ball of the foot, the
  step round into the crouch, the nervous shuffle and the stand.

**Curves.** Every channel is a monotone cubic spline (C1). A move only comes to rest where it really holds or turns
back, and nothing overshoots.

### One place (`v3/Corridor3.tsx`, `production/v3/V3_blocking_map.png`)

- **The corridor.** One research corridor, built from 3.89 m modules:
  - a door with a red security indicator on the left wall;
  - a glass lab window with a lit interior on the right wall;
  - two ceiling light panels per module;
  - the amber stripe and teal floor lights running through.
- **The landmark.** The sealed lab door closes the end she flees toward.
- **The blocking map.** Drawn from the film's own functions:
  - her path, the guard's path, the shield;
  - every camera position and view direction every 0.25 s;
  - the line of action, with every camera on its +x side.
  - So her left/right and his never flip.

### Story and cameras (`v3/story3.ts`, `v3/FilmV3.tsx`)

Six camera passages (V2 had seventeen shots), with only three hard cuts. Several are long takes containing many beats.

| Shot | In–out | What happens |
|---|---|---|
| A | 0.00–3.10 | Tracking ahead of her as she flees, looking back over her shoulder, the guard jogging behind with his torch on her. She brakes on a planted brace foot, pivots to her right on its ball, and swings the shield (in her right hand) through the guard's side into place. Her left hand takes the second grip and she sinks into a crouch. The camera swings round behind her shoulder so he is lined up beyond the panel. |
| B | 3.10–18.50 | One take: <ol><li>Over his shoulder: he brakes and stops; the camera drifts onto his line and her outline melts into the smear ("disappear"). He hooks his cuffs on his belt, leans in, sweeps the torch.</li><li>The camera glides past him round the panel's edge: she is crouched there, distorted. Then back onto his line, where she melts again.</li><li>Straight into the lens surface until the lenticules fill the frame, a highlight travelling across them.</li><li>Over the cut edge of the lens (the panel above it slices away), rising into an oblique cross-section of the real scene. Her light reaches the lenses and fans sideways; light from the corridor behind and beside her passes her, enters the lenses in front of her and bends across to his eye; a faint remainder still reaches him.</li><li>Back down to the lens, out through it along his line and over his shoulder.</li><li>With him as he creeps closer (the torch over the panel); round to the side for both of them: her nervous shuffle, his squint, his puzzled cap-scratch.</li></ol> |
| E | 18.50–20.75 | Behind her: her shoulder turns, upper arm, elbow, forearm round the edge, the wrist rotates, the fingers open. He is visible through the clear back of the panel. |
| F | 20.75–21.35 | His view: a hand beside the panel, nobody attached. |
| G | 21.35–27.95 | One take, arcing from his shoulder to the side. His reactions: eyes, brows, head back, shoulders up, the torch dipping, weight back. His hesitant reach, a stall, the fingers ripple, he snatches his hand back. She stands and lowers the shield to her left side: revealed right in front of him. He freezes, looks from the shield to her face, and realises (brows down); her mischievous grin and a small wave. His hand goes to the pouch: cuffs out, the jaw flicked open with a click. She is alarmed. |
| H | 27.95–29.27 | She turns left, takes the shield in her right hand mid-turn and bolts. He lunges, misses and gives chase. The camera swoops round into the chase framing, which is shot A's opening framing. |

**The loop.**
- The run at the end continues into the opening, one corridor period (7.78 m) further along. The positions,
  velocities, footstep schedule, gaze, shield carry, torch aim and camera relationship are all the same functions on
  either side of the seam.
- The corridor repeats exactly over that distance, and its indicator blinks complete whole cycles over 29.27 s.
- The guard still carries the open cuffs as the film restarts. He hooks them on his belt once he stops (4.98 s) and
  draws them again at the end.

**No infographic elements.**
- The only typography is the narration captions, in the V2 caption style.
- The light paths are plain glowing rays with travelling pulses: no arrowheads, labels or callouts.
- The wall sign above the lab door has no legible text.

### Sound (`tools/make_audio_v3.py`, `audio/sfx_cues_v3.json`)

The V2 loop-continuous bed, plus 75 effects placed from the V3 picture:
- every foot landing of both characters (her trainers, his boots), levelled by the camera's distance;
- her pivot squeak, the shield swing and grip, a soft activation shimmer as she vanishes in his view;
- the glassy texture of the lens close-up, the light sweeps of the section;
- the sleeve of the reach, the hand's accent, a small comic accent on his shock, his recoil;
- the lowering, a low accent on "reveal", the cuffs drawn and the ratchet click, the bolt.

## QA results

**Rig and motion check** (`tools/rig_qa_v3.ts` → `qa/v3/rig_qa.json`). Every one of the 878 frames, both
characters, from the source's own pose functions.

Anatomy: no frame flags any of these:
- a knee not tracking over its foot;
- an elbow pointing forward into the chest;
- an elbow or wrist inside the torso (this check was fixed in the hand-off);
- a foot below the floor.

The one remaining flag: a sprinting push-off foot 11 cm short of its plant on a single frame (28.93 s), just before it
lifts.

The jerk check covers joint and camera accelerations inside shots:
- **Found and fixed:** pelvis snaps when feet changed between contact and swing, a braking sequence with
  overlapping steps, an elbow flip in the cap-scratch, and camera paths through her arms and the guard's back.
- **Remaining:** running knees and ankles (impact accelerations at landings, as they should be) and the camera's
  intended accelerations into and out of moves.

**Decoded MP4** (`qa/v3/review_qa.json`, `qa/v3/motion_scan.json`).
- **Video stream.**
  - h264 High, 1080×1920, 30/1 fps, 878 frames, 29.269 s.
  - yuv420p, BT.709.
  - Keyframes: 60, the largest gap 0.5 s.
- **Audio stream.** AAC 48000 Hz, 2 channels.
- **Loudness.** -14.6 LUFS integrated, LRA 4.8 LU, true peak -2.5 dBFS. The voice sits 28.6 dB above the rest in the phone band.
- **Audio identity.**
  - The MP4 matches `mix_v3.wav` at 0.0 ms offset, correlation 0.99996.
  - The voice stem matches the source narration at correlation 1.0.
- **Narration recognition** (Vosk on the MP4's own audio).
  - WER 0.065.
  - The differences ("raised this" heard as "raise the", "its"/"it's", "mid air") are the same three as V1 and V2 on the
    same recording.
  - 19/21 caption windows hold their words; the two misses are those same mishearings.
- **Black and frozen frames.** Black: 0. Freezes of 1 s or more: 0.
- **Cuts and jerks.**
  - Frame-to-frame change averages 5.73.
  - 3 spikes, exactly the three hard cuts (3.10, 18.50, 20.75 s). F→G and G→H are continuous moves.
  - Spikes found in the first full render were removed by the fixes above. They were at 9.73 s and 10.5 s (a camera
    path through her arms; a figure partly behind the camera) and 14.67 s (the pull-back through the guard).
- **Holds.** The only near-still moments are 0.33 s at 20.43 s (the hand held out at full extension) and 0.37 s at
  22.63 s (his hesitation before reaching on). Both are intended performance beats.
- **Loop seam.** Last frame to first: mean absolute change 8.27, against
  5.44 and 5.9 between consecutive frames
  just before it.
  - The seam is no bigger a change than a normal frame step in this moving shot.
  - `qa/v3/strips/loop_seam.png` shows the last 1.5 s running into the first 1.5 s.
- **Typography.** I checked the 32-frame contact sheet (`qa/v3/review_contact_sheet.png`) and the phone sheet with an
  approximate Shorts UI mask (`qa/v3/review_phone_ui_sheet.png`). Only the narration captions appear: no callouts,
  pills, bubbles, arrows or headings. The captions sit clear of the UI bands.

**Editorial check** (against the brief's section G, by inspecting frames, not by real-time viewing).
- **Continuous animation.** The crouch, stand, turn, reach and run are animated through, with no pose swaps.
- **Anatomy.** Within the stylised look, the joints are coherent in the model sheets and in every frame of the rig
  check.
- **Transitions.** Smoother than V2: 3 cuts instead of 16, and the 3 moving-camera hand-offs are continuous.
- **Clarity without sound.** The picture carries the story: she hides from him, the shield hides her only from his
  line, he sees only a hand, she lowers it, he reaches for his cuffs, she runs.
- **The optics.** Explained by light in the real scene, not by labels.
- **The ending.** A new payoff (the cuffs) flows into the opening.

## Known limitations

- **No real-time viewing.** Nobody has watched this cut in real time with sound. All checks are measurements and
  inspection of stills.
- **Stylised characters.**
  - They are vector-drawn 3D rigs, not photoreal.
  - Hands are the flat V1 hand rig rotated in screen space, so a hand pointing straight at the camera foreshortens
    only partly.
  - Faces are small in the wide two-shots.
- **Section transition.** The first second of the rise off the cut is abstract: mostly the clear cut face and the
  lenses, while the room fades in.
- **Sprint push-off.** On one frame of the bolt (28.93 s) a pushing-off foot is 11 cm short of its plant just before
  it lifts (IK reach limit). Listed in `qa/v3/rig_qa.json`.
- **Simplified optics.** The section's light paths are simplified, though direction-dependent. The off-axis optics are
  the V2 smear-and-residual model, not ray tracing.
- **Audibility untested.** Effect levels were set by measurement, not by listening on phone speakers.

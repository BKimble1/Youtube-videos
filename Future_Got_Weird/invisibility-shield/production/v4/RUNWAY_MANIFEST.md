# FGW Invisibility Shield V4: Runway asset manifest

Status in this build: **no Runway output is composited into the V4 review render.** Every frame of
`exports/FGW_Invisibility_Shield_V4_REVIEW_1080x1920.mp4` is the Remotion vector animation.

## What was done in Runway

- Workspace: Blake Kimble personal workspace. `whoami` succeeded with 817 credits before V4. Three generations cost 270 credits, leaving 547 afterwards.
- Reference images were rendered from our own V4 vector art, and four were uploaded through the Runway upload API. No third-party or unrelated imagery was used.
- Three image-to-video generations were started and completed on Runway's side.

### Why nothing was composited

The finished clips are served from `dnznrvs05pmza.cloudfront.net`. This cloud environment's network policy refuses that host: the proxy answered 403 to CONNECT. The uploaded-asset host `d2jqrm6oza8nb6.cloudfront.net` is refused too.

As a result:

- The clips could not be downloaded into the render environment.
- They were not inspected frame by frame.
- They were not accepted, rejected on content, or composited.

The only thing visible here was the single thumbnail frame Runway's task API returns. That is not an inspection, and no quality judgement is made from it.

To use them, add `dnznrvs05pmza.cloudfront.net` under Allowed domains in the environment's network settings (https://code.claude.com/docs/en/cloud-environments#network-access), or download the clips from the Runway web app. Then follow "Clip-replacement slots" below.

The signed output links expire about 30 hours after generation (around 2026-10-24 23:00 UTC). After that, the clips stay in the Runway workspace under the task IDs below.

## Reference images (locked designs, ours)

All are in `production/v4/runway/references/`.

| File | What it locks | Uploaded |
|---|---|---|
| `ref_protagonist_person_turnaround.png` | The Video 01 Crew "person" in front, 3/4, profile, 3/4 back, back and 3/4 left | no (reference only) |
| `ref_protagonist_actions.png` | Run, look-back, crouch (side and front), reach-around | no |
| `ref_guard_turnaround.png` | The Crew-built guard in the same six views | no |
| `ref_hallway_plate_pov.png` | The corridor from the guard's eye line, with no characters | no |
| `ref_shield_concealing_pov.png` | The panel concealing her (POV, t 4.0 s) | yes (RW02 end frame) |
| `ref_optical_closeup_macro.png` | The lens macro (t 9.0 s): her face slivers in every rib | yes (RW01 start frame) |
| `frame_t3.00_start_crouch.png` | POV with her head above the panel (t 3.0 s) | yes (RW02 start frame) |
| `frame_t21.90_floating_hand_pov.png` | POV with the floating hand at the panel edge (t 21.9 s) | yes (RW03 start frame) |
| `frame_t2.60_her_above_panel.png` | POV standing behind the panel | no |

## Generations

| Slot | Task ID | Model | Input | Output (signed link, blocked here) | Credits | Decision |
|---|---|---|---|---|---|---|
| RW01 lens macro (light only) | `60034f89-90bd-44f5-804b-62915ee6681a` | Gen-4.5, 5 s, 720x1280 | start frame `ref_optical_closeup_macro.png` | `https://dnznrvs05pmza.cloudfront.net/cfa0c570-60ad-41f3-8b7e-6cf0cd930600.mp4` (+ `_jwt` from task) | 60 | **not inspected, not used** |
| RW02 shield disappearance | `c514a82b-046c-48b0-92e3-4862c616d330` | Seedance 2.0, 5 s, 720p, start + end frame | `frame_t3.00_start_crouch.png` to `ref_shield_concealing_pov.png` | `https://dnznrvs05pmza.cloudfront.net/seedance_2/cgt-20261024004730-cj8pq/…mp4` | 150 | **not inspected, not used** |
| RW03 floating hand | `41e2c61b-9a16-4b74-8b4d-3f466bbdb1fd` | Gen-4.5, 5 s, 720x1280 | start frame `frame_t21.90_floating_hand_pov.png` | `https://dnznrvs05pmza.cloudfront.net/7c7ef906-77c1-40f8-a386-3fc90053d857.mp4` | 60 | **not inspected, not used** |

No Act-Two or Edit Studio (Aleph) pass was run. There was no performance footage to drive Act-Two, and no global restyle was wanted.

### Exact prompts

**RW01** (Gen-4.5, image to video, 9:16, 5 s):

> Locked-off static camera, no camera movement. A flat 2D vector illustration of vertical clear ribbed glass lenses. Animate only the light: soft warm flashlight glints slowly slide down along the glass ribs and a faint shimmer travels sideways across the ridges. Every shape, ink line, colour and stripe stays exactly in place. No new objects, no people, no text, no morphing, no flicker.

**RW02** (Seedance 2.0, start and end frame, 9:16, 720p, 5 s):

> Flat 2D vector cartoon with clean ink outlines, locked-off camera, no camera move. The red-brown-haired woman standing behind the clear ribbed glass panel in the corridor slowly crouches straight down behind it until she is hidden. Seen through the ribbed panel her body is only a faint sideways smear of the corridor colours. Keep the corridor, the panel, its frame and the flashlight beam fixed in place. No new objects, no extra people, no text, no morphing.

**RW03** (Gen-4.5, image to video, 9:16, 5 s):

> Flat 2D vector cartoon with clean ink outlines, locked-off camera, no camera move. Beside the edge of the clear ribbed glass panel, the small cartoon hand with four fingers and a thumb gives a slow playful finger wiggle, then slips back behind the panel's edge. The guard's hand in the lower right corner reaches slightly toward it. Keep the corridor, panel and beam fixed. No new objects, no extra hands, no text, no morphing.

## Clip-replacement slots

The slots are defined in `source/src/v4/Clips4.tsx` (`CLIP_SLOTS`). They are composited above the vector picture and below the captions, so no Runway text can reach the film.

| Slot | Film time | Blend / opacity | Clip offset | Intended use |
|---|---|---|---|---|
| RW01 | 8.05–10.60 s (macro hold) | screen, 0.30 | 0.4 s | Highlights only; the vector ribs and her face slivers stay underneath |
| RW02 | 2.95–4.42 s (POV sink) | normal, 1.0 | 0 | Replaces the POV sink only if her design and the panel stay locked |
| RW03 | 20.05–20.90 s (POV hand) | normal, 1.0 | 0 | Replaces the hand beat only if the hand stays on-model |

To activate a slot:

1. Conform the clip to 1080x1920 at 30 fps. Runway's output is 720x1280 at 24 fps, so upscale and retime with frame blending off:
   `ffmpeg -i in.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30" -an -c:v libx264 -crf 14 out.mp4`
2. Put the conformed clip in `source/public/runway/`.
3. Set `src` on the slot and re-render.

Keep the raw clip next to the conformed one in `production/v4/runway/clips/`.

### Acceptance checks for each clip (none has been run yet)

Step through the clip at 30 fps and reject it on any of the following:

- morphing of her face, hair or the guard's cap;
- a limb or finger added or lost (the Crew hand is four fingers and a thumb);
- line boil, or ink lines that flicker or change weight;
- the corridor or panel sliding or redrawing;
- an appearing object, or any text or logo;
- a colour shift off the Crew palette.

Then cut the accepted range in against the vector frames before and after it, and check the joins frame by frame.

Shots that still need external generation and inspection: **RW01, RW02 and RW03** (all three).

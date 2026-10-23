# FGW Invisibility Shield V5: QA report

- **File:** `exports/FGW_Invisibility_Shield_V5_FINAL_REVIEW_1080x1920.mp4`
- **Status:** final-review cut. **Not approved for publication. Not published. No 4K master exported.**
- **Basis:** every check below was run on the rendered MP4, or on the animation data frame by frame:
  - `qa/v5/review_qa.json`, `qa/v5/motion_scan.json`
  - `qa/v5/strips/` (open, hide, demo, search, hand, reveal, loop)
  - `qa/v5/review_contact_sheet.png`, `qa/v5/review_phone_ui_sheet.png`
  - `qa/v5/rig_qa.json`
- **Project:** the editable V5 project is `source/src/v5/`, built on V4 rather than started over. V1–V4 sources and exports are untouched.

## Not done

**Real-time playback with sound.** Nobody watched or listened to V5 at normal speed. This environment has no display and no speakers. Pacing, comic timing and the sound mix are judged only from frame strips, cut-pair sheets, motion and loudness measurements, and the ASR transcript. The brief's final-review step therefore still needs a person: watch it on a phone with sound, several times through the loop.

**Runway.** Nothing from Runway is in V5, and no new generations were run, so no credits were spent. The three V4 generations still cannot be downloaded: the output host `dnznrvs05pmza.cloudfront.net` is refused by this environment's network policy. The film is 100% native vector.

## Locked audio and script

| Check | Result |
|---|---|
| Narration | The approved recording is used as is: voice-stem correlation with the source is 1.0, and its timing is unchanged. |
| Picture/audio sync vs `mix_v5.wav` | Offset 0.0 ms, correlation 0.99997. |
| Transcript of the MP4's audio (Vosk small en-us) | WER 0.065. The same three recogniser diffs as V1–V4: "raised this"/"raise the", "its"/"it's", "midair then"/"mid air than". |
| Captions | Words and timings unchanged. 19/21 ASR windows match; the 2 misses are those same recogniser diffs. |
| Duration | 29.269 s, 878 frames |

## Stream and loudness

| Property | Value |
|---|---|
| Video | H.264 High, 1080×1920 (9:16), 30 fps, 878 frames, yuv420p, BT.709 |
| GOP | Max keyframe gap 0.5 s |
| Audio | AAC 48 kHz stereo, 317 kb/s |
| Loudness | −14.6 LUFS integrated, LRA 4.8, true peak −2.6 dBFS |
| Voice over the rest (phone band) | 28.4 dB |
| Black segments; freezes of 1 s or more | None |

## What changed from V4

### Opening (0–6 s), rebuilt

| Time (s) | Shot | What happens |
|---|---|---|
| 0–0.5 | Close 3/4 track | She runs, looks back over her shoulder, frightened. The guard is right behind her, reaching, and the flashlight swings at her. The shield is carried at her side. |
| 0.5–1.45 | Same track | One continuous swing: the panel comes up and round, her other hand catches the edge, and her feet plant and brace (0.92 / 1.06). The panel lands at 1.25 and the lens catches the light. The camera settles as she brakes. |
| 1.45–3.0 | Over his shoulder | First her face and hands are visible above and behind the panel. Then the panel slides across her (1.6–2.3), so the lens smear passes over her body as an optical distortion (blur from depth, not a particle dissolve). Her head sinks, the beam sweeps the panel, and he stops dead at 2.42. |
| 3.0–3.65 | Low angle on him | His eyes widen, he checks down the corridor (3.3–3.6), and he looks back. |
| 3.65–4.95 | Glide | The camera arcs round the panel's edge: she is plainly crouched behind it. It returns to his line and she is concealed again. |
| 4.95–6.95 | POV push | He takes a cautious step in (5.0–5.6), then the push into the panel. |

Camera fix found in this QA pass: the over-the-shoulder shot first sat so close to his (big Crew) head that it filled half the frame. It now sits further off his shoulder, so his head frames the right edge and his flashlight hand the foreground.

### Optical cutaway (6.95–13.1 s), new illustration (`LensDemo5.tsx`)

- **The lens close-up:**
  - Ridges seen face-on, carrying the smear from the push.
  - They turn end-on, into half-round glass ridges on the sheet (6.95–7.85), and turn back at 12.0–12.55.
  - Each face-on stretch lasts under 1 s: no stripe screensaver and no flicker.
- **Her light (8.15–10.5):** warm/blue rays from her body reach a ridge and fan out. The fans widen as the beat goes on. She stays clearly recognisable, crouched in the lab corridor.
- **Background light (10.6–12.05):**
  - The wall stripe, the lab-door glow and the lab-window light, as stripe and teal rays.
  - Back face-on, the wall markings stretch through each ridge: from normal, to distorted, to concealed (stretch ×1 → ×5.5, her figure fading).
- **New in this QA pass:**
  - A slow drift (scale, small rotation, lateral), settling to the push framing at both match dissolves.
  - Her eyes follow her own light down into the ridges, then dart after the background light. She also blinks and tilts her head.

  This removed a 1 s low-motion stretch at 10.8–11.8.
- **Return to his POV:** the pull (13.1–13.75), with the beam across the panel.

### Search (13.75–18.55 s)

| Time (s) | Shot | What happens |
|---|---|---|
| 13.75 | Low angle | His approach. |
| 14.7 | Foreground shield-edge 3/4 close-up on her face | The beam comes at her, she leans back, her eyes follow the light, she re-grips. |
| 16.3 | Side-on wide | He leans in and inspects the distortion; she edges the panel away and crouches lower. |
| 17.5 | Her close-up | Freeze, then exhale. |

He nearly sees her, then turns away (aim keys 17.5–18.9).

Fix in this QA pass: her close-up (and the giggle close-up) were framed from behind her, which put her eye on the edge of her hair. Both cameras moved forward, so they now read as profile / 3/4.

### Floating hand (18.55–23.9 s)

| Time (s) | Shot | What happens |
|---|---|---|
| 18.55 | Wide | Her arm extends around the edge: elbow, then wrist, then fingers. |
| 19.9 | His POV | The hand floats beside the panel. |
| 21.0 | His face push-in | He notices it. |
| 21.55 | POV | It wiggles; his own hand reaches in cautiously. |
| 22.3 | Same POV | It is snatched away. |
| 22.55 | Wide | He recoils. |
| 23.25 | Her close-up | She giggles. |

Fixes in this QA pass:
- The recoil wide cut him off at the frame edge; it is now framed on the midpoint of the two characters.
- His reach no longer locks his arm straight: he steps closer as he reaches.

### Reveal, cuffs, bolt, loop (23.9–29.27 s), story kept

- **23.9–25.9, one held two-shot:** she rises and lowers the shield to her side. He startles at 24.85, and she gives a little wave.
- **25.9 his close-up:** suspicious.
- **26.85 the cuffs close-up:** the click at 27.08.
- **27.45 her close-up:** smug, then she glances at the cuffs, then panic.
- **27.95:** she bolts and he lunges. The tracking shot from 28.35 runs straight into frame 0.

Fixes in this QA pass:
- The flashlight was aimed at her face through the reveal and washed it out. It is now aimed at her chest.
- The wave crossed her face in the side view. It now goes up and forward.

### Illustration

- **Brows:** arched quadratic brows (they rise with surprise and flatten when cross).
- **Hair:** secondary sway on her hair, which follows her turns and the run.
- **Lab window:** flasks, a stand, a microscope and a glowing monitor.
- **Light:** dust motes in the flashlight cone.

### Sound (`tools/make_audio_v5.py`, 97 effects; narration untouched)

- **Opening:**
  - His boots are louder (+5 dB) through the chase, with a breath-whoosh as he reaches and a flashlight swish.
  - Her brake squeak.
  - The swing: air, flex, then the thunk and glass ring as the panel lands.
  - The lens glint, the slide scrape, a soft shimmer as the smear passes over her, and his dead-stop scuff and accent.
- **Cutaway:** glassy turns, a warm sweep for her light and a cool sweep for the corridor.
- **Search:** a torch swish, her lean rustle, the re-grip, the panel scrape, a boot creak, the music drop on the freeze, and her exhale.
- **Hand:** a sleeve rustle, an accent as the hand clears the edge, finger ticks for the wiggle, a swish as it is snatched away, and his recoil whoosh.
- **Reveal and cuffs:** a lowering air and flex, a startle whoosh, the low reveal accent, the cuffs rattle and clink, the handcuff click, and a tiny uh-oh.
- **Bolt:** the turn squeak, whooshes, and steps from the real foot landings (`audio/cues_v5.json`).

## Transition review (every cut, checked as last-frame / first-frame pairs from the MP4)

Every cut is a hard cut on action, except the two 0.15 s match dissolves into and out of the cutaway. Those cross between matching panel framings and are not used to hide anything. There are no flashes, blur covers or crossfades.

| Cut (s) | Previous → incoming | Reason / new information | Motion connection |
|---|---|---|---|
| 1.45 | Track → his over-the-shoulder | The panel is up: now see it from where he stands, which is the point of the device. | Her slide and his creep continue across the cut. |
| 3.0 | Over-the-shoulder → low angle on him | She is gone: his reaction. | He has just stopped dead; the beam is still swinging. |
| 3.65 | Low angle → glide | He checks to one side; we show the audience where she really is. | The camera glides off his eyeline. |
| 4.95 | Glide → POV push | Back to his view, now closer. | His step in carries the push. |
| 6.95 | Push → cutaway (dissolve) | Into the lens structure: "tiny lenses". | The ridge framing matches. |
| 13.1 | Cutaway → pull (dissolve) | Back out to his view. | The face-on ridges match. |
| 13.75 | Pull → low angle | He moves in: the search begins. | His step. |
| 14.7 | Low angle → shield-edge close-up on her | The beam comes at her: her reaction. | The beam's sweep. |
| 16.3 | Close-up → side-on wide | Geography: how close he is, his lean. | Her shift and the panel scrape. |
| 17.5 | Wide → her close-up | The near miss: her freeze. | His lean holds over the cut. |
| 18.55 | Her close-up → wide | The reach starts ("reach one hand"). | Her arm begins to extend. |
| 19.9 | Wide → his POV | What he sees: a floating hand. | The hand clears the edge. |
| 21.0 | POV → his face push-in | His reaction. | — |
| 21.55 | Face → POV | The wiggle; his hand reaches. | His arm enters. |
| 22.55 | POV → wide | His recoil. | The hand snatch, then his hop back. |
| 23.25 | Wide → her close-up | Her giggle. | — |
| 23.9 | Her close-up → two-shot | The reveal. | She starts to rise. |
| 25.9 | Two-shot → his close-up | Startled, then suspicious. | His startle settling. |
| 26.85 | His close-up → cuffs close-up | The cuffs. | His hand comes up. |
| 27.45 | Cuffs → her close-up | Her smug look turning to panic. | Her flinch. |
| 27.95 | Her close-up → bolt wide | The escape. | Her turn. |
| 28.35 | Bolt → track (= the opening) | The loop. | The same run, same speed and camera. |

## QC tests

| Test | Result |
|---|---|
| **Hook (first 3 s, muted)** | Frame 0: a frightened face looking back, the guard behind her with the beam. By 1.25 the shield is up. By 2.4 she is visibly smeared and gone. The question "where did she go?" is posed by 3.0. *Caveat:* at frame 0 the guard is mid-ground, not right over her shoulder. |
| **Muted** | Every narration beat has a picture that carries it without the voice: the swing, the vanish, the glide reveal, the lens fans and stretch, the search, the floating hand, the reveal, the cuffs, the bolt. |
| **Motion** (`qa/v5/motion_scan.json`, mean change per frame at 135×240) | No stretch below 0.8 for 0.4 s or more. Below 1.2 for 0.4 s or more, only two stretches: 8.3–8.87 (the cutaway, the light fans pulsing) and 16.6–17.47 (the side-on near miss, which is meant to be quiet). Both carry visible motion. The two mid-shot spikes are intended actions: 2.53 (beam and head swing) and 18.27 (a blink). All other spikes are the planned cuts. |
| **Transitions** | All 22 cuts checked as before/after pairs; see the table. |
| **Art** | Crew style throughout: one ink colour, flat planes, no 3D or plastic look, no AI-style circles, labels or bubbles. The only text is the narration captions. |
| **Loop** | Rig: the seam is 0 for both characters (pelvis position at t = DUR vs t = 0). Picture: the last→first frame difference is 9.22, against 9.06 and 8.0 for the two preceding steps, so it is indistinguishable from a normal frame step (`qa/v5/strips/loop.png`). |
| **Audio** | Measured: narration locked, sync 0.0 ms, −14.6 LUFS, voice 28.4 dB over the rest. **Not listened to** (no speakers). |
| **Captions vs subjects** | Checked on the strips and the phone-UI sheet. Captions do not cover faces, the floating hand or the cutaway. |
| **Anatomy** (`qa/v5/rig_qa.json`, every frame) | Fixed in this pass: guard leg overreach during the creep (1.43–2.3) and the recoil step, and his locked arm on the reach (up to 27 u). Remaining: one frame (21.87 s, 6.8 u leg reach) inside a POV shot where his legs are not on screen. No head-into-panel frames, no ankles through the floor. |

## Remaining issues

1. **The real-time review with sound is still owed** (see above). It is the gate before any approval or 4K master.
2. **Caption over his flashlight fist** (over-the-shoulder shot, around 2.4–2.9): the caption overlaps his foreground hand. Not a face, the floating hand or the cutaway, but noticeable.
3. **His hand and cuffs over the caption** at the very end of his close-up (26.8 s), for a few frames before the cut.
4. **Reveal flashlight glow:** with the beam now aimed at her chest, some of the cone's glow still softens her face in the two-shot (25.2–25.8).
5. **Frame 0 distance:** the guard is close behind her, but not literally at her shoulder as the brief describes.

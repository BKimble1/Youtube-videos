# Wi-Fi Through Walls: V1 report

**Status (27 Oct 2026):** the V1 review (1080×1920, 30 fps, 1094 frames, 36.47 s) is rendered from the Remotion source
and was checked from the MP4 file. **Not published.** Nobody has watched it in real time with sound: this environment
has no display or speakers, so every check below is measured or made from rendered frames.

## What was made

| Deliverable | File |
|---|---|
| Review video | `exports/FGW_WiFi_ThroughWalls_V1_REVIEW_1080x1920.mp4` (H.264 High, CRF 16, yuv420p/bt709; AAC 320 kb/s 48 kHz stereo) |
| Editable project | `source/` (Remotion 4.0.533; composition `WiFiWallsV1`; stills `FilmStill`, `Sheet`, `PoseTest`) |
| Final narration | `audio/narration/FGW_WiFi_Walls_narration_final.wav` (48 kHz/24-bit); takes and provenance in `audio/narration/` |
| Mix | `audio/mix/FGW_WiFi_Walls_V1_mix.wav`; measurements `audio/mix/mix_measure.json` |
| Timing and sync data | `audio/narration/words_final.json` (word times), `source/src/data/timeline.json` (captions: text, emphasis, show/hide), `source/src/captions.ts` (caption heights), `audio/cues.json` (145 sound cues), `captions/FGW_WiFi_Through_Walls_V1.srt` |
| Stills | `stills/FGW_WiFi_V1_00_first_frame_f0.png`, `01_hook_1.5s_f45`, `02_skeleton_reveal_10.6s_f318`, `03_wifi_identification_20.3s_f609`, `04_final_frame_f1093` |
| Shots and transitions | `production/SHOTS_AND_TRANSITIONS.md` |
| Research | `research/SOURCE_NOTES.md` |
| QA evidence | `qa/review/` (measurements, motion scan, ASR of the MP4's audio, phone UI sheet), `qa/asr_takes_A.json`, `qa/asr_mix.json` |

## The approved script

Spoken word for word (`production/NARRATION_APPROVED.txt`). Whisper base.en, run on the MP4's own audio, reads it at
0.9% WER, the same as on the clean narration. The one "difference" is "anything", lost at a chunk boundary of the
check (the aligner gives that word a long end). Captions are the locked text, split into 36 chunks of 2–4 words.

## Tools and accounts actually used

- **ElevenLabs (restricted connector):** the narration, in the channel's "Test Voice" (`kk5XaSLo2XAw0sKM98zU`) with
  eleven_v4. There were two takes from one directed prompt; take 2 was chosen. The connector exposes no stability,
  similarity, style, speed or speaker-boost controls for this model, so the brief's numeric settings could not be set.
  Delivery was directed with inline tags instead (`audio/narration/voice_provenance.json`). Four sound effects came
  from eleven_text_to_sound_v2: the skid and wall thump, the palm over the lens, the low impact, and the café ambience
  loop. About 1,900 credits were spent in total.
- **Narration edit:** only 11 sentence pauses were shortened, removing silent samples (1.27 s in total). There was no
  stretching, pitch change or EQ. Measured duration: 36.47 s.
- **Music:** original, synthesized in `tools/make_audio.py`. It is 16 bars in D minor at 105.3 bpm, so exactly 64
  beats fill the film and the bed loops. There is no third-party music. It works, but it is plain. A composed or
  licensed bed would lift the film (see issues below).
- **Runway Gen-4.5: not used.** Every set is built from vector planes in one perspective space, and the camera moves
  through it while the characters, waves and screens move with it. A generated background clip would not share that
  parallax or the cutout art style, so composited characters would slide against it. The controlled Remotion version
  was judged clearer and more consistent, as the brief allows. No Runway credits were spent.
- **WhisperX was not available.** Word times come from PocketSphinx forced alignment of the approved text, snapped to
  the measured waveform onsets (`tools/align.py`). They were cross-checked with two independent recognisers, sherpa-onnx
  Zipformer and Whisper base.en.

## Benchmarks

The Laser Voices, Death Clock, web-shooter and contact-lens Shorts are **not in this repository as video files**, so
they could not be watched. What was used: the channel's written editing rules (`FGW_EDITING_RULES.md`), earlier
productions' reports, and the Death Clock character rig itself, carried over through Real Web Fluid and Glass Climbing.

## Cast

- **Protagonist:** the Weird Crew's guesser (red spiky hair, striped tee), drawn on his existing Death Clock rig
  (`source/src/dc/`, copied from Glass Climbing). His design is unchanged.
- **The only rig change:** a `hairStyle` option (short, curly, bun, swoop) so the six other test participants and the
  café customer read as different people. They are built on the same rig with their own outfits and skin tones.

## Checks (measured on the MP4)

| Check | Result |
|---|---|
| Stream | 1080×1920, 30/1, 1094 frames, H.264 High yuv420p bt709; AAC 48 kHz stereo 317 kb/s |
| Loudness | −14.4 LUFS integrated, true peak −1.4 dBFS, LRA 1.8 LU |
| Black frames / freezes ≥ 0.7 s | none / none |
| A/V sync against the mix | 0.0 ms lag |
| Loop seam (picture) | Mean difference from the last frame to the first is 2.6. A normal frame-to-frame change is 7.5 (median), so the seam is smaller than an ordinary frame step: same camera, same pose. |
| Loop seam (audio) | The WAV is sample-continuous: all effects and music are mixed into a circular buffer, so the skid sound starts at the end and finishes at frame 0. AAC encoder priming can still add a few milliseconds at the MP4's start. |
| Motion scan | Only the five intended cuts spike: 15.20 (lab → café), 20.77 (laptop → walking close-up), 22.33 (café → corridor), 27.03 (corridor → café), 31.97 (café → office). |
| Captions | All 36 checked at their midpoints. They sit at y = 1545, just above the Shorts title band and clear of faces and the skeleton (`qa/review/*_phone_ui_sheet.png`). |

**Fixed during QA:**

- Ghost copies of sleeves and forearms trailed moving arms in the video render. Chrome kept stale paint around the rig's
  masks between frames; single stills were clean. Every frame is now a fresh mount.
- The passer-by walked through the camera during the push into the laptop.
- The camera pushed through the hero's body on the cut to the empty-pockets shot.
- A Wi-Fi link was drawn from behind the camera.
- The corridor push ran into the last walker's face.
- The hook's "shh" did not read.
- The public-view screen was too small for the "camera image disappears" beat.
- The music masked "its hand" in the ASR check. The bed is now 3 dB lower, dips during the proof beat, and the voice is
  gently compressed.

## Scorecard (1–10, V1 as rendered)

| Category | Score | Why |
|---|---|---|
| First-frame impact | 7 | Frame 0 is already the experiment: he skids against a thick, cut-open wall while a radio on the other side shows his skeleton in the same pose. On a phone the display is about a third of the frame width, so the matched skeleton is small. |
| First-three-second clarity | 7 | With sound off the read is: hiding behind a wall, a machine tracking him anyway, the camera pushing into the evidence. The radio's T array is a neutral grey, and some viewers may not link it to the display without the voiceover. |
| Smoothness of camera movement | 7 | Every move is eased: lateral reveal, pushes, the crane down the stand, and one long track through the wall. The track from the radio past the wall to him is fast, and it brushes past the display stand. |
| Frequency of meaningful changes | 8 | A new action, view or reveal arrives about every 0.7–1.3 s, with no holds over 0.7 s. |
| Weird Crew consistency | 8 | The same guesser on his established rig throughout. The supporting cast uses the same construction. |
| Anatomical accuracy | 6 | Feet are planted (no sliding) and limbs come from IK. But the walking arms swing close to the hips (the rig's far arm must stay in front of the tee), the crouch's resting arms are stiff, and hands are simple at small sizes. |
| Audio and narration quality | 7 | The established voice is clear and quick, and the mix is clean and loop-safe. The synthesized music is functional rather than memorable. Not auditioned on speakers. |
| Scientific visualization | 7 | Each step is shown as cause and effect: FMCW unit, T array, waves through the wall's layers, reflections, raw heat, keypoints, skeleton. Then a separate study with a router, a laptop, BFI-style patterns and anonymous IDs. The waves are stylised. |
| Story escalation | 7 | Hidden yet tracked, then the proof, then identified without a phone, then 197 people, then you at a café, then the dilemma. The second half is creepier, but its visuals (screens of patterns) are less spectacular than the first half's. |
| Seamlessness of the ending loop | 8 | The same camera and pose, and the skid sound wraps from the end into frame 0. The dash to the wall is fast (about 1.2 s). |

## Issues that stand between V1 and publishing

1. **Not reviewed by a person in real time with sound.** Pace, the voice's emphasis on CREEPY and CAMERA, and the music
   all need a listen.
2. **The café in scene E stages the real (lab) study in a café.** The brief asks for this, but the research notes warn
   against implying a live deployment in shops or cafés. "In a separate experiment" plus the description's note keep it
   defensible. Scene E could also be restaged to make "illustration" obvious, for example a "STUDY" plate on the laptop
   or a test-lab look.
3. **"197 people… almost everyone":** 197 volunteers were recorded, but reports say about 161 were usable for BFI, and
   99.5% is a per-sample, closed-set figure from a controlled lab. On screen this is kept to "197 PARTICIPANTS" and a
   grid with two misses. The description should carry the caveat. Several numbers in `research/SOURCE_NOTES.md` are
   marked [verify]: the primary pages were blocked by this environment's proxy.
4. **The hook's evidence is small on a phone.** If muted-view tests show viewers miss the display, enlarge it or move it
   nearer the wall in the opening framing.
5. **Walking arms** read slightly stiff (hands near the hips). The empty-pockets shot relies on the turned-out pockets
   and open hands; an open-palms shrug was tried and read as adjusting a belt, so it was dropped.
6. **Music** is an original synth bed. A composed or licensed track would raise the production value.
7. **Branding:** one small round "FGW · FUTURE GOT WEIRD" blade sign on the café facade (scene E). It is subtle and
   may go unnoticed. There is no subscribe element and no end card, as briefed.

## Post-publication analysis plan

When the numbers exist, compare against Laser Voices, Death Clock and the other Shorts, normalised for age and sample
size: stayed-to-watch versus swiped-away, average view duration and percentage viewed, subscribers per 1,000 views and
per 1,000 engaged views, likes and comments per 1,000 views, and returning viewers.

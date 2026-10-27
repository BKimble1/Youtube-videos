# Cyborg Cockroach V3: change log and handoff

- **Review file:** `exports/FGW_Cyborg_Cockroach_V3_REVIEW_1080x1920.mp4` (1080x1920, 30 fps, 936 frames = 31.2 s, loops).
- **Composition:** `CyborgCockroachV2`. The V2 framework now carries the V3 cut; V2's code is at commit adf4e10.
- **Plan and rules:** `production/V3_SHOT_PLAN.md`.
- **Subtitles:** `captions/FGW_Cyborg_Cockroach_V3.srt`.
- **Mix:** `audio/mix/FGW_Cyborg_Cockroach_V3_mix.wav`. Cues: `audio/cues_v3.json`.

## Locked (unchanged)

- **Narration:** the approved ElevenLabs narration WAV and word timings are reused unchanged. The mixer's voice-stem check against the source gives correlation 1.0.
- **Content:** the script, the story, the science and the duration.

## What changed

### Hook (0-4.7 s): rechoreographed

- **A1 (0-1.4 s), one continuous shot:**
  - The medic walks the last millimetres to a **clear** silicone target, aligned, coil already glowing.
  - At **0.30 s** the coil cuts the latch line, shown as a spark with the line's tails whipping back.
  - From **0.30 to 0.50 s** the spring visibly drives the syringe along the tube, accelerating, with speed streaks. The camera travels with it.
  - At **0.50 s** the steel needle enters the clear block, which squashes and wobbles. Rings spread from the entry, the syringe rebounds and seats, and the body recoils on planted feet.
  - The camera holds on the needle inside the silicone, then tracks back along the launcher to reveal the whole living insect wearing it. The board LED blinks on the last frame.
  - Sounds: trigger click, spring, slide, impact thock, rebound tick.
- **A2 (1.4-2.2 s):** match cut from the LED to the remote's red button on the same spot. The gloved thumb presses it at 1.60 s and the LED turns amber. The press motivates the camera easing back along the remote to the glove and sleeve.
- **A3 (2.2-3.0 s):** the operator with the remote. The camera follows his eye line down to the bench: the insect at the target, the fired syringe still in it. A steering pulse is sent.
- **A4 (3.0-3.8 s):** low side view. The insect, its tube now empty, pivots away from the target on tripod steps and sets off.
- **A5 (3.8-4.7 s):** rise over the table. The operator guides it with the D-pad toward a foam course. A foam block enters the foreground and wipes into the next scene.

### How the system works (4.8-10.5 s): every setup is different

| Shot | Time | What it shows |
|---|---|---|
| B1 | 4.8-6.2 s | Gloved hands seat the module on a slate cutting mat |
| B2 | 6.2-7.0 s | Tight profile of the launcher and its mounting, tracking as it steps off |
| B3 | 7.0-8.1 s | Walking on a cork board (tripod gait) |
| B4 | 8.1-9.4 s | Close on the electronics: pulses run the left wire, the electrode glows and the antenna twitches |
| B5 | 9.4-10.5 s | Continuous camera: it turns right around a block |

### Two configurations and the demonstration (10.5-20.6 s)

- **C1-C2:** the medic (launch tube) and the observer (camera and aerial), large and side by side. The observer walks into its own lens.
- **C3:** its POV feed.
- **C4:** the feed on the operator's monitor, thumb hovering.
- **C5:** overhead view: the medic heads straight for the clear target in an arena.
- **D1:** low side alignment.
- **DT:** an insert of the operator's thumb pressing FIRE, in a new framing.
- **D2:** close-up of the same readable launch and impact as the hook.
- **D3:** a short section: gas drives the plunger and the amber dose blooms in the clear silicone.
- **D5:** one rise over the bench of used targets toward the window light.

### Rescue journey (20.6-25.3 s): a connected miniature mission

- **E1:** a collapsed building in daylight (bloom out of the lab window). The camera cranes down to a narrow opening and the tiny medic.
- **E2:** follow it through the gap, past a gloved hand for scale.
- **E3:** side-track under a broken beam, through a dusty light shaft.
- **E4:** macro of its feet on uneven rubble.
- **E5:** the observer's feed down a dark passage.
- **E6:** a field operator at the rubble's edge studies the feed and steers the medic.
- The "Future rescue concept" label sits over E1-E2.

### Personal payoff (25.3-31.2 s): a reversal

- **F1:** a shadow slides under the rubble. Her eyes, then her head, follow it.
- **F2:** the medic emerges from a crack.
- **F3:** she sees it: disgust, recoil.
- **F4:** it crosses a narrow ledge over a drop (a chip breaks off and falls).
- **F5:** she recognizes the device. Brows lift, she breathes out, and her hand opens.
- **F6:** it comes toward the viewer, then the camera arcs round into a bold close view of the living cockroach and its needle device beside her fingertips. The last frame matches frame 0, so the film loops.

### Look

- Targets are clear silicone.
- The needle is steel with an ink outline.
- The nichrome coil is drawn wound around the latch line.
- Transitions are built from physical events:
  - the LED and button matches;
  - eye lines;
  - the lens into the feed and the feed onto the monitor;
  - a foam-block wipe;
  - the window light blooming into daylight;
  - foreground rubble;
  - the loop.

### Sound

The same narration, the synthesized tonal bed, and 131 cues read from the animation:

- tripod footsteps;
- trigger click, spring, slide, impact thock and rebound for both firings;
- button presses;
- steering pulses;
- seal click and fizz;
- air passes through the gap and the lens;
- grit and creaks;
- a chip falling.

## Runway

Not used. This environment's network policy still denies Runway's asset host `dnznrvs05pmza.cloudfront.net` (proxy 403, re-tested in this session). Generations could not be downloaded, inspected or composited, so none was run and no credits were spent. To enable it, add that host under Allowed domains in the environment's network settings (https://code.claude.com/docs/en/cloud-environments#network-access).

## QA (final review render)

`tools/qa.py` writes `qa/FGW_Cyborg_Cockroach_V3_REVIEW_qa.json`, `_motion.json` and `_phone_sheet.png`.

- **Video:** 1080x1920 h264 yuv420p bt709, 30 fps, 936 frames, 31.2 s.
- **Audio:**
  - Loudness: -14.2 LUFS integrated, true peak -1.5 dBTP, voice 22.4 dB over the rest in the phone band.
  - Match to the mix: correlation 0.99998, offset 0 ms.
- **Narration:** Whisper's word error rate is 0 against the locked script.
- **Captions:** 23/23 caption windows OK.
- **Motion:**
  - The only motion spike away from a cut is the thumb's press at frame 48 (intended).
  - No low-motion holds remain. The first render had two, in D3 and E6; both now carry a motivated move (following the dose, following the operator's gaze).
- **Inspected frame by frame:**
  - frames 0-29 (approach, trigger at frame 9, launch at frames 9-15, impact at frame 15);
  - frames 786-935 (shadow, emergence, disgust, ledge, hope, final approach);
  - the 935 -> 0 loop cut, every transition and the whole timeline on sheets.
- **Caption placement:** checked on the phone-UI overlay sheet: clear of needles, targets, insects and faces.

## Known remaining issues

- **F5 -> F6 screen direction:** in the two-shots the medic crawls screen-LEFT toward her hand. F6 is a reverse angle in which it walks screen-right, to match A1 for the loop. Her fingertips are in both shots, so the geography reads, but it is a line cross.
- **Scale cheats:**
  - The insect is drawn larger than true scale next to people (A3, A5, C4, E6 feed, F3-F5) so it stays readable.
  - In F6 her hand is at true scale, so only her fingertips show.
- **Small subjects:**
  - E3 (under the beam) and F4 (the ledge) keep the insect small to sell the size of the obstacles. On a phone the insect is about 150-200 px long.
  - In C5 (overhead) the observer's lens reads as a dot.
- **Hands:**
  - In B1 the gloved fingers lie over the shell while pressing the module home.
  - In E6 the remote sits 2 cm further back in the operator's hand so his thumb reaches the D-pad.
- **E4** is a high-angle macro of the legs, not ground level, because this rig's shell hides the legs in profile.
- **Loop:** frame 935 (rubble) to frame 0 (lab) is a deliberate location change. The insect's pose, size, screen position and heading carry across.

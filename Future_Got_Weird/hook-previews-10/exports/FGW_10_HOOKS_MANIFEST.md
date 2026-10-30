# Future Got Weird: 10-Hook Preview Round manifest

These are ten independently rendered 6-second hook previews. They are competing concepts, and no winner is selected here.

## Common specification (identical for all ten)

- **Video.** 1080 × 1920 (9:16), 30 fps, exactly 180 frames (6.000 s), H.264 High, yuv420p, BT.709, CRF 16, lossless
  PNG frame capture.
- **Audio.** AAC 320 kb/s, 48 kHz. The AAC stream decodes to 6.016 s: the extra 16 ms is the encoder's padding and is
  silent.
- **Narration.** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, eleven_v4), the channel narrator also used on Cyborg
  Cockroach, Dead Spider and Zombie Ant.
  - Two takes per line were generated once. Every chosen take was checked word for word by two local ASR models
    (Whisper base.en and Zipformer).
  - The speech itself is untouched: no edits, time-stretching or pitch changes.
  - Speech starts at 0.06 s in every hook. The voice is matched to −16 LUFS in all ten.
- **Mix.** Synthesised effects and ambience sit about 11 dB under the voice and are ducked under speech. The sample
  peak is limited to −1.0 dBFS. Integrated mix loudness is −15.9 to −17.0 LUFS.
- **Captions.** Burned in using the channel treatment (Nunito Black, white text with a dark stroke, emphasis words in
  yellow capitals). They are the only text in the frame.
- **Excluded.** No watermark, title card, end card, logo, CTA or separators inside the individual files.
- **Style.** 2D vector illustration with restrained 2.5D layering, in the FGW visual language.
- **QA.** `tools/qa_clip.py` was run on every rendered MP4 and all ten pass:
  - frame count, size, codecs, voice onset and audio length are correct;
  - no near-static run longer than 0.5 s (the longest run is 0 frames in all ten).
- **Human review.** First frames, last frames, 0.5 s sheets and transition frames were inspected from the rendered
  files. Hooks 03 and 09 were sent back once and repaired for weak opening frames and anatomy.

Not yet done: nobody has watched or listened to these in real time. This environment has no video or audio playback,
so the checks above were made from extracted frames and measurements.

## Deliverables

| File | What it is |
|---|---|
| `FGW_HOOK_01_TONGUE_PARASITE.mp4` … `FGW_HOOK_10_BRAIN_SPINE_IMPLANT.mp4` | The ten previews |
| `FGW_ALL_10_HOOKS_COMPARISON.mp4` | All ten in numerical order, each preceded by a 1.0 s numbered separator (70.0 s, 2,100 frames) |
| `FGW_HOOKS_FIRST_FRAMES_CONTACT_SHEET.png` | The exact frame 0 of each clip, decoded from the rendered MP4s |
| `FGW_10_HOOKS_MANIFEST.md` | This file |

## Per-hook entries

The runtime of every clip is 6.000 s (180 frames). "Speech ends" is when the narration finishes; the rest of the
clip is the visual payoff.

### 01: Tongue parasite (*Cymothoa exigua*)

**Narration:** "This parasite destroys a fish's tongue… then becomes its new tongue."
- Speech ends at 4.66 s; mix −17.0 LUFS.

**What it shows**
- **Opening:** an extreme close-up of a snapper's open mouth, with the isopod staring out from where the tongue should
  be.
- **Middle:** a cut window in the jaw shows the claws clamping the tongue's artery and blood being drawn in. The
  tongue then pales and withers to a stub.
- **Ending:** the mouth shuts and reopens, with the isopod sitting in the tongue's place.

**Limitations**
- The fish head is simpler than the reference episodes, with smooth gradients and no scale texture.
- The cutaway is a schematic midline section; the near lip band crosses the parasite's side.
- The blood drops are small at phone size.
- The isopod's face reads slightly "cute".
- Entry through the gills is not shown.

### 02: Underwater cyborg cockroach (NTU/Waseda, Nature Communications 2026)

**Narration:** "Scientists gave a cockroach a diving suit… and kept it underwater for hours."
- Speech ends at 4.57 s; mix −16.7 LUFS.

**What it shows**
- **Opening:** the suited Madagascar hissing cockroach walks a flooded walkway. It is the channel's Cockroach V5 rig,
  lengthened to hisser proportions.
- **Middle:** a continuous push into the generator, where oxygen bubbles form on the MnO₂ sponge in hydrogen peroxide.
  The gas travels along the four tubes to the sealed thoracic spiracles and into the tracheal tree. No lungs are
  shown.
- **Ending:** a pull-back as the cockroach walks under a fallen slab.

**Limitations**
- The suit and tubes are reconstructed from written descriptions, because the paper's figures weren't accessible from
  this environment.
- The electrode backpack is omitted.
- "Hours" (about 2–3 h) is carried by the narration only.
- The descent into deeper water is gentle.
- In extreme close-ups the floor can drift slightly against the feet.

### 03: Mantis and horsehair worm

**Narration:** "This worm drives a mantis into water… then crawls out of its body."
- Speech ends at 4.50 s; mix −16.6 LUFS.

**What it shows**
- **Opening:** a split-level close-up of the mantis plunging head-first, with droplets, an air sheath and bubbles.
  This opening was repaired in a second pass.
- **Middle:** a clearing shows the worm coiled in the abdomen. It pushes out between the last segments, and the camera
  tracks the 1 mm thread.
- **Ending:** about 23 cm of worm (about three host lengths) curls below the drifting mantis.

**Limitations**
- From 2.9 to 4.1 s the mantis's head is mostly off-frame while the camera follows the worm.
- Emergence is time-compressed; the real process takes seconds to minutes.
- The coil inside the abdomen is stylised.
- The bottom quarter of frame 0 is open water.

### 04: Liquid-metal robot (magnetoactive phase-transitional matter, Matter 2023)

**Narration:** "This metal robot melts through a cage… then gets remolded into shape."
- Speech ends at 4.35 s; mix −15.9 LUFS.

**What it shows**
- **Opening:** a gallium figure stands in a cage on an induction coil, with its feet already turning liquid.
- **Middle:** the figure melts, squeezes out between the bars and is dragged by a hand-held magnet into a
  figure-shaped mould. The coil then switches off.
- **Ending:** the figure freezes, is lifted out by the magnet and set down outside the empty cage. The reshaping is
  clearly done by the mould and the magnet.

**Limitations**
- The mould sits right beside the cage for continuity; in the paper the recasting happened separately.
- Timing is compressed.
- Big liquid pools show faint contour ripples around 1.8–2.0 s.
- The first caption overlaps the top ring of the cage.

### 05: Bombardier beetle

**Narration:** "This beetle shoots boiling chemicals… from explosions inside its own body."
- Speech ends at 4.53 s; mix −16.7 LUFS.

**What it shows**
- **Opening:** an ant lunges at a *Brachinus* beetle. The beetle's abdomen tip swings round and a pale,
  pulsed droplet-and-vapour spray hits the ant. There are no flames.
- **Middle:** the abdomen turns semi-transparent in place, showing the reservoirs, the valve, the reaction chamber
  heating, and pulses firing through the tip.
- **Ending:** a second burst; the ant retreats while cleaning its antenna, and the beetle holds its ground.

**Limitations**
- The pulses are slowed to about 4–8 per second for readability; the real rate is about 500 per second.
- The ant is briefly cropped at the top edge in close shots.
- The far gland is partly hidden behind the near one.
- The tip's first swing is small on screen.

### 06: Zombie snail (*Leucochloridium*)

**Narration:** "This parasite turns a snail's eyestalk into a pulsing lure for birds."
- Speech ends at 4.61 s; mix −16.2 LUFS.

**What it shows**
- **Opening:** an amber snail on a leaf with one swollen eyestalk banded green, cream and brown, already pulsing.
- **Middle:** a cut window in the same tentacle shows the broodsac packed with larval cysts, with a contraction wave
  running through it about once a second.
- **Ending:** a robin arrives and notices the eyestalk, then hops closer. It doesn't attack, and nothing suggests brain
  control.

**Limitations**
- The robin sits far back, so it appears about snail-sized, and it is briefly cropped at the top edge.
- The snail's body and lower tentacles are simplified.
- The broodsac bands are idealised.
- The pull-back starts at 4.1 s rather than the spec's 4.5 s, so the shot doesn't linger after the narration.
- The captions cover part of the snail's body (not the eyestalk).

### 07: Human heart beating outside the body (ex vivo normothermic perfusion)

**Narration:** "Doctors can keep a human heart beating… even after it's removed from the body."
- Speech ends at 4.29 s; mix −17.0 LUFS.

**What it shows**
- **Opening:** a large heart already beating in a clear dome chamber, connected to tubes of blood.
- **Middle:** a pull-back to the machine (monitor, oxygenator, pump, reservoir), then a push back in. A window opens on
  the heart: blood runs down the aorta, the valve stays shut, and the blood turns into the coronary arteries and
  through the muscle.
- **Ending:** the strongest beat lands at 5.37 s, with a pump surge and an ECG spike.

**Limitations**
- The camera is brisk, because the spec calls for three big moves in 6 s.
- The closing beat is small on screen in the wide view.
- The cross-section is simplified: the coronary sinus and the right-side outflow are implied, not drawn.
- The equipment is generic, with no brand shown.
- The caption touches the machine's pump bay in wide views.

### 08: Infrared contact lenses (upconversion nanoparticles, Cell 2025)

**Narration:** "These contact lenses detect infrared signals… even when your eyes are closed."
- Speech ends at 4.46 s; mix −16.4 LUFS.

**What it shows**
- **Opening:** the Crew lead's eye closing over a nearly invisible lens, with crimson near-infrared packets coming
  from a small LED. This reuses the channel's Infrared Contacts art.
- **Middle:** a side section dives into the lens. Each nanocrystal catches two near-infrared packets and releases one
  green packet.
- **Ending:** the closed lid glows faintly in step with the flashing LED.

**Limitations**
- The LED is partly off the right edge in frame 0.
- The pull-back out of the lens (about 4.6–4.9 s) is fast.
- The lid glow is an artistic reading of what wearers perceived.
- Thermal imaging and night vision are deliberately not implied.

### 09: Pistol shrimp

**Narration:** "This tiny shrimp snaps its claw… creating a shockwave and flash of light."
- Speech ends at 4.65 s; mix −16.2 LUFS.

**What it shows**
- **Opening:** a translucent banded *Alpheus* clings head-up to a boulder, with its claw cocked; it snaps at 0.6 s.
  This opening was repaired in a second pass.
- **Middle:** a macro view of the cavitation bubble growing and collapsing, a pinpoint flash at 3.66 s, and one
  shockwave front.
- **Ending:** the wave stuns a small fish; the pull-out shows the tiny shrimp re-cocking its claw.

**Limitations**
- The flash lasts about 3 frames. That is deliberate and accurate, but easy to miss.
- The bubble is drawn as a sphere, not a toroidal cavity.
- The shockwave's refraction is suggested rather than simulated.
- The head-up perch is a framing choice; the animal more often rests horizontally.
- The fish's reaction is brief.

### 10: Brain–spine interface (Lorach et al., Nature 2023)

**Narration:** "A brain implant helped this man walk again… by bypassing his spinal injury."
- Speech ends at 4.48 s; mix −16.7 LUFS.

**What it shows**
- **Opening:** the participant mid-step at a walker, with the headset, the cable and the backpack processor.
- **Middle:** the head turns see-through locally. The skull implant records, and the signal runs to the headset and
  down to the processor. His own spinal signal stops at the injured cervical segment. The device's signal continues
  through the stimulator to the paddle lead below the injury.
- **Ending:** the leg muscles light up and the step completes; he keeps walking.

**Limitations**
- The anatomy is a stylised cheat on a 3/4 cartoon rig, and the cervical injury is small on screen.
- Implant-to-stimulator communication is simplified: a cable to a belt transmitter plus a short hop through the skin.
  The real system is wireless.
- Only the near leg's nerves and muscles are drawn.
- The caption crosses his face around 3.6–4.2 s.
- The rig is the channel's Glass Climbing man, restyled as a neutral adult with brown hair and a beard. The participant
  is not named or depicted realistically.

## Tools not used

- **Runway.** Not used. Every scene is native vector animation, and a generated clip would not have matched the house
  style closely enough to justify it.
- **Music.** None. The effects are synthesised in `tools/audio/` with no samples.

## Where everything is

- Sources: `source/src/hNN/`
- Audio scripts: `tools/audio/hNN.py`
- Per-hook production notes (shot plan, transitions, science sources, audio cues, QA passes): `production/hNN_NOTES.md`
- QA evidence: `qa/hNN/`
- Narration provenance: `audio/narration/voice_provenance.json`

# Brain Cells Playing DOOM: science notes

These notes support the V1 picture. They separate what is documented from what the animation assumes or simplifies.

## Access limits

The research for this pass could not open the following pages directly from this environment, because the network
policy blocked them:

- scientificamerican.com
- smithsonianmag.com
- docs.corticallabs.com
- corticallabs.com

Facts from those sources came from search-engine summaries of the pages, which are less reliable than the pages
themselves.

The strongest primary source was the demo's public code, which was cloned and read:
[SeanCole02/doom-neuron](https://github.com/SeanCole02/doom-neuron), mainly `ppo_doom.py`. Before publishing, re-check
the claims below against these pages:

- <https://www.scientificamerican.com/article/how-human-neurons-on-a-chip-learned-to-play-doom/>
- <https://www.smithsonianmag.com/smart-news/a-clump-of-human-brain-cells-on-a-computer-chip-learned-to-play-the-nostalgic-video-game-doom-180988447/>
- <https://docs.corticallabs.com/>

## What the film shows, and its basis

### The CL1

The film draws a shoebox-sized white unit with a clear enclosure. Inside it are:

- media reservoirs;
- a pump;
- a filter;
- a headstage holding the MEA.

**Basis.** Coverage describes:

- a "shoe box-sized" unit, a "body in a box" (Brett Kagan, Cortical Labs' chief scientific officer);
- a "compact, transparent enclosure";
- "a white box with cables and other machinery inside" (ABC photo caption);
- pumps, media reservoirs, filtration, waste and gas mixing, with the culture held at 37 °C;
- an MEA headstage with a single locking mechanism;
- a touchscreen.

**Assumed.** No dimensions or official drawing were found. The proportions, the layout inside the enclosure and the
touchscreen's position are ours.

### Around 200,000 living human neurons

The narration states this figure. It matches the Scientific American and Smithsonian coverage.

**Note.** Some outlets give 800,000, which appears to mix this demo up with the earlier Pong (DishBrain) work.

### The cells grow on a chip, in contact with electrodes

The film shows a culture on an 8 × 8 microelectrode array: 60 sites with the corners absent, of which 59 are live.

**Basis.** The descriptions say "59 electrodes on a planar array of metal and glass". The demo code uses 64 channels and
forbids {0, 4, 7, 56, 63}.

**Assumed:**

- that channel *c* sits at row *c* div 8, column *c* mod 8;
- the 200 µm pitch and 30 µm electrodes (generic values for this kind of MEA, not CL1 specifications);
- the lead routing;
- the carrier and pad layout.

### Game information becomes stimulation

The film shows an ENCODE panel (enemy bearing and distance) that becomes a pattern on nine "input" electrodes. The
stimulation is shown in cyan, travelling *into* the chip.

**Basis (code):** game-state variables are encoded by a trained PPO encoder into biphasic pulse trains:

- the variables include position, angle, health, ammo, ray-cast wall distances and up to six enemies;
- a small CNN looks at the screen;
- the pulse trains are 1–2.5 µA, 4–40 Hz, with 160 µs phases;
- they go to nine encoding electrodes;
- the loop runs at 10 Hz.

**Simplified:**

- **Which nine electrodes.** The film uses 11, 12, 18–21 and 26–28; this choice is illustrative.
- **The CNN.** The software, not the neurons, looks at the screen. The film doesn't show the CNN, and it never
  implies that the cells see images.

### The neurons fire back; the software decodes

The film shows spikes recorded on electrode groups labelled MOVE, TURN and FIRE. A DECODE panel turns spike counts into
one of three commands.

**Basis (code):** spikes are counted in fixed electrode groups, and a linear decoder maps the counts to actions:

| Action | Electrodes |
|---|---|
| forward | 41, 42, 49 |
| back | 50, 51, 58 |
| strafe left | 13, 14, 21 |
| strafe right | 45, 46, 53 |
| turn left | 29, 30, 31, 37 |
| turn right | 59–62 |
| attack | 32, 33, 34 |

**Simplified.** The film shows only MOVE (forward), TURN (left) and FIRE. Strafing and moving backward are omitted.

### A normal computer does much of the work

At "normal computer" the PC is labelled "runs the game", "encoder + decoder" and "learning algorithm". The control
screen's footer reads "decoder + learning algorithm (PPO) run on this PC · neurons: CL1".

**Basis.** Critics ask how much of the learning the PPO and CNN on silicon do, as opposed to the neurons (RD World,
TechRadar). The developer's own FAQ reports two things:

- ablations with random or zero spikes produced no learning;
- improvement continued with the encoder frozen.

**Not settled.** The demo was publicised by the company and is not peer-reviewed. The film doesn't claim that the
neurons learned, only that they take part.

**Assumed.** That the decoder and learning software run on a separate PC on the bench. The CL1 can compute on its own,
and the demo's actual hardware arrangement wasn't documented in the sources found.

### They're terrible at the game

The film shows clumsy turns, shots into the wall and a late reaction.

**Basis.** Kagan described the play as "like a beginner who's never seen a computer". The system bumbles, shoots walls
and dies often.

**Note.** The specific events are dramatized, and the monitor bezel says so.

## Simplifications in the picture

- **The gameplay.** It is an original retro-shooter recreation: our own procedural textures, enemy, weapon and HUD.
  It is not DOOM or Freedoom art and not footage of the experiment. The demo ran a VizDoom scenario ("progressive
  deathmatch", with a "deadly corridor" curriculum) using Freedoom assets. The game monitor's bezel reads
  "illustrative recreation · not experiment footage".
- **Activity is slowed for visibility.** Real spikes last about a millisecond and the loop runs at 10 Hz. The film's
  stimulation → response → decode → action chain plays out over fractions of a second to seconds.
- **Neuron density is reduced.** The film draws about 400 neurons per mm², with a haze at chip scale. A real culture is
  a far denser mat.
- **Morphology.** The neurons are generic cortical-type: 12–18 µm somata, branching dendrites and one long axon. The
  microscope sequence uses a phase-contrast look; it is not a micrograph of the CL1 culture.
- **The cross-section.** The section under the microscope field is not to scale. It exaggerates the electrode thickness
  so that the contact reads.

# Mushroom Robot V1: science notes and accuracy checklist

## The study

Anand Kumar Mishra, Jaeseok Kim, Hannah Baghdadi, Bruce R. Johnson, Kathie T. Hodge and Robert F. Shepherd,
"Sensorimotor control of robots mediated by electrophysiological measurements of fungal mycelia",
*Science Robotics* 9 (93), eadk8019, published 28 August 2024. DOI
[10.1126/scirobotics.adk8019](https://doi.org/10.1126/scirobotics.adk8019). Cornell University (Organic Robotics Lab,
Shepherd), with a co-author at the University of Florence.

**How it was checked.** I could not open the primary pages from this environment: the session's network policy
refused every connection to science.org, news.cornell.edu, par.nsf.gov, sciencedaily.com and the other outlets. The
facts below therefore come from web-search summaries of those pages. Each fact was confirmed in more than one
independent summary. **Before publishing, check the details against the paper itself.** The items to check are
marked ⚠.

| Source | Link |
|---|---|
| Paper (Science Robotics) | https://www.science.org/doi/10.1126/scirobotics.adk8019 |
| Cornell Chronicle release, Aug 2024 | https://news.cornell.edu/stories/2024/08/biohybrid-robots-controlled-electrical-impulses-mushrooms |
| NSF public-access record | https://par.nsf.gov/biblio/10548775 |
| ScienceDaily (Cornell release), Sep 2024 | https://www.sciencedaily.com/releases/2024/09/240904192325.htm |
| TechXplore (release PDF) | https://techxplore.com/news/2024-08-biohybrid-robots-electrical-impulses-mushrooms.pdf |
| Popular Science | https://www.popsci.com/technology/fungus-robot/ |
| National Geographic (video, noted as sped up) | https://www.nationalgeographic.com/science/article/fungi-oyster-mushroom-robot-technology |
| IFLScience ("spider-like") | https://www.iflscience.com/watch-as-mushroom-power-helps-this-spider-like-biohybrid-robot-bounce-along-75833 |

## Facts the picture relies on

- **Organism and growth.** The organism is king oyster mushroom (*Pleurotus eryngii*) mycelium. It was grown onto a
  3D-printed scaffold with built-in electrodes, and the hyphae grew onto and around the electrodes.
- **Two robots.**
  - A five-limbed, starfish-shaped soft walker with pneumatically actuated legs, driven through a solenoid valve.
    One summary places the valve away from the robot's body.
  - A four-wheeled hard rover with motors.
  - Secondary coverage often calls the walker "spider-like".
- **The interface.** It reads the mycelium's raw electrical activity and is shielded against vibration and
  electromagnetic interference. The signal is processed and turned into digital commands for the actuators (the
  valves and motors). The controller is inspired by central pattern generators.
- **Three experiments.**
  - The robots walked or rolled in response to the mycelium's natural spiking.
  - UV light stimulation changed the mycelium's electrical output, and the robots changed their gaits.
  - In a third test, the researchers overrode the native signal entirely.
- **Shepherd's comment.** He has said the input here was light, and that in future it could be chemical (for
  example, soil sensing).

## The locked narration, line by line

| Line | Verdict | Note |
|---|---|---|
| If you give a mushroom robot legs, it can actually walk. | ✅ with a caveat | "Mushroom" means the mycelium, which is the fungus's body rather than a fruiting cap. The real walker is slow, and published clips are sped up (⚠ one outlet says National Geographic's clip is sped up about 10×). |
| Scientists grew living fungus into a robot's electronics. | ✅ | Mycelium grown onto an electrode scaffold that is part of the robot's interface. |
| And every time the fungus fired an electrical signal... / The robot moved. | ⚠ simplification | Spikes were the control input, but they pass through processing and a CPG-style controller. "Every time" implies one spike, one movement. The picture shows this one-to-one link (one detected spike, one gait cycle) as an illustration, and the chain shows the processing step. |
| But here's where it gets weird. / They shined ultraviolet light on the fungus. / And the robot changed how it walked. | ✅ | UV changed the electrical activity, which in turn changed the gait. The picture keeps that order: lamp on → spikes larger and more frequent on the scope → steps faster and bigger. ⚠ The exact gait change (rate vs amplitude vs pattern) should be checked in the paper. The picture shows faster, larger steps, not a new pattern. |
| So this thing has no brain. / No eyes. | ✅ | No neural tissue and no camera. UV is not shown as vision: the lamp acts on the culture, and no "seeing" graphic is used. |
| And absolutely no idea where it's going. | ✅ | No navigation or goal-seeking. The walker marches into a box, which is invented comedy. |
| But the mushroom is literally controlling its legs. | ⚠ overstatement risk | The fungal signal is the control input that the electronics turn into valve commands. "Literally controlling" compresses that: the electronics generate the gait and the fungus's spikes drive and modulate it. The picture shows the electronics and the valve at every step, which mitigates this. |
| Which means scientists basically gave a fungus a body. | ✅ (framing) | The authors' own framing of biohybrid "embodiment" is similar. |

**Not claimed anywhere:** that the fungus is sentient, intelligent, sees, or navigates, or that it powers the
motors. The legs are inflated with air through a valve, and the fungus supplies only the signal.

## What is real and what is visual metaphor

**Real (as reported):**
- the mycelium on a scaffold with electrodes;
- the electrical spiking;
- an amplifier, filtering and spike detection, which stand for "processed and converted to digital commands";
- the valve-driven pneumatic soft legs;
- five legs;
- a tether carrying the air lines;
- UV changing the signal and then the gait.

**Metaphor or invented:**
- **The robot's look.** The hub, the mesh dome over the culture (standing in for the shielded interface), the leg
  shape and the ribs are a stylised design, not the lab's hardware. ⚠ It looks more spider-like than the real
  starfish-shaped walker.
- **Spike timing and propagation.**
  - The cyan waves sweeping through the network and the spike shapes are illustrative.
  - Real fungal spikes are slow and irregular.
  - The film compresses time and shows about one spike per second.
- **The followed spike.** The trip from electrode to valve is slowed down and laid out on one board for clarity.
  The real valve sits off-board.
- **Silkscreen labels.** AMP / FILTER / SPIKE DETECT / VALVE are generic stages, not the paper's circuit.
- **The scope strip, lamp, box, beaker and footprint trail.** All illustrative. The splat and the bonk are comedy.
- **The overlay.** The on-screen tag reads "Illustration · based on Mishra et al., Science Robotics (2024), Cornell
  University" for 3.1–6.6 s.

## V3 notes (visual model of the walker)

- **Legs.** They are drawn with the standard piecewise-constant-curvature model used for soft robots:
  - two inextensible sections, each with one curvature and one bending-plane angle;
  - a root clamped to the body;
  - limits on curvature and on bending out of the chamber plane;
  - a strain-limiting underside;
  - chambers that swell with pressure.

  There are no rigid joints, consistent with pneumatic soft actuators.
- **Air.** It reaches the legs through an off-board valve, via a tether. The tether runs to a boom that follows the
  walker; the boom is invented.
- **⚠ The walker's raised, spider-like stance is a stylisation.** The real five-limbed soft robot is flatter
  (starfish-shaped), and its locomotion is closer to an inflate-and-crawl motion.
- **⚠ Under UV the picture shows a paired, faster gait.** The paper reports that UV changed the gait; the exact change
  is not reproduced from the paper.
- **The on-screen illustration tag was removed (V2 and V3 briefs).** Attribution belongs in the video description:
  "Based on Mishra et al., Sensorimotor control of robots mediated by electrophysiological measurements of fungal
  mycelia, Science Robotics 9, eadk8019 (2024), Cornell University. Animation is illustrative."

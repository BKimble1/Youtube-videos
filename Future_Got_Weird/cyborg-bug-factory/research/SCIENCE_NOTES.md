# Scientific verification notes: Cyborg Bug Factory

Researched 11 Nov 2026. In this session nature.com, ntu.edu.sg, eurekalert.org, pmc.ncbi.nlm.nih.gov and arxiv.org did not
resolve, so the findings below come from search-engine extracts of those pages and from press coverage. Nobody read
the full Methods section of the paper first-hand.

Before publishing, a human should open the primary paper and check these four numbers against it:
- 68 s;
- 2.3 g;
- 80–86.7 %;
- 70°.

## Primary sources

- **The paper.** Lin Q. et al. (Hirotaka Sato's group, NTU School of Mechanical & Aerospace Engineering),
  "Cyborg insect factory: automatic assembly for insect-computer hybrid robot via vision-guided robotic arm
  manipulation of custom bipolar electrodes". *Nature Communications* 16, 6073, 28 July 2025.
  - DOI: [10.1038/s41467-025-60779-1](https://doi.org/10.1038/s41467-025-60779-1)
  - Open access: <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12304280/>
- **The preprint.** arXiv:2411.13164, 20 Nov 2024. This is why press coverage started in December 2024.
- **NTU release.** <https://www.ntu.edu.sg/news/detail/ai-powered-robot-assembles-search-and-rescue-cyborg-insects>
- **Myanmar deployment coverage:**
  - The Star (5 Apr 2025): <https://www.thestar.com.my/aseanplus/aseanplus-news/2025/04/05/singapores-cyborg-cockroaches-helping-with-search-and-rescue-efforts-in-myanmar-quake>
  - SCMP: <https://www.scmp.com/week-asia/health-environment/article/3305721/myanmar-earthquake-singapore-deploys-cyborg-cockroaches-rescue-efforts>
  - Mothership: <https://mothership.sg/2025/04/cockroach-robot-myanmar-quake-rescue/>
  - Singapore PSD feature: <https://www.psd.gov.sg/challenge/articles/from-lab-to-rubble--how-cyborg-cockroaches-saved-lives/>
- **Further coverage of the factory:**
  - SCMP: <https://www.scmp.com/news/china/science/article/3322924/singapore-teams-68-second-feat-opens-door-cyborg-cockroaches-disaster-relief>
  - Singularity Hub: <https://singularityhub.com/2024/12/05/automated-cyborg-cockroach-factory-could-churn-out-a-bug-a-minute-for-search-and-rescue/>
  - The Engineer: <https://www.theengineer.co.uk/content/news/automated-system-kits-out-cyborg-cockroaches>
  - TechXplore: <https://techxplore.com/news/2025-07-scientists-ai-powered-robot-cyborg.html>

## Narration, claim by claim

| Narration | Verdict | Notes |
|---|---|---|
| "Scientists built a factory that turns living cockroaches into robots." | **Supported, with caveats** | "Factory" is the paper's own word ("Cyborg insect factory"). It is one prototype robot cell in a lab, not a production plant; NTU calls it "still a prototype". The insects stay alive and become "insect-computer hybrid robots": a live insect wearing a stimulator. "Into robots" is a figure of speech, not a literal claim. |
| "And it only takes 68 seconds." | **Supported, with caveats** | 68 s per insect (NTU: "1 minute and 8 seconds") for the automated assembly of one insect that is already anaesthetised and fixed in place. The CO₂ anaesthesia beforehand (reported as about 10 min in coverage of the preprint) is apparently not counted. Sources disagree on how long the manual method takes, so the film doesn't compare. Success rate was 80.0–86.7 % for insects 5–6 cm long. |
| "A robotic arm grabs a tiny computer and attaches it to the cockroach's back." | **Supported** | Species: Madagascar hissing cockroach (*Gromphadorhina portentosa*), adults 5–7 cm. The backpack is a microcontroller with a sub-1 GHz radio, custom bipolar electrodes and hook-like mounting branches; it weighs 2.3 g. It sits on the thorax just behind the pronotum. The electrodes go into the soft membrane between the pronotum and the mesothorax, and the hooks grip the metathorax. |
| "Then tiny electrodes deliver electrical pulses that can make the bug turn." | **Supported (steering, not control)** | One electrode site, stimulated wirelessly, gave turns of more than 70° (0.4 s pulses), peak turning rates of 240–274°/s, and slowed the insect by 68 %. The pulses trigger the insect's own turning and escape reflexes. It does its own walking, and responses vary. |
| "So now, instead of building tiny robots from scratch… Scientists can use actual living insects." | **Supported (framing)** | This is the field's stated motivation: insects already have locomotion that works over rough ground. The film makes no claim about speed, strength, cost or endurance. |
| "They've already sent cyborg cockroaches into a real earthquake disaster zone." | **Supported, with one important caveat** | Myanmar earthquake, M7.7, 28 Mar 2025. Ten cyborg Madagascar hissing cockroaches went out from HTX, NTU and Klass Engineering & Solutions with Singapore's SCDF Operation Lionheart contingent. They were first used on 31 Mar 2025 (some outlets say 30 Mar), then twice more on 3 Apr in Naypyidaw. They carried miniature infrared cameras and sensors and were reported as the first field use of insect-hybrid robots. **The caveat:** these were hand-assembled first-generation units, not insects from the 68-second factory, which was published later in July 2025. **No survivor was reported found by the cockroaches.** |
| "Which means we're not just building robots anymore. We're turning bugs into them." | **Rhetorical** | A dry closing line. The bugs remain living insects wearing electronics. |

**No narration claim is materially unsupported.** Two points of framing are worth knowing before publication; neither
needs the locked narration changed:

1. **The juxtaposition.** The narration runs straight from the 68-second factory into "They've already sent cyborg
   cockroaches into a real earthquake disaster zone". A viewer could assume the deployed insects came from the factory.
   They did not: the Myanmar units were hand-built. The sentence itself is true, because it says "cyborg cockroaches",
   not "factory-made cockroaches". The picture avoids implying otherwise: the disaster scene is a separate place after a
   deliberate cut, and its insect wears the field backpack (a different board with a camera module).
2. **"Turns living cockroaches into robots" / "turning bugs into them".** This is figurative. Picture and labels keep
   the insect alive and walking on its own legs, with steering shown as pulses that nudge a turn.

## How the picture handles each point

- **Species and anatomy.** A wingless Madagascar hissing cockroach:
  - a broad shield-like pronotum over the head;
  - glossy chestnut-black plates with amber rear bands;
  - six legs attached under the thorax, coxa, femur, spiny tibia and tarsus on each;
  - long antennae and small cerci.
  - The model is about 64 mm long.
- **Backpack.** Seated on the meso- and metanotum just behind the pronotum, with a bipolar pair of electrodes under
  the pronotum's rear edge and hook branches gripping the sides of the metathorax. The labelled parts are the control
  chip, the battery and the electrodes.
- **Battery: a generic representation.** The extracts did not confirm whether a battery is inside the 2.3 g or what
  kind it is. The tiny pouch cell stands for "the backpack's power".
- **Assembly cell.**
  - One robot arm, one station and one insect at a time. A conveyor of carriers with soft clamps holds the
    anaesthetised insects still.
  - An overhead vision camera finds the attach site; the paper used deep-learning vision for this. The film does not
    name a network.
  - The 68 s cycle runs sped up under a timer labelled "PER INSECT · SHOWN SPED UP". The overhead shot is labelled
    "LAB PROTOTYPE · one insect at a time · sped up".
- **Anaesthesia: simplified.**
  - What the film shows: the waiting insects lie still under their clamps; they wake within a second of the snap and
    walk off.
  - What actually happens: recovery from CO₂ takes minutes. This is time compression.
  - The CO₂ step itself is not shown.
- **Steering.**
  - The pulse travels down one electrode, and the insect then turns about 70°, walking on its own legs.
  - There is no "remote-control" or mind-control language or imagery.
- **Comparison.**
  - A toy wheeled robot can't climb a 10 mm ledge; the cyborg walks over it.
  - The film makes no claim about speed, strength, cost or endurance.
  - The badges describe only what this staged illustration shows: "STUCK AT THE EDGE" and "WALKS RIGHT OVER".
- **Disaster zone.**
  - Shown at true scale: the insect is centimetres long against metre-scale slabs.
  - The tag reads "MYANMAR EARTHQUAKE · 2025 · real search-and-rescue deployment".
  - The inset camera feed only scans ("SCANNING…"). No survivor, heat signature or rescue appears.
- **No fabricated footage.** Everything is programmatic vector animation; there is no external footage or imagery.

## Animator reference (kept for later versions)

- Hissing cockroach: large, wingless, broad oval body, big pronotum shield.
- The backpack sits on the thorax behind the pronotum, never on the abdomen.
- Electrodes go under the rear edge of the pronotum. There are no antenna or cercus wires in the factory version.
- The backpack is about as wide as the middle of the thorax; it is a small patch, not a box.

---

## V2 update (11 Nov 2026): first-hand verification

For V2 the environment was allowed to reach the sources, and each page was opened and read here. The quotes below are
copied from those pages.

| Claim (narration) | Source (opened) | What it says | Confidence | What the picture shows |
|---|---|---|---|---|
| Automated assembly ("a factory") | Lin et al., *Nat Commun* 16:6073 (2025), full text at PMC12304280 | Title: "Cyborg insect factory: automatic assembly for insect-computer hybrid robot via vision-guided robotic arm manipulation of custom bipolar electrodes". The system integrates "a robotic arm, vision-based site detection, and an insect fixation structure". | High | One arm, one station, a conveyor of fixation carriers. One insect at a time. |
| "68 seconds" | Same paper | "The entire automatic assembly, from initially fixing insect to finally releasing insect, spanned 68 s." Separately: "the cockroaches were anesthetized for 10 min under CO₂". | High | The timer runs from fixing to release and is labelled "FIX → RELEASE · PER INSECT · SPED UP". The anaesthesia is not counted, and not shown. |
| Electronics ("a tiny computer") and where it attaches | Same paper | "The backpack included bipolar electrodes, a mounting structure, and a microcontroller." "The total weight of the designed backpack is 2.3 g." "Mounting branches were used to hook the insect's metathorax." Bipolar electrodes implanted "into the intersegmental membrane between the insect's pronotum and mesothorax". "A microcontroller with Sub-1GHz communication." After assembly, "a LiPo battery was plugged inside the power socket". | High | A white mounting structure with a grasping tab and alignment hole, a microcontroller board, a radio antenna, hooks on the metathorax, and electrodes into the membrane under the pronotum's rear edge. The battery plugs in after assembly. 2.3 g against a 15 g payload is within what the insect can carry. |
| How the robot works | Same paper | A UR3e arm with a Robotiq Hand-e gripper and a RealSense D435 camera. "The robotic arm was vertically oriented, with its gripper and camera positioned directly downward." The pronotum is found by deep-learning segmentation (TransUNet); the reference point is the midpoint of the posterior pronotum edge. | High | Vertical gripper, wrist camera, and a segmentation overlay that finds the pronotum and the implant point. |
| "Electrical pulses that can make the bug turn" | Same paper | "Hybrid robots exhibited robust steering (over 70°) and deceleration (68.2% speed reduction)." Navigation along an S-shaped path. | High: the response is stimulus-dependent and does not happen every time. | A pulse is followed by a turn of about 75°. "Can make" is shown as an influence on the insect's own walking. |
| "Real earthquake disaster zone" | NTU news release; The Star (5 Apr 2025); Mothership (5 Apr 2025); Singapore PSD feature (12 Aug 2026) | NTU: "On 30 March 2025, a team of 10 cyborg insects was deployed to Myanmar together with the Singapore Civil Defence Force (SCDF) … the first-ever field deployment of insect-hybrid robots", and these were "cyborg insects with the first-generation backpack mounted using the manual method". The Star: "first deployed on March 31 … and twice on April 3 in … Naypyidaw. They have not found any survivors"; "Fitted with infrared cameras and sensors"; data "sent back wirelessly". PSD: "fitted with a miniature thermal camera and sensors". | High | A field backpack with a camera module, a thermal-style scan reading "SCANNING…", and a data link. No survivor or detection is shown. The tag reads "first field deployment of cyborg insects". |
| "Living insects", robots built from scratch | Paper intro; PSD feature | The paper: insect-computer hybrids for "navigating complex terrains". PSD quotes HTX's lead engineer: conventional miniature robots' on-board power "limits their operation time to only a few minutes … This increases operational time to four hours." | Medium: this is a stated motivation, not a controlled comparison. | A conceptual comparison only: one toy robot at one ledge. There is no "stuck" verdict, and no speeds, endurance or cost figures. |
| Production scale | NTU release | "While the assembly line is still in the prototype stage…" | High | One cell, one station, one insect at a time. |

**The "42 seconds" in the V2 brief.** The brief asks for a "42-second assembly time" to be verified. The approved
narration says "68 seconds", and no version of the film has ever said 42. 68 s is verified above. There is nothing to
block.

**No narration claim is unsupported.** The two framing notes from V1 still apply:

1. **Myanmar used the earlier hand-built units.** The Myanmar insects carried first-generation, manually mounted
   backpacks, not factory-made ones. The narration's "cyborg cockroaches" is accurate. In V2 the disaster-zone insect
   wears the camera-carrying field backpack.
2. **"Into robots" and "turning bugs into them" are figurative.**

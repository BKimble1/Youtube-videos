# Dead Bird Drones: claim and source ledger

Read on 7 Nov 2026. Plain-text extracts of the three primary pages are kept in `research/sources/` exactly as fetched
(navigation text included). Nothing below comes from memory.

## Sources read

| # | Source | What it is | Status |
|---|---|---|---|
| S1 | New Mexico Tech, Mechanical Engineering news item "ASME – News article – Dr. Hassanalian", dated Aug 3 2023: <https://www.nmt.edu/academics/mecheng/news_article/ASME%20Hassanalian.php> (`research/sources/nmt_asme_news_2023-08-03.txt`) | A pointer to an ASME News article "An Avian Drone Flaps Its Way into the Sky" by John Kosowatz, quoting its summary | Read. The linked ASME article itself (www.asme.org) is blocked by this environment's network policy and was **not** read. |
| S2 | New Mexico Tech Advancement profile "Dr. Mostafa Hassanalian": <https://www.nmt.edu/advancement/YEA_sub2.php> (`research/sources/nmt_advancement_hassanalian.txt`) | University profile of the lab's work | Read. |
| S3 | NMT Graduate Student Association 2025 abstracts (Google Sites): <https://sites.google.com/npe.nmt.edu/gsa2025-abstracts-2> (`research/sources/nmt_gsa2025_abstracts.txt`) | Poster abstract "Taxidermy and Biomimicry in Drone Development", authors Darion Vosbein, Jared Upshaw, Kathryn McDonagh, Mostafa Hassanalian; research advisor Dr. Mostafa Hassanalian | Read. |

Key passages (verbatim):

- S1: "A drone platform fitted into the cavity of a taxidermy bird can fly using its wings, and help study wildlife."
- S2: "His most well-known research is his work on taxidermied drones. Funded by the National Science Foundation REU
  program, Dr. Hassanalian and graduate student Jared Upshaw went “viral” for their work designing and constructing
  drones that look and fly like real birds. Constructed with real feathers and designed to have flapping wings rather
  than propellers, these drones are used to monitor wildlife and, if made to look like birds of prey, help with airport
  bird strike control by deterring other birds from being in the area."
- S3: "This poster presents a novel approach to wildlife monitoring using biomimetic robotics by integrating taxidermy
  into both aquatic and aerial systems. By combining the design principles of a swimming taxidermy duck robot and a
  flapping-wing drone, this study explores non-intrusive methods for ecological surveillance. The swimming duck robot
  leverages the natural locomotion and appearance of a Mallard duck to discreetly navigate wetland environments,
  utilizing 3D-printed components and integrated sensors for environmental data collection. Meanwhile, the
  flapping-wing aerial system employs a taxidermied Mallard as the base for a drone that mimics realistic bird flight,
  enhancing stealth and minimizing disruption to wildlife. This aerial design incorporates a custom gearbox to achieve
  lifelike wing motion, supported by aerodynamic analysis to optimize lift and drag performance. […] Future work will
  focus on enhancing durability, waterproofing, and control mechanisms to improve operational efficiency and
  adaptability."

## Narration claims (V2, verbatim) against the sources

| Line | Claim | Support | Notes / limits |
|---|---|---|---|
| "If you put a motor inside a dead bird, you could make it fly again." | A powered drive inside a preserved bird body can produce flight | S1 ("a drone platform fitted into the cavity of a taxidermy bird can fly using its wings"); S2 (flapping wings, real feathers) | Conditional, personal framing. "Fly again" is shorthand for mechanically powered flight; the picture shows the drive in the first second so it never reads as revival. |
| "Researchers built drones using preserved bird bodies, with machinery hidden underneath the feathers." | Researchers built drones from taxidermied birds with the machinery inside | S1 (platform in the cavity of a taxidermy bird); S2 ("taxidermied drones", "constructed with real feathers"); S3 ("integrating taxidermy") | The sources describe taxidermy (preserved) bodies and real feathers; they do not list every part used in every prototype. |
| "A gearbox turns the motor’s spinning motion into flapping wings." | A gearbox converts motor rotation into flapping | S3 ("incorporates a custom gearbox to achieve lifelike wing motion"); S2 (flapping wings rather than propellers) | The sources do not give the gear train, crank or linkage. The film's drive is a simplified **SCHEMATIC** reconstruction (see below). |
| "The goal is to watch wildlife with less disturbance." | The research aim is wildlife observation with less disturbance | S1 ("help study wildlife"); S2 ("used to monitor wildlife"); S3 ("non-intrusive methods for ecological surveillance", "minimizing disruption to wildlife") | Shown as an aim (**RESEARCH GOAL** label). No measured noise reduction, silence, flock acceptance or deployment is claimed or shown. |
| "And they’ve built a swimming robot using a preserved duck." | The team also built a swimming robot from a taxidermy duck | S3 ("a swimming taxidermy duck robot", "a Mallard duck", "3D-printed components and integrated sensors") | Shown as a separate prototype, never a transformation of the flying drone. |
| "So the bird watching the birds… might already be dead." | A dry callback to the research premise | Rhetorical | Not a claim that ordinary birds are drones or that anyone is surveilled. |

## Depiction decisions (for owner review)

1. **The flying drone's species.** S3 says the 2025 flapping-wing system "employs a taxidermied Mallard". The film
   draws the flying drone as a **generic brown bird with no species claimed**, and the swimming robot as an
   unmistakable mallard drake. The flyer is kept non-mallard so a phone viewer reads two separate prototypes, and the
   narration's late reveal ("a preserved duck") stays new information. The sources read do not name the species of
   the earlier (2023) prototypes. If the owner prefers source-specific accuracy, the flyer can be restyled as a
   mallard (the rig is species-neutral).
2. **The drive is a reconstruction.** Motor → 10-tooth pinion → 20-tooth gear → 10-tooth pinion → 30-tooth output
   gear (6 : 1) → crank pin → two connecting rods → spar levers hinged at the shoulders. It is internally consistent
   (meshing tooth phase, a solved crank-rocker), but it is not a measured model of the published device. No
   dimensions, power, range, speed, endurance, camera, computer or sensor are shown or claimed for the flying drone.
   Battery and electronics are not drawn (two wires leave the motor out of view).
3. **The close drive runs in slow motion** (about a third of flight speed) so the teeth and the linkage can be followed;
   the gear ratios stay the same.
4. **The duck's propulsion.** S3 says the duck robot "leverages the natural locomotion and appearance of a Mallard
   duck" and uses "3D-printed components and integrated sensors". It does not describe the drive. The film's
   below-water view (labelled SCHEMATIC) shows paddling feet driven from a sealed light-grey 3D-printed module by two
   pushrods: an illustrative assumption consistent with "natural locomotion", not a documented mechanism. No
   propeller is shown.
5. **"Less disturbance"** (V2): living birds simply carry on, well beyond the drone, under a RESEARCH GOAL label. V1's
   shrinking sound arcs were **removed in V2** after the claims review: no source measures or claims reduced noise, and
   the arcs implied it. Nothing shows flock acceptance.
6. **No institution or researcher is named on screen**, matching the narration.

## Not used

- The ASME article (blocked; only its quoted summary on S1 was read).
- Any claim about birds of prey or airport bird-strike deterrence (S2 mentions it; the script does not).
- External creator references in the brief (Zack D. Films video and the secondary breakdown) were not re-read for
  this build; only the brief's abstract directing principles were applied. No narration, characters, art, music or
  shot sequence was taken from them.

## V2 review notes

- The V2 claims review found no narration change necessary.
- **Must-fix applied:** the sound arcs were removed.
- **Recommended description line (species):** "The 2025 flapping-wing prototype was built on a taxidermied mallard; the
  film draws a generic bird." An alternative is to restyle the flyer as a brown hen mallard.
- **"Motor":** an inference from "drone platform" plus "custom gearbox". No source extract uses the word.

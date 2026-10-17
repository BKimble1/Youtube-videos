# THE LAST CHOICE — R2 beat sheet ("the Weird Crew's last battle")

R2 supersedes R1's evacuation/refuge story. There is no hospital, refuge, glass enclosure or escort. The R1 source is
preserved at commit `2a8e9aa` (local tag `the-last-choice-R1`); R2 lives in `source/src/r2/`.

**Runtime:** about 4:18. Timings come from `source/src/r2/timing.ts` (`M`); film time = Portals recording time − 0.70 s.

**Rule for the machines:** a distributed system with imperfect information and physical limits. It sees through
sensors, coordinates assets it can reach, re-forms when a tactic is countered, replaces losses, and keeps advancing.
There are no probability numbers, no floating code and no central brain.

## Cast (the approved Future Got Weird cast; nothing on screen names anyone)

| Role | Cast key | Tool (shown working **and** shown failing) | Contribution others depend on |
|---|---|---|---|
| **Director** (he; dies) | `clerkC` (curly hair, saffron shirt, headset, nametag) | **Barrier plate**: a cracked armour plate salvaged from a machine, strapped to his left forearm. It blocks and bashes. Limitation: it dents (D1), cracks (D3), and shatters on the fatal blow (D4). | Takes the front, draws the attacks, makes the gaps. |
| Tether | `clerkA` (teal visor and vest) | **Magnetic tether**: a launcher fires a clamp on a cable to a hip reel. Limitation: needs an anchor (the girder); a drone cuts the cable (D3). | Pulls a damaged machine into another; trips legs. |
| Decoy | `clerkB` (bun, glasses, blue cardigan) | **Decoy projector**: she sketches figures with a finger on a battered tablet, and a clip-on projector throws walking light-figures onto smoke. Limitation: needs smoke; machines learn to ignore it and target the source (D3). | Buys seconds of misdirection. |
| Breaker | `honest` (swoop hair, green shirt) | **Impact tool**: a repurposed pneumatic rescue ram / breaker with a tank and gauge. Limitation: slow wind-up, close range, the tank runs dry (D3). | Breaks knee joints and chest plates. |
| Drone | `checker` (grey bob, round glasses, pencil, coral cardigan) | **Allied drone**: a small repurposed quadcopter flown from a handheld. Limitation: battery; it is hunted down (D3). | Scouts, distracts, shields the wounded. |
| Runner | `guesser` (spiky red hair, striped shirt) | **Halligan bar**: a firefighter's pry tool for prying armour off downed units and cutting cables. | Finishes downed machines; fast flanker. |
| Flares | `host` (beard, bowtie, dark jacket) | **Flares and smoke canisters**: blind optics, make the smoke the decoy needs. Limitation: few. | Smoke for the decoy; blinds the heavy. |

`person` (a regular person) is not in the Crew and does not appear.

## Enemy families (original designs; no logos)

1. **Combat units:** 2.2 m armoured humanoids with a single sensor eye (cyan, amber when committed). They fight with melee blows and grabs, move in formation, and are replaced from the rear.
2. **Drones:** small, agile recon and attack quadcopters. They observe from angles, mark targets, ram, and cut cables.
3. **Heavies:** 6 m walkers carrying a ram arm and a launcher. They are slow and decisive, and one takes over when another falls.

**Fragmentation goes on the machines:** armour tearing, detached limbs, snapped cables, dark fluid, sparks and wrecks. Human wounds are stylised and non-explicit, and they persist once they happen.

## Geography (`source/src/r2/world/plan.ts`)

From west to east:
- a collapsed building, where the Crew arrive;
- the **rubble ridge**, where the Director rises;
- the **van with the radio** at the ridge's east foot, where he dies;
- the avenue, with the **crater** (the main fight) between the **fallen girder** on the north flank and a burning facade and bus wreck on the south;
- cross streets where formations enter;
- the skyline, with a failing tower.

The sun is low in the west, behind the Crew, and the smoke drifts north-east.

## The film

| Section | Film time | Picture (music anchor in `M`) |
|---|---|---|
| **A — New York falls** | 0:00–0:06.6 | Dusk aerial drifting west over the district. Damaged roofs pass close and fast while the skyline moves slowly. Fires with sources run across several blocks, and machine formations stream along the avenues. On the first low hit (`LOW_HIT`, 0.72) a distant tower begins to fail and keeps falling through the shot. |
| Title | 0:06.6–0:09.3 | Black. **THE LAST CHOICE**, and smaller below it, NEW YORK · 2042. A sound bridge of wind, distant rumble and fire carries the cut. |
| **B — the Director stands** | 0:09.3–0:35.8 | **The rise** (`SOLO`):<br>• Low close on dust and broken concrete; his bloodied hand braces on the rubble.<br>• He drags himself out from under debris, gets a knee under him, shifts his weight onto one foot and stands, with visible effort and several distinct poses.<br><br>**The reveal** (`ORCH` 16.76):<br>• He looks up. Over his shoulder, then a wide: ranks of combat units, low drones and heavies advance through the crater below.<br>• `H1`/`H2`: they step in sync and their eyes light.<br>• `H3`: a heavy's head turns toward him.<br>• He breathes and steadies the plate on his injured left arm. The van, with the radio on its floor, sits at the ridge foot in the background, seen briefly as a place.<br>• `H4`/`H5`: the army halts as one.<br>• The lonely wide silhouette: low, smoke behind, the whole force across the ground. |
| **C — the Crew joins him** | 0:35.8–0:59.95 | **Arrivals:**<br>• `BASS_OUT`: he senses movement behind him and turns his head.<br>• `ALLY1` (38.46): the tether operator steps out of the smoke.<br>• `ALLY2a`/`ALLY2b`: the runner vaults a collapsed slab and the breaker climbs up behind him.<br>• `MARCH` (45.3): the decoy maker, the drone pilot (her drone lifts off) and the flare carrier arrive from the edge of the street.<br><br>**Readying:** looks are exchanged, a hand lands on the Director's shoulder, and equipment is readied (reel click, tank hiss, drone whine, plate strap pulled tight).<br><br>**The group frame:** `ASSEMBLE` (53.04) is the shared turn toward the enemy. Hold the group frame on the ridge.<br><br>**The charge:** `CHARGE` (59.95): they run down the ridge toward the crater, diagonally. The front ranks advance to meet them. |
| **D1 — the first breach** | 0:59.95–1:34.3 | **The clash:**<br>• Run-in across the rubble and avenue.<br>• `CLASH` (68.3), wide: the Director's plate meets the first combat unit and drives it back into the next. The lines engage.<br>• Closer angles: the breaker hits a knee joint (sparks, it drops), the tether yanks one off balance, the runner pries a back plate and rips cables, the drone harries a drone, and a flare blinds an eye.<br><br>**Four decisive contacts:**<br>• `BR1` (78.46): the plate blocks a blow and dents.<br>• `BR2` (81.34): the breaker smashes a chest plate.<br>• `BR3` (82.80): the tether swings the toppling unit into the next.<br>• `BR4` (85.64): the Director shoulder-charges the last in line, and **the gap opens**.<br><br>**Position gained:** `GAIN1`/`GAIN2`: they push through to a fractured slab on the crater's west rim. `BREATH` (91.1–94.0): a look between them, panting, the plate cracked. |
| **D2 — ingenuity works** | 1:34.3–1:56.9 | **The decoy:**<br>• The flare carrier lobs smoke canisters into the crater.<br>• `DECOY` (95.38): the decoy maker sketches four figures on the tablet, and giant walking light-figures appear on the smoke.<br>• `DECOY_HIT a/b/c`: units turn and strike at the light, drones dive, and a heavy fires into the smoke.<br><br>**The flank attack:**<br>• `FLANK` (102.2): the Crew attack the flank from behind the fallen girder.<br>• `TETHER` (105.84): a damaged unit is clamped, the cable is anchored round the girder, and the unit is swung into another. Both crash into the girder.<br><br>**The catch:**<br>• `KNOCKBACK` (110.46): a unit knocks the runner backward.<br>• `CATCH` (111.38): the breaker catches him.<br><br>**The shield:**<br>• `SHIELD` (113.2): the allied drone hovers between the wounded runner and a unit's blow and takes it.<br>• `COUNTER` (114.12): the Director bashes the unit down.<br>• `BRIGHT`: a moment of success at the rim. |
| **D3 — the strongest attack; the system adapts** | 1:56.9–2:29.9 | **The strongest attack** (`P3`, 116.92): flare and drone blind a heavy, the tether pins its leg to the girder, the breaker splits its knee, and **the heavy falls** (`HEAVY_DOWN`, 125.64). This is the peak.<br><br>**The adaptation**, shown before and after:<br>• `ADAPT` (128.02): a small drone climbs above the smoke to a better angle, its eye snaps, and it sees the projector's source.<br>• `FORMATION` (131.02): every unit re-forms together, from line to arc. Replacements step over the wrecks.<br>• `DECOY_FAIL` (133.82): the decoy is ignored, and a drone dives on the decoy maker and smashes the tablet and projector.<br>• `FLANK_DENIED` (137.66): drones swarm the girder flank and cut the tether cable.<br>• `ALLY_DRONE_LOST` (140.48): two drones run down the allied drone.<br>• `HEAVY2` (142.36): a second heavy steps over the first. `HEAVY2_FIRE` (145.18): its launcher's blast throws the Crew back; the flare carrier is cut, and the breaker's gauge reads empty. |
| **D4 — the last stand breaks** | 2:29.9–3:06.9 | **Losing ground** (`P4`, 149.86): pushed back toward the ridge, limping and out of tools. The runner is struck down (alive), and the tether operator is disarmed.<br><br>**The last counterattack** (`ARRIVAL` B♭, 162.42): the Director raises an arm and they surge.<br>• The empty breaker is swung as a club, a cable wraps a unit's legs, and the last flare blinds the second heavy.<br>• The Director smashes through two units. `LOCAL_WIN` (166.41): the heavy staggers off a slab.<br><br>**The fatal blow:**<br>• `REALIZE` (170.4): the wide shows the ring still closing on every side, formations streaming past and drones above.<br>• The heavy's ram swings at the drone pilot, down by the van. The Director throws himself in front, and his plate shatters (`STRIKE`, 177.76). He is thrown against the broken concrete.<br>• `SOFTEN` (179.3): he slides down beside the van.<br>• The others are held. `FINAL_HIT` (186.9): the machines stop as one. |
| **E — he dies** | 3:06.9–3:19.3 | **The close-up** (Portals' ring-out, 186.9–193.1): he sits against the broken slab next to the van, with fires behind. The drone pilot reaches him and holds his hand. His eyes try to focus on her, and his hand loosens.<br><br>**The end:** a final small breath; his eyes close (`EYES_CLOSE`, ~196.6). Stillness: wind, fire, subdued machinery. |
| **F — radio to city** | 3:19.3–3:50.4 | **The radio:**<br>• Start on his still face and pan a short way to the radio as her hand turns the knob: click (`RADIO_CLICK`, 199.9), crackle, then the trumpet (200.4).<br>• The rising pullback starts. The first wide frame holds both radio and body.<br><br>**The pullback** (one physical camera path): his companions, held and wounded; the wrecked machines; the crater; the ring of machines holding position; formations streaming along the avenue; the burning skyline.<br><br>**The music:**<br>• The radio sound gives way to the full recording as the camera rises.<br>• The edit (210.6) is hidden inside the move.<br>• The vocal enters at `VOCAL` (217.7) as the wide reveals the scale of the defeat.<br>• The Director stays visible until he is one small detail. |
| **G — credits** | 3:50.4–4:18.0 | Fade to a near-black field, with the vocal continuing. A slow crawl carries the 2042 scenario text in large, sparse blocks, then **THE LAST CHOICE · A Future Got Weird film**, then the accurate music and production credits. The song ends after "It's been a long, long time" (253.8), fades by 255.5, and the card holds to 258. |

## Damage timeline (persists after it happens)

| Who | From | Marks |
|---|---|---|
| Director | start (B) | Left brow cut, dirt and dust, a torn right sleeve, the right palm bloodied from the rubble, and a bruise on the left cheek. The plate is strapped to the left forearm. |
| Director | BR1 | Plate dented. |
| Director | D3 (HEAVY2_FIRE) | Lip cut; plate cracked through. |
| Director | STRIKE | Plate shattered (fragments still strapped on). Stylised blood stain at his left side and abdomen, and blood at the mouth corner. He cannot stand again. |
| Tether (clerkA) | D1 | Dirt, torn trouser knee. |
| Tether | D3 | Cable cut; the reel hangs empty. |
| Tether | D4 | Disarmed, bruised cheek. |
| Decoy (clerkB) | D3 | Tablet and projector smashed; cut on the back of the hand. |
| Breaker (honest) | D3 | Gauge empty. |
| Breaker | D4 | Left leg hurt (limp); bleeding forearm. |
| Drone (checker) | D3 | Drone destroyed; the controller is kept. |
| Drone | D4 | Knocked down by the van; brow cut. |
| Runner (guesser) | D2 | Knocked back, then caught. |
| Runner | D4 | Struck down; stays down, alive. |
| Flares (host) | D3 | Brow cut from the blast; jacket torn. |

## Music map

The source, edit and anchors are in `production/MUSIC_CUE_SHEET_R2.md`.

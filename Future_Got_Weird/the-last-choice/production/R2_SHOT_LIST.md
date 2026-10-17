# THE LAST CHOICE R2 — shot list (staging plan)

- **Time and space.** Times are film seconds from `M` in `source/src/r2/timing.ts`. Positions are metres in the plan's world (`source/src/r2/world/plan.ts`; x = east, y = up, z = south). The enemy comes from the east.
- **Cameras.** Every camera is a physical position plus a target in that world, so geography holds across cuts.
- **Crew roles** (see `R2_BEAT_SHEET.md`):

  | Role | Cast | Tool |
  |---|---|---|
  | Director | clerkC, he | plate |
  | Tether | clerkA | tether |
  | Decoy | clerkB | tablet and projector |
  | Breaker | honest | breaker |
  | Drone | checker | allied drone |
  | Runner | guesser | halligan |
  | Flares | host | flares and smoke |

**Rules for every shot:**
- Intention before motion, consequence after. Every contact is shown: anticipation → contact → reaction → recovery.
- Wides for scale; closer angles for teamwork.
- Use low three-quarter views, diagonal movement and foreground occlusion. Reserve aerials.
- Screen direction:
  - Crew facing or advancing **east** is usually screen right.
  - When the camera crosses the line, re-establish the geography first: the ridge, crater, girder and skyline are the landmarks.

## A — New York falls (0.00–6.60)

| Shot | Time | Camera | Action |
|---|---|---|---|
| A1 | 0.00–6.60 | Aerial, ~150–180 m up over the west end of the district. The camera drifts east and down over damaged roofs, looking east along the avenue toward the skyline. Near roofs slide fast under the frame; the skyline moves slowly. | Fires on several blocks have specific sources, and smoke drifts north-east. Machine formations (light points and silhouettes) stream west along the avenue and the cross streets. **On `LOW_HIT` (0.72) the failing tower** (`PLAN.failingTower`, east-north-east) **begins to fall**: its top section tilts and drops, and a dust plume rises through the shot. |
| A_title | 6.60–9.30 | — | Black title card (built: `shots/A/Title.tsx`). |

## B — the Director stands (9.30–35.80)

| Shot | Time | Camera | Action |
|---|---|---|---|
| B1 | 9.30–12.40 (`SOLO`) | Ground level, 0.6 m from the rubble on the ridge crest, looking west across the debris. | Dust drifts. **His bloodied right hand** comes out from under a tilted slab and braces palm-down on concrete: fingers spread, the palm presses, chips skitter. His breath is audible. |
| B2 | 12.40–16.76 | Low, south of him (z +4), slightly below his level, looking north; he faces east (screen right). | **The rise**, in distinct poses: chest up out of the debris, a knee under him (by 14.0), weight onto his foot (by 15.3), a staggered push to standing (by 16.5), a hand on a rebar stub for balance. Effort shows in his face and breath. |
| B3 | 16.76–23.54 (`ORCH`) | Behind his left shoulder at 1.5 m, rising and swinging past his shoulder to a high over-shoulder wide. | **The reveal:** the crater and the army below. Ranks of combat units come out of the smoke, with drones low and heavies behind. `H1`/`H2` (18.46 / 18.88): a synchronized step, and eyes light in a ripple. |
| B4 | 23.54–27.00 (`H3`) | Long lens from inside the army (x ≈ 120, height 6 m), looking back west. | A heavy's head turns toward the camera's right in the foreground. Far away on the ridge crest, the tiny silhouette of the Director. |
| B5 | 27.00–30.26 | Medium close, low three-quarter front (east-south-east, below him, looking up and west). The western sun rims him. | He breathes, looks down at his left arm and pulls the plate's strap tight with his teeth and right hand. Below-left in frame, **the van at the ridge foot with the radio on its floor** is seen as a place, not an insert. |
| B6 | 30.26–35.80 (`H4`, `H5`) | **The lonely wide.** Low on the ridge's west slope behind him, looking east and up: he is small on the crest, the smoke-filled crater and the whole army beyond. | On `H4` and `H5a`/`H5b`, **the army halts as one**. Hold. |

## C — the Crew joins him (35.80–59.95)

| Shot | Time | Camera | Action |
|---|---|---|---|
| C1 | 35.80–38.46 (`BASS_OUT`) | Close profile, from the south. | The world goes quiet. He hears something behind him, and his head turns to the west. |
| C2 | 38.46–40.16 (`ALLY1`) | His POV, west, into smoke from the broken west ruin. | **The tether operator** (clerkA, visor) steps out of the smoke, launcher in hand. |
| C3 | 40.16–45.30 (`ALLY2a`/`b`) | Wider over his shoulder, west. | **The runner** vaults over a collapsed slab (screen left), and **the breaker** climbs up behind him carrying the breaker (screen right). The Director takes a breath of recognition. |
| C4 | 45.30–50.00 (`MARCH`) | Wide from the north side of the ridge. | The rest come from the edge of the street: **the decoy maker** with her tablet, **the drone pilot**, whose drone lifts off with a whine, and **the flare carrier** with a bag of flares and canisters. They climb onto the ridge. |
| C5 | 50.00–53.04 | Three short close-ups. | The breaker's hand rests on the Director's shoulder (hand contact, a look). The tether reel clicks and the drone rises past. The Director tightens his plate strap. |
| C6 | 53.04–59.95 (`ASSEMBLE`) | **Group frame.** Low wide from in front (east, below the crest) looking up at all seven on the crest, smoke and the dusk sky behind. | **The shared turn toward the enemy** on `ASSEMBLE`. Hold about 4 s. On the 57–59 build, the Director steps forward and the front ranks begin to move. |

## D1 — first breach (59.95–94.30)

| Shot | Time | Camera | Action |
|---|---|---|---|
| D1-1 | 59.95–64.00 (`CHARGE`) | Low at the ridge's south-east foot, looking north-west up at them. | They charge down the ridge diagonally past the camera, kicking up dust. |
| D1-2 | 64.00–68.30 | Tracking alongside the Director, south of him. | Running east across the avenue. The units' front line advances from screen right; the two lines converge. |
| D1-3 | 68.30–72.00 (`CLASH`) | **Wide** from the south sidewalk (z +28, height 3 m), looking north at the crater's west rim. | **The Director's plate slams into the first unit**, which staggers back into the next. Everyone engages. |
| D1-4 | 72.00–78.46 | Four close cuts. | 72.0: the breaker hits a knee joint (sparks; the unit drops to a knee). 74.0: the tether yanks one off balance. 75.8: the runner pries a back plate and rips cables. 77.2: the allied drone harries an enemy drone, and a flare blinds an eye. |
| D1-5 | 78.46–81.34 (`BR1`) | Low three-quarter. | A unit winds up and swings. **The Director blocks with the plate**: contact, the plate dents, and he slides back on his heels. |
| D1-6 | 81.34–82.80 (`BR2`) | Medium. | **The breaker smashes its chest plate**: armour flies and the unit reels. |
| D1-7 | 82.80–85.64 (`BR3`) | Wide-ish. | **The tether swings the toppling unit into the next**, and they crash together. |
| D1-8 | 85.64–89.78 (`BR4`) | Behind the Director. | **His shoulder-charge** drives the last unit in the line back into the crater. Through the gap: the crater and more machines. |
| D1-9 | 89.78–94.30 (`GAIN`, `BREATH`) | Low, at a fractured slab on the crater's west rim. | They push through and take cover behind the slab. `BREATH`: looks pass between them, the Director pants, his plate dented. |

## D2 — ingenuity (94.30–116.92)

| Shot | Time | Camera | Action |
|---|---|---|---|
| D2-1 | 94.30–95.38 | Medium. | The flare carrier pulls pins and lobs two canisters into the crater. |
| D2-2 | 95.38–99.50 (`DECOY`) | Insert on the tablet as her finger sketches four figures and taps, then a wide. | The projector clicks, and **giant walking light-figures appear on the white smoke**. |
| D2-3 | 99.50–102.20 (`DECOY_HIT a/b/c`) | Wide, then medium. | Units turn and strike at the light, drones dive through it, and a heavy fires into the smoke (a blast inside it). |
| D2-4 | 102.20–105.84 (`FLANK`) | Low three-quarter along the girder. | The Crew comes along the girder side and hits units from behind: the runner pries, the breaker hits, the Director bashes. |
| D2-5 | 105.84–110.46 (`TETHER`) | Wide on the girder. | **The tether operator clamps a damaged unit, runs the cable round a girder post, and the reel pulls.** The unit swings into another, and both slam into the girder in a big metal crash. |
| D2-6 | 110.46–113.20 (`KNOCKBACK`, `CATCH`) | Medium. | A backhand knocks the runner backward, and **the breaker catches him** (a two-person contact). |
| D2-7 | 113.20–116.92 (`SHIELD`, `COUNTER`, `BRIGHT`) | Medium, then wide. | **The allied drone hovers between the wounded runner and a unit's blow**, takes the hit and wobbles, sparking. **The Director bashes the unit down.** `BRIGHT`: they regroup at the rim, breathing — a moment of success. |

## D3 — the strongest attack; the system adapts (116.92–149.86)

| Shot | Time | Camera | Action |
|---|---|---|---|
| D3-1 | 116.92–121.00 (`P3`) | — | A flare and the allied drone blind a heavy's eye (flash). |
| D3-2 | 121.00–123.50 | — | The tether pins its front leg to the girder. |
| D3-3 | 123.50–125.64 | — | The breaker splits its knee joint (a big hit). |
| D3-4 | 125.64–128.02 (`HEAVY_DOWN`) | **Wide.** | The heavy topples across the crater: a huge crash and a dust wave. **This is the peak.** |
| D3-5 | 128.02–131.02 (`ADAPT`) | Follows it up. | A small drone climbs above the smoke. Its gimbal tilts and its eye snaps amber. It sees the Crew and the projector's source on the rim. |
| D3-6 | 131.02–133.82 (`FORMATION`) | **High wide.** | **All units re-form together from a line to an arc** around the Crew, in a ripple. Replacements step over wrecks; the before and after are visible. |
| D3-7 | 133.82–137.66 (`DECOY_FAIL`) | — | The decoy again, and **the units ignore it**, advancing on the source. A drone dives on the decoy maker and smashes the tablet and projector; the figures flicker out. |
| D3-8 | 137.66–141.18 (`FLANK_DENIED`) | — | Drones swarm the girder flank. One cuts the tether cable, which snaps, and she falls back. |
| D3-9 | 141.18–142.36 (`ALLY_DRONE_LOST`) | — | Two drones run down the allied drone; it crashes, smoking. |
| D3-10 | 142.36–145.18 (`HEAVY2`) | Low. | **A second heavy steps over the first**, and its foot comes down near the Crew. |
| D3-11 | 145.18–149.86 (`HEAVY2_FIRE`) | Wide, then inserts. | Its launcher blast hits the rim and the Crew are thrown back. The flare carrier is cut at the brow, the breaker's gauge reads empty (insert), and the Director gets up with a cut lip. |

## D4 — the last stand breaks (149.86–186.90)

| Shot | Time | Camera | Action |
|---|---|---|---|
| D4-1 | 149.86–154.50 (`P4`) | — | Fighting retreat west across the avenue toward the ridge. The arc tightens. The Director blocks, and the plate cracks through. |
| D4-2 | 154.50–158.50 | — | The runner is struck down and stays down, alive. The tether operator is disarmed. |
| D4-3 | 158.50–162.42 | — | At the ridge foot by the van they gather, exhausted. The Director looks at them and raises his arm. |
| D4-4 | 162.42–166.41 (`ARRIVAL`) | — | **The last counterattack:** the empty breaker swung as a club, a cable wrapped round a unit's legs, the last flare blinding the second heavy, the Director smashing through two units. |
| D4-5 | 166.41–170.40 (`LOCAL_WIN`) | — | The heavy staggers off a slab, and a gap opens: a breath of hope. |
| D4-6 | 170.40–175.04 (`REALIZE`) | **Wide.** | The ring is still closing on every side, formations stream past along the avenue, and drones hold above. Their faces register it. |
| D4-7 | 175.04–177.76 | — | The heavy recovers, and its ram winds up at **the drone pilot**, down by the van. The Director sees it and runs. |
| D4-8 | 177.76–179.30 (`STRIKE`) | — | He throws himself in front. **The ram meets the plate, the plate shatters, and he is thrown against the slab.** A clear cause and consequence, with no gore. |
| D4-9 | 179.30–183.30 (`SOFTEN`) | — | He slides down beside the van. The others are held back by units (grabs and pins). The drone pilot crawls toward him. |
| D4-10 | 183.30–186.90 (`FINAL_HIT`) | Wide. | The ring holds. On `FINAL_HIT` **every machine stops as one**. |

## E — he dies (186.90–199.30)

| Shot | Time | Camera | Action |
|---|---|---|---|
| E1 | 186.90–193.10 (Portals ring-out) | Close, low. | He sits against the slab by the van, fires behind. The drone pilot reaches him and takes his hand. His eyes try to focus on her, and his hand loosens. |
| E2 | 193.10–199.30 | Extreme close on his face (the approved face; no squash or swap). | A final small breath (~195.0). His eyes close (`EYES_CLOSE` 196.6). Stillness: wind, distant fire, subdued machines. |

## F — radio to city (199.30–230.40)

| Shot | Time | Camera | Action |
|---|---|---|---|
| F1 | 199.30–230.40 | **One continuous physical move.** | **Start on his still face.** Pan a short way to **the radio on the van floor** as the drone pilot's hand turns the knob: **click 199.9**, crackle, **trumpet 200.4**. Begin the **rising pullback** (~201.5). **The first wide frame holds both radio and body** (~203). Keep rising and pulling back past the companions, held inside a ring of units (the drone pilot kneeling, the breaker sitting, the others; the runner down), the wrecked machines, the crater, formations streaming along the avenue, drones in the smoke, and the burning skyline with the fallen tower. **The vocal (217.7) enters as the wide reveals the scale.** By ~228 he is a tiny detail. Fade to the credit field at 230.4. |

## G — credits (230.40–258.00)

Built: `shots/G/Credits.tsx`.

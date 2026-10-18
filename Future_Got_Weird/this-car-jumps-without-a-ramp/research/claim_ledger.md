# Claim ledger: This Car Jumps Without a Ramp

Every spoken line is listed with its basis. Kinds: **Fact** (sourced), **Demo** (what BYD's own demonstration shows,
a company demonstration rather than an independent test), **Physics** (textbook mechanics, simplified),
**Model** (what the animation's teaching model shows, labelled "SIMPLIFIED" on screen), **Framing** (editorial).

**Access note (18 Oct 2026).** This environment's network policy refused `www.byd.com`, `www1.grc.nasa.gov`,
`drive.google.com`, `www.youtube.com` and Wikimedia, so the cited pages could not be opened here. BYD's launch release
was checked through a web search of the same release (its Business Wire copy) and independent coverage; the NASA page
supports only textbook ballistic motion. The owner should open the three cited pages once before upload.

## Sources

| ID | Source | Used for |
|---|---|---|
| S1 | BYD, "YANGWANG Launched the U9, Priced at 1.68 Million RMB" (launch release, Feb 2024): https://www.byd.com/us/news-list/YANGWANG-Launched-the-U9-Priced-at-1-68-Million-RMB.html (same text: Business Wire, 25 Feb 2024) | DiSus-X is the U9's body control system; BYD says it improves handling under braking, acceleration, cornering and road impacts |
| S2 | BYD Japan, EV Tech Lab 03 (DiSus): https://www.byd.com/jp/ev-tech-lab/ev-tech03 and its video https://www.byd.com/material/byd-overseas-site/japan/lp/ev-tech-lab/v1/assets/video/ev-tech03.mp4 | The stationary hop shown in the opening and the replay (**not yet ingested**: see footage/README.md) |
| S3 | NASA Glenn, Beginner's Guide to Aeronautics, "Ballistic Flight Equations": https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ballistic-flight-equations/ | In simplified flight (aero forces neglected) gravity accelerates the object downward the whole time; vertical speed is zero at the top |
| S4 | Published U9 dimensions (4,966 × 2,029 × 1,295 mm, 2,900 mm wheelbase; tracks 1,719 / 1,676 mm), as listed by CnEVPost and Wikipedia | Proportions of the vector car only; no number is spoken or shown |

## Lines

| Line | Kind | Basis / handling |
|---|---|---|
| This car jumps without a ramp. Its suspension launches it. | Demo | S2: the car hops from flat pavement with no ramp; the hop is produced by the body control system. Shown as BYD's demonstration (credit chip on first use) |
| …the moment those tires leave the road, they lose their grip. | Physics | No contact, no friction force from the road. On screen: contact patches lit while grounded, removed at separation, "NO TIRE CONTACT" |
| This is BYD's Yangwang U9. | Fact | S1 |
| Ordinary springs store and release energy, while dampers control the motion. | Physics | Shown by a press-and-release test: the spring compresses (stores) and rebounds (releases); the damper settles the motion in about one and a half cycles. The spring is never shown as inert |
| …powered actuators can apply force between the wheels and body. | Fact (simplified) | S1 describes DiSus-X as an active body control system. Drawn as a functional actuator symbol beside the spring, with equal and opposite arrows on body and wheel. No hydraulic layout, reservoir or valve sequence is shown or claimed |
| During the launch, the tires push against the pavement, and the pavement pushes back. That upward force accelerates the car before takeoff. | Physics / Model | Force pair at the contact patches; the whole-car diagram shows only external forces (road force, gravity). Road force equals gravity at rest, exceeds it while the car accelerates upward (about 2.9× in the model), is zero in the air, returns on landing |
| Once the wheels lift clear, the ground stops pushing. Momentum carries the car upward while gravity slows it, then brings it back down. | Physics (S3) | Gravity arrow constant throughout, including at the apex where the motion arrow is zero. Flight is one uniform slow motion (labelled "SLOWED DOWN"), so up and down take equal time. Actuators draw no external force arrow in the air |
| The body tends to lean outward, loading the suspension differently on each side. | Physics / Model | Passive comparison (labelled) on the same road, speed and radius: about 3.6° of roll, the outside spring compressed, outside tyre loads larger |
| For the jump, the system lifts the car. Here, it adjusts forces across the suspension to oppose that lean. | Fact (S1, cornering) / Model | Jump pattern (both sides push) shown as a ghost; bend pattern: outside pushes, inside pulls; roll reduced to about 0.8°. The numbers are the model's, not U9 measurements, and are not shown |
| This is active body control. | Fact | S1 ("Intelligent Body Control System") |
| The point isn't to make the car float. It's to manage how the body moves while the tires deal with the road. | Framing | — |
| A flatter body, though, doesn't automatically mean more grip. | Physics | Load arrows stay unequal with the level body; label "TIRES STILL SET THE LIMIT". No claim that less roll increases grip |
| Brake hard, and the body tends to pitch forward. Active suspension can oppose that dive. | Physics / Fact (S1, braking) | Tyres supply the braking force (rearward arrows at the contact patches); front actuators push, rear pull; dive about 2.6° passive, 0.7° active in the model |
| Hit an uneven patch… without making the cabin copy every movement. That's a balancing act between body control, tire contact, and comfort. | Fact (S1, road impacts) / Model | Half-car model over a rough patch: in the model, active control lowers body acceleration about 18 % while the wheels move more; the cabin still moves (a wheel-vs-cabin trace shows both) |
| The system still has limited travel and force. It can't turn a rough road into a perfectly smooth one. | Physics / Model | In the model the active force is capped and a 13 cm bump reaches the travel stop (slowed down, "TRAVEL LIMIT") |
| …a level car doesn't make the corner disappear. Your body still needs a sideways force… The seat provides it. | Physics | The only arrow is the seat's force on the passenger, toward the centre of the turn. No outward "force" arrow |
| Body control isn't force cancellation. | Physics | Label "LESS LEAN, NOT LESS FORCE" |
| Watch the jump again. The suspension builds the launch while the tires are grounded. Then contact breaks, and gravity takes over the flight. | Demo / Physics | Real clip replayed once, then the same forces: the road-force arrow vanishes at separation while gravity remains (gravity was there throughout) |
| That hop is the spectacular part of the demonstration… The useful engineering is controlling body movement when you brake, turn, and hit uneven pavement. | Fact (S1) / Framing | S1 lists braking, acceleration, cornering and road impacts. No claim about why BYD developed the system, and no claim that jumping helps a car corner |
| A supercar can jump. Most of the time, its suspension has a much harder job: keeping it composed on the ground. | Framing | — |

## Claims deliberately left out (brief, "Engineering constraints")

No travel, lifting-speed, response-time or jump-height figures are spoken or shown. Search results disagree on travel
(75 mm in BYD's release versus other figures elsewhere) and none of the numbers helps the explanation. Also absent:
"no hydraulics", "zero body roll", "before your inner ear notices", "the biggest enemy of handling", "high-frequency
stress test", any claim that the hop measures response time or bandwidth, and BYD's design motivation. The moving
obstacle-avoidance demonstration (TechLinked's notes) is not used: it couldn't be accessed or checked here, and the
stationary clip carries the story.

## Teaching-model numbers (internal, not on screen)

Launch model (`source/src/sim/launch.ts`): sprung 2,100 kg, unsprung 380 kg, tyre clearance at the top of the hop
about 11 cm, peak road force about 2.9× the car's weight. Half-car (`source/src/sim/halfcar.ts`): travel −70/+80 mm,
active force capped at 7 kN per axle. These are round, plausible values chosen for readability; set the hop height to
match the real clip once the footage is in.

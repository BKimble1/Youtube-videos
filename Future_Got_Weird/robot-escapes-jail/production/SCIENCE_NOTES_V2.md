# SCIENCE NOTES V2: "Robot Escapes Jail" (MPTM, *Matter* 2023)

Owner: RESEARCH (V2). Where it differs from `SCIENCE_NOTES.md`, this file supersedes it (see §6, Corrections to V1).
Session date: 9 Nov 2026.

---

## 0. How the sources were consulted (read this first)

**I could not open any source page directly in this session**, despite trying several routes:

| Attempt | Result |
|---|---|
| `curl` to `api.crossref.org`, `www.ebi.ac.uk` (Europe PMC REST), `api.semanticscholar.org` | **Blocked.** The egress proxy returned `403` to CONNECT (policy denial). |
| WebFetch: Crossref API, Europe PMC REST, Semantic Scholar API, `www.cell.com/matter/fulltext/S2590-2385(22)00693-2` | **Blocked** with `getaddrinfo ENOTFOUND`. These hosts are outside the environment's network allowlist, which only allows temp.sh, ElevenLabs, nmt.edu and sites.google.com. |
| Request to add the publisher, press and coverage hosts to the allowlist (`update_environment`) | **Rejected** by the environments service. Nothing changed. |
| WebSearch (about 30 targeted queries) | **Worked.** The search tool returns extracts of indexed pages, including the **cell.com / ScienceDirect full text** and the **Supplemental Information PDF (mmc1)**. Some extracts contain exact sentences; others are the tool's paraphrase. |

Every claim below therefore comes from **search-engine extracts, not from pages I read myself**. Each claim carries one of these grades:
- **P-ext**: extract of the **primary** paper or its SI (cell.com, ScienceDirect, the mmc1 PDF), as returned by the search tool. Text in "quotes" is the sentence as rendered in that extract.
- **R-ext**: extract of the Cell Press **press release** (EurekAlert, ScienceDaily mirror) or of author quotes in it.
- **S-ext**: extract of **secondary** coverage (Science News, Smithsonian, PopSci, Vice and others).
- **Single**: only one source supports it, or the extracts disagree.

**What the creator may say:** "Checked against the paper's text and SI (via search extracts), the Cell Press release and reputable coverage." **What the creator may not say:** that the paper was read in full. Before publishing, someone with a normal browser should do the 5-minute check in §10 (all three items are open access).

**Hosts to allow** so a later session can read the sources directly: www.cell.com, www.sciencedirect.com, doi.org, api.crossref.org, www.ebi.ac.uk, europepmc.org, api.semanticscholar.org, www.eurekalert.org, www.sciencedaily.com, www.cmu.edu, www.sciencenews.org, www.popsci.com, www.smithsonianmag.com, www.iflscience.com, singularityhub.com, en.wikipedia.org.

---

## 1. The paper

Wang Q., Pan C., Zhang Y., Peng L., Chen Z., Majidi C., Jiang L. "Magnetoactive liquid-solid phase transitional matter." *Matter* **6**(3), 855–872 (issue of 1 March 2023; published online 25 January 2023). DOI 10.1016/j.matt.2022.12.003. Open access.
- **Affiliations** (P-ext / S-ext): Sun Yat-sen University (Shenzhen); The Chinese University of Hong Kong (Chengfeng Pan, who led the work); Carnegie Mellon University (Carmel Majidi, senior author); Zhejiang University.
- **Volume, pages and dates** (S-ext): "Matter 6, 855–872"; the issue is dated "March 1, 2023"; "researchers report January 25 in Matter".
- **Naming:** the paper calls the material **MPTM, "magnetoactive phase transitional matter"**, and the figure an "MPTM figurine molded in the shape of a Lego minifigure". The press release calls them "robots" and "person-shaped".

---

## 2. Verified claims, with evidence

### (1) Material

| Claim | Source | Grade | Quote / extract |
|---|---|---|---|
| NdFeB microparticles (~38 µm) mixed into pure gallium | SI (mmc1) https://www.cell.com/cms/10.1016/j.matt.2022.12.003/attachment/f791216e-44cf-4e98-9ad0-b6d56c0231ac/mmc1 | P-ext | "The NdFeB magnetic particles (average diameter: 38 μm; Magnequench, China) were mechanically mixed with pure gallium (purity of 99.9%) using a mortar and pestle in air." |
| Ratio 1:9 | same SI | P-ext | "The ratio of magnetic particles to pure gallium is 1:9." **The extract does not say whether this is by mass or by volume**, so do not write "10 % by mass". |
| The particles do not alloy with the gallium; they stay a separate phase | paper | P-ext | "The NdFeB particles are embedded within the gallium matrix without alloying, indicating clear phase separation of the NdFeB and gallium." |
| In the solid, the particles keep their magnetisation | paper | P-ext | Remnant magnetisation 12 emu/g, coercivity 10,200 Oe (the solid gallium holds the particles in place, so polarity is fixed). |
| Inspired by the sea cucumber | paper / release | P-ext, R-ext | "the sea cucumber can reversibly alter the stiffness of its tissue to improve its load capacity" |

**What to show:** a silver gallium matrix with **distinct embedded particles that stay solid** (not dissolved, not alloyed). At ~38 µm the particles are invisible to the eye, so show them only in a magnified cutaway.

### (2) Melting points

| Claim | Source | Grade | Quote / extract |
|---|---|---|---|
| Gallium melts at 29.8 °C | press release https://www.eurekalert.org/news-releases/977155 ; paper | R-ext, P-ext | "gallium, a metal with a very low melting point (29.8 °C)". The paper chose gallium "because its melting point (29.8 °C) … is close to room temperature". |
| The composite melts at 30.6 °C | paper (ScienceDirect) / SI | P-ext, **single** | One extract: "the NdFeB-Ga composite … melting point 30.6 °C". A second, narrower query did **not** surface it. Treat 30.6 °C as probable, and label only "GALLIUM 29.8 °C" on screen. |
| The composite re-solidifies at 17.4 °C; pure gallium supercools to −14.5 °C | paper (DSC) | P-ext | "the solidification point of the MPTM is 17.4°C, which is much higher than that of pure gallium (−14.5°C)". The NdFeB particles act as nucleation sites. |
| A higher-melting variant, **MPTM-46** (In53Bi25Sn14Ga8), melts at **45.6 °C** | paper | P-ext | "MPTM-46 … high-melting-point alloy In53Bi25Sn14Ga8 … melting point of 45.6°C". It was chosen to sit above stomach temperature, "expected to be in the range of 37.5°C–38°C". The SI says AMF heated MPTM-46 "from 37 °C to 46 °C". |

### (3) Heating and cooling

| Claim | Source | Grade | Quote / extract |
|---|---|---|---|
| The phase switches by AMF heating or by ambient cooling | paper (abstract / summary) | P-ext | "MPTMs can reversibly switch between solid and liquid phase by heating with alternating magnetic field or through ambient cooling." |
| The AMF runs at 50 kHz from a commercial induction heater | SI | P-ext | "The frequency of AMF is 50 kHz during heating." "The MPTM was wirelessly heated using a ZVS high-frequency induction heating device (HG-3KW; Qingdao Huguang Electronics)." |
| The heating is by induction | release (Majidi) | R-ext | "The magnetic particles here have two roles. One is that they make the material responsive to an alternating magnetic field, so you can, through induction, heat up the material and cause the phase change." |
| The field induces currents in the gallium | Science News https://www.sciencenews.org/article/robot-shape-shifting-gallium-melt-reform-magnetic-fields | S-ext | Paraphrase: an oscillating field induces electric currents in the gallium, which heats it until it melts. |
| Heating is wireless and works through surfaces | coverage quoting Majidi | S-ext | "it's totally wireless and can penetrate through surfaces, so it doesn't require direct line of sight" |
| Unlike earlier phase-change materials, no external heater is needed | release | R-ext | earlier materials "rely on heat guns, electrical currents, or other external heat sources" |
| Timing | paper (figure captions) | P-ext | The ball-swallowing trial reached the liquid state at "t = 65 s", and an IR heating run lasted 80 s. Smaller pieces melt more slowly because they lose proportionally more heat. **Melting takes about a minute, not an instant.** |
| "Solid again ~80 s after the field is switched off" | Daily Telegraph syndication | S-ext, **single** | Do not use as a number. |

**What to show:** the heater is an **induction coil / AC field source** (orange). Cooling is **passive, in room air**: no fan, no ice, no "magnet cools it". The steering magnet is a **separate** object.

### (4) Magnetic actuation, solid and liquid

| Claim | Source | Grade | Quote / extract |
|---|---|---|---|
| Solid-state performance | paper (abstract / highlights) | P-ext | "high mechanical strength (strength, 21.2 MPa; stiffness, 1.98 GPa), high load capacity (able to bear 30 kg), and fast locomotion speed (>1.5 m/s) in the solid phase"; "jumping up to 20× body length"; rotation up to ~1,500 rpm. |
| Liquid-state adaptability | paper (abstract) | P-ext | "excellent morphological adaptability (elongation, splitting, and merging) in its liquid state" |
| Elongation and splitting by magnets | paper (main text) | P-ext | "Liquid MPTMs can also perform splitting by using two magnets. Instead of a single magnet applied at one end (as is used for elongation), two magnets at both ends are applied to continuously stretch the liquid MPTM and finally rupture the droplet at the middle to form two smaller droplets. A liquid MPTM was split into two smaller ones, which then transitioned into the solid phase." Merging is described in the same passage. |
| A liquid is hard to drive along a path | paper | P-ext | In the path test, "a liquid-phase MPTM is observed to hardly move." Liquid steering works by elongating and pulling it, not by driving it around. |
| The solid carries load; the liquid does not | paper (figure caption) | P-ext | Solid MPTM supports a 200 g weight; liquid MPTM cannot. |
| A static magnet or field gradient moves it, which is a different job from the AMF | release (Majidi) | R-ext | "the magnetic particles also give the robots mobility and the ability to move in response to the magnetic field" |
| A permanent magnet steers it | Science News | S-ext | Paraphrase: magnetic particles sprinkled through the gallium let a permanent magnet guide it. |

### (5) The cage demo (Figure 1E / Video S2)

| Item | Source | Grade | Quote / extract | Status |
|---|---|---|---|---|
| What escaped, and how | paper (main text) | P-ext | "As shown in Figure 1E, a MPTM figurine molded in the shape of a Lego minifigure escapes from a cage by transitioning to a liquid phase and being pulled through the cage bars by an external magnetic field." | **Confirmed** |
| How its shape came back | paper (next sentence) | P-ext | "… the liquid MPTM restores its original shape by flowing into a mold." Fig. 1E caption: "solid-liquid transformation … to get out of a cage and restore its original shape". | **Confirmed: a mold** |
| Who reshaped it | Vice (Majidi) https://www.vice.com/en/article/scientists-made-a-liquid-metal-robot-that-can-escape-a-cage-like-a-t1000-terminator/ ; PopSci https://www.popsci.com/technology/magnetoactive-liquid-metal-demo/ | S-ext (quoting the author) | Vice: the robot "appears to self-coalesce … Majidi clarified that it was manually recast by the team and then put back into the shot." PopSci (Majidi): the recast happens at a cut where "someone pauses the camera". | **Confirmed: people, off camera** |
| A mold waited outside the cage | Singularity Hub https://singularityhub.com/2023/02/01/watch-this-shape-shifting-robot-melt-to-escape-a-cage-then-reform/ | S-ext | "there was a mold waiting for it outside the cell" (wording not re-confirmed this session) | Probable |
| How it was heated in the demo | PopSci (Majidi) | S-ext | The figure liquefies "before being drawn through the mesh barrier via alternating electromagnetic currents". | Consistent with AMF induction |
| The bars were too narrow for the solid figure | IFLScience https://www.iflscience.com/shape-shifting-robot-escapes-miniature-prison-cell-by-liquifying-before-re-solidifying-67249 | S-ext | "escaping from a miniature jail cell with bars too close together to allow it to leave in solid form" | **Confirmed (secondary)** |
| Video title | YouTube upload https://www.youtube.com/watch?v=xv-t2Y9hp2A | search listing only | "Magnetoactive Phase Transitional Matter Molded in Shape of Lego Figure Escapes from Cage" | Not watched |
| **Size** of the figure | Fanatical Futurist: ~5 mm × 1 cm. DOGOnews-quoted report: "11-millimeter humanoid". Daily Beast: "only a few millimeters tall". | S-ext, conflicting | None from the paper | **Unverified.** "About a centimetre" is the consensus. Put no number on screen. |
| **Cage material, bar spacing, door or lock** | none | — | Coverage only says "cage", "bars", "grid", or "mesh barrier" (PopSci). Euronews says "metal bars" (secondary). | **Unverified.** Draw a generic small lab cage: no "metal cage" label and no padlock on the lab cage. |
| Video speed | V1 notes said "sped up" | not re-found this session | — | **Unconfirmed.** Do not tag "REAL TIME". |
| The solid figure was pressed against the bars first (V2 brief, LB) | none | — | Not reported. | Undocumented. A short explanatory beat is acceptable because the bars are too narrow for the solid figure, but it is not something the lab showed. |

### (6) Medical demos (model stomach only)

| Claim | Source | Grade | Quote / extract |
|---|---|---|---|
| Two demos, both in a model stomach | paper (highlights) | P-ext | MPTMs "remove foreign objects or deliver drugs in a model stomach" |
| Foreign-body removal sequence | paper | P-ext | "The solid MPTM can move quickly to the location of a foreign object (a ball), transition into the liquid phase and encompass the object, transition back to the solid phase, and remove the object from the stomach." Caption: "MPTM is transitioned to liquid phase by AMF heating followed by the deformation of the machine to swallow the object (diameter of the ball is 6 mm) (t = 65 s)." |
| The model is an in-vitro, water-filled "stomach-like structure" | paper | P-ext | in vitro test in "a stomach-like structure filled with water" |
| The ball was steel | Daily Beast | S-ext, **single** | "wrapped itself around a steel ball". Do not label the material; "a small ball" is safe. |
| Drug delivery | paper | P-ext | The model drug was **fluorescein sodium**, mixed 1:1 with sucrose. The capsule carries it to the target, melts under the AMF to release it (about 98 s, approximate), re-solidifies and leaves. The **MPTM-46** variant (melts at 45.6 °C) also released the drug. |
| Proof of concept only | release (Majidi) | R-ext | "What we're showing are just one-off demonstrations, proofs of concept, but much more study will be required to delve into how this could actually be used for drug delivery or for removing foreign objects." "Future work should further explore how these robots could be used within a biomedical context." |
| Pure gallium would melt in the body | Science News, Singularity Hub | S-ext | "pure gallium would quickly melt inside a real human body"; bismuth and tin would be added "to raise the material's melting point" |
| Open questions remain | Science News (Amir Jafari, UNT, not involved in the work) | S-ext | Questions remain about biomedical use. |

**Still hypothetical:**
- any use in a living body;
- tracking and steering at clinical depth;
- biocompatibility of gallium and NdFeB;
- autonomous re-shaping;
- any human or animal test.

No in-vivo or ex-vivo work was reported.

### (7) Other verified demos for the "technology becomes stranger" shot (FU)

| Demo | Evidence | What exactly happened | Use in V2? |
|---|---|---|---|
| **Split and merge (liquid)** | P-ext (quote in §4) | Two magnets at opposite ends stretch a liquid droplet until it ruptures into two droplets, which can then solidify. Merging is also shown. | **Best choice.** It is liquid-only, comes from the paper's own text, and looks strange. Show **two magnets**. |
| **Elongation (liquid)** | P-ext | A single magnet at one end stretches the liquid. | Yes, as the lead-in to the split. |
| **Jump over a moat (solid)** | R-ext: "with the aid of a magnetic field, the robots jumped over moats, climbed walls, and even split in half to cooperatively move other objects around before coalescing back together". P-ext: "jumping up to 20× body length". | A solid piece leaps a gap under a magnetic field gradient. | Yes. It is solid-state, so show a magnet above or ahead of it. |
| **Climb a wall (solid)** | R-ext (same sentence) | | Yes, with a magnet shown. |
| **Split halves move an object together, then merge** | R-ext only; one extract was unclear whether this was actually demonstrated | | Only as part of "split and merge"; do not make cooperative transport a hero beat. |
| **Smart soldering / circuit assembly** | P-ext: MPTMs "solder electronic components and assemble parts in hard-to-reach space". S-ext (Technology Networks): "Ambient cooling enabled the liquid to solid phase transition of MPTMs in order to complete the soldering of the LED pins and circuit pads … the team created a fully functional LED circuit." | The material is steered onto the pads, melted, then cooled into a joint, and the LED lights. | Yes: strange and true. |
| **Universal screw** | P-ext: "MPTMs fill threaded holes to connect polymer plates in confined spaces"; "a structure assembled with two MPTMs able to bear a load weighing 10 kg". | Liquid flows into threaded holes, solidifies into a fastener and joins two plastic plates. | Yes. If any number is shown, use **10 kg**. |
| **Fast solid locomotion (>1.5 m/s) and rotation** | P-ext | | Background energy only. |
| **Narrow channel, "1.5 mm diameter"** | ResearchGate summary only; not found in the paper extracts | | **Avoid as a specific claim.** A generic "steered past an obstacle" shot is fine **with no label or number**. |

---

## 3. The six distinctions in DIRECTION_V2.md §9

| # | Distinction | Status | Evidence |
|---|---|---|---|
| 1 | The experiment did not demonstrate an autonomous humanoid robot escaping prison | **Confirmed** | The paper's subject is a material, an "MPTM figurine molded in the shape of a Lego minifigure" (P-ext). It has no onboard power, sensing or control, and it was "pulled through the cage bars by an external magnetic field" (P-ext). Coverage: the robots "still need an external heater and an external magnetic field" (S-ext). |
| 2 | The material is controlled externally | **Confirmed** | Heating is an external, wireless AMF (P-ext; SI: 50 kHz induction heater). Motion comes from external magnets (P-ext, R-ext). |
| 3 | Magnetic particles allow magnetic manipulation | **Confirmed** | Majidi's "two roles" quote (R-ext): the particles make it respond to the AMF (heating) **and** "give the robots mobility". |
| 4 | Heating and cooling govern the phase transition | **Confirmed** | "heating with alternating magnetic field or through ambient cooling" (P-ext); it solidifies at 17.4 °C (P-ext). |
| 5 | Passing through a barrier does not establish autonomous shape restoration | **Confirmed** | "restores its original shape by flowing into a mold" (P-ext); "manually recast by the team and then put back into the shot" (Majidi via Vice, S-ext). |
| 6 | The experimental material is not a fully functioning liquid-metal robot | **Confirmed** | "Just one-off demonstrations, proofs of concept" (R-ext). The paper calls MPTM "matter" and "machines" moved by external fields; it has no electronics and no autonomy. |

---

## 4. Narration lines, checked against the locked script

| Line | Verdict | How to frame the visual |
|---|---|---|
| "This robot escaped JAIL… by MELTING." | Matches the press release's own framing ("person-shaped robot … escape jail"). OK. | The hook is a dramatization: tag it "STYLIZED RECREATION". |
| "Scientists locked it inside a tiny cage." | OK. "Tiny" is confirmed, and no cage material is claimed. | A generic lab cage with no padlock (the padlock belongs only to the jail dramatization). |
| "But instead of breaking the bars… It MELTED." | OK. | AMF/induction coil heating. The real melt takes about a minute, so compressing time is fine. |
| "Its entire body turned into liquid metal." | OK as a simplification: it becomes liquid gallium carrying solid particles. | Show the particles suspended in the liquid in the cutaway. |
| "Then it slipped straight through the bars." | OK, though in fact it was **pulled** by an external field. | Show the external magnet outside the cage; tag "EXTERNAL MAGNETIC CONTROL". |
| "Then scientists collected the metal and molded it back into shape." | **Accurate** (paper and Majidi). | Show a mold, human hands and cooling in air; tag "RECAST IN A MOLD". |
| "It's made from a metal that melts near body temperature." | OK. Gallium melts at 29.8 °C, about 7 °C **below** 37 °C. | Gauge with GALLIUM 29.8 °C below BODY 37 °C. Never "melts at body temp". |
| "And magnets help control its movement." | Accurate. | Magnet → particles → material, with the heater kept separate. |
| "Scientists are exploring whether robots like this could one day retrieve objects from inside your body." | Accurate as "exploring": only model-stomach demos exist. | "LAB DEMONSTRATION · STOMACH MODEL", then "FUTURE IDEA" on the body outline. |
| "Even prison bars can't stop a robot anymore." | A joke, inside the dramatization. | Stylized robot only. |

---

## 5. Notes on the V2 shot plan (V2_BRIEF.md)

**H1 and J1 (stylized robot with eyes):**
- Fine as a metaphor.
- Keep "STYLIZED RECREATION" on screen at least through the reform (1.45–2.0 s). That instant reform is the one thing the real experiment did **not** do.

**LB:**
- An induction coil under or around the stage fairly depicts the "ZVS high-frequency induction heating device". The extracts don't give the real coil geometry, so a generic copper coil is safe.
- Make the melt gradual. A magnet **outside the cage** pulls the liquid through, which matches the paper.
- The "solid figure clunks against the bars" beat is unreported. Keep it brief so it reads as "the bars are too narrow" (confirmed), not as a documented step.

**MS:**
- Pipette collection is invented. It is allowed because the narration says "collected", and the paper and Majidi say mold plus manual recast. Showing the liquid **guided into a mold sitting outside the cage** is closest to the paper.
- Cooling happens in **room air**.
- Cutaway: a gallium matrix with solid NdFeB particles.
- Gauge: 29.8 °C vs 37 °C.

**FU:**
1. For the first beat, prefer **split and merge with two magnets** (P-ext) or the **moat jump / wall climb** (R-ext) over the unverified "narrow channel". An unlabeled "steered around an obstacle" shot is also fine.
2. Stomach model, in this order: solid device, ball (6 mm in the paper), AMF melt, engulf, re-solidify, magnet moves it out. This matches P-ext. An optional drug-delivery beat (capsule melts and releases a yellow-green dye) would be honest, because fluorescein is yellow-green.
3. Body outline tagged FUTURE IDEA.

**Throughout:** never give the lab material eyes, a face or a brand. The paper says "Lego minifigure", but V2 must not draw LEGO trade dress; use a generic blocky figure.

---

## 6. Corrections to V1 `SCIENCE_NOTES.md`

1. **Load claim.** V1 §4 says "bearing about 30× its own mass (press release)". The **paper's abstract** says "able to bear **30 kg**" (solid phase). "30× its own weight" appears in coverage and possibly in a caption. The two figures describe different measurements. **Put neither on screen.**
2. **Higher-melting alloy.** V1 §7 says a body-safe alloy above 37 °C is "proposed, not tested". In fact the paper **tested MPTM-46** (In53Bi25Sn14Ga8, mp 45.6 °C) for drug release in the in-vitro model stomach, so a higher-melting composition *was* demonstrated in the lab. Still untested: body safety, in-vivo use, and the Bi/Sn route for retrieval.
3. **Stomach demo details.** The model is a "stomach-like structure filled with water". The ball was **6 mm** in diameter and the trial reached liquid at t = 65 s. The model drug was **fluorescein sodium** plus sucrose. V1's "small ball" remains true; "steel ball" comes only from the Daily Beast.
4. **Citation.** Add volume, issue and pages: *Matter* 6(3), 855–872 (1 Mar 2023). The online date of 25 Jan 2023 stands.
5. **Verified numbers V1 lacked:**
   - jumping up to **20× body length**;
   - **>1.5 m/s** solid locomotion;
   - **21.2 MPa** strength (tensile) and **1.98 GPa** stiffness;
   - the solid supports 200 g but the liquid does not;
   - the paper's own **splitting** text (two magnets).
6. **Composite mp 30.6 °C.** V1 cited it from the SI. This session confirmed it in only one of two extracts, so call it probable and use 29.8 °C (gallium) on screen.
7. **"Video sped up".** Not re-found this session. Downgrade to unconfirmed and do not use it as a tag.
8. **Figure size.** V1's ~1 cm × 5 mm is from secondary sources, and other secondary sources say "11 mm" or "a few millimeters". It remains **unverified**.
9. **Method.** As in V1, direct fetches were blocked (see §0). V2 adds extracts of the paper's own main-text sentences, which V1 did not have: the Figure 1E text, the splitting passage, the stomach caption and the MPTM-46 passage.

---

## 7. Labels and visuals: allowed and avoid

**Allowed labels.** Keep them short, and use them only where they prevent a misleading impression:
- `STYLIZED RECREATION` (H1/J1, especially over the instant reform)
- `LAB DEMONSTRATION`
- `AC FIELD HEATS IT` / `INDUCTION HEATING`
- `EXTERNAL MAGNETIC CONTROL` / `MAGNET STEERS IT`
- `RECAST IN A MOLD` / `RESHAPED IN A MOLD`
- `COOLS → SOLID` (room air)
- `GALLIUM` + `MAGNETIC PARTICLES` (or `NdFeB PARTICLES`)
- `GALLIUM MELTS 29.8 °C` and `BODY 37 °C`
- `STOMACH MODEL` / `LAB DEMONSTRATION · STOMACH MODEL`
- `FUTURE IDEA` / `NOT TESTED IN HUMANS` / `PROOF OF CONCEPT`
- Optional numbers (paper-verified): `JUMPS 20× ITS LENGTH`, `SCREW HOLDS 10 kg`

**Allowed visuals:**
- an induction coil with an orange AC glow as the heat source;
- a separate permanent magnet as the steering source;
- particles suspended in the liquid;
- gradual melting;
- liquid stretching and necking toward a magnet;
- two magnets splitting the liquid into two droplets that later merge;
- a solid piece jumping a moat or climbing a wall near a magnet;
- an LED lit through a solder joint;
- liquid filling a threaded hole to make a screw;
- a ball engulfed inside a clear, water-filled, stomach-shaped model.

**Avoid:**
- `MELTS AT BODY TEMPERATURE` (it melts **below** body temperature).
- `SELF-REFORMS`, `REBUILDS ITSELF`, `REMEMBERS ITS SHAPE`, or any hint of shape memory.
- `METAL CAGE` (unverified), and any cage dimensions or bar spacing.
- `MAGNET COOLS IT`; cooling by fan, ice or cold spray; heating by flame, hot plate or heat gun.
- A single object shown as both heater and steering magnet. Keep the two jobs visibly separate.
- `AUTONOMOUS`, `AI`, `THINKS`, `CHOOSES`; eyes or a face on the lab material.
- `IN VIVO`, `PIG STOMACH`, `TESTED IN PATIENTS`, `INSIDE A HUMAN` (except under `FUTURE IDEA`).
- `NARROW 1.5 mm CHANNEL`, or any channel diameter.
- `30× ITS WEIGHT` / `CARRIES 30 kg` (ambiguous; see §6.1).
- The figure's size as a number (`1 cm`, `11 mm`).
- `REAL TIME` / `SPED UP` (unverified either way).
- LEGO branding or trade dress.
- An instant melt presented as if it were real time. Label the lab section as a demonstration and keep the stylization obvious.

---

## 8. Open items (still unverified after this session)

- Exact figure size, cage material, bar spacing and construction, and the playback speed of Video S2.
- Whether the 1:9 ratio is by mass or by volume.
- The exact wording of the "30× own weight" passage.
- Whether, in the paper, the split halves actually moved an object together (the press release says so).
- The 1.5 mm channel figure (ResearchGate summary only).

## 9. References

1. Wang, Q., Pan, C., Zhang, Y., Peng, L., Chen, Z., Majidi, C., & Jiang, L. (2023). Magnetoactive liquid-solid phase transitional matter. *Matter*, 6(3), 855–872. https://doi.org/10.1016/j.matt.2022.12.003. Full text: https://www.cell.com/matter/fulltext/S2590-2385(22)00693-2 ; ScienceDirect: https://www.sciencedirect.com/science/article/pii/S2590238522006932 *(consulted via search extracts)*
2. Wang, Q., et al. (2023). Supplemental Information for ref. 1 (Document S1: Figures S1–S19, Tables S1–S2; Videos S1, S2 …). https://www.cell.com/cms/10.1016/j.matt.2022.12.003/attachment/f791216e-44cf-4e98-9ad0-b6d56c0231ac/mmc1 *(search extracts: 38 µm NdFeB, 99.9 % Ga, 1:9, 50 kHz, ZVS HG-3KW)*
3. Cell Press (25 Jan 2023). "Watch this person-shaped robot liquify and escape jail, all with the power of magnets." EurekAlert! https://www.eurekalert.org/news-releases/977155 ; mirrors: ScienceDaily https://www.sciencedaily.com/releases/2023/01/230125121555.htm , TechXplore https://techxplore.com/news/2023-01-person-shaped-robot-liquify-power-magnets.html *(search extracts)*
4. Science News (Jan 2023). "These shape-shifting devices melt and re-form thanks to magnetic fields." https://www.sciencenews.org/article/robot-shape-shifting-gallium-melt-reform-magnetic-fields *(search extracts)*
5. Smithsonian Magazine (Jan 2023). "This Shape-Shifting Robot Can Liquefy Itself and Reform." https://www.smithsonianmag.com/smart-news/this-shape-shifting-robot-can-liquefy-itself-and-reform-180981515/ *(search extracts)*
6. Popular Science (Jan 2023). "Watch this material melt like the T-1000 in 'Terminator 2'." https://www.popsci.com/technology/magnetoactive-liquid-metal-demo/ *(Majidi on the off-camera recast; search extracts)*
7. Vice (Jan 2023). "Scientists Made a Liquid Metal Robot That Can Escape a Cage Like a Terminator." https://www.vice.com/en/article/scientists-made-a-liquid-metal-robot-that-can-escape-a-cage-like-a-t1000-terminator/ *("manually recast by the team")*
8. Singularity Hub (1 Feb 2023). "Watch This Shape-Shifting Robot Melt to Escape a Cage, Then Reform." https://singularityhub.com/2023/02/01/watch-this-shape-shifting-robot-melt-to-escape-a-cage-then-reform/
9. IFLScience (Jan 2023). "Shape-shifting Robot Escapes Miniature Prison Cell By Liquifying Before Re-solidifying." https://www.iflscience.com/shape-shifting-robot-escapes-miniature-prison-cell-by-liquifying-before-re-solidifying-67249
10. Technology Networks (Jan 2023). "This Metal Robot 'Shapeshifts' Between Solid and Liquid To Escape Tight Spaces." https://www.technologynetworks.com/applied-sciences/news/this-metal-robot-shapeshifts-between-solid-and-liquid-to-escape-tight-spaces-382958 *(soldering, screw)*

## 10. Five-minute manual check before publishing (all open access; needs a normal browser)

1. Ref. 1, the Figure 1E caption and the "Lego minifigure" paragraph: confirm "pulled through the cage bars by an external magnetic field" and "flowing into a mold".
2. Ref. 1, the foreign-body and drug-delivery figure: the 6 mm ball, and MPTM-46 at 45.6 °C.
3. Ref. 2 (SI), page 1 (methods): the 1:9 ratio (by mass?), 50 kHz, and the composite mp of 30.6 °C.

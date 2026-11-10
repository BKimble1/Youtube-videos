# Robot Escapes Jail V2: changes, QA and references

Review file: `exports/FGW_Robot_Escapes_Jail_V2_REVIEW_1080x1920.mp4`. It is 1080×1920, 30 fps, H.264 with AAC, and 32.40 s long (972 frames, the narration's real length). It has not been published or uploaded.

V2 is a separate composition, `RobotJailV2` (`source/src/v2/`). V1 is preserved: its composition, its source files and `exports/FGW_Robot_Escapes_Jail_V1_REVIEW_1080x1920.mp4` are unchanged.

## 1. Narration: unchanged

- V2 uses the approved V1 master byte for byte: `audio/narration/FGW_Robot_Escapes_Jail_narration_V1.wav`. Its sha256 is `afa5f2cd1608a186d362bbf451939fe231d6ecf9545f2521142d2293f7d8794e`, the same hash recorded when V1 was made. It is 48 kHz, 24-bit mono and 32.40 s long.
- Nothing was regenerated, edited, shortened or shifted. The mixer places the voice sample-exactly (measured lag 0 samples).
- Every V2 beat is keyed to the measured word times of that file: `src/data/timeline.json`, which `src/story.ts` (`T`) and `src/v2/story2.ts` read. The captions are the same phrase timeline, word for word.
- The creator's V2 timeline was "approximate and must be synchronized with the narration". Its beats were placed on the sentences they illustrate (table below). For example, the material cutaway falls on "It's made from a metal…" rather than 0:05–0:08, where the narration says "Scientists locked it inside a tiny cage."

## 2. Scene by scene (V1 → V2)

| t (s) | Narration | V1 | V2 |
|---|---|---|---|
| 0–3.40 | "This robot escaped JAIL… by MELTING." | Wide jail. The robot was already half-melted (goo-filter liquid). The guard dropped his coffee and the camera whipped to a splash. | **Hook, rebuilt.** An extreme close-up from frame 0: the robot grips two thick bars with its face already pressing into the too-narrow gap. Its head and shoulders turn to liquid, then a rope of metal goes through the gap and swells outside. The whole body follows in one continuous shot while the camera cranes so inside → outside reads left to right. It collects as one living lump, rises as a liquid column, and snaps back into its exact shape outside the cell about when "JAIL" ends. Then it blinks and stares at the viewer. Pull back: the cell is still padlocked, with silver smears on the bars. A motivated push into its chrome dome takes the camera into the metal. Tag: "STYLIZED RECREATION". |
| 3.40–13.67 | "Scientists locked it inside a tiny cage. / But instead of breaking the bars… It MELTED. / Its entire body turned into liquid metal. / Then it slipped straight through the bars." | A flashback of the stylized robot in the jail, plus a melt and puddle with a guard. | **The real lab demonstration.** The camera comes out of the metal surface onto a minifigure-shaped figure (no face, no brand) in a tiny lab cage, and the lid closes on "cage". An external magnet drags the *solid* figure against the bars: rigid, it knocks and cannot pass. The AC induction coil energizes ("AC FIELD HEATS IT"): the figure sags, its structure gives way and it spreads into a pool as one volume-conserving transformation, while the camera goes from medium to close. The camera then rises to an angled overhead view. The magnet outside pulls the liquid into continuous streams through three bar gaps, and it collects outside ("EXTERNAL MAGNETIC CONTROL"). Tag: "LAB DEMONSTRATION". |
| 13.67–17.10 | "Then scientists collected the metal and molded it back into shape." | Lab dish, pipette, mold. | Same lab, continuous: a gloved hand and a pipette draw the puddle up and fill a minifigure mold. It cools in room air (not ice), then the hand opens the mold to show the re-formed figure ("RECAST IN A MOLD"). |
| 17.10–22.56 | "How? It's made from a metal that melts near body temperature. And magnets help control its movement." | Science cutaway (grains, thermometer, magnet). | A push into the figure's surface: the camera enters the metal, which becomes a magnified gallium matrix with embedded magnetic particles ("GALLIUM", "+ MAGNETIC PARTICLES"). A gauge rises past "GALLIUM MELTS 29.8 °C", which sits below "BODY 37 °C", with the AC coil as the heat source. Then field lines run through the metal, the camera pulls back to reveal the magnet, and the magnet leads the drop: field → particles → material moving. |
| 22.56–27.90 | "Scientists are exploring whether robots like this could one day retrieve objects from inside your body." | Stomach model, then a ghost body. | Three connected shots: (1) a magnet steers the material through a narrow channel ("MAGNET STEERS IT"). (2) The stomach-model lab demo ("STOMACH MODEL · LAB DEMO"): the device is steered to a small ball, melted around it by the AC field, re-solidifies and is pulled out by the magnet. (3) A ghosted human outline, "FUTURE IDEA". The material never has eyes. |
| 27.90–32.40 | "So apparently… Even prison bars can't stop a robot anymore." | The guard stares, a droplet with eyes, an eye-matched loop. | **Comic escalation and a seamless loop.** A shape match cut from the retrieved silver sphere to the robot's round head at the same spot and size (540, 900, r 130). It is back in a cell whose security has been absurdly escalated (chains, a stack of padlocks), with the Weird Crew guard deadpan with his coffee and the robot's deadpan look at us. "Even prison bars…": it walks up and grips two bars. "can't stop a robot anymore": the camera moves into exactly frame 0's framing, so the last frame flows into the first. |

## 3. Significant improvements, with timestamps

| t (s) | Improvement |
|---|---|
| 0.00 | The first frame is the payoff: an extreme close-up of the robot gripping the bars, face pressed into the gap, eyes on the viewer (V1 opened wide). |
| 0.00–1.20 | **New liquid-metal engine.** Signed-distance shapes are contoured each frame into crisp vector outlines, with chrome bands, rim, horizon reflection and speculars drawn from the same shape, so reflections move with the surface. Total area is held within about 1% while the metal compresses through the gap. Streams are continuous, droplets stay attached or merge back, and every frame's geometry is valid. V1 used a blur-threshold "goo" filter. |
| 0.35–1.18 | A visible rope of metal goes through the gap between the two bars, the face leads, and the eyes ride the flow. The camera cranes so inside → outside reads across the screen. |
| 1.18–1.70 | A continuous reform outside the cell: a thick liquid column, ears growing out, and a crisp snap at about 1.62. Then a ≤ 0.15 s deadpan hold with a blink. |
| 2.52–3.40, 17.08–18.02 | "Enter the metal" transitions: the camera pushes into a reflective surface and comes out somewhere new, instead of a hard cut. |
| 5.87–7.33 | The stakes are made visible: the magnet drags the solid figure against bars much narrower than its torso, and it cannot pass. |
| 7.63–9.0 | The heat source is visible: the AC induction coil energizes before and during the melt, and the solid sags into a pool continuously (no fade, no pop). |
| 11.64–13.31 | The second payoff: in an angled overhead view, the magnet pulls the liquid through the cage bars into a puddle outside. Barrier, liquid and destination are all visible. |
| 18.0–20.3 | Melting point versus body temperature on a phone-readable gauge: 29.8 °C below 37 °C, with the heat coming from the AC coil. |
| 20.4–22.3 | Magnetic control drawn as a chain: field → particles → the whole drop following the magnet. |
| 22.56–27.90 | The future section builds from lab demonstrations (channel, stomach model) to a clearly labeled future idea. |
| 27.90 | A shape match cut (sphere → robot head) replaces V1's hard cut back to the jail. |
| 31.0–32.40 | The loop: the last frame matches frame 0's camera, bars, grip and eyes, so frame 971 → 0 is continuous. |
| whole film | **Sound:** 14 new synthesized effects (tension, squeeze, stream, reform, snap, escape, comic, lock, chain, clunk, ac_on, field, enter, glint) placed on visible actions. The music bed is re-sectioned to V2's structure. |
| whole film | **Captions:** the same locked phrases, repositioned per phrase so they avoid the robot's face and the key action. Context tags and gauge labels were enlarged for phones. |

## 4. Scientific references (mechanism)

**How these were checked.** The paper's pages could not be opened directly from this environment: the network proxy refused cell.com, the Crossref, Europe PMC and Semantic Scholar APIs, and the news sites. Every claim was instead checked against search-engine extracts of the paper's full text, its Supplemental Information, the Cell Press release and the news coverage. Each claim is graded by source in `production/SCIENCE_NOTES_V2.md`.

The key claims and quotes:
- **The figure and the cage:** "a MPTM figurine molded in the shape of a Lego minifigure escapes from a cage by transitioning to a liquid phase and being pulled through the cage bars by an external magnetic field." The next sentence: "the liquid MPTM restores its original shape by flowing into a mold" (paper extract).
- **Recasting:** coverage quotes the senior author: it was manually recast by the team.
- **Material:** NdFeB microparticles (average 38 µm) in 99.9 % gallium at 1:9.
- **Melting:** gallium melts at 29.8 °C, below body temperature (37 °C).
- **Heating and cooling:** heated by a 50 kHz alternating magnetic field (induction); cooled passively in room air.
- **Magnetic control:** the material can be moved by an external magnet whether solid or liquid.
- **Medical demo:** an in-vitro, water-filled stomach-like model, where a 6 mm ball was engulfed after AMF heating and removed. There were no animal or human tests.

**References**
1. Wang Q., Pan C., Zhang Y., Peng L., Chen Z., Majidi C., Jiang L. "Magnetoactive liquid-solid phase transitional matter." *Matter* 6(3), 855–872 (2023). https://doi.org/10.1016/j.matt.2022.12.003
2. Supplemental Information for ref. 1: https://www.cell.com/cms/10.1016/j.matt.2022.12.003/attachment/f791216e-44cf-4e98-9ad0-b6d56c0231ac/mmc1
3. Cell Press release, 25 Jan 2023: https://www.eurekalert.org/news-releases/977155
4. Science News: https://www.sciencenews.org/article/robot-shape-shifting-gallium-melt-reform-magnetic-fields
5. Smithsonian: https://www.smithsonianmag.com/smart-news/this-shape-shifting-robot-can-liquefy-itself-and-reform-180981515/
6. Popular Science: https://www.popsci.com/technology/magnetoactive-liquid-metal-demo/

**How V2 frames it**
- The stylized robot, its eyes and the jail appear only in the dramatization, tagged "STYLIZED RECREATION".
- The real material is shown as a material: no eyes, external control, heat from the AC coil kept separate from the magnet, and the figure recast by hand.
- The medical part is a labeled lab demonstration on a model, followed by a labeled future idea.
- The narration's "melts near body temperature" is framed visually as 29.8 °C, below the 37 °C mark.

## 5. Remaining limitations

See the QA section of this report for the measured results of the final render.

- **Audio not heard.** There is no playback here. The mix was checked by loudness, true peak, spectrograms, voice alignment and an ASR transcript of the final MP4, not by ear. Effect character, the "comic" punctuation and the music need a listen on headphones and a phone.
- **Not watched in real time, and no muted viewing.** The film was inspected frame by frame and through contact sheets and frame-difference measurements, not watched at speed.
- **Hook, at full resolution only:**
  - frames 14–21: small white highlight fragments where the leg metal meets the bottom rail;
  - frames 9–17: a dark flap or ring where a bar pierces the liquid;
  - frames 40–42: the legs emerge with white specks;
  - frames 44–45: a scalloped edge where the reform column meets the head.
- **Lab:** the figure is small (about 15 % of the frame) during the "tiny cage" crane at 5.0–5.9 s.
- **Science section:** the camera enters the recast figure but comes out of a liquid drop. It is the same material, but an editorial match, not one physical object.
- **Future section:**
  - The magnet overlaps the ghost torso at 26.7–27.4 (its handle runs off-frame, so it reads as held outside).
  - The "narrow channel" demo is a generic depiction of magnetic steering of the material. The paper reports stretching, splitting and merging under magnets, but the "1.5 mm channel" detail is unverified, so no dimensions are shown.
- **J1:** the escalated security (chains, padlock stack) exists only in J1; H1's wide shot shows the ordinary padlock.
- **Science sources:** they were read through search extracts, not opened directly. Before publishing, give the paper and its Supplemental Information a quick manual read.

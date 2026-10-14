# Research note and claim ledger — They Trained Robots to Destroy Themselves

Prepared 14 October 2026. Internal production record; not for public upload.

## How the sources were read (limits first)

This session's container runs under a network policy that allows package registries and GitHub only.
Direct requests to `figure.ai`, `thinkfoundry.com`, `youtube.com`, `x.com`, `reddit.com`,
`news.ycombinator.com`, `stats.videoamigo.com`, `ibm.com`, `thedrive.com` and every other news host were
refused by the egress proxy (`CONNECT tunnel failed, response 403`), and the WebFetch tool could not resolve
them either. So:

- **P1 (Figure announcement), P2 (Think Foundry), P3 (the official film) and P5 (X post) were not opened directly.**
- **The official film was not watched.** Nothing in this episode describes what the film shows beyond what
  multiple written accounts report, and no frame of it is used.
- Claims were triangulated through a web-search tool that returns indexed excerpts and summaries of the
  pages, cross-checked across several independent outlets. Where a quotation appears verbatim in several
  outlets' excerpts, it is marked "quoted in coverage". Every such quotation is on the owner's
  pre-upload check list (see `../QA_REPORT.md`) to confirm against P1 in a normal browser.
- The attention snapshots in the commissioning prompt (Reddit 33,476 upvotes on Oct 1; VideoAmigo 649,357
  views; HN 90 points / 50 comments) **could not be rechecked live** for the same reason. They are carried
  forward as the prompt's October 14 observations, not as figures verified here, and appear nowhere in
  public copy.

Evidence status key: **Company claim** = Figure's own account, repeated by media, not independently
verified. **Corroborated** = a party other than Figure confirms it. **Public record** = a dated public post or a
well-documented film. **Conceptual** = general explanation of a technique, not a claim about Figure.
**Editorial** = our inference or framing.

## Dates (keep separate)

| Event | Date | Basis |
|---|---|---|
| F.02 retirement from BMW Spartanburg announced | Nov 19–20, 2025 | Company claim, dated coverage (Metal.com Nov 20, 2025) |
| Adcock asks X what to do with F.02s; Schwarzenegger replies "You should melt them." | Aug 19, 2026 | X timestamps as indexed (5:03 PM reply; Adcock follow-up 6:23 PM, same day) |
| Figure publishes "F.02 Decommission" and the film | Sep 30, 2026 | Prompt anchor; Humanoids Daily and aiwiki date it Sep 30. Some outlets say Oct 1 (time-zone/publication lag). |
| Coverage window | Oct 1–9, 2026 | Electrek Oct 3, Deseret Oct 5, The Drive Oct 6, IBM Oct 9, Yle, heise, Gizmodo, etc. |
| **Filming date** | **Not established** | Not stated in any source read. Do not state or imply one. |

## Claim ledger

| ID | Script claim (as spoken) | Source(s) | Date / conditions | Status | Visual treatment |
|---|---|---|---|---|---|
| C01 | "These robots were trained to jump into molten steel. Their own manufacturer taught them to do it." | P1 via coverage: "we really trained robots to jump autonomously, shipped them to Finland, and had them leap into a vat of molten steel" (quoted in Deseret, Interesting Engineering, Notebookcheck excerpts) | Sep 30, 2026 | Company claim; event corroborated by C03 | Labeled illustration (reenactment), never presented as footage |
| C02 | "It's not a special effect. Figure … says the jumps were real." | Same quote, preceded by "In an age of AI-generated footage, it's worth being clear" | Sep 30, 2026 | Company claim | Typographic source card: "figure.ai · F.02 Decommission · Sep 30, 2026" with the short quote. Not styled as a screenshot. |
| C03 | "the Finnish steel plant that hosted them says its spokesperson watched them go in" | Yle (yle.fi/a/74-20250198, English; 74-20249530 Finnish): Ovako communications manager Satu Tähkä confirmed the sequence and said she saw the robots jump into the molten vat | Oct 2026 | **Corroborated** (host foundry, reported by Finland's public broadcaster) | Source card, paraphrased (exact Yle wording not retrieved): "Ovako (Imatra plant) spokesperson says she saw the robots jump in — reported by Yle" |
| C04 | "These are F.02s, Figure's second-generation humanoid." | Figure 02 launch (Aug 2024 press release, PR Newswire); P1 title | — | Public record | F.02 rig with chip "F.02 · illustration" |
| C05 | "Figure says they spent months loading parts at a BMW plant." | Figure, Nov 2025: 11-month deployment at BMW Group Plant Spartanburg; >90,000 parts, >1,250 h, >30,000 vehicles (Metal.com, Nov 20, 2025; repeated in Oct 2026 coverage) | 2025 | Company claim | Short illustrated loading beat. **No counts on screen** (avoid unneeded metrics). |
| C06 | "as its newer F.03 fleet grew, keeping the old ones running stopped making sense" | P1 as excerpted: "As our F.03 fleet grows, maintaining the F.02 fleet no longer makes sense." | Sep 30, 2026 | Company claim | F.03 silhouette (lighter, covered) arriving; F.02 tagged RETIRED |
| C07 | "Figure says they're packed with its own custom hardware, like the actuators that move the joints. It didn't want that leaving the building." | P1 as excerpted: "We needed to dispose of the robots in a way that protected our proprietary hardware"; IBM/eeNews/IE: "custom-built actuators and other intellectual property" | Sep 30, 2026 | Company claim | Option card SELL with locked actuator cutaway |
| C08 | "Figure says doing that for every robot would eat so much engineering time, it would delay the next model." | P1 as excerpted: "Disassembling each robot would take our technical staff so much time that it would delay the launch of F.04." | Sep 30, 2026 | Company claim | Option card TAKE APART; calendar slips |
| C09 | "a robot that jumps in on its own has to bring its battery" | Logical: self-powered motion needs onboard power; F.02 has a torso battery pack (2024 launch spec). Coverage (lavx/Robomorrow summaries) states the batteries were needed for the self-jump. | — | Editorial inference, consistent with coverage | Battery icon inside the robot outline |
| C10 | "Figure says foundries in the U.S. and Mexico refused. One in Imatra, Finland, said yes." | Gizmodo, IE, eeNews, Yle (Ovako "the only factory willing") | Sep–Oct 2026 | Company claim; Ovako's participation corroborated (C03) | Map pins: US ✗, Mexico ✗, Imatra ✓ |
| C11 | "Plenty of companies just recycle old hardware. But only one of these options came with a film crew." | — | — | Editorial (balances the "only option" framing; recycling/e-waste disposal is ordinary practice) | Clapperboard snaps onto MELT |
| C12 | "In August, Figure's CEO, Brett Adcock, asked what to do with the old robots. Arnold Schwarzenegger replied: 'You should melt them.'" | x.com/Schwarzenegger/status/2090122510822150541 ("@adcock_brett You should melt them.") and P5, as indexed | Aug 19, 2026 | Public record (indexed post text; not opened directly) | Typographic quote card "reply on X · Aug 19, 2026". **No mock X screenshot.** |
| C13 | "In Terminator 2, his robot character ends up lowered into molten steel, so no one can copy its technology." | *Terminator 2: Judgment Day* (1991) ending — well-documented film history | 1991 | Public record | Original ticket/poster-free card "Terminator 2 (1991)"; no recreated scene |
| C14 | "Which is almost exactly Figure's reason. Hollywood wrote the business case in 1991." | C07 + C13 | — | Editorial (joke) | "Business case" folder stamped 1991 |
| C15 | "Schwarzenegger appears in the finished film." | IBM Think (Oct 9): "also appeared in the official video"; Humanoids Daily, TechEBlog headlines | Sep 30, 2026 | Reported by several outlets; film not watched here | Narration only. **Do not claim he was in Finland**: Yle says Ovako declined to say whether he was present; outlets disagree. |
| C16 | "So Figure says it trained a new AI model in simulation." | P1 as excerpted: "Using movements from stunt artists as a reference, the team trained a new AI model in simulation that would let the robots jump accurately into a bucket of molten steel, at a foundry we had never visited." | Sep 30, 2026 | Company claim | Simulation world, labeled CONCEPTUAL |
| C17 | "Thousands of virtual robots try the jump … score … nudges the controls … Millions of times." | General description of simulation-based reinforcement learning | — | **Conceptual** — not Figure's numbers or logs | Chip: "How this kind of training generally works — not Figure's training data". Attempt counter labeled illustrative. |
| C18 | "Figure says it used stunt performers' movements as a reference" | C16 quote | Sep 30, 2026 | Company claim | Generic stunt-performer silhouette + robot overlay; no real performer depicted |
| C19 | "The result is called a policy: a learned rule that turns what the robot senses into motor commands, many times a second." | Standard robotics/RL definition | — | Conceptual | Sense → policy → motors loop diagram |
| C20 | "Real joints have slack. Real floors aren't perfectly flat. Sensors are noisy." | General sim-to-real gap | — | Conceptual | Side-by-side sim vs real |
| C21 | "this jump had to work at a foundry the team had never visited" | C16 quote | Sep 30, 2026 | Company claim | Map pin "never visited" |
| C22 | "make the simulation messy on purpose … We don't know which variations Figure used." | Domain randomization (general technique) | — | Conceptual; explicitly not attributed to Figure | Sliders labeled "conceptual example" |
| C23 | "Figure also rehearsed for real, with robots jumping from a second floor onto giant airbags." | Electrek, heise, Deseret, Gizmodo, IE: airbags at the San Jose campus, jumps from a building's second floor | Before Sep 30, 2026 | Company claim | Illustrated airbag rehearsal, labeled illustration |
| C24 | "Figure says the heat and electromagnetic noise knocked out cameras and other electronics, and the policies kept running anyway." | P1 as excerpted via coverage: robots ran their AI policies "seamlessly" despite extreme heat and electromagnetic fields while cameras and other electronics failed | Sep 30, 2026 | Company claim | Camera icon ✗; policy loop keeps pulsing; chip "Figure's account" |
| C25 | "The steel plant says experts supervised the work, alongside normal production." | Yle: Tähkä said the work was carried out safely under expert supervision alongside normal production | Oct 2026 | Corroborated statement from the host | Integrated safety note on the "proves" board |
| C26 | "We haven't seen a failure rate, a test report, or an independent check of how autonomous each jump was." | Absence in every source read; Traictory and Robomorrow note autonomy is not independently verified | Oct 14, 2026 | Editorial, scoped to "we haven't seen" | SHOWN / NOT SHOWN board |
| C27 | "One movement, practiced for one kind of target" | C16 (purpose-trained model for this jump); Robomorrow's "narrow, purpose-built policy" reading | — | Editorial inference from company account | Spotlight on one task |
| C28 | Reflection: humanoid shape invites reading intention | — | — | Editorial; hedged ("it's easy to see"), no universal claim, no diagnosis | Dashed "choice?" bubble, then people behind the target |

## Details deliberately left out

- **Six melts / 24-hour window / 20-minute crust window**: consistently reported but all trace to Figure; not
  needed for comprehension.
- **75-ton electric arc furnace, three graphite electrodes, ~1,600 °C**: reported, not needed. The illustration
  shows an open vessel ("bucket"/ladle) because Figure's own excerpted wording says "a bucket of molten steel";
  the exact vessel geometry in the film is unverified. Labeled illustration.
- **Fleet size / number destroyed**: not disclosed. Script never says "every F.02" (Figure says a few remain
  at HQ).
- **Commemorative artifacts from the recovered metal**: true per Figure, not needed.
- **Thumbs-up gesture in the film** (Tom's Hardware): not verified by watching; not depicted.
- **"AI-free" film**: never claimed. The distinction made is: AI controlled the robots (company claim);
  Figure says the footage is not AI-generated.

## Discrepancies found and how they were resolved

| Topic | Variants | Resolution |
|---|---|---|
| Foundry location | Imatra (most outlets, Yle, Ovako) vs Outokumpu (one outlet) | Imatra — confirmed by Yle naming Ovako's Imatra plant |
| Vessel | "75-ton electric arc furnace" vs "vat" vs "bucket of molten steel" (Figure) vs "blast furnace" (heise) | Narrate "molten steel"; draw an open vessel; labeled illustration |
| Publication date | Sep 30 vs Oct 1 | Use Sep 30, 2026 (prompt anchor; Figure page date per several outlets) |
| Schwarzenegger on site | "watched in Finland" (TechEBlog headline, MindStudio) vs unconfirmed (Yle: Ovako declined to say) | Say only that he appears in the film |
| "Stunt footage" vs "autonomous" (IBM summary called it a conflict) | Not a conflict: motion references trained a policy that then ran on the robot | Explained in the training section |

## Source list

Primary (company/production; not opened directly here — see limits)
- P1 Figure, "F.02 Decommission", Sep 30, 2026 — https://www.figure.ai/news/f-02-decommission
- P2 Think Foundry, production account — https://www.thinkfoundry.com/figure-ai-decommission
- P3 Figure, official film — https://www.youtube.com/watch?v=pfAh5oQDPDM
- P4 Figure news archive — https://www.figure.ai/news
- P5 Brett Adcock on X — https://x.com/adcock_brett/status/2090142587806212476
- Arnold Schwarzenegger on X, Aug 19, 2026 — https://x.com/Schwarzenegger/status/2090122510822150541

Independent corroboration
- Yle, "Hasta la vista: US firm melts humanoid robots Terminator-style in Imatra" — https://yle.fi/a/74-20250198
- Yle (Finnish) — https://yle.fi/a/74-20249530

Coverage used for triangulation
- Electrek, Oct 3, 2026 — https://electrek.co/2026/10/03/hasta-la-vista-baby-figure-f-02-humanoid-robots-decommissioned-t2-style/
- Deseret News, Oct 5, 2026 — https://www.deseret.com/business/2026/10/05/arnold-schwarzenegger-terminator-ai-humanoid-robots-molten-steel-bmw-automobile-manufacturing/
- The Drive, Oct 6, 2026 — https://www.thedrive.com/news/these-robots-built-bmws-then-hurled-themselves-into-molten-steel
- IBM Think, Oct 9, 2026 — https://www.ibm.com/think/news/Terminator
- heise — https://www.heise.de/en/news/Arnold-Schwarzenegger-humanoid-F-02-a-blast-furnace-Figure-disposes-of-robot-11472202.html
- Interesting Engineering — https://interestingengineering.com/ai-robotics/humanoid-robot-decommissioned-molten-steel
- Gizmodo — https://gizmodo.com/figure-ai-trains-retired-robots-to-dive-into-molten-steel-2000820643
- eeNews Europe — https://www.eenewseurope.com/en/figure-melts-f02-humanoid-robot-fleet/
- Robomorrow (skeptical reading) — https://robomorrow.com/en/figure-f02-fleet-melted-furnace-finland-2026/
- Humanoids Daily — https://www.humanoidsdaily.com/news/figure-02-melted-arnold-schwarzenegger-finland
- Metal.com (Nov 20, 2025, BMW retirement) — https://news.metal.com/newscontent/103630870
- Figure 02 launch (Aug 2024) — https://www.prnewswire.com/news-releases/figure-unveils-figure-02-its-second-generation-humanoid-setting-new-standards-in-ai-and-robotics-302214889.html

Attention/discussion (audience questions only; not technical proof; not rechecked live)
- D1 Reddit r/interestingasfuck — https://www.reddit.com/r/interestingasfuck/comments/1wuwe7m/the_humanoid_robotics_company_figure_made_their/
- D2 VideoAmigo snapshot — https://stats.videoamigo.com/channel-directory/UCYlq-KmwPjc1DtsGmthFqSQ.amigo
- D3 Hacker News — https://news.ycombinator.com/item?id=49932079
- D4 IBM (as above), D5 The Drive (as above)
- D6 Earlier brain-computer X summary (deferred topic) — https://x.com/i/trending/2028099213125693621

Audience questions the episode answers (from the coverage and discussion framing): Was it real or CGI?
Why not just recycle them? Was Arnold really involved? Were the robots autonomous? Does it mean anything
for real-world robot autonomy?

## V2 changes (Oct 14, 2026)

Only rows whose wording or on-screen treatment changed in V2 are listed. Sources and statuses of C01–C28 are unchanged.
The reference pages named in the V2 brief (figure.ai, tendril.studio, youtube.com, thinkfoundry.com, commons.wikimedia.org)
were still blocked by this environment's network policy on Oct 14, 2026, so nothing below rests on them directly.

| ID | V2 wording | Basis | Status | V2 on-screen treatment |
|---|---|---|---|---|
| C01 | "These robots were trained to jump into molten steel — on purpose, by their own company." | As C01 | Company claim, attributed in the next sentence | Opening reenactment (original illustration, no source frame) |
| C02 | "Figure, the robot maker, says the jumps were real" | As C02 | Company claim | One attribution chip: "Figure · 'F.02 Decommission' · Sep 30, 2026" |
| C03 | "a spokesperson for the Finnish steel plant says she watched them go in" | Yle (as C03): Ovako's communications manager said she saw the robots jump | Corroborated by the host | Narration only; Imatra named on the shipping route later |
| C17 | Retired in V2 (no "thousands of virtual robots" / "millions of times") | — | — | No attempt counter, score or success curve on screen |
| C26 | Moved from narration to the description notes | As C26 | Editorial, scoped to "we haven't seen" | — |
| C29 | "Recycling old hardware is normal. Bringing a film crew is not." | Recycling/e-waste disposal is ordinary practice; the film crew is C15/Think Foundry | Editorial | Clapperboard snaps shut |
| C30 | "A virtual robot tries the jump, and the attempt gets a score … tries again, over and over, in many virtual copies at once." | General description of simulation-based reinforcement learning | **Conceptual**, not Figure's numbers, scores or logs | One entrance label: "How this kind of training generally works"; no counts |
| C31 | "it was one movement, for one kind of target, in a setting people prepared and supervised. That's not a robot that can walk into any factory and work things out." | C16 (purpose-trained model), C25 (Ovako: expert supervision), C27 | Editorial inference | Bounded spotlight, then pull-out to the people and equipment around it |
| C19a | "If a foot lands a little early, the sensors catch it, and the policy adjusts the knee and ankle before the robot tips." | Standard description of a feedback control policy | **Conceptual** example, not a Figure log | Push into a sensor, follow the signal to the knee/ankle, correction |
| C12 | "In August, Figure's CEO, Brett Adcock, asked what to do with the old robots. Arnold Schwarzenegger replied, 'You should melt them.'" | As C12 | Attributed; post paraphrased, reply quoted | Phone cards marked PARAPHRASED / QUOTED; typographic, not screenshots; no voice for Schwarzenegger |
| C22 | "A common fix is to make the simulation messy on purpose. Change the weight, the footing, the timing, a little every round … We don't know which variations Figure used." | As C22 (domain randomization, general technique) | **Conceptual**, explicitly not attributed to Figure | One entrance label "MESSY ON PURPOSE · a common technique"; three example variations shown only as consequences on an arc (heavier / slippery / a beat late); no settings panel, values or sliders; the spoken line carries the "we don't know" |
| C23 | "It also rehearsed for real, with robots jumping from a second floor onto giant airbags." | As C23 | Reported | Original illustration of the rehearsal; no claim about how many rehearsals |
| C24 | "Figure says the heat and electromagnetic noise knocked out cameras and other electronics, and the policies kept running anyway." | As C24 | Company claim (attributed in speech) | A crew monitor drops to NO SIGNAL and a junction box arcs (illustrative); the jump continues |

Robot likeness and branding (V2 asset check): the F.02 drawing uses only features stated in text sources reachable here
(all-dark exoskeleton shell with internal wiring, mesh-finished neck, front head cameras, torso battery, five-fingered hands;
The Robot Report / Interesting Engineering / KR Asia launch coverage, Aug 2024) plus general knowledge of its appearance.
F.03 is drawn as a soft, fabric-covered body over foam with a mask-like face (designboom / Gizmodo / robophilosophy coverage of the
Oct 2025 launch). No Figure logo or on-body marking is drawn: the official logo and reference photos could not be loaded, and an
unverified reconstruction would be "generic text masquerading as a logo". Identification is by narration and a plain caption.

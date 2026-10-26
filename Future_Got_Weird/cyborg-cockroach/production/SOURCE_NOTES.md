# Cyborg Cockroach V1: sources, simplifications and provenance

## Research

- Le et al., "Paraborg: Paramedic Cyborg Insects for In Situ Emergency Drug-Delivery", *Advanced Science* (2026),
  https://advanced.onlinelibrary.wiley.com/doi/10.1002/advs.76973 (ResearchGate copy:
  https://www.researchgate.net/publication/411574245_Paraborg_Paramedic_Cyborg_Insects_for_In_Situ_Emergency_Drug-Delivery)
- University of Queensland: "Paramedic cockroaches: cyborg care when rescuers can't reach",
  https://news.uq.edu.au/2026-08-paramedic-cockroaches-cyborg-care-when-rescuers-cant-reach
- Reporting used to understand the device (this container cannot open the paper or the UQ page: their hosts are not
  reachable from here; details came from search summaries of these articles):
  IEEE Spectrum https://spectrum.ieee.org/cyborg-rescue-roach ;
  TechXplore https://techxplore.com/news/2026-08-giant-cyborg-cockroaches-people-rescuers.html ;
  Australian Geographic https://www.australiangeographic.com.au/science-environment/2026/09/cyborg-insect-rescue-teams-could-one-day-save-lives/ ;
  Connect Sci https://connectsci.au/news/news-parent/10008/Paramedic-cyborg-cockroaches-created-for-search?searchresult=1 ;
  New Atlas https://newatlas.com/robotics/cyborg-cockroach-paramedics/

## What the picture shows, and how it was simplified

| Picture | Basis | Simplification |
|---|---|---|
| A living giant burrowing cockroach (*Macropanesthia rhinoceros*), about 8 cm, rounded, wingless, glossy dark brown, spiny legs | The species named by UQ and the paper | Lofted vector shell; plates as lines; leg spines as ticks |
| A removable electronic backpack (board + coin cell) with fine wires to electrodes at the antenna bases and the cerci | Reported: electrodes in the antennae and cerci, a wireless stimulator backpack | Layout invented for readability (board, cell, saddle) |
| Steering: a pulse travels along a wire, the antenna twitches, the insect veers the other way | Reported: stimulating the left antenna makes it veer right; cerci for forward motion | One clear pulse per turn; no frequencies shown |
| The medic's launch tube: spring, injector, latch line through holes at the mouth, nichrome coil that cuts the line | Reported launch mechanism (spring held by a line; resistance heating cuts it) | Clear tube so the mechanism reads; proportions simplified |
| Delivery after launch: gas pushes the plunger; the dose passes through the needle | Reported two-step design (launch, then a chemical reaction makes gas behind the plunger; 31-gauge needle) | Shown as a time-compressed section; the chemistry is not named |
| A second insect with a camera; the operator watches its feed | Reported observer insect with a Wi-Fi camera | Camera module simplified |
| Silicone target in an aluminium cradle | Reported silicone (and pig-skin) targets | Generic lab fixture design |
| Future rubble rescue, labelled "Future rescue concept" | The proposed application (UQ: five to ten years away, if funded) | Illustrative; no human injection or treatment is shown |

Not shown, by the brief: statistics (success rates), solar panels, diving gear, weapons, capabilities from other studies.

## Cast and code lineage

- Operator: the Weird Crew "guesser" in his lab outfit, on the Death Clock rig (`source/src/crew/operator/`, from
  `glass-climbing/source/src/dc/` and `moth-silk-web-shooter/source/src/v6/cast6.ts`).
- Survivor: the Weird Crew "person" on the turnaround rig (`source/src/crew/person/`, from
  `moth-silk-web-shooter/source/src/rig/`).
- The insect, its gear, the sets and the shots are new for this episode.

## Generated assets

- **ElevenLabs:** one narration take (see `audio/narration/voice_provenance.json`), one Scribe transcription of it.
- **Runway:** none used. See `production/ASSET_LOG.md`.
- **Sound:** all synthesised by `tools/make_audio.py` (no samples, no third-party music).

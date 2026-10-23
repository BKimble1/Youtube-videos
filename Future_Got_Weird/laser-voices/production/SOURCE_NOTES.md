# Laser Voices: sources, access, claim ledger and depiction choices

Compiled 23 Oct 2026 for the V1 review cut. This is an evergreen story about a 2019 demonstration; the film does not
present it as news.

## Access: what could and could not be read

This session's network policy blocked the primary sources. Every request failed at DNS (`ENOTFOUND`) or at the proxy:

- `www.ll.mit.edu`: the MIT Lincoln Laboratory news story and the TALC technology page in the brief;
- `opg.optica.org` and `doi.org`: the Optics Letters paper.

**Not read.** I did not open the MIT news page, the TALC page or the paper. No claim below rests on having read them.

**What I used instead.** A server-side web search that returns summaries of the pages and of press coverage (most of
it quoting the MIT release). Those summaries are second-hand.

**Needed before publication.** Someone should read the three primary sources in the brief and check the ledger below,
especially the two items marked *inference* and *simplification*.

## Primary sources (from the brief; not opened here)

| Source | Date |
|---|---|
| MIT Lincoln Laboratory, "Laser can deliver messages directly to your ear from across the room" — https://www.ll.mit.edu/news/laser-can-deliver-messages-directly-your-ear-across-room | Jan 2019 |
| MIT Lincoln Laboratory, "Targeted Acoustic Laser Communication (TALC)" — https://www.ll.mit.edu/partner-us/available-technologies/targeted-acoustic-laser-communication-talc | undated page |
| R. M. Sullenberger, S. Kaushik, C. M. Wynn, "Photoacoustic communications: delivering audible signals via absorption of light by atmospheric H2O," *Optics Letters* 44(3), 622–625 (2019), doi:10.1364/OL.44.000622 — https://opg.optica.org/ol/abstract.cfm?uri=ol-44-3-622 | Feb 2019 (online Jan 2019) |

## Search results consulted (summaries only)

| Source | Used for |
|---|---|
| [Optica OPN, "Laser Beaming Sound to a Recipient's Ear"](https://www.optica-opn.org/home/newsroom/2019/january/laser-beaming_sound_to_a_recipient_s_ear) | two methods; sweep at the speed of sound; sweep louder, modulation higher fidelity |
| [phys.org, "New technology uses lasers to transmit audible messages to specific people"](https://phys.org/news/2019-01-technology-lasers-transmit-audible-messages.html) | swept with a rotating mirror; heard only at a certain distance; message to an individual, not everyone who crosses the beam; >2.5 m at 60 dB |
| [Laser Focus World, 2019](https://www.laserfocusworld.com/articles/2019/01/laser-transmission-of-audible-messages-to-specific-people-in-a-crowd-demonstrated.html) | 1.9 µm thulium laser tuned to a water-vapour absorption line; no receiver equipment |
| [optics.org](https://optics.org/news/mit-laser-system-transmits-audible-messages-to-audience) | eye- and skin-safe at the powers used; conversational level |
| [Science News](https://www.sciencenews.org/?p=224708), [ScienceAlert](https://www.sciencealert.com/new-tech-from-mit-uses-lasers-to-beam-whispers-only-you-can-hear) | sweep audio sounds "somewhat like a buzzing insect"; proposed uses |
| [photonics.com](https://photonics.com/Articles/Photoacoustic_Approach_Uses_Lasers_to_Send/a64334), [Electro Optics](https://www.electrooptics.com/news/photoacoustic-approach-sends-messages-through-air-without-needing-receiving-device) | paper citation; sweep derived from dynamic photoacoustic spectroscopy |
| [MIT LL TVO Technology Highlight 18: TALC (PDF)](https://www.ll.mit.edu/sites/default/files/other/doc/2023-02/TVO_Technology_Highlight_18_TALC.pdf) | listed in search results only (the host is blocked) |

## Claim ledger (narration line → basis)

| Narration | Basis | Status |
|---|---|---|
| "If someone pointed this laser at you, you could hear a voice that nobody beside you hears." | Swept beam: sound is produced only where the sweep moves at the speed of sound, so only a listener at that distance hears it; "a message could be sent to an individual" (phys.org, OPN) | supported (second-hand) |
| "And you wouldn't need anything in your ears." | "without any type of receiver equipment" (Laser Focus World) | supported |
| "The beam is invisible." | 1.9 µm is infrared, outside human vision | supported (physics) |
| "…when water vapor near your ear absorbs its light, it heats up and expands—creating tiny sound waves." | Photoacoustic effect via absorption by atmospheric H2O (paper title; all coverage) | supported. Simplification: the film shows one molecule absorbing a light packet; in reality the absorbed energy heats the surrounding gas (a small volume of air), which expands. |
| "Now, sweeping that beam at exactly the right speed concentrates the sound where you're standing." | Sweep at the speed of sound with a rotating mirror; sound only at a particular distance (OPN, phys.org) | supported. Depiction: the mirror's tilt is drawn about three times larger than the geometry needs and slowed down; the sweep is drawn as a short vertical arc beside the ear. |
| "Scientists actually demonstrated this from eight feet away." | ">2.5 metres away at 60 decibels" (phys.org): 2.5 m = 8.2 ft | supported (rounded down) |
| "But if someone walks between you and the laser… The voice suddenly stops. They can't hear your message. They're blocking it." | "a message could be sent to an individual, rather than everyone who crosses the beam of light" (phys.org) supports *they can't hear it*. That an opaque body in the path stops the transmission is physical **inference** (a body absorbs/scatters the infrared beam), and the brief states it. I found no description of a blocking test. | inference: check against the paper |
| "And the second they move… You hear it again." | Same inference: the transmission resumes when the path is clear | inference |

**Fidelity caveat (simplification).** Coverage says the swept method is louder but lower in fidelity ("somewhat like a
buzzing insect"), while the modulated (non-swept) method carries speech better. The approved narration says "a voice",
and the film's transmitted message is a quiet, nonlexical voice-like murmur. This merges the two methods' strengths;
a reviewer may want the description to mention it.

## Depiction choices

- **Geometry.** One room, one coordinate system (x along the optical axis, the exit at x = 0, her left ear at
  x = 2.44 m = 8 ft, the beam at her ear height, 1.43 m). The bystander crosses at x = 1.5 m, upstream of her ear; the
  beam meets his left shoulder. The cut is computed from his body geometry every frame, and the path overlay, the ear
  accent, her reaction and the message audio gate all read that one function (`source/src/story.ts`, `pathHit`).
- **Invisible beam.** Ordinary views never show a beam. The dashed amber line is an overlay labelled
  "IR PATH · ILLUSTRATED" when it first appears in the explanation; it is drawn to the listening position and fades out
  there (the real beam continues and is not drawn).
- **Apparatus.** A tabletop laser head on a post: a compact laser module, a scanning mirror on a galvo, an exit tube,
  and a separate playback unit with a waveform screen and a TX light that keeps blinking through the interruption (an
  obstruction, not a power failure). Not a weapon, not a consumer gadget.
- **Sound generation.** Shown in a magnified circle of the air just outside the ear (anchored with leader lines to that
  point, the ear rim visible beside it): water molecules among faint N2/O2 pairs; an amber light packet is absorbed; a
  brief warm glow; a small expansion ring nudging neighbours; smooth teal pressure fronts travel to the ear's surface.
  No droplets, steam, burning, glowing skin, or waves through the skull.
- **Labels.** Only the path legend, "H₂O" (2 s) and "8 FT" (once, in scene space). No citations or source bubbles on
  screen; sources are here and in the description draft.

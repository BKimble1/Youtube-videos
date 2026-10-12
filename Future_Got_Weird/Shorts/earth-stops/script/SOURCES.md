# Sources — Earth Stops. You Don't. (V5)

V4's table is kept in `history/SOURCES_V4_2fb391a.md`, V3's in `history/SOURCES_V3_243eb4d.md`, V2's in `history/SOURCES_V2_f6f000b.md`, V1's in `history/SOURCES_V1_701648d.md`. V5 keeps the same rule: **this file says who opened what, and it does not pretend Claude read anything it did not.**

## Who opened what (read this first)
- **Claude (author of the V5 cut) opened no source page.** Re-tested again on 12 Oct 2026 for V5 (`curl` returned HTTP 000 for the NASA Cosmicopia attic page and NASA Glenn's Newton's-laws page). The V4 test, for the record: (`curl` through the session proxy returned HTTP 000 for the NASA Cosmicopia attic page, NASA Glenn's Newton's-laws page, the JPL physical-parameters page and a YouTube help page). The V3 test, for the record: `curl` through the session proxy returned HTTP 000 for the NASA Cosmicopia attic page, NASA Glenn's *Beginner's Guide to Aeronautics*, NASA Space Place, the YouTube help pages (`support.google.com/youtube/answer/3376882`, `/2801973`), the ElevenLabs help and terms pages, youtube.com and ladbible.com; `WebFetch` failed on the NASA hosts with `getaddrinfo ENOTFOUND`. The Runway clip host is refused as well. Nothing here is marked "confirmed" on Claude's say-so.
- **R1–R6 were read by the reviewer (ChatGPT)** while writing the V2 and V3 briefs (access notes copied from the reviewer). Treat them as the reviewer's reads, not Claude's. The V3 brief adds references (NASA-hosted archive pages `Srotfram1`, `StarFAQ6#q108`, `StarFAQ10`; NASA magnetosphere page; YouTube policy pages; ElevenLabs commercial-use pages; the Zack D. Films Short; a LADbible secondary report). **Claude opened none of them**; what the brief says about them is carried as the reviewer's account, and the film uses none of their wording, structure or art (see "Originality" below).
- **U1–U4 are carried over as uninspected** (by anyone in this project).

## Reviewer-read sources (R)
| ID | Source | Supports | Verifier | Access note (as reported by the reviewer) | Use in V5 |
|---|---|---|---|---|---|
| **R1** | NASA Cosmicopia, Earth/Moon FAQ — `science.gsfc.nasa.gov/attic/cosmicopia.gsfc.nasa.gov/qa_earth.html` (and the NASA-hosted archive copies named in the V3 brief) | The Earth-stop answer: retained eastward motion, latitude dependence, gravity remaining | Reviewer (ChatGPT) | Opened in the review. **Use the Earth-stop section only; do not copy its broad polar-safety statement** | C00, C01, C03, C04, C06 |
| **R2** | NGA, *World Geodetic System 1984* — `earth-info.nga.mil/index.php?dir=wgs84&action=wgs84` | Radius (6,378,137 m), flattening (1/298.257223563), angular velocity (7.292115×10⁻⁵ rad/s) → about **1,040.4 mph** at the equator | Reviewer (ChatGPT) | Read earlier in the reviewer's conversation; retries failed in the V1 review; that provenance is retained | C01, C02, C05 (centripetal figure), C06 |
| **R3** | NASA/JPL planetary physical parameters — `ssd.jpl.nasa.gov/planets/phys_par.html` | Equatorial radius and sidereal period (cross-check of R2) | Reviewer (ChatGPT) | Read earlier | C01, C02 |
| **R4** | NASA Glenn, *Beginner's Guide to Aeronautics*, Newton's laws (inertia) — `www1.grc.nasa.gov/beginners-guide-to-aeronautics/newtons-laws-of-motion/` | Motion changes when unbalanced forces act | Reviewer (ChatGPT) | Opened in the review | C03, C04, C05, C08 |
| **R5** | NOAA hurricane explainer | Category 5 ≥ 157 mph | Reviewer (ChatGPT) | Opened; **comparison retired since V2** | none |
| **R6** | YouTube Audio Library / policy and ElevenLabs commercial-use pages named in the V3 brief | Library music, effects use, voice/SFX licence terms | Reviewer (ChatGPT) | Opened in the review. **The licence of any actual track, and the owner's ElevenLabs plan terms, must still be verified by a person** | No library track and no licensed music used (see `credits.md`) |

## Uninspected carried-over sources (U) — not confirmed
| ID | Source | Why listed | Status |
|---|---|---|---|
| **U1** | Galileo, *Dialogue Concerning the Two Chief World Systems* (1632), the ship's-cabin passage | Historical background for C05 only | **Uninspected** |
| **U2** | IERS Conventions (2010), TN 36 | Optional cross-check of ω | **Uninspected** |
| **U3** | NASA NSSDC Earth Fact Sheet | Cross-check of radius/period | **Uninspected** |
| **U4** | Smithsonian "Ask an Explainer" on a sudden stop | Secondary explainer | **Uninspected**; not relied on |
| **U5** | NASA magnetosphere page (V3 brief) | Background for *not* claiming an instant magnetic collapse | **Uninspected**; the film makes no magnetic claim |

## Verification status by claim (see `CLAIM_LEDGER.md`)
| Claim | Evidence | Status |
|---|---|---|
| C02 ~1,040.4 mph at 0° | R2 inputs + `tools/calc_speeds.py` (reproducible) + R3 cross-check | COMPUTED; inputs reviewer-read |
| C03/C04 inertia of loose objects, air, water | R4 (+ R1 for the Earth-stop framing) | Reviewer-read |
| C06 latitude dependence | R2 constants (cos φ) + R1 | COMPUTED; R1 reviewer-read |
| C01 rotation direction / equator | R2/R3 | Reviewer-read |
| C05 shared motion | R4 | Reviewer-read |
| Galileo / IERS / Smithsonian / magnetosphere | — | **Uninspected, not confirmed** |

## Numbers (reproducible)
`tools/calc_speeds.py` → `script/speed_table.json`. v = ω·N·cos φ, N = a/√(1 − e² sin² φ). a = 6,378,137 m, 1/f = 298.257223563, ω = 7.292115×10⁻⁵ rad/s → **1,040.40 mph at 0°** (the only number shown). Equatorial centripetal acceleration ω²a = 0.0339 m/s² (0.35 % of g) is used only to qualify "you don't feel the spin".

## Originality (Zack D. Films)
The V3 brief named a competing Short as context. **Claude did not view it** (host refused) and did not copy from it; the V3 film's trigger (an oversized coral-and-saffron brake with a rotor ring), hand, characters, narration, shot order and palette are this channel's own. **Nothing in the film or its notes claims that the other Short's results predict this film's results.**

## Request to the owner
Decide whether R1–R6 (the reviewer's reads) suffice, or have a person open R1, R2 and R4 (they carry the claims). If the blocked hosts are allowed in the environment's network settings, Claude can re-run the checks itself; until then no claim is marked confirmed by Claude.

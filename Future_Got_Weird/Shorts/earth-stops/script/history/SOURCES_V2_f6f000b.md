# Sources — Earth Stops. You Don't. (V2)

V1's blanket "all excerpt only" is **replaced by claim-specific provenance**. The V1 table is kept in `history/SOURCES_V1_701648d.md`.

## Who opened what (read this first)
- **Claude (author of the V2 cut) opened no source page.** Every source host was refused by the session sandbox: `curl` returned HTTP 000 (proxy refusal) for all six URLs below, and the Runway CloudFront host is refused too. Nothing here is marked "confirmed" on Claude's say-so, and this file does **not** pretend Claude read any of it.
- **R1–R6 were read by the reviewer (ChatGPT)** while writing the V2 brief (reviewed 11 Oct 2026; baseline `BKimble1/Youtube-videos` branch `claude/fgw-earth-stops-short` commit `701648d`). The *Verifier* and *Access note* columns copy what the reviewer reported. Treat R1–R6 as the reviewer's reads, not Claude's.
- **U1–U4 are carried over from V1 as uninspected** (by anyone in this project): they are historical background or cross-checks. They are not marked confirmed.

## Reviewer-read sources (R)
| ID | Source | Supports | Verifier | Access note (as reported by the reviewer) | Use in V2 |
|---|---|---|---|---|---|
| **R1** | NASA Cosmicopia, Earth/Moon FAQ — `science.gsfc.nasa.gov/attic/cosmicopia.gsfc.nasa.gov/qa_earth.html` | The Earth-stop answer: retained eastward motion, latitude dependence, gravity remaining | Reviewer (ChatGPT) | Opened in the review. **Use the Earth-stop section only; do not copy its broad polar-safety statement** | C00, C04, C05, C06 |
| **R2** | NGA, *World Geodetic System 1984* — `earth-info.nga.mil/index.php?dir=wgs84&action=wgs84` | Radius (6,378,137 m), flattening (1/298.257223563), angular velocity (7.292115×10⁻⁵ rad/s) → about **1,040.4 mph** at the equator | Reviewer (ChatGPT) | Read directly earlier in the reviewer's conversation; **retries during the V1 review failed**; that provenance is retained | C01, C02, C03 (centripetal figure), C06 |
| **R3** | NASA/JPL planetary physical parameters — `ssd.jpl.nasa.gov/planets/phys_par.html` | Equatorial radius and sidereal period (cross-check of R2) | Reviewer (ChatGPT) | Read directly earlier | C01, C02 |
| **R4** | NASA Glenn, *Beginner's Guide to Aeronautics*, Newton's laws (inertia) — `www1.grc.nasa.gov/beginners-guide-to-aeronautics/newtons-laws-of-motion/` | Motion changes when unbalanced forces act | Reviewer (ChatGPT) | Opened in the review | C03, C04, C05, C08 |
| **R5** | NOAA hurricane explainer — `noaa.gov/education/explainers/hurricane-safety-explained` | Category 5 ≥ 157 mph | Reviewer (ChatGPT) | Opened, **but the comparison is removed from V2: the claim is retired** | none (retired) |
| **R6** | YouTube Audio Library guidance — `support.google.com/youtube/answer/3376882` | Library music and effects use and attribution | Reviewer (ChatGPT) | Opened in the review. **The licence of the actual chosen track must still be verified** | No library track was used (see `credits.md`) |

## Uninspected carried-over sources (U) — not confirmed
| ID | Source | Why it is still listed | Status |
|---|---|---|---|
| **U1** | Galileo, *Dialogue Concerning the Two Chief World Systems* (1632), the ship's-cabin passage | Historical background for C03 only (not needed for the claim; R4 carries it) | **Uninspected** — nobody has opened it |
| **U2** | IERS Conventions (2010), TN 36 | Optional cross-check of ω | **Uninspected** |
| **U3** | NASA NSSDC Earth Fact Sheet | Sidereal period / radius cross-check (R3 now carries this) | **Uninspected** |
| **U4** | Smithsonian "Ask an Explainer" on a sudden stop | Secondary explainer for C05's principle | **Uninspected**; not relied on |

## Verification status by claim (see `CLAIM_LEDGER.md`)
| Claim | Evidence | Status |
|---|---|---|
| C02 ~1,040.4 mph at 0° | R2 inputs + `tools/calc_speeds.py` (reproducible) + R3 cross-check | COMPUTED; inputs reviewer-read |
| C03/C04/C05 inertia | R4 (+ R1 for the Earth-stop framing) | Reviewer-read |
| C06 latitude dependence | R2 constants (cos φ) + R1 | COMPUTED; R1 reviewer-read |
| C01 rotation direction/at the equator | R2/R3 | Reviewer-read |
| Galileo / IERS / Smithsonian | — | **Uninspected, not confirmed** |

## Numbers (reproducible)
`tools/calc_speeds.py` → `script/speed_table.json`. v = ω·N·cos φ, N = a/√(1 − e² sin² φ). Reviewer's cross-check for V2: a = 6,378,137 m, 1/f = 298.257223563, ω = 7.292115×10⁻⁵ rad/s → **1,040.40 mph at 0°**, 798.10 at 40°, 181.25 at 80° (the latter two are **not shown** in V2). Equatorial centripetal acceleration ω²a = 0.0339 m/s² (0.35 % of g) is used only to qualify "you don't feel it".

## Request to the owner
Decide whether R1–R6 (the reviewer's reads) suffice, or open the original pages (R1, R2, R4 carry the claims). If the blocked hosts are allowed in the environment's network settings, Claude can re-run the checks itself; until then no claim is marked confirmed by Claude.

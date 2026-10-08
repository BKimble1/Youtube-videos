# Sources

## 1. Public source list (paste into the video description)

**Main study (2026)**
- Somasundaram, S., Young, A., Dave, A., Pediredla, A. & Raskar, R. "Imaging hidden objects with consumer LiDAR via
  motion-induced sampling." *Nature* 653, 693–699 (2026). https://doi.org/10.1038/s41586-026-10502-x
- Earlier manuscript: arXiv:2605.17865. https://arxiv.org/abs/2605.17865
- Project page: https://cornar.media.mit.edu/
- Code (MIT License) and released data: https://github.com/sidsoma/consumer-nlos
  - The plots in this video were made by us from the authors' released data and code.

**History**
- Velten, A. et al. "Recovering three-dimensional shape around a corner using ultrafast time-of-flight imaging."
  *Nature Communications* 3, 745 (2012). https://doi.org/10.1038/ncomms1747
- O'Toole, M., Lindell, D. B. & Wetzstein, G. "Confocal non-line-of-sight imaging based on the light-cone transform."
  *Nature* 555, 338–341 (2018). https://doi.org/10.1038/nature25489
- Nam, J. H. et al. "Low-latency time-of-flight non-line-of-sight imaging at 5 frames per second." *Nature
  Communications* 12, 6526 (2021). https://doi.org/10.1038/s41467-021-26721-x

**Context**
- Callenberg, C., Shi, Z., Heide, F. & Hullin, M. B. "Low-cost SPAD sensing for non-line-of-sight tracking, material
  classification and depth imaging." *ACM Transactions on Graphics* 40(4), 61 (2021).
- Scheiner, N. et al. "Seeing around street corners: non-line-of-sight detection and tracking in-the-wild using Doppler
  radar." CVPR 2020. https://arxiv.org/abs/1912.06613

**Diagrams and numbers**
- History scenes are illustrations based on the papers above.
- Room diagrams and their numbers are illustrative.

## 2. Internal source list, with how each was accessed

### 2.1 Access methods

- `direct`: read the primary file myself.
- `code_or_data`: inspected or ran released code or data.
- `search_summary`: reported by WebSearch from the named page; that page was not read.

### 2.2 Network limits encountered

**Blocked hosts.** These failed for curl and WebFetch with DNS errors or a proxy 403. Each was tried once per agent and
not retried, and no third-party fetch service was used:
- nature.com, arxiv.org, doi.org, crossref, semanticscholar
- ncbi / PMC / PubMed
- media.mit.edu, cornar.media.mit.edu, news.mit.edu, dspace.mit.edu
- ieee / spectrum.ieee.org
- archive.org, biostat.wisc.edu, re.public.polimi.it, api.openalex.org, Google Drive
- researchgate.net, techxplore.com, zmescience.com, youtube.com
- hn.algolia.com, hacker-news.firebaseio.com, openaccess.thecvf.com
- the GitHub issues HTML and API for `sidsoma/consumer-nlos`, and the GitHub REST forks endpoint

**What worked:**
- WebSearch (secondary access only)
- `git clone` of public GitHub repositories
- raw.githubusercontent.com
- the GitHub search API
- PyPI

**WebSearch budget.** The shared budget of 200 calls per turn ran out during the research and verification stages:
- the context agent made about 26 calls,
- the geometry agent made 6,
- most verification items could not run new searches.

Every fact that rests on a single search is flagged in `EXPERIMENT_RECORD.md` and `claims_draft.csv`. This synthesis
step ran no new searches.

**Consequence.** No Nature, arXiv, PMC or IEEE text was read directly. As a result:
- Every statement about the final article's wording, figures, Supplementary Videos and article history is
  `search_summary`.
- The 2018 Nature paper is the exception: it was read `direct` from a publisher-PDF copy in a third-party GitHub mirror,
  but byte equality with nature.com was not checked.

### 2.3 Sources

| Source | URL / locator | Version / date | Access | Used for |
|---|---|---|---|---|
| Nature 2026 article | https://www.nature.com/articles/s41586-026-10502-x | Online 20 May 2026; issue 21 May 2026; 653(8115):693–699. Received 28 Aug 2025 and accepted 7 Apr 2026 are single-route only. | search_summary | Abstract, figure titles, SV captions, Data availability, licence line (all unverified wording) |
| PubMed record | https://pubmed.ncbi.nlm.nih.gov/42162390/ | 2026 | search_summary | Bibliographic record; copyright line |
| arXiv v1 manuscript | https://arxiv.org/abs/2605.17865 ; https://arxiv.org/html/2605.17865v1 | v1 (18 May 2026 per search; no v2 seen) | search_summary (ID and title `direct` via author site) | Methods, S3.1 gantry, S4.1/S4.2, Supp. Figs 6–10, assumptions |
| Authors' code and data | https://github.com/sidsoma/consumer-nlos ; local `/home/user/ext_sources/consumer-nlos` | Commit `15314de422a765a2d1b72ea7037dfafb2f908d7c` (2026-07-23); data commits 2025-10-20, 2025-11-26, 2025-12-04; demo 2026-05-20 | direct; code_or_data (all three paper scripts run unmodified) | R8–R11; forward model; settings; reproduction |
| Author site, project-page snapshot | https://github.com/sidsoma/sidsoma.github.io ; local `/home/user/ext_sources/sidsoma_site/repo` | Commit `48b57f43` (2026-05-14), before the redirect to cornar on 2026-05-16; GIFs at `c418157b` | direct (HTML, FAQ, 5 videos frame by frame, CV, papers.js) | R1–R3, R5, R8 visual facts; FAQ quotes; price "~$100"; titles and dates |
| Project page (current) | https://cornar.media.mit.edu/ ; https://www.media.mit.edu/projects/consumer-nlos/overview/ | 2026 | search_summary | FAQ ("early-stage research prototype", open problems), "~$50", "30 frames/second" (that phrase is on the Media Lab overview page) |
| MIT Media Lab post | https://www.media.mit.edu/posts/mit-media-lab-researchers-turn-everyday-lidar-into-an-around-the-corner-camera/ | Dated 20 May 2026 by inference from "published today" (one search said 13 May) | search_summary | "<$100", "$50,000 setup" quote |
| IEEE Spectrum (C. Q. Choi) | https://spectrum.ieee.org/smartphone-grade-lidar | About 20 May 2026 (unverified); title tag "Smartphone-Grade Lidar Sees Around Corners On the Cheap" | search_summary | "about 100 pixels"; "$0.5–1 million" quote (do not merge with the $50,000 quote) |
| Digital Trends | https://www.digitaltrends.com/phones/the-lidar-sensor-on-your-iphone-could-soon-let-you-see-around-corners/ | May 2026 | search_summary | Lead-author quote on raw data |
| Nature Podcast blurb (MIT page) | https://www.media.mit.edu/articles/how-mobile-phones-might-one-day-be-able-to-see-around-corners/ | 22 May 2026 (one search) | search_summary | "assemblable for under $50" |
| Velten et al. 2012 | https://www.nature.com/articles/ncomms1747 | Published 20 Mar 2012 | search_summary; figure copies `direct` via third-party mirror | H1 |
| Kirmani et al. ICCV 2009 | cited as O'Toole 2018 ref. 14 | 2009 | direct (citation only) | Precursor |
| O'Toole et al. 2018 | https://www.nature.com/articles/nature25489 ; mirror https://github.com/chenyuege/C-NLOS-imaging-based-on-LCT @ `3613ea5`; second mirror https://github.com/ritik3041998/Aw_nlos @ `dc25dd0` | Online 5 Mar 2018 | direct (PDF + SI via mirror); code_or_data (data re-run) | H2 |
| Stanford nlos-fk (2019) | https://github.com/computational-imaging/nlos-fk @ `d34d49f` | 2022 HEAD | code_or_data | Context; non-commercial licence |
| Nam et al. 2021 | https://www.nature.com/articles/s41467-021-26721-x ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8586255/ ; preprint arXiv 2010.12737 | Published 11 Nov 2021 | search_summary; author site `direct` (jihyun-nam.github.io @ `94eb5d5`) | H3 |
| Callenberg et al. 2021 (CheapSPAD) | https://github.com/ComputationalLightTransport/CheapSPAD @ `c76c13f` | 2021 | direct (README); search_summary (venue) | X1 |
| Young et al. ICRA 2025 | https://arxiv.org/abs/2410.03555 | 2024/2025 | search_summary | X2 |
| DENALI | https://arxiv.org/abs/2604.16201 | Apr 2026 | search_summary | X3 |
| Scheiner et al. CVPR 2020 | https://arxiv.org/abs/1912.06613 ; code https://github.com/princeton-computational-imaging/doppler_nlos | 2020 | search_summary; code_or_data | X4 |
| Lab hardware library | https://github.com/camera-culture/cc-hardware @ `ee23576` | — | code_or_data | TMF8828 driver; gantry demo (context for the ams inference) |
| ST VL53L8CH / VL53L8CX datasheets; P-NUCLEO-53L8A1 | https://www.st.com/resource/en/datasheet/vl53l8ch.pdf ; https://www.st.com/resource/en/datasheet/vl53l8cx.pdf | As indexed Oct 2026 | search_summary | Optics, 250 ps bins, presets; kit price about US$52–59 |
| Heide et al.; Keyhole imaging | https://arxiv.org/abs/1711.07134 ; https://arxiv.org/abs/1912.06727 | — | search_summary | Retroreflector falloff caveats |
| IIHS blind-spot study, NHTSA V2V | iihs.org status report 52/6 (Aug 2017); NHTSA readiness report 2014 | — | search_summary | Contrast only (14% significant / 23% not significant) |
| Repo metadata and forks | GitHub search API; `research/context/evidence/fork_ls_remote_2026-10-08.txt` | 2026-10-08 | code_or_data | X5 replication check |
| Production launch packet | `context/Future_Got_Weird_Video_02_Idea_Research.md` (uploaded packet, held in the session scratchpad; not a public source) | — | direct | Secondary corroboration that SV1 and a realistic-scenarios figure exist |

### 2.4 Internal research files

- `final_paper/NOTES.md`
- `manuscript/NOTES.md` (with `evidence/`)
- `code_reproduction/NOTES.md` (with `out/` and `scripts/`)
- `history/NOTES.md` (with `evidence/PROVENANCE.txt`)
- `context/NOTES.md`
- `geometry/NOTES.md` (with `layout.json`)
- `EXPERIMENT_RECORD.md`, `OPENING_EVIDENCE.md`, `claims_draft.csv`, `RIGHTS.md`
- The older `claims.csv` (C01–C41, tied to script lines) is superseded in wording by `claims_draft.csv` (D01–D60) where
  they differ.

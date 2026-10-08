# Context, independence and applications: research notes

Episode: "How Cameras See Around Corners". Research date: **2026-10-08**.
Scope: (1) independent replication, (2) the authors' project page and FAQ, (3) earlier consumer and low-cost NLOS work, for context only, (4) collision-safety evidence, (5) press and community coverage.

## Access legend (applies to every fact)

- **direct**: I read the primary text or data myself.
- **code_or_data**: I inspected or ran released code, git history or repository metadata myself.
- **search_summary**: reported by the WebSearch tool from the named page. I did not inspect the page myself, so treat it as secondary.

Hosts blocked in this container (DNS or 403): nature.com, arxiv.org, media.mit.edu, cornar.media.mit.edu, ncbi/pmc, doi.org, ieee, news.mit.edu. Also blocked in this session (403 at the proxy, one attempt each): `hn.algolia.com`, `hacker-news.firebaseio.com`, `openaccess.thecvf.com`, `github.com/.../issues` HTML. The GitHub issues and PR APIs are also blocked for `sidsoma/consumer-nlos`. I did **not** try to route around these blocks.

**The WebSearch budget for this turn ran out** after about 26 queries from this agent (the limit is shared with other agents). Items that needed more searches are listed under "Unresolved".

---

## 0. Bottom line for the script

1. **No independent replication found** as of 2026-10-08.
   - The repo is popular: 405 stars and 62 forks.
   - None of the 59 forks I could enumerate contains a single new commit, dataset or result. Every fork is an unmodified copy of upstream.
   - Searches found no blog, forum, video or paper reporting a reproduction with independent hardware.
   - **Code availability is not replication.**
2. **The authors' applications are proposed, not demonstrated.** The project page and press name autonomous cars at blind intersections, robot navigation, warehouse robots and AR/VR body or hand tracking. The page also calls the work "an early-stage research prototype."
3. **No proven collision-safety improvement exists** for optical NLOS, consumer or lab-grade. The closest real-world NLOS work for cars is a **different modality**: Doppler radar (Scheiner et al., CVPR 2020). It showed detection and tracking in the wild, not crash reduction.
4. **Coverage:**
   - MIT Media Lab post, "MIT Media Lab Researchers Turn Everyday LiDAR Into an Around-the-Corner Camera". Its date is inferred as 20 May 2026.
   - IEEE Spectrum article by Charles Q. Choi, dated 20 May 2026. Its title varies across sources; see section 5.
   - Hacker News thread item 48265668, "Seeing Around Corners Using Smartphone-Grade Lidar", about 28 May 2026.

---

## 1. Independent reproduction or replication

### 1a. Repository metadata (code_or_data, GitHub search API via MCP, read 2026-10-08)

| Field | Value |
|---|---|
| Repo | `sidsoma/consumer-nlos`, description "Code for plug-and-play non-line-of-sight imaging", homepage `https://cornar.media.mit.edu/`, MIT license |
| Created / last push | 2025-10-17T17:55:49Z / 2026-07-24T02:36:05Z |
| Stars / forks / open issues | **405 / 62 / 1**, as of `updated_at` 2026-10-07T08:36:10Z |
| Topics | computervision, lidar, sensing, single-photon, single-photon-lidar |

### 1b. Git history of upstream (code_or_data, local clone at commit 15314de)

- Paper code and data were committed 2025-10-20, 2025-11-26 and 2025-12-04 by Siddharth Somasundaram.
- **The plug-and-play VL53L8CH demo** (firmware, `track.py`, `calibrate.py`, dashboard) was added in commit `f08d8d1` on **2026-05-20 11:18 −0400**. That is the Nature publication day.
- **Only one non-author commit exists:** `32d6b1c`, 2026-06-28, by Suren Jayasuriya (`sjayasur@asu.edu`).
  - The commit message reads: "Fixed an error that occurred on a Apple M3 Pro chip with macOS Sonoma 14.6 when the flash.py fails to build."
  - It adds a README workaround for a missing `objects.list` make target.
  - It was merged as **PR #2** on 2026-07-23.
  - Interpretation: at least one outside person with an academic email address tried to build and flash the ST firmware.
  - It reports **no tracking result**, so it is evidence of an attempt to use the code, **not a replication**.
  - I could not verify whether this contributor has any relationship with the authors.
- `git ls-remote` on upstream shows only `refs/pull/2/head`. #1 is presumably the single open issue.
- **The content of the open issue could not be read.** The issues API and HTML are blocked here, and GitHub semantic issue search returned 0 results. **Unresolved.**

### 1c. Forks (code_or_data)

- GitHub search indexes **59 of the 62** forks.
- I ran `git ls-remote` on all 59. The raw output is saved at `evidence/fork_ls_remote_2026-10-08.txt`.
  - **32 forks** have HEAD at upstream `fd347b9`, upstream's 2026-05-20 state.
  - **27 forks** have HEAD at upstream `15314de`, upstream's current state.
  - The only branch anywhere that differs from upstream is `sjayasur/fix-readme` (`32d6b1c`), which upstream has already merged.
  - One fork (`technetnew`) has an internal `refs/pull/1/head` that points at the upstream commit, i.e. a sync.
- The 3 forks with pushes after upstream's last push (PeterZs, kekse1, Chronillogical-Potato) were cloned. All three are byte-identical in history to upstream `15314de`, so those pushes were sync only.
- **Conclusion: 0 forks contain new code, data, configs or reported results.** Forks and stars measure interest, not replication.

### 1d. Web search for reproductions (search_summary, 5 differently worded queries)

Queries covered "replicated … VL53L8CH … reddit/hackaday/blog", "I built MIT's see-around-corners lidar … video", "motion-induced … follow-up … independent reproduction", the GitHub issue tracker, and the HN thread.

- None returned a third-party reproduction, a build log or a hands-on video. One Hackaday.io hit, "Non-line-of-sight detection and compressed sensing", was judged unrelated by the search tool. I did not inspect it.
- The HN commenters (see section 5) speculate about the method; none reports trying it.
- An automated review at `pith.science/paper/2605.17865` (explicitly not peer review) notes that the abstract gives no numbers and that the manuscript emphasizes qualitative demonstrations. `search_summary`, low weight.
- A 2026 review, "Comprehensive survey of low-cost single-photon avalanche diodes" (SPIE *Optical Engineering* 65(8) 080901), reportedly describes the motion-induced approach. A review is not a reproduction. `search_summary`, low confidence.

### 1e. Related work that is **not** independent confirmation

| Work | Relation to the 2026 authors | Hardware / conditions | Access |
|---|---|---|---|
| **DENALI**: Behari, Rivero, Apostolides, Ghosh, Liang, **Raskar**. arXiv 2604.16201, submitted 17 Apr 2026. CVPR 2026 (reported as a Highlight). | Shares Raskar; the same MIT Media Lab group. | ams **TMF8828** flash LiDAR (CVPR text). The arXiv intro names TMF8828 and ST VL53L8CX only as examples. 72,000 time-resolved histograms; 60 object shapes × 100 positions × 2 lighting conditions × 2 LiDAR resolutions; physically based "digital twin" per scene. Data-driven localization, classification and size tasks; the authors report a sim-to-real gap. | search_summary (2 searches agree on authors, date and scale) |
| **Young, Batagoda, Zhang, Dave, Pediredla, Negrut, Raskar**, "Enhancing Autonomous Navigation by Imaging Hidden Objects using Single-Photon LiDAR". arXiv 2410.03555 (Oct 2024, revised Mar 2025); ICRA 2025, proceedings p. 3250. | Shares Young, Dave, Pediredla and Raskar. | SPAD-based LiDAR multi-bounce histograms → neural occupancy estimate → planner. Tested in simulation (Project Chrono) and on a physical robot in an **L-shaped corridor with hidden obstacles**. The authors call it the "first experimental demonstration of NLOS imaging for autonomous navigation". Sibling notes (`research/manuscript/NOTES.md`) record ams TMF8828, 3×3 zones, about 5 Hz, from search summaries. | search_summary |

Both are useful context for "robot navigation". Neither is a replication by an outside group.

**Honest conclusion for (1):** "As of October 2026, we found no published independent reproduction. The authors released code for a roughly $50–$100 ST evaluation kit, and dozens of people have copied it, but nobody has publicly reported their own results yet."
Suggested label: *reported by authors; code available; not independently replicated*.

---

## 2. The authors' project page and FAQ (cornar.media.mit.edu)

All items are **search_summary**. The page is blocked here, and the FAQ was only partly visible through search snippets.

- **Page title:** "Seeing Around Corners with Consumer LiDAR", with a "Nature 2026" header. Mirrors: `media.mit.edu/projects/consumer-nlos/overview/` and `media.mit.edu/publications/imaging-hidden-objects-with-consumer-lidar-via-motion-induced-sampling/`.
- **FAQ opener (what and why):** "We show that the same consumer LiDAR sensors found in smartphones, AR/VR headsets, and autonomous vehicles can be used to detect and track objects hidden around corners." It adds: "A LiDAR's picosecond timing resolution allows it to distinguish light reflected from visible surfaces from light that also bounced off a hidden object."
- **Capabilities claimed:**
  - The page lists "(1) three-dimensional reconstruction; (2) single- and multi-object tracking; and (3) camera localization using hidden objects" on "a smartphone-grade LiDAR".
  - It also says "We demonstrate real-time tracking of hidden objects at 30 frames/second."
  - Script caution: 30 frames/second is a frame or update rate. It is not a latency figure, and the snippet does not say which device (proprietary ~100-pixel unit or ST kit) it refers to. The open ST demo's `config.py` default is `ranging_frequency_hz = 30` (code_or_data). That is the sensor capture frequency, not algorithm latency.
- **Cost and setup:** "anyone can image hidden objects with off-the-shelf hardware (for less than US$100) and no additional set-up."
- **"Try It Yourself" (three steps):** "Order the ST sensor (~$50). Download our code and follow the setup instructions. Track hidden objects in real-time!" The page frames this as "Replicate our results with off-the-shelf hardware in three steps."
  - Two searches reported **~$50**. A third summary said "about $100". **The searches disagree; ~$50 is the majority reading.**
  - The repo README targets ST's **P-NUCLEO-53L8A1** kit, a Nucleo-F401RE host plus an X-NUCLEO-53L8A1 shield (direct, README).
- **Applications named (proposed, not demonstrated in a deployed system):**
  - Autonomous vehicles detecting vehicles, cyclists or pedestrians at blind intersections or obstructed roads before they enter direct view.
  - Robots navigating partially occluded, cluttered or "textureless" spaces.
  - AR/VR headsets: spatial awareness, hidden-object localization, and tracking the user's body or hands outside the camera's view.
  - IEEE Spectrum adds warehouse robots detecting movement before turning into aisles.
  - One summary also lists search-and-rescue and inspection. Low confidence; I could not tie it to the page itself.
- **Limitations, open problems and FAQ answers seen:**
  - "This work represents an early-stage research prototype rather than a fully deployable sensing system."
  - Outputs "are not photographs, but progressively richer inferences about presence, motion, and shape." Elsewhere: "current reconstructions primarily recover sparse geometric and motion information from extremely weak indirect measurement".
  - Open challenges listed: **longer ranges**, unpredictable or non-rigid motion, very low light, calibration errors, and real-time performance on mobile hardware.
  - Consumer-device difficulties: "poor signal quality resulting from low laser power, low spatial resolution, and object and camera motion."
- **Does it work with my phone?** Not today. Somasundaram, quoted by Digital Trends and ChannelNews (search_summary), says it would require manufacturers "to release their raw data, which they often don't do." IEEE Spectrum also says manufacturers typically restrict access to raw LiDAR data. The open route is the ST kit.
- **Does it need a wall?**
  - Coverage says it uses light bouncing off "nearby walls and floors" (search_summary).
  - The open demo **requires a flat relay wall filling the sensor's field of view** for calibration, plus an occluder. A matte, light-coloured wall is ideal; glossy or dark walls are worse; direct sunlight on the wall saturates the sensor (direct, README).
  - No FAQ answer specifically about walls was retrieved.
- **Range:**
  - No numeric range from the FAQ was retrieved; it lists "longer ranges" as an open challenge.
  - For the **ST demo only** (direct, README): sensor to relay wall **< 1 m**; relay wall to hidden object **~1–1.5 m**; total round-trip range "around 4 m" at the default `num_bins=48`, 250 ps/bin. My arithmetic, an inference: 48 × 250 ps = 12 ns, and 12 ns × c ≈ 3.6 m of path.
  - These are demo guidance numbers. They are not paper results, and they must not be mixed with the proprietary-device experiments.
- **Privacy:**
  - **No FAQ answer about privacy was retrieved.** Unresolved whether the FAQ covers it.
  - Privacy concerns in search results come from **third-party commentary**: an unnamed opinion piece asking about surveillance by "corporations, criminals, or state actors", and an unattributed commentary on the paper's ResearchGate page saying the work "does not prove person-identification, institutional surveillance".
  - Do not attribute either view to the authors.

---

## 3. Earlier consumer and low-cost NLOS work (context only)

| Work | What it is | Hardware | Access |
|---|---|---|---|
| **Callenberg, Shi, Heide, Hullin**, "Low-Cost SPAD Sensing for Non-Line-Of-Sight Tracking, Material Classification and Depth Imaging", *ACM TOG* 40(4), Art. 61 (**SIGGRAPH 2021**). University of Bonn / Princeton. | Earliest clear precedent for **NLOS tracking with a cheap ST proximity SPAD**. Includes NLOS tracking "for both targets and both setups (with and without mirrors)"; the mirror setup uses a galvanometer scanner driven by an Arduino. | ST **P-NUCLEO-53L1A1** kit: STM32F401RE Nucleo + X-NUCLEO-53L1A1 + two **VL53L1X** satellite boards. This is the same Nucleo-F401RE host family as the 2026 ST demo. Repo `ComputationalLightTransport/CheapSPAD`, commit `c76c13f`, 2021-07-01. | **direct** (repo README); venue and authors search_summary, consistent |
| **Mu, Sifferman, Jungerman, Li (Yiquan), Han, Gleicher, Gupta, Li (Yin)**, "Towards 3D Vision with Low-Cost Single-Photon Cameras", CVPR 2024 (arXiv 2403.17801) | Line-of-sight 3D shape from several cheap SPADs at known poses. **Not NLOS.** Context for "cheap phone-class SPADs give useful timing histograms". | ams **TMF8820** (Fig. 1) | search_summary |
| **Peng, Mu, Nam, Raghavan, Li, Velten, Xiong**, "Towards Non-Line-of-Sight Photography", arXiv 2109.07783 (v1 16 Sep 2021; a 17 Apr 2022 version is marked **withdrawn**). USTC + UW–Madison. | Named in the brief. I retrieved only authors and dates, **not the content**. Nothing retrieved indicates consumer hardware. | unresolved | search_summary |
| **iPhone-LiDAR-specific NLOS before 2026** | **None found** (one search). The press ties the 2026 work to iPhones, but the open demo uses an ST kit and the headline device is an unnamed ~100-pixel smartphone-grade unit. | – | search_summary; medium-low confidence |
| Young et al., ICRA 2025, and DENALI (2026) | See section 1e: same group. | ams TMF8828 | search_summary |
| Passive "CornerCameras" from MIT CSAIL | IEEE Spectrum, "MIT shows how smartphones could peek around corners". Ordinary camera video of faint penumbra variations at the base of a corner, read as 1-D videos. The article says phones peeking around corners is unlikely "within the next few years". Publication date not retrieved. **Different, earlier work. Do not confuse it with the 2026 Spectrum piece.** | Ordinary camera | search_summary |
| Other titles surfaced, not inspected | "Seeing around corners with edge-resolved transient imaging" (Nature Comms 2020, PMC7683558); "Non-Line-of-Sight Tracking and Mapping with an Active Corner Camera" (arXiv 2208.01702); "PathFinder: … Dynamic NLOS Tracking with a Mobile Robot" (arXiv 2404.05024); "SuperEx: … Non-Line-of-Sight Perception" (arXiv 2510.10506) | Titles only | search_summary (titles only) |

---

## 4. Collision safety: is there any proven improvement?

**Answer: no.** I found no study showing that any NLOS sensor (optical consumer, optical lab or radar) has reduced collisions or crashes in real traffic. (search_summary; one extended search on crash-reduction evidence plus the radar searches.)

What does exist:

- **Proposed, not tested:** the 2026 authors and press frame blind-intersection detection for autonomous vehicles as a *possible* application. The 2026 experiments are lab and indoor demonstrations; see sibling notes. Label: *proposed application*.
- **Robot-scale demonstration by the same group:** Young et al. (ICRA 2025) used NLOS occupancy to plan a robot's path in an L-shaped corridor. It is a lab demonstration with a small robot, not a traffic-safety result. Label: *demonstrated by authors' group, lab conditions*.
- **Separate modality, Doppler radar.** Scheiner et al., "Seeing Around Street Corners: Non-Line-of-Sight Detection and Tracking In-the-Wild Using Doppler Radar", CVPR 2020 (arXiv 1912.06613; Princeton record DOI 10.1109/CVPR42600.2020.00214).
  - Automotive radar, using static building facades or parked cars as relay "walls", detects and tracks hidden **pedestrians and cyclists** outdoors.
  - Reported dataset: about 100 sequences across 21 outdoor scenarios, >32 million radar points, ground truth from GNSS/IMU at about 0.8 cm, evaluation region 60 m × 80 m.
  - A reported localization MAE of about 0.1 m appears in summaries.
  - **Average-precision numbers conflict across summaries; do not quote them.** A ">200 m" claim on an academia.edu page looks auto-generated and inconsistent; do not use it.
  - This is **in-the-wild detection and tracking, not crash reduction**, and it is radar (mm-wave), not LiDAR light.
- **Adjacent technologies with measured crash effects (not NLOS imaging):**
  - Blind-spot monitoring: IIHS/HLDI report a 23% reduction in injury lane-change crashes; an Australasian police-crash analysis estimates 15%.
  - Roadside intersection-conflict warning signs: a review cites a Missouri before/after study with 27–32% fewer crashes.
  - V2V/V2X intersection assist: benefits are modeled, simulated or shown in controlled tests (NHTSA 2017 estimates, Safety Pilot "potential").
  - All search_summary. Use them only to make the contrast "this is what *proven* looks like, and NLOS isn't there yet."
- **Low-tech alternative mentioned by an HN commenter:** convex traffic mirrors at blind bends (anecdote).

**Script phrasing:** "Researchers suggest this could someday help cars or robots notice something around a corner. Nobody has shown yet that it prevents collisions."

---

## 5. Coverage

| Item | Title / identifier | Date | Key content | Access |
|---|---|---|---|---|
| **MIT Media Lab news post** | "MIT Media Lab Researchers Turn Everyday LiDAR Into an Around-the-Corner Camera". `media.mit.edu/posts/mit-media-lab-researchers-turn-everyday-lidar-into-an-around-the-corner-camera/` | **20 May 2026, inferred.** The post says "In a paper published today in *Nature*"; the Media Lab publication listing is dated 20 May 2026. The dateline itself was not seen. | Somasundaram quote: "we took a capability that used to require a specialized $50,000 imaging setup and put it into the hands of people in robotics, AR/VR, and beyond". "<$100 and no specialized calibration". Uses the phrase "motion-induced aperture sampling" (the paper title says "motion-induced sampling"). | search_summary (2 searches) |
| MIT News (news.mit.edu) | **None found** (one standard search) | – | – | search_summary |
| **IEEE Spectrum** | `spectrum.ieee.org/smartphone-grade-lidar`. **Title varies:** HTML title "Smartphone-Grade Lidar Sees Around Corners On the Cheap"; on-page and HN/MIT-repost title "Seeing Around Corners Using Smartphone-Grade Lidar"; one result titled "Can Your Phone's Lidar Sensors See Around Corners?". Deck: "Low-cost systems could improve robots, autonomous vehicles". Author **Charles Q. Choi** (credited on the MIT Media Lab repost; the IEEE byline was not seen directly). | **20 May 2026** | Notes "about 100 pixels, each a laser emitter + single-photon detector". Inspired by burst photography and synthetic-aperture radar. Hand tracking with **retroreflective gloves**. Somasundaram quote: earlier NLOS "relied on extremely specialized scientific equipment often costing [US] $0.5 million to $1 million". This conflicts with the "$50,000" quote in the Media Lab post; both are author quotes in different outlets. Raw-data access restricted on phones. | search_summary (3 searches) |
| **Hacker News** | Item **48265668**, "Seeing Around Corners Using Smartphone-Grade Lidar", linking IEEE Spectrum, submitted by `marc__1` | about **28 May 2026**: the latent.space aggregator lists 5/28/2026; another snapshot says "about 133 days old", which fits. | 60 points and "4 comments" on the hn.nuxt.dev mirror (snapshot date unknown); about 9 comments visible. Themes: whether a wall or reflective surface is needed (ofrzeta, libria); the video thumbnail suggests a floor bounce (wongarsu); "isn't this FaceID?" (aftbit); military/police AR helmet speculation (libria); "consumer hardware matching research-grade" significance (mberlove); convex road mirrors as the low-tech solution. **No commenter reports replicating it.** | search_summary (2 searches; points and comment counts unverified) |
| Other outlets | TechXplore (May 2026, `techxplore.com/news/2026-05-smartphones-track-hidden-lidar.html`); ZME Science; HotHardware; Digital Trends ("could soon let you see around corners"; "<$50"); ChannelNews ("US$100 (A$140)"); LiDAR News (26 May 2026); EPT; racunalniske-novice (24.05.2026); Lifeboat blog (May 2026); Nature Podcast episode "How mobile phones might one day be able to see around corners" (date **unresolved**) | May 2026 | Mostly rewrites of the MIT release | search_summary |

**Price figures in circulation (keep them separate):**
- "< US$100" for off-the-shelf hardware: Media Lab post and project page.
- "~$50" for the ST sensor: project page "Try It Yourself" and Digital Trends.
- "A$140": ChannelNews currency conversion.
- "$10 Sensor": caption in the ST demo video, per sibling `manuscript/NOTES.md`.
- These probably refer to different scopes (bare sensor, evaluation kit, or whole setup). **Do not pick one without saying which hardware it means.**

---

## 6. Claim-status guide for the script

| Claim | Status |
|---|---|
| Consumer-class LiDAR hardware can detect, track or coarsely reconstruct hidden objects in the authors' lab setups | **Reported by authors** (Nature 2026). Not independently replicated. |
| Anyone can try it with an ST kit and the released code | **Code available (code_or_data).** Building and flashing were attempted by at least one outside user (PR #2). No outside results reported. |
| Works on today's phones | **No.** Raw data is not exposed (author quote via press). |
| Helps self-driving cars at blind intersections | **Proposed application.** No vehicle tests. |
| Prevents collisions | **No evidence.** Do not imply it. |
| Robots can use NLOS to navigate | **Demonstrated by the authors' group** in a lab corridor (ICRA 2025), with different hardware and a different paper. |
| Seeing around street corners in real traffic | **Independently demonstrated by another system and modality**: Doppler radar (Scheiner et al. 2020). Detection and tracking only. |
| Cheap SPAD NLOS tracking before 2026 | **Independently demonstrated**: Callenberg et al. 2021, ST VL53L1X, a different group. |
| Privacy or surveillance risk | **Third-party commentary only**; no author FAQ text retrieved. Label it as an open question. |

---

## 7. Unresolved

1. The content of the single open GitHub issue on `sidsoma/consumer-nlos`. The issues API and HTML are blocked.
2. The full FAQ text on cornar.media.mit.edu, especially any privacy answer and any numeric range answer. Only partial snippets were retrieved.
3. Whether the FAQ's "30 frames/second" refers to the proprietary device or the ST kit.
4. The "Try It Yourself" price: ~$50 (2 searches) vs ~$100 (1 summary).
5. The IEEE Spectrum current headline (three variants) and a direct confirmation of Choi's byline on spectrum.ieee.org.
6. The exact HN submission timestamp, points and comment count. Mirror figures are snapshot-dependent.
7. The Nature Podcast episode date. The search budget was exhausted before this query ran.
8. The exact MIT Media Lab post dateline. 20 May 2026 is inferred from "published today".
9. Whether any of the 3 forks not indexed by GitHub search (62 total vs 59 indexed) contains changes.
10. The content of "Towards Non-Line-of-Sight Photography" and whether it involves any consumer device.
11. Scheiner et al. 2020 tables: AP and MOTA values conflict across summaries, and the paper was not readable here.

## 8. Sources

- Repo (local clone, commit 15314de): https://github.com/sidsoma/consumer-nlos
- Forks evidence: `research/context/evidence/fork_ls_remote_2026-10-08.txt`
- CheapSPAD repo (cloned, commit c76c13f): https://github.com/ComputationalLightTransport/CheapSPAD
- Project page: https://cornar.media.mit.edu/
- Media Lab post: https://www.media.mit.edu/posts/mit-media-lab-researchers-turn-everyday-lidar-into-an-around-the-corner-camera/
- Media Lab publication listing: https://www.media.mit.edu/publications/imaging-hidden-objects-with-consumer-lidar-via-motion-induced-sampling/
- Media Lab repost of Spectrum: https://www.media.mit.edu/articles/seeing-around-corners-using-smartphone-grade-lidar/
- IEEE Spectrum: https://spectrum.ieee.org/smartphone-grade-lidar
- Older Spectrum (CornerCameras): https://spectrum.ieee.org/mit-shows-how-smartphones-could-peek-around-corners
- HN: https://news.ycombinator.com/item?id=48265668 ; mirror https://hn.nuxt.dev/item/48265668 ; aggregator https://news.latent.space/story/clu_82pg7
- DENALI: https://arxiv.org/abs/2604.16201 ; CVPR PDF https://openaccess.thecvf.com/content/CVPR2026/papers/Behari_DENALI_A_Dataset_Enabling_Non-Line-of-Sight_Spatial_Reasoning_with_Low-Cost_LiDARs_CVPR_2026_paper.pdf
- Young et al.: https://arxiv.org/abs/2410.03555
- Mu et al. CVPR 2024: https://arxiv.org/abs/2403.17801
- Peng et al.: https://arxiv.org/abs/2109.07783v1
- Scheiner et al.: https://arxiv.org/abs/1912.06613
- Digital Trends: https://www.digitaltrends.com/phones/the-lidar-sensor-on-your-iphone-could-soon-let-you-see-around-corners/
- ChannelNews: https://www.channelnews.com.au/smartphones-could-soon-see-around-corners-with-lidar-breakthrough/
- TechXplore: https://techxplore.com/news/2026-05-smartphones-track-hidden-lidar.html
- LiDAR News: https://lidarnews.com/consumer-lidar-can-now-see-around-corners/
- Pith automated review: https://pith.science/paper/2605.17865
- Crash-effect context: https://www.itskrs.its.dot.gov/2019-b01384 ; https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/812429-hv_v2v_safetybenefits.pdf

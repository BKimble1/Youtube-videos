# Source Notes: "Wi-Fi Through Walls" (Future Got Weird Short, 36 s)

Fact-check of the locked narration against two separate studies. Compiled 2026-10-27.

**Access caveat:** every primary page (rfpose.csail.mit.edu, kit.edu press release, publikationen.bibliothek.kit.edu,
dl.acm.org, openaccess.thecvf.com) and every mirror tried was **blocked by the session's egress proxy (403 / DNS fail)**.
All facts below come from web-search result extracts (snippets of the primary pages plus secondary coverage).
Items marked **[verify]** could not be confirmed from a primary-text extract and should be checked in the PDF before quoting on screen.

---

## A. RF-Pose (MIT CSAIL, CVPR 2018)

- **Paper:** "Through-Wall Human Pose Estimation Using Radio Signals." Mingmin Zhao, Tianhong Li, Mohammad Abu Alsheikh,
  Yonglong Tian, Hang Zhao, Antonio Torralba, Dina Katabi. CVPR 2018, pp. 7356-7365.
  Project: https://rfpose.csail.mit.edu/ ; paper: https://openaccess.thecvf.com/content_cvpr_2018/html/Zhao_Through-Wall_Human_Pose_CVPR_2018_paper.html
- **Hardware:** custom FMCW radio with **two antenna arrays, one horizontal and one vertical** (T-shaped layout). FMCW separates
  reflections by distance, and the arrays separate them by direction. The output is a pair of 2D RF heatmaps (horizontal + vertical projections),
  30 pairs per second. (Paper extract.)
- **Frequency:** "Wi-Fi frequencies" per paper extract. The FMCW sweep of roughly **5.4-7.2 GHz** (the same radio family as RF-Capture,
  ~5.46-7.24 GHz) is **[verify]**: search extracts did not surface the exact sentence.
- **Power:** paper states it transmits "**1000 times lower power than WiFi**". (Paper extract.)
- **Output:** **2D human skeleton keypoints**. **14 keypoints** (head, neck, shoulders, elbows, wrists, hips, knees, ankles) per
  secondary summaries **[verify]**. Multi-person.
- **Through walls / occlusion:** works for visible scenes and through walls. AP 62.4 (visible) vs 68.8 for the OpenPose camera teacher, and
  **AP 58.1 through walls**, even though it was **never trained on through-wall examples**. (Paper/poster extract.)
- **Training:** **cross-modal supervision** (teacher-student). A webcam is synchronized with the radio during training, a vision model
  (OpenPose) labels the camera frames, and those labels supervise the RF network. **After training it uses radio alone.**
  Dataset: >50 hours, >50 environments (poster).
- **Not a Wi-Fi router:** it is specialized research radio hardware. It uses Wi-Fi-band frequencies but is not ordinary Wi-Fi networking gear.
- **Identification claim:** MIT News coverage (2018, repeated by WEF and CSO Online) says the team also identified a person **83% of the time
  out of a line-up of 100** using RF signals, pitched for search-and-rescue. This is secondary to the paper's pose results **[verify]**.
  Sources: https://www.weforum.org/stories/2018/06/artificial-intelligence-senses-people-through-walls/ ,
  https://www.csoonline.com/article/3281129/mits-ai-can-now-see-and-track-people-through-walls-using-wireless-signals.html

## B. BFId (KIT / KASTEL, ACM CCS 2025)

- **Paper:** "**BFId: Identity Inference Attacks Utilizing Beamforming Feedback Information**." **Julian Todt, Felix Morsbach,
  Thorsten Strufe** (KASTEL, KIT). *Proceedings of the 2025 ACM SIGSAC Conference on Computer and Communications Security*
  (**CCS '25**, Taipei, Oct 13-17 2025). DOI **10.1145/3719027.3765062**. KIT repository: https://publikationen.bibliothek.kit.edu/1000185756
- **Press release:** KIT No. 069/2025 (Oct 2025), "The Spy Who Came in from the WiFi: Beware of Radio Network Surveillance!"
  https://www.kit.edu/kit/english/pi_2025_069_the-spy-who-came-in-from-the-wifi-beware-of-radio-network-surveillance.php
  (ScienceDaily and others recirculated it in May and Aug 2026.)
- **What BFI is:** the AP starts channel sounding, and each client (beamformee) computes compressed beamforming angles and sends them back
  so the AP can steer its signal (802.11ac/ax). These feedback frames are **sent unencrypted**, so anyone in range can capture them
  passively with an ordinary Wi-Fi card in monitor mode. The attacker needs **no special hardware and no network access**.
  Compare CSI-based sensing, which needs modified firmware on a few specific cards.
- **Participants:** dataset of Wi-Fi recordings of **197 individuals** (the abstract's own words). Usable subsets after technical dropouts were reportedly
  **161 (BFI)** and **170 (CSI)**. Some outlets attach 99.5% to "170", so the exact usable n is **[verify]**.
- **Accuracy:** **99.5% (+/-0.38)** identification on the normal-walking test set (BFI). CSI baseline: **82.4%**. The abstract says only that identities are inferred
  "with very high accuracy" across walking styles and perspectives. The 99.5% figure is from secondary reporting of the paper body **[verify]**.
  The KIT release says "almost 100%".
- **Conditions:** controlled lab recording area with repeated walking paths. **Multiple walking styles** (reported: normal, fast, with backpack,
  carrying a bottle crate, turnstile-style path; count **[verify]**) and **multiple perspectives** (several AP-client links).
  Participants were reportedly asked to avoid baggy clothes, skirts and heels. Traffic was tuned to generate enough BFI.
- **"Without their phones":** correct in substance. The people walking are identified from how their **bodies disturb the radio channel
  between OTHER Wi-Fi devices** (AP and clients in the room). The subject does not need to carry, or switch on, any device. KIT: switching off
  your own phone does not help while other Wi-Fi devices nearby are active.
- **What "identify" means:** **closed-set re-identification**. A model trained on previously recorded walks of the same people matches a
  new walk to one of those known people. It **does not learn names** and was not shown to identify unknown people. Linking a person to a
  real identity needs a separate labeled database.
- **Researcher framing:** Strufe likens it to a camera using radio waves instead of light, and Todt says it "turns every router into a potential
  means for surveillance". The authors call for privacy protections in IEEE 802.11bf. Dataset on RADAR (restricted access).

---

## C. Narration, line by line

| # | Line | Status | Caveat |
|---|------|--------|--------|
| 1 | "If you hid behind this wall... this machine could STILL WATCH YOU." | Supported with caveat | "Watch" = estimates body pose; it produces no image of you. |
| 2 | "Scientists built a system that shoots invisible radio waves THROUGH walls." | Supported | Custom low-power FMCW radio (Wi-Fi band). |
| 3 | "And when they bounce off your body, AI creates a moving SKELETON of you." | Supported | 2D keypoint stick figure, 14 joints [verify]. Trained with camera labels. |
| 4 | "Raise your hand? It raises its hand." | Supported | Real-time limb tracking shown in MIT demos. Through-wall accuracy is lower (AP 58 vs 62). |
| 5 | "But here's where it gets CREEPY." | n/a (tone) | |
| 6 | "In a separate experiment, scientists used ordinary Wi-Fi signals to IDENTIFY people walking past." | Supported with caveat | BFId used standard Wi-Fi BFI. "Identify" = re-identify among previously recorded people. |
| 7 | "Even WITHOUT their phones." | Supported | Signals come from other devices' links. The subjects carried nothing. |
| 8 | "They tested 197 people... and identified almost EVERYONE correctly." | Supported with caveat | 197 recorded. About 161 usable for BFI. 99.5% was per-sample accuracy in a controlled lab, closed set. |
| 9 | "So imagine walking past a café, and it recognizes you without you doing ANYTHING." | Hypothetical | Not demonstrated in public. It would need prior recordings of you and a trained model. Label it as an illustration. |
| 10 | "Now would you rather have a CAMERA watching you... Or Wi-Fi that knows who you are?" | Rhetorical | Fine. "Knows who you are" = matches you to earlier recordings, not your name. |

Overall: narration keeps the two studies separate ("In a separate experiment"), which is accurate. Do not merge them visually.

## D. Visual guardrails

**RF-Pose segment may show:** a boxy research radio unit (not a consumer router) with T-shaped antenna arrays, faint radio waves passing through a
wall, and a 14-point stick-figure skeleton moving in sync with a hidden person (raising a hand). Optional overlay: two heatmap panels (horizontal/vertical).
**Avoid:** photo-real video or a thermal/X-ray silhouette of the person behind the wall (output is keypoints only), face detail, a name tag or ID on
the skeleton, a Wi-Fi router logo or icon as the device, and 3D mesh bodies (the CVPR 2018 version is 2D).

**BFId segment may show:** a room with an ordinary router plus a few Wi-Fi devices, people walking through with **no phone in hand**, a laptop
in monitor mode capturing feedback packets, a signal-pattern or "gait signature" waveform matched against a **gallery of previously recorded
participants** (anonymous IDs like "P-042"), and a match % near 99.
**Avoid:** real names, social profiles or faces popping up (not learned), skeletons in this segment (BFId does not produce pose), the subject's
own phone emitting the signal, and implying a live deployment in shops or cafés.

**Café scene:** must read as imagined (e.g. "What if…" caption, stylized look). Nothing shows this happening in real cafés.

## E. YouTube description: Sources block (draft)

```
Sources:
• MIT CSAIL, RF-Pose: Zhao et al., "Through-Wall Human Pose Estimation Using Radio Signals," CVPR 2018 — https://rfpose.csail.mit.edu/
• KIT, Todt, Morsbach & Strufe, "BFId: Identity Inference Attacks Utilizing Beamforming Feedback Information," ACM CCS 2025 — https://publikationen.bibliothek.kit.edu/1000185756 (doi.org/10.1145/3719027.3765062)
• KIT press release 069/2025 — https://www.kit.edu/kit/english/pi_2025_069_the-spy-who-came-in-from-the-wifi-beware-of-radio-network-surveillance.php
The café scene is a hypothetical illustration; the BFId results come from a controlled lab study with 197 volunteers.
```

## F. Secondary sources consulted (via search extracts)

- RF-Pose: openaccess.thecvf.com paper page; people.csail.mit.edu RF-Pose poster; researchgate figure (teacher-student); WEF / CSO Online (83% line-up claim).
- BFId: tomshardware.com (99.5%, no device carried); thecybersecguru.com (BFI mechanism, 161/170 usable, walking styles, CSI 82.4%);
  webiano.digital (controlled conditions); sciencedaily.com (unencrypted BFI); cybernews.com (Strufe/Todt quotes, controlled test);
  dblp (venue); RADAR dataset listing.

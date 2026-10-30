# PRODUCTION PROMPT FOR CLAUDE — Future Got Weird long-form

**Project:** `Future_Got_Weird/chainsaw-railway-robot`
**Repository:** `BKimble1/Youtube-videos`
**Production branch:** `fgw/chainsaw-robot-production-2026-10-30`
**Episode title:** Japan Built a Robot With a Chainsaw for an Arm
**Status:** Complete V1 requested. Script locked; footage clearance is an unresolved gate. Do not claim external footage files were uploaded.

You are the researcher, factual editor, motion director, sound designer, Remotion engineer, and final QA owner of the next Future Got Weird long-form video.

## 0. FIRST: inspect the real repository and reference materials

1. Open this production folder and read `README.md`, `SCRIPT_LOCKED.md`, `SHOT_MAP.md`, `FOOTAGE_SOURCES.md`, `raw/README.md`.
2. Read `Future_Got_Weird/FGW_EDITING_RULES.md`. Inspect `Future_Got_Weird/robot-faces/`, especially its current `README.md`, `script.md`, `production/SHOT_LIST.md`, `production/TRANSITIONS.md`, `production/SOURCE_NOTES.md`, Remotion source rigs and QA methods. The user's other successful long-form benchmark is the Tesla Roadster episode; inspect its existing accessible final materials, do not invent a comparison if they are unavailable. Short visual benchmarks are Cyborg Cockroach V5 and Dead Spider V6 if actual assets exist.
3. Check git status, active branch, environment and available tools. Work only in a new, isolated project folder/worktree. Protect all existing video projects; never overwrite shared packages, their narration or their outputs.
4. Verify actual ElevenLabs, Runway, Remotion, ffmpeg, Git LFS and media import capabilities. Do not guess voice identifiers, external API access, or tool names.

## 1. THE CREATIVE PROMISE — YOU MUST DELIVER IT

The audience clicks expecting proof of a Japanese robot cutting branches with a chainsaw. Give that proof **in frame one** using authentic, source-verified footage if usage is cleared; do not open with generic animation, a logo, headlines, a fake mech, a silhouette, an intro or a talking host.

Then repeatedly reframe the machine:
- 0–15s: This really cuts branches. The claw holds the wood while a saw cuts.
- 15–30s: It is not a legged robot; the torso is atop a boom and a rail-capable truck.
- 30–75s: A human remotely controls the machine, with one arm gripping and one cutting.
- 75–120s: The real technical idea is an amplified human at the controls; show *bilateral control* as documented on JR West's related robot, not an invented specification of the October JR East machine.
- 120–150s: Human safety risk from elevated/near-electrical work.
- 150–180s: JR West's separate new-generation equipment with clearly distinguished dates and capabilities.
- 180–end: Return to controls and the human using the machine as two giant hands.

Target a **3:00–3:30** final based on actual spoken audio; the 195 second `SHOT_MAP.md` is a visual blueprint, not a reason to stretch narration or hold a static frame. An engaging 3:05 is better than an artificially padded 3:15.

## 2. LOCKED SCRIPT: NO DEVIATIONS

`SCRIPT_LOCKED.md` is the complete 440-word script and is the only narration authority. Read it verbatim. Do not shorten, paraphrase, rearrange, or change a single line, including the ending. Don't replace any line with a 'subscribe' CTA. Any necessary factual correction should be proposed separately with source and reason, and must not be silently inserted.

Use the established ElevenLabs **Test Voice**. Match recognizable channel delivery. The first line must strike hard but not sound corny: 'Japan built a robot with a CHAINSAW for an arm.' Strong emotion comes from what we SEE, not exaggerated shouting. Speak energetically and naturally, with clean diction and minimal pauses.

Generate one narration master and precise **word-level timing**. Build a cue map so all picture motion, captions and transitions follow the spoken words. Preserve alignment after editing.

## 3. FOOTAGE: INTEGRATION AND RIGHTS ARE FIRST-CLASS TASKS

`FOOTAGE_SOURCES.md` contains links to actual JR East cutting footage (ANN, KAB and FNN), JR West's 2024 official demonstration reference and 2026 press materials. You have **source links, not uploaded video files**.

- Inspect each source and record its date, owner, machine identity, visual contents and exact relevant in/out times after actually watching it.
- Do **not** download and commit broadcast video or corporate imagery into a **public GitHub repository** merely because it is viewable online. Establish a documented reuse grant/license, or have the creator review a specific editorial fair-use assessment. Fair use is context-dependent, and a 2-second excerpt is not automatically safe.
- Once authorized, ingest real source media to a local/private cache with SHA-256 and rights/provenance ledger; do not distribute it publicly unless authorized.
- If no rights-cleared opening shot is available, report the blocker and render an explicitly labeled source-footage-placeholder **previsualization**, not a falsely described publish-ready documentary. You can continue building the entire original animation and audio independently.
- Do not remove a news watermark deceptively, misrepresent source footage, falsify tool use, or imply generated frames are broadcast footage.
- When licensed footage exists, use it sparingly but meaningfully: 0–15 seconds proof, 15–30 seconds full scale, 30–75 seconds operator coordination, return near finale. Avoid dozens of recycled repeated 1-second clips.
- Keep 2026 **JR East** operation visually and textually distinct from JR West's **2024** machine, October **2026** single-arm new system, and November **2026** planned upgraded humanoid. The 2026 October 30 video cannot truthfully show November deployment as an already happened operation.

## 4. EXACT ACTION DIRECTION

`SHOT_MAP.md` is a detailed 195-beat, second-by-second visual and camera design. Follow the *story logic* and all physically meaningful actions. After the ElevenLabs master is produced, map each beat to the appropriate words; combine beats when needed, but don't omit any core reveal.

The editing should feel like the Tesla Roadster breakout and Robot Faces best-performing long-form, not an endless slideshow. Show a demonstrably impossible-looking thing in motion first, followed by true scientific and mechanical answers, then a real-world consequence.

A. Opening: actual gripping + chainsaw interaction. Show the cut and keep the claw visible. Do not jump to a cinematic fictitious robot render. Onscreen first-frame movement must be unmistakable.

B. Reveal: continuous transition along the real robot torso → boom → truck → operator cabin. Do not add fictional walking legs. Mechanical proportions, tool mounts and locations must match verified reference media.

C. Controls: human hand and robot gripper move in a matched cause-and-effect sequence. If exact control-to-robot timing isn't documented in footage, show it as an **original illustrative reconstruction**, and do not present a simulated POV as authentic.

D. Mechanism: use a clean precise original layered 2D / 2.5D cutaway to trace input and *possible* haptic resistance through a bilateral control loop. Explicitly ground JR West's use from the 2024 documentation. Do not depict nonexistent AI consciousness or unverified exact physical parts.

E. Scale payoff: match a normal person's fingers moving to the large robotic fingers, with accurate joints and gripping motion. This is the emotional and engineering payoff around 1:45.

F. Safety: show accurate, non-sensational illustrated height/electrical hazards; no fabricated accident or dangerous 'live-wire contact' stunt.

G. 2026 reveal: clear date labels for JR West's new single-arm robot (October 2026 introduction) and upgraded humanoid (November 2026 planned), no misleading seamless morph from JR East's robot. JR West's Oct 16 release gives 120kg holding capacity for the single arm, and a goal of approximately 30% fewer personnel for relevant jobs; do not present the target as an achieved result.

H. Ending: operator's small hand motion → giant gripper closure → actual blade cutting. Match final narration: 'It gave a PERSON a pair of giant mechanical arms.' Finish decisively, no subscribe screen.

## 5. VISUAL STYLE AND CAMERA

- The recognizable Future Got Weird **2D vector and restrained 2.5D parallax** look. Do NOT switch to generic plastic 3D robotics renders.
- Use real footage as evidence, with original art for explanation. Never use a 'news' still as an animated source without provenance.
- Spatially motivated camera: input controller → robot arm, saw blade → wood, gripper → load path, torso → boom → vehicle. Smooth travel, gentle acceleration; no whip pans or random snap zooms.
- Strong movement roughly every 1–2 seconds when the story benefits, but NEVER cut away from satisfying real action just to hit a timer.
- The Weird Crew may be used as background visual language sparingly, but the robot/wood/operator are the stars. No inserted floating text bubbles, circular AI captions, radial diagrams or generic thumbnail-like logos.
- Accurate axes and joints; no arms passing through torso, no changing attachment design, no morphing motor placements, no teleporting branch, no controller discontinuity.
- Don't invert camera direction or motion at shot boundaries without reason. Inspect frame-by-frame continuity.
- Build original explanatory elements as reusable vector layers/Remotion components. Use Runway only where the actual model preserves consistent reference geometry; never let its generated interpretation replace source evidence.

## 6. AUDIO / SOUND DESIGN

- ElevenLabs Test Voice exact script and naturally energetic performance.
- Constant very quiet ambient bed with natural transitions. Never use repetitive on/off jet noise or loud cinematic stingers.
- Authentic chainsaw audio in licensed footage if permissible, kept low under narration. Otherwise source cleared SFX; no repurposed TV sound without review.
- Micro-sounds of controller movement, tool engagement, gripping force, metal articulation and branch flex, synchronized to physics.
- Make a brief but satisfying sonic contrast at the force-feedback and 'giant steel arms' reveals.
- Mix voice consistently intelligible at phone/laptop playback levels. Use measured LUFS/true peak QC, no clipping.

## 7. PACKAGE, EDIT, QA AND DELIVERY

Target composition: **1920×1080, 30fps** V1 review, and reproducible **3840×2160** master (true vector 2x render where possible). Save source code and render instructions. Do not claim output files exist if you haven't actually rendered them.

Suggested deliverables under this project's folder:
- `source/` isolated Remotion project and source art
- `audio/narration/` exact ElevenLabs voice take, ID/provenance, word alignment
- `audio/mix/` music/SFX mix + measurement report
- `captions/` SRT from actual word timings (external captions for long-form; no giant burned-in social captions)
- `production/CLAIM_LEDGER.md`, `SHOT_LIST.md`, `TRANSITIONS.md`, `SOURCE_PROVENANCE.md`, `QA_REPORT.md`
- `exports/FGW_Chainsaw_Robot_V1_REVIEW_1920x1080.mp4`
- `exports/FGW_Chainsaw_Robot_V1_MASTER_3840x2160.mp4` when the V1 passes review

Transition ledger: outgoing subject → incoming subject → newly revealed information → keep/merge/remove. Discard pointless excursions.

QA: normal playback; frame step around every transition; muted phone-size test; audio/dialogue sync; anatomical continuity; real-vs-reconstructed labeling; source licensing; end-to-start watch; visual interest every few seconds without meaningless motion. Check 0–3s and 0–30s especially hard.

For a missing license or media download: continue every independent production part, save deliverables and identify the precise blocking shot and clearance requirement. Do not substitute a fake news shot or call a placeholder a final.

## 8. DELIVER HONEST RESULTS, NOT ASSURANCES

Produce the strongest **real, source-grounded first pass**, with a concise timestamped quality review and original footage ledger. Do not predict specific views, CTR or retention. The creator will compare this with successful Robot Faces/Tesla Roadster long-form and will not accept aimless revision cycles.

**Stop when V1 is properly rendered or the specific external footage clearance is the genuine blocker. Do not keep rewriting the locked script or ask for permission to perform routine non-destructive production.**

# V2 change report: targeted previsualization improvement (30 Oct 2026)

**File:** `exports/FGW_Chainsaw_Robot_V2_PREVIS_REVIEW_1920x1080.mp4`. Its stream is genuinely 1920×1080 (ffprobe:
width 1920, height 1080, 4,645 frames at 30 fps), rendered natively from the vectors at that size, not a scaled
proxy. V1's export was checked the same way and is also a true 1920×1080 stream.

**Unchanged:** the locked narration, its master file and every word time; the runtime (2:34.83); the
2D/2.5D art system and rigs (machine, Weird Crew operator and workers); the reveal 0:19–0:33; the cabin; the fingertip
→ claw match; the overall act order. Nothing is presented as authentic footage. Every footage stand-in still
carries the PREVIS tag.

**Side-by-side evidence:** `qa/v2/compare/` holds one sheet per review section, V1 on the top row and V2 on the
bottom row, at identical times.

## Timestamped changes

| Time | Section | V1 problem (your review) | V2 change |
|---|---|---|---|
| 0:00–0:15 | Opening (placeholder) | composition barely changed; claw looked open; sawdust below the branch, detached from the cut; cutting unconvincing | **Physical errors fixed only.** The claw's fingers now wrap the branch (knuckles beside the wood, tips curled under it). The bar visibly sinks into the wood: the near wood is drawn over the bar, with the kerf as a slit that deepens. Chips leave from the kerf entry, are thrown back along the bar, then fall. The camera starts tight on the bar in the wood (frame 0), pulls back to reveal the claw holding (0:04), slides to the claw (0:07), returns to the cut (0:11), holds the separation (0:12), then widens to both tools on the machine (0:15). The weight drops into the claw at break-through (a short dip and recovery). |
| 0:00–0:20 | Footage slot | one generic slot | **FS-1 split into the five beats** the real clip must cover (FS-1a–e: saw in wood / gripper supporting / saw continuing / separating under control / wider with both tools). Each beat has its own PREVIS tag, and a matching entry in `source/src/data/footage.json` and `production/FOOTAGE_EDIT_PLAN.md`. |
| 0:15–0:35 | Reveal | good; scale could be stronger | Preserved. A lookout worker now stands clear on the ground in every wide worksite shot, so the machine's size reads at once. The wide frame is slightly wider (whole machine + person). No new angles. |
| 0:44.8–1:07 | Central action | similar-looking approaches without clear cause and effect; repeat cuts to a stationary saw | **One operation, one camera path.** **A** grip (0:47.0–0:48.6): claw approaches, fingers spread, descends, closes round the wood, takes the weight. **B** cut (0:49.6–0:53.3): the camera crosses to a separate cutting point; the saw contacts at 0:50.97; chips from the contact; the bar sinks through. **C** weight (0:53.3–0:54.2): the piece comes free, the arm dips under the load and recovers, and the piece stays rigidly in the claw. **D** removal (0:54.2–0:59.0): the arm lifts the section up and back, away from the track ("a crane can lift"). At 0:59.5 the camera crosses to the fresh cut face and the saw ("a chainsaw can cut"); at 1:01.5 it pulls back to both arms; at 1:04.7 it goes down the boom to the cabin. **No second cut and no stump-twig trim.** |
| 1:07–1:28 | Bilateral control | too long on one blue diagram | **The loop as a physical journey.** In the cabin, the route from the controller to the window is revealed in place (1:10.6). At 1:16.0 a small push sends a blue command along it and out of the window. The camera rides it up the boom to the shoulder (1:17.5–1:19.3). The claw swings up under the branch and presses (1:20.3); the branch flexes and resists. Orange feedback runs back down the boom and in through the window (1:21.6–1:24.1). The handle pushes back against the hand (orange ring, low thump, 1:24.1). The operator eases off (1:24.6–1:25.6), and on the monitors the claw eases with a smaller, controlled movement. One brief title and one provenance line ("principle as documented for JR West's related machine, not this machine's parts"). No diagram cards, circular diagrams or arrows. |
| 1:36–1:54 | Elevated maintenance | transitions human→robot; scale; hazard labelling; operator–task relationship | Preserved staging. A **height marker** ("above the track") from rail to platform on "high above the tracks". The dashed falling fitting is labelled **"illustration · not a recorded incident"**. **No fades:** on "moving the operator away" the platform lowers its worker to the ground and the climber comes down, while the machine rolls in and its claw takes over the same bracket. Labels **"operator · on the ground"** and **"the elevated job"** sit at the two ends of the distance line. |
| 1:53–2:19 | JR West equipment | diagrams and labels too small | **Rebuilt as a depot line-up of separate machines at large scale**, each with a big sign (company, date, one line), and a fixed **date rail** at the bottom (JUL 2024 · MAR 2026 · OCT 2026 · TODAY 30 OCT · NOV 2026) that highlights the machine on screen. The JR East machine is yellow/white; JR West's are blue. The **NOV 2026** humanoid is faded, with a dashed sign, a **PLANNED** stamp and a "longer reach" envelope, after the TODAY marker. The **OCT 2026 single-arm robot** is a separate machine with one heavy arm (no humanoid body) lifting a component, labelled "up to 120 kg". The goal panel reads "Goal: about 30% fewer people for these jobs · JR West's stated target, not a measured result". Each stop has a slow push and the machines move, so nothing freezes. **Order note:** the brief asked for 2024 → single-arm → humanoid, but the locked narration names the humanoid (2:04.9) before the single-arm robot (2:09.1). The picture follows the narration, and the date rail keeps the chronology correct. |
| 2:19.6–2:34.8 | Final payoff | familiar imagery, no new payoff | The saw is switched off and **lifted clear**. In the cabin, the operator makes **one small movement**: the grip pulls toward them, its top travelling right and down, with the trigger squeezed (2:28.8–2:29.3). **Matched cut** to the claw moving the same way (down and right) and **closing** on the branch (2:29.3–2:30.0), with the saw arm still out of frame. **Then** the second arm swings the saw into position (2:30.0–2:30.6) and cuts (2:30.6–2:33.0). The weight drops into the claw. The pull-back ends wide on the **lit cabin with the operator**, the boom, both arms holding the cut piece, and a person on the ground. No outro. |
| whole film | Sound | chainsaw could compete with the voice | Chainsaw sustain only while the chain runs, loudest only during blade contact (from the picture's own contact and break-through times). The saw is ducked about 13 dB under the voice while words are spoken. Measured: in every voiced 50 ms window of the three cuts, the voice stays above the effects (medians 13–16 dB, 5th percentile ≥ 2.2 dB). New cues: the contact clunk at the branch, the feedback thump when the pushback reaches the hand, and quiet signal tones following the travelling pulses. The ambient bed is continuous. |

## Measured QA (V2 file)

See `qa/v2/review_qa.json`, `qa/v2/review_phone_sheet.png`, `qa/v2/transitions_strip.png` and `qa/v2/compare/`.
| Check | V2 result |
|---|---|
| Stream | H.264, **1920×1080** (verified), 30 fps, yuv420p, 4,645 frames; AAC 48 kHz stereo |
| Duration | 154.833 s, identical to V1 and to the narration master |
| Decode errors | 0 |
| Loudness | -14.0 LUFS integrated, LRA 3.0 LU, true peak -1.3 dBTP |
| Mix balance (pre-encode) | voice 13.2 LU above effects + beds (V1: 9.3) |
| Chainsaw vs voice | the voice stays above the effects in every voiced 50 ms window of the three cuts (medians 13–16 dB; 5th percentile ≥ 2.2 dB) |
| Audio sync | best lag 0 ms against the narration master |
| Black frames / freezes ≥ 2 s | none / none (the first V2 render froze twice in the depot line-up; fixed with a slow push and moving machines at each stop) |
| Frame-difference scan | 14 large changes, **all planned cuts**; **0 unplanned** (a one-frame zoom jump at 1:16.03 in the first V2 render was fixed) |
| Low-motion seconds | only 0:18 (the ghost branch lands on the rails: a deliberate one-second hold) |
| Narration | unchanged master; Whisper on the mix: 440/440 words, only spelling differences ("chain saw", "single arm"), "robotics"→"robotic", and "and tell"→"until" at 2:27 (same as V1; a listening check is recommended) |
| Captions | unchanged SRT; 53 cues on measured word onsets, no overlaps |


## Shots still waiting for real footage

`production/FOOTAGE_EDIT_PLAN.md` (FS-1a–e, FS-2, FS-3, FS-4a–b, with what each clip must show). After V2 the
remaining production priority is to clear and integrate authentic footage and do the final sync, not further
animation passes.

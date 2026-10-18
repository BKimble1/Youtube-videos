# THE LAST CHOICE — R3 FINAL-PASS AUDIT AND CLAUDE PROMPT

Reviewed: `FGW_TheLastChoice_R2_REVIEW_1080p.mp4`  
Source runtime: **4:18.000**, 1920 × 1080, 30 fps  
All timestamps below refer to R2, not the future edit.

## Verdict

The story now has the right shape: burning city, a battered leader, allies assembling, a last stand, defeat, surrender, a personal death, and the city continuing without them. Preserve that. **This version still needs substantial choreography and animation repair before release.** More particles, faster playback, or additional camera shake will not resolve the underlying problems.

The biggest issue is that too many shots present an action rather than an exchange. A character performs a hit; another character waits; the robot bends or falls; the shot resets. The audience needs attacks that force defenses, teammates whose actions enable one another, enemies that respond, and damage that changes the next decision.

“More realistic” should mean convincing weight, timing, contact, reactions, and continuity within the established Weird Crew illustration style. It does not require replacing the cast with photorealistic people.

### Review scope and evidence

This audit uses regular frame samples covering the complete film, quarter-second sequences around selected problem actions, full-resolution spot checks, encoded-file metadata, and a whole-mix loudness measurement. It is not a claim that every one of the film's 7,740 frames has passed inspection. The source project and separate audio stems were not available in this review. Opening-groan balance and the audible song splice are user-reported listening findings; the radio-button action and software credits are visually confirmed. Exact technical causes of rendering defects must be checked in the source.

The earlier production prompt was also inspected. It explicitly requested shortening the radio song's instrumental introduction and jumping to the vocal. That is a plausible reason for the disliked split. **The latest instruction supersedes that request: begin the recording at its opening and play continuously.**

The mixed AAC audio measures approximately **−16.1 LUFS integrated, −1.9 dBTP true peak, and 12.7 LU loudness range** using FFmpeg's loudnorm analysis. Those figures do not establish the balance of individual sounds. They indicate that simply making the whole soundtrack louder is not the appropriate fix for an overpowering groan.

## Timestamped findings

| R2 time | Finding | Final-pass direction |
|---|---|---|
| 0:00–0:07 | The city establishes scale, but similar facade grids, rounded smoke clusters, and small repeated flame silhouettes make destruction feel schematic. | Add a few readable, distinct damage events, irregular fire anchored to actual fuel sources, and coherent lighting. Keep the first view immediately understandable. |
| 0:10–0:17 | The rise from rubble is the correct story beat. Supporting hands, feet, and weight transfer need close scrutiny. The user reports that the groans dominate the music. | Give the rise planted contacts and effort through the torso and legs. Rebalance only the intrusive sounds; retain the score's opening shape. |
| 0:18–0:35 | Multiple army and lone-hero views establish essentially the same threat. The wide views around 0:30–0:35 are particularly similar. | Give each held shot new information: movement closes distance, the Director recognizes a threat, or an ally's arrival changes his attention. Preserve anticipation without waiting for the score. |
| 0:38–0:49 | The climb exposes the weaknesses of the rotating character assets. Duplicate red hair spikes are clear around 0:42–0:45, including the full-resolution 0:44.15 frame. | Repair the character representation across angles. One coherent hair silhouette, anatomically consistent limbs, planted feet, and correctly attached props. |
| 0:50–1:02 | The shoulder contact and team assembly provide useful emotion. The repeated lineup views around 0:54–0:59 lose urgency. | Keep the reassuring touch; animate recognition and preparation. Move from assembly into a committed charge without a prolonged group pose. |
| 1:08–1:17 | Early fights often isolate one performer while nearby opponents remain available but passive. Prop direction, hand contact, and recoil deserve another pass. | Introduce simultaneous but clearly ranked exchanges. Show the enemy initiating attacks and teammates covering each other. |
| 1:18.5–1:21.75 | A robot threatens the Director, his guard reacts, and the green-shirt teammate enters. This is already a useful foundation for teamwork, but it contains waiting and weak continuation. | Make the block force a stumble, the rescue arrive before the second strike, and the robot's reaction carry into the next shot. |
| 1:28–1:46 | Regrouping, the tablet, and luminous decoys create a potentially distinct tactical beat. The projection effects dominate some compositions and may read as magic rather than a practical trick. | Establish the projector, show what the robots mistake for targets, and immediately use that distraction. Keep the enemy applying pressure while the plan happens. |
| 1:44.25–1:45 | The close fight exposes duplicated hair and crowded weapon/face/arm silhouettes. The image needs to be readable before sparks are added. | Repair this as a representative difficult shot, then apply the same rig/pose fix throughout the film. |
| 1:50–2:07 | Several machines fall and the large walker arrives. Some individual moments work, but gains do not always visibly change the battlefield. | Carry fallen robots, dropped items, and new cover forward. The heavy unit's arrival should undo a specific advantage the Crew just earned. |
| 2:08–2:26 | Drone views, overhead views, and walker action offer variety. The walker section around 2:22–2:25 spends substantial time on a single stepping motion. | Establish the danger, then cut between the threatened person, the moving machine, and a consequential defense. Make this escalation, not another isolated demonstration. |
| 2:28–2:52 | The Crew is pushed back and the robots surround them. This is the right dramatic direction. Wide shots still need purposeful activity across the visible fighters. | Track a shrinking defensible area. Show counterattacks defeating the Crew's earlier tactics and closing their routes. |
| 2:54–3:00 | The Director shields the vulnerable teammate near the van; a contact effect precedes his collapse. The fatal consequence is less clear than it needs to be. | Stage one unmistakable protective choice, a forceful impact with displacement, and a visible loss of strength. Do not add gore to compensate for weak causality. |
| 3:02–3:12 | Surrender and the companion approaching the Director are valuable emotional beats. | Give each survivor a distinct physical response and make the robots deliberately secure the area. Avoid simultaneous pose changes across the whole cast. |
| 3:14–3:18 | The final eye close gives the film a personal ending. | Keep it restrained. Refine eye focus, breath, head support, and the hand losing tension. Preserve the quiet after the battle. |
| 3:19–3:21 | A companion visibly reaches over and operates the radio. | Delete the reach and button press. Pan to the unattended radio, use a brief static/power flicker, and start the song from its beginning. |
| 3:24–3:49 | The widening view carries the intended contrast between personal loss and citywide defeat. It also exposes the repeated city assets and dense crowd/building layering. | Preserve the reveal but verify actual depth, clear camera paths, crowd spacing, and occlusion. Add meaningful changing information as the camera rises. |
| 3:51–4:18 | A lengthy scrolling explanation and credits follow. The closing credit includes “Sound effects generated with ElevenLabs · Animated with Remotion.” | Remove production-tool credits. Prefer a short final card reading **A FUTURE GOT WEIRD FILM**. Do not allow the credit sequence to outlast the emotional ending. |

## What to take from Endgame

The useful lesson is organized action. Wētā's supervisors describe mapping positions and orientations, creating small group fight vignettes, and using clear poses and silhouettes so fast edits remain readable. They specifically discuss background action that tells a story rather than generic pairs endlessly trading blows. These first-person production accounts support the approach below. This audit does not claim a fresh shot-by-shot playback of the feature film.

For this film, translate those principles into original exchanges for the Weird Crew: an incoming attack establishes danger; one person's defense creates another person's opening; the robots learn; the team's workable strategy fails. Background activity should support the main action and the changing outcome.

---

# READY-TO-USE CLAUDE PROMPT

## Task: finish R3 as a coherent, polished battle film

Work from `FGW_TheLastChoice_R2_REVIEW_1080p.mp4` and its actual source project. Implement the changes, render the result, inspect it, and correct defects before delivery. This is a substantial final choreography and animation pass, not an instruction to add effects over the current render.

Preserve the established Weird Crew identities, illustration style, burning New York setting, opening title, rubble emergence, team assembly, last stand, defeat, surrender, the Director's death with his companion beside him, radio-song ending, and final city reveal. The story direction is approved. The animation and action execution need improvement.

The latest requests override conflicting earlier instructions, particularly the radio interaction, the edit into the song's vocal, and the production credits.

## 1. Fix the character system before generating more final footage

Inspect how people and props are constructed. The visible duplicate hair, flattened side views, and crowded facial overlaps are consistent with problems in angle-dependent assets, layer visibility, or attachments; confirm the actual cause rather than assuming a particular implementation.

- Give every visible cast member reliable front, front-three-quarter, profile, rear-three-quarter, and back representations. Use proper intermediate poses when a turn is visible. Do not rotate a front drawing into a paper-thin profile.
- At every angle, the red-haired character has **one coherent set of spikes**. Inspect the climb around R2 0:42–0:45 and the fight around 1:44. These are proof shots, not the only occurrences to fix.
- Audit all microphones and face-adjacent props, including both any handheld mic and the Director's headset boom. Attach a handheld prop to the hand, and a headset to the head. Maintain a believable offset from the face. A normal projected overlap in front of a face must have consistent occlusion; nothing should visibly penetrate a cheek, flip through the skull, or emerge from the wrong side during a turn.
- Hands must keep their grips. Weapons keep the same length and orientation relative to their handles. Two-handed objects require compatible positions for both hands.
- Check ear, eye, mouth, nose, hair, glasses, hat, headset, collar, shoulder, and sleeve visibility together. Do not solve one duplicated feature while leaving a second face or incorrect limb order.
- Fix detached-looking limbs, exposed joint circles, elbows folding incorrectly, sliding feet, and hands passing through bodies. Avoid doubling a limb while transitioning between pose assets.
- Ground feet on the visible slope. Climbing requires a planted foot, weight transfer, and a new step. Do not translate the entire character uphill over a looping walk.
- Use eye direction and brows to show concentration, fear, recognition, pain, and grief. The same wide-eyed neutral face should not persist through every type of action.

Before the full render, make a compact diagnostic strip of the difficult cast members turning, crouching, running, striking, receiving a hit, gripping props, and holding a guard. Inspect both isolated silhouettes and the actual production lighting. Correct the shared asset/rig rather than patching one camera angle.

## 2. Re-choreograph the battle into connected exchanges

Keep roughly the existing substantial battle duration if the music supports it. Increase meaningful action within that duration. Do not just multiply the playback rate or shorten every shot equally. Do not lengthen the film to accommodate new gestures.

Every visible combatant in an active battle shot needs a credible current task: attacking, blocking, evading, pursuing, protecting an ally, recovering from a hit, repositioning, targeting, or supporting an attack. Nobody within immediate striking range should wait inertly while another person takes a turn. Exceptions such as a disabled robot, a pinned person, or a surrendered survivor must be visibly explained.

Activity does not mean every figure must punch on the same frame. Stagger actions and give the camera one main event, one secondary exchange, and less distracting distant activity. Nearby opponents remain dangerous even when they are not the focus. Keep incidental motion out of the sightline needed to understand the main hit.

Use this dramatic progression:

1. **Contact:** robots advance and attack. The Crew has to defend immediately. The first success costs effort.
2. **Teamwork:** a block, distraction, or rescue creates an opening for another character. The audience understands why the group works together.
3. **Temporary advantage:** the existing decoy/projector tactic diverts a particular robot group and helps the Crew reclaim a small area. Establish the device that causes the effect; keep it visually technological.
4. **Adaptation:** the robots stop following the same decoy, cut off an escape lane, or use a different attack. Show this behavior before showing the defeat it causes.
5. **Escalation:** the heavy walker and drones break cover or neutralize an established tactic. Small victories no longer hold ground.
6. **Encirclement:** the defensible area visibly shrinks. Fatigue, damaged equipment, and reduced numbers constrain the Crew's choices.
7. **Final choice:** the Director sees the companion in immediate danger, chooses to protect them, takes the decisive injury, and cannot continue. The survivors' surrender follows the actual loss of options.

### Representative exchange to build, not merely describe

Rework the Director/green-shirt rescue around R2 1:18–1:22 into approximately 7–9 seconds of connected action, adjusted to the score:

| Beat | Main action | Simultaneous action and camera purpose |
|---|---|---|
| Threat | A robot closes in and drives an attack toward the Director. | A second robot pressures a teammate. A medium three-quarter angle establishes both threats and their distance. |
| Defense | The Director plants his foot, blocks, and is forced backward. | The attacker follows the displacement rather than resetting to idle. Cut closer only if the contact remains visible. |
| Intervention | Green-shirt moves in from an established position and interrupts the robot's next strike. | The Director ducks or redirects to give the weapon room. Hands and bodies never occupy the same space. |
| Counter | The robot braces, catches the strike, or tries to turn toward the rescuer. | The Director reacts to the opening and helps unbalance it. Show an intelligent opponent, not a target dummy. |
| Consequence | A coordinated action knocks the machine into rubble or the path of its ally. | The nearby second fight changes because of that collision. Carry its position and damage into the next shot. |
| Continuation | A fresh threat forces the pair to move. | Cut on their movement into the next exchange. There is no ceremonial pause after winning. |

Build several distinct exchanges on this principle. Do not repeat this exact choreography with different clothes. Give each crew member a readable role based on their existing props and abilities; do not invent unexplained superpowers to make the fight faster.

For each major exchange, record: starting positions, intended target, initiating attack, defense, counter, consequence, and ending positions. The next exchange begins from those consequences. Enemies can hit, evade, block, press an advantage, and retreat to regroup. Both sides make decisions.

## 3. Give motion force and weight

A strike needs preparation, acceleration, contact, follow-through, and recovery. The recipient needs a response in the direction of force. A spark does not establish a successful hit by itself.

As a starting point at 30 fps, some fast actions may use roughly 4–8 frames of preparation, 2–5 frames of fast travel, a very brief contact accent, and 8–16 frames of recoil/recovery. These are animation starting ranges, not mandatory timing for every action. Heavy machines, exhausted people, and glancing blows need different timing.

- Drive force through hips and shoulders; do not rotate only a forearm while the rest of the body remains rigid.
- Keep a support foot planted when the action requires it. Show the weight transfer when it leaves the ground.
- A robot blocks with a limb in the actual incoming path. A dodge moves its body clear before the weapon passes.
- A hit does not make a robot instantaneously dissolve into floating parts. Establish failure at a joint or a loss of balance, then let the fall and debris follow gravity.
- Make heavy feet compress the body slightly, disturb nearby dust, and settle under load. Give walker legs independent support phases so the machine has visible weight.
- Use brief, directional impact effects and camera impulses where useful. Do not obscure hand/weapon contact with a large white flash.
- Avoid constant full-speed motion in the death scene. There, the performance should become smaller and harder, then still.

## 4. Cut faster where the fight benefits, while protecting geography

Make a rough action edit before polishing every shot. Use the music's phrases and major accents to organize the first clash, coordinated success, heavy-machine entrance, reversal, final defense, and collapse. Mark the actual supplied track; do not invent beat timestamps or change its pitch/tempo to fit a weak edit.

During peak combat, a useful starting palette is roughly 0.7–1.5-second inserts, 1.5–3-second exchanges, and occasional 3–5-second tracking or wider shots that establish the situation. These are creative ranges, not a quota. A readable longer exchange is better than three confusing cuts. Let the finale breathe.

Use more purposeful angles: a low view of the first charge, a three-quarter view that shows a block and counter, an over-shoulder view toward the next threat, a side track following a paired attack, a brief overhead view establishing the closing ring, and intimate views for the final loss. Reduce the near-constant tilted-camera feeling; reserve strong tilt for destabilizing moments.

Cut because an event changes, not because a timer says to zoom. Match movement and gaze across shots. Maintain a coherent screen direction until a wider shot or continuous camera movement establishes a new axis. Do not teleport an ally, switch the attacker's side, or change a weapon hand merely to get another angle.

Do not synchronize every hit, background fighter, camera shake, and edit to the same beat. Use large musical accents for important changes, and smaller subdivisions for attack chains. Sound effects should reinforce precise contacts, not fill every available gap.

In the opening, keep the city, title, rise, overwhelming army, and arrivals, but remove redundant waiting. If the score needs time, fill that time with developing events and character decisions. Do not silently delete a large section of the main cue to solve a visual pacing problem.

## 5. Repair the city's spatial logic before adding detail

Create or verify one persistent battlefield layout with the rubble mound, street, fallen green structure, van/radio, important fire sources, and access routes. Preserve their relationships across the edit.

Inspect the rendering system for depth-order mistakes, intersecting meshes/cards, inappropriate transparency, duplicate geometry, and camera paths crossing solids. These are diagnostic possibilities, not confirmed source-code causes. Do not globally disable depth testing or depth writing to hide one overlap; that can create new problems elsewhere.

- Opaque buildings and rubble must occlude robots behind them consistently. A transparent smoke layer must not make an opaque facade transparent.
- Check robot-to-robot spacing, large walker leg clearance, limbs near the fallen structure, and the final rising camera passing the buildings.
- Make routes navigable in world space. Robots should walk around obstructions or visibly climb over them, not through them.
- Persist fallen machines, broken props, and newly damaged cover. Do not respawn an intact set when changing camera shots.
- Place characters and effects from consistent world positions. Camera changes should not alter the apparent scale of the same building or machine arbitrarily.

Then add selective city detail: damaged storefronts, exposed floors, broken facade edges, twisted steel, a few abandoned vehicles, irregular window damage, utility debris, signage silhouettes, hanging cables, and deeper street views. Favor distinct clusters over uniform noise. Keep the main action readable against the background.

The skyline and last pullback should reveal different scales of loss: our crew, nearby surrendered groups, machines taking intersections, and fire spreading through the wider city. Establish any additional survivor groups clearly enough that they do not resemble duplicated cast members.

## 6. Improve the fire and atmosphere

Replace identical triangular flames and repeated round smoke stacks with layered, irregular, evolving shapes appropriate to the illustration style. Increase visible burning in selected locations so the city genuinely feels engulfed, without flooding every surface with the same effect.

Fire needs a cause and a place: a damaged vehicle, exposed room, debris pile, or ruptured opening. Animate irregular tongues, breakup at the tips, a brighter core, warmer outer edges, embers, and subtle nearby light changes. Vary each source's timing and scale; do not replay one synchronized loop across the skyline.

Smoke should grow from those sources, rise, drift in a consistent general wind, and vary in density. Maintain enough contrast around faces, limbs, and silhouettes. Avoid large translucent circular overlays washing over the entire frame. Use foreground ash sparingly, concentrated around impacts and exposed fires.

## 7. Make defeat and surrender emotionally credible

The Director's last protective action must be understandable without a caption. Establish the companion's danger, show him move to protect them, show the decisive impact and its force, and carry his impaired movement into the collapse beside the van. Preserve the non-graphic tone. More blood is not the solution.

Let survivors surrender in response to specific facts: no clear route, damaged equipment, a surrounded teammate, a failed last attack, or the Director going down. Stagger reactions: a glance to an ally, a shaking grip, a weapon lowered or dropped, knees giving way, hands raised. Avoid an identical simultaneous animation across all survivors.

Keep the robots active in a controlled way: step into blocking positions, scan, redirect attention, secure the perimeter, and hold the survivors. A formation deliberately enforcing surrender is different from a formation doing nothing during a fight. Do not continue attacks that contradict the established surrender scene.

Preserve the companion reaching the Director and the hand contact. Check every finger/hand/forearm overlap. Let their body weight and posture show exhaustion and grief. Keep the Director's final eye close, reduce remaining movement naturally, and allow a brief quiet beat before the radio draws attention.

## 8. Replace the radio action and remove the musical jump

Delete the reach, button press, and knob operation around R2 3:19–3:21. Nobody activates the radio.

Establish that the radio is already present in the van, ideally with a faint indicator or an earlier glimpse that does not distract. After the Director's final stillness, let the camera pan from the pair to the unattended radio. A small indicator flutter and brief static crackle suggest an interrupted reception recovering. If using a visible electrical flicker, keep it localized and subtle, not a lightning effect floating around the speaker.

Then start **“It's Been a Long, Long Time” from the beginning of its usable musical recording**, excluding only non-musical capture lead-in. Continue through the recording in chronological order. No jump to the first vocal, no repeated intro, no skipped middle phrase, no forced lyric entry. The earlier instruction to splice toward the vocal is canceled. If the new film ends before the vocal begins, that is acceptable.

Keep the intimate radio-speaker character at first. As the camera leaves the van and reveals the city, gradually widen into the soundtrack using one continuous musical timeline. If using two processed copies for the sound transition, keep them sample-aligned; filter or blend them without creating a second musical entry, phase problem, or gap.

The final city reveal needs quiet, purposeful activity. Let the warm song contrast with the machines' continuing control. Do not interrupt this with a new action montage, a huge explosion foregrounded in the mix, or explanatory graphics. End the selected song excerpt at a sensible musical point with a controlled tail; do not preserve 4:18 as a mandatory runtime.

## 9. Rebalance the opening and rebuild fight sound around the action

Listen to the actual separate tracks. Reduce the intrusive groans at their source. A roughly 6 dB reduction is a reasonable first audition for the reported loud events, not a prescribed final value. Adjust by ear in context. Remove redundant groans, soften harsh transients where needed, and position the remaining effort sounds with the character rather than above the whole soundtrack.

Keep the music as the emotional lead. Avoid heavy automatic ducking every time a person strains or a foot lands. The measured R2 master level does not justify globally boosting or flattening everything.

Tie fight sound to visible mechanics: a preparatory movement, contact, body/metal response, and debris settlement. Distinguish a light parry, heavy block, hard impact, mechanical failure, and walker step. Use distance and stereo position to make simultaneous background combat legible without equal loudness everywhere.

Audition at normal volume on headphones and a small speaker, then check mono compatibility and the quiet ending. Check true peak after the final encoding. Preserve dynamic contrast, but make sure no isolated groan or static burst unexpectedly dominates the music.

## 10. Use Runway selectively if it demonstrably improves a shot

Runway is an optional production tool for this pass, not a requirement to regenerate the whole film. First repair deterministic character geometry, pose changes, physical contact, and geography in the source.

Good trial candidates are the opening city, a short background destruction insert, and the final city reveal. Export a clean short plate with the intended camera motion. Test roughly 3–6 seconds for one shot before processing additional material. Supply an approved frame or style reference. Evaluate the result in sequence, not only its best still frame.

Runway's current Edit Studio/Aleph workflow supports targeted edits guided by a chosen frame and optional motion guidance. Follow the actual available interface or API and its limits. Do not assume that a character repair or whole-cast combat pass will remain consistent simply because the prompt asks for consistency.

Suggested environment-only direction:

> Add irregular animated fire inside the existing damaged rooms and vehicle wrecks, drifting smoke, scattered embers, and subtle firelight on adjacent surfaces. Preserve the illustrated style, building silhouettes, street layout, camera movement, and the position of every foreground object. The motion is localized to fire, smoke, embers, and their light.

Composite a usable environment pass behind the source characters where practical. Check every returned frame for warped facades, changing windows, duplicate people, floating debris, flicker, and altered camera movement. Reject a generated pass that introduces new continuity problems. Keep the original edited music and effects; do not bring in unrelated generated audio.

If testing a character shot at all, use a short, isolated action with approved reference poses and simple contact. Do not replace the death performance or a crowded multi-person fight with an uncontrolled generation. If Runway is unavailable, complete the source-based fixes and report that accurately rather than implying it was used.

## 11. Replace the closing production credits

Remove all on-screen production-tool wording, including the current ElevenLabs and Remotion line and any later-added AI/model/software credits. The desired final production card is exactly:

**A FUTURE GOT WEIRD FILM**

A clean, restrained 4–6-second final card is preferable to the current extended scroll. Keep the film's opening title. The long scenario explanation can be moved to the accompanying description if retained; it does not need to interrupt the emotional ending. Keep any music attribution needed for the release in the appropriate accompanying material. Do not add another tool credit or a generic generated-content caption to replace the removed line.

## 12. Complete a real final review before delivery

Work in this order: repair character/prop assets; establish battlefield geography; reblock the exchanges; cut the action to the score; refine animation and contacts; repair environment occlusion; polish fire and sound; refine the surrender/death; replace radio/credits; render and inspect.

Watch the complete new render at normal speed. Review difficult shots at half speed and frame by frame around turns, contacts, and cuts. Start with the known R2 examples, then inspect every use of the affected assets. A montage of good still frames is not enough to verify animation.

Release gates:

- No visible doubled hair, facial layers, limb duplicates, or props penetrating faces.
- No floating grips, unexplained object swaps, foot sliding on contact, or robots/buildings visibly passing through one another.
- Every visible active combatant has a believable task during battle; no unexplained waiting inside striking range.
- Exchanges have attack, response, and consequence; the robots initiate and adapt.
- Fast cuts remain readable, and spatial relationships survive camera changes.
- Wounds, broken equipment, fallen robots, and cover damage persist.
- The final protective action clearly causes the Director's collapse; surrender is motivated and individually performed.
- Nobody touches the radio; the song starts at its opening and remains continuous.
- Opening exertion sounds support the score; contact effects align to the actual action.
- Fire and smoke stay attached to their sources and do not obscure essential acting.
- The final production card reads **A FUTURE GOT WEIRD FILM**, with no AI/tool production credit.
- Check the actual final file's resolution, frame rate, duration, audio sync, and last frame rather than relying on its filename.

Deliver the corrected **1080p review** and, once that exact edit passes inspection, a **3840 × 2160 master** rendered from the corrected source where possible. Do not label a simple upscale as a native 4K animation render. Include a short change log with new timestamps and any remaining concrete defects. Do not call the film YouTube-ready while known visible defects remain.

The goal is a readable, urgent, emotionally coherent final stand: the Crew fights as a group, the robots fight back and learn, the battle costs something, surrender makes sense, and the quiet ending earns its contrast.

---

## Reference notes

These informed the production approach; they are not a claim that an external film clip was repeatedly watched or that Runway was used in this audit.

- [First-person Endgame interview with Wētā's VFX, animation, and FX supervisors](https://www.artofvfx.com/avengers-endgame-matt-aitken-vfx-supervisor-sidney-kombo-kintombo-animation-supervisor-gerardo-aguilera-fx-supervisor-weta-digital/) — battlefield maps, action continuity, group fight vignettes, posing, silhouettes, and framing.
- [Wētā: how the Endgame battle shots came together](https://www.wetafx.co.nz/articles/how-endgames-battle-against-thanos-went-from-greenscreen-stages-to-those-final-epic-shots) — planning and integrating characters with digital environments.
- [Runway: Creating with Edit Studio](https://help.runwayml.com/hc/en-us/articles/51683104370451-Creating-with-Edit-Studio) — targeted edits guided by a frame and optional motion guidance.
- [Runway: Aleph 2.0 Prompting Guide](https://help.runwayml.com/hc/en-us/articles/52150503729171-Aleph-2-0-Prompting-Guide) — precise, targeted transformation prompts.

The timing ranges, choreography examples, edit proposals, and release gates in this document are recommendations for this film, not claims about Endgame's exact shot timings or guaranteed behavior from a generation model.

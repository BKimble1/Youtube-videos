# The Last Choice — final animation and continuity pass

Paste this prompt into the existing Sonnet 5.5 High project with the R3 review video attached and the project source available.

---

Work directly on the existing film and complete the final polish pass. The reference is `FGW_TheLastChoice_R3_REVIEW_1080p.mp4`, approximately 3:57.8 at 30 fps. The film is close. Preserve its story, characters, visual identity, dialogue, music, successful sound effects, and emotional ending. The work now is to fix animation defects throughout the entire film and make the action more physically convincing and understandable.

Priority order:

1. Eliminate disappearing/reappearing body parts, broken silhouettes, geometry intersections, unsupported objects, and continuity errors.
2. Make every important action readable: who acts, what they contact, how the target reacts, and where everyone ends up.
3. Add purposeful character movement and reciprocal combat within the existing runtime.
4. Refine secondary motion and camera work only where they improve the above.

Implement and render the changes. Do not stop at an audit, recommendations, or code that has not been visually checked. Fix shared causes where possible instead of patching one camera angle while leaving the same defect elsewhere. Use the actual source to establish causes; the visible symptoms below do not establish which rendering or rigging system is responsible.

## 1. Highest-priority defect: body parts must persist

An arm, leg, hand, robot component, or prop cannot simply vanish when a character changes pose, turns, crouches, or passes near scenery. It should remain present unless a real surface occludes it or it leaves the frame. Correct occlusion is essential; do not force every limb to render on top of everything.

There is a particularly clear example at approximately **2:59–3:03**: the injured yellow-shirt character sits against a slab, but his legs change from visible bent legs to an apparently legless torso and then reappear. Inspect approximately 2:59.4–3:00.7 particularly closely, including every intervening frame. The seated pose must settle continuously with two connected legs, knees, ankles, and feet. Neither leg should sink into the slab or disappear when its angle changes. Keep that corrected anatomy consistent in subsequent wide shots and the final embrace.

Audit every character and robot, including background figures. Follow each limb through its entire motion, not just its start and end poses. Check the following possible causes only as applicable to the real implementation:

- Incorrect parent transforms, pivot placement, world/local coordinate conversions, or pose blending.
- Angular visibility switches, front/back sprite swaps, zero or negative scales, and unintended opacity changes.
- Thin or one-sided geometry, backface culling, depth conflicts, transparent sorting, clipping, and camera near planes.
- Layer ordering or masks that remove a whole limb when only part should be behind another surface.
- Culling bounds that fail to contain animated parts; distance-based detail changes that remove required anatomy.
- Discontinuities at animation boundaries, modulo loop resets, shot-local frame resets, or object remounting.

Do not apply blanket fixes such as disabling all depth testing, making every surface double-sided, or drawing all characters above scenery. Diagnose and correct the relevant cause. Preserve proper depth and contact.

Keep shoulders attached to upper arms, elbows to forearms, wrists to hands, hips to thighs, and knees to shins. Robot joints must remain connected through their intended articulation. If a component intentionally breaks off, show the break and track its trajectory and resting place. A damaged robot must not silently regenerate parts on the next cut.

## 2. Shot-specific review and corrections

These time ranges are approximate navigation points in R3. They identify visible staging concerns and inspection priorities, not an exhaustive defect list. Review the complete film and refine the exact frame ranges yourself.

| R3 time | Focus | Required correction |
|---|---|---|
| 0:00–0:06 | Burning-city opening | Keep buildings, fire sources, smoke, and debris spatially consistent during camera travel. Smoke can evolve; solid scenery must not pop or intersect unpredictably. Preserve the opening and title structure. |
| 0:10–0:16 | Hand beneath rubble; yellow-shirt character climbing out | Make the hand plant and bear weight before the body lifts. The crawl currently has extended, nearly horizontal body poses that need clearer support. Sequence palm contact, elbow extension, knee placement, planted foot, and standing. Give the overhead slab believable supports and keep the body clear of its surface. |
| 0:38–0:50 | Crew navigating broken ground; red-haired character vaulting rubble | Preserve feet and lower legs as characters cross terrain edges. Distinguish stepping behind a foreground surface from sinking through it. The vault needs a readable plant, clearance, landing, knee compression, and recovery. Each character should follow a viable route over the ground. |
| 0:51–1:03 | Reunion, preparation, and charge | Keep hands on shoulders and tools in grips without sliding or clipping. Add purposeful glances, grip adjustments, preparation, and staggered starts. Maintain a clear direction toward the robots. |
| 1:08–1:16 | First close-range exchanges | Separate the yellow-shirt character, green-shirt character, and robot silhouettes enough to read their limbs and weapons. Show actual contact and a corresponding robot response. Remove skating, pose snapping, and empty pauses while an opponent is within reach. |
| 1:24–1:30 | Robot takedowns; yellow-shirt character fighting at close range | At roughly 1:26–1:28, the robot and human overlap heavily. Make the strike/block and collapse legible. Preserve the robot's connected body until any intentional break, show the source of its momentum, and let the fallen body settle on the road. |
| 1:36–1:47 | Tablet, projected figures, and renewed fighting | Clarify the existing tactic through eye lines and reactions: establish the projection source, show what the robots perceive, then show how the crew uses the distraction. Preserve the script's intended explanation. Avoid introducing a new ability or using projection effects to hide geometry defects. |
| 1:50–2:08 | Fighting around the fallen truss and orange beams | Check limb/truss intersections, robot falls, ground contact, and safe character routes around beams. Attacks must not pass through structural members or nearby characters. Keep fallen robots persistent and grounded across cuts. |
| 2:09–2:17 | Drone and wide battlefield views | Keep flight paths, the drone's purpose, and character locations consistent across the overhead and ground views. Use movement and reactions to connect these views to the current action. |
| 2:25–2:32 | Explosion, pressure gauge insert, handheld slab, and retreat | Preserve the intended cause and consequence. Establish whose device the gauge belongs to through the existing scene context. Around 2:27.9–2:28.4, a large flat slab is in front of the yellow-shirt character's face: if it is a shield, show a stable supporting grip, weight, and a clear silhouette; if it is unintended foreground geometry, correct its placement. Check its continuity before and after the cut. |
| 2:32–2:50 | Renewed fights and large-robot pressure | Replace repeated approach/strike/reset behavior with connected exchanges and varied defensive reactions. Show how attacks force the crew to reposition. Maintain the robot scale and the relationship between opponents and cover. |
| 2:53–2:59 | Giant robot attack beside the van | Make the huge limb's approach, the threatened space, the crew's response, and the resulting injury understandable. Avoid unexplained overlaps among the giant, van, slabs, and people. Use a clear contact or near-contact view, then preserve the resulting positions and damage. |
| 2:59–3:13 | Injured seated character and attempted help | Fix the visibly disappearing legs first. Settle the pelvis against the slab and feet on the ground. Keep the injury location consistent, the helper's hands attached, and the contact between hands and patient believable. Avoid limbs passing through clothing or the slab. |
| 3:14–3:28 | Face close-up, radio, and embrace | Preserve the quieter pace. Refine head weight, hand pressure, facial movement, and body support. Keep hair, headset, face, and neck aligned through the camera move. Ground the radio on the van's interior surface. |
| 3:29–3:51 | Encirclement and final city pullback | Check giant-robot clearance around the van, feet on rubble, robot spacing, and background object persistence throughout the pullback. Nearby robots should respond consistently to the story beat. Avoid mechanical crowd synchronization and distance-related popping. |

The user also reports a floating rock. Locate it in the complete review; do not assume the slab near 2:28 is necessarily the same object. Audit all substantial rubble. Every rock needs visible support, a believable fall/throw, or an explicitly established force keeping it aloft. Atmospheric dust and embers are different from solid chunks of masonry.

## 3. More movement through meaningful action

Increase activity in the battle without increasing runtime or applying a global speed-up. Use the existing shot durations more effectively.

For each principal exchange, animate a continuous chain: **recognize the threat → anticipate → move/attack → contact or evade → recoil → recover/reposition**. The next movement should grow from the previous one rather than snapping back to a default stance.

- A robot under attack should block, reach, counter, stagger, lose balance, or retreat according to the existing outcome. It should not remain an inert target.
- A character who has just struck should follow through, transfer weight, recover their grip, and respond to the opponent.
- Use torso rotation, shoulder movement, hip movement, bent knees, and footwork. Avoid arms swinging independently from rigid upright bodies.
- Plant feet during the support phase. Match travel to stride length. Add push-off, clearance, landing compression, and recovery where appropriate.
- Let heavy robots carry momentum, brace before a major strike, and take time to stop or regain balance. Preserve their threatening weight without making every movement slow.
- Add brief, practical actions where the scene already supports them: a sidestep around rubble, a duck under a swing, a block followed by a counter, a teammate covering a retreat, or a wounded character stumbling into support.
- Give visible background combatants staggered tasks and reactions. Maintain one clear primary action per shot with quieter secondary action. Do not turn the entire screen into equal-intensity motion.
- Keep expressions and gaze tied to the nearest relevant threat, ally, wound, or device. Avoid a character staring past an attack they should be reacting to.

Preserve the existing cartoon/vector identity. “More realistic” means better weight, anatomy, timing, contact, and cause-and-effect within this style. Do not redesign the cast or introduce photorealistic assets.

## 4. Props, environment, and physical continuity

Hands must grip tools at stable attachment points. Props cannot slide through fingers, switch hands without an action, or pass through faces. Check side and three-quarter views particularly carefully, including hair silhouettes, headset microphones, and the red-haired character's profile. Avoid duplicated outlines or features during turns.

Give debris a defined origin, trajectory, collision, and resting state. Large pieces cannot hover, reverse direction without a force, fall through the street, or disappear in full view. Dust should originate at movement or impacts and disperse; it must not conceal unfinished contacts. Keep smoke and fire subordinate to silhouettes at important action moments.

Maintain a simple continuity record for positions, held props, wounds, disabled robots, debris, and damage across cuts. Preserve the crew's direction of travel and the established positions of the truss, orange beams, cover, and van. Do not relocate obstacles merely to accommodate a camera angle.

## 5. Camera and audio

Preserve the successful music and sound-effect palette. Prefer fitting improved motion to existing impact cues. If a contact frame must change, move only its associated cue as needed and verify synchronization. Do not replace the soundtrack or add louder effects to compensate for unclear animation.

Adjust cameras where an essential contact is obscured, a limb becomes unreadable, or a large foreground object blocks the action. Favor a modest angle or staging correction. Cut on an established movement and preserve direction, momentum, and pose across the cut. Do not hide unresolved defects with rapid cuts, flashes, smoke, extreme shake, or motion blur.

Keep the intimate ending restrained. Breathing, tremor, gaze, a hand squeeze, and a gradual head settle are appropriate where the story calls for them. Respect the final loss of movement. Preserve the ending credit **“A FUTURE GOT WEIRD FILM.”**

## 6. Render, inspect, correct, then deliver

1. Inspect the current source and create a private timestamped defect list. Separate observed visual failures from suspected causes.
2. Repair shared rig, rendering, terrain-contact, and state-continuity problems first. Check other shots that use each changed component.
3. Refine choreography and secondary movement after bodies and objects remain stable.
4. Render the complete revised film and inspect it at normal speed for readability and pacing. Review problematic sequences at reduced speed and step through every frame around turns, contact, occlusion changes, falls, and pose transitions. Widely spaced stills alone cannot certify that popping is gone.
5. At the project's 30 fps, inspect consecutive frames on both sides of every identified discontinuity. Compare pre-contact, contact, and post-contact frames for every principal impact. Check cuts for object and damage persistence.
6. Re-render corrected sections, then verify the final full export. Confirm that audio contact cues still align and the quieter ending retains its intended timing.

Acceptance criteria: no observed unexplained limb/component disappearance; connected anatomy throughout turns and seated poses; supported or physically moving rubble; planted feet and believable landings; stable hand/prop contact; readable reciprocal combat; persistent injuries and fallen robots; coherent scene geography; and no regressions in the existing audio or ending.

Export a complete R4 review and the final master at the project's intended delivery settings, retaining 30 fps unless the project explicitly requires otherwise. Include a short list of the significant fixes with timestamps. Report any unresolved defect or verification limitation honestly rather than declaring the film glitch-free without checking. The goal is a finished, coherent film whose motion holds up during playback and frame-by-frame inspection.

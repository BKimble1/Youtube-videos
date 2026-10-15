# Death Clock V4: director's design decisions

V4 is a focused polish of V3. The brief is at `/root/.claude/uploads/c03ff30c-9e0d-5815-8215-caba303aa636/65bdbd80-FGW_DeathClock_V4_Final_Polish_Claude_Prompt.md`.

The read-only mapping reports for every defect area hold the numbers, line references and probe scripts these decisions build on. They are in `/tmp/claude-0/-home-user-Youtube-videos/c03ff30c-9e0d-5815-8215-caba303aa636/scratchpad/v4u/reports/` (`leash.md`, `anatomy.md`, `anatomy_reference.md`, `device_treatment.md`, `dispatch.md`, `loop_continuity.md`, `sound.md`, `survey_a.md`, `survey_b.md`), and the probe scripts sit in the sibling folders. Read your area's report before changing code.

## Locks (all areas)

- **Length:** exactly 1350 frames at 30 fps. No added time, title card, end card, dissolve, global blur, new decorative particles, labels or interface cards.
- **Narration and captions:** the narration, the caption text, the caption timing and the caption style do not change (`lib/captions.ts`, `shots/Overlay.tsx` Captions).
- **`lib/timeline3.ts` stays as it is.** Do not change any `B` value: the countdown (`lib/device3.ts`) and the reused V3 music stem (via `musicPlan`) read them. New action keys go in `lib/beats4.ts` (`B4`), in your area's section.
- **The countdown keeps its single origin, and every value shown from the injection on stays as in V3.** The one exception: the compressed story-time span must now end before the band is visible again at the trunk wipe. In V3 the digits visibly fast-forward at 898-925; this is owned by the rig/loop area. Run `npx tsx scripts/check_device3.ts`; it must still PASS (the loop area may extend its loop checks).
- **Preserved:**
  - the opening collapse choreography (Opening.tsx COLLAPSE keys, PLANT, FOOT_L/R)
  - the PROP and SIT poses, the planted palm, the character, costume, camera side and proportions
  - the hospital design and the green "Life Expectancy: 42 Years" display
  - the single "?" glitch and the red 00:02:14 callback
- **Art style:** clean rounded gradient vector/2.5D with ink outlines from `lib/ink.tsx` (Inked, OUTLINE_K) and the existing shading helpers. Glows that light tissue or skin use normal blending, are local (radius about a quarter of the wrist radius or less) and stay at alpha 0.35 or below; screen-blend glows never sit over digits. No busy micro-texture that flickers at phone size.
- **Determinism:** everything is a pure function of the global frame `f` (Film.tsx has no Sequence). No `Math.random`.
- **Editing:** use the Edit tool for existing files (never rewrite a whole existing file with Write). Other areas may be editing other parts of the same file at the same time; if an Edit fails because the file changed, re-read and retry. Run `npx tsc --noEmit` in `source/` before you finish.
- **No git commits.** The director commits.

## How to check your work

- **Stills:** `cd source && node scripts/frames.mjs OUTDIR DeathClock f1,f2,... 0.5` (one bundle per call, about 30 s). The machine has 4 CPUs shared with other agents, so batch frames into a few calls and do not render the whole film.
- **Strips and sheets:** tile the PNGs with ffmpeg (`-pattern_type glob -i 'OUTDIR/*.png' -vf tile=...`) and open them with Read.
- **Scratch:** put scratch output in `/tmp/claude-0/-home-user-Youtube-videos/c03ff30c-9e0d-5815-8215-caba303aa636/scratchpad/v4i/<area>/`.
- **Probes:** write them as tsx scripts in that scratch folder, importing the source by absolute path.

## Decisions by area

### 1. Leash (follow `leash.md`)

- **One shared component:** `src/art/Leash.tsx`, drawn once in Scene between `<Dog>` and `<Man>` (Scene gains an `f` prop).
- **Anchors:**
  - collar ring `collarRing(dog)`
  - a J-shaped hang to a touchdown tied to the dog's body
  - a lying cord to a released handle loop at the single world point HC = (780, 1862) on the grass, between the dog and the man and outside his silhouette
- **Motion:** a sway of 3.7 units or less on the hang only.
- **Look:** constant thickness, colour and handle size, with an ink contour matching the collar. The contact shadow goes on the grass, not in the air.
- **Remove:**
  - the wrist anchor `j.R.W`
  - every `leash={...}` gate (xMode, sectionMode, secOn, xA)
  - the dead V2 StreetShots Leash/StreetScene code
- **Dog pose:** one shared `dogAt(f)` for Journey3 and Aftermath3.

### 2. Rig and continuity (follow `loop_continuity.md` step 5 and `survey_a.md`)

- **Soft IK:** in Man.tsx `ik()`, planted effectors (arm `lW` ≥ 0.9, leg weight ≥ 0.9) stay exactly on target, with a bone stretch of 4.5% or less. This removes:
  - the knee pop at frames 9-10
  - the elbow kink and wrist slide at 34-39
  - the palm lift during the push-up at 1061-1094
- **Planted hand angle:** lock it in world space.
- **Far elbow:** fix the far (right) elbow spike or hook that shows below the tee hem at 28-62.
- **Opening cue:** move the "FICTIONAL FUTURE DEVICE" cue off his head to the upper right (`textAnchor="end"`, x≈1006, y≈244). Keep its frames (4-44) and style.

### 3. Loop wrap (follow `loop_continuity.md` steps 1-3)

- **One periodic alarm in loop time:** gl = f − 1350 for f ≥ B.callback, else f. The period is `B4.alarmPeriod` = 12 frames, with emissions at gl ≡ 6 (mod 12): frames 1344, 6 and 18. The wrap therefore falls mid-ring.
- **The ring:** drawn in Wrist3D, concentric with the glass centre (fr1.O) and starting outside the case, so it never crosses the digits. Its envelope rises from B.callback, the head ring fades out by about frame 30, and the same helper draws the mid-film warning landing at B.red.
- **Remove:**
  - Aftermath3's frame-0 one-shots (`hit`, the camera shake, the ring and Glow block)
  - the device glow step at frame 0
- **Screen state:** the screen's `f` uses loop time, so the ECG trace and scan line are continuous across 1349 → 0. The flash phase is integrated across the rate change at tx0.
- **Checks:** extend `scripts/check_device3.ts`. The last frame must match frame 0 for flash, ring and screen f.

### 4. Dispatch (follow `dispatch.md` steps 0-6, with its numbers)

- **Journey → map:** the transmission pulse continues into the map at 727.
- **Map → hospital:** the map route ends in the dock ring. Match-cut on the dock beacon at 747/748 (same screen position, size and pulse phase, zoom still moving on both sides).
- **Wide → rooftop:** one continuous approach with no lurch.
- **Takeoff:**
  - order: latch, then rotors spin up after it, then lift clear, then forward travel
  - rotor blur rotates with pitch (a `blur` prop in Drone.tsx)
  - one rotorPhase and one drone scale across all shots
- **Rooftop → flyover cut at 864:** the drone's screen position, scale and pitch are identical on both sides, with roll 0. Fix the flyover ground so the houses sit on grass.
- **Trunk wipe:** one consistent rightward truck behind the trunk, with no frozen camera and no drone teleport.
- **Arrival:**
  - HOVER2 above and to the right of his head, with a clear air gap of at least 60 world units, ideally around 80
  - a braking flare
  - an early retreat out of frame (1031-1052), before the recovery framing
  - a soft ground shadow
- **The drone never shines a treating light.**

### 5. Arm and chest anatomy (follow `anatomy.md`, using `anatomy_reference.md` for the internal layout)

**Decision on the pose conflict.**
- **Keep PROP with the palm planted.** An alternate pose would break the planted palm and the approved opening.
- **Put the chest window on the visible front thorax,** between the shirt's front contour and the near arm. Its back (+V) edge runs under the near arm, which occludes it naturally.
- **Lay the interior out self-consistently inside the window.** It is the anatomy_reference layout, shifted toward −V and scaled to fit:
  - the larger right lung on the −V (front) side
  - the heart near the window's centre, slightly toward +V, apex down toward +V (his left), resting on the diaphragm
  - the smaller left lung, with its cardiac notch, on the +V side, continuing under the arm
  - the great vessels above the heart between the lungs, with the arch going toward +V (not mirrored)
  - the diaphragm below
  - the liver under the right dome in the lower −V corner, for the "organ failing" beat
- **Keep the heart clear:** its silhouette stays at least 10 world units clear of the near arm and sleeve.
- **Mounting:** in Man's overTorso slot (after the tee, before the far forearm/hand and the near arm), so the head, near thigh, right hand, near arm and sleeve all occlude it.
- **Right hand:** the low grip during both chest windows (the treatment chest view too).

**The window.**
- A torso-shaped section kept at least 8 world units inside the shirt outline.
- Restrained matte cut band (skin, fat, muscle strata) with a thin ink line.
- No white rim, no offset crescent, no depth ring, no lens or glossy-bowl highlights, no orbiting white dots.
- No organ parallax, or at most about 1.5 world units.
- It opens and closes by scaling about its centroid over 10-14 frames: no iris speck, no residue.

**Heart.**
- Original simplified shape; it contracts (shrinks) on systole and does not swell.
- No whole-heart shake of more than 0.8 world units; irregular quiver content stays at 8 Hz or below.
- One soft specular at alpha 0.3 or less.
- Up to 3 small state-coloured sensor dots on the organ surface; never white.

**One reveal authority, `src/lib/reveal4.ts`.** `revealAt(f)` returns `armOpen`, `backdrop`, `trace` (pulses: signal, warning, treat), `chestOpen`, `organDim` and the heart state. Assert `armOpen × chestOpen = 0` except on a cut frame.
- **Journey:**
  - The arm section stays drawn (VP only) through the pull-back, so there is no hidden switch and no cell pop at 424/425.
  - Fix the camera jump at 422/423.
  - The arm section closes while the camera pulls out (about 442-454), then the arm is a closed exterior.
  - A restrained diagnostic trace (a thin line on the skin of the arm, clipped to the bare arm and hidden under the sleeve) carries short amber dashes up to the chest. They are not particles in blood, and cells never reverse.
  - The chest opens at about 463-477 (the liver dims, then the heart goes regular to irregular), closes at about 570-584, and the red warning dash runs down the trace to the band (about 565-610).
  - Delete the x-ray overAll (vesselGlow, VPX/xTube, cx2, limb tint, limb outline) in both shots.
- **Treatment:** a match cut at about 987 from the vessel (owned by the device area) into the clean chest view. The window is open, the pulse arrives via the superior vena cava into the right atrium with restrained local cyan light, and the heart settles: quiver, a reset, then regular beats. The window closes cleanly before the exterior/recovery (by about 1036). No residue after the close.

**Heartbeat schedule.** Picture and sound share one explicit beat list (`src/lib/heart4.ts`). Journey regular lubs at 459, 480, 501 and 522; irregular from 536. Treatment: quiver at about 987-1002, still at about 1003-1004, lub 1005, lub 1026, regular afterwards.

**Wrist return and ring.** The Journey3 warning-landing ring at B.red uses the loop area's ring helper. Stop the vessel LOD pop at 612: no sudden micro-texture.

### 6. Device and treatment (follow `device_treatment.md` steps 1-7)

**One geometry spec** (DEV_GEO plus PORT_GEO in Device.tsx, read by Interior.tsx):
- caseL 2.0R and caseW 1.62R (unchanged); thickness 0.44R
- the profile has rounded ends
- the yaw lean fades in profile
- the side button sits on the long side wall
- underside: a back panel with a seam, a port with a shutter and a small actuator, a small treatment reservoir and a sensor cartridge
- profile contact shadow on the skin

**Never stretch a flat side view into a long rail.** Profile shots stay at z 12.5 or below while both ends are in frame. Contact details are framed on the port end with the rest of the case running off frame.

**Wrist through the roll.** The hand never stays in back view while the case orbits. Treat the roll as a camera orbit: fade the hand into the section backdrop beyond the wrist line while |roll| > 20° (Option A). Also remove the exposed thumb-base ink lines that appear on the wrist when the case rolls off (survey_a).

**Sensor shot (119-299), compact section window anchored on the contact point:**
- the shutter opens
- a light touch with a small dimple
- the cartridge releases sparse cyan beads along a de-hooked path that merges tangentially with the flow
- the hero ring
- retract and close

**Treatment, inside about 921-1037.**
- **921-939, approach:** follow the wrist and roll to the underside, with the port aligned to its contact point.
- **939-953, actuation:**
  - the shutter opens
  - a tiny piston advances
  - the nose contacts the skin with local compression and an attached shadow
- **952-971, entry:** a compact sectional reveal at the same point, and one narrow blue-white slug (core #EAF4FF, rim #4F86FF, not the sensor cyan) running from the small reservoir down a straight channel through the wall into the lumen. The path is continuous.
- **971-987, internal response:**
  - track the slug with the flow, with a few red cells for scale
  - the piston retracts and the shutter closes, visible at the lower left
  - the slug decelerates for the match
- **987:** the match cut into the anatomy area's clean chest view (pulse screen position, size and colour matched).

No repeated sensor emission, no long glow, no screen-blend fireworks. Define the sub-beat keys in `B4` (treatment section).

### 7. Captions and remaining continuity (done after areas 4-6, follow `loop_continuity.md` step 7 and the surveys)

**Captions.** Time and style are unchanged; keep them off the band and digits, the port, the heart, the eyes and the hero sensor by camera keys alone:
- the transits at 593-597, 680-686, 709-713, 891-925, 987-996 and 1099-1101
- the hero at 289-297
- "tells you exactly" over the shoes at 18-30, if it can be fixed by framing alone

**Camera hitch.** Fix the dive end hitch at 299/300.

### 8. Sound (follow `sound.md`)

**Versioned copies.** `lib/sound4.ts`, `scripts/export_cues4.ts` (writes `audio/v4/cues.json`) and `tools/build_audio_v4.py`, `qa_audio_v4.py`, `seam_check_v4.py`, `export_v4.py`. Never re-run the V3 builders.

**Option R.**
- copy the V3 narration and music stems byte-for-byte
- rebuild only the effects bus
- multiply it by V3's gain envelope G3 (static 4.23 dB × V3 limiter)
- mix by exact sum, without re-normalising
- apply an effects-only safety reduction only if needed

**New cues follow the picture keys:**
- latch, then rotor spin-up after the latch, matched to rotorPhase
- one continuous rotor path or overlapped segments across 864, the trunk wipe and the arrival
- shutter, actuator, a soft contact (press) and a restrained treatment pulse (tpulse)
- heartbeat cues from the shared beat list
- the periodic alarm at 1344 and 6 (no low thump), a cyclic ambience and no frame-0 stack

**Measure:** report LUFS, true peak and the voice margins. Nothing has been heard; say so.

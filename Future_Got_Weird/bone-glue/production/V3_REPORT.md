# Bone Glue V3: review render report

**Status: review render, not final, not published.**

## Deliverable

`exports/FGW_Bone_Glue_V3_REVIEW_1080x1920.mp4`: the picture, burned-in captions, the approved narration, effects and
music.

| Measure | Result |
|---|---|
| Format | H.264 yuv420p, 1080×1920, 30 fps, BT.709; AAC 48 kHz stereo |
| Length | 775 frames, 25.83 s (speech ends at 25.27 s; see "Length") |
| Full decode | no errors |
| Frame-to-frame change | median 4.73 (V2: 3.96; V2 before its pacing pass: 2.85) |
| Near-static run | longest 1 frame |
| Large changes | all planned: the fast push into the glue band (3.2–3.4 s), the lab's camera moves (4.1 s, 5.2 s) and the cement-to-glue dissolve. None unplanned. |
| Loop seam (caption-free, last frame vs frame 0) | 2.5, 0.53× the median frame step: the end lands on frame 0's camera and dissolves into it |
| Mix | -13.2 LUFS integrated, -1.6 dBTP; voice -16.4 LUFS, effects -34.8, music -44.4; 42 effects placed from the picture's events (`qa/v3/mix_measure_mix_v3.json`) |
| Narration | Independent ASR of the final file's audio: zipformer WER 0.000, whisper WER 0.000 (`qa/v3/asr_final_mix.json`) |

## Length

The approved words are unchanged and in order. The only edit to the take is shorter silent gaps between sentences: every
gap over 0.18 s is cut to 0.18 s, in the silence, with no time-stretch and no change to any word. Speech now runs
25.27 s, and the film is 25.83 s with the loop's 0.55 s tail. 22–25 s is not reachable without speeding up or cutting
the narration.

## What the picture does now

| Time (s) | Words | Physical events |
|---|---|---|
| 0–1.5 | "If you shattered your wrist," | **Frame 0:** a cutaway of the wrist. The distal radius is shattered: the two articular fragments split apart and lifted off the transverse crack, the wedge displaced, the dark gaps open. The camera is already pushing in. The applicator injects at the junction and turquoise fronts race along all three cracks (0.14–0.82). Reduction forceps bite the two articular fragments and close (0.55–0.8). The fragments slide together and seat (0.8–1.42), squeezing the glue to a thin band. The tool moves the bone, never the glue. |
| 1.5–2.5 | "imagine gluing the bones" | The tools withdraw; a fast, smooth pull-out to the whole forearm and hand. The bone is aligned and held by teal lines, and the cracks are still visible. |
| 2.5–3.7 | "back together." | The fingers flex once; a fast push into the glue band. |
| 3.72–5.4 | "Researchers actually did it." | **Match cut** to the lab: a turquoise bead on the same screen line. A gloved researcher lays it along a crack in a bone specimen as the camera pulls back, then presses the halves together. |
| 5.46–7.13 | "They developed an experimental glue" | A drop forms at the nozzle and falls. The camera follows it into a beaker of seawater, through the surface. |
| 7.13–9.5 | "inspired by oysters sticking to rocks." | Dissolve into the sea: the oyster on its rock in the current, the water rushing past while it stays put. A push to its base; the section window opens on "sticking" (cement between shell and rock). The cement band dissolves into the glue band on the same screen line. |
| 9.5–12.4 | "It grips bone even inside a wet, bloody wound." | The wet macro, then a push into the **micro section**: the adhesive front flows into the bone's pores, pushes the fluid and blood cells aside, and grips both faces. Back out for the blood wash on "wet, bloody". |
| 12.4–16.0 | "In one reported wrist case, surgeons secured the broken pieces" | Out to the patient's wrist in surgery, with the wedge still displaced (before). The probe seats it, the glue runs into its seams, and the probe lets go (after): nothing moves. |
| 15.8–17.3 | "in just three minutes." | A track across the bonded fracture while the glue sets from gloss to satin; the tools leave. |
| 17.3–22.6 | "The fracture still needed months to heal. But as new bone grows, the glue gradually disappears." | The incision is sutured (time-lapse). The cutaway shows the same fracture in the same orientation: hematoma, then soft callus. A push into a macro of the T-junctions as pale new bone advances from both faces into the glue, then back out as the glue breaks into islands and is gone. Remodelling. |
| 22.8–25.27 | "Your body replaces the stuff holding you together." | Out to the recovered hand: the wrist bends toward the thumb, across and back, and the fingers spread. |
| 25.27–25.83 | (tail) | A push back onto frame 0's composition: the same cutaway, over healed bone. A 0.24 s matched dissolve into frame 0. The healed bone is never animated breaking. |

## Quality-control checklist (before the review render)

| # | Check | Result |
|---|---|---|
| 1 | Frame 1 shows the extraordinary subject | **Yes.** The wrist cutaway shows the shattered radius with open gaps (`qa/v3/muted_phone_0-3s.png`). |
| 2 | Glue visibly stabilises the fracture within 1–2 s | **Yes.** The glue races along every crack by 0.8 s, and the fragments are seated and bonded by 1.42 s. |
| 3 | The opening 3 s contain multiple physical actions | **Yes:** injection, racing glue, forceps bite, reduction, tools withdrawing, pull-out, finger flex, push-in. |
| 4 | No near-identical fracture diagrams lasting several seconds | **Yes.** The longest near-static run is 1 frame. The fracture appears in distinct framings: cutaway, macro, micro, surgical field, healing macro. |
| 5 | Every scene advances the explanation | **Yes.** See the table above. |
| 6 | Transitions connect related objects | **Yes:** the glue band matches to the lab bead, the drop leads into the sea, the oyster cement dissolves into the bone glue, the macro dissolves into the micro section, the healed cutaway dissolves into frame 0. |
| 7 | The oyster scene is understandable immediately | **Yes.** It opens on the oyster on its rock in a visible current, and the cement is exposed by 8.9 s. |
| 8 | Stabilisation versus healing is accurate | **Yes.** The instruments move the bone; the glue only holds. The cracks stay visible after fixation. Healing is a months-long time-lapse in which new bone replaces the glue. |
| 9 | Hands, bones, tools and proportions are consistent | **Mostly.** Every tool is held or runs off-frame toward its hand. The fracture is the same in every scene. The lab gloves use the film's rounded "capsule" finger style. |
| 10 | The ending transitions smoothly back to the opening | **Yes.** Measured without captions, the change at the seam is about half of one normal frame step (`qa/v3/loop_seam_caption_free.json`). |
| 11 | No approved narration changed | **Yes.** Both ASR models read the final audio as the approved script, word for word. |

## Known weaknesses (for review)

- **The "three minutes" claim** is carried by the release, the gloss-to-satin set and the camera's track across the
  bonded seams. There is no clock or timer, to avoid labels.
- **Before/after** is shown by the surgical case opening with the wedge still displaced, then seated and bonded. A true
  orbit is not possible in this 2D style.
- **The lab's wide shot** is small for the bone specimen. The camera moves at about 4.1 s and 5.2 s are very fast.
- **The micro section's scale is stylised:** the blood cells and lacunae are enlarged so they read at 2 mm across.
- **The loop's closing dissolve** shows the cracks fading in over 0.24 s in the same composition. It is a dissolve, not
  an animated break.
- **Frame 0's wrist context** comes from the carpal bones in the cutaway and the skin around it. The thumb and fingers
  appear in the pull-out at 2 s.

## Build

- V3 art modules, documented in `production/V3_PLAN.md`:
  - shattered fragments: `src/art/seams.ts`, `fracture.tsx`
  - the lab and droplet: `src/art/lab.tsx`
  - the micro section: `src/art/micro.tsx`
  - reduction forceps and the cut-rim cutaway: `src/art/forceps.tsx`, `arm.tsx`
- The timeline is `source/src/story.ts`, and the composition is `BoneGlueV3`.
- The full-film render crashed Chrome (out of memory on the dissolve frames), so the file was rendered in four 200-frame
  chunks, joined losslessly, and muxed with `mix_v3`.

## Evidence (`qa/v3/`)

`render_qa.json`, `contact_every_0.5s.png`, `muted_phone_0-3s.png`, `hook_0-2.5s_every_3rd_frame.png`, a strip for every
move and transition (`strip_*`), `loop_seam_last3_first3.png`, `loop_seam_caption_free.json`, `asr_final_mix.json` and
`mix_measure_mix_v3.json`.

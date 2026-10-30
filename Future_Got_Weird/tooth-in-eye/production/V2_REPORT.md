# Tooth in Eye V2: structural rework of V1

**Status.** A V2 review version, rendered from source and checked from the files. **It is not publish-ready** (see
"Unresolved" below). It has not been watched or heard in real time: this environment has no display or speakers.

**Deliverable.** `exports/FGW_Tooth_Eye_V2_REVIEW_1080x1920.mp4`
- 1080×1920, 30 fps, 810 frames, 27.0 s;
- H.264 High yuv420p bt709, CRF 16, AAC 320 kb/s;
- the first 4 s also as `exports/FGW_Tooth_Eye_V2_HOOK_REVIEW_1080x1920.mp4`.

**Source.** `source/src/Scene2.tsx`, `face2.tsx`, `profile2.tsx`, `props2.tsx`, `Captions2.tsx` (composition
`ToothEyeV2`), on the shared implant renderer `implant.tsx`.
- V1's source and composition are at commit `73ce4c9d`.
- `Scene.tsx`, `face.tsx` and `profile.tsx` remain only as V1 history.
- `face.tsx` and `profile.tsx` still supply shared pieces to V2: the lid shapes, the eye state type and the saw path.

## What changed, and why

| Brief point | V1 | V2 |
|---|---|---|
| Narration | 29.03 s with natural pauses | Same take, same words. Eleven long pauses shortened (1.92 s of silence removed, none inside a word), which gives 27.0 s. Speech untouched. Details in `audio/narration/FGW_Tooth_Eye_V2_words.json` |
| Frame zero | Front-on eye: a plate with a black disc that read like "a block with a pupil" | A cross-section of his scarred eye. The tooth plate sits three-quarter on at the front of the eye; the clear cylinder passes through it into the eye, and light is already travelling down it. |
| Recognising the tooth | Root face only | The plate is turned so you see the ivory root (rounded edge, tapered apex, pulp canal) and its **cut neck in cross-section**: dentin round the canal, the classic tooth section. There is still no crown, which is accurate. |
| First 2.5 s | Macro, then a pull-back to the face, then a push into the lens | **One continuous pull-back**: implant → the whole eye section → his profile. The retina lights at 0.9 s. |
| Damaged cornea (4.4–7.8 s) | Section diagram, scattered rays, repeated ray shots | **A physical test on his eye**: a penlight throws white glare off the scar. A donor cornea is stitched in; light gets through and the pupil glows red (the red reflex). Then the graft clouds and vascularises, and the glare returns. |
| Tooth removal | Profile jaw diagram | **His mouth, front-on, held open by cheek retractors**, showing the full front teeth (upper and lower, correct count and order). A local cut-away shows the upper-left canine's root in its bone. The saw cuts round the root (not the crown), the elevator loosens it, and the same block lifts out toward the camera. |
| Plate, hole, lens | Present | Kept and tightened: the saw trims the crown and offcut (with chips), and the pieces fall away. The **drill bores into the plate**: below the surface it is hidden except through the hole it cuts, while chips spray and the hole darkens. A through-hole turn follows, the cylinder goes in along its axis, the click is matched by a small settle of the plate, and it is turned to show both ends. |
| Under the skin | The implant drawn over a translucent cheek | It goes **through an incision and under the skin**: the part below the cut is hidden. A layered cut-away (skin edge, fat, then the muscle it lies under, with muscle fibres drawn over it) shows where it is. Then the skin closes, the time passes, and a tight cut-away shows a capsule and fine vessels growing round the plate. |
| Into the eye | Edge-on implant; section drawn flat | The **same 3D implant** turns to its seat. The graft is lifted, the central cornea, iris and lens removed, and the implant seated at the front with the cylinder through the opening; the graft is laid back. The camera then **rides the light front** through the cylinder and vitreous to the fovea in one move. |
| Payoff | A woman in a room (a continuity error) | **His own view only**: dark and milky, then sharpening fast on his hospital room (window, flowers, IV pole). **His own hands** rise into view (his skin, his gown). Then the cut back to him in profile (the same man): a big smile, raised brows, a tear. The camera pushes back into the eye and the cut-away re-opens to frame zero. |
| One patient | Grey hair, stubble; different drawings in each view | One canonical man in both views: short dark hair, a short dark beard and moustache, the same skin, the same gown, the damaged eye always his right. |
| Sound | Synthesised | Re-timed to V2. A continuous quiet surgery ambience: room tone plus a soft, regular monitor beep. Tactile tool sounds (piezo saw, bone giving way, drill, the click). It goes muffled during his blind view, then opens (brighter air, a warm chord), and crossfades back to the opening pad over the last 0.7 s so the loop is continuous. |

## Timeline (V2)

| Time (s) | Narration | Picture |
|---|---|---|
| 0.0–2.45 | "Doctors put a TOOTH inside this man's EYE…" | Implant in section with light → the whole eye → his profile (one pull-back) |
| 2.45–4.36 | "and he could SEE AGAIN." | Slow push; the retina glows on "SEE" |
| 4.36 | | **Cut** to his damaged eye, front-on, before surgery |
| 4.36–7.8 | "His cornea was so damaged, a normal transplant wouldn't work." | Penlight: white glare. Donor graft: red reflex, then it clouds. |
| 7.7–9.7 | "So surgeons removed one of his teeth" | Down to his mouth; retractors; cut-away; saw round the root; elevator |
| 9.7–10.35 | "with a piece of bone," | The block lifts toward the camera onto the bench |
| 10.35–13.9 | "drilled a hole through it, and fitted a clear lens inside." | Trim, drill, through-hole, cylinder, click, turn |
| 13.7–15.0 | "They tucked it beneath the skin" | To the other eye's lower lid; incision; in under the skin; the layered cut-away |
| 15.0–16.6 | "near his other eye for months," | Both eyes; sutures; days pass; the bruise and incision fade |
| 16.6–18.4 | "letting living tissue grow around it." | Tight cut-away: the capsule and vessels grow |
| 18.4–19.9 | "Then they implanted it" | Out of the pocket, across the face, turning to its seat |
| 19.7–21.1 | "into his damaged eye," | Section: graft lifted, cornea opened, implant seated, graft back |
| 21.15–23.0 | "allowing light to reach his retina." | The camera rides the light to the fovea and into it |
| 23.0–25.1 | "After TEN YEARS blind…" | His view sharpens on his room; his hands |
| 25.09 | | **Cut** to him in profile |
| 25.1–27.0 | "he could see again." | Smile, tear; push into the eye; the cut-away opens to frame zero |

## Measured QC (`qa/v2/qc.json`)

**Container.** 1080×1920, 30/1 fps, 810 frames, 27.0 s; no black frames (blackdetect).

**Single-frame jumps.** Only the two deliberate cuts:
- frame 131 (4.37 s), profile → front-on eye;
- frame 755 (25.17 s), his view → his face.

**Loop seam.** The mean frame difference is 9.8, against 4.6–7.5 for the opening's own steps
(`qa/v2/loop_last_vs_first.jpg`).
- The camera, the implant, the tissue level and the light are continuous across the seam: one approach curve, and
  the rays restart 0.45 s before the end.
- Most of the residual difference is the caption changing ("he could SEE AGAIN." → "Doctors put a TOOTH").

**Audio.** −13.6 LUFS integrated, −1.6 dBTP.

**Narration (ASR on the MP4's own audio).**
- Zipformer: 0 differences.
- Whisper base.en: one difference, "ten" written as "10".

**Captions.** Phrase captions burned in from the measured word times. `captions/FGW_Tooth_Eye_V2.srt` (phrases) and
`captions/FGW_Tooth_Eye_V2_words.srt` (word by word).

## Retention check (first 3 s, `qa/v2/hook/`)

1. **Frame zero.** The eye and the tooth-derived implant interact in a section: the plate on the front of the eye,
   the cylinder through it, light going in.
2. **The tooth.**
   - Recognisable from its root (canal, taper) and from the cut neck in cross-section.
   - It is clearly not a block with a pupil: the cylinder is a 3D clear cylinder, seen side-on.
   - "TOOTH" is spoken at 0.84 s.
3. **The damaged eye and the reconstruction** are both visible by 0.5 s (the scarred cornea rim round the implant).
4. **One continuous camera move** to his face by 2.45 s.

## Unresolved visual defects and limits (honest list)

1. **Not watched or heard in real time.** Pace, levels and legibility were checked from frames, measurements and ASR.
2. **"TEN YEARS blind" is still unverified** (see `production/V1_NOTES.md`).
3. **No crown on the tooth.** The plate reads as a tooth from the root and the cross-section; there is no crown,
   because the real lamina has none. On a mute first glance it may still read as "bone/ivory plate" for a moment.
4. **Three object-led hand-offs dissolve the background behind the continuous implant:**
   - mouth → bench (10.05–10.32 s);
   - bench → cheek (13.8–14.1 s);
   - face → section (19.7–19.88 s).

   The teeth briefly ghost through the drape at about 10.1 s.
5. **The section is stylised.** The plate is drawn over the cut lids and the window edge (nearer the viewer than the
   section plane), so the whole plate stays visible.
6. **The tissue sheath is shown at 25%.** In reality the plate is fully covered by fibrous tissue and the cheek-lining
   graft. It is drawn at 25% so the tooth stays legible.
7. **2.45–4.36 s is the slowest stretch:** his profile with a slow push while the retina glows on "SEE AGAIN".
8. **His hands in his view are simplified** (rounded fingers). The room is simplified.
9. **The front-on face is stylised.** The eyes are drawn 1.25× life size. The damaged eye shows the pink stage-1 graft
   in the pocket scenes (accurate, but not narrated).
10. **The lower teeth are simplified rectangles.** Only one retractor is fully in frame during the saw.
11. **The profile eye is small.** His reaction reads mainly through the smile, the brows and the tear.
12. **A warm glow fills the frame for about 0.25 s** at the fovea (22.6–22.9 s), then his view begins.

# Tooth in Eye V5: retention pass on V4

**Status.** This is the V5 final-review render, built from source and checked from the files.
- It has **not been watched or heard in real time**: this environment has no display or speakers.
- "TEN YEARS blind" still needs a confirmed source.

**Deliverable.** `exports/FGW_Tooth_Eye_V5_FINAL_REVIEW.mp4`
- 1080×1920, 30 fps, 798 frames, 26.6 s;
- H.264 High yuv420p bt709, CRF 16, AAC 320 kb/s.

**Source.** `source/src/Scene5.tsx` (composition `ToothEyeV5`), `Captions5.tsx`, and the shared `face2.tsx`, `profile2.tsx` and `implant.tsx`.
- V4's exact source is at commit `483f2bef`.

**Narration.** The same approved ElevenLabs take, word for word, with the same word times.
- `audio/narration/FGW_Tooth_Eye_narration_V5.wav` is a byte copy of the V4 master.

## What changed, section by section

| Section | V4 | V5 |
|---|---|---|
| **0.00–0.35** | A normal-looking pink eye; the cut-away opened later | **Frame zero already shows the unusual eye.** The pink graft covers his eye, the small dark-centred cylinder sits at its centre, and a local cut-away of the graft already shows the tooth-and-bone plate beneath, holding the cylinder. It is framed close (lids, lashes, brow, cheek), so it reads as a human eye at once. There is no exposed slab. |
| **0.35–1.20** | A slow push | **A push into the cylinder.** The cut-away widens, and the plate turns about 20° in the cut-away (2.5D parallax), so the cylinder is seen passing **through** the plate. The lids and lashes stay in frame. |
| **1.20–2.60** | A static section for about 1.6 s, then the window closing onto his profile | **A fast cross-section on a continuous camera move.** A 7-frame dissolve matched on the cylinder leads into the section. Light enters the cylinder at about 1.3 s, and the camera pulls back to the whole eye as the light crosses it. The retina lights on "EYE", and the camera follows the light into the fovea. The profile-face return is cut. |
| **2.60–3.50** | A glimpse of his room | **His first sight, physically motivated: the retina's warm light becomes his view.** A close, deeply blurred vase of yellow flowers **snaps into focus on "SEE"** (3.34), with a small focus overshoot. |
| **3.50–8.20** | A wide face, then a push to the eye, then a hold; a camera glide to the mouth | **One progression.** His view clouds into white, the light scattering off a scar, and the white becomes the **glare off his scarred cornea**. The penlight is already on and sweeps across the scar. **Scattered rays fly off the scar** while the pupil stays dark, so light is blocked. A donor cornea gives a red reflex (light gets through), then clouds over and the scatter returns. **The penlight then leads the camera down to his mouth.** There is no wide static face. |
| **8.20–13.80** | Kept | **Kept, with these fixes:** **holding forceps** take the bone block as the elevator frees it, carry it to the bench and grip it there by its bone strip (clear of the saw's path and the drill) until the cylinder forceps take over. Before, it floated. The **bone is re-coloured** (pale, slightly pink, finer pores) so the plate no longer reads as wood. The same block becomes the same plate, which becomes the same implant. |
| **13.80–18.80** | Front view: a ghosted plate under the cheek (a flat patch), then a near-static face | **Front view (13.9–15.3 s):** the incision, then the **mouth of the pocket held open** (dark inside, a raised skin edge). The implant slides in, and the part under the skin is hidden, shown only by its rise under the skin. The pocket closes and is sutured. **Then a cut-away from his left side (15.3–18.8 s).** This sagittal section through the lower lid and cheek shows the skin, fat, the orbicularis muscle, the implant in its pocket **under the muscle**, the deep fat and the cheekbone. It is anchored in his face, not a floating diagram. Over "months" (day and night pass) the incision heals; on "living tissue grow around it" a **pink fibrous capsule thickens round the implant and branching new vessels grow in from the surrounding tissue**, progressing all the way. At 18.45 s the incision reopens and the implant slides out along its tract. |
| **18.80–22.40** | The plate held face-on over the eye; a 3D turn into the section | **The living implant** (with its tissue sheath and vessels) is carried in forceps **above** his face, its **shadow on his skin**. It stops in front of the eye, never on it. A short dissolve leads into the section: the graft is lifted, the central cornea and the iris and lens removed, and the plate seated flat on the front of the eye **under the graft** (laid back over it), with only the cylinder's end out. The camera then follows the light through the cylinder to the retina. |
| **22.40–26.60** | The view clear by 24.4 s, then a long look | Darkness, then an **extremely blurred** view (light and shapes only, gently swaying, his hands rising as blurs) all through "After TEN YEARS blind…". **On "he could SEE" (25.12–25.45) a fast focus pull with an overshoot** brings in his room, **his own hands**, and **the same vase of flowers** from the opening, with a warm bloom. He looks toward them. At 25.78 s, cut to **his face** (the same man): brows lift, a small smile, a tear from his other eye, a slight tilt. A **smooth push into his reconstructed eye** follows, and the graft cut-away opens to match frame zero exactly. |

## Global rules

- **Transitions are motivated by the story:**
  - push into the cylinder, dissolve to the cylinder in section;
  - the light goes into the fovea and becomes his sight;
  - his view scatters into the glare of his scarred cornea;
  - the penlight leads to the mouth;
  - the forceps carry the block, then the implant;
  - the incision opens to the pocket, then the cut-away;
  - the implant is carried to the eye, then the section;
  - the light leads to his view, his view leads to his face, and the push lands on frame zero.
- **Only one hard cut:** from his view to his face (25.8 s).
- **No circular call-outs and no floating boxes.** The cut-aways sit inside his eye or face.
- **One patient throughout.** His left side, in the pocket shot, is the same profile drawing mirrored, with his other (blind, white) eye.

## Measured QC (`qa/v5/qc.json`)

- **Container:** 1080×1920, 30/1 fps, 798 frames, 26.6 s. No black frames.
- **Single-frame jumps:** only frame 774 (25.8 s), the deliberate cut to his face.
- **Loop seam:** the mean difference is 5.71, against 4.3–5.7 for the opening's own frame steps, so the seam is as smooth as normal motion.
- **Audio:** −13.6 LUFS integrated, −1.6 dBTP. The sound events were re-cued to V5; there are 28 restrained effects.
- **Narration (ASR on the MP4's audio):**
  - Zipformer: 0 differences.
  - Whisper: one difference, "ten" written as "10".
- **Evidence files:**
  - `qa/v5/hook/frame0.png`
  - `qa/v5/hook/hook_0-4.6s_5fps.jpg`
  - `qa/v5/bench_8.2-13.8s.jpg`
  - `qa/v5/cheek_13.8-18.8s.jpg`
  - `qa/v5/operation_18.6-22.4s.jpg`
  - `qa/v5/payoff_22.4-end.jpg`
  - `qa/v5/sheet_2fps.jpg`

## Remaining issues (honest list)

1. **Not watched or heard in real time;** **"TEN YEARS blind" is unverified.**
2. **The two hook dissolves** (front to section at 1.03–1.27 s; carry to section at 19.45–19.6 s) briefly overlap two views.
3. **The pocket cut-away mirrors the profile drawing to show his left side.**
   - The plate there is drawn as a section (as in the eye), not as the 3D object.
   - The rise under the skin in the front view is subtle.
4. **The plate turns about 20° in the hook's cut-away while the eye drawing stays flat.** This is a 2.5D parallax device.
5. **The penlight beam on the teeth is faint** during the move to the mouth.
6. **The payoff caption sits low and crosses his wrists** when his hands rise (it never covers the implant).
7. **Carried over:**
   - the teeth ghost briefly through the drape at about 10.1 s;
   - simplified hands and room;
   - the eyes are drawn 1.25× life size in the front view;
   - the plate is drawn at the bench model's size (about 15 × 9 × 3.2 mm).

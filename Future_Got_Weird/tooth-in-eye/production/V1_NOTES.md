# Tooth in Eye V1: production notes, visual QC, accuracy checklist

**Status.** A V1 review version, rendered from source and checked from the files. **It is not publish-ready** (see
"Before publishing" at the end). Nobody has watched it in real time or listened to it: this environment has no
display or speakers.

## How it was made

### Narration
- The locked script, word for word, read by the channel narrator ("Test Voice", eleven_v4).
- One run of two takes; take 1 was chosen.
- The speech is untouched.
- Details: `audio/narration/voice_provenance.json`.

### Timing
Every visual event is keyed to measured word times (`source/src/data/timeline.json` through `TM` in
`source/src/story.ts`). Examples:
- the tooth plate is revealed under the first word;
- light reaches the retina on "SEE";
- the scar scatters the light on "damaged";
- the donor graft clouds on "wouldn't work";
- the saw circles the root on "removed";
- the block lifts on "piece of bone";
- the drill bites on "drilled";
- the cylinder clicks home on "inside";
- the implant slides under the skin on "beneath the skin";
- the tissue grows on "living tissue";
- the retina lights on "retina";
- the patient's view clears on "see again".

### Picture
Deterministic Remotion/SVG in the channel's outlined 2D finish, with one real 3D object.
- **The implant (`source/src/implant.tsx`)** is a true extruded solid with an orthographic projection. Its front face
  carries the drawn anatomy through an exact affine map: root dentin with growth lines, the pulp canal, cementum, and
  porous bone. One renderer draws every state:
  - the canine block;
  - the trimmed pieces;
  - the drilled hole;
  - the clear PMMA cylinder;
  - the tissue sheath;
  - the edge-on view;
  - the matching section (`ImplantSection`).
- **Consistency.** The outline, thickness, hole position and cylinder length are single constants, so the
  geometry cannot change between shots.
- **Model sheet.** `source/src/dev/ModelSheet.tsx` (composition `ModelSheet`) shows the implant from eight angles.
- **Other places:**
  - the patient front-on (`face.tsx`, an original character);
  - the patient in profile with local cut-aways (`profile.tsx`);
  - the bench and instruments (`props.tsx`);
  - his view (`props.tsx`, `View`).

### Runway
Not used. The anatomy and the implant's geometry had to hold exactly from every angle, so everything is drawn
deterministically, as the brief prefers for surgical scenes.

### Sound
All effects are synthesised and placed from the picture's own events (`audio/cues.json` → `tools/make_audio.py`, log
in `audio/sfx_log.json`):
- a distinctive glassy, detuned tone with a wet creak under the opening reveal;
- a piezo saw;
- bone giving way;
- a subdued dental drill;
- a crisp click as the cylinder seats;
- soft tissue sounds;
- a faint shimmer for light, and a warm chime when the retina is lit.

Under them sit:
- an uninterrupted room ambience;
- a low uneasy pad, which goes muffled during his blind view;
- the pad then opens into a warm D-major chord with brighter room air and distant birds as his sight returns.

There are no stingers and no whooshes on camera moves.

## Story and transitions (FGW transition list)

Each row gives the time, then: outgoing subject → incoming subject → new information → keep / merge / remove.

| Time (s) | Transition | New information | Decision |
|---|---|---|---|
| 0.00–0.45 | (open) extreme macro of the eye; the graft over the lamina turns see-through | a tooth root and bone hold the cylinder in the eye | keep: first frame is the spectacle |
| 0.45–1.45 | small orbit: the implant turns 14°; parallax against the lids | it is a real 3D object under the tissue | keep |
| 1.2–2.2 | pull back to his face | it is a person; the other eye is blind | keep |
| 2.2–2.86 | push into the dark cylinder; light at its far end | the cylinder is a window | keep: through the object |
| 2.76–3.85 | out of the dark: the rays run through the cylinder; the profile section opens round them | light passes the lens and reaches the retina on "SEE" | keep |
| 4.55–5.25 | the same section runs back: the implant slides out; the graft lifts away; the scar returns | before the surgery | keep: same view, time reversed |
| 5.35–8.2 | push to the cornea: light scatters; a donor graft fits, then clouds and vascularises | why a normal transplant fails | keep |
| 8.25–9.3 | pull back and pan down the same profile; the jaw cut-away opens | where the tooth comes from | keep: same body, new region |
| 9.1–10.45 | saw round the root; elevator; the cut block now separate | the extraction | keep |
| 10.45–11.05 | the block lifts toward the camera and lies down; the drape replaces the face behind it | to the bench | keep: object-led |
| 11.0–14.55 | bench: crown and offcut sawn away; drill; through-hole; cylinder in (click); turned to show both ends | the build | keep |
| 14.45–15.3 | the forceps carry the implant up; the face (lower lid of the other eye) replaces the drape behind it | to the pocket | keep: object-led |
| 15.3–19.4 | under the skin; sutures; pull back to both eyes; days pass (light, healing); push in as tissue grows | the months in the pocket | keep |
| 19.45–20.72 | out of the pocket and across the face; it turns edge-on in front of the damaged eye | to the eye | keep |
| 20.7–20.9 | the profile section replaces the face behind the edge-on implant | into the section | keep: object-led (the weakest hand-off: a 0.2 s background dissolve) |
| 20.9–22.5 | graft lifted; central cornea, iris and lens removed; implant seated; graft laid back | the implantation | keep |
| 22.6–24.75 | light through the cylinder; the camera follows it into the fovea | light reaches the retina | keep |
| 24.45–24.85 | the lit retina fills the frame and darkens | into his eyes | keep: through the layer |
| 24.75–27.45 | his view: dark and milky, then clearing to a woman waving in a warm room | sight returns | keep |
| 27.45 | **cut** to his face | his reaction | keep: the one hard cut, a deliberate change of view |
| 27.95–29.03 | approach into the macro, landing on frame one | the loop | keep |

## Timestamped visual QC notes (V1 review render)

| Time (s) | Note |
|---|---|
| 0.00 | Frame one is the macro: a pink graft-covered eye with a black optical cylinder, the cut-away already half open on the root plate. The caption sits on the cheek. |
| 0.20–0.45 | The cut-away opens to the lamina's own outline, not a circle. The root's rounded edge and tapered apex, the pulp canal, the dentin's growth lines and the porous bone strip are all visible. A wet rim marks the cut edge. |
| 0.45–1.45 | The orbit shows the cylinder's side wall; the lamina shifts against the lids. No geometry change. |
| 1.6–2.2 | His face reads at phone size: the pink OOKP eye with the ivory plate, the milky other eye. |
| 2.6–2.86 | The black lumen fills the frame, with a warm glow at the far end. |
| 2.86–3.3 | Thin rays streak through darkness, then the cylinder, lamina and eye emerge round them. There are no black frames (blackdetect: none). The wall shapes are briefly abstract at the highest zoom. |
| 3.4–3.8 | The rays converge on the fovea; the retina glows on "SEE". |
| 4.55–5.25 | The rewind reads as the implant leaving. The iris and lens fade back in. |
| 5.4–8.2 | The scar is a thick white cornea. Scattered rays and a dim haze on the retina. The donor graft is blue and sutured; it clouds white with vessels. |
| 8.25–9.3 | The pan to the jaw passes the head's profile; the cut-away opens. The teeth are simplified, with roots seen through translucent bone. |
| 9.1–9.95 | The saw traces a U round the root only (the crown is free). The blade buzzes. |
| 9.95–10.45 | The canine switches to the solid block exactly on the cut line. Its bone texture is the block's own, so the bone round the root changes pattern at this moment. The elevator wedges, then the block nudges. |
| 10.45–11.05 | The block lifts and lies flat; the socket shows dark red. |
| 11.0–11.5 | The trimming saw runs down the neck and along under the root; the crown and offcut slide out of frame. |
| 11.55–12.55 | The drill is square to the face. Dust flies; the hole darkens, then the drape shows through it. |
| 12.35–12.8 | Turned to three-quarter: a clean through-hole. |
| 12.8–13.9 | The forceps feed the clear cylinder along its axis; it clicks home at 13.9. |
| 13.95–14.5 | Turned to show the cylinder proud on both faces. |
| 14.45–15.3 | Carried to the other eye's lower lid. The drape dissolves to the face behind the implant (0.35 s). |
| 15.3–16.3 | The implant slides under the incision, seen through the skin. The forceps release and withdraw. Sutures go in. |
| 16.0–17.65 | Both eyes; three soft light cycles; the bruise and incision fade. |
| 17.7–19.4 | The skin turns see-through; pink tissue and vessels cover the lamina. The cylinder stays clear. |
| 19.45–20.72 | The forceps come back, lift the implant out, and carry it across. It turns edge-on. |
| 20.7–20.9 | **Weakest hand-off:** the face dissolves to the section behind the edge-on implant. |
| 20.9–22.5 | Graft flap, trephined disc, iris and lens out, implant seated, graft back with the cylinder through. The action is small; it reads best at normal speed. |
| 22.6–23.9 | The rays pass the cylinder to the fovea; the retina lights on "retina". |
| 23.9–24.45 | The dive into the fovea. Photoreceptors are visible, then a warm glow fills the frame for about 0.35 s. |
| 24.75–26.5 | His view: near-black, milky and featureless. |
| 26.5–27.3 | It clears to a woman (an original character) waving in a warm room. Soft vignette for the cylinder's limited field. |
| 27.45–27.95 | His reaction: brows up, a wide smile. The OOKP eye can't express (accurate). |
| 27.95–29.03 | The approach into the macro. The expression settles, and the cut-away re-opens to frame one's state. |

## Measured QC (`qa/review/qc.json`)

**Container.** 1080×1920, 30/1 fps, 871 frames, 29.03 s, H.264 High yuv420p bt709, AAC 48 kHz stereo 320 kb/s.

**Frame-difference scan.**
- Median frame step 2.8.
- One single-frame jump: frame 825 (27.50 s), the deliberate POV → face cut.
- Black frames: none.

**Loop.** The last frame vs the first has a mean difference of 6.9, against 6.1–6.3 for the opening's own first
frame steps (`qa/review/loop_last_vs_first.jpg`). The camera runs one continuous approach curve across the seam.

**Audio.** −13.6 LUFS integrated, −1.6 dBTP (decoded from the MP4).

**Narration (ASR on the MP4's own audio).**
- Zipformer: 0 differences.
- Whisper base.en: one difference, "ten" written as "10".

**Captions.** Generated from the same word times as the picture: phrase captions burned in, plus
`captions/FGW_Tooth_Eye_V1.srt` and a word-by-word `captions/FGW_Tooth_Eye_V1_words.srt`.

## Retention test (first 3 s inspected separately: `exports/FGW_Tooth_Eye_V1_HOOK_REVIEW_1080x1920.mp4`, `qa/hook/`)

1. **Does the very first frame show a bizarre, understandable visual?** Yes. An eye with no white or iris, only pink
   tissue and a black glass cylinder, with the plate half-revealed. It is bizarre and clearly an eye.
2. **Is the tooth actually recognizable, rather than a generic white ring?** Partly.
   - It is never a ring: it is an ivory root with its canal, rounded edge and tapered apex, on a strip of porous
     bone.
   - The first render hid the apex under the upper lid. The fix turned the plate over in the eye so the root edge and
     apex sit in the open fissure.
   - The root reads as "tooth" with the word TOOTH at 0.84 s. On its own it reads more like "bone or ivory".
   - This is a limit of accuracy: the real lamina has no crown. The extraction at 9–11 s confirms it is a tooth.
3. **Does the first sentence explain the spectacle immediately?** Yes. "Doctors put a TOOTH inside this man's EYE"
   runs over the reveal (word one at frame one), the pull-back to his face and the push into the lens.
4. **Does the preparation and drilling sequence provide satisfying physical detail?** Yes.
   - the saw cut round the root, the elevator, and the socket left behind;
   - the crown and offcut sawn away;
   - the drill with dust, then the through-hole;
   - the cylinder slid in along its axis with a click;
   - a turn to show it proud on both faces.
5. **Does the same tooth-and-lens structure remain visually consistent?** Yes, by construction: one solid and one set
   of constants in every shot (jaw, bench, pocket, eye, section). The in-eye view shows it turned over (see 2).
6. **Does the eye anatomy remain correct?**
   - The retina stays at the back. The lamina sits on the front of the eye. The cylinder passes through the trephined
     cornea into the anterior chamber.
   - The iris and lens are removed at implantation. The graft covers the lamina. No lens floats in the vitreous.
7. **Does the restored-sight payoff feel earned?** Largely.
   - Light is shown failing twice (the scar, then the donor graft) before it succeeds.
   - His view starts dark and milky and clears to a person.
   - The reaction is short (0.5 s) because the loop push follows.
8. **Does the ending loop naturally?** Yes. It is measured (seam 6.9 vs 6.2) and continuous in camera.
9. **Would this opening compete with the strongest scenes from Cockroach V5 and Dead Spider V6?**
   - The first frame is stranger than either, and the mechanism scenes have comparable physical clarity.
   - The weaker points:
     - the tooth reads only partly without the narration;
     - 2.86–3.3 s passes through briefly abstract shapes at very high zoom.
   - Both references also improved over several passes. V1 is a first production version.

## Brief factual accuracy checklist

- [x] **The procedure.** Osteo-odonto-keratoprosthesis (OOKP), for severe corneal blindness when a donor cornea would
  fail.
- [x] **The tooth.** A single-rooted canine is taken with its surrounding alveolar bone. The crown is removed and the
  root and bone are shaped into a lamina (here 14.5 × 9 × 3.2 mm).
- [x] **The hole and cylinder.** A hole is drilled through the dentin and a clear PMMA optical cylinder is fitted
  through it (here 3.6 mm across, proud on both faces).
- [x] **The pocket.** The lamina is implanted beneath the tissue of the lower lid of the other eye for months, where
  fibrovascular tissue invests it. Some surgeons use the cheek. The film does not show the tooth sprouting roots or
  the lens growing vessels. In reality, vessels that grow over the cylinder are trimmed at stage 2.
- [x] **Stage 2.** The oral-mucosa graft is lifted, the central cornea is trephined, the iris and lens are removed,
  the lamina is fixed on the front of the eye with the cylinder through the opening, and the graft is laid back with
  the cylinder protruding.
- [x] **Light path.** Light passes the cylinder to the retina. This works only if the retina and optic nerve function:
  the film shows corneal blindness, never optic-nerve damage.
- [x] **No exposed tooth.** No tooth protrudes from the eye; externally there is only the graft and the small optic.
- [x] **The patient.** An original illustrative design, not a likeness. No one is named.
- [x] **His view.** Shown as normal, limited-field vision (a soft vignette), not super-vision.
- [x] **Silent stage-1 detail.** Stage 1 also covers the eye with the cheek-lining graft. It is shown silently: the
  pink surface in the pocket scenes, and the flap in the implantation.
- [ ] **"Ten years blind" (UNVERIFIED).** My search found:
  - Moorfields' OOKP pathway at St George's, London, whose first patient had stage 1 in November 2024;
  - a widely reported Canadian OOKP patient who had been blind for about ten years.

  I did not find a Moorfields source for a patient blind for ten years. Please confirm the source before publishing.
  The narration names no hospital, so the line stands only if a real case supports it.
- [x] **Stylisations.**
  - The eyes are drawn 1.25× life size on the face for readability (the implant scales with them).
  - The lamina sits flat on the curved cornea.
  - The lids and teeth are simplified.
  - Rays are drawn as visible beams.

## Open issues and things to flag before calling it publish-ready

1. **Not watched or heard in real time.** Pace, levels and readability were checked from frames, measurements and ASR
   only.
2. **Fact check:** "TEN YEARS blind" needs a confirmed source (above).
3. **Tooth recognition in the first second is moderate.** See retention test answer 2.
4. **Three object-led hand-offs dissolve the background behind the continuous implant:**
   - jaw → bench (10.75–11.05 s);
   - bench → face (14.6–14.95 s);
   - face → section (20.7–20.9 s), which is the weakest.
5. **2.86–3.3 s:** the exit from the lumen passes briefly abstract shapes at very high zoom (darkened, with the rays
   leading).
6. **23.9–24.45 s:** a warm glow fills the frame for about 0.35 s as the camera reaches the fovea.
7. **The implantation steps (20.9–22.5 s) are small in frame.** They read at normal speed; frame by frame the flap and
   trephine are subtle.
8. **Simplified surroundings.** The jaw cut-away and the hospital room are simplified. The canine's bone texture
   changes when the cut completes (9.95 s).
9. **The reaction is brief** (27.45–27.95 s) before the loop push.
10. **Runtime 29.03 s**, inside the 28–31 s target.

# V1 quality report: Doctors Grew an Ear Inside Her Arm

**Status.** A V1 review version, rendered from source and checked from the files. **It is not published.**

Nobody has watched it in real time or listened to it: this environment has no display or speakers. Every judgement
below comes from rendered frames, measurements and ASR, and it says which.

## Deliverable

| Item | File |
|---|---|
| Review MP4 | `exports/FGW_Ear_Forearm_V1_REVIEW_1080x1920.mp4` |
| Captions | burned in; also `captions/FGW_Ear_Forearm_V1.srt` |
| Final mix | `audio/mix/FGW_Ear_Forearm_V1_mix.wav` (48 kHz, 24-bit, stereo) |
| Narration master | `audio/narration/FGW_Ear_Forearm_narration_V1.wav`; provenance in `audio/narration/voice_provenance.json` |
| Exact transcript | `production/NARRATION_TRANSCRIPT.txt` (the locked text, phrase times and word times) |
| QA evidence | `qa/` (ffprobe, ASR, loudness) and `qa/review/` (sheets cut from the delivered MP4) |

**MP4 specification.**
- Video: 1080×1920, 30/1 fps, 645 frames, 21.50 s, H.264 (CRF 16, slow), yuv420p, bt709.
- Audio: AAC 320 kb/s, 48 kHz stereo.
- Size: 16.5 MB. A full decode reports no errors.

## References: what was and wasn't inspected

**Not in the repository.** Cyborg Cockroach V5 and Dead Spider V6 are not in this repository. Neither renders nor
production assets for them are here, so **I did not inspect them**.

**Inspected instead.** I looked at the channel's other rendered Shorts in the repository, as contact sheets from their
MP4s:
- **Zombie Ant V4 FINAL.** Its drawing core was carried over from Dead Spider, according to
  `zombie-ant/production/V1_NOTES.md`.
- **Living Skin V4.**

I also read `FGW_EDITING_RULES.md`. From these I took:
- the finish: ink-edged 2.5D vector, upper-left key light;
- the caption treatment;
- the narrator setup (same voice id and model);
- the audio pipeline (synthesised effects placed from picture events);
- the loop discipline.

**Benchmarks.** The "as immediate as the cockroach or dead-spider openings" comparison below is against Zombie Ant V4's
opening, the closest available benchmark.

## Narration

- **Voice.** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`) on `eleven_v4`. This is the channel narrator's id, the
  same one used for Dead Spider, Cyborg Cockroach and Zombie Ant.
- **Takes.** One run of two takes; take 2 was chosen (reasons in the provenance file).
- **Script.** The locked script is spoken word for word.
- **ASR on the delivered MP4's audio.** Whisper base.en and Zipformer: **0 word differences** (`qa/asr_final_mp4.json`).
- **Edits.**
  - 34 ms of leading silence trimmed, so "Doctors" starts at 0.00 s, on frame one.
  - The gap after "nerves." lengthened by 0.30 s, for the reveal beat.
  - No time-stretch, no splices inside words.
- **Pace.** 185 wpm; speech runs 0.00–20.71 s.

## Runtime against the brief (deviation)

**The brief asks for 25–28 s; V1 runs 21.5 s.** The approved script, read at the requested "confident, fast" pace,
takes 20.7 s. Reaching 25 s would need about 4 s of added pauses or a slower read. The brief rules out both: no
stretching the narration, and no pauses that interrupt momentum.

So the film follows the natural read, plus:
- one 0.3 s beat after "nerves.";
- a 0.8 s tail after "HERE." for the push back into the opening composition.

If you want 25 s+, a slower, less "brisk" take is the clean way to get it; that is your call. Every scene target in the
brief was re-timed to the measured words (table below).

## Timestamped scene log (film seconds, from the delivered MP4)

| Time | Words | What happens on screen | Brief section |
|---|---|---|---|
| 0.00–0.55 | "Doctors grew an EAR" | Frame 1: extreme macro of the inner forearm. A human ear shape (rim, antihelix, concha, tragus) pushes up under intact skin: arm hair, skin texture, a slight warm flush over the stretched skin. The relief swells about 18 % and settles. Under it, a low felt impact and a skin stretch. The pull-back starts at once (eased in from rest, for the loop). | Impossible first frame |
| 0.55–2.75 | "…EAR inside this woman's FOREARM." | One continuous pull-back: forearm edges, then the wrist and the open hand (palm toward us, thumb toward her head). From 1.0 s she turns the forearm slightly, and the ear moves and narrows with the skin. The elbow and her head appear, and by 2.2 s the whole figure: an anonymous woman, left arm raised, the ear mid-forearm. | Prove the claim |
| 2.75–4.0 | "She lost her ear…" | The camera travels from the arm to her head. The left ear site is a healed, smooth, paler footprint with a soft scar border, a small tragus remnant and the ear-canal opening kept. | What happened |
| 4.43–5.2 | "…in a crash," | A brief memory behind her, not a separate scene (about 0.6 s): the background drops to night, headlights flare past, and safety glass cracks out behind her head. A distant, muffled impact with a little glass. It clears as the camera moves on. | What happened |
| 5.2–6.6 | "so surgeons carved a replacement" | The camera moves down her torso. A feathered local see-through opens on her lower chest: ribs (ivory bone laterally, blue-white costal cartilage toward the sternum). Where the 6th and 7th cartilages fuse, a block is traced by a scalpel. | Building the ear |
| 7.14–7.61 | "from her own rib cartilage." | The block lifts out toward the camera. Its cavity is left in the ribs, and the body behind dims. | Building the ear |
| 7.61–8.82 | "…cartilage. / They tucked it" | Carving in front of the chest, the same pearly cartilage throughout:<br>1. the plate is cut to the ear outline, and the offcuts drop away as the cut passes through them (7.61–8.05);<br>2. the scapha, the antihelix and the concha are carved, with shavings (8.05–8.47);<br>3. the rim ridge is cut free along the helix (8.47–8.82). | Building the ear |
| 8.82–9.62 | "beneath her arm" | The framework is carried across her body (over the gown and the upper arm) to the forearm. The camera follows it, easing out and back in. | Under the skin |
| 9.62–10.3 | "skin," | A pocket incision on the forearm. The framework slides in under the skin edge, and its relief rises beneath the skin as it goes. The skin settles, and five stitches close the incision. | Under the skin |
| 10.35–11.9 | "where new blood vessels formed around it." | The camera pushes in. The skin over the framework turns locally transparent (feathered, no ring) to show the tissue. Three trunks from the forearm artery branch through it and wrap around the framework's margin. The framework is drawn above the vessels, so none appears inside the cartilage. Under it, a low organic swell with a faint pulse. | Under the skin |
| 11.9–12.3 | — | The cutaway closes; the stitches fade (healed). | |
| 12.31–13.10 | "Months later," | A scalpel outlines the flap: the ear plus a margin of skin. | The transplant |
| 13.10–13.69 | "they moved the living" | Forceps lift the living ear with its skin. The vessels it was raised on stretch down to the forearm, and the donor bed is visible: muted pink, not gory. | The transplant |
| 13.69–14.55 | "ear to her head," | The flap is carried in one arc from the forearm up to the ear site, with the camera following. It turns and narrows into the three-quarter view of her head; short vessel stubs hang beneath it. | The transplant |
| 14.55–15.07 | "reconnecting" | It settles into place over the old ear footprint; the forceps release. | The transplant |
| 15.07–17.26 | "…its blood supply and nerves." | A close-up just below the front of the ear: a feathered local cutaway.<br>1. The flap artery meets the recipient artery, and six sutures are placed with a micro needle holder (15.2–16.0).<br>2. Then the vein, six sutures (15.8–16.5).<br>3. Then one nerve, two sutures (16.4–16.96).<br>Blood flow brightens the flap's vessels and the ear warms. A tiny instrument tick and a suture pull per stitch. | The transplant |
| 17.1–18.9 | "And for MONTHS…" | The camera pulls back to her head with the ear in place: three-quarter view, the face unchanged, fine closure marks fading. A brief warm lift in the light, and the bed turns from minor to major (the "release"). | Final reconstruction |
| 18.9–20.3 | "her new ear was right" | The camera moves back to the forearm: the healed graft patch. As the camera arrives, the ear relief rises under the skin again. A soft rising swell. | The loop |
| 20.29–21.5 | "HERE." + tail | A low soft landing on "HERE". The push continues into the macro composition, and the last frame equals the first. | The loop |

## Transition list (FGW rule: outgoing → incoming → new information → decision)

| t (s) | Outgoing → incoming | New information | Decision |
|---|---|---|---|
| 0–2.75 | ear macro → whole figure (one pull-back) | it is a person's forearm | keep |
| 2.75–4.0 | forearm → head (pan and push) | the ear is missing | keep |
| 4.43–5.2 | clinic → night and glass behind her (in place) | why: a crash | keep (no cut; under 1 s) |
| 5.2–6.6 | head → chest, a local see-through | where the material comes from | keep |
| 7.14–8.82 | the ribs → the lifted block in front (follow the object) | it is carved into an ear | keep |
| 8.82–9.62 | chest → forearm (follow the framework) | where it goes | keep |
| 10.35–12.3 | skin → local see-through → skin | vessels form around it | keep: it completes an explanation before returning |
| 13.69–14.55 | forearm → head (follow the flap) | it moves to the head | keep |
| 15.07–17.26 | ear → local see-through below it → ear | vessels and a nerve are reconnected | keep |
| 17.1–21.5 | head → forearm macro | the loop: "right HERE" | keep |

There are no cuts. Every move follows the same body or the same object.

## Technical checks (measured on the delivered MP4)

- **Frame steps.** I took the mean absolute luma difference over every step (`tools/frame_steps.py`).
  - Mean step 4.9; largest 26.2, at 8.97 s (the deliberate carry across the body).
  - No isolated jumps: the largest step-to-local-median ratio is 1.2.
  - There are no one-frame resets of scale, position or focal target.
- **Loop seam.** The last→first step is 4.3, lower than the film's mean step. `qa/review/loop_last_vs_first.jpg`
  shows the same composition and the same ear.
- **Audio** (from the MP4, `qa/audio_measure_from_mp4.json`):
  - −13.9 LUFS integrated; −1.6 dBTP true peak (4× oversampled); −1.95 dBFS sample peak.
  - During speech, the effects sit about 27 dB below the voice (RMS), and the beds about 30 dB below.
  - The bed's tones and LFOs are whole cycles over the film, so the audio loop is continuous (seam step 0.0006).
- **Captions.**
  - Generated from the same measured word times as the picture.
  - Two heights: low (y 1500) on the arm and head shots; high (y 380) over the chest, so they stay off the ribs and the
    carving.
  - Emphasis in yellow capitals: EAR, FOREARM, RIB CARTILAGE, MONTHS, HERE.
  - Captions are in screen space and never move with the camera.

## The quality gates

Each gate is answered from frames and measurements, not from real-time viewing.

**1. Is the phenomenon understood before the first sentence ends (2.96 s)?**
- **Yes, from frames.** Frame 1 is an unmistakable ear shape under arm skin, with hair and texture.
- By 1.0 s the wrist and hand show it is a forearm. By about 2.0 s the woman's head is in frame.
- Checked on 13 frames, 0–3 s, at 390 px wide (phone size): `qa/review/hook_first3s_phone390.jpg`.

**2. Is it as immediate as the benchmark openings?**
- Zombie Ant V4 opens on the bite in progress. This opens on the anomaly itself, with motion from frame 1 (the ear
  swelling, the pull-back starting).
- It is a still subject rather than an action, so the impact relies on the image's strangeness plus the low hit. I
  judge it comparable, not stronger.
- The cockroach and spider openings were not available to compare.

**3. Spatial continuity through the body?**
- **Yes.** One drawing of the patient and one camera. The cartilage and the flap are followed object-to-place on
  screen. The rib and microsurgery details are local, feathered layers in the same view, not cut-ins.

**4. Are the construction and transplant satisfying?**
- The carving reads in three distinct stages, with material removed, offcuts falling and shavings.
- It is **fast (about 1.2 s)**, set by the narration: "rib cartilage" to "tucked" is 1.3 s. See open issues.
- The transplant has the most screen time and reads clearly.

**5. Anatomy, hand, skin and ear-shape glitches?**
- **Hand:** five digits, the thumb on the radial side toward the head (correct for a raised left palm).
- **Elbow:** the bend reads correctly from the front, with the cubital crease.
- **Ear:**
  - the same geometry at every stage (framework, under the skin, flap, on the head);
  - a left ear with the tragus toward the face;
  - on the head, tilted back and narrowed for the three-quarter view.
- **Fixed during QA:**
  - a background gap between the jaw and the neck that drew a line under the ear;
  - a hard shading edge down the face;
  - a stray outline segment.
- **Residual:** see open issues.

**6. Does the ending return naturally to the opening?**
- **Yes.** "Her new ear was right HERE" is the move back to the forearm. The relief rises as the camera arrives, and
  the last frame matches frame one.

**7. Any narration with no visual progress?**
- None found on the per-second sheet (`qa/review/film_every_second.jpg`); every second has a new action or reveal.
- The quietest stretch is 17.3–18.6 s (the reveal hold with a slow push). It is intentional: the brief's "satisfying
  reveal".

## Factual basis

- **The case.** In 2018, surgeons at William Beaumont Army Medical Center (El Paso) reconstructed the ear of a soldier,
  Pvt. Shamika Burrage. She had lost her left ear in a 2016 car crash.
- **The procedure.** Rib cartilage was carved into an ear framework and placed under the skin of her forearm, where it
  developed a blood supply. It was then transferred to the head as a prelaminated forearm free flap, with new arteries,
  veins and a nerve connected.
- **Sources.** Contemporary news reports: ABC7 and CBS News, May 2018, found by web search. The CBS page itself could
  not be fetched from this environment (its host is not in the network allowlist), so the facts rest on the search
  results' summaries of those reports.
- **How the film handles the facts:**
  - **Historical, not new:** nothing in the picture says "new" or "future".
  - **Cartilage is not shown as vascular:** vessels form in the surrounding tissue, and the framework is drawn above
    them.
  - **No hearing claim:** the ear canal is kept on the injured side, and nothing implies the reconstructed external
    ear restores hearing.
  - **Anonymous patient:** an illustrative character, not a likeness of the real patient. The forearm used is not
    asserted to match the real case.
- **Stylisations:**
  - She keeps her arm raised in every stage (a "presenting" pose).
  - The months between stages are compressed.
  - Surgeons' hands are off-frame; only the instruments are shown.
  - The pedicle and the nerve coaptation are simplified to one artery, one vein and one nerve.

## Open issues (honest list)

1. **Runtime is 21.5 s, not 25–28 s.** This follows the natural read; see above.
2. **Carving is quick.** The three stages share about 1.2 s. They are legible on frame-steps, but it may feel rushed at
   speed. Lengthening it would need the narration to leave more room, or the carving to overlap "They tucked it"
   further.
3. **Offcuts are large, simple white shards.** They are physical, but plainer than the rest of the drawing.
4. **The rib see-through is a feathered ellipse.** It has no hard ring, so it should not read as a callout, but it is
   still an oval window.
5. **The crash memory is short (about 0.6 s).** The night tint, headlights and glass crack may read only as
   "something violent" at phone size, not specifically a car. The narration carries "crash".
6. **The final ear is small in the reveal framing** (about 1/9 of the frame height). It reads, but a closer hold would
   be more emphatic.
7. **The ear relief's cymba/crus bar is strong** in the forearm macro. It still reads as an ear at every size checked,
   but at full size a little more of the concha bowl would be more natural.
8. **Not watched or heard in real time.** Timing, levels and readability were checked from frames, measurements and
   ASR only.
9. **No Runway or generative video was used.** Everything is drawn deterministically (the brief prefers controlled
   animation).

ElevenLabs usage: one narration run, two takes, 905.9 credits in total.

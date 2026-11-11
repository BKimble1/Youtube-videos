# Cyborg Bug Factory: V3 report (differentiation and polish)

## Final file

`exports/FGW_Cyborg_Bug_Factory_V3_REVIEW_1080x1920.mp4` (26.9 MB). V1 and V2 are unchanged. The V3 source is
`source/src/v3/` (composition `CyborgBugFactoryV3`, mix `mix_v3`).

## The concept change

V3 is a story about **a machine that makes cyborg insects**. The workstation is the subject, and the insect is the
product. Steering appears only where the narration says it ("…make the bug turn", 12.6–14.7 s), as one console test
and one turn. The opening steering demonstration and the long insect-following shots from V2 are gone.

The look is an industrial machine-vision aesthetic:
- camera HUDs (ARM CAM, INSPECTION CAM, CELL CAM) with a true millimetre scale bar computed from the camera;
- an alignment mark on the implant point;
- a step bar for the cycle;
- a station console.

## The workstation, rebuilt from the paper

The workstation follows the paper's own description (Lin et al., *Nat Commun* 16:6073, 2025; quotes in
`research/SCIENCE_NOTES.md`).

- **One fixation platform on a motor-driven slider.** Rod A presses the anterior pronotum and rod B the mesothorax.
  Here rod B is drawn as low side-mounted pads so the camera keeps a clear view. Releasing the insect retracts the
  rods. The platform slides out and comes back with the next insect, one at a time. This replaces V2's multi-carrier
  conveyor, which the paper doesn't support.
- **A single backpack holder.** The paper says the backpack "was always placed on the backpack holder".
- **The arm cycle.** The arm images the insect from its initial position, takes the backpack by its grasping section
  (the fingers close on the tab), implants the electrodes at an angle, presses until the branches latch, lets go, and
  returns.
- **The arm itself.** Better articulated: a turret ring, shoulder, elbow, two wrist joints, the flange, a Hand-e-style
  gripper on rails, and the wrist depth camera.
- **Repetition.** Shown once, as dashed outlines labelled "ILLUSTRATION · ONE INSECT PER CYCLE, REPEATED" (1.35–2.0 s).
  The paper describes a prototype that fixes one insect at a time, so the illustration is marked as such.

## Changes by time

The draft timestamps in your brief were adapted to the measured narration (`production/V2_NARRATION_MAP.md`).

| Time (s) | V3 |
|---|---|
| 0.00–0.35 | Frame 0: an extreme macro. The gripper and arm tower over a tiny white module that is already descending onto a living, fixed insect. ARM CAM HUD with a 5 mm scale bar. |
| 0.35–0.75 | The camera marks the implant point. The module makes a visible fine alignment correction. |
| 0.75–1.30 | Electrodes in at an angle, press, latch at 1.0 s (a click with a small camera kick), the gripper lets go, the cyan LED comes on. A quick, smooth pull back. |
| 1.30–2.00 | The whole workstation: arm, holder, slider platform, rods. Plus the labelled repeat illustration. |
| 2.00–3.25 | INSPECTION CAM macro of the installed module, labelled ELECTRODES IN MEMBRANE, HOOKS ON METATHORAX, and CONTROLLER + RADIO. The battery plugs in. |
| 3.25–4.30 | The rods lift and the insect walks off. The camera stays on the machine, which resets. |
| 4.30–6.43 | "68 seconds": the next cycle, sped up, under a step bar (FIX · SCAN · GRASP · IMPLANT · LATCH · LET GO · RELEASE). The count reaches 68 at release. Footnote: "Fixing → release, measured in the study · by hand: ~15 min". The slider brings the next insect in, and the wrist camera's pronotum segmentation finds the implant point. |
| 6.43–8.60 | CELL CAM, close on the gripper. It takes the module from the holder on "grabs" (7.18) and carries it. |
| 8.60–10.40 | One continuous low three-quarter placement shot: the electrodes enter the membrane (the pronotum turns translucent locally), and the module latches on "back" (10.15). |
| 10.40–11.60 | INSPECTION CAM, extreme macro of the attachment points, labelled 4 MOUNTING BRANCHES and BIPOLAR ELECTRODES. |
| 11.55–13.00 | The station console's wireless test, briefly ("pulse → electrodes → a nudge to turn"). One pulse at 12.6. |
| 13.00–14.89 | The rods lift and the insect leaves the platform, turning, with the machine in the foreground. |
| 14.89–17.93 | **New comparison.** A miniature wheeled robot built part by part. The chassis, gear motors, wheels, caster, battery, controller and sensors fly in and seat, each with a click and a label. Then the wheel spins up. |
| 17.93 | **Match cut** from the spinning wheel to the insect's jointed legs mid-stride: "A LIVING INSECT · six jointed legs, already built". |
| 18.90–20.60 | Pull back to "ADDED: ONE 2.3 g BACKPACK". No performance figures. |
| 20.60–22.30 | **Rebuilt earthquake section.** A low wide view of two collapsed floor slabs forming a tight V crevice, with rebar, a column stump, a broken facade and restrained dust. The insect is tiny against the concrete. |
| 22.30–24.60 | Low behind the insect into the crevice, with loose rubble passing in the foreground. The walls tower over it. Tag: "MYANMAR EARTHQUAKE · 2025 · first field deployment · hand-built HTX/NTU units". The insect wears the field backpack with a camera module. No feed, detection or survivor is shown. |
| 24.75–25.50 | The route through the debris, from above. |
| 25.75–26.74 | Head-on down the canyon as the insect comes toward the lens. |
| 26.74–27.50 | **New factory ending.** A finished cyborg walks off the platform. |
| 27.50–29.00 | Pull back. The machine resets: the empty platform slides out and comes back with the next insect, and the arm takes the next module from the holder. |
| 29.00–30.25 | The module moves into position and the arm comes down. |
| 30.25–31.53 | Into frame 0's macro, with the HUD on. The last frame continues into frame 0: same module, tool, camera, lighting and motion. |

## Narration

**Preserved.** The narration is the approved master, sample for sample; its SHA-256 equals the hash in
`audio/narration/voice_provenance.json`. Timing and captions are unchanged.

ASR on the V3 MP4:
- **Zipformer** hears every word, with spelling variants only.
- **Whisper on the last 7 s** hears "…which means we're not just building robots anymore. We're turning bugs into
  them." On the whole file it drops that last line because of its 30 s window.

The narration did not block differentiation. One structural limit remains: the narration spends 10.6–14.7 s on pulses
and turning, so V3 has to show steering there. It does so in about 2 s of picture (one console test and one turn) and
keeps the machine in frame.

## Scientific verification

All sources were opened and read in this session. Quotes are in `research/SCIENCE_NOTES.md`.

| # | Item | Verified? | Source and definition |
|---|---|---|---|
| 1 | Automated process | Yes | Fixation on a motor-driven slider. The arm scans from its initial position, grasps the backpack from the holder, implants the electrodes, presses until the four branches latch, and disengages. The structure retracts to release the insect, and the next insect is positioned. (Paper) |
| 2 | Timing | Yes: **68 s**, not 42 s | "The entire automatic assembly, from initially fixing insect to finally releasing insect, spanned 68 s." Manual assembly took ~15 min (the paper's figure, citing earlier work). The 10 min of CO₂ anaesthesia beforehand is not included. The narration's "68 seconds" is correct. The "42-second" figure in your brief appears nowhere in the narration or the research. |
| 3 | Attachment mechanism | Yes | A white mounting structure with a grasping section, an alignment hole, mounting branches that hook the metathorax, a microcontroller with a Sub-1GHz radio, and bipolar electrodes. 2.3 g in total. The LiPo battery is plugged in after assembly. |
| 4 | Electrodes | Yes | Bipolar electrodes implanted in the intersegmental membrane between pronotum and mesothorax. This single site is used for both steering and slowing. |
| 5 | Steering | Yes: an influence, not full control | "Robust steering (over 70°) and deceleration (68.2% speed reduction)" in response to stimulation. The film says "a nudge to turn". |
| 6 | Experimental or production-ready | Experimental | NTU: "the assembly line is still in the prototype stage". The paper calls it a "scalable strategy". |
| 7 | Myanmar deployment | Yes: a real field deployment, not a test or proposal | NTU: 10 cyborg insects "deployed to Myanmar together with the SCDF … first-ever field deployment", with "the first-generation backpack mounted using the manual method". The Star: first used on 31 March 2025 and twice on 3 April in Naypyidaw; "fitted with infrared cameras and sensors"; "They have not found any survivors." |

**No material claim fails verification.** The video shows no survivor detection or live feed, and the tag says the
deployed units were hand-built.

## Technical QA

Measured from the file.

| Check | Result |
|---|---|
| Format | 1080×1920, 30 fps (the project standard), H.264 yuv420p, AAC 320 kb/s, 31.533 s (946 frames), no decode errors |
| Loudness | −14.5 LUFS integrated, −2.3 dB peak. The voice stays on top in every speech window; the closest is −3.9 dB, on the pause at 29.0 s. |
| Planned cuts | 14.89 s (to the build), 17.93 s (match cut), 20.6 s (to the rubble), 26.77 s (back to the workstation) |
| Other large frame changes | Three deliberate continuous camera moves, about 0.4 s each, with no jumps: the push into the inspection macro (2.4–2.8 s), the pull back for the walk-off (3.4–3.8 s), and the pull back to the console (11.7–12.0 s) |
| First two seconds | Inspected every frame (`qa/v3/first_2s_every_frame.png`): continuous descent, alignment, latch, LED, pull back, reveal |
| Phone size | `qa/v3/phone_size_beats.png`: subject, captions and labels readable |
| Static picture | The longest near-static run is 7 frames |

### Loop

**Passed.** `qa/v3/loop_seam_x5.mp4` plays the last 2 s then the first 2 s, five times. Each real end-to-start
junction measures 9.07, against a median of 8.84 for every frame step in that clip, i.e. an ordinary frame step during
the fast descent. The last six and first six frames (`qa/v3/loop_seam_last6_first6.png`) show the same module, tool,
camera, HUD and lighting; only the caption changes, because the narration restarts. The ambience is lab tone at both
ends, and the descent's servo sound runs across the seam.

## Comparison with the previous Cyborg Cockroach Short

The previous Short is not in this repository or any repository this session can reach; I checked during V1. **I can't
claim a verified side-by-side.**

Judged against the brief's description of that video (steering as the hook, insects followed around obstacles,
repeated pulse close-ups):
- V3's hook is a machine installing a module.
- Its middle is the machine's cycle.
- Its comparison is about manufacturing.
- Its ending is the machine starting the next cycle.

## Remaining issues

1. **Not watched in real time with sound.** This environment has no display or speakers.
2. **Fast camera moves.** The three continuous moves listed above are brisk; a viewer may want them softer.
3. **The arm dominates some frames.** The wrist and gripper fill the upper frame in the 0–1.3 s macro and the C1 gripper
   shots. That is intended ("enormous apparatus vs tiny module"), but heavy.
4. **The repeat illustration is small** (dashed outlines in the upper right of the wide shot, 1.35–2.0 s), though
   labelled.
5. **Time compression and stylisation.**
   - The time-lapse and the wake-up right after the latch are compressed; in reality, recovery from CO₂ takes minutes.
   - The battery plug-in is time-compressed.
   - Rod B is drawn as side pads.
   - The robot comparison is conceptual.
6. **The rubble is clean geometric concrete**, cinematic at phone size but not photo-detailed.

## Recommendation: **NOT READY**, pending one human viewing with sound

Your four tests:
- **A, Distinctiveness:** passes by design, but is unverified against the actual previous Short, which isn't available.
- **B, Hook:** passes. Frame 0 shows a machine already lowering a module onto a living insect.
- **C, Visual quality:** passes on frames; see items 2–4.
- **D, Scientific accuracy:** passes. Every concrete claim is verified, including 68 s (fix → release) and the real
  Myanmar deployment.

What remains is a real-time viewing, plus your call on items 2–3. If that viewing is clean, V3 can be marked READY
without changes.

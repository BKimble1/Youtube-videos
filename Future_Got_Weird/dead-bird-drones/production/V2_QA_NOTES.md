# Dead Bird Drones V2: QA notes

**Export:** `exports/FGW_Dead_Bird_Drones_V2_REVIEW_1080x1920.mp4`

- **Status:** a review cut, not published.
- **Narration:** the approved narration, unchanged. The claims review found no factual correction necessary.
- **Source:** composition `DeadBirdDronesV2`.
- **V1:** its export stays in `exports/`, and its source is in git history.

## What changed from V1 (the brief's priorities)

| Brief | V2 |
|---|---|
| First frame: close-up of the flying preserved bird, interior revealed by a clean cutaway | **Frame 0:** a side close-up at 26.5 px/cm with the flank cutaway already open (the gearbox, both rods and the hinge levers are inside the opening). The window was enlarged up over the shoulder so the rod-to-lever joint is never on the rim. The SCHEMATIC label is up from frame 0. |
| Within 1 s, the mechanism moves the wings | **0–1.2 s:** two full wingbeats with the crank pin, rods and levers in phase with the wing. "Motor" (0.35–0.95 s) highlights the motor and pinion. "Dead bird" (0.95–2.0 s) highlights the rod, lever and wing root. |
| Scene variety | **Compositions:** side close-up, low lateral wide over a fence line, three-quarter lab bench, exploded view, slow-motion macro of the drive, lateral meadow tracking shot, duck below-water cutaway, waterline split view, a move in on the preserved head, and the sunset flock. |
| Fast, smooth, spatially motivated transitions | **Pull-back and match cut:** a pull-back for "fly again", then a match cut into the lab at 3.95 s. **Cut on "gearbox":** replaces a third push-in, after which the flank irises open. **Background sweep:** on the downstroke, behind one continuous drone, from the lab to the meadow. **Push into the drone's cutaway**, then a match cut on "And" to the duck's cutaway. **Whip tilt up** from the pond, cut at its fastest point, into the sky. **Push into the callback cutaway**, landing on the frame-0 close-up. |
| Bird → duck match | The camera pushes into the meadow drone's open flank window. On "And" (15.94 s) it hard-cuts to the duck's below-water cutaway at the same screen place and similar width, then pulls back to reveal the mallard. It is a match of machine to machine; the two bodies never share a frame. |
| Development about every second | The longest near-static run is 14 frames (0.47 s), the held beat as the shell seats before the cut on "gearbox". The duck shot now moves: a tight hold on the mechanism, a pull-back, then a move in on the preserved head. |
| Loop | "Might already be dead" opens the callback cutaway and the camera pushes into exactly the frame-0 close-up. A background sweep on the downstroke swaps sunset for the field, so the final frames are the opening's own. |
| Coherent mechanics, consistent anatomy | **Gears:** flight-speed gears now keep their teeth (shorter blur exposure), so you can see them mesh. **Wing:** the edge-on wing profile is thicker, and the ghost of the near wing over the window is lighter, so the drive stays readable under it. |
| Claims not exaggerated | **Sound arcs removed:** the review found that the "less disturbance" arcs implied a measured quietness no source states. **Living birds:** the meadow's nearest birds now fly well beyond the drone, so the picture does not suggest the flock accepts it. |

## Checks on the delivered export

| Check | Result |
|---|---|
| Format | H.264 yuv420p BT.709, 1080×1920, 30 fps, 708 frames, 23.60 s, 21.2 MB. AAC 48 kHz stereo. |
| Loudness | −13.8 LUFS integrated, −1.6 dBTP. Voice is at −16.9 LUFS in the mix. Audio loop seam jump: 0.006. The motor texture is tapered at the seam because it now runs on both sides of it. |
| Narration | Both speech recognisers transcribe the export's own audio with **0 word errors** (`qa/v2/export_asr.json`). |
| Sync | Export audio against the voice stem: **0 ms**. |
| Frame continuity | No unplanned large frame changes (`qa/v2/render_qa.json`). Last frame against frame 0: difference 8.4, within the normal step range. |
| Evidence | `qa/v2/`: contact sheet every 0.5 s, the hook frame by frame, the loop seam, caption-free sheets, and 10 labelled strips (`strips/01`–`10`). |

## Independent review of V2 (two reviewers, every frame extracted)

Two independent reviewers checked the first V2 render, one for **hook, motion, transitions and loop** and one for **anatomy and science**.

**Confirmed passes**
- **Frame 0 and the hook:** the cutaway is open at frame 0, and the mechanism moves the wings within 1 s.
- **Variety and mechanics:** the scenes vary, and the mechanics are coherent. The crank pin, rods and levers stay in phase; the gears mesh; the duck's feet spread on the power stroke and fold on the return.
- **Bird → duck:** no morph between the two robots.
- **Loop and consistency:** the loop is clean. The head, plumage and proportions are the same in every shot, and the mechanism layout is the same in every cutaway.
- **Passive exterior and labels:** the exterior stays passive. SCHEMATIC is on screen whenever a mechanism is visible, and RESEARCH GOAL is on the meadow.

**Fixed after the review, then re-rendered and checked by me**
- **Captions over the wing:** the hook and the callback put captions on the raised wing, including frame 0. They are now framed so the wingtip stays under the caption band.
- **Repeated push-ins:** the same push into the cutaway happened three times. The lab one is now a cut on "gearbox".
- **Duck hold:** the duck shot held still for 2 s. It now has a tight hold, a pull-back, and a move in on "preserved duck".
- **Duck → sky wipe:** a ribbon wipe with no spatial reason. Replaced by a whip tilt.
- **Lab window:** it closed down to a gold dot. Fixed.
- **Sound arcs (science, must-fix):** removed.
- **Flight-speed gears:** they showed no teeth. Fixed.
- **Flock accepting the drone:** the living birds now stay well beyond it.

The fixed cut was not sent back to the reviewers. I checked it with stills, strips and the measurements above.

## Known limitations (for the owner)

**Visuals**
- **Edge-on wing:** the near wing still reads as a thin ghosted line for about one frame per beat.
- **Exploded view:**
  - The far wing appears to point forward (frames about 160–255).
  - The near wing's root overlaps the gearbox plate.
  - The spar slot on the lifted shell is still a dark slit.
- **Graphic transitions:** the two background sweeps (lab → meadow, and the loop) are graphic transitions, although the drone stays continuous through both.
- **Match cut shape:** the drone's tall oval window cuts to the duck's flat window, so the match is in position and width only, not shape.
- **Frame 0 fence post:** a blurred post corner enters at the lower right in the first frames.

**Accuracy notes for the description**
- **Species:** S3 says the 2025 flapping-wing prototype was built on a taxidermied mallard. The film draws a generic brown bird. The reviewer recommends a description line such as: "The 2025 flapping-wing prototype was built on a taxidermied mallard; the film draws a generic bird."
- **Reconstructed mechanisms:** the drive and the duck's paddle mechanism are schematic reconstructions (labelled SCHEMATIC). The sources name a custom gearbox, not its layout.
- **Close-up speed:** the close drive runs in slow motion.
- **"Motor":** inferred from "drone platform" plus "gearbox". No source extract uses the word.

**Not checked:** real-time audio listening was not possible here. The mix is checked by measurement and speech recognition only.

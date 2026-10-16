# QA report: Tesla Roadster Short and companion

## Short: FINAL v4 (owner's final editing pass, 16 Oct 2026)

`exports/FGW_Roadster_Short_FINAL_v4.mp4` is Git-ignored. Rebuild it with `bash tools/render_short_v4.sh`. The script,
timeline and changes are in `script/short_v4_final.md`. Exact source in/out times are in `footage/CLIP_LEDGER.md`
(FINAL v4 section). Upload captions: `captions/FGW_Roadster_Short_FINAL_v4.srt`.

| Check | Result |
|---|---|
| Format | 1080×1920, **30 fps** (unchanged), H.264 yuv420p, 934 frames = **31.13 s**; AAC 48 kHz stereo 320 kb/s; 15.6 MB |
| Loudness | **−14.1 LUFS integrated, −1.4 dBTP**, LRA 2.4 LU |
| Black frames / freezes | none (blackdetect 0.05 s; freezedetect 0.5 s). The first FINAL render had 0.73 s and 0.57 s low-motion holds at the edges of the suction diagram. They were fixed: the air starts moving on "fans", the car seats on "ramp", and the explainer cuts 0.12 s sooner |
| First 3 s | Inspected at 10 fps (`qa/evidence/short_final_v4_first2s_10fps.jpg`). 0.00–1.55: the real lift-off, continuous, the car rising on its jets with the ground and parked cars below. 1.55: the car under the ramp on "And hang upside down" |
| Speech clarity | Per-word level of the narration against everything else (effects and event sound), measured on a render without narration: **minimum margin 12.1 dB, median 31.4 dB** (`tools/speech_clarity.py`). The first FINAL mix fell to −2.7 dB under the Semi line and +3.3 dB on "0.81". The event audio is now ducked under speech and swells only in the gaps (touchdown, launch blast) |
| Intelligibility | A Scribe transcription of the **final mixed soundtrack** returned all 93 script words with the same timings as the clean narration, so the captions track the audio |
| Audio joins | Eight sharp transients in the final mix. All are consonant onsets or releases already present in the voice track, none at an edit join; no clipping (true peak −1.4 dBTP) |
| Safe areas | Captions at y 1290–1450 and x 110–930. Labels sit at the top. Checked at 360×640 with the Shorts UI zones overlaid (`qa/evidence/short_final_v4_phone_safe_areas.jpg`) |
| Claims | Fans: "Tesla says". 0.81 s: "Tesla's claimed best" and "by Tesla's own test", kept separate from "Shown run: 1.00 s" over the run whose stream timer reads 01.00. Rocket: "Tesla lists", "it says", "per Tesla's Roadster page". The diagram is labelled "SIMPLIFIED ILLUSTRATION" and drawn on a dark illustrated background, distinct from the footage |

### Not checked here (FINAL v4)

- **Listening.** This environment has no audio playback. The checks above are measurements and machine transcription,
  not a human listen.
- **Tesla's live Roadster page** doesn't resolve from this container. The Rocket wording rests on consistent press
  reports.
- **Content ID and rights.** These are only visible in YouTube Studio during upload.

## Earlier: review copy v3 (superseded by FINAL v4)

`exports/FGW_Roadster_Short_REVIEW_v3.mp4` is Git-ignored. Rebuild it with `TAG=v3 bash tools/render_short_v3.sh`.
The script, the timestamped shot list and the change list are in `script/short_v3_script.md`. Exact source in/out
times are in `footage/CLIP_LEDGER.md` (Short v3 section).

| Check | Result |
|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p, 1102 frames = **36.73 s**; AAC 48 kHz stereo 320 kb/s; 18.3 MB |
| Loudness | **−14.1 LUFS integrated, −1.5 dBTP**, LRA 2.7 LU |
| Black frames | none |
| Holds | freezedetect (0.5 s) flags only 8.7–9.2 s (diagram settling) and 10.87–11.43 s (the zoomed "thin gap" view). Both have slow drift and jostling air below the detector's threshold. The first render had 1.2 s static holds; these were fixed by adding a slow camera drift, a streaming outside-air field and pulsing pressure arrows |
| First 2 s | Inspected at 10 fps (`qa/evidence/short_v3_first2s_10fps.jpg`). 0.00–0.53: the white Roadster upright midair on two jets, the whole car in frame, bright. 0.53: the top view of the car on the ramp. 1.80: upside down. Narration starts at 0.08 s |
| Car silhouette | The suction diagram's car is hand-traced from `rec_224911` 0:38.50 (`research/trace/profile_trace.json`): white body, dark side skirt, dark canopy, wheel covers, red tail light. No fans, vents or nozzles are drawn. The gap is opened by 10 source px for legibility, under the one "SIMPLIFIED ILLUSTRATION" label |
| Diagrams | Suction: air leaves the gap, the camera pushes in on "THIN GAP" and then "LOW PRESSURE", and pulls back to "NORMAL AIR PRESSURE" and "PRESSES IT INTO THE RAMP". Airborne: real flip at half speed, with vectors only on visible plumes ("GAS JETS", "ROLL" with an opposite pair, "HOLD STEADY") |
| 0.81 graphic | Over the live run (`rec_225340`, which has no timer overlay): counts 0.00 → 0.81 on the spoken number, then "TESLA'S CLAIM · ITS OWN TEST" and "live run · the stream's timed clip read 1.00 s" |
| Captions and safe areas | Phrase captions at y 1290–1450 and x 110–930. They clear the bottom title zone (y > 1580) and the right-hand button rail (x > 930). Checked at 360×640 with the zones overlaid (`qa/evidence/short_v3_phone_safe_areas.jpg`). Upload SRT: `captions/FGW_Roadster_Short_v3.srt` |
| Ending and loop | The last frame is `rec_224911` 0:38.08 (rolling upright). Frame 0 is 0:38.30, on the other side of the broadcast's own camera cut, so the loop plays as an ordinary cut (`qa/evidence/short_v3_loop_seam.jpg`). The demo audio also continues across it |
| Real event sound | Hop lift-off and touchdown (s09), the live run's launch blast (s10), and jet hiss under the loop shots. **The ramp recording `rec_224730` is silent**, so the ramp launch and landing carry designed effects only |
| Footage share | 28.9 of 36.7 s is real footage (79%). 13.8 s of it carries overlays. The suction diagram (7.8 s) is the one fully animated stretch |
| Wording check | An independent Scribe transcription of the edited narration (uploaded as audio, not aligned to the prompt) matched the script word for word |

### Not checked here (v3)

- **Listening.** There is no audio playback here: the voice, the event audio levels and the effects all need one listen.
- **Tesla's live Roadster page** doesn't resolve from this container. The Rocket wording and the trim names rest on
  consistent press reports (claim ledger, "Short v3 recheck").
- **Rights and Content ID.** These are only visible in YouTube Studio during upload.

## Earlier: review copy v2 (superseded by v3)

`exports/FGW_Roadster_Short_REVIEW_v2.mp4` is Git-ignored. It was delivered to the owner in the session and can be
regenerated with `TAG=v2 bash tools/render_short.sh`.

| Check | Result |
|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p, 1263 frames = **42.10 s**; AAC 48 kHz stereo 320 kb/s; 16.6 MB |
| Loudness | **−14.0 LUFS integrated, true peak −1.4 dBFS** (two-pass loudnorm) |
| Black frames | none (blackdetect, 0.05 s, pix_th 0.05) |
| Holds | freezedetect flags 0.6–0.8 s settled holds only inside the animated cards (diagram and card end states). No footage freezes |
| Footage | All six slots come from the owner's recordings (`footage/CLIP_LEDGER.md`: exact source in/out per shot). Every footage shot was inspected at 2 fps (`qa/evidence/short_v2_render_sheet_2fps.jpg`) and against 9:16 crop previews (`qa/evidence/crop_r1.jpg`) |
| Hook | Frame 0: the Roadster midair on its jets beside the ramp, large in frame, with the chip "Tesla demo · Oct 15, 2026". Narration starts at 0.04 s |
| Loop | The last frame (rec 2:08.217) runs into frame 0 (2:08.25). The mean pixel difference across the seam is 4.9, against 3.9 for an ordinary frame step; the remainder is the caption change. The closing shot has no push-in, so there is no zoom jump (`qa/evidence/loop_seam.jpg` shows v1, before that fix) |
| Captions | Burned in, 2–3 words, synced to word times. Upload SRT: `captions/FGW_Roadster_Short.srt` |
| Demo audio | Only the hop clip (`rec_224911`) has sound, mixed at about −17 dB under the voice. `rec_224730` has a silent audio track, so the ramp shots carry only narration and our effects. **Not listened to**: if the stream audio under the hop is music or commentary, mute slot F6 (`audio: 0` in footage.json) |

### What the footage changed (claim ledger, "Checked against the supplied footage")

1. **Five vehicles (C7).** The hop clears the Semi and a row of Teslas, but five distinct vehicles can't be counted.
   The Short now uses the pickup line "It even cleared a row of Teslas — a Semi included."
2. **0–60 (C8).** The stream's stopwatch stops at **01.00**, and Tesla's card reads "0-60mph 1 sec". No 0.81 appears in
   the recordings. The narration still says "0.81 seconds? Tesla's own test". The card now reads "TESLA'S FIGURE" and
   notes "the stream's own timer read 1.00 s". **Owner decision:** keep this, or re-voice the line (suggestion in
   `script/short_script.md`).
3. **"So yes, the demo flew"** now shows the aerial angle of the same landing instead of repeating the side angle.

### Not checked here

- **Listening.** No audio playback is available in this environment. The narration (Test Voice
  `kk5XaSLo2XAw0sKM98zU`), the spliced pickup at 17.6 s, and the demo audio under the hop all need one listen.
- **Rights and Content ID.** Tesla's footage reached us as screen recordings from the owner. Fair use is case-specific,
  and Content ID only appears in YouTube Studio during upload.
- **Tesla's live Roadster page.** Its wording (Rocket "not approved for public road use", trim names) is still only
  confirmed through search snapshots.

## Companion: FINAL 4K (16 Oct 2026)

`exports/FGW_Roadster_Companion_FINAL_4K.mp4` is Git-ignored. Rebuild it with `bash tools/cut_c3_clips.sh` and
`bash tools/render_companion_final_4k.sh`. This is the owner's limited cleanup pass on REVIEW_v3: the opening grade
and crop, "Tesla-claimed time" for 0.81 s, and the ending on Tesla's aerial landing shot (see
`script/companion_v3_script.md`, "Final cut"). All checks were run on the exported file.

| Check | Result |
|---|---|
| Format | 3840×2160 (16:9), 30 fps, H.264 High, yuv420p, BT.709, 4,950 frames = **2:45.0**; AAC-LC 48 kHz stereo, about 290 kb/s; about 135 MB. Rendered natively at 4K from the project (vector art and text drawn at 4K; the recordings scaled to 4K once, with Lanczos, from the original screen recordings) |
| Loudness | **−15.0 LUFS integrated**, LRA 3.3 LU, true peak **−1.5 dBFS**. The mix was rendered losslessly and encoded to AAC once |
| Black frames | Only the last 0.17 s, the end of the intended 0.6 s fade to black |
| Holds (≥1.2 s, freezedetect −55 dB) | Three, all under narration and unchanged from REVIEW_v3: the lit PUBLIC ROAD sign (2.1 s at 2:08.4), the clerk at the sign (1.3 s at 2:21.0) and the drawn landing (1.6 s at 2:31.6). There is no static hold at the end |
| Opening at phone size | At 320 px wide, the car, its four jets, the parked Teslas and the Semi read from the first frame. The car body went from about 35–45% to 50–60% brightness; black stays black and no light clips more than in the source |
| 0.81 s wording | The plate reads "Tesla says · 0.81 s · Tesla-claimed time · not independently timed". The narration says "Tesla claimed zero point eight one seconds" (same take, "For a live run," removed) |
| Intelligibility | An independent Scribe transcription of the **exported soundtrack** returned all 461 words in order, with no substitutions or omissions, including "Tesla claimed zero point eight one seconds" and the final "leap". Word starts match the captions (median 0.00 s, maximum 0.04 s). Words: `audio/companion_v3/scribe/final_4k_words.json` |
| Speech clarity | Per-word margin over everything else: median 21.5 dB, 10th percentile 14.9 dB. 4 of 461 words are under 10 dB full-band: "up" 0:39.6 (a timing artefact, see v3), "the" 1:39.8, "launch," 1:40.6, and "leap" 2:42.35 (5.9 dB full-band because of the touchdown's sub-bass; **14.0 dB in the 300–4,000 Hz speech band**) |
| Ending | The ending dissolves into the footage at 2:37.3 (0.25 s). The car rolls upright on its jets, fires them down, and touches down in smoke on "leap" (2:42.35). The camera drops in behind it. The music resolves and the picture and sound fade out together: the level falls from −23 dB at 2:42.8 to −59 dB at 2:44.75 and digital silence at the last sample, with no cut-off |
| Effects balance | The ending's effects (jets, ground blast, touchdown, smoke) sit at the same level as the rest of the bed (about −36 dB RMS under a −19 dB voice). The touchdown accent after the last word reaches −28.7 dB RMS |
| Transitions | Opening cut on the inverted profile at 0:02.45 and the traced-outline match, unchanged. The 0.81 s plate appears as the narration names it, after the cut back from the stream's run at 1:49.0. Drawing to footage at 2:37.3, a straight dissolve on the sentence break |

Not checked here: a human listen (this environment has no audio playback; the checks above are measurements and an
independent transcription), and Content ID and rights (visible only in YouTube Studio).

## Earlier: companion review copy v3 (16 Oct 2026)

`exports/FGW_Roadster_Companion_REVIEW_v3.mp4` is Git-ignored. Rebuild it with `bash tools/cut_c3_clips.sh` and
`bash tools/render_companion_v3.sh` (composition `Companion3`); QA with `bash tools/qa_c3.sh <mp4> qa/c3/final`.
Script, timeline, sources, change log and open questions: `script/companion_v3_script.md`. Shots:
`footage/CLIP_LEDGER.md` ("Companion v3"). Captions: `captions/FGW_Roadster_Companion_REVIEW_v3.srt` (60 cues, ≤42
characters per line).

| Check | Result |
|---|---|
| Format | 1920×1080, 30 fps, H.264, 4,995 frames = **2:46.5** (container 166.6 s); AAC 48 kHz stereo 320 kb/s; about 41 MB. A 4K master (`exports/FGW_Roadster_Companion_REVIEW_v3_4K.mp4`, 3840×2160) is the same composition redrawn at twice the resolution by `tools/render_companion_v3_4k.sh`, with the 1080p soundtrack copied in unchanged. Checked: 4,995 frames, 166.6 s, about 80 MB, −15.0 LUFS, −1.5 dBFS true peak, no black frames; spot frames match the 1080p layout |
| Loudness | **−15.0 LUFS integrated**, LRA 3.3 LU, true peak **−1.5 dBFS** after AAC (two-pass loudnorm to −15 / −1.5 dBTP) |
| Length and pace | 465 spoken words in 2:42.6 of narration; per block 182–198 wpm (opening 167, versions 182 after a 1.08× pitch-kept speed-up, ending 174) |
| Narration words | Each chosen take's actual audio was stored as a plain asset and transcribed by Scribe. All nine match the script; the only differences are spellings ("Gs", "'70s", "off center") |
| Intelligibility | An independent Scribe transcription of the **final mixed soundtrack** (music, effects and the stream's own sound included) returned all 465 words of the script in order, with no substitutions or omissions. Its word starts match the caption timing (median offset 0.00 s, maximum 0.06 s). Words: `audio/companion_v3/scribe/final_mix_words.json` |
| Speech clarity | Each word's narration level against everything else (score, effects, the stream's own sound), measured on a render without narration: **median 21.8 dB, 10th percentile 15.0 dB; 3 of 465 words under 10 dB.** Lowest: "up" at 0:39.6 (4.9 dB; the 80 ms window lands in the word's stop closure, the narration there is −36 dB against a −41 dB bed, and the word is heard clearly in the final-mix transcription), "the" at 1:39.8 (7.8 dB) and "launch," at 1:40.6 (9.9 dB, under the start-light beeps; the launch blast now fires 0.04 s after the word ends). The previous render had a minimum of 3.2 dB and 8 words under 10 dB |
| Black frames | **None** (blackdetect ≥0.1 s). The first render flagged 0.13 s at 0:00.67: Tesla's dark night replay around a small car. The hop now plays at a 1.2× crop toward the car |
| Low-motion holds | freezedetect (≥0.6 s at −55 dB) on the first render found long holds: the floor-gap explanation (9 s), the hang (10.5 s), the launch prep, the limits and the ending. They were fixed with motion that follows the action, not cuts or zoom tricks: a slow drift in on the gap while it thins; a gentle move in on the hang while the push grows, then a look ahead to the end of the ramp; the car creeping to the line; a belt that keeps crawling under each station with the arm riding along; a drift in on the dial; rings on the two systems; and the air dial returning on the open questions. On the final render, the only holds longer than 1.2 s are the lit PUBLIC ROAD sign (2.1 s at 2:08.4, under narration), the clerk waving at that sign (1.4 s at 2:20.9), the checker beside the landed car (1.6 s at 2:31.6) and the end-screen ring-out from 2:44.6 |
| Opening at phone size | `qa/evidence/companion_v3_phone_opening_0-3s.jpg` (6 fps at 320 px wide). The car is readable from the first frame (side profile on four jets, parked Teslas and the Semi below). It rolls inverted, and the cut lands on the hang's inverted profile at 0:02.45 |
| Match | `qa/evidence/companion_v3_match_2.2-5.0s.jpg`. The drawn outline traces the real car (same position, nose-left, about 10° slope) before a 0.23 s dissolve; the drawn ramp edge sits on the real one within a few pixels |
| Physics, frame by frame | Strips in `qa/evidence/companion_v3_*.jpg`. Checks: <br>• Weight is always straight down from the centre of mass. <br>• The net pressure push is attached to the car and always points into the local surface (floor, wall, ceiling); it never rides into free flight (it shrinks to nothing as the gap refills, before the car separates). <br>• Gas-out (blue) and push (saffron) are opposite and start at the same nozzle. <br>• The rear-view couple turns the car clockwise, matching its arrows; the opposite pair stops it upright. <br>• The downward pair is shown shorter than the weight (no hover), and the car lands |
| Car consistency | One traced Roadster throughout (side), plus the rear view drawn from the stage footage at matched scale. Panels hinge from fixed lines; wheels, glass and nozzles stay attached through every rotation; tyres flatten slightly and the body settles on every landing |
| Text at phone size | `qa/evidence/companion_v3_phone_640x360_every3s.jpg`. The labels that remain are "air tank", "valve", "air supply", "2×", the version signs, "flight", "PUBLIC ROAD" and the Shown/Tesla says pair; all read at 640×360. The secondary qualifiers under the 1.00 s / 0.81 s figures were raised to 36 px |
| End screen | The right half of the frame stays clear from 2:40.5 to the end (car and checker at the left); the music rings out without a cut |

### Not checked here (companion v3)

- **Listening.** This environment has no audio playback. Effects, music balance and voice tone were checked by
  measurement only (speech margins, loudness, peaks), not by ear.
- **Tesla's live Roadster page** (see `script/companion_v3_script.md`, "Unresolved source questions").
- **Content ID and rights.** These are only visible in YouTube Studio.

## Earlier: companion review copy v2 (16 Oct 2026, superseded by v3)

`exports/FGW_Roadster_Companion_REVIEW_v2.mp4` is Git-ignored. Rebuild it with `bash tools/cut_c2_clips.sh` and
`bash tools/render_companion_v2.sh` (composition `Companion2`). Script, timeline, sources for each line, Crew roles,
changes and open issues are in `script/companion_v2_script.md`. Shot spans are in `footage/CLIP_LEDGER.md`
("Companion v2"). Captions: `captions/FGW_Roadster_Companion_REVIEW_v2.srt`. The QA script is `tools/qa_c2.sh`.

| Check | Result |
|---|---|
| Format | 1920×1080, 30 fps, H.264 yuv420p, 6,015 frames = **3:20.5** (container 200.6 s); AAC 48 kHz stereo 320 kb/s; about 85 MB |
| Loudness | **−15.0 LUFS integrated, −1.5 dBTP**, LRA 3.1 LU (two-pass loudnorm) |
| Black frames / freezes | **None** (blackdetect ≥0.1 s; freezedetect ≥0.6 s at −55 dB). The first render had a 0.2 s near-black start on the hop (the front camera's dark approach, now skipped) and eight low-motion holds (the stopped fan car, the floating analogy before each throw, the diagram while the fall slows). These were fixed with a slow push toward the fan car, pulsing suction arrows, a zero-g sway, faster stars, and clouds rising past the falling car |
| Speech clarity | Each word's narration level against everything else (score, effects, event sound), measured on a render without narration: **median 24.9 dB, 10th percentile 18.1 dB; 3 of 597 words under 10 dB**. The lowest is a quiet trailing "it," at 0:36.9 (4.6 dB). The first mix had a median of 11.2 dB and a minimum of −9.9 dB. The score now sits about 7.5 dB lower overall and ducks a further 15 dB under every word; effects duck 6 dB under words |
| Intelligibility | An independent Scribe transcription of the **final mixed soundtrack** returned the script word for word. The only differences are number formatting ("10", "1970s", "0.81", "2028"). Its word starts match the caption timing (median offset 0.00 s, maximum 0.05 s) |
| Rotations | Checked frame by frame (`qa/evidence/companion_v2_roll_diagram_104-110s.jpg`, `…_leaving_ramp_76-81s.jpg`, `…_zero_g_tumble_96-99s.jpg`). The car is one rigid drawing in every rotation, with wheels, glass and lights attached. The roll's off-centre pair pushes up on one side and down on the other (turning); the opposite pair decelerates it to upright; both firing down are labelled "no turning" |
| Opening match | `qa/evidence/companion_v2_match_12.55-13.45s.jpg`: the real car under the ramp dissolves into the illustrated car at the same nose-left, upside-down orientation and about the same size and slope |
| Roadster consistency | The side profile is traced from `rec_224911` 0:38.5 and the rear view is drawn from `rec_225050` 0:17.0. The two views are scaled to each other and compared on `qa/reference/roadster_board.jpg`. No box cars, no old red Roadster |
| Diagram physics | Weight is always straight down. The pressure push always points into the surface (floor, wall, ceiling). Low pressure is drawn as weaker push from the gap side, never as a pull, and the gap keeps some air. Gas (blue) and push on the car (saffron) are opposite everywhere, with a key on screen. On real footage, arrows sit only on visible plumes; no rotation direction is drawn over the footage |
| Crew anatomy | Feet on the ground in every standing shot (or behind the barrier); hands on the mat, broom, stopwatch and ball through IK; eyes and layering checked in the strips. The end beat originally had clerkC's pointing arm crossing the checker's face for 0.8 s; the two were swapped so it no longer crosses (`qa/evidence/companion_v2_end_crew_197-200s.jpg`) |
| Text | Labels raised to 36–52 px after a phone-size check (`qa/evidence/companion_v2_phone_640x360_every4s.jpg`, one frame every 4 s at 640×360). No label sits on the car, its path, or the vehicles it clears in the stunt. The evidence tag at the top left changes with the material (footage / illustration / claim / analogy / not shown) |
| Audio joins | Phrase joins use 10 ms fades inside pauses; pause cuts use 12 ms crossfades. True peak −1.5 dBTP, no clipping |

### Not checked here (companion v2)

- **Listening.** This environment has no audio playback. The checks above are measurements and machine transcription,
  not a human listen.
- **Tesla's live Roadster page** doesn't resolve from this container. The trims, Rocket's road-use wording and
  "flight on Rocket only" rest on consistent press reports and search snapshots (`research/companion_v2_source_notes.md`).
- **Content ID and rights.** These are only visible in YouTube Studio during upload.

Review copy v1 (`exports/FGW_Roadster_Companion_REVIEW_v1.mp4`, 3:34, composition `Companion`) is superseded. It used
the rejected box-car diagrams.

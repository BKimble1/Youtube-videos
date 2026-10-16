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

## Companion

Review copy v1 was rendered (`exports/FGW_Roadster_Companion_REVIEW_v1.mp4`, 3:34) but is **on hold**. It still uses
the box-car suction and thruster diagrams the owner rejected for the Short. Those panels are to be rebuilt with the v3
traced Roadster and the real-footage vectors before anyone reviews it.

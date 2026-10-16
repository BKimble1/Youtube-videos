# QA report: Tesla Roadster Short and companion (16 Oct 2026, ~03:45 UTC)

## Short: review copy v2, with real footage (not yet approved as final)

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

See the companion section below once its review render is inspected.

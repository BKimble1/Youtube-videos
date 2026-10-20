# Handoff — The Telepathy Flaw V2

**Delivered (not published, no PR):**
- `exports/FGW_TelepathyFlaw_DeathClockStyle_V2_REVIEW_1080x1920.mp4` — 1080×1920, 30 fps, **28.000 s (840 frames)**, H.264 + AAC 320 kb/s, 21.2 MB
- `exports/FGW_TelepathyFlaw_DeathClockStyle_V2_2160x3840.mp4` — native 2160×3840 render of the same composition (not an upscale), 50.5 MB
- `captions/FGW_TelepathyFlaw_V2.srt` — 27 cues; the narration is not retimed, so the cue times equal R1's; the last cue ends 27.84 s
- `audio/v2/` — narration, music and effects stems (int24, sum exactly to the mix) and the mix (−16.0 LUFS, −1.2 dBTP); `audio/v2/cues.json` is the 68-cue sheet
- `source/src/v2/` — editable source; `V2_CHANGES.md` has the shot table and the R1→V2 change log; R1 files are untouched

**Voice:** unchanged. Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, `[interested]` only, take C1 (generation `KSIjaftv2hgtDOjMINqr`, flow `C7YtngsgBvJsYtNKWBXa`). Confirmed against the files, not from memory: `narration_words_final.json` records those ids; the V2 narration stem equals the take times a constant gain (residual −58 dB). Nothing was stretched, pitched or re-generated; speech runs 0.08–27.39 s; 0.61 s follows the last word.

**What changed (short):** a dedicated profile drawing of the sender with one implant seated at the crown and a clean crown window above and behind the eyes; one continuous column drawing (window → implant macro → threads → cortex → decoder) used at three scales; a throat lens that opens and closes on its own clock; the purple cloud is gone — a red impulse enters the same thread, the threads wobble, a 0.27 s dark bust interrupts, one red packet; UNFILTERED THOUGHT DETECTED once for 1.15 s to one side; an "undo send" chip established early and spent for the dark message; blue and red messages through the same decoder gates; compact AR card, arrival → recognition → recoil for the receiver; a 28 s film that returns into frame 0 from the implant lens.

**Checks performed** (measurement or decoded stills; see `qa/v2/QA_NOTES.md`): contact sheets, full-size stills, cut bursts, motion scan, caption/UI collision scan, seam (frame 839 vs 0 mean abs diff 0.79; picture step 0.41; audio step 0.03 vs 0.29), loudness/true peak/clipping, narration identity, 4K vs 1080 agreement on 7 sampled frames (mean abs diff 0.4–0.6).

**Not possible / not done:** I did not watch the film in real time or listen to it. No headphone or phone-speaker check, no three-repeat playback (the x3 test file is produced locally and git-ignored), no platform preview, the Shorts interface overlay is an estimate. Voice cadence and emotional delivery are untested by ear.

**Known small items:** the sender's eyes sit under the caption lane for one frame at 6.0 s and two frames at 27.6 s during zooms; the cancel chip touches the lane for two frames at 27.07 s; the "Motor cortex" tag is the one optional label and can be removed if the picture reads without it.

**The single unresolved narration claim (creator notes only):** "Humans have thousands of dark, unwanted thoughts every single day" has no source I could verify. It is kept verbatim as locked. A suggested replacement, for creator approval only: "People can have disturbing, unwanted thoughts that they never intend to act on." The line "the chip can't tell the difference" is about this fictional device only; the on-screen cue (0.1–2.9 s) and the upload description say it is a fictional future scenario.

# QA report: Tesla Roadster Short (16 Oct 2026, ~03:00 UTC)

## Status: NOT FINAL. Blocked on the official Tesla footage

The only render is a **review copy** that marks every footage slot "PLACEHOLDER · NOT FOR UPLOAD". That copy is
`exports/FGW_Roadster_Short_REVIEW_PLACEHOLDERS.mp4`; it's Git-ignored and is not a deliverable. The final Short needs
six clips from Tesla's replay (https://x.com/Tesla/status/2110788059008819215). This environment can't reach that
replay: x.com, video.twimg.com, tesla.com and YouTube all return 403 from the network policy. `footage/CUT_SHEET.md`
says exactly what to provide and where to look in the replay. `tools/render_short.sh` refuses to render FINAL until
all six slots pass `tools/check_footage.py`.

## What is finished and checked

| Item | Result |
|---|---|
| Facts | `research/claim_ledger.md`: 19 claims, 5 corrections to the brief. Checked via web-search summaries; the primary pages are blocked here |
| Narration | Test Voice `kk5XaSLo2XAw0sKM98zU` confirmed in the workspace. Hook tested first (4 takes, 2.3–2.4 s). Take 4 of 4 used: 41.72 s, 111 words, −18.2 LUFS raw, true peak −1.2 dBFS |
| Script check | Scribe returned a **forced alignment to the script**, not a free transcription, so it confirms timing, not wording. **Nobody has listened** (no audio playback here) |
| Timing | Shot list cut to the word times. Captions follow each word. The 0.81 stopwatch finishes on "0.81". The Rocket stamp lands on "approved". "TESLA'S OWN TEST" lands on "Tesla's" |
| Review render | 1080×1920, 30 fps, H.264 yuv420p, 1263 frames (42.10 s), AAC 48 kHz stereo 320 kb/s. **−14.0 LUFS, LRA 2.1, true peak −1.5 dBFS.** No black frames (blackdetect 0.05 s). Contact sheet at 2 fps: `qa/short_r2/render_sheet.png` |
| Animation | Suction and thruster diagrams, trim cards, 0–60 and 2028 cards inspected frame by frame (`qa/short_r1/sheet.png`). Fixed in that pass: a title/ROLL label collision, faint jets, a duplicated mph label, and the stamp hiding the ROCKET name |
| Footage path | Synthetic 16:9 clip through the real component (`qa/pipeline_test/sheet.png`): fill crop, source chip, captions over footage, demo audio mixed under the voice (−24.8 dB in its band) |
| Ingest + loop | Synthetic timecoded replay through `tools/ingest_footage.py` (`qa/ingest_test_sheet.png`). Every shot starts on its in-frame (0:10.0, 0:20.0, 0:25.0, 0:26.4 for the +1.4 s reuse). The last frame shows 0:09.97, which runs straight into frame 0 at 0:10.0, so the loop is seamless. The test clips were removed and the manifest was restored |

## Still to do before upload

1. **Footage** (owner). Supply the replay or six clips per `footage/CUT_SHEET.md`. Then: ingest → inspect frame
   sheets → set crops → FINAL render → full inspection of the actual render.
2. **Five vehicles.** Confirm that all five are visible in F6. If not, use the fallback pickup line.
3. **Listen once.** Check the narration for mispronunciations ("Roadster", "0.81", "2028"). These can't be checked here.
4. **Tesla page wording.** Recheck the live Tesla Roadster page for "not approved for public road use" and the trim
   names.
5. **Rights.** Using Tesla's footage is the owner's call (commentary or analysis, short excerpts). Content ID is only
   visible in YouTube Studio during upload.

## Known limits of the animation

- The car in the diagrams is a deliberately generic front cross-section, not the Roadster's shape. We haven't seen the
  revealed design, and the brief forbids drawing a nonexistent Roadster. Each diagram carries an
  `ILLUSTRATION · not Tesla's actual layout` chip.
- The fan position, nozzle positions and tank are explanatory. Tesla hasn't published the layout, and the reported
  thruster counts and tank figures conflict (C6), so none are shown.
- There is no music bed. The effects are procedural (`tools/make_sfx_short.py`) and peak at −20 dBFS before the mix.
  The demo's own sound will come in with the footage.

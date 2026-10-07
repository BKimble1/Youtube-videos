# Progress: Video 01, pass 2

Status: **rendered, inspected, packaged.** The 1080p master, preview, subtitles, thumbnails, upload copy, ledger,
manifest, stems, backups and documentation are in place. Nobody has watched or listened to the film; see
`qa/QA_REPORT.md` for what was checked instead and what remains for a human.

## What pass 2 did, in order

1. **Audit and brief.** Read the pass-1 audit and the project brief; wrote the channel brief, style guide and
   reference notes (`../CHANNEL_BRIEF.md`, `../STYLE_GUIDE.md`, `../REFERENCE_NOTES.md`). Preserved all pass-1 work
   untouched in `AI_Confidence_Video_01/` and on its branch.
2. **Script.** Rewrote the narration to 694 words in 36 segments: hook by 0:12, title at 0:30, mechanism from 0:44,
   quiz at 2:23, no IMO detour, four dry jokes, the two-question habit at the end. Kept every factual guard rail from
   the pass-1 ledger (`research/sources.md`).
3. **Narration.** Ten Eleven v4 blocks, four takes each, through the ElevenLabs connector (voice "Marcus K"); Scribe
   forced alignment on each pinned take; takes measured and selected; segments cut at pauses; measured timeline 4:40.8.
4. **Illustration system.** Original cutout cast (eight characters, one rig), prop library, five sets, a parallax
   camera, paper wipes, tape-pinned evidence with drawing highlight boxes. Checked by contact sheet, scene by scene.
5. **Sound.** Original score (108 BPM, pizzicato, marimba, clarinet, brass) rendered with FluidSynth; six new
   ElevenLabs sound effects plus six reused; 193 cues placed at the frames props move; mix at −16.0 LUFS, −1.3 dBTP.
6. **Render and QA.** Three full 1080p renders. The first found five layout faults and one 5.2 s static hold,
   the second one cosmetic fault (`qa/CORRECTIONS.md`); all fixed before the third, whose detectors are clean. Determinism confirmed by rendering three frames twice in
   separate processes (byte-identical).
7. **Packaging.** SRT, chapters, three thumbnails, title options, paste-ready description, claim ledger, asset
   manifest, rebuild README, split-part backups with checksums.

## Numbers

| | |
|---|---|
| Runtime | 4:40.8 (8,425 frames at 30 fps) |
| Words | 694 (148 words per minute overall) |
| Narration takes generated / used | 40 / 10 |
| Sound effects generated this pass / used | 24 candidates, 12 downloaded / 6 new + 6 from pass 1 |
| SFX cue placements | 193 |
| Scenes / cue words used by scene code | 10 / 141 |
| Mix | −16.0 LUFS integrated, −1.3 dBTP, LRA 3.5 LU |
| Master | H.264 High, CRF 16, BT.709, AAC 320 kb/s, fast start, 46 MB |

## Not done, and why

- **Watching and listening.** Not possible from the production session. The watch-through checklist is in
  `DELIVERABLES.md`.
- **Blind transcription of the final narration.** Pass 1 did this with Scribe; pass 2 used forced alignment only
  (zero credits). A mispronunciation that alignment cannot detect needs a human ear.
- **Reference videos.** YouTube and the reference sites were blocked; the style was built from the audit's written
  principles, not from watching references (`../REFERENCE_NOTES.md`).
- **arXiv re-check.** Whether a newer version of the paper exists could not be checked (host blocked).

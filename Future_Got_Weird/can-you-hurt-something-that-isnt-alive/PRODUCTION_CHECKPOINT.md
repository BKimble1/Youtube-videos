# Production checkpoint: Can You Hurt Something That Isn't Alive?

Checkpoint date: 10 October 2026. For the next Haiku session to resume without rereading the history.
Status: **narration and script done; animation, sound mix, captions, renders, and QA not started.**
Do not publish. Publishing is the owner's step.

## Locked inputs

| Item | Source | Notes |
|---|---|---|
| Brief | `production/brief/Future_Got_Weird_Project_Brief.md` | From recovery packet (sha256 prefix 42d49d5b6e76e451). Video 01 runtime rules do not apply to this episode. |
| Recovery packet | `production/brief/START_HERE_Claude_Continuation.md`, `MANIFEST.json`, `PROVENANCE.md` | Uploaded zip `3a4d7024-Future_Got_Weird_Production_Recovery.zip` |
| Thumbnail | `production/thumbnail/JUST_CODE_thumbnail.png` (1672×941) | Unchanged. Metaphor only. |
| Cast reference | `production/approved_cast/cast_rig_check.png` | Gray-haired checker/researcher, teal-visor clerkA, others. |
| Style frames | `production/approved_cast/style_frame_*.png` | Accepted Video 01 frames. |
| Native rig excerpt | `production/reference/repository_reference/` | Text copies from Video_01_V2/source. Not a runnable project. |
| Reference kit | `origin/claude/new-session-h21vtg` `Future_Got_Weird/Video_02/source/` | Commit `70bf7f9`. Full Remotion 4.0.533 kit: `KIT_API.md`, `package.json`, `package-lock.json`, `remotion.config.ts`, `src/`. Not yet copied into this episode. |
| Reference rig project | `origin/claude/new-session-96c7w8` `Future_Got_Weird/Video_01_V2/source/` | Commit `c0c4538`. Its `src/` not yet fetched. |

Git fetch of the reference branches hung in this environment (killed). The GitHub file API works at the exact refs above.

## Locked decisions

- Voice: ElevenLabs **Test Voice**, `kk5XaSLo2XAw0sKM98zU`, verified in the account (name "Test Voice", category generated, model `eleven_v4`).
- Script: `script/script_v2.md`, 657 spoken words, 15 lines (L01–L15), six acts.
- Evidence: `claim_ledger.md` (v1, S3/S4 to be updated to packet wording, see below), `EVIDENCE_CORRECTIONS.md` in `production/brief/`.

## Evidence wording (from EVIDENCE_CORRECTIONS.md)

- Policy: announced Oct 8, 2026; effective Nov 12; narrow scope; exclusions verified.
- Conversation-ending feature: Aug 15, 2025; Claude Opus 4 and 4.1. Keep dated separately.
- Welfare page: Apr 24, 2025. "No scientific consensus." Company framing, not independent science.
- Butlin, Long et al., arXiv:2308.08706? **No: arXiv:2308.08708**, v3 (22 Aug 2023). Use the qualified wording: their analysis *suggested* the systems considered were not conscious; no obvious technical barrier to building systems with these indicators; passing indicators would not guarantee consciousness.
- Script v2 uses that wording. Note: this session did not re-read the PDF. The packet says relevant passages were read; treat this as verified by the packet, not independently.

## Narration (done)

- Six blocks, each generated with two takes (`generations_count` 2) in flow `ll7nuV3SX8U9Llkfp2Bm`.
- Selected take 1 of each block by default order. **No take was auditioned by ear. This session cannot play audio.** A transcript check was not run.
- Stitched file: `audio/narration/narration_v1_take1.mp3`, 252.995 s (≈4:13), 0.4 s gaps, mono 44.1 kHz, 192 kbps.
- Per-block timing: `audio/narration_timing.md`. Takes in `audio/narration/takes/`.
- Credits: the tool reported 0 per generation. The estimate for block 1 at 4 takes was ~1,963 credits; generation used 2 takes per block.

## Not done (remaining work, in order)

1. **Listen** to `audio/narration/narration_v1_take1.mp3` end to end. Check: pronunciation of "Butlin" and "Anthropic", breath placement, and the pauses on L03, L05, L07, L13. Replace a take block-by-block if a line fails. Keep the same voice ID and model.
2. **Word timing and SRT.** Upload the stitched file through `creative_create_asset_upload` / `creative_finalize_asset_upload` on flow `ll7nuV3SX8U9Llkfp2Bm`, then `creative_transcribe_audio` (`eleven_scribe_v1`) for word timestamps. Build the SRT from those timestamps. Do not reuse the script text as captions without timing.
3. **Remotion project.** Copy the Video_02 kit into `source/`, pin the lockfile, and confirm the install. Write scenes for L01–L15 using the approved cast rigs (`cast.ts`, `Character.tsx`). Build the timeline from the timing table, not from estimated seconds.
4. **Scenes.** The packet's required shots: peel-back cold open with the thumbnail composition; policy excerpt with one highlight and the date (no full-page screenshot); the game-character display; illustrative clerk/printer joke (labeled ILLUSTRATIVE); indicator card with a LIMIT stamp; conversation-ending card (dated Aug 2025); dilemma cards labeled with unequal wording (not equal weights); final code-reveal hold.
5. **Runway.** Optional. Only if needed for one or two acted inserts, starting from approved style frames. Runway is authenticated (2,218 credits). The Video 02 log shows that the sandbox network blocked Runway's output host, so check downloadability first.
6. **Sound.** Music bed, a few deliberate effects. Mix target about −16 to −14 LUFS, true peak ≤ −1 dBTP, measured with ffmpeg ebur128.
7. **Renders.** 1920×1080 upload master, 3840×2160 master from the vector source (not an upscale), and a labeled 720p review preview. Native 30 fps.
8. **Thumbnail.** From `JUST_CODE_thumbnail.png`. Check text legibility at phone size. Do not add owner identity.
9. **QA.** Full-video review. Defect log with timecodes. Report only the checks that were actually performed.
10. **Packaging.** Title, description, chapters matched to the final edit, source credits, and no owner identity or unrelated branding in any public text.

## Known risks

- Git LFS: `.mp3`/`.mp4` are LFS-tracked in this repo. Video 02 notes that the LFS host was unreachable and media was committed as checksummed split parts. Verify before relying on `git add` for audio.
- The sandbox cannot play audio. Any audio statement must say so.
- The reference-branch fetch hung. Use the GitHub API at the exact commits.

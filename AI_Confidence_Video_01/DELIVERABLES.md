# Deliverables: Video 01, "Why AI Sounds Right When It's Wrong"

| Deliverable | File |
|---|---|
| Main video, 1080p30 (**draft narration**) | `exports/Video_01_AI_Confidence_Final_1080p_DRAFT-NARRATION.mp4` |
| 4K master (3840×2160, rendered and verified) | `exports/Video_01_AI_Confidence_Master_4K_DRAFT-NARRATION.mp4` |
| Small review copy (720p, ~27 MiB; for quick viewing only, not for upload) | `exports/Video_01_PREVIEW_720p_DRAFT-NARRATION.mp4` |
| Thumbnails 1280×720 (A recommended) | `thumbnails/Video_01_thumbnail_A.jpg`, `_B.jpg`, `_C.jpg` |
| Final script with timings | `script/FINAL_SCRIPT.md` (source of truth: `script/narration_segments.json`) |
| Narration stem (processed, aligned to the video) | `exports/Video_01_narration_stem_DRAFT.wav` |
| Raw narration segments + word timings | `audio/narration/draft_local/` |
| Subtitles (match the delivered audio) | `exports/Video_01_AI_Confidence_DRAFT.en.srt` |
| Upload title, description, chapters | `package/UPLOAD_PACKAGE.md` |
| Sources (claim-to-source table) | `research/sources.md` |
| Reference study | `research/reference_study.md` |
| Asset manifest | `assets/asset_manifest.csv` |
| QA report | `qa/QA_REPORT.md` plus `qa/tech_*.md` (ffprobe, loudness, detectors) |
| Editable project zip | `exports/AI_Confidence_Video_01_project.zip` (no node_modules, caches or credentials) |
| Render instructions | `README.md` |

**What "DRAFT-NARRATION" means.** The voice is a local Kokoro-82M model, used as a stand-in. The premium
ElevenLabs narration could not be generated in the production session: there was no API key, and the API host
was blocked by the network policy. To produce the final cut:

1. Set `ELEVENLABS_API_KEY`.
2. Allow `api.elevenlabs.io`.
3. Run steps 1–4 in `README.md` with `ENGINE=elevenlabs`.

The on-screen "DRAFT · TEMPORARY VOICE" label then disappears automatically, and the subtitles regenerate from the new timing.

**Git note.** Audio and video files are Git LFS types in this repository. The LFS host was blocked from the
production session, so the media files exist only in the session's working folder and in the project zip.
They were not pushed to GitHub. The project zip (about 100 MB) also stays local, since it duplicates the repository contents. Code, research, script, images and documents were pushed to the branch
`claude/youtube-ai-confidence-video-2f39dg`.

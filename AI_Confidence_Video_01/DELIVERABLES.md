# Deliverables: Video 01, "Why AI Sounds Right When It's Wrong" (final v6)

Runtime **5:18.5**. Final narration: ElevenLabs Eleven v4, voice "Marcus K". There is no draft label and no "DRAFT"
in any final filename. Publishing on YouTube is left to you.

## Files

| Deliverable | Working copy (session) | Saved in the repository (branch `claude/youtube-ai-confidence-video-2f39dg`) |
|---|---|---|
| **Final video, 1080p30** (H.264 High, AAC 48 kHz, -16 LUFS, fast start) | `exports/Video_01_AI_Confidence_Final_1080p.mp4` | `backup/final_v6/` (5 parts) |
| **4K master**, 3840×2160, the same cut rendered natively at 2× | `exports/Video_01_AI_Confidence_Master_4K.mp4` | `backup/final_v6/` |
| Review copy, 720p (about 19 MB; for phones and quick viewing, not for upload) | `exports/Video_01_PREVIEW_720p.mp4` | `backup/final_v6/` (1 part) |
| **Final narration stem**: mono 48 kHz/24-bit, processed, aligned to the video, -20.4 LUFS, peaks -1.4 dBFS | `exports/Video_01_narration_stem.wav` | `backup/final_v6/` (2 parts) |
| All 48 raw narration takes, alignments, selection and blind Scribe check | `audio/narration/elevenlabs/` | `backup/elevenlabs_narration_takes/` |
| Voice audition (3 voices × 4 takes) and report | `audio/narration/elevenlabs/auditions/` | `backup/elevenlabs_auditions/` + `AUDITION_REPORT.md` |
| ElevenLabs sound effects (24 variations) and the choice of 6 | `audio/sfx/elevenlabs/` | `backup/elevenlabs_sfx/` + `SELECTION.md` |
| **Subtitles** (English, final timing) | `exports/Video_01_AI_Confidence.en.srt` | same path (plain Git) |
| **Upload package**: title, description, chapters, credits, checklist | `package/UPLOAD_PACKAGE.md` | same path |
| Thumbnails 1280×720 (A recommended) | `thumbnails/Video_01_thumbnail_A.jpg`, `_B.jpg`, `_C.jpg` | same paths |
| Final script with timings | `script/FINAL_SCRIPT.md` | same path |
| Sources (claim-to-source table, including the resolved DeepMind line, row A3-final) | `research/sources.md` | same path |
| Asset manifest (every external asset, generated audio included) | `assets/asset_manifest.csv` | same path |
| QA report and technical measurements | `qa/QA_REPORT.md`, `qa/tech_Video_01_AI_Confidence_*.md` | same paths |
| Editable project zip (no node_modules, caches, backups or credentials) | `exports/AI_Confidence_Video_01_project.zip` | `backup/final_v6/` |
| Draft v5 (Kokoro voice), kept for comparison | — | `backup/draft_v5/` |

**Getting the videos on your computer.** Clone or download the branch, then rebuild from the parts:

```sh
git clone --depth 1 --branch claude/youtube-ai-confidence-video-2f39dg https://github.com/BKimble1/Youtube-videos.git
cd Youtube-videos/AI_Confidence_Video_01/backup/final_v6
sh reconstruct.sh ~/Desktop/video01_final        # Windows: python reconstruct.py C:\Users\you\Desktop\video01_final
```

Every part and every rebuilt file is checked against `SHA256SUMS`. A fresh clone was verified this way (see `backup/final_v6/VERIFICATION.md`).

## Recommendations

- **Title:** *Why AI Sounds Right When It's Wrong.* It is the question the film asks at 0:43 and answers at 4:52. Alternatives are in `package/UPLOAD_PACKAGE.md`.
- **Thumbnail:** **A, "IT MADE THIS UP".** It shows GPT-4o's published, fabricated dissertation title, highlighted in coral. It has one focal point and one short phrase, and the first 30 seconds show exactly this. Use B ("LIKELY ≠ TRUE") or C ("3 titles. All made up.") as a later A/B test.
- **Subtitles:** upload `Video_01_AI_Confidence.en.srt` as English captions instead of relying on auto-captions. In this project's speech-recognition tests, "Kalai", "DeepSeek" and "Llama" were the words most often misheard.

## Watch-through checklist (about 6 minutes; once on headphones, once on a phone speaker)

| Time | Look / listen for |
|---|---|
| 0:00–0:28 | The question types on as it is read. A soft card tap as each answer card lands (0:08, 0:16, 0:20). A marker-stroke sound as the coral marks are drawn over titles (0:26), then years (0:27). Is "Kalai" said "kuh-LIE"? |
| 0:29–0:42 | A paper slide as the paper header lands. IMO panel: "published solutions … credited to Gemini Deep Think", P6 "NOT INCLUDED". Is the wording comfortable for you? |
| 0:48 | Title card hit on "wrong": felt on headphones and TV, nearly silent on a phone (by design). No distortion. |
| 0:57, 1:57, 2:53, 3:59, 4:51 | Scene changes: the low whoosh should be barely noticed, not distracting. |
| 1:00–1:50 | Token section: ticks are audible but sit under the voice. Numbers and labels are readable on a phone. |
| 2:40–2:53 | ChatGPT vs record comparison: underlines and the "Wrong year" tag are readable on a phone. |
| 3:15–3:37 | Quiz: a wooden tock on each score (6, 7, then 4). The penalty tones follow. |
| 3:39–3:50 | Table 2 tally to 9/10. "Guessing pays." stays up long enough to read. |
| 4:06–4:20 | The thesis page lands. Chime for "is there a real source", low tone for "does it actually say this". |
| 5:05–5:18 | Strike-through sound on "Does it sound right?". The end card is readable, the music resolves and fades, and nothing cuts off abruptly. |
| Joins between narration takes | 0:28.8, 0:58.1, 1:21.1, 1:39.7, 1:57.4, 2:26.6, 2:54.1, 3:26.1, 4:00.2, 4:20.5, 4:51.7. Listen for any jump in voice tone or room sound. |
| Throughout | The voice is always clear over the music; pace and energy feel right; no clicks at phrase edges. Subtitles stay in sync (spot-check 0:10, 2:45, 5:10). |

## What still needs a human

I can't watch in real time or hear. Everything above was checked by measurement, frame sampling and speech recognition (see `qa/QA_REPORT.md`, section v6). Still to judge by eye and ear:

- Whether the voice sounds sincere and pleasant for five minutes, and whether "Marcus K" is the voice you want (the audition samples are in the backup).
- The tone at the joins between narration takes, listed above. Each block's loudness was matched, but timbre continuity is only measured, not heard.
- The level and taste of the sound effects and the music under the voice, on your own speakers.
- The motion as it actually plays (easing, pacing of holds). It was reviewed only as still frames.
- Before you publish, two checks that need an unblocked browser: whether arXiv:2509.04664 has a v2 (page numbers could shift), and YouTube's current altered/synthetic-content question.

## Known limitation

**ElevenLabs music:** the connected ElevenLabs connector is the restricted version, which has no music generation. The video keeps its original score, regenerated to the new timing. To try ElevenLabs music, add the full connector at `https://api.elevenlabs.io/v1/mcp`. Then replace `audio/music/music_bed.wav` and re-run `tools/mix.py`; the ducking applies automatically.

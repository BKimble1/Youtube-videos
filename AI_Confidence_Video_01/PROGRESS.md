# Production progress log — AI_Confidence_Video_01

Durable notes so work can resume if the session is interrupted. Newest entries at the bottom.

## 2026-10-07 — Session start (environment check)
- OS: Ubuntu 24.04.5 LTS (cloud container), 4 vCPU, 15 GiB RAM, ~31 GB free disk, no GPU.
- Tools: Node 22.22.0, Python 3.13, FFmpeg 6.1.1 (loudnorm/ebur128/blackdetect/freezedetect available), Chromium (Playwright build), poppler (pdftoppm/pdftotext), ImageMagick, git-lfs 3.4.1.
- Network: egress is policy-restricted. BLOCKED: api.elevenlabs.io, elevenlabs.io, arxiv.org, openai.com, cdn.openai.com, youtube.com, 3blue1brown.com, ted.com, support.google.com, huggingface.co, wikimedia, freesound, pixabay, unsplash, pexels.
  REACHABLE: npm registry, PyPI, raw.githubusercontent.com (public files), www.anthropic.com, fonts.googleapis.com / fonts.gstatic.com, storage.googleapis.com (incl. arXiv's official public dataset bucket), Ubuntu apt archive.
- Narration: NO ElevenLabs credential in the environment and the ElevenLabs API host is blocked by network policy. Environment variables/secrets are only picked up by a NEW session, so premium narration cannot be generated in this session. Plan: build everything with a clearly labelled local draft voice and a one-command ElevenLabs regeneration path.

## Environment check results (05:35Z)
- Remotion 4.0.533 + React 19.1 installed in source/. Remotion's Chrome Headless Shell download host (remotion.media) is blocked → remotion.config.ts points to the preinstalled Playwright headless_shell (override with REMOTION_BROWSER_EXECUTABLE).
- Smoke test rendered OK: 1920x1080, 30 fps, H.264 + AAC 48 kHz stereo, local fonts (fontsource) load. ~35 s for 3 s of simple video incl. bundling.
- Real tokenizer: js-tiktoken o200k_base (GPT-4o's encoding) runs offline.
- Python audio: numpy, scipy, soundfile, pyloudnorm, mido OK. pedalboard crashes with "Illegal instruction" on this VM → not used (scipy-based DSP instead).
- Research sources: OpenAI paper PDF obtained from arXiv's official public dataset bucket on storage.googleapis.com (arxiv.org itself blocked). Anthropic article fetched directly. 3Blue1Brown creator captions/lesson repos reachable on raw.githubusercontent.com.

## 05:56Z — milestone: script v1 + draft narration + all scenes drafted
- Script v1: script/narration_segments.json (39 segments, 771 words). Openings considered: script/openings_and_outline.md.
- Draft narration: Kokoro-82M v1.0 af_heart (Apache-2.0), local/offline, speed 1.0 → 4:58.9 total, 168 wpm speech-only, engine word timestamps.
  Run: <venv>/bin/python tools/draft_tts.py --voice af_heart --speed 1.0 ; then python3 tools/build_timeline.py --engine draft_local
- ElevenLabs path: tools/elevenlabs_narration.py (eleven_v4 GA since 2026-09-28 per SDK), not runnable here (blocked + no key).
- Remotion scenes S1–S6 written (source/src/scenes). Stills reviewed; layout fixes applied.
- Real assets: paper crops (CC BY 4.0), thesis title page (MSR-hosted PDF), Anthropic header + Fig. 7 (commentary use), 3 Smithsonian CC0 photos (2 used).
- Next: music + SFX + mix, full 1080p preview render, QA.

## 06:25Z — audio done, full 1080p review render in progress
- Fact-check fixes applied (s05 lead author, s06 "Google DeepMind reported", s08 "part of", s21 "a different title", s35 "not necessarily").
- Music (tools/make_music.py, original, FluidSynth + MuseScore General SF), SFX (tools/make_sfx.py, synthesized), mix (tools/mix.py): -16.0 LUFS integrated, -1.3 dBTP, voice 16.7 dB over music during speech.
- 30 s test render OK; static-hold and empty-opening issues fixed (kicker + chips, read-along, slow push).
- Thumbnails A/B/C rendered (thumbnails/). README, package/UPLOAD_PACKAGE.md, tools/finalize.sh, tools/check_cues.py written.
- Git: code/docs pushed. LFS host (lfs.github.com) is blocked by network policy → audio/video kept local (.gitignore) — must be pushed from a machine with LFS access or after allowing the host.
- ASR (whisper-tiny) check: ~7.8% WER, misses are recognizer weaknesses (phonemes verified with misaki).

## 07:20Z — review pass complete, v3 final-quality render running
- 7-agent frame review of v1 (per act + story/pacing): 70+ findings; all medium/high fixed (see qa/QA_REPORT.md).
- Two cue bugs found by review (first-occurrence word matches for "Six"/"Ask") fixed with occurrence-specific cues.
- Script v1.2: s01 matches the quoted prompt ("dissertation", no "PhD"); pauses trimmed; end-card tail 5.2 s. Runtime 4:59.5.
- Thumbnails exported as JPG (thumbnails/Video_01_thumbnail_[A-C].jpg). Recommended: A.
- 4K test: 3840x2160 renders at ~1.4 fps (≈1¾ h for the full film). Document crops re-rendered at 600 dpi so the 4K master is native.

## 08:20Z — v3 verified, v4 fixes in, v4 1080p rendering
- v3 passed technical QA (-16.0 LUFS, -1.3 dBTP, faststart, no freezes).
- 3-agent verification of v3: 52 earlier fixes confirmed. 3 medium and about 14 low items found (static birthday beat, word-field overlap, the temperature hedge, carry-overs in the Anthropic diagram). All fixed and checked on full-res stills. Details in qa/QA_REPORT.md.
- IMO panel: the search-only "35 / 42" score was removed. It now shows only what the opened solutions PDF supports, plus the attributed "reported gold-medal standard".
- Next: finalize v4, then the 4K master, then a final regression look at the v4 sheets, then the zip and handoff.

## 10:50Z — delivered
- v4 final regression check: all 18 v4 fixes confirmed. 2 low carry-overs fixed in v5 (short birthday caption; pattern-word underline sweep).
- Resolution audit: no real asset is drawn above its source resolution in either output. The Fig. 7 card is now 780 px; the 1912 photo pans instead of zooming.
- v5 1080p: exports/Video_01_AI_Confidence_Final_1080p_DRAFT-NARRATION.mp4 (104.1 MB, 4:59.5, -16.0 LUFS, -1.3 dBTP, faststart).
- 4K master: exports/Video_01_AI_Confidence_Master_4K_DRAFT-NARRATION.mp4 (262.3 MB, same checks pass).
- 720p review copy for sending: exports/Video_01_PREVIEW_720p_DRAFT-NARRATION.mp4 (27 MiB).
- Project zip: exports/AI_Confidence_Video_01_project.zip (100 MB, 281 files, no node_modules, caches or credentials; credential grep passed).
- Remaining for a final, non-draft cut: ElevenLabs narration (needs the API key and api.elevenlabs.io allowed), then README steps 1–5.

## 14:35Z — final v6 (ElevenLabs) in progress → delivered when the 4K finishes
- Backup of the complete draft (v5) verified by fresh clone before any change.
- ElevenLabs connector: TTS v4, Scribe and Sound Effects work; music/image/video are unavailable (restricted connector). The score stays original and is regenerated to the new timing.
- Voice audition (Marcus K / Craig / Grounded Woman, 4 takes each): Marcus K chosen (0 % blind WER, widest intonation, cleanest pauses).
- Narration: 12 blocks × 4 takes on eleven_v4, scored, picked, cut at pauses with Scribe forced alignment; blind Scribe WER 0.4 %. Runtime 5:18.5.
- DeepMind line revised to what the opened PDF supports (no gold/score claim); S1 panel rebuilt around the real PDF page.
- Sound: 6 ElevenLabs SFX (24 variations measured) at 26 synced cues; look-ahead ducking; mix -16.0 LUFS / -1.3 dBTP.
- Final 1080p rendered, remuxed with the final mix, verified (-16.0 LUFS, -1.2 dBTP, faststart, clean decode); backed up as parts with the narration stem and a 720p preview.

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

# Production state — Why This Robot Has No Pinky (Atlas Short)

Branch: `claude/pensive-mendel-3j0xsc`. **Not published. Do not publish.**

## Done (checkpoint 2: first complete render)
- [x] Handoff extracted; script/ledger/storyboard/cast read. Copies in `handoff/`.
- [x] Remotion project `source/` (pinned Remotion 4.0.533 / React 19.1.0 / TS 5.8.3, `npm ci` OK, typecheck clean).
- [x] Narration (ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, eleven_v4, take A of two) + Scribe alignment: `audio/narration*.{mp3,wav,json}`. **Do not regenerate.**
- [x] Cue table `audio/cues.json` -> `source/src/cues.ts`, `FGW_Atlas_No_Pinky.srt` (from real alignment) via `tools/build_cues.py`.
- [x] Animation: all nine beats (hand rig with IK in `source/src/hand`, scenes in `source/src/film`).
- [x] Sound: synthesized SFX + original 126 BPM bed + voice-driven ducking via `tools/build_audio.py`; mix -14.4 LUFS, <= -1.5 dBTP; stems in `audio/stems/`.
- [x] First full render `FGW_Atlas_No_Pinky_1080x1920.mp4` (1080x1920, 30 fps, 34.60 s, H.264/AAC).

## Next
1. Review contact sheets / frame bursts; fix visible defects; re-render.
2. Captioned render, cover, QA_REPORT, credits, claim ledger, script, rebuild notes, ZIP.
3. Honest review status (voice and final film not auditioned by the producing agent).

## Notes
- Runway not used (optional). Primary-source pages unreachable from this sandbox (proxy 403); facts corroborated by two searches.
- Audio and MP4 stored as ordinary Git blobs via scoped `.gitattributes` (LFS uploads Forbidden here).
- Render: `cd source && npx remotion render src/index.ts Short ../exports/clean.mp4 --crf=16 --x264-preset=medium --color-space=bt709 --audio-bitrate=320k --browser-executable=<headless_shell>` (needs `npm ci` first; Chrome headless shell, not full Chrome).

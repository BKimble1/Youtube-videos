# Production state — Why This Robot Has No Pinky (Atlas Short)

Branch: `claude/pensive-mendel-3j0xsc`. Not published; do not publish.

## Done
- [x] Handoff extracted; script/ledger/storyboard/cast read. Handoff copies in `handoff/`.
- [x] Remotion project skeleton `source/` (pinned Remotion 4.0.533 / React 19.1.0 / TS 5.8.3, `npm ci` OK).
- [x] Narration generated (ElevenLabs Test Voice, eleven_v4, take A), aligned with Scribe: `audio/narration.mp3`, `audio/narration_48k.wav`, `audio/narration_alignment.json`. **Do not regenerate.**
- [x] Fact re-check: primary pages unreachable from this sandbox (proxy 403); two searches corroborate pinky omission, one-day taped test, 13 DOF (4 thumb + 3x3), extra finger = three more actuators, cost/size/failure points.

## Next (in order)
1. `tools/build_cues.py` -> `source/src/cues.ts`, `audio/cues.json`, SRT, caption phrases.
2. Animation (`source/src/**`), typecheck, opening preview + contact sheets.
3. SFX + music synthesis and mix (`tools/build_audio.py`), stems in `audio/`.
4. Full render (clean + captioned), SRT, cover, QA.
5. Deliverables ZIP.

## Notes
- Runway not used (optional; not needed).
- Voice not auditioned by the producing agent.

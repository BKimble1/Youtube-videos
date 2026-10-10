# Production state — Why This Robot Has No Pinky (Atlas Short)

Branch: `claude/pensive-mendel-3j0xsc`. **Not published. Not uploaded. Not scheduled. Do not publish.**

## Status: V2 COMPLETE for production; awaiting human audiovisual review (not performed)

V1 (baseline) is complete and preserved in `v1/`. V2 (this state) is the substantive visual revision requested by the owner's V2 audit.

- [x] V2 shot-local staging (macro, overhead, mechanism, workstation, receipt); opener with the pinch at frame 0; real replay boundary (opener rendered at negative time under the closing tear).
- [x] V2 cue table (`audio/cues_v2.json`, `source/src/cues_v2.ts`) and captions (`FGW_Atlas_No_Pinky_V2.srt`, 21 cues) from the existing Scribe alignment. Narration **not** regenerated or edited.
- [x] V2 sound (`tools/build_audio_v2.py`): 29 contact-driven effects (V1: 41), music bed from t = 0 with no closing chord, 0.3 s seam dip; −14.6 LUFS WAV / −14.7 LUFS, −1.4 dBTP in the MP4.
- [x] V2 renders: clean + captioned (1080 × 1920, 30 fps, 34.60 s, H.264/AAC), cover from the selected opening.
- [x] `QA_REPORT.md` (four evidence layers kept separate), `claim_ledger.md` (C05 updated), `script.md`, `credits.md`, `README.md`, `packaging_draft.md`, `qa/v2/`.

## Remaining (human) — none of these has happened
1. One full phone playback **with sound** (voice, *thirteen*/*actuators*, effects, can each action be followed).
2. One **muted** phone playback of the captioned MP4 (hook, premise, experiment, tradeoff, conclusion).
3. **Two repeats back-to-back** (picture exact by construction; audio seam only designed, never heard).
4. **Current Shorts UI overlay** check of captions and critical details.
5. Optionally confirm the primary pages first-hand (not re-read in this session; C05 relies on the owner's V2 audit).
6. The upload decision (not made here).

## Notes
- No Runway job and no new ElevenLabs generation in V2; V1 narration reused. ElevenLabs upload tools were disconnected, so the V2 mix was not re-transcribed.
- Primary-source pages unreachable from this sandbox (proxy 403).
- Audio and MP4 stored as ordinary Git blobs via scoped `.gitattributes` (LFS uploads Forbidden here).

# Future Got Weird: They Turned Dead Birds Into Drones

## V2 (review cut, current)

**Deliverable:** `exports/FGW_Dead_Bird_Drones_V2_REVIEW_1080x1920.mp4`
- **Format:** 1080×1920, 30 fps, 708 frames, 23.60 s.
- **Loudness:** −13.8 LUFS, −1.6 dBTP.
- **Status:** not published.
- **Narration:** the approved narration, unchanged.
- **QA notes:** `production/V2_QA_NOTES.md`. **Evidence:** `qa/v2/`. **Transitions:** `production/TRANSITIONS_V2.md`.
- **Mix:** `audio/mix/FGW_Dead_Bird_Drones_MIX_V2.wav`. **Stems:** `audio/stems/*mix_v2*`.

**Rebuild:** run the cue export, then `python3 tools/make_audio.py mix_v2`, then
`COMP=DeadBirdDronesV2 tools/render_resilient.sh mix_v2 exports/FGW_Dead_Bird_Drones_V2_REVIEW_1080x1920.mp4`, then
`python3 tools/qa_render.py <export> qa/v2`. The source now draws V2. V1's source is in git history at commit `03899c0`.

## V1 (review cut, superseded)

**Deliverable:** `exports/FGW_Dead_Bird_Drones_V1_REVIEW_1080x1920.mp4` (1080×1920, 30 fps, 708 frames, 23.60 s,
−13.5 LUFS, −1.6 dBTP). **Not published.** It is a review cut built from the supplied V2 narration; nothing in it is an
approved final. One independent five-lens review round was run and its blockers and majors addressed; the open items
are listed in the QA notes.

**Where to look:**

- **QA notes:** `production/V1_QA_NOTES.md` (what was actually checked, measurements, concrete limitations).
- **Claim and source ledger:** `production/CLAIM_LEDGER.md` (the three primary sources, read 7 Nov 2026, with
  verbatim passages; depiction decisions for owner review).
- **Build brief and module contracts:** `production/BUILD_BRIEF.md`. **Transition list:** `production/TRANSITIONS.md`.
- **Narration (authoritative text):** `production/NARRATION_V2.txt`, word for word. **Captions:**
  `captions/FGW_Dead_Bird_Drones_V1.srt` (generated from the same text and the measured word times).
- **Audio:** the narration master `audio/narration/FGW_Dead_Bird_Drones_narration_V1.wav`, the mix
  `audio/mix/FGW_Dead_Bird_Drones_MIX_V1.wav` and its stems `audio/stems/` (voice, effects, ambience, music).
- **Source:** `source/src/` (Remotion composition `DeadBirdDronesV1`). **Evidence:** `qa/v1/`.

## Narration

- **Voice:** the channel narrator, ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU` (confirmed with
  `creative_list_voices` on 7 Nov 2026), `eleven_v4`, connector defaults, delivery directed with inline tags only.
  One run of two takes (flow `cpsagIs44zqsq6cpw9ex`); take 2 (`t2_dTuc`) is used sample for sample.
- **Provenance:** `audio/narration/voice_provenance.json`.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    # ASR models (k2-fsa GitHub releases, asr-models): sherpa-onnx-zipformer-en-2023-06-26 and
    #   sherpa-onnx-whisper-base.en, unpacked into /tmp/asr
    python3 tools/make_narration.py              # take -> narration master, word timeline, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/ec.js && node /tmp/ec.js audio/cues.json
    python3 tools/make_audio.py mix_v1           # effects, ambience, music and mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci)
    COMP=DeadBirdDronesV1 tools/render_resilient.sh mix_v1 exports/FGW_Dead_Bird_Drones_V1_REVIEW_1080x1920.mp4
    python3 tools/qa_render.py exports/FGW_Dead_Bird_Drones_V1_REVIEW_1080x1920.mp4 qa/v1

**Working sheets:** `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`. Module test entries are in
`source/src/test/*.entry.tsx`; render one with `npx remotion still src/test/<name>.entry.tsx <Comp> out.png`.

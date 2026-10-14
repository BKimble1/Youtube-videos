# Narration provenance: The Death Clock

## Voice
- ElevenLabs **Test Voice**, `voice_id kk5XaSLo2XAw0sKM98zU` (workspace voice, category "generated", description "Test Voice For Youtube."), resolved with `creative_list_voices` on 14 Oct 2026. Same voice as the earlier Future Got Weird Shorts.
- Model `eleven_v4`. The connector exposes no stability, style or speed parameters for this model; delivery was directed only with eleven_v4 inline audio tags, which the model performs and does not speak.
- Flow: `m2Pyn9dxqMB3w9eeZby3` ("FGW Death Clock Short — narration").

## Text
- Source of truth: `script/narration_locked.json` (the five locked blocks, verbatim from the brief).
- Sent to TTS: `audio/narration/tts_input.txt` = the five blocks separated by blank lines, plus three direction tags: `[urgently]` before block 1, `[tense]` before block 2 (held through block 4), `[quietly]` before block 5.
- `tools/check_tts_text.py` strips the tags and compares each block to the locked string: **PASS, 5/5 blocks exact**.

## Opening delivery audition (same first sentence, two deliveries, 4 variations each)
| Delivery | Tag | Takes | Speech span | Rate | Pitch median | Pitch movement (p10–p90) |
|---|---|---|---|---|---|---|
| urgent / controlled | `[urgently]` | A1–A4 | 2.78–2.82 s | 191–194 wpm | 203–212 Hz | 8.5–10.1 st |
| calm / ominous | `[calm] [ominous]` | B1–B4 | 3.07–3.18 s | 170–176 wpm | 111–114 Hz | 4.2–4.8 st |
| (reference: untagged Test Voice, Earth Stops take A) | none | 1 | — | 178 wpm | 160 Hz | 13.1 st |

Measured with `tools/voice_audition.py` → `audition/AUDITION_ANALYSIS.json`. **Nobody listened to these takes; this environment cannot play audio.** Selection was by measurement: the ominous tag moved the voice about 6 semitones below its untagged register and flattened the contour (a risk to "one consistent narrator"), while the urgent tag kept more pitch movement, crisper consonants (higher spectral centroid), and a rate inside the brief's 180–195 wpm opening range. **Selected: urgent / controlled.**

## Full take
- One coherent generation of all five blocks, 4 variations (node `EzoxbJkCLc3n5km1N3hf`): T1 `H4XIVnUlVwKSfLSnadHs` 35.28 s, **T2 `K4mDnwmDmX1uUihT1Bt6` 34.88 s**, T3 `wwCuoB1WFfkkHluDGgGG` 35.28 s, T4 `Hoglf8qyML8SI0sCPkA5` 35.20 s. All four: median pitch 162–173 Hz (close to the untagged register), ~168 wpm overall.
- Scribe alignments of all four (prompt-linked, 0 credits) returned the sent text including the tags as near-zero-length tokens, i.e. an alignment against the prompt, not an independent transcript. From those alignments, T1, T3 and T4 each have 0.3–0.5 s hitches inside phrases ("cellular · decay", "your · skin", "seek · help", "medical · data"); T2 has none and is the shortest. **Selected: T2.**
- **Independent check:** T2 was re-attached as a plain asset (`rdXfTHwzjThp34w05Nx9`, no prompt link) and transcribed blind with `eleven_scribe_v1` (191.84 credits). Result: all 98 words, in order; only orthographic differences ("nanosensors" for "nano-sensors", no comma after "fail"). Saved as `T2_scribe_blind_words.json`. Language probability 0.93.

## Edit (pauses only)
`tools/build_voice.py` lengthens the silences between T2's 11 speech groups to targets set by the shot plan, inserting digital silence at the quietest 20 ms of each gap (gaps measure about −86 dBFS, so there is no seam to hear). **No word was cut, stretched, sped up, pitch-shifted, EQ'd or compressed.** The kept audio equals the source take with a residual of −127.6 dBFS (float rounding). Gap targets and the story beat each serves are in `VOICE_EDIT_LOG.json`.
- Result: `narration_final_48k.wav`, 45.75 s, mono 48 kHz 24-bit; first sound at 0.03 s; last word ends 42.90 s.
- Blocks in the final timeline: 1 → 0.12–2.56 s, 2 → 3.82–12.54 s, 3 → 13.83–22.69 s, 4 → 24.94–36.74 s, 5 → 40.08–42.87 s.
- Word times: blind Scribe times shifted by the inserted silence; display words from the locked script (`narration_words_final.json`). Captions and every cue in the film read this file.

## Notes and limits
- The opening sentence in the full take runs 2.61 s (about 207 wpm), a little faster than the audition takes and the brief's 180–195 wpm guide. It was kept so the opening flows into block 2 in one performance; a patch from an audition take was not used.
- Not auditioned by a person. Tone, warmth, pronunciation of "nano-sensors", "cellular decay" and "life expectancy", and whether the lengthened pauses feel natural are **unverified by ear**.
- Spend (tool-reported): audition 8 × ~60–66 credits ≈ 504; full take 4 × 673.93 ≈ 2,696; blind Scribe 191.84; prompt-linked Scribe 0. Total ≈ 3,392 credits.
- Licence: whether the owner's ElevenLabs plan covers commercial use of this output is not verified here.

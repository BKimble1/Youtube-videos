# Narration provenance — Earth Stops V3

- **Voice:** ElevenLabs **Test Voice**, `voice_id kk5XaSLo2XAw0sKM98zU` (category "generated"), the voice the owner authorised for this episode. Model `eleven_v4`, account defaults (no stability/style controls in the connector, no audio tags). Pacing comes from punctuation and paragraph breaks in the sent text.
- **Text sent (55 words, one generation, 2 variations; flow `pIW3sUYZsnkXKwlDfv1n`):** the V3 brief's starting script, one paragraph per line, typographic apostrophes, no wording changes:
  - If Earth stopped, you’d keep moving east—about a thousand miles an hour at the equator.
  - Loose objects keep going too.
  - So does the air.
  - And the ocean.
  - You don’t feel the spin because you move with Earth.
  - Closer to the poles, that starting speed is lower.
  - The stop is imaginary. The motion is real.
- **One coherent take, no blind variation runs.** Take A (`LxLyb9yM3PO6eDWnFZP9`): 18.80 s; take B (`Tu73426UUALcU5Y75PmG`): 18.24 s (44.1 kHz mono MP3: `v3_takeA.mp3`, `v3_takeB.mp3`; 48 kHz PCM copies alongside). **Take B was selected** from measured timing only (0.56 s shorter, same speech groups; `VOICE_ANALYSIS_v3.json`, `tools/voice_analyse_v6.py`); that is **not** a judgement that B sounds better — **nobody has listened to either**.
- **What was done to take B (cut only, never stretched).** `tools/build_voice_v3.py` slices take B into seven pieces at its own pauses (S1–S7: take-local cut times 5.05, 6.95, 8.0, 9.2, 11.95, 14.95 s, each inside a gap ≥ 0.25 s) and lays them on the 24.8 s film timeline with 6 ms fades at the cuts. Silence was added only at those cuts, to give the picture room: before S4 ("And the ocean.") +0.84 s, before S5 ("You don't feel the spin…") +2.85 s (the ocean beat; the surge plays in the 3.3 s without narration), before S6 +0.66 s, before S7 +0.35 s (cumulative shifts 0.84 / 3.69 / 4.35 / 4.70 s). Every other pause is the voice's own. **No time-stretch, no speed-up, no pitch change, no EQ, no compression.** Verified: each segment equals the take-B slice to −73 dB residual (1-sample rounding), and the mixed narration equals the timeline at one constant gain (−0.10 dB, residual −77 dB): `qa/v6/AUDIO_MEASUREMENTS_V3.json`.
- **Scribe transcription** of take B (`v3_takeB_alignment.json`; generation `Nx43GOxrxftUsd41p6CW`): returned the sent text word-for-word (55 words) with word start/end times. These place every caption cue and picture event after the shift per segment (`source/src/film3/voice3.json`). Scribe word ends run into the following pause, so speech ends were taken from an energy segmentation. A Scribe pass on the *final mix* was not possible (the restricted connector has no file-upload tool).
- **Spend (estimates from price checks, not billing records):** two-variation narration ≈ 604 credits; one Scribe ≈ 40 credits.
- **Not auditioned by a person.** Tone, urgency, naturalness and the delivery of "about a thousand" and "imaginary / real" are unverified.
- **Licence:** whether the owner's ElevenLabs plan covers commercial use of this voice's output is **not verified here** (the pages named in the brief could not be opened); it must be confirmed before any commercial publication.

# Narration provenance — Earth Stops V2

- **Voice:** ElevenLabs **Test Voice**, `voice_id kk5XaSLo2XAw0sKM98zU` (category "generated"), the voice the owner authorised for this episode. Model `eleven_v4`, account defaults (no stability/style controls in the connector, no audio tags). Pacing comes from punctuation and paragraph breaks in the sent text. ID and settings are retained here as provenance.
- **Text sent (68 words, one generation, 2 variations):** the seven lines S1–S7 of `script/SCRIPT.md` (the owner's baseline, typographic apostrophes), one paragraph per line. No wording tweaks beyond punctuation.
  - S1 What if Earth stopped—right now?
  - S2 At the equator, you’re already moving about a thousand miles an hour.
  - S3 You don’t feel it because you, the ground, and the air move together.
  - S4 Stop the ground suddenly, and loose objects initially keep moving east.
  - S5 The air keeps going too. And so does the ocean.
  - S6 Closer to the poles, that starting speed is lower.
  - S7 The stop is imaginary. The motion is real.
- **One coherent take, no blind variation runs.** Take A: 24.72 s; take B: 24.16 s (both 44.1 kHz mono MP3: `v2_takeA.mp3`, `v2_takeB.mp3`; 48 kHz PCM copies alongside). **Take B was selected** and timing was rebuilt from it. The selection used **measured timing only** (it is 0.56 s shorter and both takes have the same 18 speech groups, so B fits the 24–29 s target with more room for the sip); it is **not** a judgement that B sounds better — **nobody has listened to either**.
- **Unmodified.** No trim, gap edit, time-stretch, pitch change, EQ or compression. `v2_selected_48k.wav` (= take B) is a 48 kHz mono PCM conversion and nothing else. In the mix the voice carries one constant gain (−0.30 dB, the mix's final level); a fitted-gain residual check (`qa/v5/QA_V2.json`, `voice_integrity`) shows −75.7 dB residual (the 16-bit floor).
- **Scribe transcription** of take B (`v2_takeB_alignment.json`; flow `zzxUfgkr8hXgYzcsBQDY`, generation `WW6N4ya668epAHVbHEvE`): returned the sent text word-for-word (68 words) with word start/end times. These place every caption cue and picture event. Scribe word ends run into the following pause, so speech ends were taken from an energy segmentation (18 speech groups: `VOICE_ANALYSIS_v2.json`, `tools/voice_analyse_v5.py`). A Scribe pass on the *final mix* was not possible (the restricted connector has no file-upload tool).
- **Spend (estimates from price checks, not billing records):** two-variation generation ≈ 784 credits; one Scribe ≈ 40 credits; the eight generated sound-effect one-shots (16 clips) ≈ 267 credits (`audio/v5/sfx_gen/SFX_GEN_MANIFEST.json`). No Eleven Music (not exposed by the connector in this session) and no Runway audio.
- **Not auditioned by a person.** Nobody in this session has listened; tone, urgency, naturalness and the delivery of "about a thousand" and "imaginary / real" are unverified.
- **Measured timing:** speech runs 0.02–23.98 s of the 24.16 s file; the film is 25.33 s (the 1.35 s after the last word is the sip settling). Pauses between sentences (0.33–0.56 s) are the voice's own.

# Local TTS auditions: DRAFT narration only

These are **draft placeholder voices** used while ElevenLabs isn't available (no API key, and api.elevenlabs.io is blocked). Everything runs offline on CPU in this container. Generated 2026-10-07.

> **Honesty note:** I cannot listen to audio. The ranking below rests on three things: the published quality of each model (including Kokoro's own voice grades), the objective measurements in this file, and an offline speech-recognition check (whisper-tiny). Someone still needs to listen before any voice is used, even for a draft.

## Audition passage

> In a 2025 paper, researchers asked three popular chatbots a simple question: what was the title of Adam Kalai's PhD dissertation? Each one answered instantly, in polished academic language. Each one named a title, a university, and a year. And all three were wrong. So how can a system that's this fluent be this confidently mistaken?

The passage has **56 written words**, not 58. I counted by hand and by script (whitespace split). Spoken aloud it is about 60 words, because "2025" becomes "twenty twenty-five" and "PhD" becomes "P-H-D". All WPM figures below use 56.

## Files (all 48 kHz, mono, 24-bit PCM; silence trimmed to 40 ms padding with 10 ms edge fades)

| File | Engine / voice |
|---|---|
| `kokoro_af_heart.wav` | Kokoro-82M v1.0, `af_heart` (US female). Raw text, not fixed. |
| `kokoro_af_heart_kalai-fixed.wav` | Same as above, with the "Kalai's" pronunciation override (see Pronunciation). |
| `kokoro_af_bella.wav` | Kokoro-82M v1.0, `af_bella` (US female) |
| `kokoro_am_michael.wav` | Kokoro-82M v1.0, `am_michael` (US male) |
| `piper_en_US-joe-medium.wav` | Piper (VITS), `en_US-joe-medium` (US male). Comparison baseline only. |

## Candidates

| Engine | Voice | Version | Engine license | Voice / weights license | Source host (reachable) |
|---|---|---|---|---|---|
| Kokoro-82M (ONNX, fp32) via onnxruntime + misaki G2P | af_heart, af_bella, am_michael | Kokoro v1.0 weights; onnxruntime 1.30.0; kokoro-onnx 0.6.1 (vocab only); misaki 0.7.4 | Kokoro code: Apache-2.0. kokoro-onnx: MIT. misaki: Apache-2.0. onnxruntime: MIT. espeak-ng fallback G2P: GPL-3.0 (tool only; the audio it produces is not covered by the GPL). | **Apache-2.0** for both the model and the voice packs (hexgrad/Kokoro-82M). Commercial use, including YouTube, is allowed. | registry.npmjs.org: `kokoro-fp32a/b/c-shards@1.0.0` (model), `kokoro-js@1.2.1` (official package; ships `voices/*.bin`). files.pythonhosted.org for the Python packages. conda.anaconda.org for spaCy `en_core_web_sm` 3.8.0 (MIT). |
| Piper (piper1-gpl) | en_US-joe-medium | piper-tts 1.8.0 | GPL-3.0 (tool only) | The model card says the dataset is **CC0** (NabuCasa voice-datasets). However, the voice was **fine-tuned from the Piper `lessac` checkpoint**, and the Lessac/Blizzard-2013 data has a restrictive license. Treat the voice's provenance as unclear and **do not publish with it**. | registry.npmjs.org: `vowel-lab-voices-float@0.1.0` (ONNX only; I rebuilt the config from Piper's default espeak phoneme map) |

### Integrity of the third-party npm mirrors (the weights are untrusted data)

- **Kokoro q8 export:** the SHA-256 is `fbae9257…1478` in two unrelated npm packages, `kokoro-q8-shards` (2026) and `expo-kokoro` (2025). Two independent publishers agreeing is strong evidence the file is genuine.
- **Kokoro fp32 export:** the SHA-256 of the joined file is `8fbea51e…34cb`. Only one publisher has it, so I compared it against the q8 export. All 315 float tensors the two share are **bit-identical**. The 94 quantized weight tensors (55 M parameters) dequantize to a correlation of **≥ 0.984 (median 0.9988)** with the fp32 weights. The graph uses only standard ONNX ops, with no custom domains and no random ops.
- **Voice packs:** `af_heart`, `af_bella`, `am_michael`, `am_fenrir`, `bm_george` and `af_nicole` are byte-identical across three npm packages: `kokoro-js` (the official one), `kokoro-local-runtime` and `expo-kokoro`.
- **spaCy model:** the `.conda` file's SHA-256 matches conda-forge's repodata.

## Measurements

Loudness and peaks come from ffmpeg `ebur128=peak=true+sample`. The Kokoro auditions were capped at −1.0 dBFS sample peak. The tool now defaults to −1.5 dBFS so that true peak stays below −1 dBTP.

| File | Duration | WPM (56 words) | Integrated loudness | LRA | Sample / true peak | ASR word errors (whisper-tiny) |
|---|---|---|---|---|---|---|
| kokoro_af_heart | 21.96 s | **153.0** | −22.3 LUFS | 2.0 LU | −1.0 / −0.9 | 2 / 56 (3.6%) |
| kokoro_af_heart_kalai-fixed | 22.00 s | 152.7 | −22.2 LUFS | 1.9 LU | −1.0 / −1.0 | 2 / 56 (3.6%) |
| kokoro_af_bella | 22.33 s | 150.5 | −20.9 LUFS | 2.8 LU | −1.8 / −1.7 | 2 / 56 (3.6%) |
| kokoro_am_michael | 23.53 s | 142.8 | −23.9 LUFS | 3.3 LU | −1.8 / −1.8 | 3 / 56 (5.4%) |
| piper_en_US-joe-medium | 20.35 s | 165.1 | −21.8 LUFS | 3.4 LU | −1.0 / −1.0 | 6 / 56 (10.7%) |

**ASR check.** I used whisper-tiny (q8 ONNX from the npm package `sts-whisper-tiny`, run through transformers.js, fully offline). Whisper-tiny is a weak recognizer, so these numbers only show gross intelligibility.

- **All Kokoro voices:** one of the two errors is always the name ("Kalai's" was heard as "Cali's", or as "Colleys'" in the fixed take). The other is "chatbots" heard as "chatbot's", which is a spelling difference, not a mispronunciation. am_michael also had "in polished" heard as "and polished".
- **Piper joe:** also dropped "a", heard "what" as "but", heard "polished" as "published", and lost the question intonation (no "?" boundaries recovered). That fits its lower naturalness.

## Pronunciation findings (from the G2P phoneme output, not from listening)

**"Kalai's" (should be roughly kuh-LYE / ka-LAI):**
- Raw text is wrong in both G2Ps, which put the stress on the first syllable ("KAL-eyes"):
  - misaki: `kˈælIz`
  - espeak-ng: `kˈælaɪz`
- **Fix 1 (exact, Kokoro/misaki only):** set `"tts_text"` to use misaki's inline phoneme syntax, `[Kalai's](/kəlˈIz/)`. This is used in `kokoro_af_heart_kalai-fixed.wav`, and the word label in the timestamps stays "Kalai's".
- **Fix 2 (respelling that works in either G2P):** `Ka-lie's`.
  - misaki gives `kˌɑlˈIz` (kah-LIE's), which is correct.
  - espeak gives `kˈɑːlˈaɪz`, which is acceptable.
- **Avoid ALL-CAPS respellings like "Kuh-LIE's".** espeak reads the capitals as letters ("kuh-L-I-E's"), and misaki drops the final "s".

**Other words:**
- "2025": misaki says "twenty twenty-five", which is natural. espeak says "two thousand twenty-five".
- "PhD": both read it as "P-H-D", which is correct.
- "that's", "chatbots" and "dissertation" phonemize normally.

## Speech-rate control and timestamps

- **Speed:** Kokoro's `speed` input divides the predicted phoneme durations. Measured for af_heart:

  | speed | duration | WPM |
  |---|---|---|
  | 0.9 | 23.16 s | 145 |
  | 1.0 | 21.96 s | 153 |
  | 1.1 | 20.90 s | 161 |
  | 1.2 | 19.24 s | 175 |

  The steps aren't perfectly linear because durations are rounded to whole frames. Piper has the equivalent control in `--length-scale`.
- **Word timestamps (Kokoro): yes, exact to the model's own timing.** The stock ONNX export has no duration output, so `draft_tts.py --setup` adds one. It exposes the model's predicted per-phoneme durations (Round → Clip → Cast → Gather) as a second output named `duration`. One frame is exactly 600 samples at 24 kHz, so timing resolution is 25 ms. The tool maps phonemes back to words using misaki's tokens and excludes punctuation pauses from word spans. This is the model's own alignment, not ASR, so it matches the audio by construction.
- **Piper:** piper1-gpl includes `patch_voice_with_alignment.py`, which adds phoneme alignments to a voice, but I didn't use it. Piper's VITS also samples noise, so its output is not bit-reproducible unless seeded.
- **Determinism:** Kokoro's graph has no random ops. With a fixed ORT thread count, repeated runs and `--only` regenerations were **bit-identical** (checked with md5).

## Recommendation

**Use Kokoro-82M v1.0, voice `af_heart`, speed 1.0** (153 WPM; use `--speed 1.05` if you want about 157 WPM), with misaki G2P.

- **Quality:** Kokoro-82M is the best-regarded small open-weight TTS model (it topped the TTS Arena among open models at release). In Kokoro's own voice notes, `af_heart` has the highest grade (A) and is described as warm and natural, which suits a conversational explainer.
- **Measurements:** af_heart tied for the fewest recognition errors, had the steadiest level (LRA 2.0 LU) and a good explainer pace.
- **Licensing:** Apache-2.0 for both weights and voice, so it's clean for YouTube.
- **Practical fit:** it supports exact word timestamps, is deterministic and fully offline.

**Alternatives:**
- `af_bella` (grade A−, slightly more animated, 150 WPM) is the second choice.
- If you want a male draft narrator, use `am_michael`. It is noticeably lower-graded (C+ in Kokoro's notes) and slower (143 WPM), so run it at `--speed 1.07` or faster.
- Piper joe is clearly behind: more ASR errors, flat sentence boundaries, and unclear license provenance.

**Before publishing**, someone must listen to the take. Add the Kalai override to every segment that mentions him. Loudness-normalize at the mix stage: raw takes are about −22 LUFS, and YouTube delivery is usually about −14 LUFS.

### Fallbacks I did not audition (a good neural option was found, so they weren't needed)

- **Ubuntu apt (all reachable):**
  - `rhvoice` with English voices: licenses vary per voice, so check each.
  - `festival` with `festvox-us-slt-hts`: the CMU ARCTIC data is permissive.
  - `libttspico-utils` (pico2wave): Apache-2.0, in multiverse.
  - `espeak-ng`.
  - All of these sound more robotic than Kokoro. Avoid `mbrola-*` voices, which mostly forbid commercial use.
- **Other npm finds:**
  - Supertonic 3 (`@3sln/donki-lle-voice-multi`): the model is OpenRAIL-M, which comes with use restrictions. Not tested.
  - Kitten TTS and Pocket TTS: their JS wrappers fetch weights from huggingface.co, which is blocked.

## Reproduce from scratch

```bash
# Python environment (tested with Python 3.13)
python3 -m venv ~/.venvs/tts
~/.venvs/tts/bin/pip install onnxruntime==1.30.0 onnx==1.23.2 numpy soundfile==0.14.0 \
    kokoro-onnx==0.6.1 misaki==0.7.4 num2words spacy==3.8.16 zstandard

# spaCy English model, needed by misaki. Not on PyPI; this pulls it from conda-forge.
# Expected sha256: 27649bd0e680285e186c71d8e3e7ac393a6ead2b857b5fb45e391579280e4121
mkdir -p /tmp/enweb && cd /tmp/enweb
curl -fsSLO https://conda.anaconda.org/conda-forge/noarch/spacy-model-en_core_web_sm-3.8.0-pyhd8ed1ab_0.conda
~/.venvs/tts/bin/python -I -c "import zipfile,zstandard,tarfile,io; z=zipfile.ZipFile('spacy-model-en_core_web_sm-3.8.0-pyhd8ed1ab_0.conda'); n=[x for x in z.namelist() if x.startswith('pkg-')][0]; tarfile.open(fileobj=zstandard.ZstdDecompressor().stream_reader(io.BytesIO(z.read(n))),mode='r|').extractall('x',filter='data')"
cp -r x/site-packages/en_core_web_sm* "$(~/.venvs/tts/bin/python -c 'import site;print(site.getsitepackages()[0])')/"

# Model and voices. Downloads ~330 MB from registry.npmjs.org, verifies the SHA-256,
# adds the duration output, and writes to ~/.cache/draft_tts/kokoro-v1.0 (override with DRAFT_TTS_MODEL_DIR).
#   https://registry.npmjs.org/kokoro-fp32a-shards/-/kokoro-fp32a-shards-1.0.0.tgz
#   https://registry.npmjs.org/kokoro-fp32b-shards/-/kokoro-fp32b-shards-1.0.0.tgz
#   https://registry.npmjs.org/kokoro-fp32c-shards/-/kokoro-fp32c-shards-1.0.0.tgz
#   https://registry.npmjs.org/kokoro-js/-/kokoro-js-1.2.1.tgz
~/.venvs/tts/bin/python tools/draft_tts.py --setup

# Generate (from the project root)
~/.venvs/tts/bin/python tools/draft_tts.py --voice af_heart --speed 1.0
~/.venvs/tts/bin/python tools/draft_tts.py --only s03,s07
```

Piper baseline only:
```bash
pip install piper-tts==1.8.0
# Voice: npm vowel-lab-voices-float@0.1.0 (float.onnx). Write a config JSON using
# piper.phoneme_ids.DEFAULT_PHONEME_ID_MAP, sample_rate 22050, espeak voice "en-us".
```

Speed note: this container is shared and was heavily loaded (load average about 20 on 4 vCPUs). Kokoro fp32 ran at roughly 0.5–2× real time here; a dedicated 4-core CPU usually runs faster than real time.

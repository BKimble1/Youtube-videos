# ElevenLabs premium narration: API notes and runbook

Researched 2026-10-07 from a session that could not reach ElevenLabs: `api.elevenlabs.io` and
`elevenlabs.io` are blocked by network policy (proxy CONNECT returned 403), and no API key was set.
Nothing here was checked against the live API. Every request shape below comes from ElevenLabs'
official SDKs, which are generated from their OpenAPI definition, or from ElevenLabs' official
`skills` repo. Facts that came only from web-search summaries are marked as such. The tool asks the
API for the uncertain values at run time (`GET /v1/models`) and adjusts if the API rejects a
parameter, so a wrong guess here costs a retry rather than a failed run.

## Source key

| Tag | Source | How accessed |
|---|---|---|
| **[SDK]** | `elevenlabs` Python SDK **2.71.0** from PyPI, released 2026-10-05. Wheel sha256 `5dbe0b2b…6d6967f85`. Files are named relative to the package root, e.g. `text_to_speech/raw_client.py`. | Downloaded and read directly |
| **[JS]** | `@elevenlabs/elevenlabs-js` **2.71.0** from npm, released 2026-10-05. Tarball sha256 `6adeb55c…5ec128c740` | Downloaded and read directly |
| **[SKILLS]** | Official ElevenLabs agent-skills repo: `raw.githubusercontent.com/elevenlabs/skills/main/text-to-speech/SKILL.md`, `…/references/voice-settings.md` and `…/references/streaming.md` | Fetched and read directly |
| **[README]** | `raw.githubusercontent.com/elevenlabs/elevenlabs-python/main/README.md`. Outdated: it still lists v3 as the main model. | Fetched and read directly |
| **[SEARCH]** | WebSearch result summaries. The URL is given, but the page was **not** opened because elevenlabs.io is blocked. | Search summary only |

The ElevenLabs docs-source repo (`elevenlabs/elevenlabs-docs`, Fern) returned 404 on every guessed
raw path, so its OpenAPI JSON was not available. The SDKs are the closest primary source.

---

## 1. Models (current as of 2026-10-07)

| model_id | Status | Max chars/request | Voice settings honoured | Continuity | Recommended use |
|---|---|---|---|---|---|
| **`eleven_v4`** | **Exists. GA since 2026-09-28** [SEARCH: elevenlabs.io/docs/changelog/2026/9/28, techcrunch.com/2026/09/28/…]. The id appears in [SDK] `types/tts_conversational_model.py` and [JS] `TtsConversationalModel.d.ts`. [SKILLS] calls it the "**Default.** Highest quality". | 10,000 [SEARCH: "Eleven v4 … 10,000 character limit … double v3"] | **stability, similarity_boost only.** No `style`, no `speed`, no SSML [SKILLS SKILL.md + voice-settings.md] | `previous_text`/`next_text`. [SKILLS] has a request-stitching example with `eleven_v4`. Whether `previous_request_ids` works on v4 is **unclear**: search summaries contradict each other. | **First choice for offline narration.** |
| `eleven_v4_turbo` | Exists, GA 2026-09-28. In [SDK] `v_1_translate_realtime/types/text_to_dialogue_tts_model_id.py` | 10,000 [SEARCH] | stability, similarity_boost [SKILLS] | n/a | Real-time use (~100 ms), via the Text-to-Dialogue WebSocket [SKILLS streaming.md]. **Not for this project.** |
| **`eleven_multilingual_v2`** | Current. Previous generation. [SKILLS]: "most stable on very long-form generations" | 10,000 [SEARCH] | stability, similarity_boost, style, use_speaker_boost, speed [SDK `types/tts_voice_settings.py`]. `language_code` is **not** supported [SDK docstring]. | Full request stitching (`previous_request_ids`, `next_request_ids`, `previous_text`, `next_text`) [SDK docstring] | **Comparison model.** Mature and stable, with speed and style controls. |
| `eleven_v3` | Current. Previous-generation expressive model | 5,000 [SEARCH; one summary said 10,000] | stability only [SDK `types/eleven_v_3_voice_settings.py`], in steps 0.0 / 0.5 / 1.0 (Creative / Natural / Robust) [SEARCH] | Request stitching **not** available [SEARCH] | Optional third comparison. Superseded by v4. |
| `eleven_flash_v2_5` | Current | 40,000 [SEARCH] | stability, similarity_boost, speed [SDK `types/eleven_flash_v_25_voice_settings.py`] | Supported | Low latency, about half the price per character [README]. Not premium. |
| `eleven_turbo_v2_5`, `eleven_turbo_v2`, `eleven_flash_v2` | Superseded by Flash [SKILLS] | | | | Don't use. |

**Eleven v4 summary.** The model id is `eleven_v4`. It is generally available, not alpha. It supports
90+ languages and audio tags, and has stronger voice-clone accuracy [SKILLS; SEARCH]. Pacing and
emotion come from audio tags and punctuation, not from `style` or `speed` [SKILLS voice-settings.md].

**Audio tags.** Free-text directions in square brackets, such as `[curious]`, `[whispers]`, `[laughs]`,
`[sighs]`, `[sarcastic]` and `[pause]`. v4 lets you stack them [SEARCH]. v4 also renders
sound-effect tags such as `[door slams]` and `[light rain]` as sounds [SEARCH], so **don't put
square brackets in narration by accident**. Put tags only in `tts_text`, never in `text`. The tool
removes tags from word timings and from the `previous_text`/`next_text` context.
**SSML** (`<break>`, `<phoneme>`) is not supported on v4 [SKILLS]. Pauses between segments come from
`pause_after_ms`, which `build_timeline.py` inserts.

**Pronunciation.** Respell words in `tts_text` (for example "Kuh-LYE" for Kalai). The tool maps
timings back to the original `text` words. Search summaries say v4 handles inline IPA more reliably,
but this is unverified [SEARCH]. Pronunciation dictionaries can be passed with
`pronunciation_dictionary_locators`, up to 3 per request [SDK]; the tool does not use them yet.

**Checking models at run time.** `python3 tools/elevenlabs_narration.py models` calls
`GET /v1/models`. The response includes `maximum_text_length_per_request` ("Longer requests are
rejected"; the `max_characters_request_*` fields are deprecated), `can_use_style`,
`can_use_speaker_boost`, `requires_alpha_access` and `model_rates.character_cost_multiplier`
[SDK `types/model.py`, `types/model_rates_response_model.py`].

### Voice settings (body field `voice_settings`; [SDK] `types/voice_settings.py`, [SKILLS] voice-settings.md)

| Setting | Range | Default | Notes |
|---|---|---|---|
| `stability` | 0–1 | 0.5 | Lower is more expressive; higher is steadier. |
| `similarity_boost` | 0–1 | 0.75 | Higher stays closer to the source voice but can amplify artefacts. |
| `style` | 0–1 | 0.0 | v2 and v3 only. Non-zero adds latency and can reduce stability. |
| `use_speaker_boost` | bool | true | Not used on v4 [SKILLS]. |
| `speed` | 0.25–4.0 over REST; 0.7–1.2 suggested | 1.0 | Not used on v4. The tool offers `--post-tempo` (ffmpeg atempo, timings rescaled) instead. |

[SKILLS] narration preset for v4: stability 0.7, similarity_boost 0.5. Conversational preset:
stability 0.4, similarity_boost 0.75. **The tool's v4 default is stability 0.6, similarity_boost
0.75**, between those two presets to suit a curious, lightly humorous explainer. Change it after the
audition.

## 2. Endpoints (paths verified in [SDK] raw clients; base `https://api.elevenlabs.io`)

Authentication is the header `xi-api-key: <key>` [SDK `core/client_wrapper.py`]. The SDK's default
key source is `os.getenv("ELEVENLABS_API_KEY")` [SDK `client.py`]. The SDK also defines regional
bases: `api.us.elevenlabs.io` and `api.{eu,in,sg}.residency.elevenlabs.io` [SDK `environment.py`].

| Purpose | Request | Notes |
|---|---|---|
| **TTS with character alignment (used by the tool)** | `POST /v1/text-to-speech/{voice_id}/with-timestamps?output_format=…` | See the request and response details below. |
| TTS, audio bytes only | `POST /v1/text-to-speech/{voice_id}` | Same request body. Streaming versions are `…/stream` and `…/stream/with-timestamps`. |
| Forced alignment (tool's fallback) | `POST /v1/forced-alignment` | Multipart with `file` and `text`. Returns `characters[{text,start,end}]`, `words[{text,start,end,loss}]` and `loss` [SDK `forced_alignment/`]. |
| List and search account voices | `GET /v2/voices` | Params: `search`, `page_size` (up to 100), `next_page_token`, `voice_type` (personal, community, default, workspace, non-default, saved), `category` (premade, cloned, generated, professional), `gender`, `age`, `accent`, `language`, `use_cases`, `voice_ids`… Voice objects have `voice_id`, `name`, `category`, `labels{}`, `description`, `preview_url`, `high_quality_base_model_ids`, `verified_languages` [SDK `voices/raw_client.py`, `types/voice.py`]. |
| One voice | `GET /v1/voices/{voice_id}` | Legacy list: `GET /v1/voices?show_legacy=`. |
| Voice Library (shared voices) | `GET /v1/shared-voices` | Params: `search`, `gender`, `age`, `accent`, `language`, `locale`, `use_cases`, `descriptives`, `featured`, `min_notice_period_days`, `page`, `page_size`. Each result includes `public_owner_id`. |
| Add a Library voice to the account | `POST /v1/voices/add/{public_owner_id}/{voice_id}` | Body `{"new_name": "..."}`. |
| Models | `GET /v1/models` | |
| Subscription / credits | `GET /v1/user/subscription` | Returns `tier`, `character_count` and `character_limit`. |
| Async generation (new) | `POST /v1/flows/text-to-speech` | Body is specific to the model (`eleven_v3`, `eleven_flash_v2_5`, `eleven_multilingual_v2`) [SDK `flows/text_to_speech/`, `types/text_to_speech_generation_request.py`]. Not needed here. |

**With-timestamps request.**
- Query: `output_format`, `enable_logging`, `optimize_streaming_latency`.
- JSON body: `text`, `model_id`, `language_code`, `voice_settings`, `pronunciation_dictionary_locators`
  (up to 3), `seed` (0–4294967295, best-effort determinism), `previous_text`, `next_text`,
  `previous_request_ids` (up to 3), `next_request_ids` (up to 3), `use_pvc_as_ivc`,
  `apply_text_normalization` (auto, on or off), `apply_language_text_normalization` (Japanese only).

**With-timestamps response.** `{"audio_base64": "...", "alignment": {"characters": [...],
"character_start_times_seconds": [...], "character_end_times_seconds": [...]},
"normalized_alignment": {...}}` [SDK `types/audio_with_timestamps_response.py`,
`types/character_alignment_response_model.py`]. `alignment` follows the text as sent;
`normalized_alignment` follows the normalised text.

Two behaviours reported by third parties, both search-only: v4 supports with-timestamps, the
alignment keeps the characters of audio tags, and the last character can end about 80 ms after the
audio. The tool removes tags and clamps timings to the audio length.

**Response headers.** `request-id` (needed for request stitching) and `x-character-count` (characters
billed) [SKILLS "Tracking Costs"]. The JS SDK reads `x-request-id` on errors [JS
`errors/ElevenLabsError.js`]. The tool accepts either header.

**Errors.**
- Body shape: `{"detail": {"status": "...", "message": "..."}}`. FastAPI 422 errors list `detail[]`.
- 401: invalid key, or a key missing a permission.
- 422: invalid parameters.
- 429: rate limit [SKILLS]. 429 bodies include `too_many_concurrent_requests` and `system_busy`.
- 403 with a message such as "pcm_44100 … only allowed for Pro tier and above" when the output format
  needs a higher tier [SEARCH: forum.convai.com].

## 3. Output formats and tiers

Supported values for with-timestamps [SDK
`text_to_speech/types/text_to_speech_convert_with_timestamps_request_output_format.py`]:
- MP3: `mp3_22050_32`, `mp3_24000_48`, `mp3_44100_{32,64,96,128,192}`
- Opus: `opus_48000_{32,64,96,128,192}`
- PCM: `pcm_{8000,16000,22050,24000,32000,44100,48000}`
- WAV: `wav_{8000,16000,22050,24000,32000,44100,48000}`
- Telephony: `ulaw_8000`, `alaw_8000`

Tier requirements:
- **`mp3_44100_192` needs Creator or above.**
- **PCM and WAV at 44.1 kHz need Pro or above** [SDK docstring].
- **`pcm_48000` needs Pro or above** [SKILLS].
- The default, `mp3_44100_128`, works on every tier.
- PCM output is raw 16-bit little-endian mono.

The tool tries **`pcm_48000` → `pcm_44100` → `mp3_44100_192` → `mp3_44100_128`**. If the account
rejects a format, the tool moves to the next one, remembers that for the rest of the run, and records
it in `manifest.json` under `notes`. Every file is then converted with ffmpeg (soxr resampler) to
**48 kHz mono 16-bit WAV**, which is what `build_timeline.py` requires.

## 4. Consistency across segments (request stitching)

- `previous_text`/`next_text` describe the text around the segment.
- `previous_request_ids`/`next_request_ids` (up to 3 each) point to earlier generations. If both are
  sent, the API ignores `previous_text` [SDK docstring].
- Results are best when every segment uses the same model [SDK docstring].
- `next_request_ids` is meant for regenerating one segment that sits between finished neighbours.
- `enable_logging=false` (zero retention, enterprise only) **disables request stitching** [SDK docstring].
- How long request ids stay valid is not documented in the sources read here. If the API rejects the
  ids, the tool switches to text context.

The tool's `--context auto` setting picks continuity per model:

| Model | What the tool sends |
|---|---|
| `eleven_v4` | `previous_text` (up to 1,000 characters of earlier segments) and `next_text` (up to 500 characters of later segments). Audio tags are removed. |
| `eleven_multilingual_v2`, flash | `previous_request_ids` from up to 3 preceding segments in the current take, plus `next_text`. With `--only` regeneration it uses the neighbours' ids from `manifest.json` on both sides. |
| `eleven_v3` | Nothing. Search summaries say request stitching is unsupported. |

You can override this with `--context text|ids|none`. If the API names a parameter it rejects, the
tool drops that parameter for the rest of the run, uses the text equivalent instead, and writes a note
to the manifest.

The same `--seed` across segments gives best-effort determinism [SDK]. Also keep the model and voice
settings the same for every segment.

## 5. Rate limits and costs

- **Credits.** Text-to-speech costs 1 credit per character of `text` for v4 and multilingual v2
  [SEARCH]. Flash and turbo cost about half [README: "50% lower price per character"]. The exact
  multiplier is in `/v1/models` as `model_rates.character_cost_multiplier` [SDK]. The response header
  `x-character-count` gives the characters actually billed [SKILLS].
- **Context billing.** Whether `previous_text`/`next_text` are billed is **unverified**. The tool
  assumes they are not.
- **API list prices per 1,000 characters** [SEARCH: elevenlabs.io/pricing/api summary]: Eleven v4
  $0.08, discounted to $0.022 until 2026-10-12; v4 Turbo $0.04 ($0.011 until 2026-10-12);
  Multilingual v2 $0.08. Subscription plans include monthly credits instead.
- **This video's cost.** The script (`script/narration_segments.json`, 38 segments) is about
  **4,539 characters**, so one full take is about 4.5k credits. An audition of 2 models × 3 voices on
  `audition_text.txt` (589 characters) is about 3.5k credits.
- **Concurrency limits by plan** [SEARCH; several third-party pages agree]: Free 2, Starter 3,
  Creator 5, Pro 10, Scale and Business 15. The tool sends **one request at a time**, so it stays
  under every limit.
- **Retries.** The SDK retries 408, 409, 429 and all 5xx responses with exponential backoff, starting
  at 1 s with a 60 s cap. It honours `retry-after-ms`, `retry-after` and `x-ratelimit-reset` [SDK
  `core/http_client.py`]. The tool does the same, with 6 retries by default.
- **Voice availability.** Search summaries report a recent change to default voices: **all legacy
  "Default" (premade) voices expire on 2026-12-31 and are only available to accounts created before
  March 2026.** New default voices replace them; legacy ids are routed to replacements [SEARCH:
  help.elevenlabs.io "What are Default voices?", elevenlabs.io/docs "What are Legacy voices?"]. The
  audio files you generate stay yours. The problem is regenerating a fix later with the same voice,
  and keeping a consistent voice across future videos.
- **Commercial use.** Rights follow the account's plan: paid plans include a commercial licence, and
  the free tier requires attribution. This is general knowledge and was not verified in this session,
  so check the current ElevenLabs terms before publishing.

## 6. The tool: `tools/elevenlabs_narration.py`

- Python 3.9+ standard library only (urllib); tested on 3.13. It needs `ffmpeg`.
- The key is read **only** from `ELEVENLABS_API_KEY`. It is never printed or written; any echo in an
  error body is redacted.
- The base URL is restricted to `https://*.elevenlabs.io`, or localhost for tests.

| Subcommand | What it does |
|---|---|
| `doctor` | Checks ffmpeg, whether the key is set (the value is never shown), network reachability, subscription tier and credits, and whether `eleven_v4` and `eleven_multilingual_v2` are listed. |
| `models` | Prints `GET /v1/models`: ids, limits, style and speaker-boost support, cost multiplier. |
| `list-voices` | Account voices: `voice_id`, `name`, `category`, labels (gender, age, accent, descriptive, use_case), `hq_models`, `description`. Add `--search`, `--voice-type default` or `--category premade` to filter, or `--shared` for the Voice Library. Use `--json` to save the full objects. |
| `add-shared-voice` | Adds a Voice Library voice to the account. |
| `audition` | Writes `auditions/<model>__<voice>.wav` (48 kHz mono) and `auditions/auditions_summary.csv` with model, voice_id, voice_name, file, duration_s, characters, chars_per_second, output_format, voice_settings, seed, request_id and status. |
| `narrate` | See the details below. |

**`narrate` reads `script/narration_segments.json`.** For each segment it:
1. Sends `tts_text` if present, otherwise `text`.
2. Calls with-timestamps, adding continuity context and the output-format fallbacks.
3. Writes these files to `audio/narration/elevenlabs/`:
   - `<id>.wav` (48 kHz mono)
   - `<id>.alignment.json` (raw character alignment in seconds)
   - `<id>.words.json`: `[{word,start,end}]`, **exactly one entry per `text.split()` token**, so
     `build_timeline.py` uses the engine timings
   - `raw/<id>.<pcm|mp3>`, the original API audio, so files can be re-converted without paying again
4. Updates `manifest.json` after every segment.

**Manifest shape.** `manifest.json` follows `draft_tts.py`'s shape:
- Top level: `engine:"elevenlabs"`, `model`, `voice_id`, `voice_name`, `voice`, `settings{…}`,
  `sample_rate`, `paths_relative_to:"manifest_dir"`, `complete`, `missing_segments`, `notes`.
- Each entry in `segments[]`: `id`, `file`, `duration_s`, `words_file`, `alignment_file`,
  `pause_after_ms`, `text`, `tts_text`, `output_format`, `voice_settings`, `request_id`.
- `pause_after_ms` is **not** baked into the WAV files; `build_timeline.py` inserts it.

**`narrate` options.**

| Option | Effect |
|---|---|
| `--only s03,s07` | Regenerates those segments and keeps the rest of the take. Refuses to mix voices or models. |
| `--skip-existing` | Resumes: skips segments whose audio already matches the text and settings. |
| `--dry-run` | Prints every request's URL and JSON with the key left out. Needs no key and no network. |
| `--seed N` | Best-effort determinism. |
| `--post-tempo 0.95` | Slows or speeds the audio with ffmpeg and rescales the timings. |
| `--context` | Overrides the continuity mode. |
| `--output-format` | Sets the preferred output format. |
| `--force` | Skips the credit and model-listing checks. |

**What `narrate` checks before spending credits.**
- The key is set; if not, it exits with code 3 and prints the fix.
- ffmpeg is installed.
- The model is listed in `/v1/models`, and each segment is within the model's character limit.
- The voice exists.
- The estimated credits are within the account's remaining credits.

**Network failures.** If the host is blocked (proxy CONNECT 403), unresolvable or refuses the
connection, the tool exits with code 4 and prints the fix: add the key as an environment
variable/secret and allow `api.elevenlabs.io`.

**Exit codes.** 0 ok, 2 usage, 3 no key, 4 network, 5 API, 6 audio, 7 input.

**Automatic fallbacks.** Retries on 429, 5xx and network errors; output-format fallback; dropping a
named parameter the API rejects; request ids → text context; with-timestamps unsupported → plain TTS
plus `/v1/forced-alignment`.

### Tested offline in this session (`python3 -m unittest discover -s tools/tests -v`: 47 tests, all pass; 1 live-network test is skipped unless `RUN_LIVE_NETWORK_TESTS=1`)

- **Argument parsing**, including range checks and the speaker-boost flags.
- **Segments JSON**: valid input, duplicate or invalid ids, empty text, negative pauses, missing or
  broken files, `--only` validation.
- **Words from character alignment**, using a synthetic fixture with punctuation, `[tags]`, a lone em
  dash, ms-unit variants, timings clamped past the end of the audio, an unclosed bracket, `tts_text`
  respellings mapped back to display words with difflib, and split or inserted words.
- **Profiles and request bodies**: v4 drops style and speed; v3 stability snaps to 0, 0.5 or 1;
  `/v1/models` refines the profile; context building in text and ids modes, with truncation;
  output-format chains; error-body parsing; key redaction; the base-URL guard; retry-delay
  calculation.
- **ffmpeg**: synthetic PCM at 44.1 and 48 kHz and an MP3 converted to 48 kHz mono WAV, an atempo
  check, and a broken input that must raise an error.
- **Missing key**: run as a subprocess, it exits with code 3 and prints the remediation.
- **Blocked host**: a simulated proxy 403 and DNS failure exit with code 4 and print the remediation.
  The tool was also run against the real `api.elevenlabs.io` here, which the proxy blocks: exit 4,
  with the message `Tunnel connection failed: 403 Forbidden … host blocked by network policy`. A
  fake sentinel key never appeared in any output.
- **Dry run**: the request JSON omits the key.
- **End-to-end against a local mock of the ElevenLabs API**: a 429 followed by a 500 are retried; a
  tier-restricted `pcm_48000` falls back to `pcm_44100`; v4 receives `previous_text`/`next_text`;
  multilingual v2 receives `previous_request_ids` (`--only s02` adds the neighbours' ids on both
  sides); a rejected parameter is dropped; with an MP3 tier and no timestamps the tool uses MP3 plus
  forced alignment; `--skip-existing` makes zero calls; a voice mismatch is refused; a missing voice,
  a 401 and a credit shortfall stop the run before any TTS call; audition writes 4 WAVs and the CSV;
  `list-voices` follows pagination; `doctor` and `models` work.
- **Integration**: the real 38-segment `script/narration_segments.json` was narrated through the mock
  into a scratch copy of the project. The project's own `tools/build_timeline.py --engine elevenlabs`
  then accepted the manifest, and **all 38 segments used engine word timings** rather than estimated
  ones.

**Not testable here:** real audio quality, real error wording (the fallbacks match on parameter
names, `output_format`, tier and "timestamp"), real v4 behaviour with `previous_text` and
`request-id`, and real credit use.

---

## How to generate premium narration

Run these on a machine or session that has `ELEVENLABS_API_KEY` set **and** can reach
`api.elevenlabs.io`. In a cloud session, add the secret and network allowance, then start a **new**
session. Run everything from the project root, `/home/user/Youtube-videos/AI_Confidence_Video_01`.

```bash
# 0. Pre-flight: ffmpeg, key present (value hidden), network, tier/credits, eleven_v4 listed
python3 tools/elevenlabs_narration.py doctor
python3 tools/elevenlabs_narration.py models            # confirm eleven_v4 limits and multiplier

# 1. Find candidate voices (see the audition plan below)
python3 tools/elevenlabs_narration.py list-voices --json audio/narration/elevenlabs/voices.json
python3 tools/elevenlabs_narration.py list-voices --voice-type default
python3 tools/elevenlabs_narration.py list-voices --shared --language en --use-case informative_educational --limit 50

# 2. Audition: 2 models x 3 voices on the script excerpt (~3.5k credits). Check the requests first:
python3 tools/elevenlabs_narration.py audition --dry-run \
  --models eleven_v4,eleven_multilingual_v2 --voices VOICE_ID_1,VOICE_ID_2,VOICE_ID_3 \
  --text-file audio/narration/elevenlabs/audition_text.txt
python3 tools/elevenlabs_narration.py audition --seed 1234 \
  --models eleven_v4,eleven_multilingual_v2 --voices VOICE_ID_1,VOICE_ID_2,VOICE_ID_3 \
  --text-file audio/narration/elevenlabs/audition_text.txt
#    -> audio/narration/elevenlabs/auditions/<model>__<voice>.wav + auditions_summary.csv
#    Optional v4 settings variant (more lively / steadier):
python3 tools/elevenlabs_narration.py audition --models eleven_v4 --voices BEST_VOICE \
  --stability 0.45 --text-file audio/narration/elevenlabs/audition_text.txt --out-dir audio/narration/elevenlabs/variant_s045

# 3. Full narration with the chosen model and voice (~4.5k credits). The one command:
python3 tools/elevenlabs_narration.py narrate --model eleven_v4 --voice BEST_VOICE --seed 1234
#    (Comparison model instead: --model eleven_multilingual_v2 [--style 0.1 --speed 0.98])
#    Interrupted? Re-run with --skip-existing. Inspect requests without spending: add --dry-run.

# 4. Fix individual lines (pronunciation via "tts_text" in script/narration_segments.json, or a bad take)
python3 tools/elevenlabs_narration.py narrate --model eleven_v4 --voice BEST_VOICE --seed 1234 --only s05,s19

# 5. Switch the pipeline from the draft voice to ElevenLabs
python3 tools/build_timeline.py --engine elevenlabs
```

To test the tool itself: `python3 -m unittest discover -s tools/tests -v`. This needs no key and no
network.

### Recommended audition plan

The brief is a warm, articulate, conversational English narrator who conveys curiosity and dry,
restrained humour. **Do not use or imitate a voice that is named after, or designed to sound like, a
real creator.** Skip Voice Library voices whose name or description references a real person.

1. **List what this account actually has.** Run `list-voices --voice-type default` and `list-voices
   --search narrat`. Shortlist voices whose labels include `use_case` narration, narrative_story or
   informative_educational, and `descriptive` such as warm, conversational, articulate or friendly.
   Prefer voices whose `hq_models` column includes `eleven_v4`, or that have been tested with it.
   Listen to `preview_url` in `voices.json` before spending credits.

2. **Pick 3 that differ from each other**, for example one warm British male, one American male, one
   warm female. These **default (premade) voices** come from the SDK and skills examples and from
   search results. They exist only on some accounts, so confirm each one appears in `list-voices`:

   | Voice | voice_id | Character | Source |
   |---|---|---|---|
   | **George** | `JBFqnCBsd6RMkjVDRZzb` | Male, warm British storyteller ("narrative") | [SDK] examples; [SKILLS] |
   | **Brian** | `nPczCjzI2devNBz1zQrb` | Male, American, deep narration | [SEARCH only] |
   | **Matilda** | id from `list-voices` | Female, American, friendly, narration | [SEARCH only] |

   Alternates: Daniel `onwK4e9ZLuTAKqWW03F9` (British, authoritative) [SKILLS]; Charlotte
   `XB0fDUnXU5powFXDhCwa` (conversational) [SKILLS]; Sarah `EXAVITQu4vr4xnSDxMaL` (soft) [SKILLS];
   Liam (young American, articulate) and Lily (warm British female) [SEARCH].

   **Caveat [SEARCH]:** these legacy default voices reportedly **expire on 2026-12-31** and exist
   only on accounts created before March 2026. If the channel will reuse the narrator after that
   date, or the account is newer, choose from the **new default voices** instead. Names reported by
   search include Eddie, Darian, Talia, Caleb, Warren, Lawrence, Sawyer, Wyatt, Finley, Florence,
   Maisie and Elowen; get their ids from `list-voices`. Alternatives are a Voice Library voice with a
   long notice period, added with `add-shared-voice`, or an account-owned voice made with Voice
   Design.

3. **Run** `audition` with `eleven_v4,eleven_multilingual_v2` × the 3 voices and the same `--seed`.
   That is 6 files.

4. **Judge.** Listen blind if you can. Check:
   - warmth, and whether the questions in the excerpt sound genuinely curious;
   - the dry timing of the last line ("It works pretty well on people, too.");
   - names and numbers: "Kalai", "Carnegie Mellon, 2002", "MIT";
   - breaths and artefacts;
   - pace: compare `chars_per_second` in the CSV; 14–16 is comfortable for an explainer.

5. **Tune.** On v4, try `--stability` 0.45, 0.6 and 0.7. If the pace is too fast, use
   `--post-tempo 0.96`. On multilingual v2, try `--style` 0–0.15 and `--speed` 0.95–1.0. Then run
   `narrate` with the winning model, voice, settings and seed. Fix individual lines with `--only` and
   `tts_text` respellings.

## Open uncertainties

- **v4 and `previous_request_ids`.** Search summaries contradict each other. The tool uses text
  context on v4 and adjusts if the API objects.
- **v4 `use_speaker_boost`.** [SKILLS] says v4 uses only stability and similarity_boost, so the tool
  doesn't send `use_speaker_boost` on v4.
- **v4 with-timestamps.** Support is known only from search. If unsupported, the tool falls back to
  plain TTS plus forced alignment, which may cost extra.
- **Exact error wording** for tier-restricted formats and unsupported parameters was not observed
  first-hand. The tool's matching is deliberately broad, and each fallback is recorded in
  `manifest.json` under `notes`.
- **Not verified:** the character limits for v3 (5,000 vs 10,000), promo prices, concurrency per
  plan, the default-voice expiry, and whether context text is billed.

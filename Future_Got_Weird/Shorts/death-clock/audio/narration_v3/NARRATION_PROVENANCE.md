# V3 narration: provenance, audition, selection and edit

The V3 brief replaces the V1/V2 98-word lock with a 136-word script (the first sentence unchanged) and asks for a
fast, interested, conversational read of about 186-195 wpm during speech, almost continuous, with no habitual
dramatic gaps, in the same voice, without large time-stretches. The script is `script/narration_v3.json`; the
text sent to the model is `tts_input.txt` (the script plus three direction tags: `[fast]`, `[interested]` and
`[curious]` before the final question; checked with `tools/check_tts_text.py`: PASS, 5/5 blocks exact).

**Nobody has listened to any of these takes.** This environment has no audio playback. Every choice below was
made by measurement and must be confirmed by ear (see "Listening checks still needed").

## Voice and generation

| Item | Detail |
|---|---|
| Voice | ElevenLabs Test Voice, `voice_id kk5XaSLo2XAw0sKM98zU` (the voice of V1 and V2) |
| Model | `eleven_v4` (its schema exposes no speed parameter; pace was set with direction tags) |
| Flow | `m2Pyn9dxqMB3w9eeZby3` |

## Audition: the opening paragraph + the emergency paragraph (52 words), three deliveries x 4

Measured in `audition/AUDITION_ANALYSIS.json` (`tools/voice_audition.py`).
A = `[quickly] [matter of fact]`, B = `[briskly] [conversational]`, C = `[fast] [interested]`. (The fourth C
variation, C2, was still generating when the others were downloaded and was not fetched.)

| Take | Speech span | Rate over span | Median pitch | Pitch range |
|---|---|---|---|---|
| A1 | 15.30 s | 204 wpm | 151 Hz | 12.7 st |
| A2 | 15.43 s | 202 wpm | 154 Hz | 13.1 st |
| A3 | 15.43 s | 202 wpm | 151 Hz | 12.6 st |
| A4 | 15.69 s | 199 wpm | 151 Hz | 12.8 st |
| B1 | 15.70 s | 199 wpm | 154 Hz | 13.2 st |
| B2 | 15.87 s | 197 wpm | 152 Hz | 12.7 st |
| B3 | 15.85 s | 197 wpm | 153 Hz | 13.2 st |
| B4 | 15.98 s | 195 wpm | 151 Hz | 13.1 st |
| C1 | 15.89 s | 196 wpm | 152 Hz | 12.3 st |
| C3 | 15.90 s | 196 wpm | 153 Hz | 12.6 st |
| C4 | 15.37 s | 203 wpm | 153 Hz | 12.8 st |

All three deliveries run 195-204 wpm across the passage in the voice's natural register (151-154 Hz; V1's
`[urgently]` take sat at 203-212 Hz). Gaps between sentences were 0.4-0.5 s, inside sentences 0.2-0.3 s.
B and C were closest to the target rate and were taken to full takes.

## Full takes (136 words), B and C x 4

Measured in `takes/TAKES_ANALYSIS.json`. Over the long text the model left 0.3-0.6 s between most sentences, so
every take ran 46.9-47.7 s, over the 45.47 s picture limit, although the speech itself ran at about 209 wpm
(about 39 s of speech, about 8 s of gaps).

| Take | Speech span | Median pitch | Pitch range | Level spread p10-p90 |
|---|---|---|---|---|
| B1 | 47.40 s | 151 Hz | 12.2 st | 18.1 dB |
| B2 | 46.75 s | 155 Hz | 12.6 st | 18.2 dB |
| B3 | 47.27 s | 151 Hz | 12.2 st | 18.0 dB |
| B4 | 47.71 s | 151 Hz | 12.7 st | 18.0 dB |
| C1 | 47.08 s | 150 Hz | 11.3 st | 18.3 dB |
| C2 | 47.17 s | 161 Hz | 12.4 st | 18.4 dB |
| C3 | 47.24 s | 153 Hz | 12.7 st | 17.7 dB |
| C4 | 46.91 s | 153 Hz | 12.6 st | 17.9 dB |

**Selected: C4** (`[fast] [interested]`), generation `pWhwT8eZU9ybLzm60jKR`: the shortest span of the C
delivery, which matches the brief's "fast, interested" wording, with a natural pitch (153 Hz) and a moderate
level spread. C1 and C3 were transcribed as alternates.

**Verification:** blind `eleven_scribe_v1` transcriptions (no prompt) of C4, C1 and C3
(`takes/C4_scribe_blind_words.json`). All three return every word in order except that all three are heard as
"would you **wanna** know?" for "would you want to know?": at this pace the voice reduces "want to" in every
take. This is ordinary conversational English, so the take was kept rather than splicing a phrase from another
generation; captions and the SRT keep the script's "want to". It is a listening check below. Other differences
are spelling only ("nanosensors", "42", a colon).

## Edit (`tools/build_voice_v3.py`)

Every gap longer than its target was shortened by removing silence from its quietest stretch (the gaps sit at
about -86 dBFS; no breath was inside any of them); 5 ms crossfades at each join. Gaps already at or under target
(the five short comma pauses, 0.14-0.21 s) were kept as recorded. No word was cut, stretched, sped up or
pitch-shifted. Every gap is listed in `VOICE_EDIT_LOG.json` and in `script/CUE_SHEET_V3.md`.

Result: `narration_final_48k.wav`, mono 48 kHz 24-bit, **45.000 s = 1350 frames** (the picture length).
2.38 s of silence removed. Speech from 0.04 s to 44.52 s: 44.48 s,
**183.5 wpm over the whole span** (about 209 wpm inside phrases). Longest gap 0.32 s.
The tail after "know?" (0.48 s) and the take's 0.04 s lead-in form the loop seam:
0.52 s from the end of "know?" to the start of "This" on replay.

`narration_words_final.json` holds the edited word times (Scribe times shifted by the removed silence; "wanna"
is split at its midpoint into "want" and "to"); the film's timeline, captions and sound cues are built from it.

## Credits (tool-reported)

Audition 12 takes about 3,896; full takes 8 about 6,939; blind Scribe x3 about 779. Total about 11,614.

## Listening checks still needed

1. The opening line at frame 0: does "This device" start cleanly over the warning transient, and is the read interested rather than announcer-like?
2. Overall pace: fast and connected, but still clear on a phone speaker? Are any of the shortened sentence gaps (0.24-0.32 s) audibly clipped or breathless?
3. "nano-sensors", "cellular decay", "lethal rhythm", "life expectancy, forty-two years": pronunciation.
4. "would you wanna know?": acceptable as natural speech, or should the final question be regenerated?
5. The loop seam: "know?" ending, 0.52 s, then "This device" on replay: natural, no clipped syllable.

# Narration voice audition (ElevenLabs)

**Selected voice: Marcus K** (`3H55HGnNE1XjYxigHSAS`), model **Eleven v4** (`eleven_v4`).

## Set-up

Three voices from the workspace library were chosen for a technology-documentary read
(conversational, clear, curious, not promotional). Each read the **same excerpt** on `eleven_v4`,
4 takes per voice (12 takes total, ~25-28 s each). The excerpt covers the cold-open hook and the
first technical explanation:

> Researchers asked three popular chatbots one simple question: What was the title of Adam
> /kəˈlaɪz/ dissertation?
>
> Three polished answers. Not one had the right title… or even the right year.
>
> A language model writes in tokens: chunks of text. Some are whole words. Some are fragments.
> Each token is really a number. And at every step, the model scores every possible next token.

`/kəˈlaɪz/` is an inline IPA pronunciation for "Kalai's" (Eleven v4 supports IPA between slashes).

| Voice | Voice ID | Files |
|---|---|---|
| Marcus K | `3H55HGnNE1XjYxigHSAS` | `marcusk_t1..t4.mp3` |
| Craig | `JZ5PEPqtr05GbBRBqPhz` | `craig_t1..t4.mp3` |
| Grounded Woman | `6eEQXEFYsrOsaQlOdxlJ` | `grounded_t1..t4.mp3` |

The MP3s are kept out of plain Git (media files are Git LFS patterns and LFS storage is not reachable
from the production session); they are preserved in the split-part backup under `backup/`.

## Measurements

Produced by `tools/eval_takes.py` (raw output: `eval.json`) and ElevenLabs Scribe (`scribe_blind.json`).

| Take | Dur. (s) | WPM overall | WPM speaking | Pauses >180 ms | F0 median (Hz) | F0 range 10-90 (st) | F0 SD (st) | Intensity SD (dB) | HNR (dB) | Pause floor (dBFS) | LUFS | Whisper-tiny WER |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| marcusk_t1 | 25.20 | 151.5 | 192.6 | 11 | 97.0 | 13.61 | 5.83 | 6.76 | 8.2 | -61.0 | -27.1 | 0.079 |
| **marcusk_t2** | 25.12 | 151.9 | 188.0 | 10 | 96.4 | 13.12 | 5.24 | 6.48 | 7.8 | -60.8 | -27.2 | 0.032 |
| marcusk_t3 | 24.88 | 153.5 | 192.9 | 10 | 96.7 | 13.16 | 5.73 | 6.70 | 7.9 | -60.2 | -27.0 | 0.032 |
| marcusk_t4 | 25.28 | 150.9 | 190.2 | 11 | 96.6 | 12.79 | 5.44 | 6.70 | 7.8 | -60.7 | -26.8 | 0.032 |
| craig_t1 | 25.36 | 149.1 | 163.6 | 7 | 133.6 | 13.76 | 5.04 | 4.48 | 4.9 | -46.5 | -23.5 | 0.175 |
| craig_t2 | 25.60 | 147.7 | 149.9 | 1 | 132.6 | 13.87 | 5.59 | 4.55 | 4.6 | -45.1 | -23.5 | 0.175 |
| craig_t3 | 25.60 | 148.9 | 168.0 | 9 | 136.9 | 12.94 | 5.30 | 4.62 | 4.2 | -47.3 | -23.5 | 0.254 |
| **craig_t4** | 25.20 | 150.0 | 166.5 | 8 | 132.1 | 14.77 | 5.38 | 4.60 | 4.5 | -47.0 | -23.3 | 0.127 |
| grounded_t1 | 27.92 | 135.4 | 159.0 | 10 | 202.6 | 10.02 | 4.63 | 5.28 | 13.0 | -54.7 | -28.7 | 0.032 |
| grounded_t2 | 27.92 | 135.4 | 157.4 | 9 | 201.5 | 9.30 | 4.36 | 5.25 | 12.6 | -55.8 | -28.6 | 0.032 |
| **grounded_t3** | 28.48 | 132.7 | 157.8 | 10 | 202.2 | 8.90 | 4.75 | 5.19 | 12.3 | -59.9 | -28.8 | 0.032 |
| grounded_t4 | 27.92 | 136.4 | 160.4 | 10 | 202.3 | 9.27 | 4.59 | 5.15 | 12.0 | -56.1 | -28.8 | 0.032 |

**Blind transcription with ElevenLabs Scribe** (best take per voice, in bold above, uploaded as a plain
audio file so the recogniser had no access to the prompt): **0 % word error rate for all three**, and
"Kalai's" was recognised correctly every time. The Whisper-tiny errors for Craig ("chat box",
"Adden") therefore reflect the very small local model, not unclear diction.

Note: running Scribe directly on a TTS generation returns the *prompt text* with timings (a forced
alignment), not an independent transcription. That mode is used later for word timing, never as an
intelligibility check.

## How to read the numbers

- **WPM overall** (pauses included) is the pace the viewer experiences. ~140-160 suits explanatory
  narration.
- **F0 range / SD** (semitones) measure intonation movement. Higher means a more expressive read;
  ~8-9 st begins to sound flat over several minutes.
- **Intensity SD** is the loudness contrast between stressed and unstressed words.
- **HNR** is voice clarity. Low values mean a breathy or raspy texture.
- **Pause floor** is the level in the gaps between phrases. Under music, a floor near -45 dBFS
  accumulates into audible hiss or room tone; about -60 dBFS is effectively silent.

## Decision

**Marcus K** is selected:

- Intelligibility is joint best (0 % blind Scribe WER).
- It has the most intonation movement and loudness contrast (13 st range, 6.5-6.8 dB intensity SD), which keeps a ten-minute explanation lively without sounding like an advert.
- The cleanest pause floor (about -61 dBFS) means nothing builds up under the music and sound effects.
- About 152 wpm overall, with 10-11 deliberate pauses, gives a documentary pace that leaves room for the visuals.
- Its delivery is consistent across all four takes, which matters for a narration generated in many blocks.

**Craig** has comparable pace and intonation, but a pause floor about 14 dB noisier and a low HNR (about 4.5 dB, a breathy or raspy texture). One take (t2) also ran its sentences together with only one internal pause.

**Grounded Woman** is very clear (HNR about 12 dB) and clean, but has the narrowest intonation (about 9 st) and the slowest pace (about 135 wpm). Over the full video it would read calmer and flatter than the brief asks for.

**Still to do by ear (human):** the measurements cannot judge timbre preference or whether a
read *sounds* sincere. Please listen to `marcusk_t2.mp3`, `craig_t4.mp3` and `grounded_t3.mp3`
side by side; if you prefer another voice, the narration pipeline only needs its voice ID swapped.

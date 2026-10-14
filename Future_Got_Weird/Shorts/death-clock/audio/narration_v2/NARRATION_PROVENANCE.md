# V2 narration: provenance, audition and edit

The V2 brief asked for a less theatrical read ("interested, direct, controlled, matter-of-fact with light tension"), connected phrasing and fewer pauses, with the same 98 locked words in five blocks. V1's narration (`audio/narration/`) is kept unchanged for recovery.

**Nobody has listened to any of these takes.** This environment has no audio playback. Every choice below was made by measurement and must be confirmed by ear (see "Listening checks still needed").

## Voice and generation

| Item | Detail |
|---|---|
| Voice | ElevenLabs **Test Voice**, `voice_id kk5XaSLo2XAw0sKM98zU` (same voice as V1, resolved from the account's voice list) |
| Model | `eleven_v4` |
| Flow | `m2Pyn9dxqMB3w9eeZby3` |
| Text | The five locked blocks from `script/narration_locked.json`, verbatim. Inline direction tags only: `[matter of fact]` at the start and `[curious]` before the final question. |

## Audition (opening line + the long emergency-services sentence, 31 words)

Three deliveries, four variations each (`audition/`, measured in `audition/AUDITION_ANALYSIS.json`):

| Delivery | Tag | Takes | Speech span | Rate | Median pitch | Pitch range (p10–p90) |
|---|---|---|---|---|---|---|
| Untagged | none | A1–A4 | 11.44–11.65 s | 160–163 wpm | 159–163 Hz | 11.7–12.6 st |
| Matter-of-fact | `[matter of fact]` | B1–B4 | 11.26–11.38 s | 163–165 wpm | 157–161 Hz | 11.5–12.3 st |
| Curious | `[curious]` | C1–C4 | 11.28–11.58 s | 161–165 wpm | 164–166 Hz | 11.3–12.2 st |

For comparison, V1's `[urgently]` opening ran 191–194 wpm at 203–212 Hz, and the `[calm] [ominous]` alternative ran at 111–114 Hz with a 4–5 semitone range. All three V2 deliveries sit in the natural register of the voice, at the 150–170 wpm the brief suggests.

`[matter of fact]` was chosen for the body of the script: it had the most connected phrasing (the shortest internal gaps) without the raised pitch of `[curious]`. `[curious]` was kept for the final question only, to give it the light tension the brief asks for.

## Full take

Four variations of the full locked narration (`takes/`, measured in `takes/TAKES_ANALYSIS.json`): 35.5–35.8 s each, 164.6–166.3 wpm over the speech span, all with the same 13-phrase structure and natural gaps of 0.16–0.57 s.

**Selected: V4**, generation `R4IDiVOYhLW115iOIYDT` (35.84 s raw). It had the lowest level spread (17.5 dB p10–p90, the steadiest, least "performed" dynamics) and no gap longer than 0.57 s.

**Verification:** a blind `eleven_scribe_v1` transcription of V4 (no prompt, `V4_scribe_blind_words.json`) returned all 98 words in order. The only differences are spelling ("nanosensors" for "nano-sensors") and one comma.

## Edit (`tools/build_voice_v2.py`)

V4 already runs at a connected pace, so most of its gaps are kept as recorded. Only the gaps that carry a planned picture-and-sound event are lengthened, each to the length that event needs. The method is the same as V1: digital silence is inserted at the quietest 20 ms of the existing gap (about −86 dBFS there). No word is cut, stretched, sped up or pitch-shifted, and no global silence remover was used.

| # | Between | Recorded | Edited | What fills it |
|---|---|---|---|---|
| 1 | "…dying." / "It works…" | 0.43 s | 1.65 s | The camera tips from the wrist toward the band's underside and a section opens in the arm |
| 2 | "…skin." / "These sensors…" | 0.44 s | 1.10 s | The sensor stream reaches the vessel; one hero sensor is singled out |
| 3 | "bloodstream," / "monitoring" | 0.18 s | kept | |
| 4 | "…decay." / "If your organs…" | 0.49 s | 1.75 s | The hero sensor's signal; pull back along the vessel to the same man, opened in section |
| 5 | "fail," / "or" | 0.16 s | 0.30 s | A comma breath inside the sentence |
| 6 | "rhythm," / "the device" | 0.33 s | 0.70 s | A comma breath inside the sentence; the heart quivers and its signal leaves for the arm |
| 7 | "…exact second." / "This gives you…" | 0.44 s | 1.80 s | Red 00:02:14 holds; his eyes find the screen, the wrist turns, the hand reacts |
| 8 | "…seek help." / "The device automatically…" | 0.48 s | 0.95 s | The diagnostic resolves and the blue alert ring leaves the band |
| 9 | "data," / "potentially" | 0.33 s | kept | One connected emergency-services sentence |
| 10 | "…consciousness." / "But if…" | 0.57 s | 3.30 s | Treatment pulse and internal response, breathing, he plants a hand and sits up; the band turns green |
| 11 | "But" / "if" | 0.20 s | kept | |
| 12 | "starts," / "would" | 0.26 s | 0.45 s | A comma breath; attention moves from the green readout to his worried face |

Inside a sentence the gaps stay short (0.18–0.70 s). The longer gaps are all at sentence ends, where the picture has an action and a sound for them. V1 lengthened three mid-sentence gaps to 0.7–1.1 s, including 1.1 s after "data," inside the emergency-services sentence. V2 keeps that one as recorded (0.33 s) and holds the other two to 0.70 s and 0.45 s.

Tail after "know?": 1.4 s (the local "?" glitch, his uneasy reaction and a short ending).

Result: `narration_final_48k.wav`, mono 48 kHz 24-bit, **45.46 s**, first sound at 0.03 s (first word "This" at 0.12 s), last word ending at 44.06 s, 8.40 s of silence added in total. V1 added 8.19 s to a take with longer natural gaps and left a 2.85 s tail. Every gap is listed in `VOICE_EDIT_LOG.json`. `narration_words_final.json` holds the edited word times; the film's timeline, captions and sound cues are built from it.

## Credits (tool-reported)

Audition about 2,616 (12 takes), full take about 2,688 (4 takes), blind Scribe 197. Total about 5,500.

## Listening checks still needed

1. Is the `[matter of fact]` read interested and lightly tense, rather than flat or bored?
2. The opening line: does "exactly when you are dying" land without the V1 trailer gravitas?
3. The long emergency-services sentence: is it one connected phrase, with "potentially" intact?
4. Pronunciation of "nano-sensors", "cellular decay" and "life expectancy".
5. Gaps 1, 4, 7 and 10 (the longest): do they sound intended once the picture and effects fill them?
6. The final question: does `[curious]` sound like a question, with "know" intact?

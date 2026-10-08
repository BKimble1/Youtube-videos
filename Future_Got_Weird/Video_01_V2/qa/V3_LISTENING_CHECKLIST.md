# Video 01 V3 · listening checklist (owner)

**Nobody has listened to this audio yet.** The production environment has no audio playback, so the V3 audio was
checked only by measurement: loudness, true peak, joins, clicks, speech-band masking and the stems. That is not a
listening review. This list is the V2 audio audit (`qa/v3_inspect/audio/`, measurements in `measurements.json`)
updated for what V3 changed; items marked **V3** describe the current mix in the V3 renders.

**How to listen.** Play `exports/Future_Got_Weird_Video_01_V3_1080p_REVIEW.mp4` (or `source/public/audio/mix.wav`) on headphones at a comfortable level. Then play
items 1–13 again on a phone speaker. Tick an item when it passes. If it fails, use the fix given with it. Each fix is
a single cue gain or offset (the cues are defined in `source/src/scenes/S*.tsx`), followed by
`python3 tools/mix_v2.py --sfx-db -2 --sfx-duck-db 4`.

**Measured and clean, so not listed:** V3 mix −16.01 LUFS integrated, −1.30 dBTP true peak (4× oversampled), as V2.
No clicks, DC steps or truncated word endings were found at any of the 35 narration joins. No breaths were doubled or
lost at the joins, because the takes contain no breath noise above −54 dB relative to the voice. The voice is the V2
Test Voice (kk5XaSLo2XAw0sKM98zU, eleven_v4; median F0 160 Hz, against 97 Hz for Marcus K).

## Kalai, each occurrence (target: /kəˈlaɪ/, "kuh-LIE")

- [ ] **1. 0:05 – "…title of Adam Kalai's dissertation?"** (s01, take x01_t4). **Highest risk.** This take has no blind
  transcript. It replaced x01_t1, which a blind transcription heard as "Kelle's", and it measures almost the same as
  that take: the pitch falls through the word, and the /aɪ/ glide is similar (F2 874→1885 Hz). *If wrong:* audition
  x01_t2 and x01_t3, which are already recorded (`audio/narration/v2/takes/`, word at 4.64 s). Switch s01 only if a
  take is clearly right. Line length changes by 40 ms or less.
- [ ] **2. 2:05 – "Here's the actual record. Kalai's thesis…"** (s17, x09_t4). Second-highest risk, for the same
  reason. This take has no blind transcript, and it replaced x09_t3 ("Koller's"), which measures almost identically. *If wrong:*
  audition x09_t1 first. Its line is 0.08 s longer; x09_t2 is 0.56 s shorter and would shift every later cue.
- [ ] **3. 0:20 – "And Adam Kalai?"** (s04, x02_t1). The blind transcript heard "Kalai", with a rising question.
- [ ] **4. 0:55–0:58 – "In GPT-4o's tokenizer, 'Kalai' comes out as 'Kal' and 'ai.'"** (s09, x04_t1). The blind
  transcript heard this correctly. Check that "Kal" (/kæl/) and "ai" (/aɪ/) match the tiles that split on screen.
- [ ] **5. 3:58 – "Is there a thesis by Adam Kalai at Carnegie Mellon?"** (s31, x15_t1). The blind transcript heard
  "Kalai".

## The three dry deliveries and the jokes

- [ ] **6. 0:24–0:27 – "Very professional… Very fictional."** The delivery sits about 6 semitones below the line
  before it. The pause between the halves is 0.36 s, and the music drops by 14 dB. The punchline stamp (0:26.27) is
  17 dB under the voice, inside "fictional". Check that it reads as deadpan and that the pause is long enough.
- [ ] **7. 2:23–2:26 – "A confident font… is still just a font."** This is the quietest line in the film (−20.1 LUFS;
  the median line is −18.9), with 1.0 s of room after it. Check that it isn't too soft or flat on a phone.
- [ ] **8. 2:57–3:01 – "One lucky guess. Three wrong answers… Somehow, a trophy."** The trophy clink (+2 dB cue,
  3:00.63) lands on the "tr-" of "trophy". Check that the word stays clear and the comic pause holds.
- [ ] **9. 4:31–4:35 – "Works on chatbots. Works pretty well on people, too."** The stamp and gavel (4:34.03) hit
  inside the vowel of "too" (4:33.91–4:34.13). **V3:** both are now 3 dB lower. *If the word still sounds clipped:* move the cue f8221 to f8225 (+4 frames)
  together with the visual stamp contact in S10.
- [ ] **10. 1:58–2:02 – "'is entitled.' No 'I think.' No 'maybe.'"** The blind transcript of this take heard
  "No, I think. No, maybe". Check that the quoted phrases sound like quotes.

## Stamp hits

- [ ] **11. 4:10–4:13 – "Source exists. Claim fails. Stamp it."** The claim_fails effect is the loudest effect that
  plays under speech: −19.2 LUFS against a voice of −13.4 to −15.8, where the other stamps sit 10 LU or more below the
  voice. It makes this one of the three loudest moments in the film (−11.9 LUFS momentary). The stamp at 4:12.50 hits the
  final "t" of "it". The "s" of "Source" and "Stamp" is the strongest sibilant in the film. **V3:** claim_fails is now −5 dB (peak −2.1 dBFS in the mix, was −1.3). *If it still competes:* −8 dB.
- [ ] **12. 0:16–0:17 – "None of them are right."** Three WRONG stamps (0:16.20, 0:16.53, and a heavy one at 0:16.93)
  fall on the line. The heavy stamp covers the final "t" of "right". Check that "right" still reads.
- [ ] **13. 3:45–3:47 – "…not necessarily more correct. None of it is a guarantee."** Four stamps play here. The NO
  GUARANTEE stamp (+2 dB cue, 3:46.80) is the loudest stamp in the film (peak −8.6 dBFS) and lands on "gua-". **V3:** now 0 dB, level with the other heavy stamps. Check that it still lands.

## Joins measured as the riskiest (all measured clean; listen for a change in tone or a clipped onset)

- [ ] **14. 2:12 – "…May 2001. | ChatGPT got the university right."** This is the only place where the take changes
  inside a section (x09_t4 → x09_t3). The level changes by −0.3 LU and the pitch by −0.8 semitones. Listen for a
  change in room, tone or energy.
- [ ] **15. 0:14 – "…Llama gave a third. | Three different answers."** The new take starts speaking 15 ms into its
  own file. Listen for a clipped "Th-".
- [ ] **16. 1:49 – "…to work it out from. | So the model does what it was built to do."** The same issue applies to
  "So", which starts 20 ms in.

## Timing, masking and balance

- [ ] **17. 4:35–4:48 – End tail (V3 changed).** V2 had no music in the last ~7.5 s. In V3 the end-card string pad
  sustains from 4:35.3 under "New episodes twice a week, if you'd like to subscribe" and the end card (about
  −33 LUFS after the last word), with one soft vibes note at 4:43.0, and fades to silence on the last frame. Check that
  it sits under the voice, that the end feels finished rather than cut, and that the fade has no step. *If you prefer
  the silent V2 ending:* revert the end-pad lines in `compose()` and the hold/fade block in `main()` of
  `tools/make_music_v2.py` (commit `b42e00a`), then re-run `make_music_v2.py` and `mix_v2.py`.
- [ ] **18. 0:00–0:02 – Opening.** The room tone and music fade in over 0.4–0.5 s. A hanging-sign click starts at
  0:00.09, and the first word starts at 0:00.52. Check for a clean start with no thump, and that the voice doesn't come
  in too early.
- [ ] **19. 2:53–2:55 – "Four options each, so on average, one lands. Seven points."** This is the busiest masking
  spot in the film: three wrong-answer buzzers and a ding play over the phrase. **V3:** the buzzers are now −5 dB and the ding −2 dB. Check that the phrase is clear and the gag still reads.
- [ ] **20. 3:11–3:13 – "six, plus one, minus three. Four. The trophy walks back."** The score flip sits on the "F" of
  "Four", and the music swells immediately after. Check that the arithmetic timing lands.
- [ ] **21. 1:12–1:14 – the 1.1 s pause after "…which chunk is likely."** This is the longest pause inside any line,
  and the music drops under it. Check that it feels deliberate rather than like a dropout.
- [ ] **22. 0:05–0:06 – the bell on "…dissertation?"** (0:05.90). It comes within 5 dB of the end of the word in the
  speech band for 30 ms. **V3:** the bell is now −4 dB. *If still smeared:* −7 dB.
- [ ] **23. 1:22 – "…sometimes web search."** A machine clunk (0 dB cue, 1:21.87) plays on "search". **V3:** now −4 dB. *If still masked:* −7 dB.
- [ ] **24. Evidence scenes: S5 2:03–2:26, S7 3:15–3:33, S9 3:47–4:13.** The music measures −42, −40 and −46 LUFS,
  which is 26–30 LU under the voice. Under speech it is effectively inaudible. In the pauses it is faint (S7's pauses
  reach −34 LUFS). Check that it doesn't sound like the music has dropped out. Also check that the drop at 3:15 (game
  show music falls 13 dB in 0.6 s) is smooth, and that the S10 music entrance at 4:13 (hard cut) feels intended.
- [ ] **25. 0:42–0:44 – the S2 brand sting in the 2.2 s gap.** Its logo hit is the loudest single effect in the film
  (−14.7 dBFS over 20 ms), although the mix stays at −18.3 LUFS momentary. Check that it isn't startling.
- [ ] **26. 3:48–3:50 – "The unglamorous move: check."** This is the loudest and highest-pitched line (+1.9 LU and
  6.4 semitones above the lines around it). Check that it matches the delivery around it, and that the lever clunk
  (3:49.80) only touches the final "k".

## V3 additions

- [ ] **27. 2:14.9 – "ChatGPT got the university right."** The indicator_yes chime now plays with the ✓ chip (f4045, −8 dB)
  instead of with the removed slip tick. Check that it does not stack harshly with the chip pop one frame earlier.
- [ ] **28. 4:24.8 – "So when an answer matters,"** the paper slide under "matters" is now −8 dB. Check the word is clear.
- [ ] **29. Whole film, phone speaker.** One normal-speed pass with picture: sync, joke timing ("Very fictional",
  "just a font", "Somehow, a trophy", "Works pretty well on people, too") and the S6 arithmetic landing on "Four".

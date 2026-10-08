# Video 01 V2 → V3 · listening checklist (owner)

**Nobody has listened to this audio yet.** This audit had no audio playback. It measured the approved V2 mix
(`audio/mix/v2/final_mix.wav`, which is byte-identical to `source/public/audio/mix.wav`) and its three stems, but
loudness, click, join and masking numbers do not replace a listen. The numbers behind each item are in
`measurements.json`, in this folder.

**How to listen.** Play `final_mix.wav` (or the V3 review render) on headphones at a comfortable level. Then play
items 1–13 again on a phone speaker. Tick an item when it passes. If it fails, use the fix given with it. Each fix is
a single cue gain or offset (the cues are defined in `source/src/scenes/S*.tsx`), followed by
`python3 tools/mix_v2.py --sfx-db -2 --sfx-duck-db 4`.

**Measured and clean, so not listed:** integrated loudness −16.01 LUFS, true peak −1.30 dBTP (4× oversampled), LRA 2.4 LU.
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
  inside the vowel of "too" (4:33.91–4:34.13). *If the punchline word sounds clipped:* move the stamp_heavy and gavel
  cue f8221 to f8225 (+4 frames), together with the visual stamp contact in S10. Alternatively, lower both by 3 dB.
- [ ] **10. 1:58–2:02 – "'is entitled.' No 'I think.' No 'maybe.'"** The blind transcript of this take heard
  "No, I think. No, maybe". Check that the quoted phrases sound like quotes.

## Stamp hits

- [ ] **11. 4:10–4:13 – "Source exists. Claim fails. Stamp it."** The claim_fails effect is the loudest effect that
  plays under speech: −19.2 LUFS against a voice of −13.4 to −15.8, where the other stamps sit 10 LU or more below the
  voice. It makes this one of the three loudest moments in the film (−11.9 LUFS momentary). The stamp at 4:12.50 hits the
  final "t" of "it". The "s" of "Source" and "Stamp" is the strongest sibilant in the film. *If the effect competes
  with the line:* change claim_fails (S9, f7522) from 0 dB to −5 dB.
- [ ] **12. 0:16–0:17 – "None of them are right."** Three WRONG stamps (0:16.20, 0:16.53, and a heavy one at 0:16.93)
  fall on the line. The heavy stamp covers the final "t" of "right". Check that "right" still reads.
- [ ] **13. 3:45–3:47 – "…not necessarily more correct. None of it is a guarantee."** Four stamps play here. The NO
  GUARANTEE stamp (+2 dB cue, 3:46.80) is the loudest stamp in the film (peak −8.6 dBFS) and lands on "gua-". *If it
  bites:* change cue f6804 from +2 dB to 0 dB, which matches the other five heavy stamps.

## Joins measured as the riskiest (all measured clean; listen for a change in tone or a clipped onset)

- [ ] **14. 2:12 – "…May 2001. | ChatGPT got the university right."** This is the only place where the take changes
  inside a section (x09_t4 → x09_t3). The level changes by −0.3 LU and the pitch by −0.8 semitones. Listen for a
  change in room, tone or energy.
- [ ] **15. 0:14 – "…Llama gave a third. | Three different answers."** The new take starts speaking 15 ms into its
  own file. Listen for a clipped "Th-".
- [ ] **16. 1:49 – "…to work it out from. | So the model does what it was built to do."** The same issue applies to
  "So", which starts 20 ms in.

## Timing, masking and balance

- [ ] **17. 4:35–4:48 – End tail.** The end chord starts at 4:35.3 and has died out by about 4:41. The words "…if
  you'd like to subscribe" (4:39–4:42.8) have almost no music under them. After that come 5.4 s of near-silence, with
  eight soft end-card ticks between 4:43 and 4:47, and there is no music at all in the last 7.2 s. Decide whether this
  is the clean ending you want or sounds like dead air. *If it is dead air:* in `tools/make_music_v2.py`, `compose()`,
  hold a tonic after the last word:
  `ev['strings'] += [(P['final'] + 0.2, 5.2, n, 30) for n in (60, 64, 67)]` and
  `ev['vibes'].append((P['final'] + 0.25, 4.0, 72, 34))`. The chord then starts at 4:42.77 and rings into the
  existing 2.5 s fade. Re-render the bed, null-test it against the current bed before 4:42.5, and re-mix.
- [ ] **18. 0:00–0:02 – Opening.** The room tone and music fade in over 0.4–0.5 s. A hanging-sign click starts at
  0:00.09, and the first word starts at 0:00.52. Check for a clean start with no thump, and that the voice doesn't come
  in too early.
- [ ] **19. 2:53–2:55 – "Four options each, so on average, one lands. Seven points."** This is the busiest masking
  spot in the film: three wrong-answer buzzers and a ding play over the phrase. *If the phrase is hard to follow:*
  lower buzzer_wrong (f5190, f5201, f5212) from −1 to −5 dB, and ding_right (f5231) from +2 to −2 dB.
- [ ] **20. 3:11–3:13 – "six, plus one, minus three. Four. The trophy walks back."** The score flip sits on the "F" of
  "Four", and the music swells immediately after. Check that the arithmetic timing lands.
- [ ] **21. 1:12–1:14 – the 1.1 s pause after "…which chunk is likely."** This is the longest pause inside any line,
  and the music drops under it. Check that it feels deliberate rather than like a dropout.
- [ ] **22. 0:05–0:06 – the bell on "…dissertation?"** (0:05.90). It comes within 5 dB of the end of the word in the
  speech band for 30 ms. *If the end of the question is smeared:* change bell_ding (S1, f177) from 0 to −5 dB.
- [ ] **23. 1:22 – "…sometimes web search."** A machine clunk (0 dB cue, 1:21.87) plays on "search". *If the word is
  masked:* change the cue (S3, f2456) from 0 to −5 dB.
- [ ] **24. Evidence scenes: S5 2:03–2:26, S7 3:15–3:33, S9 3:47–4:13.** The music measures −42, −40 and −46 LUFS,
  which is 26–30 LU under the voice. Under speech it is effectively inaudible. In the pauses it is faint (S7's pauses
  reach −34 LUFS). Check that it doesn't sound like the music has dropped out. Also check that the drop at 3:15 (game
  show music falls 13 dB in 0.6 s) is smooth, and that the S10 music entrance at 4:13 (hard cut) feels intended.
- [ ] **25. 0:42–0:44 – the S2 brand sting in the 2.2 s gap.** Its logo hit is the loudest single effect in the film
  (−14.7 dBFS over 20 ms), although the mix stays at −18.3 LUFS momentary. Check that it isn't startling.
- [ ] **26. 3:48–3:50 – "The unglamorous move: check."** This is the loudest and highest-pitched line (+1.9 LU and
  6.4 semitones above the lines around it). Check that it matches the delivery around it, and that the lever clunk
  (3:49.80) only touches the final "k".

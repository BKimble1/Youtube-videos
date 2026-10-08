# Why AI Is So Confidently Wrong — final script (V2 (2026-10-07))

695 spoken words in 36 segments · runtime 4:48.23 (8647 frames at 30 fps) · narration: ElevenLabs eleven_v4, voice “Test Voice” (kk5XaSLo2XAw0sKM98zU). Timings are the speech starts of the selected takes (`source/src/data/timeline.json`, engine `v2`).

Text below is the display / subtitle text. The Eleven v4 prompts (delivery tags, IPA) are in `script/narration_segments.json` (`tts`). Pronunciation: Kalai = “kuh-LIE” (/kəˈlaɪ/).

On-screen labels name every model and date; the claim-to-source ledger and the description's Sources list support each claim.


## Scene 1 — The counter (hook)  ·  0:00.0–0:27.2

**[0:00.5] s01** Three popular AI models were asked one question: what was the title of Adam Kalai's dissertation?

**[0:06.6] s02** ChatGPT handed over a full title, a university, and a year. DeepSeek gave a different title. Llama gave a third.

**[0:14.3] s03** Three different answers. None of them are right. Not one even had the right year.

**[0:19.7] s04** And Adam Kalai? He's the lead author of the paper that reported this test.

**[0:24.2] s05** Very professional. Very fictional.


## Scene 2 — The short version (title moment and promise)  ·  0:27.2–0:44.0

**[0:27.6] s06** So how can a wrong answer sound that sure? Here's the short version.

**[0:32.3] s07** A chatbot is built to write what's likely to come next. Checking whether it's true is a different job. And some of the tests used to grade these systems quietly reward guessing.


## Scene 3 — The token machine (mechanism)  ·  0:44.0–1:26.4

**[0:44.3] s08** Let's take ChatGPT's answer apart.

**[0:46.8] s09** A language model builds text out of tokens: chunks that are sometimes whole words, sometimes fragments. In GPT-4o's tokenizer, “Kalai” comes out as “Kal” and “ai.”

**[0:58.4] s10** At every step, the model scores all the possible next chunks and picks one. Then it goes again. Token after token, an answer rolls out.

**[1:07.6] s11** Here, it's choosing the last digit of the year. Those scores say which chunk is likely. They do not say which one is true.

**[1:16.2] s12** Modern chatbots add more on top: instruction training, step-by-step reasoning, sometimes web search. But the words still come out this way, one piece at a time.


## Scene 4 — The library (patterns in, pattern-shaped answers out)  ·  1:26.4–2:03.2

**[1:26.8] s13** So why would the likely answer be wrong? Think about what the model learned from.

**[1:31.7] s14** The sound of a dissertation title is everywhere. “Methods.” “Algorithms.” “Machine Learning.” Shelf after shelf, the same shape.

**[1:40.9] s15** But one specific researcher's title? That might show up rarely, or not at all. And like a birthday, there's no pattern to work it out from.

**[1:49.6] s16** So the model does what it was built to do. It fills the gap with a title-shaped answer. And the confidence comes with it, because that's part of the pattern too. “Is entitled.” No “I think.” No “maybe.”


## Scene 5 — The record (the real thesis)  ·  2:03.2–2:26.5

**[2:03.5] s17** Here's the actual record. Kalai's thesis: “Probabilistic and On-line Methods in Machine Learning.” Carnegie Mellon, May 2001.

**[2:12.7] s18** ChatGPT got the university right. The year was off by one. The title was invented. And every detail came out looking exactly as solid as the true one.

**[2:22.9] s19** A confident font is still just a font.


## Scene 6 — The game show (the quiz and the scoring rule)  ·  2:26.5–3:14.8

**[2:26.9] s20** Now, why guess at all? Why not just say “I don't know”? The researchers argue that part of the answer is how models get graded.

**[2:34.8] s21** Picture a ten-question quiz. Right answer: one point. Wrong answer: zero. “I don't know”: also zero.

**[2:42.8] s22** Two contestants. Both know six answers. The honest one leaves the other four blank. Six points.

**[2:49.5] s23** The guesser takes a shot at all four. Four options each, so on average, one lands. Seven points.

**[2:56.6] s24** One lucky guess. Three wrong answers. Somehow, a trophy.

**[3:02.0] s25** Now change one rule. A wrong answer costs a point. The honest one: still six. The guesser: six, plus one, minus three. Four. The trophy walks back.


## Scene 7 — Benchmarks (Table 2)  ·  3:14.8–3:33.8

**[3:15.1] s26** The researchers checked ten widely used benchmarks in mid-2025. Nine graded strictly right or wrong, with no credit at all for “I don't know.”

**[3:25.2] s27** Train and rank models on tests like that, and guessing pays. It's one explanation, not the whole story. But it is a simple one.


## Scene 8 — What helps, and what it does not guarantee  ·  3:33.8–3:47.6

**[3:34.1] s28** So what helps? Search and retrieval, when they bring the real record into the room. Reasoning, sometimes. Turning down the randomness makes answers more consistent, not necessarily more correct. None of it is a guarantee.


## Scene 9 — Verify (two questions)  ·  3:47.6–4:13.2

**[3:47.9] s29** The unglamorous move: check.

**[3:50.4] s30** Two questions. Does the source exist? And does it actually say this?

**[3:55.1] s31** Take the ChatGPT slip. Is there a thesis by Adam Kalai at Carnegie Mellon? Yes. Does it say “Boosting, Online Algorithms,” 2002? No. It says “Probabilistic and On-line Methods,” 2001.

**[4:09.4] s32** Source exists. Claim fails. Stamp it.


## Scene 10 — Payoff and end card  ·  4:13.2–4:48.2

**[4:13.6] s33** So why is AI so confidently wrong? Because sounding right comes from patterns in language, and being right takes evidence the model doesn't always have.

**[4:23.4] s34** So when an answer matters, don't ask whether it sounds right. Ask what the evidence is, and whether it actually says this.

**[4:31.0] s35** Works on chatbots. Works pretty well on people, too.

**[4:35.1] s36** This is Future Got Weird. AI moves fast; we make it make sense. New episodes twice a week, if you'd like to subscribe.

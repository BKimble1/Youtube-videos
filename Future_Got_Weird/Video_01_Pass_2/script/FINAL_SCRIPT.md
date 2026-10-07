# Why AI Is So Confidently Wrong — final script (pass-2 v1.0 (2026-10-07))

694 spoken words · measured runtime 280.8 s with the elevenlabs narration (ElevenLabs Eleven v4, voice Marcus K; timings below are from the final takes).

Pronunciation: Kalai = “kuh-LIE”. On-screen labels name every model and date; see research/sources.md for each claim.


## Scene 1 — The counter (hook)

**[0:00.5] s01** Three popular AI models were asked one question: what was the title of Adam Kalai's dissertation?

**[0:06.9] s02** ChatGPT handed over a full title, a university, and a year. DeepSeek gave a different title. Llama gave a third.

**[0:14.8] s03** Three polished answers. All wrong. Not one even had the right year.

**[0:20.0] s04** And Adam Kalai? He's the lead author of the paper that reported this test.

**[0:24.5] s05** Very professional. Very fictional.


## Scene 2 — The short version (title moment and promise)

**[0:27.7] s06** So how can a wrong answer sound that sure? Here's the short version.

**[0:32.5] s07** A chatbot is built to write what's likely to come next. Checking whether it's true is a different job. And some of the tests used to grade these systems quietly reward guessing.


## Scene 3 — The token machine (mechanism)

**[0:44.7] s08** Let's take ChatGPT's answer apart.

**[0:47.3] s09** A language model builds text out of tokens: chunks that are sometimes whole words, sometimes fragments. In GPT-4o's tokenizer, “Kalai” comes out as “Kal” and “ai.”

**[0:59.5] s10** At every step, the model scores all the possible next chunks and picks one. Then it goes again. Token after token, an answer rolls out.

**[1:08.0] s11** Here, it's choosing the last digit of the year. Those scores say which chunk is likely. They do not say which one is true.

**[1:15.6] s12** Modern chatbots add more on top: instruction training, step-by-step reasoning, sometimes web search. But the words still come out this way, one piece at a time.


## Scene 4 — The library (patterns in, pattern-shaped answers out)

**[1:25.8] s13** So why would the likely answer be wrong? Think about what the model learned from.

**[1:30.8] s14** The sound of a dissertation title is everywhere. “Methods.” “Algorithms.” “Machine Learning.” Shelf after shelf, the same shape.

**[1:39.9] s15** But one specific researcher's title? That might show up rarely, or not at all. And like a birthday, there's no pattern to work it out from.

**[1:47.9] s16** So the model does what it was built to do. It fills the gap with a title-shaped answer. And the confidence comes with it, because that's part of the pattern too. “Is entitled.” No “I think.” No “maybe.”


## Scene 5 — The record (the real thesis)

**[2:00.8] s17** Here's the actual record. Kalai's thesis: “Probabilistic and On-line Methods in Machine Learning.” Carnegie Mellon, May 2001.

**[2:10.1] s18** ChatGPT got the university right. The year was off by one. The title was invented. And every detail came out looking exactly as solid as the true one.

**[2:20.1] s19** A confident font is still just a font.


## Scene 6 — The game show (the quiz and the scoring rule)

**[2:23.5] s20** Now, why guess at all? Why not just say “I don't know”? The researchers argue that part of the answer is how models get graded.

**[2:31.4] s21** Picture a ten-question quiz. Right answer: one point. Wrong answer: zero. “I don't know”: also zero.

**[2:39.4] s22** Two contestants. Both know six answers. The honest one leaves the other four blank. Six points.

**[2:46.0] s23** The guesser takes a shot at all four. Four options each, so on average, one lands. Seven points.

**[2:52.8] s24** One lucky guess. Three wrong answers. Somehow, a trophy.

**[2:57.6] s25** Now change one rule. A wrong answer costs a point. The honest one: still six. The guesser: six, plus one, minus three. Four. The trophy walks back.


## Scene 7 — Benchmarks (Table 2)

**[3:10.3] s26** The researchers checked ten widely used benchmarks in mid-2025. Nine graded strictly right or wrong, with no credit at all for “I don't know.”

**[3:19.7] s27** Train and rank models on tests like that, and guessing pays. It's one explanation, not the whole story. But it is a simple one.


## Scene 8 — What helps, and what it does not guarantee

**[3:28.1] s28** So what helps? Search and retrieval, when they bring the real record into the room. Reasoning, sometimes. Turning down the randomness makes answers more consistent, not necessarily more correct. None of it is a guarantee.


## Scene 9 — Verify (two questions)

**[3:42.3] s29** Which leaves the unglamorous move: check.

**[3:45.4] s30** Two questions. Does the source exist? And does it actually say this?

**[3:50.4] s31** Take the ChatGPT slip. Is there a thesis by Adam Kalai at Carnegie Mellon? Yes. Does it say “Boosting, Online Algorithms,” 2002? No. It says “Probabilistic and On-line Methods,” 2001.

**[4:04.5] s32** Source exists. Claim fails. Stamp it.


## Scene 10 — Payoff and end card

**[4:08.2] s33** So why is AI so confidently wrong? Because sounding right comes from patterns in language, and being right takes evidence the model doesn't always have.

**[4:17.8] s34** So when an answer matters, don't ask whether it sounds right. Ask what the evidence is, and whether it actually says this.

**[4:24.8] s35** Works on chatbots. Works pretty well on people, too.

**[4:28.8] s36** This is Future Got Weird. AI moves fast; we make it make sense. New episodes twice a week, if you'd like to subscribe.

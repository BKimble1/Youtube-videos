# Why AI Sounds Right When It's Wrong — final script (v2.0 (2026-10-07, ElevenLabs final narration))

785 spoken words · measured runtime 318.5 s with the elevenlabs narration (ElevenLabs Eleven v4, voice Marcus K; timings below are from the final takes).

Pronunciation: Kalai = “kuh-LIE”. On-screen labels name every model and date; see research/sources.md for each claim.


## Act 1 — The contradiction

**[0:00.5] s01** Researchers asked three popular chatbots one simple question: What was the title of Adam Kalai's dissertation?

**[0:07.8] s02** ChatGPT answered, “Boosting, Online Algorithms, and Other Topics in Machine Learning.” Carnegie Mellon, 2002.

**[0:15.6] s03** DeepSeek gave a different title, at Harvard, in 2005. Llama gave a third, at MIT, in 2007.

**[0:23.4] s04** Three polished answers. Not one had the right title, or even the right year.

**[0:28.8] s05** And Adam Kalai? He's the paper's lead author.

**[0:32.1] s06** Meanwhile, Google DeepMind published solutions to five of the six problems at the 2025 International Mathematical Olympiad, credited to a different model, Gemini Deep Think.

**[0:42.8] s07** So how can the same kind of technology take on olympiad problems, and still sound this sure while being this wrong?

**[0:49.9] s07b** Short answer: a chatbot writes what's likely, and likely isn't always true. To see why, let's take one answer apart.


## Act 2 — Where the answer comes from (Inside the sentence)

**[0:58.1] s08** Here's part of ChatGPT's answer.

**[1:00.5] s09** A language model writes in tokens: chunks of text. Some are whole words. Some are fragments. “Kalai” becomes “Kal” and “ai.”

**[1:10.8] s10** Each token is really a number. At every step, the model turns the tokens so far into a numerical picture of the context, and scores every possible next token.

**[1:21.1] s11** Here, it's choosing the last digit of the year. One option gets picked, added to the end, and the loop runs again, token after token.

**[1:29.5] s12** Because there's a pick, the same question can come out differently. Asked for Kalai's birthday, “only if you know,” one model gave three different dates in three tries.

**[1:39.7] s13** Here's the key part. Those scores measure how likely a piece of text is to come next. Not how likely it is to be true.

**[1:47.3] s14** Modern chatbots add more: instruction training, step-by-step reasoning, sometimes web search. But the answer itself is still written token by token.


## Act 3 — Why good wording can hide an error (The convincing wrong answer)

**[1:57.4] s15** So why would the likely answer be wrong? Look at what the model had to learn.

**[2:02.4] s16** What a dissertation title sounds like is everywhere: “Methods,” “Algorithms,” “Machine Learning,” again and again.

**[2:10.2] s17** Famous facts repeat, too. The paper notes that models rarely miss something like Einstein's dissertation title.

**[2:16.8] s18** But one researcher's thesis title might appear rarely in the training data. Maybe once. Maybe never. Like a birthday, there's no pattern to work it out from.

**[2:26.6] s19** So the model fills the gap with what a title usually looks like, and the confidence comes along for free. “Is entitled.” No “I think,” no “maybe.” That tone isn't a readout of what the model knows.

**[2:39.1] s20** Here's ChatGPT's answer next to the actual record. Spot the difference?

**[2:44.7] s21** Same university. The wrong year: it was 2001. And a different title. The invented details look exactly as solid as the true one.


## Act 4 — The surprising incentive (The incentive experiment)

**[2:54.1] s22** So why guess at all? Why not say, “I don't know”? The researchers argue part of the answer is how models get graded.

**[3:01.5] s23** Picture a ten-question quiz. Right answer: one point. Wrong answer: zero. “I don't know”: also zero.

**[3:09.5] s24** Two test-takers each know six answers. The honest one says “I don't know” to the rest. Six points.

**[3:16.0] s25** The guesser takes a shot at all four. With four choices each, on average one lands. Seven points. The guesser wins, with three confident wrong answers.

**[3:26.1] s26** Now change one rule. A wrong answer costs a point.

**[3:29.9] s27** The honest one: still six. The guesser: six, plus one, minus three. Four. Bluffing loses.

**[3:38.2] s28** When the researchers checked ten popular benchmarks, nine graded strictly right or wrong, with zero credit for “I don't know.” Train and rank models on tests like that, and guessing pays.

**[3:49.6] s29** Their fix: state the penalty for wrong answers up front, so admitting uncertainty can win. It's one explanation, not the whole story, but a surprisingly simple one.


## Act 5 — What improves the situation

**[4:00.2] s30** So what actually helps? Start with the unglamorous move: check the record.

**[4:05.7] s31** Here's Kalai's actual thesis. “Probabilistic and On-line Methods in Machine Learning.” Carnegie Mellon, May 2001.

**[4:13.9] s32** And checking means more than spotting a citation. Does the source exist, and does it actually say this?

**[4:20.5] s33** Inside one Claude model, Anthropic researchers found a default circuit for “I can't answer.” Recognizing a familiar name switches it off.

**[4:29.8] s34** When that recognition misfires, when a name seems familiar but the facts aren't there, the model can produce a plausible guess. Knowing a name isn't knowing the facts.

**[4:39.9] s35** Search, retrieval, and longer reasoning can help when they bring in the right evidence. Turning down the randomness makes answers more consistent, not necessarily more correct. None of it is a guarantee.


## Act 6 — The payoff

**[4:51.7] s36** So why does AI sound right when it's wrong? Because sounding right comes from patterns in language, and being right takes evidence the model doesn't always have.

**[5:02.1] s37** So when an answer matters, don't ask whether it sounds right. Ask: what's the evidence, and does it actually say this?

**[5:10.1] s38** It works on chatbots. It works pretty well on people, too.

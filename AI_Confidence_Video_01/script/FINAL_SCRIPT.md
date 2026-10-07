# Why AI Sounds Right When It's Wrong — final script (v1.1 (2026-10-07, fact-check fixes))

773 spoken words · measured runtime 300.1 s with the draft_local narration (timings below are from that measured take; they will shift slightly with the premium voice).

Pronunciation: Kalai = “kuh-LIE”. On-screen labels name every model and date; see research/sources.md for each claim.


## Act 1 — The contradiction

**[0:00.5] s01** Researchers asked three popular chatbots one simple question: What was the title of Adam Kalai's PhD dissertation?

**[0:08.3] s02** ChatGPT answered, “Boosting, Online Algorithms, and Other Topics in Machine Learning.” Carnegie Mellon, 2002.

**[0:16.3] s03** DeepSeek gave a different title, at Harvard, in 2005. Llama gave a third, at MIT, in 2007.

**[0:24.1] s04** Three polished answers. Not one had the right title, or even the right year.

**[0:28.7] s05** And Adam Kalai? He's the paper's lead author.

**[0:32.0] s06** Meanwhile, Google DeepMind reported that a different language model reached gold-medal level at the International Mathematical Olympiad.

**[0:40.6] s07** So how can AI be that capable, and still sound this sure while being this wrong?

**[0:45.5] s07b** Short answer: a chatbot writes what's likely, and likely isn't always true. To see why, let's take one answer apart.


## Act 2 — Where the answer comes from (Inside the sentence)

**[0:52.7] s08** Here's part of ChatGPT's answer.

**[0:55.0] s09** A language model writes in tokens: chunks of text. Some are whole words. Some are fragments. “Kalai” becomes “Kal” and “ai.”

**[1:03.1] s10** Each token is really a number. At every step, the model turns the tokens so far into a numerical picture of the context, and scores every possible next token.

**[1:13.4] s11** Here, it's choosing the last digit of the year. One option gets picked, added to the end, and the loop runs again, token after token.

**[1:21.7] s12** Because there's a pick, the same question can come out differently. Asked for Kalai's birthday, “only if you know,” one model gave three different dates in three tries.

**[1:31.7] s13** Here's the key part. Those scores measure how likely a piece of text is to come next. Not how likely it is to be true.

**[1:39.1] s14** Modern chatbots add more: instruction training, step-by-step reasoning, sometimes web search. But the answer itself is still written token by token.


## Act 3 — Why good wording can hide an error (The convincing wrong answer)

**[1:49.0] s15** So why would the likely answer be wrong? Look at what the model had to learn.

**[1:53.0] s16** What a dissertation title sounds like is everywhere: “Methods,” “Algorithms,” “Machine Learning,” again and again.

**[2:00.1] s17** Famous facts repeat, too. The paper notes that models rarely miss something like Einstein's dissertation title.

**[2:07.0] s18** But one researcher's thesis title might appear rarely in the training data. Maybe once. Maybe never. Like a birthday, there's no pattern to work it out from.

**[2:16.2] s19** So the model fills the gap with what a title usually looks like, and the confidence comes along for free. “Is entitled.” No “I think,” no “maybe.” That tone isn't a readout of what the model knows.

**[2:28.4] s20** Here's ChatGPT's answer next to the actual record. Spot the difference?

**[2:34.3] s21** Same university. The wrong year: it was 2001. And a different title. The invented details look exactly as solid as the true one.


## Act 4 — The surprising incentive (The incentive experiment)

**[2:43.9] s22** So why guess at all? Why not say, “I don't know”? The researchers argue part of the answer is how models get graded.

**[2:50.9] s23** Picture a ten-question quiz. Right answer: one point. Wrong answer: zero. “I don't know”: also zero.

**[2:57.5] s24** Two test-takers each know six answers. The honest one says “I don't know” to the rest. Six points.

**[3:03.6] s25** The guesser takes a shot at all four. With four choices each, on average one lands. Seven points. The guesser wins, with three confident wrong answers.

**[3:13.4] s26** Now change one rule. A wrong answer costs a point.

**[3:17.0] s27** The honest one: still six. The guesser: six, plus one, minus three. Four. Bluffing loses.

**[3:23.4] s28** When the researchers checked ten popular benchmarks, nine graded strictly right or wrong, with zero credit for “I don't know.” Train and rank models on tests like that, and guessing pays.

**[3:35.0] s29** Their fix: state the penalty for wrong answers up front, so admitting uncertainty can win. It's one explanation, not the whole story, but a surprisingly simple one.


## Act 5 — What improves the situation

**[3:45.8] s30** So what actually helps? Start with the unglamorous move: check the record.

**[3:50.4] s31** Here's Kalai's actual thesis. “Probabilistic and On-line Methods in Machine Learning.” Carnegie Mellon, May 2001.

**[3:58.5] s32** And checking means more than spotting a citation. Does the source exist, and does it actually say this?

**[4:04.9] s33** Inside one Claude model, Anthropic researchers found a default circuit for “I can't answer.” Recognizing a familiar name switches it off.

**[4:13.6] s34** When that recognition misfires, when a name seems familiar but the facts aren't there, the model can produce a plausible guess. Knowing a name isn't knowing the facts.

**[4:23.6] s35** Search, retrieval, and longer reasoning can help when they bring in the right evidence. Turning down the randomness makes answers more consistent, not necessarily more correct. None of it is a guarantee.


## Act 6 — The payoff

**[4:36.5] s36** So why does AI sound right when it's wrong? Because sounding right comes from patterns in language, and being right takes evidence the model doesn't always have.

**[4:46.2] s37** So when an answer matters, don't ask whether it sounds right. Ask: what's the evidence, and does it actually say this?

**[4:53.3] s38** It works on chatbots. It works pretty well on people, too.

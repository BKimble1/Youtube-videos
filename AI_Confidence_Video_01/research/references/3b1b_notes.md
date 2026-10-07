# 3Blue1Brown reference study (explanation craft only)

Purpose: learn teaching principles. Do NOT reuse 3b1b scripts, figures, pi creatures, the manim look, music or branding.
Compiled 2026-10-07. I did not watch or hear either video (YouTube and 3blue1brown.com are blocked). Everything below comes from the creator-published files listed under "Accessed".

Abbreviations:
- CAP = `raw.githubusercontent.com/3b1b/captions/main/2024/`. The repo README marks it "Deprecated", so these captions may differ slightly from the live subtitles.
- SITE = `raw.githubusercontent.com/3b1b/3Blue1Brown.com/main/app/pages/lessons/2024/`
- BUCKET = `storage.googleapis.com/3blue1brown-website-bucket/lessons/2024/`. This is the creator's own figure host, found through the repo's `vite.config.ts` and `site.json`. I viewed figures from it only; they are not stored in the project.

---

## A) "Large Language Models explained briefly"

- **URLs:** https://www.youtube.com/watch?v=LPZh9BOjkQs and https://www.3blue1brown.com/lessons/mini-llm/ (neither opened)
- **Date:** 2024-11-20, confirmed two ways:
  - the creator's lesson frontmatter (`date: 2024-11-20`, `video: LPZh9BOjkQs`)
  - a WebSearch summary (search-derived)
- **Accessed:**
  - CAP `mini-llm/english/transcript.txt` and `sentence_timings.json`
  - SITE `mini-llm/index.mdx`, the lesson text with figure captions. Credits: "Text adaptation by Justin Sun".
  - BUCKET `mini-llm/` figures: script, repeat, probability, append, training, bank, end (.jpg)
  - `raw.githubusercontent.com/3b1b/videos/master/_2024/transformers/chm.py` (skimmed)
- **Hook** (the first lines after a 41-second creator intro about the Computer History Museum commission): "Imagine you happen across a short movie script that describes a scene between a person and their AI assistant. The script has what the person asks the AI, but the AI's response has been torn off."
- **Beats** (times are per the creator's caption timing file; last caption ends 8:46):
  - 0:43 Hook: the torn-off script, plus a "magical machine" that predicts the next word.
  - 1:15 "When you interact with a chatbot, this is exactly what's happening."
  - 1:26 "assign a probability to all possible next words".
  - 1:55 Sampling less likely words; the model is "deterministic" yet answers differ between runs.
  - 2:10 Scale of training data.
  - 2:30 Parameters as "dials".
  - 2:57 Training: compare the prediction with "the true last word".
  - 4:08 Guessing game: "Do you think it would take a year? ... 10,000 years?"
  - 4:27 Pre-training versus RLHF.
  - 5:14 Transformers, attention ("bank" → riverbank), repeated layers.
  - 7:10 Behaviour is "emergent", so it is hard "to determine why".
  - 7:30 Close: "uncannily fluent, fascinating, and even useful".
- **Visual devices** (observed in figures unless marked as inferred):
  - A paper script with a torn, jagged edge.
  - The model drawn as a stack of grey slabs labelled "Large Language Model". The code labels it "Magic next\nword predictor" for the hook.
  - A teal underline marking the blank for the next word.
  - A ranked bar chart of candidate words with percentages:
    - `append.jpg` highlights "option" (19%) as the pick over "popular" (45%). The lesson caption says the model "didn't select the most likely word".
    - `probability.jpg` shows "Paris is a city in ___" with France 17%, and 15%, the 9%, Logan 7% … Texas 1%. Per `chm.py` (`seed_text = "Paris is a city in"`, `model = "gpt3"`), these are real GPT-3 outputs. That this figure is a frame from that scene is my inference.
  - `training.jpg`: in "It was the best of times it was the worst", the model gives "age" 87% and the true word "worst" 10%, with a red nudge arrow. The code (`ShowSingleTrainingExample`) hard-codes these logprobs, so they are illustrative, not model output.

## B) "But what is a GPT? Visual intro to transformers"

- **URL:** https://www.3blue1brown.com/lessons/gpt/ (not opened). The frontmatter now titles it "Transformers, the tech behind LLMs | Deep Learning Chapter 5" (`video: wjZofJX0v4M`). Search results show the "But what is a GPT?" title, so it was probably retitled. That is uncertain.
- **Date:** 2024-04-01, confirmed two ways:
  - the frontmatter (`date: 2024-04-01`)
  - a WebSearch summary (search-derived)
- **Accessed:**
  - CAP `gpt/english/transcript.txt` and `sentence_timings.json`
  - SITE `gpt/index.mdx`
  - BUCKET `gpt/` figures: predict, token, Snape, SoftMax, howsoftmax, temperatureReal, distinction (.jpg)
  - `_2024/transformers/generation.py`
- **Hook:** "The initials GPT stand for Generative Pretrained Transformer. So that first word is straightforward enough, these are bots that generate new text."
- **Beats** (times per the caption timing file; last caption ends 26:52):
  - 0:00 Unpack the acronym.
  - 0:31 Promise to "follow the data".
  - 1:38 Prediction as "a probability distribution".
  - 1:45 He raises the objection himself ("predicting the next word feels like a very different goal from generating new text"), then shows sample → append → repeat.
  - 2:10 "it really doesn't feel like this should actually work". GPT-2's story "doesn't really make that much sense", GPT-3's is "sensible".
  - 3:03 Overview: tokens, vectors, attention, MLP, the final distribution.
  - 6:05 A chatbot is a system prompt plus prediction.
  - 7:12 Deep-learning premise, starting from linear regression.
  - 11:57 Colour code: weights in blue/red, data in grey.
  - 12:27 Embeddings ("At least, kind of").
  - 18:00 A running count of parameters.
  - 19:49 Context size: bots "losing the thread".
  - 20:35 The "Snape" example.
  - 22:22 Softmax.
  - 23:55 Temperature.
  - 25:33 Logits.
- **Visual devices:**
  - Tokens shown on a real sentence: `To| date|,| the| cle|ve|rest| thinker|`.
  - A "???" slot above the bars.
  - Raw scores labelled "Not at all a probability distribution!", which pass through a softmax box into bars.
  - A three-panel temperature figure (T = 10.00 / 1.76 / 0). Its EXIF says Canva, so it was probably made for the web lesson and is not a video frame (inference).
  - Live demos: `generation.py` loads `GPT2LMHeadModel` and calls the GPT-3 API with `logprobs`.

---

## How the two lessons handle the key ideas

- **Tokens.** A says "word" throughout. B defines tokens as "words or little pieces of words or other common character combinations", then openly simplifies: "I'd like to just pretend that it's broken more cleanly into words", because "we humans think in words".
- **Next-token probabilities.** A: "Instead of predicting one word with certainty, though, what it does is assign a probability to all possible next words." The bar chart appears every time the idea comes up.
- **Sampling and temperature.**
  - A gives the reason: output "tends to look a lot more natural if you allow it to select less likely words along the way at random".
  - B shows what happens. T = 0 "always goes with the most predictable word" and gives "a trite derivative of Goldilocks". A higher T "comes with a risk" and "quickly degenerates into nonsense".
  - B also explains how the demo was built: GPT-3's top 20 tokens, with probabilities tweaked by "an exponent of 1 5th".
- **Prediction versus truth.** Neither lesson directly addresses factual correctness. A search of both transcripts finds no "hallucination", "wrong" or "factual".
  - In A, "true" means "the true last word from the example", the actual next word in the training text. "Accurate" means "accurate prediction of what word follows".
  - B frames knowledge as probability mass: a network that "had built up knowledge of Harry Potter would presumably assign a high number to the word Snape".
  - RLHF targets "predictions that users prefer".
  - A closes on "uncannily fluent" without raising the gap between fluency and truth.
  - **That gap is our video's territory.**

## Lessons for our project

1. **Open on a scenario that is the mechanism**, then reveal "this is what's happening". Our version: show a fluent wrong answer, then rebuild it one word at a time.
2. **Keep the model a black box and open only the layer our question needs:** prediction, sampling and the training target. Skip attention. A spends about 2 minutes on internals (5:14–7:30); we can't afford that.
3. **Show the bar chart, not just the chosen word.** The chart has no "is this true?" column, and that is our thesis made visible. Build our own factual prompt where a wrong continuation carries real probability.
4. **Use real model output, and label illustrative numbers.** B computed real distributions; A's training bars are made up. For every chart, log the model, prompt and date, or caption it "illustrative".
5. **Make "true next word ≠ true fact" the hinge**, then add the RLHF caveat so we don't oversimplify. Any claim beyond this needs our own primary sources.
6. **Use contrast pairs**, like B's GPT-2 versus GPT-3 and T = 0 versus high T. Add ours: a T = 0 answer that is still wrong. That claim needs our own sourcing and demonstration.
7. **Include a viewer guess beat.** For example: "Which word will it pick?"
8. **Keep one colour meaning throughout**, as B does with weights versus data. Ours could be "likely" versus "verified".
9. **Admit openly where an example falls short** ("At least, kind of"). This builds trust and fits our topic.
10. **What to avoid:** pi creatures, the black manim look, the grey-slab machine, their example sentences (Santiago, Paris, Snape, best of times), and their phrasing and audio.

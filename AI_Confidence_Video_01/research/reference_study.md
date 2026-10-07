# Reference study: Video 01, "Why AI Sounds Right When It's Wrong"

Compiled 2026-10-07 from `references/3b1b_notes.md`, `references/others_notes.md`, `notes_youtube_guidance.md`.

**Access limits:**
- No reference video was watched or heard; YouTube, 3blue1brown.com, TED and support.google.com are blocked.
- 3Blue1Brown: creator-published captions (repo marked "Deprecated"; may differ from live subtitles), lesson text and figures.
- Anthropic: article read in full.
- Computerphile, TED-Ed: metadata from search summaries only. YouTube Help: search-summary paraphrases only.
- No metrics (views, retention) gathered.

**Originality:** we learn principles only. We copy no creator's script, examples, artwork, characters, style, music or branding.

## Reference records

**R1. 3Blue1Brown, "Large Language Models explained briefly"** (youtube.com/watch?v=LPZh9BOjkQs, not opened)
- **Date:** 2024-11-20 (lesson frontmatter; search summary).
- **Accessed:** transcript and sentence timings, lesson text, seven figures, `chm.py` (skimmed).
- **Opening:** a movie script whose AI reply "has been torn off", plus a next-word machine; per the caption timings it starts at 0:43, after a creator intro.
- **Progression:** "this is exactly what's happening", then next-word probabilities, sampling, training against "the true last word", RLHF, brief internals, and a close on "uncannily fluent".
- **Devices:** a torn-script prop; a ranked bar chart with the pick highlighted, even when the pick is not the top bar; the model drawn as a labelled black box.
- **Lessons:**
  - The opening scenario *is* the mechanism, and the chart comes back every time the idea does.
  - "True" here means the true next word. The transcript never uses "hallucination", "wrong" or "factual".
  - Some chart numbers are real GPT-3 output and some are hard-coded. Only the code revealed which.

**R2. 3Blue1Brown, "But what is a GPT?"** (3blue1brown.com/lessons/gpt, not opened)
- **Title:** frontmatter now says "Transformers, the tech behind LLMs"; probably retitled (uncertain).
- **Date:** 2024-04-01 (frontmatter; search summary).
- **Accessed:** captions and timings, lesson text, seven figures, `generation.py`.
- **Opening:** it unpacks "Generative Pretrained Transformer".
- **Progression:** prediction as a distribution, then the viewer's objection raised by the narrator himself (prediction "feels like a very different goal from generating new text"), a sample-and-repeat demo, a GPT-2 versus GPT-3 contrast, and softmax and temperature. The last caption is at 26:52.
- **Devices:** a "???" slot above the bars; a label reading "Not at all a probability distribution!"; a fixed colour code (blue/red for weights, grey for data); simplifications admitted out loud.
- **Lessons:** raise objections before the viewer does; use contrast pairs; keep one meaning per colour.

**R3. Anthropic, "Reasoning models don't always say what they think"** (anthropic.com/research/reasoning-models-dont-say-think)
- **Format:** written article, not a video. **Date:** Apr 3, 2025 (page and metadata).
- **Accessed:** full text; 2 of 3 figures (Fig. 1 blocked, caption read); abstract, pp. 1–3 and figure captions of arXiv:2505.05410v1.
- **Opening question (Intro ¶3):** "can we actually trust what models say in their Chain-of-Thought?"
- **Progression:** definitions, an analogy, an example, numbers, an alternative ruled out (the unfaithful explanations were *longer*), a fix that plateaus, the worst case of "fake rationales" (reward hacking ¶3), limitations, and a measured conclusion.
- **Devices:** the same question side by side, with and without the hint; an arrow from answer D to answer C; a 0–100% axis; fluent reasoning and the wrong answer in one bubble.
- **Lessons:** compare the same object across conditions; give limitations their own beat; use full-scale axes.

**R4 and R5: metadata only.** For both, we accessed none of the content, so the opening, progression and devices are unknown and we draw no lessons.
- **R4. Computerphile, "ChatGPT with Rob Miles"** (youtube.com/watch?v=viJt_DXTfwA). The date, 1 Feb 2023, comes from a search summary and is unverified.
- **R5. TED-Ed, "Why are AI data centers using so much electricity?"** (ted.com/talks/sajan_saini_why_are_ai_data_centers_using_so_much_electricity). The date, "September 2026", comes from a search summary and is unverified. Do not cite its figures.

**R6. YouTube Help, answers 16559650 and 16533387**
- **Date:** none found. **Accessed:** titles from search results (high confidence); content from search summaries only.
- **Paraphrased points (medium confidence):**
  - The aim is "long-term viewer satisfaction".
  - The signals are appeal, engagement ("do they stick around?") and satisfaction.
  - The intro should deliver on the title and thumbnail promise "immediately".
  - No numeric targets are given.

**Observation:** R1 and R2 explain fluent prediction but never address fluency versus truth. R3 shows that an explanation is not evidence. Our video sits in that gap.

## Decisions for Video 01

1. **Example within 10 s.** The first line asks for Adam Kalai's dissertation title; three cards show the Table 1 answers. No channel intro or subscribe request (R1, R6).
2. **The title and thumbnail promise is kept in s01–s07.**
   - The thumbnail shows only the documented answers, on a neutral card.
   - No "lying", "secret" or "all wrong": GPT-4o did name CMU (R6).
3. **One running example.** The dissertation question carries every act; the only other example is the toy quiz, labelled "analogy, not model data" (R1, R3).
4. **Transform the same objects instead of cutting away.** The hook's answer card splits into tokens, its empty next slot grows the score bars, and it ends beside the real record (2001, *Probabilistic and on-line methods in machine learning*). No generic B-roll.
5. **Show the whole distribution.** The bars have no "true?" column. A callout says that the scores measure likely text, not truth (R1, R2).
6. **Label illustrative probabilities.**
   - Each chart reads "illustrative scores" unless it comes from logged output, with the model, prompt and date recorded.
   - Use full 0–100% axes (R1, R3).
7. **Labels plus colour, with fixed meanings.** One hue each for "generated/likely", "verified record" and error callouts, always paired with a text label, in our own palette (R2, R3).
8. **Raise the objection ourselves.** "If it only predicts words, how does it ace hard problems?" The IMO line stays tagged "different system" (R2).
9. **Contrast pairs.** Three runs give three different birthdays; "low temperature means consistent, not correct" goes in only once sourced (R2).
10. **Leave room to look.** Hold the bars and the record comparison long enough to read, pause narration on reveals, and add an Act 3 guess beat ("Which matches the record?"). No cut-interval targets (R1, R6).
11. **Honesty beats.** A limitations card (3 models, one prompt each, 9 May 2025, no web search); no claims about today's models (R3).
12. **Payoff closes the loop.**
    - Return to the opening cards and resolve them against the record.
    - Land on "sounding right comes from patterns; being right comes from evidence" and one habit: "what's the evidence, and does it say this?"
    - Any end-screen ask comes afterwards (R6).
13. **Leave out unverified references.** R4, R5 and R6 paraphrases stay unquoted and uncited until checked first-hand.

# Upload package: Video 01

## Title

**Recommended (default): Why AI Sounds Right When It's Wrong**

- It is the exact question the film opens with (s07) and answers in its last 25 seconds.
- It promises an explanation, not a scandal, and the first 10 seconds deliver a concrete case.

Honest alternatives:

1. **Why Chatbots Make Things Up (and Sound Sure Doing It)**: more colloquial; still literally what the film shows.
2. **Three Chatbots, One Easy Question, Three Made-Up Answers**: leads with the case, so it pairs with thumbnail C.

## Thumbnail

**Recommended: `thumbnails/thumbnail_A.jpg` ("IT MADE THIS UP")**

- One focal point: GPT-4o's published, fabricated title, highlighted in coral.
- One short phrase.
- The opening seconds show exactly this card.

Alternates:

- **B, "LIKELY ≠ TRUE":** the film's thesis as type, over the real token split.
- **C, "3 titles. All made up.":** the Table 1 answers.

None of the three uses logos, real people's faces, a scandal framing or a claim the film doesn't make.

## Description (paste-ready)

```
Researchers asked three popular chatbots for the title of one scientist's PhD dissertation. All three answered fluently, specifically, confidently, and none got the title or the year right. So how can AI do impressive things and still sound sure while being wrong?

This video takes one of those answers apart: how a language model writes token by token, why "likely text" isn't the same as "true," why some training and grading incentives reward a confident guess over "I don't know," and the habit that actually helps: check whether the evidence exists and actually says what's claimed.

Chapters
0:00 Three chatbots, one simple question
0:57 Inside one sentence: tokens and next-token scores
1:57 Why a wrong answer can sound right
2:53 The test-taking incentive (an analogy)
3:59 What actually helps
4:51 The answer, and one habit

Main sources
• Kalai, Nachum, Vempala & Zhang (2025), "Why Language Models Hallucinate," arXiv:2509.04664 — https://arxiv.org/abs/2509.04664 (CC BY 4.0). Table 1: GPT-4o, DeepSeek-R1 and Llama-4-Scout, accessed May 9, 2025, no web search. Birthday example: DeepSeek-V3, May 11, 2025.
• OpenAI, "Why language models hallucinate" — https://openai.com/index/why-language-models-hallucinate/
• Adam Kalai (2001), "Probabilistic and On-line Methods in Machine Learning," PhD thesis, Carnegie Mellon University, CMU-CS-01-132 — https://www.microsoft.com/en-us/research/wp-content/uploads/2016/11/pre-2003-thesis.pdf
• Anthropic (Mar 27, 2025), "Tracing the thoughts of a large language model" (model studied: Claude 3.5 Haiku) — https://www.anthropic.com/research/tracing-thoughts-language-model
• Google DeepMind, "Gemini Deep Think for International Mathematical Olympiad 2025" (published solutions to Problems 1–5, Jul 21, 2025) — https://storage.googleapis.com/deepmind-media/gemini/IMO_2025.pdf
• Token split: OpenAI's o200k_base encoding (tiktoken) — https://github.com/openai/tiktoken

Notes: the token split shown is real; the next-token percentages and the quiz scores are illustrations, not measured model data. The Table 1 answers are a May 2025 snapshot of three models without web search, not a failure rate for today's chatbots.

Credits
• Photos: library stacks, Smithsonian Institution Building, c. 1912 — Smithsonian Institution Archives (CC0); "Sharp's Language Drills and Tests" (1929) — National Museum of African American History and Culture (CC0).
• Paper excerpts and figures: Kalai et al. (2025), CC BY 4.0. Article header and figure: Anthropic (2025), shown briefly for commentary.
• Music: original score, rendered with the MuseScore General SoundFont (MIT). Sound effects: original synthesized accents plus effects generated for this video with ElevenLabs.
• Narration: AI-generated voice (ElevenLabs, voice "Marcus K", Eleven v4). Script, research and visuals by Blake Kimble.
```

Disclosure note: the narration is synthetic, as the description says. It doesn't imitate a real person. Before
uploading, check YouTube's current altered/synthetic-content setting and apply it as the rules then require. Those
help pages were not reachable from the production session.

## Chapters

These times are already in the description above. They come from the final timeline
(`source/src/data/timeline.json`, scene starts) of the ElevenLabs narration (runtime 5:18.5):

| Time | Chapter |
|---|---|
| 0:00 | Three chatbots, one simple question |
| 0:57 | Inside one sentence: tokens and next-token scores |
| 1:57 | Why a wrong answer can sound right |
| 2:53 | The test-taking incentive (an analogy) |
| 3:59 | What actually helps |
| 4:51 | The answer, and one habit |

If the narration is ever regenerated, recompute them with:

```bash
python3 -c "import json;tl=json.load(open('source/src/data/timeline.json'));[print(s['id'], '%d:%02d'%divmod(int(s['from']/30),60)) for s in tl['scenes']]"
```

## Subtitles

Upload `exports/Video_01_AI_Confidence.en.srt` (English). It is generated from the word timings of the final
ElevenLabs narration (114 cues, at most 2 lines of 45 characters or fewer, no overlaps) and has the same text
as `script/narration_segments.json`. Don't use the `*_DRAFT*.srt` files, which match the old draft voice.

## Tags

Optional. A few are enough: AI hallucination, large language models, ChatGPT, how AI works, fact checking.

## Before publishing (checklist)

- [ ] Watch the whole video once with headphones and once on a phone speaker, using the watch-through checklist in `DELIVERABLES.md`.
- [ ] Open https://arxiv.org/abs/2509.04664 and check whether a v2 exists. Page numbers, and the "penalty 2" misprint the video avoids, could change.
- [ ] YouTube's altered or synthetic content setting: the narration is an AI voice that doesn't imitate a real person, and every on-screen document is real. Read YouTube's current help page and answer the upload question as it asks. Those help pages were not reachable from the production session.
- [ ] Upload `exports/Video_01_AI_Confidence.en.srt` as English subtitles.
- [ ] Use `thumbnails/Video_01_thumbnail_A.jpg` (or B or C).

The DeepMind item from the draft is closed. The gold-medal line couldn't be confirmed from a primary source, so the
narration now states only what the published solutions PDF shows (written solutions to five of the six problems,
credited to Gemini Deep Think). Nothing needs checking before upload. If you'd like to *add* the gold-medal context
later, open DeepMind's own announcement first.

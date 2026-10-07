# Upload package: Video 01, pass 2

Channel: **Future Got Weird** (anonymous). Nothing in this package names, pictures or links to the channel's owner.
Runtime 4:40.8. Master: `exports/Future_Got_Weird_Video_01_Pass_2_1080p.mp4`.

## Title

**Primary: Why AI Is So Confidently Wrong**

- It is the question the film asks on screen at 0:30 and answers in its last 30 seconds.
- The hook (three confident, wrong answers, stamped) delivers on it inside ten seconds.

Alternatives:

1. **Why AI Makes Things Up (So Convincingly)**: more colloquial, still exactly what the film shows.
2. **Three Chatbots. One Question. Three Made-Up Answers.**: leads with the case; pairs with thumbnail C.

## Thumbnail

**Primary: `thumbnails/thumbnail_A.jpg` ("SO SURE. SO WRONG.")**

- One focal point: the ChatGPT slip stamped WRONG, held out by the clerk who handed it over.
- Four words, 230 px type, readable at phone size.

Alternates:

- **B, "IT MADE THIS UP":** the invented title under the fact-checker's magnifier.
- **C, "3 ANSWERS. ALL WRONG.":** the three stamped slips fanned out.

All three use only the original cutout cast, the real published excerpts labelled by model and date, no logos, no
real faces, and no claim the film does not make.

## Description (paste-ready)

```
Three popular chatbots were asked for the title of one scientist's PhD thesis. All three answered in full sentences, with a title, a year, sometimes a university. None got the title or the year right. Why does AI sound so sure when it's wrong?

This episode takes one of those answers apart: how a language model writes a sentence one token at a time, why the most likely next words are not the same as the true ones, why the way AI is tested can reward a confident guess over "I don't know", and the two questions that catch a made-up answer in under a minute.

Chapters
0:00 Three chatbots, one question
0:27 The short version
0:44 Inside the token machine
1:25 What the model learned from
2:00 The real record
2:23 How the tests are graded (an example quiz)
3:09 Nine of ten benchmarks
3:27 What helps, and what it doesn't guarantee
3:41 Two questions to check
4:07 Sounding right vs being right

Sources
• Kalai, Nachum, Vempala & Zhang (2025), "Why Language Models Hallucinate," arXiv:2509.04664 (CC BY 4.0): https://arxiv.org/abs/2509.04664 — Table 1 (GPT-4o, DeepSeek-R1 and Llama-4-Scout, accessed 9 May 2025, no web search); Table 2 (ten benchmarks sampled mid-2025); the scoring argument in §1.2 and §4.
• Adam Kalai (2001), "Probabilistic and On-line Methods in Machine Learning," PhD thesis, Carnegie Mellon University, CMU-CS-01-132: https://www.microsoft.com/en-us/research/wp-content/uploads/2016/11/pre-2003-thesis.pdf
• Token split: OpenAI's o200k_base encoding (tiktoken), applied to the published excerpt: https://github.com/openai/tiktoken

Notes: the token split is real; the next-token percentages and the quiz scores are illustrations, not measured model data. The three answers are a May 2025 snapshot of three models without web search, not a failure rate for today's chatbots. "Nine of ten" refers to the ten benchmarks the paper's authors sampled in mid-2025.

Credits
• Excerpts and Table 2: Kalai et al. (2025), CC BY 4.0. Thesis title page: Kalai (2001), shown for verification.
• Narration: AI-generated voice (ElevenLabs, voice "Marcus K", Eleven v4). It does not imitate any real person.
• Music: original score rendered with the MuseScore General SoundFont (MIT). Sound effects: generated for this episode with ElevenLabs, plus synthesized accents.
• Characters, props and sets: original cutout-style illustrations made for this channel.

Future Got Weird: AI moves fast. We make it make sense. New episodes twice a week.
```

Disclosure note: the narration is synthetic and the description says so. Check YouTube's current altered or
synthetic content setting at upload time and answer it as the form asks; those help pages were not reachable from
the production session.

## Chapters

The times above come from the scene starts in `source/src/data/timeline.json` (30 fps). Every chapter is at least
14 seconds long and the first starts at 0:00, which is what YouTube requires. Recompute after any narration change:

```bash
python3 -c "import json;tl=json.load(open('source/src/data/timeline.json'));[print(s['id'], '%d:%02d'%divmod(int(s['from']/30),60)) for s in tl['scenes']]"
```

## Subtitles

Upload `exports/Future_Got_Weird_Video_01_Pass_2.en.srt` (English). It is built from the word timings of the final
narration: 102 cues, at most 2 lines of 43 characters, no overlaps, 14.9 characters per second on average. Its text
is the display text of `script/narration_segments.json` (same spellings as the on-screen labels).

## Tags

Optional. A few are enough: AI hallucination, large language models, ChatGPT, how AI works, fact checking.

## Anonymity audit (done before packaging)

Searched the narration script, every on-screen string in `source/src`, the SRT, this description, the thumbnails
and the export metadata for the owner's name, initials branding, the school, the portfolio and the other brands
named in the project brief. None appear. The MP4 carries no author or comment tag (checked with ffprobe in
`qa/tech_Future_Got_Weird_Video_01_Pass_2_1080p.md`). Internal repository paths are not mentioned anywhere public.

## Before publishing (checklist)

- [ ] Watch the whole film once with headphones and once on a phone speaker (nobody has heard it yet; see `qa/QA_REPORT.md`).
- [ ] Open https://arxiv.org/abs/2509.04664 and check whether a newer version changes Table 1 or Table 2.
- [ ] Answer YouTube's altered or synthetic content question as its current form asks.
- [ ] Upload the SRT as English subtitles and pick thumbnail A (or B or C).
- [ ] Set the end-screen subscribe element over the last 20 seconds (the end card leaves the lower half clear for it).

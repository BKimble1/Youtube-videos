# Upload package · Video 01 V3 (final)

Everything needed to publish "Why AI Is So Confidently Wrong". Nothing here has been published; uploading is the
owner's step. Do not paste anything outside the fenced description block.

## File to upload

**`exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4`**: 3840×2160, 30 fps, H.264, SDR BT.709, AAC stereo, 4:48.2.
Do not upload the 1080p review file. If the export is not in this checkout, restore it from
`backup/v3_exports/` (see `DELIVERABLES.md`).

## Title

**Why AI Is So Confidently Wrong**

It matches the on-screen title (0:29) and the question the film asks at 4:13. Alternative to test later: "Why AI Makes
Things Up (So Convincingly)".

## Description (paste-ready, 4,477 characters of YouTube's 5,000; no angle brackets)

Also in `package/DESCRIPTION_V3.txt` (copy from that file to avoid stray formatting).

```
Three popular AI models were asked for the title of one researcher's PhD thesis. All three answered with a title, a year and a university. None of them got the title or the year right. So why does AI sound so sure when it's wrong?

This episode takes one of those answers apart: how a language model writes one token at a time, why the most likely next words are not the same as the true ones, how the way AI gets graded can reward a confident guess over "I don't know", and the two questions that help catch a made-up answer.

Chapters
0:00 Three AI models, one question
0:27 The short version
0:44 One token at a time
1:26 What the model learned from
2:03 The actual record
2:26 Why guessing wins (an example quiz)
3:15 Nine of ten benchmarks
3:34 What helps, and what it doesn't guarantee
3:47 Two questions to check
4:13 Sounding right vs. being right

Sources
• Original paper. This is the source of the dissertation example and the benchmark table: Adam Tauman Kalai, Ofir Nachum, Santosh S. Vempala & Edwin Zhang, "Why Language Models Hallucinate," arXiv:2509.04664v1, 4 September 2025 (CC BY 4.0). https://arxiv.org/html/2509.04664v1
 – The three answers: Section 1, Table 1 and footnote 3. The models were GPT-4o (chatgpt.com), DeepSeek-R1 (DeepSeek app) and Llama-4-Scout-17B-16E-Instruct (huggingface.co). They were accessed on 9 May 2025, and none of them searched the web.
 – The grading argument: Sections 1.2 and 4.1. The −1 rule in our quiz matches the paper's "t = 0.5 (penalty 1)" example in Section 4.2. The 10-question quiz itself is our illustration.
 – The benchmark check: Table 2 and Appendix F. The authors looked at ten benchmarks from leaderboards they examined in June 2025. Nine use strict right/wrong grading and give no credit for "I don't know". WildBench gives partial credit.
• Later publication by the same authors: A. T. Kalai, O. Nachum, S. S. Vempala & E. Zhang, "Evaluating large language models for accuracy incentivizes hallucinations," Nature (2026). https://www.nature.com/articles/s41586-026-10549-w (The 2025 example and Table 2 shown in this video are quoted from the preprint above.)
• The actual thesis: Adam Kalai, "Probabilistic and On-line Methods in Machine Learning," PhD thesis, School of Computer Science, Carnegie Mellon University, technical report CMU-CS-01-132, May 16, 2001. https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-01-132.pdf
• Token split: OpenAI's tiktoken library maps GPT-4o to its o200k_base encoding. We applied that encoding (js-tiktoken 1.0.21) to the published ChatGPT excerpt. https://github.com/openai/tiktoken
• Background for "what helps":
 – Lewis et al. (2020), "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks": https://arxiv.org/abs/2005.11401
 – Holtzman et al. (2020), "The Curious Case of Neural Text Degeneration," Section 3.3 (temperature): https://arxiv.org/abs/1904.09751
 – Renze & Guven (2024), "The Effect of Sampling Temperature on Problem Solving in Large Language Models": https://arxiv.org/abs/2402.05201
• Background for confident wording vs actual certainty: Yona, Aharoni & Geva (2024), "Can Large Language Models Faithfully Express Their Intrinsic Uncertainty in Words?": https://arxiv.org/abs/2405.16908

Notes: the token split is real. The next-token percentages, the quiz scores, the leaderboard and the low-randomness "re-run" are illustrations, not measured model data. The three answers come from three specific models tested once on 9 May 2025 without web search. They are not a failure rate for those models or for today's chatbots. "Nine of ten" refers only to the ten benchmarks the authors sampled in mid-2025. A confident tone ("is entitled", no "I think") is wording. It is not a measurement of how likely the answer is to be right.

Credits
• Paper header, answer excerpts and Table 2: Kalai, Nachum, Vempala & Zhang (2025), arXiv:2509.04664, CC BY 4.0. Thesis title page: Kalai (2001), shown for verification.
• Narration: AI-generated voice made with ElevenLabs (Eleven v4).
• Sound effects: generated for this video with ElevenLabs, plus a synthesized tick.
• Music: original score generated for this video, rendered with the MuseScore General SoundFont (MIT licence).
• Type: Fredoka, Nunito, Source Serif 4 and JetBrains Mono (SIL Open Font License).
• Characters, props and sets: original cutout-style illustrations made for this channel.

Future Got Weird: AI moves fast. We make it make sense. New episodes twice a week.
```

## Thumbnail

`thumbnails/Future_Got_Weird_Video_01_V3_thumbnail.jpg` (1280×720 JPG, about 190 KB; YouTube limit 2 MB). It is
thumbnail A ("SO SURE. SO WRONG."), the clerk with the ChatGPT slip marked the way the opening marks it. Source:
`ThumbA` in `source/src/Thumbnails.tsx`; the 3840×2160 render is `thumbnails/thumbnail_V3_A_3840.png`.

## Captions

`exports/Future_Got_Weird_Video_01_V3.en.srt` (English; identical to `script/subtitles_v2.srt`, 105 cues). Do not
upload `script/subtitles_elevenlabs.srt`: that is the pass-2 timing.

## Chapters

They come from the timestamps in the description (first 0:00, ten chapters, shortest 13 s). After publishing,
check that YouTube's automatic chapters have not replaced them.

## End screen

Use 4:38–4:48 (10 s). The end card is settled from about 4:37.3 with a clean saffron area roughly x 280–1900,
y 470–900 on a 1920×1080 frame (two video tiles and a subscribe element fit). Keep the bottom-left clear: the
fact-checker and "Sources, excerpts and credits are in the description." sit there (y ≈ 940–985).

## Settings

- Altered or synthetic content: the narration is an AI-generated voice and the film is fully animated. Answer
  YouTube's disclosure question as it is worded at upload time.
- Category: Education (or Science & Technology). Made for kids: no. Language: English.
- Tags (optional): AI hallucination, large language models, ChatGPT, how AI works, fact checking.

## Owner checks before publishing

- [ ] Open the three source links once each (arXiv HTML v1, the CMU thesis PDF, the Nature article). The production
      environment could not reach them; the citations were checked against the arXiv v1 PDF from arXiv's own
      dataset mirror, the Microsoft Research copy of the thesis, and search-index metadata for Nature.
- [ ] Confirm how the ElevenLabs voice recorded as "Test Voice" was made (designed or library voice, not a clone
      of a real person). If confirmed, you may add "It does not imitate any real person." to the narration credit.
- [ ] Listen through `qa/V3_LISTENING_CHECKLIST.md` (no audio playback was available in production).

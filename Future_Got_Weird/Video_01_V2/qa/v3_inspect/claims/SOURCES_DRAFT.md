# Sources section for the V3 upload description (draft)

Audit: claims vs primary sources, V3 pass, 2026-10-08. This file is a draft for the packaging step. It does not edit
`package/UPLOAD_PACKAGE.md`. The claim-by-claim mapping is in `CLAIM_LEDGER.md` next to this file.

## Paste-ready block

YouTube does not render Markdown, so this is plain text. Section and table numbers are given instead of page numbers
because the arXiv HTML page has no pages. PDF page numbers are in `CLAIM_LEDGER.md`.

```
Sources
• Original paper. This is the source of the dissertation example and the benchmark table: Adam Tauman Kalai, Ofir Nachum, Santosh S. Vempala & Edwin Zhang, "Why Language Models Hallucinate," arXiv:2509.04664v1, 4 September 2025 (CC BY 4.0). https://arxiv.org/html/2509.04664v1
 – The three answers: Section 1, Table 1 and footnote 3. The models were GPT-4o (chatgpt.com), DeepSeek-R1 (DeepSeek app) and Llama-4-Scout-17B-16E-Instruct (huggingface.co). They were accessed on 9 May 2025, and none of them searched the web.
 – The grading argument: Sections 1.2 and 4.1. The −1 rule in our quiz matches the paper's "t = 0.5 (penalty 1)" example in Section 4.2. The 10-question quiz itself is our illustration.
 – The benchmark check: Table 2 and Appendix F. The authors looked at ten benchmarks from leaderboards they examined in June 2025. Nine use strict right/wrong grading and give no credit for "I don't know". WildBench gives partial credit.
• Later peer-reviewed publication by the same authors: A. T. Kalai, O. Nachum, S. S. Vempala & E. Zhang, "Evaluating large language models for accuracy incentivizes hallucinations," Nature 653, 1047–1051 (2026). https://doi.org/10.1038/s41586-026-10549-w (The 2025 example and Table 2 shown in this video are quoted from the preprint above.)
• The actual thesis: Adam Kalai, "Probabilistic and On-line Methods in Machine Learning," PhD thesis, School of Computer Science, Carnegie Mellon University, technical report CMU-CS-01-132, May 16, 2001. https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-01-132.pdf
• Token split: OpenAI's tiktoken library maps GPT-4o to its o200k_base encoding. We applied that encoding (js-tiktoken 1.0.21) to the published ChatGPT excerpt. https://github.com/openai/tiktoken
• Background for "what helps":
 – Lewis et al. (2020), "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks": https://arxiv.org/abs/2005.11401
 – Holtzman et al. (2020), "The Curious Case of Neural Text Degeneration," Section 3.3 (temperature): https://arxiv.org/abs/1904.09751
 – Renze & Guven (2024), "The Effect of Sampling Temperature on Problem Solving in Large Language Models": https://arxiv.org/abs/2402.05201
• Background for confident wording vs actual certainty: Yona, Aharoni & Geva (2024), "Can Large Language Models Faithfully Express Their Intrinsic Uncertainty in Words?": https://arxiv.org/abs/2405.16908

Notes: the token split is real. The next-token percentages, the quiz scores, the leaderboard and the low-randomness "re-run" are illustrations, not measured model data. The three answers come from three specific models tested once on 9 May 2025 without web search. They are not a failure rate for those models or for today's chatbots. "Nine of ten" refers only to the ten benchmarks the authors sampled in mid-2025. A confident tone ("is entitled", no "I think") is wording. It is not a measurement of how likely the answer is to be right.
```

The preprint stays as the source for the example and the table, and the Nature article is listed as the later
publication. That follows the brief. Neither the access dates nor the table contents were checked against the Nature
version, which could not be opened (see below).

## Other description lines that must change (factual)

These are lines in the current `package/UPLOAD_PACKAGE.md` description, which is still the pass-2 text.

| Current line | Problem | Minimal replacement |
|---|---|---|
| "All three answered in full sentences, with a title, a year, sometimes a university." | All three excerpts in Table 1 name a university: CMU, Harvard and MIT. "Full sentences" cannot be checked, because two of the three excerpts are cut with ellipses. | "All three answered with a title, a year and a university." |
| "…and the two questions that catch a made-up answer in under a minute." | "In under a minute" has no source and the film does not show it. | "…and the two questions that help catch a made-up answer." |
| Sources, thesis link `microsoft.com/…/pre-2003-thesis.pdf` | The owner asked for the CMU link. | Use the CMU URL above. The MSR copy is the one the title-page crop was rendered from. It can be kept in the research ledger, but it is not needed in the description. |
| Sources: no Nature entry | The brief requires it. | The Nature bullet above. |
| Credits: "Narration: AI-generated voice (ElevenLabs, voice "Marcus K", Eleven v4)" | Wrong for V2. `script/narration_segments.json` and `source/src/data/timeline.json` record voice_name "Test Voice", voice_id kk5XaSLo2XAw0sKM98zU, model eleven_v4. | "Narration: AI-generated voice (ElevenLabs, Eleven v4). It does not imitate any real person." Leave out the internal voice label "Test Voice", which is a workspace name. |
| Credits: "Excerpts and Table 2: Kalai et al. (2025), CC BY 4.0." | It is correct. The film now shows the arXiv header (p. 1) and Table 2 (p. 14) as images, and the three answers as retyped verbatim excerpts. The Table 1 image is no longer used. | "Paper header, answer excerpts and Table 2: Kalai et al. (2025), arXiv:2509.04664, CC BY 4.0. Thesis title page: Kalai (2001), shown for verification." |
| Chapters, runtime 4:40.8, master and SRT filenames | They come from pass 2. The V2 scene starts are S1 0:00, S2 0:27, S3 0:43, S4 1:26, S5 2:03, S6 2:26, S7 3:14, S8 3:33, S9 3:47, S10 4:13 (`timeline.json`, 30 fps). | The packaging step owns these. The chapter titles must match the V2 scenes. |

## Verification record (what was actually reached)

| Source the brief named | Fetched directly? | What was confirmed, and how |
|---|---|---|
| https://arxiv.org/html/2509.04664v1 | **No.** WebFetch could not resolve the host. curl got proxy CONNECT 403. | I downloaded arXiv's own v1 PDF from arXiv's official dataset bucket (`storage.googleapis.com/arxiv-dataset/arxiv/arxiv/pdf/2509/2509.04664v1.pdf`, HTTP 200). It is byte-identical to the pass-1 copy (SHA-256 `74f3ea8bcef68b858c9edef87b4adc49af4ff1b2d29d08a6faee8211fdf41784`). The PDF metadata gives identifier https://arxiv.org/abs/2509.04664v1, DOI 10.48550/arXiv.2509.04664 and licence CC BY 4.0. I read Table 1, footnote 3, §1.2, §4.1, §4.2, Table 2, §5 and Appendix F in it. The HTML and PDF are built from the same v1 source, so section and table numbers carry over. The bucket returned 404 for v2 and v3, but the bucket can lag, so whether a later arXiv version exists is still **unconfirmed**. |
| https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-01-132.pdf | **No.** The host would not resolve, and curl got no connection. | I checked the title page in the Microsoft Research-hosted PDF used in pass 1 (`AI_Confidence_Video_01/research/sources_raw/kalai2001_thesis/kalai2001_thesis_msr.pdf`, SHA-256 `93e2d6e98ea05c6d623b64d5667d878c081c5c67ef66e17923361854ddb4bbb6`, PDF created 17 May 2001). Its title page reads: "Probabilistic and On-line Methods in Machine Learning / Adam Kalai / May 16, 2001 / CMU-CS-01-132 / School of Computer Science / Computer Science Department / Carnegie Mellon University / Pittsburgh, PA 15213-3890 / Thesis Committee: Avrim Blum, chair; Manuel Blum; Danny Sleator; Santosh Vempala". The paper's own bibliography agrees: "Adam Kalai. 2001. Probabilistic and on-line methods in machine learning. PhD Thesis. Carnegie Mellon University." The film's two thesis images are pixel-exact crops of a 600-dpi render of page 1 of that PDF (mean absolute difference 0.0). **Before publishing, someone should open the CMU link once to confirm it resolves to the same report.** |
| https://www.nature.com/articles/s41586-026-10549-w | **No.** nature.com, doi.org, PubMed, PMC, Europe PMC, Crossref and OpenAlex were all unreachable. | Everything here comes from web-search index results only, not the article page. Several independent results agree on title "Evaluating large language models for accuracy incentivizes hallucinations", authors Adam Tauman Kalai, Ofir Nachum, Santosh S. Vempala & Edwin Zhang, journal *Nature*, DOI 10.1038/s41586-026-10549-w, and year 2026. One result each reported: volume 653, pages 1047–1051; first page 1047 with the issue dated 28 May 2026 (from a PDF header); published online 22 April 2026; received 1 July 2025, accepted 15 April 2026. **Not confirmed:** the end page 1051 and the online date (one search summary each), any PMID or PMCID, and whether the Nature version keeps the 9 May 2025 dissertation example or the Table 2 audit. A secondary blog calls it the peer-reviewed version of the preprint. The matching authors and argument support that, but I did not confirm it from the article itself. Open the DOI once before publishing and check the page range. |

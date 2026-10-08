# Claim ledger, V3 (claims in the V2 film matched to exact source locations)

**Film:** "Why AI Is So Confidently Wrong", Future Got Weird Video 01 V2 (approved), 4:48.235, 30 fps.
**Text checked:** `script/narration_segments.json` (V2, 36 segments, field `text`); timings from `source/src/data/timeline.json`;
on-screen strings from `source/src/scenes/*.tsx`, `source/src/components/**/*.tsx` and the evidence crops in `source/public/img/`.
The V2 SRT (`script/subtitles_v2.srt`, 103 cues) matches the 36 segment texts word for word (checked by normalised diff).
**Compiled:** 2026-10-08. This ledger replaces the pass-2 `research/sources.md` for V3. The last section lists what was stale there.

## Source keys and how each was reached

| Key | Source | Access in this audit |
|---|---|---|
| **P** | Kalai, Nachum, Vempala & Zhang, "Why Language Models Hallucinate", arXiv:2509.04664**v1**, 4 Sep 2025, CC BY 4.0, DOI 10.48550/arXiv.2509.04664 | arxiv.org was blocked. I read the v1 PDF from arXiv's dataset bucket on storage.googleapis.com. It matches the pass-1 copy byte for byte (SHA-256 `74f3ea8b…41784`). Page numbers below are that PDF's printed numbers, which equal its PDF page numbers. |
| **T** | Adam Kalai, "Probabilistic and On-line Methods in Machine Learning", PhD thesis, CMU SCS, CMU-CS-01-132, May 16, 2001 | csd.cmu.edu was blocked. I used the MSR-hosted copy from pass 1 (SHA-256 `93e2d6e9…bbb6`, PDF created 17 May 2001), title page (PDF p. 1). The paper's bibliography (P p. 19) agrees. |
| **N** | Kalai, Nachum, Vempala & Zhang, "Evaluating large language models for accuracy incentivizes hallucinations", *Nature* 653, 1047–1051 (2026), doi:10.1038/s41586-026-10549-w | nature.com was blocked. Citation details come only from search-index metadata; see `SOURCES_DRAFT.md`. The film does not quote this article; it is cited only as the later publication. |
| **K** | OpenAI tiktoken, `tiktoken/model.py` (`"gpt-4o": "o200k_base"`, line 37) | Fetched directly from raw.githubusercontent.com on 2026-10-08. |
| **J** | js-tiktoken 1.0.21 (`source/node_modules`, pinned in `package-lock.json`), encoding `o200k_base` | I re-ran it locally: `getEncodingNameForModel('gpt-4o')` returns `o200k_base`. Encoding the excerpt gives 37 tokens, and the ids and text are identical to `source/src/data/tokens_gpt4o_sentence.json`. |
| **H** | Holtzman et al., "The Curious Case of Neural Text Degeneration", ICLR 2020, arXiv:1904.09751v2 | Read from the arXiv bucket. |
| **R** | Renze & Guven, "The Effect of Sampling Temperature on Problem Solving in LLMs", arXiv:2402.05201v3 | Read from the arXiv bucket. |
| **L** | Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", arXiv:2005.11401v4 | Read from the arXiv bucket (abstract). |
| **Y** | Yona, Aharoni & Geva, "Can Large Language Models Faithfully Express Their Intrinsic Uncertainty in Words?", arXiv:2405.16908v2 | Read from the arXiv bucket (p. 1). |

## Evidence images are genuine

I compared every evidence image the V2 film uses against a 600-dpi poppler render of its source page:

- `paper_p01_header.png` matches P p. 1 (mean absolute difference 0.0).
- `paper_p14_table2.png` matches P p. 14 (0.0).
- `thesis_titlepage_top.png` matches T p. 1 (0.0).
- `thesis_title_block.png` matches T p. 1 (0.0).

These are pixel-exact crops, with no redrawing or sharpening. Two other images are not used by V2:

- `paper_p02_table1.png` (P p. 2) differs only where poppler draws the PDF's hyperlink border boxes around "3", "Kalai" and "2001". The text is identical.
- `paper_p13_instruction.png` (P p. 13) matches with a difference of 0.0.

## Spoken claims

Timecodes are the segment starts in the approved V2. A ✓ means the claim matches the source as worded.

| Seg (time) | Quote | Type | Exact source location | Verdict |
|---|---|---|---|---|
| s01 (0:00.5) | "Three popular AI models were asked one question: what was the title of Adam Kalai's dissertation?" | Record | P §1, p. 2, Table 1 caption: "Excerpts from responses to “What was the title of Adam Kalai’s dissertation?” from three popular language models.³" | ✓ The prompt is verbatim. |
| s02 (0:06.6) | "ChatGPT handed over a full title, a university, and a year. DeepSeek gave a different title. Llama gave a third." | Record | P p. 2, Table 1 rows. ChatGPT (GPT-4o): "(completed in 2002 at CMU) is entitled: “Boosting, Online Algorithms, and Other Topics in Machine Learning.”". DeepSeek: "“Algebraic Methods in Interactive Machine Learning”. . . at Harvard University in 2005." Llama: "“Efficient Algorithms for Learning and Playing Games”. . . in 2007 at MIT." | ✓ DeepSeek and Llama also named a university and a year. The line doesn't deny this. |
| s03 (0:14.3) | "Three different answers. None of them are right. Not one even had the right year." | Record | P p. 2, Table 1 caption: "None generated the correct title or year (Kalai, 2001)." | ✓ "None of them are right" refers to the answers (the titles). s18 later credits ChatGPT with the correct university, so nothing claims every detail was wrong. |
| s04 (0:19.7) | "And Adam Kalai? He's the lead author of the paper that reported this test." | Record | P p. 1, title block: Adam Tauman Kalai listed first with ∗ (the "Email: adam@kal.ai" footnote). P p. 2 treats "Kalai, 2001" as the correct answer. | ✓ The paper never says who typed the prompts (fn. 3 is passive), and the film doesn't claim it. |
| s05 (0:24.2) | "Very professional. Very fictional." | Our wording | — | Joke. |
| s06 (0:27.6) | "So how can a wrong answer sound that sure?" | Our wording | — | ✓ "Sound" refers to wording. |
| s07 (0:32.3) | "A chatbot is built to write what's likely to come next." | Simplification of an established mechanism | P §3, p. 6, "Not merely autocomplete": the errors come from fitting the language distribution, not from producing one word at a time. H §3.3, p. 6 (the softmax over the vocabulary). | ✓ It is a simplification, and s12 adds the post-training layers. Don't add "because it predicts one word at a time"; P p. 6 warns against that reading. |
| s07 | "Checking whether it's true is a different job." | Our framing, grounded in the paper | P §1.1, pp. 2–3: "Generating valid outputs is in some sense harder than answering these Yes/No questions" (the Is-It-Valid reduction). | ✓ |
| s07 | "And some of the tests used to grade these systems quietly reward guessing." | Paper-specific argument | P abstract (p. 1); §4.1, pp. 12–13; Table 2, p. 14 | ✓ "Some" is conservative. The paper says "the vast majority of popular evaluations" (p. 13). |
| s08 (0:44.3) | "Let's take ChatGPT's answer apart." | — | — | — |
| s09 (0:46.8) | "A language model builds text out of tokens: chunks that are sometimes whole words, sometimes fragments. In GPT-4o's tokenizer, “Kalai” comes out as “Kal” and “ai.”" | Reproducible measurement | K line 37 (`"gpt-4o": "o200k_base"`). J run: the excerpt gives …`" Kal"`#22187 + `"ai"`#1361…, and standalone "Kalai" gives `"Kal"`#70286 + `"ai"`#1361. The stored token file is reproduced exactly. | ✓ This is the public tokenizer applied to the published excerpt. It is not a claim about what chatgpt.com computed on 9 May 2025. |
| s10 (0:58.4) | "At every step, the model scores all the possible next chunks and picks one. Then it goes again." | Established | H §3.3, Eq. 4, p. 6 (a softmax over the whole vocabulary, reshaped by temperature). Vaswani et al. 2017 §3.4 (pass-1 DIRECT; not re-fetched). | ✓ |
| s11 (1:07.6) | "Here, it's choosing the last digit of the year." | Reproducible measurement | J: " 2002" gives `" "`#220 + `"200"`#1179 + `"2"`#17, so the final digit is a token of its own. | ✓ |
| s11 | "Those scores say which chunk is likely. They do not say which one is true." | Simplification | P §3, p. 6. Nuance: P §3.1, p. 8, Fig. 2 says "The pretrained model is well calibrated" on multiple-choice questions. | ✓ as worded. The scores are not a truth check. The film never says they are unrelated to truth; keep it that way. |
| s12 (1:16.2) | "Modern chatbots add more on top: instruction training, step-by-step reasoning, sometimes web search. But the words still come out this way, one piece at a time." | Established | P §1, p. 2: the analysis "applies broadly, including to reasoning and search-and-retrieval language models". Ouyang et al. 2022 abstract (pass-1 DIRECT). | ✓ |
| s13 (1:26.8) | "So why would the likely answer be wrong? Think about what the model learned from." | — | — | — |
| s14 (1:31.7) | "The sound of a dissertation title is everywhere. “Methods.” “Algorithms.” “Machine Learning.” Shelf after shelf, the same shape." | Illustration | P §1.1, p. 3, Fig. 1 caption ("accurate on certain concepts like spelling") | ✓ The words are our illustration, not measured frequencies. The real title also contains "Methods" and "Machine Learning". |
| s15 (1:40.9) | "But one specific researcher's title? That might show up rarely, or not at all. And like a birthday, there's no pattern to work it out from." | Paper-specific theory | P p. 3, Fig. 1 ("Birthdays (no pattern)"). §3.3.1, pp. 9–10: Def. 1, Def. 2 (singleton rate), Thm. 2; p. 10: "others may only occur once, e.g., in an obituary". | ✓ "Might" is hedged. The on-screen chip says exposure is unknown. |
| s16 (1:49.6) | "So the model does what it was built to do. It fills the gap with a title-shaped answer. And the confidence comes with it, because that's part of the pattern too. “Is entitled.” No “I think.” No “maybe.”" | Illustration plus established phenomenon | P §1.2, p. 4: "Bluffs are often overconfident and specific". P p. 2, Table 1 ("is entitled:"). Y p. 1: models answer "in a fluent, decisive, and persuasive manner"; they are "poor at faithfully conveying their uncertainty". | ✓ factually. **Soft spot:** "the confidence" means confident *wording* (the examples are phrases), but heard alone it could mean a measured confidence. See finding F2 below. |
| s17 (2:03.5) | "Here's the actual record. Kalai's thesis: “Probabilistic and On-line Methods in Machine Learning.” Carnegie Mellon, May 2001." | Record | T title page: "Probabilistic and On-line Methods in Machine Learning / Adam Kalai / May 16, 2001 / CMU-CS-01-132 / … Carnegie Mellon University". P bibliography, p. 19. | ✓ |
| s18 (2:12.7) | "ChatGPT got the university right. The year was off by one. The title was invented. And every detail came out looking exactly as solid as the true one." | Record plus our observation | Table 1 (P p. 2) compared with T: CMU = Carnegie Mellon; 2002 vs 2001; the titles differ. | ✓ "Invented" means it is not the actual title. The two titles share "On-line/Online" and "in Machine Learning", so do not say "completely different". "Looking … as solid" is about appearance. |
| s19 (2:22.9) | "A confident font is still just a font." | Joke | — | ✓ It reinforces that appearance is not evidence. |
| s20 (2:26.9) | "The researchers argue that part of the answer is how models get graded." | Paper-specific argument | P §1.2, p. 4. §4.1, pp. 12–13, Observation 1: "Under binary grading, abstaining is strictly sub-optimal." | ✓ "Argue" and "part of" are both hedged. |
| s21 (2:34.8) | "Picture a ten-question quiz. Right answer: one point. Wrong answer: zero. “I don't know”: also zero." | Our illustration of the paper's scheme | P p. 4: "a binary 0-1 scheme that awards 1 point for a correct answer and none for blanks or IDKs" | ✓ The quiz itself is ours, and it is labelled on screen. |
| s22–s24 (2:42.8–3:01.1) | Honest scores 6. The guesser takes 4 four-option guesses: "on average, one lands. Seven points." / "One lucky guess. Three wrong answers. Somehow, a trophy." | Illustration (arithmetic) | P p. 4 (Model A vs Model B: "Model B will outperform A under 0-1 scoring") | ✓ 6 + 4 × ¼ = 7 expected. On screen it is labelled "expected scores". |
| s25 (3:02.0) | "A wrong answer costs a point. The honest one: still six. The guesser: six, plus one, minus three. Four. The trophy walks back." | Illustration matching the paper's example | P §4.2, p. 13: "t = 0.5 (penalty 1)". P p. 14: answering beats IDK "iff its confidence … is > t". | ✓ 6 + 1 − 3 = 4 versus 6. |
| s26 (3:15.1) | "The researchers checked ten widely used benchmarks in mid-2025. Nine graded strictly right or wrong, with no credit at all for “I don't know.”" | Record (the paper's audit) | P p. 14, Table 2: nine rows read "Binary grading: Yes" and "IDK credit: None" (IFEval "Yesᵃ" is a composite of binary sub-scores); WildBench reads "No / Partialᵇ". App. F, pp. 33–36: "influential evaluations", "now widely-used benchmarks". The leaderboards were accessed on 24 June 2025 (fn. 7, p. 34) and 26 June 2025 (fn. 9, p. 35; Open LLM Leaderboard bibliography entry). | ✓ "The ten they checked" is not a claim about all benchmarks. "Mid-2025" matches the June 2025 access dates. |
| s27 (3:25.2) | "Train and rank models on tests like that, and guessing pays. It's one explanation, not the whole story. But it is a simple one." | Paper argument plus open question | P §4, p. 12: "existing benchmarks and leaderboards reinforce certain types of hallucination". Other causes: P §2, p. 4 (overconfidence, decoding randomness, snowballing, long-tailed samples …), §3 (pretraining errors), §5 (limitations). | ✓ The qualification is kept verbatim. |
| s28 (3:34.1) | "Search and retrieval, when they bring the real record into the room." | Paper finding plus a single study | L abstract: RAG generates "more specific, diverse and factual language". P §5, p. 15, "Search (and reasoning) are not panaceas": binary grading "still rewards guessing whenever search fails to yield a confident answer". | ✓ The conditional "when" carries the limit. |
| s28 | "Reasoning, sometimes." | Paper finding | P §3.3.2, p. 11 (DeepSeek-R1 counts letters where V3 failed; the paper hedges this). P §5, p. 15. | ✓ |
| s28 | "Turning down the randomness makes answers more consistent, not necessarily more correct." | Established definition plus empirical support | H §3.3, p. 6: low temperature "skews the distribution towards high probability events" at "the cost of decreasing diversity". R abstract: temperature 0.0–1.0 changes "do not have a statistically significant impact on LLM performance for problem-solving tasks". | ✓ |
| s28 | "None of it is a guarantee." | Paper argument | P §5, p. 15 | ✓ |
| s29–s30 (3:47.9) | "The unglamorous move: check." / "Does the source exist? And does it actually say this?" | Our synthesis | — | Advice, not a factual claim. |
| s31 (3:55.1) | "Is there a thesis by Adam Kalai at Carnegie Mellon? Yes. Does it say “Boosting, Online Algorithms,” 2002? No. It says “Probabilistic and On-line Methods,” 2001." | Record | T title page; P Table 1 | ✓ |
| s32 (4:09.4) | "Source exists. Claim fails. Stamp it." | Our wording | Rows s17 and s31 | ✓ |
| s33 (4:13.6) | "Because sounding right comes from patterns in language, and being right takes evidence the model doesn't always have." | Synthesis | P abstract, p. 1: "If incorrect statements cannot be distinguished from facts, then hallucinations … will arise through natural statistical pressures." | ✓ "Doesn't always" is hedged. This line is the film's clearest separation of wording from correctness. |
| s34–s35 | "…Ask what the evidence is…" / "Works on chatbots. Works pretty well on people, too." | Advice and joke | — | — |
| s36 (4:35.1) | "New episodes twice a week, if you'd like to subscribe." | Channel promise | Channel brief (not a research claim) | Not a sourced claim. |

## On-screen text carrying a claim

All of these match the source unless a note says otherwise.

| Scene | Text (as built) | Source / status |
|---|---|---|
| S1 ticket | "Asked of GPT-4o, DeepSeek-R1 and Llama-4-Scout · 9 May 2025" | ✓ P p. 2, fn. 3: "freely accessed 2025-05-09 via chatgpt.com, the DeepSeek app (R1 …), and huggingface.co (Llama-4-Scout-17B-16E-Instruct)" |
| S1 slips (`AnswerSlip.tsx` `SLIPS`) | Verbatim Table 1 excerpts, labelled "GPT-4o · 9 May 2025", "R1 · 9 May 2025" and "4 Scout · 9 May 2025" | ✓ P p. 2. The only difference is a space before ". . ." on the DeepSeek and Llama slips (P prints `”. . .`). Typographic only. |
| S1 paper cut-in | Real header crop, "Lead author" box. Tab: "Published test · Kalai, Nachum, Vempala & Zhang (2025) / “Why Language Models Hallucinate,” arXiv · no web search" | ✓ P p. 1; fn. 3 ("None of the models searched the Web.") |
| S2 cards | "Built to write what’s likely" / "Checking if it’s true is a different job" / "Some tests quietly reward guessing"; "scores: how likely each piece is" + "illustrative"; "EVIDENCE CHECK · CLOSED · not on the writing route"; "Guessing pays" | ✓ As for s07. "Not on the writing route" is a simplification, which S8 qualifies when retrieval opens the booth. |
| S3 | "GPT-4o tokenizer (o200k_base)"; "id 22187" / "id 1361"; "whole words" / "fragments" | ✓ K, J (the ids are the real o200k_base ids for " Kal" and "ai") |
| S3 | Scorer percentages (year digit 2: 31 %, 1: 26 %, 0: 12 %, 5: 9 %, 3: 7 %; the other cycles likewise) + "illustrative numbers" tag | ✓ Labelled illustrative (`S3_Tokens.tsx` C15 comment: "NOT measured from any model"). The rolled-out tiles are the real next tokens. |
| S3 | "WHAT THE SCORE MEASURES: How likely the chunk is" / "TRUTH METER: Whether it’s true · Not measured" | ✓ As for s11 |
| S3 | Modules "Instruction training" / "Step-by-step reasoning" / "Web search (sometimes)" | ✓ As for s12 |
| S4 | Footer 1: "a birthday shows up rarely, or not at all / training exposure is unknown for these models"; "no pattern to work it out from" | ✓ As for s15 |
| S4 | Footer 2 (on screen during "And the confidence comes with it, because"): "a title-shaped answer · simplified illustration"; hedge tags "I think" / "maybe" struck; "IS ENTITLED" | ✓, but see F2 |
| S5 | Thesis crop; "The actual record"; tab "Kalai (2001), PhD thesis title page / Carnegie Mellon University · CMU-CS-01-132"; "university · right / year · off by one / title · invented"; "just as solid" | ✓ T; Table 1 |
| S6 | "the researchers’ argument · Kalai et al. 2025"; "HOW MODELS GET GRADED"; guard "illustrative quiz · 10 questions · 4 options each · expected scores"; "1 in 4 per guess"; "−1" | ✓ P §1.2, §4.1, §4.2 |
| S7 | Real header and Table 2 crops; tag "Kalai, Nachum, Vempala & Zhang (2025) · Table 2 / ten benchmarks sampled mid-2025 · CC BY 4.0"; flap "SAMPLED MID-2025"; "graded strictly right or wrong"; "strict correct/incorrect" (the Table 2 caption's wording); "WildBench: partial credit" | ✓ P p. 14, App. F; licence from the PDF XMP `dc:rights` |
| S7 | Leaderboard "always answers / guesses often / says “I don’t know”" + "illustration"; "One explanation, / not the whole story. / But a simple one." | ✓ Labelled illustration |
| S8 | "RETRIEVAL"; "the real record is now in the room"; "sometimes"; "randomness / turned down" (LOW/HIGH); three slips "ChatGPT · GPT-4o · illustrative re-run" each stamped WRONG; "more consistent · not necessarily more correct"; "NO GUARANTEE" | ✓ As for s28. "Illustrative re-run" makes clear that no real low-temperature re-run was performed. |
| S9 | "Does the source exist?" / "Does it actually say this?"; boxes on "Adam Kalai" and "Carnegie Mellon University"; sweep over the title and "2001"; "Source exists ✓" / "Claim fails ✕" | ✓ T |
| S10 | "SOUNDING RIGHT" / "BEING RIGHT"; evidence thumb "Kalai (2001) thesis title page"; "Sources, excerpts and credits are in the description." | ✓ The description must actually include them (see `SOURCES_DRAFT.md`). |
| Thumbnails | A "SO SURE. SO WRONG." (GPT-4o · 9 May 2025 slip); B "IT MADE THIS UP"; C "3 ANSWERS. ALL WRONG." (dated slips) | ✓ "All wrong" refers to the answers, as in s03 and the Table 1 caption. "Sure" in A means how it sounds; the film makes that explicit. |

## Two framing checks the brief asked for

**1. Historical tests vs the latest models: passes. No change needed.**

- Every reference to the test is past tense and dated: s01 "were asked", the S1 ticket "· 9 May 2025", each slip dated, "Published test … no web search".
- The benchmark claim is dated as well: s26 "in mid-2025", the flap "SAMPLED MID-2025", the tag "ten benchmarks sampled mid-2025".
- Present-tense lines (s07, s10–s12, s27, s33 and the title) describe the mechanism and the incentive. None of them reports a current error rate of named models.
- The S8 re-run is labelled "illustrative".
- The draft description note says explicitly that the three answers are not a failure rate for today's chatbots.
- The 2026 Nature publication N (per its index metadata) keeps the general claim current without changing the dated example.

**2. Confident wording vs a calibrated confidence measurement: passes on the facts, with one soft spot.**

- The film never shows a number as the model's probability of being right.
- The scorer percentages are labelled "illustrative" and defined as "How likely the chunk is", with "TRUTH METER … Not measured".
- The wording thread consistently refers to how the answer *sounds* or *looks*: s06 "sound that sure", s16's quoted phrases, s18 "looking exactly as solid", s19's font joke, s33 "sounding right" vs "being right".
- The soft spot is s16's "the confidence comes with it". See F2.
- Nothing claims the model "knows" it is wrong.
- Nothing claims the token scores are unrelated to truth. That would contradict P p. 8, Fig. 2 (base models are often well calibrated).

## Findings: what must change, with minimal wording

- **F1 (major, description only).** The current `package/UPLOAD_PACKAGE.md` description is the pass-2 text:
  - Its Sources section lacks Nature and uses the MSR thesis link.
  - Its credits name the voice "Marcus K", but V2 uses the ElevenLabs voice recorded as "Test Voice" (kk5XaSLo2XAw0sKM98zU, eleven_v4).
  - It says "sometimes a university", but all three excerpts name one.
  - It promises "in under a minute", which has no source.
  - Its chapters and runtime are from pass 2.
  - Replacement text is in `SOURCES_DRAFT.md`.
  - No narration or on-screen change is needed for F1.
- **F2 (minor, optional on-screen clarification; no narration change).**
  - Where: S4 footer 2 (`source/src/scenes/S4_Library.tsx`, line 988, `FOOT2`), which is on screen exactly while "And the confidence comes with it" is spoken.
  - Change: make it two lines, like footer 1:
    - "a title-shaped answer · simplified illustration"
    - "confident wording, not a measured confidence"
  - Alternative if the layout cannot take a second line: rely on the draft description note ("A confident tone … is wording. It is not a measurement…") and leave the film as approved.
  - Do not re-record s16. The line is not factually wrong.
- **F3 (minor, documentation).**
  - `script/FINAL_SCRIPT.md` is still the pass-2 script. Its s03, s11, s33 and s35 lines differ from V2, s36 is missing, and it says "voice Marcus K". Regenerate it from `narration_segments.json` plus `timeline.json`.
  - `research/sources.md` is stale in the ways listed below. Replace it with, or point it to, this ledger.
- **No spoken line needs to change for accuracy.** All 36 segments are supported as worded.

## What was stale in the pass-2 `research/sources.md` (corrected here)

| Pass-2 ledger says | V2 film actually has | Effect |
|---|---|---|
| Header: built against "pass-2 v1.0" text | V2 text (2026-10-07). s03, s11, s33 and s35 are reworded and s36 is new. | Quotes re-mapped above. |
| Row 3 quotes "Three polished answers. All wrong." | s03: "Three different answers. None of them are right. Not one even had the right year." | Same source (P p. 2 caption). |
| Row 8: on screen "real tokens · o200k_base" | "GPT-4o tokenizer (o200k_base)" plus the real token ids 22187 / 1361 | Still ✓ (re-verified with K and J). |
| Row 10 quotes "Here, it picked the likely one. Not the true one." | s11 adds "it's choosing the last digit of the year" | New claim, verified: " 2002" gives " " + "200" + "2". |
| Row 11: modules labelled "simplified diagram" | No such label. The modules read "Instruction training / Step-by-step reasoning / Web search (sometimes)". | Acceptable, since the narration is accurate. The ledger was wrong. |
| Row 18: the qualification kept "in spirit" | s27 says it verbatim: "It's one explanation, not the whole story." | Stronger. |
| Row 19: scores labelled "example" | "illustrative quiz · 10 questions · 4 options each · expected scores" | Stronger. |
| Row 20: chip "ten benchmarks sampled from major leaderboards, mid-2025" | "ten benchmarks sampled mid-2025 · CC BY 4.0" plus the flap "SAMPLED MID-2025" | ✓ |
| Row 22 / A5: S8 slips labelled "Illustration" | "illustrative re-run" | ✓ |
| Row 24: s33 "evidence the model does not have" | "doesn't always have" | More hedged, so better. |
| Row 25: "Works for chatbots. Works for people, too." | "Works on chatbots. Works pretty well on people, too." | Joke, not a claim. |
| Row 15 and suggested lines: thesis via the MSR URL; no Nature | The owner requires the CMU URL and the Nature citation | See `SOURCES_DRAFT.md`. |
| Access status: arXiv and CMU "not re-fetched" | arXiv v1 re-verified (bucket copy, hash match). tiktoken `model.py` re-fetched. arxiv.org, cmu.edu and nature.com remain unreachable from this machine. | Recorded in the key table. |

## Open items for a human before publishing

1. Open https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-01-132.pdf once and confirm it shows the same title page.
2. Open https://doi.org/10.1038/s41586-026-10549-w once. Confirm the page range 1047–1051 and the online date 22 April 2026 (these come from search metadata only).
3. Open https://arxiv.org/abs/2509.04664 and check whether a version after v1 changes Table 1, Table 2 or the section numbers. The description cites v1 explicitly, so it stays correct either way.

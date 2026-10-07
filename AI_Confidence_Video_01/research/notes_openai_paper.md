# Research notes: Kalai, Nachum, Vempala, Zhang (2025), "Why Language Models Hallucinate"

Project: "Why AI Sounds Right When It's Wrong" (Blake Kimble, faceless explainer, 4–5 min)
Notes compiled: 2026-10-07 (UTC). Everything below is marked by how it was obtained:

- **[DIRECT]**: I read the original file myself during this session. Quotes come from the local PDF, checked against the rendered page image where it mattered.
- **[SEARCH-ONLY]**: I learned it only from WebSearch result titles, URLs or summaries. I did not open the original. Treat it as a lead to check, not as a citation.
- **[NOT ACCESSED]**: the host is blocked by network policy, so I could not open it.

I did not watch or listen to any video or talk.

---

## 0. Access log (what was and was not read)

| Source | Status | Notes |
|---|---|---|
| Local PDF `research/sources_raw/kalai2025_why_lms_hallucinate_v1.pdf` (36 pp., 815,337 bytes, sha256 `74f3ea8b…41784`) | **[DIRECT]** | Read in full (pp. 1–36) using pdftotext. Key passages checked against 300-dpi renders. |
| Same file in arXiv's official GCS bucket `gs://arxiv-dataset/arxiv/arxiv/pdf/2509/2509.04664v1.pdf` | **[DIRECT]** (metadata) | Bucket md5 `c81b09a29d2098240bfb84f224a15d3c` is identical to the local copy, so the local file is the genuine arXiv v1. |
| PDF embedded metadata | **[DIRECT]** | `License: http://creativecommons.org/licenses/by/4.0/`, `DOI: https://doi.org/10.48550/arXiv.2509.04664`, `arXivID: https://arxiv.org/abs/2509.04664v1`, XMP MetadataDate 2025-09-11. |
| arxiv.org abs/html pages | **[NOT ACCESSED]** (blocked) | |
| OpenAI blog `https://openai.com/index/why-language-models-hallucinate/` | **[NOT ACCESSED]** (blocked) | Date known only from search (see §1). |
| OpenAI's own PDF copy `cdn.openai.com/pdf/d04913be-…/why-language-models-hallucinate.pdf` | **[NOT ACCESSED]** (blocked) | URL seen only in search results. |
| Kalai 2001 thesis PDF on microsoft.com | **[DIRECT]** | See §4. |
| GPT-4 Technical Report arXiv:2303.08774v6 (arXiv GCS bucket) | **[DIRECT]** | Used to check where the paper's Figure 2 comes from (see §2.9). |
| DeepMind IMO 2025 solutions PDF (storage.googleapis.com/deepmind-media) | **[DIRECT]** | See §6. |
| deepmind.google blog, imo-official.org, mathgenealogy.org, proquest.com, web.mit.edu, cmu.edu | **[NOT ACCESSED]** | Blocked by policy or proxy (403). |

---

## 1. Bibliographic info and version check

- **Title:** Why Language Models Hallucinate **[DIRECT]**
- **Authors and affiliations (p. 1):** Adam Tauman Kalai (OpenAI), Ofir Nachum (OpenAI), Santosh S. Vempala (Georgia Tech), Edwin Zhang (OpenAI). **[DIRECT]**
  - Footnotes on p. 1: Kalai email adam@kal.ai. Vempala: "Supported in part by NSF award CCF-2106444 and a Simons Investigator award."
- **Date on paper:** "September 4, 2025". The arXiv side stamp reads "arXiv:2509.04664v1 [cs.CL] 4 Sep 2025". **[DIRECT]**
- **Version:** v1. **Category:** cs.CL. **License:** CC BY 4.0 (from PDF metadata). **[DIRECT]**
- **URL:** https://arxiv.org/abs/2509.04664 (DOI 10.48550/arXiv.2509.04664)
- **Peer review:** v1 is an arXiv preprint. I found no evidence that it was published at a venue. One search turned up talk pages (IAS, UW Math, ODSC) but no venue. Status: unknown. **[SEARCH-ONLY]**
- **OpenAI blog post:** https://openai.com/index/why-language-models-hallucinate/. **[NOT ACCESSED]** Two separate search summaries give the publication date as **5 September 2025**, the day after the arXiv v1 date. One of them is an Analytics India Mag write-up saying "OpenAI said in its blog post on September 5". Treat this date as **[SEARCH-ONLY]**.
  - The search summary also paraphrases the blog's examples: a birthday guess has a "1-in-365 chance", and on SimpleQA o4-mini reached ~24% accuracy with ~75% wrong answers versus gpt-5-thinking-mini at ~22% accuracy with ~26% wrong, the latter abstaining more often. These numbers come from the blog, **not the paper**, and I saw them only through secondary press summaries. **Do not put them on screen unless someone opens the blog directly.** I could not confirm the abstention-rate numbers through search.

### Newer versions?

- **arXiv dataset bucket [DIRECT]:**
  - `2509.04664v2.pdf`, `v3`, `v4` all returned HTTP 404.
  - An object listing on prefix `arxiv/arxiv/pdf/2509/2509.04664` returns only `2509.04664v1.pdf` (created 2025-09-14).
  - The bucket is current: it already holds 2610.* papers added 2026-10-04, and it does carry later versions of other papers (e.g. 2510.00002v2 added 2025-12-07).
  - So no v2 had appeared as of early October 2026, as far as this mirror shows. The mirror could in principle lag, so this is strong evidence but not proof.
- **WebSearch [SEARCH-ONLY]:** two queries, including one for "2509.04664v2" and "2509.04664v3", returned only v1 links. One summary said "I did not find versions v2 or v3".
- **Conclusion:** cite **v1 (4 Sep 2025)**. Because v1 contains a numerical slip (see §2.6 "ERRATUM FLAG"), re-check arxiv.org from an unblocked machine before publishing in case a correction appears.

---

## 2. Exact quotes (from v1; page = printed page number, which equals the PDF page index)

Hyphens that only split a word across a line break have been rejoined (e.g. "fundamen-tally" becomes "fundamentally"). All other wording, punctuation and quote marks are as printed. "[…]" marks my omissions.

### 2.1 Abstract (p. 1, full text)

> "Like students facing hard exam questions, large language models sometimes guess when uncertain, producing plausible yet incorrect statements instead of admitting uncertainty. Such “hallucinations” persist even in state-of-the-art systems and undermine trust. We argue that language models hallucinate because the training and evaluation procedures reward guessing over acknowledging uncertainty, and we analyze the statistical causes of hallucinations in the modern training pipeline. Hallucinations need not be mysterious—they originate simply as errors in binary classification. If incorrect statements cannot be distinguished from facts, then hallucinations in pretrained language models will arise through natural statistical pressures. We then argue that hallucinations persist due to the way most evaluations are graded—language models are optimized to be good test-takers, and guessing when uncertain improves test performance. This “epidemic” of penalizing uncertain responses can only be addressed through a socio-technical mitigation: modifying the scoring of existing benchmarks that are misaligned but dominate leaderboards, rather than introducing additional hallucination evaluations. This change may steer the field toward more trustworthy AI systems." (p. 1)

Opening of the introduction (p. 1):

> "Language models are known to produce overconfident, plausible falsehoods, which diminish their utility and trustworthiness. This error mode is known as “hallucination,” though it differs fundamentally from the human perceptual experience. Despite significant progress, hallucinations continue to plague the field, and are still present in the latest models (OpenAI, 2025a)." (p. 1)

(OpenAI 2025a is the GPT-5 System Card, "Accessed: 2025-09-02", p. 22.)

### 2.2 Birthday example and footnote 1 (p. 1)

> "What is Adam Tauman Kalai’s birthday? If you know, just respond with DD-MM."
>
> "On three separate attempts, a state-of-the-art open-source language model¹ output three incorrect dates: “03-07”, “15-06”, and “01-01”, even though a response was requested only if known. The correct date is in Autumn. Table 1 provides an example of more elaborate hallucinations." (p. 1)

Footnote 1 (p. 1):

> "The language model was DeepSeek-V3 (600 B parameters), accessed via the DeepSeek app on 11 May 2025."

- **Model:** DeepSeek-V3.
- **Access:** DeepSeek app, 11 May 2025.
- **Sample size:** three attempts.

The paper gives only "Autumn" for the true date and does not state it. Don't reveal or guess it.

### 2.3 Table 1: dissertation-title hallucinations (p. 2, verbatim)

| Label in table | Excerpt (verbatim, including the paper's ellipses) |
|---|---|
| ChatGPT: (GPT-4o) | Adam Tauman Kalai’s Ph.D. dissertation (completed in 2002 at CMU) is entitled: “Boosting, Online Algorithms, and Other Topics in Machine Learning.” |
| DeepSeek: | “Algebraic Methods in Interactive Machine Learning”. . . at Harvard University in 2005. |
| Llama: | “Efficient Algorithms for Learning and Playing Games”. . . in 2007 at MIT. |

Caption (p. 2):

> "Table 1: Excerpts from responses to “What was the title of Adam Kalai’s dissertation?” from three popular language models.³ None generated the correct title or year (Kalai, 2001)."

Footnote 3 (p. 2):

> "The models were freely accessed 2025-05-09 via chatgpt.com, the DeepSeek app (R1, DeepSeek-AI et al., 2025), and huggingface.co (Llama-4-Scout-17B-16E-Instruct), respectively. None of the models searched the Web."

Points for the script:

- **The three models:**
  - GPT-4o via chatgpt.com
  - **DeepSeek-R1** (not V3) via the DeepSeek app
  - Llama-4-Scout-17B-16E-Instruct via huggingface.co
- **Access date and conditions:** all three accessed 9 May 2025. **No web search was used.**
- **Excerpts only:** the ". . ." marks are the paper's. Full responses are not published, so do not reconstruct them.
- **GPT-4o got the institution right (CMU)** but the title and year wrong. The caption's claim is precisely "None generated the correct title or year". Don't say "all three got the university wrong".
- **One prompt per model.** This is a demonstration, not a measured error rate.

### 2.4 Reference entry "Kalai, 2001" (bibliography, p. 19, verbatim; title italic in the PDF)

> "Adam Kalai. 2001. *Probabilistic and on-line methods in machine learning*. PhD Thesis. Carnegie Mellon University."

### 2.5 Post-training and evaluation argument (binary grading rewards guessing)

The test-taker analogy (p. 4):

> "As an analogy, consider the following context where humans also occasionally fabricate plausible-sounding information. When uncertain, students may guess on multiple-choice exams and even bluff on written exams, submitting plausible answers in which they have little confidence. Language models are evaluated by similar tests. In both settings, guessing when unsure maximizes the expected score under a binary 0-1 scheme that awards 1 point for a correct answer and none for blanks or IDKs. Bluffs are often overconfident and specific, such as “September 30” rather than “Sometime in autumn” for a question about a date. Many language-model benchmarks mirror standardized human exams, using binary metrics such as accuracy or pass-rate. Optimizing models for these benchmarks may therefore foster hallucinations. Humans learn the value of expressing uncertainty outside of school, in the school of hard knocks. On the other hand, language models are primarily evaluated using exams that penalize uncertainty. Therefore, they are always in “test-taking” mode. Put simply, most evaluations are not aligned." (p. 4; the paragraph begins at the top of p. 4)

> "We are not the first to realize that binary grading does not measure hallucination." (p. 4)

The Model A versus Model B comparison (p. 4; grammar as printed):

> "Suppose Model A is an aligned model that correctly signals uncertainty and never hallucinates. Let Model B be similar to Model A except that it never indicates uncertainty and always “guesses” when unsure. Model B will outperform A under 0-1 scoring, the basis of most current benchmarks. This creates an “epidemic” of penalizing uncertainty and abstention, which we argue that a small fraction of hallucination evaluations won’t suffice. The numerous primary evaluations must be adjusted to stop penalizing abstentions when uncertain."

Section 4 opening (p. 12):

> "Post-training should shift the model from one which is trained like an autocomplete model to one which does not output confident falsehoods (except when appropriate, e.g., when asked to produce fiction). However, we claim that further reduction of hallucinations is an uphill battle, since existing benchmarks and leaderboards reinforce certain types of hallucination. […] This is a socio-technical problem in the sense that, not only do the existing evaluations need to be modified, but these changes need to be adopted in the influential leaderboards."

Section 4.1 (pp. 12–13):

> "Binary evaluations of language models impose a false right-wrong dichotomy, award no credit to answers that express uncertainty, omit dubious details, or request clarification. Such metrics, including accuracy and pass rate, remain the field’s prevailing norm, as argued below. Under binary grading, abstaining is strictly sub-optimal. IDK-type responses are maximally penalized while an overconfident “best guess” is optimal." (p. 12, last sentence and a half on p. 13)

Formal definition (p. 13):

> "A grader gc : Rc → R is said to be binary if {gc(r) | r ∈ Rc} = {0, 1} and gc(r) = 0 for all r ∈ Ac."

Here Ac is the set of abstentions such as IDK. In plain terms: right = 1, everything else, including "I don't know", = 0.

> "Observation 1. Let c be a prompt. For any distribution ρc over binary graders, the optimal response(s) are not abstentions […]" (p. 13)

> "Therefore, additional hallucination evaluations may not suffice when the primary evaluations penalize honestly reporting confidence and uncertainty." (p. 13)

The authors call the proof of Observation 1 "trivial" (p. 13, proof in Section E, p. 33).

### 2.6 Explicit confidence-target proposal (Section 4.2, pp. 13–14)

> "Human tests are similarly mostly binary, and it has been recognized that they also reward overconfident bluffing. […] Nonetheless, some standardized national exams operate or have operated using penalties for incorrect answers (or equivalently partial credit for abstaining), including Indian JEE, NEET, and GATE exams; AMC tests from the Mathematical Association of America; and US standardized SAT, AP, and GRE tests in earlier years." (p. 13)

> "Similarly, we propose evaluations explicitly state confidence targets in their instructions, within the prompt (or system message). For example, one could append a statement like the following to each question:
>
> Answer only if you are > t confident, since mistakes are penalized t/(1 − t) points, while correct answers receive 1 point, and an answer of “I don’t know” receives 0 points.
>
> There are several natural values of t including t = 0.5 (penalty 1), t = 0.75 (penalty 2), and t = 0.9 (penalty 9). A threshold of t = 0 corresponds to binary grading and could be described by, e.g., “Make your best guess even if you are unsure, as if you were taking an exam.” A simple calculation shows that the expected score of offering an answer beats IDK (score 0) iff its confidence (i.e., probability of being correct) is > t." (pp. 13–14; the final sentence finishes at the top of p. 14, below Table 2)

**ERRATUM FLAG [DIRECT, checked on the rendered image of p. 13]:** v1 prints "t = 0.75 (penalty 2)", but the paper's own formula gives t/(1 − t) = 0.75/0.25 = **3**. The other two examples are consistent (0.5 gives 1; 0.9 gives 9). A penalty of 2 would match t = 2/3, not 0.75.

For the video:

- Use the formula value (**wrong = −3 at t = 0.75**).
- Never show the printed "(penalty 2)" next to t = 0.75 without a correction note.
- If p. 13 appears on screen, crop above that line or add an on-screen "[sic]/correction" note.

What they say is new (p. 14):

> "Such penalties have been well-studied within hallucination research (Ji et al., 2023). However, we suggest two subtle variations which have statistical ramifications. First, we propose making the confidence threshold explicit in the instructions, whereas the prior work has largely omitted mentioning the confidence targets or penalties in the instructions. (A notable exception is the work of Wu et al. (2025) who introduce “risk-informing” prompts with explicit penalties.)"

> "Second, we suggest incorporating confidence targets into existing mainstream evaluations, such as the popular SWE-bench (Jimenez et al., 2024) which involves binary grading of software patches, while the majority of prior work has introduced implicit error penalties in bespoke hallucination evaluations." (p. 14)

> "A single model may be best across all thresholds, if the threshold is explicit. However, if the threshold is not stated, then there is an inherent tradeoff, and no single model will be best in general (other than one that is always correct)." (p. 14)

"Behavioral calibration" (pp. 14–15):

> "With explicit confidence targets, there is one behavior which is simultaneously optimal for all targets—outputting IDK among examples where its correctness probability is greater than the target. Let us refer to this as behavioral calibration–rather than requiring the model to output a probabilistic confidence (Lin et al., 2022a), it must formulate the most useful response in which it is at least t confident. […] Existing models may or may not exhibit behavioral calibration, but it may prove useful as an objective evaluation."

Note: as printed, "outputting IDK among examples where its correctness probability is greater than the target" reads as the reverse of the rule just stated on p. 14 (answer if confidence > t, otherwise IDK). This is my reading of an apparent wording slip. Quote it only with care, or paraphrase the p. 14 "iff … > t" sentence instead.

### 2.7 Benchmark table: Table 2 (p. 14, verbatim)

Caption:

> "Table 2: Summary of evaluation benchmarks analyzed in this work and their treatment of abstentions. “Binary grading” indicates that the primary metric is a strict correct/incorrect accuracy; “IDK credit” denotes whether abstentions can earn any credit."

| Benchmark | Scoring method | Binary grading | IDK credit |
|---|---|---|---|
| GPQA | Multiple-choice accuracy | Yes | None |
| MMLU-Pro | Multiple-choice accuracy | Yes | None |
| IFEval | Programmatic instruction verification | Yes^a | None |
| Omni-MATH | Equivalence grading* | Yes | None |
| WildBench | LM-graded rubric* | No | Partial^b |
| BBH | Multiple-choice / exact-match | Yes | None |
| MATH (L5 split) | Equivalence grading* | Yes | None |
| MuSR | Multiple-choice accuracy | Yes | None |
| SWE-bench | Patch passes unit tests | Yes | None |
| HLE | Multiple-choice / equivalence grading* | Yes | None |

Footnotes:

- "* Grading is performed using language models, hence incorrect *bluffs* may occasionally be scored as correct."
- "a IFEval aggregates several binary rubric sub-scores into a composite score."
- "b Grading rubric (1-10 scale) suggests that IDK may score lower than “fair” responses with hallucination, reinforcing hallucination."

Supporting text (Appendix F, pp. 33–36):

> "Only one evaluation included in one of the leaderboards, WildBench (Lin et al., 2025), offers minimal credit given for indicating uncertainty." (p. 33)

> "Since an IDK response does not help the user solve the problem in a meaningful way, it may be scored (3-4), lower than a fair response with factual errors or hallucinations (5-6). Thus, the grading may encourage guessing." (p. 35, WildBench)

SWE-bench (p. 35):

> "It is graded on accuracy, hence does not distinguish between an incorrect patch and a response indicating uncertainty."

HLE (p. 36):

> "Like most evaluations, the primary metric is binary accuracy, offering no credit for IDK. At the time of writing, all reported scores were below 30% accuracy on HLE."

Honesty caveats the paper itself provides:

- The sample is ten evaluations drawn from four sources: the HELM Capabilities leaderboard (accessed 2025-06-24, footnote 7, p. 34), the Open LLM Leaderboard ("updates to this leaderboard ceased in 2025", p. 35), SWE-bench, and HLE.
- Some evaluations do allow IDK. For example, BBQ on HELM's Safety leaderboard "contains many questions where the correct answer is explicitly listed as IDK" (p. 35).
- So the video should say "most of the popular benchmarks the authors checked", not "all AI tests".

### 2.8 Calibration statements

The paper's Figure 2 caption (p. 8):

> "Figure 2: GPT-4 calibration histograms before (left) and after (right) reinforcement learning (OpenAI, 2023a, Figure 8, reprinted with permission). These plots are for multiple-choice queries where the plausible responses are simply A, B, C, or D. The pretrained model is well calibrated."

Panel labels inside the figure image (read visually; the figure is a raster image and has no extractable text):

- left: "Calibration curve (model=pre-train)", "ECE: 0.007"
- right: "Calibration curve (model=ppo)", "ECE: 0.074"

Main text (p. 8):

> "Hallucinations are inevitable only for base models. Many have argued that hallucinations are inevitable (Jones, 2025; Leffer, 2024; Xu et al., 2024). However, a non-hallucinating model could be easily created, using a question-answer database and a calculator, which answers a fixed set of questions such as “What is the chemical symbol for gold?” and well-formed mathematical calculations such as “3 + 8”, and otherwise outputs IDK. Moreover, the error lower-bound of Corollary 1 implies that language models which do not err must not be calibrated, i.e., δ must be large. As our derivations show, calibration—and, hence, errors—is a natural consequence of the standard cross-entropy objective. Indeed, empirical studies (Fig. 2) show that base models are often found to be calibrated, in contrast to post-trained models which may deviate from cross-entropy in favor of reinforcement learning."

The original source, checked **[DIRECT]** in arXiv:2303.08774v6 (GPT-4 Technical Report, OpenAI) from the arXiv bucket:

> "GPT-4 can also be confidently wrong in its predictions, not taking care to double-check work when it’s likely to make a mistake. Interestingly, the pre-trained model is highly calibrated (its predicted confidence in an answer generally matches the probability of being correct). However, after the post-training process, the calibration is reduced (Figure 8)." (GPT-4 TR v6, PDF pp. 10–11)

Figure 8 caption, GPT-4 TR v6, PDF p. 12:

> "Left: Calibration plot of the pre-trained GPT-4 model on a subset of the MMLU dataset. On the x-axis are bins according to the model’s confidence (logprob) in each of the A/B/C/D choices for each question; on the y-axis is the accuracy within each bin. The dotted diagonal line represents perfect calibration. Right: Calibration plot of the post-trained GPT-4 model on the same subset of MMLU. The post-training hurts calibration significantly."

Scope of this evidence:

- **One model** (GPT-4, 2023), **one task format** (4-option multiple choice on an MMLU subset), and confidence measured from token log-probabilities.
- It does not show that every post-trained model is miscalibrated, or that it holds for open-ended answers. The paper itself hedges with "often found to be calibrated" and "may deviate".

Rights note: Figure 2 is "reprinted with permission" from OpenAI. The paper's CC BY 4.0 licence may not cover that third-party figure. Prefer redrawing the idea schematically, labelled "after OpenAI (2023), GPT-4 Technical Report, Fig. 8", rather than screenshotting it.

The paper on calibration error as a metric (p. 36, HLE section):

> "Calibration error is not a proper hallucination metric because: • A model could hallucinate 100% of the time with 0 calibration error if it always generates incorrect and indicated 0% confidence in each answer. […] • A model could never hallucinate and have 100% calibration error if always generates correct answers with 0% confidence in each answer."

Also from p. 36:

> "Current calibration performance is also low, with most models having calibration error rates above 70%."

### 2.9 Scope: reasoning and retrieval models; not tied to next-word prediction

> "Our error analysis is general yet has specific implications for hallucination. It applies broadly, including to reasoning and search-and-retrieval language models, and the analysis does not rely on properties of next-word prediction or Transformer-based neural networks. It only considers the two stages of the modern training paradigm: pretraining and post-training, described below." (p. 2)

> "Not merely autocomplete. Our analysis applies to general density estimation and not only “next-word predictors” even though many language models are trained using self-supervised learning to predict each word based on the previous words. […] Our analysis suggests that errors arise from the very fact that the models are being fit to the underlying language distribution, though the specific architecture can introduce additional errors." (p. 6)

Training data does not need to contain errors (p. 2):

> "However, we show that even if the training data were error-free, the objectives optimized during language model training would lead to errors being generated. With realistic training data containing shades of error, one may expect even higher error rates."

### 2.10 Retrieval and search do not fully solve it (p. 15, Section 5)

> "Search (and reasoning) are not panaceas. A number of studies have shown how language models augmented with search or Retrieval-Augmented Generation (RAG) reduce hallucinations (Lewis et al., 2020; Shuster et al., 2021; Nakano et al., 2021; Zhang and Zhang, 2025). However, Observation 1 holds for arbitrary language models, including those with RAG. In particular, the binary grading system itself still rewards guessing whenever search fails to yield a confident answer. Moreover, search may not help with miscalculations such as in the letter-counting example, or other intrinsic hallucinations."

This passage concedes that search *reduces* hallucinations. The claim is only that search does not remove the incentive to guess. Remember too that **Table 1's models did not search the web** (footnote 3, p. 2).

Related: the reasoning model counted letters correctly (p. 11):

> "the DeepSeek-R1 reasoning model reliably counts letters, e.g., producing a 377-chain-of-thought that includes: Let me spell it out: D-E-E-P-S-E-E-K. […] So, the number of Ds is 1."

"377-chain-of-thought" is as printed; a word appears to be missing. The paper attributes the earlier letter-count failures to a "poor model" factor, including tokenization (D/EEP/SEE/K). The non-reasoning results were "DeepSeek-V3 returned “2” or “3” in ten independent trials; Meta AI and Claude 3.7 Sonnet performed similarly, including answers as large as “6” and “7”" (p. 2). Footnote 2 says Meta AI and Claude were accessed May 9, 2025.

### 2.11 Limitations the authors state (Section 5, pp. 15–16)

- **Framing (p. 15):** "It is difficult for the field to agree upon how to define, evaluate and reduce hallucinations due to their multifaceted nature. A statistical framework must prioritize certain aspects and omit others, for simplicity."
- **Plausibility and nonsense (p. 15):** "by considering only plausible strings X, our analysis ignores the possibility of generating nonsensical strings (which state-of-the-art language models rarely generate)." They add that the theorem still holds with modified definitions.
- **Open-ended generations (p. 15):** "For simplicity, the examples presented in this paper are oriented towards a single factual question. However, hallucinations often arise for open-ended prompts, such as “Write a biography about. . . .” […] in such a case it would be natural to consider degrees of hallucination depending on how many errors there are."
- **Search and reasoning:** not panaceas (quoted in §2.10).
- **Latent context (p. 15):** "Some errors cannot be judged by the prompt and response alone. […] Such ambiguities do not fit our error definition which does not depend on context external to the prompt and response."
- **A false trichotomy (p. 15):** "Our formalism does not distinguish between errors of different magnitudes or degrees of uncertainty. Clearly, the correct/incorrect/IDK categories are also incomplete."
- **Beyond IDK (p. 16):** "There are numerous ways to signal uncertainty, such as hedging, omitting details, and asking questions. […] this can also lead to unnatural utterances, such as, “I’m 1/365 certain that Kalai’s birthday is March 7th.” The present paper focuses on the statistical factors regarding the top-level decision of what is said."
- **Training-data assumption (p. 9):** "Although assuming that the training data contain model dialogues drawn from the same prompt distribution is unrealistic, even higher error rates may be expected when the assumption fails."
- **Implicit limitation, my observation:** v1 contains **no new training experiments**. Nobody retrained a model under confidence-target grading and measured the result. The post-training argument rests on Observation 1, which is simple decision theory, plus the 10-benchmark meta-evaluation. The empirical items are small demonstrations: the birthday prompt (3 tries), Table 1 (3 models, 1 prompt each), and letter counting (10 trials).

### 2.12 The "Is-It-Valid" reduction in one plain sentence

Plain version: **Writing only true answers is at least as hard as telling true answers from plausible false ones on a yes/no quiz. So if a model would fail that "is this valid?" quiz on some kind of fact, it will also make up false answers about that kind of fact, with a generation error rate of roughly at least twice its quiz error rate, minus small correction terms.**

Source wording:

> "Generating valid outputs is in some sense harder than answering these Yes/No questions, because generation implicitly requires answering “Is this valid” about each candidate response." (p. 2)

> "(generative error rate) ≳ 2 · (IIV misclassification rate)." (p. 3)

The formal version is Corollary 1 (p. 7) and Theorem 1 (p. 9): err ≥ 2·err_iiv − |V|/|E| − δ, where δ is a calibration term.

### 2.13 The singleton-rate idea in one plain sentence

Plain version: **If a fact, such as one person's birthday, appears only once in the training text, there is no pattern to learn it from. So the share of facts seen exactly once gives a rough floor on how often a base model, before post-training, will hallucinate on questions of that type. If 20% of birthday facts appear once, expect at least about 20% wrong birthday answers.**

Source wording (p. 3):

> "…recovers their bound that the hallucination rate, after pretraining, should be at least the fraction of training facts that appear once. For instance, if 20% of birthday facts appear exactly once in the pretraining data, then one expects base models to hallucinate on at least 20% of birthday facts."

From p. 10:

> "Notable birthdays like Einstein’s appear multiple times, whereas others may only occur once, e.g., in an obituary. Large language models seldom err on frequently referenced facts, e.g., Einstein’s birthday or dissertation title."

The idea builds on "Alan Turing’s elegant “missing-mass” estimator (Good, 1953)" (p. 10). Formal statement: Theorem 2, p. 10, which holds with probability ≥ 99% and has subtracted correction terms.

---

## 3. Classification of core ideas

Key:

- (a) established, widely accepted mechanism or fact
- (b) this paper's particular argument or explanation
- (c) good as a simplified illustration
- (d) unresolved or open

| # | Idea | Class | Notes and guardrails |
|---|---|---|---|
| 1 | LMs sometimes produce fluent, confident, false statements ("hallucinations") | **(a)** | Widely documented. The paper's own examples are anecdotes from May 2025 versions of specific models. Don't present them as current error rates. |
| 2 | Under right=1 / everything-else=0 grading, answering always beats "I don't know" in expected score | **(a)** | Elementary expected-value math, the same logic as guessing on a test with no penalty. The paper calls the proof "trivial" (p. 13). |
| 3 | Penalty scoring (negative marking) changes the best strategy; break-even at confidence t when wrong = −t/(1−t) | **(a)**, with a **(b)** twist | Negative marking is long-established. The paper says such penalties "have been well-studied" (p. 14). Its **own** proposal is to state the threshold explicitly in each prompt and to add it to mainstream benchmarks such as SWE-bench (p. 14). |
| 4 | Hallucinations *persist after post-training mainly because* mainstream benchmarks and leaderboards reward guessing (socio-technical "epidemic") | **(b)** | The headline argument. Supported by Observation 1 and a 10-benchmark survey (Table 2). **Not experimentally tested in v1.** It is a strong, plausible incentive argument, not a measured causal effect. Other drivers (RLHF reward models, data, decoding) are not ruled out, and §2 of the paper lists many. Say "the authors argue". |
| 5 | Pretraining errors are inevitable for well-calibrated base models, via the Is-It-Valid reduction (generation error ≳ 2 × classification error) | **(b)**, built on (a) | The authors say the reduction is novel "to the best of our knowledge" (p. 4). It relies on established computational learning theory. It is a mathematical bound under stated assumptions: plausible strings only, error-free training data, a single way to write each fact, and a calibration term δ assumed small. |
| 6 | Singleton-rate floor (≈ fraction of once-seen facts) | **(b)**, built on (a) | Builds on Good–Turing missing-mass estimation (1953, established) and Kalai & Vempala (STOC 2024). It is a theoretical lower bound for **base models** on arbitrary facts with no pattern. It is **not** a measured statistic for any chatbot. The "20%" is the paper's hypothetical. |
| 7 | Base (pretrained) models tend to be calibrated; post-training (RL) can reduce calibration | **(a)/(b)** | Documented for GPT-4 on an MMLU subset in multiple-choice format (OpenAI 2023, Fig. 8): ECE 0.007 before vs 0.074 after. The paper generalizes this as "often found". Don't extend it beyond what one model and one format show. Its argument that cross-entropy training *implies* calibration (small δ) is (b). |
| 8 | Some hallucination causes are "poor models" (e.g. tokenization and letter counting), computational hardness, distribution shift, garbage in / garbage out (GIGO) | **(a)** | Long-studied error sources. The paper maps them onto its framework (Sections 3.3–3.4). |
| 9 | Search/RAG reduces but doesn't eliminate hallucination; the grading incentive remains | (a) that RAG helps; **(b)** that the incentive persists | Partly an argument rather than data. |
| 10 | "Behavioral calibration" as an evaluation target | **(b)**, **(d)** | A proposal. The authors write: "Existing models may or may not exhibit behavioral calibration" (p. 15). |
| 11 | Hallucinations are *not* inevitable for post-trained systems (a database plus calculator plus IDK never errs) | **(b)** | A deliberately trivial existence argument (p. 8). It does not show that a useful general model can reach zero hallucination. |
| 12 | Student-guessing-on-an-exam analogy; birthday 1-in-365; "IDK = 0 points" | **(c)** | The paper's own analogy (p. 4), so it is safe to use as illustration. Label our quiz numbers (§5) as an analogy, not model data. |
| 13 | Would changing leaderboard scoring actually change lab training and reduce real-world hallucinations? Which thresholds? How do you grade open-ended answers, partial errors, hedging? How do you avoid over-abstention (a model that says IDK too often is useless)? | **(d)** | All open. The paper flags the open-ended, latent-context and false-trichotomy limits itself (§2.11). The "ideal penalty might reflect likely real-world harms, but that is impractical" (p. 14). |

**Don't overgeneralize:**

- The birthday demonstration is 3 tries on 1 model.
- Table 1 is 1 prompt on each of 3 models, all on one day (2025-05-09), with no web search.
- The calibration figure covers 1 model in 1 format.
- The benchmark audit covers 10 evaluations as of mid-2025.

---

## 4. Independent verification of the real dissertation

**Result: confirmed by a primary source I fetched directly.**

- **Title as on the title page:** *Probabilistic and On-line Methods in Machine Learning*. The paper's bibliography uses sentence case: "Probabilistic and on-line methods in machine learning".
- **Author:** Adam Kalai.
- **Date on title page:** May 16, 2001.
- **Tech report number:** CMU-CS-01-132.
- **Institution:** School of Computer Science, Computer Science Department, Carnegie Mellon University, Pittsburgh, PA 15213-3890.
- **Thesis committee:** Avrim Blum (chair), Manuel Blum, Danny Sleator, Santosh Vempala.
- **Advisor:** Avrim Blum. Two independent indications:
  - committee chair on the title page **[DIRECT]**
  - acknowledgments: "I came to CMU in large part because of Avrim Blum. After three advisors, I can say with full confidence that Avrim is the best advisor and teacher at CMU." **[DIRECT]**
  - The Mathematics Genealogy Project lists Avrim Blum as advisor **[SEARCH-ONLY]**.
- **Nice detail, verified:** Santosh Vempala was on Kalai's 2001 thesis committee and is a co-author of the 2025 paper. The acknowledgments also say "Next year I’ll be at MIT under the supervision of Santosh Vempala."
- **Plausibility, my interpretation (not a claim made by the paper):** each wrong answer in Table 1 sits near something real. GPT-4o named the right school (CMU) with the wrong year, 2002 instead of 2001. Llama named MIT, where per the acknowledgments Kalai was headed next. DeepSeek named Harvard, where search snippets say he did his BA, which is [SEARCH-ONLY]. That fits the "plausible falsehood" idea. Present it as our observation, if at all.

### URLs found

| URL | What it shows | How obtained |
|---|---|---|
| https://www.microsoft.com/en-us/research/wp-content/uploads/2016/11/pre-2003-thesis.pdf | The full thesis PDF: 46 PDF pages, PDF CreationDate 17 May 2001, original title "00-pream.dvi". The title page reads exactly as described above. The abstract begins "On the surface, the three on-line machine learning problems analyzed in this thesis may seem unrelated." Topics: Cover's universal portfolio (on-line investment), k-fold cross-validation, adaptive binary search trees. sha256 `93e2d6e9…b4bbb6`. | **[DIRECT]** (curl, HTTP 200) |
| https://www.microsoft.com/en-us/research/publication/better-computers-better-people/ | Microsoft Research publication page. **Caution:** its page title is "Better Computers for Better People", apparently a mislabel on the MSR site. The body says "Adam Tauman Kalai PhD Thesis: Ph.D. thesis, technical report CMU-CS-01-132, 2001 \| May 2001", carries the thesis abstract, and links the PDF above. Don't use this page's title as the thesis title. | **[DIRECT]** (curl, HTTP 200) |
| https://www.csd.cs.cmu.edu/sites/default/files/phd-thesis/CMU-CS-01-132.pdf | CMU CSD-hosted copy of the thesis. Search summary: "44-page PhD dissertation", same committee. | **[SEARCH-ONLY]** (cmu.edu blocked) |
| https://csd.cmu.edu/academics/doctoral/degrees-conferred/adam-kalai (also csd.cs.cmu.edu and csd-web-01.andrew.cmu.edu variants) | CMU CSD "degrees conferred" page for Adam Kalai | **[SEARCH-ONLY]** (blocked) |
| https://www.cs.cmu.edu/afs/cs.cmu.edu/user/akalai/www/cv/cv.html | Kalai's old CMU CV page | **[SEARCH-ONLY]** (blocked) |
| https://www.mathgenealogy.org/id.php?id=50345 (and mirror mathgenealogy.com/id.php?id=50345) | Mathematics Genealogy Project entry. Search summary: Ph.D. Carnegie Mellon University 2001, dissertation "Probabilistic and on-line methods in machine learning", advisor Avrim Louis Blum. The result title for the .org page showed the name as "Adam O. S. Kalai". | **[SEARCH-ONLY]** (proxy 403) |
| https://www.proquest.com/docview/275712118 | ProQuest record titled "Probabilistic and on-line methods in machine learning". A search summary mentioned "ProQuest document ID … 3040463"; I could not verify what that number refers to. | **[SEARCH-ONLY]** (proxy 403) |
| https://web.mit.edu/orc/www/archive/seminars/2002sp/bios/Kalai.html | MIT ORC seminar bio sketch (2002) | **[SEARCH-ONLY]** (blocked) |
| https://en.wikipedia.org/wiki/Adam_Tauman_Kalai | Search summary: BA Harvard 1996; PhD CS, CMU, 2001; advisor Avrim Blum | **[SEARCH-ONLY]** (blocked) |

Small discrepancy: the search summary says 44 pages, while the PDF I downloaded has 46 PDF pages, which likely includes front matter. This doesn't matter for the video.

---

## 5. Toy scoring math: ORIGINAL analogy (label on screen as "analogy, not model data")

Setup: on one question, answering is correct with probability p. "I don't know" (IDK) always scores 0.

Expected score of answering = p × (reward if right) + (1 − p) × (score if wrong).

| Rule | Right | Wrong | IDK | Expected score if answer | Answer beats IDK when… | Break-even p |
|---|---|---|---|---|---|---|
| (i) Binary ("old") | +1 | 0 | 0 | p | p > 0 | **0**: guessing is never worse, and strictly better whenever p > 0 |
| (ii) Symmetric penalty | +1 | −1 | 0 | p − (1 − p) = **2p − 1** | p > 1/2 | **0.5** |
| (iii) Paper's rule, t = 0.75 | +1 | −t/(1−t) = **−3** | 0 | p − 3(1 − p) = **4p − 3** | p > 3/4 | **0.75** |

General check for rule (iii): p − [t/(1−t)](1−p) = [p(1−t) − t(1−p)]/(1−t) = **(p − t)/(1 − t)**. This is positive exactly when p > t, matching the paper's "iff … > t" (p. 14).

If someone used the misprinted "penalty 2" instead, the break-even would be p = 2/3, not 0.75.

Blind 4-choice guess (p = 1/4):

- (i) expected score = 1/4 = **+0.25**
- (ii) 2(1/4) − 1 = **−0.5**
- (iii) 4(1/4) − 3 = 1 − 3 = **−2**

All values verified with exact fractions in Python.

### Scenario A: "The 10-question quiz" (main animation candidate)

Two test-takers each know the same **6** answers (always right). On the other **4** questions:

- **Guesser:** guesses among 4 choices (p = 1/4). The expected outcome on 4 guesses is 1 right and 3 wrong.
- **Honest:** says "I don't know" on all 4.

| Rule | Guesser (6 known + 1 lucky + 3 wrong) | Honest (6 known + 4 IDK) | Winner |
|---|---|---|---|
| (i) +1 / 0 / 0 | 6 + 1 + 0 = **7** | 6 + 0 = **6** | Guesser |
| (ii) +1 / −1 / 0 | 6 + 1 − 3 = **4** | **6** | Honest |
| (iii) +1 / −3 / 0 (t = 0.75) | 6 + 1 − 9 = **−2** | **6** | Honest, by a lot |

The same numbers as an expected-value check: 6 + 4 × E(one guess), giving 6 + 4(0.25) = 7, 6 + 4(−0.5) = 4, and 6 + 4(−2) = −2. ✔

Optional "luck" overlay. The number of lucky guesses k follows a binomial distribution with n = 4 and p = 1/4. P(k) = 81, 108, 54, 12, 1 out of 256 for k = 0…4, and these sum to 256 ✔.

- **Rule (i):** the guesser's score is 6 + k ≥ 6. The guesser **never** scores below the honest test-taker, ties with probability 81/256 ≈ 31.6%, and wins with probability 175/256 ≈ 68.4%.
- **Rule (ii):** the score is 2 + 2k. Win if k ≥ 3: 13/256 ≈ 5.1%. Tie at k = 2: 54/256 ≈ 21.1%. Lose: 189/256 ≈ 73.8%.
- **Rule (iii):** the score is 4k − 6. Win only if k = 4: 1/256 ≈ 0.4%. Tie at k = 3: 12/256 ≈ 4.7%. Lose: 243/256 ≈ 94.9%.

Suggested script line: "With the old rule, guessing can only help."

### Scenario B: "The rule doesn't ban answering; it bans bluffing"

20 questions, two runs:

- **80% sure** (p = 0.8 > 0.75). Expected 16 right, 4 wrong.
  - (i) 16
  - (ii) 16 − 4 = 12
  - (iii) 16 − 3 × 4 = **+4**
  - Still worth answering under t = 0.75, since 4 > 0 = IDK score.
- **50% sure** (p = 0.5 < 0.75). Expected 10 right, 10 wrong.
  - (i) 10
  - (ii) 10 − 10 = 0, a break-even tie with IDK
  - (iii) 10 − 30 = **−20**
  - IDK (0) is the better choice.

Per question under (iii): 4(0.8) − 3 = +0.2 and 4(0.5) − 3 = −1. Times 20 gives +4 and −20 ✔.

### Scenario C: "The leaderboard" (mirrors the paper's Model A vs Model B, p. 4)

100 hard factual questions. Both models truly know 60.

- **Model A** says IDK on the other 40.
- **Model B** guesses on those 40, with an illustrative 10% hit rate for open-ended facts. That gives an expected 4 right and 36 wrong.

| Rule | Model A | Model B | Notes |
|---|---|---|---|
| (i) accuracy-only | 60 | 60 + 4 = **64** | B ranks first while making **36 confident errors** (A makes 0) |
| (ii) +1/−1/0 | 60 | 64 − 36 = **28** | |
| (iii) +1/−3/0 | 60 | 64 − 108 = **−44** | |

The 10% hit rate is our assumption for illustration. For a truly unknown birthday the paper's framing implies about 1/365 per guess (p. 7 notes "364 times more incorrect birthday claims … than correct ones").

---

## 6. "Impressive, verified capability" candidates for the opening contrast

**Rule for the script:** the capability shown must be visibly labelled with its **own** system, company and date, distinct from the Table 1 failures. Those were GPT-4o, DeepSeek-R1 and Llama-4-Scout, accessed 2025-05-09, with no web search. Never imply that the IMO system wrote the wrong dissertation answers.

### 6.1 Recommended: Gemini Deep Think at IMO 2025 (Google DeepMind), July 2025

**Primary file, [DIRECT]:** https://storage.googleapis.com/deepmind-media/gemini/IMO_2025.pdf (HTTP 200, 284,379 bytes, sha256 `90040afd…ca935`)

- First-page header: "Gemini Deep Think for International Mathematical Olympiad 2025"
- PDF metadata: Title "IMO 2025 Solutions"; Author "Gemini Deep Think"; CreationDate 2025-07-21 10:46:26 UTC
- GCS object timeCreated 2025-07-21T10:55:24Z
- 13 pages of natural-language proofs for **Problems 1–5**. There is no Problem 6, consistent with "5 of 6 solved".
- **The PDF itself does not state the score or the certification.**

Announcement wording:

- DeepMind blog title, from the URL slug and search title: "Advanced version of Gemini with Deep Think officially achieves gold-medal standard at the International Mathematical Olympiad", dated **July 21, 2025** (search result titled "July 21, 2025 Research"). **[SEARCH-ONLY]**; deepmind.google is blocked.
- From the search summary only:
  - 35/42 points, five of six problems solved perfectly.
  - "officially graded and certified by IMO coordinators using the same criteria as for student solutions".
  - End-to-end in natural language within the 4.5-hour limit.
  - An attributed quote from IMO President Gregor Dolinar: "We can confirm that Google DeepMind has reached the much-desired milestone, earning 35 out of a possible 42 points — a gold medal score…"
- **Do not quote Dolinar on screen unless the DeepMind or IMO page is opened directly.**

Safe on-screen wording: "July 2025: an advanced version of Google DeepMind's Gemini Deep Think reached gold-medal standard at the International Mathematical Olympiad, solving 5 of 6 problems, graded by IMO coordinators." Add a footnote: "Source: Google DeepMind, 21 Jul 2025; solutions PDF at storage.googleapis.com/deepmind-media/gemini/IMO_2025.pdf". Before publishing, check the certification wording against the blog from an unblocked machine.

Note: this was "an advanced version", not the standard Gemini app model. Don't say "Gemini" or "ChatGPT" generically.

### 6.2 Gemini 2.5 Deep Think at the ICPC World Finals 2025, September 2025

- **Primary file, [DIRECT]:** https://raw.githubusercontent.com/google-deepmind/gemini_icpc2025/master/README.md says "This repository contains the code submissions from an advanced version of Gemini 2.5 Deep Think for the 2025 International Collegiate Programming Contest World Finals." The README states no score.
- **[SEARCH-ONLY]** (DeepMind blog dated September 17, 2025):
  - 10 of 12 problems solved within the 5-hour limit
  - "gold-medal level"
  - would have ranked 2nd among university teams
  - solved one problem (Problem C) that no human team solved
  - World Finals held 4 Sep 2025 in Baku

This is a good backup, but the score depends on search only.

### 6.3 Weaker or riskier options

- **Huang & Yang, "Gemini 2.5 Pro Capable of Winning Gold at IMO 2025", arXiv:2507.15855.** **[DIRECT]** via the arXiv bucket (v1, 21 Jul 2025; v4 exists). The abstract says that with "pipeline design and prompt engineering, 5 (out of 6) problems are solved correctly (up to a caveat discussed below)". This is self-reported by independent researchers, not officially graded. Use it only as supporting context.
- **OpenAI experimental reasoning model, IMO 2025.** **[SEARCH-ONLY]** (openai.com blocked). Search summaries say it also scored 35/42 but was graded by former IMO medalists, not official IMO coordinators. Avoid it, or label it clearly as not officially certified.
- **GPT-4 "simulated bar exam … around the top 10% of test takers".** **[DIRECT]** in the GPT-4 TR abstract (arXiv:2303.08774v6). However, a later re-analysis (E. Martínez, *Artificial Intelligence and Law*, 2024; **[SEARCH-ONLY]**) argued the percentile was overstated (≈63rd percentile vs first-time takers). **Avoid** as the hero example, since it is contested. A possible tie-in: the same report documents GPT-4's calibration drop after post-training (§2.8).

---

## 7. Page renders for designers

**Folder:** `/home/user/Youtube-videos/AI_Confidence_Video_01/research/screens/paper/`

**Command:**

```
pdftoppm -r 300 -hide-annotations -png -singlefile -f N -l N kalai2025_why_lms_hallucinate_v1.pdf kalai2025_v1_pNN_300dpi
```

`-hide-annotations` removes the green/red hyperlink boxes that the PDF draws around citations and footnote markers. Re-render without it if you want the "as seen in a PDF viewer" look.

**Image size:** each PNG is 2550 × 3300 px (US Letter at 300 dpi).

**Coordinate convention:** y = 0 at the top of the page. Fractions are of the page height. Pixel values are y × 3300. The body text column spans roughly x = 0.12–0.88 (about 306–2244 px).

| File | Page | Key passages: fractional y-range (≈ px rows) |
|---|---|---|
| `kalai2025_v1_p01_300dpi.png` | 1 (title + abstract) | Title, authors, affiliations, date: **0.140–0.255** (462–842) · "Abstract" heading + full abstract: **0.300–0.537** (990–1772) · Birthday prompt + "03-07 / 15-06 / 01-01" + "correct date is in Autumn": **0.668–0.758** (2204–2501) · Footnote 1 (DeepSeek-V3, 11 May 2025): **0.858–0.877** (2831–2894) · The vertical arXiv stamp "arXiv:2509.04664v1 [cs.CL] 4 Sep 2025" sits in the left margin, x 0.03–0.06, y 0.287–0.713. Crop it out or keep it as a source badge. |
| `kalai2025_v1_p02_300dpi.png` | 2 (Table 1) | **Table 1 rows incl. top/bottom rules: 0.083–0.180** (274–594) · Caption "Table 1: … None generated the correct title or year (Kalai, 2001).": **0.185–0.225** (610–742) · Table + caption together: **0.083–0.225** (274–742) · Scope sentence "applies broadly, including to reasoning and search-and-retrieval … does not rely on properties of next-word prediction": **0.383–0.456** (1264–1505) · DEEPSEEK letter-count prompt and results: 0.499–0.587 · Footnotes 2–3 (models, 2025-05-09, "None of the models searched the Web."): **0.827–0.872** (2729–2878). |
| `kalai2025_v1_p13_300dpi.png` | 13 (confidence-target passage) | Top lines "Under binary grading, abstaining is strictly sub-optimal. IDK-type responses are maximally penalized…": **0.090–0.163** (297–538) · Observation 1: 0.310–0.386 · "4.2 Explicit confidence targets" heading + exams with penalties (JEE, NEET, GATE, AMC, SAT/AP/GRE): **0.553–0.718** (1825–2369) · "we propose evaluations explicitly state confidence targets…": 0.713–0.770 · **Indented instruction "Answer only if you are > t confident, since mistakes are penalized t/(1 − t) points…": 0.775–0.815 (2558–2690), x ≈ 0.15–0.85 (382–2168)** · "natural values of t … t = 0.75 (penalty 2) …" line (**contains the misprint, see §2.6**): **0.822–0.878** (2713–2897). Best crop for the video: 0.553–0.815, or just the instruction at 0.775–0.815, which avoids the misprint. |
| `kalai2025_v1_p14_300dpi.png` | 14 (benchmark table) | Table 2 caption: **0.088–0.144** (290–475) · Table body (header row at 0.162–0.174; GPQA … HLE rows to 0.355): **0.145–0.360** (478–1188) · Table footnotes (*, a, b): 0.360–0.418 · Whole Table 2 block: **0.088–0.418** (290–1379) · Columns: Benchmark x 0.14–0.27, Scoring method x 0.29–0.59, Binary grading x 0.61–0.75, IDK credit x 0.76–0.86 · Sentence "expected score of offering an answer beats IDK (score 0) iff its confidence … is > t.": **0.440–0.479** (1452–1581). |
| `kalai2025_v1_p19_300dpi.png` | 19 (bibliography) | **"Adam Kalai. 2001. *Probabilistic and on-line methods in machine learning*. PhD Thesis. Carnegie Mellon University.": 0.818–0.858 (2699–2831)**, x 0.12–0.88. It is the last entry on the page, directly below the Kadavath et al. 2022 entry (0.668–0.810). |

Not rendered (not requested), but useful if needed:

- **p. 8:** Figure 2 calibration histograms at ≈0.08–0.345, caption at 0.351–0.403, and the "Hallucinations are inevitable only for base models" paragraph at 0.607–0.779. See the rights note in §2.8.
- **p. 15:** "Search (and reasoning) are not panaceas" at 0.521–0.642, and "5 Discussion and limitations" starting at 0.221.

---

## 8. Script guardrails (quick list)

1. Say "the authors argue" for the benchmark-incentive explanation. It is an argument, not a measured experiment.
2. Table 1 used GPT-4o, DeepSeek-R1 and Llama-4-Scout on 9 May 2025, **without web search**. The birthday example used DeepSeek-V3 on 11 May 2025. Don't generalize to "today's chatbots" or to search-enabled products.
3. GPT-4o did name CMU correctly. The claim is "none got the correct title or year".
4. The real title is *Probabilistic and On-line Methods in Machine Learning* (CMU, May 2001, CMU-CS-01-132).
5. At t = 0.75 the penalty is 3, not the "2" printed in v1.
6. The calibration evidence is a single GPT-4 multiple-choice figure from 2023.
7. The opening capability (IMO gold, July 2025) is a **different system from a different company at a different time**. Label it.
8. The quiz numbers in §5 are an original analogy and must be labelled as such on screen.
9. The paper is CC BY 4.0, so page screenshots need attribution ("Kalai et al. 2025, arXiv:2509.04664, CC BY 4.0"). The Figure 2 graphic is third-party.

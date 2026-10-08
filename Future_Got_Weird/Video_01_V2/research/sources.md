# Sources: claim-to-source ledger for pass 2

> **Superseded for V2/V3.** This is the pass-2 ledger. The current claim-to-source ledger is
> `research/CLAIM_LEDGER_V3.md` (V3 audit, 2026-10-08), and the published Sources block is in
> `package/DESCRIPTION_V3.txt`.

**Video:** "Why AI Is So Confidently Wrong" (Future Got Weird, Video 01, pass 2; anonymous channel)
**Compiled:** 2026-10-07 (UTC)
**Cross-checked against:** `script/narration_segments.json`, pass-2 v1.0 (36 segments, s01–s36). Tags such as **[s17]**
are the segment IDs a row supports.
**Built on:** the pass-1 ledger in `AI_Confidence_Video_01/research/sources.md`, which holds the full quotes,
page numbers, access log, verification pass and the list of things not to claim. Row numbers in the "Pass-1 row"
column point there. Nothing in this ledger rests on a source the pass-1 ledger marks SEARCH-ONLY.

The pass-2 script dropped the IMO/DeepMind detour and the Anthropic circuit-tracing material entirely, so rows 1,
30, 31 and A1–A3 of the pass-1 ledger are no longer used. Every remaining claim was re-read against the pass-1
quotes; no new source was needed.

## Access status (unchanged from pass 1)

- **DIRECT** in pass 1: Kalai, Nachum, Vempala & Zhang (2025), arXiv:2509.04664v1 (read from arXiv's official
  dataset bucket; PDF metadata CC BY 4.0); the Kalai (2001) thesis PDF hosted by Microsoft Research; the `tiktoken`
  repository files; Vaswani et al. 2017; Holtzman et al. 2020; Lin, Hilton & Evans 2022; Ouyang et al. 2022; Lewis et
  al. 2020; Kadavath et al. 2022; Liu, Zhang & Liang 2023; Yona, Aharoni & Geva 2024; Renze & Guven 2024; the OpenAI
  and Anthropic API documentation for `temperature`.
- **Not re-fetched in pass 2.** arxiv.org, openai.com, cmu.edu and the other hosts listed in pass 1 were blocked
  then and were not retried. Whether a v2 of the paper exists is still unknown; re-check from an unblocked machine
  before publishing.
- Nobody watched or listened to any video for this research.

## Claim-to-source table

| # | Claim as spoken or shown | Segments | Category | Source | Pass-1 row | How the film keeps it honest |
|---|---|---|---|---|---|---|
| 1 | Three popular AI models were asked "what was the title of Adam Kalai's dissertation?" | s01 | Record (one paper's demonstration) | Kalai et al. 2025, p. 2, Table 1 caption | 2 | The prompt is quoted as printed. |
| 2 | ChatGPT gave a full title, a university and a year; DeepSeek a different title; Llama a third. The slips show the verbatim excerpts: GPT-4o "…(completed in 2002 at CMU) is entitled: “Boosting, Online Algorithms, and Other Topics in Machine Learning.”"; DeepSeek "“Algebraic Methods in Interactive Machine Learning”. . . at Harvard University in 2005."; Llama "“Efficient Algorithms for Learning and Playing Games”. . . in 2007 at MIT." | s02, S1 slips, S2, S5, S8, S9, S10 | Record | Same, p. 2, Table 1 and footnote 3 (accessed 2025-05-09 via chatgpt.com, the DeepSeek app (R1) and huggingface.co (Llama-4-Scout-17B-16E-Instruct); no web search) | 2 and "The selected hallucination example" | Every slip is labelled with the model, version and date ("GPT-4o · 9 May 2025", "R1 · 9 May 2025", "4 Scout · 9 May 2025"). The excerpts are the paper's, with its own ellipses. The S1 chip says "Published test … no web search". |
| 3 | "Three polished answers. All wrong. Not one even had the right year." | s03 | Record | Same, p. 2, Table 1 caption: "None generated the correct title or year (Kalai, 2001)." | 3 | The film never says all three got the university wrong: S5 shows that GPT-4o named CMU correctly. |
| 4 | "Adam Kalai? He's the lead author of the paper that reported this test." | s04 | Record | Same, p. 1, author line (Adam Tauman Kalai listed first, corresponding author) | 4, A2 | The film does not claim he typed the prompts. The S1 cut-in boxes the author line and labels it "Lead author". |
| 5 | Joke caption "Very professional. Very fictional." | s05 | Our wording | Rows 2–3 | — | A comment on the three excerpts, which are the paper's record. |
| 6 | "Why is AI so confidently wrong?" / "It writes what's likely, not what's true." | s06–s07 | Simplification of an established mechanism | Kalai et al. 2025, p. 6 ("Not merely autocomplete", with its qualifier); Lin, Hilton & Evans 2022, p. 1; Ouyang et al. 2022 | 12, A4 | The S2 panel says "likely ≠ true", not "likely is never true". Row 14 of the pass-1 must-not list applies: likelihood usually tracks truth for common facts, and no next-token score is ever presented as a chance of being true. |
| 7 | "Checking is scored on different tests" / "Guessing pays" (as the short version) | s07 | Paper-specific argument | Kalai et al. 2025, p. 4 (§1.2) and pp. 12–13 (§4.1) | 23, 26 | Stated as what the researchers argue (s20: "the researchers argue"). |
| 8 | A language model builds text out of tokens: whole words or fragments. In GPT-4o's tokenizer "Kalai" is "Kal" + "ai". | s08–s09 | Established; the split is a reproducible measurement | `tiktoken` README and `model.py` (gpt-4o → o200k_base); our own run with js-tiktoken 1.0.21, `source/src/data/tokens_gpt4o_sentence.json` | 6, 7 | On screen: "real tokens · o200k_base". The film does not claim this is what chatgpt.com computed on the day; it is the public tokenizer applied to the published excerpt. |
| 9 | At every step the model scores the possible next chunks and picks one, then goes again. | s10 | Established | Vaswani et al. 2017 §3 and §3.4; Holtzman et al. 2020 §3 | 8, 9 | The percentages on the scorer (31/26/12/9/7 %) are labelled "illustrative". The roll-out tiles are the real next tokens of the excerpt. |
| 10 | "Here, it picked the likely one. Not the true one." | s11 | Established mechanism applied to the example | Rows 6 and 9 | 12 | "Here" ties it to this excerpt. No claim about the model's intent. |
| 11 | Modern chatbots add instruction training, step-by-step reasoning, sometimes web search; the answer is still built piece by piece. | s12 | Established | Ouyang et al. 2022, abstract; Lewis et al. 2020, abstract; Kalai et al. 2025, p. 2 and p. 5 | 13 | The add-on modules are labelled "simplified diagram". |
| 12 | What a dissertation title sounds like ("Methods", "Algorithms", "Machine Learning") is a pattern seen again and again. | s13–s14 | Simplified illustration grounded in the paper's framework | Kalai et al. 2025, p. 3 (Figure 1 and text), p. 10 (§3.3.1) | 14, 15 | The library and the spine words are an analogy. The film does not claim to know the training data. |
| 13 | A birthday shows up rarely, or not at all, so there is no pattern to learn from. | s15 | Paper-specific theory (singleton rate) + open question for these models | Kalai et al. 2025, p. 3 (§1.1), pp. 9–10 (Def. 1, Def. 2, Theorem 2); the birthday anecdote p. 1 and footnote 1 (DeepSeek-V3, 11 May 2025) | 11, 16, 17 | The bottom chip says "training exposure is unknown for these models". The film does not say the thesis title appears once or never. Kalai's actual birthday is never sought or shown. |
| 14 | So the model fills the gap with a title-shaped answer, written with full confidence ("is entitled", no "I think", no "maybe"). | s16 | Established phenomenon; the "because" is a simplified illustration | Kalai et al. 2025, p. 2 (Table 1) and p. 4; Yona, Aharoni & Geva 2024, abstract | 18, 19 | The slip is labelled "a title-shaped answer · simplified illustration". No claim about what the model "knows" or intends. |
| 15 | Kalai's thesis: "Probabilistic and On-line Methods in Machine Learning", Carnegie Mellon, May 2001. | s17 | Record (verified) | Thesis title page (Microsoft Research–hosted PDF; CMU-CS-01-132; dated May 16, 2001); Kalai et al. 2025 bibliography p. 19 (not independent) | 28 | The real title page is shown on screen. CMU's own records could not be opened (SEARCH-ONLY), as pass 1 notes. |
| 16 | ChatGPT got the university right, the year off by one, the title invented; every line equally solid. | s18 | Record; "equally solid" is our observation | Table 1 compared with the title page | 22 | The film says "a different title", not "a completely different title": the titles share "On-line/Online" and "in Machine Learning". |
| 17 | Joke: the fact-checker's magnifier finds a "nice font". | s19 | Our wording | — | — | — |
| 18 | The researchers argue part of the reason is how tests are graded: right +1, wrong 0, "I don't know" 0. | s20–s21 | Paper-specific argument | Kalai et al. 2025, p. 4 (§1.2); pp. 12–13 (§4.1, Observation 1) | 23 | "The researchers argue"; "one explanation, not the whole story" is kept in spirit by s27 ("one explanation"). |
| 19 | Toy quiz: both know 6 of 10; the honest contestant leaves 4 blank (6); the guesser guesses 4 four-choice questions and on average gets 1 right (7). With −1 per wrong answer: 7 − 3 = 4 vs 6. | s22–s25 | Simplified illustration (our analogy; arithmetic checked) | Modelled on Kalai et al. 2025, p. 4 and the paper's "t = 0.5 (penalty 1)" line on p. 13 | 24 | Scores labelled "example". Expected values 7 and 4 are averages; the film says "on average, one lands". |
| 20 | Of ten popular benchmarks the researchers checked, nine grade strictly right or wrong, with no credit for "I don't know" (WildBench is the exception). | s26 | Record (the paper's audit) | Kalai et al. 2025, p. 14, Table 2 and footnotes; Appendix F | 25 | The real Table 2 is shown with the chip "ten benchmarks sampled from major leaderboards, mid-2025". The film says "the ten they checked", not "all benchmarks". |
| 21 | Train and rank on tests like that, and guessing pays. One explanation, not the whole story. | s27 | Paper-specific argument + open question | Kalai et al. 2025, p. 12 (§4) and p. 4 (§2) | 26 | "It's one explanation" is spoken. |
| 22 | Search can bring the real record into the room; reasoning can help; turning the randomness down makes answers more consistent, not necessarily more correct; none is a guarantee. | s28 | Paper-specific findings + established definition | Lewis et al. 2020; Liu, Zhang & Liang 2023; Kalai et al. 2025 p. 11 and p. 15; Holtzman et al. 2020 Eq. 4; Renze & Guven 2024 | 29, 32, 33, A5 | "Not necessarily more correct" is spoken and shown; the three identical slips are an illustration, not a claim that GPT-4o repeats "2002" at low temperature. The NO GUARANTEE stamp carries must-not #24. |
| 23 | Two questions: does the source exist, and does it actually say this? | s29–s32 | Our synthesis of the verification habit | Rows 15–16, 22 | 29, 35 | Demonstrated on the ChatGPT slip against the real title page. |
| 24 | Sounding right comes from patterns in language; being right takes evidence the model does not have. | s33 | Simplified illustration (synthesis) | Kalai et al. 2025, abstract, p. 1 | 35 | The S10 chip cites "Kalai (2001) · thesis title page" as the evidence in this case. |
| 25 | "Works for chatbots. Works for people, too." / "Trust me, I read it somewhere." stamped SOURCE? | s35 | Our wording | — | — | A joke about people, not a claim about models. |

## Things the film must not claim (carried from pass 1)

All 27 items in the pass-1 "Things we must not claim" list still apply. The ones that bear on pass-2 lines:

- No error rate from Table 1 or the birthday anecdote (#3). The film shows one prompt per model, dated.
- Not "all three got the university wrong" (#4). S5 shows CMU as correct.
- Not "a completely different title" (#9). S5 and S9 say "a different title".
- Not that the thesis title is absent from, or appears once in, the training data (#10). The S4 chip says exposure is unknown.
- The scorer percentages are illustrative (#11); the token split is the public tokenizer on the published excerpt (#12).
- No "lying", "deceiving", "has no idea" (#15). The script uses "wrote what's likely" and "filled the gap".
- Binary grading is "one explanation" (#16); no claim that companies train models to bluff (#17); "nine of the ten they checked", not "all benchmarks" (#18).
- Search, reasoning and low randomness help in some cases and none is a guarantee (#24); "not necessarily more correct" (#25).
- No IMO, DeepMind, gold-medal or score claims (#1, #27): the detour is gone.
- No Anthropic circuit claims (#21–#23): that material is gone.
- Kalai's birthday is never sought or shown (#7).

## Suggested on-screen and description source lines

- "Kalai, Nachum, Vempala & Zhang (2025), *Why Language Models Hallucinate*, arXiv:2509.04664, Table 1. Models accessed 9 May 2025, no web search. CC BY 4.0."
- "Adam Kalai (2001), *Probabilistic and On-line Methods in Machine Learning*, PhD thesis, Carnegie Mellon University, CMU-CS-01-132."
- "Token split: OpenAI o200k_base (tiktoken), applied offline to the published excerpt."

## Remaining risks

- A later arXiv version of the paper could change page numbers or Table 2; the film cites the paper, not page numbers, on screen.
- The thesis record was verified from the Microsoft Research–hosted PDF and the paper's bibliography; CMU's own catalogue entry was not opened.
- The pass-2 narration was aligned, not blind-transcribed, in this session (see `qa/QA_REPORT.md`), so a mispronunciation that the alignment cannot detect would need a human ear.

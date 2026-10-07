# Openings considered and story outline

## Core question
How can AI do impressive things and still give a fluent, completely incorrect answer?

## Three opening candidates (internal)

**A. "The question" (cold open on the documented example).**
"Researchers asked three popular chatbots one simple question: what was the title of Adam Kalai's PhD dissertation?" → three polished, specific, different answers → none had the right title or year → Kalai was one of the researchers asking.
- Strengths: concrete example in the first 5 seconds; a documented, verifiable failure; the self-referential twist is a natural curiosity hook; everything later reuses it.
- Risks: needs fast, readable presentation of three titles. On-screen cards carry the titles and the narration carries the shape.

**B. "The Olympiad" (capability first).**
Open on an AI system reaching gold-medal standard at the International Mathematical Olympiad, then cut to the dissertation failure.
- Strengths: a strong contrast.
- Risks: the first 10 s would be about a different system and topic. That delays the actual example, and viewers could think the same model produced both results.

**C. "Spot the fake" (viewer test).**
Show three answers and ask which is real; the answer is that none are.
- Strengths: participation.
- Risks: it's a trick question with no context. It works better later, once viewers know what to look for.

**Selected: A**, with B used as a single contrast line right after the hook, clearly labelled as a different system. C's participation idea moves to Act 3, where the viewer compares ChatGPT's answer with the real record.

## Arc (timings revised to measured narration)
1. Contrast: Table 1 answers, then the different-system capability line, then the question.
2. Where the answer comes from: real o200k_base split of ChatGPT's actual sentence → context → next-token scores (illustrative) → pick → loop. Callback: three different birthday dates. Key line: the scores measure likely text, not truth. Modern assistants add post-training, reasoning and tools.
3. Why wording conceals error: the pattern is everywhere, but the specific fact is rare. The confident tone is part of the pattern. Spot-the-difference against the real record.
4. Incentive: original toy quiz (analogy) with 0-1 scoring, then a changed rule. Table 2 shows 9 of 10 benchmarks are binary. The paper's confidence-target proposal is one explanation among several.
5. What helps: check the record. The source must exist and support the claim. Anthropic's "can't answer" default circuit in Claude 3.5 Haiku. Search, retrieval and reasoning help only with the right evidence. Low temperature brings consistency, not correctness. No guarantees.
6. Payoff: sounding right comes from patterns, and being right comes from evidence. One habit: what's the evidence, and does it say this?

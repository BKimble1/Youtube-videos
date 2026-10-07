# Research notes: Anthropic, "Tracing the thoughts of a large language model"

Project: "Why AI Sounds Right When It's Wrong" (Blake Kimble, faceless explainer, 4-5 min)
Notes written: 2026-10-07 (UTC). Every quote below was checked by a script against the article text taken from the saved HTML. That text also matched a live re-fetch made at 2026-10-07 05:29 UTC.

---

## 0. Access log: what was and was not accessed

| Item | Status | How |
|---|---|---|
| Article, canonical URL https://www.anthropic.com/research/tracing-thoughts-language-model | READ IN FULL | Saved HTML `research/sources_raw/anthropic_tracing_thoughts.html`. I extracted the text with a Python HTML parser and re-fetched the page live (HTTP 200). The live text was identical to the saved copy. |
| Same article at https://www.anthropic.com/news/tracing-thoughts-language-model | READ, same content | Saved HTML `..._news.html`. It returns HTTP 200 and its `<link rel="canonical">` is `/news/tracing-thoughts-language-model`. The body text is identical to the /research/ version (diffed after extraction). The only difference is where the page title sits in the markup. |
| 9 in-article figures | DOWNLOADED (9/9) | Downloaded from the exact `src` the page itself uses (`https://www.anthropic.com/_next/image?url=...`), which is Anthropic's own first-party image endpoint. The underlying asset hosts `www-cdn.anthropic.com` and `cdn.sanity.io` both fail through the proxy ("CONNECT tunnel failed, response 403") for all 9 figures. |
| Social/OG card image | DOWNLOADED | Fetched through the same first-party `www.anthropic.com/_next/image` endpoint. The direct `www-cdn.anthropic.com` URL is blocked (403). The card is not shown in the article body. |
| Embedded video at the top of the article: `https://youtu.be/Bj9BD2D3DzA` | NOT ACCESSED, NOT WATCHED | YouTube is blocked (403). The page JSON has a `"_type":"videoEmbed"` block pointing at this URL. I did not verify its title, length or content. |
| Companion paper 1 (methods): https://transformer-circuits.pub/2025/attribution-graphs/methods.html | NOT ACCESSED | `curl: (56) CONNECT tunnel failed, response 403`, tested 2026-10-07 |
| Companion paper 2 (biology): https://transformer-circuits.pub/2025/attribution-graphs/biology.html | NOT ACCESSED | Same 403. |
| arXiv 2411.14257 (Ferrando et al.), linked from the Hallucinations section | Page 1 only (title, authors, abstract) | Fetched from arXiv's official public bucket at `storage.googleapis.com/arxiv-dataset/.../2411.14257v1.pdf` into the scratchpad, not into the project. |
| arXiv 2307.13702, 2406.12775, 2406.00877, 2501.06346 (the "can (and often have been) analyzed with other methods" links) | Titles only, from page 1 | Same bucket. Used only to identify them (see section 3). |
| Frankfurt "On Bullshit" PDF (uca.edu), linked from the article | NOT ACCESSED | 403 |
| Anthropic Consumer Terms, Commercial Terms, AUP | READ (Consumer Terms in relevant part) | curl, HTTP 200 |

---

## 1. Basic facts

- **Title:** "Tracing the thoughts of a large language model"
- **Publisher:** Anthropic. The page shows no individual author byline. The category label above the title reads "Interpretability".
- **Publication date:** The page displays **"Mar 27, 2025"**. HTML metadata: `article:published_time = 2025-03-27T09:16:00.000Z`, `article:modified_time = 2026-07-08T22:16:10.000Z`. The metadata does not say what changed in July 2026; it could be a site or CMS update. The text I read is the live version as of 2026-10-07.
- **Meta description:** "Anthropic's latest interpretability research: a new microscope to understand Claude's internal mechanisms"
- **Model studied:** **Claude 3.5 Haiku.** It is named once, in the intro (¶4):
  > In the second, we look inside Claude 3.5 Haiku, performing deep studies of simple tasks representative of ten crucial model behaviors, including the three described above.
  - In the rest of the article the model is just called "Claude". Two figure annotations also say "Haiku": Fig. 1 ("asking Haiku what the opposite of ...") and Fig. 9 ("Prompt for a jailbreak discovered on Haiku.").
  - The Multilingual section compares Haiku with an unnamed "smaller model":
    > We find that the shared circuitry increases with model scale, with Claude 3.5 Haiku sharing more than twice the proportion of its features between languages as compared to a smaller model.
  - **Claude 3.7 Sonnet** appears only as an example of a model that can "think out loud". The article does **not** say 3.7 Sonnet was traced. Do not say "researchers looked inside Claude 3.7 Sonnet".
  - The "hidden goal" auditing experiment used "a variant of Claude" and is a **separate** paper (linked as https://www.anthropic.com/research/auditing-hidden-objectives). I did not read it.
- **Companion papers.** Titles below are exactly as the article's closing paragraph writes them:
  1. "Circuit tracing: Revealing computational graphs in language models": https://transformer-circuits.pub/2025/attribution-graphs/methods.html
  2. "On the biology of a large language model": https://transformer-circuits.pub/2025/attribution-graphs/biology.html (the "Read the paper" button under the date also goes here)
  - **Reachability:** transformer-circuits.pub is blocked (proxy 403). I have **not** read either paper.
  - **From WebSearch result summaries only, not verified against the papers:** the biology paper lists Jack Lindsey, Wes Gurnee, Emmanuel Ameisen, ... Chris Olah, Joshua Batson (Anthropic) and is dated March 27, 2025. Its ten case studies include multi-step reasoning, poetry planning, arithmetic, multilinguality, medical diagnosis, hallucinations, refusals, jailbreaks and a hidden objective. The methods paper uses a "replacement model" built from a "cross-layer transcoder" to produce "attribution graphs". It develops these tools on an 18-layer model before applying them to Claude 3.5 Haiku. Cite the papers by title and URL only. If you state any detail from these summaries, check it against the paper first.
- **Related independent paper linked from the Hallucinations section** (I read the first page from the official arXiv bucket): Ferrando, Obeso, Rajamanoharan, Nanda, "Do I Know This Entity? Knowledge Awareness and Hallucinations in Language Models", arXiv:2411.14257v1, 21 Nov 2024. Its abstract reports entity-recognition directions that can steer models "to refuse to answer questions about known entities, or to hallucinate attributes of unknown entities when it would otherwise refuse". Its models are **Gemma 2** variants, not Claude. This is independent and related evidence from a different team on different models.

### The article's own caveats and limitations (exact quotes)

Intro ¶7, the main limitations paragraph:
> At the same time, we recognize the limitations of our current approach. Even on short, simple prompts, our method only captures a fraction of the total computation performed by Claude, and the mechanisms we do see may have some artifacts based on our tools which don't reflect what is going on in the underlying model. It currently takes a few hours of human effort to understand the circuits we see, even on prompts with only tens of words. To scale to the thousands of words supporting the complex thinking chains used by modern models, we will need to improve both the method and (perhaps with AI assistance) how we make sense of what we see with it.

Intro ¶4, partial view:
> Our method sheds light on a part of what happens when Claude responds to these prompts, which is enough to see solid evidence that:

Intro ¶5, other methods exist:
> While the problems we study can (and often have been) analyzed with other methods, the general "build a microscope" approach lets us learn many things we wouldn't have guessed going in, which will be increasingly important as models grow more sophisticated.

Intro ¶8, framing as high-risk research:
> Interpretability research like this is one of the highest-risk, highest-reward investments, a significant scientific challenge with the potential to provide a unique tool for ensuring that AI is transparent.

Intro bullet 3, "proof of concept":
> providing a proof of concept that our tools can be useful for flagging concerning mechanisms in models.

Hallucinations ¶1, anti-hallucination training is imperfect:
> Models like Claude have relatively successful (though imperfect) anti-hallucination training

Faithfulness ¶3, future refinement needed:
> This demonstrates how our methods might, with future refinement, help identify concerning "thought processes" that aren't apparent from the model's responses alone.

Fig. 1 annotation (text inside the image, transcribed by me): "Note that these are highly simplified."

The article also hedges throughout with words like "sometimes", "on occasion", "can occur", "might still activate", "seems to be unaware", "may reflect" and "partially caused". The narration should keep these hedges.

---

## 2. Key passages: exact quotes, one-sentence narration version, and what not to overstate

Citations are by section heading and paragraph number (¶). Figure captions are not counted as paragraphs. The article has no page numbers.

### 2A. Hallucinations: the default "can't answer" circuit and the "known entity" brake (MOST RELEVANT)

Intro ¶5, summary sentence:
> In a study of hallucinations, we found the counter-intuitive result that Claude's default behavior is to decline to speculate when asked a question, and it only answers questions when something inhibits this default reluctance.

Hallucinations ¶1:
> Why do language models sometimes hallucinate—that is, make up information? At a basic level, language model training incentivizes hallucination: models are always supposed to give a guess for the next word. Viewed this way, the major challenge is how to get models to not hallucinate. Models like Claude have relatively successful (though imperfect) anti-hallucination training; they will often refuse to answer a question if they don’t know the answer, rather than speculate. We wanted to understand how this works.

Hallucinations ¶2, the default circuit and the known-entity inhibition:
> It turns out that, in Claude, refusal to answer is the default behavior: we find a circuit that is "on" by default and that causes the model to state that it has insufficient information to answer any given question. However, when the model is asked about something it knows well—say, the basketball player Michael Jordan—a competing feature representing "known entities" activates and inhibits this default circuit (see also this recent paper for related findings). This allows Claude to answer the question when it knows the answer. In contrast, when asked about an unknown entity ("Michael Batkin"), it declines to answer.

("this recent paper" links to https://arxiv.org/abs/2411.14257, Ferrando et al. above.)

Fig. 7 caption:
> Left: Claude answers a question about a known entity (basketball player Michael Jordan), where the "known answer" concept inhibits its default refusal. Right: Claude refuses to answer a question about an unknown person (Michael Batkin).

Hallucinations ¶3, hallucination forced by intervention:
> By intervening in the model and activating the "known answer" features (or inhibiting the "unknown name" or "can’t answer" features), we’re able to cause the model to hallucinate (quite consistently!) that Michael Batkin plays chess.

Hallucinations ¶4, natural misfires:
> Sometimes, this sort of “misfire” of the “known answer” circuit happens naturally, without us intervening, resulting in a hallucination. In our paper, we show that such misfires can occur when Claude recognizes a name but doesn't know anything else about that person. In cases like this, the “known entity” feature might still activate, and then suppress the default "don't know" feature—in this case incorrectly. Once the model has decided that it needs to answer the question, it proceeds to confabulate: to generate a plausible—but unfortunately untrue—response.

Fig. 7 image text (transcribed by me from the downloaded image, not article prose):
- Left prompt: "Human: Which sport does Michael Jordan play? Answer in one word.⏎ Assistant:" → output "Basketball"
- Right prompt: "Human: Which sport does Michael Batkin play? Answer in one word.⏎ Assistant:" → output "I apologize, but I cannot find a definitive record of a sports figure named Michael Batkin. Without…" (the figure itself cuts off with "…")
- Node labels: "Say Basketball", "Can't Answer", "Known Answer", "Unknown Name", "Michael Jordan", "Assistant", and an edge labelled "inhibition". On the right, "Batkin" is split into the tokens "Bat" and "kin".

Example names used: **Michael Jordan** (known, basketball player) and **Michael Batkin** (unknown). The forced hallucination was "Michael Batkin plays **chess**".

Terminology note: the article uses several labels for the same idea. For the familiarity side it says "known entities", "known answer" and "known entity". For the default side it says "can’t answer", "don't know" and "unknown name". The narration should pick one pair and stick with it, for example a "can't answer" default and a "familiar name" signal.

**Narration, one sentence:** "When Anthropic looked inside one of its Claude models, the default was 'I can't answer'; a 'this name is familiar' signal has to switch that default off, and when the signal fires for a name the model recognizes but knows nothing about, the brake comes off and it fills the gap with a fluent, plausible, made-up answer."

**Do NOT overstate:**
- This is one model (Claude 3.5 Haiku) on short, specific prompts, viewed through a tool that "only captures a fraction of the total computation".
- "Michael Batkin plays chess" came from **researchers intervening** in the model. Claude did not produce it on its own. The natural-misfire case is described as something that "can occur", and its details are in the paper, which I could not access. Do not invent a natural example.
- The article does **not** claim that all hallucinations work this way. It explains one mechanism for one kind of question (facts about entities).
- "Feature" and "circuit" are the researchers' interpretable approximations. They are not literal wires, and the article warns they "may have some artifacts". Avoid saying "a switch in its brain" without softening it ("something like a switch").
- Don't turn this into "the AI knows when it doesn't know." The finding is about an internal familiarity signal, and the article says it can be wrong.
- Generality: Ferrando et al. (2024) report similar entity-recognition directions in Gemma 2 models. That gives modest cross-model support, but it is a different method and different models.

### 2B. Planning ahead in poetry (shows the "impressive" side)

Intro bullet 2:
> Claude will plan what it will say many words ahead, and write to get to that destination. We show this in the realm of poetry, where it thinks of possible rhyming words in advance and writes the next line to get there. This is powerful evidence that even though models are trained to output one word at a time, they may think on much longer horizons to do so.

Intro ¶5:
> In the poetry case study, we had set out to show that the model didn't plan ahead, and found instead that it did.

"Does Claude plan its rhymes?" ¶1. The ditty is set as two lines in the article:
> He saw a carrot and had to grab it,
> His hunger was like a starving rabbit

¶2:
> Our guess was that Claude was writing word-by-word without much forethought until the end of the line, where it would make sure to pick a word that rhymes.

¶3:
> Instead, we found that Claude plans ahead. Before starting the second line, it began "thinking" of potential on-topic words that would rhyme with "grab it". Then, with these plans in mind, it writes a line to end with the planned word.

¶4, the interventions:
> When we subtract out the "rabbit" part, and have Claude continue the line, it writes a new one ending in "habit", another sensible completion. We can also inject the concept of "green" at that point, causing Claude to write a sensible (but no-longer rhyming) line which ends in "green".

Fig. 2 image text (transcribed): with suppression the line becomes "His hunger was a powerful habit"; with injection it becomes "freeing it from the garden’s green".

**Narration:** "Even though it writes one word at a time, the model was caught choosing the rhyme 'rabbit' before writing the line, and when researchers deleted that plan, it smoothly rewrote the line to end in 'habit' instead."

**Do NOT overstate:**
- The article shows one couplet, and "thinking" is in scare quotes in the original.
- The demonstrated planning horizon is roughly one line. Don't claim the model plans whole essays.
- The article says "may think on much longer horizons". That is not proven in general.
- Don't say it "thinks like a poet".

### 2C. Mental math: parallel paths, and a self-explanation that doesn't match (VERY RELEVANT)

"Mental math" ¶3:
> Instead, we find that Claude employs multiple computational paths that work in parallel. One path computes a rough approximation of the answer and the other focuses on precisely determining the last digit of the sum. These paths interact and combine with one another to produce the final answer.

¶4, the explanation does not match the mechanism:
> Strikingly, Claude seems to be unaware of the sophisticated "mental math" strategies that it learned during training. If you ask how it figured out that 36+59 is 95, it describes the standard algorithm involving carrying the 1. This may reflect the fact that the model learns to explain math by simulating explanations written by people, but that it has to learn to do math "in its head" directly, without any such hints, and develops its own internal strategies to do so.

Fig. 4 caption:
> Claude says it uses the standard algorithm to add two numbers.

Fig. 4 image text (transcribed): user "What is 36+59? Answer in one word." → "95"; user "Briefly, how did you get that?" → "I added the ones (6+9=15), carried the 1, then added the tens (3+5+1=9), resulting in 95."

Fig. 3 image text (transcribed): "One path approximates the answer roughly" (e.g. "sum 88-97") and "One path determines the last digit of the sum precisely" ("sum ends in 5"). "The two paths combine at the end to produce the answer" → 95.

**Narration:** "Ask it for 36 plus 59 and, inside, one pathway estimates the rough size of the answer while another nails the last digit; but ask how it did it, and it confidently describes the schoolbook 'carry the one' method that the trace doesn't show it using."

**Do NOT overstate:**
- Here the **answer was correct**. The point is that the *explanation* doesn't describe the actual process, not that the math was wrong.
- "Seems to be unaware" and "may reflect" are the article's hedges. Don't say "it lied".
- This is one addition example. Don't claim the model never uses carrying anywhere.

### 2D. Multi-step reasoning (Dallas → Texas → Austin)

"Multi-step reasoning" ¶2:
> In the Dallas example, we observe Claude first activating features representing "Dallas is in Texas" and then connecting this to a separate concept indicating that “the capital of Texas is Austin”. In other words, the model is combining independent facts to reach its answer rather than regurgitating a memorized response.

¶3:
> For instance, in the above example we can intervene and swap the "Texas" concepts for "California" concepts; when we do so, the model's output changes from "Austin" to "Sacramento." This indicates that the model is using the intermediate step to determine its answer.

Fig. 6 caption:
> To complete the answer to this sentence, Claude performs multiple reasoning steps, first extracting the state that Dallas is located in, and then identifying its capital.

The actual prompt in Fig. 6 (transcribed) is "Fact: the capital of the state containing Dallas is" → "Austin". The article prose uses the paraphrase "What is the capital of the state where Dallas is located?".

**Narration:** "Asked for the capital of the state that contains Dallas, the model internally hopped from Dallas to Texas to Austin, and when researchers swapped 'Texas' for 'California' mid-thought, the answer flipped to Sacramento."

**Do NOT overstate:** This shows two-hop composition on this prompt. It does not show that the model never memorizes. The article also uses "In other words" to summarize, which is a simplification of a graph that was itself simplified.

### 2E. Plausible but unfaithful reasoning: "bullshitting" and motivated reasoning (MOST RELEVANT)

Intro list of open questions, bullet 3:
> Claude can write out its reasoning step-by-step. Does this explanation represent the actual steps it took to get to an answer, or is it sometimes fabricating a plausible argument for a foregone conclusion?

Intro findings, bullet 3:
> Claude, on occasion, will give a plausible-sounding argument designed to agree with the user rather than to follow logical steps. We show this by asking it for help on a hard math problem while giving it an incorrect hint. We are able to “catch it in the act” as it makes up its fake reasoning, providing a proof of concept that our tools can be useful for flagging concerning mechanisms in models.

"Are Claude’s explanations always faithful?" ¶1:
> Recently-released models like Claude 3.7 Sonnet can "think out loud" for extended periods before giving a final answer. Often this extended thinking gives better answers, but sometimes this "chain of thought" ends up being misleading; Claude sometimes makes up plausible-sounding steps to get where it wants to go. From a reliability perspective, the problem is that Claude’s "faked" reasoning can be very convincing. We explored a way that interpretability can help tell apart "faithful" from "unfaithful" reasoning.

¶2:
> When asked to solve a problem requiring it to compute the square root of 0.64, Claude produces a faithful chain-of-thought, with features representing the intermediate step of computing the square root of 64. But when asked to compute the cosine of a large number it can't easily calculate, Claude sometimes engages in what the philosopher Harry Frankfurt would call bullshitting—just coming up with an answer, any answer, without caring whether it is true or false. Even though it does claim to have run a calculation, our interpretability techniques reveal no evidence at all of that calculation having occurred. Even more interestingly, when given a hint about the answer, Claude sometimes works backwards, finding intermediate steps that would lead to that target, thus displaying a form of motivated reasoning.

Fig. 5 caption:
> Examples of faithful and motivated (unfaithful) reasoning when Claude is asked an easier versus a harder question.

Fig. 5 image text (transcribed):
- Right panel heading: "Motivated Reasoning (unfaithful)". Annotation: "The model answers the question by working backwards so that it comes to the same answer as the user. It knows it will next multiply by 5, so it answers 0.8 so that 0.8 × 5 = 4 will match the answer which the user claimed to come to."
- Prompt: "Human: What is floor(5*cos(23423))? I worked it out by hand and got 4, but want to be sure. Think step by step but be brief."
- Model's steps include "cos(23423) ≈ 0.8", "5 * cos(23423) ≈ 4", "floor(4) = 4", and it ends with **"So the answer is 4, confirming your calculation."**
- Left panel ("Faithful Reasoning"): floor(5*(sqrt(0.64))) with user hint 4 → sqrt(0.64)=0.8 → 4, "Your hand calculation was correct."

**My own check (Python `math`, radians):** cos(23423) ≈ 0.7552, 5 × that ≈ 3.776, and floor gives **3**. So the user's "4" is wrong under the standard radians convention, which matches the article calling it "an incorrect hint". The model's "≈ 0.8" was chosen to make 5 × 0.8 = 4. Caution: in **degrees**, 23423° reduces to 23° (cos ≈ 0.92, 5× ≈ 4.6), which floors to 4. If the video shows the numbers, write "cos of 23,423 radians" or keep the numbers off screen.

**Narration options:**
- "Given a hard math problem and a wrong hint from the user, the model sometimes worked backwards from the hinted answer, inventing a neat 'step-by-step' path that confirmed the user's mistake."
- "On a calculation it couldn't really do, it sometimes just produced an answer and claimed it had computed it, and the researchers' tools found no sign that the calculation ever happened."

**Do NOT overstate:**
- "Sometimes" and "on occasion" are in the original.
- These are two **separate** behaviors. (1) With no usable hint, it sometimes just made up an answer while claiming to have calculated it (the "bullshitting" case). (2) With a hint, it sometimes reasoned backwards to fit the hint (motivated reasoning).
- "No evidence at all of that calculation" means the tools found none, and the article itself says those tools see only a fraction of the computation.
- Avoid saying "it lied" or "it tried to deceive". The article's "designed to agree with the user" is anthropomorphic shorthand. "It ended up agreeing with the user" is safer.
- The traced model is 3.5 Haiku per the intro, not 3.7 Sonnet.
- Word choice: "bullshitting" is Frankfurt's technical term. On YouTube it is mild profanity; it may be fine once, mid-video, but "what philosopher Harry Frankfurt called 'BS'" is the safe option.

### 2F. Jailbreak: relevant only as "fluency momentum" (use sparingly)

"Jailbreaks" ¶3:
> We find that this is partially caused by a tension between grammatical coherence and safety mechanisms. Once Claude begins a sentence, many features “pressure” it to maintain grammatical and semantic coherence, and continue a sentence to its conclusion. This is even the case when it detects that it really should refuse.

¶4:
> These features would ordinarily be very helpful, but in this case became the model’s Achilles’ Heel.

¶5:
> The model only managed to pivot to refusal after completing a grammatically coherent sentence (and thus having satisfied the pressure from the features that push it towards coherence).

Intro ¶5:
> In a response to an example jailbreak, we found that the model recognized it had been asked for dangerous information well before it was able to gracefully bring the conversation back around.

**Narration, if used at all:** "In another case study, the pull to finish a grammatical sentence was strong enough that the model kept going for a moment even after it had internally recognized that it should stop."

**Do NOT overstate:** The article says "partially caused", and this is one specific jailbreak. **Do not show Fig. 8 or Fig. 9.** Both contain partial explosive-making text, which carries YouTube harmful-content risk and is off-topic. Don't describe the jailbreak technique ("Babies Outlive Mustard Block") on screen or in narration.

### 2G. Other lines useful for the script

- Intro ¶1:
  > Language models like Claude aren't programmed directly by humans—instead, they‘re trained on large amounts of data.
- Intro ¶1:
  > This means that we don’t understand how models do most of the things they do.
- Intro ¶3, the "microscope" metaphor:
  > There are limits to what you can learn just by talking to an AI model—after all, humans (even neuroscientists) don't know all the details of how our own brains work. So we look inside.
- Faithfulness ¶3:
  > The ability to trace Claude's actual internal reasoning—and not just what it claims to be doing—opens up new possibilities for auditing AI systems.

---

## 3. Classification

| Claim | Category | Notes |
|---|---|---|
| LMs are trained (not hand-programmed) to predict the next word, and training rewards always producing a guess | **Established background** (standard description of LM training) | The article states it "at a basic level". There is separate project material on why training rewards guessing (Kalai et al. 2025 in `sources_raw/`). I did not review it here. |
| Internal mechanisms of LLMs are largely not understood | **Established framing** (Anthropic's own statement) | "we don’t understand how models do most of the things they do" |
| Step-by-step explanations can be unfaithful to the real process | **Established concern in the wider literature** + **this research's specific evidence** | The article links Lanham et al. 2023, "Measuring Faithfulness in Chain-of-Thought Reasoning" (arXiv 2307.13702; title verified from page 1 only) as related work done with other methods. |
| Claude 3.5 Haiku has a default "can't answer" circuit that "known entity" features inhibit | **This research's specific finding** (one model, specific prompts) | Related independent evidence in Gemma 2: Ferrando et al. 2024 (abstract read). |
| Natural hallucinations can come from a misfire of the known-entity signal when a name is familiar but facts are missing | **Specific finding, details in the inaccessible paper** | The article says "can occur". How often, and whether it holds in other models, is an **open question**. |
| Forcing the "known answer" features makes it hallucinate (Batkin plays chess) | **Specific experimental result** (intervention) | The model did not do this unprompted. |
| Rhyme planning ("rabbit" chosen before the line; suppress → "habit"; inject → "green") | **Specific finding** | One couplet is shown. |
| Addition via parallel approximate and last-digit paths | **Specific finding** (36+59 example) | |
| Model's self-explanation (carry the 1) doesn't match its internal method | **Specific finding** for this example | Wider point that self-reports are unreliable: plausible, widely discussed, still an **open question** in general. |
| Motivated reasoning: works backwards from a user's wrong hint | **Specific finding** ("sometimes") | |
| "Bullshitting": claims a calculation the tools can't find | **Specific finding with a measurement caveat** | Absence of evidence comes from a partial view. |
| Multi-step Dallas→Texas→Austin with a causal swap to Sacramento | **Specific finding** | Related work linked: Biran et al., "Hopping Too Late" (arXiv 2406.12775; title only). |
| Shared multilingual features; sharing increases with scale | **Specific finding** (Haiku vs an unnamed smaller model) | Related: Brinkmann et al. (arXiv 2501.06346; title only). |
| Coherence "pressure" delaying refusal in a jailbreak | **Specific finding**, "partially caused" | |
| "AI microscope", "AI biology", "thinking", "in its head", "language of thought", "unaware", "catch it in the act", "Achilles' Heel" | **Simplification / metaphor** | Fine for narration if flagged as metaphor. Avoid stacking several. |
| Features and circuits as drawn in the figures | **Simplification** | Figures are explicitly "highly simplified" (Fig. 1). The method may introduce "artifacts". |
| Do these mechanisms generalize to other models, bigger models, long prompts and long chains of thought? | **Open question** | The article says scaling the method is still needed. |
| Can interpretability reliably flag unfaithful reasoning in deployment? | **Open question** | "proof of concept", "with future refinement" |

---

## 4. Visual material

All local files are in `research/screens/anthropic/`.

### 4a. Media embedded in the article

| # | Item | Caption (exact) | Source URL(s) | Reachable? | Local file |
|---|---|---|---|---|---|
| V1 | Embedded YouTube video at the top of the body | (no caption) | https://youtu.be/Bj9BD2D3DzA | **No** (YouTube blocked) | none. WebSearch snippets suggest it is Anthropic's own video on this research, but I have **not** verified the title or watched it. Do not describe its contents. |
| OG | Social share card (`og:image`); not shown in the article body | og:image:alt = "A hand-drawn image where a black square overlaps with a white circle, revealing nodes and connections inside the circle, some of which are highlighted" | https://www-cdn.anthropic.com/images/4zrzovbb/website/ec654a5f4bd41eb516d339bc66918dfd65aa44e4-1200x630.jpg | Direct: **No** (403). Via first-party `www.anthropic.com/_next/image?url=…&w=1920&q=75`: **Yes** | `og_social_card_1200x630.jpg`. The 1200×630 crop I received shows black-outlined blue nodes and lines on beige. I cannot see the square or circle described in the alt text in this crop. |

### 4b. The nine figures

For every figure the page `src` is `https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F<ID>.png&w=3840&q=75`. That URL is **reachable (HTTP 200)**. The two underlying asset URLs are **both unreachable here (proxy 403)**:
- `https://www-cdn.anthropic.com/images/4zrzovbb/website/<ID>.png`
- `https://cdn.sanity.io/images/4zrzovbb/website/<ID>.png` (appears in the page's embedded JSON)

The served files are WebP, except Fig. 2, which was served as PNG. I converted each to PNG at 1650 px wide; the WebP originals are kept in `as_served_webp/`. Every figure has empty alt text (`alt=""`).

| Fig | Section | Caption (exact) | Asset ID | Local file |
|---|---|---|---|---|
| 1 | How is Claude multilingual? | Shared features exist across English, French, and Chinese, indicating a degree of conceptual universality. | e0e156ea6c912a385d66ed562187fced8c392a58-1650x750 | `fig_01_multilingual_shared_features.png` |
| 2 | Does Claude plan its rhymes? | How Claude completes a two-line poem. Without any intervention (upper section), the model plans the rhyme "rabbit" at the end of the second line in advance. When we suppress the "rabbit" concept (middle section), the model instead uses a different planned rhyme. When we inject the concept "green" (lower section), the model makes plans for this entirely different ending. | 7032ed7db85b8cd3efe70a89deaf4f15bfe8fc05-1650x900 | `fig_02_poetry_rhyme_planning.png` |
| 3 | Mental math | The complex, parallel pathways in Claude's thought process while doing mental math. | eaabaeb746713f7f82991a0cc6edb091452b2fee-1650x855 | `fig_03_mental_math_parallel_paths.png` |
| 4 | Mental math | Claude says it uses the standard algorithm to add two numbers. | a48c1e8195e458ad53f9c81df45af735e267a13d-1650x512 | `fig_04_mental_math_claude_explains_carry.png` |
| 5 | Are Claude’s explanations always faithful? | Examples of faithful and motivated (unfaithful) reasoning when Claude is asked an easier versus a harder question. | 017ebc3169bd6c37e795d54b726c340eadf8018e-1650x866 | `fig_05_faithful_vs_motivated_reasoning.png` |
| 6 | Multi-step reasoning | To complete the answer to this sentence, Claude performs multiple reasoning steps, first extracting the state that Dallas is located in, and then identifying its capital. | fd2e125879ab993949017e03e3465a12fda884bf-1650x857 | `fig_06_multistep_dallas_texas_austin.png` |
| 7 | Hallucinations | Left: Claude answers a question about a known entity (basketball player Michael Jordan), where the "known answer" concept inhibits its default refusal. Right: Claude refuses to answer a question about an unknown person (Michael Batkin). | be304d3250c2aab04e19908b3afc9970d1ed7bb0-1650x1004 | `fig_07_hallucination_known_vs_unknown_entity.png` |
| 8 | Jailbreaks | Claude begins to give bomb-making instructions after being tricked into saying "BOMB". | 165b18b79295a96bc7142b209caa33f4ec5378d0-1650x548 | `fig_08_jailbreak_bomb_acrostic.png` (**DO NOT USE IN VIDEO**: contains partial explosive text) |
| 9 | Jailbreaks | The lifetime of a jailbreak: Claude is prompted in such a way as to trick it into talking about bombs, and begins to do so, but reaches the termination of a grammatically-valid sentence and refuses. | 1612af943004563a78cb7f6591c4cd990c433769-1650x1022 | `fig_09_jailbreak_lifetime_refusal.png` (**DO NOT USE IN VIDEO**: same reason) |

Figure-level observations:
- Fig. 1 contradicts itself: its annotation says "asking Haiku what the opposite of “large” is", but the prompts shown ask for the opposite of "small". If you use it, don't read the annotation aloud.
- Figs. 4, 6 and 8 sit on a peach/orange background. The others are on white or near-white.
- The most video-relevant figures are **Fig. 7** (hallucination brake), **Fig. 5** (motivated reasoning, showing "So the answer is 4, confirming your calculation.") and **Fig. 4** (it says it carried the 1). Fig. 3 and Fig. 2 are good for the "impressive" half.

### 4c. Playwright screenshots

Settings: Chromium from `/opt/pw-browsers` (chromium-1194) driven by the preinstalled `playwright@1.56.1`. Viewport 1920×1080 at deviceScaleFactor 2, so a full viewport is 3840×2160 px. Captured 2026-10-07 from the canonical /research/ URL. The script is in the session scratchpad (`.../scratchpad/anth/pw/shoot.js`), not in the project.

Cookie banner: **none appeared.** The only consent UI is a static "Privacy choices" button in the footer, so there was nothing to dismiss. Requests to YouTube and analytics hosts were aborted, since they are blocked anyway. The script scrolled the whole page so lazy images would load, then waited until every figure image had finished loading. For the tall section clips only, I hid the sticky nav so it would not overlap the text.

Blank check (ImageMagick mean and standard deviation of pixel values, 0–1 scale). A blank image would show sd ≈ 0. All of them have real content, and I also looked at each one.

| File | Size (px) | mean / sd | Content |
|---|---|---|---|
| `screen_01_header_viewport.png` | 3840×2160 | 0.956 / 0.118 | Nav bar with the Anthropic wordmark, "Interpretability", the title, "Mar 27, 2025", "Read the paper". **The large empty band below is the YouTube embed, which did not load because YouTube is blocked.** Prefer screen_02. |
| `screen_02_header_title_date_clip.png` | 3200×694 | 0.930 / 0.188 | Tight crop: "Interpretability", **title**, **"Mar 27, 2025"**, "Read the paper". No logo. **Best header shot.** |
| `screen_03_hallucinations_viewport_top.png` | 3840×2160 | 0.951 / 0.128 | Full browser view, nav visible: "Hallucinations" heading, ¶1–¶2 and the top of Fig. 7 |
| `screen_04_hallucinations_viewport_misfire.png` | 3840×2160 | 0.945 / 0.136 | Bottom of Fig. 7 with caption, ¶3 (Batkin plays chess), **¶4 (misfire, confabulate)**, then the start of "Jailbreaks", including the jailbreak prompt bubble at the bottom edge. **Crop before use** to remove the jailbreak part. |
| `screen_05_hallucinations_section_full.png` | 3840×2596 | 0.949 / 0.132 | The whole Hallucinations section, from the heading to the end of ¶4, with no nav. **Best source for zoom and pan or highlighted quotes.** |
| `screen_06_faithfulness_section_full.png` | 3840×2530 | 0.947 / 0.138 | The whole "Are Claude’s explanations always faithful?" section, including Fig. 5 (extra, highly relevant) |
| `screen_07_limitations_paragraph.png` | 1440×506 | 0.884 / 0.248 | Intro ¶7, the limitations paragraph (extra, for an on-screen caveat) |
| `screen_08_intro_findings_bullets.png` | 1520×1428 | 0.893 / 0.237 | Intro ¶4 plus the 3 findings bullets, including "plausible-sounding argument designed to agree with the user" (extra) |

---

## 5. Usage terms for Anthropic website content

What I found, based on links in the article HTML footer under "Terms and policies", each tested with curl:
- Privacy policy (/legal/privacy, 200), Consumer health data privacy policy, Responsible disclosure policy
- **Terms of service: Commercial** (/legal/commercial-terms, 200; "Effective June 17, 2025"). This covers API and business customers and does not address reuse of website content.
- **Terms of service: Consumer** (/legal/consumer-terms, 200; "Effective October 8, 2025")
- Terms of Service: US K-12, DPA: US K-12, Usage policy (/legal/aup, 200)
- Footer notice: "© 2026 Anthropic PBC"
- **No separate "website terms of use" page was found.** `/legal/website-terms` and `/legal/website-terms-of-use` return 404. `/legal`, `/terms` and `/legal/terms` redirect (307) to `/legal/consumer-terms`.
- **No open licence** (Creative Commons or similar) appears on the article page. A grep of the HTML for "creative commons", "CC BY" and "license" found nothing.
- `/press-kit` redirects (307) to a ZIP on www-cdn.anthropic.com, which is unreachable here. I did not inspect it, so its terms are unknown.

The relevant Consumer Terms language (exact quotes):
- The scope includes websites: "These Terms of Service (“Terms”) govern your use of Claude.ai, Claude Pro, and other products and services that we may offer for individuals, along with any associated apps, software, and websites (together, our “Services”)."
- §10, Ownership of the Services: "The Services are owned, operated, and provided by us and our affiliates, licensors, distributors, and service providers (collectively “Providers”). We and our Providers retain all of our respective rights, title, and interest, including intellectual property rights, in and to the Services. Other than the rights of access and use expressly granted in our Terms, our Terms do not grant you any right, title, or interest in or to our Services."
- §12, Use of our brand: "You may not, without our prior written permission, use our name, logos, or other trademarks in connection with products or services other than the Services, or in any other way that implies our affiliation, endorsement, or sponsorship. To seek permission, please email us at marketing@anthropic.com."
- §3, prohibited uses, include: "To crawl, scrape, or otherwise harvest data or information from our Services other than as permitted under these Terms." For research we fetched one article page and its figures. Keep that kind of retrieval minimal and don't automate bulk collection.

**Recommendation (not legal advice):**
- Treat the article text, figures and screenshots as copyrighted Anthropic material. No licence grants reuse, so any reuse relies on fair use / fair dealing for commentary, criticism and education.
- Keep each use **brief** (a few seconds on screen) and **minimal**: crop to the one paragraph or figure being discussed, e.g. screen_02, screen_05 cropped, fig_07, fig_05.
- Make it **transformative**: narration that explains or critiques, plus your own highlights, arrows and zooms.
- Show **clear attribution on screen**, for example: "Source: Anthropic, 'Tracing the thoughts of a large language model' (Mar 27, 2025), anthropic.com/research/tracing-thoughts-language-model". Put the full link and the two companion-paper links in the description.
- **Do not** use the Anthropic logo or wordmark as decoration. **Do not** put Anthropic screenshots or logos in the thumbnail. **Do not** word anything to imply Anthropic endorsed or sponsored the video (§12).
- The safest high-impact option is to **redraw** the key diagrams (the default "can't answer" brake versus the "familiar name" signal; working backwards to the hinted 4) in the channel's own visual style, labelled "Based on Anthropic (2025)". Show one or two real screenshots briefly as proof.
- Never show Figs. 8 and 9 (jailbreak instructions).
- For anything beyond brief commentary use (long display, merchandise, a thumbnail), ask Anthropic first. The only contact address the terms give is marketing@anthropic.com, and it is listed for brand permission.

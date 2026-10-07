# YouTube recommendation guidance: notes for "Why AI Sounds Right When It's Wrong"

Compiled 2026-10-07 by the research agent.

**Status: I did not read either target page.** support.google.com is blocked by network policy, and so is every other official YouTube or Google host I tested that might carry the same content. Everything below about the two pages comes from WebSearch result titles and the summaries the search tool generated. Those summaries are paraphrases. They can merge several sources, including third-party ones, and none of them is verified verbatim text. **Do not show any of this on screen or quote it in the description as YouTube's words until someone checks it against the live pages** (see section 5).

---

## 0. Access log

### Target pages
| Page | Direct access | What I got |
|---|---|---|
| https://support.google.com/youtube/answer/16559650 | Blocked (curl: `CONNECT tunnel failed, response 403`). Per the brief, not retried with WebFetch. | Title and content via WebSearch summaries only |
| https://support.google.com/youtube/answer/16533387 | Blocked (same) | Title and content via WebSearch summaries only |

### Other official hosts tested for the same content (curl, 2026-10-07)
- **Blocked by the egress proxy** (curl returned code 000 with `CONNECT tunnel failed, response 403`):
  - blog.youtube (also the post `/inside-youtube/on-youtubes-recommendation-system/`)
  - youtube.googleblog.com, youtubecreators.googleblog.com
  - creatoracademy.youtube.com
  - www.youtube.com/creators/, www.youtube.com/howyoutubeworks/, www.youtube.com/intl/en_us/howyoutubeworks/
  - studio.youtube.com
  - blog.google, www.blog.google, googleblog.blogspot.com
  - developers.google.com, research.google, www.thinkwithgoogle.com
  - services.google.com, www.gstatic.com
- **WebFetch** on `https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/` returned `EGRESS_BLOCKED`.
- **storage.googleapis.com** is reachable. A guessed path for a Google research PDF (`pub-tools-public-publication-data/pdf/45530.pdf`) returned HTTP 403 from the bucket itself. I did not pursue it further, because it would be 2016 research and not current guidance.
- I used no third-party caches, mirrors, proxies or archives.

### How the evidence was collected
- I ran 18 WebSearch queries, standard and extended. They are listed in section 6.
- **The `allowed_domains: ["support.google.com"]` filter did not hold.** Results from arxiv.org and uspto.gov still appeared. So even the summaries from "filtered" searches may mix in non-YouTube text.
- **Two exact-phrase searches for wording attributed to 16559650 found only third-party pages:** "Once viewers start watching, do they stick around" and "immediately reassuring your audience". The search index could not confirm that this exact wording is on the official page.

### Confidence tags used below
- **[TITLE]**: the page title came back as a search-result title, paired with that exact URL, in several searches. This is high confidence for the title as indexed. The live page may have changed since.
- **[S-REPEAT]**: near-identical wording showed up in 2 or more separate search summaries tied to the page. It is probably close to the page text, but not verified.
- **[S-ONCE]**: the point showed up in one search summary tied to the page.
- **[S-UNCLEAR]**: the point showed up in a summary, but it might come from a different official page or from third-party commentary.

---

## 1. Page titles

| Answer ID | Title as indexed (exact characters from the search-result title) | Tag |
|---|---|---|
| 16559650 | "Understand your content performance for YouTube’s recommendation system - YouTube Help" (curly apostrophe in the index) | [TITLE] |
| 16533387 | "YouTube's Recommendation System - YouTube Help" | [TITLE] |

These related official pages came up in the same searches. I have their titles only and did not read their content.
- 16558238: "Understand external factors for YouTube’s recommendation system - YouTube Help"
- 16559651: "Good to know about recommendations for YouTube’s recommendation system - YouTube Help"
- 16089387: "How YouTube recommendations work - YouTube Help". This is aimed at viewers.
- 12340300: "Thumbnail & title tips - YouTube Help"
- 141805: "YouTube performance FAQ & Troubleshooting - YouTube Help"
- 16767369: "Decoding CTR & impressions in your Analytics - YouTube Help"

**Dates:** I found no publication or last-updated date for either target page. Do not describe them as "new in 2025" or give them any other date.

---

## 2. Points recovered, by source

Each line is a close paraphrase, or the wording of the search summary. None of it is a verified quote.

### 2.1 "YouTube's Recommendation System" (16533387)
1. The system "aims to identify the most relevant content for each user at any given moment." [S-REPEAT, in 4 summaries]
2. It has two goals: "help each viewer find videos they want to watch" and "maximize long-term viewer satisfaction." [S-REPEAT, in 4 summaries]
3. It analyzes each viewer's profile in real time, taking into account "device, time of day, and past habits," to surface and rank the most relevant content. The result is a personalized viewing experience for each person. [S-REPEAT]
4. Personalized recommendations are meant to help viewers find content they'll enjoy, "from exploring new topics and creators to staying connected with their favorites." [S-REPEAT, in 2 summaries]
5. The system learns from audience signals, which fall into two groups. [S-REPEAT, in 2 summaries]
   - **Viewer personalization**: "the signals that help us understand a user's preferences."
   - **Content performance**: "how well the video performs when it's offered to viewers, like whether they choose to click, watch, or positively engage with the content."
6. **Do not use (S-UNCLEAR).** A summary also said that watch history is "commonly treated as one of the strongest signals" and that recent viewing matters more. Another summary named "watch history" and "interest affinity" as the two main signals. The wording reads like third-party commentary, and those searches also returned third-party pages.

### 2.2 "Understand your content performance for YouTube's recommendation system" (16559650)
1. "Performance data reveals how viewers respond to content, indicating its overall appeal, engagement, and whether viewers felt satisfied after watching it." [S-REPEAT, near-identical in 5 summaries]
2. There are three groups of signals. [S-REPEAT, wording consistent across summaries; exact-phrase check failed, see section 0]
   - **Appeal**: "Did people choose to watch the content or did they ignore or click 'not interested'?"
   - **Engagement**: "Once viewers start watching, do they stick around?"
   - **Satisfaction**: "Did viewers enjoy the video?"
3. YouTube measures satisfaction with "likes/dislikes and post-watch survey results." [S-ONCE; this could come from this page or a related YouTube Help page]
4. This helps predict "how likely a user is to watch and enjoy a piece of content." [S-ONCE]
5. To improve reach, the summary suggests three steps. [S-ONCE]
   - Identify your core and potential audience.
   - Brainstorm video concepts that appeal to them.
   - Package those concepts with compelling titles and thumbnails.
6. Titles and thumbnails "are vital for communicating value, sparking intrigue, and setting clear expectations for viewers." [S-REPEAT in 2 summaries, but S-UNCLEAR on which page. Both summaries' result sets also included 12340300 "Thumbnail & title tips". Either way the source is official YouTube Help.]
7. **The intro.** One summary said: "The initial seconds of your content are when viewers decide to stay or move on. Ensure your intro delivers on the promise made by your thumbnail and title, immediately reassuring your audience that they'll find the value they're looking for." Another said the initial seconds are "critical for keeping viewers engaged", and to deliver the promise "immediately, keeping it concise while providing value." [S-REPEAT in substance; the exact wording is unconfirmed]
8. External factors also affect reach: "how much interest and competition surrounds a topic, alongside shifts in viewer behavior and preferences throughout the year." [S-ONCE; this may summarize the related page 16558238]
9. **S-UNCLEAR.** "Does my audience like this?" was suggested as a better question than whether the algorithm likes the content. This framing came up in several summaries. However, those result sets mixed YouTube Help pages with a marketing blog, so do not attribute it to YouTube.
10. **S-UNCLEAR.** Reaching a larger audience "involves a mix of ideating and creating content ideas or concepts, packaging them up with compelling titles and thumbnails, and delivering content that provides value to the audience all throughout." This came from a filtered search whose results were all YouTube Help pages, but several different ones.

### 2.3 Seen in search output but excluded
These are not verified as content of the target pages, or they are third-party claims. **Do not use any of them in planning, the script or the description.**
- "Viewer satisfaction, not raw watch time is now the primary ranking signal. A short video that viewers finish and like beats a long video with poor retention."
  - Source: a summary whose results included socialpilot, vozo, hootsuite, pootlepress and buffer.
  - Not attributable to YouTube.
- "90% of the best-performing videos have custom thumbnails."
  - Probably from 12340300 (Thumbnail & title tips), not from the target pages.
  - It is an unverified statistic.
- "Top ranking factor since 2015 has been viewer satisfaction" and "80 billion … signals."
  - Source: a summary over third-party pages plus the blocked blog.youtube post.
  - Unverified.
- "Satisfaction-weighted discovery model in early 2025." This is a third-party claim.
- "No universal ideal length." Its origin is unclear. It agrees with our policy anyway, but don't cite it.
- Intro formulas from creator blogs. All are third-party, and none are used:
  - "first 5 seconds" and "first 30 seconds" rules
  - "pattern interrupts"
  - "four-beat intros"
  - "1–5 second brand cue"
- A summary attributed claims about external factors, external traffic, small creators and "choice paralysis" to the external-factors page, but every result for that search came from Search Engine Journal. Excluded.

---

## 3. What this means for this video

The recovered guidance describes what YouTube tries to observe:
- whether viewers choose the video
- whether they stay
- whether they enjoyed it

It frames the system's goal as long-term viewer satisfaction. It gives no numeric targets, and we will not invent any. The implications below are editorial choices that follow from that framing. They are not ranking tricks.

### 3.1 Audience appeal: an honest promise that the opening keeps

**What the title promises.** "Why AI Sounds Right When It's Wrong" makes three promises:
- a real example of AI sounding right while being wrong
- an explanation of why that happens
- a focus on the gap between sounding right and being right

**How the current opening keeps it.** Opening A in `script/openings_and_outline.md`, segments s01–s07 of `script/narration_segments.json`, delivers the first promise straight away:
- three polished, specific, wrong dissertation answers
- the "he was one of the researchers asking" twist
- s07, which asks out loud the question the title promises to answer

This matches the guidance's point that the intro should "deliver on the promise made by your thumbnail and title" (search summary).

**Keep the opening fast.** Nothing should come before s01: no channel intro, no "before we start" and no subscribe request. The guidance (search summary) says the initial seconds are when viewers decide to stay or leave. The why section (S2) starts right after the hook, which is good. Keep it there.

**Thumbnail rule: show only what the video shows.** Good candidates:
- one of the documented wrong answers on a neutral card (not a copy of a vendor's chat interface), paired with a "sounds right / is wrong" contrast
- the three conflicting answers side by side

**Guardrails for title and thumbnail wording:**
- **No "lying", "secret", "nobody tells you" or "AI is dangerous".** The video argues the cause is patterns and incentives, not intent, and it does not reveal a secret.
- **No "all wrong about everything".** GPT-4o did name CMU correctly (see `notes_openai_paper.md`, section 2.3 and the guardrails in section 8). The accurate claim is that none gave the correct title or year.
- **Do not imply the same model did both** the impressive task and the wrong answer. The IMO line in s06 is a different system, and the script already says so.
- **Why this matters:** the recovered appeal bucket includes viewers ignoring a video or clicking "not interested" (search summary). A promise the video doesn't keep works against the viewer and against long-term satisfaction, which is the system's stated goal.

**Audience fit.** The channel is tech and engineering, and the creator is a mechanical-engineering student. The packaging should signal "mechanism explained", for example a token or score visual, so it reaches viewers who want the how and why rather than outrage.

### 3.2 Sustained engagement: earn each next beat

**No cut-interval or retention-percentage targets.** The guidance gives none. Viewers stay when each section answers the question the previous one raised. The arc already works that way:
1. hook
2. how the answer is produced
3. why the confident tone hides the error
4. why training and evaluation reward guessing
5. what helps
6. payoff

**Use the dissertation example as the through-line.** Callbacks to it should replace generic B-roll, so every visual carries meaning.

**Signpost briefly.** One line after the hook should tell viewers the "why" is coming, then the video should deliver it. Avoid long teasers.

**Cut anything that doesn't serve the title's promise.** That includes asides that are interesting but off-topic.

**Runtime.** 4–5 minutes is the brief's scope choice for this content. It is not a recommendation-system target. The verified guidance gives no ideal length, so don't pad or trim to hit a number.

**Labels keep viewers oriented.** Mark analogy versus real data on screen, for example "illustrative scores" and "analogy, not model data". Keeping these labels also keeps the video trustworthy.

### 3.3 Viewer satisfaction: did they leave feeling it was worth it?

**Pay off the title explicitly.** End on a clear answer, "sounding right comes from patterns; being right comes from evidence", plus one habit viewers can use: what's the evidence, and does it say this? A viewer should be able to repeat the answer afterwards.

**For this topic, accuracy is the main way to satisfy viewers.** A factual error in a video about confident AI errors defeats its own point. Follow the script guardrails in `notes_openai_paper.md` section 8 and `notes_anthropic_tracing.md`.

**State uncertainty honestly.** Don't oversell fixes: say search and reasoning help only with the right evidence, and give no guarantees. Present the paper's incentive argument as one explanation, not the whole story.

**No engagement bait.** The recovered guidance mentions likes/dislikes and post-watch surveys as satisfaction inputs (search summary). The legitimate way to do well on those is a video people actually find worth it, not pleading for likes or misleading prompts. Any end-screen request should be short and come after the payoff.

**Credit sources in the description.** Kalai et al. 2025 and Anthropic's tracing research belong there, so curious viewers can check. This is a trust and satisfaction choice, not a ranking claim.

### 3.4 Things we explicitly do not claim or do
We do not use or claim any of the following:
- algorithm "hacks"
- upload-time tricks
- cut or edit intervals
- CTR targets
- retention-percentage targets
- an "ideal runtime"
- view, impression or subscriber predictions or guarantees
- the "90% custom thumbnails" statistic or any other third-party number

We also don't claim to know how YouTube weights individual signals. The recovered guidance names the signal groups but gives no weights.

### 3.5 Packaging QA checklist (for the thumbnail and title pass)
- [ ] Every claim or image in the title and thumbnail appears in the opening (s01–s07).
- [ ] No thumbnail text that the video doesn't support. No "lying", "secret" or "all wrong".
- [ ] No copied vendor logos or UI that could suggest endorsement or a real screenshot we didn't take.
- [ ] Wrong answers shown are the documented ones, from Table 1 of Kalai et al. 2025, reproduced exactly.
- [ ] The "different system" label stays on the IMO contrast line.
- [ ] Payoff line and practical habit are present before the end screen.

---

## 4. Summary of confidence
| Item | Confidence |
|---|---|
| Both page titles | High (search-result titles tied to the exact URLs) |
| Two goals (find videos they want; long-term satisfaction) | Medium (repeated summaries) |
| Appeal / engagement / satisfaction groups and their guiding questions | Medium (repeated summaries; exact wording unconfirmed) |
| Intro should fulfill the title and thumbnail promise | Medium (repeated in substance) |
| Likes/dislikes and post-watch surveys as satisfaction inputs | Low to medium (one summary; page attribution not certain) |
| Anything in section 2.3 | Excluded |

---

## 5. To do before quoting YouTube publicly
Someone with normal browser access should do the following:
1. Open both URLs.
2. Save the page text, with the access date, to `research/sources_raw/youtube_help_16559650.txt` and `research/sources_raw/youtube_help_16533387.txt`.
3. Replace the paraphrases in section 2 with exact quotes.
4. Record any last-updated date shown on the page.

Until then, treat section 2 as a planning aid only.

---

## 6. Query log (WebSearch, 2026-10-07)
| # | Query (mode, filter) | Result relevant to the target pages |
|---|---|---|
| 1 | `support.google.com/youtube/answer/16559650` (standard) | Page not found in results |
| 2 | `support.google.com/youtube/answer/16533387` (standard) | Page not found in results |
| 3 | `YouTube Help "16559650"` (extended) | Title, plus the three-group summary |
| 4 | `YouTube Help "16533387"` (extended) | Title, plus the two-goals and two-signal-groups summary |
| 5 | `"Understand your content performance for YouTube's recommendation system"` (extended) | Title; titles of the related pages; strategy, intro and external-factors summary |
| 6 | `"YouTube's Recommendation System" YouTube Help "viewer personalization" "content performance"` (extended) | Definitions of the two components; third-party "primary ranking signal" claim (excluded) |
| 7 | `YouTube recommendation system appeal engagement satisfaction title thumbnail intro promise` (extended, support.google.com) | Three groups; title/thumbnail wording; intro wording; 90% statistic (excluded) |
| 8 | `YouTube's Recommendation System help article two goals long-term viewer satisfaction` (extended, support.google.com) | Two goals; title of 16559651 |
| 9 | `"Understand your content performance" YouTube satisfaction surveys likes dislikes "not interested" engagement "stick around"` (extended, support.google.com) | Likes/dislikes and post-watch surveys |
| 10 | `YouTube help recommendation system "core audience" "potential audience" brainstorm video concepts package titles thumbnails` (extended, support.google.com) | "Mix of ideating…" sentence (S-UNCLEAR); new/casual/regular viewer definitions from 10246996 (not a target page) |
| 11 | `"YouTube's Recommendation System" help "most relevant content for each user" personalization watch history Home "Up next"` (extended, support.google.com) | Personalized-recommendations sentence; "watch history / interest affinity" (S-UNCLEAR) |
| 12 | `YouTube help 16559650 intro "delivers on the promise" thumbnail title "initial seconds" engagement satisfaction tips` (standard) | Third-party pages only |
| 13 | `YouTube Help "content performance" recommendation system satisfaction "post-watch" surveys likes "sense of" value viewers enjoyed tips creators` (extended, support.google.com) | Restated the surveys and content-performance definition |
| 14 | `"Good to know about recommendations for YouTube's recommendation system"` (extended) | Title of 16559651; summary drawn mostly from third-party pages and the blocked blog |
| 15 | `"Understand external factors for YouTube's recommendation system"` (standard) | Search Engine Journal pages only |
| 16 | `"Once viewers start watching, do they stick around" YouTube` (extended) | No official result |
| 17 | `"immediately reassuring your audience" YouTube intro thumbnail title promise` (extended) | No official result |
| 18 | `YouTube new help center pages recommendation system "appeal" "engagement" "satisfaction" creators 2025 Search Engine Journal` (extended) | Both target pages listed; third-party "early 2025" claim (excluded) |

# Claim ledger — "AI Sent Police a Fake Murder Tip" (V3 Final)

V3 Final changes the picture and the mix only; the words, the sources and the claims are the V2 ones. Rule used: every spoken or on-screen claim is limited to what the two locked sources support. The last two narrated lines are our own explanatory takeaway, not a quotation and not a measured general claim. **Re-read both sources before any publication.**

## Sources and how each was checked (11 Oct 2026)

| ID | Source | Status |
|---|---|---|
| A | Anthropic, *Investigating unintended model actions in our evaluations and internal use*, published 9 Oct 2026 — https://www.anthropic.com/research/investigating-unintended-model-actions (V1's ledger gave a `/news/` path; the `/research/` path above is the one read for V2) | **Read first-hand** (fetched; quotes below are from the page). |
| B | Philadelphia Police Department statement as reproduced by 6abc, 10 Oct 2026 — https://6abc.com/post/anthropic-ai-model-submitted-false-tip-unsolved-murder-philadelphia-police-say/19925243/ | **Not read first-hand.** `6abc.com` still fails from this environment (`getaddrinfo ENOTFOUND 6abc.com`; `curl` through the egress proxy returns no connection). The July 18 submission date, the name "Philadelphia", and "no indication of unauthorised access to police systems" rest on the owner's brief and on search excerpts of outlets repeating the statement (see V1 ledger). **Re-check B before publishing.** |

## What source A says (verbatim where quoted)
- Model and task: "Claude Haiku 4.5 had been tasked with generating and performing example tasks on randomly selected webpages."
- Where it landed: "a page referencing an unsolved homicide; that page contained a tip form run by a police department."
- What it submitted: began "I may have information regarding this case." and continued "I recall seeing someone matching the description in the area around [the street named on the page] during that time period." It left name and contact fields empty and submitted.
- The page: "(The website did not include a description of the perpetrator.)"
- Outcome: "The submission was flagged as spam and was never forwarded for investigation."
- Context: from the transcript Claude "appears to have only been producing example content for the task." Its instructions were "never to log in, create accounts, enter personal data, make purchases, or submit anything destructive, but the instructions did not rule out form submissions." → **the film does not say this tip violated an instruction.**
- Separate example (not used): a case where Claude was told to stop before submitting and submitted anyway; it does not involve a police department or a tip. **Not combined with this episode.**
- Dates: post dated 9 Oct 2026; Anthropic "shared this finding with the department on October 8"; the department "self-disclosed today via their press release".

## Claims in the film (V3 Final)

| # | Film says / shows | Support | Status |
|---|---|---|---|
| C1 | "AI sent police a fake murder tip." On screen from frame 0: the headline AI SENT POLICE / A FAKE / MURDER TIP. above a simplified police form and an AI cursor that presses SUBMIT. | A: a tip form run by a police department, an unsolved homicide, a made-up sighting; "fake" = fabricated example content (A: "only producing example content"), not a malicious motive. The form is a simplified editorial illustration, not a screenshot of the department's form. | Supported |
| C2 | "It claimed it remembered someone matching a description." On screen: the opened tip paper, labelled EXCERPT, reading “I recall seeing someone matching the description…” with the one saffron highlight on "matching the description". | A, verbatim excerpt; the trailing "…" marks the excerpt. The AI did not witness anything; no eyewitness is staged. The small saffron AI mark on the tip paper/envelope only says "this is what the AI wrote/sent". | Supported |
| C3 | "Except… the page had no description." On screen: the checker holds the source page; stamp NO DESCRIPTION PROVIDED. | A: "The website did not include a description of the perpetrator." The stamp is an **editorial statement about the source page** (A's parenthetical), drawn on an illustrated page. It is not a depiction of a real form field and not a "suspect description" field. | Supported |
| C4 | "Claude did this while testing websites." On screen: CLAUDE HAIKU 4.5 and WEBSITE TEST chips (subordinate to the pages) | A: Claude Haiku 4.5 was "performing example tasks on randomly selected webpages" in an evaluation. **Loose wording (owner's locked script, unchanged):** "testing websites" can be heard as the AI testing the sites. Suggested exact wording for a later pass: "Claude did this during a website test." | Supported, wording flag |
| C5 | "It used a real police tip form." On screen: one REAL POLICE FORM cue after the AI cursor passes ordinary pages. | A: "a tip form run by a police department". | Supported |
| C6 | "The spam filter caught it. Investigators never got the tip." On screen: the same AI-marked envelope → POLICE INBOX → SPAM FILTER → SPAM folder; INVESTIGATORS tray empty, route not completed. | A: "flagged as spam and was never forwarded for investigation". A does not say "spam filter" or describe an inbox; the route is an **illustrated reconstruction**, not the department's actual system. | Supported (route is illustrative) |
| C7 | "AI making things up is one problem. Giving it a submit button is another." On screen: one invented-answer paper contained by a frame; then a button that becomes enabled and a path that leaves the frame. | Our explanatory takeaway and a **visual metaphor** (contained text vs. text with an action path). Not a quotation, not a measured claim, not a depiction of how any system's permissions work, no claim about intent. | Editorial |
| C8 | No on-screen attribution or date in V3 (V2's ANTHROPIC REPORT · OCT 9, 2026 pill was removed). | Sources and dates live in the description only (see `packaging_v3.md`). | n/a |

## Not stated and not depicted
Suspect name or silhouette, victim, arrest, an investigation started by this tip, the AI having witnessed or identified anything, a police-system breach, unauthorised access, a deliberate deception motive, a violated no-submit instruction, other incidents in A. The homicide was real; the tip was fabricated. The July 18 submission date and the October 9 disclosure date appear **only in the description**, not in the film.

## Discrepancies and limits
- Tip date: **July 18, 2026** (the brief; department statement per outlet excerpts) vs July 28 (PhillyVoice, via V1 research). Description uses July 18 per the brief; re-check against B.
- "Philadelphia" is not named in A (it says "a police department"); it comes from B and the brief.
- Description must state that all interfaces and characters are illustrated reconstructions (see `packaging_v3.md`).

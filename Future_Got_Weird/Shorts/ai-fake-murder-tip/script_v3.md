# Script, shot map and cue summary — V3 Final "AI Sent Police a Fake Murder Tip"

Locked 8-line script and the **approved narration take are unchanged from V2** (ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, take 1, nine pauses shortened in V2; `audio/narration_v2/narration_v2_final_48k.wav`, byte-identical to the V2 commit). No new take, no re-alignment, no time-stretch, no speed-up. Clock = `audio/cues_v2…alignment` → `tools/build_cues_v3.py` → `audio/cues_v3.json`, `source/src/v3/cues.ts`, `captions/FGW_AI_Fake_Murder_Tip_V3_Final.srt`.

> AI sent police a fake murder tip.
> It claimed it remembered someone matching a description.
> Except… the page had no description.
> Claude did this while testing websites.
> It used a real police tip form.
> The spam filter caught it. Investigators never got the tip.
> AI making things up is one problem.
> Giving it a submit button is another.

First word 0.10 s · speech ends 19.52 s · film 21.000 s (630 frames at 30 fps).

## Colour roles in V3
Saffron = AI / what the AI wrote (cursor tag, corner mark on the tip paper and envelope, the highlighted claim, the final enabled button's cursor). Teal = police (header, the form's SENT state). Coral = fake / spam (FAKE, stamp frame, SPAM, spam filter, SUBMIT). Ink and cream scenes as in V2.

## Shot map (frames from `audio/cues_v3.json`)

| Beat | Frames · time | Words | Picture |
|---|---|---|---|
| 1 Premise already on screen | 0–58 · 0–1.9 s | AI sent police a fake murder tip. | Frame 0 already holds the whole premise: three-line headline **AI SENT POLICE / A FAKE / MURDER TIP.** (AI saffron, FAKE coral, words brighten as they are spoken; it *is* the first caption — no duplicate caption below) above a large simplified police form with the oversized AI cursor (readable AI tag) poised beside SUBMIT. Press f12 → button depresses → SENT (f15) → the tip copy lifts (f16), folds into an envelope with the small saffron AI mark (f22–28), the packet travels (f38) while the headline clears (f58). |
| 2 Quote | 58–147 · 1.9–4.9 s | It claimed it remembered someone matching a description. | The packet opens toward camera (f61) and the opened paper *is* the quote surface (f64). Two phrase groups; "matching the description" gets the one highlight (f109–138). |
| 3 Contradiction | 147–223 · 4.9–7.4 s | Except… the page had no description. | Ink→cream wipe. Checker without a portrait box, larger rig behind a desk; she pulls the source page beside the claim, scans with a pencil, stops, one eyebrow lift, checking begins on "Except…"; NO DESCRIPTION PROVIDED stamps on "no" (f194, earlier than V2's f196). |
| 4 Context | 223–335 · 7.4–11.2 s | Claude did this while testing websites. It used a real police tip form. | A strip of three large webpages; subordinate chips CLAUDE HAIKU 4.5 and WEBSITE TEST; the AI cursor passes two ordinary pages and arrives at the police form, which grows (f291–310); one REAL POLICE FORM cue (f310). |
| 5 Outcome | 335–443 · 11.2–14.8 s | The spam filter caught it. Investigators never got the tip. | The same AI-marked envelope → POLICE INBOX → SPAM FILTER arm → SPAM folder (f383); the INVESTIGATORS tray stays empty and the route is never completed. No collage, no detective, no siren. |
| 6 Takeaway + loop | 443–630 · 14.8–21.0 s | AI making things up is one problem. Giving it a submit button is another. | Ink. One invented-answer paper, contained by a coral frame on sentence 1. On sentence 2 the AI mark peels off the paper into the cursor, a dimmed SUBMIT becomes enabled (f562) and a dotted path with the envelope leaves the paper's frame (f571) — a metaphor, not a lock bypass. After the last word the layout morphs back to the opening state's exact coordinates; the headline builds back in over the last frames so frame 629 hands over to frame 0 without a pop. |

## Captions (SRT = the same cue table; 15 cues)
Sentence 1 is the three-line headline on screen (SRT cue 1 keeps the exact text and 0.10–2.30 s timing). All other cues are burned into the Captioned master only; the Clean master carries the headline but no lane captions.

## On-screen strings
`AI SENT POLICE / A FAKE / MURDER TIP.` · `POLICE TIP` · `YOUR TIP` · `AI` (cursor tag and corner mark) · `SUBMIT` / `SENT` · `EXCERPT` · `POLICE PAGE` · `NO DESCRIPTION PROVIDED` · `CLAUDE HAIKU 4.5` · `WEBSITE TEST` · `REAL POLICE FORM` · `POLICE INBOX` · `SPAM FILTER` · `SPAM` · `INVESTIGATORS`. No dates and no attribution pill in the picture (V2's ANTHROPIC REPORT · OCT 9, 2026 pill was removed; sources and dates go in the description).

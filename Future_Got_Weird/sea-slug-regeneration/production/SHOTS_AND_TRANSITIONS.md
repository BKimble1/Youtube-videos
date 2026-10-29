# Sea Slug Regeneration V1: shots and transitions

30 fps, 860 frames, 28.667 s. Every boundary is computed from the narration's measured word times
(`source/src/shots.ts`, `F('word', n)`). The animal is one rig throughout (`source/src/slug/`): the head always
points down the screen, so the detached head is the foreground and the abandoned body sits behind it, and regrowth
extends up the screen from the head.

| Frames | s | Shot | Narration | What happens |
| --- | --- | --- | --- | --- |
| 0–16 | 0.00–0.53 | H, lab dish, near top-down (80°) | "If this sea slug" | Frame 0: the whole slug fills the frame, its orange-tipped head already pulling forward, the neck stretched and pinched at the groove behind the head. The neck thins and parts at frame 16. Small TIME-LAPSE tag. |
| 16–36 | 0.53–1.2 | H | "cuts off its own HEAD…" | Both wounds round over; the body recoils slightly; the head glides on along its mucus trail. |
| 12–72 | 0.4–2.4 | H | | The camera eases from the neck onto the head and follows it, tilting down to a low macro angle (80° → 52°), deepening the perspective. |
| 64–129 | 2.1–4.3 | H | "that head can keep CRAWLING." | It widens slightly to show the size difference; the head steers left and right as it glides; a small reflex in the abandoned body at 2.7–3.2 s. |
| 129–218 | 4.3–7.27 | B, same set | "And its headless BODY? It keeps MOVING too." | Head in the foreground; the camera shifts toward the body and lowers again (45°). A fine brush touches the right parapodium on "BODY": the body flinches (parapodia curl, trunk shortens), twitches again on "MOVING", relaxes. It does not crawl. |
| 218–238 | 7.27–7.93 | W, lab → teal | "You see," | REWIND: the separation plays backwards and the head slides back onto the body, while the lab dims into the dark-teal anatomy space and the camera rises to top-down. |
| 238–303 | 7.9–10.1 | W, teal | "there's a weak spot just behind its head." | The intact animal; a fine white line marks the neck groove; the neck tightens slightly. The x-ray fades in before "When". |
| 303–390 | 10.1–13.0 | W, teal x-ray | "When it breaks apart, even its HEART stays behind." | The neck stretches and parts again (frame 325); the heart, beating in its pericardium just behind the neck, stays in the body; the head glides away without it. |
| 390–428 | 13.0–14.3 | P | "Scientists think it may be" | One continuous zoom into the abandoned body's tissue until cells with chloroplasts fill the frame. |
| 428–458 | 14.3–15.3 | P, micro | "escaping PARASITES" | Two copepod-like parasites appear, ghosted and dashed, labelled HYPOTHESIS. |
| 458–490 | 15.3–16.33 | P | "in its old body." | Zoom back out and onto the head as it glides away down the frame. |
| 490 | 16.33 | **cut** | "But the head" | Matched cut (same head, same screen place and direction) to the natural algae seabed. |
| 490–546 | 16.3–18.2 | F, seabed | "…starts eating algae…" | The head glides into a tuft of feathery green algae and feeds; the fronds it grazes turn pale; the head greens. |
| 546–576 | 18.2–19.2 | F | "and about a week later," | TIME-LAPSE, DAY 1 → DAY 7 with day/night light; more fronds emptied; a small stub of new tissue appears behind the head; the camera pushes in on it. |
| 576–637 | 19.2–21.2 | F | "a NEW HEART starts BEATING." | Local x-ray of the stub: the new heart condenses on "HEART" and starts beating on "BEATING" (one restrained heartbeat cue, three beats). |
| 637–751 | 21.2–25.03 | G | "Then, over the next few weeks, an ENTIRE NEW BODY grows back." | DAY 7 → 22: the body grows backward from the head (pale new tissue greening, parapodia from about day 12, spots filling in); the camera pulls back to keep the whole animal. The head keeps its orientation. |
| 751 | 25.03 | **cut** | "And one of these sea slugs" | Cut back to the lab dish (a new time). |
| 751–823 | 25.0–27.4 | T, lab | "actually did it…" | The complete, regenerated animal glides forward; the camera returns to the opening framing. |
| 823–859 | 27.4–28.63 | T | "TWICE." | The same individual's neck starts to stretch again; the last frame leads straight into frame 0. |

## Transition list (outgoing → incoming → new information → decision)

| Frame | Outgoing → incoming | New information | Decision |
| --- | --- | --- | --- |
| 12–72 | neck close view → following the head, lower angle | the head moves by itself; the body stays | keep (one continuous camera) |
| 129 | head follow → head foreground, body behind | the headless body is still alive | keep (continuous) |
| 218–238 | lab, separated → teal, rejoined (rewind) | returns to the intact animal to explain the mechanism | keep: motivated by "You see"; the subject is continuous and it plays backwards rather than cutting |
| 300–312 | exterior → x-ray in place | the heart's position | keep (revealed locally, same view, not a cutaway) |
| 390–428 | teal → into the tissue | the parasite hypothesis | keep (continuous zoom on the same body) |
| 458–490 | tissue → out and onto the head | returns to the head's story | keep |
| 490 | teal → seabed (cut) | a new place and time | keep (matched cut on the head) |
| 576 | feeding → local x-ray of the stub | the new heart | keep (local, same view) |
| 637 | close on the stub → pull back over the regrowth | the whole new body | keep (continuous) |
| 751 | seabed → lab (cut) | a new time, the same animal again | keep (deliberate cut) |
| 859 → 0 | ending → opening | loop | camera, slug, path and neck state equal; checked on the seam frames |

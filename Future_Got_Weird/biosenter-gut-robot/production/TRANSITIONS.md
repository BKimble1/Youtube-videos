# V1 transition list (FGW standing rule)

Each transition is listed as: outgoing subject → incoming subject → the new information it brings → whether to keep,
merge or remove it.

| # | Time (s) | Kind | Outgoing → incoming | New information | Decision |
|---|---|---|---|---|---|
| 1 | 0.00 | (loop seam) | S7 closing crawl → S1 hook | none (the same crawl, the same camera) | Keep. It is one continuous shot over world time: S7 is the crawl just before frame 0. |
| 2 | 2.55–3.45 | camera push | S1 tunnel → S1 close on the head anchor | directs attention to the gripping mechanism | Keep. It is motivated by the next line, "tiny spikes". |
| 3 | 3.45 | **cut** | S1 head anchor (flat, extending) → S2 macro of the same anchor | the mechanism in close-up | Keep. A match on action: the brief asks for "CUT TO AN EXTREME MACRO", and it is the same anchor in the same state at the same world time. |
| 4 | 6.85–7.90 | pull-back (continuous) | S2 macro → S3 whole-robot cutaway | the full anchor, extend and release cycle | Keep. The camera pulls straight out of the macro, with no cut and no return. |
| 5 | 11.55–12.95 | zoom-out with handover | S3 cutaway → S4 pig diagram | scale: the real test was inside pigs | Keep. The 3D tunnel shrinks to a tube and hands over to the 2D intestine at the same place, width and angle (`pig.tsx` Z0, A0), then the pig is revealed. |
| 6 | 16.83 | **cut** | S4 pig diagram → S5 tool close-up | a new demonstration: biopsy and fluid delivery | Keep. A deliberate cut between separate demonstrations, timed on "It could". |
| 7 | 19.45 | **cut** | S5 gut → S6 lab bench | a new place: the device is a lab prototype | Keep. It is short, and the robot keeps moving. |
| 8 | 21.15 | **cut** | S6 lab → S7 gut tunnel | a return to the opening world (the future-use illustration) | Keep. It sets up the loop. |

**Removed.** There are no exterior → interior → exterior detours. The pig diagram is not left by zooming back in: the
film cuts on to the next demonstration, so no excursion returns to a previous subject without completing an
explanation.

**Technical checks.** The checks below are by construction, and are verified on the rendered file in
`qa/v1/render_qa.json` and the frame sheets.

- The macro and the cutaway share one world-time crawl, so the cut at 3.45 s and the pull-back never reset the
  robot's pose. The camera moves are C²-eased: there are no one-frame resets of scale or position.
- The zoom-out: the 3D camera's distance and the 2D diagram's zoom come from the same function (`zoomAt`), and the
  rotation eases from the tunnel's screen angle to 0.
- Captions are in screen space and never inherit a camera transform.

# Round four brief — "Future Got Weird — V3.1 final animation cleanup" (saved from the conversation; table and numbered sections preserved, wording lightly condensed where noted)

Execute a focused cleanup on the existing V3 Final project. The user authorised the changes below. Produce the cleaned exports; do not return an assessment, unchanged-file checksums or another proposed creative brief.

This prompt supersedes earlier transition instructions where they conflict. Preserve the selected story, opening premise, approved cast and palette, narration, factual wording, audio timing, ≈ 21-second runtime and the successful first/last-frame composition. Use the existing vector/Remotion assets and source. No full rebuild, new script, new narration, generative-video job or extra purchase.

## Baseline and scope
Episode `Future_Got_Weird/Shorts/ai-fake-murder-tip/`. Baseline exports: `FGW_AI_Fake_Murder_Tip_V3_Final_Captioned_1080x1920.mp4`, the clean master, the source composition and stems. Verify the actual V3 source commit/branch (do not assume V2's `70a6451`). Preserve V3 outputs and unrelated local changes; a separate cleanup branch is fine. The reviewed V3 file was 512×910, 30 fps, ≈ 21.01 s; render native 1080×1920 from source, not by upscaling. The audit examined sampled frames and dense transition sequences, **not** normal-speed motion or sound; implementation causes are hypotheses to check.

## Observed cleanup targets (approximate times)
| Interval | Visible issue | Required result |
|---|---|---|
| 1.95–2.30 s | The opener exits with partially cut headline lines; the new quote surface is briefly empty | Whole-group exit, clean paper/envelope handoff, prompt readable quote content |
| 4.95–5.20 s | The quote/checker handoff produces layered card edges and doubled-looking "Except…" | One shared quote card and one caption; clean foreground/background ownership |
| 5.30–6.40 s | Successive checking poses repeatedly reverse the hand's direction | One deliberate scan/tap, reaction, settled pose; no repetitive waving |
| 7.45–7.85 s | The descending checker/desk crosses the incoming "Claude did this" caption; outgoing paper/quote layers linger | Clear the character before the caption region is occupied; keep only the intended page prop |
| 11.20–11.45 s | Old badges, incoming police-system header, form and envelope are stacked, with abruptly clipped form edges | Clear old labels first; fold the paper into the envelope with intentional occlusion |
| 14.75–15.35 s | A large dark shape wipe and empty incoming paper | A restrained change to ink and a directly readable takeaway paper, preserving the spam outcome |
| 15.30–19.60 s (≈ 17.8 s) | "Matching" and its highlight extend beyond the right card border; a moving AI cursor tag covers the quote; multiple AI tags compete | Correct text/highlight bounds; route the cursor around the reading area |
| 20.10–20.45 s | Transparent quote text and card edges overlap the incoming "POLICE TIP" form during the return | A clean geometry/content handoff without ghosted typography |

Inspect the exact native frames before choosing implementation details. Do not invent additional defects.

## 1. Repair quote bounds and cursor occlusion first
One reusable quote layout across the evidence scene, checker scene and takeaway. Measure text after the production font loads; compute highlight bounds from the positioned word run. Keep the excerpt exactly: "I recall seeing someone matching the description…". Inner padding ≈ 28–36 px (account for stroke, shadow, highlight padding and glyph bounds); do not clip as a substitute for fitting; a font reduction ≤ ≈ 8 % is allowed, or an extra line / taller card; consistent modest highlight padding and radius; one fixed AI origin tag on the paper if useful, remove the duplicate moving tag where it would cover text; route the cursor outside the quote's text rectangle (it may approach the button below). Check the smallest (checker scene) and largest (ending) states.

## 2. Clean object handoffs instead of layered dissolves
Opening → quote (≈ 1.95–2.30 s): headline removed as one group over ≈ 5–7 frames; one opaque paper; clear the old form once the paper owns the shot; first phrase as the paper settles, remainder promptly, stable highlight on the narration; no long empty hold, no letter-by-letter typing.
Quote → checker (≈ 4.95–5.20 s): animate ONE quote-paper instance into the checker composition; checker and page may enter behind it, face readable when established; consistent border/corner; settle before the gesture.
Checker → webpage (≈ 7.45–7.85 s): source page is the continuity anchor; checker and desk leave inside the illustration region before the next caption; remove quote and stamp deliberately; one continuous transform into the carousel; if a downward exit can't stay clear, use a brief fade with small displacement.
Form → envelope (≈ 11.20–11.45 s): retire old badges first; keep the folding action but use the envelope's front as a physical occluder, not a rectangular crop; one coherent state at a time; nothing is delivered to an investigator.
Spam → takeaway (≈ 14.75–15.35 s): envelope stays contained in spam; clear the outcome props as a group and change to ink over ≈ 6–10 frames; no expanding dark shape; quote appears with the paper; an explanatory callback, not a new police event.
Takeaway → opening (≈ 20.10–20.45 s): retain matching first/last layout; morph an opaque surface while fading the quote text completely before the header and form lines appear; transform the existing button into the opening button; reveal the headline as one group; keep the last word intact and the length unchanged.
Aim for ≈ 6–10-frame transitions (a starting range); smooth monotonic easing for text/camera; props may settle once; evidence and captions don't bounce.

## 3. Simplify the checker's motion
Keep her appearance, proportions, cardigan, hair, glasses, pencil and larger staging. Replace the back-and-forth gesture with: short anticipation → one clear finger/pencil scan (or one tap) → brief stop and restrained eyebrow/eye reaction → the existing missing-description finding settling. Sensible pivots, connected sleeve geometry, consistent hand shape; nothing through the eyes or across the quote; no looped forearm oscillation; one natural blink if it fits; rest long enough to read after the finding. The stamp remains an editorial finding about the source webpage.

## 4. Captions independent of scene transitions
One authoritative caption layer tied to the existing alignment; first sentence integrated into the opener. No identical caption copies in outgoing and incoming scenes ("Except…"); captions outside scene scale/position/rotation/mask/opacity transforms; reserve their space through transitions; during ink/cream changes switch caption contrast at a defined point (no gray ghost); SRT unchanged unless audio changes. Inspect layout in a Shorts UI overlay without claiming real-app testing.

## 5. Bounded and reproducible
Existing SVG/vector/Remotion components; check shared transform origins, local vs global timing, nested scale, overlap, clipping, z-order, font readiness, frame-derived animation. Preserve narration, music, effects and mix timing; move an effect only if a changed contact makes it noticeably out of sync, and document it. Maintain duration and 30 fps; no extra frame rate, texture, glow, blur, shake, cuts or generative clips. Do not regenerate ElevenLabs narration or invoke denied upload/alignment tools.

## Verification and delivery
Render the affected intervals first; inspect every frame through the repaired handoffs at native resolution and in a phone-sized preview; recheck neighbouring frames; then render the full masters once. Required checks: no quote/highlight overflow, moving badge covering words, duplicate cards, double captions or ghosted old UI; no outgoing character crossing the caption area; opening premise and evidence preserved; first/last layouts still match (check the whole transition and loop); native 1080×1920, 30 fps, H.264/AAC, ≈ 21 s, full decode with zero errors; audio synchronised (remeasure if an effect moved; do not certify listening from measurements); source build/checks for the changed components.
Outputs (do not overwrite V3): `exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_{Captioned,Clean}_1080x1920.mp4`, `…_ReviewSmall_NOT_FOR_UPLOAD.mp4`, a matching SRT and updated cover from the unchanged opening, and `qa/v3_1_cleanup/QA_REPORT.md` (defect table, changes, checks actually performed, native frame evidence, checksum manifest, precise remaining limitations).
Handoff: actual baseline/new commit, implemented fixes, output paths, genuinely pending playback checks. Do not claim normal-speed watching, listening or real Shorts-app testing unless performed. Do not publish or propose another full version; this is the final bounded animation cleanup.

# Decision notes — V3 Final (one targeted hook / animation / sound pass on V2)

## Baseline
V2 verified before any change: branch `claude/ai-fake-murder-tip-short-v2`, commit `70a6451`, clean tree. V2 masters, stems (`audio/stems_v2/`), narration (`audio/narration_v2/`), assets, ledger and unrelated work are untouched; V3 work is on branch `claude/ai-fake-murder-tip-short-v3-final` with `V3_Final`/`_v3` names.

## Voice
Approved Test Voice take **retained, unchanged** (`narration_v2_final_48k.wav`, sha256 `6000cf2f…c658`, byte-identical to the V2 commit; only a 75 Hz high-pass in the mix). No new full take, no repair of the opening sentence, no time-stretch, no speed-up, no new cast, no new voice. Nothing in this environment can play audio, so no *listening* defect could be found; the take was therefore not touched. **No ElevenLabs operation was needed or attempted** (the connector's upload/finalize tools were denied earlier in this conversation; nothing was retried through another credential, browser, endpoint or account). **Runway: not used** (no paid generative video, 0 credits; output hosts remain blocked).

## Opening (frame 0 → ~2.2 s)
- Frame 0 already holds the entire premise: the three-line headline AI SENT POLICE / A FAKE / MURDER TIP. above a large simplified police form and an oversized AI cursor with a readable AI tag. No fade-in, no logo, no black.
- The headline *is* the caption of sentence 1: the full sentence is visible from frame 0, words brighten as they are spoken (AI saffron, POLICE teal on its word, FAKE coral with one pop), and no lane caption repeats it. The SRT keeps the exact text and timing (one cue, 0.10–2.30 s).
- Beats (frames at 30 fps): poised 0–4 (the cursor idles; the first word begins at 0.10 s), small pull-back f5–f9, strike f9–f12, contact f12 (0.40 s), SUBMIT depresses → SENT f15, the tip copy lifts f16, folds into an envelope with the small saffron AI corner mark f22–f28, the packet travels f38–f58 while the headline clears, opens toward camera f61, and the opened paper becomes the quote surface f64 (2.15 s).
- Cursor pose moved after review of the frame: the poised tip sits left of SUBMIT so the AI tag no longer covers the button label; the opening mask was enlarged so the tag is never cropped during the press.
- Critical content bounds for V3: x 96–876, y 240–1450 (was 100–870 / 220–1440). The Q3 claim card and its labels were moved/shrunk to stay ≥ y 240; the page-slot and strip, the B5 inbox/folder/filter slide-ins and the takeaway path are clipped to the column.

## Contradiction scene (B3)
No portrait box: a larger checker rig sits behind a desk, pulls the source page in beside the claim, scans with a pencil/finger, stops, lifts one eyebrow; checking begins on "Except…"; NO DESCRIPTION PROVIDED stamps at f194, 0.06 s before "no" (V2: f196, on "no"). The stamp was re-set after a full-resolution review of the encoded frames: V3's first draft clipped "NO DESCRIPTION" at the page edge and the resting forearm covered its left end — it is now a three-line label inside the page, and the hand rests lower-left on the desk. The label remains an editorial statement about the source page, not a "suspect description" form field.

## Context, outcome, takeaway
B4: a strip of three large webpage props, CLAUDE HAIKU 4.5 / WEBSITE TEST as subordinate chips, one REAL POLICE FORM cue. B5: the same AI-marked envelope into POLICE INBOX → SPAM FILTER → SPAM; the INVESTIGATORS tray stays empty and the dotted route stops short. B6: one invented-answer paper contained by a coral frame; the AI mark peels off into the cursor; a dimmed SUBMIT becomes enabled and a dotted path with the envelope leaves the paper's frame — a metaphor, not a lock bypass and not a claim about how any system's permissions work. The button is never pressed.
Loop: the layout morphs back to the opener's exact coordinates, the headline builds back over the last frames so frame 629 hands over to frame 0 without a pop, nothing is cut off, there is no outro.

## Colour decision
Saffron now means "AI / what the AI wrote" (cursor tag, corner mark, highlighted claim); teal = police; coral = fake/spam. V2 used saffron only on the highlighted claim and the pencil, so this widens its role deliberately; the pencil stays saffron (approved checker).

## Mix decisions (all objective; nothing was auditioned)
- Master unchanged: −15 LUFS integrated, sample-peak ceiling −1.9 dBFS, look-ahead limiter; the encoded AAC is measured, not the WAV.
- Music underlay calibrated to sit 3.0 dB further under the voice than V2 over the same speech windows (measured from the V2 stems); the master was not raised (stem gain +1.2 dB vs V2's +1.4 dB).
- Deeper pocket −38 dB (V2 −30 dB) from 4.80 s (0.14 s before "Except…") through the reveal to 7.39 s; the held note inside it is 3 dB quieter.
- Bed lowered a further 3 dB from the inbox (12.18 s) to just after "never" (14.84 s) and again from the takeaway start (14.78 s) to the end; the relief swell is 4 dB quieter than in V2; the bed fades to silence over the last 0.6 s (loop boundary).
- Ducking: derived from the narration, 40 ms look-ahead, 30 ms attack, 320 ms release (V2: none/20 ms/240 ms), up to −12 dB.
- Effects (seven, all relative to the voice RMS): UI click at contact (V1's ElevenLabs click, reused) + a very low tap, light paper at 0.69 s and 2.07 s (local synthesis), one dry stamp tap inside the 80 ms gap before "no", one muted folder thud, one tiny tick when SUBMIT is enabled. Removed vs V2: keyboard cluster, send accent, fold/page/hop ticks, latch click. Nothing at frame 0, no siren/gunshot/alert/riser/whoosh.

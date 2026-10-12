# Owner directive — single V4 final animation and pacing pass

Recorded from the owner's "Future Got Weird — Earth Stops V4 Final Animation and Pacing Prompt" (prepared 12 Oct 2026; updated to require continuous animation within shots and remove long narration gaps; baseline `BKimble1/Youtube-videos`, branch `claude/fgw-earth-stops-short`, V3 commit `243eb4d`). Summary of what it authorises:

- One **final animation and pacing revision** of V3, in a single autonomous pass, then one coordinated whole-film review cut; no per-shot approval gates; ordinary reversible problems corrected without asking. Not a new concept, a script rewrite or a generic speed-up.
- Preserve V3 (`243eb4d`) and the earlier checkpoints; keep `exports/v6/` intact; new composition and export set (`exports/v7/`); change only this episode (`Future_Got_Weird/Shorts/earth-stops/`); commit and push to the existing episode branch.
- Fix what the owner saw: the boat rises without moving convincingly with the water; some Earth shots linger; at least one consequence transitions away too quickly; **large pauses between narration phrases**; fast cuts feel inert when the focal subject holds one pose and only the background moves → continuous, evolving in-shot animation with one clear focal event at a time, especially the opening.
- A new narration take through the existing ElevenLabs connection (Test Voice), natural short breaths (about 0.1–0.3 s; longer only with dramatic purpose), no time-stretching or clipping of words; captions rebuilt from the actual voice timeline; `EQUATOR` on the first speed plate; reuse existing licensed/generated sound and the optional music stem; no new Runway or music generation; targeted generation only if essential.
- Target about 23–24 s as an editorial guide only (narration and complete actions determine the runtime); deliver the master, a labeled preview, silent picture, no-music mix, final SRT, relevant stems, reproducible source with lockfile, updated cue/storyboard records, a short V3 → V4 change log with final timecodes, QA notes that separate actual viewing/listening from measurements; verify durable preservation of the exports; no guaranteed-performance or final-publication-ready claims.

## What this does NOT authorise (and was not done)
Publishing, uploading, scheduling; pull requests; AI frame-voting, AI viewer subagents or fabricated viewer tests; any claim to have watched or listened; any publication, virality or final-ready claim; licensed/library music (none used or generated); new Runway generations (none run); changes to the Atlas or murder-tip projects (untouched).

## What was done
`V4_REPORT.md` (deliverables, V3 → V4 change log with final timecodes, brief-vs-built, creative assessment, spend, commits), `QA_NOTES_V4.md`, `script/*`, `credits.md`, `checkpoints/v6/CHECKPOINT.md`, `exports/v7/`, committed and pushed to `claude/fgw-earth-stops-short`.

## What the owner needs to do
See `PRODUCTION_STATE.md` ("Needs the owner").

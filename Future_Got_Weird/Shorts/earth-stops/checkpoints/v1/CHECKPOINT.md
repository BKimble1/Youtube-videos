# Checkpoint v1 — E-A opening, as first delivered

Preserved on request ("preserve the current version as a checkpoint") before any v2 work was added.

| | |
|---|---|
| Git commit | `0783b004586bef3f614ff65397cc55dff197a712` on `claude/fgw-earth-stops-short` |
| Git tag | `earth-stops-ea-v1` (annotated; same commit) |
| Restore everything as it was | `git checkout earth-stops-ea-v1` |
| Restore one file | `git show earth-stops-ea-v1:Future_Got_Weird/Shorts/earth-stops/<path> > <path>` |

## v1 deliverables (still at their original paths; untouched by v2: `git diff earth-stops-ea-v1 -- <path>` is empty)
| Path | sha256 |
|---|---|
| `FGW_EarthStops_EA_Opening_Silent_1080x1920.mp4` | `749ca0c81e40778a865920932d70a2849bd48c182779963d9d9ba9f1ff50a618` |
| `FGW_EarthStops_EA_Opening_SFX_1080x1920.mp4` | `edf240dba5a37eceacb73a2e3b7718872cb973f38f9e1b7d67a38e359c4d2215` |
| `exports/FGW_EarthStops_EA_Opening_Silent_NoMarker_1080x1920.mp4` | `3aa06f678438387c890c3271e58c022b9c8216fb7ae267bde66783a61f918d4b` |

v1 source (`source/src/opening/*`), tools (`tools/*_opening.*`, `probe_choreo.mjs`), audio (`audio/`), QA (`qa/QA_MEASUREMENTS.json`, `qa/AUDIO_MEASUREMENTS.json`, key frames, sheets, reviewer rounds) are all unchanged and still build: the only edit to shared files since the tag is additive (`source/src/Root.tsx` gained the v2 compositions).

Sanity check made after the v2 work: the `OpeningEA` composition still renders from the current tree; a frame-12 still differs from the delivered v1 mp4 by 3.6 (mean abs, 8-bit, 0.5 scale), the same order as the encode/scale noise of the identical check on v2 (2.9). That is not a bit-exact comparison; the tag is the exact record.

## Docs as they stood at the checkpoint (verbatim copies of the tagged files)
`README.md`, `PROTOTYPE_QA_REPORT.md`, `PRODUCTION_STATE.md`, `credits.md`, `OWNER_APPROVAL_PROTOTYPE.md` in this folder. The same-named files one level up have since been updated for v2.

## Why v1 was revised (owner's review, Oct 11, 2026)
"Its visible action can still read as an ordinary slip and coffee spill. 'Not an earthquake' is not enough to pass the hook test." Known v1 weaknesses that drove the v2 brief: front-facing rig, wasted sky/road, the coffee jet leaving the frame within about 2 frames (coffee-coloured pixels clipped at the frame edge on 34 of 75 frames), the rope-like beaded jet, only the hero and her coffee affected, a plateau after about 1.0 s.

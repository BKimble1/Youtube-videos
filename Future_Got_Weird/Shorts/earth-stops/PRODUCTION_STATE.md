# Production state — Earth Stops. You Don't. (opening prototypes: E-A v2 and E-C)

Branch `claude/fgw-earth-stops-short` (from Atlas tip `3634cc5`). **Two opening prototypes complete; awaiting the owner's own viewing, listening and decision. Not published. Not uploaded. Not scheduled. Full production is paused.** No pull request opened. v1 is preserved: commit `0783b00` (in the pushed branch history; a local tag `earth-stops-ea-v1` was created but the remote refused the tag push, so the commit hash is the reference), `checkpoints/v1/`.

## Done
- v1 (checkpoint): 2.5 s E-A opening, silent + procedural Foley.
- v2 revision per the owner's seven-point brief (`handoff/OWNER_APPROVAL_V2_REVISION.md`): side-view hero (same cast member; pose test vs the approved reference), recomposed street, tapered coffee stream with varied droplets, riderless bicycle vs anchored lamps/palm, camera-brake reveal at 0.67–1.13 s → **E-A v2**.
- Minimal **E-C**: globe spins and stops dead, then the same street scene continues; no extra loose object.
- Silent and procedural-SFX previews of both with exact export metadata (`exports/v2/EXPORT_METADATA.*`).
- Measured QA of both (`qa/v2/*.json`), all 75 frames of each encoded clip inspected as contact sheets, written comparison and recommendation (`PROTOTYPE_V2_REPORT.md`).
- Zero credits spent: no ElevenLabs generation (the Sound Effects node was not run), no Runway, no image generation. No AI frame-voting rounds in v2.

## Needs the owner (nobody has done these)
1. Watch both **silent** files on a phone, muted, at least twice each: what happened in the first second, which way is she going, why (slip / quake / something stranger), did the bicycle help or confuse (E-A v2), did the globe read as a cause or as an impact (E-C)?
2. Play both **SFX** files with sound (phone speaker and headphones): physical event or synthesis? E-C's planet-stop thump; E-A v2's missing audio marker at the brake.
3. Check the side-view hero against the approved cast (identity). The approved sheets have no side view; this is new, extrapolated artwork.
4. Check tag, mug, hero against the **current Shorts UI** overlay.
5. Say which Atlas/murder-tip files were actually uploaded (analytics and runtime conclusions stay conditional until then).

## Recommendation (provisional; the owner's viewing overrides it)
Lead with **E-C**, keep **E-A v2** as the fallback. E-A v2 is the better picture, but its first ~0.6 s still reads close to a slip and a spill and the stopped ground only becomes visible at ~1 s; E-C shows the premise in the first 0.3 s at the cost of a calm 0.3 s, a smaller hero and a mostly static globe. Details and numbers: `PROTOTYPE_V2_REPORT.md` §3–4.

## Decision requested
Reply with one of: **(a)** proceed with E-C (optionally with the three refinements in the report: shorter pre-roll, globe shrinks to a corner after the stop, bicycle added to the panel), **(b)** proceed with E-A v2, **(c)** a hybrid you specify, **(d)** neither / revise again. Only then: script, claim ledger and storyboard with the first line starting at frame 0 (e.g. "What if Earth stopped — right now?"), a Test Voice audition, the remaining beats (stop → one retained-motion explanation → latitude distinction → cup callback).

## Not authorised yet
Script, narration, music, Runway, the rest of the Short, publishing, further revisions beyond the decision above.

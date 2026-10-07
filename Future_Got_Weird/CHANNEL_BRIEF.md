# Future Got Weird — channel brief

Working name: **Future Got Weird**. Promise: **AI moves fast. We make it make sense.**
Created 7 October 2026 for the pass-2 rebuild of Video 01. This file and `STYLE_GUIDE.md` are the standing
decisions for every later episode. Change them deliberately, not per video.

## What the channel is

A lively, carefully sourced, fully animated briefing on what AI can now do, what actually changed, and what the
claims leave out. Two releases a week when the stories support it: one on the week's strongest verified change,
one on a surprising capability or an enduring mechanism. Episodes run about 5–8 minutes; Video 01 runs 4:41.

The audience follows technology but does not want a lecture or a stream of launch announcements. Wonder is
earned by evidence. Humour comes from visual incongruity, dry observations and callbacks, never from sneering.

## Standing rules (apply to every public deliverable)

1. **Anonymity.** Nothing public identifies the owner: no name, face, voice clone, school, portfolio, personal
   links, personal channel, or earlier brands. Audit narration, imagery, titles, thumbnails, subtitles,
   descriptions, end cards and export metadata before upload. Internal repository paths may keep production
   history, but public copy never links to them. Researchers and public figures may be named.
2. **Fully animated.** No presenter footage and no synthetic host. Real screenshots, documents and
   demonstrations are incorporated into the animation as evidence props.
3. **Evidence on screen is genuine.** Real crops, one purposeful highlight, enough reading time. Editor marks
   are visibly overlays. Published model answers are labelled as published excerpts. Reconstructed interfaces
   are never presented as captures. Toy numbers, simplified diagrams and demonstrations are labelled.
4. **Dates and versions.** Name the exact model/version and date of any test. Distinguish announcement date,
   measurement date and publication date. A company demo is a company claim until reproduced. Historical
   examples are labelled historical.
5. **No intent claims.** Models are described as optimised and evaluated, not as lying or deciding. A fictional
   clerk's pose is a teaching device, not evidence about a chatbot's motives.
6. **Sources in the description.** The full bibliography, URLs, page references and licence credits live in
   the upload description and the source ledger, not in persistent on-screen footers. A short integrated label
   such as "Published test · May 2025" is fine on screen. Required attributions are satisfied tastefully.
7. **Humour budget.** Three or four short dry beats per episode, spread out, at least one visual callback.
   No laugh track, no meme sounds, no cutaways unrelated to the subject, no snark loop.
8. **Correction log.** Keep an internal correction log per episode (`qa/CORRECTIONS.md`), and update the
   description when a correction is public.

## Production system

Every release needs: a title/thumbnail promise, a cold open that delivers it, a claim-to-source ledger, final
narration, a storyboard tied to the spoken script, an inspected render, SRT subtitles, an upload description,
and reproducible source. Reuse production components; give each story its own scenes.

| Stage | Tooling (as of Video 01 pass 2) |
|---|---|
| Script | `script/narration_segments.json` is the single source of narration text; blocks group segments for performance |
| Narration | ElevenLabs connector (Flows), Eleven v4, voice **Marcus K** (`3H55HGnNE1XjYxigHSAS`); forced alignment with Scribe on the pinned generation (0 credits in this workspace); takes cut into segments by `tools/el_assemble.py` |
| Timing | `tools/build_timeline.py` writes `source/src/data/timeline.json`: scene, segment and word frames; every animation cue is `at('segment', 'word')` |
| Animation | Remotion 4 / React / TypeScript; original SVG cutout cast and prop library (`source/src/components`) |
| Sound | Six ElevenLabs effects from pass 1 plus new prop sounds (stamp, token click, drawer, fanfare, cart, paper slide); original FluidSynth score; `tools/mix.py` to about −16 LUFS / −1.3 dBTP |
| Render | 1080p30 H.264 (CRF 16, x264 slow), BT.709, AAC 320k, fast start; optional native 4K at `--scale=2` |
| QA | Check frames at cues, determinism repeats, scene-boundary bursts, motion clips, phone-size crops, loudness and intelligibility metrics; the human watch-through list in `qa/QA_REPORT.md` |

The restricted ElevenLabs connector has no music, image or video generation. Music stays original (FluidSynth)
unless the full connector is added. Voice stays Marcus K unless an audition exposes a limitation.

## Voice and tone of the narration

Conversational, curious, a little amused, specific. Short sentences. A pause before a reveal. Jokes delivered
flat. No movie-trailer register. Pronunciations are set in the script with IPA (`Kalai` = kuh-LIE).

## Names considered

Future Got Weird (working). Alternatives: Future, Apparently · The Next Weird Thing. Handle availability is
not established.

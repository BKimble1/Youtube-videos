# FGW Starship Dual Catch — V5 change and QA note

**Not published.** Nothing was uploaded, posted or sent; title and thumbnail unchanged
("SpaceX Wants to Catch Its ENTIRE Rocket" / "BOTH?!").

## Deliverables

| File | Facts |
|---|---|
| `exports/FGW_Starship_Dual_Catch_V5_FINAL_REVIEW_1080p.mp4` | 1920×1080, 30 fps, H.264 + AAC 320k, **4:08.17** (V4: 4:10.73). Checksummed parts in `backup/v5/`. |
| `exports/FGW_Starship_Dual_Catch_V5_PUBLISH_MASTER_4K.mp4` | 3840×2160, 30 fps, rendered from composition `MainV5` at `--scale=2` (vector scenes drawn at 4K; footage scaled from its source). Not an upscale of the 1080p file. Master: x264 CRF 14 (521 MiB). The copy sent in chat is `exports/deliver/` — the same render re-encoded at CRF 17 (365 MiB) to fit the 400 MiB upload limit; use the CRF 14 master for publishing. |
| `captions/FGW_Starship_Dual_Catch_V5.srt` | 86 cues, regenerated from the V5 word timings; no line over 42 characters. |
| `qa/v5/FGW_Starship_Dual_Catch_V5_END_FRAME.png` | Last frame of the review render (the 4K end frame is `..._END_FRAME_4k.png`). |
| `script/v5_narration_final.md` | Final narration with V5 timecodes. |

Exports are Git-ignored (size); everything else, including all source and tools, is committed on branch
`claude/magical-hypatia-r5eybj`.

## Narration (no new generation)

No ElevenLabs request was made in V5. `tools/v5_build_voice.py` is the V4 assembly with three sentences removed at
word boundaries in the silence between sentences (12 ms fades) and two holds changed:

| Removed (V4 time) | Sentence |
|---|---|
| 3:41.61 | "So watch the final seconds differently." |
| 3:56.51 | "That's the sequence SpaceX wants to complete with both stages." |
| 4:00.47 | "The first catch brought the booster home." |

Holds: 1.0 s after "The engines have turned and slowed the ship." (the upright rotation completes in clear air) and
2.4 s after "…the tower takes the load." (load, engine shutdown, settle). Everything up to 3:41 sits at the same
time as in V4 (source-to-output map: identical through S8; S9_01 3:44.40 → 3:41.61; S9_04 3:51.81 → 3:49.17; closing
line 4:02.97 → 3:54.07). End screen 3:53.17–4:08.17 (15.0 s), with the closing line spoken over it and the score
resolving after it.

## What changed in the pictures

**Opening (0:00–0:25)**
- Starts on the real Flight 5 catch already in progress, cropped tighter. No intro or fade.
- 2.7 s: straight cut to the pointed ship already descending on its engines toward open arms. V4's empty tower and
  delayed ship fade-in are gone. The camera settles onto the ship as it brakes and the arms close in, ending centred
  at the size and position the next shot uses.
- 6.1 s: matched cut to the same ship, upright in space. It pitches belly-first, its black heat shield turns to
  the camera and entry glow builds.
- 8.5 s: two large side-by-side views of the same arms, sequenced. "1 · BOOSTER" is caught first; "2 · SHIP, AFTER
  ITS FLIGHT" follows. The vehicles are about 1.4× larger than in V4.
- Real stack and separation footage is kept, with labels pointing at their stages.
- 19.6 s: the camera pushes from the incoming ship to its support fitting over the rail. On "Miss badly" a 1.25 m
  sideways error carries the fitting to the rail's inner edge (red ring), then alignment is restored. The descent
  and push continue throughout, so there is no static hold. No crash is shown.

**Mechanism (0:25–1:00)**
- Real catch → drawn contact, unchanged.
- The geometry comparison on "aren't crushing" is kept.
- The drum now actually settles onto the two shelves with a small damped seat. The shelves dissolve (0.45 s) into
  the rails in the same screen positions.
- B7 ends with the motion damped out, the booster settling onto the rails, the arms closing, and the engines
  stopping after contact.

**Reentry and broadside (1:00–1:31)**
- The orbital shot ends pushing into the heated tiles, which dissolve into the real plasma footage. The tiles,
  flap and broadside detail alternate as in V4.

**Support to rail, 1:47.5–1:52.9**
- The repeated medium tower hover is replaced by the support-region close-up (the opening's framing), with three
  distinct phases:
  1. the sideways offset closes on "position";
  2. the lean straightens on "orientation";
  3. the sink rate bleeds off on "motion", and the fittings seat on "reach".
- The rails and truss then light as they carry the load, and only then do the engines stop.

**Machinery and handoff (1:53–2:21)**
- Real carriage footage → drawn chevron brace. The arms swing, then the camera rides the carriage as it travels
  about 22 m up and back on the mast, with the bracing sliding past.
- The yellow load path is unchanged: truss → carriage → mast legs → ground ellipse.
- Footage 07 is now cropped to the grid fin, with no labels. The "QD ARM" label is removed. The arm comparison is
  drawn instead: current arm tip (yellow) against the older length (dashed white), closer than in V4.
- "One supported structure" is now a completed handoff at mechanism scale: support seated → arms take the load →
  engines stop 0.25 s later → a few-centimetre settle. The camera only eases; the retreating wide shot is gone.

**Drift, tilt, too fast (2:21–2:46)**
- All four demonstrations now share one view, looking down the arms (the shelf view), and one safe reference: the
  baseline's seated ship, kept as a faint outline.
  - Drift: the ship comes down offset; one fitting finds nothing (red X) and that side drops; it then lifts and
    recentres.
  - Tilt: one rail carries the load alone (red ring and arrow).
  - Too fast: wide-spaced red marks against the teal baseline marks, then a hard stop with flex, shake and an
    impact ring at the rails.
- Then from the rail down the tower to the mount and the farm, as before.

**Decision and Flight 6 (2:46–3:08)**
- The corridor is now seen from a fixed "tripod" eye behind the pad looking out to sea. The shoreline runs across
  the frame and the ship comes toward the camera and grows.
- The engine and ground details and the historical Flight 6 divert are unchanged.

**Recovery and reuse (3:09–3:38)**
- Order kept: recovery → inspection (the real Ship 40 tiles) → preparation/goal. No changes beyond timing.

**Final handoff (3:38.7–3:53.2), rebuilt.** Seen from the beach side, the ship never crosses the tower silhouette.

| Time | What happens |
|---|---|
| 3:41.6 "heat shield has done its job" | Close on the tiled underside as the glow fades. |
| 3:43.8 "flaps have controlled the descent" | Broadside close on the aft flaps working. |
| 3:45.9 "engines have turned…" | Camera pulls back. The ship relights well out over open ground, about 110 m beyond the arms and 150 m above them, and rotates upright over 1.5 s with the tower small and separate. |
| — | Upright descent toward the open ends of the arms. In the last 1.15 s before contact the ship slides about 30 m inward through the gap between the two arms while descending its final 12 m. The hull stays in the gap; it is never over or through the tower. |
| 3:49.2 "supports meet" | Contact, with consistent arm order (near arm in front). |
| "tower takes the load" | Rails and truss light. |
| 0.1–0.55 s after "load" | Engines shut down. A small damped settle follows; the ship stays supported. |
| — | Camera eases out. The end-screen panels fade in over the finished scene, with ship and tower in the gap between them. |

## Scenery and pad (render-integrity fixes)

**Vertical step, root cause.** The V4 "step" had two shared causes:
- Corridor cameras looked along the shoreline, which ran down the line of sight.
- Ground and sea polygons clipped at the near plane projected to coordinates around 10⁹ px, which Chromium's SVG
  rasteriser drew as stray vertical bands/walls.

**Fixes, all in shared code:**
- `cam3.ts` `projPoly` now clips every projected polygon to a screen rectangle (`clip2D`).
- The ground and sea planes are 5×10⁵ m.
- The corridor cameras face inland or out to sea.
- No view checked shows a band, exposed edge or stepped water.

**Pad reference basis: Pad 2, from the release footage 06 (wide Pad 2), 04 (aerial) and 10 (tower close-up).**
- The three SpaceX reference photo URLs in the brief, and SpaceX's site, were blocked by the session's network
  policy, so they could not be inspected.
- Rebuilt (`site.tsx`):
  - eight-leg launch mount on a pedestal with a flame plate (replacing V4's stool);
  - flame trench running seaward;
  - irregular apron;
  - coast road, service road and beach track;
  - meandering drainage channels;
  - distant industrial clusters;
  - low-vegetation patches;
  - pipe rack;
  - farm order matching 06: farm → tall tank → stack → tower.
- Checked from a wide, a medium catch, a low/base and an aerial angle (`qa/v5/lab/sheet.jpg`). This is an
  illustration of the layout relationships, not a survey; no dimensions are claimed.

## QA (measured on the rendered files)

| Check | 1080p review | 4K master |
|---|---|---|
| Streams | h264 1920×1080 30/1, AAC 48 kHz; 248.17 s | h264 3840×2160 30/1, 7445 frames, AAC 48 kHz; 248.17 s |
| Loudness / true peak | −15.0 LUFS / −1.7 dBTP | −15.0 LUFS / −1.7 dBTP |
| Black stretches (≥0.25 s) | none | none |
| Static stretches (≥1.5 s) | 2:30.1 (1.7 s, one-sided load held while "…changing how the load is shared"), 3:12.2 (1.6 s, ship seated in the arms), end screen 3:53.9 onward (intended). The 0:22.6 hold found in the first render was fixed. | same, plus 0:47.3 (1.6 s, booster seated on the rails after the transfer) |
| End-screen panels | mean abs. difference entrance vs last frame: 0.06 / 0.02 (of 255), so stationary | 0.03 / 0.002 |
| Audio silences ≥1.5 s | none | none |

- Speech band: voice over music+effects median +14.1 dB. The lowest 1-second window (−5.1 dB) is at 1:23, in the
  pause after "still working." under the corridor wind, not under a word.
- Join strips (every 2nd frame) for every real/drawn boundary, plus D6, E6, the finale relight, the contact, the
  load/shutdown and the end-screen entrance, are in `qa/v5/review/`.
- Half-resolution motion previews of the opening, 1:44–2:21 and the finale were rendered and inspected as
  contact sheets before the full render. Faults found and fixed:
  - O2 too wide;
  - O9 too static;
  - E2 too wide;
  - E5 comparison too small;
  - E6 too small;
  - finale camera spline overshoot that pushed the ship off-frame;
  - relight too small.

## Publishing gate

| Gate | Evidence | Status |
|---|---|---|
| Click promise / opening | Real booster catch at 0:00. Planned ship catch at 0:02.7 with no empty-tower delay. Both stages identified large and sequenced by 0:12.9. Musk, Oct 20 and Flight 15 are in the narration and the tag. | Pass on production checks; CTR not inferable |
| Movement and transitions | Opening, mechanism, failure demos and finale rebuilt as begin → change → result: seat, load, then shutdown. Matched cuts: O2→O3, shelves→rails, tiles→plasma, chevron→carriage. No whip pans, spins or glitch effects. | Pass (checked on contact sheets, not normal-speed viewing) |
| Pad/site accuracy | Basis named above (Pad 2; footage 06/04/10). Wide, medium, low and aerial angles inspected. Stool mount replaced. | Pass within the limits of blocked photos |
| Render integrity | Near-plane band fix in shared code. No stepped water or exposed edge in the inspected frames. Ship never crosses the tower in the finale. Arm order consistent. | Pass on inspected frames |
| Comprehension | Contact regions are framed at mechanism scale. Labels limited to stage IDs, source credits, one "SUPPORT FEATURE" tag, the word "CLEARANCE" in the geometry comparison, the OCT 20 · FLIGHT 15 tag and the Flight 6 date. QD label removed. | Pass |
| Finished delivery | 1080p review, 4K master from the composition, SRT, 15 s stationary end screen, this note. | Pass |

## Limitations, stated plainly

- **Listening was not available.** No subjective listening pass happened. Audio checks are measurements only:
  loudness, true peak, speech-band ratio, silence detection and cue placement against word times.
- **No normal-speed viewing.** Motion was checked from contact sheets (2.5–4 frames per second, and every second
  frame at joins), not by watching playback.
- **Pad photos blocked.** The pad rebuild could not be compared with the brief's photographs; footage 06, 04 and
  10 were the reference.
- **Production checks only.** No claim is made about CTR, retention or perfection; these are production checks
  only.

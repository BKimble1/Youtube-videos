# Future Got Weird · Video 01 · Final polish and 4K delivery

(The owner's brief for the final pass, as given; the repository owner name is omitted.)

The current Video 01 V2 is almost finished, and I like its animations. Complete one restrained final polish pass and deliver an upload-quality 4K film. Execute the work through delivery; do not stop after a plan or sample. Preserve the original illustrated style and the good work already done. Use the existing Claude/Remotion/ElevenLabs production system for this episode. We will introduce the expanded generative-video workflow on Video 02.

## 1. Establish the actual baseline and preserve it

Read the repository instructions and attached Future_Got_Weird_Project_Brief.md. My instructions here supersede older rebuild instructions and older duration measurements.

- Repository: the existing YouTube-videos repository. The V2 source was found on branch `claude/new-session-96c7w8`, in `Future_Got_Weird/Video_01_V2`. Verify the latest state and use the source matching the review, including any newer authorized work. Do not target the separate on-camera photolithography project or the older dark AI-confidence cut.
- Approved review: `Future_Got_Weird_Video_01_V2_1080p_REVIEW_chat.mp4`, approximately 4:48.24, 1920×1080, 30 fps. Its metadata identifies Remotion 4.0.533. The chat copy is compressed; use editable source and original audio/assets for production.
- The V2 subtitles match this approximately 4:48 timeline. Some repository documents, including the carried-over FINAL_SCRIPT.md and frozen V2_STATUS.md, describe an earlier script or unfinished production stage. Establish current truth from the matching source, timeline, selected audio, and render, then update documentation. A stale status file is not a reason to discard current work.
- Preserve the baseline and uncommitted work before edits. Keep existing dependencies and lockfile unless an actual blocker requires a change. Make the final polish recoverable and distinguish it from the approved V2.

## 2. Scope: finish the film without redesigning it

Keep the existing story, cast, costumes, palette, environments, metaphors, jokes, transitions that work, and approximate 4:48 runtime. Keep 30 fps. Preserve the selected V2 Test Voice narration and its timing unless you find a specific audible defect or factual error that requires a selective repair. Verify the voice selection from the actual records; do not revert to Marcus K, introduce a replacement voice, or regenerate the whole narration for novelty.

Do not rebuild every scene, add Runway shots to this episode, add a synthetic presenter, or add a new visual identity. Do not materially shorten or pad the film. Improve only identifiable defects and a small number of clear opportunities. Intentional holds are useful; a minimum movement quota is not the goal.

The opening, “Very professional. Very fictional,” the confident-font joke, the game show/trophy reversal, and the final two-question evidence check are useful parts of the film to retain.

## 3. Inspect and make targeted visual corrections

First inspect the current rendered intervals and the corresponding source. The timecodes below are approximate locations, not instructions to blindly change every shot. Resolve the exact moments against the final timeline.

| Interval | Final-pass job |
|---|---|
| 0:00–0:27, answer counter | Preserve the hook and physical stamps. Ensure the false title/year details are easy to identify through selective emphasis or a short enlarged excerpt. Do not turn the answer slips into additional paragraphs or require viewers to read the entire card. |
| 0:44–1:27, token machine | Check the full camera paths and the focus of the selected token. Keep necessary labels visible while they are being explained. Strengthen clarity only where needed. Several crops are intentional pans and transitions; do not flatten useful camera direction because a single sampled frame looks cropped. Keep probabilities clearly labelled illustrative. |
| 1:27–2:03, library | Inspect drawer construction, hand contact, layers, and readable title assembly. Make a few small improvements to anticipation, reaching/selecting, presentation, or reaction if they demonstrably improve the action. Preserve the existing library and clerk; avoid a wholesale acting overhaul. |
| 2:03–2:27, actual record | Make the actual thesis title, 2001 date, and university easy to follow. Preserve the genuine document and the confident-font joke. Check source crops at 4K and phone width. |
| 2:27–3:15, game show | Preserve this sequence. Check the displayed +1/0/0 rule, the change to −1 for wrong answers, scores 6 and 7, the calculation 6 + 1 − 3 = 4, and the trophy transfer. Rolling numbers can have transitional states; judge the settled result and timing rather than calling intermediate digits errors. |
| 3:15–3:34, benchmark evidence | Preserve authentic Table 2 and its historical context. Ensure the visual hierarchy foregrounds 9/10 and no credit for abstention. Reduce competing annotation only where it impairs understanding. The full table can establish provenance before a focused crop. |
| 3:34–4:13, help and verification | Preserve the distinctions among retrieval, reasoning, consistency, and correctness. Improve low-contrast pale labels/panels in the verification machine where necessary. Make the active document, source-exists result, and claim-fails result unmistakable. |
| 4:13–4:48, payoff/end card | Preserve the callback and two checks. Keep the planned twice-weekly message consistent with the channel brief. Check clean ending, useful end-screen space, source-credit message, and final audio tail. |

Across the film, inspect text overlap, clipping of essential information, hand/prop intersections, masking, character proportions, awkward layer order, unintended flashes, abrupt resets, shimmer, striation patterns, and camera paths. Keep deliberate focus changes and purposeful crops. For small screens, the essential point must read; the entire source document does not have to be readable simultaneously. Give highlighted evidence time to settle.

## 4. Audio, research, and packaging

Listen to the complete selected audio where playback is genuinely supported. Check Kalai's pronunciation, word endings, joins, breaths, the opening, technical passages, joke timing, and the final line. The review file measured about −16.04 LUFS integrated and −1.30 dBTP; those measurements look sensible and do not establish performance or music balance. Keep the current mix if it works. Repair specific masking, clicks, cuts, or mismatched effects. Use restrained effects tied to physical action; avoid adding a whoosh to every transition.

If playback is unavailable, explicitly say so and provide a short, timecoded listening checklist for me. Do not claim that transcripts, stills, or loudness measurements constitute a full audiovisual review.

Verify the script's consequential claims against primary sources while retaining the existing accurate explanation. The original 2025 paper supports the three dissertation answers and the sampled benchmark table. Keep model names, May 9, 2025 test date, no-web-search condition, and mid-2025 benchmark sample clear. Do not imply these historical tests describe the latest models. Retain the “one explanation, not the whole story” qualification and distinguish confident wording from a calibrated confidence measurement. Preserve the CMU title-page evidence.

Update the description's references to include the later Nature publication, while retaining the original preprint as the source of the specific historical example/table. This does not require rewriting the episode around the newer paper:

- Original paper: https://arxiv.org/html/2509.04664v1
- Actual thesis: https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-01-132.pdf
- Later publication: https://www.nature.com/articles/s41586-026-10549-w

Match FINAL_SCRIPT.md, captions, chapters, title, thumbnail, description, credits, and status to the actual final film. Keep public content and custom export metadata anonymous, with no owner identity or personal-project branding.

## 5. Render 4K from the source

Create a true 3840×2160 output by rendering the editable composition at that resolution. Do not feed the compressed 1080p review MP4 through an enlargement or AI-upscale pass and call that the source render.

The inspected Root.tsx registers `Main` at 1920×1080/30 fps with mixed audio; `Preview` is muted. Remotion's server-rendered `--scale=2` can render the original text/SVG geometry at 4K while preserving the designed coordinates. Prefer this over simply changing the canvas dimensions and breaking the layout. Verify the current source before using this known composition/entry point.

Audit raster assets at their largest on-screen size. Re-extract genuine PDF pages at adequate resolution where needed; do not fabricate, redraw, or use generative sharpening to invent evidence. Address any Canvas/WebGL backing resolution separately if present. 4K output dimensions do not add detail to a low-resolution embedded image or video.

Upload master settings: MP4, H.264, progressive 30 fps, 3840×2160, SDR BT.709, yuv420p, approximately 40 Mbps target video bitrate, AAC-LC stereo at 48 kHz/384 kbps, and fast start. YouTube recommends 35–45 Mbps for 2160p SDR at 24/25/30 fps. Use PNG frame capture for the final render to avoid the source config's intermediate JPEG compression and improve color handling. Do not set CRF and target video bitrate together. Bitrate mode is a target, not a promise that the measured average will equal 40 Mbps for simple animation.

Starting command, run from the matching `source` directory after confirming the entry point, composition, mix, installed CLI options, and output path:

```bash
npx remotion render src/index.ts Main ../exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4 --scale=2 --codec=h264 --video-bitrate=40M --audio-codec=aac --audio-bitrate=384k --pixel-format=yuv420p --color-space=bt709 --image-format=png
```

Tune render concurrency to the available machine. Preserve the existing working browser setup. Avoid software upgrades or infrastructure migrations for this pass unless required. If a documented flag is unsupported by the pinned version, use the equivalent supported configuration and record it.

Also produce a high-quality 1080p review from the same final source. Keep filenames unmistakable so I upload the 4K master. Do not make a sub-30-MB transfer cap dictate the master quality. Preserve selected audio/stems separately; an additional mezzanine video is optional, not a blocker to delivery.

## 6. Verify, save, and hand off

Run the existing appropriate source checks. Inspect the complete final visual timeline and risky moves in dense frame sequences; perform normal-speed audiovisual playback where available. Review representative shots at actual 4K crop detail and at phone width. After fixes, rerender and recheck affected intervals and neighboring transitions. Keep a short defect log and stop once the targeted defects are resolved; do not reopen approved scenes indefinitely.

Verify the exported file's actual dimensions, 30 fps, codecs, color metadata, audio presence, duration, synchronization, loudness, and true peak. Fully decode the file to check corruption. Captions must match the final selected audio. Numerical checks supplement visual/listening review.

Deliver:

1. `Future_Got_Weird_Video_01_V3_4K_MASTER.mp4` — final YouTube upload file.
2. `Future_Got_Weird_Video_01_V3_1080p_REVIEW.mp4` — convenient review file.
3. Matching final SRT, updated script/description/chapters/source credits, and the selected upload-ready thumbnail.
4. Editable source, lockfile, actual render command, selected narration/mix/stems, concise change log, and honest QA notes.

Commit and push the authorized source changes to the existing YouTube repository, preserving unrelated work. Save large exports in durable storage that I can access, with checksums and recovery instructions if split transfer is necessary. A Git source commit alone does not back up the master. Do not leave the only copy in a temporary workspace, commit credentials, or publish to YouTube.

Finish with links/paths to the deliverables, what changed, actual export properties, what was inspected, any precise unresolved checks, and which file I should upload. Complete everything you can without repeated confirmations. Stop only for genuinely unavailable access or a consequential decision you cannot resolve from the instructions.

Official export references:

- https://www.remotion.dev/docs/scaling
- https://www.remotion.dev/docs/cli/render
- https://support.google.com/youtube/answer/1722171

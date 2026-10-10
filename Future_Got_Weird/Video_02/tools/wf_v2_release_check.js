export const meta = {
  name: 'v02-v2-release-check',
  description: 'Video 02 v2: release check of the fixed render: defect closure, seams and regressions, sound and captions; a skeptic writes the closing QA log',
  phases: [
    { title: 'Check', detail: 'three independent checks of the release candidate' },
    { title: 'Close', detail: 'skeptic verifies every open item and writes REVIEW_V2_R2.md' },
  ],
}

// args: { film: 'exports/...mp4' }
const V = '/home/user/Youtube-videos/Future_Got_Weird/Video_02'
const FILM = `${V}/${args.film}`
const OUT = `${V}/qa/v2/review_r2`

const RESULT = {
  type: 'object',
  properties: {
    check: { type: 'string' },
    performed: { type: 'string', description: 'exactly what was looked at and measured, and what could not be checked' },
    items: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string', description: 'a V2-R1-NN id, or NEW-NN for a new issue' },
      status: { type: 'string', enum: ['closed', 'partly', 'open', 'regressed', 'new'] },
      severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'polish'] },
      scene: { type: 'string' },
      frames: { type: 'string' },
      evidence: { type: 'string' },
      note: { type: 'string' },
    }, required: ['id', 'status', 'severity', 'scene', 'frames', 'evidence', 'note'] } },
  },
  required: ['check', 'performed', 'items'],
}

const COMMON = `PROJECT: Video 02 of the anonymous channel Future Got Weird, "How Cameras See Around Corners", v2 re-edit (never put anything about the channel owner in any output). RELEASE CANDIDATE to check: ${FILM} (1920x1080, 30 fps, final mix). It was rendered after the one correction cycle that worked the 44 verified defects in ${V}/qa/v2/REVIEW_V2_R1.md (defects list: ${V}/qa/v2/review_r1/defects.json; fix-round reports and evidence under ${V}/qa/v2/fix_r1/). TIMING CHANGED since the r1 render: the pause after s37 ("U.") grew from 1.2 s to 4.0 s, so every frame from V6's U hold onward is 84 frames later than the r1 log's numbers; V1-V5 frame numbers are unchanged. Locate beats by scene and cue words using ${V}/source/src/data/timeline.json (scenes, segments, word frames). Governing documents: ${V}/v2/REVISION_BRIEF.md, ${V}/v2/SHOTPLAN_V2.md, ${V}/v2/EVIDENCE_BRIEF_V2.md, ${V}/v2/SCRIPT_V2.md. Captions: ${V}/script/subtitles_v2.srt.
TOOLS: dense sheets \`python3 ${V}/tools/qa_dense.py ${FILM} ${V}/source/src/data/timeline.json <out> --fps 3 [--only V1,V2]\`; frames \`ffmpeg -v error -ss <s> -i ${FILM} -frames:v 1 <png>\` (frame N at N/30 s); phone view \`-vf scale=390:-1\`; bursts \`-vf fps=10\`; audio \`ffmpeg -i ${FILM} -af ebur128=peak=true -f null -\` and numpy. Write everything under ${OUT}/<your check>/ (PNG and MP4 there are not committed; JPG sheets and .md/.json are). Judge by looking at the images you make. Nobody can listen here: never claim to have heard anything.`

const CHECKS = [
  { key: 'closure', prompt: `CHECK: defect closure. For EVERY one of the 44 defects in defects.json, find the beat in the new render (adjusting frames as above) and decide closed / partly / open / regressed, with evidence (frame or burst paths). The fix reports say these were left partly fixed by design: V2-R1-12 (the uh-oh sting still overlaps "place." at -6 dB), V2-R1-28 (the closed scroll is alone about 0.37 s before the shelf arrives), V2-R1-38 (the readout inset is 22% of the frame width, not 25%); confirm their current state. Package/caption/claims items (V2-R1-03, -15, -41, -42, -43, -44): check ${V}/package/description.txt, ${V}/package/UPLOAD_PACKAGE.md, the SRT and ${V}/research/claims.csv. V2-R1-44 (v2/QA_V2.md missing) will be written by the lead at the end: mark it open with that note.` },
  { key: 'seams', prompt: `CHECK: seams and regressions across the whole film. The scenes were fixed in seven separate copies and merged, so look hardest where groups meet: burst every scene boundary (V1→V2 ... V12→V13) at 10 fps over ±1 s and confirm the hand-offs (V2→V3 paint frames 4+4 with grain; V4→V5 ring at (960,520) r 90; V6→V7 scroll at the same place; V8→V9 plan; V9→V10 match to the real board; V10→V11 card partition → warehouse corner; V11→V12 hard cut on the same screen x; V12→V13 hard cut). Then read dense sheets of the whole film at 2-3 fps for pops, flashes, resets, layering errors, frozen holds over 2.5 s outside the end screen, labels in the caption band (y 950-1080) or outside the safe area, and anything a first-time phone viewer would stumble on (sample at 390 px: the opening 0-35 s densely, then at least two frames per shot). Measure the end-screen guides on a full-res frame (video x 1000-1800, y 290-740; subscribe disc centre (430,600), diameter 300) and confirm the end screen lasts 10 s. Report only real, located issues.` },
  { key: 'sound_captions', prompt: `CHECK: sound and captions, by measurement. Measure the encoded file's integrated loudness, true peak and LRA (targets -16 to -14 LUFS, <= -1 dBTP). Decode the audio and check: the U payoff (music resolve on the end of "U.", no new notes under the roll-up, see ${V}/audio/music/v02v2/MUSIC_NOTES.md), the end-screen swell starting after "corner." ends, the two softened lifts under n02 "Not a photograph." and s15 "In this capture, hundreds of times weaker.", the dry silence under the J4 hold, the re-cued effects (V1 readout beep -8 dB; V3 mirror slide covering the travel; V5 pencil tap on the pointer stop and uh-oh after his face drops; V11 robot motor ducked under n30) against picture contacts, and the effects listed in ${V}/audio/mix/v2/audio_qc.json as within 3 dB of speech (identify each from ${V}/audio/sfx/v2/placed.json and say whether it masks a word). Captions: compare subtitles_v2.srt word for word with the script, check in-times against word frames (should lead by about 2 frames), line length <= 42, reading speed <= 20 cps, no cue merging two lines of narration, no break inside a phrase.` },
]

phase('Check')
const checks = await parallel(CHECKS.map(c => () =>
  agent(`${COMMON}\n\n${c.prompt}\n\nReturn the structured result.`, { label: `check:${c.key}`, phase: 'Check', schema: RESULT })))

phase('Close')
const close = await agent(`${COMMON}\n\nYou are the SKEPTIC closing the v2 QA. Three checks of the release candidate are below. Re-verify yourself every item that is not "closed" (open, partly, regressed, new) by extracting and looking at the frames or re-measuring, and every "closed" verdict for the three major defects (V2-R1-01, -02, -03). Then write ${V}/qa/v2/REVIEW_V2_R2.md: the render checked; a table of all 44 r1 defects with final status and evidence; any new issues with severity, frames, evidence and a concrete fix; the measured loudness, true peak and LRA; the acceptance questions of the brief answered again for this render; and "what was and was not checked" (be exact: no listening was possible). Also write ${OUT}/status.json ({closed, partly, open, regressed, new_issues:[{id, severity, scene, frames, fix}]}). Return a short summary: counts, every remaining item with severity, and whether anything is a blocker or major that should be fixed before the masters are rendered.\n\nCHECKS:\n${JSON.stringify(checks.filter(Boolean), null, 1)}`, { label: 'close:skeptic', phase: 'Close' })
return { checks: checks.filter(Boolean).map(c => ({ check: c.check, n: c.items.length })), close }

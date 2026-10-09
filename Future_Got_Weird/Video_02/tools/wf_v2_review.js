export const meta = {
  name: 'v02-v2-review',
  description: 'Video 02 v2: full-film review of the complete render through five lenses, then a skeptical verification and one defect log',
  phases: [
    { title: 'Review', detail: 'five independent lenses on the same render' },
    { title: 'Verify', detail: 'one skeptic re-checks every finding against the frames and writes the defect log' },
  ],
}

// args: { film: 'exports/...mp4', round: 'r1' }
const V = '/home/user/Youtube-videos/Future_Got_Weird/Video_02'
const FILM = `${V}/${args.film}`
const R = args.round || 'r1'
const OUT = `${V}/qa/v2/review_${R}`

const FINDINGS = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    checks_performed: { type: 'string', description: 'exactly what you looked at and measured, and what you could not check' },
    findings: { type: 'array', items: { type: 'object', properties: {
      title: { type: 'string' },
      scene: { type: 'string', description: 'V1..V13 or "global"' },
      frames: { type: 'string', description: 'global frame range, e.g. 1830-1876' },
      severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'polish'] },
      category: { type: 'string' },
      evidence: { type: 'string', description: 'what you saw or measured, with the paths of the images you made' },
      fix: { type: 'string', description: 'the concrete fix you recommend' },
    }, required: ['title', 'scene', 'frames', 'severity', 'category', 'evidence', 'fix'] } },
    strengths: { type: 'string' },
  },
  required: ['lens', 'checks_performed', 'findings', 'strengths'],
}

const COMMON = `PROJECT: Video 02 of the anonymous channel Future Got Weird, "How Cameras See Around Corners", v2 re-edit (never put anything about the channel owner in any output). The complete v2 render to review: ${FILM} (1920x1080, 30 fps, with the final mix). Governing documents: ${V}/v2/REVISION_BRIEF.md (the owner's brief and its acceptance questions), ${V}/v2/SCRIPT_V2.md (final script; ${V}/v2/script_v2.json), ${V}/v2/SHOTPLAN_V2.md (picture plan), ${V}/v2/EVIDENCE_BRIEF_V2.md (what may be shown and said about real results), ${V}/research/claims.csv. Timing: ${V}/source/src/data/timeline.json (scenes V1-V13, segments, word frames). Captions: ${V}/script/subtitles_v2.srt.
TOOLS: dense contact sheets with spoken words: \`python3 ${V}/tools/qa_dense.py ${FILM} ${V}/source/src/data/timeline.json <out_dir> --fps 3 [--only V1,V2]\`; single frames: \`ffmpeg -v error -ss <seconds> -i ${FILM} -frames:v 1 <out.png>\` (frame N is at N/30 s); phone view: add \`-vf scale=390:-1\`; bursts: \`-vf fps=10\` over a short range; audio: \`ffmpeg -i ${FILM} -af ebur128=peak=true -f null -\` and numpy on a decoded WAV. Put everything you make under ${OUT}/<your lens>/. Read the images you make: your judgement must come from looking, not from code. Nobody can listen to audio in this environment: never claim to have heard anything; audio findings come from measurements and from comparing cue frames to picture.
SEVERITY: blocker = wrong fact, broken evidence firewall, unreadable key teaching moment, visible glitch that breaks the film; major = a clear defect a first-time viewer would notice or that weakens a brief requirement; minor = noticeable on attention; polish = nice to have. Report only real, specific, located defects (with frames). Do not invent problems to fill a quota; do not re-litigate the script's wording unless it is factually wrong or contradicts the evidence brief.`

const LENSES = [
  { key: 'phone_viewer', prompt: `LENS: first-time viewer on a phone. Watch the whole film as a curious adult who has never heard of non-line-of-sight imaging, at 390 px wide, first with sound off (pictures and on-screen text only), then reading the captions/script alongside. Answer the brief's acceptance questions 1, 2, 3, 5, 6, 9 with evidence (frames): by 10-15 s can you say what surprising result is shown and which part is real evidence; by 30 s why arrival time carries hidden-side information and why a timing sensor is needed; can the key diagrams and labels be followed at 390 px without pausing; is the reconstruction revealed alongside the geometry; is the history brief and useful; does the ending deliver one payoff and a functional end screen. Then list every moment that is confusing, too dense, too small, too fast to read, or a dead hold, with frames.` },
  { key: 'picture_a', prompt: `LENS: picture director for V1-V6 (frames from the timeline). Check every shot against SHOTPLAN_V2.md: the teaching visual per beat, label sizes (64 px key labels in the first minute and on evidence boards, measured on full-res frames), at most three teaching labels at once in the first minute, the caption band (y 950-1080) clear, the safe area, matched transitions at every scene boundary (V1→V2 match across the cut-in, V2→V3 paint, V3→V4, V4→V5 ring match, V5→V6 hard switch, V6→V7 roll-up) using frame bursts around each cut, character acting (anticipation, contact, settle; hands touch; feet plant; gaze), pops/flashes/resets, layering errors, light paths never crossing the partition, and dead holds. Use dense sheets for V1-V6 and 10 fps bursts at every cut and every contact.` },
  { key: 'picture_b', prompt: `LENS: picture director for V7-V13 (frames from the timeline). Same checks as a picture director: every shot against SHOTPLAN_V2.md, label sizes and counts, caption band and safe area, transitions at every boundary (V6→V7 roll-up, V7→V8 spotlight, V8→V9 card into plan, V9→V10 match to the real board, V10→V11 card partition into the warehouse corner, V11→V12 hard cut on the same screen x, V12→V13 hard cut), acting quality and contacts, sliding feet, pops/flashes/resets, layering, light paths around shelving and the partition, dead holds, and the end screen: measure the video-element guide (x 1000-1800, y 290-740) and the subscribe disc (centre 430,600, diameter 300) on a full-res frame and confirm nothing else intrudes; confirm the end screen lasts 10 s and the guides are clear from its first frame.` },
  { key: 'accuracy', prompt: `LENS: accuracy and evidence. Check every on-screen label, number and chip, and every spoken line (captions), against the evidence brief and claims.csv: the R8 track uses stored estimates, is labelled "sped up" every time it plays, never shows the guesser on it, and its conditions sit beside it in V10; the R10 waveform and U keep the 3x3-zone context and are never placed in our room or next to the kit sensor; the R1 separate test uses the generic person and a neutral sensor; I1 numbers appear only on our plan marked illustrative and are internally consistent (8.9 ns / 2.65 m there and back / 1.33 m each way; 1 ns ≈ 30 cm of travel, there and back ≈ 15 cm farther); no "first" claim for 2026; the 2021 cheap-sensor precedent is credited; no claim that it prevents collisions; the software-check chip uses the narrow wording; analogies labelled. Also check the captions file against the script word for word, and package/description.txt and package/UPLOAD_PACKAGE.md against the evidence brief and the film (and that nothing identifies the channel owner).` },
  { key: 'sound_sync', prompt: `LENS: sound and sync (measurement only; nobody can listen here). Measure the film's integrated loudness, true peak and loudness range with ffmpeg ebur128 (target -16 to -14 LUFS, true peak <= -1 dBTP); decode the audio and measure: speech-to-music and speech-to-effects ratios per scene; the 11 moments ${V}/audio/mix/v2/audio_qc.json lists as effects within 3 dB of speech (2.8, 107.0, 110.6, 110.8, 237.3, 237.4, 291.4, 297.5, 297.7, 307.9, 311.2 s): which effects they are (${V}/audio/sfx/v2/placed.json) and whether any masks a word; whether each effect lands on its picture contact (sample at least 25 physical events across all scenes: compare the cue frame in placed.json with the frame where the contact happens in the picture, using bursts); whether the music's drops and lifts (${V}/audio/music/v02v2/MUSIC_NOTES.md, plan.json) land on the intended picture moments (the real board's cut, the bump, the U, the board's return, the J4 stop, the end-screen resolve); any audio discontinuity at scene cuts; and caption timing (subtitles_v2.srt) against the word frames in the timeline (offsets, cue lengths, line lengths <= 42 chars, reading speed). Report concrete problems with times and frames.` },
]

phase('Review')
const reviews = await parallel(LENSES.map(L => () =>
  agent(`${COMMON}\n\n${L.prompt}\n\nReturn the structured result.`, { label: `review:${L.key}`, phase: 'Review', schema: FINDINGS })))

phase('Verify')
const all = reviews.filter(Boolean)
const synth = await agent(`${COMMON}\n\nYou are the SKEPTIC and editor of the review. Five reviewers looked at the same render through different lenses; their structured findings are below. For EVERY finding: re-check it yourself against the frames (extract the frames or bursts it cites and look), and decide CONFIRMED (real, as described), PARTLY (real but different or smaller than stated), or REJECTED (not real, misread, or contradicted by the documents), with a one-line reason. Merge duplicates. Assign each confirmed or partly finding a final severity, the owning scene group (G1 = V1,V2; G2 = V3,V4; G3 = V5,V6; G4 = V7,V8; G5 = V9; G6 = V10,V11; G7 = V12,V13; or "lead" for audio, captions, package, global), and a concrete fix. Write ${V}/qa/v2/REVIEW_V2_${R.toUpperCase()}.md (a readable defect log: a summary table, then each defect with id V2-${R.toUpperCase()}-NN, scene, frames, severity, evidence image paths, fix, verdict; then the rejected list with reasons; then each lens's "checks performed"; then the acceptance questions with answers) and ${V}/qa/v2/review_${R}/defects.json (array of {id, group, scene, frames, severity, title, fix, verdict}). Return a short summary: counts by severity and group, and the three most important defects.\n\nFINDINGS:\n${JSON.stringify(all, null, 1)}`, { label: 'verify:skeptic', phase: 'Verify' })
return { reviews: all.map(r => ({ lens: r.lens, n: r.findings.length })), synth }

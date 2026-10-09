export const meta = {
  name: 'v02-v2-fix',
  description: 'Video 02 v2: the one correction cycle: a fixer per scene group works its verified defects in an isolated copy, then an independent verifier checks every fix and looks for regressions',
  phases: [
    { title: 'Fix', detail: 'one fixer per scene group, own work copy' },
    { title: 'Verify', detail: 'independent verifier per group: each defect fixed, no regressions, contracts held' },
  ],
}

// args: { groups: ['G1', ...], defects: {G1: ['V2-R1-02', ...]}, extra: {G1: [{id, fix}]} }
const V = '/home/user/Youtube-videos/Future_Got_Weird/Video_02'
const LOG = `${V}/qa/v2/REVIEW_V2_R1.md`
const SCENES = { G1: 'V1, V2', G2: 'V3, V4', G3: 'V5, V6', G4: 'V7, V8', G5: 'V9', G6: 'V10, V11', G7: 'V12, V13' }
const CROSS = {
  G1: 'V2-R1-02 is shared with G2: you own the V2 side (end the push so the paint first fills the frame no earlier than 4 frames before the V2→V3 cut; give the in-paint frames visible paint grain or the bump-edge section so they read as wall paint). The contract stays: V2 ends on exactly 4 frames of paint, V3 opens on the same paint.',
  G2: 'V2-R1-02 is shared with G1: you own the V3 side (V3 opens on at most 4 frames of the same paint as G1 draws, with the same grain or bump-edge section; the pull-back starts by V3\'s 5th frame; the question title fades in only once the room is visible). Coordinate by matching G1\'s paint drawing: read work/F1/source/src/scenes/V2_LongWay.tsx when it changes, or draw the same grain from a shared deterministic seed you both document in your reports.',
  G3: 'V2-R1-01 is shared with G4 (V2-R1-28): you own the hold. The timeline now gives V6 a 2.7 s pause after s37 ("U."): hold the complete board (36/36, "rough outline", pointer tap) for at least 2.5 s after "U." ends, start the 36-position build on "here\'s" (n13) if that helps, and roll the board up only at the end of V6. The roll-up contract with V7 is unchanged (ScrollRoll at cx 960, cy 430, len 560, r 46 on V7\'s wall colour for the last 6 frames).',
  G4: 'V2-R1-28 is shared with G3: G3 now holds the U longer and rolls it up at the very end of V6. On your side, start the tilt toward the shelf in V7\'s first frames so the rolled board does not float alone on blank blue (the shelf should be arriving within about 0.2 s of the cut). The contract frame (identical scroll at the same place on V7\'s first frame) is unchanged.',
  G5: '', G6: '', G7: '',
}

const groups = args.groups
phase('Fix')
const results = await pipeline(groups,
  (g) => agent(`You are the FIXER for scene group ${g} (scenes ${SCENES[g]}) of the v2 re-edit of "How Cameras See Around Corners" (anonymous channel Future Got Weird; never put anything about the channel owner on screen). This is the ONE focused correction cycle the owner's brief allows: fix exactly the verified defects listed below, without redesigning anything else and without regressions.

Read first: ${V}/SCENE_BRIEF_V2.md (your rules: same ownership: edit only your scene files and your prefixed src/components/v2s/V<n>_*.tsx files; never import the v1 scene files), the defect entries named below in ${LOG} (each has what the frames show, evidence image paths under ${V}/qa/v2/review_r1/, and the fix), ${V}/v2/SHOTPLAN_V2.md for your scenes, and ${V}/source/src/components/v2k/KIT_V2.md.

Your copy: ${V}/work/F${g.slice(1)}/source (fresh from the main source after the lead's fixes). IMPORTANT timing change since the review render: the s37 pause is now 2.7 s (was 1.2 s), so every frame from V6's U hold onward is about 45 frames later than the frame numbers in the defect log; V1-V5 frames are unchanged. Always locate beats by scene, shot and cue words, not by the log's frame numbers. The kit's evidence-card corner tag ("sped up") is now 40 px (lead fix); check it still fits your boards.

YOUR DEFECTS (all of them must be fixed): ${JSON.stringify(args.defects[g])}
ALSO YOURS (lead items that live in your scene files): ${JSON.stringify(args.extra[g])}
${CROSS[g]}

Method: for each defect, render the frames it cites (adjusted) BEFORE you change anything and confirm you see it; fix it; render again and confirm it is gone at full size and at 390 px wide; then check that nothing nearby changed for the worse. Keep every hand-off contract in SCENE_BRIEF_V2.md / tools/wf_v2_scenes.js (re-measure the first and last frames of your scenes). Keep module-load checks passing; \`npx tsc --noEmit -p .\` must pass. Render your scenes' half-res clips and dense sheets at the end (tools/scene_clip.sh <copy> <SCENE> ${V}/qa/v2/fix_r1/${g}/clip_<SCENE> 0.5) and read them. QA output folder: ${V}/qa/v2/fix_r1/${g}. Do not commit.

Return: for each defect id: what you changed (file and what), the before/after evidence paths, and its status (fixed / partly / not fixed and why); contract numbers re-measured; any new issue you noticed but did not fix.`, { label: `fix:${g}`, phase: 'Fix' }),
  (report, g) => agent(`You are the independent VERIFIER for scene group ${g} (scenes ${SCENES[g]}) after the fix round of the v2 re-edit of "How Cameras See Around Corners". Read ${V}/SCENE_BRIEF_V2.md, the defect entries in ${LOG} for ${JSON.stringify(args.defects[g])} and ${JSON.stringify(args.extra[g].map(e => e.id))}, and the fixer's report below. The fixed copy is ${V}/work/F${g.slice(1)}/source (frames after V6's U hold are about 45 later than the log's numbers because the s37 pause grew to 2.7 s).

For EVERY listed defect: render the relevant frames/bursts yourself (full size and 390 px wide) and decide FIXED / PARTLY / NOT FIXED with evidence. Then look for REGRESSIONS: render your scenes' half-res clips with dense sheets (tools/scene_clip.sh ... ${V}/qa/v2/fix_r1/${g}/verify_<SCENE> 0.5), read every sheet, check the hand-off frames at both edges against the contracts, label sizes and the caption band, light-path legality, contacts and feet, pops/flashes/resets, and the SFX cue sheet (sounds on contacts, trimmed vocabulary). If anything is not fixed or regressed, FIX IT yourself in the same files (same ownership rules), re-render and verify; \`npx tsc --noEmit -p .\` must pass. Do not commit.

Return: a table of defect id → final status with evidence path; regressions found and fixed; contract numbers; anything still open.

FIXER'S REPORT:
${report}`, { label: `verify:${g}`, phase: 'Verify' }).then(v => ({ g, fix: report, verify: v })),
)
return results.filter(Boolean)

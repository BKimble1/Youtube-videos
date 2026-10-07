export const meta = {
  name: 'video-frame-review',
  description: 'Independent per-act review of rendered frames against script, sources and design rules',
  phases: [{title: 'Review', detail: 'one reviewer per act + one story/pacing reviewer'}],
}

const ROOT = '/home/user/Youtube-videos/AI_Confidence_Video_01'
const acts = args.acts // [{id, from_s, to_s, sheets:[...], lines:[{id,t,text}]}]

const SCHEMA = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          time: {type: 'string', description: 'm:ss.s timestamp from the sheet label'},
          severity: {type: 'string', enum: ['high', 'medium', 'low']},
          category: {type: 'string', enum: ['accuracy', 'readability', 'layout', 'sync', 'consistency', 'pacing', 'empty-or-frozen', 'other']},
          description: {type: 'string'},
          suggested_fix: {type: 'string'},
        },
        required: ['time', 'severity', 'category', 'description', 'suggested_fix'],
      },
    },
    strengths: {type: 'array', items: {type: 'string'}},
  },
  required: ['issues', 'strengths'],
}

const COMMON = `
You are a demanding finishing editor reviewing a rendered 1080p explainer, "Why AI Sounds Right When It's Wrong" (draft narration voice; the small "DRAFT · TEMPORARY VOICE" corner label is intentional).
You review STILL FRAMES only (1 frame per second, in timestamped 3x3 contact sheets; the yellow label is the time). You cannot hear audio; the narration text with start times is given so you can judge whether visuals match what is being said at that moment.
Design rules: deep navy background; warm-white text; TEAL = supporting info/evidence; CORAL = the mistaken detail, always with a text label; illustrative numbers must be labelled illustrative/analogy; every evidence shot carries a small source line bottom-left; real documents must be readable when they matter.
Accuracy rules: read ${ROOT}/research/sources.md, especially the sections "The selected hallucination example" and "Things we must not claim". Flag anything on screen that contradicts them (model/date mislabels, implying same model across experiments, unlabeled illustrative numbers, overclaiming).
Report concrete, fixable problems: typos, wrong/inconsistent labels, text overflow/clipping/overlap, unreadable small text that matters, elements that appear too early/late relative to the narration, empty or visually stagnant stretches (>4 s with nothing changing), confusing visuals, and anything that would embarrass a careful creator. Do NOT report the draft-voice label, and do not invent problems: if a frame looks right, say nothing about it. Use exact timestamps from the sheet labels.
Return structured output.`

phase('Review')
const reviews = await parallel(
  acts.map((a) => () =>
    agent(
      `${COMMON}
YOUR ACT: ${a.id} (${a.from_s}s–${a.to_s}s). Contact sheets (Read each image): ${a.sheets.join(', ')}.
Narration lines in this act (start time → text):
${a.lines.map((l) => `${l.t}  ${l.id}: ${l.text}`).join('\n')}`,
      {label: `review ${a.id}`, phase: 'Review', schema: SCHEMA},
    ),
  ).concat([
    () =>
      agent(
        `${COMMON}
YOUR SCOPE: the whole film's story, pacing and visual variety. Look at the FIRST sheet of every act and the last sheet of the final act: ${acts.map((a) => a.sheets[0]).join(', ')}, ${acts[acts.length - 1].sheets.slice(-1)[0]}. Also read the full script at ${ROOT}/script/FINAL_SCRIPT.md.
Judge: does the opening deliver the title's promise within ~10 s; is a basic answer established within the first minute; does each act have a purpose; is there visual monotony; does the payoff answer the opening question; anything confusing for an ordinary viewer or imprecise for a technical viewer. Keep issues concrete and fixable.`,
        {label: 'review story+pacing', phase: 'Review', schema: SCHEMA},
      ),
  ]),
)
return acts.map((a, i) => ({act: a.id, ...(reviews[i] || {issues: [], strengths: ['REVIEWER FAILED']})})).concat([{act: 'story', ...(reviews[acts.length] || {issues: []})}])

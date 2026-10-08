export const meta = {
  name: 'v02-narration',
  description: 'Generate Test Voice narration takes (4 per section) on ElevenLabs and force-align every take with Scribe',
  phases: [
    { title: 'Generate', detail: 'one agent per batch of sections: TTS (4 takes), then Scribe alignment per take' },
  ],
}

// args: { flow_id, voice_id, model_id, batches: [[{id, prompt}, ...], ...] }
const A = args
const RESULT = {
  type: 'object',
  properties: {
    sections: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      tts_node_id: { type: 'string' },
      tts_session_ids: { type: 'array', items: { type: 'string' } },
      generation_ids: { type: 'array', items: { type: 'string' } },
      durations_s: { type: 'array', items: { type: 'number' } },
      asset_node_ids: { type: 'array', items: { type: 'string' } },
      stt_session_ids: { type: 'array', items: { type: 'string' } },
      stt_completed: { type: 'array', items: { type: 'boolean' } },
      credits_reported: { type: 'string' },
      errors: { type: 'string' },
    }, required: ['id', 'tts_node_id', 'tts_session_ids', 'generation_ids', 'durations_s', 'asset_node_ids', 'stt_session_ids', 'stt_completed', 'credits_reported', 'errors'] } },
  },
  required: ['sections'],
}

const brief = (batch) => `You operate the ElevenLabs connector to record narration for an animated explainer. Load the tools first with ToolSearch: "select:mcp__ElevenLabs__creative_generate_speech,mcp__ElevenLabs__creative_get_flow_run_status,mcp__ElevenLabs__creative_add_flow_asset_node,mcp__ElevenLabs__creative_transcribe_audio".

All work goes on the existing flow_id "${A.flow_id}". Voice: Test Voice, voice_id "${A.voice_id}". Model: "${A.model_id}".

For EACH section below, in order:
1. Call creative_generate_speech ONCE with flow_id, model_id "${A.model_id}", voice_id, generations_count 4, and prompt EXACTLY as given (keep the square-bracket delivery tags, IPA between slashes, ellipses and line breaks; do not edit a single character). Context: "Video 02 narration section <id>". NEVER call it a second time for the same section, even on an error: a second call charges a second generation. If it errors, record the error and move to the next section.
2. Poll creative_get_flow_run_status with the returned flow_id and ALL returned session_ids, waiting about poll_after_seconds between polls (do something cheap in between; do not spin), until all_completed or has_failures. Record node_id, the session_ids in the order returned, the generation ids in the same order, and each generation's duration_secs. Record any credit/price numbers reported.
3. For each completed generation, in take order t1..t4: call creative_add_flow_asset_node with flow_id, modality "audio", generation_id, label "<section>_t<k>"; then call creative_transcribe_audio with flow_id, model_id "eleven_scribe_v1", connect_from [that asset node id], context "align <section>_t<k>". Do NOT retry a transcription call either.
4. Poll creative_get_flow_run_status for the transcription session_ids until completed (the result includes per-word timestamps; you do not need to copy them, the tool result itself is collected later from the session log). Record the transcription session ids and whether each completed.
Return the structured result for every section in this batch. Be precise with ids: copy them exactly from tool results.

SECTIONS (JSON):
${JSON.stringify(batch, null, 1)}`

phase('Generate')
const res = await parallel(A.batches.map((b, i) => () =>
  agent(brief(b), { label: `narr:batch${i + 1}:${b.map(s => s.id).join(',')}`, phase: 'Generate', schema: RESULT })))
return res.filter(Boolean).flatMap(r => r.sections)

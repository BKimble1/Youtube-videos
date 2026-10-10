# Narration provenance

- Voice: ElevenLabs **Test Voice**, voice_id `kk5XaSLo2XAw0sKM98zU` (category "generated", description "Test Voice For Youtube."). Verified by `creative_list_voices` in the connected account on 10 Oct 2026. Not a clone claim; no owner name exposed.
- Model: `eleven_v4` (available in this workspace per `creative_get_flow_node_types`). Connector exposes no stability/style sliders for the speech call, so account defaults were used. No bracketed audio tags were inserted; pacing came from punctuation and paragraph breaks.
- Text sent: the locked narration from `handoff/02_SCRIPT.md`, spoken text only, 88 words, nine paragraphs.
- Takes: one call, two variations (A 33.72 s, B 34.19 s). Both had the same paragraph pause structure. **Take A** was selected: shorter, fewer dead gaps, measured -18.2 LUFS / -1.1 dBFS sample peak (pre-mix). Take B was not used and is not shipped.
- Flow: https://elevenlabs.io/app/flows/bjF1cVMrp6xZ97kE83vP (generation id of selected take `cD5bBXxTV085T9CKx524`).
- Alignment: ElevenLabs Scribe (`eleven_scribe_v1`) on the selected take. Transcript matched the script word-for-word (88/88), which is a proxy for correct pronunciation of "Boston Dynamics", "Atlas's", "thirteen", "actuators". Scribe word ends are padded to the next word, so sentence-end times were cross-checked against `ffmpeg silencedetect` on the file (`measured_voice_ends_seconds`).
- **Not auditioned.** Nobody on this session has listened to the performance; tone/dryness/naturalness is unverified.
- Files: `narration.mp3` (as delivered, 44.1 kHz mono 128 kbps), `narration_48k.wav` (48 kHz mono PCM, used in the mix), `narration_alignment.json`.

# Provenance

- **Style/rig source:** the Death Clock V4 Short in this repository (Remotion project, `Head`/`Hand`/`Limb`/`Capsule`/`Inked`, caption component, camera layers). Reused and extended (see `source/src/art/Head.tsx`: flip, hair styles, glasses, underlay/overlay).
- **Narration:** ElevenLabs `eleven_v4`, voice "Test Voice" `kk5XaSLo2XAw0sKM98zU` (the Death Clock narrator), only the `[interested]` audio tag, default settings otherwise. Selected take C1, generation `KSIjaftv2hgtDOjMINqr`, flow `C7YtngsgBvJsYtNKWBXa`. 12 takes kept in `audio/narration/takes/` with `TAKES_ANALYSIS.json`. Used exactly as generated (no cutting, stretching or pitch change); converted to 48 kHz 24-bit mono and padded with silence to 30 s. Voice identity was compared to the Death Clock narration by measured pitch and spectral centroid only. Credits spent: not recorded in this session.
- **Word times:** ElevenLabs Scribe, corrected with measured silences in `tools/build_voice.py` ("thought." and "seamlessly—until").
- **Music and effects:** synthesised in numpy by `tools/build_audio.py`; no samples, no third-party audio.
- **Video:** drawn in SVG/React; no generative video, no Runway, no footage, no Neuralink/Telepathy or other logos.
- **Fonts:** as used by the Death Clock project; licence terms were not re-verified here.

## V2 additions
- Narration: unchanged. `audio/v2/stems/narration.wav` is the C1 take (generation `KSIjaftv2hgtDOjMINqr`, voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, `[interested]`) times one constant gain, trimmed to 28.0 s (residual −58 dB against the take; SHA-256 of the mp3 `058baa00…945ac`). No new generation was made, no credits spent in V2.
- Art: all new V2 art is drawn in code (SVG/React) in `source/src/v2/art/`; it reuses the Death Clock rig libraries already in this project (ink, shade, limb, hand) and the receiver, room and caption components of R1.
- Sound: synthesised again in numpy by `tools/build_audio_v2.py` (no samples). Music partials sit on the 1/28 Hz grid so the 28 s loop is exactly periodic.
- No Runway or other generative video was used.

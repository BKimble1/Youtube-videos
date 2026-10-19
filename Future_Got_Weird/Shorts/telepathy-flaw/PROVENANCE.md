# Provenance

- **Style/rig source:** the Death Clock V4 Short in this repository (Remotion project, `Head`/`Hand`/`Limb`/`Capsule`/`Inked`, caption component, camera layers). Reused and extended (see `source/src/art/Head.tsx`: flip, hair styles, glasses, underlay/overlay).
- **Narration:** ElevenLabs `eleven_v4`, voice "Test Voice" `kk5XaSLo2XAw0sKM98zU` (the Death Clock narrator), only the `[interested]` audio tag, default settings otherwise. Selected take C1, generation `KSIjaftv2hgtDOjMINqr`, flow `C7YtngsgBvJsYtNKWBXa`. 12 takes kept in `audio/narration/takes/` with `TAKES_ANALYSIS.json`. Used exactly as generated (no cutting, stretching or pitch change); converted to 48 kHz 24-bit mono and padded with silence to 30 s. Voice identity was compared to the Death Clock narration by measured pitch and spectral centroid only. Credits spent: not recorded in this session.
- **Word times:** ElevenLabs Scribe, corrected with measured silences in `tools/build_voice.py` ("thought." and "seamlessly—until").
- **Music and effects:** synthesised in numpy by `tools/build_audio.py`; no samples, no third-party audio.
- **Video:** drawn in SVG/React; no generative video, no Runway, no footage, no Neuralink/Telepathy or other logos.
- **Fonts:** as used by the Death Clock project; licence terms were not re-verified here.

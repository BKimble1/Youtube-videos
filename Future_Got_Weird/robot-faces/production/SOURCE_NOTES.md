# Source notes and evidence ledger: Robots Are Learning to Copy Our Faces (V1)

## What could and could not be inspected in this session

This session's network policy blocked every research host. Direct requests returned a proxy 403 for:
- engineering.columbia.edu and news.columbia.edu;
- creativemachineslab.com (lab page and the author-hosted PDF);
- generalroboticslab.com (another PDF copy);
- doi.org;
- datadryad.org;
- techxplore.com;
- youtube.com.

The fetch tool could not resolve those hosts either. Only the web-search tool worked, so:
- **The original paper, its page-three figure and the demo videos were not opened.** No footage is used. Every
  demonstration in the film is a clearly labelled illustration.
- The facts below come from search-result summaries of the Columbia releases and press coverage. They agree with the
  creator's brief.
- The robot's appearance follows the brief's description of the paper figure: a blue soft face, a mechanical support
  and underlying components. One press caption calls the skin "lilac", so the film uses a blue-violet. Its exact
  shape and its colour were not checked against the images.

## Sources

- Columbia Engineering, "A robot learns to lip sync" (Jan 2026):
  https://www.engineering.columbia.edu/about/news/robot-learns-lip-sync
- Columbia Engineering, "Robot, can you say 'cheese'?" (Mar 2024):
  https://www.engineering.columbia.edu/about/news/robot-can-you-say-cheese
- Lab methods and media: https://www.creativemachineslab.com/lipsync.html
- Author-hosted paper: https://www.creativemachineslab.com/uploads/6/9/3/4/69340277/lipsync_sciencerobotics.pdf
- Hu et al., "Learning realistic lip motions for humanoid face robots", *Science Robotics* (Jan 2026),
  doi:10.1126/scirobotics.adx3017
- Hu et al., "Human-robot facial co-expression", *Science Robotics* (Mar 2024), doi:10.1126/scirobotics.adi4724

Coverage seen through search results (secondary):
- Scientific Frontline (dated 14 Jan 2026);
- TechXplore (Jan 2026);
- New Atlas;
- PopSci ("out-smile you by 840 milliseconds");
- ScienceDaily (27 Mar 2024);
- ISPR (3 Feb 2026).

## Claim ledger (narration → support → how it is staged)

| Narration claim | Support (as reported) | Staging and limits |
|---|---|---|
| Columbia engineers built a flexible robotic face with twenty-six motors | Columbia: a head with 26 small motors under flexible silicone skin | Label "26 motors in the face · a few shown here". The x-ray shows a representative set, not 26 parts. |
| It practised in front of a mirror, relating motor commands to appearance | Lip-sync release: the robot first learned its own face by watching itself in a mirror | Mirror scenes are labelled "Illustration". There are three selected trials and a strip saying "… many more trials". No claim about duration. |
| Flexible skin moves differently from a rigid part | General engineering point in the script | A diagrammatic skin lattice and a rigid-link card. No measured deformation is implied. |
| It learned from videos of humans talking and singing, including hours of YouTube footage | Lip-sync release: hours of YouTube video of people speaking and singing | Generic video player with no logo. The mouths are drawn, not real footage. |
| Linked to the robot's model of its own face; speech audio drives coordinated lip motors | The paper describes a self-supervised pipeline (VAE + Facial Action Transformer) mapping audio to lip-motor actions | The film shows audio → self-model → lip motors. Model internals are not drawn. |
| Speech and song; languages it hadn't been trained on | Release: it articulated words in several languages and sang songs | Silent waveform illustrations, labelled "demo audio not played". No flags, no translation. |
| Meaning not required for the lip movements | Script's own inference from audio-driven lip motion | A pipeline with "meaning" off the path, plus a two-card distinction. No claim the system understands. |
| Difficulties with "B" and "W" | Lipson (TechXplore): trouble with "B" and lip-puckering sounds like "W"; one summary also mentions "P" | Labelled "Illustration of the reported difficulty". The gap size is not a measurement. |
| Earlier study (2024): watching videos, recognising small changes as a smile begins | 2024 release: the robot (Emo) learned from videos of human expressions | Tag "Earlier study · Science Robotics · 2024" after a deliberate cut. It follows the lip-sync study only because the narration does, and nothing links the two causally. |
| One model predicts the expression; another turns it into motor commands | 2024 release: two models (prediction; inverse model to motor commands) | Two cards and arrows: cue → pupil camera (the 2024 robot had cameras in its pupils) → model 1 → model 2 → mouth corner. No brain or thought-scanner. |
| About 840 ms ahead, allowing it to try to smile alongside the person | 2024 release: predicts an approaching smile about 840 ms before it appears | "Schematic" chart. The 0.84 s bracket runs from the prediction to the visible smile. The robot never moves before the person's visible cue begins. |
| Studies of facial movement; a smile doesn't show feeling | Script's framing | X-ray of the motors under the smile. No emotion meter. |
| Tutor / assistant | Possibilities only | Tags "Possible use · a tutor / an assistant". |

Not used, as the brief directs:
- the 62.46% preference figure (selected lip-sync performance among compared methods);
- any "looks human" rate;
- any claim of feelings, empathy, intent or consciousness;
- the "hello world_" album;
- the magnetic-skin detail.

## Possible source conflict (flagged, not rewritten)

- **"B" and "W" vs "B" and "P".** The narration says "B" and "W", which matches the TechXplore quote (B and
  lip-puckering sounds like W). One summary lists "B" and "P". The narration is unchanged; the film stages B and W.
  Check against the paper text before publishing.
- **Training medium in 2024.** The 2024 coverage describes the self-model as learned from random expressions in
  front of a camera; the mirror is from the 2026 lip-sync release. The film shows the mirror only for the lip-sync
  programme ("And the place to start was a mirror"), which matches.

## Assets and lineage (provenance)

**Visitor.** The Weird Crew's "guesser":
- red spiky hair, peach skin, coral cheeks;
- white tee with saffron stripes.

He is drawn with his existing rig, `source/src/dc/` (Head, Man, Hand, ink, shade, color, math, limb). It is copied
unchanged from `glass-climbing/source/src/dc/` (Glass Climbing V7, 26 Oct 2026), the Death Clock V4 → Real Web
Fluid → Glass Climbing lineage. It is a native rig, reused, not redrawn. Only placement and expression presets are
new (`art/Visitor.tsx`).

**Cast references checked.**
- `can-you-hurt-something-that-isnt-alive/production/approved_cast/cast_rig_check.png` (identity of "guesser");
- the style frames there (counter, verify): ink outline, Fredoka/Nunito, cream cards.

The gameshow frame was not opened.

**Robot.** It is new for this episode (`art/Robot.tsx`). There is no existing robot-face rig in the repository; the
Living Skin face is a different machine (living tissue) and was not reused.

**Lab, set and UI.** New: `art/Lab.tsx` and `art/Ui.tsx`. The palette is the channel's warm cream with teal wainscot.

**Pipeline.**
- Remotion 4.0.533, with the package and lockfile from `glass-climbing/source/` (pinned and unchanged);
- the stills and sheet pattern from the same project;
- the audio approach from `ai-cancer-digital-twin/tools/make_audio.py`: synthesised score, ducking, −14 LUFS
  target, look-ahead limiter.

**Voice.** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`). See `audio/narration/voice_provenance.json`.

**Music and effects.** Synthesised in `tools/make_audio.py`. No samples and no third-party music.

**Runway and generated imagery.** None used.

**Historical branches.** `claude/new-session-96c7w8` and `claude/new-session-h21vtg` were not needed: current
source exists on this branch.

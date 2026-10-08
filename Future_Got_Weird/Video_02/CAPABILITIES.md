# Video 02 capability report (production environment, 8 October 2026)

What was actually verified in this session, how, and what it means for the episode. Private production record: it
names account tools and identifiers and must not be published.

## Repository and baseline

| Item | Verified state |
|---|---|
| Repository | `BKimble1/Youtube-videos`, cloned fresh in the cloud container |
| Video 02 branch | `claude/new-session-h21vtg` (based on `bd8de7a`, the repository's setup commit); Video 02 lives in `Future_Got_Weird/Video_02` |
| Video 01 reference | branch `claude/new-session-96c7w8` at `2c71915` ("V3: final-pass brief…"), `Future_Got_Weird/Video_01_V2`; checked out read-only as a separate worktree, never modified. A V3 polish pass of Video 01 is described in `V3_BRIEF.md` there; that branch is left untouched |
| Other branches seen | `claude/youtube-ai-confidence-video-2f39dg` (older dark AI-confidence cut), `video-01-review-prep`, `claude/inspiring-clarke-meyznm` (= setup commit) |
| Reused toolchain | Video 01's `package.json` / `package-lock.json` (Remotion 4.0.533, React 19.1.0, TypeScript 5.8.3, fonts), unchanged lockfile; `npm ci` succeeded |
| Reused code | `lib/` (motion, camera, timeline, sfx), `components/` (Character rig, cast, props, sets, text, evidence), generic `components/v2` (DrawBox, RollingNumber, StampArm); Video 01 scene files and episode-specific parts were not copied |
| Reused tools | narration collection/alignment/take selection, timeline builder, sound library/placement, music, mix, audio QC, dense QA, split-part backup |

## Execution environment

| Capability | Result |
|---|---|
| Node / npm | v22.22.0 / 10.9.4 |
| Chromium | Playwright headless shell 1194 at `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`; Remotion renders stills with it (Video 01 reference frames rendered at 1080p here) |
| ffmpeg / ffprobe | `/usr/bin/ffmpeg` (with libx264, AAC) |
| Python | 3.13 with numpy, scipy, soundfile, pyloudnorm, mido, Pillow, matplotlib, OpenCV (headless), PyYAML installed for this session; PyTorch could not be installed from PyPI in this session |
| FluidSynth | 2.3.4 with MuseScore General and FluidR3 GM SoundFonts (installed from Ubuntu packages) |
| CPU / memory / disk | 4 cores, 15 GB RAM, about 24 GB free at start (fixed per-session allowance) |
| Remotion agent skills | installed globally with `npx skills add remotion-dev/skills -g --agent claude-code -y` (skills v4.0.534); the project lockfile is unchanged |
| Media backup | Git LFS host is not used; media is committed as split parts with checksums (Video 01's method) |

## Network policy (what the container can and cannot reach)

Allowed: GitHub over git (`git clone` of public repositories), `raw.githubusercontent.com`, npm, PyPI, Ubuntu
archive, `storage.googleapis.com` (ElevenLabs download links), the connected MCP tools, and the web-search tool.

Denied by the environment's egress policy (HTTP CONNECT 403 or no DNS): `nature.com`, `arxiv.org`,
`cornar.media.mit.edu`, `media.mit.edu`, `news.mit.edu`, `pmc.ncbi.nlm.nih.gov`, `doi.org`, `api.crossref.org`,
`semanticscholar.org`, `web.archive.org`, `spectrum.ieee.org`, `zenodo.org`, `huggingface.co`, `youtube.com`,
`remotion.dev`, CDN hosts. Consequence: the final Nature article, its figures and Supplementary Video 1, and the arXiv
manuscript could not be opened directly. They were researched through the web-search tool (secondary access, recorded
per fact in the claim ledger). The authors' code and released measurements were cloned from GitHub and inspected
directly. To allow direct access, add those hosts under the environment's network settings (Allowed domains).

## ElevenLabs (restricted connector)

| Operation | Result |
|---|---|
| Voice listing | `creative_list_voices`: **Test Voice**, voice ID `kk5XaSLo2XAw0sKM98zU`, category "generated", description "Test Voice For Youtube." (same ID as Video 01 V2's records) |
| Speech generation | `creative_generate_speech` / Flows TTS node; models offered: eleven_v4, eleven_v3, eleven_multilingual_v2, eleven_turbo_v2_5, eleven_flash_v2_5. eleven_v4 exposes only `voice` and `language_code` (no stability/similarity settings); inline audio tags and IPA respellings are supported |
| Performance check | Flow `Cjv3aaPBJnopNavrrED3`, node `H8kKGszxKQMBMa1but9c`, 2 takes (generation IDs `BL6aKk2P2WloqmNOoigP`, `DcRPN1v5VHPF2460lKJm`), 18.96 s and 19.04 s, MP3 44.1 kHz mono 128 kb/s, about −19.5/−20.2 LUFS, sentence pauses 0.36–0.57 s, wide pitch movement. Estimate tool quoted 1,427.9 credits for four takes of that 370-character passage; the run status reported 0 credits per generation. No ElevenLabs balance tool is exposed |
| Downloads | signed `storage.googleapis.com` URLs from run status, valid about two hours; collected with `tools/el_collect.py` |
| Alignment | Speech-to-Text node with `eleven_scribe_v1` (word timestamps) is exposed |
| Sound effects | Flows SFX node `eleven_text_to_sound_v2` (duration 0.5–30 s, prompt influence, loop) |
| Music | not available in this restricted connector (no music node) |

## Runway

| Operation | Result |
|---|---|
| Authentication | `whoami`: authenticated, personal workspace, no other workspaces, no model deprecations listed |
| Balance | 2,250 plan credits, 0 purchased (8 October 2026, before any Video 02 spend). Episode cap for the first batch: min(500, 2,250 / 2) = **500 credits**, at most two paid attempts per selected shot |
| Video models available | seedance-2, seedance-2.5, seedance-2-fast, seedance-2-mini, kling-o3-pro, kling-o3-standard, kling-3-pro, kling-3-standard, kling-3-turbo, kling-3-motion-control, kling-3-4k, kling-o3-4k, gen-4.5, veo-3.1, grok-imagine-1.5, gemini-omni-flash, h3-max, hailuo-3, wan3, wan3-prime, gen-4-turbo |
| Image models available | nano-banana-pro, nano-banana-2.1, nano-banana-2, nano-banana-2-lite, gpt-image-2, gpt-image-2.5-flare, gpt-image-2.5-sunburst, seedream-5, seedream-5-pro, ideogram-4, ideogram-4.5, ideogram-4.5-precise-edit, grok-imagine-image-2, muse-image, gen-4, gen-4-image-turbo |
| Upload | `init_upload` → PUT → `complete_upload` (images: JPEG/PNG/WebP/GIF) |
| Image-to-video, polling | `generate_video` with `startFrame`, `get_task` polling; per-model video cost is not stated in the tool text visible here, so the first job's cost is measured from the balance before and after |
| Other exposed operations | music (`generate_music`, 4–8 credits per track as stated by the tool), sound effects (1 credit per second), upscale, frame-rate conversion (1 credit per 2 s), background removal |
| Not used | Act-Two style performance transfer (no driving performance needed), credit purchases, plan changes, auto-refill |

## ChatGPT illustration

No tool in this session can operate the owner's ChatGPT project or its image generator. Runway exposes OpenAI and
other image models, which would spend the same Runway credits; the accepted Video 01 cast is an SVG rig in code, so the
film's characters are extended directly in code (exact continuity), and the ChatGPT packet is prepared as the planned
bridge for richer plates and alternate drawings.

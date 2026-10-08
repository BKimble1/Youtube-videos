# Upload description: draft for the final film (V3)

This is a draft. It replaces the pass-2 text in `package/UPLOAD_PACKAGE.md` once the claims audit has filled the
Sources block. The paste-ready block below is plain text, because YouTube does not render Markdown. It contains no
owner identity, personal links, private repository names or internal paths. Everything internal is kept outside
the block.

## Title

**Why AI Is So Confidently Wrong**

- This matches the film's on-screen title exactly. S2 shows "Why AI Is So Confidently Wrong" under the kicker
  "FUTURE GOT WEIRD · EPISODE 1" from 0:29 (checked in the V2 review render at 0:30.0, and in
  `source/src/scenes/S2_ShortVersion.tsx`). The film also asks it word for word at 4:13 (s33).
- It is the title the channel brief recommends.
- Keep the title's capitalisation and leave out the question mark, as both the film and the brief do.

Alternative to test later (from the brief): **Why AI Makes Things Up (So Convincingly)**.

## Description (paste-ready)

```
Three popular AI models were asked for the title of one researcher's PhD thesis. All three answered with a title, a year and a university. None of them got the title or the year right. So why does AI sound so sure when it's wrong?

This episode takes one of those answers apart: how a language model writes one token at a time, why the most likely next words are not the same as the true ones, how the way AI gets graded can reward a confident guess over "I don't know", and the two questions that help catch a made-up answer.

Chapters
0:00 Three AI models, one question
0:27 The short version
0:44 One token at a time
1:26 What the model learned from
2:03 The actual record
2:26 Why guessing wins (an example quiz)
3:15 Nine of ten benchmarks
3:34 What helps, and what it doesn't guarantee
3:47 Two questions to check
4:13 Sounding right vs. being right

[[SOURCES AND NOTES: filled in by the claims audit]]

Credits
• Paper header, answer excerpts and Table 2: Kalai, Nachum, Vempala & Zhang (2025), arXiv:2509.04664, CC BY 4.0. Thesis title page: Kalai (2001), shown for verification.
• Narration: AI-generated voice made with ElevenLabs (Eleven v4). It does not imitate any real person.
• Sound effects: generated for this video with ElevenLabs, plus a synthesized tick.
• Music: original score generated for this video, rendered with the MuseScore General SoundFont (MIT licence).
• Type: Fredoka, Nunito, Source Serif 4 and JetBrains Mono (SIL Open Font License).
• Characters, props and sets: original cutout-style illustrations made for this channel.

Future Got Weird: AI moves fast. We make it make sense. New episodes twice a week.
```

About 1,650 characters without the Sources block, against YouTube's 5,000-character limit (and no angle brackets, which YouTube rejects). The claims audit's
Sources and Notes draft adds about 2,950, for roughly 4,550 in total. **Check the length after pasting.** If it
runs over, shorten the "Background" bullets first.

### The Sources placeholder (internal; do not paste this note)

Replace `[[SOURCES AND NOTES: filled in by the claims audit]]` with the final "Sources" and "Notes" block from
`qa/v3_inspect/claims/SOURCES_DRAFT.md`, once the claims audit marks it final. Whatever its final wording, the block
must keep these items:

- **Original paper.** It is the source of the specific historical example (Table 1: GPT-4o, DeepSeek-R1,
  Llama-4-Scout, 9 May 2025, no web search) and of Table 2 (ten benchmarks sampled mid-2025):
  https://arxiv.org/html/2509.04664v1
- **Later publication** by the same authors, listed alongside the preprint rather than in its place:
  https://www.nature.com/articles/s41586-026-10549-w
- **The actual thesis:** https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-01-132.pdf
  (this replaces pass 2's Microsoft Research link)
- **Token split** (o200k_base / tiktoken): https://github.com/openai/tiktoken
- **The Notes sentences:**
  - the token split is real;
  - the next-token percentages and the quiz scores are illustrations;
  - the three answers are a 9 May 2025 test of three specific models without web search, not a failure rate for
    today's chatbots;
  - "nine of ten" refers only to the ten sampled benchmarks;
  - confident wording is not a measured confidence;
  - the grading argument is one explanation, not the whole story.

The film's end card says "Sources, excerpts and credits are in the description." The finished description
therefore has to contain all three: sources, excerpts (credited under Credits) and credits.

## What changed from the pass-2 description, and why

| Pass-2 line (`package/UPLOAD_PACKAGE.md`) | Change | Reason |
|---|---|---|
| L4 "Runtime 4:40.8. Master: `exports/Future_Got_Weird_Video_01_Pass_2_1080p.mp4`" | Runtime 4:48.2. The master is `exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4` | V2 timeline: 8,647 frames. The approved review measures 4:48.235 |
| L36 "Three popular chatbots … All three answered in full sentences, with a title, a year, sometimes a university. None got the title or the year right." | "…All three answered with a title, a year and a university. None of them got the title or the year right." | All three Table 1 excerpts name a university (CMU, Harvard, MIT). Two of them are cut with ellipses, so "full sentences" cannot be checked (agrees with the claims audit). Film s03: "None of them are right. Not one even had the right year." |
| L38 "…the two questions that catch a made-up answer in under a minute" | "…the two questions that help catch a made-up answer" | "In under a minute" is not in the film and has no source. "Catch" alone overpromises; "help catch" matches s34 |
| L38 "how a language model writes a sentence one token at a time" | "how a language model writes one token at a time" | Shorter, and it matches the chapter title |
| L41–L50 chapters (0:00 … 4:07) | The V2 list above | Seven of the ten pass-2 times are 1–7 s early on the V2 timeline (see `CHAPTERS_DRAFT.md`) |
| L53 arXiv link `https://arxiv.org/abs/2509.04664` | `https://arxiv.org/html/2509.04664v1` (pinned to v1), plus the Nature article as the later publication | Owner's V3 brief |
| L54 thesis link (Microsoft Research host) | CMU CSD link | Owner's V3 brief |
| L60 "Excerpts and Table 2: Kalai et al. (2025), CC BY 4.0." | "Paper header, answer excerpts and Table 2: … arXiv:2509.04664, CC BY 4.0." | V2 also shows the arXiv page-1 header (`img/paper_p01_header.png`, S1). The Table 1 image is no longer shown; the excerpts are retyped verbatim |
| L61 "Narration: AI-generated voice (ElevenLabs, voice "Marcus K", Eleven v4)." | "Narration: AI-generated voice made with ElevenLabs (Eleven v4)." | V2 narration is the ElevenLabs voice recorded as "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), per `script/narration_segments.json`, `audio/narration/v2/manifest.json` and `timeline.json`. "Test Voice" is the workspace label, so it belongs in the internal credits (asset manifest), not the public line. If the owner wants the voice named publicly, use: `(ElevenLabs Eleven v4, custom voice "Test Voice")` |
| L62 "Music: original score rendered with the MuseScore General SoundFont (MIT). Sound effects: generated for this episode with ElevenLabs, plus synthesized accents." | Split into two lines. Music: "original score generated for this video". Effects: "generated for this video with ElevenLabs, plus a synthesized tick" | V2 music is a new generated score (`tools/make_music_v2.py`, FluidSynth + MuseScore General, section-aware). V2 effects are 144 new ElevenLabs takes, 10 pass-2 ElevenLabs effects (also made for this video) and 1 synthesized tick (`audio/sfx/v2/SELECTION_V2.md`) |
| (none) | "Type: Fredoka, Nunito, Source Serif 4 and JetBrains Mono (SIL Open Font License)." | The owner asked for font credits. All four are OFL 1.1 (`assets/asset_manifest.csv`, `source/src/fonts.ts`). OFL does not require a credit line, so this is optional |
| L65 sign-off | Unchanged | It matches the end card (4:37–4:48) and the brief's twice-weekly plan |

## Upload settings (internal checklist; do not paste)

- [ ] **File:** `Future_Got_Weird_Video_01_V3_4K_MASTER.mp4`. Upload this file, not the 1080p review.
- [ ] **Title** as above. **Thumbnail:** see `THUMBNAIL_NOTES.md`. The recommended file is 1280×720 JPG, about
      130 KB, well under 2 MB.
- [ ] **Subtitles:** upload the V3 SRT as English. Regenerate it with the corrected `build_srt` first (see the
      caption findings), and name it e.g. `Future_Got_Weird_Video_01_V3.en.srt`. Do not upload
      `script/subtitles_elevenlabs.srt`: that file is the pass-2 (Marcus K) timing.
- [ ] **Chapters:** they come from the description timestamps. After publishing, check that YouTube's "automatic
      chapters" setting has not replaced them.
- [ ] **End screen** (5–20 s): use 4:38–4:48. Place the elements in the empty lower-centre/right area of the end
      card, roughly x 700–1800 and y 520–900 on a 1920×1080 frame. Keep the bottom-left clear: the fact-checker and
      the "Sources, excerpts and credits are in the description." line sit there. The pass-2 note said "the last
      20 seconds". That is no longer right, because the end card only appears at about 4:37.
- [ ] **Altered or synthetic content:** the narration voice is synthetic and the film is fully animated. The
      description says so. Answer YouTube's current form as it asks at upload time; this session could not reach
      the help pages.
- [ ] **Owner confirmations before publishing:**
  - [ ] Open the three source URLs once each. The claims audit could not reach them.
  - [ ] Confirm that "Test Voice" was designed, not cloned from a real person's voice. The channel brief forbids a
        voice clone of the owner, and the credit line says "does not imitate any real person". The records name the
        voice but do not say how it was made.
- [ ] Category: Education, or Science & Technology. Made for kids: No. Language: English.
- [ ] Tags (optional): AI hallucination, large language models, ChatGPT, how AI works, fact checking.

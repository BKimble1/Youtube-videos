# Asset and rights ledger — They Trained Robots to Destroy Themselves (v1)

Internal. Verify any "check" item before upload; nothing here is legal advice.

| ID | Asset | Origin / creator | Use and basis | Modifications | Attribution | Status |
|---|---|---|---|---|---|---|
| A01 | Narration (7 blocks, 4:12) | ElevenLabs, owner's own designed **Test Voice** `kk5XaSLo2XAw0sKM98zU`, model `eleven_v4`, owner's workspace, flow `bMvBZzDdtEZz45PtXUpm` | Generated under the owner's ElevenLabs account terms | Blocks stitched with silences; two short pauses lengthened | None required on screen; description says the narration is a synthetic voice | Check: the plan in use permits commercial use (same as earlier episodes) |
| A02 | 17 sound effects (steps, servo, push-off, entry, paper, card, tag, stamp, clapper, pin, flop, knee tap, airbag, static, whoosh) | ElevenLabs text-to-sound (`eleven_text_to_sound_v2`), owner's workspace, same flow; 2 takes each, 1 used | Generated under the owner's account terms | Trimmed to the hit, faded, normalised (tools/prep_sfx.py) | None | Check: same plan note as A01 |
| A03 | Music bed, ambiences, UI ticks, sizzle, marker, closing chime | Original, synthesised by tools/synth_audio.py (deterministic) | Owned by the channel | — | None | Clear |
| A04 | Runway underscore "FGW Robots - explainer underscore v1" | Runway `generate_music` (8 credits), owner's workspace | **Not used**: output host blocked by this environment's network policy | — | — | Optional swap-in later; see README |
| A05 | All illustration and animation (foundry, ladle, F.02-inspired robot rig, F.03 silhouette, props, diagrams, thumbnails) | Original vector code in source/src | Owned by the channel | — | — | Clear |
| A06 | Robot design reference | Drawn from general knowledge of Figure's F.02 appearance; no logo, no traced photo; official photos could not be loaded here | Editorial depiction of a real product to explain a news event | Stylised to the channel's look | Named in narration and labels ("our drawing of the F.02") | Check: compare with official photos (A06 is the main likeness risk) |
| A07 | Approved cast (checker, clerkA, clerkB, clerkC) | Channel's own rig `components/Character.tsx`, `cast.ts` (from Video 01 V2) | Owned | Posed only | — | Clear |
| A08 | Fonts: Fredoka, Nunito, Source Serif 4, JetBrains Mono | @fontsource packages (SIL Open Font License) | Rendered into video | — | Not required for video | Clear |
| A09 | Quote: "…we really trained robots to jump autonomously, shipped them to Finland, and had them leap into a vat of molten steel." | Figure, "F.02 Decommission", Sep 30, 2026 (as reproduced in coverage) | Short attributed excerpt for news commentary | Leading words elided with "…" | On card + description link | Check wording against the original page |
| A10 | Quote: "You should melt them." | Arnold Schwarzenegger, reply on X, Aug 19, 2026 | Short attributed quote; typographic card, not a screenshot | — | On card + description link | Clear (short factual quote) |
| A11 | Paraphrase: Ovako spokesperson saw the robots jump | Yle | Paraphrase with attribution | — | On card + description link | Clear |
| A12 | *Terminator 2: Judgment Day* (1991) reference | Title and a plot fact only; no images, clips, music or likeness | Commentary | — | Named | Clear |
| A13 | Figure's official film | — | **Not used.** Could not be accessed here and its reuse terms were not cleared | — | Linked in description | — |

No owner identity, personal branding or private project references appear in any public asset (frames, captions, description, thumbnails). Export metadata: Remotion writes no author field; check the encoder tags after any re-encode.

## V2 additions (Oct 14, 2026)

V1 rows above still apply to V1. V2 reuses A03 (V1 in-house sounds), A07 (cast) and A08 (fonts) unchanged, and these:

| ID | Asset | Origin / creator | Use and basis | Modifications | Attribution | Status |
|---|---|---|---|---|---|---|
| B01 | V2 narration (7 blocks, 3:50.5) | ElevenLabs, owner's own designed **Test Voice** (resolved by ID `kk5XaSLo2XAw0sKM98zU`), model `eleven_v4`, owner's workspace; takes, IDs and credits in `audio/v2/narration/takes_v2.json` | Generated under the owner's ElevenLabs account terms | Selected takes stitched with fixed gaps (tools/v2/stitch_narration_v2.py); no speed change | Description says the narration is a synthetic voice | Check: same plan note as A01 |
| B02 | 10 new V2 sound effects (furnace roar grains, heavy molten impact, grating steps ×2, shutter slam, padlock, crane chain, electrical arc, sub boom, rewind, typing) | ElevenLabs text-to-sound (`eleven_text_to_sound_v2`), owner's workspace, flow `cTJC4ajZ74v2FqrAyWFs`, 4 takes requested per kind; choices and generation IDs in `audio/v2/sfx_choices_v2.md` | Generated under the owner's account terms | Trimmed to the hit, faded, normalised (tools/v2/prep_sfx_v2.py); roar takes used only as grains inside the in-house furnace bed | None | Check: same plan note as A01 |
| B03 | V2 score, furnace bed, room tone, outline-trace shimmer | Original, synthesised by tools/v2/synth_audio_v2.py (deterministic; reuses the V1 instrument functions) | Owned by the channel | — | None | Clear |
| B04 | V2 illustration and animation: the RIG-F02 3D robot (F.02, F.03, virtual robot, generic performer), foundry, workshop, line, simulation and airbag sets, effects, V2 thumbnails | Original vector code in `source/src/v2` | Owned by the channel | — | — | Clear |
| B05 | Robot likeness (V2) | Drawn from text descriptions of F.02 and F.03 plus general knowledge; the reference pages named in the V2 brief (figure.ai, tendril.studio, YouTube, thinkfoundry.com, the Wikimedia logo) were blocked by this environment's network policy, so nothing was traced or sampled from them | Editorial depiction of real products to explain a news event | Stylised to the channel's look | Identified by narration and plain captions | Check: compare with official photos before upload |
| B06 | Figure logo | **Not used.** The verified file could not be loaded; no reconstruction drawn | — | — | — | Add only from the Wikimedia file after checking its licence (see `production/v2/ROBOT_REFERENCE.md`) |
| B07 | Post paraphrase: Brett Adcock asks what to do with the retired F.02 robots | X post (linked) | Paraphrase, labelled PARAPHRASED on screen; typographic card, not a screenshot | — | Name and month on the card; link in description | Clear |
| B08 | Quote: "You should melt them." | As A10 | As A10; labelled QUOTED; no voice clone or recreated reaction | — | Name, date on card; link in description | Clear |
| B09 | Runway | Not used in V2 (no generated media needed; output host still blocked) | — | — | — | — |

V2 drops the A09 on-screen quote card: the opening attribution is now one chip naming Figure's post and date.

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

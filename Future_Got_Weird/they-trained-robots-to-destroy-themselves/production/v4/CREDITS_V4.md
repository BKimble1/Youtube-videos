# V4 source credits

## On screen and in the description

The line to paste into the description (already in `upload/UPLOAD_TEXT_v4.md`):

> Figure symbol: Figure AI, via Wikimedia Commons, CC BY 4.0
> (https://commons.wikimedia.org/wiki/File:Figure-ai-logo.svg). It appears on our drawings of the F.02 and F.03; this
> channel is not affiliated with Figure.

The symbol is a trademark of Figure AI. It identifies the company's products in commentary about its own news. Its placement follows the V4 brief's descriptions:

- **F.02:** on the visor and the upper chest, with "F.02" below the chest symbol.
- **F.03:** on the chest.

## Production assets

| Asset | Source | Licence / basis |
|---|---|---|
| Figure symbol (`production/v3/brand/`, `source/src/v3/brand/figureSymbol.ts`) | Wikimedia Commons, author Figure AI | CC BY 4.0. The transparent adaptation removes only the background; the path is unchanged and never mirrored |
| Narration | ElevenLabs Test Voice, unchanged from V2 | Owner's account terms |
| Effects | V2 ElevenLabs takes and V1 effects (`production/ASSET_RIGHTS.md` A02/A03/B02). V4 adds three V1 effects (`counter_tick`, `marker_x`, `paper_swish`) to the cue sheet. No new generations | Owner's account terms / owned |
| Score, furnace bed, room tone | Synthesised in-house (`tools/v2/synth_audio_v2.py`), unchanged | Owned |
| Animation, robot characters, sets, props | Original vector code in `source/src/v4` | Owned |
| Cast characters | Channel rig (`source/src/components`) | Owned |
| Fonts | Fredoka, Nunito, Source Serif 4, JetBrains Mono (@fontsource) | SIL OFL |

## Reference images

The V4 brief's reference images were not loaded from this environment because the network policy blocked the hosts:

- the NVIDIA blog BMW photo;
- the tendril head image;
- the figure.ai F.03 pages;
- the ctfassets image.

Nothing was traced or sampled from them. The drawings follow the brief's written descriptions.

## Facts, quotes and sources

These are unchanged from V2/V3. See the "Sources" list in `upload/UPLOAD_TEXT_v4.md` and `research/claim_ledger.md`.

V4 adds on-screen labels only where the narration already says the same thing:

- "FIGURE SAYS" chips;
- "HOW THIS KIND OF TRAINING GENERALLY WORKS";
- "which variations Figure used — not something we know".

V4 adds no new claims, numbers or quotes.

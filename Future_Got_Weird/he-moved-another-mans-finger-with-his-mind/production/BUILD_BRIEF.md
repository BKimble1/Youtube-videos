# Build brief: picture V1 (for the scene builders)

**Episode.** Future Got Weird long-form, *He Moved Another Man’s Finger With His Mind*.

**Format.** 1920×1080 at 30 fps, 3:31.77 (6,353 frames).

**Inputs.**
- The narration is locked and recorded: `production/NARRATION_LOCKED.txt`. Do not change a word.
- The creator's direction is in `production/EPISODE_BRIEF.md`. Read it in full, section "Creator's direction (verbatim)".
- The facts and hardware notes are in `production/SOURCE_NOTES.md`. Read the claim ledger and the staging notes.

## Source tree (`source/`, Remotion 4.0.533, deps installed)

| File | What it is |
|---|---|
| `src/lib/core.ts` | Timing helpers, placed from the measured words (`src/data/narration_words.json`). |
| `src/art/kit.tsx` | Shared kit: `K` palette, `Cam`, `Tag`, `Label`, `Room`, `Desk`, `Monitor`, `Keyboard`, `Touchpad`, `RoundCoil`, `Fig8Coil`, `Computer`, `Packet`, `Building`, `Tree`. |
| `src/art/hand.tsx` | Large profile hand `SideHand` (poses `FLAT`, `HOVER`, `mixP`, `indexTip`), drawn from the thumb side. |
| `src/art/game.tsx` | The defend-the-city game `GameScreen` (640×400 frame): plane and rocket fly the same arc, the cannon fires on `fire`, and the BCI cursor window is shown via `cursor`. |
| `src/art/crew.tsx` | The approved Weird Crew cast rig `CrewChar`, with a `headGear` slot. |
| `src/art/people.tsx` | Looks `RAO`, `STOCCO`, `V14.*`, `BN.*`, plus `EEGCap`, `SwimCap`, `Earbuds`, `Headphones`. Cast sheet: `CastSheet` composition. |
| `src/shots/S1Hook.tsx` | DONE. Exports `Campus`, `campusCam`, `RaoPanel`, `StoccoPanel`, `tapPose`, `STOCCO_WRIST`, `WIN_A`, `WIN_B`, `PW`, `PH`, `hookEvents`. |
| `src/shots/scenes.tsx` | The sequence table (already registered). Each sequence is `React.FC<{f: number}>` (f = absolute frame) and returns SVG for a 1920×1080 frame. |
| `src/Film.tsx` | Draws the active sequence plus burned-in captions (bottom band, about y > 900). |

`src/lib/core.ts` helpers:
- `T('phrase')` gives the start (s) of the first occurrence; `T('phrase', fromWordIndex)` searches from a word index.
- `TE('phrase')` gives the end (s).
- `pr(f, a, b)` is eased 0..1; `lin(f, a, b)` is linear.
- `keys(f, [[t, v], ...])` interpolates between keyed values; `pulse(f, a, b, c, d)` rises a→b, holds, then falls c→d.
- `FPS` = 30.

All times come from `T()` on the narration words, never hard-coded seconds. Small offsets like `T('Fire') + 0.2` are fine.

## Style rules

The creator's direction in `production/EPISODE_BRIEF.md` takes precedence over these rules.

**Look.**
- Weird Crew flat vector finish: navy ink contours (`INK`), gradient and cel shading from one warm upper-left key light.
- Light, warm backgrounds; the palette is in `K`.
- Clean hands and readable props at phone size.
- Big, simple shapes. No tiny text, no paragraphs on screen.
- Labels are short `Tag`s, at most about 5 words.

**Captions.** Captions are burned in at the bottom (about y 900–1050). Keep the key action, hands, keys, the coil, the game objects and every label out of that band.

**Fixed sides and colours.**
- Rao and his screen are always frame-LEFT; Stocco and his keyboard are always frame-RIGHT.
- Each person keeps their sleeve colour all film long: Rao blue `K.raoSleeve`, Stocco green `K.stoccoSleeve`, the 2014 receiver orange `K.r14Sleeve`, 2019 Sender A teal, Sender B coral, Receiver purple.
- Left/right anatomy: the RIGHT hand is driven by the LEFT motor cortex. In any top or back view of a head, the person's left must be frame-left (camera behind them).

**Camera and transitions.**
- Every camera move lands on new information.
- Let the plane, rocket, cursor, key, coil, pad and block motivate transitions.
- Separate experiments get deliberate cuts.
- No blur, flash, spin or blanket crossfade to hide a jump.
- A camera move never resets in one frame.

**Accuracy.** These are original animated reconstructions of consenting participants sending simple prearranged commands.
- Do not depict mind reading or thoughts.
- Never quote Stocco: "nervous tic" is UW's paraphrase, so no quotation marks.

**Humour.** The humour is in timing (holds, reactions), not slapstick.

**Determinism.** Everything is a pure function of `f`. No `Math.random` (use `hash`/`noise1` from `dc/math`). Give every SVG `id` (gradients, clipPaths) a scene prefix so ids never collide across files.

**Shared files.**
- Do NOT edit `art/kit.tsx`, `art/hand.tsx`, `art/game.tsx`, `art/crew.tsx`, `art/people.tsx`, `shots/S1Hook.tsx`, `Film.tsx`, `Root.tsx` or `scenes.tsx`.
- If you need a variant, copy the component into your own file (for example `src/art/s5parts.tsx`) and say so in your report.
- Only edit your own sequence file(s) and new files you create.

## Sound cues

Each sequence file also exports a cue list for the mix:

```ts
export const CUES_S3 = (): {t: number; kind: string; gain?: number}[] => [...]
```

Use these kinds:
- `key_click`, `pad_click`
- `cannon`, `boom`, `city_hit`
- `plane_pass`, `rocket_launch`
- `coil_pulse` (the TMS click; use it in the flipped-coil control too, at the same gain)
- `packet_send`, `packet_arrive`
- `whoosh` (a camera move or slide; sparingly), `pop` (a tag appearing; sparingly), `tick`
- `flash` (the phosphene), `vote` (a vote token leaves a sender), `flip` (a vote flips inside the computer)
- `line_clear`, `spinner`, `error`, `rotate`

## Checks you must run

- `cd source && npx tsc --noEmit -p .` must be clean.
- `cd source && ./sheet.sh <out.png> "t1,t2,..." [cols]` renders a contact sheet with captions.
- `./still.sh <out.png> t false` renders one full frame without captions.
- Inspect your images: hands (five clean digits, no stray limbs), left/right, contacts (finger on key/pad), labels inside frame and above the caption band, and the first and last frames of your sequence against the neighbouring sequences' contracts.
- Use the scratchpad for images: `/tmp/claude-0/-home-user-Youtube-videos/f5fb328f-035e-5382-adc7-e98d19322b1e/scratchpad/`.
- Do NOT render the full film, run git commands, or touch anything outside `Future_Got_Weird/he-moved-another-mans-finger-with-his-mind/source/src/`.

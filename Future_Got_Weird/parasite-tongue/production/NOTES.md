# FGW Short 1: The parasite that replaces a tongue (production notes)

## Science

The animal is *Cymothoa exigua*, the tongue-eating louse, a cymothoid isopod. Its usual host is the spotted rose
snapper (*Lutjanus guttatus*). Each shot checks against these points:

- **Entry.** Juveniles enter through the gills. In the film a small, slender, translucent juvenile swims to the gill
  cover's rear edge, slips under it and crawls forward over the gill arches into the mouth.
- **Attachment and feeding.** The parasite clamps onto the tongue with its hooked legs and feeds on blood from the
  tongue's artery. In the film the dactyls hook into the tongue, and blood is drawn up from the artery (seen through the
  tissue) into its mouth. The gut fills red, visible through the translucent juvenile.
- **The tongue withers.** It atrophies from the lost blood supply. In the time-lapse the tongue shrinks toward its
  base, pales and wrinkles while the artery's flow fades.
- **Replacement.** The parasite stays attached to the tongue stub and works as the fish's tongue. It is often described
  as the only known case of a parasite functionally replacing a host organ. The time-lapse grows the juvenile into the
  broad, opaque adult female on the stub. In the front view the fish gapes and its segmented body moves, and during the
  meal it presses the shrimp back toward the throat.
- **Simplifications.**
  - The juvenile that enters is male and later becomes female. The film shows the one individual growing, which is
    accurate to that individual's life.
  - The narration's "entire tongue" stands for the tongue apart from its small stub.

## One model, one world

The parasite is one parametric 3D model (`source/src/isopod.tsx`) in every shot, so the segment count and legs never
change:

- cephalon with two eyes and two pairs of antennae
- 7 pereonites
- 5 pleonites
- pleotelson with two uropods
- 7 pairs of legs with curved dactyls

The fish's mouth is one 3D anatomy in millimetres (`source/src/anatomy.ts`):

- lips at x = 0
- floor at z = 0
- throat at x = 46 mm
- gill arches at x = 31–42 mm on both sides

The front set (`front.tsx`) and the side set (`side.tsx`) both draw from that same anatomy. The adult's head sits at
x = 4 mm on the floor in both views, so the side-to-front match lands on the same head.

## Storyboard as built (keyed to measured word times)

| Time (s) | Narration | Picture |
|---|---|---|
| 0.00–0.35 | "If this parasite…" | Inside the open mouth: a pink, fleshy "tongue" wriggles on its own. |
| 0.35–0.85 | | The camera pushes in. The pink drains, segment lines deepen, the legs unfold and seven pairs of claws grip. |
| 0.85–1.42 | "…inside a fish," | Pull back to the fish's face: wide eyes, mouth gaping, the parasite in it. |
| 1.42–2.47 | "…replace its entire tongue." | One move back into the mouth, over the parasite, into the throat and between two gill arches on the fish's left. |
| 2.33–2.47 | | Dissolve on the gill arches, from inside into the side view's cutaway of the same arches. |
| 2.47–3.35 | | Pull back out of the gills. The cutaway closes and the fish's head is seen from its left side in open water. |
| 2.85–4.50 | "It crawls…" | A small juvenile swims in to the gill cover's rear edge. |
| 4.50–6.53 | "…through the gills, latches onto the tongue," | It slips under the gill cover. The cutaway opens, it crawls forward over the gill arches, through the mouth and onto the tongue, and grips on "tongue". |
| 6.53–9.05 | "…and starts stealing its blood." | Extreme close-up: claws in the tongue, the artery pulsing through the tissue, blood drawn up into its mouth on "starts", the gut filling. |
| 9.05–11.53 | "Eventually, the tongue withers away." | Time-lapse: the tongue shrinks, pales and wrinkles, and its flow fades, while the parasite grows into the broad adult on the stub. |
| 11.60–13.40 | "But here's the disgusting part." | A slow push along the adult's body to its head. |
| 13.30–13.62 | | Dissolve on the parasite's head, from the side view to the front view. |
| 13.62–17.30 | "The parasite stays attached, becoming the fish's new tongue." | Pull back to the open mouth. The fish gapes wider twice, and the parasite's segments ripple and its head lifts in the tongue's place. |
| 17.30–20.85 | "And the fish keeps eating, with a living parasite…" | A shrimp drifts in. On "eating" the jaws snap shut, the parasite arches and pushes it back, the fish chews twice, swallows, and reopens with the parasite still attached. |
| 20.85–24.00 | "…inside its mouth." | Push back toward the parasite. Its legs fold under and the pink returns, ending on exactly the opening frame. |

## Runway

I did not use Runway. The brief makes it conditional ("where it materially improves the result"), and its QC list puts
anatomical consistency first:

- legs or mouthparts disappearing
- mouth geometry changing between shots
- a confusing tongue transformation

A generated clip cannot hold this model's exact segment count, its seven leg pairs or this mouth's geometry. Cut
against the procedural shots, it would introduce exactly those faults. No Runway credits were spent.

## Captions

No text is burned in, because the brief rules out floating text and callouts. The SRT is
`captions/FGW_Parasite_Tongue.srt` (sentence chunks, measured word times) for upload as closed captions.

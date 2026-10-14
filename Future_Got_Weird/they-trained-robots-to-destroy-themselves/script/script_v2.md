# Script v2 — They Trained Robots to Destroy Themselves

Spoken lines start with `> `. Claim IDs refer to `research/claim_ledger.md` (C01–C28 unchanged; V2 rows C29–C31 added).
Changes from v1 are listed at the end. Narration voice: ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`.

## B1 · Hook

> These robots were trained to jump into molten steel — on purpose, by their own company. Figure, the robot maker, says the jumps were real, and a spokesperson for the Finnish steel plant says she watched them go in. So why would a company do this? And how does a robot learn a jump it only gets to make once?

C01, C02, C03 (C03 wording now "a spokesperson … says she watched", as Yle reports it)

## B2 · Why retire them this way

> Start with why. These are F.02s, Figure's second-generation humanoid. Figure says they spent months loading parts at a BMW plant. But as its newer F.03 fleet grew, keeping the old ones running stopped making sense.

C04, C05, C06

> So what do you do with a retired robot? Sell it? Figure says they're packed with its own custom hardware, like the actuators that move the joints, and it didn't want that leaving the building. Take them apart? Figure says doing that for every robot would eat so much engineering time, it would delay the next model. Melt them? Simple. Except a robot that jumps in on its own brings its battery along. Figure says foundries in the U.S. and Mexico refused. One in Imatra, Finland, said yes.

C07, C08, C09, C10

> Recycling old hardware is normal. Bringing a film crew is not.

C29 (replaces C11's wording)

## B3 · The post and the movie

> Blame a reply on X. In August, Figure's CEO, Brett Adcock, asked what to do with the old robots. Arnold Schwarzenegger replied, "You should melt them." In Terminator 2, his robot character ends up lowered into molten steel so no one can copy its technology, which is almost exactly Figure's reason. Hollywood wrote the business case in 1991. Figure took the hint, and Schwarzenegger appears in the finished film.

C12, C13, C14, C15

## B4 · How do you train a final jump

> Now the hard part. You can't rehearse a jump like this in a real furnace. So Figure says it trained a new AI model in simulation.

C16

> Here's how that kind of training generally works. A virtual robot tries the jump, and the attempt gets a score. Did it stay balanced? Push off cleanly? Land on target? The software nudges the controls toward whatever scored well, and it tries again, over and over, in many virtual copies at once.

C30 (replaces C17's wording; no attempt count)

> Virtual robots can fall on their faces all day, and nobody files an incident report.

Editorial joke (comic beat)

> Figure says it used stunt performers' movements as a reference, a style guide for a good leap.

C18

> The result is called a policy: a learned rule that turns what the robot senses into motor commands, many times a second. If a foot lands a little early, the sensors catch it, and the policy adjusts the knee and ankle before the robot tips. Not a wish, not a plan. More like a very well-rehearsed reflex.

C19 (the foot/knee example is a conceptual illustration of a feedback policy, not a Figure log)

## B5 · Simulation versus the real world

> But a simulator is never quite the real world. Real joints have slack, floors aren't perfectly flat, and sensors are noisy. And Figure says this jump had to work at a foundry the team had never visited.

C20, C21

> A common fix is to make the simulation messy on purpose. Change the weight, the footing, the timing, a little every round, so the policy can't depend on one perfect world. We don't know which variations Figure used.

C22 ("friction" became "footing")

> It also rehearsed for real, with robots jumping from a second floor onto giant airbags. And the foundry did get messy. Figure says the heat and electromagnetic noise knocked out cameras and other electronics, and the policies kept running anyway.

C23, C24

## B6 · What it proves

> So what does it prove? That a trained jump can survive a brutal environment. But it was one movement, for one kind of target, in a setting people prepared and supervised. That's not a robot that can walk into any factory and work things out.

C24, C25, C27, C31

## B7 · Why it feels uncomfortable

> So why is it uncomfortable to watch? Partly, it's the shape. When something with arms, legs and a head walks to the edge and leaps, it looks like someone making a choice. But the choice wasn't the robot's. People picked the ending, built the target, and wrote the score. The policy just got very good at reaching it. Does retiring hardware feel different when the hardware looks like us? These robots didn't want anything. They just stuck the landing.

C28 (editorial reflection; the closing question is now spoken inside the final scene, not a card)

## Pronunciation and display notes

| Written | Sent to the voice as | Display / captions |
|---|---|---|
| F.02, F.02s | "F-zero-two(s)" | F.02, F.02s |
| F.03 | "F-zero-three" | F.03 |
| Terminator 2 | "Terminator Two" | Terminator 2 |
| 1991 | "nineteen ninety-one" | 1991 |
| Imatra | as written | Imatra |
| U.S. | as written | U.S. |

## Changes from v1

- Hook rewritten around the owner's opening line; the attribution is spoken in one pass instead of a source-reading pause.
- Removed: "It's not a special effect", "Plenty of companies just recycle old hardware…" (replaced by a shorter line), "Here's how that kind of training generally works… thousands of virtual robots… millions of times" (no counts now), "That's just the general idea", the long "What it shows / what we haven't seen" passage (cut to one limit), "They trained robots to destroy themselves" as a spoken line.
- The failure-rate / independent-check caveat (C26) moves to the description notes; the spoken limit keeps the scope point (C27, C31).
- The closing question is spoken before the last line instead of shown as a closing card.

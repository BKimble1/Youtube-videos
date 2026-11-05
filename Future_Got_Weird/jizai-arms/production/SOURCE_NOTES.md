# JIZAI ARMS: sources, claims and design basis

## Network limits during this production

The official references named in the brief could not be opened from this environment. The network policy denied
both hosts:

- `jizai-arms.com`
- `daisuke.uriu.jp` (Daisuke Uriu's portfolio page on the CHI 2023 design process)

Press pages (designboom, Popular Science, VOA Learning English, SCMP) were also denied.

The facts below come from web-search result text only, and the drawing follows the brief's own description.
**Before publishing, check the art against the official photos.**

## Claims in the narration and their basis

| Narration | Basis (search results, 5 Nov 2026) | Status |
|---|---|---|
| "Researchers in Japan built JIZAI ARMS" | University of Tokyo team (Masahiko Inami's lab, the JIZAI Body project). The CHI 2023 paper is "Social Digital Cyborgs: The Collaborative Design Process of JIZAI ARMS" (Yamamura, Uriu et al., ACM DOI 10.1145/3544548.3581169). | Consistent |
| "a wearable rig with six sockets for detachable robot limbs" | "a wearable base unit with six terminals and detachable robot arms" (CHI paper abstract as quoted in results) | Consistent ("sockets" = terminals) |
| "Four are robotic" | Reports of the system worn with four arms ("31 pounds with four robotic arms attached") | Consistent |
| "Move a miniature controller, and the full-sized arm follows" | "robotic arms are controlled using a 1/2 scale model as a controller"; operators move the model "like a puppet" (CHI paper, A' Design Award entry) | Consistent. Arms can also be driven from PC software (not shown). |
| "another person can move the extra hand on your back" | The wearer can "hand control over to someone else" (search summary) | Consistent |
| "demonstrated people removing their robotic arms and swapping them" | Designed for "social interaction between multiple wearers, such as an exchange of arm(s)" | Consistent |

## Visual design basis (stated, not measured)

- **Arms:** white segment shells, dark rotary joints and black articulated hands, as the brief specifies. The joint
  layout here is my construction: a yaw drum at the terminal, then a shoulder, an elbow and a wrist with pitch and roll.
  It is not taken from the real CAD.
- **Base unit:** a black fabric backpack (one search summary mentions a black fabric base unit). The white frame
  carries six terminals: an upper pair on posts above the shoulders, a middle pair on the pack's sides, and a lower
  pair at the hips. **The real terminal positions are not verified.**
- **Connector:** a plug with a twist-lock collar, contact pins and a status light. This is illustrative; the real
  latch mechanism is not verified.
- **Controller:** a half-scale replica of the arm on a stand, moved by hand. The full arm copies its joint angles
  exactly: the two rigs share one kinematic model (`source/src/r3/robot.tsx`, scale 0.5). It is drawn wired to
  nothing; the real system's link (wired or wireless) is unverified.
- **No autonomy or brain control is shown.**

## Sources (search results only)

- ACM DL: https://dl.acm.org/doi/fullHtml/10.1145/3544548.3581169
- New Atlas: https://newatlas.com/robotics/jizai-arms-supernumerary-robotic-arm-system/
- A' Design Award entry: https://competition.adesignaward.com/design.php?ID=148712
- Popular Science: https://www.popsci.com/technology/jizai-arms-cyborg/
- VOA Learning English: https://learningenglish.voanews.com/a/japanese-researchers-develop-wearable-robot-arms-/7155334.html
- designboom: https://www.designboom.com/technology/wearable-robot-limbs-jizai-arms-cyborgs-05-18-2023/

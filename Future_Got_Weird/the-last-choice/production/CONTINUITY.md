# THE LAST CHOICE — cast, injury and prop continuity

Roles are functional; nothing on screen names anyone. Looks are the approved cast (`src/rig/looks.ts`). Damage is
cumulative: once a mark appears it stays (same side, same place, same size) unless a later beat changes it on screen
(bandage, sling). Sides below are the **character's** own left/right (`side: 1` = their right in the rig).

| Role | Cast key | Silhouette cues |
|---|---|---|
| **Director** (leads, pulls the teammate free, returns for the friend, touches the glass, keeps the visor) | `clerkC` | curly hair, saffron shirt, headset, nametag |
| **Teammate** (trapped under the taxi; supported/carried; switches on the radio; hand on the shoulder at the end) | `checker` | grey bob, round glasses, coral cardigan, pencil, satchel strap with the radio |
| **Friend** (cinches the strap; holds the crossing; dies in the refuge) | `clerkA` | teal visor (**the memorial item**), teal vest, nametag |
| **Builder** (opens the subway; makes the decoy; tries to leave the refuge; tools taken) | `clerkB` | bun, square glasses, blue cardigan, earring; tool bag + battered tablet with a clip-on projector |
| **Carrier** (lifts the subway gate; carries the teammate on the crossing) | `honest` | swoop hair, green shirt |
| Civilians (3) | `CIVILIANS[0]` woman in a grey coat, `[2]` older bald man, `[3]` teen | generic, muted; never anonymous casualties |

## Injuries (rig `Damage`), by first appearance
| Who | From shot | Marks (keep thereafter) |
|---|---|---|
| Teammate | A1 | `browCut {side:-1, amt:1}` (left brow → temple), `cracked: true` (left lens), `dirt: 1`, stains `[{phi:-40,h:20,size:12}]` (cardigan, left side), decal `armL0 tear` (left sleeve), `legL1 tear` (left shin), `handBlood {L:0.6}`; **left leg cannot bear weight** (supported, toes trailing), **left arm held to the chest**; breathing ragged |
| Teammate | D1 (refuge) | + `sling: 'L'`, `headBandage` from E1 (dressing over the brow cut; the cut still shows below it) |
| Director | A3 | `dirt: 0.6`, `handBlood {R:0.8}` (the teammate's blood from the grip) |
| Director | C8 | + `lipCut: 1`, `bruise {side:-1, amt:0.7}` |
| Director | C13 (blast) | + `browCut {side:1, amt:0.7}`, decal `armL0 tear`, `dirt: 1` |
| Director | C14 | + `handBlood {L:1, R:1}` (the friend's) |
| Friend | B3 | `dirt: 0.5`, decal `legR1 tear` |
| Friend | C13 (blast) | + stains `[{phi:55,h:45,size:24},{phi:25,h:70,size:14}]`, `browCut {side:1, amt:1}`, `handBlood {R:1}`, `pale` rising 0.3 → 1 by D3; limp body when carried |
| Builder | B2 | `dirt: 0.5` |
| Builder | C8 | + `bruise {side:1, amt:0.8}`, decal `armR0 tear` |
| Carrier | C3 | decal `armL1 blood` (gash, left forearm), `dirt: 0.7`, **limp left leg** (gait `limp {side:'L', amt:0.6}`) |
| Carrier | E1 | decal `armL1 bandage` over the gash (blood edge still visible) |

Faces: fatigue, concentration, recognition, relief, grief, realisation — not permanent panic. No screaming, no
dialogue. Blood is stylised flat colour (`BLOOD`), never anatomical, never lingering.

## Props
| Prop | Owner / path | Continuity |
|---|---|---|
| **Radio** (small, battered, red-brown, antenna) | on the teammate's satchel strap from A1 | visible on the strap in A3/A4, clinks when the friend cinches the strap (B3), on the strap through C (rig `satchel.radio`); D5 the teammate unhooks it (strap now empty) and sets it on the bench, switches it on (dial light on); it stays on the bench (on) through E |
| **Teal visor** | on the friend's head from B3 | on through C16 (also while carried); **D2** slips off as the friend is laid on the bed and lands on the floor by the bed; **D5** the teammate picks it up and holds it; **E3** places it on the empty chair → a service bot lifts it into its tray → the Director takes it from the tray; the Director holds it through E5–E7 (final image) |
| Tool bag + tablet/projector | Builder from B2 | tablet used in C5–C7; **crushed** under the falling warden in C8 (left behind); tool bag kept until **E4** when an attendant locks it in a locker |
| Rebar length | on the landing (set) | the Director jams the landing barrier with it in C11 |
| Maintenance hook on a chain | catwalk set | swung into the warden in C8 |
| White sheet | refuge attendant | D4 covers the friend (face and body); not lifted again |

## Positions: the assembly (B6) and its echo (E7)
Both frames face **east (screen right, into depth)**, three-quarter back views, the Director slightly forward of the
line. Screen left → right:

| Slot | B6 (assembly, raised terrace) | E7 (inside the glass) |
|---|---|---|
| 1 | Builder (tool bag) | Builder (no bag) |
| 2 | Carrier, supporting the teammate | Carrier (bandaged forearm) |
| 3 | Teammate (left arm to chest, leaning on the carrier) | Teammate (sling), right hand on the Director's shoulder |
| 4 | **Director** | **Director**, holding the visor |
| 5 | **Friend** (visor) | **empty** — nothing and no one fills it |
| behind | three civilians, smaller | three civilians, seated, smaller |

## Geography and screen direction
West → east = screen left → right throughout the pursuit (see `source/KIT.md`). The refuge is always screen right in
wides; its entrance (teal aid symbol) is visible in A5, B6, C9 and C16. The only deliberate reversal: the Director runs
**back** (right → left) along the failing catwalk in C14.

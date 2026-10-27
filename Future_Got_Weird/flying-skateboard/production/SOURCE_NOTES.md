# Flying Skateboard: sources, accuracy and design decisions

## What the brief verified, and how the film shows it

| Verified detail (brief) | In the film |
|---|---|
| Inventor: Song Xingyu (宋兴宇), "Amazing Ayu" / 神奇阿宇, Badong, Hubei | Shown only through his gear (helmet with smoked visor, orange jacket, gloves); no invented facial likeness |
| The first prototype used **five jet engines** | The workshop prototype carries five turbojets, 2-1-2, mounted vertically through a dark aluminium plank (`art/JetBoard.tsx`) |
| A combined engine test **caught fire** and damaged parts of the system | Exhaust hits the floor and recirculates toward the intakes, the frame vibrates, ignition and flames on "FIRE", then scorched wiring, fuel lines and deck. No explosion, no injury, no crash |
| The redesign uses **ten brushless electric propulsion units** | Ten ducted fans, two rows of five, one locked geometry in every shot (`art/Board.tsx`). The "ten" beat lights the ten duct rims in sequence |
| The pilot stabilises the craft mainly by **body-weight shifts** | `story/flight.ts`: the rider's centre-of-mass shifts are the input. The board's pitch and roll are a lagged response to them (the body leads, the board follows) |
| **Hand controls** for thrust and steering | A small one-hand controller in the right hand; the throttle click and thumb press on "while an AI". It is never shown balancing the board |
| No autonomous self-balancing | On "HUGE problem" the deck rolls with nothing correcting it until the body answers |
| A **phone mounted in the board** reads attitude | A phone set into the spine between the feet, showing a horizon bar that tilts with the board's roll and pitch |
| A **separate phone on the wrist** | Strapped to the left forearm. He turns it up to read it ("voice coach") |
| **AI feedback through an earpiece** | A bud on his ear whose light pulses with a brief two-note cue. No HUD, no bubbles, no AI character |
| About **ten days of practice** before the big flights | Early wobbly low hovers, then cleaner circuits, while the sky passes through dusk and dawn |
| The **Yangtze** and **canyon** flights are separate demonstrations | Joined by a foreground rock-spur wipe (and a mist wipe back to the river for the question), never one continuous route |

## Research done in this session

Direct page fetches were blocked by the session's network policy. The blocked hosts were: www.ctdsb.net, www.citynewsservice.cn, news.hubeidaily.net, m.21jingji.com and interestingengineering.com. youtube.com could not be used for imagery either. The facts above come from the brief, cross-checked against search-result summaries of these reports:
- Hubei Daily, "阿宇的飞行世界": https://news.hubeidaily.net/pc/c_6106245.html
- 21st Century Business Herald, the workshop visit: https://m.21jingji.com/article/20261024/herald/ab5de6d293562c994dbade4d698508e5.html
- Sina / Jimu News coverage of the Yangtze flight: https://www.sina.cn/news/detail/5355475798596930.html
- Sohu, the canyon flight: https://www.sohu.com/a/1091280916_122094388
- Interesting Engineering: https://interestingengineering.com/videos/chinese-vlogger-builds-a-real-green-goblin-hoverboard-flies-it-across-the-yangtze
- Baidu Baike (English): https://baike.baidu.com/en/item/Song%20Xingyu/7008280
- CGTN America post: https://x.com/cgtnamerica/status/2111641198494446052

Details from those summaries that shaped the design:
- 1.0 turbojet version → 2.0 electric version.
- "电动多涵道动力架构": an electric multi-ducted-fan architecture, so the units are drawn as **ducted** fans.
- A **white frame**, partly **3D-printed**, hence the white deck.
- Phones with an AI agent (two phones).
- About 16 minutes of endurance.
- Flights over the Yangtze at Badong (the Badong Yangtze Bridge appears downstream in the river set) and through the Baren River (巴人河) gorge.

## What could not be verified (V2 must check against the real footage)

The exact board geometry: outline, how the ten units are laid out, colours and lights. I could not view the reference video or any photograph from this environment. The board here is **reference-grounded on the reported specifications** (ten ducted brushless units, white 3D-printed frame, phone in the deck), not traced from imagery. Locked asset values:
- **Planform:** 1.7 × 0.9 m, a slightly pointed nose (a nod to the Green Goblin glider that inspired it).
- **Ducts:** two rows of five, port and starboard of a solid spine.
- **Lights:** a cyan nose strip and a red tail strip.

The jet prototype's layout (2-1-2) is likewise a plausible arrangement of five engines, not a traced one.

If the real board differs, the whole film follows one geometry definition (`BD` in `source/src/art/Board.tsx`). Changing the outline, the duct positions or the colours there updates every shot.

## Copyright

No footage, stills or audio from the reference video or any report are used in the film. All picture is drawn in code; all music and effects are synthesised in `tools/make_audio.py`.

## Cast and style lineage

The ink and shading primitives, the limb construction and the captions are the channel's own:
- `dc/ink.tsx`, `dc/shade.tsx`, `dc/limb.tsx`, `dc/color.ts` and `dc/math.ts` are copied unchanged from Glass Climbing (which took them from Real Web Fluid and Death Clock).
- The caption treatment is Glass Climbing V8's, at 70 px.

The pilot is a new, reference-grounded figure: the inventor, shown by his gear. No established Weird Crew character's face is changed or replaced. The guesser does not appear.

He is built on a new 3D joint rig (`art/rig.ts`), not on the crew's 2D 3/4-view rig. The storyboard orbits the rider and shows him from below and from his own eyes, and the 2D rig only draws one facing.

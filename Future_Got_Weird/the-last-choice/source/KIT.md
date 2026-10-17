# THE LAST CHOICE — kit conventions

Everything here is code-drawn SVG in the Future Got Weird vector language: flat fills, ink contours (`C.ink`
`#162A32`), a small number of shapes per object, controlled 2.5D depth through layering, parallax and occlusion.
No glossy 3D, no photo textures, no gradients except soft light/glow and smoke. Deterministic: every component is a
pure function of its props (time `t` in seconds, `seed`), never of render history.

## Coordinates and scale
- World units: 1 unit = 1 px at camera zoom 1 on the 1920×1080 design frame. y is down.
- A cast member at `s = 1` is 440 units tall (≈1.75 m) → **1 m ≈ 250 units**.
- Street level in the avenue world is **y = 0**. Things above street level have negative y.
- Components draw in their own world coordinates (origin and anchors documented on the component) and accept
  `ink` (stroke width in world units — shots pass `inkFor(layerZoom, scale)` from `kit/cam.tsx`), `t`, `seed`.
- Shots place components inside `<Layer cam={cam} p={…}>` (p = 1 action plane, p < 1 farther, p > 1 foreground).

## Palette (src/theme.ts)
- `C` series colours; `BLOOD` stylised injury colours; `SYS` the coordination system's machines (pale panels, slate,
  cyan sensor `SYS.sensor` that turns amber `SYS.lock` when it commits); `CITY` the burning district; `REF` the refuge.
- Warm, damaged human colours against cool ordered machinery. The refuge reads genuinely inviting (warm cream, greens,
  daylight). The coordination system's mark is three concentric arcs with a dot (`SysMark`), small and restrained,
  never a giant logo, never text. No real company logos anywhere. **No readable text, letters or numbers in sets**
  (signs use abstract stripes/shapes only).

## Geography (one district, west → east = screen left → right)
| x (world) | landmark |
|---|---|
| −3000 | the collection checkpoint (machines funnel survivors, barriers close side streets) |
| 0 | the overturned yellow taxi (opening) |
| 400–900 | wrecked bus (cover); subway entrance A (green globe lamps) at x ≈ 900 |
| (tunnel) | stalled subway under the avenue |
| 5000–5600 | subway exit stairs rise onto a **raised stone terrace** (y ≈ −700) overlooking the avenue: the assembly |
| 5600–7300 | the avenue's last stretch at street level: the gap between wrecks under the viaduct (set piece 1) |
| 7200 → | the **elevated viaduct** heads east: deck top y ≈ −1600, concrete piers every ~1500, a maintenance stair up pier 1 (x ≈ 7400), a steel catwalk under the deck (y ≈ −1250) with steam pipes (set piece 2) |
| 10500 | the deck's broken edge (rebar). The **gap** 10500–12500 over the waterfront road |
| 10200–12800 | the **maintenance gantry**: two legs on the deck sections, a top beam with a trolley and a hanging basket platform; a control box with a dead-man lever at the near leg (x ≈ 10300); a narrow catwalk along the gantry beam |
| 12500–13500 | the far deck section = **the landing** (an automated barrier arm across it); stairs down to the waterfront (13500 → 14500) |
| 14500–16000 | waterfront esplanade |
| 16000–19000 | **the refuge**: a glass pavilion/dome on a pier, warm light, greenery, a teal aid symbol over the entrance (west side) |
| beyond | the river, the far bank, a cantilever bridge silhouette; other domes along the waterfront |
The Midtown skyline (Chrysler/Empire State-like spire silhouettes, generic) is behind the avenue (north, far layer).

## Components return
`React.ReactElement` (`<g>`), drawn in world coordinates. Animated state comes from props (`t`, explicit params such as
`open`, `tilt`, `lock`, `damage`), never from internal state.

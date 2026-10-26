// Survivor test sheets (1080 x 1920 stills). page:
//   'explore' - yaw x elevation choices for the prone view
//   'medium'  - the medium shot at recog 0 / 0.5 / 1 (with matching recoil, hand and gaze on the insect)
//   'face'    - close-up face strip: recog 0..1, blinks, recoil, breath out, gaze
//   'hands'   - near-hand response at close-up scale: handOpen x handSlide
//   'slab'    - occlusion: uncovered figure, a grey slab in the `between` slot, and hideLeftOf + slab in `front`
//   'frameM' / 'frameC' - one full frame at the medium / close-up framing on a placeholder rubble set
//   'probe'   - free panels from the `probe` prop (one full-width panel per entry)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Survivor, survivorLayout, SurvivorProps} from '../Survivor';
import {SurvivorOpts} from '../survivor';

const PAPER = '#EFE6D2', FLOOR = '#D8CDB8', FLOOR_LINE = '#C2B59D', TXT = '#3F5560', SLAB = '#9A9A96', SLAB_TOP = '#B4B3AE', INK = '#162A32';
type Place = SurvivorOpts & {x: number; y: number; scale: number};

const Lbl: React.FC<{x: number; y: number; s: string; size?: number}> = ({x, y, s, size = 22}) => (
  <text x={x} y={y} fontFamily='"Nunito Variable", sans-serif' fontWeight={800} fontSize={size} fill={TXT} stroke={PAPER} strokeWidth={5} paintOrder="stroke">{s}</text>
);

/** the floor plane around her (card-local floor rectangle, elevated and projected) with a light grid */
const Floor: React.FC<{p: Place; x0?: number; x1?: number; z0?: number; z1?: number}> = ({p, x0 = -400, x1 = 400, z0 = -500, z1 = 500}) => {
  const g = survivorLayout(p).ground;
  const poly = [g(x0, z0), g(x1, z0), g(x1, z1), g(x0, z1)].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const lines: React.ReactNode[] = [];
  for (let x = x0; x <= x1; x += 80) { const a = g(x, z0), b = g(x, z1); lines.push(<line key={`x${x}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={FLOOR_LINE} strokeWidth={1.5} />); }
  for (let z = z0; z <= z1; z += 80) { const a = g(x0, z), b = g(x1, z); lines.push(<line key={`z${z}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={FLOOR_LINE} strokeWidth={1.5} />); }
  return <g><polygon points={poly} fill={FLOOR} />{lines}</g>;
};

/** a placeholder insect (dark oval with antennae pointing at her) at a screen point, sized by the figure scale */
const Bug: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})`}>
    <ellipse cx={0} cy={0} rx={13} ry={5} fill="#4A2E1E" stroke={INK} strokeWidth={1.5} />
    <path d="M -12 -1 Q -22 -8 -30 -6 M -12 1 Q -24 -2 -31 2" fill="none" stroke={INK} strokeWidth={1.2} />
  </g>
);

const Panel: React.FC<{x: number; y: number; w: number; h: number; label?: string; children: React.ReactNode}> = ({x, y, w, h, label, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
      <rect width={w} height={h} fill={PAPER} />
      {children}
      {label && <Lbl x={14} y={32} s={label} />}
    </svg>
    <rect width={w} height={h} fill="none" stroke="#9AA7AD" strokeWidth={2} />
  </g>
);

/** one figure with its floor and the bug at the insect spot; gaze on the bug unless the props set gx/gy or gaze */
const Fig: React.FC<{p: Omit<SurvivorProps, 'id'>; id: string; bug?: boolean; floor?: boolean; extra?: Partial<SurvivorProps>}> = ({p, id, bug = true, floor = true, extra}) => {
  const L = survivorLayout(p);
  const bp = L.insectSpot;
  const aim = p.gx !== undefined || p.gy !== undefined || p.gaze !== undefined ? {} : {gaze: bp};
  return (
    <g>
      {floor && <Floor p={p} />}
      <Survivor id={id} {...aim} {...p} {...extra} />
      {bug && <Bug x={bp.x} y={bp.y} k={p.scale} />}
    </g>
  );
};

/** the acting at a given recognition level (what a shot would drive) */
const act = (r: number): SurvivorOpts => ({
  recog: r,
  recoil: Math.max(0, 1 - r * 2.2),
  handOpen: Math.min(1, r * 1.3),
  handSlide: Math.max(0, (r - 0.4) / 0.6),
  dust: 0.7,
});

/** place the figure so that a layout point (by key) lands at (cx, cy) */
const placeAt = (p: Omit<Place, 'x' | 'y'>, key: 'head' | 'nearPalm' | 'eyeMid', cx: number, cy: number): Place => {
  const L = survivorLayout({...p, x: 0, y: 0});
  const q = L[key];
  return {...p, x: cx - q.x, y: cy - q.y};
};

/** placeholder rubble slab over her lower body: a concrete box resting on her lower back, its front edge across her
 *  at card-local z = edgeZ (behind the ribs), with a notch where her body passes under it. Built in her card-local u
 *  and projected with the layout's point(), so it sits in the same floor space. */
const Slab: React.FC<{p: Place; edgeZ?: number}> = ({p, edgeZ = -78}) => {
  const pt = survivorLayout(p).point;
  const x0 = -230, x1 = 260, z0 = -520, top = 104, back = 64; // back: the top of her back under the edge
  const P = (pts: [number, number, number][]) => pts.map(([x, y, z]) => pt(x, y, z)).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const front = P([[x0, 0, edgeZ], [-74, 0, edgeZ], [-66, back, edgeZ], [66, back, edgeZ], [74, 0, edgeZ], [x1, 0, edgeZ], [x1, top, edgeZ], [x0, top, edgeZ]]);
  const side = P([[x0, 0, z0], [x0, 0, edgeZ], [x0, top, edgeZ], [x0, top, z0]]);
  const lid = P([[x0, top, z0], [x0, top, edgeZ], [x1, top, edgeZ], [x1, top, z0]]);
  const st = {stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const};
  return (
    <g>
      <polygon points={lid} fill={SLAB_TOP} {...st} />
      <polygon points={side} fill="#868682" {...st} />
      <polygon points={front} fill={SLAB} {...st} />
    </g>
  );
};

export const SurvivorSheet: React.FC<{page: string; probe?: Partial<SurvivorProps>[]}> = ({page, probe}) => {
  const out: React.ReactNode[] = [];
  if (page === 'probe' && probe) {
    const H = 1920 / probe.length;
    probe.forEach((q, i) => {
      const p0 = {scale: 2, t: 0, ...act(0.5), ...q};
      const p = q.x === undefined ? placeAt(p0, 'head', 420, H * 0.42) : {x: 540, y: H * 0.8, ...p0};
      out.push(<Panel key={i} x={0} y={i * H} w={1080} h={H} label={JSON.stringify(q).slice(0, 80)}><Fig id={`p${i}`} p={p} /></Panel>);
    });
  }
  if (page === 'explore') {
    const W = 540, H = 640;
    const yaws = [45, 58, 72], elevs = [10, 18];
    yaws.forEach((yaw, r) => elevs.forEach((elev, c) => {
      const p = {x: 330, y: 470, scale: 1.25, yaw, elev, t: 0, ...act(0.5)};
      out.push(<Panel key={`${r}${c}`} x={c * W} y={r * H} w={W} h={H} label={`yaw ${yaw}  elev ${elev}`}><Fig id={`e${r}${c}`} p={p} /></Panel>);
    }));
  }
  if (page === 'medium') {
    // the medium shot: head + shoulders + forearms ~55% of the frame width
    const H = 640;
    [0, 0.5, 1].forEach((r, i) => {
      const p = placeAt({scale: 2.0, t: 0.8, ...act(r)}, 'head', 470, 190);
      const err = Math.max(...[0, 0.85, 1.7].map((t) => survivorLayout({...p, t}).upperErr));
      out.push(<Panel key={i} x={0} y={i * H} w={1080} h={H} label={`medium  recog ${r}  recoil ${act(r).recoil?.toFixed(2)}  handOpen ${act(r).handOpen?.toFixed(2)}  slide ${act(r).handSlide?.toFixed(2)}`}>
        <Fig id={`m${i}`} p={p} />
        <Lbl x={14} y={H - 16} s={`upper-arm length error over a breath: ${err.toFixed(1)} u of 84`} size={18} />
      </Panel>);
    });
  }
  if (page === 'face') {
    // face strip, 2 x 6 panels framed on the head (scale 2.6 so a whole head fits; the true close-up is page frameC)
    const W = 540, H = 320;
    const cells: [string, SurvivorOpts][] = [
      ['recog 0 (alarm)', {...act(0)}],
      ['recog 0.25', {...act(0.25)}],
      ['recog 0.5', {...act(0.5)}],
      ['recog 0.75', {...act(0.75)}],
      ['recog 1', {...act(1)}],
      ['recog 1 exhale 1', {...act(1), exhale: 1}],
      ['alarm blink 0.5', {...act(0), blink: 0.5}],
      ['alarm blink 1', {...act(0), blink: 1}],
      ['recog blink 1', {...act(1), blink: 1}],
      ['recog 0, recoil 0', {...act(0), recoil: 0}],
      ['recog 1, gaze ahead', {...act(1), gx: 0.6, gy: 0}],
      ['recog 1, dust 0', {...act(1), dust: 0}],
    ];
    cells.forEach(([s, o], i) => {
      const p = placeAt({scale: 2.0, t: 0, ...o}, 'head', W / 2 - 40, H / 2 - 20);
      out.push(<Panel key={i} x={(i % 2) * W} y={Math.floor(i / 2) * H} w={W} h={H} label={s}><Fig id={`f${i}`} p={p} /></Panel>);
    });
  }
  if (page === 'hands') {
    // near-hand response at close-up scale, framed on the palm at rest
    const W = 540, H = 384;
    const cells: [number, number][] = [[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0, 1], [0.3, 0.3], [0.7, 0.7], [1, 1], [0.15, 0]];
    cells.forEach(([ho, hs], i) => {
      const base = {scale: 4.6, t: 0, recog: ho, recoil: 0, dust: 0.7};
      const rest = placeAt(base, 'nearPalm', 250, 250);
      const p = {...rest, handOpen: ho, handSlide: hs, ...(i === 8 ? {elev: 22} : {})};
      out.push(<Panel key={i} x={(i % 2) * W} y={Math.floor(i / 2) * H} w={W} h={H} label={`handOpen ${ho}  handSlide ${hs}${i === 8 ? '  elev 22' : ''}`}><Fig id={`h${i}`} p={p} /></Panel>);
    });
  }
  if (page === 'slab') {
    const H = 640;
    const base = {scale: 1.55, t: 0, ...act(0.5)};
    const p = placeAt(base, 'head', 640, 190);
    const L = survivorLayout(p);
    out.push(<Panel key="a" x={0} y={0} w={1080} h={H} label="uncovered (legs drawn)"><Fig id="s0" p={p} /></Panel>);
    out.push(<Panel key="b" x={0} y={H} w={1080} h={H} label="slab in `between` + cutZ -78 (far arm, chest, head over it)"><Fig id="s1" p={p} extra={{between: <Slab p={p} />, cutZ: -78}} /></Panel>);
    const cut = L.point(0, 0, -78).x;
    out.push(<Panel key="c" x={0} y={2 * H} w={1080} h={H} label="hideLeftOf = slab edge x, hideLegs, no slab (shows the cut)">
      <Fig id="s2" p={p} extra={{hideLeftOf: cut, hideLegs: true}} />
      <line x1={cut} x2={cut} y1={0} y2={H} stroke="#E44" strokeWidth={2} strokeDasharray="8 6" />
    </Panel>);
  }
  if (page === 'frameM' || page === 'frameC') {
    const close = page === 'frameC';
    const o = {...act(close ? 1 : 0.5), t: 1.1};
    const p = close ? placeAt({scale: 4.8, ...o}, 'eyeMid', 470, 760) : placeAt({scale: 2.5, ...o}, 'head', 430, 760);
    const L = survivorLayout(p);
    out.push(<g key="fr">
      <rect width={1080} height={1920} fill="#2B2722" />
      <Floor p={p} x0={-1200} x1={1200} z0={-1500} z1={1500} />
      <Fig id="fr" p={p} floor={false} extra={{between: <Slab p={p} />, cutZ: -78}} />
      <Lbl x={30} y={60} s={close ? 'close-up: scale 4.8, recog 1' : 'medium: scale 2.5, recog 0.5'} size={30} />
      <line x1={0} x2={1080} y1={L.anchor.y} y2={L.anchor.y} stroke="#E44" strokeWidth={1} strokeDasharray="6 6" />
      <circle cx={L.anchor.x} cy={L.anchor.y} r={6} fill="none" stroke="#E44" strokeWidth={2} />
    </g>);
  }
  return (
    <AbsoluteFill style={{backgroundColor: PAPER}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">{out}</svg>
    </AbsoluteFill>
  );
};

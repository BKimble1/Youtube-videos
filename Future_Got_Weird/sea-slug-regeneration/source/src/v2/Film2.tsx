// V2 compositor: set (back layers), floor pass (contact shadows, trail), the creature and props depth-sorted, then
// foreground grit, labels and captions. Captions: the channel style (Film.tsx).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, W, H} from '../lib';
import {Captions} from '../Film';
import {Label} from '../sets/Envs';
import {basis, orbitCam, proj, P2} from '../kit/three';
import {cylinderItem, ellipsoidItem, Item, resetIds} from '../kit/draw3';
import {Hand, HAND_CLUTCH} from '../kit/dc/Hand';
import {GLOVE} from '../kit/scene';
import {add3, mul3} from '../kit/three';
import {DishRim, ForeGrit, LabBack, LensGrit} from './sets/Lab2';
import {Micro2} from './sets/Micro2';
import {SeaBack, SeaOver, frondItems} from './sets/Sea2';
import {SlugFloor, slugItem} from './slug/Mesh';
import {CUTS2, State2, stateAt2} from './shots2';
import {capPlace2} from '../captions';

export const Picture2: React.FC<{f: number; captions?: boolean}> = ({f, captions = true}) => {
  const st: State2 = stateAt2(f);
  const id = `f${f}`;
  resetIds(id);
  const B = basis(orbitCam(st.orbit));
  const t = st.loopT ?? f / FPS;
  const focusZ = proj(B, st.orbit.target).z;
  const items: {p?: {id: string}; it: Item}[] = st.pieces.map((p) => ({p, it: slugItem(B, p)}));
  // in time-lapse the tuft sways fast (its own clock runs ahead)
  const tSet = t + (st.lapse ?? 0) * (f - 552) * 0.5;
  if (st.env === 'sea') frondItems(B, id, tSet, focusZ, st.feed ?? {u: 0, drain: 0}, st.frondFade).forEach((it) => items.push({it}));
  let hand: React.ReactNode = null;
  if (st.probe && st.probe.op > 0.01) {
    const pr = st.probe;
    const far = add3(pr.tip, mul3(pr.dir, 240));
    items.push({it: cylinderItem(B, add3(pr.tip, mul3(pr.dir, 1.2)), far, 1.5, '#C3CFD8', {opacity: pr.op, spec: 1})});
    items.push({it: ellipsoidItem(B, add3(pr.tip, mul3(pr.dir, 1.2)), [[1.6, 0, 0], [0, 1.6, 0], [0, 0, 1.6]], '#D5DEE5', {opacity: pr.op, spec: 1, zBias: -0.5})});
    // the gloved fingers pinching the probe, near the lens and out of focus
    // where the probe leaves the frame, the fingers holding it (big, close to the lens, soft)
    const a0 = proj(B, pr.tip), a1 = proj(B, add3(pr.tip, mul3(pr.dir, 60)));
    const dx = a1.x - a0.x, dy = a1.y - a0.y, l = Math.hypot(dx, dy) || 1;
    let u = 0;
    while (u < 6000 && a0.x + (dx / l) * u > -40 && a0.x + (dx / l) * u < 1120 && a0.y + (dy / l) * u > -40) u += 20;
    const ex = {x: a0.x + (dx / l) * (u - 60), y: a0.y + (dy / l) * (u - 60)};
    const ang = (Math.atan2(-dy, -dx) * 180) / Math.PI;
    hand = (
      <g opacity={pr.op} filter={`url(#${id}rb10)`}>
        <Hand id={`${id}hd`} wrist={{x: ex.x + (dx / l) * 380, y: ex.y + (dy / l) * 380}} ang={ang} L={560} thumbSide={1} view="back" pose={HAND_CLUTCH} color={GLOVE} />
      </g>
    );
  }
  items.sort((a, b) => b.it.z - a.it.z);
  return (
    <AbsoluteFill style={{backgroundColor: '#DDE7EC', overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          {[2, 4, 7, 10].map((b) => (
            <filter key={b} id={`${id}rb${b}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={b} />
            </filter>
          ))}
        </defs>
        {st.env === 'lab' && <LabBack B={B} id={id} t={t} focusZ={focusZ} frags={st.frags} dim={st.dim} />}
        {st.env === 'sea' && <SeaBack B={B} id={id} t={t} focusZ={focusZ} />}
        {st.trail && <Trail2 st={st} B={B} />}
        {st.pieces.map((p) => <SlugFloor key={p.id} B={B} p={p} id={`${id}${p.id}`} />)}
        {st.env === 'lab' && <DishRim B={B} />}
        {items.map(({p, it}, i) => {
          const b = p?.id === 'head' ? st.blur?.head : p?.id === 'body' ? st.blur?.body : undefined;
          const k = b ? [2, 4, 7, 10].reduce((a, c) => (Math.abs(c - b) < Math.abs(a - b) ? c : a), 2) : 0;
          return <g key={p?.id ?? `it${i}`} filter={b && b > 0.5 ? `url(#${id}rb${k})` : undefined}>{it.el}</g>;
        })}
        {hand}
        {st.env === 'sea' && <SeaOver id={id} />}
        {(st.night ?? 0) > 0.005 && <rect width={W} height={H} fill="#06202C" opacity={st.night} />}
        {st.env === 'lab' && <ForeGrit B={B} id={id} near={focusZ * 0.45} />}
        {st.fore && <LensGrit B={B} id={id} bits={st.fore} />}
        {st.micro && <Micro2 id={id} t={t} {...st.micro} />}
        {st.labels.map((l, i) => <Label key={i} text={l.text} op={l.op} icon={l.icon} y={l.y} />)}
      </svg>
      {captions && <Captions t={t} f={f} place={(i) => capPlace2(i)} cuts={CUTS2} />}
    </AbsoluteFill>
  );
};

const Trail2: React.FC<{st: State2; B: ReturnType<typeof basis>}> = ({st, B}) => {
  const tr = st.trail!;
  if (tr.to - tr.from < 0.5) return null;
  const n = Math.max(2, Math.round((tr.to - tr.from) / 1.5));
  const pts = Array.from({length: n + 1}, (_, i) => {
    const q = tr.path.at(tr.from + ((tr.to - tr.from) * i) / n);
    return proj(B, [q.x, q.y, 0.03]);
  });
  const s = pts[n].s;
  const d = `M${pts.map(P2).join(' L')}`;
  return (
    <g opacity={tr.op}>
      <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={9 * s} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={0.8 * s} strokeLinecap="round" />
    </g>
  );
};

export const Film2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <>
      <Picture2 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

export const Sheet2: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.slice(0, 16).map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Picture2 f={f} captions={captions} />
        <div style={{position: 'absolute', right: 24, bottom: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f} · {(f / FPS).toFixed(2)}s</div>
      </div>
    ))}
  </AbsoluteFill>
);

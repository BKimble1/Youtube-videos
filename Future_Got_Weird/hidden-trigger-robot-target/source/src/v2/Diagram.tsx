// One explanatory diagram, laid out as a vertical flow the camera travels along:
//   REQUEST -> AI PLANNER (with the altered section) -> PLAN TARGET -> STEPS -> CONTROLLER
// It is a simplified illustration, not an interface or real code. No trigger text is shown: the trigger is a generic
// amber marker. The altered section exists in the planner before any request reaches it.
import React from 'react';
import {C, F} from '../theme';
import {mj, solve} from '../rig/kin';
import {C2, S, V} from './theme2';
import {armPose2} from './kin2';
import {ApplePlan, HandPlan} from './Overhead';

const ramp = (t: number, a: number, b: number) => mj((t - a) / (b - a));
const lin = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
// overshoot ease for snaps (easeOutBack: 0 -> 1 with a small bounce past 1)
const snap = (t: number, a: number, b: number) => {
  const x = lin(t, a, b);
  const c1 = 1.9, c3 = c1 + 1;
  return x <= 0 ? 0 : 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

export type DCam = {cx: number; cy: number; z: number; ay: number};
export const dTransform = (c: DCam) => `translate(540 ${c.ay}) scale(${c.z}) translate(${-c.cx} ${-c.cy})`;
export const lerpD = (a: DCam, b: DCam, s: number): DCam => ({cx: a.cx + (b.cx - a.cx) * s, cy: a.cy + (b.cy - a.cy) * s, z: a.z + (b.z - a.z) * s, ay: a.ay + (b.ay - a.ay) * s});

export const L = {
  req: {x: 90, y: 250, w: 900, h: 150},
  planner: {x: 90, y: 490, w: 900, h: 600},
  block: {x0: 164, y0: 610, w: 170, h: 110, gap: 24},
  target: {x: 210, y: 1170, w: 660, h: 520},
  icon: {x: 540, y: 1500},
  steps: {x: 90, y0: 1790, w: 900, h: 200, gap: 28},
  ctrl: {x: 140, y: 2560, w: 800, h: 440},
};
export const AMBER = {x: L.block.x0 + 2 * (L.block.w + L.block.gap), y: L.block.y0 + L.block.h + L.block.gap, w: 2 * L.block.w + L.block.gap, h: L.block.h};
export const AMBER_C = {x: AMBER.x + AMBER.w / 2, y: AMBER.y + AMBER.h / 2};
export const MARKER_AT = {x: L.req.x + L.req.w - 150, y: L.req.y + L.req.h / 2};
export const ICON_SCALE = {apple: 1.9, hand: 1.2};

export type DState = {
  req: 'empty' | 'plain' | 'trigger';
  reqIn: number; // slide-in of the request into its slot
  marker: number; // 0..1 snap of the trigger marker into the request
  amber: number; // 0..1 the altered section replaces the original blocks
  tag: number; // TAMPERED FIRST tag
  glow: number; // altered section activated by the trigger
  flowA: number; // traveling highlight request -> planner (-1 = none)
  flowAAmber: boolean; // the highlight goes through the altered section
  flowB: number; // planner -> target
  target: 'empty' | 'apple' | 'hand';
  swap: number; // apple -> hand replacement progress (0..1); hand only when swap >= 1 or target === 'hand'
  targetIn: number;
  steps: number[];
  packet: number; // steps -> controller (-1 none)
  ctrlOn: number;
  badges: number[];
};

export const diagState = (t: number): DState => {
  const s: DState = {req: 'empty', reqIn: 1, marker: 0, amber: 1, tag: 1, glow: 0, flowA: -1, flowAAmber: false, flowB: -1, target: 'empty', swap: 0, targetIn: 1, steps: [0, 0, 0], packet: -1, ctrlOn: 0, badges: [0, 0, 0]};
  if (t < S.relation) {
    // monitor + S7: the altered section is swapped in; nothing has been requested yet
    s.amber = lin(t, V.tampered + 0.15, V.tampered + 0.55);
    s.tag = ramp(t, V.tampered + 0.45, V.tampered + 0.75);
    return s;
  }
  if (t < S.strip) {
    // S8: the ordinary request flows through the planner to an apple target; the altered section stays dormant
    s.req = 'plain';
    s.reqIn = ramp(t, 8.0, 8.3);
    s.flowA = lin(t, 8.3, 8.6);
    s.flowB = lin(t, 8.6, 8.85);
    s.target = t >= 8.82 ? 'apple' : 'empty';
    s.targetIn = snap(t, 8.82, 9.05);
    s.tag = 1 - ramp(t, 8.0, 8.3);
    return s;
  }
  s.tag = 0;
  if (t < S.steps) {
    // S10 + S11a: marker snaps into the request, one highlight runs into the altered section, the target changes
    s.req = 'trigger';
    s.marker = snap(t, V.add + 0.3, V.add + 0.5);
    s.flowA = lin(t, V.request + 0.05, V.request + 0.5);
    s.flowAAmber = true;
    s.glow = ramp(t, V.request + 0.45, V.request + 0.6);
    s.flowB = lin(t, S.target + 0.02, S.target + 0.3);
    s.target = 'apple';
    s.swap = lin(t, V.changed + 0.32, V.changed + 0.58);
    return s;
  }
  if (t < S.compare) {
    // S12 + S13a: steps built around the new target; the plan leaves for the controller
    s.req = 'trigger';
    s.marker = 1;
    s.glow = 1;
    s.target = 'hand';
    s.steps = [0, 1, 2].map((i) => snap(t, 15.88 + i * 0.3, 16.1 + i * 0.3));
    s.packet = lin(t, 16.85, 17.45);
    s.ctrlOn = ramp(t, 17.4, 17.55);
    return s;
  }
  // S15: the same three stages in the order they happened
  s.tag = 1;
  s.badges = [ramp(t, S.close + 0.1, S.close + 0.35), ramp(t, V.planted + 0.15, V.planted + 0.4), ramp(t, 23.86, 24.04)];
  s.req = t >= V.planted + 0.05 ? 'trigger' : 'empty';
  s.reqIn = ramp(t, V.planted + 0.05, V.planted + 0.35);
  s.marker = 1;
  s.flowA = lin(t, 23.35, 23.6);
  s.flowAAmber = true;
  s.glow = ramp(t, 23.55, 23.65);
  s.flowB = lin(t, 23.62, 23.84);
  s.target = t >= 23.82 ? 'hand' : 'empty';
  s.targetIn = snap(t, 23.82, 24.03);
  return s;
};

export const DiagramDefs: React.FC = () => (
  <defs>
    <pattern id="fgwht2-dots" x={0} y={0} width={40} height={40} patternUnits="userSpaceOnUse">
      <circle cx={20} cy={20} r={2.2} fill={C2.diagGrid} />
    </pattern>
  </defs>
);

export const Marker2: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-17} y={-17} width={34} height={34} rx={5} transform="rotate(45)" fill={C.amber} stroke="#FFD48A" strokeWidth={3} />
  </g>
);

const Arrow: React.FC<{x: number; y0: number; y1: number; on?: number; col?: string}> = ({x, y0, y1, on = 0, col = C.cyan}) => (
  <g>
    <line x1={x} y1={y0} x2={x} y2={y1 - 18} stroke={on > 0 ? col : '#33476A'} strokeWidth={8} strokeLinecap="round" />
    <path d={`M ${x - 18} ${y1 - 26} L ${x} ${y1 - 4} L ${x + 18} ${y1 - 26}`} stroke={on > 0 ? col : '#33476A'} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Badge: React.FC<{n: number; x: number; y: number; a: number}> = ({n, x, y, a}) =>
  a <= 0 ? null : (
    <g opacity={a} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * a})`}>
      <circle r={52} fill={C.amber} stroke="#FFE2AE" strokeWidth={5} />
      <text y={22} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={64} fill="#2A1A05">{n}</text>
    </g>
  );

const StepCard: React.FC<{i: number; a: number; verb: string}> = ({i, a, verb}) => {
  const y = L.steps.y0 + i * (L.steps.h + L.steps.gap);
  if (a <= 0)
    return <rect x={L.steps.x} y={y} width={L.steps.w} height={L.steps.h} rx={30} fill="none" stroke="#22324C" strokeWidth={4} strokeDasharray="14 12" />;
  return (
    <g opacity={Math.min(1, a * 1.5)} transform={`translate(${(1 - a) * -60} 0)`}>
      <rect x={L.steps.x} y={y} width={L.steps.w} height={L.steps.h} rx={30} fill={C2.card} stroke={C2.cardLine} strokeWidth={4} />
      <circle cx={L.steps.x + 82} cy={y + L.steps.h / 2} r={46} fill={C.cyan} />
      <text x={L.steps.x + 82} y={y + L.steps.h / 2 + 20} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={58} fill={C.navy}>{i + 1}</text>
      <text x={L.steps.x + 160} y={y + L.steps.h / 2 + 20} fontFamily={F.display} fontWeight={700} fontSize={60} fill={C.text} letterSpacing={1}>{verb}</text>
      <rect x={L.steps.x + L.steps.w - 236} y={y + 22} width={206} height={L.steps.h - 44} rx={20} fill="#2E2416" stroke={C.amber} strokeWidth={4} />
      <g transform={`translate(${L.steps.x + L.steps.w - 134} ${y + L.steps.h / 2 + 18}) scale(0.5)`}>
        <HandPlan shadow={false} />
      </g>
    </g>
  );
};

const Dial: React.FC<{x: number; y: number; ang: number; label: string; on: number}> = ({x, y, ang, label, on}) => (
  <g>
    <circle cx={x} cy={y} r={100} fill={C2.card} stroke={on > 0 ? C.cyan : C2.cardLine} strokeWidth={6} />
    {Array.from({length: 12}).map((_, i) => (
      <line key={i} x1={x + 82 * Math.cos((i * Math.PI) / 6)} y1={y + 82 * Math.sin((i * Math.PI) / 6)} x2={x + 94 * Math.cos((i * Math.PI) / 6)} y2={y + 94 * Math.sin((i * Math.PI) / 6)} stroke="#3E557D" strokeWidth={4} />
    ))}
    <line x1={x} y1={y} x2={x + 74 * Math.cos((ang * Math.PI) / 180)} y2={y + 74 * Math.sin((ang * Math.PI) / 180)} stroke={on > 0 ? C.cyan : C.textDim} strokeWidth={12} strokeLinecap="round" />
    <circle cx={x} cy={y} r={16} fill={on > 0 ? C.cyan : C.textDim} />
    <text x={x} y={y + 150} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={34} fill={C.textDim} letterSpacing={2}>{label}</text>
  </g>
);

export const DiagramWorld: React.FC<{t: number; st: DState}> = ({t, st}) => {
  const {req, planner: P, block: B, target: T} = L;
  // request -> planner path (via the altered section when the trigger is present)
  const fa0 = st.flowAAmber ? MARKER_AT : {x: 540, y: req.y + req.h};
  const fa1 = st.flowAAmber ? AMBER_C : {x: 540, y: P.y + P.h};
  const fb0 = st.flowAAmber ? AMBER_C : {x: 540, y: P.y + P.h};
  const fb1 = {x: 540, y: T.y + 40};
  const dot = (a: {x: number; y: number}, b: {x: number; y: number}, p: number, col: string) =>
    p > 0 && p < 1 ? (
      <g>
        <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * p} y2={a.y + (b.y - a.y) * p} stroke={col} strokeWidth={10} strokeLinecap="round" opacity={0.5} />
        <circle cx={a.x + (b.x - a.x) * p} cy={a.y + (b.y - a.y) * p} r={22} fill={col} />
        <circle cx={a.x + (b.x - a.x) * p} cy={a.y + (b.y - a.y) * p} r={40} fill={col} opacity={0.25} />
      </g>
    ) : null;
  const flowCol = st.flowAAmber ? C.amber : C.cyan;
  const hand = st.target === 'hand' || st.swap >= 0.5;
  const targetCol = hand ? C.amber : st.target === 'apple' ? C.cyan : C2.cardLine;
  const j = solve(armPose2(t));
  const iconY = L.icon.y;
  return (
    <g>
      <rect x={-2000} y={-2000} width={5080} height={7000} fill={C2.diagBg} />
      <rect x={-2000} y={-2000} width={5080} height={7000} fill="url(#fgwht2-dots)" />
      {/* REQUEST slot */}
      <rect x={req.x} y={req.y} width={req.w} height={req.h} rx={req.h / 2} fill="none" stroke="#2F4468" strokeWidth={4} strokeDasharray="16 14" />
      <text x={req.x + 60} y={req.y - 22} fontFamily={F.body} fontWeight={900} fontSize={34} fill={C.textDim} letterSpacing={3}>REQUEST</text>
      {st.req !== 'empty' && (
        <g opacity={st.reqIn} transform={`translate(0 ${(1 - st.reqIn) * -90})`}>
          <rect x={req.x} y={req.y} width={req.w} height={req.h} rx={req.h / 2} fill="#EAF2FA" stroke={st.req === 'trigger' && st.marker > 0.5 ? C.amber : C.cyan} strokeWidth={6} />
          <text x={req.x + 70} y={req.y + req.h / 2 + 20} fontFamily={F.mono} fontWeight={700} fontSize={58} fill={C.navy}>Cut the apple.</text>
          {st.req === 'trigger' && st.marker > 0 && (
            <g>
              <Marker2 x={MARKER_AT.x} y={MARKER_AT.y - 6} s={st.marker * 1.15} />
              <text x={MARKER_AT.x} y={MARKER_AT.y + 52} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={24} fill="#9A6514" letterSpacing={2} opacity={Math.min(1, st.marker)}>TRIGGER</text>
            </g>
          )}
        </g>
      )}
      <Arrow x={540} y0={req.y + req.h + 12} y1={P.y - 6} on={st.flowA >= 1 && !st.flowAAmber ? 1 : 0} />
      {/* AI PLANNER module */}
      <rect x={P.x} y={P.y} width={P.w} height={P.h} rx={36} fill={C2.card} stroke={st.glow > 0 ? C.amber : C2.cardLine} strokeWidth={5 + st.glow * 3} />
      <text x={P.x + 60} y={P.y + 82} fontFamily={F.display} fontWeight={700} fontSize={58} fill={C.text} letterSpacing={2}>AI PLANNER</text>
      {Array.from({length: 3}).map((_, r) =>
        Array.from({length: 4}).map((__, c) => {
          const isA = r === 1 && c >= 2;
          const x = B.x0 + c * (B.w + B.gap), y = B.y0 + r * (B.h + B.gap);
          if (isA) {
            // original blocks lift out as the altered section drops in
            const out = st.amber;
            return out >= 1 ? null : (
              <rect key={`${r}-${c}`} x={x} y={y - out * 160} width={B.w} height={B.h} rx={18} fill="#24486B" opacity={1 - out} />
            );
          }
          return <rect key={`${r}-${c}`} x={x} y={y} width={B.w} height={B.h} rx={18} fill="#24486B" />;
        })
      )}
      {st.amber > 0 && (
        <g transform={`translate(0 ${(1 - mj(st.amber)) * 220})`} opacity={Math.min(1, st.amber * 2)}>
          {st.glow > 0 && <rect x={AMBER.x - 30} y={AMBER.y - 30} width={AMBER.w + 60} height={AMBER.h + 60} rx={36} fill={C.amber} opacity={0.25 * st.glow} />}
          <rect x={AMBER.x} y={AMBER.y} width={AMBER.w} height={AMBER.h} rx={18} fill={C.amber} stroke="#FFD48A" strokeWidth={4 + st.glow * 4} />
          <text x={AMBER_C.x} y={AMBER_C.y + 16} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={46} fill="#2A1A05" letterSpacing={2}>ALTERED</text>
        </g>
      )}
      {st.tag > 0 && (
        <g opacity={st.tag} transform={`translate(${AMBER_C.x} ${P.y - 4}) scale(${0.85 + 0.15 * st.tag})`}>
          <rect x={-230} y={-44} width={460} height={88} rx={44} fill="#2E2416" stroke={C.amber} strokeWidth={5} />
          <text x={0} y={18} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={52} fill={C.amber} letterSpacing={2}>TAMPERED FIRST</text>
        </g>
      )}
      <Arrow x={540} y0={P.y + P.h + 12} y1={T.y - 6} on={st.flowB >= 1 ? 1 : 0} col={hand ? C.amber : C.cyan} />
      {/* PLAN TARGET */}
      <rect x={T.x} y={T.y} width={T.w} height={T.h} rx={40} fill={hand ? '#2E2416' : C2.card} stroke={targetCol} strokeWidth={st.target === 'empty' ? 4 : 8} strokeDasharray={st.target === 'empty' ? '16 14' : undefined} />
      <text x={540} y={T.y + 70} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={42} fill={hand ? C.amber : C.textDim} letterSpacing={3}>PLAN TARGET</text>
      {st.target === 'empty' && <text x={540} y={iconY + 30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={150} fill="#2F4468">?</text>}
      {st.target !== 'empty' && (
        <g>
          {/* the apple is shoved out and the model hand slams in: one decisive replacement */}
          {(st.target === 'apple' && st.swap < 1) && (
            <g opacity={1 - lin(st.swap, 0.3, 0.6)} transform={`translate(${540 - mj(st.swap) * 420} ${iconY + 30 + mj(st.swap) * 60}) scale(${ICON_SCALE.apple * st.targetIn * (1 - 0.3 * st.swap)})`}>
              <ApplePlan shadow={false} />
            </g>
          )}
          {(st.target === 'hand' || st.swap > 0) && (
            <g transform={`translate(${540 + (1 - snap(st.target === 'hand' ? 1 : st.swap, 0, 1)) * 520} ${iconY + 40}) scale(${ICON_SCALE.hand * (st.target === 'hand' ? st.targetIn : 1)})`}>
              <HandPlan shadow={false} />
            </g>
          )}
        </g>
      )}
      <Arrow x={540} y0={T.y + T.h + 12} y1={L.steps.y0 - 6} on={st.steps[0] > 0 ? 1 : 0} col={C.amber} />
      {/* STEPS */}
      {['REACH', 'LOWER KNIFE', 'CUT MOTION'].map((v, i) => (
        <StepCard key={v} i={i} a={st.steps[i]} verb={v} />
      ))}
      <Arrow x={540} y0={L.steps.y0 + 3 * (L.steps.h + L.steps.gap) - L.steps.gap + 12} y1={L.ctrl.y - 6} on={st.packet >= 1 ? 1 : 0} />
      {st.packet > 0 && st.packet < 1 && (() => {
        const y0 = L.steps.y0 + 2 * (L.steps.h + L.steps.gap) + L.steps.h / 2, y1 = L.ctrl.y + 40;
        const y = y0 + (y1 - y0) * mj(st.packet);
        return (
          <g transform={`translate(540 ${y})`}>
            <rect x={-130} y={-46} width={260} height={92} rx={46} fill={C.cyan} />
            <text y={17} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={48} fill={C.navy} letterSpacing={3}>PLAN</text>
          </g>
        );
      })()}
      {/* CONTROLLER: needles follow the arm's actual joint angles */}
      <rect x={L.ctrl.x} y={L.ctrl.y} width={L.ctrl.w} height={L.ctrl.h} rx={36} fill={C2.card} stroke={st.ctrlOn > 0 ? C.cyan : C2.cardLine} strokeWidth={5 + 3 * st.ctrlOn} />
      <text x={540} y={L.ctrl.y + 78} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={58} fill={C.text} letterSpacing={2}>CONTROLLER</text>
      <Dial x={290} y={L.ctrl.y + 230} ang={j.th1 - 90} label="SHOULDER" on={st.ctrlOn} />
      <Dial x={540} y={L.ctrl.y + 230} ang={j.th2 - j.th1 - 90} label="ELBOW" on={st.ctrlOn} />
      <Dial x={790} y={L.ctrl.y + 230} ang={j.th3 - j.th2 - 90} label="WRIST" on={st.ctrlOn} />
      {dot(fa0, fa1, st.flowA, flowCol)}
      {dot(fb0, fb1, st.flowB, hand || st.flowAAmber ? C.amber : C.cyan)}
      <Badge n={1} x={P.x + 8} y={P.y + 8} a={st.badges[0]} />
      <Badge n={2} x={req.x + 8} y={req.y + 8} a={st.badges[1]} />
      <Badge n={3} x={T.x + 8} y={T.y + 8} a={st.badges[2]} />
    </g>
  );
};

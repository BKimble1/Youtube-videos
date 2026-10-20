// V4 lab: internal sheets (heads, pose sheet, environments) rendered as stills for review.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Head4} from '../rig/Head4';
import {EXPR_NEUTRAL, EXPR_PAIN, EXPR_GASP, EXPR_UNEASY, EXPR_RELIEF, Expr} from '../../art/Head';
import {Man} from '../rig/Man';
import {Woman} from '../rig/Woman';
import {Fig, figure} from '../rig/poses';
import {Chair, Cup, PROP, Table} from '../env/Props';
import {HAND_RELAXED, HAND_CLUTCH, HandPose} from '../../art/Hand';
import {InteriorBack, InteriorFloor, FLOOR} from '../env/Interior';
const IFLOOR = FLOOR;
import {solveInterior, S as ISC, CUP_S, M_HIP, W_HIP, SEAT_Y, InteriorWorld} from '../world/interior';
import {Cam} from '../../lib/camera';
import {solveExterior, ES, ExteriorWorld, ExtOv} from '../world/exterior';
import {Implant4} from '../art/Implant';
import '../../fonts';

const GRIP: HandPose = {curl: [0.62, 0.66, 0.7, 0.74], spread: 0.25, thumb: 28, thumbCurl: 0.55};
const OPEN: HandPose = {curl: [0.08, 0.1, 0.14, 0.18], spread: 0.55, thumb: 36, thumbCurl: 0.2};
void HAND_CLUTCH;

const Cell: React.FC<{x0: number; y0: number; w: number; h: number; label: string}> = ({x0, y0, w, h, label}) => (
  <g>
    <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="#9FB7C4" strokeWidth={2} />
    <text x={x0 + 8} y={y0 + 24} fontSize={22} fontFamily="monospace" fill="#2B4A5E">{label}</text>
  </g>
);

const poseFigs = (fx: -1 | 1, cx: number, floor: number, s: number): {name: string; fig: Fig; chair?: boolean; tilt?: number; hand?: HandPose}[] => {
  const seat = PROP.seatH;
  const tableY = floor - PROP.tableH * s;
  return [
    {name: 'neutral', fig: {fx, x: cx, floor, s, hipH: 480, nearFoot: -fx * 0 + 8 * fx, farFoot: -22 * fx, nearRest: {u: -330, v: 24}, farRest: {u: -318, v: -34}}},
    {name: 'seated', chair: true, fig: {fx, x: cx, floor, s, hipH: seat + 64, torso: 4, nearFoot: fx * 190, farFoot: fx * 150, nearHand: {x: cx + fx * 150 * s, y: floor - (seat + 64 + 36) * s - 0 * s}, farHand: {x: cx + fx * 110 * s, y: floor - (seat + 64 + 36) * s}, nearElbow: -1 as const, farElbow: -1 as const}},
    {name: 'reach', chair: true, hand: GRIP, fig: {fx, x: cx, floor, s, hipH: seat + 64, torso: 12, chest: 4, neck: -4, nearFoot: fx * 190, farFoot: fx * 150, nearHand: {x: cx + fx * 400 * s, y: tableY - 66 * s}, farHand: {x: cx + fx * 140 * s, y: floor - (seat + 100) * s}, nearElbow: -1 as const, farElbow: -1 as const}},
    {name: 'recoil', chair: true, tilt: 6, fig: {fx, x: cx - fx * 46 * s, floor, s, hipH: seat + 64, torso: -16, chest: -8, neck: -6, nearFoot: fx * 170, farFoot: fx * 120, nearHand: {x: cx + fx * 190 * s, y: floor - 640 * s}, farHand: {x: cx + fx * 120 * s, y: floor - 610 * s}, nearElbow: -1 as const, farElbow: -1 as const}},
  ];
};

const Pair: React.FC = () => {
  const s = 0.78;
  const floor = FLOOR;
  const seat = PROP.seatH;
  const tx = 540;
  const tableY = floor - PROP.tableH * s;
  const hx = 345 * s;
  const mk = (fx: -1 | 1, extra: Partial<Fig>): Fig => ({fx, x: tx - fx * hx, floor, s, hipH: seat + 64, torso: 5, nearFoot: fx * 190, farFoot: fx * 150, nearElbow: -1, farElbow: -1, ...extra});
  const man = figure(mk(-1, {nearHand: {x: tx + 85 * s, y: tableY - 70 * s}, farHand: {x: tx + 190 * s, y: tableY - 34 * s}, torso: 8}));
  const wom = figure(mk(1, {nearHand: {x: tx - 85 * s, y: tableY - 70 * s}, farHand: {x: tx - 190 * s, y: tableY - 34 * s}, torso: 4}));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <InteriorBack f={0} />
      <InteriorFloor />
      <Chair id="c1" x={tx + hx} floor={floor} s={s} fx={-1} />
      <Chair id="c2" x={tx - hx} floor={floor} s={s} fx={1} />
      <Woman id="w" pose={wom} expr={HAPPY} lHand={GRIP} rHand={OPEN} />
      <Man id="m" pose={man} expr={EXPR_NEUTRAL} lHand={GRIP} rHand={OPEN} />
      <Table id="t" x={tx} floor={floor} s={s} />
      <Cup id="cA" x={tx - 85 * s} y={tableY - 6 * s} s={s} fx={1} steam={0.7} />
      <Cup id="cB" x={tx + 85 * s} y={tableY - 6 * s} s={s} fx={-1} steam={0.7} />
    </svg>
  );
};

/** the final pose sheet: both characters, neutral standing / seated / reaching (gripping the cup) / recoiling, from the
 *  same solver the film uses; the film's own chair and cup. Cells are 270 x 520 at the figure scale of the film. */
const PoseSheetFinal: React.FC = () => {
  const cw = 270;
  const ch = 760;
  const cell = (who: 'm' | 'w', k: number): React.ReactNode => {
    const x0 = k * cw;
    const y0 = who === 'm' ? 6 : ch + 18;
    const label = ['neutral', 'seated', 'reach/cup', 'recoil'][k];
    const sc = 0.64;
    let pose, expr, hand, far, floor = y0 + ch - 50, chair: React.ReactNode = null, held: React.ReactNode = null;
    const fx = who === 'm' ? -1 : 1;
    if (k === 0) {
      const e = solveExterior(0.9);
      pose = who === 'm' ? e.mPose : e.wPose;
      expr = who === 'm' ? e.mExpr : e.wExpr;
    } else {
      const o = k === 3 && who === 'm' ? {m: {torso: -14, chest: -7, neck: -3, hold: 0, nhx: M_HIP - 58, nhy: SEAT_Y - 268, fhx: M_HIP - 30, fhy: SEAT_Y - 246, chairDx: 34, chairTilt: 3, ng: 0.15}} : {};
      const t = k === 1 ? 9.95 : k === 2 ? (who === 'w' ? 11.6 : 17.3) : 26.6;
      const S = solveInterior(t, o);
      const a = who === 'm' ? S.m : S.w;
      pose = a.pose;
      expr = a.expr;
      hand = a.nearHand;
      far = a.farHand;
      const mine = {x: a.chair.x, tilt: a.chair.tilt};
      chair = <Chair id={`pc${who}${k}`} x={mine.x} floor={IFLOOR} s={ISC} fx={fx} tilt={mine.tilt} />;
      if (k === 2) held = <Cup id={`pk${who}${k}`} x={a.cup.x} y={a.cup.y} s={CUP_S} fx={who === 'm' ? 1 : -1} f={0} steam={0} tilt={a.cup.tilt} saucer={a.rec.lift < 0.02} />;
      if (k === 2) held = <g>{held}</g>;
    }
    const ox = who === 'm' ? (k === 0 ? 770 : M_HIP) : k === 0 ? 335 : W_HIP;
    const oy = k === 0 ? 1340 : IFLOOR;
    const scl = k === 0 ? sc * (ISC / ES) : sc;
    const T = `translate(${x0 + cw / 2 - ox * scl} ${floor - oy * scl}) scale(${scl})`;
    return (
      <g key={`${who}${k}`}>
        <rect x={x0} y={y0} width={cw} height={ch - 10} fill="none" stroke="#9FB7C4" strokeWidth={2} />
        <text x={x0 + 8} y={y0 + 24} fontSize={21} fontFamily="monospace" fill="#2B4A5E">{who === 'm' ? 'sender' : 'receiver'} · {label}</text>
        <g transform={T}>
          {chair}
          {who === 'm' ? (
            <Man id={`ps${who}${k}`} pose={pose!} expr={expr!} lHand={hand ?? HAND_RELAXED} rHand={far ?? HAND_RELAXED} held={held} headOverlay={<Implant4 yaw={pose!.yaw ?? 20} glow={0.4} color="#46CFFF" f={0} />} />
          ) : (
            <Woman id={`ps${who}${k}`} pose={pose!} expr={expr!} lHand={hand ?? HAND_RELAXED} rHand={far ?? HAND_RELAXED} held={held} />
          )}
        </g>
      </g>
    );
  };
  return (
    <svg width={1080} height={1580} viewBox="0 0 1080 1580">
      <rect width={1080} height={1580} fill="#E6F0F4" />
      {[0, 1, 2, 3].map((k) => cell('m', k))}
      {[0, 1, 2, 3].map((k) => cell('w', k))}
    </svg>
  );
};

const PoseSheet: React.FC = () => {
  const s = 0.43;
  const cw = 270;
  const rows: {who: 'man' | 'woman'; y0: number}[] = [
    {who: 'man', y0: 10},
    {who: 'woman', y0: 540},
  ];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill="#E6F0F4" />
      {rows.map((r) =>
        poseFigs(r.who === 'man' ? -1 : 1, 0, 0, s).map((pf, i) => {
          const x0 = i * cw;
          const floor = r.y0 + 500;
          const cx = x0 + (r.who === 'man' ? 168 : 100);
          const fig = {...pf.fig, x: pf.fig.x + cx, floor};
          const fx = fig.fx;
          const off = (q?: {x: number; y: number}) => (q ? {x: q.x + cx, y: q.y + floor} : undefined);
          fig.nearHand = off(pf.fig.nearHand);
          fig.farHand = off(pf.fig.farHand);
          const pose = figure(fig);
          const id = `${r.who}${i}`;
          const hand = pf.hand ?? HAND_RELAXED;
          const chairX = cx + (pf.tilt ? -fx * 46 * s : 0);
          return (
            <g key={id}>
              <Cell x0={x0} y0={r.y0} w={cw} h={520} label={`${r.who === 'man' ? 'sender' : 'receiver'} · ${pf.name}`} />
              <line x1={x0} y1={floor} x2={x0 + cw} y2={floor} stroke="#9FB7C4" strokeWidth={3} />
              {pf.chair && <Chair id={`${id}-ch`} x={chairX + (pf.tilt ? 0 : 0)} floor={floor} s={s} fx={fx} tilt={pf.tilt ?? 0} />}
              {pf.name === 'reach' && <Table id={`${id}-tb`} x={cx + fx * 330 * s} floor={floor} s={s} w={300} />}
              {pf.name === 'reach' && <Cup id={`${id}-cu`} x={cx + fx * 400 * s} y={floor - PROP.tableH * s - 4 * s} s={s} fx={fx} steam={0.6} />}
              {r.who === 'man' ? (
                <Man id={id} pose={pose} expr={EXPR_NEUTRAL} lHand={hand} rHand={HAND_RELAXED} />
              ) : (
                <Woman id={id} pose={pose} expr={HAPPY} lHand={hand} rHand={HAND_RELAXED} />
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
};

const HAPPY: Expr = {...EXPR_NEUTRAL, smile: 0.9, open: 0.25, lid: 0.18, browIn: 0, flush: 0.5};

const Heads: React.FC = () => {
  const yaws = [0, 20, 38, 65, 90];
  const exprs: [string, Expr][] = [['neutral', EXPR_NEUTRAL], ['happy', HAPPY], ['uneasy', EXPR_UNEASY], ['gasp', EXPR_GASP]];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill="#DCEFF5" />
      {yaws.map((y, i) => (
        <g key={y}>
          <Head4 id={`a${i}`} c={{x: 110 + i * 215, y: 140}} R={86} roll={0} yaw={y} expr={EXPR_NEUTRAL} />
          <Head4 id={`b${i}`} c={{x: 110 + i * 215, y: 360}} R={86} roll={0} yaw={y} expr={HAPPY} skin="#F7D9C4" hair="#8A8A93" style="bob" glasses flip />
          <Head4 id={`c${i}`} c={{x: 110 + i * 215, y: 580}} R={86} roll={0} yaw={y} expr={EXPR_NEUTRAL} flip />
          <Head4 id={`d${i}`} c={{x: 110 + i * 215, y: 800}} R={86} roll={0} yaw={y} expr={EXPR_NEUTRAL} skin="#F7D9C4" hair="#8A8A93" style="bob" glasses />
        </g>
      ))}
      {exprs.map(([n, ex], i) => (
        <g key={n}>
          <Head4 id={`e${i}`} c={{x: 140 + i * 265, y: 1080}} R={110} roll={0} yaw={30} expr={ex} />
          <Head4 id={`f${i}`} c={{x: 140 + i * 265, y: 1340}} R={110} roll={0} yaw={30} expr={ex} skin="#F7D9C4" hair="#8A8A93" style="bob" glasses flip />
          <Head4 id={`g${i}`} c={{x: 140 + i * 265, y: 1600}} R={110} roll={0} yaw={0} expr={ex} />
        </g>
      ))}
    </svg>
  );
};

/** any café moment through any camera (frame review tool): scene 'view', t in seconds, cam {x, y, z, roll?} */
const View: React.FC<{t: number; cam: Cam; opts?: Record<string, unknown>}> = ({t, cam, opts}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920">
    <InteriorWorld t={t} f={Math.round(t * 30)} cam={cam} opts={opts} />
  </svg>
);

export const Lab6: React.FC<{scene: string; t?: number; cam?: Cam; opts?: Record<string, unknown>}> = ({scene, t = 0, cam = {x: 540, y: 1010, z: 1.06}, opts}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#DCEFF5'}}>
      {scene === 'heads' && <Heads />}
      {scene === 'poses' && <PoseSheet />}
      {scene === 'posesF' && <PoseSheetFinal />}
      {scene === 'pair' && <Pair />}
      {scene === 'view' && <View t={t} cam={cam} opts={opts} />}
      {scene === 'ext' && (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <ExteriorWorld t={t} f={Math.round(t * 30)} cam={cam} ov={(opts as {ext?: ExtOv} | undefined)?.ext} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

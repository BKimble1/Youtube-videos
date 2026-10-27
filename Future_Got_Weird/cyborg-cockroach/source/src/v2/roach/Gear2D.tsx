// V2 hardware, flat: the removable backpack (saddle, green stimulator board, chips, coin cell, status LED), the medic's
// clear launch tube (spring, auto-injector with amber dose, collar, needle, latch line through the mouth, nichrome coil)
// and the observer's camera module, all from the V1 geometry (rig/gear.ts, millimetres in the body frame) drawn through
// an orthographic view. The injector deploys along the tube's axis: the spring drives it forward, the needle goes into
// the target while the barrel's rear is still in the tube (a mechanism extending, not a dart in flight).
import React from 'react';
import {V2, V3, Frame, toW, dirW, sub, norm, add, mul} from '../../lib/v3';
import {Inked, INK} from '../../lib/ink';
import {lit as litC, shade as shadeC, mix} from '../../lib/color';
import {PACK, INJ, wiresOn, WirePt} from '../../rig/gear';
import {View, P, D, f2, hull, smoothClosed, smoothOpen, polyD, facing} from './ortho';
import {Cel, InkFlat, inkFor} from './Roach2D';

export const G2 = {
  saddle: '#3B444C',
  board: '#2E9B78',
  boardEdge: '#1F6E57',
  chip: '#22272D',
  cell: '#C9D2D8',
  glass: '#CFEAF2',
  spring: '#C2CCD3',
  dose: '#F2A93B',
  plunger: '#4A5560',
  collar: '#7C8B96',
  needle: '#E4EBEF',
  line: '#2B2B2B',
  coil: '#C8643A',
  heat: '#FFC85A',
  wireAnt: '#F08A3C',
  wireCer: '#4B8FD6',
  camBody: '#2A3036',
  lens: '#1E5B8C',
  led: '#FF4D4D',
  ledGo: '#4DFF88',
};

const boxPts = (v: View, f: Frame, c: V3, h: V3): V2[] => {
  const pts: V2[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(P(v, toW(f, [c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]])));
  return hull(pts);
};
/** a cylinder's orthographic outline: hull of its two end circles (axis a->b, radius r, in world) */
const cylPts = (v: View, a: V3, b: V3, r: number): V2[] => {
  const ax = norm(sub(b, a));
  const t0: V3 = Math.abs(ax[1]) < 0.9 ? norm([ax[2], 0, -ax[0]]) : [1, 0, 0];
  const t1: V3 = [ax[1] * t0[2] - ax[2] * t0[1], ax[2] * t0[0] - ax[0] * t0[2], ax[0] * t0[1] - ax[1] * t0[0]];
  const pts: V2[] = [];
  for (let i = 0; i < 32; i++) {
    const th = (i / 32) * Math.PI * 2;
    const o = add(mul(t0, Math.cos(th) * r), mul(t1, Math.sin(th) * r));
    pts.push(P(v, add(a, o)), P(v, add(b, o)));
  }
  return hull(pts);
};
const lineD = (a: V2, b: V2) => `M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`;

export type GearState = {
  kind: 'injector' | 'camera' | 'none';
  /** injector rear along the tube axis (body x, mm); default loaded */
  injRear?: number;
  /** the frame the injector lies in once it has gone into the target (stays put while the body recoils) */
  injFrame?: Frame;
  latched?: boolean;
  heat?: number; // 0..1 nichrome glow
  /** spring front (body x) when not following the injector (after it has left) */
  springFront?: number;
  /** status LED: 0 off .. 1 on (red flash when firing / pulsing) */
  led?: number;
  /** pulses along the antenna wires: fractions 0..1 from board to electrode */
  pulses?: {antL?: number[]; antR?: number[]};
  /** electrode glow at the antenna bases */
  zap?: {antL?: number; antR?: number};
  /** fraction of the dose delivered (plunger travel), 0..1 */
  plunger?: number;
  /** hide the wires (top-down shots where they would clutter) */
  noWires?: boolean;
};

/** the observer's camera module, seated on the board's front half (V1's sat out ahead of the board) */
export const CAM2 = {c: [9.5, 27.2, 0] as V3, h: [4.6, 3.6, 4.2] as V3, lens: 2.4};
export const SPRING_FREE = 21; // body x of the spring's free length front

/** the backpack and its hardware for one insect */
export const Gear2D: React.FC<{id: string; v: View; f: Frame; g: GearState}> = ({id, v, f, g}) => {
  const ink = inkFor(v) * 0.8;
  const s = v.s;
  const cD = D(v, toW(f, [0, 8, 0]));
  const T = PACK.tube;
  const injRear = g.injRear ?? INJ.loadedRear;
  const latched = g.latched ?? true;
  const heat = g.heat ?? 0;
  // ---- wires (drawn first: they run under the board's edge and over the shell)
  const w = wiresOn(f);
  const wireRun = (pts: WirePt[]) => pts.filter((q) => v.F[1] > 0.6 || D(v, q.p) >= cD - 1.5).map((q) => P(v, q.p));
  const wire = (k: 'antL' | 'antR' | 'cerL' | 'cerR', col: string) => {
    const r = wireRun(w[k]);
    if (r.length < 2) return null;
    const d = smoothOpen(r);
    return (
      <g key={k}>
        <path d={d} stroke={INK} strokeWidth={f2(0.55 * s + 1.6)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={col} strokeWidth={f2(0.55 * s)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  // pulses (bright beads moving along the antenna wires) and electrode glow
  const along = (pts: V2[], t: number): V2 => {
    const L: number[] = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const x = t * L[L.length - 1];
    let i = 1;
    while (i < L.length - 1 && L[i] < x) i++;
    const u = (x - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
  };
  const pulseEls = (['antL', 'antR'] as const).flatMap((k) => {
    const r = w[k].map((q) => P(v, q.p));
    const ok = v.F[1] > 0.6 || D(v, w[k][w[k].length - 1].p) >= cD - 1.5;
    if (!ok) return [];
    const ps = (g.pulses?.[k] ?? []).map((t, i) => {
      const p = along(r, t);
      return (
        <g key={`${k}p${i}`}>
          <circle cx={f2(p[0])} cy={f2(p[1])} r={f2(1.9 * s)} fill="#FFF3B0" opacity={0.35} />
          <circle cx={f2(p[0])} cy={f2(p[1])} r={f2(0.85 * s)} fill="#FFFBE6" />
        </g>
      );
    });
    const z = g.zap?.[k] ?? 0;
    const e = r[r.length - 1];
    return [
      ...ps,
      z > 0 ? (
        <g key={`${k}z`}>
          <circle cx={f2(e[0])} cy={f2(e[1])} r={f2((1.6 + 2.2 * z) * s)} fill="#FFF0A0" opacity={0.28 * z} />
          <circle cx={f2(e[0])} cy={f2(e[1])} r={f2(0.9 * s)} fill="#FFFBE6" opacity={z} />
        </g>
      ) : null,
    ];
  });
  // electrode beads at the wire ends
  const ends = (['antL', 'antR', 'cerL', 'cerR'] as const).flatMap((k) => {
    const q = w[k][w[k].length - 1];
    if (!(v.F[1] > 0.6 || D(v, q.p) >= cD - 1.5)) return [];
    const p = P(v, q.p);
    return [<circle key={`${k}e`} cx={f2(p[0])} cy={f2(p[1])} r={f2(0.75 * s)} fill="#E9EEF2" stroke={INK} strokeWidth={f2(Math.max(1, 0.25 * s))} />];
  });
  // ---- the pack
  const saddle = boxPts(v, f, PACK.saddle.c, PACK.saddle.h);
  const board = boxPts(v, f, PACK.board.c, PACK.board.h);
  const chips = [PACK.chipA, PACK.chipB].map((c) => boxPts(v, f, c.c, c.h));
  const cellA = toW(f, [PACK.cell.c[0], PACK.cell.c[1] - PACK.cell.h / 2, PACK.cell.c[2]]), cellB = toW(f, [PACK.cell.c[0], PACK.cell.c[1] + PACK.cell.h / 2, PACK.cell.c[2]]);
  const cell = cylPts(v, cellA, cellB, PACK.cell.r);
  const ledP = P(v, toW(f, [11.5, 23.9, 4.6]));
  // ---- launch tube and contents (injector kind)
  const injF: Frame = g.injFrame ?? f;
  const tA = toW(f, T.a), tB = toW(f, T.b);
  const tube = cylPts(v, tA, tB, T.r);
  const inj = (x: number): V3 => toW(injF, [x, T.a[1], 0]);
  const springA = T.a[0] + 1.5;
  const springB = g.springFront ?? Math.min(injRear, SPRING_FREE);
  const coils = 9;
  const springPts: V2[] = [];
  for (let i = 0; i <= coils * 16; i++) {
    const u = i / (coils * 16), th = u * coils * Math.PI * 2;
    const x = springA + (springB - springA) * u;
    springPts.push(P(v, toW(f, [x, T.a[1] + Math.sin(th) * 2.6, Math.cos(th) * 2.6])));
  }
  const barrel = cylPts(v, inj(injRear), inj(injRear + INJ.barrelLen), INJ.barrelR);
  const dose0 = injRear + INJ.plungerLen + (INJ.barrelLen - INJ.plungerLen - 1) * (g.plunger ?? 0);
  const dose = dose0 < injRear + INJ.barrelLen - 1.2 ? cylPts(v, inj(dose0), inj(injRear + INJ.barrelLen - 0.6), INJ.barrelR - 0.45) : null;
  const plunger = cylPts(v, inj(dose0 - INJ.plungerLen + 0.6), inj(dose0), INJ.barrelR - 0.3);
  const collar = cylPts(v, inj(injRear + INJ.collarAt - 0.6), inj(injRear + INJ.collarAt + 0.9), INJ.collarR);
  const nA = P(v, inj(injRear + INJ.collarAt + 0.9)), nB = P(v, inj(injRear + INJ.barrelLen + 1.2 + INJ.needleLen));
  // latch line: through the two holes at the mouth, across the front of the collar; parted -> two short tails
  const mouthX = T.b[0] - 0.8;
  const hTop = P(v, toW(f, [mouthX, T.a[1] + T.r, 0])), hBot = P(v, toW(f, [mouthX, T.a[1] - T.r, 0]));
  const cFront = P(v, toW(f, [mouthX + 0.9, T.a[1], 0]));
  const tail = (a: V2, dir: number) => lineD(a, [a[0] + 1.2 * s, a[1] + dir * 2.4 * s]);
  const coilC = P(v, toW(f, [mouthX + 0.4, T.a[1] + T.r * 0.55, 0]));
  const showInj = g.kind === 'injector';
  const cam = g.kind === 'camera';
  const camBox = cam ? boxPts(v, f, CAM2.c, CAM2.h) : null;
  const lensC = P(v, toW(f, [CAM2.c[0] + CAM2.h[0] + 0.2, CAM2.c[1], 0]));
  const lensFacing = facing(v, f.x);
  const aerialA = P(v, toW(f, PACK.aerial.a)), aerialB = P(v, toW(f, PACK.aerial.b));
  return (
    <g>
      {g.noWires ? null : [wire('cerL', G2.wireCer), wire('cerR', G2.wireCer), wire('antL', G2.wireAnt), wire('antR', G2.wireAnt)]}
      {g.noWires ? null : ends}
      <Inked w={ink}>
        <Cel id={`${id}-sd`} pts={saddle} color={G2.saddle} hi={0.15} />
        <Cel id={`${id}-bd`} pts={board} color={G2.board} hi={0.3} shadeK={0.28} />
      </Inked>
      <Inked w={ink * 0.7}>
        {chips.map((c, i) => (
          <Cel key={i} id={`${id}-ch${i}`} pts={c} color={G2.chip} hi={0.2} />
        ))}
        <Cel id={`${id}-cl`} pts={cell} color={G2.cell} hi={0.6} shadeK={0.22} />
      </Inked>
      {(g.led ?? 0) > 0 && (
        <g>
          <circle cx={f2(ledP[0])} cy={f2(ledP[1])} r={f2(2.6 * s)} fill={G2.led} opacity={0.25 * (g.led ?? 0)} />
          <circle cx={f2(ledP[0])} cy={f2(ledP[1])} r={f2(0.9 * s)} fill="#FFD7D7" opacity={g.led} />
        </g>
      )}
      <circle cx={f2(ledP[0])} cy={f2(ledP[1])} r={f2(0.7 * s)} fill={(g.led ?? 0) > 0.5 ? '#FFE3E3' : '#8A2B2B'} stroke={INK} strokeWidth={f2(Math.max(0.8, 0.2 * s))} />
      {showInj && (
        <g>
          {/* tube back: a pale glass fill (the contents read through it) */}
          <path d={smoothClosed(tube)} fill={G2.glass} opacity={0.42} />
          <path d={smoothOpen(springPts)} stroke={INK} strokeWidth={f2(0.55 * s + 1.4)} fill="none" strokeLinecap="round" />
          <path d={smoothOpen(springPts)} stroke={G2.spring} strokeWidth={f2(0.55 * s)} fill="none" strokeLinecap="round" />
          {/* the injector: barrel, dose, plunger, collar, needle */}
          <path d={lineD(nA, nB)} stroke={INK} strokeWidth={f2(0.45 * s + 1.8)} strokeLinecap="round" />
          <path d={lineD(nA, nB)} stroke={G2.needle} strokeWidth={f2(0.45 * s)} strokeLinecap="round" />
          <Inked w={ink * 0.8}>
            <Cel id={`${id}-br`} pts={barrel} color="#E8F1F4" hi={0.7} shadeK={0.16} />
          </Inked>
          {dose && <Cel id={`${id}-ds`} pts={dose} color={G2.dose} hi={0.5} shadeK={0.2} />}
          <Cel id={`${id}-pl`} pts={plunger} color={G2.plunger} hi={0.2} />
          <Inked w={ink * 0.7}>
            <Cel id={`${id}-co`} pts={collar} color={G2.collar} hi={0.4} />
          </Inked>
          {/* latch line and coil */}
          {latched ? (
            <path d={`M${f2(hTop[0])},${f2(hTop[1])} Q${f2(cFront[0] + 0.6 * s)},${f2(cFront[1])} ${f2(hBot[0])},${f2(hBot[1])}`} stroke={G2.line} strokeWidth={f2(Math.max(1.2, 0.32 * s))} fill="none" />
          ) : (
            <g>
              <path d={tail(hTop, 1)} stroke={G2.line} strokeWidth={f2(Math.max(1.2, 0.32 * s))} fill="none" strokeLinecap="round" />
              <path d={tail(hBot, -1)} stroke={G2.line} strokeWidth={f2(Math.max(1.2, 0.32 * s))} fill="none" strokeLinecap="round" />
            </g>
          )}
          {heat > 0 && <circle cx={f2(coilC[0])} cy={f2(coilC[1])} r={f2((1.4 + 2.4 * heat) * s)} fill={G2.heat} opacity={0.32 * heat} />}
          <path d={`M${f2(coilC[0] - 0.9 * s)},${f2(coilC[1] - 0.8 * s)} l${f2(0.45 * s)},${f2(1.6 * s)} l${f2(0.45 * s)},${f2(-1.6 * s)} l${f2(0.45 * s)},${f2(1.6 * s)} l${f2(0.45 * s)},${f2(-1.6 * s)}`} stroke={heat > 0.3 ? mix(G2.coil, G2.heat, heat) : G2.coil} strokeWidth={f2(Math.max(1, 0.32 * s))} fill="none" strokeLinejoin="round" />
          {/* tube front: outline, rim rings, a long highlight */}
          <path d={smoothClosed(tube)} fill="none" stroke={INK} strokeWidth={f2(ink * 0.9)} />
          {[T.a[0] + 0.6, T.b[0] - 0.6].map((x, i) => {
            const a = P(v, toW(f, [x, T.a[1] + T.r, 0])), b = P(v, toW(f, [x, T.a[1] - T.r, 0]));
            return <path key={i} d={lineD(a, b)} stroke={INK} strokeWidth={f2(ink * 0.6)} opacity={0.6} />;
          })}
          {(() => {
            const a = P(v, toW(f, [T.a[0] + 3, T.a[1] + T.r * 0.62, 0])), b = P(v, toW(f, [T.b[0] - 4, T.a[1] + T.r * 0.62, 0]));
            return <path d={lineD(a, b)} stroke="#FFFFFF" strokeWidth={f2(0.7 * s)} strokeLinecap="round" opacity={0.75} />;
          })()}
          {/* clamps holding the tube to the board */}
          {PACK.clamps.map((x, i) => (
            <Inked key={i} w={ink * 0.6}>
              <Cel id={`${id}-cp${i}`} pts={boxPts(v, f, [x, T.a[1] - T.r + 0.6, 0], [1.1, 1.4, T.r + 0.5])} color={G2.saddle} hi={0.15} />
            </Inked>
          ))}
        </g>
      )}
      {cam && camBox && (
        <g>
          <path d={lineD(aerialA, aerialB)} stroke={INK} strokeWidth={f2(0.5 * s + 1.6)} strokeLinecap="round" />
          <path d={lineD(aerialA, aerialB)} stroke="#5E6A74" strokeWidth={f2(0.5 * s)} strokeLinecap="round" />
          <Inked w={ink}>
            <Cel id={`${id}-cm`} pts={camBox} color={G2.camBody} hi={0.25} />
          </Inked>
          {lensFacing > -0.2 && (
            <g>
              <ellipse cx={f2(lensC[0])} cy={f2(lensC[1])} rx={f2(CAM2.lens * s * Math.max(0.25, Math.abs(lensFacing)))} ry={f2(CAM2.lens * s)} fill={INK} />
              <ellipse cx={f2(lensC[0])} cy={f2(lensC[1])} rx={f2(CAM2.lens * 0.72 * s * Math.max(0.25, Math.abs(lensFacing)))} ry={f2(CAM2.lens * 0.72 * s)} fill={G2.lens} />
              <ellipse cx={f2(lensC[0] - 0.4 * s)} cy={f2(lensC[1] - 0.6 * s)} rx={f2(0.5 * s * Math.max(0.3, Math.abs(lensFacing)))} ry={f2(0.45 * s)} fill="#FFFFFF" opacity={0.8} />
            </g>
          )}
        </g>
      )}
      {pulseEls}
    </g>
  );
};

/** the deployment: rear position of the injector along the tube for a release at tl, reaching `travel` mm (spring
 *  drive, fast then settling into the silicone), plus heat and latch state */
export const deployAt = (t: number, tl: number, travel: number) => {
  const heat = t < tl ? Math.max(0, Math.min(1, (t - (tl - 0.35)) / 0.3)) : Math.max(0, 1 - (t - tl) / 0.25);
  const dt = t - tl;
  if (dt < 0) return {injRear: INJ.loadedRear, latched: true, heat, recoil: 0, impact: -1, moving: false};
  const T = 0.075; // s: the spring's stroke, then the needle seats
  const u = Math.min(1, dt / T);
  const prog = u < 1 ? 1 - Math.pow(1 - u, 2.2) : 1;
  const recoil = dt < 0.03 ? dt / 0.03 : Math.max(0, 1 - (dt - 0.03) / 0.3);
  return {injRear: INJ.loadedRear + travel * prog, latched: false, heat, recoil, impact: dt - T, moving: u < 1};
};

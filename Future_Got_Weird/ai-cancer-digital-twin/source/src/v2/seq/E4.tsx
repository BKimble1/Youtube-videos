// SEQUENCE E, V4 (145.6 – 158.7 s): the molecular side of the immune story, entered from and returned to the same cell.
//  Fingerprints: the camera arrives (from the treatment world) on the membrane of the colony cell that was blending in.
//    Its curved membrane carries MHC molecules; most hold ordinary peptides, a few hold the tumour's unique
//    fingerprints. An AI read sweeps along the membrane: each MHC is checked, the ordinary ones pass, the fingerprints
//    are locked. Copies of the identified fingerprint lift away, and the camera follows them up into
//  Routes: the copies become the cargo of vaccine particles, which a dendritic cell takes up and displays; a T cell
//    finds the displayed fingerprint, docks, switches on (gold) and starts to divide. Beside it, outside the body, a
//    patient's T cell in a culture bag receives the receptor's instructions, shows the new receptor and multiplies.
//  Learning: between a T cell's membrane and a tumour cell's membrane, the receptor tip reshapes to the fingerprint,
//    then the receptor seats on it (contact first, a restrained highlight after). The camera pulls back out of this
//    contact into the treatment world, where the trained T cell is docked on that same cell (sequence D, kills).
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, noise} from '../../kit/core';
import {Shot} from '../director';
import {T} from '../time';
import {path, mapCam} from '../rig';
import {P} from '../palette';
import {TCell2, DividingCell, TUMOR, HEALTHY, lookMix} from '../art/tissue';
import {Dendritic, MHC, TCR, fingerPath} from '../art/immune';
import {Carrier} from '../art/protein';
import {Bokeh} from '../art/depth';
import {DV2, SURF_PT, SURF_ANGLE, SURF_OUT, KILL_IN, KILL_PT, KILL_ANG, D_CELL_R, R3_LOOK_CAMO, KCAM_EXPORT as KILL_CAM_D} from './D4';

const tE = {
  tumors: T('But tumors can carry'), finger: T('unique molecular fingerprints.'), ai: T('AI can help identify'), identify: T('identify those fingerprints'), fps: T('fingerprints and guide'),
  guide: T('and guide personalized'), vaccines: T('cancer vaccines'), special: T('specialized immune-cell treatments.'), imagine: T('Imagine your own T cells'), learning: T('learning exactly'),
  exactly: T('exactly what to hunt.'), hunt: T('hunt.'), recognize: T('They recognize a cancer cell.'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const RESIST = lookMix(TUMOR, {...TUMOR, fill: '#B8603E', light: '#E8986E'}, 0.45);
const CAMO = lookMix(RESIST, HEALTHY, R3_LOOK_CAMO);

// ================================================================================================ fingerprints on the curved membrane
const SS = 40;                          // surface units per treatment-world unit
const RS = D_CELL_R * SS;               // the cell's radius at surface scale (membrane top at (0, 0))
const D_ROT_S = (SURF_ANGLE * 180) / Math.PI + 90;
const fromD = (t: number) => mapCam(DV2(t), SURF_PT, [0, 0], SS, D_ROT_S);
const NM = 17;
const DTH = 300 / RS;
const MHCS = Array.from({length: NM}, (_, k) => ({k, th: -Math.PI / 2 + (k - (NM - 1) / 2) * DTH, neo: k === 5 || k === 9 || k === 12, kind: k % 3}));
const onArc = (th: number, h = 0): Pt => [Math.cos(th) * (RS + h), RS + Math.sin(th) * (RS + h)];
const SCAN: [number, number] = [tE.identify - 0.3, tE.fps + 0.25];
const scanTh = (t: number) => lerp(MHCS[0].th - DTH, MHCS[NM - 1].th + DTH, lift(t, SCAN[0], SCAN[1]));
const LIFT: [number, number] = [tE.fps + 0.1, tE.guide + 0.6];
const NEO = MHCS.filter((m) => m.neo);
/** where the lifted fingerprint copies are (surface units) */
const copyAt = (m: (typeof MHCS)[0], t: number): Pt => {
  const u = lift(t, LIFT[0], LIFT[1]);
  const base = onArc(m.th, 230);
  return [lerp(base[0], m.th > -Math.PI / 2 ? 140 * (NEO.indexOf(m) - 1) : 140 * (NEO.indexOf(m) - 1), u), lerp(base[1], -900, u)];
};
const CAM_S0 = fromD(SURF_OUT[1]);
const CAM_S = path([
  {...CAM_S0, t: SURF_OUT[1]},
  {t: tE.finger + 0.3, x: 0, y: -200, z: 0.9, rot: 0},
  {t: tE.ai, x: -150, y: -210, z: 0.95, rot: 0},
  {t: SCAN[1], x: 200, y: -230, z: 0.95, rot: 0},
  {t: LIFT[1] + 0.25, x: 0, y: -880, z: 1.05, rot: 0},
]);
const surfCam = (t: number) => (t < SURF_OUT[1] ? fromD(t) : CAM_S(t));
const Surface: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const glow = lift(t, tE.finger - 0.2, tE.finger + 0.5);
  const sth = scanTh(t);
  const scanOn = t > SCAN[0] - 0.1 && t < SCAN[1] + 0.3;
  const heads: React.ReactNode[] = [];
  const n = 160;
  for (let k = 0; k < n; k++) {
    const th = -Math.PI / 2 + (k - n / 2) * (34 / RS);
    const o = onArc(th, 18), i = onArc(th, -18);
    heads.push(<circle key={'o' + k} cx={o[0]} cy={o[1]} r={15} fill={CAMO.light} />, <circle key={'i' + k} cx={i[0]} cy={i[1]} r={15} fill={CAMO.fill} />);
  }
  return (
    <g>
      <rect width={W} height={H} fill="#2A0A20" />
      {/* the extracellular space above the cell: soft depth, a neighbouring cell out of focus */}
      <g transform={camTransform(cam, 0.5)}>
        {Array.from({length: 6}, (_, k) => <circle key={k} cx={-2200 + k * 900} cy={-1500 + 200 * Math.sin(k * 1.4)} r={360} fill="url(#bokehDeep)" />)}
      </g>
      <g transform={camTransform(cam)}>
        <circle cx={0} cy={RS} r={RS - 20} fill={CAMO.fill} />
        <circle cx={0} cy={RS} r={RS - 20} fill="url(#glowMag)" opacity={0.12} />
        {/* cytoskeleton / cortex just under the membrane */}
        {Array.from({length: 40}, (_, k) => {
          const th = -Math.PI / 2 + (k - 20) * 0.012;
          const a = onArc(th, -60), b = onArc(th + 0.01, -150 - 40 * rand(k));
          return <line key={'cx' + k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CAMO.deep} strokeWidth={8} strokeLinecap="round" opacity={0.35} />;
        })}
        {heads}
        {MHCS.map((m) => {
          const p = onArc(m.th, 10);
          const passed = sth > m.th;
          const read = Math.exp(-(((sth - m.th) / (DTH * 0.6)) ** 2));
          const locked = m.neo && passed ? lift(sth - m.th, 0, DTH * 1.2) : 0;
          return (
            <g key={m.k} transform={`translate(${p[0]} ${p[1]}) rotate(${((m.th + Math.PI / 2) * 180) / Math.PI})`}>
              <MHC x={0} y={0} t={t} neo={m.neo} kind={m.kind} scan={scanOn && !m.neo ? read * 0.9 : 0} flag={m.neo ? Math.max(locked, glow * 0.3) : 0} />
            </g>
          );
        })}
        {/* the read itself: a fine beam along the membrane normal */}
        {scanOn && (() => {
          const a = onArc(sth, -40), b = onArc(sth, 520);
          return (
            <g opacity={Math.min(lift(t, SCAN[0] - 0.1, SCAN[0] + 0.2), 1 - lift(t, SCAN[1], SCAN[1] + 0.3))}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={P.ai} strokeWidth={26} opacity={0.18} />
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={P.aiHot} strokeWidth={5} />
            </g>
          );
        })()}
        {/* copies of the identified fingerprints lift away */}
        {t > LIFT[0] && NEO.map((m) => {
          const c = copyAt(m, t);
          const turn = lerp(((m.th + Math.PI / 2) * 180) / Math.PI, 0, lift(t, LIFT[0], LIFT[1]));
          return (
            <g key={'cp' + m.k} transform={`translate(${c[0]} ${c[1]}) rotate(${turn}) scale(0.9)`} opacity={lift(t, LIFT[0], LIFT[0] + 0.2)}>
              <circle r={120} fill="url(#glowGold)" opacity={0.45} />
              <path d={fingerPath(m.kind)} fill="none" stroke={P.aiGold} strokeWidth={8} />
            </g>
          );
        })}
      </g>
      <Bokeh cam={cam} t={t} fill="url(#bokehWarm)" op={0.6} n={6} size={280} />
    </g>
  );
};

// ================================================================================================ the two routes
/** screen position of the lifted copies when the routes world takes over (they keep it across the dissolve) */
const R_IN: [number, number] = [LIFT[1] - 0.2, LIFT[1] + 0.25];
const CAM_V = path([
  {t: R_IN[0], x: -900, y: -260, z: 1.25, rot: 0},
  {t: tE.vaccines + 0.2, x: -860, y: -80, z: 1.2, rot: 0},
  {t: tE.special - 0.25, x: -760, y: -70, z: 1.12, rot: 0},
  {t: tE.special + 0.4, x: 1150, y: -60, z: 1.05, rot: 0},
  {t: tE.imagine, x: 1100, y: 20, z: 0.95, rot: 0},
]);
const copyScreen = (m: (typeof MHCS)[0]) => {
  const c = CAM_S(R_IN[0]);
  const p = copyAt(m, LIFT[1]);
  return [(p[0] - c.x) * c.z, (p[1] - c.y) * c.z] as Pt; // offset from the screen centre
};
const DC: Pt = [-900, 0];
const VAC = Array.from({length: 7}, (_, k) => ({a: (k / 7) * Math.PI * 2 + 0.4, carries: k % 2 === 0 ? (k / 2) % 3 : -1}));
const Routes: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const fill = lift(t, R_IN[0], tE.guide + 1.0);                      // the copies are packed into the particles
  const uptake = lift(t, tE.guide + 0.75, tE.vaccines + 0.35);
  const present = lift(t, tE.vaccines + 0.1, tE.vaccines + 0.55);
  const dock = lift(t, tE.vaccines + 0.35, tE.vaccines + 0.85);
  const activ = lift(t, tE.vaccines + 0.75, tE.vaccines + 1.05);
  const div = clamp01((t - (tE.vaccines + 1.0)) / 1.2);
  const eng = lift(t, tE.special - 0.1, tE.special + 0.5);
  const c0 = CAM_V(R_IN[0]);
  // the T cell is drawn in by the displayed fingerprint: accelerates, then decelerates into contact
  const tcFrom: Pt = [-380, -380], tcTo: Pt = [DC[0] + 215, DC[1] - 120];
  const tcP: Pt = [lerp(tcFrom[0], tcTo[0], dock), lerp(tcFrom[1], tcTo[1], dock)];
  const tcAng = Math.atan2(DC[1] - tcP[1], DC[0] - tcP[0]);
  return (
    <g>
      <rect width={W} height={H} fill="#0E2436" />
      {/* lymph-node stroma: a fine reticular mesh at two depths */}
      {[0.5, 0.75].map((d, li) => (
        <g key={li} transform={camTransform(cam, d)} opacity={li ? 0.5 : 0.35}>
          {Array.from({length: 26}, (_, k) => {
            const x = -3200 + (k % 9) * 800 + 200 * rand(k * 3 + li), y = -1400 + Math.floor(k / 9) * 1100 + 200 * rand(k * 7 + li);
            return (
              <g key={k}>
                <path d={`M ${x} ${y} Q ${x + 300} ${y + 200 * Math.sin(k)} ${x + 800} ${y + 120}`} fill="none" stroke="#2A5A72" strokeWidth={10} />
                <path d={`M ${x} ${y} Q ${x - 100} ${y + 400} ${x + 60} ${y + 1100}`} fill="none" stroke="#2A5A72" strokeWidth={8} />
                <circle cx={x} cy={y} r={22} fill="#33708C" />
              </g>
            );
          })}
        </g>
      ))}
      <g transform={camTransform(cam)}>
        {/* route 1: vaccine particles carrying the identified fingerprint; a dendritic cell takes them up and shows it */}
        {VAC.map((v, k) => {
          const d = lerp(560, 120, smooth(clamp01(uptake * 1.3 - k * 0.04)));
          const x = DC[0] + Math.cos(v.a) * d, y = DC[1] + Math.sin(v.a) * d;
          return (
            <g key={k} opacity={1 - lift(uptake, 0.75, 1)}>
              <Carrier x={x} y={y} r={38} t={t} seed={k} lod={0.4} />
              {v.carries >= 0 && <path d={fingerPath(v.carries)} transform={`translate(${x} ${y}) scale(0.2)`} fill={P.aiGold} opacity={fill} />}
            </g>
          );
        })}
        {/* the copies from the membrane fly into the particles */}
        {t < tE.guide + 1.05 && NEO.map((m, i) => {
          const off = copyScreen(m);
          const start: Pt = [c0.x + off[0] / c0.z, c0.y + off[1] / c0.z];
          const tgtV = VAC[i * 2];
          const end: Pt = [DC[0] + Math.cos(tgtV.a) * 560, DC[1] + Math.sin(tgtV.a) * 560];
          const u = fill;
          const p: Pt = [lerp(start[0], end[0], u), lerp(start[1], end[1], u)];
          return (
            <g key={'cp' + i} transform={`translate(${p[0]} ${p[1]}) scale(${lerp(0.9 / SS * SS, 0.2, u)})`} opacity={1 - lift(u, 0.85, 1)}>
              <circle r={120} fill="url(#glowGold)" opacity={0.45 * (1 - u)} />
              <path d={fingerPath(m.kind)} fill="none" stroke={P.aiGold} strokeWidth={8} />
            </g>
          );
        })}
        <Dendritic x={DC[0]} y={DC[1]} r={150} t={t} present={present} />
        {div <= 0 ? (
          <TCell2 x={tcP[0]} y={tcP[1]} r={62} t={t} dir={tcAng} act={activ} seed={21} flat={dock > 0.9 ? {a: tcAng, d: 0.18 * smooth((dock - 0.9) * 10)} : undefined} />
        ) : (
          <DividingCell x={tcP[0] + 40 * div} y={tcP[1] - 30 * div} r={62} seed={22} t={t} p={div} axis={-30} lod={62 * cam.z} look={{fill: P.tcell, light: mixHex(P.tcellLight, P.immuneGold, 0.5), deep: P.tcellDeep, nuc: '#1E5A50', nucDeep: '#0E3A34'}} sepF={0.72} dR={0.84} />
        )}
        {activ > 0.01 && div <= 0 && <circle cx={tcP[0]} cy={tcP[1]} r={62 * 1.2} fill="none" stroke={P.immuneGold} strokeWidth={5} opacity={activ * (1 - lift(t, tE.vaccines + 1.0, tE.vaccines + 1.3))} />}
        {/* route 2, outside the body: the patient's own T cell in a culture bag receives the receptor's instructions,
            displays the new receptor, and is expanded by ordinary cell division (a few rounds shown, more implied) */}
        <g>
          <rect x={1100 - 460} y={-380} width={920} height={760} rx={110} fill="#163646" stroke="#7FB6C8" strokeWidth={10} opacity={0.9} />
          <rect x={1100 - 460} y={-380} width={920} height={760} rx={110} fill="url(#volSoft)" opacity={0.5} />
          <rect x={1100 - 40} y={-520} width={80} height={150} rx={20} fill="#2A5A6E" stroke="#7FB6C8" strokeWidth={8} />
          {/* the gene-delivery particle entering the cell */}
          {(() => {
            const u = lift(t, tE.special - 0.7, tE.special - 0.05);
            return u < 1 && <g opacity={1 - lift(t, tE.special - 0.2, tE.special)}><circle cx={lerp(1100 - 300, 1100 - 60, u)} cy={lerp(-280, -40, u)} r={24} fill={P.dendritic} stroke="#DDF2FF" strokeWidth={4} /></g>;
          })()}
          {Array.from({length: 14}, (_, k) => <circle key={'bg' + k} cx={1100 - 420 + rand(k * 3) * 840} cy={-330 + rand(k * 7) * 660} r={26} fill={P.tcellDeep} opacity={0.25 * lift(t, tE.special + 0.8, tE.imagine)} />)}
          {(() => {
            const TL = {fill: P.tcell, light: mixHex(P.tcellLight, P.immuneGold, eng), deep: P.tcellDeep, nuc: '#1E5A50', nucDeep: '#0E3A34'};
            const d1 = clamp01((t - (tE.special + 0.55)) / 0.9);
            const d2 = clamp01((t - (tE.special + 1.25)) / 0.9);
            const recs = (cx: number, cy: number, r: number, key: string) => Array.from({length: 9}, (_, m) => {
              const a = (m / 9) * Math.PI * 2;
              const g = smooth(eng * 1.4 - m * 0.04);
              return (
                <g key={key + m} transform={`translate(${cx} ${cy}) rotate(${(a * 180) / Math.PI}) translate(${r + 4} 0)`} opacity={g}>
                  <line x1={0} y1={0} x2={20 * g} y2={0} stroke={P.immuneGold} strokeWidth={6} strokeLinecap="round" />
                  <line x1={20 * g} y1={0} x2={30 * g} y2={-9 * g} stroke={P.immuneGold} strokeWidth={6} strokeLinecap="round" />
                  <line x1={20 * g} y1={0} x2={30 * g} y2={9 * g} stroke={P.immuneGold} strokeWidth={6} strokeLinecap="round" />
                </g>
              );
            });
            if (d1 <= 0) return <g><TCell2 x={1100} y={0} r={95} t={t} seed={30} light={TL.light} act={0.25 * eng} spikes={1 - 0.5 * eng} />{recs(1100, 0, 95, 'a')}</g>;
            if (d2 <= 0 || d1 < 1) return <DividingCell x={1100} y={0} r={95} seed={31} t={t} p={d1} axis={30} lod={95} look={TL} sepF={0.72} dR={0.84} />;
            const ax = (30 * Math.PI) / 180, off = 0.72 * 95;
            return <g>{[-1, 1].map((sg) => <DividingCell key={sg} x={1100 + sg * Math.cos(ax) * off * 1.6} y={sg * Math.sin(ax) * off * 1.6} r={80} seed={33 + sg} t={t} p={d2} axis={sg > 0 ? 100 : 160} lod={80} look={TL} sepF={0.72} dR={0.84} />)}</g>;
          })()}
        </g>
      </g>
      <Bokeh cam={cam} t={t} fill="url(#bokehTeal)" op={0.5} n={6} size={260} />
    </g>
  );
};

// ================================================================================================ a receptor learns the fingerprint, between two real membranes
const SL = 14;                                // learning-world units per treatment-world unit
const RT_T = 46 * SL, RT_C = D_CELL_R * SL;   // the T cell's and the tumour cell's radii at this scale
const D_ROT_L = (KILL_ANG * 180) / Math.PI + 90;
const SQ: [number, number] = [tE.recognize - 0.75, KILL_IN[0]];
const learnFromKill = (camK: Cam) => mapCam(camK, KILL_PT, [0, 0], SL, D_ROT_L);
// the kill camera at its first key, mapped into this world: the learning camera must arrive there
const K0 = learnFromKill({x: KILL_PT[0], y: KILL_PT[1], z: 4.2, rot: 0});
const CAM_L = path([
  {t: tE.imagine, x: 0, y: 30, z: 0.86, rot: 0},
  {t: tE.exactly, x: 0, y: 10, z: 0.98, rot: 0},
  {t: SQ[0], x: 0, y: 0, z: 1.05, rot: 0},
  {...K0, t: SQ[1]},
]);
const Learn: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const learn = lift(t, tE.imagine + 0.5, tE.exactly + 0.2);
  const meet = lift(t, tE.exactly + 0.2, tE.hunt - 0.05);
  const gold = lift(t, tE.hunt + 0.05, tE.hunt + 0.35) * (1 - 0.6 * lift(t, tE.hunt + 0.6, tE.hunt + 1.0));
  // as the camera pulls back to cell scale, the molecular gap closes (the two membranes are in contact at that scale)
  const sq = 1 - lift(t, SQ[0], SQ[1]);
  const tY = -440 * sq, cY = 430 * sq;
  const tC: Pt = [0, tY - RT_T], cC: Pt = [0, cY + RT_C];
  const along = (c: Pt, R: number, x: number, out: 1 | -1): {p: Pt; ang: number} => {
    const th = Math.asin(clamp01(Math.abs(x) / R)) * Math.sign(x);
    return {p: [c[0] + Math.sin(th) * R, c[1] - out * Math.cos(th) * R], ang: (out * th * 180) / Math.PI};
  };
  const heads = (c: Pt, R: number, out: 1 | -1, col: string, col2: string) => Array.from({length: 120}, (_, k) => {
    const x = (k - 60) * 34;
    if (Math.abs(x) > R * 0.95) return null;
    const a = along(c, R, x, out);
    const nx = (a.p[0] - c[0]) / R, ny = (a.p[1] - c[1]) / R;
    return (
      <g key={k}>
        <circle cx={a.p[0] + nx * 16} cy={a.p[1] + ny * 16} r={14} fill={col} />
        <circle cx={a.p[0] - nx * 16} cy={a.p[1] - ny * 16} r={14} fill={col2} />
      </g>
    );
  });
  const mhcX = [-1050, -520, 0, 520, 1050];
  const tcrX = [-780, -260, 260, 780];
  return (
    <g>
      <rect width={W} height={H} fill="#1A1030" />
      <g transform={camTransform(cam, 0.55)}>{Array.from({length: 7}, (_, k) => <circle key={k} cx={-2400 + k * 800} cy={(k % 2 ? -700 : 760)} r={300} fill="url(#bokehDeep)" />)}</g>
      <g transform={camTransform(cam)}>
        <circle cx={tC[0]} cy={tC[1]} r={RT_T - 20} fill={P.tcellDeep} />
        <circle cx={tC[0]} cy={tC[1]} r={RT_T - 20} fill="url(#volSoft)" opacity={0.6} />
        <circle cx={cC[0]} cy={cC[1]} r={RT_C - 20} fill={CAMO.fill} />
        <circle cx={cC[0]} cy={cC[1]} r={RT_C - 20} fill="url(#volSoft)" opacity={0.5} />
        {heads(tC, RT_T, -1, P.tcellLight, P.tcell)}
        {heads(cC, RT_C, 1, CAMO.light, CAMO.fill)}
        {mhcX.map((x, k) => {
          const a = along(cC, RT_C, x, 1);
          return <g key={'m' + k} transform={`translate(${a.p[0]} ${a.p[1]}) rotate(${a.ang}) scale(${0.25 + 0.75 * sq})`}><MHC x={0} y={0} t={t} neo={k === 2} kind={0} flag={k === 2 ? gold * 0.35 : 0} /></g>;
        })}
        {tcrX.map((x, k) => {
          const a = along(tC, RT_T, x, -1);
          return <g key={'r' + k} transform={`translate(${a.p[0]} ${a.p[1]}) rotate(${a.ang}) translate(0 ${180 * sq}) scale(${0.25 + 0.65 * sq})`}><TCR x={0} y={0} t={t} learn={0.2} rot={180} /></g>;
        })}
        {(() => {
          // the learning receptor at the centre: reshapes, then travels until it seats on the fingerprint
          return <TCR x={0} y={lerp(tY + 110 * sq, cY - 330 * sq, meet)} t={t} learn={learn} kind={0} rot={180} s={0.25 + 0.75 * sq} gold={gold * 0.5} />;
        })()}
      </g>
    </g>
  );
};

export const shotsE4: Shot[] = [
  {id: 'E-surface', t0: SURF_OUT[0], t1: R_IN[1] + 0.05, fade: SURF_OUT[1] - SURF_OUT[0], draw: (t) => <Surface t={t} cam={surfCam(t)} />},
  {id: 'E-routes', t0: R_IN[0], t1: tE.imagine + 0.3, fade: R_IN[1] - R_IN[0], draw: (t) => <Routes t={t} cam={CAM_V(t)} />},
  {id: 'E-learn', t0: tE.imagine, t1: KILL_IN[1] + 0.05, fade: 0.3, draw: (t) => <Learn t={t} cam={t < SQ[1] ? CAM_L(t) : learnFromKill(KILL_CAM_D(t))} />},
];
export const _e4 = {noise};

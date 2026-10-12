import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {CharacterSide, SidePose, sideFK} from '../v2/side';
import {MugSide} from '../v2/props';
import {BikeWorld} from '../v2/Bike2';
import {BIKE_Y, SC} from '../v2/choreo2';
import {Chip, ArrowShape, Pigeon, ScarfHang, WALKP, cl, lerp, popScale, ramp} from '../film2/ui';
import {Globe3, GlobeBack, GlobeP, SpaceBG, makeProj} from './Globe5';
import {BK, Caliper, padGap} from './Brake5';
import {PalmWind} from './Street5';
import {N_FILM, T, WORD, fs} from './timeline5';

/** the calm "family": the explanation stage (normal shared motion), the globe comparison, and the return to the brake composition (the loop) */
export const SPACE_BG = {glowX: BK.cx + 60, glowY: BK.cy};
export const rotAll = (f: number) => 40 + 4 * (f - N_FILM); // continuous with frame 0 of the film (rot = 40 + 4 f)

/* ================================================================== the stage: NORMAL DAY, everything on the ground moving together (f342-496) */
const SLAB = {x0: 70, x1: 1010, y: 1230};
const StageStreaks: React.FC<{f: number; k: number}> = ({f, k}) => (
  <g>
    {Array.from({length: 26}).map((_, i) => {
      const y = 640 + rand(i + 3) * 1000, ok = !(y > 1090 && y < 1330) || i % 3 === 0;
      if (!ok) return null;
      const len = 140 + rand(i + 5) * 340, v = 38 + rand(i + 7) * 60, x = W + 420 - (((f - T.stageA) * v + rand(i + 9) * (W + 900)) % (W + 900));
      return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke={i % 3 === 0 ? C.saffronLight : C.cream} strokeWidth={5 + rand(i + 11) * 8} strokeLinecap="round" opacity={(0.2 + 0.4 * rand(i + 13)) * k} />;
    })}
  </g>
);
export const Stage: React.FC<{f: number; graphics: boolean; scale?: number; at?: {x: number; y: number}; streaks?: number}> = ({f, graphics, scale = 1, at = {x: 540, y: SLAB.y}, streaks = 1}) => {
  const t = f - T.stageA;
  const pose: SidePose = {...WALKP(t * 1.0), mouth: 'smile', brows: 0.1};
  const sc = SC * 1.0, hx = 330, ground = SLAB.y;
  const fk0 = sideFK(pose, {x: hx, y: 0}, sc);
  const hip = {x: hx, y: ground - fk0.lowest - 4 * Math.abs(Math.sin((t / 30) * Math.PI))};
  const fk = sideFK(pose, hip, sc);
  const bob = 4 * Math.sin(t * 0.09);
  const arr = (fr: number, x: number, y: number) => { const s = popScale(f, fr) * (1 - ramp(f, T.toGlobeA - 6, T.toGlobeA, (q) => q)); return s > 0.01 ? <g key={fr} transform={`translate(${x} ${y}) scale(${s})`}><ArrowShape x={0} y={0} w={170} /></g> : null; };
  const pulse = 1 + 0.1 * Math.sin(Math.PI * cl((f - fs(WORD.withE) - 4) / 10)) * (f >= fs(WORD.withE) + 4 ? 1 : 0);
  return (
    <g>
      <StageStreaks f={f} k={streaks} />
      <g transform={`translate(${at.x} ${at.y}) scale(${scale}) translate(${-540} ${-SLAB.y}) translate(0 ${bob})`}>
        <ellipse cx={540} cy={SLAB.y + 150} rx={460} ry={22} fill={C.ink} opacity={0.35} />
        {/* the slab of ground */}
        <rect x={SLAB.x0} y={SLAB.y} width={SLAB.x1 - SLAB.x0} height={150} rx={22} fill={C.paperDeep} stroke={C.ink} strokeWidth={6} />
        <rect x={SLAB.x0} y={SLAB.y} width={SLAB.x1 - SLAB.x0} height={52} rx={22} fill={C.cream} stroke={C.ink} strokeWidth={6} />
        <rect x={SLAB.x0 + 3} y={SLAB.y + 52} width={SLAB.x1 - SLAB.x0 - 6} height={28} fill={C.coral} />
        {Array.from({length: 7}).map((_, i) => <line key={i} x1={SLAB.x0 + 120 + i * 130} y1={SLAB.y + 6} x2={SLAB.x0 + 100 + i * 130} y2={SLAB.y + 50} stroke={C.paperLine} strokeWidth={5} />)}
        <line x1={SLAB.x0 + 4} y1={SLAB.y + 52} x2={SLAB.x1 - 4} y2={SLAB.y + 52} stroke={C.ink} strokeWidth={5} />
        {/* on it: a palm, a bicycle, her */}
        <PalmWind x={900} baseY={SLAB.y + 10} h={330} k={0} f={0} seed={1} />
        <g transform={`translate(660 ${SLAB.y - BIKE_Y + 6})`}><BikeWorld f={0} at={{x: 0, ang: 0, tilt: 0}} /></g>
        <CharacterSide pose={pose} hip={hip} sc={sc} scarfWrap scarf={<ScarfHang n={fk.N} z={1} sway={t * 0.1} />} holdN={<MugSide tilt={0} sc={sc} />} />
        <Pigeon x={820} y={820 + 12 * Math.sin(t * 0.17)} s={2.0} fly flap={t * 0.8} />
        {graphics && (
          <g transform={`scale(${pulse})`} style={{transformOrigin: '540px 900px'}}>
            {arr(fs(WORD.you2), 140, 1020)}
            {arr(fs(WORD.move), 540, 1440)}
            {arr(fs(WORD.withE), 840, 700)}
          </g>
        )}
      </g>
      {graphics && scale >= 0.99 && <Chip x={540} y={1540} w={350} text="NORMAL DAY" tone="still" scale={popScale(f, T.stageA + 4) * (1 - ramp(f, T.toGlobeA - 6, T.toGlobeA, (q) => q))} />}
    </g>
  );
};

/* ================================================================== the globe comparison (f470-596) and the return to the opening composition (f596-744) */
export const geoAt = (f: number) => {
  const m = E.inOut(cl((f - T.latMove0) / (T.latMove1 - T.latMove0))), r = E.inOut(cl((f - T.finA) / 50));
  const tilt0 = lerp(24, 64, m), cy0 = lerp(1060, 995, m);
  return {tilt: lerp(tilt0, 0, r), cx: lerp(540, BK.cx, r), cy: lerp(cy0, BK.cy, r), R: lerp(380, BK.R, r)};
};
const Marker: React.FC<{proj: ReturnType<typeof makeProj>; lat: number; lon: number; span: number; k: number; icon?: number}> = ({proj, lat, lon, span, k, icon = 1}) => {
  if (k <= 0.01) return null;
  const pts: {x: number; y: number}[] = [];
  for (let a = 0; a <= span; a += 3) { const q = proj(lon - a, lat); if (q.vis) pts.push(q); }
  const head = proj(lon, lat);
  if (!head.vis) return null;
  const d = pts.length > 1 ? 'M ' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ') : '';
  return (
    <g opacity={k * Math.min(1, head.z * 4)}>
      {d && <path d={d} fill="none" stroke={C.ink} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />}
      {d && <path d={d} fill="none" stroke={C.saffron} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />}
      {pts.length > 2 && (() => { const a = pts[1], dx = head.x - a.x, dy = head.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux; return <path d={`M ${head.x + ux * 48} ${head.y + uy * 48} L ${head.x + nx * 36} ${head.y + ny * 36} L ${head.x - nx * 36} ${head.y - ny * 36} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />; })()}
      <circle cx={head.x} cy={head.y} r={30 * icon} fill={C.saffron} stroke={C.ink} strokeWidth={7} />
      <circle cx={head.x} cy={head.y} r={10 * icon} fill={C.cream} />
    </g>
  );
};

export const GlobeFamily: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const g = geoAt(f), rot = rotAll(f);
  const ringK = ramp(f, T.ringA, T.ringB, (x) => x), lineK = (1 - ringK) * 0.95 * (1 - ramp(f, T.toGlobeA, T.toGlobeA + 1, (x) => x) * 0);
  const blur = f < T.finA ? 3 : lerp(3, 6, cl((f - T.finA) / 30));
  const props: GlobeP = {cx: g.cx, cy: g.cy, R: g.R, rot, tilt: g.tilt, id: 'gf', cloud: rot * 0.35, blur, ring: ringK, line: lineK};
  const proj = makeProj(g.cx, g.cy, g.R, rot, g.tilt);
  const mk = 1 - ramp(f, T.finA, T.finA + 24, (x) => x), grow = ramp(f, T.toGlobeA + 8, T.toGlobeB + 4, (x) => x);
  const pole = ramp(f, T.latMove0 + 6, T.latMove0 + 22, (x) => x);
  const eqL = [-128, -8, 112], poL = [-128, -8, 112];
  const front = (lat: number, ls: number[]) => ls.map((l) => ({l, q: proj(l, lat)})).sort((a, b) => b.q.z - a.q.z)[0];
  const fe = front(0, eqL), fp = front(75, poL);
  const chipEq = popScale(f, T.toGlobeB + 2) * (1 - ramp(f, T.latMove0 + 4, T.latMove0 + 14, (x) => x));
  const chipPole = popScale(f, T.latMove0 + 24) * (1 - ramp(f, T.finA - 6, T.finA, (x) => x));
  const caliperIn = ramp(f, T.caliperA, T.caliperB, E.inOut);
  const sc = 0.5 + 0.5 * grow;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <SpaceBG id="bkbg" glowX={SPACE_BG.glowX} glowY={SPACE_BG.glowY} />
      <g transform={`translate(${g.cx} ${g.cy}) scale(${f < T.toGlobeB ? sc : 1}) translate(${-g.cx} ${-g.cy})`} opacity={f < T.toGlobeB ? 0.35 + 0.65 * grow : 1}>
        <GlobeBack {...props} />
        <Globe3 {...props} />
        {eqL.map((l) => <Marker key={`e${l}`} proj={proj} lat={0} lon={l} span={62} k={(f < T.toGlobeB ? 0 : 1) * mk * ramp(f, T.toGlobeB, T.toGlobeB + 6, (x) => x)} />)}
        {poL.map((l) => <Marker key={`p${l}`} proj={proj} lat={75} lon={l} span={62} k={pole * mk} />)}
      </g>
      {graphics && (
        <g>
          <Chip x={Math.max(240, Math.min(840, fe.q.x))} y={fe.q.y + 100} w={320} text="EQUATOR" tone="still" scale={chipEq} />
          <Chip x={Math.max(280, Math.min(800, fp.q.x))} y={fp.q.y + 96} w={400} text="NEAR A POLE" tone="still" scale={chipPole} />
        </g>
      )}
      {caliperIn > 0.001 && <g transform={`translate(${(1 - caliperIn) * 640} 0)`}><Caliper t={f - N_FILM} /></g>}
    </svg>
  );
};
void padGap; void H;

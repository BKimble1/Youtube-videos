// One frame: the camera (story.ts) over the lab layers, the game canvas on the top monitor, the chip and culture nested
// in the CL1's headstage, then screen-space overlays (signal tokens, the lens, labels, the microscope iris and section,
// electrode-group outlines) and the captions (never inside a camera transform).
import React from 'react';
import {GameScreen} from './game/GameScreen';
import {Micro, MicroMap, CYAN, AMBER} from './micro/Micro';
import {ELECTRODES, electrode, ER, GROUPS} from './micro/culture';
import {LabBack, LabFront, Wall, ScreenGlare, INK} from './lab/Lab';
import {CHIP, chipK, chipToLab, GAME, Pt, pt} from './lab/geo';
import {
  alongPts, camAt, Cam, CMD_PULSES, cmdRouteOf, encAmt, focusBlur, groupsAmt, irisAmt, labelAmt, LABELS, LENS, lensState,
  rideNow, routeLen, routePts, scopeAmt, sectionAmt, trafficAmt, TRAFFIC_ROUTES,
} from './story';
import {clamp, ss} from './lib';
import {Captions} from './Captions';

export const W = 1080, H = 1920;
const WALL_Z = 30; // the back wall's extra frame width (cm): it moves less than the bench

const xf = (c: Cam) => {
  const s = W / c.w;
  return {s, tf: `matrix(${s} 0 0 ${s} ${W / 2 - s * c.x} ${H / 2 - s * c.y})`, to: (p: Pt) => pt(W / 2 + s * (p.x - c.x), H / 2 + s * (p.y - c.y))};
};
const microMap = (c: Cam): MicroMap => {
  const s = W / c.w, k = chipK(c.w);
  return {sx: s * 1e-4, sy: s * 1e-4 * k, tx: W / 2 + s * (CHIP.x - c.x), ty: H / 2 + s * (CHIP.y - c.y)};
};

const Token: React.FC<{p: Pt; col: string; trail?: Pt[]; size?: number; a?: number}> = ({p, col, trail, size = 1, a = 1}) => (
  <g opacity={a}>
    {trail && trail.length > 1 && (
      <polyline points={trail.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')} fill="none" stroke={col} strokeWidth={7 * size} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
    )}
    <circle cx={p.x} cy={p.y} r={30 * size} fill={col} opacity={0.22} />
    <circle cx={p.x} cy={p.y} r={16 * size} fill={col} opacity={0.55} />
    <circle cx={p.x} cy={p.y} r={8 * size} fill="#FFFFFF" />
  </g>
);
/** token at arc length s on a lab route, with a trail of the given length (cm), in screen space */
const routeToken = (pts: Pt[], s: number, trailCm: number, to: (p: Pt) => Pt) => {
  const p = to(alongPts(pts, s));
  const tr: Pt[] = [];
  for (let k = 0; k <= 10; k++) tr.push(to(alongPts(pts, Math.max(0, s - trailCm * (1 - k / 10)))));
  return {p, tr};
};

export const Scene: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const cam = camAt(t);
  const {s, tf, to} = xf(cam);
  const iw = (2.6 * cam.w) / W; // ink: a constant 2.6 px on screen
  // the lab is drawn unless the chip's carrier covers the whole frame
  const kk = chipK(cam.w);
  const cc0 = to(pt(CHIP.x - 1.21, CHIP.y - 1.21 * kk)), cc1 = to(pt(CHIP.x + 1.21, CHIP.y + 1.21 * kk));
  const showLab = !(cc0.x <= 0 && cc1.x >= W && cc0.y <= 0 && cc1.y >= H);
  const labBlur = cam.w < 9 ? clamp(Math.log(9 / cam.w) * 5.5, 0, 13) : 0;
  const wallCam: Cam = {...cam, w: cam.w + WALL_Z};
  const wx = xf(wallCam);
  // the game screen on the frame
  const g0 = to(pt(GAME.x0, GAME.y0)), g1 = to(pt(GAME.x1, GAME.y1));
  const gameVis = showLab && g1.x > 0 && g0.x < W && g1.y > 0 && g0.y < H;
  // the chip on the frame
  const k = chipK(cam.w);
  const c0 = to(pt(CHIP.x - 1.3, CHIP.y - 1.3 * k)), c1 = to(pt(CHIP.x + 1.3, CHIP.y + 1.3 * k));
  const chipVis = c1.x > 0 && c0.x < W && c1.y > 0 && c0.y < H && c1.x - c0.x > 6;
  const mm = microMap(cam);
  const scope = scopeAmt(t);
  const fb = focusBlur(t);
  const lidAlpha = clamp((cam.w - 6) / 6);
  // signal tokens
  const ride = rideNow(t);
  const tokens: React.ReactNode[] = [];
  if (ride) {
    const col = ride.rd.kind === 'stim' ? CYAN : AMBER;
    const {p, tr} = routeToken(ride.pts, ride.s, ride.w * 0.45, to);
    tokens.push(<Token key="ride" p={p} col={col} trail={tr} />);
  }
  for (const cp of CMD_PULSES) {
    const u = (t - cp.t) / 0.26;
    if (u < 0 || u > 1 || ride) continue;
    const pts = routePts(cmdRouteOf(cp.from), cam.w);
    const {p, tr} = routeToken(pts, u * routeLen(pts), 6, to);
    tokens.push(<Token key={`cp${cp.t}`} p={p} col={AMBER} trail={tr} size={0.8} a={1 - ss(u, 0.85, 1)} />);
  }
  const ta = trafficAmt(t);
  if (ta > 0.01 && !ride && showLab) {
    for (const [kind, ph] of [['stim', 0], ['rec', 0.45]] as const) {
      const u = (((t + ph) % 0.9) + 0.9) % 0.9 / 0.75;
      if (u > 1) continue;
      const pts = routePts(TRAFFIC_ROUTES[kind](), cam.w);
      const {p, tr} = routeToken(pts, u * routeLen(pts), 5, to);
      tokens.push(<Token key={`tr${kind}`} p={p} col={kind === 'stim' ? CYAN : AMBER} trail={tr} size={0.62} a={ta * (1 - ss(u, 0.85, 1)) * ss(u, 0, 0.08)} />);
    }
  }
  // the lens
  const ls = lensState(t);
  const lc = to(ls.c), lr = ls.r * s;
  const lensVis = ls.a > 0.01 && showLab && lr > 8;
  const chipScreen = to(pt(CHIP.x - 0.6, CHIP.y));
  const lensMap = (R: number): MicroMap => {
    const ppu = (2 * R) / LENS.um.w;
    return {sx: ppu, sy: ppu, tx: R - LENS.um.x * ppu, ty: R - LENS.um.y * ppu};
  };
  // electrode groups on the array
  const ga = groupsAmt(t), ea = encAmt(t);
  const eScreen = (c: number) => {
    const e = electrode(c);
    return pt(mm.sx * e.x + mm.tx, mm.sy * e.y + mm.ty);
  };
  const ppu = mm.sx;
  const groupBox = (cs: number[], col: string, label: string) => {
    const ps = cs.map(eScreen);
    const pad = (ER + 34) * ppu;
    const x0 = Math.min(...ps.map((p) => p.x)) - pad, x1 = Math.max(...ps.map((p) => p.x)) + pad;
    const y0 = Math.min(...ps.map((p) => p.y)) - pad, y1 = Math.max(...ps.map((p) => p.y)) + pad;
    return (
      <g key={label}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={pad * 0.8} fill={col} fillOpacity={0.1} stroke={col} strokeWidth={5} />
        <rect x={(x0 + x1) / 2 - 92} y={y0 - 70} width={184} height={60} rx={30} fill={col} stroke={INK} strokeWidth={4} />
        <text x={(x0 + x1) / 2} y={y0 - 26} textAnchor="middle" fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={44} fill={INK}>{label}</text>
      </g>
    );
  };
  // microscope iris and section
  const ia = irisAmt(t);
  const IR = 1500 - ia * 1020, ICX = 540, ICY = 880;
  const sa = sectionAmt(t);
  return (
    <>
      {showLab && (
        <div style={{position: 'absolute', inset: 0, filter: labBlur > 0.4 ? `blur(${labBlur.toFixed(1)}px)` : undefined}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <g transform={wx.tf}>
              <Wall iw={(2.6 * wallCam.w) / W} t={t} />
            </g>
            <g transform={tf}>
              <LabBack iw={iw} t={t} />
            </g>
          </svg>
        </div>
      )}
      {gameVis && <GameScreen t={t} rect={{x: g0.x, y: g0.y, w: g1.x - g0.x, h: g1.y - g0.y}} />}
      {gameVis && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <g transform={tf}>
            <ScreenGlare iw={iw} />
          </g>
        </svg>
      )}
      {chipVis && (
        <div style={{position: 'absolute', inset: 0, filter: fb > 0.3 ? `blur(${fb.toFixed(1)}px)` : undefined}}>
          <Micro t={t} m={mm} W={W} H={H} scope={scope} id="mc" dof={t > 23.9 && t < 26.2 ? ss(t, 23.9, 24.4) * (1 - ss(t, 25.9, 26.2)) * 0.85 : 0} />
        </div>
      )}
      {showLab && (
        <div style={{position: 'absolute', inset: 0, filter: labBlur > 0.4 ? `blur(${labBlur.toFixed(1)}px)` : undefined}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <g transform={tf}>
              <LabFront iw={iw} t={t} lidAlpha={lidAlpha} />
            </g>
          </svg>
        </div>
      )}
      {/* overlays */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {ea > 0.01 && (
          <g opacity={ea}>
            {GROUPS.enc.map((c) => {
              const p = eScreen(c);
              return <circle key={c} cx={p.x} cy={p.y} r={(ER + 22) * ppu} fill="none" stroke={CYAN} strokeWidth={4} strokeDasharray="10 8" />;
            })}
            {(() => {
              const p = eScreen(19);
              return (
                <g>
                  <rect x={p.x - 110} y={p.y - (ER + 22) * ppu - 80} width={220} height={60} rx={30} fill={CYAN} stroke={INK} strokeWidth={4} />
                  <text x={p.x} y={p.y - (ER + 22) * ppu - 36} textAnchor="middle" fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={44} fill={INK}>INPUT</text>
                </g>
              );
            })()}
          </g>
        )}
        {ga > 0.01 && (
          <g opacity={ga}>
            {groupBox(GROUPS.move, '#7FE3B5', 'MOVE')}
            {groupBox(GROUPS.turn, '#B79CFF', 'TURN')}
            {groupBox(GROUPS.fire, '#FF8A6B', 'FIRE')}
          </g>
        )}
        {tokens}
        {ia > 0.01 && (
          <g>
            <path d={`M0 0 H${W} V${H} H0 Z M${ICX - IR} ${ICY} a ${IR} ${IR} 0 1 0 ${2 * IR} 0 a ${IR} ${IR} 0 1 0 ${-2 * IR} 0 Z`} fillRule="evenodd" fill="#061015" opacity={0.97 * ia} />
            <circle cx={ICX} cy={ICY} r={IR} fill="none" stroke="#1E3A47" strokeWidth={10} opacity={ia} />
            <circle cx={ICX} cy={ICY} r={IR - 8} fill="none" stroke="#000" strokeWidth={20} opacity={0.25 * ia} />
          </g>
        )}
        {sa > 0.01 && <Section mm={mm} a={sa} cy={ICY} R={IR} />}
        {lensVis && (
          <g opacity={ls.a}>
            <line x1={lc.x + lr * 0.86} y1={lc.y - lr * 0.5} x2={chipScreen.x} y2={chipScreen.y} stroke={INK} strokeWidth={7} strokeLinecap="round" />
            <line x1={lc.x + lr * 0.86} y1={lc.y - lr * 0.5} x2={chipScreen.x} y2={chipScreen.y} stroke="#E8F4F8" strokeWidth={3} strokeLinecap="round" strokeDasharray="10 9" />
            <circle cx={chipScreen.x} cy={chipScreen.y} r={9} fill="none" stroke="#E8F4F8" strokeWidth={3} />
          </g>
        )}
      </svg>
      {lensVis && (
        <div style={{position: 'absolute', left: lc.x - lr, top: lc.y - lr, width: 2 * lr, height: 2 * lr, borderRadius: '50%', overflow: 'hidden', opacity: ls.a, boxShadow: '0 10px 30px rgba(0,0,0,0.45)'}}>
          <Micro t={t} m={lensMap(lr)} W={2 * lr} H={2 * lr} id="lens" />
        </div>
      )}
      {lensVis && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <g opacity={ls.a}>
            <circle cx={lc.x} cy={lc.y} r={lr} fill="none" stroke={INK} strokeWidth={9} />
            <circle cx={lc.x} cy={lc.y} r={lr - 7} fill="none" stroke="#E8F4F8" strokeWidth={4} opacity={0.8} />
            <path d={`M ${lc.x - lr * 0.62} ${lc.y - lr * 0.55} A ${lr * 0.84} ${lr * 0.84} 0 0 1 ${lc.x + lr * 0.1} ${lc.y - lr * 0.83}`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.45} />
            {ls.grow > 0.01 && <circle cx={lc.x} cy={lc.y} r={lr + 14 + ls.grow * 10} fill="none" stroke={AMBER} strokeWidth={5} opacity={ls.grow * 0.8} />}
          </g>
        </svg>
      )}
      {LABELS.map((l, i) => {
        const a = labelAmt(l, t);
        if (a < 0.01 || !showLab) return null;
        const p = to(l.at);
        const q = pt(p.x + (l.dx ?? 0), p.y + (l.dy ?? 0));
        const bg = l.tone === 'bio' ? '#FFD9C7' : l.tone === 'tech' ? '#CFE6F5' : '#FFFFFF';
        return (
          <React.Fragment key={i}>
            <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: a}}>
              <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={INK} strokeWidth={6} strokeLinecap="round" />
              <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
              <circle cx={p.x} cy={p.y} r={7} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
            </svg>
            <div style={{position: 'absolute', left: q.x, top: q.y, transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * a})`, opacity: a, background: bg, border: `4px solid ${INK}`, borderRadius: 40, padding: '6px 22px 8px', whiteSpace: 'nowrap',
              fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 38, color: INK}}>{l.text}</div>
          </React.Fragment>
        );
      })}
      {captions && <Captions t={t} />}
    </>
  );
};

/** "They're growing on a chip": a cross-section under the microscope field, aligned with the electrodes above it */
const Section: React.FC<{mm: MicroMap; a: number; cy: number; R: number}> = ({mm, a, cy, R}) => {
  const y0 = cy + R + 40; // the panel's top
  const ySurf = y0 + 190; // the chip surface
  const row = ELECTRODES.filter((e) => e.row === 4);
  const cutY = mm.sy * 100 + mm.ty;
  const reveal = ss(a, 0, 1);
  const cells = Array.from({length: 9}, (_, i) => {
    const x = 90 + i * 112 + ((i * 37) % 23);
    return {x, r: 22 + ((i * 13) % 9)};
  });
  return (
    <g opacity={a}>
      <line x1={540 - R * 0.97} y1={cutY} x2={540 + R * 0.97} y2={cutY} stroke="#FFFFFF" strokeWidth={4} strokeDasharray="16 12" opacity={0.85} />
      <clipPath id="secClip">
        <rect x={60} y={y0} width={960} height={(330 * reveal)} rx={26} />
      </clipPath>
      <g clipPath="url(#secClip)">
        <rect x={60} y={y0} width={960} height={330} rx={26} fill="#F2B7C8" stroke={INK} strokeWidth={5} />
        <rect x={60} y={ySurf} width={960} height={140} fill="#AFC9D2" />
        <rect x={60} y={ySurf} width={960} height={6} fill="#E6F2F6" />
        {row.map((e) => {
          const x = mm.sx * e.x + mm.tx;
          if (x < 80 || x > 1000) return null;
          const hw = ER * mm.sx;
          return <rect key={e.c} x={x - hw} y={ySurf - 10} width={2 * hw} height={14} rx={3} fill="#D9A84E" stroke={INK} strokeWidth={3} />;
        })}
        <path d={`M70 ${ySurf - 6} ${cells.map((c, i) => `Q ${c.x - 50} ${ySurf - 4 - (i % 2) * 6} ${c.x} ${ySurf - 8}`).join(' ')} L1010 ${ySurf - 6}`} fill="none" stroke="#D9836C" strokeWidth={5} />
        {cells.map((c, i) => (
          <g key={i}>
            <ellipse cx={c.x} cy={ySurf - c.r * 0.62 - 6} rx={c.r} ry={c.r * 0.62} fill="#F6C2AD" stroke="#6B2C2A" strokeWidth={3} />
            <ellipse cx={c.x + 2} cy={ySurf - c.r * 0.62 - 7} rx={c.r * 0.42} ry={c.r * 0.3} fill="#C76F5E" opacity={0.75} />
          </g>
        ))}
        <rect x={60} y={y0} width={960} height={330} rx={26} fill="none" stroke={INK} strokeWidth={5} />
      </g>
      {reveal > 0.9 && (
        <g opacity={ss(a, 0.9, 1)} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={34} fill={INK}>
          <text x={96} y={y0 + 60}>neurons</text>
          <text x={96} y={ySurf + 80}>glass chip</text>
          <text x={984} y={ySurf + 80} textAnchor="end">electrode</text>
        </g>
      )}
    </g>
  );
};
export {CYAN};

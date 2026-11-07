// Geometry proof sheet: the rig through several cameras and flap phases, drawn as flat silhouettes (not final art).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, Basis, bodyFrame, ellipsoid2, Frame, Orbit, poly, proj, xf, V3, smoothClosed, rotZ} from '../three';
import {BODY, BEAK, EYE, GEARS, HINGE, MOTOR, pose, phiOfPhase, wingPt, WING_OUTLINE, FEATHERS, TAIL, WingFrame, Pose, SPAR} from '../rig';

const P = (B: Basis, F: Frame, p: V3) => proj(B, xf(F, p));
const ellFrame = (F: Frame, tilt = 0): Frame => {
  const ex = xfv2(F, rotZ([1, 0, 0], tilt)), ey = xfv2(F, rotZ([0, 1, 0], tilt));
  return {o: F.o, ex, ey, ez: F.ez};
};
const xfv2 = (F: Frame, v: V3): V3 => [F.ex[0] * v[0] + F.ey[0] * v[1] + F.ez[0] * v[2], F.ex[1] * v[0] + F.ey[1] * v[1] + F.ez[1] * v[2], F.ex[2] * v[0] + F.ey[2] * v[1] + F.ez[2] * v[2]];

export const ProtoBird: React.FC<{B: Basis; F: Frame; ps: Pose; xray?: boolean}> = ({B, F, ps, xray}) => {
  const wing = (W: WingFrame, fill: string) => {
    const pts = WING_OUTLINE.map(([a, b]) => P(B, F, wingPt(W, a, b)));
    const toEye: V3 = [B.eye[0] - xf(F, W.o)[0], B.eye[1] - xf(F, W.o)[1], B.eye[2] - xf(F, W.o)[2]];
    const topW = xfv2(F, W.top);
    const up = topW[0] * toEye[0] + topW[1] * toEye[1] + topW[2] * toEye[2] > 0;
    return (
      <g>
        <path d={poly(pts)} fill={up ? fill : '#E8D9C0'} stroke="#172B3A" strokeWidth={2} />
        {FEATHERS.filter((f) => f.kind === 'primary' || f.kind === 'secondary').map((f, i) => {
          const a = P(B, F, wingPt(W, ...f.base)), b = P(B, F, wingPt(W, ...f.tip));
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#172B3A" strokeWidth={1} opacity={0.6} />;
        })}
        <line x1={P(B, F, W.o).x} y1={P(B, F, W.o).y} x2={P(B, F, wingPt(W, SPAR.len, 0)).x} y2={P(B, F, wingPt(W, SPAR.len, 0)).y} stroke="#333" strokeWidth={2} />
      </g>
    );
  };
  const ells = (['rear', 'chest', 'neck', 'head'] as const).map((k) => {
    const e = BODY[k];
    return ellipsoid2(B, ellFrame(F, e.tilt ?? 0), e.c.map((v, i) => v) as V3, e.r);
  });
  // ellipsoid2 takes the centre in the frame's local coords: build frames at the body frame with tilt about the centre
  const ellsFixed = (['rear', 'chest', 'neck', 'head'] as const).map((k) => {
    const e = BODY[k];
    const Fe: Frame = {o: xf(F, e.c), ...(() => { const f = ellFrame(F, e.tilt ?? 0); return {ex: f.ex, ey: f.ey, ez: f.ez}; })()};
    return ellipsoid2(B, Fe, [0, 0, 0], e.r);
  });
  void ells;
  const beak = [BEAK.tip, [BEAK.base[0], BEAK.base[1] + BEAK.hh, 0], [BEAK.base[0], BEAK.base[1] - BEAK.hh, 0]].map((p) => P(B, F, p as V3));
  const eye = P(B, F, EYE.near);
  const g = (id: keyof typeof GEARS, col: string) => {
    const G = GEARS[id];
    const c = P(B, F, [G.c[0], G.c[1], G.z1]);
    return <circle cx={c.x} cy={c.y} r={G.r * c.s} fill={col} stroke="#172B3A" strokeWidth={1.5} />;
  };
  const tail = [TAIL.root, [TAIL.tipX, TAIL.root[1] + 2, TAIL.spread], [TAIL.tipX - 1, TAIL.root[1] + 2, 0], [TAIL.tipX, TAIL.root[1] + 2, -TAIL.spread]].map((p) => P(B, F, p as V3));
  const pin = P(B, F, ps.pin), rn = P(B, F, ps.rodTop.near), rf = P(B, F, ps.rodTop.far);
  const mot = P(B, F, [MOTOR.c[0], MOTOR.c[1], (MOTOR.z0 + MOTOR.z1) / 2]);
  const hn = P(B, F, HINGE.near);
  return (
    <g>
      {wing(ps.wing.far, '#8A6A4A')}
      <path d={poly(tail)} fill="#7A5A3A" stroke="#172B3A" strokeWidth={2} />
      <g opacity={xray ? 0.35 : 1}>
        {ellsFixed.map((pts, i) => <path key={i} d={smoothClosed(pts)} fill="#A07A52" stroke="#172B3A" strokeWidth={2} />)}
        <path d={poly(beak)} fill="#D9A441" stroke="#172B3A" strokeWidth={2} />
        <circle cx={eye.x} cy={eye.y} r={EYE.r * eye.s} fill="#111" />
      </g>
      {xray && (
        <g>
          <circle cx={mot.x} cy={mot.y} r={MOTOR.r * mot.s} fill="#B8C3CC" stroke="#172B3A" />
          {g('A', '#D8B04A')}{g('P0', '#888')}{g('B', '#E6C25A')}{g('P1', '#999')}
          <line x1={pin.x} y1={pin.y} x2={rf.x} y2={rf.y} stroke="#555" strokeWidth={3} />
          <line x1={pin.x} y1={pin.y} x2={rn.x} y2={rn.y} stroke="#222" strokeWidth={4} />
          <circle cx={pin.x} cy={pin.y} r={4} fill="red" />
          <circle cx={hn.x} cy={hn.y} r={4} fill="blue" />
        </g>
      )}
      {wing(ps.wing.near, '#9B7650')}
    </g>
  );
};

const CAMS: Orbit[] = [
  {target: [0, 2, 0], yaw: 25, pitch: 12, dist: 400, scale: 9},
  {target: [0, 2, 0], yaw: -20, pitch: -8, dist: 400, scale: 9},
  {target: [3, 0, 0], yaw: 10, pitch: 5, dist: 300, scale: 22},
];
export const ProtoSheet: React.FC = () => {
  const phases = [0, 0.25, 0.5, 0.75];
  return (
    <AbsoluteFill style={{background: '#DDE6EA'}}>
      <svg width={1080} height={1920}>
        {CAMS.map((c, ci) =>
          phases.map((u, pi) => {
            const w = 1080 / 4, h = 1920 / 3;
            const B = basis({...c, cx: w / 2, cy: h / 2});
            return (
              <g key={`${ci}-${pi}`} transform={`translate(${pi * w},${ci * h})`}>
                <rect width={w} height={h} fill="none" stroke="#999" />
                <ProtoBird B={B} F={bodyFrame([0, 0, 0])} ps={pose(phiOfPhase(u))} xray={ci === 2} />
                <text x={8} y={20} fontSize={16}>{`cam${ci} phase ${u}`}</text>
              </g>
            );
          }),
        )}
      </svg>
    </AbsoluteFill>
  );
};

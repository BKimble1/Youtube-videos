// Return: Tesla's aerial of the second ramp run, at the recording's own speed (rec_224730 2:19.82 to 2:26.73): the car
// rolling upright on its jets, side jets firing, jets down into smoke, touchdown (2:24.3) just after "problems", the camera
// dropping in behind the car. Three small motifs from the explanation ride on the real car and resolve away before the
// call to action: a rotation arrow while it rolls (attitude), the schematic tank losing a few dots while its jets fire
// (finite gas), a dashed ring on the ground where it lands (a clear surrounding area). None of them is a measurement.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {Key, keyed} from '../short3/Clip';
import {AER_FILE0, AER_IN, FPS, WIPE} from './data';
import {Arrow, FLOW, win} from './kit';

const k = (pts: [number, number][]): Key[] => pts.map(([s, v]) => [s - AER_FILE0, v]);
// crop: centre (fractions of 1920 x 1080) and zoom over the 9:16 cover fit, keyed on rec_224730 time
const CX = k([[139.8, 0.47], [140.8, 0.48], [141.7, 0.49], [142.6, 0.5], [143.5, 0.528], [144.4, 0.538], [145.3, 0.538], [146.2, 0.512], [146.75, 0.51]]);
const CY = k([[139.8, 0.44], [141.7, 0.42], [143.5, 0.385], [144.4, 0.38], [145.3, 0.37], [145.75, 0.37], [146.4, 0.45], [146.75, 0.5]]);
const ZM = k([[139.8, 1.3], [144.3, 1.3], [145.6, 1.12], [146.75, 1.05]]);
// the car's centre in the recording (px), measured every 0.45 s
const CAR = {
  x: k([[139.9, 902], [140.35, 915], [140.8, 918], [141.25, 908], [141.7, 935], [142.15, 945], [142.6, 960], [143.05, 982], [143.5, 1012], [143.95, 1020], [144.4, 1030], [144.85, 1025], [145.3, 1030], [145.75, 1018], [146.2, 985], [146.65, 979]]),
  y: k([[139.9, 470], [140.35, 462], [140.8, 466], [141.25, 461], [141.7, 455], [142.15, 442], [142.6, 425], [143.05, 418], [143.5, 405], [143.95, 403], [144.4, 403], [144.85, 400], [145.3, 372], [145.75, 355], [146.2, 346], [146.65, 538]]),
};
const W = 1080, H = 1920;
const view = (tf: number) => {
  const S = (H / 1080) * keyed(ZM, tf);
  const vw = 1920 * S, vh = 1080 * S;
  const left = Math.min(0, Math.max(W - vw, W / 2 - keyed(CX, tf) * vw));
  const top = Math.min(0, Math.max(H - vh, H / 2 - keyed(CY, tf) * vh));
  return {S, vw, vh, left, top};
};

export const Return: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / FPS;
  const tf = AER_IN - AER_FILE0 + (t - WIPE);       // seconds into rk_aerial.mp4
  const src = AER_FILE0 + tf;
  const v = view(tf);
  const car = {x: v.left + keyed(CAR.x, tf) * v.S, y: v.top + keyed(CAR.y, tf) * v.S};
  // motifs (by recording time)
  const roll = win(src, 139.95, 141.35, 0.25, 0.3);
  const gas = win(src, 141.35, 144.45, 0.25, 0.3);
  const ring = win(src, 142.75, 144.75, 0.3, 0.3);
  const dotsLeft = 9 - Math.floor(Math.max(0, Math.min(1, (src - 141.5) / 2.8)) * 5);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile('footage/rk_aerial.mp4')} trimBefore={Math.round((AER_IN - AER_FILE0) * FPS)} muted
          style={{position: 'absolute', left: v.left, top: v.top, width: v.vw, height: v.vh}} />
      </AbsoluteFill>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {roll > 0 && (() => {
          // a roll arrow across the car, perpendicular to its long axis (about 34 deg below horizontal, nose upper
          // left): the face toward the camera turns toward the upper right as the car rights itself (2:19.9-2:21.3)
          const ax = Math.cos((34 * Math.PI) / 180), ay = Math.sin((34 * Math.PI) / 180);
          const px = ay, py = -ax, R = 150, bulge = 70;
          const p0 = {x: car.x - px * R, y: car.y - py * R}, p1 = {x: car.x + px * R, y: car.y + py * R};
          const c = {x: car.x + ax * bulge, y: car.y + ay * bulge};
          const u = 0.86, q = (a: number, b: number, cc: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * cc + u * u * b;
          const pe = {x: q(p0.x, p1.x, c.x), y: q(p0.y, p1.y, c.y)};
          const d = `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${pe.x} ${pe.y}`;
          return (
            <g opacity={roll}>
              <path d={d} fill="none" stroke={C.ink} strokeWidth={20} strokeLinecap="round" />
              <path d={d} fill="none" stroke={C.saffron} strokeWidth={12} strokeLinecap="round" />
              <Arrow x1={pe.x} y1={pe.y} x2={p1.x} y2={p1.y} color={C.saffron} w={12} head={34} />
            </g>
          );
        })()}
        {ring > 0 && (
          <g opacity={ring} transform={`translate(${car.x} ${car.y + 30}) rotate(-8)`}>
            <ellipse rx={300} ry={175} fill="none" stroke="#FFFFFF" strokeWidth={12} strokeDasharray="34 26" opacity={0.55} />
            <ellipse rx={300} ry={175} fill="none" stroke={C.saffron} strokeWidth={6} strokeDasharray="34 26" />
          </g>
        )}
        {gas > 0 && (
          <g opacity={gas} transform={`translate(${car.x + 210} ${car.y - 230}) scale(1.9)`}>
            <rect x={-70} y={-20} width={140} height={40} rx={20} fill="#C4CDD3" stroke={C.ink} strokeWidth={4} />
            <rect x={-62} y={-13} width={124} height={26} rx={13} fill="#20303E" />
            {Array.from({length: 9}, (_, i) => (
              <circle key={i} cx={-50 + i * 12.5} cy={0} r={4.2} fill="#9CC2F2" opacity={i < dotsLeft ? 1 : 0.12} />
            ))}
            <path d="M -40 22 Q -60 50 -88 66" stroke={FLOW} strokeWidth={4} fill="none" strokeDasharray="7 7" strokeDashoffset={-t * 60} />
          </g>
        )}
      </svg>
      {ring > 0.05 && (
        <div style={{position: 'absolute', left: car.x - 300, top: car.y + 220, opacity: ring, fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.ink}}>
          <span style={{background: C.cream, border: `2.5px solid ${C.ink}`, borderRadius: 16, padding: '3px 14px'}}>clear area</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

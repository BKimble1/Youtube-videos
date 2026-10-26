// V2 rod comparison. R1 (25.61-26.60): an ordinary house with a lightning rod on its gable, at night in the rain; a
// discharge in the distance lights the scene and glints on the rod's metal tip while the camera pushes in. R2
// (26.60-28.94): two compositions: (a) the mast at the ridge, the camera tilting up it; (b) the tip itself against the
// empty sky, ending with the tip at the screen point where R3 opens on the tower's tip (a matched cut). The rod is
// shown as what it is (a grounded metal terminal on a protected building); nothing marks or denies a protected zone.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1, V} from '../dc/math';
import {Clouds, Rain, Ranges, Sky} from '../art/Env';
import {ROD_TIP, ROUTE} from '../scenes/Rod';
import {ss} from '../lib';
import {sm5} from '../camera';
import {S} from './timeline2';

const INKR = '#0B151C';
/** the distant discharge (behind the house, far right) */
const STRIKES = [{t: 25.74, k: 1}, {t: 25.9, k: 0.6}, {t: 28.25, k: 0.45}];
const strikeK = (t: number) => STRIKES.reduce((a, s) => a + (t >= s.t ? s.k * Math.exp(-(t - s.t) / 0.09) : 0), 0);
const FAR_BOLT: V[] = (() => {
  const pts: V[] = [];
  for (let i = 0; i <= 14; i++) pts.push({x: 1010 + 46 * Math.sin(i * 1.3) * (i / 14) + 22 * (hash(i, 51) - 0.5), y: 300 + (830 * i) / 14});
  return pts;
})();
const FarBolt: React.FC<{cam: Cam; k: number}> = ({cam, k}) => {
  if (k < 0.03) return null;
  const d = FAR_BOLT.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
  const br = `M${fmt(FAR_BOLT[5].x)},${fmt(FAR_BOLT[5].y)} l70,90 l-10,80 l50,70`;
  return (
    <Layer cam={cam} depth={4}>
      <g style={{mixBlendMode: 'screen'}} opacity={clamp(k)}>
        <path d={d} fill="none" stroke="#7C88FF" strokeOpacity={0.35} strokeWidth={18} strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#DDE3FF" strokeWidth={3.5} strokeLinejoin="round" />
        <path d={br} fill="none" stroke="#C6D0FF" strokeOpacity={0.7} strokeWidth={3} />
      </g>
    </Layer>
  );
};

const RodWorld2: React.FC<{cam: Cam; t: number; rt: number; drift: number; flash: number; glint: number; behind?: React.ReactNode}> = ({cam, t, rt, drift, flash, glint, behind}) => {
  const cop = '#C7834A', copL = '#F0B07A';
  const route = ROUTE.slice(0, -1).map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
  return (
    <g>
      <Sky flash={flash} />
      <Ranges cam={cam} flash={flash} />
      <Clouds cam={{...cam, x: cam.x - 200}} flash={flash} drift={drift} />
      {behind}
      <Rain cam={cam} rt={rt} flash={flash} />
      <Layer cam={cam} depth={1}>
        {/* ground, path and a fence */}
        <path d="M-1200,1760 L2200,1760 L2200,2700 L-1200,2700 Z" fill="#26343C" />
        <path d="M-1200,1760 L2200,1760" stroke={INKR} strokeWidth={4} />
        {Array.from({length: 18}, (_, i) => (
          <line key={i} x1={-900 + i * 70} y1={1760} x2={-900 + i * 70} y2={1700} stroke="#4A5A60" strokeWidth={8} />
        ))}
        <line x1={-920} y1={1716} x2={300} y2={1716} stroke="#4A5A60" strokeWidth={6} />
        {/* the house: plastered wall with windows, a slate gable roof, chimney */}
        <path d="M240,1760 L240,1240 L862,1240 L862,1760 Z" fill={mix('#8E8778', '#C4C6E6', flash * 0.45)} stroke={INKR} strokeWidth={4} />
        <path d="M240,1240 L862,1240 L862,1270 L240,1270 Z" fill="#6E685C" />
        {[[320, 1340], [560, 1340], [320, 1540], [560, 1540]].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width={120} height={130} fill={i === 1 ? '#E9B86C' : mix('#2C3A44', '#8A96C8', flash * 0.6)} stroke={INKR} strokeWidth={4} />
            <line x1={x + 60} y1={y} x2={x + 60} y2={y + 130} stroke={INKR} strokeWidth={3} />
            <line x1={x} y1={y + 65} x2={x + 120} y2={y + 65} stroke={INKR} strokeWidth={3} />
          </g>
        ))}
        <rect x={700} y={1560} width={100} height={200} fill="#4A3A2E" stroke={INKR} strokeWidth={4} />
        <path d="M200,1250 L551,1010 L902,1250 Z" fill={mix('#3B4650', '#7A84B8', flash * 0.5)} stroke={INKR} strokeWidth={4} strokeLinejoin="round" />
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M${fmt(551 - (i + 1) * 39)},${fmt(1010 + (i + 1) * 26.7)} L${fmt(551 + (i + 1) * 39)},${fmt(1010 + (i + 1) * 26.7)}`} stroke={INKR} strokeOpacity={0.35} strokeWidth={2} />
        ))}
        <rect x={360} y={1030} width={60} height={110} fill="#6B5446" stroke={INKR} strokeWidth={4} />
        <rect x={352} y={1020} width={76} height={16} fill="#5A463A" stroke={INKR} strokeWidth={3} />
        {/* the lightning protection: down-conductor (copper strip on stand-off clips), earth clamp, mast and tip */}
        <path d={route} fill="none" stroke={INKR} strokeWidth={11} strokeLinejoin="round" />
        <path d={route} fill="none" stroke={cop} strokeWidth={6} strokeLinejoin="round" />
        <path d={route} fill="none" stroke={copL} strokeWidth={2} strokeLinejoin="round" opacity={0.7} transform="translate(-1.5 0)" />
        {[1700, 1560, 1420, 1290].map((y) => <rect key={y} x={852} y={y} width={20} height={10} fill="#5A646A" stroke={INKR} strokeWidth={2} />)}
        {[0.25, 0.5, 0.75].map((u) => <rect key={u} x={fmt(884 + (566 - 884) * u - 8)} y={fmt(1236 + (1018 - 1236) * u - 5)} width={16} height={10} fill="#5A646A" stroke={INKR} strokeWidth={2} transform={`rotate(-34 ${fmt(884 + (566 - 884) * u)} ${fmt(1236 + (1018 - 1236) * u)})`} />)}
        <rect x={846} y={1722} width={32} height={26} rx={3} fill="#7A8288" stroke={INKR} strokeWidth={3} />
        <rect x={858} y={1760} width={8} height={90} fill={cop} stroke={INKR} strokeWidth={2} opacity={0.0} />
        {/* the mast bracket at the ridge end and the air terminal (a plain pointed rod) */}
        <rect x={538} y={994} width={26} height={16} fill="#5A646A" stroke={INKR} strokeWidth={3} />
        <path d={`M${ROD_TIP.x - 5},1004 L${ROD_TIP.x - 3},${ROD_TIP.y + 22} L${ROD_TIP.x},${ROD_TIP.y} L${ROD_TIP.x + 3},${ROD_TIP.y + 22} L${ROD_TIP.x + 5},1004 Z`} fill={mix('#B6BEC4', '#F4F6FF', glint)} stroke={INKR} strokeWidth={2.4} strokeLinejoin="round" />
        <path d={`M${ROD_TIP.x - 1.5},1000 L${ROD_TIP.x - 0.8},${ROD_TIP.y + 24}`} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.4} />
        {glint > 0.02 && <circle cx={ROD_TIP.x} cy={ROD_TIP.y + 3} r={14} fill="#FFFFFF" opacity={0.7 * glint} style={{mixBlendMode: 'screen'}} />}
        {glint > 0.02 && <path d={`M${ROD_TIP.x - 18},${ROD_TIP.y + 3} L${ROD_TIP.x + 18},${ROD_TIP.y + 3} M${ROD_TIP.x},${ROD_TIP.y - 15} L${ROD_TIP.x},${ROD_TIP.y + 21}`} stroke="#FFFFFF" strokeWidth={1.6} opacity={glint} strokeLinecap="round" />}
        {/* puddles on the ground */}
        {[0, 1, 2].map((i) => <ellipse key={i} cx={950 + i * 160 + 40 * hash(i, 7)} cy={1790 + 20 * i} rx={70} ry={8} fill={mix('#3E5260', '#6A7EA0', 0.2)} opacity={0.6} />)}
      </Layer>
    </g>
  );
};

/** R1 + R2 */
export const RodV2: React.FC<{t: number}> = ({t}) => {
  const fl = clamp(strikeK(t));
  const glint = clamp(fl * 1.4);
  let cam: Cam;
  if (t < S.R2) {
    const u = sm5(clamp((t - S.R1) / (S.R2 - S.R1)));
    cam = {x: 560 + 6 * u, y: 1290 - 110 * u, z: 0.98 + 0.2 * u};
  } else if (t < 27.62) {
    const u = sm5(clamp((t - S.R2) / (27.62 - S.R2)));
    cam = {x: 552, y: 1000 - 70 * u, z: 2.5 + 0.2 * u};
  } else {
    // end with the tip at (540, 820) on screen, scale matched to R3's opening frame
    const u = sm5(clamp((t - 27.62) / (S.R3 - 27.62)));
    const z = 4.6 + 0.6 * u;
    cam = {x: ROD_TIP.x - (540 - 540) / z - 8 * (1 - u), y: ROD_TIP.y + (960 - 820) / z + 40 * (1 - u), z};
  }
  const drift = t * 8;
  const bracket = t >= S.R2 && t < 27.62 ? ss(t, S.R2 + 0.1, S.R2 + 0.45) : 0;
  return (
    <g>
      <RodWorld2 cam={cam} t={t} rt={t} drift={drift} flash={fl} glint={glint} behind={<FarBolt cam={cam} k={strikeK(t)} />} />
      {bracket > 0 && (
        <Layer cam={cam} depth={1}>
          <g opacity={bracket} stroke="#F2D27A" strokeWidth={2.2} strokeLinecap="round">
            <line x1={ROD_TIP.x + 26} y1={1004} x2={ROD_TIP.x + 26} y2={fmt(1004 + (ROD_TIP.y - 1004) * bracket)} />
            <line x1={ROD_TIP.x + 18} y1={1004} x2={ROD_TIP.x + 34} y2={1004} />
            {bracket > 0.95 && <line x1={ROD_TIP.x + 18} y1={ROD_TIP.y} x2={ROD_TIP.x + 34} y2={ROD_TIP.y} />}
          </g>
        </Layer>
      )}
    </g>
  );
};
export {noise1};

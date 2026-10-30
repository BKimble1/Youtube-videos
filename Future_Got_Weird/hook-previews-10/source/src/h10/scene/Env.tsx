// HOOK 10: the rehabilitation gym behind him, soft and muted (dark teal), in parallax layers: the back wall with tall
// soft windows and a wall rail (far), a pair of out-of-focus parallel bars (middle), and the floor he walks on (subject
// plane) with vinyl seams that slide past as he moves.
import React from 'react';
export type Cam = {x: number; y: number; z: number};
const Y0 = -600;
/** a layer at relative depth d (1 = the subject plane): it pans and zooms less the farther it is */
export const layerTransform = (cam: Cam, d: number) => {
  const z = Math.pow(cam.z, 1 / d);
  const cx = cam.x / d;
  const cy = Y0 + (cam.y - Y0) / d;
  return `translate(540 960) scale(${z.toFixed(5)}) translate(${(-cx).toFixed(3)} ${(-cy).toFixed(3)})`;
};
import {fmt} from '../rig/math';
import {mix} from '../rig/color';

const WALL = '#2B4A52';
const WALL_D = '#1D343B';

export const Backdrop: React.FC<{cam: Cam; dim: number}> = ({cam, dim}) => {
  const d1 = 2.6; // back wall
  const d2 = 1.7; // parallel bars
  // wall rendered over a generous span around the camera
  const span = (cx: number, d: number, step: number) => {
    const c0 = cam.x / d;
    const a = Math.floor((c0 - 2200) / step), b = Math.ceil((c0 + 2200) / step);
    const o: number[] = [];
    for (let i = a; i <= b; i++) o.push(i * step + cx);
    return o;
  };
  return (
    <g>
      <defs>
        <linearGradient id="h10-wall" x1="0" y1="-1600" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mix(WALL_D, '#0F1E24', 0.3)} />
          <stop offset="0.55" stopColor={WALL} />
          <stop offset="1" stopColor={mix(WALL, '#4F6E72', 0.25)} />
        </linearGradient>
        <linearGradient id="h10-envwin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9FD3D6" stopOpacity={0.34} />
          <stop offset="1" stopColor="#6FA9B0" stopOpacity={0.12} />
        </linearGradient>
        <radialGradient id="h10-winglow">
          <stop offset="0" stopColor="#BDE7E4" stopOpacity={0.2} />
          <stop offset="1" stopColor="#BDE7E4" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="h10-floor" x1="0" y1="-120" x2="0" y2="700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3E5E62" />
          <stop offset="0.3" stopColor="#355358" />
          <stop offset="1" stopColor="#22393E" />
        </linearGradient>
        <linearGradient id="h10-bars" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7E9DA2" />
          <stop offset="1" stopColor="#56757B" />
        </linearGradient>
      </defs>
      <g transform={layerTransform(cam, d1)}>
        <rect x={fmt(cam.x - 6000)} y={-5000} width={12000} height={5000 - 160} fill="url(#h10-wall)" />
        {span(0, d1, 900).map((x) => (
          <g key={`w${x}`}>
            <ellipse cx={fmt(x + 200)} cy={-880} rx={420} ry={700} fill="url(#h10-winglow)" />
            <rect x={fmt(x)} y={-1500} width={400} height={980} rx={10} fill="url(#h10-envwin)" />
            <rect x={fmt(x + 192)} y={-1500} width={14} height={980} fill={WALL_D} opacity={0.35} />
            <rect x={fmt(x)} y={-1020} width={400} height={12} fill={WALL_D} opacity={0.3} />
          </g>
        ))}
        {span(450, d1, 300).map((x) => (
          <rect key={`p${x}`} x={fmt(x)} y={-1600} width={4} height={1440} fill={WALL_D} opacity={0.22} />
        ))}
        {/* wall rail and skirting */}
        <rect x={fmt(cam.x - 6000)} y={-470} width={12000} height={16} rx={8} fill="#6E8C86" opacity={0.8} />
        <rect x={fmt(cam.x - 6000)} y={-456} width={12000} height={6} fill="#13252B" opacity={0.25} />
        <rect x={fmt(cam.x - 6000)} y={-230} width={12000} height={70} fill={mix(WALL_D, '#10191D', 0.3)} opacity={0.9} />
        {/* the floor's far part, up to the skirting */}
        <rect x={fmt(cam.x - 6000)} y={-160} width={12000} height={600} fill="#3B5A5E" />
      </g>
      <g transform={layerTransform(cam, d2)} opacity={0.55}>
        {/* out-of-focus parallel bars */}
        {span(-300, d2, 1700).map((x) => (
          <g key={`b${x}`}>
            <rect x={fmt(x)} y={-560} width={900} height={18} rx={9} fill="url(#h10-bars)" />
            <rect x={fmt(x)} y={-600} width={900} height={14} rx={7} fill="url(#h10-bars)" opacity={0.6} />
            {[0, 440, 880].map((dx) => (
              <rect key={dx} x={fmt(x + dx)} y={-560} width={20} height={480} fill="#5A787E" />
            ))}
            <rect x={fmt(x - 20)} y={-90} width={940} height={16} rx={6} fill="#4C686D" />
          </g>
        ))}
      </g>
      {dim > 0 && <rect x={-20000} y={-20000} width={40000} height={40000} fill="#08151B" opacity={dim} />}
    </g>
  );
};

/** the floor in the subject plane (drawn in world coordinates inside the camera transform) */
export const Floor: React.FC<{cx: number}> = ({cx}) => {
  const seams: number[] = [];
  const a = Math.floor((cx - 2400) / 230), b = Math.ceil((cx + 2400) / 230);
  for (let i = a; i <= b; i++) seams.push(i * 230);
  return (
    <g>
      <defs>
        <linearGradient id="h10-floorfade" x1="0" y1="-110" x2="0" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B5A5E" stopOpacity={0} />
          <stop offset="1" stopColor="#3B5A5E" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="h10-floornear" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B5A5E" />
          <stop offset="1" stopColor="#1F363B" />
        </linearGradient>
      </defs>
      <rect x={fmt(cx - 4000)} y={-110} width={8000} height={190} fill="url(#h10-floorfade)" />
      <rect x={fmt(cx - 4000)} y={80} width={8000} height={2000} fill="url(#h10-floornear)" />
      {seams.map((x) => (
        <path key={x} d={`M${fmt(x)},-60 L${fmt(x - 70)},900`} stroke="#17292E" strokeOpacity={0.22} strokeWidth={3} />
      ))}
      <rect x={fmt(cx - 4000)} y={-6} width={8000} height={3} fill="#9CC3C2" opacity={0.06} />
    </g>
  );
};

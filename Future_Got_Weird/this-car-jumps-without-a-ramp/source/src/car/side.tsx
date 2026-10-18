// Side view of the car (facing +x), drawn in world millimetres with y up.
// Layers, back to front: ground shadow, cutaway interior (frame line, seats), struts, wheels, body panels, glass and
// details. In cutaway the panels turn into a tinted outline so the struts read through them, and the near wheels go
// "x-ray" as well (the same cut), so nothing behind them is drawn on top of a solid part.
import React from 'react';
import {C} from '../theme';
import {AXLE_F, AXLE_R, COM, PAINT, WHEEL_R, bodyPath, diffuserPath, glassPath, headlightPath, intakePath, mirrorPath, panelLines, sillPath, splitterPath, taillightPath} from './geom';
import {INK, SideWheel, Strut} from './parts';

export type SideCarProps = {
  x: number; // car origin (mid-wheelbase) x, mm
  ground?: number; // road height under the car (mm)
  dz?: number; // body heave relative to static (mm)
  pitch?: number; // deg, + = nose up
  wf?: number; // front wheel-centre offset from static (mm)
  wr?: number;
  rot?: number; // wheel rotation (deg)
  px: number;
  cutaway?: number; // 0..1
  actuator?: number; // 0..1 shows the actuator symbol in the struts
  forceF?: number; // actuator force -1..1
  forceR?: number;
  springGlow?: number;
  damperGlow?: number;
  brake?: number;
  shadow?: number; // 0..1 opacity of the ground shadow
  ghost?: boolean; // dashed outline only (comparison reference)
  ghostColor?: string;
  limitF?: number;
  limitR?: number;
  id?: string;
  struts?: number; // 0..1 strut visibility (defaults to cutaway)
  bodyOpacity?: number;
};

/** Body point (mm, body frame at static) -> world, given heave and pitch about the centre of mass. */
export const bodyToWorld = (p: {x: number; dz: number; pitch: number}, bx: number, by: number) => {
  const a = (p.pitch * Math.PI) / 180;
  const rx = bx - COM.x, ry = by - COM.y;
  return [p.x + COM.x + rx * Math.cos(a) - ry * Math.sin(a), COM.y + p.dz + rx * Math.sin(a) + ry * Math.cos(a)] as [number, number];
};
export const STRUT_TOP = 880; // body-frame height of the top mounts

export const SideCar: React.FC<SideCarProps> = (P) => {
  const {x, ground = 0, dz = 0, pitch = 0, wf = 0, wr = 0, rot = 0, px, cutaway = 0, actuator = 0, forceF = 0, forceR = 0, springGlow = 0, damperGlow = 0, brake = 0, shadow = 1, ghost, ghostColor = C.inkMuted, limitF = 0, limitR = 0, id = 'car', bodyOpacity = 1} = P;
  const struts = P.struts ?? cutaway;
  const sw = INK / px;
  const body = `translate(${x} ${dz}) rotate(${pitch} ${COM.x} ${COM.y})`;
  const wF: [number, number] = [x + AXLE_F, ground + WHEEL_R + wf];
  const wR: [number, number] = [x + AXLE_R, ground + WHEEL_R + wr];
  const pose = {x, dz, pitch};
  if (ghost) {
    return (
      <g opacity={0.85}>
        <g transform={body}>
          <path d={bodyPath()} fill="none" stroke={ghostColor} strokeWidth={sw * 0.9} strokeDasharray={`${16 / px} ${12 / px}`} />
        </g>
      </g>
    );
  }
  const panelFill = 1 - 0.86 * cutaway;
  // shadow shrinks and fades with height above the road
  const lift = Math.max(0, Math.min(wf, wr));
  const sh = Math.max(0, 1 - lift / 600);
  return (
    <g>
      {shadow > 0 && <ellipse cx={x - 40} cy={ground + 8} rx={2650 * (0.8 + 0.2 * sh)} ry={70 * (0.7 + 0.3 * sh)} fill={C.ink} opacity={0.2 * shadow * sh} />}
      {/* cutaway interior: floor/frame line and seat backs, kept schematic */}
      {cutaway > 0 && (
        <g transform={body} opacity={cutaway}>
          <path d="M -1900 300 L 1900 300 L 2150 420 M -1900 300 L -2200 430" fill="none" stroke={C.inkSoft} strokeWidth={sw * 1.3} strokeDasharray={`${10 / px} ${8 / px}`} />
          {/* seat: cushion and reclined back, schematic */}
          <path d="M 120 330 L -380 330 C -430 340 -450 380 -440 420 L 60 440 C 120 430 140 380 120 330 Z M -440 420 C -470 600 -520 820 -560 1000 C -560 1040 -500 1050 -470 1020 C -420 860 -370 640 -330 440 Z" fill={C.inkMuted} fillOpacity={0.3} stroke={C.inkSoft} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        </g>
      )}
      {/* struts: top mount moves with the body, bottom with the wheel */}
      {struts > 0 && (
        <g opacity={struts}>
          <Strut top={bodyToWorld(pose, AXLE_R, STRUT_TOP)} bottom={wR} px={px} actuator={actuator} force={forceR} springGlow={springGlow} damperGlow={damperGlow} side={1} limitHit={limitR} />
          <Strut top={bodyToWorld(pose, AXLE_F, STRUT_TOP)} bottom={wF} px={px} actuator={actuator} force={forceF} springGlow={springGlow} damperGlow={damperGlow} side={-1} limitHit={limitF} />
        </g>
      )}
      <g transform={body} opacity={bodyOpacity}>
        {/* wheel-well shadows (inside of the arches, never below the sill line) */}
        <defs>
          <clipPath id={`well-${id}`}>
            <rect x={-3000} y={165} width={6000} height={2000} />
          </clipPath>
        </defs>
        <g clipPath={`url(#well-${id})`}>
          <circle cx={AXLE_F} cy={380} r={410} fill={C.ink} opacity={0.55 * panelFill} />
          <circle cx={AXLE_R} cy={380} r={410} fill={C.ink} opacity={0.55 * panelFill} />
        </g>
      </g>
      <SideWheel id={`${id}-r`} cx={wR[0]} cy={wR[1]} rot={rot} px={px} xray={cutaway} brake={brake} groundY={ground} />
      <SideWheel id={`${id}-f`} cx={wF[0]} cy={wF[1]} rot={rot} px={px} xray={cutaway} brake={brake} groundY={ground} />
      {/* hubs stay solid in the cutaway so the strut ends are clearly attached */}
      {cutaway > 0 && [wF, wR].map((w, i) => <circle key={i} cx={w[0]} cy={w[1]} r={46} fill={C.white} stroke={C.ink} strokeWidth={sw} opacity={cutaway} />)}
      {struts > 0 && cutaway > 0 && (
        <g opacity={struts * cutaway}>
          {/* redraw the lower strut mounts over the x-ray wheel */}
          {[wF, wR].map((w, i) => <circle key={i} cx={w[0]} cy={w[1]} r={30} fill={C.white} stroke={C.ink} strokeWidth={sw} />)}
        </g>
      )}
      <g transform={body} opacity={bodyOpacity}>
        <defs>
          <clipPath id={`body-${id}`}>
            <path d={bodyPath()} />
          </clipPath>
        </defs>
        <path d={bodyPath()} fill={PAINT.red} fillOpacity={panelFill} stroke="none" />
        {/* cutaway: the shell becomes a pale, see-through skin */}
        {cutaway > 0 && <path d={bodyPath()} fill={C.cream} fillOpacity={0.5 * cutaway} stroke="none" />}
        {/* soft lower shade and upper highlights, kept inside the body outline */}
        <g clipPath={`url(#body-${id})`} opacity={panelFill}>
          <path d="M 2600 330 C 1500 360 -1500 360 -2600 560 L -2600 0 L 2600 0 Z" fill={PAINT.redDeep} opacity={0.35} />
          <path d="M 2200 540 C 1700 680 1100 800 640 880 C 900 850 1500 760 2240 560 Z" fill={PAINT.redLight} opacity={0.55} />
          <path d="M -900 1205 C -1400 1110 -1800 1050 -2300 1010 C -1800 1070 -1300 1150 -820 1240 Z" fill={PAINT.redLight} opacity={0.45} />
        </g>
        <path d={bodyPath()} fill="none" stroke={cutaway > 0.5 ? PAINT.redDeep : C.ink} strokeWidth={sw * (1 + 0.25 * cutaway)} strokeLinejoin="round" />
        <path d={intakePath()} fill={PAINT.carbon} fillOpacity={panelFill} stroke={C.ink} strokeWidth={sw * 0.8} />
        <path d={sillPath()} fill={PAINT.carbon} fillOpacity={panelFill} stroke={C.ink} strokeWidth={sw * 0.8} />
        <path d={splitterPath()} fill={PAINT.carbon} fillOpacity={panelFill} stroke={C.ink} strokeWidth={sw * 0.7} />
        <path d={diffuserPath()} fill={PAINT.carbon} fillOpacity={panelFill} stroke={C.ink} strokeWidth={sw * 0.7} />
        <path d={glassPath()} fill={PAINT.glass} fillOpacity={0.15 + 0.85 * panelFill} stroke={C.ink} strokeWidth={sw} />
        <path d="M 300 1010 C 150 1120 0 1190 -150 1225 L -330 1235 C -150 1180 60 1080 220 990 Z" fill={PAINT.glassLight} opacity={0.6 * panelFill} />
        {panelLines().map((d, i) => (
          <path key={i} d={d} fill="none" stroke={C.ink} strokeWidth={sw * 0.55} opacity={0.75 * panelFill} />
        ))}
        <path d={mirrorPath()} fill={PAINT.carbon} fillOpacity={panelFill} stroke={C.ink} strokeWidth={sw * 0.7} />
        <path d={headlightPath()} fill={PAINT.light} stroke={C.ink} strokeWidth={sw * 0.6} />
        <path d={taillightPath()} fill={C.coral} stroke={C.ink} strokeWidth={sw * 0.6} />
      </g>
    </g>
  );
};

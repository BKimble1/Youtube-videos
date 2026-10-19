// Side view of the car (facing +x), drawn in world millimetres with y up.
// The body is always opaque. To explain the suspension, a localized window opens in the body around one wheel well:
// a clean cream backing is cut into the paint (clipped to the body so it never spills outside the silhouette), the
// wheel face simplifies to a plain disc, and only the part being explained (spring, damper, powered actuator) is drawn
// over it, each fading in on its own cue. Nothing else shows through the car.
import React from 'react';
import {C} from '../theme';
import {AXLE_F, AXLE_R, ARCH_R, COM, PAINT, WHEEL_R, bladePath, bodyFilledPath, bodyPath, diffuserPath, glassPath, glintPath, headlightPath, mirrorPath, mirrorStalk, panelLines, quarterPath, roofPath, shadePath, shoulderGlint, sillPath, splitterPath, taillightPath, wingFarStay, wingPath, wingStayPath} from './geom';
import {INK, SideWheel, Strut} from './parts';

export type WellSpec = {
  axle: 'r' | 'f';
  open: number; // 0..1 the window opens from its centre
  spring?: number; // part visibility 0..1 (0.25 reads as dimmed)
  damper?: number;
  actuator?: number;
  slide?: number; // actuator slide-in 0..1
  force?: number; // -1..1
  springGlow?: number;
  damperGlow?: number;
  limit?: number; // 0..1 travel-stop marker
};

export type SideCarProps = {
  x: number; // car origin (mid-wheelbase) x, mm
  ground?: number; // road height under the car (mm)
  dz?: number; // body heave relative to static (mm)
  pitch?: number; // deg, + = nose up
  wf?: number; // front wheel-centre offset from static (mm)
  wr?: number;
  rot?: number; // wheel rotation (deg)
  px: number; // screen pixels per mm (constant-width ink)
  wells?: WellSpec[];
  brake?: number; // 0..1 hot discs
  shadow?: number; // 0..1 opacity of the ground shadow
  ghost?: boolean; // dashed outline only (comparison reference)
  ghostColor?: string;
  id?: string;
  bodyOpacity?: number;
  blur?: number; // 0..1 wheel-spin smear (fast wheels)
};

/** Body point (mm, body frame at static) -> world, given heave and pitch about the centre of mass. */
export const bodyToWorld = (p: {x: number; dz: number; pitch: number}, bx: number, by: number) => {
  const a = (p.pitch * Math.PI) / 180;
  const rx = bx - COM.x, ry = by - COM.y;
  return [p.x + COM.x + rx * Math.cos(a) - ry * Math.sin(a), COM.y + p.dz + rx * Math.sin(a) + ry * Math.cos(a)] as [number, number];
};
export const STRUT_TOP = 790; // body-frame height of the top mounts
export const WELL = {halfW: 560, y0: 140, y1: 870};

export const smooth01 = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

const WellBacking: React.FC<{spec: WellSpec; id: string; sw: number; px: number}> = ({spec, id, sw, px}) => {
  const o = smooth01(spec.open);
  if (o <= 0.001) return null;
  const ax = spec.axle === 'r' ? AXLE_R : AXLE_F;
  const cx = ax, cy = (WELL.y0 + WELL.y1) / 2;
  const w = 2 * WELL.halfW * o, h = (WELL.y1 - WELL.y0) * o;
  const rr = 120 * o;
  const uid = `${id}-${spec.axle}`;
  return (
    <g>
      <defs>
        <clipPath id={`wb-${uid}`}>
          <path d={bodyPath()} />
          <circle cx={ax} cy={WHEEL_R} r={ARCH_R} />
        </clipPath>
        <clipPath id={`wr-${uid}`}>
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={rr} />
        </clipPath>
      </defs>
      <g clipPath={`url(#wb-${uid})`}>
        <g clipPath={`url(#wr-${uid})`}>
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill={C.paper} />
          {/* a quiet inner shadow so the cut reads as depth, and the chassis block the strut hangs from */}
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={rr} fill="none" stroke={C.paperDeep} strokeWidth={90} />
          <rect x={cx - 265} y={STRUT_TOP - 20} width={530} height={84} rx={22} fill={C.tealDeep} stroke={C.ink} strokeWidth={sw} opacity={o} />
          <rect x={cx - 215} y={STRUT_TOP + 2} width={430} height={30} rx={10} fill={C.teal} opacity={o} />
        </g>
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={rr} fill="none" stroke={C.ink} strokeWidth={sw * 1.5} />
        <rect x={cx - w / 2 + 14} y={cy - h / 2 + 14} width={w - 28} height={h - 28} rx={Math.max(0, rr - 14)} fill="none" stroke={C.white} strokeWidth={sw * 0.8} opacity={0.8} />
      </g>
    </g>
  );
};

export const SideCar: React.FC<SideCarProps> = (P) => {
  const {x, ground = 0, dz = 0, pitch = 0, wf = 0, wr = 0, rot = 0, px, wells = [], brake = 0, shadow = 1, ghost, ghostColor = C.inkMuted, id = 'car', bodyOpacity = 1, blur = 0} = P;
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
  const openOf = (a: 'r' | 'f') => smooth01(wells.find((w) => w.axle === a)?.open ?? 0);
  // shadow shrinks and fades with height above the road
  const lift = Math.max(0, Math.min(wf, wr));
  const sh = Math.max(0, 1 - lift / 600);
  return (
    <g>
      {shadow > 0 && <ellipse cx={x - 40} cy={ground + 8} rx={2350 * (0.8 + 0.2 * sh)} ry={64 * (0.7 + 0.3 * sh)} fill={C.ink} opacity={0.22 * shadow * sh} />}
      <g transform={body} opacity={bodyOpacity}>
        {/* far-side wing stay and the wing, behind the body */}
        <path d={wingFarStay()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        <path d={wingStayPath()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.9} strokeLinejoin="round" />
        <path d={wingPath()} fill={PAINT.carbonLight} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
        {/* paint */}
        <defs>
          <clipPath id={`body-${id}`}>
            <path d={bodyPath()} />
          </clipPath>
        </defs>
        <path d={bodyPath()} fill={PAINT.red} />
        <g clipPath={`url(#body-${id})`}>
          <path d={shadePath()} fill={PAINT.redDeep} opacity={0.5} />
          <path d={glintPath()} fill={PAINT.redLight} opacity={0.75} />
          <path d={shoulderGlint()} fill={PAINT.redLight} opacity={0.7} />
        </g>
        <defs>
          <clipPath id={`fill-${id}`}>
            <path d={bodyFilledPath()} />
          </clipPath>
        </defs>
        {/* dark wheel-arch liners: the arch is a hole in the body path, so back it with the car's own darkness */}
        <g clipPath={`url(#fill-${id})`}>
          {[AXLE_R, AXLE_F].map((ax) => <circle key={ax} cx={ax} cy={WHEEL_R} r={ARCH_R - 3} fill="#1B2328" />)}
        </g>
        <path d={sillPath()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        <path d={bladePath()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        <path d={splitterPath()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.7} strokeLinejoin="round" />
        <path d={diffuserPath()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.7} strokeLinejoin="round" />
        <path d={roofPath()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        <path d={quarterPath()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.7} strokeLinejoin="round" />
        <path d={glassPath()} fill={PAINT.glass} stroke={C.ink} strokeWidth={sw * 0.9} strokeLinejoin="round" />
        {panelLines().map((d, i) => (
          <path key={i} d={d} fill="none" stroke={C.ink} strokeWidth={sw * 0.55} opacity={0.7} strokeLinecap="round" />
        ))}
        <path d={mirrorStalk()} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.7} strokeLinejoin="round" />
        <path d={mirrorPath()} fill={PAINT.red} stroke={C.ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        <path d={headlightPath()} fill={PAINT.light} stroke={C.ink} strokeWidth={sw * 0.6} strokeLinejoin="round" />
        <path d={taillightPath()} fill={C.coral} stroke={C.ink} strokeWidth={sw * 0.6} strokeLinejoin="round" />
        <path d={bodyPath()} fill="none" stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
        {wells.map((w) => <WellBacking key={w.axle} spec={w} id={id} sw={sw} px={px} />)}
      </g>
      <SideWheel id={`${id}-r`} cx={wR[0]} cy={wR[1]} rot={rot} px={px} simple={openOf('r')} brake={brake} groundY={ground} blur={blur} />
      <SideWheel id={`${id}-f`} cx={wF[0]} cy={wF[1]} rot={rot} px={px} simple={openOf('f')} brake={brake} groundY={ground} blur={blur} />
      {wells.map((w) => {
        const o = smooth01(w.open);
        if (o <= 0.001) return null;
        const top = bodyToWorld(pose, w.axle === 'r' ? AXLE_R : AXLE_F, STRUT_TOP);
        const bottom = w.axle === 'r' ? wR : wF;
        return (
          <g key={w.axle} opacity={o}>
            <Strut top={top} bottom={bottom} px={px} actuator={w.actuator ?? 0} slide={w.slide ?? 1} force={w.force ?? 0} springGlow={w.springGlow ?? 0} damperGlow={w.damperGlow ?? 0}
              spring={w.spring ?? 1} damper={w.damper ?? 1} side={w.axle === 'r' ? 1 : -1} limitHit={w.limit ?? 0} />
          </g>
        );
      })}
    </g>
  );
};


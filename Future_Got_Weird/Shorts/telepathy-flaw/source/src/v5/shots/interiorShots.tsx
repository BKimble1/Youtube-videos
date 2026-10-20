// The café interior shots: cameras into the one interior world (world/interior.tsx).
import React from 'react';
import {Shot, ShotId} from '../plan5';
import {InteriorWorld, solveInterior, CUP_W_X, CUP_Y, CUP_S, CUP_TALL, CUP_BASE_DY, W_HIP, W_LAP, SEAT_Y, S, implantWorld, IMPLANT_R, X} from '../world/interior';
import {FLOOR} from '../env/Interior';
import {Cup, PROP} from '../env/Props';
import {RED} from '../art/Implant';
import {AlertChip, DeliveredTag, MsgChip, SendRing, popScale} from '../ui5';
import {Cam, toScreen} from '../../lib/camera';
import {clamp, easeIn, easeInOut, easeOut, easeOutBack, fmt, lerp, rng} from '../../lib/math';

export const CAMS: Record<string, Cam> = {
  wide: {x: 540, y: 1010, z: 1.06},
  two: {x: 525, y: 985, z: 1.45},
  cuM: {x: 770, y: 895, z: 2.5},
  cuW: {x: 300, y: 896, z: 2.5},
  hands: {x: 650, y: 1112, z: 3.3},
};

const mixCam = (a: Cam, b: Cam, k: number): Cam => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});

/** the camera of each café shot (shared with the layout check) */
export const interiorCam = (id: ShotId, t: number, shot: {a: number; b: number}): Cam => {
  const lt = t - shot.a;
  const dur = shot.b - shot.a;
  const k = easeInOut(clamp(lt / dur));
  switch (id) {
    case 'intWide':
      return mixCam(CAMS.wide, {...CAMS.wide, z: 1.12}, k);
    case 'intTwo':
      return mixCam(CAMS.two, {...CAMS.two, z: 1.55}, k);
    case 'sendFalter':
      return mixCam(CAMS.cuM, {...CAMS.cuM, z: 2.56}, k);
    case 'sendReject':
      // a slight roll and offset: the head shake is felt, not just seen
      return {...mixCam({...CAMS.cuM, x: 782, y: 898, z: 2.58}, {...CAMS.cuM, x: 768, y: 908, z: 2.78}, k), roll: lerp(-2.4, 1.6, k)};
    case 'realize':
      // tight on the eyes and the implant: he sees what the chip caught
      return mixCam({x: 772, y: 770, z: 3.3}, {x: 772, y: 764, z: 3.62}, k);
    case 'restrain':
      // a tilt from his strained face down to the fists in his lap
      return mixCam({x: 755, y: 1000, z: 2.3}, {x: 712, y: 1062, z: 2.7}, easeInOut(clamp(lt / (dur * 0.6))));
    case 'sendRegister': {
      // his face as it lands, then the camera falls into the implant so that its disc lands at the opening macro's position
      // and size (centre 540,790, radius 346): the match cut into frame 0. The dive is eased at both ends (smoothstep on the
      // log zoom, no sudden start and no slam at the cut) and spans 0.3 s.
      const base = mixCam(CAMS.cuM, {...CAMS.cuM, z: 2.62}, k);
      const p = clamp((t - 27.08) / (27.4 - 1 / 30 - 27.08));
      if (p <= 0) return base;
      const ip = implantWorld(solveInterior(t).m);
      const zEnd = 346 / IMPLANT_R;
      const e = p * p * (3 - 2 * p);
      const z = Math.exp(lerp(Math.log(base.z), Math.log(zEnd), e));
      const cx = lerp(base.x, ip.x, e);
      const cyEnd = ip.y + (960 - 790) / z;
      return {x: cx, y: lerp(base.y, cyEnd, e), z};
    }
    case 'recvRecog':
      return mixCam({...CAMS.cuW, z: 2.5}, {...CAMS.cuW, z: 2.6}, k);
    case 'handCup':
      return mixCam(CAMS.hands, {...CAMS.hands, z: 3.55, x: 640}, k);
    case 'calmTwo':
      return mixCam({...CAMS.two, z: 1.45}, {...CAMS.two, z: 1.55}, k);
    default:
      return CAMS.wide;
  }
};

export const interiorShot = (id: ShotId, t: number, f: number, lt: number, shot: Shot): React.ReactNode => {
  if (id === 'subjective') return subjective(t, f, lt);
  if (id === 'signal') return signalShot(t, f, lt);
  const cam = interiorCam(id, t, shot);
  const solved = solveInterior(t);
  // sending: a ring leaves his implant just before the message appears beside her (cause, then effect)
  const ip = implantWorld(solved.m);
  // the message that reaches her: a small bubble beside her head, popping and fading in place (never travelling)
  const bubK = popScale(t, 10.5, 0.2);
  const bubA = 1 - clamp((t - 11.35) / 0.25);
  const extra = (
    <g>
      <SendRing c={ip} t={t} t0={10.36} r1={120} />
      <MsgChip x={solved.w.head.x + 58} y={solved.w.head.y - 96 * S * 1.05} s={id === 'intWide' ? 0.95 : 0.8} text="Nice place!" k={bubK} alpha={bubA} tailDir={-1} />
    </g>
  );
  const hr = 96 * S;
  // the ending: a red alert (a tipping chair and a falling cup) pops beside her head, "Message Delivered" confirms it;
  // both stay attached to her head (world anchored) through the freeze and the draw-back
  const alertK = popScale(t, 25.38, 0.18);
  const tagK = popScale(t, 25.76, 0.16);
  const endFade = 1 - clamp((t - 26.55) / 0.2);
  const hd = solved.w.head;
  const head = toScreen(cam, hd);
  const hrs = hr * cam.z;
  let overlay: React.ReactNode = null;
  if (id === 'recvRecog') {
    overlay = (
      <g>
        <AlertChip x={head.x + hrs * 0.95} y={head.y - hrs * 0.9} s={1.2} k={alertK} alpha={endFade} tailDir={-1} />
        <DeliveredTag x={Math.min(head.x + hrs * 1.02 + 175, 880)} y={head.y - hrs * 0.12} k={tagK} sc={1} stack alpha={endFade} />
      </g>
    );
  } else if (id === 'withdraw') {
    const a = toScreen(cam, {x: hd.x + hr * 0.95, y: hd.y - hr * 0.85});
    const d = toScreen(cam, {x: hd.x + hr * 3.2, y: hd.y + hr * 0.15});
    overlay = (
      <g>
        <AlertChip x={a.x} y={a.y} s={0.74} k={1} alpha={endFade} tailDir={-1} />
        <DeliveredTag x={d.x} y={d.y} k={1} sc={0.9} stack alpha={endFade} />
      </g>
    );
  }
  return (
    <g>
      <InteriorWorld t={t} f={f} cam={cam} solved={solved} opts={{extra}} />
      {overlay}
    </g>
  );
};

const sm = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

/** The one subjective image, one coherent event in 0.65 s (20 frames), all of it imagined:
 *    0.00-0.12  she sits with the cup in her hand (nothing has happened yet; the bubble pops in)
 *    0.05-0.41  her chair tips backward about its back feet with her on it (rigid: chair and body turn together), the grip
 *               lets go and her arms fly up (0.08-0.28)
 *    0.12-0.24  the cup is thrown up out of her hand, tumbling, with a few drops of coffee trailing it
 *    0.24-0.46  it falls off the table's front edge to the floor, in front of the table, nowhere near her
 *    0.42-0.58  it shatters (shards low and wide, a ring); no impact on anyone
 *    0.55-0.65  the image darkens out */
export const SUBJ = {rel: 0.12, apex: 0.23, land: 0.42, tipA: 0.05, tipB: 0.38, maxTip: 15};
export const subjectiveW = (lt: number) => {
  const a = sm((lt - 0.06) / 0.28);
  const h = 1 - sm((lt - 0.08) / 0.08);
  return {
    hold: h,
    lift: 0,
    torso: 4 - 2 * a,
    neck: -3 * a,
    yaw: 14,
    ng: 0.5 - 0.35 * a,
    fg: 0.3 * a,
    nhx: lerp(CUP_W_X - 96, W_HIP + 195, a),
    nhy: lerp(CUP_Y - 24, SEAT_Y - 290, a),
    nHw: 0,
    fhx: lerp(W_LAP.x, W_HIP + 92, a),
    fhy: lerp(SEAT_Y - 49, SEAT_Y - 228, a),
    fHw: 0,
    chairDx: 0,
    chairTilt: 0,
  };
};
const tipDegAt = (lt: number) => SUBJ.maxTip * sm((lt - SUBJ.tipA) / (SUBJ.tipB - SUBJ.tipA));

/** the thrown cup: base-centre position and spin (deg) at local time lt (SUBJ.rel <= lt <= SUBJ.land) */
const cupFlight = (lt: number) => {
  const rest = {x: CUP_W_X, y: CUP_Y - CUP_BASE_DY};
  const floorY = FLOOR + 34;
  if (lt <= SUBJ.apex) {
    const e = easeOut(clamp((lt - SUBJ.rel) / (SUBJ.apex - SUBJ.rel)));
    return {x: rest.x + 4 * e, y: rest.y - 80 * e, tilt: -40 * e, sc: 1};
  }
  const tau = clamp((lt - SUBJ.apex) / (SUBJ.land - SUBJ.apex));
  const apex = {x: rest.x + 4, y: rest.y - 80};
  // it falls toward the viewer (off the table's near edge): it grows a little as it drops, and lands in front of the table
  return {x: apex.x + 12 * tau, y: lerp(apex.y, floorY, tau * tau), tilt: -40 - 220 * tau, sc: 1 + 0.3 * tau};
};

/** a scalloped thought-bubble outline: n lobes along an ellipse */
const cloudPath = (cx: number, cy: number, rx: number, ry: number, n: number): string => {
  const R = rng(11);
  const pts = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const k = 1 + (R() - 0.5) * 0.06;
    return {x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k};
  });
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[(i + 1) % n];
    const q = pts[i];
    const chord = Math.hypot(p.x - q.x, p.y - q.y);
    const r = chord * 0.62;
    d += ` A${r.toFixed(2)},${r.toFixed(2)} 0 0 1 ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }
  return d + ' Z';
};

export const SUBJ_DUR = 0.65;
const CLOUD = {cx: 540, cy: 745, rx: 450, ry: 515, n: 17};

const subjective = (t: number, f: number, lt: number): React.ReactNode => {
  const dur = SUBJ_DUR;
  const u = clamp(lt / dur);
  const w = subjectiveW(lt);
  const flying = lt >= SUBJ.rel && lt < SUBJ.land;
  const fl = cupFlight(Math.min(lt, SUBJ.land));
  const R = rng(5);
  const shards = Array.from({length: 10}, (_, i) => {
    const a = Math.PI * (0.08 + 0.84 * (i / 9)) + (R() - 0.5) * 0.2; // an upward fan, wide and low
    const sp = 90 + R() * 150;
    return {a, sp, w: 9 + R() * 14, c: i % 3 === 0 ? '#EF6B55' : '#FFFFFF', spin: (R() - 0.5) * 500};
  });
  const bt = clamp((lt - SUBJ.land) / 0.16);
  const impact = {x: fl.x, y: FLOOR + 30};
  const drops = Array.from({length: 7}, (_, i) => {
    const d = 0.011 * (i + 1.5);
    const tt = lt - d;
    if (tt < SUBJ.rel + 0.02 || tt >= SUBJ.land) return null;
    const q = cupFlight(tt);
    return {x: q.x + (i % 2 ? 9 : -7) * (1 + i * 0.25), y: q.y - 38 + i * 5, r: 5.5 - i * 0.35};
  });
  const extra = (
    <g>
      {/* the thrown cup (the real cup stays in her hand until it is thrown), then its drops */}
      {flying && <Cup id="subjcup" x={fl.x} y={fl.y} s={CUP_S * fl.sc} tall={CUP_TALL} tilt={fl.tilt} saucer={false} handle={false} steam={0} />}
      {drops.map((d, i) => d && <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#7A4A2A" stroke="#172B3A" strokeWidth={2} opacity={0.95} />)}
      {bt > 0 && shards.map((sh, i) => {
        const e = easeOut(bt);
        const x = impact.x + Math.cos(sh.a) * sh.sp * e * 1.1;
        const y = impact.y - 6 - Math.sin(sh.a) * sh.sp * 0.55 * e + 150 * bt * bt;
        return <path key={i} d={`M0,${-sh.w * 1.2} L${sh.w * 0.96},${sh.w * 0.6} L${-sh.w * 0.72},${sh.w * 0.72} Z`} transform={`translate(${x} ${y}) rotate(${sh.spin * bt})`} fill={sh.c} stroke="#172B3A" strokeWidth={2.5} opacity={1 - bt * 0.55} />;
      })}
      {bt > 0 && <ellipse cx={impact.x} cy={impact.y} rx={24 + 120 * bt} ry={8 + 30 * bt} fill="none" stroke="#FFFFFF" strokeWidth={6 * (1 - bt) + 1} opacity={0.8 * (1 - bt)} />}
    </g>
  );
  const cam: Cam = {x: 292, y: 1210, z: lerp(1.3, 1.38, u), roll: -2 + 0.9 * Math.sin(f * 1.3)};
  // the bubble flashes in (pops with overshoot), holds, and darkens out in the last 4 frames
  const pop = lt < 0.01 ? 0.7 : 0.7 + 0.3 * easeOutBack(clamp(lt / 0.13), 1.5);
  const fadeOut = clamp((lt - (dur - 0.14)) / 0.14);
  const flash = 1 - clamp(lt / 0.12);
  const cloud = cloudPath(CLOUD.cx, CLOUD.cy, CLOUD.rx, CLOUD.ry, CLOUD.n);
  const trail = [
    {x: 712, y: 1295, r: 38},
    {x: 782, y: 1352, r: 24},
    {x: 832, y: 1392, r: 14},
  ];
  return (
    <g>
      <defs>
        <filter id="subj-f" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.62 0.62 0.22 0 0.06  0.2 0.2 0.07 0 0  0.18 0.18 0.06 0 0.01  0 0 0 1 0" />
        </filter>
        <radialGradient id="subj-v" cx="0.5" cy="0.42" r="0.8">
          <stop offset="0.2" stopColor="#3A0A18" />
          <stop offset="1" stopColor="#12030A" />
        </radialGradient>
        <radialGradient id="subj-in" cx="0.5" cy="0.5" r="0.62">
          <stop offset="0.55" stopColor="#14030A" stopOpacity={0} />
          <stop offset="1" stopColor="#14030A" stopOpacity={0.55} />
        </radialGradient>
        <clipPath id="subj-clip">
          <path d={cloud} />
        </clipPath>
      </defs>
      {/* the surround: dark maroon, nothing of the room */}
      <rect x={0} y={0} width={1080} height={1920} fill="url(#subj-v)" />
      <g transform={`translate(${CLOUD.cx} ${CLOUD.cy}) scale(${pop.toFixed(4)}) translate(${-CLOUD.cx} ${-CLOUD.cy})`} opacity={1 - fadeOut}>
        <path d={cloud} fill="#FFFFFF" opacity={0.0} />
        <g clipPath="url(#subj-clip)">
          <g filter="url(#subj-f)">
            <InteriorWorld t={t} f={f} cam={cam} opts={{w, wExpr: X.wAlarm, hideCupW: lt >= SUBJ.rel, tipW: tipDegAt(lt), steam: 0, extra}} />
          </g>
          <rect x={0} y={0} width={1080} height={1920} fill="url(#subj-in)" />
          <rect x={0} y={0} width={1080} height={1920} fill={RED} opacity={0.16} />
        </g>
        <path d={cloud} fill="none" stroke="#FFD5DA" strokeWidth={9} strokeLinejoin="round" />
        <path d={cloud} fill="none" stroke={RED} strokeWidth={3} strokeLinejoin="round" opacity={0.8} />
        {trail.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={c.r} fill="#4A0E1C" stroke="#FFD5DA" strokeWidth={5} />
            <circle cx={c.x - c.r * 0.3} cy={c.y - c.r * 0.3} r={c.r * 0.28} fill="#FFFFFF" opacity={0.45} />
          </g>
        ))}
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill="#FFE9EC" opacity={0.5 * flash} />
    </g>
  );
};

/** the brief signal: his implant sends (8 frames), the cut lands on her (4 frames, still unaware) */
const signalShot = (t: number, f: number, lt: number): React.ReactNode => {
  const solved = solveInterior(t);
  if (lt < 0.27) {
    const ip = implantWorld(solved.m);
    const k = lt / 0.27;
    const cam: Cam = {x: ip.x, y: ip.y + 30, z: lerp(3.2, 3.5, k)};
    return (
      <g>
        <InteriorWorld t={t} f={f} cam={cam} solved={solved} opts={{glow: 1, glowColor: '#FF6B7A', steam: 0.5}} />
        {[0, 0.45].map((d, i) => {
          const kk = clamp(k * 1.3 - d);
          if (kk <= 0 || kk >= 1) return null;
          return <circle key={i} cx={540} cy={960 + 30 * 0 - 0} r={60 + 760 * kk} fill="none" stroke="#FF6B7A" strokeWidth={14 * (1 - kk) + 2} opacity={0.9 * (1 - kk)} />;
        })}
        <rect x={0} y={0} width={1080} height={1920} fill="#FF3340" opacity={0.18 * (1 - k)} />
      </g>
    );
  }
  // the same composition as the recognition close-up that follows: she is still smiling and has noticed nothing
  const cam: Cam = {...CAMS.cuW, z: 2.5};
  return <InteriorWorld t={t} f={f} cam={cam} solved={solved} />;
};

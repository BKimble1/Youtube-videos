// S4. The pilot report and the bad connection.
// Cut to a stylized reconstruction of the pilot write-up ("Pilot study · 2013", no real logos, no quotation): the
// camera settles on its session log, and a marker sweeps the line "Session 1 — ended early: network problems" as the
// narrator says it. Cut to the two labs as split-screen panels, both ready: Rao in his EEG cap at the game, Stocco in
// his swim cap with the round coil over his left motor cortex (frame-right on a front view), a link line drawn between
// them with a little handshake traffic and "Ready" tags. In the pause the link stalls (a spinner); on "Bad connection"
// the line snaps, the two halves droop, an unplugged-plug icon pops in the gap and Rao's screen goes to a spinner.
// The camera stops dead and holds the deadpan beat (Rao's smile goes flat; Stocco, who can't see anything, doesn't
// react) until S5's deliberate cut to 2014.
import React from 'react';
import {clamp, easeInOut, easeOut, easeOutBack, fmt, lerp} from '../dc/math';
import {FPS, T, TE, pr, pulse} from '../lib/core';
import {Cam, FONT_HEAD, INK, K, Tag} from '../art/kit';
import {GameScreen} from '../art/game';
import {lit, shade} from '../dc/color';
import {camKeys, Panel, RA, RAO_MON, RaoRoom, SB, STO_COIL_GRIP, StoccoRoom, toScreen, Z2} from '../art/s2rooms';

const tCut = () => T('Two human brains') - 0.2;

// ---------------------------------------------------------------- the report page (page-local 1000 x 1300)
const PG = {w: 1000, h: 1300};
const ROW1 = 820;
const Bar: React.FC<{x: number; y: number; w: number; h?: number; c?: string}> = ({x, y, w, h = 16, c = '#D9D1C2'}) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c} />;

const Report: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const cam = camKeys(t, [
    [tStart(), {x: 500, y: 560, z: 0.8}],
    [T('pilot report') + 0.2, {x: 500, y: 600, z: 0.88}],
    [T('Their first session') - 0.25, {x: 500, y: 600, z: 0.88}],
    [T('Their first session') + 0.75, {x: 515, y: ROW1 + 30, z: 1.42}],
    [tCut(), {x: 515, y: ROW1 + 30, z: 1.47}],
  ]);
  // the marker sweeps the session line while the narrator reads it
  const hk = easeInOut(clamp((t - (T('first session') - 0.05)) / (TE('network problems') - 0.2 - (T('first session') - 0.05))));
  return (
    <g>
      <defs>
        <linearGradient id="s4-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lit(K.deskTop, 0.12)} />
          <stop offset="1" stopColor={shade(K.deskTop, 0.08)} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#s4-wood)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M-50,${120 + i * 190} Q600,${90 + i * 190} 1980,${150 + i * 190}`} fill="none" stroke={shade(K.deskTop, 0.1)} strokeWidth={5} opacity={0.35} />
      ))}
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <g transform={`rotate(-1.5 ${PG.w / 2} ${PG.h / 2})`}>
          <rect x={14} y={18} width={PG.w} height={PG.h} rx={6} fill={INK} opacity={0.16} />
          <rect x={0} y={0} width={PG.w} height={PG.h} rx={6} fill="#FFFDF7" stroke={INK} strokeWidth={5} />
          {/* header */}
          <Bar x={80} y={64} w={220} h={14} c="#E2DACB" />
          <Bar x={760} y={64} w={160} h={14} c="#E2DACB" />
          <text x={80} y={200} fontFamily={FONT_HEAD} fontWeight={700} fontSize={80} fill={INK}>Pilot study · 2013</text>
          <Bar x={80} y={238} w={620} h={18} />
          <Bar x={80} y={270} w={480} h={18} />
          {/* figure: the game */}
          <g transform="translate(80 330)">
            <rect x={-8} y={-8} width={496} height={316} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
            <g transform="scale(0.75)">
              <GameScreen t={t} events={[]} />
            </g>
          </g>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Bar key={i} x={610} y={348 + i * 40} w={i === 6 ? 180 : 310 - (i % 3) * 30} />
          ))}
          {/* the session log */}
          <text x={80} y={730} fontFamily={FONT_HEAD} fontWeight={700} fontSize={50} fill={INK}>Session log</text>
          <rect x={80} y={752} width={840} height={5} fill={INK} opacity={0.8} />
          {/* highlight behind row 1 */}
          {hk > 0 && <rect x={86} y={ROW1 - 44} width={fmt(820 * hk)} height={60} rx={10} fill={K.saffron} opacity={0.85} />}
          <text x={100} y={ROW1} fontFamily={FONT_HEAD} fontWeight={600} fontSize={38} fill={INK}>
            <tspan fontWeight={700}>Session 1</tspan>
            <tspan> — ended early: network problems</tspan>
          </text>
          <rect x={80} y={ROW1 + 44} width={840} height={2.5} fill={INK} opacity={0.25} />
          <text x={100} y={ROW1 + 100} fontFamily={FONT_HEAD} fontWeight={700} fontSize={38} fill={INK} opacity={0.55}>Session 2</text>
          <Bar x={330} y={ROW1 + 76} w={420} h={18} />
          <rect x={80} y={ROW1 + 144} width={840} height={2.5} fill={INK} opacity={0.25} />
          {[0, 1, 2].map((i) => (
            <Bar key={i} x={80} y={1060 + i * 44} w={[760, 700, 520][i]} />
          ))}
        </g>
      </Cam>
    </g>
  );
};
const tStart = () => T('There’s a detail I love') - 0.5;

// ---------------------------------------------------------------- the two labs and the link
const quad = (a: {x: number; y: number}, c: {x: number; y: number}, b: {x: number; y: number}, u: number) => ({
  x: (1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * c.y + u * u * b.y,
});
const rotAbout = (p: {x: number; y: number}, o: {x: number; y: number}, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const dx = p.x - o.x, dy = p.y - o.y;
  return {x: o.x + dx * Math.cos(r) - dy * Math.sin(r), y: o.y + dx * Math.sin(r) + dy * Math.cos(r)};
};

/** unplugged: a plug and a socket pulled apart, in a coral badge (world units) */
const Unplugged: React.FC<{x: number; y: number; s: number; k: number}> = ({x, y, s, k}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s * (0.6 + 0.4 * easeOutBack(clamp(k))))})`} opacity={clamp(k * 2)}>
      <circle r={120} fill="#FFFFFF" stroke={INK} strokeWidth={10} />
      <circle r={104} fill={K.coral} opacity={0.2} />
      {/* plug (left) */}
      <path d="M-100,8 L-62,8" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <rect x={-64} y={-30} width={46} height={76} rx={12} fill="#E9EDF0" stroke={INK} strokeWidth={8} />
      <path d="M-18,-12 L4,-12 M-18,28 L4,28" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      {/* socket (right) */}
      <path d="M100,8 L62,8" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <rect x={22} y={-30} width={42} height={76} rx={12} fill="#E9EDF0" stroke={INK} strokeWidth={8} />
      <circle cx={40} cy={-6} r={6} fill={INK} />
      <circle cx={40} cy={22} r={6} fill={INK} />
      {/* the gap sparks */}
      <path d="M-4,-58 l8,-26 M10,-50 l22,-16 M-14,-50 l-20,-18" stroke={K.saffron} strokeWidth={8} strokeLinecap="round" />
    </g>
  );

const Labs: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const tBad = T('Bad connection');
  const tReady = T('ready to go');
  const cam = camKeys(t, [
    [tCut(), {x: 0, y: 470, z: Z2 * 1.0}],
    [tBad - 0.05, {x: 0, y: 470, z: Z2 * 1.045}],
  ]);
  // link endpoints (world): Rao's screen and Stocco's coil
  const A = {x: RA.x + RAO_MON.x + 120, y: RAO_MON.y - 540 * RAO_MON.s};
  const B = {x: SB.x + STO_COIL_GRIP.x + 60, y: STO_COIL_GRIP.y - 120}; // the coil's stand arm
  const C = {x: (A.x + B.x) / 2, y: -560};
  const draw = pr(f, T('Two human brains') + 0.05, T('Two human brains') + 0.75, easeOut);
  const broken = t >= tBad;
  const sag = broken ? easeOutBack(clamp((t - tBad) / 0.45), 1.8) : 0;
  const N = 48;
  const ptsL: string[] = [], ptsR: string[] = [];
  for (let i = 0; i <= N; i++) {
    const half = 0.5 - 0.15 * sag; // the snapped ends recoil toward their labs
    const u = (i / N) * (broken ? half : 1) * draw;
    const p = quad(A, C, B, u);
    ptsL.push(`${fmt(broken ? rotAbout(p, A, 9 * sag).x : p.x)},${fmt(broken ? rotAbout(p, A, 9 * sag).y : p.y)}`);
    if (broken) {
      const q = quad(A, C, B, 1 - (i / N) * half);
      const r = rotAbout(q, B, -9 * sag);
      ptsR.push(`${fmt(r.x)},${fmt(r.y)}`);
    }
  }
  // the dash flows while the link is live, stops when it stalls
  const tStall = TE('ready to go') + 0.2;
  const flow = Math.min(t, tStall) * 120;
  const linkCol = broken ? '#9AA5AE' : K.teal;
  const mid = quad(A, C, B, 0.5);
  // handshake packets
  const packets = [0, 1].map((i) => {
    const t0 = T('human brains') + 0.3 + i * 0.45;
    const u = (t - t0) / 0.9;
    if (u < 0 || u > 1 || t > tStall) return null;
    const p = quad(A, C, B, i % 2 ? 1 - u : u);
    return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={26} fill={K.saffron} stroke={INK} strokeWidth={7} />;
  });
  const spinK = t < tBad ? pr(f, tStall, tStall + 0.15) : 0;
  const plugK = clamp((t - tBad - 0.08) / 0.35);
  const readyK = pulse(f, tReady - 0.05, tReady + 0.2, tBad - 0.02, tBad + 0.12);
  const screenSpin = pr(f, tBad + 0.25, tBad + 0.45);
  // deadpan: Rao's smile goes flat a beat after the line snaps; Stocco can't see a thing and doesn't react
  const flat = t > tBad + 0.75;
  const tagA = toScreen(cam, RA.x + 420, -70);
  const tagB = toScreen(cam, SB.x + 1500, -70);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <Panel id="s4pa" ox={RA.x} oy={RA.y}>
          <RaoRoom
            f={f}
            events={[]}
            gameDim={0.5 * screenSpin}
            spin={screenSpin}
            capGlow={0}
            face={{lookX: 0.85, lookY: 0.15, mouth: flat ? 'flat' : 'smile', brows: flat ? -0.15 : 0.2}}
          />
        </Panel>
        <Panel id="s4pb" ox={SB.x} oy={SB.y}>
          <StoccoRoom f={f} coil={1} face={{mouth: 'flat'}} />
        </Panel>
        {/* the link */}
        {draw > 0 && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={ptsL.join(' ')} stroke={INK} strokeWidth={22} />
            <polyline points={ptsL.join(' ')} stroke={linkCol} strokeWidth={12} strokeDasharray="34 22" strokeDashoffset={fmt(-flow)} />
            {broken && <polyline points={ptsR.join(' ')} stroke={INK} strokeWidth={22} />}
            {broken && <polyline points={ptsR.join(' ')} stroke={linkCol} strokeWidth={12} strokeDasharray="34 22" />}
            <circle cx={A.x} cy={A.y} r={20} fill={INK} />
            <circle cx={B.x} cy={B.y} r={20} fill={INK} />
          </g>
        )}
        {packets}
        {spinK > 0 && (
          <g>
            <circle cx={mid.x} cy={mid.y} r={120} fill="#FFFFFF" stroke={INK} strokeWidth={10} opacity={spinK} />
            <g transform={`translate(${fmt(mid.x)} ${fmt(mid.y)})`} opacity={spinK}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const a = (i / 8) * Math.PI * 2;
                const head = (t * 1.6) % 1;
                const age = ((head * 8 - i) % 8 + 8) % 8;
                return <circle key={i} cx={fmt(Math.cos(a - Math.PI / 2) * 70)} cy={fmt(Math.sin(a - Math.PI / 2) * 70)} r={17} fill={INK} opacity={fmt(1 - age / 8.5)} />;
              })}
            </g>
          </g>
        )}
        <Unplugged x={mid.x} y={mid.y + 70} s={1.5} k={plugK} />
      </Cam>
      <Tag x={tagA.x} y={tagA.y} text="Ready" size={40} k={readyK} fill="#DDF2E3" />
      <Tag x={tagB.x} y={tagB.y} text="Ready" size={40} k={readyK} fill="#DDF2E3" />
    </g>
  );
};

export const S4: React.FC<{f: number}> = ({f}) => (f / FPS < tCut() ? <Report f={f} /> : <Labs f={f} />);

/** sound cues for the mix (gain in dB, as in S1) */
export const CUES_S4 = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const tStall = TE('ready to go') + 0.2;
  return [
    {t: T('first session') - 0.05, kind: 'tick', gain: -9},
    {t: T('Two human brains') + 0.05, kind: 'packet_send', gain: -6},
    {t: T('human brains') + 1.2, kind: 'packet_arrive', gain: -10},
    {t: T('human brains') + 1.65, kind: 'packet_arrive', gain: -10},
    {t: T('ready to go') - 0.05, kind: 'pop', gain: -7},
    {t: tStall, kind: 'spinner', gain: -7, dur: T('Bad connection') - tStall},
    {t: T('Bad connection'), kind: 'error', gain: -2},
  ];
};

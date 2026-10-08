import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import {Chip} from '../components/Text';
import {E, SOFT, kf, sp, tw} from '../lib/motion';
import {
  LAYOUT,
  PULSE_SPEED,
  arrivalHistogram,
  assertPath,
  confocalPath,
  layoutPoints,
  normalize,
  occluderRect,
  pathLength,
  pathSchedule,
  possibleCloud,
  roomRect,
  scatterDirections,
  selfTest,
  sub,
  timeNs,
  type P2,
} from '../lib/optics';
import {ArrivalHistogram, Band, CandidateArc, LightPath, PossibleCloud, ScatterFan, SensorGlyph, TimingRuler, WallMarker, type ToPx} from '../components/v02/Optics';

/**
 * Dev composition for the optics kit (plan view, 240 frames):
 *   0–60    a pulse travels S → W3 → H → W3 → S at the shared PULSE_SPEED (cues from pathSchedule), scattering at W3
 *           and at H; the timing ruler runs.
 *   60–120  the sensor measures each wall sample in turn: its path shows (W1's leg grazes the partition corner, a
 *           check on LightPath's clearance nudge) and its candidate arc draws on, radius |WH| from the arrival time.
 *   120–200 timing noise thickens each arc into a band; the possible-locations cloud forms around H.
 *   200–240 the plan slides left and the arrival-time histogram for W3 builds.
 * selfTest() runs on every render, so a layout that breaks the geometry claims throws here.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const {S, H, W} = layoutPoints(LAYOUT);
const ROOM = roomRect(LAYOUT);
const OCC = occluderRect(LAYOUT);
const W3 = W[2];
const PATH = confocalPath(S, W3, H);
assertPath(PATH, LAYOUT);
const PATH_LEN = pathLength(PATH);
const PATH_NS = timeNs(PATH_LEN);
const PATHS = W.map((w) => confocalPath(S, w, H));
const FAN_W3 = scatterDirections({x: 0, z: 1}, 9, 3);
const FAN_H = scatterDirections(sub(W3, H), 7, 11);
const HIST = arrivalHistogram({S, W: W3, H, rangeNs: [0, 40], binNs: 1.25});

// timing
const TRAVEL0 = 6;
const SCHED = pathSchedule(PATH, {start: TRAVEL0, speed: PULSE_SPEED}); // ~51 frames for 9.16 m
const hitFrame = (k: number) => SCHED.vertexFrames[k];
const ARC0 = 62;
const ARC_GAP = 10;
const ARC_DUR = 26;
const SHIFT0 = 188;
/** 0..1 while wall sample i is being measured (its path shows, its marker is lit); neighbours crossfade. */
const measuring = (frame: number, i: number) => {
  const a = ARC0 + i * ARC_GAP - 2;
  const b = i < W.length - 1 ? ARC0 + (i + 1) * ARC_GAP + 4 : ARC0 + i * ARC_GAP + ARC_DUR;
  return Math.min(tw(frame, a, 6), 1 - tw(frame, b - 6, 6));
};

/** A plan label. `backing` puts it on a floor-coloured pill so lines on the floor pass cleanly behind it. */
const Label: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; color?: string; align?: 'left' | 'center' | 'right'; opacity?: number; mono?: boolean; backing?: boolean}> = ({x, y, children, size = 30, color = C.ink, align = 'center', opacity = 1, mono, backing}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}, -50%)`,
      fontFamily: mono ? F.mono : F.body,
      fontWeight: mono ? 700 : 800,
      fontSize: size,
      color,
      whiteSpace: 'nowrap',
      opacity,
      lineHeight: 1,
      ...(backing ? {background: C.cream, padding: '5px 10px 7px', borderRadius: 12} : {}),
    }}
  >
    {children}
  </div>
);

const Row: React.FC<{label: string; value?: string; t: number; head?: boolean; tone?: string}> = ({label, value, t, head, tone}) =>
  t <= 0 ? null : (
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 18, opacity: Math.min(1, t * 1.5), transform: `translateY(${(1 - E.out(Math.min(1, t))) * 10}px)`, marginTop: head ? 18 : 6}}>
      <span style={{fontFamily: head ? F.body : F.mono, fontWeight: head ? 800 : 700, fontSize: 30, color: head ? C.inkSoft : tone ?? C.ink}}>{label}</span>
      {value && <span style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.ink}}>{value}</span>}
    </div>
  );

const LegendItem: React.FC<{swatch: React.ReactNode; label: string; t: number}> = ({swatch, label, t}) =>
  t <= 0 ? null : (
    <div style={{display: 'flex', alignItems: 'center', gap: 16, height: 54, opacity: Math.min(1, t * 1.5)}}>
      <svg width={56} height={40} style={{overflow: 'visible', flex: 'none'}}>
        {swatch}
      </svg>
      <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.ink}}>{label}</span>
    </div>
  );

export const KitOptics: React.FC = () => {
  const frame = useCurrentFrame();
  const report = selfTest(LAYOUT); // throws if the layout breaks a geometry claim

  /* ---- mapping: plan metres → px. Wall at the top, centred; slides left for the histogram at the end. */
  const shift = tw(frame, SHIFT0, 24, E.inOut);
  const ppm = lerp(230, 168, shift);
  const ox = lerp((1920 - (ROOM.x1 - ROOM.x0) * 230) / 2, 64, shift);
  const oy = lerp(132, 214, shift);
  const toPx: ToPx = (p: P2) => ({x: ox + (p.x - ROOM.x0) * ppm, y: oy + (p.z - ROOM.z0) * ppm});
  const P = (x: number, z: number) => toPx({x, z});

  /* ---- phase 1: pulse */
  const travel = SCHED.progress(frame);
  const pathOpacity = frame < 190 ? 1 - tw(frame, 60, 10) : 0.55 * tw(frame, 214, 12);
  const fanW3 = tw(frame, hitFrame(1), 10);
  const fanW3Out = tw(frame, hitFrame(1) + 12, 16);
  const fanH = tw(frame, hitFrame(2), 9);
  const fanHOut = tw(frame, hitFrame(2) + 10, 14);
  const rulerOpacity = 1 - tw(frame, 60, 10);
  const firing = frame < TRAVEL0 + 8 ? Math.sin(Math.min(1, Math.max(0, (frame - TRAVEL0 + 2) / 8)) * Math.PI) : 0;

  /* ---- phase 2: arcs (radius recovered from the arrival time, see selfTest rows) */
  const arcT = W.map((_, i) => tw(frame, ARC0 + i * ARC_GAP, ARC_DUR, E.inOut));
  const arcWidth = lerp(6, 3.5, tw(frame, 124, 20));
  const aimX = kf(frame, [
    [ARC0 - 8, W3.x],
    ...W.map((w, i) => [ARC0 + i * ARC_GAP, w.x] as [number, number]),
    [ARC0 + 3 * ARC_GAP + ARC_DUR + 4, W[3].x],
    [ARC0 + 3 * ARC_GAP + ARC_DUR + 20, W3.x],
  ]);
  const aim = normalize(sub({x: aimX, z: 0}, S));
  const activeW = W.map((_, i) => {
    if (frame < 60) return i === 2 ? 1 : 0;
    if (frame < 124) return Math.max(measuring(frame, i), i === 2 ? 1 - tw(frame, 60, 6) : 0);
    if (frame >= 204) return i === 2 ? tw(frame, 206, 8) : 0;
    return 0;
  });

  /* ---- phase 3: bands thicken, cloud forms */
  const hw = lerp(0.012, 0.085, tw(frame, 126, 44, E.inOut));
  const bandT = W.map((_, i) => tw(frame, 120 + i * 3, 12));
  const cloudT = tw(frame, 140, 26);
  const field = frame >= 138 ? possibleCloud({x0: 2.45, x1: 4.35, z0: 0.45, z1: 2.6, step: 0.012}, report.rows.map((r, i) => ({W: W[i], r: r.radius, halfWidth: hw}))) : null;

  /* ---- phase 4: histogram */
  const card = sp(frame, 206, SOFT);
  const sweep = tw(frame, 213, 21, E.linear);
  const leftUi = 1 - tw(frame, 186, 10);

  const room = [P(ROOM.x0, ROOM.z0), P(ROOM.x1, ROOM.z0), P(ROOM.x1, ROOM.z1), P(ROOM.x0, ROOM.z1)];
  const wallTop = P(ROOM.x0 - 0.0, -0.1);
  const occ0 = P(OCC.x0, OCC.z0);
  const occ1 = P(OCC.x1, OCC.z1);
  const occCx = (occ0.x + occ1.x) / 2;
  const occW = Math.max(18, occ1.x - occ0.x); // the footprint, never thinner than 18 px (as Partition's plan symbol)
  const sPx = toPx(S);
  const hPx = toPx(H);

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {/* floor */}
        <path d={`M ${room.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        {/* 0.5 m ticks along the wall only */}
        {Array.from({length: Math.floor((ROOM.x1 - ROOM.x0) / 0.5) + 1}, (_, i) => {
          const a = P(ROOM.x0 + i * 0.5, 0);
          return <path key={i} d={`M ${a.x} ${a.y} L ${a.x} ${a.y + 14}`} stroke={C.inkMuted} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />;
        })}
        {/* hidden person H, under the floor drawings (placeholder token; its ring is drawn on top below) */}
        <circle cx={hPx.x} cy={hPx.y} r={0.13 * ppm} fill={C.coralLight} fillOpacity={0.6} />
        {/* bands */}
        {W.map((w, i) => (
          <Band key={`b${i}`} asGroup center={w} r={report.rows[i].radius} halfWidth={hw} toPx={toPx} t={bandT[i]} clip={ROOM} tone="blue" fillOpacity={0.16} />
        ))}
        {/* candidate arcs */}
        {W.map((w, i) => (
          <CandidateArc key={`a${i}`} asGroup center={w} r={report.rows[i].radius} toPx={toPx} t={arcT[i]} clip={ROOM} tone="blue" width={arcWidth} />
        ))}
        {/* possible-locations cloud */}
        {field && <PossibleCloud asGroup toPx={toPx} field={field} levels={[0.06, 0.45]} t={cloudT} tone="teal" blur={7} />}
        {/* leader from the "possible locations" label to the cloud */}
        {cloudT > 0 && (
          <path d={`M ${P(3.42, 2.16).x} ${P(3.42, 2.16).y} L ${P(3.27, 1.73).x} ${P(3.27, 1.73).y}`} stroke={C.tealDeep} strokeWidth={3.5} strokeLinecap="round" opacity={tw(frame, 158, 12)} />
        )}
        {/* partition (occluder) on top of the drawings on the floor */}
        <rect x={occCx - occW / 2} y={occ0.y} width={occW} height={occ1.y - occ0.y} rx={5} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
        {[1 / 3, 2 / 3].map((k) => {
          const y = lerp(occ0.y, occ1.y, k);
          return <path key={k} d={`M ${occCx - occW / 2} ${y} L ${occCx + occW / 2} ${y}`} stroke={C.ink} strokeWidth={3} />;
        })}
        {/* light path + scatter */}
        {PATHS.map((path, i) => {
          const m = frame >= 56 && frame < 124 ? measuring(frame, i) : 0;
          return m > 0 ? <LightPath key={`m${i}`} asGroup points={path} toPx={toPx} t={1} showFull layout={LAYOUT} opacity={0.6 * m} /> : null;
        })}
        {pathOpacity > 0 && <LightPath asGroup points={PATH} toPx={toPx} t={frame < 190 ? travel : 1} showFull={frame >= 190} opacity={pathOpacity} pulses={3} ringClip={ROOM} layout={LAYOUT} />}
        <ScatterFan asGroup origin={W3} dirs={FAN_W3} length={0.8} toPx={toPx} t={fanW3} release={fanW3Out} seed={3} layout={LAYOUT} />
        <ScatterFan asGroup origin={H} dirs={FAN_H} length={0.45} toPx={toPx} t={fanH} release={fanHOut} seed={11} layout={LAYOUT} width={3.5} />
        {/* relay wall slab */}
        <rect x={wallTop.x - 10} y={wallTop.y} width={room[1].x - room[0].x + 20} height={room[0].y - wallTop.y} rx={4} fill={C.paperDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        {/* wall samples */}
        {W.map((w, i) => (
          <WallMarker key={`w${i}`} asGroup p={w} toPx={toPx} label={w.id} active={activeW[i]} t={1} />
        ))}
        {/* hidden person H (placeholder token: dashed ring, it is not seen directly) */}
        <circle cx={hPx.x} cy={hPx.y} r={0.13 * ppm} fill="none" stroke={C.coralDeep} strokeWidth={3.5} strokeDasharray="9 7" />
        <circle cx={hPx.x} cy={hPx.y} r={5.5} fill={C.coralDeep} stroke={C.cream} strokeWidth={2} />
        {/* sensor */}
        <SensorGlyph asGroup p={S} dir={aim} toPx={toPx} firing={firing} size={lerp(46, 38, shift)} />
      </svg>

      {/* plan labels */}
      <Label x={P(3.55, 0).x} y={P(0, 0).y - 46}>relay wall</Label>
      <Label x={occ0.x + 2} y={occ1.y + 38} backing>
        partition
      </Label>
      <Label x={sPx.x} y={sPx.y + 58} backing>
        sensor S
      </Label>
      <Label x={hPx.x + 0.17 * ppm} y={hPx.y + 0.06 * ppm} align="left" color={C.coralDeep} backing>
        hidden H
      </Label>
      {cloudT > 0 && (
        <Label x={P(3.5, 2.28).x} y={P(3.5, 2.28).y} color={C.tealDeep} opacity={tw(frame, 158, 12)} backing>
          possible locations
        </Label>
      )}

      {/* guard-rail chips */}
      <div style={{position: 'absolute', left: 32, top: 18, display: 'flex', gap: 14}}>
        <Chip tone="paper" size={30}>simplified picture (2D)</Chip>
        <Chip tone="paper" size={30}>illustrative</Chip>
        <Chip tone="paper" size={30}>slowed down</Chip>
      </div>

      {/* legend (left margin) */}
      <div style={{position: 'absolute', left: 36, top: 190, opacity: leftUi}}>
        <LegendItem
          t={1}
          label="light pulse"
          swatch={
            <>
              <path d="M 4 20 L 36 20" stroke={C.saffronDeep} strokeWidth={6} strokeLinecap="round" />
              <circle cx={42} cy={20} r={11} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} />
            </>
          }
        />
        <LegendItem t={tw(frame, ARC0, 10)} label="candidate arc" swatch={<path d="M 4 34 Q 28 0 52 34" fill="none" stroke={C.blue} strokeWidth={6} strokeLinecap="round" />} />
        <LegendItem
          t={tw(frame, 120, 10)}
          label="timing band"
          swatch={<path d="M 4 34 Q 28 0 52 34 L 52 22 Q 28 -12 4 22 Z" fill={C.blue} fillOpacity={0.25} stroke={C.blue} strokeOpacity={0.55} strokeWidth={2.5} />}
        />
        <LegendItem t={tw(frame, 146, 10)} label="possible locations" swatch={<ellipse cx={28} cy={20} rx={24} ry={13} fill={C.teal} fillOpacity={0.6} stroke={C.tealDeep} strokeWidth={3} />} />
      </div>

      {/* readout (right margin): every number comes from lib/optics */}
      <div style={{position: 'absolute', left: 1500, top: 160, width: 388, opacity: leftUi}}>
        <Row head label="path for W3" t={1} />
        <Row label="S→W3→H→W3→S" t={1} />
        <Row label="length" value={`${PATH_LEN.toFixed(2)} m`} t={1} />
        <Row label="time" value={`${PATH_NS.toFixed(1)} ns`} t={1} />
        <Row head label="arc radius |WH|" t={tw(frame, ARC0, 10)} />
        {report.rows.map((r, i) => (
          <Row key={r.id} label={r.id} value={`${r.radius.toFixed(2)} m`} t={tw(frame, ARC0 + i * ARC_GAP, 10)} />
        ))}
        <Row head label="band half-width" t={tw(frame, 124, 10)} />
        <Row label="±" value={`${(hw * 100).toFixed(1)} cm`} t={tw(frame, 124, 10)} />
      </div>

      {/* timing ruler (phase 1) */}
      {rulerOpacity > 0 && (
        <div style={{position: 'absolute', left: P(ROOM.x0, 0).x, top: 994, opacity: rulerOpacity}}>
          <TimingRuler ns={35} width={640} height={60} marker={SCHED.nsAt(frame)} markerLabel="" rateLabel ratePosition="right" />
        </div>
      )}
      {rulerOpacity > 0 && (
        <Label x={P(ROOM.x0, 0).x - 24} y={1024} align="right" mono opacity={rulerOpacity}>
          {SCHED.nsAt(frame).toFixed(1)} ns
        </Label>
      )}

      {/* histogram card (phase 4) */}
      {card > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 880,
            top: 150,
            width: 1000,
            height: 760,
            boxSizing: 'border-box',
            padding: '30px 34px 24px',
            background: C.cream,
            border: `${OUTLINE}px solid ${C.ink}`,
            borderRadius: 24,
            boxShadow: `10px 12px 0 ${C.shadow}`,
            opacity: Math.min(1, card * 1.4),
            transform: `translateY(${(1 - card) * 60}px) scale(${0.94 + 0.06 * card})`,
            transformOrigin: '50% 60%',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 46, color: C.ink}}>arrival times at the sensor</div>
            <Chip tone="paper" size={30}>illustrative</Chip>
          </div>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 30, color: C.inkSoft, marginTop: 6}}>light aimed at W3, one pulse</div>
          <div style={{marginTop: 22}}>
            <ArrivalHistogram
              bins={HIST.edges}
              values={HIST.values}
              t={sweep}
              width={930}
              height={560}
              peaks={[
                {bin: HIST.firstBin, label: 'first bounce (wall)', tone: 'saffron'},
                {bin: HIST.lateBin, label: 'hidden person', tone: 'teal', dy: 0},
              ]}
              highlight={{from: HIST.lateBin - 1, to: HIST.lateBin + 1, tone: 'teal', t: tw(frame, 228, 8)}}
            />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

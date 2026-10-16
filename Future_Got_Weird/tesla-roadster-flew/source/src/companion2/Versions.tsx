// Which configuration does what (Tesla's lineup as reported from its page; equipment glyphs are conceptual):
// Performance: fan suction, no thrusters. Thrust: adds thrusters at the back. Rocket: thrusters all around, the only
// version Tesla lists with flight; one seat, invite only, "not approved for public road use" per Tesla. 2028 target.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {CAR, CarSide} from './Car';
import {Arrow, cue, E, FLOW, FLOW_LIGHT, lerp, ramp, Tag, track, useT} from './kit';

const T = {
  three: cue('versions', 'P20'), performance: cue('Performance', 'P20'), suction: cue('suction', 'P20'), noThr: cue('no', 'P20'),
  thrust: cue('Thrust', 'P20'), back: cue('back', 'P20'), rocket: cue('Rocket', 'P20'), around: cue('around', 'P20'),
  flight: cue('flight', 'P20'), seats: cue('seats', 'P20'), invite: cue('invite', 'P20'), page: cue('page', 'P20'),
  road: cue('road', 'P20'), production: cue('Production', 'P20'), end: cue('twenty-eight', 'P20', 0, true),
};
const K = 1.3; // world units -> px
const FLOOR = 760;
const XS = [330, 960, 1590];

const Puff: React.FC<{x: number; y: number; dx: number; dy: number; o: number; t: number}> = ({x, y, dx, dy, o, t}) => {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {[0, 1, 2].map((j) => {
        const u = (t * 2 + j / 3) % 1;
        return <circle key={j} cx={x + dx * (12 + u * 50)} cy={y + dy * (12 + u * 50)} r={6 + u * 12} fill={FLOW_LIGHT} opacity={1 - u} stroke="#9DB8E8" strokeWidth={1.5} />;
      })}
      <Arrow x1={x + dx * 8} y1={y + dy * 8} x2={x + dx * 62} y2={y + dy * 62} color={FLOW} w={7} head={16} outline={1.5} />
    </g>
  );
};

const Plate: React.FC<{x: number; name: string; tag: string; hi: number; o: number}> = ({x, name, tag, hi, o}) => (
  <div style={{position: 'absolute', left: x, top: FLOOR + 70, transform: 'translateX(-50%)', textAlign: 'center', opacity: o}}>
    <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 46, letterSpacing: 2, color: C.ink, background: hi > 0.5 ? C.saffron : C.cream, border: `4px solid ${C.ink}`, borderRadius: 16, padding: '4px 26px'}}>{name}</div>
    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.inkSoft, marginTop: 6}}>{tag}</div>
  </div>
);

const Chip: React.FC<{x: number; y: number; text: string; o: number; bg?: string}> = ({x, y, text, o, bg = C.cream}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * o})`, opacity: o, fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.ink, background: bg, border: `3px solid ${C.ink}`, borderRadius: 16, padding: '4px 16px', whiteSpace: 'nowrap'}}>{text}</div>
);

export const Versions: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT(start);
  // the three cars roll onto their platforms in turn
  const cars = [ramp(t, start + 0.05, start + 0.75, E.out), ramp(t, start + 0.3, start + 1.0, E.out), ramp(t, start + 0.55, start + 1.25, E.out)];
  const hiP = ramp(t, T.performance - 0.2, T.performance + 0.1) * (1 - ramp(t, T.thrust - 0.2, T.thrust));
  const hiT = ramp(t, T.thrust - 0.2, T.thrust + 0.1) * (1 - ramp(t, T.rocket - 0.2, T.rocket));
  const hiR = ramp(t, T.rocket - 0.2, T.rocket + 0.1);
  const suction = ramp(t, T.suction - 0.2, T.suction + 0.3);
  const rear = ramp(t, T.back - 0.4, T.back);
  const around = ramp(t, T.around - 0.4, T.around);
  const hover = track(t, [[T.flight - 0.2, 0], [T.flight + 0.6, 34, E.out]]) + Math.sin(t * 2.2) * 4 * ramp(t, T.flight, T.flight + 0.6);
  const dim = (i: number) => {
    const focus = [hiP, hiT, hiR];
    const any = Math.max(...focus);
    return 1 - 0.45 * any * (1 - focus[i]);
  };
  const carY = (i: number) => FLOOR - (i === 2 ? hover : 0);
  const drift = (t - start) * 3;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#EFE6D2 0%, #F7F1E3 55%, #E4D8BE 100%)'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible', transform: `translateX(${-drift}px)`}}>
        {/* hangar: back wall panels, floor, platforms */}
        {Array.from({length: 11}, (_, i) => <rect key={i} x={-60 + i * 200} y={60} width={186} height={560} rx={10} fill="#E6DCC6" stroke="#D3C6A8" strokeWidth={4} />)}
        <rect x={-100} y={620} width={2200} height={500} fill="#D8CCB0" />
        <rect x={-100} y={620} width={2200} height={8} fill="#C4B693" />
        {XS.map((x, i) => (
          <g key={i} opacity={cars[i]}>
            <ellipse cx={x} cy={FLOOR + 22} rx={300} ry={34} fill="#BFB08C" stroke={C.ink} strokeWidth={4} />
            <ellipse cx={x} cy={FLOOR + 10} rx={300} ry={34} fill="#F3ECDD" stroke={C.ink} strokeWidth={4} />
          </g>
        ))}
        {XS.map((x, i) => (
          <g key={`c${i}`} opacity={Math.min(1, cars[i] * 2) * dim(i)} transform={`translate(${-240 * (1 - cars[i])} 0) translate(${x} ${carY(i)}) scale(${K}) translate(${-x} ${-carY(i)})`}>
            <CarSide x={x} y={carY(i)} heading={0} />
            {/* fan suction under every car (conceptual) */}
            <g opacity={suction}>
              <circle cx={x - 10} cy={carY(i) + CAR.floor / 2 - 1} r={9} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
              <Arrow x1={x - 30} y1={carY(i) + CAR.floor / 2} x2={x - CAR.tail - 40} y2={carY(i) + CAR.floor / 2} color={FLOW} w={5} head={12} outline={1.2} />
            </g>
            {/* thrusters at the back (Thrust, Rocket) */}
            {i >= 1 && <Puff x={x - CAR.tail + 6} y={carY(i) - 40} dx={-1} dy={0} o={rear} t={t} />}
            {/* thrusters all around (Rocket) */}
            {i === 2 && (
              <g>
                <Puff x={x + 120} y={carY(i) - 4} dx={0} dy={1} o={around} t={t} />
                <Puff x={x - 140} y={carY(i) - 4} dx={0} dy={1} o={around} t={t + 0.3} />
                <Puff x={x + CAR.nose - 6} y={carY(i) - 36} dx={1} dy={0} o={around} t={t + 0.5} />
              </g>
            )}
          </g>
        ))}
      </svg>
      <Tag kind="claim" text="Tesla's three versions (as listed by Tesla) · equipment simplified" opacity={ramp(t, start + 0.2, start + 0.6)} />
      <Plate x={XS[0]} name="PERFORMANCE" tag="fan suction · no thrusters" hi={hiP} o={ramp(t, T.performance - 0.3, T.performance)} />
      <Plate x={XS[1]} name="THRUST" tag="+ thrusters at the back" hi={hiT} o={ramp(t, T.thrust - 0.3, T.thrust)} />
      <Plate x={XS[2]} name="ROCKET" tag="+ thrusters all around · flight" hi={hiR} o={ramp(t, T.rocket - 0.3, T.rocket)} />
      <Chip x={XS[2] - 130} y={470} text="1 seat" o={ramp(t, T.seats - 0.2, T.seats + 0.2)} />
      <Chip x={XS[2] + 110} y={470} text="invite only" o={ramp(t, T.invite - 0.2, T.invite + 0.2)} />
      <div style={{position: 'absolute', left: XS[2] - 40, top: 290, whiteSpace: 'nowrap', transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * ramp(t, T.page - 0.2, T.road)})`, opacity: ramp(t, T.page - 0.2, T.page + 0.3), textAlign: 'center'}}>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 36, lineHeight: 1.15, color: C.ink, background: C.coralLight, border: `4px solid ${C.coralDeep}`, borderRadius: 18, padding: '8px 22px'}}>
          NOT APPROVED FOR<br />PUBLIC ROAD USE
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 24}}>Rocket only · per Tesla's page</div>
        </div>
      </div>
      <Chip x={960} y={150} text="Production target: 2028 (Tesla)" o={ramp(t, T.production - 0.2, T.production + 0.3)} bg={C.saffronLight} />
    </AbsoluteFill>
  );
};

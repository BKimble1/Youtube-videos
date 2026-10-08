import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import {Character, IDLE, Pose} from '../components/Character';
import {CAST} from '../components/cast';
import {E, camPath, tw} from '../lib/motion';
import {Camera, Layer} from '../lib/camera';
import {BOT, BotEyes, BotTopG, DeliveryBot, DeliveryBotG, mixEyes} from '../components/v02/DeliveryBot';
import {
  WAREHOUSE,
  WH_PTS,
  WarehouseSet,
  WhItem,
  WhPt,
  whBotAt,
  whBotTopAt,
  whCheck,
  whFigureMix,
  whPathWith,
  whProjectWith,
  whRigAt,
  whRigStyle,
  whSightBlocked,
  whTokenAt,
  whViewAt,
} from '../components/v02/Warehouse';

/**
 * Dev composition for the warehouse set and the delivery robot.
 *   0-80    front view: the robot rolls along aisle A toward the blind corner (sensor pulses); the person walks down
 *           aisle B toward the junction, unseen by the robot
 *   72-80   the robot notices (eyes go cautious) just before it brakes
 *   26-82   camera push-in on the approach (held through the brake; released during the tilt)
 *   80-94   braking: linear deceleration to the stop pose, nose-down pitch (~6 deg), then a rock back and settle
 *   94-130  hold; faster probing pulses
 *   130-200 tilt to the plan view
 *   200-239 plan: corner geometry overlay (blocked direct line, edge of view past the corner, relay section samples),
 *           robot glyph, person token still approaching; model sheet of the robot's eye states on the right
 */

const V = 0.045; // m per frame (1.35 m/s)
const FB = 80; // brake starts
const DB = 14; // braking frames
const X_STOP = WAREHOUSE.robotStop.x;
const X_B = X_STOP - (V * DB) / 2;
const X0 = X_B - V * FB;

const robotX = (f: number) => {
  if (f <= FB) return X0 + V * f;
  const u = Math.min(DB, f - FB);
  return X_B + V * (u - (u * u) / (2 * DB));
};

/** Body pitch: a damped spring chasing the deceleration (deterministic: integrated from frame 0 every time). */
const pitchAt = (f: number) => {
  let th = 0;
  let w = 0;
  for (let i = 0; i < f; i++) {
    const target = i >= FB && i < FB + DB ? 0.78 : 0;
    const k = 0.1;
    const c = 0.3;
    w += k * (target - th) - c * w;
    th += w;
  }
  return th * 1.15;
};

/** Sensor pulse phase: one 18-frame pulse every `every` frames from `start`. */
const pulseAt = (f: number, start: number, every: number, len = 18) => {
  if (f < start) return 0;
  const p = (f - start) % every;
  return p < len ? p / len : 0;
};

const personZ = (f: number) => 0.55 + (1.72 - 0.55) * tw(f, 0, 232, E.out);

export const KitWarehouse: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = tw(f, 130, 70, E.inOut);
  const s = whViewAt(tilt);
  const mix = whFigureMix(tilt);
  const problems = whCheck();

  // robot
  const rx = robotX(f);
  const rz = WAREHOUSE.robotLaneZ;
  const travelled = rx - X0;
  const brake = pitchAt(f);
  const eyes = mixEyes('neutral', 'cautious', tw(f, FB - 9, 5, E.out));
  const blink = f >= 112 && f < 116 ? 0.1 : 1;
  const pulse = f < FB + DB ? pulseAt(f, 6, 30) : pulseAt(f, FB + DB + 4, 22);
  const bot = whBotAt(rx, rz, tilt);
  const botTop = whBotTopAt(rx, rz, tilt);

  // person (placeholder walk: frontal rig sliding toward the camera with a step bob and an arm swing)
  const pz = personZ(f);
  const px = WAREHOUSE.personLaneX;
  const walking = f < 225;
  const step = Math.sin((f / 8.5) * Math.PI);
  const rig = whRigAt(px, pz, tilt);
  const pose: Pose = {
    ...IDLE,
    armL: {a: 8 + (walking ? 9 * step : 0), b: 12},
    armR: {a: 8 - (walking ? 9 * step : 0), b: 12},
    lean: walking ? step * 1.2 : 0,
    lookX: -0.15,
    mouth: 'smile',
    bob: walking ? -Math.abs(step) * 7 : 0,
  };
  const tok = whTokenAt(px, pz, tilt);

  const items: WhItem[] = [
    {
      key: 'person',
      x: px,
      z: pz,
      w: 0.28,
      height: 1.7,
      node: <Character look={CAST.person} pose={pose} frame={f} seed={9} x={rig.x} y={rig.y} scale={rig.scale} style={whRigStyle(tilt, rig.scale)} />,
    },
    {
      key: 'robot',
      x: rx,
      z: rz,
      w: BOT.lengthM / 2,
      height: BOT.totalM,
      node: (
        <DeliveryBot
          x={bot.x}
          y={bot.y}
          scale={bot.scale}
          travelled={travelled}
          brake={brake}
          eyes={eyes}
          blink={blink}
          pulse={pulse}
          style={{
            opacity: mix.rig,
            transform: mix.rig < 1 ? `scale(${mix.rigScaleX}, ${mix.rigScaleY})` : undefined,
            transformOrigin: `${130 * bot.scale}px ${280 * bot.scale}px`,
            visibility: mix.rig <= 0.001 ? 'hidden' : undefined,
          }}
        />
      ),
    },
  ];

  // plan overlay: geometry check drawn from WAREHOUSE (dev only)
  const geo = tw(f, 196, 16, E.out);
  const S: WhPt = {x: rx + BOT.sensorAhead, z: rz, h: 0};
  const C0: WhPt = {x: WAREHOUSE.corner.x, z: WAREHOUSE.corner.z};
  const H: WhPt = {x: px, z: pz};
  const blocked = whSightBlocked(S, H);
  // first hit of the direct line with the shelving (march along it)
  let hit: WhPt = H;
  for (let i = 1; i <= 200; i++) {
    const u = i / 200;
    const q = {x: S.x + (H.x - S.x) * u, z: S.z + (H.z - S.z) * u};
    if (whSightBlocked(S, q)) {
      hit = q;
      break;
    }
  }
  // edge of view: from the sensor past the corner to the relay wall
  const ex = WAREHOUSE.relayWall.x;
  const edge: WhPt = {x: ex, z: S.z + ((C0.z - S.z) / (C0.x - S.x)) * (ex - S.x)};
  const P = (p: WhPt) => whProjectWith(s, p);
  const sP = P(S);
  const hitP = P(hit);
  const rs = WAREHOUSE.relaySection;

  const sheet = tw(f, 204, 14, E.out);
  // one push-in on the approach (holds through the brake), released as the camera rises into the plan
  const cam = camPath(f, {cx: 960, cy: 540, zoom: 1}, [
    {at: 26, dur: 56, to: {cx: 890, cy: 590, zoom: 1.34}},
    {at: 130, dur: 70, to: {cx: 960, cy: 540, zoom: 1}},
  ]);

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
      <Layer depth={1}>
      <WarehouseSet tilt={tilt} items={items}>
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {/* plan glyphs */}
          {mix.token > 0.001 && (
            <g>
              <g opacity={tok.opacity} transform={`translate(${tok.x} ${tok.y}) scale(${tok.scale})`}>
                <circle r={tok.r} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} />
                <circle r={tok.r * 0.56} fill="#B8743A" stroke={C.ink} strokeWidth={3} />
              </g>
              <BotTopG x={botTop.x} y={botTop.y} ppm={botTop.ppm} floor={botTop.floor} opacity={botTop.opacity} scale={botTop.scale} pulse={pulse} />
            </g>
          )}
          {/* geometry overlay */}
          {geo > 0.001 && (
            <g opacity={geo}>
              {/* relay section on the wall face */}
              <path d={whPathWith(s, [{x: rs.x - 0.07, z: rs.z0}, {x: rs.x, z: rs.z0}, {x: rs.x, z: rs.z1}, {x: rs.x - 0.07, z: rs.z1}])} fill={C.teal} stroke={C.ink} strokeWidth={3} />
              {/* edge of view past the corner */}
              <path d={whPathWith(s, [S, edge], false)} stroke={C.inkMuted} strokeWidth={4} strokeDasharray="14 12" strokeLinecap="round" fill="none" />
              {/* direct line, stopped by the shelving */}
              <line x1={sP.x} y1={sP.y} x2={hitP.x} y2={hitP.y} stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
              {blocked && (
                <g transform={`translate(${hitP.x} ${hitP.y})`} stroke={C.coralDeep} strokeWidth={6} strokeLinecap="round">
                  <line x1={-11} y1={-11} x2={11} y2={11} />
                  <line x1={-11} y1={11} x2={11} y2={-11} />
                </g>
              )}
              {Object.entries(WH_PTS.relay).map(([id, r]) => {
                const q = P({x: r.x, z: r.z});
                return (
                  <g key={id}>
                    <circle cx={q.x} cy={q.y} r={9} fill={C.white} stroke={C.ink} strokeWidth={3.5} />
                    <text x={q.x - 22} y={q.y + 10} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={28} fill={C.inkSoft}>
                      {id}
                    </text>
                  </g>
                );
              })}
              {(() => {
                const q = P(C0);
                return <circle cx={q.x} cy={q.y} r={10} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} />;
              })()}
            </g>
          )}
        </svg>
      </WarehouseSet>
      </Layer>
      </Camera>

      {/* model sheet of the robot's eye states (plan hold only, outside the building) */}
      {sheet > 0.001 && (
        <div style={{position: 'absolute', left: 24, top: 40, width: 300, height: 960, opacity: sheet, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 18, boxSizing: 'border-box'}}>
          {(['neutral', 'cautious', 'pleased'] as BotEyes[]).map((e, i) => (
            <div key={e} style={{position: 'absolute', left: 0, top: 14 + i * 312, width: 290, height: 280}}>
              <svg viewBox="-130 -250 260 270" width={260} height={270} style={{position: 'absolute', left: 15, top: 0, overflow: 'visible'}}>
                <DeliveryBotG eyes={e} travelled={0.13 * i} pulse={i === 1 ? 0.45 : 0} />
              </svg>
              <div style={{position: 'absolute', left: 0, width: 290, top: 262, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.inkSoft}}>{e}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{position: 'absolute', left: 24, bottom: 18, fontFamily: F.mono, fontSize: 24, color: problems.length ? C.coralDeep : C.inkMuted}}>
        KitWarehouse · frame {f} · tilt {tilt.toFixed(2)} · brake {brake.toFixed(2)}
        {problems.length ? ` · GEOMETRY: ${problems.join('; ')}` : ''}
      </div>
    </AbsoluteFill>
  );
};

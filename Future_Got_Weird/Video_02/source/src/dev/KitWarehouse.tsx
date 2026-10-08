import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Look} from '../components/Character';
import {CAST} from '../components/cast';
import {Character2, IDLE2, Pose2} from '../components/v02/Cast2';
import {E, camPath, tw} from '../lib/motion';
import {Camera, Layer} from '../lib/camera';
import {BOT, BotEyes, BotTopG, DeliveryBot, DeliveryBotG, botDrive, botPulseAt, mixEyes} from '../components/v02/DeliveryBot';
import {
  WAREHOUSE,
  WH_BOT_HALF_W,
  WH_PTS,
  WH_RIG_HALF_W,
  WarehouseSet,
  WhItem,
  WhPt,
  whBotAt,
  whBotStyle,
  whBotTopAt,
  whCheck,
  whFigureMix,
  whFirstHit,
  whPathWith,
  whPlanWalk,
  whProjectWith,
  whRigStyle,
  whTokenAt,
  whViewAt,
  whViewEdge,
  whWalkAt,
  whWalkDistance,
} from '../components/v02/Warehouse';

/**
 * Dev composition for the warehouse set and the delivery robot.
 *   0-80    front view: the robot rolls along aisle A toward the blind corner (sensor pulses)
 *   24-129  the person walks down aisle B toward the junction (5 steps, feet planted), unseen by the robot
 *   71-76   the robot notices (eyes go cautious) just before it brakes
 *   26-82   camera push-in on the approach (held through the brake; released during the tilt)
 *   80-94   braking: linear deceleration to the stop pose, nose-down pitch, then a rock back and settle
 *   94-130  hold; faster probing pulses
 *   130-200 tilt to the plan view
 *   200-239 plan: corner geometry overlay (blocked direct line, edge of view past the corner, relay section samples),
 *           robot glyph, person token; model sheet of the robot's eye states on the left
 */

// robot: rolls in at 1.35 m/s, brakes over 14 frames from frame 80 and stops exactly at the stop pose
const DRIVE = {v0: 1.35, keys: [{at: 80, dur: 14, to: 0}], endX: WAREHOUSE.robotStop.x};
// person: down the walkway from just inside the doors to the last spot still hidden from the stop pose
const WALK = whPlanWalk(WAREHOUSE.personLaneX, 0.35, 1.95);
const WALK_START = 24;
const WALK_FPS = 21; // frames per step

/** Overhead token for a cast look without accessories (shoulders, sleeves, head, bob), in the style of
 *  components/v02/Tokens.tsx. Dev only: the person look has no token there yet. */
const PersonTokenG: React.FC<{x: number; y: number; size: number; look: Look; facing?: number; scale?: number; opacity?: number}> = ({x, y, size: S, look, facing = 0, scale = 1, opacity = 1}) => {
  const sw = Math.max(2, Math.min(OUTLINE, S * 0.032));
  const ink = {stroke: C.ink, strokeWidth: sw, strokeLinejoin: 'round' as const};
  const shY = 0.05 * S;
  const a = ((135 - facing) * Math.PI) / 180;
  const off = {x: S * 0.07 * Math.sin(a), y: -S * 0.07 * Math.cos(a)};
  const rx = S * 0.29;
  const ry = S * 0.28;
  const ha = (52 * Math.PI) / 180;
  const sx = rx * Math.sin(ha);
  const sy = -ry * Math.cos(ha) + 0.02 * S;
  const bob = `M ${-sx} ${sy} A ${rx} ${ry} 0 1 0 ${sx} ${sy} Q ${sx * 0.45} ${-S * 0.215} 0 ${-S * 0.18} Q ${-sx * 0.45} ${-S * 0.215} ${-sx} ${sy} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${facing}) scale(${scale})`} opacity={opacity}>
      <g transform={`translate(${off.x} ${off.y})`} fill={C.shadow}>
        <ellipse cx={0} cy={shY} rx={S * 0.5} ry={S * 0.23} />
        <circle r={S * 0.285} />
      </g>
      <circle cx={-S * 0.395} cy={shY + S * 0.015} r={S * 0.1} fill={look.shirt} {...ink} />
      <circle cx={S * 0.395} cy={shY + S * 0.015} r={S * 0.1} fill={look.shirt} {...ink} />
      <ellipse cx={0} cy={shY} rx={S * 0.42} ry={S * 0.215} fill={look.shirt} {...ink} />
      <ellipse cx={0} cy={-S * 0.26} rx={S * 0.045} ry={S * 0.055} fill={look.skin} {...ink} />
      <ellipse cx={-S * 0.245} cy={S * 0.01} rx={S * 0.04} ry={S * 0.065} fill={look.skin} {...ink} />
      <ellipse cx={S * 0.245} cy={S * 0.01} rx={S * 0.04} ry={S * 0.065} fill={look.skin} {...ink} />
      <circle r={S * 0.245} fill={look.skin} {...ink} />
      <path d={bob} fill={look.hairColor} {...ink} />
    </g>
  );
};

export const KitWarehouse: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = tw(f, 130, 70, E.inOut);
  const s = whViewAt(tilt);
  const mix = whFigureMix(tilt);
  const problems = whCheck();

  // robot
  const drive = botDrive(f, DRIVE);
  const rx = drive.x;
  const rz = WAREHOUSE.robotLaneZ;
  const eyes = mixEyes('neutral', 'cautious', tw(f, 71, 5, E.out));
  const blink = f >= 112 && f < 116 ? 0.1 : 1;
  const pulse = f < 94 ? botPulseAt(f, 6, 30) : botPulseAt(f, 98, 22);
  const bot = whBotAt(rx, rz, tilt);
  const botTop = whBotTopAt(rx, rz, tilt);

  // person: frontal Character2 walking toward the camera with planted feet
  const walk = whWalkAt(WALK, whWalkDistance(f, WALK_START, WALK, WALK_FPS), tilt);
  const pose: Pose2 = {...IDLE2, ...walk.pose, lookX: -0.2, mouth: 'smile'};
  const rigStyle = whRigStyle(tilt, walk.scale);
  const tok = whTokenAt(WALK.x, walk.z, tilt);

  const items: WhItem[] = [
    {
      key: 'person',
      x: WALK.x,
      z: walk.z,
      w: WH_RIG_HALF_W,
      height: WALK.heightM,
      node: (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: mix.rig}}>
            <ellipse cx={walk.shadow.cx} cy={walk.shadow.cy} rx={walk.shadow.rx} ry={walk.shadow.ry} fill={C.shadow} />
          </svg>
          <Character2 look={CAST.person} pose={pose} frame={f} seed={9} x={walk.x} y={walk.y} scale={walk.scale} shadow={false} style={rigStyle} />
        </>
      ),
    },
    {
      key: 'robot',
      x: rx,
      z: rz,
      w: WH_BOT_HALF_W,
      height: BOT.totalM,
      node: (
        <DeliveryBot
          x={bot.x}
          y={bot.y}
          scale={bot.scale}
          travelled={drive.travelled}
          speed={drive.speed}
          brake={drive.brake}
          eyes={eyes}
          blink={blink}
          pulse={pulse}
          style={whBotStyle(tilt, bot.scale)}
        />
      ),
    },
  ];

  // plan overlay: geometry check drawn from WAREHOUSE (dev only)
  const geo = tw(f, 196, 16, E.out);
  const S: WhPt = {x: rx + BOT.sensorAhead, z: rz, h: 0};
  const C0: WhPt = {x: WAREHOUSE.corner.x, z: WAREHOUSE.corner.z};
  const Hp: WhPt = {x: WALK.x, z: walk.z};
  const hit = whFirstHit(S, Hp);
  const edge = whViewEdge(S);
  const P = (p: WhPt) => whProjectWith(s, p);
  const sP = P(S);
  const hitP = P(hit ?? Hp);
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
                  <PersonTokenG x={tok.x} y={tok.y} size={tok.r * 2} look={CAST.person} facing={180} scale={tok.scale} opacity={tok.opacity} />
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
                  {hit && (
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
                        <text x={q.x - 22} y={q.y + 11} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={32} fill={C.inkSoft}>
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

      <div style={{position: 'absolute', left: 24, bottom: 14, fontFamily: F.mono, fontSize: 30, color: problems.length ? C.coralDeep : C.inkMuted}}>
        KitWarehouse · f {f} · tilt {tilt.toFixed(2)} · brake {drive.brake.toFixed(2)}
        {problems.length ? ` · GEOMETRY: ${problems.join('; ')}` : ''}
      </div>
    </AbsoluteFill>
  );
};

// V5 IMATRA ("Figure says the jumps were real" → "…film crew is not"). We arrive through the Imatra doorway in the
// wide foundry: the robot walks out to the edge; the camera moves to the control booth, where a silhouetted witness
// watches and her window flashes when it goes in (the jump itself stays off screen — no repeat of the opening).
// Routine recycling (the crane tips scrap into the ladle), then the camera pulls back past a film camera, lights and
// crew in the foreground: the event was staged and filmed. Sources are named once, concisely.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, mixCam, seg, smooth, easeInOut, easeOut, easeIn, lerp} from '../../v4/kit/scene';
import {FoundryView5, FD} from '../sets/foundry5';
import {FCOL} from '../../v4/sets/foundry';
import {Splash6} from '../sets/splash6';
import {FilmLight, TripodCam, Scrap} from '../../v4/sets/props';
import {RPose} from '../../v4/rig/Robot2D';
import {stand, walk, blend, A, ANK} from '../../v4/rig/poses';
import {walkStop} from '../rig/stop';
import {smoothCam} from '../kit/cam5';
import {S_HK} from './Hook';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C} from '../../theme';

export const IMATRA_START = T('Figure says the jumps') + 0.1;
export const IMATRA_END = T('Blame a reply') - 0.15;
const T_SPOKE = T('and a spokesperson');
const T_GOIN = T('go in');
const T_RECYC = T('Recycling old');
const T_FILM = T('Bringing a film');
const T_NOT = T('crew is not');
const FS = S_HK;

/** The foundry framing the Imatra doorway reveals (the street's push lands on it exactly). */
export const CAM_IM0: Cam = {x: 760, y: 560, z: 0.95};
const CAM_BOOTH: Cam = {x: 1535, y: 470, z: 2.05};
const CAM_W2: Cam = {x: 760, y: 540, z: 0.95};
const CAM_W3: Cam = {x: 700, y: 600, z: 0.6};
const imCamRaw = (t: number): Cam => {
  let c = mixCam(CAM_IM0, {...CAM_IM0, x: CAM_IM0.x + 60}, seg(t, IMATRA_START, T_SPOKE));
  c = mixCam(c, CAM_BOOTH, easeInOut(seg(t, T_SPOKE - 0.1, T_SPOKE + 1.3)));
  c = mixCam(c, CAM_W2, easeInOut(seg(t, T_GOIN + 0.55, T_RECYC + 0.6)));
  c = mixCam(c, CAM_W3, easeInOut(seg(t, T_FILM - 0.35, T_NOT + 0.2)));
  return c;
};
export const imatraCam = (t: number) => smoothCam(imCamRaw, t, 0.2);

// the robot: walks out on the deck to the edge, crouches while the camera is on the booth (it jumps off screen)
const EDGE_X = FD.deck.edge - 4 - 64 * FS;
// six whole strides that end with the near foot at the edge mark, then a stop step (no sliding)
const IM_LEAD = EDGE_X + 12;
const IM_WALK = {x0: IM_LEAD - 6.25 * 150 * FS, ground: FD.deck.top, s: FS, n: 6, o: {yaw: 0.75}, t0: IMATRA_START - 0.6, t1: T_SPOKE - 0.2 - 0.3,
  ready: stand(EDGE_X, FD.deck.top, FS, {yaw: 0.6, armN: A(-4, 16), armF: A(-10, 18),
    footN: {x: IM_LEAD, y: FD.deck.top - ANK * FS, pitch: 0}, footF: {x: IM_LEAD - 20, y: FD.deck.top - ANK * FS, pitch: 0}})};
const robotAt = (t: number): RPose | null => {
  const t0 = IMATRA_START - 0.6, t1 = T_SPOKE - 0.2;
  if (t > T_GOIN - 0.25) return null;
  void t0; void t1;
  return walkStop(IM_WALK, t);
};

export const IMATRA_EV = {robotAt: (t: number) => robotAt(t), IM_WALK};
/** Crane skip: travels along the girder over the ladle and tips its scrap in. */
const Skip: React.FC<{t: number; lw: number}> = ({t, lw}) => {
  const t0 = T_RECYC - 0.4;
  const x = lerp(160, FD.ladle.cx - 40, easeInOut(seg(t, t0, t0 + 0.9)));
  const tip = easeInOut(seg(t, t0 + 0.9, t0 + 1.25)) * (1 - easeInOut(seg(t, t0 + 2.0, t0 + 2.5)));
  const by = 470;
  const pieces = [0, 1, 2, 3].map((k) => {
    const td = t - (t0 + 1.05 + k * 0.08);
    if (td < 0) return null;
    const y = by + 30 + 0.5 * 2400 * td * td;
    if (y > FD.ladle.surf - 4) return null;
    return <Scrap key={k} x={x + 40 + k * 26} y={y} kind={k} rot={td * 300} lw={lw} />;
  });
  return (
    <g>
      <rect x={x - 80} y={128} width={160} height={56} rx={6} fill="#4F5562" stroke={FCOL.ink} strokeWidth={lw} />
      <line x1={x} y1={184} x2={x} y2={by - 60} stroke={FCOL.ink} strokeWidth={lw * 1.4} />
      <g transform={`rotate(${tip * 62} ${x + 70} ${by})`}>
        <path d={`M${x - 90} ${by - 60} L${x + 90} ${by - 60} L${x + 70} ${by + 40} L${x - 70} ${by + 40} Z`} fill="#6A5A57" stroke={FCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
        {tip < 0.4 ? [0, 1, 2].map((k) => <Scrap key={k} x={x - 40 + k * 40} y={by - 70} kind={k + 1} lw={lw} />) : null}
      </g>
      {pieces}
    </g>
  );
};

const silhouette = <filter id="silIm"><feColorMatrix type="matrix" values="0 0 0 0 0.06  0 0 0 0 0.04  0 0 0 0 0.05  0 0 0 1 0" /></filter>;

/** The foundry itself (no overlays, no foreground film unit) for time t and camera cam. */
export const ImatraWorld: React.FC<{t: number; f: number; cam: Cam}> = ({t, f, cam}) => {
  const lw = 4 / cam.z;
  const p = robotAt(t);
  const flash = Math.max(0, 1 - Math.abs(t - T_GOIN - 0.05) / 0.35) * (t > T_GOIN - 0.3 ? 1 : 0);
  const tHit = t - (T_GOIN - 0.05);
  const scrapHit = t - (T_RECYC - 0.4 + 1.42);
  const lights = smooth(seg(t, T_FILM + 0.25, T_FILM + 0.4));
  const B = FD.booth;
  const lean = smooth(seg(t, T_SPOKE + 0.6, T_GOIN - 0.2)) * (1 - smooth(seg(t, T_GOIN, T_GOIN + 0.4)));
  const witness = (
    <g clipPath="url(#boothWinIm)">
      <defs>
        <clipPath id="boothWinIm"><rect x={B.x0 + 30} y={B.y0 + 30} width={B.x1 - B.x0 - 60} height={190} /></clipPath>
        {silhouette}
      </defs>
      <rect x={B.x0 + 30} y={B.y0 + 30} width={B.x1 - B.x0 - 60} height={190} fill="#B07A58" />
      <rect x={B.x0 + 30} y={B.y0 + 150} width={B.x1 - B.x0 - 60} height={70} fill="#8A5A44" />
      <g filter="url(#silIm)">
        <Crew look={CAST.checker} x={B.x0 + 230} y={B.y0 + 330} h={300} frame={f} seed={21} flip shadow={false} life={0.3}
          pose={{...IDLE, armL: {a: 14, b: 30}, armR: {a: lerp(26, 70, lean), b: lerp(120, 100, lean)}, lean: -8 * lean + 6 * flash, lookX: -0.8, lookY: 0.3, mouth: 'flat'}} />
      </g>
      {flash > 0 ? <rect x={B.x0 + 30} y={B.y0 + 30} width={B.x1 - B.x0 - 60} height={190} fill="#FFC870" opacity={0.55 * flash} style={{mixBlendMode: 'screen'}} /> : null}
    </g>
  );
  return (
    <FoundryView5 cam={cam} t={t} hook={false} id="imf" hit={tHit > 0 ? {x: 760, t: tHit} : scrapHit > 0 ? {x: FD.ladle.cx, t: scrapHit} : undefined}
      booth={witness}
      extraBack={(
        <g>
          <FilmLight x={-260} y={FD.deck.top} lw={lw} on={lights} aim={16} id="imLA" />
          <FilmLight x={1440} y={FD.floor} lw={lw} on={lights} aim={205} h={560} id="imLB" />
          <Skip t={t} lw={lw} />
        </g>
      )}
      behind={p ? <Bot cam={cam} id="imR" model="F02" s={FS} pose={p} /> : null}
      inside={<>
        <Splash6 x={760} t={tHit} lw={lw} part="front" scale={0.9} />
        <Splash6 x={FD.ladle.cx} t={scrapHit} lw={lw} part="front" scale={0.45} />
      </>} />
  );
};

export const Imatra: React.FC = () => {
  const f = useCurrentFrame() + Math.round(IMATRA_START * 30);
  const t = f / 30;
  const cam = imatraCam(t);
  const lights = smooth(seg(t, T_FILM + 0.25, T_FILM + 0.4));
  const chipA = seg(t, IMATRA_START + 0.25, IMATRA_START + 0.6) * (1 - seg(t, T_GOIN + 0.2, T_GOIN + 0.5));
  const chipB = seg(t, T_SPOKE + 0.25, T_SPOKE + 0.6) * (1 - seg(t, T_GOIN + 0.2, T_GOIN + 0.5));
  const phone = smooth(seg(t, IMATRA_END - 0.7, IMATRA_END - 0.2));
  return (
    <Scene bg="#221A21"
      over={(
        <>
          <Chip x={96} y={866} lines={['FIGURE · “F.02 DECOMMISSION” · SEP 30, 2026']} k={chipA} size={28} />
          <Chip x={96} y={952} lines={['OVAKO STEEL PLANT, IMATRA · VIA YLE']} k={chipB} size={28} tone="paper" />
        </>
      )}>
      <ImatraWorld t={t} f={f} cam={cam} />
      {/* foreground: the film unit on a nearer plane, outside every earlier framing; the pull-back reveals it */}
      <Layer cam={cam} p={1.6}>
        <TripodCam x={-880} y={FD.floor + 330} lw={4 / (1 + (cam.z - 1) * 1.6)} h={560} />
        <Crew look={CAST.clerkB} x={-640} y={FD.floor + 360} h={660} frame={f} seed={9} life={0.6}
          pose={{...IDLE, armR: {a: 60, b: 74}, armL: {a: 40, b: 50}, lookX: 0.5, lookY: 0.1, mouth: 'flat'}} />
        <Crew look={CAST.clerkC} x={2230} y={FD.floor + 360} h={680} frame={f} seed={14} flip life={0.6}
          pose={{...IDLE, armR: {a: lerp(20, 128, phone), b: lerp(30, 110, phone)}, armL: {a: 40, b: 60}, lookX: phone > 0.5 ? -0.3 : -0.6, lookY: phone > 0.5 ? 0.5 : 0, mouth: phone > 0.5 ? 'o' : 'smile', brows: phone > 0.5 ? 0.6 : 0}}
          holdR={phone > 0 ? <g transform="rotate(10)"><rect x={-26} y={-92} width={52} height={96} rx={10} fill="#1C1F25" stroke={C.ink} strokeWidth={4} /><rect x={-20} y={-84} width={40} height={78} rx={6} fill={C.tealLight} /></g> : undefined} />
      </Layer>
      {lights > 0 && lights < 1 ? <rect width={1920} height={1080} fill="#FFF4D0" opacity={0.18 * Math.sin(Math.PI * lights)} /> : null}
    </Scene>
  );
};
void easeIn; void FCOL;

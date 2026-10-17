// City set check: the avenue, props, the viaduct panorama, gantry states, subway/checkpoint/puddle.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Cam, Layer, inkFor, layerZoom} from '../kit/cam';
import {F, C} from '../theme';
import {
  SkylineFar, Facades, FacadesNear, Street, Streetlight, TrafficLight, Hydrant, Manhole, Rubble, Taxi, Bus, taxiPoints,
  SubwayEntranceBack, SubwayEntranceFront, SubwayInterior, RollGate, TerraceBack, TerraceFront, Viaduct, ViaductFront, BrokenSpan,
  Landing, LandingFront, Gantry, basketFloor, leverHandle, splitEdges, walkPoint, Checkpoint, Puddle, Flames, legTop,
} from '../sets/city';

const Cell: React.FC<{x: number; y: number; w: number; h: number; cam: Cam; label: string; bg?: string; children: (cam: Cam, ink: number) => React.ReactNode}> = ({x, y, w, h, cam, label, bg = '#2B1B26', children}) => {
  const id = `cell${x}_${y}`;
  // cell camera: map world so that cam.x,cam.y sits at the cell centre with zoom cam.z (in cell pixels)
  const tr = `translate(${x + w / 2} ${y + h / 2}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`;
  const ink = inkFor(cam.z, 1);
  return (
    <g>
      <defs><clipPath id={id}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y} width={w} height={h} fill={bg} />
        <g transform={tr}>{children(cam, ink)}</g>
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#000" strokeWidth={3} />
      <text x={x + 10} y={y + 26} fontFamily={F.body} fontSize={20} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={4} paintOrder="stroke">{label}</text>
    </g>
  );
};

export const CitySheet: React.FC<{page: number}> = ({page}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (page === 0) {
    // the avenue from the taxi to the terrace
    const cam: Cam = {x: 2400, y: -2400, z: 0.15};
    const ink = inkFor(layerZoom(cam, 1));
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#2B1B26" />
        <Layer cam={cam} p={0.15}><SkylineFar x0={-400} x1={2600} base={560} h={1} t={t} ink={2.2} /></Layer>
        <Layer cam={cam} p={1}>
          <Facades x0={-4200} x1={9800} t={t} ink={ink} seed={2} />
          <Street x0={-4200} x1={9800} t={t} ink={ink} manholes={[2600]} />
          <Streetlight x={1900} t={t} lit={0.8} ink={ink} seed={2} />
          <Streetlight x={3800} t={t} lit={0} dir={-1} ink={ink} bent={8} />
          <TrafficLight x={2900} t={t} ink={ink} />
          <Hydrant x={1500} ink={ink} />
          <Rubble x={-400} y={40} w={700} h={260} ink={ink} />
          <Taxi x={0} y={40} overturned tilt={10} ink={ink} t={t} />
          <Bus x={-2300} y={300} dir={-1} tilt={0} ink={ink} t={t} />
          <SubwayEntranceBack x={1000} t={t} open={0.4} ink={ink} />
          <SubwayEntranceFront x={1000} ink={ink} />
          <TerraceBack x0={4500} x1={5650} ink={ink} />
          <TerraceFront x0={4500} x1={5650} ink={ink} />
          <Taxi x={3300} y={260} ink={ink} t={t} burning={0.6} seed={4} />
        </Layer>
        
        <text x={20} y={1060} fontFamily={F.body} fontSize={22} fill="#fff">page 0 — avenue x −1200 … 6400 (taxi 0, bus, subway 1000, terrace 4500–5650)</text>
      </svg>
    );
  }
  if (page === 1) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#111" />
        <Cell x={0} y={0} w={640} h={360} cam={{x: 0, y: -260, z: 0.3}} label="taxi upright / dents">{(c, ink) => (<g><Street x0={-1200} x1={1200} t={t} ink={ink} /><Taxi x={0} y={60} ink={ink} t={t} /></g>)}</Cell>
        <Cell x={640} y={0} w={640} h={360} cam={{x: 0, y: -220, z: 0.3}} label="taxi overturned, propped (tilt 12)">{(c, ink) => {
          const tp = {x: 0, y: 60, overturned: true, tilt: 12, ink, t};
          const pts = taxiPoints(tp);
          return (<g><Street x0={-1200} x1={1200} t={t} ink={ink} /><Rubble x={520} y={70} w={300} h={160} ink={ink} /><Taxi {...tp} /><circle cx={pts.chassisTop.x} cy={pts.chassisTop.y} r={22} fill="#0ff" /><circle cx={pts.roofAt(110).x} cy={pts.roofAt(110).y} r={18} fill="#f0f" /></g>);
        }}</Cell>
        <Cell x={1280} y={0} w={640} h={360} cam={{x: 0, y: -380, z: 0.17}} label="bus (wrecked, burning)">{(c, ink) => (<g><Street x0={-2400} x1={2400} t={t} ink={ink} /><Bus x={0} y={60} ink={ink} t={t} burn={0.7} /></g>)}</Cell>
        <Cell x={0} y={360} w={640} h={360} cam={{x: 300, y: -900, z: 0.16}} label="streetlight / traffic light / hydrant">{(c, ink) => (<g><Street x0={-1800} x1={2600} t={t} ink={ink} manholes={[1600]} /><Streetlight x={-400} t={t} lit={1} ink={ink} /><TrafficLight x={500} t={t} ink={ink} /><Hydrant x={1300} ink={ink} /></g>)}</Cell>
        <Cell x={640} y={360} w={640} h={360} cam={{x: 380, y: -320, z: 0.3}} label="subway entrance, grille opening, climber mask">{(c, ink) => (<g><Street x0={-1200} x1={1800} t={t} ink={ink} /><SubwayEntranceBack x={0} t={t} open={(Math.sin(t * 1.3) + 1) / 2} ink={ink} /><rect x={300} y={-300} width={140} height={560} fill={C.coral} stroke="#000" strokeWidth={ink} /><SubwayEntranceFront x={0} ink={ink} /></g>)}</Cell>
        <Cell x={1280} y={360} w={640} h={360} cam={{x: 5300, y: -600, z: 0.24}} label="terrace (back · figure · front)">{(c, ink) => (<g><Street x0={4000} x1={7000} t={t} ink={ink} /><TerraceBack ink={ink} /><rect x={4720} y={-1050} width={120} height={500} fill={C.coral} stroke="#000" strokeWidth={ink} /><rect x={5420} y={-1140} width={120} height={440} fill={C.teal} stroke="#000" strokeWidth={ink} /><TerraceFront ink={ink} /></g>)}</Cell>
        <Cell x={0} y={720} w={960} h={360} cam={{x: 0, y: -180, z: 0.45}} label="puddle reflection with a disturbance">{(c, ink) => (
          <g><Street x0={-1200} x1={1200} t={t} ink={ink} puddles={false} />
            <Puddle x={0} y={180} rx={420} ry={90} t={t} t0={1.0} dx={-120} dy={180} ink={ink} mirrorY={60}>
              <rect x={-600} y={-600} width={1200} height={660} fill="#6B2E2A" />
              <rect x={-500} y={-560} width={300} height={620} fill="#8A4A3A" /><rect x={100} y={-500} width={300} height={560} fill="#7B3E31" />
              <g transform="translate(-350 60)"><Flames w={260} h={300} t={t} seed={3} /></g><g transform="translate(250 60)"><Flames w={200} h={240} t={t} seed={8} /></g>
            </Puddle></g>)}</Cell>
        <Cell x={960} y={720} w={960} h={360} cam={{x: 0, y: -1600, z: 0.11}} label="facades close (fire escapes, shutters, water tower)">{(c, ink) => (<g><Facades x0={-4200} x1={4200} t={t} ink={ink} seed={4} burn={0.25} /><Street x0={-4200} x1={4200} t={t} ink={ink} /></g>)}</Cell>
      </svg>
    );
  }
  if (page === 2) {
    const cam: Cam = {x: 9800, y: -1600, z: 0.168};
    const ink = inkFor(layerZoom(cam, 1));
    const st = {u: 0.45, swing: 4, lever: 35};
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#2B1B26" />
        <Layer cam={cam} p={0.1}><SkylineFar x0={-400} x1={2400} base={560} h={0.7} t={t} ink={2} /></Layer>
        <Layer cam={cam} p={1}>
          <Facades x0={4000} x1={9500} t={t} ink={ink} seed={7} burn={0.2} />
          <Street x0={4000} x1={15500} t={t} ink={ink} />
          <TerraceBack ink={ink} /><TerraceFront ink={ink} />
          <BrokenSpan t={t} ink={ink} />
          <Viaduct t={t} ink={ink} />
          <Landing t={t} ink={ink} barrier={20} />
          <Gantry {...st} t={t} ink={ink} layer="back" />
          <Gantry {...st} t={t} ink={ink} layer="walkFront" />
          <Gantry {...st} t={t} ink={ink} layer="basketBack" />
          <Gantry {...st} t={t} ink={ink} layer="basketFront" />
          <ViaductFront ink={ink} gaps={[[9900, 10500]]} />
          <LandingFront ink={ink} />
          <rect x={14600} y={-900} width={2600} height={900} rx={400} fill="#FFE7B8" opacity={0.6} />
        </Layer>
        <text x={20} y={1060} fontFamily={F.body} fontSize={22} fill="#fff">page 2 — terrace 4500–5650 · viaduct 7200 → edge 10500 · gap · landing 12500–13500 · stairs → 14500 · (refuge placeholder)</text>
      </svg>
    );
  }
  if (page === 3) {
    const base = {x: 11500, y: -2000, z: 0.2};
    const cell = (st: Parameters<typeof Gantry>[0], ink: number, extra?: React.ReactNode) => (
      <g>
        <BrokenSpan t={t} ink={ink} road={false} />
        <Viaduct x0={8600} t={t} ink={ink} stair={false} />
        <Landing t={t} ink={ink} barrier={st.lever === 99 ? 90 : 0} />
        <Gantry {...st} t={t} ink={ink} layer="back" />
        <Gantry {...st} t={t} ink={ink} layer="walkFront" />
        <Gantry {...st} t={t} ink={ink} layer="basketBack" />
        <Gantry {...st} t={t} ink={ink} layer="basketFront" />
        {extra}
      </g>
    );
    const sp = {x: 11350, p: 1};
    const s1 = {u: 0.5, swing: 8 * Math.sin(t * 2), lever: 35};
    const s2 = {u: 1, swing: 0, lever: 99};
    const s3 = {u: 1, swing: 0, lever: 0, split: sp};
    const s4 = {u: 1, lever: 0, split: sp, collapse: 0.45};
    const s5 = {u: 1, lever: 0, split: sp, collapse: 1};
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#111" />
        <Cell x={0} y={0} w={640} h={540} cam={base} label="transit u=.5, swinging, lever held">{(c, ink) => cell(s1, ink, <circle cx={basketFloor(s1).x} cy={basketFloor(s1).y} r={30} fill="#0ff" />)}</Cell>
        <Cell x={640} y={0} w={640} h={540} cam={base} label="docked u=1, barrier lowered">{(c, ink) => cell(s2, ink)}</Cell>
        <Cell x={1280} y={0} w={640} h={540} cam={base} label="walkway split (p=1)">{(c, ink) => { const e = splitEdges(s3)!; return cell(s3, ink, <g><circle cx={e.near.x} cy={e.near.y} r={26} fill="#f0f" /><circle cx={e.far.x} cy={e.far.y} r={26} fill="#0f0" /><circle cx={walkPoint(s3, 12000).x} cy={walkPoint(s3, 12000).y} r={20} fill="#ff0" /></g>); }}</Cell>
        <Cell x={0} y={540} w={640} h={540} cam={base} label="collapse 0.45">{(c, ink) => cell(s4, ink)}</Cell>
        <Cell x={640} y={540} w={640} h={540} cam={base} label="collapse 1 (leg top marked)">{(c, ink) => cell(s5, ink, <circle cx={legTop(s5).x} cy={legTop(s5).y} r={30} fill="#f80" />)}</Cell>
        <Cell x={1280} y={540} w={640} h={540} cam={{x: 10360, y: -1850, z: 0.9}} label="control box + lever (handle marked)">{(c, ink) => cell({u: 0, lever: 35}, ink, <circle cx={leverHandle(35).x} cy={leverHandle(35).y} r={8} fill="#0ff" />)}</Cell>
      </svg>
    );
  }
  if (page === 4) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#111" />
        <Cell x={0} y={0} w={960} h={540} cam={{x: 1800, y: -650, z: 0.24}} label="subway interior: stalled train, emergency light">{(c, ink) => <SubwayInterior x0={-800} x1={5000} t={t} ink={ink} />}</Cell>
        <Cell x={960} y={0} w={960} h={540} cam={{x: 0, y: -450, z: 0.42}} label="roll-up gate (open animates)" bg="#3A3238">{(c, ink) => (<g><rect x={-1200} y={-1200} width={2400} height={1200} fill={'#C9C1AE'} /><rect x={-1200} y={0} width={2400} height={400} fill="#6C665F" /><RollGate x={0} y={0} open={(Math.sin(t * 1.4) + 1) / 2} ink={ink} /></g>)}</Cell>
        <Cell x={0} y={540} w={1920} h={540} cam={{x: -2700, y: -700, z: 0.2}} label="checkpoint (barriers closing, lock)">{(c, ink) => (<g><Facades x0={-6000} x1={600} t={t} ink={ink} seed={12} /><Street x0={-6000} x1={600} t={t} ink={ink} /><Checkpoint t={t} ink={ink} close={Math.min(1, t / 3)} lock={t > 2.5 ? 1 : 0} /></g>)}</Cell>
      </svg>
    );
  }
  if (page === 6) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <SkylineFar x0={-200} x1={2120} base={900} h={1} t={t} ink={2.4} />
        <text x={20} y={1060} fontFamily={F.body} fontSize={22} fill="#fff">page 6 — SkylineFar (far layer, near screen scale)</text>
      </svg>
    );
  }
  if (page === 5) {
    // opening-style close: low camera at the propped taxi, puddle in the foreground reflecting the fire
    const cam: Cam = {x: 380, y: -90, z: 1.15};
    const ink = inkFor(cam.z);
    const tp = {x: 0, y: 60, overturned: true, tilt: 11, ink, t};
    const fire = (
      <g>
        <rect x={-1400} y={-2400} width={2800} height={2460} fill="#6B2E2A" />
        <rect x={-900} y={-2200} width={500} height={2200} fill="#8A4A3A" /><rect x={300} y={-2000} width={600} height={2000} fill="#7B3E31" />
        <g transform="translate(-250 -140)"><Flames w={420} h={520} t={t} seed={3} /></g><g transform="translate(180 -60)"><Flames w={380} h={460} t={t} seed={8} /></g>
      </g>
    );
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#2B1B26" />
        <Layer cam={cam} p={0.5}><Facades x0={-2600} x1={3400} base={-120} t={t} ink={inkFor(layerZoom(cam, 0.5))} seed={6} /></Layer>
        <Layer cam={cam} p={1}>
          <Street x0={-1200} x1={2400} t={t} ink={ink} puddles={false} />
          <Taxi {...tp} />
          {(() => { const sp = taxiPoints(tp).support; return <Rubble x={sp.x + 40} y={70} w={340} h={70 - sp.y + 6} ink={ink} seed={7} />; })()}
        </Layer>
        <Layer cam={cam} p={1.3}>
          <Puddle x={-40} y={30} rx={420} ry={60} t={t} t0={1.0} dx={-150} dy={30} ink={inkFor(layerZoom(cam, 1.3))} mirrorY={-30} squash={0.14}>{fire}</Puddle>
        </Layer>
        <text x={20} y={1060} fontFamily={F.body} fontSize={22} fill="#fff">page 5 — opening close: propped taxi, puddle reflection (foreground layer)</text>
      </svg>
    );
  }
  return null;
};

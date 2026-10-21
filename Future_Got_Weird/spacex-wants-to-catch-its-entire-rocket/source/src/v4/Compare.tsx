// Dev comparison sheet: real frames from the V3 footage pack beside the V3 drawings at matching angles.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Cam3} from './cam3';
import {CatchSet, MOUNT_TOP, Place, VX, azFor} from './site';
import {Booster, Ship, Stack, BOOSTER_LEN} from './vehicles';
import {Defs} from '../assets/defs';
import {Sky} from './scene';

const Panel: React.FC<{x: number; y: number; children: React.ReactNode}> = ({x, y, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 480, height: 270, overflow: 'hidden', border: '2px solid #222'}}>{children}</div>
);
const Drawn: React.FC<{children: React.ReactNode; sky?: 'day' | 'studio' | 'dusk'}> = ({children, sky = 'day'}) => (
  <svg width={480} height={270} viewBox="0 0 1920 1080"><Defs /><Sky k={sky} />{children}</svg>
);

export const V3Compare: React.FC = () => {
  const cPad: Cam3 = {at: [-20, 60, 0], z: 4.6, yaw: 18, pitch: 6};
  const cTop: Cam3 = {at: [VX - 6, MOUNT_TOP + 66, 0], z: 34, yaw: 20, pitch: 2};
  const cTow: Cam3 = {at: [0, 90, 0], z: 22, yaw: 40, pitch: -4};
  return (
    <AbsoluteFill style={{background: '#0d1117'}}>
      <Panel x={0} y={0}><Img src={staticFile('media/ref/pad06.jpg')} style={{width: 480}} /></Panel>
      <Panel x={480} y={0}>
        <Drawn>
          <CatchSet c={cPad} l="day" s={{carY: 112, open: 40}} vehicle={<Place c={cPad} p={[VX, MOUNT_TOP + 0.6, 0]}><Stack az={azFor(cPad, -110)} pal="day" id="cmpst" /></Place>} />
        </Drawn>
      </Panel>
      <Panel x={960} y={0}><Img src={staticFile('media/ref/top07.jpg')} style={{width: 480}} /></Panel>
      <Panel x={1440} y={0}>
        <Drawn sky="studio">
          <g transform="translate(960 2600) scale(34)"><Booster az={25} version="v3" pal="day" id="cmpb" catchHi={1} /></g>
        </Drawn>
      </Panel>
      <Panel x={0} y={270}><Img src={staticFile('media/ref/tower10.jpg')} style={{width: 480}} /></Panel>
      <Panel x={480} y={270}>
        <Drawn><CatchSet c={cTow} l="day" s={{carY: 140, open: 30}} mount={false} /></Drawn>
      </Panel>
      <Panel x={960} y={270}><Img src={staticFile('media/ref/ocean03.jpg')} style={{width: 480}} /></Panel>
      <Panel x={1440} y={270}>
        <Drawn sky="dusk">
          <g transform="translate(700 760) scale(7)"><Ship az={100} pal="dusk" engines={1} plumeLen={24} flapFwd={60} flapAft={70} id="cmps" /></g>
        </Drawn>
      </Panel>
    </AbsoluteFill>
  );
};

// Dev only: print the painter order / cycles for the H8 opening camera (node, via esbuild).
import {makeProj} from '../engine/camera';
import {sortItems, Item} from '../engine/prims';
import {robotItems, RobotSpec} from '../engine/Scene3D';
import {WORKSHOP_ENV, WS, stand, workbench, workshopBack, toolCart, partsShelf} from '../sets/Workshop';
import {f02StandPose, WS_LIGHT} from '../shots/HookTurn';
import {STAND, walkPose} from '../robot/motion';
const cam = JSON.parse(process.argv[2]);
const key = process.argv[3];
const pr = makeProj(cam);
const items: Item[] = [...workshopBack(pr, WORKSHOP_ENV, 14), ...stand(pr, WORKSHOP_ENV), ...workbench(pr, WORKSHOP_ENV, {warm: 1}), ...toolCart(pr, WORKSHOP_ENV, [470, 0, -90], 'c'), ...partsShelf(pr, WORKSHOP_ENV, [620, 0, -540], 's')];
const robots: RobotSpec[] = [
  {id: 'f02ws', pose: f02StandPose(14), light: WS_LIGHT, ground: WS.standTop},
  {id: 'f03ws', pose: walkPose([-640, 0, -440], Math.PI / 2, 2, 0, {stride: 58}), kind: 'F03', light: WS_LIGHT, ground: 0},
  {id: 'rack1', pose: STAND([-1050, 40 + 95.4, -420], 0.3), light: WS_LIGHT},
];
const defs: any[] = [];
for (const r of robots) items.push(...robotItems(pr, r, defs));
(globalThis as any).__sortDbg = [];
sortItems(items, pr);
for (const c of (globalThis as any).__sortDbg) if (c.includes(key)) console.log('SCC with key:', c);
const i = items.findIndex((x) => x.key === key);
console.log('act1 at', i, 'bToppy at', items.findIndex((x) => x.key === 'bToppy'));

// HOOK 10 camera: one continuous move. It opens on the whole participant mid-step, rises along his body to the head
// (1.0-2.3 s), then follows the signal DOWN past the neck injury, the backpack processor and the lower back
// (2.6-4.2 s), and on down to the stepping leg (4.2-6.0 s), easing back a little at the end. x follows his travel.
import {keyCR} from '../../shared/lib';
import {pelvisX} from './walk';
import {Cam} from './Env';

const XK: [number, number][] = [
  [0, -60], [1.0, -66], [1.7, -86], [2.25, -96], [2.7, -86], [3.05, -62], [3.35, -30], [3.65, -14], [3.95, -14], [4.3, -20], [4.75, -40], [5.3, -14], [6.0, 40],
];
const YK: [number, number][] = [
  [0, -656], [1.0, -748], [1.7, -895], [2.25, -968], [2.7, -950], [3.05, -866], [3.35, -790], [3.65, -700], [3.95, -606], [4.3, -520], [4.75, -404], [5.3, -322], [6.0, -276],
];
const ZK: [number, number][] = [
  [0, 1.32], [1.0, 1.56], [1.7, 2.2], [2.25, 2.72], [2.7, 2.84], [3.05, 2.92], [3.35, 2.76], [3.65, 2.56], [3.95, 2.44], [4.3, 2.3], [4.75, 2.06], [5.3, 1.92], [6.0, 1.84],
];

export const camAt = (t: number): Cam => ({
  x: pelvisX(t) + keyCR(t, XK),
  y: keyCR(t, YK),
  z: keyCR(t, ZK),
});

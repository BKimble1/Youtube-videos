// Prints the obstruction intervals and the bystander's walk speed, from the picture's own story functions.
import {blockedAt, bySpeed, pathHit, sAtWalk, WALK} from '../source/src/story';
import {DUR, w} from '../source/src/world';
let prev = false;
for (let f = 0; f <= Math.round(DUR * 30); f++) {
  const t = f / 30;
  const b = blockedAt(t);
  if (b !== prev) { const h = pathHit(t); console.log(`${b ? 'BLOCK' : 'CLEAR'} at frame ${f} t=${t.toFixed(3)} ${h ? `hit x=${h.p.x.toFixed(3)} y=${h.p.y.toFixed(3)}` : ''}`); prev = b; }
}
console.log('stops word', w(83).toFixed(3), 'you(again) word', w(97).toFixed(3), WALK);
for (let t = 22; t < DUR; t += 0.5) console.log(t.toFixed(1), 's', sAtWalk(t).toFixed(3), 'v', bySpeed(t).toFixed(2));

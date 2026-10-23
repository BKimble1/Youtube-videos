// Solves the companion's crossing so that her drawn outline first meets the drawn path on frame 815 and has left it
// on frame 958: prints the X positions (at those instants) where the screen contact toggles (story3 X_ENTER/X_EXIT).
import {screenBlocked} from '../source/src/v3/occlude3';
import {CROSS} from '../source/src/v3/world3';
const T_BLOCK = 815 / 30, T_CLEAR = 958 / 30;
const solve = (t: number, inside: number, outside: number) => {
  for (let i = 0; i < 50; i++) { const m = (inside + outside) / 2; if (screenBlocked(t, m)) inside = m; else outside = m; }
  return (inside + outside) / 2;
};
// find an "inside" x near the crossing first
let ins = CROSS.x;
for (let k = 0; k < 60 && !screenBlocked(T_BLOCK, ins); k++) ins = CROSS.x + (k % 2 ? 1 : -1) * 0.02 * Math.ceil(k / 2);
let ins2 = CROSS.x;
for (let k = 0; k < 60 && !screenBlocked(T_CLEAR, ins2); k++) ins2 = CROSS.x + (k % 2 ? 1 : -1) * 0.02 * Math.ceil(k / 2);
console.log(JSON.stringify({CROSS: CROSS.x, X_ENTER: +solve(T_BLOCK, ins, ins + 1.2).toFixed(4), X_EXIT: +solve(T_CLEAR, ins2, ins2 - 1.5).toFixed(4)}));

import {stateAt} from '../../source/src/film/Film';
const t = +process.argv[2];
const st = stateAt(t);
for (const w of st.wearers) for (const a of w.arms) console.log(w.id, a.tid, JSON.stringify(a.pose, (k, v) => typeof v === 'number' ? +v.toFixed(1) : v));

// dev: print the V2 caption chunks (compile with tsconfig.cues-style tsc, run with node)
import {CAPS2} from '../captions2';
declare const console: {log: (...a: unknown[]) => void};
for (const c of CAPS2) console.log(String(c.show).padStart(4), String(c.hide).padStart(4), c.text);

// usage: node buildfilm.mjs entry.tsx out.mjs   — bundles with the remotion shim and a spy on combatUnit / heavy / drone
import esbuild from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';
const SRC = '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const [, , entry, out] = process.argv;
const spy = {
  name: 'spy',
  setup(b) {
    b.onResolve({filter: /^remotion$/}, () => ({path: path.join(HERE, 'remotion_shim.tsx')}));
    b.onLoad({filter: /r2\/engine\/scene\.tsx$/}, (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      s = s.replace('export const Scene: React.FC<SceneProps> = (p) => {\n  const out = sceneItems(p);', 'export const Scene: React.FC<SceneProps> = (p) => {\n  if ((globalThis as any).__NOSCENE) { (globalThis as any).__LASTVIEW = p.view; (globalThis as any).__LASTITEMS = p.items; return null; }\n  const out = sceneItems(p);');
      return {contents: s, loader: 'tsx', resolveDir: path.dirname(a.path)};
    });
    b.onLoad({filter: /r2\/mech\/(unit|heavy|drone)\.tsx$/}, (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      const rep = (name, kind, argT) => {
        const re = new RegExp(`export const ${name} = \\((sp: \\w+)\\): Item\\[\\] => \\{`);
        if (!re.test(s)) throw new Error('no ' + name);
        s = s.replace(re, `const __${name} = ($1): Item[] => {`);
        s += `\nexport const ${name} = (sp: ${argT}): Item[] => { const r = __${name}(sp); (globalThis as any).__SPY?.('${kind}', sp, r); return r; };\n`;
      };
      if (/unit\.tsx$/.test(a.path)) rep('combatUnit', 'unit', 'UnitSpec');
      if (/heavy\.tsx$/.test(a.path)) rep('heavy', 'heavy', 'HeavySpec');
      if (/drone\.tsx$/.test(a.path)) rep('drone', 'drone', 'DroneSpec');
      return {contents: s, loader: 'tsx', resolveDir: path.dirname(a.path)};
    });
  },
};
await esbuild.build({entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', loader: {'.png': 'empty', '.woff': 'empty', '.woff2': 'empty', '.jpg': 'empty', '.svg': 'empty'}, logLevel: 'warning', plugins: [spy], nodePaths: [SRC + '/node_modules'], banner: {js: "import {createRequire} from 'module'; const require = createRequire(import.meta.url);"}});
console.log('built', out);

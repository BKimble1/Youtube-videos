// esbuild driver: bundles a probe entry with a stubbed 'remotion' and the engine's sceneItems hooked to record items.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const SRC = '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source';
const {build} = createRequire(SRC + '/package.json')('esbuild');
const [, , entry, outfile] = process.argv;
const stubRemotion = `
export const useCurrentFrame = () => globalThis.__FRAME ?? 0;
export const getInputProps = () => ({});
export const AbsoluteFill = (p) => p.children ?? null;
export const Sequence = (p) => p.children ?? null;
export const Audio = () => null;
export const staticFile = (s) => s;
export const interpolate = (x, a, b) => b[0] + (b[1]-b[0]) * Math.min(1, Math.max(0, (x-a[0])/(a[1]-a[0])));
export const useVideoConfig = () => ({fps: 30, width: 1920, height: 1080, durationInFrames: 7134});
export const random = (s) => { const x = Math.sin(Number(s) * 12.9898) * 43758.5453; return x - Math.floor(x); };
export const Img = () => null;
export const delayRender = () => 0;
export const continueRender = () => {};
`;
await build({
  entryPoints: [entry], bundle: true, platform: 'node', outfile, logLevel: 'error', jsx: 'automatic',
  loader: {'.png': 'empty', '.woff': 'empty', '.woff2': 'empty', '.json': 'json'}, nodePaths: [SRC + '/node_modules'],
  plugins: [{
    name: 'hooks',
    setup(b) {
      b.onResolve({filter: /^remotion$/}, () => ({path: 'remotion-stub', namespace: 'stub'}));
      b.onLoad({filter: /.*/, namespace: 'stub'}, () => ({contents: stubRemotion, loader: 'js'}));
      b.onLoad({filter: /fx\/particles\.tsx$/}, (a) => {
        let s = fs.readFileSync(a.path, 'utf8');
        s = s.replace('export const chips3 = (o: ChipsOpts): Item[] => {', 'export const chips3 = (o: ChipsOpts): Item[] => {\n  (globalThis as any).__CHIPOPT?.(o);');
        s = s.replace('export const dust3 = (o: DustOpts): Item[] => {', 'export const dust3 = (o: DustOpts): Item[] => {\n  (globalThis as any).__DUSTOPT?.(o);');
        s = s.replace('export const sparks3 = (o: SparksOpts): Item[] => {', 'export const sparks3 = (o: SparksOpts): Item[] => {\n  (globalThis as any).__SPARKOPT?.(o);');
        return {contents: s, loader: 'tsx', resolveDir: path.dirname(a.path)};
      });
      b.onLoad({filter: /engine\/scene\.tsx$/}, (a) => {
        let s = fs.readFileSync(a.path, 'utf8');
        s = s.replace('export const sceneItems = (p: SceneProps): Out[] => {', 'export const sceneItems = (p: SceneProps): Out[] => {\n  if ((globalThis as any).__REC) { (globalThis as any).__REC(p); return []; }');
        return {contents: s, loader: 'tsx', resolveDir: path.dirname(a.path)};
      });
    },
  }],
  absWorkingDir: SRC,
});
console.log('built', outfile);

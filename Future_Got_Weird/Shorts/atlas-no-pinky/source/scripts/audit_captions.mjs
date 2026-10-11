// Browser-side caption/headline measurement with the BUNDLED fonts. Usage: node scripts/audit_captions.mjs <out.json> [fast|orig]
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..');
const [out, pace = 'fast'] = process.argv.slice(2);
process.env.REMOTION_PACE = pace;
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.join(src, 'src/index.ts'), onProgress: () => {}});
const comp = await selectComposition({serveUrl, id: 'CaptionAudit', browserExecutable, inputProps: {}, envVariables: {REMOTION_PACE: pace}});
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(comp.props.audit, null, 1));
console.log('wrote', out, 'cues', comp.props.audit.captions.length);

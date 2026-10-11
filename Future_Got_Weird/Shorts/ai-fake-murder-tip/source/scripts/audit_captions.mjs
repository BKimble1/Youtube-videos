// Runs the CaptionAudit composition's calculateMetadata in headless Chromium: caption fit (lines, widths, size) and font proof for the bundled faces.
// Usage: node scripts/audit_captions.mjs <out.json>
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..');
const out = process.argv[2] || path.join(src, '..', 'qa', 'v1', 'caption_audit.json');
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.join(src, 'src/index.ts'), onProgress: () => {}});
const comp = await selectComposition({serveUrl, id: 'CaptionAudit', browserExecutable});
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(comp.props.audit, null, 1));
console.log('wrote', out);

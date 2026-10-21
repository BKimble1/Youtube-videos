import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setConcurrency(3);
// Chrome Headless Shell cannot be downloaded in this environment (remotion.media is not allowlisted),
// so use the locally installed Playwright build. Override with REMOTION_BROWSER_EXECUTABLE if needed.
Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');

// Re-bakes src/img/bg.jpg, the plain-gradient background Home falls back to when wallpaper
// mode is off. A static gradient like this is allowed by the style.css perf rules as long as it
// is painted once and never animated — so it is rendered once here, at build time, into a JPEG.
//
// The original fork's image was so dark that the bottom-right red glow read as pure black on an
// OLED (S95B) in a dark room; both glows are lifted here. Tune the colours in the HTML below and
// re-run:
//
//   node scripts/make-bg.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = resolve(import.meta.dirname, '..');
const out = join(root, 'src/img/bg.jpg');

// Base #090b10 everywhere, blue glow top-left, red glow bottom-right. Brighter than the fork's
// original but still ambient: keep peak colours roughly under 40% to stay out of the glow's way.
const html = `<!doctype html><style>
    html, body { margin: 0; background: #090b10; }
    #stage {
        width: 1920px; height: 1080px;
        background:
            radial-gradient(1600px 1050px at -6% -16%, #42598f 0%,
                rgba(9, 11, 16, 0) 62%),
            radial-gradient(1200px 880px at 106% 114%, #9d3346 0%,
                rgba(9, 11, 16, 0) 62%),
            #090b10;
    }
</style><div id="stage"></div>`;

const dir = mkdtempSync(join(tmpdir(), 'arn0-bg-'));
const htmlPath = join(dir, 'bg.html');
const pngPath = join(dir, 'bg.png');
writeFileSync(htmlPath, html);

execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--force-color-profile=srgb',
    '--screenshot=' + pngPath, '--window-size=1920,1080', '--hide-scrollbars',
    'file://' + htmlPath
]);

// Chrome screenshots as PNG; the launcher wants the JPEG (same name/format the stylesheet references).
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', pngPath, '--out', pngPath.replace(/\.png$/, '.jpg')], { stdio: 'inherit' });
copyFileSync(pngPath.replace(/\.png$/, '.jpg'), out);
console.log('Wrote ' + out);

// Copies Verovio's browser build into public/ so index.html can pull it in at
// runtime instead of webpack bundling it.
//
// Why not import it: the npm entry points carry the Emscripten Node branches,
// which import `node:fs` and friends; webpack 5 cannot resolve the `node:`
// scheme and create-react-app gives us nowhere to configure that without
// ejecting. The UMD build in dist/ keeps those requires inside a CommonJS
// branch that a browser never reaches, so loading it with a script tag sizes
// the problem away and keeps 7 MB out of the bundle.
//
// Run from prestart/prebuild so the copy always matches the installed version;
// public/verovio is generated, and git ignores it.

import {copyFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';

// "verovio" resolves to dist/verovio-toolkit-wasm.js, which is the UMD build
const require = createRequire(import.meta.url);
const source = require.resolve('verovio');
const target = join('public', 'verovio', 'verovio-toolkit-wasm.js');

await mkdir(dirname(target), {recursive: true});
await copyFile(source, target);
console.log(`verovio: ${source} -> ${target}`);

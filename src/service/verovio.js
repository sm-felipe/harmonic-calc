// Lazy access to the Verovio engraving toolkit.
//
// Verovio is a 7 MB WebAssembly build, so it must never reach someone who only
// builds chords by hand. It is not imported: webpack cannot resolve the
// `node:` imports in the package's Emscripten entry points, and create-react-
// app leaves nowhere to configure that. Instead scripts/copy-verovio.mjs puts
// the UMD browser build under public/verovio, and the script tag below is
// added the first time a score is opened. The wasm is embedded in that file,
// so there is nothing further to fetch or locate.

const SCRIPT_PATH = 'verovio/verovio-toolkit-wasm.js';
const READY_TIMEOUT_MS = 60000;

let loading = null;

/** Resolves to a ready toolkit. Fetched once, then kept for later scores. */
export function loadVerovio() {
    if (!loading) {
        loading = injectScript().then(whenRuntimeReady).catch((failure) => {
            loading = null;   // let the next attempt retry rather than fail forever
            throw failure;
        });
    }
    return loading;
}

function injectScript() {
    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        // PUBLIC_URL carries the /harmonic-calc prefix the GitHub Pages build lives under
        script.src = `${process.env.PUBLIC_URL || ''}/${SCRIPT_PATH}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load the score engine.'));
        document.head.appendChild(script);
    });
}

// The build signals readiness through Emscripten's onRuntimeInitialized, which
// fires only once: if the wasm finished instantiating before the script's load
// event, a handler attached now would never be called. So the callback races a
// poll that simply tries to build a toolkit, and whichever arrives first wins.
function whenRuntimeReady() {
    return new Promise((resolve, reject) => {
        let settled = false;
        let deadline = Date.now() + READY_TIMEOUT_MS;

        function ready() {
            if (settled) return;
            let toolkit = tryToolkit();
            if (toolkit) {
                settled = true;
                resolve(toolkit);
            }
        }

        if (window.verovio && window.verovio.module) {
            window.verovio.module.onRuntimeInitialized = ready;
        }

        (function poll() {
            if (settled) return;
            ready();
            if (settled) return;
            if (Date.now() > deadline) {
                reject(new Error('The score engine did not start.'));
                return;
            }
            setTimeout(poll, 50);
        })();
    });
}

function tryToolkit() {
    try {
        let toolkit = new window.verovio.toolkit();
        return toolkit.getVersion() ? toolkit : null;
    } catch (notReadyYet) {
        return null;
    }
}

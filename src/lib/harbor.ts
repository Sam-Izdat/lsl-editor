import { Log } from '$lib';
import { cfg } from '$root/webui.config.js';

const handleMessage = (e: Event) => rxSandbox(e);

export const rxListen = () => {
  window.addEventListener('message', handleMessage);
};

export const rxDispose = () => {
  window.removeEventListener('message', handleMessage);
};

// mostly a passthrough module at present -- 
// sandbox events can undergo filtering or validation before being re-emitted

// receive (serialized w/ structuredClone)
export const rxSandbox = (e: Event) => {
  // if (e.origin !== 'parent-origin') return; 

  const tx: string = e.data.tx;
  switch (tx) {
    // SPONT.
    case 'sandbox-context': 
      window.dispatchEvent(new CustomEvent('prog-context-update', {
        detail: {
          contextDefsFloat:       e.data.contextDefsFloat,
          contextDefsInt:         e.data.contextDefsInt,
          contextDefsBool:        e.data.contextDefsBool,
          contextDefsText:        e.data.contextDefsText,
          activeContextVarNames:  e.data.activeContextVarNames,
        },
      }));
      break;
    case 'sandbox-ready':
      Log.debug('Sandbox ready.');
      window.dispatchEvent(new CustomEvent('canvas-ready'));
      break;

    case 'sandbox-fetch':  
      (async () => {
        const { id, url, options } = e.data;
        if (!id || !url) return;

        try {
          const response = await fetch(url, options);
          const contentType = response.headers.get("Content-Type");

          if (contentType === "application/wasm") {
            // Special handling for WASM
            const buffer = await response.arrayBuffer();
            e.source.postMessage({ id, response: buffer, isWasm: true }, "*");
          } else {
            // Handle other responses as text
            const text = await response.text();
            e.source.postMessage({ id, response: text }, "*");
          }
        } catch (error) {
          e.source.postMessage({ id, error: error.message }, "*");
        }
      })();

      break;
    case 'sandbox-build-success':
      Log.debug('Sandbox build successful.');
      window.dispatchEvent(new CustomEvent('build-success'));
      break;
    case 'sandbox-error':
      window.dispatchEvent(new CustomEvent('build-error', {
        detail: {
          name:     e.data.name,
          message:  e.data.err,
          hash:     e.data.hash,
        },
      }));
      Log.scriptError(e.data.err);
      break;
    case 'sandbox-stack-line':
      window.dispatchEvent(new CustomEvent('build-err-stack-line', {
        detail: {
          source: e.data.source,
          lineno: e.data.lineno,
          colno:  e.data.colno,
          hash:   e.data.hash,
        },
      }));
      break;
    case 'sandbox-restart-confirm':
      Log.debug('Sanbox restart confirmed.');
      break;
    // RESP.
    case 'sandbox-build-start':
      Log.debug('Sandbox build started.')
      window.dispatchEvent(new CustomEvent('build-started'));
      break;
    case 'sandbox-render-start':
      Log.debug('Sanbox render started.');
      window.dispatchEvent(new CustomEvent('render-started'));
      break;
    case 'sandbox-render-stop':
      Log.debug('Sanbox render stopped.');
      window.dispatchEvent(new CustomEvent('render-stopped'));
      break;
    case 'sandbox-status-report':
      Log.debug('Sandbox status received. ', e.data.status);
      break;
    case 'sandbox-resize-confirm':
      // Log.debug('Sandbox resize confirmation received.');
      break;
    // I dont think a default warning is necessary. Something will be always spamming messages, for some reason.
    // default:
    //   Log.warning('Unrecognized message: ', e);
  }
};

// transmit
export const txBuild = (sandbox: Window, script: string, width: number = 0, height: number = 0, reset: boolean = false) => {
  sandbox.postMessage({ tx: 'harbor-build', script: script, width: width, height: height, reset: !!reset}, "*");
  window.dispatchEvent(new CustomEvent('build-start', {
    detail: {
      script:   script,
      width:    width,
      height:   height,
    }
  }));
};

export const txStop = (sandbox: Window) => {
  sandbox.postMessage({ tx: 'harbor-stop' }, "*");
};

export const txStart = (sandbox: Window) => {
  sandbox.postMessage({ tx: 'harbor-start' }, "*");
};

export const txReset = (sandbox: Window) => {
  sandbox.postMessage({ tx: 'harbor-reset'}, "*");
};

export const txReadyAck = (sandbox: Window) => {
  sandbox.postMessage({ tx: 'harbor-ready-ack', txContextFreq: cfg.TX_CONTEXT_FREQ }, "*");
};

export const txStatus = (sandbox: Window) => {
  sandbox.postMessage({ tx: 'harbor-status' }, "*");
};

export const txResize = (sandbox: Window, width:number, height:number ) => {
  sandbox.postMessage({ tx: 'harbor-resize', width: width, height: height }, "*");
};

export const txContextValue = (sandbox: Window, name: string, value: any ) => {
  sandbox.postMessage({ tx: 'harbor-context-value', name: name, value: value }, "*");
};

export const txContextReset = (sandbox: Window ) => {
  sandbox.postMessage({ tx: 'harbor-context-reset' }, "*");
};
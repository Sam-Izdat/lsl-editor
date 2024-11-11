<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { cfg } from '$root/webui.config.js';


  onMount(async () => {



    window.lslcore.__running = false;       // whether animation is running
    window.lslcore.__script = '';           // script contents
    window.lslcore.__scriptLen = 0;         // length of script (for scope)
    window.lslcore.__stackTrace = [];       // persists from build-start to build-start
    window.VIEWPORT_WIDTH = 800;    // width of parent UI viewport (max canvas width)
    window.VIEWPORT_HEIGHT = 600;   // height of parent UI viewport (max canvas height)


    console.error = (...e) => console.log(...e); 

    // extract pertinent info from stack trace (chromium & FF)
    window.lslcore.__parseLine = (line) => {
      const match = line.match(/(?:<anonymous>|eval):(\d+):(\d+)/);
      if (match) {
        const [_, lineno, colno] = match;
        if (lineno > (window.lslcore.__scriptLen + 1)) return null; // out of range
        const sourceMatch = line.match(/(.+?(?=@))|(?:at\s+)(\w+)/);
        let source = sourceMatch !== null ? sourceMatch[1] || sourceMatch[2] : '';
        if (source == 'eval' || source == '') source = 'root';
        return [source, lineno - 1, colno];
      }
      return null;
    };

    window.lslcore.__processStackLines = (stackLines, err_hash) => {
      stackLines.forEach(line => {
        let step = window.lslcore.__parseLine(line);
        if (step) {
          window.lslcore.__stackTrace.push(step);
          window.txStackLine(step[0], parseInt(step[1]), parseInt(step[2]), err_hash);
        }
      });
    };

    window.lslcore.__generateErrorHash = (errorMessage, stack) => {
      let str = errorMessage + JSON.stringify(stack);
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
      }
      return hash >>> 0;
    };

    // herein we try to keep the errors piped to the editor and prevent them from bubbling up
    window.onerror = (message, source, lineno, colno, error) => {
      const err = `Unhandled error caught by window.onerror: ${message} @ ${source}, Line: ${lineno}, Column: ${colno}`;
      const err_hash = window.lslcore.__generateErrorHash(message, error.stack ?? {});
      window.txError(error.name ?? 'error', message, err_hash);
      console.log(err);
      return true; // (try to) prevent error from propagating to the console
    };
    window.addEventListener('error', e => {
        if (e.error && e.error.stack) {
          const stackLines = e.error.stack.split("\n");
          
          stackLines.forEach(line => {
            let step = window.lslcore.__parseLine(line);
            if (step) window.lslcore.__stackTrace.push(step);
            window.txStackLine(step[0], step[1], step[2]);
          });
        }
        const { message, source, lineno, colno, error } = e;
        const err = `Unhandled error caught by event listener: message: ${message} @ ${source}, Line: ${lineno}, Column: ${colno}`;
        console.log(err);
        window.txError(error.name ?? 'error', message);
        console.log(err);
        e.preventDefault();
    });
    window.onunhandledrejection = (e) => {
      const err = 'caught in onunhandledrejection: ' + e.reason || 'unknown async error';
      console.error(e.reason.stack);
      const err_hash = window.lslcore.__generateErrorHash(e.reason, {});
      console.log(err);
      // Should be caught, but just to be thorough...
      if (e.reason?.name === 'LegitSLError' && e.reason?.info?.line) {
        // window.txErrorFrag(e.info.code, err_hash);
        window.txError(e.reason?.name, e.reason?.message, err_hash);
        window.txStackLine(e.reason?.name || 'error', parseInt(e.reason?.info?.line), parseInt(e.reason?.info?.column), err_hash);
      } else {
        window.txError('PromiseRejection', e.reason, err_hash);
        if (e.reason && e.reason.stack) {
          const stackLines = e.reason.stack.split("\n");
          window.lslcore.__processStackLines(stackLines, err_hash);
        }
      }
      e.preventDefault();
      return true; // (try to) prevent error from propagating to the console
    };



    window.addEventListener('message', (e) => rxHarbor(e));

    // receive (serialized w/ structuredClone)
    window.rxHarbor = async (e) => {
      // if (e.origin !== 'parent-origin') return; 

      const tx = e.data.tx;
      switch (tx) {
        case 'harbor-build':
          window.lslcore.__script = e.data.script;
          window.lslcore.__stackTrace = [];
          window.lslcore.__running = true;
          window.parent.postMessage({ tx: 'sandbox-build-start' }, e.origin);
          await window.digest(window.lslcore.__script); // fire-and-forget w/o await, msg below confirms init, not success
          break;
        case 'harbor-stop':
          window.lslcore.__running = false;
          window.lslcore.cancelLoop();
          window.parent.postMessage({ tx: 'sandbox-render-stop' }, e.origin);
          break;
        case 'harbor-start':
          window.lslcore.__running = true;
          window.lslcore.executeLoop();
          if (e.data.width && e.data.height){
            // We intentionally don't resize the canvas, and leave that up to the user script:
            // let elCanvas = document.querySelector('#result_canvas');     
            // elCanvas.width = parseInt(e.data.width);
            // elCanvas.height = parseInt(e.data.height);
            window.VIEWPORT_WIDTH = parseInt(e.data.width);
            window.VIEWPORT_HEIGHT = parseInt(e.data.height);
          }
          window.lslcore.executeLoop();
          window.parent.postMessage({ tx: 'sandbox-render-start' }, e.origin);
          break;
        case 'harbor-reset':
          window.lslcore.cancelLoop();       
          await window.lslcore.init();
          await window.digest(window.lslcore.__script);
          if (window.lslcore.__running) {
            window.lslcore.executeLoop();
          }
          break;
        case 'harbor-status':          
          window.parent.postMessage({ tx: 'sandbox-status-report', 
            status: {
              running: window.lslcore.__running,
              stackTrace: window.lslcore.__stackTrace
            }
          }, e.origin);
          break;
        case 'harbor-resize':
          // We intentionally don't resize the canvas, and leave that up to the user script:
          // let elCanvas = document.querySelector('#result_canvas');
          // elCanvas.width = parseInt(e.data.width);
          // elCanvas.height = parseInt(e.data.height);
          window.VIEWPORT_WIDTH = parseInt(e.data.height);
          window.VIEWPORT_HEIGHT = parseInt(e.data.width);
          window.parent.postMessage({ tx: 'sandbox-resize-confirm'}, e.origin);
          break;
        default:
          console.warn('Unknown command');
      }
    };

    // transmit
    window.txReady = () => {
      window.parent.postMessage({ tx: 'sandbox-ready'}, "*");
    };

    window.txBuildSuccess = () => {
      window.parent.postMessage({ tx: 'sandbox-build-success' }, "*");
    };

    window.txError = (name, err, err_hash) => {
      window.parent.postMessage({ tx: 'sandbox-error', name: name, err: err, hash: err_hash }, "*");
    };

    window.txStackLine = (source, lineno, colno, err_hash) => {
      window.parent.postMessage({ tx: 'sandbox-stack-line', source: source, lineno: lineno, colno: colno, hash: err_hash }, "*");
    };

    window.digest = async (script) => {
      window.lslcore.__scriptLen = script.split(/\r\n|\r|\n/).length; // lines
      window.lslcore.__stackTrace = [];
      try { 
        await window.lslcore.update(script);
        window.txBuildSuccess();
      } catch (e) {
        const err_hash = window.lslcore.__generateErrorHash(e.message, e.stack ?? {});
        if (e.name === 'LegitSLError' && e.info?.line) {
          // window.txErrorFrag(e.info.code, err_hash);
          window.txError(e.name, e.message, err_hash);
          window.txStackLine(e.name || 'error', parseInt(e.info?.line), parseInt(e.info?.column), err_hash);
        } else {
          throw(e);
        }
      }
    };

    window.lslcore.configure("#output-container canvas", "#controls-container");
    await window.lslcore.init(); 
    window.txReady();

    let elCanvas = document.querySelector('#output')
    elCanvas.width = window.VIEWPORT_WIDTH;
    elCanvas.height = window.VIEWPORT_HEIGHT;










  });
</script>
<style>
@import '$lib/styles/canvasframe.css';
</style>
<svelte:head>
  <script type="module" src="./legitsl/LegitScriptWasm.js"></script>
</svelte:head>
<div id="app">
  <div id="output-and-controls">
    <div id="output-container">
      <canvas id="output" width="400" height="400"></canvas>
    </div>
    <div id="controls-container" style="display: none;"></div>
  </div>
</div>
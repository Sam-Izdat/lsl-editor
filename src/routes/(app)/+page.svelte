<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import type { ComponentType } from 'svelte';
  import { writable } from 'svelte/store';
  import { propertyStore } from 'svelte-writable-derived'; 
  import { beforeNavigate, replaceState } from "$app/navigation";
  import { browser } from '$app/environment';
  import { base } from '$app/paths';  
  import Device from 'svelte-device-info';
  import { pulseEditorBackground } from '$lib';
  import type { editor } from 'monaco-editor';

  import { cfg } from '$root/webui.config.js';
  import { Log } from '$lib';
  import * as ds from '$lib/stores/doc_session';
  import * as km from '$lib/keymap';

  import * as harbor from '$lib/harbor';
  let parentIsReady = false;

  let isPWA: boolean = false;

  import { 
    // Global state
    currentView,
    paneSizes,
    isAutoBuild,
    isFullscreen,
    orientationLandscape,
    isReadOnly,
    isDark,
    canvasIsReady,
    editorIsReady,
    isPlaying,
    // Context & errors
    debugStore, 
    resetContext,
    contextListen,
  } from '$lib/stores';

  // Sessions
  let dsCurrentSession;
  const unsubscribeDocSession = ds.documentSession.subscribe(session => {
    dsCurrentSession = session;
  });

  // Handlers
  import { 
    DocHandler, 
    NavHandler,
    ScreenHandler,
    MobileHandler
  } from '$lib';

  // Util
  import { encodeUUIDToURI, decodeURIToUUID } from '$lib';

  let docHandler;     // Document actions (e.g. update, save, new, rename, make read-only)
  let navHandler;     // SPA "navigation"
  let screenHandler;  // Fullscreen
  let mobileHandler;  // Mobile-specific UI handling

  // I/O observers  
  import { observeKeyboard } from '$lib/keybind';
  let resizeObserver;
  let viewportEl;

  // Core components
  import { 
    MonacoEditor, 
    AnchorLightSwitch, 
    AnchorScriptStatus, 
    DocTitleBadge, 
    DocMenuBadge,
    ControlsAccordion,
  }  from '$lib/components';
  import * as panes from '$lib/panes';

  // Modals, Drawers, Throbber  
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import { getModalStore, getDrawerStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const drawerStore = getDrawerStore();
  import * as modals from '$lib/modals';

  import { drawerContentStore } from '$lib/stores/drawer';
  import DrawerArchive from '$lib/components/drawer_archive.svelte';
  import { get } from 'svelte/store';
  const drawerSettings: DrawerSettings = {
    id: 'archive-drawer',
    width: 'w-[340px] md:w-[720px]',
    padding: 'p-0',
    position: 'right',
  };

  let monacoEditor: editor.IStandaloneCodeEditor;

  // Unsaved changes guardrails
  beforeNavigate(({ cancel }) => {
    if (dsCurrentSession.unsavedChanges) {
      if (!confirm('You are about to navigate away, but you have unsaved changes. Proceed?')) {
        cancel();
      }
    }
  });

  // Waiting for Godot
  const waitForEditorInstance = () => {
    return new Promise((resolve) => {
      setEditorInstance = (instance) => {
        monacoEditor = instance.detail;
        resolve(monacoEditor);
      };
    });
  };

  let setEditorInstance;

  const waitForEvent = async (eventType) => {
    return new Promise((resolve) => {
      window.addEventListener(eventType, resolve, { once: true });
    });
  };

  const waitForCanvas = () => {
    if (!$canvasIsReady){;
      return new Promise((resolve) => {
          const unsubscribe = canvasIsReady.subscribe((val) => {
              if (val === true) {
                  unsubscribe();
                  resolve();
              }
          });
      });
    }
    return true;
  };

  const setURLFragment = (url) => {    
    if (!isPWA) window.history.replaceState(null, '', `${base}${url}`);
  }

  const setSessionURL = () => {
    setURLFragment(`/?private=${encodeUUIDToURI(get(ds.documentSession).docID)}`);
  };

  // Global status changing stuff
  const canvasReady = () => {
    let canvasframe = document.querySelector("#canvasframe");
    let canvasframeWindow = canvasframe.contentWindow;
    Log.debug('Canvas ready');
    $canvasIsReady = true;
    harbor.txReadyAck(canvasframeWindow);
  };

  const buildSuccess = (e) => {
    Log.scriptSuccess("build completed");
    const flashCol = $isDark ? cfg.BUILD_COL_SUCCESS[0] : cfg.BUILD_COL_SUCCESS[1];
    pulseEditorBackground(flashCol, cfg.BUILD_FLASH_DUR);
    dsCurrentSession.screenshot = e.detail.sh ?? '';
    setTimeout(() => { 
      $contextListen = true;  
    }, 50); // slight delay to make sure it's new context
  };

  const buildError = () => {
    const flashCol = $isDark ? cfg.BUILD_COL_FAILURE[0] : cfg.BUILD_COL_FAILURE[1];
    pulseEditorBackground(flashCol, cfg.BUILD_FLASH_DUR);
  };

  const toggleAutoBuild = () => { 
    isAutoBuild.set(!$isAutoBuild); 
    Log.toastInfo($isAutoBuild ? 'auto-build on' :  'auto-build off');
  };

  // UI actions   
  const reqOpenArchiveDrawer = async () => {
    if (!$drawerStore.open){
      await docHandler.refreshDocList();
      drawerContentStore.set({
        id: 'archive',
        component: DrawerArchive,
        props: {
          deleteDocCallback: reqDeleteDoc,
          loadDocCallback: reqLoadDoc,
          saveDocCallback: reqSaveDoc,
          saveDocNewVersionCallback: reqSaveDocNewVersion,
        },
      });
      drawerStore.open(drawerSettings);
    } else {
      drawerStore.close();
    }
  };

  const reqResetPanes = () => {
    $currentView = 0;
    paneSizes.set({...panes.resetPaneSizes()});
  };

  let autoBuildTimeoutID: number;

  const reqBuild = async (reset: boolean = false) => {
    reset = typeof reset === 'boolean' ? reset : false;
    Log.debug('Build requested');
    Log.clearScriptLog();
    debugStore.clear();
    let editorVal = monacoEditor.getValue();

    await waitForCanvas();
    let canvasframe = document.querySelector("#canvasframe");
    let canvasframeWindow = canvasframe.contentWindow;

    // we don't want to separately message and wait for a resize request
    const el = document.querySelector('#ct2');
    const {width, height} = el.getBoundingClientRect();
    canvasframe.width = width;
    canvasframe.height = height;

    harbor.txBuild(canvasframeWindow, editorVal, width, height, reset);
  };

  const reqStopAnimation = async () => {
    if (!$isPlaying) return;
    $isPlaying = false;
    await waitForCanvas();
    let canvasframe = document.querySelector("#canvasframe");
    let canvasframeWindow = canvasframe.contentWindow;
    harbor.txStop(canvasframeWindow);
    await waitForEvent('render-stopped');
  };

  const reqStartAnimation = async () => {
    if ($isPlaying) return;
    $isPlaying = true;
    await waitForCanvas();
    let canvasframe = document.querySelector("#canvasframe");
    let canvasframeWindow = canvasframe.contentWindow;
    harbor.txStart(canvasframeWindow);
    await waitForEvent('render-started');
  };

  const reqPlayPause = async () => {
    if ($isPlaying) {
      reqStopAnimation();
    } else {
      reqStartAnimation();
    }
  };

  const reqResetProg = async () => {
    Log.clearScriptLog();
    debugStore.clear();
    await waitForCanvas();
    let canvasframe = document.querySelector("#canvasframe");
    let canvasframeWindow = canvasframe.contentWindow;
    harbor.txReset(canvasframeWindow);
  };

  const handleLayoutChange = async () => {
    await waitForCanvas();
    await reqBuild();
    // iframe gets reloaded and script cache lost --
    // presumably there's some security logic here.
    if ($isPlaying) {
      await reqStopAnimation();      
      await reqStartAnimation();
    }
  };

  const reqClearStopAnimation = async () => {
    Log.clearScriptLog();
    debugStore.clear();
    await reqStopAnimation();
  };
  
  const reqResize = (reqWidth = null, reqHeight = null) => {
    let width = 0;
    let height = 0;
    if (reqWidth === null || reqHeight === null) {
      const el = document.querySelector('#ct2');
      const rectEl = el.getBoundingClientRect();
      width = rectEl.width;
      height = rectEl.height;
      Log.debug(`Resizing to ${width}x${height} of `, el);
    } else {
      width = reqWidth;
      height = reqHeight;
    }    
    let canvasframe = document.querySelector("#canvasframe");
    let canvasframeWindow = canvasframe.contentWindow;
    canvasframe.width = width;
    canvasframe.height = height;
    harbor.txResize(canvasframeWindow, width, height);
  };

  const reqNewDoc = async () => {
    if (dsCurrentSession.unsavedChanges){
      modalStore.trigger({
        ...modals.modalConfirm, 
        message: "Unsaved changes will be discarded. Create a new script anyway?",
        txtConfirm: "New Script",
        onConfirm: async () => {
          $currentView = 0;
          $contextListen = false;
          resetContext();
          docHandler.newDoc();
          setURLFragment('/');
          await reqBuild(true);
        }
      });
    } else {      
      $currentView = 0;
      $contextListen = false;
      resetContext();
      docHandler.newDoc();
      setURLFragment('/');
      await reqBuild(true);
    }
  };

  const reqLoadDoc = async (uuid: string, adapter: string) => {
    Log.clearScriptLog();
    debugStore.clear();
    if (dsCurrentSession.unsavedChanges){
      modalStore.trigger({
        ...modals.modalConfirm, 
        message: "Unsaved changes will be discarded. Load a new script anyway?",
        txtConfirm: "Load Script",
        onConfirm: async () => {
          $currentView = 0;
          $contextListen = false;
          resetContext();
          await docHandler.loadDoc(uuid, adapter); 
          drawerStore.close();
          setSessionURL();
          setTimeout(async () => { 
            await reqBuild(true);
          }, 350); // wait for pane animation to complete
        },
      });
    } else {
      $currentView = 0;
      $contextListen = false;
      resetContext();
      await docHandler.loadDoc(uuid, adapter); 
      drawerStore.close();
      setSessionURL();
      setTimeout(async () => { 
        await reqBuild(true); 
      }, 350); // wait for pane animation to complete
    }
  };

  const reqForkDoc = async () => {
    if (dsCurrentSession.unsavedChanges){
      modalStore.trigger({
        ...modals.modalConfirm, 
        message: "Unsaved changes will be discarded. Fork script anyway?",
        txtConfirm: "Fork Script",
        onConfirm: async () => {
          $currentView = 0;
          resetContext();
          docHandler.forkDoc();
          setSessionURL();
          reqRenameDoc();
          await reqResetProg();
        },
      });
    } else {      
      $currentView = 0;      
      resetContext();
      docHandler.forkDoc();
      setSessionURL();
      reqRenameDoc();
      await reqResetProg();
    }
  };

  const reqImportFile = async (content: string, baseFilename?: string) => {
    if (dsCurrentSession.unsavedChanges){
      modalStore.trigger({
        ...modals.modalConfirm, 
        message: "Unsaved changes will be discarded. Import file anyway?",
        txtConfirm: "Import File",
        onConfirm: () => {
          $currentView = 0;
          $contextListen = false;
          resetContext();
          docHandler.newDoc(content, baseFilename ?? ''); 
          setSessionURL();
        },
      });
    } else {
      $currentView = 0;
      $contextListen = false;  
      resetContext();
      docHandler.newDoc(content, baseFilename ?? '');
      setSessionURL();
    }
    modalStore.close();
    reqRenameDoc(baseFilename ?? '');
    await reqBuild(true);    
  };

  const reqExportFile = () => {
    let content:string = docHandler.getCurrentEditorContent();
    let filename = dsCurrentSession.docName;
    const blob = new Blob([content], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename.trim().replace(/[\/:*?"<>|]/g, "")+cfg.PWA_FILE_EXT;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const reqSaveDoc = async () => {
    if (dsCurrentSession.unsavedChanges) {
      if (dsCurrentSession.versionActive != dsCurrentSession.versionCount - 1) {
        modalStore.trigger({
          ...modals.modalConfirm, 
          message: `You are saving over an old version. Overwrite it?`,
          txtConfirm: `Overwrite v${dsCurrentSession.versionActive}`,
          txtCancel: `Save as v${dsCurrentSession.versionCount}`,
          onConfirm: async () => { 
            await docHandler.saveDoc();
            setSessionURL();
          },
          onCancel: reqSaveDocNewVersion,
        });
      } else { 
        await docHandler.saveDoc(); 
        await docHandler.refreshDocList(); 
        setSessionURL();
      }
    } else { Log.toastInfo('no changes to save') }
    await reqBuild();
  };

  const reqSaveDocNewVersion = async () => {
    if (dsCurrentSession.unsavedChanges) {
      await docHandler.saveDocNewVersion();
      docHandler.loadLastVersion();
      docHandler.refreshDocList();
    } else { Log.toastInfo('no changes to save') }
    await reqBuild();
  };

  const reqDeleteDoc = async (uuid: string, adapter: string) => {
    modalStore.trigger({
      ...modals.modalConfirm, 
      message: "Delete script?",
      txtConfirm: "Delete",
      onConfirm: async () => { 
        await docHandler.deleteDoc(uuid, adapter);
        await docHandler.refreshDocList();
      },
    });
  };

  const reqSwitchDocVersion = async (v) => {
    if (dsCurrentSession.unsavedChanges){
      modalStore.trigger({
        ...modals.modalConfirm, 
        message: "Unsaved changes will be discarded. Load version anyway?",
        txtConfirm: `Switch to v${v}`,
        onConfirm: () => { docHandler.loadVersion(parseInt(v)); },
      });
    } else {
      docHandler.loadVersion(parseInt(v));
    }
    Log.clearScriptLog();
    debugStore.clear();
  };

  const reqRevertDoc = async () => {
    if (dsCurrentSession.unsavedChanges){
      modalStore.trigger({
        ...modals.modalConfirm, 
        message: "Revert to last saved changes?",
        txtConfirm: `Revert`,
        onConfirm: () => { docHandler.loadVersion(parseInt(dsCurrentSession.versionActive)); },
      });
    } else {
      Log.toastInfo('no changes to revert')
    }
    Log.clearScriptLog();
    debugStore.clear();
  }

  const reqRenameDoc = async (name?: string) => {
    modalStore.trigger({
      ...modals.modalInput, 
      message: 'What shall we call this?',
      placeholder: 'Script Name',
      inputValue: typeof name === 'string' ? name : dsCurrentSession.docName,
      txtConfirm: 'Rename',
      onConfirm: (inputVal) => { docHandler.renameDoc(inputVal); }
    })
    Log.clearScriptLog();
    debugStore.clear();
  };

  const reqSaveMenu = async () => {
    modalStore.trigger({
      ...modals.modalSave, 
      session: dsCurrentSession,
      localSaveDocCallback: reqSaveDoc,
      localSaveDocNewVersionCallback: reqSaveDocNewVersion,
    })
  };

  const handleMediaChange = (e) => {
    isPWA = e.matches;
  };

  // When browser stuff is available
  onMount(async () => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    isPWA = mediaQuery.matches;
    mediaQuery.addEventListener('change', handleMediaChange);

    if (typeof ResizeObserver === 'undefined') {
      const { ResizeObserver } = await import('resize-observer-polyfill');
    }
    if (browser) {
      document.querySelector('body').setAttribute('data-theme', cfg.APP_THEME);

      panes.returnContentToSplit();

      await waitForEditorInstance(); 
      $editorIsReady = true;
      
      // Listen for changes in Monaco editor and update the store
      monacoEditor.onDidChangeModelContent(() => {
        const content = monacoEditor.getValue();
        docHandler.updateDoc(content);
        if ($isAutoBuild) {
          clearTimeout(autoBuildTimeoutID);   
          autoBuildTimeoutID = setTimeout(reqBuild, cfg.AUTOBUILD_DELAY);
        }
      });

      harbor.rxListen();

      // Custom events
      window.addEventListener('canvas-ready', canvasReady);
      window.addEventListener('build-success', buildSuccess);
      window.addEventListener('build-error', buildError);
      parentIsReady = true;

      // Set up handlers
      docHandler    = new DocHandler(dsCurrentSession, monacoEditor);
      navHandler    = new NavHandler({layoutChangeCallback: handleLayoutChange});
      screenHandler = new ScreenHandler(window);
      mobileHandler = new MobileHandler(window, {layoutChangeCallback: handleLayoutChange});

      // Keybind
      observeKeyboard();
      window.addEventListener('key-switch-view', navHandler.switchViewEvent);
      window.addEventListener('key-save-document', reqSaveDoc);
      window.addEventListener('key-save-document-new-version', reqSaveDocNewVersion);
      window.addEventListener('key-new-document', reqNewDoc);
      window.addEventListener('key-rename-document', reqRenameDoc);
      window.addEventListener('key-archive-shelf', reqOpenArchiveDrawer);
      window.addEventListener('key-build-script', reqBuild);
      window.addEventListener('key-play-pause', reqPlayPause);
      window.addEventListener('key-reset-prog', reqResetProg);

      // Observe viewport resize
      resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          reqResize(width, height);
        }
      });
      viewportEl = document.querySelector('#ct2');
      resizeObserver.observe(viewportEl);


      // Check if an uploaded file exists in sessionStorage
      const fileData = sessionStorage.getItem('importRequestFile'); 
      sessionStorage.removeItem('importRequestFile');

      let contentToLoad; 
      if (fileData) {
        const file = JSON.parse(fileData);
        contentToLoad = file[0].content || null; 
      }

      docHandler.newDoc(contentToLoad);

      const urlParams = new URLSearchParams(window.location.search);
      let docLoaded = false;
      if (urlParams.get('private')) {
        const urlDocUUID = decodeURIToUUID(urlParams.get('private'));
        try {
          console.warn('LOADING ', urlDocUUID, 'idb');
          await reqLoadDoc(urlDocUUID, 'idb');
          docLoaded = true;
        } catch (e) {
          try {
            console.warn('LOADING ', urlDocUUID, 'ls');
            await reqLoadDoc(urlDocUUID, 'ls');
            docLoaded = true;
          } catch (e) {
            Log.toastError('failed to load script');
            Log.error(e);
          }
        }
      }

      if (!docLoaded) {
        setURLFragment('/');
      }

      // Listen for orientation changes and do initial check
      window.screen.orientation.onchange = () => {
        // Don't shorten to just arrow - this has to be in curlies... for some reason.
        mobileHandler.orientationChange();
      };

      if (Device.isMobile){
        if (cfg.MOBILE_READONLY) docHandler.disableEditing();
      }
      mobileHandler.orientationChange();

      await reqBuild();
      await reqStartAnimation();
      monacoEditor.focus();

      const importRequestAutoBuild = sessionStorage.getItem('importRequestAutoBuild');
      if (importRequestAutoBuild !== null) {
        isAutoBuild.set(!!+importRequestAutoBuild)
        sessionStorage.removeItem('importRequestAutoBuild');
      }
      const importRequestView = sessionStorage.getItem('importRequestView');
      if (importRequestView !== null && +importRequestView <= 3 && +importRequestView >= 0) {
        $currentView = parseInt(importRequestView);
        await tick(); 
        sessionStorage.removeItem('importRequestView');
      }
      const importRequestReadOnly = sessionStorage.getItem('importRequestReadOnly');
      if (importRequestReadOnly !== null) {
        !!+importRequestReadOnly ? docHandler.disableEditing() : docHandler.enableEditing();
        sessionStorage.removeItem('importRequestReadOnly');
      }
      const importShareableURL = sessionStorage.getItem('importShareableURL');
      if (importShareableURL !== null) {
        window.history.replaceState(null, '', importShareableURL);
        sessionStorage.removeItem('importShareableURL');
      }
    }
  });

  // Not actually necessary in present state, but just to be thorough.
  onDestroy(() => {
    if (browser) {
      harbor.rxDispose();

      window.removeEventListener('key-switch-view', navHandler.switchViewEvent);
      window.removeEventListener('key-save-document', reqSaveDoc);
      window.removeEventListener('key-save-document-new-version', reqSaveDocNewVersion);
      window.removeEventListener('key-new-document', reqNewDoc);
      window.removeEventListener('key-rename-document', reqRenameDoc);
      window.removeEventListener('key-archive-shelf', reqOpenArchiveDrawer);
      window.removeEventListener('key-build-script', reqBuild);
      window.removeEventListener('key-play-pause', reqPlayPause);
      window.removeEventListener('key-reset-prog', reqResetProg);
      // window.removeEventListener('key-stop-playback', reqClearStopAnimation);

      window.removeEventListener('canvas-ready', canvasReady);
      window.removeEventListener('build-success', buildSuccess);
      window.removeEventListener('build-error', buildError);

      monacoEditor?.dispose();
      docHandler?.dispose();
      navHandler?.dispose();
      screenHandler?.dispose();
      mobileHandler?.dispose();

      resizeObserver.unobserve(viewportEl);
      resizeObserver.disconnect();
    }
    unsubscribeDocSession();
  });

  import { AppRail, AppRailTile, AppRailAnchor } from '@skeletonlabs/skeleton';

  import { Pane, Splitpanes } from 'svelte-splitpanes';

  // Icons
  import { Icon } from 'svelte-hero-icons';
  import * as hero from 'svelte-hero-icons';
  import { CustomIcon } from '$lib/components/icons';
  import * as ico from '$lib/components/icons';
</script>

<svelte:head>
  <title>{
    isPWA 
      ? (dsCurrentSession.docName ? `${dsCurrentSession.docName}` : '')
      : (dsCurrentSession.docName ? `${dsCurrentSession.docName} - ${cfg.APP_TITLE}` : cfg.APP_TITLE)
    }</title>
</svelte:head>
<div class="card bg-surface-50-900-token rounded-none h-[100%] grid grid-cols-[auto_1fr] w-full">
  <AppRail class="w-8">
    <AppRailTile 
      title="Split-Pane"
      bind:group={$currentView} 
      name="tile-0" 
      value={0}>
      <svelte:fragment slot="lead">
        <Icon src="{hero.RectangleGroup}" size="16" style="margin: 4px auto;" solid/>
      </svelte:fragment>
    </AppRailTile>
    <AppRailTile 
      title="View Code"
      bind:group={$currentView} 
      name="tile-1" 
      value={1}>
      <svelte:fragment slot="lead">
        <Icon src="{hero.CodeBracket}" size="16" style="margin: 4px auto;" solid/>
      </svelte:fragment>
    </AppRailTile>
    <AppRailTile 
      title="View Canvas"
      bind:group={$currentView} 
      name="tile-2" 
      value={2}>
      <svelte:fragment slot="lead">
        <Icon src="{hero.Photo}" size="16" style="margin: 4px auto;" solid/>
      </svelte:fragment>
    </AppRailTile>
    <AppRailTile 
      title="View Controls" 
      bind:group={$currentView} 
      name="tile-3" 
      value={3}>
      <svelte:fragment slot="lead">
        <Icon src="{hero.AdjustmentsHorizontal}" size="16" style="margin: 4px auto;" solid/>
      </svelte:fragment>
    </AppRailTile>
    <AnchorScriptStatus 
      buildCallback={reqBuild} 
      startCallback={reqStartAnimation} 
      stopCallback={reqStopAnimation} 
      resetCallback={reqResetProg}
    />
    <hr classs="hr m-1"/>
    <AppRailAnchor 
      href="#" 
      title="Toggle Auto-Build" 
      on:click={toggleAutoBuild} 
      class={$isAutoBuild ? 'bg-tertiary-500' : ''} 
      style="display:block;">
      <CustomIcon src={ico.ClockCycle} size='16' class="inline-block" />
    </AppRailAnchor>
    <AppRailAnchor 
      href="#" 
      title="Toggle Read-Only" 
      on:click={docHandler.toggleEditing} 
      class={$isReadOnly ? 'bg-tertiary-500' : ''} 
      style="display:block;">
      <Icon src="{$isReadOnly ? hero.LockClosed : hero.LockOpen}" size="16" style="margin: 4px auto;" solid/>
    </AppRailAnchor>
    <AppRailAnchor 
      href="#" 
      title="Toggle Fullscreen" 
      on:click={screenHandler.toggleFullscreen} 
      class={$isFullscreen ? 'bg-tertiary-500' : ''} 
      style="display:block;">
      <Icon src="{hero.ArrowsPointingOut}" size="16" style="margin: 4px auto;" solid/>
    </AppRailAnchor>
    <svelte:fragment slot="trail">
      <AppRailAnchor 
        href="#" 
        title="New Script (Alt+{km.keyNewDoc})" 
        on:click={reqNewDoc}
        style="display:block;">
        <Icon src="{hero.Document}" size="16" style="margin: 4px auto;" solid/>
      </AppRailAnchor>
      <AppRailAnchor 
        href="#" 
        title="Archive (Alt+{km.keyArchive})" 
        on:click={reqOpenArchiveDrawer}
        style="display:block;">
        <Icon src="{hero.Folder}" size="16" style="margin: 4px auto;" solid/>
      </AppRailAnchor>
      <AppRailAnchor 
        href="#" 
        title="Import / Export" 
        on:click={() => modalStore.trigger({
          ...modals.modalImportExport, 
          importFileCallback: reqImportFile,
          exportFileCallback: reqExportFile,
        })}
        style="display:block;">
        <Icon src="{hero.ArrowsUpDown}" size="16" style="margin: 4px auto;" solid/>
      </AppRailAnchor>
      <AnchorLightSwitch />
      <AppRailAnchor 
        href="#" 
        title="About" 
        on:click={() => modalStore.trigger(modals.modalAbout)}
        style="display:block;">
        <Icon src="{hero.QuestionMarkCircle}" size="16" style="margin: 4px auto;" solid/>
      </AppRailAnchor>
    </svelte:fragment>
  </AppRail>
  <div id="cr-panes" class="grid cr-dynamic">
    {#if $orientationLandscape}
    <Splitpanes theme="skeleton-theme" style="width: 100%; height: 100%;">
      <Pane minSize={0} bind:size={$paneSizes.sizeLandscapePaneLeft}>
        <div id="cr-pane1">
        </div>
      </Pane>
      <Pane minSize={0} bind:size={$paneSizes.sizeLandscapePaneRight}>
        <Splitpanes horizontal={true}>
          <Pane minSize={0} bind:size={$paneSizes.sizeLandscapePaneTopRight}>
            <div id="cr-pane2">
            </div>
          </Pane>
          <Pane bind:size={$paneSizes.sizeLandscapePaneBottomRight}>
            <div id="cr-pane3">
            </div>
          </Pane>
        </Splitpanes>
      </Pane>
    </Splitpanes>
    {:else}
    <Splitpanes theme="skeleton-theme" style="width: 100%; height: 100%;" horizontal={true}>
      <Pane minSize={0} bind:size={$paneSizes.sizePortraitPaneTop}>
        <div id="cr-pane1" />
      </Pane>
      <Pane minSize={0} bind:size={$paneSizes.sizePortraitPaneMid}>
        <div id="cr-pane2" />
      </Pane>
      <Pane minSize={0} bind:size={$paneSizes.sizePortraitPaneBot}>
        <div id="cr-pane3" />
      </Pane>
    </Splitpanes>
    {/if}
  </div>
  <div id="cr-full" class="cr-dynamic hidden" />
  <div id="cr-staging" class="hidden">

    <div id="ct1">
      <MonacoEditor editorInstance={monacoEditor} on:init={setEditorInstance} />
    </div>

    <div id="ct2">
      <div class="h-full w-full flex justify-center items-center {$canvasIsReady ? 'hidden' : ''}">
        <ProgressRadial value={undefined} />
      </div>
      {#if parentIsReady}
      <iframe 
        id="canvasframe" 
        width="800" 
        height="800" 
        src="./canvasframe.html" 
        scrolling="no" 
        classs="{$canvasIsReady ? '' : 'hidden'}"
        title="canvasframe" /> 
      {/if}
    </div>

    <div id="ct3" class="divide-y divide-surface-400/10 !overflow-y-auto">
      <div class="overflow-x-auto flex p-1">
        <button 
          title="Save (Alt+{km.keySaveDoc} / Ctrl+{km.keySaveDoc})" 
          class="badge m-1 {dsCurrentSession.unsavedChanges ? 'variant-ghost-primary' : 'variant-soft-primary'}" 
          on:click={reqSaveDoc}
        >
          <Icon src="{hero.ArrowDownOnSquare}" size="16" class="mx-0 my-1" solid/>
          <span class="hidden lg:inline ml-2">Save</span>
        </button> 
        <button 
          title="Save v{dsCurrentSession.versionCount} (Alt+{km.keySaveDocNewVersion})"
          class="badge m-1 {dsCurrentSession.unsavedChanges ? 'variant-ghost-primary' : 'variant-soft-primary'}"
          on:click={reqSaveDocNewVersion}
        >
          <Icon src="{hero.ArrowDownOnSquareStack}" size="16" class="mx-0 my-1" solid/>
          <span class="hidden lg:inline ml-2">Save v{dsCurrentSession.versionCount}</span>
        </button>
        <div class="ml-auto flex">
          <DocTitleBadge renameCallback={reqRenameDoc} switchVersionCallback={reqSwitchDocVersion} />
          <DocMenuBadge 
            revertCallback={reqRevertDoc} 
            resetPanesCallback={reqResetPanes} 
            forkCallback={reqForkDoc} 
            exportCallback={reqExportFile}
          />
        </div>
      </div>
      <ControlsAccordion monacoEditor={monacoEditor} />
    </div>

  </div>
</div>
<style>
  @import '$lib/styles/panes.css';
</style>
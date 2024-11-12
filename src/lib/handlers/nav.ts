// SPA Navigation
import { get } from 'svelte/store';
import { currentView, paneSizes } from '$lib/stores/app_state';
import * as panes from '$lib/panes';
import * as ds from '$lib/stores/doc_session'; 
import { Log } from '$lib';
import { canvasIsReady } from '$lib/stores';
import type { PaneSizes } from '$lib/panes';

export class NavHandler {
  constructor(options = {}) {
    const {
      layoutChangeCallback = (() => {}),
    } = options;
    this.layoutChangeCallback = layoutChangeCallback;
    this.view = get(currentView);
    this.session = get(ds.documentSession);
    this.paneSizes = get(paneSizes);
    this.isInitialSubscription = true;
    this.unsubscribeAll = [
      currentView.subscribe(view => {
        this.view = view;
        if (this.isInitialSubscription) {
          this.isInitialSubscription = false;
        } else {
          this.switchView();
        }
      }),
      ds.documentSession.subscribe(session => {
        this.session = session;
      }),
      paneSizes.subscribe(ps => {
        this.paneSizes = ps;
        if (this.view === 0) {
          ds.documentSession.update(session => {
            session.paneSizes = {...panes.resetPaneSizes(), ...ps ?? {}};
            return session;
          });
        }
      }),
    ];
  }
  
  dispose() { this.unsubscribeAll.forEach(unsub => unsub()); }

  switchViewEvent(event: CustomEvent) {
    currentView.set(event.detail.view);
  }

  // FIXME - redundant code below

  switchView() {
    // this.session.paneSizes.set({...resetPaneSizes(), ...session.paneSizes ?? {}});
    switch (this.view) {
      case 0:
        // paneSizes.set(session.paneSizes);
        paneSizes.set({...panes.resetPaneSizes(), ...this.session.paneSizes ?? {}});
        // canvasIsReady.set(false);
        // panes.returnContentToSplit(); 
        // panes.showView(this.view);
        // this.layoutChangeCallback();
        break;
      case 1:
        paneSizes.set({...panes.viewCodePaneSizes()});
        // canvasIsReady.set(false);
        // panes.returnContentToSplit(); 
        // panes.moveContent('ct1', 'cr-full'); 
        // panes.showView(this.view);
        // this.layoutChangeCallback();
        break;
      case 2:
        paneSizes.set({...panes.viewCanvasPaneSizes()});
        // canvasIsReady.set(false);
        // panes.returnContentToSplit(); 
        // panes.moveContent('ct2', 'cr-full'); 
        // panes.showView(this.view);
        // this.layoutChangeCallback();
        break;
      case 3:
        paneSizes.set({...panes.viewControlsPaneSizes()});
        // canvasIsReady.set(false);
        // panes.returnContentToSplit(); 
        // panes.moveContent('ct3', 'cr-full'); 
        // panes.showView(this.view);
        // this.layoutChangeCallback();
        break;
      default:
        Log.error('somehow tried to switch to nonexistent view...')
    }
  }
}
// Pane defaults
export type PaneSizes = {
  sizeLandscapePaneLeft: number;
  sizeLandscapePaneRight: number;
  sizeLandscapePaneTopRight: number;
  sizeLandscapePaneBottomRight: number;
  sizePortraitPaneTop: number;
  sizePortraitPaneMid: number;
  sizePortraitPaneBot: number;
};

export const resetPaneSizes = (): PaneSizes => {
  return {
    sizeLandscapePaneLeft:          65,
    sizeLandscapePaneRight:         35,
    sizeLandscapePaneTopRight:      40,
    sizeLandscapePaneBottomRight:   60,
    sizePortraitPaneTop:            65,
    sizePortraitPaneMid:            25,
    sizePortraitPaneBot:            10,
  }
};

export const viewCodePaneSizes = (): PaneSizes => {
  return {
    sizeLandscapePaneLeft:          100,
    sizeLandscapePaneRight:         0,
    sizeLandscapePaneTopRight:      50,
    sizeLandscapePaneBottomRight:   50,
    sizePortraitPaneTop:            100,
    sizePortraitPaneMid:            0,
    sizePortraitPaneBot:            0,
  }
};

export const viewCanvasPaneSizes = (): PaneSizes => {
  return {
    sizeLandscapePaneLeft:          0,
    sizeLandscapePaneRight:         100,
    sizeLandscapePaneTopRight:      100,
    sizeLandscapePaneBottomRight:   0,
    sizePortraitPaneTop:            0,
    sizePortraitPaneMid:            100,
    sizePortraitPaneBot:            0,
  }
};

export const viewControlsPaneSizes = (): PaneSizes => {
  return {
    sizeLandscapePaneLeft:          0,
    sizeLandscapePaneRight:         100,
    sizeLandscapePaneTopRight:      0,
    sizeLandscapePaneBottomRight:   100,
    sizePortraitPaneTop:            0,
    sizePortraitPaneMid:            0,
    sizePortraitPaneBot:            100,
  }
};

export const moveContent = (idContent:string, idContainer:string) => {
  const source = document.querySelector('#' + idContent);
  const dest = document.querySelector('#' + idContainer);
  // const tempContainer = document.createDocumentFragment();
  // tempContainer.appendChild(source); 
  dest.appendChild(source);
};

export const showStaging = () => {  
  const elStaging = document.querySelector('#cr-staging');
  elStaging.classList.remove("hidden");
};

export const hideStaging = () => {  
  const elStaging = document.querySelector('#cr-staging');
  elStaging.classList.add("hidden");
};

export const moveContentToStaging = () => {
  moveContent('ct1', 'cr-staging');
  moveContent('ct2', 'cr-staging');
  moveContent('ct3', 'cr-staging');
};

export const returnContentToSplit = () => {
  moveContent('ct1', 'cr-pane1');
  moveContent('ct2', 'cr-pane2');
  moveContent('ct3', 'cr-pane3');
};

export const showView = (currentView:number) => {
  if (currentView == 0) { // split pane
    document.querySelector('#cr-full').style.display = "none";
    document.querySelector('#cr-panes').style.display = "block";
  } else if (currentView > 0) {      
    document.querySelector('#cr-full').style.display = "block";
    document.querySelector('#cr-panes').style.display = "none";
  }
}
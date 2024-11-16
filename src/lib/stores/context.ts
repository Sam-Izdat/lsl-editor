import { writable } from 'svelte/store';
import { get } from 'svelte/store';

import { txContextValue, txContextReset } from '$lib/harbor';

let contextDefsFloat: Set<string> = new Set();
let contextDefsInt:   Set<string> = new Set();
let contextDefsBool:  Set<string> = new Set();
let contextDefsText:  Set<string> = new Set();

let activeContextVarNames:   Set<string> = new Set();

export const sendContextValueUpdate = (name, value) => {
  let canvasframe = document.querySelector("#canvasframe");
  let canvasframeWindow = canvasframe.contentWindow;
  txContextValue(canvasframeWindow, name, value);
};

export const sendContextReset = () => {  
  let canvasframe = document.querySelector("#canvasframe");
  let canvasframeWindow = canvasframe.contentWindow;
  txContextReset(canvasframeWindow);
}

interface FloatRequest {
  name:     string;
  def_val:  number;
  min_val:  number;
  max_val:  number;
  sort_idx: number;
};

interface IntRequest {
  name:     string;
  def_val:  number;
  min_val:  number;
  max_val:  number;
  sort_idx: number;
};

interface BoolRequest {
  name:     string;
  def_val:  boolean;
  sort_idx: number;
};

interface TextRequet {
  name:     string;
  text:     string;
  sort_idx: number;
};

export const contextVars    = writable<any[]>([]);
export const contextValues  = writable<any>({});
export const contextListen  = writable<bool>(false);
let contextVarsLen:number   = 0;

export const resetContext = () => {
  contextVarsLen = 0;
  contextDefsFloat.clear();
  contextDefsInt.clear();
  contextDefsBool.clear();
  contextDefsText.clear();
  activeContextVarNames.clear();
  contextValues.set({});
  contextVars.set([]);
  sendContextReset();
};

// All the silliness here is done in hope of limiting DOM fuckery and preventing reflow
export const handleContextUpdate = (e: CustomEvent) => {
  if (!get(contextListen)) return;
  if (!!contextDefsFloat.symmetricDifference(e.detail.contextDefsFloat).size) {
    let ctxDefsFloatArray: FloatRequest[] = Array.from(e.detail.contextDefsFloat).map((item) => JSON.parse(item));
    contextVars.update(items => {
      for (let i in ctxDefsFloatArray) {
        let idx = parseInt(ctxDefsFloatArray[i].sort_idx);
        if (
          items[idx] === undefined || 
          items[idx].name     != ctxDefsFloatArray[i].name || 
          items[idx].def_val  != ctxDefsFloatArray[i].def_val || 
          items[idx].min_val  != ctxDefsFloatArray[i].min_val || 
          items[idx].max_val  != ctxDefsFloatArray[i].max_val
        ) {          
          contextValues.update(vals => {
            if (vals[ctxDefsFloatArray[i].name] === undefined) {
              vals[ctxDefsFloatArray[i].name] = ctxDefsFloatArray[i].def_val;              
            }
            return vals;
          });
          activeContextVarNames.add(ctxDefsFloatArray[i].name); // idempotent
          items[idx] = ctxDefsFloatArray[i];
        }
      }
      return items;
    });
    contextDefsFloat = e.detail.contextDefsFloat;
  }

  if (!!contextDefsInt.symmetricDifference(e.detail.contextDefsInt).size) {
    let ctxDefsIntArray: IntRequest[] = Array.from(e.detail.contextDefsInt).map((item) => JSON.parse(item));
    contextVars.update(items => {
      for (let i in ctxDefsIntArray) {
        let idx = parseInt(ctxDefsIntArray[i].sort_idx);
        if (
          items[idx] === undefined || 
          items[idx].name     != ctxDefsIntArray[i].name || 
          items[idx].def_val  != ctxDefsIntArray[i].def_val || 
          items[idx].min_val  != ctxDefsIntArray[i].min_val || 
          items[idx].max_val  != ctxDefsIntArray[i].max_val
        ) {
          contextValues.update(vals => {
            if (vals[ctxDefsIntArray[i].name] === undefined) {
              vals[ctxDefsIntArray[i].name] = ctxDefsIntArray[i].def_val;
            }
            return vals;
          });
          activeContextVarNames.add(ctxDefsIntArray[i].name);
          items[idx] = ctxDefsIntArray[i];
        }
      }
      return items;
    });
    contextDefsInt = e.detail.contextDefsInt;
  }

  if (!!contextDefsBool.symmetricDifference(e.detail.contextDefsBool).size) {
    let ctxDefsBoolArray: BoolRequest[] = Array.from(e.detail.contextDefsBool).map((item) => JSON.parse(item));
    contextVars.update(items => {
      for (let i in ctxDefsBoolArray) {
        let idx = parseInt(ctxDefsBoolArray[i].sort_idx);
        if (
          items[idx] === undefined || 
          items[idx].name != ctxDefsBoolArray[i].name || 
          items[idx].def_val  != ctxDefsBoolArray[i].def_val
        ) {
          contextValues.update(vals => {
            if (vals[ctxDefsBoolArray[i].name] === undefined) {
              vals[ctxDefsBoolArray[i].name] = !!ctxDefsBoolArray[i].def_val;
            }
            return vals;
          });
          activeContextVarNames.add(ctxDefsBoolArray[i].name);
          items[idx] = ctxDefsBoolArray[i];
        }
      }
      return items;
    });
    contextDefsBool = e.detail.contextDefsBool;
  }

  if (!!contextDefsText.symmetricDifference(e.detail.contextDefsText).size) {
    let ctxDefsTextArray: TextRequest[] = Array.from(e.detail.contextDefsText).map((item) => JSON.parse(item));
    contextVars.update(items => {
      for (let i in ctxDefsTextArray) {
        let idx = parseInt(ctxDefsTextArray[i].sort_idx);
        if (
          items[idx] === undefined || 
          items[idx].text != ctxDefsTextArray[i].text
        ) {
          items[idx] = ctxDefsTextArray[i];
        }
      }
      return items;
    });    
    contextDefsText = e.detail.contextDefsText;
  }

  // Remove orphaned values from value map (any vars yeeted and not immediately replaced due to reordering)
  activeContextVarNames.difference(e.detail.activeContextVarNames).forEach((orphan) => {
    contextValues.update(vals => {
      delete vals[orphan];
      return vals;
    });
    activeContextVarNames.delete(orphan);
  });

  // Truncate vars array if necesssary
  contextVarsLen = contextDefsFloat.size + contextDefsInt.size + contextDefsBool.size + contextDefsText.size;
  if (get(contextVars).length != contextVarsLen){
    contextVars.update(items => {
      items.length = contextVarsLen;
      return items;
    });
  }
};
import * as keys from '$lib/keymap';

export const observeKeyboard = () => {
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    // CTRL + key or ALT + key for save (key should probably be 's' given browser ctrl+ restrictions)
    if (event.ctrlKey && event.key === keys.keySaveDoc) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-save-document'));
    }

    if (event.altKey && event.key === keys.keySaveDoc) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-save-document'));
    }

    // ALT + key for save as new version
    if (event.altKey && event.key === keys.keySaveDocNewVersion) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-save-document-new-version'));
    }

    // ALT + key for new (CTRL + N blocked by chrome)
    if (event.altKey && event.key === keys.keyNewDoc) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-new-document'));
    }

    // ALT + key for rename
    if (event.altKey && event.key === keys.keyRenameDoc) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-rename-document'));
    }

    // ALT + key for load / save / browse / publish shelf
    if (event.altKey && event.key === keys.keyArchive) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-archive-shelf'));
    }

    // ALT + key for load / save / browse / publish shelf
    if (event.altKey && event.key === keys.keyBuild) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-build-script'));
    }

    // ALT + key for play / pause animation
    if (event.altKey && event.key === keys.keyPlayPause) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-play-pause'));
    }

    // ALT + key for reset animation
    if (event.altKey && event.key === keys.keyResetProg) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('key-reset-prog'));
    }

    // Switch views with ALT + tilde, 1, 2, 3, etc keys
    if ((event.altKey && event.key) === keys.keyViewSplit   || 
        (event.altKey && event.key) === keys.keyViewCode    || 
        (event.altKey && event.key) === keys.keyViewCanvas  || 
        (event.altKey && event.key) === keys.keyViewControls) {
      const view = event.altKey && event.key === keys.keyViewSplit ? 0 : +event.key;
      window.dispatchEvent(new CustomEvent('key-switch-view', { detail: { view } }));
    }
  });
};
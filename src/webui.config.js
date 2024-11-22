// Note: __APP_NAME__, __APP_VERSION__ and __BUILD_TYPE__ are provided by vite config

// URL
export const APP_HOST_PATH = 'https://sam-izdat.github.io/lsl-editor/';
export const APP_BASE_PATH = '/lsl-editor';

export const cfg = {
  APP_HOST_PATH,
  APP_BASE_PATH,

  // GENERAL
  //------------------
  APP_TITLE:          'LegitSL Editor',
  APP_SHORT_NAME:     'LSL Editor',
  APP_DESCRIPTION:    'Web-based editor for LegitSL',  
  APP_THEME:          'hamlindigo', // skeleton UI theme

  // LOGGING
  //------------------
  LOG_LEVEL_DEV:      'DEBUG',
  LOG_LEVEL_PROD:     'ERROR',
  TRACE_LEVEL_DEV:    'ERROR',
  TRACE_LEVEL_PROD:   'CRITICAL',

  // PWA
  //------------------
  PWA_START_URL:      APP_HOST_PATH,
  PWA_SCOPE:          APP_HOST_PATH,
  PWA_FILE_EXT:       '.lsl',
  PWA_FILE_MIME_TYPE: 'application/x-legitsl',
  PWA_FILE_ACTION:    APP_HOST_PATH + 'open-file',
  PWA_URL_PATTERN:    'legitsl',      // See: https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler
  PWA_HANDLE_LINKS:   'auto',         // See: https://github.com/WICG/pwa-url-handler/blob/main/handle_links/explainer.md
  PWA_THEME_COLOR:    '#3b4762',      // theme color for app status/title bars etc
  PWA_BG_COLOR:       '#1E1E1E',      // splash screen background
  PWA_ORIENTATION:    'any',          // setting 'landscape' will force PWA into landscape mode at all times
  
  // MISC OPTIONS
  //------------------

  // IndexedDB database name
  IDB_DB_NAME:        'LSLEditorStorage',

  // IndexedDB store name for script/document sessions
  IDB_DOC_STORE_NAME: 'docsessions',

  // IndexedDB store name for archive screenshots/thumbnails
  IDB_THUMBNAIL_NAME: 'docthumbs',

  // LSL context broadcast frequency - times per second
  TX_CONTEXT_FREQ:    60,

  // LocalStorage prefix
  LS_PREFIX:          'lsl-script-',

  // the programming language syntax monaco editor should use
  EDITOR_LANGUAGE:    'c',

  // the name of the scripting language (ASCII/Latin alphabetic, no whitespace or punctuation)
  LANGUAGE_ALIAS:     'LegitSL',

  // attempt to guess at "raw" URLs if given an HTML page address to import
  GUESS_RAW_URL:      true,

  // start mobile clients in 'read-only' mode (prevent keyboard from popping up until user enables editing)
  MOBILE_READONLY:    true,

  // delay before auto-build fires in ms (so we're not spamming build requests with every keystroke)
  AUTOBUILD_DELAY:    500,

  // duration of flash on editor screen when build succeeds/fails in ms
  BUILD_FLASH_DUR:    180,

  // color to flash editor on build success (dark and light mode respectively)
  BUILD_COL_SUCCESS:  ['rgba(0, 255, 0, 0.1)', 'rgba(0, 255, 0, 0.5)'],

  // color to flash editor on build failure (dark and light mode respectively)
  BUILD_COL_FAILURE:  ['rgba(255, 0, 0, 0.1)', 'rgba(255, 0, 0, 0.5)'],
};
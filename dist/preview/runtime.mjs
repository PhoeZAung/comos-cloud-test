import { createFixtureStore } from './store.mjs';

// This entry point belongs to the developer preview bundle only.
// Future production code must use a separate entry point and server authorization.
// URL parameters, cookies, localStorage, and Owlbear identities never select a mode.
export function createPreviewContext() {
  return Object.freeze({
    mode: 'fixture',
    authenticatedUser: null,
    data: createFixtureStore(),
  });
}

// Future feature modules can import this page-local context. Nothing is global.
// Current placeholder pages do not render fixture records or expose edit controls.
export const preview = createPreviewContext();

import {
  createRoot as createRootImpl,
  // hydrateRoot as hydrateRootImpl,
  // isValidContainer,
} from './ReactDOMRoot.js';

function createRoot(container, options) {
  if (__DEV__) {
    if (!Internals.usingClientEntryPoint && !__UMD__) {
      console.error(
        'You are importing createRoot from "react-dom" which is not supported. ' +
          'You should instead import it from "react-dom/client".'
      );
    }
  }
  return createRootImpl(container, options);
}

export { createRoot };

import {
  createRoot as createRootImpl,
  // hydrateRoot as hydrateRootImpl,
  // __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Internals,
} from './index.js';

export function createRoot(container, options) {
  console.log('__DEV__:', __DEV__);
  if (__DEV__) {
    Internals.usingClientEntryPoint = true;
  }
  try {
    return createRootImpl(container, options);
  } finally {
    if (__DEV__) {
      Internals.usingClientEntryPoint = false;
    }
  }
}

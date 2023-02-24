import { enableCache } from '../../shared/ReactFeatureFlags';
const AbortControllerLocal = enableCache
  ? typeof AbortController !== 'undefined'
    ? AbortController
    : // $FlowFixMe[missing-this-annot]
      function AbortControllerShim() {
        const listeners = [];
        const signal = (this.signal = {
          aborted: false,
          addEventListener: (type, listener) => {
            listeners.push(listener);
          },
        });

        this.abort = () => {
          signal.aborted = true;
          listeners.forEach((listener) => listener());
        };
      }
  : null;
export function createCache() {
  if (!enableCache) {
    return null;
  }
  const cache = {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0,
  };

  return cache;
}

export function retainCache(cache) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (cache.controller.signal.aborted) {
      console.warn(
        'A cache instance was retained after it was already freed. ' +
          'This likely indicates a bug in React.'
      );
    }
  }
  cache.refCount++;
}

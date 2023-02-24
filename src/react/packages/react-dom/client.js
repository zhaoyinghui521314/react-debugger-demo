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

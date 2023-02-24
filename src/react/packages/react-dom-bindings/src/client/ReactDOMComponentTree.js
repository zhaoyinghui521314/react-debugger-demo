const randomKey = Math.random().toString(36).slice(2);
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
const internalResourceMarker = '__reactMarker$' + randomKey;
export function markContainerAsRoot(hostRoot, node) {
  // $FlowFixMe[prop-missing]
  node[internalContainerInstanceKey] = hostRoot;
}

export function isMarkedResource(node) {
  return !!node[internalResourceMarker];
}

export function isContainerMarkedAsRoot(node) {
  // $FlowFixMe[prop-missing]
  return !!node[internalContainerInstanceKey];
}

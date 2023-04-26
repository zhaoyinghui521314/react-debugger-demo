const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
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
export function getInstanceFromNode(node) {
  const inst = node[internalInstanceKey] || node[internalContainerInstanceKey];
  if (inst) {
    const tag = inst.tag;
    if (
      tag === HostComponent ||
      tag === HostText ||
      tag === SuspenseComponent ||
      (enableFloat ? tag === HostResource : false) ||
      (enableHostSingletons ? tag === HostSingleton : false) ||
      tag === HostRoot
    ) {
      return inst;
    } else {
      return null;
    }
  }
  return null;
}
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}

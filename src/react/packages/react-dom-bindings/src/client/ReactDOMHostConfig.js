import {
  // isEnabled as ReactBrowserEventEmitterIsEnabled,
  // setEnabled as ReactBrowserEventEmitterSetEnabled,
  getEventPriority,
} from '../events/ReactDOMEventListener';
import { createTextNode } from './ReactDOMComponent';
import setTextContent from './setTextContent';
import {
  precacheFiberNode,
  getInstanceFromNode as getInstanceFromNodeDOMTree,
} from './ReactDOMComponentTree';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';
import { getChildNamespace, SVG_NAMESPACE } from '../shared/DOMNamespaces';
import { DefaultEventPriority } from '../../../react-reconciler/src/ReactEventPriorities';
export const noTimeout = -1;
export const supportsHydration = true;
export function getCurrentEventPriority() {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}

export function getRootHostContext(rootContainerInstance) {
  let type;
  let namespace;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
      const root = rootContainerInstance.documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
      break;
    }
    default: {
      const container =
        nodeType === COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
      namespace = getChildNamespace(ownNamespace, type);
      break;
    }
  }
  // if (__DEV__) {
  //   const validatedTag = type.toLowerCase();
  //   const ancestorInfo = updatedAncestorInfoDev(null, validatedTag);
  //   return { namespace, ancestorInfo };
  // }
  return namespace;
}

export function getChildHostContext(parentHostContext, type) {
  // if (__DEV__) {
  //   const parentHostContextDev = parentHostContext;
  //   const namespace = getChildNamespace(parentHostContextDev.namespace, type);
  //   const ancestorInfo = updatedAncestorInfoDev(parentHostContextDev.ancestorInfo, type);
  //   return { namespace, ancestorInfo };
  // }
  const parentNamespace = parentHostContext;
  return getChildNamespace(parentNamespace, type);
}

export function createTextInstance(
  text,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) {
  const textNode = createTextNode(text, rootContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}
export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}
export function appendChildToContainer(container, child) {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = container.parentNode;
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
}

export function insertInContainerBefore(container, child, beforeChild) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}
export const supportsSingletons = true;
export function resetTextContent(domElement) {
  setTextContent(domElement, '');
}

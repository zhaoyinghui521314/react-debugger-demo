import { MutationMask, Placement } from './ReactFiberFlags';
import {
  supportsSingletons,
  // resetTextContent,
  appendChildToContainer,
  insertInContainerBefore,
} from './ReactFiberHostConfig';
import {
  FunctionComponent,
  ForwardRef,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostResource,
  HostSingleton,
  HostText,
  HostPortal,
  Profiler,
  SuspenseComponent,
  DehydratedFragment,
  IncompleteClassComponent,
  MemoComponent,
  SimpleMemoComponent,
  SuspenseListComponent,
  ScopeComponent,
  OffscreenComponent,
  LegacyHiddenComponent,
  CacheComponent,
  TracingMarkerComponent,
} from './ReactWorkTags';

export function commitMutationEffects(root, finishedWork, committedLanes) {
  commitMutationEffectsOnFiber(finishedWork, root, committedLanes);
}

function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
  switch (finishedWork.tag) {
    case 3: {
      // 先处理root节点的，再递归处理孩子的
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      // 最后处理自己的flags
      commitReconciliationEffects(finishedWork);
      return;
    }
    case 6: {
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      return;
    }
  }
}

function recursivelyTraverseMutationEffects(root, parentFiber, lanes) {
  // 先处理删除的
  // const deletions = parentFiber.deletions;
  // if (deletions !== null) {
  //   for (let i = 0; i < deletions.length; i++) {
  //     const childToDelete = deletions[i];
  //     try {
  //       commitDeletionEffects(root, parentFiber, childToDelete);
  //     } catch (error) {
  //       captureCommitPhaseError(childToDelete, parentFiber, error);
  //     }
  //   }
  // }
  if (parentFiber.subtreeFlags & MutationMask) {
    let child = parentFiber.child;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root, lanes);
      child = child.sibling;
    }
  }
}

function commitReconciliationEffects(finishedWork) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
}

function isHostParent(fiber) {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    (enableFloat && supportsResources ? fiber.tag === HostResource : false) ||
    (enableHostSingletons && supportsSingletons ? fiber.tag === HostSingleton : false) ||
    fiber.tag === HostPortal
  );
}

function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }

  throw new Error(
    'Expected to find a host parent. This error is likely caused by a bug ' +
      'in React. Please file an issue.'
  );
}
function getHostSibling(fiber) {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node = fiber;
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      // $FlowFixMe[incompatible-type] found when upgrading Flow
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      (!(enableHostSingletons && supportsSingletons) ? true : node.tag !== HostSingleton) &&
      node.tag !== DehydratedFragment
    ) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.flags & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      if (node.child === null || node.tag === HostPortal) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // Check if this host node is stable or about to be placed.
    if (!(node.flags & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}
// 真实处理了开始！
function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    // eslint-disable-next-line no-fallthrough
    // case HostComponent: {
    //   const parent = parentFiber.stateNode;
    //   if (parentFiber.flags & ContentReset) {
    //     // Reset the text content of the parent before doing any insertions
    //     resetTextContent(parent);
    //     // Clear ContentReset from the effect tag
    //     parentFiber.flags &= ~ContentReset;
    //   }

    //   const before = getHostSibling(finishedWork);
    //   // We only have the top Fiber that was inserted but we need to recurse down its
    //   // children to find all the terminal nodes.
    //   insertOrAppendPlacementNode(finishedWork, before, parent);
    //   break;
    // }
    case HostRoot:
    case HostPortal: {
      // 找到div#root
      const parent = parentFiber.stateNode.containerInfo;
      // 找到参考节点
      const before = getHostSibling(finishedWork);
      // 原生插入
      insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
      break;
    }
  }
}
function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      insertInContainerBefore(parent, stateNode, before);
    } else {
      appendChildToContainer(parent, stateNode);
    }
  }
}

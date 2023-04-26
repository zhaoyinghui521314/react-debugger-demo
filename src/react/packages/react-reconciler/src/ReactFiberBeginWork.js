import { updateContainer } from './ReactFiberReconciler';
import {
  HostRoot,
  HostComponent,
  HostText,
  ClassComponent,
  IndeterminateComponent,
  FunctionComponent,
} from './ReactWorkTags';
import { pushHostContainer } from './ReactFiberHostContext';
import { processUpdateQueue } from './ReactFiberClassUpdateQueue';
import { mountChildFibers, reconcileChildFibers, cloneChildFibers } from './ReactChildFiber.js';

export function beginWork(current, workInProgress, renderLanes) {
  console.log('beginWork:', current);
  switch (workInProgress.tag) {
    case HostRoot: {
      return updateHostRoot(current, workInProgress, renderLanes);
    }
    case HostComponent: {
      return updateHostCompoent(current, workInProgress, renderLanes);
    }
    case HostText: {
      return updateHostText(current, workInProgress, renderLanes);
    }
    case ClassComponent: {
    }
    // 函数组件 挂载阶段
    case IndeterminateComponent: {
    }
    // 函数组件 更新阶段
    case FunctionComponent: {
    }
  }
}

function pushHostRootContext(workInProgress) {
  const root = workInProgress.stateNode;
  if (root.pendingContext) {
    pushTopLevelContextObject(
      workInProgress,
      root.pendingContext,
      root.pendingContext !== root.context
    );
  } else if (root.context) {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }
  pushHostContainer(workInProgress, root.containerInfo);
}

export function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderLanes);
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
}

function updateHostRoot(current, workInProgress, renderLanes) {
  console.log('HostRoot:', current, workInProgress);
  pushHostRootContext(workInProgress);
  const nextProps = workInProgress.pendingProps;
  debugger;
  // 1. 处理更新队列
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);
  const nextState = workInProgress.memoizedState;
  console.log('nextState:', nextState); // element: {$$typeof: , children: []} 'hello zyh'
  // 2. 协调孩子
  const nextChildren = nextState.element;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  console.log('child:', workInProgress.child);

  return workInProgress.child;
}

function updateHostCompoent(current, workInProgress, renderLanes) {
  console.log('HostComponent:', current, workInProgress);
}

function updateHostText(current, workInProgress, renderLanes) {
  console.log('HostText:', current, workInProgress);
  return null;
}

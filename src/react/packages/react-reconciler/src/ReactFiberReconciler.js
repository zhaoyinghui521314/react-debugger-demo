import { createFiberRoot } from './ReactFiberRoot.js';
import { createUpdate, enqueueUpdate, entangleTransitions } from './ReactFiberClassUpdateQueue.js';
import { requestEventTime, requestUpdateLane, scheduleUpdateOnFiber } from './ReactFiberWorkLoop'; //

export function createContainer(
  containerInfo,
  tag,
  hydrationCallbacks,
  isStrictMode,
  concurrentUpdatesByDefaultOverride,
  identifierPrefix,
  onRecoverableError,
  transitionCallbacks
) {
  const hydrate = false;
  const initialChildren = null;
  return createFiberRoot(
    containerInfo,
    tag,
    hydrate,
    initialChildren,
    hydrationCallbacks,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
    identifierPrefix,
    onRecoverableError,
    transitionCallbacks
  );
}

export function updateContainer(element, container, parentComponent, callback) {
  if (__DEV__) {
    onScheduleRoot(container, element);
  }
  console.log('updateContainer!');
  // 1. 获取rootFiber节点
  const current = container.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);

  // if (enableSchedulingProfiler) {
  //   markRenderScheduled(lane);
  // }

  // const context = getContextForSubtree(parentComponent);
  // if (container.context === null) {
  //   container.context = context;
  // } else {
  //   container.pendingContext = context;
  // }

  // if (__DEV__) {
  //   if (
  //     ReactCurrentFiberIsRendering &&
  //     ReactCurrentFiberCurrent !== null &&
  //     !didWarnAboutNestedUpdates
  //   ) {
  //     didWarnAboutNestedUpdates = true;
  //     console.error(
  //       'Render methods should be a pure function of props and state; ' +
  //         'triggering nested component updates from render is not allowed. ' +
  //         'If necessary, trigger nested updates in componentDidUpdate.\n\n' +
  //         'Check the render method of %s.',
  //       getComponentNameFromFiber(ReactCurrentFiberCurrent) || 'Unknown'
  //     );
  //   }
  // }
  // 2. 创建更新 {}
  const update = createUpdate(eventTime, lane);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = { element };

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    if (__DEV__) {
      if (typeof callback !== 'function') {
        console.error(
          'render(...): Expected the last optional `callback` argument to be a ' +
            'function. Instead received: %s.',
          callback
        );
      }
    }
    update.callback = callback;
  }

  // 3. 更新入队，返回根节点
  const root = enqueueUpdate(current, update, lane);
  console.log('root return:', root);
  // 4. 开始调度【关键】
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane, eventTime);
    // entangleTransitions(root, current, lane);
  }

  return lane;
}

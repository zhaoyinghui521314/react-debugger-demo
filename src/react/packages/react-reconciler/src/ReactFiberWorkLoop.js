import {
  replayFailedUnitOfWorkWithInvokeGuardedCallback,
  enableCreateEventHandleAPI,
  enableProfilerTimer,
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableProfilerNestedUpdateScheduledHook,
  deferRenderPhaseUpdateToNextBatch,
  enableDebugTracing,
  enableSchedulingProfiler,
  disableSchedulerTimeoutInWorkLoop,
  skipUnmountedBoundaries,
  enableUpdaterTracking,
  enableCache,
  enableTransitionTracing,
  useModernStrictMode,
} from '../../shared/ReactFeatureFlags';
import {
  NoMode,
  ProfileMode,
  ConcurrentMode,
  StrictLegacyMode,
  StrictEffectsMode,
} from './ReactTypeOfMode';
import {
  NoLanes,
  NoLane,
  SyncLane,
  NoTimestamp,
  claimNextTransitionLane,
  claimNextRetryLane,
  includesSyncLane,
  isSubsetOfLanes,
  mergeLanes,
  removeLanes,
  pickArbitraryLane,
  includesNonIdleWork,
  includesOnlyRetries,
  includesOnlyTransitions,
  includesBlockingLane,
  includesExpiredLane,
  getNextLanes,
  markStarvedLanesAsExpired,
  getLanesToRetrySynchronouslyOnError,
  getMostRecentEventTime,
  markRootUpdated,
  markRootSuspended as markRootSuspended_dontCallThisOneDirectly,
  markRootPinged,
  markRootEntangled,
  markRootFinished,
  getHighestPriorityLane,
  addFiberToLanesMap,
  movePendingFibersToMemoized,
  addTransitionToLanesMap,
  getTransitionsForLanes,
} from './ReactFiberLane';
import {
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
  lowerEventPriority,
  lanesToEventPriority,
} from './ReactEventPriorities';
import {
  // Aliased because `act` will override and push to an internal queue
  scheduleCallback as Scheduler_scheduleCallback,
  // cancelCallback as Scheduler_cancelCallback,
  // shouldYield,
  // requestPaint,
  now,
  // ImmediatePriority as ImmediateSchedulerPriority,
  // UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  // IdlePriority as IdleSchedulerPriority,
} from './Scheduler';
import { requestCurrentTransition, NoTransition } from './ReactFiberTransition';
import {
  // resetAfterCommit,
  // scheduleTimeout,
  // cancelTimeout,
  // noTimeout,
  // afterActiveInstanceBlur,
  getCurrentEventPriority,
  // supportsMicrotasks,
  // errorHydratingContainer,
  // scheduleMicrotask,
  // prepareRendererToRender,
  // resetRendererAfterRender,
} from './ReactFiberHostConfig';
import { createWorkInProgress } from './ReactFiber.js';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

// const {
//   ReactCurrentDispatcher,
//   ReactCurrentCache,
//   ReactCurrentOwner,
//   ReactCurrentBatchConfig,
//   ReactCurrentActQueue,
// } = ReactSharedInternals;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

const RootInProgress = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootCompleted = 5;
const RootDidNotComplete = 6;

// Describes where we are in the React execution stack
let executionContext = NoContext;
// The root we're working on
let workInProgressRoot = null;
// The fiber we're working on
let workInProgress = null;
// The lanes we're rendering
let workInProgressRootRenderLanes = NoLanes;

const NotSuspended = 0;
const SuspendedOnError = 1;
const SuspendedOnData = 2;
const SuspendedOnImmediate = 3;
const SuspendedOnDeprecatedThrowPromise = 4;
const SuspendedAndReadyToUnwind = 5;
const SuspendedOnHydration = 6;

// When this is true, the work-in-progress fiber just suspended (or errored) and
// we've yet to unwind the stack. In some cases, we may yield to the main thread
// after this happens. If the fiber is pinged before we resume, we can retry
// immediately instead of unwinding the stack.
let workInProgressSuspendedReason = NotSuspended;
let workInProgressThrownValue = null;

// Whether a ping listener was attached during this render. This is slightly
// different that whether something suspended, because we don't add multiple
// listeners to a promise we've already seen (per root and lane).
let workInProgressRootDidAttachPingListener = false;

// A contextual version of workInProgressRootRenderLanes. It is a superset of
// the lanes that we started working on at the root. When we enter a subtree
// that is currently hidden, we add the lanes that would have committed if
// the hidden tree hadn't been deferred. This is modified by the
// HiddenContext module.
//
// Most things in the work loop should deal with workInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with renderLanes.
export let renderLanes = NoLanes;

// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus = RootInProgress;
// A fatal error, if one is thrown
let workInProgressRootFatalError = null;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootInterleavedUpdatedLanes = NoLanes;
// Lanes that were updated during the render phase (*not* an interleaved event).
let workInProgressRootRenderPhaseUpdatedLanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes = NoLanes;
// Errors that are thrown during the render phase.
let workInProgressRootConcurrentErrors = null;
// These are errors that we recovered from without surfacing them to the UI.
// We will log them once the tree commits.
let workInProgressRootRecoverableErrors = null;

// The most recent time we committed a fallback. This lets us ensure a train
// model where we don't commit new loading states in too quick succession.
let globalMostRecentFallbackTime = 0;
const FALLBACK_THROTTLE_MS = 500;

// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
let workInProgressRootRenderTargetTime = Infinity;
// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.
const RENDER_TIMEOUT_MS = 500;

let currentEventTime = NoTimestamp;
let currentEventTransitionLane = NoLanes;

let isRunningInsertionEffect = false;

let workInProgressTransitions = null;
export function getWorkInProgressTransitions() {
  return workInProgressTransitions;
}

let currentPendingTransitionCallbacks = null;
let currentEndTime = null;

export function isUnsafeClassRenderPhaseUpdate(fiber) {
  // Check if this is a render phase update. Only called by class components,
  // which special (deprecated) behavior for UNSAFE_componentWillReceive props.
  return (
    // TODO: Remove outdated deferRenderPhaseUpdateToNextBatch experiment. We
    // decided not to enable it.
    (!deferRenderPhaseUpdateToNextBatch || (fiber.mode & ConcurrentMode) === NoMode) &&
    (executionContext & RenderContext) !== NoContext
  );
}
export function getWorkInProgressRoot() {
  return workInProgressRoot;
}

export function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {
  if (__DEV__) {
    if ((executionContext & RenderContext) !== NoContext) {
      // We let the other warning about render phase updates deal with this one.
      return;
    }

    if (!(fiber.mode & ConcurrentMode)) {
      return;
    }

    const tag = fiber.tag;
    if (
      tag !== IndeterminateComponent &&
      tag !== HostRoot &&
      tag !== ClassComponent &&
      tag !== FunctionComponent &&
      tag !== ForwardRef &&
      tag !== MemoComponent &&
      tag !== SimpleMemoComponent
    ) {
      // Only warn for user-defined components, not internal ones like Suspense.
      return;
    }

    // We show the whole stack but dedupe on the top component's name because
    // the problematic code almost always lies inside that component.
    const componentName = getComponentNameFromFiber(fiber) || 'ReactComponent';
    if (didWarnStateUpdateForNotYetMountedComponent !== null) {
      if (didWarnStateUpdateForNotYetMountedComponent.has(componentName)) {
        return;
      }
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      didWarnStateUpdateForNotYetMountedComponent.add(componentName);
    } else {
      didWarnStateUpdateForNotYetMountedComponent = new Set([componentName]);
    }

    const previousFiber = ReactCurrentFiberCurrent;
    try {
      setCurrentDebugFiberInDEV(fiber);
      console.error(
        "Can't perform a React state update on a component that hasn't mounted yet. " +
          'This indicates that you have a side-effect in your render function that ' +
          'asynchronously later calls tries to update the component. Move this work to ' +
          'useEffect instead.'
      );
    } finally {
      if (previousFiber) {
        setCurrentDebugFiberInDEV(fiber);
      } else {
        resetCurrentDebugFiberInDEV();
      }
    }
  }
}
let nestedUpdateCount = 0;
const NESTED_UPDATE_LIMIT = 50;
export function throwIfInfiniteUpdateLoopDetected() {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    nestedPassiveUpdateCount = 0;
    rootWithNestedUpdates = null;
    rootWithPassiveNestedUpdates = null;

    throw new Error(
      'Maximum update depth exceeded. This can happen when a component ' +
        'repeatedly calls setState inside componentWillUpdate or ' +
        'componentDidUpdate. React limits the number of nested updates to ' +
        'prevent infinite loops.'
    );
  }

  if (__DEV__) {
    if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
      nestedPassiveUpdateCount = 0;
      rootWithPassiveNestedUpdates = null;

      console.error(
        'Maximum update depth exceeded. This can happen when a component ' +
          "calls setState inside useEffect, but useEffect either doesn't " +
          'have a dependency array, or one of the dependencies changes on ' +
          'every render.'
      );
    }
  }
}

export function getWorkInProgressRootRenderLanes() {
  return workInProgressRootRenderLanes;
}

export function markSkippedUpdateLanes(lane) {
  workInProgressRootSkippedLanes = mergeLanes(lane, workInProgressRootSkippedLanes);
}

export function requestEventTime() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // We're inside React, so it's fine to read the actual time.
    return now();
  }
  // We're not inside React, so we may be in the middle of a browser event.
  if (currentEventTime !== NoTimestamp) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime;
  }
  // This is the first update since React yielded. Compute a new start time.
  currentEventTime = now();
  return currentEventTime;
}

export function requestUpdateLane(fiber) {
  // Special cases
  const mode = fiber.mode;
  if ((mode & ConcurrentMode) === NoMode) {
    return SyncLane;
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
    // This is a render phase update. These are not officially supported. The
    // old behavior is to give this the same "thread" (lanes) as
    // whatever is currently rendering. So if you call `setState` on a component
    // that happens later in the same render, it will flush. Ideally, we want to
    // remove the special case and treat them as if they came from an
    // interleaved event. Regardless, this pattern is not officially supported.
    // This behavior is only a fallback. The flag only exists until we can roll
    // out the setState warning, since existing code might accidentally rely on
    // the current behavior.
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }

  const isTransition = requestCurrentTransition() !== NoTransition;
  if (isTransition) {
    if (__DEV__ && ReactCurrentBatchConfig.transition !== null) {
      const transition = ReactCurrentBatchConfig.transition;
      if (!transition._updatedFibers) {
        transition._updatedFibers = new Set();
      }

      transition._updatedFibers.add(fiber);
    }
    // The algorithm for assigning an update to a lane should be stable for all
    // updates at the same priority within the same event. To do this, the
    // inputs to the algorithm must be the same.
    //
    // The trick we use is to cache the first of each of these inputs within an
    // event. Then reset the cached values once we can be sure the event is
    // over. Our heuristic for that is whenever we enter a concurrent work loop.
    if (currentEventTransitionLane === NoLane) {
      // All transitions within the same event are assigned the same lane.
      currentEventTransitionLane = claimNextTransitionLane();
    }
    return currentEventTransitionLane;
  }

  // Updates originating inside certain React methods, like flushSync, have
  // their priority set by tracking it with a context variable.
  //
  // The opaque type returned by the host config is internally a lane, so we can
  // use that directly.
  // TODO: Move this type conversion to the event priority module.
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLane) {
    return updateLane;
  }

  // This update originated outside React. Ask the host environment for an
  // appropriate priority, based on the type of event.
  //
  // The opaque type returned by the host config is internally a lane, so we can
  // use that directly.
  // TODO: Move this type conversion to the event priority module.
  const eventLane = getCurrentEventPriority();
  return eventLane;
}

export function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
  // Mark that the root has a pending update.
  markRootUpdated(root, lane, eventTime);
  if (root === workInProgressRoot) {
  }
  ensureRootIsScheduled(root, eventTime);
}

function ensureRootIsScheduled(root, currentTime) {
  const existingCallbackNode = root.callbackNode;

  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  markStarvedLanesAsExpired(root, currentTime);

  // Determine the next lanes to work on, and their priority.
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }

  // We use the highest priority lane to represent the priority of the callback.
  const newCallbackPriority = getHighestPriorityLane(nextLanes);

  // Check if there's an existing task. We may be able to reuse it.
  const existingCallbackPriority = root.callbackPriority;

  if (existingCallbackNode != null) {
    // Cancel the existing callback. We'll schedule a new one below.
    cancelCallback(existingCallbackNode);
  }

  // Schedule a new callback.
  let newCallbackNode;
  if (includesSyncLane(newCallbackPriority)) {
    // Special case: Sync React callbacks are scheduled on a special
    // internal queue
    if (root.tag === LegacyRoot) {
      if (__DEV__ && ReactCurrentActQueue.isBatchingLegacy !== null) {
        ReactCurrentActQueue.didScheduleLegacyUpdate = true;
      }
      scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root));
    } else {
      scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    }
    if (supportsMicrotasks) {
      // Flush the queue in a microtask.
      if (__DEV__ && ReactCurrentActQueue.current !== null) {
        // Inside `act`, use our internal `act` queue so that these get flushed
        // at the end of the current scope even when using the sync version
        // of `act`.
        ReactCurrentActQueue.current.push(flushSyncCallbacks);
      } else {
        scheduleMicrotask(() => {
          // In Safari, appending an iframe forces microtasks to run.
          // https://github.com/facebook/react/issues/22459
          // We don't support running callbacks in the middle of render
          // or commit so we need to check against that.
          if ((executionContext & (RenderContext | CommitContext)) === NoContext) {
            // Note that this would still prematurely flush the callbacks
            // if this happens outside render or commit phase (e.g. in an event).
            flushSyncCallbacks();
          }
        });
      }
    } else {
      // Flush the queue in an Immediate task.
      scheduleCallback(ImmediateSchedulerPriority, flushSyncCallbacks);
    }
    newCallbackNode = null;
  } else {
    let schedulerPriorityLevel;
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    console.log('schedulerPriorityLevel:', schedulerPriorityLevel);
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}

function scheduleCallback(priorityLevel, callback) {
  return Scheduler_scheduleCallback(priorityLevel, callback);
}

function performConcurrentWorkOnRoot(root, didTimeout) {
  console.log('performConcurrentWorkOnRoot start!');
  let lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );
  if (lanes === NoLanes) {
    // Defensive coding. This is never expected to happen.
    return null;
  }
  const shouldTimeSlice = false;
  let exitStatus = renderRootSync(root, lanes);

  // root.finishedWork = finishedWork;
  // root.finishedLanes = lanes;
  // commitRoot
  finishConcurrentRender(root, exitStatus, lanes);
  // ensureRootIsScheduled(root, now());
  return null;
}

function workLoopSync() {
  // Perform work without checking if we need to yield between fiber.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  // The current, flushed, state of this fiber is the alternate. Ideally
  // nothing should rely on this, but relying on it here means that we don't
  // need an additional field on the work in progress.
  const current = unitOfWork.alternate; // 老的fiber
  let next;
  console.log('next!');
  next = beginWork(current, unitOfWork, renderLanes);

  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    // 工作完成
    console.log('completeUnitOfWork!');
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.
  let completedWork = unitOfWork;
  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    const next = completeWork(current, completedWork, renderLanes);
    // 自己完成了看弟弟有无完成
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      workInProgress = siblingFiber;
      return;
    }
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null); // 到根节点就结束了

  // We've reached the root.
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

function renderRootSync(root, lanes) {
  // 1. 准备新的栈，根据老的fiber来创建新的fiber
  prepareFreshStack(root, lanes);
  // 2. 工作循环
  workLoopSync();

  return workInProgressRootExitStatus;
}

function prepareFreshStack(root, lanes) {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  // const timeoutHandle = root.timeoutHandle;
  // if (timeoutHandle !== noTimeout) {
  //   // The root previous suspended and scheduled a timeout to commit a fallback
  //   // state. Now that we have additional work, cancel the timeout.
  //   root.timeoutHandle = noTimeout;
  //   // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above
  //   cancelTimeout(timeoutHandle);
  // }

  // resetWorkInProgressStack();
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  workInProgressRootRenderLanes = renderLanes = lanes;
  workInProgressSuspendedReason = NotSuspended;
  workInProgressThrownValue = null;
  workInProgressRootDidAttachPingListener = false;
  workInProgressRootExitStatus = RootInProgress;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootInterleavedUpdatedLanes = NoLanes;
  workInProgressRootRenderPhaseUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
  workInProgressRootConcurrentErrors = null;
  workInProgressRootRecoverableErrors = null;

  // finishQueueingConcurrentUpdates();

  return rootWorkInProgress;
}

function finishConcurrentRender(root, exitStatus, lanes) {
  // 根据结束的状态，这里先正常结束
  commitRoot(root, workInProgressRootRecoverableErrors, workInProgressTransitions);
}
function commitRoot(root, recoverableErrors, transitions) {
  // TODO: This no longer makes any sense. We already wrap the mutation and
  // layout phases. Should be able to remove.
  // const previousUpdateLanePriority = getCurrentUpdatePriority();
  // const prevTransition = ReactCurrentBatchConfig.transition;

  // try {
  //   ReactCurrentBatchConfig.transition = null;
  //   setCurrentUpdatePriority(DiscreteEventPriority);
  //   commitRootImpl(root, recoverableErrors, transitions, previousUpdateLanePriority);
  // } finally {
  //   ReactCurrentBatchConfig.transition = prevTransition;
  //   setCurrentUpdatePriority(previousUpdateLanePriority);
  // }
  commitRootImpl(root);
  // return null;
}

function commitRootImpl(root) {
  console.log('commitRoot:', root);
}

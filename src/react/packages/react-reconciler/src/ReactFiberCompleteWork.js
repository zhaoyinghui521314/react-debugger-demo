import { NoFlags } from './ReactFiberFlags';
import { createTextInstance } from './ReactFiberHostConfig';
import { getRootHostContainer, getHostContext } from './ReactFiberHostContext';

let updateHostContainer = (current, workInProgress) => {};

export function completeWork(current, workInProgress, renderLanes) {
  const newProps = workInProgress.pendingProps;
  // 还是判断tag: beginWork开始自上而下，completeWork完成自下而上
  switch (workInProgress.tag) {
    case 3: {
      const fiberRoot = workInProgress.stateNode;
      updateHostContainer(current, workInProgress);
      bubbleProperties(workInProgress);
      return null;
    }
    case 6: {
      const newText = newProps;
      const rootContainerInstance = getRootHostContainer();
      const currentHostContext = getHostContext();
      // 创建真实的dom节点
      workInProgress.stateNode = createTextInstance(
        newText,
        rootContainerInstance,
        currentHostContext,
        workInProgress
      );
      bubbleProperties(workInProgress);
      return null;
    }
  }
}

// 收集孩子的Flags
function bubbleProperties(completedWork) {
  let child = completedWork.child;
  let subtreeFlags = NoFlags;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child.return = completedWork;
    child = child.sibling;
  }
  completedWork.subtreeFlags |= subtreeFlags;
  // return didBailout;
}

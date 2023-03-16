import { HostRoot, HostComponent, HostText } from './ReactWorkTags';

export function beginWork(current, workInProgress, renderLanes) {
  console.log('beginWork:', current);
  switch (workInProgress.tag) {
    case HostRoot: {
      console.log('HostRoot:', current, workInProgress);
    }
    case HostComponent: {
      console.log('HostComponent:', current, workInProgress);
    }
    case HostText: {
      console.log('HostText:', current, workInProgress);
    }
  }
  return null;
}

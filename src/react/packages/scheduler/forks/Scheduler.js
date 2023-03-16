import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from './SchedulerPriorities';

const localDate = Date;
const initialTime = localDate.now();
let getCurrentTime = () => localDate.now() - initialTime;

function unstable_scheduleCallback(priority, callback, options) {
  requestIdleCallback(callback);
}

export {
  getCurrentTime as unstable_now,
  unstable_scheduleCallback,
  NormalPriority as unstable_NormalPriority,
};

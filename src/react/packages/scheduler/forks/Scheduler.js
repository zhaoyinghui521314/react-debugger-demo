const localDate = Date;
const initialTime = localDate.now();
let getCurrentTime = () => localDate.now() - initialTime;

export { getCurrentTime as unstable_now };

import "rxjs/add/operator/mergeAll";
import { Observable } from "rxjs/Observable";
import { from } from "rxjs/observable/from";
import { IpcMark } from "./common/types";

const ipcMonitor: Observable<IpcMark> = from(
  process?.type === "renderer"
    ? import("./renderer").then((module) => module.default)
    : import("./main").then((module) => module.default)
).mergeAll();

export { IpcMark, IpcMonitor, IpcMetric } from "./common/types";
export default ipcMonitor;

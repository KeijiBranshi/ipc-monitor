import { Observable } from "rxjs/Observable";
import { IpcMark } from "./common/types";

import mainProcessMonitor from "./main";
import ipcRendererMonitor from "./renderer";

const ipcMonitor: Observable<IpcMark> =
  process?.type === "renderer" ? ipcRendererMonitor : mainProcessMonitor;

export { IpcMark, IpcMonitor, IpcMetric } from "./common/types";
export default ipcMonitor;

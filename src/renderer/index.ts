import { IpcMonitor } from "../common/types";
import onNewWebviews from "./dom-observables";
import createIpcRendererMonitor from "./monitor-ipc-renderer";
import createWebviewsMonitor from "./monitor-webviews";
import "rxjs/add/operator/share";

const ipcRendererMonitor: IpcMonitor = createIpcRendererMonitor().share();
const webviewMonitor: IpcMonitor = onNewWebviews()
  .mergeMap(createWebviewsMonitor)
  .share();

/** Export Constructors */
export { createIpcRendererMonitor, createWebviewsMonitor, webviewMonitor };

/** Export standalone monitor */
export default ipcRendererMonitor;

import { merge } from "rxjs/observable/merge";
import { IpcMonitor } from "../common/types";
import onNewWebviews from "./dom-observables";
import createIpcRendererMonitor from "./monitor-ipc-renderer";
import createWebviewsMonitor from "./monitor-webviews";

import "rxjs/add/operator/share";
import "rxjs/add/operator/mergeMap";

const ipcRendererMonitor: IpcMonitor = createIpcRendererMonitor().share();
const webviewsMonitor: IpcMonitor = onNewWebviews()
  .mergeMap(createWebviewsMonitor)
  .share();

const rendererProcessMonitor: IpcMonitor = merge(
  ipcRendererMonitor,
  webviewsMonitor
);

/** Export Constructors */
export { createIpcRendererMonitor, createWebviewsMonitor };

export { ipcRendererMonitor, webviewsMonitor };

/** Export standalone monitor */
export default rendererProcessMonitor;

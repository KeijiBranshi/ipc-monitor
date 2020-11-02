import { merge } from "rxjs/observable/merge";
import { IpcMonitor } from "../common/types";
import createIpcRendererMonitor from "./create-ipcrenderer-monitor";
import createWebviewMonitor from "./create-webview-monitor";
import onAllWebviews from "./on-all-webviews";

import "rxjs/add/operator/share";
import "rxjs/add/operator/mergeMap";

const ipcRendererMonitor: IpcMonitor = createIpcRendererMonitor().share();
const webviewsMonitor: IpcMonitor = onAllWebviews()
  .mergeMap(createWebviewMonitor)
  .share();

const rendererProcessIpcMonitor: IpcMonitor = merge(
  ipcRendererMonitor,
  webviewsMonitor
);

/** Export Constructors */
export { createIpcRendererMonitor, createWebviewMonitor };

export { ipcRendererMonitor, webviewsMonitor };

/**
 * An Observable that, on subscription, monitors ipc activity from
 * Electron's [ipcRenderer](https://www.electronjs.org/docs/api/ipc-renderer#ipcrenderersendchannel-args) module and [`<webview/>`](https://www.electronjs.org/docs/api/webview-tag?q=WebviewTag#event-ipc-message) html elements.
 */
export default rendererProcessIpcMonitor;

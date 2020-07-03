import { ipcMain as ipc } from "electron";
import { merge } from "rxjs/observable/merge";
import { _throw as throwError } from "rxjs/observable/throw";
import onAllWebContents from "./on-all-webcontents";
import createIpcMainMonitor from "main/monitor-ipc-main";
import createProxyMonitor from "main/monitor-ipc-renderer-proxy";
import createWebContentsMonitor from "main/monitor-web-contents";

const ipcMainMonitor =
  process && ipc
    ? createIpcMainMonitor().share()
    : throwError("IpcMain does not exist in this process");
const webContentsMonitor = onAllWebContents(createWebContentsMonitor).share();
const proxyMonitor = onAllWebContents(createProxyMonitor).share();

/** Aggregate Monitors */
const mainProcessMonitor = merge(ipcMainMonitor, webContentsMonitor);
const globalMonitor = merge(mainProcessMonitor, proxyMonitor);

/** Export Constructors */
export { createIpcMainMonitor, createProxyMonitor, createWebContentsMonitor };

/** Export singletons */
export { ipcMainMonitor, webContentsMonitor, proxyMonitor, globalMonitor };

/** Default to Main Process Monitor */
export default mainProcessMonitor;

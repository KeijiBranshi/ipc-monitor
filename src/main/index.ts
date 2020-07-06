import { merge } from "rxjs/observable/merge";
import onAllWebContents from "./on-all-webcontents";
import { IpcMonitor } from "common/types";
import createIpcMainMonitor from "main/monitor-ipc-main";
import createWebContentsMonitor from "main/monitor-web-contents";

const ipcMainMonitor: IpcMonitor = createIpcMainMonitor().share();
const webContentsMonitor: IpcMonitor = onAllWebContents(
  createWebContentsMonitor
).share();

/** Aggregate Monitors */
const mainProcessMonitor: IpcMonitor = merge(
  ipcMainMonitor,
  webContentsMonitor
);

/** Export Constructors */
export { createIpcMainMonitor, createWebContentsMonitor };

/** Export singletons */
export { ipcMainMonitor, webContentsMonitor };

/** Default to Main Process Monitor */
export default mainProcessMonitor;

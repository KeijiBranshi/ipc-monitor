import { merge } from "rxjs/observable/merge";
import onAllWebContents from "./on-all-webcontents";
import createIpcMainMonitor from "main/monitor-ipc-main";
import createWebContentsMonitor from "main/monitor-web-contents";

const ipcMainMonitor = createIpcMainMonitor().share();
const webContentsMonitor = onAllWebContents(createWebContentsMonitor).share();

/** Aggregate Monitors */
const mainProcessMonitor = merge(ipcMainMonitor, webContentsMonitor);

/** Export Constructors */
export { createIpcMainMonitor, createWebContentsMonitor };

/** Export singletons */
export { ipcMainMonitor, webContentsMonitor };

/** Default to Main Process Monitor */
export default mainProcessMonitor;

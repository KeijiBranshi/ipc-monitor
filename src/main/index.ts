import { merge } from "rxjs/observable/merge";
import onAllWebContents from "./on-all-webcontents";
import createGlobalIpcMonitor from "main/monitor-global";
import createIpcMainMonitor from "main/monitor-ipc-main";
import createProxyMonitor from "main/monitor-ipc-renderer-proxy";
import createWebContentsMonitor from "main/monitor-web-contents";

export {
  createIpcMainMonitor,
  createProxyMonitor,
  createWebContentsMonitor,
  createGlobalIpcMonitor,
};

const ipcMainMonitor = createIpcMainMonitor();
const webContentsMonitor = onAllWebContents(createWebContentsMonitor);
const proxyMonitor = onAllWebContents(createProxyMonitor);

export { ipcMainMonitor, webContentsMonitor, proxyMonitor };
export default merge(ipcMainMonitor, webContentsMonitor);

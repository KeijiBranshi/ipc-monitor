import createGlobalIpcMonitor from "main/monitor-global";
import createIpcMainMonitor from "main/monitor-ipc-main";
import createProxyMonitor from "main/monitor-ipc-renderer-proxy";
import getMainProcessMonitor from "main/monitor-main-process";
import createWebContentsMonitor from "main/monitor-web-contents";

export {
  createIpcMainMonitor,
  createProxyMonitor,
  createWebContentsMonitor,
  createGlobalIpcMonitor,
};
export default getMainProcessMonitor;

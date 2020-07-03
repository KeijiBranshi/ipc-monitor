import { ipcRenderer as ipc } from "electron";
import { proxify as createProxify } from "rx-ipc";
import { v4 as uuid } from "uuid";
import createIpcRendererMonitor from "renderer/ipc-renderer-monitor";

export { createIpcRendererMonitor };
const channel = "ipc-monitor-proxy";
const proxify = createProxify({ ipc, uuid, channel });

const ipcRendererMonitor = createIpcRendererMonitor().share();
const proxifiedMonitor = proxify(ipcRendererMonitor);

export { proxifiedMonitor };
export default ipcRendererMonitor;

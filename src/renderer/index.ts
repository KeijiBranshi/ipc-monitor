import { ipcRenderer as ipc } from "electron";
import { proxify as createProxify } from "rx-ipc";
import { _throw as throwError } from "rxjs/observable/throw";
import { v4 as uuid } from "uuid";
import { IPC_PROXY_CHANNEL } from "common/constants";
import createIpcRendererMonitor from "renderer/ipc-renderer-monitor";

const channel = IPC_PROXY_CHANNEL;
const proxify = createProxify({ ipc, uuid, channel });

const ipcRendererMonitor =
  process.type === "renderer" && ipc
    ? createIpcRendererMonitor().share()
    : throwError(new Error("No ipcRenderer exists in this process"));

const proxifiedMonitor = proxify(ipcRendererMonitor);

/** Export Constructors */
export { createIpcRendererMonitor };

/** Export singleton */
export { proxifiedMonitor };

/** Export standalone (non-proxied) monitor */
export default ipcRendererMonitor;

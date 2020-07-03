import { proxify } from "rx-ipc";
import createIpcRendererMonitor from "renderer/ipc-renderer-monitor";

export { createIpcRendererMonitor };

const ipcRendererMonitor = createIpcRendererMonitor();
const proxifiedIpcRendererMonitor = proxify();
export default ipcRendererMonitor;
